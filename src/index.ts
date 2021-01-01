import IDataStore from "./types/IDataStore";

class DataStore implements IDataStore {
  private filePath: string = "";
  private fs = require("fs");
  private path = require("path");
  private static fileState = new Map<string, boolean>();
  private static keyTTL = new Map<string, Map<string, [Date, number]>>();

  createFile = (filePath?: string) => {
    this.filePath = filePath
      ? this.path.resolve(filePath)
      : this.path.join(__dirname, "datastore.json");
    return new Promise<boolean>((resolve, reject) => {
      if (this.path.extname(this.filePath) !== ".json") {
        this.filePath = "";
        return reject("File should be of type JSON");
      }
      if (DataStore.fileState.has(this.filePath)) return resolve(true);
      this.fs.writeFile(this.filePath, "{}", (err: any) => {
        if (err) {
          this.filePath = "";
          return reject(err);
        }
        DataStore.fileState.set(this.filePath, false);
        DataStore.keyTTL.set(this.filePath, new Map<string, [Date, number]>());
        return resolve(true);
      });
    });
  };

  addValue = (key: string, value: Object, ttl?: number) => {
    return new Promise<boolean>((resolve, reject) => {
      if (this.filePath === "") return reject("File has not been initialized");
      if (DataStore.fileState.get(this.filePath)) {
        return reject("File is in use");
      }
      DataStore.fileState.set(this.filePath, true);
      const size = Buffer.byteLength(JSON.stringify(value));
      if (key.length > 32) {
        DataStore.fileState.set(this.filePath, false);
        return reject("Key cannot be greater than 32 characters");
      }
      if (size / 1024 > 16) {
        DataStore.fileState.set(this.filePath, false);
        return reject("Value cannot be greater than 16kb");
      }
      this.getFileData()
        .then((data: string) => {
          const jsonData = JSON.parse(data);
          if (key in jsonData) {
            DataStore.fileState.set(this.filePath, false);
            return reject("Key already exists");
          }
          jsonData[key] = value;
          const jsonSize = Buffer.byteLength(JSON.stringify(jsonData));
          if (jsonSize / 1073741824 > 1) {
            DataStore.fileState.set(this.filePath, false);
            return reject("File size is greater than 1gb");
          }
          this.fs.writeFile(
            this.filePath,
            JSON.stringify(jsonData),
            (err: any) => {
              if (err) {
                DataStore.fileState.set(this.filePath, false);
                return reject(err);
              }
              let newKeyTTL = DataStore.keyTTL.get(this.filePath);
              if (newKeyTTL) {
                if (ttl !== undefined) newKeyTTL.set(key, [new Date(), ttl]);
                else newKeyTTL.set(key, [new Date(), -1]);
                DataStore.keyTTL.set(this.filePath, newKeyTTL);
              }
              DataStore.fileState.set(this.filePath, false);
              return resolve(true);
            }
          );
        })
        .catch((err) => {
          DataStore.fileState.set(this.filePath, false);
          return reject(err);
        });
    });
  };

  getFilePath = () => {
    return this.filePath;
  };

  getFileData = () => {
    return new Promise<string>((resolve, reject) => {
      if (this.filePath === "") return reject("File has not been initialized");
      this.fs.readFile(this.filePath, (err: any, data: string) => {
        if (err && err.code === "ENOENT") {
          return reject("File doesn't exist");
        } else if (err) {
          return reject(err);
        } else {
          return resolve(data);
        }
      });
    });
  };

  getValue = (key: string) => {
    return new Promise<Object>((resolve, reject) => {
      if (this.filePath === "") return reject("File has not been initialized");
      if (DataStore.fileState.get(this.filePath))
        return reject("File is in use");
      DataStore.fileState.set(this.filePath, true);
      if (key.length > 32) {
        DataStore.fileState.set(this.filePath, false);
        return reject("Key cannot be greater than 32 characters");
      }
      this.getFileData().then((data: string) => {
        const jsonData = JSON.parse(data);
        if (key in jsonData === false) {
          DataStore.fileState.set(this.filePath, false);
          return reject("Key doesn't exist");
        }
        DataStore.fileState.set(this.filePath, false);
        let newKeyTTL = DataStore.keyTTL.get(this.filePath);
        if (newKeyTTL) {
          let ttlValue = newKeyTTL.get(key);
          if (ttlValue) {
            const [creationTime, ttl] = ttlValue;
            if (ttl !== -1) {
              const timeNow = new Date();
              const seconds = Math.floor(
                timeNow.getTime() - creationTime.getTime() / 1000
              );
              if (seconds > ttl) {
                return reject("The provided key has expired");
              }
            }
          }
        }
        return resolve(jsonData[key]);
      });
    });
  };

  deleteValue = (key: string) => {
    return new Promise<boolean>((resolve, reject) => {
      if (this.filePath === "") return reject("File has not been initialized");
      if (DataStore.fileState.get(this.filePath))
        return reject("File is in use");
      DataStore.fileState.set(this.filePath, true);
      if (key.length > 32) {
        DataStore.fileState.set(this.filePath, false);
        return reject("Key cannot be greater than 32 characters");
      }
      this.getFileData().then((data: string) => {
        const jsonData = JSON.parse(data);
        if (key in jsonData === false) {
          DataStore.fileState.set(this.filePath, false);
          return reject("Key doesn't exist");
        }
        let newKeyTTL = DataStore.keyTTL.get(this.filePath);
        if (newKeyTTL) {
          let ttlValue = newKeyTTL.get(key);
          if (ttlValue) {
            const [creationTime, ttl] = ttlValue;
            if (ttl !== -1) {
              const timeNow = new Date();
              const seconds = Math.floor(
                timeNow.getTime() - creationTime.getTime() / 1000
              );
              if (seconds > ttl) {
                newKeyTTL.delete(key);
                DataStore.keyTTL.set(this.filePath, newKeyTTL);
                DataStore.fileState.set(this.filePath, false);
                return reject("The provided key has expired");
              }
            }
            newKeyTTL.delete(key);
            DataStore.keyTTL.set(this.filePath, newKeyTTL);
          }
        }
        delete jsonData[key];
        this.fs.writeFile(
          this.filePath,
          JSON.stringify(jsonData),
          (err: any) => {
            if (err) {
              DataStore.fileState.set(this.filePath, false);
              return reject(err);
            }
            DataStore.fileState.set(this.filePath, false);
            return resolve(true);
          }
        );
      });
    });
  };

  deleteFile = () => {
    return new Promise<boolean>((resovle, reject) => {
      if (this.filePath === "") return reject("File has not been initialized");
      if (DataStore.fileState.get(this.filePath)) {
        return reject("File is in use");
      }
      DataStore.fileState.set(this.filePath, true);
      this.fs.unlink(this.getFilePath(), (err: any) => {
        if (err) {
          DataStore.fileState.set(this.filePath, false);
          return reject(err);
        }
        DataStore.fileState.delete(this.filePath);
        this.filePath = "";
        return resovle(true);
      });
    });
  };
}

export default DataStore;

import IDataStore from "./types/IDataStore";

class DataStore implements IDataStore {
  private filePath: string = "";
  private fs = require("fs");
  private path = require("path");
  static fileState = new Map<string, boolean>();

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
        return resolve(true);
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

  addValue = (key: string, value: Object) => {
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
}

export default DataStore;

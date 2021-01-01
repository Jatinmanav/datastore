import IDataStore from "./types/IDataStore";

class DataStore implements IDataStore {
  private filePath: string = "";
  private fs = require("fs");
  private path = require("path");

  createFile = (filePath?: string) => {
    this.filePath = filePath
      ? this.path.resolve(filePath)
      : this.path.join(__dirname, "datastore.json");
    return new Promise<boolean>((resolve, reject) => {
      this.fs.writeFile(this.filePath, "{}", (err: any) => {
        if (err) return reject(err);
        resolve(true);
      });
    });
  };

  deleteFile = () => {
    return new Promise<boolean>((resovle, reject) => {
      if (this.filePath === "") return reject("File has not been initialized");
      this.fs.unlink(this.getFilePath(), (err: any) => {
        if (err) return reject(err);
        resovle(true);
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
          resolve(data);
        }
      });
    });
  };

  addValue = (key: string, value: Object) => {
    return new Promise<boolean>((resolve, reject) => {
      if (this.filePath === "") return reject("File has not been initialized");
      const size = Buffer.byteLength(JSON.stringify(value));
      if (key.length > 32)
        return reject("Key cannot be greater than 32 characters");
      if (size / 1024 > 16) return reject("Value cannot be greater than 16kb");
      this.getFileData()
        .then((data: string) => {
          const jsonData = JSON.parse(data);
          if (key in jsonData) return reject("Key already exists");
          jsonData[key] = value;
          const jsonSize = Buffer.byteLength(JSON.stringify(jsonData));
          if (jsonSize / 1073741824 > 1)
            return reject("File size is greater than 1gb");
          this.fs.writeFile(
            this.filePath,
            JSON.stringify(jsonData),
            (err: any) => {
              if (err) return reject(err);
              resolve(true);
            }
          );
        })
        .catch((err) => reject(err));
    });
  };

  getValue = (key: string) => {
    return new Promise<Object>((resolve, reject) => {
      if (this.filePath === "") return reject("File has not been initialized");
      if (key.length > 32)
        return reject("Key cannot be greater than 32 characters");
      this.getFileData().then((data: string) => {
        const jsonData = JSON.parse(data);
        if (key in jsonData === false) return reject("Key doesn't exist");
        resolve(jsonData[key]);
      });
    });
  };

  deleteValue = (key: string) => {
    return new Promise<boolean>((resolve, reject) => {
      if (this.filePath === "") return reject("File has not been initialized");
      if (key.length > 32)
        return reject("Key cannot be greater than 32 characters");
      this.getFileData().then((data: string) => {
        const jsonData = JSON.parse(data);
        if (key in jsonData === false) return reject("Key doesn't exist");
        delete jsonData[key];
        this.fs.writeFile(
          this.filePath,
          JSON.stringify(jsonData),
          (err: any) => {
            if (err) return reject(err);
            resolve(true);
          }
        );
      });
    });
  };
}

export default DataStore;

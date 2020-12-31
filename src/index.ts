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
      this.fs.writeFile(this.filePath, "{}", (err: Error) => {
        if (err) return reject(err);
        resolve(true);
      });
    });
  };

  deleteFile = () => {
    return new Promise<boolean>((resovle, reject) =>
      this.fs.unlink(this.getFilePath(), (err: any) => {
        if (err) return reject(err);
        resovle(true);
      })
    );
  };

  getFilePath = () => {
    return this.filePath;
  };

  getFileData = () => {
    if (this.filePath === "") throw new Error("File not Created");
    return new Promise<string>((resolve, reject) => {
      this.fs.readFile(this.filePath, (err: any, data: string) => {
        if (err && err.code === "ENOENT") {
          return reject("File not Present");
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
      this.getFileData()
        .then((data: string) => {
          const jsonData = JSON.parse(data);
          if (key in jsonData) return reject("Key already exists");
          jsonData[key] = value;
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
      this.getFileData().then((data: string) => {
        const jsonData = JSON.parse(data);
        if (key in jsonData === false) return reject("Key doesn't exist");
        resolve(jsonData[key]);
      });
    });
  };

  deleteValue = (key: string) => {
    return new Promise<boolean>((resolve, reject) => {
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

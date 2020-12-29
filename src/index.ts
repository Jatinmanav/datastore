import IDataStore from "./types/IDataStore";

class DataStore implements IDataStore {
  private filePath: string;
  private fs = require("fs");
  private path = require("path");

  constructor(filePath?: string) {
    this.filePath = filePath
      ? this.path.resolve(filePath)
      : this.path.join(__dirname, "datastore.json");
  }

  createFile = () => {
    return new Promise<boolean>((resolve, reject) => {
      this.fs.writeFile(this.filePath, "{}", (err: Error) => {
        if (err) reject(err);
        resolve(true);
      });
    });
  };

  getFilePath = () => {
    return this.filePath;
  };

  getFileData = () => {
    return new Promise<Buffer>((resolve, reject) => {
      this.fs.readFile(this.filePath, (err: any, data: Buffer) => {
        if (err && err.code === "ENOENT") {
          reject("File not Present");
        } else {
          resolve(data);
        }
      });
    });
  };
}

export default DataStore;

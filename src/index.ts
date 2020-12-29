class DataStore {
  private filePath: string;
  private fs = require("fs");
  private path = require("path");

  constructor(filePath?: string) {
    this.filePath = filePath
      ? this.path.resolve(filePath)
      : this.path.join(__dirname, "datastore.json");
  }

  getFilePath = () => {
    return this.filePath;
  };

  getFileData = () => {
    this.fs.readFile(this.filePath, (err: any, data: any) => {
      console.log("Data: ", data);
      console.log("Error: ", err);
      if (err.code === "ENOENT") {
        throw Error("File not Present");
      }
    });
  };
}

export default DataStore;

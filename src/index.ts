import fs from "fs";

class DataStore {
  filePath: string;
  constructor(filePath: string = "") {
    this.filePath = filePath;
  }

  getFilePath = () => {
    return this.filePath;
  };
}

export default DataStore;

import DataStore from "../index";
import IDataStore from "../types/IDataStore";
import fs from "fs";
const path = require("path");

let dataStore: IDataStore | undefined;

beforeAll(() => {
  dataStore = new DataStore("test.json");
});

test("Data Store is initialized", () => {
  if (dataStore)
    expect(dataStore.getFilePath()).toBe(path.resolve("test.json"));
});

test("Read Data Store File", async () => {
  if (dataStore) {
    dataStore
      .getFileData()
      .catch((err) => expect(err).toMatch("File not Present"));
    await dataStore.createFile();
    dataStore.getFileData().then((data) => {
      const jsonData = data.toJSON();
      expect(jsonData.data).toHaveLength(0);
    });
  }
});

test("Check if File is Created", async () => {
  if (dataStore) {
    await dataStore.createFile();
    fs.access(dataStore.getFilePath(), fs.constants.F_OK, (err) => {
      expect(err).toBeFalsy();
    });
  }
});

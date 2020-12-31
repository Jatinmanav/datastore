import DataStore from "../index";
import IDataStore from "../types/IDataStore";
import fs from "fs";
const path = require("path");

let dataStore: IDataStore | undefined;
let dataStore2: IDataStore | undefined;

beforeAll(async () => {
  dataStore = new DataStore();
  await dataStore.createFile("test.json");
  dataStore2 = new DataStore();
});

test("Data Store is initialized", () => {
  if (dataStore)
    expect(dataStore.getFilePath()).toBe(path.resolve("test.json"));
});

test("Read Data Store File", async () => {
  if (dataStore) {
    dataStore.getFileData().then((data) => {
      const jsonData = JSON.parse(data);
      expect(jsonData).toStrictEqual({});
    });
  }

  if (dataStore2) {
    expect(dataStore2.getFileData).toThrow("File not Created");
  }
});

test("Check if File is Created", async () => {
  if (dataStore) {
    fs.access(dataStore.getFilePath(), fs.constants.F_OK, (err) => {
      expect(err).toBeFalsy();
    });
  }
});

test("Write to File", async () => {
  if (dataStore) {
    await dataStore.addValue("Key", { test: "value" });
    await dataStore.addValue("Key1", { test1: "value1" });
    await dataStore.addValue("Key2", { test2: "value2" });
    await dataStore.addValue("Key3", { test3: "value3" });
    await dataStore.addValue("Key4", { test4: "value4" });
    await dataStore.addValue("Key5", { test5: "value5" });
    await dataStore.addValue("Key6", { test6: "value6" });
    await expect(
      dataStore.addValue("Key6", { test7: "value7" })
    ).rejects.toEqual(new Error("Key already exists"));

    dataStore.getFileData().then((data) => {
      const jsonData = JSON.parse(data);
      expect(jsonData).toStrictEqual({
        Key: { test: "value" },
        Key1: { test1: "value1" },
        Key2: { test2: "value2" },
        Key3: { test3: "value3" },
        Key4: { test4: "value4" },
        Key5: { test5: "value5" },
        Key6: { test6: "value6" },
      });
    });
  }
});

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

afterAll(async () => {
  if (dataStore) await dataStore.deleteFile();
});

test("Data store is initialized", () => {
  if (dataStore)
    expect(dataStore.getFilePath()).toBe(path.resolve("test.json"));
});

test("Read data store file", async () => {
  if (dataStore) {
    await dataStore.getFileData().then((data) => {
      const jsonData = JSON.parse(data);
      expect(jsonData).toStrictEqual({});
    });
  }

  if (dataStore2) {
    dataStore2
      .getFileData()
      .catch((err) => expect(err).toEqual("File has not been initialized"));
  }
});

test("Check if file is created", async () => {
  if (dataStore) {
    fs.access(dataStore.getFilePath(), fs.constants.F_OK, (err) => {
      expect(err).toBeFalsy();
    });
  }
});

test("Write to file", async () => {
  if (dataStore) {
    await dataStore.addValue("Key", { test: "value" });
    await dataStore.addValue("Key1", { test1: "value1" });
    await dataStore.addValue("Key2", { test2: "value2" });
    await dataStore.addValue("Key3", { test3: "value3" });
    await dataStore.addValue("Key4", { test4: "value4" });
    await dataStore.addValue("Key5", { test5: "value5" });
    await dataStore.addValue("Key6", { test6: "value6" });

    await dataStore.addValue("Key6", { test7: "value7" }).catch((err) => {
      expect(err).toEqual("Key already exists");
    });
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

test("Delete key value pair", async () => {
  if (dataStore) {
    await dataStore.deleteValue("Key3");
    await dataStore.deleteValue("Key4");

    await dataStore.deleteValue("key").catch((err) => {
      expect(err).toEqual("Key doesn't exist");
    });
    dataStore.getFileData().then((data) => {
      const jsonData = JSON.parse(data);
      expect(jsonData).toStrictEqual({
        Key: { test: "value" },
        Key1: { test1: "value1" },
        Key2: { test2: "value2" },
        Key5: { test5: "value5" },
        Key6: { test6: "value6" },
      });
    });
  }
});

test("Get value from file", async () => {
  if (dataStore) {
    let result = await dataStore.getValue("Key");
    let result1 = await dataStore.getValue("Key1");
    let result2 = await dataStore.getValue("Key2");

    await dataStore.getValue("key").catch((err) => {
      expect(err).toEqual("Key doesn't exist");
    });
    expect(result).toStrictEqual({ test: "value" });
    expect(result1).toStrictEqual({ test1: "value1" });
    expect(result2).toStrictEqual({ test2: "value2" });
  }
});

import DataStore from "../index";
const path = require("path");

test("Data Store is initialized", () => {
  const dataStore = new DataStore("test");

  try {
    expect(dataStore.getFilePath()).toBe(path.join(__dirname, "test"));
    dataStore.getFileData();
    expect(true).toBe(false);
  } catch (err) {
    console.log(err);
    err.message.toBe("File not Present");
  }
});

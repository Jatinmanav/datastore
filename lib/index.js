"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DataStore = /** @class */ (function () {
    function DataStore() {
        var _this = this;
        this.filePath = "";
        this.fs = require("fs");
        this.path = require("path");
        this.createFile = function (filePath) {
            _this.filePath = filePath
                ? _this.path.resolve(filePath)
                : _this.path.join(__dirname, "datastore.json");
            return new Promise(function (resolve, reject) {
                if (_this.path.extname(_this.filePath) !== ".json") {
                    _this.filePath = "";
                    return reject("File should be of type JSON");
                }
                if (DataStore.fileState.has(_this.filePath))
                    return resolve(true);
                _this.fs.writeFile(_this.filePath, "{}", function (err) {
                    if (err) {
                        _this.filePath = "";
                        return reject(err);
                    }
                    DataStore.fileState.set(_this.filePath, false);
                    DataStore.keyTTL.set(_this.filePath, new Map());
                    return resolve(true);
                });
            });
        };
        this.addValue = function (key, value, ttl) {
            return new Promise(function (resolve, reject) {
                if (_this.filePath === "")
                    return reject("File has not been initialized");
                if (DataStore.fileState.get(_this.filePath)) {
                    return reject("File is in use");
                }
                DataStore.fileState.set(_this.filePath, true);
                var size = Buffer.byteLength(JSON.stringify(value));
                if (key.length > 32) {
                    DataStore.fileState.set(_this.filePath, false);
                    return reject("Key cannot be greater than 32 characters");
                }
                if (size / 1024 > 16) {
                    DataStore.fileState.set(_this.filePath, false);
                    return reject("Value cannot be greater than 16kb");
                }
                _this.getFileData()
                    .then(function (data) {
                    var jsonData = JSON.parse(data);
                    if (key in jsonData) {
                        DataStore.fileState.set(_this.filePath, false);
                        return reject("Key already exists");
                    }
                    jsonData[key] = value;
                    var jsonSize = Buffer.byteLength(JSON.stringify(jsonData));
                    if (jsonSize / 1073741824 > 1) {
                        DataStore.fileState.set(_this.filePath, false);
                        return reject("File size is greater than 1gb");
                    }
                    _this.fs.writeFile(_this.filePath, JSON.stringify(jsonData), function (err) {
                        if (err) {
                            DataStore.fileState.set(_this.filePath, false);
                            return reject(err);
                        }
                        var newKeyTTL = DataStore.keyTTL.get(_this.filePath);
                        if (newKeyTTL) {
                            if (ttl !== undefined)
                                newKeyTTL.set(key, [new Date(), ttl]);
                            else
                                newKeyTTL.set(key, [new Date(), -1]);
                            DataStore.keyTTL.set(_this.filePath, newKeyTTL);
                        }
                        DataStore.fileState.set(_this.filePath, false);
                        return resolve(true);
                    });
                })
                    .catch(function (err) {
                    DataStore.fileState.set(_this.filePath, false);
                    return reject(err);
                });
            });
        };
        this.getFilePath = function () {
            return _this.filePath;
        };
        this.getFileData = function () {
            return new Promise(function (resolve, reject) {
                if (_this.filePath === "")
                    return reject("File has not been initialized");
                _this.fs.readFile(_this.filePath, function (err, data) {
                    if (err && err.code === "ENOENT") {
                        return reject("File doesn't exist");
                    }
                    else if (err) {
                        return reject(err);
                    }
                    else {
                        return resolve(data);
                    }
                });
            });
        };
        this.getValue = function (key) {
            return new Promise(function (resolve, reject) {
                if (_this.filePath === "")
                    return reject("File has not been initialized");
                if (DataStore.fileState.get(_this.filePath))
                    return reject("File is in use");
                DataStore.fileState.set(_this.filePath, true);
                if (key.length > 32) {
                    DataStore.fileState.set(_this.filePath, false);
                    return reject("Key cannot be greater than 32 characters");
                }
                _this.getFileData().then(function (data) {
                    var jsonData = JSON.parse(data);
                    if (key in jsonData === false) {
                        DataStore.fileState.set(_this.filePath, false);
                        return reject("Key doesn't exist");
                    }
                    DataStore.fileState.set(_this.filePath, false);
                    var newKeyTTL = DataStore.keyTTL.get(_this.filePath);
                    if (newKeyTTL) {
                        var ttlValue = newKeyTTL.get(key);
                        if (ttlValue) {
                            var creationTime = ttlValue[0], ttl = ttlValue[1];
                            if (ttl !== -1) {
                                var timeNow = new Date();
                                var seconds = Math.floor(timeNow.getTime() - creationTime.getTime() / 1000);
                                if (seconds > ttl) {
                                    return reject("The provided key has expired");
                                }
                            }
                        }
                    }
                    return resolve(jsonData[key]);
                });
            });
        };
        this.deleteValue = function (key) {
            return new Promise(function (resolve, reject) {
                if (_this.filePath === "")
                    return reject("File has not been initialized");
                if (DataStore.fileState.get(_this.filePath))
                    return reject("File is in use");
                DataStore.fileState.set(_this.filePath, true);
                if (key.length > 32) {
                    DataStore.fileState.set(_this.filePath, false);
                    return reject("Key cannot be greater than 32 characters");
                }
                _this.getFileData().then(function (data) {
                    var jsonData = JSON.parse(data);
                    if (key in jsonData === false) {
                        DataStore.fileState.set(_this.filePath, false);
                        return reject("Key doesn't exist");
                    }
                    var newKeyTTL = DataStore.keyTTL.get(_this.filePath);
                    if (newKeyTTL) {
                        var ttlValue = newKeyTTL.get(key);
                        if (ttlValue) {
                            var creationTime = ttlValue[0], ttl = ttlValue[1];
                            if (ttl !== -1) {
                                var timeNow = new Date();
                                var seconds = Math.floor(timeNow.getTime() - creationTime.getTime() / 1000);
                                if (seconds > ttl) {
                                    newKeyTTL.delete(key);
                                    DataStore.keyTTL.set(_this.filePath, newKeyTTL);
                                    DataStore.fileState.set(_this.filePath, false);
                                    return reject("The provided key has expired");
                                }
                            }
                            newKeyTTL.delete(key);
                            DataStore.keyTTL.set(_this.filePath, newKeyTTL);
                        }
                    }
                    delete jsonData[key];
                    _this.fs.writeFile(_this.filePath, JSON.stringify(jsonData), function (err) {
                        if (err) {
                            DataStore.fileState.set(_this.filePath, false);
                            return reject(err);
                        }
                        DataStore.fileState.set(_this.filePath, false);
                        return resolve(true);
                    });
                });
            });
        };
        this.deleteFile = function () {
            return new Promise(function (resovle, reject) {
                if (_this.filePath === "")
                    return reject("File has not been initialized");
                if (DataStore.fileState.get(_this.filePath)) {
                    return reject("File is in use");
                }
                DataStore.fileState.set(_this.filePath, true);
                _this.fs.unlink(_this.getFilePath(), function (err) {
                    if (err) {
                        DataStore.fileState.set(_this.filePath, false);
                        return reject(err);
                    }
                    DataStore.fileState.delete(_this.filePath);
                    _this.filePath = "";
                    return resovle(true);
                });
            });
        };
    }
    DataStore.fileState = new Map();
    DataStore.keyTTL = new Map();
    return DataStore;
}());
exports.default = DataStore;
//# sourceMappingURL=index.js.map
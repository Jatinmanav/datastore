import IDataStore from "./types/IDataStore";
declare class DataStore implements IDataStore {
    private filePath;
    private fs;
    private path;
    private static fileState;
    private static keyTTL;
    createFile: (filePath?: string | undefined) => Promise<boolean>;
    addValue: (key: string, value: Object, ttl?: number | undefined) => Promise<boolean>;
    getFilePath: () => string;
    getFileData: () => Promise<string>;
    getValue: (key: string) => Promise<Object>;
    deleteValue: (key: string) => Promise<boolean>;
    deleteFile: () => Promise<boolean>;
}
export default DataStore;
//# sourceMappingURL=index.d.ts.map
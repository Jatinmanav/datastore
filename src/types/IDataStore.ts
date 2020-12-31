export default interface IDataStore {
  addValue(key: string, value: Object): Promise<boolean>;
  createFile(filePath?: string): Promise<boolean>;
  deleteFile(): Promise<boolean>;
  getValue(key: string): Promise<Object>;
  deleteValue(key: string): Promise<boolean>;
  getFilePath(): string;
  getFileData(): Promise<string>;
}

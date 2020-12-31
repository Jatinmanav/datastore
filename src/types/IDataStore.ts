export default interface IDataStore {
  createFile(filePath?: string): Promise<boolean>;
  getFilePath(): string;
  getFileData(): Promise<string>;
  addValue(key: string, value: Object): Promise<boolean>;
}

export default interface IDataStore {
  createFile(): Promise<boolean>;
  getFilePath(): string;
  getFileData(): Promise<Buffer>;
}

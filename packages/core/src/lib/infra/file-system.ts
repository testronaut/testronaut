export interface FileSystem {
  writeFile(path: string, content: string): Promise<void>;
}

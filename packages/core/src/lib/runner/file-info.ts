export interface FileInfo {
  path: string;
  hash: string;
}

export function createFileInfo(fileInfo: FileInfo): FileInfo {
  return fileInfo;
}

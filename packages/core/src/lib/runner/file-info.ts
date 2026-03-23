declare const fileHashBrand: unique symbol;

export type FileHash = string & {
  readonly [fileHashBrand]: typeof fileHashBrand;
};

export function toFileHash(value: string): FileHash {
  return value as FileHash;
}

export interface FileInfo {
  path: string;
  fileHash: FileHash;
}

export function createFileInfo(fileInfo: FileInfo): FileInfo {
  return fileInfo;
}

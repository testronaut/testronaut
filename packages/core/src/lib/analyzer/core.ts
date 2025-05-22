import * as ts from 'typescript';

export class AnalysisContext {
  readonly sourceFile: ts.SourceFile;
  readonly typeChecker: ts.TypeChecker;

  constructor({ path, content }: FileData) {
    const sourceFile = ts.createSourceFile(
      path,
      content,
      ts.ScriptTarget.Latest,
      true
    );
    const compilerHost = ts.createCompilerHost({});
    compilerHost.getSourceFile = () => sourceFile;

    this.sourceFile = sourceFile;
    this.typeChecker = ts
      .createProgram([path], {}, compilerHost)
      .getTypeChecker();
  }
}

export interface FileData {
  path: string;
  content: string;
}

export function createFileData(fileData: FileData): FileData {
  return fileData;
}

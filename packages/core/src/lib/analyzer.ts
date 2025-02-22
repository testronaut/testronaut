import * as ts from 'typescript';
import {
  createExtractedFunction,
  ExtractedFunction,
} from './extracted-function';

export class Analyzer {
  private static _RUN_IN_BROWSER_IDENTIFIER = 'runInBrowser';

  analyze({ path, content }: { content: string; path: string }) {
    const sourceFile = ts.createSourceFile(
      path,
      content,
      ts.ScriptTarget.Latest,
      true
    );
    const typeChecker = this._createTypeChecker(sourceFile, path);

    const analysisContext = new AnalysisContext();

    const visitor: ts.Visitor<ts.Node> = (node) => {
      if (
        ts.isCallExpression(node) &&
        this._isRunInBrowserCall(typeChecker, node)
      ) {
        analysisContext.addExtractedFunction(
          this._parseRunInBrowserArgs(sourceFile, node)
        );
      }

      return ts.visitEachChild(node, visitor, undefined);
    };

    ts.visitEachChild(sourceFile, visitor, undefined);

    return analysisContext.getExtractedFunctions();
  }

  private _createTypeChecker(sourceFile: ts.SourceFile, path: string) {
    const compilerHost = ts.createCompilerHost({});
    compilerHost.getSourceFile = () => sourceFile;
    return ts.createProgram([path], {}, compilerHost).getTypeChecker();
  }

  private _isRunInBrowserCall(
    typeChecker: ts.TypeChecker,
    callExpression: ts.CallExpression
  ): boolean {
    /* Identifier is `runInBrowser`. */
    if (
      callExpression.expression.getText() ===
      Analyzer._RUN_IN_BROWSER_IDENTIFIER
    ) {
      return true;
    }

    const runInBrowserDeclaration = this._getDeclaration(
      typeChecker,
      callExpression.expression
    );

    /* Identifier is an alias (e.g. `test(..., ({runInBrowser: run}) => { run(...); })`). */
    return (
      runInBrowserDeclaration != null &&
      ts.isObjectBindingPattern(runInBrowserDeclaration.parent) &&
      runInBrowserDeclaration.parent.elements.at(0)?.propertyName?.getText() ===
        Analyzer._RUN_IN_BROWSER_IDENTIFIER
    );
  }

  private _getDeclaration(typeChecker: ts.TypeChecker, node: ts.Node) {
    return typeChecker.getSymbolAtLocation(node)?.getDeclarations()?.at(0);
  }

  private _parseRunInBrowserArgs(
    sourceFile: ts.SourceFile,
    node: ts.CallExpression
  ): ExtractedFunction {
    if (node.arguments.length === 0) {
      throw new InvalidRunInBrowserCallError(
        '`runInBrowser` must have at least one argument'
      );
    }

    if (node.arguments.length > 2) {
      throw new InvalidRunInBrowserCallError(
        '`runInBrowser` must have at most two arguments'
      );
    }

    const nameArg = node.arguments.length > 1 ? node.arguments[0] : undefined;
    if (nameArg && !ts.isStringLiteralLike(nameArg)) {
      throw new InvalidRunInBrowserCallError(
        '`runInBrowser` name must be a string literal'
      );
    }

    const codeArg =
      node.arguments.length === 1 ? node.arguments[0] : node.arguments[1];
    if (!ts.isFunctionLike(codeArg)) {
      throw new InvalidRunInBrowserCallError(
        '`runInBrowser` function must be an inline function'
      );
    }

    return createExtractedFunction({
      code: codeArg.getText(sourceFile),
      name: nameArg?.text,
      importedIdentifiers: [],
    });
  }
}

export class InvalidRunInBrowserCallError extends Error {
  override name = 'InvalidRunInBrowserCallError';
}

class AnalysisContext {
  private _extractedFunctions: ExtractedFunction[] = [];

  addExtractedFunction({ code, name }: { code: string; name?: string }) {
    this._extractedFunctions.push(
      createExtractedFunction({ code, name, importedIdentifiers: [] })
    );
  }

  getExtractedFunctions(): ReadonlyArray<ExtractedFunction> {
    return this._extractedFunctions;
  }
}

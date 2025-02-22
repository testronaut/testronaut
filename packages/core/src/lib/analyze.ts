import * as ts from 'typescript';
import {
  createExtractedFunction,
  createImportedIdentifier,
  ExtractedFunction,
  ImportedIdentifier,
} from './extracted-function';

const _RUN_IN_BROWSER_IDENTIFIER = 'runInBrowser';

export function analyze({ path, content }: { content: string; path: string }) {
  /* Create compiler and context. */
  const { analysisContext, sourceFile, typeChecker } = prepare();

  /* Extract `runInBrowser` calls. */
  ts.visitEachChild(sourceFile, visit, undefined);

  /* Return extracted calls. */
  return analysisContext.getExtractedFunctions();

  function prepare() {
    const sourceFile = ts.createSourceFile(
      path,
      content,
      ts.ScriptTarget.Latest,
      true
    );
    const compilerHost = ts.createCompilerHost({});
    compilerHost.getSourceFile = () => sourceFile;
    const typeChecker = ts
      .createProgram([path], {}, compilerHost)
      .getTypeChecker();

    return {
      analysisContext: new AnalysisContext(),
      sourceFile,
      typeChecker,
    };
  }

  function visit(node: ts.Node): ts.Node {
    if (ts.isCallExpression(node) && isRunInBrowserCall(node)) {
      const { code, name } = parseRunInBrowserArgs(node);
      analysisContext.enterRunInBrowserCall({ code, name });
      visitChildren(node);
      analysisContext.exitRunInBrowserCall();
      return node;
    }

    /* Collect imports used inside `runInBrowser` calls. */
    if (analysisContext.isInRunInBrowserCall() && ts.isIdentifier(node)) {
      const importedIdentifier = tryGetImportedIdentifier(node);

      if (importedIdentifier) {
        analysisContext.addImportedIdentifier(importedIdentifier);
      }
    }

    return visitChildren(node);
  }

  function visitChildren(node: ts.Node): ts.Node {
    return ts.visitEachChild(node, visit, undefined);
  }

  function isRunInBrowserCall(callExpression: ts.CallExpression): boolean {
    /* Identifier is `runInBrowser`. */
    if (callExpression.expression.getText() === _RUN_IN_BROWSER_IDENTIFIER) {
      return true;
    }

    const runInBrowserDeclaration = getDeclaration(callExpression.expression);

    /* Identifier is an alias (e.g. `test(..., ({runInBrowser: run}) => { run(...); })`). */
    return (
      runInBrowserDeclaration != null &&
      ts.isObjectBindingPattern(runInBrowserDeclaration.parent) &&
      runInBrowserDeclaration.parent.elements.at(0)?.propertyName?.getText() ===
        _RUN_IN_BROWSER_IDENTIFIER
    );
  }

  function parseRunInBrowserArgs(node: ts.CallExpression): {
    code: string;
    name?: string;
  } {
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

  function getDeclaration(node: ts.Node) {
    return typeChecker.getSymbolAtLocation(node)?.getDeclarations()?.at(0);
  }

  function tryGetImportedIdentifier(
    node: ts.Node
  ): ImportedIdentifier | undefined {
    const declaration = getDeclaration(node);
    const name = declaration?.getText(sourceFile);
    const moduleSpecifier = findImportDeclaration(declaration)?.moduleSpecifier;

    if (
      name != null &&
      moduleSpecifier != null &&
      ts.isStringLiteral(moduleSpecifier)
    ) {
      return createImportedIdentifier({ name, module: moduleSpecifier.text });
    }

    return undefined;
  }

  function findImportDeclaration(
    node?: ts.Node
  ): ts.ImportDeclaration | undefined {
    while (node?.parent != null) {
      node = node.parent;
      if (ts.isImportDeclaration(node)) {
        return node;
      }
    }
    return undefined;
  }
}

export class InvalidRunInBrowserCallError extends Error {
  override name = 'InvalidRunInBrowserCallError';
}

class AnalysisContext {
  private _currentRunInBrowserCall: ExtractedFunction | null = null;
  private _extractedFunctions: ExtractedFunction[] = [];

  enterRunInBrowserCall({ code, name }: { code: string; name?: string }) {
    this._currentRunInBrowserCall = createExtractedFunction({
      code,
      name,
      importedIdentifiers: [],
    });
  }

  exitRunInBrowserCall() {
    if (this._currentRunInBrowserCall) {
      this._extractedFunctions.push(this._currentRunInBrowserCall);
      this._currentRunInBrowserCall = null;
    }
  }

  isInRunInBrowserCall() {
    return this._currentRunInBrowserCall != null;
  }

  getExtractedFunctions(): ReadonlyArray<ExtractedFunction> {
    return this._extractedFunctions;
  }

  addImportedIdentifier(importedIdentifier: ImportedIdentifier) {
    this._currentRunInBrowserCall?.importedIdentifiers.push(
      createImportedIdentifier(importedIdentifier)
    );
  }
}

import * as ts from 'typescript';
import {
  createExtractedFunction,
  ExtractedFunction,
} from './extracted-function';

export class Analyzer {
  analyze({ path, content }: { content: string; path: string }) {
    const sourceFile = ts.createSourceFile(
      path,
      content,
      ts.ScriptTarget.Latest
    );
    const analysisContext = new AnalysisContext();

    const visitor: ts.Visitor<ts.Node> = (node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'runInBrowser'
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

  private _parseRunInBrowserArgs(
    sourceFile: ts.SourceFile,
    node: ts.CallExpression
  ): ExtractedFunction {
    const nameArg = node.arguments.length > 1 ? node.arguments[0] : undefined;
    const codeArg =
      node.arguments.length === 1 ? node.arguments[0] : node.arguments[1];
    const name =
      nameArg && ts.isStringLiteralLike(nameArg) ? nameArg.text : undefined;
    const code = ts.isFunctionLike(codeArg) ? codeArg.getText(sourceFile) : '';
    return createExtractedFunction({ code, name, importedIdentifiers: [] });
  }
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

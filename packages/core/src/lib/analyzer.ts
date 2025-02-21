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
        const firstArg = node.arguments[0];
        if (ts.isFunctionLike(firstArg)) {
          const code = firstArg.getText(sourceFile);
          analysisContext.addExtractedFunction({ code });
        } else if (ts.isStringLiteralLike(firstArg)) {
          const name = firstArg.text;
          const codeNode = node.arguments[1];
          if (ts.isFunctionLike(codeNode)) {
            const code = codeNode.getText(sourceFile);
            analysisContext.addExtractedFunction({ code, name });
          }
        }
      }

      return ts.visitEachChild(node, visitor, undefined);
    };

    ts.visitEachChild(sourceFile, visitor, undefined);

    return analysisContext.getExtractedFunctions();
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

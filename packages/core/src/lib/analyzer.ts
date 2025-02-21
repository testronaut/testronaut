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
        const code = node.arguments[0].getText(sourceFile);
        analysisContext.addExtractedFunction({ code });
      }

      return ts.visitEachChild(node, visitor, undefined);
    };

    ts.visitEachChild(sourceFile, visitor, undefined);

    return analysisContext.getExtractedFunctions();
  }
}

class AnalysisContext {
  private _extractedFunctions: ExtractedFunction[] = [];

  addExtractedFunction({ code }: { code: string }) {
    this._extractedFunctions.push(
      createExtractedFunction({ code, importedIdentifiers: [] })
    );
  }

  getExtractedFunctions(): ReadonlyArray<ExtractedFunction> {
    return this._extractedFunctions;
  }
}

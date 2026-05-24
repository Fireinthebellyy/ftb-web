const ts = require('typescript');
const fs = require('fs');

const fileName = 'e:/FTBH/ftb-web/components/toolkit/NewBundleModal.tsx';
const program = ts.createProgram([fileName], { jsx: ts.JsxEmit.React, esModuleInterop: true });
const emitResult = program.emit();
const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

allDiagnostics.forEach(diagnostic => {
  if (diagnostic.file) {
    let { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
    let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
    console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
  } else {
    console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
  }
});
console.log("Done");

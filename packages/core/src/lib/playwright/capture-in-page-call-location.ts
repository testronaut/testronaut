import { fileURLToPath } from 'node:url';

export function captureInPageCallLocation(): { filePath: string; line: number } | null {
  const frames = (new Error().stack ?? '').split('\n');
  // Stack: [0] "Error", [1] captureInPageCallLocation, [2] inPageImpl, [3] caller
  return _parseCallerFrame(frames[3]);
}

export function _parseCallerFrame(
  frame: string | undefined
): { filePath: string; line: number } | null {
  if (!frame) return null;
  const match = frame.match(/^ +at (file:\/\/\/.+):(\d+):\d+$/);
  if (!match) return null;
  return {
    filePath: fileURLToPath(match[1]),
    line: parseInt(match[2], 10),
  };
}

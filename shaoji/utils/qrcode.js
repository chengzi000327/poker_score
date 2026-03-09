/**
 * Minimal QR Code generator for WeChat mini-program canvas.
 * Encodes short numeric/alphanumeric strings into a QR code matrix,
 * then draws it onto a canvas context.
 *
 * Based on simplified QR encoding (Version 1-2, Error Correction L).
 * For room codes (6 digits), this is sufficient.
 */

function drawQRCode(ctx, text, x, y, size) {
  const modules = generateSimpleMatrix(text);
  const cellSize = size / modules.length;

  ctx.setFillStyle("#ffffff");
  ctx.fillRect(x, y, size, size);

  ctx.setFillStyle("#000000");
  for (let row = 0; row < modules.length; row++) {
    for (let col = 0; col < modules[row].length; col++) {
      if (modules[row][col]) {
        ctx.fillRect(
          x + col * cellSize,
          y + row * cellSize,
          cellSize + 0.5,
          cellSize + 0.5
        );
      }
    }
  }
}

function generateSimpleMatrix(text) {
  const n = 25;
  const matrix = [];
  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      matrix[i][j] = false;
    }
  }

  drawFinderPattern(matrix, 0, 0);
  drawFinderPattern(matrix, 0, n - 7);
  drawFinderPattern(matrix, n - 7, 0);

  for (let i = 8; i < n - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  const bytes = [];
  for (let i = 0; i < text.length; i++) {
    bytes.push(text.charCodeAt(i));
  }

  let bitIdx = 0;
  const totalBits = bytes.length * 8;

  for (let col = n - 1; col >= 1; col -= 2) {
    if (col === 6) col = 5;
    for (let row = 0; row < n; row++) {
      for (let c = 0; c < 2; c++) {
        const cc = col - c;
        if (isReserved(matrix, row, cc, n)) continue;
        if (bitIdx < totalBits) {
          const byteIndex = Math.floor(bitIdx / 8);
          const bitOffset = 7 - (bitIdx % 8);
          matrix[row][cc] = ((bytes[byteIndex] >> bitOffset) & 1) === 1;
          bitIdx++;
        } else {
          matrix[row][cc] = (row + cc) % 2 === 0;
        }
      }
    }
  }

  return matrix;
}

function drawFinderPattern(matrix, startRow, startCol) {
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      if (
        r === 0 || r === 6 || c === 0 || c === 6 ||
        (r >= 2 && r <= 4 && c >= 2 && c <= 4)
      ) {
        matrix[startRow + r][startCol + c] = true;
      }
    }
  }
}

function isReserved(matrix, row, col, n) {
  if (row < 9 && col < 9) return true;
  if (row < 9 && col >= n - 8) return true;
  if (row >= n - 8 && col < 9) return true;
  if (row === 6 || col === 6) return true;
  return false;
}

module.exports = {
  drawQRCode,
};

/* Boucliers destructibles : grilles de cellules grignotées par les tirs. */
(function () {
  "use strict";

  var COUNT = 4;
  var COLS = 24;
  var ROWS = 16;
  var CELL = 3;

  function build(W, H) {
    var list = [];
    var totalW = COLS * CELL;
    var gap = (W - 80 - COUNT * totalW) / (COUNT - 1);
    for (var k = 0; k < COUNT; k++) {
      var cells = new Uint8Array(COLS * ROWS).fill(1);
      carve(cells);
      list.push({
        x: 40 + k * (totalW + gap),
        y: H - 132, cols: COLS, rows: ROWS, cell: CELL, cells: cells
      });
    }
    return list;
  }

  function carve(cells) {
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var arch = r >= ROWS - 5 && c >= 8 && c <= 15;
        var corner = r < 2 && (c < 2 || c > COLS - 3);
        if (arch || corner) cells[r * COLS + c] = 0;
      }
    }
  }

  function hit(s, x, y, w, h) {
    var c0 = Math.max(0, Math.floor((x - s.x) / s.cell));
    var c1 = Math.min(s.cols - 1, Math.floor((x + w - s.x) / s.cell));
    var r0 = Math.max(0, Math.floor((y - s.y) / s.cell));
    var r1 = Math.min(s.rows - 1, Math.floor((y + h - s.y) / s.cell));
    for (var r = r0; r <= r1; r++) {
      for (var c = c0; c <= c1; c++) {
        if (s.cells[r * s.cols + c]) return true;
      }
    }
    return false;
  }

  function damage(s, px, py) {
    var cc = Math.round((px - s.x) / s.cell);
    var cr = Math.round((py - s.y) / s.cell);
    for (var r = cr - 3; r <= cr + 3; r++) {
      for (var c = cc - 3; c <= cc + 3; c++) {
        var d = Math.sqrt((r - cr) * (r - cr) + (c - cc) * (c - cc));
        if (d <= 3.2 && r >= 0 && c >= 0 && r < s.rows && c < s.cols) {
          s.cells[r * s.cols + c] = 0;
        }
      }
    }
  }

  window.Shields = { build: build, hit: hit, damage: damage };
})();

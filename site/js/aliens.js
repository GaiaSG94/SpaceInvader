/* Grille d'aliens : génération, rythme, cadence de tir.
 * Pur : opère sur l'état de jeu transmis, sans DOM. */
(function () {
  "use strict";

  var COLS = 11;
  var ROWS = 5;
  var CELL_W = 36;
  var CELL_H = 30;
  var GRID_Y = 92;
  var GRID_X = 0;
  var PX = 2;

  var TYPES = [
    { sprites: "SQUID", points: 30 },
    { sprites: "CRAB", points: 20 },
    { sprites: "CRAB", points: 20 },
    { sprites: "OCTOPUS", points: 10 },
    { sprites: "OCTOPUS", points: 10 }
  ];

  function init(W) {
    GRID_X = (W - COLS * CELL_W) / 2 + 4;
  }

  function dims(kind) {
    var frames = window.Sprites[kind];
    return { w: frames[0][0].length * PX, h: frames[0].length * PX };
  }

  function makeAlien(col, row, x, y, kind, points, spec) {
    var size = dims(kind);
    var scale = (spec && spec.scale) || 1;
    return {
      col: col, row: row, alive: true, boss: !!(spec && spec.boss),
      x: x, y: y, w: size.w * scale, h: size.h * scale, px: PX * scale,
      points: (spec && spec.points) || points, kind: kind,
      hp: (spec && spec.hp) || 1, maxHp: (spec && spec.hp) || 1,
      label: (spec && spec.label) || null, color: (spec && spec.color) || null
    };
  }

  function spawn(G, specFor) {
    G.aliens = [];
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var spec = specFor ? specFor(c, r) : null;
        var kind = (spec && spec.kind) || TYPES[r].sprites;
        G.aliens.push(makeAlien(c, r, GRID_X + c * CELL_W, GRID_Y + r * CELL_H,
          kind, TYPES[r].points, spec));
      }
    }
  }

  function spawnBoss(G, spec, W) {
    var size = dims(spec.kind);
    var scale = spec.scale || 3;
    var w = size.w * scale;
    G.aliens = [makeAlien(-1, -1, W / 2 - w / 2, 110, spec.kind, spec.points, {
      boss: true, scale: scale, hp: spec.hp, points: spec.points,
      label: spec.label, color: spec.color
    })];
  }

  function alive(G) {
    return G.aliens.filter(function (a) { return a.alive; });
  }

  function stepInterval(G) {
    var ratio = alive(G).length / (COLS * ROWS);
    var base = 0.03 + 0.5 * ratio;
    return Math.max(0.025, base / (1 + (G.level - 1) * 0.12));
  }

  function fireInterval(G) {
    var ratio = alive(G).length / (COLS * ROWS);
    var t = 1.0 - (G.level - 1) * 0.08 - (1 - ratio) * 0.55;
    return Math.min(1.1, Math.max(0.22, t));
  }

  function maxBombs(G) {
    return Math.min(2 + G.level, 6);
  }

  function bombSpeed(G) {
    return Math.min(190 + G.level * 18, 340);
  }

  window.Aliens = {
    init: init, spawn: spawn, spawnBoss: spawnBoss, alive: alive,
    stepInterval: stepInterval, fireInterval: fireInterval,
    maxBombs: maxBombs, bombSpeed: bombSpeed, COLS: COLS, ROWS: ROWS
  };
})();

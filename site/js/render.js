/* Rendu canvas du jeu à partir d'un instantané d'état (pas de logique ici). */
(function () {
  "use strict";

  var PX = 2;
  var GREEN = "#35e065";
  var WHITE = "#e8ecef";
  var RED = "#e05555";

  var ctx = null;
  var W = 0;
  var H = 0;
  var playerY = 0;
  var ufoY = 0;

  function init(canvas, config) {
    ctx = canvas.getContext("2d");
    W = canvas.width;
    H = canvas.height;
    playerY = config.playerY;
    ufoY = config.ufoY;
  }

  function drawSprite(map, x, y, color, px) {
    var s = px || PX;
    ctx.fillStyle = color;
    for (var r = 0; r < map.length; r++) {
      var row = map[r];
      for (var c = 0; c < row.length; c++) {
        if (row[c] === "#") ctx.fillRect(x + c * s, y + r * s, s, s);
      }
    }
  }

  function drawAliens(snap) {
    snap.aliens.forEach(function (a) {
      drawSprite(window.Sprites[a.kind][snap.frame], a.x, a.y, a.color || WHITE, a.px);
    });
  }

  function drawShields(snap) {
    ctx.fillStyle = GREEN;
    snap.shields.forEach(function (s) {
      for (var r = 0; r < s.rows; r++) {
        for (var c = 0; c < s.cols; c++) {
          if (s.cells[r * s.cols + c]) {
            ctx.fillRect(s.x + c * s.cell, s.y + r * s.cell, s.cell, s.cell);
          }
        }
      }
    });
  }

  function drawShots(snap) {
    if (snap.bullet) {
      ctx.fillStyle = "#fff";
      ctx.fillRect(snap.bullet.x, snap.bullet.y, snap.bullet.w, snap.bullet.h);
    }
    snap.bombs.forEach(function (b) {
      ctx.fillStyle = ((b.anim * 10) | 0) % 2 ? "#fff" : RED;
      ctx.fillRect(b.x - 2, b.y, b.w, b.h);
    });
  }

  function drawFx(snap) {
    snap.explosions.forEach(function (e) {
      var map = window.Sprites[e.player ? "PLAYER_HIT" : "ALIEN_HIT"][0];
      drawSprite(map, e.x, e.y, e.player ? GREEN : WHITE);
    });
    ctx.fillStyle = "#fff";
    ctx.font = "14px 'Courier New', monospace";
    ctx.textAlign = "center";
    snap.popups.forEach(function (p) {
      ctx.fillText(p.text, p.x, p.y);
    });
  }

  function drawWorld(snap) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = GREEN;
    ctx.fillRect(0, playerY + 26, W, 2);
    drawAliens(snap);
    drawShields(snap);
    if (snap.ufo) drawSprite(window.Sprites.UFO[0], snap.ufo.x, ufoY, RED);
    if (snap.mode !== "dying" && snap.mode !== "gameover") {
      drawSprite(window.Sprites.PLAYER[0], snap.playerX, playerY, GREEN);
    }
    drawShots(snap);
    drawFx(snap);
  }

  function overlayText(mode, score) {
    if (mode === "title") return ["SPACE INVADERS", "Appuyez sur Démarrer"];
    if (mode === "paused") return ["PAUSE", ""];
    if (mode === "waveclear") return ["VAGUE TERMINÉE", ""];
    if (mode === "gameover") return ["PARTIE TERMINÉE", "Score : " + score];
    if (mode === "victory") return ["NIVEAU TERMINÉ", "Boss vaincu !"];
    return null;
  }

  function drawOverlay(snap) {
    var texts = overlayText(snap.mode, snap.score);
    if (!texts) return;
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.fillStyle = GREEN;
    ctx.font = "28px 'Courier New', monospace";
    ctx.fillText(texts[0], W / 2, H / 2 - 10);
    if (texts[1]) {
      ctx.font = "16px 'Courier New', monospace";
      ctx.fillStyle = WHITE;
      ctx.fillText(texts[1], W / 2, H / 2 + 22);
    }
  }

  function draw(snap) {
    drawWorld(snap);
    drawOverlay(snap);
  }

  window.Render = { init: init, draw: draw };
})();

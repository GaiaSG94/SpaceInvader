/* Space Invaders recréé de zéro : canon, vagues d'aliens,
 * bombes, soucoupe bonus, score, vies, niveaux.
 * Son -> Sfx, boucliers -> Shields, dessin -> Render,
 * grille -> Aliens, niveau/issues/multiplicateur -> Flow. */
(function () {
  "use strict";

  var W = 480;
  var H = 520;
  var PLAYER_Y = H - 46;
  var PLAYER_SPEED = 230;
  var BULLET_SPEED = 460;
  var STEP_DX = 5;
  var STEP_DROP = 20;
  var UFO_Y = 52;
  var UFO_SCORES = [100, 50, 50, 100, 150, 100, 100, 50, 300, 100, 100, 100, 50, 150, 100, 50];
  var HISCORE_KEY = "spaceinvader.hiscore";

  var G = null;
  var ui = {};

  function newState() {
    return {
      mode: "title", score: 0, lives: 3, level: 1,
      hiscore: loadHiscore(), playerX: W / 2 - 13,
      bullet: null, aliens: [], dir: 1, frame: 0,
      stepTimer: 0, bombs: [], fireTimer: 1,
      ufo: null, ufoTimer: 14, shields: [],
      popups: [], explosions: [], timer: 0,
      shotsFired: 0, bassTimer: 0, bassStep: 0,
      keys: { left: false, right: false },
      levelSpecs: null, bossSpec: null, bossSpawned: false,
      mult: window.Flow.createMultiplier()
    };
  }

  function loadHiscore() {
    try {
      return parseInt(window.localStorage.getItem(HISCORE_KEY) || "0", 10) || 0;
    } catch (e) {
      return 0;
    }
  }

  function saveHiscore() {
    if (G.score <= G.hiscore) return;
    G.hiscore = G.score;
    try {
      window.localStorage.setItem(HISCORE_KEY, String(G.hiscore));
    } catch (e) { /* record non persisté */ }
  }

  function startWave() {
    window.Aliens.spawn(G, G.levelSpecs);
    G.bullet = null;
    G.bombs = [];
    G.ufo = null;
    G.popups = [];
    G.explosions = [];
    G.dir = 1;
    G.frame = 0;
    G.stepTimer = 0;
    G.fireTimer = 1.2;
    G.ufoTimer = 12 + Math.random() * 12;
    G.shields = window.Shields.build(W, H);
    G.mode = "playing";
    syncHud();
    showMessage("");
  }

  function startGame() {
    window.Sfx.ensure();
    G.score = 0;
    G.lives = 3;
    G.level = 1;
    G.shotsFired = 0;
    G.mult = window.Flow.createMultiplier();
    G.playerX = W / 2 - 13;
    startWave();
  }

  function applyLevel(specFor, bossSpec) {
    G.levelSpecs = specFor || null;
    G.bossSpec = bossSpec || null;
    G.bossSpawned = false;
  }

  function togglePause() {
    if (G.mode === "playing") {
      G.mode = "paused";
      showMessage("Pause — P ou bouton pour reprendre.");
    } else if (G.mode === "paused") {
      G.mode = "playing";
      showMessage("");
    }
  }

  function updatePlayer(dt) {
    var dir = (G.keys.right ? 1 : 0) - (G.keys.left ? 1 : 0);
    G.playerX += dir * PLAYER_SPEED * dt;
    G.playerX = Math.max(8, Math.min(W - 8 - 26, G.playerX));
  }

  function playerFire() {
    if (G.mode !== "playing" || G.bullet) return;
    window.Sfx.ensure();
    G.bullet = { x: G.playerX + 13, y: PLAYER_Y - 4, w: 3, h: 10, hit: false };
    G.shotsFired++;
    window.Sfx.tone(880, 0.12, "square", 0.08, 220);
  }

  function updateBullet(dt) {
    if (!G.bullet) return;
    G.bullet.y -= BULLET_SPEED * dt;
    if (G.bullet.y + G.bullet.h >= 0) return;
    if (!G.bullet.hit) {
      G.mult.miss();
      syncHud();
      notify("onMiss", { mult: G.mult.value() });
    }
    G.bullet = null;
  }

  function updateAliens(dt) {
    G.stepTimer += dt;
    var interval = window.Aliens.stepInterval(G);
    while (G.stepTimer >= interval) {
      G.stepTimer -= interval;
      stepAliens();
      interval = window.Aliens.stepInterval(G);
    }
  }

  function stepAliens() {
    var alive = window.Aliens.alive(G);
    var i;
    for (i = 0; i < alive.length; i++) alive[i].x += STEP_DX * G.dir;
    G.frame = 1 - G.frame;
    var edge = alive.some(function (x) {
      return x.x < 8 || x.x + x.w > W - 8;
    });
    if (!edge) return;
    for (i = 0; i < alive.length; i++) alive[i].y += STEP_DROP;
    G.dir = -G.dir;
    eraseShieldsUnderAliens(alive);
    for (i = 0; i < alive.length; i++) {
      if (alive[i].y + alive[i].h >= PLAYER_Y) {
        endGame();
        return;
      }
    }
  }

  function eraseShieldsUnderAliens(alive) {
    alive.forEach(function (a) {
      G.shields.forEach(function (s) {
        var sw = s.cols * s.cell;
        var sh = s.rows * s.cell;
        if (!overlap(a.x, a.y, a.w, a.h, s.x, s.y, sw, sh)) return;
        window.Shields.damage(s, a.x + a.w / 2, a.y + a.h / 2);
      });
    });
  }

  function alienFire(dt) {
    G.fireTimer -= dt;
    if (G.fireTimer > 0 || G.bombs.length >= window.Aliens.maxBombs(G)) return;
    G.fireTimer = window.Aliens.fireInterval(G);
    var alive = window.Aliens.alive(G);
    if (!alive.length) return;
    var cols = {};
    alive.forEach(function (a) {
      if (!cols[a.col] || cols[a.col].y < a.y) cols[a.col] = a;
    });
    var keys = Object.keys(cols);
    var shooter = cols[keys[(Math.random() * keys.length) | 0]];
    G.bombs.push({ x: shooter.x + shooter.w / 2, y: shooter.y + shooter.h, w: 4, h: 12, anim: 0 });
  }

  function updateBombs(dt) {
    var sp = window.Aliens.bombSpeed(G);
    for (var i = G.bombs.length - 1; i >= 0; i--) {
      var b = G.bombs[i];
      b.y += sp * dt;
      b.anim += dt;
      if (b.y > H) G.bombs.splice(i, 1);
    }
  }

  function updateUfo(dt) {
    if (G.ufo) {
      G.ufo.x += G.ufo.dir * 130 * dt;
      if (G.ufo.x < -40 || G.ufo.x > W + 40) G.ufo = null;
      return;
    }
    G.ufoTimer -= dt;
    if (G.ufoTimer > 0) return;
    G.ufoTimer = 18 + Math.random() * 12;
    var dir = Math.random() < 0.5 ? 1 : -1;
    G.ufo = { x: dir === 1 ? -36 : W, dir: dir, w: 32, h: 14 };
    window.Sfx.tone(1200, 0.1, "square", 0.06);
  }

  function updateFx(dt) {
    var i;
    for (i = G.popups.length - 1; i >= 0; i--) {
      G.popups[i].t -= dt;
      G.popups[i].y -= 24 * dt;
      if (G.popups[i].t <= 0) G.popups.splice(i, 1);
    }
    for (i = G.explosions.length - 1; i >= 0; i--) {
      G.explosions[i].t -= dt;
      if (G.explosions[i].t <= 0) G.explosions.splice(i, 1);
    }
  }

  function bassLoop(dt) {
    if (G.mode !== "playing") return;
    G.bassTimer -= dt;
    if (G.bassTimer > 0) return;
    var notes = [98, 92.5, 87.3, 82.4];
    window.Sfx.tone(notes[G.bassStep % 4], 0.11, "triangle", 0.14);
    G.bassStep++;
    G.bassTimer = Math.max(0.14, window.Aliens.stepInterval(G) * 3);
  }

  function update(dt) {
    if (G.mode === "playing") {
      updatePlayer(dt);
      updateBullet(dt);
      updateAliens(dt);
      if (G.mode !== "playing") return;
      alienFire(dt);
      updateBombs(dt);
      updateUfo(dt);
      updateFx(dt);
      bassLoop(dt);
      collideAll();
      if (G.mode === "playing" && window.Aliens.alive(G).length === 0) {
        if (G.bossSpec && !G.bossSpawned) {
          G.bossSpawned = true;
          window.Aliens.spawnBoss(G, G.bossSpec, W);
          showMessage("Boss " + G.bossSpec.label + " — détruisez-le !");
        } else {
          G.mode = "waveclear";
          G.timer = 2.2;
          saveHiscore();
          showMessage("Vague " + G.level + " terminée !");
        }
      }
    } else if (G.mode === "dying") {
      updateFx(dt);
      G.timer -= dt;
      if (G.timer <= 0 && G.lives > 0) {
        G.playerX = W / 2 - 13;
        G.bullet = null;
        G.bombs = [];
        G.mode = "playing";
        showMessage("");
      } else if (G.timer <= 0) {
        endGame();
      }
    } else if (G.mode === "waveclear") {
      updateFx(dt);
      G.timer -= dt;
      if (G.timer <= 0) {
        G.level++;
        startWave();
      }
    }
  }

  function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function collideAll() {
    collideBullet();
    collideBombs();
  }

  function hitAlien(a) {
    G.bullet.hit = true;
    a.hp -= 1;
    if (a.hp > 0) {
      G.bullet = null;
      G.popups.push({ x: a.x + a.w / 2, y: a.y, text: String(a.hp), t: 0.6 });
      window.Sfx.tone(500, 0.08, "square", 0.07, 300);
      return;
    }
    a.alive = false;
    G.bullet = null;
    G.score += a.points * G.mult.value();
    G.mult.hit();
    G.explosions.push({ x: a.x, y: a.y, t: 0.25 });
    window.Sfx.tone(300, 0.15, "sawtooth", 0.09, 60);
    syncHud();
    notify("onKill", { alien: publicAlien(a), mult: G.mult.value(), score: G.score });
    if (a.boss) onBossKilled();
  }

  function hitUfo() {
    G.bullet.hit = true;
    var gained = UFO_SCORES[G.shotsFired % UFO_SCORES.length] * G.mult.value();
    G.score += gained;
    G.mult.hit();
    G.popups.push({ x: G.ufo.x + 16, y: UFO_Y, text: "+" + gained, t: 1.2 });
    G.ufo = null;
    G.bullet = null;
    window.Sfx.tone(1200, 0.3, "square", 0.09, 100);
    syncHud();
    notify("onKill", { alien: publicAlien(null), mult: G.mult.value(), score: G.score });
  }

  function collideBullet() {
    var b = G.bullet;
    if (!b) return;
    var alive = window.Aliens.alive(G);
    for (var i = 0; i < alive.length; i++) {
      var a = alive[i];
      if (overlap(b.x, b.y, b.w, b.h, a.x, a.y, a.w, a.h)) {
        hitAlien(a);
        return;
      }
    }
    if (G.ufo && overlap(b.x, b.y, b.w, b.h, G.ufo.x, UFO_Y, G.ufo.w, G.ufo.h)) {
      hitUfo();
      return;
    }
    for (var j = 0; j < G.shields.length; j++) {
      var s = G.shields[j];
      if (window.Shields.hit(s, b.x, b.y, b.w, b.h)) {
        window.Shields.damage(s, b.x + b.w / 2, b.y);
        G.bullet = null;
        return;
      }
    }
    for (var k = G.bombs.length - 1; k >= 0; k--) {
      var bomb = G.bombs[k];
      if (overlap(b.x, b.y, b.w, b.h, bomb.x - 2, bomb.y, bomb.w, bomb.h)) {
        G.bombs.splice(k, 1);
        G.bullet = null;
        return;
      }
    }
  }

  function collideBombs() {
    for (var i = G.bombs.length - 1; i >= 0; i--) {
      var b = G.bombs[i];
      var gone = bombHitsShield(b);
      if (!gone && overlap(b.x - 2, b.y, b.w, b.h, G.playerX, PLAYER_Y, 26, 16)) {
        gone = true;
        killPlayer();
      }
      if (gone) G.bombs.splice(i, 1);
    }
  }

  function bombHitsShield(b) {
    for (var j = 0; j < G.shields.length; j++) {
      var s = G.shields[j];
      if (window.Shields.hit(s, b.x - 2, b.y, b.w, b.h)) {
        window.Shields.damage(s, b.x, b.y + b.h);
        return true;
      }
    }
    return false;
  }

  function killPlayer() {
    if (G.mode !== "playing") return;
    G.lives--;
    G.mult.lifeLost();
    G.mode = "dying";
    G.timer = 1.4;
    G.explosions.push({ x: G.playerX, y: PLAYER_Y, t: 1.4, player: true });
    window.Sfx.tone(200, 0.5, "sawtooth", 0.12, 30);
    saveHiscore();
    syncHud();
    notify("onMiss", { mult: G.mult.value() });
    showMessage(G.lives > 0 ? "Touché ! " + G.lives + " vie(s) restante(s)." : "");
  }

  function endGame() {
    G.mode = "gameover";
    saveHiscore();
    syncHud();
    showMessage("Partie terminée — score : " + G.score + ". Recommencer ?");
  }

  function onBossKilled() {
    G.mode = "victory";
    saveHiscore();
    syncHud();
    showMessage("Niveau terminé — boss vaincu ! Score : " + G.score + ".");
    notify("onVictory", { score: G.score, level: G.level, boss: G.bossSpec.label });
  }

  function notify(name, data) {
    var d = window.Dashboard;
    if (d && typeof d[name] === "function") d[name](data);
  }

  function publicAlien(a) {
    if (!a) return { label: null, kind: "UFO", boss: false, points: 0 };
    return { label: a.label, kind: a.kind, boss: !!a.boss, points: a.points };
  }

  function syncHud() {
    ui.score.textContent = G.score;
    ui.hiscore.textContent = G.hiscore;
    ui.lives.textContent = G.lives;
    ui.level.textContent = G.level;
    ui.focus.textContent = "x" + G.mult.value();
  }

  function showMessage(text) {
    ui.message.textContent = text;
  }

  function pressPrimary() {
    if (G.mode === "title" || G.mode === "gameover" || G.mode === "victory") startGame();
    else playerFire();
  }

  function pressConfirm() {
    if (G.mode === "title" || G.mode === "gameover" || G.mode === "victory") startGame();
  }

  function toggleSound() {
    var next = !window.Sfx.isOn();
    window.Sfx.setOn(next);
    ui.sound.textContent = next ? "Son : oui" : "Son : non";
    ui.sound.setAttribute("aria-pressed", String(next));
  }

  function snapshot() {
    return {
      mode: G.mode, score: G.score, frame: G.frame,
      playerX: G.playerX, bullet: G.bullet, bombs: G.bombs,
      aliens: window.Aliens.alive(G), shields: G.shields, ufo: G.ufo,
      popups: G.popups, explosions: G.explosions
    };
  }

  function loop(last) {
    var step = function (now) {
      try {
        var dt = Math.min(0.05, (now - last) / 1000);
        update(dt);
        window.Render.draw(snapshot());
      } finally {
        last = now;
        window.requestAnimationFrame(step);
      }
    };
    return step;
  }

  function init(canvasId, ids) {
    G = newState();
    var canvas = document.getElementById(canvasId);
    window.Aliens.init(W);
    window.Render.init(canvas, { playerY: PLAYER_Y, ufoY: UFO_Y });
    Object.keys(ids).forEach(function (k) {
      ui[k] = document.getElementById(ids[k]);
    });
    G.shields = window.Shields.build(W, H);
    window.Aliens.spawn(G, G.levelSpecs);
    syncHud();
    showMessage("Appuyez sur Démarrer (ou Espace).");
    window.Input.init(ui, G.keys, {
      primary: pressPrimary,
      confirm: pressConfirm,
      start: startGame,
      togglePause: togglePause,
      toggleSound: toggleSound
    });
    window.Render.draw(snapshot());
    window.requestAnimationFrame(loop(performance.now()));
    if (/[?&]play=1/.test(window.location.search)) startGame();
  }

  window.SpaceInvaders = {
    init: init,
    applyLevel: function (specFor, bossSpec) { if (G) applyLevel(specFor, bossSpec); }
  };
  window.__spaceInvaders = {
    get mode() { return G && G.mode; },
    get score() { return G && G.score; },
    start: function () { if (G) startGame(); }
  };
})();

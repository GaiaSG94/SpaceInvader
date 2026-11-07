/* Démarrage : jeu à gauche, panneau GitHub + tableau de bord à droite. */
(function () {
  "use strict";

  function boot() {
    window.SpaceInvaders.init("game", {
      score: "score",
      hiscore: "hiscore",
      lives: "lives",
      level: "level",
      focus: "focus",
      message: "game-message",
      start: "btn-start",
      pause: "btn-pause",
      restart: "btn-restart",
      sound: "btn-sound",
      touchLeft: "touch-left",
      touchRight: "touch-right",
      touchFire: "touch-fire"
    });
    window.Dashboard.init();
    window.GitHubPanel.init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

/* Entrées du jeu : clavier, boutons et contrôles tactiles. */
(function () {
  "use strict";

  var keys = null;
  var actions = null;

  function isLeftKey(key) {
    return key === "ArrowLeft" || key === "a" || key === "A" || key === "q" || key === "Q";
  }

  function isRightKey(key) {
    return key === "ArrowRight" || key === "d" || key === "D";
  }

  function onKeyDown(ev) {
    if (isLeftKey(ev.key)) {
      keys.left = true;
      ev.preventDefault();
    } else if (isRightKey(ev.key)) {
      keys.right = true;
      ev.preventDefault();
    } else if (ev.key === " ") {
      ev.preventDefault();
      actions.primary();
    } else if (ev.key === "p" || ev.key === "P") {
      actions.togglePause();
    } else if (ev.key === "Enter") {
      actions.confirm();
    }
  }

  function onKeyUp(ev) {
    if (isLeftKey(ev.key)) keys.left = false;
    else if (isRightKey(ev.key)) keys.right = false;
  }

  function bindHold(el, name) {
    var on = function (ev) { ev.preventDefault(); window.Sfx.ensure(); keys[name] = true; };
    var off = function (ev) { ev.preventDefault(); keys[name] = false; };
    el.addEventListener("pointerdown", on);
    el.addEventListener("pointerup", off);
    el.addEventListener("pointerleave", off);
    el.addEventListener("pointercancel", off);
  }

  function init(ui, keysObj, acts) {
    keys = keysObj;
    actions = acts;
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    bindHold(ui.touchLeft, "left");
    bindHold(ui.touchRight, "right");
    ui.touchFire.addEventListener("click", function (ev) {
      ev.preventDefault();
      actions.primary();
    });
    ui.start.addEventListener("click", actions.start);
    ui.restart.addEventListener("click", actions.start);
    ui.pause.addEventListener("click", actions.togglePause);
    ui.sound.addEventListener("click", actions.toggleSound);
  }

  window.Input = { init: init };
})();

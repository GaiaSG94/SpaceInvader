/* Mini-synthèse sonore Web Audio : bips d'arcade, aucun fichier. */
(function () {
  "use strict";

  var ctx = null;
  var on = true;

  function ensure() {
    if (!on) return;
    try {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
      }
      if (ctx.state === "suspended") ctx.resume();
    } catch (e) { /* son indisponible */ }
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (!on || !ctx) return;
    try {
      var t = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur);
    } catch (e) { /* son ignoré */ }
  }

  function setOn(value) {
    on = value;
    if (on) ensure();
  }

  function isOn() {
    return on;
  }

  window.Sfx = { ensure: ensure, tone: tone, setOn: setOn, isOn: isOn };
})();

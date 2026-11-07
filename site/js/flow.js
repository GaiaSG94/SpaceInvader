/* Flow GitHub sans LLM : issues -> niveau (aliens, boss),
 * multiplicateur de focus x1/x3/x5. Pur, sans DOM (testable via node). */
(function () {
  "use strict";

  var MAX_SLOTS = 22; // 2 rangées du bas x 11 colonnes
  var FIRST_BUG_ROW = 3;

  var CRIT_WORDS = ["critical", "critique", "p0", "urgent", "bloquant", "blocker"];
  var BUG_WORDS = ["bug", "defect", "défaut", "regression", "régression"];

  function labelNames(issue) {
    return (issue.labels || []).map(function (l) {
      return String(l.name || l).toLowerCase();
    });
  }

  function hasWord(names, words) {
    return names.some(function (n) {
      return words.some(function (w) { return n.indexOf(w) >= 0; });
    });
  }

  function severity(issue) {
    var names = labelNames(issue);
    if (hasWord(names, CRIT_WORDS)) return { name: "critique", hp: 3, points: 150, color: "#e05555" };
    if (hasWord(names, BUG_WORDS)) return { name: "bug", hp: 2, points: 100, color: "#ffb020" };
    return { name: "tâche", hp: 1, points: 50, color: null };
  }

  function buildLevel(issues) {
    var list = (issues || []).slice(0, MAX_SLOTS);
    var specs = list.map(function (issue) {
      var sev = severity(issue);
      return {
        number: issue.number, title: issue.title,
        hp: sev.hp, points: sev.points, color: sev.color, severity: sev.name
      };
    });
    var crits = specs.filter(function (s) { return s.severity === "critique"; });
    var boss = null;
    if (crits.length > 0) {
      var hp = Math.min(6 + 2 * crits.length, 12);
      boss = {
        kind: "OCTOPUS", scale: 3, hp: hp, maxHp: hp, points: 500,
        label: "#" + crits[0].number, color: "#e05555", title: crits[0].title
      };
    }
    return {
      specs: specs,
      boss: boss,
      summary: {
        total: specs.length,
        critique: crits.length,
        bug: specs.filter(function (s) { return s.severity === "bug"; }).length,
        autre: specs.filter(function (s) { return s.severity === "tâche"; }).length,
        boss: !!boss
      }
    };
  }

  function specFor(level) {
    return function (col, row) {
      if (row < FIRST_BUG_ROW) return null;
      var spec = level.specs[(row - FIRST_BUG_ROW) * 11 + col];
      if (!spec) return null;
      return {
        kind: "OCTOPUS", hp: spec.hp, points: spec.points,
        label: "#" + spec.number, color: spec.color
      };
    };
  }

  function createMultiplier() {
    var streak = 0;
    function value() {
      if (streak >= 8) return 5;
      if (streak >= 3) return 3;
      return 1;
    }
    return {
      hit: function () { streak++; },
      miss: function () { streak = 0; },
      lifeLost: function () { streak = 0; },
      value: value,
      streak: function () { return streak; }
    };
  }

  window.Flow = {
    buildLevel: buildLevel, specFor: specFor,
    createMultiplier: createMultiplier, MAX_SLOTS: MAX_SLOTS
  };
})();

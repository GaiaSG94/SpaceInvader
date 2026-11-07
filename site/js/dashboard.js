/* Tableau de bord : dépôt GitHub, issues -> niveau, statut IA, récompense.
 * Titres d'issues affichés en textContent uniquement (contenu non fiable). */
(function () {
  "use strict";

  var els = {};
  var issues = [];
  var level = null;
  var launching = false;

  function $(id) {
    return document.getElementById(id);
  }

  function cache() {
    els.repo = $("repo-select");
    els.load = $("btn-load");
    els.launch = $("btn-launch");
    els.issues = $("issues-list");
    els.level = $("level-info");
    els.ai = $("ai-status");
    els.reward = $("reward-info");
    els.focus = $("focus-line");
  }

  function setMuted(el, text) {
    el.textContent = text;
    el.className = "muted";
  }

  function clearChildren(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function addOption(value, text) {
    var opt = document.createElement("option");
    opt.value = value;
    opt.textContent = text;
    els.repo.appendChild(opt);
  }

  function addIssueLine(text, muted) {
    var li = document.createElement("li");
    if (muted) li.className = "muted";
    li.textContent = text;
    els.issues.appendChild(li);
  }

  function renderAI() {
    var st = window.AI.status();
    els.ai.textContent = st.message;
    els.ai.className = st.ready ? "ok" : "muted";
  }

  function renderFocus(mult) {
    var suffix = mult >= 5 ? " — performance maximale" : mult >= 3 ? " — en forme" : "";
    els.focus.textContent = "Focus x" + mult + suffix;
  }

  function resetAll(message) {
    issues = [];
    level = null;
    clearChildren(els.repo);
    addOption("", message || "Connectez-vous d'abord");
    els.repo.disabled = true;
    els.load.disabled = true;
    els.launch.disabled = true;
    clearChildren(els.issues);
    addIssueLine("Aucun dépôt chargé.", true);
    setMuted(els.level, "Vague classique.");
    setMuted(els.reward, "Terrassez le boss pour valider le niveau.");
    renderFocus(1);
  }

  function onConnected() {
    window.GitHub.listRepos().then(function (repos) {
      clearChildren(els.repo);
      if (!repos.length) {
        addOption("", "Aucun dépôt accessible");
        return;
      }
      repos.forEach(function (r) { addOption(r.full_name, r.full_name); });
      els.repo.disabled = false;
      els.load.disabled = false;
    }).catch(function () {
      resetAll("Dépôts inaccessibles — vérifiez le jeton.");
    });
  }

  function onDisconnected() {
    resetAll();
  }

  function loadIssues() {
    var full = els.repo.value;
    if (!full || full.indexOf("/") < 0) return;
    var parts = full.split("/");
    els.load.disabled = true;
    setMuted(els.level, "Chargement des issues…");
    window.GitHub.listIssues(parts[0], parts[1]).then(function (list) {
      issues = list;
      level = window.Flow.buildLevel(issues);
      renderIssues();
      renderLevel();
      els.load.disabled = false;
      els.launch.disabled = false;
    }).catch(function () {
      setMuted(els.level, "Issues inaccessibles.");
      els.load.disabled = false;
    });
  }

  function sevClass(severity) {
    return "sev-" + severity.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function renderIssues() {
    clearChildren(els.issues);
    if (!level.specs.length) {
      addIssueLine("Aucune issue ouverte — vague classique.", true);
      return;
    }
    level.specs.forEach(function (s) {
      var li = document.createElement("li");
      li.setAttribute("data-issue", "#" + s.number);
      var chip = document.createElement("span");
      chip.className = "chip " + sevClass(s.severity);
      chip.textContent = s.severity + " · " + s.hp + " PV";
      var label = document.createElement("strong");
      label.textContent = "#" + s.number + " ";
      var title = document.createElement("span");
      title.textContent = s.title;
      li.appendChild(chip);
      li.appendChild(document.createTextNode(" "));
      li.appendChild(label);
      li.appendChild(title);
      els.issues.appendChild(li);
    });
    if (issues.length > level.specs.length) {
      addIssueLine("+" + (issues.length - level.specs.length) + " autre(s) hors niveau.", true);
    }
  }

  function renderLevel() {
    var s = level.summary;
    var text = s.total + " alien(s) ciblé(s) — " + s.critique + " critique(s), " + s.bug + " bug(s)";
    if (s.boss) text += " — BOSS inclus";
    els.level.textContent = text;
    els.level.className = "";
  }

  function launch() {
    if (launching || !level) return;
    launching = true;
    try {
      window.SpaceInvaders.applyLevel(window.Flow.specFor(level), level.boss);
      setMuted(els.reward, "Niveau lancé — détruisez les aliens ciblés" + (level.boss ? ", puis le boss." : "."));
      window.__spaceInvaders.start();
    } finally {
      launching = false;
    }
  }

  function onKill(data) {
    renderFocus(data.mult);
    if (!data.alien || !data.alien.label) return;
    var li = els.issues.querySelector('[data-issue="' + data.alien.label + '"]');
    if (li) li.className = "destroyed";
  }

  function onMiss(data) {
    renderFocus(data.mult);
  }

  function onVictory(summary) {
    var plan = window.AI.planFix();
    els.reward.textContent = "Boss " + summary.boss + " vaincu — score " + summary.score + ". "
      + plan.message + " La PR sera créée automatiquement une fois l'agent configuré.";
    els.reward.className = "";
  }

  function init() {
    cache();
    els.load.addEventListener("click", loadIssues);
    els.launch.addEventListener("click", launch);
    resetAll();
    renderAI();
  }

  window.Dashboard = {
    init: init, onConnected: onConnected, onDisconnected: onDisconnected,
    onKill: onKill, onMiss: onMiss, onVictory: onVictory
  };
})();

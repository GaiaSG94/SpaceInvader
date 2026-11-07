/* Panneau de connexion GitHub.
 * Le jeton reste dans le localStorage DE CE NAVIGATEUR uniquement :
 * chaque visiteur a son propre stockage, aucun serveur ne voit les jetons.
 * Le jeton n'est envoyé qu'à api.github.com, en HTTPS. */
(function () {
  "use strict";

  var STORAGE_KEY = "spaceinvader.github_token";
  var API_USER_URL = "https://api.github.com/user";

  var els = {};
  var busy = false;

  function $(id) {
    return document.getElementById(id);
  }

  function cacheElements() {
    els.input = $("token-input");
    els.connect = $("btn-connect");
    els.disconnect = $("btn-disconnect");
    els.status = $("github-status");
    els.account = $("account");
    els.avatar = $("account-avatar");
    els.login = $("account-login");
    els.link = $("account-link");
  }

  function setStatus(text, kind) {
    els.status.textContent = text;
    els.status.className = "status" + (kind ? " " + kind : "");
  }

  function readStoredToken() {
    try {
      return window.localStorage.getItem(STORAGE_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  function writeStoredToken(token) {
    try {
      window.localStorage.setItem(STORAGE_KEY, token);
      return true;
    } catch (e) {
      return false;
    }
  }

  function clearStoredToken() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* stockage indisponible : rien à effacer */ }
  }

  function fingerprint(token) {
    if (!token || token.length < 4) return "????";
    return token.slice(-4);
  }

  function fetchUser(token) {
    return fetch(API_USER_URL, {
      method: "GET",
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": "Bearer " + token
      }
    }).then(function (res) {
      if (res.status === 401 || res.status === 403) {
        throw new Error("bad-credentials");
      }
      if (!res.ok) {
        throw new Error("http-" + res.status);
      }
      return res.json();
    }).catch(function (err) {
      if (err && (err.message === "bad-credentials" || err.message.indexOf("http-") === 0)) {
        throw err;
      }
      throw new Error("network");
    });
  }

  function api(path) {
    var token = readStoredToken();
    if (!token) return Promise.reject(new Error("no-token"));
    return fetch("https://api.github.com" + path, {
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": "Bearer " + token
      }
    }).then(function (res) {
      if (!res.ok) throw new Error("http-" + res.status);
      return res.json();
    });
  }

  function listRepos() {
    return api("/user/repos?per_page=100&sort=updated").then(function (repos) {
      return repos.map(function (r) { return { full_name: r.full_name }; });
    });
  }

  function listIssues(owner, repo) {
    var path = "/repos/" + owner + "/" + repo + "/issues?state=open&per_page=50";
    return api(path).then(function (items) {
      return items.filter(function (i) { return !i.pull_request; }).map(function (i) {
        return {
          number: i.number,
          title: i.title,
          labels: (i.labels || []).map(function (l) { return { name: l.name }; })
        };
      });
    });
  }

  function showConnected(user, token) {
    els.account.hidden = false;
    els.avatar.src = user.avatar_url || "";
    els.avatar.alt = "Avatar de " + user.login;
    els.login.textContent = user.login;
    els.link.href = user.html_url || ("https://github.com/" + user.login);
    els.connect.disabled = true;
    els.disconnect.disabled = false;
    els.input.value = "";
    els.input.placeholder = "Connecté (jeton ••••" + fingerprint(token) + ")";
    setStatus("Connecté en tant que " + user.login + ".", "ok");
    if (window.Dashboard) window.Dashboard.onConnected(user);
  }

  function showDisconnected(message, kind) {
    els.account.hidden = true;
    els.avatar.removeAttribute("src");
    els.connect.disabled = false;
    els.disconnect.disabled = true;
    els.input.placeholder = "github_pat_… ou ghp_…";
    setStatus(message || "Non connecté.", kind || "");
    if (window.Dashboard) window.Dashboard.onDisconnected();
  }

  function connectWith(token) {
    if (busy) return;
    token = (token || "").trim();
    if (!token) {
      setStatus("Collez d'abord un jeton d'accès.", "error");
      return;
    }
    busy = true;
    els.connect.disabled = true;
    setStatus("Vérification du jeton…");
    fetchUser(token).then(function (user) {
      if (!writeStoredToken(token)) {
        setStatus("Token valide mais stockage local impossible.", "error");
        return;
      }
      showConnected(user, token);
    }).catch(function (err) {
      if (err && err.message === "bad-credentials") {
        showDisconnected("Jeton invalide ou expiré.", "error");
      } else if (err && err.message === "network") {
        showDisconnected("Réseau injoignable : réessayez plus tard.", "error");
      } else {
        showDisconnected("Erreur GitHub : " + (err && err.message), "error");
      }
    }).then(function () {
      busy = false;
      if (els.account.hidden) els.connect.disabled = false;
    });
  }

  function disconnect() {
    clearStoredToken();
    showDisconnected("Déconnecté. Le jeton a été effacé de ce navigateur.");
  }

  function restoreSession() {
    var token = readStoredToken();
    if (!token) {
      showDisconnected("Non connecté.");
      return;
    }
    setStatus("Reconnexion…");
    fetchUser(token).then(function (user) {
      showConnected(user, token);
    }).catch(function () {
      clearStoredToken();
      showDisconnected("Jeton enregistré invalide : reconnectez-vous.", "error");
    });
  }

  function init() {
    cacheElements();
    els.connect.addEventListener("click", function () {
      connectWith(els.input.value);
    });
    els.input.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") connectWith(els.input.value);
    });
    els.disconnect.addEventListener("click", disconnect);
    restoreSession();
  }

  window.GitHubPanel = { init: init };
  window.GitHub = { listRepos: listRepos, listIssues: listIssues };
})();

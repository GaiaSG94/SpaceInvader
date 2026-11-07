/* Point d'intégration IA — AUCUN fournisseur configuré.
 *
 * Il n'y a pas de clé LLM (pas de crédits Kiro pour l'instant), donc :
 * - aucune requête IA n'est émise, aucun jeton n'est demandé ;
 * - la victoire sur le boss affiche la récompense "en attente de clé".
 *
 * Pour activer plus tard (Kiro, Bedrock, Anthropic, OpenAI) :
 * 1. Ajouter un fournisseur implémentant planFix(issue, code) -> { diff, title, body }.
 * 2. Le brancher ici via AI.configure({ provider, apiKey }) depuis un
 *    écran de réglages (clé en localStorage, comme le jeton GitHub).
 * 3. Le tableau de bord appellera planFix() à la victoire puis créera
 *    la PR via l'API GitHub (POST /repos/{o}/{r}/pulls). */
(function () {
  "use strict";

  function status() {
    return {
      ready: false,
      provider: "none",
      message: "IA non configurée — ajoutez une clé (Kiro/Bedrock/…) pour activer l'agent correctif."
    };
  }

  function planFix() {
    return {
      ok: false,
      error: "NO_LLM_KEY",
      message: "Aucune clé LLM : l'agent ne peut pas générer de correctif pour l'instant."
    };
  }

  function configure() {
    throw new Error("NO_LLM_PROVIDER: aucun fournisseur IA n'est implémenté dans cette version.");
  }

  window.AI = { name: "none", ready: false, status: status, planFix: planFix, configure: configure };
})();

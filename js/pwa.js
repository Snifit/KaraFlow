/******************************************************************************/
/* Constants                                                                  */
/* Récupération des éléments du DOM pour gérer l'interface d'installation     */
/******************************************************************************/
const INSTALL_BUTTON = document.getElementById("install_button");
const RELOAD_BUTTON = document.getElementById("reload_button");

/******************************************************************************/
/* Global Variable                                                            */
/******************************************************************************/

let beforeInstallPromptEvent;

/******************************************************************************/
/* Main                                                                       */
/* Point d'entrée : Détermine si l'app tourne en mode Navigateur ou App       */
/******************************************************************************/
main();

function main() {
  console.debug("main()");

  // Vérifie si l'utilisateur a lancé l'app depuis son écran d'accueil (appli)
  if (window.matchMedia("(display-mode: standalone)").matches) {
    console.log("Running as PWA");

    // Si on est déjà installés, on cache le bouton d'installation
    INSTALL_BUTTON.style.display = "none";
    registerServiceWorker();
  } else {
    // Sinon, on est dans le navigateur classique, on écoute si l'installation est possible
    console.log("Running as Web page");

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
  }
}


/******************************************************************************/
/* Install PWA                                                                */
/* Gestion de l'événement d'installation personnalisé                         */
/******************************************************************************/
function onBeforeInstallPrompt(event) {
  console.debug("onBeforeInstallPrompt()");

  // On empêche la bannière d'installation par défaut du navigateur d'apparaître
  event.preventDefault();
  // On active notre propre bouton d'installation
  INSTALL_BUTTON.disabled = false;
  // On sauvegarde l'événement pour pouvoir le déclencher plus tard au clic
  beforeInstallPromptEvent = event;
}

async function installPwa() {
  console.debug("installPwa()");

  // Déclenche l'invite d'installation native du navigateur
  const RESULT = await beforeInstallPromptEvent.prompt();
  if (beforeInstallPromptEvent) {

    // Si l'utilisateur accepte l'installation
    if (RESULT.outcome === "accepted") {
      console.log("PWA Install accepted");

      // On cache le bouton car l'app va s'installer
      INSTALL_BUTTON.style.display = "none";
    }

    // On vide la variable car l'événement ne peut être utilisé qu'une seule fois
    beforeInstallPromptEvent = null;
  }
}

function onAppInstalled() {
  console.debug("onAppInstalled()");

  // Nettoyage après une installation réussie
  INSTALL_BUTTON.style.display = "none";
  registerServiceWorker();
}

/******************************************************************************/
/* Register Service Worker                                                    */
/* Enregistrement du script qui gère le cache et le mode hors-ligne           */
/******************************************************************************/
async function registerServiceWorker() {
  console.debug("registerServiceWorker()");

  // Vérification que le navigateur supporte les Service Workers
  if ("serviceWorker" in navigator) {
    console.log("Register Service Worker…");

    try {
      // Enregistrement du fichier service_worker.js situé à la racine
      const REGISTRATION = await navigator.serviceWorker.register("./service_worker.js");

      // On écoute si une nouvelle version du SW est trouvée (mise à jour de l'app)
      REGISTRATION.onupdatefound = onUpdateFound;
      console.log("Service Worker registration successful with scope:", REGISTRATION.scope);
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  } else {
    console.warn("Service Worker not supported…");
  }
}

/******************************************************************************/
/* Update Service Worker                                                      */
/* Gestion du cycle de vie des mises à jour de l'application                  */
/******************************************************************************/
function onUpdateFound(event) {
  const REGISTRATION = event.target;
  // Le nouveau Service Worker en cours d'installation
  const SERVICE_WORKER = REGISTRATION.installing;
  SERVICE_WORKER.addEventListener("statechange", onStateChange);
}

/**************************************/

function onStateChange(event) {
  const SERVICE_WORKER = event.target;
  console.debug("onStateChange", SERVICE_WORKER.state);

  // Si le nouveau sw est installé et qu'il y a déjà un contrôleur (donc une ancienne version active)
  // Cela signifie qu'une mise à jour est prête mais en attente
  if (SERVICE_WORKER.state == "installed" && navigator.serviceWorker.controller) {
    console.log("PWA Updated");
    // On active le bouton pour proposer à l'utilisateur de recharger la page
    RELOAD_BUTTON.disabled = false;
  }
}

/**************************************/

function reloadPwa() {
  console.debug("reloadPwa()");
  // Recharge la page pour activer le nouveau Service Worker
  window.location.reload();
}

/******************************************************************************/
/* Listeners                                                                  */
/* Attachement des événements aux boutons de l'interface                      */
/******************************************************************************/
INSTALL_BUTTON.addEventListener("click", installPwa);
RELOAD_BUTTON.addEventListener("click", reloadPwa);

/******************************************************************************/

/******************************************************************************/
/* Constantes Globales                                                        */
/******************************************************************************/
const THEME_TOGGLE = document.getElementById("theme-toggle");

const LYRICS_FORM = document.getElementById("lyrics-form");
const LYRICS_RESULT = document.getElementById("lyrics-result");

// Le lecteur de l'instru
const BACKING_AUDIO = document.getElementById("backing-audio");
const TRACK_SELECTOR = document.getElementById("track-selector");
const CUSTOM_TRACK_INPUT = document.getElementById("custom-track-input");
const RECORD_BTN = document.getElementById("record-btn");
const STOP_BTN = document.getElementById("stop-btn");

// Le lecteur de la voix seule
const PLAYBACK_AUDIO = document.getElementById("recording-playback");
const PLAY_TOGETHER_BTN = document.getElementById("play-together-btn");
const DOWNLOAD_MIX_BTN = document.getElementById("download-mix-btn");
const SHARE_MIX_BTN = document.getElementById("share-mix-btn");

/* Nouveaux éléments pour Datamuse / Wikimedia (Assistant Rimes) */
const RHYME_FORM = document.getElementById("rhyme-form");
const RHYME_INPUT = document.getElementById("rhyme-input");
const RHYME_RESULT = document.getElementById("rhyme-result");

/* Configuration du LocalStorage pour sauvegarder les préférences */
const STORAGE_THEME = "kara_theme";
const STORAGE_SONG = "kara_last_song";
const STORAGE_LYRICS = "kara_last_lyrics";

// Correction du décalage (120ms)
// C'est le temps moyen que met le navigateur pour traiter le son du micro.
// Sans ça, la voix est toujours en retard sur l'instru.
const LATENCY_COMPENSATION = 0.12;

/******************************************************************************/
/* Variables Globales                                                         */
/******************************************************************************/
let globalMediaRecorder; // L'objet qui gère l'enregistrement micro
let globalChunks = []; // Tableau qui stocke les bouts de son enregistrés
let audioContextInstance;
let waveSurferInstance; // L'objet pour visualiser l'onde sonore
let currentMixBlob; // Stocke le fichier final mixé pour le partage

/******************************************************************************/
/* Initialisation                                                             */
/******************************************************************************/
document.addEventListener("DOMContentLoaded", initApp);

function initApp() {
  initLyricsSearch(); // Prépare la recherche de paroles
  initRhymeAssistant(); // Prépare l'assistant de rimes
  initStudioRecording(); // Prépare le studio (micro, lecteurs)
  loadLastSession(); // Recharge la dernière chanson vue
  initTheme(); // Applique le thème sombre/clair
}

/******************************************************************************/
/* Theme                                                                      */
/* Gestion du mode Sombre / Clair                                             */
/******************************************************************************/
function initTheme() {
  let currentTheme;
  currentTheme = localStorage.getItem(STORAGE_THEME);
  if (currentTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  }
  if (THEME_TOGGLE) {
    THEME_TOGGLE.addEventListener("click", toggleTheme);
  }
}

function toggleTheme() {
  let theme;
  theme = document.documentElement.getAttribute("data-theme");
  if (theme === "dark") {
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem(STORAGE_THEME, "light");
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem(STORAGE_THEME, "dark");
  }
}

/******************************************************************************/
/* Paroles (API LRCLIB)                                                       */
/* Récupération des paroles                                                   */
/******************************************************************************/
function initLyricsSearch() {
  if (LYRICS_FORM) {
    LYRICS_FORM.addEventListener("submit", handleLyricsSubmit);
  }
}

async function handleLyricsSubmit(e) {
  let songInput;
  let artistInput;
  let songVal;
  let artistVal;
  let query;
  let response;
  let data;

  e.preventDefault(); // Empêche le rechargement de la page
  songInput = document.getElementById("song");
  artistInput = document.getElementById("artist");
  songVal = songInput.value.trim();
  artistVal = artistInput.value.trim();

  // Encodage de l'URL pour gérer les espaces et caractères spéciaux
  query = encodeURIComponent(artistVal + " " + songVal);

  LYRICS_RESULT.innerHTML = "<p>Recherche...</p>";

  try {
    // Appel à l'API LRCLIB
    response = await fetch("https://lrclib.net/api/search?q=" + query);
    data = await response.json();
    if (data && data.length > 0) {
      renderResultsList(data);
    } else {
      LYRICS_RESULT.innerHTML = "<p>Aucun resultat.</p>";
    }
  } catch (error) {
    LYRICS_RESULT.innerHTML = "<p>Erreur reseau.</p>";
  }
}

function renderResultsList(results) {
  let i;
  let item;
  let btn;
  LYRICS_RESULT.innerHTML = "<h4>Resultats :</h4>";
  // On affiche les 10 premiers résultats
  for (i = 0; i < results.length; i = i + 1) {
    if (i < 10) {
      item = results[i];
      btn = document.createElement("button");
      btn.className = "mdl-button mdl-js-button mdl-button--raised";
      btn.style.width = "100%";
      btn.style.marginBottom = "8px";
      btn.innerText = item.trackName + " - " + item.artistName;
      btn.onclick = function() {
        displayLyrics(item);
      };
      LYRICS_RESULT.appendChild(btn);
    }
  }
}

function displayLyrics(item) {
  let lyrics;
  lyrics = item.plainLyrics;
  LYRICS_RESULT.innerHTML = "<h4>" + item.trackName + "</h4><pre>" + lyrics + "</pre>";
  // Sauvegarde locale pour retrouver les paroles au prochain lancement
  localStorage.setItem(STORAGE_SONG, item.trackName);
  localStorage.setItem(STORAGE_LYRICS, lyrics);
}

/******************************************************************************/
/* Assistant Rimes (API WIKIMEDIA)                                            */
/* Recherche de mots finissant par les mêmes 3 dernière lettres               */
/******************************************************************************/
function initRhymeAssistant() {
  if (RHYME_FORM) {
    RHYME_FORM.addEventListener("submit", handleRhymeSubmit);
  }
}

async function handleRhymeSubmit(e) {
  let word;
  let suffix;
  let url;
  let response;
  let data;
  let results;
  let i;

  e.preventDefault();
  word = RHYME_INPUT.value.trim().toLowerCase();

  if (word.length < 2) {
    RHYME_RESULT.innerHTML = "Tapez au moins 2 lettres.";
    return;
  }

  RHYME_RESULT.innerHTML = "<i>Analyse du dictionnaire...</i>";

  // On isole les 3 dernières lettres pour chercher la rime
  suffix = word.slice(-3);

  // Utilisation de l'API Wiktionary avec une Regex pour chercher par la fin du mot
  url = "https://fr.wiktionary.org/w/api.php?action=query&list=search&srsearch=intitle:/.*" + suffix + "$/&srlimit=20&format=json&origin=*";

  try {
    response = await fetch(url);
    data = await response.json();

    if (data.query && data.query.search && data.query.search.length > 0) {
      results = [];
      // Transformation des données pour l'affichage
      for (i = 0; i < data.query.search.length; i = i + 1) {
        results.push({
          word: data.query.search[i].title
        });
      }
      renderRhymeResults(results);
    } else {
      RHYME_RESULT.innerHTML = "Aucune rime trouvée pour '" + suffix + "'";
    }
  } catch (err) {
    RHYME_RESULT.innerHTML = "Erreur de connexion au dictionnaire.";
    console.error(err);
  }
}

function renderRhymeResults(data) {
  let i;
  let chip;
  let max;

  RHYME_RESULT.innerHTML = "";
  if (!data || data.length === 0) {
    RHYME_RESULT.innerHTML = "Aucune rime trouvée.";
    return;
  }

  // Limite à 15 rimes pour ne pas inonder l'écran
  if (data.length > 15) {
    max = 15;
  } else {
    max = data.length;
  }

  for (i = 0; i < max; i = i + 1) {
    chip = document.createElement("span");
    chip.className = "mdl-chip";
    chip.style.margin = "2px";
    chip.innerHTML = '<span class="mdl-chip__text">' + data[i].word + '</span>';
    RHYME_RESULT.appendChild(chip);
  }
}

/******************************************************************************/
/* Studio & Wavesurfer                                                        */
/* Gestion de l'enregistrement, du compte à rebours et de la visualisation    */
/******************************************************************************/
function initStudioRecording() {
  initWaveSurfer();
  if (TRACK_SELECTOR) {
    TRACK_SELECTOR.addEventListener("change", changeTrack);
  }
  if (CUSTOM_TRACK_INPUT) {
    CUSTOM_TRACK_INPUT.addEventListener("change", handleCustomTrack);
  }
  if (RECORD_BTN) {
    RECORD_BTN.onclick = startCountdown;
  }
  if (STOP_BTN) {
    STOP_BTN.onclick = stopRecording;
  }
  if (PLAY_TOGETHER_BTN) {
    PLAY_TOGETHER_BTN.onclick = playTogether;
  }
  if (DOWNLOAD_MIX_BTN) {
    DOWNLOAD_MIX_BTN.onclick = initDownloadMix;
  }
  if (SHARE_MIX_BTN) {
    SHARE_MIX_BTN.onclick = onShareMixClick;
  }
}

function onShareMixClick() {
  shareMyMix(currentMixBlob);
}

function initWaveSurfer() {
  if (!document.getElementById('audio-visualizer')) return;
  // Initialisation de la librairie externe pour afficher les ondes
  waveSurferInstance = WaveSurfer.create({
    container: '#audio-visualizer',
    waveColor: '#ee8bb6',
    progressColor: '#6d358c',
    cursorColor: '#ffffff',
    barWidth: 2,
    barRadius: 3,
    responsive: true,
    height: 100,
    media: BACKING_AUDIO // Se synchronise avec le lecteur audio principal
  });
}

// Gere le changement d'instru
function changeTrack(e) {
  let fileUrl;
  if (e.target.value) {
    fileUrl = "audio/" + e.target.value;
    waveSurferInstance.load(fileUrl);
    BACKING_AUDIO.src = fileUrl;
    BACKING_AUDIO.load();
  }
}

function handleCustomTrack(e) {
  let file;
  let fileURL;
  file = e.target.files[0];
  if (file) {
    // Création d'une URL temporaire pour lire le fichier local
    fileURL = URL.createObjectURL(file);
    waveSurferInstance.load(fileURL);
    BACKING_AUDIO.src = fileURL;
    BACKING_AUDIO.load();
  }
}

function startCountdown() {
  let count;
  let timer;
  count = 3;
  RECORD_BTN.disabled = true;

  // Compte à rebours 3-2-1 avant l'enregistrement
  timer = setInterval(function() {
    if (count > 0) {
      RECORD_BTN.innerText = "Début dans " + count;
      // Vibration sur mobile pour le rythme
      if ("vibrate" in navigator) {
        navigator.vibrate(60);
      }
      count = count - 1;
    } else {
      clearInterval(timer);
      launchRecorder();
    }
  }, 1000);
}

async function launchRecorder() {
  let stream;
  try {
    // Demande l'accès au micro
    stream = await navigator.mediaDevices.getUserMedia({
      audio: true
    });
    globalMediaRecorder = new MediaRecorder(stream);
    globalChunks = []; // On vide le buffer précédent

    // Appelé quand des données audio sont disponibles (pendant l'enregistrement)
    globalMediaRecorder.ondataavailable = function(e) {
      if (e.data.size > 0) {
        globalChunks = globalChunks.concat([e.data]);
      }
    };

    // Appelé quand on clique sur STOP
    globalMediaRecorder.onstop = function() {
      let blob;
      // Création du fichier audio final (webm)
      blob = new Blob(globalChunks, {
        type: 'audio/webm'
      });
      PLAYBACK_AUDIO.src = URL.createObjectURL(blob);

      // Réactivation des boutons
      RECORD_BTN.innerText = "Recommencer";
      RECORD_BTN.disabled = false;
      STOP_BTN.disabled = true;
      PLAY_TOGETHER_BTN.disabled = false;
      DOWNLOAD_MIX_BTN.disabled = false;

      // Coupe le micro
      stream.getTracks()[0].stop();
    };

    if ("vibrate" in navigator) {
      navigator.vibrate(200);
    }
    RECORD_BTN.innerText = "Enregistrement...";
    STOP_BTN.disabled = false;

    // Remise à zéro et lecture de l'instru
    BACKING_AUDIO.currentTime = 0;
    BACKING_AUDIO.play();
    globalMediaRecorder.start();
  } catch (err) {
    alert("Micro introuvable.");
    RECORD_BTN.disabled = false;
  }
}

function stopRecording() {
  if (globalMediaRecorder && globalMediaRecorder.state !== "inactive") {
    globalMediaRecorder.stop();
    BACKING_AUDIO.pause();
  }
}

/******************************************************************************/
/* Mixage & Partage                                                           */
/* Fusion des pistes audio et génération du fichier WAV final                 */
/******************************************************************************/
function playTogether() {
  // Lecture simple des deux lecteurs html en même temps (pour prévisualisation)
  BACKING_AUDIO.currentTime = 0;
  PLAYBACK_AUDIO.currentTime = 0;
  PLAYBACK_AUDIO.play();
  BACKING_AUDIO.play();
}

async function initDownloadMix() {
  let audioCtx;
  let resInstru;
  let resVoice;
  let arrayInstru;
  let arrayVoice;
  let instruBuffer;
  let voiceBuffer;
  let finalDur;
  let offlineCtx;
  let instruSrc;
  let voiceSrc;
  let renderedBuffer;
  let link;

  DOWNLOAD_MIX_BTN.disabled = true;
  DOWNLOAD_MIX_BTN.innerText = "Mixage...";

  try {
    // Initialisation du contexte web audio api
    audioCtx = new(window.AudioContext || window.webkitAudioContext)();

    // Récupération des fichiers audio bruts
    resInstru = await fetch(BACKING_AUDIO.src);
    resVoice = await fetch(PLAYBACK_AUDIO.src);

    // Conversion en ArrayBuffer
    arrayInstru = await resInstru.arrayBuffer();
    arrayVoice = await resVoice.arrayBuffer();

    // 3. Décodage en AudioBuffer (forme d'onde manipulable)
    instruBuffer = await audioCtx.decodeAudioData(arrayInstru);
    voiceBuffer = await audioCtx.decodeAudioData(arrayVoice);

    // Calcul de la durée totale (la plus longue des deux pistes)
    if (voiceBuffer.duration > instruBuffer.duration) {
      finalDur = voiceBuffer.duration;
    } else {
      finalDur = instruBuffer.duration;
    }

    // Création d'un contexte de rendu Hors-Ligne (Offline)
    // C'est lui qui va "calculer" le mixage sans le jouer dans les enceintes
    offlineCtx = new OfflineAudioContext(2, audioCtx.sampleRate * finalDur, audioCtx.sampleRate);

    // Préparation des sources
    instruSrc = offlineCtx.createBufferSource();
    instruSrc.buffer = instruBuffer;

    voiceSrc = offlineCtx.createBufferSource();
    voiceSrc.buffer = voiceBuffer;

    // Connexion à la sortie (Destination)
    instruSrc.connect(offlineCtx.destination);
    voiceSrc.connect(offlineCtx.destination);

    // Planification de la lecture
    instruSrc.start(0);

    // IMPORTANT : Application de la compensation de latence
    // On décale le début de la voix de 0.12s pour qu'elle soit calée sur le temps
    voiceSrc.start(0, LATENCY_COMPENSATION);

    // Rendu du mixage
    renderedBuffer = await offlineCtx.startRendering();

    // Conversion du buffer brut en fichier WAV
    currentMixBlob = bufferToWave(renderedBuffer, renderedBuffer.length);

    // Téléchargement automatique
    link = document.createElement("a");
    link.href = URL.createObjectURL(currentMixBlob);
    link.download = "KaraFlow_Mix.wav";
    link.click();

    // Affichage du bouton de partage
    if (SHARE_MIX_BTN) {
      SHARE_MIX_BTN.style.display = "block";
    }
    DOWNLOAD_MIX_BTN.disabled = false;
    DOWNLOAD_MIX_BTN.innerText = "Telecharger mon morceau (.wav)";
  } catch (e) {
    alert("Erreur mixage.");
    DOWNLOAD_MIX_BTN.disabled = false;
  }
}

async function shareMyMix(wavBlob) {
  let file;
  let shareData;
  let canShareFiles;

  if (!wavBlob) {
    alert("Rien à partager");
    return;
  }
  // Création d'un objet File à partir du Blob pour l'api de partage
  file = new File([wavBlob], "Mon_Mix_KaraFlow.wav", {
    type: "audio/wav"
  });
  shareData = {
    title: "KaraFlow Studio",
    text: "Écoute mon mix !",
    files: [file]
  };

  // Vérification si le navigateur supporte le partage de fichiers
  canShareFiles = false;
  if (navigator.canShare && navigator.canShare(shareData)) {
    canShareFiles = true;
  }

  try {
    if (canShareFiles) {
      // Ouverture de la fenêtre native de partage
      await navigator.share(shareData);
    } else {
      alert("Le navigateur ne supporte pas le partage de fichiers audio ici.");
    }
  } catch (err) {
    console.log("Partage annulé");
  }
}

/******************************************************************************/
/* Utilitaire WAV                                                             */
/* Fonction qui écrit les octets du fichier wav à la main                     */
/******************************************************************************/
function bufferToWave(abuffer, len) {
  let numOfChan;
  let length;
  let buffer;
  let view;
  let pos;
  let offset;
  let i;
  let sample;
  let channels = [];

  numOfChan = abuffer.numberOfChannels;
  // Calcul de la taille du fichier : (durée * canaux * 2 octets) + 44 octets d'en-tête
  length = len * numOfChan * 2 + 44;
  buffer = new ArrayBuffer(length);
  view = new DataView(buffer);
  pos = 0;
  offset = 0;

  // Ecriture de l'en-tête WAV standard

  view.setUint32(pos, 0x46464952, true);
  pos = pos + 4;

  // taille du fichier - 8
  view.setUint32(pos, length - 8, true);
  pos = pos + 4;

  // "WAVE"
  view.setUint32(pos, 0x45564157, true);
  pos = pos + 4;

  // "fmt " chunk
  view.setUint32(pos, 0x20746d66, true);
  pos = pos + 4;

  // taille du chunk fmt = 16
  view.setUint32(pos, 16, true);
  pos = pos + 4;

  // Format PCM
  view.setUint16(pos, 1, true);
  pos = pos + 2;

  // Nombre de canaux (Mono/Stereo)
  view.setUint16(pos, numOfChan, true);
  pos = pos + 2;

  // Fréquence d'échantillonnage (Sample Rate)
  view.setUint32(pos, abuffer.sampleRate, true);
  pos = pos + 4;

  // Byte rate
  view.setUint32(pos, abuffer.sampleRate * 2 * numOfChan, true);
  pos = pos + 4;

  // Block align
  view.setUint16(pos, numOfChan * 2, true);
  pos = pos + 2;

  // Bits par sample (16 bits)
  view.setUint16(pos, 16, true);
  pos = pos + 2;

  // "data" chunk
  view.setUint32(pos, 0x61746164, true);
  pos = pos + 4;

  // Taille des données audio
  view.setUint32(pos, length - pos - 4, true);
  pos = pos + 4;

  // Récupération des données brutes de chaque canal
  for (i = 0; i < numOfChan; i = i + 1) {
    channels.push(abuffer.getChannelData(i));
  }

  // Conversion PCM (Flottant -> Entier 16 bits)
  while (pos < length) {
    for (i = 0; i < numOfChan; i = i + 1) {
      // Récupération de l'échantillon (entre -1.0 et 1.0)
      sample = channels[i][offset];

      // Clipping : on limite le son pour éviter la saturation numérique
      if (sample > 1) {
        sample = 1;
      }
      if (sample < -1) {
        sample = -1;
      }

      // Conversion mathématique vers l'échelle 16 bits (-32768 à 32767)
      if (sample < 0) {
        sample = sample * 32768;
      } else {
        sample = sample * 32767;
      }

      // Écriture de la valeur dans le fichier
      view.setInt16(pos, sample, true);
      pos = pos + 2;
    }
    offset = offset + 1;
  }

  // Retourne le fichier final prêt à être téléchargé
  return new Blob([buffer], {
    type: "audio/wav"
  });
}

/******************************************************************************/
/* Session                                                                    */
/* Restauration de l'état précédent                                           */
/******************************************************************************/
function loadLastSession() {
  let song;
  let lyrics;
  song = localStorage.getItem(STORAGE_SONG);
  lyrics = localStorage.getItem(STORAGE_LYRICS);
  if (song && lyrics) {
    LYRICS_RESULT.innerHTML = "<h4>" + song + "</h4><pre>" + lyrics + "</pre>";
  }
}

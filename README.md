# 🎙️ KaraFlow - Studio Edition v2.6

> **Transformez votre navigateur en studio d'enregistrement mobile.**

**KaraFlow** est une Progressive Web App (PWA) conçue pour les chanteurs et les rappeurs. Plus qu'un simple lecteur, c'est un outil de création qui permet de rechercher des paroles, de travailler son écriture avec un assistant de rimes, de s'enregistrer sur une instrumentale et d'exporter un mixage audio professionnel, le tout sans installer de logiciel lourd.

🔗 **Démo en ligne :** [https://srv-peda2.iut-acy.univ-smb.fr/gaillotv/pwa/](https://srv-peda2.iut-acy.univ-smb.fr/gaillotv/pwa/)

---

## 💡 Début du Projet & Changement D'idée

Initialement, KaraFlow avait pour ambition d'être une **plateforme de karaoké automatisée**. L'objectif était de permettre à l'utilisateur de sélectionner n'importe quel titre connu, chargeant automatiquement les paroles synchronisées et la version instrumentale officielle.

Cependant, lors de la phase de Recherche, une contrainte technique majeure est apparue :

* **Les limitations des APIs Musicales :** Les services comme **Spotify SDK** ou **Deezer API** ne permettent pas d'isoler les pistes instrumentales et imposent des restrictions d'accès fortes (comptes Premium obligatoires, tokens limités, DRM).
* **Les coûts :** Les APIs spécialisées dans la séparation de sources (STEMs) ou les catalogues karaoké professionnels sont payantes et inaccessibles pour un projet open-source étudiant.

**Le Pivot "Studio" :**
Face à ce constat, le projet a évolué d'un simple *lecteur* vers un **outil de création (Studio)**. Au lieu de consommer passivement du contenu, l'utilisateur devient acteur : il apporte ses propres fichiers audio (ou utilise les démos), écrit ses textes et enregistre sa performance. Cette approche a permis de mettre l'accent sur des défis techniques plus intéressants : le traitement audio dans le navigateur et l'enregistrement PWA.

---

## ⚡ Fonctionnalités Clés

### 🎹 Pour la Production

* **Studio d'enregistrement Web :** Capture vocale haute qualité via l'API `MediaRecorder`.
* **Visualisation Audio :** Affichage de la forme d'onde (Waveform) pour se repérer visuellement dans le morceau.
* **Mixage Coté Client :** Fusion intelligente de la voix et de l'instrumentale directement dans le navigateur.
* **Export WAV :** Génération binaire du fichier final prêt à être partagé, sans aucun traitement côté serveur (confidentialité totale).

### ✍️ Pour l'Écriture

* **Lyrics Finder :** Connexion à l'API **LRCLIB** pour récupérer instantanément les paroles de millions de titres.
* **Assistant de Rimes :** Un outil d'aide à l'inspiration connecté au **Wiktionnaire**, capable de trouver des rimes riches et des assonances en français.

### 📱 Expérience Utilisateur

* **Mode Offline (PWA) :** Installation native sur l'écran d'accueil mobile et fonctionnement sans connexion internet.
* **Dark Mode :** Interface adaptative pour les sessions d'enregistrement nocturnes.

---

## 🛠️ Stack Technique

* **Audio Engine :** Web Audio API (`OfflineAudioContext`, `AudioBuffer`).
* **Visualization :** WaveSurfer.js.
* **Interface :** Material Design.
* **APIs Externes :**
* **LRCLIB** (Lyrics open-source).
* **Wikimedia API** (Dictionnaire & Rimes).
* **Utilisation du téléphone :** Avec le micro du téléphone mais aussi vibration au décompte.


---

## ⚙️ Défis Techniques & Architecture

### 1. Le Moteur de Mixage (Le cœur du projet)

Le défi principal était de mixer deux sources audio (Instrumentale + Micro) sans backend (Node.js ou Python).

* **Solution :** Utilisation de l'API `OfflineAudioContext`. Elle permet de faire un rendu audio "plus vite que temps réel".
* **Compensation de Latence :** Sur le web, il existe un délai naturel entre le micro et l'enregistrement (~120ms). J'ai développé un algorithme qui applique un `offset` négatif (-0.12s) sur la piste vocale lors du mixage pour qu'elle soit parfaitement calée sur le temps (BPM).

### 2. Encodage WAV manuel

Pour éviter d'alourdir l'application avec des librairies comme *ffmpeg.wasm* (qui pèsent plusieurs Mo), j'ai écrit mon propre encodeur WAV via l'objet `DataView`.

* Écriture octet par octet des en-têtes RIFF/WAVE (44 octets).
* Conversion mathématique des échantillons audio flottants (Float32) en format PCM 16-bits compatible avec tous les lecteurs audio.

### 3. Optimisation de l'Assistant de Rimes

L'API standard pour les rimes (*Datamuse*) est excellente en anglais mais très faible en français.

* **Solution :** J'ai détourné l'API de recherche de **Wikimedia**. En utilisant des expressions régulières (Regex) sur les titres des pages du Wiktionnaire, l'application peut trouver des mots finissant par un suffixe précis, offrant un dictionnaire de rimes francophone beaucoup plus riche.

---

## 📂 Structure du projet

```text
KaraFlow/
├── index.html           # Single Page Application (Point d'entrée)
├── service_worker.js    # Gestion du cache & Offline (Stratégie Cache-First)
├── css/                 # Styles personnalisés & Thèmes
├── lib/                 # Dépendances locales (MDL)
├── js/
│   ├── script.js        # Cœur logique : Audio, UI, Mixage, Lyrics, Rimes
│   ├── pwa.js           # Gestion de l'installation & Cycle de vie SW
│   ├── wavesurfer.js    # Moteur de visualisation audio
│   └── mdl.js           # Comportements UI Material Design
├── audio/               # Pistes de démonstration (RnB, Trap, Pop)
└── favicon/             # Assets graphiques & Manifest

```
---

## 👤 Auteur

**Snifit**

* Projet réalisé dans le cadre de la SAÉ 302
* *Studio Edition v2.6*

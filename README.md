# 🎙️ KaraFlow - Studio Edition v2.6

**KaraFlow** est une Progressive Web App (PWA) de studio d'enregistrement mobile. Elle permet de rechercher des paroles, de trouver des rimes, de s'enregistrer sur une instrumentale et de générer un mixage audio (WAV) directement dans le navigateur.

🔗 **Démo en ligne :** [https://snifit.github.io/KaraFlow/](https://www.google.com/search?q=https://snifit.github.io/KaraFlow/)

---

## ⚡ Fonctionnalités

* **Studio d'enregistrement** : Capture vocale via `MediaRecorder` et visualisation en temps réel (Waveform).
* **Mixage Audio Client-Side** : Fusion de la voix et de l'instru avec compensation de latence (120ms).
* **Assistant d'écriture** : Recherche de rimes et d'assonances via l'API Wiktionnaire.
* **Lyrics Chercheur** : Récupération automatique des paroles via l'API LRCLIB.
* **Mode Offline (PWA)** : Installation native sur mobile et fonctionnement sans réseau.
* **Export WAV** : Génération binaire du fichier final sans traitement serveur.

---

## 🛠️ Technique

* **Audio** : Web Audio API (`OfflineAudioContext`, `AudioBuffer`), WaveSurfer.js.
* **UI** : Material Design Lite (MDL).
* **APIs** : LRCLIB (Lyrics), Wikimedia (Dictionnaire).

---

## ⚙️ Architecture et Choix Techniques

### 1. Traitement Audio & Mixage

Le défi principal était de mixer deux sources audio (Instrumentale + Micro) sans backend.

* **Solution :** Utilisation de l'API `OfflineAudioContext`.
* **Pourquoi ?** Permet un rendu "plus vite que temps réel" et garantit la confidentialité des données (rien ne quitte l'appareil de l'utilisateur).
* **Latence :** Implémentation d'un `offset` négatif de 0.12s sur la piste vocale pour compenser le délai matériel des micros standards.

### 2. Encodage WAV manuel

Pour éviter les dépendances lourdes (type ffmpeg.wasm), l'encodage WAV est géré manuellement via `DataView`.

* Écriture directe des en-têtes RIFF/WAVE (44 octets).
* Conversion des échantillons flottants (Float32) en PCM 16-bits.

### 3. Assistant de Rimes (Wikimedia vs Datamuse)

* **Choix :** API Wikimedia (Wiktionary).
* **Raison :** L'API Datamuse est performante en anglais mais instable en français. Wiktionary offre une base lexicale francophone plus robuste via une recherche par suffixe (Regex).

---

## 📂 Structure du projet

```text
KaraFlow/
├── index.html           # Single Page Application
├── service_worker.js    # Gestion du cache (Stratégie Cache-First)
├── css/                 # Styles & Thèmes (Dark/Light mode)
├── favicon/             # Icon
├── lib/                 # Librairie (MDL)
├── js/
│   ├── script.js        # Logique Audio & UI
│   ├── pwa.js           # Installation & Cycle de vie SW
│   ├── wavesurfer.js    # Librairie de visualisation
│   └── mdl.js           # Composants UI
└── audio/               # Pistes de démo

```

---

## 🚀 Installation locale

Pour tester ou modifier le projet localement :

1. **Cloner le dépôt :**
```bash
git clone https://github.com/Snifit/KaraFlow.git
cd KaraFlow

```


2. **Lancer un serveur HTTP :**
*(Nécessaire pour le fonctionnement des Service Workers et des modules Audio)*
```bash
# Avec Python 3
python3 -m http.server

# Ou avec VS Code "Live Server"

```


3. **Accéder au studio :**
Ouvrir `http://localhost:8000` dans un navigateur moderne (Chrome/Firefox/Safari).

---

## 👤 Auteur

**Snifit**

* Projet réalisé dans le cadre de la SAÉ 302.

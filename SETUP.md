# Guide de mise en place — Sphère Occulte

## Étape 1 — Créer le projet Firebase

1. Va sur **https://console.firebase.google.com**
2. Clique **"Ajouter un projet"** → donne-lui un nom (ex: `sphere-occulte`)
3. Désactive Google Analytics (pas nécessaire) → **Créer le projet**

---

## Étape 2 — Activer Authentication

1. Dans la console Firebase, clique **Authentication** (menu gauche)
2. Clique **"Commencer"**
3. Dans l'onglet **"Sign-in method"**, active **E-mail/Mot de passe**
4. Sauvegarde

---

## Étape 3 — Créer Firestore

1. Clique **Firestore Database** (menu gauche)
2. Clique **"Créer une base de données"**
3. Choisis **Mode production** → sélectionne une région (ex: `europe-west1`) → **Activer**
4. Va dans l'onglet **Règles** et remplace tout par le contenu de `firestore.rules`
5. **Publier**

---

## Étape 4 — Activer Storage (pour les screenshots)

1. Clique **Storage** (menu gauche)
2. Clique **"Commencer"** → Mode production → Sélectionne une région → **Terminer**
3. Va dans l'onglet **Règles** et remplace par le contenu de `storage.rules`
4. **Publier**

---

## Étape 5 — Récupérer la config Firebase

1. Dans la console Firebase, clique l'icône ⚙️ → **Paramètres du projet**
2. Scroll vers le bas → section **"Vos applications"**
3. Clique **"Ajouter une application"** → icône **Web (`</>`)**
4. Donne un surnom (ex: `sphere-occulte-web`) → **Enregistrer**
5. Copie le bloc `firebaseConfig` qui s'affiche

---

## Étape 6 — Configurer firebase-config.js

Ouvre `firebase-config.js` et remplace les valeurs :

```javascript
const firebaseConfig = {
    apiKey:            "COLLER_ICI",
    authDomain:        "COLLER_ICI",
    projectId:         "COLLER_ICI",
    storageBucket:     "COLLER_ICI",
    messagingSenderId: "COLLER_ICI",
    appId:             "COLLER_ICI"
};
```

---

## Étape 7 — Créer ton compte admin (premier lancement)

1. Ouvre `index.html` avec `?setup` dans l'URL (ex: `.../index.html?setup`) — ou si aucun membre n'existe encore, le bloc apparaît automatiquement
2. Remplis : prénom RP, nom RP, ton SteamID 64, mot de passe
3. Clique **"Créer le compte Monarque"**

Ce compte devient automatiquement le premier admin (grade Monarque des Ombres). Tous les comptes suivants (membres ou hauts grades) se connectent uniquement via **Steam** — voir Étape 9bis.

---

## Étape 8 — Importer les incantations

1. Connecte-toi sur `index.html`, va dans le panel **Admin** → onglet **Incantations**
2. Clique **"⬆ Importer les incantations de base"**
3. Les 13 incantations sont importées automatiquement

---

## Étape 9 — Publier sur GitHub Pages

1. Crée un repo GitHub (ex: `sphere-occulte`)
2. Upload tous les fichiers du dossier `sphere-occulte/`
3. Va dans **Settings** → **Pages**
4. Source : **Deploy from a branch** → branche `main` → dossier `/ (root)`
5. **Save** → ton site sera accessible sur `https://TON_USERNAME.github.io/sphere-occulte/`

---

## Étape 9bis — Activer la connexion Steam (Cloud Functions)

Depuis la mise à jour "Connexion Steam", **tous les membres se connectent avec leur vrai compte
Steam** (OpenID officiel — la fenêtre de connexion Steam elle-même), plus de mot de passe à gérer
au quotidien. Ça demande une pièce en plus du site statique : des **Cloud Functions Firebase**.

1. **Passer le projet Firebase en plan Blaze** (pay-as-you-go) :
   - Console Firebase → ⚙️ **Paramètres du projet** → **Utilisation et facturation** → **Modifier le plan** → **Blaze**
   - Nécessaire uniquement parce que les Cloud Functions doivent appeler le serveur de Steam pour
     vérifier la connexion (appel réseau sortant, interdit sur le plan gratuit Spark). Le coût réel
     est quasi nul à l'échelle d'une communauté RP (quelques connexions/jour).
2. **Installer les outils Firebase** (une fois, sur ta machine) :
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
3. **Déployer les fonctions** depuis le dossier `sphere-occulte/` :
   ```bash
   firebase deploy --only functions
   ```
   Ça publie deux fonctions sur `https://us-central1-sphere-occulte.cloudfunctions.net/` :
   - `steamLogin` — redirige vers la page de connexion Steam
   - `steamCallback` — vérifie la réponse de Steam et connecte le membre

Aucune clé Steam Web API n'est nécessaire : la vérification OpenID est publique et ne demande pas
de compte développeur Steam.

**Accès sur invitation uniquement** : si le SteamID de la personne qui se connecte ne correspond à
aucun profil dans Firestore (`membres.steamId`), la connexion est refusée. Un haut grade doit
d'abord enregistrer son profil (voir ci-dessous).

---

## Ajouter un nouveau membre (depuis le panel admin)

1. Sur `index.html`, panel **Admin** → onglet **Accès**
2. Remplis : prénom RP, nom RP (facultatif), **SteamID 64**
3. Clique **"➕ Créer l'accès"**

Aucun mot de passe à transmettre : le profil est pré-enregistré, et la personne est automatiquement
liée à ce profil dès sa première connexion via le bouton **"Se connecter avec Steam"**.

---

## Structure des fichiers

```
sphere-occulte/
├── index.html          → Site complet (classement public, connexion Steam, dashboard, panel admin)
├── firebase-config.js  → ⚠️ À configurer avec vos clés Firebase
├── styles.css          → Styles partagés
├── particles.js         → Décor animé
├── firestore.rules     → Règles de sécurité Firestore (à coller dans la console)
├── storage.rules       → Règles de sécurité Storage (à coller dans la console)
├── functions/          → Cloud Functions — connexion Steam (voir Étape 9bis)
├── firebase.json       → Config Firebase CLI (Firestore + Functions)
└── login.html, rapport.html, admin.html
    → Anciennes pages autonomes, non reliées à index.html aujourd'hui (laissées pour référence)
```

---

## Grades et seuils (Puissance Occulte)

| Grade | Minimum pts Occulte |
|---|---|
| Incantateur | 0 |
| Marcheur des Voiles | 23 |
| Collecteur d'Ombre | 45 |
| Marchand des Âmes | 90 |

Les grades se mettent à jour **automatiquement** lors de la validation d'une soumission.

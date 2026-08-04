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

## Étape 7 — Créer ton compte admin

1. Ouvre `login.html` dans un navigateur (ou sur GitHub Pages)
2. Clique **"Inscription"**
3. Remplis : ton nom de perso, ton Steam ID, e-mail, mot de passe
4. Clique **"Créer mon compte"**

**Ensuite**, dans la console Firebase :
1. Va dans **Firestore** → collection `membres`
2. Trouve ton document (par ton UID)
3. Modifie le champ `role` : mets `admin` (au lieu de `membre`)
4. Sauvegarde

Tu peux maintenant te connecter et accéder au panel admin.

---

## Étape 8 — Importer les incantations

1. Connecte-toi sur `admin.html`
2. Va dans l'onglet **Incantations**
3. Clique **"⬆ Importer les incantations de base"**
4. Les 13 incantations sont importées automatiquement

---

## Étape 9 — Publier sur GitHub Pages

1. Crée un repo GitHub (ex: `sphere-occulte`)
2. Upload tous les fichiers du dossier `sphere-occulte/`
3. Va dans **Settings** → **Pages**
4. Source : **Deploy from a branch** → branche `main` → dossier `/ (root)`
5. **Save** → ton site sera accessible sur `https://TON_USERNAME.github.io/sphere-occulte/`

---

## Flux d'utilisation normal

```
Membre          →  Va sur index.html (classement public)
                →  Clique "Connexion membre"
                →  Se connecte (email/mdp)
                →  rapport.html — soumet son rapport

Haut Grade      →  Se connecte avec son compte haut_grade/admin
                →  admin.html — voit les soumissions en attente
                →  Valide ou refuse avec attribution des points
                →  Les points et grades se mettent à jour automatiquement
```

---

## Ajouter un nouveau membre (depuis le panel admin)

1. Va dans **admin.html** → onglet **Membres**
2. Clique **"+ Ajouter un membre"**
3. Remplis : nom, Steam ID, e-mail, mot de passe initial
4. Le compte Firebase est créé automatiquement
5. Partage l'e-mail et le mot de passe au membre via Discord

---

## Structure des fichiers

```
sphere-occulte/
├── index.html          → Classement public (pas de connexion requise)
├── login.html          → Page de connexion / inscription
├── rapport.html        → Soumettre un rapport (membres connectés)
├── admin.html          → Panel hauts grades
├── firebase-config.js  → ⚠️ À configurer avec vos clés Firebase
├── styles.css          → Styles partagés
├── firestore.rules     → Règles de sécurité Firestore (à coller dans la console)
└── storage.rules       → Règles de sécurité Storage (à coller dans la console)
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

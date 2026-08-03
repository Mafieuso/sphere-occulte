// ════════════════════════════════════════════════════════════════
//  SPHÈRE OCCULTE — Connexion Steam (OpenID 2.0)
//
//  steamLogin    : redirige le navigateur vers la page de connexion Steam
//  steamCallback : Steam revient ici après connexion. On vérifie la réponse
//                  auprès de Steam, on retrouve le membre correspondant
//                  (déjà existant ou pré-enregistré par un haut grade) dans
//                  Firestore, puis on émet un jeton Firebase personnalisé
//                  pour connecter le navigateur. Accès sur invitation
//                  uniquement — un SteamID inconnu est refusé.
// ════════════════════════════════════════════════════════════════
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

// Config publique Firebase (identique à firebase-config.js — sans risque à exposer,
// ce sont les mêmes valeurs déjà présentes côté client sur le site).
const firebaseConfig = {
    apiKey:            "AIzaSyCs9zjHSdoTlfVKIPnhZRIcjsHMwHvcPG4",
    authDomain:        "sphere-occulte.firebaseapp.com",
    projectId:         "sphere-occulte",
    storageBucket:     "sphere-occulte.firebasestorage.app",
    messagingSenderId: "690663217057",
    appId:             "1:690663217057:web:35c0129b1b2846d9069de0"
};

// URL publique du site (GitHub Pages) — utilisée pour les redirections finales.
const SITE_URL = 'https://mafieuso.github.io/sphere-occulte';

const STEAM_OPENID_ENDPOINT = 'https://steamcommunity.com/openid/login';

function origin(req) {
    // Les fonctions Cloud Functions sont toujours servies en HTTPS en production.
    return `https://${req.get('host')}`;
}

function redirectError(res, code) {
    res.redirect(`${SITE_URL}/?erreur=${code}`);
}

// ── 1. Redirection vers Steam ────────────────────────────────────
exports.steamLogin = functions.https.onRequest((req, res) => {
    const base = origin(req);
    const returnTo = `${base}/steamCallback`;
    const params = new URLSearchParams({
        'openid.ns':          'http://specs.openid.net/auth/2.0',
        'openid.mode':        'checkid_setup',
        'openid.return_to':   returnTo,
        'openid.realm':       base,
        'openid.identity':    'http://specs.openid.net/auth/2.0/identifier_select',
        'openid.claimed_id':  'http://specs.openid.net/auth/2.0/identifier_select'
    });
    res.redirect(`${STEAM_OPENID_ENDPOINT}?${params.toString()}`);
});

// ── 2. Retour depuis Steam : vérification + connexion Firebase ──
exports.steamCallback = functions.https.onRequest(async (req, res) => {
    try {
        const query = req.query || {};
        if (query['openid.mode'] !== 'id_res') {
            return redirectError(res, 'echec');
        }

        // Reconstruit les paramètres reçus de Steam, en changeant seulement le mode,
        // pour lui redemander de confirmer l'authenticité de la réponse.
        const verifyParams = new URLSearchParams();
        for (const [key, value] of Object.entries(query)) {
            verifyParams.append(key, value);
        }
        verifyParams.set('openid.mode', 'check_authentication');

        const verifyResp = await fetch(STEAM_OPENID_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: verifyParams.toString()
        });
        const verifyText = await verifyResp.text();

        if (!/is_valid\s*:\s*true/.test(verifyText)) {
            return redirectError(res, 'echec');
        }

        // openid.claimed_id ressemble à https://steamcommunity.com/openid/id/7656119800000000
        const claimedId = query['openid.claimed_id'] || '';
        const match = claimedId.match(/(\d{17})\/?$/);
        if (!match) {
            return redirectError(res, 'echec');
        }
        const steamId = match[1];

        // Cherche un membre existant lié à ce SteamID : un compte créé avant le passage
        // à Steam (reconfiguration), ou un profil pré-enregistré par un haut grade.
        // Accès sur invitation uniquement — pas de création automatique ici.
        const snap = await db.collection('membres').where('steamId', '==', steamId).limit(1).get();
        if (snap.empty) {
            return redirectError(res, 'refuse');
        }

        const uid = snap.docs[0].id;
        const token = await admin.auth().createCustomToken(uid);

        res.status(200).set('Content-Type', 'text/html; charset=utf-8').send(`<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Connexion Steam — Sphère Occulte</title></head>
<body style="background:#05070f;color:#e6ecf0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh">
<p>Connexion en cours…</p>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
<script>
  firebase.initializeApp(${JSON.stringify(firebaseConfig)});
  firebase.auth().signInWithCustomToken(${JSON.stringify(token)})
    .then(() => { window.location.href = ${JSON.stringify(SITE_URL)} + '/'; })
    .catch(() => { window.location.href = ${JSON.stringify(SITE_URL)} + '/?erreur=echec'; });
</script>
</body></html>`);
    } catch (err) {
        console.error(err);
        return redirectError(res, 'echec');
    }
});

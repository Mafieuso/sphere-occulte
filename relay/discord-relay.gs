/**
 * ════════════════════════════════════════════════════════════════
 *  SPHÈRE OCCULTE — Relais Discord (Google Apps Script, gratuit)
 *
 *  Le webhook Discord n'existe QUE dans les "Propriétés du script"
 *  (Paramètres du projet → Propriétés du script → DISCORD_WEBHOOK).
 *  Il n'est jamais envoyé au navigateur, ni écrit dans le code ou la base.
 *
 *  Le site envoie ici le rapport + le jeton Firebase de la personne connectée.
 *  Le relais vérifie : (1) que le jeton est valide, (2) que c'est un
 *  admin / haut_grade non suspendu, (3) la cadence. Puis il poste sur Discord.
 * ════════════════════════════════════════════════════════════════
 */
const PROJECT_ID   = 'sphere-occulte';
const API_KEY      = 'AIzaSyCs9zjHSdoTlfVKIPnhZRIcjsHMwHvcPG4';            // clé web Firebase (publique par conception)
const ROLE_PINGS   = ['1353477391208681544', '1353478941129572453', '1442217516205215845'];
const BOT_NAME     = 'Prophète Occulte';
const AVATAR_URL   = 'https://mafieuso.github.io/sphere-occulte/img/logo.png';
const MAX_PER_10MN = 30;                  // envois max par personne / 10 min
const MAX_MESSAGES = 3, MAX_FILES = 2, MAX_B64_CHARS = 9000000;

// Savoirs chiffrés intégrés au site : le texte (chiffré) est dans le code public du site, la CLÉ n'existe
// que dans ce script. Elle n'est remise qu'aux membres dont le grade atteint "min" (ou aux hauts grades).
// (Dans le dépôt GitHub ce tableau est vide ; les vraies clés ne sont que dans le script déployé.)
const SAVOIR_KEYS = {};
const GRADES = ['Incantateur', 'Marcheur des Voiles', "Collecteur d'Ombre", 'Marchand des Âmes', 'Monarque des Ombres'];

function doGet(e) {                         // vérification depuis l'admin : dit seulement si le webhook est configuré
  const has = !!PropertiesService.getScriptProperties().getProperty('DISCORD_WEBHOOK');
  return json_({ ok: true, service: 'relais-discord', webhook: has });
}

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    const idToken = String(req.idToken || '');
    if (!idToken) return json_({ ok: false, error: 'auth' });

    // 1. Jeton Firebase valide ?
    const lk = UrlFetchApp.fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + API_KEY, {
      method: 'post', contentType: 'application/json', payload: JSON.stringify({ idToken: idToken }), muteHttpExceptions: true
    });
    if (lk.getResponseCode() !== 200) return json_({ ok: false, error: 'auth' });
    const uid = (JSON.parse(lk.getContentText()).users || [{}])[0].localId;
    if (!uid) return json_({ ok: false, error: 'auth' });

    // 2. Rôle (lu avec le jeton de la personne : les règles Firestore s'appliquent)
    const fs = UrlFetchApp.fetch('https://firestore.googleapis.com/v1/projects/' + PROJECT_ID + '/databases/(default)/documents/membres/' + uid, {
      headers: { Authorization: 'Bearer ' + idToken }, muteHttpExceptions: true
    });
    if (fs.getResponseCode() !== 200) return json_({ ok: false, error: 'forbidden' });
    const f = JSON.parse(fs.getContentText()).fields || {};
    const role = f.role && f.role.stringValue;
    const suspended = f.suspended && f.suspended.booleanValue;
    const grade = f.grade && f.grade.stringValue;

    // ── Clé d'un savoir chiffré (selon le grade) ──
    if (req.action === 'savoirKey') {
      const s = SAVOIR_KEYS[String(req.id || '')];
      if (!s || suspended) return json_({ ok: false, error: 'forbidden' });
      const idx = GRADES.indexOf(grade);
      const haut = role === 'admin' || role === 'haut_grade';
      if (!haut && idx < s.min) return json_({ ok: false, error: 'grade' });
      return json_({ ok: true, key: s.key });
    }
    if ((role !== 'admin' && role !== 'haut_grade') || suspended) return json_({ ok: false, error: 'forbidden' });

    // 3. Cadence
    const cache = CacheService.getScriptCache(), key = 'n_' + uid, n = Number(cache.get(key) || 0);
    if (n >= MAX_PER_10MN) return json_({ ok: false, error: 'rate' });
    cache.put(key, String(n + 1), 600);

    // 4. Envoi
    const hook = PropertiesService.getScriptProperties().getProperty('DISCORD_WEBHOOK');
    if (!hook) return json_({ ok: false, error: 'no_webhook' });
    const msgs = (req.messages || []).slice(0, MAX_MESSAGES);
    let sent = 0;
    for (const m of msgs) {
      const form = {
        payload_json: JSON.stringify({
          username: BOT_NAME, avatar_url: AVATAR_URL,
          content: String(m.content || '').slice(0, 1800),
          // seuls les 2 rôles prévus peuvent être mentionnés, et jamais lors d'un test
          allowed_mentions: (m.ping && !m.test) ? { roles: ROLE_PINGS } : { parse: [] }
        })
      };
      (m.files || []).slice(0, MAX_FILES).forEach(function (file, i) {
        if (String(file.b64 || '').length > MAX_B64_CHARS) return;
        form['files[' + i + ']'] = Utilities.newBlob(Utilities.base64Decode(file.b64), 'image/png', String(file.name || 'image.png').replace(/[^\w.\-]/g, ''));
      });
      const r = UrlFetchApp.fetch(hook, { method: 'post', payload: form, muteHttpExceptions: true });
      if (r.getResponseCode() >= 300) return json_({ ok: false, error: 'discord_' + r.getResponseCode(), sent: sent });
      sent++;
    }
    return json_({ ok: true, sent: sent });
  } catch (err) {
    return json_({ ok: false, error: String(err).slice(0, 140) });
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

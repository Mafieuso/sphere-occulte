/* ════════════════════════════════════════════════════════════════
   SPHÈRE OCCULTE — Cartes de rapport Discord (v2) + simulateur admin
   Remplace renderRapportCard / renderScreenshotCard / postRapportToDiscord.
   Dépend des globales de index.html : GRADES, db,
   wrapCanvasText, roundRectPath, loadImageEl, openModal, closeModal, currentMembre.
   ════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    const LOGO_PUBLIC_URL = 'https://mafieuso.github.io/sphere-occulte/img/logo.png';
    const ROLE_PINGS      = ['1353477391208681544', '1353478941129572453'];
    const BOT_NAME        = 'Prophète Occulte';

    /* ───────── Chargement des visuels (jamais bloquant) ───────── */
    const cache = {};
    function asset(path) {
        if (!cache[path]) cache[path] = new Promise(res => {
            const img = new Image();
            img.onload = () => res(img); img.onerror = () => res(null);
            img.src = path;
        });
        return cache[path];
    }
    const gradeIndex = name => Math.max(0, GRADES.findIndex(g => g.nom === name));

    // Dessine une image en "cover" dans un rectangle
    function drawCover(ctx, img, x, y, w, h, focusY = .5) {
        const r = Math.max(w / img.width, h / img.height);
        const sw = w / r, sh = h / r, sx = (img.width - sw) / 2, sy = (img.height - sh) * focusY;
        ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    }
    function fitFont(ctx, text, maxW, size, family, weight = 700) {
        let s = size;
        do { ctx.font = `${weight} ${s}px ${family}`; s -= 2; } while (ctx.measureText(text).width > maxW && s > 18);
    }
    function hexA(hex, a) {                 // '#rrggbb' + alpha(0-1) → rgba()
        const n = parseInt(hex.slice(1), 16);
        return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
    }
    function glassPanel(ctx, x, y, w, h, accent, r) {
        ctx.save();
        roundRectPath(ctx, x, y, w, h, r);
        const g = ctx.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, 'rgba(255,255,255,.07)'); g.addColorStop(1, 'rgba(255,255,255,.02)');
        ctx.fillStyle = 'rgba(6,10,22,.72)'; ctx.fill();
        ctx.fillStyle = g; ctx.fill();
        ctx.strokeStyle = hexA(accent, .38); ctx.lineWidth = 1.6; ctx.stroke();
        ctx.restore();
    }
    function medallion(ctx, img, cx, cy, r, accent, f) {
        ctx.save();
        const halo = ctx.createRadialGradient(cx, cy, r * .7, cx, cy, r * 2.1);
        halo.addColorStop(0, hexA(accent, .55)); halo.addColorStop(1, 'transparent');
        ctx.fillStyle = halo; ctx.fillRect(cx - r * 2.2, cy - r * 2.2, r * 4.4, r * 4.4);
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.closePath();
        ctx.fillStyle = '#05070f'; ctx.fill();
        if (img) { ctx.save(); ctx.clip(); ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2); ctx.restore(); }
        ctx.lineWidth = f(3.2); ctx.strokeStyle = accent;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.35)';
        ctx.beginPath(); ctx.arc(cx, cy, r + f(7), 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
    }
    function sealStamp(ctx, cx, cy, r, accent, f, label) {
        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(-.2);
        ctx.strokeStyle = accent; ctx.fillStyle = accent; ctx.globalAlpha = .92;
        ctx.lineWidth = f(3);  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = f(1.4); ctx.beginPath(); ctx.arc(0, 0, r - f(8), 0, Math.PI * 2); ctx.stroke();
        ctx.textAlign = 'center';
        ctx.font = `700 ${f(15)}px Karla, sans-serif`; ctx.fillText(label, 0, -f(14));
        ctx.font = `${f(44)}px serif`; ctx.fillText('⬡', 0, f(26));
        ctx.font = `700 ${f(11)}px Karla, sans-serif`; ctx.fillText('CONCLAVE', 0, f(44));
        ctx.restore();
    }
    function corners(ctx, x, y, w, h, color, size, lw) {
        ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw;
        [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([cx, cy, dx, dy]) => {
            ctx.beginPath(); ctx.moveTo(cx, cy + dy * size); ctx.lineTo(cx, cy); ctx.lineTo(cx + dx * size, cy); ctx.stroke();
            ctx.beginPath(); ctx.arc(cx + dx * size * .32, cy + dy * size * .32, size * .1, 0, Math.PI * 2); ctx.stroke();
        });
        ctx.restore();
    }
    // Cadre ornemental en "9 tranches" : les coins gardent leurs proportions, seuls les bords s'étirent.
    // Le visuel a un fond noir pur → fondu en "screen".
    function frame9(ctx, img, W, H, f) {
        const iw = img.width, ih = img.height, sw = iw * .235, sh = ih * .315;
        const dw = f(200), dh = dw * sh / sw;
        ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .95;
        const D = (sx, sy, sW, sH, dx, dy, dW, dH) => ctx.drawImage(img, sx, sy, sW, sH, dx, dy, dW, dH);
        D(0, 0, sw, sh, 0, 0, dw, dh);                      D(iw - sw, 0, sw, sh, W - dw, 0, dw, dh);
        D(0, ih - sh, sw, sh, 0, H - dh, dw, dh);           D(iw - sw, ih - sh, sw, sh, W - dw, H - dh, dw, dh);
        D(sw, 0, iw - 2 * sw, sh, dw, 0, W - 2 * dw, dh);   D(sw, ih - sh, iw - 2 * sw, sh, dw, H - dh, W - 2 * dw, dh);
        D(0, sh, sw, ih - 2 * sh, 0, dh, dw, H - 2 * dh);   D(iw - sw, sh, sw, ih - 2 * sh, W - dw, dh, dw, H - 2 * dh);
        ctx.restore();
    }
    function frameOverlay(ctx, art, W, H, accent, f) {
        if (art.frame) frame9(ctx, art.frame, W, H, f);
        ctx.strokeStyle = accent; ctx.lineWidth = f(2.6); ctx.globalAlpha = .75;
        roundRectPath(ctx, f(10), f(10), W - f(20), H - f(20), f(16)); ctx.stroke(); ctx.globalAlpha = 1;
    }

    /* ───────── Carte principale ───────── */
    async function drawRapportCard(data, useArt) {
        if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) {} }
        const S = 1.65, f = n => n * S;
        const gi = gradeIndex(data.grade), gradeDef = GRADES[gi] || GRADES[0], accent = gradeDef.couleur;
        const art = useArt ? {
            banner: await asset(`img/report/banner-${gi}.jpg`),
            frame:  await asset('img/report/frame.jpg'),
            logo:   await asset('img/logo.png')
        } : {};

        const W = Math.round(f(1300)), H = Math.round(f(1020));
        const SX = f(210), SW = W - f(420);          // zone sûre (hors coins ornementaux)
        const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');

        // Fond + bannière du grade (fondu vers le bas)
        ctx.fillStyle = '#05070f'; ctx.fillRect(0, 0, W, H);
        const BH = f(480);
        if (art.banner) {
            drawCover(ctx, art.banner, 0, 0, W, BH, .42);
            const fade = ctx.createLinearGradient(0, 0, 0, BH);
            fade.addColorStop(0, 'rgba(5,7,15,.55)'); fade.addColorStop(.45, 'rgba(5,7,15,.25)'); fade.addColorStop(1, '#05070f');
            ctx.fillStyle = fade; ctx.fillRect(0, 0, W, BH);
            const side = ctx.createLinearGradient(0, 0, W, 0);
            side.addColorStop(0, 'rgba(5,7,15,.75)'); side.addColorStop(.22, 'rgba(5,7,15,0)'); side.addColorStop(.78, 'rgba(5,7,15,0)'); side.addColorStop(1, 'rgba(5,7,15,.75)');
            ctx.fillStyle = side; ctx.fillRect(0, 0, W, BH);
        } else {
            const bg = ctx.createLinearGradient(0, 0, W, H);
            bg.addColorStop(0, '#05070f'); bg.addColorStop(1, '#0c1020'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        }
        const glow = ctx.createRadialGradient(W / 2, f(230), f(10), W / 2, f(230), f(580));
        glow.addColorStop(0, hexA(accent, .26)); glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

        // Sceau en filigrane
        ctx.save(); ctx.globalAlpha = .04; ctx.textAlign = 'center'; ctx.font = `${f(560)}px serif`; ctx.fillStyle = accent;
        ctx.fillText('⬡', W / 2, H / 2 + f(190)); ctx.restore();

        // En-tête : logo + libellés (dans la zone sûre)
        if (art.logo) medallion(ctx, art.logo, f(262), f(98), f(42), accent, f);
        ctx.textAlign = 'left';
        const hx = art.logo ? f(326) : SX;
        ctx.font = `600 ${f(15)}px Karla, sans-serif`; ctx.fillStyle = hexA('#ffffff', .65);
        ctx.fillText('S P H È R E   O C C U L T E', hx, f(88));
        ctx.font = `${f(20)}px "Cormorant Garamond", serif`; ctx.fillStyle = accent;
        ctx.fillText('RAPPORT D\'INCANTATION', hx, f(116));

        // Pastille de grade + titre
        ctx.textAlign = 'center';
        const gLabel = `${gradeDef.icon}  ${(data.grade || gradeDef.nom).toUpperCase()}`;
        ctx.font = `700 ${f(21)}px sans-serif`;
        const gw = ctx.measureText(gLabel).width + f(56);
        glassPanel(ctx, W / 2 - gw / 2, f(206), gw, f(44), accent, f(22));
        ctx.fillStyle = accent; ctx.fillText(gLabel, W / 2, f(236));

        fitFont(ctx, data.incanNom || 'Incantation', W - f(420), f(76), '"Cinzel Decorative", serif', 700);
        ctx.fillStyle = '#f2fbfa'; ctx.shadowColor = accent; ctx.shadowBlur = f(34);
        ctx.fillText(data.incanNom || 'Incantation', W / 2, f(338)); ctx.shadowBlur = 0;

        ctx.font = `${f(30)}px "Cormorant Garamond", serif`; ctx.fillStyle = '#a8f5ec';
        ctx.fillText(`Rapport de ${data.membreNom}`, W / 2, f(384));

        // Ornement de séparation
        ctx.strokeStyle = accent; ctx.globalAlpha = .6; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(SX, f(420)); ctx.lineTo(W / 2 - f(34), f(420)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(W / 2 + f(34), f(420)); ctx.lineTo(W - SX, f(420)); ctx.stroke();
        ctx.globalAlpha = 1; ctx.font = `${f(22)}px serif`; ctx.fillStyle = accent; ctx.fillText('◆', W / 2, f(428));

        // Médaillons de points + logo central
        const py = f(466), pw = f(350), ph = f(120);
        [[W / 2 - pw - f(64), `+${data.ptsGagnes || 0}`, 'PUISSANCE OCCULTE'], [W / 2 + f(64), `+${data.manipGagnes || 0}`, 'MANIPULATION OCCULTE']]
            .forEach(([x, val, lab]) => {
                glassPanel(ctx, x, py, pw, ph, accent, f(20));
                ctx.fillStyle = '#a8f5ec'; ctx.shadowColor = accent; ctx.shadowBlur = f(22);
                ctx.font = `700 ${f(66)}px "Italiana", serif`; ctx.fillText(val, x + pw / 2, py + f(70));
                ctx.shadowBlur = 0; ctx.fillStyle = '#9aa6bd'; ctx.font = `600 ${f(15)}px Karla, sans-serif`;
                ctx.fillText(lab, x + pw / 2, py + f(100));
            });
        medallion(ctx, art.logo, W / 2, py + ph / 2, f(54), accent, f);
        if (!art.logo) { ctx.fillStyle = accent; ctx.font = `${f(60)}px serif`; ctx.fillText('⬡', W / 2, py + ph / 2 + f(20)); }

        // Grille d'informations
        const gap = f(24), gw2 = (SW - gap) / 2, gh = f(92), gy = f(626);
        const cells = [
            ['📅  DATE RP', data.dateRap], ['🚪  ACCÈS SALLE', data.accesSalle],
            ['🎯  CIBLE', data.cible],     ['⚗️  SOCLE UTILISÉ', data.socleUtilise]
        ];
        cells.forEach(([lab, val], i) => {
            const x = SX + (i % 2) * (gw2 + gap), y = gy + Math.floor(i / 2) * (gh + f(18));
            glassPanel(ctx, x, y, gw2, gh, accent, f(16));
            ctx.textAlign = 'left';
            ctx.font = `600 ${f(14)}px Karla, sans-serif`; ctx.fillStyle = hexA(accent, .95);
            ctx.fillText(lab, x + f(24), y + f(30));
            fitFont(ctx, val || '—', gw2 - f(48), f(30), '"Cormorant Garamond", serif', 600);
            ctx.fillStyle = '#f0f4f7'; ctx.fillText(val || '—', x + f(24), y + f(66));
        });

        // Usage + cachet de validation
        const uy = gy + 2 * (gh + f(18)), uw = SW - f(150);
        if (data.usage) {
            glassPanel(ctx, SX, uy, uw, f(96), accent, f(16));
            ctx.textAlign = 'left'; ctx.font = `600 ${f(14)}px Karla, sans-serif`; ctx.fillStyle = hexA(accent, .95);
            ctx.fillText('📝  USAGE', SX + f(24), uy + f(28));
            ctx.font = `${f(22)}px "Cormorant Garamond", serif`; ctx.fillStyle = '#d7dee6';
            wrapCanvasText(ctx, data.usage, uw - f(48)).slice(0, 2)
                .forEach((l, i) => ctx.fillText(l, SX + f(24), uy + f(56) + i * f(26)));
        }
        sealStamp(ctx, W - SX - f(58), uy + f(48), f(58), accent, f, '✔ VALIDÉ');

        frameOverlay(ctx, art, W, H, accent, f);
        return canvas;
    }

    /* ───────── Carte de preuve (capture d'écran) ───────── */
    async function drawScreenshotCard(src, gradeDef, useArt) {
        if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) {} }
        const S = 1.65, f = n => n * S, accent = gradeDef.couleur;
        const gi = Math.max(0, GRADES.findIndex(g => g.nom === gradeDef.nom));
        const art = useArt ? { banner: await asset(`img/report/banner-${gi}.jpg`), frame: await asset('img/report/frame.jpg') } : {};
        const img = await loadImageEl(src);

        const W = Math.round(f(1300)), HEAD = f(112), PAD = f(140), targetW = W - PAD * 2;
        const srcW = img.naturalWidth || img.width, srcH = img.naturalHeight || img.height;
        const iw = Math.round(targetW), ih = Math.round(srcH * (targetW / srcW));
        const H = Math.round(HEAD + ih + f(120));

        const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#05070f'; ctx.fillRect(0, 0, W, H);
        if (art.banner) {
            drawCover(ctx, art.banner, 0, 0, W, HEAD + f(30), .5);
            const fade = ctx.createLinearGradient(0, 0, 0, HEAD + f(30));
            fade.addColorStop(0, 'rgba(5,7,15,.7)'); fade.addColorStop(1, '#05070f');
            ctx.fillStyle = fade; ctx.fillRect(0, 0, W, HEAD + f(30));
        }
        ctx.save(); ctx.globalAlpha = .04; ctx.textAlign = 'center'; ctx.font = `${f(420)}px serif`; ctx.fillStyle = accent;
        ctx.fillText('⬡', W / 2, H / 2 + f(120)); ctx.restore();

        ctx.textAlign = 'center'; ctx.font = `700 ${f(24)}px Karla, sans-serif`; ctx.fillStyle = accent;
        ctx.shadowColor = accent; ctx.shadowBlur = f(14);
        ctx.fillText('📸  PREUVE — CAPTURE D\'ÉCRAN', W / 2, f(72)); ctx.shadowBlur = 0;

        const x = PAD, y = HEAD;
        ctx.save(); ctx.shadowColor = hexA(accent, .55); ctx.shadowBlur = f(30);
        ctx.fillStyle = '#000'; ctx.fillRect(x, y, iw, ih); ctx.restore();
        ctx.drawImage(img, x, y, iw, ih);
        ctx.strokeStyle = accent; ctx.lineWidth = 2.4; ctx.strokeRect(x, y, iw, ih);
        corners(ctx, x - f(6), y - f(6), iw + f(12), ih + f(12), accent, f(26), f(2.2));

        frameOverlay(ctx, art, W, H, accent, f);
        return canvas;
    }

    // Rend avec les images ; si le navigateur refuse (canvas "tainted", ex. page ouverte en file://),
    // re-rend sans les images plutôt que de perdre le rapport.
    const toBlob = c => new Promise((res, rej) => { try { c.toBlob(b => b ? res(b) : rej(new Error('toBlob')), 'image/png'); } catch (e) { rej(e); } });
    async function safe(drawFn) {
        try { return await toBlob(await drawFn(true)); }
        catch (e) { console.warn('[rapport] rendu sans images :', e.message || e); return toBlob(await drawFn(false)); }
    }
    window.renderRapportCard    = data => safe(u => drawRapportCard(data, u));
    window.renderScreenshotCard = (src, g) => safe(u => drawScreenshotCard(src, g, u));

    /* ───────── Relais Discord (Apps Script) : le webhook n'est jamais dans le navigateur ─────────
       Le site envoie le rapport + son jeton Firebase à un relais gratuit (Google Apps Script) ;
       c'est lui qui détient le webhook et vérifie le rôle de l'envoyeur. L'adresse du relais
       (non secrète) est stockée dans Firestore : config/discord.relayUrl. */
    const RELAY_RE = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/;
    let relayCache = null, relayAt = 0;
    async function getRelay(force) {
        if (!force && relayCache !== null && Date.now() - relayAt < 300000) return relayCache;
        try {
            const d = await db.collection('config').doc('discord').get();
            relayCache = d.exists ? String(d.data().relayUrl || '') : '';
        } catch (e) {
            console.error('[discord] lecture de la config refusée — règles Firestore à publier ?', e.code || e);
            relayCache = ''; window.__hookErr = e.code || String(e);
        }
        relayAt = Date.now(); return relayCache;
    }
    function setStatus(txt, ok) { const s = document.getElementById('dc-status'); if (s) { s.textContent = txt; s.style.color = ok ? '#72ff8c' : '#ff8a8a'; } }
    const ERR_TXT = {
        auth: 'identité refusée (reconnecte-toi)', forbidden: 'réservé aux admins / hauts gradés', rate: 'trop d\'envois, patiente quelques minutes',
        no_webhook: 'le relais n\'a pas encore de webhook (Propriétés du script → DISCORD_WEBHOOK)', no_relay: 'relais non configuré (Admin → Accès & Comptes)'
    };
    function errText(code) { return ERR_TXT[code] || (String(code).startsWith('discord_') ? 'Discord a refusé (' + code.slice(8) + ') — webhook invalide ou supprimé ?' : code); }

    window.discordWebhookStatus = async function () {
        window.__hookErr = null; const url = await getRelay(true);
        if (!url) { setStatus(window.__hookErr ? '❌ lecture refusée (règles Firestore)' : '❌ relais non configuré', false); return; }
        try {
            const j = await (await fetch(url, { method: 'GET' })).json();
            if (!j.ok) setStatus('❌ relais invalide', false);
            else setStatus(j.webhook ? '✅ relais actif — webhook présent' : '⚠ relais joignable, mais aucun webhook (Propriétés du script → DISCORD_WEBHOOK)', !!j.webhook);
        } catch (e) { setStatus('⚠ relais injoignable (déploiement « Tout le monde » ?)', false); }
    };
    window.discordWebhookSave = async function () {
        const inp = document.getElementById('dc-webhook'), url = (inp.value || '').trim();
        if (/discord(app)?\.com\/api\/webhooks/i.test(url)) { inp.value = ''; setStatus('⛔ Ne colle PAS le webhook ici : il va dans le relais (voir l\'aide ci-dessous)', false); return; }
        if (!RELAY_RE.test(url)) { setStatus('❌ adresse invalide (https://script.google.com/macros/s/…/exec)', false); return; }
        try {
            await db.collection('config').doc('discord').set({ relayUrl: url, updatedAt: firebase.firestore.Timestamp.now() });
            inp.value = ''; relayCache = url; relayAt = Date.now(); await window.discordWebhookStatus();
        } catch (e) { setStatus('❌ enregistrement refusé — ' + (e.code || e.message) + ' (règles Firestore à publier ?)', false); }
    };

    const blobB64 = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(b); });
    async function relaySend(messages) {
        const url = await getRelay();
        if (!url) return { ok: false, error: 'no_relay' };
        const user = (typeof auth !== 'undefined') ? auth.currentUser : null;
        if (!user) return { ok: false, error: 'auth' };
        const idToken = await user.getIdToken();
        try {
            const res = await fetch(url, { method: 'POST', body: JSON.stringify({ idToken, messages }) });   // text/plain : pas de pré-vérification CORS
            return await res.json();
        } catch (e) {
            console.error('[discord] relais injoignable', e); relayAt = 0;
            return { ok: false, error: 'relais injoignable' };
        }
    }

    /* ───────── Envoi Discord ───────── */
    window.postRapportToDiscord = async function (data, opts) {
        opts = opts || {};
        try {
            const gradeDef = GRADES.find(g => g.nom === data.grade) || GRADES[0];
            const content = opts.test
                ? [`${gradeDef.icon} **🧪 SIMULATION — Rapport de ${data.membreNom}**`, '*Aperçu de rendu envoyé depuis le panneau admin — aucune validation réelle, aucun ping.*'].join('\n')
                : [`<@&${ROLE_PINGS[0]}> <@&${ROLE_PINGS[1]}>`,
                   `${gradeDef.icon} **📜 Nouveau Rapport — ${data.membreNom}**`,
                   'Un rapport d\'incantation vient d\'être soumis et attend validation.'].join('\n');
            const messages = [];
            try { const carte = await renderRapportCard(data); if (carte) messages.push({ content, ping: !opts.test, test: !!opts.test, files: [{ name: 'carte.png', b64: await blobB64(carte) }] }); }
            catch (e) { console.error('Carte rapport :', e); }
            if (data.screenshot) {
                try { const preuve = await renderScreenshotCard(data.screenshot, gradeDef); if (preuve) messages.push({ content: '', test: !!opts.test, files: [{ name: 'preuve.png', b64: await blobB64(preuve) }] }); }
                catch (e) { console.error('Preuve rapport :', e); }
            }
            if (!messages.length) return false;
            const j = await relaySend(messages);
            if (!j.ok) { console.error('[discord] échec :', j.error); window.__lastDiscordError = errText(j.error); return false; }
            return true;
        } catch (e) { console.error('Discord (rapport) :', e); window.__lastDiscordError = String(e.message || e); return false; }
    };

    /* ───────── Simulateur admin ───────── */
    const SAMPLE = {
        incan:  ['Chaînes d\'Âmes Brisées', 'Voile du Crépuscule', 'Pacte des Mille Murmures', 'Étreinte du Vide', 'Rituel de la Lune Noire', 'Sceau de l\'Anmaniark'],
        cible:  ['Un cobaye consentant', 'Le gardien de la crypte', 'Un esprit mineur', 'Soi-même (rituel de focalisation)'],
        socle:  ['Cristal d\'obsidienne', 'Os de corbeau gravé', 'Cendres de sphère', 'Lame rituelle'],
        salle:  ['Salle des Échos', 'Crypte inférieure', 'Sanctum des Voiles', 'Cercle extérieur'],
        usage:  ['Test de résonance sur un sujet volontaire : l\'incantation a tenu trois battements avant de se dissiper.',
                 'Démonstration devant le Conclave. Effet stable, aucune dérive observée, coût en énergie conforme.']
    };
    const pick = a => a[Math.floor(Math.random() * a.length)];

    // Fausse capture d'écran (dégradé + silhouette de fenêtre de jeu), pour tester la carte de preuve
    function fakeScreenshot() {
        const c = document.createElement('canvas'); c.width = 1280; c.height = 620;
        const x = c.getContext('2d');
        const g = x.createLinearGradient(0, 0, 1280, 620); g.addColorStop(0, '#12202e'); g.addColorStop(1, '#2a1a3a');
        x.fillStyle = g; x.fillRect(0, 0, 1280, 620);
        for (let i = 0; i < 70; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * .25})`; x.fillRect(Math.random() * 1280, Math.random() * 620, 2, 2); }
        x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, 540, 1280, 80);
        x.fillStyle = '#e6ecf0'; x.font = '26px sans-serif'; x.fillText('[Capture de test — simulation de rapport]', 40, 590);
        x.strokeStyle = 'rgba(42,201,188,.7)'; x.lineWidth = 3; x.beginPath(); x.arc(640, 270, 120, 0, 7); x.stroke();
        x.beginPath(); x.arc(640, 270, 70, 0, 7); x.stroke();
        return c.toDataURL('image/png');
    }
    function sampleData(gradeNom) {
        const me = (typeof currentMembre !== 'undefined' && currentMembre) ? currentMembre : null;
        const nom = me ? ((me.prenom && me.nom) ? me.prenom + ' ' + me.nom : (me.nom || me.prenom || 'Membre Test')) : 'Membre Test';
        return {
            membreNom: nom, grade: gradeNom, incanNom: pick(SAMPLE.incan),
            dateRap: new Date().toLocaleDateString('fr-FR'), accesSalle: pick(SAMPLE.salle), cible: pick(SAMPLE.cible),
            socleUtilise: pick(SAMPLE.socle), usage: pick(SAMPLE.usage), screenshot: fakeScreenshot(),
            ptsGagnes: 10 + Math.floor(Math.random() * 40), manipGagnes: 5 + Math.floor(Math.random() * 25)
        };
    }

    let simData = null, simUrls = [];
    function ensureModal() {
        if (document.getElementById('modal-sim-rapport')) return;
        const el = document.createElement('div');
        el.className = 'modal-overlay hidden'; el.id = 'modal-sim-rapport';
        el.setAttribute('data-glitch-safe', '1');
        el.innerHTML = `
          <div class="modal-box" style="max-width:min(980px,94vw);width:100%;max-height:92vh;overflow:auto" onclick="event.stopPropagation()">
            <div class="modal-head"><span class="modal-head-title">🧪 Simulation de rapport</span>
              <button class="modal-close" onclick="closeModal('modal-sim-rapport')">✕</button></div>
            <div class="modal-body">
              <div style="display:flex;gap:.6rem;flex-wrap:wrap;align-items:center;margin-bottom:.9rem">
                <select id="sim-grade" class="form-control" style="width:auto"></select>
                <button class="btn btn-ghost btn-sm" onclick="simulerRapportRegen(true)">🎲 Autre exemple</button>
                <button class="btn btn-ghost btn-sm" onclick="simulerRapportTelecharger()">⬇ Télécharger</button>
                <button class="btn btn-primary btn-sm" id="sim-send" onclick="simulerRapportEnvoyer()" style="margin-left:auto">📨 Envoyer ce test sur Discord</button>
              </div>
              <div style="font-size:.72rem;color:var(--text-muted);margin-bottom:.8rem">Aperçu fidèle de ce qui part sur Discord à la validation d'un rapport. L'envoi de test n'identifie aucun rôle (aucun ping) et est préfixé « SIMULATION ».</div>
              <div id="sim-status" style="font-size:.78rem;margin-bottom:.6rem;min-height:1.1em"></div>
              <div id="sim-preview" style="display:flex;flex-direction:column;gap:.9rem"></div>
            </div>
          </div>`;
        el.addEventListener('click', () => closeModal('modal-sim-rapport'));
        document.body.appendChild(el);
        const sel = el.querySelector('#sim-grade');
        sel.innerHTML = GRADES.map(g => `<option value="${g.nom}">${g.icon} ${g.nom}</option>`).join('');
        sel.addEventListener('change', () => simulerRapportRegen(false));
    }
    window.simulerRapport = function () {
        ensureModal(); openModal('modal-sim-rapport');
        const sel = document.getElementById('sim-grade');
        const mine = (typeof currentMembre !== 'undefined' && currentMembre && currentMembre.grade) || '';
        if (mine && GRADES.some(g => g.nom === mine)) sel.value = mine;
        simulerRapportRegen(true);
    };
    window.simulerRapportRegen = async function (fresh) {
        const status = document.getElementById('sim-status'), box = document.getElementById('sim-preview');
        const grade = document.getElementById('sim-grade').value;
        status.style.color = 'var(--text-muted)'; status.textContent = '⏳ Génération des cartes…';
        try {
            if (fresh || !simData) simData = sampleData(grade); else simData.grade = grade;
            const gradeDef = GRADES.find(g => g.nom === grade) || GRADES[0];
            const [carte, preuve] = await Promise.all([renderRapportCard(simData), renderScreenshotCard(simData.screenshot, gradeDef)]);
            simUrls.forEach(URL.revokeObjectURL);
            simUrls = [URL.createObjectURL(carte), URL.createObjectURL(preuve)];
            box.innerHTML = simUrls.map(u => `<img src="${u}" style="width:100%;border-radius:10px;border:1px solid rgba(255,255,255,.08)">`).join('');
            status.textContent = '';
        } catch (e) { status.style.color = '#ff8a8a'; status.textContent = 'Erreur de rendu : ' + (e.message || e); }
    };
    window.simulerRapportTelecharger = function () {
        if (!simUrls[0]) return;
        const a = document.createElement('a'); a.href = simUrls[0]; a.download = 'simulation-rapport.png'; a.click();
    };
    window.simulerRapportEnvoyer = async function () {
        if (!simData) return;
        if (!confirm('Envoyer ce rapport de TEST dans le salon Discord des rapports ?\n(Préfixé « SIMULATION », sans aucun ping.)')) return;
        const status = document.getElementById('sim-status'), btn = document.getElementById('sim-send');
        btn.disabled = true; status.style.color = 'var(--text-muted)'; status.textContent = '📨 Envoi en cours…';
        const ok = await postRapportToDiscord(simData, { test: true });
        btn.disabled = false;
        status.style.color = ok ? '#72ff8c' : '#ff8a8a';
        status.textContent = ok ? '✅ Envoyé sur Discord.' : '❌ ' + (window.__lastDiscordError || 'Échec de l\'envoi (voir la console).');
    };
})();

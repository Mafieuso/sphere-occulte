/* ════════════════════════════════════════════════════════════════
   SPHÈRE OCCULTE — Corruption v2
   Une expérience qui monte lentement : le site « remarque » la personne,
   lui parle par son prénom, la regarde, la suit… puis crie.
   API : Corruption.set(true|false, {name, grade, role})
         Corruption.preview(speed)        (aperçu local, rien n'est enregistré)
   Sécurité : Échap ×5 (rapide) coupe l'effet localement ; l'admin garde un
   bouton d'arrêt permanent ; « réduire les animations » désactive les flashs.
   ════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';
    const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const PARAMS  = new URLSearchParams(location.search);
    const IMG     = n => 'img/corruption/' + n + '.jpg';
    const rnd = (a, b) => a + Math.random() * (b - a);
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
    const $ = (s, r = document) => r.querySelector(s);
    const mk = (tag, id, cls, parent) => { const e = document.createElement(tag); if (id) e.id = id; if (cls) e.className = cls; (parent || document.body).appendChild(e); return e; };
    const CM = () => (typeof currentMembre !== 'undefined' ? currentMembre : null);   // 'let' global de index.html
    const modalOpen = () => !!document.querySelector('.modal-overlay:not(.hidden)');

    let S = null;                      // état de la session de Corruption (null = inactive)
    let aborted = false;               // Échap ×5 : coupe jusqu'au prochain rechargement
    let mouse = { x: innerWidth / 2, y: innerHeight / 2, t: performance.now(), moved: 0 };
    addEventListener('mousemove', e => {
        mouse.x = e.clientX; mouse.y = e.clientY; mouse.t = performance.now(); mouse.moved++;
        if (S) { document.documentElement.style.setProperty('--co-mx', e.clientX + 'px'); document.documentElement.style.setProperty('--co-my', e.clientY + 'px'); }
    }, { passive: true });

    /* ═════════════ AUDIO (synthèse WebAudio, aucun fichier) ═════════════ */
    const A = { ctx: null, master: null, ir: null, drone: null };
    function audioCtx() {
        if (!A.ctx) {
            try {
                const AC = window.AudioContext || window.webkitAudioContext;
                A.ctx = new AC();
                const comp = A.ctx.createDynamicsCompressor();
                comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 10; comp.attack.value = .003; comp.release.value = .25;
                A.master = A.ctx.createGain(); A.master.gain.value = .9;
                A.master.connect(comp); comp.connect(A.ctx.destination);
                // réverb synthétique (bruit à décroissance exponentielle)
                const len = A.ctx.sampleRate * 2.2, buf = A.ctx.createBuffer(2, len, A.ctx.sampleRate);
                for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
                A.ir = A.ctx.createConvolver(); A.ir.buffer = buf;
                const wet = A.ctx.createGain(); wet.gain.value = .5; A.ir.connect(wet); wet.connect(A.master);
            } catch (e) { A.ctx = null; }
        }
        if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume().catch(() => {});
        return A.ctx && A.ctx.state === 'running' ? A.ctx : null;
    }
    ['pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, () => { if (S) audioCtx(); }, { passive: true }));
    const noiseBuf = () => {
        if (A.nb) return A.nb;
        const c = A.ctx, b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = b.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        return (A.nb = b);
    };
    function out(node, pan, wet) {
        const c = A.ctx; let n = node;
        if (c.createStereoPanner && pan) { const p = c.createStereoPanner(); p.pan.value = pan; n.connect(p); n = p; }
        n.connect(A.master); if (wet) { const g = c.createGain(); g.gain.value = wet; n.connect(g); g.connect(A.ir); }
    }
    const SFX = {
        beat(vol) {                                      // « boum-boum »
            const c = audioCtx(); if (!c) return;
            [0, .2].forEach((dt, k) => {
                const t = c.currentTime + dt, o = c.createOscillator(), g = c.createGain();
                o.type = 'sine'; o.frequency.setValueAtTime(70 - k * 8, t); o.frequency.exponentialRampToValueAtTime(34, t + .16);
                g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * (k ? .7 : 1), t + .012); g.gain.exponentialRampToValueAtTime(.0008, t + .22);
                o.connect(g); out(g, 0, 0); o.start(t); o.stop(t + .25);
            });
        },
        breath(vol, pan) {                               // souffle près de l'oreille
            const c = audioCtx(); if (!c) return;
            const t = c.currentTime, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
            s.buffer = noiseBuf(); s.loop = true; f.type = 'bandpass'; f.Q.value = .8;
            f.frequency.setValueAtTime(900, t); f.frequency.linearRampToValueAtTime(2600, t + 1.1); f.frequency.linearRampToValueAtTime(700, t + 2.4);
            g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 1.0); g.gain.linearRampToValueAtTime(0, t + 2.4);
            s.connect(f); f.connect(g); out(g, pan || 0, .6); s.start(t); s.stop(t + 2.5);
        },
        knock(n, vol) {                                  // coups sourds derrière une porte
            const c = audioCtx(); if (!c) return;
            for (let i = 0; i < n; i++) {
                const t = c.currentTime + i * rnd(.28, .42), o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
                o.type = 'triangle'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(48, t + .1);
                f.type = 'lowpass'; f.frequency.value = 420;
                g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .004); g.gain.exponentialRampToValueAtTime(.001, t + .3);
                o.connect(f); f.connect(g); out(g, rnd(-.7, .7), .35); o.start(t); o.stop(t + .35);
            }
        },
        static(dur, vol) {                               // parasites
            const c = audioCtx(); if (!c) return;
            const t = c.currentTime, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
            s.buffer = noiseBuf(); s.loop = true; f.type = 'highpass'; f.frequency.value = 1800;
            g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
            s.connect(f); f.connect(g); out(g, 0, 0); s.start(t); s.stop(t + dur + .05);
        },
        creak(vol) {                                     // grincement qui glisse
            const c = audioCtx(); if (!c) return;
            const t = c.currentTime, o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter(), lfo = c.createOscillator(), lg = c.createGain();
            o.type = 'sawtooth'; o.frequency.setValueAtTime(rnd(160, 260), t); o.frequency.exponentialRampToValueAtTime(rnd(60, 100), t + 1.8);
            lfo.frequency.value = rnd(14, 28); lg.gain.value = 18; lfo.connect(lg); lg.connect(o.frequency);
            f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 5;
            g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * 3.2, t + .3); g.gain.linearRampToValueAtTime(0, t + 1.9);
            o.connect(f); f.connect(g); out(g, rnd(-.6, .6), .5); o.start(t); lfo.start(t); o.stop(t + 2); lfo.stop(t + 2);
        },
        groan(vol) {                                     // plainte grave « humaine »
            const c = audioCtx(); if (!c) return;
            const t = c.currentTime, o = c.createOscillator(), g = c.createGain(), v = c.createOscillator(), vg = c.createGain();
            o.type = 'sawtooth'; o.frequency.setValueAtTime(rnd(105, 130), t); o.frequency.linearRampToValueAtTime(rnd(70, 90), t + 3);
            v.frequency.value = 5.3; vg.gain.value = 4; v.connect(vg); vg.connect(o.frequency);
            const fs = [[620, 8], [1000, 9], [2500, 12]].map(([fq, q]) => { const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = fq; b.Q.value = q; o.connect(b); b.connect(g); return b; });
            g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * 2.8, t + 1); g.gain.linearRampToValueAtTime(0, t + 3.2);
            out(g, rnd(-.5, .5), .7); o.start(t); v.start(t); o.stop(t + 3.3); v.stop(t + 3.3);
        },
        thud(vol) {                                      // coup lourd
            const c = audioCtx(); if (!c) return;
            const t = c.currentTime, o = c.createOscillator(), g = c.createGain();
            o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(26, t + .5);
            g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + .7);
            o.connect(g); out(g, 0, .2); o.start(t); o.stop(t + .75);
        },
        scream(vol) {                                    // cri : pitch qui grimpe + formants + saturation
            const c = audioCtx(); if (!c) return;
            const t = c.currentTime, dur = 1.7;
            const bus = c.createGain(); bus.gain.value = 1;
            const drive = c.createWaveShaper(), curve = new Float32Array(2048);
            for (let i = 0; i < 2048; i++) { const x = i / 1024 - 1; curve[i] = Math.tanh(x * 7); }
            drive.curve = curve; drive.oversample = '2x';
            const env = c.createGain();
            env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(vol, t + .012); env.gain.setValueAtTime(vol, t + .9); env.gain.exponentialRampToValueAtTime(.001, t + dur);
            const mkOsc = (type, det) => {
                const o = c.createOscillator(); o.type = type;
                const f0 = 430, p = [f0, f0 * 1.9, f0 * 2.7, f0 * 1.5], tm = [0, .22, .65, dur];
                for (let i = 0; i < 4; i++) o.frequency[i ? 'exponentialRampToValueAtTime' : 'setValueAtTime'](p[i] * det, t + tm[i]);
                const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 62; lg.gain.value = 55; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + dur);
                const am = c.createOscillator(), ag = c.createGain(); am.frequency.value = 71; ag.gain.value = .35; const gain = c.createGain(); gain.gain.value = .65; am.connect(ag); ag.connect(gain.gain); am.start(t); am.stop(t + dur);
                o.connect(gain); gain.connect(bus); o.start(t); o.stop(t + dur + .05);
            };
            mkOsc('sawtooth', 1); mkOsc('sawtooth', 1.012); mkOsc('square', .5);
            const n = c.createBufferSource(), ng = c.createGain(); n.buffer = noiseBuf(); n.loop = true; ng.gain.value = .5; n.connect(ng); ng.connect(bus); n.start(t); n.stop(t + dur);
            [[800, 1050], [1500, 2100], [3000, 3300]].forEach(([a, b], k) => {
                const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 7 - k * 2;
                f.frequency.setValueAtTime(a, t); f.frequency.linearRampToValueAtTime(b, t + .5); f.frequency.linearRampToValueAtTime(a * 1.1, t + dur);
                bus.connect(f); f.connect(drive);
            });
            drive.connect(env); out(env, 0, .45);
            SFX.thud(vol * .9);
        }
    };

    /* ═════════════ TEXTES PERSONNALISÉS ═════════════ */
    const pad2 = n => String(n).padStart(2, '0');
    const nameOf = () => (S && S.name) || 'toi';
    function whisperLines(I) {
        const n = nameOf(), d = new Date(), hh = pad2(d.getHours()), mm = pad2(d.getMinutes());
        const base = [
            `${n}.`, `${n}... ${n}...`, 'Je te vois.', 'Tu m\'entends ?', 'Ne bouge pas.',
            `Il est ${hh}:${mm}.`, 'Elle est derrière toi.', 'Regarde-moi.', 'Pas encore.'
        ];
        const mid = [
            `${n}, pourquoi tu ne réponds pas ?`, 'Tu n\'aurais pas dû rester.', 'Je suis plus près que tu ne le crois.',
            'Tu sens le froid ?', `On t'attend, ${n}.`, 'Ne ferme pas les yeux.'
        ];
        const late = [
            `${n}. Retourne-toi.`, 'C\'est trop tard.', 'Tu ne partiras pas.', 'Je suis déjà là.', `Elle sait ton nom, ${n}.`, 'Cours.'
        ];
        return I < .3 ? base : I < .62 ? base.concat(mid) : mid.concat(late);
    }
    function typedLines(I) {
        const n = nameOf(), d = new Date(), hh = pad2(d.getHours()), mm = pad2(d.getMinutes());
        const mins = Math.max(1, Math.round((S.elapsed || 0) / 60));
        const l = [
            `${n}.`, `Il est ${hh}:${mm}.`, 'Tu es seul(e) ? Vraiment ?', 'Quelqu\'un a lu par-dessus ton épaule.',
            `Tu es là depuis ${mins} minute${mins > 1 ? 's' : ''}. Je compte.`, 'Ne regarde pas derrière toi.'
        ];
        if (S.grade) l.push(`${S.grade}... ils disent que c'est un honneur.`);
        if (I > .35) l.push('Ça ne s\'arrête pas quand tu fermes la page.', 'Pourquoi tu as cliqué ?', 'Elle respire dans ta nuque.');
        if (I > .65) l.push(`${n}, ${n}, ${n}, ${n}, ${n}`, 'JE SUIS DANS L\'ÉCRAN', 'REGARDE-MOI');
        return l;
    }
    const TITLES = ['Sphère Occulte', '…', 'Tu es là ?', 'Ne te retourne pas', 'Je te vois', 'Il est derrière toi'];

    /* ═════════════ DÉCORS & COUCHES ═════════════ */
    let origTitle = '', origIcon = null, faviconEl = null;
    function eyeFavicon() {
        const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
        x.fillStyle = '#000'; x.fillRect(0, 0, 64, 64);
        x.fillStyle = '#e9e3d4'; x.beginPath(); x.ellipse(32, 32, 28, 17, 0, 0, 7); x.fill();
        x.fillStyle = '#7a1018'; x.beginPath(); x.arc(32, 32, 11, 0, 7); x.fill();
        x.fillStyle = '#000'; x.beginPath(); x.arc(32, 32, 6, 0, 7); x.fill();
        return c.toDataURL('image/png');
    }
    function buildLayers() {
        S.els = {
            vig: mk('div', 'co-vignette'), tint: mk('div', 'co-tint'), cracks: mk('div', 'co-cracks'), dark: mk('div', 'co-dark'),
            ghost: mk('div', 'co-ghost'), type: mk('div', 'co-type'), black: mk('div', 'co-black'),
            scream: mk('div', 'co-scream'), error: mk('div', 'co-error'),
            hijack: mk('div', 'co-hijack'), catcher: mk('div', 'co-catch')
        };
        S.els.black.innerHTML = '<div class="eyes-wall"></div>';
        S.els.scream.innerHTML = '<div class="face"></div><div class="red"></div>';
        S.els.error.innerHTML = '<div class="bar">⚠ ERREUR SYSTÈME</div><div class="msg"></div><div class="btns"><span>Annuler</span><span>OK</span></div>';
        S.els.lurker = mk('div', 'co-lurker');
        S.els.hand = mk('div', 'co-hand');
        document.documentElement.classList.add('co-on');
        // préchargement des visuels de cri
        ['scream', 'eyes', 'cracks'].forEach(n => { const i = new Image(); i.src = IMG(n); });
        origTitle = document.title;
        faviconEl = $('link[rel="icon"]'); origIcon = faviconEl && faviconEl.href;
    }
    function destroyLayers() {
        Object.values(S.els || {}).forEach(e => e && e.remove());
        document.documentElement.classList.remove('co-on', 'co-heavy');
        document.documentElement.style.removeProperty('--co-i');
        document.querySelectorAll('.co-eyes,.co-hidden-eye,#co-stop').forEach(e => e.remove());
        document.title = origTitle || document.title;
        if (faviconEl && origIcon) faviconEl.href = origIcon;
        try { speechSynthesis.cancel(); } catch (e) {}
    }

    /* ═════════════ ÉVÉNEMENTS ═════════════ */
    const later = (fn, ms) => { const id = setTimeout(() => { if (S) fn(); }, ms); S.timeouts.push(id); return id; };
    const I = () => S ? S.I : 0;
    const pageOkForFx = () => !modalOpen();

    function whisper(force) {
        if (!('speechSynthesis' in window)) return;
        const txt = pick(whisperLines(I()));
        const u = new SpeechSynthesisUtterance(txt);
        const voices = speechSynthesis.getVoices() || [];
        const fr = voices.filter(v => /^fr/i.test(v.lang)); if (fr.length) u.voice = pick(fr);
        u.lang = 'fr-FR'; u.pitch = rnd(.05, .45); u.rate = rnd(.5, .78); u.volume = clamp(.3 + I() * .55, 0, .9);
        SFX.breath(.05 + I() * .08, pick([-.8, .8]));
        later(() => { try { speechSynthesis.speak(u); } catch (e) {} }, 700);
    }
    function typed(text) {
        const el = S.els.type; if (!el || el.classList.contains('on')) return;
        text = text || pick(typedLines(I()));
        const small = I() < .45;
        el.style.fontSize = (small ? rnd(1.15, 1.6) : rnd(1.8, 3.1)) + 'rem';
        el.style.left = rnd(6, 52) + 'vw'; el.style.top = rnd(14, 78) + 'vh';
        el.style.color = I() > .6 && Math.random() < .5 ? '#c4131f' : '#d9d4cc';
        el.innerHTML = '<span class="t"></span><i class="cur">&nbsp;</i>'; el.classList.add('on');
        const t = el.querySelector('.t'); let i = 0;
        const step = () => {
            if (!S) return;
            if (i < text.length) { t.textContent += text[i++]; later(step, rnd(45, 140)); }
            else later(() => {
                let k = text.length;                       // efface comme si on retapait
                const back = () => { if (!S) return; if (k > 0) { t.textContent = text.slice(0, --k); later(back, 28); } else { el.classList.remove('on'); } };
                back();
            }, rnd(1800, 3800));
        };
        step();
    }
    function eyes() {
        const max = 1 + Math.floor(I() * 3), have = document.querySelectorAll('.co-eyes').length;
        if (have >= max || !pageOkForFx()) return;
        const el = mk('div', '', 'co-eyes'), es = rnd(34, 74) * (1 + I() * .4);
        el.style.setProperty('--es', es + 'px'); el.style.setProperty('--gap', es * .34 + 'px');
        const edge = pick(['l', 'r', 't', 'b']);
        const x = edge === 'l' ? rnd(1, 7) : edge === 'r' ? rnd(86, 94) : rnd(8, 88), y = edge === 't' ? rnd(1, 8) : edge === 'b' ? rnd(88, 95) : rnd(10, 85);
        el.style.left = x + 'vw'; el.style.top = y + 'vh'; el.style.setProperty('--rot', rnd(-14, 14) + 'deg');
        el.innerHTML = '<div class="co-eye"><i class="co-pupil"></i></div><div class="co-eye"><i class="co-pupil"></i></div>';
        let alive = true; const born = performance.now();
        const track = () => {
            if (!alive || !S) return;
            const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = mouse.x - cx, dy = mouse.y - cy, d = Math.hypot(dx, dy) || 1;
            const k = es * .18; el.style.setProperty('--px', (dx / d * k) + 'px'); el.style.setProperty('--py', (dy / d * k * .55) + 'px');
            if (d < 130 && performance.now() - born > 1500) return leave(true);
            requestAnimationFrame(track);
        };
        const leave = scare => { if (!alive) return; alive = false; if (scare) SFX.knock(1, .35); el.classList.add('gone'); setTimeout(() => el.remove(), 500); };
        requestAnimationFrame(track);
        later(() => el.classList.add('blink'), rnd(2200, 3600)); later(() => el.classList.remove('blink'), 4000);
        later(() => leave(false), rnd(5000, 9500));
    }
    function ghostCursor() {
        const g = S.els.ghost; if (!g || g.classList.contains('on') || !pageOkForFx()) return;
        let x = Math.random() < .5 ? -30 : innerWidth + 10, y = rnd(80, innerHeight - 100);
        const tx = rnd(innerWidth * .2, innerWidth * .8), ty = rnd(innerHeight * .2, innerHeight * .8);
        const chase = I() > .45 && Math.random() < .5;
        g.style.transform = `translate(${x}px,${y}px)`; g.classList.add('on');
        const t0 = performance.now(), dur = rnd(5200, 8800);
        let alive = true;
        const move = now => {
            if (!alive || !S) return;
            const p = (now - t0) / dur; if (p >= 1) return end();
            const ease = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
            const goalX = chase ? mouse.x + 26 : tx, goalY = chase ? mouse.y + 18 : ty;
            x += (goalX - x) * (.02 + ease * .035) + Math.sin(now / 160) * .7; y += (goalY - y) * (.02 + ease * .035) + Math.cos(now / 200) * .6;
            g.style.transform = `translate(${x}px,${y}px)`;
            if (chase && Math.hypot(x - mouse.x - 26, y - mouse.y - 18) < 24) { SFX.static(.18, .12); return end(); }
            requestAnimationFrame(move);
        };
        const end = () => { alive = false; g.classList.remove('on'); };
        requestAnimationFrame(move);
    }
    function blackout(cb, withWall) {
        const b = S.els.black; if (!b || b.dataset.busy) return;
        b.dataset.busy = '1'; SFX.thud(.5); SFX.static(.25, .18);
        const hold = rnd(900, 2300), fade = REDUCED ? 700 : 90;
        b.style.transition = `opacity ${fade}ms linear`; b.style.opacity = '1';
        if (withWall) b.classList.add('wall');
        later(() => { if (cb) cb(); }, fade + 60);
        later(() => {
            b.classList.remove('wall'); b.style.transition = 'opacity 260ms ease-out'; b.style.opacity = '.0';
            if (!REDUCED) { later(() => { b.style.transition = 'none'; b.style.opacity = '1'; }, 420); later(() => { b.style.transition = 'opacity 340ms ease-out'; b.style.opacity = '0'; }, 560); }
            later(() => { delete b.dataset.busy; }, 1200);
        }, hold);
    }
    function lurker(step) {
        const L = S.els.lurker; if (!L) return;
        const side = Math.random() < .5 ? 'left' : 'right';
        L.style.left = side === 'left' ? rnd(1, 9) + 'vw' : 'auto'; L.style.right = side === 'right' ? rnd(1, 9) + 'vw' : 'auto';
        L.style.height = (30 + step * 9) + 'vh';
        L.classList.add('on');
        const gone = () => { L.classList.remove('on'); };
        const watch = setInterval(() => {                      // il disparaît si on le regarde de trop près
            const r = L.getBoundingClientRect();
            if (!S || Math.hypot(mouse.x - (r.left + r.width / 2), mouse.y - (r.top + r.height / 2)) < r.height * .55) { clearInterval(watch); gone(); }
        }, 250);
        S.intervals.push(watch);
        later(() => { clearInterval(watch); gone(); }, rnd(3800, 7800));
    }
    function hand() {
        const h = S.els.hand; if (!h || h.classList.contains('on') || !pageOkForFx()) return;
        h.style.left = rnd(10, 60) + 'vw'; h.style.top = '102vh'; h.style.transform = 'translateY(0)';
        void h.offsetWidth; h.classList.add('on'); h.style.transform = `translateY(-${rnd(34, 58)}vh)`;
        later(() => { h.classList.remove('on'); }, 5200);
    }
    function flashlight() {
        const d = S.els.dark; if (!d || d.classList.contains('on') || modalOpen()) return;
        d.style.setProperty('--co-r', rnd(130, 190) + 'px'); d.classList.add('on'); SFX.creak(.18);
        const sprites = [];
        for (let i = 0; i < 6; i++) {                          // yeux cachés dans le noir, révélés par le faisceau
            const e = mk('div', '', 'co-eyes co-hidden-eye'); const es = rnd(30, 52);
            e.style.cssText = `left:${rnd(5, 88)}vw;top:${rnd(10, 84)}vh;--es:${es}px;--gap:${es * .3}px;--rot:${rnd(-10, 10)}deg;opacity:1;z-index:99001`;
            e.innerHTML = '<div class="co-eye"><i class="co-pupil"></i></div><div class="co-eye"><i class="co-pupil"></i></div>'; sprites.push(e);
        }
        const track = setInterval(() => sprites.forEach(e => {
            const r = e.getBoundingClientRect(), dx = mouse.x - (r.left + r.width / 2), dy = mouse.y - (r.top + r.height / 2), dd = Math.hypot(dx, dy) || 1;
            e.style.setProperty('--px', dx / dd * 6 + 'px'); e.style.setProperty('--py', dy / dd * 3 + 'px');
        }), 120);
        S.intervals.push(track);
        const dur = rnd(18000, 30000) / Math.max(1, S.speed * .6);
        later(() => whisper(), 3000); later(() => SFX.breath(.12, -.7), 6000); later(() => SFX.knock(2, .3), 11000);
        later(() => { d.classList.remove('on'); clearInterval(track); sprites.forEach(e => e.remove()); }, dur);
    }
    function fakeError() {
        const e = S.els.error; if (!e || e.classList.contains('on')) return;
        const n = nameOf();
        e.querySelector('.msg').textContent = pick([
            `Une présence non identifiée a pris le contrôle de cette session.`,
            `${n} ne peut pas quitter cette page.`, `Erreur 0x666 : ${n} est observé(e).`, `Connexion perdue avec la Sphère. Elle te cherche, ${n}.`
        ]);
        e.classList.add('on'); SFX.static(.12, .1); later(() => e.classList.remove('on'), rnd(3500, 5200));
    }
    function silenceThenScream() {
        if (REDUCED) { SFX.knock(3, .4); typed('…'); return; }
        const a = $('#bg-audio'), vol0 = a ? a.volume : 0;
        S.screaming = true; S.savedVol = vol0;
        if (a) a.volume = 0;                                   // le silence avant le cri
        later(() => SFX.knock(rnd(1, 3) | 0 || 1, .25), 900);
        later(() => {
            const sc = S.els.scream, face = sc.querySelector('.face');
            face.style.backgroundImage = `url(${IMG('scream')})`;
            sc.querySelectorAll('.tear').forEach(t => t.remove());
            for (let i = 0; i < 5; i++) { const t = document.createElement('div'); t.className = 'tear'; t.style.top = rnd(0, 100) + '%'; t.style.height = rnd(3, 14) + 'px'; sc.appendChild(t); }
            sc.classList.add('on'); SFX.scream(.78);
            S.lastScream = performance.now();
            later(() => { sc.classList.remove('on'); S.els.black.style.transition = 'none'; S.els.black.style.opacity = '1'; }, 1250);
            later(() => { S.els.black.style.transition = 'opacity 1600ms ease-out'; S.els.black.style.opacity = '0'; if (a) fadeAudio(a, vol0, 3500); S.screaming = false; }, 2600);
            later(() => SFX.beat(.4), 3000); later(() => whisper(), 5200);
        }, rnd(2000, 3400));
    }
    function fadeAudio(a, to, ms) { const from = a.volume, t0 = performance.now(); (function s(now) { const p = clamp((now - t0) / ms, 0, 1); a.volume = from + (to - from) * p; if (p < 1 && S) requestAnimationFrame(s); else a.volume = to; })(t0); }
    function portraitFlash() {
        const imgs = [...document.querySelectorAll('img')].filter(i => { const r = i.getBoundingClientRect(); return r.width > 50 && r.height > 50 && r.bottom > 0 && r.top < innerHeight && !i.id.startsWith('co-'); });
        if (!imgs.length) return;
        const im = pick(imgs), r = im.getBoundingClientRect(), f = mk('div', '', '');
        f.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;z-index:99006;pointer-events:none;background:url(${IMG(Math.random() < .5 ? 'scream' : 'figure')}) center/cover;filter:contrast(1.3)`;
        im.style.visibility = 'hidden'; SFX.static(.1, .1);
        later(() => { f.remove(); im.style.visibility = ''; }, rnd(110, 210));
    }
    function twistText() {
        const els = [...document.querySelectorAll('.panel-title, .section-title, .hero-sub, .btn, .nav-link, h2, h3')].filter(e => {
            if (e.dataset.coOrig !== undefined || e.closest('.modal-overlay:not(.hidden), [data-glitch-safe]')) return false;
            const r = e.getBoundingClientRect(); return e.children.length === 0 && r.width > 20 && r.top < innerHeight && r.bottom > 0 && e.textContent.trim().length > 2;
        });
        if (!els.length) return;
        const e = pick(els); e.dataset.coOrig = e.textContent;
        e.textContent = pick([nameOf(), 'regarde-moi', 'derrière toi', 'je suis là', 'il ne reste que toi', 'écoute', 'reste', 'tu trembles ?']);
        later(() => { if (e.dataset.coOrig !== undefined) { e.textContent = e.dataset.coOrig; delete e.dataset.coOrig; } }, rnd(900, 1900));
    }

    /* ═════════════ PRISE DE CONTRÔLE : le curseur n'obéit plus ═════════════
       Le vrai curseur disparaît, un faux (le même que le sien) prend le relais et fait
       des « interactions fantômes ». Tout est purement visuel et réversible : aucune
       donnée n'est modifiée, aucun vrai clic n'est envoyé à la page. */
    SFX.tick = function (vol) {
        const c = audioCtx(); if (!c) return;
        const t = c.currentTime, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
        s.buffer = noiseBuf(); f.type = 'bandpass'; f.frequency.value = rnd(1800, 3200); f.Q.value = 3;
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + .05);
        s.connect(f); f.connect(g); out(g, rnd(-.3, .3), 0); s.start(t, rnd(0, 1.5)); s.stop(t + .06);
    };
    SFX.shatter = function (vol) {
        const c = audioCtx(); if (!c) return;
        for (let i = 0; i < 14; i++) {
            const t = c.currentTime + i * rnd(.02, .09), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
            s.buffer = noiseBuf(); f.type = 'highpass'; f.frequency.value = rnd(2500, 7000);
            g.gain.setValueAtTime(vol * rnd(.4, 1), t); g.gain.exponentialRampToValueAtTime(.001, t + rnd(.08, .3));
            s.connect(f); f.connect(g); out(g, rnd(-.9, .9), .3); s.start(t, rnd(0, 1.5)); s.stop(t + .35);
        }
        SFX.thud(vol * 1.1);
    };

    const sleep = ms => new Promise(res => { const id = setTimeout(res, ms); if (S) S.timeouts.push(id); });
    function visible(sels) {
        const list = [].concat(...sels.map(s => [...document.querySelectorAll(s)])).filter(e => {
            if (e.closest('#co-stop, [id^="co-"], .modal-overlay.hidden')) return false;
            const r = e.getBoundingClientRect(), st = getComputedStyle(e);
            return r.width > 8 && r.height > 8 && r.top >= 40 && r.bottom <= innerHeight - 10 && r.left >= 0 && r.right <= innerWidth && st.visibility !== 'hidden' && st.display !== 'none';
        });
        return list.length ? pick(list) : null;
    }
    function ownCursorUrl() {                                  // le curseur personnalisé du site → c'est « le sien »
        const m = /url\("([^"]+)"\)/.exec(getComputedStyle(document.body).cursor || '');
        return m ? m[1] : null;
    }
    function poke(el, cls) {
        if (!el) return; el.classList.add(cls || 'co-poke'); SFX.tick(.1);
        setTimeout(() => el.classList.remove(cls || 'co-poke'), 650);
    }
    function ripple(x, y) {
        const r = mk('div', '', 'co-ripple'); r.style.left = x + 'px'; r.style.top = y + 'px'; setTimeout(() => r.remove(), 700);
    }
    function dlg(title, msg, buttons) {
        const d = mk('div', '', 'co-dlg');
        d.innerHTML = `<div class="bar">${title}</div><div class="msg"></div><div class="btns">${buttons.map((b, i) => `<span data-i="${i}">${b}</span>`).join('')}</div>`;
        d.querySelector('.msg').textContent = msg;
        requestAnimationFrame(() => d.classList.add('on'));
        return { el: d, btn: i => d.querySelector(`[data-i="${i}"]`), close() { d.classList.remove('on'); setTimeout(() => d.remove(), 300); } };
    }
    function toast(text, ms) {
        const t = mk('div', '', 'co-toast'); t.textContent = text; requestAnimationFrame(() => t.classList.add('on'));
        later(() => { t.classList.remove('on'); setTimeout(() => t.remove(), 400); }, ms || 3800);
    }
    function drain(els) {                                      // « détruit » un chiffre : il s'effondre vers 0 (restauré ensuite)
        els.forEach(el => {
            if (el.dataset.coOrig !== undefined) return;
            const raw = el.textContent.trim(), n = parseFloat(raw.replace(/[^\d.]/g, ''));
            if (!isFinite(n) || n <= 0) return;
            el.dataset.coOrig = el.textContent; const t0 = performance.now(), dur = 1800;
            (function s(now) {
                if (!S || el.dataset.coOrig === undefined) return;
                const p = clamp((now - t0) / dur, 0, 1);
                el.textContent = Math.round(n * (1 - p * p)) + (p > .55 && Math.random() < .3 ? ' ░' : '');
                el.style.color = '#ff3a48'; el.style.textShadow = '0 0 12px #f00';
                if (p < 1) requestAnimationFrame(s); else el.textContent = '0';
            })(t0);
        });
    }
    function undrain() {
        document.querySelectorAll('[data-co-orig]').forEach(e => { e.textContent = e.dataset.coOrig; delete e.dataset.coOrig; e.style.color = ''; e.style.textShadow = ''; });
    }

    async function takeover(name) {
        if (!S || S.tk || S.screaming || modalOpen() || REDUCED) return;
        const tok = S.tk = { name }, alive = () => S && S.tk === tok;
        const hj = S.els.hijack, catcher = S.els.catcher;
        const cur = ownCursorUrl(); if (cur) hj.style.backgroundImage = `url("${cur}")`;
        const pos = { x: mouse.x, y: mouse.y };
        const place = () => { hj.style.transform = `translate(${pos.x - 4}px,${pos.y - 3}px)`; };
        place(); hj.classList.add('on'); catcher.classList.add('on'); document.documentElement.classList.add('co-ghostmode');
        SFX.static(.18, .12); SFX.creak(.1);
        const move = (x, y, ms) => new Promise(res => {
            const x0 = pos.x, y0 = pos.y, t0 = performance.now(), wob = rnd(6, 18), ph = rnd(0, 6);
            const f = now => {
                if (!alive()) return res();
                const p = clamp((now - t0) / ms, 0, 1), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
                pos.x = x0 + (x - x0) * e + Math.sin(p * 9 + ph) * wob * (1 - p); pos.y = y0 + (y - y0) * e + Math.cos(p * 7 + ph) * wob * (1 - p);
                place(); if (p < 1) requestAnimationFrame(f); else res();
            };
            requestAnimationFrame(f);
        });
        const centre = el => { const r = el.getBoundingClientRect(); return [r.left + r.width * rnd(.3, .7), r.top + r.height * rnd(.35, .65)]; };
        const h = {
            alive, sleep: ms => sleep(ms),
            moveTo: (el, ms) => { if (!el) return Promise.resolve(); const [x, y] = centre(el); return move(x, y, ms || rnd(600, 1200)); },
            click: async el => {
                ripple(pos.x, pos.y); hj.classList.add('press'); SFX.tick(.16); poke(el);
                await sleep(130); hj.classList.remove('press');
            }
        };
        try { await SCENES[name](h); } catch (e) { console.warn('[co] scène', name, e); }
        // le curseur « rend » le contrôle : il glisse vers la vraie position de la souris
        if (alive()) { await move(mouse.x, mouse.y, 700); await sleep(250); }
        endTakeover(tok);
    }
    function endTakeover(tok) {
        if (!S || (tok && S.tk !== tok)) return;
        S.tk = null; S.els.hijack.classList.remove('on', 'press'); S.els.catcher.classList.remove('on');
        document.documentElement.classList.remove('co-ghostmode');
        document.querySelectorAll('.co-dlg,.co-toast,.co-ripple').forEach(e => e.remove());
        undrain();
    }

    const NAVTARGETS = ['.spa-nav-links a', '.spa-nav-links button', '.spa-nav-brand', '.sidebar-nav-item', '.dash-nav-item'];
    const POKETARGETS = ['.btn', '.pill', '.lb-card', '.grade-card-3d', '.hero-stat', '.section-title', '.panel-title', '#music-player button', '.stat-card', '.glass-card'].concat(NAVTARGETS);
    const SCENES = {
        // Plein de petites interactions : survols, clics, cases qui se cochent toutes seules…
        async pokes(h) {
            const n = 6 + (Math.random() * 6 | 0);
            for (let i = 0; i < n && h.alive(); i++) {
                const el = visible(POKETARGETS); if (!el) break;
                await h.moveTo(el, rnd(380, 900)); await h.sleep(rnd(120, 420));
                const r = Math.random();
                if (r < .5) await h.click(el);
                else if (r < .8) { poke(el, 'co-hover'); await h.sleep(rnd(300, 800)); }
                else { const old = el.textContent; if (!el.children.length && old.trim().length > 2 && old.length < 28) { el.dataset.coOrig = old; el.textContent = pick(['…', nameOf(), 'oui', 'là']); await h.sleep(500); el.textContent = old; delete el.dataset.coOrig; } else poke(el); }
            }
        },
        async energie(h) {
            const els = [...document.querySelectorAll('.pts-occulte, #hs-maxpts')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 8 && r.top > 30 && r.bottom < innerHeight; });
            const target = els.length ? pick(els) : visible(['.hero-stat', '.stat-card', '.lb-card']); if (!target) return;
            await h.moveTo(target, 1100); await h.sleep(500); await h.click(target);
            const d = dlg('ÉNERGIE OCCULTE', `Détruire l'énergie occulte de ${nameOf()} ?`, ['Annuler', 'Confirmer']);
            await h.sleep(700); await h.moveTo(d.btn(0), 700); await h.sleep(900);
            await h.moveTo(d.btn(1), 380); await h.sleep(200); await h.click(d.btn(1)); d.close();
            SFX.thud(.5); drain(els.length ? els : [target]);
            await h.sleep(2300); toast('Énergie occulte détruite.', 3000); await h.sleep(2400);
            toast(`…${nameOf()}, tu ne sentais rien ?`, 2600); await h.sleep(1200); undrain();
        },
        async quitter(h) {
            const t = visible(NAVTARGETS.concat(['.btn'])); if (!t) return;
            await h.moveTo(t, 900); await h.click(t);
            const d = dlg("QUITTER L'ORDRE", `${nameOf()} quitte l'Ordre. Cette action est irréversible.`, ['Oui', 'Oui']);
            await h.sleep(900); await h.moveTo(d.btn(0), 600); await h.sleep(700); await h.click(d.btn(0)); d.close();
            await h.sleep(500); toast('Tu as déjà quitté l\'Ordre. Tu ne t\'en souviens pas ?', 3600); await h.sleep(2600);
        },
        async deconnexion(h) {
            const t = visible(['#nl-logout', '.btn-danger', '#nl-auth']); if (!t) return;
            await h.moveTo(t, 1000); await h.sleep(400); await h.click(t);
            toast('Déconnexion impossible.', 2400); await h.sleep(1800); toast('Tu es déjà trop près.', 2600); await h.sleep(1800);
        },
        async monarque(h) {
            const t = visible(['#notif-bell', '.spa-nav-brand', '.btn-primary', '.btn']); if (!t) return;
            await h.moveTo(t, 1000); await h.click(t);
            toast(`✉ Message envoyé au Monarque : « ${nameOf()} est prêt(e). »`, 4200); await h.sleep(2600);
        },
        async contrat(h) {
            const d = dlg('PACTE', `J'accepte de céder mon nom, ${nameOf()}, à la Sphère.`, ['Refuser', "J'accepte"]);
            await h.sleep(800); await h.moveTo(d.btn(0), 1000); await h.sleep(1000); await h.moveTo(d.btn(1), 450); await h.click(d.btn(1)); d.close();
            SFX.thud(.4); toast('Merci.', 2200); await h.sleep(1800);
        },
        async musique(h) {
            const a = $('#bg-audio'), vol = $('#mp-vol'); if (!a || !vol) return;
            const t = visible(['#mp-vol', '.mp-slider-wrap']) || vol; await h.moveTo(t, 900); await h.sleep(300);
            const v0 = a.volume; await h.click(t);
            fadeAudio(a, Math.min(1, Math.max(v0 * 1.9, .55)), 900); await h.sleep(3600); fadeAudio(a, v0, 1500); await h.sleep(1600);
        },
        async defilement(h) {
            const y0 = scrollY, max = document.documentElement.scrollHeight - innerHeight; if (max < 200) return;
            const to = clamp(y0 + rnd(240, 900), 0, max);
            await h.moveTo(visible(POKETARGETS), 700);
            window.scrollTo({ top: to, behavior: 'smooth' }); await h.sleep(1700); window.scrollTo({ top: y0, behavior: 'smooth' }); await h.sleep(1300);
        }
    };
    const SCENE_POOL = [['pokes', 0, 2.2], ['musique', .3, .6], ['defilement', .2, .8], ['energie', .3, 1.1], ['deconnexion', .35, .9],
                        ['monarque', .4, .9], ['quitter', .45, .9], ['contrat', .5, .8]];
    function takeoverRandom() {
        const ok = SCENE_POOL.filter(s => I() >= s[1]), tot = ok.reduce((a, s) => a + s[2], 0); let r = Math.random() * tot;
        for (const s of ok) { r -= s[2]; if (r <= 0) return takeover(s[0]); }
    }

    /* ═════════════ AUTODESTRUCTION (très rare) : la page s'effondre puis se ferme ═════════════ */
    function unsavedInput() {
        return [...document.querySelectorAll('input[type=text],input[type=password],input[type=email],input[type=url],input[type=number],input[type=search],textarea,[contenteditable=true]')]
            .some(e => e.offsetParent && ((e.value || e.textContent || '').trim().length > 0));
    }
    async function selfDestruct() {
        if (!S || S.tk || S.screaming || S.destructing || modalOpen() || REDUCED) return;
        if (!S.preview && unsavedInput()) return;                   // jamais si la personne est en train d'écrire quelque chose
        S.destructing = true; const preview = S.preview;
        const a = $('#bg-audio'), vol0 = a ? a.volume : 0; if (a) a.volume = 0;
        SFX.static(.5, .25); document.documentElement.classList.add('co-crumble');
        const bits = [...document.querySelectorAll('#app .lb-card, #app .glass-card, #app .hero-stat, #app .grade-card-3d, #app .btn, #app .pill, #app .stat-card, .spa-nav, #music-player, #app h1, #app h2, #app .section-title, #app .panel-title')]
            .filter(e => { const r = e.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; });
        typed('C\'est fini.');
        await sleep(1800);
        SFX.shatter(.6); S.els.cracks.style.opacity = 1;
        bits.sort((x, y) => x.getBoundingClientRect().top - y.getBoundingClientRect().top).forEach((e, i) => {
            e.dataset.coCrumbleStyle = e.getAttribute('style') || '';
            e.style.transition = `transform ${rnd(.9, 1.7)}s cubic-bezier(.5,0,1,.6) ${i * 45}ms, opacity 1.1s ease-in ${i * 45 + 500}ms`;
            e.style.transform = `translate(${rnd(-80, 80)}px, ${innerHeight * 1.3}px) rotate(${rnd(-70, 70)}deg)`; e.style.opacity = '0';
        });
        await sleep(1400 + bits.length * 45); SFX.thud(.8);
        const b = S.els.black; b.style.transition = 'opacity 600ms linear'; b.style.opacity = '1'; await sleep(1200);
        if (preview) {                                              // aperçu admin : on restaure tout
            bits.forEach(e => { e.setAttribute('style', e.dataset.coCrumbleStyle); delete e.dataset.coCrumbleStyle; });
            document.documentElement.classList.remove('co-crumble'); b.style.opacity = '0'; S.els.cracks.style.opacity = '';
            if (a) a.volume = vol0; S.destructing = false; toast('(Aperçu : page restaurée — en vrai, elle se ferme ici.)', 4200); return;
        }
        try { sessionStorage.setItem('co_boom', String(Date.now())); } catch (e) {}
        document.body.innerHTML = '<div style="position:fixed;inset:0;background:#000;color:#6b0d14;display:flex;align-items:center;justify-content:center;font:600 1.1rem Georgia,serif;letter-spacing:.2em">…</div>';
        try { window.close(); } catch (e) {}
        setTimeout(() => { try { location.replace('about:blank'); } catch (e) {} }, 900);
    }

    /* ═════════════ RÉCIT : événements programmés + tirages aléatoires ═════════════ */
    const STORY = [
        { t: 12,  run: () => whisper() },
        { t: 28,  run: () => typed(`${nameOf()}.`) },
        { t: 42,  run: () => eyes() },
        { t: 58,  run: () => { SFX.knock(2, .22); whisper(); } },
        { t: 76,  run: () => ghostCursor() },
        { t: 96,  run: () => blackout(() => lurker(1)) },
        { t: 108, run: () => takeover('pokes') },
        { t: 118, run: () => typed() },
        { t: 138, run: () => flashlight() },
        { t: 176, run: () => blackout(() => { lurker(2); eyes(); }, true) },
        { t: 200, run: () => fakeError() },
        { t: 224, run: () => { typed(); hand(); } },
        { t: 232, run: () => takeover('energie') },
        { t: 252, run: () => blackout(() => lurker(3)) },
        { t: 275, run: () => silenceThenScream() }
    ];
    const POOL_MINOR = [
        [() => whisper(),     .2, 1.4], [() => typed(),       .0, 1.0], [() => eyes(),         .15, 1.0], [() => ghostCursor(), .3, .9],
        [() => twistText(),   .25, 1.0], [() => SFX.knock(1 + (Math.random() * 3 | 0), .22 + I() * .2), .1, 1.0], [() => SFX.creak(.12 + I() * .12), .15, .8],
        [() => SFX.groan(.1 + I() * .12), .35, .7], [() => hand(), .4, .6], [() => fakeError(), .45, .5], [() => portraitFlash(), .5, .8]
    ];
    const POOL_MAJOR = [
        [() => blackout(() => lurker(Math.min(5, 1 + (S.lurkStep = (S.lurkStep || 0) + 1)))), .2, 1.0],
        [() => flashlight(), .3, .8],
        [() => silenceThenScream(), .55, .7]
    ];
    function chooseFrom(pool) {
        const ok = pool.filter(p => I() >= p[1]), tot = ok.reduce((a, p) => a + p[2], 0);
        let r = Math.random() * tot; for (const p of ok) { r -= p[2]; if (r <= 0) return p[0]; }
        return ok.length ? ok[0][0] : null;
    }
    function tick() {
        if (!S || aborted) return;
        const now = performance.now(), sp = S.speed;
        S.elapsed = ((now - S.t0) / 1000) * sp;
        const e = S.elapsed;
        S.I = clamp(e < 60 ? e / 60 * .14 : e < 200 ? .14 + (e - 60) / 140 * .36 : e < 420 ? .5 + (e - 200) / 220 * .35 : .85 + Math.min(.15, (e - 420) / 900), 0, 1);
        document.documentElement.style.setProperty('--co-i', S.I.toFixed(3));
        document.documentElement.classList.toggle('co-heavy', S.I > .28);
        // récit programmé
        STORY.forEach(s => { if (!s.done && e >= s.t) { s.done = true; if (pageOkForFx() && !S.screaming) try { s.run(); } catch (err) { console.warn('[co]', err); } } });
        // titre d'onglet
        if (e - (S.lastTitle || 0) > 7 / Math.max(1, sp * .5)) { S.lastTitle = e; { const tt = pick(TITLES); document.title = tt === 'Sphère Occulte' ? origTitle : tt.replace('…', nameOf() + '…'); } if (faviconEl && Math.random() < .5) faviconEl.href = eyeFavicon(); else if (faviconEl && origIcon) faviconEl.href = origIcon; }
        // prise de contrôle du curseur (interactions fantômes) + autodestruction très rare
        if (e > 90 && !S.screaming && !S.tk && !S.destructing && pageOkForFx()) {
            const gapT = lerp(80, 24, S.I) / Math.max(1, sp * .8);
            if (e - (S.lastTake || 120) > gapT && Math.random() < .18) { S.lastTake = e; takeoverRandom(); }
            let boomOk = true; try { boomOk = Date.now() - (+sessionStorage.getItem('co_boom') || 0) > 3600e3; } catch (err) {}
            if (boomOk && e > 600 && S.I > .85 && Math.random() < .0009) selfDestruct();
        }
        // tirages après l'intro
        if (e > 60 && !S.screaming && !S.tk && !S.destructing && pageOkForFx()) {
            const gapMin = lerp(14, 5, S.I) / Math.max(1, sp * .7);
            if (e - (S.lastMinor || 0) > gapMin && Math.random() < .35) { S.lastMinor = e; const f = chooseFrom(POOL_MINOR); if (f) try { f(); } catch (err) {} }
            const gapMaj = lerp(70, 26, S.I) / Math.max(1, sp * .8);
            if (e > 300 && e - (S.lastMajor || 280) > gapMaj && Math.random() < .12) {
                S.lastMajor = e; const f = chooseFrom(POOL_MAJOR);
                if (f) { if (f.toString().includes('silenceThenScream') && now - (S.lastScream || 0) < 55000 / Math.max(1, sp * .8)) return; try { f(); } catch (err) {} }
            }
        }
    }
    const lerp = (a, b, t) => a + (b - a) * t;

    // cœur qui bat
    function heartLoop() {
        if (!S) return;
        const i = S.I, bpm = 48 + i * 70, vol = clamp((i - .08) * .6, 0, .5);
        if (vol > .015 && !S.screaming) SFX.beat(vol);
        S.heart = setTimeout(heartLoop, 60000 / bpm);
    }

    // survol « hanté » des boutons de sortie
    function hoverHaunt(e) {
        if (!S || I() < .3 || Math.random() > .22) return;
        const t = e.target.closest && e.target.closest('#nl-logout, #nl-auth, .btn-danger');
        if (!t || t.dataset.coOrig !== undefined || t.children.length) return;
        t.dataset.coOrig = t.textContent; t.textContent = pick(['Reste.', 'Pas encore.', `${nameOf()}…`, 'Non.']);
        setTimeout(() => { if (t.dataset.coOrig !== undefined) { t.textContent = t.dataset.coOrig; delete t.dataset.coOrig; } }, 1400);
    }
    // retour sur l'onglet : « tu es parti(e)… »
    let hiddenAt = 0;
    document.addEventListener('visibilitychange', () => {
        if (!S) return;
        if (document.hidden) { hiddenAt = performance.now(); return; }
        const away = (performance.now() - hiddenAt) / 1000;
        if (away > 4 && I() > .12 && S.elapsed > 30) {
            later(() => typed(`Tu es parti(e) ${Math.round(away)} secondes. Je suis resté(e).`), 800);
            later(() => blackout(() => lurker(Math.min(5, (S.lurkStep = (S.lurkStep || 0) + 1)))), 5200);
        }
    });
    // Échap ×5 : sortie de secours locale
    const escs = [];
    addEventListener('keydown', e => {
        if (e.key !== 'Escape' || !S) return;
        const t = performance.now(); escs.push(t); while (escs.length && t - escs[0] > 3000) escs.shift();
        if (escs.length >= 5) { aborted = true; stop(); }
    });

    /* ═════════════ CYCLE DE VIE ═════════════ */
    function start(opts) {
        if (S || aborted) return;
        opts = opts || {};
        const stored = +sessionStorage.getItem('co_t0') || 0;
        const fresh = !stored || Date.now() - stored > 3 * 3600 * 1000;
        if (fresh && !opts.preview) sessionStorage.setItem('co_t0', String(Date.now()));
        const sp = opts.speed || +PARAMS.get('corrspeed') || 1;
        const elapsed0 = opts.preview ? 0 : (fresh ? 0 : (Date.now() - stored) / 1000) * 1;
        S = { name: opts.name || 'toi', grade: opts.grade || '', speed: sp, I: 0, elapsed: elapsed0, timeouts: [], intervals: [], els: {}, t0: performance.now() - (elapsed0 / sp) * 1000, preview: !!opts.preview };
        STORY.forEach(s => { s.done = false; });
        STORY.forEach(s => { if (elapsed0 > s.t) s.done = true; });          // pas de rejeu du début après un rechargement
        buildLayers();
        S.intervals.push(setInterval(tick, 400));
        document.addEventListener('mouseover', hoverHaunt, { passive: true });
        S.heart = setTimeout(heartLoop, 4000);
        if (opts.admin || opts.preview) {
            const b = mk('button', 'co-stop', '', document.body); b.setAttribute('data-glitch-safe', '1');
            b.textContent = opts.preview ? '⛔ Arrêter l\'aperçu' : '⛔ Arrêter la Corruption (admin)';
            b.onclick = () => { if (opts.preview) stop(); else if (typeof toggleGlitch === 'function' && CM()) toggleGlitch(CM().id, true); else stop(); };
        }
        audioCtx();
        tick();
    }
    function stop() {
        if (!S) return;
        endTakeover(); 
        document.querySelectorAll('[data-co-crumble-style]').forEach(e => { e.setAttribute('style', e.dataset.coCrumbleStyle); delete e.dataset.coCrumbleStyle; });
        document.documentElement.classList.remove('co-crumble');
        S.timeouts.forEach(clearTimeout); S.intervals.forEach(clearInterval); clearTimeout(S.heart);
        document.removeEventListener('mouseover', hoverHaunt);
        document.querySelectorAll('[data-co-orig]').forEach(e => { e.textContent = e.dataset.coOrig; delete e.dataset.coOrig; });
        const a = $('#bg-audio'); if (a && S.screaming) a.volume = (S.savedVol != null ? S.savedVol : .4);
        destroyLayers(); S = null;
    }

    window.Corruption = {
        set(active, opts) { if (active) start(opts); else { if (S && !S.preview) stop(); sessionStorage.removeItem('co_t0'); } },
        preview(speed) { stop(); aborted = false; start({ preview: true, speed: speed || 4, name: (CM() && CM().prenom) || 'Voyageur', grade: (CM() && CM().grade) || '' }); },
        stop() { stop(); },
        demo(kind) {                                          // aperçu admin d'un événement précis
            if (!S) window.Corruption.preview(1);
            setTimeout(() => { if (!S) return; if (kind === 'destruct') selfDestruct(); else if (SCENES[kind]) takeover(kind); else takeoverRandom(); }, 900);
        },
        isActive() { return !!S; },
        debug() { return S && { I: S.I, elapsed: Math.round(S.elapsed) }; },
        async _probe(name, ...args) {                       // mesure le pic/RMS d'un effet sonore (diagnostic)
            const c = audioCtx(); if (!c) return { error: 'audio suspendu' };
            const an = c.createAnalyser(); an.fftSize = 2048; A.master.connect(an);
            const buf = new Float32Array(an.fftSize); let peak = 0, sum = 0, n = 0;
            SFX[name](...args);
            const t0 = performance.now();
            while (performance.now() - t0 < 2400) { await new Promise(r => setTimeout(r, 30)); an.getFloatTimeDomainData(buf); for (const v of buf) { peak = Math.max(peak, Math.abs(v)); sum += v * v; n++; } }
            A.master.disconnect(an); return { name, peak: +peak.toFixed(3), rms: +Math.sqrt(sum / n).toFixed(4) };
        },
        _fx: { takeover, selfDestruct, SCENES, takeoverRandom, whisper, typed, eyes, ghostCursor, blackout, lurker, flashlight, hand, fakeError, silenceThenScream, portraitFlash, twistText, SFX }
    };
    if (PARAMS.get('corrpreview')) addEventListener('load', () => setTimeout(() => window.Corruption.preview(+PARAMS.get('corrspeed') || 6), 1500));
})();

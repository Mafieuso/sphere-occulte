/* ════════════════════════════════════════════════════════════════
   SPHÈRE OCCULTE — Couche « WOW » (surcouche additive, rien n'est retiré)
   ════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';
    const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const COARSE  = window.matchMedia('(hover: none)').matches;
    const $  = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const mk = (tag, cls, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };
    const rnd = (a, b) => a + Math.random() * (b - a);

    let mouseX = innerWidth / 2, mouseY = innerHeight / 2;
    addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; }, { passive: true });

    /* ───────────── 1. Fond vivant ───────────── */
    const bg = mk('div'); bg.id = 'wow-bg';
    const nebula = mk('div', 'nebula', bg);
    mk('div', 'fog f1', bg);
    mk('div', 'fog f2', bg);
    const sigilBg = mk('div', 'sigil-bg', bg);
    mk('div', 'vignette', bg);
    document.body.insertBefore(bg, document.body.firstChild);
    const fogs = $$('.fog', bg);

    /* ───────────── 2. Barre de progression + nav ───────────── */
    const prog = mk('div'); prog.id = 'wow-progress'; document.body.appendChild(prog);
    const nav  = $('.spa-nav');
    function onScroll() {
        const h = document.documentElement.scrollHeight - innerHeight;
        prog.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')';
        if (nav) nav.classList.toggle('wow-scrolled', scrollY > 30);
    }
    addEventListener('scroll', onScroll, { passive: true }); onScroll();

    /* ───────────── 3. Splash cinématique ───────────── */
    const splash = $('#splash-overlay');
    if (splash) {
        const first = splash.firstChild;
        const ins = el => splash.insertBefore(el, first);
        const nb = mk('div', 'wow-splash-nebula');   ins(nb);
        const rays = mk('div', 'wow-splash-rays');   ins(rays);
        const s1 = mk('div', 'wow-splash-sigil');    ins(s1);
        const s2 = mk('div', 'wow-splash-sigil s2'); ins(s2);
        const vg = mk('div', 'wow-splash-vignette'); ins(vg);
        mk('div', 'wow-splash-flash', splash);
        splash.addEventListener('click', () => {
            splash.classList.add('wow-burst');
        }, { once: true });
        // léger parallaxe souris sur le splash
        splash.addEventListener('mousemove', e => {
            const x = (e.clientX / innerWidth - .5), y = (e.clientY / innerHeight - .5);
            s1.style.translate = `calc(-50% + ${x * -26}px) calc(-50% + ${y * -26}px)`;
            s2.style.translate = `calc(-50% + ${x * 34}px) calc(-50% + ${y * 34}px)`;
        }, { passive: true });
    }

    /* ───────────── 4. Moteur d'effets (braises, traînée, ondes) ───────────── */
    const fxCanvas = mk('canvas'); fxCanvas.id = 'wow-fx'; document.body.appendChild(fxCanvas);
    const ctx = fxCanvas.getContext('2d');
    let W = 0, H = 0, DPR = Math.min(devicePixelRatio || 1, 2);
    function resize() {
        W = innerWidth; H = innerHeight;
        fxCanvas.width = W * DPR; fxCanvas.height = H * DPR;
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize(); addEventListener('resize', resize);

    // sprites pré-rendus (rapide)
    function sprite(color) {
        const c = document.createElement('canvas'); c.width = c.height = 64;
        const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        gr.addColorStop(0, '#fff'); gr.addColorStop(.18, color); gr.addColorStop(.5, color.replace('1)', '.25)')); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
    }
    const SPR = { teal: sprite('rgba(70,230,215,1)'), amber: sprite('rgba(255,160,60,1)'), violet: sprite('rgba(150,110,255,1)') };
    const KEYS = ['teal', 'teal', 'amber', 'violet'];

    const parts = [], rings = [];
    const MAX = COARSE ? 90 : 260;
    function emit(x, y, vx, vy, size, life, key, grav) {
        if (parts.length > MAX) parts.shift();
        parts.push({ x, y, vx, vy, s: size, life, max: life, k: key || KEYS[(Math.random() * KEYS.length) | 0], g: grav || 0 });
    }
    const fx = {
        burst(x, y, n, power) {
            for (let i = 0; i < n; i++) {
                const a = rnd(0, Math.PI * 2), v = rnd(1, 6) * (power || 1);
                emit(x, y, Math.cos(a) * v, Math.sin(a) * v, rnd(8, 22), rnd(40, 90), null, .03);
            }
        },
        shock(x, y, power) { rings.push({ x, y, r: 6, max: 160 * (power || 1), life: 1 }); },
        trail(x, y) { emit(x + rnd(-4, 4), y + rnd(-4, 4), rnd(-.4, .4), rnd(-1.1, -.2), rnd(7, 15), rnd(28, 55), null, -.004); }
    };
    window.WOW_FX = fx;

    // braises ambiantes qui montent
    const embers = [];
    const EMBERS = REDUCED ? 0 : (COARSE ? 14 : 34);
    for (let i = 0; i < EMBERS; i++) embers.push(newEmber(true));
    function newEmber(any) {
        return { x: rnd(0, W), y: any ? rnd(0, H) : H + 20, vx: rnd(-.25, .25), vy: -rnd(.15, .7), s: rnd(4, 11), a: rnd(.25, .8), ph: rnd(0, 6.28), k: KEYS[(Math.random() * KEYS.length) | 0] };
    }

    // (traînée de souris et ondes au clic supprimées à la demande)

    let tNow = 0;
    function drawFx(dt) {
        ctx.clearRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'lighter';
        // braises
        for (const e of embers) {
            e.ph += .02; e.x += e.vx + Math.sin(e.ph) * .25; e.y += e.vy;
            if (e.y < -20) Object.assign(e, newEmber(false));
            ctx.globalAlpha = e.a * (.55 + .45 * Math.sin(e.ph * 2.3));
            ctx.drawImage(SPR[e.k], e.x - e.s, e.y - e.s, e.s * 2, e.s * 2);
        }
        // particules
        for (let i = parts.length - 1; i >= 0; i--) {
            const p = parts[i]; p.life--; if (p.life <= 0) { parts.splice(i, 1); continue; }
            p.vx *= .985; p.vy = p.vy * .985 + p.g; p.x += p.vx; p.y += p.vy;
            const t = p.life / p.max;
            ctx.globalAlpha = t * t; const s = p.s * (.4 + .6 * t);
            ctx.drawImage(SPR[p.k], p.x - s, p.y - s, s * 2, s * 2);
        }
        // ondes de choc
        for (let i = rings.length - 1; i >= 0; i--) {
            const r = rings[i]; r.r += (r.max - r.r) * .09 + 1.2; r.life -= .028;
            if (r.life <= 0) { rings.splice(i, 1); continue; }
            ctx.globalAlpha = r.life * .8;
            ctx.lineWidth = 2 + r.life * 5;
            const g = ctx.createRadialGradient(r.x, r.y, Math.max(0, r.r - 12), r.x, r.y, r.r + 12);
            g.addColorStop(0, 'rgba(42,201,188,0)'); g.addColorStop(.5, 'rgba(168,245,236,.95)'); g.addColorStop(1, 'rgba(255,157,61,0)');
            ctx.strokeStyle = g; ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }

    /* ───────────── 5. Boucle : parallaxe + réactivité audio ───────────── */
    const audioEl = $('#bg-audio');
    let smx = 0, smy = 0, beat = 0, analyser = null, freq = null, tPrev = performance.now();
    function frame(now) {
        requestAnimationFrame(frame);                      // planifié d'abord : une erreur ne coupe jamais la boucle
        const dt = now - tPrev; tPrev = now; tNow = now;
        // parallaxe lissée
        const tx = (mouseX / innerWidth - .5), ty = (mouseY / innerHeight - .5);
        smx += (tx - smx) * .05; smy += (ty - smy) * .05;
        if (!REDUCED) {
            nebula.style.transform = `translate3d(${smx * -34}px, ${smy * -24 - scrollY * .04}px, 0)`;
            sigilBg.style.transform = `rotate(${scrollY * .03}deg)`;
            if (fogs[0]) fogs[0].style.transform = `translate3d(${smx * 40}px, ${scrollY * -.05}px, 0)`;
            if (fogs[1]) fogs[1].style.transform = `scaleX(-1) translate3d(${smx * -60}px, ${scrollY * -.09}px, 0)`;
        }
        // audio → --beat
        let target = 0;
        if (analyser) {
            analyser.getByteFrequencyData(freq);
            let s = 0; const n = 14; for (let i = 1; i <= n; i++) s += freq[i];
            target = Math.min(1, (s / n) / 190);
            if (target > 0.01) frame.lastSignal = now;
        }
        if ((!analyser || now - (frame.lastSignal || 0) > 2500) && audioEl && !audioEl.paused) {
            target = .35 + .25 * Math.sin(now / 480);           // pulsation de secours
        }
        beat += (target - beat) * (target > beat ? .35 : .08);
        if (Math.abs(beat - (frame.last || 0)) > .01) {
            frame.last = beat;
            const v = beat.toFixed(3);
            bg.style.setProperty('--beat', v);
            document.documentElement.style.setProperty('--beat', v);
        }
        if (!REDUCED) drawFx(dt);
    }
    requestAnimationFrame(frame);

    window.WOW_DEBUG = () => ({ analyser: !!analyser, beat: +beat.toFixed(3), paused: audioEl ? audioEl.paused : null, vol: audioEl ? audioEl.volume : null });

    // Analyseur audio : on se branche en SORTIE SECONDAIRE sur la source déjà créée par le lecteur
    // d'origine (glitchAudioSource) — jamais de seconde source, donc jamais de son coupé.
    if (audioEl) {
        let an = null;
        setInterval(() => {
            try {
                if (typeof glitchAudioSource !== 'undefined' && glitchAudioSource && typeof glitchAudioCtx !== 'undefined' && glitchAudioCtx) {
                    if (!an) { an = glitchAudioCtx.createAnalyser(); an.fftSize = 256; an.smoothingTimeConstant = .8; freq = new Uint8Array(an.frequencyBinCount); }
                    glitchAudioSource.connect(an);          // en plus de la chaîne existante ; reconnecté si le lecteur fait disconnect()
                    analyser = an;
                }
            } catch (err) { /* on garde la pulsation de secours */ }
        }, 1000);
    }

    /* ───────────── 6. Révélation au scroll + tilt + compteurs ───────────── */
    const REVEAL_SEL = '#v-home .lb-card, #v-home .grade-card-3d, #v-home .section-header, #v-home .lb-filters, #v-dashboard .stat-card, #v-dashboard .glass-card';
    const TILT_SEL   = '#v-home .lb-card, #v-dashboard .lb-card, #v-admin .lb-card';
    const io = ('IntersectionObserver' in window) ? new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('wow-in'); io.unobserve(en.target); } });
    }, { threshold: .08, rootMargin: '0px 0px -4% 0px' }) : null;

    function decorate(root) {
        if (!root || root.nodeType !== 1) return;
        const list = root.matches && root.matches(REVEAL_SEL) ? [root] : [];
        list.push(...$$(REVEAL_SEL, root));
        let i = 0;
        list.forEach(el => {
            if (el.dataset.wowReveal) return; el.dataset.wowReveal = '1';
            if (REDUCED || !io) return;
            el.classList.add('wow-reveal');
            el.style.setProperty('--wow-d', Math.min(i++ * 55, 600) + 'ms');
            io.observe(el);
        });
        const tl = root.matches && root.matches(TILT_SEL) ? [root] : [];
        tl.push(...$$(TILT_SEL, root));
        tl.forEach(setupTilt);
        $$('.grade-card-3d:not([data-wow-glare])', root).forEach(c => { c.dataset.wowGlare = '1'; addGlare(c); bindGlare(c); });
    }
    function addGlare(el) {
        if ($('.wow-glare', el)) return;
        mk('div', 'wow-glare', el); mk('div', 'wow-edge', el);
    }
    function bindGlare(el) {
        if (COARSE) return;
        el.addEventListener('mousemove', e => {
            const r = el.getBoundingClientRect();
            el.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100) + '%');
            el.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100) + '%');
        }, { passive: true });
    }
    function setupTilt(el) {
        if (el.dataset.wowTilt) return; el.dataset.wowTilt = '1';
        addGlare(el);
        if (COARSE || REDUCED) return;
        const arm = () => el.classList.add('wow-ready');
        setTimeout(arm, REDUCED || !io ? 0 : 1300);   // après la révélation
        el.addEventListener('mouseenter', () => el.classList.add('wow-hover'));
        el.addEventListener('mousemove', e => {
            const r = el.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
            el.style.setProperty('--wow-ry', ((x - .5) * 14).toFixed(2) + 'deg');
            el.style.setProperty('--wow-rx', ((.5 - y) * 12).toFixed(2) + 'deg');
            el.style.setProperty('--gx', (x * 100) + '%'); el.style.setProperty('--gy', (y * 100) + '%');
        }, { passive: true });
        el.addEventListener('mouseleave', () => {
            el.classList.remove('wow-hover');
            el.style.setProperty('--wow-ry', '0deg'); el.style.setProperty('--wow-rx', '0deg');
        });
    }

    // compteurs animés pour les chiffres du hero
    const COUNT_IDS = ['hs-total', 'hs-presents', 'hs-maxpts'];
    function countUp(el, raw) {
        const end = parseFloat(raw.replace(/[\s,]/g, '')); if (!isFinite(end) || end <= 0) return;
        const token = (el._wowTok = (el._wowTok || 0) + 1), t0 = performance.now(), dur = 1700;
        el.classList.add('wow-counting');
        (function step(t) {
            if (el._wowTok !== token) return;                 // une valeur plus récente a pris le relais
            const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
            el._wowSelf = true; el.textContent = p < 1 ? Math.round(end * e).toLocaleString('fr-FR') : raw;
            if (p < 1) requestAnimationFrame(step); else el.classList.remove('wow-counting');
        })(t0);
    }
    COUNT_IDS.forEach(id => {
        const el = document.getElementById(id); if (!el) return;
        new MutationObserver(() => {
            if (el._wowSelf) { el._wowSelf = false; return; }       // nos propres écritures
            const raw = el.textContent.trim();
            if (REDUCED || !/^\d[\d\s.,]*$/.test(raw)) return;
            countUp(el, raw);
        }).observe(el, { childList: true, characterData: true, subtree: true });
    });

    // observe les nouvelles cartes injectées dynamiquement (Firebase)
    const app = document.getElementById('app');
    let pending = new Set(), raf = 0;
    function flush() { raf = 0; pending.forEach(decorate); pending.clear(); }
    if (app) {
        new MutationObserver(muts => {
            muts.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1 && !n.classList.contains('wow-glare') && !n.classList.contains('wow-edge')) pending.add(n); }));
            if (!raf && pending.size) raf = requestAnimationFrame(flush);
        }).observe(app, { childList: true, subtree: true });
        decorate(app);
    }

    /* ───────────── 7. Failles d'énergie (séparateurs) ───────────── */
    function addRifts() {
        const hero = $('#v-home .hero');
        if (hero && !$('#v-home .wow-rift')) {
            const r = mk('div', 'wow-rift'); hero.parentNode.insertBefore(r, hero.nextSibling);
            if (io) io.observe(r); else r.classList.add('wow-in');
            if (REDUCED) r.classList.add('wow-in');
        }
        const lb = $('#v-home .section-header');
        if (lb && !lb.previousElementSibling?.classList.contains('wow-rift') && $$('#v-home .wow-rift').length < 2) {
            const r = mk('div', 'wow-rift'); lb.parentNode.insertBefore(r, lb);
            if (io) io.observe(r); else r.classList.add('wow-in');
            if (REDUCED) r.classList.add('wow-in');
        }
    }
    addRifts();

    /* ───────────── 8. Éclairs occasionnels ───────────── */
    if (!REDUCED) {
        const bolt = mk('div', 'wow-flash-bolt'); document.body.appendChild(bolt);
        (function schedule() {
            setTimeout(() => {
                if (!document.hidden && !(splash && splash.style.display !== 'none' && !splash.classList.contains('wow-burst'))) {
                    const flip = Math.random() < .5 ? -1 : 1;
                    bolt.style.left = rnd(-10, 55) + 'vw'; bolt.style.top = rnd(5, 70) + 'vh';
                    bolt.style.transform = `rotate(${rnd(-40, 40)}deg) scaleX(${flip})`;
                    bolt.classList.remove('go'); void bolt.offsetWidth; bolt.classList.add('go');
                    document.documentElement.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(1.35)' }, { filter: 'brightness(1)' }], { duration: 320 });
                }
                schedule();
            }, rnd(14000, 30000));
        })();
    }

})();

/* ════════════════════════════════════════════════════════════════
   SPHÈRE OCCULTE — Effets de cartes dédiés
   • Monarque : distorsion « signal corrompu » + texte qui change en permanence
     (seul le nom / prénom reste lisible)
   • Iroh Jin : orbes jumelles (turquoise du Monarque + rose d'Iroh) en orbite sur la carte
   Surcouche additive : se branche sur les cartes déjà rendues par le site.
   ════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';
    const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const COARSE  = window.matchMedia('(hover: none)').matches;
    const rnd = (a, b) => a + Math.random() * (b - a);

    /* ── Filtres SVG de déformation (n'agissent que pendant une rafale / un survol) ── */
    if (!document.getElementById('fx-svg')) {
        const s = document.createElement('div'); s.id = 'fx-svg'; s.className = 'fx-svg'; s.setAttribute('aria-hidden', 'true');
        s.innerHTML = `<svg width="0" height="0" xmlns="http://www.w3.org/2000/svg">
          <filter id="fx-warp-idle" x="-6%" y="-6%" width="112%" height="112%" color-interpolation-filters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.004 0.22" numOctaves="2" seed="4" result="n">
              <animate attributeName="seed" values="4;9;2;7;5;11" dur="0.8s" repeatCount="indefinite"/>
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G">
              <animate attributeName="scale" values="10;24;6;28;12;20" dur="0.6s" repeatCount="indefinite"/>
            </feDisplacementMap>
          </filter>
          <filter id="fx-warp-hot" x="-8%" y="-8%" width="116%" height="116%" color-interpolation-filters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.006 0.35" numOctaves="2" seed="2" result="n">
              <animate attributeName="seed" values="2;8;3;12;6;1;9" dur="0.9s" repeatCount="indefinite"/>
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="n" scale="16" xChannelSelector="R" yChannelSelector="B">
              <animate attributeName="scale" values="6;30;10;38;4;24" dur="0.7s" repeatCount="indefinite"/>
            </feDisplacementMap>
          </filter>
        </svg>`;
        document.body.appendChild(s);
    }

    /* ── Texte incompréhensible : tous les caractères changent en permanence, sauf le nom ── */
    const GLYPHS = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ⛧☽⌖◈⟁✵⚶⛣▓▒░◬◭◮⌬⏣⎔';
    function fxScramble(card) {
        if (card.dataset.fxS) return;
        const body = card.querySelector('.lb-body'); if (!body) return;
        card.dataset.fxS = '1';
        const nodes = [], walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
        for (let n; (n = walker.nextNode());) {
            const p = n.parentElement;
            if (!p || p.closest('.lb-name') || !n.nodeValue.trim()) continue;      // le nom / prénom reste intact
            nodes.push({ n, orig: n.nodeValue });
        }
        if (!nodes.length) return;
        const g = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];
        let on = true;
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(e => { on = e[0].isIntersecting; }, { threshold: 0 }).observe(card);
        }
        const run = () => {
            if (!card.isConnected) return;
            if (on && !document.hidden) {
                for (const o of nodes) o.n.nodeValue = o.orig.replace(/\S/g, g);
            }
            setTimeout(run, REDUCED ? 700 : 110);
        };
        run();
        card.classList.add('fx-cipher');
    }

    /* ── Monarque : tranches du portrait + rafales aléatoires ── */
    function fxMonarque(card) {
        if (card.dataset.fxM) return; card.dataset.fxM = '1';
        fxScramble(card);
        const panel = card.querySelector('.lb-photo-panel'); if (!panel) return;
        const img = panel.querySelector('img');
        const box = document.createElement('div'); box.className = 'fx-slices';
        if (img && img.src) box.style.setProperty('--fx-img', `url("${img.src}")`);
        ['', 'r', '', 'c', '', 'r'].forEach(k => { const i = document.createElement('i'); if (k) i.className = k; box.appendChild(i); });
        panel.appendChild(box);
        if (!REDUCED) addOrbs(card, [['rose', 0, 9]]);
        if (REDUCED) return;
        (function loop() {
            setTimeout(() => {
                if (!card.isConnected) return;
                if (!document.hidden) { card.classList.add('fx-burst'); setTimeout(() => card.classList.remove('fx-burst'), rnd(380, 900)); }
                loop();
            }, rnd(3500, 9000));
        })();
    }

    /* ── Orbes en orbite le long du bord de la carte (avec traîne) ── */
    function addOrbs(card, specs) {
        const wrap = document.createElement('div'); wrap.className = 'fx-orbits';
        specs.forEach(([tone, phase, dur]) => {
            for (let k = 0; k < 4; k++) {                                   // tête + traîne
                const o = document.createElement('i');
                o.className = 'fx-orb ' + tone + (k ? ' tail t' + k : '');
                o.style.setProperty('--dur', dur + 's');
                o.style.animationDelay = (-(phase * dur) - k * 0.075 * dur / 7) + 's';
                wrap.appendChild(o);
            }
        });
        card.appendChild(wrap);
    }

    /* ── Iroh Jin : orbes jumelles (le turquoise du Monarque + son rose) ── */
    function isIroh(card) {
        const n = (card.querySelector('.lb-name') || {}).textContent || '';
        return /\biroh\b/i.test(n);
    }
    function fxIroh(card) {
        if (card.dataset.fxI) return; card.dataset.fxI = '1';
        card.classList.add('fx-iroh');
        const w = document.createElement('div'); w.className = 'fx-wisps';
        for (let k = 0; k < 4; k++) {
            const i = document.createElement('i');
            i.style.left = rnd(10, 90) + '%'; i.style.setProperty('--d', rnd(4.6, 7.4) + 's'); i.style.setProperty('--dl', -rnd(0, 7) + 's'); i.style.setProperty('--dx', rnd(-18, 18) + 'px');
            w.appendChild(i);
        }
        card.appendChild(w);
        if (!REDUCED) addOrbs(card, [['teal', 0, 8], ['rose', 0.5, 8]]);
    }

    /* ── Écho : survoler l'un fait réagir l'autre (sans aucun trait) ── */
    function bindEcho() {
        const mon = document.querySelector('.lb-card--monarque'), iroh = document.querySelector('.lb-card.fx-iroh');
        if (COARSE || !mon || !iroh || mon.dataset.fxE) return; mon.dataset.fxE = '1';
        [[mon, iroh], [iroh, mon]].forEach(([a, b]) => {
            a.addEventListener('mouseenter', () => { a.classList.add('fx-echo'); b.classList.add('fx-echo'); });
            a.addEventListener('mouseleave', () => { a.classList.remove('fx-echo'); b.classList.remove('fx-echo'); });
        });
    }

    function scan(root) {
        (root || document).querySelectorAll('.lb-card').forEach(card => {
            if (card.classList.contains('lb-card--monarque')) fxMonarque(card);
            if (isIroh(card)) fxIroh(card);
        });
        bindEcho();
    }
    let raf = 0;
    new MutationObserver(() => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; scan(); }); })
        .observe(document.getElementById('app') || document.body, { childList: true, subtree: true });
    scan();
})();

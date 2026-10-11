/* ════════════════════════════════════════════════════════════════
   SPHÈRE OCCULTE — Effets de cartes dédiés (Monarque + Iroh Jin)
   Surcouche additive : se branche sur les cartes déjà rendues par le site.
   ════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';
    const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const COARSE  = window.matchMedia('(hover: none)').matches;
    const rnd = (a, b) => a + Math.random() * (b - a);

    /* ── Filtres SVG de déformation (idle = rare, hot = au survol) ── */
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

    /* ── Monarque : tranches du portrait + rafales aléatoires ── */
    function fxMonarque(card) {
        if (card.dataset.fxM) return; card.dataset.fxM = '1';
        const panel = card.querySelector('.lb-photo-panel'); if (!panel) return;
        const img = panel.querySelector('img');
        const box = document.createElement('div'); box.className = 'fx-slices';
        if (img && img.src) box.style.setProperty('--fx-img', `url("${img.src}")`);
        ['', 'r', '', 'c', '', 'r'].forEach(k => { const i = document.createElement('i'); if (k) i.className = k; box.appendChild(i); });
        panel.appendChild(box);
        if (REDUCED) return;
        // rafales : de temps en temps, la carte « saute » même sans survol
        (function loop() {
            setTimeout(() => {
                if (!card.isConnected) return;
                if (!document.hidden) { card.classList.add('fx-burst'); setTimeout(() => card.classList.remove('fx-burst'), rnd(380, 900)); }
                loop();
            }, rnd(3500, 9000));
        })();
    }

    /* ── Iroh Jin : flamme jumelle + écho avec le Monarque ── */
    function isIroh(card) {
        const n = (card.querySelector('.lb-name') || {}).textContent || '';
        return /\biroh\b/i.test(n);
    }
    function fxIroh(card) {
        if (card.dataset.fxI) return; card.dataset.fxI = '1';
        card.classList.add('fx-iroh');
        const w = document.createElement('div'); w.className = 'fx-wisps';
        for (let k = 0; k < 7; k++) {
            const i = document.createElement('i');
            i.style.left = rnd(6, 94) + '%'; i.style.setProperty('--d', rnd(3.6, 6.4) + 's'); i.style.setProperty('--dl', -rnd(0, 6) + 's'); i.style.setProperty('--dx', rnd(-22, 22) + 'px');
            w.appendChild(i);
        }
        card.appendChild(w);
        const tag = document.createElement('div'); tag.className = 'fx-iroh-tag'; tag.textContent = '✦ Second du Monarque';
        card.appendChild(tag);
    }

    /* ── Écho : survoler l'un fait réagir l'autre, avec un fil de lumière ── */
    let thread = null;
    function link(a, b, on) {
        if (COARSE || !a || !b) return;
        a.classList.toggle('fx-echo', on); b.classList.toggle('fx-echo', on);
        if (!thread) { thread = document.createElement('div'); thread.className = 'fx-thread'; document.body.appendChild(thread); }
        if (on) {
            const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
            const x1 = ra.left + ra.width / 2, y1 = ra.top + ra.height / 2, x2 = rb.left + rb.width / 2, y2 = rb.top + rb.height / 2;
            thread.style.left = x1 + 'px'; thread.style.top = y1 + 'px';
            thread.style.width = Math.hypot(x2 - x1, y2 - y1) + 'px';
            thread.style.transform = `rotate(${Math.atan2(y2 - y1, x2 - x1)}rad)`;
            thread.classList.add('on');
        } else thread.classList.remove('on');
    }
    function bindEcho() {
        const mon = document.querySelector('.lb-card--monarque'), iroh = document.querySelector('.lb-card.fx-iroh');
        if (!mon || !iroh || mon.dataset.fxE) return; mon.dataset.fxE = '1';
        [mon, iroh].forEach(c => {
            c.addEventListener('mouseenter', () => link(mon, iroh, true));
            c.addEventListener('mouseleave', () => link(mon, iroh, false));
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

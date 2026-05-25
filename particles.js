// ════════════════════════════════════════════════════════════════
//  SPHÈRE OCCULTE — Système de particules (braises + étincelles)
// ════════════════════════════════════════════════════════════════
(function () {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;
    const particles = [];
    const COUNT = 90;

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    class Particle {
        spawn(fromBottom = true) {
            this.x  = Math.random() * W;
            this.y  = fromBottom ? H + Math.random() * 30 : Math.random() * H;
            this.vx = (Math.random() - 0.5) * 0.45;
            this.vy = -(Math.random() * 0.65 + 0.15);
            this.turbulence = (Math.random() - 0.5) * 0.02;

            const roll = Math.random();
            if (roll < 0.50) {           // Braise (rouge/orangé)
                this.type  = 'ember';
                this.r     = Math.random() * 1.7 + 0.4;
                this.alpha = Math.random() * 0.8 + 0.2;
                this.decay = Math.random() * 0.004 + 0.002;
                this.hue   = Math.random() * 30;           // 0-30 : rouge→orangé
            } else if (roll < 0.78) {    // Étincelle (or)
                this.type  = 'spark';
                this.r     = Math.random() * 1.1 + 0.2;
                this.alpha = Math.random() * 0.6 + 0.15;
                this.decay = Math.random() * 0.003 + 0.0015;
                this.hue   = 42 + Math.random() * 18;     // 42-60 : or
            } else {                      // Fumée
                this.type  = 'smoke';
                this.r     = Math.random() * 45 + 18;
                this.alpha = Math.random() * 0.035 + 0.008;
                this.decay = Math.random() * 0.0004 + 0.0001;
                this.hue   = 0;
                this.vx   *= 0.4;
                this.vy   *= 0.5;
            }
            return this;
        }

        update() {
            this.vx   += this.turbulence;
            this.x    += this.vx;
            this.y    += this.vy;
            this.alpha -= this.decay;
        }

        draw() {
            if (this.alpha <= 0) return;
            ctx.save();
            if (this.type === 'smoke') {
                const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
                g.addColorStop(0, `rgba(30,10,40,${this.alpha})`);
                g.addColorStop(1, `rgba(30,10,40,0)`);
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
                ctx.fill();
            } else {
                const color = `hsl(${this.hue},100%,${this.type === 'ember' ? 55 : 65}%)`;
                ctx.globalAlpha  = this.alpha;
                ctx.fillStyle    = color;
                ctx.shadowBlur   = 9;
                ctx.shadowColor  = color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        dead() { return this.alpha <= 0 || this.y < -70; }
    }

    resize();
    for (let i = 0; i < COUNT; i++) particles.push(new Particle().spawn(false));

    (function loop() {
        ctx.clearRect(0, 0, W, H);
        for (const p of particles) {
            p.update(); p.draw();
            if (p.dead()) p.spawn(true);
        }
        requestAnimationFrame(loop);
    })();

    window.addEventListener('resize', resize);
})();

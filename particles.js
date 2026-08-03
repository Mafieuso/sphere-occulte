// ════════════════════════════════════════════════════════════════
//  SPHÈRE OCCULTE — Système de particules (poussière d'étoiles + brume)
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
        spawn(anywhere = true) {
            this.x  = Math.random() * W;
            this.y  = anywhere ? Math.random() * H : H + Math.random() * 30;
            this.vx = (Math.random() - 0.5) * 0.35;
            this.vy = -(Math.random() * 0.22 + 0.04);
            this.drift = (Math.random() - 0.5) * 0.015;
            this.age = 0;

            const roll = Math.random();
            if (roll < 0.55) {           // Poussière d'étoile (cyan givré)
                this.type   = 'mote';
                this.r      = Math.random() * 1.5 + 0.35;
                this.alpha  = Math.random() * 0.75 + 0.2;
                this.decay  = Math.random() * 0.0035 + 0.0015;
                this.hue    = 172 + Math.random() * 20;    // 172-192 : cyan-teal
                this.twinkle = Math.random() * 0.06 + 0.02;
            } else if (roll < 0.80) {    // Éclat ambré
                this.type   = 'mote';
                this.r      = Math.random() * 1.1 + 0.25;
                this.alpha  = Math.random() * 0.6 + 0.15;
                this.decay  = Math.random() * 0.003 + 0.0012;
                this.hue    = 28 + Math.random() * 16;     // 28-44 : ambre
                this.twinkle = Math.random() * 0.05 + 0.02;
            } else {                      // Volute de brume
                this.type  = 'mist';
                this.r     = Math.random() * 50 + 20;
                this.alpha = Math.random() * 0.03 + 0.006;
                this.decay = Math.random() * 0.0003 + 0.00008;
                this.hue   = 250;
                this.vx   *= 0.35;
                this.vy   *= 0.4;
            }
            return this;
        }

        update() {
            this.age  += 1;
            this.vx   += this.drift;
            this.x    += this.vx;
            this.y    += this.vy;
            this.alpha -= this.decay;
        }

        draw() {
            if (this.alpha <= 0) return;
            ctx.save();
            if (this.type === 'mist') {
                const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
                g.addColorStop(0, `hsla(${this.hue},45%,18%,${this.alpha})`);
                g.addColorStop(1, `hsla(${this.hue},45%,18%,0)`);
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
                ctx.fill();
            } else {
                const flicker = 1 + Math.sin(this.age * this.twinkle) * 0.35;
                const a = Math.max(0, Math.min(1, this.alpha * flicker));
                const color = `hsl(${this.hue},95%,${this.hue < 100 ? 70 : 62}%)`;
                ctx.globalAlpha  = a;
                ctx.fillStyle    = color;
                ctx.shadowBlur   = 8;
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
    for (let i = 0; i < COUNT; i++) particles.push(new Particle().spawn(true));

    (function loop() {
        ctx.clearRect(0, 0, W, H);
        for (const p of particles) {
            p.update(); p.draw();
            if (p.dead()) p.spawn(false);
        }
        requestAnimationFrame(loop);
    })();

    window.addEventListener('resize', resize);
})();

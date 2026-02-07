/**
 * ParticleSystem - Manages visual particles for juice/polish
 */
class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    /**
     * Update all particles
     * @param {number} deltaMs - Time in ms
     */
    update(deltaMs) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= deltaMs;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            // Move
            p.x += p.vx * (deltaMs / 16);
            p.y += p.vy * (deltaMs / 16);

            // Gravity
            if (p.gravity) {
                p.vy += p.gravity * (deltaMs / 16);
            }

            // Drag
            if (p.drag) {
                p.vx *= p.drag;
                p.vy *= p.drag;
            }
        }
    }

    /**
     * Spawn a particle
     * @param {Object} options - Particle options
     */
    spawn(options) {
        this.particles.push({
            x: options.x || 0,
            y: options.y || 0,
            vx: options.vx || 0,
            vy: options.vy || 0,
            life: options.life || 1000,
            maxLife: options.life || 1000,
            color: options.color || '#fff',
            size: options.size || 2,
            type: options.type || 'square', // square, text, sprite
            text: options.text || '',
            gravity: options.gravity || 0,
            drag: options.drag || 1,
            alpha: 1
        });
    }

    /**
     * Spawn click sparks burst
     */
    spawnClickSparks(x, y, color = '#fff') {
        const count = 5 + Math.random() * 5;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.spawn({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 300 + Math.random() * 200,
                color: color,
                size: 1 + Math.random() * 2,
                drag: 0.9
            });
        }
    }

    /**
     * Spawn cash particles
     */
    spawnCashParticles(x, y, amount) {
        // Only spawn a few to avoid clutter
        const count = Math.min(5, 1 + Math.floor(amount / 100)); // Rough scaling
        for (let i = 0; i < count; i++) {
            this.spawn({
                x: x + (Math.random() - 0.5) * 20,
                y: y,
                vx: (Math.random() - 0.5) * 2,
                vy: -2 - Math.random() * 2,
                gravity: 0.1,
                life: 1000 + Math.random() * 500,
                color: '#4ade80', // Money green
                type: 'text',
                text: '$',
                size: 8
            });
        }
    }

    /**
     * Spawn celebration confetti
     */
    spawnConfetti(width, height) {
        for (let i = 0; i < 50; i++) {
            this.spawn({
                x: width / 2,
                y: height / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                gravity: 0.1,
                drag: 0.95,
                life: 2000 + Math.random() * 1000,
                color: `hsl(${Math.random() * 360}, 70%, 50%)`,
                size: 2 + Math.random() * 3
            });
        }
    }
}

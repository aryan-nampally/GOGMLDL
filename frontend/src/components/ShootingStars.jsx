import { useRef, useEffect } from 'react';

/**
 * ShootingStars — Realistic canvas-rendered meteors.
 *
 * Each star has:
 *   - Bright white/blue head with soft glow
 *   - Long fading tail (gradient from white → blue → transparent)
 *   - Gentle downward arc trajectory
 *   - Slow, graceful motion (2-4 second traversal)
 *   - Random spawn timing (every 3-8 seconds)
 *   - Slight sparkle particles left behind
 */
export default function ShootingStars() {
    const canvasRef = useRef(null);
    const starsRef = useRef([]);
    const particlesRef = useRef([]);
    const frameRef = useRef(null);
    const lastSpawnRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let w, h;

        const resize = () => {
            const rect = canvas.parentElement.getBoundingClientRect();
            w = rect.width;
            h = rect.height;
            canvas.width = w;
            canvas.height = h;
        };
        resize();
        window.addEventListener('resize', resize);

        function spawnStar() {
            // Start from top portion, moving diagonally downward
            const startX = Math.random() * w * 0.8 + w * 0.1;
            const startY = -10;
            // Angle: mostly downward, slightly diagonal (25-65 degrees from horizontal)
            const angle = (0.4 + Math.random() * 0.7); // radians, roughly 25-65 deg
            const direction = Math.random() > 0.5 ? 1 : -1; // left or right
            const speed = 1.5 + Math.random() * 1.5; // slow and graceful
            const tailLength = 80 + Math.random() * 120; // long tail

            const colors = [
                { head: '#ffffff', mid: '#a8c8ff', tail: '#4F8BF9' },
                { head: '#ffffff', mid: '#d4b8ff', tail: '#9B5DE5' },
                { head: '#ffffff', mid: '#b8ffec', tail: '#06D6A0' },
                { head: '#ffffff', mid: '#b8eeff', tail: '#00D4FF' },
            ];
            const color = colors[Math.floor(Math.random() * colors.length)];

            starsRef.current.push({
                x: startX,
                y: startY,
                vx: Math.cos(angle) * speed * direction,
                vy: Math.sin(angle) * speed + 0.5, // always moves downward
                tailLength,
                life: 1.0,
                decay: 0.002 + Math.random() * 0.002, // slow fade: lives ~2-4 seconds
                color,
                brightness: 0.7 + Math.random() * 0.3,
                sparkleTimer: 0,
            });
        }

        // Spawn first one quickly
        spawnStar();

        function draw(time) {
            ctx.clearRect(0, 0, w, h);

            // Spawn new stars periodically (every 3-8 seconds)
            if (time - lastSpawnRef.current > 3000 + Math.random() * 5000) {
                spawnStar();
                lastSpawnRef.current = time;
            }

            const stars = starsRef.current;
            const particles = particlesRef.current;

            // ── Draw stars ──
            for (let i = stars.length - 1; i >= 0; i--) {
                const s = stars[i];
                s.x += s.vx;
                s.y += s.vy;
                s.life -= s.decay;
                s.sparkleTimer++;

                if (s.life <= 0 || s.x < -50 || s.x > w + 50 || s.y > h + 50) {
                    stars.splice(i, 1);
                    continue;
                }

                const alpha = s.life * s.brightness;

                // Calculate tail direction (opposite of velocity)
                const vel = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
                const nx = -s.vx / vel;
                const ny = -s.vy / vel;
                const tailEndX = s.x + nx * s.tailLength;
                const tailEndY = s.y + ny * s.tailLength;

                // ── Tail glow (wide, soft) ──
                const glowGrad = ctx.createLinearGradient(s.x, s.y, tailEndX, tailEndY);
                glowGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.15})`);
                glowGrad.addColorStop(0.3, `${s.color.tail}${Math.floor(alpha * 0.08 * 255).toString(16).padStart(2, '0')}`);
                glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(tailEndX, tailEndY);
                ctx.strokeStyle = glowGrad;
                ctx.lineWidth = 6;
                ctx.lineCap = 'round';
                ctx.stroke();

                // ── Tail core (thin, bright) ──
                const coreGrad = ctx.createLinearGradient(s.x, s.y, tailEndX, tailEndY);
                coreGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.8})`);
                coreGrad.addColorStop(0.15, `${s.color.mid}${Math.floor(alpha * 0.5 * 255).toString(16).padStart(2, '0')}`);
                coreGrad.addColorStop(0.5, `${s.color.tail}${Math.floor(alpha * 0.2 * 255).toString(16).padStart(2, '0')}`);
                coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(tailEndX, tailEndY);
                ctx.strokeStyle = coreGrad;
                ctx.lineWidth = 1.5;
                ctx.lineCap = 'round';
                ctx.stroke();

                // ── Head glow (radial, bright) ──
                const headGrad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 8);
                headGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.9})`);
                headGrad.addColorStop(0.3, `rgba(255, 255, 255, ${alpha * 0.4})`);
                headGrad.addColorStop(0.6, `${s.color.mid}${Math.floor(alpha * 0.15 * 255).toString(16).padStart(2, '0')}`);
                headGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

                ctx.beginPath();
                ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
                ctx.fillStyle = headGrad;
                ctx.fill();

                // ── Head core (tiny, white-hot) ──
                ctx.beginPath();
                ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.fill();

                // ── Sparkle particles (every few frames) ──
                if (s.sparkleTimer % 4 === 0 && s.life > 0.3) {
                    particles.push({
                        x: s.x + (Math.random() - 0.5) * 4,
                        y: s.y + (Math.random() - 0.5) * 4,
                        life: 0.6 + Math.random() * 0.4,
                        decay: 0.015 + Math.random() * 0.01,
                        r: 0.5 + Math.random() * 1,
                        color: s.color.mid,
                    });
                }
            }

            // ── Draw sparkle particles ──
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.life -= p.decay;
                if (p.life <= 0) {
                    particles.splice(i, 1);
                    continue;
                }
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
                ctx.fillStyle = `${p.color}${Math.floor(p.life * 0.4 * 255).toString(16).padStart(2, '0')}`;
                ctx.fill();
            }

            frameRef.current = requestAnimationFrame(draw);
        }

        frameRef.current = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(frameRef.current);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="shooting-stars-canvas"
            style={{ width: '100%', height: '100%' }}
        />
    );
}

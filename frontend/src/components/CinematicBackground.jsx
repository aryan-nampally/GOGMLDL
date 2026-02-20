import { useRef, useEffect, useCallback } from 'react';
import { useFocus } from '../context/FocusContext';
import './CinematicBackground.css';

/**
 * CinematicBackground — "A futuristic AI observatory in deep space."
 *
 * Layers (back to front):
 *   1. Deep black base (#050505)
 *   2. Three blurred radial gradient glows (blue, purple, emerald)
 *   3. Neural cosmos: faint dots + thin connections with traveling light
 *   4. Realistic shooting stars with glowing tails
 *   5. Cinematic vignette
 *
 * Interactions:
 *   - Mouse parallax (1–2px shift)
 *   - Focus Mode dims everything
 */
export default function CinematicBackground() {
    const canvasRef = useRef(null);
    const mouseRef = useRef({ x: 0.5, y: 0.5 });
    const frameRef = useRef(null);
    const nodesRef = useRef([]);
    const starsRef = useRef([]);
    const sparklesRef = useRef([]);
    const lastStarRef = useRef(0);
    const reduceMotionRef = useRef(false);
    const isVisibleRef = useRef(true);
    const { focused } = useFocus();

    // ── Initialize neural nodes ──
    const initNodes = useCallback((w, h) => {
        const count = Math.floor((w * h) / 35000);
        const nodes = [];
        for (let i = 0; i < count; i++) {
            nodes.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.15,
                vy: (Math.random() - 0.5) * 0.15,
                r: 1.2 + Math.random() * 1.2,
                pulse: Math.random() * Math.PI * 2,
                pulseSpeed: 0.008 + Math.random() * 0.012,
            });
        }
        nodesRef.current = nodes;
    }, []);

    // ── Spawn a realistic shooting star ──
    // All radiate from top-left → bottom-right (like a real meteor shower)
    const spawnStar = useCallback((w, h) => {
        // Spawn along top edge (left 60%) or left edge (top 50%)
        const edge = Math.random();
        let startX, startY;
        if (edge < 0.6) {
            startX = Math.random() * w * 0.6;
            startY = -10;
        } else {
            startX = -10;
            startY = Math.random() * h * 0.5;
        }

        // Consistent diagonal direction with slight wobble (±15°)
        const baseAngle = 0.78; // ~45° diagonal
        const angle = baseAngle + (Math.random() - 0.5) * 0.5;
        const speed = 1.2 + Math.random() * 1.5;
        const tailLength = 100 + Math.random() * 120;

        const palettes = [
            { head: '#ffffff', mid: '#a8c8ff', tail: '#4F8BF9' },
            { head: '#ffffff', mid: '#d4b8ff', tail: '#9B5DE5' },
            { head: '#ffffff', mid: '#b8ffec', tail: '#06D6A0' },
            { head: '#ffffff', mid: '#b8eeff', tail: '#00D4FF' },
        ];

        starsRef.current.push({
            x: startX,
            y: startY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            tailLength,
            life: 1.0,
            decay: 0.0015 + Math.random() * 0.002,
            color: palettes[Math.floor(Math.random() * palettes.length)],
            brightness: 0.7 + Math.random() * 0.3,
            sparkleTimer: 0,
        });
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let w, h;

        const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
        reduceMotionRef.current = !!media?.matches;
        isVisibleRef.current = !document.hidden;

        const stopLoop = () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        };

        const startLoop = () => {
            if (frameRef.current) return;
            if (reduceMotionRef.current || !isVisibleRef.current) return;
            frameRef.current = requestAnimationFrame(draw);
        };

        const resize = () => {
            w = window.innerWidth;
            h = window.innerHeight;
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            canvas.width = Math.floor(w * dpr);
            canvas.height = Math.floor(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            if (nodesRef.current.length === 0) initNodes(w, h);
        };

        resize();
        window.addEventListener('resize', resize);

        const handleMouse = (e) => {
            mouseRef.current = { x: e.clientX / w, y: e.clientY / h };
        };
        window.addEventListener('mousemove', handleMouse);

        const handleVisibility = () => {
            isVisibleRef.current = !document.hidden;
            if (!isVisibleRef.current) stopLoop();
            else startLoop();
        };
        document.addEventListener('visibilitychange', handleVisibility);

        const handleMediaChange = (e) => {
            reduceMotionRef.current = !!e.matches;
            if (reduceMotionRef.current) {
                stopLoop();
                // Render a single static frame.
                draw(performance.now(), true);
            } else {
                // Reset star cadence so we don't instantly spawn.
                lastStarRef.current = performance.now();
                startLoop();
            }
        };
        if (media?.addEventListener) media.addEventListener('change', handleMediaChange);
        else if (media?.addListener) media.addListener(handleMediaChange);

        // Spawn first star quickly
        spawnStar(w || window.innerWidth, h || window.innerHeight);

        // ── Render Loop ──
        const draw = (time, forceStatic = false) => {
            ctx.clearRect(0, 0, w, h);

            const animateStep = !forceStatic && !reduceMotionRef.current;

            const mx = mouseRef.current.x;
            const my = mouseRef.current.y;
            const px = (mx - 0.5) * 3;
            const py = (my - 0.5) * 3;

            // ── Layer: Neural Nodes ──
            const nodes = nodesRef.current;
            const connectionDist = 140;

            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i];
                if (animateStep) {
                    n.x += n.vx;
                    n.y += n.vy;
                    n.pulse += n.pulseSpeed;
                }

                if (n.x < -20) n.x = w + 20;
                if (n.x > w + 20) n.x = -20;
                if (n.y < -20) n.y = h + 20;
                if (n.y > h + 20) n.y = -20;

                const alpha = 0.15 + Math.sin(n.pulse) * 0.1;
                const nx = n.x + px;
                const ny = n.y + py;

                ctx.beginPath();
                ctx.arc(nx, ny, n.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(79, 139, 249, ${alpha})`;
                ctx.fill();

                for (let j = i + 1; j < nodes.length; j++) {
                    const m = nodes[j];
                    const dx = n.x - m.x;
                    const dy = n.y - m.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < connectionDist) {
                        const lineAlpha = (1 - dist / connectionDist) * 0.06;
                        ctx.beginPath();
                        ctx.moveTo(nx, ny);
                        ctx.lineTo(m.x + px, m.y + py);
                        ctx.strokeStyle = `rgba(79, 139, 249, ${lineAlpha})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();

                        const pulsePos = (Math.sin(time * 0.0008 + i * 0.5) + 1) / 2;
                        const plx = nx + (m.x + px - nx) * pulsePos;
                        const ply = ny + (m.y + py - ny) * pulsePos;
                        const pulseAlpha = lineAlpha * 3;
                        if (pulseAlpha > 0.02) {
                            ctx.beginPath();
                            ctx.arc(plx, ply, 1.5, 0, Math.PI * 2);
                            ctx.fillStyle = `rgba(155, 93, 229, ${Math.min(pulseAlpha, 0.2)})`;
                            ctx.fill();
                        }
                    }
                }
            }

            // ── Layer: Shooting Stars ──
            if (animateStep && time - lastStarRef.current > 4000 + Math.random() * 6000) {
                spawnStar(w, h);
                lastStarRef.current = time;
            }

            const stars = starsRef.current;
            const sparkles = sparklesRef.current;

            for (let i = stars.length - 1; i >= 0; i--) {
                const s = stars[i];
                if (animateStep) {
                    s.x += s.vx;
                    s.y += s.vy;
                    s.life -= s.decay;
                    s.sparkleTimer++;
                }

                if (s.life <= 0 || s.x < -100 || s.x > w + 100 || s.y > h + 100) {
                    stars.splice(i, 1);
                    continue;
                }

                const a = s.life * s.brightness;
                const vel = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
                const dnx = -s.vx / vel;
                const dny = -s.vy / vel;
                const tx = s.x + dnx * s.tailLength;
                const ty = s.y + dny * s.tailLength;

                // Tail glow (wide, soft)
                const glowGrad = ctx.createLinearGradient(s.x, s.y, tx, ty);
                glowGrad.addColorStop(0, `rgba(255, 255, 255, ${a * 0.15})`);
                glowGrad.addColorStop(0.3, hexAlpha(s.color.tail, a * 0.08));
                glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(tx, ty);
                ctx.strokeStyle = glowGrad;
                ctx.lineWidth = 6;
                ctx.lineCap = 'round';
                ctx.stroke();

                // Tail core (thin, bright)
                const coreGrad = ctx.createLinearGradient(s.x, s.y, tx, ty);
                coreGrad.addColorStop(0, `rgba(255, 255, 255, ${a * 0.8})`);
                coreGrad.addColorStop(0.15, hexAlpha(s.color.mid, a * 0.5));
                coreGrad.addColorStop(0.5, hexAlpha(s.color.tail, a * 0.2));
                coreGrad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(tx, ty);
                ctx.strokeStyle = coreGrad;
                ctx.lineWidth = 1.5;
                ctx.lineCap = 'round';
                ctx.stroke();

                // Head glow (radial)
                const headGrad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 10);
                headGrad.addColorStop(0, `rgba(255, 255, 255, ${a * 0.9})`);
                headGrad.addColorStop(0.3, `rgba(255, 255, 255, ${a * 0.3})`);
                headGrad.addColorStop(0.6, hexAlpha(s.color.mid, a * 0.12));
                headGrad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.beginPath();
                ctx.arc(s.x, s.y, 10, 0, Math.PI * 2);
                ctx.fillStyle = headGrad;
                ctx.fill();

                // Head core (tiny white-hot point)
                ctx.beginPath();
                ctx.arc(s.x, s.y, 1.8, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
                ctx.fill();

                // Sparkle particles
                if (animateStep && s.sparkleTimer % 3 === 0 && s.life > 0.3) {
                    sparkles.push({
                        x: s.x + (Math.random() - 0.5) * 6,
                        y: s.y + (Math.random() - 0.5) * 6,
                        life: 0.5 + Math.random() * 0.5,
                        decay: 0.012 + Math.random() * 0.01,
                        r: 0.5 + Math.random() * 1,
                        color: s.color.mid,
                    });
                }
            }

            // ── Draw sparkle particles ──
            for (let i = sparkles.length - 1; i >= 0; i--) {
                const p = sparkles[i];
                p.life -= p.decay;
                if (p.life <= 0) {
                    sparkles.splice(i, 1);
                    continue;
                }
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
                ctx.fillStyle = hexAlpha(p.color, p.life * 0.35);
                ctx.fill();
            }

            if (animateStep && isVisibleRef.current) {
                frameRef.current = requestAnimationFrame(draw);
            } else {
                frameRef.current = null;
            }
        };

        // Render an initial frame (static if reduced motion).
        if (reduceMotionRef.current || !isVisibleRef.current) draw(performance.now(), true);
        else frameRef.current = requestAnimationFrame(draw);

        return () => {
            stopLoop();
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouse);
            document.removeEventListener('visibilitychange', handleVisibility);
            if (media?.removeEventListener) media.removeEventListener('change', handleMediaChange);
            else if (media?.removeListener) media.removeListener(handleMediaChange);
        };
    }, [initNodes, spawnStar]);

    return (
        <div className={`cinematic-bg ${focused ? 'focus-active' : ''}`}>
            <div className="cinematic-glows" />
            <canvas ref={canvasRef} className="cinematic-canvas" />
            <div className="cinematic-vignette" />
        </div>
    );
}

/** Helper: hex color + float alpha → rgba string */
function hexAlpha(hex, alpha) {
    const a = Math.max(0, Math.min(1, alpha));
    const hex2 = Math.floor(a * 255).toString(16).padStart(2, '0');
    return hex + hex2;
}

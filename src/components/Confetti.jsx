import { useEffect, useRef } from 'react';

const COLORS = [
  '#f56565', '#f5a623', '#34c972', '#7c6af7',
  '#63b3ed', '#fc8181', '#ffd700', '#ff69b4',
  '#00ced1', '#ff6347', '#adff2f', '#da70d6',
];

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

export default function Confetti({ onDone }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const DURATION = 3000;
    const PARTICLE_COUNT = 120;

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: randomBetween(canvas.width * 0.2, canvas.width * 0.8),
      y: randomBetween(-20, canvas.height * 0.4),
      vx: randomBetween(-3, 3),
      vy: randomBetween(-6, 2),
      size: randomBetween(5, 11),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: randomBetween(0, Math.PI * 2),
      rotationSpeed: randomBetween(-0.12, 0.12),
      shape: Math.random() < 0.5 ? 'rect' : 'circle',
      gravity: randomBetween(0.12, 0.22),
      alpha: 1,
    }));

    const startTime = performance.now();
    let animFrame;

    function draw(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / DURATION, 1);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Fade out in last third
        if (progress > 0.67) {
          p.alpha = Math.max(0, 1 - (progress - 0.67) / 0.33);
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      if (progress < 1) {
        animFrame = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (onDone) onDone();
      }
    }

    animFrame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [onDone]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}

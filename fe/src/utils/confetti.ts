const COLORS = [
  '#6366f1',
  '#818cf8',
  '#3b82f6',
  '#60a5fa',
  '#a78bfa',
  '#c4b5fd',
  '#34d399',
  '#fbbf24',
  '#f472b6',
  '#ffffff',
  '#e2e8f0',
];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  gravity: number;
  rotation: number;
  rotSpeed: number;
};

const makeBurst = (x: number, y: number, count: number): Particle[] =>
  Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 10;

    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 5 + Math.random() * 7,
      alpha: 1,
      gravity: 0.25 + Math.random() * 0.15,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 8,
    };
  });

export function launchConfetti(canvas: HTMLCanvasElement | null) {
  if (!canvas) {
    return undefined;
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return undefined;
  }

  const width = canvas.width;
  const height = canvas.height;
  const particles = [
    ...makeBurst(width * 0.2, height * 0.25, 80),
    ...makeBurst(width * 0.8, height * 0.25, 80),
    ...makeBurst(width * 0.5, height * 0.2, 60),
  ];

  const timeoutIds = [
    window.setTimeout(() => particles.push(...makeBurst(width * 0.15, height * 0.3, 60)), 300),
    window.setTimeout(() => particles.push(...makeBurst(width * 0.85, height * 0.3, 60)), 400),
    window.setTimeout(() => particles.push(...makeBurst(width * 0.5, height * 0.15, 80)), 600),
    window.setTimeout(
      () => particles.push(...makeBurst(width * 0.3, height * 0.2, 50), ...makeBurst(width * 0.7, height * 0.2, 50)),
      900,
    ),
  ];

  let rafId = 0;

  const draw = () => {
    ctx.clearRect(0, 0, width, height);

    for (const particle of particles) {
      particle.vy += particle.gravity;
      particle.vx *= 0.99;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.rotation += particle.rotSpeed;
      particle.alpha -= 0.012;

      ctx.save();
      ctx.globalAlpha = Math.max(0, particle.alpha);
      ctx.translate(particle.x, particle.y);
      ctx.rotate((particle.rotation * Math.PI) / 180);
      ctx.fillStyle = particle.color;
      ctx.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
      ctx.restore();
    }

    if (particles.some((particle) => particle.alpha > 0.02)) {
      rafId = requestAnimationFrame(draw);
      return;
    }

    ctx.clearRect(0, 0, width, height);
  };

  rafId = requestAnimationFrame(draw);

  return () => {
    timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    cancelAnimationFrame(rafId);
    ctx.clearRect(0, 0, width, height);
  };
}

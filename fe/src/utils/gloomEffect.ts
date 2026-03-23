const GLOOM_COLORS = ['#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155'];

type GloomParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  width: number;
  alpha: number;
  fadeSpeed: number;
  color: string;
};

const makeGloomParticles = (width: number, height: number, count: number): GloomParticle[] =>
  Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height - height * 0.3,
    vx: -0.35 + Math.random() * 0.7,
    vy: 2.2 + Math.random() * 3.4,
    length: 12 + Math.random() * 20,
    width: 1 + Math.random() * 1.4,
    alpha: 0.12 + Math.random() * 0.24,
    fadeSpeed: 0.0008 + Math.random() * 0.0012,
    color: GLOOM_COLORS[Math.floor(Math.random() * GLOOM_COLORS.length)],
  }));

export function launchGloomEffect(canvas: HTMLCanvasElement | null) {
  if (!canvas) {
    return undefined;
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return undefined;
  }

  let width = canvas.width;
  let height = canvas.height;
  const particles = makeGloomParticles(width, height, 150);
  let rafId = 0;

  const handleResize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    width = canvas.width;
    height = canvas.height;
  };

  const drawBackdrop = (time: number) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(15, 23, 42, 0.28)');
    gradient.addColorStop(0.45, 'rgba(30, 41, 59, 0.18)');
    gradient.addColorStop(1, 'rgba(2, 6, 23, 0.32)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const hazeRadius = width * 0.34;
    const hazeX = width * 0.5 + Math.sin(time / 1800) * width * 0.04;
    const hazeY = height * 0.22;
    const haze = ctx.createRadialGradient(hazeX, hazeY, 0, hazeX, hazeY, hazeRadius);

    haze.addColorStop(0, 'rgba(226, 232, 240, 0.08)');
    haze.addColorStop(1, 'rgba(226, 232, 240, 0)');

    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, width, height);
  };

  const draw = (time: number) => {
    ctx.clearRect(0, 0, width, height);
    drawBackdrop(time);

    for (const particle of particles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.alpha = Math.max(0.05, particle.alpha - particle.fadeSpeed);

      if (particle.y - particle.length > height || particle.x < -40 || particle.x > width + 40) {
        particle.x = Math.random() * width;
        particle.y = -particle.length - Math.random() * height * 0.12;
        particle.vx = -0.35 + Math.random() * 0.7;
        particle.vy = 2.2 + Math.random() * 3.4;
        particle.length = 12 + Math.random() * 20;
        particle.width = 1 + Math.random() * 1.4;
        particle.alpha = 0.12 + Math.random() * 0.24;
        particle.fadeSpeed = 0.0008 + Math.random() * 0.0012;
        particle.color = GLOOM_COLORS[Math.floor(Math.random() * GLOOM_COLORS.length)];
      }

      ctx.beginPath();
      ctx.strokeStyle = particle.color;
      ctx.lineWidth = particle.width;
      ctx.globalAlpha = particle.alpha;
      ctx.moveTo(particle.x, particle.y);
      ctx.lineTo(particle.x + particle.vx * 1.6, particle.y + particle.length);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    rafId = requestAnimationFrame(draw);
  };

  window.addEventListener('resize', handleResize);
  rafId = requestAnimationFrame(draw);

  return () => {
    window.removeEventListener('resize', handleResize);
    cancelAnimationFrame(rafId);
    ctx.clearRect(0, 0, width, height);
  };
}

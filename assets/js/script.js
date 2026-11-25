const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

let width, height, dpr;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = canvas.width = Math.floor(window.innerWidth * dpr);
  height = canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
}

window.addEventListener('resize', resize);
resize();

const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
window.addEventListener('mousemove', e => {
  mouse.tx = e.clientX / window.innerWidth;
  mouse.ty = e.clientY / window.innerHeight;
});

const palette = [
  [255, 94, 177],
  [120, 119, 255],
  [64, 196, 255],
  [255, 159, 92],
  [168, 102, 255],
  [92, 230, 190],
];

class Blob {
  constructor(color, opts) {
    this.color = color;
    this.baseX = opts.x;
    this.baseY = opts.y;
    this.radius = opts.r;
    this.phase = Math.random() * Math.PI * 2;
    this.speed = opts.speed;
    this.drift = opts.drift;
    this.depth = opts.depth;
    this.x = 0;
    this.y = 0;
  }

  update(t) {
    const p = this.phase + t * this.speed;
    this.x = (this.baseX + Math.sin(p) * this.drift + (mouse.x - 0.5) * this.depth) * width;
    this.y = (this.baseY + Math.cos(p * 0.9) * this.drift + (mouse.y - 0.5) * this.depth) * height;
    this.r = this.radius * Math.min(width, height) * (1 + Math.sin(p * 1.3) * 0.08);
  }

  draw() {
    const [r, g, b] = this.color;
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.55)`);
    grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.25)`);
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

const blobs = [
  new Blob(palette[0], { x: 0.25, y: 0.30, r: 0.55, speed: 0.00022, drift: 0.12, depth: 80 }),
  new Blob(palette[1], { x: 0.75, y: 0.35, r: 0.50, speed: 0.00028, drift: 0.14, depth: 120 }),
  new Blob(palette[2], { x: 0.60, y: 0.75, r: 0.55, speed: 0.00019, drift: 0.10, depth: 100 }),
  new Blob(palette[3], { x: 0.20, y: 0.80, r: 0.45, speed: 0.00031, drift: 0.13, depth: 60 }),
  new Blob(palette[4], { x: 0.50, y: 0.50, r: 0.50, speed: 0.00024, drift: 0.16, depth: 140 }),
  new Blob(palette[5], { x: 0.85, y: 0.70, r: 0.40, speed: 0.00026, drift: 0.11, depth: 90 }),
];

function draw() {
  mouse.x += (mouse.tx - mouse.x) * 0.05;
  mouse.y += (mouse.ty - mouse.y) * 0.05;

  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = 'lighter';
  const t = performance.now();
  blobs.forEach(b => {
    b.update(t);
    b.draw();
  });

  ctx.globalCompositeOperation = 'source-over';
  requestAnimationFrame(draw);
}

draw();
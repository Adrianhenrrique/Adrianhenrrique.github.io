const typewriter = document.getElementById('typewriter');
const text = 'Kaik, fiz essa surpresa para te dizer algo simples: gosto da ideia de viver momentos bons ao seu lado. Tem uma pergunta especial te esperando no fim dessa página. — Adrian';
let idx = 0;
function writeText() {
  if (!typewriter) return;
  if (idx <= text.length) {
    typewriter.textContent = text.slice(0, idx++);
    setTimeout(writeText, 23);
  }
}
writeText();

// Reveal on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.14 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Smooth scroll buttons
for (const el of document.querySelectorAll('[data-scroll]')) {
  el.addEventListener('click', () => {
    const target = document.querySelector(el.getAttribute('data-scroll'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// Letter modal
const letterModal = document.getElementById('letterModal');
const openLetter = document.getElementById('openLetter');
const closeLetter = document.getElementById('closeLetter');
const closeLetterBtn = document.getElementById('closeLetterBtn');
const toggleLetter = (show) => {
  letterModal.classList.toggle('active', show);
  letterModal.setAttribute('aria-hidden', String(!show));
};
openLetter?.addEventListener('click', () => toggleLetter(true));
closeLetter?.addEventListener('click', () => toggleLetter(false));
closeLetterBtn?.addEventListener('click', () => toggleLetter(false));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') toggleLetter(false);
});

// Floating hearts background
const heartContainer = document.getElementById('floatingHearts');
const heartTemplate = document.getElementById('heartTemplate');
function spawnHeart() {
  if (!heartContainer || !heartTemplate) return;
  const heart = heartTemplate.content.firstElementChild.cloneNode(true);
  heart.style.left = `${Math.random() * 100}%`;
  heart.style.fontSize = `${12 + Math.random() * 18}px`;
  heart.style.animationDuration = `${7 + Math.random() * 8}s`;
  heart.style.setProperty('--drift', `${-30 + Math.random() * 60}px`);
  heart.textContent = Math.random() > .4 ? '❤' : '✦';
  heartContainer.appendChild(heart);
  setTimeout(() => heart.remove(), 16000);
}
setInterval(spawnHeart, 700);
for (let i = 0; i < 12; i++) setTimeout(spawnHeart, i * 180);

// Tilt cards
function bindTilt(card) {
  card.addEventListener('mousemove', (e) => {
    if (window.innerWidth < 900) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rx = (py - 0.5) * -8;
    const ry = (px - 0.5) * 8;
    card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
}
document.querySelectorAll('.tilt-card').forEach(bindTilt);

// Cursor glow
const cursorGlow = document.getElementById('cursorGlow');
document.addEventListener('pointermove', (e) => {
  if (!cursorGlow) return;
  cursorGlow.style.left = `${e.clientX}px`;
  cursorGlow.style.top = `${e.clientY}px`;
  cursorGlow.style.opacity = '1';
});
document.addEventListener('pointerleave', () => {
  if (cursorGlow) cursorGlow.style.opacity = '0';
});

// Proposal interactions
const yesBtn = document.getElementById('yesBtn');
const noBtn = document.getElementById('noBtn');
const proposalActions = document.getElementById('proposalActions');
const successSection = document.getElementById('successSection');
const replayBtn = document.getElementById('replayBtn');
// A escolha pode ser feita sem pressão; o botão permanece acessível.
noBtn?.addEventListener('click', () => {
  const note = document.getElementById('thinkNote');
  if (note) note.textContent = 'Tudo bem, Kaik. Pode pensar com calma. Sem pressa e sem pressão. 💚 — Adrian';
});

function celebrate() {
  successSection?.classList.remove('hidden');
  successSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  launchConfetti();
  setTimeout(() => launchConfetti(), 300);
  setTimeout(() => launchConfetti(), 700);
}
yesBtn?.addEventListener('click', celebrate);
replayBtn?.addEventListener('click', launchConfetti);

// Confetti / heart canvas
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
let pieces = [];
function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * ratio;
  canvas.height = innerHeight * ratio;
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}
resizeCanvas();
addEventListener('resize', resizeCanvas);

function randomColor() {
  return ['#7cf2c5', '#ff82d1', '#7bbdff', '#ffe38d', '#ffffff'][Math.floor(Math.random() * 5)];
}
function launchConfetti() {
  const amount = window.innerWidth < 768 ? 90 : 150;
  for (let i = 0; i < amount; i++) {
    pieces.push({
      x: innerWidth / 2,
      y: innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 9,
      vy: -2 - Math.random() * 8,
      size: 6 + Math.random() * 8,
      color: randomColor(),
      rotation: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      shape: Math.random() > 0.65 ? 'heart' : 'rect',
      life: 0,
      ttl: 120 + Math.random() * 40,
    });
  }
}

function drawHeart(x, y, size, color, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(size / 18, size / 18);
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(0, 2, -6, 0, -8, 4);
  ctx.bezierCurveTo(-10, 8, -6, 13, 0, 17);
  ctx.bezierCurveTo(6, 13, 10, 8, 8, 4);
  ctx.bezierCurveTo(6, 0, 0, 2, 0, 6);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function animateConfetti() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  pieces = pieces.filter((p) => p.life < p.ttl);
  for (const p of pieces) {
    p.life += 1;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.12;
    p.rotation += p.vr;
    if (p.shape === 'heart') {
      drawHeart(p.x, p.y, p.size, p.color, p.rotation);
    } else {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
      ctx.restore();
    }
  }
  requestAnimationFrame(animateConfetti);
}
animateConfetti();
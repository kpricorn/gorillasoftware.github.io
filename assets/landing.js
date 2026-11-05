(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s) => document.querySelector(s);

  const PALETTE = ['#e2675c', '#f4b63f', '#2a9d8f', '#f29bb4', '#5b8def', '#3f8f5a'];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  /* ---------- Email: split into letters ---------- */
  const email = $('.email');
  const address = email.dataset.user + '@' + email.dataset.domain;
  email.href = 'mailto:' + address;
  email.setAttribute('aria-label', address);
  email.textContent = '';
  [...address].forEach((c, i) => {
    const s = document.createElement('span');
    s.className = 'ch' + (c === '@' ? ' at' : '');
    s.textContent = c;
    s.setAttribute('aria-hidden', 'true');
    s.style.setProperty('--i', i);
    s.style.setProperty('--c', PALETTE[i % PALETTE.length]);
    s.style.setProperty('--tilt', (Math.random() * 16 - 8).toFixed(1) + 'deg');
    email.appendChild(s);
  });

  const copyBtn = $('.copy');
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(address);
      copyBtn.textContent = 'copied!';
    } catch (e) {
      copyBtn.textContent = address;
    }
    copyBtn.classList.add('done');
    setTimeout(() => { copyBtn.textContent = 'copy address'; copyBtn.classList.remove('done'); }, 1800);
  });

  /* ---------- Flat confetti shapes ---------- */
  const canvas = $('#jungle');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  const mouse = { x: -9999, y: -9999 };
  const shapes = [];   // ambient, wrap around
  const bits = [];     // bursts + bananas, die off-screen
  const KINDS = ['circle', 'square', 'triangle', 'half', 'plus', 'squiggle', 'ring'];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const target = Math.round(Math.min(34, Math.max(12, (W * H) / 38000)));
    while (shapes.length < target) shapes.push(makeShape(Math.random() * W, Math.random() * H));
    shapes.length = target;
  }

  function makeShape(x, y, o = {}) {
    return Object.assign({
      x, y,
      vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4,
      size: 10 + Math.random() * 22,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - .5) * .02,
      kind: pick(KINDS),
      color: pick(PALETTE),
    }, o);
  }

  function draw(s) {
    const r = s.size / 2;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);
    ctx.fillStyle = s.color;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = Math.max(3, s.size / 5);
    ctx.lineCap = 'round';
    ctx.beginPath();
    switch (s.kind) {
      case 'circle': ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); break;
      case 'square': ctx.roundRect ? ctx.roundRect(-r, -r, s.size, s.size, r * .25) : ctx.rect(-r, -r, s.size, s.size); ctx.fill(); break;
      case 'triangle': ctx.moveTo(0, -r); ctx.lineTo(r * .95, r * .75); ctx.lineTo(-r * .95, r * .75); ctx.closePath(); ctx.fill(); break;
      case 'half': ctx.arc(0, 0, r, 0, Math.PI); ctx.closePath(); ctx.fill(); break;
      case 'ring': ctx.arc(0, 0, r * .8, 0, Math.PI * 2); ctx.stroke(); break;
      case 'plus': ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.stroke(); break;
      case 'squiggle':
        ctx.moveTo(-r * 1.4, 0);
        for (let i = 1; i <= 4; i++) ctx.quadraticCurveTo(-r * 1.4 + (i - .5) * r * .7, (i % 2 ? -1 : 1) * r * .6, -r * 1.4 + i * r * .7, 0);
        ctx.stroke(); break;
      case 'banana':
        ctx.arc(0, 0, r, Math.PI * .15, Math.PI * .85);
        ctx.arc(0, -r * .35, r * 1.05, Math.PI * .8, Math.PI * .2, true);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#483831';
        ctx.beginPath(); ctx.arc(Math.cos(Math.PI * .15) * r, Math.sin(Math.PI * .15) * r - r * .1, r * .12, 0, Math.PI * 2); ctx.fill();
        break;
    }
    ctx.restore();
  }

  function step(s, wrap) {
    const dx = s.x - mouse.x, dy = s.y - mouse.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < 18000) {
      const d = Math.sqrt(d2) || 1;
      s.vx += (dx / d) * .5; s.vy += (dy / d) * .5;
      s.vr += (Math.random() - .5) * .02;
    }
    if (wrap) {
      s.vx *= .97; s.vy *= .97; s.vr *= .99;
      s.vx += (Math.random() - .5) * .03; s.vy += (Math.random() - .5) * .03;
      const pad = 40;
      if (s.x < -pad) s.x = W + pad; else if (s.x > W + pad) s.x = -pad;
      if (s.y < -pad) s.y = H + pad; else if (s.y > H + pad) s.y = -pad;
    } else {
      s.vx *= .99; s.vy = s.vy * .99 + s.g;
    }
    s.x += s.vx; s.y += s.vy; s.rot += s.vr;
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    for (const s of shapes) { if (!reduced) step(s, true); draw(s); }
    for (let i = bits.length - 1; i >= 0; i--) {
      const b = bits[i];
      step(b, false); draw(b);
      if (b.y > H + 80 || b.x < -120 || b.x > W + 120) bits.splice(i, 1);
    }
    if (!reduced || bits.length) requestAnimationFrame(tick);
  }

  window.addEventListener('resize', () => { resize(); if (reduced) tick(); });
  resize();
  requestAnimationFrame(tick);

  /* ---------- Gorilla: eyes follow, blinking ---------- */
  const btn = $('.gorilla-btn');
  const eyes = $('.gorilla .eyes');
  const hero = $('.hero');
  const marquee = $('.marquee');

  function look(x, y) {
    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height * .2;
    const ang = Math.atan2(y - cy, x - cx);
    const dist = Math.min(1, Math.hypot(x - cx, y - cy) / 400);
    eyes.style.translate = `${(Math.cos(ang) * 1.4 * dist).toFixed(2)}px ${(Math.sin(ang) * 1.1 * dist).toFixed(2)}px`;
  }

  window.addEventListener('pointermove', (e) => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    look(e.clientX, e.clientY);
    if (!reduced) {
      const px = (e.clientX / W - .5), py = (e.clientY / H - .5);
      hero.style.transform = `translate(${px * -14}px, ${py * -10}px)`;
      marquee.style.translate = `${px * 30}px ${py * 20}px`;
    }
  });
  document.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });

  (function blinkLoop() {
    setTimeout(() => {
      eyes.classList.add('blink');
      setTimeout(() => eyes.classList.remove('blink'), 200);
      if (Math.random() < .25) setTimeout(() => { eyes.classList.add('blink'); setTimeout(() => eyes.classList.remove('blink'), 200); }, 260);
      blinkLoop();
    }, 2200 + Math.random() * 3500);
  })();

  /* ---------- Chest beat ---------- */
  let audio = null;
  function drum(delay, pitch) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const t = audio.currentTime + delay;
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(pitch, t);
      o.frequency.exponentialRampToValueAtTime(38, t + .25);
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(.7, t + .008);
      g.gain.exponentialRampToValueAtTime(.0001, t + .35);
      o.connect(g).connect(audio.destination);
      o.start(t); o.stop(t + .4);
    } catch (e) { /* no audio, no problem */ }
  }

  const words = ['thump', 'boom', 'ooh ooh', 'grr', 'bam', 'hoo!'];
  const root = document.documentElement;
  let beats = 0;
  let sunIdx = 0;

  function recolor() {
    sunIdx = (sunIdx + 1) % PALETTE.length;
    root.style.setProperty('--sun', PALETTE[sunIdx]);
    root.style.setProperty('--offset', PALETTE[(sunIdx + 1) % PALETTE.length]);
  }

  function beat() {
    beats++;
    btn.classList.remove('beat'); void btn.offsetWidth; btn.classList.add('beat');
    drum(0, 120); drum(.14, 95);
    recolor();

    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height * .45;

    if (!reduced) {
      document.body.classList.remove('shake'); void document.body.offsetWidth; document.body.classList.add('shake');
      for (let i = 0; i < 2; i++) {
        const ring = document.createElement('span');
        ring.className = 'ring';
        ring.style.setProperty('--c', PALETTE[(sunIdx + 2 + i) % PALETTE.length]);
        ring.style.animationDelay = i * 140 + 'ms';
        hero.appendChild(ring);
        setTimeout(() => ring.remove(), 1200);
      }
      for (const s of shapes) {
        const dx = s.x - cx, dy = s.y - cy, d = Math.hypot(dx, dy) || 1;
        const k = Math.max(0, 1 - d / 700) * 9;
        s.vx += dx / d * k; s.vy += dy / d * k; s.vr += (Math.random() - .5) * .2;
      }
      burst(cx, cy, 18);
    }

    const w = document.createElement('span');
    w.className = 'thump';
    w.textContent = pick(words);
    w.style.setProperty('--c', pick(PALETTE));
    w.style.left = 20 + Math.random() * 60 + '%';
    w.style.top = 25 + Math.random() * 25 + '%';
    w.style.setProperty('--r', (Math.random() * 30 - 15).toFixed(0) + 'deg');
    hero.appendChild(w);
    setTimeout(() => w.remove(), 1000);

    if (beats % 7 === 0) bananaRain();
  }

  function burst(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 7;
      bits.push(makeShape(x, y, {
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - 3, g: .25,
        vr: (Math.random() - .5) * .3, size: 8 + Math.random() * 14,
      }));
    }
    if (reduced) requestAnimationFrame(tick);
  }

  btn.addEventListener('click', beat);

  /* ---------- Bananas ---------- */
  function bananaRain() {
    if (reduced) return;
    const n = Math.min(50, Math.round(W / 24));
    for (let i = 0; i < n; i++) {
      bits.push(makeShape(Math.random() * W, -40 - Math.random() * H * .8, {
        kind: 'banana', color: '#f4b63f', size: 22 + Math.random() * 26,
        vx: (Math.random() - .5) * 1.5, vy: 1 + Math.random() * 2, g: .05,
        vr: (Math.random() - .5) * .12,
      }));
    }
  }

  let typed = '';
  window.addEventListener('keydown', (e) => {
    if (e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-6);
    if (typed === 'banana') { bananaRain(); typed = ''; }
  });

  console.log('%cgorilla software', 'font-size:20px;font-weight:800;color:#e2675c', '\nHi there, fellow dev. Type "banana" on the page. Then write us: ' + address);
})();

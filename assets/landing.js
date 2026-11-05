(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s) => document.querySelector(s);

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
    s.style.setProperty('--tilt', (Math.random() * 16 - 8).toFixed(1) + 'deg');
    email.appendChild(s);
  });

  const copyBtn = $('.copy');
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(address);
      copyBtn.textContent = 'copied 🍌';
    } catch (e) {
      copyBtn.textContent = address;
    }
    copyBtn.classList.add('done');
    setTimeout(() => { copyBtn.textContent = 'copy address'; copyBtn.classList.remove('done'); }, 1800);
  });

  /* ---------- Fireflies ---------- */
  const canvas = $('#jungle');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  const mouse = { x: -9999, y: -9999 };
  const flies = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const target = Math.round(Math.min(140, (W * H) / 9000));
    while (flies.length < target) flies.push(spawn());
    flies.length = target;
  }

  function spawn() {
    return {
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3,
      r: Math.random() * 1.8 + .6,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * .02 + .008,
      hue: Math.random() < .25 ? 8 : 38,
    };
  }

  function tick(t) {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (const f of flies) {
      const dx = f.x - mouse.x, dy = f.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 22000) {
        const d = Math.sqrt(d2) || 1;
        f.vx += (dx / d) * .35; f.vy += (dy / d) * .35;
      }
      f.vx += (Math.random() - .5) * .04;
      f.vy += (Math.random() - .5) * .04 - .004;
      f.vx *= .96; f.vy *= .96;
      f.x += f.vx; f.y += f.vy;
      if (f.x < -20) f.x = W + 20; else if (f.x > W + 20) f.x = -20;
      if (f.y < -20) f.y = H + 20; else if (f.y > H + 20) f.y = -20;

      f.phase += f.speed;
      const glow = (Math.sin(f.phase) + 1) / 2;
      const a = .15 + glow * .75;
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 7);
      g.addColorStop(0, `hsla(${f.hue}, 95%, 72%, ${a})`);
      g.addColorStop(.25, `hsla(${f.hue}, 90%, 60%, ${a * .35})`);
      g.addColorStop(1, `hsla(${f.hue}, 90%, 50%, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 7, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    if (!reduced) requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize);
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
  window.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });

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
  let beats = 0;

  function beat() {
    beats++;
    btn.classList.remove('beat'); void btn.offsetWidth; btn.classList.add('beat');
    drum(0, 120); drum(.14, 95);

    if (!reduced) {
      document.body.classList.remove('shake'); void document.body.offsetWidth; document.body.classList.add('shake');
      for (let i = 0; i < 2; i++) {
        const ring = document.createElement('span');
        ring.className = 'ring';
        ring.style.animationDelay = i * 140 + 'ms';
        hero.appendChild(ring);
        setTimeout(() => ring.remove(), 1200);
      }
      const r = btn.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height * .45;
      for (const f of flies) {
        const dx = f.x - cx, dy = f.y - cy, d = Math.hypot(dx, dy) || 1;
        const k = Math.max(0, 1 - d / 700) * 9;
        f.vx += dx / d * k; f.vy += dy / d * k;
      }
    }

    const w = document.createElement('span');
    w.className = 'thump';
    w.textContent = words[Math.floor(Math.random() * words.length)];
    w.style.left = 20 + Math.random() * 60 + '%';
    w.style.top = 25 + Math.random() * 25 + '%';
    w.style.setProperty('--r', (Math.random() * 30 - 15).toFixed(0) + 'deg');
    hero.appendChild(w);
    setTimeout(() => w.remove(), 1000);

    if (beats % 7 === 0) bananaRain();
  }

  btn.addEventListener('click', beat);

  /* ---------- Bananas ---------- */
  function bananaRain() {
    if (reduced) return;
    const n = Math.min(60, Math.round(W / 20));
    for (let i = 0; i < n; i++) {
      const b = document.createElement('span');
      b.className = 'banana';
      b.textContent = '🍌';
      b.style.left = Math.random() * 100 + 'vw';
      b.style.fontSize = 1.2 + Math.random() * 2 + 'rem';
      b.style.setProperty('--d', 2.2 + Math.random() * 2.5 + 's');
      b.style.setProperty('--dx', (Math.random() * 200 - 100).toFixed(0) + 'px');
      b.style.setProperty('--spin', (Math.random() * 1440 - 720).toFixed(0) + 'deg');
      b.style.animationDelay = Math.random() * 1.2 + 's';
      document.body.appendChild(b);
      setTimeout(() => b.remove(), 6500);
    }
  }

  let typed = '';
  window.addEventListener('keydown', (e) => {
    if (e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-6);
    if (typed === 'banana') { bananaRain(); typed = ''; }
  });

  console.log('%c🦍 gorilla software', 'font-size:20px;font-weight:bold;color:#cd6e68', '\nHi there, fellow dev. Type "banana" on the page. Then write us: ' + address);
})();

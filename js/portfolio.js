// ===== Portfolio: popup project + animasi smoke ala CS2 =====
// initPortfolio() dipanggil dari initPage() di loader.js setelah sections/portfolio.html dimuat.

const projectDetails = {
  'proj-1': {
    title: 'Game Session Manager',
    category: 'Project 01 · Web Application',
    description: 'Tuliskan deskripsi proyek pertama kamu di sini. Jelaskan tujuan, fitur, teknologi, dan hasil proyek.',
    images: [
      'images/project1-1.png',
      'images/project1-2.png',
      'images/project1-3.png',
      'images/project1-4.png',
      'images/project1-5.png'
    ]
  },
  'proj-2': {
    title: 'LetsMeet',
    category: 'Project 02 · AI-Powered Event Sponsorship Platform',
    description: 'An AI-powered platform that connects event organizers with sponsors, built collaboratively as a campus team project.',
    images: [
      'images/project2-1.png',
      'images/project2-2.png',
      'images/project2-3.png',
      'images/project2-4.png',
      'images/project2-5.png'
    ]
  },
  'proj-3': {
    title: 'mediaVault',
    category: 'Project 03 · Cross-Platform Media Monitoring App',
    description: 'An application for monitoring media across multiple platforms in one place, built collaboratively as a campus team project.',
    images: [
      'images/project3-1.png',
      'images/project3-2.png',
      'images/project3-3.png',
      'images/project3-4.png',
      'images/project3-5.png'
    ]
  },
  'proj-4': {
    title: 'AUTO18',
    category: 'Project 04 · Used Car Showroom Web App',
    description: 'A web app for a used car showroom that covers both sides of the business. Buyers browse a car marketplace with detailed filters, inspection reports, a credit simulator, and test drive booking. Sellers get an instant price estimate and a 3-step sell or trade-in form. Behind it is a showroom panel for car stock, sales processing (cash, transfer, or credit with trade-in), an accessories and service POS with thermal receipts, and a dashboard with sales reports and CSV export. Built with React 18, Vite, Tailwind CSS, and Motion. All data is saved in localStorage, so it runs without a back-end.',
    images: [
      'images/project4-1.png',
      'images/project4-2.png',
      'images/project4-3.png',
      'images/project4-4.png',
      'images/project4-5.png'
    ]
  },
  'proj-5': {
    title: 'Honkai Star Retail',
    category: 'Project 05 · Mobile Marketplace App',
    description: 'A Honkai: Star Rail themed marketplace app for in-game items such as Light Cones, Relics, materials, and currency. Users sign in with email or Google, browse the market, add items to a cart, and check out with an in-app credit wallet that can be topped up; purchased items go to their inventory. Admins get a separate panel to add, edit, and delete products and manage stock. Built with a Flutter front-end (Provider) and a Node.js + Express.js REST API on MySQL, with JWT authentication, bcrypt password hashing, Google OAuth, and role-based access for admins and users.',
    images: [
      'images/project5-1.png',
      'images/project5-2.png',
      'images/project5-3.png',
      'images/project5-4.png',
      'images/project5-5.png'
    ]
  },
  'proj-6': {
    title: 'Prima Jaya Teknik',
    category: 'Project 06 · Company Website & Product Catalog',
    description: 'A freelance company website for Prima Jaya Teknik, a distributor of industrial packing and gasket products in Jakarta. It has a bilingual (Indonesian and English) product catalog with more than 130 product pages grouped into Gasket and Gland Packing, product search, an about page, and a contact page with WhatsApp, phone, and email links. The back-end is built with ASP.NET Core (.NET 10) and SQLite: contact form messages are stored and forwarded by email over SMTP, contact clicks and page views are recorded as leads, and the contact and lead endpoints are rate limited.',
    images: [
      'images/project6-1.png',
      'images/project6-2.png',
      'images/project6-3.png',
      'images/project6-4.png',
      'images/project6-5.png'
    ]
  },
  'proj-7': {
    title: 'IPtasK',
    category: 'Project 07 · Group Study Planner & Habit Tracker',
    description: 'A group study planner and habit tracker where every task needs proof. The group leader assigns missions with deadlines, which can repeat daily or weekly for habits, or lets Gemini AI split the job fairly with staggered deadlines. Members upload proof of their work, and the other members review it by pressing Checked or Revision; a mission is only verified once everyone has checked it. Users get reminders before deadlines, and if someone misses a deadline or forgets to review, the IPtasK Bot automatically posts a confession in the group feed, with an AI-written roast caption. Each group also has a real-time chat and a member list. Built with Node.js, Express, Socket.IO, and SQLite (node:sqlite), with a vanilla JavaScript single-page app and the Gemini API.',
    images: [
      'images/project7-1.png',
      'images/project7-2.png',
      'images/project7-3.png',
      'images/project7-4.png',
      'images/project7-5.png'
    ]
  }
};

// ---- Callout agen saat melempar granat ----
// Isi `src` dengan path file audio kamu sendiri, mis. 'sounds/flash.mp3'.
// Kalau `src` null, kalimatnya diucapkan text-to-speech browser (selama VOICE_TTS true).
// Tiap lemparan memilih satu kalimat secara acak.
const VOICE_LINES = {
  smoke: [
    // Voice line CS:GO "Smoke out" (myinstants.com/en/instant/cs-go-smoke-88929)
    { text: 'Smoke out!', src: 'sounds/smoke.mp3' }
  ],
  flash: [
    // Voice line CS2 "Throwing flashbang", dipotong jadi kata "flashbang" saja
    { text: 'Flashbang!', src: 'sounds/flashbang-voice.mp3' }
  ]
};
const VOICE_TTS = true;
// Efek suara ledakan dari file (opsional), mis. 'sounds/flashbang.mp3'. null = suara sintetis di bawah
const SFX_FILES = {
  flashBang: null
};

const PIXEL = 3; // smoke & flash digambar di canvas 1/3 resolusi layar, biar ringan

// Agen 3D-nya ada di js/agents.js. Di sini cuma nama & warna tim untuk teks radio.
const TEAMS = {
  t: { name: 'T', color: '#e0b25a' },
  ct: { name: 'CT', color: '#7ea7e0' }
};

// Timeline animasi (ms sejak kartu diklik)
const T_WALK_END = 700;   // agen selesai jalan masuk
const T_THROW = 850;      // granat lepas dari tangan
const T_TURN = 1100;      // agen balik badan
const T_LEAVE_END = 1800; // agen sudah keluar layar
const T_POP = 1500;       // granat meledak jadi smoke
const T_MODAL = 2000;     // detail project muncul di dalam smoke
const FADE_MS = 900;      // durasi smoke hilang saat popup ditutup
// Disamakan dengan sounds/smoke.mp3 (0.6 dtk): kata kedua mulai ~0.45 dtk setelah suara mulai,
// jadi suara dimulai lebih awal supaya kata itu pas saat granat lepas dari tangan
const T_VOICE = T_THROW - 450;

// Flashbang (ganti tema) dilempar sambil lompat / jumpthrow (ms sejak tombol diklik).
// Disamakan dengan sounds/flashbang-voice.mp3: suara lompat ~0.10 dtk dan mendarat ~0.68 dtk
// setelah suara mulai. Kalau ganti file suara, sesuaikan angka di sini.
const JT = {
  voice: 750,   // suara "flashbang" mulai
  jump: 850,    // kaki lepas dari tanah
  release: 1140,// granat lepas di titik tertinggi
  land: 1430,   // mendarat
  turn: 1550,   // balik badan
  leave: 2250,  // sudah keluar layar
  pop: 1800     // flash meledak, tema berganti
};

// Timeline yang dipakai agen 3D (js/agents.js) untuk tiap jenis granat
const AGENT_TIMES = {
  smoke: { walkEnd: T_WALK_END, release: T_THROW, turn: T_TURN, leave: T_LEAVE_END, pop: T_POP },
  flash: { walkEnd: T_WALK_END, jump: JT.jump, release: JT.release, land: JT.land, turn: JT.turn, leave: JT.leave, pop: JT.pop }
};

function clamp01(x) { return Math.max(0, Math.min(1, x)); }
function easeOut(x) { return 1 - Math.pow(1 - x, 3); }

// ---- Suara: semua dibuat langsung dengan Web Audio, jadi tidak pakai file milik orang lain ----
const MASTER_VOLUME = 2.5; // naikkan/turunkan kalau suara terlalu pelan/keras

let audioCtx = null;
let noiseBuffer = null;
let masterOut = null;

// Harus dipanggil dari klik user, karena browser memblokir audio sebelum ada interaksi
function unlockAudio() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (err) {
    console.warn('Audio tidak bisa dijalankan di browser ini:', err);
    audioCtx = null;
    return;
  }
  if (!masterOut) {
    // Penguat utama + limiter, biar keras tapi tidak pecah
    const limiter = audioCtx.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.ratio.value = 12;
    masterOut = audioCtx.createGain();
    masterOut.gain.value = MASTER_VOLUME;
    masterOut.connect(limiter).connect(audioCtx.destination);
  }
  if (!noiseBuffer) {
    noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 4, audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
}

// White noise yang difilter: dasar untuk desis, whoosh, dan ledakan
function playNoise({ when, duration, type, freq, sweepTo, q = 1, volume, attack = 0.01, flutter = 0 }) {
  const ac = audioCtx;
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;

  const filter = ac.createBiquadFilter();
  filter.type = type;
  filter.Q.value = q;
  filter.frequency.setValueAtTime(freq, when);
  if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, when + duration);

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(volume, when + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);

  let chain = src.connect(filter);
  // Volume naik-turun cepat, biar desisnya terdengar "bergolak" seperti gas keluar
  if (flutter) {
    const tremolo = ac.createGain();
    const lfo = ac.createOscillator();
    const depth = ac.createGain();
    lfo.frequency.value = 7 + Math.random() * 4;
    depth.gain.value = flutter;
    lfo.connect(depth).connect(tremolo.gain);
    lfo.start(when);
    lfo.stop(when + duration);
    chain = chain.connect(tremolo);
  }
  chain.connect(gain).connect(masterOut);

  src.start(when, Math.random() * 3);
  src.stop(when + duration);
}

// Denting logam pendek: beberapa nada yang tidak harmonis, mirip benda logam kecil
function playClink(when, freq, volume) {
  const ac = audioCtx;
  [1, 2.76, 5.4].forEach((ratio, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq * ratio;
    gain.gain.setValueAtTime(volume / (i + 1), when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.15 / (i + 1));
    osc.connect(gain).connect(masterOut);
    osc.start(when);
    osc.stop(when + 0.2);
  });
}

// Pin dicabut + tuas granat lepas
function playPinPull() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  playNoise({ when: now, duration: 0.05, type: 'highpass', freq: 3000, volume: 0.25 });
  playClink(now, 2200, 0.12);
  playClink(now + 0.12, 1700, 0.08);
}

// Granat dilempar: whoosh yang naik
function playThrowWhoosh() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  playNoise({ when: now, duration: 0.35, type: 'bandpass', freq: 300, sweepTo: 1400, q: 1.2, volume: 0.18, attack: 0.15 });
}

function playFile(src) {
  new Audio(src).play().catch(err => console.warn('Audio gagal diputar:', src, err));
}

function pickLine(kind) {
  const lines = VOICE_LINES[kind];
  return lines[Math.floor(Math.random() * lines.length)];
}

// Flashbang: ledakan keras lalu telinga berdenging
function playFlashBang() {
  if (SFX_FILES.flashBang) {
    playFile(SFX_FILES.flashBang);
    return;
  }
  if (!audioCtx) return;
  const ac = audioCtx;
  const now = ac.currentTime;
  playClink(now, 1100, 0.15);
  playNoise({ when: now + 0.04, duration: 0.08, type: 'highpass', freq: 2500, volume: 0.6 });
  playNoise({ when: now + 0.04, duration: 0.6, type: 'lowpass', freq: 1500, volume: 0.9 });
  playNoise({ when: now + 0.04, duration: 1.2, type: 'lowpass', freq: 180, volume: 0.5, attack: 0.02 });

  const ring = ac.createOscillator();
  const ringGain = ac.createGain();
  ring.frequency.value = 3600;
  ringGain.gain.setValueAtTime(0.0001, now + 0.1);
  ringGain.gain.exponentialRampToValueAtTime(0.06, now + 0.25);
  ringGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
  ring.connect(ringGain).connect(masterOut);
  ring.start(now + 0.1);
  ring.stop(now + 1.7);
}

// Callout agen: rekaman kamu (line.src), atau text-to-speech browser
function playVoice(line, radioClick) {
  if (radioClick && audioCtx) {
    // Bunyi "klik" radio sebelum bicara
    playNoise({ when: audioCtx.currentTime, duration: 0.08, type: 'bandpass', freq: 2000, q: 2, volume: 0.1 });
  }
  if (line.src) {
    playFile(line.src);
    return;
  }
  if (!VOICE_TTS || !('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(line.text);
  utterance.lang = 'en-US';
  utterance.rate = 1.15;
  utterance.pitch = 0.7;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

// ---- Animasi: agen jalan masuk, lempar granat (smoke / flashbang) ----
const FLASH_HOLD = 250; // layar tertutup penuh oleh flash (ms)
const FLASH_FADE = 750; // flash memudar; total flash = 1 detik

// Satu scene dipakai bersama oleh popup project dan tombol light/dark mode
let effectScene;
function getEffectScene() {
  if (effectScene === undefined) {
    effectScene = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? null : createSmokeScene();
  }
  return effectScene;
}

function createSmokeScene() {
  const canvas = document.createElement('canvas');
  canvas.title = 'Klik untuk skip';
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:9998;image-rendering:pixelated;display:none;cursor:pointer';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // Teks radio di pojok kiri atas, seperti chat tim di game
  const callout = document.createElement('div');
  callout.style.cssText = 'position:fixed;top:80px;left:16px;z-index:9997;font:600 13px/1.4 monospace;background:rgba(0,0,0,.65);padding:6px 10px;border-radius:4px;opacity:0;transition:opacity .3s;pointer-events:none';
  document.body.appendChild(callout);

  let W = 0;
  let H = 0;
  let raf = null;
  let run = null;

  function resize() {
    W = Math.ceil(window.innerWidth / PIXEL);
    H = Math.ceil(window.innerHeight / PIXEL);
    canvas.width = W;
    canvas.height = H;
    if (run) {
      run.cx = W / 2;
      run.cy = H / 2;
    }
  }
  window.addEventListener('resize', () => { if (run) resize(); });

  function spawnPuffs() {
    const spread = Math.max(W, H) * 0.45;
    // Di light mode smoke dibuat lebih gelap supaya tetap kelihatan
    const baseShade = document.documentElement.classList.contains('light') ? 120 : 170;
    return Array.from({ length: 70 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.sqrt(Math.random());
      return {
        dx: Math.cos(angle) * dist * spread,
        dy: Math.sin(angle) * dist * spread * 0.7,
        r: spread * (0.16 + Math.random() * 0.14),
        delay: dist * 500 + Math.random() * 200, // puff luar mengembang belakangan
        phase: Math.random() * Math.PI * 2,
        shade: baseShade + Math.floor(Math.random() * 50)
      };
    });
  }

  // Return true kalau smoke sudah hilang total
  function drawPuffs(now) {
    const sincePop = now - run.popAt;
    const fade = run.fadeAt ? clamp01((now - run.fadeAt) / FADE_MS) : 0;

    for (const p of run.puffs) {
      const grow = easeOut(clamp01((sincePop - p.delay) / 900));
      if (grow <= 0) continue;
      const x = run.cx + p.dx * grow + Math.sin(now / 1500 + p.phase) * 4;
      const y = run.cy + p.dy * grow + Math.cos(now / 1700 + p.phase) * 3;
      const r = p.r * (0.25 + 0.75 * grow) * (1 + fade * 0.4);
      const alpha = 0.5 * grow * (1 - fade);
      const rgb = `${p.shade},${p.shade + 4},${p.shade + 10}`;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
      gradient.addColorStop(0, `rgba(${rgb},${alpha})`);
      gradient.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    return fade >= 1;
  }

  function frame(now) {
    const t = now - run.start;
    ctx.clearRect(0, 0, W, H);

    // Agen 3D: jalan masuk -> lempar granat ke tengah layar -> balik badan dan keluar.
    // Kalau di-skip, agen & granat langsung hilang.
    if (run.stage && run.skipped) {
      run.stage.clear();
      run.stage = null;
    } else if (run.stage) {
      run.stage.render(t, window.innerWidth / 2, window.innerHeight / 2);
    }

    if (!run.popAt && (run.skipped || t >= run.popTime)) {
      if (run.kind === 'smoke') {
        run.popAt = run.skipped ? now - 1500 : now; // kalau di-skip, smoke langsung tebal
        run.puffs = spawnPuffs();
      } else {
        run.popAt = now;
        callout.style.opacity = '0';
        playFlashBang();
        run.onPop(); // ganti tema saat layar tertutup flash
      }
    }

    if (run.kind === 'smoke') {
      if (!run.opened && (run.skipped || t >= T_MODAL)) {
        run.opened = true;
        canvas.style.cursor = '';
        canvas.title = '';
        run.onReady();
      }
      if (run.popAt && drawPuffs(now)) {
        stop();
        return;
      }
    } else if (run.popAt) {
      // Flash: tertutup penuh sebentar, lalu memudar. Total 1 detik.
      const since = now - run.popAt;
      const alpha = since < FLASH_HOLD ? 1 : 1 - clamp01((since - FLASH_HOLD) / FLASH_FADE);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = run.flashColor;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      if (alpha <= 0) {
        stop();
        return;
      }
    }
    raf = requestAnimationFrame(frame);
  }

  function showCallout(team, text) {
    callout.innerHTML = `<span style="color:${team.color}">[${team.name}] Jeremy:</span> <span style="color:#fff">${text}</span>`;
    callout.style.opacity = '1';
  }

  function stop() {
    cancelAnimationFrame(raf);
    if (run) run.timers.forEach(clearTimeout);
    if (run && run.stage) run.stage.clear();
    raf = null;
    run = null;
    canvas.style.display = 'none';
    callout.style.opacity = '0';
  }

  function skip() {
    if (!run || run.opened) return;
    run.skipped = true;
    // Batalkan suara pin/lempar yang belum sempat bunyi
    run.timers.forEach(clearTimeout);
    callout.style.opacity = '0';
  }

  canvas.addEventListener('click', skip);

  // kind: 'smoke' (popup project) atau 'flash' (ganti tema)
  function start(kind, extra) {
    if (run) stop();
    // window.agentStage dipasang js/agents.js setelah model 3D siap. Belum siap = tanpa agen.
    const stage = window.agentStage || null;
    let teamKey = Math.random() < 0.5 ? 't' : 'ct';
    // model T belum ada -> stage memakai CT, teks radio ikut
    if (stage) teamKey = stage.begin(teamKey, kind, AGENT_TIMES[kind]);
    const team = TEAMS[teamKey];
    const popTime = kind === 'flash' ? JT.pop : T_POP;
    run = { kind, start: performance.now(), team, stage, cx: 0, cy: 0, popAt: 0, popTime, fadeAt: 0, puffs: [], skipped: false, opened: false, timers: [], ...extra };
    resize();

    const line = pickLine(kind);
    run.timers.push(
      setTimeout(() => { showCallout(team, line.text); playVoice(line, kind === 'flash'); }, kind === 'flash' ? JT.voice : T_VOICE),
      setTimeout(() => { callout.style.opacity = '0'; }, kind === 'smoke' ? T_MODAL + 800 : popTime)
    );
    // Smoke cuma pakai suara "Smoke out", tanpa efek pin / lemparan / ledakan
    if (kind === 'flash') {
      run.timers.push(
        setTimeout(playPinPull, T_WALK_END - 100),
        setTimeout(playThrowWhoosh, JT.release)
      );
    }

    canvas.style.display = 'block';
    canvas.style.cursor = 'pointer';
    canvas.title = 'Klik untuk skip';
    raf = requestAnimationFrame(frame);
  }

  return {
    // true selama animasi intro (sebelum popup muncul / selama flash)
    get busy() { return !!run && !run.opened; },
    // true selama ada animasi apa pun di layar
    get active() { return !!run; },

    play(onReady) {
      start('smoke', { onReady });
    },

    // color: '#ffffff' (ke light mode) atau '#000000' (ke dark mode)
    playFlash(color, onPop) {
      start('flash', { flashColor: color, onPop });
    },

    skip,

    dissipate() {
      if (run && !run.fadeAt) run.fadeAt = performance.now();
    }
  };
}

function initPortfolio() {
  const modal = document.getElementById('project-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalCategory = document.getElementById('modal-category');
  const modalDesc = document.getElementById('modal-desc');
  const gallery = document.getElementById('modal-gallery');
  const closeButton = document.getElementById('modal-close');

  if (!modal || !modalTitle || !modalCategory || !modalDesc || !gallery || !closeButton) {
    console.error('Portfolio modal: required HTML elements not found.');
    return;
  }

  const smoke = getEffectScene();
  let previousFocus = null;
  let hideTimer = null;

  function fillModal(project) {
    modalTitle.textContent = project.title;
    modalCategory.textContent = project.category;
    modalDesc.textContent = project.description;
    gallery.replaceChildren();

    project.images.forEach((imagePath, index) => {
      const container = document.createElement('div');
      container.className = 'modal-shot';

      const img = document.createElement('img');
      img.src = imagePath;
      img.alt = `${project.title} - Photo ${index + 1}`;
      img.loading = 'lazy';
      img.onerror = () => {
        img.onerror = null;
        const message = document.createElement('div');
        message.className = 'modal-shot-missing';
        message.textContent = `Foto tidak ditemukan: ${imagePath}`;
        img.replaceWith(message);
      };

      container.appendChild(img);
      gallery.appendChild(container);
    });
  }

  function showModal() {
    clearTimeout(hideTimer);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.setAttribute('aria-hidden', 'false');
    void modal.offsetWidth; // paksa reflow supaya transisi opacity jalan
    modal.classList.remove('opacity-0');
    closeButton.focus();
  }

  function openProjectModal(projectId) {
    const project = projectDetails[projectId];
    if (!project) {
      console.error('Project not found:', projectId);
      return;
    }
    if (smoke && smoke.busy) return;

    previousFocus = document.activeElement;
    fillModal(project);
    document.body.style.overflow = 'hidden';

    if (smoke) {
      unlockAudio();
      smoke.play(showModal);
    } else {
      showModal();
    }
  }

  function closeProjectModal() {
    if (modal.classList.contains('hidden')) return;
    modal.classList.add('opacity-0');
    modal.setAttribute('aria-hidden', 'true');
    if (smoke) smoke.dissipate();

    hideTimer = setTimeout(() => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.style.overflow = '';
    }, 500);

    if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
  }

  document.querySelectorAll('[data-project]').forEach(button => {
    button.addEventListener('click', () => openProjectModal(button.dataset.project));
  });

  closeButton.addEventListener('click', closeProjectModal);

  // Tutup kalau klik area gelap di luar popup
  modal.addEventListener('click', event => {
    if (event.target === modal) closeProjectModal();
  });

  // Escape: skip animasi kalau masih jalan, atau tutup popup
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (smoke && smoke.busy) smoke.skip();
    else closeProjectModal();
  });
}

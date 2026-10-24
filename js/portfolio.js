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
  }
};

// ---- Callout agen saat melempar granat ----
// Isi `src` dengan path file audio kamu sendiri, mis. 'sounds/flash.mp3'.
// Kalau `src` null, kalimatnya diucapkan text-to-speech browser (selama VOICE_TTS true).
// Tiap lemparan memilih satu kalimat secara acak.
const VOICE_LINES = {
  smoke: [
    { text: 'Smoke out!', src: null },
    { text: 'Throwing smoke!', src: null },
    { text: 'Deploying smoke!', src: null }
  ],
  flash: [
    // Voice line CS2 "Throwing flashbang", dipotong jadi kata "flashbang" saja
    { text: 'Flashbang!', src: 'sounds/flashbang-voice.mp3' }
  ]
};
const VOICE_TTS = true;
// Efek suara ledakan dari file (opsional), mis. 'sounds/flashbang.mp3'. null = suara sintetis di bawah
const SFX_FILES = {
  smokePop: null,
  flashBang: null
};

const PIXEL = 3; // 1 pixel canvas = 3 pixel layar, biar kelihatan pixel art
const SPRITE_W = 24;
const SPRITE_H = 32;

// Sprite 24x32 menghadap kanan, dirakit dari beberapa bagian (kepala, badan, lengan, kaki).
// Tiap huruf = warna di palette tim, '.' = transparan.
const HEADS = {
  // Teroris: balaclava hitam dengan celah mata
  t: [
    '........kkkkkk',
    '.......khhhhhhk',
    '......khhhhhhHhk',
    '......khhhhhhhHk',
    '......khhhssksSk',
    '......khhhhhhhhk',
    '......khhhhhhhhk',
    '.......khhhhhhk',
    '........kHhhhk'
  ],
  // Counter-teroris: helm, goggles, masker
  ct: [
    '........kkkkkk',
    '......kkhhhhhhkk',
    '.....khhhhhhhHHhk',
    '.....khhhhhhhhhhhk',
    '......khhkkkggggk',
    '......khhksskkkkk',
    '......kHMMMMMMMk',
    '.......kMMMMMMk',
    '........kMMMMk'
  ]
};

// Badan sambil pegang rifle di depan dada
const TORSO_HOLD = [
  '.......kjjjjjjjk',
  '......kjjvvvvvjjk',
  '.....kjjvVvvvVvjjk',
  '.....kjjvvvvvvvjjk',
  '.....kJjvVVvVVvjxk',
  '..kmmkJjvvvvkwwwwwwwk',
  '..kmmmkxxwwwWWWWwwwwwwwk',
  '..kmmkJjvvvkwmmkxxk',
  '.....kJjvvvkwmmk',
  '.....kJjjjjjkmk',
  '.....kVVVVVVVVk',
  '......kpppppppk'
];

// Badan saat melempar: rifle diselempang di punggung
const TORSO_THROW = [
  '..kw...kjjjjjjjk',
  '...kw.kjjvvvvvjjkk',
  '....kwjjvVvvvVvjjk',
  '.....kwjvvvvvvvjjk',
  '.....kJwvVVvVVvjjk',
  '.....kJjwvvvvvvjxk',
  '.....kJjvwvvvvvkxk',
  '.....kJjvvwvvvvk',
  '.....kJjvvvwvvvk',
  '.....kJjjjjjjk',
  '.....kVVVVVVVVk',
  '......kpppppppk'
];

// Lengan terangkat ke atas, dengan / tanpa granat di tangan
const ARM_NADE = [
  '..................kk',
  '.................kWWk',
  '.................knnk',
  '.................kxxk',
  '................kxxk',
  '................kjjk',
  '...............kjjk',
  '...............kjJk',
  '...............kjJk'
];
const ARM_EMPTY = ['', '', ''].concat(ARM_NADE.slice(3));

const LEGS_STAND = [
  '......kppPppppk',
  '......kpppkpppk',
  '......kpppkpppk',
  '......kpPpkpPpk',
  '......kpPpkpPpk',
  '......kpppkpppk',
  '......kpppkpppk',
  '......kPPPkPPPk',
  '......koookooook',
  '......kooookooook',
  '......kkkkkkkkkkk'
];

const LEGS_STRIDE = [
  '......kppPppppk',
  '.....kpppkkppppk',
  '.....kpppk.kpppk',
  '....kpPpk...kpPpk',
  '....kpPpk...kpPpk',
  '...kpppk.....kpppk',
  '...kpppk.....kpppk',
  '..kPPPk.......kPPPk',
  '..koook.......koooook',
  '.kooook.......kooooook',
  '.kkkkkk.......kkkkkkkk'
];

// Kaki ditekuk saat melompat (jumpthrow)
const LEGS_TUCK = [
  '......kppPppppk',
  '......kpppkpppk',
  '.....kpppk.kpppk',
  '....kpPpk...kpPpk',
  '...kpPpk.....kpppk',
  '...kpppk.....kPPPk',
  '...kpppk....koooook',
  '...kPPPk....kooooook',
  '...koooook..kkkkkkk',
  '...kooooook',
  '...kkkkkkkk'
];

// Tumpuk beberapa bagian jadi satu sprite. parts = [[barisAwal, rows], ...]
function buildSprite(parts) {
  const grid = Array.from({ length: SPRITE_H }, () => Array(SPRITE_W).fill('.'));
  for (const [top, rows] of parts) {
    rows.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) {
        if (row[c] !== '.') grid[top + r][c] = row[c];
      }
    });
  }
  return grid.map(row => row.join(''));
}

function buildTeamSprites(head) {
  return {
    walk1: buildSprite([[0, head], [9, TORSO_HOLD], [21, LEGS_STRIDE]]),
    walk2: buildSprite([[0, head], [9, TORSO_HOLD], [21, LEGS_STAND]]),
    throwNade: buildSprite([[0, head], [9, TORSO_THROW], [21, LEGS_STAND], [1, ARM_NADE]]),
    throwEmpty: buildSprite([[0, head], [9, TORSO_THROW], [21, LEGS_STAND], [1, ARM_EMPTY]]),
    jumpNade: buildSprite([[0, head], [9, TORSO_THROW], [21, LEGS_TUCK], [1, ARM_NADE]]),
    jumpEmpty: buildSprite([[0, head], [9, TORSO_THROW], [21, LEGS_TUCK], [1, ARM_EMPTY]])
  };
}

const TEAMS = {
  t: {
    name: 'T',
    color: '#e0b25a',
    sprites: buildTeamSprites(HEADS.t),
    palette: {
      k: '#0d0d0d', s: '#c68e5c', S: '#9c6a42',
      h: '#1f1f1f', H: '#3a3a3a',
      j: '#9a7b4f', J: '#6e5634', v: '#5b5236', V: '#3f3924',
      p: '#4f4a3c', P: '#38342a', o: '#2a2118', x: '#2b2b2b',
      w: '#262626', W: '#4a4a4a', m: '#8a5a2b', n: '#5b6b55'
    }
  },
  ct: {
    name: 'CT',
    color: '#7ea7e0',
    sprites: buildTeamSprites(HEADS.ct),
    palette: {
      k: '#0d0d0d', s: '#c68e5c', S: '#9c6a42',
      h: '#2b3444', H: '#4a5872', g: '#79b8d9', M: '#1e1e1e',
      j: '#2e3d55', J: '#1f2a3c', v: '#1c232e', V: '#2c3746',
      p: '#2a3445', P: '#1d2431', o: '#151515', x: '#161616',
      w: '#1f1f1f', W: '#474747', m: '#333333', n: '#5b6b55'
    }
  }
};

// Timeline animasi (ms sejak kartu diklik)
const T_WALK_END = 700;   // agen selesai jalan masuk
const T_THROW = 850;      // granat lepas dari tangan
const T_TURN = 1100;      // agen balik badan
const T_LEAVE_END = 1800; // agen sudah keluar layar
const T_POP = 1500;       // granat meledak jadi smoke
const T_MODAL = 2000;     // detail project muncul di dalam smoke
const FADE_MS = 900;      // durasi smoke hilang saat popup ditutup

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
const JUMP_HEIGHT = 16; // tinggi lompatan (pixel sprite)

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

// Granat jatuh, meledak pelan, lalu desis panjang
function playSmokePop() {
  if (SFX_FILES.smokePop) {
    playFile(SFX_FILES.smokePop);
    return;
  }
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  playClink(now, 1300, 0.18);
  playNoise({ when: now + 0.05, duration: 0.3, type: 'lowpass', freq: 700, volume: 0.6 });
  playNoise({ when: now + 0.05, duration: 2.5, type: 'lowpass', freq: 250, volume: 0.3, attack: 0.05 });
  playNoise({ when: now + 0.08, duration: 4.5, type: 'bandpass', freq: 3500, q: 0.7, volume: 0.22, attack: 0.06, flutter: 0.3 });
  playNoise({ when: now + 0.08, duration: 3.5, type: 'bandpass', freq: 1200, q: 0.8, volume: 0.12, attack: 0.1, flutter: 0.2 });
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
function playVoice(line) {
  if (audioCtx) {
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

  // Agen lebih besar di layar lebar, lebih kecil di HP
  function spriteScale() {
    return window.innerWidth >= 768 ? 2 : 1;
  }

  function drawSprite(frame, x, y, flip) {
    const rows = run.team.sprites[frame];
    const palette = run.palette;
    const scale = spriteScale();
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < rows[r].length; c++) {
        const color = palette[rows[r][c]];
        if (!color) continue;
        const col = flip ? SPRITE_W - 1 - c : c;
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x) + col * scale, Math.round(y) + r * scale, scale, scale);
      }
    }
  }

  function drawGrenade(x, y) {
    x = Math.round(x);
    y = Math.round(y);
    ctx.fillStyle = '#d4d4d4';
    ctx.fillRect(x - 1, y - 5, 2, 1);
    ctx.fillStyle = '#9a9a9a';
    ctx.fillRect(x - 2, y - 4, 4, 1);
    // Smoke: badan hijau. Flashbang: badan abu terang dengan sabuk gelap
    ctx.fillStyle = run.kind === 'flash' ? '#c9ccd1' : '#5b6b55';
    ctx.fillRect(x - 2, y - 3, 4, 6);
    if (run.kind === 'flash') {
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(x - 2, y, 4, 1);
    }
  }

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

  // Tinggi agen di atas tanah saat jumpthrow (pixel sprite, sebelum dikali scale)
  function jumpLift(t) {
    if (t <= JT.jump || t >= JT.land) return 0;
    return Math.sin(Math.PI * (t - JT.jump) / (JT.land - JT.jump)) * JUMP_HEIGHT;
  }

  // Jalan masuk -> pegang flash -> lompat & lempar di udara -> mendarat -> balik keluar
  function drawJumpThrow(t, standX, groundY, scale, spriteW) {
    if (t >= JT.leave) return;
    const step = Math.floor(t / 120) % 2 ? 'walk1' : 'walk2';
    const lift = jumpLift(t) * scale;

    // Bayangan di tanah, mengecil saat agen di udara
    if (t >= T_WALK_END && t < JT.turn) {
      const w = Math.round((14 - lift / scale / 3) * scale);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(Math.round(standX + 5 * scale + (14 * scale - w) / 2), groundY + SPRITE_H * scale - scale, w, scale);
    }

    if (t < T_WALK_END) {
      drawSprite(step, -spriteW + (standX + spriteW) * (t / T_WALK_END), groundY, false);
    } else if (t < JT.jump) {
      drawSprite('throwNade', standX, groundY, false);
    } else if (t < JT.land) {
      drawSprite(t < JT.release ? 'jumpNade' : 'jumpEmpty', standX, groundY - lift, false);
    } else if (t < JT.turn) {
      drawSprite('throwEmpty', standX, groundY, false);
    } else {
      const p = (t - JT.turn) / (JT.leave - JT.turn);
      drawSprite(step, standX - (standX + spriteW) * p, groundY, true);
    }
  }

  function frame(now) {
    const t = now - run.start;
    ctx.clearRect(0, 0, W, H);

    const scale = spriteScale();
    const spriteW = SPRITE_W * scale;
    const groundY = H - SPRITE_H * scale - 12;
    const standX = W * 0.12;

    // Agen: jalan masuk -> lempar -> balik badan dan keluar
    const showAgent = !run.skipped;
    if (showAgent && run.kind === 'flash') {
      drawJumpThrow(t, standX, groundY, scale, spriteW);
    } else if (showAgent && t < T_LEAVE_END) {
      const step = Math.floor(t / 120) % 2 ? 'walk1' : 'walk2';
      if (t < T_WALK_END) {
        drawSprite(step, -spriteW + (standX + spriteW) * (t / T_WALK_END), groundY, false);
      } else if (t < T_TURN) {
        drawSprite(t < T_THROW ? 'throwNade' : 'throwEmpty', standX, groundY, false);
      } else {
        const p = (t - T_TURN) / (T_LEAVE_END - T_TURN);
        drawSprite(step, standX - (standX + spriteW) * p, groundY, true);
      }
    }

    // Granat terbang melengkung dari tangan ke tengah layar
    const throwAt = run.kind === 'flash' ? JT.release : T_THROW;
    if (showAgent && t >= throwAt && t < run.popTime) {
      const p = (t - throwAt) / (run.popTime - throwAt);
      const sx = standX + 19 * scale;
      // jumpthrow: granat lepas dari tangan yang sedang di udara
      const sy = groundY + 2 * scale - (run.kind === 'flash' ? jumpLift(JT.release) * scale : 0);
      drawGrenade(sx + (run.cx - sx) * p, sy + (run.cy - sy) * p - Math.sin(Math.PI * p) * H * 0.3);
    }

    if (!run.popAt && (run.skipped || t >= run.popTime)) {
      if (run.kind === 'smoke') {
        run.popAt = run.skipped ? now - 1500 : now; // kalau di-skip, smoke langsung tebal
        run.puffs = spawnPuffs();
        playSmokePop();
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
    const team = Math.random() < 0.5 ? TEAMS.t : TEAMS.ct;
    // Granat di tangan agen ikut warna jenis granatnya
    const palette = kind === 'flash' ? { ...team.palette, n: '#c9ccd1' } : team.palette;
    const popTime = kind === 'flash' ? JT.pop : T_POP;
    run = { kind, start: performance.now(), team, palette, cx: 0, cy: 0, popAt: 0, popTime, fadeAt: 0, puffs: [], skipped: false, opened: false, timers: [], ...extra };
    resize();

    const line = pickLine(kind);
    run.timers.push(
      setTimeout(() => { showCallout(team, line.text); playVoice(line); }, kind === 'flash' ? JT.voice : T_WALK_END - 300),
      setTimeout(playPinPull, T_WALK_END - (kind === 'flash' ? 100 : 0)),
      setTimeout(playThrowWhoosh, kind === 'flash' ? JT.release : T_THROW),
      setTimeout(() => { callout.style.opacity = '0'; }, kind === 'smoke' ? T_MODAL + 800 : popTime)
    );

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

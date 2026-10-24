// ===== Interaksi halaman: loader, teks role, navbar, animasi scroll (GSAP) =====
document.documentElement.classList.add('js');

// ---- Loading screen: tunggu model 3D (event dari js/character.js) ----
const loader = document.getElementById('loader');
const loaderFill = document.getElementById('loader-fill');
const loaderPct = document.getElementById('loader-pct');
const loadStart = performance.now();
let progress = 0;
let loadingDone = false;

function setProgress(pct) {
  progress = Math.max(progress, Math.min(100, pct));
  loaderFill.style.width = progress + '%';
  loaderPct.textContent = Math.round(progress) + '%';
}

// Kalau server tidak kasih ukuran file, progress tetap jalan pelan sampai 90%
const creep = setInterval(() => {
  if (progress < 90) setProgress(progress + (90 - progress) * 0.06);
}, 120);

function finishLoading() {
  if (loadingDone) return;
  loadingDone = true;
  clearInterval(creep);
  setProgress(100);
  const wait = Math.max(0, 700 - (performance.now() - loadStart));
  setTimeout(() => {
    loader.classList.add('done');
    document.body.classList.add('loaded');
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }, wait);
}

// Browser memblokir suara sampai pengunjung klik / sentuh / tekan tombol (scroll tidak dihitung).
// Interaksi pertama apa pun di halaman langsung "membuka" audio.
function unlockOnFirstGesture() {
  if (typeof unlockAudio === 'function') unlockAudio();
  ['pointerdown', 'keydown', 'touchend'].forEach(type => window.removeEventListener(type, unlockOnFirstGesture));
}
['pointerdown', 'keydown', 'touchend'].forEach(type => window.addEventListener(type, unlockOnFirstGesture));

window.addEventListener('character:progress', e => setProgress(e.detail.pct * 0.95));
window.addEventListener('character:ready', finishLoading);
window.addEventListener('character:error', finishLoading);
setTimeout(finishLoading, 12000); // jaga-jaga kalau model lambat / CDN gagal

// ---- Teks role di landing bergantian ----
const roles = [
  ['Software', 'Engineer'],
  ['Full-Stack', 'Developer'],
  ['Mobile', 'Developer']
];
const roleEls = [document.getElementById('role-1'), document.getElementById('role-2')];
let roleIndex = 0;
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  setInterval(() => {
    roleIndex = (roleIndex + 1) % roles.length;
    roleEls.forEach((el, i) => {
      // baris kedua ganti sedikit belakangan, biar terasa berurutan
      setTimeout(() => {
        el.classList.add('swap');
        setTimeout(() => {
          el.textContent = roles[roleIndex][i];
          el.classList.remove('swap');
        }, 400);
      }, i * 150);
    });
  }, 3200);
}

// ---- Navbar: latar muncul setelah scroll ----
const nav = document.querySelector('.nav');
function updateNav() {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

// ---- Ikon tech stack (devicon / Font Awesome) ----
document.querySelectorAll('#tech-grid li').forEach(item => {
  if (item.dataset.icon) {
    const img = document.createElement('img');
    img.src = `https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/${item.dataset.icon}.svg`;
    img.alt = '';
    img.loading = 'lazy';
    item.prepend(img);
  } else if (item.dataset.fa) {
    const icon = document.createElement('i');
    icon.className = item.dataset.fa;
    icon.setAttribute('aria-hidden', 'true');
    item.prepend(icon);
  }
});

document.getElementById('year').textContent = new Date().getFullYear();

// Popup project + animasi smoke (js/portfolio.js)
if (typeof initPortfolio === 'function') initPortfolio();

// ---- About: agen 3D berpose berpikir (pegang dagu / jidat) selama section About di tengah layar ----
new IntersectionObserver(entries => {
  const pose = entries[0].isIntersecting ? 'think' : 'idle';
  window.dispatchEvent(new CustomEvent('character:pose', { detail: pose }));
}, { rootMargin: '-35% 0px -35% 0px' }).observe(document.getElementById('about'));

// ---- Animasi scroll ----
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);

  const character = document.getElementById('character');
  // Karakter yang sudah tidak kelihatan berhenti di-render (lihat js/character.js)
  const markHidden = () => character.classList.toggle('is-off', gsap.getProperty(character, 'opacity') < 0.02);

  const mm = gsap.matchMedia();

  mm.add('(min-width: 901px)', () => {
    // Landing -> About: karakter geser ke kiri, teks About di kanan
    gsap.to(character, {
      xPercent: -25,
      ease: 'none',
      scrollTrigger: { trigger: '#about', start: 'top bottom', end: 'center center', scrub: true }
    });
    // About -> What I Do: karakter naik dan menghilang
    gsap.to(character, {
      opacity: 0,
      yPercent: -12,
      ease: 'none',
      onUpdate: markHidden,
      scrollTrigger: { trigger: '#whatido', start: 'top 85%', end: 'top 30%', scrub: true }
    });

    // My Work: scroll ke bawah = kartu project bergeser ke samping
    const track = document.querySelector('.work-flex');
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: '#work',
        start: 'top top',
        end: () => '+=' + distance(),
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true
      }
    });
  });

  mm.add('(max-width: 900px)', () => {
    // HP: karakter cuma di landing, memudar saat mulai scroll
    gsap.to(character, {
      opacity: 0,
      ease: 'none',
      onUpdate: markHidden,
      scrollTrigger: { trigger: '#landing', start: 'top top', end: 'bottom 35%', scrub: true }
    });
  });

  // Elemen muncul dari bawah saat masuk layar
  gsap.utils.toArray('[data-reveal]').forEach(el => {
    gsap.from(el, {
      opacity: 0,
      y: 50,
      duration: 1,
      ease: 'power3.out',
      clearProps: 'transform',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  gsap.from('.tech-grid li', {
    opacity: 0,
    y: 24,
    duration: 0.6,
    ease: 'power2.out',
    stagger: 0.025,
    clearProps: 'transform',
    scrollTrigger: { trigger: '.tech-grid', start: 'top 85%', once: true }
  });

  // Garis timeline karier terisi mengikuti scroll
  gsap.fromTo('.career-timeline', { scaleY: 0 }, {
    scaleY: 1,
    ease: 'none',
    scrollTrigger: { trigger: '.career-info', start: 'top 70%', end: 'bottom 60%', scrub: true }
  });

  // Link navbar aktif sesuai section yang sedang dilihat
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
    const section = document.querySelector(link.getAttribute('href'));
    if (!section) return;
    ScrollTrigger.create({
      trigger: section,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: self => link.classList.toggle('active', self.isActive)
    });
  });

  // Gambar selesai dimuat = tinggi halaman berubah, hitung ulang posisi trigger
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

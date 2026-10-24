// laod semua ke index html jadi bisa langsung go live 
const sections = [
  { id: 'section-home',      file: 'sections/home.html' },
  { id: 'section-portfolio', file: 'sections/portfolio.html' },
  { id: 'section-services',  file: 'sections/services.html' },
  { id: 'section-about',     file: 'sections/about.html' },
  { id: 'section-contact',   file: 'sections/contact.html' },
];

async function loadSections() {
  for (const section of sections) {
    try {
      const res  = await fetch(`${section.file}?t=${Date.now()}`, { cache: 'no-cache' });
      const html = await res.text();
      document.getElementById(section.id).innerHTML = html;
    } catch (err) {
      console.error(`Gagal load ${section.file}:`, err);
    }
  }
  // Jalankan inisialisasi setelah semua section selesai dimuat
  initPage();
}

function initPage() {
  initPortfolio();
  initSkillBars();

  // ---- Portfolio Filter ----
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.project-card');
  const noResult = document.getElementById('no-result');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      filterBtns.forEach(b => {
        b.classList.remove('bg-accent', 'text-dark-nav');
        b.classList.add('bg-dark-section', 'text-gray-300');
      });
      btn.classList.add('bg-accent', 'text-dark-nav');
      btn.classList.remove('bg-dark-section', 'text-gray-300');

      let visible = 0;
      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.style.display = match ? 'block' : 'none';
        if (match) visible++;
      });
      if (noResult) noResult.classList.toggle('hidden', visible > 0);
    });
  });

  // ---- Contact Form ----
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = this.querySelector('button[type="submit"]');
      btn.innerHTML = '<i class="fas fa-spinner fa-spin text-xs"></i> Mengirim...';
      btn.disabled = true;
      setTimeout(() => {
        this.reset();
        this.classList.add('hidden');
        const msg = document.getElementById('success-msg');
        if (msg) msg.classList.remove('hidden');
      }, 1500);
    });
  }

  // ---- Active Nav on Scroll ----
  const navLinks = document.querySelectorAll('.nav-link');
  const sectionEls = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    let current = '';
    sectionEls.forEach(s => {
      if (window.scrollY >= s.offsetTop - 120) current = s.getAttribute('id');
    });
    navLinks.forEach(link => {
      const href = link.getAttribute('href')?.replace('#', '');
      link.classList.toggle('text-accent', href === current);
      link.classList.toggle('font-semibold', href === current);
      link.classList.toggle('text-gray-300', href !== current);
    });
  });
}

// Level skill (Advanced/Intermediate/Beginner) -> bar bersegmen ala HP bar di game
function initSkillBars() {
  const levels = { Advanced: 5, Intermediate: 3, Beginner: 2 };
  document.querySelectorAll('#skills-grid > div').forEach(card => {
    const label = card.querySelector('p:last-of-type');
    const filled = label && levels[label.textContent.trim()];
    if (!filled) return;
    const bar = document.createElement('div');
    bar.className = 'hp-bar';
    bar.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 5; i++) {
      const seg = document.createElement('span');
      if (i < filled) seg.className = 'on';
      bar.appendChild(seg);
    }
    label.classList.add('hud-level');
    label.after(bar);
  });
}

loadSections();

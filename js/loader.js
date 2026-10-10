/* =============================================
   LOADER - Load semua section ke index.html
   Edit bagian sections/ untuk tiap section-nya
   ============================================= */

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

// ==========================================
// DATA & FUNGSI POP-UP MODAL PROYEK
// ==========================================
const projectDetails = {
  'proj-1': {
    title: 'Sistem Informasi Kampus',
    category: 'Web App',
    categoryColor: 'bg-accent text-dark-nav',
    appUrl: 'https://demo-kampus.vercel.app',
    desc: 'Aplikasi web full-stack untuk mempermudah pengelolaan data civitas akademika, administrasi mahasiswa, jadwal mata kuliah, serta sistem input dan rekapitulasi nilai oleh dosen.',
    features: [
      'Autentikasi multi-role (Admin, Dosen, Mahasiswa)',
      'Manajemen Kartu Rencana Studi (KRS) online',
      'Rekapitulasi Indeks Prestasi (IPK) otomatis',
      'Ekspor laporan data ke PDF & Excel'
    ],
    tags: ['Laravel', 'MySQL', 'Tailwind CSS', 'PHP', 'Blade']
  },
  'proj-2': {
    title: 'Aplikasi To-Do List',
    category: 'Mobile App',
    categoryColor: 'bg-green-500 text-dark-nav',
    appUrl: 'https://github.com/jemimaa10/todolist-app',
    desc: 'Aplikasi mobile cross-platform berbasis Flutter untuk membantu produktivitas harian dengan sistem reminder pintar, kategori prioritas tugas, dan sinkronisasi cloud real-time.',
    features: [
      'Sinkronisasi real-time berbasis Firebase Firestore',
      'Notifikasi reminder lokal terjadwal',
      'Filter tugas berdasarkan prioritas (High, Med, Low)',
      'Dark mode & tampilan responsif'
    ],
    tags: ['Flutter', 'Firebase', 'Dart', 'Provider', 'Mobile']
  },
  'proj-3': {
    title: 'E-Commerce App Design',
    category: 'UI/UX',
    categoryColor: 'bg-orange-500 text-dark-nav',
    appUrl: 'https://figma.com/@jemimaa10',
    desc: 'Rancangan desain antarmuka toko online modern dengan user flow yang komprehensif, desain sistem komponen yang konsisten, serta prototipe interaktif siap uji coba di Figma.',
    features: [
      'Riset pengguna & Persona pemetaan masalah',
      'Wireframing low-fidelity & High-fidelity mockup',
      'Interactive prototype dengan micro-interaction',
      'Design system lengkap (Typography, Colors, Components)'
    ],
    tags: ['Figma', 'UI/UX', 'Prototyping', 'User Flow', 'Wireframing']
  }
};

window.openProjectModal = function(id) {
  const data = projectDetails[id];
  if (!data) return;

  const titleEl = document.getElementById('modal-title');
  if (titleEl) titleEl.textContent = data.title;

  const catEl = document.getElementById('modal-category');
  if (catEl) {
    catEl.textContent = data.category;
    catEl.className = `text-xs font-bold px-2.5 py-1 rounded ${data.categoryColor}`;
  }

  const urlEl = document.getElementById('modal-app-url');
  if (urlEl) urlEl.textContent = data.appUrl;

  const descEl = document.getElementById('modal-desc');
  if (descEl) descEl.textContent = data.desc;

  const demoBtn = document.getElementById('modal-demo-btn');
  if (demoBtn) demoBtn.href = data.appUrl;

  const featContainer = document.getElementById('modal-features');
  if (featContainer) {
    featContainer.innerHTML = data.features.map(f => 
      `<li class="flex items-start gap-2"><i class="fas fa-check-circle text-accent text-xs mt-0.5"></i><span>${f}</span></li>`
    ).join('');
  }

  const tagsContainer = document.getElementById('modal-tags');
  if (tagsContainer) {
    tagsContainer.innerHTML = data.tags.map(t => `<span class="tag">${t}</span>`).join('');
  }

  const modal = document.getElementById('project-modal');
  if (modal) {
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
    document.body.style.overflow = 'hidden';
  }
};

window.closeProjectModal = function() {
  const modal = document.getElementById('project-modal');
  if (!modal) return;
  modal.classList.add('opacity-0');
  setTimeout(() => {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }, 300);
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.closeProjectModal();
});

loadSections();

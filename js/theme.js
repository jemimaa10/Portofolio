// ===== Light / dark mode dengan animasi flashbang =====
// Dark -> light: agen lempar flashbang, layar jadi putih 1 detik.
// Light -> dark: flash hitam 1 detik.

function isLightTheme() {
  return document.documentElement.classList.contains('light');
}

function applyTheme(light) {
  document.documentElement.classList.toggle('light', light);
  try {
    localStorage.setItem('theme', light ? 'light' : 'dark');
  } catch (err) {
    // localStorage bisa diblokir (mode private), tema tetap jalan tanpa disimpan
  }
  document.querySelectorAll('.theme-toggle').forEach(button => {
    const icon = button.querySelector('i');
    icon.classList.toggle('fa-sun', !light);
    icon.classList.toggle('fa-moon', light);
    button.setAttribute('aria-label', light ? 'Ganti ke dark mode' : 'Ganti ke light mode');
  });
}

function toggleTheme() {
  const toLight = !isLightTheme();
  const scene = getEffectScene();

  // Tanpa animasi (setting "kurangi animasi" aktif): langsung ganti
  if (!scene) {
    applyTheme(toLight);
    return;
  }
  if (scene.active) return; // tunggu animasi sebelumnya selesai

  unlockAudio();
  scene.playFlash(toLight ? '#ffffff' : '#000000', () => applyTheme(toLight));
}

applyTheme(isLightTheme());
document.querySelectorAll('.theme-toggle').forEach(button => {
  button.addEventListener('click', toggleTheme);
});

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
  setSwitch(light);
}

// Posisi knob switch. Dipanggil langsung saat diklik, jadi knob sudah geser sebelum flash meledak.
function setSwitch(light) {
  document.querySelectorAll('.theme-toggle').forEach(button => {
    button.setAttribute('aria-checked', String(light));
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

  setSwitch(toLight);
  unlockAudio();
  scene.playFlash(toLight ? '#ffffff' : '#000000', () => applyTheme(toLight));
}

applyTheme(isLightTheme());
document.querySelectorAll('.theme-toggle').forEach(button => {
  button.addEventListener('click', toggleTheme);
});

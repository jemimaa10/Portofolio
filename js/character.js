// ===== Karakter 3D di landing page: kepala (dan mata) ikut arah cursor =====
// Model: "CTM_SAS | CS2 Agent Model" oleh Alex (Sketchfab, CC BY 4.0).
// Download versi GLB dari Sketchfab, lalu simpan sebagai assets/models/agent.glb

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { loadModel, cloneModel } from './models.js';

const MODEL_URL = 'assets/models/agent.glb';
// Kalau model menghadap ke samping / belakang, putar di sini (radian), mis. Math.PI atau Math.PI / 2
const MODEL_YAW = 0;
// Batas putaran kepala, biar tidak muter seperti burung hantu
const MAX_YAW = THREE.MathUtils.degToRad(55);
const MAX_PITCH = THREE.MathUtils.degToRad(28);
// Seberapa jauh bidang "titik lihat" di depan wajah (unit, tinggi model = 2)
const LOOK_DEPTH = 1.4;
// Pembagian putaran: leher sebagian, kepala sisanya, mata ikut sedikit lagi
const NECK_SHARE = 0.35;
const HEAD_SHARE = 0.65;
const EYE_SHARE = 0.35;
// Tangan lurus ke bawah, sedikit menjauh dari badan (naikkan kalau tangan menembus rompi)
const ARM_SPREAD = 0.2;
// Tinggi area yang kelihatan (unit dunia, tinggi model = 2). Lebih kecil = lebih zoom.
// 1.15 = kira-kira setengah badan
const VIEW_HEIGHT = { desktop: 1.15, mobile: 1.35 };

// Arah lengan saat diam (dilihat dari depan karakter).
// x dikali sisi tangan (+1 kanan layar, -1 kiri layar), y ke atas, z ke arah kamera.
const REST_ARM = { upper: [ARM_SPREAD, -1, 0.05], fore: [ARM_SPREAD * 0.6, -1, 0.15] };

// Pose berpikir di section About. Posisi pergelangan tangan relatif ke tulang kepala
// (di model SAS ada di tengah kepala; corong gas mask menonjol sampai ~0.19 ke depan).
// Unit dunia (tinggi model = 2), x dikali sisi tangan. `elbow` = arah siku menekuk.
// look = [menoleh, menunduk] kepala. Urutan: pegang dagu -> garuk kepala -> balik ke dagu.
const THINK = {
  // pergelangan di bawah dagu gas mask, jari menunjuk ke atas menyentuh dagu
  chin: { wrist: [0.05, -0.215, 0.14], elbow: [0.05, -1, 0.35], look: [-0.22, -0.12] },
  // siku diangkat ke samping, tangan di sisi atas kepala
  scratch: { wrist: [0.15, -0.01, -0.04], elbow: [1, -0.3, -0.2], look: [-0.12, 0.12] },
  // tangan satunya menyilang di perut, menopang siku tangan yang berpikir
  support: { wrist: [-0.1, -0.515, 0.15], elbow: [1, -0.4, 0.3] },
  chinMs: 3500,     // lama pegang dagu
  scratchMs: 3000,  // lama garuk kepala
  moveMs: 900,      // waktu pindah dagu <-> kepala
  scratchHz: 3.5,   // kecepatan gerakan garuk
  scratchSize: 0.014,
  blendSpeed: 2.2   // kecepatan masuk / keluar pose (makin besar makin cepat)
};

const container = document.getElementById('character');
const canvas = document.getElementById('character-canvas');
const errorBox = document.getElementById('character-error');

function emit(name, detail) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
} catch (err) {
  // Browser tanpa WebGL: halaman tetap jalan, cuma tanpa karakter
  console.warn('[character] WebGL tidak tersedia:', err);
  emit('character:error', { reason: 'webgl' });
}

if (renderer) start();

function start() {
  // HP & tablet: resolusi render dibatasi supaya ringan (layar kecil, beda ketajaman tidak kelihatan)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.matchMedia('(pointer: coarse)').matches ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 100);

  // Lampu utama dari depan-atas, lampu ungu dari belakang (rim light) seperti referensi
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(1.5, 3, 3);
  scene.add(key);
  scene.add(new THREE.HemisphereLight(0xd8c8ff, 0x0b080c, 0.7));
  const rim = new THREE.DirectionalLight(0xa87cff, 4);
  rim.position.set(-2, 2.5, -3);
  scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0xf2c0ff, 2.5);
  rim2.position.set(2.5, 1.5, -2.5);
  scene.add(rim2);

  const pivot = new THREE.Group();
  pivot.rotation.y = MODEL_YAW;
  scene.add(pivot);

  // Tulang-tulang yang digerakkan + rotasi awalnya
  const rig = { neck: null, head: null, eyes: [], arms: [], rest: new Map() };
  const headWorld = new THREE.Vector3(0, 1.75, 0);
  let loaded = false;

  // ---- Load model ----
  loadModel(MODEL_URL, xhr => {
    if (xhr.total) emit('character:progress', { pct: (xhr.loaded / xhr.total) * 100 });
  }).then(
    gltf => {
      setupModel(cloneModel(gltf));
      loaded = true;
      resize();
      emit('character:ready');
    },
    err => {
      console.error('[character] Gagal memuat model:', MODEL_URL, err);
      errorBox.innerHTML = 'Model 3D belum ditemukan.<br />Simpan file GLB dari Sketchfab sebagai <code>assets/models/agent.glb</code>, lalu buka lewat Live Server.';
      errorBox.hidden = false;
      emit('character:error', { reason: 'load' });
    }
  );

  function setupModel(model) {
    // Samakan ukuran: tinggi model jadi 2 unit, kaki di y = 0, tubuh di tengah
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    model.scale.setScalar(2 / size.y);
    box.setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.set(-center.x, -box.min.y, -center.z);
    pivot.add(model);

    const bones = [];
    model.traverse(obj => {
      if (obj.isBone) bones.push(obj);
      // Mesh yang ber-tulang kadang "hilang" saat kepala diputar kalau culling aktif
      if (obj.isMesh) obj.frustumCulled = false;
    });
    console.info('[character] Nama tulang di model:', bones.map(b => b.name));

    // Cari tulang berdasarkan nama. Lewati ujung tulang (head_end, headtop, nub)
    const skip = /end|nub|top|tip|twist|jaw|brow|lid|lash/i;
    const find = re => bones.find(b => re.test(b.name) && !skip.test(b.name));
    rig.head = find(/head/i);
    rig.neck = find(/neck/i);
    rig.eyes = bones.filter(b => /eye/i.test(b.name) && !skip.test(b.name));
    // Kalau leher bukan "atasan" kepala, abaikan supaya putaran tidak dobel aneh
    if (rig.neck && rig.head && !isAncestor(rig.neck, rig.head)) rig.neck = null;
    [rig.neck, rig.head, ...rig.eyes].forEach(b => b && rig.rest.set(b, b.quaternion.clone()));

    if (!rig.head) console.warn('[character] Tulang kepala tidak ketemu, seluruh badan yang akan menoleh.');

    pivot.updateMatrixWorld(true);
    if (rig.head) {
      rig.head.getWorldPosition(headWorld);
    } else {
      headWorld.set(0, 1.78, 0);
    }

    rig.arms = findArms(bones, skip);
    rig.arms.forEach(arm => {
      [arm.upper, arm.fore].forEach(b => rig.rest.set(b, b.quaternion.clone()));
      // Panjang lengan atas & bawah, dipakai untuk IK
      const a = arm.upper.getWorldPosition(new THREE.Vector3());
      const b = arm.fore.getWorldPosition(new THREE.Vector3());
      const c = arm.hand.getWorldPosition(new THREE.Vector3());
      arm.len1 = a.distanceTo(b);
      arm.len2 = b.distanceTo(c);
    });
    if (rig.arms.length) {
      console.info('[character] Lengan:', rig.arms.map(a => `${a.upper.name} > ${a.fore.name} > ${a.hand.name}`));
    } else {
      console.warn('[character] Tulang lengan tidak ketemu, pose tangan dan pose berpikir dilewati.');
    }
  }

  // Lengan atas, lengan bawah, dan tangan untuk sisi kiri & kanan.
  // Nama umum: arm_upper_L (Valve), mixamorigLeftArm (Mixamo), Bip01 L UpperArm, upper_arm.L (Blender)
  function findArms(bones, skip) {
    const upperRe = /upper.?arm|arm.?upper|mixamorig:?(left|right)arm(_\d+)?$/i;
    const foreRe = /fore.?arm|lower.?arm|arm.?lower/i;
    const handRe = /hand|wrist/i;
    const arms = [];
    for (const upper of bones) {
      if (!upperRe.test(upper.name) || skip.test(upper.name)) continue;
      const fore = firstDescendant(upper, foreRe, skip);
      const hand = fore && firstDescendant(fore, handRe, skip);
      if (!hand) continue;
      // Sisi dilihat dari kamera: x positif = kanan layar
      const side = Math.sign(upper.getWorldPosition(new THREE.Vector3()).x) || 1;
      if (arms.some(a => a.side === side)) continue;
      arms.push({ upper, fore, hand, side });
    }
    return arms;
  }

  function firstDescendant(root, re, skip) {
    let found = null;
    root.traverse(obj => {
      if (!found && obj !== root && obj.isBone && re.test(obj.name) && !skip.test(obj.name)) found = obj;
    });
    return found;
  }

  function isAncestor(parent, child) {
    for (let p = child.parent; p; p = p.parent) if (p === parent) return true;
    return false;
  }

  // ---- Kamera: setengah badan, dari kepala sampai perut ----
  function frameCamera(width, height) {
    camera.aspect = width / height;
    // sama dengan breakpoint layout HP / tablet portrait di css/main.css
    const mobile = window.matchMedia('(max-width: 900px), (max-width: 1199px) and (orientation: portrait)').matches;
    let visible = mobile ? VIEW_HEIGHT.mobile : VIEW_HEIGHT.desktop;
    // Layar sangat sempit: jaga supaya bahu tetap muat
    const minWidth = 0.9;
    if (visible * camera.aspect < minWidth) visible = minWidth / camera.aspect;
    const dist = visible / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    // kepala ada di sekitar 32% dari atas layar (HP: lebih ke bawah, teks ada di atas)
    const targetY = headWorld.y - visible * (mobile ? 0.15 : 0.18);
    camera.position.set(headWorld.x, targetY + 0.05, headWorld.z + dist);
    camera.lookAt(headWorld.x, targetY, headWorld.z);
    camera.updateProjectionMatrix();
  }

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    frameCamera(width, height);
  }
  new ResizeObserver(resize).observe(container);
  resize();

  // ---- Arah lihat dari posisi cursor ----
  const pointer = { x: 0, y: 0, active: false, lastMove: 0 };
  function onPointer(x, y) {
    pointer.x = x;
    pointer.y = y;
    pointer.active = true;
    pointer.lastMove = performance.now();
  }
  window.addEventListener('pointermove', e => onPointer(e.clientX, e.clientY), { passive: true });
  window.addEventListener('touchmove', e => {
    const t = e.touches[0];
    if (t) onPointer(t.clientX, t.clientY);
  }, { passive: true });
  document.addEventListener('mouseleave', () => { pointer.active = false; });

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const lookPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3();
  const look = { yaw: 0, pitch: 0, targetYaw: 0, targetPitch: 0 };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function updateTarget(now) {
    const idle = !pointer.active || now - pointer.lastMove > 4000;
    if (idle) {
      // Tidak ada gerakan cursor: lihat sekeliling pelan-pelan
      const t = now / 1000;
      look.targetYaw = reduceMotion ? 0 : Math.sin(t * 0.35) * 0.3;
      look.targetPitch = reduceMotion ? 0 : Math.sin(t * 0.27) * 0.06;
      return;
    }
    if (screenToPlane(pointer.x, pointer.y, LOOK_DEPTH, hit)) lookToward(hit);
  }

  // Titik layar (pixel CSS) -> titik 3D di bidang sejauh `depth` di depan wajah.
  // Pakai posisi canvas sekarang, karena canvas bisa bergeser saat scroll.
  function screenToPlane(x, y, depth, out) {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    lookPlane.constant = -(headWorld.z + depth);
    return raycaster.ray.intersectPlane(lookPlane, out);
  }

  function lookToward(point) {
    const dx = point.x - headWorld.x;
    const dy = point.y - headWorld.y;
    const dz = point.z - headWorld.z;
    look.targetYaw = THREE.MathUtils.clamp(Math.atan2(dx, dz), -MAX_YAW, MAX_YAW);
    // Euler X positif = menunduk, jadi cursor di atas => pitch negatif
    look.targetPitch = THREE.MathUtils.clamp(-Math.atan2(dy, Math.hypot(dx, dz)), -MAX_PITCH, MAX_PITCH);
  }

  // Putar tulang di ruang dunia, lalu ubah ke ruang lokal tulang.
  // Dengan begini arah sumbu tulang di file model tidak berpengaruh.
  const worldTurn = new THREE.Quaternion();
  const part = new THREE.Quaternion();
  const parentQ = new THREE.Quaternion();
  const parentInv = new THREE.Quaternion();
  const identity = new THREE.Quaternion();
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');

  function aimBone(bone, share) {
    if (!bone) return;
    part.slerpQuaternions(identity, worldTurn, share);
    bone.parent.getWorldQuaternion(parentQ);
    parentInv.copy(parentQ).invert();
    bone.quaternion.copy(parentInv).multiply(part).multiply(parentQ).multiply(rig.rest.get(bone));
  }

  // ---- Pose tangan: diam & berpikir ----
  const boneStart = new THREE.Vector3();
  const boneEnd = new THREE.Vector3();
  const dirNow = new THREE.Vector3();
  const swing = new THREE.Quaternion();

  // Putar tulang supaya arah pangkal -> ujungnya sama dengan `dir` (ruang dunia)
  function pointBone(bone, tip, dir) {
    const rest = rig.rest.get(bone);
    bone.quaternion.copy(rest);
    bone.parent.updateWorldMatrix(true, false);
    bone.updateMatrixWorld(true);
    bone.getWorldPosition(boneStart);
    tip.getWorldPosition(boneEnd);
    dirNow.subVectors(boneEnd, boneStart).normalize();
    swing.setFromUnitVectors(dirNow, dir);
    bone.parent.getWorldQuaternion(parentQ);
    parentInv.copy(parentQ).invert();
    bone.quaternion.copy(parentInv).multiply(swing).multiply(parentQ).multiply(rest);
    bone.updateMatrixWorld(true);
  }

  function sided(xyz, side, out) {
    return out.set(xyz[0] * side, xyz[1], xyz[2]);
  }

  // IK dua tulang: tekuk siku ke arah `pole` supaya pergelangan sampai di `target`
  const shoulder = new THREE.Vector3();
  const toTarget = new THREE.Vector3();
  const bend = new THREE.Vector3();
  const elbow = new THREE.Vector3();
  const upperDir = new THREE.Vector3();
  const foreDir = new THREE.Vector3();
  function reach(arm, target, pole) {
    arm.upper.getWorldPosition(shoulder);
    toTarget.subVectors(target, shoulder);
    const span = arm.len1 + arm.len2;
    const dist = THREE.MathUtils.clamp(toTarget.length(), Math.abs(arm.len1 - arm.len2) + 1e-3, span * 0.999);
    toTarget.normalize();
    // jarak bahu -> titik proyeksi siku, dan tinggi siku dari garis bahu-target
    const along = (arm.len1 * arm.len1 - arm.len2 * arm.len2 + dist * dist) / (2 * dist);
    const height = Math.sqrt(Math.max(0, arm.len1 * arm.len1 - along * along));
    bend.copy(pole).addScaledVector(toTarget, -pole.dot(toTarget)).normalize();
    elbow.copy(shoulder).addScaledVector(toTarget, along).addScaledVector(bend, height);
    upperDir.subVectors(elbow, shoulder).normalize();
    foreDir.copy(shoulder).addScaledVector(toTarget, dist).sub(elbow).normalize();
    pointBone(arm.upper, arm.fore, upperDir);
    pointBone(arm.fore, arm.hand, foreDir);
  }

  // Posisi pergelangan saat tangan lurus ke bawah (pose diam)
  function restWrist(arm, out) {
    arm.upper.getWorldPosition(out);
    out.addScaledVector(sided(REST_ARM.upper, arm.side, dirNow).normalize(), arm.len1);
    return out.addScaledVector(sided(REST_ARM.fore, arm.side, dirNow).normalize(), arm.len2);
  }

  // Titik di sekitar kepala (dagu / sisi kepala), ikut putaran kepala yang sedang menoleh
  const headTurn = new THREE.Quaternion();
  function nearHead(offset, side, out) {
    return sided(offset, side, out).applyQuaternion(headTurn).add(headWorld);
  }

  // weight: 0 = diam, 1 = berpikir penuh. scratch: 0 = pegang dagu, 1 = garuk kepala
  const think = { active: false, weight: 0, since: 0, scratch: 0 };
  window.addEventListener('character:pose', e => {
    const active = e.detail === 'think';
    if (active && !think.active) think.since = performance.now();
    think.active = active;
  });

  function scratchAmount(now) {
    const cycle = THINK.chinMs + THINK.scratchMs + 2 * THINK.moveMs;
    const t = (now - think.since) % cycle;
    if (t < THINK.chinMs) return 0;
    if (t < THINK.chinMs + THINK.moveMs) return THREE.MathUtils.smoothstep(t, THINK.chinMs, THINK.chinMs + THINK.moveMs);
    if (t < THINK.chinMs + THINK.moveMs + THINK.scratchMs) return 1;
    return 1 - THREE.MathUtils.smoothstep(t, cycle - THINK.moveMs, cycle);
  }

  const restPos = new THREE.Vector3();
  const posA = new THREE.Vector3();
  const posB = new THREE.Vector3();
  const pole = new THREE.Vector3();
  const poleB = new THREE.Vector3();
  const forward = new THREE.Vector3(0, 0, 1);

  const scratchWiggle = new THREE.Vector3();

  function updateArms(now) {
    if (!rig.arms.length) return;
    const thinker = rig.arms.find(a => a.side === 1) || rig.arms[0];
    const w = THREE.MathUtils.smoothstep(think.weight, 0, 1);
    const s = think.scratch;
    for (const arm of rig.arms) {
      restWrist(arm, restPos);
      if (arm === thinker) {
        nearHead(THINK.chin.wrist, arm.side, posA);
        nearHead(THINK.scratch.wrist, arm.side, posB);
        posA.lerp(posB, s);
        // pindah dagu <-> kepala lewat samping wajah, supaya tidak menembus filter gas mask
        posA.x += Math.sin(Math.PI * s) * 0.12 * arm.side;
        // gerakan garuk: lingkaran kecil, hanya saat tangan sudah di kepala
        if (s > 0.98 && !reduceMotion) {
          const phase = (now / 1000) * THINK.scratchHz * Math.PI * 2;
          posA.add(scratchWiggle.set(0, Math.sin(phase), Math.cos(phase)).multiplyScalar(THINK.scratchSize));
        }
        sided(THINK.chin.elbow, arm.side, pole).lerp(sided(THINK.scratch.elbow, arm.side, poleB), s);
      } else {
        sided(THINK.support.wrist, arm.side, posA).add(headWorld);
        sided(THINK.support.elbow, arm.side, pole);
      }
      // dari tangan lurus ke posisi berpikir, lewat depan badan (tidak menembus rompi)
      posA.lerpVectors(restPos, posA, w).addScaledVector(forward, Math.sin(Math.PI * w) * 0.22);
      sided([0.3, 0, -1], arm.side, poleB).lerp(pole, w);
      reach(arm, posA, poleB);
    }
  }

  function applyLook() {
    euler.set(look.pitch, look.yaw, 0);
    worldTurn.setFromEuler(euler);
    if (rig.head) {
      aimBone(rig.neck, rig.neck ? NECK_SHARE : 0);
      aimBone(rig.head, rig.neck ? HEAD_SHARE : 1);
      rig.eyes.forEach(eye => aimBone(eye, EYE_SHARE));
    } else {
      // Model tanpa tulang kepala: seluruh badan menoleh sedikit
      pivot.rotation.set(look.pitch * 0.3, MODEL_YAW + look.yaw * 0.5, 0);
    }
  }

  // ---- Loop render ----
  let last = performance.now();
  function tick(now) {
    requestAnimationFrame(tick);
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    // Berhenti render kalau karakter tidak kelihatan (sudah di-scroll lewat)
    if (!loaded || document.hidden || container.classList.contains('is-off')) return;

    updateTarget(now);
    // Masuk / keluar pose berpikir pelan-pelan
    think.weight = THREE.MathUtils.clamp(think.weight + (think.active ? dt : -dt) * THINK.blendSpeed, 0, 1);
    if (think.weight > 0) {
      think.scratch = scratchAmount(now);
      const w = THREE.MathUtils.smoothstep(think.weight, 0, 1);
      const sway = reduceMotion ? 0 : Math.sin(now / 1000 * 0.6) * 0.04;
      const yaw = THREE.MathUtils.lerp(THINK.chin.look[0], THINK.scratch.look[0], think.scratch) + sway;
      const pitch = THREE.MathUtils.lerp(THINK.chin.look[1], THINK.scratch.look[1], think.scratch);
      look.targetYaw = THREE.MathUtils.lerp(look.targetYaw, yaw, w);
      look.targetPitch = THREE.MathUtils.lerp(look.targetPitch, pitch, w);
    }
    const ease = 1 - Math.exp(-dt * 7);
    look.yaw += (look.targetYaw - look.yaw) * ease;
    look.pitch += (look.targetPitch - look.pitch) * ease;
    euler.set(look.pitch, look.yaw, 0);
    headTurn.setFromEuler(euler);
    updateArms(now);
    applyLook();

    // Napas halus supaya karakter tidak terlihat kaku
    if (!reduceMotion) pivot.position.y = Math.sin(now / 1000 * 1.6) * 0.006;

    renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);
}

// ===== Agen 3D untuk animasi lempar granat (smoke project & flashbang tema) =====
// Menggantikan sprite pixel. Model tidak punya animasi, jadi jalan / lempar / lompat
// digerakkan langsung lewat tulang (IK lengan & kaki), sama seperti pose di js/character.js.
// Timeline (kapan jalan, lempar, balik badan) tetap diatur js/portfolio.js.
// Setelah siap, modul ini memasang window.agentStage untuk dipakai portfolio.js.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { loadModel, cloneModel } from './models.js';

// Model agen per tim. `yaw` = koreksi arah kalau model tidak menghadap ke depan (radian).
// Kalau agent-t.glb belum ada, tim T otomatis pakai model CT.
const AGENTS = {
  ct: { url: 'assets/models/agent.glb', yaw: 0 },
  t: { url: 'assets/models/agent-t.glb', yaw: 0 }
};
// Model granat. url null / file belum ada = granat sederhana buatan kode.
// `rotation` [x, y, z] (radian): putar sampai sisi panjang granat tegak (sumbu Y), tuas di atas.
const GRENADES = {
  flash: { url: 'assets/models/flashbang.glb', rotation: [0, 0, 0] },
  smoke: { url: null, rotation: [0, 0, 0] }
};

const FACE_YAW = 0.95;     // menghadap kanan, sedikit serong ke kamera (3/4)
const GRENADE_SIZE = 0.085; // panjang granat relatif tinggi agen
const JUMP_HEIGHT = 0.2;    // tinggi jumpthrow relatif tinggi agen
const THROW_MS = 170;       // lama ayunan tangan saat melempar
const GROUND = 16;          // jarak kaki dari bawah layar (px)

function agentHeight() {
  const h = window.innerHeight;
  return window.innerWidth >= 768 ? Math.min(h * 0.46, 440) : Math.min(h * 0.32, 260);
}

const clamp01 = x => Math.max(0, Math.min(1, x));
const smooth = (t, a, b) => THREE.MathUtils.smoothstep(t, a, b);
const ease = x => 1 - Math.pow(1 - x, 3);
// Naik lalu turun lagi antara a dan b
const bump = (t, a, b) => (t > a && t < b ? Math.sin(Math.PI * (t - a) / (b - a)) : 0);

const canvas = document.createElement('canvas');
canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:9997;pointer-events:none;display:none';
document.body.appendChild(canvas);

let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
} catch (err) {
  console.warn('[agents] WebGL tidak tersedia, animasi granat jalan tanpa agen:', err);
}
if (renderer) setup();

function setup() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.matchMedia('(pointer: coarse)').matches ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.6;

  // Kamera ortografis: 1 unit = 1 pixel CSS, (0, 0) di kiri bawah layar
  const camera = new THREE.OrthographicCamera(0, 1, 1, 0, 1, 6000);
  camera.position.z = 3000;

  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(1, 2, 3);
  scene.add(key);
  scene.add(new THREE.HemisphereLight(0xd8c8ff, 0x0b080c, 0.8));
  const rim = new THREE.DirectionalLight(0xa87cff, 3);
  rim.position.set(-2, 2.5, -3);
  scene.add(rim);

  const shadow = makeShadow();
  scene.add(shadow);

  const agents = {};
  const grenades = { flash: makeGrenade('flash'), smoke: makeGrenade('smoke') };
  Object.values(grenades).forEach(g => scene.add(g));

  let size = { w: 0, h: 0 };
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w === size.w && h === size.h) return;
    size = { w, h };
    renderer.setSize(w, h, false);
    camera.right = w;
    camera.top = h;
    camera.updateProjectionMatrix();
  }

  // ---- Model ----
  const skip = /end|nub|top|tip|twist|jaw|brow|lid|lash|offset|ik|target|jiggle|weapon|finger|meta/i;

  function prepareAgent(gltf, cfg) {
    const model = cloneModel(gltf);
    // inner: tinggi model = 1 unit, kaki di y = 0, menghadap +Z. root: posisi, skala & arah di layar
    const inner = new THREE.Group();
    inner.rotation.y = cfg.yaw;
    inner.add(model);
    const box = new THREE.Box3().setFromObject(inner);
    inner.scale.setScalar(1 / box.getSize(new THREE.Vector3()).y);
    box.setFromObject(inner);
    const center = box.getCenter(new THREE.Vector3());
    inner.position.set(-center.x, -box.min.y, -center.z);

    const root = new THREE.Group();
    root.add(inner);
    root.visible = false;
    root.updateMatrixWorld(true);

    const bones = [];
    model.traverse(obj => {
      if (obj.isBone) bones.push(obj);
      if (obj.isMesh) obj.frustumCulled = false;
    });

    const agent = {
      root,
      arms: findLimbs(bones, /upper.?arm|arm.?upper|mixamorig:?(left|right)arm(_\d+)?$/i, /fore.?arm|lower.?arm|arm.?lower/i, /hand|wrist/i),
      legs: findLimbs(bones, /leg.?upper|upper.?leg|up.?leg|thigh/i, /leg.?lower|lower.?leg|calf|shin|(left|right)leg$/i, /ankle|foot/i),
      spine: null,
      rest: new Map()
    };
    const spines = bones.filter(b => /spine/i.test(b.name) && !skip.test(b.name));
    agent.spine = spines[Math.floor(spines.length / 2)] || null;

    [...agent.arms, ...agent.legs].forEach(limb => {
      rememberRest(agent, limb.upper);
      rememberRest(agent, limb.lower);
    });
    rememberRest(agent, agent.spine);
    // Sisi kanan karakter (x negatif saat menghadap kamera) yang melempar
    agent.throwArm = agent.arms.find(a => a.side < 0) || null;
    agent.aimArm = agent.arms.find(a => a.side > 0) || null;

    if (agent.arms.length < 2 || agent.legs.length < 2) {
      console.warn('[agents] Tulang lengan/kaki tidak lengkap di', cfg.url, '- gerakan sebagian dilewati.');
    }
    scene.add(root);
    return agent;
  }

  function rememberRest(agent, bone) {
    if (bone) agent.rest.set(bone, bone.quaternion.clone());
  }

  // Tiga tulang berurutan (pangkal > tengah > ujung) untuk sisi kiri & kanan.
  // side +1 = kiri karakter (kanan layar saat menghadap kamera), -1 = kanan karakter.
  function findLimbs(bones, upperRe, lowerRe, endRe) {
    const limbs = [];
    for (const upper of bones) {
      if (!upperRe.test(upper.name) || skip.test(upper.name)) continue;
      const lower = firstDescendant(upper, lowerRe);
      const end = lower && firstDescendant(lower, endRe);
      if (!end) continue;
      const a = upper.getWorldPosition(new THREE.Vector3());
      const b = lower.getWorldPosition(new THREE.Vector3());
      const c = end.getWorldPosition(new THREE.Vector3());
      const side = Math.sign(a.x) || 1;
      if (limbs.some(l => l.side === side)) continue;
      limbs.push({ upper, lower, end, side, len1: a.distanceTo(b), len2: b.distanceTo(c) });
    }
    return limbs;
  }

  function firstDescendant(root, re) {
    let found = null;
    root.traverse(obj => {
      if (!found && obj !== root && obj.isBone && re.test(obj.name) && !skip.test(obj.name)) found = obj;
    });
    return found;
  }

  // Granat ukuran 1 (sisi terpanjang), titik tengah di (0, 0, 0), memanjang di sumbu Y
  function makeGrenade(kind) {
    const holder = new THREE.Group();
    holder.visible = false;
    const metal = color => new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.45 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.72, 20), metal(kind === 'flash' ? 0xc9ccd1 : 0x5b6b55));
    body.position.y = -0.1;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.2, 14), metal(0x9a9a9a));
    cap.position.y = 0.36;
    const spoon = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.06), metal(0xb5b5b5));
    spoon.position.set(0.28, 0.1, 0);
    const fallback = new THREE.Group();
    fallback.add(body, cap, spoon);
    if (kind === 'flash') {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.265, 0.265, 0.08, 20), metal(0x3a3a3a));
      band.position.y = -0.1;
      fallback.add(band);
    }
    holder.add(fallback);
    return holder;
  }

  // Ganti granat buatan kode dengan file GLB kalau ada
  function loadGrenade(kind) {
    const cfg = GRENADES[kind];
    if (!cfg.url) return;
    loadModel(cfg.url).then(gltf => {
      const inner = new THREE.Group();
      inner.rotation.set(...cfg.rotation);
      inner.add(cloneModel(gltf));
      const box = new THREE.Box3().setFromObject(inner);
      const dims = box.getSize(new THREE.Vector3());
      inner.scale.setScalar(1 / Math.max(dims.x, dims.y, dims.z));
      box.setFromObject(inner);
      inner.position.sub(box.getCenter(new THREE.Vector3()));
      inner.traverse(obj => { if (obj.isMesh) obj.frustumCulled = false; });
      const holder = grenades[kind];
      holder.clear();
      holder.add(inner);
    }, () => console.info(`[agents] ${cfg.url} belum ada, pakai granat sederhana.`));
  }

  // Bayangan lonjong di bawah kaki
  function makeShadow() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })
    );
    mesh.position.z = -800; // di belakang agen, jadi kaki menutupinya
    return mesh;
  }

  // ---- Menggerakkan tulang ----
  const parentQ = new THREE.Quaternion();
  const parentInv = new THREE.Quaternion();
  const boneStart = new THREE.Vector3();
  const boneEnd = new THREE.Vector3();
  const dirNow = new THREE.Vector3();
  const swing = new THREE.Quaternion();

  // Putar tulang supaya arah pangkal -> ujungnya sama dengan `dir` (ruang dunia)
  function pointBone(agent, bone, tip, dir) {
    const rest = agent.rest.get(bone);
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

  // IK dua tulang. offset & pole dalam ruang agen (x = kiri karakter, y = atas, z = depan),
  // offset dihitung dari pangkal tulang, satuan = tinggi agen.
  const base = new THREE.Vector3();
  const target = new THREE.Vector3();
  const pole = new THREE.Vector3();
  const toTarget = new THREE.Vector3();
  const bend = new THREE.Vector3();
  const mid = new THREE.Vector3();
  const upperDir = new THREE.Vector3();
  const lowerDir = new THREE.Vector3();
  function reach(agent, limb, offset, poleLocal) {
    const s = agent.root.scale.x;
    const q = agent.root.quaternion;
    limb.upper.getWorldPosition(base);
    target.copy(offset).applyQuaternion(q).multiplyScalar(s).add(base);
    pole.copy(poleLocal).applyQuaternion(q);

    const len1 = limb.len1 * s;
    const len2 = limb.len2 * s;
    toTarget.subVectors(target, base);
    const dist = THREE.MathUtils.clamp(toTarget.length(), Math.abs(len1 - len2) + 1e-3, (len1 + len2) * 0.999);
    toTarget.normalize();
    const along = (len1 * len1 - len2 * len2 + dist * dist) / (2 * dist);
    const height = Math.sqrt(Math.max(0, len1 * len1 - along * along));
    bend.copy(pole).addScaledVector(toTarget, -pole.dot(toTarget));
    if (bend.lengthSq() < 1e-8) bend.set(0, 0, -1).applyQuaternion(q);
    bend.normalize();
    mid.copy(base).addScaledVector(toTarget, along).addScaledVector(bend, height);
    upperDir.subVectors(mid, base).normalize();
    lowerDir.copy(base).addScaledVector(toTarget, dist).sub(mid).normalize();
    pointBone(agent, limb.upper, limb.lower, upperDir);
    pointBone(agent, limb.lower, limb.end, lowerDir);
  }

  // Condong (maju +) dan putar badan (bahu kanan ke depan +) di tulang punggung
  const axis = new THREE.Vector3();
  const turnQ = new THREE.Quaternion();
  const leanQ = new THREE.Quaternion();
  function bendSpine(agent, lean, twist) {
    const bone = agent.spine;
    if (!bone) return;
    const q = agent.root.quaternion;
    turnQ.setFromAxisAngle(axis.set(0, 1, 0), twist);
    leanQ.setFromAxisAngle(axis.set(1, 0, 0).applyQuaternion(q), lean);
    turnQ.premultiply(leanQ);
    bone.parent.updateWorldMatrix(true, false);
    bone.parent.getWorldQuaternion(parentQ);
    parentInv.copy(parentQ).invert();
    bone.quaternion.copy(parentInv).multiply(turnQ).multiply(parentQ).multiply(agent.rest.get(bone));
  }

  // ---- Pose per waktu ----
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  const tmpA = new THREE.Vector3();
  const tmpB = new THREE.Vector3();
  const tmpU = new THREE.Vector3();

  // Tangan menggantung, ikut berayun saat jalan (sw -1..1)
  function armHang(arm, sw, out) {
    tmpU.set(arm.side * 0.18, -1, sw * 0.45).normalize().multiplyScalar(arm.len1);
    return out.set(arm.side * 0.1, -1, sw * 0.45 + 0.5).normalize().multiplyScalar(arm.len2).add(tmpU);
  }
  function armAt(arm, x, y, z, out) {
    return out.set(arm.side * x, y, z).normalize().multiplyScalar((arm.len1 + arm.len2) * 0.92);
  }

  let run = null;

  function poseAt(t) {
    const { agent, times: T } = run;
    const { w, h } = size;
    const s = agentHeight();
    const halfW = s * 0.35;
    const standX = Math.max(w * 0.12, halfW + 16);
    const leaveStart = T.turn + 120;

    // Posisi & jarak tempuh (untuk langkah kaki)
    let x;
    let walked;
    if (t < T.walkEnd) {
      x = -halfW + (standX + halfW) * (t / T.walkEnd);
      walked = x + halfW;
    } else {
      const p = clamp01((t - leaveStart) / (T.leave - leaveStart));
      x = standX - (standX + halfW * 1.3) * p;
      walked = standX - x;
    }
    const walkW = t < T.walkEnd ? 1 - smooth(t, T.walkEnd - 80, T.walkEnd) : smooth(t, leaveStart - 60, leaveStart + 60);
    const legLen = agent.legs.length ? agent.legs[0].len1 + agent.legs[0].len2 : 0.48;
    const stride = legLen * 0.3;
    const phase = (walked / s) / (2 * stride) * Math.PI;

    // Lompat (hanya flashbang)
    let lift = 0;
    let tuck = 0;
    let crouch = 0;
    if (T.jump) {
      tuck = bump(t, T.jump, T.land);
      lift = tuck * JUMP_HEIGHT;
      crouch = Math.max(bump(t, T.jump - 140, T.jump), bump(t, T.land, T.land + 160));
    }
    const drop = crouch * 0.05 + walkW * 0.012 * Math.abs(Math.sin(phase));

    const root = agent.root;
    root.scale.setScalar(s);
    root.rotation.set(0, THREE.MathUtils.lerp(FACE_YAW, -FACE_YAW, smooth(t, T.turn, T.turn + 220)), 0);
    root.position.set(x, GROUND + (lift - drop) * s, 0);
    root.updateMatrixWorld(true);

    // Lempar: angkat tangan -> ayun ke depan -> balik ke samping badan
    const wind = smooth(t, T.walkEnd - 200, T.walkEnd + 60);
    const throwP = clamp01((t - T.release) / THROW_MS);
    const back = smooth(t, T.release + THROW_MS + 60, T.turn + 150);
    let lean;
    let twist;
    if (t < T.release) {
      lean = -0.1 * wind;
      twist = -0.35 * wind;
    } else {
      lean = THREE.MathUtils.lerp(-0.1, 0.22, ease(throwP)) * (1 - back);
      twist = THREE.MathUtils.lerp(-0.35, 0.3, ease(throwP)) * (1 - back);
    }
    [...agent.arms, ...agent.legs].forEach(l => {
      l.upper.quaternion.copy(agent.rest.get(l.upper));
      l.lower.quaternion.copy(agent.rest.get(l.lower));
    });
    bendSpine(agent, lean, twist);

    for (const leg of agent.legs) {
      const ph = phase + (leg.side > 0 ? 0 : Math.PI);
      const walk = tmpA.set(leg.side * 0.02, -0.97 * legLen + Math.max(0, Math.cos(ph)) * 0.12 * legLen, Math.sin(ph) * stride);
      // kaki kiri di depan saat berdiri melempar
      const stand = tmpB.set(leg.side * 0.04, -0.985 * legLen, (leg.side > 0 ? 0.1 : -0.1) * legLen);
      const foot = stand.lerp(walk, walkW);
      foot.lerp(v(leg.side * 0.05, -0.6 * legLen, (leg.side > 0 ? 0.05 : -0.12) * legLen), tuck);
      foot.y += drop;
      reach(agent, leg, foot, v(0, tuck * 0.3, 1));
    }

    const swingOf = arm => {
      const leg = agent.legs.find(l => l.side === arm.side);
      return leg ? -Math.sin(phase + (leg.side > 0 ? 0 : Math.PI)) * walkW : 0;
    };
    if (agent.throwArm) {
      const arm = agent.throwArm;
      const hang = armHang(arm, swingOf(arm), v(0, 0, 0));
      const windup = armAt(arm, 0.3, 0.5, -0.45, v(0, 0, 0));
      const follow = armAt(arm, -0.3, -0.3, 0.8, v(0, 0, 0));
      let hand;
      let elbow;
      if (t < T.release) {
        hand = hang.lerp(windup, wind);
        elbow = v(arm.side * 0.3, 0, -1).lerp(v(arm.side, -0.4, -0.2), wind);
      } else {
        // tangan lewat atas kepala saat mengayun
        const arc = (arm.len1 + arm.len2) * Math.sin(Math.PI * throwP);
        hand = windup.lerp(follow, ease(throwP)).add(v(0, 0.45 * arc, 0.25 * arc)).lerp(hang, back);
        elbow = v(arm.side, -0.4, -0.2).lerp(v(arm.side * 0.3, 0, -1), back);
      }
      reach(agent, arm, hand, elbow);
    }
    if (agent.aimArm) {
      // tangan satunya menunjuk ke arah lemparan
      const arm = agent.aimArm;
      const hang = armHang(arm, swingOf(arm), v(0, 0, 0));
      const aim = armAt(arm, 0.15, 0.2, 1, v(0, 0, 0));
      const k = t < T.release ? wind : 1 - smooth(t, T.release + 40, T.turn + 150);
      reach(agent, arm, hang.lerp(aim, k), v(arm.side * 0.3, 0, -1).lerp(v(arm.side, -0.6, 0), k));
    }

    shadow.position.x = x;
    shadow.position.y = GROUND + s * 0.005;
    const shrink = 1 - (lift / JUMP_HEIGHT) * 0.5;
    shadow.scale.set(s * 0.34 * shrink, s * 0.05 * shrink, 1);
    shadow.material.opacity = 0.4 * shrink;

    return { s, holding: wind > 0.3 && t < T.release };
  }

  // Posisi granat di genggaman, memanjang searah lengan bawah
  const handPos = new THREE.Vector3();
  const forePos = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  function grenadeInHand(grenade, s) {
    const arm = run.agent.throwArm;
    if (!arm) return false;
    arm.end.getWorldPosition(handPos);
    arm.lower.getWorldPosition(forePos);
    dirNow.subVectors(handPos, forePos).normalize();
    grenade.position.copy(handPos).addScaledVector(dirNow, s * 0.035);
    grenade.position.z += s * 0.05;
    grenade.quaternion.setFromUnitVectors(up, dirNow);
    return true;
  }

  const stage = {
    // Tim yang dipakai bisa beda dari permintaan kalau modelnya belum ada (mis. T belum didownload)
    begin(team, kind, times) {
      const used = agents[team] ? team : 'ct';
      Object.values(agents).forEach(a => { a.root.visible = false; });
      Object.values(grenades).forEach(g => { g.visible = false; });
      run = { agent: agents[used], grenade: grenades[kind], times, from: null };
      run.agent.root.visible = true;
      shadow.visible = true;
      resize();
      canvas.style.display = 'block';
      return used;
    },

    // t = ms sejak animasi mulai, cx/cy = titik ledak granat (pixel CSS dari kiri atas)
    render(t, cx, cy) {
      if (!run) return;
      resize();
      const T = run.times;
      const grenade = run.grenade;

      if (t >= T.release && !run.from) {
        // titik awal lemparan = posisi granat di tangan tepat saat dilepas
        const { s } = poseAt(T.release);
        grenadeInHand(grenade, s);
        run.from = grenade.position.clone();
      }

      const agentGone = t >= T.leave;
      run.agent.root.visible = !agentGone;
      shadow.visible = !agentGone;
      const { s, holding } = poseAt(Math.min(t, T.leave));
      grenade.scale.setScalar(s * GRENADE_SIZE);

      if (t < T.release) {
        grenade.visible = holding && grenadeInHand(grenade, s);
      } else if (t < T.pop) {
        const p = (t - T.release) / (T.pop - T.release);
        grenade.visible = true;
        grenade.position.lerpVectors(run.from, tmpA.set(cx, size.h - cy, 300), p);
        grenade.position.y += Math.sin(Math.PI * p) * size.h * 0.3;
        grenade.rotation.set(p * 14, 0, p * 9);
      } else {
        grenade.visible = false;
      }

      renderer.render(scene, camera);
    },

    clear() {
      run = null;
      canvas.style.display = 'none';
    }
  };

  // CT wajib ada (dipakai juga di landing). T & granat dimuat setelahnya di latar belakang.
  loadModel(AGENTS.ct.url).then(gltf => {
    agents.ct = prepareAgent(gltf, AGENTS.ct);
    window.agentStage = stage;
    Object.keys(GRENADES).forEach(loadGrenade);
    loadModel(AGENTS.t.url).then(
      t => { agents.t = prepareAgent(t, AGENTS.t); },
      () => console.info(`[agents] ${AGENTS.t.url} belum ada, tim T pakai model CT dulu.`)
    );
  }, err => console.warn('[agents] Model agen gagal dimuat, animasi granat jalan tanpa agen:', err));
}

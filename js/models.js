// ===== Loader model GLB bersama =====
// Satu file cukup didownload & di-parse sekali, walaupun dipakai karakter landing dan agen animasi.
// Tiap pemakai ambil salinannya sendiri lewat cloneModel(), supaya pose satu tidak mengganggu yang lain.

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const loader = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
loader.setDRACOLoader(draco);

const cache = new Map();

// onProgress hanya dipakai oleh pemanggil pertama (yang benar-benar memicu download)
export function loadModel(url, onProgress) {
  if (!cache.has(url)) {
    cache.set(url, new Promise((resolve, reject) => loader.load(url, resolve, onProgress, reject)));
  }
  return cache.get(url);
}

// Salinan scene lengkap dengan skeleton sendiri. Geometry & material tetap dipakai bersama.
export function cloneModel(gltf) {
  const copy = SkeletonUtils.clone(gltf.scene);
  // Skeleton hasil clone belum dihitung; tanpa ini ukuran (bounding box) mesh bertulang bisa nol
  copy.updateMatrixWorld(true);
  copy.traverse(obj => {
    if (obj.isSkinnedMesh) {
      obj.skeleton.update();
      obj.computeBoundingBox();
    }
  });
  return copy;
}

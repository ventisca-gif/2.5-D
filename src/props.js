// Modelos low-poly construidos con primitivas: casas, murallas, barco, árboles, decoración...
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mulberry32 } from './rng.js';

// ---------------------------------------------------------------- utilidades
const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(Object.keys(opts).map((k) => [k, opts[k] && opts[k].uuid ? opts[k].uuid : opts[k]]));
  if (matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshLambertMaterial({ color, ...opts });
  matCache.set(key, m);
  return m;
}

export function scaleBoxUV(geo, w, h, d, dens = 1) {
  const uv = geo.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, uv.getX(i) * dims[f][0] * dens, uv.getY(i) * dims[f][1] * dens);
    }
  }
  uv.needsUpdate = true;
  return geo;
}

export function box(parent, w, h, d, material, x = 0, y = 0, z = 0, uvDens = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (uvDens) scaleBoxUV(g, w, h, d, uvDens);
  const m = new THREE.Mesh(g, material);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

export function cyl(parent, rt, rb, h, material, x = 0, y = 0, z = 0, seg = 8) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

export function shadowAll(obj, cast = true, receive = true) {
  obj.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = cast;
      o.receiveShadow = receive;
    }
  });
}

// Fusiona todas las mallas estáticas por material para reducir llamadas de dibujo.
export class StaticBatcher {
  constructor() {
    this.items = [];
  }
  add(obj) {
    obj.updateMatrixWorld(true);
    obj.traverse((m) => {
      if (m.isMesh) this.items.push(m);
    });
  }
  build(scene) {
    const groups = new Map();
    for (const m of this.items) {
      const k = m.material.uuid;
      if (!groups.has(k)) groups.set(k, { mat: m.material, list: [], cast: true });
      const g = groups.get(k);
      g.list.push(m);
      if (m.userData.noCast) g.cast = false;
    }
    const out = [];
    for (const { mat: material, list, cast } of groups.values()) {
      const geos = list.map((m) => {
        let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
        g.applyMatrix4(m.matrixWorld);
        for (const name of Object.keys(g.attributes)) {
          if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
        }
        if (!material.map) g.deleteAttribute('uv');
        else if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
        if (!g.attributes.normal) g.computeVertexNormals();
        g.clearGroups();
        return g;
      });
      const merged = mergeGeometries(geos, false);
      if (!merged) continue;
      const mesh = new THREE.Mesh(merged, material);
      mesh.castShadow = cast;
      mesh.receiveShadow = true;
      mesh.matrixAutoUpdate = false;
      scene.add(mesh);
      out.push(mesh);
    }
    this.items = [];
    return out;
  }
}

// ---------------------------------------------------------------- materiales compartidos
export function createMaterials(tx) {
  const M = {
    timber: mat(0x4a3424),
    darkWood: mat(0x5a3a22),
    wood: mat(0x8a5a32),
    lightWood: mat(0xb08050),
    found: mat(0x8f8a82, { map: tx.stone }),
    stone: mat(0xd8d4cc, { map: tx.stone }),
    stoneDark: mat(0xa8a49c, { map: tx.stone }),
    plank: mat(0xb88a5a, { map: tx.plank }),
    plankDark: mat(0x7a5434, { map: tx.plank }),
    deck: mat(0x7a5634, { map: tx.plank }),
    iron: mat(0x3a3a40),
    gold: mat(0xe0b040, { emissive: 0x3a2a00 }),
    glass: new THREE.MeshLambertMaterial({ color: 0x9ec3d8, emissive: 0xffc860, emissiveIntensity: 0 }),
    lantern: new THREE.MeshLambertMaterial({ color: 0xffe6a0, emissive: 0xffb040, emissiveIntensity: 0.3 }),
    fire: new THREE.MeshBasicMaterial({ color: 0xff8a20 }),
    fire2: new THREE.MeshBasicMaterial({ color: 0xffd040 }),
    door: mat(0x5b3a1e),
    white: mat(0xf2efe6),
    red: mat(0xb33a2e),
    sail: mat(0xf2ead6, { map: tx.sail, side: THREE.DoubleSide }),
    flag: new THREE.MeshLambertMaterial({ map: tx.flag, side: THREE.DoubleSide }),
    clock: new THREE.MeshLambertMaterial({ map: tx.clock }),
    rope: mat(0x9a8058),
    straw: mat(0xd9b850),
    canvas: mat(0xd8ccae),
    water: new THREE.MeshLambertMaterial({ color: 0x4aa8d8, transparent: true, opacity: 0.85, emissive: 0x103040 }),
    shutterA: mat(0x3f6e4a), shutterB: mat(0x7a2e2a), shutterC: mat(0x2f4f7a),
    flowerBox: mat(0x6a4426),
  };
  M.tx = tx;
  M.roof = (color, thatch) => mat(color, { map: thatch ? tx.thatch : tx.shingle });
  M.plaster = (color) => mat(color, { map: tx.plaster });
  M.planked = (color) => mat(color, { map: tx.plank });
  return M;
}

// ---------------------------------------------------------------- tejado a dos aguas
function gableRoof(parent, L, S, rh, o, roofMat, gableMat, baseY, ridgeAlongZ) {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-S / 2, 0);
  shape.lineTo(S / 2, 0);
  shape.lineTo(0, rh);
  shape.closePath();
  const eg = new THREE.ExtrudeGeometry(shape, { depth: L, bevelEnabled: false });
  eg.rotateY(Math.PI / 2);
  eg.translate(-L / 2, 0, 0);
  g.add(new THREE.Mesh(eg, gableMat));

  const half = S / 2 + o;
  const yE = -rh * o / (S / 2);
  const len = Math.hypot(half, rh - yE);
  const a = Math.atan2(rh - yE, half);
  for (const sgn of [1, -1]) {
    const geo = new THREE.BoxGeometry(L + o * 2, 0.1, len);
    scaleBoxUV(geo, L + o * 2, 0.1, len, 1.3);
    const m = new THREE.Mesh(geo, roofMat);
    m.position.set(0, (rh + yE) / 2 + 0.05, (sgn * half) / 2);
    m.rotation.x = sgn * a;
    g.add(m);
  }
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(L + o * 2 + 0.04, 0.12, 0.16), roofMat);
  ridge.position.set(0, rh + 0.08, 0);
  g.add(ridge);
  g.position.y = baseY;
  if (ridgeAlongZ) g.rotation.y = Math.PI / 2;
  parent.add(g);
  return g;
}

function windowAt(parent, M, x, y, z, rotY, shutter) {
  const w = new THREE.Group();
  box(w, 0.42, 0.44, 0.06, M.timber, 0, 0, 0);
  box(w, 0.32, 0.34, 0.08, M.glass, 0, 0, 0.01);
  box(w, 0.04, 0.34, 0.1, M.timber, 0, 0, 0.02);
  box(w, 0.32, 0.04, 0.1, M.timber, 0, 0, 0.02);
  if (shutter) {
    box(w, 0.14, 0.42, 0.05, shutter, -0.29, 0, 0.02);
    box(w, 0.14, 0.42, 0.05, shutter, 0.29, 0, 0.02);
  }
  w.position.set(x, y, z);
  w.rotation.y = rotY;
  parent.add(w);
  return w;
}

const DOOR_ROT = { s: 0, e: Math.PI / 2, n: Math.PI, w: -Math.PI / 2 };

export function makeBuilding(b, M) {
  const g = new THREE.Group();
  const dyn = []; // partes animadas
  const ns = b.door === 's' || b.door === 'n';
  const lw = ns ? b.w : b.d;
  const ld = ns ? b.d : b.w;
  const W = lw - 0.18, D = ld - 0.18, H = b.h;
  const rnd = mulberry32(b.x0 * 131 + b.z0);
  const base = 0.18;

  if (b.lighthouse) {
    cyl(g, 0.95, 1.05, 0.4, M.stoneDark, 0, 0.2, 0, 10);
    const n = 5;
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n;
      const r0 = 0.85 - t0 * 0.3, r1 = 0.85 - t1 * 0.3;
      cyl(g, r1, r0, H / n, i % 2 ? M.red : M.white, 0, 0.4 + (t0 + t1) / 2 * H, 0, 10);
    }
    cyl(g, 0.75, 0.75, 0.12, M.iron, 0, 0.4 + H + 0.06, 0, 10);
    const lamp = cyl(g, 0.42, 0.42, 0.6, M.lantern, 0, 0.4 + H + 0.42, 0, 8);
    cyl(g, 0.05, 0.6, 0.55, M.red, 0, 0.4 + H + 1.0, 0, 8);
    box(g, 0.4, 0.65, 0.06, M.door, 0, 0.72, 0.84);
    // haz de luz giratorio
    const beamGeo = new THREE.ConeGeometry(1.6, 9, 12, 1, true);
    beamGeo.translate(0, -4.5, 0);
    beamGeo.rotateZ(Math.PI / 2);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(0, 0.4 + H + 0.42, 0);
    beam.userData.dynamic = 'beam';
    dyn.push(beam);
    lamp.userData.lamp = true;
  } else if (b.clock) {
    box(g, W + 0.1, 0.25, D + 0.1, M.found, 0, 0.125, 0, 1);
    box(g, W, H, D, M.stone, 0, 0.25 + H / 2, 0, 1.2);
    box(g, W + 0.2, 0.2, D + 0.2, M.stoneDark, 0, 0.25 + H, 0, 1);
    for (const [rx, rz, ry] of [[0, D / 2 + 0.02, 0], [0, -D / 2 - 0.02, Math.PI], [W / 2 + 0.02, 0, Math.PI / 2], [-W / 2 - 0.02, 0, -Math.PI / 2]]) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), M.clock);
      p.position.set(rx, 0.25 + H - 0.9, rz);
      p.rotation.y = ry;
      g.add(p);
    }
    const roof = new THREE.Mesh(new THREE.ConeGeometry((W + 0.5) * 0.72, 1.8, 4), M.roof(b.roof));
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 0.25 + H + 0.2 + 0.9;
    g.add(roof);
    cyl(g, 0.03, 0.03, 0.6, M.gold, 0, 0.25 + H + 2.2, 0, 4);
    box(g, 0.6, 1.0, 0.08, M.door, 0, 0.75, D / 2 + 0.02);
    windowAt(g, M, 0, 0.25 + H * 0.45, D / 2 + 0.03, 0, null);
  } else {
    box(g, W + 0.12, base, D + 0.12, M.found, 0, base / 2, 0, 1.2);
    const wallMat = b.stone ? M.stone : b.plank ? M.planked(b.wall) : M.plaster(b.wall);
    box(g, W, H, D, wallMat, 0, base + H / 2, 0, b.stone ? 1.1 : 1.2);
    const top = base + H;
    if (b.timber) {
      const t = 0.08;
      const xs = [];
      const nx = Math.max(2, Math.round(W / 1.1) + 1);
      for (let i = 0; i < nx; i++) xs.push(-W / 2 + (W * i) / (nx - 1));
      for (const zf of [D / 2 + 0.015, -D / 2 - 0.015]) {
        for (const x of xs) box(g, t, H, 0.05, M.timber, x, base + H / 2, zf);
        box(g, W + 0.04, t, 0.05, M.timber, 0, top - t / 2, zf);
        box(g, W + 0.04, t, 0.05, M.timber, 0, base + t / 2, zf);
        if (b.floors === 2) box(g, W + 0.04, t, 0.05, M.timber, 0, base + H * 0.5, zf);
      }
      const nz = Math.max(2, Math.round(D / 1.1) + 1);
      for (const xf of [W / 2 + 0.015, -W / 2 - 0.015]) {
        for (let i = 0; i < nz; i++) box(g, 0.05, H, t, M.timber, xf, base + H / 2, -D / 2 + (D * i) / (nz - 1));
        box(g, 0.05, t, D + 0.04, M.timber, xf, top - t / 2, 0);
        if (b.floors === 2) box(g, 0.05, t, D + 0.04, M.timber, xf, base + H * 0.5, 0);
      }
    }
    // tejado
    const along = W >= D;
    const L = along ? W : D;
    const S = along ? D : W;
    const rh = b.flat ? 0 : Math.min(1.5, S * 0.42 + 0.2);
    if (b.flat) {
      // azotea de adobe con pretil y vigas asomando
      const rm = mat(b.roof);
      box(g, W + 0.14, 0.1, D + 0.14, rm, 0, top + 0.05, 0);
      for (const [px, pz, pw, pd] of [[0, D / 2, W + 0.14, 0.1], [0, -D / 2, W + 0.14, 0.1], [W / 2, 0, 0.1, D + 0.14], [-W / 2, 0, 0.1, D + 0.14]]) box(g, pw, 0.16, pd, rm, px, top + 0.18, pz);
      for (let i = 0; i < Math.max(2, Math.round(W / 0.8)); i++) cyl(g, 0.04, 0.04, 0.3, M.timber, -W / 2 + 0.3 + i * ((W - 0.6) / Math.max(1, Math.round(W / 0.8) - 1)), top - 0.15, D / 2 + 0.1, 5).rotation.x = Math.PI / 2;
    } else gableRoof(g, L, S, rh, 0.22, M.roof(b.roof, b.thatch), wallMat, top, !along);
    if (b.keep) {
      // torre del homenaje: almenas y banderola azul
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        cyl(g, 0.45, 0.5, top + 1.2, M.stone, sx * (W / 2), (top + 1.2) / 2, sz * (D / 2), 10);
        for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; box(g, 0.16, 0.2, 0.16, M.stone, sx * (W / 2) + Math.cos(a) * 0.42, top + 1.3, sz * (D / 2) + Math.sin(a) * 0.42); }
        cyl(g, 0.02, 0.5, 0.6, M.roof(0x24345e), sx * (W / 2), top + 1.65, sz * (D / 2), 10);
      }
      cyl(g, 0.025, 0.025, 1.2, M.iron, 0, top + rh + 0.6, 0, 4);
      box(g, 0.6, 0.36, 0.02, mat(0x2a4a9a, { side: THREE.DoubleSide }), 0.3, top + rh + 1.0, 0);
      box(g, 0.3, 0.12, 0.03, M.white, 0.3, top + rh + 1.0, 0);
    }
    // chimenea
    if (!b.flat && !b.keep && (!b.thatch || rnd() < 0.5)) {
      const cx = (along ? L * 0.28 : S * 0.15) * (rnd() < 0.5 ? 1 : -1);
      const cz = along ? -S * 0.18 : L * 0.28;
      box(g, 0.32, rh + 0.5, 0.32, M.stoneDark, cx, top + (rh + 0.5) / 2, cz, 1.5);
      box(g, 0.38, 0.08, 0.38, M.iron, cx, top + rh + 0.5, cz);
      if (b.id === 'herreria') g.userData.smoke = new THREE.Vector3(cx, top + rh + 0.6, cz);
    }
    // puerta
    const dz = D / 2;
    box(g, 0.62, 0.92, 0.06, M.timber, 0, base + 0.46, dz + 0.02);
    box(g, 0.5, 0.84, 0.08, M.door, 0, base + 0.42, dz + 0.03);
    box(g, 0.06, 0.06, 0.04, M.gold, 0.16, base + 0.42, dz + 0.08);
    box(g, 0.8, 0.08, 0.4, M.stoneDark, 0, 0.04, dz + 0.26, 1);
    // ventanas
    const shutters = [M.shutterA, M.shutterB, M.shutterC, null];
    const sh = shutters[Math.floor(rnd() * shutters.length)];
    const rows = b.floors === 2 ? [base + H * 0.27, base + H * 0.74] : [base + H * 0.52];
    const nWin = Math.max(1, Math.floor(W / 1.05));
    for (let ri = 0; ri < rows.length; ri++) {
      for (let i = 0; i < nWin + 1; i++) {
        const x = -W / 2 + (W * (i + 0.5)) / (nWin + 1);
        if (ri === 0 && Math.abs(x) < 0.55) continue;
        windowAt(g, M, x, rows[ri], dz + 0.03, 0, sh);
        windowAt(g, M, x, rows[ri], -dz - 0.03, Math.PI, sh);
        if (ri === 0 && rnd() < 0.6) {
          box(g, 0.44, 0.1, 0.14, M.flowerBox, x, rows[ri] - 0.28, dz + 0.1);
          const fc = [0xe05a7a, 0xf0d040, 0xe8e8f0, 0xd04030][Math.floor(rnd() * 4)];
          for (let k = 0; k < 3; k++) {
            const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.055, 0), mat(fc));
            f.position.set(x - 0.13 + k * 0.13, rows[ri] - 0.2, dz + 0.1);
            g.add(f);
          }
        }
      }
      const nSide = Math.max(1, Math.floor(D / 1.3));
      for (let i = 0; i < nSide; i++) {
        const z = -D / 2 + (D * (i + 0.5)) / nSide;
        windowAt(g, M, W / 2 + 0.03, rows[ri], z, Math.PI / 2, sh);
        windowAt(g, M, -W / 2 - 0.03, rows[ri], z, -Math.PI / 2, sh);
      }
    }
    if (b.sign) {
      box(g, 0.05, 0.05, 0.5, M.iron, W / 2 - 0.3, base + H * 0.8, dz + 0.25);
      box(g, 0.5, 0.36, 0.05, mat(b.sign), W / 2 - 0.3, base + H * 0.8 - 0.25, dz + 0.45);
      box(g, 0.2, 0.16, 0.07, M.gold, W / 2 - 0.3, base + H * 0.8 - 0.25, dz + 0.45);
    }
  }

  const cx = b.x0 + (b.w - 1) / 2;
  const cz = b.z0 + (b.d - 1) / 2;
  g.position.set(cx, 0, cz);
  g.rotation.y = DOOR_ROT[b.door] || 0;
  const dynGroup = new THREE.Group();
  dynGroup.position.copy(g.position);
  dynGroup.rotation.copy(g.rotation);
  dyn.forEach((d) => dynGroup.add(d));
  return { group: g, dyn: dynGroup };
}

// ---------------------------------------------------------------- murallas y torres
export function makeWall(w, M) {
  const g = new THREE.Group();
  if (w.ruin) {
    const h = 0.4 + ((w.x * 7 + w.z * 3) % 5) * 0.15;
    box(g, 1.0, h, 0.55, M.stoneDark, 0, h / 2, 0, 1.1);
    box(g, 0.35, 0.3, 0.5, M.stoneDark, 0.3, 0.15, 0.55, 1.1).rotation.y = 0.5;
    g.position.set(w.x, 0, w.z);
    if (w.dir === 'z') g.rotation.y = Math.PI / 2;
    return g;
  }
  box(g, 1.0, 1.15, 0.55, M.stone, 0, 0.575, 0, 1.1);
  box(g, 1.0, 0.1, 0.65, M.stoneDark, 0, 1.2, 0, 1);
  box(g, 0.32, 0.3, 0.6, M.stone, -0.25, 1.4, 0, 1.1);
  box(g, 0.32, 0.3, 0.6, M.stone, 0.25, 1.4, 0, 1.1);
  g.position.set(w.x, 0, w.z);
  if (w.dir === 'z') g.rotation.y = Math.PI / 2;
  return g;
}

export function makeTower(t, M) {
  const g = new THREE.Group();
  box(g, 1.3, 2.3, 1.3, M.stone, 0, 1.15, 0, 1.1);
  box(g, 1.5, 0.22, 1.5, M.stoneDark, 0, 2.4, 0, 1);
  for (const [x, z] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6], [0, -0.6], [0, 0.6], [-0.6, 0], [0.6, 0]]) {
    box(g, 0.3, 0.32, 0.3, M.stone, x, 2.67, z, 1.1);
  }
  box(g, 0.14, 0.3, 0.05, M.iron, 0, 1.6, 0.66);
  box(g, 0.14, 0.3, 0.05, M.iron, 0.66, 1.6, 0).rotation.y = Math.PI / 2;
  g.position.set(t.x, 0, t.z);
  return g;
}

// ---------------------------------------------------------------- props
export function makeProp(p, M) {
  const g = new THREE.Group();
  const dyn = [];
  switch (p.type) {
    case 'fountain': {
      cyl(g, 1.4, 1.5, 0.38, M.stone, 0, 0.19, 0, 12);
      const water = cyl(g, 1.22, 1.22, 0.06, M.water, 0, 0.36, 0, 16);
      water.userData.noCast = true;
      cyl(g, 0.2, 0.26, 1.05, M.stone, 0, 0.7, 0, 8);
      cyl(g, 0.6, 0.32, 0.22, M.stone, 0, 1.2, 0, 10);
      cyl(g, 0.52, 0.52, 0.04, M.water, 0, 1.3, 0, 10).userData.noCast = true;
      cyl(g, 0.08, 0.12, 0.35, M.stone, 0, 1.45, 0, 6);
      // gotas animadas
      const count = 70;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xcfefff, size: 0.09, transparent: true, opacity: 0.9 }));
      pts.userData.dynamic = 'fountain';
      pts.userData.seeds = Array.from({ length: count }, (_, i) => ({ a: (i / count) * Math.PI * 2, o: Math.random() }));
      pts.frustumCulled = false;
      dyn.push(pts);
      break;
    }
    case 'stall': {
      for (const [x, z] of [[-0.4, -0.35], [0.4, -0.35], [-0.4, 0.35], [0.4, 0.35]]) cyl(g, 0.04, 0.04, 1.2, M.darkWood, x, 0.6, z, 5);
      box(g, 0.9, 0.45, 0.5, M.plank, 0, 0.225, 0.1, 1.5);
      const c1 = mat(p.color), c2 = M.white;
      for (let i = 0; i < 4; i++) {
        const s = box(g, 0.25, 0.05, 1.0, i % 2 ? c2 : c1, -0.375 + i * 0.25, 1.25, 0);
        s.rotation.x = 0.25;
      }
      const fruits = [0xd83a2a, 0xf0b030, 0x6ab03a, 0x9a3ab0];
      for (let i = 0; i < 6; i++) {
        const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 0), mat(fruits[i % 4]));
        f.position.set(-0.3 + (i % 3) * 0.3, 0.5, 0.0 + Math.floor(i / 3) * 0.2);
        g.add(f);
      }
      break;
    }
    case 'barrel': {
      cyl(g, 0.25, 0.25, 0.62, M.wood, 0, 0.31, 0, 10);
      cyl(g, 0.28, 0.28, 0.4, M.wood, 0, 0.31, 0, 10);
      cyl(g, 0.285, 0.285, 0.05, M.iron, 0, 0.18, 0, 10);
      cyl(g, 0.285, 0.285, 0.05, M.iron, 0, 0.44, 0, 10);
      break;
    }
    case 'crate': {
      box(g, 0.58, 0.58, 0.58, M.plank, 0, 0.29, 0, 1.6);
      for (const y of [0.04, 0.54]) box(g, 0.6, 0.06, 0.6, M.darkWood, 0, y, 0);
      break;
    }
    case 'anvil': {
      box(g, 0.3, 0.3, 0.3, M.darkWood, 0, 0.15, 0);
      box(g, 0.2, 0.12, 0.18, M.iron, 0, 0.36, 0);
      box(g, 0.5, 0.12, 0.24, M.iron, 0, 0.47, 0);
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 6), M.iron);
      horn.rotation.z = -Math.PI / 2;
      horn.position.set(0.37, 0.47, 0);
      g.add(horn);
      break;
    }
    case 'forge': {
      box(g, 0.9, 0.65, 0.8, M.stoneDark, 0, 0.325, 0, 1.5);
      const coal = box(g, 0.6, 0.06, 0.5, M.fire, 0, 0.67, 0);
      coal.userData.noCast = true;
      box(g, 0.4, 0.9, 0.4, M.stoneDark, 0, 1.1, -0.2, 1.5);
      break;
    }
    case 'haystack': {
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), M.straw);
      h.scale.set(1, 0.8, 1);
      h.position.y = 0.3;
      g.add(h);
      break;
    }
    case 'well': {
      cyl(g, 0.5, 0.52, 0.55, M.stone, 0, 0.275, 0, 10);
      cyl(g, 0.4, 0.4, 0.02, mat(0x1a3a5a), 0, 0.56, 0, 10);
      box(g, 0.08, 1.2, 0.08, M.darkWood, -0.45, 0.6, 0);
      box(g, 0.08, 1.2, 0.08, M.darkWood, 0.45, 0.6, 0);
      const r = box(g, 1.1, 0.06, 0.8, M.roof(0x8f3a2a), 0, 1.25, 0.18);
      r.rotation.x = 0.5;
      const r2 = box(g, 1.1, 0.06, 0.8, M.roof(0x8f3a2a), 0, 1.25, -0.18);
      r2.rotation.x = -0.5;
      cyl(g, 0.05, 0.05, 0.9, M.wood, 0, 0.95, 0, 6).rotation.z = Math.PI / 2;
      break;
    }
    case 'bench': {
      box(g, 0.9, 0.07, 0.32, M.plank, 0, 0.3, 0, 1);
      box(g, 0.07, 0.3, 0.3, M.darkWood, -0.38, 0.15, 0);
      box(g, 0.07, 0.3, 0.3, M.darkWood, 0.38, 0.15, 0);
      box(g, 0.9, 0.25, 0.05, M.plank, 0, 0.47, -0.15, 1);
      break;
    }
    case 'roundtower': {
      // torre redonda a rayas blancas y azules (Marina)
      const n = 5, H = 2.6;
      for (let i = 0; i < n; i++) cyl(g, 0.7, 0.72, H / n, i % 2 ? mat(0x2a4a8a, { map: M.tx.stone }) : M.stone, 0, (i + 0.5) * (H / n), 0, 12);
      cyl(g, 0.82, 0.82, 0.16, M.stoneDark, 0, H + 0.08, 0, 12);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; box(g, 0.22, 0.26, 0.22, M.stone, Math.cos(a) * 0.72, H + 0.29, Math.sin(a) * 0.72, 1); }
      for (const a of [0.4, 2.4, 4.2]) box(g, 0.1, 0.3, 0.05, M.iron, Math.sin(a) * 0.72, 1.6, Math.cos(a) * 0.72).rotation.y = a;
      cyl(g, 0.02, 0.02, 0.9, M.iron, 0, H + 0.6, 0, 4);
      box(g, 0.4, 0.24, 0.02, mat(0x2a4a9a, { side: THREE.DoubleSide }), 0.2, H + 0.92, 0);
      break;
    }
    case 'flag': {
      cyl(g, 0.3, 0.36, 0.2, M.stoneDark, 0, 0.1, 0, 8);
      cyl(g, 0.04, 0.05, 3.2, M.iron, 0, 1.7, 0, 6);
      const fm = mat(p.naval ? 0x2a4a9a : 0x1a1a1a, { side: THREE.DoubleSide });
      const f = box(g, 1.1, 0.66, 0.02, fm, 0.56, 2.9, 0);
      f.userData.noCast = true;
      // emblema: gaviota blanca sobre ancla
      box(g, 0.36, 0.05, 0.03, M.white, 0.56, 3.0, 0).rotation.z = 0.25;
      box(g, 0.36, 0.05, 0.03, M.white, 0.84, 3.0, 0).rotation.z = -0.25;
      box(g, 0.05, 0.26, 0.03, M.white, 0.7, 2.8, 0);
      box(g, 0.24, 0.05, 0.03, M.white, 0.7, 2.68, 0);
      break;
    }
    case 'poster': {
      // tablón de Se busca
      for (const x of [-0.42, 0.42]) cyl(g, 0.05, 0.06, 1.6, M.darkWood, x, 0.8, 0, 5);
      box(g, 1.0, 0.75, 0.06, M.plank, 0, 1.15, 0, 1.2);
      box(g, 1.1, 0.08, 0.12, M.darkWood, 0, 1.56, 0);
      for (const [x, y, r] of [[-0.24, 1.17, 0.05], [0.22, 1.13, -0.07]]) {
        const pp = box(g, 0.36, 0.5, 0.02, mat(0xe8d8a8), x, y, 0.045); pp.rotation.z = r;
        box(g, 0.22, 0.2, 0.025, mat(0x8a6a4a), x, y + 0.05, 0.05).rotation.z = r;
        box(g, 0.26, 0.04, 0.025, mat(0x3a2a1a), x, y + 0.2, 0.05).rotation.z = r;
      }
      break;
    }
    case 'totem': {
      const cs = [0x8a5a2a, 0x2ab07a, 0xc83a2a, 0xe0b030];
      for (let i = 0; i < 4; i++) {
        box(g, 0.42, 0.36, 0.42, mat(cs[i]), 0, 0.18 + i * 0.38, 0);
        box(g, 0.1, 0.06, 0.04, M.white, -0.1, 0.24 + i * 0.38, 0.22); box(g, 0.1, 0.06, 0.04, M.white, 0.1, 0.24 + i * 0.38, 0.22);
      }
      box(g, 0.9, 0.1, 0.16, mat(0x2ab07a), 0, 1.25, 0);
      break;
    }
    case 'sacks': {
      for (const [x, z, s] of [[-0.2, 0, 1], [0.2, 0.05, 0.9], [0, -0.1, 0.8]]) {
        const m = cyl(g, 0.2 * s, 0.24 * s, 0.38 * s, M.canvas, x, 0.19 * s + (s < 0.85 ? 0.3 : 0), z, 7);
        m.scale.z = 0.8;
      }
      break;
    }
    case 'cannon': {
      box(g, 0.45, 0.2, 0.6, M.darkWood, 0, 0.2, 0);
      for (const x of [-0.25, 0.25]) for (const z of [-0.2, 0.2]) {
        const w = cyl(g, 0.12, 0.12, 0.06, M.darkWood, x, 0.12, z, 8);
        w.rotation.z = Math.PI / 2;
      }
      const b = cyl(g, 0.11, 0.15, 0.85, M.iron, 0, 0.42, 0.1, 8);
      b.rotation.x = Math.PI / 2 - 0.15;
      break;
    }
    case 'net': {
      for (let i = 0; i < 4; i++) {
        box(g, 0.9, 0.02, 0.03, M.rope, 0, 0.02, -0.35 + i * 0.23).userData.noCast = true;
        box(g, 0.03, 0.02, 0.9, M.rope, -0.35 + i * 0.23, 0.02, 0).userData.noCast = true;
      }
      break;
    }
    case 'fence': {
      box(g, 0.08, 0.5, 0.08, M.darkWood, 0, 0.25, 0);
      box(g, 1.0, 0.06, 0.04, M.wood, 0, 0.36, 0);
      box(g, 1.0, 0.06, 0.04, M.wood, 0, 0.18, 0);
      break;
    }
    case 'scarecrow': {
      box(g, 0.07, 1.3, 0.07, M.darkWood, 0, 0.65, 0);
      box(g, 0.8, 0.07, 0.07, M.darkWood, 0, 0.95, 0);
      box(g, 0.34, 0.4, 0.2, mat(0x5a7a9a), 0, 0.9, 0);
      box(g, 0.24, 0.24, 0.22, M.straw, 0, 1.25, 0);
      cyl(g, 0.28, 0.28, 0.03, M.straw, 0, 1.38, 0, 10);
      cyl(g, 0.12, 0.14, 0.14, M.straw, 0, 1.45, 0, 8);
      break;
    }
    case 'campfire': {
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0), M.stoneDark);
        s.position.set(Math.cos(a) * 0.32, 0.05, Math.sin(a) * 0.32);
        g.add(s);
      }
      for (let i = 0; i < 3; i++) {
        const l = cyl(g, 0.05, 0.05, 0.5, M.darkWood, 0, 0.08, 0, 5);
        l.rotation.z = Math.PI / 2;
        l.rotation.y = (i / 3) * Math.PI;
      }
      const f = new THREE.Group();
      const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 5), M.fire);
      c1.position.y = 0.3;
      const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.35, 5), M.fire2);
      c2.position.y = 0.25;
      f.add(c1, c2);
      f.userData.dynamic = 'flame';
      dyn.push(f);
      break;
    }
    case 'skullrock': {
      const rockM = mat(0x9a968e);
      const sk = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 1), rockM);
      sk.scale.set(1.1, 1.0, 0.95);
      sk.position.y = 1.1;
      g.add(sk);
      const jaw = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 1), rockM);
      jaw.scale.set(1.1, 0.6, 0.9);
      jaw.position.set(0, 0.35, 0.45);
      g.add(jaw);
      for (const sx of [-0.45, 0.45]) {
        const e = new THREE.Mesh(new THREE.SphereGeometry(0.33, 10, 8), mat(0x141210));
        e.position.set(sx, 1.25, 1.12);
        e.scale.set(1, 1.1, 0.6);
        g.add(e);
      }
      const n = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.3, 3), mat(0x141210));
      n.rotation.x = Math.PI;
      n.position.set(0, 0.85, 1.28);
      g.add(n);
      for (let i = 0; i < 5; i++) box(g, 0.14, 0.18, 0.1, mat(0xd8d2c0), -0.36 + i * 0.18, 0.55, 1.18);
      break;
    }
    case 'chest': {
      if (p.big) {
        for (let i = 0; i < 14; i++) {
          const c = cyl(g, 0.07, 0.07, 0.02, M.gold, Math.cos(i * 2.3) * (0.35 + (i % 3) * 0.12), 0.01 + (i % 4) * 0.012, Math.sin(i * 2.3) * (0.35 + (i % 3) * 0.12), 8);
          c.rotation.x = (i % 3) * 0.3;
        }
        g.scale.setScalar(1.35);
      }
      box(g, 0.6, 0.35, 0.4, M.wood, 0, 0.175, 0);
      const lid = cyl(g, 0.2, 0.2, 0.6, M.wood, 0, 0.35, 0, 8);
      lid.rotation.z = Math.PI / 2;
      box(g, 0.62, 0.06, 0.42, M.gold, 0, 0.3, 0);
      box(g, 0.1, 0.12, 0.05, M.gold, 0, 0.3, 0.21);
      break;
    }
    case 'tent': {
      const sh = new THREE.Shape();
      sh.moveTo(-0.7, 0); sh.lineTo(0.7, 0); sh.lineTo(0, 1.0); sh.closePath();
      const eg = new THREE.ExtrudeGeometry(sh, { depth: 1.3, bevelEnabled: false });
      eg.translate(0, 0, -0.65);
      g.add(new THREE.Mesh(eg, mat(0x8a7a5a)));
      box(g, 0.3, 0.6, 0.02, mat(0x2a2218), 0, 0.3, 0.66);
      break;
    }
  }
  g.position.set(p.x, 0, p.z);
  g.rotation.y = p.rot || 0;
  const dynGroup = new THREE.Group();
  dynGroup.position.copy(g.position);
  dynGroup.rotation.copy(g.rotation);
  dyn.forEach((d) => dynGroup.add(d));
  return { group: g, dyn: dynGroup };
}

export function makeLamp(l, M) {
  const g = new THREE.Group();
  cyl(g, 0.12, 0.14, 0.15, M.stoneDark, 0, 0.075, 0, 6);
  cyl(g, 0.04, 0.05, 1.6, M.iron, 0, 0.85, 0, 6);
  box(g, 0.2, 0.26, 0.2, M.lantern, 0, 1.72, 0).userData.noCast = true;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.14, 4), M.iron);
  cap.rotation.y = Math.PI / 4;
  cap.position.y = 1.92;
  g.add(cap);
  g.position.set(l.x, 0, l.z);
  return g;
}

// ---------------------------------------------------------------- muelles
export function makeDocks(W, M) {
  const g = new THREE.Group();
  const T_DOCK = 5;
  const ox = W.ox || 0, oz = W.oz || 0;
  for (let z = oz; z < oz + W.N; z++) {
    for (let x = ox; x < ox + W.N; x++) {
      if (W.tile(x, z) !== T_DOCK) continue;
      const p = box(g, 1.0, 0.1, 1.0, M.deck, x, 0.09, z, 1.2);
      if ((x + z) % 2) p.rotation.y = Math.PI / 2;
      const edgeX = W.tile(x - 1, z) !== T_DOCK || W.tile(x + 1, z) !== T_DOCK;
      const edgeZ = W.tile(x, z - 1) !== T_DOCK || W.tile(x, z + 1) !== T_DOCK;
      if ((edgeX || edgeZ) && (x + z) % 2 === 0) {
        for (const [ox, oz] of [[-0.45, -0.45], [0.45, 0.45]]) {
          cyl(g, 0.07, 0.07, 0.9, M.darkWood, x + ox, -0.3, z + oz, 6);
        }
      }
    }
  }
  // bolardos
  for (const [x, z] of (W.ox ? [] : [[49, 92], [51, 94], [49, 96], [44, 98], [51, 97]])) {
    cyl(g, 0.08, 0.1, 0.3, M.iron, x - 0.42, 0.28, z, 6);
  }
  return g;
}

// ---------------------------------------------------------------- barcos
function hullShape(len, wid) {
  const s = new THREE.Shape();
  const hl = len / 2;
  s.moveTo(-wid * 0.42, hl);
  s.lineTo(wid * 0.42, hl);
  s.quadraticCurveTo(wid * 0.55, 0, wid * 0.45, -hl * 0.45);
  s.quadraticCurveTo(wid * 0.3, -hl * 0.92, 0, -hl * 1.05);
  s.quadraticCurveTo(-wid * 0.3, -hl * 0.92, -wid * 0.45, -hl * 0.45);
  s.quadraticCurveTo(-wid * 0.55, 0, -wid * 0.42, hl);
  return s;
}

function hullLayer(len, wid, h, material, y) {
  const geo = new THREE.ExtrudeGeometry(hullShape(len, wid), { depth: h, bevelEnabled: false, curveSegments: 8 });
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, material);
  m.position.y = y;
  return m;
}

export function makeShip(M, tx) {
  const ship = new THREE.Group();
  const len = 7, wid = 2.4;
  const dark = mat(0x3a2414);
  const hullMat = mat(0x6a4024, { map: tx.plank });
  ship.userData.hullMat = hullMat;
  ship.add(hullLayer(len * 0.82, wid * 0.62, 0.5, dark, -0.7));
  ship.add(hullLayer(len * 0.92, wid * 0.85, 0.4, hullMat, -0.2));
  ship.add(hullLayer(len, wid, 0.55, hullMat, 0.2));
  ship.add(hullLayer(len, wid, 0.08, mat(0x5a3a22), 0.75));
  const deck = hullLayer(len * 0.96, wid * 0.92, 0.05, M.deck, 0.62);
  ship.add(deck);
  // castillo de popa
  box(ship, wid * 0.8, 0.7, 1.5, hullMat, 0, 1.0, -len / 2 + 0.85, 1.2);
  box(ship, wid * 0.84, 0.08, 1.56, mat(0x5a3a22), 0, 1.38, -len / 2 + 0.85);
  for (let i = 0; i < 3; i++) box(ship, 0.25, 0.22, 0.05, M.lantern, -0.6 + i * 0.6, 1.0, -len / 2 + 0.08);
  // cañones laterales
  for (let i = 0; i < 3; i++) {
    for (const sx of [-1, 1]) {
      box(ship, 0.06, 0.18, 0.24, mat(0x1a1410), sx * wid * 0.5, 0.45, -1.2 + i * 1.1);
      const c = cyl(ship, 0.06, 0.07, 0.3, M.iron, sx * (wid * 0.5 + 0.1), 0.45, -1.2 + i * 1.1, 6);
      c.rotation.z = Math.PI / 2;
    }
  }
  // mástiles y velas
  const masts = [[-0.4, 5.0, 1.0], [1.8, 4.0, 0.8]];
  for (const [mz, mh, sw] of masts) {
    cyl(ship, 0.07, 0.1, mh, M.darkWood, 0, 0.6 + mh / 2, mz, 6);
    for (const [yy, s] of [[0.6 + mh * 0.45, 1.0], [0.6 + mh * 0.8, 0.72]]) {
      const yard = cyl(ship, 0.04, 0.04, 2.3 * s * sw + 0.3, M.darkWood, 0, yy + 0.65 * s, mz, 5);
      yard.rotation.z = Math.PI / 2;
      const pg = new THREE.PlaneGeometry(2.3 * s * sw, 1.3 * s, 6, 4);
      const pos = pg.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i);
        pos.setZ(i, -0.25 * (1 - (x / (1.15 * s * sw)) ** 2) * (0.6 + 0.4 * (1 - Math.abs(y) / (0.65 * s))));
      }
      pg.computeVertexNormals();
      const sail = new THREE.Mesh(pg, M.sail);
      sail.position.set(0, yy, mz + 0.08);
      sail.userData.sail = true;
      ship.add(sail);
    }
    const nest = cyl(ship, 0.25, 0.2, 0.2, M.darkWood, 0, 0.6 + mh * 0.68, mz, 8);
    nest.userData.nest = true;
  }
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6, 4, 1), M.flag);
  flag.position.set(0, 0.6 + 5.0 + 0.2, -0.4 - 0.45);
  flag.rotation.y = Math.PI / 2;
  flag.userData.flag = true;
  ship.add(flag);
  const bs = cyl(ship, 0.05, 0.08, 2.2, M.darkWood, 0, 1.0, len / 2 + 0.5, 5);
  bs.rotation.x = Math.PI / 2 - 0.35;
  // timón
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 4, 10), M.darkWood);
  wheel.position.set(0, 1.65, -len / 2 + 1.3);
  ship.add(wheel);
  shadowAll(ship);
  return ship;
}

export function makeRowboat(M) {
  const g = new THREE.Group();
  g.add(hullLayer(1.8, 0.8, 0.3, mat(0x7a5030), -0.15));
  g.add(hullLayer(1.7, 0.7, 0.03, M.deck, 0.1));
  for (const sx of [-1, 1]) {
    const o = cyl(g, 0.025, 0.025, 1.3, M.lightWood, sx * 0.5, 0.15, 0, 4);
    o.rotation.z = sx * 1.3;
  }
  shadowAll(g);
  return g;
}

export function makeWreck(M, tx) {
  const g = new THREE.Group();
  const old = mat(0x4a3a2a, { map: tx.plank });
  const h1 = hullLayer(5, 2.2, 0.9, old, -0.3);
  g.add(h1);
  box(g, 1.8, 0.05, 3.5, mat(0x6a5a40, { map: tx.plank }), 0, 0.5, 0.3, 1);
  const m = cyl(g, 0.08, 0.1, 3.5, mat(0x3a2a1a), 0.3, 1.5, -0.5, 6);
  m.rotation.z = 0.6;
  m.rotation.x = 0.2;
  for (let i = 0; i < 5; i++) {
    const r = box(g, 0.15, 0.6 + i * 0.1, 0.08, old, 1.0, 0.5, -1.5 + i * 0.7);
    r.rotation.z = -0.4;
  }
  g.rotation.set(0.12, 0.7, 0.18);
  g.position.set(0, 0, 0);
  return g;
}

// ---------------------------------------------------------------- árboles y vegetación instanciada
function colored(geo, color) {
  let g = geo.index ? geo.toNonIndexed() : geo;
  g.deleteAttribute('uv');
  const c = new THREE.Color(color);
  const n = g.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = c.r;
    arr[i * 3 + 1] = c.g;
    arr[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
}
function at(geo, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(sx, sy, sz),
  );
  geo.applyMatrix4(m);
  return geo;
}

export function treeGeometries() {
  const trunk = 0x6b4a2b;
  const G = {};
  G.pine = mergeGeometries([
    colored(at(new THREE.CylinderGeometry(0.07, 0.1, 0.5, 6), 0, 0.25, 0), trunk),
    colored(at(new THREE.ConeGeometry(0.55, 0.8, 7), 0, 0.75, 0), 0x2f7a3e),
    colored(at(new THREE.ConeGeometry(0.44, 0.72, 7), 0, 1.15, 0), 0x358a45),
    colored(at(new THREE.ConeGeometry(0.3, 0.62, 7), 0, 1.55, 0), 0x3d9a4c),
  ]);
  const blob = (r, x, y, z, c) => colored(at(new THREE.IcosahedronGeometry(r, 1), x, y, z), c);
  G.oak = mergeGeometries([
    colored(at(new THREE.CylinderGeometry(0.07, 0.1, 0.75, 6), 0, 0.375, 0), trunk),
    blob(0.48, 0, 1.12, 0, 0x4f9a3a),
    blob(0.36, 0.28, 0.98, 0.08, 0x5aa842),
    blob(0.34, -0.22, 1.32, -0.1, 0x62b34a),
  ]);
  G.autumn = mergeGeometries([
    colored(at(new THREE.CylinderGeometry(0.07, 0.1, 0.75, 6), 0, 0.375, 0), trunk),
    blob(0.46, 0, 1.12, 0, 0xe0762a),
    blob(0.34, 0.27, 0.98, 0.1, 0xd0602a),
    blob(0.32, -0.22, 1.3, -0.1, 0xea8a34),
  ]);
  G.yellow = mergeGeometries([
    colored(at(new THREE.CylinderGeometry(0.05, 0.07, 0.9, 6), 0, 0.45, 0), 0x8a7a6a),
    blob(0.3, 0, 0.95, 0, 0xe0b030),
    blob(0.27, 0, 1.3, 0, 0xeac040),
    blob(0.19, 0, 1.58, 0, 0xf0cc50),
  ]);
  const palmParts = [];
  let px = 0, py = 0;
  for (let i = 0; i < 6; i++) {
    palmParts.push(colored(at(new THREE.CylinderGeometry(0.065, 0.08, 0.3, 6), px, py + 0.15, 0, 1, 1, 1, 0, 0, -0.08 * i), 0x9a7a52));
    px += 0.025 * i;
    py += 0.29;
  }
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const leaf = at(new THREE.BoxGeometry(0.75, 0.04, 0.18), 0.36, 0, 0, 1, 1, 1, 0, 0, -0.45);
    at(leaf, px, py + 0.02, 0, 1, 1, 1, 0, a, 0);
    palmParts.push(colored(leaf, i % 2 ? 0x3a9a3a : 0x48aa44));
  }
  for (let i = 0; i < 3; i++) {
    palmParts.push(colored(at(new THREE.IcosahedronGeometry(0.06, 0), px + Math.cos(i * 2) * 0.08, py - 0.06, Math.sin(i * 2) * 0.08), 0x5a3a1a));
  }
  G.palm = mergeGeometries(palmParts);
  // cactus del desierto
  G.cactus = mergeGeometries([
    colored(at(new THREE.CylinderGeometry(0.13, 0.15, 1.1, 8), 0, 0.55, 0), 0x4a8a3a),
    colored(at(new THREE.SphereGeometry(0.13, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), 0, 1.1, 0), 0x4a8a3a),
    colored(at(new THREE.CylinderGeometry(0.08, 0.08, 0.3, 7), 0.22, 0.5, 0, 1, 1, 1, 0, 0, Math.PI / 2), 0x52963f),
    colored(at(new THREE.CylinderGeometry(0.08, 0.08, 0.42, 7), 0.36, 0.72, 0), 0x52963f),
    colored(at(new THREE.SphereGeometry(0.08, 7, 3, 0, Math.PI * 2, 0, Math.PI / 2), 0.36, 0.93, 0), 0x52963f),
    colored(at(new THREE.CylinderGeometry(0.07, 0.07, 0.22, 7), -0.18, 0.7, 0, 1, 1, 1, 0, 0, Math.PI / 2), 0x52963f),
    colored(at(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 7), -0.29, 0.86, 0), 0x52963f),
    colored(at(new THREE.IcosahedronGeometry(0.05, 0), 0, 1.2, 0), 0xe85a8a),
  ]);
  // árbol muerto (desierto y volcán)
  G.dead = mergeGeometries([
    colored(at(new THREE.CylinderGeometry(0.05, 0.1, 0.9, 6), 0, 0.45, 0, 1, 1, 1, 0, 0, 0.08), 0x5a4a3e),
    colored(at(new THREE.CylinderGeometry(0.03, 0.05, 0.5, 5), 0.16, 0.85, 0, 1, 1, 1, 0, 0, -0.8), 0x5a4a3e),
    colored(at(new THREE.CylinderGeometry(0.025, 0.04, 0.42, 5), -0.14, 0.95, 0.04, 1, 1, 1, 0.2, 0, 0.7), 0x5a4a3e),
    colored(at(new THREE.CylinderGeometry(0.02, 0.03, 0.3, 5), 0.02, 1.08, -0.1, 1, 1, 1, -0.6, 0, 0), 0x5a4a3e),
  ]);
  // árbol de la jungla: tronco alto, copa ancha en dos pisos y lianas
  G.jungle = mergeGeometries([
    colored(at(new THREE.CylinderGeometry(0.08, 0.13, 1.5, 7), 0, 0.75, 0), 0x6a4a2a),
    colored(at(new THREE.CylinderGeometry(0.62, 0.7, 0.26, 9), 0, 1.5, 0), 0x2a7a32),
    colored(at(new THREE.CylinderGeometry(0.42, 0.55, 0.24, 9), 0.05, 1.74, 0.03), 0x34903a),
    blob(0.28, 0.1, 1.92, 0, 0x3a9a42),
    colored(at(new THREE.BoxGeometry(0.03, 0.6, 0.03), 0.45, 1.15, 0.2), 0x3a7a2a),
    colored(at(new THREE.BoxGeometry(0.03, 0.45, 0.03), -0.4, 1.22, -0.25), 0x3a7a2a),
    colored(at(new THREE.BoxGeometry(0.03, 0.5, 0.03), -0.1, 1.2, 0.5), 0x3a7a2a),
    colored(at(new THREE.ConeGeometry(0.16, 0.25, 5), 0.15, 0.12, 0.05, 1, 1, 1, 0, 0, -0.7), 0x6a4a2a),
    colored(at(new THREE.ConeGeometry(0.16, 0.25, 5), -0.15, 0.12, -0.05, 1, 1, 1, 0, 0, 0.7), 0x6a4a2a),
  ]);

  // roca
  const rg = new THREE.IcosahedronGeometry(0.42, 0);
  const rr = mulberry32(5);
  const pos = rg.attributes.position;
  const seen = new Map();
  for (let i = 0; i < pos.count; i++) {
    const k = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
    if (!seen.has(k)) seen.set(k, 0.8 + rr() * 0.35);
    const s = seen.get(k);
    pos.setXYZ(i, pos.getX(i) * s, pos.getY(i) * s * 0.75, pos.getZ(i) * s);
  }
  rg.computeVertexNormals();
  rg.translate(0, 0.22, 0);
  G.rock = colored(rg, 0xa8a8a2);

  // decoración
  G.tuft = mergeGeometries([
    colored(at(new THREE.ConeGeometry(0.035, 0.2, 3), 0, 0.1, 0, 1, 1, 1, 0.2, 0, 0.15), 0x4f9a3a),
    colored(at(new THREE.ConeGeometry(0.035, 0.24, 3), 0.06, 0.12, 0.02, 1, 1, 1, -0.1, 0, -0.25), 0x5aa842),
    colored(at(new THREE.ConeGeometry(0.03, 0.18, 3), -0.05, 0.09, 0.04, 1, 1, 1, 0.1, 0, 0.3), 0x62b34a),
  ]);
  G.flower = mergeGeometries([
    colored(at(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 3), 0, 0.1, 0), 0xffffff),
    colored(at(new THREE.IcosahedronGeometry(0.055, 0), 0, 0.22, 0), 0xffffff),
  ]);
  G.mushroom = mergeGeometries([
    colored(at(new THREE.CylinderGeometry(0.03, 0.04, 0.12, 5), 0, 0.06, 0), 0xf0ead8),
    colored(at(new THREE.SphereGeometry(0.09, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2), 0, 0.11, 0), 0xc83a2a),
  ]);
  G.pebble = colored(at(new THREE.IcosahedronGeometry(0.06, 0), 0, 0.02, 0, 1.3, 0.6, 1), 0xbab8b0);
  G.shell = colored(at(new THREE.ConeGeometry(0.06, 0.06, 5), 0, 0.03, 0, 1, 1, 1.4), 0xf0c8b8);
  G.wheat = mergeGeometries([
    colored(at(new THREE.BoxGeometry(0.04, 0.45, 0.04), -0.15, 0.22, 0, 1, 1, 1, 0, 0, 0.1), 0xd8b040),
    colored(at(new THREE.BoxGeometry(0.04, 0.5, 0.04), 0.0, 0.25, 0.1, 1, 1, 1, 0.1, 0, 0), 0xe0bc48),
    colored(at(new THREE.BoxGeometry(0.04, 0.42, 0.04), 0.15, 0.21, -0.05, 1, 1, 1, -0.1, 0, -0.1), 0xd0a838),
    colored(at(new THREE.BoxGeometry(0.04, 0.48, 0.04), 0.05, 0.24, -0.15, 1, 1, 1, 0, 0, 0.05), 0xe0bc48),
    colored(at(new THREE.BoxGeometry(0.04, 0.44, 0.04), -0.08, 0.22, 0.18, 1, 1, 1, 0, 0, -0.1), 0xd8b040),
  ]);
  return G;
}

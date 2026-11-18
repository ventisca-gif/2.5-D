// Personajes v2: cuerpos estructurados (formas redondeadas, articulaciones, cara, armaduras).
// Cada parte articulada se "hornea" en una sola malla con colores por vértice
// para mantener pocas llamadas de dibujo en móvil.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { faceTexture, animeHeadGeo, animeHair, BUST, EYE_COLORS } from './anime.js';

// ------------------------------------------------------------------ geometrías base (cacheadas)
const G = new Map();
function geo(key, make) {
  if (!G.has(key)) G.set(key, make());
  return G.get(key);
}
const rbox = (w, h, d, r = 0.04) => geo(`rb${w},${h},${d},${r}`, () => new RoundedBoxGeometry(w, h, d, 3, r));
const sph = (r, ws = 14, hs = 10) => geo(`s${r},${ws}`, () => new THREE.SphereGeometry(r, ws, hs));
const hemi = (r) => geo(`h${r}`, () => new THREE.SphereGeometry(r, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2));
const cyl = (rt, rb, h, s = 12, open = false) => geo(`c${rt},${rb},${h},${s},${open}`, () => new THREE.CylinderGeometry(rt, rb, h, s, 1, open));
const cap = (r, l) => geo(`k${r},${l}`, () => new THREE.CapsuleGeometry(r, l, 4, 10));
const cone = (r, h, s = 8) => geo(`n${r},${h},${s}`, () => new THREE.ConeGeometry(r, h, s));
const torus = (r, t) => geo(`t${r},${t}`, () => new THREE.TorusGeometry(r, t, 6, 18));

function lathe(points, seg = 16) {
  return geo('L' + JSON.stringify(points), () => new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), seg));
}
function horn(side) {
  return geo('horn' + side, () => {
    const c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0), new THREE.Vector3(side * 0.07, 0.05, 0), new THREE.Vector3(side * 0.11, 0.14, -0.02), new THREE.Vector3(side * 0.09, 0.24, -0.05),
    ]);
    const g = new THREE.TubeGeometry(c, 10, 0.022, 6, false);
    // afilar la punta
    const pos = g.attributes.position;
    const segs = 10, rad = 6;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const center = c.getPointAt(t);
      const k = 1 - t * 0.85;
      for (let j = 0; j <= rad; j++) {
        const idx = i * (rad + 1) + j;
        const v = new THREE.Vector3().fromBufferAttribute(pos, idx).sub(center).multiplyScalar(k).add(center);
        pos.setXYZ(idx, v.x, v.y, v.z);
      }
    }
    g.computeVertexNormals();
    return g;
  });
}
function bladeGeo(len, wid) {
  return geo(`bl${len},${wid}`, () => {
    const s = new THREE.Shape();
    s.moveTo(-wid / 2, 0);
    s.lineTo(wid / 2, 0);
    s.lineTo(wid / 2, len * 0.85);
    s.lineTo(0, len);
    s.lineTo(-wid / 2, len * 0.85);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 1 });
    g.translate(0, 0, -0.006);
    return g;
  });
}

// ------------------------------------------------------------------ constructor de partes
class Part {
  constructor(parent, x = 0, y = 0, z = 0) {
    this.g = new THREE.Group();
    this.g.position.set(x, y, z);
    parent.add(this.g);
    this.items = [];
  }
  add(geometry, color, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
      new THREE.Vector3(sx, sy, sz),
    );
    this.items.push({ geometry, color, m });
    return this;
  }
  bake(material) {
    if (!this.items.length) return null;
    const list = this.items.map(({ geometry, color, m }) => {
      let g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
      g.applyMatrix4(m);
      for (const n of Object.keys(g.attributes)) if (n !== 'position' && n !== 'normal') g.deleteAttribute(n);
      const c = new THREE.Color(color);
      const n = g.attributes.position.count;
      const arr = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
      g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
      g.clearGroups();
      return g;
    });
    const merged = mergeGeometries(list, false);
    // sombreado suave: zonas bajas y caras hacia abajo un poco más oscuras (da volumen a la tela)
    merged.computeBoundingBox();
    const bb = merged.boundingBox;
    const hgt = Math.max(0.001, bb.max.y - bb.min.y);
    const pos = merged.attributes.position, nor = merged.attributes.normal, col = merged.attributes.color;
    for (let i = 0; i < pos.count; i++) {
      const t = (pos.getY(i) - bb.min.y) / hgt;
      const k = (0.82 + 0.18 * t) * (0.86 + 0.14 * (nor.getY(i) * 0.5 + 0.5));
      col.setXYZ(i, col.getX(i) * k, col.getY(i) * k, col.getZ(i) * k);
    }
    const mesh = new THREE.Mesh(merged, material);
    mesh.castShadow = true;
    this.g.add(mesh);
    if (!this.noOutline) {
      const o = new THREE.Mesh(merged, OUTLINE);
      o.raycast = () => {};
      this.g.add(o);
    }
    return mesh;
  }
}

const shade = (c, k) => new THREE.Color(c).multiplyScalar(k).getHex();

// Peinados (con sombrero se omiten las partes de arriba)
function hairStyle(H, style, c, hat, hood) {
  const top = !hat;
  const base = () => {
    if (top) H.add(rbox(0.29, 0.09, 0.27, 0.045), c, 0, 0.27, -0.005);
    if (!hood) {
      H.add(rbox(0.285, 0.17, 0.06, 0.03), c, 0, 0.19, -0.115);
      H.add(rbox(0.05, 0.12, 0.2, 0.02), c, -0.135, 0.2, -0.02);
      H.add(rbox(0.05, 0.12, 0.2, 0.02), c, 0.135, 0.2, -0.02);
    }
  };
  const fringe = () => { if (top) H.add(rbox(0.22, 0.05, 0.06, 0.02), c, 0.02, 0.265, 0.11, 0.35, 0, -0.12); };
  if (hood) {
    if (style === 'largo' || style === 'trenza' || style === 'rizos') H.add(rbox(0.12, 0.2, 0.04, 0.02), c, 0.07, 0.04, 0.12);
    return;
  }
  switch (style) {
    case 'corto': base(); fringe(); break;
    case 'punta':
      base();
      if (top) for (let i = 0; i < 6; i++) H.add(cone(0.04, 0.12, 5), c, -0.1 + (i % 3) * 0.1, 0.32, -0.06 + Math.floor(i / 3) * 0.1, -0.5 + Math.floor(i / 3) * 0.6, 0, (i % 3 - 1) * -0.35);
      break;
    case 'cresta':
      H.add(rbox(0.285, 0.12, 0.05, 0.02), shade(c, 0.6), 0, 0.17, -0.12);
      if (top) H.add(rbox(0.06, 0.14, 0.3, 0.025), c, 0, 0.32, -0.01);
      break;
    case 'coleta':
      base(); fringe();
      H.add(sph(0.045, 8, 6), c, 0, 0.2, -0.15);
      H.add(cap(0.035, 0.14), c, 0, 0.08, -0.17, 0.2, 0, 0);
      break;
    case 'rizado':
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2, y = 0.22 + (i % 2) * 0.05;
        if (!top && Math.cos(a) > -0.2) continue;
        H.add(sph(0.055, 8, 6), c, Math.sin(a) * 0.13, y, Math.cos(a) * 0.11 - 0.02);
      }
      if (top) H.add(sph(0.12, 10, 8), c, 0, 0.27, -0.01, 0, 0, 0, 1.15, 0.6, 1.1);
      break;
    case 'calvo':
      H.add(rbox(0.285, 0.05, 0.05, 0.02), shade(c, 0.8), 0, 0.12, -0.12);
      break;
    case 'largo':
      base(); fringe();
      H.add(rbox(0.28, 0.34, 0.07, 0.03), c, 0, 0.0, -0.12);
      for (const sx of [-1, 1]) H.add(rbox(0.05, 0.24, 0.07, 0.02), c, sx * 0.135, 0.06, 0.05);
      break;
    case 'trenza':
      base(); fringe();
      for (let i = 0; i < 6; i++) H.add(sph(0.038 - i * 0.003, 8, 6), c, 0, 0.12 - i * 0.065, -0.16 - i * 0.004);
      H.add(torus(0.025, 0.008), 0xc83a5a, 0, -0.24, -0.17, Math.PI / 2, 0, 0);
      break;
    case 'mono':
      base(); fringe();
      if (top) { H.add(sph(0.075, 10, 8), c, 0, 0.33, -0.08); H.add(torus(0.05, 0.01), 0xc83a5a, 0, 0.3, -0.07, 1.0, 0, 0); }
      else H.add(sph(0.065, 10, 8), c, 0, 0.18, -0.17);
      break;
    case 'melena':
      if (top) H.add(rbox(0.31, 0.1, 0.29, 0.045), c, 0, 0.27, -0.01);
      H.add(rbox(0.31, 0.24, 0.2, 0.06), c, 0, 0.13, -0.06);
      fringe();
      break;
    case 'rizos':
      base();
      for (let i = 0; i < 16; i++) {
        const a = Math.PI * 0.35 + (i / 15) * Math.PI * 1.3, y = 0.2 - (i % 3) * 0.08;
        H.add(sph(0.05, 8, 6), c, Math.sin(a) * 0.15, y, Math.cos(a) * 0.12 - 0.03);
      }
      if (top) H.add(sph(0.12, 10, 8), c, 0, 0.27, -0.01, 0, 0, 0, 1.2, 0.6, 1.15);
      break;
    default: base();
  }
}

// Contorno (casco invertido): misma geometría, empujada por la normal, solo caras traseras.
export const OUTLINE = new THREE.ShaderMaterial({
  uniforms: { thick: { value: 0.012 }, color: { value: new THREE.Color(0x120d0a) } },
  vertexShader: `uniform float thick;
    void main() {
      vec3 p = position + normalize(normal) * thick;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }`,
  fragmentShader: `uniform vec3 color; void main() { gl_FragColor = vec4(color, 1.0); }`,
  side: THREE.BackSide,
});

// look: { shirt, pants, skin, hair, hat, hatColor, capColor, beard, dress, dressColor, apron, coat, cape,
//         armor, armorColor, trim, pauldron, sword, blade, guard, spear, rod, longHair, eyepatch, bone, eyeGlow, gloves, boots }
export function makeHumanoid2(look = {}) {
  const mat = new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 28, specular: 0x202020 });
  const capeMat = new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 10, specular: 0x101010, side: THREE.DoubleSide });
  for (const m of [mat, capeMat]) m.userData.baseEmissive = new THREE.Color(look.eyeGlow && m === mat ? 0x000000 : 0x000000);
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const skin = look.skin ?? 0xe8b98f;
  const shirt = look.shirt ?? 0x3a6aa0;
  const pants = look.pants ?? 0x4a3a2a;
  const boots = look.boots ?? 0x3a2618;
  const trim = look.trim ?? 0xd8a838;
  const bone = look.bone;
  const armorC = look.armorColor ?? 0xa8b0bc;
  const hairC = look.hair;

  const parts = [];
  const extraMats = [];
  const P = (parent, x, y, z) => { const p = new Part(parent, x, y, z); parts.push(p); return p; };

  // ---------------- piernas (pivote en la cadera)
  const legs = [];
  for (const s of [-1, 1]) {
    const leg = P(body, s * 0.085, 0.42, 0);
    if (bone) {
      leg.add(cyl(0.022, 0.02, 0.2), bone, 0, -0.1, 0);
      leg.add(sph(0.034), bone, 0, -0.205, 0);
      leg.add(cyl(0.02, 0.018, 0.16), bone, 0, -0.3, 0);
      leg.add(rbox(0.07, 0.04, 0.12, 0.015), bone, 0, -0.4, 0.02);
    } else {
      leg.add(cyl(0.07, 0.06, 0.2), pants, 0, -0.1, 0);
      leg.add(sph(0.06), pants, 0, -0.2, 0.005);
      leg.add(cyl(0.058, 0.052, 0.12), pants, 0, -0.27, 0);
      // bota
      leg.add(cyl(0.064, 0.068, 0.13), boots, 0, -0.335, 0);
      leg.add(cyl(0.072, 0.072, 0.025), shade(boots, 0.75), 0, -0.275, 0);
      leg.add(sph(0.068, 12, 8), boots, 0, -0.39, 0.035, 0, 0, 0, 1, 0.55, 1.45);
      leg.add(rbox(0.035, 0.03, 0.02, 0.008), trim, 0, -0.3, 0.068);
      if (look.bootCuff) leg.add(cyl(0.082, 0.076, 0.06, 12), shade(boots, 1.35), 0, -0.255, 0);
      const la = look.legArmor ?? (look.armor && !look.noAutoLegs ? armorC : null);
      if (la) {
        leg.add(sph(0.048, 10, 8), la, 0, -0.2, 0.05, 0, 0, 0, 1, 1, 0.7);
        leg.add(sph(0.018, 6, 4), trim, 0, -0.2, 0.085);
        leg.add(cyl(0.066, 0.06, 0.11, 12), shade(la, 0.92), 0, -0.29, 0.01, 0, 0, 0, 1, 1, 1);
        leg.add(sph(0.06, 10, 6), shade(la, 0.85), 0, -0.375, 0.06, 0, 0, 0, 1, 0.45, 1.1);
        leg.add(cyl(0.064, 0.064, 0.15, 12), shade(la, 0.9), 0, -0.07, 0.008, 0, 0, 0, 1, 1, 0.9);
      }
    }
    legs.push(leg);
  }

  // ---------------- caderas
  const hips = P(body, 0, 0, 0);
  if (!bone) hips.add(cyl(0.13, 0.135, 0.11, 14), pants, 0, 0.44, 0, 0, 0, 0, 1, 1, 0.78);
  else hips.add(rbox(0.2, 0.06, 0.1, 0.025), bone, 0, 0.44, 0);

  // ---------------- torso
  const torso = P(body, 0, 0.44, 0);
  if (bone) {
    torso.add(cyl(0.018, 0.018, 0.4, 6), bone, 0, 0.18, -0.03);
    for (let i = 0; i < 4; i++) torso.add(torus(0.095 - i * 0.004, 0.012), bone, 0, 0.1 + i * 0.06, 0, Math.PI / 2, 0, 0, 1, 1, 0.75);
    torso.add(rbox(0.3, 0.05, 0.12, 0.02), bone, 0, 0.34, 0);
  } else {
    const chest = look.armor ? armorC : shirt;
    const fx = look.female ? 0.92 : 1;
    torso.add(lathe([[0.001, 0.0], [0.135, 0.0], [0.148, 0.08], [0.17, 0.2], [0.175, 0.29], [0.15, 0.35], [0.09, 0.385], [0.001, 0.39]]), chest, 0, 0, 0, 0, 0, 0, fx, 1, 0.74);
    if (look.female) {
      const bc = look.coat ? (look.vest ?? shirt) : chest;
      const bk = BUST[look.bust ?? 2];
      if (bk > 0) for (const sx of [-1, 1]) torso.add(sph(0.058 * bk, 12, 8), bc, sx * 0.062 * (0.85 + bk * 0.15), 0.245, 0.095 + (bk - 1) * 0.02, 0, 0, 0, 1, 0.9, 0.85);
    }
    if (look.armor) {
      torso.add(torus(0.172, 0.014), trim, 0, 0.27, 0, Math.PI / 2, 0, 0, 1, 0.74, 1);
      torso.add(rbox(0.06, 0.22, 0.03, 0.012), trim, 0, 0.17, 0.122);
      // gola, placas del abdomen y remaches
      torso.add(cyl(0.08, 0.1, 0.06, 14), shade(armorC, 0.88), 0, 0.37, 0, 0, 0, 0, 1, 1, 0.85);
      torso.add(torus(0.09, 0.008), trim, 0, 0.345, 0, Math.PI / 2, 0, 0, 1, 0.85, 1);
      for (let i = 0; i < 3; i++) torso.add(torus(0.149 + i * 0.006, 0.009), shade(armorC, 0.7), 0, 0.07 + i * 0.05, 0, Math.PI / 2, 0, 0, 1, 0.75, 1);
      for (let i = 0; i < 7; i++) {
        const a = -1.1 + i * (2.2 / 6);
        torso.add(sph(0.011, 6, 4), trim, Math.sin(a) * 0.176, 0.3, Math.cos(a) * 0.176 * 0.74);
      }
      if (look.emblem) {
        torso.add(rbox(0.085, 0.085, 0.02, 0.01), look.emblem, 0, 0.21, 0.13, 0, 0, Math.PI / 4);
        torso.add(rbox(0.05, 0.05, 0.022, 0.008), trim, 0, 0.21, 0.135, 0, 0, Math.PI / 4);
      }
      if (look.gem) torso.add(sph(0.022, 8, 6), look.gem, 0, 0.21, 0.145);
      // faldón (tabardo) de tela bajo la armadura
      torso.add(cyl(0.15, 0.19, 0.2, 14), shirt, 0, -0.06, 0, 0, 0, 0, 1, 1, 0.78);
    }
    if (look.vest) {
      for (const sx of [-1, 1]) torso.add(rbox(0.1, 0.28, 0.02, 0.01), look.vest, sx * 0.066, 0.19, 0.121 - 0.006, 0, sx * 0.32, 0);
      for (let i = 0; i < 3; i++) torso.add(sph(0.011, 6, 4), trim, 0.018, 0.11 + i * 0.07, 0.137);
    }
    if (look.tabard) {
      torso.add(rbox(0.17, 0.27, 0.022, 0.01), look.tabard, 0, 0.18, 0.13);
      torso.add(rbox(0.17, 0.27, 0.022, 0.01), look.tabard, 0, 0.18, -0.13);
      torso.add(rbox(0.16, 0.24, 0.022, 0.01), look.tabard, 0, -0.1, 0.13, -0.06, 0, 0);
      torso.add(rbox(0.16, 0.24, 0.022, 0.01), look.tabard, 0, -0.1, -0.13, 0.06, 0, 0);
      torso.add(rbox(0.165, 0.02, 0.026, 0.006), trim, 0, -0.215, 0.137);
      torso.add(rbox(0.06, 0.06, 0.026, 0.008), trim, 0, 0.2, 0.142, 0, 0, Math.PI / 4);
      torso.add(rbox(0.02, 0.12, 0.028, 0.006), trim, 0, 0.2, 0.144);
    }
    if (look.coat) {
      torso.add(cyl(0.155, 0.21, 0.3, 14), shirt, 0, -0.11, 0, 0, 0, 0, 1, 1, 0.8);
      for (const sx of [-1, 1]) {
        torso.add(rbox(0.13, 0.3, 0.022, 0.01), shade(shirt, 0.9), sx * 0.07, -0.16, -0.15, 0.12, 0, sx * 0.06);
        torso.add(rbox(0.07, 0.025, 0.03, 0.008), trim, sx * 0.1, -0.04, 0.155);
        torso.add(rbox(0.05, 0.14, 0.02, 0.01), shade(shirt, 0.75), sx * 0.085, 0.29, 0.12, 0, 0, -sx * 0.4);
      }
      torso.add(rbox(0.035, 0.36, 0.02, 0.01), trim, 0.055, 0.08, 0.125, 0, 0, 0.12);
      torso.add(rbox(0.035, 0.36, 0.02, 0.01), trim, -0.055, 0.08, 0.125, 0, 0, -0.12);
      for (let i = 0; i < 3; i++) torso.add(sph(0.014, 6, 4), trim, 0, 0.06 + i * 0.07, 0.13);
    }
    if (look.dress) torso.add(cyl(0.15, 0.25, 0.38, 16), look.dressColor ?? shirt, 0, -0.2, 0, 0, 0, 0, 1, 1, 0.85);
    if (look.dress) torso.add(torus(0.245, 0.014), shade(look.dressColor ?? shirt, 0.7), 0, -0.38, 0, Math.PI / 2, 0, 0, 1, 0.85, 1);
    if (look.robe) {
      torso.add(cyl(0.15, 0.23, 0.36, 16), look.robe, 0, -0.18, 0, 0, 0, 0, 1, 1, 0.82);
      torso.add(torus(0.226, 0.013), trim, 0, -0.33, 0, Math.PI / 2, 0, 0, 1, 0.82, 1);
      torso.add(rbox(0.1, 0.34, 0.03, 0.012), trim, 0, -0.16, 0.16, -0.12, 0, 0);
    }
    if (look.apron) {
      torso.add(rbox(0.2, 0.42, 0.02, 0.01), look.apron, 0, 0.05, 0.128);
      torso.add(rbox(0.12, 0.07, 0.024, 0.008), shade(look.apron, 0.8), 0, -0.02, 0.135);
    }
    if (look.cravat) for (let i = 0; i < 3; i++) torso.add(sph(0.032 - i * 0.004, 8, 6), 0xf4efe4, 0, 0.34 - i * 0.035, 0.12 - i * 0.004, 0, 0, 0, 1.2, 0.8, 0.7);
    if (look.baldric) {
      torso.add(rbox(0.035, 0.46, 0.016, 0.006), look.baldric, 0, 0.19, 0.127, 0, 0, 0.62);
      torso.add(rbox(0.035, 0.46, 0.016, 0.006), look.baldric, 0, 0.19, -0.127, 0, 0, -0.62);
      torso.add(rbox(0.03, 0.03, 0.02, 0.006), trim, 0.03, 0.22, 0.135);
    }
    if (look.quiver) {
      torso.add(cyl(0.045, 0.04, 0.32, 10), 0x6a4426, 0.07, 0.2, -0.17, 0, 0, -0.35);
      for (let i = 0; i < 3; i++) {
        torso.add(cyl(0.006, 0.006, 0.14, 4), 0xc8a070, 0.13 + i * 0.015, 0.4, -0.17 - (i - 1) * 0.015, 0, 0, -0.35);
        torso.add(cone(0.016, 0.05, 4), 0xe8e0d0, 0.155 + i * 0.015, 0.47, -0.17 - (i - 1) * 0.015, 0, 0, -0.35);
      }
    }
    if (look.backpack) {
      torso.add(rbox(0.22, 0.24, 0.1, 0.03), look.backpack, 0, 0.2, -0.17);
      torso.add(rbox(0.22, 0.08, 0.11, 0.025), shade(look.backpack, 0.8), 0, 0.3, -0.17);
    }
    if (look.scarf) {
      torso.add(torus(0.07, 0.026), look.scarf, 0, 0.385, 0, Math.PI / 2, 0, 0, 1, 0.9, 1);
      torso.add(rbox(0.05, 0.13, 0.02, 0.01), look.scarf, 0.05, 0.31, 0.115, 0.1, 0, 0.25);
    }
    if (!look.armor && !look.cravat && !look.scarf) torso.add(torus(0.062, 0.014), shade(shirt, 0.78), 0, 0.385, 0, Math.PI / 2, 0, 0);
    if (!look.dress && !look.robe) torso.add(rbox(0.06, 0.07, 0.04, 0.012), 0x6a4426, -0.13, -0.01, 0.07, 0, -0.5, 0);
    // cinturón (o fajín)
    if (look.sash) {
      torso.add(cyl(0.15, 0.15, 0.065, 14), look.sash, 0, 0.03, 0, 0, 0, 0, 1, 1, 0.8);
      torso.add(sph(0.03, 8, 6), look.sash, 0.12, 0.03, 0.07);
      torso.add(rbox(0.04, 0.14, 0.018, 0.008), look.sash, 0.13, -0.05, 0.075, 0, 0, 0.15);
    }
    torso.add(cyl(0.146, 0.146, 0.04, 14), look.belt ?? 0x3a2414, 0, 0.03, 0, 0, 0, 0, 1, 1, 0.78);
    torso.add(rbox(0.05, 0.04, 0.02, 0.008), trim, 0, 0.03, 0.118);
    torso.add(cyl(0.05, 0.055, 0.05, 10), skin, 0, 0.4, 0);
  }

  // ---------------- capa
  let cape = null;
  if (look.cape) {
    cape = P(torso.g, 0, 0.36, -0.02);
    const capeG = geo('capeG', () => new THREE.CylinderGeometry(0.17, 0.28, 0.66, 14, 3, true, Math.PI - Math.PI * 0.42, Math.PI * 0.84));
    cape.add(capeG, look.cape, 0, -0.33, 0.04, 0, 0, 0, 1, 1, 0.8);
    cape.noOutline = true;
    const hemG = geo('capeHem', () => new THREE.CylinderGeometry(0.283, 0.283, 0.03, 14, 1, true, Math.PI - Math.PI * 0.42, Math.PI * 0.84));
    cape.add(hemG, trim, 0, -0.65, 0.04, 0, 0, 0, 1, 1, 0.8);
    cape.add(cyl(0.03, 0.03, 0.02, 8), trim, 0.13, 0.0, 0.06, Math.PI / 2, 0, 0);
    cape.add(cyl(0.03, 0.03, 0.02, 8), trim, -0.13, 0.0, 0.06, Math.PI / 2, 0, 0);
  }

  // ---------------- brazos (pivote en el hombro)
  const arms = [];
  for (const s of [-1, 1]) {
    const arm = P(torso.g, s * 0.205, 0.32, 0);
    const sleeve = look.sleeve ?? (look.armor ? armorC : shirt);
    if (bone) {
      arm.add(sph(0.035), bone, 0, 0, 0);
      arm.add(cyl(0.018, 0.016, 0.15, 6), bone, 0, -0.09, 0);
      arm.add(cyl(0.016, 0.014, 0.13, 6), bone, 0, -0.23, 0);
      arm.add(sph(0.03, 8, 6), bone, 0, -0.31, 0);
    } else {
      arm.add(sph(0.065), sleeve, 0, -0.01, 0);
      arm.add(cap(0.052, 0.1), sleeve, 0, -0.1, 0);
      arm.add(cap(0.046, 0.08), look.gloves ?? sleeve, 0, -0.21, 0.005);
      if (look.armor || look.bracers) {
        arm.add(cyl(0.056, 0.05, 0.08, 10), look.bracerColor ?? shade(armorC, 0.92), 0, -0.22, 0.005);
        arm.add(torus(0.054, 0.007), trim, 0, -0.185, 0.005, Math.PI / 2, 0, 0);
        if (look.bracers && !look.armor) for (let k = 0; k < 2; k++) arm.add(torus(0.053, 0.005), 0xd8c8a0, 0, -0.205 - k * 0.03, 0.005, Math.PI / 2, 0, 0);
      }
      if (look.armor) {
        arm.add(cyl(0.06, 0.056, 0.09, 10), shade(armorC, 0.95), 0, -0.09, 0);
        arm.add(sph(0.04, 8, 6), shade(armorC, 0.85), 0, -0.165, -0.03);
      }
      if (look.coat) {
        arm.add(cyl(0.06, 0.066, 0.065, 10), shade(shirt, 0.85), 0, -0.235, 0.005);
        arm.add(torus(0.064, 0.007), trim, 0, -0.205, 0.005, Math.PI / 2, 0, 0);
      } else if (!look.armor && !look.bracers) arm.add(torus(0.048, 0.011), shade(sleeve, 0.72), 0, -0.25, 0.005, Math.PI / 2, 0, 0);
      arm.add(sph(0.048, 10, 8), look.gloves ?? (look.armor ? shade(armorC, 0.8) : skin), 0, -0.3, 0.01);
    }
    if (look.armor || look.pauldron) {
      const pc = look.pauldron ?? armorC;
      arm.add(hemi(0.095), pc, s * 0.01, 0.0, 0, 0, 0, s * -0.35, 1, 0.75, 1);
      arm.add(torus(0.085, 0.012), trim, s * 0.01, -0.005, 0, Math.PI / 2, s * -0.35, 0);
      arm.add(hemi(0.085), shade(pc, 0.82), s * 0.025, -0.045, 0, 0, 0, s * -0.55, 1, 0.6, 0.95);
      arm.add(sph(0.012, 6, 4), trim, s * 0.035, 0.06, 0.04);
      arm.add(sph(0.012, 6, 4), trim, s * 0.035, 0.06, -0.04);
      if (look.spikes) for (const z of [-0.035, 0.035]) arm.add(cone(0.02, 0.09, 6), trim, s * 0.05, 0.08, z, 0, 0, s * -0.6);
    }
    arms.push(arm);
  }

  // ---------------- escudo en el brazo izquierdo
  if (look.shield && !bone) {
    const sh = look.shield, a = arms[0];
    if (sh.type === 'round') {
      a.add(cyl(0.17, 0.17, 0.035, 18), sh.color, -0.075, -0.2, 0.03, 0, 0, Math.PI / 2);
      for (const dz of [-0.06, 0.06]) a.add(rbox(0.006, 0.3, 0.012, 0.003), shade(sh.color, 0.7), -0.094, -0.2, 0.03 + dz);
      a.add(torus(0.17, 0.016), sh.rim, -0.09, -0.2, 0.03, 0, Math.PI / 2, 0);
      a.add(sph(0.045, 10, 8), sh.boss, -0.1, -0.2, 0.03, 0, 0, 0, 0.6, 1, 1);
      for (let i = 0; i < 6; i++) { const t = (i / 6) * Math.PI * 2; a.add(sph(0.01, 4, 3), sh.rim, -0.096, -0.2 + Math.sin(t) * 0.13, 0.03 + Math.cos(t) * 0.13); }
    } else {
      a.add(rbox(0.03, 0.4, 0.29, 0.04), sh.rim, -0.072, -0.21, 0.03);
      a.add(rbox(0.032, 0.36, 0.25, 0.035), sh.color, -0.082, -0.21, 0.03);
      a.add(cone(0.12, 0.12, 4), sh.color, -0.082, -0.43, 0.03, Math.PI, Math.PI / 4, 0, 0.18, 1, 1);
      a.add(rbox(0.02, 0.12, 0.12, 0.02), sh.boss, -0.1, -0.2, 0.03, Math.PI / 4, 0, 0);
      a.add(rbox(0.02, 0.2, 0.025, 0.008), shade(sh.rim, 1.2), -0.1, -0.2, 0.03);
    }
  }

  // ---------------- arma en la mano derecha
  let weapon = null;
  if (look.sword) {
    weapon = P(arms[1].g, 0, -0.3, 0.02);
    const w = weapon;
    w.add(cyl(0.016, 0.016, 0.09, 6), 0x4a2a14, 0, 0, 0);
    w.add(sph(0.024, 8, 6), look.guard ?? trim, 0, 0.055, 0);
    w.add(rbox(0.14, 0.022, 0.035, 0.008), look.guard ?? trim, 0, -0.05, 0);
    w.add(bladeGeo(look.bladeLen ?? 0.46, look.bladeW ?? 0.05), look.blade ?? 0xdde2ea, 0, -0.06, 0, Math.PI, 0, 0);
    w.g.rotation.x = 0.25;
  } else if (look.spear) {
    weapon = P(arms[1].g, 0, -0.3, 0.02);
    weapon.add(cyl(0.016, 0.016, 1.45, 6), 0x6a4a2a, 0, 0.35, 0);
    weapon.add(cone(0.04, 0.16, 6), 0xc8ccd4, 0, 1.15, 0);
    weapon.add(torus(0.022, 0.008), trim, 0, 1.06, 0, Math.PI / 2, 0, 0);
  } else if (look.rod) {
    weapon = P(arms[1].g, 0, -0.3, 0.02);
    weapon.add(cyl(0.01, 0.016, 1.3, 5), 0x7a5a3a, 0, 0.25, 0.5, 1.0, 0, 0);
  }

  // ---------------- cabeza
  const head = P(torso.g, 0, 0.43, 0);
  if (bone) {
    head.add(rbox(0.25, 0.22, 0.24, 0.08), bone, 0, 0.14, 0);
    head.add(rbox(0.17, 0.07, 0.17, 0.03), bone, 0, 0.02, 0.025);
    const eye = look.eyeGlow ?? 0x141010;
    head.add(sph(0.035, 8, 6), eye, -0.055, 0.14, 0.105, 0, 0, 0, 1, 1.1, 0.6);
    head.add(sph(0.035, 8, 6), eye, 0.055, 0.14, 0.105, 0, 0, 0, 1, 1.1, 0.6);
    head.add(cone(0.016, 0.03, 3), 0x141010, 0, 0.09, 0.118, Math.PI, 0, 0);
    for (let i = 0; i < 4; i++) head.add(rbox(0.018, 0.022, 0.01, 0.004), 0xf8f4e8, -0.03 + i * 0.02, 0.035, 0.11);
  } else if (look.anime) {
    // cabeza anime: malla propia con la cara pintada en textura
    head.add(sph(0.032, 8, 6), skin, -0.15, 0.135, 0.0, 0, 0, 0, 0.55, 1.1, 0.85);
    head.add(sph(0.032, 8, 6), skin, 0.15, 0.135, 0.0, 0, 0, 0, 0.55, 1.1, 0.85);
    const fmat = new THREE.MeshPhongMaterial({
      map: faceTexture({ skin, eye: EYE_COLORS[look.eyeColor ?? 0].c, face: look.face || (look.female ? 'dulce' : 'heroico'), female: !!look.female, hair: hairC ?? 0x3a2a1a, size: look.faceRes || 256 }),
      shininess: 10, specular: 0x111111,
    });
    fmat.userData.baseEmissive = new THREE.Color(0);
    const fm = new THREE.Mesh(animeHeadGeo(), fmat);
    fm.position.set(0, 0.15, 0);
    fm.castShadow = true;
    const fo = new THREE.Mesh(animeHeadGeo(), OUTLINE);
    fo.position.copy(fm.position);
    fo.rotation.copy(fm.rotation);
    head.g.add(fm, fo);
    extraMats.push(fmat);
  } else {
    head.add(rbox(0.27, 0.26, 0.25, 0.085), skin, 0, 0.14, 0);
    head.add(sph(0.045, 8, 6), skin, -0.136, 0.13, 0, 0, 0, 0, 0.5, 1, 0.8);
    head.add(sph(0.045, 8, 6), skin, 0.136, 0.13, 0, 0, 0, 0, 0.5, 1, 0.8);
    // cara
    const eye = look.eyeColor ?? 0x1a1414;
    for (const s of [-1, 1]) {
      head.add(sph(0.022, 8, 6), eye, s * 0.055, 0.15, 0.124, 0, 0, 0, 1, 1.35, 0.5);
      head.add(sph(0.007, 4, 3), 0xffffff, s * 0.055 + 0.006, 0.16, 0.133);
      head.add(rbox(0.055, 0.014, 0.01, 0.005), hairC ?? shade(skin, 0.55), s * 0.056, 0.195, 0.125, 0, 0, s * -0.12);
    }
    head.add(sph(0.022, 8, 6), shade(skin, 0.9), 0, 0.115, 0.128, 0, 0, 0, 0.9, 0.8, 0.8);
    head.add(rbox(0.05, 0.01, 0.01, 0.004), look.female ? 0xc8505a : 0x7a3a30, 0, 0.068, 0.124);
    if (look.female) for (const sx of [-1, 1]) head.add(rbox(0.04, 0.008, 0.012, 0.003), 0x141010, sx * 0.062, 0.178, 0.129, 0, 0, sx * 0.25);
    if (!look.beard) {
      head.add(sph(0.022, 6, 4), 0xf09a8a, -0.085, 0.1, 0.11, 0, 0, 0, 1, 0.6, 0.4);
      head.add(sph(0.022, 6, 4), 0xf09a8a, 0.085, 0.1, 0.11, 0, 0, 0, 1, 0.6, 0.4);
    }
  }
  const H = head;
  if (hairC != null && !bone && look.anime && look.hairStyle) {
    animeHair(H, look.hairStyle, hairC, look.hat && look.hat !== 'hood' ? true : look.hat === 'hood' ? 'hood' : false);
  } else if (hairC != null && !bone && look.hairStyle) {
    hairStyle(H, look.hairStyle, hairC, !!look.hat, look.hat === 'hood');
  } else if (hairC != null && !bone && look.hat !== 'hood') {
    H.add(rbox(0.29, 0.1, 0.27, 0.045), hairC, 0, 0.27, -0.005);
    H.add(rbox(0.285, 0.2, 0.06, 0.03), hairC, 0, 0.18, -0.115);
    H.add(rbox(0.05, 0.13, 0.2, 0.02), hairC, -0.135, 0.2, -0.02);
    H.add(rbox(0.05, 0.13, 0.2, 0.02), hairC, 0.135, 0.2, -0.02);
    if (look.longHair) H.add(rbox(0.27, 0.26, 0.07, 0.03), hairC, 0, 0.02, -0.12);
    if (!look.hat) H.add(rbox(0.2, 0.05, 0.06, 0.02), hairC, 0.03, 0.27, 0.11, 0.3, 0, -0.15);
  }
  if (look.earring && !bone) H.add(torus(0.014, 0.004), 0xe0b040, 0.14, 0.07, 0.01, 0, Math.PI / 2, 0);
  if (look.beard != null) {
    H.add(rbox(0.25, 0.12, 0.07, 0.035), look.beard, 0, 0.03, 0.11);
    H.add(rbox(0.12, 0.03, 0.03, 0.012), look.beard, 0, 0.085, 0.135);
  }
  if (look.eyepatch) {
    H.add(sph(0.032, 8, 6), 0x111111, 0.055, 0.15, 0.128, 0, 0, 0, 1, 1, 0.4);
    H.add(torus(0.142, 0.007), 0x111111, 0, 0.17, 0, Math.PI / 2 - 0.15, 0, 0.2, 1, 0.93, 1);
  }
  const hc = look.hatColor;
  switch (look.hat) {
    case 'helmet': {
      const c = hc ?? 0xa8b0bc;
      H.add(hemi(0.165), c, 0, 0.2, 0, 0, 0, 0, 1, 1.05, 1);
      H.add(cyl(0.168, 0.172, 0.06, 16), c, 0, 0.19, 0);
      H.add(torus(0.17, 0.012), trim, 0, 0.165, 0, Math.PI / 2, 0, 0);
      H.add(rbox(0.03, 0.12, 0.02, 0.008), c, 0, 0.14, 0.14);
      H.add(rbox(0.024, 0.07, 0.15, 0.01), trim, 0, 0.37, 0);
      for (const sx of [-1, 1]) H.add(rbox(0.03, 0.12, 0.12, 0.012), c, sx * 0.15, 0.12, 0.04);
      if (look.plume) {
        H.add(sph(0.05, 8, 6), look.plume, 0, 0.43, -0.02, 0, 0, 0, 0.6, 1, 1.4);
        H.add(sph(0.045, 8, 6), look.plume, 0, 0.44, -0.08, 0, 0, 0, 0.6, 1, 1.4);
        H.add(sph(0.04, 8, 6), shade(look.plume, 0.85), 0, 0.41, -0.14, 0, 0, 0, 0.6, 1, 1.4);
      }
      break;
    }
    case 'horned': {
      const c = hc ?? 0xd8a838;
      H.add(hemi(0.17), c, 0, 0.19, 0, 0, 0, 0, 1, 1.1, 1);
      H.add(cyl(0.172, 0.176, 0.1, 16), c, 0, 0.17, 0);
      // máscara facial
      H.add(rbox(0.26, 0.11, 0.05, 0.03), c, 0, 0.1, 0.12);
      H.add(rbox(0.2, 0.02, 0.02, 0.008), 0x1a1208, 0, 0.15, 0.13);
      H.add(rbox(0.05, 0.018, 0.02, 0.006), 0xffd84a, -0.05, 0.15, 0.142);
      H.add(rbox(0.05, 0.018, 0.02, 0.006), 0xffd84a, 0.05, 0.15, 0.142);
      H.add(torus(0.175, 0.012), shade(c, 0.7), 0, 0.22, 0, Math.PI / 2, 0, 0);
      H.add(cone(0.03, 0.08, 4), shade(c, 0.85), 0, 0.37, 0.02);
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; H.add(sph(0.011, 6, 4), shade(c, 0.6), Math.sin(a) * 0.176, 0.19, Math.cos(a) * 0.176); }
      H.add(rbox(0.04, 0.06, 0.02, 0.008), look.gem ?? 0x8a1a1a, 0, 0.27, 0.165);
      H.add(horn(-1), look.hornColor ?? shade(c, 1.05), -0.13, 0.26, 0);
      H.add(horn(1), look.hornColor ?? shade(c, 1.05), 0.13, 0.26, 0);
      break;
    }
    case 'tricorn': {
      const c = hc ?? 0x1e1816;
      H.add(cyl(0.16, 0.16, 0.12, 14), c, 0, 0.31, 0);
      H.add(hemi(0.16), c, 0, 0.36, 0, 0, 0, 0, 1, 0.45, 1);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + Math.PI;
        H.add(rbox(0.26, 0.09, 0.025, 0.012), c, Math.sin(a) * 0.17, 0.31, Math.cos(a) * 0.17, -0.35, a, 0);
        H.add(rbox(0.25, 0.012, 0.03, 0.005), trim, Math.sin(a) * 0.185, 0.355, Math.cos(a) * 0.185, -0.35, a, 0);
      }
      H.add(cyl(0.2, 0.2, 0.02, 14), c, 0, 0.26, 0);
      if (look.feather) H.add(rbox(0.03, 0.22, 0.01, 0.01), look.feather, 0.12, 0.42, -0.06, 0, 0, -0.5);
      break;
    }
    case 'cap':
      H.add(hemi(0.152), look.capColor ?? 0x2e5a9a, 0, 0.24, 0, 0, 0, 0, 1, 0.75, 1);
      H.add(cyl(0.155, 0.155, 0.04, 14), look.capColor ?? 0x2e5a9a, 0, 0.24, 0);
      H.add(rbox(0.2, 0.02, 0.1, 0.01), shade(look.capColor ?? 0x2e5a9a, 0.8), 0, 0.235, 0.17);
      break;
    case 'bandana': {
      const c = look.capColor ?? 0xb02a2a;
      H.add(hemi(0.148), c, 0, 0.23, 0, 0, 0, 0, 1, 0.75, 1);
      H.add(cyl(0.148, 0.148, 0.06, 14), c, 0, 0.23, 0);
      H.add(sph(0.03, 8, 6), c, 0.07, 0.22, -0.15);
      H.add(rbox(0.04, 0.1, 0.015, 0.008), c, 0.09, 0.16, -0.16, 0.3, 0, 0.3);
      break;
    }
    case 'straw':
      H.add(cyl(0.27, 0.27, 0.02, 18), 0xe0c060, 0, 0.27, 0);
      H.add(cyl(0.13, 0.15, 0.11, 14), 0xe0c060, 0, 0.33, 0);
      H.add(cyl(0.152, 0.152, 0.025, 14), 0xb03a2a, 0, 0.295, 0);
      break;
    case 'turban':
      H.add(torus(0.12, 0.05), 0xf0ead8, 0, 0.27, 0, Math.PI / 2, 0, 0);
      H.add(hemi(0.13), 0xf0ead8, 0, 0.28, 0);
      H.add(sph(0.025, 8, 6), 0x2a9a9a, 0, 0.29, 0.165);
      break;
    case 'circlet':
      H.add(torus(0.142, 0.014), 0xe0b040, 0, 0.25, 0, Math.PI / 2, 0, 0);
      H.add(cone(0.025, 0.06, 4), 0xe0b040, 0, 0.29, 0.135);
      H.add(sph(0.016, 6, 4), 0xd03a5a, 0, 0.255, 0.155);
      break;
    case 'hood': {
      const c = hc ?? 0x2e5e2e;
      H.add(sph(0.175, 14, 10), c, 0, 0.16, -0.025, 0, 0, 0, 1, 1.05, 1);
      H.add(cone(0.1, 0.2, 10), c, 0, 0.2, -0.17, -1.9, 0, 0);
      // abertura de la cara
      if (!look.anime) H.add(rbox(0.2, 0.17, 0.06, 0.06), skin, 0, 0.13, 0.12);
      if (!look.anime) for (const s of [-1, 1]) {
        H.add(sph(0.022, 8, 6), 0x1a1414, s * 0.05, 0.15, 0.152, 0, 0, 0, 1, 1.35, 0.5);
        H.add(sph(0.007, 4, 3), 0xffffff, s * 0.05 + 0.006, 0.16, 0.16);
      }
      if (!look.anime) H.add(rbox(0.04, 0.01, 0.01, 0.004), 0x7a3a30, 0, 0.075, 0.152);
      if (hairC != null) H.add(rbox(0.14, 0.04, 0.03, 0.015), hairC, 0.02, 0.215, 0.14);
      break;
    }
  }

  // hornear todas las partes
  for (const p of parts) p.bake(p === cape ? capeMat : mat);
  const allMats = [mat, capeMat, ...extraMats];

  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.3, 16), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.22, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  root.add(shadow);

  return {
    root,
    parts: { body, torso: torso.g, head: head.g, legL: legs[0].g, legR: legs[1].g, armL: arms[0].g, armR: arms[1].g, weapon: weapon && weapon.g, cape: cape && cape.g },
    mats: allMats,
    kind: 'humanoid',
    height: 1.18,
  };
}

// ------------------------------------------------------------------ lobo / jabalí v2
export function makeBeast2(kind) {
  const mat = new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 12, specular: 0x101010 });
  mat.userData.baseEmissive = new THREE.Color(0);
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const boar = kind === 'boar';
  const c = boar ? 0x6a4a32 : 0x8c8f96;
  const c2 = boar ? 0x4a3222 : 0xd8d8d8;
  const dark = boar ? 0x2a1a10 : 0x5a5d64;
  const parts = [];
  const P = (parent, x, y, z) => { const p = new Part(parent, x, y, z); parts.push(p); return p; };
  const torso = P(body, 0, 0.4, 0);
  const bl = boar ? 0.34 : 0.3;
  torso.add(cap(boar ? 0.15 : 0.12, bl), c, 0, 0, 0, Math.PI / 2, 0, 0);
  torso.add(cap(boar ? 0.12 : 0.1, bl * 0.7), c2, 0, -0.04, 0.03, Math.PI / 2, 0, 0, 0.9, 1, 0.9);
  torso.add(sph(boar ? 0.16 : 0.13), c, 0, 0.02, 0.17);
  if (boar) for (let i = 0; i < 6; i++) torso.add(cone(0.025, 0.08, 4), dark, 0, 0.15, 0.2 - i * 0.07, -0.3, 0, 0);
  else torso.add(sph(0.12, 10, 8), shade(c, 1.1), 0, 0.06, 0.2, 0, 0, 0, 1, 0.9, 1.1);
  const head = P(torso.g, 0, 0.08, 0.3);
  head.add(rbox(0.2, 0.18, 0.2, 0.06), c, 0, 0, 0.02);
  head.add(rbox(boar ? 0.14 : 0.11, boar ? 0.11 : 0.09, 0.16, 0.035), boar ? 0x8a6a5a : c2, 0, -0.04, 0.15);
  head.add(sph(0.028, 8, 6), 0x141414, 0, -0.01, 0.235, 0, 0, 0, 1.2, 0.9, 0.9);
  for (const s of [-1, 1]) {
    head.add(sph(0.02, 8, 6), boar ? 0x1a1010 : 0xe8c040, s * 0.055, 0.03, 0.115);
    head.add(sph(0.01, 4, 3), 0x111111, s * 0.057, 0.03, 0.13);
    if (boar) {
      head.add(cone(0.016, 0.08, 5), 0xf4eedc, s * 0.06, -0.06, 0.2, -0.6, 0, s * 0.3);
      head.add(cone(0.04, 0.07, 4), dark, s * 0.08, 0.1, 0.0, 0, 0, s * -0.4);
    } else {
      head.add(cone(0.04, 0.1, 4), c, s * 0.06, 0.12, -0.02, -0.1, 0, s * -0.15);
      head.add(cone(0.022, 0.06, 4), 0xd8a0a0, s * 0.06, 0.115, -0.005, -0.1, 0, s * -0.15);
    }
  }
  const legs = [];
  for (const [x, z] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const l = P(torso.g, x * (boar ? 0.09 : 0.075), -0.05, z * (boar ? 0.17 : 0.16));
    l.add(cap(boar ? 0.045 : 0.038, 0.14), c, 0, -0.12, 0);
    l.add(cap(boar ? 0.04 : 0.033, 0.08), boar ? dark : shade(c, 0.85), 0, -0.25, 0.005);
    l.add(sph(boar ? 0.04 : 0.034, 8, 6), dark, 0, -0.32, 0.02, 0, 0, 0, 1, 0.6, 1.3);
    legs.push(l);
  }
  const tail = P(torso.g, 0, 0.05, -0.28);
  if (boar) tail.add(cyl(0.012, 0.012, 0.1, 5), c, 0, -0.04, -0.02, 0.6, 0, 0);
  else {
    tail.add(cap(0.045, 0.2), c, 0, 0, -0.12, -1.0, 0, 0);
    tail.add(sph(0.045, 8, 6), c2, 0, -0.08, -0.25);
  }
  for (const p of parts) p.bake(mat);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.38, 16), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.22, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  root.add(shadow);
  return { root, parts: { body, torso: torso.g, head: head.g, legs: legs.map((l) => l.g), tail: tail.g }, mats: [mat], kind: 'quad', height: 0.78 };
}

export const OUTFITS2 = [
  { id: 'caballero', name: 'Caballero', look: { shirt: 0x2f5a9a, pants: 0x2a2a3a, hat: 'helmet', plume: 0xc8302a, armor: true, tabard: 0x2f5a9a, cape: 0x23467a, sword: true, skin: 0xe8b98f, boots: 0x3a3a44 } },
  { id: 'corsario', name: 'Corsario', look: { shirt: 0x9a1f24, pants: 0x1e1a1a, hat: 'tricorn', feather: 0xf0ead8, coat: true, vest: 0xd8b060, cravat: true, sash: 0x2a2226, baldric: 0x3a2414, bootCuff: true, earring: true, sword: true, hair: 0x2a1a10, beard: 0x2a1a10, skin: 0xd9a066, blade: 0xe8e8e8, guard: 0xd0a040, sleeve: 0xf0ead8, gloves: 0x5a3a20 } },
  { id: 'exploradora', name: 'Exploradora', look: { shirt: 0x3a7a3a, pants: 0x5a4030, hat: 'hood', hatColor: 0x2e5e2e, vest: 0x7a5232, baldric: 0x5a3a20, quiver: true, scarf: 0xc8922e, sword: true, longHair: true, hair: 0xb06a2a, skin: 0xf0c49a, cape: 0x2e5e2e, bracers: true, bracerColor: 0x6a4a2a, boots: 0x4a3020 } },
  { id: 'mercenario', name: 'Mercenario', look: { shirt: 0x1e1a22, pants: 0x161218, hat: 'horned', hatColor: 0xd8a838, armor: true, armorColor: 0xcf9f30, trim: 0x8a6a10, pauldron: 0x6a7a3a, spikes: true, emblem: 0x5a1010, gem: 0xff4a3a, robe: 0x1a161c, cape: 0x141016, sword: true, blade: 0xe8e8f0, skin: 0xc68a5a, gloves: 0x1a1612, boots: 0x1a1612 } },
];

// ------------------------------------------------------------------ cangrejo v2
export function makeCrab2() {
  const mat = new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 40, specular: 0x303030 });
  mat.userData.baseEmissive = new THREE.Color(0);
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const red = 0xd8452a, light = 0xf07a4a, belly = 0xf2c8a0;
  const parts = [];
  const P = (parent, x, y, z) => { const p = new Part(parent, x, y, z); parts.push(p); return p; };
  const torso = P(body, 0, 0.17, 0);
  torso.add(sph(0.22, 16, 10), red, 0, 0, 0, 0, 0, 0, 1.15, 0.5, 0.85);
  torso.add(sph(0.18, 14, 8), light, 0, 0.04, -0.01, 0, 0, 0, 1.05, 0.4, 0.75);
  torso.add(sph(0.2, 14, 8), belly, 0, -0.04, 0, 0, 0, 0, 1.05, 0.25, 0.8);
  for (let i = 0; i < 4; i++) torso.add(sph(0.025, 6, 4), shade(red, 0.75), -0.09 + i * 0.06, 0.1, 0.05 - (i % 2) * 0.05);
  for (const s of [-1, 1]) {
    torso.add(cyl(0.012, 0.014, 0.12, 6), red, s * 0.06, 0.12, 0.13, 0.3, 0, 0);
    torso.add(sph(0.03, 8, 6), 0x111111, s * 0.06, 0.19, 0.15);
    torso.add(sph(0.01, 4, 3), 0xffffff, s * 0.065, 0.2, 0.175);
  }
  const claws = [];
  for (const s of [-1, 1]) {
    const c = P(torso.g, s * 0.2, 0.0, 0.14);
    c.add(cap(0.03, 0.1), red, s * 0.03, 0, 0.04, Math.PI / 2, 0, s * 0.4);
    c.add(sph(0.075, 10, 8), light, s * 0.08, 0.02, 0.15, 0, 0, 0, 1, 0.8, 1.2);
    c.add(cone(0.035, 0.12, 6), light, s * 0.05, 0.02, 0.25, Math.PI / 2, 0, 0);
    c.add(cone(0.028, 0.1, 6), red, s * 0.11, 0.0, 0.24, Math.PI / 2, 0, 0);
    claws.push(c);
  }
  const legs = [];
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) {
    const l = P(torso.g, s * 0.2, -0.02, -0.1 + i * 0.1);
    l.add(cap(0.018, 0.1), red, s * 0.07, 0.01, 0, 0, 0, s * 1.1);
    l.add(cap(0.015, 0.09), shade(red, 0.85), s * 0.15, -0.07, 0, 0, 0, s * 0.35);
    legs.push(l);
  }
  for (const p of parts) p.bake(mat);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.32, 16), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.22, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  root.add(shadow);
  return { root, parts: { body, torso: torso.g, claws: claws.map((c) => c.g), legs: legs.map((l) => l.g) }, mats: [mat], kind: 'crab', height: 0.45 };
}

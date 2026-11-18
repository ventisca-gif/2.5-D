// Cabezas estilo anime: cara pintada en textura (ojos grandes con brillos, pestañas, rubor)
// y pelo hecho de mechones 3D afilados (flequillo, mechones laterales, capas traseras).
import * as THREE from 'three';

export const EYE_COLORS = [
  { name: 'Marrón', c: '#7a4a22' }, { name: 'Azul', c: '#2a6ad8' }, { name: 'Verde', c: '#2a9a4a' }, { name: 'Ámbar', c: '#d8901a' },
  { name: 'Violeta', c: '#8a3ad8' }, { name: 'Rojo', c: '#c8202a' }, { name: 'Gris', c: '#7a8a9a' }, { name: 'Cian', c: '#18b0c8' },
];
export const HAIR_COLORS_A = [0x1a1418, 0x5a3420, 0x8a3a1c, 0xe8c060, 0xd8562a, 0xe8e8f0, 0x3a5ad8, 0xf08ab8, 0x5ac8a0, 0x9a7ad8];
export const FACES_F = [{ id: 'dulce', name: 'Dulce' }, { id: 'decidida', name: 'Decidida' }, { id: 'alegre', name: 'Alegre' }, { id: 'timida', name: 'Tímida' }];
export const FACES_M = [{ id: 'heroico', name: 'Heroico' }, { id: 'serio', name: 'Serio' }, { id: 'picaro', name: 'Pícaro' }, { id: 'alegre', name: 'Alegre' }];
export const HAIR_AF = [
  { id: 'largo', name: 'Largo en capas' }, { id: 'melena', name: 'Melena' }, { id: 'coleta', name: 'Coleta alta' },
  { id: 'dosColetas', name: 'Dos coletas' }, { id: 'trenza', name: 'Trenza lateral' }, { id: 'corto', name: 'Corto' },
];
export const HAIR_AM = [
  { id: 'punta', name: 'De punta' }, { id: 'despeinado', name: 'Despeinado' }, { id: 'flequillo', name: 'Flequillo largo' },
  { id: 'samurai', name: 'Coleta samurái' }, { id: 'lateral', name: 'Rapado lateral' }, { id: 'melenaM', name: 'Melena' },
];

// ------------------------------------------------------------------ cara (textura equirectangular)
const faceCache = new Map();
export function faceTexture({ skin, eye, face, female, hair, size = 512 }) {
  const key = [skin, eye, face, female, hair, size].join('|');
  if (faceCache.has(key)) return faceCache.get(key);
  const W = size, H = size / 2, k = size / 512;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  const skinCol = '#' + new THREE.Color(skin).getHexString();
  x.fillStyle = skinCol;
  x.fillRect(0, 0, W, H);
  x.save();
  x.scale(k, k);
  const cx = 128, ey = 122;
  const brow = '#' + new THREE.Color(hair).multiplyScalar(0.7).getHexString();
  const lash = '#1a1012';
  const closed = face === 'alegre';
  const shy = face === 'timida';
  const sharp = face === 'decidida' || face === 'heroico' || face === 'serio';
  const ew = female ? 16 : 14, eh = female ? 20 : (face === 'serio' ? 13 : 16);

  // rubor
  if (female || face === 'alegre' || shy) {
    x.fillStyle = shy ? 'rgba(240,90,110,0.45)' : 'rgba(240,110,120,0.28)';
    for (const s of [-1, 1]) { x.beginPath(); x.ellipse(cx + s * 44, ey + 24, 15, 7, 0, 0, Math.PI * 2); x.fill(); }
    x.strokeStyle = 'rgba(200,60,80,0.55)';
    x.lineWidth = 1.5;
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(cx + s * (36 + i * 6), ey + 28); x.lineTo(cx + s * (40 + i * 6), ey + 20); x.stroke(); }
  }
  // ojos
  for (const s of [-1, 1]) {
    const ex = cx + s * 33;
    if (closed) {
      x.strokeStyle = lash; x.lineWidth = 4; x.lineCap = 'round';
      x.beginPath(); x.arc(ex, ey + 6, 12, Math.PI * 1.15, Math.PI * 1.85); x.stroke();
      continue;
    }
    const wink = face === 'picaro' && s === 1;
    if (wink) {
      x.strokeStyle = lash; x.lineWidth = 4; x.lineCap = 'round';
      x.beginPath(); x.moveTo(ex - 12, ey + 2); x.quadraticCurveTo(ex, ey + 8, ex + 12, ey); x.stroke();
      continue;
    }
    // blanco
    x.fillStyle = '#ffffff';
    x.beginPath(); x.ellipse(ex, ey, ew, eh, 0, 0, Math.PI * 2); x.fill();
    // iris con degradado
    const lx = shy ? ex - s * 3 - 3 : ex;
    const g = x.createLinearGradient(0, ey - eh, 0, ey + eh);
    const ec = new THREE.Color(eye);
    g.addColorStop(0, '#' + ec.clone().multiplyScalar(0.35).getHexString());
    g.addColorStop(0.55, '#' + ec.getHexString());
    g.addColorStop(1, '#' + ec.clone().lerp(new THREE.Color('#ffffff'), 0.45).getHexString());
    x.fillStyle = g;
    x.beginPath(); x.ellipse(lx, ey + 2, ew * 0.72, eh * 0.82, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#' + ec.clone().multiplyScalar(0.25).getHexString();
    x.beginPath(); x.ellipse(lx, ey + 1, ew * 0.32, eh * 0.4, 0, 0, Math.PI * 2); x.fill();
    // brillos
    x.fillStyle = '#ffffff';
    x.beginPath(); x.ellipse(lx - ew * 0.3, ey - eh * 0.35, ew * 0.26, eh * 0.2, -0.4, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.arc(lx + ew * 0.32, ey + eh * 0.42, 2.4, 0, Math.PI * 2); x.fill();
    // párpado superior y pestañas
    x.strokeStyle = lash; x.lineCap = 'round';
    x.lineWidth = female ? 5 : 4;
    x.beginPath();
    if (sharp) { x.moveTo(ex - s * ew * 1.05, ey - eh * 0.45); x.quadraticCurveTo(ex, ey - eh * 1.15, ex + s * ew * 1.1, ey - eh * 0.75); }
    else { x.ellipse(ex, ey, ew * 1.02, eh * 1.0, 0, Math.PI * 1.08, Math.PI * 1.92); }
    x.stroke();
    if (female) {
      x.lineWidth = 3;
      x.beginPath(); x.moveTo(ex + s * ew * 0.95, ey - eh * 0.55); x.lineTo(ex + s * (ew + 7), ey - eh * 0.9); x.stroke();
      x.beginPath(); x.moveTo(ex + s * ew * 0.75, ey - eh * 0.8); x.lineTo(ex + s * (ew + 3), ey - eh * 1.15); x.stroke();
    }
    x.lineWidth = 1.6;
    x.beginPath(); x.ellipse(ex, ey + 1, ew * 0.85, eh * 0.95, 0, Math.PI * 0.2, Math.PI * 0.8); x.stroke();
    // cejas
    x.strokeStyle = brow; x.lineWidth = female ? 2.6 : 4;
    x.beginPath();
    const by = ey - eh - (female ? 12 : 9);
    if (sharp) { x.moveTo(ex - s * 13, by + 5 * (face === 'serio' ? 1 : 0.6)); x.lineTo(ex + s * 14, by - 3); }
    else if (shy) { x.moveTo(ex - s * 12, by - 2); x.quadraticCurveTo(ex, by + 1, ex + s * 13, by + 4); }
    else { x.moveTo(ex - s * 13, by + 2); x.quadraticCurveTo(ex, by - 5, ex + s * 13, by + 1); }
    x.stroke();
  }
  // nariz
  x.strokeStyle = 'rgba(120,60,40,0.55)'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(cx + 1, ey + 18); x.lineTo(cx - 2, ey + 24); x.stroke();
  // boca
  x.strokeStyle = '#7a2a28'; x.lineWidth = 2.6; x.lineCap = 'round';
  const my = ey + 37;
  if (face === 'alegre') {
    x.fillStyle = '#9a2a30';
    x.beginPath(); x.moveTo(cx - 10, my - 2); x.quadraticCurveTo(cx, my + 14, cx + 10, my - 2); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#f07a80'; x.beginPath(); x.ellipse(cx, my + 6, 5, 3, 0, 0, Math.PI * 2); x.fill();
  } else if (face === 'serio') {
    x.beginPath(); x.moveTo(cx - 7, my + 2); x.lineTo(cx + 7, my + 2); x.stroke();
  } else if (face === 'picaro') {
    x.beginPath(); x.moveTo(cx - 8, my + 1); x.quadraticCurveTo(cx + 2, my + 6, cx + 10, my - 3); x.stroke();
  } else if (shy) {
    x.beginPath(); x.arc(cx, my + 1, 3.5, 0, Math.PI); x.stroke();
  } else {
    x.beginPath(); x.moveTo(cx - 9, my); x.quadraticCurveTo(cx, my + 7, cx + 9, my); x.stroke();
  }
  x.restore();
  const t = new THREE.CanvasTexture(c);
  t.generateMipmaps = true;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  faceCache.set(key, t);
  return t;
}

// ------------------------------------------------------------------ cabeza con barbilla
let headGeoCache = null;
export function animeHeadGeo() {
  if (headGeoCache) return headGeoCache;
  const r = 0.155;
  const g = new THREE.SphereGeometry(r, 28, 20);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (y < 0) {
      const t = -y / r;
      x *= 1 - 0.38 * Math.pow(t, 1.4);
      z *= 1 - 0.18 * t;
      if (z > 0) z += 0.018 * t * t;
      y *= 0.92;
    }
    z *= 0.96;
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  headGeoCache = g;
  return g;
}

// ------------------------------------------------------------------ mechón afilado
const lockCache = new Map();
// pts: puntos de la curva; w: ancho; t: grosor; tip: 0..1 cuánto se afila
function lockGeo(pts, w, t, tip = 1) {
  const key = JSON.stringify([pts, w, t, tip]);
  if (lockCache.has(key)) return lockCache.get(key);
  const curve = new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q)));
  const SEG = 10, RAD = 6;
  const pos = [], idx = [];
  const center = new THREE.Vector3(0, 0.15, 0);
  for (let i = 0; i <= SEG; i++) {
    const u = i / SEG;
    const c = curve.getPointAt(u);
    const tan = curve.getTangentAt(u).normalize();
    let out = c.clone().sub(center);
    out.sub(tan.clone().multiplyScalar(out.dot(tan)));
    if (out.lengthSq() < 1e-6) out.set(0, 0, 1);
    out.normalize();
    const side = new THREE.Vector3().crossVectors(tan, out).normalize();
    const k = 1 - tip * Math.pow(u, 1.6);
    for (let j = 0; j < RAD; j++) {
      const a = (j / RAD) * Math.PI * 2;
      const v = c.clone().addScaledVector(side, Math.cos(a) * w * k).addScaledVector(out, Math.sin(a) * t * k);
      pos.push(v.x, v.y, v.z);
    }
  }
  for (let i = 0; i < SEG; i++) for (let j = 0; j < RAD; j++) {
    const a = i * RAD + j, b = i * RAD + ((j + 1) % RAD), c2 = (i + 1) * RAD + j, d = (i + 1) * RAD + ((j + 1) % RAD);
    idx.push(a, c2, b, b, c2, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  lockCache.set(key, g);
  return g;
}
let capCache = null;
function capGeo() {
  if (!capCache) capCache = new THREE.SphereGeometry(0.168, 22, 14, 0, Math.PI * 2, 0, 1.55);
  return capCache;
}

const shadeHex = (c, k) => new THREE.Color(c).multiplyScalar(k).getHex();

// Construye el pelo en la parte "H" (interfaz Part: add(geo, color, x,y,z, rx,ry,rz, sx,sy,sz))
export function animeHair(H, style, c, hat) {
  const dark = shadeHex(c, 0.78), light = shadeHex(c, 1.12);
  const Y = 0.15; // centro de la cabeza
  const add = (pts, w, t, col = c, tip = 1) => H.add(lockGeo(pts, w, t, tip), col);
  // casquete (se inclina hacia atrás para dejar la frente libre)
  if (!hat) H.add(capGeo(), c, 0, Y + 0.005, -0.012, -0.32, 0, 0, 1, 1, 1.02);
  else H.add(capGeo(), c, 0, Y - 0.02, -0.02, -0.9, 0, 0, 1.02, 1, 1.02);
  const bangs = (n, len, spread = 0.11) => {
    if (hat) len *= 0.8;
    for (let i = 0; i < n; i++) {
      const f = n === 1 ? 0 : i / (n - 1) * 2 - 1;
      const x0 = f * spread, x1 = f * (spread + 0.025);
      const l = len * (0.8 + ((i * 37) % 5) / 12);
      const zf = (xx, yy) => Math.sqrt(Math.max(0.0004, 0.158 * 0.158 - xx * xx - (yy - Y) * (yy - Y))) + 0.014;
      const y2 = Y + 0.11 - l * 0.1, y3 = Y + 0.085 - l * 0.28;
      add([[x0 * 0.5, Y + 0.16, 0.03], [x0, Y + 0.14, zf(x0, Y + 0.14)], [x1, y2, zf(x1, y2)], [x1 * 1.05, y3, zf(x1 * 1.05, y3)]], 0.03, 0.011, i % 2 ? c : light);
    }
  };
  const sideLocks = (len, curl = 0) => {
    for (const s of [-1, 1]) {
      add([[s * 0.125, Y + 0.12, 0.05], [s * 0.158, Y + 0.02, 0.07], [s * 0.15, Y - len * 0.6, 0.065 + curl], [s * (0.14 - curl), Y - len, 0.05 + curl]], 0.03, 0.014, c);
      add([[s * 0.14, Y + 0.1, 0.0], [s * 0.168, Y - 0.02, 0.02], [s * 0.165, Y - len * 0.7, 0.01]], 0.035, 0.016, dark);
    }
  };
  const backLayer = (n, len, flare = 1.25, curl = 0) => {
    for (let i = 0; i < n; i++) {
      const a = Math.PI * 0.06 + (i / (n - 1)) * Math.PI * 0.88; // de lado a lado por detrás (z negativa)
      const sx = Math.cos(a), sz = Math.sin(a);
      const l = len * (0.85 + ((i * 53) % 7) / 20);
      add([[sx * 0.12, Y + 0.1, -sz * 0.12], [sx * 0.165, Y - 0.02, -sz * 0.165], [sx * 0.15 * flare, Y - l * 0.6, -sz * 0.17 * flare + curl * 0.3], [sx * 0.13 * flare, Y - l, -sz * 0.15 * flare + curl]], 0.045, 0.018, i % 2 ? c : dark);
    }
  };
  switch (style) {
    // ---------------- chica
    case 'largo':
      bangs(7, 0.1); sideLocks(0.36); backLayer(9, 0.48);
      if (!hat) add([[0.02, Y + 0.16, 0.02], [0.03, Y + 0.24, 0.0], [0.07, Y + 0.25, 0.03]], 0.012, 0.008, c); // mechón rebelde
      break;
    case 'melena':
      bangs(8, 0.07, 0.12); sideLocks(0.17, 0.03); backLayer(9, 0.2, 1.3, 0.04);
      break;
    case 'coleta':
      bangs(6, 0.08); sideLocks(0.2);
      H.add(new THREE.SphereGeometry(0.03, 8, 6), 0xc8304a, 0, Y + 0.13, -0.15);
      for (let i = 0; i < 5; i++) {
        const f = (i - 2) * 0.025;
        add([[f, Y + 0.13, -0.16], [f * 1.5, Y + 0.12, -0.24], [f * 2, Y - 0.06, -0.27], [f * 2.4, Y - 0.26, -0.22]], 0.035, 0.02, i % 2 ? c : dark);
      }
      break;
    case 'dosColetas':
      bangs(7, 0.09); sideLocks(0.12);
      for (const s of [-1, 1]) {
        H.add(new THREE.SphereGeometry(0.028, 8, 6), 0x3a6ad8, s * 0.15, Y + 0.12, -0.06);
        for (let i = 0; i < 4; i++) {
          const f = (i - 1.5) * 0.02;
          add([[s * 0.16, Y + 0.12, -0.06 + f], [s * 0.23, Y + 0.1, -0.08 + f], [s * 0.26, Y - 0.1, -0.08 + f * 2], [s * 0.22, Y - 0.32, -0.04 + f * 2]], 0.033, 0.018, i % 2 ? c : dark);
        }
      }
      break;
    case 'trenza':
      bangs(6, 0.09); sideLocks(0.15); backLayer(7, 0.16);
      for (let i = 0; i < 6; i++) H.add(new THREE.SphereGeometry(0.034 - i * 0.003, 8, 6), i % 2 ? c : dark, 0.13 + i * 0.006, Y - 0.06 - i * 0.055, 0.04 + i * 0.008, 0, 0, 0, 1, 1.25, 1);
      H.add(new THREE.TorusGeometry(0.02, 0.007, 4, 10), 0xc8304a, 0.165, Y - 0.38, 0.09, Math.PI / 2, 0, 0);
      break;
    case 'corto':
      bangs(6, 0.07); sideLocks(0.1); backLayer(7, 0.1, 1.1);
      break;
    // ---------------- chico
    case 'punta':
      bangs(5, 0.06);
      if (!hat) for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        const sx = Math.cos(a), sz = Math.sin(a);
        add([[sx * 0.08, Y + 0.13, sz * 0.08 - 0.02], [sx * 0.15, Y + 0.18, sz * 0.15 - 0.04], [sx * 0.21, Y + 0.24, sz * 0.2 - 0.08]], 0.04, 0.02, i % 2 ? c : light);
      }
      backLayer(7, 0.07, 1.1);
      break;
    case 'despeinado':
      bangs(6, 0.08, 0.12); sideLocks(0.08);
      if (!hat) for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + 0.3;
        add([[Math.cos(a) * 0.1, Y + 0.14, Math.sin(a) * 0.1], [Math.cos(a) * 0.17, Y + 0.13, Math.sin(a) * 0.17], [Math.cos(a + 0.6) * 0.22, Y + 0.06, Math.sin(a + 0.6) * 0.2]], 0.04, 0.018, i % 2 ? c : dark);
      }
      backLayer(7, 0.1);
      break;
    case 'flequillo':
      bangs(7, 0.13, 0.12); sideLocks(0.12); backLayer(7, 0.11);
      break;
    case 'samurai':
      bangs(3, 0.05); sideLocks(0.1);
      if (!hat) {
        H.add(new THREE.SphereGeometry(0.045, 10, 8), c, 0, Y + 0.17, -0.1);
        H.add(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 8), 0xc8304a, 0, Y + 0.14, -0.12, 0.6, 0, 0);
        add([[0, Y + 0.17, -0.13], [0, Y + 0.1, -0.2], [0, Y - 0.05, -0.2]], 0.03, 0.02, dark);
      }
      break;
    case 'lateral':
      H.add(capGeo(), shadeHex(c, 0.6), 0, Y - 0.005, -0.005, -0.1, 0, 0, 1.0, 0.95, 1.0);
      if (!hat) for (let i = 0; i < 6; i++) {
        const f = (i - 2.5) * 0.035;
        add([[f * 0.6, Y + 0.14, 0.08], [f, Y + 0.19, 0.0], [f * 1.2, Y + 0.18, -0.1], [f * 1.3, Y + 0.12, -0.17]], 0.035, 0.022, i % 2 ? c : light);
      }
      break;
    case 'melenaM':
      bangs(6, 0.1); sideLocks(0.22); backLayer(8, 0.28, 1.2);
      break;
  }
}

export const BUST = [0, 0.78, 1, 1.22];

// Texturas procedurales (sin archivos externos): suelo pintado, piedra, tablones, tejas...
import * as THREE from 'three';
import { valueNoise, hash2, mulberry32 } from './rng.js';
import { N, T } from './world.js';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function tex(c, repeat = true) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

const PALETTE = {
  [T.GRASS]: [104, 168, 72],
  [T.DARK]: [86, 150, 62],
  [T.SAND]: [226, 205, 150],
  [T.DIRT]: [176, 134, 88],
  [T.STONE]: [168, 166, 160],
  [T.FIELD]: [138, 102, 62],
  [T.DOCK]: [150, 110, 70],
  [T.WATER]: [205, 186, 136],
};

export function makeGroundTexture(W, pxPerTile = 24) {
  const N = W.N, ox = W.ox || 0, oz = W.oz || 0;
  const LO = 8; // resolución base con bordes orgánicos
  const lw = N * LO;
  const lo = canvas(lw, lw);
  const lctx = lo.getContext('2d');
  const img = lctx.createImageData(lw, lw);
  const d = img.data;
  const crisp = (t) => t === T.STONE || t === T.DOCK || t === T.FIELD;
  for (let py = 0; py < lw; py++) {
    for (let px = 0; px < lw; px++) {
      const u = px / LO - 0.5 + 0.5 / LO; // en coordenadas de casilla
      const v = py / LO - 0.5 + 0.5 / LO;
      const bt = W.tile(ox + Math.round(u), oz + Math.round(v));
      let t = bt;
      if (!crisp(bt)) {
        const wx = (valueNoise(u * 0.9, v * 0.9, 11) - 0.5) * 1.1;
        const wz = (valueNoise(u * 0.9 + 40, v * 0.9 + 40, 12) - 0.5) * 1.1;
        const st = W.tile(ox + Math.round(u + wx), oz + Math.round(v + wz));
        if (!crisp(st)) t = st;
      }
      const c = PALETTE[t] || PALETTE[T.GRASS];
      const n = (valueNoise(u * 0.35, v * 0.35, 21) - 0.5) * 22 + (hash2(px, py, 3) - 0.5) * 8;
      const o = (py * lw + px) * 4;
      d[o] = Math.max(0, Math.min(255, c[0] + n));
      d[o + 1] = Math.max(0, Math.min(255, c[1] + n * 1.1));
      d[o + 2] = Math.max(0, Math.min(255, c[2] + n * 0.6));
      d[o + 3] = 255;
    }
  }
  lctx.putImageData(img, 0, 0);

  const S = N * pxPerTile;
  const big = canvas(S, S);
  const ctx = big.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(lo, 0, 0, S, S);

  const rnd = mulberry32(42);
  const P = pxPerTile;
  for (let z = 0; z < N; z++) {
    for (let x = 0; x < N; x++) {
      const t = W.tile(ox + x, oz + z);
      const px0 = x * P, oy = z * P;
      if (t === T.GRASS || t === T.DARK) {
        for (let k = 0; k < 7; k++) {
          const gx = px0 + rnd() * P, gy = oy + rnd() * P;
          ctx.strokeStyle = rnd() < 0.5 ? 'rgba(60,120,40,0.45)' : 'rgba(150,205,100,0.4)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(gx, gy);
          ctx.lineTo(gx + (rnd() - 0.5) * 2, gy - 2 - rnd() * 3);
          ctx.stroke();
        }
      } else if (t === T.DIRT || t === T.SAND) {
        for (let k = 0; k < 5; k++) {
          ctx.fillStyle = t === T.DIRT
            ? (rnd() < 0.5 ? 'rgba(120,88,55,0.5)' : 'rgba(215,180,135,0.5)')
            : (rnd() < 0.5 ? 'rgba(190,165,110,0.55)' : 'rgba(250,236,200,0.6)');
          ctx.fillRect(px0 + rnd() * P, oy + rnd() * P, 1.6, 1.6);
        }
      } else if (t === T.STONE) {
        // adoquines
        const rows = 3;
        const rh = P / rows;
        for (let r = 0; r < rows; r++) {
          const off = ((r + x + z) % 2) * (P / 4);
          let cx = px0 - off;
          while (cx < px0 + P) {
            const w = P / 2 + (hash2(Math.floor(cx), oy + r, 9) - 0.5) * 3;
            const shade = 150 + Math.floor(hash2(Math.floor(cx), oy + r, 5) * 40);
            ctx.fillStyle = `rgb(${shade},${shade - 2},${shade - 8})`;
            const x0 = Math.max(cx, px0), x1 = Math.min(cx + w, px0 + P);
            if (x1 > x0) ctx.fillRect(x0 + 0.6, oy + r * rh + 0.6, x1 - x0 - 1.2, rh - 1.2);
            cx += w;
          }
        }
        ctx.strokeStyle = 'rgba(90,88,84,0.35)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px0 + 0.5, oy + 0.5, P - 1, P - 1);
      } else if (t === T.FIELD) {
        for (let r = 0; r < 4; r++) {
          ctx.fillStyle = r % 2 ? 'rgba(100,70,40,0.6)' : 'rgba(165,125,80,0.5)';
          ctx.fillRect(px0 + r * (P / 4), oy, P / 4, P);
        }
      }
    }
  }
  const t = tex(big, false);
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

export function makeStoneTexture() {
  const c = canvas(128, 128);
  const ctx = c.getContext('2d');
  const rnd = mulberry32(7);
  ctx.fillStyle = '#6f6b66';
  ctx.fillRect(0, 0, 128, 128);
  const rows = 6;
  const rh = 128 / rows;
  for (let r = 0; r < rows; r++) {
    let x = r % 2 ? -12 : 0;
    while (x < 128) {
      const w = 22 + rnd() * 14;
      const s = 150 + Math.floor(rnd() * 50);
      ctx.fillStyle = `rgb(${s},${s - 3},${s - 10})`;
      ctx.fillRect(x + 1.5, r * rh + 1.5, w - 3, rh - 3);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(x + 1.5, r * rh + 1.5, w - 3, 2);
      x += w;
    }
  }
  return tex(c);
}

export function makePlankTexture() {
  const c = canvas(128, 128);
  const ctx = c.getContext('2d');
  const rnd = mulberry32(8);
  for (let r = 0; r < 8; r++) {
    const s = 0.85 + rnd() * 0.25;
    ctx.fillStyle = `rgb(${Math.floor(225 * s)},${Math.floor(215 * s)},${Math.floor(200 * s)})`;
    ctx.fillRect(0, r * 16, 128, 16);
    ctx.fillStyle = 'rgba(60,40,20,0.55)';
    ctx.fillRect(0, r * 16 + 15, 128, 1.5);
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = 'rgba(80,55,30,0.18)';
      ctx.fillRect(rnd() * 128, r * 16 + 3 + rnd() * 10, 20 + rnd() * 30, 1);
    }
    const jx = rnd() * 128;
    ctx.fillStyle = 'rgba(60,40,20,0.5)';
    ctx.fillRect(jx, r * 16, 1.5, 16);
  }
  return tex(c);
}

export function makeShingleTexture() {
  const c = canvas(128, 128);
  const ctx = c.getContext('2d');
  const rnd = mulberry32(9);
  ctx.fillStyle = '#e8e8e8';
  ctx.fillRect(0, 0, 128, 128);
  const rows = 8;
  const rh = 128 / rows;
  for (let r = 0; r < rows; r++) {
    let x = r % 2 ? -8 : 0;
    while (x < 128) {
      const w = 16;
      const s = 200 + Math.floor(rnd() * 55);
      ctx.fillStyle = `rgb(${s},${s},${s})`;
      ctx.fillRect(x + 1, r * rh, w - 2, rh - 1);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(x, r * rh + rh - 2, w, 2);
      x += w;
    }
  }
  return tex(c);
}

export function makeThatchTexture() {
  const c = canvas(128, 128);
  const ctx = c.getContext('2d');
  const rnd = mulberry32(10);
  ctx.fillStyle = '#e6d9b0';
  ctx.fillRect(0, 0, 128, 128);
  for (let k = 0; k < 700; k++) {
    const x = rnd() * 128, y = rnd() * 128;
    ctx.strokeStyle = rnd() < 0.5 ? 'rgba(150,120,60,0.5)' : 'rgba(255,245,210,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rnd() - 0.5) * 3, y + 6 + rnd() * 8);
    ctx.stroke();
  }
  for (let r = 0; r < 6; r++) {
    ctx.fillStyle = 'rgba(110,85,40,0.35)';
    ctx.fillRect(0, r * 21.3 + 19, 128, 2);
  }
  return tex(c);
}

export function makePlasterTexture() {
  const c = canvas(64, 64);
  const ctx = c.getContext('2d');
  const rnd = mulberry32(11);
  ctx.fillStyle = '#f4f4f4';
  ctx.fillRect(0, 0, 64, 64);
  for (let k = 0; k < 220; k++) {
    const s = 215 + Math.floor(rnd() * 40);
    ctx.fillStyle = `rgba(${s},${s},${s},0.5)`;
    ctx.fillRect(rnd() * 64, rnd() * 64, 2 + rnd() * 3, 2 + rnd() * 3);
  }
  return tex(c);
}

export function makeFlagTexture() {
  const c = canvas(128, 96);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#141414';
  ctx.fillRect(0, 0, 128, 96);
  ctx.strokeStyle = '#eee';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(38, 70); ctx.lineTo(90, 84);
  ctx.moveTo(90, 70); ctx.lineTo(38, 84);
  ctx.stroke();
  ctx.fillStyle = '#eee';
  ctx.beginPath();
  ctx.arc(64, 38, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(54, 50, 20, 14);
  ctx.fillStyle = '#141414';
  ctx.beginPath(); ctx.arc(56, 38, 5.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(72, 38, 5.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(59, 56, 3, 8); ctx.fillRect(66, 56, 3, 8);
  return tex(c, false);
}

export function makeClockTexture() {
  const c = canvas(64, 64);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#3d4f6f';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#f2ead2';
  ctx.beginPath(); ctx.arc(32, 32, 26, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9a23a'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#222';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.fillRect(32 + Math.cos(a) * 21 - 1.5, 32 + Math.sin(a) * 21 - 1.5, 3, 3);
  }
  ctx.strokeStyle = '#222'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(32, 32); ctx.lineTo(32, 14); ctx.moveTo(32, 32); ctx.lineTo(44, 36); ctx.stroke();
  return tex(c, false);
}

export function makeSailTexture() {
  const c = canvas(64, 64);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#efe6cf';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = 'rgba(150,130,90,0.35)';
  for (let i = 0; i < 4; i++) ctx.fillRect(0, i * 16 + 14, 64, 2);
  ctx.fillRect(31, 0, 2, 64);
  return tex(c);
}

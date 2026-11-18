// Generación del mapa en cuadrícula: Isla Bruma.
// Cada casilla (x, z) ocupa el cuadrado [x-0.5, x+0.5] x [z-0.5, z+0.5] en el mundo 3D.
import { mulberry32, fbm, hash2 } from './rng.js';

export const N = 100;
export const T = { WATER: 0, SAND: 1, GRASS: 2, DIRT: 3, STONE: 4, DOCK: 5, FIELD: 6, DARK: 7, ROCK: 8, LAVA: 9 };

export const TOWN = { x0: 38, z0: 38, x1: 62, z1: 62 };

export function generateWorld() {
  const rnd = mulberry32(20261117);
  const tiles = new Uint8Array(N * N);
  const blocked = new Uint8Array(N * N);
  const reserved = new Uint8Array(N * N);
  const W = {
    N, tiles, blocked, reserved,
    trees: [], rocks: [], buildings: [], walls: [], towers: [], props: [], lamps: [],
    decor: [], npcs: [], spawns: [], landmarks: {},
  };
  const idx = (x, z) => z * N + x;
  const inb = (x, z) => x >= 0 && z >= 0 && x < N && z < N;
  W.idx = (x, z) => (inb(x, z) ? idx(x, z) : -1);
  W.inb = inb;
  W.tile = (x, z) => (inb(x, z) ? tiles[idx(x, z)] : T.WATER);
  const setT = (x, z, t) => { if (inb(x, z)) tiles[idx(x, z)] = t; };
  const isLand = (x, z) => { const t = W.tile(x, z); return t !== T.WATER && t !== T.DOCK; };
  W.isLand = isLand;
  const block = (x, z) => { if (inb(x, z)) blocked[idx(x, z)] = 1; };
  const reserve = (x0, z0, x1, z1) => {
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (inb(x, z)) reserved[idx(x, z)] = 1;
  };
  const rect = (x0, z0, x1, z1, t) => {
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) setT(x, z, t);
  };

  // ---------- 1. Isla base ----------
  for (let z = 0; z < N; z++) {
    for (let x = 0; x < N; x++) {
      const dx = x - 50, dz = z - 50;
      const r = Math.sqrt(dx * dx + dz * dz);
      const a = Math.atan2(dz, dx);
      const R = 41 + (fbm(Math.cos(a) * 1.8 + 7, Math.sin(a) * 1.8 + 7, 99, 3) - 0.5) * 16;
      if (r < R) {
        if (r > R - 2.6) setT(x, z, T.SAND);
        else setT(x, z, fbm(x * 0.08, z * 0.08, 5) > 0.58 ? T.DARK : T.GRASS);
      } else setT(x, z, T.WATER);
    }
  }

  // ---------- 2. Puerto Salitre (sur) ----------
  for (let z = 72; z < N; z++) {
    for (let x = 32; x <= 68; x++) {
      const coast = 88 + Math.round((hash2(x, 3, 7) - 0.5) * 1.2);
      if (z <= coast) setT(x, z, z >= 84 ? T.SAND : (W.tile(x, z) === T.WATER ? T.GRASS : W.tile(x, z) === T.SAND ? T.GRASS : W.tile(x, z)));
      else setT(x, z, T.WATER);
    }
  }
  // Cala de los Huesos (este)
  for (let z = 40; z <= 62; z++) {
    for (let x = 78; x < N; x++) {
      if (x <= 90) setT(x, z, x >= 83 ? T.SAND : (W.tile(x, z) === T.WATER || W.tile(x, z) === T.SAND ? T.GRASS : W.tile(x, z)));
      else setT(x, z, T.WATER);
    }
  }

  // ---------- 3. Caminos de tierra ----------
  const roadTiles = new Set();
  const road = (pts, width = 3) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i];
      const [bx, bz] = pts[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      const steps = Math.ceil(len * 4);
      const px = -(bz - az) / len, pz = (bx - ax) / len;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const wob = (fbm((ax + (bx - ax) * t) * 0.15, (az + (bz - az) * t) * 0.15, 31) - 0.5) * 2.2;
        const cx = ax + (bx - ax) * t + px * wob;
        const cz = az + (bz - az) * t + pz * wob;
        const half = (width - 1) / 2;
        for (let o = -half; o <= half; o += 0.5) {
          const x = Math.round(cx + px * o), z = Math.round(cz + pz * o);
          if (inb(x, z) && isLand(x, z)) {
            setT(x, z, T.DIRT);
            roadTiles.add(idx(x, z));
          }
        }
      }
    }
  };
  road([[50, 62], [50, 72], [50, 87]]);
  road([[50, 38], [50, 27], [45, 14]]);
  road([[38, 50], [30, 51], [16, 50]]);
  road([[62, 50], [73, 48], [85, 51]]);
  road([[31, 51], [29, 57], [28, 60]], 2);
  road([[66, 82], [75, 74], [80, 62]], 2); // sendero costero puerto -> cala
  W.roadTiles = roadTiles;

  // ---------- 4. Villarroca (ciudad amurallada) ----------
  const { x0, z0, x1, z1 } = TOWN;
  rect(x0 + 1, z0 + 1, x1 - 1, z1 - 1, T.GRASS);
  rect(49, z0, 51, z1, T.STONE);
  rect(x0, 49, x1, 51, T.STONE);
  rect(45, 45, 55, 55, T.STONE);
  reserve(x0 - 1, z0 - 1, x1 + 1, z1 + 1);

  const isGate = (x, z) => (x >= 49 && x <= 51) || (z >= 49 && z <= 51);
  const towerSpots = [
    [x0, z0], [x1, z0], [x0, z1], [x1, z1],
    [48, z0], [52, z0], [48, z1], [52, z1],
    [x0, 48], [x0, 52], [x1, 48], [x1, 52],
  ];
  const towerSet = new Set(towerSpots.map(([x, z]) => idx(x, z)));
  for (let x = x0; x <= x1; x++) {
    for (const z of [z0, z1]) {
      if (isGate(x, z) && !(x === x0 || x === x1)) continue;
      if (towerSet.has(idx(x, z))) continue;
      W.walls.push({ x, z, dir: 'x' });
      block(x, z);
    }
  }
  for (let z = z0 + 1; z < z1; z++) {
    for (const x of [x0, x1]) {
      if (isGate(x, z)) continue;
      if (towerSet.has(idx(x, z))) continue;
      W.walls.push({ x, z, dir: 'z' });
      block(x, z);
    }
  }
  towerSpots.forEach(([x, z], i) => {
    W.towers.push({ x, z, guard: i < 4 });
    block(x, z);
  });

  // ---------- 5. Edificios ----------
  const building = (b) => {
    W.buildings.push(b);
    for (let z = b.z0; z < b.z0 + b.d; z++) for (let x = b.x0; x < b.x0 + b.w; x++) block(x, z);
    reserve(b.x0 - 1, b.z0 - 1, b.x0 + b.w, b.z0 + b.d);
  };
  building({ id: 'ayto', name: 'Ayuntamiento', x0: 40, z0: 40, w: 6, d: 4, door: 's', wall: 0xeadfc8, roof: 0x3d5f8f, timber: true, h: 2.1, floors: 2 });
  building({ id: 'casa1', x0: 40, z0: 45, w: 4, d: 3, door: 'e', wall: 0xe9dcc0, roof: 0xb8452e, timber: true, h: 1.5 });
  building({ id: 'herreria', name: 'Herrería', x0: 54, z0: 40, w: 5, d: 4, door: 's', wall: 0x9a948a, roof: 0x5a3b2a, stone: true, h: 1.7 });
  building({ id: 'casa2', x0: 57, z0: 45, w: 4, d: 4, door: 'w', wall: 0xf0e4c9, roof: 0x6b8f3d, timber: true, h: 1.6 });
  building({ id: 'taberna', name: 'Taberna El Ancla Torcida', x0: 40, z0: 57, w: 6, d: 4, door: 'n', wall: 0xe4cfa6, roof: 0xc0562f, timber: true, h: 2.0, floors: 2, sign: 0x7a4a24 });
  building({ id: 'casa3', x0: 40, z0: 52, w: 4, d: 3, door: 'e', wall: 0xece2cc, roof: 0xd2a640, thatch: true, h: 1.4 });
  building({ id: 'casa4', x0: 52, z0: 57, w: 4, d: 4, door: 'n', wall: 0xe8dcc4, roof: 0x3d5f8f, timber: true, h: 1.6 });
  building({ id: 'casa5', x0: 57, z0: 52, w: 4, d: 3, door: 'w', wall: 0xf3e9d2, roof: 0xb8452e, h: 1.5 });
  building({ id: 'reloj', name: 'Torre del Reloj', x0: 57, z0: 57, w: 3, d: 3, door: 'n', wall: 0xa8a297, roof: 0x3d4f6f, stone: true, h: 4.6, clock: true });
  // Puerto
  building({ id: 'sirena', name: 'Taberna La Sirena Tuerta', x0: 38, z0: 77, w: 6, d: 4, door: 's', wall: 0x6e4a2f, roof: 0x8f2e2a, plank: true, h: 1.8, sign: 0x2b1d14 });
  building({ id: 'almacen', name: 'Almacén del Puerto', x0: 56, z0: 77, w: 6, d: 4, door: 's', wall: 0x7d5a3a, roof: 0x4a3a2c, plank: true, h: 1.9 });
  building({ id: 'faro', name: 'Faro de Salitre', x0: 34, z0: 85, w: 2, d: 2, door: 'e', wall: 0xf4f0e6, roof: 0xb33a2e, h: 5.5, lighthouse: true });
  // Granja
  building({ id: 'granja', name: 'Granja', x0: 24, z0: 54, w: 5, d: 3, door: 's', wall: 0xead6ae, roof: 0xd8b04a, thatch: true, h: 1.4 });

  // Torre del reloj: dentro de la ciudad en el cuadrante SE ya reservada.
  W.landmarks.spawn = { x: 50, z: 53 };

  // ---------- 6. Plaza: fuente, puestos y farolas ----------
  W.props.push({ type: 'fountain', x: 50, z: 50 });
  for (let z = 49; z <= 51; z++) for (let x = 49; x <= 51; x++) block(x, z);
  const prop = (type, x, z, rot = 0, blocks = true, extra = {}) => {
    W.props.push({ type, x, z, rot, ...extra });
    if (blocks) block(x, z);
  };
  prop('stall', 46, 46, 0, true, { color: 0xc94a3a });
  prop('stall', 54, 46, 0, true, { color: 0x3a72c9 });
  prop('stall', 46, 54, 0, true, { color: 0xe0b23a });
  prop('barrel', 47, 46); prop('crate', 53, 46); prop('barrel', 47, 54);
  prop('anvil', 59, 44, 0); prop('forge', 53, 41, 0);
  prop('haystack', 30, 55); prop('haystack', 30, 54, 0.5);
  prop('well', 22, 56);
  prop('bench', 46, 52, Math.PI / 2, true); prop('bench', 54, 52, -Math.PI / 2, true);

  const lamp = (x, z) => { W.lamps.push({ x, z }); block(x, z); };
  [[45, 45], [55, 45], [45, 55], [55, 55], [48, 41], [48, 60], [48, 64], [52, 70], [48, 76], [52, 84],
    [48, 35], [52, 29], [36, 48], [30, 53], [64, 48], [70, 47], [47, 88], [53, 88], [48, 98], [45, 98]].forEach(([x, z]) => lamp(x, z));

  // ---------- 7. Muelles y barco ----------
  rect(49, 89, 51, 98, T.DOCK);
  rect(44, 97, 51, 98, T.DOCK);
  W.ship = { x: 53.7, z: 93 };
  W.rowboat = { x: 46.4, z: 92 };
  prop('cannon', 45, 86, Math.PI, true); prop('cannon', 55, 86, Math.PI, true);
  prop('barrel', 55, 82); prop('barrel', 56, 82); prop('crate', 61, 82); prop('crate', 61, 83);
  prop('barrel', 37, 82); prop('crate', 44, 82); prop('net', 46, 85, 0, false);
  prop('barrel', 50, 98); prop('crate', 44, 97);
  reserve(32, 72, 68, 99);

  // ---------- 8. Granja de los Trigales ----------
  rect(22, 60, 33, 68, T.FIELD);
  for (let z = 60; z <= 68; z++) for (let x = 22; x <= 33; x++) {
    if ((x - 22) % 2 === 0) W.decor.push({ type: 'wheat', x, z, rot: rnd() * 6, s: 0.8 + rnd() * 0.4 });
  }
  for (let x = 21; x <= 34; x++) { prop('fence', x, 59, 0, false); prop('fence', x, 69, 0, false); }
  for (let z = 60; z <= 68; z++) { prop('fence', 21, z, Math.PI / 2, false); prop('fence', 34, z, Math.PI / 2, false); }
  prop('scarecrow', 28, 64, 0, true);
  reserve(20, 52, 35, 70);

  // ---------- 9. Cala de los Huesos ----------
  W.wreck = { x: 89.5, z: 52.5 };
  for (let z = 50; z <= 55; z++) for (let x = 88; x <= 91; x++) block(x, z);
  prop('campfire', 85, 46, 0, true);
  prop('chest', 88, 58, 0, true);
  prop('tent', 83, 44, 0.4, true);
  prop('barrel', 86, 57); prop('crate', 84, 58);
  reserve(78, 40, 99, 62);

  // ---------- 10. Árboles, rocas y decoración ----------
  let treeId = 0, rockId = 0;
  const nearRoad = (x, z) => {
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (roadTiles.has(idx(x + dx, z + dz))) return true;
    return false;
  };
  for (let z = 1; z < N - 1; z++) {
    for (let x = 1; x < N - 1; x++) {
      const i = idx(x, z);
      if (blocked[i] || reserved[i]) continue;
      const t = tiles[i];
      if (t === T.WATER || t === T.DOCK || t === T.FIELD) continue;
      if (nearRoad(x, z)) continue;
      const cluster = fbm(x * 0.11, z * 0.11, 77);
      const clearing = fbm(x * 0.2, z * 0.2, 88);
      const r = rnd();
      if (t === T.SAND) {
        if (r < 0.055) { W.trees.push({ id: treeId++, type: 'palm', x, z, s: 0.85 + rnd() * 0.4, rot: rnd() * 6.28 }); block(x, z); }
        else if (r < 0.065) { W.rocks.push({ id: rockId++, x, z, s: 0.5 + rnd() * 0.3 }); block(x, z); }
        continue;
      }
      const quarry = x >= 10 && x <= 32 && z >= 34 && z <= 47;
      if (quarry) {
        if (r < 0.2) { W.rocks.push({ id: rockId++, x, z, s: 0.65 + rnd() * 0.5 }); block(x, z); }
        else if (r < 0.24) { W.trees.push({ id: treeId++, type: 'pine', x, z, s: 0.8 + rnd() * 0.4, rot: rnd() * 6.28 }); block(x, z); }
        continue;
      }
      const forest = z < 34;
      let p = forest ? (cluster > 0.48 ? 0.55 : 0.16) : (cluster > 0.6 ? 0.3 : 0.045);
      const dcx = x - 50, dcz = z - 50;
      if (Math.sqrt(dcx * dcx + dcz * dcz) > 33) p += 0.12;
      if (clearing < 0.3) p *= 0.25;
      if (r < p) {
        const k = rnd();
        let type;
        if (forest) type = k < 0.62 ? 'pine' : k < 0.86 ? 'oak' : 'autumn';
        else type = k < 0.38 ? 'oak' : k < 0.68 ? 'pine' : k < 0.88 ? 'autumn' : 'yellow';
        W.trees.push({ id: treeId++, type, x, z, s: 0.8 + rnd() * 0.45, rot: rnd() * 6.28, hue: rnd() });
        block(x, z);
      } else if (r < p + 0.012) {
        W.rocks.push({ id: rockId++, x, z, s: 0.45 + rnd() * 0.35 });
        block(x, z);
      }
    }
  }

  for (let z = 0; z < N; z++) {
    for (let x = 0; x < N; x++) {
      const i = idx(x, z);
      const t = tiles[i];
      if (blocked[i]) continue;
      const r = rnd();
      const ox = (rnd() - 0.5) * 0.7, oz = (rnd() - 0.5) * 0.7;
      if (t === T.GRASS || t === T.DARK) {
        if (r < 0.22) W.decor.push({ type: 'tuft', x: x + ox, z: z + oz, rot: rnd() * 6, s: 0.7 + rnd() * 0.6 });
        else if (r < 0.26) W.decor.push({ type: 'flower', x: x + ox, z: z + oz, rot: rnd() * 6, s: 0.8 + rnd() * 0.4, c: Math.floor(rnd() * 4) });
        else if (r < 0.285 && z < 36) W.decor.push({ type: 'mushroom', x: x + ox, z: z + oz, rot: rnd() * 6, s: 0.8 + rnd() * 0.5 });
        else if (r < 0.3) W.decor.push({ type: 'pebble', x: x + ox, z: z + oz, rot: rnd() * 6, s: 0.8 + rnd() * 0.5 });
      } else if (t === T.DIRT || t === T.SAND) {
        if (r < 0.06) W.decor.push({ type: 'pebble', x: x + ox, z: z + oz, rot: rnd() * 6, s: 0.8 + rnd() * 0.6 });
        else if (t === T.SAND && r < 0.075) W.decor.push({ type: 'shell', x: x + ox, z: z + oz, rot: rnd() * 6, s: 1 });
      }
    }
  }

  // ---------- 11. NPCs ----------
  const npc = (d) => { W.npcs.push(d); blocked[idx(d.x, d.z)] = 0; };
  npc({ id: 'marisol', name: 'Alcaldesa Marisol', x: 43, z: 44, wander: 2, look: { shirt: 0x6a3d8f, pants: 0x3b2a4a, hair: 0xb8b8b8, hat: 'circlet', skin: 0xe8b98f, dress: true, longHair: true, cape: 0x4a2a6a, trim: 0xe0b040 } });
  npc({ id: 'bruno', name: 'Carpintero Bruno', x: 44, z: 53, wander: 2, look: { shirt: 0x8a6a3a, pants: 0x4a3a28, hair: 0x5a3a20, beard: 0x5a3a20, skin: 0xd9a066, apron: 0xb08a5a, bracers: true, bracerColor: 0x6a4a2a } });
  npc({ id: 'tadeo', name: 'Herrero Tadeo', x: 58, z: 44, wander: 1, look: { shirt: 0x7a3a2a, pants: 0x2e2a28, hair: null, beard: 0x2a1a10, skin: 0xb8784a, apron: 0x2a2a2a } });
  npc({ id: 'nerea', name: 'Capitana Nerea', x: 50, z: 88, wander: 1, look: { shirt: 0x9a1f24, pants: 0x1e1a1a, hair: 0x1a1210, hat: 'tricorn', feather: 0xd83a3a, skin: 0xc68a5a, coat: true, cravat: true, sash: 0x1a1a1a, baldric: 0x3a2414, bootCuff: true, earring: true, sleeve: 0xf0ead8, longHair: true, sword: true } });
  npc({ id: 'ilyas', name: 'Mercader Ilyas', x: 58, z: 82, wander: 1, look: { shirt: 0x1f7a7a, pants: 0xd8c8a0, hair: 0x1a1a1a, hat: 'turban', skin: 0xa86a3a, beard: 0x1a1a1a, vest: 0xc89a3a, sash: 0xb03a2a, earring: true } });
  npc({ id: 'lucia', name: 'Granjera Lucía', x: 27, z: 58, wander: 3, look: { shirt: 0x6a9a3a, pants: 0x5a4a3a, hair: 0xd8a040, hat: 'straw', skin: 0xf0c49a, dress: true, dressColor: 0x8a6a3a, apron: 0xf0ead8 } });
  npc({ id: 'ramiro', name: 'Guardia Ramiro', x: 47, z: 37, wander: 0, look: { shirt: 0x3a5a8a, pants: 0x2a2a3a, hat: 'helmet', skin: 0xe0aa80, armor: true, tabard: 0x3a5a8a, spear: true } });
  npc({ id: 'elvira', name: 'Guardia Elvira', x: 53, z: 63, wander: 0, look: { shirt: 0x3a5a8a, pants: 0x2a2a3a, hat: 'helmet', skin: 0xc68a5a, armor: true, tabard: 0x3a5a8a, spear: true, longHair: true, hair: 0x2a1a10 } });
  npc({ id: 'pio', name: 'Aldeano Pío', x: 52, z: 47, wander: 5, look: { shirt: 0x4a7a3a, pants: 0x5a4030, hair: 0x6a4a2a, hat: 'cap', capColor: 0x2e5a9a, skin: 0xe8b98f, vest: 0x7a5232 } });
  npc({ id: 'clara', name: 'Niña Clara', x: 47, z: 50, wander: 5, small: true, look: { shirt: 0xe07a9a, pants: 0x4a3a5a, hair: 0xe0b050, skin: 0xf3cfaa, dress: true } });
  npc({ id: 'gaspar', name: 'Pescador Gaspar', x: 46, z: 98, wander: 0, look: { shirt: 0x3a6a9a, pants: 0x3a3a3a, hair: 0xcccccc, beard: 0xdddddd, hat: 'bandana', capColor: 0xc9a23a, skin: 0xc68a5a, rod: true, vest: 0xc8b878, boots: 0x2a3a2a } });
  npc({ id: 'rufo', name: 'Pirata Rufo', x: 41, z: 82, wander: 2, look: { shirt: 0xe8e0d0, pants: 0x2a3a6a, hair: 0x8a2a10, beard: 0x8a2a10, hat: 'bandana', capColor: 0xb02a2a, skin: 0xe0aa80, eyepatch: true, vest: 0x3a2a1a, sash: 0xb02a2a, earring: true, bootCuff: true } });
  npc({ id: 'tomasa', name: 'Vigía Tomasa', x: 37, z: 86, wander: 1, look: { shirt: 0x2a4a6a, pants: 0x2a2a2a, hair: 0x9a9a9a, hat: 'cap', capColor: 0x1a2a3a, skin: 0xe8b98f, coat: true, scarf: 0xc8302a } });

  // ---------- 12. Zonas de enemigos ----------
  W.spawns.push({ type: 'wolf', count: 9, area: [28, 6, 72, 32], lvl: [2, 4] });
  W.spawns.push({ type: 'boar', count: 6, area: [10, 34, 33, 48], lvl: [4, 6] });
  W.spawns.push({ type: 'crab', count: 5, area: [60, 60, 80, 90], lvl: [1, 3], sand: true });
  W.spawns.push({ type: 'crab', count: 5, area: [5, 55, 30, 95], lvl: [1, 3], sand: true });
  W.spawns.push({ type: 'skeleton', count: 7, area: [79, 41, 91, 61], lvl: [6, 9] });
  W.spawns.push({ type: 'boss', count: 1, area: [86, 56, 88, 57], lvl: [12, 12] });

  W.walkable = (x, z) => {
    if (!inb(x, z)) return false;
    const i = idx(x, z);
    if (blocked[i]) return false;
    return tiles[i] !== T.WATER;
  };
  W.groundY = (x, z) => (W.tile(Math.round(x), Math.round(z)) === T.DOCK ? 0.14 : 0);

  W.areaName = (x, z) => {
    if (x >= x0 && x <= x1 && z >= z0 && z <= z1) return 'Villarroca';
    if (z >= 72 && x >= 32 && x <= 68) return 'Puerto Salitre';
    if (x >= 78 && z >= 38 && z <= 63) return 'Cala de los Huesos';
    if (x >= 20 && x <= 35 && z >= 52 && z <= 70) return 'Granja de los Trigales';
    if (x >= 8 && x <= 33 && z >= 33 && z <= 48) return 'Pedregal del Oeste';
    if (z < 34) return 'Bosque Norte';
    return 'Prados de Isla Bruma';
  };
  return W;
}

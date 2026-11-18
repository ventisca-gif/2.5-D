// Regiones extra que comparten el sistema de coordenadas del mapa principal:
//  - islas nuevas (alcanzables en barco)
//  - interiores de casas (salas situadas lejos, en x >= 1000)
import { mulberry32, fbm } from './rng.js';
import { T } from './world.js';

export const INTERIOR_X0 = 1000;
export const ROOM_STRIDE = 30;
const KEY = (x, z) => (z + 1024) * 4096 + (x + 1024);
export { KEY };

// ======================================================================= islas
function biomeTile(biome, lx, lz, r, R, t, seed, def) {
  const n = fbm(lx * 0.11, lz * 0.11, seed + 7, 3);
  const shore = r > R - 2.4;
  if (biome === 'desert') return shore ? T.SAND : n > 0.64 ? T.DIRT : T.SAND;
  if (biome === 'jungle') return shore ? T.SAND : n > 0.62 ? T.GRASS : T.DARK;
  if (biome === 'volcano') {
    const c = (def.N - 1) / 2;
    const px = c - def.dockDir[0] * def.N * 0.2, pz = c - def.dockDir[1] * def.N * 0.2;
    const dp = Math.hypot(lx - px, lz - pz);
    if (dp < 3.2) return T.LAVA;
    if (r < R - 5 && dp > 6 && Math.abs(n - 0.5) < 0.022) return T.LAVA;
    return shore ? (n > 0.5 ? T.ROCK : T.DIRT) : T.ROCK;
  }
  if (biome === 'fort') return shore ? T.SAND : t;
  if (biome === 'snow') return shore ? (n > 0.55 ? T.ROCK : T.SNOW) : n > 0.66 ? T.ROCK : T.SNOW;
  if (biome === 'candy') return shore ? T.SAND : n > 0.6 ? T.CANDY : n > 0.42 ? T.GRASS : T.CANDY;
  if (biome === 'mangrove') return shore ? T.SAND : n > 0.7 ? T.WATER : n > 0.5 ? T.GRASS : T.DARK;
  if (biome === 'tech') return shore ? T.ROCK : n > 0.58 ? T.METAL : n > 0.4 ? T.STONE : T.DIRT;
  if (biome === 'ghost') return shore ? T.DIRT : n > 0.6 ? T.DARK : T.ROCK;
  return t;
}

export function makeIslet(def) {
  const { id, name, ox, oz, N, seed, dockDir, biome } = def;
  const rnd = mulberry32(seed);
  const tiles = new Uint8Array(N * N);
  const blocked = new Uint8Array(N * N);
  const reserved = new Uint8Array(N * N);
  const li = (lx, lz) => lz * N + lx;
  const linb = (lx, lz) => lx >= 0 && lz >= 0 && lx < N && lz < N;
  const c = (N - 1) / 2;
  for (let lz = 0; lz < N; lz++) for (let lx = 0; lx < N; lx++) {
    const dx = lx - c, dz = lz - c;
    const r = Math.hypot(dx, dz);
    const a = Math.atan2(dz, dx);
    const R = N / 2 - 10 + (fbm(Math.cos(a) * 1.6 + seed, Math.sin(a) * 1.6, seed, 3) - 0.5) * 6;
    let t = r < R ? (r > R - 2.4 ? T.SAND : T.GRASS) : T.WATER;
    if (t !== T.WATER && biome) t = biomeTile(biome, lx, lz, r, R, t, seed, def);
    tiles[li(lx, lz)] = t;
  }
  const R = {
    id, name, ox, oz, N, tiles, blocked, kind: 'islet',
    trees: [], rocks: [], decor: [], props: [], buildings: [], walls: [], npcs: [], spawns: [], biome, towns: def.towns || [],
  };
  const lt = (x, z) => { const lx = x - ox, lz = z - oz; return linb(lx, lz) ? tiles[li(lx, lz)] : T.WATER; };
  R.contains = (x, z) => x >= ox && z >= oz && x < ox + N && z < oz + N;
  R.tile = lt;
  R.walkable = (x, z) => { const lx = x - ox, lz = z - oz; if (!linb(lx, lz) || blocked[li(lx, lz)]) return false; const t = tiles[li(lx, lz)]; return t !== T.WATER && t !== T.LAVA; };
  R.setTile = (x, z, t) => { const lx = x - ox, lz = z - oz; if (linb(lx, lz)) tiles[li(lx, lz)] = t; };
  R.setBlocked = (x, z, v) => { const lx = x - ox, lz = z - oz; if (linb(lx, lz)) blocked[li(lx, lz)] = v; };
  R.groundY = (x, z) => (lt(Math.round(x), Math.round(z)) === T.DOCK ? 0.14 : 0);
  R.areaName = (x, z) => { for (const t of R.towns) if (Math.abs(x - t.x) <= t.r && Math.abs(z - t.z) <= t.r) return t.name; return name; };
  const block = (x, z) => R.setBlocked(x, z, 1);
  const reserve = (x, z, r) => {
    for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      const lx = x - ox + dx, lz = z - oz + dz;
      if (linb(lx, lz)) reserved[li(lx, lz)] = 1;
    }
  };
  // muelle: del centro hacia dockDir hasta el agua, y 5 casillas mar adentro (2 de ancho)
  const cx = ox + Math.round(c), cz = oz + Math.round(c);
  let x = cx, z = cz;
  while (lt(x + dockDir[0], z + dockDir[1]) !== T.WATER || Math.hypot(x - cx, z - cz) < 6) {
    x += dockDir[0]; z += dockDir[1];
    if (lt(x, z) === T.WATER || lt(x, z) === T.LAVA) { const lx = x - ox, lz = z - oz; if (linb(lx, lz)) tiles[li(lx, lz)] = biome === 'volcano' ? T.ROCK : T.SAND; }
  }
  const coast = { x, z };
  const perp = [-dockDir[1], dockDir[0]];
  for (let k = 1; k <= 6; k++) {
    for (const w of [0, 1]) {
      const dx = x + dockDir[0] * k + perp[0] * w, dz = z + dockDir[1] * k + perp[1] * w;
      const lx = dx - ox, lz = dz - oz;
      if (linb(lx, lz)) tiles[li(lx, lz)] = T.DOCK;
    }
  }
  const end = { x: x + dockDir[0] * 6, z: z + dockDir[1] * 6 };
  for (let k = 0; k <= 6; k++) reserve(x + dockDir[0] * k, z + dockDir[1] * k, 1);
  R.dock = {
    id, name,
    shipX: end.x - dockDir[0] * 2.5 - perp[0] * 2.7, shipZ: end.z - dockDir[1] * 2.5 - perp[1] * 2.7,
    heading: Math.atan2(dockDir[0], dockDir[1]),
    land: { x: x + dockDir[0] * 4, z: z + dockDir[1] * 4 },
  };
  R.center = { x: cx, z: cz };
  R.reserve = reserve;
  R.block = block;
  R.rnd = rnd;
  R.coast = coast;
  R._reserved = (x, z) => { const lx = x - ox, lz = z - oz; return !linb(lx, lz) || reserved[li(lx, lz)]; };
  return R;
}

export function populate(R, density = 1) {
  const { rnd } = R;
  const B = R.biome;
  let id = 0;
  const tree = (type, x, z, s) => { R.trees.push({ id: id++, type, x, z, s, rot: rnd() * 6.28, hue: rnd() }); R.block(x, z); };
  const rock = (x, z, dark) => { R.rocks.push({ id: id++, x, z, s: 0.45 + rnd() * 0.45, tint: dark ? 0.42 : B === 'desert' ? 1.12 : 0 }); R.block(x, z); };
  for (let z = R.oz; z < R.oz + R.N; z++) for (let x = R.ox; x < R.ox + R.N; x++) {
    const t = R.tile(x, z);
    if (t === T.WATER || t === T.DOCK || t === T.LAVA || !R.walkable(x, z) || R._reserved(x, z)) continue;
    const r = rnd();
    if (B === 'desert') {
      if (r < 0.035 * density) tree('cactus', x, z, 0.8 + rnd() * 0.5);
      else if (r < 0.045 * density) tree('dead', x, z, 0.8 + rnd() * 0.4);
      else if (r > 0.975) rock(x, z);
      continue;
    }
    if (B === 'volcano') {
      if (r < 0.03 * density) tree('dead', x, z, 0.7 + rnd() * 0.5);
      else if (r > 0.95) rock(x, z, true);
      continue;
    }
    if (B === 'snow') { if (r < 0.1 * density) tree('snowpine', x, z, 0.8 + rnd() * 0.5); else if (r > 0.96) rock(x, z); continue; }
    if (B === 'candy') { if (r < 0.07 * density) tree(rnd() < 0.5 ? 'candy' : 'lollipop', x, z, 0.8 + rnd() * 0.5); continue; }
    if (B === 'mangrove') { if (r < 0.12 * density) tree('mangrove', x, z, 0.9 + rnd() * 0.5); else if (r > 0.98) rock(x, z); continue; }
    if (B === 'tech') { if (r < 0.03 * density) tree('dead', x, z, 0.7 + rnd() * 0.4); else if (r > 0.95) rock(x, z); continue; }
    if (B === 'jungle') {
      if (t === T.SAND) { if (r < 0.08) tree('palm', x, z, 0.85 + rnd() * 0.45); }
      else if (r < 0.2 * density) { const k = rnd(); tree(k < 0.55 ? 'jungle' : k < 0.8 ? 'palm' : 'oak', x, z, 0.85 + rnd() * 0.45); }
      else if (r > 0.975) rock(x, z);
      continue;
    }
    if (t === T.SAND && r < 0.09 * density) tree('palm', x, z, 0.85 + rnd() * 0.45);
    else if (t === T.GRASS && r < 0.14 * density) { const k = rnd(); tree(k < 0.45 ? 'palm' : k < 0.75 ? 'oak' : 'pine', x, z, 0.8 + rnd() * 0.4); }
    else if (r > 0.965) rock(x, z);
  }
  for (let z = R.oz; z < R.oz + R.N; z++) for (let x = R.ox; x < R.ox + R.N; x++) {
    const t = R.tile(x, z);
    if (!R.walkable(x, z)) continue;
    const r = rnd();
    const ox = (rnd() - 0.5) * 0.7, oz = (rnd() - 0.5) * 0.7;
    if ((t === T.GRASS || t === T.DARK) && r < (B === 'jungle' ? 0.35 : 0.25)) R.decor.push({ type: r < 0.04 ? 'flower' : B === 'jungle' && r < 0.07 ? 'mushroom' : 'tuft', x: x + ox, z: z + oz, rot: rnd() * 6, s: 0.8 + rnd() * 0.5, c: Math.floor(rnd() * 4) });
    else if (t === T.SAND && r < 0.07) R.decor.push({ type: r < 0.03 && B !== 'desert' ? 'shell' : 'pebble', x: x + ox, z: z + oz, rot: rnd() * 6, s: 1 });
    else if ((t === T.ROCK || t === T.DIRT) && r < 0.05) R.decor.push({ type: 'pebble', x: x + ox, z: z + oz, rot: rnd() * 6, s: 1.3 });
  }
}

export function makeIslets() {
  // Isla Tortuga: refugio de contrabandistas (noreste)
  const tor = makeIslet({ id: 'tortuga', name: 'Isla Tortuga', ox: 108, oz: -2, N: 42, seed: 41, dockDir: [-1, 0] });
  const tc = tor.center;
  tor.reserve(tc.x, tc.z, 5);
  const hut = (x0, z0, door) => {
    const b = { id: 'choza' + x0, x0, z0, w: 3, d: 3, door, wall: 0x8a6a44, roof: 0xc9a24a, thatch: true, plank: true, h: 1.3 };
    tor.buildings.push(b);
    for (let z = z0; z < z0 + 3; z++) for (let x = x0; x < x0 + 3; x++) tor.block(x, z);
  };
  hut(tc.x - 4, tc.z - 5, 's');
  hut(tc.x + 2, tc.z - 5, 's');
  const tprop = (type, x, z, rot = 0, blocks = true, extra = {}) => { tor.props.push({ type, x, z, rot, ...extra }); if (blocks) tor.block(x, z); };
  tprop('campfire', tc.x, tc.z);
  tprop('barrel', tc.x - 3, tc.z + 2); tprop('barrel', tc.x - 3, tc.z + 3); tprop('crate', tc.x + 3, tc.z + 2);
  tprop('tent', tc.x + 3, tc.z + 4, 0.6);
  tprop('chest', tc.x - 1, tc.z - 1, 0, true, { id: 'tortuga_cofre', loot: { gold: 60, potion: 1 } });
  tor.npcs.push({ id: 'mara', name: 'Contrabandista Mara', x: tc.x + 1, z: tc.z + 1, wander: 2, look: { shirt: 0x2a5a5a, pants: 0x3a2a1a, hair: 0x1a1a1a, longHair: true, hat: 'bandana', capColor: 0x6a2a8a, skin: 0xa86a3a, coat: true, sash: 0x6a2a8a, baldric: 0x3a2414, earring: true, bootCuff: true, sword: true } });
  tor.npcs.push({ id: 'pepe', name: 'Grumete Pepe', x: tc.x - 2, z: tc.z + 2, wander: 3, small: true, look: { shirt: 0xe8e0d0, pants: 0x2a3a6a, hair: 0xd8a040, skin: 0xf0c49a, hat: 'bandana', capColor: 0x2a6ab0 } });
  populate(tor, 1);
  // bajío de la marea: con marea baja se puede caminar hasta la Roca de la Marea (este)
  tor.tidal = new Set();
  for (let x = tc.x + 9; x <= tc.x + 17; x++) for (const dz of [0, 1]) if (tor.tile(x, tc.z + dz) === T.WATER) tor.tidal.add(KEY(x, tc.z + dz));
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (dx * dx + dz * dz <= 5) tor.setTile(tc.x + 18 + dx, tc.z + dz, T.SAND);
  tor.props.push({ type: 'chest', x: tc.x + 18, z: tc.z, rot: 0, id: 'marea_cofre', loot: { gold: 350, potion: 2 } }); tor.block(tc.x + 18, tc.z);
  for (let z = tc.z - 4; z <= tc.z + 5; z++) for (let x = tc.x + 6; x <= tc.x + 14; x++) if (tor.tile(x, z) === T.WATER && Math.hypot(x - tc.x, z - tc.z) < 15) tor.tidal.add(KEY(x, z));
  tor.low = false;
  { const t0 = tor.tile, w0 = tor.walkable;
    tor.tile = (x, z) => { const t = t0(x, z); return t === T.WATER && tor.low && tor.tidal.has(KEY(x, z)) ? T.SAND : t; };
    tor.walkable = (x, z) => w0(x, z) || (tor.low && tor.tidal.has(KEY(x, z))); }
  // escondite pirata al este de Tortuga
  for (const [dx, dz, r] of [[7, -4, 0.4], [7, 4, -0.6]]) { tor.props.push({ type: 'tent', x: tc.x + dx, z: tc.z + dz, rot: r }); tor.block(tc.x + dx, tc.z + dz); }
  tor.props.push({ type: 'campfire', x: tc.x + 6, z: tc.z + 1 }); tor.block(tc.x + 6, tc.z + 1);
  tor.props.push({ type: 'flag', x: tc.x + 8, z: tc.z, rot: 0 }); tor.block(tc.x + 8, tc.z);
  tor.spawns.push({ type: 'pirate', count: 6, area: [tc.x + 3, tc.z - 7, tc.x + 9, tc.z + 7], lvl: [22, 28] });
  tor.spawns.push({ type: 'crab', count: 4, area: [tor.ox, tor.oz, tor.ox + tor.N - 1, tor.oz + tor.N - 1], lvl: [3, 5], sand: true });

  // Isla Calavera: tesoro maldito (sureste)
  const cal = makeIslet({ id: 'calavera', name: 'Isla Calavera', ox: 112, oz: 96, N: 44, seed: 77, dockDir: [-1, 0] });
  const cc = cal.center;
  cal.reserve(cc.x, cc.z, 5);
  const cprop = (type, x, z, rot = 0, blocks = true, extra = {}) => { cal.props.push({ type, x, z, rot, ...extra }); if (blocks) cal.block(x, z); };
  cprop('skullrock', cc.x, cc.z - 3, 0, false);
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) cal.block(cc.x + dx, cc.z - 3 + dz);
  cprop('chest', cc.x, cc.z + 1, 0, true, { id: 'calavera_cofre', loot: { gold: 300, potion: 3 }, big: true });
  cprop('campfire', cc.x - 3, cc.z + 2);
  cprop('barrel', cc.x + 3, cc.z + 2);
  for (const [dx, dz, dir] of [[-5, -5, 'x'], [-4, -5, 'x'], [4, -5, 'x'], [5, -4, 'z'], [-5, 4, 'z'], [5, 5, 'x']]) {
    cal.walls.push({ x: cc.x + dx, z: cc.z + dz, dir, ruin: true });
    cal.block(cc.x + dx, cc.z + dz);
  }
  populate(cal, 0.8);
  cal.spawns.push({ type: 'skeleton', count: 6, area: [cc.x - 7, cc.z - 7, cc.x + 7, cc.z + 7], lvl: [9, 12] });
  // superjefe: el Serafín Caído vigila la cima de la isla
  cal.spawns.push({ type: 'serafin', count: 1, area: [cc.x - 1, cc.z + 8, cc.x + 1, cc.z + 10], lvl: [101, 101] });

  return [tor, cal];
}

// ======================================================================= interiores
// muebles: [tipo, x, z, rot, ancho, fondo, bloquea]
export const ROOMS = [
  {
    id: 'ayto', name: 'Ayuntamiento', w: 9, d: 7, floor: 0xb08a5a, wall: 0xefe4cc, wood: 0x6a4428,
    items: [
      ['bookshelf', 1, 0], ['bookshelf', 2, 0], ['banner', 4, 0, 0, 1, 1, false], ['window', 6, 0, 0, 1, 1, false],
      ['chest', 7, 0], ['plant', 8, 0], ['desk', 4.5, 2, 0, 2, 1], ['chair', 4.5, 1, Math.PI, 1, 1, false],
      ['rug', 4, 4.5, 0, 3, 2, false], ['fireplace', 0, 3, Math.PI / 2], ['plant', 0, 6], ['plant', 8, 6], ['bench', 8, 3, -Math.PI / 2],
      ['painting', 0, 1, Math.PI / 2, 1, 1, false],
    ],
    npcs: [{ id: 'lope', name: 'Escribano Lope', x: 5, z: 1, wander: 1, look: { shirt: 0x3a3a6a, pants: 0x2a2a3a, hair: 0x9a9a9a, beard: 0x9a9a9a, skin: 0xe8b98f, robe: 0x3a3a6a } }],
  },
  {
    id: 'taberna', name: 'Taberna El Ancla Torcida', w: 9, d: 7, floor: 0xa07a4a, wall: 0xe8d6b0, wood: 0x5a3a20,
    items: [
      ['counter', 2.5, 1, 0, 4, 1], ['shelf', 2.5, 0, 0, 3, 1, false], ['barrel', 0, 0], ['barrel', 5, 0], ['barrel', 6, 0],
      ['fireplace', 0, 4, Math.PI / 2], ['table', 6, 3], ['stool', 5, 3, 0, 1, 1, false], ['stool', 7, 3, 0, 1, 1, false],
      ['table', 3, 4], ['stool', 2, 4, 0, 1, 1, false], ['stool', 4, 4, 0, 1, 1, false], ['table', 7, 5], ['stool', 8, 5, 0, 1, 1, false],
      ['window', 7, 0, 0, 1, 1, false], ['poster', 0, 2, Math.PI / 2, 1, 1, false], ['plant', 8, 0], ['rug', 4, 6, 0, 2, 1, false],
    ],
    npcs: [
      { id: 'rosa', name: 'Tabernera Rosa', x: 2, z: 0, wander: 1, look: { shirt: 0xb83a3a, pants: 0x5a2a2a, hair: 0x8a3a1a, skin: 0xf0c49a, dress: true, apron: 0xf0ead8, longHair: true } },
      { id: 'ines', name: 'Aldeana Inés', x: 2, z: 5, wander: 0, look: { shirt: 0x5a8aba, pants: 0x3a3a4a, hair: 0x3a2a1a, skin: 0xe8b98f, dress: true, dressColor: 0x3a5a8a } },
      { id: 'telmo', name: 'Bardo Telmo', x: 7, z: 2, wander: 1, look: { shirt: 0x8a3a8a, pants: 0x3a2a4a, hair: 0xd8a040, hat: 'cap', capColor: 0x6a2a6a, skin: 0xf0c49a, cape: 0x5a2a5a, vest: 0xd8b060, backpack: 0x7a5232 } },
    ],
  },
  {
    id: 'herreria', name: 'Herrería', w: 7, d: 6, floor: 0x7a7470, wall: 0xb8b0a4, wood: 0x4a3424, stoneFloor: true,
    items: [
      ['forge', 0, 1, Math.PI / 2, 1, 2], ['anvil', 2, 2], ['weaponrack', 4, 0, 0, 2, 1], ['barrel', 6, 0], ['crate', 6, 1],
      ['table', 5, 3], ['chest', 0, 5], ['window', 2, 0, 0, 1, 1, false],
    ],
    npcs: [{ id: 'nico', name: 'Aprendiz Nico', x: 3, z: 3, wander: 1, look: { shirt: 0x6a5a4a, pants: 0x3a3a3a, hair: 0x2a1a10, skin: 0xd9a066, apron: 0x3a2a1a } }],
  },
  {
    id: 'sirena', name: 'Taberna La Sirena Tuerta', w: 9, d: 7, floor: 0x6a4a2e, wall: 0x7a5a3a, wood: 0x3a2414,
    items: [
      ['counter', 5.5, 1, 0, 4, 1], ['shelf', 5.5, 0, 0, 3, 1, false], ['barrel', 8, 0], ['barrel', 8, 1], ['barrel', 0, 0], ['barrel', 1, 0],
      ['wheel', 3, 0, 0, 1, 1, false], ['anchor', 0, 3, Math.PI / 2], ['map', 0, 5, Math.PI / 2, 1, 1, false], ['poster', 0, 1, Math.PI / 2, 1, 1, false],
      ['table', 2, 4], ['stool', 1, 4, 0, 1, 1, false], ['stool', 3, 4, 0, 1, 1, false],
      ['table', 6, 4], ['stool', 5, 4, 0, 1, 1, false], ['stool', 7, 4, 0, 1, 1, false], ['crate', 8, 6],
    ],
    npcs: [
      { id: 'coral', name: 'Tabernera Coral', x: 5, z: 0, wander: 1, look: { shirt: 0x2a6a7a, pants: 0x2a2a2a, hair: 0xb03a2a, longHair: true, skin: 0xe0aa80, hat: 'bandana', capColor: 0x1a1a1a, eyepatch: true, apron: 0xe8e0d0, earring: true } },
      { id: 'quino', name: 'Marinero Quino', x: 1, z: 5, wander: 1, look: { shirt: 0xe8e0d0, pants: 0x2a3a6a, hair: 0x2a1a10, beard: 0x2a1a10, skin: 0xc68a5a, hat: 'cap', capColor: 0x1a2a4a, vest: 0x2a3a5a, scarf: 0xc8302a } },
      { id: 'olga', name: 'Pirata Olga', x: 7, z: 5, wander: 1, look: { shirt: 0x6a1a1a, pants: 0x1a1a1a, hair: 0xe0d0b0, longHair: true, skin: 0xf0c49a, hat: 'tricorn', feather: 0xe8e0d0, coat: true, cravat: true, sash: 0x1a1a1a, bootCuff: true, earring: true, sword: true } },
    ],
  },
  {
    id: 'almacen', name: 'Almacén del Puerto', w: 8, d: 7, floor: 0x9a7a52, wall: 0x8a6a44, wood: 0x4a3020,
    items: [
      ['crate', 0, 0], ['crate', 1, 0], ['crate', 0, 1], ['crate', 6, 0], ['crate', 7, 0], ['crate', 7, 1], ['crate', 7, 3],
      ['sacks', 3, 0], ['sacks', 4, 0], ['barrel', 0, 4], ['barrel', 0, 5], ['barrel', 1, 5], ['table', 4, 3], ['window', 5, 0, 0, 1, 1, false],
    ],
    npcs: [{ id: 'tito', name: 'Estibador Tito', x: 3, z: 2, wander: 2, look: { shirt: 0x8a8a6a, pants: 0x4a3a2a, hair: null, beard: 0x5a3a20, skin: 0xa86a3a, bracers: true, bracerColor: 0x5a3a20 } }],
  },
  {
    id: 'casa3', name: 'Taller de Bruno', w: 6, d: 5, floor: 0xb89062, wall: 0xf0e4c8, wood: 0x6a4428,
    items: [['workbench', 1.5, 0, 0, 2, 1], ['logs', 4, 0], ['bed', 5, 2, Math.PI / 2, 1, 2], ['chest', 0, 2], ['plant', 0, 4], ['window', 3, 0, 0, 1, 1, false]],
    npcs: [],
  },
  {
    id: 'bodega', name: 'Bodega de la Gaviota Negra', w: 8, d: 5, floor: 0x6a4a2e, wall: 0x5a3a22, wood: 0x3a2414, noBuilding: true,
    items: [
      ['bed', 7, 1, 0, 1, 2], ['bed', 6, 1, 0, 1, 2], ['barrel', 0, 0], ['barrel', 1, 0], ['crate', 0, 1], ['fireplace', 3, 0, 0, 1, 1, true],
      ['table', 2, 2], ['stool', 1, 2, 0, 1, 1, false], ['stool', 3, 2, 0, 1, 1, false], ['map', 5, 0, 0, 1, 1, false],
      ['wheel', 0, 3, Math.PI / 2, 1, 1, false], ['sacks', 7, 4], ['window', 4, 0, 0, 1, 1, false],
    ],
    npcs: [],
  },
  {
    id: 'bodega2', name: 'Bodega ampliada', w: 11, d: 6, floor: 0x6a4a2e, wall: 0x5a3a22, wood: 0x3a2414, noBuilding: true,
    items: [
      ['bed', 10, 1, 0, 1, 2], ['bed', 9, 1, 0, 1, 2], ['bed', 8, 1, 0, 1, 2], ['barrel', 0, 0], ['barrel', 1, 0], ['crate', 0, 1], ['fireplace', 3, 0, 0, 1, 1, true],
      ['table', 3, 2], ['stool', 2, 2, 0, 1, 1, false], ['stool', 4, 2, 0, 1, 1, false], ['map', 5, 0, 0, 1, 1, false], ['workbench', 6.5, 0, 0, 2, 1],
      ['wheel', 0, 3, Math.PI / 2, 1, 1, false], ['sacks', 10, 5], ['chest', 9, 5], ['window', 4, 0, 0, 1, 1, false], ['rug', 5, 4, 0, 3, 2, false], ['poster', 0, 4, Math.PI / 2, 1, 1, false],
    ],
    npcs: [],
  },
  {
    id: 'bodega3', name: 'Cubierta inferior y camarote', w: 13, d: 7, floor: 0x7a5636, wall: 0x5a3a22, wood: 0x3a2414, noBuilding: true,
    items: [
      ['bed', 12, 1, 0, 1, 2], ['bed', 11, 1, 0, 1, 2], ['bed', 10, 1, 0, 1, 2], ['bed', 9, 1, 0, 1, 2], ['barrel', 0, 0], ['barrel', 1, 0], ['crate', 0, 1], ['fireplace', 3, 0, 0, 1, 1, true],
      ['table', 3, 2], ['stool', 2, 2, 0, 1, 1, false], ['stool', 4, 2, 0, 1, 1, false], ['map', 5, 0, 0, 1, 1, false], ['workbench', 6.5, 0, 0, 2, 1], ['forge', 0, 5, Math.PI / 2, 1, 2],
      ['bookshelf', 8, 0], ['desk', 10.5, 4, 0, 2, 1], ['chair', 10.5, 3, Math.PI, 1, 1, false], ['chest', 12, 6], ['chest', 11, 6], ['painting', 12, 4, -Math.PI / 2, 1, 1, false],
      ['rug', 6, 4.5, 0, 3, 2, false], ['plant', 8, 6], ['window', 4, 0, 0, 1, 1, false], ['poster', 0, 3, Math.PI / 2, 1, 1, false],
    ],
    npcs: [],
  },
  {
    id: 'granja', name: 'Casa de la Granja', w: 7, d: 5, floor: 0xb08a5a, wall: 0xf0e0b8, wood: 0x6a4428,
    items: [['hay', 0, 0], ['hay', 0, 1], ['bed', 6, 1, Math.PI / 2, 1, 2], ['table', 3, 1], ['stool', 3, 2, 0, 1, 1, false], ['barrel', 6, 4], ['fireplace', 3, 0, 0, 1, 1, true], ['window', 5, 0, 0, 1, 1, false]],
    npcs: [{ id: 'ramon', name: 'Abuelo Ramón', x: 2, z: 2, wander: 1, look: { shirt: 0x7a6a4a, pants: 0x4a3a2a, hair: 0xe0e0e0, beard: 0xe8e8e8, hat: 'straw', skin: 0xe0aa80 } }],
  },
  {
    id: 'casaplaya', name: 'Casa de la playa', w: 10, d: 6, floor: 0xc8a878, wall: 0xf0f0e8, wood: 0x8a6a4a,
    items: [['bed', 9, 1, 0, 1, 2], ['window', 3, 0, 0, 1, 1, false], ['window', 6, 0, 0, 1, 1, false], ['chest', 0, 0], ['anchor', 0, 3, Math.PI / 2], ['plant', 9, 5]],
    npcs: [],
  },
  {
    id: 'casa2', name: 'Mansión de Villarroca', w: 14, d: 8, floor: 0x8a5a3a, wall: 0xf4ecd8, wood: 0x4a2a18,
    items: [['bed', 13, 1, 0, 1, 2], ['bed', 12, 1, 0, 1, 2], ['window', 3, 0, 0, 1, 1, false], ['window', 6, 0, 0, 1, 1, false], ['window', 9, 0, 0, 1, 1, false], ['fireplace', 0, 3, Math.PI / 2], ['chest', 0, 0], ['bookshelf', 1, 0], ['banner', 5, 0, 0, 1, 1, false], ['plant', 13, 7], ['plant', 0, 7]],
    npcs: [],
  },
  {
    id: 'casa5', name: 'Tu casa en Villarroca', w: 9, d: 6, floor: 0xb89062, wall: 0xf0e4c8, wood: 0x6a4428,
    items: [['bed', 8, 1, 0, 1, 2], ['window', 3, 0, 0, 1, 1, false], ['window', 6, 0, 0, 1, 1, false], ['fireplace', 0, 2, Math.PI / 2], ['poster', 0, 4, Math.PI / 2, 1, 1, false], ['chest', 0, 0]],
    npcs: [],
  },
];

export function makeInteriors(buildings) {
  const SIDE = { s: [0, 1], n: [0, -1], e: [1, 0], w: [-1, 0] };
  const out = [];
  ROOMS.forEach((room, i) => {
    const b = room.noBuilding ? null : buildings.find((bb) => bb.id === room.id);
    if (!b && !room.noBuilding) return;
    const X = INTERIOR_X0 + i * ROOM_STRIDE, Z = 0;
    const { w, d } = room;
    const blocked = new Uint8Array(w * d);
    for (const it of room.items) {
      const [, x, z, , fw = 1, fd = 1, blocks = true] = it;
      if (!blocks) continue;
      const x0 = Math.round(x - (fw - 1) / 2), z0 = Math.round(z - (fd - 1) / 2);
      for (let dz = 0; dz < fd; dz++) for (let dx = 0; dx < fw; dx++) {
        const lx = x0 + dx, lz = z0 + dz;
        if (lx >= 0 && lz >= 0 && lx < w && lz < d) blocked[lz * w + lx] = 1;
      }
    }
    const exit = { x: X + Math.floor(w / 2), z: Z + d };
    // puerta exterior
    const [nx, nz] = b ? SIDE[b.door] : [0, 0];
    let doorX = null, doorZ = null;
    if (!b) { /* sin puerta exterior (bodega del barco) */ }
    else if (b.door === 's' || b.door === 'n') {
      doorX = Math.floor(b.x0 + (b.w - 1) / 2);
      doorZ = b.door === 's' ? b.z0 + b.d - 1 : b.z0;
    } else {
      doorZ = Math.floor(b.z0 + (b.d - 1) / 2);
      doorX = b.door === 'e' ? b.x0 + b.w - 1 : b.x0;
    }
    const R = {
      kind: 'interior', id: room.id, name: room.name, room, X, Z, w, d, blocked, exit, building: b,
      door: b ? { x: doorX, z: doorZ } : null, front: b ? { x: doorX + nx, z: doorZ + nz } : null,
      inside: { x: exit.x, z: exit.z - 1 },
      npcs: room.npcs.map((n) => ({ ...n, x: X + n.x, z: Z + n.z })),
    };
    R.contains = (x, z) => x >= X - 1 && x <= X + w && z >= Z - 1 && z <= Z + d;
    R.walkable = (x, z) => {
      if (x === exit.x && z === exit.z) return true;
      const lx = x - X, lz = z - Z;
      if (lx < 0 || lz < 0 || lx >= w || lz >= d) return false;
      return !blocked[lz * w + lx];
    };
    R.tile = (x, z) => (R.walkable(x, z) || (x - X >= 0 && x - X < w && z - Z >= 0 && z - Z < d) ? T.STONE : T.WATER);
    R.setBlocked = (x, z, v) => { const lx = x - X, lz = z - Z; if (lx >= 0 && lz >= 0 && lx < w && lz < d) blocked[lz * w + lx] = v; };
    R.groundY = () => 0;
    R.areaName = () => room.name;
    out.push(R);
  });
  return out;
}

// Conecta las regiones al mundo principal: walkable/tile/... funcionan en todas partes.
export function attachRegions(W, regions) {
  const main = { walkable: W.walkable, tile: W.tile, groundY: W.groundY, areaName: W.areaName };
  const inMain = (x, z) => x >= 0 && z >= 0 && x < W.N && z < W.N;
  const at = (x, z) => {
    if (inMain(x, z)) return null;
    for (const r of regions) if (r.contains(x, z)) return r;
    return undefined;
  };
  W.regions = regions;
  W.regionAt = (x, z) => at(Math.round(x), Math.round(z));
  W.walkable = (x, z) => { const r = at(x, z); return r === null ? main.walkable(x, z) : r ? r.walkable(x, z) : false; };
  W.tileAll = (x, z) => { const r = at(x, z); return r === null ? main.tile(x, z) : r ? r.tile(x, z) : T.WATER; };
  W.groundY = (x, z) => {
    const rx = Math.round(x), rz = Math.round(z);
    const r = at(rx, rz);
    if (r && r.kind === 'interior') return 0;
    if (W.tileAll(rx, rz) === T.WATER) return -0.88;
    return r === null ? main.groundY(x, z) : r ? r.groundY(x, z) : 0;
  };
  W.areaName = (x, z) => {
    const r = at(x, z);
    if (r === null) return main.tile(x, z) === T.WATER ? 'Mar de Bruma' : main.areaName(x, z);
    return r ? r.areaName(x, z) : 'Mar de Bruma';
  };
  W.setBlocked = (x, z, v) => { const r = at(x, z); if (r === null) W.blocked[W.idx(x, z)] = v; else if (r) r.setBlocked(x, z, v); };
  W.isInterior = (x) => x >= INTERIOR_X0 - 2;
  W.isWater = (x, z) => x > -106 && z > -106 && x < 246 && z < 246 && W.tileAll(x, z) === T.WATER;
  W.key = KEY;
}

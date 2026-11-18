// Islas del segundo capítulo: cada una con su bioma, pueblo, enemigos y minerales.
//  - Isla Duna (desierto, Oasis de Sal) al oeste
//  - Isla Selva (jungla, Aldea Liana) al norte
//  - Bastión de la Marina (fortaleza) y Villa Grillete al sur
//  - Isla Ceniza (volcán) al sureste lejano
import { makeIslet, populate } from './regions.js';
import { T } from './world.js';

export const MARINE_LOOK = (rank = 0, seed = 0) => ({
  shirt: rank >= 2 ? 0xf4f4f0 : 0xe8ecf0, pants: 0x24345e, hat: rank >= 1 ? 'tricorn' : 'cap', capColor: 0x24345e,
  feather: rank >= 2 ? 0xe8e8f0 : undefined, scarf: 0x2a5aa8, coat: rank >= 1, cape: rank >= 2 ? 0xf4f4f0 : undefined,
  trim: rank >= 1 ? 0xd8b040 : undefined, sword: true, blade: 0xd8dce4, guard: 0xd8b040,
  skin: [0xf0c49a, 0xe0aa80, 0xc68a5a, 0x8a5a3a][seed % 4], hair: [0x2a1a10, 0x6a4a2a, 0x1a1a1a, 0xd8a040][(seed >> 2) % 4],
  bootCuff: true,
});

function helpers(R) {
  const prop = (type, x, z, rot = 0, blocks = true, extra = {}) => { R.props.push({ type, x, z, rot, ...extra }); if (blocks) R.block(x, z); };
  const house = (id, x0, z0, w, d, door, o = {}) => {
    R.buildings.push({ id, x0, z0, w, d, door, wall: 0xe8d8b0, roof: 0xb05a3a, h: 1.5, ...o });
    for (let z = z0; z < z0 + d; z++) for (let x = x0; x < x0 + w; x++) R.block(x, z);
  };
  const npc = (n) => R.npcs.push(n);
  const wall = (x, z, dir, ruin) => { R.walls.push({ x, z, dir, ruin }); R.block(x, z); };
  return { prop, house, npc, wall };
}

export function makeNewIslets() {
  const out = [];

  // ------------------------------------------------------------ Isla Duna
  {
    const R = makeIslet({ id: 'duna', name: 'Isla Duna', ox: -86, oz: 18, N: 56, seed: 13, dockDir: [1, 0], biome: 'desert' });
    const { x: cx, z: cz } = R.center;
    R.towns.push({ name: 'Oasis de Sal', x: cx - 2, z: cz, r: 9 });
    R.reserve(cx - 2, cz, 9);
    const { prop, house, npc, wall } = helpers(R);
    // oasis: estanque con palmeras
    for (let dz = -1; dz <= 1; dz++) for (let dx = -2; dx <= 1; dx++) R.setTile(cx - 6 + dx, cz + dz, T.WATER);
    for (const [dx, dz] of [[-9, -2], [-9, 2], [-4, -2], [-4, 2]]) { R.trees.push({ id: 900 + dx * 7 + dz, type: 'palm', x: cx + dx, z: cz + dz, s: 1.1, rot: dx + dz }); R.block(cx + dx, cz + dz); }
    const adobe = { wall: 0xd8b07a, roof: 0xc08a50, flat: true, h: 1.4 };
    house('duna_casa1', cx - 6, cz - 8, 4, 3, 's', adobe);
    house('duna_casa2', cx + 1, cz - 8, 3, 3, 's', { ...adobe, wall: 0xe0c090 });
    house('duna_casa3', cx - 6, cz + 5, 4, 3, 'n', { ...adobe, wall: 0xcaa070 });
    house('duna_sastre', cx + 1, cz + 5, 4, 3, 'n', { ...adobe, wall: 0xe8c8a0, sign: 0x8a3a8a });
    prop('stall', cx + 3, cz - 3, 0, true, { color: 0xc83a2a });
    prop('stall', cx + 3, cz + 3, Math.PI, true, { color: 0x2a8a8a });
    prop('well', cx - 1, cz - 3);
    prop('sacks', cx - 1, cz + 3);
    prop('barrel', cx + 5, cz - 5); prop('crate', cx + 5, cz + 5);
    prop('chest', cx - 7, cz + 9, 0, true, { id: 'duna_cofre', loot: { gold: 180, potion: 2 } });
    npc({ id: 'zaid', name: 'Jeque Zaid', x: cx, z: cz - 1, wander: 2, look: { shirt: 0xf0e8d0, pants: 0xd8c8a0, robe: 0xe8dcc0, hair: 0x1a1a1a, beard: 0x1a1a1a, skin: 0xa86a3a, hat: 'turban', capColor: 0xe8e0c8, sash: 0xc8302a } });
    npc({ id: 'selim', name: 'Sastre Selim', x: cx + 2, z: cz + 4, wander: 1, look: { shirt: 0x8a3a8a, pants: 0x3a2a4a, vest: 0xd8b060, hair: 0x2a1a10, skin: 0xc68a5a, hat: 'turban', capColor: 0x8a3a8a, scarf: 0xd8b060 } });
    npc({ id: 'naira', name: 'Aguadora Naira', x: cx - 3, z: cz + 2, wander: 2, look: { shirt: 0x2a8a8a, pants: 0x3a3a4a, dress: true, dressColor: 0x2a7a8a, hair: 0x1a1a1a, longHair: true, skin: 0xa86a3a, scarf: 0xe8c060 } });
    npc({ id: 'farid', name: 'Vigía Farid', x: cx + 7, z: cz, wander: 1, look: { shirt: 0xd8c8a0, pants: 0x6a5a3a, hat: 'turban', capColor: 0xc8302a, skin: 0x8a5a3a, hair: 0x1a1a1a, spear: true, armor: true } });
    // ruinas del templo de arena (gólems de piedra)
    const rx = cx - 14, rz = cz - 14;
    for (const [dx, dz, d] of [[-2, -2, 'x'], [-1, -2, 'x'], [2, -2, 'x'], [-2, 1, 'z'], [2, 2, 'x'], [1, 2, 'x'], [2, -1, 'z']]) wall(rx + dx, rz + dz, d, true);
    prop('chest', rx, rz, 0, true, { id: 'duna_templo', loot: { gold: 260, potion: 2 }, big: true });
    prop('cave', rx, rz - 3, 0, true);
    R.reserve(rx, rz, 3);
    populate(R, 1);
    const { ox, oz, N } = R;
    R.spawns.push({ type: 'scorpion', count: 5, area: [ox + 6, oz + 6, ox + N - 7, cz - 11], lvl: [14, 19] });
    R.spawns.push({ type: 'scorpion', count: 5, area: [ox + 6, cz + 11, ox + N - 7, oz + N - 7], lvl: [16, 21] });
    R.spawns.push({ type: 'golem', count: 3, area: [rx - 5, rz - 5, rx + 5, rz + 5], lvl: [22, 26] });
    out.push(R);
  }

  // ------------------------------------------------------------ Isla Selva
  {
    const R = makeIslet({ id: 'selva', name: 'Isla Selva', ox: 22, oz: -100, N: 58, seed: 29, dockDir: [0, 1], biome: 'jungle' });
    const { x: cx, z: cz } = R.center;
    R.towns.push({ name: 'Aldea Liana', x: cx, z: cz + 2, r: 8 });
    R.reserve(cx, cz + 2, 8);
    const { prop, house, npc, wall } = helpers(R);
    const hut = { wall: 0x8a6a44, roof: 0x9aa04a, thatch: true, plank: true, h: 1.3 };
    house('selva_choza1', cx - 6, cz - 4, 3, 3, 'e', hut);
    house('selva_choza2', cx + 4, cz - 4, 3, 3, 'w', hut);
    house('selva_choza3', cx - 6, cz + 3, 3, 3, 'e', { ...hut, roof: 0xb0a050 });
    house('selva_chaman', cx + 4, cz + 3, 4, 3, 'w', { ...hut, roof: 0x6a8a3a, sign: 0x2ab07a });
    prop('campfire', cx, cz);
    prop('totem', cx - 2, cz - 5); prop('totem', cx + 2, cz - 5);
    prop('tent', cx - 3, cz + 7, 0.4);
    prop('barrel', cx + 2, cz + 7);
    prop('chest', cx + 8, cz - 7, 0, true, { id: 'selva_cofre', loot: { gold: 200, potion: 2 } });
    npc({ id: 'ixa', name: 'Chamana Ixa', x: cx + 1, z: cz + 2, wander: 2, look: { shirt: 0x2a7a4a, pants: 0x4a3a2a, robe: 0x3a6a3a, hair: 0x1a1a1a, longHair: true, skin: 0xb07a4a, scarf: 0xe0b030, earring: true } });
    npc({ id: 'kuno', name: 'Cazador Kuno', x: cx - 2, z: cz + 2, wander: 2, look: { shirt: 0x8a5a2a, pants: 0x4a3a2a, vest: 0xe08a1a, hair: 0x2a1a10, skin: 0xa86a3a, spear: true, bracers: true, bracerColor: 0x5a3a20 } });
    npc({ id: 'tika', name: 'Pequeña Tika', x: cx, z: cz + 4, wander: 3, small: true, look: { shirt: 0xe0b030, pants: 0x4a3a2a, hair: 0x1a1a1a, skin: 0xb07a4a } });
    // cueva de los murciélagos (ruinas oscuras al norte)
    const bx = cx, bz = cz - 17;
    for (const [dx, dz, d] of [[-3, -1, 'z'], [-3, 0, 'z'], [-3, 1, 'z'], [3, -1, 'z'], [3, 0, 'z'], [3, 1, 'z'], [-2, -2, 'x'], [2, -2, 'x']]) wall(bx + dx, bz + dz, d, true);
    prop('skullrock', bx, bz - 1, 0, true);
    prop('cave', bx, bz + 2, 0, true);
    R.reserve(bx, bz, 4);
    populate(R, 1);
    const { ox, oz, N } = R;
    R.spawns.push({ type: 'tiger', count: 4, area: [ox + 6, cz - 8, cx - 11, oz + N - 7], lvl: [18, 24] });
    R.spawns.push({ type: 'tiger', count: 3, area: [cx + 11, cz - 8, ox + N - 7, oz + N - 7], lvl: [20, 26] });
    R.spawns.push({ type: 'bat', count: 7, area: [bx - 9, bz - 7, bx + 9, bz + 5], lvl: [21, 28] });
    out.push(R);
  }

  // ------------------------------------------------- Bastión de la Marina
  {
    const R = makeIslet({ id: 'bastion', name: 'Bastión de la Marina', ox: 16, oz: 166, N: 66, seed: 83, dockDir: [0, -1], biome: 'fort' });
    const { x: cx, z: cz } = R.center;
    const { prop, house, npc, wall } = helpers(R);
    // Villa Grillete (pueblo al norte, junto al muelle)
    R.towns.push({ name: 'Villa Grillete', x: cx, z: cz - 9, r: 7 });
    R.towns.push({ name: 'Fortaleza de la Marina', x: cx, z: cz + 8, r: 13 });
    R.reserve(cx, cz - 9, 6);
    house('grillete_1', cx - 7, cz - 13, 3, 3, 'e', { wall: 0xe8dcc0, roof: 0x7a4a3a, timber: true });
    house('grillete_2', cx + 4, cz - 13, 3, 3, 'w', { wall: 0xd8ccb0, roof: 0x6a5a4a });
    house('grillete_taberna', cx - 7, cz - 8, 4, 3, 'e', { wall: 0xe8d8b0, roof: 0x8a3a2a, timber: true, sign: 0x2a2a2a });
    house('grillete_3', cx + 4, cz - 8, 3, 3, 'w', { wall: 0xe0d4b8, roof: 0x5a6a7a });
    prop('well', cx - 2, cz - 10);
    prop('barrel', cx + 2, cz - 5); prop('crate', cx - 3, cz - 5);
    npc({ id: 'lucas', name: 'Rebelde Lucas', x: cx - 1, z: cz - 7, wander: 2, look: { shirt: 0x6a2a2a, pants: 0x2a2a2a, coat: true, hair: 0xb04a2a, skin: 0xe8b98f, scarf: 0x1a1a1a, eyepatch: true, sword: true, bootCuff: true } });
    npc({ id: 'berta', name: 'Posadera Berta', x: cx - 2, z: cz - 6, wander: 1, look: { shirt: 0xb86a3a, pants: 0x4a3a2a, dress: true, dressColor: 0x6a3a2a, apron: 0xf0ead8, hair: 0xd8a040, longHair: true, skin: 0xf0c49a } });
    npc({ id: 'ferro', name: 'Teniente Ferro', x: cx + 2, z: cz - 3, wander: 1, look: { ...MARINE_LOOK(1, 5), sword: true } });
    // fortaleza: muralla con puerta norte y torres redondas a rayas
    const X0 = cx - 12, X1 = cx + 12, Z0 = cz + 1, Z1 = cz + 14;
    for (let x = X0; x <= X1; x++) {
      if (Math.abs(x - cx) > 1) wall(x, Z0, 'x');
      wall(x, Z1, 'x');
    }
    for (let z = Z0 + 1; z < Z1; z++) { wall(X0, z, 'z'); wall(X1, z, 'z'); }
    for (const [x, z] of [[X0, Z0], [X1, Z0], [X0, Z1], [X1, Z1], [cx - 2, Z0], [cx + 2, Z0]]) prop('roundtower', x, z, 0, true);
    house('guardia_cuartel', cx - 10, Z0 + 3, 5, 3, 'e', { stone: true, roof: 0x2a4a8a, h: 1.6 });
    house('guardia_arsenal', cx + 6, Z0 + 3, 5, 3, 'w', { stone: true, roof: 0x2a4a8a, h: 1.6 });
    house('guardia_torre', cx - 3, Z1 - 5, 7, 4, 'n', { stone: true, roof: 0x24345e, h: 2.4, floors: 2, keep: true });
    prop('flag', cx, Z0 + 2, 0, true, { naval: true });
    prop('cannon', cx - 5, Z1 - 1, Math.PI); prop('cannon', cx + 5, Z1 - 1, Math.PI);
    prop('cannon', X0 + 1, Z0 + 1, -Math.PI / 4); prop('cannon', X1 - 1, Z0 + 1, Math.PI / 4);
    prop('crate', cx + 9, Z1 - 2); prop('barrel', cx + 10, Z1 - 2); prop('barrel', cx - 10, Z1 - 2);
    prop('chest', cx + 5, Z1 - 6, 0, true, { id: 'bastion_cofre', loot: { gold: 600, potion: 4 }, big: true });
    R.reserve(cx, cz + 7, 13);
    populate(R, 0.55);
    R.spawns.push({ type: 'marine', count: 6, area: [X0 + 2, Z0 + 2, X1 - 2, Z1 - 2], lvl: [26, 34] });
    R.spawns.push({ type: 'marine', count: 3, area: [cx - 4, Z0 - 3, cx + 4, Z0 - 1], lvl: [24, 30] });
    R.spawns.push({ type: 'marine_boss', count: 1, area: [cx - 1, Z1 - 7, cx + 1, Z1 - 6], lvl: [45, 45] });
    out.push(R);
  }

  // ------------------------------------------------------------ Isla Ceniza
  {
    const R = makeIslet({ id: 'ceniza', name: 'Isla Ceniza', ox: 176, oz: 166, N: 54, seed: 61, dockDir: [-1, 0], biome: 'volcano' });
    const { x: cx, z: cz } = R.center;
    R.towns.push({ name: 'Campamento Brasa', x: cx + 2, z: cz, r: 5 });
    R.reserve(cx + 2, cz, 5);
    const { prop, npc } = helpers(R);
    for (let dz = -4; dz <= 4; dz++) for (let dx = -2; dx <= 6; dx++) R.setTile(cx + dx, cz + dz, T.ROCK);
    prop('tent', cx + 1, cz - 3, 0.3);
    prop('tent', cx + 4, cz + 3, -0.5);
    prop('campfire', cx + 2, cz);
    prop('forge', cx + 5, cz - 1);
    prop('anvil', cx + 5, cz + 1);
    prop('chest', cx - 1, cz + 3, 0, true, { id: 'ceniza_cofre', loot: { gold: 400, potion: 3 } });
    npc({ id: 'brasa', name: 'Herrera Brasa', x: cx + 3, z: cz + 1, wander: 1, look: { shirt: 0x3a2a2a, pants: 0x2a2a2a, apron: 0x5a3a2a, hair: 0xd84a1a, longHair: true, skin: 0xd9a066, bracers: true, bracerColor: 0x2e2238, axe: true, sword: true } });
    npc({ id: 'osvaldo', name: 'Ermitaño Osvaldo', x: cx, z: cz - 2, wander: 1, look: { shirt: 0x6a6a6a, pants: 0x3a3a3a, robe: 0x4a4a4a, hair: 0xe0e0e0, beard: 0xe8e8e8, skin: 0xe0aa80 } });
    populate(R, 1);
    const { ox, oz, N } = R;
    const px = Math.round(cx + 0.2 * N), pz = cz;
    R.spawns.push({ type: 'skull', count: 6, area: [ox + 6, oz + 6, ox + N - 7, cz - 7], lvl: [32, 42] });
    R.spawns.push({ type: 'golem_obs', count: 5, area: [ox + 6, cz + 7, ox + N - 7, oz + N - 7], lvl: [36, 48] });
    R.spawns.push({ type: 'dragon', count: 1, area: [px - 1, pz + 6, px + 1, pz + 8], lvl: [101, 101] });
    R.spawns.push({ type: 'golem_boss', count: 1, area: [px - 1, pz - 9, px + 1, pz - 7], lvl: [60, 60] });
    out.push(R);
  }
  return out;
}

// Mar abierto: serpientes y barcos aparecen lejos de la costa.
export const SEA_ZONES = [
  { name: 'Mar de Bruma', x0: -20, z0: -20, x1: 170, z1: 160, lvl: [12, 22] },
  { name: 'Aguas Profundas', x0: -110, z0: -110, x1: 240, z1: 240, lvl: [26, 46] },
];

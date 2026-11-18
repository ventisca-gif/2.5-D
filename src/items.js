// Objetos, equipo (visible en el personaje), recetas de forja/banco/cocina y botines.

export const MAX_LEVEL = 50;

// ----------------------------------------------------------------- objetos simples
export const ITEMS = {
  wood: { name: 'Madera', icon: '🪵', type: 'mat', value: 3, desc: 'Se consigue talando árboles.' },
  stone: { name: 'Piedra', icon: '🪨', type: 'mat', value: 4, desc: 'Se consigue picando rocas.' },
  iron: { name: 'Mena de hierro', icon: '⛓️', type: 'mat', value: 8, desc: 'A veces aparece al picar rocas.' },
  silver: { name: 'Mena de plata', icon: '🥈', type: 'mat', value: 16, desc: 'Rocas del Pedregal e Isla Tortuga.' },
  goldore: { name: 'Mena de oro', icon: '🥇', type: 'mat', value: 30, desc: 'Rocas de la Isla Calavera.' },
  leather: { name: 'Cuero', icon: '🟫', type: 'mat', value: 6, desc: 'Lo sueltan lobos y jabalíes.' },
  bone: { name: 'Hueso maldito', icon: '🦴', type: 'mat', value: 10, desc: 'Lo sueltan los piratas esqueleto.' },
  cloth: { name: 'Tela', icon: '🧵', type: 'mat', value: 5, desc: 'Se compra al mercader Ilyas.' },
  potion: { name: 'Ron curativo', icon: '🍶', type: 'heal', heal: 0.45, value: 12, desc: 'Cura casi la mitad de tu vida.' },
  // ingredientes
  meat: { name: 'Carne cruda', icon: '🥩', type: 'ingr', value: 4, desc: 'De lobos y jabalíes. Cocínala.' },
  crab: { name: 'Carne de cangrejo', icon: '🦀', type: 'ingr', value: 4, desc: 'De los cangrejos de playa.' },
  wheat: { name: 'Trigo', icon: '🌾', type: 'ingr', value: 2, desc: 'Cosecha en la granja o cómpralo a Lucía.' },
  apple: { name: 'Manzana', icon: '🍎', type: 'food', heal: 10, value: 2, desc: 'Cae a veces de los robles. Se come cruda.' },
  mushroom: { name: 'Seta', icon: '🍄', type: 'ingr', value: 3, desc: 'Lucía las recoge en el bosque.' },
  fish: { name: 'Pescado', icon: '🐟', type: 'ingr', value: 4, desc: 'Gaspar vende la pesca del día.' },
  // comidas
  f_meat: { name: 'Carne asada', icon: '🍖', type: 'food', heal: 35, value: 10, desc: '+35 de vida.' },
  f_crab: { name: 'Brocheta de cangrejo', icon: '🍢', type: 'food', heal: 45, value: 12, desc: '+45 de vida.' },
  f_bread: { name: 'Pan de trigo', icon: '🍞', type: 'food', heal: 25, value: 8, desc: '+25 de vida.' },
  f_fish: { name: 'Pescado a la brasa', icon: '🍤', type: 'food', heal: 40, value: 11, desc: '+40 de vida.' },
  f_soup: { name: 'Sopa de setas', icon: '🍲', type: 'food', heal: 55, value: 14, desc: '+55 de vida.' },
  f_pie: { name: 'Tarta de manzana', icon: '🥧', type: 'food', heal: 60, value: 16, desc: '+60 de vida y amigos felices.' },
  f_stew: { name: 'Guiso del capitán', icon: '🥘', type: 'food', heal: 95, stamina: true, value: 25, desc: '+95 de vida y estamina llena.' },
};

// ----------------------------------------------------------------- equipo
// look: parche que se aplica al aspecto del personaje (todo es visible)
const IRON = 0xa8b0bc, SILVER = 0xd8dee8, GOLD = 0xd8a838, LEATHER = 0x7a5232, DARK = 0x3a3a44;
export const EQUIP = {
  // armas
  espada_madera: { name: 'Espada de madera', slot: 'weapon', tier: 0, atk: 3, icon: '🗡️', look: { sword: true, blade: 0xb08050, guard: 0x6a4428, bladeW: 0.06 } },
  espada_hierro: { name: 'Espada de hierro', slot: 'weapon', tier: 1, atk: 8, icon: '🗡️', look: { sword: true, blade: 0xdde2ea, guard: 0x5a5a62 } },
  sable_plata: { name: 'Sable de plata', slot: 'weapon', tier: 2, atk: 14, icon: '⚔️', look: { sword: true, blade: 0xf0f4ff, guard: 0xc0c8d8, bladeLen: 0.52 } },
  espada_oro: { name: 'Espada de oro', slot: 'weapon', tier: 3, atk: 22, icon: '⚔️', look: { sword: true, blade: 0xffe9a0, guard: 0xd8a838, bladeLen: 0.56, bladeW: 0.06 } },
  sable_corsario: { name: 'Sable corsario', slot: 'weapon', tier: 2, atk: 17, icon: '🏴‍☠️', look: { sword: true, blade: 0xe8e8e8, guard: 0x2a2a2a, bladeLen: 0.5 } },
  // escudos
  escudo_madera: { name: 'Escudo de madera', slot: 'shield', tier: 0, def: 2, icon: '🛡️', look: { shield: { type: 'round', color: 0x8a5a32, rim: 0x6a6a72, boss: 0x8a8a92 } } },
  escudo_hierro: { name: 'Escudo de hierro', slot: 'shield', tier: 1, def: 5, icon: '🛡️', look: { shield: { type: 'kite', color: IRON, rim: 0x5a5a62, boss: 0x3a5a9a } } },
  escudo_plata: { name: 'Escudo de plata', slot: 'shield', tier: 2, def: 8, icon: '🛡️', look: { shield: { type: 'kite', color: SILVER, rim: 0x8a96aa, boss: 0x2f5a9a } } },
  escudo_oro: { name: 'Escudo de oro', slot: 'shield', tier: 3, def: 12, icon: '🛡️', look: { shield: { type: 'round', color: GOLD, rim: 0x8a6a10, boss: 0xc8302a } } },
  // cabeza
  capucha_cuero: { name: 'Capucha de cuero', slot: 'head', tier: 0, def: 1, icon: '🧢', look: { hat: 'hood', hatColor: LEATHER } },
  casco_hierro: { name: 'Casco de hierro', slot: 'head', tier: 1, def: 3, icon: '⛑️', look: { hat: 'helmet', hatColor: IRON } },
  casco_plata: { name: 'Casco de plata', slot: 'head', tier: 2, def: 5, icon: '⛑️', look: { hat: 'helmet', hatColor: SILVER, plume: 0x2f5a9a } },
  casco_oro: { name: 'Casco de oro', slot: 'head', tier: 3, def: 8, icon: '👑', look: { hat: 'helmet', hatColor: GOLD, plume: 0xc8302a } },
  yelmo_cuernos: { name: 'Yelmo astado', slot: 'head', tier: 3, def: 10, icon: '🐂', look: { hat: 'horned', hatColor: GOLD } },
  tricornio: { name: 'Tricornio', slot: 'head', tier: 1, def: 2, hp: 15, icon: '🎩', look: { hat: 'tricorn', feather: 0xf0ead8 } },
  // pecho
  peto_cuero: { name: 'Jubón de cuero', slot: 'chest', tier: 0, def: 3, icon: '🦺', look: { vest: LEATHER, baldric: 0x4a3020 } },
  peto_hierro: { name: 'Peto de hierro', slot: 'chest', tier: 1, def: 7, icon: '🛡️', look: { armor: true, armorColor: IRON, trim: 0x6a6a72 } },
  peto_plata: { name: 'Coraza de plata', slot: 'chest', tier: 2, def: 11, icon: '🛡️', look: { armor: true, armorColor: SILVER, trim: 0xd8a838, tabard: 0x2f5a9a } },
  peto_oro: { name: 'Armadura de oro', slot: 'chest', tier: 3, def: 16, icon: '🏆', look: { armor: true, armorColor: GOLD, trim: 0x8a6a10, emblem: 0x5a1010, gem: 0xff4a3a, pauldron: 0x6a7a3a, spikes: true } },
  casaca_corsario: { name: 'Casaca corsaria', slot: 'chest', tier: 2, def: 8, hp: 25, icon: '🧥', look: { coat: true, vest: 0xd8b060, cravat: true, sash: 0x2a2226, shirtOverride: 0x9a1f24, sleeve: 0xf0ead8 } },
  // manos
  guantes_cuero: { name: 'Guantes de cuero', slot: 'hands', tier: 0, def: 1, icon: '🧤', look: { gloves: 0x5a3a20 } },
  guantes_hierro: { name: 'Guanteletes de hierro', slot: 'hands', tier: 1, def: 2, icon: '🧤', look: { gloves: 0x7a808a, bracers: true, bracerColor: IRON } },
  guantes_plata: { name: 'Guanteletes de plata', slot: 'hands', tier: 2, def: 3, icon: '🧤', look: { gloves: 0xa8b0bc, bracers: true, bracerColor: SILVER } },
  guantes_oro: { name: 'Guanteletes de oro', slot: 'hands', tier: 3, def: 5, icon: '🧤', look: { gloves: 0xb8902a, bracers: true, bracerColor: GOLD } },
  // pies
  botas_cuero: { name: 'Botas de cuero', slot: 'feet', tier: 0, def: 1, icon: '👢', look: { boots: 0x5a3a20, bootCuff: true } },
  botas_hierro: { name: 'Grebas de hierro', slot: 'feet', tier: 1, def: 2, icon: '👢', look: { boots: DARK, legArmor: IRON } },
  botas_plata: { name: 'Grebas de plata', slot: 'feet', tier: 2, def: 3, icon: '👢', look: { boots: 0x5a6070, legArmor: SILVER } },
  botas_oro: { name: 'Grebas de oro', slot: 'feet', tier: 3, def: 5, icon: '👢', look: { boots: 0x3a2a10, legArmor: GOLD } },
  // capa, cuello, anillo
  capa_viaje: { name: 'Capa de viaje', slot: 'cape', tier: 0, def: 1, hp: 5, icon: '🧣', look: { cape: 0x5a3a20 } },
  capa_azul: { name: 'Capa de caballero', slot: 'cape', tier: 1, def: 2, hp: 10, icon: '🧣', look: { cape: 0x23467a } },
  capa_real: { name: 'Capa real', slot: 'cape', tier: 3, def: 3, hp: 20, icon: '🧣', look: { cape: 0x8a1a2a } },
  amuleto_coral: { name: 'Amuleto de coral', slot: 'neck', tier: 2, hp: 30, icon: '📿', look: {} },
  anillo_oro: { name: 'Anillo de oro', slot: 'ring', tier: 3, atk: 4, icon: '💍', look: {} },
};
for (const [id, e] of Object.entries(EQUIP)) ITEMS[id] = { ...e, type: 'equip', value: 15 + e.tier * 40, desc: describe(e) };
function describe(e) {
  const parts = [];
  if (e.atk) parts.push(`+${e.atk} daño`);
  if (e.def) parts.push(`+${e.def} armadura`);
  if (e.hp) parts.push(`+${e.hp} vida`);
  return parts.join(' · ');
}

export const SLOTS = [
  { id: 'head', name: 'Cabeza', icon: '⛑️' }, { id: 'chest', name: 'Pecho', icon: '🦺' },
  { id: 'hands', name: 'Manos', icon: '🧤' }, { id: 'feet', name: 'Pies', icon: '👢' },
  { id: 'neck', name: 'Cuello', icon: '📿' }, { id: 'cape', name: 'Capa', icon: '🧣' },
  { id: 'ring', name: 'Anillo', icon: '💍' }, { id: 'weapon', name: 'Arma', icon: '🗡️' }, { id: 'shield', name: 'Escudo', icon: '🛡️' },
];

// ----------------------------------------------------------------- recetas
// station: forja (Herrero Tadeo), banco (Carpintero Bruno / taller), fuego (fogatas, chimeneas, cocina del barco)
export const RECIPES = [
  // banco de carpintero
  { out: 'espada_madera', station: 'banco', need: { wood: 3 }, gold: 0 },
  { out: 'escudo_madera', station: 'banco', need: { wood: 4 }, gold: 0 },
  { out: 'capucha_cuero', station: 'banco', need: { leather: 2 }, gold: 5 },
  { out: 'peto_cuero', station: 'banco', need: { leather: 4 }, gold: 10 },
  { out: 'guantes_cuero', station: 'banco', need: { leather: 2 }, gold: 5 },
  { out: 'botas_cuero', station: 'banco', need: { leather: 2 }, gold: 5 },
  { out: 'capa_viaje', station: 'banco', need: { leather: 2, cloth: 2 }, gold: 10 },
  // forja: hierro
  { out: 'espada_hierro', station: 'forja', need: { iron: 4, wood: 2 }, gold: 20 },
  { out: 'escudo_hierro', station: 'forja', need: { iron: 4, wood: 1 }, gold: 20 },
  { out: 'casco_hierro', station: 'forja', need: { iron: 3 }, gold: 15 },
  { out: 'peto_hierro', station: 'forja', need: { iron: 6, leather: 2 }, gold: 30 },
  { out: 'guantes_hierro', station: 'forja', need: { iron: 2, leather: 1 }, gold: 10 },
  { out: 'botas_hierro', station: 'forja', need: { iron: 2, leather: 1 }, gold: 10 },
  { out: 'capa_azul', station: 'forja', need: { cloth: 4, iron: 1 }, gold: 25 },
  // forja: plata
  { out: 'sable_plata', station: 'forja', need: { silver: 3, iron: 2 }, gold: 50 },
  { out: 'escudo_plata', station: 'forja', need: { silver: 3, iron: 1 }, gold: 45 },
  { out: 'casco_plata', station: 'forja', need: { silver: 3 }, gold: 40 },
  { out: 'peto_plata', station: 'forja', need: { silver: 5, iron: 2, cloth: 2 }, gold: 70 },
  { out: 'guantes_plata', station: 'forja', need: { silver: 2 }, gold: 30 },
  { out: 'botas_plata', station: 'forja', need: { silver: 2 }, gold: 30 },
  // forja: oro
  { out: 'espada_oro', station: 'forja', need: { goldore: 3, silver: 2 }, gold: 120 },
  { out: 'escudo_oro', station: 'forja', need: { goldore: 3, silver: 1 }, gold: 110 },
  { out: 'casco_oro', station: 'forja', need: { goldore: 3 }, gold: 90 },
  { out: 'yelmo_cuernos', station: 'forja', need: { goldore: 4, bone: 4 }, gold: 150 },
  { out: 'peto_oro', station: 'forja', need: { goldore: 5, silver: 2, bone: 2 }, gold: 180 },
  { out: 'guantes_oro', station: 'forja', need: { goldore: 2 }, gold: 70 },
  { out: 'botas_oro', station: 'forja', need: { goldore: 2 }, gold: 70 },
  { out: 'capa_real', station: 'forja', need: { goldore: 2, cloth: 4 }, gold: 120 },
  { out: 'anillo_oro', station: 'forja', need: { goldore: 2 }, gold: 60 },
  // cocina
  { out: 'f_meat', station: 'fuego', need: { meat: 1 }, gold: 0 },
  { out: 'f_crab', station: 'fuego', need: { crab: 2 }, gold: 0 },
  { out: 'f_bread', station: 'fuego', need: { wheat: 2 }, gold: 0 },
  { out: 'f_fish', station: 'fuego', need: { fish: 1 }, gold: 0 },
  { out: 'f_soup', station: 'fuego', need: { mushroom: 2, wheat: 1 }, gold: 0 },
  { out: 'f_pie', station: 'fuego', need: { apple: 2, wheat: 1 }, gold: 0 },
  { out: 'f_stew', station: 'fuego', need: { meat: 1, fish: 1, mushroom: 1 }, gold: 0 },
];

// ----------------------------------------------------------------- botines
export const DROPS = {
  wolf: [['meat', 0.6], ['leather', 0.5]],
  boar: [['meat', 0.85], ['leather', 0.6], ['leather', 0.3]],
  crab: [['crab', 0.75]],
  skeleton: [['bone', 0.6], ['silver', 0.15], ['goldore', 0.05]],
  boss: [['goldore', 1], ['goldore', 1], ['goldore', 1], ['bone', 1], ['bone', 1], ['sable_corsario', 1]],
};
// menas al picar rocas, según la zona
export function oreDrop(area) {
  const r = Math.random();
  if (area === 'Isla Calavera') return r < 0.3 ? 'goldore' : r < 0.5 ? 'silver' : r < 0.7 ? 'iron' : null;
  if (area === 'Isla Tortuga') return r < 0.25 ? 'silver' : r < 0.55 ? 'iron' : null;
  if (area === 'Pedregal del Oeste') return r < 0.08 ? 'silver' : r < 0.45 ? 'iron' : null;
  return r < 0.28 ? 'iron' : null;
}

// ----------------------------------------------------------------- aspecto
export const HAIR_M = [
  { id: 'corto', name: 'Corto' }, { id: 'punta', name: 'De punta' }, { id: 'cresta', name: 'Cresta' },
  { id: 'coleta', name: 'Coleta' }, { id: 'rizado', name: 'Rizado' }, { id: 'calvo', name: 'Rapado' },
];
export const HAIR_F = [
  { id: 'largo', name: 'Largo' }, { id: 'coleta', name: 'Coleta' }, { id: 'trenza', name: 'Trenza' },
  { id: 'mono', name: 'Moño' }, { id: 'melena', name: 'Melena' }, { id: 'rizos', name: 'Rizos' },
];
export const HAIR_COLORS = [0x1a1210, 0x5a3a20, 0xb06a2a, 0xe0b050, 0xc83a2a, 0xd8d8d8];
export const CLOTHES = [0x3a6aa0, 0x9a2a2a, 0x3a7a3a, 0x6a3d8f, 0x8a6a3a, 0x2a2a30];
export const SKINS = [0xf3cfaa, 0xe8b98f, 0xc68a5a, 0x8a5a3a];

export function buildLook(ap, equip = {}) {
  const hairList = ap.gender === 'f' ? HAIR_F : HAIR_M;
  const look = {
    female: ap.gender === 'f',
    skin: SKINS[ap.skin ?? 1],
    shirt: CLOTHES[ap.clothes ?? 0],
    pants: ap.gender === 'f' ? 0x3a2a3a : 0x3a2e24,
    boots: 0x3a2618,
    hair: HAIR_COLORS[ap.hairColor ?? 1],
    hairStyle: hairList[ap.hair ?? 0].id,
    beard: ap.beard ? HAIR_COLORS[ap.hairColor ?? 1] : undefined,
  };
  for (const s of SLOTS) {
    const id = equip[s.id];
    if (id && EQUIP[id]) Object.assign(look, EQUIP[id].look);
  }
  if (look.shirtOverride) look.shirt = look.shirtOverride;
  return look;
}

// estadísticas del equipo
export function gearStats(equip = {}) {
  let atk = 0, def = 0, hp = 0;
  for (const s of SLOTS) {
    const e = EQUIP[equip[s.id]];
    if (!e) continue;
    atk += e.atk || 0;
    def += e.def || 0;
    hp += e.hp || 0;
  }
  return { atk, def, hp };
}

// equipo automático de la tripulación según su nivel (todo visible)
export function crewGear(level) {
  if (level >= 35) return { weapon: 'espada_oro', shield: 'escudo_oro', head: 'casco_oro', chest: 'peto_oro', hands: 'guantes_oro', feet: 'botas_oro' };
  if (level >= 20) return { weapon: 'sable_plata', shield: 'escudo_plata', head: 'casco_plata', chest: 'peto_plata', hands: 'guantes_plata', feet: 'botas_plata' };
  if (level >= 10) return { weapon: 'espada_hierro', shield: 'escudo_hierro', chest: 'peto_hierro', feet: 'botas_hierro' };
  return { weapon: 'espada_madera', chest: 'peto_cuero', feet: 'botas_cuero' };
}
export function crewTier(level) { return level >= 35 ? 3 : level >= 20 ? 2 : level >= 10 ? 1 : 0; }

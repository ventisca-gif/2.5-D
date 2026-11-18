// Objetos, equipo (visible en el personaje), recetas de forja/banco/cocina y botines.
import { HAIR_AF, HAIR_AM, HAIR_COLORS_A, FACES_F, FACES_M, FACE_SHAPES, EYE_COLORS } from './anime.js';

export const MAX_LEVEL = 100;

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
  ambar: { name: 'Ámbar', icon: '🟠', type: 'mat', value: 45, desc: 'Mineral de las rocas de Isla Duna.' },
  jade: { name: 'Jade', icon: '🟢', type: 'mat', value: 70, desc: 'Mineral de las rocas de la Isla Selva.' },
  obsidiana: { name: 'Obsidiana', icon: '🟣', type: 'mat', value: 110, desc: 'Mineral volcánico de la Isla Ceniza.' },
  perla: { name: 'Perla negra', icon: '⚫', type: 'mat', value: 90, desc: 'La sueltan las criaturas marinas.' },
  piel_tigre: { name: 'Piel de tigre', icon: '🐯', type: 'mat', value: 30, desc: 'La sueltan los tigres de la selva.' },
  ala_murcielago: { name: 'Ala de murciélago', icon: '🦇', type: 'mat', value: 18, desc: 'La sueltan los murciélagos.' },
  aguijon: { name: 'Aguijón rojo', icon: '🦂', type: 'mat', value: 28, desc: 'Lo sueltan los escorpiones rojos.' },
  nucleo_golem: { name: 'Núcleo de gólem', icon: '💠', type: 'mat', value: 60, desc: 'El corazón de piedra de un gólem.' },
  escama: { name: 'Escama marina', icon: '🐉', type: 'mat', value: 50, desc: 'La suelta la serpiente marina.' },
  polvora: { name: 'Pólvora', icon: '🧨', type: 'mat', value: 12, desc: 'Para los cañones del barco. Se compra en los puertos.' },
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
const AMBAR = 0xe08a1a, JADE = 0x2ab07a, OBS = 0x2e2238;
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
  // ---- ámbar (tier 4), jade (5), obsidiana (6)
  alfanje_ambar: { name: 'Alfanje de ámbar', slot: 'weapon', tier: 4, atk: 30, icon: '🗡️', look: { sword: true, blade: 0xffc060, guard: AMBAR, bladeLen: 0.54, bladeW: 0.065 } },
  katana_jade: { name: 'Katana de jade', slot: 'weapon', tier: 5, atk: 40, icon: '⚔️', look: { sword: true, blade: 0xbff0d8, guard: JADE, bladeLen: 0.62, bladeW: 0.04 } },
  hacha_obsidiana: { name: 'Hacha de obsidiana', slot: 'weapon', tier: 6, atk: 54, icon: '🪓', look: { axe: true, blade: 0x4a2a5a, guard: 0xc0304a } },
  hacha_golem: { name: 'Hacha de gólem', slot: 'weapon', tier: 4, atk: 34, icon: '🪓', look: { axe: true, blade: 0x8a8a90, guard: 0x5ab8e8 } },
  tridente: { name: 'Tridente de las mareas', slot: 'weapon', tier: 5, atk: 44, icon: '🔱', look: { spear: true, trident: true } },
  escudo_ambar: { name: 'Escudo de ámbar', slot: 'shield', tier: 4, def: 16, icon: '🛡️', look: { shield: { type: 'round', color: AMBAR, rim: 0x6a3a10, boss: 0xffe08a } } },
  escudo_jade: { name: 'Escudo de jade', slot: 'shield', tier: 5, def: 21, icon: '🛡️', look: { shield: { type: 'kite', color: JADE, rim: 0x1a5a3a, boss: 0xd8a838 } } },
  escudo_obsidiana: { name: 'Escudo de obsidiana', slot: 'shield', tier: 6, def: 27, icon: '🛡️', look: { shield: { type: 'kite', color: OBS, rim: 0xc0304a, boss: 0xff4a3a } } },
  casco_ambar: { name: 'Casco de ámbar', slot: 'head', tier: 4, def: 11, icon: '⛑️', look: { hat: 'helmet', hatColor: AMBAR, plume: 0x6a1a10 } },
  casco_jade: { name: 'Casco de jade', slot: 'head', tier: 5, def: 14, icon: '⛑️', look: { hat: 'helmet', hatColor: JADE, plume: 0xd8a838 } },
  yelmo_obsidiana: { name: 'Yelmo de obsidiana', slot: 'head', tier: 6, def: 18, icon: '😈', look: { hat: 'horned', hatColor: OBS, hornColor: 0xc0304a, gem: 0xff3a2a } },
  peto_ambar: { name: 'Coraza de ámbar', slot: 'chest', tier: 4, def: 21, icon: '🛡️', look: { armor: true, armorColor: AMBAR, trim: 0x6a3a10, emblem: 0xffe08a } },
  peto_jade: { name: 'Coraza de jade', slot: 'chest', tier: 5, def: 27, icon: '🛡️', look: { armor: true, armorColor: JADE, trim: 0xd8a838, tabard: 0x1a3a2a, pauldron: 0x1a5a3a } },
  peto_obsidiana: { name: 'Armadura de obsidiana', slot: 'chest', tier: 6, def: 34, icon: '🛡️', look: { armor: true, armorColor: OBS, trim: 0xc0304a, emblem: 0x1a0a1a, gem: 0xff3a2a, spikes: true, pauldron: 0x4a2a5a } },
  guantes_ambar: { name: 'Guanteletes de ámbar', slot: 'hands', tier: 4, def: 7, icon: '🧤', look: { gloves: 0xa0600a, bracers: true, bracerColor: AMBAR } },
  guantes_jade: { name: 'Guanteletes de jade', slot: 'hands', tier: 5, def: 9, icon: '🧤', look: { gloves: 0x1a5a3a, bracers: true, bracerColor: JADE } },
  guantes_obsidiana: { name: 'Guanteletes de obsidiana', slot: 'hands', tier: 6, def: 12, icon: '🧤', look: { gloves: 0x1a1020, bracers: true, bracerColor: 0xc0304a } },
  botas_ambar: { name: 'Grebas de ámbar', slot: 'feet', tier: 4, def: 7, icon: '👢', look: { boots: 0x5a3010, legArmor: AMBAR } },
  botas_jade: { name: 'Grebas de jade', slot: 'feet', tier: 5, def: 9, icon: '👢', look: { boots: 0x1a3a2a, legArmor: JADE } },
  botas_obsidiana: { name: 'Grebas de obsidiana', slot: 'feet', tier: 6, def: 12, icon: '👢', look: { boots: 0x140c18, legArmor: OBS } },
  capa_marea: { name: 'Capa de las mareas', slot: 'cape', tier: 5, def: 4, hp: 35, icon: '🧣', look: { cape: 0x1a6a8a } },
  collar_perlas: { name: 'Collar de perlas negras', slot: 'neck', tier: 5, hp: 60, icon: '📿', look: {} },
  anillo_jade: { name: 'Anillo de jade', slot: 'ring', tier: 5, atk: 8, icon: '💍', look: {} },
  anillo_obsidiana: { name: 'Anillo de obsidiana', slot: 'ring', tier: 6, atk: 14, icon: '💍', look: {} },
  // ---- cosméticos: solo aspecto (se ven encima de la armadura; las estadísticas siguen siendo las de la armadura)
  sombrero_capitan: { name: 'Sombrero de capitán', slot: 'cosHead', tier: 2, cos: true, icon: '🎩', look: { hat: 'tricorn', hatColor: 0x141010, feather: 0xc8302a } },
  bandana_roja: { name: 'Pañuelo pirata', slot: 'cosHead', tier: 0, cos: true, icon: '🏴‍☠️', look: { hat: 'bandana', capColor: 0xb02a2a } },
  gorra_marinera: { name: 'Gorra marinera', slot: 'cosHead', tier: 0, cos: true, icon: '🧢', look: { hat: 'cap', capColor: 0xf0f0f4 } },
  corona_huesos: { name: 'Corona de huesos', slot: 'cosHead', tier: 3, cos: true, icon: '👑', look: { hat: 'circlet' } },
  chaqueta_pirata: { name: 'Casaca pirata', slot: 'cosBody', tier: 2, cos: true, icon: '🧥', look: { coat: true, shirt: 0x8a1a1a, vest: 0xd8b060, cravat: true, sash: 0x1a1a1a, sleeve: 0xf0ead8, bootCuff: true } },
  chaqueta_negra: { name: 'Chaqueta negra de capitán', slot: 'cosBody', tier: 3, cos: true, icon: '🧥', look: { coat: true, shirt: 0x1a1a1e, vest: 0x8a1a1a, cravat: true, sash: 0xd8a838, sleeve: 0xe8e0d0, trim: 0xd8a838 } },
  traje_guardia: { name: 'Uniforme de la Guardia Naval', slot: 'cosBody', tier: 2, cos: true, icon: '🎖️', look: { coat: true, shirt: 0x2a4a8a, sleeve: 0xf4f4f8, trim: 0xd8a838, sash: 0xf4f4f8 } },
  camisa_marinera: { name: 'Camisa marinera', slot: 'cosBody', tier: 0, cos: true, icon: '👕', look: { shirt: 0xf0f2f8, scarf: 0xc8302a, sleeve: 0x2a4a8a } },
  capa_lobo: { name: 'Capa de piel de lobo', slot: 'cosCape', tier: 1, cos: true, icon: '🐺', look: { cape: 0x8c8f96 } },
  capa_tigre: { name: 'Capa de piel de tigre', slot: 'cosCape', tier: 2, cos: true, icon: '🐯', look: { cape: 0xd8781a } },
  capa_murcielago: { name: 'Capa de alas de murciélago', slot: 'cosCape', tier: 2, cos: true, icon: '🦇', look: { cape: 0x3a1a4a } },
  anillo_oro: { name: 'Anillo de oro', slot: 'ring', tier: 3, atk: 4, icon: '💍', look: {} },
};
for (const [id, e] of Object.entries(EQUIP)) ITEMS[id] = { ...e, type: 'equip', value: e.cos ? 20 + e.tier * 30 : 15 + e.tier * 40, desc: e.cos ? 'Cosmético: solo cambia tu aspecto. Tu armadura sigue protegiéndote.' : describe(e) };
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
export const COS_SLOTS = [{ id: 'cosHead', name: 'Sombrero', icon: '🎩' }, { id: 'cosBody', name: 'Ropa', icon: '👕' }, { id: 'cosCape', name: 'Capa', icon: '🧣' }];

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
  // forja: ámbar, jade, obsidiana y especiales
  { out: 'alfanje_ambar', station: 'forja', need: { ambar: 4, goldore: 1 }, gold: 220 },
  { out: 'escudo_ambar', station: 'forja', need: { ambar: 4 }, gold: 200 },
  { out: 'casco_ambar', station: 'forja', need: { ambar: 3 }, gold: 170 },
  { out: 'peto_ambar', station: 'forja', need: { ambar: 6, aguijon: 2 }, gold: 300 },
  { out: 'guantes_ambar', station: 'forja', need: { ambar: 2 }, gold: 120 },
  { out: 'botas_ambar', station: 'forja', need: { ambar: 2 }, gold: 120 },
  { out: 'hacha_golem', station: 'forja', need: { nucleo_golem: 2, iron: 6 }, gold: 260 },
  { out: 'katana_jade', station: 'forja', need: { jade: 4, ambar: 1 }, gold: 380 },
  { out: 'escudo_jade', station: 'forja', need: { jade: 4 }, gold: 340 },
  { out: 'casco_jade', station: 'forja', need: { jade: 3 }, gold: 300 },
  { out: 'peto_jade', station: 'forja', need: { jade: 6, piel_tigre: 2 }, gold: 480 },
  { out: 'guantes_jade', station: 'forja', need: { jade: 2 }, gold: 220 },
  { out: 'botas_jade', station: 'forja', need: { jade: 2 }, gold: 220 },
  { out: 'anillo_jade', station: 'forja', need: { jade: 2, goldore: 1 }, gold: 260 },
  { out: 'tridente', station: 'forja', need: { perla: 3, escama: 2, silver: 3 }, gold: 420 },
  { out: 'capa_marea', station: 'forja', need: { escama: 3, cloth: 4 }, gold: 300 },
  { out: 'collar_perlas', station: 'forja', need: { perla: 4, goldore: 1 }, gold: 360 },
  { out: 'hacha_obsidiana', station: 'forja', need: { obsidiana: 5, nucleo_golem: 1 }, gold: 650 },
  { out: 'escudo_obsidiana', station: 'forja', need: { obsidiana: 4 }, gold: 560 },
  { out: 'yelmo_obsidiana', station: 'forja', need: { obsidiana: 3, bone: 4 }, gold: 520 },
  { out: 'peto_obsidiana', station: 'forja', need: { obsidiana: 7, nucleo_golem: 2 }, gold: 800 },
  { out: 'guantes_obsidiana', station: 'forja', need: { obsidiana: 2 }, gold: 380 },
  { out: 'botas_obsidiana', station: 'forja', need: { obsidiana: 2 }, gold: 380 },
  { out: 'anillo_obsidiana', station: 'forja', need: { obsidiana: 2, perla: 1 }, gold: 480 },
  // banco: cosméticos de piel
  { out: 'capa_lobo', station: 'banco', need: { leather: 6 }, gold: 30 },
  { out: 'capa_tigre', station: 'banco', need: { piel_tigre: 4 }, gold: 60 },
  { out: 'capa_murcielago', station: 'banco', need: { ala_murcielago: 6 }, gold: 60 },
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
  boss: [['goldore', 1], ['goldore', 1], ['goldore', 1], ['bone', 1], ['bone', 1], ['sable_corsario', 1], ['corona_huesos', 1]],
  bat: [['ala_murcielago', 0.7], ['capa_murcielago', 0.03]],
  tiger: [['piel_tigre', 0.7], ['meat', 0.6], ['capa_tigre', 0.04]],
  scorpion: [['aguijon', 0.65], ['ambar', 0.12]],
  golem: [['nucleo_golem', 0.35], ['stone', 1], ['iron', 0.5]],
  golem_obs: [['nucleo_golem', 0.6], ['obsidiana', 0.5], ['obsidiana', 0.25]],
  skull: [['bone', 0.7], ['jade', 0.1]],
  marine: [['polvora', 0.6], ['silver', 0.2], ['traje_guardia', 0.03], ['gorra_marinera', 0.04]],
  pirate: [['polvora', 0.5], ['goldore', 0.15], ['bandana_roja', 0.05], ['chaqueta_pirata', 0.02]],
  marine_boss: [['goldore', 1], ['goldore', 1], ['perla', 1], ['chaqueta_negra', 1], ['polvora', 1]],
  golem_boss: [['obsidiana', 1], ['obsidiana', 1], ['obsidiana', 1], ['nucleo_golem', 1], ['nucleo_golem', 1]],
};
DROPS.wolf.push(['capa_lobo', 0.03]);
DROPS.skeleton.push(['bandana_roja', 0.02]);
// menas al picar rocas, según la zona
export function oreDrop(area) {
  const r = Math.random();
  if (area === 'Isla Duna' || area === 'Oasis de Sal') return r < 0.22 ? 'ambar' : r < 0.45 ? 'iron' : null;
  if (area === 'Isla Selva' || area === 'Aldea Liana') return r < 0.2 ? 'jade' : r < 0.35 ? 'silver' : null;
  if (area === 'Isla Ceniza') return r < 0.25 ? 'obsidiana' : r < 0.45 ? 'goldore' : null;
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
export const HAIR_COLORS = HAIR_COLORS_A;
export const BODY_M = [{ id: 'normal', name: 'Normal' }, { id: 'atletico', name: 'Atlético' }, { id: 'robusto', name: 'Robusto' }, { id: 'delgado', name: 'Delgado' }, { id: 'clasico', name: 'Clásico' }];
export const BODY_F = [{ id: 'normal', name: 'Normal' }, { id: 'atletica', name: 'Atlética' }, { id: 'curvy', name: 'Curvas' }, { id: 'delgada', name: 'Delgada' }, { id: 'clasica', name: 'Clásica' }];
const CLASSIC_HAIR = { largo: 'largo', melena: 'melena', coleta: 'coleta', dosColetas: 'coleta', trenza: 'trenza', corto: 'corto', punta: 'punta', despeinado: 'rizado', flequillo: 'corto', samurai: 'coleta', lateral: 'cresta', melenaM: 'largo' };
export { HAIR_AF, HAIR_AM, FACES_F, FACES_M, FACE_SHAPES, EYE_COLORS };
export const CLOTHES = [0x3a6aa0, 0x9a2a2a, 0x3a7a3a, 0x6a3d8f, 0x8a6a3a, 0x2a2a30];
export const SKINS = [0xf3cfaa, 0xe8b98f, 0xc68a5a, 0x8a5a3a];

export function buildLook(ap, equip = {}) {
  const female = ap.gender === 'f';
  const body = (female ? BODY_F : BODY_M)[ap.body ?? 0]?.id || 'normal';
  const classic = body === 'clasico' || body === 'clasica';
  const hairId = (female ? HAIR_AF : HAIR_AM)[ap.hair ?? 0]?.id || 'corto';
  const look = {
    female, body, anime: !classic,
    faceShape: FACE_SHAPES[ap.faceShape ?? 0].id,
    face: (female ? FACES_F : FACES_M)[ap.face ?? 0].id,
    eyeColor: ap.eye ?? 0,
    classicEye: classic ? parseInt(EYE_COLORS[ap.eye ?? 0].c.slice(1), 16) : undefined,
    bust: female ? (ap.bust ?? 2) : 0,
    noNose: ap.nose === false, noMouth: ap.mouth === false, noBlush: ap.blush === false,
    faceRes: 512,
    skin: SKINS[ap.skin ?? 1],
    shirt: CLOTHES[ap.clothes ?? 0],
    pants: female ? 0x3a2a3a : 0x3a2e24,
    boots: 0x3a2618,
    hair: HAIR_COLORS_A[ap.hairColor ?? 1],
    hairStyle: classic ? CLASSIC_HAIR[hairId] : hairId,
    beard: ap.beard && !female ? HAIR_COLORS_A[ap.hairColor ?? 1] : undefined,
  };
  for (const s of SLOTS) {
    const id = equip[s.id];
    if (id && EQUIP[id]) Object.assign(look, EQUIP[id].look);
  }
  if (look.shirtOverride) look.shirt = look.shirtOverride;
  // cosméticos: tapan el aspecto de la armadura (no sus estadísticas)
  const ch = EQUIP[equip.cosHead], cb = EQUIP[equip.cosBody], cc = EQUIP[equip.cosCape];
  if (ch) { for (const k of ['hat', 'hatColor', 'plume', 'feather', 'capColor', 'hornColor']) delete look[k]; Object.assign(look, ch.look); }
  if (cb) { for (const k of ['armor', 'armorColor', 'tabard', 'emblem', 'gem', 'spikes', 'pauldron', 'vest', 'baldric', 'cravat', 'sash', 'coat', 'sleeve', 'scarf']) delete look[k]; Object.assign(look, cb.look); }
  if (cc) Object.assign(look, cc.look);
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
  if (level >= 80) return { weapon: 'hacha_obsidiana', shield: 'escudo_obsidiana', head: 'yelmo_obsidiana', chest: 'peto_obsidiana', hands: 'guantes_obsidiana', feet: 'botas_obsidiana' };
  if (level >= 65) return { weapon: 'katana_jade', shield: 'escudo_jade', head: 'casco_jade', chest: 'peto_jade', hands: 'guantes_jade', feet: 'botas_jade' };
  if (level >= 50) return { weapon: 'alfanje_ambar', shield: 'escudo_ambar', head: 'casco_ambar', chest: 'peto_ambar', hands: 'guantes_ambar', feet: 'botas_ambar' };
  if (level >= 35) return { weapon: 'espada_oro', shield: 'escudo_oro', head: 'casco_oro', chest: 'peto_oro', hands: 'guantes_oro', feet: 'botas_oro' };
  if (level >= 20) return { weapon: 'sable_plata', shield: 'escudo_plata', head: 'casco_plata', chest: 'peto_plata', hands: 'guantes_plata', feet: 'botas_plata' };
  if (level >= 10) return { weapon: 'espada_hierro', shield: 'escudo_hierro', chest: 'peto_hierro', feet: 'botas_hierro' };
  return { weapon: 'espada_madera', chest: 'peto_cuero', feet: 'botas_cuero' };
}
export const TIER_NAMES = ['Cuero', 'Hierro', 'Plata', 'Oro', 'Ámbar', 'Jade', 'Obsidiana'];
export function crewTier(level) { return level >= 80 ? 6 : level >= 65 ? 5 : level >= 50 ? 4 : level >= 35 ? 3 : level >= 20 ? 2 : level >= 10 ? 1 : 0; }

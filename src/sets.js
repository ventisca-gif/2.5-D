// Expansión v5.0: 12 conjuntos nuevos (72 piezas) para los niveles 110-350, minerales nuevos y dónde se consiguen.
// Cada conjunto tiene su propio estilo (colores, cascos, hombreras, capas, escudos y armas distintas).
export const NEW_MATS = {
  oro_solar: { name: 'Oro solar', icon: '🌞', type: 'mat', value: 160, desc: 'Se pica en las rocas de la Ciudad Celeste.' },
  plata_lunar: { name: 'Plata lunar', icon: '🌙', type: 'mat', value: 170, desc: 'Se pica en las rocas de la Ciudad Celeste.' },
  polvo_estelar: { name: 'Polvo estelar', icon: '✨', type: 'mat', value: 220, desc: 'Lo sueltan los grifos y caballeros celestes.' },
  mithril: { name: 'Mithril', icon: '🔷', type: 'mat', value: 240, desc: 'Se pica en las rocas de la Isla Bruma de hace 100 años.' },
  adamantita: { name: 'Adamantita', icon: '🟦', type: 'mat', value: 300, desc: 'Mineral rarísimo del pasado (rocas de la Isla Bruma antigua).' },
  escama_wyrm: { name: 'Escama de wyrm', icon: '🐉', type: 'mat', value: 260, desc: 'La sueltan los wyrms antiguos del pasado.' },
  piedra_infernal: { name: 'Piedra infernal', icon: '🔥', type: 'mat', value: 340, desc: 'Se pica en las rocas del Abismo Ardiente.' },
  sangre_dragon: { name: 'Sangre de dragón', icon: '🩸', type: 'mat', value: 400, desc: 'La sueltan dragones y demonios del Abismo.' },
  esencia_titan: { name: 'Esencia de titán', icon: '💠', type: 'mat', value: 800, desc: 'La sueltan los jefes de la expansión y los titanes de magma.' },
};
// [id, nombre corto, tier, nivel, colosal, piezas: arma, escudo, casco, pecho, guantes, botas, receta base]
const S = [
  { id: 'sol', name: 'del Sol Radiante', lvl: 110, mats: { oro_solar: 6, polvo_estelar: 1 },
    w: ['Mandoble flamígero', { sword: true, blade: 0xffd070, guard: 0xd8a838, bladeLen: 0.78, bladeW: 0.07, bladeGlow: 0xffa020 }],
    sh: ['Escudo del sol', { type: 'kite', color: 0x1a1a1e, rim: 0xd8a838, boss: 0xffc030 }],
    hd: ['Yelmo emplumado del sol', { hat: 'helmet', hatColor: 0x55565e, plume: 0xffc030, halo: 0xffb020 }],
    ch: ['Coraza del Sol Radiante', { armor: true, armorColor: 0x4a4a52, trim: 0xd8a838, emblem: 0xffc030, pauldron: 0xd8a838, spikes: true, tabard: 0x1a1a1e }],
    gl: ['Guanteletes solares', { gloves: 0xd8a838, bracers: true, bracerColor: 0x4a4a52 }],
    bt: ['Grebas solares', { boots: 0x3a3a42, legArmor: 0xd8a838 }] },
  { id: 'torre', name: 'de la Torre de Plata', lvl: 130, mats: { plata_lunar: 7 },
    w: ['Espada larga de la torre', { sword: true, blade: 0xeef0f8, guard: 0xd8b040, bladeLen: 0.7 }],
    sh: ['Pavés de la torre', { type: 'tower', color: 0xc8ccd8, rim: 0xd8b040, boss: 0x1a1a2a }],
    hd: ['Yelmo corona de la torre', { hat: 'helmet', hatColor: 0xc8ccd8, gem: 0xd8b040, visorGlow: 0x9ab0d8 }],
    ch: ['Placas y malla de la torre', { armor: true, armorColor: 0xc8ccd8, trim: 0xd8b040, pauldron: 0xb8bcc8, tabard: 0x1a1a1e, baldric: 0xd8b040 }],
    gl: ['Manoplas de la torre', { gloves: 0xc8ccd8, bracers: true, bracerColor: 0xd8b040 }],
    bt: ['Escarpes de la torre', { boots: 0xb8bcc8, legArmor: 0xc8ccd8 }] },
  { id: 'templario', name: 'del Templario Carmesí', lvl: 150, mats: { oro_solar: 5, plata_lunar: 4 }, plan: true,
    w: ['Espada bastarda del templario', { sword: true, blade: 0xe8e8f0, guard: 0xd8a838, bladeLen: 0.72, bladeW: 0.06 }],
    sh: ['Escudo cruzado carmesí', { type: 'kite', color: 0xa81a1a, rim: 0xd8a838, boss: 0xe8e8f0 }],
    hd: ['Yelmo de cresta dorada', { hat: 'helmet', hatColor: 0xd8dce4, plume: 0xd8a838 }],
    ch: ['Coraza del Templario Carmesí', { armor: true, armorColor: 0xd8dce4, trim: 0xd8a838, tabard: 0xa81a1a, cape: 0xb01a1a, pauldron: 0xd8dce4, emblem: 0xd8a838 }],
    gl: ['Guanteletes templarios', { gloves: 0xd8dce4, bracers: true, bracerColor: 0xd8a838 }],
    bt: ['Grebas templarias', { boots: 0xc8ccd4, legArmor: 0xd8a838 }] },
  { id: 'wyrm', name: 'de Escamas de Wyrm', lvl: 170, mats: { escama_wyrm: 6, mithril: 2 },
    w: ['Lanza colmillo de wyrm', { spear: true, blade: 0x9ad87a, guard: 0xb88a3a }],
    sh: ['Rodela de escamas', { type: 'round', color: 0x5a7a4a, rim: 0xb88a3a, boss: 0x9ad87a }],
    hd: ['Yelmo cornudo de wyrm', { hat: 'horned', hatColor: 0x5a7a4a, hornColor: 0xd8c8a0 }],
    ch: ['Cota de escamas de wyrm', { armor: true, armorColor: 0x5a7a4a, trim: 0xb88a3a, pauldron: 0x6a8a5a, spikes: true, emblem: 0x9ad87a }],
    gl: ['Garras de wyrm', { gloves: 0x4a6a3a, bracers: true, bracerColor: 0xb88a3a }],
    bt: ['Botas de escamas', { boots: 0x3a5a2a, legArmor: 0x5a7a4a }] },
  { id: 'barbaro', name: 'del Coloso Bárbaro', lvl: 190, mats: { mithril: 5, leather: 10 }, bulk: 1.15,
    w: ['Gran hacha bárbara', { axe: true, blade: 0xb8bcc4, guard: 0x5a3a20 }],
    sh: ['Escudo de madera y hierro', { type: 'round', color: 0x8a6a44, rim: 0x6a6a6a, boss: 0x9a9aa0 }],
    hd: ['Casco de cuernos de bestia', { hat: 'horned', hatColor: 0x6a4a2a, hornColor: 0xf0e8d0 }],
    ch: ['Pieles del Coloso Bárbaro', { armor: true, armorColor: 0x8a6a4a, trim: 0x5a3a20, pauldron: 0x5a3a20, spikes: true, robe: 0x6a4a2a }],
    gl: ['Brazales de piel', { gloves: 0x5a3a20, bracers: true, bracerColor: 0x8a6a4a }],
    bt: ['Botas de piel de oso', { boots: 0x4a3018, legArmor: 0x8a6a4a }] },
  { id: 'negra', name: 'de la Guardia Negra', lvl: 210, mats: { mithril: 6, adamantita: 2 }, plan: true,
    w: ['Espada negra del guardián', { sword: true, blade: 0x2a2a30, guard: 0xc8a040, bladeLen: 0.68 }],
    sh: ['Escudo de la Guardia Negra', { type: 'kite', color: 0x1a1a1e, rim: 0xc8a040, boss: 0xc81a1a }],
    hd: ['Yelmo de penacho rojo', { hat: 'helmet', hatColor: 0x1a1a1e, plume: 0xc81a1a }],
    ch: ['Armadura de la Guardia Negra', { armor: true, armorColor: 0x1a1a1e, trim: 0xc8a040, pauldron: 0x1a1a1e, cape: 0x6a1a10, emblem: 0xc8a040, gem: 0xc81a1a }],
    gl: ['Guanteletes negros', { gloves: 0x1a1a1e, bracers: true, bracerColor: 0xc8a040 }],
    bt: ['Grebas negras', { boots: 0x141418, legArmor: 0x2a2a30 }] },
  { id: 'draco', name: 'del Draconiano Sombrío', lvl: 230, mats: { adamantita: 5, escama_wyrm: 3 },
    w: ['Lanza dracónica sombría', { spear: true, blade: 0x6a6a72, guard: 0x2a2a30 }],
    sh: ['Rodela de púas sombría', { type: 'round', color: 0x2a2a30, rim: 0x4a4a52, boss: 0x8a8aff }],
    hd: ['Yelmo de cuernos de dragón', { hat: 'horned', hatColor: 0x2a2a30, hornColor: 0x6a6a72, visorGlow: 0xc8c8ff, dragonHorns: 0x2a2a30 }],
    ch: ['Placas del Draconiano Sombrío', { armor: true, armorColor: 0x2a2a30, trim: 0x4a4a52, pauldron: 0x3a3a42, spikes: true, tail: 0x2a2a30, tailSpike: 0x6a6a72 }],
    gl: ['Garras dracónicas', { gloves: 0x2a2a30, bracers: true, bracerColor: 0x4a4a52 }],
    bt: ['Grebas dracónicas', { boots: 0x1a1a20, legArmor: 0x3a3a42 }] },
  { id: 'garra', name: 'de la Garra Nocturna', lvl: 250, mats: { adamantita: 6, piedra_infernal: 3 },
    w: ['Sable curvo nocturno', { sword: true, blade: 0x3a2a2a, guard: 0x6a1a1a, bladeLen: 0.6, bladeW: 0.07 }],
    sh: ['Escudo de garras', { type: 'kite', color: 0x1a1014, rim: 0x6a1a1a, boss: 0xff3a3a }],
    hd: ['Yelmo de cresta nocturna', { hat: 'helmet', hatColor: 0x1a1014, plume: 0x2a2a2a, visorGlow: 0xff3a3a }],
    ch: ['Armadura de la Garra Nocturna', { armor: true, armorColor: 0x1a1014, trim: 0x6a1a1a, pauldron: 0x2a1418, spikes: true, robe: 0x1a1014 }],
    gl: ['Zarpas de la noche', { gloves: 0x1a1014, bracers: true, bracerColor: 0x6a1a1a }],
    bt: ['Grebas de púas nocturnas', { boots: 0x140c10, legArmor: 0x2a1418 }] },
  { id: 'tirano', name: 'del Tirano Violeta', lvl: 280, mats: { piedra_infernal: 6, polvo_estelar: 3 }, plan: true, bulk: 1.2,
    w: ['Hacha del tirano', { axe: true, blade: 0x8a5ad8, guard: 0xd8a838 }],
    sh: ['Pavés violeta', { type: 'tower', color: 0x3a1a5a, rim: 0xd8a838, boss: 0x3ad8c8 }],
    hd: ['Corona de cuernos del tirano', { hat: 'horned', hatColor: 0x2a1040, hornColor: 0xd8a838, halo: 0xd8a838, gem: 0x3ad8c8 }],
    ch: ['Armadura del Tirano Violeta', { armor: true, armorColor: 0x3a1a5a, trim: 0xd8a838, gem: 0x3ad8c8, emblem: 0x3ad8c8, pauldron: 0x4a2a6a, spikes: true, cape: 0x2a1040, wings: 0x2a1040 }],
    gl: ['Guanteletes del tirano', { gloves: 0x3a1a5a, bracers: true, bracerColor: 0xd8a838 }],
    bt: ['Grebas del tirano', { boots: 0x2a1040, legArmor: 0x4a2a6a }] },
  { id: 'infernal', name: 'Infernal', lvl: 300, mats: { piedra_infernal: 7, sangre_dragon: 3 },
    w: ['Espada del infierno', { sword: true, blade: 0xff5a10, guard: 0x2a1012, bladeLen: 0.82, bladeW: 0.085, bladeGlow: 0xff3a00 }],
    sh: ['Rodela de magma', { type: 'round', color: 0x1a1012, rim: 0xc81a10, boss: 0xff5a10 }],
    hd: ['Yelmo del demonio', { hat: 'horned', hatColor: 0x1a1012, hornColor: 0x8a1a10, visorGlow: 0xff3a10 }],
    ch: ['Coraza Infernal', { armor: true, armorColor: 0x1a1012, trim: 0xc81a10, gem: 0xff2a10, emblem: 0xff3a10, pauldron: 0x2a1418, spikes: true, cape: 0x3a0a08 }],
    gl: ['Guanteletes de magma', { gloves: 0x1a1012, bracers: true, bracerColor: 0xc81a10 }],
    bt: ['Grebas de magma', { boots: 0x140808, legArmor: 0x3a1010 }] },
  { id: 'titan', name: 'del Coloso Titánico', lvl: 325, mats: { esencia_titan: 2, adamantita: 6 }, bulk: 1.3,
    w: ['Martillo titánico', { axe: true, blade: 0x9a9ca4, guard: 0x5a5c64 }],
    sh: ['Muro titánico', { type: 'tower', color: 0x8a8c94, rim: 0x5a5c64, boss: 0x8ad8ff }],
    hd: ['Yelmo titánico', { hat: 'helmet', hatColor: 0x8a8c94, visorGlow: 0x8ad8ff }],
    ch: ['Placas del Coloso Titánico', { armor: true, armorColor: 0x8a8c94, trim: 0x5a5c64, pauldron: 0x9a9ca4, emblem: 0x8ad8ff }],
    gl: ['Puños titánicos', { gloves: 0x7a7c84, bracers: true, bracerColor: 0x5a5c64 }],
    bt: ['Pies de titán', { boots: 0x6a6c74, legArmor: 0x8a8c94 }] },
  { id: 'celestial', name: 'Celestial Supremo', lvl: 350, mats: { esencia_titan: 3, polvo_estelar: 5, oro_solar: 5 }, plan: true, bulk: 1.12,
    w: ['Espada de luz celestial', { sword: true, blade: 0xfff4c0, guard: 0xffd040, bladeLen: 0.82, bladeGlow: 0xffe080 }],
    sh: ['Escudo celestial', { type: 'kite', color: 0xf4f4f8, rim: 0xffd040, boss: 0x8ad8ff }],
    hd: ['Yelmo alado celestial', { hat: 'helmet', hatColor: 0xf4f4f8, plume: 0xffffff, halo: 0xffe080, gem: 0x8ad8ff }],
    ch: ['Armadura Celestial Suprema', { armor: true, armorColor: 0xf4f4f8, trim: 0xffd040, gem: 0x8ad8ff, emblem: 0xffd040, pauldron: 0xffffff, wings: 0xf8f8ff, wingTrim: 0xffd040, cape: 0xf4ecd8 }],
    gl: ['Guanteletes celestiales', { gloves: 0xf4f4f8, bracers: true, bracerColor: 0xffd040 }],
    bt: ['Grebas celestiales', { boots: 0xe8e8f0, legArmor: 0xffd040 }] },
];
export const NEW_SETS = S;
export const NEW_TIER_NAMES = ['Sol Radiante', 'Torre de Plata', 'Templario', 'Wyrm', 'Bárbaro', 'Guardia Negra', 'Draconiano', 'Garra Nocturna', 'Tirano', 'Infernal', 'Titánico', 'Celestial'];
export function addExpansion(EQUIP, ITEMS, RECIPES) {
  Object.assign(ITEMS, NEW_MATS);
  S.forEach((s, i) => {
    const t = 9 + i, k = t - 8;
    const wIcon = s.w[1].axe ? '🪓' : s.w[1].spear ? '🔱' : '⚔️';
    const parts = [
      ['arma', 'weapon', s.w, { atk: Math.round(84 + k * 16) }, wIcon],
      ['escudo', 'shield', s.sh, { def: Math.round(40 + k * 7) }, '🛡️'],
      ['casco', 'head', s.hd, { def: Math.round(27 + k * 5) }, '⛑️'],
      ['peto', 'chest', s.ch, { def: Math.round(52 + k * 9), hp: Math.round(k * 45 * (s.bulk || 1)) }, '🛡️'],
      ['guantes', 'hands', s.gl, { def: Math.round(19 + k * 3.5) }, '🧤'],
      ['botas', 'feet', s.bt, { def: Math.round(19 + k * 3.5) }, '👢'],
    ];
    parts.forEach(([kind, slot, [name, look], stats, icon]) => {
      const id = `${kind}_${s.id}`;
      const lk = slot === 'shield' ? { shield: look } : { ...look };
      if (slot === 'chest' && s.bulk) lk.bulk = s.bulk;
      if (slot === 'chest') { const c = look.armorColor || 0x444444, sh = (k2) => (Math.round(((c >> 16) & 255) * k2) << 16) | (Math.round(((c >> 8) & 255) * k2) << 8) | Math.round((c & 255) * k2); lk.shirtOverride = sh(0.55); lk.pants = sh(0.4); }
      EQUIP[id] = { name, slot, tier: t, icon, lvl: s.lvl, set: s.id, ...stats, look: lk };
      const need = {};
      for (const [m, n] of Object.entries(s.mats)) need[m] = Math.max(1, Math.round(n * (slot === 'chest' ? 1.3 : slot === 'hands' || slot === 'feet' ? 0.6 : 1)));
      RECIPES.push({ out: id, station: 'forja', need, gold: Math.round(2000 + k * 900 * (slot === 'chest' ? 1.4 : 1)), plan: s.plan ? s.id : null, lvl: s.lvl });
    });
  });
}
export function crewGearX(level) {
  for (let i = S.length - 1; i >= 0; i--) if (level >= S[i].lvl) { const s = S[i].id; return { weapon: 'arma_' + s, shield: 'escudo_' + s, head: 'casco_' + s, chest: 'peto_' + s, hands: 'guantes_' + s, feet: 'botas_' + s }; }
  return null;
}
export function crewTierX(level) { for (let i = S.length - 1; i >= 0; i--) if (level >= S[i].lvl) return 9 + i; return -1; }

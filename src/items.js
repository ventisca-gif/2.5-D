// Objetos, equipo (visible en el personaje), recetas de forja/banco/cocina y botines.
import { HAIR_AF, HAIR_AM, HAIR_COLORS_A, FACES_F, FACES_M, FACE_SHAPES, EYE_COLORS } from './anime.js';

import { addExpansion, crewGearX, crewTierX, NEW_TIER_NAMES } from './sets.js';
export const MAX_LEVEL = 500;

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
  mapa_tesoro: { name: 'Mapa del tesoro', icon: '🗺️', type: 'mat', value: 0, desc: 'Míralo en la Bitácora (Mapas). Busca la X y cava.' },
  anillo_boda: { name: 'Anillo de compromiso', icon: '💍', type: 'mat', value: 0, desc: 'Para pedir matrimonio a tu pareja (o a otro jugador).' },
  petalo_sakura: { name: 'Pétalo de cerezo', icon: '🌸', type: 'mat', value: 80, desc: 'Del cerezo gigante de la loma de Villarroca (primavera).' },
  concha_dorada: { name: 'Concha dorada', icon: '🐚', type: 'mat', value: 80, desc: 'La marea de verano las deja en la loma de Villarroca.' },
  seta_otono: { name: 'Seta de otoño', icon: '🍄', type: 'mat', value: 80, desc: 'Setas gigantes de la loma de Villarroca (otoño).' },
  cristal_hielo: { name: 'Cristal de hielo', icon: '❄️', type: 'mat', value: 120, desc: 'De la Cueva Helada que se abre en invierno.' },
  escama_leyenda: { name: 'Escama legendaria', icon: '🐉', type: 'mat', value: 3000, desc: 'De las cuatro bestias legendarias del mar.' },
  huevo_dragon_real: { name: 'Huevo de dragón real', icon: '🥚', type: 'mat', value: 0, desc: 'Llévalo encima: eclosiona solo y en 6 días tu dragón será adulto y podrás montarlo y volar.' },
  fragmento_eclipse: { name: 'Fragmento de eclipse', icon: '🌑', type: 'mat', value: 400, desc: 'Solo cae durante un eclipse. El Oráculo de Villarroca lo cambia por núcleos estelares y la Capa del Eclipse.' },
  escama_lava: { name: 'Escama de lava', icon: '🔥', type: 'mat', value: 600, desc: 'De los peces del Volcán Submarino.' },
  huevo_dragon: { name: 'Huevo de dragón', icon: '🥚', type: 'mat', value: 0, desc: 'Úsalo en Bitácora › Vida para que nazca tu cría de dragón.' },
  pocion_mayor: { name: 'Poción mayor', icon: '🧪', type: 'elixir', value: 30, desc: 'Cura el 60% de la vida.' },
  elixir_fuerza: { name: 'Elixir de fuerza', icon: '💪', type: 'elixir', value: 40, desc: '+30% de daño durante 3 min.' },
  elixir_piel: { name: 'Elixir de piel de piedra', icon: '🪨', type: 'elixir', value: 40, desc: '+35% de defensa durante 3 min.' },
  elixir_sabio: { name: 'Elixir del sabio', icon: '📘', type: 'elixir', value: 40, desc: '+30% de experiencia durante 3 min.' },
  caramelo: { name: 'Caramelo de Halloween', icon: '🍬', type: 'mat', value: 0, desc: 'Cámbialos con Marisol por disfraces.' },
  ambar_gris: { name: 'Ámbar gris', icon: '🟤', type: 'mat', value: 500, desc: 'Lo sueltan los monstruos marinos cazados con arpón. Muy valioso.' },
  pala: { name: 'Pala de arqueólogo', icon: '⛏', type: 'tool', value: 0, desc: 'Excava los montículos con una X roja.' },
  reliquia_colmillo: { name: 'Colmillo del Kraken', icon: '🦷', type: 'relic', value: 0, desc: 'Reliquia: +8% de daño. Actívala (máx. 2).' },
  reliquia_escudo: { name: 'Escudo del Rey Hundido', icon: '🛡', type: 'relic', value: 0, desc: 'Reliquia: +10% de defensa.' },
  reliquia_corazon: { name: 'Corazón de Coral', icon: '❤️', type: 'relic', value: 0, desc: 'Reliquia: +10% de vida máxima.' },
  reliquia_reloj: { name: 'Reloj de Arena Eterno', icon: '⏳', type: 'relic', value: 0, desc: 'Reliquia: +12% de experiencia.' },
  reliquia_brujula: { name: 'Brújula de los Siete Mares', icon: '🧭', type: 'relic', value: 0, desc: 'Reliquia: +10% de velocidad del barco.' },
  caja_contrabando: { name: 'Caja de contrabando', icon: '📦', type: 'mat', value: 0, desc: 'Llévala al puerto que te dijo Sombra.' },
  cristal: { name: 'Cristal de escarcha', icon: '❄️', type: 'mat', value: 45, desc: 'Se pica en las rocas de la Isla Escarcha.' },
  meteorito: { name: 'Fragmento de meteorito', icon: '☄️', type: 'mat', value: 70, desc: 'Rocas de la Isla Engranaje.' },
  azucar: { name: 'Azúcar cristalizado', icon: '🍬', type: 'ingr', value: 10, desc: 'Rocas dulces de la Isla Merengue.' },
  atun: { name: 'Atún', icon: '🐟', type: 'ingr', value: 15, desc: 'Pez de mar abierto.' },
  pez_espada: { name: 'Pez espada', icon: '🗡️', type: 'ingr', value: 40, desc: 'Pez raro y luchador.' },
  pez_luna: { name: 'Pez luna', icon: '🌕', type: 'ingr', value: 80, desc: 'Pez rarísimo que brilla de noche.' },
  pez_dorado: { name: 'Pez dorado legendario', icon: '✨', type: 'ingr', value: 400, desc: '¡Una leyenda entre los pescadores!' },
  hechizo_fuego: { name: 'Hechizo: lluvia de fuego', icon: '🔥', type: 'spell', value: 60, desc: 'Daño de fuego a todos los enemigos cercanos.' },
  hechizo_escudo: { name: 'Hechizo: piel de espíritus', icon: '🛡️', type: 'spell', value: 60, desc: 'Reduce mucho el daño recibido durante 30 s.' },
  hechizo_niebla: { name: 'Hechizo: niebla vudú', icon: '🌫️', type: 'spell', value: 50, desc: 'Los enemigos cercanos dejan de perseguirte.' },
  muneco_vudu: { name: 'Muñeco vudú', icon: '🪆', type: 'spell', value: 150, desc: 'Maldice al enemigo más cercano: pierde un 15% de su vida máxima.' },
  ficha: { name: 'Ficha de gremio', icon: '🎟️', type: 'mat', value: 0, desc: 'Se gana con los trabajos del tablón. Se cambia por ropa en la Bitácora (Oficios).' },
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
  semilla_trigo: { name: 'Semillas de trigo', icon: '🌱', type: 'ingr', value: 1, desc: 'Plántalas en un huerto (Lucía las vende).' },
  semilla_zanahoria: { name: 'Semillas de zanahoria', icon: '🌱', type: 'ingr', value: 2, desc: 'Plántalas en un huerto.' },
  semilla_calabaza: { name: 'Semillas de calabaza', icon: '🌱', type: 'ingr', value: 3, desc: 'Plántalas en un huerto.' },
  zanahoria: { name: 'Zanahoria', icon: '🥕', type: 'food', heal: 14, value: 4, desc: 'De tu huerto.' },
  calabaza: { name: 'Calabaza', icon: '🎃', type: 'ingr', value: 8, desc: 'De tu huerto. Para la tarta.' },
  huevo: { name: 'Huevo', icon: '🥚', type: 'ingr', value: 3, desc: 'De tu gallinero.' },
  leche: { name: 'Leche', icon: '🥛', type: 'food', heal: 12, value: 4, desc: 'De tu establo.' },
  coral: { name: 'Coral rojo', icon: '🪸', type: 'mat', value: 25, desc: 'Del fondo del mar, en la Ciudad de Coralia.' },
  almeja: { name: 'Almeja', icon: '🐚', type: 'ingr', value: 5, desc: 'Se recoge con la marea baja.' },
  f_tortilla: { name: 'Tortilla', icon: '🍳', type: 'food', heal: 60, value: 12, desc: '+60 de vida.' },
  f_tarta: { name: 'Tarta de calabaza', icon: '🥧', type: 'food', heal: 140, stamina: true, value: 30, desc: '+140 de vida y estamina llena.' },
  f_guiso_zanahoria: { name: 'Guiso de zanahoria', icon: '🍲', type: 'food', heal: 90, value: 18, desc: '+90 de vida.' },
  f_batido: { name: 'Batido de manzana', icon: '🥤', type: 'food', heal: 50, stamina: true, value: 10, desc: '+50 de vida y estamina llena.' },
  f_almejas: { name: 'Almejas a la marinera', icon: '🦪', type: 'food', heal: 80, value: 16, desc: '+80 de vida.' },
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
  espada_escarcha: { name: 'Espada de escarcha', slot: 'weapon', tier: 7, atk: 66, icon: '🗡️', look: { sword: true, blade: 0xcff0ff, guard: 0x5a9ad8, bladeLen: 0.6, bladeGlow: 0x3a8ad8 } },
  hacha_escarcha: { name: 'Hacha de escarcha', slot: 'weapon', tier: 7, atk: 70, icon: '🪓', look: { axe: true, blade: 0xcff0ff, guard: 0x5a9ad8 } },
  lanza_escarcha: { name: 'Lanza de escarcha', slot: 'weapon', tier: 7, atk: 64, icon: '🔱', look: { spear: true, trident: true } },
  escudo_escarcha: { name: 'Escudo de escarcha', slot: 'shield', tier: 7, def: 33, icon: '🛡️', look: { shield: { type: 'kite', color: 0xcfe8f8, rim: 0x5a9ad8, boss: 0xffffff } } },
  casco_escarcha: { name: 'Yelmo de escarcha', slot: 'head', tier: 7, def: 22, icon: '⛑️', look: { hat: 'helmet', hatColor: 0xcfe8f8, plume: 0x5a9ad8 } },
  peto_escarcha: { name: 'Armadura de escarcha', slot: 'chest', tier: 7, def: 42, icon: '🛡️', look: { armor: true, armorColor: 0xcfe8f8, trim: 0x5a9ad8, emblem: 0x3a7ab8, pauldron: 0xa8d0f0, gem: 0x7ad8ff } },
  guantes_escarcha: { name: 'Guanteletes de escarcha', slot: 'hands', tier: 7, def: 15, icon: '🧤', look: { gloves: 0xa8d0f0, bracers: true, bracerColor: 0xcfe8f8 } },
  botas_escarcha: { name: 'Grebas de escarcha', slot: 'feet', tier: 7, def: 15, icon: '👢', look: { boots: 0x5a7a9a, legArmor: 0xcfe8f8 } },
  espada_estelar: { name: 'Espada estelar', slot: 'weapon', tier: 8, atk: 84, icon: '⚔️', look: { sword: true, blade: 0xb8a8ff, guard: 0xffd040, bladeLen: 0.66, bladeGlow: 0x7a5aff } },
  hacha_estelar: { name: 'Hacha estelar', slot: 'weapon', tier: 8, atk: 88, icon: '🪓', look: { axe: true, blade: 0x8a7aff, guard: 0xffd040 } },
  lanza_estelar: { name: 'Lanza estelar', slot: 'weapon', tier: 8, atk: 82, icon: '🔱', look: { spear: true, trident: true } },
  escudo_estelar: { name: 'Escudo estelar', slot: 'shield', tier: 8, def: 40, icon: '🛡️', look: { shield: { type: 'round', color: 0x2a1a5a, rim: 0xffd040, boss: 0xb8a8ff } } },
  casco_estelar: { name: 'Yelmo estelar', slot: 'head', tier: 8, def: 27, icon: '⛑️', look: { hat: 'horned', hatColor: 0x2a1a5a, hornColor: 0xffd040, gem: 0xb8a8ff } },
  peto_estelar: { name: 'Armadura estelar', slot: 'chest', tier: 8, def: 52, icon: '🛡️', look: { armor: true, armorColor: 0x2a1a5a, trim: 0xffd040, emblem: 0xb8a8ff, pauldron: 0x3a2a7a, gem: 0xffffff, spikes: true } },
  guantes_estelar: { name: 'Guanteletes estelares', slot: 'hands', tier: 8, def: 19, icon: '🧤', look: { gloves: 0x2a1a5a, bracers: true, bracerColor: 0xffd040 } },
  botas_estelar: { name: 'Grebas estelares', slot: 'feet', tier: 8, def: 19, icon: '👢', look: { boots: 0x1a1030, legArmor: 0x3a2a7a } },
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
  traje_guardia: { name: 'Uniforme de la Marina', slot: 'cosBody', tier: 2, cos: true, icon: '🎖️', look: { coat: true, shirt: 0x2a4a8a, sleeve: 0xf4f4f8, trim: 0xd8a838, sash: 0xf4f4f8 } },
  camisa_marinera: { name: 'Camisa marinera', slot: 'cosBody', tier: 0, cos: true, icon: '👕', look: { shirt: 0xf0f2f8, scarf: 0xc8302a, sleeve: 0x2a4a8a } },
  capa_lobo: { name: 'Capa de piel de lobo', slot: 'cosCape', tier: 1, cos: true, icon: '🐺', look: { cape: 0x8c8f96 } },
  capa_tigre: { name: 'Capa de piel de tigre', slot: 'cosCape', tier: 2, cos: true, icon: '🐯', look: { cape: 0xd8781a } },
  capa_murcielago: { name: 'Capa de alas de murciélago', slot: 'cosCape', tier: 2, cos: true, icon: '🦇', look: { cape: 0x3a1a4a } },
  // ---- 40 cosméticos nuevos
  c_tricornio_rojo: { name: 'Tricornio carmesí', slot: 'cosHead', tier: 1, cos: true, icon: '🎩', src: 'gremio', look: { hat: 'tricorn', hatColor: 0x8a1a1a, feather: 0xf0e0b0 } },
  c_tricornio_blanco: { name: 'Tricornio de almirante', slot: 'cosHead', tier: 3, cos: true, icon: '🎩', src: 'gremio', look: { hat: 'tricorn', hatColor: 0xf0f0f0, feather: 0x2a4a9a, trim: 0xd8a838 } },
  c_sombrero_paja: { name: 'Sombrero de paja', slot: 'cosHead', tier: 0, cos: true, icon: '👒', src: 'tienda', look: { hat: 'straw' } },
  c_turbante_azul: { name: 'Turbante del desierto', slot: 'cosHead', tier: 1, cos: true, icon: '👳', src: 'tienda', look: { hat: 'turban' } },
  c_capucha_verde: { name: 'Capucha de explorador', slot: 'cosHead', tier: 1, cos: true, icon: '🧝', src: 'gremio', look: { hat: 'hood', hatColor: 0x2e5e2e } },
  c_capucha_negra: { name: 'Capucha de asesino', slot: 'cosHead', tier: 2, cos: true, icon: '🥷', src: 'evento', look: { hat: 'hood', hatColor: 0x1a1a22 } },
  c_diadema: { name: 'Diadema de oro', slot: 'cosHead', tier: 2, cos: true, icon: '👑', src: 'gremio', look: { hat: 'circlet' } },
  c_yelmo_cuernos: { name: 'Yelmo vikingo', slot: 'cosHead', tier: 2, cos: true, icon: '⛑️', src: 'evento', look: { hat: 'horned', hatColor: 0x8a8a90, hornColor: 0xf0e8d0 } },
  c_yelmo_plumas: { name: 'Yelmo de caballero', slot: 'cosHead', tier: 2, cos: true, icon: '⛑️', src: 'gremio', look: { hat: 'helmet', hatColor: 0xd8dce4, plume: 0xc8302a } },
  c_gorra_capitan: { name: 'Gorra de capitán', slot: 'cosHead', tier: 1, cos: true, icon: '🧢', src: 'tienda', look: { hat: 'cap', capColor: 0x1a2a4a } },
  c_bandana_negra: { name: 'Pañuelo negro', slot: 'cosHead', tier: 0, cos: true, icon: '🏴‍☠️', src: 'tienda', look: { hat: 'bandana', capColor: 0x1a1a1a } },
  c_bandana_morada: { name: 'Pañuelo morado', slot: 'cosHead', tier: 0, cos: true, icon: '🏴‍☠️', src: 'gremio', look: { hat: 'bandana', capColor: 0x6a2a8a } },
  c_parche_oro: { name: 'Parche y pendiente de oro', slot: 'cosHead', tier: 1, cos: true, icon: '🏴', src: 'evento', look: { eyepatch: true, earring: true } },
  c_corona_abismo: { name: 'Corona del Abismo', slot: 'cosHead', tier: 4, cos: true, icon: '🔱', src: 'leviatan', look: { hat: 'circlet', halo: 0x3ad8c8 } },
  c_casaca_azul: { name: 'Casaca de corsario azul', slot: 'cosBody', tier: 1, cos: true, icon: '🧥', src: 'gremio', look: { coat: true, shirt: 0x2a4a8a, vest: 0xe8d8a8, cravat: true, sash: 0x1a1a1a, sleeve: 0xf0ead8 } },
  c_casaca_verde: { name: 'Casaca esmeralda', slot: 'cosBody', tier: 1, cos: true, icon: '🧥', src: 'gremio', look: { coat: true, shirt: 0x1a5a3a, vest: 0xd8b060, sash: 0x8a1a1a } },
  c_casaca_morada: { name: 'Casaca real morada', slot: 'cosBody', tier: 2, cos: true, icon: '🧥', src: 'evento', look: { coat: true, shirt: 0x4a1a6a, vest: 0xe0b040, cravat: true, trim: 0xe0b040 } },
  c_chaleco_cuero: { name: 'Chaleco de cuero', slot: 'cosBody', tier: 0, cos: true, icon: '🦺', src: 'tienda', look: { vest: 0x6a4428, shirt: 0xe8e0d0 } },
  c_camisa_rayas: { name: 'Camisa a rayas', slot: 'cosBody', tier: 0, cos: true, icon: '👕', src: 'tienda', look: { shirt: 0xf0f0f0, sleeve: 0x2a2a4a, scarf: 0x2a2a4a } },
  c_tunica_monje: { name: 'Túnica de monje', slot: 'cosBody', tier: 1, cos: true, icon: '🥋', src: 'gremio', look: { robe: 0x8a5a2a, shirt: 0x8a5a2a, sash: 0x3a2414 } },
  c_tunica_mago: { name: 'Túnica de hechicero', slot: 'cosBody', tier: 2, cos: true, icon: '🧙', src: 'evento', look: { robe: 0x2a2a6a, shirt: 0x2a2a6a, sash: 0xe0c040, trim: 0xe0c040 } },
  c_vestido_rojo: { name: 'Vestido de gala rojo', slot: 'cosBody', tier: 2, cos: true, icon: '👗', src: 'gremio', look: { dress: true, dressColor: 0xa01a2a, shirt: 0xa01a2a, trim: 0xe0c040 } },
  c_vestido_azul: { name: 'Vestido de marinera', slot: 'cosBody', tier: 1, cos: true, icon: '👗', src: 'tienda', look: { dress: true, dressColor: 0x2a4a8a, shirt: 0xf0f0f4, scarf: 0xc8302a } },
  c_kimono: { name: 'Kimono del este', slot: 'cosBody', tier: 2, cos: true, icon: '👘', src: 'evento', look: { robe: 0xd8486a, shirt: 0xd8486a, sash: 0x1a1a3a } },
  c_traje_cazador: { name: 'Traje de cazador', slot: 'cosBody', tier: 1, cos: true, icon: '🏹', src: 'gremio', look: { shirt: 0x3a5a2a, vest: 0x5a3a20, bracers: true, bracerColor: 0x5a3a20, baldric: 0x3a2414 } },
  c_armadura_negra: { name: 'Armadura negra', slot: 'cosBody', tier: 3, cos: true, icon: '🛡️', src: 'evento', look: { armor: true, armorColor: 0x2a2a30, trim: 0x8a1a1a, pauldron: 0x2a2a30 } },
  c_armadura_oro: { name: 'Armadura dorada de desfile', slot: 'cosBody', tier: 3, cos: true, icon: '🛡️', src: 'gremio', look: { armor: true, armorColor: 0xe0b040, trim: 0xfff0b0, tabard: 0xf0f0f0 } },
  c_uniforme_almirante: { name: 'Uniforme de almirante', slot: 'cosBody', tier: 3, cos: true, icon: '🎖️', src: 'gremio', look: { coat: true, shirt: 0xf4f4f8, sleeve: 0xf4f4f8, trim: 0xd8a838, sash: 0x2a4a9a, cravat: true } },
  c_harapos: { name: 'Harapos de náufrago', slot: 'cosBody', tier: 0, cos: true, icon: '🩳', src: 'evento', look: { shirt: 0xb8a888, sleeve: 0xb8a888, sash: 0x6a5a3a } },
  c_traje_abismo: { name: 'Escamas del Abismo', slot: 'cosBody', tier: 4, cos: true, icon: '🐙', src: 'leviatan', look: { armor: true, armorColor: 0x1a4a5a, trim: 0x3ad8c8, pauldron: 0x1a3a4a, gem: 0x3ad8c8 } },
  c_capa_roja: { name: 'Capa carmesí', slot: 'cosCape', tier: 1, cos: true, icon: '🧣', src: 'tienda', look: { cape: 0xa01a1a } },
  c_capa_azul: { name: 'Capa azul real', slot: 'cosCape', tier: 1, cos: true, icon: '🧣', src: 'tienda', look: { cape: 0x2a3a8a } },
  c_capa_blanca: { name: 'Capa blanca de la Marina', slot: 'cosCape', tier: 2, cos: true, icon: '🧣', src: 'gremio', look: { cape: 0xf4f4f8 } },
  c_capa_negra: { name: 'Capa negra del corsario', slot: 'cosCape', tier: 2, cos: true, icon: '🧣', src: 'gremio', look: { cape: 0x141418 } },
  c_capa_oro: { name: 'Capa de hilo de oro', slot: 'cosCape', tier: 3, cos: true, icon: '🧣', src: 'evento', look: { cape: 0xd8a838 } },
  c_capa_verde: { name: 'Capa del bosque', slot: 'cosCape', tier: 1, cos: true, icon: '🧣', src: 'gremio', look: { cape: 0x2e5e2e } },
  c_capa_jade: { name: 'Manto de jade', slot: 'cosCape', tier: 2, cos: true, icon: '🧣', src: 'evento', look: { cape: 0x2ab07a } },
  c_capa_lava: { name: 'Manto de lava', slot: 'cosCape', tier: 3, cos: true, icon: '🔥', src: 'evento', look: { cape: 0xd8481a } },
  c_mochila: { name: 'Mochila de viajero', slot: 'cosCape', tier: 0, cos: true, icon: '🎒', src: 'tienda', look: { backpack: 0x7a5232 } },
  c_alas_murcielago: { name: 'Alas de vampiro', slot: 'cosCape', tier: 3, cos: true, icon: '🦇', src: 'evento', look: { wings: [0x3a1a4a, 0x3a1a4a], wingTrim: 0x8a1a2a } },
  c_traje_boda: { name: 'Traje de boda', slot: 'cosBody', tier: 3, cos: true, icon: '🤵', src: 'boda', look: { coat: true, shirt: 0xf4f4f8, vest: 0xe8e0d0, cravat: true, sleeve: 0xf4f4f8, trim: 0xe0b040, sash: 0xe8c8d0 } },
  c_vestido_novia: { name: 'Vestido de novia', slot: 'cosBody', tier: 3, cos: true, icon: '👰', src: 'boda', look: { dress: true, dressColor: 0xfaf8f4, shirt: 0xfaf8f4, sleeve: 0xfaf8f4, trim: 0xe0c060 } },
  c_velo_novia: { name: 'Corona de flores', slot: 'cosHead', tier: 2, cos: true, icon: '💐', src: 'boda', look: { hat: 'circlet', halo: 0xffd0e0 } },
  c_capa_campeon: { name: 'Capa del campeón de regatas', slot: 'cosCape', tier: 4, cos: true, icon: '🏁', src: 'regata', look: { cape: 0x2ad84a, wingTrim: 0xffffff } },
  c_corona_atlantida: { name: 'Corona de Atlántida', slot: 'cosHead', tier: 5, cos: true, icon: '🔱', src: 'Atlántida restaurada', look: { hat: 'circlet', halo: 0x3ad8c8 } },
  c_capa_gremio: { name: 'Capa del Gremio de Cazadores', slot: 'cosCape', tier: 4, cos: true, icon: '🏹', src: 'ranking del gremio', look: { cape: 0x3a4a1a } },
  c_corona_flores: { name: 'Corona de flores de cerezo', slot: 'cosHead', tier: 3, cos: true, icon: '🌸', src: 'primavera', look: { hat: 'circlet', halo: 0xffb0d0 } },
  c_capa_verano: { name: 'Capa de la marea de verano', slot: 'cosCape', tier: 3, cos: true, icon: '🐚', src: 'verano', look: { cape: 0x3ab8d8 } },
  c_capa_otono: { name: 'Capa de hojas de otoño', slot: 'cosCape', tier: 3, cos: true, icon: '🍂', src: 'otoño', look: { cape: 0xc85a1a } },
  c_corona_escarcha: { name: 'Corona de escarcha', slot: 'cosHead', tier: 3, cos: true, icon: '❄️', src: 'invierno', look: { hat: 'circlet', halo: 0x8ad8ff } },
  c_capa_leviatan: { name: 'Capa de las Bestias del Mar', slot: 'cosCape', tier: 5, cos: true, icon: '🌊', src: '4 bestias legendarias', look: { cape: 0x1a3a6a } },
  c_capa_jinete: { name: 'Capa del jinete de dragón', slot: 'cosCape', tier: 4, cos: true, icon: '🐉', src: 'carrera de dragones', look: { cape: 0xa83a1a } },
  c_corona_torre: { name: 'Corona de la Torre Infinita', slot: 'cosHead', tier: 5, cos: true, icon: '🗼', src: 'torre (piso 50)', look: { hat: 'circlet', halo: 0x8ad8ff } },
  c_corona_leyendas: { name: 'Corona de las Leyendas', slot: 'cosHead', tier: 5, cos: true, icon: '👑', src: 'Torneo de las Leyendas', look: { hat: 'circlet', halo: 0xff5a3a } },
  c_capa_eclipse: { name: 'Capa del Eclipse', slot: 'cosCape', tier: 5, cos: true, icon: '🌑', src: 'eclipse', look: { cape: 0x2a0a14 } },
  c_capa_titan: { name: 'Capa del Titán Eterno', slot: 'cosCape', tier: 5, cos: true, icon: '⚔️', src: 'asalto', look: { cape: 0xd8a838 } },
  c_corona_campeon: { name: 'Corona del campeón del torneo', slot: 'cosHead', tier: 4, cos: true, icon: '👑', src: 'torneo', look: { hat: 'circlet', halo: 0xffd040 } },
  c_corona_cripta: { name: 'Corona del Rey de la Cripta', slot: 'cosHead', tier: 5, cos: true, icon: '💀', src: 'cripta', look: { hat: 'horned', hatColor: 0xd8d0b8, hornColor: 0x3a3030, visorGlow: 0x7aff8a } },
  c_espectral: { name: 'Casaca espectral', slot: 'cosBody', tier: 5, cos: true, icon: '👻', src: 'espectral', look: { coat: true, shirt: 0x2a4a50, vest: 0x7af0e0, sleeve: 0x3a6a70, trim: 0x7af0e0, sash: 0x1a2a30 } },
  c_capa_espectral: { name: 'Capa de niebla', slot: 'cosCape', tier: 5, cos: true, icon: '🌫️', src: 'espectral', look: { cape: 0x9ad8d8 } },
  c_corona_coral: { name: 'Corona de coral', slot: 'cosHead', tier: 4, cos: true, icon: '🪸', src: 'coralia', look: { hat: 'circlet', halo: 0xff7a6a } },
  c_traje_sirena: { name: 'Escamas de sirena', slot: 'cosBody', tier: 4, cos: true, icon: '🧜', src: 'coralia', look: { armor: true, armorColor: 0x2ab0b0, trim: 0xffd060, pauldron: 0x1a8a9a, gem: 0xff7a6a } },
  c_gorro_nieve: { name: 'Gorro de lana', slot: 'cosHead', tier: 1, cos: true, icon: '🧶', src: 'tienda', look: { hat: 'hood', hatColor: 0xc83a3a } },
  c_abrigo_piel: { name: 'Abrigo de piel', slot: 'cosBody', tier: 2, cos: true, icon: '🧥', src: 'tienda', look: { coat: true, shirt: 0x6a4a3a, vest: 0xf0e8e0, sleeve: 0xf0e8e0, trim: 0xf0e8e0 } },
  c_traje_pastelero: { name: 'Traje de pastelero', slot: 'cosBody', tier: 1, cos: true, icon: '🧁', src: 'tienda', look: { shirt: 0xfaf6f0, apron: 0xf4a8c8, sleeve: 0xfaf6f0 } },
  c_gorro_pastelero: { name: 'Gorro de cocinero', slot: 'cosHead', tier: 1, cos: true, icon: '👨‍🍳', src: 'tienda', look: { hat: 'hood', hatColor: 0xfaf8f4 } },
  c_gafas_inventor: { name: 'Gafas de inventor', slot: 'cosHead', tier: 2, cos: true, icon: '🥽', src: 'tienda', look: { hat: 'cap', capColor: 0x6a4a2a, visorGlow: 0xffd040 } },
  c_mono_mecanico: { name: 'Mono de mecánico', slot: 'cosBody', tier: 1, cos: true, icon: '🔧', src: 'tienda', look: { shirt: 0x3a5a7a, pants: 0x3a5a7a, sash: 0x6a4a2a, bracers: true, bracerColor: 0x8a8c94 } },
  c_corona_hielo: { name: 'Corona de escarcha', slot: 'cosHead', tier: 6, cos: true, icon: '👑', src: 'jefe', look: { hat: 'circlet', hatColor: 0xe8f8ff, halo: 0x9ae8ff } },
  c_capa_vapor: { name: 'Capa de vapor', slot: 'cosCape', tier: 5, cos: true, icon: '♨️', src: 'jefe', look: { cape: 0xb8862a } },
  c_corona_pastel: { name: 'Corona de caramelo', slot: 'cosHead', tier: 5, cos: true, icon: '🍬', src: 'jefe', look: { hat: 'circlet', hatColor: 0xffd040, halo: 0xff8ac8 } },
  c_gorro_pescador: { name: 'Gorro del campeón de pesca', slot: 'cosHead', tier: 4, cos: true, icon: '🎣', src: 'evento', look: { hat: 'straw', capColor: 0x3a6a8a } },
  c_capa_cazador: { name: 'Capa del cazador de leyendas', slot: 'cosCape', tier: 5, cos: true, icon: '🐾', src: 'evento', look: { cape: 0x6a4a2a } },
  c_capa_gremio: { name: 'Capa del gremio de aventureros', slot: 'cosCape', tier: 6, cos: true, icon: '⚔️', src: 'gremio', look: { cape: 0x2a4a6a } },
  c_anillo_destino: { name: 'Diadema del destino', slot: 'cosHead', tier: 6, cos: true, icon: '💍', src: 'evento', look: { hat: 'circlet', hatColor: 0xffd040, halo: 0xff8ac8 } },
  c_gorro_navidad: { name: 'Gorro navideño', slot: 'cosHead', tier: 3, cos: true, icon: '🎅', src: 'evento', look: { hat: 'hood', hatColor: 0xd82a2a } },
  c_mascara_calabaza: { name: 'Cabeza de calabaza', slot: 'cosHead', tier: 3, cos: true, icon: '🎃', src: 'evento', look: { hat: 'hood', hatColor: 0xff8a1a } },
  c_disfraz_fantasma: { name: 'Disfraz de fantasma', slot: 'cosCape', tier: 3, cos: true, icon: '👻', src: 'evento', look: { cape: 0xf4f4f4 } },
  c_mascara_carnaval: { name: 'Máscara de carnaval', slot: 'cosHead', tier: 3, cos: true, icon: '🎭', src: 'evento', look: { hat: 'circlet', hatColor: 0xff4a8a, halo: 0x4ad8ff } },
  c_corona_bruma: { name: 'Corona de la Bruma', slot: 'cosHead', tier: 6, cos: true, icon: '👑', src: 'evento', look: { hat: 'circlet', hatColor: 0xd8a838, halo: 0x8a5aff } },
  c_corona_marea: { name: 'Corona de Marea', slot: 'cosHead', tier: 5, cos: true, icon: '🔱', src: 'evento', look: { hat: 'circlet', hatColor: 0x7af0ff, halo: 0x3ad8ff } },
  c_capa_marea: { name: 'Capa de algas de Marea', slot: 'cosCape', tier: 4, cos: true, icon: '🌊', src: 'tienda', look: { cape: 0x2a8a7a } },
  c_capa_rival: { name: 'Capa de Kael', slot: 'cosCape', tier: 6, cos: true, icon: '⚔️', src: 'evento', look: { cape: 0x2a1a2a } },
  c_capa_burbuja: { name: 'Capa de pompas', slot: 'cosCape', tier: 3, cos: true, icon: '🫧', src: 'tienda', look: { cape: 0x9ae0f8 } },
  // ---- armaduras de superjefe (cosméticas)
  c_dragon: { name: 'Armadura del Dragón Carmesí', slot: 'cosBody', tier: 6, cos: true, icon: '🐉', src: 'dragon', look: { armor: true, armorColor: 0x1a1418, trim: 0xd8a838, pauldron: 0x8a1010, tabard: 0x8a1010, gem: 0xff6020, emblem: 0xff6020, gloves: 0x1a1418, legArmor: 0x8a1010, boots: 0x1a1418, hat: 'horned', hatColor: 0x1a1418, hornColor: 0xd8a838, gem2: 0xff6020, dragonHorns: 0xd8a838, tail: 0x2a2026, tailSpike: 0xd8a838, visorGlow: 0xff8030, hair: 0x8a1010 } },
  c_serafin: { name: 'Armadura del Serafín', slot: 'cosBody', tier: 6, cos: true, icon: '😇', src: 'serafin', look: { armor: true, armorColor: 0xf0f0f4, trim: 0xe8c050, pauldron: 0xf4f4f8, tabard: 0xf0e8d0, gem: 0xffe080, emblem: 0xffe080, gloves: 0xf0f0f4, legArmor: 0xf0f0f4, boots: 0xe8e8ee, hat: 'helmet', hatColor: 0xf4f4f8, plume: 0xffe080, halo: 0xffd040, visorGlow: 0xffe080, cape: 0xf4ecd8 } },
  c_alas_serafin: { name: 'Alas del Serafín (luz y sombra)', slot: 'cosCape', tier: 6, cos: true, icon: '🪽', src: 'serafin', look: { wings: [0xf4f4f8, 0x1a1a1a], wingTrim: 0xffd040 } },
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
  { out: 'espada_escarcha', station: 'forja', need: { cristal: 5, silver: 2 }, gold: 900 },
  { out: 'hacha_escarcha', station: 'forja', need: { cristal: 5, iron: 3 }, gold: 900 },
  { out: 'lanza_escarcha', station: 'forja', need: { cristal: 5, wood: 3 }, gold: 900 },
  { out: 'escudo_escarcha', station: 'forja', need: { cristal: 4 }, gold: 700 },
  { out: 'casco_escarcha', station: 'forja', need: { cristal: 3 }, gold: 600 },
  { out: 'peto_escarcha', station: 'forja', need: { cristal: 6, leather: 2 }, gold: 1000 },
  { out: 'guantes_escarcha', station: 'forja', need: { cristal: 2 }, gold: 450 },
  { out: 'botas_escarcha', station: 'forja', need: { cristal: 2 }, gold: 450 },
  { out: 'espada_estelar', station: 'forja', need: { meteorito: 5, cristal: 2 }, gold: 1600 },
  { out: 'hacha_estelar', station: 'forja', need: { meteorito: 5, obsidiana: 2 }, gold: 1600 },
  { out: 'lanza_estelar', station: 'forja', need: { meteorito: 5, jade: 2 }, gold: 1600 },
  { out: 'escudo_estelar', station: 'forja', need: { meteorito: 4 }, gold: 1300 },
  { out: 'casco_estelar', station: 'forja', need: { meteorito: 3 }, gold: 1100 },
  { out: 'peto_estelar', station: 'forja', need: { meteorito: 6, cristal: 2 }, gold: 1800 },
  { out: 'guantes_estelar', station: 'forja', need: { meteorito: 2 }, gold: 800 },
  { out: 'botas_estelar', station: 'forja', need: { meteorito: 2 }, gold: 800 },
  { out: 'anillo_boda', station: 'forja', need: { goldore: 2, perla: 1 }, gold: 100 },
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
  { out: 'f_tortilla', station: 'fuego', need: { huevo: 2 }, gold: 0 },
  { out: 'f_tarta', station: 'fuego', need: { calabaza: 1, wheat: 2, huevo: 1 }, gold: 0 },
  { out: 'f_guiso_zanahoria', station: 'fuego', need: { zanahoria: 2, meat: 1 }, gold: 0 },
  { out: 'f_batido', station: 'fuego', need: { leche: 1, apple: 1 }, gold: 0 },
  { out: 'f_almejas', station: 'fuego', need: { almeja: 3 }, gold: 0 },
  { out: 'f_fish', station: 'fuego', need: { fish: 1 }, gold: 0 },
  { out: 'f_soup', station: 'fuego', need: { mushroom: 2, wheat: 1 }, gold: 0 },
  { out: 'f_pie', station: 'fuego', need: { apple: 2, wheat: 1 }, gold: 0 },
  { out: 'f_stew', station: 'fuego', need: { meat: 1, fish: 1, mushroom: 1 }, gold: 0 },
];
addExpansion(EQUIP, ITEMS, RECIPES);
for (const [id, e] of Object.entries(EQUIP)) if (e.set && !ITEMS[id]) ITEMS[id] = { ...e, type: 'equip', value: 15 + e.tier * 40, desc: `${e.atk ? '+' + e.atk + ' de ataque' : '+' + e.def + ' de defensa'}${e.hp ? ', +' + e.hp + ' de vida' : ''}. Nivel ${e.lvl}.${e.look.bulk ? ' Armadura colosal: te hace más grande.' : ''}` };


// ----------------------------------------------------------------- botines
export const DROPS = {
  wolf: [['meat', 0.6], ['leather', 0.5]],
  grifo: [['polvo_estelar', 0.35], ['leather', 0.6]],
  sapo_gigante: [['musgo_maldito', 0.5]], bruja_pantano: [['musgo_maldito', 0.6], ['pocion_mayor', 0.2]], hidra_pantano: [['musgo_maldito', 0.8], ['esencia_titan', 0.1]],
  reina_cienaga: [['nucleo_estelar', 1], ['musgo_maldito', 1], ['musgo_maldito', 1]],
  hongo_andante: [['espora_luz', 0.6]], escarabajo_luz: [['espora_luz', 0.5]], druida_esporas: [['espora_luz', 0.7], ['esencia_titan', 0.1]],
  micelio_rey: [['nucleo_estelar', 1], ['espora_luz', 1], ['espora_luz', 1]],
  marinero_fantasma: [['madera_espectral', 0.6]], cangrejo_coloso: [['madera_espectral', 0.5], ['perla', 0.5]], kraken_joven: [['madera_espectral', 0.6], ['ambar_gris', 0.1]],
  almirante_muerto: [['nucleo_estelar', 1], ['madera_espectral', 1], ['madera_espectral', 1]],
  centinela_vacio: [['fragmento_vacio', 0.6]], devorador_estelar: [['fragmento_vacio', 0.6]], caballero_vacio: [['fragmento_vacio', 0.8], ['esencia_titan', 0.15]],
  nihil: [['nucleo_estelar', 1], ['nucleo_estelar', 1], ['fragmento_vacio', 1], ['fragmento_vacio', 1]],
  caballero_celeste: [['polvo_estelar', 0.4], ['plata_lunar', 0.3]],
  golem_nube: [['oro_solar', 0.5], ['plata_lunar', 0.4]],
  rey_celeste: [['esencia_titan', 1], ['polvo_estelar', 1], ['polvo_estelar', 1], ['oro_solar', 1]],
  lobo_ancestral: [['leather', 1], ['meat', 0.8], ['mithril', 0.2]],
  caballero_antiguo: [['mithril', 0.45], ['adamantita', 0.12]],
  wyrm_antiguo: [['escama_wyrm', 0.7], ['escama_wyrm', 0.3]],
  espectro_tiempo: [['adamantita', 0.2], ['mithril', 0.3]],
  cronos: [['esencia_titan', 1], ['adamantita', 1], ['adamantita', 1], ['escama_wyrm', 1]],
  demonio_alado: [['sangre_dragon', 0.35], ['piedra_infernal', 0.3]],
  caballero_infernal: [['piedra_infernal', 0.5], ['sangre_dragon', 0.2]],
  dragon_menor: [['sangre_dragon', 0.7], ['escama_wyrm', 0.4]],
  titan_magma: [['esencia_titan', 0.25], ['piedra_infernal', 0.6]],
  senor_infernal: [['esencia_titan', 1], ['esencia_titan', 1], ['sangre_dragon', 1], ['sangre_dragon', 1]],
  reina_hielo: [['cristal', 1], ['cristal', 1], ['cristal', 1], ['c_corona_hielo', 0.5], ['perla', 1]],
  gran_automata: [['meteorito', 1], ['meteorito', 1], ['meteorito', 1], ['c_capa_vapor', 0.5], ['iron', 1]],
  rey_pastel: [['azucar', 1], ['azucar', 1], ['f_tarta', 1], ['c_corona_pastel', 0.5], ['goldore', 1]],
  lobo_nieve: [['meat', 0.6], ['leather', 0.7], ['cristal', 0.25]],
  yeti: [['leather', 1], ['cristal', 0.6], ['c_gorro_nieve', 0.02]],
  galleta: [['azucar', 0.8], ['f_bread', 0.4]],
  cangrejo_burbuja: [['crab', 0.75], ['perla', 0.12]],
  automata: [['iron', 0.8], ['meteorito', 0.35], ['silver', 0.3]],
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
  serafin: [['c_serafin', 1], ['c_alas_serafin', 0.6], ['goldore', 1], ['perla', 1]],
  crypt_king: [['goldore', 1], ['silver', 1]],
  merfolk: [['coral', 0.4], ['escama', 0.3], ['perla', 0.08]],
  jelly: [['perla', 0.1], ['coral', 0.2]],
  abyss_queen: [['c_corona_coral', 0.6], ['c_traje_sirena', 0.6], ['perla', 1], ['coral', 1], ['coral', 1]],
  ghost_captain: [['c_espectral', 0.7], ['c_capa_espectral', 0.7], ['perla', 1], ['goldore', 1]],
  dragon: [['c_dragon', 1], ['c_capa_lava', 0.5], ['huevo_dragon', 0.35], ['obsidiana', 1], ['nucleo_golem', 1]],
  tentacle: [['escama', 0.5]],
  dragon_salvaje: [['sangre_dragon', 0.6], ['escama_wyrm', 0.3]], wyvern: [['sangre_dragon', 0.5], ['escama_wyrm', 0.4]],
  dragon_ancestral: [['nucleo_estelar', 1], ['huevo_dragon_real', 0.25], ['sangre_dragon', 1], ['sangre_dragon', 1]],
  pez_lava: [['escama_lava', 0.6], ['piedra_infernal', 0.3]], leviatan_fuego: [['nucleo_estelar', 1], ['nucleo_estelar', 1], ['escama_lava', 1], ['escama_lava', 1]],
  titan_eterno: [['nucleo_estelar', 1], ['esencia_titan', 1], ['esencia_titan', 1]],
  golem_boss: [['obsidiana', 1], ['obsidiana', 1], ['obsidiana', 1], ['nucleo_golem', 1], ['nucleo_golem', 1]],
};
DROPS.wolf.push(['capa_lobo', 0.03]);
DROPS.skeleton.push(['bandana_roja', 0.02]);
// menas al picar rocas, según la zona
export function oreDrop(area) {
  const r = Math.random();
  if (area === 'Pantano Maldito') return r < 0.3 ? 'musgo_maldito' : null;
  if (area === 'Bosque de Hongos Gigantes') return r < 0.3 ? 'espora_luz' : null;
  if (area === 'Cementerio de Barcos') return r < 0.3 ? 'madera_espectral' : r < 0.36 ? 'fragmento_vacio' : null;
  if (area === 'Ciudadela del Vacío') return r < 0.3 ? 'fragmento_vacio' : null;
  if (area === 'Ciudad Celeste' || area === 'Jardines Celestes') return r < 0.2 ? 'oro_solar' : r < 0.4 ? 'plata_lunar' : null;
  if (area === 'Isla Bruma (hace 100 años)' || area === 'Villarroca Antigua') return r < 0.22 ? 'mithril' : r < 0.3 ? 'adamantita' : null;
  if (area === 'Abismo Ardiente' || area === 'Fortaleza Infernal') return r < 0.28 ? 'piedra_infernal' : r < 0.33 ? 'adamantita' : null;
  if (area === 'Isla Duna' || area === 'Oasis de Sal') return r < 0.22 ? 'ambar' : r < 0.45 ? 'iron' : null;
  if (area === 'Isla Selva' || area === 'Aldea Liana') return r < 0.2 ? 'jade' : r < 0.35 ? 'silver' : null;
  if (area === 'Isla Escarcha' || area === 'Monasterio del Pico') return r < 0.22 ? 'cristal' : r < 0.4 ? 'silver' : null;
  if (area === 'Isla Engranaje' || area === 'Ciudad Engranaje') return r < 0.18 ? 'meteorito' : r < 0.45 ? 'iron' : null;
  if (area === 'Isla Merengue' || area === 'Villa Merengue') return r < 0.35 ? 'azucar' : null;
  if (area === 'Archipiélago Burbuja') return r < 0.08 ? 'perla' : r < 0.3 ? 'silver' : null;
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
  if (level >= 110) return crewGearX(level);
  if (level >= 98) return { weapon: 'espada_estelar', shield: 'escudo_estelar', head: 'casco_estelar', chest: 'peto_estelar', hands: 'guantes_estelar', feet: 'botas_estelar' };
  if (level >= 90) return { weapon: 'espada_escarcha', shield: 'escudo_escarcha', head: 'casco_escarcha', chest: 'peto_escarcha', hands: 'guantes_escarcha', feet: 'botas_escarcha' };
  if (level >= 80) return { weapon: 'hacha_obsidiana', shield: 'escudo_obsidiana', head: 'yelmo_obsidiana', chest: 'peto_obsidiana', hands: 'guantes_obsidiana', feet: 'botas_obsidiana' };
  if (level >= 65) return { weapon: 'katana_jade', shield: 'escudo_jade', head: 'casco_jade', chest: 'peto_jade', hands: 'guantes_jade', feet: 'botas_jade' };
  if (level >= 50) return { weapon: 'alfanje_ambar', shield: 'escudo_ambar', head: 'casco_ambar', chest: 'peto_ambar', hands: 'guantes_ambar', feet: 'botas_ambar' };
  if (level >= 35) return { weapon: 'espada_oro', shield: 'escudo_oro', head: 'casco_oro', chest: 'peto_oro', hands: 'guantes_oro', feet: 'botas_oro' };
  if (level >= 20) return { weapon: 'sable_plata', shield: 'escudo_plata', head: 'casco_plata', chest: 'peto_plata', hands: 'guantes_plata', feet: 'botas_plata' };
  if (level >= 10) return { weapon: 'espada_hierro', shield: 'escudo_hierro', chest: 'peto_hierro', feet: 'botas_hierro' };
  return { weapon: 'espada_madera', chest: 'peto_cuero', feet: 'botas_cuero' };
}
export const TIER_NAMES = ['Cuero', 'Hierro', 'Plata', 'Oro', 'Ámbar', 'Jade', 'Obsidiana', 'Escarcha', 'Estelar', ...NEW_TIER_NAMES];
export function crewTier(level) { if (level >= 110) return crewTierX(level); return level >= 98 ? 8 : level >= 90 ? 7 : level >= 80 ? 6 : level >= 65 ? 5 : level >= 50 ? 4 : level >= 35 ? 3 : level >= 20 ? 2 : level >= 10 ? 1 : 0; }

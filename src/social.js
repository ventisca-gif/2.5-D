// Amistad, duelos, tripulación y romance: datos y textos.

// Nivel base de los NPCs según su isla/zona (los guardias son más fuertes).
const AREA_LEVEL = {
  'Villarroca': 6, 'Granja de los Trigales': 4, 'Prados de Isla Bruma': 5, 'Puerto Salitre': 10,
  'Bosque Norte': 7, 'Pedregal del Oeste': 8, 'Cala de los Huesos': 12, 'Isla Tortuga': 16, 'Isla Calavera': 20,
};
const STRONG = new Set(['ramiro', 'elvira', 'nerea', 'olga', 'mara', 'tadeo']);
export function npcLevel(id, area) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const base = AREA_LEVEL[area] ?? 6;
  return Math.max(1, base + (h % 5) - 2 + (STRONG.has(id) ? 5 : 0));
}

// Quién puede unirse a la tripulación y quién puede enamorarse.
export const RECRUITABLE = new Set(['rufo', 'olga', 'quino', 'pepe', 'telmo', 'nico', 'tito', 'ines', 'gaspar', 'tomasa', 'pio', 'elvira', 'ramiro']);
export const ROMANCE = new Set(['rosa', 'coral', 'olga', 'elvira', 'ines', 'mara', 'lucia', 'tomasa', 'rufo', 'quino', 'telmo', 'nico', 'ramiro', 'tito']);
export const MAX_CREW = 10;

export function friendLevel(f) {
  if (f >= 90) return { name: 'Alma gemela', hearts: 5 };
  if (f >= 70) return { name: 'Mejor amigo', hearts: 4 };
  if (f >= 50) return { name: 'Amigo', hearts: 3 };
  if (f >= 25) return { name: 'Conocido', hearts: 2 };
  if (f >= 5) return { name: 'Saludado', hearts: 1 };
  if (f < -20) return { name: 'Enemistado', hearts: 0 };
  return { name: 'Desconocido', hearts: 0 };
}
export function heartsText(f) {
  const h = friendLevel(f).hearts;
  return '❤'.repeat(h) + '♡'.repeat(5 - h);
}

export const CHAT_LINES = [
  '¿Habéis visto esa gaviota? Me ha robado el pan.', 'Cuando lleguemos a puerto, ¡ron para todos!', 'Mi abuela navegaba mejor que tú.',
  'Dicen que hay más islas tras la bruma.', 'Esta espada pesa más que mi primer barco.', 'Capitán, el viento sopla a favor.',
  '¿Otra vez esqueletos? Qué pereza.', '¡Arrr! Esa es la actitud.', 'Me han dicho que Tadeo forja armaduras de oro.',
  'Yo cocino el guiso, tú friegas.', 'Si encontramos tesoro, me compro un sombrero nuevo.', 'Echo de menos la taberna de Rosa.',
  'He entrenado toda la mañana. ¡Soy más fuerte!', '¡Juro que vi una sirena!', 'Ese cofre de la Calavera tenía mala pinta.',
];
export const CHAT_REPLIES = ['¡Ja, ja! Seguro.', 'Eso no te lo crees ni tú.', 'Cuenta conmigo.', '¡Arrr!', 'Lo que diga el capitán.', 'Vale, pero la próxima la pagas tú.'];

export const ROMANCE_LINES = [
  'Contigo hasta el viento del norte parece cálido.', 'Me gusta cuando paseamos por el puerto al atardecer.',
  '¿Sabes? Guardo la concha que me regalaste.', 'Prométeme que volverás de cada viaje.', 'Eres lo mejor que me ha traído el mar.',
  'Si fueras un tesoro, no te enterraría nunca.', 'Cuando te veo, olvido hasta mi nombre.',
];
export const CONFESS_YES = ['Yo... también siento algo por ti. ¡Sí, quiero estar contigo!', 'Pensé que nunca me lo dirías. ¡Claro que sí!'];
export const CONFESS_NO = ['Te aprecio mucho... pero aún necesito conocerte más.', 'Eres especial, pero dame un poco más de tiempo.'];
export const DUEL_LINES = ['¿Un duelo? ¡Acepto! Que gane el mejor.', '¡Ponte en guardia!', 'Te advierto que no me contengo.'];
export const ANGRY_LINES = ['¡¿Qué haces?! ¡Te vas a enterar!', '¡Eh! ¡Eso duele! ¡Defiéndete!', '¡Guardias! ...bueno, me defiendo yo.'];
export const GIFT_LIKES = {
  rosa: ['f_pie', 'apple'], coral: ['fish', 'f_fish'], olga: ['bone', 'f_stew'], elvira: ['iron', 'f_meat'], ines: ['f_bread', 'wheat'],
  mara: ['goldore', 'silver'], lucia: ['wheat', 'apple'], tomasa: ['f_soup', 'fish'], rufo: ['potion', 'f_stew'], quino: ['fish', 'f_crab'],
  telmo: ['f_pie', 'cloth'], nico: ['iron', 'silver'], ramiro: ['f_meat', 'iron'], tito: ['f_stew', 'f_meat'], gaspar: ['fish', 'f_fish'],
  pio: ['apple', 'f_bread'], tadeo: ['iron', 'goldore'], marisol: ['f_pie', 'cloth'], nerea: ['goldore', 'potion'], bruno: ['wood', 'f_meat'],
};

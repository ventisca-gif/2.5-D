// Cadena de misiones principal y diálogos de los NPCs.
import { ITEMS } from './items.js';

export const QUESTS = [
  { title: 'Bienvenida a Isla Bruma', desc: 'Habla con la Alcaldesa Marisol frente al Ayuntamiento de Villarroca.', type: 'talk', target: 'marisol', giver: 'marisol' },
  { title: 'Lobos en el Bosque Norte', desc: 'Caza 3 lobos en el Bosque Norte y vuelve con la Alcaldesa.', type: 'kill', target: 'wolf', count: 3, giver: 'marisol', reward: { gold: 30, xp: 40 } },
  { title: 'Madera para el carpintero', desc: 'Tala árboles y lleva 5 de madera a Carpintero Bruno.', type: 'gather', target: 'wood', count: 5, giver: 'bruno', reward: { gold: 25, xp: 35 } },
  { title: 'Rumbo a Puerto Salitre', desc: 'Baja por el camino del sur y busca a la Capitana Nerea en el muelle.', type: 'talk', target: 'nerea', giver: 'nerea', reward: { gold: 0, xp: 20 } },
  { title: 'Cangrejos en la arena', desc: 'Elimina 4 cangrejos en las playas de la isla.', type: 'kill', target: 'crab', count: 4, giver: 'nerea', reward: { gold: 35, xp: 50 } },
  { title: 'Jabalíes del Pedregal', desc: 'Lucía pide ayuda: derrota 3 jabalíes en el Pedregal del Oeste.', type: 'kill', target: 'boar', count: 3, giver: 'lucia', reward: { gold: 40, xp: 70 } },
  { title: 'Piedra para la forja', desc: 'Pica rocas y lleva 4 de piedra al Herrero Tadeo.', type: 'gather', target: 'stone', count: 4, giver: 'tadeo', reward: { gold: 30, xp: 60, item: 'espada_hierro' } },
  { title: 'La tripulación maldita', desc: 'Derrota 5 piratas esqueleto en la Cala de los Huesos (este).', type: 'kill', target: 'skeleton', count: 5, giver: 'nerea', reward: { gold: 80, xp: 140 } },
  { title: 'El Capitán Huesoamargo', desc: 'Vence al Capitán Huesoamargo junto al barco hundido de la cala.', type: 'kill', target: 'boss', count: 1, giver: 'nerea', reward: { gold: 250, xp: 400 } },
  { title: 'El tesoro de la Isla Calavera', desc: 'Sube al barco en el muelle de Puerto Salitre, navega al sureste hasta la Isla Calavera y abre el cofre maldito.', type: 'chest', target: 'calavera_cofre', reward: { gold: 0, xp: 250 } },
  { title: 'Leyenda de Isla Bruma', desc: 'Has salvado la isla. Explora el mar, visita Isla Tortuga y mejora tu equipo.', type: 'done' },
];

export const NPC_LINES = {
  marisol: ['Villarroca prospera gracias a gente valiente como tú.', 'Las murallas nos protegen, pero el mar trae problemas.'],
  bruno: ['Con buena madera se construyen casas... ¡y barcos! Usa mi banco cuando quieras.', 'Los robles del norte dan la mejor madera.'],
  tadeo: ['El acero no miente. Tráeme hierro, plata u oro y te forjaré armaduras dignas de un rey.', '¡Clang, clang! Perdona, no te oía.'],
  rosa: ['¡Bienvenido a El Ancla Torcida! Aquí siempre hay sopa caliente.', 'Un trago de ron curativo y como nuevo.'],
  nerea: ['El mar es libre, pero no gratis.', 'Mi barco, la Gaviota Negra, está amarrado en el muelle. Súbete cuando quieras y navega con el joystick.'],
  ilyas: ['Compro madera y piedra a buen precio. ¡Palabra de mercader!', 'Telas, especias, mapas... y algún que otro rumor.'],
  lucia: ['Los jabalíes del Pedregal se comen mi trigo.', 'El trigo de este año viene dorado como el oro.'],
  ramiro: ['Puerta norte vigilada. Cuidado con los lobos del bosque.', 'Nadie pasa sin que yo lo vea.'],
  elvira: ['La puerta sur lleva al puerto. Huele a sal desde aquí.', 'De noche se oyen huesos crujir en la cala del este...'],
  pio: ['¡Buen día! ¿Has visto la fuente? La construyó mi abuelo.', 'Dicen que el reloj de la torre nunca se atrasa.'],
  clara: ['¡Juguemos a los piratas! Yo soy la capitana.', '¿Tú también tienes espada? ¡Qué guay!'],
  gaspar: ['Shhh... que espantas a los peces.', 'Hoy pican poco. Será por los esqueletos de la cala.'],
  rufo: ['¡Arrr! Un día tendré mi propio barco.', 'En la Sirena Tuerta el ron corre como el agua.'],
  tomasa: ['Desde el faro veo toda la isla... y la Isla Tortuga al noreste.', 'Barco a la vista... ah no, es una gaviota.'],
  lope: ['Registro cada casa, cada barco y cada moneda de Villarroca.', 'La alcaldesa trabaja sin descanso. Yo, con mucho papeleo.'],
  ines: ['La sopa de Rosa es la mejor de la isla.', 'Mi marido es pescador; zarpa antes del alba.'],
  telmo: ['♪ Oh, Isla Bruma, de brumas y velas... ♪', '¿Una canción? Por una moneda te canto la balada del Capitán Huesoamargo.'],
  nico: ['El maestro Tadeo me deja usar la forja. ¿Te forjo algo?', 'Cuidado, ¡la forja quema!'],
  coral: ['Bienvenido a la Sirena Tuerta, marinero.', 'Aquí el ron es fuerte y las historias, más.'],
  quino: ['He navegado hasta Isla Tortuga. Allí los contrabandistas venden barato.', 'En el mar, si sopla el viento, todo se arregla.'],
  olga: ['Dicen que el cofre de la Isla Calavera está maldito... a mí me da igual.', 'Mi espada y yo hemos visto siete mares.'],
  tito: ['Cajas, sacos, barriles... y vuelta a empezar.', 'Ilyas paga poco, pero paga.'],
  ramon: ['En mis tiempos los jabalíes eran más grandes.', 'Lucía es mi nieta. Trabaja más que nadie.'],
  mara: ['En Tortuga no hacemos preguntas.', 'Si buscas tesoros, la Isla Calavera está al sur de aquí... llena de huesos andantes.'],
  pepe: ['¡Algún día seré capitán!', 'Mara dice que limpie la cubierta. ¡Pero si no tenemos barco!'],
};

// Devuelve { text, options[] } según el estado del juego.
export function dialogFor(id, G) {
  const q = G.quest;
  const cur = QUESTS[q.stage];
  const opts = [];
  let text = null;
  const isGiver = cur && cur.giver === id;

  if (cur && cur.type === 'talk' && cur.target === id) {
    if (id === 'marisol') {
      text = `¡Bienvenido a Isla Bruma, ${G.player.name}! Soy Marisol, alcaldesa de Villarroca. Medio pueblo medieval, medio puerto pirata... y últimamente con problemas. Los lobos del Bosque Norte atacan a los viajeros. ¿Nos ayudas? Caza 3 y vuelve.`;
    } else if (id === 'nerea') {
      text = `¿Te manda Marisol? Soy la Capitana Nerea. Los cangrejos gigantes están destrozando las redes de la playa. Acaba con 4 y hablaremos de algo más... serio.`;
    }
    opts.push({ label: 'Aceptar misión', action: () => G.advanceQuest() });
    return { text, options: opts };
  }

  if (isGiver && cur.type === 'kill') {
    if (q.progress >= cur.count) {
      text = {
        marisol: '¡Increíble! El bosque vuelve a ser seguro. El carpintero Bruno necesita madera para reparar el pueblo, ve a verle.',
        nerea: cur.target === 'crab'
          ? 'Buen trabajo, marinero. Lucía, la granjera del oeste, también necesita una espada. Ve a la granja.'
          : cur.target === 'skeleton'
            ? 'La tripulación maldita ha caído... pero su capitán, Huesoamargo, sigue junto al barco hundido. Termina con él.'
            : '¡Lo lograste! Huesoamargo ya no aterrorizará estas aguas. Su tesoro está en la Isla Calavera, al sureste. Llévate mi barco del muelle: súbete y navega con el joystick.',
        lucia: '¡Mis cosechas están a salvo! Tadeo, el herrero, busca piedra para su forja. Ayúdale y te forjará algo bueno.',
      }[id] || '¡Excelente trabajo!';
      opts.push({ label: 'Entregar misión', action: () => G.advanceQuest() });
    } else {
      text = `Aún te faltan ${cur.count - q.progress}. ${cur.desc}`;
      opts.push({ label: 'Entendido', action: null });
    }
    return { text, options: opts };
  }

  if (isGiver && cur.type === 'gather') {
    const have = G.player.inv[cur.target];
    const res = cur.target === 'wood' ? 'madera' : 'piedra';
    if (have >= cur.count) {
      text = id === 'bruno'
        ? '¡Madera de primera! Con esto repararé los tejados. Por cierto, la Capitana Nerea busca gente en Puerto Salitre, al sur.'
        : '¡Buena piedra! Toma, te he forjado una espada de hierro. Tráeme menas y forjaré lo que quieras. Nerea te espera en el puerto: hay piratas esqueleto en la cala del este.';
      opts.push({ label: `Entregar ${cur.count} de ${res}`, action: () => { G.player.inv[cur.target] -= cur.count; G.advanceQuest(); } });
    } else {
      text = `Necesito ${cur.count} de ${res}. Tienes ${have}. ${cur.target === 'wood' ? 'Toca un árbol para talarlo.' : 'Toca una roca para picarla.'}`;
      opts.push({ label: 'Voy a por ello', action: null });
    }
    return { text, options: opts };
  }

  // tiendas y servicios
  const P = G.player;
  const sell = (item, price, label) => opts.push({ label: label || `${ITEMS[item].icon} ${ITEMS[item].name} (${price} oro)`, action: () => G.buy({ gold: price }, () => { G.give(item, 1); G.toast(`${ITEMS[item].icon} +1 ${ITEMS[item].name}`); }) });
  if (id === 'tadeo' || id === 'nico') {
    text = text || NPC_LINES[id][0];
    opts.push({ label: '⚒️ Forjar equipo', action: () => G.panels.openCraft('forja') });
  } else if (id === 'bruno') {
    text = text || NPC_LINES.bruno[0];
    opts.push({ label: '🪚 Banco de carpintero', action: () => G.panels.openCraft('banco') });
  } else if (id === 'mara') {
    text = text || NPC_LINES.mara[Math.floor(Math.random() * 2)];
    sell('potion', 10, '🍶 Ron de contrabando (10 oro)');
    sell('sable_corsario', 260);
    sell('tricornio', 120);
    sell('amuleto_coral', 200);
  } else if (id === 'rosa' || id === 'coral') {
    text = text || NPC_LINES[id][Math.floor(Math.random() * 2)];
    sell('potion', 15);
    sell('f_meat', 12);
    sell('f_bread', 6);
    if (id === 'coral') sell('f_fish', 12);
    opts.push({ label: '🍲 Sopa caliente: curar todo (5 oro)', action: () => G.buy({ gold: 5 }, () => { P.hp = P.maxHp; G.toast('❤️ Salud al máximo'); }) });
  } else if (id === 'lucia') {
    text = text || NPC_LINES.lucia[1];
    sell('wheat', 3);
    sell('mushroom', 4);
    sell('apple', 2);
  } else if (id === 'gaspar') {
    sell('fish', 5);
  } else if (id === 'nerea' && QUESTS[G.quest.stage] && G.quest.stage >= 8) {
    sell('casaca_corsario', 220);
  } else if (id === 'ilyas') {
    text = text || NPC_LINES.ilyas[0];
    sell('cloth', 6);
    sell('leather', 10);
    const mats = Object.entries(P.inv).filter(([k, n]) => n > 0 && ITEMS[k] && ITEMS[k].type === 'mat');
    const total = mats.reduce((a, [k, n]) => a + n * ITEMS[k].value, 0);
    opts.push({ label: `💰 Vender materiales (${total} oro)`, action: () => { if (!total) return G.toast('No tienes materiales'); for (const [k] of mats) P.inv[k] = 0; P.gold += total; G.sfx('coin'); G.toast(`+${total} oro`); } });
  }
  if (!text) {
    const lines = NPC_LINES[id] || ['...'];
    text = lines[Math.floor(Math.random() * lines.length)];
    if (cur && cur.giver && cur.giver !== id && cur.type !== 'done') {
      // pista de la misión actual
      if (Math.random() < 0.5) text += ` (Misión: ${cur.desc})`;
    }
  }
  opts.push({ label: 'Adiós', action: null });
  return { text, options: opts };
}

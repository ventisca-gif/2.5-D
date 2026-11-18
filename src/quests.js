// Cadena de misiones principal y diálogos de los NPCs.

export const QUESTS = [
  { title: 'Bienvenida a Isla Bruma', desc: 'Habla con la Alcaldesa Marisol frente al Ayuntamiento de Villarroca.', type: 'talk', target: 'marisol', giver: 'marisol' },
  { title: 'Lobos en el Bosque Norte', desc: 'Caza 3 lobos en el Bosque Norte y vuelve con la Alcaldesa.', type: 'kill', target: 'wolf', count: 3, giver: 'marisol', reward: { gold: 30, xp: 40 } },
  { title: 'Madera para el carpintero', desc: 'Tala árboles y lleva 5 de madera a Carpintero Bruno.', type: 'gather', target: 'wood', count: 5, giver: 'bruno', reward: { gold: 25, xp: 35 } },
  { title: 'Rumbo a Puerto Salitre', desc: 'Baja por el camino del sur y busca a la Capitana Nerea en el muelle.', type: 'talk', target: 'nerea', giver: 'nerea', reward: { gold: 0, xp: 20 } },
  { title: 'Cangrejos en la arena', desc: 'Elimina 4 cangrejos en las playas de la isla.', type: 'kill', target: 'crab', count: 4, giver: 'nerea', reward: { gold: 35, xp: 50 } },
  { title: 'Jabalíes del Pedregal', desc: 'Lucía pide ayuda: derrota 3 jabalíes en el Pedregal del Oeste.', type: 'kill', target: 'boar', count: 3, giver: 'lucia', reward: { gold: 40, xp: 70 } },
  { title: 'Piedra para la forja', desc: 'Pica rocas y lleva 4 de piedra al Herrero Tadeo.', type: 'gather', target: 'stone', count: 4, giver: 'tadeo', reward: { gold: 30, xp: 60, weapon: 1 } },
  { title: 'La tripulación maldita', desc: 'Derrota 5 piratas esqueleto en la Cala de los Huesos (este).', type: 'kill', target: 'skeleton', count: 5, giver: 'nerea', reward: { gold: 80, xp: 140 } },
  { title: 'El Capitán Huesoamargo', desc: 'Vence al Capitán Huesoamargo junto al barco hundido de la cala.', type: 'kill', target: 'boss', count: 1, giver: 'nerea', reward: { gold: 250, xp: 400 } },
  { title: 'El tesoro de la Isla Calavera', desc: 'Sube al barco en el muelle de Puerto Salitre, navega al sureste hasta la Isla Calavera y abre el cofre maldito.', type: 'chest', target: 'calavera_cofre', reward: { gold: 0, xp: 250 } },
  { title: 'Leyenda de Isla Bruma', desc: 'Has salvado la isla. Explora el mar, visita Isla Tortuga y mejora tu equipo.', type: 'done' },
];

export const NPC_LINES = {
  marisol: ['Villarroca prospera gracias a gente valiente como tú.', 'Las murallas nos protegen, pero el mar trae problemas.'],
  bruno: ['Con buena madera se construyen casas... ¡y barcos!', 'Los robles del norte dan la mejor madera.'],
  tadeo: ['El acero no miente. Trae oro y piedra y mejoraré tu equipo.', '¡Clang, clang! Perdona, no te oía.'],
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
  nico: ['El maestro Tadeo dice que algún día forjaré espadas como él.', 'Cuidado, ¡la forja quema!'],
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
        : '¡Buena piedra! Déjame... ¡Listo! Tu arma es ahora más afilada. Nerea te espera en el puerto: hay piratas esqueleto en la cala del este.';
      opts.push({ label: `Entregar ${cur.count} de ${res}`, action: () => { G.player.inv[cur.target] -= cur.count; G.advanceQuest(); } });
    } else {
      text = `Necesito ${cur.count} de ${res}. Tienes ${have}. ${cur.target === 'wood' ? 'Toca un árbol para talarlo.' : 'Toca una roca para picarla.'}`;
      opts.push({ label: 'Voy a por ello', action: null });
    }
    return { text, options: opts };
  }

  // tiendas y servicios
  const P = G.player;
  if (id === 'tadeo') {
    const wc = 20 + P.weapon * 25, ws = 2 + P.weapon * 2;
    const ac = 20 + P.armor * 25, aw = 2 + P.armor * 2;
    text = text || NPC_LINES.tadeo[0];
    opts.push({ label: `Mejorar arma Nv.${P.weapon + 1} (${wc} oro, ${ws} piedra)`, action: () => G.buy({ gold: wc, stone: ws }, () => { P.weapon++; G.toast('⚔️ Arma mejorada'); }) });
    opts.push({ label: `Mejorar armadura Nv.${P.armor + 1} (${ac} oro, ${aw} madera)`, action: () => G.buy({ gold: ac, wood: aw }, () => { P.armor++; P.recalc(); G.toast('🛡️ Armadura mejorada'); }) });
  } else if (id === 'mara') {
    text = text || NPC_LINES.mara[Math.floor(Math.random() * 2)];
    opts.push({ label: 'Ron de contrabando (10 oro)', action: () => G.buy({ gold: 10 }, () => { P.inv.potion++; G.toast('🍶 +1 Ron curativo'); }) });
  } else if (id === 'rosa' || id === 'coral') {
    text = text || NPC_LINES[id][Math.floor(Math.random() * 2)];
    opts.push({ label: 'Ron curativo (15 oro)', action: () => G.buy({ gold: 15 }, () => { P.inv.potion++; G.toast('🍶 +1 Ron curativo'); }) });
    opts.push({ label: 'Sopa caliente: curar todo (5 oro)', action: () => G.buy({ gold: 5 }, () => { P.hp = P.maxHp; G.toast('❤️ Salud al máximo'); }) });
  } else if (id === 'ilyas') {
    text = text || NPC_LINES.ilyas[0];
    opts.push({ label: `Vender madera (${P.inv.wood} × 3 oro)`, action: () => { const n = P.inv.wood; if (!n) return G.toast('No tienes madera'); P.inv.wood = 0; P.gold += n * 3; G.sfx('coin'); G.toast(`+${n * 3} oro`); } });
    opts.push({ label: `Vender piedra (${P.inv.stone} × 4 oro)`, action: () => { const n = P.inv.stone; if (!n) return G.toast('No tienes piedra'); P.inv.stone = 0; P.gold += n * 4; G.sfx('coin'); G.toast(`+${n * 4} oro`); } });
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

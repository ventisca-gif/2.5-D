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
  // ---- Capítulo 2: el Mar de Bruma
  { title: 'Humo en el oeste', desc: 'La farera Tomasa ha visto algo desde el faro. Habla con ella.', type: 'talk', target: 'tomasa', giver: 'tomasa', reward: { gold: 50, xp: 200 },
    talkText: 'Desde el faro he visto humo al oeste: la Isla Duna. Dicen que el Jeque Zaid pide ayuda... y que barcos blancos de la Marina rondan estas aguas. Ten cuidado: si te ganas fama de pirata, te cazarán.' },
  { title: 'El Oasis de Sal', desc: 'Navega al oeste hasta la Isla Duna y habla con el Jeque Zaid en el Oasis de Sal.', type: 'talk', target: 'zaid', giver: 'zaid', reward: { gold: 80, xp: 300 },
    talkText: 'Que el viento te guarde, viajero. Los escorpiones rojos han salido de las dunas y envenenan nuestros pozos. Mata a 6 y el oasis te deberá la vida.' },
  { title: 'Escorpiones rojos', desc: 'Mata 6 escorpiones rojos en la Isla Duna y vuelve con el Jeque Zaid.', type: 'kill', target: 'scorpion', count: 6, giver: 'zaid', zone: [-58, 30], reward: { gold: 300, xp: 900, item: 'alfanje_ambar' },
    doneText: '¡El agua vuelve a correr limpia! Toma este alfanje de ámbar. Un mensajero de la Isla Selva, al norte de Isla Bruma, trajo noticias: su chamana, Ixa, sueña con calaveras de fuego.' },
  { title: 'La chamana de la selva', desc: 'Navega al norte hasta la Isla Selva y habla con la Chamana Ixa en la Aldea Liana.', type: 'talk', target: 'ixa', giver: 'ixa', reward: { gold: 100, xp: 400 },
    talkText: 'Te esperaba. Los tigres están inquietos y los murciélagos salen de día: algo los asusta. Caza 4 tigres antes de que ataquen la aldea.' },
  { title: 'Tigres inquietos', desc: 'Caza 4 tigres en la Isla Selva y vuelve con la Chamana Ixa.', type: 'kill', target: 'tiger', count: 4, giver: 'ixa', zone: [36, -62], reward: { gold: 400, xp: 1400, item: 'katana_jade' },
    doneText: 'La selva respira de nuevo. Esta katana de jade es tuya. Mis visiones hablan de un rebelde en Villa Grillete, junto al Bastión de la Marina al sur de Isla Bruma: te busca.' },
  { marine: { title: 'Órdenes del Bastión', desc: 'Navega al sur hasta el Bastión de la Marina y preséntate al Teniente Ferro en Villa Grillete.', target: 'ferro', giver: 'ferro',
      talkText: 'Así que eres la nueva recluta de la que hablan. Los piratas de Tortuga se están armando: tienen un escondite al este de la isla. Ve y derrota a 6 de ellos.' },
    title: 'El rebelde de Grillete', desc: 'Navega al sur hasta el Bastión de la Marina y busca al Rebelde Lucas en Villa Grillete, fuera de la muralla.', type: 'talk', target: 'lucas', giver: 'lucas', reward: { gold: 120, xp: 500 },
    talkText: 'La Marina no caza piratas: caza a quien no paga. El Comodoro Vidal cobra "protección" a los pueblos y quema los que se niegan. Derrota a 5 marines y demostraremos que no son invencibles. (Atacarles subirá tu recompensa.)' },
  { marine: { title: 'El escondite pirata', desc: 'Derrota a 6 piratas rivales en el escondite de Isla Tortuga y vuelve con el Teniente Ferro.', target: 'pirate', count: 6, giver: 'ferro', zone: [135, 19],
      doneText: 'Buen trabajo. Pero los peces gordos siguen libres: los piratas famosos cruzan el Mar de Bruma. Derrota a cualquiera de ellos (mira los carteles de Se busca) y vuelve.' },
    title: 'Uniformes blancos', desc: 'Derrota a 5 marines y vuelve con el Rebelde Lucas.', type: 'kill', target: 'marine', count: 5, giver: 'lucas', zone: [49, 206], reward: { gold: 600, xp: 2200 },
    doneText: '¡Ahora sí nos escucharán! Vidal se esconde frente a la torre de la fortaleza. Acaba con él y Grillete será libre.' },
  { marine: { title: 'Cazar a una leyenda', desc: 'Derrota a un pirata famoso (consulta los carteles de Se busca en los pueblos) y vuelve con el Teniente Ferro.', target: 'famous', count: 1, giver: 'ferro', zone: null,
      doneText: '¡Increíble! El Almirantazgo ha oído hablar de ti. Dicen que en la Isla Ceniza, muy al sureste, la Herrera Brasa necesita ayuda con algo antiguo que despierta en el volcán.', reward: { gold: 1500, xp: 4000, item: 'traje_guardia' } },
    title: 'El Comodoro Vidal', desc: 'Derrota al Comodoro Vidal frente a la torre del Bastión y vuelve con Lucas.', type: 'kill', target: 'marine_boss', count: 1, giver: 'lucas', zone: [49, 207], reward: { gold: 1500, xp: 4000, item: 'chaqueta_negra' },
    doneText: '¡Vidal ha caído! Toma su chaqueta: que vean quién manda ahora. Dicen que en la Isla Ceniza, muy al sureste, la Herrera Brasa forja obsidiana... y que algo antiguo despierta en el volcán.' },
  { title: 'Fuego en Isla Ceniza', desc: 'Navega al sureste lejano hasta la Isla Ceniza y habla con la Herrera Brasa.', type: 'talk', target: 'brasa', giver: 'brasa', reward: { gold: 150, xp: 700 },
    talkText: 'Si has llegado hasta aquí, sabes pelear. Cada noche salen calaveras llameantes del cráter. Destruye 5 y te contaré qué las despierta.' },
  { title: 'Calaveras llameantes', desc: 'Destruye 5 calaveras llameantes en la Isla Ceniza y vuelve con Brasa.', type: 'kill', target: 'skull', count: 5, giver: 'brasa', zone: [203, 180], reward: { gold: 900, xp: 3500 },
    doneText: 'Las llamas se calman... pero el Gólem Primigenio, el corazón del volcán, se ha levantado junto al cráter. Si cae, la isla dormirá en paz.' },
  { title: 'El Gólem Primigenio', desc: 'Derrota al Gólem Primigenio junto al cráter de la Isla Ceniza y vuelve con Brasa.', type: 'kill', target: 'golem_boss', count: 1, giver: 'brasa', zone: [214, 185], reward: { gold: 3000, xp: 8000, item: 'hacha_obsidiana' },
    doneText: '¡Lo has logrado! Con su núcleo te he forjado esta hacha de obsidiana. Ya eres leyenda en todo el Mar de Bruma.' },
  { title: 'Leyenda del Mar de Bruma', desc: 'Has vencido al Primigenio. Completa los encargos de cada isla (Bitácora), mejora tu barco con Marga y llega a nivel 100.', type: 'done' },
];

// misión actual según el bando (la Marina tiene su propia versión de algunas)
export function questAt(stage, G) {
  const q = QUESTS[stage];
  if (q && q.marine && G && G.isMarine && G.isMarine()) return { ...q, ...q.marine };
  return q;
}

// Encargos secundarios: uno por NPC, no se repiten.
export const SIDE_QUESTS = {
  naira: { title: 'Caravanas en peligro', desc: 'Destruye 3 gólems de piedra en las ruinas del templo de la Isla Duna.', type: 'kill', target: 'golem', count: 3, reward: { gold: 350, xp: 800, item: 'escudo_ambar' } },
  farid: { title: 'Dunas seguras', desc: 'Mata 8 escorpiones rojos para Farid.', type: 'kill', target: 'scorpion', count: 8, reward: { gold: 250, xp: 700, item: 'botas_ambar' } },
  selim: { title: 'Pieles de tigre', desc: 'Trae 3 pieles de tigre al Sastre Selim.', type: 'gather', target: 'piel_tigre', count: 3, reward: { gold: 200, xp: 600, item: 'capa_tigre' } },
  kuno: { title: 'La cueva de los murciélagos', desc: 'Mata 6 murciélagos vampiro en la cueva del norte de la Isla Selva.', type: 'kill', target: 'bat', count: 6, reward: { gold: 300, xp: 1000, item: 'capa_murcielago' } },
  tika: { title: 'Piedras verdes', desc: 'Tika quiere 2 piedras de jade (pica rocas en la Isla Selva).', type: 'gather', target: 'jade', count: 2, reward: { gold: 120, xp: 500, item: 'anillo_jade' } },
  berta: { title: 'Fragatas blancas', desc: 'Hunde 2 fragatas de la Marina con los cañones de tu barco.', type: 'ship', target: 'marine', count: 2, reward: { gold: 600, xp: 1800, item: 'sombrero_capitan' } },
  mara: { title: 'Competencia desleal', desc: 'Hunde 3 barcos piratas rivales para Mara.', type: 'ship', target: 'pirate', count: 3, reward: { gold: 400, xp: 1200, item: 'chaqueta_pirata' } },
  quino: { title: 'La bestia de las profundidades', desc: 'Derrota a una serpiente marina en aguas profundas (lejos de las islas).', type: 'kill', target: 'serpent', count: 1, reward: { gold: 700, xp: 2500, item: 'tridente' } },
  osvaldo: { title: 'Piedra negra', desc: 'Destruye 4 gólems de obsidiana en la Isla Ceniza.', type: 'kill', target: 'golem_obs', count: 4, reward: { gold: 800, xp: 3000, item: 'anillo_obsidiana' } },
  brasa: { title: 'Núcleos ardientes', desc: 'Trae 2 núcleos de gólem a la Herrera Brasa.', type: 'gather', target: 'nucleo_golem', count: 2, reward: { gold: 500, xp: 2000, item: 'yelmo_obsidiana' } },
  gaspar: { title: 'Perlas para Gaspar', desc: 'Trae 2 perlas (serpientes marinas y almejas de las profundidades) al pescador Gaspar.', type: 'gather', target: 'perla', count: 2, reward: { gold: 300, xp: 900, item: 'collar_perlas' } },
};

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
  zaid: ['El desierto no perdona al que olvida el agua.', 'Nuestro ámbar es el mejor del Mar de Bruma.'],
  selim: ['¿Ropa nueva? Un buen pirata se reconoce por su chaqueta.', 'Coso sobre cualquier armadura: tu armadura sigue protegiendo, solo cambia cómo luces.'],
  naira: ['El agua del oasis es fresca... cuando no hay escorpiones.', 'Las ruinas del templo, al noroeste, están llenas de gólems.'],
  farid: ['Vigilo las dunas día y noche.', 'Si la Marina desembarca, aquí sabremos recibirla.'],
  ixa: ['La selva habla a quien sabe escuchar.', 'Los murciélagos de la cueva del norte no son normales.'],
  kuno: ['Un tigre de la selva puede derribar a un toro.', 'Sus pieles valen oro en el Oasis de Sal.'],
  tika: ['¡Cuando sea mayor cazaré tigres como Kuno!', '¿Has visto piedras verdes? ¡Me encantan!'],
  lucas: ['Grillete no se arrodilla.', 'La Marina dice que trae orden. Trae impuestos.'],
  berta: ['En mi posada no se habla de política... salvo de Vidal.', 'Las fragatas blancas salen del Bastión cada mañana.'],
  ferro: ['Sirvo a la Marina... y a quien pague mejor.', 'Un cartel de "Se busca" puede perderse, si hay oro de por medio.'],
  brasa: ['La obsidiana no se doma: se convence.', 'Mi forja arde con el calor del volcán.'],
  osvaldo: ['Llevo treinta años en esta isla. El volcán me habla.', 'No pises la lava. Parece obvio, pero...'],
  marga: ['Un barco es tan fuerte como su casco.', 'Tráeme madera, hierro y pólvora y tu barco será la envidia del puerto.'],
  ramon: ['En mis tiempos los jabalíes eran más grandes.', 'Lucía es mi nieta. Trabaja más que nadie.'],
  mara: ['En Tortuga no hacemos preguntas.', 'Si buscas tesoros, la Isla Calavera está al sur de aquí... llena de huesos andantes.'],
  pepe: ['¡Algún día seré capitán!', 'Mara dice que limpie la cubierta. ¡Pero si no tenemos barco!'],
};

// Devuelve { text, options[] } según el estado del juego.
export function dialogFor(id, G) {
  const q = G.quest;
  const cur = questAt(q.stage, G);
  const opts = [];
  let text = null;
  const isGiver = cur && cur.giver === id;

  if (cur && cur.type === 'talk' && cur.target === id) {
    if (id === 'marisol') {
      text = `¡Bienvenido a Isla Bruma, ${G.player.name}! Soy Marisol, alcaldesa de Villarroca. Medio pueblo medieval, medio puerto pirata... y últimamente con problemas. Los lobos del Bosque Norte atacan a los viajeros. ¿Nos ayudas? Caza 3 y vuelve.`;
    } else if (id === 'nerea') {
      text = `¿Te manda Marisol? Soy la Capitana Nerea. Los cangrejos gigantes están destrozando las redes de la playa. Acaba con 4 y hablaremos de algo más... serio.`;
    } else text = cur.talkText || '¡Por fin llegas!';
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
      }[id] || cur.doneText || '¡Excelente trabajo!';
      if (cur.doneText) text = cur.doneText;
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

  // encargos secundarios
  const sq = SIDE_QUESTS[id];
  if (sq) {
    const st = G.side[id] || { s: 0, p: 0 };
    if (st.s === 0) opts.push({ label: `📜 Encargo: ${sq.title}`, action: () => G.ui.openDialog(G.npcById(id).name, `${sq.desc} Recompensa: ${sq.reward.gold} oro${sq.reward.item ? ' y ' + ITEMS[sq.reward.item].name : ''}.`, [{ label: '✔ Aceptar encargo', action: () => G.acceptSide(id) }, { label: 'Ahora no', action: null }]) });
    else if (st.s === 1) {
      const done = G.sideDone(id);
      if (done) opts.push({ label: `✔ Entregar: ${sq.title}`, action: () => G.completeSide(id) });
      else text = text || `${sq.desc} (${G.sideProgressText(id)})`;
    }
  }
  // tiendas y servicios
  const P = G.player;
  const B = G.bounty || 0;
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
  } else if (id === 'marga') {
    text = text || NPC_LINES.marga[0];
    opts.push({ label: '⚓ Astillero: mejorar y reparar', action: () => G.openShipyard() });
  } else if (id === 'selim') {
    text = text || NPC_LINES.selim[1];
    sell('bandana_roja', 80); sell('gorra_marinera', 120); sell('camisa_marinera', 150); sell('chaqueta_pirata', 380); sell('sombrero_capitan', 450);
    for (const id of ['c_sombrero_paja', 'c_turbante_azul', 'c_gorra_capitan', 'c_bandana_negra', 'c_chaleco_cuero', 'c_camisa_rayas', 'c_vestido_azul', 'c_capa_roja', 'c_capa_azul', 'c_mochila']) if (!G.ownCos(id)) sell(id, G.cosPrice(id).gold);
  } else if (id === 'zuri') {
    text = '¡Telas de los siete mares! Solo hoy, solo para ti.';
    for (const cid of G.zuriStock()) if (!G.ownCos(cid)) sell(cid, G.cosPrice(cid).gold);
  } else if (id === 'zaid' || id === 'naira') {
    if (id === 'zaid') { sell('ambar', 40); sell('potion', 14); }
  } else if (id === 'berta') {
    text = text || NPC_LINES.berta[Math.floor(Math.random() * 2)];
    sell('potion', 16); sell('f_meat', 14);
    opts.push({ label: '🍲 Guiso de la posada: curar todo (8 oro)', action: () => G.buy({ gold: 8 }, () => { P.hp = P.maxHp; G.toast('❤️ Salud al máximo'); }) });
  } else if (id === 'ferro') {
    if (G.isMarine()) text = text || `Recluta ${G.player.name}: tus méritos suman ${G.honor || 0}. Rango actual: ${G.bountyText()}. Sigue cazando piratas.`;
    else if (B > 0) text = text || `Antes aceptaba sobornos... pero un pirata de verdad no borra su recompensa: la lleva con orgullo. La tuya es de ${B} oro.`;
  } else if (id === 'brasa' || id === 'osvaldo') {
    if (id === 'brasa') opts.push({ label: '⚒️ Forjar equipo', action: () => G.panels.openCraft('forja') });
    if (id === 'osvaldo') sell('potion', 18);
  } else if (id === 'kuno') {
    sell('f_meat', 10);
  } else if (id === 'ilyas') {
    text = text || NPC_LINES.ilyas[0];
    sell('cloth', 6);
    sell('leather', 10);
    const mats = Object.entries(P.inv).filter(([k, n]) => n > 0 && ITEMS[k] && ITEMS[k].type === 'mat' && ITEMS[k].value > 0);
    const total = mats.reduce((a, [k, n]) => a + n * ITEMS[k].value, 0);
    opts.push({ label: `💰 Vender materiales (${total} oro)`, action: () => { if (!total) return G.toast('No tienes materiales'); for (const [k] of mats) P.inv[k] = 0; P.gold += total; G.sfx('coin'); G.toast(`+${total} oro`); } });
  }
  if (!text) {
    const lines = NPC_LINES[id] || ['...'];
    text = lines[Math.floor(Math.random() * lines.length)];
    if (!G.isMarine() && B >= 300 && Math.random() < 0.35 && id !== 'ferro') {
      text = [`Unos marines vinieron preguntando por ti... ofrecen ${B} de oro por tu cabeza. Yo no he dicho nada.`, `He visto tu cartel en el puerto: «SE BUSCA — ${B} oro». ¡Qué fama!`, `La Marina anda preguntando por ${G.player.name}. Si desembarcan aquí, te defenderemos.`][Math.floor(Math.random() * 3)];
    } else if (cur && cur.giver && cur.giver !== id && cur.type !== 'done') {
      // pista de la misión actual
      if (Math.random() < 0.5) text += ` (Misión: ${cur.desc})`;
    }
  }
  opts.push({ label: 'Adiós', action: null });
  return { text, options: opts };
}

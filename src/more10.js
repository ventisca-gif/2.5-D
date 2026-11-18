// v3.8: arqueología y reliquias, gremio de aventureros con rangos, mar helado en invierno, tu propio puerto pirata,
// concurso de barcos, amuletos de 3 gemas y la historia secreta de tu pareja.
import * as THREE from 'three';
import { makeIslet } from './regions.js';
import { T } from './world.js';
import { ITEMS } from './items.js';

export const RELICS = {
  reliquia_colmillo: { name: 'Colmillo del Kraken', icon: '🦷', fx: { atk: 1.08 }, desc: '+8% de daño' },
  reliquia_escudo: { name: 'Escudo del Rey Hundido', icon: '🛡', fx: { def: 1.1 }, desc: '+10% de defensa' },
  reliquia_corazon: { name: 'Corazón de Coral', icon: '❤️', fx: { hp: 1.1 }, desc: '+10% de vida máxima' },
  reliquia_reloj: { name: 'Reloj de Arena Eterno', icon: '⏳', fx: { xp: 1.12 }, desc: '+12% de experiencia' },
  reliquia_brujula: { name: 'Brújula de los Siete Mares', icon: '🧭', fx: { ship: 1.1 }, desc: '+10% de velocidad del barco' },
};
const GEMS = { ambar: ['atk', 0.03, 'del Fuego'], jade: ['hp', 0.04, 'de la Vida'], perla: ['xp', 0.04, 'de la Sabiduría'], obsidiana: ['def', 0.04, 'de la Roca'], cristal: ['atk', 0.025, 'del Hielo'], meteorito: ['all', 0.02, 'de las Estrellas'], coral: ['hp', 0.03, 'del Mar'] };
const ADV_RANKS = [['🥉 Bronce', 0], ['🥈 Plata', 100], ['🥇 Oro', 300], ['💎 Platino', 600], ['👑 Leyenda', 1000]];
const ADV_POOL = [
  { id: 'kills', txt: 'Vence a 60 enemigos', stat: (g) => g.stats.kills || 0, n: 60, pts: 40 },
  { id: 'boss', txt: 'Derrota a 2 jefes o piratas famosos', stat: (g) => (g.stats.famous || 0) + Object.keys(g.stats).filter((k) => /^k_(boss|golem_boss|marine_boss|serafin|dragon|abyss_queen|ghost_captain|reina_hielo|gran_automata|rey_pastel|sombra_abismo|guardian_errante)$/.test(k)).reduce((a, k) => a + g.stats[k], 0), n: 2, pts: 80 },
  { id: 'ships', txt: 'Hunde 6 barcos', stat: (g) => (g.stats.s_marine || 0) + (g.stats.s_pirate || 0), n: 6, pts: 50 },
  { id: 'beast', txt: 'Caza una bestia legendaria', stat: (g) => g.stats.beasts || 0, n: 1, pts: 90 },
  { id: 'relic', txt: 'Desentierra 3 hallazgos arqueológicos', stat: (g) => g.stats.digs || 0, n: 3, pts: 40 },
  { id: 'fish', txt: 'Pesca 10 peces', stat: (g) => Object.values(g.fishDex || {}).reduce((a, v) => a + v, 0), n: 10, pts: 30 },
  { id: 'tour', txt: 'Gana el torneo de tripulaciones', stat: (g) => g.stats.ctours || 0, n: 1, pts: 60 },
  { id: 'treasure', txt: 'Desentierra 2 tesoros', stat: (g) => g.stats.treasures || 0, n: 2, pts: 50 },
];
const PQ = [
  { title: 'Una carta sin remitente', txt: (n) => `${n} recibe una carta que le hace temblar: «Sé quién eres de verdad». Habla con Sombra, el contrabandista de Tortuga (de noche), para averiguar quién la envió.` },
  { title: 'Los cazadores del pasado', txt: (n) => `Unos cazarrecompensas buscan a ${n}. Vuelve con tu pareja y derrota a los que vengan a por ella o él.` },
  { title: 'El medallón perdido', txt: (n) => `${n} te confiesa que es heredero/a de una tripulación legendaria. Su medallón está enterrado: excava ruinas (arqueología) hasta encontrarlo.` },
  { title: 'El antiguo capitán', txt: (n) => `El Capitán Varek, que traicionó a la familia de ${n}, ha vuelto. Habla con tu pareja para enfrentaros juntos a él.` },
];
// puerto propio
export function makeOwnPort() {
  const R = makeIslet({ id: 'puerto_libre', name: 'Isla Libre', ox: 128, oz: 146, N: 40, seed: 333, dockDir: [-1, 0] });
  R.towns.push({ name: 'Tu puerto', x: R.center.x, z: R.center.z, r: 8 });
  R.reserve(R.center.x, R.center.z, 8);
  return R;
}
// puente de hielo entre Isla Escarcha e Isla Engranaje (solo en invierno)
export function makeIceBridge() {
  const X0 = 202, X1 = 208, Z0 = -37, Z1 = 39;
  const R = { kind: 'bridge', id: 'hielo', name: 'Puente de hielo', frozen: false };
  R.contains = (x, z) => x >= X0 && x <= X1 && z >= Z0 && z <= Z1;
  R.tile = () => (R.frozen ? T.SNOW : T.WATER);
  R.walkable = () => R.frozen;
  R.setBlocked = () => {};
  R.groundY = () => 0;
  R.areaName = () => 'Puente de hielo';
  R.X0 = X0; R.X1 = X1;
  return R;
}

export function installMore10(Game, D) {
  const P = Game.prototype;
  const sfx = D.sfx;

  // ============================================================ efectos de reliquias y amuletos
  P.passiveMul = function (k) {
    let m = 1;
    for (const id of this.relics || []) { const f = RELICS[id] && RELICS[id].fx[k]; if (f) m *= f; }
    const A = this.amuletEq !== undefined && (this.amulets || [])[this.amuletEq];
    if (A) m *= 1 + (A.fx[k] || 0) + (A.fx.all || 0);
    return m;
  };
  const baseBuff = P.buffMul;
  P.buffMul = function (k) { return baseBuff.call(this, k) * (k === 'atk' || k === 'def' || k === 'xp' ? this.passiveMul(k) : 1); };
  const baseJobHp = P.jobHp;
  P.jobHp = function () { return (baseJobHp ? baseJobHp.call(this) : 1) * this.passiveMul('hp'); };
  const baseShip = P.shipStats;
  P.shipStats = function () { const s = baseShip.call(this); s.speed *= this.passiveMul('ship'); return s; };

  // ============================================================ arqueología
  P.digSites = function () {
    if (this.digs && this.digs.day === this.day) return this.digs.list;
    const isles = this.islets.filter((r) => !r.ghost && !r.portal && r.spawns.length);
    const list = [];
    let seed = this.day * 7919 + 17; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 6 && isles.length; i++) {
      const R = i < 2 ? null : isles[Math.floor(rnd() * isles.length)];
      const cx = R ? R.center.x : 50, cz = R ? R.center.z : 50, rad = R ? 14 : 30;
      for (let k = 0; k < 40; k++) { const x = Math.round(cx + (rnd() - 0.5) * rad * 2), z = Math.round(cz + (rnd() - 0.5) * rad * 2); if (this.W.walkable(x, z) && !this.roomAt(x, z)) { list.push({ x, z, done: false, isle: R ? R.name : 'Isla Bruma' }); break; } }
    }
    if (this.digs && this.digs.meshes) for (const m of this.digs.meshes) this.scene.remove(m);
    const meshes = list.map((s) => { const g = new THREE.Group(); const mound = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.25, 8), new THREE.MeshLambertMaterial({ color: 0x8a6a44 })); mound.position.y = 0.12; g.add(mound); for (const r of [0.6, -0.6]) { const x = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.03, 0.08), new THREE.MeshBasicMaterial({ color: 0xc8302a })); x.rotation.y = r; x.position.y = 0.26; g.add(x); } g.position.set(s.x, 0, s.z); this.scene.add(g); s.mesh = g; return g; });
    this.digs = { day: this.day, list, meshes };
    return list;
  };
  P.digNear = function () { const p = this.player; return this.digSites().find((s) => !s.done && Math.hypot(s.x - p.x, s.z - p.z) < 1.6) || null; };
  P.excavate = function (s) {
    const p = this.player;
    if (!p.inv.pala) return this.toast('⛏ Necesitas una pala (la vende el Herrero Tadeo o Velaria)');
    if (this.digging) return;
    this.digging = true; p.path = []; p.st.gather = 1;
    this.toast('⛏ Excavas con cuidado...');
    setTimeout(() => {
      this.digging = false; p.st.gather = 0;
      s.done = true; if (s.mesh) s.mesh.visible = false;
      this.stats.digs = (this.stats.digs || 0) + 1;
      const r = Math.random();
      const pq = this.pqState();
      if (pq && pq.s === 2) { pq.s = 3; this.toast('🏅 ¡Has encontrado el medallón de la familia de tu pareja!', 'area'); sfx('quest'); return; }
      if (r < 0.3) { const ids = Object.keys(RELICS).filter((k) => !this.player.inv[k] && !(this.relics || []).includes(k)); const id = ids.length ? ids[Math.floor(Math.random() * ids.length)] : null; if (id) { this.give(id, 1); this.toast(`🗿 ¡Reliquia antigua: ${RELICS[id].icon} ${RELICS[id].name}! (${RELICS[id].desc}) Actívala en la Mochila`, 'area'); sfx('level'); return; } }
      if (r < 0.6) { const gem = ['ambar', 'jade', 'perla', 'obsidiana', 'cristal', 'coral'][Math.floor(Math.random() * 6)]; this.give(gem, 2, s.x, s.z); this.toast(`💎 Encuentras gemas: 2 × ${ITEMS[gem].name}`); }
      else if (r < 0.85) { const g = 150 + Math.floor(Math.random() * 300) + p.level * 5; p.gold += g; this.toast(`🪙 Monedas antiguas: +${g} oro`); }
      else { this.give('mapa_tesoro' in ITEMS ? 'bone' : 'stone', 2, s.x, s.z); this.toast('🦴 Solo huesos viejos...'); }
      this.jobXp('minero', 30);
      sfx('mine');
    }, 2200);
  };
  P.toggleRelic = function (id) {
    this.relics = this.relics || [];
    const i = this.relics.indexOf(id);
    if (i >= 0) { this.relics.splice(i, 1); this.player.inv[id] = (this.player.inv[id] || 0) + 1; this.toast(`🗿 Guardas ${RELICS[id].name}`); }
    else {
      if (this.relics.length >= 2) return this.toast('Solo puedes llevar 2 reliquias activas');
      if (!this.player.inv[id]) return;
      this.player.inv[id]--; this.relics.push(id);
      this.toast(`🗿 ${RELICS[id].icon} ${RELICS[id].name} activa: ${RELICS[id].desc}`);
    }
    this.player.recalc();
  };

  // ============================================================ gremio de aventureros
  P.advState = function () {
    const wk = Math.floor(this.day / 7);
    this.adv = this.adv || { pts: 0 };
    if (this.adv.wk !== wk) {
      let seed = wk * 31 + 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      const pool = [...ADV_POOL]; const list = [];
      while (list.length < 3) list.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
      this.adv.wk = wk;
      this.adv.list = list.map((m) => ({ id: m.id, base: m.stat(this), done: false }));
    }
    return this.adv;
  };
  P.advRank = function () { const pts = this.advState().pts; let r = 0; ADV_RANKS.forEach(([, v], i) => { if (pts >= v) r = i; }); return r; };
  P.advMenu = function () {
    const A = this.advState(), r = this.advRank();
    const lines = A.list.map((m) => { const def = ADV_POOL.find((k) => k.id === m.id), prog = Math.min(def.n, def.stat(this) - m.base); return `${m.done ? '✅' : prog >= def.n ? '🎁' : '▫️'} ${def.txt} (${prog}/${def.n}) · ${def.pts} pts`; });
    const next = ADV_RANKS[r + 1];
    const opts = A.list.map((m, i) => { const def = ADV_POOL.find((k) => k.id === m.id); return !m.done && def.stat(this) - m.base >= def.n ? { label: `🎁 Entregar: ${def.txt}`, action: () => this.advClaim(i) } : null; }).filter(Boolean);
    opts.push({ label: 'Cerrar', action: null });
    this.ui.openDialog(`⚔️ Gremio de aventureros · ${ADV_RANKS[r][0]}`, `Puntos: ${A.pts}${next ? ` (siguiente rango: ${next[0]} con ${next[1]})` : ''}<br>Misiones de esta semana:<br>${lines.join('<br>')}`, opts);
  };
  P.advClaim = function (i) {
    const A = this.advState(), m = A.list[i], def = ADV_POOL.find((k) => k.id === m.id);
    if (m.done) return;
    const r0 = this.advRank();
    m.done = true; A.pts += def.pts;
    const p = this.player, gold = def.pts * 30;
    p.gold += gold; this.give('ficha', Math.ceil(def.pts / 20));
    this.toast(`⚔️ Misión del gremio cumplida: +${def.pts} pts, +${gold} oro`, 'area');
    const r1 = this.advRank();
    if (r1 > r0) { this.toast(`🏅 ¡Asciendes en el gremio a ${ADV_RANKS[r1][0]}! +${r1 * 2000} oro`, 'area'); p.gold += r1 * 2000; if (r1 >= 3 && !this.ownCos('c_capa_gremio')) this.give('c_capa_gremio'); }
    sfx('quest');
    this.advMenu();
  };
  P.npcOrla = function () {
    if (this.npcById('orla')) return;
    const n = new D.NPC(this, { id: 'orla', name: 'Gremialista Orla', x: 46, z: 86, wander: 1, look: { shirt: 0x2a4a6a, pants: 0x2a2a2a, coat: true, trim: 0xd8a838, hair: 0xb04a2a, longHair: true, skin: 0xf0c49a, sword: true, female: true, hat: 'tricorn', capColor: 0x2a2a2a } });
    n.baseLevel = 70; n.setStats(70);
    this.npcs.push(n);
  };

  // ============================================================ mar helado en invierno
  P.updateIce = function () {
    const R = this.iceBridge; if (!R) return;
    const want = this.season() === 3;
    if (want === R.frozen) return;
    R.frozen = want;
    // las orillas de las dos islas también se hielan en esa franja
    for (const id of ['escarcha', 'engranaje']) {
      const I = this.islets.find((r) => r.id === id); if (!I) continue;
      I.iceTiles = I.iceTiles || [];
      if (want) { for (let z = I.oz; z < I.oz + I.N; z++) for (let x = R.X0; x <= R.X1; x++) if (I.contains(x, z) && I.tile(x, z) === T.WATER) { I.setTile(x, z, T.SNOW); I.iceTiles.push([x, z]); } }
      else { for (const [x, z] of I.iceTiles) I.setTile(x, z, T.WATER); I.iceTiles = []; }
    }
    if (!this.iceMesh) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(R.X1 - R.X0 + 1, 0.12, 150), new THREE.MeshLambertMaterial({ color: 0xdff2ff, transparent: true, opacity: 0.92 }));
      m.position.set((R.X0 + R.X1) / 2, 0.02, 1); this.scene.add(m); this.iceMesh = m;
      const g = new THREE.Group();
      for (let i = 0; i < 30; i++) { const c = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.4, 0), m.material); c.position.set(R.X0 - 0.5 + (i % 2) * (R.X1 - R.X0 + 1), 0.15, -70 + i * 5); g.add(c); }
      m.add(g); g.position.set(-(R.X0 + R.X1) / 2, 0, -1);
    }
    this.iceMesh.visible = want;
    if (want) this.toast('❄️ El invierno congela el mar: hay un puente de hielo entre Isla Escarcha e Isla Engranaje', 'area');
  };

  // ============================================================ tu propio puerto
  const PORT_LV = [
    { cost: { gold: 10000 }, txt: 'Carta de fundación' },
    { cost: { gold: 4000, wood: 40, stone: 30 }, txt: 'Taberna (te cura y te da +XP)' },
    { cost: { gold: 8000, wood: 60, stone: 50, iron: 10 }, txt: 'Mercado (vende pociones y materiales)' },
    { cost: { gold: 14000, wood: 80, stone: 80, iron: 20 }, txt: 'Astillero (repara el barco gratis)' },
    { cost: { gold: 25000, stone: 120, iron: 40 }, txt: 'Fortaleza (más impuestos y defensa)' },
  ];
  P.portLevel = function () { return this.flags.portLv || 0; };
  P.portMenu = function () {
    const L = this.portLevel(), opts = [];
    if (L < 5) { const n = PORT_LV[L]; opts.push({ label: `🏗 ${L ? 'Construir' : 'Fundar'}: ${n.txt} (${Object.entries(n.cost).map(([k, v]) => v + ' ' + (k === 'gold' ? 'oro' : (ITEMS[k] || {}).name || k)).join(', ')})`, action: () => this.buy({ ...n.cost }, () => { this.flags.portLv = L + 1; if (!this.flags.portDay) this.flags.portDay = this.day; this.buildPort(); this.toast(`🏴 ¡${L ? n.txt + ' construida' : 'Has fundado tu propio puerto en la Isla Libre'}!`, 'area'); sfx('quest'); }) }); }
    if (L >= 1) { const days = this.day - (this.flags.portDay || this.day); const gold = days * L * 300; opts.push({ label: `💰 Cobrar impuestos (${gold} oro)`, action: () => { this.player.gold += gold; this.flags.portDay = this.day; this.toast(`💰 +${gold} oro de tu puerto`); sfx('coin'); } }); }
    if (L >= 2) opts.push({ label: '🍺 Taberna: descansar', action: () => { const p = this.player; p.hp = p.maxHp; p.stamina = p.maxSt; for (const n of this.crew()) if (n.cmax) n.chp = n.cmax; this.addBuff('descanso', 600); this.toast('🍺 Tu tripulación y tú descansáis en vuestra taberna'); } });
    if (L >= 3) { opts.push({ label: '🍶 Mercado: poción (6 oro)', action: () => this.buy({ gold: 6 }, () => this.give('potion', 1)) }); opts.push({ label: '🪵 Mercado: 10 madera (40 oro)', action: () => this.buy({ gold: 40 }, () => this.give('wood', 10)) }); }
    if (L >= 4) opts.push({ label: '⚓ Astillero: reparar el barco gratis', action: () => { const b = this.boat; b.hp = this.shipStats().maxHp; this.toast('⚓ Barco reparado'); } });
    opts.push({ label: 'Cerrar', action: null });
    this.ui.openDialog(`🏴 ${L ? 'Tu puerto · nivel ' + L + '/5' : 'Isla Libre'}`, L ? `Habitantes: ${L * 8}. Impuestos: ${L * 300} oro al día.` : 'Una isla sin dueño... Con una carta de fundación puede ser tu puerto pirata.', opts);
  };
  P.buildPort = function () {
    const R = this.ownPort; if (!R) return;
    if (this.portGroup) this.scene.remove(this.portGroup);
    const L = this.portLevel(); if (!L) return;
    const g = new THREE.Group(), { x: cx, z: cz } = R.center;
    const M = (c) => new THREE.MeshLambertMaterial({ color: c });
    const house = (x, z, w, d, h, wall, roof) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(wall)); b.position.set(x, h / 2, z); g.add(b); const r = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.8, h * 0.7, 4), M(roof)); r.rotation.y = Math.PI / 4; r.position.set(x, h + h * 0.35, z); g.add(r); for (let dx = -Math.floor(w / 2); dx <= Math.floor(w / 2); dx++) for (let dz = -Math.floor(d / 2); dz <= Math.floor(d / 2); dz++) R.setBlocked(Math.round(x + dx), Math.round(z + dz), 1); };
    const flag = new THREE.Group(); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.5, 6), M(0x5a3a1a)); pole.position.y = 1.75; flag.add(pole);
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshLambertMaterial({ color: 0x111111, side: THREE.DoubleSide })); cloth.position.set(0.6, 3.1, 0); flag.add(cloth);
    const skull = new THREE.Mesh(new THREE.CircleGeometry(0.18, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })); skull.position.set(0.6, 3.15, 0.01); flag.add(skull);
    flag.position.set(cx, 0, cz); g.add(flag); R.setBlocked(cx, cz, 1);
    if (L >= 1) { house(cx - 4, cz - 3, 3, 3, 1.5, 0x8a6a44, 0x3a2a1a); house(cx + 4, cz - 3, 3, 3, 1.5, 0x9a7a54, 0x5a2a1a); }
    if (L >= 2) house(cx - 4, cz + 4, 4, 3, 1.8, 0xb88a54, 0x8a2a2a);
    if (L >= 3) { for (let i = 0; i < 3; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(1, 0.8, 0.8), M(0x7a5232)); st.position.set(cx + 2 + i * 1.4, 0.4, cz + 4); g.add(st); const aw = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.9), M([0xe03a4a, 0x3a8ae0, 0xe0b040][i])); aw.position.set(cx + 2 + i * 1.4, 1.3, cz + 4); g.add(aw); R.setBlocked(cx + 2 + i * 1.4, cz + 4, 1); } }
    if (L >= 4) house(cx + 6, cz + 1, 3, 4, 2, 0x6a5a4a, 0x2a4a6a);
    if (L >= 5) { for (const [dx, dz] of [[-7, -7], [7, -7], [-7, 7], [7, 7]]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 3.2, 10), M(0x8a8a8a)); t.position.set(cx + dx, 1.6, cz + dz); g.add(t); R.setBlocked(cx + dx, cz + dz, 1); } }
    this.scene.add(g); this.portGroup = g;
  };
  P.portNear = function () { const R = this.ownPort, p = this.player; return R && !this.sailing && Math.hypot(p.x - R.center.x, p.z - R.center.z) < 2.6; };

  // ============================================================ concurso de barcos
  P.shipContest = function () {
    const wk = Math.floor(this.day / 7);
    if (this.flags.contestWk === wk) return this.toast('El concurso de barcos ya se celebró esta semana');
    const u = this.shipUp || {};
    const deco = (this.shipDecor || []).length;
    const score = Math.round(20 + deco * 6 + (this.flagCfg ? 15 : 0) + (u.hull + u.cannons + u.sails + u.size) * 5 + (this.shipTypeId && this.shipTypeId !== 'balandra' ? 15 : 0) + (this.clan ? 5 : 0) + Math.random() * 10);
    let seed = wk * 97 + 3; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const rivals = ['La Sirena Dorada', 'El Tiburón Gris', 'La Perla del Sur'].map((n) => ({ name: n, s: Math.round(35 + rnd() * 45) }));
    const tab = [...rivals, { name: `Tu barco (${this.player.name})`, s: score, me: true }].sort((a, b) => b.s - a.s);
    const pos = tab.findIndex((r) => r.me) + 1;
    this.flags.contestWk = wk;
    const gold = [3000, 1500, 600, 100][pos - 1];
    this.player.gold += gold;
    if (pos === 1) { this.give('ficha', 8); this.stats.contests = (this.stats.contests || 0) + 1; }
    this.ui.openDialog('🏆 Concurso de barcos', `Los vecinos votan según la decoración del camarote (${deco} muebles), la bandera, las mejoras y el tipo de barco:<br>${tab.map((r, i) => `${i + 1}. ${r.me ? '<b>' + r.name + '</b>' : r.name} · ${r.s} votos`).join('<br>')}<br><br>Premio: ${gold} oro${pos === 1 ? ' y 8 🎟' : ''}`, [{ label: '¡Vale!', action: null }]);
    sfx(pos === 1 ? 'quest' : 'coin');
  };

  // ============================================================ amuletos de 3 gemas
  P.amuletMenu = function (picked = []) {
    const p = this.player;
    const have = Object.keys(GEMS).filter((k) => (p.inv[k] || 0) - picked.filter((x) => x === k).length > 0);
    if (picked.length === 3) return this.forgeAmulet(picked);
    if (!have.length) return this.toast('💎 Necesitas gemas: ámbar, jade, perla, obsidiana, cristal, meteorito o coral');
    this.ui.openDialog(`💎 Engarzar amuleto (${picked.length}/3)`, `Elige la gema ${picked.length + 1}: ${picked.map((k) => ITEMS[k].icon).join(' ')}<br>Tres iguales crean un amuleto puro (+50%). Cuesta 500 oro.`, [
      ...have.map((k) => ({ label: `${ITEMS[k].icon} ${ITEMS[k].name} (${GEMS[k][0] === 'all' ? 'todo' : GEMS[k][0]} +${Math.round(GEMS[k][1] * 100)}%)`, action: () => this.amuletMenu([...picked, k]) })),
      { label: 'Cancelar', action: null },
    ]);
  };
  P.forgeAmulet = function (gems) {
    this.buy({ gold: 500 }, () => {
      const p = this.player;
      for (const k of gems) p.inv[k]--;
      const fx = {}, pure = gems.every((k) => k === gems[0]);
      for (const k of gems) { const [stat, v] = GEMS[k]; fx[stat] = (fx[stat] || 0) + v * (pure ? 1.5 : 1); }
      const main = gems.reduce((a, k) => (gems.filter((x) => x === k).length > gems.filter((x) => x === a).length ? k : a), gems[0]);
      const A = { name: `Amuleto${pure ? ' puro' : ''} ${GEMS[main][2]}`, gems: gems.map((k) => ITEMS[k].icon).join(''), fx };
      this.amulets = this.amulets || []; this.amulets.push(A);
      if (this.amuletEq === undefined) this.amuletEq = this.amulets.length - 1;
      p.recalc();
      this.toast(`💎 ¡Has creado el ${A.name} ${A.gems}! (${this.amuletText(A)})`, 'area');
      sfx('level');
    });
  };
  P.amuletText = function (A) { const N = { atk: 'daño', def: 'defensa', hp: 'vida', xp: 'experiencia', all: 'todo' }; return Object.entries(A.fx).map(([k, v]) => `${N[k]} +${Math.round(v * 100)}%`).join(', '); };
  P.amuletList = function () {
    const L = this.amulets || [];
    if (!L.length) return this.toast('Aún no tienes amuletos');
    this.ui.openDialog('💎 Tus amuletos', 'Elige cuál llevar (solo uno a la vez).', [...L.map((A, i) => ({ label: `${i === this.amuletEq ? '✔ ' : ''}${A.gems} ${A.name} · ${this.amuletText(A)}`, action: () => { this.amuletEq = i; this.player.recalc(); this.toast(`💎 Llevas el ${A.name}`); } })), { label: 'Cerrar', action: null }]);
  };

  // ============================================================ historia secreta de la pareja
  P.pqState = function () { const pt = this.partner(); if (!pt) return null; const s = this.soc(pt.id); s.pq = s.pq || { s: 0 }; return s.pq; };
  P.partnerQuestOpt = function (n, opts) {
    const s = this.soc(n.id); if (!s.partner) return;
    const q = this.pqState();
    if (q.s >= 5) return;
    if (q.s === 0) { if ((s.f || 0) >= 90) opts.push({ label: '💌 Algo le preocupa...', action: () => { q.s = 1; this.ui.openDialog(n.name, PQ[0].txt(n.name), [{ label: 'Te ayudaré', action: null }]); } }); return; }
    if (q.s === 1) { opts.push({ label: `📜 ${PQ[0].title}`, action: () => this.ui.openDialog(n.name, PQ[0].txt(n.name), [{ label: 'Voy', action: null }]) }); return; }
    if (q.s === 2 && !q.ambush) { opts.push({ label: `⚔️ ${PQ[1].title}`, action: () => this.pqAmbush(n) }); return; }
    if (q.s === 2 && q.ambush) { opts.push({ label: `🏅 ${PQ[2].title}`, action: () => this.ui.openDialog(n.name, PQ[2].txt(n.name), [{ label: 'Buscaré el medallón', action: null }]) }); return; }
    if (q.s === 3) { opts.push({ label: `👑 ${PQ[3].title}`, action: () => this.pqFinal(n) }); return; }
  };
  P.pqAmbush = function (n) {
    const p = this.player, q = this.pqState();
    this.ui.openDialog(n.name, PQ[1].txt(n.name), [{ label: '⚔️ ¡Que vengan!', action: () => {
      const temps = [];
      for (let i = 0; i < 4; i++) for (let k = 0; k < 20; k++) { const x = p.tx + Math.round((Math.random() - 0.5) * 8), z = p.tz + Math.round((Math.random() - 0.5) * 8); if (this.W.walkable(x, z) && Math.hypot(x - p.x, z - p.z) > 3) { const e = this.spawnTemp('pirate', x, z, Math.max(10, p.level)); e.provoked = true; e.state = 'chase'; temps.push(e); break; } }
      this.pqFight = { temps, after: () => { q.ambush = true; this.toast(`💪 ¡Habéis vencido a los cazadores! ${n.name} te cuenta su secreto`, 'area'); this.ui.openDialog(n.name, PQ[2].txt(n.name), [{ label: 'Buscaré el medallón', action: null }]); } };
      this.toast('⚔️ ¡Los cazadores atacan!', 'area');
    } }]);
  };
  P.pqFinal = function (n) {
    const p = this.player, q = this.pqState();
    let sp = null; for (let k = 0; k < 30 && !sp; k++) { const x = p.tx + Math.round((Math.random() - 0.5) * 8), z = p.tz + Math.round((Math.random() - 0.5) * 8); if (this.W.walkable(x, z) && Math.hypot(x - p.x, z - p.z) > 3) sp = { x, z }; }
    if (!sp) return this.toast('Busca un sitio más abierto');
    const e = this.spawnTemp('marine_boss', sp.x, sp.z, Math.min(350, p.level + 3));
    e.maxHp = Math.round(e.maxHp * 0.6); e.hp = e.maxHp; e.provoked = true; e.state = 'chase';
    e.label.nm.textContent = `Capitán Varek · Nv. ${e.level}`;
    this.pqFight = { temps: [e], after: () => {
      q.s = 5;
      const s = this.soc(n.id); s.loyal = true; s.f = 100;
      if (!this.ownCos('c_anillo_destino')) this.give('c_anillo_destino');
      this.title = 'Corazón valiente'; this.applyTitle && this.applyTitle();
      if (this.crewMemory) this.crewMemory(n, 'Derrotamos juntos al Capitán Varek. Por fin soy libre... gracias a ti.');
      this.ui.openDialog(n.name, `Varek ha caído... Por fin puedo dejar atrás mi pasado. Toma: el Anillo del destino de mi familia. Ahora es tuyo, como mi corazón.`, [{ label: '💖', action: () => this.coupleAct(n, 'kiss') }]);
      this.toast('💖 Historia de tu pareja completada: Anillo del destino, título «Corazón valiente» y lealtad total', 'area');
      sfx('quest');
    } };
    this.toast('👑 ¡El Capitán Varek aparece!', 'area');
  };
  P.updatePQ = function () {
    const F = this.pqFight;
    if (!F) return;
    if (this.player.dead) { for (const e of F.temps) if (!e.removed) e.remove(); this.pqFight = null; this.purgeTemps(); return; }
    if (F.temps.every((e) => e.dead || e.removed)) { this.pqFight = null; F.after(); }
  };

  // ============================================================ enganches
  P.npcDialog10 = function (id, opts) {
    if (id === 'orla') { opts.push({ label: '⚔️ Misiones del gremio', action: () => this.advMenu() }); return `Rango actual: ${ADV_RANKS[this.advRank()][0]}. Cada semana hay 3 misiones nuevas.`; }
    if (id === 'tadeo' || id === 'helga') { opts.push({ label: '💎 Engarzar amuleto (3 gemas)', action: () => this.amuletMenu() }); if (this.amulets && this.amulets.length) opts.push({ label: '💎 Elegir amuleto', action: () => this.amuletList() }); }
    if (id === 'tadeo' && !this.player.inv.pala) opts.push({ label: '⛏ Pala de arqueólogo (300 oro)', action: () => this.buy({ gold: 300 }, () => { this.give('pala', 1); this.toast('⛏ ¡Ya puedes excavar en los montículos con una X roja!'); }) });
    if (id === 'nerea') opts.push({ label: '🏆 Concurso de barcos (1 a la semana)', action: () => this.shipContest() });
    if (id === 'sombra') { const q = this.pqState(); if (q && q.s === 1) opts.push({ label: '📜 Preguntar por la carta', action: () => { q.s = 2; this.ui.openDialog('Contrabandista Sombra', 'La carta... la mandó el Capitán Varek. Busca a tu pareja: sus cazadores ya van de camino.', [{ label: 'Gracias', action: null }]); } }); }
    const n = this.npcById(id); if (n) this.partnerQuestOpt(n, opts);
    return null;
  };
  P.contextAction10 = function () {
    if (this.sailing) return null;
    const d = this.digNear(); if (d) return { icon: '⛏', label: 'Excavar', fn: () => this.excavate(d) };
    if (this.portNear()) return { icon: '🏴', label: 'Mi puerto', fn: () => this.portMenu() };
    return null;
  };
  P.updateMore10 = function (dt) {
    this.npcOrla();
    this.m10T = (this.m10T || 0) - dt;
    if (this.m10T <= 0) { this.m10T = 1; this.digSites(); this.updateIce(); if (!this.portBuilt) { this.portBuilt = true; this.buildPort(); } }
    this.updatePQ();
  };
  P.newsHtml10 = function () {
    const q = this.pqState();
    return `<div class="sub">🆕 v3.8</div><ul class="qlist">
      <li>⛏ <b>Arqueología</b>: compra una pala a Tadeo y excava los montículos con una X roja (6 cada día). Reliquias activas: ${(this.relics || []).map((k) => RELICS[k].icon + ' ' + RELICS[k].name).join(', ') || 'ninguna'}.</li>
      <li>⚔️ <b>Gremio de aventureros</b> (Gremialista Orla, Puerto Salitre): ${ADV_RANKS[this.advRank()][0]} · ${this.advState().pts} pts.</li>
      <li>❄️ <b>Mar helado</b>: en invierno se forma un puente de hielo entre Escarcha y Engranaje. ${this.iceBridge && this.iceBridge.frozen ? '<b>¡Ahora está helado!</b>' : ''}</li>
      <li>🏴 <b>Tu puerto</b> en la Isla Libre (sureste del mar): nivel ${this.portLevel()}/5.</li>
      <li>🏆 <b>Concurso de barcos</b> semanal con Nerea.</li>
      <li>💎 <b>Amuletos</b>: ${(this.amulets || []).length} creados${this.amuletEq !== undefined && this.amulets && this.amulets[this.amuletEq] ? ' · llevas ' + this.amulets[this.amuletEq].name : ''}.</li>
      <li>💖 <b>Historia de tu pareja</b>: ${q ? (q.s >= 5 ? 'completada' : `capítulo ${Math.max(1, Math.min(4, q.s))}/4`) : 'necesitas pareja (y 5 corazones)'}.</li></ul>`;
  };
}

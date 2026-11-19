// v5.6: buceo libre en mar abierto, volcán que despierta (evacuar Isla Ceniza), gremio de ladrones (sigilo de noche),
// peces legendarios y concurso semanal de pesca, nuevos puestos en el barco (vigía, pescador, tesorero), aventuras con la
// pareja, ciudad mercante flotante, duelos de capitanes, colección de banderas y Templo de las Pruebas.
import * as THREE from 'three';
import { T } from './world.js';
import { ITEMS } from './items.js';
import { CREW_JOBS } from './more2.js';
import { FAMOUS } from './life.js';

CREW_JOBS.vigia = { name: 'Vigía', icon: '🔭', desc: 'Avisa de barcos enemigos y monstruos marinos' };
CREW_JOBS.pesca = { name: 'Pescador de a bordo', icon: '🎣', desc: 'Pesca solo mientras navegas' };
CREW_JOBS.tesorero = { name: 'Tesorero', icon: '💰', desc: '+10% de oro de los enemigos' };

// ---------------------------------------------------------------- regiones
const SX0 = 7000, SZ0 = 0, SW = 26, SD = 20;
export function makeOpenSea() {
  const inb = (lx, lz) => lx >= 0 && lz >= 0 && lx < SW && lz < SD;
  const R = { kind: 'dungeon', id: 'mar_abierto', name: 'Fondo del mar', underwater: true, X: SX0, Z: SZ0, exit: { x: SX0 + 2, z: SZ0 + 10 }, spawns: [], rocks: new Set() };
  R.contains = (x, z) => x >= SX0 - 1 && x <= SX0 + SW && z >= SZ0 - 1 && z <= SZ0 + SD;
  R.tile = (x, z) => (inb(x - SX0, z - SZ0) ? T.SAND : T.WATER);
  R.walkable = (x, z) => inb(x - SX0, z - SZ0) && !R.rocks.has(x + ',' + z);
  R.setBlocked = () => {}; R.groundY = () => 0; R.areaName = () => 'Fondo del mar';
  return R;
}
const TX0 = 7200, TZ0 = 0, TW = 18, TD = 14;
export function makeTrialTemple() {
  const inb = (lx, lz) => lx >= 0 && lz >= 0 && lx < TW && lz < TD;
  const R = { kind: 'dungeon', id: 'templo_pruebas', name: 'Templo de las Pruebas', X: TX0, Z: TZ0, exit: { x: TX0 + 1, z: TZ0 + 7 }, center: { x: TX0 + 9, z: TZ0 + 7 }, spawns: [] };
  const pillar = (lx, lz) => (lx === 4 || lx === 13) && (lz === 3 || lz === 10);
  R.contains = (x, z) => x >= TX0 - 1 && x <= TX0 + TW && z >= TZ0 - 1 && z <= TZ0 + TD;
  R.tile = (x, z) => (inb(x - TX0, z - TZ0) ? T.STONE : T.WATER);
  R.walkable = (x, z) => inb(x - TX0, z - TZ0) && !pillar(x - TX0, z - TZ0);
  R.setBlocked = () => {}; R.groundY = () => 0; R.areaName = () => 'Templo de las Pruebas';
  return R;
}

const LEG_FISH = { main: 'Carpa Real de la Bruma', tortuga: 'Tortuga Dorada Milenaria', calavera: 'Pez Calavera Negro', duna: 'Pez Arena de Cristal', selva: 'Piraña Esmeralda Gigante', bastion: 'Esturión de la Marina', ceniza: 'Pez Brasa', escarcha: 'Bacalao de Hielo Eterno', mar: 'Pez Luna Abisal' };
const STORIES = [
  { dock: 'tortuga', title: 'La cala escondida', text: 'Encontráis una cala secreta. Os sentáis en la arena y contáis las estrellas hasta perder la cuenta.' },
  { dock: 'duna', title: 'Bajo las palmeras', text: 'Un oasis diminuto entre las dunas. Compartís agua fresca y os prometéis volver cada verano.' },
  { dock: 'selva', title: 'El árbol de los nombres', text: 'Grabáis vuestras iniciales en el tronco de un árbol gigante. Los monos os miran con curiosidad.' },
  { dock: 'calavera', title: 'Fantasmas y risas', text: 'Un fantasma os asusta... y acabáis riendo tan fuerte que el fantasma se ofende y desaparece.' },
  { dock: 'ceniza', title: 'Atardecer de fuego', text: 'Veis el atardecer sobre el volcán. El cielo es rojo, naranja y morado, como un cuadro.' },
  { dock: 'bastion', title: 'La carta en la botella', text: 'Escribís juntos una carta, la metéis en una botella y la lanzáis al mar para alguien del futuro.' },
];
const FLOAT_POS = [{ x: -80, z: 210 }, { x: 120, z: -80 }, { x: 240, z: 60 }, { x: 150, z: 235 }, { x: -95, z: 0 }];
const FLOAT_STOCK = [
  ['nucleo_estelar', 1, 40000], ['escama_leyenda', 1, 20000], ['huevo_dragon_real', 1, 90000], ['fragmento_eclipse', 5, 15000], ['ambar_gris', 2, 8000],
  ['perla', 10, 6000], ['esencia_titan', 1, 25000], ['c_capa_mercader', 1, 60000], ['pocion_mayor', 10, 3000], ['cristal_hielo', 5, 4000],
];
const BANNERS = {
  marina: { name: 'Bandera de la Marina', col: '#f4f4f8', emb: '⚓', types: ['marine', 'marine_boss'] },
  piratas: { name: 'Bandera corsaria', col: '#1a1a1a', emb: '☠', types: ['pirate'] },
  esqueletos: { name: 'Bandera de los huesos', col: '#d8d0b0', emb: '💀', types: ['skeleton', 'skull', 'crypt_king'] },
  fantasmas: { name: 'Bandera espectral', col: '#3a6a6a', emb: '👻', types: ['marinero_fantasma', 'ghost_captain', 'almirante_muerto'] },
  dragones: { name: 'Bandera del dragón', col: '#a82a1a', emb: '🐉', types: ['dragon', 'dragon_menor', 'dragon_salvaje', 'wyvern', 'dragon_ancestral'] },
  vacio: { name: 'Bandera del Vacío', col: '#2a0a4a', emb: '🌑', types: ['centinela_vacio', 'devorador_estelar', 'caballero_vacio', 'nihil'] },
  bestias: { name: 'Bandera de las bestias', col: '#6a4a2a', emb: '🐺', types: ['wolf', 'tiger', 'boar', 'lobo_nieve', 'lobo_ancestral'] },
};
const TRIALS = [
  { rule: 'pociones', name: 'Sala sin pociones', txt: 'No puedes beber ron curativo.' },
  { rule: 'oscuras', name: 'Sala a oscuras', txt: 'Solo ves lo que tienes cerca.' },
  { rule: 'reloj', name: 'Sala del reloj', txt: 'Vence a todos en 45 segundos.' },
  { rule: 'fragil', name: 'Sala de cristal', txt: 'Recibes el doble de daño.' },
  { rule: 'veloces', name: 'Sala del viento', txt: 'Los enemigos son mucho más rápidos.' },
  { rule: 'solo', name: 'Sala de la soledad', txt: 'Tu tripulación espera fuera.' },
  { rule: 'guardian', name: 'Sala del Guardián', txt: 'El Guardián del Templo te espera.' },
];

export function installMore18(Game, D) {
  const P = Game.prototype;
  const sfx = D.sfx;
  const M = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
  const near = (p, s, r = 2) => s && Math.hypot(p.x - s.x, p.z - s.z) < r;
  const tpTo = (g, x, z) => { const p = g.player; p.x = x; p.z = z; p.path = []; for (const n of g.following()) g.placeNear(n, Math.round(x), Math.round(z)); g.camTarget.set(x, 0, z); };
  const inR = (g, id) => { const r = g.W.regionAt(g.player.x, g.player.z); return r && r.id === id; };
  const isleOf = (g) => { const p = g.player; const R = g.islets.find((r) => !r.portal && r.contains && r.contains(Math.round(p.x), Math.round(p.z))); if (R) return R.id; const inMain = p.x >= 0 && p.z >= 0 && p.x < g.W.N && p.z < g.W.N; return inMain && !g.sailing ? 'main' : 'mar'; };
  const lvl = (g, k = 0) => Math.max(10, Math.min(500, g.player.level + k));

  // ============================================================ buceo libre
  const baseSail = P.sailMenu;
  P.sailMenu = function () {
    baseSail.call(this);
    const b = this.boat, box = document.getElementById('dopts');
    let deep = true; for (let a = 0; a < 8 && deep; a++) if (this.W.tileAll(Math.round(b.x + Math.sin(a) * 8), Math.round(b.z + Math.cos(a) * 8)) !== T.WATER) deep = false;
    if (this.flags.divingSuit && deep && !this.deck) { const btn = document.createElement('button'); btn.textContent = '🤿 Bucear aquí (fondo del mar)'; btn.onclick = () => { this.ui.closeDialog(); this.freeDive(); }; box.insertBefore(btn, box.firstChild); }
  };
  P.freeDive = function () {
    const p = this.player, b = this.boat, R = this.openSea;
    this.diveFrom = { x: b.x, z: b.z, h: b.heading };
    this.deck = null; this.autoHelm = null; b.speed = 0; this.sailing = false;
    this.scene.add(p.model.root); p.model.root.rotation.set(0, 0, 0);
    let s = Math.abs(Math.round(b.x) * 73856093 ^ Math.round(b.z) * 19349663) % 100000; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    R.rocks.clear();
    for (let i = 0; i < 18; i++) { const x = SX0 + 5 + Math.floor(rnd() * (SW - 7)), z = SZ0 + 1 + Math.floor(rnd() * (SD - 2)); R.rocks.add(x + ',' + z); }
    this.diveT = [];
    for (let i = 0; i < 3; i++) { let x, z; do { x = SX0 + 6 + Math.floor(rnd() * (SW - 8)); z = SZ0 + 1 + Math.floor(rnd() * (SD - 2)); } while (R.rocks.has(x + ',' + z)); this.diveT.push({ x, z, open: false }); }
    this.unboardCrew(R.exit.x + 1, R.exit.z); tpTo(this, R.exit.x + 1, R.exit.z);
    this.oxy = 100; this.buildSeaFloor(rnd);
    this.diveTemps = [];
    const types = p.level >= 300 ? ['pez_lava', 'kraken_joven', 'tiburon'] : ['merfolk', 'jelly', 'tiburon'];
    for (let i = 0; i < 5; i++) { let x, z; do { x = SX0 + 8 + Math.floor(rnd() * (SW - 10)); z = SZ0 + 1 + Math.floor(rnd() * (SD - 2)); } while (R.rocks.has(x + ',' + z)); if (this.ENEMY_DEF[types[i % 3]]) this.diveTemps.push(this.spawnTemp(types[i % 3], x, z, lvl(this))); }
    this.toast('🤿 Te sumerges en mar abierto: corales, cuevas y 3 tesoros escondidos. ¡Vigila el aire!', 'area');
  };
  P.buildSeaFloor = function (rnd) {
    if (this.seaG) this.scene.remove(this.seaG);
    const R = this.openSea, g = new THREE.Group();
    const fl = new THREE.Mesh(new THREE.BoxGeometry(SW + 6, 0.2, SD + 6), M(0xc8b088)); fl.position.set(SX0 + SW / 2, -0.1, SZ0 + SD / 2); g.add(fl);
    for (const k of R.rocks) { const [x, z] = k.split(',').map(Number); const r = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6 + rnd() * 0.4), M(0x6a7a7a)); r.position.set(x, 0.4, z); g.add(r); }
    const cols = [0xff6a8a, 0xffa040, 0xb04ad8, 0x4ad8c8, 0xffe04a];
    for (let i = 0; i < 40; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.5 + rnd() * 0.8, 5), M(cols[i % 5], { emissive: cols[i % 5], emissiveIntensity: 0.15 })); c.position.set(SX0 + rnd() * SW, 0.35, SZ0 + rnd() * SD); g.add(c); }
    this.diveChestM = this.diveT.map((t) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.5), M(0x8a5a2a, { emissive: 0x3a2000 })); b.position.set(t.x, 0.22, t.z); g.add(b); return b; });
    this.scene.add(g); this.seaG = g;
  };
  const baseSurface = P.surface;
  P.surface = function () { for (const e of this.diveTemps || []) if (!e.removed) e.remove(); this.diveTemps = null; return baseSurface.call(this); };

  // ============================================================ volcán que despierta
  P.cenizaR = function () { return this.islets.find((r) => r.id === 'ceniza'); };
  P.updateVolcanoEvent = function (dt) {
    const V = this.volEv, p = this.player;
    if (!V) {
      if (p.level < 25 || (this.net.isClient && this.net.active)) return;
      this.volT = (this.volT ?? 1800) - dt;
      if (this.volT > 0) return;
      this.volT = 3000 + Math.random() * 1200;
      this.volEv = { t: 420, saved: 0, started: false };
      this.toast('🌋 ¡El volcán de Isla Ceniza despierta! Los aldeanos están atrapados: tienes 7 minutos para ir a rescatarlos', 'area'); sfx('hurt');
      return;
    }
    V.t -= dt;
    const R = this.cenizaR(), onIsle = R && R.contains(Math.round(p.x), Math.round(p.z)) && !this.sailing;
    if (onIsle && !V.started) {
      V.started = true; V.npcs = [];
      for (let i = 0; i < 5; i++) for (let k = 0; k < 40; k++) { const x = R.ox + 6 + Math.floor(Math.random() * (R.N - 12)), z = R.oz + 6 + Math.floor(Math.random() * (R.N - 12)); if (this.W.walkable(x, z)) { const n = new D.NPC(this, { id: 'evac_' + i, name: 'Aldeano atrapado', x, z, wander: 0, look: { shirt: [0xc85a2a, 0x5a8ad8, 0x8ac84a, 0xd8a838, 0xb04ad8][i], pants: 0x3a2a1a, hair: 0x3a2a1a, skin: 0xd8a070, female: i % 2 === 1, longHair: i % 2 === 1 } }); n.setStats(5); this.npcs.push(n); V.npcs.push(n); break; } }
      this.toast(`🌋 ¡Hay ${V.npcs.length} aldeanos atrapados! Acércate a cada uno y pulsa «Rescatar»`, 'area');
    }
    if (V.started && onIsle) {
      V.lava = (V.lava || 0) - dt;
      if (V.lava <= 0) { V.lava = 2.5; const x = p.x + (Math.random() - 0.5) * 4, z = p.z + (Math.random() - 0.5) * 4; this.ring(x, z, 1.2, 0xff5010); setTimeout(() => { this.ring(x, z, 1.6, 0xff3a00); if (Math.hypot(p.x - x, p.z - z) < 1.6 && !p.dead) { const d = Math.round(p.maxHp * 0.1); p.hp -= d; this.ui.float('-' + d + ' 🔥', 'dmg', p.x, 1.4, p.z); if (p.hp <= 0) { p.hp = 0; p.dead = true; p.deadT = 3; } } }, 900); }
    }
    const end = (win) => {
      for (const n of V.npcs || []) this.removeNpc(n);
      this.volEv = null;
      if (win) { const g = 3000 + p.level * 60; p.gold += g; this.give('obsidiana', 3); this.stats.evac = (this.stats.evac || 0) + 1; if (!this.ownCos('c_casco_bombero')) this.give('c_casco_bombero'); this.toast(`🌋 ¡Has salvado a todos los aldeanos! +${g} oro`, 'area'); if (this.diaryNote) this.diaryNote('note', 'Rescaté a los aldeanos de Isla Ceniza durante la erupción.'); sfx('quest'); }
      else this.toast(`🌋 La lava cubre la aldea... salvaste a ${V.saved} aldeanos`);
    };
    if (V.started && V.npcs && V.saved >= V.npcs.length) return end(true);
    if (V.t <= 0) end(false);
  };
  P.removeNpc = function (n) { if (!n) return; this.scene.remove(n.model.root); if (n.label && n.label.el) n.label.el.remove(); const i = this.npcs.indexOf(n); if (i >= 0) this.npcs.splice(i, 1); };

  // ============================================================ gremio de ladrones
  P.thiefMenu = function (opts) {
    const T2 = this.thief;
    if (!T2) opts.push({ label: '🗝 Aceptar un golpe: robar el mapa del Bastión (de noche)', action: () => { this.thief = { stage: 'go' }; this.toast('🗝 Ve de noche al Bastión de la Guardia Naval, roba el mapa sin que te vean los guardias y huye lejos'); } });
    else opts.push({ label: '❌ Abandonar el golpe', action: () => this.thiefEnd(false, true) });
    return `Bienvenido al Gremio de Ladrones. Aquí no se pelea: se entra, se roba y se sale sin que nadie se entere. Golpes completados: ${this.stats.heists || 0}.`;
  };
  P.updateThief = function (dt) {
    const T2 = this.thief; if (!T2) return;
    const R = this.islets.find((r) => r.id === 'bastion'), p = this.player; if (!R) return;
    const onIsle = R.contains(Math.round(p.x), Math.round(p.z)) && !this.sailing;
    if (T2.stage === 'go' && onIsle && this.isNight && this.isNight()) {
      const c = R.center; let spot = null;
      for (let r = 6; r < 16 && !spot; r++) for (let a = 0; a < 12 && !spot; a++) { const x = Math.round(c.x + Math.cos(a) * r), z = Math.round(c.z + Math.sin(a) * r); if (this.W.walkable(x, z) && Math.hypot(x - p.x, z - p.z) > 8) spot = { x, z }; }
      if (!spot) return;
      T2.stage = 'sneak'; T2.spot = spot; T2.guards = [];
      for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; const n = new D.NPC(this, { id: 'guardia_n' + i, name: 'Guardia nocturno', x: Math.round(spot.x + Math.cos(a) * 3), z: Math.round(spot.z + Math.sin(a) * 3), wander: 3, look: { shirt: 0x2a4a9a, pants: 0xf4f4f0, hat: 'tricorn', capColor: 0x1a2a5a, sword: true, skin: 0xe0aa80 } }); this.placeNear(n, n.x, n.z); n.setStats(lvl(this)); this.npcs.push(n); T2.guards.push(n); }
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.4), M(0xe8d8a0, { emissive: 0x3a3010 })); m.position.set(spot.x, 0.5, spot.z); this.scene.add(m); T2.mesh = m;
      this.toast('🗝 El mapa está en la mesa del centro. Camina despacio: si corres los guardias te oyen desde más lejos', 'area');
    }
    if (T2.stage === 'sneak' || T2.stage === 'escape') {
      if (T2.mesh) T2.mesh.rotation.y += dt;
      T2.chk = (T2.chk || 0) - dt;
      if (T2.chk <= 0) {
        T2.chk = 0.4;
        const r = p.speed > 4 ? 4.2 : 2.4;
        for (const n of T2.guards) { this.ring(n.x, n.z, r * 0.5, 0x5a8ad8); if (n.dist(p) < r) return this.thiefEnd(false); }
      }
      if (T2.stage === 'escape' && Math.hypot(p.x - T2.spot.x, p.z - T2.spot.z) > 22) this.thiefEnd(true);
    }
  };
  P.thiefEnd = function (win, quiet) {
    const T2 = this.thief; if (!T2) return;
    for (const n of T2.guards || []) this.removeNpc(n);
    if (T2.mesh) this.scene.remove(T2.mesh);
    this.thief = null;
    if (quiet) return;
    const p = this.player;
    if (win) { const g = 4000 + p.level * 50; p.gold += g; this.stats.heists = (this.stats.heists || 0) + 1; if (this.giveBook && Math.random() < 0.3) this.giveBook(); if (this.stats.heists === 5 && !this.ownCos('c_capa_ladron')) this.give('c_capa_ladron'); this.toast(`🗝 ¡Golpe perfecto! Vendes el mapa de la Marina por ${g} oro`, 'area'); sfx('quest'); }
    else { if (this.addBounty) this.addBounty(500, 'marine'); for (let i = 0; i < 3; i++) { const e = this.spawnTemp('marine', Math.round(p.x) + 2 + i, Math.round(p.z) + 2, lvl(this)); e.provoked = true; e.state = 'chase'; } this.toast('🚨 ¡Te han descubierto! ¡Alerta en el Bastión!', 'area'); sfx('hurt'); }
  };

  // ============================================================ peces legendarios y concurso
  P.fishWeek = function () { const w = Math.floor(this.day / 7), F = (this.fishW = this.fishW || { week: w, best: 0 }); if (F.week !== w) { if (F.best > 0 && F.best >= this.fishRivals(F.week)[0].kg) { this.player.gold += 20000; if (!this.ownCos('c_corona_pesca')) this.give('c_corona_pesca'); this.toast('🏆 ¡Ganaste el concurso de pesca de la semana! +20000 oro', 'area'); } this.fishW = { week: w, best: 0 }; } return this.fishW; };
  P.fishRivals = function (w) { return ['Abuelo Tomeu', 'Marina la Pescadora', 'Chispa el Grumete'].map((n, i) => ({ name: n, kg: Math.round(20 + ((w * 31 + i * 17) % 160) * (1 + this.player.level / 300)) })).sort((a, b) => b.kg - a.kg); };
  P.watchFish = function () {
    const total = Object.values(this.fishDex || {}).reduce((a, b) => a + b, 0);
    if (this._fishN === undefined) { this._fishN = total; return; }
    if (total <= this._fishN) return;
    this._fishN = total;
    const F = this.fishWeek(), isle = isleOf(this);
    this.legFish = this.legFish || {};
    let kg = Math.round((1 + Math.random() * 30) * 10) / 10;
    if (Math.random() < 0.08 + this.player.level / 5000 && !this.legFish[isle]) {
      kg = Math.round(100 + Math.random() * 400); this.legFish[isle] = kg;
      this.give('escama_leyenda', 1); this.player.gold += 10000;
      this.toast(`🐟 ¡PEZ LEGENDARIO! ${LEG_FISH[isle] || LEG_FISH.mar} · ${kg} kg (${Object.keys(this.legFish).length}/${Object.keys(LEG_FISH).length} trofeos)`, 'area'); sfx('level');
      if (Object.keys(this.legFish).length === Object.keys(LEG_FISH).length && !this.ownCos('c_capa_pesca')) this.give('c_capa_pesca');
    }
    if (kg > F.best) { F.best = kg; this.toast(`🎣 Nuevo récord de la semana: ${kg} kg`); }
  };
  P.fishContest = function (opts) {
    const F = this.fishWeek(), list = [...this.fishRivals(F.week), { name: this.player.name + ' (tú)', kg: F.best, me: true }].sort((a, b) => b.kg - a.kg);
    opts.push({ label: '🐟 Ver los peces legendarios', action: () => this.ui.openDialog('🐟 Peces legendarios', Object.entries(LEG_FISH).map(([k, n]) => `${this.legFish && this.legFish[k] ? '🏆' : '▫️'} ${n} (${k === 'main' ? 'Isla Bruma' : k === 'mar' ? 'pescando desde el barco' : 'Isla ' + k[0].toUpperCase() + k.slice(1)})${this.legFish && this.legFish[k] ? ` · ${this.legFish[k]} kg` : ''}`).join('<br>'), [{ label: 'Cerrar', action: null }]) });
    return `Concurso de pesca de la semana (el pez más pesado gana 20000 oro):<br>${list.map((r, i) => `${i + 1}. ${r.name}: ${r.kg} kg`).join('<br>')}<br>Cada isla esconde un pez legendario.`;
  };

  // ============================================================ nuevos puestos del barco
  P.updateCrewJobs2 = function (dt) {
    if (!this.sailing || !this.crewJob) return;
    if (this.crewJob('vigia')) {
      const ships = (this.naval && this.naval.ships) || [];
      for (const s of ships) if (!s.spotted && !s.sinking) { s.spotted = true; const a = Math.atan2(s.x - this.boat.x, s.z - this.boat.z), dir = ['sur', 'sureste', 'este', 'noreste', 'norte', 'noroeste', 'oeste', 'suroeste'][((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8]; this.toast(`🔭 ${this.crewJob('vigia').name}: «¡Barco a la vista al ${dir}!»`); }
      if (this.smon && !this.smon.spotted) { this.smon.spotted = true; this.toast(`🔭 ${this.crewJob('vigia').name}: «¡Algo enorme se mueve bajo el agua!»`); }
    }
    if (this.crewJob('pesca')) { this.cfT = (this.cfT ?? 90) - dt; if (this.cfT <= 0) { this.cfT = 90; const f = Math.random() < 0.2 ? 'atun' : 'fish'; if (ITEMS[f]) { this.give(f, 1); this.toast(`🎣 ${this.crewJob('pesca').name} ha pescado: ${ITEMS[f].name}`); } } }
  };
  const baseDmg = P.damageEnemy;
  P.damageEnemy = function (e, dmg, crit, byCrew, killerId = 0) {
    const was = !e.dead, r = baseDmg.call(this, e, dmg, crit, byCrew, killerId);
    if (was && e.dead && e.def && !killerId) {
      const t = this.crewJob && this.crewJob('tesorero');
      if (t && e.def.gold) { const g = Math.round(e.def.gold(e.level || 1) * 0.1); if (g > 0) { this.player.gold += g; } }
      for (const [k, B] of Object.entries(BANNERS)) if (B.types.includes(e.type)) { this.bannerKills = this.bannerKills || {}; this.bannerKills[k] = (this.bannerKills[k] || 0) + 1; if (this.bannerKills[k] === 25) this.toast(`🏴 ¡Nueva bandera para tu colección: ${B.name}! (⚡ Atajos › Banderas)`, 'area'); }
    }
    return r;
  };

  // ============================================================ aventuras con la pareja
  P.coupleMenu = function (opts, n) {
    const done = this.coupleDone || 0;
    if (done >= STORIES.length) { opts.push({ label: '💞 Ya vivisteis todas las aventuras juntos', action: null }); return; }
    if (this.pq) { opts.push({ label: `💞 Aventura pendiente: «${STORIES[this.pq.i].title}» en ${this.pq.isle}`, action: null }); return; }
    if (this.flags.coupleDay === this.day) return;
    opts.push({ label: `💞 Proponer una aventura juntos (${done}/${STORIES.length})`, action: () => {
      const S = STORIES[done], d = this.docks.find((k) => k.id === S.dock) || this.docks[1];
      this.pq = { i: done, x: d.land.x, z: d.land.z, isle: d.name }; this.flags.coupleDay = this.day;
      const s = this.soc(n.id); s.hand = true;
      this.toast(`💞 ${n.name}: «¡Vamos a ${d.name}! Tengo algo que enseñarte...»`, 'area');
    } });
  };
  P.coupleSpot = function () {
    const Q = this.pq; if (!Q) return null;
    const pt = this.partner && this.partner(), p = this.player;
    if (!pt || pt.dist(p) > 6 || Math.hypot(p.x - Q.x, p.z - Q.z) > 6) return null;
    return { icon: '💞', label: 'Momento', fn: () => {
      const S = STORIES[Q.i]; this.pq = null; this.coupleDone = Q.i + 1;
      if (this.addFriend) this.addFriend(pt, 10);
      pt.st.dance = true; setTimeout(() => { pt.st.dance = false; }, 4000);
      for (let i = 0; i < 6; i++) setTimeout(() => this.ring(p.x + (Math.random() - 0.5) * 2, p.z + (Math.random() - 0.5) * 2, 0.5, 0xff6aa8), i * 200);
      this.player.gold += 2000;
      if (this.coupleDone === STORIES.length && !this.ownCos('c_capa_amor')) this.give('c_capa_amor');
      if (this.crewMemory) this.crewMemory(pt, `Vivimos juntos «${S.title}».`);
      this.ui.openDialog(`💞 ${S.title}`, `${S.text}<br><br>${pt.name} te mira y sonríe. (+10 de cariño)`, [{ label: '💞', action: null }]);
      if (this.diaryNote) this.diaryNote('note', `Viví «${S.title}» con ${pt.name}.`);
    } };
  };

  // ============================================================ ciudad mercante flotante y duelos de capitanes
  P.floatPos = function () { return FLOAT_POS[this.day % FLOAT_POS.length]; };
  P.updateFloatCity = function () {
    const pos = this.floatPos();
    if (!this.floatG) {
      const g = new THREE.Group();
      const deck = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 0.4, 16), M(0x8a6a44)); deck.position.y = 0.3; g.add(deck);
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; const h = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1, 5), M(0x6a4a2a)); h.position.set(Math.cos(a) * 8, 0.3, Math.sin(a) * 8); h.rotation.y = -a; g.add(h); const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 5, 6), M(0x5a3a1a)); mast.position.set(Math.cos(a) * 8, 2.8, Math.sin(a) * 8); g.add(mast); const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.2), M([0xd84a4a, 0x4a8ad8, 0xe8c040][i % 3], { side: THREE.DoubleSide })); sail.position.set(Math.cos(a) * 8, 3.2, Math.sin(a) * 8); sail.rotation.y = -a; g.add(sail); }
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const tent = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.4, 6), M([0xffd040, 0xd84a8a, 0x4ad8a8, 0xffffff, 0x8a4ad8][i])); tent.position.set(Math.cos(a) * 4, 1.2, Math.sin(a) * 4); g.add(tent); }
      this.scene.add(g); this.floatG = g;
    }
    this.floatG.position.set(pos.x, 0, pos.z);
    this.floatG.visible = this.sailing;
  };
  P.sailAction18 = function () {
    if (this.deck) return null;
    const pos = this.floatPos(), b = this.boat;
    if (Math.hypot(b.x - pos.x, b.z - pos.z) < 16) return { icon: '🏙', label: 'Mercado', fn: () => this.floatMenu() };
    return null;
  };
  P.floatMenu = function () {
    const opts = [];
    for (let i = 0; i < 4; i++) {
      const [id, n, price] = FLOAT_STOCK[(this.day * 3 + i * 2) % FLOAT_STOCK.length]; const it = ITEMS[id]; if (!it) continue;
      const key = `fl_${this.day}_${i}`;
      if (this.flags[key]) continue;
      if (it.cos && this.ownCos(id)) continue;
      opts.push({ label: `${it.icon || ''} ${it.name}${n > 1 ? ' ×' + n : ''} · ${price} oro`, action: () => this.buy({ gold: price }, () => { this.flags[key] = true; this.give(id, n); sfx('coin'); }) });
    }
    const cap = FAMOUS[(this.flags.capDuels || 0) % FAMOUS.length];
    if (!this.cduel) opts.push({ label: `⚔️ Duelo de capitanes contra ${cap.name} «${cap.ep}» (combate naval)`, action: () => this.captainDuel(cap) });
    opts.push({ label: 'Cerrar', action: null });
    this.ui.openDialog('🏙 Ciudad mercante flotante', 'Barcos unidos con tablones: una ciudad que cada día amanece en otro lugar del mar. Aquí se vende lo que no hay en ningún puerto, y los capitanes famosos aceptan duelos.', opts);
  };
  P.captainDuel = function (cap) {
    const s = this.spawnEnemyShip('pirate'); if (!s) return this.toast('No hay sitio para el duelo aquí');
    const L = lvl(this, 5); s.level = L; s.maxHp = s.hp = Math.round((100 + L * 12) * 3); s.duel = cap;
    s.label.nm.textContent = `⚔️ ${cap.name} · Nv. ${L}`; s.label.nm.style.color = '#ffd040';
    this.cduel = s;
    this.toast(`⚔️ ¡Duelo de capitanes! ${cap.name}: «Si me hundes, mi bandera es tuya»`, 'area');
  };
  P.updateCaptainDuel = function () {
    const s = this.cduel; if (!s) return;
    if (this.boat.sinking) { this.cduel = null; return this.toast('⚔️ Has perdido el duelo de capitanes'); }
    if (s.hp <= 0 || s.sinking) {
      this.cduel = null; this.flags.capDuels = (this.flags.capDuels || 0) + 1;
      const g = 10000 + s.level * 100; this.player.gold += g;
      this.capFlags = this.capFlags || []; if (!this.capFlags.includes(s.duel.id)) this.capFlags.push(s.duel.id);
      this.toast(`🏆 ¡Has hundido el barco de ${s.duel.name}! +${g} oro y su bandera para tu colección`, 'area'); sfx('quest');
    } else if (!this.naval.ships.includes(s)) this.cduel = null;
  };

  // ============================================================ colección de banderas
  P.bannerList = function () {
    const out = Object.entries(BANNERS).map(([k, B]) => ({ id: k, name: B.name, col: B.col, emb: B.emb, have: ((this.bannerKills || {})[k] || 0) >= 25, prog: Math.min(25, (this.bannerKills || {})[k] || 0) }));
    for (const id of this.capFlags || []) { const f = FAMOUS.find((k) => k.id === id); if (f) out.push({ id: 'cap_' + id, name: `Bandera de ${f.name}`, col: '#' + ((f.look.capColor || f.look.shirt || 0x3a2a2a) >>> 0).toString(16).padStart(6, '0'), emb: '🏴‍☠️', have: true, prog: 25 }); }
    return out;
  };
  P.bannerMenu = function () {
    const L = this.bannerList(), opts = [];
    for (const B of L) opts.push({ label: `${B.emb} ${B.name} ${B.have ? (this.hoisted === B.id ? '(izada)' : '· izar') : `· ${B.prog}/25`}`, action: B.have ? () => { this.hoisted = B.id; this.hoistBanner(); this.toast(`🏴 Izas la ${B.name}`); } : null });
    if (this.hoisted) opts.push({ label: '🏴 Volver a tu bandera propia', action: () => { this.hoisted = null; if (this.flagCfg && this.applyFlag) this.applyFlag(this.ship, this.flagCfg); } });
    opts.push({ label: 'Cerrar', action: null });
    this.ui.openDialog('🏴 Colección de banderas', `Vence a 25 enemigos de cada bando para conseguir su bandera, o hunde a capitanes famosos en duelo (Ciudad mercante flotante). Tienes ${L.filter((b) => b.have).length}/${L.length}.`, opts);
  };
  P.hoistBanner = function () {
    const B = this.bannerList().find((b) => b.id === this.hoisted); if (!B || !this.ship) return;
    const c = document.createElement('canvas'); c.width = 128; c.height = 80; const x = c.getContext('2d');
    x.fillStyle = B.col; x.fillRect(0, 0, 128, 80); x.font = '48px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(B.emb, 64, 42);
    const m = new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(c), side: THREE.DoubleSide });
    this.ship.traverse((o) => { if (o.userData.flag) o.material = m; });
  };

  // ============================================================ Templo de las Pruebas
  P.enterTemple = function () {
    const p = this.player, R = this.temple;
    if (p.level < 40) return this.toast('🔒 El Templo de las Pruebas se abre a nivel 40');
    this.tplReturn = { x: p.x, z: p.z };
    if (!this.tplG) {
      const g = new THREE.Group();
      const fl = new THREE.Mesh(new THREE.BoxGeometry(TW + 2, 0.2, TD + 2), M(0xc8b890, { map: this.M.tx.stone })); fl.position.set(TX0 + TW / 2 - 0.5, -0.1, TZ0 + TD / 2 - 0.5); g.add(fl);
      for (const [lx, lz] of [[4, 3], [4, 10], [13, 3], [13, 10]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 4, 10), M(0xe8dcc0)); c.position.set(TX0 + lx, 2, TZ0 + lz); g.add(c); }
      const alt = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 0.5, 8), M(0xd8a838, { emissive: 0x3a2a00 })); alt.position.set(R.center.x, 0.25, R.center.z); g.add(alt);
      this.scene.add(g); this.tplG = g;
    }
    tpTo(this, R.exit.x + 1, R.exit.z);
    this.tpl = { room: 0, temps: null };
    this.toast('🏛 El Templo de las Pruebas: 7 salas, cada una con su regla. Pulsa «Prueba» en el altar del centro', 'area');
  };
  P.trialStart = function () {
    const Tp = this.tpl, Tr = TRIALS[Tp.room], R = this.temple, p = this.player;
    Tp.rule = Tr.rule; Tp.t = Tr.rule === 'reloj' ? 45 : null; Tp.temps = [];
    if (Tr.rule === 'solo') { Tp.waiting = []; for (const n of this.following()) { const s = this.soc(n.id); Tp.waiting.push({ id: n.id, wait: s.wait, hand: s.hand }); s.wait = true; s.hand = false; this.placeNear(n, R.exit.x, R.exit.z); } }
    const pool = ['caballero_antiguo', 'caballero_celeste', 'espectro_tiempo', 'caballero_infernal', 'druida_esporas', 'caballero_vacio'].filter((t) => this.ENEMY_DEF[t]);
    if (Tr.rule === 'guardian') { const e = this.spawnTemp('cronos', R.center.x + 4, R.center.z, lvl(this, 5)); e.maxHp = Math.round(e.maxHp * 0.6); e.hp = e.maxHp; e.label.nm.textContent = `Guardián del Templo · Nv. ${e.level}`; e.provoked = true; e.state = 'chase'; Tp.temps.push(e); }
    else for (let i = 0; i < 4; i++) { const e = this.spawnTemp(pool[(Tp.room + i) % pool.length], R.center.x + 3 + (i % 2) * 2, R.center.z - 3 + i * 2, lvl(this)); e.maxHp = Math.round(e.maxHp * 0.5); e.hp = e.maxHp; if (Tr.rule === 'veloces') e.speed *= 1.7; e.provoked = true; e.state = 'chase'; Tp.temps.push(e); }
    this.toast(`🏛 ${Tr.name} (${Tp.room + 1}/7): ${Tr.txt}`, 'area');
  };
  P.trialRestore = function () { const Tp = this.tpl; if (Tp && Tp.waiting) { for (const w of Tp.waiting) { const s = this.soc(w.id); s.wait = w.wait; s.hand = w.hand; } Tp.waiting = null; } const ov = document.getElementById('darkFx'); if (ov) ov.style.display = 'none'; };
  P.updateTemple = function (dt) {
    const Tp = this.tpl; if (!Tp) return;
    if (!inR(this, 'templo_pruebas')) { this.trialRestore(); for (const e of Tp.temps || []) if (!e.removed) e.remove(); this.tpl = null; return; }
    let ov = document.getElementById('darkFx');
    if (!ov) { ov = document.createElement('div'); ov.id = 'darkFx'; ov.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:5;background:radial-gradient(circle at 50% 50%, transparent 90px, rgba(0,0,0,0.96) 170px);display:none'; document.body.appendChild(ov); }
    ov.style.display = Tp.temps && Tp.rule === 'oscuras' ? 'block' : 'none';
    if (!Tp.temps) return;
    if (this.player.dead) { this.trialRestore(); this.toast('🏛 Has caído en el Templo'); this.leaveTemple(); return; }
    if (Tp.t != null) { Tp.t -= dt; if (Tp.t <= 0) { this.trialRestore(); for (const e of Tp.temps) if (!e.removed) e.remove(); Tp.temps = null; this.toast('⏰ ¡Se acabó el tiempo! Vuelve a intentarlo desde el altar'); return; } }
    if (Tp.temps.every((e) => e.dead || e.removed)) {
      this.trialRestore(); Tp.temps = null;
      const room = Tp.room, first = (this.flags.tplDay !== this.day);
      Tp.room++;
      if (first) this.player.gold += 3000 * (room + 1);
      if (Tp.room >= TRIALS.length) { Tp.room = 0; if (first) { this.flags.tplDay = this.day; this.give('nucleo_estelar', 2); if (!this.ownCos('c_corona_templo')) this.give('c_corona_templo'); } this.stats.temple = (this.stats.temple || 0) + 1; this.toast(`🏛 ¡Has superado las 7 pruebas del Templo!${first ? ' +2 núcleos estelares' : ''}`, 'area'); sfx('quest'); }
      else this.toast(`🏛 ¡Sala superada!${first ? ` +${3000 * (room + 1)} oro` : ''} Vuelve al altar para la siguiente`);
    }
  };
  P.leaveTemple = function () { const Tp = this.tpl; if (Tp) for (const e of Tp.temps || []) if (!e.removed) e.remove(); this.trialRestore(); this.tpl = null; const r = this.tplReturn || { x: 50, z: 52 }; tpTo(this, r.x, r.z); };
  // reglas: sin pociones y daño doble
  P.patchPotion = function () {
    if (this._potPatched) return; this._potPatched = true;
    const pr = Object.getPrototypeOf(this.player), base = pr.usePotion;
    pr.usePotion = function () { if (this.g.tpl && this.g.tpl.temps && this.g.tpl.rule === 'pociones') return this.g.ui.toast('🏛 En esta sala no se pueden beber pociones'); return base.call(this); };
  };
  const baseHit = P.hitTarget;
  P.hitTarget = function (p, e, atk) { if (this.tpl && this.tpl.temps && this.tpl.rule === 'fragil' && p === this.player) atk *= 2; return baseHit.call(this, p, e, atk); };

  // ============================================================ enganches
  P.npcDialog18 = function (id, opts) {
    if (id === 'ladrona') return this.thiefMenu(opts);
    if (id === 'tomeu') return this.fishContest(opts);
    if (id === 'marga' && !this.flags.divingSuit) opts.push({ label: '🤿 Traje de buzo para bucear en mar abierto (8000 oro, nivel 30)', action: () => { if (this.player.level < 30) return this.toast('🔒 Nivel 30'); this.buy({ gold: 8000 }, () => { this.flags.divingSuit = true; this.toast('🤿 ¡Traje de buzo listo! En mar abierto: ⚙️ Barco › Bucear aquí', 'area'); }); } });
    if (id === 'oraculo') opts.push({ label: '🏛 Templo de las Pruebas (Nv. 40, 7 salas)', action: () => this.enterTemple() });
    const n = this.npcById(id); if (n && this.soc(id).partner) this.coupleMenu(opts, n);
    return null;
  };
  P.contextAction18 = function () {
    if (this.sailing) return null;
    const p = this.player;
    if (inR(this, 'mar_abierto')) {
      if (near(p, this.openSea.exit, 1.8)) return { icon: '🫧', label: 'Subir', fn: () => this.surface() };
      const i = (this.diveT || []).findIndex((t) => !t.open && near(p, t, 1.6));
      if (i >= 0) return { icon: '💎', label: 'Tesoro', fn: () => { const t = this.diveT[i]; t.open = true; if (this.diveChestM) this.diveChestM[i].visible = false; const g = 500 + p.level * 30; p.gold += g; const loot = ['perla', 'coral', 'ambar_gris', 'escama'][Math.floor(Math.random() * 4)]; this.give(loot, 2); if (Math.random() < 0.1 && this.giveBook) this.giveBook(); this.toast(`💎 Tesoro del fondo: ${g} oro y ${ITEMS[loot].name.toLowerCase()} (${this.diveT.filter((k) => k.open).length}/3)`); sfx('coin'); } };
      return null;
    }
    if (inR(this, 'templo_pruebas')) {
      if (near(p, this.temple.exit, 1.8)) return { icon: '🚪', label: 'Salir', fn: () => this.leaveTemple() };
      if (this.tpl && !this.tpl.temps && near(p, this.temple.center, 2)) return { icon: '🏛', label: 'Prueba', fn: () => this.trialStart() };
      return null;
    }
    const V = this.volEv;
    if (V && V.npcs) { const n = V.npcs.find((k) => !k.saved && k.dist(p) < 1.8); if (n) return { icon: '🆘', label: 'Rescatar', fn: () => { n.saved = true; V.saved++; this.removeNpc(n); this.ring(p.x, p.z, 1, 0x4ad84a); this.toast(`🆘 ¡Aldeano a salvo! (${V.saved}/${V.npcs.length})`); sfx('coin'); } }; }
    const T2 = this.thief;
    if (T2 && T2.stage === 'sneak' && near(p, T2.spot, 1.6)) return { icon: '🗝', label: 'Robar', fn: () => { T2.stage = 'escape'; if (T2.mesh) this.scene.remove(T2.mesh); T2.mesh = null; this.toast('🗝 ¡Tienes el mapa! Ahora aléjate sin que te vean', 'area'); } };
    const cs = this.coupleSpot(); if (cs) return cs;
    return null;
  };
  P.updateMore18 = function (dt) {
    const tor = this.islets.find((r) => r.id === 'tortuga');
    if (tor && !this.npcById('ladrona')) { const n = new D.NPC(this, { id: 'ladrona', name: 'Maestra ladrona Nyx', x: tor.center.x - 3, z: tor.center.z + 2, wander: 1, look: { shirt: 0x1a1a1a, pants: 0x1a1a1a, cape: 0x1a1a1a, hat: 'hood', hatColor: 0x111111, skin: 0xc68a5a, eyeGlow: 0x8ad8ff } }); n.setStats(150); this.placeNear(n, n.x, n.z); this.npcs.push(n); }
    if (!this.npcById('tomeu')) { const n = new D.NPC(this, { id: 'tomeu', name: 'Abuelo Tomeu (concurso de pesca)', x: 54, z: 90, wander: 1, look: { shirt: 0x3a6a8a, pants: 0x3a3a2a, hat: 'straw', beard: 0xf0f0f0, hair: 0xf0f0f0, skin: 0xc68a5a } }); n.setStats(30); this.placeNear(n, 54, 90); this.npcs.push(n); }
    if (!this.m18init) { this.m18init = true; this.patchPotion(); if (this.hoisted) this.hoistBanner(); }
    this.updateVolcanoEvent(dt); this.updateThief(dt); this.updateCrewJobs2(dt); this.updateTemple(dt); this.updateCaptainDuel(); this.updateFloatCity();
    this.m18T = (this.m18T || 0) - dt; if (this.m18T <= 0) { this.m18T = 0.5; this.watchFish(); }
  };
  P.newsHtml18 = function () {
    const fp = this.floatPos();
    return `<div class="sub">🆕 v5.6</div><ul class="qlist">
      <li>🏙 Ciudad flotante hoy en (${fp.x}, ${fp.z}) · 🌋 Volcán: ${this.volEv ? `<b>¡ERUPCIÓN! ${Math.ceil(this.volEv.t / 60)} min</b>` : 'tranquilo'} · 🗝 Golpes: ${this.stats.heists || 0}</li>
      <li>🐟 Peces legendarios: ${Object.keys(this.legFish || {}).length}/${Object.keys(LEG_FISH).length} · 🏴 Banderas: ${this.bannerList().filter((b) => b.have).length} · 🏛 Templo: ${this.stats.temple || 0} veces · 💞 Aventuras: ${this.coupleDone || 0}/${STORIES.length}</li></ul>`;
  };
}

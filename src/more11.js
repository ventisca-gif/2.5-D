// v3.9: islas conquistadas por piratas famosos, alquimista y joyero, eventos de temporada, pecios hundidos,
// defensa del puerto con cañones, rasgos de la tripulación, mapa del mundo que se revela y la Leyenda de la Bruma.
import * as THREE from 'three';
import { T } from './world.js';
import { ITEMS } from './items.js';
import { BUFFS } from './skills.js';
import { JOBS } from './extra.js';
import { makeShip } from './props.js';

JOBS.alquimista = { name: 'Alquimista', icon: '⚗️', perk: 'Elixires más largos' };
JOBS.joyero = { name: 'Joyero', icon: '💎', perk: 'Amuletos más fuertes' };
BUFFS.e_fuerza = { name: '💪 Elixir de fuerza', atk: 1.3 };
BUFFS.e_piel = { name: '🪨 Elixir de piel de piedra', def: 1.35 };
BUFFS.e_sabio = { name: '📘 Elixir del sabio', xp: 1.3 };
const ELIXIRS = {
  pocion_mayor: { need: { potion: 2, mushroom: 2 }, buff: null, heal: 0.6 },
  elixir_fuerza: { need: { mushroom: 3, ambar: 1 }, buff: 'e_fuerza' },
  elixir_piel: { need: { mushroom: 3, obsidiana: 1 }, buff: 'e_piel' },
  elixir_sabio: { need: { mushroom: 3, perla: 1 }, buff: 'e_sabio' },
};
export const TRAITS = {
  valiente: { name: 'Valiente', icon: '🦁', desc: '+15% de daño y nunca se retira', lines: ['¡Que vengan todos!', '¡No retrocedo ante nadie!'] },
  cobarde: { name: 'Cobarde', icon: '🐭', desc: 'Esquiva más pero se retira antes', lines: ['¿Y si mejor huimos?', 'Mamá, ¿por qué me hice pirata?'] },
  gloton: { name: 'Glotón', icon: '🍗', desc: 'Las pociones y banquetes le curan el doble', lines: ['¿Cuándo comemos?', 'Huele a guiso... ¿o es el mar?'] },
  afortunado: { name: 'Afortunado', icon: '🍀', desc: 'Encuentra oro tras los combates', lines: ['¡Mira, una moneda!', 'Hoy es mi día de suerte.'] },
  sabio: { name: 'Sabio', icon: '📜', desc: 'Toda la tripulación gana +10% de experiencia', lines: ['Las estrellas dicen que vamos bien.', 'El mar enseña a quien escucha.'] },
  fuerte: { name: 'Fuerte', icon: '💪', desc: '+20% de vida', lines: ['¡Puedo cargar el barco yo solo!', '¿Quién quiere un pulso?'] },
};
const TRAIT_KEYS = Object.keys(TRAITS);
const LEGEND_FRAGS = { reina_hielo: 'Fragmento de hielo', gran_automata: 'Fragmento de bronce', rey_pastel: 'Fragmento dulce', guardian_errante: 'Fragmento de ruina', sombra_abismo: 'Fragmento de sombra' };
// pecios hundidos (región submarina)
const PX = 2300, PZ = 0, PW = 18, PD = 14;
export const WRECK_SPOTS = [{ x: -40, z: 100 }, { x: 175, z: 130 }];
export function makeWreckDive() {
  const blocked = new Uint8Array(PW * PD);
  const inb = (lx, lz) => lx >= 0 && lz >= 0 && lx < PW && lz < PD;
  const R = { kind: 'dungeon', id: 'pecio', name: 'Pecio del Galeón Dorado', X: PX, Z: PZ, underwater: true, exit: { x: PX + 2, z: PZ + 7 }, spawns: [] };
  R.contains = (x, z) => x >= PX - 1 && x <= PX + PW && z >= PZ - 1 && z <= PZ + PD;
  R.tile = (x, z) => (inb(x - PX, z - PZ) ? T.SAND : T.WATER);
  R.walkable = (x, z) => { const lx = x - PX, lz = z - PZ; return inb(lx, lz) && !blocked[lz * PW + lx]; };
  R.setBlocked = (x, z, v) => { const lx = x - PX, lz = z - PZ; if (inb(lx, lz)) blocked[lz * PW + lx] = v; };
  R.groundY = () => 0;
  R.areaName = () => 'Pecio del Galeón Dorado';
  R.chests = [[15, 2], [10, 11], [15, 11]].map(([x, z], i) => ({ id: 'pecio_' + i, x: PX + x, z: PZ + z, loot: { gold: 900, potion: 1 } }));
  for (const c of R.chests) blocked[(c.z - PZ) * PW + (c.x - PX)] = 1;
  for (let x = 6; x <= 12; x++) { blocked[4 * PW + x] = 1; blocked[9 * PW + x] = 1; }
  R.spawns.push({ type: 'tiburon', count: 5, area: [PX + 4, PZ + 1, PX + 16, PZ + 12], lvl: [55, 70] });
  return R;
}
// mapa del mundo
const MAP = { x0: -104, z0: -104, x1: 244, z1: 244, c: 6 };
const MW = Math.ceil((MAP.x1 - MAP.x0) / MAP.c), MH = Math.ceil((MAP.z1 - MAP.z0) / MAP.c);

export function installMore11(Game, D) {
  const P = Game.prototype;
  const sfx = D.sfx;
  const hash = (s) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

  // ============================================================ islas conquistadas
  P.updateConquest = function (dt) {
    if (this.net.isClient && this.net.active) return;
    this.conq = this.conq || {};
    this.conqT = (this.conqT ?? 600) - dt;
    if (this.conqT <= 0 && this.started) {
      this.conqT = 900 + Math.random() * 600;
      const free = this.islets.filter((r) => !r.ghost && !r.portal && r.towns && r.towns.length && !this.conq[r.id] && r.id !== 'puerto_libre' && r.id !== 'bastion');
      if (free.length && Object.keys(this.conq).length < 2) {
        this.famousInit();
        const R = free[Math.floor(Math.random() * free.length)], f = this.famousList[Math.floor(Math.random() * this.famousList.length)];
        this.conq[R.id] = { fid: f.id, name: f.name, isle: R.name };
        this.toast(`🏴‍☠️ ¡${f.name} ha conquistado ${R.name}! Los precios suben allí. Ve a liberarla`, 'area');
        sfx('quest');
      }
    }
    const here = this.isleOf(this.player.x, this.player.z), C = this.conq[here];
    if (C && !C.fight && !this.sailing) {
      const p = this.player, R = this.islets.find((r) => r.id === here), lvl = Math.min(500, p.level + 2), temps = [];
      for (let i = 0; i < 5; i++) for (let k = 0; k < 30; k++) { const x = R.center.x + Math.round((Math.random() - 0.5) * 14), z = R.center.z + Math.round((Math.random() - 0.5) * 14); if (R.walkable(x, z) && Math.hypot(x - p.x, z - p.z) > 5) { const e = this.spawnTemp(i === 0 ? 'marine_boss' : 'pirate', x, z, i === 0 ? lvl + 2 : lvl); if (i === 0) { e.maxHp = Math.round(e.maxHp * 0.5); e.hp = e.maxHp; e.label.nm.textContent = `${C.name} · Nv. ${e.level}`; } temps.push(e); break; } }
      C.fight = { temps };
      this.toast(`⚔️ Los hombres de ${C.name} defienden ${C.isle}. ¡Derrótalos!`, 'area');
    }
    for (const [id, c] of Object.entries(this.conq)) {
      if (!c.fight) continue;
      if (this.isleOf(this.player.x, this.player.z) !== id) { for (const e of c.fight.temps) if (!e.removed) e.remove(); c.fight = null; this.purgeTemps(); continue; }
      if (c.fight.temps.every((e) => e.dead || e.removed)) {
        c.fight = null; delete this.conq[id];
        const p = this.player;
        this.ui.openDialog(`🏴 ${c.isle} recuperada`, `Has expulsado a ${c.name}. ¿Qué haces con la isla?`, [
          { label: '🕊 Liberarla (oro y gratitud de sus vecinos)', action: () => { p.gold += 2500; for (const n of this.npcs) if (this.isleOf(n.x, n.z) === id) this.addFriend(n, 8, true); this.toast(`🕊 ${c.isle} es libre de nuevo. ¡Sus vecinos te adoran!`, 'area'); } },
          { label: '🏴 Quedártela (tributo de 400 oro al día)', action: () => { this.owned = this.owned || {}; this.owned[id] = this.day; this.addBounty(800, 'isle'); this.toast(`🏴 ${c.isle} ahora te paga tributo`, 'area'); } },
        ]);
        this.stats.liberated = (this.stats.liberated || 0) + 1;
        sfx('quest');
      }
    }
  };
  const basePM = P.priceMul;
  P.priceMul = function () { const b = basePM ? basePM.call(this) : 1; return this.conq && this.conq[this.isleOf(this.player.x, this.player.z)] ? b * 1.2 : b; };
  P.collectTribute = function () {
    let gold = 0;
    for (const [id, d] of Object.entries(this.owned || {})) { gold += (this.day - d) * 400; this.owned[id] = this.day; }
    if (gold > 0) { this.player.gold += gold; this.toast(`🏴 Tributo de tus islas: +${gold} oro`); }
  };

  // ============================================================ alquimista y joyero
  P.alchemyMenu = function () {
    const p = this.player;
    this.ui.openDialog('⚗️ Alquimia', 'Elixires que duran 3 minutos (más con oficio de alquimista).', [
      ...Object.entries(ELIXIRS).map(([id, e]) => ({ label: `${ITEMS[id].icon} ${ITEMS[id].name} (${Object.entries(e.need).map(([k, v]) => v + ' ' + ITEMS[k].name.toLowerCase()).join(', ')})`, action: () => this.buy({ ...e.need }, () => { this.give(id, 1); this.jobXp('alquimista', 40); this.toast(`⚗️ Preparas ${ITEMS[id].name}`); this.alchemyMenu(); }) })),
      { label: 'Cerrar', action: null },
    ]);
  };
  P.drinkElixir = function (id) {
    const p = this.player, e = ELIXIRS[id];
    if (!e || !p.inv[id]) return;
    p.inv[id]--;
    if (e.heal) { p.hp = Math.min(p.maxHp, p.hp + p.maxHp * e.heal); this.ui.float('+❤', 'heal', p.x, 1.5, p.z); }
    if (e.buff) this.addBuff(e.buff, 180 + this.jobLevel('alquimista') * 6);
    this.toast(`${ITEMS[id].icon} ¡${ITEMS[id].name}!`);
    sfx('level');
  };
  P.jewelMenu = function () {
    const L = this.amulets || [];
    if (!L.length) return this.toast('Primero crea un amuleto');
    this.ui.openDialog('💎 Tallar amuleto', 'Tallar mejora un amuleto un 25% (máx. 3 veces). Cuesta 2 gemas cualesquiera y 800 oro.', [
      ...L.map((A, i) => ({ label: `${A.gems} ${A.name} ${'✦'.repeat(A.cut || 0)} · ${this.amuletText(A)}`, action: () => this.cutAmulet(i) })),
      { label: 'Cerrar', action: null },
    ]);
  };
  P.cutAmulet = function (i) {
    const A = this.amulets[i], p = this.player;
    if ((A.cut || 0) >= 3) return this.toast('Ese amuleto ya está tallado al máximo');
    const gems = ['ambar', 'jade', 'perla', 'obsidiana', 'cristal', 'meteorito', 'coral'].filter((k) => p.inv[k] > 0);
    const total = gems.reduce((a, k) => a + p.inv[k], 0);
    if (total < 2) return this.toast('Necesitas 2 gemas');
    this.buy({ gold: 800 }, () => {
      let left = 2; for (const k of gems) { const t = Math.min(left, p.inv[k]); p.inv[k] -= t; left -= t; if (!left) break; }
      const k = 1.25 + this.jobLevel('joyero') * 0.005;
      for (const s of Object.keys(A.fx)) A.fx[s] *= k;
      A.cut = (A.cut || 0) + 1;
      this.jobXp('joyero', 60);
      p.recalc();
      this.toast(`💎 ${A.name} tallado ${'✦'.repeat(A.cut)}: ${this.amuletText(A)}`);
      sfx('coin');
      this.jewelMenu();
    });
  };

  // ============================================================ eventos de temporada
  P.festNow = function () { return ['carnaval', null, 'halloween', 'navidad'][this.season()]; };
  P.updateFest = function (dt) {
    const f = this.festNow();
    if (f !== this.festCur) {
      this.festCur = f;
      if (this.festGroup) { this.scene.remove(this.festGroup); this.festGroup = null; }
      if (f) { this.buildFest(f); this.toast({ halloween: '🎃 ¡Halloween pirata! Calabazas en Villarroca y fantasmas de noche (sueltan caramelos)', navidad: '🎄 ¡Navidad en Villarroca! Recoge tu regalo diario bajo el árbol', carnaval: '🎭 ¡Carnaval en Tortuga! Máscaras, confeti y baile' }[f], 'area'); }
    }
    if (f === 'navidad') { const p = this.player; if (Math.hypot(p.x - 50, p.z - 50) < 25 && !this.roomAt(p.x, p.z) && this.wx) this.forceSnow = true; }
    if (f === 'carnaval') {
      const R = this.islets.find((r) => r.id === 'tortuga');
      if (R) { if (Math.random() < dt * 2) this.ring(R.center.x + (Math.random() - 0.5) * 14, R.center.z + (Math.random() - 0.5) * 14, 0.6, [0xff4a8a, 0x4ad8ff, 0xffe04a, 0x7aff6a][Math.floor(Math.random() * 4)]); for (const n of this.npcs) if (!this.soc(n.id).crew && R.contains(Math.round(n.x), Math.round(n.z))) n.st.dance = true; }
    }
    if (f === 'halloween' && (this.tod >= 20 || this.tod < 5) && !(this.net.isClient && this.net.active)) {
      this.ghostT = (this.ghostT ?? 20) - dt;
      const p = this.player;
      if (this.ghostT <= 0 && Math.hypot(p.x - 50, p.z - 50) < 30) {
        this.ghostT = 25;
        for (let k = 0; k < 20; k++) { const x = p.tx + Math.round((Math.random() - 0.5) * 12), z = p.tz + Math.round((Math.random() - 0.5) * 12); if (this.W.walkable(x, z) && Math.hypot(x - p.x, z - p.z) > 4) { const e = this.spawnTemp('skeleton', x, z, Math.max(5, p.level - 2)); e.halloween = true; e.model.root.traverse((o) => { if (o.isMesh && o.material && o.material.color) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.6; } }); break; } }
      }
    }
  };
  P.buildFest = function (f) {
    const g = new THREE.Group(), M = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
    if (f === 'halloween') {
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, x = 50 + Math.cos(a) * 6, z = 50 + Math.sin(a) * 6; const pk = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), M(0xff8a1a, { emissive: 0x6a2a00 })); pk.scale.y = 0.8; pk.position.set(x, 0.22, z); g.add(pk); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.12, 5), M(0x3a6a2a)); st.position.set(x, 0.48, z); g.add(st); }
    } else if (f === 'navidad') {
      const tx = 54, tz = 47;
      for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.4 - i * 0.3, 1.1, 10), M(0x1a6a2a)); c.position.set(tx, 0.7 + i * 0.7, tz); g.add(c); }
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.25), new THREE.MeshBasicMaterial({ color: 0xffe040 })); star.position.set(tx, 3.5, tz); g.add(star);
      for (let i = 0; i < 16; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), new THREE.MeshBasicMaterial({ color: [0xff3a3a, 0xffe040, 0x3ab8ff][i % 3] })); const a = i * 1.7, h = 0.5 + (i % 8) * 0.35; b.position.set(tx + Math.cos(a) * (1.3 - h * 0.3), h, tz + Math.sin(a) * (1.3 - h * 0.3)); g.add(b); }
      for (let i = 0; i < 4; i++) { const box = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.4), M([0xd83a3a, 0x3a8ad8, 0xe0b040, 0x3ac87a][i])); box.position.set(tx - 0.8 + i * 0.5, 0.15, tz + 1.4); g.add(box); }
      this.W.setBlocked(tx, tz, 1);
    } else if (f === 'carnaval') {
      const R = this.islets.find((r) => r.id === 'tortuga');
      if (R) for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 5), M(0x8a6a44)); pole.position.set(R.center.x + Math.cos(a) * 7, 1.2, R.center.z + Math.sin(a) * 7); g.add(pole); const fl = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.4, 4), M([0xff4a8a, 0x4ad8ff, 0xffe04a][i % 3])); fl.position.set(pole.position.x, 2.5, pole.position.z); g.add(fl); }
    }
    this.scene.add(g); this.festGroup = g;
  };
  P.festGiftNear = function () { const p = this.player; return this.festCur === 'navidad' && Math.hypot(p.x - 54, p.z - 48.4) < 2 && this.flags.xmasDay !== this.day; };
  P.festGift = function () {
    this.flags.xmasDay = this.day;
    const pool = ['f_tarta', 'perla', 'goldore', 'potion', 'meteorito', 'cristal'];
    const it = pool[Math.floor(Math.random() * pool.length)];
    this.give(it, 1); this.player.gold += 200;
    if (!this.ownCos('c_gorro_navidad') && Math.random() < 0.35) this.give('c_gorro_navidad');
    this.toast(`🎁 ¡Regalo de Navidad! ${ITEMS[it].name} y 200 oro`, 'area');
    sfx('coin');
  };

  // ============================================================ pecios hundidos
  P.wreckSpots = WRECK_SPOTS;
  P.sailAction11 = function () {
    if (this.deck) return null;
    const b = this.boat;
    const w = WRECK_SPOTS.find((s) => Math.hypot(b.x - s.x, b.z - s.z) < 9);
    if (w) return { icon: '🔔', label: 'Pecio', fn: () => this.diveWreck() };
    return null;
  };
  P.diveWreck = function () {
    if (!this.flags.diveBell) return this.toast('Necesitas la campana de buceo (Astillera Marga)');
    const p = this.player, b = this.boat;
    this.diveFrom = { x: b.x, z: b.z, h: b.heading };
    this.deck = null; this.autoHelm = null; b.speed = 0; this.sailing = false;
    this.scene.add(p.model.root); p.model.root.rotation.set(0, 0, 0);
    p.x = this.wreck.exit.x + 1; p.z = this.wreck.exit.z; p.path = [];
    this.unboardCrew(p.x, p.z);
    this.camTarget.set(p.x, 0, p.z);
    this.oxy = 100;
    this.buildWreck();
    for (const c of this.wreck.chests) if (this.flags[c.id] && this.flags[c.id + '_day'] !== this.day) this.flags[c.id] = false;
    this.toast('🔔 Bajas al Pecio del Galeón Dorado... ¡cuidado con los tiburones!', 'area');
  };
  P.inWreck = function () { const r = this.W.regionAt(this.player.x, this.player.z); return r && r.id === 'pecio'; };
  P.buildWreck = function () {
    if (this.wreckBuilt) return;
    this.wreckBuilt = true;
    const R = this.wreck, g = new THREE.Group(), M = (c) => new THREE.MeshLambertMaterial({ color: c });
    const sand = new THREE.Mesh(new THREE.BoxGeometry(PW + 6, 0.2, PD + 6), M(0xb8a078)); sand.position.set(PX + PW / 2, -0.1, PZ + PD / 2); g.add(sand);
    const hull = new THREE.Group();
    const wood = M(0x4a3420);
    for (const z of [4, 9]) { const side = new THREE.Mesh(new THREE.BoxGeometry(7.5, 1.6, 0.4), wood); side.position.set(PX + 9, 0.8, PZ + z); side.rotation.z = (z === 4 ? 0.08 : -0.06); hull.add(side); }
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 5, 8), wood); mast.position.set(PX + 9, 1.5, PZ + 6.5); mast.rotation.z = 1.1; hull.add(mast);
    g.add(hull);
    for (const c of R.chests) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.5), M(0xd8a838)); b.position.set(c.x, 0.23, c.z); g.add(b); this.chests.push(c); }
    for (let i = 0; i < 40; i++) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8 + Math.random(), 0.02), M(0x2a8a4a)); w.position.set(PX + Math.random() * PW, 0.5, PZ + Math.random() * PD); g.add(w); }
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 1.4, 12, 1, true), new THREE.MeshLambertMaterial({ color: 0xd8a838, side: THREE.DoubleSide })); bell.position.set(R.exit.x, 0.7, R.exit.z); g.add(bell);
    this.scene.add(g);
  };

  // ============================================================ defensa del puerto con cañones
  P.updatePortRaid = function (dt) {
    const R = this.ownPort, p = this.player;
    if (!R || this.portLevel() < 1) return;
    const onIt = !this.sailing && R.contains(Math.round(p.x), Math.round(p.z));
    if (!this.praid && onIt && this.flags.portRaidDay !== this.day && !(this.net.isClient && this.net.active)) {
      this.flags.portRaidDay = this.day;
      if (Math.random() < 0.6) this.startPortRaid();
    }
    const Rd = this.praid;
    if (!this.portCannons) this.buildPortCannons();
    if (!Rd) return;
    if (!onIt) { for (const s of Rd.ships) this.scene.remove(s.mesh); this.praid = null; const el = document.getElementById('eventBanner'); if (el) el.classList.add('hidden'); return this.toast('🏴 Abandonas el puerto... los piratas saquean los impuestos'), (this.flags.portDay = this.day); }
    const c = R.center, el = document.getElementById('eventBanner');
    let alive = 0;
    for (const s of Rd.ships) {
      if (s.dead) { s.mesh.position.y -= dt * 0.6; continue; }
      alive++;
      const d = Math.hypot(s.x - c.x, s.z - c.z);
      if (d > 17) { s.x += ((c.x - s.x) / d) * dt * 2; s.z += ((c.z - s.z) / d) * dt * 2; }
      s.mesh.position.set(s.x, -0.05, s.z); s.mesh.rotation.y = Math.atan2(c.x - s.x, c.z - s.z);
      s.cd -= dt;
      if (s.cd <= 0 && d < 19) { s.cd = 4; const x = c.x + (Math.random() - 0.5) * 10, z = c.z + (Math.random() - 0.5) * 10; this.ring(x, z, 1.6, 0xff6020); setTimeout(() => { this.ring(x, z, 2, 0xffa040); this.camShake = 0.2; if (Math.hypot(p.x - x, p.z - z) < 2) this.damagePlayer({ x, z }, 20 + p.level * 2); Rd.hp -= 6; }, 1000); }
    }
    if (el) { el.classList.remove('hidden'); el.textContent = `🏴 Defensa del puerto · barcos: ${alive} · muralla ${Math.max(0, Math.round(Rd.hp))}%`; }
    if (Rd.hp <= 0) { for (const s of Rd.ships) this.scene.remove(s.mesh); this.praid = null; if (el) el.classList.add('hidden'); this.flags.portDay = this.day; return this.toast('💥 Los piratas han saqueado tu puerto (pierdes los impuestos acumulados)', 'area'); }
    if (!alive) { this.praid = null; if (el) el.classList.add('hidden'); const gold = 1500 + this.portLevel() * 500; p.gold += gold; this.stats.portDef = (this.stats.portDef || 0) + 1; this.toast(`🏴 ¡Has defendido tu puerto! +${gold} oro`, 'area'); sfx('quest'); setTimeout(() => { for (const s of Rd.ships) this.scene.remove(s.mesh); }, 3000); }
  };
  P.buildPortCannons = function () {
    const R = this.ownPort, c = R.center;
    this.portCannons = [];
    for (const [dx, dz] of [[-5, 6], [5, 6], [-6, -5], [6, -5]]) {
      const x = c.x + dx, z = c.z + dz; if (!R.walkable(x, z)) continue;
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.8), new THREE.MeshLambertMaterial({ color: 0x5a3a1a })); base.position.y = 0.15; g.add(base);
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.9, 10), new THREE.MeshLambertMaterial({ color: 0x2a2a2a })); tube.rotation.x = Math.PI / 2; tube.position.set(0, 0.45, 0.2); g.add(tube);
      g.position.set(x, 0, z); g.rotation.y = Math.atan2(dx, dz);
      this.scene.add(g); R.setBlocked(x, z, 1);
      this.portCannons.push({ x, z, g, cd: 0 });
    }
  };
  P.startPortRaid = function () {
    const R = this.ownPort, c = R.center, ships = [], n = 2 + Math.min(3, this.portLevel());
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.4, x = c.x + Math.cos(a) * 32, z = c.z + Math.sin(a) * 32;
      const mesh = makeShip(this.M, this.texSet); mesh.scale.setScalar(0.85);
      mesh.traverse((o) => { if (o.userData.sail) o.material = new THREE.MeshLambertMaterial({ color: 0x2a2a2a, side: THREE.DoubleSide }); });
      this.scene.add(mesh);
      ships.push({ x, z, mesh, hp: 3, cd: 3 + i, dead: false });
    }
    this.praid = { ships, hp: 100 };
    this.toast('🏴‍☠️ ¡Piratas atacan tu puerto! Usa los cañones de la orilla', 'area');
    sfx('quest');
  };
  P.cannonNear = function () { const p = this.player; return (this.portCannons || []).find((k) => Math.hypot(k.x - p.x, k.z - p.z) < 1.8) || null; };
  P.fireLandCannon = function (k) {
    const Rd = this.praid; if (!Rd) return;
    if (this.time < k.cd) return this.toast('El cañón se está recargando');
    k.cd = this.time + 2.5;
    let best = null, bd = 42;
    for (const s of Rd.ships) if (!s.dead) { const d = Math.hypot(s.x - k.x, s.z - k.z); if (d < bd) { bd = d; best = s; } }
    if (!best) return;
    this.navalInit(); this.puff(k.x, 0.8, k.z, 0xd8d0c0);
    sfx('cannon'); this.camShake = 0.2;
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshLambertMaterial({ color: 0x1a1a1a })); this.scene.add(ball);
    const t0 = performance.now(), sx = k.x, sz = k.z, tx = best.x, tz = best.z;
    const fly = () => { const e = Math.min(1, (performance.now() - t0) / 800); ball.position.set(sx + (tx - sx) * e, 0.8 + Math.sin(e * Math.PI) * 3, sz + (tz - sz) * e); if (e < 1) requestAnimationFrame(fly); else { this.scene.remove(ball); if (Math.random() < 0.8) { best.hp--; this.puff(tx, 1, tz, 0xff9a40, true); if (best.hp <= 0 && !best.dead) { best.dead = true; this.toast('💥 ¡Barco pirata hundido!'); } } else this.puff(tx, 0, tz, 0xeaf8fa); } };
    fly();
  };

  // ============================================================ rasgos de la tripulación
  P.traitOf = function (n) { const s = this.soc(n.id); if (!s.trait) s.trait = TRAIT_KEYS[hash(n.id) % TRAIT_KEYS.length]; return s.trait; };
  const baseMul = P.crewDmgMul;
  P.crewDmgMul = function (n) { return baseMul.call(this, n) * (this.traitOf(n) === 'valiente' ? 1.15 : 1); };
  const baseStats = P.compStats;
  P.compStats = function (n) { const before = n.cKey; baseStats.call(this, n); if (n.cKey !== before && this.traitOf(n) === 'fuerte') { n.cmax = Math.round(n.cmax * 1.2); if (n.chp > n.cmax) n.chp = n.cmax; } };
  const baseHurt = P.hurtCompanion;
  P.hurtCompanion = function (n, atk, e) { if (this.traitOf(n) === 'cobarde' && Math.random() < 0.2) { this.ui.float('¡Esquiva!', 'info', n.x, n.model.height + 0.4, n.z); return; } return baseHurt.call(this, n, atk, e); };
  const baseTick = P.companionTick;
  P.companionTick = function (n, dt) {
    const tr = this.traitOf(n);
    if (tr === 'valiente') n.retreatT = 0;
    if (tr === 'cobarde' && n.cmax && n.chp < n.cmax * 0.4 && !n.retreatT && !n.ko) n.retreatT = 3;
    if (tr === 'gloton' && n.potT && this.time - n.potT < 0.06) n.chp = Math.min(n.cmax, n.chp + n.cmax * 0.3);
    return baseTick.call(this, n, dt);
  };
  const baseXp = P.crewGainXp;
  P.crewGainXp = function (xp) { const k = this.crew().some((n) => this.traitOf(n) === 'sabio' && !this.soc(n.id).role) ? 1.1 : 1; return baseXp.call(this, xp * k); };
  P.traitChat = function (dt) {
    this.trT = (this.trT ?? 25) - dt;
    if (this.trT > 0) return;
    this.trT = 30 + Math.random() * 30;
    const list = this.activeCrew().filter((n) => n.model.root.visible && !n.ko);
    const n = list[Math.floor(Math.random() * list.length)];
    if (!n) return;
    const T2 = TRAITS[this.traitOf(n)];
    this.ui.float(T2.lines[Math.floor(Math.random() * T2.lines.length)], 'chat', n.x, n.model.height + 0.5, n.z);
    if (this.traitOf(n) === 'afortunado' && Math.random() < 0.5) { const g = 10 + Math.floor(Math.random() * 40); this.player.gold += g; this.ui.float(`🍀 +${g} oro`, 'gold', n.x, n.model.height + 0.8, n.z); }
  };

  // ============================================================ mapa del mundo que se revela
  P.mapReveal = function () {
    if (!this.wmap || this.wmap.length !== MW * MH) this.wmap = new Array(MW * MH).fill(0);
    const p = this.player, x = this.sailing ? this.boat.x : p.x, z = this.sailing ? this.boat.z : p.z;
    if (x < MAP.x0 || z < MAP.z0 || x > MAP.x1 || z > MAP.z1) return;
    const cx = Math.floor((x - MAP.x0) / MAP.c), cz = Math.floor((z - MAP.z0) / MAP.c), r = 3;
    for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) { if (dx * dx + dz * dz > r * r + 1) continue; const i = cx + dx, j = cz + dz; if (i >= 0 && j >= 0 && i < MW && j < MH) this.wmap[j * MW + i] = 1; }
  };
  P.openWorldMap = function () {
    this.mapReveal();
    const pct = Math.round((this.wmap.filter(Boolean).length / this.wmap.length) * 100);
    this.panels.show('wmap', `🗺 Mapa del mundo · explorado ${pct}%`, `<canvas id="wmapC" width="${MW * 6}" height="${MH * 6}" style="width:100%;max-width:520px;display:block;margin:0 auto;border-radius:8px;border:2px solid #5a3a1a"></canvas><p class="muted small">El mapa se dibuja solo a medida que exploras. 🔴 tú · ⛵ tu barco.</p>`, true);
    const cv = document.getElementById('wmapC'); if (!cv) return;
    const ctx = cv.getContext('2d'), S = 6;
    ctx.fillStyle = '#d8c49a'; ctx.fillRect(0, 0, cv.width, cv.height);
    const col = { [T.WATER]: '#3a7ab0', [T.SAND]: '#e8d49a', [T.GRASS]: '#5aa84a', [T.DIRT]: '#9a7a4a', [T.STONE]: '#9a9a9a', [T.DOCK]: '#8a6a44', [T.FIELD]: '#c8b048', [T.DARK]: '#3a7a3a', [T.ROCK]: '#6a6a6a', [T.LAVA]: '#e04a1a', [T.SNOW]: '#f4f8fc', [T.CANDY]: '#f4a8c8', [T.METAL]: '#7a7c84' };
    for (let j = 0; j < MH; j++) for (let i = 0; i < MW; i++) {
      if (!this.wmap[j * MW + i]) { if ((i + j) % 2) { ctx.fillStyle = 'rgba(120,90,50,0.12)'; ctx.fillRect(i * S, j * S, S, S); } continue; }
      const t = this.W.tileAll(Math.round(MAP.x0 + i * MAP.c + 3), Math.round(MAP.z0 + j * MAP.c + 3));
      ctx.fillStyle = col[t] || '#3a7ab0'; ctx.fillRect(i * S, j * S, S, S);
    }
    ctx.font = 'bold 11px serif'; ctx.fillStyle = '#2a1a0a'; ctx.textAlign = 'center';
    const lab = (name, x, z) => { const i = Math.floor((x - MAP.x0) / MAP.c), j = Math.floor((z - MAP.z0) / MAP.c); if (i >= 0 && j >= 0 && i < MW && j < MH && this.wmap[j * MW + i]) ctx.fillText(name, i * S + 3, j * S - 2); };
    lab('Isla Bruma', 50, 40);
    for (const r of this.islets) if (!r.ghost) lab(r.name, r.center.x, r.center.z - 8);
    const dot = (x, z, c, rad) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(((x - MAP.x0) / MAP.c) * S, ((z - MAP.z0) / MAP.c) * S, rad, 0, Math.PI * 2); ctx.fill(); };
    if (!this.sailing) dot(this.boat.x, this.boat.z, '#5a3a1a', 4);
    const p = this.player; dot(this.sailing ? this.boat.x : p.x, this.sailing ? this.boat.z : p.z, '#e02a2a', 5);
  };

  // ============================================================ la Leyenda de la Bruma
  P.legendFrags = function () { return Object.keys(LEGEND_FRAGS).filter((k) => (this.legend || {})[k]); };
  P.legendMenu = function () {
    const have = this.legendFrags();
    const lines = Object.entries(LEGEND_FRAGS).map(([k, name]) => `${(this.legend || {})[k] ? '✅' : '▫️'} ${name} (${(this.ENEMY_DEF[k] || {}).name || k})`);
    const opts = [];
    if (have.length >= 5 && !this.flags.legendDone && !this.finalBoss) opts.push({ label: '👑 Unir la Corona de la Bruma y llamar al Rey', action: () => this.summonFinal() });
    opts.push({ label: 'Cerrar', action: null });
    this.ui.openDialog('📜 La Leyenda de la Bruma', `${this.flags.legendDone ? '¡Ya eres la Leyenda de la Bruma!<br><br>' : 'Hace siglos, el Rey de la Bruma dividió su corona en cinco fragmentos y los escondió en las islas más peligrosas. Quien los reúna podrá enfrentarse a él.<br><br>'}${lines.join('<br>')}`, opts);
  };
  P.summonFinal = function () {
    const p = this.player;
    p.x = 50; p.z = 56; p.path = []; this.camTarget.set(50, 0, 56);
    const e = this.spawnTemp('rey_bruma', 50, 50, 100);
    e.provoked = true; e.state = 'chase';
    this.finalBoss = e;
    for (let i = 0; i < 10; i++) setTimeout(() => this.ring(50 + (Math.random() - 0.5) * 8, 50 + (Math.random() - 0.5) * 8, 1.5, 0x5a2a8a), i * 150);
    this.ui.openDialog('👑 El Rey de la Bruma', '«¿Quién osa reunir mi corona? ¡La bruma devorará estas islas... y a ti con ellas!»', [{ label: '⚔️ ¡Por todas las islas!', action: null }]);
    this.camShake = 0.6;
    sfx('hurt');
  };
  P.updateLegend = function () {
    const e = this.finalBoss;
    if (!e) return;
    if (this.player.dead) { if (!e.removed) e.remove(); this.finalBoss = null; return this.toast('👑 El Rey de la Bruma se desvanece... reúne fuerzas e inténtalo de nuevo'); }
    if (!e.dead) {
      // fases: a 66% y 33% llama a sus generales
      const k = e.hp / e.maxHp;
      if (k < 0.66 && !e.ph1) { e.ph1 = true; for (const t of ['reina_hielo', 'rey_pastel']) { const s = this.spawnTemp(t, 47 + Math.random() * 6, 47 + Math.random() * 4, 90); s.maxHp = Math.round(s.maxHp * 0.25); s.hp = s.maxHp; } this.toast('👑 «¡Generales, a mí!»', 'area'); }
      if (k < 0.33 && !e.ph2) { e.ph2 = true; for (const t of ['gran_automata', 'sombra_abismo']) { const s = this.spawnTemp(t, 47 + Math.random() * 6, 47 + Math.random() * 4, 95); s.maxHp = Math.round(s.maxHp * 0.25); s.hp = s.maxHp; } this.toast('👑 «¡La bruma es eterna!»', 'area'); }
      return;
    }
    this.finalBoss = null;
    this.flags.legendDone = true;
    this.give('c_corona_bruma'); this.player.gold += 50000; this.give('ficha', 30);
    this.title = 'Leyenda de la Bruma'; this.applyTitle && this.applyTitle();
    for (const n of this.crew()) if (this.crewMemory) this.crewMemory(n, '¡Vencimos al Rey de la Bruma! Las islas cantarán nuestra historia para siempre.');
    this.ui.openDialog('🌅 La bruma se disipa', `El Rey de la Bruma cae y la niebla que cubría las islas se disipa por primera vez en siglos.<br><br>Marisol, Nerea, Mara, Ixa, Brasa y todos los vecinos celebran tu nombre: ${this.player.name}, la Leyenda de la Bruma.<br><br>🏆 Corona de la Bruma · título «Leyenda de la Bruma» · 50000 oro · 30 🎟<br><br>Gracias por jugar. La aventura continúa...`, [{ label: '🌅 Seguir navegando', action: null }]);
    sfx('level');
  };

  // ============================================================ enganches
  const baseDmg = P.damageEnemy;
  P.damageEnemy = function (e, dmg, crit, byCrew, killerId = 0) {
    const was = !e.dead;
    const r = baseDmg.call(this, e, dmg, crit, byCrew, killerId);
    if (was && e.dead) {
      if (LEGEND_FRAGS[e.type]) { this.legend = this.legend || {}; if (!this.legend[e.type]) { this.legend[e.type] = true; this.toast(`📜 ¡${LEGEND_FRAGS[e.type]} de la Corona de la Bruma! (${this.legendFrags().length}/5)`, 'area'); sfx('quest'); } }
      if (e.halloween) { this.give('caramelo', 1 + Math.floor(Math.random() * 2), e.x, e.z); }
    }
    return r;
  };
  P.npcDialog11 = function (id, opts) {
    if (id === 'mambe' || id === 'volta') opts.push({ label: '⚗️ Alquimia: elixires', action: () => this.alchemyMenu() });
    if (id === 'tadeo' || id === 'helga') opts.push({ label: '💎 Joyería: tallar amuleto', action: () => this.jewelMenu() });
    if (id === 'marisol') { opts.push({ label: `📜 La Leyenda de la Bruma (${this.legendFrags().length}/5)`, action: () => this.legendMenu() }); if (this.festCur === 'halloween') opts.push({ label: `🎃 Cambiar 10 caramelos por un disfraz (tienes ${this.player.inv.caramelo || 0})`, action: () => this.buy({ caramelo: 10 }, () => this.give(this.ownCos('c_mascara_calabaza') ? 'c_disfraz_fantasma' : 'c_mascara_calabaza')) }); }
    if (id === 'mara' && this.festCur === 'carnaval' && !this.ownCos('c_mascara_carnaval')) opts.push({ label: '🎭 Máscara de carnaval (300 oro)', action: () => this.buy({ gold: 300 }, () => this.give('c_mascara_carnaval')) });
    if (this.owned && Object.keys(this.owned).length && this.isleOf(this.player.x, this.player.z) in this.owned) opts.push({ label: '🏴 Cobrar el tributo de tus islas', action: () => this.collectTribute() });
    const s = this.soc(id);
    if (s.crew || s.partner) { const n = this.npcById(id), T2 = TRAITS[this.traitOf(n)]; opts.push({ label: `${T2.icon} Rasgo: ${T2.name}`, action: () => this.ui.openDialog(n.name, `${T2.icon} ${T2.name}: ${T2.desc}.`, [{ label: 'Vale', action: null }]) }); }
    return null;
  };
  P.contextAction11 = function () {
    if (this.sailing) return null;
    const p = this.player;
    if (this.inWreck() && Math.hypot(p.x - this.wreck.exit.x, p.z - this.wreck.exit.z) < 1.8) return { icon: '🔔', label: 'Subir', fn: () => this.surface() };
    const k = this.praid && this.cannonNear(); if (k) return { icon: '💣', label: 'Cañón', fn: () => this.fireLandCannon(k) };
    if (this.festGiftNear()) return { icon: '🎁', label: 'Regalo', fn: () => this.festGift() };
    return null;
  };
  P.updateMore11 = function (dt) {
    this.updateConquest(dt);
    this.updateFest(dt);
    this.updatePortRaid(dt);
    this.traitChat(dt);
    this.updateLegend();
    this.m11T = (this.m11T || 0) - dt;
    if (this.m11T <= 0) { this.m11T = 0.5; this.mapReveal(); }
  };
  P.newsHtml11 = function () {
    const C = Object.values(this.conq || {});
    return `<div class="sub">🆕 v3.9</div><ul class="qlist">
      <li>🏴‍☠️ <b>Islas conquistadas</b>: ${C.length ? C.map((c) => `${c.name} tiene ${c.isle}`).join(', ') : 'ahora mismo ninguna'}.</li>
      <li>⚗️ <b>Alquimia y joyería</b>: elixires con Mambé o Volta, tallar amuletos con Tadeo o Helga. Oficios nuevos: Alquimista y Joyero.</li>
      <li>🎉 <b>Temporada</b>: ${{ halloween: '🎃 Halloween pirata', navidad: '🎄 Navidad', carnaval: '🎭 Carnaval en Tortuga' }[this.festCur] || 'verano, sin fiesta (en otoño Halloween, en invierno Navidad, en primavera Carnaval)'}.</li>
      <li>🔔 <b>Pecios hundidos</b>: puntos azules oscuros en el minimapa; bucea con la campana.</li>
      <li>💣 <b>Defensa del puerto</b>: en tu puerto pueden atacarte piratas; dispara los cañones de la orilla.</li>
      <li>🎭 <b>Rasgos de la tripulación</b>: valiente, cobarde, glotón, afortunado, sabio o fuerte.</li>
      <li>🗺 <b>Mapa del mundo</b> (⚡ Atajos › Mapa): explorado ${this.wmap ? Math.round((this.wmap.filter(Boolean).length / this.wmap.length) * 100) : 0}%.</li>
      <li>👑 <b>Leyenda de la Bruma</b> (Marisol): fragmentos ${this.legendFrags().length}/5${this.flags.legendDone ? ' · ¡COMPLETADA!' : ''}.</li></ul>`;
  };
}

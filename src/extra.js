// v2.6: oficios y tablón de trabajos, armario de cosméticos, superjefes (Serafín, Dragón, Leviatán),
// barcos comprables y decorables, llamar al barco, camarote decorable y eventos del mundo.
import * as THREE from 'three';
import { mulberry32 } from './rng.js';
import { furniture } from './interiors.js';

// ---------------------------------------------------------------- oficios
export const JOBS = {
  lenador: { name: 'Leñador', icon: '🪓', perk: 'Madera doble' },
  minero: { name: 'Minero', icon: '⛏️', perk: 'Más menas' },
  pescador: { name: 'Pescador', icon: '🎣', perk: 'Capturas raras' },
  cocinero: { name: 'Cocinero', icon: '🍳', perk: 'Platos extra' },
  herrero: { name: 'Herrero', icon: '⚒️', perk: 'Forja más barata' },
  cazador: { name: 'Cazador', icon: '🏹', perk: 'Más botín' },
  marinero: { name: 'Marinero', icon: '⚓', perk: 'Cañones más fuertes' },
  constructor: { name: 'Constructor', icon: '🔨', perk: 'Estructuras más fuertes' },
  granjero: { name: 'Granjero', icon: '🌾', perk: 'Cosechas extra' },
};
export const JOB_MAX = 30;
const jobNeed = (l) => 20 + l * 18;

export const SHIP_TYPES = {
  gaviota: { name: 'Gaviota Negra (fragata)', price: 0, hp: 1, guns: 0, speed: 1, scale: 1 },
  balandra: { name: 'Balandra veloz', price: 1500, hp: 0.8, guns: -1, speed: 1.3, scale: 0.88 },
  bergantin: { name: 'Bergantín de guerra', price: 4000, hp: 1.25, guns: 1, speed: 1.05, scale: 1.1 },
  galeon: { name: 'Galeón del tesoro', price: 12000, hp: 1.7, guns: 2, speed: 0.88, scale: 1.28 },
};
const SAILS = [0xf2ead6, 0x1a1a1a, 0xa01a1a, 0x2a4a9a, 0x2a7a4a, 0x6a2a8a, 0xe0b040, 0xf0f0f4];
const HULLS = [0x6a4024, 0x3a2414, 0x8a2a1a, 0x1a2a4a, 0x2a4a2a, 0xd8d0c0];
const FLAGS = [0x111111, 0xa01a1a, 0x2a4a9a, 0xe0b040, 0x6a2a8a];
const HEADS = ['ninguno', 'sirena', 'dragón', 'águila'];
export const DECOR = [
  { t: 'bed', name: 'Cama', price: 80 }, { t: 'table', name: 'Mesa', price: 60 }, { t: 'chair', name: 'Silla', price: 30 },
  { t: 'chest', name: 'Cofre', price: 120 }, { t: 'plant', name: 'Planta', price: 40 }, { t: 'painting', name: 'Cuadro', price: 150, wall: true },
  { t: 'rug', name: 'Alfombra', price: 70, flat: true }, { t: 'bookshelf', name: 'Estantería', price: 120 }, { t: 'barrel', name: 'Barril', price: 20 },
  { t: 'banner', name: 'Estandarte', price: 90, wall: true }, { t: 'weaponrack', name: 'Armero', price: 150 }, { t: 'fireplace', name: 'Chimenea (cocina)', price: 300 },
  { t: 'map', name: 'Mapa del tesoro', price: 110, wall: true }, { t: 'anchor', name: 'Ancla decorativa', price: 60 }, { t: 'wheel', name: 'Timón de pared', price: 70, wall: true },
];
const EVENT_COS = ['c_capucha_negra', 'c_yelmo_cuernos', 'c_parche_oro', 'c_casaca_morada', 'c_tunica_mago', 'c_kimono', 'c_armadura_negra', 'c_harapos', 'c_capa_oro', 'c_capa_jade', 'c_capa_lava', 'c_alas_murcielago'];

export { EVENT_COS };
export function installExtra(Game, D) {
  const P = Game.prototype;
  const sfx = D.sfx;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ============================================================ oficios
  P.job = function (id) { this.jobs = this.jobs || {}; if (!Object.prototype.hasOwnProperty.call(this.jobs, id)) this.jobs[id] = { l: 0, xp: 0 }; return this.jobs[id]; };
  P.jobXp = function (id, n) {
    const j = this.job(id);
    if (j.l >= JOB_MAX) return;
    j.xp += n;
    while (j.l < JOB_MAX && j.xp >= jobNeed(j.l)) {
      j.xp -= jobNeed(j.l); j.l++;
      this.toast(`${JOBS[id].icon} ${JOBS[id].name} nivel ${j.l} · +0,5% de daño`, 'area');
      sfx('level');
    }
  };
  P.jobLevel = function (id) { return (this.jobs && Object.prototype.hasOwnProperty.call(this.jobs, id) && this.jobs[id].l) || 0; };
  P.jobDmg = function () { let t = 0; for (const id of Object.keys(JOBS)) t += this.jobLevel(id); return 1 + t * 0.005; };

  // ---- tablón de trabajos (3 por día)
  P.contracts = function () {
    if (this.jobBoard && this.jobBoard.day === this.day) return this.jobBoard.list;
    const rnd = mulberry32(this.day * 7919 + 13);
    const L = this.player.level;
    const killPool = L < 8 ? ['wolf', 'boar', 'crab'] : L < 15 ? ['boar', 'skeleton', 'crab'] : L < 22 ? ['scorpion', 'skeleton', 'golem'] : L < 32 ? ['tiger', 'bat', 'pirate', 'marine'] : ['skull', 'golem_obs', 'pirate', 'marine'];
    const gather = [['wood', 15, 'lenador'], ['stone', 12, 'minero'], ['fish', 6, 'pescador'], ['iron', 6, 'minero'], ['leather', 4, 'cazador']];
    const kinds = ['gather', 'kill', 'cook', 'ship', 'kill', 'gather', 'build'];
    const list = [];
    const used = new Set();
    while (list.length < 3) {
      const k = kinds[Math.floor(rnd() * kinds.length)];
      if (used.has(k) && k !== 'gather') continue;
      used.add(k);
      const pay = Math.round((40 + L * 6) * (0.8 + rnd() * 0.5));
      if (k === 'gather') { const g = gather[Math.floor(rnd() * gather.length)]; list.push({ k, target: g[0], n: g[1], job: g[2], p: 0, gold: pay, tok: 1, txt: `Entrega ${g[1]} ${D.ITEMS[g[0]].name.toLowerCase()}` }); }
      else if (k === 'kill') { const t = killPool[Math.floor(rnd() * killPool.length)]; const n = 5 + Math.floor(rnd() * 4); list.push({ k, target: t, n, job: 'cazador', p: 0, gold: pay, tok: 2, txt: `Derrota ${n} × ${this.ENEMY_DEF[t].name}` }); }
      else if (k === 'cook') list.push({ k, target: 'cook', n: 3, job: 'cocinero', p: 0, gold: pay, tok: 1, txt: 'Cocina 3 platos' });
      else if (k === 'ship') list.push({ k, target: 'ship', n: 2, job: 'marinero', p: 0, gold: pay * 2, tok: 3, txt: 'Hunde 2 barcos enemigos' });
      else if (k === 'build') list.push({ k, target: 'build', n: 2, job: 'constructor', p: 0, gold: pay, tok: 1, txt: 'Construye 2 estructuras' });
    }
    this.jobBoard = { day: this.day, list };
    return list;
  };
  P.contractTick = function (k, target) {
    for (const c of this.contracts()) {
      if (c.done || c.k !== k || (c.target !== target && k === 'kill')) continue;
      if (c.p < c.n) { c.p++; if (c.p === c.n) this.toast(`🛠 Trabajo listo: ${c.txt} (Bitácora › Oficios)`); }
    }
  };
  P.contractReady = function (c) { return c.k === 'gather' ? (this.player.inv[c.target] || 0) >= c.n : c.p >= c.n; };
  P.claimContract = function (i) {
    const c = this.contracts()[i], p = this.player;
    if (!c || c.done || !this.contractReady(c)) return;
    if (c.k === 'gather') p.inv[c.target] -= c.n;
    c.done = true;
    p.gold += c.gold;
    this.give('ficha', c.tok);
    this.jobXp(c.job, 40);
    p.gainXp(30 + p.level * 8);
    this.toast(`🛠 ¡Trabajo cumplido! +${c.gold} oro, +${c.tok} 🎟`);
    sfx('coin');
  };

  // ---- pesca
  P.nearWater = function () {
    const p = this.player;
    if (this.sailing || this.W.isInterior(p.x)) return false;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) if (this.W.isWater(p.tx + dx, p.tz + dz)) return true;
    return false;
  };
  P.startFishing = function () {
    const p = this.player;
    if (this.fishing) return;
    p.path = []; p.target = null;
    this.fishing = { t: 2 + Math.random() * 3 };
    p.st.gather = 1;
    this.toast('🎣 Lanzas el sedal...');
  };
  P.updateFishing = function (dt) {
    if (!this.fishing) return;
    const p = this.player;
    if (p.st.moving || this.joyVector() || p.dead) { this.fishing = null; p.st.gather = 0; return; }
    p.st.gatherPhase = Math.sin(this.time * 2) * 0.4;
    this.fishing.t -= dt;
    if (this.fishing.t > 0) return;
    this.fishing = null; p.st.gather = 0;
    const L = this.jobLevel('pescador');
    const r = Math.random();
    if (r < 0.006 + L * 0.0005) { this.give(EVENT_COS[Math.floor(Math.random() * EVENT_COS.length)], 1, p.x, p.z); this.toast('🎣 ¡Has pescado un baúl con ropa!'); }
    else if (r < 0.04 + L * 0.003) { this.give('perla', 1, p.x, p.z); this.toast('🎣 ¡Una perla!'); }
    else if (r < 0.08 + L * 0.002) { const g = 20 + Math.floor(Math.random() * 40) + L * 3; p.gold += g; this.toast(`🎣 Una bolsa vieja: +${g} oro`); }
    else { this.give('fish', 1 + (Math.random() < L * 0.02 ? 1 : 0), p.x, p.z); }
    this.jobXp('pescador', 8);
    this.contractTick('fish', 'fish');
    sfx('coin');
  };

  // ============================================================ armario de cosméticos
  P.ownCos = function (id) { this.wardrobe = this.wardrobe || []; return this.wardrobe.includes(id); };
  P.addCos = function (id) {
    this.wardrobe = this.wardrobe || [];
    if (this.wardrobe.includes(id)) { const v = D.ITEMS[id].value; this.player.gold += v; this.toast(`👕 Ya tenías ${D.ITEMS[id].name}: +${v} oro`); return; }
    this.wardrobe.push(id);
    this.toast(`👕 ¡Nuevo cosmético en tu armario: ${D.ITEMS[id].icon} ${D.ITEMS[id].name}!`, 'area');
    sfx('quest');
  };
  P.equipCos = function (id) {
    const p = this.player, e = D.EQUIP[id];
    if (!e || !this.ownCos(id)) return;
    p.equip[e.slot] = id;
    p.refreshLook();
  };
  P.migrateCos = function () {
    const p = this.player;
    this.wardrobe = this.wardrobe || [];
    for (const [id, n] of Object.entries(p.inv)) if (n > 0 && D.EQUIP[id] && D.EQUIP[id].cos) { if (!this.wardrobe.includes(id)) this.wardrobe.push(id); p.inv[id] = 0; }
    for (const s of ['cosHead', 'cosBody', 'cosCape']) if (p.equip[s] && !this.wardrobe.includes(p.equip[s])) this.wardrobe.push(p.equip[s]);
  };
  P.cosPrice = function (id) { const t = D.EQUIP[id].tier || 0; return { tok: [3, 4, 6, 9, 12, 15, 20][t], gold: [80, 150, 300, 600, 1200, 2000, 4000][t] }; };

  // ============================================================ superjefes
  P.superScale = function () {
    // cuantos más aliados luchan, más vida tiene el jefe (3 o 10 tripulantes deben poder competir)
    const allies = this.boarding ? this.npcs.filter((n) => !n.onShip && this.soc(n.id).crew && n.model.root.visible && n.x >= 1690).length : this.activeCrew().length;
    return 1 + allies * 0.22;
  };
  P.crewScale = function () {
    if (!this.boarding) return 1;
    const n = this.npcs.filter((k) => this.soc(k.id).crew && k.x >= 1690).length;
    return n > 3 ? 3 / n : 1;
  };
  D.Enemy.prototype.superTick = function (dt) {
    const g = this.g, p = g.enemyTarget(this);
    if (this.dead || !this.hostile() || this.state !== 'chase') return;
    if (!this.scaled) { this.scaled = true; const k = g.superScale(); this.maxHp = Math.round(this.maxHp * k); this.hp = this.maxHp; }
    this.sAtk = (this.sAtk ?? 4) - dt;
    if (this.sAtk <= 0 && this.dist(p) < 9) {
      this.sAtk = this.def.super === 'leviathan' ? 5 : 6.5;
      // ataque de área anunciado: aparece el círculo y estalla al segundo
      const x = p.x, z = p.z, r = this.def.super === 'dragon' ? 2.8 : 2.4;
      const col = { dragon: 0xff4010, serafin: 0xffe060, leviathan: 0x3a2a6a, crypt: 0x7aff8a, ghost: 0x7af0e0, abyss: 0x3ad8ff }[this.def.super];
      g.ring(x, z, r * 0.8, col);
      g.ui.float({ dragon: '¡Aliento de fuego!', serafin: '¡Juicio de luz!', leviathan: '¡Tinta abisal!', crypt: '¡Maldición de la cripta!', ghost: '¡Lamento espectral!', abyss: '¡Remolino abisal!' }[this.def.super], 'crit', this.x, this.model.height + 0.6, this.z);
      this.st.attackT = 0.32;
      setTimeout(() => {
        if (this.dead) return;
        g.ring(x, z, r, col);
        g.camShake = 0.3;
        if (!p.dead && Math.hypot(p.x - x, p.z - z) < r) { if (p.isRemote) g.net.hurtRemote(p.id, this.atk * 2.2, this.idx); else g.damagePlayer(this, this.atk * 2.2); }
        for (const n of g.npcs) if (!n.onShip && g.soc(n.id).crew && Math.hypot(n.x - x, n.z - z) < r) g.ui.float('¡Ay!', 'dmg', n.x, 1.4, n.z);
      }, 1000);
    }
    // a media vida llama refuerzos y se enfurece
    if (!this.enraged && this.hp < this.maxHp * 0.5) {
      this.enraged = true;
      this.speed *= 1.25;
      const minion = { dragon: 'skull', serafin: 'skeleton', leviathan: null, crypt: 'skeleton', ghost: 'skull', abyss: 'jelly' }[this.def.super];
      g.toast(`⚠️ ¡${this.def.name} se enfurece!`, 'area');
      if (minion) for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2, x = Math.round(this.x + Math.cos(a) * 2.5), z = Math.round(this.z + Math.sin(a) * 2.5);
        if (g.W.walkable(x, z)) g.spawnTemp(minion, x, z, Math.max(30, Math.round(p.level * 0.85)));
      }
    }
  };

  // ---- Leviatán Abisal: atrapa el barco; luchas en cubierta con toda la tripulación
  P.leviathanAttack = function () {
    if (this.boarding || !this.sailing) return;
    this.buildArena();
    const R = this.arena, p = this.player;
    for (let z = 0; z < R.D; z++) for (let x = 7; x < R.W; x++) R.tiles[z * R.W + x] = 0;
    for (const z of [6, 7]) R.tiles[z * R.W + 6] = 0;
    this.arenaShipB.visible = false;
    this.boat.speed = 0;
    this.boarding = { ship: { type: 'leviathan', level: 100, sinking: 1 }, temps: [], endT: 0, leviathan: true };
    this.sailing = false;
    this.scene.add(p.model.root);
    p.model.root.rotation.set(0, 0, 0);
    p.x = 1702; p.z = 7; p.path = []; p.target = null;
    this.unboardCrew(p.x, p.z);
    this.camTarget.set(p.x, 0, p.z);
    this.viewTarget = this.isMobile ? 13 : 14;
    const crew = this.crew().length;
    const lvl = clamp(p.level + 8, 50, 101);
    const head = this.spawnTemp('leviathan', 1705, 6, lvl);
    head.x = 1705; head.z = 6.5; head.home = { x: 1705, z: 6 };
    this.boarding.temps.push(head);
    const spots = [[1700, 4], [1704, 4], [1700, 9], [1704, 9], [1702, 3], [1702, 10]];
    const nt = clamp(2 + Math.floor(crew / 3), 2, 6);
    for (let i = 0; i < nt; i++) { const t = this.spawnTemp('tentacle', spots[i][0], spots[i][1], lvl - 5); t.x = spots[i][0] + (spots[i][0] === 1700 ? -0.6 : spots[i][0] === 1704 ? 0.6 : 0); this.boarding.temps.push(t); }
    this.toast('🐙 ¡El Leviatán Abisal atrapa tu barco! ¡Toda la tripulación a cubierta!', 'area');
    this.camShake = 0.8;
    sfx('thunder');
  };
  P.arenaRestore = function () {
    const R = this.arena;
    if (!R) return;
    const W = R.W;
    R.tiles.fill(0);
    for (const [a, b] of [[0, 4], [7, 11]]) for (let z = 3; z <= 10; z++) for (let x = a; x <= b; x++) { if (z >= 10 && (x === a || x === b)) continue; R.tiles[z * W + x] = 4; }
    for (const z of [6, 7]) for (const x of [5, 6]) R.tiles[z * W + x] = 5;
    if (this.arenaShipB) this.arenaShipB.visible = true;
  };
  P.leviathanWin = function () {
    const p = this.player;
    const gold = 2500 + p.level * 40;
    p.gold += gold;
    this.give('perla', 5); this.give('escama', 4);
    if (Math.random() < 0.6) this.give('c_traje_abismo', 1);
    if (Math.random() < 0.6) this.give('c_corona_abismo', 1);
    p.gainXp(8000); this.crewGainXp(8000);
    this.toast(`🐙 ¡Has vencido al Leviatán Abisal! +${gold} oro`, 'area');
    this.addBounty(1500, 'leviathan');
  };

  // ============================================================ barcos: compra, decoración, nombre, llamar
  P.shipType = function () { return SHIP_TYPES[(this.shipUp && this.shipUp.type) || 'gaviota']; };
  P.shipName = function () { return (this.shipUp && this.shipUp.name) || 'Gaviota Negra'; };
  P.applyShipDecor = function () {
    const u = this.shipUp, s = this.ship;
    if (!s) return;
    if (!s.userData.ownSail) { s.userData.ownSail = new THREE.MeshLambertMaterial({ color: 0xffffff, map: this.texSet.sail, side: THREE.DoubleSide }); s.userData.ownFlag = new THREE.MeshLambertMaterial({ color: 0x111111, side: THREE.DoubleSide }); }
    s.userData.ownSail.color.set(SAILS[u.sail || 0]);
    s.userData.ownFlag.color.set(FLAGS[u.flag || 0]);
    s.userData.ownFlag.map = (u.flag || 0) === 0 ? this.M.flag.map : null;
    s.userData.ownFlag.needsUpdate = true;
    s.traverse((o) => { if (o.userData.sail) o.material = s.userData.ownSail; if (o.userData.flag) o.material = s.userData.ownFlag; });
    s.userData.hullMat.color.set(HULLS[u.hull_c || 0]);
    if (s.userData.head) { s.remove(s.userData.head); s.userData.head = null; }
    const h = u.head || 0;
    if (h) {
      const g = new THREE.Group();
      const m = (c) => new THREE.MeshLambertMaterial({ color: c });
      if (h === 1) { const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.3, 4, 8), m(0xe8c8a0)); b.rotation.x = 1.1; g.add(b); const t = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 6), m(0x2a9a8a)); t.position.set(0, -0.12, -0.25); t.rotation.x = -2.0; g.add(t); const hr = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), m(0xd84a2a)); hr.position.set(0, 0.12, 0.16); g.add(hr); }
      else if (h === 2) { const b = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.6, 6), m(0x2a6a2a)); b.rotation.x = 1.2; g.add(b); for (const sx of [-1, 1]) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.2, 4), m(0xe0b040)); c.position.set(sx * 0.08, 0.15, 0.1); c.rotation.x = -0.6; g.add(c); } }
      else { const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), m(0xf0f0f0)); g.add(b); const k = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 5), m(0xe0b040)); k.position.set(0, -0.02, 0.18); k.rotation.x = Math.PI / 2; g.add(k); for (const sx of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.2), m(0x6a4a2a)); w.position.set(sx * 0.3, 0.05, -0.1); w.rotation.z = sx * 0.4; g.add(w); } }
      g.position.set(0, 0.75, 3.75);
      s.add(g);
      s.userData.head = g;
    }
    if (this.flagCfg && this.applyFlag) this.applyFlag(s, this.flagCfg);
  };
  P.shipyardExtra = function () {
    const u = this.shipUp;
    u.owned = u.owned || ['gaviota'];
    const opts = [];
    for (const [id, t] of Object.entries(SHIP_TYPES)) {
      if (u.type === id || (!u.type && id === 'gaviota')) continue;
      if (u.owned.includes(id)) opts.push({ label: `🚢 Usar: ${t.name}`, action: () => { u.type = id; this.applyShipUpgrades(); this.toast(`🚢 Ahora navegas en tu ${t.name}`); } });
      else opts.push({ label: `🚢 Comprar ${t.name} (${t.price} oro)`, action: () => this.buy({ gold: t.price }, () => { u.owned.push(id); u.type = id; this.applyShipUpgrades(); this.boat.hp = this.boat.maxHp; this.toast(`🚢 ¡Nuevo barco: ${t.name}!`, 'area'); sfx('quest'); }) });
    }
    return opts;
  };
  P.decorShip = function () {
    const u = this.shipUp;
    const cyc = (k, n, label) => ({ label, action: () => this.buy({ gold: 100 }, () => { u[k] = ((u[k] || 0) + 1) % n; this.applyShipDecor(); this.decorShip(); }) });
    this.ui.openDialog(`🎨 Decorar «${this.shipName()}»`, `Cada cambio cuesta 100 oro. Mascarón actual: ${HEADS[u.head || 0]}.`, [
      cyc('sail', SAILS.length, '⛵ Cambiar color de velas'),
      cyc('hull_c', HULLS.length, '🪵 Pintar el casco'),
      cyc('flag', FLAGS.length, '🏴 Cambiar bandera'),
      cyc('head', HEADS.length, '🧜 Cambiar mascarón de proa'),
      { label: '✏️ Poner nombre', action: () => { const n = (prompt('Nombre de tu barco', this.shipName()) || '').trim().slice(0, 20); if (n) { u.name = n; this.toast(`🚢 Tu barco se llama «${n}»`); } } },
      { label: 'Listo', action: null },
    ]);
  };
  P.callShip = function () {
    const p = this.player, b = this.boat;
    for (let r = 3; r <= 9; r++) for (let a = 0; a < 16; a++) {
      const ang = (a / 16) * Math.PI * 2;
      const x = p.x + Math.cos(ang) * r, z = p.z + Math.sin(ang) * r;
      const h = Math.atan2(x - p.x, z - p.z) + Math.PI / 2;
      if (!this.shipBlocked(x, z, h)) {
        Object.assign(b, { x, z, heading: h, speed: 0, docked: null, waypoint: null });
        this.toast(`📯 ¡«${this.shipName()}» acude a tu llamada!`);
        sfx('quest');
        this.board();
        return;
      }
    }
    this.toast('El agua aquí es poco profunda para el barco; busca una costa más abierta');
  };
  P.canCallShip = function () {
    if (this.sailing || this.boarding || !this.nearWater()) return false;
    const p = this.player, b = this.boat;
    return Math.hypot(b.x - p.x, b.z - p.z) > 12;
  };
  P.landSpot = function () {
    const b = this.boat;
    for (let r = 2; r <= 6; r++) for (let a = 0; a < 16; a++) {
      const ang = (a / 16) * Math.PI * 2;
      const x = Math.round(b.x + Math.cos(ang) * r), z = Math.round(b.z + Math.sin(ang) * r);
      if (this.W.walkable(x, z) && this.W.tileAll(x, z) !== D.T.WATER) return { x, z };
    }
    return null;
  };
  P.disembark = function (s) {
    const p = this.player, b = this.boat;
    this.deck = null; this.autoHelm = null;
    b.speed = 0; b.docked = 'ancla'; b.waypoint = null;
    this.sailing = false;
    this.scene.add(p.model.root);
    p.model.root.rotation.set(0, 0, 0);
    p.x = s.x; p.z = s.z; p.path = [];
    this.unboardCrew(p.x, p.z);
    this.camTarget.set(p.x, 0, p.z);
    this.viewTarget = this.isMobile ? 11.5 : 13;
    this.toast('🏝 Echas el ancla y bajas a tierra');
  };

  // ============================================================ camarote decorable (bodega del barco)
  P.inHold = function () { const r = this.roomAt(this.player.x, this.player.z); return r && (r.id.startsWith('bodega') || (r.id === 'casa5' && this.flags.house) || (r.id === 'casaplaya' && this.flags.house_playa) || (r.id === 'casa2' && this.flags.house_mansion)) ? r : null; };
  P.decorFront = function (r) {
    const p = this.player;
    const x = Math.round(p.x + Math.sin(p.face)), z = Math.round(p.z + Math.cos(p.face));
    if (x < r.X || z < r.Z || x >= r.X + r.w || z >= r.Z + r.d) return null;
    if (!r.walkable(x, z) || (x === r.exit.x && z === r.exit.z)) return null;
    return { x, z };
  };
  P.addDecorMesh = function (d) {
    const r = this.rooms.find((k) => k.id === d.room);
    if (!r) return;
    const def = DECOR.find((k) => k.t === d.t);
    const holder = new THREE.Group();
    holder.add(furniture(d.t, 1, 1, this.M, r.room, []));
    holder.position.set(r.X + d.lx, 0, r.Z + d.lz);
    holder.rotation.y = d.rot || 0;
    this.scene.add(holder);
    d.mesh = holder;
    if (!def.flat && !def.wall) r.setBlocked(r.X + d.lx, r.Z + d.lz, 1);
    if (d.t === 'fireplace') { d.station = { type: 'fuego', x: r.X + d.lx, z: r.Z + d.lz }; this.stations.push(d.station); }
  };
  P.placeDecor = function (t) {
    const r = this.inHold();
    if (!r) return this.toast('Entra en la bodega de tu barco para decorar');
    const s = this.decorFront(r);
    if (!s) return this.toast('Mira hacia un hueco libre del camarote');
    const def = DECOR.find((k) => k.t === t);
    this.buy({ gold: def.price }, () => {
      const p = this.player;
      const d = { room: r.id, t, lx: s.x - r.X, lz: s.z - r.Z, rot: Math.round((p.face + Math.PI) / (Math.PI / 2)) * (Math.PI / 2) };
      (this.shipDecor || (this.shipDecor = [])).push(d);
      this.addDecorMesh(d);
      this.toast(`🪑 ${def.name} colocado`);
    });
  };
  P.decorNear = function () {
    const r = this.inHold();
    if (!r || !this.shipDecor) return null;
    const p = this.player;
    for (const d of this.shipDecor) if (d.room === r.id && Math.hypot(r.X + d.lx - p.x, r.Z + d.lz - p.z) < 1.3) return d;
    return null;
  };
  P.removeDecor = function (d) {
    const r = this.rooms.find((k) => k.id === d.room);
    this.scene.remove(d.mesh);
    r.setBlocked(r.X + d.lx, r.Z + d.lz, 0);
    if (d.station) this.stations.splice(this.stations.indexOf(d.station), 1);
    this.shipDecor.splice(this.shipDecor.indexOf(d), 1);
    this.player.gold += Math.floor(DECOR.find((k) => k.t === d.t).price / 2);
    this.toast('🪑 Mueble guardado (recuperas la mitad)');
  };
  P.loadDecor = function (list) {
    for (const d of this.shipDecor || []) { if (d.mesh) this.scene.remove(d.mesh); }
    this.shipDecor = [];
    for (const d of list || []) { const c = { room: d.room, t: d.t, lx: d.lx, lz: d.lz, rot: d.rot }; this.shipDecor.push(c); this.addDecorMesh(c); }
  };

  // ============================================================ eventos del mundo
  const EVENTS = {
    festival: { name: '🎉 Festival en Villarroca', dur: 240, desc: 'Precios -25% en las tiendas y la gente baila en la plaza.' },
    estrellas: { name: '🌠 Lluvia de estrellas', dur: 180, night: true, desc: '+50% de experiencia mientras dure.' },
    mercader: { name: '🧳 Mercader errante en Puerto Salitre', dur: 300, desc: 'Vende ropa rara solo por hoy.' },
    invasion: { name: '💀 Invasión de esqueletos', dur: 240, night: true, desc: 'Los muertos atacan Villarroca. ¡Defiéndela!' },
    tesoro: { name: '💰 Tesoro a la deriva', dur: 300, desc: 'Un cofre flota en el mar (marcado en el mapa).' },
  };
  P.xpMul = function () { return (this.event && this.event.id === 'estrellas' ? 1.5 : 1) * (this.buffMul ? this.buffMul('xp') : 1); };
  P.priceMul = function () { return this.event && this.event.id === 'festival' ? 0.75 : 1; };
  P.startEvent = function (id) {
    const E = EVENTS[id];
    this.event = { id, t: E.dur };
    this.toast(`${E.name}: ${E.desc}`, 'area');
    sfx('quest');
    const p = this.player;
    if (id === 'mercader') {
      const W = this.W;
      let s = { x: 56, z: 88 };
      for (let r = 0; r < 6; r++) { let ok = false; for (let a = 0; a < 8 && !ok; a++) { const x = 58 + Math.round(Math.cos(a) * r), z = 88 + Math.round(Math.sin(a) * r); if (W.walkable(x, z)) { s = { x, z }; ok = true; } } if (ok) break; }
      const n = new D.NPC(this, { id: 'zuri', name: 'Mercader errante Zuri', x: s.x, z: s.z, wander: 1, look: { shirt: 0x6a2a8a, pants: 0x2a1a3a, robe: 0x8a3aa8, hat: 'turban', capColor: 0xe0b040, skin: 0x8a5a3a, hair: 0x1a1a1a, beard: 0x1a1a1a, backpack: 0x7a5232, scarf: 0xe0b040 } });
      n.baseLevel = 30; n.setStats(30);
      this.npcs.push(n);
      this.event.npc = n;
    } else if (id === 'invasion') {
      const lvl = clamp(Math.round(p.level * 0.9 + 2), 5, 95);
      const temps = [];
      for (let i = 0; i < 6; i++) { const x = 46 + i * 2, z = 33; if (this.W.walkable(x, z)) temps.push(this.spawnTemp('skeleton', x, z, lvl)); }
      if (!this.raid && temps.length) this.raid = { town: 'Villarroca', temps, t: 0, invasion: true };
    } else if (id === 'tesoro') {
      for (let i = 0; i < 40; i++) {
        const x = -10 + Math.random() * 170, z = -10 + Math.random() * 160;
        if (!this.shipBlocked(x, z, 0)) {
          const g = new THREE.Group();
          const mk = (w, h, d, c, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: c })); m.position.y = y; g.add(m); };
          mk(0.9, 0.5, 0.6, 0x7a5232, 0.1); mk(0.95, 0.15, 0.65, 0xe0b040, 0.4); mk(1.4, 0.15, 1.0, 0x5a3a22, -0.15);
          g.position.set(x, 0, z);
          this.scene.add(g);
          this.event.chest = { x, z, g };
          break;
        }
      }
    }
  };
  P.endEvent = function () {
    const ev = this.event;
    if (!ev) return;
    if (ev.npc) { const n = ev.npc; this.scene.remove(n.model.root); n.label.el.remove(); this.npcs.splice(this.npcs.indexOf(n), 1); }
    if (ev.chest) this.scene.remove(ev.chest.g);
    this.event = null;
    const b = document.getElementById('eventBanner');
    if (b) b.classList.add('hidden');
  };
  P.updateEvents = function (dt) {
    if (!this.started || (this.net.isClient && this.net.active)) return;
    const b = document.getElementById('eventBanner');
    if (this.event) {
      const ev = this.event;
      ev.t -= dt;
      if (b) { b.classList.remove('hidden'); const txt = `${EVENTS[ev.id].name} · ${Math.ceil(ev.t / 60)} min`; if (b.textContent !== txt) b.textContent = txt; }
      if (ev.id === 'festival') {
        ev.danceT = (ev.danceT || 0) - dt;
        if (ev.danceT <= 0) { ev.danceT = 5; for (const n of this.npcs) if (!n.onShip && !this.soc(n.id).crew && Math.hypot(n.x - 50, n.z - 50) < 12) n.st.dance = Math.random() < 0.5; }
      }
      if (ev.id === 'estrellas' && Math.random() < dt * 2) { const p = this.player; this.ring(p.x + (Math.random() - 0.5) * 20, p.z + (Math.random() - 0.5) * 20, 0.8, 0xffe8a0); }
      if (ev.chest) {
        ev.chest.g.position.y = -0.05 + Math.sin(this.time * 2) * 0.06;
        ev.chest.g.rotation.y += dt * 0.3;
        if (this.sailing && Math.hypot(this.boat.x - ev.chest.x, this.boat.z - ev.chest.z) < 4.5) {
          const g = 400 + this.player.level * 20;
          this.player.gold += g;
          this.give('perla', 2);
          this.give(EVENT_COS[Math.floor(Math.random() * EVENT_COS.length)], 1);
          this.toast(`💰 ¡Tesoro rescatado! +${g} oro`, 'area');
          sfx('quest');
          this.endEvent();
          return;
        }
      }
      if (ev.id === 'invasion' && !this.raid) { this.give(EVENT_COS[Math.floor(Math.random() * EVENT_COS.length)], 1); this.endEvent(); return; }
      if (ev.t <= 0) {
        if (ev.id === 'festival') for (const n of this.npcs) n.st.dance = false;
        this.endEvent();
      }
      return;
    }
    this.eventT = (this.eventT ?? 200) - dt;
    if (this.eventT > 0) return;
    this.eventT = 360 + Math.random() * 300;
    const night = this.tod >= 20 || this.tod < 5;
    const pool = Object.keys(EVENTS).filter((k) => !EVENTS[k].night || night);
    this.startEvent(pool[Math.floor(Math.random() * pool.length)]);
  };
  P.eventMarker = function () { return this.event && this.event.chest ? { x: this.event.chest.x, z: this.event.chest.z } : null; };
  P.zuriStock = function () {
    const rnd = mulberry32(this.day * 31 + 7);
    const pool = [...EVENT_COS];
    const out = [];
    while (out.length < 4 && pool.length) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    return out;
  };
}

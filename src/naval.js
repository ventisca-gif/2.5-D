// Combate naval, recompensa (Se busca), redadas de la Marina, abordajes y astillero.
// Se instala sobre el prototipo de Game para no inflar main.js.
import * as THREE from 'three';
import { makeShip } from './props.js';
import { makeSerpent } from './chars2.js';
import { T } from './world.js';
import { ITEMS } from './items.js';

const ARENA_X = 1700, ARENA_Z = 0;
export const WANTED = 300;
const RAID_TOWNS = new Set(['Villarroca', 'Puerto Salitre', 'Isla Tortuga', 'Oasis de Sal', 'Aldea Liana', 'Villa Grillete', 'Granja de los Trigales']);
// NPCs que salen a defender su pueblo cuando la Marina desembarca
const DEFENDERS = new Set(['ramiro', 'elvira', 'nerea', 'tadeo', 'olga', 'mara', 'farid', 'kuno', 'lucas', 'brasa', 'quino', 'rufo']);

export const SHIP_UPS = {
  hull: { name: 'Casco reforzado', icon: '🛡️', max: 3, desc: '+250 de vida del barco por nivel', cost: (n) => ({ gold: 300 * n, wood: 20 * n, iron: 6 * n }) },
  cannons: { name: 'Cañones', icon: '💣', max: 3, desc: 'Más daño y recarga más rápida', cost: (n) => ({ gold: 350 * n, iron: 8 * n, polvora: 3 * n }) },
  sails: { name: 'Velas', icon: '⛵', max: 3, desc: '+12% de velocidad por nivel', cost: (n) => ({ gold: 250 * n, cloth: 6 * n }) },
  size: { name: 'Ampliar barco', icon: '📐', max: 2, desc: 'Barco más grande: +1 cañón por banda, +150 de vida y +2 de tripulación', cost: (n) => ({ gold: 900 * n, wood: 40 * n, stone: 20 * n }) },
};

// cubiertas de dos barcos enfrentados unidas por una pasarela (región aparte del mapa)
export function makeArenaRegion() {
  const W = 13, D = 12;
  const tiles = new Uint8Array(W * D);
  const deck = (lx0, lx1) => { for (let z = 3; z <= 10; z++) for (let x = lx0; x <= lx1; x++) { if (z >= 10 && (x === lx0 || x === lx1)) continue; tiles[z * W + x] = T.STONE; } };
  deck(0, 4); deck(7, 11);
  for (const z of [6, 7]) for (const x of [5, 6]) tiles[z * W + x] = T.DOCK;
  const R = {
    kind: 'arena', id: 'abordaje', name: 'Abordaje', X: ARENA_X, Z: ARENA_Z, W, D, tiles,
    contains: (x, z) => x >= ARENA_X - 1 && z >= ARENA_Z - 1 && x <= ARENA_X + W && z <= ARENA_Z + D,
  };
  const t = (x, z) => { const lx = x - ARENA_X, lz = z - ARENA_Z; return lx >= 0 && lz >= 0 && lx < W && lz < D ? tiles[lz * W + lx] : T.WATER; };
  R.tile = t;
  R.walkable = (x, z) => t(x, z) !== T.WATER;
  R.setBlocked = () => {};
  R.groundY = (x, z) => (t(Math.round(x), Math.round(z)) === T.DOCK ? 0.95 : 1.0);
  R.areaName = () => 'Abordaje';
  return R;
}

function tintShip(ship, sail, flag) {
  const sm = new THREE.MeshLambertMaterial({ color: sail, side: THREE.DoubleSide });
  const fm = new THREE.MeshLambertMaterial({ color: flag, side: THREE.DoubleSide });
  ship.traverse((o) => {
    if (o.userData.sail) o.material = sm;
    if (o.userData.flag) o.material = fm;
  });
  return ship;
}

export function installNaval(Game, D) {
  const P = Game.prototype;
  const sfx = D.sfx;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };

  // ------------------------------------------------------------ recompensa
  P.isMarine = function () { return (this.player && this.player.ap && this.player.ap.factionIdx) === 1; };
  const RANKS = [[0, 'Recluta'], [300, 'Marinero'], [1000, 'Sargento'], [3000, 'Teniente'], [10000, 'Capitán'], [25000, 'Comodoro'], [60000, 'Vicealmirante'], [150000, 'Almirante']];
  P.addBounty = function (n, type) {
    if (this.isMarine()) {
      // en la Marina se ganan méritos cazando piratas (y protegiendo a la gente)
      const pir = type && (type === 'pirate' || type === 'skeleton' || type === 'boss' || type.startsWith('famous_') || type === 'ship_pirate');
      if (type === 'marine' || type === 'marine_boss' || type === 'ship_marine') { this.honor = Math.max(0, (this.honor || 0) - n); return; }
      const before = this.honor || 0;
      this.honor = before + (pir ? n * 2 : Math.ceil(n / 2));
      for (const [v, name] of RANKS) if (v > 0 && before < v && this.honor >= v) { this.toast(`🎖️ ¡Ascenso! Ahora eres ${name} de la Marina`, 'area'); sfx('level'); }
      return;
    }
    const before = this.bounty || 0;
    this.bounty = before + n;
    const steps = [[WANTED, '📜 ¡SE BUSCA! La Marina te atacará en cuanto te vea.'], [1000, '📜 Tu recompensa sube: la Marina manda barcos a buscarte.'], [3000, '📜 Eres una leyenda pirata: la Marina envía a sus mejores.'], [10000, '📜 ¡El Almirantazgo pone precio de rey a tu cabeza!']];
    for (const [v, txt] of steps) if (before < v && this.bounty >= v) { this.toast(txt, 'area'); sfx('quest'); for (const e of this.enemies) e.updateColor(); }
  };
  P.bountyText = function () {
    if (this.isMarine()) { let r = RANKS[0][1]; for (const [v, name] of RANKS) if ((this.honor || 0) >= v) r = name; return r; }
    const b = this.bounty || 0;
    return b >= 10000 ? 'Leyenda' : b >= 3000 ? 'Temido' : b >= 1000 ? 'Buscado' : b >= WANTED ? 'Se busca' : 'Desconocido';
  };
  P.lowerBounty = function (k) {
    this.bounty = Math.max(0, Math.round((this.bounty || 0) * (1 - k)));
    for (const e of this.enemies) { if (e.def.neutral && !e.temp) e.provoked = false; e.updateColor(); }
  };

  // ------------------------------------------------------------ barco: vida y mejoras
  P.shipStats = function () {
    const u = this.shipUp || (this.shipUp = { hull: 0, cannons: 0, sails: 0, size: 0 });
    const T = this.shipType ? this.shipType() : { hp: 1, guns: 0, speed: 1 };
    return {
      maxHp: Math.round((300 + u.hull * 250 + u.size * 150) * T.hp),
      dmg: (18 + u.cannons * 14 + this.player.level * 2) * (1 + (this.jobLevel ? this.jobLevel('marinero') : 0) * 0.01),
      reload: 1.9 - u.cannons * 0.3,
      guns: Math.max(1, 2 + u.size + T.guns),
      speed: (1 + u.sails * 0.12) * T.speed,
      crew: u.size * 2,
    };
  };
  P.applyShipUpgrades = function () {
    const st = this.shipStats();
    const b = this.boat;
    b.maxHp = st.maxHp;
    if (b.hp === undefined || b.hp > b.maxHp) b.hp = b.maxHp;
    this.ship.scale.setScalar((1 + (this.shipUp.size || 0) * 0.12) * (this.shipType ? this.shipType().scale : 1));
  };
  P.damageBoat = function (dmg, x, z) {
    const b = this.boat;
    if (!this.sailing || this.boarding || b.sinking) return;
    b.hp = Math.max(0, b.hp - dmg);
    b.lastHit = this.time;
    this.ui.float('-' + Math.round(dmg), 'dmg', x ?? b.x, 1.8, z ?? b.z);
    sfx('hurt');
    this.camShake = 0.35;
    if (b.hp <= 0) this.sinkBoat();
  };
  P.sinkBoat = function () {
    const b = this.boat;
    b.sinking = 3;
    this.toast('💥 ¡Tu barco se hunde!', 'area');
    sfx('die');
  };
  P.finishSink = function () {
    const b = this.boat, p = this.player;
    b.sinking = 0;
    this.sailing = false;
    this.scene.add(p.model.root);
    p.model.root.rotation.set(0, 0, 0);
    const d = this.docks[0];
    Object.assign(b, { x: d.shipX, z: d.shipZ, heading: d.heading, speed: 0, docked: d.id, waypoint: null });
    b.hp = Math.round(b.maxHp * 0.3);
    p.x = d.land.x; p.z = d.land.z; p.path = [];
    const lost = Math.floor(p.gold * 0.15);
    p.gold -= lost;
    this.unboardCrew(p.x, p.z);
    this.clearSea();
    this.camTarget.set(p.x, 0, p.z);
    this.viewTarget = this.isMobile ? 11.5 : 13;
    setTimeout(() => this.toast(`🛟 Unos pescadores te rescataron y remolcaron el barco a Puerto Salitre${lost ? ` (-${lost} oro)` : ''}. Repáralo con Marga.`), 600);
    this.save();
  };

  // ------------------------------------------------------------ proyectiles
  P.navalInit = function () {
    if (this.naval) return;
    this.naval = { balls: [], ships: [], serpents: [], puffs: [], spawnT: 25, cd: 0 };
    this.ballGeo = new THREE.SphereGeometry(0.16, 8, 6);
    this.ballMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    this.puffGeo = new THREE.SphereGeometry(0.35, 7, 5);
  };
  P.shootBall = function (x, z, y, tx, tz, from, dmg) {
    const N = this.naval;
    const dx = tx - x, dz = tz - z;
    const d = Math.max(2, Math.hypot(dx, dz));
    const sp = 15;
    const t = d / sp;
    const m = new THREE.Mesh(this.ballGeo, this.ballMat);
    m.position.set(x, y, z);
    this.scene.add(m);
    N.balls.push({ m, x, y, z, vx: (dx / d) * sp, vz: (dz / d) * sp, vy: (9.8 * t) / 2 - (y - 0.2) / t, from, dmg, life: t + 0.6 });
    this.puff(x, y, z, 0xd8d0c0);
  };
  P.puff = function (x, y, z, color, big) {
    const m = new THREE.Mesh(this.puffGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, depthWrite: false }));
    m.position.set(x, y, z);
    m.scale.setScalar(big ? 1.4 : 0.6);
    this.scene.add(m);
    this.naval.puffs.push({ m, life: big ? 1.1 : 0.7, max: big ? 1.1 : 0.7, big });
  };
  P.fireCannons = function () {
    this.navalInit();
    const N = this.naval, b = this.boat, st = this.shipStats();
    if (!this.sailing || b.sinking) return;
    if (N.cd > 0) return;
    N.cd = st.reload;
    const fx = Math.sin(b.heading), fz = Math.cos(b.heading), rx = Math.cos(b.heading), rz = -Math.sin(b.heading);
    const targets = [...N.ships.filter((s) => !s.sinking), ...N.serpents.filter((s) => !s.dead)];
    let fired = false;
    for (const side of [1, -1]) {
      let best = null, bd = 17;
      for (const t of targets) {
        const dx = t.x - b.x, dz = t.z - b.z, d = Math.hypot(dx, dz);
        if (d < bd && (dx * rx + dz * rz) * side / d > 0.25) { bd = d; best = t; }
      }
      if (!best && targets.length) continue;
      fired = true;
      for (let i = 0; i < st.guns; i++) {
        const a = (i - (st.guns - 1) / 2) * 1.1;
        const sx = b.x + fx * a + rx * side * 1.4, sz = b.z + fz * a + rz * side * 1.4;
        let tx = sx + rx * side * 10, tz = sz + rz * side * 10;
        if (best) { tx = best.x + (Math.random() - 0.5) * 1.2 + fx * a * 0.5; tz = best.z + (Math.random() - 0.5) * 1.2 + fz * a * 0.5; }
        setTimeout(() => this.shootBall(sx, sz, 0.75, tx, tz, 'player', st.dmg), i * 90);
      }
    }
    if (!fired) { N.cd = 0.3; return; }
    sfx('cannon');
    this.camShake = 0.25;
  };

  // ------------------------------------------------------------ barcos enemigos
  P.spawnEnemyShip = function (type) {
    this.navalInit();
    const b = this.boat, p = this.player;
    const lvl = type === 'marine' ? clamp(Math.round(14 + Math.sqrt(this.bounty || 0) * 0.7), 14, 80) : clamp(p.level + Math.round(Math.random() * 6 - 2), 8, 90);
    let x = b.x, z = b.z;
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2, r = 24 + Math.random() * 6;
      const cx = b.x + Math.sin(a) * r, cz = b.z + Math.cos(a) * r;
      if (!this.shipBlocked(cx, cz, 0) && !this.shipBlocked(cx, cz, Math.PI / 2)) { x = cx; z = cz; break; }
      if (i === 29) return null;
    }
    const mesh = makeShip(this.M, this.texSet);
    if (type === 'marine') tintShip(mesh, 0xf4f4f0, 0x2a4a9a);
    else tintShip(mesh, 0x3a2a2a, 0x111111);
    mesh.position.set(x, -0.05, z);
    this.scene.add(mesh);
    const maxHp = Math.round(100 + lvl * 12);
    const s = {
      type, x, z, heading: Math.atan2(b.x - x, b.z - z), speed: 0, hp: maxHp, maxHp, level: lvl, mesh,
      cd: 3 + Math.random() * 2, boardCd: 8 + Math.random() * 6, sinking: 0, side: Math.random() < 0.5 ? 1 : -1,
      label: this.ui.makeLabel('enemy', '', { hp: true }),
    };
    s.label.nm.textContent = `${type === 'marine' ? '⚓ Fragata de la Marina' : '☠ Corsarios'} · Nv. ${lvl}`;
    s.label.nm.style.color = type === 'marine' ? '#9ad0ff' : '#ff8a6a';
    this.ui.setHp(s.label, 1);
    this.naval.ships.push(s);
    this.toast(type === 'marine' ? '🔭 ¡Una fragata de la Marina te ha visto!' : '🔭 ¡Barco pirata a la vista! Vienen a por tu botín', 'area');
    sfx('quest');
    return s;
  };
  P.spawnSerpent = function () {
    this.navalInit();
    const b = this.boat;
    const lvl = clamp(this.player.level + 4, 20, 95);
    const m = makeSerpent();
    const a = Math.random() * Math.PI * 2;
    const s = { x: b.x + Math.sin(a) * 14, z: b.z + Math.cos(a) * 14, a, hp: 500 + lvl * 35, maxHp: 500 + lvl * 35, level: lvl, root: m.root, segs: m.segs, t: 0, biteCd: 3, dead: false, deadT: 0, trail: [], label: this.ui.makeLabel('enemy', '', { hp: true }) };
    for (const g of s.segs) g.scale.setScalar(1.6);
    s.label.nm.textContent = `🐍 Serpiente marina · Nv. ${lvl}`;
    s.label.nm.style.color = '#ff5ad0';
    this.ui.setHp(s.label, 1);
    this.scene.add(s.root);
    this.naval.serpents.push(s);
    this.toast('🌊 ¡Algo enorme se mueve bajo el agua!', 'area');
    sfx('hurt');
  };
  P.clearSea = function () {
    if (!this.naval) return;
    for (const s of this.naval.ships) { this.scene.remove(s.mesh); s.label.el.remove(); }
    for (const s of this.naval.serpents) { this.scene.remove(s.root); s.label.el.remove(); }
    for (const bl of this.naval.balls) this.scene.remove(bl.m);
    this.naval.ships = []; this.naval.serpents = []; this.naval.balls = [];
  };
  P.killShip = function (s) {
    if (s.sinking) return;
    s.sinking = 3.5;
    s.label.el.style.display = 'none';
    const p = this.player;
    const gold = Math.round(40 + s.level * 9);
    p.gold += gold;
    const xp = Math.round(30 + s.level * 12);
    p.gainXp(xp);
    this.crewGainXp(xp);
    this.ui.float(`+${gold} oro · +${xp} XP`, 'gold', s.x, 2, s.z);
    this.give('polvora', 2 + Math.floor(Math.random() * 3), s.x, s.z);
    if (Math.random() < 0.4) this.give(s.type === 'marine' ? 'silver' : 'goldore', 1);
    this.stats['s_' + s.type] = (this.stats['s_' + s.type] || 0) + 1;
    this.jobXp && this.jobXp('marinero', 25);
    this.contractTick && this.contractTick('ship', 'ship');
    this.addBounty(s.type === 'marine' ? 150 : 40, 'ship_' + s.type);
    this.toast(s.type === 'marine' ? '💥 ¡Fragata de la Marina hundida!' : '💥 ¡Barco pirata hundido!', 'area');
    this.puff(s.x, 1, s.z, 0x8a8a8a, true);
    sfx('quest');
    this.onShipSunk && this.onShipSunk(s.type);
  };
  P.navalAction = function () {
    // abordar un barco enemigo dañado y cercano
    if (!this.naval || this.boarding) return null;
    const b = this.boat;
    for (const s of this.naval.ships) if (!s.sinking && Math.hypot(s.x - b.x, s.z - b.z) < 7.5) return { icon: '🪝', label: 'Abordar', fn: () => this.startBoarding(s, false) };
    return null;
  };

  P.updateNaval = function (dt) {
    this.navalInit();
    const N = this.naval, b = this.boat, p = this.player;
    N.cd -= dt;
    if (this.camShake > 0) this.camShake -= dt;
    // aparición de barcos y serpientes mientras navegas
    if (this.sailing && !b.sinking && !this.boarding && !(this.net.isClient && this.net.active)) {
      N.spawnT -= dt;
      if (N.spawnT <= 0) {
        N.spawnT = 40 + Math.random() * 40;
        const deep = !(b.x > -20 && b.z > -20 && b.x < 170 && b.z < 160);
        const alive = N.ships.filter((s) => !s.sinking).length;
        const r = Math.random();
        if (alive < 2) {
          if (!this.isMarine() && (this.bounty || 0) >= 100 && r < 0.3 + Math.min(0.4, (this.bounty || 0) / 8000)) this.spawnEnemyShip('marine');
          else if (r < (deep ? 0.75 : 0.5)) this.spawnEnemyShip('pirate');
          else if (deep && p.level >= 35 && Math.random() < 0.3 && this.playtime - (this.levT || -9999) > 600) { this.levT = this.playtime; this.leviathanAttack(); }
          else if (deep && !N.serpents.some((s) => !s.dead) && p.level >= 15) this.spawnSerpent();
        }
      }
    }
    // barcos enemigos
    for (let i = N.ships.length - 1; i >= 0; i--) {
      const s = N.ships[i];
      if (s.sinking) {
        s.sinking -= dt;
        s.mesh.position.y -= dt * 0.6;
        s.mesh.rotation.z += dt * 0.25;
        if (s.sinking <= 0) { this.scene.remove(s.mesh); s.label.el.remove(); N.ships.splice(i, 1); }
        continue;
      }
      const dx = b.x - s.x, dz = b.z - s.z, d = Math.hypot(dx, dz);
      if (!this.sailing || d > 70) { this.scene.remove(s.mesh); s.label.el.remove(); N.ships.splice(i, 1); continue; }
      const toP = Math.atan2(dx, dz);
      const want = d > 10 ? toP : toP + (Math.PI / 2) * s.side;
      const diff = angDiff(want, s.heading);
      s.heading += clamp(diff, -0.9 * dt, 0.9 * dt);
      const tsp = d > 10 ? 4.6 : 2.8;
      s.speed += (tsp - s.speed) * Math.min(1, dt);
      const nx = s.x + Math.sin(s.heading) * s.speed * dt, nz = s.z + Math.cos(s.heading) * s.speed * dt;
      if (!this.shipBlocked(nx, nz, s.heading) && Math.hypot(nx - b.x, nz - b.z) > 3.6) { s.x = nx; s.z = nz; } else { s.heading += dt * 1.5 * s.side; s.speed *= 0.5; }
      s.cd -= dt; s.boardCd -= dt;
      if (s.cd <= 0 && d < 15 && !this.boarding) {
        s.cd = 3.2 + Math.random() * 1.5;
        const rx = Math.cos(s.heading), rz = -Math.sin(s.heading);
        const side = (dx * rx + dz * rz) > 0 ? 1 : -1;
        const n = 2 + (s.level > 40 ? 1 : 0);
        for (let k = 0; k < n; k++) {
          const sx = s.x + rx * side * 1.4 + Math.sin(s.heading) * (k - 1), sz = s.z + rz * side * 1.4 + Math.cos(s.heading) * (k - 1);
          setTimeout(() => this.shootBall(sx, sz, 0.75, b.x + (Math.random() - 0.5) * 2.5, b.z + (Math.random() - 0.5) * 2.5, 'enemy', 8 + s.level * 1.6), k * 120);
        }
        sfx('cannon');
      }
      if (s.boardCd <= 0 && d < 6 && !this.boarding) {
        s.boardCd = 20;
        if (Math.random() < 0.6) { this.startBoarding(s, true); return; }
      }
      s.mesh.rotation.order = 'YXZ';
      s.mesh.rotation.y = s.heading;
      s.mesh.rotation.z = Math.sin(this.time * 0.9 + i) * 0.03;
      s.mesh.position.set(s.x, -0.05 + Math.sin(this.time * 1.1 + i) * 0.04, s.z);
      this.ui.placeLabel(s.label, s.x, 4.2, s.z);
    }
    // serpientes
    for (let i = N.serpents.length - 1; i >= 0; i--) {
      const s = N.serpents[i];
      s.t += dt;
      if (s.dead) {
        s.deadT += dt;
        s.root.position.y -= dt * 0.8;
        if (s.deadT > 2.5) { this.scene.remove(s.root); s.label.el.remove(); N.serpents.splice(i, 1); }
        continue;
      }
      const d = Math.hypot(b.x - s.x, b.z - s.z);
      if (!this.sailing || d > 60) { this.scene.remove(s.root); s.label.el.remove(); N.serpents.splice(i, 1); continue; }
      s.biteCd -= dt;
      let tx, tz;
      if (s.biteCd < 0.8) { tx = b.x; tz = b.z; } else { s.a += dt * 0.5; tx = b.x + Math.sin(s.a) * 7; tz = b.z + Math.cos(s.a) * 7; }
      const hd = Math.atan2(tx - s.x, tz - s.z);
      s.h = s.h === undefined ? hd : s.h + clamp(angDiff(hd, s.h), -2 * dt, 2 * dt);
      const sp = s.biteCd < 0.8 ? 7 : 5;
      s.x += Math.sin(s.h) * sp * dt; s.z += Math.cos(s.h) * sp * dt;
      if (s.biteCd <= 0 && d < 3.8) { s.biteCd = 3.2; this.damageBoat(14 + s.level * 1.8, s.x, s.z); this.puff(s.x, 0.3, s.z, 0xeaf8fa, true); }
      if (s.biteCd <= -1.5) s.biteCd = 2;
      s.trail.unshift({ x: s.x, z: s.z });
      if (s.trail.length > 80) s.trail.length = 80;
      s.root.position.set(0, 0, 0);
      s.segs.forEach((g, k) => {
        const tp = s.trail[Math.min(s.trail.length - 1, k * 4)];
        const tq = s.trail[Math.min(s.trail.length - 1, k * 4 + 2)];
        g.position.set(tp.x, Math.sin(s.t * 3 - k * 0.7) * 0.35 + (k === 0 ? 0.5 : 0.05) - 0.12 * k * 0.3, tp.z);
        g.rotation.y = Math.atan2(tp.x - tq.x, tp.z - tq.z) || 0;
      });
      this.ui.placeLabel(s.label, s.x, 2.6, s.z);
    }
    // proyectiles
    for (let i = N.balls.length - 1; i >= 0; i--) {
      const bl = N.balls[i];
      bl.vy -= 9.8 * dt;
      bl.x += bl.vx * dt; bl.z += bl.vz * dt; bl.y += bl.vy * dt;
      bl.life -= dt;
      bl.m.position.set(bl.x, bl.y, bl.z);
      let hit = false;
      if (bl.from === 'enemy') {
        if (Math.hypot(bl.x - b.x, bl.z - b.z) < 2.2 && bl.y < 2.5) { this.damageBoat(bl.dmg, bl.x, bl.z); hit = true; }
      } else {
        for (const s of N.ships) if (!s.sinking && Math.hypot(bl.x - s.x, bl.z - s.z) < 2.4 && bl.y < 2.5) {
          s.hp -= bl.dmg; hit = true;
          this.ui.float(String(Math.round(bl.dmg)), 'pdmg', s.x, 2.2, s.z);
          this.ui.setHp(s.label, Math.max(0, s.hp) / s.maxHp);
          if (s.hp <= 0) this.killShip(s);
          break;
        }
        if (!hit) for (const s of N.serpents) if (!s.dead && Math.hypot(bl.x - s.x, bl.z - s.z) < 2.2 && bl.y < 2) {
          s.hp -= bl.dmg; hit = true;
          this.ui.float(String(Math.round(bl.dmg)), 'pdmg', s.x, 2, s.z);
          this.ui.setHp(s.label, Math.max(0, s.hp) / s.maxHp);
          if (s.hp <= 0) {
            s.dead = true; s.label.el.style.display = 'none';
            const xp = Math.round(80 + s.level * 20);
            p.gainXp(xp); this.crewGainXp(xp);
            this.give('escama', 2, s.x, s.z); if (Math.random() < 0.6) this.give('perla', 1);
            p.gold += 120 + s.level * 6;
            this.stats.k_serpent = (this.stats.k_serpent || 0) + 1;
            this.toast('🐍 ¡Serpiente marina derrotada!', 'area');
            this.onKill && this.onKill('serpent');
            sfx('quest');
          }
          break;
        }
      }
      if (hit) this.puff(bl.x, bl.y, bl.z, 0xff9a40);
      if (hit || bl.y < -0.1 || bl.life <= 0) {
        if (!hit) this.puff(bl.x, 0, bl.z, 0xeaf8fa);
        this.scene.remove(bl.m);
        N.balls.splice(i, 1);
      }
    }
    for (let i = N.puffs.length - 1; i >= 0; i--) {
      const f = N.puffs[i];
      f.life -= dt;
      const k = Math.max(0, f.life / f.max);
      f.m.material.opacity = 0.8 * k;
      f.m.scale.setScalar((f.big ? 1.4 : 0.6) + (1 - k) * (f.big ? 2.2 : 1.1));
      f.m.position.y += dt * 0.6;
      if (f.life <= 0) { this.scene.remove(f.m); f.m.material.dispose(); N.puffs.splice(i, 1); }
    }
    // hundimiento propio
    if (b.sinking) {
      b.sinking -= dt;
      b.speed *= 0.95;
      b.roll = (b.roll || 0) + dt * 0.12;
      if (b.sinking <= 0) this.finishSink();
    } else if (b.docked && b.hp < b.maxHp) b.hp = Math.min(b.maxHp, b.hp + dt * 1.5);
    // barra del barco
    const hud = document.getElementById('shipHud');
    if (hud) {
      const show = this.sailing && this.started;
      if (hud._s !== show) { hud._s = show; hud.classList.toggle('hidden', !show); document.body.classList.toggle('sailing', show); }
      if (show) {
        const k = Math.round((b.hp / b.maxHp) * 100);
        if (hud._k !== k) { hud._k = k; document.getElementById('shipfill').style.width = k + '%'; document.getElementById('shiptext').textContent = `${Math.round(b.hp)} / ${b.maxHp}`; }
        const ready = N.cd <= 0;
        const cb = document.getElementById('btnAction');
        if (cb && cb._r !== ready) { cb._r = ready; cb.classList.toggle('cool', !ready); }
      }
    }
  };

  // ------------------------------------------------------------ menú del barco, cubierta y timonel
  P.sailMenu = function () {
    const opts = [];
    opts.push({ label: '⬇️ Bajar a la bodega', action: () => this.enterHold() });
    opts.push({ label: this.deck ? '🧭 Volver al timón' : '🚶 Pasear por la cubierta', action: () => this.toggleDeck() });
    if (this.autoHelm) {
      const h = this.npcById(this.autoHelm);
      opts.push({ label: `✋ Quitar a ${h ? h.name : 'timonel'} del timón`, action: () => { this.autoHelm = null; this.boat.waypoint = null; this.toast('Llevas tú el timón'); } });
    } else {
      const aboard = this.npcs.filter((n) => n.onShip && this.soc(n.id).crew).slice(0, 4);
      for (const n of aboard) opts.push({ label: `🧭 Timonel: ${n.name}`, action: () => { this.autoHelm = n.id; this.boat.waypoint = null; this.toast(`🧭 ${n.name} toma el timón: explorará y atacará barcos enemigos`); } });
      if (!aboard.length) opts.push({ label: '🧭 (Necesitas tripulación a bordo para un timonel)', action: null });
    }
    opts.push({ label: 'Cerrar', action: null });
    this.ui.openDialog('⚙️ Barco', this.autoHelm ? 'Tu timonel navega solo: explora el mar y combate a los barcos que encuentre. Usa el joystick para tomar el control un momento.' : 'Elige qué hacer a bordo.', opts);
  };
  P.toggleDeck = function () {
    const p = this.player;
    if (this.deck) {
      this.deck = null;
      p.model.root.position.set(0, 1.42, -2.75);
      p.model.root.rotation.set(0, 0, 0);
      p.st.moving = false;
      this.viewTarget = this.isMobile ? 16 : 18;
    } else {
      this.deck = { x: 0, z: 0.4 };
      this.viewTarget = this.isMobile ? 11 : 12;
      this.toast(this.autoHelm ? '🚶 Paseas por cubierta mientras el timonel navega' : '🚶 Paseas por cubierta (el barco se detiene sin timonel)');
    }
  };
  P.moveOnDeck = function (dt, j) {
    const d = this.deck, p = this.player, b = this.boat;
    const k = 1 + (this.shipUp.size || 0) * 0.12;
    if (j) {
      const ang = Math.atan2(j.x - j.y, -j.x - j.y) - b.heading;
      const sp = 2.2 * Math.min(1, Math.hypot(j.x, j.y));
      d.x = clamp(d.x + Math.sin(ang) * sp * dt, -0.8, 0.8);
      d.z = clamp(d.z + Math.cos(ang) * sp * dt, -1.9, 3.0);
      p.st.moving = true;
      p.model.root.rotation.y = ang;
    } else p.st.moving = false;
    p.model.root.position.set(d.x, 0.74, d.z);
    void k;
  };
  P.autoPilot = function (dt) {
    this.navalInit();
    const N = this.naval, b = this.boat;
    let best = null, bd = 35;
    for (const t of [...N.ships.filter((s) => !s.sinking), ...N.serpents.filter((s) => !s.dead)]) {
      const d = Math.hypot(t.x - b.x, t.z - b.z);
      if (d < bd) { bd = d; best = t; }
    }
    if (best) {
      if (bd > 9) b.waypoint = { x: best.x, z: best.z };
      else { const a = Math.atan2(b.x - best.x, b.z - best.z) + 0.7; b.waypoint = { x: best.x + Math.sin(a) * 8, z: best.z + Math.cos(a) * 8 }; }
      if (N.cd <= 0 && bd < 15) this.fireCannons();
      return;
    }
    b.stuckT = Math.abs(b.speed) < 0.5 ? (b.stuckT || 0) + dt : 0;
    if (!b.waypoint || b.stuckT > 3) {
      b.stuckT = 0;
      for (let i = 0; i < 25; i++) {
        const a = Math.random() * Math.PI * 2, r = 20 + Math.random() * 25;
        const x = b.x + Math.sin(a) * r, z = b.z + Math.cos(a) * r;
        if (x > -95 && z > -95 && x < 235 && z < 235 && !this.shipBlocked(x, z, a)) { b.waypoint = { x, z }; break; }
      }
    }
  };

  // ------------------------------------------------------------ abordaje
  P.buildArena = function () {
    if (this.arenaBuilt) return;
    this.arenaBuilt = true;
    const g = new THREE.Group();
    const mk = (cx, tint) => {
      const s = makeShip(this.M, this.texSet);
      if (tint) tintShip(s, tint[0], tint[1]);
      s.scale.set(2.1, 1.4, 1.75);
      // sin mástiles ni velas para ver bien la cubierta
      for (const o of s.children) if (o.position.y > 1.5 || o.userData.sail || o.userData.flag) o.visible = false;
      s.position.set(cx, -0.16, ARENA_Z + 5.6);
      return s;
    };
    this.arenaShipA = mk(ARENA_X + 2, null);
    this.arenaShipB = mk(ARENA_X + 9, [0x3a2a2a, 0x111111]);
    g.add(this.arenaShipA, this.arenaShipB);
    // pasarela de tablones
    const plank = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.08, 1.8), new THREE.MeshLambertMaterial({ color: 0x9a6a3a, map: this.texSet.plank }));
    plank.position.set(ARENA_X + 5.5, 0.93, ARENA_Z + 6.5);
    g.add(plank);
    for (const z of [5.65, 7.35]) {
      const rope = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.03, 0.03), new THREE.MeshLambertMaterial({ color: 0x9a8058 }));
      rope.position.set(ARENA_X + 5.5, 1.35, ARENA_Z + z);
      g.add(rope);
    }
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), this.water.material);
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(ARENA_X + 5.5, -0.12, ARENA_Z + 6);
    g.add(sea);
    this.scene.add(g);
  };
  P.startBoarding = function (ship, theyBoard) {
    if (this.boarding) return;
    this.buildArena();
    this.arenaRestore();
    const p = this.player, b = this.boat;
    this.arenaShipB.traverse((o) => {
      if (o.userData.sail) o.material = new THREE.MeshLambertMaterial({ color: ship.type === 'marine' ? 0xf4f4f0 : 0x3a2a2a, side: THREE.DoubleSide });
      if (o.userData.flag) o.material = new THREE.MeshLambertMaterial({ color: ship.type === 'marine' ? 0x2a4a9a : 0x111111, side: THREE.DoubleSide });
    });
    b.speed = 0;
    this.boarding = { ship, temps: [], endT: 0 };
    this.sailing = false;
    this.scene.add(p.model.root);
    p.model.root.rotation.set(0, 0, 0);
    p.x = ARENA_X + 2; p.z = ARENA_Z + 7; p.path = []; p.target = null;
    this.unboardCrew(p.x, p.z);
    this.camTarget.set(p.x, 0, p.z);
    this.viewTarget = this.isMobile ? 12 : 13.5;
    const n = clamp(3 + Math.floor(ship.level / 15), 3, 7);
    const type = ship.type === 'marine' ? 'marine' : 'pirate';
    const spots = [];
    for (let z = 3; z <= 10; z++) for (let x = 8; x <= 10; x++) spots.push([ARENA_X + x, ARENA_Z + z]);
    spots.sort(() => Math.random() - 0.5);
    for (let i = 0; i < n; i++) {
      const [x, z] = spots[i];
      const e = this.spawnTemp(type, x, z, Math.max(1, ship.level + (i === 0 ? 3 : -1 - (i % 3))));
      if (i === 0) { e.label.nm.textContent = (type === 'marine' ? 'Capitán de la Marina' : 'Capitán corsario') + ` · Nv. ${e.level}`; e.maxHp = Math.round(e.maxHp * 1.6); e.hp = e.maxHp; }
      this.boarding.temps.push(e);
    }
    this.toast(theyBoard ? '🪝 ¡Os abordan! Tiran la pasarela: ¡a las armas!' : '🪝 ¡Al abordaje! Cruza la pasarela', 'area');
    sfx('quest');
  };
  P.spawnTemp = function (type, x, z, lvl) {
    const s = { area: [x, z, x, z], lvl: [lvl, lvl] };
    const e = new D.Enemy(this, type, s, s.lvl);
    e.temp = true;
    e.provoked = true;
    e.x = x; e.z = z; e.home = { x, z };
    e.idx = this.enemies.length;
    e.state = 'chase';
    e.updateColor();
    this.enemies.push(e);
    return e;
  };
  P.updateBoarding = function (dt) {
    const B = this.boarding;
    if (!B) return;
    if (this.player.dead) return;
    if (B.temps.every((e) => e.dead)) {
      B.endT += dt;
      if (B.endT > 1.6) this.endBoarding(true);
    }
  };
  P.endBoarding = function (won) {
    const B = this.boarding;
    if (!B) return;
    this.boarding = null;
    for (const e of B.temps) if (!e.removed) e.remove();
    this.purgeTemps();
    const p = this.player, b = this.boat;
    if (B.leviathan) {
      this.arenaRestore();
      if (won) this.leviathanWin();
      p.x = b.x; p.z = b.z;
      this.board(true);
      return;
    }
    if (won) {
      const s = B.ship;
      const gold = Math.round(80 + s.level * 14);
      p.gold += gold;
      this.give('polvora', 3);
      if (Math.random() < 0.5) this.give(s.type === 'marine' ? 'silver' : 'goldore', 2);
      if (Math.random() < 0.15) this.give(s.type === 'marine' ? 'traje_guardia' : 'chaqueta_pirata', 1);
      this.toast(`🏴‍☠️ ¡Barco capturado! +${gold} oro. Lo hundís tras saquearlo.`, 'area');
      this.addBounty(s.type === 'marine' ? 200 : 60, 'ship_' + s.type);
      if (!s.sinking) { s.hp = 0; this.killShip(s); }
      p.x = b.x; p.z = b.z;
      this.board(true);
    }
  };
  P.purgeTemps = function () {
    const base = this.enemies.slice(0, this.baseEnemies);
    const rest = this.enemies.slice(this.baseEnemies).filter((e) => !e.removed);
    this.enemies = base.concat(rest);
    this.enemies.forEach((e, i) => { e.idx = i; });
  };

  // ------------------------------------------------------------ redadas en los pueblos
  P.updateRaids = function (dt) {
    if (!this.started || this.sailing || this.boarding || (this.net.isClient && this.net.active)) return;
    const p = this.player;
    if (this.raid) {
      const R = this.raid;
      R.t += dt;
      // los vecinos defienden el pueblo
      for (const n of this.npcs) {
        if (!DEFENDERS.has(n.id) || n.onShip || n.fight || n.talking) continue;
        let tgt = null, bd = 14;
        for (const e of R.temps) { if (e.dead) continue; const d = n.dist(e); if (d < bd) { bd = d; tgt = e; } }
        if (!tgt) continue;
        n.defT = (n.defT || 0) - dt;
        if (bd > 1.6) { if (n.defT <= 0) { n.defT = 0.6; n.goTo(tgt.tx, tgt.tz, true, 1200); } }
        else if (n.defT <= 0) {
          n.defT = 1.3;
          n.faceTo(tgt.x - n.x, tgt.z - n.z, 1);
          n.st.attackT = 0.32;
          this.slash(n, 0xffe0a0);
          this.damageEnemy(tgt, Math.round(6 + n.level * 2.2 * (0.8 + Math.random() * 0.4)), false, true);
        }
      }
      if (R.temps.every((e) => e.dead) || R.t > 240) {
        const won = R.temps.every((e) => e.dead);
        for (const e of R.temps) if (!e.removed) e.remove();
        this.raid = null;
        this.purgeTemps();
        if (won) { this.toast(`🛡️ ¡${R.town} ha rechazado el ataque!`, 'area'); p.gold += 60; this.addFriendTown && this.addFriendTown(R.town); sfx('quest'); }
      }
      return;
    }
    const marine = this.isMarine();
    const heat = marine ? (this.honor || 0) : (this.bounty || 0);
    if (heat < WANTED) return;
    const town = this.W.areaName(p.tx, p.tz);
    if (!RAID_TOWNS.has(town) || this.W.isInterior(p.x)) { this.raidT = Math.min(this.raidT ?? 90, 90); return; }
    this.raidT = (this.raidT ?? 90) - dt;
    if (this.raidT > 0) return;
    this.raidT = 200 + Math.random() * 160 - Math.min(120, heat / 100);
    // desembarcan cerca del jugador, entre él y el muelle más cercano
    let dk = this.docks[0], dd = Infinity;
    for (const d of this.docks) { const k = Math.hypot(d.land.x - p.x, d.land.z - p.z); if (k < dd) { dd = k; dk = d; } }
    const n = clamp(3 + Math.floor(heat / 1500), 3, 6);
    const lvl = clamp(Math.round(p.level * 0.9 + 2 + Math.sqrt(heat) * 0.15), 8, 90);
    const temps = [];
    const ax = dd < 30 ? dk.land.x : p.x + 9, az = dd < 30 ? dk.land.z : p.z + 9;
    for (let i = 0; i < n * 6 && temps.length < n; i++) {
      const x = Math.round(ax + (Math.random() - 0.5) * 6), z = Math.round(az + (Math.random() - 0.5) * 6);
      if (!this.W.walkable(x, z) || Math.hypot(x - p.x, z - p.z) < 5) continue;
      const e = this.spawnTemp(marine ? 'pirate' : 'marine', x, z, lvl + (temps.length === 0 ? 4 : 0));
      if (temps.length === 0) e.label.nm.textContent = `${marine ? 'Capitán pirata' : 'Sargento de la Marina'} · Nv. ${e.level}`;
      e.updateColor();
      temps.push(e);
    }
    if (!temps.length) return;
    this.raid = { town, temps, t: 0 };
    this.toast(marine ? `🏴‍☠️ ¡Piratas desembarcan en ${town} para vengarse de ${p.name}!` : `⚓ ¡La Marina desembarca en ${town} buscando a ${p.name}!`, 'area');
    setTimeout(() => this.toast('🛡️ Los vecinos toman las armas para defenderte'), 1800);
    sfx('quest');
  };

  // ------------------------------------------------------------ astillero (Marga)
  P.openShipyard = function () {
    const st = this.shipStats();
    const u = this.shipUp;
    const b = this.boat;
    if (b.hp === undefined) this.applyShipUpgrades();
    const opts = [];
    const miss = Math.round(b.maxHp - b.hp);
    if (miss > 0) {
      const c = Math.max(5, Math.round(miss * 0.4));
      opts.push({ label: `🔧 Reparar barco (${c} oro)`, action: () => this.buy({ gold: c }, () => { b.hp = b.maxHp; this.toast('🔧 Barco como nuevo'); }) });
    }
    for (const [k, def] of Object.entries(SHIP_UPS)) {
      const lv = u[k] || 0;
      if (lv >= def.max) continue;
      const cost = def.cost(lv + 1);
      const txt = Object.entries(cost).map(([id, v]) => (id === 'gold' ? `${v} oro` : `${v} ${ITEMS[id] ? ITEMS[id].icon : id}`)).join(', ');
      opts.push({ label: `${def.icon} ${def.name} ${lv + 1}/${def.max} (${txt})`, action: () => this.buy(cost, () => { u[k] = lv + 1; this.applyShipUpgrades(); b.hp = b.maxHp; this.toast(`⚒️ ${def.name}: nivel ${lv + 1}`); sfx('quest'); }) });
    }
    opts.push(...this.shipyardExtra());
    opts.push({ label: '🎨 Decorar el barco y ponerle nombre', action: () => this.decorShip() });
    opts.push({ label: '🧨 Comprar 3 pólvora (30 oro)', action: () => this.buy({ gold: 30 }, () => this.give('polvora', 3)) });
    opts.push({ label: 'Adiós', action: null });
    this.ui.openDialog(`⚓ Astillera Marga · «${this.shipName()}» (${this.shipType().name})`,
      `Tu barco: vida ${Math.round(b.hp)}/${b.maxHp} · ${st.guns} cañones por banda · daño ${Math.round(st.dmg)} · velocidad ×${st.speed.toFixed(2)}. Casco ${u.hull}/3 · Cañones ${u.cannons}/3 · Velas ${u.sails}/3 · Tamaño ${u.size}/2.`,
      opts);
  };
}

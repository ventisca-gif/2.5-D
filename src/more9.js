// v3.7: barco de la tripulación, escuela de combate, pueblos que crecen, cacerías de bestias legendarias,
// banquete de la tripulación, sueños y visiones, torneo de tripulaciones e Isla Errante con laberinto y guardián.
import * as THREE from 'three';
import { makeIslet } from './regions.js';
import { makeShip } from './props.js';
import { T } from './world.js';
import { ITEMS } from './items.js';
import { BUFFS } from './skills.js';

const LEADERS9 = { marisol: 'Villarroca', nerea: 'Puerto Salitre', mara: 'Isla Tortuga', zaid: 'Oasis de Sal', ixa: 'Aldea Liana', lucas: 'Villa Grillete', lucia: 'Granja de los Trigales', dulcinea: 'Villa Merengue', volta: 'Ciudad Engranaje', maestro: 'Monasterio del Pico' };
const BEASTS = ['bestia_lobo', 'bestia_tigre', 'bestia_golem'];
const SK2 = { sword: '⚡ Corte veloz', axe: '🌀 Remolino', spear: '🔱 Estocada', heal: '💚 Curar' };
BUFFS.banquete = { name: '🍲 Banquete', atk: 1.15, def: 1.15, regen: 0.004 };

// ---------------------------------------------------------------- Isla Errante: tres lugares, solo uno visible cada día
const WANDER_SPOTS = [{ ox: 84, oz: 186, N: 42 }, { ox: 198, oz: 110, N: 46 }, { ox: 100, oz: -100, N: 46 }];
export function makeWanderIslets() {
  return WANDER_SPOTS.map((s, i) => {
    const R = makeIslet({ id: 'errante' + i, name: 'Isla Errante', ox: s.ox, oz: s.oz, N: s.N, seed: 301 + i * 7, dockDir: [1, 0], biome: 'fort' });
    R.ghost = true; R.newborn = true; R.wander = i; R.hidden = true;
    const t0 = R.tile, w0 = R.walkable;
    R.tile = (x, z) => (R.hidden ? T.WATER : t0(x, z));
    R.walkable = (x, z) => !R.hidden && w0(x, z);
    // laberinto (celdas de 2 casillas) en el centro
    const { x: cx, z: cz } = R.center, C = 6, x0 = cx - C, z0 = cz - C;
    const W = C * 2 + 1, grid = new Uint8Array(W * W).fill(1);
    let seed = 1234 + i * 99; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const stack = [[1, 1]]; grid[1 * W + 1] = 0;
    while (stack.length) {
      const [x, z] = stack[stack.length - 1];
      const dirs = [[2, 0], [-2, 0], [0, 2], [0, -2]].filter(([dx, dz]) => { const nx = x + dx, nz = z + dz; return nx > 0 && nz > 0 && nx < W - 1 && nz < W - 1 && grid[nz * W + nx]; });
      if (!dirs.length) { stack.pop(); continue; }
      const [dx, dz] = dirs[Math.floor(rnd() * dirs.length)];
      grid[(z + dz / 2) * W + (x + dx / 2)] = 0; grid[(z + dz) * W + (x + dx)] = 0;
      stack.push([x + dx, z + dz]);
    }
    grid[(C) * W + (W - 1)] = 0; grid[C * W + W - 2] = 0; // entrada al este (hacia el muelle)
    for (let z = C - 1; z <= C + 1; z++) for (let x = C - 1; x <= C + 1; x++) grid[z * W + x] = 0; // sala del guardián
    R.maze = [];
    for (let z = 0; z < W; z++) for (let x = 0; x < W; x++) if (grid[z * W + x]) { R.maze.push({ x: x0 + x, z: z0 + z }); R.block(x0 + x, z0 + z); }
    R.mazeCenter = { x: cx, z: cz };
    R.reserve(cx, cz, C + 2);
    return R;
  });
}

export function installMore9(Game, D) {
  const P = Game.prototype;
  const sfx = D.sfx;

  // ============================================================ barco de la tripulación
  P.escortCaptain = function () { const id = this.escortId; const n = id && this.npcById(id); return n && this.soc(n.id).crew ? n : null; };
  P.setEscort = function (n) {
    const s = this.soc(n.id);
    if ((s.rank || 0) < 2) return this.toast('Necesita ser Contramaestre o Primer oficial para capitanear un barco');
    this.buy({ gold: this.flags.escortShip ? 0 : 8000 }, () => {
      this.flags.escortShip = true;
      this.escortId = n.id;
      this.toast(`⛵ ${n.name} capitanea tu segundo barco: navegará contigo y atacará a tus enemigos`, 'area');
      if (this.crewMemory) this.crewMemory(n, 'Me diste el mando de nuestro segundo barco. ¡Qué honor!');
      sfx('quest');
    });
  };
  P.updateEscort = function (dt) {
    const n = this.escortCaptain(), b = this.boat;
    const E = this.escort;
    if (!n || !this.sailing || b.sinking || (E && E.downT > 0)) {
      if (E && E.mesh) { this.scene.remove(E.mesh); E.label.el.remove(); E.mesh = null; }
      if (E && E.downT > 0) E.downT -= dt;
      return;
    }
    if (!E || !E.mesh) {
      const mesh = makeShip(this.M, this.texSet);
      mesh.traverse((o) => { if (o.userData.sail) o.material = new THREE.MeshLambertMaterial({ color: 0xd8c8a0, side: THREE.DoubleSide }); if (o.userData.flag) o.material = new THREE.MeshLambertMaterial({ color: 0x2a6a3a, side: THREE.DoubleSide }); });
      mesh.scale.setScalar(0.8);
      this.scene.add(mesh);
      const maxHp = 300 + n.level * 10;
      this.escort = { mesh, x: b.x - 6, z: b.z - 6, h: b.heading, hp: E && E.hp > 0 ? E.hp : maxHp, maxHp, cd: 3, label: this.ui.makeLabel('npc', `⛵ ${n.name}`, { hp: true }), downT: 0 };
    }
    const S = this.escort;
    const back = b.heading + Math.PI, tx = b.x + Math.sin(back + 0.5) * 7, tz = b.z + Math.cos(back + 0.5) * 7;
    const d = Math.hypot(tx - S.x, tz - S.z);
    if (d > 40) { S.x = tx; S.z = tz; }
    const sp = Math.min(d, (Math.abs(b.speed) + 2) * dt * 1.2);
    if (d > 0.5) { const nx = S.x + ((tx - S.x) / d) * sp, nz = S.z + ((tz - S.z) / d) * sp; if (!this.shipBlocked(nx, nz, S.h)) { S.x = nx; S.z = nz; } S.h += Math.max(-dt, Math.min(dt, ((Math.atan2(tx - S.x, tz - S.z) - S.h + Math.PI * 3) % (Math.PI * 2)) - Math.PI)); }
    S.mesh.position.set(S.x, -0.05 + Math.sin(this.time * 1.2) * 0.04, S.z);
    S.mesh.rotation.y = S.h;
    this.ui.placeLabel(S.label, S.x, 3.6, S.z);
    // ataca a barcos, serpientes y globos cercanos
    S.cd -= dt;
    if (S.cd <= 0 && this.naval) {
      S.cd = 3.5;
      const targets = [...this.naval.ships.filter((k) => !k.sinking), ...this.naval.serpents.filter((k) => !k.dead)];
      let best = null, bd = 18;
      for (const t of targets) { const dd = Math.hypot(t.x - S.x, t.z - S.z); if (dd < bd) { bd = dd; best = t; } }
      if (best) this.shootBall(S.x, S.z, 0.75, best.x + (Math.random() - 0.5), best.z + (Math.random() - 0.5), 'player', 14 + n.level * 1.5);
      // los enemigos también le disparan
      for (const t of this.naval.ships) if (!t.sinking && Math.hypot(t.x - S.x, t.z - S.z) < 14 && Math.random() < 0.35) { S.hp -= 8 + t.level * 1.2; this.puff(S.x, 1, S.z, 0xff9a40); }
      this.ui.setHp(S.label, Math.max(0, S.hp) / S.maxHp);
      if (S.hp <= 0) { S.downT = 180; S.hp = S.maxHp; this.toast(`💥 El barco de ${n.name} se retira a reparar (3 min)`, 'area'); }
    }
  };

  // ============================================================ escuela de combate
  P.schoolMenu = function () {
    const crew = this.crew().filter((n) => !this.soc(n.id).role || this.soc(n.id).role === 'ship');
    if (!crew.length) return this.toast('No tienes tripulación que entrenar');
    this.ui.openDialog('🏫 Escuela de combate', 'Maestra Sable: «Por 3000 oro enseño a un tripulante una segunda técnica distinta de la suya.»', [
      ...crew.map((n) => { const s = this.soc(n.id); return { label: `${n.name} (${SK2[this.crewClass(n)]}${s.sk2 ? ' + ' + SK2[s.sk2] : ''})`, action: () => this.schoolPick(n) }; }),
      { label: 'Cerrar', action: null },
    ]);
  };
  P.schoolPick = function (n) {
    const main = this.crewClass(n);
    this.ui.openDialog(`🏫 ${n.name}`, '¿Qué técnica quieres que aprenda?', [
      ...Object.keys(SK2).filter((k) => k !== main).map((k) => ({ label: `${SK2[k]} (3000 oro)`, action: () => this.buy({ gold: 3000 }, () => { this.soc(n.id).sk2 = k; this.soc(n.id).sk2l = 1; this.toast(`🏫 ${n.name} aprende ${SK2[k]}`, 'area'); if (this.crewMemory) this.crewMemory(n, `Aprendí ${SK2[k]} en la escuela de combate.`); sfx('level'); }) })),
      { label: 'Cancelar', action: null },
    ]);
  };
  P.crewSkill2Tick = function (n, dt) {
    const s = this.soc(n.id);
    if (!s.sk2 || !s.crew || s.role || n.ko || n.fight) return;
    n.csk2 = (n.csk2 ?? 8) - dt;
    if (n.csk2 > 0) return;
    const p = this.player, lv = s.sk2l || 1;
    if (s.sk2 === 'heal') {
      const all = [p, ...this.companions()].filter((k) => !k.ko && k.dist(n) < 7);
      const worst = all.find((k) => (k === p ? p.hp / p.maxHp : k.chp / k.cmax) < 0.6);
      if (!worst) { n.csk2 = 1; return; }
      n.csk2 = 14;
      if (worst === p) p.hp = Math.min(p.maxHp, p.hp + p.maxHp * (0.12 + lv * 0.02)); else worst.chp = Math.min(worst.cmax, worst.chp + worst.cmax * (0.18 + lv * 0.02));
      this.ring(worst.x, worst.z, 0.9, 0x7aff8a);
    } else {
      const foe = this.crewFoe();
      if (!foe || foe.dead || foe.dist(n) > 3) { n.csk2 = 1; return; }
      n.csk2 = 11;
      const dmg = Math.round((4 + n.level * 1.8) * (s.sk2 === 'axe' ? 1.5 : 1.9) * (1 + lv * 0.08) * this.crewDmgMul(n));
      n.st.skill = { type: s.sk2 === 'axe' ? 'spin' : s.sk2 === 'spear' ? 'thrust' : 'dash', t: 0, dur: 0.5 };
      if (s.sk2 === 'axe') { this.ring(n.x, n.z, 2.2, 0xff9a50); for (const e of this.enemies) if (!e.dead && e.dist(n) < 2.3 && (!e.hostile || e.hostile())) this.hitEnemy(e, dmg, false, n); }
      else { this.slash(n, 0x9ad8ff); this.hitEnemy(foe, dmg, true, n); }
    }
    this.ui.float(SK2[s.sk2], 'crit', n.x, n.model.height + 0.5, n.z);
    s.sk2u = (s.sk2u || 0) + 1;
    if (s.sk2u >= 10 * lv && lv < 10) { s.sk2u = 0; s.sk2l = lv + 1; }
  };

  // ============================================================ pueblos que crecen
  P.townGrowth = function (town) { this.towns9 = this.towns9 || {}; return this.towns9[town] || 0; };
  P.helpTown = function (leaderId) {
    const town = LEADERS9[leaderId], lv = this.townGrowth(town);
    if (lv >= 5) return this.toast(`🏘 ${town} ya es una gran ciudad`);
    const cost = { gold: 600 * (lv + 1), wood: 15 * (lv + 1), stone: 15 * (lv + 1) };
    this.buy(cost, () => {
      this.towns9[town] = lv + 1;
      this.growTown(leaderId, true);
      this.addBounty && this.isMarine() && this.addBounty(0, 'x');
      this.toast(`🏘 ¡${town} crece a nivel ${lv + 1}! ${lv + 1 >= 3 ? 'Ya tiene tienda nueva.' : ''}`, 'area');
      sfx('quest');
    });
  };
  P.growTown = function (leaderId, fresh) {
    const town = LEADERS9[leaderId], lv = this.townGrowth(town), n = this.npcById(leaderId);
    if (!n || !lv) return;
    this.townMeshes = this.townMeshes || {};
    const old = this.townMeshes[town];
    if (old) this.scene.remove(old.g);
    const g = new THREE.Group(), c = n.home || { x: n.x, z: n.z };
    const M = (col) => new THREE.MeshLambertMaterial({ color: col });
    let placed = 0, k = 0;
    const want = lv * 2;
    while (placed < want && k < 200) {
      k++;
      const a = (k * 2.399) % (Math.PI * 2), r = 7 + (k % 5);
      const x = Math.round(c.x + Math.cos(a) * r), z = Math.round(c.z + Math.sin(a) * r);
      if (!this.W.walkable(x, z) || !this.W.walkable(x + 1, z) || !this.W.walkable(x, z + 1) || !this.W.walkable(x + 1, z + 1)) continue;
      const h = new THREE.Group();
      const wall = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 1.8), M([0xe8d8b0, 0xd8c8a8, 0xf0e0c0][placed % 3])); wall.position.y = 0.6; h.add(wall);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.9, 4), M([0xb05a3a, 0x3a5a8a, 0x5a7a3a][placed % 3])); roof.rotation.y = Math.PI / 4; roof.position.y = 1.65; h.add(roof);
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.05), M(0x5a3a1a)); door.position.set(0, 0.3, 0.92); h.add(door);
      if (lv >= 4) { const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd060 })); lamp.position.set(0.7, 1.0, 0.95); h.add(lamp); }
      h.position.set(x + 0.5, 0, z + 0.5); h.rotation.y = Math.round(Math.atan2(c.x - x, c.z - z) / (Math.PI / 2)) * (Math.PI / 2);
      g.add(h);
      for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) this.W.setBlocked(x + dx, z + dz, 1);
      placed++;
    }
    this.scene.add(g);
    this.townMeshes[town] = { g };
    if (fresh) this.ring(c.x, c.z, 4, 0xffe080);
  };
  const basePM = P.priceMul;
  P.priceMul = function () { return (basePM ? basePM.call(this) : 1) * this.priceMul9(); };
  P.priceMul9 = function () {
    const p = this.player;
    for (const [id, town] of Object.entries(LEADERS9)) { const n = this.npcById(id); if (n && n.dist(p) < 25) return 1 - this.townGrowth(town) * 0.04; }
    return 1;
  };

  // ============================================================ cacerías de bestias legendarias
  P.updateBeastHunt = function (dt) {
    if (this.net.isClient && this.net.active) return;
    const B = this.beast;
    if (B) {
      if (B.e.dead || B.e.removed) { this.beast = null; return; }
      B.t -= dt;
      if (B.t <= 0) { B.e.remove(); this.beast = null; this.toast('🐾 La bestia legendaria ha desaparecido...'); }
      return;
    }
    this.beastT = (this.beastT ?? 420) - dt;
    if (this.beastT > 0 || !this.started) return;
    this.beastT = 700 + Math.random() * 500;
    const isles = this.islets.filter((r) => !r.ghost && !r.portal && r.spawns.length);
    const R = isles[Math.floor(Math.random() * isles.length)];
    let sp = null;
    for (let i = 0; i < 60 && !sp; i++) { const x = R.center.x + Math.round((Math.random() - 0.5) * 20), z = R.center.z + Math.round((Math.random() - 0.5) * 20); if (R.walkable(x, z)) sp = { x, z }; }
    if (!sp) return;
    const type = BEASTS[Math.floor(Math.random() * BEASTS.length)];
    const e = this.spawnTemp(type, sp.x, sp.z, Math.min(500, this.player.level + 5));
    e.beast = true;
    this.beast = { e, t: 600, isle: R.name };
    const msg = `🐾 ¡${e.def.name} ha aparecido en ${R.name}! El primero en cazarla se lleva un trofeo (10 min)`;
    this.toast(msg, 'area');
    this.net.sendX({ k: 'toast', msg });
    sfx('quest');
  };
  P.beastMarker = function () { return this.beast && !this.beast.e.dead ? { x: this.beast.e.x, z: this.beast.e.z } : null; };
  P.beastReward = function () {
    const p = this.player;
    const gold = 3000 + p.level * 30;
    p.gold += gold; this.give('ficha', 8);
    if (!this.ownCos('c_capa_cazador')) this.give('c_capa_cazador');
    this.stats.beasts = (this.stats.beasts || 0) + 1;
    this.toast(`🏆 ¡Has cazado la bestia legendaria! +${gold} oro, 8 🎟 y la Capa del cazador`, 'area');
    sfx('level');
  };

  // ============================================================ banquete de la tripulación
  P.banquet = function () {
    const p = this.player;
    if (!this.crew().length) return this.toast('Necesitas tripulación para un banquete');
    const ingr = Object.keys(p.inv).filter((k) => p.inv[k] > 0 && ITEMS[k] && (ITEMS[k].type === 'ingr' || ITEMS[k].type === 'food'));
    const total = ingr.reduce((a, k) => a + p.inv[k], 0);
    if (total < 6) return this.toast('🍲 Necesitas 6 ingredientes o platos (pescado, trigo, carne, tartas...)');
    let left = 6;
    for (const k of ingr) { const t = Math.min(left, p.inv[k]); p.inv[k] -= t; left -= t; if (!left) break; }
    const cook = this.crewJob && this.crewJob('cocinero');
    this.addBuff('banquete', cook ? 900 : 600);
    for (const n of this.crew()) { this.addFriend(n, 2, true); if (n.chp !== undefined) n.chp = n.cmax; }
    p.hp = p.maxHp;
    this.toast(`🍲 ¡Banquete con la tripulación! +15% ataque y defensa durante ${cook ? 15 : 10} min${cook ? ' (gracias al cocinero)' : ''}`, 'area');
    sfx('quest');
  };

  // ============================================================ sueños y visiones
  const baseSleep = P.sleepHere;
  P.sleepHere = function () {
    const r = baseSleep.call(this);
    if (Math.random() < 0.4) setTimeout(() => this.dream(), 1500);
    return r;
  };
  P.dream = function () {
    if (Math.random() < 0.5) {
      this.addTreasureMap();
      this.ui.openDialog('💤 Un sueño...', 'Sueñas con una playa bajo la luna y una X marcada en la arena. Al despertar, lo dibujas en un mapa.', [{ label: '🗺️ ¡A buscarlo!', action: null }]);
    } else {
      const isles = this.islets.filter((r) => !r.ghost && r.spawns.length);
      const R = isles[Math.floor(Math.random() * isles.length)];
      this.vision = { isle: R.id, name: R.name, day: this.day };
      this.ui.openDialog('💤 Una visión...', `Una sombra gigante te habla en sueños: «Te espero en ${R.name}... hoy.» Si vas, aparecerá la Sombra del Abismo.`, [{ label: '😨 Vale...', action: null }]);
    }
  };
  P.updateVision = function () {
    const V = this.vision;
    if (!V) return;
    if (V.day !== this.day) { this.vision = null; return; }
    if (V.spawned || this.isleOf(this.player.x, this.player.z) !== V.isle) return;
    const R = this.islets.find((r) => r.id === V.isle), p = this.player;
    for (let i = 0; i < 40; i++) { const x = p.tx + Math.round((Math.random() - 0.5) * 10), z = p.tz + Math.round((Math.random() - 0.5) * 10); if (R.walkable(x, z) && Math.hypot(x - p.x, z - p.z) > 4) { this.spawnTemp('sombra_abismo', x, z, Math.min(500, p.level + 5)); V.spawned = true; this.toast('🌑 ¡La Sombra del Abismo surge de tu sueño!', 'area'); sfx('hurt'); break; } }
  };

  // ============================================================ torneo de tripulaciones
  P.crewTourney = function () {
    if (this.ctour) return;
    if (this.stats.ctourDay === this.day) return this.toast('El torneo de tripulaciones ya se celebró hoy');
    const team = this.activeCrew().slice(0, 3);
    if (team.length < 1) return this.toast('Necesitas al menos un tripulante que te acompañe');
    this.stats.ctourDay = this.day;
    const p = this.player;
    p.x = 50; p.z = 30; p.path = [];
    for (const n of team) { this.placeNear(n, 50, 30); if (n.ko) this.reviveComp(n, 1); }
    this.ctour = { round: 0, temps: [], wait: 2 };
    this.toast('🏟 ¡Torneo de tripulaciones! 3 rondas contra otras tripulaciones', 'area');
  };
  P.updateCrewTourney = function (dt) {
    const C = this.ctour;
    if (!C) return;
    const p = this.player, el = document.getElementById('eventBanner');
    if (p.dead || Math.hypot(p.x - 50, p.z - 30) > 20 || this.sailing) { for (const e of C.temps) if (!e.removed) e.remove(); this.ctour = null; this.purgeTemps(); if (el) el.classList.add('hidden'); return this.toast('🏟 Te has retirado del torneo'); }
    const alive = C.temps.filter((e) => !e.dead && !e.removed);
    if (el) { el.classList.remove('hidden'); el.textContent = `🏟 Torneo de tripulaciones · ronda ${Math.max(1, C.round)}/3 · rivales: ${alive.length}`; }
    if (alive.length) return;
    C.wait -= dt;
    if (C.wait > 0) return;
    C.wait = 3;
    if (C.round >= 3) {
      this.ctour = null; if (el) el.classList.add('hidden');
      const gold = 2500 + p.level * 25;
      p.gold += gold; this.give('ficha', 6);
      for (const n of this.activeCrew()) { this.addFriend(n, 5, true); if (this.crewMemory) this.crewMemory(n, '¡Ganamos el torneo de tripulaciones!'); }
      this.stats.ctours = (this.stats.ctours || 0) + 1;
      this.toast(`🏆 ¡Tu tripulación gana el torneo! +${gold} oro y 6 🎟`, 'area');
      sfx('quest');
      return;
    }
    C.round++;
    const avg = Math.round([p, ...this.activeCrew()].reduce((a, k) => a + (k.level || 1), 0) / (1 + this.activeCrew().length));
    const names = [['☠ Tripulación del Cuervo', 'pirate'], ['⚓ Escuadra de la Marina', 'marine'], ['💀 Hermandad del Hueso', 'skeleton']][C.round - 1];
    const n = 2 + C.round;
    for (let i = 0; i < n; i++) { const x = 50 + Math.round(Math.cos(i) * 5), z = 24 + Math.round(Math.sin(i) * 2); if (this.W.walkable(x, z)) { const e = this.spawnTemp(names[1], x, z, Math.max(5, avg - 2 + C.round)); e.provoked = true; e.state = 'chase'; C.temps.push(e); } }
    this.toast(`🏟 Ronda ${C.round}: ${names[0]}`, 'area');
  };

  // ============================================================ Isla Errante
  P.updateWander = function (dt) {
    this.wnT = (this.wnT || 0) - dt;
    if (this.wnT > 0) return;
    this.wnT = 1;
    const p = this.player, today = this.day % 3;
    for (const R of this.wanderIsles || []) {
      const onIt = !R.hidden && R.contains(Math.round(p.x), Math.round(p.z)) && !this.sailing;
      const want = R.wander === today || onIt;
      if (want === !R.hidden) { if (want) this.wanderGuard(R); continue; }
      R.hidden = !want;
      for (const m of R.meshes || []) m.visible = want;
      this.buildWander(R);
      R.group.visible = want;
      const ch = this.wanderChest(R);
      const i = this.chests.indexOf(ch);
      if (want && i < 0) { this.chests.push(ch); this.flags[ch.id] = this.flags[ch.id + '_day'] === this.day; }
      if (!want && i >= 0) this.chests.splice(i, 1);
      if (!want && R.guard && !R.guard.removed) { R.guard.remove(); R.guard = null; }
    }
  };
  P.wanderChest = function (R) { return R.chest || (R.chest = { id: 'errante_cofre' + R.wander, x: R.mazeCenter.x, z: R.mazeCenter.z + 1, loot: { gold: 3000, potion: 3 } }); };
  P.buildWander = function (R) {
    if (R.group) return;
    const g = new THREE.Group();
    const stone = new THREE.MeshLambertMaterial({ color: 0x8a9a9a, map: this.M.tx.stone });
    const geo = new THREE.BoxGeometry(1, 1.6, 1);
    const inst = new THREE.InstancedMesh(geo, stone, R.maze.length);
    const m4 = new THREE.Matrix4();
    R.maze.forEach((c, i) => { m4.makeTranslation(c.x, 0.8, c.z); inst.setMatrixAt(i, m4); });
    inst.castShadow = true;
    g.add(inst);
    const glow = new THREE.MeshBasicMaterial({ color: 0x7af0e0 });
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const o = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 2.2, 6), stone); o.position.set(R.mazeCenter.x + dx, 1.1, R.mazeCenter.z + dz); g.add(o); const t = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), glow); t.position.set(R.mazeCenter.x + dx, 2.3, R.mazeCenter.z + dz); g.add(t); }
    const ch = this.wanderChest(R);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.55), new THREE.MeshLambertMaterial({ color: 0x3ab8a8 })); box.position.set(ch.x, 0.25, ch.z); g.add(box);
    R.setBlocked(ch.x, ch.z, 1);
    g.visible = false;
    this.scene.add(g);
    R.group = g;
  };
  P.wanderGuard = function (R) {
    if (R.hidden || (this.net.isClient && this.net.active)) return;
    const p = this.player, c = R.mazeCenter;
    if (Math.hypot(p.x - c.x, p.z - c.z) > 4) return;
    if (R.guard && !R.guard.dead && !R.guard.removed) return;
    if (R.guardDay === this.day) return;
    R.guardDay = this.day;
    R.guard = this.spawnTemp('guardian_errante', c.x - 1, c.z - 1, Math.min(500, p.level + 4));
    R.guard.provoked = true; R.guard.state = 'chase';
    this.toast('🗿 ¡El Guardián de la Isla Errante despierta!', 'area');
    sfx('hurt');
  };

  // ============================================================ enganches
  P.npcDialog9 = function (id, opts) {
    if (LEADERS9[id]) { const lv = this.townGrowth(LEADERS9[id]); if (lv < 5) opts.push({ label: `🏘 Ayudar a que ${LEADERS9[id]} crezca (nivel ${lv}/5: ${600 * (lv + 1)} oro, ${15 * (lv + 1)} madera y piedra)`, action: () => this.helpTown(id) }); if (lv >= 3) opts.push({ label: '🛍 Tienda nueva: poción (8 oro)', action: () => this.buy({ gold: 8 }, () => { this.give('potion', 1); this.toast('🍶 +1 poción'); }) }); }
    if (id === 'marisol') opts.push({ label: '🏟 Torneo de tripulaciones (1 al día)', action: () => this.crewTourney() });
    if (id === 'sable') { opts.push({ label: '🏫 Escuela de combate', action: () => this.schoolMenu() }); return 'La técnica se aprende con sudor... y con oro.'; }
    const s = this.soc(id);
    if (s.crew && (s.rank || 0) >= 2 && this.escortId !== id) opts.push({ label: `⛵ Capitanear nuestro segundo barco${this.flags.escortShip ? '' : ' (8000 oro)'}`, action: () => this.setEscort(this.npcById(id)) });
    return null;
  };
  P.npcSable = function () {
    if (this.npcById('sable')) return;
    const n = new D.NPC(this, { id: 'sable', name: 'Maestra de armas Sable', x: 44, z: 46, wander: 1, look: { shirt: 0x8a2a2a, pants: 0x2a2a2a, armor: true, armorColor: 0x8a8a94, hair: 0x1a1a1a, longHair: true, skin: 0xd9a066, sword: true, blade: 0xe8e8f0, shield: true, female: true } });
    n.baseLevel = 80; n.setStats(80);
    this.npcs.push(n);
  };
  const baseDmg = P.damageEnemy;
  P.damageEnemy = function (e, dmg, crit, byCrew, killerId = 0) {
    const was = !e.dead;
    const r = baseDmg.call(this, e, dmg, crit, byCrew, killerId);
    if (was && e.dead && e.beast) {
      this.beast = null;
      if (killerId === 0) this.beastReward(); else this.net.sendX({ k: 'beastDown', killer: killerId });
      if (killerId !== 0) this.toast('🐾 Otro cazador se ha llevado la bestia...');
    }
    return r;
  };
  const baseNet = P.onNetX4;
  P.onNetX4 = function (from, m) {
    if (m.k === 'beastDown') { if (m.killer === this.net.myId) this.beastReward(); else this.toast('🐾 Otro cazador se ha llevado la bestia legendaria'); return true; }
    return baseNet ? baseNet.call(this, from, m) : false;
  };
  P.updateMore9 = function (dt) {
    this.npcSable();
    if (!this.townsGrown) { this.townsGrown = true; for (const id of Object.keys(LEADERS9)) this.growTown(id); }
    this.updateEscort(dt);
    this.updateBeastHunt(dt);
    this.updateCrewTourney(dt);
    this.updateWander(dt);
    for (const n of this.crew()) this.crewSkill2Tick(n, dt);
    this.m9T = (this.m9T || 0) - dt;
    if (this.m9T <= 0) { this.m9T = 1; this.updateVision(); }
  };
  P.newsHtml9 = function () {
    const ws = WANDER_SPOTS[this.day % 3];
    return `<div class="sub">🆕 v3.7</div><ul class="qlist">
      <li>⛵ <b>Barco de la tripulación</b>: un Contramaestre o Primer oficial puede capitanear tu segundo barco (8000 oro): navega contigo y dispara a tus enemigos.</li>
      <li>🏫 <b>Escuela de combate</b>: la Maestra de armas Sable (plaza de Villarroca) enseña una segunda técnica a tus tripulantes.</li>
      <li>🏘 <b>Pueblos que crecen</b>: dona a los líderes (Marisol, Nerea, Mara, Zaid, Ixa, Lucas, Lucía, Dulcinea, Volta, el Maestro). Se construyen casas, bajan los precios y a nivel 3 abren tienda nueva.</li>
      <li>🐾 <b>Bestias legendarias</b>: aparecen de vez en cuando en una isla (punto rojo grande en el minimapa). ¡El primero en cazarlas gana un trofeo!</li>
      <li>🍲 <b>Banquete</b> (⚡ Atajos): 6 ingredientes = +15% ataque y defensa para todos durante 10 min.</li>
      <li>💤 <b>Sueños</b>: al dormir puedes soñar con un tesoro o con la Sombra del Abismo.${this.vision ? ` Hoy te espera en ${this.vision.name}.` : ''}</li>
      <li>🏟 <b>Torneo de tripulaciones</b> con Marisol: tus 3 tripulantes y tú contra otras tripulaciones.</li>
      <li>🌀 <b>Isla Errante</b>: cambia de sitio cada día (hoy cerca de ${ws.ox + (ws.N >> 1)}, ${ws.oz + (ws.N >> 1)}). Laberinto, guardián y cofre en el centro.</li></ul>`;
  };
}

// v4.0: Pueblo de Marea (tritones aliados bajo el mar), clanes rivales, Gran Regata de las Islas, domar bestias,
// la Gaceta de la Bruma (periódico semanal), cueva de cristal con puzle de espejos y cumpleaños de la tripulación.
import * as THREE from 'three';
import { T } from './world.js';
import { ITEMS } from './items.js';

// ---------------------------------------------------------------- Pueblo de Marea (bajo el mar)
const MX = 2400, MZ = 0, MWd = 20, MDp = 16;
export const MAREA_SPOT = { x: 95, z: 150 };
export function makeMarea() {
  const blocked = new Uint8Array(MWd * MDp);
  const inb = (lx, lz) => lx >= 0 && lz >= 0 && lx < MWd && lz < MDp;
  const R = { kind: 'dungeon', id: 'marea', name: 'Pueblo de Marea', X: MX, Z: MZ, underwater: true, friendly: true, exit: { x: MX + 2, z: MZ + 8 }, spawns: [] };
  R.contains = (x, z) => x >= MX - 1 && x <= MX + MWd && z >= MZ - 1 && z <= MZ + MDp;
  R.tile = (x, z) => (inb(x - MX, z - MZ) ? T.SAND : T.WATER);
  R.walkable = (x, z) => { const lx = x - MX, lz = z - MZ; return inb(lx, lz) && !blocked[lz * MWd + lx]; };
  R.setBlocked = (x, z, v) => { const lx = x - MX, lz = z - MZ; if (inb(lx, lz)) blocked[lz * MWd + lx] = v; };
  R.groundY = () => 0;
  R.areaName = () => 'Pueblo de Marea';
  R.homes = [[6, 3], [12, 3], [6, 12], [12, 12], [16, 8]];
  for (const [x, z] of R.homes) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inb(x + dx, z + dz)) blocked[(z + dz) * MWd + x + dx] = 1;
  return R;
}
// ---------------------------------------------------------------- cueva de cristal (puzle de espejos)
const CX = 2500, CZ = 0, CW = 10, CD = 8;
export function makeCrystalCave() {
  const blocked = new Uint8Array(CW * CD);
  const inb = (lx, lz) => lx >= 0 && lz >= 0 && lx < CW && lz < CD;
  const R = { kind: 'dungeon', id: 'cristal_cueva', name: 'Cueva de Cristal', X: CX, Z: CZ, exit: { x: CX + 0, z: CZ + 6 }, spawns: [] };
  R.contains = (x, z) => x >= CX - 1 && x <= CX + CW && z >= CZ - 1 && z <= CZ + CD;
  R.tile = (x, z) => (inb(x - CX, z - CZ) ? T.ROCK : T.WATER);
  R.walkable = (x, z) => { const lx = x - CX, lz = z - CZ; return inb(lx, lz) && !blocked[lz * CW + lx]; };
  R.setBlocked = (x, z, v) => { const lx = x - CX, lz = z - CZ; if (inb(lx, lz)) blocked[lz * CW + lx] = v; };
  R.groundY = () => 0;
  R.areaName = () => 'Cueva de Cristal';
  R.emitter = { x: 1, z: 3 };
  R.target = { x: 7, z: 5 };
  R.mirrors = [{ x: 4, z: 3 }, { x: 4, z: 1 }, { x: 7, z: 1 }, { x: 2, z: 5 }, { x: 6, z: 3 }];
  R.chest = { id: 'cristal_cofre', x: CX + 9, z: CZ + 5, loot: { gold: 2000, potion: 2 } };
  for (const m of [R.emitter, R.target, ...R.mirrors]) blocked[m.z * CW + m.x] = 1;
  blocked[5 * CW + 9] = 1;
  for (let z = 0; z < CD; z++) if (z !== 5) blocked[z * CW + 8] = 1; // muro con puerta
  R.door = { x: 8, z: 5 };
  blocked[5 * CW + 8] = 1;
  return R;
}
const CRYSTAL_ENTRY = { isle: 'burbuja', dx: -8, dz: 8 };
const RIVAL_CLANS = ['Garras Negras', 'Hermandad del Coral', 'Lobos Grises'];
const REGATTA = ['tortuga', 'duna', 'selva'];

export function installMore12(Game, D) {
  const P = Game.prototype;
  const sfx = D.sfx;
  const hash = (s) => { let h = 11; for (const c of s) h = (h * 33 + c.charCodeAt(0)) >>> 0; return h; };

  // ============================================================ Pueblo de Marea
  P.mareaSpot = MAREA_SPOT;
  P.sailAction12 = function () {
    if (this.deck) return null;
    const b = this.boat;
    if (Math.hypot(b.x - MAREA_SPOT.x, b.z - MAREA_SPOT.z) < 9) return { icon: '🔱', label: 'Marea', fn: () => this.diveMarea() };
    if (this.regatta) return null;
    return null;
  };
  P.diveMarea = function () {
    if (!this.flags.diveBell) return this.toast('Necesitas la campana de buceo (Astillera Marga)');
    const p = this.player, b = this.boat;
    this.diveFrom = { x: b.x, z: b.z, h: b.heading };
    this.deck = null; this.autoHelm = null; b.speed = 0; this.sailing = false;
    this.scene.add(p.model.root); p.model.root.rotation.set(0, 0, 0);
    p.x = this.marea.exit.x + 1; p.z = this.marea.exit.z; p.path = [];
    this.unboardCrew(p.x, p.z);
    this.camTarget.set(p.x, 0, p.z);
    this.oxy = 100;
    this.buildMarea();
    this.toast('🔱 Bajas al Pueblo de Marea: los tritones de aquí son amigos. Te dan aire mientras estés en su pueblo', 'area');
  };
  P.inMarea = function () { const r = this.W.regionAt(this.player.x, this.player.z); return r && r.id === 'marea'; };
  P.buildMarea = function () {
    if (this.mareaBuilt) return;
    this.mareaBuilt = true;
    const R = this.marea, g = new THREE.Group(), M = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
    const sand = new THREE.Mesh(new THREE.BoxGeometry(MWd + 6, 0.2, MDp + 6), M(0xd8c098)); sand.position.set(MX + MWd / 2, -0.1, MZ + MDp / 2); g.add(sand);
    R.homes.forEach(([x, z], i) => {
      const shell = new THREE.Mesh(new THREE.SphereGeometry(1.4, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), M([0xf0c8d8, 0xc8e8f0, 0xf0e0b0, 0xd8c8f0, 0xb8f0d8][i % 5])); shell.position.set(MX + x, 0, MZ + z); shell.scale.y = 1.2; g.add(shell);
      const door = new THREE.Mesh(new THREE.CircleGeometry(0.4, 12), M(0x2a3a4a)); door.position.set(MX + x, 0.45, MZ + z + 1.35); g.add(door);
    });
    const cols = [0xff6a5a, 0xffa040, 0xd860c8, 0xf0e060, 0x5ad8c8];
    for (let i = 0; i < 50; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.1 + Math.random() * 0.12, 0.5 + Math.random() * 0.7, 5), M(cols[i % 5])); c.position.set(MX - 2 + Math.random() * (MWd + 3), 0.3, MZ - 2 + Math.random() * (MDp + 3)); g.add(c); }
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 1.4, 12, 1, true), new THREE.MeshLambertMaterial({ color: 0xd8a838, side: THREE.DoubleSide })); bell.position.set(R.exit.x, 0.7, R.exit.z); g.add(bell);
    this.scene.add(g);
    // vecinos tritones
    const looks = [
      { id: 'marina_t', name: 'Reina Marina de Marea', x: 10, z: 7, look: { skin: 0x7ad0c0, hair: 0xf0e0a0, longHair: true, dress: true, dressColor: 0x2a8aa8, hat: 'circlet', hatColor: 0xffd040, halo: 0x7af0ff, spear: true, trident: true, female: true } },
      { id: 'coralino', name: 'Mercader Coralino', x: 14, z: 6, look: { skin: 0x5ab0a0, hair: 0xd8602a, shirt: 0x3a8a9a, pants: 0x1a5a6a, vest: 0xf0c060 } },
      { id: 'nerito', name: 'Guardia Nerito', x: 8, z: 9, look: { skin: 0x4ab0a0, hair: 0x1a5a7a, shirt: 0x2a7a8a, armor: true, armorColor: 0x3a9aa8, spear: true, trident: true } },
    ];
    for (const L of looks) { const n = new D.NPC(this, { id: L.id, name: L.name, x: MX + L.x, z: MZ + L.z, wander: 2, look: L.look }); n.baseLevel = 70; n.setStats(70); this.npcs.push(n); }
  };
  P.updateMarea = function () { if (this.inMarea()) this.oxy = 100; };
  P.mareaRep = function () { return this.flags.mareaRep || 0; };
  P.mareaDialog = function (id, opts) {
    if (id === 'marina_t') {
      const q = this.flags.mareaQ || 0;
      if (q === 0) opts.push({ label: '🔱 «Ayúdanos con los tritones salvajes»', action: () => { this.flags.mareaQ = 1; this.flags.mareaK0 = this.stats.k_merfolk || 0; this.toast('🔱 Misión: vence a 6 tritones salvajes en Coralia'); } });
      else if (q === 1) { const k = (this.stats.k_merfolk || 0) - (this.flags.mareaK0 || 0); if (k >= 6) opts.push({ label: '✔ Entregar: tritones salvajes', action: () => { this.flags.mareaQ = 2; this.flags.mareaRep = this.mareaRep() + 1; this.player.gold += 3000; this.toast('🔱 La Reina te nombra amigo de Marea (+3000 oro)', 'area'); sfx('quest'); } }); }
      else if (q === 2) opts.push({ label: '⚫ Entregar 5 perlas negras para el templo', action: () => this.buy({ perla: 5 }, () => { this.flags.mareaQ = 3; this.flags.mareaRep = this.mareaRep() + 1; this.give('c_corona_marea'); this.toast('🔱 ¡Recibes la Corona de Marea!', 'area'); sfx('quest'); }) });
      return q >= 3 ? 'Eres un héroe para el pueblo de Marea. Nuestras puertas siempre estarán abiertas.' : q === 1 ? `Los tritones salvajes de Coralia amenazan a mi pueblo. (${Math.max(0, (this.stats.k_merfolk || 0) - (this.flags.mareaK0 || 0))}/6)` : 'Bienvenido al Pueblo de Marea, habitante de la superficie.';
    }
    if (id === 'coralino') {
      const sell = (it, price) => opts.push({ label: `${ITEMS[it].icon} ${ITEMS[it].name} (${price} oro)`, action: () => this.buy({ gold: price }, () => this.give(it, 1)) });
      sell('perla', this.mareaRep() >= 1 ? 70 : 110); sell('coral', 15); sell('pocion_mayor', 45);
      if (this.mareaRep() >= 1 && !this.ownCos('c_capa_marea')) sell('c_capa_marea', 1500);
      return 'Coral, perlas y tesoros del fondo del mar. ¡Precios de amigo para los amigos de la Reina!';
    }
    if (id === 'nerito') return 'Más allá del arrecife viven los tritones salvajes. Nosotros no somos como ellos.';
    return null;
  };

  // ============================================================ clanes rivales
  P.rivalPts = function () { this.rvc = this.rvc || { wk: -1, pts: {}, me: 0 }; const wk = Math.floor(this.day / 7); if (this.rvc.wk !== wk) { if (this.rvc.wk >= 0) this.rivalWeekEnd(); this.rvc = { wk, pts: Object.fromEntries(RIVAL_CLANS.map((c) => [c, 0])), me: 0 }; } return this.rvc; };
  P.rivalWeekEnd = function () {
    const R = this.rvc, tab = [...Object.entries(R.pts).map(([n, v]) => ({ n, v })), { n: 'Tu tripulación', v: R.me, me: true }].sort((a, b) => b.v - a.v);
    const pos = tab.findIndex((r) => r.me) + 1;
    if (pos === 1 && R.me > 0) { this.player.gold += 5000; this.give('ficha', 10); this.toast('🏆 ¡Tu tripulación ha sido la mejor de la semana frente a los clanes rivales! +5000 oro', 'area'); }
  };
  P.clanScore = function (n, why) { const R = this.rivalPts(); R.me += n; this.toast(`🏴 +${n} puntos de clan (${why})`); };
  P.rivalScore = function (n, why) { const R = this.rivalPts(), c = RIVAL_CLANS[Math.floor(Math.random() * RIVAL_CLANS.length)]; R.pts[c] += n; this.toast(`⚔️ El clan ${c} gana ${n} puntos: ${why}`); return c; };
  P.rivalSquad = function (x, z, why) {
    if (this.net.isClient && this.net.active) return;
    const c = RIVAL_CLANS[Math.floor(Math.random() * RIVAL_CLANS.length)], p = this.player, temps = [];
    for (let i = 0; i < 3; i++) for (let k = 0; k < 20; k++) { const tx = Math.round(x + (Math.random() - 0.5) * 8), tz = Math.round(z + (Math.random() - 0.5) * 8); if (this.W.walkable(tx, tz) && Math.hypot(tx - p.x, tz - p.z) > 3) { const e = this.spawnTemp('pirate', tx, tz, Math.max(5, p.level)); e.provoked = true; e.state = 'chase'; e.label.nm.textContent = `${c} · Nv. ${e.level}`; e.rivalClan = c; temps.push(e); break; } }
    if (temps.length) { this.rsq = { temps, clan: c }; this.toast(`⚔️ ¡El clan ${c} viene a por ${why}!`, 'area'); }
  };
  P.updateRivals = function () {
    this.rivalPts();
    const S = this.rsq;
    if (S && S.temps.every((e) => e.dead || e.removed)) { this.rsq = null; this.clanScore(20, `vencer al clan ${S.clan}`); }
    // si nadie caza la bestia legendaria, se la lleva un clan rival
    if (this.beast && this.beast.t < 1.2 && !this.beast.rivalDone) { this.beast.rivalDone = true; this.rivalScore(40, 'se han llevado la bestia legendaria'); }
  };
  const baseBeast = P.beastReward;
  P.beastReward = function () { const r = baseBeast.call(this); this.clanScore(40, 'bestia legendaria'); return r; };
  const baseDig = P.dig;
  P.dig = function (m) {
    const r = baseDig.call(this, m);
    this.clanScore(15, 'tesoro');
    if (Math.random() < 0.4) setTimeout(() => this.rivalSquad(this.player.x, this.player.z, 'tu tesoro'), 2500);
    return r;
  };

  // ============================================================ Gran Regata de las Islas
  P.regattaMenu = function () {
    if (this.regatta) return this.toast('Ya estás en la regata');
    this.ui.openDialog('🏁 Gran Regata de las Islas', 'Rodea las islas Tortuga, Duna y Selva y vuelve a Puerto Salitre. ¡Cuidado con los barriles y las rocas! Inscripción: 200 oro. Si ganas, 3000 oro.', [
      { label: '⛵ ¡Me apunto!', action: () => this.buy({ gold: 200 }, () => this.startRegatta()) },
      { label: 'Ahora no', action: null },
    ]);
  };
  P.startRegatta = function () {
    const pts = REGATTA.map((id) => { const d = this.docks.find((k) => k.id === id) || this.docks[1]; return { x: d.shipX, z: d.shipZ }; });
    const home = this.docks[0]; pts.push({ x: home.shipX, z: home.shipZ });
    let dist = 0, prev = { x: home.shipX, z: home.shipZ };
    for (const c of pts) { dist += Math.hypot(c.x - prev.x, c.z - prev.z); prev = c; }
    // obstáculos: barriles y rocas en el camino
    const g = new THREE.Group(), obs = [];
    prev = { x: home.shipX, z: home.shipZ };
    for (const c of pts) {
      for (let i = 1; i < 6; i++) {
        const k = i / 6, x = prev.x + (c.x - prev.x) * k + (Math.random() - 0.5) * 8, z = prev.z + (c.z - prev.z) * k + (Math.random() - 0.5) * 8;
        if (this.W.tileAll(Math.round(x), Math.round(z)) !== T.WATER) continue;
        const rock = Math.random() < 0.4;
        const m = rock ? new THREE.Mesh(new THREE.DodecahedronGeometry(0.9, 0), new THREE.MeshLambertMaterial({ color: 0x6a6a6a })) : new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.8, 10), new THREE.MeshLambertMaterial({ color: 0x8a5a2a }));
        m.position.set(x, rock ? 0.2 : 0.1, z); g.add(m); obs.push({ x, z, r: rock ? 1.9 : 1.4, rock, m });
      }
      prev = c;
    }
    this.scene.add(g);
    const sp = 9 * this.shipStats().speed;
    const rivals = ['La Gaviota Roja', 'El Delfín Veloz', 'La Sirena de Plata'].map((n) => ({ n, t: Math.round((dist / sp) * (1.25 + Math.random() * 0.4)) }));
    this.regatta = { pts, i: 0, t: 0, obs, g, rivals, ringT: 0 };
    if (!this.sailing) this.toast('🏁 ¡Sube a tu barco! La regata empieza ya');
    this.toast('🏁 ¡Gran Regata de las Islas! Sigue los anillos dorados', 'area');
  };
  P.updateRegatta = function (dt) {
    const R = this.regatta; if (!R) return;
    const b = this.boat, el = document.getElementById('eventBanner');
    R.t += dt;
    const c = R.pts[R.i];
    R.ringT -= dt; if (R.ringT <= 0) { R.ringT = 0.8; this.ring(c.x, c.z, 4, 0xffd040); }
    if (el) { el.classList.remove('hidden'); el.textContent = `🏁 Gran Regata · boya ${R.i + 1}/${R.pts.length} · ${Math.round(R.t)} s`; }
    if (this.sailing) {
      for (const o of R.obs) if (!o.hit && Math.hypot(b.x - o.x, b.z - o.z) < o.r) { o.hit = true; o.m.visible = false; b.speed *= 0.3; this.damageBoat(o.rock ? 12 : 4, b.x, b.z); this.toast(o.rock ? '🪨 ¡Roca!' : '🛢 ¡Barril!'); }
      if (Math.hypot(b.x - c.x, b.z - c.z) < 6) { R.i++; sfx('coin'); }
    }
    if (R.t > 900) { this.endRegatta(false); return; }
    if (R.i >= R.pts.length) this.endRegatta(true);
  };
  P.endRegatta = function (finished) {
    const R = this.regatta; this.regatta = null;
    this.scene.remove(R.g);
    const el = document.getElementById('eventBanner'); if (el) el.classList.add('hidden');
    if (!finished) return this.toast('🏁 Se acabó el tiempo de la regata');
    const tab = [...R.rivals, { n: 'Tu barco', t: Math.round(R.t), me: true }].sort((a, b) => a.t - b.t);
    const win = tab[0].me;
    if (win) { this.player.gold += 3000; this.stats.regattas = (this.stats.regattas || 0) + 1; this.clanScore(25, 'Gran Regata'); }
    this.ui.openDialog('🏁 Resultado de la Gran Regata', tab.map((r, i) => `${i + 1}. ${r.me ? '<b>' + r.n + '</b>' : r.n} · ${r.t} s`).join('<br>') + (win ? '<br><br>¡Has ganado! +3000 oro' : ''), [{ label: 'Vale', action: null }]);
    sfx(win ? 'quest' : 'coin');
  };

  // ============================================================ domar bestias
  P.tameTarget = function () {
    const p = this.player;
    for (const e of this.enemies) {
      if (e.dead || e.removed || !['tiger', 'lobo_nieve'].includes(e.type) || e.hp > e.maxHp * 0.25 || e.dist(p) > 2.4) continue;
      return e;
    }
    return null;
  };
  P.tame = function (e) {
    const p = this.player;
    if (!p.inv.meat) return this.toast('🍖 Necesitas carne cruda para domarlo');
    p.inv.meat--;
    const chance = 0.35 + this.jobLevel('cazador') * 0.015;
    if (Math.random() < chance) {
      const id = e.type === 'tiger' ? 'tigre_m' : 'lobo_m';
      this.ownMounts = this.ownMounts || [];
      if (!this.ownMounts.includes(id)) this.ownMounts.push(id);
      this.mountSel = id;
      e.hp = 0; e.dead = true; e.deadT = 99; e.model.root.visible = false; e.label.el.style.display = 'none';
      this.toast(`🐾 ¡Has domado ${e.type === 'tiger' ? 'un tigre' : 'un lobo de las nieves'}! Ya puedes montarlo con 🐴`, 'area');
      this.jobXp('cazador', 120);
      sfx('level');
    } else {
      this.toast('🍖 Se come la carne... pero no se deja. ¡Inténtalo otra vez!');
      e.state = 'chase';
    }
  };

  // ============================================================ la Gaceta de la Bruma
  P.gazette = function () {
    const wk = Math.floor(this.day / 7), st = this.stats;
    this.gz = this.gz || {};
    if (this.gz.wk !== wk) this.gz = { wk, base: { kills: st.kills || 0, famous: st.famous || 0, beasts: st.beasts || 0, ships: (st.s_marine || 0) + (st.s_pirate || 0) }, clue: false };
    const B = this.gz.base, p = this.player;
    const kills = (st.kills || 0) - B.kills, famous = (st.famous || 0) - B.famous, ships = (st.s_marine || 0) + (st.s_pirate || 0) - B.ships;
    const heads = [];
    heads.push(kills > 20 ? `⚔️ «${p.name} siembra el terror: ${kills} enemigos vencidos esta semana»` : `⚔️ «${p.name} pasa una semana tranquila»`);
    if (famous) heads.push(`☠ «Cae ${famous} pirata${famous > 1 ? 's' : ''} famoso${famous > 1 ? 's' : ''} ante ${p.name}»`);
    if (ships) heads.push(`💥 «${ships} barco${ships > 1 ? 's' : ''} hundido${ships > 1 ? 's' : ''}: los mares tiemblan»`);
    heads.push(`💰 «La recompensa por ${p.name} asciende a ${this.bounty || 0} oro»`);
    const C = Object.values(this.conq || {}); if (C.length) heads.push(`🏴‍☠️ «${C[0].name} gobierna ${C[0].isle} con mano de hierro»`);
    const pt = this.partner(); if (pt) heads.push(`💗 «Se rumorea que ${p.name} y ${pt.name} ${this.soc(pt.id).married ? 'son la pareja más feliz de las islas' : 'pasean juntos al atardecer'}»`);
    const R = this.rivalPts(); const top = Object.entries(R.pts).sort((a, b) => b[1] - a[1])[0];
    heads.push(`🏴 «El clan ${top[0]} lidera la temporada con ${top[1]} puntos (tú: ${R.me})»`);
    const W = [{ ox: 84, oz: 186 }, { ox: 198, oz: 110 }, { ox: 100, oz: -100 }][this.day % 3];
    const rumors = [`🌀 Rumor: hoy la Isla Errante se ha visto cerca de (${W.ox + 22}, ${W.oz + 22}).`, `🐾 Rumor: los cazadores dicen que las bestias legendarias prefieren las islas grandes.`, `🔔 Rumor: un galeón dorado yace hundido al oeste de Isla Merengue.`, `💎 Rumor: en el Archipiélago Burbuja hay una cueva de cristal con un enigma de luz.`];
    const opts = [];
    if (!this.gz.clue) opts.push({ label: '🗺 Seguir la pista secreta (mapa del tesoro)', action: () => { this.gz.clue = true; this.addTreasureMap(); this.toast('📰 La Gaceta esconde un mapa en la última página...'); } });
    opts.push({ label: 'Cerrar', action: null });
    this.ui.openDialog(`📰 La Gaceta de la Bruma · Semana ${wk + 1}`, `${heads.join('<br>')}<br><br>${rumors[wk % rumors.length]}`, opts);
  };

  // ============================================================ cueva de cristal
  P.crystalEntry = function () { const R = this.islets.find((r) => r.id === CRYSTAL_ENTRY.isle); if (!R) return null; if (!R.crystalEntry) { let s = null; for (let k = 0; k < 30 && !s; k++) { const x = R.center.x + CRYSTAL_ENTRY.dx + (k % 5) - 2, z = R.center.z + CRYSTAL_ENTRY.dz + Math.floor(k / 5) - 2; if (R.walkable(x, z)) s = { x, z }; } R.crystalEntry = s; } return R.crystalEntry; };
  P.buildCaveEntry = function () {
    if (this.caveEntryBuilt) return;
    const s = this.crystalEntry(); if (!s) return;
    this.caveEntryBuilt = true;
    const g = new THREE.Group(), cm = new THREE.MeshLambertMaterial({ color: 0x9ae8ff, emissive: 0x1a4a5a });
    for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.2 + (i % 3) * 0.5, 5), cm); const a = (i / 6) * Math.PI - Math.PI / 2; c.position.set(Math.cos(a) * 1.1, 0.6, Math.sin(a) * 0.5 - 0.6); c.rotation.z = Math.cos(a) * 0.4; g.add(c); }
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.6, 16), new THREE.MeshBasicMaterial({ color: 0x0a1a2a })); hole.rotation.x = -Math.PI / 2; hole.position.y = 0.02; g.add(hole);
    g.position.set(s.x, 0, s.z); this.scene.add(g);
  };
  P.enterCave = function () {
    const p = this.player, s = this.crystalEntry();
    this.caveFrom = { x: s.x + 1, z: s.z };
    this.buildCave();
    p.x = this.cave.exit.x + 1; p.z = this.cave.exit.z; p.path = [];
    for (const n of this.following()) this.placeNear(n, p.tx, p.tz);
    this.camTarget.set(p.x, 0, p.z);
    if (this.flags.caveDay !== this.day) { this.flags.caveDay = this.day; this.flags.cristal_cofre = false; this.caveSolved = false; this.cave.mirrors.forEach((m) => { m.s = Math.random() < 0.5 ? 0 : 1; }); this.cave.setBlocked(CX + this.cave.door.x, CZ + this.cave.door.z, 1); if (this.caveDoor) this.caveDoor.visible = true; }
    this.drawBeam();
    this.toast('💎 Cueva de Cristal: gira los espejos para que la luz llegue al cristal grande', 'area');
  };
  P.leaveCave = function () { const p = this.player, f = this.caveFrom; p.x = f.x; p.z = f.z; p.path = []; for (const n of this.following()) this.placeNear(n, p.tx, p.tz); this.camTarget.set(p.x, 0, p.z); };
  P.inCave = function () { const r = this.W.regionAt(this.player.x, this.player.z); return r && r.id === 'cristal_cueva'; };
  P.buildCave = function () {
    if (this.caveBuilt) return;
    this.caveBuilt = true;
    const R = this.cave, g = new THREE.Group(), M = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(CW + 2, 0.2, CD + 2), M(0x2a3040)); floor.position.set(CX + CW / 2 - 0.5, -0.1, CZ + CD / 2 - 0.5); g.add(floor);
    for (let z = 0; z < CD; z++) if (z !== 5) { const w = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), M(0x4a5a7a, { emissive: 0x0a1a2a })); w.position.set(CX + 8, 1, CZ + z); g.add(w); }
    const door = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), M(0x7ad8ff, { transparent: true, opacity: 0.7 })); door.position.set(CX + 8, 1, CZ + 5); g.add(door); this.caveDoor = door;
    const em = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1, 8), M(0xffe080, { emissive: 0x8a6a00 })); em.position.set(CX + R.emitter.x, 0.5, CZ + R.emitter.z); g.add(em);
    const tg = new THREE.Mesh(new THREE.OctahedronGeometry(0.6), M(0x9ae8ff, { emissive: 0x1a3a4a })); tg.position.set(CX + R.target.x, 0.9, CZ + R.target.z); g.add(tg); this.caveTarget = tg;
    R.mirrors.forEach((m) => { const gm = new THREE.Group(); const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.2, 8), M(0x5a5a6a)); base.position.y = 0.1; gm.add(base); const glass = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.06), M(0xe8f8ff, { emissive: 0x3a5a6a })); glass.position.y = 0.65; gm.add(glass); gm.position.set(CX + m.x, 0, CZ + m.z); g.add(gm); m.mesh = gm; });
    const ch = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.55), M(0x7ad8ff)); ch.position.set(R.chest.x, 0.25, R.chest.z); g.add(ch);
    for (let i = 0; i < 20; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6 + Math.random() * 0.6, 5), M([0x9ae8ff, 0xd8a8ff, 0xa8ffd8][i % 3], { emissive: 0x1a2a3a })); c.position.set(CX - 0.8 + Math.random() * (CW + 0.6), 0.3, CZ + (Math.random() < 0.5 ? -0.8 : CD - 0.2)); g.add(c); }
    this.scene.add(g);
    this.beamG = new THREE.Group(); this.scene.add(this.beamG);
    if (!this.chests.includes(R.chest)) this.chests.push(R.chest);
  };
  P.traceBeam = function () {
    const R = this.cave, at = (x, z) => R.mirrors.find((m) => m.x === x && m.z === z);
    let x = R.emitter.x, z = R.emitter.z, dx = 1, dz = 0; const path = [[x, z]];
    for (let i = 0; i < 40; i++) {
      x += dx; z += dz;
      if (x < 0 || z < 0 || x >= 8 || z >= CD) { path.push([x - dx * 0.5, z - dz * 0.5]); return { path, hit: false }; }
      if (x === R.target.x && z === R.target.z) { path.push([x, z]); return { path, hit: true }; }
      const m = at(x, z);
      if (m) { path.push([x, z]); if (m.s === 0) { [dx, dz] = [-dz, -dx]; } else { [dx, dz] = [dz, dx]; } }
    }
    return { path, hit: false };
  };
  P.drawBeam = function () {
    const R = this.cave; if (!this.beamG) return;
    while (this.beamG.children.length) this.beamG.remove(this.beamG.children[0]);
    R.mirrors.forEach((m) => { if (m.mesh) m.mesh.rotation.y = m.s === 0 ? -Math.PI / 4 : Math.PI / 4; });
    const { path, hit } = this.traceBeam();
    const mat = new THREE.MeshBasicMaterial({ color: hit ? 0x9affff : 0xfff0a0, transparent: true, opacity: 0.85 });
    for (let i = 1; i < path.length; i++) {
      const [x0, z0] = path[i - 1], [x1, z1] = path[i], len = Math.hypot(x1 - x0, z1 - z0);
      const seg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, len), mat); seg.position.set(CX + (x0 + x1) / 2, 0.7, CZ + (z0 + z1) / 2); seg.rotation.y = Math.atan2(x1 - x0, z1 - z0); this.beamG.add(seg);
    }
    if (hit && !this.caveSolved) {
      this.caveSolved = true;
      this.cave.setBlocked(CX + R.door.x, CZ + R.door.z, 0);
      if (this.caveDoor) this.caveDoor.visible = false;
      this.caveTarget.material.emissive.set(0x3affff);
      this.toast('💎 ¡La luz llega al cristal! La puerta de cristal se abre', 'area');
      this.stats.puzzles = (this.stats.puzzles || 0) + 1;
      sfx('quest');
    }
  };
  P.mirrorNear = function () { const p = this.player; return this.cave.mirrors.find((m) => Math.hypot(CX + m.x - p.x, CZ + m.z - p.z) < 1.6) || null; };
  P.rotateMirror = function (m) { m.s = 1 - m.s; sfx('click'); this.drawBeam(); };

  // ============================================================ cumpleaños
  P.bdayOf = function (n) { return hash(n.id) % 12; };
  P.isBday = function (n) { return this.day % 12 === this.bdayOf(n); };
  P.updateBdays = function () {
    const list = [...this.crew()]; const pt = this.partner(); if (pt && !list.includes(pt)) list.push(pt);
    if (this.bdayChecked === this.day) return;
    // el día anterior: ¿te olvidaste de alguien?
    for (const n of list) { const s = this.soc(n.id); if (s.bdayWait !== undefined && s.bdayWait < this.day) { s.bdayWait = undefined; this.addFriend(n, -4, true); this.toast(`😢 Ayer fue el cumpleaños de ${n.name} y no le regalaste nada...`); } }
    this.bdayChecked = this.day;
    for (const n of list) if (this.isBday(n)) { this.soc(n.id).bdayWait = this.day; this.toast(`🎂 ¡Hoy es el cumpleaños de ${n.name}! Hazle un regalo`, 'area'); }
  };
  const baseGift = P.giveGift;
  P.giveGift = function (n, id) {
    const s = this.soc(n.id);
    if (s.bdayWait === this.day && this.player.inv[id] > 0) {
      s.bdayWait = undefined;
      const r = baseGift.call(this, n, id);
      this.addFriend(n, 15, true);
      if (this.crewMemory) this.crewMemory(n, `Te acordaste de mi cumpleaños y me regalaste ${ITEMS[id] ? ITEMS[id].name : 'algo'}. ¡Nunca lo olvidaré!`);
      this.ui.openDialog(n.name, '¡Te has acordado de mi cumpleaños! ¡Gracias, de verdad!', [{ label: '🎂 ¡Feliz cumpleaños!', action: null }]);
      for (let i = 0; i < 6; i++) setTimeout(() => this.ring(n.x + (Math.random() - 0.5) * 2, n.z + (Math.random() - 0.5) * 2, 0.6, [0xffa0c0, 0xffe080, 0x9ad8ff][i % 3]), i * 200);
      sfx('level');
      return r;
    }
    return baseGift.call(this, n, id);
  };
  P.bdayFloat = function (dt) {
    this.bfT = (this.bfT || 0) - dt; if (this.bfT > 0) return; this.bfT = 4;
    for (const n of this.npcs) { const s = this.soc(n.id); if (s.bdayWait === this.day && n.model.root.visible) this.ui.float('🎂', 'heal', n.x, n.model.height + 0.6, n.z); }
  };

  // ============================================================ enganches
  P.npcDialog12 = function (id, opts) {
    const t = this.mareaDialog(id, opts); if (t) return t;
    if (id === 'nerea') opts.push({ label: '🏁 Gran Regata de las Islas (200 oro)', action: () => this.regattaMenu() });
    if (id === 'pepe') opts.push({ label: '📰 Comprar la Gaceta de la Bruma (5 oro)', action: () => this.buy({ gold: 5 }, () => this.gazette()) });
    const s = this.soc(id); const n = this.npcById(id);
    if (n && (s.crew || s.partner)) { const d = this.bdayOf(n), left = (d - (this.day % 12) + 12) % 12; opts.push({ label: left === 0 ? '🎂 ¡Hoy es su cumpleaños!' : `🎂 Cumpleaños en ${left} día${left === 1 ? '' : 's'}`, action: null }); }
    return null;
  };
  P.contextAction12 = function () {
    if (this.sailing) return null;
    const p = this.player;
    if (this.inMarea() && Math.hypot(p.x - this.marea.exit.x, p.z - this.marea.exit.z) < 1.8) return { icon: '🔔', label: 'Subir', fn: () => this.surface() };
    if (this.inCave()) {
      if (Math.hypot(p.x - this.cave.exit.x, p.z - this.cave.exit.z) < 1.6) return { icon: '🚪', label: 'Salir', fn: () => this.leaveCave() };
      const m = this.mirrorNear(); if (m) return { icon: '🪞', label: 'Girar', fn: () => this.rotateMirror(m) };
    }
    const ce = this.crystalEntry(); if (ce && Math.hypot(p.x - ce.x, p.z - ce.z) < 1.6) return { icon: '💎', label: 'Cueva', fn: () => this.enterCave() };
    const tm = this.tameTarget(); if (tm) return { icon: '🍖', label: 'Domar', fn: () => this.tame(tm) };
    return null;
  };
  P.updateMore12 = function (dt) {
    this.buildCaveEntry();
    this.updateMarea();
    this.updateRegatta(dt);
    this.bdayFloat(dt);
    this.m12T = (this.m12T || 0) - dt;
    if (this.m12T <= 0) { this.m12T = 1; this.updateRivals(); this.updateBdays(); }
  };
  P.newsHtml12 = function () {
    const R = this.rivalPts();
    const list = [...this.crew()]; const pt = this.partner(); if (pt && !list.includes(pt)) list.push(pt);
    const next = list.map((n) => [n.name, (this.bdayOf(n) - (this.day % 12) + 12) % 12]).sort((a, b) => a[1] - b[1]).slice(0, 3);
    return `<div class="sub">🆕 v4.0</div><ul class="qlist">
      <li>🔱 <b>Pueblo de Marea</b>: tritones aliados bajo el mar (punto turquesa en el minimapa, bucea con la campana). Reputación: ${this.mareaRep()}/2.</li>
      <li>🏴 <b>Clanes rivales</b> esta semana: ${Object.entries(R.pts).map(([n, v]) => `${n} ${v}`).join(' · ')} · <b>Tú ${R.me}</b>.</li>
      <li>🏁 <b>Gran Regata de las Islas</b> con Nerea (Tortuga, Duna y Selva).</li>
      <li>🐾 <b>Domar bestias</b>: deja a un tigre o a un lobo de las nieves con poca vida y dale carne cruda.</li>
      <li>📰 <b>La Gaceta de la Bruma</b>: cómprala a Pepe o desde ⚡ Atajos.</li>
      <li>💎 <b>Cueva de Cristal</b> en el Archipiélago Burbuja: puzle de espejos.</li>
      <li>🎂 <b>Cumpleaños</b>: ${next.length ? next.map(([n, d]) => `${n} ${d === 0 ? '¡HOY!' : 'en ' + d + ' d'}`).join(' · ') : 'recluta tripulación para conocerlos'}.</li></ul>`;
  };
}

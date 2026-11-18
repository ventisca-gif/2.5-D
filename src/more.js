// v2.7: mascotas, mazmorra cooperativa, regata y torneo, casa propia, bandera de tripulación,
// citas y boda, mapas del tesoro y barcos de piratas famosos. Todo pensado también para el multijugador local.
import * as THREE from 'three';
import { T } from './world.js';

// ---------------------------------------------------------------- mascotas
export const PETS = {
  loro: { name: 'Loro parlanchín', icon: '🦜', price: 500, where: 'Mara (Isla Tortuga)', perk: 'Encuentra oro extra al vencer enemigos', fly: true },
  mono: { name: 'Mono ladronzuelo', icon: '🐒', price: 700, where: 'Mara (Isla Tortuga)', perk: 'A veces roba un objeto extra' },
  gato: { name: 'Gato del puerto', icon: '🐈', price: 300, where: 'Coral (La Sirena Tuerta)', perk: '+3% de golpe crítico' },
  dragon: { name: 'Cría de dragón', icon: '🐲', price: 0, where: 'Huevo de Ignaros o 30 fichas de gremio', perk: 'Escupe fuego (mucho daño)', fly: true },
};
function petModel(type) {
  const g = new THREE.Group();
  const M = (c) => new THREE.MeshLambertMaterial({ color: c });
  const add = (geo, c, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, M(c)); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; g.add(m); return m; };
  const wings = [];
  if (type === 'loro') {
    add(new THREE.SphereGeometry(0.1, 10, 8), 0xd82a2a, 0, 0, 0).scale.set(1, 1.3, 1);
    add(new THREE.SphereGeometry(0.07, 8, 6), 0xd82a2a, 0, 0.13, 0.03);
    add(new THREE.ConeGeometry(0.03, 0.07, 5), 0xf0d040, 0, 0.12, 0.1, Math.PI / 2);
    add(new THREE.BoxGeometry(0.05, 0.16, 0.02), 0x2a5ad8, 0, -0.14, -0.06, 0.5);
    for (const s of [-1, 1]) { wings.push(add(new THREE.BoxGeometry(0.16, 0.03, 0.09), s < 0 ? 0x2a8a3a : 0x2a8a3a, s * 0.1, 0.02, 0)); add(new THREE.SphereGeometry(0.015, 6, 4), 0x111111, s * 0.04, 0.15, 0.08); }
  } else if (type === 'mono') {
    add(new THREE.SphereGeometry(0.12, 10, 8), 0x7a4a2a, 0, 0.18, 0).scale.set(1, 1.2, 0.9);
    add(new THREE.SphereGeometry(0.09, 10, 8), 0x7a4a2a, 0, 0.36, 0.02);
    add(new THREE.SphereGeometry(0.06, 8, 6), 0xe0b890, 0, 0.34, 0.07);
    for (const s of [-1, 1]) { add(new THREE.SphereGeometry(0.035, 6, 4), 0xe0b890, s * 0.09, 0.38, 0); add(new THREE.CylinderGeometry(0.025, 0.025, 0.16, 5), 0x7a4a2a, s * 0.06, 0.06, 0); add(new THREE.SphereGeometry(0.012, 5, 4), 0x111111, s * 0.03, 0.37, 0.12); }
    add(new THREE.TorusGeometry(0.12, 0.018, 5, 10, Math.PI * 1.3), 0x7a4a2a, 0, 0.2, -0.13, 0, Math.PI / 2, 0);
  } else if (type === 'gato') {
    add(new THREE.SphereGeometry(0.11, 10, 8), 0xe08a3a, 0, 0.13, 0).scale.set(0.8, 0.8, 1.4);
    add(new THREE.SphereGeometry(0.08, 10, 8), 0xe08a3a, 0, 0.22, 0.15);
    for (const s of [-1, 1]) { add(new THREE.ConeGeometry(0.03, 0.06, 4), 0xe08a3a, s * 0.045, 0.3, 0.15); add(new THREE.SphereGeometry(0.012, 5, 4), 0x2a8a2a, s * 0.03, 0.23, 0.22); for (const z of [-0.08, 0.08]) add(new THREE.CylinderGeometry(0.02, 0.02, 0.09, 5), 0xf0e0d0, s * 0.05, 0.045, z); }
    add(new THREE.CylinderGeometry(0.015, 0.02, 0.2, 5), 0xe08a3a, 0, 0.2, -0.17, -0.6);
  } else {
    add(new THREE.SphereGeometry(0.12, 10, 8), 0x2a8a4a, 0, 0, 0).scale.set(0.9, 0.9, 1.3);
    add(new THREE.SphereGeometry(0.08, 10, 8), 0x2a8a4a, 0, 0.1, 0.13);
    add(new THREE.SphereGeometry(0.05, 8, 6), 0xd8c070, 0, 0.06, 0.2);
    for (const s of [-1, 1]) { add(new THREE.ConeGeometry(0.02, 0.08, 4), 0xd8c070, s * 0.04, 0.19, 0.1, -0.4); wings.push(add(new THREE.BoxGeometry(0.2, 0.02, 0.12), 0xc83a2a, s * 0.13, 0.05, -0.02)); add(new THREE.SphereGeometry(0.014, 5, 4), 0xffd040, s * 0.035, 0.13, 0.19); }
    add(new THREE.ConeGeometry(0.04, 0.25, 5), 0x2a8a4a, 0, -0.02, -0.22, -Math.PI / 2 - 0.3);
  }
  g.userData.wings = wings;
  return g;
}

// ---------------------------------------------------------------- bandera de tripulación
export const FLAG_BG = [0x111111, 0x8a1010, 0x1a2a5a, 0x1a4a2a, 0x4a1a5a, 0xe8e0d0];
export const FLAG_SYM = ['calavera', 'ancla', 'espadas', 'corona', 'estrella', 'luna'];
export const FLAG_COL = [0xf4f0e6, 0xe0b040, 0xc82a2a, 0x3ab0e0, 0x111111, 0x3ad87a];
const hex = (c) => '#' + c.toString(16).padStart(6, '0');
export function drawFlag(cfg) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 86;
  const x = c.getContext('2d');
  x.fillStyle = hex(FLAG_BG[cfg.bg || 0]); x.fillRect(0, 0, 128, 86);
  x.fillStyle = x.strokeStyle = hex(FLAG_COL[cfg.col || 0]);
  x.lineWidth = 7; x.lineCap = 'round';
  const cx = 64, cy = 43;
  switch (FLAG_SYM[cfg.sym || 0]) {
    case 'calavera':
      x.beginPath(); x.arc(cx, cy - 6, 17, 0, Math.PI * 2); x.fill(); x.fillRect(cx - 10, cy + 6, 20, 10);
      x.fillStyle = hex(FLAG_BG[cfg.bg || 0]); x.beginPath(); x.arc(cx - 7, cy - 7, 5, 0, 7); x.arc(cx + 7, cy - 7, 5, 0, 7); x.fill();
      x.strokeStyle = hex(FLAG_COL[cfg.col || 0]); x.beginPath(); x.moveTo(cx - 34, cy - 22); x.lineTo(cx + 34, cy + 30); x.moveTo(cx + 34, cy - 22); x.lineTo(cx - 34, cy + 30); x.stroke();
      break;
    case 'ancla':
      x.beginPath(); x.moveTo(cx, cy - 26); x.lineTo(cx, cy + 24); x.moveTo(cx - 16, cy - 16); x.lineTo(cx + 16, cy - 16); x.stroke();
      x.beginPath(); x.arc(cx, cy + 6, 20, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke();
      x.beginPath(); x.arc(cx, cy - 30, 6, 0, 7); x.stroke();
      break;
    case 'espadas':
      x.beginPath(); x.moveTo(cx - 28, cy - 26); x.lineTo(cx + 24, cy + 26); x.moveTo(cx + 28, cy - 26); x.lineTo(cx - 24, cy + 26); x.stroke();
      x.lineWidth = 5; x.beginPath(); x.moveTo(cx + 12, cy + 26); x.lineTo(cx + 30, cy + 12); x.moveTo(cx - 12, cy + 26); x.lineTo(cx - 30, cy + 12); x.stroke();
      break;
    case 'corona':
      x.beginPath(); x.moveTo(cx - 28, cy + 18); x.lineTo(cx - 28, cy - 12); x.lineTo(cx - 14, cy + 2); x.lineTo(cx, cy - 22); x.lineTo(cx + 14, cy + 2); x.lineTo(cx + 28, cy - 12); x.lineTo(cx + 28, cy + 18); x.closePath(); x.fill();
      break;
    case 'estrella':
      x.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 12 : 28, a = -Math.PI / 2 + (i * Math.PI) / 5; x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } x.closePath(); x.fill();
      break;
    default:
      x.beginPath(); x.arc(cx, cy, 24, 0, Math.PI * 2); x.fill(); x.fillStyle = hex(FLAG_BG[cfg.bg || 0]); x.beginPath(); x.arc(cx + 11, cy - 6, 21, 0, Math.PI * 2); x.fill();
  }
  return c;
}

// ---------------------------------------------------------------- mazmorra: Cripta de la Bruma
const DX = 2000, DZ = 0;
const DROOMS = [
  { x0: 0, z0: 0, w: 8, d: 8, name: 'Sala de los huesos', foes: [['skeleton', 4]] },
  { x0: 11, z0: 0, w: 8, d: 8, name: 'Nido de las sombras', foes: [['bat', 3], ['skull', 2]] },
  { x0: 22, z0: 0, w: 8, d: 8, name: 'Forja olvidada', foes: [['golem', 2], ['skeleton', 2]] },
  { x0: 33, z0: -1, w: 10, d: 10, name: 'Trono del Rey de la Cripta', foes: [['crypt_king', 1], ['skull', 2]] },
];
export function makeDungeonRegion() {
  const W = 44, D = 10;
  const tiles = new Uint8Array(W * (D + 2));
  const blocked = new Uint8Array(W * (D + 2));
  const at = (lx, lz) => (lz + 1) * W + lx;
  for (const r of DROOMS) for (let z = r.z0; z < r.z0 + r.d; z++) for (let x = r.x0; x < r.x0 + r.w; x++) tiles[at(x, z)] = T.STONE;
  // pasillos de 3 de largo y 2 de ancho; la casilla del medio es una reja hasta limpiar la sala anterior
  const doors = [];
  for (let i = 0; i < 3; i++) {
    const x0 = DROOMS[i].x0 + DROOMS[i].w;
    for (let x = x0; x < x0 + 3; x++) for (const z of [3, 4]) tiles[at(x, z)] = T.STONE;
    doors.push({ x: DX + x0 + 1, zs: [3, 4] });
  }
  const R = { kind: 'dungeon', id: 'cripta', name: 'Cripta de la Bruma', X: DX, Z: DZ, W, D, doors, rooms: DROOMS, exit: { x: DX + 1, z: DZ + 7 } };
  R.contains = (x, z) => x >= DX - 1 && x <= DX + W && z >= DZ - 2 && z <= DZ + D + 1;
  R.tile = (x, z) => { const lx = x - DX, lz = z - DZ; return lx >= 0 && lx < W && lz >= -1 && lz <= D ? tiles[at(lx, lz)] : T.WATER; };
  R.walkable = (x, z) => { const lx = x - DX, lz = z - DZ; if (lx < 0 || lx >= W || lz < -1 || lz > D) return false; return tiles[at(lx, lz)] !== T.WATER && !blocked[at(lx, lz)]; };
  R.setBlocked = (x, z, v) => { const lx = x - DX, lz = z - DZ; if (lx >= 0 && lx < W && lz >= -1 && lz <= D) blocked[at(lx, lz)] = v; };
  R.groundY = () => 0;
  R.areaName = (x) => { const lx = x - DX; const r = DROOMS.find((k) => lx >= k.x0 && lx < k.x0 + k.w); return r ? `Cripta · ${r.name}` : 'Cripta de la Bruma'; };
  for (const d of doors) for (const z of d.zs) R.setBlocked(d.x, DZ + z, 1);
  return R;
}

// ---------------------------------------------------------------- mapas del tesoro
const ISLE_RIDDLE = {
  main: 'la isla de las murallas y el faro', tortuga: 'el refugio de los contrabandistas', calavera: 'la isla de la roca que sonríe',
  duna: 'la isla de arena y cactus', selva: 'la isla de los tigres y las lianas', bastion: 'la isla de las torres a rayas', ceniza: 'la isla donde arde la tierra',
};

export function installMore(Game, D) {
  const P = Game.prototype;
  const sfx = D.sfx;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ============================================================ mascotas
  P.setPet = function (type) {
    this.petType = type;
    if (this.petObj) { this.scene.remove(this.petObj.m); this.petObj = null; }
    if (!type) return;
    const m = petModel(type);
    this.scene.add(m);
    const p = this.player;
    this.petObj = { m, x: p.x - 0.8, z: p.z - 0.8, cd: 2, t: 0 };
    this.toast(`${PETS[type].icon} ${PETS[type].name} te acompaña`);
  };
  P.adoptPet = function (type, cost) {
    this.ownPets = this.ownPets || [];
    const go = () => { if (!this.ownPets.includes(type)) this.ownPets.push(type); this.setPet(type); sfx('quest'); };
    if (this.ownPets.includes(type)) return go();
    if (cost) this.buy(cost, go); else go();
  };
  P.petLevel = function () { return Math.min(30, Math.floor(((this.petXp || {})[this.petType] || 0) / 50) + 1); };
  P.updatePet = function (dt) {
    const P2 = this.petObj, p = this.player;
    if (!P2) return;
    const fly = PETS[this.petType].fly;
    let tx, tz, ty;
    if (this.sailing) { P2.m.visible = false; return; }
    P2.m.visible = !this.W.isInterior(p.x) || !!this.roomAt(p.x, p.z) || this.inDungeon();
    const back = p.face + Math.PI + 0.7;
    tx = p.x + Math.sin(back) * 0.85; tz = p.z + Math.cos(back) * 0.85;
    P2.t += dt;
    const d = Math.hypot(tx - P2.x, tz - P2.z);
    if (d > 8) { P2.x = tx; P2.z = tz; }
    const k = Math.min(1, dt * 4);
    P2.x += (tx - P2.x) * k; P2.z += (tz - P2.z) * k;
    ty = Math.max(0, this.W.groundY(P2.x, P2.z)) + (fly ? 1.1 + Math.sin(P2.t * 3) * 0.12 : Math.abs(Math.sin(P2.t * (d > 0.3 ? 10 : 2))) * 0.05);
    P2.m.position.set(P2.x, ty, P2.z);
    P2.m.rotation.y = Math.atan2(tx - P2.x, tz - P2.z) || p.face;
    for (const w of P2.m.userData.wings) w.rotation.z = Math.sin(P2.t * 18) * 0.6 * Math.sign(w.position.x);
    // ayuda en combate
    P2.cd -= dt;
    if (P2.cd <= 0) {
      const foe = this.crewFoe();
      if (foe && foe.dist(p) < 6 && !foe.dead) {
        P2.cd = this.petType === 'dragon' ? 3 : 2.4;
        const L = this.petLevel();
        const dmg = Math.round((this.petType === 'dragon' ? 10 + p.level * 1.6 : 4 + p.level * 0.7) * (1 + L * 0.03));
        if (this.petType === 'dragon') { this.ring(foe.x, foe.z, 1.2, 0xff6020); this.ui.float('🔥', 'crit', foe.x, 1.6, foe.z); }
        else this.ui.float(PETS[this.petType].icon, 'info', foe.x, 1.6, foe.z);
        this.hitEnemy(foe, dmg, false, true);
      } else P2.cd = 0.5;
    }
  };
  P.petOnKill = function (x, z) {
    if (!this.petType) return;
    this.petXp = this.petXp || {};
    this.petXp[this.petType] = (this.petXp[this.petType] || 0) + 1;
    const L = this.petLevel();
    if (this.petType === 'loro' && Math.random() < 0.25 + L * 0.01) { const g = 3 + Math.floor(Math.random() * (5 + this.player.level)); this.player.gold += g; this.ui.float(`🦜 +${g} oro`, 'gold', x, 1.6, z); }
    if (this.petType === 'mono' && Math.random() < 0.08 + L * 0.004) { const it = ['iron', 'silver', 'leather', 'apple', 'potion', 'polvora'][Math.floor(Math.random() * 6)]; this.give(it, 1, x, z); this.ui.float('🐒 ¡Robado!', 'info', x, 1.8, z); }
  };
  P.petCrit = function () { return this.petType === 'gato' ? 0.03 + this.petLevel() * 0.001 : 0; };

  // ============================================================ bandera de tripulación
  P.flagTex = function (cfg) {
    this.flagCache = this.flagCache || {};
    const key = JSON.stringify(cfg || {});
    if (!this.flagCache[key]) { const t = new THREE.CanvasTexture(drawFlag(cfg || {})); t.colorSpace = THREE.SRGBColorSpace; this.flagCache[key] = t; }
    return this.flagCache[key];
  };
  P.applyFlag = function (ship, cfg) {
    if (!ship || !cfg) return;
    const m = new THREE.MeshLambertMaterial({ map: this.flagTex(cfg), side: THREE.DoubleSide });
    ship.traverse((o) => { if (o.userData.flag) o.material = m; });
  };
  P.flagURL = function () { return this.flagCfg ? drawFlag(this.flagCfg).toDataURL() : null; };
  P.designFlag = function () {
    const f = this.flagCfg || (this.flagCfg = { bg: 0, sym: 0, col: 0 });
    const cyc = (k, n, label) => ({ label, action: () => { f[k] = ((f[k] || 0) + 1) % n; this.applyFlag(this.ship, f); this.designFlag(); } });
    this.ui.openDialog('🏴 Bandera de tu tripulación', `Símbolo: ${FLAG_SYM[f.sym]}. Se verá en tu barco, en tu cartel de Se busca y en el barco que ven los demás jugadores.`, [
      cyc('bg', FLAG_BG.length, '🎨 Color de fondo'), cyc('sym', FLAG_SYM.length, '☠ Símbolo'), cyc('col', FLAG_COL.length, '🖌 Color del símbolo'), { label: 'Listo', action: null },
    ]);
  };

  // ============================================================ casa propia (Villarroca)
  P.houseRoom = function () { return this.rooms.find((r) => r.id === 'casa5'); };
  P.buyHouse = function () {
    this.buy({ gold: 6000 }, () => { this.flags.house = true; const r = this.houseRoom(); if (r && r.doorLabel) r.doorLabel.nm.textContent = '🏠 Tu casa'; this.toast('🏠 ¡Ya tienes casa en Villarroca! Decórala por dentro con 🪑', 'area'); sfx('quest'); });
  };
  P.sleepHere = function () {
    const p = this.player;
    this.tod = 7; if (this.tod < 7) this.day++;
    this.day++;
    p.hp = p.maxHp; p.stamina = p.maxSt;
    this.addBuff('descanso', 600);
    this.toast('😴 Duermes en tu cama... ¡buenos días! (+10% de experiencia durante 10 min)');
    const pt = this.partner();
    if (pt && this.soc(pt.id).married) this.ui.float('💞', 'heal', p.x, 1.6, p.z);
  };

  // ============================================================ citas y boda
  const DATES = {
    cena: { name: '🍷 Cena en la taberna', desc: 'Entra en una taberna con tu pareja y cenad juntos (habla con tu pareja allí dentro).' },
    atardecer: { name: '🌅 Atardecer en la playa', desc: 'Pasead de la mano por la arena entre las 17:30 y las 20:00.' },
    regalo: { name: '💎 Regalo especial', desc: 'Regala a tu pareja un collar de perlas o un anillo de jade.' },
    baile: { name: '💃 Baile bajo las estrellas', desc: 'Bailad juntos de noche (a partir de las 20:00).' },
    barco: { name: '⛵ Paseo en barco', desc: 'Navega 60 segundos con tu pareja a bordo.' },
  };
  P.love = function () { return this.loveData || (this.loveData = { dates: {}, sail: 0 }); };
  P.dateDone = function (id) {
    const L = this.love();
    if (L.dates[id]) return;
    L.dates[id] = true;
    const pt = this.partner();
    if (pt) this.addFriend(pt, 6);
    this.toast(`💞 Cita completada: ${DATES[id].name} (${Object.keys(L.dates).length}/5)`, 'area');
    sfx('quest');
  };
  P.dateMenu = function (n) {
    const L = this.love(), s = this.soc(n.id);
    const done = Object.keys(L.dates).length;
    const lines = Object.entries(DATES).map(([id, d]) => `${L.dates[id] ? '✔' : '•'} ${d.name}: ${d.desc}`).join('\n');
    const opts = [];
    const room = this.roomAt(this.player.x, this.player.z);
    if (!L.dates.cena && room && ['taberna', 'sirena'].includes(room.id)) opts.push({ label: '🍷 Cenar juntos (30 oro)', action: () => this.buy({ gold: 30 }, () => { this.coupleAct(n, 'kiss'); this.dateDone('cena'); }) });
    if (!s.married && done >= 3) {
      if ((this.player.inv.anillo_boda || 0) > 0) opts.push({ label: '💍 Pedir matrimonio', action: () => this.propose(n) });
      else opts.push({ label: '💍 (Forja un Anillo de compromiso para pedir matrimonio)', action: null });
    }
    opts.push({ label: 'Cerrar', action: null });
    this.ui.openDialog(`💌 Citas con ${n.name} (${done}/5)`, (s.married ? '💒 Estáis casados. ' : done >= 3 ? 'Con 3 citas ya podéis casaros. ' : 'Completa 3 citas para poder casaros. ') + '\n' + lines, opts);
  };
  P.propose = function (n) {
    this.player.inv.anillo_boda--;
    this.ui.openDialog(n.name, '¡Sí! ¡Mil veces sí! Celebremos la boda en la plaza de Villarroca.', [{ label: '💒 ¡A la plaza!', action: () => this.wedding(n) }]);
  };
  P.wedding = function (n, remoteName) {
    const p = this.player;
    if (this.sailing || this.W.isInterior(p.x)) { this.toast('La boda será en la plaza: sal a tierra firme'); }
    else { p.x = 50; p.z = 53; p.path = []; this.camTarget.set(p.x, 0, p.z); }
    if (n) { const s = this.soc(n.id); s.married = true; s.hand = false; n.x = p.x + 0.5; n.z = p.z; n.path = []; this.coupleAct(n, 'kiss'); }
    // los vecinos se acercan a celebrarlo
    let k = 0;
    for (const v of this.npcs) {
      if (v.onShip || this.soc(v.id).crew || v === n || Math.hypot(v.x - 50, v.z - 50) > 20 || this.W.isInterior(v.x)) continue;
      const a = (k++ / 8) * Math.PI * 2;
      v.goTo(Math.round(50 + Math.cos(a) * 3), Math.round(53 + Math.sin(a) * 3), false, 2000);
      if (k > 10) break;
    }
    for (let i = 0; i < 8; i++) setTimeout(() => { this.ring(p.x + (Math.random() - 0.5) * 3, p.z + (Math.random() - 0.5) * 3, 1, [0xffa0c0, 0xffffff, 0xffe080][i % 3]); this.ui.float(['🌸', '💐', '💖', '🎉'][i % 4], 'heal', p.x + (Math.random() - 0.5) * 2, 1.8, p.z); }, i * 350);
    this.give(D.isFemale() ? 'c_vestido_novia' : 'c_traje_boda');
    this.give('c_velo_novia');
    this.toast(`💒 ¡${p.name} y ${n ? n.name : remoteName} se han casado!`, 'area');
    this.net.sendX({ k: 'toast', msg: `💒 ¡${p.name} y ${n ? n.name : remoteName} se han casado!` });
    sfx('level');
  };
  P.spouseNear = function () {
    const p = this.player;
    const pt = this.partner();
    if (pt && this.soc(pt.id).married && pt.model.root.visible && (pt.carried || pt.onShip || pt.dist(p) < 7)) return true;
    if (this.spouseP) for (const r of this.net.remotes.values()) if (r.name === this.spouseP && Math.hypot(r.x - p.x, r.z - p.z) < 8) return true;
    return false;
  };
  P.updateLove = function (dt) {
    const p = this.player, pt = this.partner();
    // bonus de casados: +10% de daño y defensa juntos
    const near = this.spouseNear();
    if (near && !(this.buffs && this.buffs.juntos && this.buffs.juntos.t > 0)) this.addBuff('juntos', 5);
    else if (near) this.buffs.juntos.t = 5;
    if (!pt) return;
    const s = this.soc(pt.id), L = this.love();
    if (!L.dates.atardecer && s.hand && this.tod >= 17.5 && this.tod <= 20 && this.W.tileAll(p.tx, p.tz) === T.SAND) this.dateDone('atardecer');
    if (!L.dates.baile && p.st.dance && (this.tod >= 20 || this.tod < 5)) this.dateDone('baile');
    if (!L.dates.barco && this.sailing && pt.onShip) { L.sail += dt; if (L.sail >= 60) this.dateDone('barco'); }
  };

  // ============================================================ mapas del tesoro
  P.newTreasureMap = function () {
    const isles = ['main', 'tortuga', 'calavera', 'duna', 'selva', 'bastion', 'ceniza'];
    for (let k = 0; k < 40; k++) {
      const isle = isles[Math.floor(Math.random() * isles.length)];
      let cx, cz, r;
      if (isle === 'main') { cx = 50; cz = 50; r = 40; } else { const R = this.islets.find((q) => q.id === isle); cx = R.center.x; cz = R.center.z; r = R.N / 2 - 12; }
      const x = Math.round(cx + (Math.random() * 2 - 1) * r), z = Math.round(cz + (Math.random() * 2 - 1) * r);
      if (!this.W.walkable(x, z) || this.W.tileAll(x, z) === T.DOCK) continue;
      if (isle === 'main' && x > 36 && x < 64 && z > 36 && z < 64) continue;
      const dirs = [];
      if (z < cz - 5) dirs.push('norte'); if (z > cz + 5) dirs.push('sur'); if (x > cx + 5) dirs.push('este'); if (x < cx - 5) dirs.push('oeste');
      const tile = this.W.tileAll(x, z);
      const near = tile === T.SAND ? 'sobre la arena' : tile === T.ROCK ? 'entre la roca negra' : tile === T.DARK ? 'bajo la espesura' : 'en la hierba';
      return { isle, x, z, known: false, clue: `«En ${ISLE_RIDDLE[isle]}, ${dirs.length ? 'hacia el ' + dirs.join(' y ') : 'cerca del corazón de la isla'}, ${near}, donde marca la X.»` };
    }
    return null;
  };
  P.addTreasureMap = function () {
    const m = this.newTreasureMap();
    if (!m) return;
    (this.tmaps || (this.tmaps = [])).push(m);
    this.player.inv.mapa_tesoro = this.tmaps.length;
    this.toast('🗺️ ¡Has encontrado un mapa del tesoro! Míralo en la Bitácora (Mapas)', 'area');
    sfx('quest');
  };
  P.isleOf = function (x, z) { const r = this.W.regionAt(x, z); return r === null ? 'main' : r && r.kind === 'islet' ? r.id : null; };
  P.mapCanvas = function (m) {
    const c = document.createElement('canvas');
    const S = 7, R = 15;
    c.width = c.height = (R * 2 + 1) * S;
    const x = c.getContext('2d');
    const col = { [T.WATER]: '#6a8aa0', [T.SAND]: '#e8d098', [T.GRASS]: '#a8b878', [T.DARK]: '#88a060', [T.DIRT]: '#c8a070', [T.STONE]: '#b8b0a0', [T.DOCK]: '#8a6a44', [T.FIELD]: '#d8b860', [T.ROCK]: '#6a5a50', [T.LAVA]: '#e86020' };
    for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) {
      x.fillStyle = col[this.W.tileAll(m.x + dx, m.z + dz)] || '#a8b878';
      x.fillRect((dx + R) * S, (dz + R) * S, S, S);
    }
    x.fillStyle = 'rgba(120,80,30,0.25)'; x.fillRect(0, 0, c.width, c.height);
    x.strokeStyle = '#a01010'; x.lineWidth = 4;
    const cx = R * S + S / 2;
    x.beginPath(); x.moveTo(cx - 9, cx - 9); x.lineTo(cx + 9, cx + 9); x.moveTo(cx + 9, cx - 9); x.lineTo(cx - 9, cx + 9); x.stroke();
    x.fillStyle = '#3a2410'; x.font = 'bold 14px Georgia'; x.fillText('N', c.width / 2 - 5, 14);
    return c.toDataURL();
  };
  P.mapNear = function () {
    const p = this.player;
    for (const m of this.tmaps || []) if (Math.hypot(m.x - p.x, m.z - p.z) < 1.8) return m;
    return null;
  };
  P.dig = function (m) {
    const p = this.player;
    p.path = []; p.st.gather = 1;
    this.toast('⛏️ Cavando...');
    setTimeout(() => {
      p.st.gather = 0;
      this.tmaps.splice(this.tmaps.indexOf(m), 1);
      p.inv.mapa_tesoro = this.tmaps.length;
      const g = 250 + p.level * 18;
      p.gold += g;
      this.give(['goldore', 'silver', 'perla', 'ambar', 'jade', 'obsidiana'][Math.floor(Math.random() * 6)], 2, p.x, p.z);
      if (Math.random() < 0.35) this.give(D.EVENT_COS[Math.floor(Math.random() * D.EVENT_COS.length)], 1);
      if (Math.random() < 0.15) this.give('huevo_dragon', 1);
      this.jobXp('minero', 30);
      this.ring(p.x, p.z, 1.5, 0xffd040);
      this.toast(`💰 ¡Tesoro desenterrado! +${g} oro`, 'area');
      this.stats.treasures = (this.stats.treasures || 0) + 1;
      sfx('quest');
    }, 1800);
  };
  P.updateMaps = function () {
    const here = this.isleOf(this.player.x, this.player.z);
    for (const m of this.tmaps || []) if (!m.known && m.isle === here) { m.known = true; this.toast('🗺️ ¡Reconoces esta isla! Es la del mapa del tesoro'); }
  };

  // ============================================================ regata alrededor de Isla Bruma
  P.raceCourse = function () {
    if (this.course) return this.course;
    const pts = [];
    for (let i = 0; i < 8; i++) {
      const a = Math.PI / 2 + (i / 8) * Math.PI * 2;
      for (let r = 58; r < 85; r += 2) {
        const x = 50 + Math.cos(a) * r, z = 50 + Math.sin(a) * r;
        if (!this.shipBlocked(x, z, 0) && !this.shipBlocked(x, z, Math.PI / 2)) { pts.push({ x, z }); break; }
      }
    }
    this.course = pts;
    return pts;
  };
  P.startRace = function () {
    const pts = this.raceCourse();
    const b = this.boat, d = this.docks[0];
    if (!this.sailing) { this.player.x = d.land.x; this.player.z = d.land.z; Object.assign(b, { x: d.shipX, z: d.shipZ, heading: d.heading, docked: 'salitre' }); this.board(true); }
    this.race = { i: 0, t: -3, buoys: [] };
    for (const [k, q] of pts.entries()) {
      const g = new THREE.Group();
      const red = new THREE.MeshLambertMaterial({ color: k === 0 ? 0x2ad84a : 0xd82a2a }), white = new THREE.MeshLambertMaterial({ color: 0xffffff });
      for (let j = 0; j < 3; j++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.4, 10), j % 2 ? white : red); c.position.y = j * 0.4; g.add(c); }
      const fl = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.03), red); fl.position.set(0.3, 1.6, 0); g.add(fl);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 5), white); pole.position.y = 1.3; g.add(pole);
      g.position.set(q.x, -0.1, q.z);
      this.scene.add(g);
      this.race.buoys.push(g);
    }
    this.toast('🏁 ¡Regata! Pasa por las 8 boyas en orden y vuelve a la verde. 3... 2... 1...', 'area');
  };
  P.endRace = function (time) {
    const R = this.race;
    if (!R) return;
    for (const g of R.buoys) this.scene.remove(g);
    this.race = null;
    if (time === undefined) { this.toast('🏁 Regata abandonada'); return; }
    const t = Math.round(time * 10) / 10;
    const medal = t <= 95 ? '🥇' : t <= 125 ? '🥈' : t <= 170 ? '🥉' : '🏳️';
    const best = this.stats.raceBest;
    if (!best || t < best) this.stats.raceBest = t;
    const p = this.player;
    const prize = { '🥇': [600, 4], '🥈': [350, 2], '🥉': [180, 1], '🏳️': [50, 0] }[medal];
    p.gold += prize[0]; if (prize[1]) this.give('ficha', prize[1]);
    if (medal === '🥇' && !this.ownCos('c_capa_campeon')) this.give('c_capa_campeon');
    this.jobXp('marinero', 40);
    this.toast(`${medal} Regata terminada en ${t}s${!best || t < best ? ' · ¡récord personal!' : ''} · +${prize[0]} oro`, 'area');
    sfx('quest');
    (this.raceBoard || (this.raceBoard = [])).push({ name: p.name, t });
    this.raceBoard.sort((a, b) => a.t - b.t);
    this.raceBoard = this.raceBoard.slice(0, 8);
    this.net.sendX({ k: 'race', name: p.name, t });
  };
  P.updateRace = function (dt) {
    const R = this.race;
    if (!R) return;
    if (!this.sailing) { this.endRace(); return; }
    const b = this.boat;
    const before = R.t;
    R.t += dt;
    if (before < 0 && R.t >= 0) { this.toast('🏁 ¡YA!'); sfx('level'); }
    if (R.t < 0) { b.speed = 0; return; }
    const pts = this.course;
    const target = R.i < pts.length ? pts[R.i] : pts[0];
    R.buoys.forEach((g, k) => { g.scale.setScalar(k === (R.i % pts.length) ? 1.4 + Math.sin(this.time * 6) * 0.15 : 1); });
    if (Math.hypot(b.x - target.x, b.z - target.z) < 7) {
      R.i++;
      sfx('coin');
      if (R.i > pts.length) { this.endRace(R.t); return; }
      this.toast(R.i === pts.length ? '🏁 ¡Última! Vuelve a la boya verde' : `🔴 Boya ${R.i}/${pts.length}`);
    }
    const el = document.getElementById('eventBanner');
    if (el) { el.classList.remove('hidden'); el.textContent = `🏁 ${R.t.toFixed(1)} s · boya ${Math.min(R.i + 1, pts.length + 1)}/${pts.length + 1}`; }
  };
  P.raceMarker = function () { if (!this.race) return null; const pts = this.course; return pts[this.race.i] || pts[0]; };

  // ============================================================ torneo de duelos (plaza de Villarroca)
  const GLAD = ['Gladiador Brann', 'Espadachina Yara', 'Campeón Torvald'];
  P.startTournament = function () {
    if (this.tourney) return;
    if (this.stats.tourneyDay === this.day) return this.toast('El torneo ya se celebró hoy. Vuelve mañana');
    this.stats.tourneyDay = this.day;
    const p = this.player;
    p.x = 50; p.z = 54; p.path = [];
    this.tourney = { round: 0, foe: null, wait: 2 };
    this.toast('⚔️ ¡Comienza el Torneo de Villarroca! 3 rondas', 'area');
  };
  P.updateTournament = function (dt) {
    const T2 = this.tourney;
    if (!T2) return;
    const p = this.player;
    if (p.dead) { this.tourney = null; if (T2.foe && !T2.foe.removed) T2.foe.remove(); this.toast(`⚔️ Caíste en la ronda ${T2.round}. ¡Mañana más!`); return; }
    if (T2.foe && T2.foe.dead) {
      T2.foe = null; T2.wait = 2.5;
      this.toast(`🏆 Ronda ${T2.round} ganada`);
      if (T2.round >= 3) {
        this.tourney = null;
        p.gold += 500 + p.level * 10;
        this.give('ficha', 3);
        if (!this.ownCos('c_corona_campeon')) this.give('c_corona_campeon');
        this.stats.tourneys = (this.stats.tourneys || 0) + 1;
        this.toast('👑 ¡Eres el campeón del Torneo de Villarroca!', 'area');
        sfx('level');
        return;
      }
    }
    if (!T2.foe) {
      T2.wait -= dt;
      if (T2.wait > 0) return;
      const lvl = Math.max(1, p.level - 2 + T2.round * 3);
      const e = this.spawnTemp('pirate', 50, 50, lvl);
      e.label.nm.textContent = `${GLAD[T2.round]} · Nv. ${lvl}`;
      e.maxHp = Math.round(e.maxHp * 1.3); e.hp = e.maxHp;
      T2.round++;
      T2.foe = e;
      this.toast(`⚔️ Ronda ${T2.round}: ¡${GLAD[T2.round - 1]}!`, 'area');
    }
  };

  // ============================================================ mazmorra cooperativa
  P.inDungeon = function (x, z) { const p = this.player; const r = this.W.regionAt(x ?? p.x, z ?? p.z); return r && r.kind === 'dungeon'; };
  P.dgState = function () { return this.dg || (this.dg = { spawned: [], cleared: [], temps: [[], [], [], []], resetT: 0 }); };
  P.enterDungeon = function (from) {
    const p = this.player;
    this.dgReturn = { x: p.x, z: p.z };
    p.x = this.dungeon.exit.x + 1; p.z = this.dungeon.exit.z - 3; p.path = []; p.target = null;
    this.placeFollowers(p.tx, p.tz);
    this.camTarget.set(p.x, 0, p.z);
    this.buildDungeonMeshes();
    this.toast('🕯️ Cripta de la Bruma: limpia cada sala para abrir la reja. Al fondo espera el Rey de la Cripta', 'area');
    void from;
  };
  P.leaveDungeon = function () {
    const p = this.player, r = this.dgReturn || { x: 50, z: 53 };
    p.x = r.x; p.z = r.z; p.path = [];
    this.placeFollowers(p.tx, p.tz);
    this.camTarget.set(p.x, 0, p.z);
  };
  P.buildDungeonMeshes = function () {
    if (this.dgBuilt) return;
    this.dgBuilt = true;
    const R = this.dungeon, M = this.M, g = new THREE.Group();
    const floor = new THREE.MeshLambertMaterial({ color: 0x5a5660, map: M.tx.stone });
    const wall = new THREE.MeshLambertMaterial({ color: 0x3a3640, map: M.tx.stone });
    const fire = new THREE.MeshBasicMaterial({ color: 0xffa040 });
    const add = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.receiveShadow = true; g.add(o); return o; };
    for (const r of R.rooms) {
      const cx = R.X + r.x0 + (r.w - 1) / 2, cz = R.Z + r.z0 + (r.d - 1) / 2;
      add(r.w, 0.2, r.d, floor, cx, -0.1, cz);
      add(r.w + 0.4, 2.2, 0.3, wall, cx, 1.1, R.Z + r.z0 - 0.65);
      add(0.3, 2.2, r.d + 0.4, wall, R.X + r.x0 - 0.65, 1.1, cz);
      for (const [x, z] of [[r.x0, r.z0], [r.x0 + r.w - 1, r.z0]]) { add(0.12, 0.5, 0.12, M.darkWood, R.X + x, 1.4, R.Z + z - 0.45); add(0.16, 0.2, 0.16, fire, R.X + x, 1.75, R.Z + z - 0.45); }
    }
    for (let i = 0; i < 3; i++) { const x0 = R.X + R.rooms[i].x0 + R.rooms[i].w; add(3, 0.2, 2, floor, x0 + 1, -0.1, R.Z + 3.5); }
    // trono y salida
    add(1.4, 1.6, 0.6, new THREE.MeshLambertMaterial({ color: 0x6a1a2a }), R.X + 38, 0.8, R.Z - 0.9);
    add(0.9, 0.05, 0.7, new THREE.MeshLambertMaterial({ color: 0x8a2a2a }), R.exit.x, 0.01, R.exit.z);
    this.dgGates = R.doors.map((d) => { const gt = new THREE.Group(); for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 5), M.iron); b.position.set(0, 0.9, -0.45 + k * 0.45 + 3.5); gt.add(b); } gt.position.set(d.x, 0, R.Z); g.add(gt); return gt; });
    this.scene.add(g);
    this.dgGroup = g;
  };
  P.applyDgDoors = function (cleared) {
    const R = this.dungeon;
    R.doors.forEach((d, i) => {
      const open = !!cleared[i];
      for (const z of d.zs) R.setBlocked(d.x, R.Z + z, open ? 0 : 1);
      if (this.dgGates) this.dgGates[i].visible = !open;
    });
  };
  // el anfitrión (o el juego sin multijugador) controla la cripta
  P.updateDungeon = function (dt) {
    const p = this.player, here = this.inDungeon();
    if (here) {
      this.buildDungeonMeshes();
      this.scene.background.set(0x07070c);
      this.torch.position.set(p.x, 2.4, p.z); this.torch.distance = 14; this.torch.intensity = 6;
    }
    if (this.net.isClient && this.net.active) return;
    const S = this.dgState(), R = this.dungeon;
    this.dgT = (this.dgT || 0) - dt;
    if (this.dgT > 0) return;
    this.dgT = 0.5;
    const people = [p, ...this.net.remotes.values()].filter((q) => !q.dead && this.inDungeon(q.x, q.z));
    const lvl = clamp(Math.max(...[p, ...this.net.remotes.values()].map((q) => q.level || q.lv || 1)), 5, 100);
    let changed = false;
    R.rooms.forEach((r, i) => {
      if (!S.spawned[i] && people.some((q) => q.x - R.X >= r.x0 && q.x - R.X < r.x0 + r.w && (i === 0 || S.cleared[i - 1]))) {
        S.spawned[i] = true;
        const n = people.length;
        for (const [type, c] of r.foes) for (let k = 0; k < c + (type === 'crypt_king' ? 0 : Math.max(0, n - 1)); k++) {
          const x = R.X + r.x0 + 1 + Math.floor(Math.random() * (r.w - 2)), z = R.Z + r.z0 + 1 + Math.floor(Math.random() * (r.d - 2));
          const e = this.spawnTemp(type, x, z, type === 'crypt_king' ? lvl + 3 : Math.max(1, lvl - 2));
          if (type === 'crypt_king') { e.maxHp = Math.round(e.maxHp * (1 + 0.35 * (n - 1))); e.hp = e.maxHp; }
          S.temps[i].push(e);
        }
        this.net.sendX({ k: 'toast', msg: `🕯️ ${r.name}` });
        this.toast(`🕯️ ${r.name}`);
      }
      if (S.spawned[i] && !S.cleared[i] && S.temps[i].every((e) => e.dead)) {
        S.cleared[i] = true; changed = true;
        if (i < 3) { this.toast('🔓 ¡La reja se abre!'); this.net.sendX({ k: 'toast', msg: '🔓 ¡La reja de la cripta se abre!' }); }
        else {
          this.toast('👑 ¡El Rey de la Cripta ha caído! Todos los que estáis dentro recibís su tesoro', 'area');
          this.dungeonLoot();
          this.net.sendX({ k: 'dgwin' });
        }
      }
    });
    if (changed) { this.applyDgDoors(S.cleared); this.net.sendX({ k: 'dg', c: S.cleared }); }
    // nadie dentro durante un rato: la cripta se reinicia
    if (!people.length && S.spawned.some(Boolean)) {
      S.resetT += 0.5;
      if (S.resetT > 30) {
        for (const list of S.temps) for (const e of list) if (!e.removed) e.remove();
        this.dg = null;
        this.applyDgDoors([]);
        this.net.sendX({ k: 'dg', c: [] });
        this.purgeTemps();
      }
    } else S.resetT = 0;
  };
  P.dungeonLoot = function () {
    if (!this.inDungeon()) return;
    const p = this.player;
    const g = 600 + p.level * 25;
    p.gold += g;
    this.give('ficha', 3);
    this.give(['goldore', 'perla', 'obsidiana', 'jade'][Math.floor(Math.random() * 4)], 3);
    if (Math.random() < 0.5) this.give(D.EVENT_COS[Math.floor(Math.random() * D.EVENT_COS.length)], 1);
    if (Math.random() < 0.4) this.addTreasureMap();
    if (!this.ownCos('c_corona_cripta')) this.give('c_corona_cripta');
    p.gainXp(1500 + p.level * 60);
    this.stats.dungeons = (this.stats.dungeons || 0) + 1;
    this.toast(`💰 Tesoro de la cripta: +${g} oro`, 'area');
  };

  // ============================================================ barcos de piratas famosos
  P.spawnFamousShip = function () {
    if (!this.famousList) return null;
    const p = this.player;
    const cands = this.famousList.filter((f) => this.famous[f.id].lvl <= p.level + 25 && this.playtime > this.famous[f.id].down && !this.famousActors[f.id]);
    if (!cands.length) return null;
    const f = cands[Math.floor(Math.random() * cands.length)];
    const s = this.spawnEnemyShip('pirate');
    if (!s) return null;
    const st = this.famous[f.id];
    s.famous = f; s.level = st.lvl;
    s.maxHp = s.hp = Math.round(300 + st.lvl * 25);
    s.label.nm.textContent = `☠ Barco de ${f.name} · Nv. ${st.lvl}`;
    s.label.nm.style.color = '#ff5ad0';
    const sail = new THREE.MeshLambertMaterial({ color: f.look.cape || f.look.shirt || 0x3a2a2a, side: THREE.DoubleSide });
    s.mesh.traverse((o) => { if (o.userData.sail) o.material = sail; });
    st.isle = 'mar';
    this.toast(`☠ ¡El barco de ${f.name} «${f.ep}» viene a por ti!`, 'area');
    return s;
  };

  // ============================================================ multijugador: mensajes de las nuevas funciones
  P.onNetX = function (from, m) {
    const r = this.net.remotes.get(from);
    const name = r ? r.name : '?';
    if (m.k === 'toast') this.toast(m.msg);
    else if (m.k === 'race') { (this.raceBoard || (this.raceBoard = [])).push({ name: m.name, t: m.t }); this.raceBoard.sort((a, b) => a.t - b.t); this.raceBoard = this.raceBoard.slice(0, 8); this.toast(`🏁 ${m.name} terminó la regata en ${m.t}s`); }
    else if (m.k === 'dg') { this.applyDgDoors(m.c || []); }
    else if (m.k === 'dgwin') { this.dungeonLoot(); }
    else if (m.k === 'propose' && m.to === this.net.myId) {
      this.ui.openDialog(`💍 ${name}`, `${name} te pide matrimonio. ¿Aceptas?`, [
        { label: '💍 ¡Sí, quiero!', action: () => { this.spouseP = name; this.net.sendX({ k: 'wed', to: from }); this.wedding(null, name); } },
        { label: 'Ahora no', action: () => this.net.sendX({ k: 'nowed', to: from }) },
      ]);
    } else if (m.k === 'wed' && m.to === this.net.myId) { this.spouseP = name; this.toast(`💒 ¡${name} ha dicho que sí!`, 'area'); this.give(D.isFemale() ? 'c_vestido_novia' : 'c_traje_boda'); this.give('c_velo_novia'); }
    else if (m.k === 'nowed' && m.to === this.net.myId) this.toast(`💔 ${name} no está preparado/a todavía`);
  };
  P.proposeRemote = function (r) {
    if ((this.player.inv.anillo_boda || 0) <= 0) return this.toast('Necesitas un Anillo de compromiso (se forja con oro y una perla)');
    this.player.inv.anillo_boda--;
    this.net.sendX({ k: 'propose', to: r.id });
    this.toast(`💍 Le pides matrimonio a ${r.name}...`);
  };
  // datos extra que ven los demás jugadores
  P.netExtraInfo = function () { return { pet: this.petType || null, flag: this.flagCfg || null, spouse: this.spouseP || (this.partner() && this.soc(this.partner().id).married ? this.partner().name : null) }; };
  P.updateRemoteExtras = function (dt) {
    for (const r of this.net.remotes.values()) {
      if (r.petType !== r.pet) {
        if (r.petObj) { this.scene.remove(r.petObj.m); r.petObj = null; }
        r.petType = r.pet;
        if (r.pet && PETS[r.pet]) { const m = petModel(r.pet); this.scene.add(m); r.petObj = { m, x: r.x, z: r.z, t: 0 }; }
      }
      if (r.petObj) {
        const o = r.petObj;
        o.t += dt;
        const tx = r.x + Math.sin(r.face + Math.PI + 0.7) * 0.85, tz = r.z + Math.cos(r.face + Math.PI + 0.7) * 0.85;
        o.x += (tx - o.x) * Math.min(1, dt * 4); o.z += (tz - o.z) * Math.min(1, dt * 4);
        o.m.position.set(o.x, Math.max(0, this.W.groundY(o.x, o.z)) + (PETS[r.pet].fly ? 1.1 + Math.sin(o.t * 3) * 0.1 : 0), o.z);
        o.m.visible = !(r.ship && r.ship.visible);
        for (const w of o.m.userData.wings) w.rotation.z = Math.sin(o.t * 18) * 0.6 * Math.sign(w.position.x);
      }
      const fk = JSON.stringify(r.flag || null);
      if (r.ship && r.flagKey !== fk) { r.flagKey = fk; if (r.flag) this.applyFlag(r.ship, r.flag); }
    }
  };
}

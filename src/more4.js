// v3.0: cuatro islas nuevas con su ambiente, Armamento Espiritual (nivel 100), cazarrecompensas, gruta marina,
// erupción del volcán, ciudad flotante Velaria, bruja vudú y hechizos, ranking y Día de la caza, pesca con minijuego
// y oficios con más recompensas.
import * as THREE from 'three';
import { makeIslet, populate } from './regions.js';
import { T } from './world.js';
import { ITEMS } from './items.js';

// ---------------------------------------------------------------- islas nuevas
function H(R) {
  const prop = (type, x, z, rot = 0, blocks = true, extra = {}) => { R.props.push({ type, x, z, rot, ...extra }); if (blocks) R.block(x, z); };
  const house = (id, x0, z0, w, d, door, o = {}) => { R.buildings.push({ id, x0, z0, w, d, door, wall: 0xe8d8b0, roof: 0xb05a3a, h: 1.5, ...o }); for (let z = z0; z < z0 + d; z++) for (let x = x0; x < x0 + w; x++) R.block(x, z); };
  return { prop, house, npc: (n) => R.npcs.push(n) };
}
export function makeIslands4() {
  const out = [];
  // Isla Escarcha: montañas nevadas, castillo de hielo y el monasterio del Maestro
  {
    const R = makeIslet({ id: 'escarcha', name: 'Isla Escarcha', ox: 175, oz: -95, N: 58, seed: 131, dockDir: [-1, 0], biome: 'snow' });
    const { x: cx, z: cz } = R.center, { prop, house, npc } = H(R);
    R.towns.push({ name: 'Monasterio del Pico', x: cx + 6, z: cz, r: 6 });
    R.reserve(cx + 4, cz, 9);
    prop('icecastle', cx + 12, cz - 8, 0, true); for (let dz = -1; dz <= 1; dz++) for (let dx = -2; dx <= 2; dx++) R.block(cx + 12 + dx, cz - 8 + dz);
    prop('monastery', cx + 6, cz - 2, 0, true); for (let dx = -1; dx <= 1; dx++) R.block(cx + 6 + dx, cz - 2);
    house('escarcha_1', cx - 4, cz - 5, 3, 3, 's', { wall: 0x8a6a4a, roof: 0xf4f8fc, plank: true });
    house('escarcha_2', cx - 4, cz + 3, 3, 3, 'n', { wall: 0x7a5a3a, roof: 0xf4f8fc, plank: true });
    prop('campfire', cx, cz + 1); prop('forge', cx + 2, cz + 3);
    npc({ id: 'maestro', name: 'Maestro Ishvar', x: cx + 6, z: cz, wander: 1, look: { shirt: 0xd8c8a8, pants: 0x4a3a2a, robe: 0xc8402a, hair: null, beard: 0xe8e8e8, skin: 0xc68a5a, sash: 0x1a1a1a } });
    npc({ id: 'helga', name: 'Herrera Helga', x: cx + 1, z: cz + 3, wander: 1, look: { shirt: 0x5a7a9a, pants: 0x3a3a4a, apron: 0x4a3a2a, hair: 0xf0e0b0, longHair: true, skin: 0xf3cfaa, bracers: true, bracerColor: 0xcfe8f8, axe: true } });
    populate(R, 1);
    const { ox, oz, N } = R;
    R.spawns.push({ type: 'lobo_nieve', count: 6, area: [ox + 6, oz + 6, ox + N - 7, cz - 8], lvl: [80, 88] });
    R.spawns.push({ type: 'yeti', count: 4, area: [ox + 6, cz + 8, ox + N - 7, oz + N - 7], lvl: [85, 94] });
    out.push(R);
  }
  // Isla Merengue: tierra de dulces, tartas gigantes y bastones de caramelo
  {
    const R = makeIslet({ id: 'merengue', name: 'Isla Merengue', ox: -100, oz: 84, N: 52, seed: 147, dockDir: [1, 0], biome: 'candy' });
    const { x: cx, z: cz } = R.center, { prop, house, npc } = H(R);
    R.towns.push({ name: 'Villa Merengue', x: cx, z: cz, r: 8 });
    R.reserve(cx, cz, 8);
    for (const [dx, dz] of [[-6, -6], [6, -6], [-6, 6], [7, 5], [0, -9]]) { prop('cake', cx + dx, cz + dz, 0, true); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) R.block(cx + dx + a, cz + dz + b); }
    house('merengue_1', cx - 3, cz - 4, 3, 3, 's', { wall: 0xf8d8e8, roof: 0xe060a0 });
    house('merengue_2', cx + 2, cz + 2, 3, 3, 'n', { wall: 0xfff0d0, roof: 0x8a5a3a });
    prop('stall', cx + 3, cz - 2, 0, true, { color: 0xf060b0 });
    npc({ id: 'dulcinea', name: 'Pastelera Dulcinea', x: cx, z: cz, wander: 2, look: { shirt: 0xf8c8d8, pants: 0x8a5a7a, dress: true, dressColor: 0xf4a8c8, apron: 0xffffff, hair: 0xf8e080, longHair: true, skin: 0xf3cfaa, hat: 'hood', hatColor: 0xffffff } });
    npc({ id: 'bombon', name: 'Niño Bombón', x: cx - 1, z: cz + 2, wander: 3, small: true, look: { shirt: 0x8a5a3a, pants: 0xf060b0, hair: 0x5a3a20, skin: 0xe0aa80 } });
    populate(R, 1);
    const { ox, oz, N } = R;
    R.spawns.push({ type: 'galleta', count: 7, area: [ox + 6, oz + 6, ox + N - 7, oz + N - 7], lvl: [70, 80] });
    out.push(R);
  }
  // Archipiélago Burbuja: manglares gigantes y pompas que flotan
  {
    const R = makeIslet({ id: 'burbuja', name: 'Archipiélago Burbuja', ox: -95, oz: -95, N: 58, seed: 163, dockDir: [1, 0], biome: 'mangrove' });
    const { x: cx, z: cz } = R.center, { prop, npc } = H(R);
    R.reserve(cx, cz, 5);
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, r = 6 + (i % 4) * 4; const x = Math.round(cx + Math.cos(a) * r), z = Math.round(cz + Math.sin(a) * r); if (R.walkable(x, z)) prop('bubblepost', x, z, 0, true); }
    prop('tent', cx - 2, cz - 2, 0.4); prop('campfire', cx + 1, cz);
    npc({ id: 'odo', name: 'Burbujero Odo', x: cx, z: cz + 1, wander: 2, look: { shirt: 0x5ab8d8, pants: 0x2a4a5a, vest: 0xe8e0d0, hair: 0x9a7a5a, skin: 0xd9a066, hat: 'straw', backpack: 0x7a5232 } });
    populate(R, 1);
    const { ox, oz, N } = R;
    R.spawns.push({ type: 'cangrejo_burbuja', count: 6, area: [ox + 6, oz + 6, ox + N - 7, oz + N - 7], lvl: [60, 70] });
    R.spawns.push({ type: 'tiger', count: 3, area: [ox + 6, oz + 6, ox + N - 7, oz + N - 7], lvl: [62, 68] });
    out.push(R);
  }
  // Isla Engranaje: ciudad de inventores con torres de engranajes y autómatas
  {
    const R = makeIslet({ id: 'engranaje', name: 'Isla Engranaje', ox: 178, oz: 40, N: 56, seed: 179, dockDir: [-1, 0], biome: 'tech' });
    const { x: cx, z: cz } = R.center, { prop, house, npc } = H(R);
    R.towns.push({ name: 'Ciudad Engranaje', x: cx, z: cz, r: 9 });
    R.reserve(cx, cz, 9);
    for (const [dx, dz] of [[-7, -7], [7, -7], [-7, 7], [7, 7], [0, -10]]) { prop('geartower', cx + dx, cz + dz, 0, true); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) R.block(cx + dx + a, cz + dz + b); }
    house('engranaje_1', cx - 4, cz - 4, 3, 3, 'e', { wall: 0x8a8c94, roof: 0xd8a838, stone: true });
    house('engranaje_2', cx + 2, cz - 4, 4, 3, 'w', { wall: 0x7a7c84, roof: 0x3a3a3a, stone: true });
    house('engranaje_3', cx - 4, cz + 2, 3, 3, 'e', { wall: 0x9a7a5a, roof: 0xd8a838, plank: true });
    prop('anvil', cx + 2, cz + 3); prop('crate', cx + 4, cz + 3);
    npc({ id: 'volta', name: 'Inventora Volta', x: cx, z: cz, wander: 2, look: { shirt: 0x3a5a7a, pants: 0x3a3a3a, coat: true, hair: 0xd84a1a, longHair: true, skin: 0xf0c49a, hat: 'cap', capColor: 0x6a4a2a, visorGlow: 0xffd040 } });
    npc({ id: 'tornillo', name: 'Mecánico Tornillo', x: cx + 1, z: cz + 2, wander: 1, look: { shirt: 0x3a5a7a, pants: 0x3a5a7a, hair: 0x2a2a2a, beard: 0x2a2a2a, skin: 0xc68a5a, bracers: true, bracerColor: 0x8a8c94 } });
    populate(R, 1);
    const { ox, oz, N } = R;
    R.spawns.push({ type: 'automata', count: 6, area: [ox + 6, oz + 6, ox + N - 7, oz + N - 7], lvl: [90, 99] });
    out.push(R);
  }
  return out;
}
// ambiente propio de cada isla (cielo, partículas)
const AMBIENT = { escarcha: { sky: 0xc8dcf0, snow: true }, merengue: { sky: 0xffc8e0 }, burbuja: { sky: 0xa8e8f0 }, engranaje: { sky: 0xb8a890, smoke: true } };

// ---------------------------------------------------------------- gruta marina
const GX = 2200, GZ = 0, GW = 18, GD = 12;
export function makeGrotto() {
  const blocked = new Uint8Array(GW * GD);
  const inb = (lx, lz) => lx >= 0 && lz >= 0 && lx < GW && lz < GD;
  const R = { kind: 'dungeon', id: 'gruta', name: 'Gruta de los Cristales', X: GX, Z: GZ, exit: { x: GX + 1, z: GZ + 10 }, spawns: [] };
  R.contains = (x, z) => x >= GX - 1 && x <= GX + GW && z >= GZ - 1 && z <= GZ + GD;
  R.tile = (x, z) => (inb(x - GX, z - GZ) ? T.ROCK : T.WATER);
  R.walkable = (x, z) => { const lx = x - GX, lz = z - GZ; return inb(lx, lz) && !blocked[lz * GW + lx]; };
  R.setBlocked = (x, z, v) => { const lx = x - GX, lz = z - GZ; if (inb(lx, lz)) blocked[lz * GW + lx] = v; };
  R.groundY = () => 0;
  R.areaName = () => 'Gruta de los Cristales';
  R.chests = [[16, 1], [9, 1], [16, 10]].map(([x, z], i) => ({ id: 'gruta_' + i, x: GX + x, z: GZ + z, loot: { gold: 450, potion: 1 } }));
  for (const c of R.chests) blocked[(c.z - GZ) * GW + (c.x - GX)] = 1;
  R.crystals = [[4, 3], [7, 8], [12, 4], [14, 7], [5, 10]].map(([x, z]) => ({ x: GX + x, z: GZ + z }));
  for (const c of R.crystals) blocked[(c.z - GZ) * GW + (c.x - GX)] = 1;
  R.spawns.push({ type: 'cangrejo_burbuja', count: 4, area: [GX + 3, GZ + 1, GX + 16, GZ + 10], lvl: [40, 50] });
  R.spawns.push({ type: 'bat', count: 4, area: [GX + 3, GZ + 1, GX + 16, GZ + 10], lvl: [42, 52] });
  return R;
}
export const GROTTO_SPOTS = [{ x: 104, z: 70 }, { x: 60, z: -30 }];
const VELARIA_SPOTS = [{ x: 140, z: 60 }, { x: -20, z: 130 }, { x: 150, z: -40 }, { x: -50, z: 0 }];

const FISH = [['fish', 0.62], ['atun', 0.24], ['pez_espada', 0.09], ['pez_luna', 0.04], ['pez_dorado', 0.01]];

export function installMore4(Game, D) {
  const P = Game.prototype;
  const sfx = D.sfx;

  // ============================================================ ambiente de las islas nuevas
  P.updateAmbience = function () {
    const p = this.player;
    const r = this.W.regionAt(p.x, p.z);
    const A = r && AMBIENT[r.id];
    this.forceSnow = !!(A && A.snow) && !this.sailing;
    if (A && !this.roomAt(p.x, p.z)) {
      this.scene.background.lerp(new THREE.Color(A.sky), 0.6 * (1 - this.night * 0.7));
      if (this.hemi) this.hemi.color.lerp(new THREE.Color(A.sky), 0.35);
    }
  };

  // ============================================================ Armamento Espiritual
  P.espLevel = function () { return this.esp ? this.esp.l : 0; };
  P.espMul = function () { return this.esp ? 1.2 + this.esp.l * 0.006 : 1; };
  P.espRes = function () { return this.esp ? 1 - (0.05 + this.esp.l * 0.003) : 1; };
  P.learnEsp = function () {
    const p = this.player;
    if (p.level < 100) return this.toast('El Maestro Ishvar solo enseña a quien ha llegado al nivel 100');
    this.buy({ gold: 20000 }, () => {
      this.esp = { l: 1, xp: 0 };
      this.toast('🖤 Has despertado el Armamento Espiritual: tus golpes se cubren de energía oscura (+20% daño, +5% resistencia)', 'area');
      sfx('level');
    });
  };
  P.espHit = function () {
    if (!this.esp) return;
    this.espT = 5;
    const E = this.esp;
    if (E.l >= 50) return;
    E.xp++;
    const need = 25 + E.l * 12;
    if (E.xp >= need) { E.xp -= need; E.l++; this.toast(`🖤 Armamento Espiritual nivel ${E.l}${E.l === 30 ? ': ¡la energía ahora cubre tu torso!' : ''}`, 'area'); sfx('level'); }
  };
  P.updateEsp = function (dt) {
    const p = this.player, m = p.model;
    if (this.espT > 0) this.espT -= dt;
    const on = !!this.esp && this.espT > 0;
    let o = m.espFx;
    if (on && !o) {
      o = m.espFx = { meshes: [] };
      const dark = new THREE.MeshPhongMaterial({ color: 0x050408, emissive: 0x0c0414, shininess: 140, specular: 0xb08aff });
      const glow = new THREE.MeshBasicMaterial({ color: 0xff3a8a, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
      o.glow = glow;
      for (const arm of [m.parts.armL, m.parts.armR]) {
        const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.062, 0.2, 4, 8), dark); a.position.y = -0.16; arm.add(a); o.meshes.push(a);
        const g2 = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), glow); g2.position.y = -0.25; arm.add(g2); o.meshes.push(g2);
      }
      if (m.parts.weapon) { const ks = []; m.parts.weapon.traverse((k) => { if (k.isMesh && !k.userData.espCopy && k.material !== D.OUTLINE) ks.push(k); }); ks.forEach((k) => { const c = new THREE.Mesh(k.geometry, dark); c.userData.espCopy = true; c.position.copy(k.position); c.rotation.copy(k.rotation); c.scale.copy(k.scale).multiplyScalar(1.04); k.parent.add(c); o.meshes.push(c); }); }
      if (this.esp.l >= 30) { const t = new THREE.Mesh(new THREE.CapsuleGeometry(0.175, 0.24, 4, 12), dark); t.position.y = 0.18; t.scale.z = 0.78; m.parts.torso.add(t); o.meshes.push(t); }
    } else if (!on && o) {
      for (const k of o.meshes) k.parent && k.parent.remove(k);
      m.espFx = null;
    }
    if (on && o) o.glow.opacity = 0.25 + Math.sin(this.time * 10) * 0.12;
  };

  // ============================================================ cazarrecompensas
  P.huntContracts = function () {
    if (this.hunts && this.hunts.day === this.day) return this.hunts.list;
    this.famousInit();
    const pool = [...this.famousList].sort(() => Math.random() - 0.5).slice(0, 3);
    this.hunts = { day: this.day, list: pool.map((f) => ({ id: f.id, done: false })) };
    return this.hunts.list;
  };
  P.canCapture = function () {
    const p = this.player;
    for (const e of Object.values(this.famousActors || {})) if (!e.dead && e.provoked && e.hp < e.maxHp * 0.15 && e.dist(p) < 2.4) return e;
    return null;
  };
  P.capture = function (e) {
    const f = e.famous, st = this.famous[f.id];
    const c = this.huntContracts().find((k) => k.id === f.id && !k.done);
    const reward = Math.round(st.bounty / (c ? 60 : 150));
    e.hp = 0; e.dead = true; e.deadT = 0; e.label.el.style.display = 'none'; e.temp && setTimeout(() => e.remove(), 400);
    this.player.gold += reward;
    if (c) { c.done = true; this.give('ficha', 6); }
    this.famousDefeated(f.id);
    this.stats.captures = (this.stats.captures || 0) + 1;
    this.jobXp('cazador', 120);
    this.toast(`⛓️ ¡Has capturado vivo a ${f.name}! +${reward} oro${c ? ' (contrato cumplido, +6 🎟)' : ''}`, 'area');
    sfx('quest');
  };

  // ============================================================ gruta marina (en bote de remos)
  P.grottoSpots = GROTTO_SPOTS;
  P.grottoNear = function () { if (!this.sailing) return null; const b = this.boat; return GROTTO_SPOTS.find((s) => Math.hypot(b.x - s.x, b.z - s.z) < 9) || null; };
  P.enterGrotto = function () {
    const p = this.player, b = this.boat;
    this.diveFrom = { x: b.x, z: b.z, h: b.heading };
    this.deck = null; this.autoHelm = null; b.speed = 0; this.sailing = false;
    this.scene.add(p.model.root); p.model.root.rotation.set(0, 0, 0);
    p.x = this.grotto.exit.x + 1; p.z = this.grotto.exit.z; p.path = [];
    this.unboardCrew(p.x, p.z);
    this.camTarget.set(p.x, 0, p.z);
    this.buildGrotto();
    for (const c of this.grotto.chests) if (this.flags[c.id] && this.flags[c.id + '_day'] !== this.day) this.flags[c.id] = false;
    this.toast('🚣 Entras remando en la Gruta de los Cristales', 'area');
  };
  P.inGrotto = function () { const r = this.W.regionAt(this.player.x, this.player.z); return r && r.id === 'gruta'; };
  P.buildGrotto = function () {
    if (this.grottoBuilt) return;
    this.grottoBuilt = true;
    const R = this.grotto, g = new THREE.Group();
    const floor = new THREE.Mesh(new THREE.BoxGeometry(GW + 2, 0.2, GD + 2), new THREE.MeshLambertMaterial({ color: 0x3a3440, map: this.M.tx.stone }));
    floor.position.set(GX + GW / 2 - 0.5, -0.1, GZ + GD / 2 - 0.5); g.add(floor);
    const wallM = new THREE.MeshLambertMaterial({ color: 0x2a2430, map: this.M.tx.stone });
    for (const [w, d, x, z] of [[GW + 2, 0.6, GX + GW / 2 - 0.5, GZ - 1.2], [0.6, GD + 2, GX - 1.2, GZ + GD / 2 - 0.5]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 3, d), wallM); m.position.set(x, 1.5, z); g.add(m); }
    const crys = [0x7ad8ff, 0xd87aff, 0x7affc8];
    R.crystals.forEach((c, i) => { for (let k = 0; k < 3; k++) { const m = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.7 + k * 0.2, 5), new THREE.MeshBasicMaterial({ color: crys[i % 3] })); m.position.set(c.x + (k - 1) * 0.2, 0.35, c.z + (k % 2) * 0.15); m.rotation.z = (k - 1) * 0.3; g.add(m); } });
    for (const c of R.chests) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.5), new THREE.MeshLambertMaterial({ color: 0xd8a838 })); b.position.set(c.x, 0.23, c.z); g.add(b); this.chests.push(c); }
    const boat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 1.8), new THREE.MeshLambertMaterial({ color: 0x6a4a2a })); boat.position.set(R.exit.x, 0.15, R.exit.z); g.add(boat);
    this.scene.add(g);
  };
  P.updateGrotto = function () {
    if (!this.inGrotto()) return;
    this.scene.background.set(0x07060c);
    const p = this.player;
    this.torch.position.set(p.x, 2.6, p.z); this.torch.distance = 14; this.torch.intensity = 5; this.torch.color.set(0x9ad8ff);
  };

  // ============================================================ erupción del volcán (evento)
  P.updateEruption = function (dt) {
    if (!this.event || this.event.id !== 'erupcion') return;
    const p = this.player;
    if (this.isleOf(p.x, p.z) !== 'ceniza') return;
    this.erT = (this.erT || 0) - dt;
    if (this.erT > 0) return;
    this.erT = 1.3;
    const x = p.x + (Math.random() - 0.5) * 6, z = p.z + (Math.random() - 0.5) * 6;
    this.ring(x, z, 1.4, 0xff4010);
    setTimeout(() => {
      this.ring(x, z, 1.8, 0xffa040);
      this.camShake = 0.25;
      if (Math.hypot(p.x - x, p.z - z) < 1.5 && !p.dead) this.damagePlayer({ x, z, isRemote: false }, 30 + p.level * 2.5);
      else if (Math.random() < 0.3) this.give('obsidiana', 1, x, z);
    }, 900);
  };

  // ============================================================ Velaria, la ciudad flotante
  P.velariaPos = function () { return VELARIA_SPOTS[Math.floor(this.day / 7) % VELARIA_SPOTS.length]; };
  P.updateVelaria = function () {
    const pos = this.velariaPos();
    if (!this.velaria) {
      const g = new THREE.Group();
      const wood = new THREE.MeshLambertMaterial({ color: 0x8a6a44, map: this.texSet.plank });
      for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2, r = i ? 3.5 : 0; const raft = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.1, 0.4, 8), wood); raft.position.set(Math.cos(a) * r, 0.05, Math.sin(a) * r); g.add(raft);
        const tent = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.6, 6), new THREE.MeshLambertMaterial({ color: [0xe03a4a, 0x3a8ae0, 0xe0b040, 0x3ac87a, 0xc85ae0, 0xffffff, 0xe0703a][i] })); tent.position.set(Math.cos(a) * r, 1.05, Math.sin(a) * r); g.add(tent); }
      for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 10), new THREE.MeshLambertMaterial({ color: [0xff6a5a, 0x5ab8ff, 0xffd040][i] })); b.position.set((i - 1) * 3, 6 + i * 0.5, 0); b.userData.bob = i; g.add(b); const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 5, 4), wood); rope.position.set((i - 1) * 3, 3.5, 0); g.add(rope); }
      this.scene.add(g);
      this.velaria = g;
    }
    this.velaria.position.set(pos.x, 0, pos.z);
    this.velaria.children.forEach((c) => { if (c.userData.bob !== undefined) c.position.y = 6 + Math.sin(this.time + c.userData.bob) * 0.3; });
  };
  P.velariaNear = function () { if (!this.sailing) return false; const v = this.velariaPos(); return Math.hypot(this.boat.x - v.x, this.boat.z - v.z) < 12; };
  P.velariaShop = function () {
    const sell = (id, price) => ({ label: `${ITEMS[id].icon} ${ITEMS[id].name} (${price} oro)`, action: () => this.buy({ gold: price }, () => { this.give(id, 1); this.velariaShop(); }) });
    this.ui.openDialog('🏙 Velaria, la ciudad flotante', 'Mercaderes de todos los mares. Cada semana anclamos en un sitio distinto.', [
      sell('huevo_dragon', 9000), { label: '🗺️ Mapa del tesoro (700 oro)', action: () => this.buy({ gold: 700 }, () => this.addTreasureMap()) },
      sell('meteorito', 500), sell('cristal', 350), sell('perla', 300), sell('hechizo_fuego', 250), sell('c_capa_burbuja', 1500), sell('semilla_calabaza', 15),
      { label: 'Adiós', action: null },
    ]);
  };

  // ============================================================ hechizos vudú
  P.castSpell = function (id) {
    const p = this.player;
    if (!p.inv[id]) return;
    const foes = this.enemies.filter((e) => !e.dead && !e.removed && (!e.hostile || e.hostile()) && e.dist(p) < 6);
    p.inv[id]--;
    p.st.skill = { type: 'cry', t: 0, dur: 0.8 };
    if (id === 'hechizo_fuego') { this.ring(p.x, p.z, 4, 0xff6020); for (const e of foes) this.hitEnemy(e, Math.round(p.atk * 3), true); }
    else if (id === 'hechizo_escudo') { this.addBuff('vudu', 30); this.ring(p.x, p.z, 1.6, 0x7aff8a); }
    else if (id === 'hechizo_niebla') { for (const e of foes) { e.state = 'return'; e.path = []; e.stunT = 3; } this.ring(p.x, p.z, 4, 0xb8c8c8); }
    else if (id === 'muneco_vudu') { const e = foes.sort((a, b) => a.dist(p) - b.dist(p))[0]; if (e) { this.hitEnemy(e, Math.round(e.maxHp * 0.15), true); this.ring(e.x, e.z, 1.5, 0x8a3ab0); } else { p.inv[id]++; return this.toast('No hay ningún enemigo cerca'); } }
    this.toast(`${ITEMS[id].icon} ¡${ITEMS[id].name.replace('Hechizo: ', '')}!`);
    sfx('skill');
  };

  // ============================================================ pesca con minijuego
  P.startFishGame = function () {
    this.fishGame = { fish: 0.5, fv: 0, zone: 0.35, zv: 0, prog: 0.3, t: 0, hold: false };
    document.getElementById('fishGame').classList.remove('hidden');
    this.toast('🎣 ¡Ha picado! Mantén pulsado para subir la caña y sigue al pez');
  };
  P.updateFishGame = function (dt) {
    const F = this.fishGame;
    if (!F) return;
    const L = this.jobLevel('pescador');
    F.t += dt;
    F.fv += (Math.random() - 0.5) * dt * 6; F.fv *= 0.96;
    F.fish = Math.max(0.03, Math.min(0.97, F.fish + F.fv * dt));
    if (F.fish <= 0.03 || F.fish >= 0.97) F.fv *= -1;
    F.zv += (F.hold ? 2.4 : -2.0) * dt; F.zv *= 0.9;
    F.zone = Math.max(0, Math.min(1 - 0.28, F.zone + F.zv * dt));
    const size = 0.24 + L * 0.004;
    const inside = F.fish >= F.zone && F.fish <= F.zone + size;
    F.prog += (inside ? 0.28 : -0.18) * dt;
    const el = document.getElementById('fishGame');
    el.querySelector('.fz').style.cssText = `bottom:${F.zone * 100}%;height:${size * 100}%`;
    el.querySelector('.ff').style.bottom = `${F.fish * 100}%`;
    el.querySelector('.fp i').style.height = `${Math.max(0, Math.min(1, F.prog)) * 100}%`;
    if (F.prog >= 1 || F.prog <= 0 || this.player.st.moving) {
      el.classList.add('hidden');
      this.fishGame = null;
      if (F.prog >= 1) {
        let r = Math.random(), id = 'fish';
        const boost = L * 0.004;
        const table = FISH.map(([k, w], i) => [k, i ? w + boost : w - boost * 4]);
        for (const [k, w] of table) { if (r < w) { id = k; break; } r -= w; }
        this.give(id, 1, this.player.x, this.player.z);
        this.fishDex = this.fishDex || {};
        const first = !this.fishDex[id];
        this.fishDex[id] = (this.fishDex[id] || 0) + 1;
        this.jobXp('pescador', { fish: 10, atun: 18, pez_espada: 35, pez_luna: 60, pez_dorado: 200 }[id]);
        this.contractTick('fish', 'fish');
        this.toast(`🎣 ¡${ITEMS[id].icon} ${ITEMS[id].name}!${first ? ' (nueva especie)' : ''}`, id === 'pez_dorado' ? 'area' : undefined);
        sfx(id === 'pez_dorado' ? 'level' : 'coin');
      } else this.toast('🎣 El pez se escapó...');
    }
  };

  // ============================================================ ranking de recompensas y Día de la caza
  P.ranking = function () {
    const me = { name: this.player.name, b: this.isMarine() ? 0 : this.bounty || 0, me: true };
    const list = [me, ...this.net.room.players.filter((pl) => pl.id !== this.net.myId).map((pl) => ({ name: pl.name, b: pl.bounty || 0, id: pl.id }))];
    return list.sort((a, b) => b.b - a.b);
  };
  P.startHuntDay = function () {
    if (!this.net.isHost) return;
    const top = this.net.room.players.map((pl) => ({ id: pl.id, name: pl.name, b: pl.id === 0 ? this.bounty || 0 : pl.bounty || 0 })).sort((a, b) => b.b - a.b)[0];
    if (!top) return;
    const msg = { k: 'hunt', target: top.id, name: top.name, t: 300 };
    this.net.sendX(msg);
    this.onHunt(msg);
    if (!this.net.room.pvp) this.net.setPvp(true);
  };
  P.onHunt = function (m) {
    this.hunt = { target: m.target, name: m.name, t: m.t };
    this.toast(m.target === this.net.myId ? '🎯 ¡DÍA DE LA CAZA! Eres el más buscado: sobrevive 5 minutos' : `🎯 ¡DÍA DE LA CAZA! Derrota a ${m.name} (el más buscado) en PvP`, 'area');
    sfx('quest');
  };
  P.updateHunt = function (dt) {
    const H2 = this.hunt;
    if (!H2) return;
    H2.t -= dt;
    const el = document.getElementById('eventBanner');
    if (el && !this.race && !(this.ctfState && this.ctfState.t > 0)) { el.classList.remove('hidden'); el.textContent = `🎯 Día de la caza · objetivo: ${H2.name} · ${Math.ceil(H2.t)} s`; }
    if (H2.t <= 0) {
      if (H2.target === this.net.myId) { this.player.gold += 3000; this.give('ficha', 8); this.toast('🎯 ¡Has sobrevivido al Día de la caza! +3000 oro', 'area'); }
      this.hunt = null;
      if (el) el.classList.add('hidden');
    }
  };
  P.huntDeath = function (killerId) {
    if (!this.hunt || this.hunt.target !== this.net.myId) return;
    this.net.sendX({ k: 'huntDown', killer: killerId });
    this.hunt = null;
    this.toast('🎯 Te han cazado...');
  };
  P.onNetX4 = function (from, m) {
    if (m.k === 'hunt') { this.onHunt(m); return true; }
    if (m.k === 'huntDown') {
      const killer = m.killer === this.net.myId ? this.player.name : ((this.net.room.players.find((q) => q.id === m.killer) || {}).name || '?');
      this.toast(`🎯 ¡${killer} ha cazado al más buscado!`, 'area');
      if (m.killer === this.net.myId) { this.player.gold += 5000; this.give('ficha', 10); this.addBounty(500, 'famous_x'); }
      this.hunt = null;
      const el = document.getElementById('eventBanner'); if (el) el.classList.add('hidden');
      return true;
    }
    return false;
  };

  // ============================================================ oficios con más valor (hitos)
  P.jobMilestone = function (id, l) {
    if (l % 10 !== 0) return;
    const p = this.player;
    const gold = l * 200;
    p.gold += gold;
    this.give('ficha', l / 5);
    if (l >= 20) { const pool = Object.keys(D.EQUIP).filter((k) => D.EQUIP[k].cos && (D.EQUIP[k].src === 'gremio' || D.EQUIP[k].src === 'evento') && !this.ownCos(k)); if (pool.length) this.give(pool[Math.floor(Math.random() * pool.length)]); }
    p.recalc();
    this.toast(`🏅 ¡Hito de oficio! Nivel ${l}: +${gold} oro, +${l / 5} 🎟${l >= 20 ? ' y ropa nueva' : ''}`, 'area');
  };
  P.jobHp = function () { let t = 0; for (const k of Object.keys(this.jobs || {})) t += (this.jobs[k] && this.jobs[k].l) || 0; return 1 + t * 0.003; };

  // ============================================================ cristales de la gruta
  P.crystalNear = function () { const p = this.player; return this.grotto.crystals.find((c) => Math.hypot(c.x - p.x, c.z - p.z) < 1.7 && this.flags['cr_' + c.x + '_' + c.z] !== this.day) || null; };
  P.mineCrystal = function (c) {
    this.flags['cr_' + c.x + '_' + c.z] = this.day;
    this.player.st.gather = 1; setTimeout(() => { this.player.st.gather = 0; }, 600);
    this.give('cristal', 2, c.x, c.z);
    this.jobXp('minero', 25);
    sfx('coin');
  };

  // ============================================================ diálogos de los NPC nuevos
  P.npcDialog4 = function (id, opts, sell) {
    const sellCos = (cid) => { if (!this.ownCos(cid)) sell(cid, this.cosPrice(cid).gold); };
    if (id === 'maestro') {
      if (!this.esp) {
        opts.push({ label: '🖤 Despertar el Armamento Espiritual (nivel 100 · 20000 oro)', action: () => this.learnEsp() });
        return 'Siento una gran fuerza en ti... pero el Armamento Espiritual solo despierta en quien ha llegado al nivel 100. Cubre tus puños y tu arma de energía oscura: +20% de daño y +5% de resistencia, y se fortalece cada vez que golpeas.';
      }
      const E = this.esp;
      return `Tu Armamento Espiritual está en el nivel ${E.l}/50 (${E.xp}/${25 + E.l * 12}). Daño ×${this.espMul().toFixed(2)} · resistencia ${Math.round((1 - this.espRes()) * 100)}%. ${E.l < 30 ? 'Al nivel 30 la energía cubrirá también tu torso.' : 'Tu torso ya está cubierto de energía: eres un verdadero maestro.'}`;
    }
    if (id === 'helga' || id === 'tornillo') { opts.push({ label: '⚒️ Forjar equipo (Escarcha y Estelar)', action: () => this.panels.openCraft('forja') }); if (id === 'helga') { sellCos('c_gorro_nieve'); sellCos('c_abrigo_piel'); sell('cristal', 120); } else sell('meteorito', 220); return null; }
    if (id === 'dulcinea') { sell('f_tarta', 40); sell('azucar', 15); sell('potion', 15); sellCos('c_traje_pastelero'); sellCos('c_gorro_pastelero'); return null; }
    if (id === 'odo') { sellCos('c_capa_burbuja'); sell('perla', 150); return 'Hay una Gruta de los Cristales escondida en el mar: búscala cerca de la costa este de Isla Bruma y al norte. Acércate en barco y entra con el bote de remos.'; }
    if (id === 'volta') { sellCos('c_gafas_inventor'); sellCos('c_mono_mecanico'); sell('meteorito', 240); return null; }
    if (id === 'mambe') {
      sell('hechizo_fuego', 300); sell('hechizo_escudo', 250); sell('hechizo_niebla', 200); sell('muneco_vudu', 400);
      return 'Los espíritus me dan su poder... y yo te lo vendo. Usa los hechizos desde la Mochila (botón «Lanzar»).';
    }
    if (id === 'ferro' || id === 'mara') opts.push({ label: '⛓️ Contratos de captura', action: () => this.huntMenu() });
    return null;
  };
  P.huntMenu = function () {
    const list = this.huntContracts();
    const lines = list.map((c) => { const f = this.famousList.find((k) => k.id === c.id), st = this.famous[c.id]; return `${c.done ? '✅' : '⛓️'} ${f.name} · ${st.bounty} oro · visto en ${st.isle === 'main' ? 'Isla Bruma' : ((this.islets.find((r) => r.id === st.isle) || {}).name || st.isle)}`; }).join('<br>');
    this.ui.openDialog('⛓️ Contratos de captura', `Captura vivos a estos piratas famosos: déjalos con poca vida (menos del 15%) y pulsa «Capturar». Pagan mucho más que derrotarlos.<br><br>${lines}`, [{ label: 'Entendido', action: null }]);
  };
  // apagar la luz azul al salir de la gruta
  const upG = P.updateGrotto;
  P.updateGrotto = function () {
    if (!this.inGrotto()) { if (this.grottoLight) { this.grottoLight = false; this.torch.color.set(0xffb060); this.torch.distance = 8; } return; }
    this.grottoLight = true;
    upG.call(this);
  };

  // ============================================================ atajos y minijuego (interfaz)
  P.setupHud4 = function () {
    const $ = (id) => document.getElementById(id);
    const sc = $('shortcuts'), btn = $('btnShort');
    if (btn && sc) {
      btn.addEventListener('pointerdown', (ev) => { ev.preventDefault(); ev.stopPropagation(); sc.classList.toggle('hidden'); });
      sc.addEventListener('pointerup', (ev) => { if (ev.target.closest('button')) setTimeout(() => sc.classList.add('hidden'), 60); }, true);
      sc.addEventListener('click', (ev) => { if (ev.target.closest('button')) sc.classList.add('hidden'); }, true);
      document.addEventListener('pointerdown', (ev) => { if (!sc.classList.contains('hidden') && !sc.contains(ev.target) && ev.target !== btn) sc.classList.add('hidden'); }, true);
      const ph = $('btnPhoto');
      if (ph) ph.addEventListener('click', () => { if (this.started && this.photoMode) this.photoMode(true); });
    }
    const fg = $('fishGame');
    if (fg) {
      const on = (v) => (ev) => { ev.preventDefault(); if (this.fishGame) this.fishGame.hold = v; };
      fg.addEventListener('pointerdown', on(true));
      fg.addEventListener('pointerup', on(false));
      fg.addEventListener('pointerleave', on(false));
      window.addEventListener('keydown', (ev) => { if (ev.code === 'Space' && this.fishGame) { this.fishGame.hold = true; ev.preventDefault(); } });
      window.addEventListener('keyup', (ev) => { if (ev.code === 'Space' && this.fishGame) this.fishGame.hold = false; });
    }
  };

  // ============================================================ bitácora: novedades
  P.mundoHtml = function () {
    const p = this.player, E = this.esp, v = this.velariaPos();
    const where = (x, z) => `${x < 60 ? 'oeste' : x > 120 ? 'este' : 'centro'}${z < 30 ? ' · norte' : z > 110 ? ' · sur' : ''}`;
    const fishRows = FISH.map(([id]) => `<span class="pill">${this.fishDex && this.fishDex[id] ? `${ITEMS[id].icon} ${ITEMS[id].name} ×${this.fishDex[id]}` : '❔ ???'}</span>`).join(' ');
    const jobsT = Object.values(this.jobs || {}).reduce((a, j) => a + (j.l || 0), 0);
    let rank = '';
    if (this.net.active) {
      rank = `<div class="sub">🏆 Ranking de recompensas</div><ol>${this.ranking().map((r) => `<li>${r.me ? '<b>' : ''}${r.name}${r.me ? '</b>' : ''} · ${r.b} oro</li>`).join('')}</ol>` +
        (this.net.isHost ? '<button class="pbtn" data-p="huntday">🎯 Empezar el Día de la caza (PvP)</button>' : '<p class="muted small">El anfitrión puede iniciar el Día de la caza.</p>') +
        (this.hunt ? `<p>🎯 Día de la caza en curso: objetivo <b>${this.hunt.name}</b> (${Math.ceil(this.hunt.t)} s)</p>` : '');
    }
    return `<div class="parch">
      <p><b>🖤 Armamento Espiritual</b>: ${E ? `nivel <b>${E.l}/50</b> (${E.xp}/${25 + E.l * 12}) · daño ×${this.espMul().toFixed(2)} · resistencia ${Math.round((1 - this.espRes()) * 100)}%${E.l >= 30 ? ' · torso cubierto' : ' · al nivel 30 cubre el torso'}` : p.level >= 100 ? 'ya puedes despertarlo: busca al <b>Maestro Ishvar</b> en el Monasterio del Pico (Isla Escarcha)' : `se desbloquea al nivel 100 con el Maestro Ishvar (Isla Escarcha). Tu nivel: ${p.level}`}.</p>
      <p class="muted small">Cada golpe lo entrena, como un oficio. Al atacar, tus manos y tu arma se cubren de energía negra.</p>
      <p class="muted small">🖤 Los enemigos fuertes también lo usan: mientras brillan en negro reciben un 40% menos de daño y pegan +20%. Tu Armamento lo compensa (daño completo desde el nivel 25).</p></div>
      <div class="sub">🏝 Islas nuevas</div>
      <ul class="qlist">
        <li>❄️ <b>Isla Escarcha</b> (noreste lejano): nieve, castillo de hielo, Monasterio del Pico. Lobos de las nieves y yetis (Nv. 80-94). Cristal de escarcha → equipo <span class="t7">Escarcha</span>.</li>
        <li>⚙️ <b>Isla Engranaje</b> (este lejano): ciudad de inventores con torres de engranajes. Autómatas (Nv. 90-99). Meteorito → equipo <span class="t8">Estelar</span>, el mejor.</li>
        <li>🍰 <b>Isla Merengue</b> (suroeste): tartas gigantes y bastones de caramelo. Soldados galleta (Nv. 70-80).</li>
        <li>🫧 <b>Archipiélago Burbuja</b> (noroeste): manglares y pompas flotantes. Cangrejos burbuja (Nv. 60-70).</li>
      </ul>
      <div class="sub">🗺 Lugares y servicios</div>
      <ul class="qlist">
        <li>🚣 <b>Gruta de los Cristales</b>: entra con el bote desde el mar, junto a la costa este de Isla Bruma o al norte. Cristales que se recogen cada día y cofres.</li>
        <li>🏙 <b>Velaria, la ciudad flotante</b>: cambia de sitio cada semana. Ahora está al ${where(v.x, v.z)} (marcada en el minimapa). Acércate en barco.</li>
        <li>🧙 <b>Bruja Mambé</b> (Aldea Liana, Isla Selva): hechizos vudú. Se lanzan desde la Mochila.</li>
        <li>⛓️ <b>Contratos de captura</b> (Ferro o Mara): captura vivos a piratas famosos (menos del 15% de vida → «Capturar»). <button class="pbtn small" data-p="huntlist">Ver contratos</button></li>
        <li>🌋 <b>Erupción</b>: evento en Isla Ceniza; esquiva las marcas rojas y recoge obsidiana.</li>
      </ul>
      <div class="sub">🎣 Acuario (pesca con minijuego)</div><p>${fishRows}</p>
      <p class="muted small">Cuando pica un pez, mantén pulsada la barra para que la zona verde siga al pez hasta llenar el medidor.</p>
      <div class="sub">🛠 Oficios</div><p>Niveles totales: <b>${jobsT}</b> · daño +${jobsT}% · vida +${(jobsT * 0.3).toFixed(1)}%. Hitos en los niveles 10, 20 y 30 de cada oficio (oro, fichas y ropa). Ahora hay 4 trabajos al día y pagan el doble.</p>
      ${rank}`;
  };

  // ============================================================ Armamento Espiritual de los enemigos
  // Los enemigos fuertes (nivel 90+, autómatas, yetis, galletas, piratas famosos de nivel 70+, jefes y superjefes)
  // también lo usan: se cubren de negro unos segundos, pegan +20% y aguantan más golpes.
  const ESP_TYPES = new Set(['yeti', 'automata', 'galleta', 'serafin', 'dragon', 'abyss_queen', 'ghost_captain', 'crypt_king', 'marine_boss', 'golem_boss']);
  P.enemyHasEsp = function (e) {
    if (e.isNPC || e.isRemote || !e.def) return false;
    return ESP_TYPES.has(e.type) || e.level >= 90 || (!!e.def.famous && e.level >= 70) || !!e.def.super;
  };
  // daño que recibe un enemigo con el Armamento activo: sin el tuyo haces un 40% menos; con el tuyo, cada nivel lo compensa
  P.enemyEspDef = function (e, dmg, killerId = 0, byCrew = false) {
    if (!e.espOn) return dmg;
    let k = 0.6;
    if (!byCrew && killerId === 0 && this.esp) k = Math.min(1, 0.75 + this.esp.l * 0.01);
    else if (!byCrew && killerId !== 0) k = 0.75;
    if (k < 1 && Math.random() < 0.25) this.ui.float('🖤 ¡Bloqueo espiritual!', 'info', e.x, e.model.height + 0.6, e.z);
    return Math.max(1, Math.round(dmg * k));
  };
  P.enemyEspAtk = function (e) { return e && e.espOn ? 1.2 : 1; };
  P.updateEnemyEsp = function (dt) {
    const p = this.player;
    for (const e of this.enemies) {
      if (!e.espCan) { if (e.espCan === undefined) e.espCan = this.enemyHasEsp(e) ? 1 : 0; if (!e.espCan) continue; }
      const near = !e.dead && !e.removed && e.dist(p) < 22;
      let on = false;
      if (near && (e.state === 'chase' || e.provoked || e.st.attackT > 0)) {
        // ciclo: 7 s activo, 5 s descanso (desfasado por enemigo)
        e.espT = (e.espT ?? (e.idx % 5)) + dt;
        on = e.espT % 12 < 7;
      }
      if (on !== !!e.espOn) {
        e.espOn = on;
        if (on && !e.espToast && e.dist(p) < 12) { e.espToast = true; this.toast(`🖤 ¡${e.def.name} se cubre con Armamento Espiritual! ${this.esp ? '' : '(sin el tuyo le harás menos daño)'}`); }
        this.enemyEspFx(e, on);
      }
      if (on && e.espFx) { e.espFx.glow.opacity = 0.22 + Math.sin(this.time * 9 + e.idx) * 0.1; if (e.espFx.ring) e.espFx.ring.rotation.z += dt * 3; }
      if (e.dead && e.espFx) { e.espOn = false; this.enemyEspFx(e, false); }
    }
  };
  P.enemyEspFx = function (e, on) {
    const m = e.model;
    if (!on) { if (e.espFx) { for (const k of e.espFx.meshes) k.parent && k.parent.remove(k); e.espFx = null; } if (e.label) e.label.el.classList.remove('esp'); return; }
    if (e.espFx) return;
    const dark = new THREE.MeshPhongMaterial({ color: 0x050408, emissive: 0x0c0414, shininess: 140, specular: 0xb08aff });
    const glow = new THREE.MeshBasicMaterial({ color: 0xff3a8a, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false });
    const F = e.espFx = { meshes: [], glow };
    const pa = m.parts || {};
    if (m.kind === 'humanoid' && pa.armL && pa.armR) {
      const big = /golem|yeti|automata/.test(e.type);
      for (const arm of [pa.armL, pa.armR]) {
        const a = new THREE.Mesh(new THREE.CapsuleGeometry(big ? 0.11 : 0.062, big ? 0.3 : 0.2, 4, 8), dark); a.position.y = big ? -0.24 : -0.16; arm.add(a); F.meshes.push(a);
        const g2 = new THREE.Mesh(new THREE.SphereGeometry(big ? 0.17 : 0.11, 10, 8), glow); g2.position.y = big ? -0.38 : -0.25; arm.add(g2); F.meshes.push(g2);
      }
      if (pa.weapon) { const ks = []; pa.weapon.traverse((k) => { if (k.isMesh && k.material !== D.OUTLINE) ks.push(k); }); ks.forEach((k) => { const c = new THREE.Mesh(k.geometry, dark); c.position.copy(k.position); c.rotation.copy(k.rotation); c.scale.copy(k.scale).multiplyScalar(1.04); k.parent.add(c); F.meshes.push(c); }); }
      if (pa.torso && !big && (e.def.boss || e.level >= 95)) { const t = new THREE.Mesh(new THREE.CapsuleGeometry(0.175, 0.24, 4, 12), dark); t.position.y = 0.18; t.scale.z = 0.78; pa.torso.add(t); F.meshes.push(t); }
    } else {
      // bestias y gólems: aura oscura alrededor del cuerpo
      const s = m.root.scale.x || 1, h = (m.height || 1) / s;
      const aura = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false }));
      aura.scale.set(1.1, h * 1.1, 1.1); aura.position.y = h * 0.5; m.root.add(aura); F.meshes.push(aura);
      const g2 = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 10), glow); g2.scale.set(1.15, h * 1.15, 1.15); g2.position.y = h * 0.5; m.root.add(g2); F.meshes.push(g2);
    }
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.6, 24), glow); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04; m.root.add(ring); F.meshes.push(ring); F.ring = ring;
    if (e.label) e.label.el.classList.add('esp');
  };
}


// v5.3: despertar de armas, aura dorada del Armamento (nivel 50), transformación definitiva, torre infinita,
// volcán submarino (submarino de Volta), Archipiélago de los Dragones (criar y volar en dragón), eclipse,
// Ciudad de los Piratas Famosos y su torneo, escuela del hijo, tripulantes legendarios, mansión en las nubes,
// asalto en equipo al Titán Eterno, guerra de clanes por islas, trofeos de jefes y fotos de jefe automáticas.
import * as THREE from 'three';
import { makeIslet, populate } from './regions.js';
import { T } from './world.js';
import { ITEMS, EQUIP } from './items.js';
import { BUFFS } from './skills.js';
import { RECRUITABLE } from './social.js';
import { FAMOUS } from './life.js';
import { ZONES } from './more13.js';

BUFFS.transform = { name: '🌟 Transformación', atk: 2, def: 1.5 };
BUFFS.nubes = { name: '☁️ Descanso celeste', xp: 1.25, regen: 0.01 };

// ---------------------------------------------------------------- modelos
export function makeDragonModel(color = 0xc83a2a, belly = 0xe8c070) {
  const root = new THREE.Group(), body = new THREE.Group(), torso = new THREE.Group();
  root.add(body); body.add(torso);
  const mat = new THREE.MeshPhongMaterial({ color, shininess: 30 }); mat.userData.baseEmissive = new THREE.Color(0);
  const bm = new THREE.MeshPhongMaterial({ color: belly }); bm.userData.baseEmissive = new THREE.Color(0);
  const add = (geo, m, x, y, z, rx = 0, parent = torso) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.x = rx; o.castShadow = true; parent.add(o); return o; };
  add(new THREE.CapsuleGeometry(0.28, 0.7, 4, 10), mat, 0, 0.62, 0, Math.PI / 2).scale.set(1, 1, 1);
  add(new THREE.CapsuleGeometry(0.2, 0.5, 4, 8), bm, 0, 0.5, 0.05, Math.PI / 2);
  const head = new THREE.Group(); head.position.set(0, 0.95, 0.62); torso.add(head);
  add(new THREE.CapsuleGeometry(0.12, 0.3, 4, 8), mat, 0, 0.0, 0.1, Math.PI / 2.4, head);
  add(new THREE.BoxGeometry(0.18, 0.12, 0.28), mat, 0, 0.05, 0.3, 0, head);
  for (const s of [-1, 1]) { add(new THREE.ConeGeometry(0.04, 0.22, 5), bm, s * 0.08, 0.2, 0.12, -0.6, head); add(new THREE.SphereGeometry(0.03, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffe040 }), s * 0.08, 0.1, 0.38, 0, head); }
  const tail = new THREE.Group(); tail.position.set(0, 0.6, -0.55); torso.add(tail);
  add(new THREE.ConeGeometry(0.16, 0.9, 6), mat, 0, 0, -0.4, -Math.PI / 2, tail);
  const legs = [];
  for (const [x, z] of [[-0.22, 0.32], [0.22, 0.32], [-0.22, -0.3], [0.22, -0.3]]) { const lg = new THREE.Group(); lg.position.set(x, 0.42, z); torso.add(lg); add(new THREE.CapsuleGeometry(0.07, 0.25, 4, 6), mat, 0, -0.2, 0, 0, lg); legs.push(lg); }
  const wings = [];
  for (const s of [-1, 1]) { const w = new THREE.Group(); w.position.set(s * 0.25, 0.85, 0.05); torso.add(w); const m = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(s * 1.1, 0.3, -0.2), new THREE.Vector3(s * 0.9, -0.05, -0.7)]), new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide })); m.geometry.computeVertexNormals(); w.add(m); wings.push(w); }
  return { root, parts: { body, torso, head, legs, tail, wings }, mats: [mat, bm], kind: 'quad', height: 1.2 };
}
export function makeCrystalModel(color = 0x7af0ff) {
  const root = new THREE.Group(), body = new THREE.Group(), torso = new THREE.Group(); root.add(body); body.add(torso);
  const mat = new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.4, transparent: true, opacity: 0.85 }); mat.userData.baseEmissive = new THREE.Color(color).multiplyScalar(0.4);
  const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), mat); c.position.y = 1; c.scale.y = 1.6; torso.add(c);
  return { root, parts: { body, torso, flames: new THREE.Group() }, mats: [mat], kind: 'skull', height: 1.8 };
}

// ---------------------------------------------------------------- nuevas tierras (reutilizan las zonas de la expansión)
const NEWZ = {
  dragones: { id: 'dragones', name: 'Archipiélago de los Dragones', ox: 4700, oz: 0, N: 66, seed: 641, biome: 'volcano', lvl: 300, giver: 'ysolde', boss: 'dragon_ancestral', bg: 0x8a5a3a,
    enemies: ['dragon_salvaje', 'wyvern'], plan: 'abisal', gather: ['sangre_dragon', 8], reward2: ['huevo_dragon_real', 1], bossReward: 'nucleo_estelar', bossGold: 60000, plane: { color: 0x2a5a8a, transparent: true, opacity: 0.95 } },
  piratas: { id: 'piratas', name: 'Ciudad de los Piratas Famosos', ox: 4950, oz: 0, N: 60, seed: 677, biome: null, lvl: 150, giver: null, bg: 0x8fc6e8, enemies: [], plane: { color: 0x2a6a9a, transparent: true, opacity: 0.95 } },
};
Object.assign(ZONES, NEWZ);
export function makeNewLands() {
  const out = [];
  {
    const D = NEWZ.dragones, R = makeIslet({ ...D, dockDir: [-1, 0] });
    R.portal = true; R.zone = D.id;
    const { x: cx, z: cz } = R.center;
    R.towns.push({ name: 'Nido de Ysolde', x: cx, z: cz, r: 6 }); R.reserve(cx, cz, 7);
    R.props.push({ type: 'forge', x: cx + 3, z: cz + 3, rot: 0 }); R.block(cx + 3, cz + 3);
    R.npcs.push({ id: 'ysolde', name: 'Domadora de dragones Ysolde', x: cx, z: cz, wander: 1, look: { shirt: 0x8a3a1a, pants: 0x3a2a1a, armor: true, armorColor: 0xa84a2a, hair: 0xd8602a, longHair: true, skin: 0xe0aa80, female: true, spear: true, cape: 0x6a1a10 } });
    R.arrive = { x: cx - 2, z: cz + 1 };
    populate(R, 0.8);
    const { ox, oz, N } = R;
    R.spawns.push({ type: 'dragon_salvaje', count: 6, area: [ox + 8, oz + 8, ox + N - 9, cz - 8], lvl: [300, 350] });
    R.spawns.push({ type: 'wyvern', count: 6, area: [ox + 8, cz + 8, ox + N - 9, oz + N - 9], lvl: [310, 360] });
    R.spawns.push({ type: 'dragon_ancestral', count: 1, area: [cx + 12, cz - 1, cx + 14, cz + 1], lvl: [400, 400] });
    out.push(R);
  }
  {
    const D = NEWZ.piratas, R = makeIslet({ ...D, dockDir: [-1, 0] });
    R.portal = true; R.zone = D.id;
    const { x: cx, z: cz } = R.center;
    R.towns.push({ name: 'Puerto de las Leyendas', x: cx, z: cz, r: 12 }); R.reserve(cx, cz, 13);
    const house = (id, x0, z0, w, d, door, o) => { R.buildings.push({ id, x0, z0, w, d, door, wall: 0xe8d8b0, roof: 0xb05a3a, h: 1.6, ...o }); for (let z = z0; z < z0 + d; z++) for (let x = x0; x < x0 + w; x++) R.block(x, z); };
    house('leyendas_taberna', cx - 8, cz - 8, 5, 4, 's', { wall: 0xc8a878, roof: 0x8a2a2a, timber: true, sign: 0x2a2a2a });
    house('leyendas_1', cx + 4, cz - 8, 4, 3, 's', { wall: 0xe8dcc0, roof: 0x2a4a6a });
    house('leyendas_2', cx - 8, cz + 5, 4, 3, 'n', { wall: 0xd8ccb0, roof: 0x3a2a1a, timber: true });
    house('leyendas_3', cx + 4, cz + 5, 4, 3, 'n', { wall: 0xe0d4b8, roof: 0x6a1a1a });
    R.props.push({ type: 'well', x: cx, z: cz - 3, rot: 0 }); R.block(cx, cz - 3);
    R.npcs.push({ id: 'heraldo', name: 'Heraldo Bocanegra', x: cx, z: cz, wander: 1, look: { shirt: 0xe0b040, pants: 0x2a2a2a, coat: true, hat: 'tricorn', capColor: 0x1a1a1a, feather: 0xe03a3a, hair: 0x1a1a1a, beard: 0x1a1a1a, skin: 0xc68a5a } });
    FAMOUS.forEach((f, i) => { const a = (i / FAMOUS.length) * Math.PI * 2; R.npcs.push({ id: 'fam_' + f.id, name: `${f.name} «${f.ep}»`, x: Math.round(cx + Math.cos(a) * 6), z: Math.round(cz + Math.sin(a) * 6), wander: 2, look: f.look }); });
    R.arrive = { x: cx - 2, z: cz + 1 };
    populate(R, 0.6);
    out.push(R);
  }
  return out;
}
// torre infinita y volcán submarino (regiones cerradas)
const TX0 = 6000, TZ0 = 0, TW = 18, VX0 = 6200, VZ0 = 0, VW = 22, VD = 16;
export function makeInfTower() {
  const R = { kind: 'dungeon', id: 'torre', name: 'Torre Infinita', X: TX0, Z: TZ0, exit: { x: TX0 + 1, z: TZ0 + 9 }, spawns: [] };
  const inb = (x, z) => x >= 0 && z >= 0 && x < TW && z < TW;
  R.contains = (x, z) => x >= TX0 - 1 && x <= TX0 + TW && z >= TZ0 - 1 && z <= TZ0 + TW;
  R.tile = (x, z) => (inb(x - TX0, z - TZ0) ? T.STONE : T.WATER);
  R.walkable = (x, z) => inb(x - TX0, z - TZ0);
  R.setBlocked = () => {}; R.groundY = () => 0; R.areaName = () => 'Torre Infinita';
  return R;
}
export function makeVolcano() {
  const blocked = new Uint8Array(VW * VD);
  const inb = (lx, lz) => lx >= 0 && lz >= 0 && lx < VW && lz < VD;
  const R = { kind: 'dungeon', id: 'volcan_sub', name: 'Volcán Submarino', X: VX0, Z: VZ0, underwater: true, exit: { x: VX0 + 2, z: VZ0 + 8 }, spawns: [] };
  R.contains = (x, z) => x >= VX0 - 1 && x <= VX0 + VW && z >= VZ0 - 1 && z <= VZ0 + VD;
  R.tile = (x, z) => (inb(x - VX0, z - VZ0) ? T.ROCK : T.WATER);
  R.walkable = (x, z) => { const lx = x - VX0, lz = z - VZ0; return inb(lx, lz) && !blocked[lz * VW + lx]; };
  R.setBlocked = (x, z, v) => { const lx = x - VX0, lz = z - VZ0; if (inb(lx, lz)) blocked[lz * VW + lx] = v; };
  R.groundY = () => 0; R.areaName = () => 'Volcán Submarino';
  R.vents = [[7, 4], [12, 11], [16, 5], [10, 7]].map(([x, z]) => ({ x: VX0 + x, z: VZ0 + z }));
  for (const v of R.vents) blocked[(v.z - VZ0) * VW + (v.x - VX0)] = 1;
  R.chests = [[20, 2], [20, 13]].map(([x, z], i) => ({ id: 'volcan_' + i, x: VX0 + x, z: VZ0 + z, loot: { gold: 8000, potion: 2 } }));
  for (const c of R.chests) blocked[(c.z - VZ0) * VW + (c.x - VX0)] = 1;
  R.spawns.push({ type: 'pez_lava', count: 6, area: [VX0 + 4, VZ0 + 1, VX0 + 19, VZ0 + 14], lvl: [420, 470] });
  R.spawns.push({ type: 'leviatan_fuego', count: 1, area: [VX0 + 17, VZ0 + 7, VX0 + 18, VZ0 + 8], lvl: [480, 480] });
  return R;
}
const VOLCANO_SPOT = { x: 238, z: 140 };
const LEGENDS = [
  { id: 'seraphine', name: 'Seraphine, la Valquiria Celeste', zone: 'celeste', look: { armor: true, armorColor: 0xf4f4f8, trim: 0xffd040, hat: 'helmet', hatColor: 0xf4f4f8, plume: 0xffffff, wings: 0xffffff, sword: true, blade: 0xfff4c0, skin: 0xf3cfaa, hair: 0xf8e080, longHair: true, female: true } },
  { id: 'aldwin', name: 'Sir Aldwin del Pasado', zone: 'pasado', look: { armor: true, armorColor: 0xc8ccd8, trim: 0xd8b040, hat: 'helmet', hatColor: 0xc8ccd8, sword: true, shield: { type: 'tower', color: 0xc8ccd8, rim: 0xd8b040, boss: 0x1a1a2a }, skin: 0xe0aa80, beard: 0x8a6a4a } },
  { id: 'ignis', name: 'Ignis, Hijo del Abismo', zone: 'abismo', look: { armor: true, armorColor: 0x1a1012, trim: 0xc81a10, hat: 'horned', hatColor: 0x1a1012, hornColor: 0xff3a10, axe: true, blade: 0xff5a10, skin: 0x8a4a3a, eyeGlow: 0xff3a10, cape: 0x3a0a08 } },
];
const SCHOOL = { lucha: '⚔️ Escuela de lucha (+30% daño)', navegacion: '⛵ Escuela de navegación (+6% velocidad del barco)', vudu: '🧙 Escuela de vudú (cura a la tripulación)' };
const LEADERS_C = { marisol: 'Villarroca', nerea: 'Puerto Salitre', mara: 'Isla Tortuga', zaid: 'Oasis de Sal', ixa: 'Aldea Liana', lucas: 'Villa Grillete', dulcinea: 'Villa Merengue', volta: 'Ciudad Engranaje' };

export function installMore15(Game, D) {
  const P = Game.prototype;
  const sfx = D.sfx;
  const npcOf = (id) => (window.game ? window.game.npcById(id) : null);

  // ============================================================ despertar de armas
  P.applyAwaken = function (id) {
    const e = EQUIP[id]; if (!e || e.awakened) return;
    e.awakened = true; e.atk = Math.round((e.atk || 0) * 1.35); e.name += ' ✦';
    e.look = { ...e.look, bladeLen: (e.look.bladeLen || 0.5) * 1.12, blade: e.look.bladeGlow || e.look.blade };
    if (ITEMS[id]) { ITEMS[id].name = e.name; ITEMS[id].atk = e.atk; ITEMS[id].look = e.look; }
  };
  P.awakenMenu = function (opts) {
    const p = this.player, id = p.equip.weapon, e = EQUIP[id];
    if (!e || !e.set) return;
    if (e.awakened) return opts.push({ label: `✦ Tu ${e.name} ya está despertada`, action: null });
    opts.push({ label: `✨ Despertar ${e.name} (nivel 500, 3 núcleos estelares, 50000 oro)`, action: () => {
      if (p.level < 500) return this.toast('🔒 Necesitas nivel 500 para despertar armas');
      this.buy({ gold: 50000, nucleo_estelar: 3 }, () => { this.awakened = this.awakened || []; this.awakened.push(id); this.applyAwaken(id); p.recalc(); p.refreshLook(); this.toast(`✨ ¡Tu arma despierta! ${e.name}: +35% daño y habilidad propia (botón 🌟)`, 'area'); sfx('level'); });
    } });
  };
  P.awakenSkill = function () {
    const p = this.player, e = EQUIP[p.equip.weapon];
    if (!e || !e.awakened || p.dead || this.sailing) return;
    this.skillCd = this.skillCd || {};
    if ((this.skillCd.awk || 0) > 0) return;
    this.skillCd.awk = 12;
    const col = e.look.blade || 0xffd040;
    for (let i = 0; i < 3; i++) setTimeout(() => this.ring(p.x, p.z, 1.5 + i * 1.2, col), i * 120);
    this.camShake = 0.4;
    p.st.skill = { type: 'spin', t: 0, dur: 0.8 };
    for (const en of this.enemies) if (!en.dead && !en.removed && (!en.hostile || en.hostile()) && en.dist(p) < 4) this.hitEnemy(en, Math.round(p.atk * 5), true);
    this.ui.float(`🌟 ¡${e.name.replace(' ✦', '')} despierta!`, 'crit', p.x, 2.2, p.z);
    sfx('skill');
  };
  P.awakenBtn = function () {
    const bar = document.getElementById('skillBar'); if (!bar) return;
    const e = EQUIP[this.player.equip.weapon], want = !!(e && e.awakened);
    let b = bar.querySelector('.skb.awk');
    if (want && !b) { b = document.createElement('button'); b.className = 'skb awk'; b.innerHTML = '🌟<div class="cd"></div><small></small>'; b.addEventListener('pointerdown', (ev) => { ev.preventDefault(); ev.stopPropagation(); this.awakenSkill(); }); bar.appendChild(b); }
    else if (!want && b) b.remove();
    if (b && want) { const c = (this.skillCd && this.skillCd.awk) || 0; b.querySelector('.cd').style.height = c > 0 ? Math.round(c / 12 * 100) + '%' : '0%'; }
  };

  // ============================================================ aura dorada del Armamento (nivel 50)
  P.updateGoldAura = function (dt) {
    const p = this.player;
    if (!this.esp || this.esp.l < 50 || !(this.espT > 0)) return;
    const fx = p.model.espFx; if (fx && fx.glow) fx.glow.color.set(0xffd040);
    this.gaT = (this.gaT || 0) - dt;
    if (this.gaT > 0) return;
    this.gaT = 1.6;
    this.ring(p.x, p.z, 2.6, 0xffd040);
    for (const e of this.enemies) {
      if (e.dead || e.removed || (e.hostile && !e.hostile()) || e.dist(p) > 2.6 || (e.def && e.def.boss)) continue;
      const a = Math.atan2(e.x - p.x, e.z - p.z), nx = e.x + Math.sin(a) * 1.3, nz = e.z + Math.cos(a) * 1.3;
      if (this.W.walkable(Math.round(nx), Math.round(nz))) { e.x = nx; e.z = nz; e.path = []; }
      this.hitEnemy(e, Math.round(p.atk * 0.25), false);
    }
  };

  // ============================================================ transformación definitiva
  P.transform = function () {
    const p = this.player;
    if ((p.inv.nucleo_estelar || 0) < 5) return this.toast('🌟 Necesitas tener 5 núcleos estelares (gasta 1 por transformación)');
    if ((this.trCd || 0) > 0) return this.toast(`🌟 Podrás transformarte en ${Math.ceil(this.trCd)} s`);
    p.inv.nucleo_estelar--;
    this.trCd = 300; this.xfT = 30;
    this.addBuff('transform', 30);
    this.trBase = p.model.root.scale.x;
    p.model.root.scale.setScalar(this.trBase * 1.5);
    p.model.root.traverse((k) => { if (k.isMesh && k.material && k.material.emissive && k.userData.trOrig === undefined) { k.userData.trOrig = k.material.emissive.getHex(); k.material = k.material.clone(); k.material.emissive.set(0x6a5010); } });
    for (let i = 0; i < 5; i++) setTimeout(() => this.ring(p.x, p.z, 1 + i * 0.8, 0xffd040), i * 100);
    this.camShake = 0.6;
    this.toast('🌟 ¡TRANSFORMACIÓN DEFINITIVA! Daño ×2 y defensa ×1,5 durante 30 s', 'area');
    sfx('level');
  };
  P.updateTransform = function (dt) {
    if (this.trCd > 0) this.trCd -= dt;
    if (!(this.xfT > 0)) return;
    if (this.player.model.root.scale.x < (this.trBase || 1) * 1.4) this.player.model.root.scale.setScalar((this.trBase || 1) * 1.5);
    this.xfT -= dt;
    if (Math.random() < dt * 4) { const p = this.player; this.ring(p.x + (Math.random() - 0.5), p.z + (Math.random() - 0.5), 0.5, 0xffd040); }
    if (this.xfT <= 0) { const r = this.player.model.root; r.scale.setScalar(this.trBase || 1); r.traverse((k) => { if (k.isMesh && k.userData.trOrig !== undefined) { k.material.emissive.setHex(k.userData.trOrig); delete k.userData.trOrig; } }); this.player.refreshLook(); this.toast('🌟 La transformación termina'); }
  };

  // ============================================================ torre infinita
  const TOWER_POOL = ['caballero_celeste', 'caballero_antiguo', 'caballero_infernal', 'bruja_pantano', 'druida_esporas', 'marinero_fantasma', 'caballero_vacio', 'devorador_estelar', 'hidra_pantano', 'centinela_vacio'];
  P.enterTower = function () {
    const p = this.player;
    if (p.level < 450) return this.toast('🔒 La Torre Infinita se abre a nivel 450');
    this.towerReturn = { x: p.x, z: p.z };
    this.buildTowerFx();
    p.x = this.infTower.exit.x + 1; p.z = this.infTower.exit.z; p.path = [];
    for (const n of this.following()) this.placeNear(n, Math.round(p.x), Math.round(p.z));
    this.camTarget.set(p.x, 0, p.z);
    this.tw = { floor: 0, temps: [], next: true };
    this.toast(`🗼 Torre Infinita · récord: piso ${this.stats.towerBest || 0}. Pulsa «Subir» en el centro para empezar`, 'area');
  };
  P.buildTowerFx = function () {
    if (this.towerFx) return; this.towerFx = true;
    const g = new THREE.Group(), M = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
    const fl = new THREE.Mesh(new THREE.CylinderGeometry(12.5, 12.5, 0.3, 32), M(0x3a3448, { map: this.M.tx.stone })); fl.position.set(TX0 + 8.5, -0.15, TZ0 + 8.5); g.add(fl);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; const c = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 6, 10), M(0x5a5468)); c.position.set(TX0 + 8.5 + Math.cos(a) * 12, 3, TZ0 + 8.5 + Math.sin(a) * 12); g.add(c); const t = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), new THREE.MeshBasicMaterial({ color: 0x8ad8ff })); t.position.set(c.position.x, 6.3, c.position.z); g.add(t); }
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.4, 16), M(0x8ad8ff, { emissive: 0x2a5a8a })); st.position.set(TX0 + 8.5, 0.2, TZ0 + 8.5); g.add(st);
    this.scene.add(g);
  };
  P.inTower = function () { const r = this.W.regionAt(this.player.x, this.player.z); return r && r.id === 'torre'; };
  P.towerUp = function () {
    const W = this.tw; if (!W) return;
    if (W.temps.some((e) => !e.dead && !e.removed)) return this.toast('Derrota a todos los enemigos del piso');
    W.floor++;
    const f = W.floor, lvl = 480 + f * 3, n = 3 + (f % 5), p = this.player;
    W.temps = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const x = Math.round(TX0 + 8.5 + Math.cos(a) * 6), z = Math.round(TZ0 + 8.5 + Math.sin(a) * 6); const type = f % 10 === 0 && i === 0 ? ['nihil', 'almirante_muerto', 'micelio_rey', 'reina_cienaga'][(f / 10) % 4] : TOWER_POOL[(f + i) % TOWER_POOL.length]; const e = this.spawnTemp(type, x, z, lvl); if (f % 10 === 0 && i === 0) { e.maxHp = Math.round(e.maxHp * 0.3); e.hp = e.maxHp; } e.provoked = true; e.state = 'chase'; W.temps.push(e); }
    if (f > (this.stats.towerBest || 0)) this.stats.towerBest = f;
    if (f > 1 && (f - 1) % 10 === 0) { const k = (f - 1) / 10; p.gold += 20000 * k; this.give('nucleo_estelar', k); if (k >= 5 && !this.ownCos('c_corona_torre')) this.give('c_corona_torre'); this.toast(`🏆 ¡Piso ${f - 1} superado! +${20000 * k} oro y ${k} núcleo${k > 1 ? 's' : ''} estelar${k > 1 ? 'es' : ''}`, 'area'); sfx('quest'); }
    this.toast(`🗼 Piso ${f}${f % 10 === 0 ? ' · ¡GUARDIÁN!' : ''} (Nv. ${lvl})`, 'area');
  };
  P.leaveTower = function () {
    const W = this.tw; if (W) for (const e of W.temps) if (!e.removed) e.remove();
    this.tw = null; this.purgeTemps();
    const p = this.player, r = this.towerReturn || { x: 50, z: 52 };
    p.x = r.x; p.z = r.z; p.path = []; for (const n of this.following()) this.placeNear(n, Math.round(p.x), Math.round(p.z)); this.camTarget.set(p.x, 0, p.z);
  };
  P.updateTower = function () {
    if (!this.tw) return;
    if (this.player.dead) { this.toast(`🗼 Caes en el piso ${this.tw.floor}`); this.leaveTower(); return; }
    if (this.inTower()) { this.scene.background.set(0x1a1428); }
  };

  // ============================================================ volcán submarino
  P.sailAction15 = function () {
    if (this.deck) return null;
    const b = this.boat;
    if (Math.hypot(b.x - VOLCANO_SPOT.x, b.z - VOLCANO_SPOT.z) < 9) return { icon: '🌋', label: 'Submarino', fn: () => this.diveVolcano() };
    return null;
  };
  P.diveVolcano = function () {
    if (!this.flags.submarine) return this.toast('Necesitas el submarino de la Inventora Volta');
    const p = this.player, b = this.boat;
    this.diveFrom = { x: b.x, z: b.z, h: b.heading };
    this.deck = null; this.autoHelm = null; b.speed = 0; this.sailing = false;
    this.scene.add(p.model.root); p.model.root.rotation.set(0, 0, 0);
    p.x = this.volcano.exit.x + 1; p.z = this.volcano.exit.z; p.path = [];
    this.unboardCrew(p.x, p.z); this.camTarget.set(p.x, 0, p.z);
    this.oxy = 100;
    this.buildVolcano();
    for (const c of this.volcano.chests) if (this.flags[c.id] && this.flags[c.id + '_day'] !== this.day) this.flags[c.id] = false;
    this.toast('🌋 El submarino baja al Volcán Submarino: chimeneas de lava, peces de fuego... y algo enorme', 'area');
  };
  P.inVolcano = function () { const r = this.W.regionAt(this.player.x, this.player.z); return r && r.id === 'volcan_sub'; };
  P.buildVolcano = function () {
    if (this.volcanoBuilt) return; this.volcanoBuilt = true;
    const R = this.volcano, g = new THREE.Group(), M = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
    const fl = new THREE.Mesh(new THREE.BoxGeometry(VW + 6, 0.2, VD + 6), M(0x2a2020)); fl.position.set(VX0 + VW / 2, -0.1, VZ0 + VD / 2); g.add(fl);
    for (const v of R.vents) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.6, 8, 1, true), M(0x3a2a2a)); c.position.set(v.x, 0.8, v.z); g.add(c); const l = new THREE.Mesh(new THREE.CircleGeometry(0.45, 12), new THREE.MeshBasicMaterial({ color: 0xff5010 })); l.rotation.x = -Math.PI / 2; l.position.set(v.x, 1.55, v.z); g.add(l); }
    for (const c of R.chests) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.55), M(0xff8a1a, { emissive: 0x6a2a00 })); b.position.set(c.x, 0.25, c.z); g.add(b); this.chests.push(c); }
    const sub = new THREE.Mesh(new THREE.CapsuleGeometry(0.6, 1.8, 4, 10), M(0xd8a838)); sub.rotation.z = Math.PI / 2; sub.position.set(R.exit.x, 0.7, R.exit.z); g.add(sub);
    this.scene.add(g);
  };
  P.updateVolcano = function () { if (this.inVolcano()) { this.oxy = 100; } };

  // ============================================================ criar dragones
  P.dragonStage = function () { const D2 = this.myDragon; if (!D2) return -1; return Math.min(3, Math.floor((this.day - D2.born) / 2)); };
  P.updateDragon = function () {
    const p = this.player;
    if (!this.myDragon && p.inv.huevo_dragon_real > 0) { p.inv.huevo_dragon_real--; this.myDragon = { born: this.day }; this.toast('🥚 ¡Tienes un huevo de dragón real! Eclosionará en 2 días y crecerá hasta poder montarlo', 'area'); }
    const st = this.dragonStage();
    if (st === 3 && !(this.ownMounts || []).includes('dragon_real')) { this.ownMounts = this.ownMounts || []; this.ownMounts.push('dragon_real'); this.mountSel = 'dragon_real'; this.toast('🐉 ¡Tu dragón es adulto! Móntalo (🐴) y usa ⚡ Atajos › Volar para viajar a cualquier lugar', 'area'); sfx('level'); }
    if (st !== this.dragonLast) { if (this.dragonLast !== undefined && st >= 1 && st < 3) this.toast(['', '🐣 ¡Tu dragón ha nacido!', '🐲 Tu dragón crece: ya es joven'][st]); this.dragonLast = st; }
  };
  P.flyMenu = function () {
    if (this.mounted !== 'dragon_real') return this.toast(this.dragonStage() === 3 ? '🐉 Monta en tu dragón para volar' : '🐉 Necesitas un dragón adulto (Archipiélago de los Dragones)');
    const opts = this.docks.map((d) => ({ label: `🐉 ${d.name}`, action: () => { const p = this.player; this.toggleMount(); p.x = d.land.x; p.z = d.land.z; p.path = []; for (const n of this.following()) this.placeNear(n, Math.round(p.x), Math.round(p.z)); this.camTarget.set(p.x, 0, p.z); this.toggleMount('dragon_real'); this.toast(`🐉 Vuelas hasta ${d.name}`, 'area'); } }));
    opts.push({ label: 'Cancelar', action: null });
    this.ui.openDialog('🐉 Volar en dragón', '¿A dónde quieres volar? (gratis)', opts);
  };

  // ============================================================ eclipse
  P.updateEclipse = function (dt) {
    let ov = document.getElementById('eclipseFx');
    if (!ov) { ov = document.createElement('div'); ov.id = 'eclipseFx'; ov.style.cssText = 'position:fixed;inset:0;pointer-events:none;background:radial-gradient(circle,rgba(120,0,30,0.12),rgba(60,0,20,0.45));z-index:5;display:none'; document.body.appendChild(ov); }
    const on = !!this.eclipse && !this.roomAt(this.player.x, this.player.z);
    if (ov._on !== on) { ov._on = on; ov.style.display = on ? 'block' : 'none'; }
    if (this.net.isClient && this.net.active) return;
    if (this.eclipse) {
      this.eclipse -= dt;
      if (!this.roomAt(this.player.x, this.player.z)) this.scene.background.lerp(new THREE.Color(0x3a0a10), 0.85);
      if (this.eclipse <= 0) { this.eclipse = 0; this.toast('🌞 El eclipse termina'); }
      return;
    }
    this.ecT = (this.ecT ?? 1500) - dt;
    if (this.ecT <= 0 && this.started) { this.ecT = 1800 + Math.random() * 1200; this.eclipse = 240; this.toast('🌑 ¡ECLIPSE! Los enemigos se vuelven más fuertes, pero sueltan fragmentos de eclipse', 'area'); this.net.sendX({ k: 'toast', msg: '🌑 ¡ECLIPSE!' }); sfx('hurt'); }
  };
  const baseHit = P.hitTarget;
  P.hitTarget = function (p, e, atk) { return baseHit.call(this, p, e, this.eclipse ? atk * 1.3 : atk); };

  // ============================================================ torneo de los piratas famosos
  P.famTourney = function () {
    if (this.legT) return;
    if (this.stats.famTDay === this.day) return this.toast('El torneo de leyendas ya se celebró hoy');
    this.stats.famTDay = this.day;
    this.legT = { round: 0, list: FAMOUS.slice(0, 5).map((f) => 'fam_' + f.id) };
    this.toast('🏆 ¡Torneo de las Leyendas! 5 duelos seguidos contra los piratas más famosos', 'area');
    this.famNext();
  };
  P.famNext = function () {
    const F = this.legT, id = F.list[F.round], n = this.npcById(id);
    if (!n) { this.legT = null; return; }
    n.setStats(Math.min(500, this.player.level + F.round));
    setTimeout(() => this.startFight(n, 'duel'), 600);
  };
  const baseEnd = P.endFight;
  P.endFight = function (n, result) {
    const F = this.legT, mine = F && n && n.id === F.list[F.round] && n.fight;
    const r = baseEnd.call(this, n, result);
    if (mine) {
      if (result === 'win') {
        F.round++;
        if (F.round >= F.list.length) { this.legT = null; this.player.gold += 50000; if (!this.ownCos('c_corona_leyendas')) this.give('c_corona_leyendas'); this.stats.famTours = (this.stats.famTours || 0) + 1; this.toast('👑 ¡Has ganado el Torneo de las Leyendas! +50000 oro y la Corona de las Leyendas', 'area'); sfx('quest'); }
        else { this.toast(`🏆 Ronda ${F.round}/5 superada`); this.famNext(); }
      } else { this.legT = null; this.toast('🏆 Has caído en el Torneo de las Leyendas'); }
    }
    return r;
  };

  // ============================================================ escuela del hijo y tripulantes legendarios
  const baseClass = P.crewClass;
  P.crewClass = function (n) { if (n.id === 'hijo') { const s = this.soc('hijo').school; if (s === 'vudu') return 'heal'; if (s === 'lucha') return 'sword'; } return baseClass.call(this, n); };
  const baseMul = P.crewDmgMul;
  P.crewDmgMul = function (n) { let m = baseMul.call(this, n); if (n.id === 'hijo' && this.soc('hijo').school === 'lucha') m *= 1.3; if (LEGENDS.some((L) => L.id === n.id)) m *= 1.5; return m; };
  const baseShip = P.shipStats;
  P.shipStats = function () { const s = baseShip.call(this); if (this.soc('hijo').crew && this.soc('hijo').school === 'navegacion') s.speed *= 1.06; return s; };
  P.spawnLegends = function () {
    if (this.legendsSpawned) return; this.legendsSpawned = true;
    for (const L of LEGENDS) {
      const R = this.islets.find((r) => r.id === L.zone); if (!R || this.npcById(L.id)) continue;
      const n = new D.NPC(this, { id: L.id, name: L.name, x: R.arrive.x + 4, z: R.arrive.z + 3, wander: 1, look: L.look });
      n.baseLevel = 400; n.setStats(this.soc(L.id).lvl || 400);
      this.placeNear(n, R.arrive.x + 4, R.arrive.z + 3);
      this.npcs.push(n);
      if (this.soc(L.id).legendOk) RECRUITABLE.add(L.id);
    }
  };

  // ============================================================ mansión en las nubes y trofeos
  P.cloudSpot = function () { const R = this.islets.find((r) => r.id === 'celeste'); return R ? { x: R.center.x + 7, z: R.center.z + 6 } : null; };
  P.cloudMenu = function () {
    if (!this.flags.cloudHouse) return this.ui.openDialog('🏰 Mansión en las nubes', 'Una mansión de mármol sobre las nubes. Dormir aquí da un descanso celeste (+25% experiencia y regeneración) y en sus salas se exponen tus trofeos.', [{ label: '🏰 Comprar (100000 oro)', action: () => this.buy({ gold: 100000 }, () => { this.flags.cloudHouse = true; this.buildCloudHouse(); this.toast('🏰 ¡La mansión en las nubes es tuya!', 'area'); sfx('quest'); }) }, { label: 'Ahora no', action: null }]);
    this.ui.openDialog('🏰 Tu mansión en las nubes', `Trofeos expuestos: ${Object.keys(this.trophies || {}).length}.`, [
      { label: '😴 Dormir (descanso celeste)', action: () => { this.sleepHere(); this.addBuff('nubes', 900); } },
      { label: '🏆 Ver trofeos', action: () => this.trophyList() },
      { label: 'Cerrar', action: null },
    ]);
  };
  P.buildCloudHouse = function () {
    const s = this.cloudSpot(); if (!s || !this.flags.cloudHouse) return;
    if (this.cloudG) this.scene.remove(this.cloudG);
    const g = new THREE.Group(), M = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
    const b = new THREE.Mesh(new THREE.BoxGeometry(4, 2.4, 3), M(0xf8f4ec)); b.position.set(s.x + 2, 1.2, s.z - 2); g.add(b);
    const r = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.6, 4), M(0x5a8ad8)); r.rotation.y = Math.PI / 4; r.position.set(s.x + 2, 3.2, s.z - 2); g.add(r);
    for (const dx of [0.2, 3.8]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 2.4, 10), M(0xffffff)); c.position.set(s.x + dx, 1.2, s.z - 0.4); g.add(c); }
    Object.keys(this.trophies || {}).forEach((t, i) => { const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.8, 8), M(0xd8d0c0)); const x = s.x - 1 - (i % 6) * 0.9, z = s.z + 1 + Math.floor(i / 6) * 0.9; ped.position.set(x, 0.4, z); g.add(ped); const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.18), new THREE.MeshBasicMaterial({ color: [0xffd040, 0xff5a5a, 0x7af0ff, 0xb03aff][i % 4] })); gem.position.set(x, 1, z); g.add(gem); });
    this.scene.add(g); this.cloudG = g;
  };
  P.trophyList = function () {
    const T2 = Object.entries(this.trophies || {});
    this.ui.openDialog('🏆 Trofeos de jefes', T2.length ? T2.map(([k, d]) => `🏆 ${(this.ENEMY_DEF[k] || {}).name || k} · día ${d}`).join('<br>') : 'Aún no has vencido a ningún jefe.', [{ label: 'Cerrar', action: null }]);
  };
  P.bossPhoto = function (e) {
    try {
      const R = this.renderer; R.render(this.scene, this.camera);
      const src = R.domElement, W = 320, H = Math.round(320 * src.height / src.width);
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d'); x.drawImage(src, 0, 0, W, H);
      x.lineWidth = 10; x.strokeStyle = '#d8a838'; x.strokeRect(5, 5, W - 10, H - 10);
      x.fillStyle = 'rgba(0,0,0,0.6)'; x.fillRect(0, H - 34, W, 34); x.fillStyle = '#ffe080'; x.font = 'bold 15px Georgia'; x.textAlign = 'center'; x.fillText(`¡${e.def.name} derrotado!`, W / 2, H - 12);
      const url = c.toDataURL('image/jpeg', 0.7);
      let album = []; try { album = JSON.parse(localStorage.getItem('bruma_album') || '[]'); } catch (er) { album = []; }
      album.unshift({ boss: e.def.name, day: this.day, url }); album = album.slice(0, 12);
      try { localStorage.setItem('bruma_album', JSON.stringify(album)); } catch (er) { /* sin espacio */ }
      if (window.AndroidBridge && window.AndroidBridge.saveImage) window.AndroidBridge.saveImage(url.split(',')[1], `bruma_jefe_${Date.now()}.jpg`);
      this.toast('📸 Foto épica guardada en tu álbum');
    } catch (er) { /* sin foto */ }
  };
  P.albumHtml = function () {
    let album = []; try { album = JSON.parse(localStorage.getItem('bruma_album') || '[]'); } catch (er) { album = []; }
    return album.length ? `<div style="display:flex;flex-wrap:wrap;gap:6px">${album.map((a) => `<img src="${a.url}" title="${a.boss}" style="width:140px;border-radius:6px">`).join('')}</div>` : '<p class="muted">Vence a un jefe para tu primera foto épica.</p>';
  };

  // ============================================================ asalto en equipo: el Titán Eterno
  P.startRaid = function () {
    if (this.raid5) return this.toast('El asalto ya está en marcha');
    if (this.player.level < 400) return this.toast('🔒 El asalto al Titán Eterno es para nivel 400 o más');
    const p = this.player, players = 1 + (this.net.active ? this.net.remotes.size : 0);
    p.x = 50; p.z = 30; p.path = []; this.camTarget.set(50, 0, 30);
    const e = this.spawnTemp('titan_eterno', 50, 22, 500);
    e.provoked = true; e.state = 'chase';
    this.raid5 = { e, shieldT: 15, crystals: [] };
    const msg = `⚔️ ¡ASALTO! El Titán Eterno despierta al norte de Villarroca (${players} jugador${players > 1 ? 'es' : ''})`;
    this.toast(msg, 'area'); this.net.sendX({ k: 'toast', msg });
    sfx('hurt');
  };
  P.updateRaid5 = function (dt) {
    const R = this.raid5; if (!R) return;
    const e = R.e;
    if (e.dead || e.removed) {
      this.raid5 = null; for (const c of R.crystals) if (!c.removed) c.remove();
      if (e.dead) { this.raidReward(); this.net.sendX({ k: 'raid5Win' }); }
      return;
    }
    if (this.player.dead && !(this.net.active && this.net.remotes.size)) { e.remove(); this.raid5 = null; return this.toast('⚔️ El asalto ha fracasado'); }
    if (!R.shield) {
      R.shieldT -= dt;
      if (R.shieldT <= 0) {
        R.shield = true; R.crystals = [];
        for (const [dx, dz] of [[-6, 3], [6, 3]]) { const c = this.spawnTemp('cristal_escudo', Math.round(e.x + dx), Math.round(e.z + dz), 500); R.crystals.push(c); }
        this.toast('🛡 ¡El Titán se protege con un escudo! Rompe los dos cristales a la vez', 'area');
        this.ring(e.x, e.z, 3, 0x8ad8ff);
      }
    } else if (R.crystals.every((c) => c.dead || c.removed)) { R.shield = false; R.shieldT = 18; this.toast('💥 ¡Escudo roto! ¡Ataca al Titán!'); e.stunT = 4; }
  };
  const baseDmg = P.damageEnemy;
  P.damageEnemy = function (e, dmg, crit, byCrew, killerId = 0) {
    if (this.raid5 && e === this.raid5.e && this.raid5.shield) { this.ui.float('🛡 Escudo', 'info', e.x, e.model.height + 0.5, e.z); return; }
    if (this.eclipse) dmg = Math.round(dmg * 0.8);
    const was = !e.dead;
    const r = baseDmg.call(this, e, dmg, crit, byCrew, killerId);
    if (was && e.dead && e.def) {
      if (this.eclipse && Math.random() < 0.4) this.give('fragmento_eclipse', 1, e.x, e.z);
      if (e.def.boss && !['cristal_escudo'].includes(e.type)) {
        this.trophies = this.trophies || {};
        if (!this.trophies[e.type]) { this.trophies[e.type] = this.day; this.toast(`🏆 Nuevo trofeo: ${e.def.name}`); if (this.flags.cloudHouse) this.buildCloudHouse(); }
        setTimeout(() => this.bossPhoto(e), 700);
      }
    }
    return r;
  };
  P.raidReward = function () { const p = this.player; p.gold += 100000; this.give('nucleo_estelar', 3); if (!this.ownCos('c_capa_titan')) this.give('c_capa_titan'); this.stats.raids = (this.stats.raids || 0) + 1; this.toast('🏆 ¡El Titán Eterno ha caído! +100000 oro, 3 núcleos estelares y la Capa del Titán', 'area'); sfx('quest'); };
  const baseNet = P.onNetX4;
  P.onNetX4 = function (from, m) {
    if (m.k === 'raid5Win') { this.raidReward(); return true; }
    if (m.k === 'clanIsle') { this.clanIsles = this.clanIsles || {}; this.clanIsles[m.isle] = m.clan; this.toast(`🏴 El clan «${m.clan}» ha conquistado ${m.isle}`, 'area'); return true; }
    return baseNet ? baseNet.call(this, from, m) : false;
  };

  // ============================================================ guerra de clanes por islas
  P.clanIsleOpt = function (id, opts) {
    const isle = LEADERS_C[id]; if (!isle || !this.clan) return;
    this.clanIsles = this.clanIsles || {};
    const owner = this.clanIsles[isle];
    if (owner === this.clan.name) { const days = this.day - (this.flags['ct_' + isle] ?? this.day); opts.push({ label: `🏴 Cobrar tributo del clan (${days * 500} oro)`, action: () => { this.player.gold += days * 500; this.flags['ct_' + isle] = this.day; sfx('coin'); } }); return; }
    opts.push({ label: `🏴 Reclamar ${isle} para «${this.clan.name}»${owner ? ` (ahora es de «${owner}»)` : ''} (10000 oro)`, action: () => this.buy({ gold: 10000 }, () => this.clanClaim(isle)) });
  };
  P.clanClaim = function (isle) {
    const p = this.player, temps = [];
    for (let i = 0; i < 5; i++) for (let k = 0; k < 20; k++) { const x = p.tx + Math.round((Math.random() - 0.5) * 10), z = p.tz + Math.round((Math.random() - 0.5) * 10); if (this.W.walkable(x, z) && Math.hypot(x - p.x, z - p.z) > 3) { const e = this.spawnTemp('pirate', x, z, Math.max(10, p.level)); e.provoked = true; e.state = 'chase'; e.label.nm.textContent = `Defensor de ${isle} · Nv. ${e.level}`; temps.push(e); break; } }
    this.clanFight = { isle, temps };
    this.toast(`⚔️ ¡Los defensores de ${isle} se oponen! Derrótalos`, 'area');
  };
  P.updateClanFight = function () {
    const F = this.clanFight; if (!F) return;
    if (this.player.dead) { for (const e of F.temps) if (!e.removed) e.remove(); this.clanFight = null; return; }
    if (!F.temps.every((e) => e.dead || e.removed)) return;
    this.clanFight = null;
    this.clanIsles = this.clanIsles || {}; this.clanIsles[F.isle] = this.clan.name; this.flags['ct_' + F.isle] = this.day;
    this.net.sendX({ k: 'clanIsle', isle: F.isle, clan: this.clan.name });
    this.toast(`🏴 ¡${F.isle} pertenece ahora al clan «${this.clan.name}»! Cobra 500 oro al día`, 'area');
    sfx('quest');
  };

  // ============================================================ enganches
  P.npcDialog15 = function (id, opts) {
    if (id === 'oraculo') {
      opts.push({ label: `🗼 Torre Infinita (Nv. 450, récord piso ${this.stats.towerBest || 0})`, action: () => this.enterTower() });
      opts.push({ label: '⚔️ Asalto: Titán Eterno (Nv. 400, mejor de 2 a 4 jugadores)', action: () => this.startRaid() });
      this.awakenMenu(opts);
      const fr = this.player.inv.fragmento_eclipse || 0;
      opts.push({ label: `🌑 Cambiar 15 fragmentos de eclipse por 1 núcleo estelar (tienes ${fr})`, action: () => this.buy({ fragmento_eclipse: 15 }, () => this.give('nucleo_estelar', 1)) });
      if (!this.ownCos('c_capa_eclipse')) opts.push({ label: '🌑 Capa del Eclipse (10 fragmentos)', action: () => this.buy({ fragmento_eclipse: 10 }, () => this.give('c_capa_eclipse')) });
    }
    if (id === 'volta' && !this.flags.submarine) opts.push({ label: '🚢 Submarino para el Volcán Submarino (30000 oro, nivel 400)', action: () => { if (this.player.level < 400) return this.toast('🔒 Nivel 400'); this.buy({ gold: 30000 }, () => { this.flags.submarine = true; this.toast('🚢 ¡Submarino listo! Navega al este de Isla Ceniza y pulsa «Submarino»', 'area'); }); } });
    if (id === 'ysolde') { if (!this.myDragon && !(this.player.inv.huevo_dragon_real > 0)) opts.push({ label: '🥚 Comprar un huevo de dragón real (80000 oro)', action: () => this.buy({ gold: 80000 }, () => this.give('huevo_dragon_real', 1)) }); if (this.myDragon) opts.push({ label: `🐉 Tu dragón: ${['huevo', 'cría', 'joven', 'adulto'][this.dragonStage()]}`, action: null }); }
    if (id === 'heraldo') { opts.push({ label: '🏆 Torneo de las Leyendas (5 duelos, 1 al día)', action: () => this.famTourney() }); return 'Bienvenido al Puerto de las Leyendas. Aquí descansan los piratas más famosos del mar... ¿te atreves a retarlos?'; }
    if (id.startsWith('fam_')) { const f = FAMOUS.find((k) => 'fam_' + k.id === id); return f ? `En esta ciudad no hay recompensas ni Marina. Soy ${f.name}, y aquí solo bebemos y contamos historias.` : null; }
    const L = LEGENDS.find((k) => k.id === id);
    if (L) {
      const s = this.soc(id);
      if (!s.legendOk) { opts.push({ label: '⚔️ Aceptar su prueba (duelo)', action: () => { const n = this.npcById(id); n.setStats(Math.max(400, this.player.level)); this.legendDuel = id; this.startFight(n, 'duel'); } }); return 'Solo seguiré a quien me venza en combate.'; }
      return 'Me ganaste con honor. Si me lo pides, me uniré a tu tripulación.';
    }
    if (id === 'hijo' && this.child) { const s = this.soc('hijo'); if (!s.school && this.npcById('hijo').level >= 5) for (const [k, label] of Object.entries(SCHOOL)) opts.push({ label, action: () => { s.school = k; this.toast(`🎓 ${this.child.name} va a la ${label.slice(3)}`); if (this.crewMemory) this.crewMemory(this.npcById('hijo'), `Empecé la ${label.slice(3)}.`); } }); else if (s.school) opts.push({ label: `🎓 ${SCHOOL[s.school]}`, action: null }); }
    this.clanIsleOpt(id, opts);
    return null;
  };
  const baseEnd2 = P.endFight;
  P.endFight = function (n, result) {
    const L = this.legendDuel === (n && n.id) && n.fight;
    const r = baseEnd2.call(this, n, result);
    if (L) { this.legendDuel = null; if (result === 'win') { const s = this.soc(n.id); s.legendOk = true; s.f = Math.max(s.f || 0, 80); s.lvl = n.level; RECRUITABLE.add(n.id); this.toast(`⭐ ¡Has superado la prueba de ${n.name}! Ya puede unirse a tu tripulación (+50% daño)`, 'area'); sfx('quest'); } }
    return r;
  };
  P.contextAction15 = function () {
    if (this.sailing) return null;
    const p = this.player;
    if (this.inVolcano() && Math.hypot(p.x - this.volcano.exit.x, p.z - this.volcano.exit.z) < 1.8) return { icon: '🚢', label: 'Subir', fn: () => this.surface() };
    if (this.inTower()) {
      if (Math.hypot(p.x - (TX0 + 8.5), p.z - (TZ0 + 8.5)) < 1.8) return { icon: '⬆️', label: 'Subir', fn: () => this.towerUp() };
      if (Math.hypot(p.x - this.infTower.exit.x, p.z - this.infTower.exit.z) < 1.8) return { icon: '🚪', label: 'Salir', fn: () => this.leaveTower() };
    }
    const cs = this.cloudSpot(); if (cs && Math.hypot(p.x - cs.x, p.z - cs.z) < 2) return { icon: '🏰', label: 'Mansión', fn: () => this.cloudMenu() };
    return null;
  };
  P.updateMore15 = function (dt) {
    this.spawnLegends();
    if (!this.awakenApplied) { this.awakenApplied = true; for (const id of this.awakened || []) this.applyAwaken(id); if ((this.awakened || []).length) { this.player.recalc(); this.player.refreshLook(); } if (this.flags.cloudHouse) this.buildCloudHouse(); }
    this.updateGoldAura(dt); this.updateTransform(dt); this.updateTower(); this.updateVolcano(); this.updateEclipse(dt); this.updateRaid5(dt); this.updateClanFight(); this.awakenBtn();
    this.m15T = (this.m15T || 0) - dt; if (this.m15T <= 0) { this.m15T = 1; this.updateDragon(); }
  };
  P.newsHtml15 = function () {
    return `<div class="sub">🆕 v5.3</div><ul class="qlist">
      <li>✨ Armas despertadas: ${(this.awakened || []).length} · 🌟 Transformación (5 núcleos) · 🗼 Torre: piso ${this.stats.towerBest || 0}</li>
      <li>🐉 Tu dragón: ${this.myDragon ? ['huevo', 'cría', 'joven', 'adulto'][this.dragonStage()] : 'ninguno (Archipiélago de los Dragones)'} · 🌑 Eclipse ${this.eclipse ? '<b>¡AHORA!</b>' : 'a veces'}</li>
      <li>🏆 Trofeos: ${Object.keys(this.trophies || {}).length} · 🏰 Mansión en las nubes: ${this.flags.cloudHouse ? 'sí' : 'no'}${this.clanIsles ? ` · 🏴 Islas de clan: ${Object.entries(this.clanIsles).map(([i, c]) => `${i} (${c})`).join(', ')}` : ''}</li></ul>
      <div class="sub">📸 Álbum de jefes</div>${this.albumHtml()}`;
  };
}
export { VOLCANO_SPOT };

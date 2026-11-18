// Construcción: estructuras de 2×2 casillas (4) con materiales, que defienden y que los asaltantes pueden destruir.
// Defensas de pueblo: das materiales al líder del pueblo y se levantan torres y cañones.
import * as THREE from 'three';
import { box, cyl, mat } from './props.js';

export const STRUCTS = {
  empalizada: { name: 'Empalizada', icon: '🪵', cost: { wood: 8 }, hp: 160, desc: 'Muro de troncos que bloquea el paso.' },
  muro: { name: 'Muro de piedra', icon: '🧱', cost: { stone: 10, wood: 2 }, hp: 420, desc: 'Muro resistente.' },
  torre: { name: 'Torre de vigía', icon: '🗼', cost: { wood: 14, stone: 6 }, hp: 300, shoot: { r: 7, cd: 1.6, k: 1 }, desc: 'Dispara flechas a los enemigos cercanos.' },
  canon: { name: 'Cañón defensivo', icon: '💣', cost: { iron: 6, stone: 8, polvora: 2 }, hp: 360, shoot: { r: 9, cd: 3.2, k: 2.4, ball: true }, desc: 'Cañonazo con daño en área.' },
  fogata: { name: 'Fogata', icon: '🔥', cost: { wood: 4, stone: 2 }, hp: 80, desc: 'Para cocinar donde quieras.' },
  tienda: { name: 'Tienda de campaña', icon: '⛺', cost: { cloth: 4, wood: 4 }, hp: 100, desc: 'Cerca de ella recuperas vida poco a poco.' },
  huerto: { name: 'Huerto', icon: '🌱', cost: { wood: 4, wheat: 2 }, hp: 80, desc: 'Da trigo, manzanas y setas cada pocos minutos.' },
};
const LEADERS = { marisol: 'Villarroca', nerea: 'Puerto Salitre', mara: 'Isla Tortuga', zaid: 'Oasis de Sal', ixa: 'Aldea Liana', lucas: 'Villa Grillete', lucia: 'Granja de los Trigales' };
const TOWN_COST = (lvl) => ({ gold: 100 * lvl * lvl, wood: 20 * lvl, stone: 15 * lvl, iron: lvl > 1 ? 6 * (lvl - 1) : 0 });

function structMesh(t, M) {
  const g = new THREE.Group();
  const wood = M.darkWood, plank = M.plank;
  switch (t) {
    case 'empalizada':
      for (let i = 0; i < 6; i++) for (const z of [-0.5, 0.5]) { const h = 1.1 + ((i * 7) % 3) * 0.12; cyl(g, 0.13, 0.15, h, wood, -0.75 + i * 0.3, h / 2, z, 6); cyl(g, 0.01, 0.13, 0.18, wood, -0.75 + i * 0.3, h + 0.09, z, 6); }
      box(g, 1.9, 0.1, 0.08, M.rope, 0, 0.7, 0.62); box(g, 1.9, 0.1, 0.08, M.rope, 0, 0.7, -0.38);
      break;
    case 'muro':
      box(g, 1.9, 1.2, 1.6, M.stone, 0, 0.6, 0, 1.1);
      box(g, 2.0, 0.12, 1.7, M.stoneDark, 0, 1.25, 0, 1);
      for (const [x, z] of [[-0.7, -0.6], [0, -0.6], [0.7, -0.6], [-0.7, 0.6], [0, 0.6], [0.7, 0.6]]) box(g, 0.36, 0.3, 0.36, M.stone, x, 1.45, z, 1.1);
      break;
    case 'torre':
      for (const [x, z] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) cyl(g, 0.08, 0.1, 2.2, wood, x, 1.1, z, 6);
      box(g, 1.7, 0.12, 1.7, plank, 0, 2.2, 0, 1.2);
      for (const [x, z, w, d] of [[0, -0.8, 1.7, 0.08], [0, 0.8, 1.7, 0.08], [-0.8, 0, 0.08, 1.7], [0.8, 0, 0.08, 1.7]]) box(g, w, 0.4, d, plank, x, 2.45, z, 1.2);
      { const r = new THREE.Mesh(new THREE.ConeGeometry(1.25, 0.8, 4), M.roof(0x8a3a2a)); r.rotation.y = Math.PI / 4; r.position.y = 3.1; g.add(r); }
      for (const [x, z] of [[-0.6, 0], [0.6, 0]]) box(g, 0.06, 0.06, 1.3, wood, x, 1.1, z).rotation.x = 0.9;
      break;
    case 'canon':
      box(g, 1.8, 0.5, 1.8, M.stone, 0, 0.25, 0, 1.1);
      for (const [x, z] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) box(g, 0.3, 0.35, 0.3, M.stone, x, 0.67, z, 1.1);
      box(g, 0.6, 0.25, 0.8, wood, 0, 0.62, 0);
      { const b = cyl(g, 0.16, 0.22, 1.2, M.iron, 0, 0.9, 0.15, 10); b.rotation.x = Math.PI / 2 - 0.2; g.userData.barrel = b; }
      break;
    case 'fogata':
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; box(g, 0.2, 0.15, 0.2, M.stoneDark, Math.cos(a) * 0.45, 0.07, Math.sin(a) * 0.45); }
      for (let i = 0; i < 3; i++) box(g, 0.7, 0.1, 0.1, wood, 0, 0.12, 0).rotation.y = i * 1.05;
      cyl(g, 0.01, 0.22, 0.45, M.fire, 0, 0.35, 0, 6);
      cyl(g, 0.01, 0.12, 0.3, M.fire2, 0, 0.32, 0, 6);
      break;
    case 'tienda': {
      const c = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.4, 4), mat(0xd8ccae));
      c.rotation.y = Math.PI / 4; c.position.y = 0.7; g.add(c);
      box(g, 0.4, 0.6, 0.05, mat(0x5a3a22), 0, 0.3, 0.72);
      cyl(g, 0.03, 0.03, 1.7, wood, 0, 0.85, 0, 4);
      break;
    }
    case 'huerto':
      box(g, 1.8, 0.12, 1.8, mat(0x6a4a2a), 0, 0.06, 0);
      for (const z of [-0.6, 0, 0.6]) for (const x of [-0.6, 0, 0.6]) { cyl(g, 0.02, 0.02, 0.3, mat(0x3a8a3a), x, 0.25, z, 4); const l = cyl(g, 0.12, 0.02, 0.12, mat(0x4aa848), x, 0.42, z, 5); l.userData.crop = true; }
      for (const [x, z, w, d] of [[0, -0.95, 1.9, 0.06], [0, 0.95, 1.9, 0.06], [-0.95, 0, 0.06, 1.9], [0.95, 0, 0.06, 1.9]]) box(g, w, 0.3, d, wood, x, 0.15, z);
      break;
    default: break;
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

export function installBuild(Game, D) {
  const P = Game.prototype;
  const sfx = D.sfx;
  const tiles = (b) => [[b.x, b.z], [b.x + 1, b.z], [b.x, b.z + 1], [b.x + 1, b.z + 1]];

  P.canPlace = function (x, z) {
    const W = this.W;
    if (W.isInterior(x)) return false;
    for (const [tx, tz] of tiles({ x, z })) {
      if (!W.walkable(tx, tz)) return false;
      const t = W.tileAll(tx, tz);
      if (t === D.T.WATER || t === D.T.DOCK) return false;
      if (this.treeMap.has(W.key(tx, tz)) || this.rockMap.has(W.key(tx, tz))) return false;
    }
    for (const n of this.npcs) if (n.model.root.visible && n.tx >= x && n.tx <= x + 1 && n.tz >= z && n.tz <= z + 1) return false;
    return true;
  };
  P.addStruct = function (t, x, z, opt = {}) {
    const def = STRUCTS[t];
    const b = { t, x, z, hp: opt.hp ?? def.hp * (opt.strong ? 2 : 1), maxHp: def.hp * (opt.strong ? 2 : 1), town: opt.town, strong: !!opt.strong, cd: Math.random() * 2, grow: opt.grow ?? 0 };
    b.mesh = structMesh(t, this.M);
    b.mesh.position.set(x + 0.5, 0, z + 0.5);
    this.scene.add(b.mesh);
    b.label = this.ui.makeLabel('enemy', `${def.icon} ${def.name}${b.town ? ' (' + b.town + ')' : ''}`, { hp: true });
    b.label.nm.style.color = '#bfe6ff';
    this.ui.setHp(b.label, b.hp / b.maxHp);
    for (const [tx, tz] of tiles(b)) this.W.setBlocked(tx, tz, 1);
    if (t === 'fogata') { b.station = { type: 'fuego', x: x + 0.5, z: z + 0.5 }; this.stations.push(b.station); }
    (this.builds || (this.builds = [])).push(b);
    return b;
  };
  P.removeStruct = function (b, destroyed) {
    this.scene.remove(b.mesh);
    b.label.el.remove();
    for (const [tx, tz] of tiles(b)) this.W.setBlocked(tx, tz, 0);
    if (b.station) this.stations.splice(this.stations.indexOf(b.station), 1);
    this.builds.splice(this.builds.indexOf(b), 1);
    if (destroyed) { this.toast(`💥 ${STRUCTS[b.t].name}${b.town ? ' de ' + b.town : ''} destruida`); this.puff && this.naval && this.puff(b.x + 0.5, 1, b.z + 0.5, 0x8a8a8a, true); }
  };
  P.loadBuilds = function (list) {
    for (const b of [...(this.builds || [])]) this.removeStruct(b);
    for (const s of list) if (STRUCTS[s.t]) this.addStruct(s.t, s.x, s.z, { hp: s.hp, town: s.town, strong: s.strong, grow: s.grow });
  };
  P.placeStruct = function (t) {
    const p = this.player, def = STRUCTS[t];
    if (this.sailing || this.W.isInterior(p.x) || this.boarding) return this.toast('Solo puedes construir en tierra firme');
    // busca un hueco de 2×2 delante de ti
    const fx = Math.sin(p.face), fz = Math.cos(p.face);
    let spot = null;
    for (const d of [1.6, 2.4, 1.2, 3]) for (const [ox, oz] of [[0, 0], [-1, 0], [0, -1], [-1, -1]]) {
      if (spot) break;
      const x = Math.round(p.x + fx * d) + ox, z = Math.round(p.z + fz * d) + oz;
      if (x <= p.tx && p.tx <= x + 1 && z <= p.tz && p.tz <= z + 1) continue;
      if (this.canPlace(x, z)) spot = { x, z };
    }
    if (!spot) return this.toast('No hay sitio libre (2×2 casillas) delante de ti');
    this.buy(def.cost, () => {
      this.addStruct(t, spot.x, spot.z);
      this.toast(`🔨 Construyes: ${def.name}`);
      this.ring(spot.x + 0.5, spot.z + 0.5, 1.5, 0xffe0a0);
      this.stats.built = (this.stats.built || 0) + 1;
    });
  };
  P.structNear = function (r) {
    const p = this.player;
    let best = null, bd = r;
    for (const b of this.builds || []) { const d = Math.hypot(b.x + 0.5 - p.x, b.z + 0.5 - p.z); if (d < bd) { bd = d; best = b; } }
    return best;
  };
  P.structMenu = function (b) {
    const def = STRUCTS[b.t], opts = [];
    const miss = b.maxHp - b.hp;
    if (miss > 1) {
      const c = {}; for (const [k, v] of Object.entries(def.cost)) if (k !== 'polvora') c[k] = Math.max(1, Math.ceil(v * 0.4 * miss / b.maxHp));
      opts.push({ label: `🔧 Reparar (${Object.entries(c).map(([k, v]) => v + ' ' + k).join(', ')})`, action: () => this.buy(c, () => { b.hp = b.maxHp; this.ui.setHp(b.label, 1); }) });
    }
    if (!b.strong) {
      const c = { stone: 6, iron: 2 };
      opts.push({ label: '🛡️ Reforzar: doble de vida (6 piedra, 2 hierro)', action: () => this.buy(c, () => { b.strong = true; b.maxHp *= 2; b.hp = b.maxHp; this.ui.setHp(b.label, 1); this.toast('🛡️ Estructura reforzada'); }) });
    }
    if (b.t === 'huerto' && b.grow >= 1) opts.push({ label: '🌾 Recoger cosecha', action: () => { b.grow = 0; this.give('wheat', 3, b.x, b.z); this.give('apple', 2); if (Math.random() < 0.5) this.give('mushroom', 1); sfx('coin'); } });
    if (!b.town) opts.push({ label: '♻️ Desmontar (recuperas la mitad)', action: () => { for (const [k, v] of Object.entries(def.cost)) this.give(k, Math.floor(v / 2)); this.removeStruct(b); } });
    opts.push({ label: 'Cerrar', action: null });
    this.ui.openDialog(`${def.icon} ${def.name}`, `${def.desc} Vida: ${Math.round(b.hp)}/${b.maxHp}${b.strong ? ' (reforzada)' : ''}.${b.t === 'huerto' ? ` Cosecha: ${Math.min(100, Math.round(b.grow * 100))}%` : ''}`, opts);
  };

  // ---- defensas de los pueblos
  P.townDefOptions = function (npcId) {
    const town = LEADERS[npcId];
    if (!town) return [];
    this.townDef = this.townDef || {};
    const lvl = this.townDef[town] || 0;
    const alive = (this.builds || []).filter((b) => b.town === town);
    const missing = lvl * 2 - alive.length;
    const o = [];
    if (lvl < 3) {
      const c = TOWN_COST(lvl + 1);
      for (const k of Object.keys(c)) if (!c[k]) delete c[k];
      o.push({ label: `🛡️ Dar materiales: defensas ${lvl + 1}/3 (${Object.entries(c).map(([k, v]) => v + ' ' + (k === 'gold' ? 'oro' : k)).join(', ')})`, action: () => this.buy(c, () => { this.townDef[town] = lvl + 1; this.raiseTownDefs(town, npcId); this.toast(`🛡️ ${town} levanta nuevas defensas (nivel ${lvl + 1})`, 'area'); sfx('quest'); }) });
    }
    if (missing > 0) o.push({ label: `🔨 Reconstruir ${missing} defensa(s) destruida(s) (${missing * 10} madera, ${missing * 8} piedra)`, action: () => this.buy({ wood: missing * 10, stone: missing * 8 }, () => this.raiseTownDefs(town, npcId)) });
    const hurt = alive.filter((b) => b.hp < b.maxHp);
    if (hurt.length) o.push({ label: `🔧 Reforzar las defensas dañadas (${hurt.length * 4} piedra)`, action: () => this.buy({ stone: hurt.length * 4 }, () => { for (const b of hurt) { b.hp = b.maxHp; this.ui.setHp(b.label, 1); } this.toast('🔧 Defensas reparadas'); }) });
    return o;
  };
  P.raiseTownDefs = function (town, npcId) {
    const n = this.npcById(npcId);
    const lvl = this.townDef[town] || 0;
    const want = lvl * 2;
    let have = (this.builds || []).filter((b) => b.town === town).length;
    const types = ['torre', 'torre', 'torre', 'canon', 'canon', 'canon'];
    const cx = n.home.x, cz = n.home.z;
    for (let r = 4; r < 12 && have < want; r++) {
      for (let a = 0; a < 16 && have < want; a++) {
        const ang = (a / 16) * Math.PI * 2 + r;
        const x = Math.round(cx + Math.cos(ang) * r), z = Math.round(cz + Math.sin(ang) * r);
        if (!this.canPlace(x, z)) continue;
        if ((this.builds || []).some((b) => Math.abs(b.x - x) < 4 && Math.abs(b.z - z) < 4)) continue;
        this.addStruct(types[have], x, z, { town });
        have++;
      }
    }
  };

  // ---- funcionamiento: torres disparan, asaltantes golpean, huertos crecen, tiendas curan
  P.updateBuild = function (dt) {
    if (!this.builds || !this.builds.length) return;
    const p = this.player;
    for (const b of [...this.builds]) {
      const def = STRUCTS[b.t];
      const cx = b.x + 0.5, cz = b.z + 0.5;
      const dP = Math.hypot(cx - p.x, cz - p.z);
      if (dP < 22) { if (b.hp < b.maxHp || dP < 6) this.ui.placeLabel(b.label, cx, (b.t === 'torre' ? 3.6 : 1.9), cz); else if (b.label._vis) { b.label._vis = false; b.label.el.style.display = 'none'; } }
      else if (b.label._vis) { b.label._vis = false; b.label.el.style.display = 'none'; }
      if (b.t === 'huerto' && b.grow < 1) { b.grow = Math.min(1, b.grow + dt / 180); b.mesh.traverse((o) => { if (o.userData.crop) o.scale.setScalar(0.4 + b.grow * 0.9); }); }
      if (b.t === 'tienda' && dP < 2.5 && !p.dead && p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.01 * dt);
      if (dP > 40) continue;
      b.cd -= dt;
      if (def.shoot && b.cd <= 0) {
        let tgt = null, bd = def.shoot.r;
        for (const e of this.enemies) { if (e.dead || e.removed || (e.hostile && !e.hostile())) continue; if (!(e.state === 'chase' || e.temp)) continue; const d = Math.hypot(e.x - cx, e.z - cz); if (d < bd) { bd = d; tgt = e; } }
        if (tgt) {
          b.cd = def.shoot.cd;
          const dmg = Math.round((10 + p.level * 2.5) * def.shoot.k);
          this.shot(cx, b.t === 'torre' ? 2.5 : 1.0, cz, tgt, def.shoot.ball, () => {
            if (def.shoot.ball) { for (const e of this.enemies) if (!e.dead && !e.removed && (!e.hostile || e.hostile()) && Math.hypot(e.x - tgt.x, e.z - tgt.z) < 1.8) this.damageEnemy(e, dmg, false, true); this.ring(tgt.x, tgt.z, 1.6, 0xff9a40); }
            else if (!tgt.dead) this.damageEnemy(tgt, dmg, false, true);
          });
          if (def.shoot.ball) sfx('cannon');
        }
      }
    }
    // los asaltantes golpean lo que les estorba
    this.siegeT = (this.siegeT || 0) - dt;
    if (this.siegeT <= 0) {
      this.siegeT = 1.4;
      for (const e of this.enemies) {
        if (e.dead || e.removed || e.state !== 'chase' || (e.hostile && !e.hostile())) continue;
        for (const b of this.builds) {
          if (Math.hypot(b.x + 0.5 - e.x, b.z + 0.5 - e.z) < 1.9) {
            b.hp -= e.atk * 0.8;
            e.st.attackT = 0.32;
            e.faceTo(b.x + 0.5 - e.x, b.z + 0.5 - e.z, 1);
            this.ui.setHp(b.label, Math.max(0, b.hp) / b.maxHp);
            if (b.hp <= 0) this.removeStruct(b, true);
            break;
          }
        }
      }
    }
    // proyectiles de torres
    if (this.shots) for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i];
      s.t += dt / s.dur;
      const tx = s.tgt.x, tz = s.tgt.z;
      s.m.position.set(s.x + (tx - s.x) * s.t, s.y + (0.8 - s.y) * s.t + Math.sin(s.t * Math.PI) * (s.ball ? 1.5 : 0.4), s.z + (tz - s.z) * s.t);
      if (!s.ball) s.m.lookAt(tx, 0.8, tz);
      if (s.t >= 1) { this.scene.remove(s.m); this.shots.splice(i, 1); s.fn(); }
    }
  };
  P.shot = function (x, y, z, tgt, ball, fn) {
    const m = ball ? new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), new THREE.MeshLambertMaterial({ color: 0x1a1a1a })) : new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.5), new THREE.MeshBasicMaterial({ color: 0xe8d8b0 }));
    m.position.set(x, y, z);
    this.scene.add(m);
    (this.shots || (this.shots = [])).push({ m, x, y, z, tgt, ball, fn, t: 0, dur: ball ? 0.6 : 0.3 });
  };
}

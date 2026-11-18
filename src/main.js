// Isla Bruma — RPG medieval y pirata en 2.5D isométrico sobre cuadrícula.
import * as THREE from 'three';
import { generateWorld, N, T } from './world.js';
import * as TX from './textures.js';
import { buildTerrain, buildWater } from './terrain.js';
import {
  createMaterials, makeBuilding, makeWall, makeTower, makeProp, makeLamp, makeDocks,
  makeShip, makeRowboat, makeWreck, treeGeometries, StaticBatcher,
} from './props.js';
import { animateModel, SKINS } from './characters.js';
import { findPath } from './pathfinding.js';
import { QUESTS, dialogFor } from './quests.js';
import { sfx, audio } from './audio.js';
import { UI } from './ui.js';
import { makeIslets, makeInteriors, attachRegions } from './regions.js';
import { buildRoom } from './interiors.js';
import { makeHumanoid2, makeBeast2, makeCrab2, OUTFITS2, OUTLINE } from './chars2.js';

const HUM = makeHumanoid2;
const OUTF = OUTFITS2;

const $ = (id) => document.getElementById(id);
const SAVE_KEY = 'islabruma_save_v1';
const SETTINGS_KEY = 'islabruma_settings_v1';
const isMobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && window.innerWidth < 1100);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerpAngle = (a, b, t) => {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
};
function store(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* sin almacenamiento */ } }
function load(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }

const ENEMY_DEF = {
  wolf: { name: 'Lobo', hp: (L) => 22 + 9 * L, atk: (L) => 3 + 1.6 * L, speed: 3.0, xp: (L) => 8 + 4 * L, gold: (L) => 1 + Math.floor(Math.random() * (2 + L)), aggro: 4.5, cd: 1.3 },
  boar: { name: 'Jabalí', hp: (L) => 34 + 11 * L, atk: (L) => 4 + 1.9 * L, speed: 2.6, xp: (L) => 10 + 5 * L, gold: (L) => 2 + Math.floor(Math.random() * (3 + L)), aggro: 4, cd: 1.5 },
  crab: { name: 'Cangrejo', hp: (L) => 16 + 7 * L, atk: (L) => 2 + 1.3 * L, speed: 1.9, xp: (L) => 6 + 3 * L, gold: (L) => 1 + Math.floor(Math.random() * (2 + L)), aggro: 3, cd: 1.4 },
  skeleton: { name: 'Pirata esqueleto', hp: (L) => 40 + 12 * L, atk: (L) => 5 + 2.1 * L, speed: 2.6, xp: (L) => 14 + 6 * L, gold: (L) => 4 + Math.floor(Math.random() * (4 + L)), aggro: 5, cd: 1.4 },
  boss: { name: 'Capitán Huesoamargo', hp: () => 650, atk: () => 30, speed: 2.4, xp: () => 400, gold: () => 150, aggro: 6, cd: 1.6 },
};

// ======================================================================= Actores
class Actor {
  constructor(game, model, x, z) {
    this.g = game;
    this.model = model;
    this.x = x;
    this.z = z;
    this.path = [];
    this.speed = 3;
    this.st = {};
    this.face = Math.PI / 4;
    this.yOff = 0;
    game.scene.add(model.root);
  }
  get tx() { return Math.round(this.x); }
  get tz() { return Math.round(this.z); }
  dist(o) { return Math.hypot(o.x - this.x, o.z - this.z); }
  nextTile() { return this.path.length ? this.path[0] : { x: this.tx, z: this.tz }; }
  goTo(x, z, adjacent = false, maxIter = 6000, range = 1) {
    const moving = this.path.length > 0;
    const s = this.nextTile();
    const p = findPath(this.g.W, s.x, s.z, x, z, { adjacent, maxIter, range });
    if (!p) {
      this.path = moving ? [s] : [];
      return false;
    }
    this.path = moving ? [s, ...p] : p;
    return true;
  }
  stepMove(dt) {
    if (!this.path.length) {
      this.st.moving = false;
      return;
    }
    let remain = this.speed * dt;
    while (remain > 0 && this.path.length) {
      const n = this.path[0];
      const dx = n.x - this.x, dz = n.z - this.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.001) this.faceTo(dx, dz, dt);
      if (d <= remain) {
        this.x = n.x;
        this.z = n.z;
        this.path.shift();
        remain -= d;
        if (this.onTile) this.onTile();
      } else {
        this.x += (dx / d) * remain;
        this.z += (dz / d) * remain;
        remain = 0;
      }
    }
    this.st.moving = true;
  }
  faceTo(dx, dz, dt) {
    this.face = lerpAngle(this.face, Math.atan2(dx, dz), Math.min(1, dt * 14));
  }
  sync(dt) {
    const r = this.model.root;
    r.position.set(this.x, this.g.W.groundY(this.x, this.z) + this.yOff, this.z);
    r.rotation.y = this.face;
    if (this.st.attackT > 0) this.st.attackT -= dt;
    animateModel(this.model, this.st, dt);
  }
}

class Player extends Actor {
  constructor(game, data) {
    const look = { ...OUTF[data.outfit].look, skin: SKINS[data.skin] };
    super(game, HUM(look), data.x, data.z);
    this.name = data.name;
    this.outfit = data.outfit;
    this.skin = data.skin;
    this.level = data.level || 1;
    this.xp = data.xp || 0;
    this.gold = data.gold ?? 10;
    this.weapon = data.weapon || 0;
    this.armor = data.armor || 0;
    this.inv = { wood: 0, stone: 0, potion: 2, ...(data.inv || {}) };
    this.speed = 3.4;
    this.recalc();
    this.hp = data.hp ?? this.maxHp;
    this.target = null;
    this.attackCd = 0;
    this.lastCombat = -99;
    this.gatherT = 0;
    this.repathT = 0;
    this.pendingHit = null;
    this.dead = false;
    this.regenAcc = 0;
    this.label = game.ui.makeLabel('player', this.name);
  }
  setLook(outfit, skin) {
    this.outfit = outfit;
    this.skin = skin;
    this.g.scene.remove(this.model.root);
    this.model = HUM({ ...OUTF[outfit].look, skin: SKINS[skin] });
    this.g.scene.add(this.model.root);
  }
  recalc() {
    this.maxHp = 60 + (this.level - 1) * 14 + this.armor * 22;
    if (this.hp > this.maxHp) this.hp = this.maxHp;
  }
  get atk() { return 7 + (this.level - 1) * 2.5 + this.weapon * 5; }
  get def() { return this.armor * 2; }
  xpNext() { const l = this.level - 1; return 25 + l * 20 + l * l * 6; }
  gainXp(n) {
    this.xp += n;
    while (this.xp >= this.xpNext()) {
      this.xp -= this.xpNext();
      this.level++;
      this.recalc();
      this.hp = this.maxHp;
      this.g.ui.toast(`⭐ ¡Nivel ${this.level}!`);
      this.g.ui.float('¡NIVEL!', 'crit', this.x, 1.6, this.z);
      sfx('level');
    }
  }
  setTarget(t) {
    this.target = t;
    this.gatherT = 0;
    this.st.gather = 0;
    this.repathT = 0;
    if (t && t.kind === 'tile') {
      this.goTo(t.x, t.z);
      this.target = null;
    }
  }
  inCombat() { return this.g.time - this.lastCombat < 5; }

  update(dt) {
    const g = this.g;
    if (this.dead) {
      this.deadT -= dt;
      this.model.root.rotation.z = Math.min(Math.PI / 2, (this.model.root.rotation.z || 0) + dt * 4);
      if (this.deadT <= 0) g.respawnPlayer();
      return;
    }
    this.model.root.rotation.z = 0;
    this.attackCd -= dt;
    // golpe diferido (sincronizado con la animación)
    if (this.pendingHit) {
      this.pendingHit.t -= dt;
      if (this.pendingHit.t <= 0) {
        const e = this.pendingHit.e;
        this.pendingHit = null;
        if (!e.dead && this.dist(e) < 2.2) {
          const crit = Math.random() < 0.12;
          const dmg = Math.max(1, Math.round(this.atk * (0.85 + Math.random() * 0.3) * (crit ? 1.8 : 1)));
          g.damageEnemy(e, dmg, crit);
        }
      }
    }
    if (g.sailing) return;
    const joy = g.joyVector();
    if (joy) {
      this.target = null;
      this.st.gather = 0;
      g.selection.visible = false;
      if (this.path.length <= 1) {
        const from = this.nextTile();
        const d = g.joyToGrid(joy);
        let step = null;
        const ok = (dx, dz) => g.W.walkable(from.x + dx, from.z + dz) && (!(dx && dz) || (g.W.walkable(from.x + dx, from.z) && g.W.walkable(from.x, from.z + dz)));
        const door = !this.path.length && g.doorAt(from.x + d[0], from.z + d[1]);
        if (door && door.front.x === from.x && door.front.z === from.z) { g.enterRoom(door); return; }
        if (ok(d[0], d[1])) step = d;
        else if (d[0] && d[1] && ok(d[0], 0)) step = [d[0], 0];
        else if (d[0] && d[1] && ok(0, d[1])) step = [0, d[1]];
        if (step) {
          const nt = { x: from.x + step[0], z: from.z + step[1] };
          if (!this.path.length) this.path = [nt];
          else if (this.path.length === 1 && Math.hypot(this.path[0].x - this.x, this.path[0].z - this.z) < 0.35) this.path.push(nt);
        } else if (!this.path.length) {
          const wx = (joy.x - joy.y), wz = (-joy.x - joy.y);
          this.faceTo(wx, wz, dt);
        }
      }
    } else if (this.target) {
      this.updateTarget(dt);
    }
    this.stepMove(dt);

    // regeneración fuera de combate
    if (!this.inCombat() && this.hp < this.maxHp) {
      this.regenAcc += dt;
      if (this.regenAcc >= 1) {
        this.regenAcc = 0;
        const h = Math.max(1, Math.round(this.maxHp * 0.03));
        this.hp = Math.min(this.maxHp, this.hp + h);
        g.ui.float('+' + h, 'heal', this.x, 1.3, this.z);
      }
    }
  }

  updateTarget(dt) {
    const g = this.g;
    const t = this.target;
    if (t.kind === 'enemy') {
      const e = t.ref;
      if (e.dead) {
        this.target = null;
        g.selection.visible = false;
        return;
      }
      const d = this.dist(e);
      if (d <= 1.6) {
        if (this.path.length > 1) this.path = [this.path[0]];
        if (!this.path.length) {
          this.faceTo(e.x - this.x, e.z - this.z, dt);
          if (this.attackCd <= 0) this.attack(e);
        }
      } else {
        this.repathT -= dt;
        if (this.repathT <= 0) {
          this.repathT = 0.35;
          if (!this.goTo(e.tx, e.tz, true, 2500) && d > 12) {
            this.target = null;
            g.selection.visible = false;
          }
        }
      }
    } else if (t.kind === 'npc') {
      const n = t.ref;
      const cheb = Math.max(Math.abs(n.tx - this.nextTile().x), Math.abs(n.tz - this.nextTile().z));
      const rng = t.range || 1;
      if (cheb <= rng && this.dist(n) < rng + 0.8) {
        if (this.path.length > 1) this.path = [this.path[0]];
        if (!this.path.length) {
          this.target = null;
          g.talkTo(n);
        }
      } else {
        this.repathT -= dt;
        if (this.repathT <= 0) {
          this.repathT = 0.6;
          if (!this.goTo(n.tx, n.tz, true, 6000, t.range || 1)) {
            if (!t.range) { t.range = 2; this.repathT = 0; }
            else { this.target = null; g.ui.toast('No hay camino'); }
          }
        }
      }
    } else if (t.kind === 'door') {
      const r = t.ref;
      if (this.tx === r.front.x && this.tz === r.front.z && !this.path.length) { this.target = null; g.enterRoom(r); }
      else if (!this.path.length && !this.goTo(r.front.x, r.front.z)) { this.target = null; g.ui.toast('No hay camino'); }
    } else if (t.kind === 'ship') {
      if (g.canBoard()) { this.target = null; this.path = []; g.board(); }
      else if (!this.path.length) {
        const d = g.docks.find((k) => k.id === g.boat.docked);
        if (!d || (this.tx === d.land.x && this.tz === d.land.z) || !this.goTo(d.land.x, d.land.z)) { this.target = null; if (!g.canBoard()) g.ui.toast('Acércate al barco por el muelle'); }
      }
    } else if (t.kind === 'chest') {
      const c = t.ref;
      if (Math.max(Math.abs(c.x - this.tx), Math.abs(c.z - this.tz)) <= 1 && !this.path.length) { this.target = null; g.openChest(c); }
      else if (!this.path.length && !this.goTo(c.x, c.z, true)) { this.target = null; g.ui.toast('No hay camino'); }
    } else if (t.kind === 'tree' || t.kind === 'rock') {
      const o = t.ref;
      if (o.down) {
        this.target = null;
        this.st.gather = 0;
        return;
      }
      const cheb = Math.max(Math.abs(o.x - this.tx), Math.abs(o.z - this.tz));
      if (cheb <= 1 && !this.path.length) {
        this.faceTo(o.x - this.x, o.z - this.z, dt);
        this.st.gather = 1;
        this.st.gatherPhase = (this.st.gatherPhase || 0) + dt * 9;
        const before = this.gatherT;
        this.gatherT += dt;
        if (Math.floor(before / 0.5) !== Math.floor(this.gatherT / 0.5)) sfx(t.kind === 'tree' ? 'chop' : 'mine');
        if (this.gatherT >= 1.5) {
          this.gatherT = 0;
          g.harvest(o, t.kind);
        }
      } else if (!this.path.length) {
        if (!this.goTo(o.x, o.z, true)) {
          this.target = null;
          g.ui.toast('No hay camino');
        }
      }
    }
  }

  attack(e) {
    this.attackCd = 0.72;
    this.st.attackT = 0.32;
    this.pendingHit = { e, t: 0.14 };
    this.lastCombat = this.g.time;
    sfx('swing');
  }

  onTile() { this.g.checkTriggers(this); }

  usePotion() {
    if (this.dead) return;
    if (this.inv.potion <= 0) return this.g.ui.toast('No te queda ron curativo');
    if (this.hp >= this.maxHp) return this.g.ui.toast('Ya tienes la salud al máximo');
    this.inv.potion--;
    const h = Math.round(this.maxHp * 0.45 + 15);
    this.hp = Math.min(this.maxHp, this.hp + h);
    this.g.ui.float('+' + h, 'heal', this.x, 1.4, this.z);
    sfx('drink');
  }
}

class NPC extends Actor {
  constructor(game, def) {
    super(game, HUM(def.look), def.x, def.z);
    this.def = def;
    this.id = def.id;
    this.name = def.name;
    this.home = { x: def.x, z: def.z };
    this.speed = 1.6;
    this.wanderT = 2 + Math.random() * 4;
    this.talking = false;
    this.face = Math.PI / 4;
    if (def.small) model_scale(this.model, 0.72);
    this.label = game.ui.makeLabel('npc', def.name);
  }
  update(dt) {
    const g = this.g;
    if (this.talking) {
      this.path = this.path.slice(0, 1);
      if (!this.path.length) this.faceTo(g.player.x - this.x, g.player.z - this.z, dt);
    } else if (this.def.wander > 0) {
      this.wanderT -= dt;
      if (this.wanderT <= 0 && !this.path.length) {
        this.wanderT = 3 + Math.random() * 6;
        const r = this.def.wander;
        for (let i = 0; i < 8; i++) {
          const x = this.home.x + Math.round((Math.random() * 2 - 1) * r);
          const z = this.home.z + Math.round((Math.random() * 2 - 1) * r);
          if (g.W.walkable(x, z) && !(x === g.player.tx && z === g.player.tz)) {
            this.goTo(x, z, false, 400);
            break;
          }
        }
      }
    } else if (!this.path.length) {
      this.face = lerpAngle(this.face, Math.PI / 4, dt * 2);
    }
    this.stepMove(dt);
  }
}

function model_scale(model, s) {
  model.root.scale.setScalar(s);
  model.height *= s;
}

class Enemy extends Actor {
  constructor(game, type, spawn, lvlRange) {
    let model;
    if (type === 'wolf' || type === 'boar') model = makeBeast2(type);
    else if (type === 'crab') model = makeCrab2();
    else if (type === 'boss') {
      model = HUM({ bone: 0xe8e2cc, shirt: 0x8a1a1a, hat: 'tricorn', feather: 0xd83a3a, sword: true, blade: 0xffd070, guard: 0xffd070, eyeGlow: 0xff3020, cape: 0x5a0a0a, pauldron: 0x8a1a1a, trim: 0xe0b040 });
    } else {
      model = HUM({ bone: 0xe8e2cc, hat: 'bandana', capColor: [0xb02a2a, 0x2a4ab0, 0x2a2a2a][Math.floor(Math.random() * 3)], sword: true, blade: 0x9a8a7a, eyepatch: Math.random() < 0.3 });
    }
    super(game, model, 0, 0);
    if (type === 'boss') model_scale(model, 1.5);
    this.type = type;
    this.def = ENEMY_DEF[type];
    this.spawnDef = spawn;
    this.lvlRange = lvlRange;
    this.label = game.ui.makeLabel('enemy', '', { hp: true });
    this.respawn();
  }
  respawn() {
    const g = this.g;
    const [x0, z0, x1, z1] = this.spawnDef.area;
    let x = Math.round((x0 + x1) / 2), z = Math.round((z0 + z1) / 2);
    for (let i = 0; i < 80; i++) {
      const tx = x0 + Math.floor(Math.random() * (x1 - x0 + 1));
      const tz = z0 + Math.floor(Math.random() * (z1 - z0 + 1));
      if (!g.W.walkable(tx, tz)) continue;
      if (this.spawnDef.sand && g.W.tile(tx, tz) !== T.SAND) continue;
      if (g.player && Math.hypot(tx - g.player.x, tz - g.player.z) < 7) continue;
      x = tx; z = tz;
      break;
    }
    this.x = x; this.z = z;
    this.home = { x, z };
    this.path = [];
    this.level = this.lvlRange[0] + Math.floor(Math.random() * (this.lvlRange[1] - this.lvlRange[0] + 1));
    this.maxHp = Math.round(this.def.hp(this.level));
    this.hp = this.maxHp;
    this.atk = this.def.atk(this.level);
    this.speed = this.def.speed;
    this.state = 'idle';
    this.dead = false;
    this.deadT = 0;
    this.attackCd = 1;
    this.thinkT = Math.random() * 3;
    this.pending = null;
    this.model.root.visible = true;
    this.model.root.rotation.z = 0;
    this.yOff = 0;
    this.label.nm.textContent = `${this.def.name} · Nv. ${this.level}`;
    this.label.el.style.display = '';
    this.label._vis = true;
    this.g.ui.setHp(this.label, 1);
    this.updateColor();
  }
  updateColor() {
    const d = this.level - (this.g.player ? this.g.player.level : 1);
    const c = this.type === 'boss' ? '#ff5ad0' : d >= 3 ? '#ff5a4a' : d >= 1 ? '#ffb84a' : d >= -2 ? '#7aff8a' : '#c8c8c8';
    if (this.label._c !== c) { this.label._c = c; this.label.nm.style.color = c; }
  }
  update(dt) {
    const g = this.g, p = g.player;
    if (this.dead) {
      this.deadT += dt;
      if (this.deadT < 1.2) {
        this.model.root.rotation.z = Math.min(Math.PI / 2, this.deadT * 5);
        this.yOff = -Math.max(0, this.deadT - 0.6) * 0.6;
      } else this.model.root.visible = false;
      if (this.deadT > (this.type === 'boss' ? 120 : 28)) this.respawn();
      return;
    }
    const dP = this.dist(p);
    if (dP > 34 && this.state === 'idle') return; // lejos: dormido
    this.attackCd -= dt;
    if (this.pending) {
      this.pending.t -= dt;
      if (this.pending.t <= 0) {
        this.pending = null;
        if (!p.dead && this.dist(p) < 2.0) g.damagePlayer(this, this.atk);
      }
    }
    const fromHome = Math.hypot(this.x - this.home.x, this.z - this.home.z);
    if (this.state === 'idle') {
      this.thinkT -= dt;
      if (this.thinkT <= 0 && !this.path.length) {
        this.thinkT = 2 + Math.random() * 4;
        const x = this.home.x + Math.round((Math.random() * 2 - 1) * 3);
        const z = this.home.z + Math.round((Math.random() * 2 - 1) * 3);
        if (g.W.walkable(x, z)) this.goTo(x, z, false, 300);
      }
      if (!p.dead && dP < this.def.aggro) this.state = 'chase';
    } else if (this.state === 'chase') {
      if (p.dead || fromHome > 15) {
        this.state = 'return';
        this.goTo(this.home.x, this.home.z, false, 3000);
      } else if (dP <= 1.55) {
        if (this.path.length > 1) this.path = [this.path[0]];
        if (!this.path.length) {
          this.faceTo(p.x - this.x, p.z - this.z, dt);
          if (this.attackCd <= 0) {
            this.attackCd = this.def.cd;
            this.st.attackT = 0.32;
            this.pending = { t: 0.16 };
          }
        }
      } else {
        this.thinkT -= dt;
        if (this.thinkT <= 0) {
          this.thinkT = 0.5;
          this.goTo(p.tx, p.tz, true, 1500);
        }
      }
    } else if (this.state === 'return') {
      if (!this.path.length) {
        if (fromHome > 1.5) this.goTo(this.home.x, this.home.z, false, 3000);
        if (!this.path.length || fromHome < 1.5) {
          this.state = 'idle';
          this.hp = this.maxHp;
          g.ui.setHp(this.label, 1);
        }
      }
    }
    this.stepMove(dt);
  }
}

// ======================================================================= Juego
class Game {
  constructor() {
    this.canvas = $('c');
    this.settings = { sound: true, quality: isMobile ? 'media' : 'alta', ...(load(SETTINGS_KEY) || {}) };
    audio.enabled = this.settings.sound;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8fc6e8);
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 300);
    this.camOffset = new THREE.Vector3(1, 1.25, 1).normalize().multiplyScalar(60);
    this.camTarget = new THREE.Vector3(50, 0, 53);
    this.viewSize = 6;
    this.viewTarget = 6;
    this.time = 0;
    this.tod = 9;
    this.started = false;
    this.paused = false;
    this.dyn = [];
    this.enemies = [];
    this.npcs = [];
    this.guards = [];
    this.keys = new Set();
    this.talkingTo = null;

    this.hemi = new THREE.HemisphereLight(0xdfefff, 0x8a7a5a, 1.3);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 2.2);
    this.sunDir = new THREE.Vector3(-0.42, 1, 0.32).normalize();
    this.sun.castShadow = true;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.03;
    this.scene.add(this.sun, this.sun.target);
    this.torch = new THREE.PointLight(0xffb060, 0, 8, 1.4);
    this.scene.add(this.torch);

    this.W = generateWorld();
    this.islets = makeIslets();
    this.rooms = makeInteriors(this.W.buildings);
    attachRegions(this.W, [...this.islets, ...this.rooms]);
    this.docks = [
      { id: 'salitre', name: 'Puerto Salitre', shipX: this.W.ship.x, shipZ: this.W.ship.z, heading: 0, land: { x: 51, z: 92 } },
      ...this.islets.map((r) => r.dock),
    ];
    this.boat = { x: this.W.ship.x, z: this.W.ship.z, heading: 0, speed: 0, docked: 'salitre', waypoint: null };
    this.sailing = false;
    this.flags = {};
    this.chests = [];
    this.ui = new UI(this);
    this.buildWorld();
    this.buildMarkers();
    this.applyQuality();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 250));

    const save = load(SAVE_KEY);
    const sp = this.W.landmarks.spawn;
    this.quest = { stage: 0, progress: 0 };
    this.player = new Player(this, { name: 'Aventurero', outfit: 0, skin: 1, x: sp.x, z: sp.z });
    this.player.face = Math.PI / 4;
    this.spawnActors();
    this.initInput();
    this.initMenus(save);
    this.lastArea = '';
    this.mmT = 0;
    this.saveT = 0;
    this.areaT = 0;
    this.last = performance.now();
    $('loading').classList.add('hidden');
    requestAnimationFrame((t) => this.loop(t));
  }

  sfx(n) { sfx(n); }

  // ------------------------------------------------------------- mundo
  buildWorld() {
    const W = this.W;
    const tx = {
      stone: TX.makeStoneTexture(), plank: TX.makePlankTexture(), shingle: TX.makeShingleTexture(),
      thatch: TX.makeThatchTexture(), plaster: TX.makePlasterTexture(), flag: TX.makeFlagTexture(),
      clock: TX.makeClockTexture(), sail: TX.makeSailTexture(),
    };
    const M = createMaterials(tx);
    this.M = M;
    const groundTex = TX.makeGroundTexture(W, isMobile ? 20 : 24);
    groundTex.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    const { ground, sides } = buildTerrain(W, groundTex);
    this.scene.add(ground, sides);
    this.water = buildWater(W);
    this.scene.add(this.water);
    for (const r of this.islets) {
      const tex = TX.makeGroundTexture(r, 20);
      const t = buildTerrain(r, tex);
      this.scene.add(t.ground, t.sides);
    }

    const batch = new StaticBatcher();
    const addDyn = (dyn) => {
      if (dyn.children.length) {
        this.scene.add(dyn);
        dyn.updateMatrixWorld(true);
        dyn.children.forEach((c) => this.dyn.push(c));
      }
    };
    for (const b of W.buildings) {
      const { group, dyn } = makeBuilding(b, M);
      batch.add(group);
      addDyn(dyn);
      if (group.userData.smoke) {
        this.smokeSrc = group.localToWorld(group.userData.smoke.clone());
      }
    }
    const regB = this.islets.flatMap((r) => r.buildings);
    for (const b of regB) batch.add(makeBuilding(b, M).group);
    const allWalls = [...W.walls, ...this.islets.flatMap((r) => r.walls)];
    for (const w of allWalls) batch.add(makeWall(w, M));
    for (const t of W.towers) batch.add(makeTower(t, M));
    for (const p of [...W.props, ...this.islets.flatMap((r) => r.props)]) {
      const { group, dyn } = makeProp(p, M);
      batch.add(group);
      addDyn(dyn);
      if (p.type === 'chest') this.chests.push({ id: p.id || `cofre_${p.x}_${p.z}`, x: p.x, z: p.z, loot: p.loot || { gold: 30 } });
    }
    for (const r of this.rooms) {
      const { group, dyn } = buildRoom(r, M);
      batch.add(group);
      for (const d of dyn) { this.scene.add(d); this.dyn.push(d); }
    }
    for (const r of this.islets) batch.add(makeDocks(r, M));
    for (const l of W.lamps) batch.add(makeLamp(l, M));
    batch.add(makeDocks(W, M));
    const wreck = makeWreck(M, tx);
    wreck.position.set(W.wreck.x, 0, W.wreck.z);
    batch.add(wreck);
    batch.build(this.scene);

    this.ship = makeShip(M, tx);
    this.ship.position.set(this.boat.x, -0.05, this.boat.z);
    this.scene.add(this.ship);
    this.rowboat = makeRowboat(M);
    this.rowboat.position.set(W.rowboat.x, -0.02, W.rowboat.z);
    this.rowboat.rotation.y = 0.3;
    this.scene.add(this.rowboat);

    // árboles / rocas / decoración instanciados
    const TG = treeGeometries();
    const vmat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
    const col = new THREE.Color();
    this.treeMap = new Map();
    this.rockMap = new Map();
    this.regrow = [];
    const byType = {};
    const allTrees = [...W.trees, ...this.islets.flatMap((r) => r.trees)];
    const allRocks = [...W.rocks, ...this.islets.flatMap((r) => r.rocks)];
    const allDecor = [...W.decor, ...this.islets.flatMap((r) => r.decor)];
    for (const t of allTrees) (byType[t.type] = byType[t.type] || []).push(t);
    for (const [type, list] of Object.entries(byType)) {
      const im = new THREE.InstancedMesh(TG[type], vmat, list.length);
      list.forEach((t, i) => {
        t.mesh = im; t.index = i; t.hp = 3; t.down = false;
        this.setInst(im, i, t.x, 0, t.z, t.rot, t.s);
        const k = 0.86 + (t.hue ?? 0.5) * 0.14;
        if (type === 'autumn') col.setRGB(1, 0.75 + (t.hue ?? 0.5) * 0.25, 0.75 + (t.hue ?? 0.5) * 0.25);
        else col.setRGB(k, k + 0.02, k);
        im.setColorAt(i, col);
        this.treeMap.set(W.key(t.x, t.z), t);
      });
      im.castShadow = true;
      im.receiveShadow = true;
      im.instanceMatrix.needsUpdate = true;
      this.scene.add(im);
    }
    const rim = new THREE.InstancedMesh(TG.rock, vmat, allRocks.length);
    allRocks.forEach((r, i) => {
      r.mesh = rim; r.index = i; r.hp = 3; r.down = false; r.rot = (r.x * 7 + r.z * 13) % 6.28;
      this.setInst(rim, i, r.x, 0, r.z, r.rot, r.s * 1.6);
      const k = 0.85 + ((r.x * 31 + r.z * 17) % 10) / 70;
      rim.setColorAt(i, col.setRGB(k, k, k * 0.98));
      this.rockMap.set(W.key(r.x, r.z), r);
    });
    rim.castShadow = true;
    rim.receiveShadow = true;
    this.scene.add(rim);

    const decoBy = {};
    for (const d of allDecor) (decoBy[d.type] = decoBy[d.type] || []).push(d);
    const flowerCols = [0xf05a8a, 0xf8e050, 0xffffff, 0xa070f0];
    for (const [type, list] of Object.entries(decoBy)) {
      const im = new THREE.InstancedMesh(TG[type], vmat, list.length);
      list.forEach((d, i) => {
        e.set(0, d.rot, 0);
        q.setFromEuler(e);
        m4.compose(ps.set(d.x, 0, d.z), q, sc.setScalar(d.s));
        im.setMatrixAt(i, m4);
        if (type === 'flower') im.setColorAt(i, col.set(flowerCols[d.c]));
      });
      im.receiveShadow = true;
      this.scene.add(im);
    }
  }
  setInst(im, i, x, y, z, rot, s) {
    const m4 = new THREE.Matrix4();
    m4.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rot, 0)), new THREE.Vector3(s, s, s));
    im.setMatrixAt(i, m4);
    im.instanceMatrix.needsUpdate = true;
  }

  buildMarkers() {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.36, 0.46, 28), new THREE.MeshBasicMaterial({ color: 0xff4a3a, transparent: true, opacity: 0.85, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.visible = false;
    this.selection = ring;
    this.scene.add(ring);
    const cur = new THREE.Group();
    const cm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false });
    for (const [x, z, w, d] of [[0, -0.46, 0.96, 0.05], [0, 0.46, 0.96, 0.05], [-0.46, 0, 0.05, 0.96], [0.46, 0, 0.05, 0.96]]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), cm);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0, z);
      cur.add(m);
    }
    cur.rotation.y = 0;
    cur.visible = false;
    this.cursor = cur;
    this.cursorMat = cm;
    this.scene.add(cur);
  }

  spawnActors() {
    const W = this.W;
    const npcDefs = [...W.npcs, ...this.islets.flatMap((r) => r.npcs), ...this.rooms.flatMap((r) => r.npcs)];
    for (const d of npcDefs) this.npcs.push(new NPC(this, d));
    for (const s of [...W.spawns, ...this.islets.flatMap((r) => r.spawns)]) {
      for (let i = 0; i < s.count; i++) this.enemies.push(new Enemy(this, s.type, s, s.lvl));
    }
    for (const r of this.rooms) {
      r.doorLabel = this.ui.makeLabel('door', '🚪 ' + r.name);
      r.exitLabel = this.ui.makeLabel('door', '🚪 Salir');
    }
    for (const t of W.towers) {
      if (!t.guard) continue;
      const m = HUM({ shirt: 0x3a5a8a, pants: 0x2a2a3a, hat: 'helmet', armor: true, spear: true, skin: 0xe0aa80 });
      m.root.position.set(t.x, 2.51, t.z);
      this.scene.add(m.root);
      this.guards.push({ m, st: {}, base: Math.random() * 6 });
    }
  }

  // ------------------------------------------------------------- calidad
  applyQuality() {
    const q = this.settings.quality;
    const dpr = window.devicePixelRatio || 1;
    this.renderer.setPixelRatio(q === 'alta' ? Math.min(dpr, 2) : q === 'media' ? Math.min(dpr, 1.5) : 1);
    this.sun.castShadow = q !== 'baja';
    const size = q === 'alta' ? 2048 : 1024;
    if (this.sun.shadow.mapSize.x !== size) {
      this.sun.shadow.mapSize.set(size, size);
      if (this.sun.shadow.map) {
        this.sun.shadow.map.dispose();
        this.sun.shadow.map = null;
      }
    }
    this.resize();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setSize(this.width, this.height, false);
    this.updateCamera();
  }
  updateCamera() {
    const aspect = this.width / this.height;
    let vw, vh;
    if (aspect >= 1) { vh = this.viewSize; vw = vh * aspect; } else { vw = this.viewSize; vh = vw / aspect; }
    const c = this.camera;
    c.left = -vw / 2; c.right = vw / 2; c.top = vh / 2; c.bottom = -vh / 2;
    c.updateProjectionMatrix();
    const s = Math.max(vw, vh) * 0.85 + 4;
    const sc = this.sun.shadow.camera;
    if (Math.abs(sc.right - s) > 0.5) {
      sc.left = -s; sc.right = s; sc.top = s; sc.bottom = -s;
      sc.near = 1; sc.far = 120;
      sc.updateProjectionMatrix();
    }
  }

  // ------------------------------------------------------------- entrada
  initInput() {
    const cv = this.canvas;
    const pts = new Map();
    let pinch = null;
    cv.addEventListener('pointerdown', (e) => {
      cv.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now() });
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), v: this.viewTarget };
      }
    });
    cv.addEventListener('pointermove', (e) => {
      const p = pts.get(e.pointerId);
      if (!p) return;
      p.x = e.clientX; p.y = e.clientY;
      if (pinch && pts.size === 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        this.viewTarget = clamp(pinch.v * (pinch.d / Math.max(20, d)), 6, 26);
      }
    });
    const up = (e) => {
      const p = pts.get(e.pointerId);
      if (!p) return;
      pts.delete(e.pointerId);
      const moved = Math.hypot(p.x - p.sx, p.y - p.sy);
      if (!pinch && moved < 14 && performance.now() - p.t < 600) this.onTap(e.clientX, e.clientY);
      if (pts.size < 2 && pinch) { if (pts.size === 0) pinch = null; }
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', (e) => { pts.delete(e.pointerId); if (!pts.size) pinch = null; });
    cv.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.viewTarget = clamp(this.viewTarget * (e.deltaY > 0 ? 1.1 : 0.9), 6, 26);
    }, { passive: false });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('keydown', (e) => {
      if (e.target && e.target.tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      this.keys.add(k);
      if (!this.started) return;
      if (k === ' ' || k === 'f') { e.preventDefault(); this.doAction(); }
      if (k === 'q') this.player.usePotion();
      if (k === 'm' || k === 'tab') { e.preventDefault(); $('minimapWrap').click(); }
      if (k === 'escape') {
        if (this.ui.dialogOpen) this.ui.closeDialog();
        else this.toggleMenu();
      }
      if (this.ui.dialogOpen && /^[1-9]$/.test(k)) {
        const b = $('dopts').children[Number(k) - 1];
        if (b) b.click();
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.keys.clear());

    $('btnAction').addEventListener('click', () => this.doAction());
    $('btnPotion').addEventListener('click', () => this.player.usePotion());
    $('btnMenu').addEventListener('click', () => this.toggleMenu());
    window.onAndroidBack = () => {
      if (!this.started) return false;
      if (this.ui.mmBig) { $('minimapWrap').click(); return true; }
      if (this.ui.dialogOpen) { this.ui.closeDialog(); return true; }
      this.toggleMenu();
      return true;
    };
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.started) this.save();
    });
  }

  joyVector() {
    if (!this.started || this.paused) return null;
    const j = this.ui.joy;
    if (j.active) return { x: j.x, y: j.y };
    const k = this.keys;
    let x = 0, y = 0;
    if (k.has('w') || k.has('arrowup')) y += 1;
    if (k.has('s') || k.has('arrowdown')) y -= 1;
    if (k.has('d') || k.has('arrowright')) x += 1;
    if (k.has('a') || k.has('arrowleft')) x -= 1;
    if (!x && !y) return null;
    return { x, y };
  }
  // dirección de pantalla -> paso de cuadrícula (cámara mirando hacia -x,-z)
  joyToGrid(j) {
    const wx = j.x - j.y;
    const wz = -j.x - j.y;
    const a = Math.atan2(wz, wx);
    const o = Math.round(a / (Math.PI / 4));
    const ang = o * (Math.PI / 4);
    return [Math.round(Math.cos(ang)), Math.round(Math.sin(ang))];
  }

  screenOf(x, y, z) {
    const v = new THREE.Vector3(x, y, z).project(this.camera);
    return { x: (v.x * 0.5 + 0.5) * this.width, y: (-v.y * 0.5 + 0.5) * this.height };
  }

  onTap(sx, sy) {
    if (!this.started || this.paused) return;
    if (this.ui.mmBig) return;
    if (this.ui.dialogOpen) { this.ui.closeDialog(); return; }
    const p = this.player;
    if (p.dead) return;
    sfx('click');
    if (this.sailing) {
      const hp = this.groundPoint(sx, sy);
      if (hp) { this.boat.waypoint = { x: hp.x, z: hp.z }; this.showCursor(Math.round(hp.x), Math.round(hp.z)); }
      return;
    }
    // 1. personajes (en espacio de pantalla, para tocar la figura completa)
    let best = null, bd = 46;
    const consider = (a, kind) => {
      const h = a.model.height;
      for (const yy of [h * 0.35, h * 0.8]) {
        const s = this.screenOf(a.x, yy, a.z);
        const d = Math.hypot(s.x - sx, s.y - sy);
        if (d < bd) { bd = d; best = { a, kind }; }
      }
    };
    for (const e of this.enemies) if (!e.dead && e.model.root.visible && e.dist(p) < 25) consider(e, 'enemy');
    for (const n of this.npcs) if (n.dist(p) < 25) consider(n, 'npc');
    if (best) {
      if (best.kind === 'enemy') {
        p.setTarget({ kind: 'enemy', ref: best.a });
        this.selection.visible = true;
        this.selTarget = best.a;
      } else {
        p.setTarget({ kind: 'npc', ref: best.a });
        this.selection.visible = false;
      }
      return;
    }
    // 1b. barco, puertas y cofres
    const inRoom = this.roomAt(p.x, p.z);
    if (!inRoom && this.boat.docked) {
      const s = this.screenOf(this.boat.x, 1.0, this.boat.z);
      if (Math.hypot(s.x - sx, s.y - sy) < 75 && Math.hypot(this.boat.x - p.x, this.boat.z - p.z) < 30) { p.setTarget({ kind: 'ship' }); return; }
    }
    if (!inRoom) {
      for (const r of this.rooms) {
        if (Math.hypot(r.front.x - p.x, r.front.z - p.z) > 25) continue;
        const s = this.screenOf((r.door.x + r.front.x) / 2, 0.55, (r.door.z + r.front.z) / 2);
        if (Math.hypot(s.x - sx, s.y - sy) < 42) { p.setTarget({ kind: 'door', ref: r }); this.showCursor(r.front.x, r.front.z); return; }
      }
    }
    for (const c of this.chests) {
      if (Math.hypot(c.x - p.x, c.z - p.z) > 25) continue;
      const s = this.screenOf(c.x, 0.3, c.z);
      if (Math.hypot(s.x - sx, s.y - sy) < 38) { p.setTarget({ kind: 'chest', ref: c }); return; }
    }
    // 2. punto del suelo
    const ndc = new THREE.Vector2((sx / this.width) * 2 - 1, -(sy / this.height) * 2 + 1);
    const rc = new THREE.Raycaster();
    rc.setFromCamera(ndc, this.camera);
    const hit = new THREE.Vector3();
    if (!rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit)) return;
    const tx = Math.round(hit.x), tz = Math.round(hit.z);
    // 3. árboles y rocas (copas incluidas)
    let res = null, rd = 40;
    for (let dz = -3; dz <= 1; dz++) for (let dx = -3; dx <= 1; dx++) {
      const k = this.W.key(tx + dx, tz + dz);
      for (const [map, kind, yy] of [[this.treeMap, 'tree', 0.9], [this.rockMap, 'rock', 0.25]]) {
        const o = map.get(k);
        if (!o || o.down) continue;
        for (const y of [0.15, yy * o.s]) {
          const s = this.screenOf(o.x, y, o.z);
          const d = Math.hypot(s.x - sx, s.y - sy);
          if (d < rd) { rd = d; res = { o, kind }; }
        }
      }
    }
    if (res) {
      p.setTarget({ kind: res.kind, ref: res.o });
      this.selection.visible = false;
      this.showCursor(res.o.x, res.o.z);
      return;
    }
    this.selection.visible = false;
    let gx = tx, gz = tz;
    if (!this.W.walkable(gx, gz)) {
      let found = null, fd = 99;
      for (let r = 1; r <= 2 && !found; r++) {
        for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
          if (this.W.walkable(tx + dx, tz + dz)) {
            const d = Math.hypot(tx + dx - p.x, tz + dz - p.z);
            if (d < fd) { fd = d; found = [tx + dx, tz + dz]; }
          }
        }
      }
      if (!found) return;
      [gx, gz] = found;
    }
    p.setTarget({ kind: 'tile', x: gx, z: gz });
    this.showCursor(gx, gz);
  }
  groundPoint(sx, sy) {
    const ndc = new THREE.Vector2((sx / this.width) * 2 - 1, -(sy / this.height) * 2 + 1);
    const rc = new THREE.Raycaster();
    rc.setFromCamera(ndc, this.camera);
    const hit = new THREE.Vector3();
    return rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit) ? hit : null;
  }

  // ------------------------------------------------------------- interiores
  roomAt(x, z) { const r = this.W.regionAt(x, z); return r && r.kind === 'interior' ? r : null; }
  doorAt(x, z) { return this.rooms.find((r) => r.door.x === x && r.door.z === z) || null; }
  checkTriggers(p) {
    const r = this.roomAt(p.x, p.z);
    if (r && p.tx === r.exit.x && p.tz === r.exit.z) this.exitRoom(r);
  }
  enterRoom(r) {
    const p = this.player;
    p.x = r.inside.x; p.z = r.inside.z; p.path = []; p.target = null;
    p.face = Math.PI;
    this.selection.visible = false;
    this.camTarget.set(p.x, 0, p.z);
    for (const e of this.enemies) if (e.state === 'chase') { e.state = 'return'; e.path = []; }
    this.ui.toast(r.name, 'area');
    this.lastArea = r.name;
    sfx('click');
  }
  exitRoom(r) {
    const p = this.player;
    p.x = r.front.x; p.z = r.front.z; p.path = []; p.target = null;
    p.face = Math.atan2(r.front.x - r.door.x, r.front.z - r.door.z);
    this.camTarget.set(p.x, 0, p.z);
    sfx('click');
  }

  // ------------------------------------------------------------- barco
  shipLocal(px, pz) {
    const b = this.boat;
    const dx = px - b.x, dz = pz - b.z;
    const fx = Math.sin(b.heading), fz = Math.cos(b.heading);
    return { lz: dx * fx + dz * fz, lx: dx * fz - dz * fx };
  }
  canBoard() {
    if (this.sailing || !this.boat.docked) return false;
    const p = this.player;
    if (this.W.isInterior(p.x)) return false;
    const { lx, lz } = this.shipLocal(p.x, p.z);
    return Math.abs(lz) <= 4.2 && Math.abs(lx) <= 3.3;
  }
  board() {
    const p = this.player, b = this.boat;
    this.lastDock = b.docked;
    this.sailing = true;
    b.docked = null;
    b.speed = 0;
    b.waypoint = null;
    p.target = null; p.path = []; p.st.moving = false; p.st.gather = 0;
    this.selection.visible = false;
    this.ship.add(p.model.root);
    p.model.root.position.set(0, 1.42, -2.75);
    p.model.root.rotation.set(0, 0, 0);
    this.viewTarget = Math.max(this.viewTarget, isMobile ? 16 : 18);
    this.ui.toast('⛵ ¡A navegar! Joystick o toca el mar');
    sfx('quest');
  }
  nearDock() {
    const b = this.boat;
    for (const d of this.docks) if (Math.hypot(b.x - d.shipX, b.z - d.shipZ) < 7) return d;
    return null;
  }
  dock(d) {
    const p = this.player, b = this.boat;
    b.x = d.shipX; b.z = d.shipZ; b.heading = d.heading; b.speed = 0; b.docked = d.id; b.waypoint = null;
    this.sailing = false;
    this.scene.add(p.model.root);
    p.model.root.rotation.set(0, 0, 0);
    p.x = d.land.x; p.z = d.land.z; p.path = [];
    this.camTarget.set(p.x, 0, p.z);
    this.viewTarget = isMobile ? 11.5 : 13;
    this.ui.toast('⚓ ' + d.name, 'area');
    sfx('coin');
    this.save();
  }
  shipBlocked(x, z, h) {
    const fx = Math.sin(h), fz = Math.cos(h), rx = Math.cos(h), rz = -Math.sin(h);
    for (const [a, c] of [[3.6, 0], [1.6, 1.15], [1.6, -1.15], [-1.4, 1.15], [-1.4, -1.15], [-3.4, 0.6], [-3.4, -0.6]]) {
      const px = x + fx * a + rx * c, pz = z + fz * a + rz * c;
      if (this.W.tileAll(Math.round(px), Math.round(pz)) !== T.WATER) return true;
    }
    return x < -26 || z < -26 || x > 166 || z > 166;
  }
  updateBoat(dt) {
    const b = this.boat, p = this.player;
    const j = this.joyVector();
    let want = null, throttle = 0;
    if (j) {
      b.waypoint = null;
      want = Math.atan2(j.x - j.y, -j.x - j.y);
      throttle = Math.min(1, Math.hypot(j.x, j.y));
    } else if (b.waypoint) {
      const dx = b.waypoint.x - b.x, dz = b.waypoint.z - b.z;
      const d = Math.hypot(dx, dz);
      if (d < 2) b.waypoint = null;
      else { want = Math.atan2(dx, dz); throttle = Math.min(1, d / 5); }
    }
    let target = 0, diff = 0;
    const prevHeading = b.heading;
    if (want !== null) {
      diff = want - b.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const rate = 1.3 + Math.abs(b.speed) * 0.08;
      b.heading += clamp(diff, -rate * dt, rate * dt);
      target = 5.5 * throttle * Math.max(0.2, Math.cos(diff));
    }
    b.speed += (target - b.speed) * Math.min(1, dt * (target > b.speed ? 0.9 : 1.3));
    const nx = b.x + Math.sin(b.heading) * b.speed * dt;
    const nz = b.z + Math.cos(b.heading) * b.speed * dt;
    if (!this.shipBlocked(nx, nz, b.heading)) { b.x = nx; b.z = nz; }
    else {
      // el giro choca: seguimos con el rumbo anterior si se puede
      b.heading = prevHeading;
      const ox = b.x + Math.sin(prevHeading) * b.speed * dt, oz = b.z + Math.cos(prevHeading) * b.speed * dt;
      if (!this.shipBlocked(ox, oz, prevHeading)) { b.x = ox; b.z = oz; }
      else b.speed *= -0.3;
    }
    b.roll = (b.roll || 0) + ((-clamp(diff, -1, 1) * 0.07 * Math.min(1, Math.abs(b.speed) / 3)) - (b.roll || 0)) * Math.min(1, dt * 3);
    p.x = b.x; p.z = b.z;
  }

  openChest(c) {
    const p = this.player;
    if (this.flags[c.id]) return this.ui.toast('El cofre está vacío');
    this.flags[c.id] = true;
    const gold = c.loot.gold || 0, pot = c.loot.potion || 0;
    p.gold += gold;
    p.inv.potion += pot;
    this.ui.float(`+${gold} oro`, 'gold', c.x, 1.0, c.z);
    if (pot) setTimeout(() => this.ui.float(`+${pot} 🍶`, 'info', c.x, 1.3, c.z), 300);
    this.ui.toast(`🎁 ¡Tesoro! +${gold} oro${pot ? ` y ${pot} ron` : ''}`);
    sfx('coin');
    setTimeout(() => sfx('quest'), 250);
    const cur = QUESTS[this.quest.stage];
    if (cur && cur.type === 'chest' && cur.target === c.id) this.advanceQuest();
    this.save();
  }

  showCursor(x, z) {
    this.cursor.visible = true;
    this.cursor.position.set(x, this.W.groundY(x, z) + 0.02, z);
    this.cursorT = 1.2;
  }

  // ------------------------------------------------------------- acciones
  contextAction() {
    const p = this.player;
    if (this.sailing) {
      const d = this.nearDock();
      return d ? { icon: '⚓', label: 'Atracar', fn: () => this.dock(d) } : { icon: '⛵', label: 'Navegar', fn: () => this.ui.toast('Usa el joystick o toca el mar') };
    }
    const inRoom = this.roomAt(p.x, p.z);
    if (inRoom && Math.hypot(p.x - inRoom.exit.x, p.z - inRoom.exit.z) < 2.3) return { icon: '🚪', label: 'Salir', fn: () => this.exitRoom(inRoom) };
    if (!inRoom) {
      for (const r of this.rooms) if (Math.hypot(p.x - r.front.x, p.z - r.front.z) < 1.6) return { icon: '🚪', label: 'Entrar', fn: () => p.setTarget({ kind: 'door', ref: r }) };
      if (this.canBoard()) return { icon: '⛵', label: 'Zarpar', fn: () => this.board() };
    }
    for (const c of this.chests) {
      if (!this.flags[c.id] && Math.max(Math.abs(c.x - p.tx), Math.abs(c.z - p.tz)) <= 1) return { icon: '🎁', label: 'Abrir', fn: () => p.setTarget({ kind: 'chest', ref: c }) };
    }
    if (p.target && p.target.kind === 'enemy') return { icon: '⚔️', label: 'Atacar', fn: null };
    let ne = null, nd = 5;
    for (const e of this.enemies) { if (e.dead) continue; const d = e.dist(p); if (d < nd) { nd = d; ne = e; } }
    let nn = null, nnd = 2.2;
    for (const n of this.npcs) { const d = n.dist(p); if (d < nnd) { nnd = d; nn = n; } }
    if (nn && (!ne || nnd < 1.8)) return { icon: '💬', label: 'Hablar', fn: () => p.setTarget({ kind: 'npc', ref: nn }) };
    if (ne) return { icon: '⚔️', label: 'Atacar', fn: () => { p.setTarget({ kind: 'enemy', ref: ne }); this.selection.visible = true; this.selTarget = ne; } };
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const k = this.W.key(p.tx + dx, p.tz + dz);
      const t = this.treeMap.get(k);
      if (t && !t.down) return { icon: '🪓', label: 'Talar', fn: () => p.setTarget({ kind: 'tree', ref: t }) };
      const r = this.rockMap.get(k);
      if (r && !r.down) return { icon: '⛏️', label: 'Picar', fn: () => p.setTarget({ kind: 'rock', ref: r }) };
    }
    return { icon: '⚔️', label: 'Atacar', fn: null };
  }
  doAction() {
    if (!this.started || this.paused || this.player.dead) return;
    if (this.ui.dialogOpen) return;
    const a = this.contextAction();
    if (a.fn) a.fn();
    else this.ui.toast('No hay nada cerca');
  }

  talkTo(n) {
    const d = dialogFor(n.id, this);
    this.talkingTo = n;
    n.talking = true;
    n.path = n.path.slice(0, 1);
    this.ui.openDialog(n.name, d.text, d.options);
  }

  buy(cost, fn) {
    const p = this.player;
    if ((cost.gold || 0) > p.gold) return this.ui.toast('No tienes suficiente oro');
    if ((cost.stone || 0) > p.inv.stone) return this.ui.toast('Te falta piedra');
    if ((cost.wood || 0) > p.inv.wood) return this.ui.toast('Te falta madera');
    p.gold -= cost.gold || 0;
    p.inv.stone -= cost.stone || 0;
    p.inv.wood -= cost.wood || 0;
    sfx('coin');
    fn();
    this.save();
  }

  harvest(o, kind) {
    const p = this.player;
    o.hp--;
    if (kind === 'tree') { p.inv.wood++; this.ui.float('+1 🪵', 'info', o.x, 1.4, o.z); }
    else { p.inv.stone++; this.ui.float('+1 🪨', 'info', o.x, 0.9, o.z); }
    if (Math.random() < 0.15) { p.gold += 1; this.ui.float('+1 oro', 'gold', o.x, 1.1, o.z); }
    p.gainXp(2);
    if (o.hp <= 0) {
      o.down = true;
      o.downT = 0;
      this.setInst(o.mesh, o.index, o.x, 0, o.z, o.rot, kind === 'tree' ? o.s * 0.18 : 0.001);
      this.W.setBlocked(o.x, o.z, 0);
      this.regrow.push({ o, kind, t: kind === 'tree' ? 50 : 70 });
      p.target = null;
      p.st.gather = 0;
      sfx(kind === 'tree' ? 'chop' : 'mine');
    }
    const cur = QUESTS[this.quest.stage];
    if (cur && cur.type === 'gather' && cur.target === (kind === 'tree' ? 'wood' : 'stone') && p.inv[cur.target] === cur.count) {
      const giver = this.npcs.find((n) => n.id === cur.giver);
      this.ui.toast(`✔ Ya tienes ${cur.count}. Ve con ${giver ? giver.name : ''}`);
      sfx('quest');
    }
  }

  damageEnemy(e, dmg, crit) {
    const g = this;
    e.hp -= dmg;
    e.st.flash = 0.18;
    if (e.state !== 'chase') { e.state = 'chase'; e.thinkT = 0; }
    g.ui.float(String(dmg), crit ? 'crit' : 'pdmg', e.x, e.model.height + 0.2, e.z);
    g.ui.setHp(e.label, Math.max(0, e.hp) / e.maxHp);
    sfx('hit');
    if (e.hp <= 0) {
      e.dead = true;
      e.deadT = 0;
      e.path = [];
      e.label.el.style.display = 'none';
      e.label._vis = false;
      const p = this.player;
      const gold = e.def.gold(e.level);
      const xp = Math.round(e.def.xp(e.level));
      p.gold += gold;
      setTimeout(() => this.ui.float(`+${gold} oro`, 'gold', e.x, 0.8, e.z), 200);
      this.ui.float(`+${xp} XP`, 'info', e.x, 1.2, e.z);
      sfx('coin');
      if (Math.random() < (e.type === 'boss' ? 1 : 0.08)) { p.inv.potion++; this.ui.toast('🍶 ¡Encontraste ron curativo!'); }
      p.gainXp(xp);
      if (this.selTarget === e) this.selection.visible = false;
      this.onKill(e.type);
    }
  }

  damagePlayer(e, atk) {
    const p = this.player;
    if (p.dead) return;
    const dmg = Math.max(1, Math.round(atk * (0.8 + Math.random() * 0.4) - p.def));
    p.hp -= dmg;
    p.lastCombat = this.time;
    p.st.flash = 0.18;
    this.ui.float('-' + dmg, 'dmg', p.x, 1.3, p.z);
    sfx('hurt');
    if (!p.target && !this.joyVector()) {
      p.setTarget({ kind: 'enemy', ref: e });
      this.selection.visible = true;
      this.selTarget = e;
    }
    if (p.hp <= 0) {
      p.hp = 0;
      p.dead = true;
      p.deadT = 3;
      p.path = [];
      p.target = null;
      this.selection.visible = false;
      sfx('die');
      this.ui.toast('💀 Has caído… despertarás en Villarroca');
    }
  }

  respawnPlayer() {
    const p = this.player;
    const sp = this.W.landmarks.spawn;
    p.dead = false;
    p.x = sp.x; p.z = sp.z;
    p.path = [];
    p.hp = p.maxHp;
    const lost = Math.floor(p.gold * 0.1);
    p.gold -= lost;
    p.model.root.rotation.z = 0;
    if (lost) this.ui.toast(`Perdiste ${lost} de oro`);
    if (this.boat.docked !== 'salitre') {
      const d = this.docks[0];
      Object.assign(this.boat, { x: d.shipX, z: d.shipZ, heading: d.heading, speed: 0, docked: d.id });
      setTimeout(() => this.ui.toast('⛵ La tripulación devolvió el barco a Puerto Salitre'), 1500);
    }
    for (const e of this.enemies) if (e.state === 'chase') { e.state = 'return'; e.path = []; }
  }

  // ------------------------------------------------------------- misiones
  npcById(id) { return this.npcs.find((n) => n.id === id); }
  onKill(type) {
    const cur = QUESTS[this.quest.stage];
    if (!cur || cur.type !== 'kill' || cur.target !== type) return;
    this.quest.progress++;
    if (this.quest.progress === cur.count) {
      const gv = this.npcById(cur.giver);
      this.ui.toast(`✔ ¡Objetivo cumplido! Vuelve con ${gv ? gv.name : ''}`);
      sfx('quest');
    }
  }
  advanceQuest() {
    const cur = QUESTS[this.quest.stage];
    const p = this.player;
    if (cur.reward) {
      if (cur.reward.gold) p.gold += cur.reward.gold;
      if (cur.reward.weapon) p.weapon += cur.reward.weapon;
      if (cur.reward.xp) p.gainXp(cur.reward.xp);
      this.ui.float(`+${cur.reward.gold || 0} oro`, 'gold', p.x, 1.6, p.z);
    }
    if (this.quest.stage > 0 || cur.type !== 'talk') this.ui.toast('📜 Misión completada');
    this.quest.stage = Math.min(QUESTS.length - 1, this.quest.stage + 1);
    this.quest.progress = 0;
    const nq = QUESTS[this.quest.stage];
    setTimeout(() => this.ui.toast('Nueva misión: ' + nq.title), 900);
    if (nq.type === 'chest' && this.flags[nq.target]) setTimeout(() => this.advanceQuest(), 2500);
    sfx('quest');
    this.save();
  }
  questInfo() {
    const q = this.quest;
    const cur = QUESTS[q.stage];
    let prog = '';
    if (cur.type === 'kill') {
      const gv = this.npcById(cur.giver);
      prog = q.progress >= cur.count ? `✔ Completado — vuelve con ${gv ? gv.name : ''}` : `${q.progress} / ${cur.count}`;
    } else if (cur.type === 'gather') {
      const have = this.player.inv[cur.target];
      prog = `${Math.min(have, cur.count)} / ${cur.count} ${cur.target === 'wood' ? 'madera' : 'piedra'}`;
    }
    return { title: cur.title, desc: cur.desc, prog };
  }
  questMarker() {
    const q = this.quest;
    const cur = QUESTS[q.stage];
    if (!cur || cur.type === 'done') return null;
    const npc = (id) => { const n = this.npcById(id); return n ? { x: n.x, z: n.z } : null; };
    if (cur.type === 'talk') return npc(cur.target);
    if (cur.type === 'kill') {
      if (q.progress >= cur.count) return npc(cur.giver);
      const zones = { wolf: [50, 20], crab: [70, 80], boar: [20, 41], skeleton: [85, 50], boss: [87, 56] };
      const z = zones[cur.target];
      return { x: z[0], z: z[1] };
    }
    if (cur.type === 'chest') {
      const c = this.chests.find((k) => k.id === cur.target);
      return c ? { x: c.x, z: c.z } : null;
    }
    if (cur.type === 'gather') {
      if (this.player.inv[cur.target] >= cur.count) return npc(cur.giver);
      return cur.target === 'wood' ? { x: 50, z: 28 } : { x: 20, z: 41 };
    }
    return null;
  }
  npcMark(n) {
    const q = this.quest;
    const cur = QUESTS[q.stage];
    if (!cur) return '';
    if (cur.type === 'talk' && cur.target === n.id) return '!';
    if (cur.giver === n.id) {
      if (cur.type === 'kill') return q.progress >= cur.count ? '!' : '?';
      if (cur.type === 'gather') return this.player.inv[cur.target] >= cur.count ? '!' : '?';
    }
    return '';
  }

  // ------------------------------------------------------------- guardado
  save() {
    if (!this.started) return;
    const p = this.player;
    store(SAVE_KEY, {
      v: 1, name: p.name, outfit: p.outfit, skin: p.skin, level: p.level, xp: p.xp, gold: p.gold, hp: p.hp,
      weapon: p.weapon, armor: p.armor, inv: p.inv, quest: this.quest, tod: this.tod, flags: this.flags,
      ...(this.sailing
        ? (() => { const d = this.docks.find((k) => k.id === this.lastDock) || this.docks[0]; return { x: d.land.x, z: d.land.z, boatDock: d.id }; })()
        : { x: p.tx, z: p.tz, boatDock: this.boat.docked }),
    });
  }

  // ------------------------------------------------------------- menús
  initMenus(save) {
    const outBox = $('outfits');
    const skinBox = $('skins');
    let outfit = 0, skin = 1;
    const swatch = { caballero: '#2f5a9a', corsario: '#9a1f24', exploradora: '#3a7a3a', mercenario: '#4a3a5a' };
    const refresh = () => {
      [...outBox.children].forEach((c, i) => c.classList.toggle('sel', i === outfit));
      [...skinBox.children].forEach((c, i) => c.classList.toggle('sel', i === skin));
      this.player.setLook(outfit, skin);
    };
    OUTF.forEach((o, i) => {
      const b = document.createElement('button');
      b.className = 'ofit';
      b.innerHTML = `<span class="sw" style="background:${swatch[o.id]}"></span>${o.name}`;
      b.addEventListener('click', () => { outfit = i; sfx('click'); refresh(); });
      outBox.appendChild(b);
    });
    SKINS.forEach((s, i) => {
      const b = document.createElement('button');
      b.className = 'skin';
      b.style.background = '#' + s.toString(16).padStart(6, '0');
      b.addEventListener('click', () => { skin = i; sfx('click'); refresh(); });
      skinBox.appendChild(b);
    });
    refresh();
    if (save && save.v === 1) {
      $('btnContinue').classList.remove('hidden');
      $('btnContinue').addEventListener('click', () => this.startGame(save));
    }
    $('btnNew').addEventListener('click', () => {
      const name = ($('nameInput').value || 'Aventurero').trim().slice(0, 14) || 'Aventurero';
      const sp = this.W.landmarks.spawn;
      this.startGame({ v: 1, name, outfit, skin, x: sp.x, z: sp.z, quest: { stage: 0, progress: 0 }, fresh: true });
    });

    if (window.AndroidBridge) document.body.classList.add('android');
    $('menu').addEventListener('click', (e) => {
      if (e.target.id === 'menu') this.toggleMenu(false);
      const act = e.target.dataset && e.target.dataset.act;
      if (!act) return;
      sfx('click');
      if (act === 'resume') this.toggleMenu(false);
      if (act === 'save') { this.save(); this.ui.toast('💾 Partida guardada'); this.toggleMenu(false); }
      if (act === 'sound') {
        this.settings.sound = !this.settings.sound;
        audio.enabled = this.settings.sound;
        store(SETTINGS_KEY, this.settings);
        this.refreshMenu();
      }
      if (act === 'quality') {
        const order = ['baja', 'media', 'alta'];
        this.settings.quality = order[(order.indexOf(this.settings.quality) + 1) % 3];
        store(SETTINGS_KEY, this.settings);
        this.applyQuality();
        this.refreshMenu();
      }
      if (act === 'help') $('help').classList.toggle('hidden');
      if (act === 'reset') {
        if (confirm('¿Borrar la partida guardada y empezar de cero?')) {
          try { localStorage.removeItem(SAVE_KEY); } catch (err) { /* nada */ }
          location.reload();
        }
      }
      if (act === 'exit') { this.save(); if (window.AndroidBridge) window.AndroidBridge.exit(); }
    });
  }
  refreshMenu() {
    const p = this.player;
    const q = { baja: 'Baja', media: 'Media', alta: 'Alta' }[this.settings.quality];
    $('menu').querySelector('[data-act=sound]').textContent = 'Sonido: ' + (this.settings.sound ? 'Sí' : 'No');
    $('menu').querySelector('[data-act=quality]').textContent = 'Calidad: ' + q;
    $('mstats').innerHTML = `
      <span>Nombre: <b>${p.name.replace(/[<>&]/g, '')}</b></span><span>Nivel: <b>${p.level}</b></span>
      <span>Salud: <b>${Math.ceil(p.hp)} / ${p.maxHp}</b></span><span>Ataque: <b>${Math.round(p.atk)}</b></span>
      <span>Arma: <b>Nv. ${p.weapon}</b></span><span>Armadura: <b>Nv. ${p.armor}</b></span>
      <span>Oro: <b>${p.gold}</b></span><span>XP: <b>${p.xp} / ${p.xpNext()}</b></span>`;
  }
  toggleMenu(force) {
    if (!this.started) return;
    const open = force ?? $('menu').classList.contains('hidden');
    $('menu').classList.toggle('hidden', !open);
    this.paused = open;
    if (open) { this.refreshMenu(); this.save(); }
  }

  startGame(data) {
    const p = this.player;
    p.name = data.name;
    p.label.nm.textContent = data.name;
    p.setLook(data.outfit, data.skin);
    p.level = data.level || 1;
    p.xp = data.xp || 0;
    p.gold = data.gold ?? 10;
    p.weapon = data.weapon || 0;
    p.armor = data.armor || 0;
    p.inv = { wood: 0, stone: 0, potion: 2, ...(data.inv || {}) };
    p.recalc();
    p.hp = data.hp ?? p.maxHp;
    if (p.hp <= 0) p.hp = p.maxHp;
    p.x = data.x; p.z = data.z;
    if (!this.W.walkable(p.x, p.z)) { p.x = this.W.landmarks.spawn.x; p.z = this.W.landmarks.spawn.z; }
    this.quest = data.quest || { stage: 0, progress: 0 };
    this.flags = data.flags || {};
    const bd = this.docks.find((k) => k.id === data.boatDock) || this.docks[0];
    Object.assign(this.boat, { x: bd.shipX, z: bd.shipZ, heading: bd.heading, speed: 0, docked: bd.id });
    if (data.tod) this.tod = data.tod;
    this.started = true;
    document.body.classList.add('playing');
    $('start').classList.add('hidden');
    $('hud').classList.remove('hidden');
    this.viewTarget = isMobile ? 11.5 : 13;
    sfx('quest');
    setTimeout(() => this.ui.toast('Isla Bruma', 'area'), 300);
    if (data.fresh) setTimeout(() => this.ui.toast('📜 Habla con la Alcaldesa Marisol (!)'), 1800);
    for (const e of this.enemies) e.updateColor();
    this.save();
  }

  // ------------------------------------------------------------- bucle
  loop(t) {
    requestAnimationFrame((tt) => this.loop(tt));
    const dt = Math.min(0.05, (t - this.last) / 1000);
    this.last = t;
    if (!this.paused) this.update(dt);
    this.renderer.render(this.scene, this.camera);
  }

  updateLighting() {
    const h = this.tod;
    const day = smoothstep(5, 7.5, h) * (1 - smoothstep(17.5, 20, h));
    const warm = Math.max(0, 1 - Math.abs(h - 18.3) / 1.6) + Math.max(0, 1 - Math.abs(h - 6.3) / 1.4);
    const night = 1 - day;
    const sunCol = new THREE.Color(0x9ab0ff).lerp(new THREE.Color(0xffffff), day).lerp(new THREE.Color(0xffa860), clamp(warm, 0, 1) * 0.55);
    this.sun.color.copy(sunCol);
    this.sun.intensity = 0.55 + 1.75 * day;
    this.hemi.intensity = 0.7 + 0.65 * day;
    this.hemi.color.set(0x5a6aa8).lerp(new THREE.Color(0xdfefff), day);
    this.hemi.groundColor.set(0x252a3a).lerp(new THREE.Color(0x8a7a5a), day);
    this.scene.background.set(0x0a1424).lerp(new THREE.Color(0x8fc6e8), day);
    this.water.material.uniforms.light.value.setRGB(0.38 + 0.62 * day, 0.42 + 0.58 * day, 0.62 + 0.38 * day);
    this.M.lantern.emissiveIntensity = 0.3 + 1.6 * night;
    this.M.glass.emissiveIntensity = 0.9 * night;
    this.torch.intensity = 4 * night;
    this.night = night;
  }

  update(dt) {
    this.time += dt;
    if (this.started) this.tod = (this.tod + dt / 15) % 24;
    this.updateLighting();
    const p = this.player;
    if (this.started) {
      if (this.sailing) this.updateBoat(dt);
      else p.update(dt);
      for (const n of this.npcs) n.update(dt);
      for (const e of this.enemies) e.update(dt);
    }
    if (this.sailing) { p.st.moving = false; animateModel(p.model, p.st, dt); } else p.sync(dt);
    // interior: fondo oscuro y luz cálida
    const room = this.roomAt(p.x, p.z);
    this.water.visible = !room;
    if (room) {
      this.scene.background.set(0x07090e);
      this.torch.position.set(room.X + room.w / 2, 2.6, room.Z + room.d / 2);
      this.torch.distance = 16;
      this.torch.intensity = 5;
    } else this.torch.distance = 8;
    for (const n of this.npcs) n.sync(dt);
    for (const e of this.enemies) if (!e.dead || e.model.root.visible) { if (e.dist(p) < 34 || e.st.moving) e.sync(dt); }
    for (const gd of this.guards) {
      gd.m.root.rotation.y = Math.PI / 4 + Math.sin(this.time * 0.3 + gd.base) * 1.2;
      animateModel(gd.m, gd.st, dt);
    }

    // cámara
    this.viewSize += (this.viewTarget - this.viewSize) * Math.min(1, dt * 5);
    this.updateCamera();
    const tgt = new THREE.Vector3(p.x, 0, p.z);
    if (!this.started) {
      // en el menú inicial, el personaje se ve por encima del panel
      const aspect = this.width / this.height;
      const landShort = aspect >= 1 && this.height <= 500;
      const vh = aspect >= 1 ? this.viewSize : this.viewSize / aspect;
      const a = landShort ? 0 : (0.2 * vh) / 0.66 / Math.SQRT2;
      tgt.x += a; tgt.z += a;
      if (landShort) { const b = (0.22 * this.viewSize * aspect) / Math.SQRT2; tgt.x += b; tgt.z -= b; }
    }
    this.camTarget.lerp(tgt, Math.min(1, dt * 6));
    this.camera.position.copy(this.camTarget).add(this.camOffset);
    this.camera.lookAt(this.camTarget);
    // contorno de ~1.6 px en pantalla, sea cual sea el zoom
    OUTLINE.uniforms.thick.value = clamp(((this.camera.top - this.camera.bottom) / Math.max(1, this.height)) * 1.6, 0.004, 0.035);
    this.sun.position.copy(this.camTarget).addScaledVector(this.sunDir, 50);
    this.sun.target.position.copy(this.camTarget);
    this.torch.position.set(p.x, 2.2, p.z);

    // selección y cursor
    if (this.selection.visible && this.selTarget) {
      this.selection.position.set(this.selTarget.x, 0.03, this.selTarget.z);
      this.selection.rotation.z += dt;
    }
    if (this.cursor.visible) {
      this.cursorT -= dt;
      this.cursorMat.opacity = clamp(this.cursorT, 0, 0.85);
      if (this.cursorT <= 0) this.cursor.visible = false;
    }

    // animaciones del entorno
    const t = this.time;
    this.water.material.uniforms.time.value = t;
    this.ship.rotation.order = 'YXZ';
    this.ship.rotation.y = this.boat.heading;
    this.ship.rotation.z = Math.sin(t * 0.9) * 0.025 + (this.boat.roll || 0);
    this.ship.rotation.x = Math.sin(t * 0.6) * 0.012;
    this.ship.position.set(this.boat.x, -0.05 + Math.sin(t * 1.1) * 0.04, this.boat.z);
    // estela de espuma
    if (!this.wake) {
      this.wake = [];
      const wg = new THREE.CircleGeometry(0.5, 10);
      for (let i = 0; i < 40; i++) {
        const m = new THREE.Mesh(wg, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
        m.rotation.x = -Math.PI / 2;
        m.visible = false;
        this.scene.add(m);
        this.wake.push({ m, life: 0 });
      }
      this.wakeT = 0;
      this.wakeI = 0;
    }
    this.wakeT -= dt;
    if (this.sailing && Math.abs(this.boat.speed) > 0.8 && this.wakeT <= 0) {
      this.wakeT = 0.09;
      const b = this.boat, w = this.wake[this.wakeI++ % this.wake.length];
      const side = (this.wakeI % 2 ? 1 : -1) * 0.5;
      w.m.position.set(b.x - Math.sin(b.heading) * 3.3 + Math.cos(b.heading) * side, -0.06, b.z - Math.cos(b.heading) * 3.3 - Math.sin(b.heading) * side);
      w.life = 1.6;
      w.m.visible = true;
    }
    for (const w of this.wake) {
      if (w.life <= 0) continue;
      w.life -= dt;
      const k = Math.max(0, w.life / 1.6);
      w.m.material.opacity = 0.55 * k;
      w.m.scale.setScalar(0.6 + (1 - k) * 1.8);
      if (w.life <= 0) w.m.visible = false;
    }
    this.rowboat.rotation.z = Math.sin(t * 1.3 + 1) * 0.05;
    this.ship.traverse((o) => {
      if (o.userData.flag) {
        const pos = o.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          pos.setZ(i, Math.sin(t * 5 + x * 5) * 0.06 * (x + 0.45));
        }
        pos.needsUpdate = true;
      }
    });
    for (const d of this.dyn) {
      const k = d.userData.dynamic;
      if (k === 'fountain') {
        const pos = d.geometry.attributes.position;
        d.userData.seeds.forEach((s, i) => {
          const ph = (t * 0.9 + s.o) % 1;
          const r = 0.12 + ph * 0.75;
          pos.setXYZ(i, Math.cos(s.a) * r, 1.55 + ph * 0.5 - ph * ph * 1.75, Math.sin(s.a) * r);
        });
        pos.needsUpdate = true;
      } else if (k === 'flame') {
        d.scale.set(1 + Math.sin(t * 17) * 0.1, 1 + Math.sin(t * 13) * 0.22, 1 + Math.cos(t * 15) * 0.1);
      } else if (k === 'beam') {
        d.rotation.y = t * 0.8;
        d.material.opacity = 0.2 * this.night;
        d.visible = this.night > 0.05;
      }
    }
    for (let i = this.regrow.length - 1; i >= 0; i--) {
      const r = this.regrow[i];
      r.t -= dt;
      if (r.t <= 0) {
        const o = r.o;
        if (Math.round(p.x) === o.x && Math.round(p.z) === o.z) { r.t = 3; continue; }
        o.down = false;
        o.hp = 3;
        this.W.setBlocked(o.x, o.z, 1);
        this.setInst(o.mesh, o.index, o.x, 0, o.z, o.rot, r.kind === 'tree' ? o.s : o.s * 1.6);
        this.regrow.splice(i, 1);
      }
    }

    // etiquetas
    p.label.el.style.display = this.started ? '' : 'none';
    if (this.started) this.ui.placeLabel(p.label, p.x, this.sailing ? 2.9 : this.W.groundY(p.x, p.z) + p.model.height + 0.12, p.z);
    for (const r of this.rooms) {
      const near = !room && Math.hypot(r.front.x - p.x, r.front.z - p.z) < 9;
      if (near) this.ui.placeLabel(r.doorLabel, (r.door.x + r.front.x) / 2, 1.3, (r.door.z + r.front.z) / 2);
      else if (r.doorLabel._vis) { r.doorLabel._vis = false; r.doorLabel.el.style.display = 'none'; }
      if (room === r) this.ui.placeLabel(r.exitLabel, r.exit.x, 0.5, r.exit.z);
      else if (r.exitLabel._vis) { r.exitLabel._vis = false; r.exitLabel.el.style.display = 'none'; }
    }
    for (const n of this.npcs) {
      if (n.dist(p) > 22) { if (n.label._vis) { n.label._vis = false; n.label.el.style.display = 'none'; } continue; }
      this.ui.setMark(n.label, this.npcMark(n));
      this.ui.placeLabel(n.label, n.x, this.W.groundY(n.x, n.z) + n.model.height + 0.12, n.z);
    }
    this.colorT = (this.colorT || 0) - dt;
    const recolor = this.colorT <= 0;
    if (recolor) this.colorT = 1;
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (e.dist(p) > 22) { if (e.label._vis) { e.label._vis = false; e.label.el.style.display = 'none'; } continue; }
      if (recolor) e.updateColor();
      this.ui.placeLabel(e.label, e.x, e.model.height + 0.12 + e.yOff, e.z);
    }
    this.ui.updateFloats(dt);

    if (this.started) {
      this.ui.updateHUD();
      this.mmT -= dt;
      if (this.mmT <= 0) { this.mmT = 0.15; this.ui.drawMinimap(); }
      this.areaT -= dt;
      if (this.areaT <= 0) {
        this.areaT = 0.5;
        const a = this.W.areaName(p.tx, p.tz);
        if (a !== this.lastArea) {
          if (this.lastArea) this.ui.toast(a, 'area');
          this.lastArea = a;
        }
      }
      this.saveT += dt;
      if (this.saveT > 20) { this.saveT = 0; this.save(); }
    }
  }
}

window.addEventListener('load', () => {
  setTimeout(() => {
    try {
      window.game = new Game();
    } catch (err) {
      $('loading').innerHTML = `<div style="padding:20px;text-align:center">No se pudo iniciar el juego.<br><small>${String(err && err.message || err)}</small></div>`;
      console.error(err);
    }
  }, 30);
});

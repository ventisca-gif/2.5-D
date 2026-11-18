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
import { QUESTS, SIDE_QUESTS, questAt, dialogFor } from './quests.js';
import { sfx, audio } from './audio.js';
import { UI } from './ui.js';
import { makeIslets, makeInteriors, attachRegions } from './regions.js';
import { buildRoom } from './interiors.js';
import { ITEMS, EQUIP, RECIPES, DROPS, MAX_LEVEL, buildLook, gearStats, oreDrop, crewGear, crewTier, TIER_NAMES, HAIR_AM as HAIRM, HAIR_AF as HAIRF, HAIR_COLORS as HAIRC, SKINS as SKINC, CLOTHES as CLOTHC, BODY_M, BODY_F, FACES_F, FACES_M, FACE_SHAPES, EYE_COLORS } from './items.js';
import { npcLevel, RECRUITABLE, ROMANCE, MAX_CREW, friendLevel, heartsText, CHAT_LINES, CHAT_REPLIES, ROMANCE_LINES, CONFESS_YES, CONFESS_NO, DUEL_LINES, ANGRY_LINES, GIFT_LIKES } from './social.js';
import { Panels, fmtTime } from './panels.js';
import { Updater } from './updater.js';
import { Net } from './net.js';
import { makeNewIslets, MARINE_LOOK, SEA_ZONES } from './isles2.js';
import { installNaval, makeArenaRegion } from './naval.js';
import { installLife, FAMOUS } from './life.js';
import { installSkills } from './skills.js';
import { installBuild } from './build.js';
import { installExtra, EVENT_COS } from './extra.js';
import { installMore, makeDungeonRegion } from './more.js';
import { installMore2, makeGhostIslet, HOUSES, MOUNTS, PREMIUM_DECOR, mountModel } from './more2.js';
import { DECOR } from './extra.js';
import { installMore3, makeCoralia, makeJellyModel } from './more3.js';
import { LOGROS } from './more2.js';
import { installMore4, makeIslands4, makeGrotto } from './more4.js';
import { installMore5, makeNewbornIslet } from './more5.js';
import { installMore6 } from './more6.js';
import { installMore7 } from './more7.js';
import { installMore8 } from './more8.js';
import { makeHumanoid2, makeBeast2, makeCrab2, makeBat, makeScorpion, makeGolem, makeFlameSkull, makeSerpent, OUTFITS2, OUTLINE } from './chars2.js';

const HUM = makeHumanoid2;
const OUTF = OUTFITS2;

const $ = (id) => document.getElementById(id);
const SAVE_KEY = 'islabruma_save_v1';
const SETTINGS_KEY = 'islabruma_settings_v1';
const SLOT_KEY = (i) => 'thebruma_slot_' + i;
const DEFAULT_AP = { gender: 'm', hair: 0, hairColor: 1, skin: 1, clothes: 0, beard: false, body: 0, faceShape: 0, face: 0, eye: 0, bust: 2, nose: true, mouth: true, blush: true };
// NPCs con cara anime: género, peinado, ojos, expresión, forma de cara y cuerpo deterministas por id
const FEMALE_NPC = new Set(['nerea', 'marisol', 'rosa', 'lucia', 'elvira', 'clara', 'tomasa', 'coral', 'olga', 'ines', 'mara', 'naira', 'tika', 'berta', 'ixa', 'brasa', 'marga', 'escarlata', 'ceniza', 'ondina', 'plata', 'medusa', 'garfio', 'helga', 'dulcinea', 'volta', 'mambe']);
function hashId(id) { let h = 7; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
function animeLook(def) {
  const L = def.look;
  if (L.bone || L.anime) return L;
  const h = hashId(def.id || 'x');
  const female = FEMALE_NPC.has(def.id) || !!L.dress;
  const fh = def.small ? ['dosColetas', 'coleta'] : L.longHair ? ['largo', 'trenza', 'melena'] : ['melena', 'coleta', 'corto', 'largo'];
  const mh = L.longHair ? ['melenaM', 'samurai'] : ['flequillo', 'despeinado', 'punta', 'lateral'];
  const hairStyle = female ? fh[h % fh.length] : mh[h % mh.length];
  const strong = ['ramiro', 'tito', 'tadeo', 'rufo', 'quino'].includes(def.id);
  const body = female ? ['normal', 'curvy', 'atletica', 'delgada'][(h >>> 3) % 4] : strong ? (def.id === 'tadeo' ? 'robusto' : 'atletico') : ['normal', 'delgado', 'normal', 'robusto'][(h >>> 3) % 4];
  return {
    ...L, anime: true, female, hairStyle, body, eyeColor: h % 8,
    face: (female ? FACES_F : FACES_M)[(h >>> 5) % 4].id, faceShape: FACE_SHAPES[(h >>> 7) % 4].id,
    bust: female ? 1 + ((h >>> 9) % 3) : 0, faceRes: 256,
  };
}
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const r2 = (v) => Math.round(v * 100) / 100;
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
  boss: { name: 'Capitán Huesoamargo', hp: () => 650, atk: () => 30, speed: 2.4, xp: () => 400, gold: () => 150, aggro: 6, cd: 1.6, boss: true },
  scorpion: { name: 'Escorpión rojo', hp: (L) => 30 + 10 * L, atk: (L) => 4 + 1.9 * L, speed: 2.4, xp: (L) => 10 + 5 * L, gold: (L) => 3 + Math.floor(Math.random() * (3 + L)), aggro: 4, cd: 1.2 },
  tiger: { name: 'Tigre de la selva', hp: (L) => 34 + 11 * L, atk: (L) => 5 + 2.1 * L, speed: 3.3, xp: (L) => 12 + 5 * L, gold: (L) => 3 + Math.floor(Math.random() * (3 + L)), aggro: 5, cd: 1.1 },
  bat: { name: 'Murciélago vampiro', hp: (L) => 18 + 7 * L, atk: (L) => 3 + 1.6 * L, speed: 3.6, xp: (L) => 9 + 4 * L, gold: (L) => 2 + Math.floor(Math.random() * (2 + L)), aggro: 6, cd: 1.0, fly: true },
  golem: { name: 'Gólem de piedra', hp: (L) => 60 + 16 * L, atk: (L) => 6 + 2.4 * L, speed: 1.7, xp: (L) => 18 + 7 * L, gold: (L) => 6 + Math.floor(Math.random() * (5 + L)), aggro: 4, cd: 2.0 },
  golem_obs: { name: 'Gólem de obsidiana', hp: (L) => 70 + 18 * L, atk: (L) => 7 + 2.6 * L, speed: 1.8, xp: (L) => 20 + 8 * L, gold: (L) => 8 + Math.floor(Math.random() * (6 + L)), aggro: 4.5, cd: 1.9 },
  skull: { name: 'Calavera llameante', hp: (L) => 26 + 9 * L, atk: (L) => 5 + 2.2 * L, speed: 3.0, xp: (L) => 14 + 6 * L, gold: (L) => 5 + Math.floor(Math.random() * (4 + L)), aggro: 6, cd: 1.3, fly: true },
  marine: { name: 'Marina', hp: (L) => 44 + 13 * L, atk: (L) => 5 + 2.2 * L, speed: 2.8, xp: (L) => 16 + 7 * L, gold: (L) => 6 + Math.floor(Math.random() * (5 + L)), aggro: 6, cd: 1.3, neutral: true, bounty: 60 },
  pirate: { name: 'Pirata rival', hp: (L) => 40 + 12 * L, atk: (L) => 5 + 2.1 * L, speed: 2.8, xp: (L) => 14 + 6 * L, gold: (L) => 8 + Math.floor(Math.random() * (6 + L)), aggro: 5, cd: 1.3 },
  marine_boss: { name: 'Comodoro Vidal', hp: () => 3200, atk: () => 95, speed: 2.8, xp: () => 3000, gold: () => 900, aggro: 7, cd: 1.4, boss: true, neutral: true, bounty: 2500 },
  serafin: { name: 'Azrael, el Serafín Caído', hp: () => 26000, atk: () => 270, speed: 3.0, xp: () => 30000, gold: () => 6000, aggro: 7, cd: 1.3, boss: true, super: 'serafin', bounty: 5000 },
  dragon: { name: 'Ignaros, el Dragón Rey', hp: () => 32000, atk: () => 300, speed: 2.4, xp: () => 36000, gold: () => 7000, aggro: 7, cd: 1.6, boss: true, super: 'dragon', bounty: 6000 },
  leviathan: { name: 'Leviatán Abisal', hp: (L) => 7000 + L * 90, atk: (L) => 40 + L * 2.6, speed: 0, xp: () => 0, gold: () => 0, aggro: 12, cd: 2.2, boss: true, super: 'leviathan' },
  merfolk: { name: 'Tritón de Coralia', hp: (L) => 50 + 14 * L, atk: (L) => 6 + 2.3 * L, speed: 2.8, xp: (L) => 18 + 8 * L, gold: (L) => 8 + Math.floor(Math.random() * (6 + L)), aggro: 6, cd: 1.3 },
  jelly: { name: 'Medusa gigante', hp: (L) => 30 + 10 * L, atk: (L) => 5 + 2.2 * L, speed: 1.6, xp: (L) => 14 + 7 * L, gold: (L) => 5 + Math.floor(Math.random() * (4 + L)), aggro: 4, cd: 1.6, fly: true },
  abyss_queen: { name: 'Reina Abisal Nerissa', hp: () => 11000, atk: () => 170, speed: 2.6, xp: () => 12000, gold: () => 3500, aggro: 8, cd: 1.3, boss: true, super: 'abyss', bounty: 2500 },
  ghost_captain: { name: 'Capitán Espectro Valdrak', hp: () => 14000, atk: () => 210, speed: 2.8, xp: () => 16000, gold: () => 4000, aggro: 8, cd: 1.3, boss: true, super: 'ghost', bounty: 3000 },
  crypt_king: { name: 'Rey de la Cripta', hp: (L) => 1800 + L * 90, atk: (L) => 12 + L * 2.6, speed: 2.4, xp: (L) => 400 + L * 40, gold: (L) => 100 + L * 8, aggro: 9, cd: 1.5, boss: true, super: 'crypt' },
  tentacle: { name: 'Tentáculo', hp: (L) => 900 + L * 18, atk: (L) => 20 + L * 2, speed: 0, xp: (L) => 200 + L * 10, gold: (L) => 30 + L, aggro: 12, cd: 1.8 },
  lobo_nieve: { name: 'Lobo de las nieves', hp: (L) => 30 + 11 * L, atk: (L) => 5 + 2.2 * L, speed: 3.2, xp: (L) => 12 + 6 * L, gold: (L) => 4 + Math.floor(Math.random() * (4 + L)), aggro: 5, cd: 1.2 },
  yeti: { name: 'Yeti', hp: (L) => 80 + 19 * L, atk: (L) => 8 + 2.7 * L, speed: 2.2, xp: (L) => 24 + 9 * L, gold: (L) => 10 + Math.floor(Math.random() * (6 + L)), aggro: 5, cd: 1.8 },
  galleta: { name: 'Soldado galleta', hp: (L) => 34 + 11 * L, atk: (L) => 5 + 2.1 * L, speed: 2.9, xp: (L) => 14 + 6 * L, gold: (L) => 6 + Math.floor(Math.random() * (4 + L)), aggro: 5, cd: 1.2 },
  cangrejo_burbuja: { name: 'Cangrejo burbuja', hp: (L) => 36 + 11 * L, atk: (L) => 4 + 2 * L, speed: 2.2, xp: (L) => 12 + 6 * L, gold: (L) => 5 + Math.floor(Math.random() * (4 + L)), aggro: 4, cd: 1.4 },
  automata: { name: 'Autómata de engranajes', hp: (L) => 75 + 18 * L, atk: (L) => 8 + 2.6 * L, speed: 2.0, xp: (L) => 24 + 9 * L, gold: (L) => 12 + Math.floor(Math.random() * (6 + L)), aggro: 5, cd: 1.6 },
  reina_hielo: { name: 'Reina de Hielo Glacia', hp: () => 15000, atk: () => 230, speed: 2.6, xp: () => 18000, gold: () => 4500, aggro: 8, cd: 1.3, boss: true, super: 'hielo', sCol: 0x9ae8ff, sTxt: '¡Tormenta de hielo!', sMin: 'lobo_nieve', bounty: 3500 },
  gran_automata: { name: 'Gran Autómata Ferrum', hp: () => 19000, atk: () => 250, speed: 2.0, xp: () => 21000, gold: () => 5000, aggro: 8, cd: 1.7, boss: true, super: 'ferrum', sCol: 0xffc040, sTxt: '¡Lluvia de remaches!', sMin: 'automata', bounty: 4000 },
  rey_pastel: { name: 'Rey Pastel Bizcochón', hp: () => 12000, atk: () => 200, speed: 2.4, xp: () => 15000, gold: () => 4000, aggro: 8, cd: 1.4, boss: true, super: 'pastel', sCol: 0xff6ab0, sTxt: '¡Glaseado explosivo!', sMin: 'galleta', bounty: 3000 },
  golem_boss: { name: 'Gólem Primigenio', hp: () => 6000, atk: () => 150, speed: 1.9, xp: () => 6000, gold: () => 1500, aggro: 7, cd: 2.0, boss: true },
};
export { ENEMY_DEF };
// recompensa a partir de la cual la Marina te ataca nada más verte
const WANTED = 300;

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
    const p = findPath(this.g.W, s.x, s.z, x, z, { adjacent, maxIter, range, walk: this.walkFn });
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
    const gy = this.g.W.groundY(this.x, this.z);
    this.vy = this.vy === undefined ? gy : this.vy + (gy - this.vy) * Math.min(1, dt * 7);
    this.st.swim = gy < -0.5;
    r.position.set(this.x, this.vy + this.yOff, this.z);
    r.rotation.y = this.face;
    if (this.st.attackT > 0) this.st.attackT -= dt;
    animateModel(this.model, this.st, dt);
  }
}

class Player extends Actor {
  constructor(game, data) {
    const ap = { ...DEFAULT_AP, ...(data.ap || {}) };
    const equip = data.equip || { weapon: 'espada_madera' };
    super(game, HUM({ ...buildLook(ap, equip), noAutoLegs: true }), data.x, data.z);
    this.name = data.name;
    this.ap = ap;
    this.equip = equip;
    this.level = data.level || 1;
    this.xp = data.xp || 0;
    this.gold = data.gold ?? 10;
    this.inv = { wood: 0, stone: 0, potion: 2, ...(data.inv || {}) };
    this.speed = 3.4;
    this.running = false;
    this.recalc();
    this.hp = data.hp ?? this.maxHp;
    this.stamina = this.maxSt;
    this.target = null;
    this.attackCd = 0;
    this.lastCombat = -99;
    this.gatherT = 0;
    this.repathT = 0;
    this.pendingHit = null;
    this.dead = false;
    this.regenAcc = 0;
    this.label = game.ui.makeLabel('player', this.name);
    this.walkFn = (x, z) => game.W.walkable(x, z) || game.W.isWater(x, z);
  }
  refreshLook() {
    const old = this.model.root;
    const parent = old.parent || this.g.scene;
    parent.remove(old);
    this.model = HUM({ ...buildLook(this.ap, this.equip), noAutoLegs: true });
    this.model.root.position.copy(old.position);
    this.model.root.rotation.copy(old.rotation);
    parent.add(this.model.root);
  }
  recalc() {
    const gs = gearStats(this.equip);
    this.maxHp = Math.round((60 + (this.level - 1) * 12 + gs.hp) * (this.g.jobHp ? this.g.jobHp() : 1));
    this.maxSt = 100 + (this.level - 1) * 2;
    if (this.hp > this.maxHp) this.hp = this.maxHp;
  }
  get atk() { return (5 + (this.level - 1) * 2 + gearStats(this.equip).atk) * (this.g.buffMul ? this.g.buffMul('atk') : 1) * (this.g.jobDmg ? this.g.jobDmg() : 1); }
  get def() { return Math.round(gearStats(this.equip).def * (this.g.buffMul ? this.g.buffMul('def') : 1)); }
  xpNext() { const l = this.level - 1; return Math.round(25 + l * 18 + l * l * 2.2); }
  gainXp(n) {
    n = Math.round(n * (this.g.xpMul ? this.g.xpMul() : 1));
    if (this.level >= MAX_LEVEL) { this.xp = 0; return; }
    this.xp += n;
    while (this.level < MAX_LEVEL && this.xp >= this.xpNext()) {
      this.xp -= this.xpNext();
      this.level++;
      this.recalc();
      this.hp = this.maxHp;
      this.stamina = this.maxSt;
      this.g.ui.toast(`⭐ ¡Nivel ${this.level}!${this.level >= MAX_LEVEL ? ' (máximo)' : ''}`);
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
          const crit = Math.random() < 0.12 + (g.petCrit ? g.petCrit() : 0);
          const dmg = Math.max(1, Math.round(this.atk * (0.85 + Math.random() * 0.3) * (crit ? 1.8 : 1) * (this.pendingWeak ? 0.5 : 1) * g.comboMul() * (g.espMul ? g.espMul() : 1)));
          if (g.espHit) g.espHit();
          if (e.isRemote) { if (g.net.pvpHit(e, dmg)) g.ui.float(String(dmg), crit ? 'crit' : 'pdmg', e.x, 1.4, e.z); }
          else if (e.isNPC) g.damageNPC(e, dmg, crit); else g.hitEnemy(e, dmg, crit);
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
        const wk = this.walkFn;
        const ok = (dx, dz) => wk(from.x + dx, from.z + dz) && (!(dx && dz) || (wk(from.x + dx, from.z) && wk(from.x, from.z + dz)));
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
    // correr y estamina
    const wantRun = this.running || g.keys.has('shift');
    const swimming = g.W.groundY(this.x, this.z) < -0.5;
    if (swimming) {
      // nadar: lento y gasta estamina; sin estamina, te ahogas
      this.speed = 2.3;
      this.stamina = Math.max(0, this.stamina - 5 * dt);
      if (this.stamina <= 0) {
        this.drownT = (this.drownT || 0) + dt;
        if (this.drownT >= 1) {
          this.drownT = 0;
          const d = Math.max(2, Math.round(this.maxHp * 0.06));
          this.hp -= d;
          g.ui.float('-' + d, 'dmg', this.x, 0.6, this.z);
          g.ui.toast('🌊 ¡Te ahogas! Vuelve a tierra');
          if (this.hp <= 0) { this.hp = 0; this.dead = true; this.deadT = 3; this.path = []; this.target = null; sfx('die'); g.ui.toast('💀 Te has ahogado… despertarás en Villarroca'); }
        }
      }
      if (!this.wasSwimming) sfx('drink');
      this.wasSwimming = true;
    } else if (wantRun && this.st.moving && this.stamina > 0 && !this.exhausted) {
      this.wasSwimming = false;
      this.speed = g.mounted ? 5.6 * g.mountSpeed() * 0.9 : 5.6;
      this.stamina -= (g.mounted ? 5 : 16) * dt;
      if (this.stamina <= 0) { this.stamina = 0; this.exhausted = true; g.ui.toast('😮‍💨 Sin aliento'); }
    } else {
      this.wasSwimming = false;
      this.speed = g.mounted ? 3.4 * g.mountSpeed() : 3.4;
      this.stamina = Math.min(this.maxSt, this.stamina + (this.st.moving ? 9 : 16) * dt);
      if (this.exhausted && this.stamina > 25) this.exhausted = false;
    }

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
      if (e.dead || (e.isNPC && !e.fight)) {
        this.target = null;
        g.selection.visible = false;
        return;
      }
      const d = this.dist(e);
      if (d <= 1.7) {
        if (this.path.length > 1) this.path = [this.path[0]];
        this.faceTo(e.x - this.x, e.z - this.z, dt);
        // ya no ataca solo: se ataca pulsando el botón
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
      if (g.canBoard()) { this.target = null; this.path = []; g.shipMenu(); }
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

  // tajo al aire (sin objetivo)
  swingAir() {
    if (this.dead || this.g.sailing) return;
    if (this.st.swim) { this.g.ui.toast('No puedes atacar nadando'); return; }
    if (this.attackCd > 0) return;
    this.attackCd = 0.6;
    this.st.attackT = 0.32;
    this.stamina = Math.max(0, this.stamina - 3);
    this.lastSwing = this.g.time;
    this.g.slash(this, 0xffffff);
    this.g.net.attackAnim();
    sfx('swing');
  }
  attack(e) {
    if (this.st.swim) { this.g.ui.toast('No puedes atacar nadando'); this.attackCd = 1; return; }
    this.g.slash(this, 0xffffff);
    this.g.net.attackAnim();
    this.attackCd = 0.72;
    this.st.attackT = 0.32;
    this.pendingWeak = this.stamina < 6;
    if (!this.pendingWeak) this.stamina -= 6;
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
    const look0 = animeLook(def);
    super(game, HUM(look0), def.x, def.z);
    this.look0 = look0;
    this.def = def;
    this.id = def.id;
    this.name = def.name;
    this.home = { x: def.x, z: def.z };
    this.speed = 1.6;
    this.wanderT = 2 + Math.random() * 4;
    this.talking = false;
    this.face = Math.PI / 4;
    this.isNPC = true;
    this.fight = null;
    this.attackCd = 0;
    this.repathT = 0;
    this.tier = -1;
    this.cxp = 0;
    if (def.small) model_scale(this.model, 0.72);
    this.label = game.ui.makeLabel('npc', def.name, { hp: true });
    this.setStats(1);
  }
  setStats(level) {
    this.level = level;
    this.maxHp = Math.round(30 + level * 14);
    this.hp = this.maxHp;
    this.atk = 3 + level * 2.2;
    if (this.label) this.g.ui.setHp(this.label, 1);
  }
  rebuild(look) {
    const old = this.model.root;
    const parent = old.parent || this.g.scene;
    parent.remove(old);
    this.model = HUM(look);
    if (this.def.small) model_scale(this.model, 0.72);
    this.model.root.position.copy(old.position);
    this.model.root.rotation.copy(old.rotation);
    parent.add(this.model.root);
  }
  update(dt) {
    const g = this.g, p = g.player, s = g.soc(this.id);
    this.st.holdHand = null;
    if (s.role === 'jail' && g.jailSpot) {
      // preso en la celda del Bastión: se le ve tras los barrotes
      const j = g.jailSpot;
      this.x = j.x; this.z = j.z; this.path = []; this.st.moving = false;
      this.model.root.visible = true; this.model.root.position.set(j.x, 0.1, j.z); this.label._vis = true; this.label.el.style.display = '';
      return;
    }
    if (s.role && (s.crew || s.partner) && !g.boarding) {
      // en el barco o recolectando: no se ve por la isla
      if (this.model.root.visible) { this.model.root.visible = false; this.label.el.style.display = 'none'; this.label._vis = false; }
      this.st.moving = false;
      return;
    }
    if (g.companionTick && !this.fight && g.companionTick(this, dt)) return;
    if (this.fight) { this.updateFight(dt); return; }
    if (this.talking) {
      this.path = this.path.slice(0, 1);
      if (!this.path.length) this.faceTo(p.x - this.x, p.z - this.z, dt);
    } else if (s.partner && s.hand && !p.dead) {
      // paseo de la mano: a la derecha del jugador
      const f = p.face;
      const tx = p.x + Math.cos(f) * 0.6, tz = p.z - Math.sin(f) * 0.6;
      if (Math.hypot(tx - this.x, tz - this.z) > 6) { this.x = tx; this.z = tz; }
      const k = Math.min(1, dt * 10);
      this.x += (tx - this.x) * k;
      this.z += (tz - this.z) * k;
      this.face = lerpAngle(this.face, f, k);
      this.path = [];
      this.st.moving = p.st.moving;
      this.st.holdHand = 'L';
      p.st.holdHand = 'R';
      return;
    } else if (s.crew && !s.wait) {
      this.speed = p.speed * 1.08;
      if (g.crewGatherTick && g.crewGatherTick(this, dt)) return;
      const d = this.dist(p);
      if (d > 18 || g.W.isInterior(p.x) !== g.W.isInterior(this.x)) { g.placeNear(this, p.tx, p.tz); return; }
      const foe = g.crewFoe();
      this.attackCd -= dt;
      if (foe) {
        const df = this.dist(foe);
        if (df <= 1.7) {
          if (this.path.length > 1) this.path = [this.path[0]];
          this.faceTo(foe.x - this.x, foe.z - this.z, dt);
          if (this.attackCd <= 0) {
            this.attackCd = 1.1;
            this.st.attackT = 0.32;
            g.slash(this, 0xbfe6ff);
            const dmg = Math.round((4 + this.level * 1.8) * (0.85 + Math.random() * 0.3) * g.crewScale() * (s.loyal ? 1.25 : 1) * (g.crewDmgMul ? g.crewDmgMul(this) : 1));
            setTimeout(() => { if (!foe.dead && this.dist(foe) < 2.2) g.hitEnemy(foe, dmg, false, this); }, 150);
          }
        } else {
          this.repathT -= dt;
          if (this.repathT <= 0) { this.repathT = 0.5; this.goTo(foe.tx, foe.tz, true, 1500); }
        }
      } else {
        // cada uno va a su puesto en la formación detrás de ti (ya no se amontonan)
        const slot = g.followSlot(this);
        const ds = Math.hypot(slot.x - this.x, slot.z - this.z);
        this.repathT -= dt;
        if (ds > 1.1 && this.repathT <= 0) { this.repathT = 0.5; this.goTo(slot.x, slot.z, true, 1500); }
        else if (ds <= 1.1 && !this.path.length && !p.st.moving) this.faceTo(p.x - this.x, p.z - this.z, dt);
      }
    } else if (!s.crew && g.npcRoutine(this, dt)) {
      return;
    } else if (this.def.wander > 0) {
      this.speed = 1.6;
      this.wanderT -= dt;
      if (this.wanderT <= 0 && !this.path.length) {
        this.wanderT = 3 + Math.random() * 6;
        const r = this.def.wander;
        for (let i = 0; i < 8; i++) {
          const x = this.home.x + Math.round((Math.random() * 2 - 1) * r);
          const z = this.home.z + Math.round((Math.random() * 2 - 1) * r);
          if (g.W.walkable(x, z) && !(x === p.tx && z === p.tz)) {
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
  updateFight(dt) {
    const g = this.g, p = g.player;
    const dP = this.dist(p);
    this.speed = 2.8;
    this.attackCd -= dt;
    if (this.pending) {
      this.pending.t -= dt;
      if (this.pending.t <= 0) {
        const pdg = this.pending;
        this.pending = null;
        if (!p.dead && this.fight && this.dist(p) < (pdg.r || 2.0)) g.damagePlayer(this, this.atk * (pdg.k || 1));
      }
    }
    if (!this.fight) return;
    if (dP > 20 || p.dead) { g.endFight(this, 'flee'); return; }
    if (g.npcFightSkill) g.npcFightSkill(this, dt);
    if (dP <= 1.65 && this.attackCd <= 0) {
      this.faceTo(p.x - this.x, p.z - this.z, 1);
      this.attackCd = 1.3;
      this.st.attackT = 0.32;
      this.pending = { t: 0.16 };
      g.slash(this, 0xffd0a0);
    }
    if (dP <= 1.3 && !p.st.moving) {
      if (this.path.length > 1) this.path = [this.path[0]];
      if (!this.path.length) this.faceTo(p.x - this.x, p.z - this.z, dt);
    } else {
      this.repathT -= dt;
      if (this.repathT <= 0) { this.repathT = 0.4; this.goTo(p.tx, p.tz, true, 1500); }
    }
    this.stepMove(dt);
  }
}

// tentáculo / cabeza del Leviatán (modelo sencillo de primitivas)
function makeTentacleModel(head) {
  const root = new THREE.Group();
  const mats = [];
  const M = (c) => { const m = new THREE.MeshPhongMaterial({ color: c, shininess: 40 }); m.userData.baseEmissive = new THREE.Color(0); mats.push(m); return m; };
  const skin = M(0x3a2a5a), belly = M(0x8a6aa8), eye = new THREE.MeshBasicMaterial({ color: 0xffe040 });
  if (head) {
    const h = new THREE.Mesh(new THREE.SphereGeometry(1.1, 18, 14), skin); h.scale.set(1, 1.25, 1); h.position.y = 1.0; root.add(h);
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), eye); e.position.set(s * 0.5, 1.2, 0.85); root.add(e); const pu = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshBasicMaterial({ color: 0x111111 })); pu.position.set(s * 0.5, 1.2, 1.02); root.add(pu); }
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const t = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.4, 6), i % 2 ? skin : belly); t.position.set(Math.cos(a) * 0.7, 0.1, Math.sin(a) * 0.7 + 0.3); t.rotation.set(Math.sin(a) * 0.8, 0, -Math.cos(a) * 0.8 + Math.PI); root.add(t); }
    root.position.y = -0.5;
    return { root, parts: {}, mats, kind: 'tentacle', height: 2.4 };
  }
  for (let i = 0; i < 7; i++) {
    const r = 0.26 - i * 0.03;
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.85, r, 0.36, 10), i % 2 ? skin : belly);
    seg.position.set(Math.sin(i * 0.5) * 0.08 * i, 0.18 + i * 0.32, 0);
    root.add(seg);
    if (i % 2 === 0) { const su = new THREE.Mesh(new THREE.SphereGeometry(r * 0.35, 6, 4), belly); su.position.set(seg.position.x, seg.position.y, r * 0.85); root.add(su); }
  }
  return { root, parts: {}, mats, kind: 'tentacle', height: 2.4 };
}

function tintModel(model, color, k) {
  const c = new THREE.Color(color);
  const tmp = new THREE.Color();
  model.root.traverse((o) => {
    if (!o.isMesh || !o.material || o.material.isShaderMaterial) return;
    const col = o.geometry && o.geometry.attributes.color;
    if (col) {
      o.geometry = o.geometry.clone();
      const a = o.geometry.attributes.color;
      for (let i = 0; i < a.count; i++) { tmp.setRGB(a.getX(i), a.getY(i), a.getZ(i)); const l = (tmp.r + tmp.g + tmp.b) / 3; if (l > 0.85 || (tmp.b > 0.8 && tmp.r < 0.5)) continue; tmp.lerp(c, k); a.setXYZ(i, tmp.r, tmp.g, tmp.b); }
      a.needsUpdate = true;
    } else if (o.material.color) { o.material = o.material.clone(); o.material.color.lerp(c, k); }
  });
  return model;
}
function model_scale(model, s) {
  model.root.scale.setScalar(s);
  model.height *= s;
}

class Enemy extends Actor {
  constructor(game, type, spawn, lvlRange) {
    let model;
    const seed = (spawn.area[0] * 7 + spawn.area[1] * 13 + (game.enemies ? game.enemies.length : 0) * 31) >>> 0;
    if (type === 'reina_hielo') model = HUM(animeLook({ id: 'glacia', look: { skin: 0xdcecf8, hair: 0xf4fbff, longHair: true, dress: true, dressColor: 0x8ad0f0, shirt: 0xbfe8f8, hat: 'circlet', hatColor: 0xe8f8ff, halo: 0x9ae8ff, cape: 0xe0f4ff, spear: true, trident: true } }));
    else if (type === 'gran_automata') model = tintModel(makeGolem('stone'), 0xd8a838, 0.85);
    else if (type === 'rey_pastel') model = HUM({ skin: 0xb8743a, shirt: 0xf8d8e8, pants: 0xf060b0, trim: 0xffffff, hat: 'circlet', hatColor: 0xffd040, halo: 0xff8ac8, cape: 0xf060b0, axe: true, beard: 0xffffff, bootCuff: true });
    else if (type === 'lobo_nieve') model = tintModel(makeBeast2('wolf'), 0xf4f8fc, 0.75);
    else if (type === 'yeti') { model = tintModel(makeGolem('stone'), 0xeef4fa, 0.8); }
    else if (type === 'automata') model = tintModel(makeGolem('stone'), 0xc8903a, 0.7);
    else if (type === 'cangrejo_burbuja') model = tintModel(makeCrab2(), 0x5ad0f0, 0.6);
    else if (type === 'galleta') model = HUM({ skin: 0xb8743a, shirt: 0xb8743a, pants: 0xb8743a, trim: 0xffffff, scarf: 0xf060b0, bootCuff: true, sword: true, blade: 0xf8f0e0, guard: 0xf060b0, hat: 'cap', capColor: 0xf060b0 });
    else if (type === 'wolf' || type === 'boar' || type === 'tiger') model = makeBeast2(type);
    else if (type === 'crab') model = makeCrab2();
    else if (type === 'scorpion') model = makeScorpion();
    else if (type === 'bat') model = makeBat();
    else if (type === 'golem') model = makeGolem('stone');
    else if (type === 'golem_obs' || type === 'golem_boss') model = makeGolem('obs');
    else if (type === 'skull') model = makeFlameSkull();
    else if (type === 'serafin') model = HUM({ ...EQUIP.c_serafin.look, ...EQUIP.c_alas_serafin.look, sword: true, blade: 0xfff4c0, bladeLen: 0.7, guard: 0xffd040, skin: 0xf0d8c0, anime: true, female: false, eyeColor: 3 });
    else if (type === 'dragon') model = HUM({ ...EQUIP.c_dragon.look, axe: true, skin: 0x8a3a2a, anime: true, eyeColor: 1 });
    else if (type === 'merfolk') model = HUM(animeLook({ id: 'triton' + seed, look: { skin: 0x4ab0a0, hair: 0x1a5a7a, shirt: 0x2a7a8a, pants: 0x1a5a6a, armor: true, armorColor: 0x3a9aa8, spear: true, trident: true } }));
    else if (type === 'jelly') model = makeJellyModel();
    else if (type === 'abyss_queen') model = HUM(animeLook({ id: 'nerissa', look: { skin: 0x7ad0c0, hair: 0x2ad8e8, longHair: true, dress: true, dressColor: 0x1a6a8a, shirt: 0x2a8aa8, hat: 'circlet', halo: 0x3ad8ff, spear: true, trident: true, cape: 0x1a4a6a } }));
    else if (type === 'ghost_captain') model = HUM({ bone: 0xbfe8e8, hat: 'tricorn', hatColor: 0x1a2a30, feather: 0x7af0e0, coat: true, shirt: 0x2a4a50, cape: 0x3a6a70, sword: true, blade: 0x7af0e0, guard: 0x7af0e0, eyeGlow: 0x7af0e0 });
    else if (type === 'crypt_king') model = HUM({ bone: 0xe0d8c0, hat: 'horned', hatColor: 0xd8d0b8, hornColor: 0x3a3030, cape: 0x3a0a1a, sword: true, blade: 0x7aff8a, guard: 0xd8a838, eyeGlow: 0x7aff8a, pauldron: 0x3a3040, trim: 0xd8a838 });
    else if (type === 'tentacle' || type === 'leviathan') model = makeTentacleModel(type === 'leviathan');
    else if (type.startsWith('famous_')) { const f = FAMOUS.find((k) => 'famous_' + k.id === type); model = HUM(animeLook({ id: f.id, look: f.look })); }
    else if (type === 'marine' || type === 'marine_boss') model = HUM(MARINE_LOOK(type === 'marine_boss' ? 2 : seed % 5 === 0 ? 1 : 0, seed));
    else if (type === 'pirate') {
      model = HUM({ shirt: [0x8a2a2a, 0x2a2a2a, 0x5a3a6a, 0x2a5a4a][seed % 4], pants: 0x2a2220, hat: seed % 3 ? 'bandana' : 'tricorn', capColor: [0x1a1a1a, 0xb02a2a, 0x2a4ab0][seed % 3], hair: [0x1a1a1a, 0x6a3a1a, 0xb04a2a][seed % 3], beard: seed % 2 ? 0x2a1a10 : undefined, skin: [0xf0c49a, 0xc68a5a, 0x8a5a3a][seed % 3], sword: true, eyepatch: seed % 4 === 0, sash: 0xc8302a, bootCuff: true, earring: true });
    } else if (type === 'boss') {
      model = HUM({ bone: 0xe8e2cc, shirt: 0x8a1a1a, hat: 'tricorn', feather: 0xd83a3a, sword: true, blade: 0xffd070, guard: 0xffd070, eyeGlow: 0xff3020, cape: 0x5a0a0a, pauldron: 0x8a1a1a, trim: 0xe0b040 });
    } else {
      model = HUM({ bone: 0xe8e2cc, hat: 'bandana', capColor: [0xb02a2a, 0x2a4ab0, 0x2a2a2a][Math.floor(Math.random() * 3)], sword: true, blade: 0x9a8a7a, eyepatch: Math.random() < 0.3 });
    }
    super(game, model, 0, 0);
    if (type === 'boss') model_scale(model, 1.5);
    if (type === 'golem_boss') model_scale(model, 1.7);
    if (type === 'yeti') model_scale(model, 1.3);
    if (type === 'reina_hielo') model_scale(model, 1.55);
    if (type === 'gran_automata') model_scale(model, 2.0);
    if (type === 'rey_pastel') model_scale(model, 1.7);
    if (type === 'marine_boss') model_scale(model, 1.3);
    if (type.startsWith('famous_')) model_scale(model, 1.18);
    if (type === 'serafin') model_scale(model, 1.6);
    if (type === 'dragon') model_scale(model, 1.75);
    if (type === 'crypt_king') model_scale(model, 1.55);
    if (type === 'abyss_queen') model_scale(model, 1.5);
    if (type === 'ghost_captain') { model_scale(model, 1.5); for (const m of model.mats) { m.transparent = true; m.opacity = 0.75; } }
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
    if (!g.W.walkable(x, z)) {
      // búsqueda en espiral de una casilla libre
      outer: for (let r = 1; r < 12; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
        if (g.W.walkable(x + dx, z + dz)) { x += dx; z += dz; break outer; }
      }
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
    this.provoked = false;
    this.model.root.visible = true;
    this.model.root.rotation.z = 0;
    this.yOff = 0;
    this.label.nm.textContent = `${this.def.name} · Nv. ${this.level}`;
    this.label.el.style.display = '';
    this.label._vis = true;
    this.g.ui.setHp(this.label, 1);
    this.updateColor();
  }
  // enemigos temporales (abordajes, redadas): desaparecen al morir
  remove() {
    if (this.removed) return;
    this.removed = true; this.dead = true; this.model.root.visible = false;
    this.g.scene.remove(this.model.root);
    this.label.el.remove();
    this.label._vis = false;
  }
  // cliente: aplica el estado que manda el anfitrión
  netUpdate(dt) {
    const g = this.g, a = this.net;
    if (!a) return;
    const [x, z, f, hp, dead, mv, seq, lvl, mhp] = a;
    if (lvl !== this.level || mhp !== this.maxHp) {
      this.level = lvl; this.maxHp = mhp;
      this.label.nm.textContent = `${this.def.name} · Nv. ${this.level}`;
      this.updateColor();
    }
    if (dead && !this.dead) {
      this.dead = true; this.deadT = 0; this.path = [];
      this.label.el.style.display = 'none'; this.label._vis = false;
      if (g.selTarget === this) g.selection.visible = false;
    } else if (!dead && this.dead) {
      this.dead = false; this.model.root.visible = true; this.model.root.rotation.z = 0; this.yOff = 0;
      this.x = x; this.z = z;
      this.label.el.style.display = ''; this.label._vis = true;
    }
    if (this.dead) {
      this.deadT += dt;
      if (this.deadT < 1.2) {
        this.model.root.rotation.z = Math.min(Math.PI / 2, this.deadT * 5);
        this.yOff = -Math.max(0, this.deadT - 0.6) * 0.6;
      } else this.model.root.visible = false;
      return;
    }
    if (Math.hypot(x - this.x, z - this.z) > 6) { this.x = x; this.z = z; }
    const k = Math.min(1, dt * 10);
    this.x += (x - this.x) * k;
    this.z += (z - this.z) * k;
    this.face = lerpAngle(this.face, f, k);
    this.st.moving = !!mv;
    if (this.hp !== hp) { this.hp = hp; g.ui.setHp(this.label, Math.max(0, hp) / this.maxHp); }
    if (seq !== this.lastSeq) {
      if (this.lastSeq !== undefined) { this.st.attackT = 0.32; if (this.model.kind === 'humanoid') g.slash(this, this.type === 'boss' ? 0xff5040 : 0xd0d8c0); }
      this.lastSeq = seq;
    }
    this.path = [];
  }
  // la Marina solo ataca si te buscan (recompensa alta) o si la provocas
  hostile() {
    if (this.def.famous) return !!this.provoked;
    if (!this.def.neutral) return true;
    if (this.g.isMarine()) return !!this.provoked;
    return this.provoked || (this.g.bounty || 0) >= WANTED;
  }
  updateColor() {
    const d = this.level - (this.g.player ? this.g.player.level : 1);
    const c = this.def.famous ? (this.provoked ? '#ff5ad0' : '#ffd23a') : this.def.boss ? '#ff5ad0' : this.def.neutral && !this.hostile() ? '#9ad0ff' : d >= 3 ? '#ff5a4a' : d >= 1 ? '#ffb84a' : d >= -2 ? '#7aff8a' : '#c8c8c8';
    if (this.label._c !== c) { this.label._c = c; this.label.nm.style.color = c; }
  }
  update(dt) {
    const g = this.g;
    if (g.net.isClient && g.net.active && !this.local) { this.netUpdate(dt); return; }
    if (this.stunT > 0 && !this.dead) { this.stunT -= dt; this.st.moving = false; return; }
    if (this.def.super) this.superTick(dt);
    if (this.model.kind === 'tentacle' && !this.dead) { this.model.root.rotation.z = Math.sin(this.g.time * 1.7 + this.idx) * 0.12; if (this.st.attackT > 0) this.model.root.rotation.x = Math.sin(this.st.attackT * 10) * 0.5; else this.model.root.rotation.x = 0; }
    if (this.def.famous && !this.dead) { this.famousUpdate(dt); return; }
    const p = g.enemyTarget(this);
    if (this.dead) {
      this.deadT += dt;
      if (this.deadT < 1.2) {
        this.model.root.rotation.z = Math.min(Math.PI / 2, this.deadT * 5);
        this.yOff = -Math.max(0, this.deadT - 0.6) * 0.6;
      } else this.model.root.visible = false;
      if (this.temp) { if (this.deadT > 1.3) this.remove(); return; }
      if (this.deadT > (this.def.boss ? 150 : 28)) this.respawn();
      return;
    }
    const dP = this.dist(p);
    if (dP > 34 && this.state === 'idle') return; // lejos: dormido
    this.attackCd -= dt;
    if (this.pending) {
      this.pending.t -= dt;
      if (this.pending.t <= 0) {
        this.pending = null;
        if (!p.dead && this.dist(p) < 2.0) {
          if (g.hitTarget) g.hitTarget(p, this, this.atk);
          else if (p.isRemote) g.net.hurtRemote(p.id, this.atk, this.idx);
          else g.damagePlayer(this, this.atk);
        }
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
      if (!p.dead && dP < this.def.aggro && this.hostile()) this.state = 'chase';
    } else if (this.state === 'chase') {
      if (p.dead || p.ko || fromHome > (this.temp ? 60 : 15)) {
        this.state = 'return';
        this.goTo(this.home.x, this.home.z, false, 3000);
      } else {
        // te persigue y ataca aunque te estés moviendo
        if (dP <= 1.65 && this.attackCd <= 0) {
          this.faceTo(p.x - this.x, p.z - this.z, 1);
          this.attackCd = this.def.cd;
          this.st.attackT = 0.32;
          this.pending = { t: 0.16 };
          this.atkSeq = ((this.atkSeq || 0) + 1) % 1000;
          if (this.model.kind === 'humanoid') g.slash(this, this.type === 'boss' ? 0xff5040 : 0xd0d8c0);
        }
        if (dP <= 1.3 && !p.st.moving) {
          if (this.path.length > 1) this.path = [this.path[0]];
          if (!this.path.length) this.faceTo(p.x - this.x, p.z - this.z, dt);
        } else {
          this.thinkT -= dt;
          if (this.thinkT <= 0) {
            this.thinkT = p.st.moving ? 0.3 : 0.5;
            this.goTo(p.tx, p.tz, true, 1500);
          }
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
    this.ghostIsle = makeGhostIslet();
    this.islets = [...makeIslets(), ...makeNewIslets(), ...makeIslands4(), this.ghostIsle, this.newbornIsle = makeNewbornIslet()];
    this.addBeachHouse();
    this.rooms = makeInteriors(this.W.buildings);
    this.addPosters();
    this.arena = makeArenaRegion();
    this.addMarga();
    this.dungeon = makeDungeonRegion();
    this.coralia = makeCoralia();
    this.grotto = makeGrotto();
    attachRegions(this.W, [...this.islets, ...this.rooms, this.arena, this.dungeon, this.coralia, this.grotto]);
    this.isMobile = isMobile;
    this.ENEMY_DEF = ENEMY_DEF;
    this.docks = [
      { id: 'salitre', name: 'Puerto Salitre', shipX: this.W.ship.x, shipZ: this.W.ship.z, heading: 0, land: { x: 51, z: 92 } },
      ...this.islets.filter((r) => !r.ghost).map((r) => r.dock),
    ];
    this.boat = { x: this.W.ship.x, z: this.W.ship.z, heading: 0, speed: 0, docked: 'salitre', waypoint: null };
    this.shipUp = { hull: 0, cannons: 0, sails: 0, size: 0 };
    this.bounty = 0;
    this.sailing = false;
    this.flags = {};
    this.posters = [];
    this.caves = [];
    this.side = {};
    this.chests = [];
    this.social = {};
    this.stats = {};
    this.playtime = 0;
    this.day = 0;
    this.slot = 1;
    this.harvested = new Map();
    this.stations = [];
    this.chatT = 8;
    this.ui = new UI(this);
    this.panels = new Panels(this);
    this.updater = new Updater(this);
    this.net = new Net(this);
    this.buildWorld();
    this.buildGhostProps();
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
  // casa de la playa (a la venta), junto a Puerto Salitre
  addBeachHouse() {
    const W = this.W;
    const cands = [];
    for (let z0 = 80; z0 <= 96; z0++) for (let x0 = 12; x0 <= 84; x0++) cands.push([x0, z0]);
    cands.sort((a, b) => Math.hypot(a[0] - 30, a[1] - 90) - Math.hypot(b[0] - 30, b[1] - 90));
    for (const [x0, z0] of cands) {
      let ok = true;
      for (let z = z0 - 1; z <= z0 + 4 && ok; z++) for (let x = x0 - 1; x <= x0 + 4 && ok; x++) if (!W.walkable(x, z) || W.tile(x, z) === T.WATER || W.tile(x, z) === T.DOCK || W.tile(x, z) === T.STONE) ok = false;
      if (!ok) continue;
      const b = { id: 'casaplaya', x0, z0, w: 4, d: 3, door: 's', wall: 0xf4f0e6, roof: 0x3a8ab0, plank: true, h: 1.5 };
      W.buildings.push(b);
      for (let z = z0; z < z0 + 3; z++) for (let x = x0; x < x0 + 4; x++) W.blocked[W.idx(x, z)] = 1;
      return;
    }
  }
  // tablones de Se busca en cada pueblo
  addPosters() {
    const spot = (W, x0, z0, add) => {
      for (let r = 0; r < 6; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
        const x = x0 + dx, z = z0 + dz;
        if (W.walkable(x, z) && W.tile(x, z) !== T.DOCK && W.tile(x, z) !== T.WATER) { add(x, z); return; }
      }
    };
    const W = this.W;
    for (const [x, z] of [[54, 47], [57, 87], [38, 64]]) spot(W, x, z, (px, pz) => { W.props.push({ type: 'poster', x: px, z: pz, rot: Math.PI / 4 }); W.blocked[W.idx(px, pz)] = 1; });
    const at = { tortuga: [-3, 3], duna: [1, 3], selva: [-3, -1], bastion: [3, -10], ceniza: [1, 3] };
    for (const r of this.islets) {
      const o = at[r.id];
      if (!o) continue;
      spot(r, r.center.x + o[0], r.center.z + o[1], (px, pz) => { r.props.push({ type: 'poster', x: px, z: pz, rot: Math.PI / 4 }); r.block(px, pz); });
    }
  }
  // astillera de Puerto Salitre (mejoras y reparación del barco)
  addMarga() {
    const W = this.W;
    let best = null;
    for (let r = 0; r < 8 && !best; r++) for (let dz = -r; dz <= r && !best; dz++) for (let dx = -r; dx <= r; dx++) {
      const x = 55 + dx, z = 89 + dz;
      if (W.walkable(x, z) && W.tile(x, z) !== T.DOCK) { best = { x, z }; break; }
    }
    if (!best) best = { x: 51, z: 90 };
    W.npcs.push({ id: 'marga', name: 'Astillera Marga', x: best.x, z: best.z, wander: 1, look: { shirt: 0x5a7a9a, pants: 0x3a2a1a, apron: 0x6a4a2a, hair: 0x8a3a1a, longHair: true, hat: 'bandana', capColor: 0x2a4a6a, skin: 0xe0aa80, bracers: true, bracerColor: 0x5a3a20, axe: true } });
  }
  toast(t, c) { this.ui.toast(t, c); }

  // ------------------------------------------------------------- mundo
  buildWorld() {
    const W = this.W;
    const tx = this.texSet = {
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
    this.groundMain = ground;
    this.water = buildWater(W);
    this.scene.add(this.water);
    for (const r of this.islets) {
      if (r.ghost) r.hidden = false;
      const tex = TX.makeGroundTexture(r, 20);
      const t = buildTerrain(r, tex);
      this.scene.add(t.ground, t.sides);
      if (r.ghost) { r.hidden = true; t.ground.visible = t.sides.visible = false; if (!r.newborn) t.ground.material.color.set(0x8a9aa8); r.meshes = [t.ground, t.sides]; }
      if (t.lava) { this.scene.add(t.lava); this.lavaMeshes = [...(this.lavaMeshes || []), t.lava]; }
      if (r.ghost && t.lava) { t.lava.visible = false; r.meshes.push(t.lava); }
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
      if (p.type === 'campfire') this.stations.push({ type: 'fuego', x: p.x, z: p.z });
      if (p.type === 'forge') this.stations.push({ type: 'forja', x: p.x, z: p.z });
      if (p.type === 'poster') this.posters.push({ x: p.x, z: p.z });
      if (p.type === 'cave') this.caves.push({ x: p.x, z: p.z + 1 });
      if (p.type === 'chest') this.chests.push({ id: p.id || `cofre_${p.x}_${p.z}`, x: p.x, z: p.z, loot: p.loot || { gold: 30 } });
    }
    for (const r of this.rooms) {
      for (const it of r.room.items) {
        if (it[0] === 'poster') this.posters.push({ x: r.X + Math.round(it[1]), z: r.Z + Math.round(it[2]) });
        const st = { fireplace: 'fuego', forge: 'forja', workbench: 'banco' }[it[0]];
        if (st) this.stations.push({ type: st, x: r.X + Math.round(it[1]), z: r.Z + Math.round(it[2]) });
      }
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
    this.treeMat = vmat;
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
      const k = (0.85 + ((r.x * 31 + r.z * 17) % 10) / 70) * (r.tint || 1);
      if (r.tint && r.tint < 1) rim.setColorAt(i, col.setRGB(k * 1.05, k * 0.9, k * 1.1));
      else if (r.tint) rim.setColorAt(i, col.setRGB(Math.min(1, k), k * 0.86, k * 0.66));
      else rim.setColorAt(i, col.setRGB(k, k, k * 0.98));
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
    for (const n of this.npcs) {
      const r = this.W.regionAt(n.home.x, n.home.z);
      let area = this.W.areaName(n.home.x, n.home.z);
      if (r && r.kind === 'interior') area = r.building ? this.W.areaName(r.building.x0, r.building.z0) : 'Puerto Salitre';
      n.baseLevel = npcLevel(n.id, area);
      n.setStats(n.baseLevel);
    }
    for (const s of [...W.spawns, ...this.islets.flatMap((r) => r.spawns), ...this.coralia.spawns, ...this.grotto.spawns]) {
      for (let i = 0; i < s.count; i++) { const e = new Enemy(this, s.type, s, s.lvl); e.idx = this.enemies.length; this.enemies.push(e); }
    }
    this.baseEnemies = this.enemies.length;
    for (const r of this.rooms) {
      r.doorLabel = this.ui.makeLabel('door', r.front ? '🚪 ' + r.name : '');
      r.exitLabel = this.ui.makeLabel('door', '🚪 Salir');
    }
    for (const t of W.towers) {
      if (!t.guard) continue;
      const m = HUM(animeLook({ id: 'vigia' + t.x + t.z, look: { shirt: 0x3a5a8a, pants: 0x2a2a3a, hat: 'helmet', armor: true, spear: true, skin: 0xe0aa80, hair: 0x3a2a1a } }));
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
      if (k === 'e') { e.preventDefault(); const a = this.contextAction(); if (a && a.fn && a.label !== 'Atacar') a.fn(); }
      if (k === 'q') this.player.usePotion();
      if (k === 'k') this.toggleMount();
      if (k === 'b' && !e.repeat) this.blockPress(true);
      if (k === 'i' || k === 'b') this.panels.isOpen ? this.panels.close() : this.panels.openInventory();
      if (k === 'l') this.panels.isOpen ? this.panels.close() : this.panels.openBitacora();
      if (k === 'r') this.player.running = !this.player.running;
      if (k === 'm' || k === 'tab') { e.preventDefault(); $('minimapWrap').click(); }
      if (k === 'escape') {
        if (this.panels.isOpen) this.panels.close();
        else if (this.ui.dialogOpen) this.ui.closeDialog();
        else this.toggleMenu();
      }
      if (this.ui.dialogOpen && /^[1-9]$/.test(k)) {
        const b = $('dopts').children[Number(k) - 1];
        if (b) b.click();
      }
    });
    window.addEventListener('keyup', (e) => { this.keys.delete(e.key.toLowerCase()); if (e.key.toLowerCase() === 'b') this.blockPress(false); });
    window.addEventListener('blur', () => this.keys.clear());

    // pointerdown: responde aunque otro dedo esté en el joystick (multitáctil)
    const press = (id, fn) => {
      const el = $(id);
      el.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); fn(e); });
      el.addEventListener('click', (e) => e.preventDefault());
    };
    press('btnAction', () => { this.attackHeld = true; this.doAction(); });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) $('btnAction').addEventListener(ev, () => { this.attackHeld = false; });
    press('btnPotion', () => this.player.usePotion());
    press('btnRun', () => { this.player.running = !this.player.running; sfx('click'); });
    press('btnUse', () => { if (!this.started || this.paused || this.ui.dialogOpen) return; const a = this.contextAction(); if (a && a.fn && a.label !== 'Atacar') a.fn(); });
    press('btnMed', () => this.meditate());
    press('btnMount', () => this.toggleMount());
    $('btnBlock').addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this.blockPress(true); });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) $('btnBlock').addEventListener(ev, () => this.blockPress(false));
    $('photoUI').addEventListener('click', (e) => { const b = e.target.closest('[data-ph]'); if (b) this.photoAction(b.dataset.ph); });
    press('btnBuild', () => this.panels.openBuild());
    $('btnBag').addEventListener('click', () => { if (this.started) this.panels.openInventory(); });
    $('btnLog').addEventListener('click', () => { if (this.started) this.panels.openBitacora(); });
    $('btnGuide').addEventListener('click', () => this.panels.openGuide());
    $('btnNet').addEventListener('click', () => { if (this.started) this.panels.openNet(); });
    if (this.setupHud4) this.setupHud4();
    $('btnOrders').addEventListener('click', () => { if (this.started) this.ordersMenu(); });
    $('btnTravel').addEventListener('click', () => { if (this.started) this.travelMenu(); });
    $('btnMenu').addEventListener('click', () => this.toggleMenu());
    window.onAndroidBack = () => {
      if (!this.started) return false;
      if (this.panels.isOpen) { this.panels.close(); return true; }
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
    for (const r of this.net.remotes.values()) if (r.model && !r.dead && Math.hypot(r.x - p.x, r.z - p.z) < 25) consider(r, 'remote');
    if (best && best.kind === 'remote') {
      const r = best.a;
      if (this.net.room.pvp && !this.net.sameTeam(this.net.myId, r.id)) { p.setTarget({ kind: 'enemy', ref: r }); this.selection.visible = true; this.selTarget = r; }
      else this.remoteMenu(r);
      return;
    }
    if (best) {
      if (best.kind === 'enemy') {
        p.setTarget({ kind: 'enemy', ref: best.a });
        this.selection.visible = true;
        this.selTarget = best.a;
      } else if (best.a.fight) {
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
      if (Math.hypot(s.x - sx, s.y - sy) < 75 && Math.hypot(this.boat.x - p.x, this.boat.z - p.z) < 30) { if (this.canBoard()) this.shipMenu(); else p.setTarget({ kind: 'ship' }); return; }
    }
    if (!inRoom) {
      for (const r of this.rooms) {
        if (!r.front || Math.hypot(r.front.x - p.x, r.front.z - p.z) > 25) continue;
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
    if (!p.walkFn(gx, gz)) {
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
  doorAt(x, z) { return this.rooms.find((r) => r.door && r.door.x === x && r.door.z === z) || null; }
  checkTriggers(p) {
    const r = this.roomAt(p.x, p.z);
    if (r && p.tx === r.exit.x && p.tz === r.exit.z) this.exitRoom(r);
  }
  enterRoom(r) {
    const p = this.player;
    if (HOUSES[r.id] && !this.flags[HOUSES[r.id].flag]) { this.toast(`🏠 ${HOUSES[r.id].name}: se vende por ${HOUSES[r.id].price} oro. Habla con el Escribano Lope (Ayuntamiento)`); p.path = []; p.target = null; return; }
    p.x = r.inside.x; p.z = r.inside.z; p.path = []; p.target = null;
    setTimeout(() => this.placeFollowers(p.tx, p.tz), 0);
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
    if (r.id.startsWith('bodega')) {
      if (this.holdFromSea) { this.holdFromSea = false; p.x = this.boat.x; p.z = this.boat.z; this.board(true); return; }
      const d = this.docks.find((k) => k.id === this.boat.docked) || this.docks[0];
      p.x = d.land.x; p.z = d.land.z; p.path = []; p.target = null;
      this.camTarget.set(p.x, 0, p.z);
      this.placeFollowers(p.tx, p.tz);
      return;
    }
    p.x = r.front.x; p.z = r.front.z; p.path = []; p.target = null;
    setTimeout(() => this.placeFollowers(p.tx, p.tz), 0);
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
  board(silent) {
    const p = this.player, b = this.boat;
    this.deck = null;
    if (b.docked) this.lastDock = b.docked;
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
    if (!silent) { this.ui.toast('⛵ ¡A navegar! Joystick o toca el mar'); sfx('quest'); }
    // tripulación y pareja en cubierta
    const deck = [[0.6, 1.4], [-0.6, 1.4], [0.6, 0.3], [-0.6, 0.3], [0.6, -0.8], [-0.6, -0.8], [0, 2.4], [0.5, 2.0], [-0.5, 2.0], [0.4, -1.6], [-0.4, -1.6]];
    [...this.following(), ...this.crew().filter((c) => this.soc(c.id).role === 'ship')].forEach((n, i) => {
      const [x, z] = deck[i % deck.length];
      n.model.root.visible = true;
      n.onShip = true;
      n.path = [];
      this.ship.add(n.model.root);
      n.model.root.position.set(x, 0.72, z);
      n.model.root.rotation.set(0, (i % 2 ? -1 : 1) * 1.2, 0);
      n.st.moving = false;
      n.label.el.style.display = 'none';
      n.label._vis = false;
    });
  }
  unboardCrew(x, z) {
    for (const n of this.npcs) {
      if (!n.onShip) continue;
      n.onShip = false;
      this.scene.add(n.model.root);
      n.model.root.rotation.set(0, 0, 0);
      this.placeNear(n, x, z);
    }
  }
  nearDock() {
    const b = this.boat;
    for (const d of this.docks) if (Math.hypot(b.x - d.shipX, b.z - d.shipZ) < 7) return d;
    return null;
  }
  dock(d) {
    const p = this.player, b = this.boat;
    this.deck = null;
    this.autoHelm = null;
    b.x = d.shipX; b.z = d.shipZ; b.heading = d.heading; b.speed = 0; b.docked = d.id; b.waypoint = null;
    this.sailing = false;
    this.scene.add(p.model.root);
    p.model.root.rotation.set(0, 0, 0);
    p.x = d.land.x; p.z = d.land.z; p.path = [];
    this.unboardCrew(p.x, p.z);
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
    return x < -104 || z < -104 || x > 244 || z > 244;
  }
  updateBoat(dt) {
    const b = this.boat, p = this.player;
    let j = this.joyVector();
    if (this.deck) { this.moveOnDeck(dt, j); j = null; }
    if (!j && this.autoHelm) this.autoPilot(dt);
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
      target = 5.5 * this.shipStats().speed * throttle * Math.max(0.2, Math.cos(diff));
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
    if (c.id === 'naciente_cofre') { this.give('obsidiana', 3, c.x, c.z); this.give('meteorito', 2, c.x, c.z); if (Math.random() < 0.3) this.give('huevo_dragon', 1); }
    if (c.id.startsWith('gruta_')) { this.flags[c.id + '_day'] = this.day; this.give('cristal', 2, c.x, c.z); }
    if (c.id.startsWith('coralia_')) { this.flags[c.id + '_day'] = this.day; this.give('coral', 2, c.x, c.z); }
    if (Math.random() < 0.5) setTimeout(() => this.addTreasureMap(), 1200);
    const gold = c.loot.gold || 0, pot = c.loot.potion || 0;
    p.gold += gold;
    p.inv.potion += pot;
    this.ui.float(`+${gold} oro`, 'gold', c.x, 1.0, c.z);
    if (pot) setTimeout(() => this.ui.float(`+${pot} 🍶`, 'info', c.x, 1.3, c.z), 300);
    this.ui.toast(`🎁 ¡Tesoro! +${gold} oro${pot ? ` y ${pot} ron` : ''}`);
    sfx('coin');
    setTimeout(() => sfx('quest'), 250);
    const cur = questAt(this.quest.stage, this);
    if (cur && cur.type === 'chest' && cur.target === c.id) this.advanceQuest();
    this.save();
  }

  // estela del tajo de espada
  slash(actor, color) {
    if (!this.fx) this.fx = [];
    const g = new THREE.Group();
    const geo = new THREE.RingGeometry(0.38, 0.66, 18, 1, -Math.PI / 2 - 1.15, 2.3);
    geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    g.add(m);
    const s = actor.model.root.scale.x;
    g.position.set(actor.x, (actor.vy || 0) + 0.62 * s, actor.z);
    g.rotation.set(0, actor.face, 0.35);
    g.scale.setScalar(s);
    this.scene.add(g);
    this.fx.push({ g, m, t: -0.1, life: 0.26 });
  }
  updateFx(dt) {
    if (this.fx) for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i];
      f.t += dt;
      if (f.t < 0) continue;
      const k = f.t / f.life;
      f.m.material.opacity = 0.55 * Math.sin(Math.min(1, k) * Math.PI);
      f.g.rotation.y += dt * 4;
      f.g.scale.multiplyScalar(1 + dt * 0.8);
      if (k >= 1) { this.scene.remove(f.g); f.m.geometry.dispose(); f.m.material.dispose(); this.fx.splice(i, 1); }
    }
    // ondas al nadar
    const p = this.player;
    if (!this.ripple) {
      this.ripple = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.38, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false }));
      this.ripple.rotation.x = -Math.PI / 2;
      this.scene.add(this.ripple);
    }
    const sw = p.st.swim && !this.sailing && !p.dead;
    this.ripple.visible = sw;
    if (sw) {
      const k = (this.time * 1.3) % 1;
      this.ripple.position.set(p.x, -0.1, p.z);
      this.ripple.scale.setScalar(1 + k * 1.4);
      this.ripple.material.opacity = 0.55 * (1 - k);
    }
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
      const nv = this.navalAction();
      if (nv) return nv;
      if (!this.deck && this.grottoNear && this.grottoNear()) return { icon: '🚣', label: 'Gruta', fn: () => this.enterGrotto() };
      if (!this.deck && this.velariaNear && this.velariaNear()) return { icon: '🏙', label: 'Velaria', fn: () => this.velariaShop() };
      const d = this.nearDock();
      if (d && !this.deck) return { icon: '⚓', label: 'Atracar', fn: () => this.dock(d) };
      const ls = !this.deck && Math.abs(this.boat.speed) < 1.5 ? this.landSpot() : null;
      if (ls) return { icon: '🏝', label: 'Desembarcar', fn: () => this.disembark(ls) };
      return { icon: '⚙️', label: 'Barco', fn: () => this.sailMenu() };
    }
    if (this.jailNear && this.jailNear()) return { icon: '🔓', label: 'Liberar', fn: () => this.startRescue() };
    const c7 = this.contextAction7 && this.contextAction7();
    if (c7) return c7;
    const cap = this.canCapture && this.canCapture();
    if (cap) return { icon: '⛓️', label: 'Capturar', fn: () => this.capture(cap) };
    const inRoom = this.roomAt(p.x, p.z);
    if (inRoom && Math.hypot(p.x - inRoom.exit.x, p.z - inRoom.exit.z) < 2.3) return { icon: '🚪', label: 'Salir', fn: () => this.exitRoom(inRoom) };
    if (!inRoom) {
      for (const r of this.rooms) if (r.front && Math.hypot(p.x - r.front.x, p.z - r.front.z) < 1.6) return { icon: '🚪', label: 'Entrar', fn: () => p.setTarget({ kind: 'door', ref: r }) };
      if (this.canBoard()) return { icon: '⛵', label: 'Barco', fn: () => this.shipMenu() };
    }
    for (const c of this.chests) {
      if (!this.flags[c.id] && Math.max(Math.abs(c.x - p.tx), Math.abs(c.z - p.tz)) <= 1) return { icon: '🎁', label: 'Abrir', fn: () => p.setTarget({ kind: 'chest', ref: c }) };
    }
    if (this.dgLock) void 0;
    for (const ps of this.posters) if (Math.hypot(ps.x - p.x, ps.z - p.z) < 1.7) return { icon: '📜', label: 'Se busca', fn: () => this.panels.openPosters() };
    if (this.inCoralia()) {
      if (Math.hypot(p.x - this.coralia.exit.x, p.z - this.coralia.exit.z) < 1.8) return { icon: '🔔', label: 'Subir', fn: () => this.surface() };
    }
    if (this.inGrotto && this.inGrotto()) {
      if (Math.hypot(p.x - this.grotto.exit.x, p.z - this.grotto.exit.z) < 1.8) return { icon: '🚣', label: 'Salir', fn: () => this.surface() };
      const cr = this.crystalNear();
      if (cr) return { icon: '💎', label: 'Cristal', fn: () => this.mineCrystal(cr) };
    }
    const clam = this.clamNear();
    if (clam) return { icon: '🐚', label: 'Almeja', fn: () => this.pickClam(clam) };
    if (this.inDungeon() && !this.inCoralia() && !this.inGrotto()) {
      if (Math.hypot(p.x - this.dungeon.exit.x, p.z - this.dungeon.exit.z) < 1.8) return { icon: '🚪', label: 'Salir', fn: () => this.leaveDungeon() };
    }
    for (const c of this.caves) if (Math.hypot(c.x - p.x, c.z - p.z) < 1.9) return { icon: '🕯️', label: 'Cripta', fn: () => this.enterDungeon(c) };
    const tm = this.mapNear();
    if (tm) return { icon: '⛏️', label: 'Cavar', fn: () => this.dig(tm) };
    const room0 = this.roomAt(p.x, p.z);
    if (room0 && HOUSES[room0.id]) {
      const bd = room0.room.items.find((it) => it[0] === 'bed');
      if (bd && Math.hypot(room0.X + bd[1] - p.x, room0.Z + bd[2] - p.z) < 1.8) return { icon: '😴', label: 'Dormir', fn: () => this.sleepHere() };
      const ch = room0.room.items.find((it) => it[0] === 'chest');
      if (ch && Math.hypot(room0.X + ch[1] - p.x, room0.Z + ch[2] - p.z) < 1.8) return { icon: '📦', label: this.net.active && this.clan ? 'Cofre clan' : 'Cofre', fn: () => this.openChestPanel() };
    }
    const hold = this.inHold();
    if (hold) {
      const dn = this.decorNear();
      if (dn) return { icon: '🪑', label: 'Mueble', fn: () => this.ui.openDialog('🪑 Mueble', '¿Guardar este mueble? Recuperas la mitad de su precio.', [{ label: '♻️ Guardar', action: () => this.removeDecor(dn) }, { label: 'Dejarlo', action: null }]) };
      if (!(Math.hypot(p.x - hold.exit.x, p.z - hold.exit.z) < 2.3)) return { icon: '🪑', label: 'Decorar', fn: () => this.panels.openDecor() };
    }
    if (this.canCallShip()) return { icon: '📯', label: 'Llamar barco', fn: () => this.callShip() };
    const sb = this.structNear(1.9);
    if (sb) return { icon: '🔨', label: 'Estructura', fn: () => this.structMenu(sb) };
    const fam = this.famousAt(2.4);
    if (fam) return { icon: this.isMarine() ? '⛓️' : '⚔️', label: 'Retar', fn: () => this.challengeFamous(fam) };
    const stn = this.nearStation();
    if (stn) {
      const L = { fuego: ['🍳', 'Cocinar'], forja: ['⚒️', 'Forjar'], banco: ['🪚', 'Banco'] }[stn.type];
      if (!(p.target && p.target.kind === 'enemy')) return { icon: L[0], label: L[1], fn: () => this.panels.openCraft(stn.type) };
    }
    if (p.target && p.target.kind === 'enemy') return { icon: '⚔️', label: 'Atacar', fn: () => this.attackPress() };
    const fld = this.nearField();
    if (fld) return { icon: '🌾', label: 'Cosechar', fn: () => this.harvestWheat(fld) };
    let ne = null, nd = 5;
    for (const e of this.enemies) { if (e.dead || (e.hostile && !e.hostile())) continue; const d = e.dist(p); if (d < nd) { nd = d; ne = e; } }
    let nn = null, nnd = 2.2;
    for (const n of this.npcs) { const d = n.dist(p); if (d < nnd) { nnd = d; nn = n; } }
    if (nn && (!ne || nnd < 1.8)) return { icon: '💬', label: 'Hablar', fn: () => p.setTarget({ kind: 'npc', ref: nn }) };
    if (ne) return { icon: '⚔️', label: 'Atacar', fn: () => this.attackPress() };
    if (this.nearWater() && !this.fishing) return { icon: '🎣', label: 'Pescar', fn: () => this.startFishing() };
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
    // el botón grande siempre ataca (o dispara los cañones navegando); las demás acciones van en el botón de usar
    this.attackPress();
  }
  // ataque manual: golpea al objetivo seleccionado o al enemigo más cercano a tu alcance; si no hay, tajo al aire
  attackPress() {
    const p = this.player;
    if (this.sailing) { this.fireCannons && this.fireCannons(); return; }
    if (p.dead || p.attackCd > 0) return;
    const inReach = (e) => e && !e.dead && (!e.isNPC || e.fight) && p.dist(e) <= 1.9;
    let best = p.target && p.target.kind === 'enemy' && inReach(p.target.ref) ? p.target.ref : null;
    if (!best) {
      let bd = 1.9;
      const cands = [...this.enemies, ...this.npcs.filter((n) => n.fight)];
      if (this.net.room.pvp) for (const r of this.net.remotes.values()) if (!this.net.sameTeam(this.net.myId, r.id)) cands.push(r);
      for (const e of cands) { if (e.dead || e.removed || (e.hostile && !e.hostile())) continue; const d = p.dist(e); if (d < bd) { bd = d; best = e; } }
    }
    if (best) {
      p.faceTo(best.x - p.x, best.z - p.z, 1);
      p.attack(best);
      if (!best.isRemote) { this.selection.visible = true; this.selTarget = best; }
    } else p.swingAir();
  }

  talkTo(n) {
    if (n.fight) return;
    const s = this.soc(n.id);
    if (!s.met) { s.met = true; this.addFriend(n, 2, true); }
    const d = dialogFor(n.id, this);
    this.talkingTo = n;
    n.talking = true;
    n.path = n.path.slice(0, 1);
    const opts = d.options.slice();
    const last = opts[opts.length - 1];
    if (last && last.action === null) { opts.pop(); opts.push(...this.socialOptions(n), last); }
    else opts.push(...this.socialOptions(n));
    const tag = s.partner ? ' · 💗' : s.crew ? ' · ⚓' : '';
    this.ui.openDialog(`${n.name} · Nv. ${n.level}  ${heartsText(s.f)}${tag}`, d.text, opts);
  }

  buy(cost, fn) {
    const p = this.player;
    if (this.priceMul && this.priceMul() < 1 && cost.gold) cost = { ...cost, gold: Math.round(cost.gold * this.priceMul()) };
    if ((cost.gold || 0) > p.gold) return this.ui.toast('No tienes suficiente oro');
    for (const [k, v] of Object.entries(cost)) if (k !== 'gold' && (p.inv[k] || 0) < v) return this.ui.toast(`Te falta ${ITEMS[k] ? ITEMS[k].name.toLowerCase() : k}`);
    p.gold -= cost.gold || 0;
    for (const [k, v] of Object.entries(cost)) if (k !== 'gold') p.inv[k] -= v;
    sfx('coin');
    fn();
    this.save();
  }

  harvest(o, kind) {
    const p = this.player;
    o.hp--;
    if (kind === 'tree') {
      p.inv.wood++;
      this.jobXp('lenador', 3);
      if (Math.random() < this.jobLevel('lenador') * 0.02) { p.inv.wood++; this.ui.float('+1 🪵 extra', 'info', o.x, 1.7, o.z); }
      this.ui.float('+1 🪵', 'info', o.x, 1.4, o.z);
      if ((o.type === 'oak' || o.type === 'autumn') && Math.random() < 0.18) this.give('apple', 1, o.x, o.z);
    } else {
      p.inv.stone++;
      this.ui.float('+1 🪨', 'info', o.x, 0.9, o.z);
      const ore = oreDrop(this.W.areaName(o.x, o.z)) || (Math.random() < this.jobLevel('minero') * 0.01 ? oreDrop(this.W.areaName(o.x, o.z)) : null);
      if (ore) this.give(ore, 1, o.x, o.z);
      this.jobXp('minero', ore ? 5 : 3);
    }
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
    const cur = questAt(this.quest.stage, this);
    if (cur && cur.type === 'gather' && cur.target === (kind === 'tree' ? 'wood' : 'stone') && p.inv[cur.target] === cur.count) {
      const giver = this.npcs.find((n) => n.id === cur.giver);
      this.ui.toast(`✔ Ya tienes ${cur.count}. Ve con ${giver ? giver.name : ''}`);
      sfx('quest');
    }
  }

  // golpe a un enemigo: en un cliente se lo manda al anfitrión
  // crea un enemigo suelto (lo usan el multijugador y los sistemas de eventos)
  makeEnemy(type, x, z, lvl) {
    const s = { area: [Math.round(x), Math.round(z), Math.round(x), Math.round(z)], lvl: [lvl, lvl] };
    const e = new Enemy(this, type, s, s.lvl);
    e.x = x; e.z = z; e.home = { x: Math.round(x), z: Math.round(z) };
    e.idx = this.enemies.length;
    this.enemies.push(e);
    return e;
  }
  hitEnemy(e, dmg, crit, byCrew) {
    if (this.net.isClient && this.net.active && !e.local) {
      this.net.hit(e, dmg, crit);
      e.st.flash = 0.18;
      this.ui.float(String(dmg), crit ? 'crit' : 'pdmg', e.x, e.model.height + 0.2, e.z);
      sfx('hit');
      return;
    }
    this.damageEnemy(e, dmg, crit, byCrew, 0);
  }
  damageEnemy(e, dmg, crit, byCrew, killerId = 0) {
    const g = this;
    if (this.enemyEspDef) dmg = this.enemyEspDef(e, dmg, killerId, byCrew);
    if (e.def.famous && e.provoked && Math.random() < 0.2) { dmg = Math.max(1, Math.round(dmg * 0.3)); this.ui.float('¡Bloqueo!', 'info', e.x, e.model.height + 0.5, e.z); }
    e.hp -= dmg;
    e.st.flash = 0.18;
    if (e.def.neutral && !e.provoked) {
      // atacar a la Marina alerta a sus compañeros cercanos
      for (const o of this.enemies) if (o.def.neutral && (o.def.group || 'marina') === (e.def.group || 'marina') && !o.dead && o.dist(e) < 9) { o.provoked = true; o.updateColor(); if (o.state === 'idle') { o.state = 'chase'; o.thinkT = 0; } }
      if (!e.temp && (this.isMarine() || (this.bounty || 0) < WANTED)) this.toast(this.isMarine() ? '🚨 ¡Atacas a tus compañeros de la Marina!' : '🚨 ¡Has atacado a la Marina!', 'area');
    }
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
      const xp = Math.round(e.def.xp(e.level));
      if (this.selTarget === e) this.selection.visible = false;
      if (this.net.isHost && this.net.active) {
        // la experiencia se comparte con el equipo cercano
        for (const id of this.net.killRecipients(killerId, e)) {
          if (id === 0) this.grantKill(e.type, e.level, e.x, e.z, killerId === 0, xp);
          else this.net.hsend(id, { t: 'kill', et: e.type, lvl: e.level, x: r2(e.x), z: r2(e.z), killer: id === killerId, xp });
        }
      } else this.grantKill(e.type, e.level, e.x, e.z, true, xp);
    }
  }
  // recompensa de una muerte: el que la mata se lleva oro y botín; el equipo, experiencia y misión
  grantKill(type, level, x, z, isKiller, xp) {
    const p = this.player, def = ENEMY_DEF[type];
    if (isKiller) {
      const gold = def.gold(level);
      p.gold += gold;
      setTimeout(() => this.ui.float(`+${gold} oro`, 'gold', x, 0.8, z), 200);
      sfx('coin');
      if (Math.random() < (type === 'boss' ? 1 : 0.08)) { p.inv.potion++; this.ui.toast('🍶 ¡Encontraste ron curativo!'); }
      let k = 0;
      this.jobXp('cazador', 2 + Math.floor(level / 10));
      this.petOnKill(x, z);
      if (Math.random() < 0.015) this.addTreasureMap();
      this.contractTick('kill', type);
      const dropK = 1 + this.jobLevel('cazador') * 0.02;
      for (const [id, ch] of DROPS[type] || []) if (Math.random() < ch * dropK) setTimeout(() => this.give(id, 1, x, z), 350 + 250 * k++);
      this.stats.kills = (this.stats.kills || 0) + 1;
      this.stats['k_' + type] = (this.stats['k_' + type] || 0) + 1;
      this.ui.float(`+${xp} XP`, 'info', x, 1.2, z);
      this.addBounty(def.bounty || (def.boss ? 400 : Math.max(2, Math.round(level / 3))), type);
    } else {
      this.ui.float(`+${xp} XP 🤝`, 'info', p.x, 1.5, p.z);
    }
    p.gainXp(xp);
    this.crewGainXp(xp);
    this.onKill(type);
    if (type.startsWith('famous_')) { this.onKill('famous'); this.famousDefeated(type.slice(7)); if (isKiller) this.addTreasureMap(); }
  }
  // el anfitrión elige a quién persigue cada enemigo (el jugador vivo más cercano)
  enemyTarget(e) {
    const p = this.player;
    if (!(this.net.isHost && this.net.active) || !this.net.remotes.size) return p;
    let best = p.dead ? null : p, bd = best ? e.dist(p) : Infinity;
    for (const r of this.net.remotes.values()) {
      if (r.dead || !r.tgt || r.tgt.sl) continue;
      const d = e.dist(r);
      if (d < bd) { bd = d; best = r; }
    }
    return best || p;
  }
  netHurtByPlayer(from, dmg) {
    const r = this.net.remotes.get(from) || { isRemote: true, id: from, x: this.player.x, z: this.player.z, dead: false, name: '?' };
    this.damagePlayer(r, dmg);
  }
  netInvite(from, name) {
    this.ui.openDialog('👥 Invitación de equipo', `${name} te invita a formar equipo. La experiencia de los enemigos se compartirá.`, [
      { label: '🤝 Aceptar', action: () => this.net.accept(from) },
      { label: 'Rechazar', action: null },
    ]);
    sfx('quest');
  }
  remoteMenu(r) {
    const team = this.net.sameTeam(this.net.myId, r.id);
    const crew = r.crew && r.crew.length ? r.crew.join(', ') : 'sin tripulación';
    const txt = `Nivel ${r.lv}. Tripulación: ${crew}. ${r.partner ? 'Pareja: ' + r.partner + '. ' : ''}${team ? 'Es de tu equipo.' : ''}`;
    const opts = [];
    if (!this.spouseP && !this.partner()) opts.push({ label: '💍 Pedir matrimonio', action: () => this.proposeRemote(r) });
    if (this.clan && r.clan !== this.clan.name) opts.push({ label: '🏴 Invitar a mi clan', action: () => this.inviteClan(r) });
    if (r.spouse) opts.unshift({ label: `💒 Casado/a con ${r.spouse}`, action: null });
    if (!team) opts.push({ label: '🤝 Invitar a mi equipo', action: () => this.net.invite(r.id) });
    else opts.push({ label: '🚪 Salir del equipo', action: () => this.net.leaveTeam() });
    if (this.net.room.pvp && !team) opts.push({ label: '⚔️ Atacar (PvP)', action: () => { this.player.setTarget({ kind: 'enemy', ref: r }); this.selection.visible = true; this.selTarget = r; } });
    opts.push({ label: 'Cerrar', action: null });
    this.ui.openDialog(`👤 ${r.name}`, txt, opts);
  }

  damagePlayer(e, atk) {
    const p = this.player;
    if (p.dead) return;
    let dmg = Math.max(1, Math.round(atk * (0.8 + Math.random() * 0.4) * (40 / (40 + p.def)) * (this.espRes ? this.espRes() : 1) * (this.enemyEspAtk ? this.enemyEspAtk(e) : 1)));
    if (p.blocking) { dmg = this.blockDamage(e, dmg); if (dmg <= 0) return; }
    if (e.isNPC && p.hp - dmg <= p.maxHp * 0.15) { this.endFight(e, 'lose'); return; }
    p.hp -= dmg;
    p.lastCombat = this.time;
    p.st.flash = 0.18;
    this.ui.float('-' + dmg, 'dmg', p.x, 1.3, p.z);
    sfx('hurt');
    if (p.hp <= 0) {
      p.hp = 0;
      p.dead = true;
      p.deadT = 3;
      p.path = [];
      p.target = null;
      this.selection.visible = false;
      sfx('die');
      if (e.isRemote && this.huntDeath) this.huntDeath(e.id);
      if (this.onPlayerDeath5) this.onPlayerDeath5(e);
      this.ui.toast('💀 Has caído… despertarás en Villarroca');
    }
  }

  respawnPlayer() {
    const p = this.player;
    if (this.boarding) { const B = this.boarding; this.boarding = null; for (const e of B.temps) e.remove(); this.purgeTemps(); this.clearSea(); this.sailing = false; this.arenaRestore(); }
    this.fishing = null;
    if (this.raid) { for (const e of this.raid.temps) e.remove(); this.raid = null; this.purgeTemps(); }
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
    this.placeFollowers(p.tx, p.tz);
  }

  // ------------------------------------------------------------- misiones
  npcById(id) { return this.npcs.find((n) => n.id === id); }
  // ---- encargos secundarios
  acceptSide(id) {
    const q = SIDE_QUESTS[id];
    this.side[id] = { s: 1, p: 0 };
    this.toast('📜 Nuevo encargo: ' + q.title);
    sfx('quest');
    this.save();
  }
  sideDone(id) {
    const q = SIDE_QUESTS[id], st = this.side[id];
    if (!st || st.s !== 1) return false;
    if (q.type === 'gather') return (this.player.inv[q.target] || 0) >= q.count;
    return st.p >= q.count;
  }
  sideProgressText(id) {
    const q = SIDE_QUESTS[id], st = this.side[id] || { p: 0 };
    const have = q.type === 'gather' ? (this.player.inv[q.target] || 0) : st.p;
    return `${Math.min(have, q.count)} / ${q.count}`;
  }
  completeSide(id) {
    const q = SIDE_QUESTS[id], p = this.player;
    if (!this.sideDone(id)) return;
    if (q.type === 'gather') p.inv[q.target] -= q.count;
    this.side[id] = { s: 2, p: q.count };
    p.gold += q.reward.gold || 0;
    if (q.reward.xp) p.gainXp(q.reward.xp);
    if (q.reward.item) { this.give(q.reward.item, 1, p.x, p.z); this.toast('🎁 ' + ITEMS[q.reward.item].name); }
    this.ui.float(`+${q.reward.gold} oro`, 'gold', p.x, 1.6, p.z);
    this.toast('📜 Encargo completado: ' + q.title);
    const n = this.npcById(id);
    if (n) this.addFriend(n, 10);
    sfx('quest');
    this.save();
  }
  sideTick(kind, target) {
    for (const [id, st] of Object.entries(this.side || {})) {
      const q = SIDE_QUESTS[id];
      if (!q || st.s !== 1 || q.type !== kind || q.target !== target) continue;
      st.p++;
      if (st.p === q.count) { const n = this.npcById(id); this.toast(`✔ Encargo cumplido: vuelve con ${n ? n.name : ''}`); sfx('quest'); }
    }
  }
  onShipSunk(type) {
    this.sideTick('ship', type);
    this.storyTick('ship', type);
  }
  onKill(type) {
    this.sideTick('kill', type);
    this.storyTick('kill', type);
    const cur = questAt(this.quest.stage, this);
    if (!cur || cur.type !== 'kill' || cur.target !== type) return;
    this.quest.progress++;
    if (this.quest.progress === cur.count) {
      const gv = this.npcById(cur.giver);
      this.ui.toast(`✔ ¡Objetivo cumplido! Vuelve con ${gv ? gv.name : ''}`);
      sfx('quest');
    }
  }
  advanceQuest() {
    const cur = questAt(this.quest.stage, this);
    const p = this.player;
    if (cur.reward) {
      if (cur.reward.gold) p.gold += cur.reward.gold;
      if (cur.reward.item) { this.give(cur.reward.item, 1, p.x, p.z); this.ui.toast('🎁 ' + ITEMS[cur.reward.item].name); }
      if (cur.reward.xp) p.gainXp(cur.reward.xp);
      this.ui.float(`+${cur.reward.gold || 0} oro`, 'gold', p.x, 1.6, p.z);
    }
    if (this.quest.stage > 0 || cur.type !== 'talk') this.ui.toast('📜 Misión completada');
    this.quest.stage = Math.min(QUESTS.length - 1, this.quest.stage + 1);
    this.quest.progress = 0;
    const nq = questAt(this.quest.stage, this);
    setTimeout(() => this.ui.toast('Nueva misión: ' + nq.title), 900);
    if (nq.type === 'chest' && this.flags[nq.target]) setTimeout(() => this.advanceQuest(), 2500);
    sfx('quest');
    this.save();
  }
  questAtCur() { return questAt(this.quest.stage, this); }
  questInfo() {
    const q = this.quest;
    const cur = questAt(q.stage, this);
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
    const cur = questAt(q.stage, this);
    if (!cur || cur.type === 'done') return null;
    const npc = (id) => { const n = this.npcById(id); return n ? { x: n.x, z: n.z } : null; };
    if (cur.type === 'talk') return npc(cur.target);
    if (cur.type === 'kill') {
      if (q.progress >= cur.count) return npc(cur.giver);
      const zones = { wolf: [50, 20], crab: [70, 80], boar: [20, 41], skeleton: [85, 50], boss: [87, 56] };
      const z = cur.zone || zones[cur.target];
      if (!z) return cur.target === 'famous' && this.famousNear ? this.famousNear() : null;
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
    const cur = questAt(q.stage, this);
    if (!cur) return '';
    if (cur.type === 'talk' && cur.target === n.id) return '!';
    if (cur.giver === n.id) {
      if (cur.type === 'kill') return q.progress >= cur.count ? '!' : '?';
      if (cur.type === 'gather') return this.player.inv[cur.target] >= cur.count ? '!' : '?';
    }
    return '';
  }

  // ------------------------------------------------------------- guardado (3 ranuras)
  saveData() {
    const p = this.player;
    for (const n of this.crew()) this.soc(n.id).lvl = n.level;
    const pos = this.sailing || this.boarding
      ? (() => { const d = this.docks.find((k) => k.id === this.lastDock) || this.docks[0]; return { x: d.land.x, z: d.land.z, boatDock: d.id }; })()
      : { x: p.tx, z: p.tz, boatDock: this.boat.docked || this.lastDock || 'salitre' };
    return {
      v: 2, name: p.name, ap: p.ap, equip: p.equip, level: p.level, xp: p.xp, gold: p.gold, hp: p.hp,
      inv: p.inv, quest: this.quest, tod: this.tod, flags: this.flags, social: this.social, stats: this.stats,
      playtime: Math.round(this.playtime), day: this.day, area: this.boarding ? 'Mar de Bruma' : this.W.areaName(p.tx, p.tz), ...pos,
      crewQ: this.crewQ || {}, market: this.net.isHost ? (this.market || []) : [],
      mounts: this.ownMounts || [], mountSel: this.mountSel || null, logros: this.logros || {}, title: this.title || null, clan: this.clan || null, stashes: this.stashes || {},
      pets: this.ownPets || [], pet: this.petType || null, petXp: this.petXp || {}, flagCfg: this.flagCfg || null, love: this.loveData || null, spouseP: this.spouseP || null,
      tmaps: this.tmaps || [], raceBoard: this.raceBoard || [],
      famous: this.famous, weather: this.weather, jobs: this.jobs || {}, jobBoard: this.jobBoard ? { day: this.jobBoard.day, list: this.jobBoard.list } : null, wardrobe: this.wardrobe || [],
      shipDecor: (this.shipDecor || []).map((d) => ({ room: d.room, t: d.t, lx: d.lx, lz: d.lz, rot: d.rot })), builds: this.builds ? this.builds.map((b) => ({ t: b.t, x: b.x, z: b.z, hp: Math.round(b.hp), town: b.town, strong: b.strong, grow: b.grow, crop: b.crop || null, cropN: b.cropN, cropT: b.cropT, water: b.water, stock: b.stock || 0 })) : [], townDef: this.townDef || {},
      esp: this.esp || null, hunts: this.hunts || null, fishDex: this.fishDex || {}, child: this.child || null, childDay: this.childDay ?? null, crewOrder: this.crewOrder || 'follow', smuggle: this.smuggle || null,
      bounty: this.bounty || 0, honor: this.honor || 0, shipUp: this.shipUp, shipHp: Math.round(this.boat.hp || 0), side: this.side || {},
    };
  }
  save() {
    if (!this.started) return;
    store(SLOT_KEY(this.slot), this.saveData());
  }

  // ------------------------------------------------------------- menú principal
  initMenus() {
    // migrar partida antigua a la ranura 1
    const old = load(SAVE_KEY);
    if (old && !load(SLOT_KEY(1))) {
      store(SLOT_KEY(1), { ...old, v: 2, ap: { ...DEFAULT_AP, skin: old.skin ?? 1 }, equip: { weapon: 'espada_madera' }, playtime: 0 });
    }
    this.ap = { ...DEFAULT_AP };
    const renderSlots = () => {
      const box = $('slots');
      box.innerHTML = '';
      for (let i = 1; i <= 3; i++) {
        const d = load(SLOT_KEY(i));
        const card = document.createElement('div');
        card.className = 'slotCard' + (d ? '' : ' empty');
        card.innerHTML = d
          ? `<div class="sc1"><b>${String(d.name).replace(/[<>&]/g, '')}</b><span>Nv. ${d.level || 1}</span></div>
             <div class="sc2">${d.area || 'Isla Bruma'} · ⏱ ${fmtTime(d.playtime || 0)}</div>
             <div class="sc3"><button class="wbtn primary" data-slot="${i}" data-a="play">▶ Jugar</button><button class="wbtn danger" data-slot="${i}" data-a="del">🗑</button></div>`
          : `<div class="sc1"><b>Ranura ${i}</b><span>vacía</span></div><div class="sc3"><button class="wbtn" data-slot="${i}" data-a="new">＋ Nueva partida</button></div>`;
        box.appendChild(card);
      }
    };
    renderSlots();
    $('slots').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      sfx('click');
      const i = Number(b.dataset.slot);
      if (b.dataset.a === 'play') { this.slot = i; this.startGame(load(SLOT_KEY(i))); }
      if (b.dataset.a === 'del' && confirm(`¿Borrar la partida de la ranura ${i}?`)) { try { localStorage.removeItem(SLOT_KEY(i)); } catch (err) { /* nada */ } renderSlots(); }
      if (b.dataset.a === 'new') { this.slot = i; $('scrSlots').classList.add('hidden'); $('scrCreate').classList.remove('hidden'); $('start').classList.add('creating'); this.viewTarget = 4.6; refresh(); }
    });
    $('btnBack').addEventListener('click', () => { sfx('click'); $('scrCreate').classList.add('hidden'); $('scrSlots').classList.remove('hidden'); $('start').classList.remove('creating'); this.viewTarget = 6; });
    $('btnGuideMenu').addEventListener('click', () => this.panels.openGuide());
    $('btnUpdateMenu').addEventListener('click', () => this.updater.check(true));
    const cur = this.updater.current();
    $('footVer').textContent = `TheBruma v${cur.name} · RPG medieval y pirata 2.5D`;
    setTimeout(() => this.updater.check(false), 2500);

    // creador de personaje
    const opt = (boxId, list, key, render) => {
      const box = $(boxId);
      box.innerHTML = '';
      list.forEach((it, i) => {
        const b = document.createElement('button');
        b.className = 'copt' + (this.ap[key] === i ? ' sel' : '');
        render(b, it, i);
        b.addEventListener('click', () => {
          sfx('click');
          this.ap[key] = i;
          if (key === 'gender') this.ap.hair = 0;
          refresh();
        });
        box.appendChild(b);
      });
    };
    const hex = (c) => '#' + c.toString(16).padStart(6, '0');
    const refresh = () => {
      const ap = this.ap;
      opt('genders', ['m', 'f'], 'genderIdx', (b, g) => { b.textContent = g === 'm' ? '♂ Chico' : '♀ Chica'; b.classList.toggle('sel', ap.gender === g); });
      [...$('genders').children].forEach((b, i) => { b.onclick = () => { sfx('click'); ap.gender = i ? 'f' : 'm'; ap.hair = 0; ap.beard = false; ap.body = 0; ap.face = 0; refresh(); }; });
      const hairs = ap.gender === 'f' ? HAIRF : HAIRM;
      opt('bodies', ap.gender === 'f' ? BODY_F : BODY_M, 'body', (b, it) => { b.textContent = it.name; });
      opt('shapes', FACE_SHAPES, 'faceShape', (b, it) => { b.textContent = it.name; });
      opt('faces', ap.gender === 'f' ? FACES_F : FACES_M, 'face', (b, it) => { b.textContent = it.name; });
      opt('eyes', EYE_COLORS, 'eye', (b, it) => { b.classList.add('sw'); b.style.background = it.c; b.title = it.name; });
      opt('hairs', hairs, 'hair', (b, h) => { b.textContent = h.name; });
      opt('hairCols', HAIRC, 'hairColor', (b, c) => { b.classList.add('sw'); b.style.background = hex(c); });
      opt('skins', SKINC, 'skin', (b, c) => { b.classList.add('sw'); b.style.background = hex(c); });
      opt('clothes', CLOTHC, 'clothes', (b, c) => { b.classList.add('sw'); b.style.background = hex(c); });
      opt('busts', ['Plano', 'Pequeño', 'Medio', 'Grande'], 'bust', (b, it) => { b.textContent = it; });
      opt('factions', ['☠ Pirata', '⚓ Marina'], 'factionIdx', (b, it, i) => { b.textContent = it; b.classList.toggle('sel', (ap.factionIdx || 0) === i); });
      $('bustRow').classList.toggle('hidden', ap.gender !== 'f');
      const det = $('details');
      det.innerHTML = '';
      const tg = (key, on, off) => {
        const b = document.createElement('button');
        b.className = 'copt' + (ap[key] !== false ? ' sel' : '');
        b.textContent = ap[key] !== false ? on : off;
        b.onclick = () => { sfx('click'); ap[key] = ap[key] === false; refresh(); };
        det.appendChild(b);
      };
      tg('nose', 'Con nariz', 'Sin nariz');
      tg('mouth', 'Con boca', 'Sin boca');
      tg('blush', 'Con rubor', 'Sin rubor');
      if (ap.gender !== 'f') {
        const b = document.createElement('button');
        b.className = 'copt' + (ap.beard ? ' sel' : '');
        b.textContent = ap.beard ? 'Con barba' : 'Sin barba';
        b.onclick = () => { sfx('click'); ap.beard = !ap.beard; refresh(); };
        det.appendChild(b);
      }
      this.player.ap = { ...ap };
      this.player.equip = { weapon: 'espada_madera', feet: 'botas_cuero' };
      this.player.refreshLook();
    };
    $('btnNew').addEventListener('click', () => {
      const name = ($('nameInput').value || 'Aventurero').trim().slice(0, 14) || 'Aventurero';
      const sp = this.W.landmarks.spawn;
      this.startGame({
        v: 2, name, ap: { ...this.ap }, equip: { weapon: 'espada_madera', feet: 'botas_cuero' },
        inv: { potion: 2, f_bread: 2 }, x: sp.x, z: sp.z, quest: { stage: 0, progress: 0 }, fresh: true,
      });
    });

    if (window.AndroidBridge) document.body.classList.add('android');
    $('menu').addEventListener('click', (e) => {
      if (e.target.id === 'menu') this.toggleMenu(false);
      const act = e.target.dataset && e.target.dataset.act;
      if (!act) return;
      sfx('click');
      if (act === 'resume') this.toggleMenu(false);
      if (act === 'save') { this.save(); this.ui.toast('💾 Partida guardada'); this.toggleMenu(false); }
      if (act === 'photo') { this.toggleMenu(false); this.photoMode(true); }
      if (act === 'music') { this.settings.music = this.settings.music === false; store(SETTINGS_KEY, this.settings); this.refreshMenu(); }
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
      if (act === 'help') { this.toggleMenu(false); this.panels.openGuide(); }
      if (act === 'update') { this.toggleMenu(false); this.updater.check(true); }
      if (act === 'net') { this.toggleMenu(false); this.panels.openNet(); }
      if (act === 'title') { this.save(); location.reload(); }
      if (act === 'reset') {
        if (confirm('¿Borrar esta partida y volver al menú?')) {
          this.started = false;
          try { localStorage.removeItem(SLOT_KEY(this.slot)); } catch (err) { /* nada */ }
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
    $('menu').querySelector('[data-act=music]').textContent = 'Música: ' + (this.settings.music === false ? 'No' : 'Sí');
    $('menu').querySelector('[data-act=quality]').textContent = 'Calidad: ' + q;
    $('mstats').innerHTML = `
      <span>Nombre: <b>${p.name.replace(/[<>&]/g, '')}</b></span><span>Nivel: <b>${p.level}</b></span>
      <span>Salud: <b>${Math.ceil(p.hp)} / ${p.maxHp}</b></span><span>Ataque: <b>${Math.round(p.atk)}</b></span>
      <span>Armadura: <b>${p.def}</b></span><span>Tiempo: <b>${fmtTime(this.playtime)}</b></span>
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
    p.ap = { ...DEFAULT_AP, ...(data.ap || {}) };
    p.equip = data.equip || { weapon: 'espada_madera' };
    p.refreshLook();
    p.level = data.level || 1;
    p.xp = data.xp || 0;
    p.gold = data.gold ?? 10;
    p.inv = { wood: 0, stone: 0, potion: 2, ...(data.inv || {}) };
    p.recalc();
    p.hp = data.hp ?? p.maxHp;
    if (p.hp <= 0) p.hp = p.maxHp;
    p.stamina = p.maxSt;
    p.x = data.x; p.z = data.z;
    if (!this.W.walkable(p.x, p.z)) { p.x = this.W.landmarks.spawn.x; p.z = this.W.landmarks.spawn.z; }
    this.quest = data.quest || { stage: 0, progress: 0 };
    this.flags = data.flags || {};
    this.social = data.social || {};
    this.stats = data.stats || {};
    this.playtime = data.playtime || 0;
    this.day = data.day || 0;
    this.bounty = data.bounty || 0;
    this.honor = data.honor || 0;
    this.esp = data.esp || null; this.hunts = data.hunts || null; this.fishDex = data.fishDex || {};
    this.child = data.child || null; this.childDay = data.childDay ?? undefined; this.crewOrder = data.crewOrder || 'follow'; this.smuggle = data.smuggle || null;
    if (data.famous) { this.famousInit(); for (const [k, v] of Object.entries(data.famous)) if (this.famous[k]) Object.assign(this.famous[k], v); }
    if (data.weather) this.weather = data.weather;
    this.jobs = data.jobs || {};
    this.ownPets = data.pets || []; this.petXp = data.petXp || {}; this.setPet(data.pet || null);
    this.flagCfg = data.flagCfg || null; this.loveData = data.love || null; this.spouseP = data.spouseP || null;
    this.tmaps = data.tmaps || []; this.player.inv.mapa_tesoro = this.tmaps.length; this.raceBoard = data.raceBoard || [];
    if (this.flagCfg) this.applyFlag(this.ship, this.flagCfg);
    this.refreshHouseLabels();
    this.crewQ = data.crewQ || {};
    this.ownMounts = data.mounts || []; this.mountSel = data.mountSel || null; this.logros = data.logros || {}; this.title = data.title || null; this.clan = data.clan || null; this.stashes = data.stashes || {};
    this.jobBoard = data.jobBoard || null;
    this.wardrobe = data.wardrobe || [];
    this.migrateCos();
    this.loadDecor(data.shipDecor || []);
    this.townDef = data.townDef || {};
    if (this.loadBuilds) this.loadBuilds(data.builds || []);
    this.side = data.side || {};
    this.shipUp = { hull: 0, cannons: 0, sails: 0, size: 0, ...(data.shipUp || {}) };
    this.boat.hp = undefined;
    this.applyShipUpgrades();
    if (data.shipHp) this.boat.hp = Math.min(this.boat.maxHp, data.shipHp);
    this.applyShipDecor();
    const bd = this.docks.find((k) => k.id === data.boatDock) || this.docks[0];
    Object.assign(this.boat, { x: bd.shipX, z: bd.shipZ, heading: bd.heading, speed: 0, docked: bd.id });
    if (data.tod) this.tod = data.tod;
    // tripulación guardada
    for (const n of this.npcs) {
      const s = this.social[n.id];
      if (!s) continue;
      if (s.crew) { n.setStats(Math.max(n.baseLevel, s.lvl || n.baseLevel)); this.rebuildCrewLook(n); }
      else if (s.partner && s.lvl) n.setStats(Math.max(n.baseLevel, s.lvl));
    }
    // partidas antiguas: como mucho 3 te acompañan, el resto espera en el barco
    this.activeCrew().slice(3).forEach((n) => { this.soc(n.id).role = 'ship'; });
    this.placeFollowers(p.tx, p.tz);
    this.started = true;
    document.body.classList.add('playing');
    $('start').classList.add('hidden');
    $('hud').classList.remove('hidden');
    this.viewTarget = isMobile ? 11.5 : 13;
    sfx('quest');
    setTimeout(() => this.ui.toast('TheBruma', 'area'), 300);
    if (data.fresh) setTimeout(() => this.ui.toast('📜 Habla con la Alcaldesa Marisol (!)'), 1800);
    for (const e of this.enemies) e.updateColor();
    this.save();
  }

  // ------------------------------------------------------------- objetos
  give(id, n = 1, x, z) {
    const p = this.player;
    if (EQUIP[id] && EQUIP[id].cos) { this.addCos(id); return; }
    p.inv[id] = (p.inv[id] || 0) + n;
    const it = ITEMS[id];
    if (x !== undefined && it) this.ui.float(`+${n} ${it.icon}`, 'info', x, 1.2, z);
  }
  equip(id) {
    const p = this.player, e = EQUIP[id];
    if (!e || !p.inv[id]) return;
    const prev = p.equip[e.slot];
    p.inv[id]--;
    if (prev) p.inv[prev] = (p.inv[prev] || 0) + 1;
    p.equip[e.slot] = id;
    p.recalc();
    p.refreshLook();
    sfx('coin');
  }
  unequip(slot) {
    const p = this.player, id = p.equip[slot];
    if (!id) return;
    delete p.equip[slot];
    if (!(EQUIP[id] && EQUIP[id].cos)) p.inv[id] = (p.inv[id] || 0) + 1;
    p.recalc();
    p.refreshLook();
    sfx('click');
  }
  eat(id) {
    const p = this.player, it = ITEMS[id];
    if (!it || !p.inv[id]) return;
    if (p.hp >= p.maxHp && !it.stamina) return this.ui.toast('Ya tienes la salud al máximo');
    const h = Math.round((it.type === 'heal' ? Math.round(p.maxHp * it.heal + 15) : it.heal) * (this.crewJob && this.crewJob('cocinero') ? 1.3 : 1));
    p.inv[id]--;
    p.hp = Math.min(p.maxHp, p.hp + h);
    if (it.stamina) { p.stamina = p.maxSt; p.exhausted = false; }
    this.ui.float('+' + h, 'heal', p.x, 1.4, p.z);
    this.ui.toast(`${it.icon} ${it.name}: +${h} vida`);
    sfx('drink');
  }
  craft(i) {
    const r = RECIPES[i], p = this.player;
    if (!r) return;
    if (p.gold < r.gold || !Object.entries(r.need).every(([id, n]) => (p.inv[id] || 0) >= n)) return this.ui.toast('Te faltan materiales');
    p.gold -= r.gold;
    for (const [id, n] of Object.entries(r.need)) p.inv[id] -= n;
    this.give(r.out, 1);
    if (r.station === 'fuego') { this.stats.cooked = (this.stats.cooked || 0) + 1; this.jobXp('cocinero', 10); this.contractTick('cook', 'cook'); if (Math.random() < this.jobLevel('cocinero') * 0.015) { this.give(r.out, 1); this.toast('🍳 ¡Te salió una ración de más!'); } }
    else { this.stats.crafted = (this.stats.crafted || 0) + 1; this.jobXp('herrero', 15 + (ITEMS[r.out].tier || 0) * 6); p.gold += Math.round(r.gold * this.jobLevel('herrero') * 0.01); }
    this.ui.toast(`✨ ${ITEMS[r.out].icon} ${ITEMS[r.out].name}`);
    sfx('level');
  }
  nearStation() {
    const p = this.player;
    for (const s of this.stations) if (Math.hypot(s.x - p.x, s.z - p.z) < 1.9) return s;
    return null;
  }
  nearField() {
    const p = this.player;
    if (this.W.isInterior(p.x)) return null;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const x = p.tx + dx, z = p.tz + dz;
      if (this.W.tile(x, z) !== T.FIELD) continue;
      if (this.time - (this.harvested.get(x * 1000 + z) ?? -999) > 45) return { x, z };
    }
    return null;
  }
  harvestWheat(f) {
    this.harvested.set(f.x * 1000 + f.z, this.time);
    this.player.st.gather = 1;
    setTimeout(() => { this.player.st.gather = 0; }, 500);
    this.give('wheat', 1 + (Math.random() < 0.3 ? 1 : 0), f.x, f.z);
    sfx('chop');
  }

  // ------------------------------------------------------------- amistad, duelos, tripulación, romance
  soc(id) {
    if (!this.social[id]) this.social[id] = { f: 0 };
    return this.social[id];
  }
  crew() { return this.npcs.filter((n) => this.soc(n.id).crew); }
  partner() { return this.npcs.find((n) => this.soc(n.id).partner); }
  following() {
    return this.npcs.filter((n) => { const s = this.soc(n.id); return (s.crew && !s.wait && !s.role) || (s.partner && s.hand && !s.role); });
  }
  activeCrew() { return this.crew().filter((n) => !this.soc(n.id).role); }
  // papel de cada tripulante: undefined = te sigue (máx. 3), 'ship' = en el barco, 'farm' = recolectando en una isla
  setCrewRole(id, role) {
    const n = this.npcById(id), s = this.soc(id);
    if (!role && s.role && this.activeCrew().length >= 3) return this.ui.toast('Solo pueden acompañarte 3 a la vez. Manda a otro al barco.');
    if (s.role === 'jail') return this.ui.toast(`⛓️ ${n.name} está preso en el Bastión. Ve a rescatarle`);
    if (s.role === 'farm' && role !== 'farm') this.collectFarm(n);
    if (role === 'farm') {
      if (this.W.isInterior(this.player.x) || this.sailing) return this.ui.toast('Tienes que estar en una isla para mandarles a recolectar');
      s.farm = { area: this.W.areaName(this.player.tx, this.player.tz), isle: this.islandName(), t0: this.playtime };
      this.ui.toast(`⛏ ${n.name} se queda recolectando en ${s.farm.isle}`);
    }
    s.role = role || undefined;
    s.wait = false;
    n.model.root.visible = !role;
    if (!role) { this.placeNear(n, this.player.tx, this.player.tz); this.ui.toast(`▶ ${n.name} te acompaña`); }
    else if (role === 'ship') this.ui.toast(`⚓ ${n.name} te espera en el barco`);
    if (this.autoHelm === id && role !== 'ship') this.autoHelm = null;
  }
  islandName() {
    const r = this.W.regionAt(this.player.x, this.player.z);
    return r && r.kind === 'islet' ? r.name : 'Isla Bruma';
  }
  farmYield(n) {
    const s = this.soc(n.id);
    if (!s.farm) return null;
    const min = Math.min(60, (this.playtime - s.farm.t0) / 60);
    const k = min * (1 + n.level / 25);
    const out = { wood: Math.floor(k * 2), stone: Math.floor(k * 1.2), gold: Math.floor(k * 6) };
    for (let i = 0; i < Math.floor(min); i++) { const o = oreDrop(s.farm.area); if (o) out[o] = (out[o] || 0) + 1; }
    const special = { 'Isla Duna': 'ambar', 'Isla Selva': 'jade', 'Isla Ceniza': 'obsidiana', 'Isla Tortuga': 'silver', 'Isla Calavera': 'goldore' }[s.farm.isle];
    if (special) out[special] = (out[special] || 0) + Math.floor(min / 4);
    return { min, out, xp: Math.round(k * 30) };
  }
  collectFarm(n) {
    const s = this.soc(n.id), y = this.farmYield(n);
    if (!y) return;
    const p = this.player;
    const parts = [];
    for (const [k, v] of Object.entries(y.out)) {
      if (!v) continue;
      if (k === 'gold') p.gold += v; else this.give(k, v);
      parts.push(`${v} ${k === 'gold' ? 'oro' : ITEMS[k] ? ITEMS[k].icon : k}`);
    }
    n.cxp = (n.cxp || 0) + y.xp;
    this.crewGainXp(0);
    s.farm = null;
    this.ui.toast(parts.length ? `⛏ ${n.name} trae: ${parts.join(', ')}` : `${n.name} no tuvo tiempo de recolectar nada`);
  }
  addFriend(n, v, quiet) {
    const s = this.soc(n.id);
    const before = friendLevel(s.f).hearts;
    s.f = clamp(s.f + v, -100, 100);
    if (!quiet) this.ui.float(`${v >= 0 ? '+' : ''}${v} ❤`, v >= 0 ? 'heal' : 'dmg', n.x, n.model.height + 0.4, n.z);
    const after = friendLevel(s.f).hearts;
    if (after > before) { this.ui.toast(`❤ ${n.name}: ${friendLevel(s.f).name}`); sfx('quest'); }
  }
  socialOptions(n) {
    const s = this.soc(n.id), o = [...this.townDefOptions(n.id)];
    if (s.talkDay !== this.day) {
      o.push({ label: '💬 Charlar', action: () => { s.talkDay = this.day; this.addFriend(n, 4); this.ui.openDialog(n.name, pick(CHAT_LINES), [{ label: 'Seguir', action: null }]); } });
    }
    o.push({ label: '🎁 Regalar', action: () => this.panels.openGift(n) });
    if (RECRUITABLE.has(n.id) && !s.crew) {
      if (s.f >= 50 && this.crew().length < MAX_CREW) o.push({ label: '⚓ Únete a mi tripulación', action: () => this.recruit(n) });
    }
    if (s.crew) {
      o.push({ label: s.wait ? '▶ Sígueme' : '⏸ Espera aquí', action: () => this.toggleCrewWait(n.id) });
      const so = this.crewStoryOpt(n); if (so) o.push(so);
      o.push({ label: '👋 Dejar la tripulación', action: () => this.dismiss(n) });
    }
    if (ROMANCE.has(n.id)) {
      if (s.partner) {
        o.push({ label: `💌 Citas (${Object.keys(this.love().dates).length}/5)${s.married ? ' 💒' : ''}`, action: () => this.dateMenu(n) });
        o.push({ label: '💋 Besar', action: () => this.coupleAct(n, 'kiss') });
        o.push({ label: '🤗 Abrazar', action: () => this.coupleAct(n, 'hug') });
        o.push({ label: '💃 Bailar juntos', action: () => this.coupleAct(n, 'dance') });
        o.push({ label: this.carrying === n ? '👐 Bajar de tus brazos' : '👐 Llevar en brazos', action: () => this.coupleAct(n, 'carry') });
        o.push({ label: s.hand ? '🤝 Soltar la mano' : '🤝 Pasear de la mano', action: () => { s.hand = !s.hand; this.ui.toast(s.hand ? `🤝 Paseas de la mano con ${n.name}` : `Soltaste la mano de ${n.name}`); } });
        o.push({ label: '💌 Palabras bonitas', action: () => { this.addFriend(n, 1); this.ui.openDialog(n.name, pick(ROMANCE_LINES), [{ label: '❤', action: null }]); } });
        o.push({ label: s.married ? '💔 Divorciarse' : '💔 Romper la relación', action: () => this.breakUp(n) });
      } else if (s.f >= 70 && !this.partner() && (!this.canConfess || this.canConfess(n))) {
        o.push({ label: '💗 Declararse', action: () => this.confess(n) });
      }
    }
    if (!s.partner) o.push({ label: '⚔️ Retar a duelo', action: () => this.startFight(n, 'duel') });
    if (!s.partner && !s.crew) o.push({ label: '👊 Pegar', action: () => this.startFight(n, 'brawl') });
    return o;
  }
  giveGift(n, id) {
    const p = this.player;
    if (!p.inv[id]) return;
    p.inv[id]--;
    const it = ITEMS[id];
    const likes = (GIFT_LIKES[n.id] || []).includes(id) || ((id === 'collar_perlas' || id === 'anillo_jade') && this.soc(n.id).partner);
    if (this.soc(n.id).partner && (id === 'collar_perlas' || id === 'anillo_jade')) this.dateDone('regalo');
    const v = likes ? 15 : id.startsWith('f_') ? 10 : it.type === 'mat' && it.value >= 10 ? 7 : 4;
    this.addFriend(n, v);
    this.ui.openDialog(n.name, likes ? `¡¿${it.name}?! ¡Es mi favorito! Muchísimas gracias.` : `Oh, ${it.name.toLowerCase()}. ¡Gracias, qué detalle!`, [{ label: 'De nada', action: null }]);
    sfx('coin');
  }
  startFight(n, mode) {
    const p = this.player;
    n.fight = { mode };
    n.talking = false;
    n.hp = n.maxHp;
    n.attackCd = 0.8;
    this.talkingTo = null;
    if (mode === 'brawl') this.addFriend(n, -20);
    this.ui.float(pick(mode === 'duel' ? DUEL_LINES : ANGRY_LINES), 'chat', n.x, n.model.height + 0.5, n.z);
    this.ui.toast(mode === 'duel' ? `🤺 Duelo contra ${n.name} (Nv. ${n.level})` : `👊 ¡${n.name} se defiende!`);
    p.setTarget({ kind: 'enemy', ref: n });
    this.selection.visible = true;
    this.selTarget = n;
    sfx('swing');
  }
  damageNPC(n, dmg, crit) {
    if (!n.fight) return;
    n.hp -= dmg;
    n.st.flash = 0.18;
    this.ui.float(String(dmg), crit ? 'crit' : 'pdmg', n.x, n.model.height + 0.2, n.z);
    this.ui.setHp(n.label, Math.max(0, n.hp) / n.maxHp);
    sfx('hit');
    if (n.hp <= n.maxHp * 0.15) this.endFight(n, 'win');
  }
  endFight(n, result) {
    if (!n.fight) return;
    const mode = n.fight.mode, p = this.player;
    n.fight = null;
    n.pending = null;
    n.hp = n.maxHp;
    n.path = [];
    this.ui.setHp(n.label, 1);
    if (p.target && p.target.ref === n) p.target = null;
    if (this.selTarget === n) this.selection.visible = false;
    if (result === 'win') {
      const xp = 10 + n.level * 4;
      p.gainXp(xp);
      this.ui.float(`+${xp} XP`, 'info', n.x, 1.2, n.z);
      if (mode === 'duel') { this.stats.duels = (this.stats.duels || 0) + 1; this.addFriend(n, 5); this.ui.toast(`🏆 ${n.name} se rinde. ¡Buen duelo!`); }
      else { this.addFriend(n, -5); this.ui.toast(`${n.name} se rinde... y no está contento.`); }
      sfx('quest');
    } else if (result === 'lose') {
      p.hp = Math.max(1, Math.round(p.maxHp * 0.15));
      p.lastCombat = this.time;
      if (mode === 'duel') this.addFriend(n, 2);
      this.ui.toast(mode === 'duel' ? `😵 Has perdido el duelo contra ${n.name}` : `😵 ${n.name} te ha dado una paliza`);
      sfx('hurt');
    }
  }
  recruit(n) {
    const s = this.soc(n.id);
    const full = this.activeCrew().length >= 3;
    s.crew = true;
    s.wait = false;
    s.role = full ? 'ship' : undefined;
    if (s.role) setTimeout(() => this.ui.toast(`${n.name} te espera en el barco (ya te acompañan 3)`), 1200);
    n.setStats(Math.max(n.level, 1));
    this.rebuildCrewLook(n);
    this.addFriend(n, 5);
    this.ui.toast(`⚓ ${n.name} se une a tu tripulación (${this.crew().length}/${MAX_CREW})`);
    sfx('level');
  }
  dismiss(n) {
    const s = this.soc(n.id);
    if (s.role === 'farm') this.collectFarm(n);
    s.crew = false;
    s.role = undefined;
    n.model.root.visible = true;
    n.tier = -1;
    n.rebuild(n.look0);
    n.x = n.home.x; n.z = n.home.z; n.path = [];
    this.ui.toast(`${n.name} vuelve a casa`);
  }
  toggleCrewWait(id) {
    const n = this.npcById(id), s = this.soc(id);
    s.wait = !s.wait;
    if (s.wait) n.home = { x: n.tx, z: n.tz };
    this.ui.toast(s.wait ? `⏸ ${n.name} te espera aquí` : `▶ ${n.name} te sigue`);
  }
  rebuildCrewLook(n) {
    const gl = this.crewGearLevel ? this.crewGearLevel(n) : n.level;
    const tier = crewTier(gl);
    if (tier === n.tier) return;
    n.tier = tier;
    const look = { ...n.look0, noAutoLegs: true };
    for (const id of Object.values(this.crewEquip ? this.crewEquip(n) : crewGear(gl))) if (EQUIP[id]) Object.assign(look, EQUIP[id].look);
    n.rebuild(look);
  }
  crewGainXp(xp) {
    const p = this.player;
    const pt = this.partner();
    const list = this.crew();
    if (pt && !list.includes(pt)) list.push(pt);
    for (const n of list) {
      n.cxp = (n.cxp || 0) + xp * 0.6;
      let need = Math.round(25 + (n.level - 1) * 18 + (n.level - 1) ** 2 * 2.2);
      while (n.cxp >= need && n.level < MAX_LEVEL) {
        n.cxp -= need;
        n.setStats(n.level + 1);
        this.soc(n.id).lvl = n.level;
        if (n.model.root.visible) this.ui.float('⭐ Nv. ' + n.level, 'crit', n.x, n.model.height + 0.4, n.z);
        const before = n.tier;
        if (this.soc(n.id).crew) this.rebuildCrewLook(n);
        if (n.tier !== before) this.ui.toast(`🛡️ ${n.name} consigue armadura de ${TIER_NAMES[n.tier].toLowerCase()}`);
        need = Math.round(25 + (n.level - 1) * 18 + (n.level - 1) ** 2 * 2.2);
      }
    }
  }
  crewFoe() {
    const p = this.player;
    if (p.target && p.target.kind === 'enemy' && !p.target.ref.isNPC && !p.target.ref.dead) return p.target.ref;
    let best = null, bd = 7;
    for (const e of this.enemies) { if (e.dead || e.state !== 'chase') continue; const d = e.dist(p); if (d < bd) { bd = d; best = e; } }
    return best;
  }
  placeNear(n, x, z) {
    for (let r = 1; r <= 4; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      const tx = x + dx, tz = z + dz;
      if (!this.W.walkable(tx, tz) || (tx === x && tz === z)) continue;
      if (this.npcs.some((o) => o !== n && o.tx === tx && o.tz === tz)) continue;
      n.x = tx; n.z = tz; n.path = [];
      return;
    }
    n.x = x; n.z = z; n.path = [];
  }
  placeFollowers(x, z) {
    for (const n of this.following()) if (!n.onShip) this.placeNear(n, x, z);
  }
  kiss(n) {
    const p = this.player;
    n.faceTo(p.x - n.x, p.z - n.z, 1);
    p.faceTo(n.x - p.x, n.z - p.z, 1);
    n.st.kiss = p.st.kiss = true;
    for (let i = 0; i < 4; i++) setTimeout(() => this.ui.float('💖', 'heal', (p.x + n.x) / 2, 1.3 + i * 0.1, (p.z + n.z) / 2), i * 250);
    setTimeout(() => { n.st.kiss = p.st.kiss = false; }, 1600);
    this.addFriend(n, 2, true);
    sfx('level');
  }
  confess(n) {
    const s = this.soc(n.id);
    if (this.canConfess && !this.canConfess(n)) return this.ui.openDialog(n.name, 'Todavía me duele lo nuestro... Dame tiempo.', [{ label: 'Lo entiendo', action: null }]);
    if (s.f >= 90) {
      s.partner = true;
      this.addFriend(n, 5);
      this.ui.openDialog(n.name, pick(CONFESS_YES), [{ label: '💋 Besar', action: () => this.coupleAct(n, 'kiss') }, { label: '❤', action: null }]);
      this.ui.toast(`💗 ¡${n.name} y tú sois pareja!`);
      sfx('quest');
    } else {
      this.addFriend(n, -2);
      this.ui.openDialog(n.name, pick(CONFESS_NO), [{ label: 'Lo entiendo', action: null }]);
    }
  }
  shipMenu() {
    this.ui.openDialog('Gaviota Negra', 'El barco de Nerea está listo. ¿Qué quieres hacer?', [
      { label: '⛵ Zarpar', action: () => this.board() },
      { label: '⬇️ Bajar a la bodega', action: () => { this.holdFromSea = false; this.enterRoom(this.holdRoom()); } },
      { label: 'Ahora no', action: null },
    ]);
  }
  holdRoom() {
    const sz = (this.shipUp && this.shipUp.size) || 0;
    return this.rooms.find((k) => k.id === (sz >= 2 ? 'bodega3' : sz === 1 ? 'bodega2' : 'bodega'));
  }
  enterHold() {
    const p = this.player;
    const r = this.holdRoom();
    this.holdFromSea = true;
    this.sailing = false;
    this.boat.speed = 0;
    this.scene.add(p.model.root);
    p.model.root.rotation.set(0, 0, 0);
    this.unboardCrew(r.inside.x, r.inside.z);
    this.enterRoom(r);
  }
  crewChat(dt) {
    this.chatT -= dt;
    if (this.chatT > 0) return;
    const p = this.player;
    const near = this.crew().filter((n) => n.onShip || n.dist(p) < 12);
    const inHold = (this.roomAt(p.x, p.z)?.id || '').startsWith('bodega');
    this.chatT = (inHold ? 4 : 8) + Math.random() * 6;
    if (!near.length) return;
    const a = pick(near);
    const say = (n, text) => {
      const v = new THREE.Vector3();
      n.model.root.getWorldPosition(v);
      this.ui.float(text, 'chat', v.x, v.y + n.model.height + 0.5, v.z);
    };
    say(a, pick(CHAT_LINES));
    const others = near.filter((n) => n !== a);
    if (others.length) { const b = pick(others); setTimeout(() => say(b, pick(CHAT_REPLIES)), 1900); this.addFriend(a, 0, true); }
  }

  // ------------------------------------------------------------- bucle
  loop(t) {
    requestAnimationFrame((tt) => this.loop(tt));
    const dt = Math.min(0.05, (t - this.last) / 1000);
    this.last = t;
    // en multijugador el mundo no se pausa (los demás siguen jugando)
    if (!this.paused || this.net.active) this.update(dt);
    this.renderer.render(this.scene, this.camera);
  }

  updateLighting() {
    const h = this.tod;
    const day = smoothstep(5, 7.5, h) * (1 - smoothstep(17.5, 20, h));
    const warm = Math.max(0, 1 - Math.abs(h - 18.3) / 1.6) + Math.max(0, 1 - Math.abs(h - 6.3) / 1.4);
    const night = 1 - day;
    const sunCol = new THREE.Color(0x9ab0ff).lerp(new THREE.Color(0xffffff), day).lerp(new THREE.Color(0xffa860), clamp(warm, 0, 1) * 0.55);
    this.sun.color.copy(sunCol);
    const wd = this.weatherDim ? this.weatherDim() : 1;
    this.sun.intensity = (0.55 + 1.75 * day) * Math.min(1, wd) * (wd > 1 ? 1.6 : 1);
    this.hemi.intensity = (0.7 + 0.65 * day) * (0.55 + 0.45 * wd);
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
    if (this.started) {
      const prev = this.tod;
      this.tod = (this.tod + dt / 15) % 24;
      if (this.tod < prev) this.day++;
      this.playtime += dt;
      this.crewChat(dt);
    }
    this.updateWeather(dt);
    this.updateLighting();
    if (this.started) { this.updateAmbience(); this.updateIsleWeather(dt); }
    this.updateRings(dt);
    const p = this.player;
    if (this.started) {
      if (this.sailing) { if (!this.boat.sinking) this.updateBoat(dt); }
      else p.update(dt);
      this.updateNaval(dt);
      this.updateBoarding(dt);
      this.updateRaids(dt);
      this.updateFamous(dt);
      this.updateFishing(dt);
      this.updatePet(dt);
      this.updateMount(dt);
      this.updateCoralia(dt);
      this.updateFarm(dt);
      this.updateTides(dt);
      this.updateGhost(dt);
      this.updateCrewJobs(dt);
      this.updateCtf(dt);
      this.updateMusic(dt);
      this.logT = (this.logT || 0) - dt; if (this.logT <= 0) { this.logT = 2; this.updateLogros(); }
      this.updateLove(dt);
      this.updateRace(dt);
      this.updateTournament(dt);
      this.updateDungeon(dt);
      this.updateGrotto();
      this.updateEsp(dt);
      this.updateEnemyEsp(dt);
      this.updateBalloons(dt);
      this.updateEspShots(dt);
      this.updateNewborn(dt);
      this.updateRescue();
      this.updateMore7(dt);
      this.updateMore8(dt);
      this.jailInit();
      this.addEspSkillBtn();
      this.updateEruption(dt);
      this.updateVelaria();
      this.updateFishGame(dt);
      this.updateHunt(dt);
      this.updateRemoteExtras(dt);
      this.mapT = (this.mapT || 0) - dt; if (this.mapT <= 0) { this.mapT = 1; this.updateMaps(); this.updateStories(); }
      this.updateEvents(dt);
      this.updateSkills && this.updateSkills(dt);
      this.updateBuild && this.updateBuild(dt);
      this.player.st.holdHand = null;
      for (const n of this.npcs) if (!n.onShip && !n.carried) n.update(dt);
      if (this.separateFollowers) this.separateFollowers(dt);
      for (const e of this.enemies) e.update(dt);
    }
    if (this.sailing) { if (!this.deck) p.st.moving = false; animateModel(p.model, p.st, dt); } else p.sync(dt);
    // interior: fondo oscuro y luz cálida
    const room = this.roomAt(p.x, p.z);
    this.water.visible = !room;
    if (room) {
      this.scene.background.set(0x07090e);
      this.torch.position.set(room.X + room.w / 2, 2.6, room.Z + room.d / 2);
      this.torch.distance = 16;
      this.torch.intensity = 5;
    } else this.torch.distance = 8;
    for (const n of this.npcs) { if (n.onShip || n.carried) animateModel(n.model, n.st, dt); else n.sync(dt); }
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
      const landShort = aspect >= 1.2;
      const vh = aspect >= 1 ? this.viewSize : this.viewSize / aspect;
      const creating = document.getElementById('start').classList.contains('creating');
      const a = landShort ? 0 : ((creating ? 0.3 : 0.2) * vh) / 0.66 / Math.SQRT2;
      tgt.x += a; tgt.z += a;
      if (landShort) { const b = (0.24 * this.viewSize * aspect) / Math.SQRT2; tgt.x += b; tgt.z -= b; }
    }
    this.camTarget.lerp(tgt, Math.min(1, dt * 6));
    this.camera.position.copy(this.camTarget).add(this.camOffset);
    if (this.camShake > 0) { const k = this.camShake * 0.5; this.camera.position.x += (Math.random() - 0.5) * k; this.camera.position.z += (Math.random() - 0.5) * k; }
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
    if (this.lavaMeshes) for (const lm of this.lavaMeshes) lm.material.color.setRGB(1, 0.36 + Math.sin(t * 2) * 0.06, 0.08);
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
      if (d.userData.spin) d.rotation.y += 0.02;
      if (d.userData.bubble) d.position.y = 1.4 + Math.sin(t * 1.2 + d.parent.position.x) * 0.25;
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
      const near = !room && r.front && Math.hypot(r.front.x - p.x, r.front.z - p.z) < 9;
      if (near) this.ui.placeLabel(r.doorLabel, (r.door.x + r.front.x) / 2, 1.3, (r.door.z + r.front.z) / 2);
      else if (r.doorLabel._vis) { r.doorLabel._vis = false; r.doorLabel.el.style.display = 'none'; }
      if (room === r) this.ui.placeLabel(r.exitLabel, r.exit.x, 0.5, r.exit.z);
      else if (r.exitLabel._vis) { r.exitLabel._vis = false; r.exitLabel.el.style.display = 'none'; }
    }
    for (const n of this.npcs) {
      if (n.onShip || n.carried) continue;
      if (n.dist(p) > 22 || !n.model.root.visible) { if (n.label._vis) { n.label._vis = false; n.label.el.style.display = 'none'; } continue; }
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
      this.ui.placeLabel(e.label, e.x, Math.max(0, e.vy || 0) + e.model.height + 0.12 + e.yOff, e.z);
    }
    this.ui.updateFloats(dt);
    this.net.update(dt);
    if (this.attackHeld && this.started && !this.ui.dialogOpen && !this.panels.isOpen && this.player.attackCd <= 0) {
      this.attackPress();
    }
    this.updateFx(dt);

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

installNaval(Game, { sfx, Enemy });
installLife(Game, { sfx, Enemy, buildLook, animeLook });
installSkills(Game, { sfx, EQUIP });
installBuild(Game, { sfx, T });
installExtra(Game, { sfx, Enemy, NPC, ITEMS, EQUIP, T });
installMore2(Game, { sfx, audio });
installMore3(Game, { sfx });
installMore4(Game, { sfx, EQUIP, ITEMS, OUTLINE });
installMore5(Game, { sfx });
installMore6(Game, { sfx });
installMore7(Game, { sfx, NPC });
LOGROS.push({ id: 'asedio', name: 'Conquistador', title: 'Conquistador', desc: 'Toma el Bastión de la Marina', ok: (g) => (g.stats.sieges || 0) >= 1 });
LOGROS.push({ id: 'jinete', name: 'Jinete veloz', title: 'Jinete veloz', desc: 'Gana una carrera de monturas', ok: (g) => (g.stats.mraces || 0) >= 1 });
LOGROS.push(
  { id: 'islas', name: 'Señor de las islas', title: 'Señor de las islas', desc: 'Derrota a Glacia, Ferrum y Bizcochón', ok: (g) => (g.stats.k_reina_hielo || 0) >= 1 && (g.stats.k_gran_automata || 0) >= 1 && (g.stats.k_rey_pastel || 0) >= 1 },
  { id: 'pesca', name: 'Campeón de pesca', title: 'Rey del anzuelo', desc: 'Gana el torneo de pesca', ok: (g) => (g.stats.fishCups || 0) >= 1 },
  { id: 'rescate', name: 'Nadie se queda atrás', title: 'Libertador', desc: 'Rescata a tu tripulación de la prisión', ok: (g) => (g.stats.rescues || 0) >= 1 },
);
LOGROS.push(
  { id: 'coralia', name: 'Reina del abismo', title: 'Señor de las mareas', desc: 'Derrota a la Reina Abisal en Coralia', ok: (g) => (g.stats.k_abyss_queen || 0) >= 1 },
  { id: 'parada', name: 'Maestro esgrimista', title: 'Maestro esgrimista', desc: 'Haz 25 paradas perfectas', ok: (g) => (g.stats.parries || 0) >= 25 },
  { id: 'fotos', name: 'Fotógrafo', title: 'Fotógrafo', desc: 'Haz 10 fotos', ok: (g) => (g.stats.photos || 0) >= 10 },
  { id: 'lealtad', name: 'Corazón de la tripulación', title: 'Capitán querido', desc: 'Completa 5 historias de tu tripulación', ok: (g) => Object.values(g.crewQ || {}).filter((q) => q.s === 2).length >= 5 },
);
for (const d of PREMIUM_DECOR) DECOR.push({ ...d, premium: true });
installMore(Game, { sfx, mountModel, EVENT_COS, isFemale: () => window.game && window.game.player.ap.gender === 'f' });
installMore8(Game, { sfx });

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

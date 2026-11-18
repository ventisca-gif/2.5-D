// Mundo vivo: piratas famosos que viajan y luchan, carteles de Se busca con retrato,
// clima y estaciones, horarios de los vecinos y gestos de pareja.
import * as THREE from 'three';
import { makeHumanoid2 } from './chars2.js';

// ---------------------------------------------------------------- piratas famosos
// tier 2 = leyenda (muy fuerte), tier 1 = intermedio
export const FAMOUS = [
  { id: 'albatros', name: 'Viejo Albatros', ep: 'El Último Rey del Mar', lvl: 100, bounty: 480000, tier: 2, wpn: 'sword', look: { shirt: 0xe8e0d0, pants: 0x2a2a2a, coat: true, hat: 'tricorn', feather: 0xffffff, hair: 0xe8e8e8, beard: 0xe8e8e8, skin: 0xe0aa80, cape: 0x6a1a1a, trim: 0xe0b040, sword: true, blade: 0xf0f0ff } },
  { id: 'vortan', name: 'Garra Negra Vortan', ep: 'El Señor del Abismo', lvl: 97, bounty: 420000, tier: 2, wpn: 'axe', look: { shirt: 0x1a1a1a, pants: 0x1a1a1a, coat: true, hair: 0x1a1a1a, beard: 0x1a1a1a, skin: 0x8a5a3a, armor: true, armorColor: 0x2a2a3a, cape: 0x111111, axe: true, eyepatch: true } },
  { id: 'trueno', name: 'Hugo Trueno', ep: 'Mar de Rayos', lvl: 94, bounty: 360000, tier: 2, wpn: 'axe', look: { shirt: 0x2a3a8a, pants: 0x1a1a2a, vest: 0xe0c040, hair: 0xf0d040, skin: 0xf0c49a, axe: true, scarf: 0xe0c040, bootCuff: true } },
  { id: 'escarlata', name: 'Capitana Escarlata', ep: 'La Tormenta Roja', lvl: 91, bounty: 330000, tier: 2, wpn: 'sword', female: true, look: { shirt: 0xb02020, pants: 0x1a1a1a, coat: true, hat: 'tricorn', hatColor: 0x8a1010, feather: 0xffffff, hair: 0xc8302a, longHair: true, skin: 0xf0c49a, sword: true, earring: true, sash: 0x111111 } },
  { id: 'kaito', name: 'Kaito Sombra', ep: 'El Fantasma de la Bruma', lvl: 88, bounty: 300000, tier: 2, wpn: 'sword', look: { shirt: 0x2a2a3a, pants: 0x1a1a24, hair: 0x1a1a1a, skin: 0xe8c49a, scarf: 0x6a1a8a, sword: true, blade: 0xd8e8ff, bladeLen: 0.62, bladeW: 0.04 } },
  { id: 'ceniza', name: 'Madame Ceniza', ep: 'La Dama del Volcán', lvl: 85, bounty: 260000, tier: 2, wpn: 'sword', female: true, look: { shirt: 0x3a1a1a, pants: 0x1a1010, dress: true, dressColor: 0x2a1010, hair: 0x2a2a2a, longHair: true, skin: 0xe0aa80, cape: 0xd84a1a, sword: true, blade: 0xff8040 } },
  { id: 'ondina', name: 'Ondina Perla', ep: 'La Sirena de Acero', lvl: 82, bounty: 230000, tier: 2, wpn: 'spear', female: true, look: { shirt: 0x2a8aa8, pants: 0x1a3a4a, hair: 0x7ad8e8, longHair: true, skin: 0xf0d0b0, spear: true, trident: true, armor: true, armorColor: 0xd8e8f0 } },
  { id: 'polvora', name: 'Tadeus Pólvora', ep: 'El Cañón Andante', lvl: 79, bounty: 200000, tier: 2, wpn: 'axe', look: { shirt: 0x6a4a2a, pants: 0x3a2a1a, vest: 0x2a2a2a, hair: null, beard: 0xb04a1a, skin: 0xc68a5a, axe: true, bracers: true, bracerColor: 0x3a3a3a } },
  { id: 'tiburon', name: 'Rodrigo Tiburón', ep: 'Diente de Sierra', lvl: 75, bounty: 170000, tier: 2, wpn: 'spear', look: { shirt: 0x3a5a7a, pants: 0x2a2a3a, hair: 0x6a7a8a, skin: 0x8a9aa8, spear: true, trident: true, sash: 0xd8d8d8 } },
  { id: 'plata', name: 'Zafira Luna', ep: 'La Corsaria de Plata', lvl: 71, bounty: 150000, tier: 2, wpn: 'sword', female: true, look: { shirt: 0xd8dce8, pants: 0x2a2a3a, coat: true, hair: 0xe8e8f0, longHair: true, skin: 0xe8b98f, sword: true, blade: 0xe0e8ff, hat: 'tricorn', hatColor: 0x3a3a5a } },
  { id: 'medusa', name: 'Medusa Vela', ep: 'La Red Venenosa', lvl: 52, bounty: 42000, tier: 1, wpn: 'spear', female: true, look: { shirt: 0x6a2a8a, pants: 0x2a1a3a, hair: 0x8a3ab0, longHair: true, skin: 0xf0c49a, spear: true } },
  { id: 'lince', name: 'Lince Varela', ep: 'Zarpas Rápidas', lvl: 46, bounty: 31000, tier: 1, wpn: 'sword', look: { shirt: 0xd8a040, pants: 0x3a2a1a, hair: 0xd8a040, skin: 0xd9a066, sword: true, bandana: true, hat: 'bandana', capColor: 0x1a1a1a } },
  { id: 'toro', name: 'Toro Mandíbula', ep: 'El Rompecascos', lvl: 40, bounty: 22000, tier: 1, wpn: 'axe', look: { shirt: 0x8a2a1a, pants: 0x2a1a10, hair: null, beard: 0x2a1a10, skin: 0xa86a3a, axe: true, armor: true, armorColor: 0x6a4a3a } },
  { id: 'garfio', name: 'Rita Garfio', ep: 'Garfio Rojo', lvl: 34, bounty: 15000, tier: 1, wpn: 'sword', female: true, look: { shirt: 0x8a1a1a, pants: 0x1a1a1a, hair: 0x1a1a1a, longHair: true, skin: 0xe0aa80, sword: true, hat: 'bandana', capColor: 0xb02a2a } },
  { id: 'gaviota', name: 'Capitán Gaviota', ep: 'Pluma Gris', lvl: 28, bounty: 9000, tier: 1, wpn: 'sword', look: { shirt: 0x8a8a8a, pants: 0x3a3a3a, hat: 'tricorn', feather: 0xb0b0b0, hair: 0x6a6a6a, skin: 0xf0c49a, sword: true } },
  { id: 'pecas', name: 'Pecas Malvino', ep: 'El Ladrón de Velas', lvl: 24, bounty: 6000, tier: 1, wpn: 'sword', look: { shirt: 0x3a6a3a, pants: 0x3a2a1a, hair: 0xd86a2a, skin: 0xf3cfaa, sword: true, scarf: 0xe8d040 } },
];
const ISLES = ['main', 'tortuga', 'calavera', 'duna', 'selva', 'bastion', 'ceniza'];
const ISLE_NAME = { main: 'Isla Bruma', tortuga: 'Isla Tortuga', calavera: 'Isla Calavera', duna: 'Isla Duna', selva: 'Isla Selva', bastion: 'Bastión de la Marina', ceniza: 'Isla Ceniza' };
const FAMOUS_LINES = [
  '¿Tú también buscas el trono del Mar de Bruma? Ponte a la cola.',
  'He hundido más barcos de los que tú has visto.',
  'Si quieres pelea, no te contengas. Yo no lo haré.',
  'Mi recompensa sube cada día. ¿Y la tuya?',
  'Esta isla es mía... hasta que me aburra.',
];

const SEASONS = [['Primavera', '🌸'], ['Verano', '☀️'], ['Otoño', '🍂'], ['Invierno', '❄️']];
const WEATHER = { clear: ['Despejado', ''], cloudy: ['Nublado', '☁️'], rain: ['Lluvia', '🌧️'], storm: ['Tormenta', '⛈️'], fog: ['Niebla', '🌫️'], snow: ['Nieve', '🌨️'] };
const WEATHER_P = [
  [['clear', 0.5], ['cloudy', 0.2], ['rain', 0.25], ['storm', 0.05]],
  [['clear', 0.7], ['cloudy', 0.15], ['rain', 0.1], ['storm', 0.05]],
  [['clear', 0.35], ['cloudy', 0.25], ['rain', 0.22], ['fog', 0.13], ['storm', 0.05]],
  [['clear', 0.35], ['cloudy', 0.2], ['snow', 0.35], ['fog', 0.1]],
];
const TAVERNS = ['taberna', 'sirena', 'grillete_taberna'];
const GUARDS = new Set(['ramiro', 'elvira', 'farid', 'ferro', 'nerea', 'marga', 'tomasa']);
const hashId = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

export function installLife(Game, D) {
  const P = Game.prototype;
  const sfx = D.sfx;

  // ============================================================ piratas famosos
  P.famousInit = function () {
    this.famousList = FAMOUS;
    if (this.famous) return;
    this.famous = {};
    FAMOUS.forEach((f, i) => { this.famous[f.id] = { isle: ISLES[(i * 3 + 1) % ISLES.length], lvl: f.lvl, bounty: f.bounty, down: 0, moveT: 60 + Math.random() * 240 }; });
    this.famousActors = {};
  };
  P.famousDef = function (f) {
    const st = this.famous[f.id];
    const L = st.lvl;
    const key = 'famous_' + f.id;
    this.ENEMY_DEF[key] = {
      name: `${f.name} «${f.ep}»`, hp: () => Math.round((f.tier === 2 ? 900 : 300) + L * (f.tier === 2 ? 70 : 40)), atk: () => (f.tier === 2 ? 14 : 8) + L * 2.6,
      speed: 3.2, xp: () => Math.round(L * (f.tier === 2 ? 120 : 60)), gold: () => Math.round(st.bounty / 150), aggro: 0, cd: 0.9,
      neutral: true, famous: f.id, boss: f.tier === 2, bounty: Math.round(st.bounty * 0.25), group: 'famous_' + f.id,
    };
    return key;
  };
  P.currentIsle = function () {
    const p = this.player;
    if (this.sailing || this.boarding) return null;
    const r = this.W.regionAt(p.x, p.z);
    if (r === null) return 'main';
    return r && r.kind === 'islet' ? r.id : null;
  };
  P.isleSpot = function (isle) {
    const p = this.player;
    let cx, cz, rad;
    if (isle === 'main') { const pts = [[50, 28], [24, 44], [72, 78], [50, 74], [30, 70]]; [cx, cz] = pts[Math.floor(Math.random() * pts.length)]; rad = 6; } else { const r = this.islets.find((k) => k.id === isle); cx = r.center.x; cz = r.center.z; rad = 12; }
    for (let i = 0; i < 60; i++) {
      const x = Math.round(cx + (Math.random() * 2 - 1) * rad), z = Math.round(cz + (Math.random() * 2 - 1) * rad);
      if (this.W.walkable(x, z) && Math.hypot(x - p.x, z - p.z) > 9) return { x, z };
    }
    return null;
  };
  P.updateFamous = function (dt) {
    this.famousInit();
    if (!this.started || (this.net.isClient && this.net.active)) return;
    this.famT = (this.famT || 0) - dt;
    if (this.famT > 0) return;
    this.famT = 1;
    const here = this.currentIsle();
    for (const f of FAMOUS) {
      const st = this.famous[f.id];
      const actor = this.famousActors[f.id];
      st.bounty += Math.round(f.bounty * 0.0004); // sus hazañas suben su recompensa
      if (!actor) {
        st.moveT -= 1;
        if (st.moveT <= 0) { st.isle = ISLES[Math.floor(Math.random() * ISLES.length)]; st.moveT = 180 + Math.random() * 300; }
      }
      const wantHere = here && st.isle === here && this.playtime > st.down;
      if (wantHere && !actor) {
        const sp = this.isleSpot(here);
        if (!sp) continue;
        const key = this.famousDef(f);
        const e = new D.Enemy(this, key, { area: [sp.x, sp.z, sp.x, sp.z], lvl: [st.lvl, st.lvl] }, [st.lvl, st.lvl]);
        e.temp = true; e.famous = f; e.x = sp.x; e.z = sp.z; e.home = { ...sp };
        e.idx = this.enemies.length;
        this.enemies.push(e);
        this.net.announceSpawn(e);
        this.famousActors[f.id] = e;
        if (f.tier === 2) this.toast(`🏴‍☠️ Se rumorea que ${f.name} «${f.ep}» está en ${ISLE_NAME[here]}`, 'area');
      } else if (actor && (!wantHere || actor.removed) && !actor.provoked) {
        if (!actor.removed) actor.remove();
        delete this.famousActors[f.id];
        this.purgeTemps();
      } else if (actor && actor.removed) {
        delete this.famousActors[f.id];
      }
    }
  };
  P.famousDefeated = function (id) {
    const f = FAMOUS.find((k) => k.id === id), st = this.famous[id];
    st.down = this.playtime + 900;
    st.lvl = Math.min(100, st.lvl + 2);
    st.bounty = Math.round(st.bounty * 1.08);
    st.isle = ISLES[Math.floor(Math.random() * ISLES.length)];
    this.stats.famous = (this.stats.famous || 0) + 1;
    this.stats['f_' + id] = (this.stats['f_' + id] || 0) + 1;
    setTimeout(() => this.toast(this.isMarine() ? `⛓️ ¡Has capturado a ${f.name}! (escapará de la prisión tarde o temprano)` : `🏆 ¡Has vencido a ${f.name}! Huye malherido... volverá más fuerte`, 'area'), 600);
  };
  P.famousNear = function () {
    for (const e of Object.values(this.famousActors || {})) if (!e.dead) return { x: e.x, z: e.z };
    return null;
  };
  P.famousAt = function (maxD) {
    const p = this.player;
    for (const e of Object.values(this.famousActors || {})) if (!e.dead && !e.removed && !e.provoked && e.dist(p) < maxD) return e;
    return null;
  };
  P.challengeFamous = function (e) {
    const f = e.famous;
    this.ui.openDialog(`${f.name} «${f.ep}»`, `${FAMOUS_LINES[hashId(f.id + this.day) % FAMOUS_LINES.length]} (Nivel ${e.level} · Recompensa ${this.famous[f.id].bounty.toLocaleString('es')} oro)`, [
      { label: this.isMarine() ? '⛓️ ¡Quedas arrestado!' : '⚔️ Retar a duelo', action: () => { e.provoked = true; e.state = 'chase'; e.updateColor(); this.toast(`⚔️ ¡${f.name} acepta el reto!`, 'area'); sfx('quest'); } },
      { label: 'Mejor no', action: null },
    ]);
  };
  // IA de combate de los famosos: combos, esquivas, golpe especial, beber ron
  D.Enemy.prototype.famousUpdate = function (dt) {
    const g = this.g, p = g.player, f = this.famous;
    if (this.dead) return false;
    this.attackCd -= dt;
    this.skillCd = (this.skillCd ?? 4) - dt;
    if (this.pending) {
      this.pending.t -= dt;
      if (this.pending.t <= 0) {
        const pd = this.pending; this.pending = null;
        if (!p.dead && this.dist(p) < (pd.r || 2.0)) g.damagePlayer(this, this.atk * (pd.k || 1));
      }
    }
    if (!this.provoked) {
      // vida propia: pasea y caza monstruos de la isla
      this.huntT = (this.huntT || 0) - dt;
      if (this.prey && (this.prey.dead || this.prey.removed)) this.prey = null;
      if (!this.prey && this.huntT <= 0) {
        this.huntT = 4 + Math.random() * 4;
        let best = null, bd = 9;
        for (const e of g.enemies) { if (e === this || e.dead || e.temp || e.def.neutral) continue; const d = this.dist(e); if (d < bd) { bd = d; best = e; } }
        this.prey = best;
        if (!best) { const x = this.home.x + Math.round((Math.random() * 2 - 1) * 5), z = this.home.z + Math.round((Math.random() * 2 - 1) * 5); if (g.W.walkable(x, z)) this.goTo(x, z, false, 500); }
      }
      if (this.prey) {
        const d = this.dist(this.prey);
        if (d > 1.6) { this.thinkT -= dt; if (this.thinkT <= 0) { this.thinkT = 0.5; this.goTo(this.prey.tx, this.prey.tz, true, 1200); } }
        else if (this.attackCd <= 0) {
          this.attackCd = 0.9;
          this.faceTo(this.prey.x - this.x, this.prey.z - this.z, 1);
          this.st.attackT = 0.32;
          g.slash(this, 0xffd060);
          g.quietHit(this.prey, Math.round(this.atk * 1.5));
          if (this.prey.dead) g.famous[f.id].bounty += 50 + this.prey.level * 10;
        }
      }
      this.stepMove(dt);
      return true;
    }
    if (p.dead) { this.provoked = false; this.updateColor(); g.toast(`${f.name}: «Vuelve cuando seas más fuerte.»`); return true; }
    const d = this.dist(p);
    // ron a media pelea
    if (!this.healed && this.hp < this.maxHp * 0.35) {
      this.healed = true;
      const h = Math.round(this.maxHp * 0.3);
      this.hp += h; g.ui.setHp(this.label, this.hp / this.maxHp);
      g.ui.float('+' + h + ' 🍶', 'heal', this.x, 1.8, this.z);
      this.dodge(p, 2.5);
      return true;
    }
    // esquiva cuando le atacas de cerca
    if (p.st.attackT > 0.2 && d < 1.9 && !this.dodgeLock && Math.random() < 0.035) { this.dodge(p, 1.6); this.dodgeLock = 0.8; }
    if (this.dodgeLock > 0) this.dodgeLock -= dt;
    // golpe especial según su arma
    if (this.skillCd <= 0 && d < 6) {
      this.skillCd = 5 + Math.random() * 3;
      this.faceTo(p.x - this.x, p.z - this.z, 1);
      if (f.wpn === 'axe') {
        this.st.skill = { type: 'spin', t: 0, dur: 0.8 };
        g.ring(this.x, this.z, 2.4, 0xff7040);
        this.pending = { t: 0.45, r: 2.6, k: 1.8 };
        g.ui.float('¡Remolino!', 'crit', this.x, 2, this.z);
      } else if (f.wpn === 'spear') {
        this.st.skill = { type: 'thrust', t: 0, dur: 0.5 };
        const dx = (p.x - this.x) / Math.max(0.1, d), dz = (p.z - this.z) / Math.max(0.1, d);
        const nx = this.x + dx * Math.max(0, d - 1.1), nz = this.z + dz * Math.max(0, d - 1.1);
        if (g.W.walkable(Math.round(nx), Math.round(nz))) { this.x = nx; this.z = nz; this.path = []; }
        this.pending = { t: 0.2, r: 2.0, k: 2.0 };
        g.ui.float('¡Estocada!', 'crit', this.x, 2, this.z);
      } else {
        this.st.skill = { type: 'dash', t: 0, dur: 0.4 };
        const ang = Math.atan2(p.x - this.x, p.z - this.z);
        const nx = p.x + Math.sin(ang) * 1.2, nz = p.z + Math.cos(ang) * 1.2;
        if (g.W.walkable(Math.round(nx), Math.round(nz))) { this.x = nx; this.z = nz; this.path = []; }
        g.slash(this, 0x9ad8ff);
        this.pending = { t: 0.05, r: 2.6, k: 2.2 };
        g.ui.float('¡Corte relámpago!', 'crit', this.x, 2, this.z);
      }
      return true;
    }
    if (d <= 1.6) {
      if (this.path.length > 1) this.path = [this.path[0]];
      this.faceTo(p.x - this.x, p.z - this.z, dt * 2);
      if (this.attackCd <= 0 && !this.pending) {
        this.combo = ((this.combo || 0) + 1) % 3;
        this.attackCd = this.combo === 0 ? 1.2 : 0.5;
        this.st.attackT = 0.32;
        this.atkSeq = ((this.atkSeq || 0) + 1) % 1000;
        g.slash(this, 0xffd060);
        this.pending = { t: 0.15 };
      }
    } else {
      this.thinkT -= dt;
      if (this.thinkT <= 0) { this.thinkT = 0.3; this.goTo(p.tx, p.tz, true, 1500); }
    }
    this.stepMove(dt);
    return true;
  };
  D.Enemy.prototype.dodge = function (p, dist) {
    const ang = Math.atan2(this.x - p.x, this.z - p.z) + (Math.random() - 0.5) * 1.2;
    const nx = this.x + Math.sin(ang) * dist, nz = this.z + Math.cos(ang) * dist;
    if (this.g.W.walkable(Math.round(nx), Math.round(nz))) { this.x = nx; this.z = nz; this.path = []; this.g.ui.float('Esquiva', 'info', this.x, 1.8, this.z); }
  };
  // daño sin recompensas (peleas entre NPCs y monstruos)
  P.quietHit = function (e, dmg) {
    if (e.dead) return;
    e.hp -= dmg;
    e.st.flash = 0.18;
    this.ui.setHp(e.label, Math.max(0, e.hp) / e.maxHp);
    if (e.hp <= 0) { e.dead = true; e.deadT = 0; e.path = []; e.label.el.style.display = 'none'; e.label._vis = false; if (this.selTarget === e) this.selection.visible = false; }
  };
  P.ring = function (x, z, r, color) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.32, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, (this.W.groundY(x, z) > 0.5 ? 1.05 : 0.06), z);
    this.scene.add(m);
    (this.rings || (this.rings = [])).push({ m, t: 0, life: 0.45, r });
  };
  P.updateRings = function (dt) {
    if (!this.rings) return;
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const k = this.rings[i];
      k.t += dt;
      const e = k.t / k.life;
      k.m.scale.setScalar(0.5 + e * k.r * 3);
      k.m.material.opacity = 0.9 * (1 - e);
      if (e >= 1) { this.scene.remove(k.m); k.m.geometry.dispose(); k.m.material.dispose(); this.rings.splice(i, 1); }
    }
  };

  // ============================================================ carteles de Se busca
  P.portrait = function (key, look) {
    this.portraits = this.portraits || {};
    if (this.portraits[key]) return this.portraits[key];
    if (!this.pr) {
      const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      r.setSize(160, 160);
      r.setPixelRatio(1);
      const sc = new THREE.Scene();
      sc.add(new THREE.HemisphereLight(0xfff4e0, 0x6a5a40, 1.8));
      const d = new THREE.DirectionalLight(0xffffff, 1.6);
      d.position.set(1, 2, 3);
      sc.add(d);
      const cam = new THREE.PerspectiveCamera(24, 1, 0.1, 20);
      this.pr = { r, sc, cam };
    }
    const { r, sc, cam } = this.pr;
    const m = makeHumanoid2({ ...look, noAutoLegs: true });
    sc.add(m.root);
    const hy = m.height * 0.86;
    cam.position.set(0.18, hy + 0.05, 1.25);
    cam.lookAt(0, hy - 0.02, 0);
    r.render(sc, cam);
    const url = r.domElement.toDataURL('image/png');
    sc.remove(m.root);
    m.root.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    this.portraits[key] = url;
    return url;
  };
  P.wantedList = function () {
    this.famousInit();
    const list = FAMOUS.map((f) => ({ key: f.id, name: f.name, ep: f.ep, bounty: this.famous[f.id].bounty, lvl: this.famous[f.id].lvl, look: D.animeLook({ id: f.id, look: f.look }), where: ISLE_NAME[this.famous[f.id].isle], down: this.playtime < this.famous[f.id].down, tier: f.tier }));
    const p = this.player;
    if (!this.isMarine() && (this.bounty || 0) > 0) list.push({ key: 'yo_' + p.level + '_' + Object.values(p.equip).join(','), name: p.name, ep: this.bountyText(), bounty: this.bounty, lvl: p.level, look: D.buildLook(p.ap, p.equip), where: 'aquí mismo', me: true });
    list.sort((a, b) => b.bounty - a.bounty);
    return list;
  };

  // ============================================================ clima y estaciones
  P.season = function () { return Math.floor((this.day || 0) / 3) % 4; };
  P.weatherIcon = function () { return SEASONS[this.season()][1] + (WEATHER[this.weather || 'clear'][1] ? ' ' + WEATHER[this.weather][1] : ''); };
  P.weatherName = function () { return `${SEASONS[this.season()][0]} · ${WEATHER[this.weather || 'clear'][0]}`; };
  P.isWet = function () { return this.weather === 'rain' || this.weather === 'storm' || this.weather === 'snow'; };
  P.weatherInit = function () {
    if (this.wx) return;
    const N = 900;
    const rg = new THREE.BufferGeometry();
    rg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 6), 3));
    const rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xbcd8f0, transparent: true, opacity: 0.55, depthWrite: false }));
    rain.frustumCulled = false; rain.visible = false;
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    const snow = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 4, sizeAttenuation: false, transparent: true, opacity: 0.95, depthWrite: false }));
    snow.frustumCulled = false; snow.visible = false;
    this.scene.add(rain, snow);
    const seeds = Array.from({ length: N }, () => ({ x: (Math.random() - 0.5) * 44, y: Math.random() * 16, z: (Math.random() - 0.5) * 44, s: 0.7 + Math.random() * 0.6 }));
    this.wx = { rain, snow, seeds, N, t: 0, flash: 0 };
    this.weather = this.weather || 'clear';
    this.weatherT = this.weatherT ?? 2 + Math.random() * 3;
    this.lastSeason = -1;
  };
  P.updateWeather = function (dt) {
    this.weatherInit();
    const W = this.wx;
    if (this.started) {
      this.weatherT -= dt / 15; // en horas de juego
      if (this.weatherT <= 0) {
        this.weatherT = 2 + Math.random() * 3;
        let r = Math.random(), next = 'clear';
        for (const [k, pr] of WEATHER_P[this.season()]) { if (r < pr) { next = k; break; } r -= pr; }
        if (next !== this.weather) {
          this.weather = next;
          const msg = { clear: '☀️ Sale el sol', cloudy: '☁️ Se nubla el cielo', rain: '🌧️ Empieza a llover', storm: '⛈️ ¡Se acerca una tormenta!', fog: '🌫️ Una bruma espesa cubre el mar', snow: '🌨️ Empieza a nevar' }[next];
          this.toast(msg);
        }
      }
      const s = this.season();
      if (s !== this.lastSeason) { if (this.lastSeason >= 0) this.toast(`${SEASONS[s][1]} Llega el ${SEASONS[s][0].toLowerCase() === 'primavera' ? 'la primavera' : SEASONS[s][0].toLowerCase()}`, 'area'); this.lastSeason = s; this.applySeason(s); }
    }
    const indoor = !!this.roomAt(this.player.x, this.player.z);
    const w = this.weather;
    const c = this.camTarget;
    const rainOn = !indoor && (w === 'rain' || w === 'storm');
    const snowOn = !indoor && w === 'snow';
    W.rain.visible = rainOn; W.snow.visible = snowOn;
    if (rainOn) {
      const pos = W.rain.geometry.attributes.position;
      const n = w === 'storm' ? W.N : Math.floor(W.N * 0.6);
      for (let i = 0; i < W.N; i++) {
        const sd = W.seeds[i];
        sd.y -= dt * 22 * sd.s;
        if (sd.y < 0) { sd.y = 14 + Math.random() * 2; sd.x = (Math.random() - 0.5) * 44; sd.z = (Math.random() - 0.5) * 44; }
        const x = c.x + sd.x, z = c.z + sd.z;
        if (i < n) pos.setXYZ(i * 2, x, sd.y, z), pos.setXYZ(i * 2 + 1, x + 0.08, sd.y + 0.55, z + 0.08);
        else pos.setXYZ(i * 2, 0, -50, 0), pos.setXYZ(i * 2 + 1, 0, -50, 0);
      }
      pos.needsUpdate = true;
    }
    if (snowOn) {
      const pos = W.snow.geometry.attributes.position;
      W.t += dt;
      for (let i = 0; i < W.N; i++) {
        const sd = W.seeds[i];
        sd.y -= dt * 1.6 * sd.s;
        if (sd.y < 0) { sd.y = 14; sd.x = (Math.random() - 0.5) * 44; sd.z = (Math.random() - 0.5) * 44; }
        pos.setXYZ(i, c.x + sd.x + Math.sin(W.t + i) * 0.4, sd.y, c.z + sd.z + Math.cos(W.t * 0.7 + i) * 0.4);
      }
      pos.needsUpdate = true;
    }
    // relámpagos
    if (w === 'storm' && !indoor) {
      W.flashT = (W.flashT ?? 5) - dt;
      if (W.flashT <= 0) { W.flashT = 4 + Math.random() * 8; W.flash = 0.25; setTimeout(() => sfx('thunder'), 300 + Math.random() * 700); }
    }
    if (W.flash > 0) W.flash -= dt;
    // niebla
    const fogOn = !indoor && (w === 'fog' || w === 'storm' || w === 'snow');
    if (fogOn) {
      const dist = this.camOffset.length();
      if (!this.scene.fog) this.scene.fog = new THREE.Fog(0xb8c4cc, dist, dist + 60);
      const k = w === 'fog' ? 22 : 40;
      this.scene.fog.near = dist - 8; this.scene.fog.far = dist + k;
      this.scene.fog.color.copy(this.scene.background).lerp(new THREE.Color(0xc8d0d8), 0.5);
    } else if (this.scene.fog) this.scene.fog = null;
  };
  // atenuación de la luz según el clima (la usa updateLighting)
  P.weatherDim = function () {
    const w = this.weather;
    let k = w === 'storm' ? 0.5 : w === 'rain' ? 0.68 : w === 'cloudy' ? 0.82 : w === 'fog' ? 0.8 : w === 'snow' ? 0.85 : 1;
    if (this.wx && this.wx.flash > 0) k = 2.2;
    return k;
  };
  P.applySeason = function (s) {
    const col = new THREE.Color();
    for (const t of this.treeMap.values()) {
      if (!t.mesh || t.down) continue;
      const k = 0.86 + (t.hue ?? 0.5) * 0.14;
      if (s === 2 && (t.type === 'oak' || t.type === 'jungle' || t.type === 'yellow')) col.setRGB(1.15, 0.72 + (t.hue ?? 0.5) * 0.2, 0.45);
      else if (s === 3 && t.type !== 'palm' && t.type !== 'cactus') col.setRGB(1.25, 1.28, 1.35);
      else if (t.type === 'autumn') col.setRGB(1, 0.75 + (t.hue ?? 0.5) * 0.25, 0.75 + (t.hue ?? 0.5) * 0.25);
      else col.setRGB(k, k + 0.02, k);
      t.mesh.setColorAt(t.index, col);
    }
    for (const t of this.treeMap.values()) if (t.mesh && t.mesh.instanceColor) t.mesh.instanceColor.needsUpdate = true;
    const g = this.groundMain;
    if (g) g.material.emissive.set(s === 3 ? 0x5a6470 : 0x000000);
    if (this.treeMat) this.treeMat.emissive.set(s === 3 ? 0x4a525e : 0x000000);
  };

  // ============================================================ horarios de los vecinos
  P.npcRoutine = function (n, dt) {
    const reg = this.W.regionAt(n.home.x, n.home.z);
    if (reg && reg.kind === 'interior') return false;
    if (!n.sched) {
      const blds = reg ? (reg.buildings || []) : this.W.buildings;
      const SIDE = { s: [0, 1], n: [0, -1], e: [1, 0], w: [-1, 0] };
      const front = (b) => {
        let dx, dz;
        if (b.door === 's' || b.door === 'n') { dx = Math.floor(b.x0 + (b.w - 1) / 2); dz = b.door === 's' ? b.z0 + b.d - 1 : b.z0; } else { dz = Math.floor(b.z0 + (b.d - 1) / 2); dx = b.door === 'e' ? b.x0 + b.w - 1 : b.x0; }
        const [nx, nz] = SIDE[b.door] || [0, 1];
        return { x: dx + nx, z: dz + nz };
      };
      let home = null, hd = 16, tav = null, td = 30;
      for (const b of blds) {
        if (!b.door || b.lighthouse || b.clock) continue;
        const f = front(b);
        if (!this.W.walkable(f.x, f.z)) continue;
        const d = Math.hypot(f.x - n.home.x, f.z - n.home.z);
        if (d < hd) { hd = d; home = f; }
        if (TAVERNS.includes(b.id) && d < td) { td = d; tav = f; }
      }
      const h = hashId(n.id);
      n.sched = { home, tav, drinker: h % 3 === 0, shy: h % 5 < 2, guard: GUARDS.has(n.id) };
    }
    const S = n.sched, h = this.tod;
    const q = this.questAtCur ? this.questAtCur() : null;
    const important = q && (q.target === n.id || q.giver === n.id);
    let goal = null, sleep = false;
    if (!S.guard && !important && S.home && (h >= 22 || h < 6)) { goal = S.home; sleep = true; }
    else if (!S.guard && !important && S.home && S.shy && this.isWet() && h > 6) { goal = S.home; sleep = true; }
    else if (S.drinker && S.tav && h >= 19 && h < 22) goal = { x: S.tav.x + ((hashId(n.id) % 3) - 1), z: S.tav.z + 1 + (hashId(n.id) % 2) };
    if (!goal) {
      if (n.sleeping) { n.sleeping = false; n.model.root.visible = true; n.path = []; n.x = S.home.x; n.z = S.home.z; n.routing = true; }
      if (n.routing) { n.routing = false; n.atGoal = false; n.goTo(n.home.x, n.home.z, false, 3000); }
      return false;
    }
    n.routing = true;
    if (n.sleeping) { n.st.moving = false; return true; }
    const d = Math.hypot(n.x - goal.x, n.z - goal.z);
    if (d < 1.1) {
      if (sleep) { n.sleeping = true; n.model.root.visible = false; n.label.el.style.display = 'none'; n.label._vis = false; }
      else {
        n.atGoal = true;
        n.chatT = (n.chatT ?? Math.random() * 6) - dt;
        if (n.chatT <= 0) { n.chatT = 6 + Math.random() * 10; this.ui.float(['🍺 ¡Salud!', '¡Otra ronda!', '♪ ¡Yo-ho! ♪', '¿Os he contado lo del kraken?', '¡Por el Mar de Bruma!'][Math.floor(Math.random() * 5)], 'chat', n.x, n.model.height + 0.5, n.z); }
        n.faceTo(S.tav.x - n.x + 0.01, S.tav.z - 2 - n.z, dt);
      }
      n.st.moving = false;
      n.path = [];
      return true;
    }
    n.speed = 1.8;
    n.routeT = (n.routeT || 0) - dt;
    if (!n.path.length && n.routeT <= 0) { n.routeT = 2; if (!n.goTo(goal.x, goal.z, false, 4000)) n.goTo(goal.x, goal.z, true, 4000); }
    n.stepMove(dt);
    return true;
  };

  // ============================================================ pareja
  P.coupleAct = function (n, kind) {
    const p = this.player;
    if (kind === 'carry') return this.toggleCarry(n);
    if (this.carrying) this.toggleCarry(this.carrying);
    // se acercan cara a cara
    const f = p.face;
    const tx = p.x + Math.sin(f) * 0.48, tz = p.z + Math.cos(f) * 0.48;
    if (this.W.walkable(Math.round(tx), Math.round(tz)) || true) { n.x = tx; n.z = tz; n.path = []; }
    n.face = f + Math.PI;
    n.coupleT = kind === 'dance' ? 4 : 2.2;
    p.st[kind] = n.st[kind] = true;
    p.path = []; p.target = null;
    const dur = kind === 'dance' ? 4000 : kind === 'kiss' ? 2000 : 2200;
    const icons = { kiss: '💋', hug: '🤗', dance: '🎶' };
    for (let i = 0; i < 5; i++) setTimeout(() => this.ui.float(i % 2 ? '💖' : icons[kind], 'heal', (p.x + n.x) / 2, 1.3 + i * 0.12, (p.z + n.z) / 2), i * (dur / 6));
    setTimeout(() => { p.st[kind] = n.st[kind] = false; n.coupleT = 0; }, dur);
    this.addFriend(n, kind === 'dance' ? 3 : 2, true);
    sfx(kind === 'dance' ? 'quest' : 'level');
  };
  P.toggleCarry = function (n) {
    const p = this.player;
    if (this.carrying) {
      const c = this.carrying;
      this.carrying = null;
      p.model.root.remove(c.model.root);
      this.scene.add(c.model.root);
      c.model.root.rotation.set(0, 0, 0);
      c.carried = false;
      c.st.carried = false;
      p.st.carry = false;
      c.x = p.x + Math.sin(p.face + 1.2) * 0.7; c.z = p.z + Math.cos(p.face + 1.2) * 0.7;
      if (!this.W.walkable(Math.round(c.x), Math.round(c.z))) { c.x = p.x; c.z = p.z; }
      c.vy = undefined;
      return;
    }
    if (!n) return;
    const s = this.soc(n.id);
    s.hand = false;
    this.carrying = n;
    n.carried = true;
    n.path = [];
    this.scene.remove(n.model.root);
    p.model.root.add(n.model.root);
    n.model.root.position.set(0.4, 0.68, 0.3);
    n.model.root.rotation.set(0, 0, Math.PI / 2);
    n.st.carried = true;
    p.st.carry = true;
    n.label.el.style.display = 'none'; n.label._vis = false;
    this.toast(`👐 Llevas a ${n.name} en brazos`);
    for (let i = 0; i < 3; i++) setTimeout(() => this.ui.float('💗', 'heal', p.x, 1.6 + i * 0.15, p.z), i * 300);
  };
}

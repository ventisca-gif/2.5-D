// Clases por arma (espada, hacha, lanza), 5 habilidades por clase que se desbloquean al subir de nivel,
// meditación con mejora temporal y mejoras activas (buffs).
import * as THREE from 'three';

export const CLASSES = {
  sword: { name: 'Espadachín', icon: '🗡️' },
  axe: { name: 'Bárbaro', icon: '🪓' },
  spear: { name: 'Lancero', icon: '🔱' },
};
// tipo: multi (varios golpes al objetivo), dash (carrera que hiere), spin (área alrededor), wave (onda que avanza),
// buff, leap (salto al objetivo con área), quake (ondas de choque), line (perfora en línea), sweep (barrido frontal)
export const SKILLS = {
  sword: [
    { id: 's1', name: 'Tajo doble', icon: '⚔️', lvl: 2, cd: 4, st: 10, type: 'multi', hits: 2, k: 1.5 },
    { id: 's2', name: 'Estocada veloz', icon: '💨', lvl: 6, cd: 7, st: 14, type: 'dash', dist: 3.5, k: 2.0 },
    { id: 's3', name: 'Torbellino', icon: '🌀', lvl: 12, cd: 10, st: 18, type: 'spin', r: 2.3, k: 2.2 },
    { id: 's4', name: 'Corte de viento', icon: '🌪️', lvl: 20, cd: 12, st: 20, type: 'wave', dist: 7, k: 2.6 },
    { id: 's5', name: 'Mil cortes', icon: '✨', lvl: 30, cd: 20, st: 30, type: 'multi', hits: 6, k: 1.3 },
  ],
  axe: [
    { id: 'a1', name: 'Golpe brutal', icon: '💥', lvl: 2, cd: 5, st: 12, type: 'multi', hits: 1, k: 2.8 },
    { id: 'a2', name: 'Grito de guerra', icon: '📣', lvl: 6, cd: 25, st: 15, type: 'buff', buff: 'furia', dur: 15 },
    { id: 'a3', name: 'Salto aplastante', icon: '🦘', lvl: 12, cd: 10, st: 20, type: 'leap', r: 2.6, k: 2.5 },
    { id: 'a4', name: 'Remolino de hacha', icon: '🌀', lvl: 20, cd: 12, st: 24, type: 'spin', r: 2.6, k: 1.2, ticks: 4 },
    { id: 'a5', name: 'Terremoto', icon: '🌋', lvl: 30, cd: 22, st: 32, type: 'quake', r: 4.2, k: 3.4 },
  ],
  spear: [
    { id: 'l1', name: 'Embestida', icon: '🔱', lvl: 2, cd: 5, st: 12, type: 'line', dist: 3.2, k: 1.9 },
    { id: 'l2', name: 'Barrido', icon: '〰️', lvl: 6, cd: 7, st: 14, type: 'sweep', r: 2.4, k: 1.8 },
    { id: 'l3', name: 'Salto del dragón', icon: '🐉', lvl: 12, cd: 11, st: 20, type: 'leap', r: 2.2, k: 2.8 },
    { id: 'l4', name: 'Lluvia de lanzas', icon: '☄️', lvl: 20, cd: 13, st: 22, type: 'multi', hits: 4, k: 1.6 },
    { id: 'l5', name: 'Marea del tridente', icon: '🌊', lvl: 30, cd: 22, st: 32, type: 'wave', dist: 8, k: 3.2, wide: true },
  ],
};
export const BUFFS = {
  medita: { name: '🧘 Concentración', atk: 1.25, def: 1.25, regen: 0.012 },
  furia: { name: '📣 Furia', atk: 1.4 },
};

export function installSkills(Game, D) {
  const P = Game.prototype;
  const sfx = D.sfx;

  P.playerClass = function () {
    const w = D.EQUIP[this.player.equip.weapon];
    const L = w ? w.look : {};
    return L.axe ? 'axe' : L.spear ? 'spear' : 'sword';
  };
  P.buffMul = function (k) {
    let m = 1;
    for (const [id, b] of Object.entries(this.buffs || {})) if (b.t > 0 && BUFFS[id][k]) m *= BUFFS[id][k];
    return m;
  };
  P.addBuff = function (id, dur) {
    this.buffs = this.buffs || {};
    this.buffs[id] = { t: dur };
    this.renderBuffs();
  };
  P.renderBuffs = function () {
    const el = document.getElementById('buffs');
    if (!el) return;
    el.innerHTML = Object.entries(this.buffs || {}).filter(([, b]) => b.t > 0).map(([id, b]) => `<div class="buff">${BUFFS[id].name} ${Math.ceil(b.t)}s</div>`).join('');
  };

  // ------------------------------------------------------------ meditación
  P.meditate = function () {
    const p = this.player;
    if (!this.started || this.paused || p.dead || this.sailing) return;
    if (this.medCd > 0) return this.toast(`🧘 Podrás meditar de nuevo en ${Math.ceil(this.medCd)} s`);
    if (this.meditating) { this.stopMeditate(); return; }
    if (this.time - (p.lastCombat || -99) < 4) return this.toast('No puedes meditar en pleno combate');
    p.path = []; p.target = null;
    this.meditating = { t: 0 };
    p.st.meditate = true;
    this.toast('🧘 Meditando... no te muevas');
  };
  P.stopMeditate = function (done) {
    const p = this.player;
    this.meditating = null;
    p.st.meditate = false;
    if (done) {
      this.addBuff('medita', 90);
      this.medCd = 120;
      p.stamina = p.maxSt;
      this.ring(p.x, p.z, 2, 0x9ad8ff);
      this.ui.float('✨ Concentración', 'crit', p.x, 1.8, p.z);
      sfx('level');
    }
  };

  // ------------------------------------------------------------ habilidades
  P.useSkill = function (i) {
    const p = this.player, cls = this.playerClass(), sk = SKILLS[cls][i];
    if (!sk || !this.started || this.paused || p.dead || this.sailing) return;
    if (p.level < sk.lvl) return this.toast(`🔒 ${sk.name}: se desbloquea en el nivel ${sk.lvl}`);
    this.skillCd = this.skillCd || {};
    if ((this.skillCd[sk.id] || 0) > 0) return;
    if (p.stamina < sk.st) return this.toast('Te falta estamina');
    if (p.st.swim) return this.toast('No puedes usar habilidades nadando');
    if (this.meditating) this.stopMeditate();
    if (this.carrying) this.toggleCarry(this.carrying);
    p.stamina -= sk.st;
    this.skillCd[sk.id] = sk.cd;
    p.lastCombat = this.time;
    const atk = p.atk;
    const foes = () => {
      const out = [...this.enemies.filter((e) => !e.dead && !e.removed && (!e.hostile || e.hostile() || (p.target && p.target.ref === e))), ...this.npcs.filter((n) => n.fight)];
      return out;
    };
    const hit = (e, k) => {
      const crit = Math.random() < 0.18;
      const dmg = Math.max(1, Math.round(atk * k * (0.9 + Math.random() * 0.2) * (crit ? 1.7 : 1)));
      if (e.isNPC) this.damageNPC(e, dmg, crit); else this.hitEnemy(e, dmg, crit);
    };
    const nearest = (r) => { let b = null, bd = r; for (const e of foes()) { const d = p.dist(e); if (d < bd) { bd = d; b = e; } } return b; };
    const fwd = () => ({ x: Math.sin(p.face), z: Math.cos(p.face) });
    const face = (e) => { if (e) p.faceTo(e.x - p.x, e.z - p.z, 1); };
    const area = (cx, cz, r, k) => { for (const e of foes()) if (Math.hypot(e.x - cx, e.z - cz) <= r) hit(e, k); };
    const col = { sword: 0xbfe6ff, axe: 0xff9a50, spear: 0x7af0d8 }[cls];
    this.ui.float(sk.name, 'crit', p.x, 1.9, p.z);
    sfx('skill');
    switch (sk.type) {
      case 'multi': {
        const t = (p.target && p.target.kind === 'enemy' && !p.target.ref.dead && p.dist(p.target.ref) < 2.4) ? p.target.ref : nearest(2.4);
        face(t);
        for (let k = 0; k < sk.hits; k++) setTimeout(() => {
          p.st.attackT = 0.32;
          this.slash(p, col);
          if (t && !t.dead && p.dist(t) < 2.6) hit(t, sk.k);
        }, k * (sk.hits > 3 ? 120 : 220));
        break;
      }
      case 'dash': case 'line': {
        const t = nearest(5); face(t);
        const f = fwd();
        p.st.skill = { type: sk.type === 'dash' ? 'dash' : 'thrust', t: 0, dur: 0.4 };
        const steps = Math.round(sk.dist * 4);
        let lx = p.x, lz = p.z;
        for (let k = 1; k <= steps; k++) { const x = p.x + f.x * k * 0.25, z = p.z + f.z * k * 0.25; if (!this.W.walkable(Math.round(x), Math.round(z))) break; lx = x; lz = z; }
        const hitSet = new Set();
        for (const e of foes()) {
          const ex = e.x - p.x, ez = e.z - p.z;
          const along = ex * f.x + ez * f.z, side = Math.abs(ex * f.z - ez * f.x);
          if (along > -0.3 && along < sk.dist + 0.8 && side < 1.0) hitSet.add(e);
        }
        if (sk.type === 'dash') { p.x = lx; p.z = lz; p.path = []; }
        this.slash(p, col);
        for (const e of hitSet) hit(e, sk.k);
        break;
      }
      case 'spin': {
        p.st.skill = { type: 'spin', t: 0, dur: sk.ticks ? 1.6 : 0.6 };
        const n = sk.ticks || 1;
        for (let k = 0; k < n; k++) setTimeout(() => { this.ring(p.x, p.z, sk.r, col); this.slash(p, col); area(p.x, p.z, sk.r, sk.k); }, 100 + k * 380);
        break;
      }
      case 'sweep': {
        p.st.skill = { type: 'sweep', t: 0, dur: 0.45 };
        const f = fwd();
        this.slash(p, col);
        for (const e of foes()) { const ex = e.x - p.x, ez = e.z - p.z, d = Math.hypot(ex, ez); if (d <= sk.r && (ex * f.x + ez * f.z) / Math.max(0.01, d) > -0.1) hit(e, sk.k); }
        break;
      }
      case 'leap': {
        const t = nearest(6); face(t);
        p.st.skill = { type: 'leap', t: 0, dur: 0.6 };
        let tx = p.x, tz = p.z;
        if (t) { const a = Math.atan2(p.x - t.x, p.z - t.z); tx = t.x + Math.sin(a) * 0.9; tz = t.z + Math.cos(a) * 0.9; if (!this.W.walkable(Math.round(tx), Math.round(tz))) { tx = p.x; tz = p.z; } }
        const sx = p.x, sz = p.z;
        const t0 = this.time;
        this.leap = { sx, sz, tx, tz, t0, dur: 0.5 };
        setTimeout(() => { this.ring(tx, tz, sk.r, col); this.camShake = 0.3; area(tx, tz, sk.r, sk.k); }, 500);
        break;
      }
      case 'quake': {
        p.st.skill = { type: 'slam', t: 0, dur: 0.7 };
        setTimeout(() => {
          this.camShake = 0.6;
          for (let k = 0; k < 3; k++) setTimeout(() => this.ring(p.x, p.z, sk.r * (0.5 + k * 0.25), col), k * 140);
          area(p.x, p.z, sk.r, sk.k);
          for (const e of foes()) if (p.dist(e) <= sk.r) { e.stunT = 1.5; }
        }, 380);
        break;
      }
      case 'wave': {
        const t = nearest(sk.dist); face(t);
        p.st.skill = { type: cls === 'spear' ? 'thrust' : 'sweep', t: 0, dur: 0.45 };
        const f = fwd();
        const geo = new THREE.RingGeometry(0.4, 0.75, 18, 1, -Math.PI / 2 - 1.0, 2.0);
        geo.rotateX(-Math.PI / 2);
        const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
        m.position.set(p.x, (p.vy || 0) + 0.6, p.z);
        m.rotation.y = p.face;
        m.scale.setScalar(sk.wide ? 2 : 1.3);
        this.scene.add(m);
        (this.waves || (this.waves = [])).push({ m, x: p.x, z: p.z, fx: f.x, fz: f.z, d: 0, max: sk.dist, k: sk.k, hit: new Set(), wide: sk.wide ? 1.6 : 1.0, hitFn: hit, foes });
        break;
      }
      case 'buff': {
        p.st.skill = { type: 'cry', t: 0, dur: 0.8 };
        this.addBuff(sk.buff, sk.dur);
        this.ring(p.x, p.z, 2.5, 0xff5030);
        this.camShake = 0.2;
        break;
      }
      default: break;
    }
    this.renderSkills(true);
  };
  P.renderSkills = function (force) {
    const bar = document.getElementById('skillBar');
    if (!bar) return;
    const p = this.player, cls = this.playerClass();
    const key = cls + p.level;
    if (force || bar._k !== key) {
      bar._k = key;
      bar.innerHTML = SKILLS[cls].map((sk, i) => `<button class="skb ${p.level < sk.lvl ? 'locked' : ''}" data-i="${i}" title="${sk.name}">${p.level < sk.lvl ? '🔒' : sk.icon}<div class="cd"></div><small>${p.level < sk.lvl ? 'Nv ' + sk.lvl : ''}</small></button>`).join('');
      bar.querySelectorAll('.skb').forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this.useSkill(Number(b.dataset.i)); }));
    }
    const cds = bar.querySelectorAll('.cd');
    SKILLS[cls].forEach((sk, i) => {
      const c = (this.skillCd && this.skillCd[sk.id]) || 0;
      const h = c > 0 ? Math.round((c / sk.cd) * 100) + '%' : '0%';
      if (cds[i] && cds[i]._h !== h) { cds[i]._h = h; cds[i].style.height = h; }
    });
  };
  P.updateSkills = function (dt) {
    const p = this.player;
    if (this.skillCd) for (const k of Object.keys(this.skillCd)) this.skillCd[k] = Math.max(0, this.skillCd[k] - dt);
    if (this.medCd > 0) this.medCd -= dt;
    // buffs
    let ch = false;
    for (const [id, b] of Object.entries(this.buffs || {})) {
      if (b.t <= 0) continue;
      const before = Math.ceil(b.t);
      b.t -= dt;
      if (Math.ceil(b.t) !== before) ch = true;
      if (BUFFS[id].regen && !p.dead) p.hp = Math.min(p.maxHp, p.hp + p.maxHp * BUFFS[id].regen * dt);
    }
    if (ch) this.renderBuffs();
    // meditar: 3 s quieto
    if (this.meditating) {
      if (p.st.moving || this.joyVector() || p.dead || this.sailing) this.stopMeditate();
      else {
        this.meditating.t += dt;
        if (Math.floor(this.meditating.t * 2) !== Math.floor((this.meditating.t - dt) * 2)) this.ui.float('✦', 'info', p.x + (Math.random() - 0.5), 1.2, p.z + (Math.random() - 0.5));
        if (this.meditating.t >= 3) this.stopMeditate(true);
      }
    }
    // salto de habilidad
    if (this.leap) {
      const L = this.leap, e = Math.min(1, (this.time - L.t0) / L.dur);
      p.x = L.sx + (L.tx - L.sx) * e; p.z = L.sz + (L.tz - L.sz) * e; p.path = [];
      if (e >= 1) this.leap = null;
    }
    // ondas cortantes
    if (this.waves) for (let i = this.waves.length - 1; i >= 0; i--) {
      const w = this.waves[i];
      const step = dt * 12;
      w.d += step; w.x += w.fx * step; w.z += w.fz * step;
      w.m.position.x = w.x; w.m.position.z = w.z;
      w.m.material.opacity = 0.85 * (1 - w.d / w.max);
      for (const e of w.foes()) if (!w.hit.has(e) && Math.hypot(e.x - w.x, e.z - w.z) < w.wide) { w.hit.add(e); w.hitFn(e, w.k); }
      if (w.d >= w.max) { this.scene.remove(w.m); w.m.geometry.dispose(); w.m.material.dispose(); this.waves.splice(i, 1); }
    }
    if (this.started) this.renderSkills();
  };
}

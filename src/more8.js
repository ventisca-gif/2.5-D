// v3.6: habilidades de cada tripulante, equiparles a mano, rangos de la tripulación, asedio al Bastión,
// fiesta de boda, mascotas que luchan con vida propia, diario de cada tripulante y peligros en el mar.
import * as THREE from 'three';
import { crewGear, gearStats, EQUIP, ITEMS } from './items.js';
import { T } from './world.js';

const HEALERS = new Set(['ixa', 'naira', 'tomasa', 'coral', 'rosa', 'mambe']);
const CSKILL = {
  sword: { name: 'Corte veloz', icon: '⚡', k: 2.2 },
  axe: { name: 'Remolino', icon: '🌀', k: 1.6 },
  spear: { name: 'Estocada', icon: '🔱', k: 2.0 },
  heal: { name: 'Curar', icon: '💚', k: 0.18 },
};
export const RANKS = [
  { name: 'Grumete', icon: '🪣', lvl: 1, cost: 0, desc: 'Recién llegado' },
  { name: 'Marinero', icon: '⚓', lvl: 20, cost: 500, desc: '+10% de daño' },
  { name: 'Contramaestre', icon: '🎖', lvl: 40, cost: 2000, desc: '+20% de daño y el barco se repara algo en el mar' },
  { name: 'Primer oficial', icon: '⭐', lvl: 60, cost: 6000, desc: '+30% de daño, +15% de daño de cañón y +8% de velocidad (solo uno)' },
];

export function installMore8(Game, D) {
  const P = Game.prototype;
  const sfx = D.sfx;
  const mem = (g, n, txt) => { const s = g.soc(n.id); s.mem = s.mem || []; s.mem.unshift(`Día ${g.day}: ${txt}`); if (s.mem.length > 12) s.mem.length = 12; };
  P.crewMemory = function (n, txt) { mem(this, n, txt); };

  // ============================================================ equipo a mano
  P.crewEquip = function (n) {
    const s = this.soc(n.id), base = crewGear(this.compLevel ? this.compLevel(n) : n.level);
    return { ...base, ...(s.eq || {}) };
  };
  P.giveCrewItemMenu = function (id) {
    const it = EQUIP[id] || ITEMS[id];
    const crew = this.crew().filter((n) => this.soc(n.id).role !== 'jail');
    const pt = this.partner();
    if (pt && !crew.includes(pt)) crew.push(pt);
    if (!crew.length) return this.toast('No tienes tripulación ni pareja');
    this.ui.openDialog(`🎽 Dar ${it.name}`, '¿A quién se lo das? Se lo pondrá y mejorará su vida, defensa y daño.', [
      ...crew.map((n) => { const cur = (this.soc(n.id).eq || {})[it.slot]; return { label: `${n.name} (Nv. ${n.level})${cur ? ' · lleva ' + EQUIP[cur].name : ''}`, action: () => this.giveCrewItem(n, id) }; }),
      { label: 'Cancelar', action: null },
    ]);
  };
  P.giveCrewItem = function (n, id) {
    const p = this.player, it = EQUIP[id];
    if (!p.inv[id]) return;
    const s = this.soc(n.id);
    s.eq = s.eq || {};
    if (s.eq[it.slot]) p.inv[s.eq[it.slot]] = (p.inv[s.eq[it.slot]] || 0) + 1;
    p.inv[id]--;
    s.eq[it.slot] = id;
    n.cKey = null; n.tier = -1;
    if (this.rebuildCrewLook) this.rebuildCrewLook(n);
    mem(this, n, `Me regalaste ${it.name}. ¡Me queda genial!`);
    this.addFriend(n, 3, true);
    this.toast(`🎽 ${n.name} se pone ${it.name}`);
    sfx('coin');
  };
  P.takeCrewItems = function (n) {
    const s = this.soc(n.id), p = this.player;
    for (const id of Object.values(s.eq || {})) p.inv[id] = (p.inv[id] || 0) + 1;
    s.eq = {}; n.cKey = null; n.tier = -1; this.rebuildCrewLook(n);
    this.toast(`🎒 Recuperas el equipo de ${n.name}`);
  };
  // estadísticas con su equipo propio
  P.compStats = function (n) {
    const eq = this.crewEquip(n), key = n.level + ':' + JSON.stringify(eq);
    if (n.cKey !== key) {
      const gs = gearStats(eq);
      const max = Math.round(60 + (n.level - 1) * 12 + gs.hp);
      n.cmax = max; n.cdef = gs.def; n.catk = gs.atk; n.cKey = key;
      if (n.chp === undefined || n.chp > max) n.chp = max;
    }
  };
  P.crewDmgMul = function (n) {
    const s = this.soc(n.id);
    this.compStats(n);
    return (1 + (n.catk || 0) / (10 + n.level * 2)) * [1, 1.1, 1.2, 1.3][s.rank || 0];
  };

  // ============================================================ rangos
  P.rankMenu = function (n) {
    const s = this.soc(n.id), r = s.rank || 0, next = RANKS[r + 1];
    const lines = RANKS.map((k, i) => `${i === r ? '▶ ' : ''}${k.icon} ${k.name}: ${k.desc}${i ? ` (Nv. ${k.lvl}, ${k.cost} oro)` : ''}`).join('<br>');
    const opts = [];
    if (next) opts.push({ label: `${next.icon} Ascender a ${next.name} (${next.cost} oro)`, action: () => this.promote(n) });
    opts.push({ label: 'Cerrar', action: null });
    this.ui.openDialog(`🎖 Rango de ${n.name}: ${RANKS[r].name}`, lines, opts);
  };
  P.promote = function (n) {
    const s = this.soc(n.id), r = (s.rank || 0) + 1, R = RANKS[r];
    if (!R) return;
    if (n.level < R.lvl) return this.toast(`Necesita nivel ${R.lvl}`);
    if (r === 3 && this.crew().some((k) => k !== n && (this.soc(k.id).rank || 0) >= 3)) return this.toast('Ya tienes un Primer oficial');
    this.buy({ gold: R.cost }, () => {
      s.rank = r;
      mem(this, n, `Me ascendiste a ${R.name}. No te decepcionaré.`);
      this.addFriend(n, 6, true);
      this.toast(`${R.icon} ¡${n.name} asciende a ${R.name}!`, 'area');
      sfx('level');
    });
  };
  P.rankOf = function (r) { return this.crew().some((n) => (this.soc(n.id).rank || 0) >= r); };
  const baseShip = P.shipStats;
  P.shipStats = function () {
    const st = baseShip.call(this);
    if (this.rankOf(3)) { st.dmg *= 1.15; st.speed *= 1.08; }
    return st;
  };

  // ============================================================ habilidades de la tripulación
  P.crewClass = function (n) {
    if (HEALERS.has(n.id)) return 'heal';
    const eq = this.crewEquip(n), w = EQUIP[eq.weapon], L = { ...(n.look0 || {}), ...((w && w.look) || {}) };
    return L.axe ? 'axe' : L.spear ? 'spear' : 'sword';
  };
  P.crewSkillTick = function (n, dt) {
    const s = this.soc(n.id);
    if (!s.crew || s.role || n.ko || n.fight) return;
    n.cskCd = (n.cskCd ?? 5) - dt;
    if (n.cskCd > 0) return;
    const cls = this.crewClass(n), sk = CSKILL[cls], lv = s.sk || 1;
    const p = this.player;
    if (cls === 'heal') {
      const all = [p, ...(this.companions ? this.companions() : [])].filter((k) => !k.ko && !k.dead && k.dist(n) < 7);
      let worst = null, wr = 0.7;
      for (const k of all) { const r = k === p ? p.hp / p.maxHp : (k.chp ?? k.cmax) / (k.cmax || 1); if (r < wr) { wr = r; worst = k; } }
      if (!worst) { n.cskCd = 1; return; }
      n.cskCd = Math.max(5, 12 - lv * 0.5);
      if (worst === p) { const h = Math.round(p.maxHp * (sk.k + lv * 0.02)); p.hp = Math.min(p.maxHp, p.hp + h); this.ui.float('+' + h + ' 💚', 'heal', p.x, 1.5, p.z); }
      else { const h = Math.round(worst.cmax * (sk.k + lv * 0.02) * 1.5); worst.chp = Math.min(worst.cmax, worst.chp + h); this.ui.setHp(worst.label, worst.chp / worst.cmax); this.ui.float('+' + h + ' 💚', 'heal', worst.x, worst.model.height + 0.3, worst.z); }
      this.ring(worst.x, worst.z, 0.9, 0x7aff8a);
      n.st.skill = { type: 'cry', t: 0, dur: 0.6 };
    } else {
      const foe = this.crewFoe();
      if (!foe || foe.dead || foe.dist(n) > 3.2) { n.cskCd = 0.8; return; }
      n.cskCd = Math.max(5, 10 - lv * 0.4);
      n.faceTo(foe.x - n.x, foe.z - n.z, 1);
      const dmg = Math.round((4 + n.level * 1.8) * sk.k * (1 + lv * 0.08) * this.crewDmgMul(n));
      if (cls === 'axe') {
        n.st.skill = { type: 'spin', t: 0, dur: 0.7 };
        this.ring(n.x, n.z, 2.2, 0xff9a50);
        for (const e of this.enemies) if (!e.dead && (!e.hostile || e.hostile()) && e.dist(n) < 2.3) this.hitEnemy(e, dmg, false, n);
      } else if (cls === 'spear') {
        n.st.skill = { type: 'thrust', t: 0, dur: 0.45 };
        this.hitEnemy(foe, dmg, true, n);
      } else {
        n.st.skill = { type: 'dash', t: 0, dur: 0.4 };
        const ang = Math.atan2(foe.x - n.x, foe.z - n.z), nx = foe.x - Math.sin(ang) * 1.0, nz = foe.z - Math.cos(ang) * 1.0;
        if (this.W.walkable(Math.round(nx), Math.round(nz))) { n.x = nx; n.z = nz; n.path = []; }
        this.slash(n, 0x9ad8ff);
        this.hitEnemy(foe, dmg, true, n);
      }
    }
    this.ui.float(`${sk.icon} ${sk.name}`, 'crit', n.x, n.model.height + 0.5, n.z);
    s.skUse = (s.skUse || 0) + 1;
    if (s.skUse >= 10 * (s.sk || 1) && (s.sk || 1) < 10) { s.skUse = 0; s.sk = (s.sk || 1) + 1; this.toast(`${sk.icon} ${n.name}: ${sk.name} sube a nivel ${s.sk}`); mem(this, n, `Mi ${sk.name} ya es de nivel ${s.sk}.`); }
  };

  // ============================================================ diario de cada tripulante
  P.crewDiary = function (n) {
    const s = this.soc(n.id), r = RANKS[s.rank || 0], cls = CSKILL[this.crewClass(n)];
    const f = s.f || 0;
    const opinion = f >= 90 ? `Daría mi vida por ${this.player.name}. Es más que un capitán para mí.` : f >= 70 ? `${this.player.name} es un gran capitán. Me siento parte de una familia.` : f >= 50 ? `Me gusta navegar con ${this.player.name}, aunque a veces podría escucharnos más.` : `Todavía no sé si confiar del todo en ${this.player.name}...`;
    const lines = [
      `📖 Diario de ${n.name}`,
      `${r.icon} ${r.name} · Nv. ${n.level} · ${cls.icon} ${cls.name} Nv. ${s.sk || 1}`,
      `⚔️ Enemigos vencidos: ${s.kills || 0} · 💫 Desmayos: ${s.kos || 0} · 🧭 Expediciones: ${s.exps || 0}`,
      `💭 «${opinion}»`,
      ...(s.mem && s.mem.length ? ['— Recuerdos —', ...s.mem] : ['— Aún no hay recuerdos —']),
    ];
    this.ui.openDialog(`📖 ${n.name}`, lines.join('<br>'), [{ label: '🎖 Rango', action: () => this.rankMenu(n) }, ...(s.eq && Object.keys(s.eq).length ? [{ label: '🎒 Recuperar su equipo', action: () => this.takeCrewItems(n) }] : []), { label: 'Cerrar', action: null }]);
  };

  // ============================================================ asedio al Bastión
  P.siegeMenu = function () {
    if (this.siege) return this.toast('¡El asedio ya ha empezado!');
    if (this.isMarine()) return this.toast('Eres de la Marina: no puedes asaltar tu propia fortaleza');
    this.ui.openDialog('🏰 Asedio al Bastión', 'Lucas: «Con tu tripulación podemos tomar la fortaleza. Serán tres oleadas de marines y luego el comodoro. Si ganamos, el Bastión no te molestará en un día y el botín será tuyo.»', [
      { label: '⚔️ ¡Al asalto!', action: () => this.startSiege() },
      { label: 'Aún no', action: null },
    ]);
  };
  P.startSiege = function () {
    const R = this.islets.find((r) => r.id === 'bastion');
    const { x: cx, z: cz } = R.center;
    this.siege = { wave: 0, temps: [], t: 3, cx, cz: cz + 7 };
    this.toast('🏰 ¡Empieza el asedio al Bastión!', 'area');
    sfx('quest');
  };
  P.updateSiege = function (dt) {
    const S = this.siege;
    if (!S) return;
    const p = this.player, el = document.getElementById('eventBanner');
    if (p.dead || this.sailing) { for (const e of S.temps) if (!e.removed) e.remove(); this.siege = null; this.purgeTemps(); if (el) el.classList.add('hidden'); return this.toast('🏰 El asedio ha fracasado'); }
    const alive = S.temps.filter((e) => !e.dead && !e.removed).length;
    if (el && !this.mrace) { el.classList.remove('hidden'); el.textContent = `🏰 Asedio · oleada ${Math.max(1, S.wave)}/4 · quedan ${alive}`; }
    if (alive) return;
    S.t -= dt;
    if (S.t > 0) return;
    S.t = 4;
    if (S.wave >= 4) {
      this.siege = null; if (el) el.classList.add('hidden');
      const gold = 4000 + p.level * 40;
      p.gold += gold; this.addBounty(2000, 'siege'); this.give('ficha', 10);
      this.flags.siegeDay = this.day;
      this.stats.sieges = (this.stats.sieges || 0) + 1;
      for (const n of this.crew()) mem(this, n, 'Tomamos el Bastión de la Marina juntos. ¡Qué batalla!');
      this.toast(`🏰 ¡Has tomado el Bastión! +${gold} oro y 10 🎟 (la Marina no atacará hoy)`, 'area');
      sfx('quest');
      return;
    }
    S.wave++;
    const lvl = Math.max(30, Math.min(98, p.level + S.wave));
    const n = S.wave === 4 ? 4 : 4 + S.wave * 2;
    for (let i = 0; i < n; i++) {
      for (let k = 0; k < 20; k++) {
        const x = S.cx - 8 + Math.floor(Math.random() * 16), z = S.cz - 4 + Math.floor(Math.random() * 8);
        if (this.W.walkable(x, z) && Math.hypot(x - p.x, z - p.z) > 3) { const e = this.spawnTemp('marine', x, z, lvl); e.provoked = true; e.state = 'chase'; S.temps.push(e); break; }
      }
    }
    if (S.wave === 4) { const e = this.spawnTemp('marine_boss', S.cx, S.cz + 3, lvl + 3); e.provoked = true; e.state = 'chase'; S.temps.push(e); }
    this.toast(S.wave === 4 ? '🎖 ¡El comodoro sale a defender la fortaleza!' : `🏰 Oleada ${S.wave}: ¡${n} marines!`, 'area');
  };

  // ============================================================ fiesta de boda
  const baseWedding = P.wedding;
  P.wedding = function (n, remoteName) {
    const r = baseWedding.call(this, n, remoteName);
    this.party = { t: 180, giftT: 3 };
    this.toast('🎉 ¡Fiesta de boda en la plaza! Los vecinos bailan y traen regalos', 'area');
    return r;
  };
  P.updateParty = function (dt) {
    const F = this.party;
    if (!F) return;
    F.t -= dt;
    const guests = this.npcs.filter((v) => !v.onShip && !v.fight && Math.hypot(v.x - 50, v.z - 53) < 7 && this.soc(v.id).f >= 10);
    for (const v of guests) v.st.dance = F.t > 0;
    if (Math.random() < dt * 1.5) this.ring(50 + (Math.random() - 0.5) * 8, 53 + (Math.random() - 0.5) * 8, 0.8, [0xffa0c0, 0xffe080, 0x9ad8ff][Math.floor(Math.random() * 3)]);
    F.giftT -= dt;
    if (F.giftT <= 0 && F.t > 0) {
      F.giftT = 6;
      const v = guests.find((g) => !this.soc(g.id).wedGift);
      if (v) {
        const s = this.soc(v.id); s.wedGift = true;
        const f = s.f || 0, gift = f >= 70 ? ['collar_perlas', 'perla', 'goldore'][Math.floor(Math.random() * 3)] : f >= 40 ? ['f_tarta', 'potion', 'silver'][Math.floor(Math.random() * 3)] : 'f_bread';
        const gold = Math.round(20 + f * 3);
        this.player.gold += gold; this.give(gift, 1);
        this.ui.float('🎁', 'gold', v.x, v.model.height + 0.5, v.z);
        this.toast(`🎁 ${v.name} os regala ${ITEMS[gift] ? ITEMS[gift].name : gift} y ${gold} oro`);
      }
    }
    if (F.t <= 0) { for (const v of this.npcs) { v.st.dance = false; this.soc(v.id).wedGift = false; } this.party = null; this.toast('🎉 Termina la fiesta. ¡Vivan los novios!'); }
  };

  // ============================================================ mascotas que luchan, con vida y niveles
  P.petLevel = function () { return Math.min(50, Math.floor(((this.petXp || {})[this.petType] || 0) / 40) + 1); };
  P.petStats = function () { const L = this.petLevel(); return { max: Math.round(50 + L * 30 + this.player.level * 5) }; };
  P.petTarget = function () {
    const o = this.petObj;
    if (!o || o.ko > 0 || this.sailing || !o.m.visible) return null;
    if (!o.isPet) { o.isPet = true; o.st = { moving: false }; o.dist = (q) => Math.hypot(q.x - o.x, q.z - o.z); }
    o.tx = Math.round(o.x); o.tz = Math.round(o.z);
    if (o.hp === undefined) o.hp = this.petStats().max;
    return o;
  };
  const baseTarget2 = P.enemyTarget;
  P.enemyTarget = function (e) {
    const t = baseTarget2.call(this, e);
    const pet = this.petTarget();
    if (pet && e.def && !e.def.famous && !e.def.boss && t && !t.isPet && e.dist(pet) * 1.3 < e.dist(t) && e.dist(pet) < 5) return pet;
    return t;
  };
  const baseHit = P.hitTarget;
  P.hitTarget = function (p, e, atk) {
    if (p && p.isPet) return this.hurtPet(atk, e);
    return baseHit.call(this, p, e, atk);
  };
  P.hurtPet = function (atk) {
    const o = this.petObj; if (!o || o.ko > 0) return;
    const max = this.petStats().max;
    const dmg = Math.max(1, Math.round(atk * (0.8 + Math.random() * 0.4) * 0.7));
    if (Math.random() < 0.2) { this.ui.float('Esquiva', 'info', o.x, 1.4, o.z); return; }
    o.hp -= dmg; o.hurtT = this.time;
    this.ui.float('-' + dmg, 'dmg', o.x, 1.3, o.z);
    if (o.hp <= 0) { o.hp = 0; o.ko = 40; o.m.visible = false; this.toast('🐾 Tu mascota ha caído y se esconde para recuperarse (40 s)'); }
    else if (o.hp < max * 0.3) this.ui.float('¡Ayuda!', 'chat', o.x, 1.6, o.z);
  };
  const basePet = P.updatePet;
  P.updatePet = function (dt) {
    const o = this.petObj;
    if (o && o.ko > 0) { o.ko -= dt; if (o.ko <= 0) { o.ko = 0; o.hp = Math.round(this.petStats().max * 0.5); this.toast('🐾 Tu mascota vuelve contigo'); } else return; }
    if (o && o.hp !== undefined && this.time - (o.hurtT || -99) > 6) o.hp = Math.min(this.petStats().max, o.hp + this.petStats().max * 0.03 * dt);
    const before = o ? o.cd : 0;
    basePet.call(this, dt);
    // cada ataque de la mascota la entrena
    if (o && before <= 0 && o.cd > 1) { this.petXp = this.petXp || {}; const L0 = this.petLevel(); this.petXp[this.petType] = (this.petXp[this.petType] || 0) + 1; if (this.petLevel() > L0) this.toast(`🐾 ¡Tu mascota sube al nivel ${this.petLevel()}!`); }
  };

  // ============================================================ peligros en el mar
  const ESC = { x: 204, z: -66 };
  P.updateSeaHazards = function (dt) {
    const b = this.boat;
    this.hz = this.hz || { pools: [], bergs: null, boltT: 4 };
    const H = this.hz;
    // icebergs alrededor de la Isla Escarcha
    if (!H.bergs) {
      H.bergs = [];
      const g = new THREE.Group();
      const ice = new THREE.MeshLambertMaterial({ color: 0xe8f6ff, transparent: true, opacity: 0.95 });
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2 + 0.2, r = 36 + (i % 3) * 5;
        const x = ESC.x + Math.cos(a) * r, z = ESC.z + Math.sin(a) * r;
        if (this.W.tileAll(Math.round(x), Math.round(z)) !== T.WATER) continue;
        const s = 1 + Math.random() * 1.2;
        const m = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), ice); m.position.set(x, s * 0.25, z); m.scale.y = 0.9; m.rotation.y = Math.random() * 6; g.add(m);
        H.bergs.push({ x, z, r: s + 1.4 });
      }
      this.scene.add(g);
    }
    if (!this.sailing || b.sinking) return;
    const host = !(this.net.isClient && this.net.active);
    for (const k of H.bergs) {
      const d = Math.hypot(b.x - k.x, b.z - k.z);
      if (d < k.r && Math.abs(b.speed) > 1.5 && this.time - (H.iceT || -9) > 1.5) {
        H.iceT = this.time;
        this.damageBoat(15 + Math.abs(b.speed) * 6, b.x, b.z);
        b.speed *= -0.3;
        this.toast('🧊 ¡Choque contra un iceberg!');
        this.camShake = 0.3;
      }
    }
    // remolinos en aguas profundas
    const deep = !(b.x > -20 && b.z > -20 && b.x < 170 && b.z < 160);
    if (host && deep) {
      H.poolT = (H.poolT ?? 40) - dt;
      if (H.poolT <= 0 && H.pools.length < 1) {
        H.poolT = 60 + Math.random() * 60;
        const a = Math.random() * Math.PI * 2, x = b.x + Math.sin(a) * 14, z = b.z + Math.cos(a) * 14;
        if (this.shipBlocked(x, z, 0) || this.shipBlocked(x, z, Math.PI / 2)) { H.poolT = 5; return; }
        const m = new THREE.Mesh(new THREE.RingGeometry(0.6, 5, 32, 1, 0, Math.PI * 1.7), new THREE.MeshBasicMaterial({ color: 0x0a3a6a, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false }));
        m.rotation.x = -Math.PI / 2; m.position.set(x, 0.05, z);
        for (let k = 0; k < 3; k++) { const f = new THREE.Mesh(new THREE.RingGeometry(1.2 + k * 1.3, 1.5 + k * 1.3, 32, 1, k, Math.PI * 1.3), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })); f.position.z = 0.02; m.add(f); }
        const eye = new THREE.Mesh(new THREE.CircleGeometry(1, 20), new THREE.MeshBasicMaterial({ color: 0x041828, transparent: true, opacity: 0.8, depthWrite: false })); eye.position.z = 0.01; m.add(eye);
        this.scene.add(m);
        H.pools.push({ x, z, m, t: 35 });
        this.toast('🌀 ¡Un remolino gigante! Aléjate o te arrastrará', 'area');
      }
    }
    for (let i = H.pools.length - 1; i >= 0; i--) {
      const w = H.pools[i];
      w.t -= dt; w.m.rotation.z += dt * 2.5;
      const dx = w.x - b.x, dz = w.z - b.z, d = Math.hypot(dx, dz);
      if (d < 9 && d > 0.5) { const k = (1 - d / 9) * 3.2 * dt, nx = b.x + (dx / d) * k, nz = b.z + (dz / d) * k; if (!this.shipBlocked(nx, nz, b.heading)) { b.x = nx; b.z = nz; } b.heading += dt * 0.6 * (1 - d / 9); }
      if (d < 2 && this.time - (w.hitT || -9) > 1) { w.hitT = this.time; this.damageBoat(12, b.x, b.z); }
      if (w.t <= 0 || d > 60) { this.scene.remove(w.m); H.pools.splice(i, 1); }
    }
    // rayos durante la tormenta
    if (host && this.weather === 'storm') {
      H.boltT -= dt;
      if (H.boltT <= 0) {
        H.boltT = 5 + Math.random() * 5;
        const x = b.x + (Math.random() - 0.5) * 5, z = b.z + (Math.random() - 0.5) * 5;
        this.ring(x, z, 2, 0xfff060);
        setTimeout(() => {
          this.ring(x, z, 2.6, 0xffffff);
          if (this.wx) this.wx.flash = 0.25;
          sfx('thunder');
          if (this.sailing && Math.hypot(this.boat.x - x, this.boat.z - z) < 2.6) { this.damageBoat(25, x, z); this.toast('⚡ ¡Un rayo cae sobre el barco!'); }
        }, 1100);
      }
    }
  };

  // ============================================================ enganches
  const baseDmg = P.damageEnemy;
  P.damageEnemy = function (e, dmg, crit, byCrew, killerId = 0) {
    const was = !e.dead;
    const r = baseDmg.call(this, e, dmg, crit, byCrew, killerId);
    if (was && e.dead && byCrew && byCrew.isNPC) { const s = this.soc(byCrew.id); s.kills = (s.kills || 0) + 1; if (e.def && e.def.boss) mem(this, byCrew, `Derroté a ${e.def.name}. ¡Que lo cuenten en todas las tabernas!`); }
    return r;
  };
  const baseKO = P.knockOut;
  P.knockOut = function (n) { const s = this.soc(n.id); s.kos = (s.kos || 0) + 1; if (s.kos === 1) mem(this, n, 'Caí en combate por primera vez... gracias por no dejarme atrás.'); return baseKO.call(this, n); };
  const baseExp = P.sendExplore;
  P.sendExplore = function (n, isle, lvl) { const s = this.soc(n.id); s.exps = (s.exps || 0) + 1; const name = isle === 'main' ? 'Isla Bruma' : ((this.islets.find((r) => r.id === isle) || {}).name || isle); mem(this, n, `Salí a explorar ${name}.`); return baseExp.call(this, n, isle, lvl); };
  const baseRecruit = P.recruit;
  P.recruit = function (n) { const r = baseRecruit.call(this, n); mem(this, n, 'Me uní a tu tripulación. ¡Empieza la aventura!'); return r; };
  P.npcDialog8 = function (id, opts) {
    if (id === 'lucas' && !this.isMarine()) opts.push({ label: `🏰 Asedio al Bastión${this.flags.siegeDay === this.day ? ' (hoy ya lo tomaste)' : ''}`, action: () => (this.flags.siegeDay === this.day ? this.toast('Ya habéis tomado el Bastión hoy') : this.siegeMenu()) });
    const s = this.soc(id);
    if (s.crew || s.partner) opts.push({ label: '📖 Diario y rango', action: () => this.crewDiary(this.npcById(id)) });
    return null;
  };
  P.updateMore8 = function (dt) {
    this.updateSiege(dt);
    this.updateParty(dt);
    this.updateSeaHazards(dt);
    for (const n of this.crew()) this.crewSkillTick(n, dt);
  };
  P.newsHtml8 = function () {
    return `<div class="sub">🆕 v3.6</div><ul class="qlist">
      <li>✨ <b>Habilidades de la tripulación</b>: corte veloz (espada), remolino (hacha), estocada (lanza) o curar (sanadoras como Ixa, Naira, Tomasa, Coral o Rosa). Suben de nivel al usarlas.</li>
      <li>🎽 <b>Dar equipo a mano</b>: en la Mochila, elige un arma o armadura y pulsa «Dar a tripulante».</li>
      <li>🎖 <b>Rangos</b>: Grumete, Marinero, Contramaestre y Primer oficial (habla con ellos › Diario y rango).</li>
      <li>🏰 <b>Asedio al Bastión</b>: habla con el Rebelde Lucas en Villa Grillete. 3 oleadas y el comodoro.</li>
      <li>🎉 <b>Fiesta de boda</b>: los vecinos bailan en la plaza y os traen regalos según vuestra amistad.</li>
      <li>🐾 <b>Mascotas con vida</b>: luchan, suben hasta nivel 50, los enemigos también les atacan y se esconden si caen.</li>
      <li>📖 <b>Diario de cada tripulante</b>: lo que piensa de ti, sus victorias y sus recuerdos.</li>
      <li>🌊 <b>Peligros del mar</b>: icebergs junto a Escarcha, remolinos en aguas profundas y rayos en las tormentas.</li></ul>`;
  };
}

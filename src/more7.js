// v3.5: la tripulación y la pareja tienen vida propia (los enemigos también les atacan), se desmayan, beben pociones,
// consiguen armadura explorando islas; órdenes a la tripulación; celos y rivales; hijo o aprendiz; enemigos que huyen
// y vuelven con refuerzos; mercado negro nocturno en Tortuga; carreras de monturas con apuestas; faros y viaje rápido.
import * as THREE from 'three';
import { crewGear, gearStats, EQUIP, ITEMS, oreDrop, TIER_NAMES } from './items.js';
import { RECRUITABLE, ROMANCE } from './social.js';

const ORDERS = { follow: '▶ Seguirme', attack: '⚔️ Atacar a mi objetivo', defend: '🛡 Defenderme', gather: '🪓 Recolectar', wait: '⏸ Esperar aquí' };
const RIVAL_LOOKS = [
  { name: 'Galán Rodrigo', look: { shirt: 0xf4f4f0, pants: 0x2a2a3a, coat: true, trim: 0xd8a838, hair: 0x1a1a1a, skin: 0xe0aa80, sword: true, blade: 0xe8e8f0, hat: 'tricorn', capColor: 0x8a1a2a, feather: 0xffffff } },
  { name: 'Dama Violeta', look: { shirt: 0x6a2a8a, pants: 0x2a1a3a, dress: true, dressColor: 0x8a3aa8, hair: 0x2a1a10, longHair: true, skin: 0xf3cfaa, sword: true, blade: 0xd8d8e8, earring: true } },
];
const CHILD_M = ['Bruno', 'Leo', 'Marcos', 'Iker', 'Dante'], CHILD_F = ['Lía', 'Nora', 'Alba', 'Vera', 'Mar'];
const RACE_PTS = [[50, 28], [24, 44], [30, 70], [50, 74], [72, 78], [50, 52]];

export function installMore7(Game, D) {
  const P = Game.prototype;
  const sfx = D.sfx;
  const comp = (g, n) => { const s = g.soc(n.id); return (s.crew || s.partner) && !s.role; };

  // ============================================================ vida propia de tripulación y pareja
  P.compLevel = function (n) { return Math.min(100, n.level + ((this.soc(n.id).gearB || 0) * 10)); };
  P.crewGearLevel = function (n) { return this.compLevel(n); };
  P.compStats = function (n) {
    const L = this.compLevel(n), key = n.level + ':' + L;
    if (n.cKey !== key) {
      const gs = gearStats(crewGear(L));
      const max = Math.round(60 + (n.level - 1) * 12 + gs.hp);
      n.cmax = max; n.cdef = gs.def; n.cKey = key;
      if (n.chp === undefined || n.chp > max) n.chp = max;
    }
  };
  P.companions = function () { return this.npcs.filter((n) => comp(this, n) && n.model.root.visible && !n.carried && this.carrying !== n); };
  // los enemigos eligen a quién atacar: a ti o a quien tengan más cerca (tripulación, pareja, otros jugadores)
  const baseTarget = P.enemyTarget;
  P.enemyTarget = function (e) {
    const best0 = baseTarget.call(this, e);
    if (e.def && (e.def.famous || e.def.super === 'leviathan')) return best0;
    if (e.lockT > this.time && e.lock && !e.lock.ko && comp(this, e.lock) && e.lock.model.root.visible) return e.lock;
    let best = best0 && !best0.dead ? best0 : null, bd = best ? e.dist(best) : Infinity;
    for (const n of this.companions()) {
      if (n.ko) continue;
      const d = e.dist(n) * 1.15;
      if (d < bd && d < 8) { bd = d; best = n; }
    }
    if (best && best.isNPC) { e.lock = best; e.lockT = this.time + 3; }
    return best || this.player;
  };
  // golpe de un enemigo a su objetivo (jugador, otro jugador o compañero)
  P.hitTarget = function (p, e, atk) {
    if (p.isRemote) this.net.hurtRemote(p.id, atk, e.idx);
    else if (p.isNPC) this.hurtCompanion(p, atk, e);
    else this.damagePlayer(e, atk);
  };
  P.hurtCompanion = function (n, atk, e) {
    if (n.ko) return;
    this.compStats(n);
    const s = this.soc(n.id);
    // también se defienden: bloquean a veces
    if (Math.random() < 0.12 + Math.min(0.1, n.level * 0.001)) {
      n.st.block = true; setTimeout(() => { n.st.block = false; }, 500);
      this.ui.float('¡Bloqueo!', 'info', n.x, n.model.height + 0.5, n.z);
      atk *= 0.3;
    }
    let dmg = Math.max(1, Math.round(atk * (0.8 + Math.random() * 0.4) * (40 / (40 + n.cdef)) * (this.enemyEspAtk ? this.enemyEspAtk(e) : 1)));
    n.chp -= dmg;
    n.lastHurt = this.time;
    n.st.flash = 0.18;
    this.ui.float('-' + dmg, 'dmg', n.x, n.model.height + 0.2, n.z);
    this.ui.setHp(n.label, Math.max(0, n.chp) / n.cmax);
    if (n.chp <= 0) this.knockOut(n);
    else if (s.partner && s.hand && n.chp < n.cmax * 0.35) { s.hand = false; this.ui.float('¡Me suelto para defenderme!', 'chat', n.x, n.model.height + 0.5, n.z); }
  };
  P.knockOut = function (n) {
    n.ko = 30; n.chp = 0; n.path = []; n.st.moving = false;
    const s = this.soc(n.id); s.hand = false;
    n.model.root.rotation.z = Math.PI / 2;
    this.ui.float('💫 ¡Desmayado!', 'crit', n.x, n.model.height + 0.6, n.z);
    this.toast(`💫 ¡${n.name} ha caído! Reanímale con una poción o espera 30 s`, 'area');
    for (const e of this.enemies) if (e.lock === n) { e.lock = null; e.lockT = 0; }
    sfx('hurt');
  };
  P.reviveComp = function (n, k = 0.5) {
    n.ko = 0; this.compStats(n); n.chp = Math.round(n.cmax * k);
    n.model.root.rotation.z = 0;
    this.ui.setHp(n.label, n.chp / n.cmax);
    this.ui.float('✨ ¡Vuelvo!', 'heal', n.x, n.model.height + 0.5, n.z);
  };
  P.koNear = function () { const p = this.player; return this.npcs.find((n) => n.ko > 0 && n.dist(p) < 1.9) || null; };
  P.reviveWithPotion = function (n) {
    const p = this.player;
    if ((p.inv.potion || 0) < 1) return this.toast('Necesitas una poción para reanimarle');
    p.inv.potion--; this.reviveComp(n, 0.6); sfx('level');
  };
  // la IA de los compañeros: se desmayan, se curan, beben poción, se retiran si van mal
  P.companionTick = function (n, dt) {
    const s = this.soc(n.id);
    if (!(s.crew || s.partner)) { if (n.ko) this.reviveComp(n, 1); return false; }
    this.compStats(n);
    n.label.el.classList.add('comp');
    if (n.ko > 0) {
      n.ko -= dt; n.path = []; n.st.moving = false;
      n.model.root.rotation.z = Math.PI / 2;
      n.model.root.position.set(n.x, 0.15, n.z);
      if (n.ko <= 0) this.reviveComp(n, 0.35);
      return true;
    }
    const t = this.time;
    if (n.chp < n.cmax && t - (n.lastHurt || -99) > 6) { n.chp = Math.min(n.cmax, n.chp + n.cmax * 0.03 * dt); this.ui.setHp(n.label, n.chp / n.cmax); }
    if (n.chp < n.cmax * 0.3 && (s.pots ?? 2) > 0 && t - (n.potT || -99) > 8) {
      s.pots = (s.pots ?? 2) - 1; n.potT = t;
      n.chp = Math.min(n.cmax, n.chp + n.cmax * 0.45);
      this.ui.float('+🍶', 'heal', n.x, n.model.height + 0.4, n.z);
      this.ui.setHp(n.label, n.chp / n.cmax);
    } else if (n.chp < n.cmax * 0.2 && !n.retreatT) {
      n.retreatT = 4; this.ui.float('¡Me retiro un momento!', 'chat', n.x, n.model.height + 0.5, n.z);
    }
    if (n.retreatT > 0) {
      n.retreatT -= dt;
      if (n.retreatT <= 0) n.retreatT = 0;
      const slot = this.followSlot ? this.followSlot(n) : { x: this.player.tx, z: this.player.tz };
      n.repathT = (n.repathT || 0) - dt;
      if (n.repathT <= 0) { n.repathT = 0.6; n.goTo(slot.x, slot.z, true, 1500); }
      n.stepMove(dt);
      return true;
    }
    return false;
  };

  // ============================================================ órdenes
  P.ordersMenu = function () {
    const cur = this.crewOrder || 'follow';
    this.ui.openDialog('📣 Órdenes a la tripulación', `Orden actual: ${ORDERS[cur]}`, [
      ...Object.entries(ORDERS).map(([k, label]) => ({ label: (k === cur ? '✔ ' : '') + label, action: () => this.setOrder(k) })),
      { label: 'Cerrar', action: null },
    ]);
  };
  P.setOrder = function (k) {
    this.crewOrder = k;
    for (const n of this.crew()) { const s = this.soc(n.id); if (s.role) continue; if (k === 'wait') { s.wait = true; n.home = { x: n.tx, z: n.tz }; } else s.wait = false; }
    this.toast(`📣 Orden: ${ORDERS[k]}`);
  };
  const baseFoe = P.crewFoe;
  P.crewFoe = function () {
    const o = this.crewOrder || 'follow', p = this.player;
    if (o === 'gather') return null;
    if (o === 'attack') {
      if (p.target && p.target.kind === 'enemy' && !p.target.ref.isNPC && !p.target.ref.dead) return p.target.ref;
      let best = null, bd = 12;
      for (const e of this.enemies) { if (e.dead || (e.hostile && !e.hostile())) continue; const d = e.dist(p); if (d < bd) { bd = d; best = e; } }
      return best;
    }
    if (o === 'defend') {
      let best = null, bd = 5;
      for (const e of this.enemies) { if (e.dead || e.state !== 'chase') continue; const d = e.dist(p); if (d < bd) { bd = d; best = e; } }
      return best;
    }
    // seguir: prioriza al enemigo que ataca a un compañero desmayándose
    const hurt = this.companions().find((n) => !n.ko && n.chp < n.cmax * 0.5);
    if (hurt) for (const e of this.enemies) if (!e.dead && e.lock === hurt && e.dist(p) < 10) return e;
    return baseFoe.call(this);
  };
  // recolectar: los tripulantes talan y pican cerca de ti
  P.crewGatherTick = function (n, dt) {
    if ((this.crewOrder || 'follow') !== 'gather' || !this.soc(n.id).crew) return false;
    const p = this.player;
    if (n.dist(p) > 14) return false;
    if (!n.gTgt || n.gTgt.down || Math.hypot(n.gTgt.x - p.x, n.gTgt.z - p.z) > 12) {
      n.gTgt = null; let bd = 12;
      for (const map of [this.treeMap, this.rockMap]) for (const o of map.values()) { if (o.down) continue; const d = Math.hypot(o.x - n.x, o.z - n.z); if (d < bd && Math.hypot(o.x - p.x, o.z - p.z) < 12) { bd = d; n.gTgt = o; n.gKind = map === this.treeMap ? 'wood' : 'stone'; } }
      if (!n.gTgt) return false;
    }
    const o = n.gTgt, d = Math.hypot(o.x - n.x, o.z - n.z);
    if (d > 1.6) { n.repathT = (n.repathT || 0) - dt; if (n.repathT <= 0) { n.repathT = 0.7; n.goTo(o.x, o.z, true, 1500, 1); } n.st.gather = 0; n.stepMove(dt); return true; }
    n.path = []; n.faceTo(o.x - n.x, o.z - n.z, dt);
    n.st.gather = 1; n.st.gatherPhase = Math.sin(this.time * 6) * 0.5;
    n.gT = (n.gT || 0) + dt;
    if (n.gT > 3.5) { n.gT = 0; this.give(n.gKind, 1, n.x, n.z); this.ui.float(n.gKind === 'wood' ? '+1 🪵' : '+1 🪨', 'gold', n.x, n.model.height + 0.3, n.z); }
    return true;
  };

  // ============================================================ expediciones (consiguen nivel, oro y armadura)
  P.isleLevel = function (r) { const L = r.spawns.map((s) => s.lvl ? s.lvl[1] : 0).filter((v) => v < 100); return L.length ? Math.max(...L) : 8; };
  P.exploreMenu = function (n) {
    const isles = this.islets.filter((r) => !r.ghost && r.spawns.length);
    this.ui.openDialog(`🧭 Expedición de ${n.name}`, `Nivel de ${n.name}: ${n.level}. Elige una isla: cuanto más peligrosa, mejor botín y más posibilidades de conseguir armadura, pero puede volver herido. Tarda 8 minutos.`, [
      { label: `🏝 Isla Bruma (Nv. 1-10)`, action: () => this.sendExplore(n, 'main', 10) },
      ...isles.map((r) => { const L = this.isleLevel(r); return { label: `${L > n.level + 10 ? '⚠️' : '🏝'} ${r.name} (Nv. ${L})`, action: () => this.sendExplore(n, r.id, L) }; }),
      { label: 'Cancelar', action: null },
    ]);
  };
  P.sendExplore = function (n, isle, lvl) {
    const s = this.soc(n.id);
    if (s.role === 'farm' && this.collectFarm) this.collectFarm(n);
    s.role = 'explore';
    s.explore = { isle, lvl, start: this.playtime, dur: 480 };
    n.model.root.visible = false;
    if (this.autoHelm === n.id) this.autoHelm = null;
    this.toast(`🧭 ${n.name} parte de expedición`);
    if (this.panels.open) this.panels.openBitacora('crew');
  };
  P.updateExplore = function () {
    this.exT = (this.exT || 0) - 1;
    for (const n of this.crew()) {
      const s = this.soc(n.id);
      if (s.role !== 'explore' || !s.explore || this.playtime < s.explore.start + s.explore.dur) continue;
      const E = s.explore; s.explore = null;
      const name = E.isle === 'main' ? 'Isla Bruma' : ((this.islets.find((r) => r.id === E.isle) || {}).name || E.isle);
      const risk = Math.max(0, (E.lvl - n.level) / 30);
      const hurt = Math.random() < Math.min(0.6, risk);
      const ups = hurt ? 1 : 1 + Math.floor(Math.random() * 3) + (E.lvl > n.level ? 1 : 0);
      for (let i = 0; i < ups && n.level < 100; i++) n.setStats(n.level + 1);
      s.lvl = n.level;
      const gold = Math.round((40 + E.lvl * 12) * (hurt ? 0.4 : 1) * (0.8 + Math.random() * 0.5));
      this.player.gold += gold;
      const mats = [];
      for (let i = 0; i < (hurt ? 2 : 5); i++) { const id = oreDrop(name) || ['wood', 'stone', 'iron', 'leather'][Math.floor(Math.random() * 4)]; this.give(id, 1); mats.push(ITEMS[id] ? ITEMS[id].icon : ''); }
      let armor = '';
      if (!hurt && Math.random() < 0.25 + Math.min(0.4, E.lvl / 200) && (s.gearB || 0) < 3) { s.gearB = (s.gearB || 0) + 1; armor = ' ¡y ha encontrado armadura mejor!'; }
      s.pots = Math.min(5, (s.pots ?? 2) + 2);
      n.cKey = null; this.compStats(n); n.chp = hurt ? Math.round(n.cmax * 0.3) : n.cmax;
      n.tier = -1; this.rebuildCrewLook(n);
      s.role = this.activeCrew().length >= 3 ? 'ship' : undefined;
      if (!s.role) { n.model.root.visible = true; this.placeNear(n, this.player.tx, this.player.tz); }
      this.toast(`🧭 ${n.name} vuelve de ${name}${hurt ? ' herido' : ''}: Nv. ${n.level}, +${gold} oro ${mats.join('')}${armor}`, 'area');
      sfx('quest');
    }
  };

  // ============================================================ celos y rivales
  const baseFriend = P.addFriend;
  P.addFriend = function (n, v, quiet) {
    const r = baseFriend.call(this, n, v, quiet);
    const pt = this.partner();
    if (v > 0 && pt && n !== pt && ROMANCE.has(n.id) && this.soc(n.id).f >= 50 && !this.soc(n.id).crew) {
      const ps = this.soc(pt.id);
      ps.jeal = (ps.jeal || 0) + 1;
      if (ps.jeal >= 3) {
        ps.jeal = 0;
        baseFriend.call(this, pt, -6, true);
        this.toast(`💢 ${pt.name} tiene celos: pasas mucho tiempo con ${n.name}`, 'area');
      }
    }
    return r;
  };
  P.updateRival = function (dt) {
    const pt = this.partner(), p = this.player;
    if (!pt || this.sailing || this.boarding || this.rival || p.dead || this.roomAt(p.x, p.z)) return;
    this.rivalT = (this.rivalT ?? 400) - dt;
    if (this.rivalT > 0) return;
    this.rivalT = 600 + Math.random() * 400;
    if (Math.random() > 0.5) return;
    const R = RIVAL_LOOKS[Math.floor(Math.random() * RIVAL_LOOKS.length)];
    let sp = null;
    for (let i = 0; i < 30 && !sp; i++) { const x = p.tx + Math.round((Math.random() - 0.5) * 6), z = p.tz + Math.round((Math.random() - 0.5) * 6); if (this.W.walkable(x, z) && Math.hypot(x - p.x, z - p.z) > 1.5) sp = { x, z }; }
    if (!sp) return;
    const n = new D.NPC(this, { id: 'rival', name: R.name, x: sp.x, z: sp.z, wander: 0, look: R.look });
    n.baseLevel = Math.min(100, p.level + 2); n.setStats(n.baseLevel);
    this.npcs.push(n);
    this.rival = n;
    this.ui.openDialog(R.name, `¡Eh, tú! ${pt.name} se merece a alguien mejor que tú. Te reto a un duelo: si gano, que lo sepa todo el puerto.`, [
      { label: '⚔️ Aceptar el duelo', action: () => this.startFight(n, 'duel') },
      { label: 'Ignorarle', action: () => { baseFriend.call(this, pt, -3, true); this.toast(`😒 ${pt.name} esperaba que defendieras vuestro amor`); this.removeRival(); } },
    ]);
    sfx('quest');
  };
  P.removeRival = function () {
    const n = this.rival; if (!n) return;
    this.rival = null;
    setTimeout(() => { this.scene.remove(n.model.root); n.label.el.remove(); const i = this.npcs.indexOf(n); if (i >= 0) this.npcs.splice(i, 1); }, 2500);
  };
  const baseEnd = P.endFight;
  P.endFight = function (n, result) {
    const isRival = n && n.id === 'rival' && n.fight;
    const r = baseEnd.call(this, n, result);
    if (isRival) {
      const pt = this.partner();
      if (pt) {
        if (result === 'win') { baseFriend.call(this, pt, 8, true); this.toast(`💖 ¡Has vencido a ${n.name}! ${pt.name} está muy orgulloso/a de ti`, 'area'); }
        else { baseFriend.call(this, pt, -6, true); this.toast(`💔 ${n.name} te ha ganado... ${pt.name} se ha quedado preocupado/a`); }
      }
      this.removeRival();
    }
    return r;
  };

  // ============================================================ hijo o aprendiz
  P.updateChild = function () {
    const pt = this.partner();
    if (!this.child && pt && this.soc(pt.id).married) {
      if (this.childDay === undefined) this.childDay = this.day + 2;
      if (this.day >= this.childDay) {
        const female = Math.random() < 0.5;
        const list = female ? CHILD_F : CHILD_M;
        this.child = { name: list[Math.floor(Math.random() * list.length)], female, born: this.day };
        this.soc('hijo').f = 80;
        this.toast(`👶 ¡${this.child.name} ha llegado a vuestra familia! Vive en Villarroca y crecerá cada día`, 'area');
        sfx('level');
      }
    }
    if (!this.child) return;
    RECRUITABLE.add('hijo');
    let n = this.npcById('hijo');
    const lvl = Math.min(100, 1 + (this.day - this.child.born) * 4);
    if (!n) {
      const ap = this.player.ap || {};
      n = new D.NPC(this, { id: 'hijo', name: `${this.child.name} (${this.child.female ? 'hija' : 'hijo'})`, x: 52, z: 50, wander: 3, small: true, look: { shirt: 0x5a8ad8, pants: 0x3a3a4a, hair: [0x1a1a1a, 0x6a3a1a, 0xd8a040, 0xb04a2a][ap.hairColor % 4 || 0], longHair: this.child.female, skin: 0xf0c49a, female: this.child.female } });
      n.baseLevel = lvl; n.setStats(lvl);
      const s = this.soc('hijo');
      if (s.lvl && s.lvl > lvl) n.setStats(s.lvl);
      this.npcs.push(n);
    } else if (n.level < lvl && !this.soc('hijo').crew) { n.setStats(lvl); n.baseLevel = lvl; }
  };

  // ============================================================ enemigos que huyen y vuelven con refuerzos
  P.updateFlee = function (dt) {
    if (this.net.isClient && this.net.active) return;
    const p = this.player;
    for (const e of this.enemies) {
      if (e.dead || e.removed || !e.def || e.def.boss || e.def.famous || e.def.super || e.def.speed === 0) continue;
      if (e.state === 'flee') {
        e.fleeT -= dt;
        if (e.dist(p) > 13 || e.fleeT <= 0) {
          e.state = 'chase'; e.thinkT = 0;
          if (e.dist(p) > 13 && !e.called) {
            e.called = true;
            e.hp = Math.round(e.maxHp * 0.5); this.ui.setHp(e.label, 0.5);
            let n = 0;
            for (let i = 0; i < 12 && n < 2; i++) { const x = Math.round(e.x + (Math.random() - 0.5) * 4), z = Math.round(e.z + (Math.random() - 0.5) * 4); if (this.W.walkable(x, z)) { const t = this.spawnTemp(e.type, x, z, e.level); t.state = 'chase'; t.provoked = true; n++; } }
            if (n) this.toast(`📢 ¡El ${e.def.name.toLowerCase()} ha vuelto con refuerzos!`);
          }
        }
        continue;
      }
      if (e.state === 'chase' && !e.fleeRoll && e.hp < e.maxHp * 0.2 && e.hp > 0) {
        e.fleeRoll = true;
        if (Math.random() < 0.3) {
          e.state = 'flee'; e.fleeT = 7;
          const ang = Math.atan2(e.x - p.x, e.z - p.z);
          for (let r = 12; r >= 4; r -= 2) { const x = Math.round(e.x + Math.sin(ang) * r), z = Math.round(e.z + Math.cos(ang) * r); if (this.W.walkable(x, z)) { e.goTo(x, z, false, 2000); break; } }
          this.ui.float('¡Socorro!', 'chat', e.x, e.model.height + 0.5, e.z);
        }
      }
    }
  };

  // ============================================================ mercado negro de Tortuga (de noche)
  P.updateBlackMarket = function () {
    const night = this.tod >= 20 || this.tod < 5;
    const R = this.islets.find((r) => r.id === 'tortuga');
    if (!R) return;
    if (night && !this.sombra) {
      let sp = null; const { x: cx, z: cz } = R.center;
      for (let i = 0; i < 40 && !sp; i++) { const x = cx + Math.round((Math.random() - 0.5) * 10), z = cz + Math.round((Math.random() - 0.5) * 10); if (R.walkable(x, z)) sp = { x, z }; }
      if (!sp) return;
      const n = new D.NPC(this, { id: 'sombra', name: 'Contrabandista Sombra', x: sp.x, z: sp.z, wander: 1, look: { shirt: 0x1a1a1a, pants: 0x1a1a1a, coat: true, cape: 0x1a1a2a, hat: 'hood', hatColor: 0x1a1a1a, skin: 0xc68a5a, hair: 0x1a1a1a, scarf: 0x6a1a1a, sword: true, blade: 0x8a8a9a } });
      n.baseLevel = 60; n.setStats(60);
      this.npcs.push(n); this.sombra = n;
    } else if (!night && this.sombra) {
      const n = this.sombra; this.sombra = null;
      this.scene.remove(n.model.root); n.label.el.remove(); const i = this.npcs.indexOf(n); if (i >= 0) this.npcs.splice(i, 1);
    }
  };
  P.blackMarket = function () {
    const sell = (id, price) => ({ label: `${ITEMS[id].icon} ${ITEMS[id].name} (${price} oro)`, action: () => this.buy({ gold: price }, () => { this.give(id, 1); this.blackMarket(); }) });
    const C = this.smuggle;
    const opts = [sell('huevo_dragon', 6500), { label: '🗺️ Mapa del tesoro (450 oro)', action: () => this.buy({ gold: 450 }, () => { this.addTreasureMap(); this.blackMarket(); }) }, sell('meteorito', 380), sell('hechizo_fuego', 220), sell('muneco_vudu', 330)];
    if (!C) opts.push({ label: '📦 Trabajo de contrabando', action: () => this.startSmuggle() });
    else opts.push({ label: `📦 Lleva la caja a ${C.name} antes del día ${C.until}`, action: null });
    opts.push({ label: 'Desaparecer', action: null });
    this.ui.openDialog('🌙 Contrabandista Sombra', 'Psst... lo que la Marina no quiere que tengas. Solo de noche, solo aquí.', opts);
  };
  P.startSmuggle = function () {
    const docks = this.docks.filter((d) => d.id !== 'tortuga');
    const d = docks[Math.floor(Math.random() * docks.length)];
    this.smuggle = { dock: d.id, name: d.name, until: this.day + 1, reward: 1200 + Math.floor(Math.random() * 800) };
    this.player.inv.caja_contrabando = 1;
    this.toast(`📦 Lleva la caja de contrabando a ${d.name} y atraca allí (hasta el día ${this.smuggle.until})`, 'area');
  };
  const baseDock = P.dock;
  P.dock = function (d) {
    const r = baseDock.call(this, d);
    const C = this.smuggle;
    if (C && d && d.id === C.dock) {
      this.smuggle = null; this.player.inv.caja_contrabando = 0;
      if (this.day <= C.until) { this.player.gold += C.reward; this.addBounty(250, 'smuggle'); this.toast(`📦 ¡Contrabando entregado! +${C.reward} oro (la Marina sube tu recompensa)`, 'area'); sfx('coin'); }
      else this.toast('📦 Llegas tarde: el comprador ya se fue');
    }
    return r;
  };

  // ============================================================ carreras de monturas
  P.mountRaceMenu = function () {
    if (!this.mounted) return this.toast('🏇 Monta en tu montura para correr');
    this.ui.openDialog('🏇 Carrera de monturas', 'Recorre las 6 banderas de Isla Bruma antes que los jinetes rivales. ¿Cuánto apuestas?', [
      ...[100, 500, 2000].map((b) => ({ label: `💰 Apostar ${b} oro`, action: () => this.buy({ gold: b }, () => this.startMountRace(b)) })),
      { label: 'Ahora no', action: null },
    ]);
  };
  P.startMountRace = function (bet) {
    const p = this.player;
    const pts = RACE_PTS.map(([x, z]) => { for (let r = 0; r < 4; r++) for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) if (this.W.walkable(x + dx, z + dz)) return { x: x + dx, z: z + dz }; return { x, z }; });
    let dist = Math.hypot(pts[0].x - p.x, pts[0].z - p.z);
    for (let i = 1; i < pts.length; i++) dist += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
    const sp = 5.6 * this.mountSpeed() * 0.9;
    const rivals = ['Jinete Lope', 'Amazona Kira', 'Vaquero Tobías'].map((name) => ({ name, t: Math.round((dist / sp) * (1.3 + Math.random() * 0.45)) }));
    this.mrace = { pts, i: 0, t: 0, bet, rivals, ringT: 0 };
    this.toast('🏇 ¡Ya! Sigue los anillos verdes', 'area');
    sfx('quest');
  };
  P.updateMountRace = function (dt) {
    const R = this.mrace; if (!R) return;
    const p = this.player, el = document.getElementById('eventBanner');
    R.t += dt;
    if (!this.mounted || p.dead || this.sailing) { this.mrace = null; if (el) el.classList.add('hidden'); return this.toast('🏇 Descalificado: tienes que ir montado'); }
    const c = R.pts[R.i];
    R.ringT -= dt; if (R.ringT <= 0) { R.ringT = 0.7; this.ring(c.x, c.z, 1.6, 0x2ad84a); }
    if (el) { el.classList.remove('hidden'); el.textContent = `🏇 Carrera · bandera ${R.i + 1}/${R.pts.length} · ${R.t.toFixed(1)} s`; }
    if (Math.hypot(p.x - c.x, p.z - c.z) < 2.6) {
      R.i++; sfx('coin');
      if (R.i >= R.pts.length) {
        this.mrace = null; if (el) el.classList.add('hidden');
        const best = Math.min(...R.rivals.map((r) => r.t));
        const tab = [...R.rivals, { name: p.name, t: Math.round(R.t), me: true }].sort((a, b) => a.t - b.t);
        const win = R.t <= best;
        if (win) { p.gold += R.bet * 3; this.stats.mraces = (this.stats.mraces || 0) + 1; }
        this.ui.openDialog('🏇 Resultado', tab.map((r, i) => `${i + 1}. ${r.name} · ${r.t} s`).join('<br>') + `<br><br>${win ? `¡Has ganado! +${R.bet * 3} oro` : 'Has perdido la apuesta...'}`, [{ label: 'Vale', action: null }]);
        sfx(win ? 'quest' : 'hurt');
      }
    }
  };

  // ============================================================ faros y viaje rápido
  P.lighthouseInit = function () {
    if (this.faros) return;
    this.faros = [];
    for (const d of this.docks) {
      if (!d.land) continue;
      let sp = null;
      for (let r = 2; r <= 5 && !sp; r++) for (let a = 0; a < 12 && !sp; a++) { const x = Math.round(d.land.x + Math.cos(a / 12 * Math.PI * 2) * r), z = Math.round(d.land.z + Math.sin(a / 12 * Math.PI * 2) * r); if (this.W.walkable(x, z)) sp = { x, z }; }
      if (!sp) continue;
      const g = new THREE.Group();
      const M = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
      const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.45, 2.4, 10), M(0xf4f0e8)); t1.position.y = 1.2; g.add(t1);
      for (let i = 0; i < 2; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.36 - i * 0.05, 0.4 - i * 0.05, 0.35, 10), M(0xc83a2a)); b.position.y = 0.6 + i * 1.1; g.add(b); }
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), new THREE.MeshLambertMaterial({ color: 0x5a5a5a, emissive: 0x000000 })); lamp.position.y = 2.65; g.add(lamp);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.4, 10), M(0x2a2a2a)); roof.position.y = 3.05; g.add(roof);
      g.position.set(sp.x, 0, sp.z);
      this.scene.add(g);
      this.W.setBlocked(sp.x, sp.z, 1);
      const f = { dock: d, x: sp.x, z: sp.z, lamp };
      this.faros.push(f);
      this.setFaroLit(f, !!this.flags['faro_' + d.id]);
    }
  };
  P.setFaroLit = function (f, on) { f.lamp.material.color.set(on ? 0xfff0a0 : 0x5a5a5a); f.lamp.material.emissive.set(on ? 0xffc040 : 0x000000); };
  P.faroNear = function () { const p = this.player; return (this.faros || []).find((f) => Math.hypot(f.x - p.x, f.z - p.z) < 2.2) || null; };
  P.faroAction = function (f) {
    const lit = !!this.flags['faro_' + f.dock.id];
    if (lit) return this.travelMenu();
    const p = this.player;
    if ((p.inv.wood || 0) < 10 || (p.inv.iron || 0) < 2) return this.toast('🗼 Para encender el faro necesitas 10 de madera y 2 de hierro');
    p.inv.wood -= 10; p.inv.iron -= 2;
    this.flags['faro_' + f.dock.id] = true; this.setFaroLit(f, true);
    this.toast(`🗼 ¡Faro de ${f.dock.name} encendido! Ya puedes viajar aquí desde ⚡ Atajos › Viajar`, 'area');
    sfx('level');
  };
  P.travelMenu = function () {
    const lit = (this.faros || []).filter((f) => this.flags['faro_' + f.dock.id]);
    if (!lit.length) return this.toast('🗼 Enciende faros en los muelles (10 madera + 2 hierro) para viajar rápido');
    this.ui.openDialog('🗼 Viaje rápido', 'Viaja en tu barco hasta un faro encendido (50 oro).', [
      ...lit.map((f) => ({ label: `⛵ ${f.dock.name}`, action: () => this.fastTravel(f.dock) })),
      { label: 'Cancelar', action: null },
    ]);
  };
  P.fastTravel = function (d) {
    const p = this.player;
    if (this.boarding || this.time - (p.lastCombat || -99) < 5 || this.inDungeon() || this.roomAt(p.x, p.z)) return this.toast('No puedes viajar ahora');
    this.buy({ gold: 50 }, () => {
      if (this.sailing) { this.boat.x = d.shipX; this.boat.z = d.shipZ; this.dock(d); return; }
      const b = this.boat;
      Object.assign(b, { x: d.shipX, z: d.shipZ, heading: d.heading || 0, docked: d.id, speed: 0 });
      p.x = d.land.x; p.z = d.land.z; p.path = []; p.target = null;
      this.camTarget.set(p.x, 0, p.z);
      this.unboardCrew(p.x, p.z);
      for (const n of this.following()) this.placeNear(n, p.tx, p.tz);
      this.toast(`⛵ Llegas a ${d.name}`, 'area');
    });
  };

  // ============================================================ diálogos y acciones
  P.npcDialog7 = function (id, opts) {
    if (id === 'sombra') { opts.push({ label: '🌙 Ver la mercancía', action: () => this.blackMarket() }); return 'Psst... no me has visto. ¿Buscas algo que la Marina no quiere que tengas?'; }
    if (id === 'lucia' || id === 'zaid' || id === 'helga') opts.push({ label: '🏇 Carrera de monturas (apuestas)', action: () => this.mountRaceMenu() });
    if (id === 'hijo' && this.child) return this.soc('hijo').crew ? '¡Lucharé a tu lado!' : `¡Hola! Ya tengo nivel ${this.npcById('hijo').level}. ${this.npcById('hijo').level >= 10 ? '¿Me dejas unirme a tu tripulación?' : 'Cuando llegue al nivel 10 podré acompañarte.'}`;
    return null;
  };
  P.contextAction7 = function () {
    if (this.sailing) return null;
    const ko = this.koNear();
    if (ko) return { icon: '🍶', label: 'Reanimar', fn: () => this.reviveWithPotion(ko) };
    const f = this.faroNear();
    if (f) return { icon: '🗼', label: this.flags['faro_' + f.dock.id] ? 'Viajar' : 'Faro', fn: () => this.faroAction(f) };
    return null;
  };
  P.updateMore7 = function (dt) {
    this.lighthouseInit();
    this.updateFlee(dt);
    this.updateRival(dt);
    this.updateMountRace(dt);
    this.m7T = (this.m7T || 0) - dt;
    if (this.m7T <= 0) { this.m7T = 1; this.updateExplore(); this.updateChild(); this.updateBlackMarket(); }
  };
  P.newsHtml7 = function () {
    return `<div class="sub">🆕 v3.5</div><ul class="qlist">
      <li>❤️ <b>Tripulación y pareja con vida propia</b>: los enemigos también les atacan. Tienen la vida de un jugador de su nivel, bloquean, beben pociones, se retiran si van mal y se desmayan (reanímales con una poción). Puedes darles pociones como regalo.</li>
      <li>🧭 <b>Expediciones</b>: Bitácora › Tripulación › Explorar. Vuelven con nivel, oro, materiales y a veces armadura mejor.</li>
      <li>📣 <b>Órdenes</b> (⚡ Atajos): seguir, atacar a tu objetivo, defenderte, recolectar o esperar. Orden actual: ${ORDERS[this.crewOrder || 'follow']}.</li>
      <li>💢 <b>Celos y rivales</b>: si coqueteas con otros, tu pareja se pone celosa; a veces aparece un rival que te reta a duelo.</li>
      <li>👶 <b>Hijo o hija</b> tras casarte: vive en Villarroca, crece cada día y a nivel 10 puede unirse a tu tripulación.${this.child ? ` (${this.child.name})` : ''}</li>
      <li>📢 <b>Enemigos que huyen</b> a poca vida y pueden volver con refuerzos.</li>
      <li>🌙 <b>Mercado negro</b> en Isla Tortuga de noche (20:00-5:00): objetos raros y trabajos de contrabando.</li>
      <li>🏇 <b>Carreras de monturas</b> con apuestas (Lucía, Zaid o Helga).</li>
      <li>🗼 <b>Faros</b> junto a cada muelle: enciéndelos (10 madera + 2 hierro) y viaja rápido desde ⚡ Atajos › Viajar.</li></ul>`;
  };
  // regalar pociones a la tripulación
  const baseGift = P.giveGift;
  P.giveGift = function (n, id) {
    const s = this.soc(n.id);
    if (id === 'potion' && (s.crew || s.partner) && this.player.inv.potion > 0) {
      this.player.inv.potion--; s.pots = Math.min(9, (s.pots ?? 2) + 1);
      this.toast(`🍶 ${n.name} guarda la poción (tiene ${s.pots})`);
      return;
    }
    return baseGift.call(this, n, id);
  };
}

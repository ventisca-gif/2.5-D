// v3.4: romper con la pareja, formación de la tripulación (ya no se amontonan), defensas de los enemigos
// según su tipo y NPCs que se defienden y usan técnicas en los duelos.
import * as THREE from 'three';

// cómo se defiende cada tipo de enemigo
const SWORD = new Set(['skeleton', 'pirate', 'marine', 'marine_boss', 'galleta', 'merfolk', 'boss', 'crypt_king', 'ghost_captain', 'serafin', 'abyss_queen', 'reina_hielo', 'rey_pastel']);
const BEAST = new Set(['wolf', 'lobo_nieve', 'tiger', 'boar']);
const SHELL = new Set(['crab', 'cangrejo_burbuja', 'scorpion']);
const STONE = new Set(['golem', 'golem_obs', 'golem_boss', 'yeti', 'automata', 'gran_automata', 'dragon']);
const FLYER = new Set(['bat', 'skull', 'jelly']);
export function defenseKind(type) {
  if (SWORD.has(type) || type.startsWith('famous_')) return 'parry';
  if (BEAST.has(type)) return 'dodge';
  if (SHELL.has(type)) return 'shell';
  if (STONE.has(type)) return 'stone';
  if (FLYER.has(type)) return 'evade';
  return null;
}
export const DEF_INFO = {
  parry: '⚔️ Para tus golpes con el arma (y si para dos seguidos, contraataca) y bebe una poción a poca vida',
  dodge: '💨 Esquiva saltando hacia atrás',
  shell: '🐚 Se esconde en el caparazón a media vida (aguanta mucho más)',
  stone: '🪨 Si le golpeas muy seguido endurece la piel unos segundos',
  evade: '🌀 Revolotea y esquiva a menudo',
};
// formación detrás del capitán: [lateral, atrás]
const SLOTS = [[-1, -1], [1, -1], [0, -2], [-2, -2], [2, -2], [-1, -3], [1, -3], [0, -4], [-2, -4], [2, -4]];

export function installMore6(Game, D) {
  const P = Game.prototype;
  const sfx = D.sfx;

  // ============================================================ romper con la pareja
  P.breakUp = function (n) {
    const s = this.soc(n.id);
    const married = !!s.married;
    this.ui.openDialog('💔 Romper la relación', `¿Seguro que quieres ${married ? 'divorciarte de' : 'dejar a'} ${n.name}? Vuestra amistad bajará y no querrá volver contigo en 7 días. Podrás tener otra pareja.`, [
      { label: married ? '💔 Sí, divorciarnos' : '💔 Sí, romper', action: () => {
        if (this.carrying === n && this.toggleCarry) this.toggleCarry(n);
        s.partner = false; s.hand = false; s.married = false;
        s.f = Math.min(s.f || 0, 40);
        s.exDay = this.day;
        this.loveData = null;
        this.stats.breakups = (this.stats.breakups || 0) + 1;
        n.st.kiss = false;
        this.ui.openDialog(n.name, married ? 'Si es lo que quieres... Te devuelvo el anillo. Espero que encuentres lo que buscas.' : 'Vaya... no me lo esperaba. Está bien, cada uno por su lado.', [{ label: '...', action: null }]);
        this.toast(`💔 Ya no eres pareja de ${n.name}`);
        sfx('hurt');
      } },
      { label: 'No, me lo pienso', action: null },
    ]);
  };
  P.canConfess = function (n) { const s = this.soc(n.id); return !(s.exDay !== undefined && this.day - s.exDay < 7); };

  // ============================================================ formación de los que te siguen
  P.followSlot = function (n) {
    const p = this.player;
    const list = this.following().filter((k) => !(this.soc(k.id).partner && this.soc(k.id).hand));
    const i = Math.max(0, list.indexOf(n));
    const [sx, sz] = SLOTS[i % SLOTS.length];
    const f = p.face, fx = Math.sin(f), fz = Math.cos(f), rx = Math.cos(f), rz = -Math.sin(f);
    const tx = Math.round(p.x + rx * sx + fx * sz), tz = Math.round(p.z + rz * sx + fz * sz);
    if (this.W.walkable(tx, tz)) return { x: tx, z: tz };
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) if (this.W.walkable(tx + dx, tz + dz)) return { x: tx + dx, z: tz + dz };
    return { x: p.tx, z: p.tz };
  };
  // separa a los que se pisan (tripulación, pareja y tú)
  P.separateFollowers = function (dt) {
    const p = this.player;
    const list = this.npcs.filter((n) => { const s = this.soc(n.id); return (s.crew || s.partner) && !s.role && n.model.root.visible && !n.fight && !n.carried && this.carrying !== n; });
    for (let i = 0; i < list.length; i++) {
      const a = list[i], sa = this.soc(a.id);
      if (sa.partner && sa.hand) continue;
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j], sb = this.soc(b.id);
        if (sb.partner && sb.hand) continue;
        const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
        if (d < 0.75) {
          const k = (0.75 - d) * Math.min(1, dt * 6) / 2, ux = d > 0.01 ? dx / d : Math.cos(i + j), uz = d > 0.01 ? dz / d : Math.sin(i + j);
          if (this.W.walkable(Math.round(a.x - ux * k), Math.round(a.z - uz * k))) { a.x -= ux * k; a.z -= uz * k; }
          if (this.W.walkable(Math.round(b.x + ux * k), Math.round(b.z + uz * k))) { b.x += ux * k; b.z += uz * k; }
        }
      }
      const dx = a.x - p.x, dz = a.z - p.z, d = Math.hypot(dx, dz);
      if (d < 0.6 && !p.dead) { const k = (0.6 - d) * Math.min(1, dt * 6), ux = d > 0.01 ? dx / d : 1, uz = d > 0.01 ? dz / d : 0; if (this.W.walkable(Math.round(a.x + ux * k), Math.round(a.z + uz * k))) { a.x += ux * k; a.z += uz * k; } }
    }
  };

  // ============================================================ defensas de los enemigos
  P.enemyDefend = function (e, dmg, byCrew) {
    if (e.dead || e.isRemote || !e.def || e.def.famous) return dmg; // los famosos ya tienen su propia IA
    const k = e.defK === undefined ? (e.defK = defenseKind(e.type)) : e.defK;
    if (!k) return dmg;
    const t = this.time;
    e.hitTimes = (e.hitTimes || []).filter((h) => t - h < 2.5); e.hitTimes.push(t);
    if (k === 'parry') {
      if ((e.blockT || 0) > t) { this.ui.float('¡Bloqueo!', 'info', e.x, e.model.height + 0.5, e.z); return Math.max(1, Math.round(dmg * 0.3)); }
      if (Math.random() < (e.def.boss ? 0.14 : 0.18)) {
        e.blockT = t + 0.6; e.st.block = true; setTimeout(() => { e.st.block = false; }, 600);
        e.parries = (e.parries || 0) + 1;
        this.ui.float('¡Bloqueo!', 'info', e.x, e.model.height + 0.5, e.z);
        sfx('hit');
        if (e.parries >= 2 && !byCrew) {
          e.parries = 0;
          const p = this.player;
          setTimeout(() => { if (!e.dead && !p.dead && e.dist(p) < 2.2) { e.faceTo(p.x - e.x, p.z - e.z, 1); e.st.attackT = 0.32; this.slash(e, 0xff5a5a); this.ui.float('¡Contraataque!', 'crit', e.x, e.model.height + 0.6, e.z); this.damagePlayer(e, e.atk * 0.9); } }, 250);
        }
        return Math.max(1, Math.round(dmg * 0.3));
      }
      e.parries = 0;
      if (!e.potion && e.hp - dmg < e.maxHp * 0.3 && e.hp - dmg > 0 && !e.def.boss) {
        e.potion = true;
        setTimeout(() => { if (e.dead) return; const h = Math.round(e.maxHp * 0.25); e.hp = Math.min(e.maxHp, e.hp + h); this.ui.setHp(e.label, e.hp / e.maxHp); this.ui.float('+' + h + ' 🍶', 'heal', e.x, e.model.height + 0.4, e.z); }, 500);
      }
    } else if (k === 'dodge' || k === 'evade') {
      if ((e.dodgeCd || 0) < t && Math.random() < (k === 'evade' ? 0.22 : 0.15)) {
        e.dodgeCd = t + 2.5;
        const p = this.player, d = 1.6;
        const ang = Math.atan2(e.x - p.x, e.z - p.z) + (Math.random() - 0.5) * 1.4;
        const nx = e.x + Math.sin(ang) * d, nz = e.z + Math.cos(ang) * d;
        if (this.W.walkable(Math.round(nx), Math.round(nz))) { e.x = nx; e.z = nz; e.path = []; }
        this.ui.float('Esquiva', 'info', e.x, e.model.height + 0.4, e.z);
        return 0;
      }
    } else if (k === 'shell') {
      if ((e.shellT || 0) > t) { this.ui.float('🐚', 'info', e.x, e.model.height + 0.4, e.z); return Math.max(1, Math.round(dmg * 0.35)); }
      if (e.hp - dmg < e.maxHp * 0.5 && (e.shellCd || 0) < t) {
        e.shellCd = t + 14; e.shellT = t + 3; e.stunT = 3; e.st.block = true; setTimeout(() => { e.st.block = false; }, 3000);
        this.ui.float('¡Se esconde en su caparazón!', 'info', e.x, e.model.height + 0.6, e.z);
        return Math.max(1, Math.round(dmg * 0.35));
      }
    } else if (k === 'stone') {
      if ((e.stoneT || 0) > t) return Math.max(1, Math.round(dmg * 0.5));
      if (e.hitTimes.length >= 4 && (e.stoneCd || 0) < t) {
        e.stoneCd = t + 15; e.stoneT = t + 4;
        this.ui.float('¡Piel de piedra!', 'info', e.x, e.model.height + 0.6, e.z);
        this.ring(e.x, e.z, 1.2, 0x9a9a9a);
        const mats = []; e.model.root.traverse((o) => { if (o.isMesh && o.material && o.material.emissive) mats.push(o.material); });
        for (const m of mats) m.emissive.setHex(0x3a3a3a);
        setTimeout(() => { for (const m of mats) m.emissive.setHex(0x000000); }, 4000);
        return Math.max(1, Math.round(dmg * 0.5));
      }
    }
    return dmg;
  };

  // ============================================================ NPCs que se defienden en duelos y peleas
  P.npcDefend = function (n, dmg) {
    const t = this.time;
    if ((n.blockT || 0) > t) { this.ui.float('¡Bloqueo!', 'info', n.x, n.model.height + 0.5, n.z); return Math.max(1, Math.round(dmg * 0.3)); }
    const r = Math.random();
    if (r < 0.16) {
      n.blockT = t + 0.6; n.st.block = true; setTimeout(() => { n.st.block = false; }, 600);
      this.ui.float('¡Bloqueo!', 'info', n.x, n.model.height + 0.5, n.z);
      sfx('hit');
      return Math.max(1, Math.round(dmg * 0.3));
    }
    if (r < 0.26 && (n.dodgeCd || 0) < t) {
      n.dodgeCd = t + 3;
      const p = this.player, ang = Math.atan2(n.x - p.x, n.z - p.z) + (Math.random() - 0.5) * 1.4;
      const nx = n.x + Math.sin(ang) * 1.5, nz = n.z + Math.cos(ang) * 1.5;
      if (this.W.walkable(Math.round(nx), Math.round(nz))) { n.x = nx; n.z = nz; n.path = []; }
      this.ui.float('Esquiva', 'info', n.x, n.model.height + 0.4, n.z);
      return 0;
    }
    if (!n.fightPotion && n.fight && n.fight.mode === 'duel' && n.hp - dmg < n.maxHp * 0.4 && n.hp - dmg > n.maxHp * 0.15) {
      n.fightPotion = true;
      setTimeout(() => { if (!n.fight) return; const h = Math.round(n.maxHp * 0.25); n.hp = Math.min(n.maxHp, n.hp + h); this.ui.setHp(n.label, n.hp / n.maxHp); this.ui.float('+' + h + ' 🍶', 'heal', n.x, n.model.height + 0.4, n.z); }, 500);
    }
    return dmg;
  };
  // técnica especial del NPC en duelo cada pocos segundos (anunciada con un círculo)
  P.npcFightSkill = function (n, dt) {
    if (!n.fight) { n.fightPotion = false; return; }
    const p = this.player, d = n.dist(p);
    n.fSkillCd = (n.fSkillCd ?? 4) - dt;
    if (n.fSkillCd > 0 || d > 5 || n.pending) return;
    n.fSkillCd = 6 + Math.random() * 3;
    n.faceTo(p.x - n.x, p.z - n.z, 1);
    const L = n.def.look || {};
    if (L.axe) { n.st.skill = { type: 'spin', t: 0, dur: 0.8 }; this.ring(n.x, n.z, 2.3, 0xff7040); n.pending = { t: 0.5, r: 2.4, k: 1.6 }; this.ui.float('¡Remolino!', 'crit', n.x, 2, n.z); }
    else if (L.spear) { n.st.skill = { type: 'thrust', t: 0, dur: 0.5 }; n.pending = { t: 0.25, r: 2.2, k: 1.8 }; this.ring(p.x, p.z, 1.2, 0x7af0d8); this.ui.float('¡Estocada!', 'crit', n.x, 2, n.z); }
    else {
      n.st.skill = { type: 'dash', t: 0, dur: 0.4 };
      const ang = Math.atan2(p.x - n.x, p.z - n.z), nx = p.x - Math.sin(ang) * 1.1, nz = p.z - Math.cos(ang) * 1.1;
      if (this.W.walkable(Math.round(nx), Math.round(nz))) { n.x = nx; n.z = nz; n.path = []; }
      this.slash(n, 0x9ad8ff);
      n.pending = { t: 0.1, r: 2.2, k: 1.7 };
      this.ui.float('¡Corte veloz!', 'crit', n.x, 2, n.z);
    }
  };
  // envolver el daño a enemigos y NPCs
  const dE = P.damageEnemy;
  P.damageEnemy = function (e, dmg, crit, byCrew, killerId = 0) {
    if (this.enemyDefend) { dmg = this.enemyDefend(e, dmg, byCrew); if (dmg <= 0) return; }
    return dE.call(this, e, dmg, crit, byCrew, killerId);
  };
  const dN = P.damageNPC;
  P.damageNPC = function (n, dmg, crit) {
    if (n.fight) { dmg = this.npcDefend(n, dmg); if (dmg <= 0) return; }
    return dN.call(this, n, dmg, crit);
  };
}

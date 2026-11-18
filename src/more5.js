// v3.2: jefes de las islas nuevas, trineo de perros, fragatas de globo en Engranaje, torneo de pesca semanal,
// técnicas del Armamento Espiritual (nivel 40 y 50), Isla Naciente (solo durante la erupción),
// prisión de la Marina para rescatar a la tripulación y clima propio de cada isla.
import * as THREE from 'three';
import { makeIslet } from './regions.js';
import { T } from './world.js';
import { ITEMS } from './items.js';

// ---------------------------------------------------------------- Isla Naciente (aparece con la erupción)
export function makeNewbornIslet() {
  const R = makeIslet({ id: 'naciente', name: 'Isla Naciente', ox: 128, oz: 196, N: 40, seed: 211, dockDir: [-1, 0], biome: 'volcano' });
  R.ghost = true; R.newborn = true; R.hidden = true;
  const t0 = R.tile, w0 = R.walkable;
  R.tile = (x, z) => (R.hidden ? T.WATER : t0(x, z));
  R.walkable = (x, z) => !R.hidden && w0(x, z);
  return R;
}

const FISH_PTS = { fish: 1, atun: 3, pez_espada: 8, pez_luna: 15, pez_dorado: 50 };
const RIVALS = ['Pescador Gaspar', 'Abuela Remedios', 'Capitán Anzuelo'];
const WEATHER5 = {
  escarcha: { kind: 'blizzard', name: '❄️ ¡Ventisca!', color: 0xffffff },
  merengue: { kind: 'sugar', name: '🍬 Lluvia de azúcar', color: 0xffc8e8 },
  burbuja: { kind: 'bubbles', name: '🫧 Marea de pompas', color: 0xbfefff },
  engranaje: { kind: 'steam', name: '♨️ Nube de vapor', color: 0xc8c0b0 },
};

export function installMore5(Game, D) {
  const P = Game.prototype;
  const sfx = D.sfx;

  // ============================================================ trineo de perros
  P.mountSpeed5 = function (base) {
    if (this.mounted !== 'trineo') return base;
    const p = this.player, t = this.W.tile(Math.round(p.x), Math.round(p.z));
    return t === T.SNOW ? base * 1.3 : base;
  };

  // ============================================================ fragatas de globo
  const ENG = { x: 206, z: 68 };
  P.balloonTargets = function () { return (this.balloons || []).filter((b) => !b.dead).map((b) => ({ x: b.x, z: b.z, sinking: false })); };
  P.makeBalloon = function () {
    const g = new THREE.Group();
    const M = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
    const env = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), M(0xb8862a)); env.scale.set(1.5, 1.1, 2.6); env.position.y = 6.6; g.add(env);
    for (let i = 0; i < 4; i++) { const band = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.04, 4, 20), M(0x5a3a1a)); band.scale.set(1.5, 1.1, 1); band.position.set(0, 6.6, -1.8 + i * 1.2); band.scale.z = 1; band.rotation.y = 0; g.add(band); }
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1, 0.8), M(0x8a5a2a)); fin.position.set(0, 7.2, -2.7); g.add(fin);
    const hull = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 2.4), M(0x6a4a2a)); hull.position.y = 4.2; g.add(hull);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 2.5), M(0xd8a838)); rail.position.y = 4.55; g.add(rail);
    for (const [x, z] of [[-0.5, -1], [0.5, -1], [-0.5, 1], [0.5, 1]]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.8, 4), M(0x3a2a1a)); r.position.set(x, 5.4, z); g.add(r); }
    const prop = new THREE.Group(); prop.position.set(0, 4.3, -1.35); g.add(prop);
    for (let i = 0; i < 3; i++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.03), M(0xd8d0c0)); bl.rotation.z = (i / 3) * Math.PI * 2; prop.add(bl); }
    const smoke = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.5, 6), M(0x3a3a3a)); smoke.position.set(0.3, 4.75, 0.6); g.add(smoke);
    g.userData.prop = prop;
    return g;
  };
  P.updateBalloons = function (dt) {
    this.balloons = this.balloons || [];
    const b = this.boat, list = this.balloons;
    const host = !(this.net.isClient && this.net.active);
    const near = this.sailing && !b.sinking && Math.hypot(b.x - ENG.x, b.z - ENG.z) < 55;
    if (near && host) {
      this.balT = (this.balT ?? 6) - dt;
      if (this.balT <= 0 && list.filter((k) => !k.dead).length < 2) {
        this.balT = 30 + Math.random() * 20;
        const a = Math.random() * Math.PI * 2, lvl = Math.max(70, Math.min(99, this.player.level));
        const o = { x: b.x + Math.sin(a) * 22, z: b.z + Math.cos(a) * 22, a, hp: 400 + lvl * 14, maxHp: 400 + lvl * 14, level: lvl, cd: 3, mesh: this.makeBalloon(), label: this.ui.makeLabel('enemy', '', { hp: true }), dead: false };
        o.label.nm.textContent = `🎈 Fragata de globo · Nv. ${lvl}`;
        o.label.nm.style.color = '#ffb84a';
        this.ui.setHp(o.label, 1);
        this.scene.add(o.mesh);
        list.push(o);
        this.toast('🎈 ¡Una fragata de globo de Engranaje te ataca desde el cielo! Dispárale con los cañones', 'area');
        sfx('quest');
      }
    }
    for (let i = list.length - 1; i >= 0; i--) {
      const o = list[i];
      if (o.dead) {
        o.deadT += dt; o.mesh.position.y -= dt * 3; o.mesh.rotation.z += dt * 0.6;
        if (o.deadT > 2.5) { this.scene.remove(o.mesh); o.label.el.remove(); list.splice(i, 1); }
        continue;
      }
      if (!this.sailing || Math.hypot(b.x - o.x, b.z - o.z) > 70) { this.scene.remove(o.mesh); o.label.el.remove(); list.splice(i, 1); continue; }
      o.a += dt * 0.35;
      const tx = b.x + Math.sin(o.a) * 6, tz = b.z + Math.cos(o.a) * 6;
      const d = Math.hypot(tx - o.x, tz - o.z), sp = Math.min(d, 6 * dt);
      if (d > 0.01) { o.x += ((tx - o.x) / d) * sp; o.z += ((tz - o.z) / d) * sp; o.mesh.rotation.y = Math.atan2(tx - o.x, tz - o.z); }
      o.mesh.position.set(o.x, Math.sin(this.time * 0.8 + i) * 0.3, o.z);
      o.mesh.userData.prop.rotation.z += dt * 18;
      this.ui.placeLabel(o.label, o.x, 8.4, o.z);
      o.cd -= dt;
      if (host && o.cd <= 0 && Math.hypot(b.x - o.x, b.z - o.z) < 14) {
        o.cd = 3.5 + Math.random() * 1.5;
        const x = b.x + (Math.random() - 0.5) * 2, z = b.z + (Math.random() - 0.5) * 2;
        this.ring(x, z, 2.2, 0xff8a20);
        this.navalInit(); this.puff(o.x, 4, o.z, 0x5a5a5a);
        setTimeout(() => {
          this.ring(x, z, 2.8, 0xffc040);
          this.navalInit(); this.puff(x, 0.5, z, 0xff9a40, true);
          if (this.sailing && Math.hypot(this.boat.x - x, this.boat.z - z) < 2.6) this.damageBoat(20 + o.level * 1.2, x, z);
        }, 1200);
      }
    }
  };
  P.balloonHit = function (bl) {
    for (const o of this.balloons || []) {
      if (o.dead || Math.hypot(bl.x - o.x, bl.z - o.z) > 2.8) continue;
      o.hp -= bl.dmg;
      this.ui.float(String(Math.round(bl.dmg)), 'pdmg', o.x, 5, o.z);
      this.ui.setHp(o.label, Math.max(0, o.hp) / o.maxHp);
      if (o.hp <= 0) {
        o.dead = true; o.deadT = 0; o.label.el.style.display = 'none';
        const p = this.player, gold = 300 + o.level * 10, xp = 200 + o.level * 25;
        p.gold += gold; p.gainXp(xp); this.crewGainXp(xp);
        this.give('meteorito', 1 + (Math.random() < 0.5 ? 1 : 0), o.x, o.z);
        this.stats.k_balloon = (this.stats.k_balloon || 0) + 1;
        this.jobXp('marinero', 40);
        this.toast(`💥 ¡Fragata de globo derribada! +${gold} oro`, 'area');
        sfx('quest');
      }
      return true;
    }
    return false;
  };

  // ============================================================ torneo de pesca semanal
  P.fishTourneyDay = function () { return this.day % 7 === 3; };
  P.fishScore = function (id) {
    const F = this.fishT;
    if (!F || F.day !== this.day || !this.fishTourneyDay()) return;
    F.pts += FISH_PTS[id] || 1;
    this.toast(`🏆 Torneo de pesca: +${FISH_PTS[id] || 1} puntos (llevas ${F.pts})`);
  };
  P.fishRivals = function (day) {
    let s = (day * 9301 + 49297) % 233280;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const prog = day === this.day ? Math.min(1, this.tod / 22) : 1;
    return RIVALS.map((n) => ({ name: n, pts: Math.round((12 + rnd() * 45) * prog) }));
  };
  P.fishTable = function (F) { return [{ name: this.player.name, pts: F.pts, me: true }, ...this.fishRivals(F.day)].sort((a, b) => b.pts - a.pts); };
  P.fishTourneyMenu = function () {
    const F = this.fishT;
    const opts = [];
    let text;
    if (F && F.day !== this.day && !F.claimed) {
      const tab = this.fishTable(F), pos = tab.findIndex((r) => r.me) + 1;
      text = `Resultados del torneo:<br>${tab.map((r, i) => `${i + 1}. ${r.me ? '<b>' + r.name + '</b>' : r.name} · ${r.pts} pts`).join('<br>')}`;
      opts.push({ label: pos <= 3 ? `🏆 Recoger premio (${pos}º puesto)` : 'Recoger diploma', action: () => this.claimFishTourney(pos) });
    } else if (this.fishTourneyDay()) {
      if (!F || F.day !== this.day) { text = '¡Hoy es el torneo de pesca! Pesca todo lo que puedas hasta medianoche: los peces raros dan más puntos.'; opts.push({ label: '🎣 Inscribirme (100 oro)', action: () => this.buy({ gold: 100 }, () => { this.fishT = { day: this.day, pts: 0, claimed: false }; this.toast('🎣 ¡Inscrito en el torneo de pesca!', 'area'); }) }); }
      else { const tab = this.fishTable(F); text = `Clasificación provisional:<br>${tab.map((r, i) => `${i + 1}. ${r.me ? '<b>' + r.name + '</b>' : r.name} · ${r.pts} pts`).join('<br>')}<br><small>Pez 1 · atún 3 · pez espada 8 · pez luna 15 · pez dorado 50</small>`; }
    } else {
      const left = (3 - (this.day % 7) + 7) % 7;
      text = `El torneo de pesca se celebra una vez por semana. El próximo es dentro de ${left} día${left === 1 ? '' : 's'}.`;
    }
    opts.push({ label: 'Volver', action: null });
    this.ui.openDialog('🏆 Torneo de pesca', text, opts);
  };
  P.claimFishTourney = function (pos) {
    const F = this.fishT; F.claimed = true;
    const p = this.player;
    const gold = [3000, 1500, 700][pos - 1] || 100;
    p.gold += gold;
    if (pos === 1) { this.give('ficha', 10); if (!this.ownCos('c_gorro_pescador')) this.give('c_gorro_pescador'); this.stats.fishCups = (this.stats.fishCups || 0) + 1; }
    else if (pos <= 3) this.give('ficha', 4);
    this.jobXp('pescador', 150);
    this.toast(`🏆 Torneo de pesca: ${pos}º puesto · +${gold} oro${pos === 1 ? ' y el Gorro del campeón' : ''}`, 'area');
    sfx('quest');
  };

  // ============================================================ técnicas del Armamento Espiritual
  P.espPunch = function () {
    const p = this.player;
    if (!this.esp || this.esp.l < 40 || !this.started || this.paused || p.dead || this.sailing || p.st.swim) return;
    this.skillCd = this.skillCd || {};
    if ((this.skillCd.esp || 0) > 0) return;
    if (p.stamina < 20) return this.toast('Te falta estamina');
    p.stamina -= 20;
    this.skillCd.esp = 9;
    p.lastCombat = this.time;
    const king = this.esp.l >= 50;
    let tgt = null, bd = 8;
    for (const e of this.enemies) { if (e.dead || e.removed || (e.hostile && !e.hostile())) continue; const d = p.dist(e); if (d < bd) { bd = d; tgt = e; } }
    if (tgt) p.faceTo(tgt.x - p.x, tgt.z - p.z, 1);
    p.st.attackT = 0.32;
    this.espT = 5;
    const fx = Math.sin(p.face), fz = Math.cos(p.face);
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.4, 14, 10), new THREE.MeshBasicMaterial({ color: 0x0a0010, transparent: true, opacity: 0.9 }));
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 10), new THREE.MeshBasicMaterial({ color: 0xff3a8a, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide }));
    m.add(halo);
    m.position.set(p.x + fx * 0.6, 0.9, p.z + fz * 0.6);
    this.scene.add(m);
    this.ui.float(king ? '¡Puño del Rey!' : '¡Puño espiritual!', 'crit', p.x, 1.9, p.z);
    sfx('skill');
    this.espShots = this.espShots || [];
    this.espShots.push({ m, x: m.position.x, z: m.position.z, fx, fz, d: 0, max: 8, hit: new Set(), king });
    this.renderSkills(true);
  };
  P.updateEspShots = function (dt) {
    if (!this.espShots) return;
    const p = this.player;
    for (let i = this.espShots.length - 1; i >= 0; i--) {
      const s = this.espShots[i], st = dt * 14;
      s.d += st; s.x += s.fx * st; s.z += s.fz * st;
      s.m.position.set(s.x, 0.9, s.z);
      s.m.scale.setScalar(1 + s.d * 0.06);
      for (const e of this.enemies) {
        if (e.dead || e.removed || s.hit.has(e) || (e.hostile && !e.hostile()) || Math.hypot(e.x - s.x, e.z - s.z) > 1.1) continue;
        s.hit.add(e);
        this._pierce = s.king;
        this.hitEnemy(e, Math.round(p.atk * (s.king ? 3.6 : 2.8) * this.espMul()), true);
        this._pierce = false;
        if (s.king && !e.dead) { e.stunT = 2; this.ui.float('¡Aturdido!', 'info', e.x, e.model.height + 0.5, e.z); }
        this.ring(e.x, e.z, 1.2, 0xff3a8a);
      }
      if (s.d >= s.max) { this.scene.remove(s.m); this.espShots.splice(i, 1); if (s.king) { this.ring(s.x, s.z, 2.4, 0x1a0020); this.camShake = 0.2; } }
    }
  };
  P.addEspSkillBtn = function () {
    const bar = document.getElementById('skillBar');
    if (!bar) return;
    const want = !!(this.esp && this.esp.l >= 40);
    let b = bar.querySelector('.skb.espk');
    if (want && !b) {
      b = document.createElement('button');
      b.className = 'skb espk';
      b.title = 'Puño espiritual';
      b.innerHTML = '🖤<div class="cd"></div><small></small>';
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this.espPunch(); });
      bar.appendChild(b);
    } else if (!want && b) b.remove();
    if (b && want) { const c = (this.skillCd && this.skillCd.esp) || 0; const h = c > 0 ? Math.round((c / 9) * 100) + '%' : '0%'; const cd = b.querySelector('.cd'); if (cd._h !== h) { cd._h = h; cd.style.height = h; } }
  };

  // ============================================================ Isla Naciente
  P.updateNewborn = function (dt) {
    const R = this.newbornIsle;
    if (!R) return;
    this.nbT = (this.nbT || 0) - dt;
    if (this.nbT > 0) return;
    this.nbT = 1;
    const p = this.player;
    const onIt = !R.hidden && R.contains(Math.round(p.x), Math.round(p.z)) && !this.sailing;
    const want = (this.event && this.event.id === 'erupcion') || onIt;
    if (want === !R.hidden) return;
    R.hidden = !want;
    for (const m of R.meshes || []) m.visible = want;
    if (want) {
      this.buildNewborn();
      this.nbGroup.visible = true;
      this.flags.naciente_cofre = false;
      if (!this.chests.includes(this.nbChest)) this.chests.push(this.nbChest);
      if (!(this.net.isClient && this.net.active)) {
        const { x: cx, z: cz } = R.center;
        this.nbTemps = [];
        const lvl = Math.max(70, Math.min(98, p.level));
        for (const [type, n] of [['golem_obs', 4], ['skull', 4]]) for (let i = 0; i < n; i++) {
          for (let k = 0; k < 20; k++) { const x = cx - 9 + Math.floor(Math.random() * 18), z = cz - 9 + Math.floor(Math.random() * 18); if (R.walkable(x, z) && Math.hypot(x - cx, z - cz) > 4) { this.nbTemps.push(this.spawnTemp(type, x, z, lvl)); break; } }
        }
      }
      this.toast('🌋 ¡La erupción ha hecho nacer una isla nueva al oeste de Isla Ceniza! Solo durará mientras arda el volcán', 'area');
      sfx('quest');
    } else {
      if (this.nbGroup) this.nbGroup.visible = false;
      const i = this.chests.indexOf(this.nbChest); if (i >= 0) this.chests.splice(i, 1);
      for (const e of this.nbTemps || []) if (!e.removed) e.remove();
      this.nbTemps = [];
      this.purgeTemps();
    }
  };
  P.buildNewborn = function () {
    if (this.nbGroup) return;
    const R = this.newbornIsle, { x: cx, z: cz } = R.center;
    const g = new THREE.Group();
    const obs = new THREE.MeshPhongMaterial({ color: 0x1a1020, emissive: 0x2a0a00, shininess: 90 });
    const glow = new THREE.MeshBasicMaterial({ color: 0xff6020 });
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2, r = 5 + Math.random() * 10;
      const x = Math.round(cx + Math.cos(a) * r), z = Math.round(cz + Math.sin(a) * r);
      if (!R.walkable(x, z)) continue;
      const h = 0.6 + Math.random() * 1.2;
      const m = new THREE.Mesh(new THREE.ConeGeometry(0.25, h, 5), i % 4 ? obs : glow); m.position.set(x + (Math.random() - 0.5) * 0.4, h / 2, z); m.rotation.z = (Math.random() - 0.5) * 0.4; g.add(m);
    }
    let sp = { x: cx + 5, z: cz };
    for (let k = 0; k < 40; k++) { const x = cx + 3 + Math.floor(Math.random() * 6), z = cz - 3 + Math.floor(Math.random() * 6); if (R.walkable(x, z)) { sp = { x, z }; break; } }
    const chest = new THREE.Group();
    const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.55), obs); c1.position.y = 0.25; chest.add(c1);
    const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.12, 0.6), glow); c2.position.y = 0.52; chest.add(c2);
    chest.position.set(sp.x, 0, sp.z); g.add(chest);
    R.setBlocked(sp.x, sp.z, 1);
    this.nbChest = { id: 'naciente_cofre', x: sp.x, z: sp.z, loot: { gold: 2500, potion: 3 } };
    this.scene.add(g);
    this.nbGroup = g;
  };

  // ============================================================ prisión de la Marina
  P.jailInit = function () {
    if (this.jailSpot) return;
    const R = this.islets.find((r) => r.id === 'bastion');
    if (!R) return;
    const { x: cx, z: cz } = R.center;
    let s = { x: cx + 9, z: cz + 10 };
    for (const [dx, dz] of [[9, 10], [8, 10], [9, 9], [10, 10], [8, 9], [7, 10]]) if (R.walkable(cx + dx, cz + dz) && R.walkable(cx + dx, cz + dz - 1)) { s = { x: cx + dx, z: cz + dz }; break; }
    this.jailSpot = s;
    this.jailDoor = { x: s.x, z: s.z - 1.2 };
    R.setBlocked(s.x, s.z, 1);
    const g = new THREE.Group();
    const iron = new THREE.MeshLambertMaterial({ color: 0x3a3a44 });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 1.5), new THREE.MeshLambertMaterial({ color: 0x6a6a6a })); floor.position.y = 0.05; g.add(floor);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 1.6), iron); roof.position.y = 1.9; g.add(roof);
    for (let i = 0; i < 6; i++) for (const side of [0, 1, 2, 3]) {
      const t = -0.7 + i * 0.28, bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.85, 5), iron);
      const [x, z] = side === 0 ? [t, -0.72] : side === 1 ? [t, 0.72] : side === 2 ? [-0.72, t] : [0.72, t];
      bar.position.set(x, 0.95, z); g.add(bar);
    }
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.04), new THREE.MeshLambertMaterial({ color: 0x24345e })); sign.position.set(0, 2.15, -0.75); g.add(sign);
    g.position.set(s.x, 0, s.z);
    this.scene.add(g);
  };
  P.jailed = function () { return this.crew().filter((n) => this.soc(n.id).role === 'jail'); };
  P.onPlayerDeath5 = function (e) {
    if (!e || e.isRemote || e.isNPC || !e.def) return;
    const marina = e.type === 'marine' || e.type === 'marine_boss' || (e.def.group || '') === 'marina';
    if (!marina || this.isMarine() || Math.random() > 0.45) return;
    const cands = this.activeCrew();
    if (!cands.length) return;
    const n = cands[Math.floor(Math.random() * cands.length)];
    const s = this.soc(n.id);
    s.role = 'jail';
    if (this.autoHelm === n.id) this.autoHelm = null;
    setTimeout(() => this.toast(`⛓️ ¡La Marina se ha llevado a ${n.name} a la prisión del Bastión! Ve a rescatarle`, 'area'), 1800);
  };
  P.jailNear = function () { const p = this.player, j = this.jailDoor; return j && !this.sailing && Math.hypot(p.x - j.x, p.z - j.z) < 2.2 && this.jailed().length > 0; };
  P.startRescue = function () {
    if (this.rescue) return this.toast('¡Primero derrota a los guardias!');
    const p = this.player, j = this.jailSpot;
    const lvl = Math.max(30, Math.min(95, p.level));
    const temps = [];
    for (let i = 0; i < 5; i++) {
      for (let k = 0; k < 20; k++) { const x = j.x - 4 + Math.floor(Math.random() * 9), z = j.z - 5 + Math.floor(Math.random() * 6); if (this.W.walkable(x, z) && Math.hypot(x - p.x, z - p.z) > 2) { const e = this.spawnTemp(i === 0 ? 'marine_boss' : 'marine', x, z, i === 0 ? lvl + 2 : lvl); e.provoked = true; e.state = 'chase'; if (i === 0) { e.maxHp = Math.round(e.maxHp * 0.4); e.hp = e.maxHp; } temps.push(e); break; } }
    }
    this.rescue = { temps };
    this.toast('🚨 ¡Los carceleros te han visto! Derrótalos para abrir la celda', 'area');
    sfx('quest');
  };
  P.updateRescue = function () {
    const R = this.rescue;
    if (!R) return;
    if (this.player.dead) { for (const e of R.temps) if (!e.removed) e.remove(); this.rescue = null; this.purgeTemps(); return; }
    if (!R.temps.every((e) => e.dead || e.removed)) return;
    this.rescue = null;
    const names = [];
    for (const n of this.jailed()) {
      const s = this.soc(n.id);
      s.role = this.activeCrew().length >= 3 ? 'ship' : undefined;
      if (!s.role) { n.model.root.visible = true; this.placeNear(n, this.player.tx, this.player.tz); }
      s.f = Math.min(100, (s.f || 0) + 10);
      names.push(n.name);
    }
    this.stats.rescues = (this.stats.rescues || 0) + 1;
    this.toast(`🔓 ¡Has rescatado a ${names.join(', ')}! (+amistad)`, 'area');
    sfx('quest');
  };

  // ============================================================ clima propio de cada isla
  P.updateIsleWeather = function (dt) {
    const p = this.player;
    const r = this.W.regionAt(p.x, p.z);
    const W5 = r && !this.sailing && !this.roomAt(p.x, p.z) ? WEATHER5[r.id] : null;
    this.iw = this.iw || { t: 30, on: false };
    const S = this.iw;
    if (!S.pts) {
      const N = 500, geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
      S.mat = new THREE.PointsMaterial({ color: 0xffffff, size: 5, sizeAttenuation: false, transparent: true, opacity: 0.9, depthWrite: false });
      S.pts = new THREE.Points(geo, S.mat); S.pts.frustumCulled = false; S.pts.visible = false;
      S.seeds = Array.from({ length: N }, () => ({ x: (Math.random() - 0.5) * 44, y: Math.random() * 14, z: (Math.random() - 0.5) * 44, s: 0.6 + Math.random() * 0.8 }));
      this.scene.add(S.pts);
    }
    if (!W5) { if (S.on) { S.on = false; S.pts.visible = false; this.blizzard = false; } S.t = Math.min(S.t, 25); return; }
    S.t -= dt;
    if (S.t <= 0) {
      S.on = !S.on;
      S.t = S.on ? 35 + Math.random() * 15 : 50 + Math.random() * 40;
      S.kind = W5.kind;
      if (S.on) { this.toast(W5.name, 'area'); S.mat.color.set(W5.color); S.mat.size = W5.kind === 'bubbles' ? 9 : W5.kind === 'steam' ? 14 : W5.kind === 'blizzard' ? 4 : 6; S.mat.opacity = W5.kind === 'steam' ? 0.35 : 0.9; }
    }
    if (S.on && S.kind !== W5.kind) { S.on = false; S.t = 10; }
    S.pts.visible = S.on;
    this.blizzard = S.on && S.kind === 'blizzard';
    if (!S.on) return;
    const pos = S.pts.geometry.attributes.position, c = this.camTarget;
    for (let i = 0; i < S.seeds.length; i++) {
      const sd = S.seeds[i];
      if (S.kind === 'blizzard') { sd.y -= dt * 5 * sd.s; sd.x += dt * 9 * sd.s; if (sd.x > 22) sd.x -= 44; }
      else if (S.kind === 'sugar') { sd.y -= dt * 1.2 * sd.s; }
      else if (S.kind === 'bubbles') { sd.y += dt * 0.9 * sd.s; sd.x += Math.sin(this.time + i) * dt * 0.3; }
      else { sd.y += dt * 0.7 * sd.s; sd.x += dt * 0.4; }
      if (sd.y < 0) sd.y = 14; if (sd.y > 14) sd.y = 0;
      pos.setXYZ(i, c.x + sd.x, sd.y, c.z + sd.z);
    }
    pos.needsUpdate = true;
    if (this.blizzard) this.scene.background.lerp(new THREE.Color(0xe8f0f8), 0.6);
    else if (S.kind === 'steam') this.scene.background.lerp(new THREE.Color(0xa89c88), 0.4);
  };

  // ============================================================ diálogos nuevos
  P.npcDialog5 = function (id, opts, sell) {
    if (id === 'gaspar') opts.push({ label: `🏆 Torneo de pesca${this.fishTourneyDay() ? ' (¡hoy!)' : ''}`, action: () => this.fishTourneyMenu() });
    if (id === 'maestro' && this.esp) {
      const L = this.esp.l;
      return `Nivel ${L}/50. ${L < 40 ? 'Al nivel 40 aprenderás el Puño espiritual: un golpe de energía negra que vuela hasta 8 casillas.' : L < 50 ? 'Ya dominas el Puño espiritual (botón 🖤). Al nivel 50 se convertirá en el Puño del Rey: aturde y atraviesa el Armamento enemigo.' : 'Dominas el Puño del Rey. Ya no tengo nada más que enseñarte.'}`;
    }
    return null;
  };
  P.newsHtml5 = function () {
    const J = this.jailed();
    return `<div class="sub">🆕 v3.2</div><ul class="qlist">
      <li>👑 <b>Jefes de las islas</b>: Reina de Hielo Glacia (Isla Escarcha), Gran Autómata Ferrum (Isla Engranaje) y Rey Pastel Bizcochón (Isla Merengue).</li>
      <li>🛷 <b>Trineo de perros</b>: lo vende la Herrera Helga. Corre más sobre la nieve.</li>
      <li>🎈 <b>Fragatas de globo</b>: atacan desde el cielo cerca de Isla Engranaje. Derríbalas con los cañones (dan meteorito).</li>
      <li>🏆 <b>Torneo de pesca</b> cada 7 días con el Pescador Gaspar. ${this.fishTourneyDay() ? '<b>¡Es hoy!</b>' : ''}</li>
      <li>🖤 <b>Técnicas del Armamento</b>: nivel 40 Puño espiritual (golpe a distancia), nivel 50 Puño del Rey (aturde y atraviesa el Armamento enemigo).</li>
      <li>🌋 <b>Isla Naciente</b>: aparece al oeste de Isla Ceniza solo durante la erupción, con un cofre de obsidiana.</li>
      <li>⛓️ <b>Prisión de la Marina</b> (Bastión): si la Marina te derrota puede llevarse a un tripulante. ${J.length ? `<b>Presos: ${J.map((n) => n.name).join(', ')}</b>` : 'Ahora no hay nadie preso.'}</li>
      <li>🌦 <b>Clima de cada isla</b>: ventisca en Escarcha, lluvia de azúcar en Merengue, pompas en Burbuja y vapor en Engranaje.</li></ul>`;
  };
}

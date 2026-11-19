// v5.5: Faro Maldito (isla que solo aparece con niebla), fusión de armas, expediciones de la tripulación,
// arena de bestias, mapa estelar, Isla de los Relojes (puzle día/noche), cocina de leyenda, restaurante
// en tu aldea, jefe mundial semanal (Behemot) y nave fantasma que atraviesa islas.
import * as THREE from 'three';
import { T } from './world.js';
import { ITEMS, EQUIP } from './items.js';
import { BUFFS } from './skills.js';

BUFFS.dish_dragon = { name: '🍖 Estofado de dragón', atk: 1.25 };
BUFFS.dish_abisal = { name: '🍲 Sopa abisal', def: 1.25 };
BUFFS.dish_celeste = { name: '🍰 Tarta celeste', xp: 1.3 };
BUFFS.dish_vacio = { name: '🥘 Guiso del Vacío', atk: 1.15, def: 1.15 };
BUFFS.star_osa = { name: '🐻 Bendición de la Osa', atk: 1.12 };
BUFFS.star_ballena = { name: '🐋 Bendición de la Ballena', def: 1.12 };
BUFFS.star_dragon = { name: '🐉 Bendición del Dragón', xp: 1.2 };
BUFFS.star_ancla = { name: '⚓ Bendición del Ancla', def: 1.06, atk: 1.06 };
BUFFS.star_corona = { name: '👑 Bendición de la Corona', atk: 1.08, xp: 1.1 };

// ---------------------------------------------------------------- regiones
const FX0 = 6600, FZ0 = 0, FW = 20, FD = 16, FOG_SPOT = { x: -50, z: 60 };
export function makeCursedLighthouse() {
  const inb = (lx, lz) => lx >= 0 && lz >= 0 && lx < FW && lz < FD;
  const tower = { x: FX0 + 15, z: FZ0 + 8 };
  const R = { kind: 'dungeon', id: 'faro_maldito', name: 'Faro Maldito', X: FX0, Z: FZ0, exit: { x: FX0 + 1, z: FZ0 + 8 }, spawns: [], tower, braziers: [[6, 3], [6, 12], [11, 8]].map(([x, z]) => ({ x: FX0 + x, z: FZ0 + z })) };
  const blocked = (x, z) => (Math.abs(x - tower.x) <= 1 && Math.abs(z - tower.z) <= 1) || R.braziers.some((b) => b.x === x && b.z === z);
  R.contains = (x, z) => x >= FX0 - 1 && x <= FX0 + FW && z >= FZ0 - 1 && z <= FZ0 + FD;
  R.tile = (x, z) => (inb(x - FX0, z - FZ0) ? ((x + z) % 5 === 0 ? T.ROCK : T.DARK) : T.WATER);
  R.walkable = (x, z) => inb(x - FX0, z - FZ0) && !blocked(x, z);
  R.setBlocked = () => {}; R.groundY = () => 0; R.areaName = () => 'Faro Maldito';
  return R;
}
const KX0 = 6800, KZ0 = 0, KW = 22, KD = 9;
// puertas: abiertas de día (d) o de noche (n)
const GATES = [{ x: 5, open: 'd' }, { x: 10, open: 'n' }, { x: 15, open: 'd' }];
const LEVERS = [{ x: 8, z: 1 }, { x: 13, z: 7 }, { x: 2, z: 7 }];
export function makeClockIsland() {
  const inb = (lx, lz) => lx >= 0 && lz >= 0 && lx < KW && lz < KD;
  const R = { kind: 'dungeon', id: 'relojes', name: 'Isla de los Relojes', X: KX0, Z: KZ0, exit: { x: KX0 + 1, z: KZ0 + 4 }, spawns: [], night: false, chest: { x: KX0 + 20, z: KZ0 + 4 } };
  const wall = (lx, lz) => { for (const g of GATES) if (lx === g.x) return (g.open === 'd') === R.night; return (lz === 0 || lz === KD - 1) && (lx % 3 === 0); };
  R.contains = (x, z) => x >= KX0 - 1 && x <= KX0 + KW && z >= KZ0 - 1 && z <= KZ0 + KD;
  R.tile = (x, z) => (inb(x - KX0, z - KZ0) ? T.STONE : T.WATER);
  R.walkable = (x, z) => { const lx = x - KX0, lz = z - KZ0; return inb(lx, lz) && !wall(lx, lz) && !(x === R.chest.x && z === R.chest.z); };
  R.setBlocked = () => {}; R.groundY = () => 0; R.areaName = () => 'Isla de los Relojes';
  return R;
}

const CONSTELLATIONS = [
  { id: 'osa', name: 'La Osa Marinera', buff: 'star_osa', stars: [['Polar', 5], ['Garra', 3], ['Hocico', 4], ['Cola', 1]] },
  { id: 'ballena', name: 'La Gran Ballena', buff: 'star_ballena', stars: [['Ojo', 4], ['Aleta', 2], ['Chorro', 5], ['Cola', 3]] },
  { id: 'dragon', name: 'El Dragón Dormido', buff: 'star_dragon', stars: [['Corazón', 5], ['Ala', 3], ['Cuerno', 4], ['Garra', 2], ['Cola', 1]] },
  { id: 'ancla', name: 'El Ancla Perdida', buff: 'star_ancla', stars: [['Argolla', 2], ['Brazo', 4], ['Uña', 3], ['Cruz', 5]] },
  { id: 'corona', name: 'La Corona del Mar', buff: 'star_corona', stars: [['Joya', 5], ['Pico', 2], ['Arco', 4], ['Punta', 3], ['Base', 1]] },
];
const DISHES = [
  { id: 'dragon', name: '🍖 Estofado de dragón (+25% ataque 1 h)', need: { sangre_dragon: 3, meat: 5 }, buff: 'dish_dragon' },
  { id: 'abisal', name: '🍲 Sopa abisal (+25% defensa 1 h)', need: { escama_lava: 2, perla: 2 }, buff: 'dish_abisal' },
  { id: 'celeste', name: '🍰 Tarta celeste (+30% experiencia 1 h)', need: { petalo_sakura: 5, apple: 5 }, buff: 'dish_celeste' },
  { id: 'vacio', name: '🥘 Guiso del Vacío (+15% ataque y defensa 1 h)', need: { fragmento_vacio: 2, seta_otono: 3 }, buff: 'dish_vacio' },
];
const TRAINERS = [
  { name: 'Niña Pía y su cangrejo Pinzas', lvl: 10 }, { name: 'Gorka y su jabalí Trueno', lvl: 22 }, { name: 'Selene y su lechuza Sombra', lvl: 36 },
  { name: 'Barón Krell y su grifo Áureo', lvl: 52 }, { name: 'La Domadora Suprema y su quimera', lvl: 75 },
];
const EXPED = [
  { h: 1, name: 'Calas cercanas (1 h)', gold: 1500, items: ['wood', 'stone', 'apple'] },
  { h: 3, name: 'Islas del este (3 h)', gold: 6000, items: ['iron', 'silver', 'perla'] },
  { h: 8, name: 'Mares lejanos (8 h)', gold: 20000, items: ['goldore', 'perla', 'ambar_gris', 'nucleo_estelar'] },
];
const EXP_TALES = ['encontramos una cueva llena de cangrejos que bailaban', 'un loro nos robó el mapa y tuvimos que perseguirlo dos islas', 'naufragamos un rato, pero hicimos una balsa con barriles', 'cambiamos especias por perlas con unos comerciantes de Velaria', 'vimos una ballena blanca bajo la luna', 'nos perdimos en la niebla y oímos campanas de un faro', 'ganamos un concurso de pulsos en una taberna', 'rescatamos a un pescador atrapado en un islote'];

export function installMore17(Game, D) {
  const P = Game.prototype;
  const sfx = D.sfx;
  const M = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
  const near = (p, s, r = 2) => s && Math.hypot(p.x - s.x, p.z - s.z) < r;
  const tpTo = (g, x, z) => { const p = g.player; p.x = x; p.z = z; p.path = []; for (const n of g.following()) g.placeNear(n, Math.round(x), Math.round(z)); g.camTarget.set(x, 0, z); };
  const npcAt = (g, id, name, x, z, look, lvl = 100) => { if (g.npcById(id)) return g.npcById(id); const n = new D.NPC(g, { id, name, x, z, wander: 1, look }); n.baseLevel = lvl; n.setStats(lvl); g.placeNear(n, x, z); g.npcs.push(n); return n; };
  const inR = (g, id) => { const r = g.W.regionAt(g.player.x, g.player.z); return r && r.id === id; };

  // ============================================================ Faro Maldito
  const FARO_TXT = [
    'Soy Elara, la farera. Hace cien años mi luz se apagó y un barco se estrelló contra las rocas... Mi alma no descansa. ¿Me ayudarás?',
    'Enciende los tres braseros de la isla. Quizá el fuego despierte la memoria del faro.',
    'Los marineros de aquel barco han vuelto... ¡y están furiosos! Calma sus almas en combate.',
    'Su capitán, el que me culpó de todo, sube por las escaleras del faro. Enfréntate a él.',
    'Gracias. Ya puedo descansar. Mi luz guiará a tu barco para siempre.',
  ];
  P.sailAction17 = function () {
    if (this.deck) return null;
    const b = this.boat;
    if (this.weather === 'fog' && Math.hypot(b.x - FOG_SPOT.x, b.z - FOG_SPOT.z) < 10) return { icon: '🗼', label: 'Faro', fn: () => this.enterFaro() };
    return null;
  };
  P.enterFaro = function () {
    const p = this.player, b = this.boat;
    this.faroFrom = { x: b.x, z: b.z, h: b.heading };
    this.deck = null; this.autoHelm = null; b.speed = 0; this.sailing = false;
    this.scene.add(p.model.root); p.model.root.rotation.set(0, 0, 0);
    this.unboardCrew(this.faroR.exit.x + 1, this.faroR.exit.z);
    tpTo(this, this.faroR.exit.x + 1, this.faroR.exit.z);
    this.buildFaro();
    this.toast('🗼 Entre la niebla aparece una isla que no está en ningún mapa... el Faro Maldito', 'area');
  };
  P.buildFaro = function () {
    if (this.faroG) { this.faroLights(); return; }
    const R = this.faroR, g = new THREE.Group();
    const t = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.4, 7, 12), M(0xd8d0c8)); t.position.set(R.tower.x, 3.5, R.tower.z); g.add(t);
    for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(1.25 - i * 0.12, 1.25 - i * 0.12, 0.6, 12), M(0x8a1a1a)); s.position.set(R.tower.x, 1 + i * 2.2, R.tower.z); g.add(s); }
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 10), new THREE.MeshBasicMaterial({ color: 0x3a3a4a })); lamp.position.set(R.tower.x, 7.6, R.tower.z); g.add(lamp);
    R.lamp = lamp; R.fires = [];
    for (const b of R.braziers) { const bw = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 0.7, 8), M(0x3a3a3a)); bw.position.set(b.x, 0.35, b.z); g.add(bw); const f = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 8), new THREE.MeshBasicMaterial({ color: 0xff8a20 })); f.position.set(b.x, 1, b.z); g.add(f); R.fires.push(f); }
    this.scene.add(g); this.faroG = g;
    npcAt(this, 'elara', 'Elara, la farera fantasma', R.tower.x - 3, R.tower.z, { shirt: 0xbfe8e8, robe: 0xbfe8e8, hair: 0xe8f0f0, longHair: true, female: true, skin: 0xd8f0f0, eyeGlow: 0x7af0e0 }, 50);
    const n = this.npcById('elara'); if (n) n.model.root.traverse((k) => { if (k.isMesh && k.material) { k.material = k.material.clone(); k.material.transparent = true; k.material.opacity = 0.6; } });
    this.faroLights();
  };
  P.faroLights = function () {
    const R = this.faroR, F = (this.faro = this.faro || { part: 0, lit: [] });
    R.braziers.forEach((b, i) => { if (R.fires) R.fires[i].visible = F.lit.includes(i) || F.part >= 2; });
    if (R.lamp) R.lamp.material.color.set(F.part >= 4 ? 0xffe880 : 0x3a3a4a);
  };
  P.faroDialog = function (opts) {
    const F = (this.faro = this.faro || { part: 0, lit: [] }), p = this.player;
    if (F.part === 0) opts.push({ label: '🤝 Te ayudaré', action: () => { F.part = 1; this.toast('🗼 Faro Maldito (1/4): enciende los tres braseros'); } });
    if (F.part === 2 && !this.faroTemps) opts.push({ label: '⚔️ Que vengan los marineros', action: () => {
      this.faroTemps = [];
      for (let i = 0; i < 5; i++) { const e = this.spawnTemp('marinero_fantasma', this.faroR.X + 4 + i * 2, this.faroR.Z + 3 + (i % 2) * 9, Math.max(30, Math.min(500, p.level))); e.provoked = true; e.state = 'chase'; this.faroTemps.push(e); }
    } });
    if (F.part === 3 && !this.faroTemps) opts.push({ label: '⚔️ Enfrentarme al capitán', action: () => {
      const e = this.spawnTemp('ghost_captain', this.faroR.tower.x - 2, this.faroR.tower.z + 3, Math.max(40, Math.min(500, p.level + 5)));
      e.maxHp = Math.round(e.maxHp * (1 + p.level / 50)); e.hp = e.maxHp; e.provoked = true; e.state = 'chase'; e.label.nm.textContent = `Capitán Morvane · Nv. ${e.level}`; this.faroTemps = [e];
    } });
    return FARO_TXT[F.part];
  };
  P.updateFaro = function () {
    if (!this.faroTemps) return;
    if (!inR(this, 'faro_maldito')) { for (const e of this.faroTemps) if (!e.removed) e.remove(); this.faroTemps = null; return; }
    if (!this.faroTemps.every((e) => e.dead || e.removed)) return;
    this.faroTemps = null; const F = this.faro;
    if (F.part === 2) { F.part = 3; this.toast('🗼 Faro Maldito (3/4): los marineros descansan... pero su capitán se acerca'); }
    else if (F.part === 3) { F.part = 4; this.faroLights(); this.player.gold += 40000; this.give('nucleo_estelar', 1); if (!this.ownCos('c_farol_maldito')) this.give('c_farol_maldito'); this.toast('🗼 ¡El Faro Maldito vuelve a brillar! Elara descansa. +40000 oro y la Capa de la Farera', 'area'); this.diaryNote && this.diaryNote('note', 'Liberé el alma de Elara en el Faro Maldito.'); sfx('quest'); }
  };
  P.leaveFaro = function () {
    const p = this.player, b = this.boat, f = this.faroFrom || { x: b.x, z: b.z, h: b.heading };
    Object.assign(b, { x: f.x, z: f.z, heading: f.h, docked: null }); p.x = b.x; p.z = b.z; this.board(true);
  };

  // ============================================================ fusión de armas
  P.registerFusion = function (f) {
    const A = EQUIP[f.a], B = EQUIP[f.b]; if (!A || !B) return;
    const look = { ...A.look, blade: B.look.blade || A.look.blade, bladeGlow: B.look.bladeGlow || B.look.blade, guard: B.look.guard || A.look.guard };
    EQUIP[f.id] = { ...A, name: f.name, atk: f.atk, look, fused: true, set: A.set || B.set };
    ITEMS[f.id] = { ...(ITEMS[f.a] || {}), name: f.name, atk: f.atk, look, icon: '⚒️', desc: `Fusión de ${A.name} y ${B.name}.` };
  };
  P.fusionMenu = function (opts) {
    const p = this.player, a = p.equip.weapon;
    if (!a || !EQUIP[a] || EQUIP[a].slot !== 'weapon') { opts.push({ label: '⚒️ (Equípate el arma base que quieres fusionar)', action: null }); return; }
    const others = Object.keys(p.inv).filter((k) => k !== a && p.inv[k] > 0 && EQUIP[k] && EQUIP[k].slot === 'weapon').sort((x, y) => (EQUIP[y].atk || 0) - (EQUIP[x].atk || 0)).slice(0, 10);
    for (const b of others) {
      const A = EQUIP[a], B = EQUIP[b], atk = Math.round(Math.max(A.atk, B.atk) * 1.12 + Math.min(A.atk, B.atk) * 0.1);
      opts.push({ label: `⚒️ Fusionar ${A.name} + ${B.name} → ${atk} de ataque (20000 oro)`, action: () => this.buy({ gold: 20000 }, () => {
        this.fusions = this.fusions || [];
        const f = { id: 'fusion_' + Date.now().toString(36), a, b, atk, name: `${A.name.replace(' ✦', '').split(' ').slice(0, 2).join(' ')}-${B.name.replace(' ✦', '').split(' ').pop()} fusionada` };
        this.registerFusion(f); this.fusions.push(f);
        p.inv[a] = Math.max(0, (p.inv[a] || 1) - 1); p.inv[b]--; p.inv[f.id] = 1; p.equip.weapon = f.id; p.recalc(); p.refreshLook();
        this.ring(p.x, p.z, 1.6, 0xffa040); this.toast(`⚒️ ¡Nace ${f.name}! (${atk} de ataque)`, 'area'); sfx('level');
      }) });
    }
    if (!others.length) opts.push({ label: '⚒️ (Necesitas otra arma en la mochila para fusionar)', action: null });
  };

  // ============================================================ expediciones de la tripulación
  P.expMenu = function () {
    this.exps = this.exps || [];
    const now = Date.now(), opts = [];
    for (const x of this.exps) { const left = Math.max(0, x.until - now); opts.push({ label: `🧭 ${x.names.join(', ')} · ${EXPED[x.k].name} · ${left > 0 ? `vuelven en ${Math.ceil(left / 60000)} min` : '¡de vuelta!'}`, action: null }); }
    const free = this.crew().filter((n) => !this.soc(n.id).exp && n.id !== 'hijo');
    if (free.length) EXPED.forEach((E, k) => opts.push({ label: `🧭 Enviar ${Math.min(3, free.length)} tripulante${free.length > 1 ? 's' : ''} a ${E.name}`, action: () => {
      const team = free.slice(0, 3);
      for (const n of team) { const s = this.soc(n.id); s.exp = true; s.expRole = s.role || null; s.role = 'exp'; }
      this.exps.push({ ids: team.map((n) => n.id), names: team.map((n) => n.name), k, until: Date.now() + E.h * 3600000 });
      this.toast(`🧭 ${team.map((n) => n.name).join(', ')} zarpan hacia ${E.name}`, 'area');
    } }));
    else if (!this.exps.length) opts.push({ label: '🧭 (Necesitas tripulación libre)', action: null });
    opts.push({ label: 'Cerrar', action: null });
    this.ui.openDialog('🧭 Expediciones', 'Manda hasta 3 tripulantes a explorar. El tiempo es real: vuelven aunque cierres el juego, con botín, experiencia e historias.', opts);
  };
  P.updateExped = function () {
    this.exps = this.exps || [];
    for (const x of this.exps) for (const id of x.ids) { const n = this.npcById(id); if (n) { n.model.root.visible = false; if (n.label && n.label.el) n.label.el.style.display = 'none'; } }
    const now = Date.now(), done = this.exps.filter((x) => now >= x.until);
    if (!done.length) return;
    this.exps = this.exps.filter((x) => now < x.until);
    for (const x of done) {
      const E = EXPED[x.k], p = this.player, got = [];
      p.gold += E.gold;
      for (let i = 0; i < 3; i++) { const it = E.items[Math.floor(Math.random() * E.items.length)]; const n = it === 'nucleo_estelar' ? 1 : 2 + Math.floor(Math.random() * 3); this.give(it, n); got.push(`${n} ${ITEMS[it].name.toLowerCase()}`); }
      const tale = EXP_TALES[Math.floor(Math.random() * EXP_TALES.length)];
      for (const id of x.ids) {
        const s = this.soc(id), n = this.npcById(id); s.exp = false; s.role = s.expRole || undefined; delete s.expRole;
        if (n) { n.model.root.visible = true; if (n.label && n.label.el) n.label.el.style.display = ''; n.setStats(Math.min(500, n.level + E.h)); s.lvl = n.level; this.placeNear(n, Math.round(p.x), Math.round(p.z)); if (this.crewMemory) this.crewMemory(n, `En la expedición ${tale}.`); }
      }
      this.ui.openDialog('🧭 ¡Vuelve la expedición!', `${x.names.join(', ')} vuelven de ${E.name}.<br>«Capitán, ${tale}.»<br><br>Botín: ${E.gold} oro, ${got.join(', ')}. Cada uno sube ${E.h} nivel${E.h > 1 ? 'es' : ''}.`, [{ label: '¡Bien hecho!', action: null }]);
      this.stats.exps = (this.stats.exps || 0) + 1;
      if (this.diaryNote) this.diaryNote('note', `Mi tripulación volvió de una expedición: ${tale}.`);
    }
  };

  // ============================================================ arena de bestias
  P.myBeast = function () {
    const out = [];
    if (this.dragonStage && this.dragonStage() === 3) out.push({ name: '🐉 Tu dragón real', lvl: 70 });
    if (this.petType && this.petLevel) out.push({ name: `🐾 Tu mascota (${this.petType})`, lvl: this.petLevel() });
    return out;
  };
  P.beastArena = function (opts) {
    const mine = this.myBeast(), rank = this.flags.beastRank || 0;
    if (!mine.length) { opts.push({ label: '🐾 (Necesitas una mascota o un dragón adulto)', action: null }); return 'La Arena de Bestias: aquí luchan las criaturas de los domadores.'; }
    if (rank >= TRAINERS.length) opts.push({ label: '🏆 Eres el campeón de la Arena de Bestias', action: null });
    else for (const b of mine) opts.push({ label: `⚔️ ${b.name} (Nv. ${b.lvl}) contra ${TRAINERS[rank].name} (Nv. ${TRAINERS[rank].lvl})`, action: () => this.beastFight(b, rank) });
    return `La Arena de Bestias: vence a los 5 domadores en orden (${rank}/5). Tus criaturas pelean solas; gana el nivel, pero también la suerte.`;
  };
  P.beastFight = function (b, rank) {
    if (this.flags.beastDay === this.day && this.flags.beastTries >= 3) return this.toast('🐾 Tus criaturas están cansadas: 3 combates al día');
    if (this.flags.beastDay !== this.day) { this.flags.beastDay = this.day; this.flags.beastTries = 0; }
    this.flags.beastTries++;
    const Tr = TRAINERS[rank];
    let hp = 100 + b.lvl * 20, ehp = 100 + Tr.lvl * 20;
    const log = [];
    for (let r = 1; r <= 12 && hp > 0 && ehp > 0; r++) {
      const d1 = Math.round((10 + b.lvl * 3) * (0.7 + Math.random() * 0.6)), d2 = Math.round((10 + Tr.lvl * 3) * (0.7 + Math.random() * 0.6));
      ehp -= d1; if (ehp > 0) hp -= d2;
      if (r <= 4 || hp <= 0 || ehp <= 0) log.push(`Ronda ${r}: ${b.name.split(' ').pop()} hace ${d1}${ehp > 0 ? `, recibe ${d2}` : ''}.`);
    }
    const win = ehp <= 0 || (hp > 0 && hp / (100 + b.lvl * 20) > ehp / (100 + Tr.lvl * 20));
    if (win) { this.flags.beastRank = rank + 1; const gold = 2000 * (rank + 1); this.player.gold += gold; if (rank + 1 === TRAINERS.length && !this.ownCos('c_corona_bestias')) this.give('c_corona_bestias'); sfx('quest'); }
    this.ui.openDialog(`🐾 ${b.name} vs ${Tr.name}`, `${log.join('<br>')}<br><br>${win ? `🏆 ¡Victoria! +${2000 * (rank + 1)} oro${rank + 1 === TRAINERS.length ? ' y la Corona de las Bestias: ¡eres el campeón!' : ''}` : '💥 Derrota... entrena a tu criatura y vuelve.'}`, [{ label: 'Cerrar', action: null }]);
  };

  // ============================================================ mapa estelar
  const TELESCOPE = { x: 40, z: 45 };
  P.telescopeSpot = function () {
    if (this._ts) return this._ts;
    for (let r = 0; r < 8; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) { const x = TELESCOPE.x + dx, z = TELESCOPE.z + dz; if (this.W.walkable(x, z)) return (this._ts = { x, z }); }
    return (this._ts = TELESCOPE);
  };
  P.buildTelescope = function () {
    if (this.telG) return; const s = this.telescopeSpot(), g = new THREE.Group();
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 1, 6), M(0x6a4a2a)); leg.position.set(s.x + 0.8, 0.5, s.z); g.add(leg);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.1, 10), M(0xd8a838)); tube.position.set(s.x + 0.8, 1.15, s.z); tube.rotation.z = 0.9; g.add(tube);
    this.scene.add(g); this.telG = g;
  };
  P.isNight = function () { return this.tod >= 20 || this.tod < 5; };
  P.starMenu = function () {
    if (!this.isNight()) return this.toast('🔭 Vuelve de noche (de las 20:00 a las 5:00) para ver las estrellas');
    const C = CONSTELLATIONS[this.day % CONSTELLATIONS.length];
    this.stars = this.stars || [];
    if (this.flags.starDay === this.day) return this.toast(`🔭 Ya uniste ${C.name} esta noche`);
    const order = [...C.stars].sort((a, b) => b[1] - a[1]).map((s) => s[0]), picked = [];
    const ask = () => {
      const left = C.stars.filter((s) => !picked.includes(s[0])).sort(() => Math.random() - 0.5);
      this.ui.openDialog(`🔭 ${C.name}`, `Une las estrellas de la más brillante a la más débil.<br>${C.stars.map((s) => `${s[0]} ${'★'.repeat(s[1])}`).join(' · ')}<br>Llevas: ${picked.join(' → ') || '—'}`, left.map((s) => ({ label: `✦ ${s[0]}`, action: () => {
        picked.push(s[0]);
        if (picked[picked.length - 1] !== order[picked.length - 1]) { this.flags.starDay = this.day; return this.toast('🔭 La constelación se desvanece... prueba mañana'); }
        if (picked.length === order.length) {
          this.flags.starDay = this.day; this.addBuff(C.buff, 1200);
          if (!this.stars.includes(C.id)) this.stars.push(C.id);
          this.toast(`✨ ¡Has unido ${C.name}! ${BUFFS[C.buff].name} (20 min) · ${this.stars.length}/5 constelaciones`, 'area'); sfx('level');
          if (this.stars.length === 5 && !this.ownCos('c_capa_estrellas')) this.give('c_capa_estrellas');
          return;
        }
        ask();
      } })));
    };
    ask();
  };

  // ============================================================ Isla de los Relojes
  P.enterClock = function () {
    const p = this.player, R = this.clockR;
    this.clockReturn = { x: p.x, z: p.z, tod: this.tod };
    R.night = false; this.buildClock(); this.clockVis();
    tpTo(this, R.exit.x + 1, R.exit.z);
    this.toast('⏰ La Isla de los Relojes: las puertas cambian entre el día y la noche. Usa las palancas para llegar al cofre', 'area');
  };
  P.buildClock = function () {
    if (this.clockG) return;
    const R = this.clockR, g = new THREE.Group(); R.gateM = [];
    const fl = new THREE.Mesh(new THREE.BoxGeometry(KW + 2, 0.2, KD + 2), M(0x8a7a6a)); fl.position.set(KX0 + KW / 2 - 0.5, -0.1, KZ0 + KD / 2 - 0.5); g.add(fl);
    for (const G of GATES) for (let z = 0; z < KD; z++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.6, 0.9), M(G.open === 'd' ? 0x2a2a6a : 0xe8c060, { transparent: true })); b.position.set(KX0 + G.x, 0.8, KZ0 + z); b.userData.gate = G; g.add(b); R.gateM.push(b); }
    for (let x = 0; x < KW; x += 3) for (const z of [0, KD - 1]) { if (GATES.some((G) => G.x === x)) continue; const c = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.8), M(0x6a5a4a)); c.position.set(KX0 + x, 0.6, KZ0 + z); g.add(c); }
    for (const L of LEVERS) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 6), M(0xd8a838)); l.position.set(KX0 + L.x, 0.45, KZ0 + L.z); l.rotation.z = 0.5; g.add(l); }
    const ch = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.55), M(0xd8a838, { emissive: 0x4a3000 })); ch.position.set(R.chest.x, 0.25, R.chest.z); g.add(ch);
    const clk = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.2, 24), M(0xf4ecd8)); clk.rotation.x = Math.PI / 2; clk.position.set(KX0 + 11, 3, KZ0 - 1.5); g.add(clk); R.hand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 0.05), M(0x1a1a1a)); R.hand.position.set(KX0 + 11, 3, KZ0 - 1.35); g.add(R.hand);
    this.scene.add(g); this.clockG = g;
  };
  P.clockVis = function () {
    const R = this.clockR;
    for (const b of R.gateM || []) { const solid = (b.userData.gate.open === 'd') === R.night; b.material.opacity = solid ? 1 : 0.15; b.scale.y = solid ? 1 : 0.15; }
    if (R.hand) R.hand.rotation.z = R.night ? Math.PI : 0;
    if (inR(this, 'relojes')) this.tod = R.night ? 23 : 12;
  };
  P.clockToggle = function () { const R = this.clockR; R.night = !R.night; this.clockVis(); this.ring(this.player.x, this.player.z, 1.4, R.night ? 0x5a5ad8 : 0xffd040); this.toast(R.night ? '🌙 Se hace de noche: las puertas doradas se abren' : '☀️ Se hace de día: las puertas azules se abren'); sfx('click'); };
  P.leaveClock = function () { const r = this.clockReturn || { x: 50, z: 52, tod: 12 }; this.tod = r.tod; tpTo(this, r.x, r.z); };

  // ============================================================ cocina de leyenda y restaurante
  P.chefMenu = function (opts) {
    const p = this.player;
    for (const Dh of DISHES) opts.push({ label: `${Dh.name} · ${Object.entries(Dh.need).map(([k, n]) => `${n} ${ITEMS[k] ? ITEMS[k].name.toLowerCase() : k} (${p.inv[k] || 0})`).join(', ')}`, action: () => this.buy(Dh.need, () => { this.addBuff(Dh.buff, 3600); this.stats.dishes = (this.stats.dishes || 0) + 1; this.toast(`👨‍🍳 ¡${Dh.name.split(' (')[0]}! Te dura 1 hora`, 'area'); sfx('quest'); }) });
    return 'Soy el Chef Aurelio. Con ingredientes de todas las islas cocino platos de leyenda cuyo efecto dura una hora entera.';
  };
  P.restSpot = function () { const R = this.vilR && this.vilR(); return R ? { x: R.center.x - 4, z: R.center.z + 4 } : null; };
  P.restMenu = function () {
    const v = this.vil; if (!v || !v.founded) return;
    const r = (v.rest = v.rest || { built: false, stock: {}, earned: 0, rating: 3 });
    if (!r.built) return this.ui.openDialog('🍽 Solar para un restaurante', 'Construye un restaurante en tu aldea. Llénalo de platos de tu mochila y cada día los clientes pagarán el triple de lo que valen.', [{ label: '🍽 Construir (30000 oro)', action: () => this.buy({ gold: 30000 }, () => { r.built = true; r.day = this.day; this.buildRest(); this.toast('🍽 ¡Tu restaurante abre sus puertas!', 'area'); sfx('quest'); }) }, { label: 'Ahora no', action: null }]);
    const p = this.player, opts = [];
    const foods = Object.keys(p.inv).filter((k) => p.inv[k] > 0 && ITEMS[k] && ITEMS[k].type === 'food').sort((a, b) => (ITEMS[b].value || 0) - (ITEMS[a].value || 0)).slice(0, 8);
    for (const k of foods) opts.push({ label: `➕ Llevar ${ITEMS[k].icon || ''} ${ITEMS[k].name} ×${p.inv[k]} (cada uno se vende a ${(ITEMS[k].value || 1) * 3} oro)`, action: () => { r.stock[k] = (r.stock[k] || 0) + p.inv[k]; p.inv[k] = 0; this.toast('🍽 Platos a la despensa'); } });
    if (r.earned > 0) opts.push({ label: `💰 Recoger la caja (${r.earned} oro)`, action: () => { p.gold += r.earned; r.earned = 0; sfx('coin'); } });
    opts.push({ label: 'Cerrar', action: null });
    const st = Object.entries(r.stock).filter(([, n]) => n > 0).map(([k, n]) => `${ITEMS[k].name} ×${n}`).join(', ') || 'vacía';
    this.ui.openDialog('🍽 Tu restaurante', `Valoración: ${'⭐'.repeat(r.rating)}<br>Despensa: ${st}<br>Cada día se venden hasta 12 platos (más con mejor valoración y si tienes al Chef Aurelio de visita en la aldea).`, opts);
  };
  P.buildRest = function () {
    if (this.restG) this.scene.remove(this.restG);
    const v = this.vil, s = this.restSpot(); if (!v || !v.rest || !v.rest.built || !s) return;
    const g = new THREE.Group();
    const b = new THREE.Mesh(new THREE.BoxGeometry(3, 1.6, 2.2), M(0xf0e0c0)); b.position.set(s.x - 1.5, 0.8, s.z + 1.5); g.add(b);
    const r = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.3, 2.6), M(0xc83a2a)); r.position.set(s.x - 1.5, 1.75, s.z + 1.5); g.add(r);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.06), M(0x3a2a1a)); sign.position.set(s.x - 1.5, 1.3, s.z + 0.35); g.add(sign);
    this.scene.add(g); this.restG = g;
  };
  P.restDaily = function () {
    const v = this.vil, r = v && v.rest; if (!r || !r.built || r.day === this.day) return;
    const days = Math.min(7, this.day - (r.day ?? this.day)); r.day = this.day;
    for (let d = 0; d < days; d++) {
      let cap = 8 + r.rating * 2, sold = 0, variety = 0;
      for (const k of Object.keys(r.stock)) { if (cap <= 0) break; const n = Math.min(r.stock[k], cap); if (n > 0) variety++; r.stock[k] -= n; cap -= n; sold += n; r.earned += n * (ITEMS[k].value || 1) * 3; }
      r.rating = Math.max(1, Math.min(5, sold === 0 ? r.rating - 1 : variety >= 3 ? r.rating + 1 : r.rating));
    }
  };

  // ============================================================ jefe mundial semanal
  P.updateWorldBoss = function () {
    const w = Math.floor(this.day / 7), p = this.player;
    if (p.level < 30 || this.net.isClient && this.net.active) return;
    const W = this.wboss;
    if (!W || W.week !== w) {
      const docks = this.docks.filter((d) => d.id !== 'salitre'), d = docks[(w * 7 + 3) % docks.length];
      this.wboss = { week: w, dock: d.id, isle: d.name, x: d.land.x, z: d.land.z, done: false };
      this.toast(`🌋 ¡El Behemot de la Bruma ha despertado en ${d.name}! Jefe mundial de esta semana`, 'area');
      return;
    }
    if (W.done || W.e || this.sailing || Math.hypot(p.x - W.x, p.z - W.z) > 22) return;
    for (let i = 0; i < 40; i++) { const x = Math.round(W.x + (Math.random() - 0.5) * 14), z = Math.round(W.z + (Math.random() - 0.5) * 14); if (!this.W.walkable(x, z) || Math.hypot(x - p.x, z - p.z) < 5) continue; const e = this.spawnTemp('behemot', x, z, Math.min(500, Math.max(50, p.level + 10))); e.wboss = true; e.provoked = true; e.state = 'chase'; W.e = e; this.toast('🌋 ¡El suelo tiembla! ¡El Behemot de la Bruma!', 'area'); this.camShake = 0.8; return; }
  };
  P.worldBossTick = function () {
    const W = this.wboss; if (!W || !W.e) return;
    if (W.e.dead) { W.done = true; W.e = null; const p = this.player; p.gold += 80000; this.give('nucleo_estelar', 2); this.give('escama_leyenda', 1); this.stats.wboss = (this.stats.wboss || 0) + 1; if (!this.ownCos('c_cuernos_behemot')) this.give('c_cuernos_behemot'); this.toast('🏆 ¡Has derrotado al Behemot de la Bruma! +80000 oro, 2 núcleos estelares y una escama legendaria', 'area'); this.net.sendX({ k: 'toast', msg: '🌋 ¡El Behemot de la Bruma ha caído!' }); sfx('quest'); }
    else if (W.e.removed) W.e = null;
  };

  // ============================================================ nave fantasma
  const baseBlocked = P.shipBlocked;
  P.shipBlocked = function (x, z, h) { if (this.flags.ghostOn && this.sailing) return x < -104 || z < -104 || x > 244 || z > 244; return baseBlocked.call(this, x, z, h); };
  P.ghostToggle = function () {
    this.flags.ghostOn = !this.flags.ghostOn;
    this.ship.traverse((k) => { if (k.isMesh && k.material) { if (!k.userData.ghMat) { k.userData.ghMat = k.material; k.userData.ghClone = k.material.clone(); k.userData.ghClone.transparent = true; k.userData.ghClone.opacity = 0.45; if (k.userData.ghClone.color) k.userData.ghClone.color.lerp(new THREE.Color(0x7af0e0), 0.6); } k.material = this.flags.ghostOn ? k.userData.ghClone : k.userData.ghMat; } });
    this.toast(this.flags.ghostOn ? '👻 ¡La nave fantasma! Atraviesas islas y rocas' : '⛵ Tu barco vuelve a ser de madera', 'area');
    if (!this.flags.ghostOn && this.shipBlocked(this.boat.x, this.boat.z, this.boat.heading)) { const d = this.nearDockAny ? this.nearDockAny() : this.docks[0]; this.boat.x = d.shipX; this.boat.z = d.shipZ; this.toast('⚓ Tu barco reaparece en un muelle'); }
  };
  const baseSail = P.sailMenu;
  P.sailMenu = function () {
    baseSail.call(this);
    if ((this.stats.k_almirante_muerto || 0) > 0) { const box = document.getElementById('dopts'), b = document.createElement('button'); b.textContent = this.flags.ghostOn ? '⛵ Volver al barco de madera' : '👻 Usar la nave fantasma'; b.onclick = () => { this.ui.closeDialog(); this.ghostToggle(); }; box.insertBefore(b, box.firstChild); }
  };

  // ============================================================ enganches
  P.npcDialog17 = function (id, opts) {
    if (id === 'elara') return this.faroDialog(opts);
    if (id === 'ingrid') { this.fusionMenu(opts); return 'Soy Ingrid, maestra forjadora. Dame dos armas y forjaré una nueva que tenga lo mejor de las dos.'; }
    if (id === 'kazu') return this.beastArena(opts);
    if (id === 'aurelio') return this.chefMenu(opts);
    if (id === 'oraculo') opts.push({ label: '⏰ Isla de los Relojes (puzle diario)', action: () => this.enterClock() });
    return null;
  };
  P.contextAction17 = function () {
    if (this.sailing) return null;
    const p = this.player;
    if (inR(this, 'faro_maldito')) {
      if (near(p, this.faroR.exit, 1.8)) return { icon: '⛵', label: 'Zarpar', fn: () => this.leaveFaro() };
      const F = this.faro || { part: 0, lit: [] };
      if (F.part === 1) { const i = this.faroR.braziers.findIndex((b) => near(p, b, 1.6)); if (i >= 0 && !F.lit.includes(i)) return { icon: '🔥', label: 'Encender', fn: () => { F.lit.push(i); this.faroLights(); this.ring(p.x, p.z, 1, 0xff8a20); if (F.lit.length === 3) { F.part = 2; this.toast('🗼 Faro Maldito (2/4): los braseros arden... algo se mueve en la niebla. Habla con Elara', 'area'); } sfx('click'); } }; }
      return null;
    }
    if (inR(this, 'relojes')) {
      const R = this.clockR;
      if (near(p, R.exit, 1.8)) return { icon: '🚪', label: 'Salir', fn: () => this.leaveClock() };
      for (const L of LEVERS) if (near(p, { x: KX0 + L.x, z: KZ0 + L.z }, 1.6)) return { icon: R.night ? '☀️' : '🌙', label: 'Palanca', fn: () => this.clockToggle() };
      if (near(p, R.chest, 1.6) && this.flags.clockDay !== this.day) return { icon: '📦', label: 'Cofre', fn: () => { this.flags.clockDay = this.day; p.gold += 15000; this.give('nucleo_estelar', 1); if (!this.ownCos('c_reloj_arena')) this.give('c_reloj_arena'); this.toast('⏰ ¡Puzle resuelto! +15000 oro y un núcleo estelar', 'area'); sfx('quest'); } };
      return null;
    }
    if (near(p, this.telescopeSpot(), 1.8)) return { icon: '🔭', label: 'Estrellas', fn: () => this.starMenu() };
    const rs = this.restSpot && this.vil && this.vil.founded && this.zoneOf && this.zoneOf() && this.zoneOf().zone === 'aldea' ? this.restSpot() : null;
    if (rs && near(p, rs, 2)) return { icon: '🍽', label: 'Restaurante', fn: () => this.restMenu() };
    return null;
  };
  P.updateMore17 = function (dt) {
    if (!this.npcById('ingrid')) npcAt(this, 'ingrid', 'Maestra forjadora Ingrid', 57, 49, { shirt: 0x6a3a2a, pants: 0x2a2a2a, apron: 0x3a2a1a, hair: 0xd85a2a, longHair: true, female: true, skin: 0xe8b890, axe: true }, 150);
    if (!this.npcById('kazu')) npcAt(this, 'kazu', 'Domador Kazu', 47, 58, { shirt: 0x8a5a2a, pants: 0x3a2a1a, hat: 'straw', hair: 0x1a1a1a, skin: 0xc68a5a, beard: 0x1a1a1a }, 80);
    if (!this.npcById('aurelio')) npcAt(this, 'aurelio', 'Chef Aurelio', 53, 47, { shirt: 0xf4f4f4, pants: 0x2a2a2a, apron: 0xf4f4f4, hat: 'chef', hair: 0x6a4a2a, beard: 0x6a4a2a, skin: 0xe0aa80 }, 40);
    if (!this.m17init) { this.m17init = true; for (const f of this.fusions || []) this.registerFusion(f); if ((this.fusions || []).length) { this.player.recalc(); this.player.refreshLook(); } this.buildTelescope(); if (this.vil && this.vil.rest) this.buildRest(); }
    this.m17T = (this.m17T || 0) - dt;
    if (this.m17T <= 0) { this.m17T = 1; this.updateExped(); this.updateWorldBoss(); this.restDaily(); }
    this.updateFaro(); this.worldBossTick();
    if (inR(this, 'relojes')) this.tod = this.clockR.night ? 23 : 12;
  };
  P.newsHtml17 = function () {
    const W = this.wboss;
    return `<div class="sub">🆕 v5.5</div><ul class="qlist">
      <li>🌋 Jefe mundial: ${W ? `Behemot en ${W.isle} ${W.done ? '(¡vencido!)' : ''}` : '—'} · 🗼 Faro Maldito: ${(this.faro && this.faro.part) || 0}/4 (aparece con niebla al oeste)</li>
      <li>🧭 Expediciones: ${(this.exps || []).length} en marcha · 🐾 Arena de Bestias: ${this.flags.beastRank || 0}/5 · 🔭 Constelaciones: ${(this.stars || []).length}/5</li>
      <li>⚒️ Armas fusionadas: ${(this.fusions || []).length} · 🍽 Restaurante: ${this.vil && this.vil.rest && this.vil.rest.built ? '⭐'.repeat(this.vil.rest.rating) : 'no'}</li></ul>`;
  };
}
export { FOG_SPOT };

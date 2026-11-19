// v5.4: Atlántida (Coralia que crece), barco volador, diario de viaje, gremio de cazadores, estaciones que cambian
// una zona de la isla (cueva helada en invierno), armas con alma, aldea propia, bestias legendarias del mar,
// mercado entre jugadores, carreras de dragones, biblioteca antigua y moral/fiestas de la tripulación.
import * as THREE from 'three';
import { makeIslet, populate } from './regions.js';
import { T } from './world.js';
import { ITEMS, EQUIP } from './items.js';
import { BUFFS } from './skills.js';
import { ZONES } from './more13.js';

BUFFS.atlante = { name: '🔱 Bendición atlante', def: 1.15, atk: 1.1 };
BUFFS.fiesta = { name: '🎉 Fiesta', xp: 1.1 };

const CX = 2100, CZ = 0;
const ATL_SPOT = { x: CX + 5, z: CZ + 21 };
const ATL = [
  { name: 'Plaza de Atlántida', cost: { gold: 5000, coral: 10, perla: 3 }, desc: 'La plaza vuelve a brillar.' },
  { name: 'Mercado atlante', cost: { gold: 15000, coral: 20, escama: 10 }, desc: 'Vende perlas y pociones mayores.' },
  { name: 'Templo del Tridente', cost: { gold: 40000, perla: 10, ambar_gris: 2 }, desc: 'Una vez al día, la Bendición atlante (+10% ataque, +15% defensa, 10 min).' },
  { name: 'Palacio de Coral', cost: { gold: 80000, escama_lava: 10, nucleo_estelar: 1 }, desc: 'Los atlantes te pagan tributo cada día.' },
  { name: 'Corona de Atlántida', cost: { gold: 150000, nucleo_estelar: 3 }, desc: 'La ciudad renace del todo: Corona de Atlántida y el doble de tributo.' },
];
const SOUL_TECH = {
  vampiro: '🩸 Vampiro: te curas un 4% del daño que haces',
  tormenta: '⚡ Tormenta: 12% de soltar un rayo extra (×1,5)',
  eco: '🔁 Eco: 15% de golpear dos veces',
  furia: '😡 Furia: +20% de daño con menos de media vida',
  verdugo: '🪓 Verdugo: +30% de daño a enemigos con menos del 30% de vida',
  impacto: '💥 Impacto: los críticos hacen +30%',
};
const VILLAGERS = {
  vil_herrero: { name: 'Herrero Brom', role: 'Herrero: +5% de ataque para ti', look: { shirt: 0x5a3a2a, pants: 0x2a2a2a, apron: 0x3a2a1a, beard: 0x6a3a1a, skin: 0xd09a70, hammer: true } },
  vil_granjera: { name: 'Granjera Liv', role: 'Granjera: comida cada día', look: { shirt: 0x7aa04a, pants: 0x5a4a2a, hat: 'straw', hair: 0xd8a040, longHair: true, female: true, skin: 0xf0c49a } },
  vil_curandera: { name: 'Curandera Sela', role: 'Curandera: 3 pociones cada día', look: { shirt: 0xe8e8f0, robe: 0xe8e8f0, hair: 0x2a1a10, longHair: true, female: true, skin: 0xc68a5a } },
  vil_mercader: { name: 'Mercader Otto', role: 'Mercader: +1500 oro cada día', look: { shirt: 0x8a2a6a, coat: true, hat: 'tricorn', capColor: 0x3a1a3a, beard: 0x8a8a8a, skin: 0xe0aa80 } },
  vil_minera: { name: 'Minera Gala', role: 'Minera: menas cada día', look: { shirt: 0x6a6a6a, pants: 0x3a3a3a, hat: 'helmet', hatColor: 0xd8a838, hair: 0x6a3a1a, female: true, skin: 0xd09a70 } },
  vil_bardo: { name: 'Bardo Pim', role: 'Bardo: +10% experiencia', look: { shirt: 0xd84a4a, pants: 0x3a5a8a, hat: 'feather', feather: 0x4ad84a, hair: 0xd8a040, skin: 0xf0c49a } },
  vil_guardia1: { name: 'Guardia Dorn', role: 'Guardia: menos asaltantes', look: { armor: true, armorColor: 0x8a8a90, hat: 'helmet', hatColor: 0x8a8a90, sword: true, shield: { type: 'round', color: 0x6a4a2a, rim: 0xc0c0c0 }, skin: 0xe0aa80, beard: 0x3a2a1a } },
  vil_guardia2: { name: 'Guardia Kira', role: 'Guardia: menos asaltantes', look: { armor: true, armorColor: 0x7a8aa0, hat: 'helmet', hatColor: 0x7a8aa0, spear: true, skin: 0xa86a3a, hair: 0x1a1a1a, female: true } },
};
const SEA_LEGENDS = {
  leviatan_tormenta: { name: '⚡ Leviatán de la Tormenta', col: 0x3a4a8a, cond: (g) => g.weather === 'storm' },
  ballena_luna: { name: '🌙 Ballena de la Luna', col: 0xd8e0ff, cond: (g) => (g.tod >= 21 || g.tod < 5) && (g.weather || 'clear') === 'clear' },
  serpiente_hielo: { name: '❄️ Serpiente de Hielo', col: 0x8ad8ff, cond: (g) => g.weather === 'snow' || g.season() === 3 },
  kraken_bruma: { name: '🌫 Kraken de la Bruma', col: 0x8a8a9a, cond: (g) => g.weather === 'fog' },
};
const BOOKS = [
  ['cronica1', 'Crónicas del Mar I', 'Antes de la Bruma, el mar era un espejo. Los primeros marinos lo cruzaban guiándose por las estrellas, hasta que una noche las estrellas se apagaron.'],
  ['cronica2', 'Crónicas del Mar II', 'La niebla llegó con un canto. Dicen que nació en el corazón del Vacío, cuando Nihil abrió los ojos por primera vez.'],
  ['cronica3', 'Crónicas del Mar III', 'Los reyes de Coralia sellaron la ciudad bajo el agua para protegerla. Su tridente se partió en cinco pedazos.'],
  ['cronica4', 'Crónicas del Mar IV', 'Quien una los cinco pedazos devolverá la luz a Atlántida y verá el fondo del mar como era antes.'],
  ['guerra1', 'Tratado de guerra I', 'Un buen golpe no nace del brazo, sino de los pies. Pisa firme y el acero te seguirá.'],
  ['guerra2', 'Tratado de guerra II', 'El Armamento Espiritual es la voluntad hecha armadura. Los antiguos lo usaban para detener balas de cañón.'],
  ['guerra3', 'Tratado de guerra III', 'Los dragones respetan a quien no huye. Por eso los domadores entrenan años mirando al fuego.'],
  ['guerra4', 'Tratado de guerra IV', 'La mayor fuerza de un capitán es su tripulación. Ningún pirata ha vencido solo al mar.'],
  ['faro1', 'Diario del Farero I', 'Hoy he visto una ballena blanca bajo la luna. Brillaba como si llevara el cielo dentro.'],
  ['faro2', 'Diario del Farero II', 'Las tormentas traen algo enorme. Los relámpagos iluminan escamas del tamaño de una vela.'],
  ['faro3', 'Diario del Farero III', 'En invierno, el viento abre una cueva junto a Villarroca. Dentro hace un frío que no es de este mundo.'],
  ['faro4', 'Diario del Farero IV', 'Mi faro seguirá encendido. Mientras haya luz, los barcos sabrán volver a casa.'],
].map(([id, title, text]) => ({ id, title, text }));
const BOOK_SETS = [['cronica', '+5% experiencia', 'xp'], ['guerra', '+5% ataque', 'atk'], ['faro', '+5% defensa', 'def']];
const HUNT_POOL = ['wolf', 'boar', 'tiger', 'golem', 'yeti', 'lobo_nieve', 'dragon_menor', 'grifo', 'lobo_ancestral', 'demonio_alado', 'caballero_infernal', 'hongo_andante', 'cangrejo_coloso', 'dragon_salvaje', 'centinela_vacio'];
const HUNTERS = ['Ruda la Arquera', 'Tomás Garfio', 'Nuri Colmillo', 'Bastián el Tuerto', 'Lia Tormenta'];

const VIL = { id: 'aldea', name: 'Tu aldea', ox: 5100, oz: 0, N: 50, seed: 719, biome: null, lvl: 30, giver: null, bg: 0x8fc6e8, enemies: [], plane: { color: 0x2a6a9a, transparent: true, opacity: 0.95 } };
Object.assign(ZONES, { aldea: VIL });
export function makeVillage() {
  const R = makeIslet({ ...VIL, dockDir: [-1, 0] });
  R.portal = true; R.zone = 'aldea';
  const { x: cx, z: cz } = R.center;
  R.towns.push({ name: 'Tu aldea', x: cx, z: cz, r: 10 }); R.reserve(cx, cz, 11);
  R.props.push({ type: 'well', x: cx, z: cz - 2, rot: 0 }); R.block(cx, cz - 2);
  R.arrive = { x: cx - 3, z: cz + 1 };
  populate(R, 0.5);
  return R;
}
// cueva helada de invierno
const IX0 = 6400, IZ0 = 0, IW = 16, ID = 12;
export function makeIceCave() {
  const inb = (lx, lz) => lx >= 0 && lz >= 0 && lx < IW && lz < ID;
  const R = { kind: 'dungeon', id: 'cueva_helada', name: 'Cueva Helada', X: IX0, Z: IZ0, exit: { x: IX0 + 1, z: IZ0 + 6 }, spawns: [], chest: { id: 'helada_cofre', x: IX0 + 14, z: IZ0 + 6 } };
  R.contains = (x, z) => x >= IX0 - 1 && x <= IX0 + IW && z >= IZ0 - 1 && z <= IZ0 + ID;
  R.tile = (x, z) => (inb(x - IX0, z - IZ0) ? T.SNOW : T.WATER);
  R.walkable = (x, z) => inb(x - IX0, z - IZ0) && !(x === R.chest.x && z === R.chest.z);
  R.setBlocked = () => {}; R.groundY = () => 0; R.areaName = () => 'Cueva Helada';
  return R;
}
const SEASON_SPOT = { x: 60, z: 46 };

export function installMore16(Game, D) {
  const P = Game.prototype;
  const sfx = D.sfx;
  const M = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
  const near = (p, s, r = 2) => s && Math.hypot(p.x - s.x, p.z - s.z) < r;
  const tpTo = (g, x, z) => { const p = g.player; p.x = x; p.z = z; p.path = []; for (const n of g.following()) g.placeNear(n, Math.round(x), Math.round(z)); g.camTarget.set(x, 0, z); };
  const npcAt = (g, id, name, x, z, look, lvl = 100) => { if (g.npcById(id)) return g.npcById(id); const n = new D.NPC(g, { id, name, x, z, wander: 1, look }); n.baseLevel = lvl; n.setStats(lvl); g.placeNear(n, x, z); g.npcs.push(n); return n; };

  // ============================================================ diario de viaje
  P.diaryNote = function (k, v = 1) {
    const d = (this.diary = this.diary || { list: [] });
    if (!d.cur || d.cur.day !== this.day) {
      if (d.cur) { d.list.unshift({ day: d.cur.day, text: this.diaryText(d.cur) }); d.list = d.list.slice(0, 20); }
      d.cur = { day: this.day, kills: 0, bosses: [], places: [], gold0: this.player.gold, lv0: this.player.level, notes: [] };
    }
    const c = d.cur;
    if (k === 'kill') c.kills += v;
    else if (k === 'boss' && !c.bosses.includes(v)) c.bosses.push(v);
    else if (k === 'place' && !c.places.includes(v) && c.places.length < 8) c.places.push(v);
    else if (k === 'note' && c.notes.length < 6) c.notes.push(v);
  };
  P.diaryText = function (c) {
    const p = this.player, parts = [];
    if (c.places.length) parts.push(`Viajé por ${c.places.join(', ')}.`);
    if (c.kills) parts.push(`Vencí a ${c.kills} enemigo${c.kills > 1 ? 's' : ''}${c.bosses.length ? ` y a ${c.bosses.join(', ')}` : ''}.`);
    const g = p.gold - c.gold0; if (g > 0) parts.push(`Gané ${g} de oro.`);
    const l = p.level - c.lv0; if (l > 0) parts.push(`Subí ${l} nivel${l > 1 ? 'es' : ''}.`);
    parts.push(...c.notes);
    return parts.length ? parts.join(' ') : 'Un día tranquilo en la Bruma.';
  };
  P.diaryMenu = function () {
    this.diaryNote('tick', 0);
    const d = this.diary, s = this.soulOf();
    const txt = [`📔 Hoy (día ${this.day}): ${this.diaryText(d.cur)}`, ...d.list.slice(0, 6).map((e) => `📅 Día ${e.day}: ${e.text}`)].join('<br><br>');
    this.ui.openDialog('📔 Diario de viaje', `Moral de la tripulación: ${Math.round(this.morale ?? 50)}/100<br>${s ? `Alma de tu arma: nivel ${s.lvl}${s.t.length ? ' · ' + s.t.map((k) => SOUL_TECH[k].split(':')[0]).join(', ') : ''}` : ''}<br><br>${txt}`, [{ label: 'Cerrar', action: null }]);
  };

  // ============================================================ armas con alma
  P.soulOf = function () { const id = this.player.equip.weapon; if (!id || !EQUIP[id]) return null; this.soul = this.soul || {}; return (this.soul[id] = this.soul[id] || { xp: 0, lvl: 0, t: [] }); };
  P.soulGain = function (e) {
    const s = this.soulOf(); if (!s) return;
    s.xp += Math.max(1, Math.round((e.level || 1) / 10)) * (e.def && e.def.boss ? 20 : 1);
    const lvl = Math.min(20, Math.floor(Math.sqrt(s.xp / 8)));
    if (lvl > s.lvl) { s.lvl = lvl; this.toast(`⚔️ El alma de tu arma crece: nivel ${lvl} (+${lvl}% de daño)`); if (lvl >= 5 * (s.t.length + 1) && s.t.length < 3) setTimeout(() => this.soulPick(), 400); }
  };
  P.soulPick = function () {
    const s = this.soulOf(); if (!s || s.t.length >= 3 || s.lvl < 5 * (s.t.length + 1)) return;
    const left = Object.keys(SOUL_TECH).filter((k) => !s.t.includes(k)), opts = [];
    for (let i = 0; i < 3 && left.length; i++) { const k = left.splice(Math.floor(Math.random() * left.length), 1)[0]; opts.push({ label: SOUL_TECH[k], action: () => { s.t.push(k); this.toast(`⚔️ Tu arma aprende ${SOUL_TECH[k].split(':')[0]}`, 'area'); sfx('level'); } }); }
    this.ui.openDialog('⚔️ El alma de tu arma despierta', `Tu ${EQUIP[this.player.equip.weapon].name} puede aprender una técnica (${s.t.length + 1}/3). Elige:`, opts);
  };
  P.soulMenu = function () {
    const s = this.soulOf(); if (!s) return this.toast('Equípate un arma');
    const next = Math.pow(s.lvl + 1, 2) * 8;
    const o = [];
    if (s.t.length < 3 && s.lvl >= 5 * (s.t.length + 1)) o.push({ label: '✨ Elegir técnica', action: () => this.soulPick() });
    o.push({ label: 'Cerrar', action: null });
    this.ui.openDialog(`⚔️ Alma: ${EQUIP[this.player.equip.weapon].name}`, `Nivel ${s.lvl}/20 (+${s.lvl}% de daño) · experiencia ${s.xp}${s.lvl < 20 ? '/' + next : ''}<br>Técnicas (a nivel 5, 10 y 15):<br>${s.t.length ? s.t.map((k) => SOUL_TECH[k]).join('<br>') : 'ninguna todavía'}<br><br>Cada arma tiene su propia alma: crece al vencer enemigos con ella.`, o);
  };

  // ============================================================ daño: alma, moral, biblioteca, gremio, trofeos del diario
  const baseDmg = P.damageEnemy;
  P.damageEnemy = function (e, dmg, crit, byCrew, killerId = 0) {
    const mine = !byCrew && !killerId, p = this.player;
    if (mine && !e.dead) {
      const s = this.soulOf();
      if (s) {
        dmg *= 1 + s.lvl / 100;
        if (s.t.includes('furia') && p.hp < p.maxHp * 0.5) dmg *= 1.2;
        if (s.t.includes('verdugo') && e.hp < e.maxHp * 0.3) dmg *= 1.3;
        if (s.t.includes('impacto') && crit) dmg *= 1.3;
        if (s.t.includes('vampiro')) p.hp = Math.min(p.maxHp, p.hp + dmg * 0.04);
        if (s.t.includes('tormenta') && Math.random() < 0.12) { const ex = e; setTimeout(() => { if (!ex.dead && !ex.removed) { this.ring(ex.x, ex.z, 1.2, 0x8ad8ff); baseDmg.call(this, ex, Math.round(dmg * 1.5), true, false, 0); } }, 200); }
        if (s.t.includes('eco') && Math.random() < 0.15) { const ex = e; setTimeout(() => { if (!ex.dead && !ex.removed) baseDmg.call(this, ex, Math.round(dmg), crit, false, 0); }, 250); }
        dmg = Math.round(dmg);
      }
    }
    const was = !e.dead;
    const r = baseDmg.call(this, e, dmg, crit, byCrew, killerId);
    if (was && e.dead && e.def) {
      this.diaryNote('kill');
      if (mine) this.soulGain(e);
      this.morale = Math.min(100, (this.morale ?? 50) + (e.def.boss ? 15 : 0.2));
      if (e.huntElite) this.huntDone(e);
      if (e.def.boss && e.type !== 'cristal_escudo') {
        this.diaryNote('boss', e.def.name);
        this.crewParty(`🎉 ¡Tu tripulación celebra la victoria contra ${e.def.name}!`);
        if (Math.random() < 0.5) this.giveBook();
      }
    }
    return r;
  };
  const baseMul = P.crewDmgMul;
  P.crewDmgMul = function (n) { return baseMul.call(this, n) * (0.9 + (this.morale ?? 50) / 250); };
  const baseBuff = P.buffMul;
  P.buffMul = function (k) {
    let m = baseBuff.call(this, k);
    if (k === 'atk' || k === 'def' || k === 'xp') {
      for (const [pre, , key] of BOOK_SETS) if (key === k && this.bookSet(pre)) m *= 1.05;
      const v = this.vil;
      if (v && v.res) { if (k === 'atk' && v.res.includes('vil_herrero')) m *= 1.05; if (k === 'xp' && v.res.includes('vil_bardo')) m *= 1.1; }
    }
    return m;
  };

  // ============================================================ moral y fiestas
  P.crewParty = function (msg) {
    const crew = this.npcs.filter((n) => !n.onShip && this.soc(n.id).crew && n.dist(this.player) < 15);
    if (!crew.length) return;
    for (const n of crew) n.st.dance = true;
    for (let i = 0; i < 6; i++) setTimeout(() => { const n = crew[i % crew.length]; this.ring(n.x, n.z, 0.7, [0xff4a8a, 0x4ad8ff, 0xffe04a][i % 3]); }, i * 250);
    setTimeout(() => { for (const n of crew) n.st.dance = false; }, 6000);
    this.toast(msg);
  };
  P.partyMenu = function () {
    if (this.flags.partyDay === this.day) return this.toast('🎉 Ya celebrasteis una fiesta hoy');
    const crew = this.npcs.filter((n) => this.soc(n.id).crew);
    if (!crew.length) return this.toast('🎉 Necesitas tripulación para una fiesta');
    this.buy({ gold: 2000 }, () => { this.flags.partyDay = this.day; this.morale = Math.min(100, (this.morale ?? 50) + 30); this.addBuff('fiesta', 600); this.crewParty('🎉 ¡Fiesta pirata! Música, ron y baile: la moral sube +30'); this.diaryNote('note', 'Celebramos una gran fiesta con la tripulación.'); sfx('quest'); });
  };
  P.updateMorale = function (dt) {
    if (this.morale === undefined) this.morale = 50;
    this.morale = Math.max(0, this.morale - dt / 60);
  };

  // ============================================================ Atlántida
  P.atlMenu = function () {
    const st = this.atl || 0, opts = [];
    if (st < 5) { const S = ATL[st]; opts.push({ label: `🔱 Restaurar: ${S.name} (${Object.entries(S.cost).map(([k, v]) => k === 'gold' ? v + ' oro' : `${v} ${ITEMS[k] ? ITEMS[k].name.toLowerCase() : k}`).join(', ')})`, action: () => this.buy(S.cost, () => { this.atl = st + 1; this.buildAtl(); this.toast(`🔱 ¡${S.name} restaurado! ${S.desc}`, 'area'); this.diaryNote('note', `Restauré ${S.name} en Atlántida.`); if (this.atl === 5 && !this.ownCos('c_corona_atlantida')) this.give('c_corona_atlantida'); sfx('quest'); }) }); }
    if (st >= 2) { opts.push({ label: '🦪 Comprar 3 perlas (1500 oro)', action: () => this.buy({ gold: 1500 }, () => this.give('perla', 3)) }); opts.push({ label: '🧪 Comprar 3 pociones mayores (900 oro)', action: () => this.buy({ gold: 900 }, () => this.give('pocion_mayor', 3)) }); }
    if (st >= 3 && this.flags.atlDay !== this.day) opts.push({ label: '🔱 Recibir la Bendición atlante', action: () => { this.flags.atlDay = this.day; this.addBuff('atlante', 600); sfx('level'); } });
    if (st >= 4) { const days = this.day - (this.flags.atlTrib ?? this.day); opts.push({ label: `💰 Tributo atlante (${days * 2000 * (st >= 5 ? 2 : 1)} oro)`, action: () => { this.player.gold += days * 2000 * (st >= 5 ? 2 : 1); this.flags.atlTrib = this.day; sfx('coin'); } }); if (this.flags.atlTrib === undefined) this.flags.atlTrib = this.day; }
    opts.push({ label: 'Cerrar', action: null });
    this.ui.openDialog('🔱 Piedra de Atlántida', `Coralia fue la puerta de Atlántida. Restaura la ciudad paso a paso (${st}/5).<br>${ATL.map((S, i) => `${i < st ? '✅' : '▫️'} ${S.name}: ${S.desc}`).join('<br>')}`, opts);
  };
  P.buildAtl = function () {
    if (this.atlG) this.scene.remove(this.atlG);
    const g = new THREE.Group(), st = this.atl || 0, marble = M(0xf0f4f8), blue = M(0x3a8ad8, { emissive: 0x0a2a4a });
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.3, 6), M(0x3ad8c8, { emissive: 0x0a5a5a })); stone.position.set(ATL_SPOT.x, 0.65, ATL_SPOT.z); g.add(stone);
    const spots = [[10, 16], [20, 16], [8, 22], [24, 22], [15, 13]];
    for (let i = 0; i < st; i++) {
      const [lx, lz] = spots[i], x = CX + lx, z = CZ + lz, h = 1.4 + i * 0.5;
      const b = new THREE.Mesh(new THREE.BoxGeometry(1.8, h, 1.6), marble); b.position.set(x, h / 2, z); g.add(b);
      const r = new THREE.Mesh(i === 4 ? new THREE.SphereGeometry(1.0, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2) : new THREE.ConeGeometry(1.4, 0.9, 4), i === 4 ? M(0xffd040, { emissive: 0x5a4000 }) : blue); r.position.set(x, h + (i === 4 ? 0 : 0.45), z); if (i !== 4) r.rotation.y = Math.PI / 4; g.add(r);
    }
    this.scene.add(g); this.atlG = g;
  };

  // ============================================================ barco volador
  P.flyShipMenu = function () {
    if (!this.flags.flyShip) return;
    const opts = this.docks.map((d) => ({ label: `🛩 ${d.name}`, action: () => this.flyShipTo(d) }));
    opts.push({ label: '☁️ Ciudad Celeste (islas del cielo)', action: () => { this.flyShipTo(this.docks[0], () => this.travelZone('celeste')); } });
    opts.push({ label: 'Cancelar', action: null });
    this.ui.openDialog('🛩 Barco volador', 'Las alas de tu barco se despliegan. ¿A dónde volamos?', opts);
  };
  P.flyShipTo = function (d, after) {
    this.flyAnim = 1.6;
    this.toast(`🛩 ¡El barco despega hacia ${d.name}!`, 'area'); sfx('level');
    setTimeout(() => { const b = this.boat; b.x = d.shipX; b.z = d.shipZ; b.heading = d.heading || 0; b.speed = 0; this.dock(d); if (after) setTimeout(after, 200); }, 1200);
  };
  const baseSail = P.sailMenu;
  P.sailMenu = function () {
    baseSail.call(this);
    if (this.flags.flyShip) { const box = document.getElementById('dopts'), b = document.createElement('button'); b.textContent = '🛩 Volar con el barco'; b.onclick = () => { this.ui.closeDialog(); this.flyShipMenu(); }; box.insertBefore(b, box.firstChild); }
  };
  P.updateFlyShip = function (dt) {
    if (this.flags.flyShip && this.ship && !this.ship.userData.wings) {
      const w = new THREE.Group();
      for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 1.2), M(0xf4f0e0, { emissive: 0x3a3020 })); m.position.set(s * 2.2, 1.6, 0); m.rotation.z = s * 0.25; w.add(m); }
      const bal = new THREE.Mesh(new THREE.SphereGeometry(1.1, 14, 10), M(0xd8a838)); bal.position.set(0, 6.2, 0); bal.scale.y = 0.8; w.add(bal);
      this.ship.add(w); this.ship.userData.wings = w;
    }
    if (this.flyAnim > 0) { this.flyAnim -= dt; if (this.ship) this.ship.position.y += Math.sin(Math.max(0, this.flyAnim) / 1.6 * Math.PI) * 4; }
  };

  // ============================================================ gremio de cazadores
  P.huntWeek = function () {
    const w = Math.floor(this.day / 7), H = (this.huntW = this.huntW || { week: w, pts: 0 });
    if (H.week !== w) { const rank = this.huntRank().findIndex((r) => r.me); if (H.pts > 0 && rank === 0) { this.player.gold += 30000; if (!this.ownCos('c_capa_gremio')) this.give('c_capa_gremio'); this.toast('🏹 ¡Fuiste el mejor cazador de la semana! +30000 oro', 'area'); } this.huntW = { week: w, pts: 0 }; }
    return this.huntW;
  };
  P.huntRank = function () {
    const w = Math.floor(this.day / 7), dow = (this.day % 7) + 1, k = 1 + this.player.level / 100;
    const list = HUNTERS.map((n, i) => ({ name: n, pts: Math.round((((w * 37 + i * 53) % 40) + 15) * dow / 7 * k) }));
    list.push({ name: this.player.name + ' (tú)', pts: (this.huntW && this.huntW.pts) || 0, me: true });
    return list.sort((a, b) => b.pts - a.pts);
  };
  P.huntMenu = function (opts) {
    this.huntWeek();
    const c = this.gc;
    if (!c) opts.push({ label: '🏹 Aceptar un contrato de caza', action: () => {
      const p = this.player, pool = HUNT_POOL.filter((t) => this.ENEMY_DEF[t]), idx = Math.min(pool.length - 1, Math.floor(p.level / 500 * pool.length));
      const docks = this.docks.filter((d) => d.id !== 'salitre'), d = docks[Math.floor(Math.random() * docks.length)];
      this.gc = { type: pool[Math.max(0, idx - Math.floor(Math.random() * 3))], lvl: Math.min(500, p.level + 5), isle: d.name, x: d.land.x, z: d.land.z };
      this.toast(`🏹 Contrato: caza a un ${this.ENEMY_DEF[this.gc.type].name} de élite cerca de ${d.name}`, 'area');
    } });
    else opts.push({ label: `🏹 Contrato: ${this.ENEMY_DEF[c.type].name} de élite en ${c.isle}`, action: null }, { label: '❌ Abandonar el contrato', action: () => { this.gc = null; } });
    opts.push({ label: '📊 Ranking semanal de cazadores', action: () => this.ui.openDialog('📊 Ranking del gremio', `Semana ${Math.floor(this.day / 7) + 1} (el primero el domingo gana 30000 oro)<br>${this.huntRank().map((r, i) => `${i + 1}. ${r.me ? '<b>' : ''}${r.name}: ${r.pts}${r.me ? '</b>' : ''}`).join('<br>')}`, [{ label: 'Cerrar', action: null }]) });
    return 'El Gremio de Cazadores busca bestias raras. Cada contrato da puntos para el ranking de la semana.';
  };
  P.updateHunt = function () {
    const c = this.gc; if (!c || c.spawned || this.sailing) return;
    const p = this.player; if (Math.hypot(p.x - c.x, p.z - c.z) > 18) return;
    for (let i = 0; i < 40; i++) {
      const x = Math.round(c.x + (Math.random() - 0.5) * 12), z = Math.round(c.z + (Math.random() - 0.5) * 12);
      if (!this.W.walkable(x, z) || Math.hypot(x - p.x, z - p.z) < 4) continue;
      const e = this.spawnTemp(c.type, x, z, c.lvl); e.maxHp *= 4; e.hp = e.maxHp; e.huntElite = true; e.provoked = true; e.state = 'chase';
      e.model.root.scale.multiplyScalar(1.3); e.label.nm.textContent = `⭐ Élite: ${e.def.name} · Nv. ${e.level}`; e.label.nm.style.color = '#ffd040';
      c.spawned = true; this.toast(`🏹 ¡Ahí está la presa de élite!`, 'area'); return;
    }
  };
  P.huntDone = function (e) {
    const c = this.gc; if (!c) return;
    const pts = 10 + Math.round(e.level / 10), gold = 2000 + e.level * 40;
    this.huntWeek().pts += pts; this.player.gold += gold; this.gc = null;
    this.stats.hunts = (this.stats.hunts || 0) + 1;
    this.toast(`🏹 ¡Contrato cumplido! +${pts} puntos de gremio y ${gold} oro`, 'area'); this.diaryNote('note', `Cumplí un contrato del gremio contra un ${e.def.name} de élite.`); sfx('quest');
  };

  // ============================================================ estaciones: la loma de Villarroca cambia
  const SEASON_DATA = [
    { label: 'Pétalos', icon: '🌸', item: 'petalo_sakura', cos: 'c_corona_flores', txt: 'El cerezo gigante está en flor' },
    { label: 'Conchas', icon: '🐚', item: 'concha_dorada', cos: 'c_capa_verano', txt: 'La marea de verano deja conchas doradas' },
    { label: 'Setas', icon: '🍄', item: 'seta_otono', cos: 'c_capa_otono', txt: 'Brotan setas gigantes de otoño' },
    { label: 'Cueva helada', icon: '❄️', item: 'cristal_hielo', cos: 'c_corona_escarcha', txt: 'El viento helado ha abierto una cueva' },
  ];
  P.seasonSpot = function () {
    if (this._ss) return this._ss;
    for (let r = 0; r < 8; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) { const x = SEASON_SPOT.x + dx, z = SEASON_SPOT.z + dz; if (this.W.walkable(x, z)) return (this._ss = { x, z }); }
    return (this._ss = SEASON_SPOT);
  };
  P.buildSeason = function () {
    const s = this.season(); if (this.seasonBuilt === s) return; this.seasonBuilt = s;
    if (this.seasonG) this.scene.remove(this.seasonG);
    const g = new THREE.Group(), sp = this.seasonSpot(), x = sp.x + 1.5, z = sp.z;
    if (s === 0) { const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 2.2, 8), M(0x5a3a2a)); tr.position.set(x, 1.1, z); g.add(tr); for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 8), M(0xffb0d0)); f.position.set(x + Math.cos(i) * 0.8, 2.5 + (i % 2) * 0.4, z + Math.sin(i) * 0.8); g.add(f); } }
    if (s === 1) for (let i = 0; i < 7; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.3, 6), M(0xffd080, { emissive: 0x4a3000 })); c.position.set(x + Math.cos(i * 0.9) * 0.9, 0.15, z + Math.sin(i * 0.9) * 0.9); g.add(c); }
    if (s === 2) for (let i = 0; i < 4; i++) { const h = 0.8 + i * 0.3, st = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, h, 8), M(0xf0e8d8)); st.position.set(x + (i % 2) * 0.9, h / 2, z + Math.floor(i / 2) * 0.9 - 0.4); g.add(st); const cap = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0xd85a1a)); cap.position.set(st.position.x, h, st.position.z); g.add(cap); }
    if (s === 3) { const arch = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.35, 8, 16, Math.PI), M(0xbfe8ff, { emissive: 0x2a4a6a })); arch.position.set(x, 0, z); g.add(arch); const hole = new THREE.Mesh(new THREE.CircleGeometry(0.75, 16, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0x0a1a2a })); hole.position.set(x, 0.01, z + 0.01); g.add(hole); }
    this.scene.add(g); this.seasonG = g;
  };
  P.seasonAction = function () {
    const s = this.season(), S = SEASON_DATA[s], p = this.player;
    if (s === 3) return this.enterIceCave();
    const opts = [];
    if (this.flags['ss_' + s] !== this.day) opts.push({ label: `${S.icon} Recoger ${ITEMS[S.item].name.toLowerCase()}`, action: () => { this.flags['ss_' + s] = this.day; this.give(S.item, 3); if (s === 1) this.give('perla', 1); sfx('coin'); } });
    if (!this.ownCos(S.cos)) opts.push({ label: `🎁 Cambiar 10 ${ITEMS[S.item].name.toLowerCase()} por ${ITEMS[S.cos].name} (tienes ${p.inv[S.item] || 0})`, action: () => this.buy({ [S.item]: 10 }, () => this.give(S.cos)) });
    opts.push({ label: 'Cerrar', action: null });
    this.ui.openDialog(`${S.icon} Loma de las estaciones`, `${S.txt}. Cada estación esta loma cambia: vuelve cada día a recoger lo que da.`, opts);
  };
  P.enterIceCave = function () {
    const p = this.player, R = this.iceCave;
    this.iceReturn = { x: p.x, z: p.z };
    if (!this.iceBuilt) { this.iceBuilt = true; const g = new THREE.Group(); const fl = new THREE.Mesh(new THREE.BoxGeometry(IW + 4, 0.2, ID + 4), M(0xd8f0ff)); fl.position.set(IX0 + IW / 2, -0.1, IZ0 + ID / 2); g.add(fl); for (let i = 0; i < 14; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.6 + (i % 3) * 0.5, 6), M(0x9ad8ff, { emissive: 0x1a4a6a, transparent: true, opacity: 0.85 })); c.position.set(IX0 + (i * 5.3) % IW, 0.8, IZ0 + (i % 2 ? -0.5 : ID + 0.5)); g.add(c); } const ch = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.55), M(0x8ad8ff, { emissive: 0x2a5a8a })); ch.position.set(R.chest.x, 0.25, R.chest.z); g.add(ch); this.scene.add(g); }
    tpTo(this, R.exit.x + 1, R.exit.z);
    this.iceTemps = [];
    const lvl = Math.max(60, Math.min(500, p.level));
    const types = ['yeti', 'lobo_nieve', 'lobo_nieve', 'yeti', 'reina_hielo'];
    types.forEach((t, i) => { const e = this.spawnTemp(t, IX0 + 6 + (i % 3) * 3, IZ0 + 3 + Math.floor(i / 3) * 5 + (i === 4 ? 1 : 0), i === 4 ? lvl + 5 : lvl); if (i === 4) { e.maxHp *= 2; e.hp = e.maxHp; } this.iceTemps.push(e); });
    this.toast('❄️ La Cueva Helada: el frío no es de este mundo...', 'area');
  };
  P.inIceCave = function () { const r = this.W.regionAt(this.player.x, this.player.z); return r && r.id === 'cueva_helada'; };
  P.leaveIceCave = function () { for (const e of this.iceTemps || []) if (!e.removed) e.remove(); this.iceTemps = null; const r = this.iceReturn || { x: 50, z: 52 }; tpTo(this, r.x, r.z); };

  // ============================================================ aldea propia
  P.vilR = function () { return this.islets.find((r) => r.id === 'aldea'); };
  P.vilSlots = function () { const R = this.vilR(), c = R.center; return Object.keys(VILLAGERS).map((id, i) => { const a = (i / 8) * Math.PI * 2; return { id, x: Math.round(c.x + Math.cos(a) * 7), z: Math.round(c.z + Math.sin(a) * 7) }; }); };
  P.spawnVillagers = function () {
    const v = this.vil; if (!v || !v.founded) return;
    const slots = this.vilSlots();
    for (const id of v.res) { if (this.npcById(id)) continue; const s = slots.find((k) => k.id === id), V = VILLAGERS[id]; npcAt(this, id, V.name, s.x, s.z, V.look, Math.max(30, Math.min(300, this.player.level))); }
    this.buildVillage();
  };
  P.buildVillage = function () {
    if (this.vilG) this.scene.remove(this.vilG);
    const v = this.vil; if (!v || !v.founded) return;
    const g = new THREE.Group(), slots = this.vilSlots(), c = this.vilR().center;
    const flag = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3, 6), M(0x6a4a2a)); flag.position.set(c.x + 1.5, 1.5, c.z); g.add(flag);
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.6), M(0xa01a1a, { side: THREE.DoubleSide })); cloth.position.set(c.x + 2, 2.6, c.z); g.add(cloth);
    for (const id of v.res) { const s = slots.find((k) => k.id === id), a = Math.atan2(s.z - c.z, s.x - c.x), hx = c.x + Math.cos(a) * 10, hz = c.z + Math.sin(a) * 10; const b = new THREE.Mesh(new THREE.BoxGeometry(2, 1.4, 2), M(0xe8d8b0)); b.position.set(hx, 0.7, hz); g.add(b); const r = new THREE.Mesh(new THREE.ConeGeometry(1.7, 1, 4), M([0xb05a3a, 0x3a5a8a, 0x5a8a3a, 0x8a3a6a][v.res.indexOf(id) % 4])); r.rotation.y = Math.PI / 4; r.position.set(hx, 1.9, hz); g.add(r); }
    this.scene.add(g); this.vilG = g;
  };
  P.vilMenu = function () {
    const v = (this.vil = this.vil || { founded: false, res: [], store: { gold: 0 } });
    if (!v.founded) return this.ui.openDialog('🏘 Tierra libre', 'Una isla tranquila y sin dueño. Puedes fundar aquí tu propia aldea, invitar a gente a vivir y defenderla de los asaltos.', [{ label: '🏘 Fundar la aldea (20000 oro)', action: () => this.buy({ gold: 20000 }, () => { v.founded = true; v.day = this.day; this.buildVillage(); this.toast('🏘 ¡Has fundado tu aldea! Invita vecinos desde la bandera', 'area'); this.diaryNote('note', 'Fundé mi propia aldea.'); sfx('quest'); }) }, { label: 'Ahora no', action: null }]);
    const opts = [], st = v.store || {};
    const stTxt = Object.entries(st).filter(([, n]) => n > 0).map(([k, n]) => k === 'gold' ? `${n} oro` : `${n} ${ITEMS[k] ? ITEMS[k].name.toLowerCase() : k}`).join(', ');
    if (stTxt) opts.push({ label: `📦 Recoger: ${stTxt}`, action: () => { for (const [k, n] of Object.entries(st)) { if (k === 'gold') this.player.gold += n; else if (n > 0) this.give(k, n); } v.store = { gold: 0 }; sfx('coin'); } });
    const price = 5000 * (v.res.length + 1);
    for (const [id, V] of Object.entries(VILLAGERS)) if (!v.res.includes(id)) opts.push({ label: `🏠 Invitar a ${V.name} · ${V.role} (${price} oro)`, action: () => this.buy({ gold: price }, () => { v.res.push(id); this.spawnVillagers(); this.toast(`🏠 ${V.name} se muda a tu aldea`, 'area'); sfx('quest'); }) });
    opts.push({ label: 'Cerrar', action: null });
    this.ui.openDialog('🏘 Tu aldea', `Vecinos: ${v.res.length}/8.${v.raid !== undefined && v.raid !== null ? '<br>🔥 ¡Hay un asalto en marcha!' : ''}<br>Cada día los vecinos producen cosas que se guardan aquí. A veces llegan asaltantes: ven a defenderla ese mismo día (los guardias reducen los asaltantes).`, opts);
  };
  P.vilDaily = function () {
    const v = this.vil; if (!v || !v.founded || v.day === this.day) return;
    const days = Math.min(7, this.day - (v.day ?? this.day)); v.day = this.day;
    if (v.raid !== undefined && v.raid !== null) { v.store.gold = Math.floor((v.store.gold || 0) / 2); v.raid = null; this.toast('🔥 Nadie defendió tu aldea: los asaltantes se llevaron la mitad del oro guardado'); }
    const add = (k, n) => { v.store[k] = (v.store[k] || 0) + n * days; };
    if (v.res.includes('vil_mercader')) add('gold', 1500);
    if (v.res.includes('vil_granjera')) { add('apple', 5); add('meat', 5); }
    if (v.res.includes('vil_curandera')) add('pocion_mayor', 3);
    if (v.res.includes('vil_minera')) { add('iron', 3); add('silver', 2); add('goldore', 1); }
    add('gold', 200 * v.res.length);
    if (v.res.length >= 2 && Math.random() < 0.35) { v.raid = this.day; this.toast('🔥 ¡Unos piratas asaltan tu aldea! Viaja allí hoy (Oráculo) para defenderla', 'area'); }
  };
  P.updateVillage = function () {
    const v = this.vil; if (!v || !v.founded) return;
    this.vilDaily();
    const R = this.zoneOf && this.zoneOf();
    if (!R || R.zone !== 'aldea') return;
    if (v.raid !== undefined && v.raid !== null && !this.vilRaid) {
      const guards = ['vil_guardia1', 'vil_guardia2'].filter((g) => v.res.includes(g)).length, n = [7, 4, 2][guards], c = R.center, p = this.player, temps = [];
      for (let i = 0; i < n; i++) for (let k = 0; k < 30; k++) { const x = Math.round(c.x + (Math.random() - 0.5) * 20), z = Math.round(c.z + (Math.random() - 0.5) * 20); if (this.W.walkable(x, z) && Math.hypot(x - p.x, z - p.z) > 5) { const e = this.spawnTemp('pirate', x, z, Math.max(20, Math.min(500, p.level))); e.provoked = true; e.state = 'chase'; e.label.nm.textContent = `Asaltante · Nv. ${e.level}`; temps.push(e); break; } }
      this.vilRaid = temps; this.toast(`🔥 ¡${temps.length} asaltantes atacan tu aldea!`, 'area');
    }
    if (this.vilRaid && this.vilRaid.every((e) => e.dead || e.removed)) { this.vilRaid = null; v.raid = null; v.store.gold = (v.store.gold || 0) + 5000; this.stats.vilDef = (this.stats.vilDef || 0) + 1; this.toast('🛡 ¡Has defendido tu aldea! Los vecinos te dan 5000 oro', 'area'); this.diaryNote('note', 'Defendí mi aldea de un asalto pirata.'); sfx('quest'); }
  };

  // ============================================================ bestias legendarias del mar
  const baseSea = P.updateSeaMonster;
  P.updateSeaMonster = function (dt) {
    const before = this.smon;
    const leg = this.player.level >= 200 ? Object.entries(SEA_LEGENDS).find(([k, L]) => L.cond(this) && this.flags['lb_' + k] !== this.day) : null;
    if (leg && !before && this.smT > 40) this.smT = 40;
    baseSea.call(this, dt);
    const S = this.smon;
    if (!before && S && leg) {
      const [k, L] = leg; S.legend = k; S.max = S.hp = S.hp * 8; S.lvl = Math.min(500, S.lvl + 60);
      S.g.scale.setScalar(2); S.g.traverse((o) => { if (o.isMesh && o.material.color && !(o.material instanceof THREE.MeshBasicMaterial)) { o.material = o.material.clone(); o.material.color.set(L.col); } });
      S.label.nm.textContent = `${L.name} · Nv. ${S.lvl}`; S.label.nm.style.color = '#ffd040';
      this.toast(`🌊 ¡UNA BESTIA LEGENDARIA! ${L.name} emerge del mar`, 'area');
    }
  };
  const baseHarp = P.harpoon;
  P.harpoon = function () {
    const S = this.smon;
    baseHarp.call(this);
    if (S && S.legend && S.hp <= 0) {
      const L = SEA_LEGENDS[S.legend]; this.flags['lb_' + S.legend] = this.day;
      this.legendSea = this.legendSea || {}; const first = !this.legendSea[S.legend]; this.legendSea[S.legend] = true;
      this.player.gold += 50000; this.give('escama_leyenda', 2); if (first) this.give('nucleo_estelar', 2);
      if (Object.keys(this.legendSea).length === 4 && !this.ownCos('c_capa_leviatan')) this.give('c_capa_leviatan');
      this.toast(`🏆 ¡Has cazado a ${L.name}! +50000 oro${first ? ' y 2 núcleos estelares' : ''} (${Object.keys(this.legendSea).length}/4 bestias)`, 'area');
      this.diaryNote('boss', L.name);
    }
  };

  // ============================================================ mercado entre jugadores
  P.marketMenu = function () {
    if (!this.net.active) return this.toast('🏪 El mercado solo funciona en multijugador (👥 Online)');
    this.mkt = this.mkt || [];
    const me = this.net.myId, opts = [];
    for (const o of this.mkt) {
      const it = ITEMS[o.item] || {};
      if (o.seller === me) opts.push({ label: `❌ Retirar tu ${it.name} ×${o.n} (${o.price} oro)`, action: () => { this.mkt = this.mkt.filter((k) => k.id !== o.id); this.give(o.item, o.n); this.net.sendX({ k: 'mktDel', id: o.id }); } });
      else opts.push({ label: `🛒 ${it.icon || ''} ${it.name} ×${o.n} de ${o.name} · ${o.price} oro`, action: () => { if (this.player.gold < o.price) return this.toast('No tienes oro suficiente'); this.net.sendX({ k: 'mktBuy', id: o.id }, o.seller); this.toast('🛒 Pedido enviado al vendedor...'); } });
    }
    opts.push({ label: '➕ Poner algo a la venta', action: () => this.marketSell() });
    opts.push({ label: 'Cerrar', action: null });
    this.ui.openDialog('🏪 Mercado de jugadores', this.mkt.length ? 'Objetos a la venta de los jugadores de la partida:' : 'No hay nada a la venta todavía.', opts);
  };
  P.marketSell = function () {
    const p = this.player, eq = new Set(Object.values(p.equip));
    const items = Object.entries(p.inv).filter(([k, n]) => n > 0 && ITEMS[k] && !eq.has(k)).sort((a, b) => (ITEMS[b[0]].value || 0) - (ITEMS[a[0]].value || 0)).slice(0, 12);
    const opts = items.map(([k, n]) => ({ label: `${ITEMS[k].icon || ''} ${ITEMS[k].name} (tienes ${n})`, action: () => {
      const base = Math.max(10, ITEMS[k].value || 10), cnt = Math.min(n, ITEMS[k].type === 'mat' ? 5 : 1);
      this.ui.openDialog('🏪 Precio', `${ITEMS[k].name} ×${cnt}`, [base * cnt * 2, base * cnt * 5, base * cnt * 10, 50000].map((pr) => ({ label: `${pr} oro`, action: () => {
        if ((p.inv[k] || 0) < cnt) return;
        p.inv[k] -= cnt; const o = { id: `${this.net.myId}_${Date.now()}`, seller: this.net.myId, name: p.name, item: k, n: cnt, price: pr };
        this.mkt = this.mkt || []; this.mkt.push(o); this.net.sendX({ k: 'mktAdd', o }); this.toast(`🏪 Pones a la venta ${ITEMS[k].name} ×${cnt} por ${pr} oro`);
      } })).concat([{ label: 'Cancelar', action: null }]));
    } }));
    opts.push({ label: 'Cancelar', action: null });
    this.ui.openDialog('🏪 ¿Qué quieres vender?', 'Lo que pongas a la venta sale de tu mochila hasta que alguien lo compre o lo retires.', opts);
  };
  const baseNet = P.onNetX4;
  P.onNetX4 = function (from, m) {
    this.mkt = this.mkt || [];
    if (m.k === 'mktAdd') { if (!this.mkt.some((o) => o.id === m.o.id)) this.mkt.push(m.o); this.toast(`🏪 ${m.o.name} vende ${(ITEMS[m.o.item] || {}).name} por ${m.o.price} oro`); return true; }
    if (m.k === 'mktDel') { this.mkt = this.mkt.filter((o) => o.id !== m.id); return true; }
    if (m.k === 'mktBuy') { const o = this.mkt.find((k) => k.id === m.id && k.seller === this.net.myId); if (!o) return true; this.mkt = this.mkt.filter((k) => k.id !== o.id); this.player.gold += o.price; this.toast(`🏪 ¡Has vendido ${(ITEMS[o.item] || {}).name} por ${o.price} oro!`, 'area'); this.net.sendX({ k: 'mktSold', id: o.id, buyer: from, item: o.item, n: o.n, price: o.price }); sfx('coin'); return true; }
    if (m.k === 'mktSold') { this.mkt = this.mkt.filter((o) => o.id !== m.id); if (m.buyer === this.net.myId) { this.player.gold = Math.max(0, this.player.gold - m.price); this.give(m.item, m.n); this.toast(`🛒 ¡Compra hecha! ${(ITEMS[m.item] || {}).name} ×${m.n}`, 'area'); } return true; }
    return baseNet ? baseNet.call(this, from, m) : false;
  };

  // ============================================================ carreras de dragones
  P.raceStart = function () {
    if (this.mounted !== 'dragon_real') return this.toast('🏁 Monta en tu dragón adulto para correr');
    const R = this.islets.find((r) => r.id === 'dragones'), c = R.center, pts = [];
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; let best = null; for (let r = 18; r > 6 && !best; r -= 1) { const x = Math.round(c.x + Math.cos(a) * r), z = Math.round(c.z + Math.sin(a) * r); if (this.W.walkable(x, z)) best = { x, z }; } if (best) pts.push(best); }
    const g = new THREE.Group();
    pts.forEach((q, i) => { const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.12, 8, 20), new THREE.MeshBasicMaterial({ color: i === 0 ? 0xffd040 : 0xff5a3a })); ring.position.set(q.x, 2.2, q.z); g.add(ring); q.m = ring; });
    this.scene.add(g);
    this.dRace = { pts, i: 0, t: 0, g };
    this.toast('🏁 ¡Carrera de dragones! Pasa por los 8 aros en orden antes de 70 s', 'area'); sfx('quest');
  };
  P.updateDragonRace = function (dt) {
    const Rc = this.dRace; if (!Rc) return;
    Rc.t += dt; const p = this.player, q = Rc.pts[Rc.i];
    for (const k of Rc.pts) k.m.rotation.y += dt * 2;
    const end = (msg) => { this.scene.remove(Rc.g); this.dRace = null; this.toast(msg, 'area'); };
    if (this.mounted !== 'dragon_real' || p.dead) return end('🏁 Carrera cancelada');
    if (Rc.t > 70) return end('🏁 ¡Se acabó el tiempo!');
    if (Math.hypot(p.x - q.x, p.z - q.z) < 2.4) {
      q.m.material.color.set(0x4ad84a); this.ring(q.x, q.z, 1.2, 0xffd040); sfx('coin'); Rc.i++;
      if (Rc.i < Rc.pts.length) Rc.pts[Rc.i].m.material.color.set(0xffd040);
      else { const t = Math.round(Rc.t * 10) / 10, best = this.stats.dragonBest; if (!best || t < best) this.stats.dragonBest = t; const gold = Math.max(2000, Math.round(30000 - t * 300)); this.player.gold += gold; if (!this.ownCos('c_capa_jinete')) this.give('c_capa_jinete'); end(`🏁 ¡Meta en ${t} s!${!best || t < best ? ' ¡Récord!' : ''} +${gold} oro`); this.diaryNote('note', `Gané una carrera de dragones en ${t} s.`); }
    }
  };

  // ============================================================ biblioteca antigua
  P.bookSet = function (pre) { return BOOKS.filter((b) => b.id.startsWith(pre)).every((b) => (this.books || []).includes(b.id)); };
  P.giveBook = function () {
    this.books = this.books || [];
    const left = BOOKS.filter((b) => !this.books.includes(b.id)); if (!left.length) return;
    const b = left[Math.floor(Math.random() * left.length)]; this.books.push(b.id);
    this.toast(`📚 ¡Has encontrado un libro antiguo: «${b.title}»! (${this.books.length}/12) Llévalo a la biblioteca`, 'area');
    for (const [pre, txt] of BOOK_SETS) if (b.id.startsWith(pre) && this.bookSet(pre)) this.toast(`📚 ¡Colección completa! Bonus permanente: ${txt}`, 'area');
  };
  P.libraryMenu = function (opts) {
    const own = this.books || [];
    for (const b of BOOKS.filter((k) => own.includes(k.id))) opts.push({ label: `📖 Leer «${b.title}»`, action: () => this.ui.openDialog(`📖 ${b.title}`, b.text, [{ label: 'Cerrar', action: null }]) });
    if (this.flags.bookDay !== this.day && own.length < BOOKS.length) opts.push({ label: '📚 Comprar un libro antiguo (8000 oro, 1 al día)', action: () => this.buy({ gold: 8000 }, () => { this.flags.bookDay = this.day; this.giveBook(); }) });
    return `Biblioteca de la Bruma. Tienes ${own.length}/12 libros. Las colecciones completas dan bonus permanentes: ${BOOK_SETS.map(([pre, txt]) => `${this.bookSet(pre) ? '✅' : '▫️'} ${txt}`).join(' · ')}. Los libros aparecen al vencer jefes y en cofres.`;
  };
  const baseChest = P.openChest;
  P.openChest = function (c) { const was = this.flags[c.id]; const r = baseChest.call(this, c); if (!was && this.flags[c.id] && Math.random() < 0.15) this.giveBook(); return r; };

  // ============================================================ enganches
  P.npcDialog16 = function (id, opts) {
    if (id === 'cazadora') return this.huntMenu(opts);
    if (id === 'archivero') return this.libraryMenu(opts);
    if (id === 'marga' && !this.flags.flyShip) opts.push({ label: '🛩 Convertir tu barco en barco volador (nivel 450, 300000 oro, 5 núcleos estelares)', action: () => { if (this.player.level < 450) return this.toast('🔒 Nivel 450'); this.buy({ gold: 300000, nucleo_estelar: 5 }, () => { this.flags.flyShip = true; this.toast('🛩 ¡Tu barco tiene alas! Úsalo desde ⚙️ Barco › Volar con el barco', 'area'); sfx('quest'); }); } });
    if (id === 'ysolde') opts.push({ label: `🏁 Carrera de dragones (récord: ${this.stats.dragonBest ? this.stats.dragonBest + ' s' : '—'})`, action: () => this.raceStart() });
    if (VILLAGERS[id]) return `Soy ${VILLAGERS[id].name}. ${VILLAGERS[id].role}. ¡Gracias por acogerme en tu aldea!`;
    return null;
  };
  P.contextAction16 = function () {
    if (this.sailing) return null;
    const p = this.player;
    if (this.inIceCave()) {
      if (near(p, this.iceCave.exit, 1.8)) return { icon: '🚪', label: 'Salir', fn: () => this.leaveIceCave() };
      const ch = this.iceCave.chest;
      if (near(p, ch, 1.6) && this.flags.iceChest !== this.day) return { icon: '📦', label: 'Cofre', fn: () => { this.flags.iceChest = this.day; this.give('cristal_hielo', 5); this.player.gold += 10000; if (Math.random() < 0.3) this.giveBook(); this.toast('❄️ Cofre helado: 5 cristales de hielo y 10000 oro'); sfx('coin'); } };
      return null;
    }
    if (this.inCoralia && this.inCoralia() && near(p, ATL_SPOT, 1.8)) return { icon: '🔱', label: 'Atlántida', fn: () => this.atlMenu() };
    const ss = this.seasonSpot(); if (near(p, ss, 2.2)) { const S = SEASON_DATA[this.season()]; return { icon: S.icon, label: S.label, fn: () => this.seasonAction() }; }
    const R = this.zoneOf && this.zoneOf();
    if (R && R.zone === 'aldea' && near(p, { x: R.center.x + 1.5, z: R.center.z }, 2)) return { icon: '🏘', label: 'Aldea', fn: () => this.vilMenu() };
    return null;
  };
  P.updateMore16 = function (dt) {
    if (!this.npcById('cazadora')) npcAt(this, 'cazadora', 'Maestra cazadora Brenna', 55, 55, { shirt: 0x4a5a2a, pants: 0x3a2a1a, cape: 0x2a3a1a, hat: 'hood', hatColor: 0x3a4a1a, hair: 0x8a3a1a, longHair: true, female: true, skin: 0xd8a070, spear: true }, 200);
    if (!this.npcById('archivero')) npcAt(this, 'archivero', 'Archivero Teodoro', 43, 49, { shirt: 0x3a2a4a, robe: 0x4a3a2a, beard: 0xe0e0e0, hair: 0xe0e0e0, skin: 0xe0b890, glasses: true }, 40);
    if (!this.m16init) { this.m16init = true; if (this.atl) this.buildAtl(); else { this.atl = 0; this.buildAtl(); } this.spawnVillagers(); }
    this.buildSeason(); this.updateMorale(dt); this.updateFlyShip(dt); this.updateHunt(); this.updateVillage(); this.updateDragonRace(dt);
    this.m16T = (this.m16T || 0) - dt;
    if (this.m16T <= 0) { this.m16T = 2; const p = this.player; const a = this.W.areaName(p.x, p.z); if (a && !this.sailing) this.diaryNote('place', a); else this.diaryNote('tick', 0); }
  };
  P.newsHtml16 = function () {
    const s = this.soulOf();
    return `<div class="sub">🆕 v5.4</div><ul class="qlist">
      <li>🔱 Atlántida: ${this.atl || 0}/5 · 🏘 Aldea: ${this.vil && this.vil.founded ? `${this.vil.res.length} vecinos` : 'sin fundar (Oráculo)'} · 🛩 Barco volador: ${this.flags.flyShip ? 'sí' : 'no'}</li>
      <li>⚔️ Alma del arma: ${s ? `nivel ${s.lvl}` : '—'} · 🎉 Moral: ${Math.round(this.morale ?? 50)}/100 · 📚 Libros: ${(this.books || []).length}/12</li>
      <li>🏹 Gremio: ${(this.huntW && this.huntW.pts) || 0} puntos esta semana · 🌊 Bestias legendarias: ${Object.keys(this.legendSea || {}).length}/4 · 🏁 Carrera: ${this.stats.dragonBest ? this.stats.dragonBest + ' s' : '—'}</li></ul>`;
  };
}

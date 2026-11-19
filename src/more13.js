// v5.0 (gran expansión): nivel máximo 350, Ciudad Celeste, Isla Bruma de hace 100 años, Abismo Ardiente,
// 13 enemigos nuevos y 3 jefes, misiones con planos de armadura, rival personal, tienda propia, cartas piratas,
// monstruos marinos con arpón, mascotas que evolucionan y negocios de la pareja.
import * as THREE from 'three';
import { makeIslet, populate } from './regions.js';
import { ITEMS, EQUIP } from './items.js';
import { NEW_SETS, NEW_MATS } from './sets.js';

const Z = {
  celeste: { id: 'celeste', name: 'Ciudad Celeste', ox: 3000, oz: 0, N: 64, seed: 401, biome: 'sky', lvl: 100, giver: 'aurelia', boss: 'rey_celeste', bg: 0x9ad8ff,
    enemies: ['grifo', 'caballero_celeste', 'golem_nube'], plan: 'templario', gather: ['polvo_estelar', 8], reward2: ['oro_solar', 10] },
  pasado: { id: 'pasado', name: 'Isla Bruma (hace 100 años)', ox: 3200, oz: 0, N: 70, seed: 433, biome: 'ancient', lvl: 160, giver: 'aldric', boss: 'cronos', bg: 0xd8b888,
    enemies: ['lobo_ancestral', 'caballero_antiguo', 'wyrm_antiguo', 'espectro_tiempo'], plan: 'negra', gather: ['escama_wyrm', 6], reward2: ['mithril', 10] },
  abismo: { id: 'abismo', name: 'Abismo Ardiente', ox: 3450, oz: 0, N: 66, seed: 467, biome: 'volcano', lvl: 230, giver: 'vulcan', boss: 'senor_infernal', bg: 0x3a0a08,
    enemies: ['demonio_alado', 'caballero_infernal', 'dragon_menor', 'titan_magma'], plan: 'tirano', gather: ['sangre_dragon', 6], reward2: ['adamantita', 6] },
};
export function makeExpansionIslets() {
  const out = [];
  const H = (R) => ({
    prop: (type, x, z, rot = 0, blocks = true, extra = {}) => { R.props.push({ type, x, z, rot, ...extra }); if (blocks) R.block(x, z); },
    house: (id, x0, z0, w, d, door, o = {}) => { R.buildings.push({ id, x0, z0, w, d, door, wall: 0xe8d8b0, roof: 0xb05a3a, h: 1.5, ...o }); for (let z = z0; z < z0 + d; z++) for (let x = x0; x < x0 + w; x++) R.block(x, z); },
  });
  // Ciudad Celeste
  {
    const D = Z.celeste, R = makeIslet({ ...D, dockDir: [-1, 0] });
    R.portal = true; R.zone = 'celeste';
    const { x: cx, z: cz } = R.center, { prop, house } = H(R);
    R.towns.push({ name: 'Jardines Celestes', x: cx, z: cz, r: 8 });
    R.reserve(cx, cz, 9);
    house('celeste_1', cx - 6, cz - 5, 4, 3, 's', { wall: 0xf4f0e8, roof: 0x5a8ad8, stone: true, h: 2 });
    house('celeste_2', cx + 3, cz - 5, 4, 3, 's', { wall: 0xf4f0e8, roof: 0xd8a838, stone: true, h: 2 });
    house('celeste_3', cx - 6, cz + 3, 4, 3, 'n', { wall: 0xf8f4ec, roof: 0x5a8ad8, stone: true, h: 2 });
    prop('forge', cx + 4, cz + 3); prop('well', cx, cz + 4);
    R.npcs.push({ id: 'aurelia', name: 'Sacerdotisa Aurelia', x: cx, z: cz, wander: 1, look: { shirt: 0xf4f4f8, pants: 0xd8d8e0, robe: 0xf4f4f8, hair: 0xf8e080, longHair: true, skin: 0xf3cfaa, hat: 'circlet', hatColor: 0xffd040, halo: 0xffe080, female: true } });
    R.arrive = { x: cx - 2, z: cz + 1 };
    populate(R, 1);
    const { ox, oz, N } = R;
    R.spawns.push({ type: 'grifo', count: 6, area: [ox + 8, oz + 8, ox + N - 9, cz - 10], lvl: [110, 140] });
    R.spawns.push({ type: 'caballero_celeste', count: 6, area: [ox + 8, cz + 10, ox + N - 9, oz + N - 9], lvl: [120, 155] });
    R.spawns.push({ type: 'golem_nube', count: 5, area: [cx + 10, oz + 8, ox + N - 9, oz + N - 9], lvl: [130, 165] });
    R.spawns.push({ type: 'rey_celeste', count: 1, area: [cx - 1, oz + 10, cx + 1, oz + 12], lvl: [180, 180] });
    out.push(R);
  }
  // Isla Bruma de hace 100 años
  {
    const D = Z.pasado, R = makeIslet({ ...D, dockDir: [-1, 0] });
    R.portal = true; R.zone = 'pasado';
    const { x: cx, z: cz } = R.center, { prop, house } = H(R);
    R.towns.push({ name: 'Villarroca Antigua', x: cx, z: cz, r: 8 });
    R.reserve(cx, cz, 9);
    house('pasado_1', cx - 6, cz - 5, 3, 3, 's', { wall: 0xc8b088, roof: 0x7a4a2a, timber: true });
    house('pasado_2', cx + 3, cz - 5, 4, 3, 's', { wall: 0xb8a078, roof: 0x5a3a2a, timber: true });
    house('pasado_3', cx + 3, cz + 3, 3, 3, 'n', { wall: 0xc8b088, roof: 0x6a4a2a, thatch: true });
    prop('forge', cx - 4, cz + 3); prop('campfire', cx, cz + 3);
    R.npcs.push({ id: 'aldric', name: 'Capitán Fundador Aldric', x: cx, z: cz, wander: 1, look: { shirt: 0x6a2a2a, pants: 0x2a2a2a, coat: true, trim: 0xd8a838, hair: 0x6a4a2a, beard: 0x6a4a2a, skin: 0xe0aa80, hat: 'tricorn', capColor: 0x2a1a10, feather: 0xc83a2a, sword: true } });
    R.arrive = { x: cx - 2, z: cz + 1 };
    populate(R, 1);
    const { ox, oz, N } = R;
    R.spawns.push({ type: 'lobo_ancestral', count: 6, area: [ox + 8, oz + 8, cx - 10, oz + N - 9], lvl: [160, 190] });
    R.spawns.push({ type: 'caballero_antiguo', count: 6, area: [cx + 10, oz + 8, ox + N - 9, cz], lvl: [170, 200] });
    R.spawns.push({ type: 'wyrm_antiguo', count: 5, area: [cx + 10, cz, ox + N - 9, oz + N - 9], lvl: [185, 215] });
    R.spawns.push({ type: 'espectro_tiempo', count: 5, area: [ox + 8, oz + 8, ox + N - 9, cz - 10], lvl: [190, 225] });
    R.spawns.push({ type: 'cronos', count: 1, area: [cx - 1, oz + N - 13, cx + 1, oz + N - 11], lvl: [250, 250] });
    out.push(R);
  }
  // Abismo Ardiente
  {
    const D = Z.abismo, R = makeIslet({ ...D, dockDir: [-1, 0] });
    R.portal = true; R.zone = 'abismo';
    const { x: cx, z: cz } = R.center, { prop, house } = H(R);
    R.towns.push({ name: 'Fortaleza Infernal', x: cx - 14, z: cz, r: 6 });
    R.reserve(cx - 14, cz, 6);
    house('abismo_1', cx - 18, cz - 4, 3, 3, 'e', { wall: 0x3a3030, roof: 0x1a1010, stone: true });
    prop('forge', cx - 12, cz + 3);
    R.npcs.push({ id: 'vulcan', name: 'Ermitaño Vulcan', x: cx - 14, z: cz, wander: 1, look: { shirt: 0x5a2a1a, pants: 0x2a1a10, robe: 0x3a1a10, hair: 0xe8e8e8, beard: 0xe8e8e8, skin: 0xa86a3a, hat: 'hood', hatColor: 0x2a1a10, axe: true } });
    R.arrive = { x: cx - 15, z: cz + 2 };
    populate(R, 1);
    const { ox, oz, N } = R;
    R.spawns.push({ type: 'demonio_alado', count: 6, area: [ox + 8, oz + 8, ox + N - 9, cz - 8], lvl: [230, 270] });
    R.spawns.push({ type: 'caballero_infernal', count: 6, area: [cx - 4, oz + 8, ox + N - 9, oz + N - 9], lvl: [250, 300] });
    R.spawns.push({ type: 'dragon_menor', count: 4, area: [ox + 8, cz + 8, ox + N - 9, oz + N - 9], lvl: [270, 320] });
    R.spawns.push({ type: 'titan_magma', count: 3, area: [cx + 6, oz + 8, ox + N - 9, oz + N - 9], lvl: [300, 340] });
    R.spawns.push({ type: 'senor_infernal', count: 1, area: [cx + 14, cz - 1, cx + 16, cz + 1], lvl: [350, 350] });
    out.push(R);
  }
  return out;
}

const PET_EVO = { loro: ['Guacamayo real', 'Fénix del trópico'], gato: ['Pantera de puerto', 'Tigre fantasma'], mono: ['Gorila pirata', 'Simio dorado'], dragon: ['Dragón joven', 'Dragón anciano'] };
const BUSINESS = { panaderia: { name: '🥖 Panadería', give: ['f_bread', 'f_tarta'] }, herreria: { name: '⚒️ Herrería', give: ['iron', 'silver', 'goldore'] }, taberna: { name: '🍺 Taberna', give: [] }, sastreria: { name: '🧵 Sastrería', give: ['cloth', 'leather'] } };

export function installMore13(Game, D) {
  const P = Game.prototype;
  const sfx = D.sfx;

  // ============================================================ zonas de la expansión
  P.zoneOf = function () { const r = this.W.regionAt(this.player.x, this.player.z); return r && r.zone ? r : null; };
  P.travelZone = function (key) {
    const z = Z[key], R = this.islets.find((r) => r.id === key), p = this.player;
    if (p.level < z.lvl) return this.toast(`🔒 Necesitas nivel ${z.lvl} para ir a ${z.name}`);
    if (this.sailing) return this.toast('Baja del barco primero');
    this.zoneReturn = { x: p.x, z: p.z };
    p.x = R.arrive.x; p.z = R.arrive.z; p.path = []; p.target = null;
    for (const n of this.following()) this.placeNear(n, Math.round(p.x), Math.round(p.z));
    this.camTarget.set(p.x, 0, p.z);
    this.buildZoneFx();
    this.toast({ celeste: '🎈 El globo de Volta te deja en la Ciudad Celeste, sobre las nubes', pasado: '⏳ El portal del tiempo te lleva a la Isla Bruma de hace 100 años', abismo: '🔥 Cruzas el portal del Abismo Ardiente...' }[key] || `🌀 El Oráculo te lleva a ${z.name}`, 'area');
    sfx('quest');
  };
  P.returnZone = function () {
    const p = this.player, r = this.zoneReturn || { x: 50, z: 52 };
    p.x = r.x; p.z = r.z; p.path = [];
    for (const n of this.following()) this.placeNear(n, Math.round(p.x), Math.round(p.z));
    this.camTarget.set(p.x, 0, p.z);
    this.toast('🧭 Vuelves a tu tiempo y a tu mar');
  };
  P.buildZoneFx = function () {
    if (this.zoneFx) return;
    this.zoneFx = true;
    for (const R of this.islets.filter((r) => r.zone)) {
      const g = new THREE.Group(), c = R.center;
      if (R.zone === 'celeste') {
        for (let i = 0; i < 40; i++) { const cl = new THREE.Mesh(new THREE.SphereGeometry(1.5 + Math.random() * 2, 10, 8), new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })); const a = Math.random() * Math.PI * 2, r = 30 + Math.random() * 20; cl.position.set(c.x + Math.cos(a) * r, -3 - Math.random() * 4, c.z + Math.sin(a) * r); cl.scale.y = 0.4; g.add(cl); }
        const bal = new THREE.Mesh(new THREE.SphereGeometry(0.9, 14, 10), new THREE.MeshLambertMaterial({ color: 0xd8602a })); bal.position.set(R.arrive.x - 1.5, 4, R.arrive.z); g.add(bal);
        const bask = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.8), new THREE.MeshLambertMaterial({ color: 0x8a6a44 })); bask.position.set(R.arrive.x - 1.5, 0.25, R.arrive.z); g.add(bask);
      } else {
        const zp = Z[R.zone].plane;
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshLambertMaterial(zp || (R.zone === 'abismo' ? { color: 0xff5010, emissive: 0xa02000 } : { color: 0x2a6a9a, transparent: true, opacity: 0.95 })));
        plane.rotation.x = -Math.PI / 2; plane.position.set(c.x, -0.35, c.z); g.add(plane);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.12, 8, 20), new THREE.MeshBasicMaterial({ color: R.zone === 'abismo' ? 0xff3a10 : 0xd8b040 })); ring.position.set(R.arrive.x - 1.5, 1, R.arrive.z); g.add(ring); R.ring = ring;
      }
      this.scene.add(g);
    }
  };
  P.updateZone = function () {
    const R = this.zoneOf(); if (!R) return;
    const z = Z[R.zone];
    if (!this.roomAt(this.player.x, this.player.z)) this.scene.background.lerp(new THREE.Color(z.bg), 0.75);
    if (R.ring) R.ring.rotation.y += 0.03;
  };
  P.zoneKills = function (key) { return Z[key].enemies.reduce((a, t) => a + (this.stats['k_' + t] || 0), 0); };
  P.zoneQuest = function (key, opts) {
    const z = Z[key], q = (this.zq = this.zq || {})[key] || 0, p = this.player;
    const base = (this.zqBase = this.zqBase || {});
    if (base[key] === undefined) base[key] = this.zoneKills(key);
    const kills = this.zoneKills(key) - base[key];
    if (q === 0) {
      if (kills >= 12) opts.push({ label: '✔ Entregar: limpiar la zona', action: () => { this.zq[key] = 1; this.flags['plan_' + z.plan] = true; p.gold += 8000; p.gainXp(20000); this.toast(`📜 ¡Plano de la armadura ${NEW_SETS.find((s) => s.id === z.plan).name}! Ya puedes forjarla (+8000 oro)`, 'area'); sfx('quest'); } });
      return `Misión 1: vence a 12 enemigos de esta tierra (${Math.min(12, kills)}/12). Recompensa: plano de armadura.`;
    }
    if (q === 1) {
      const [m, n] = z.gather;
      opts.push({ label: `✔ Entregar ${n} ${ITEMS[m].name.toLowerCase()} (tienes ${p.inv[m] || 0})`, action: () => this.buy({ [m]: n }, () => { this.zq[key] = 2; this.give(z.reward2[0], z.reward2[1]); p.gainXp(30000); this.toast(`🎁 +${z.reward2[1]} ${ITEMS[z.reward2[0]].name}`, 'area'); sfx('quest'); }) });
      return `Misión 2: tráeme ${n} × ${ITEMS[m].name}.`;
    }
    if (q === 2) {
      if ((this.stats['k_' + z.boss] || 0) > 0) opts.push({ label: `✔ Entregar: ${this.ENEMY_DEF[z.boss].name} derrotado`, action: () => { this.zq[key] = 3; this.give(z.bossReward || 'esencia_titan', 2); p.gold += z.bossGold || 30000; this.toast(`👑 ¡Has liberado ${z.name}! +30000 oro y 2 esencias de titán`, 'area'); if (['celeste', 'pasado', 'abismo'].every((k) => (this.zq[k] || 0) >= 3)) { this.flags.plan_celestial = true; this.toast('📜 ¡Has vencido a los tres jefes: plano de la Armadura Celestial Suprema!', 'area'); } sfx('quest'); } });
      return `Misión 3: derrota a ${this.ENEMY_DEF[z.boss].name}.`;
    }
    return 'Has salvado esta tierra. Siempre serás bienvenido.';
  };

  // ============================================================ rival personal
  P.updateNemesis = function (dt) {
    const p = this.player;
    if (p.level < 20 || this.sailing || this.nemNpc || p.dead || this.roomAt(p.x, p.z)) return;
    this.nemT = (this.nemT ?? 500) - dt;
    if (this.nemT > 0) return;
    this.nemT = 900 + Math.random() * 600;
    this.nem = this.nem || { name: 'Kael el Implacable', w: 0, l: 0 };
    let sp = null;
    for (let i = 0; i < 30 && !sp; i++) { const x = p.tx + Math.round((Math.random() - 0.5) * 6), z = p.tz + Math.round((Math.random() - 0.5) * 6); if (this.W.walkable(x, z) && Math.hypot(x - p.x, z - p.z) > 1.5) sp = { x, z }; }
    if (!sp) return;
    const lvl = Math.min(500, p.level + 3);
    const look = { shirt: 0x2a1a2a, pants: 0x1a1a1a, hair: 0xe8e8e8, skin: 0xd9a066, scarf: 0x8a1a1a, eyepatch: true };
    for (const id of Object.values(D.crewGear(lvl) || {})) if (EQUIP[id]) Object.assign(look, EQUIP[id].look);
    const n = new D.NPC(this, { id: 'nemesis', name: `${this.nem.name}`, x: sp.x, z: sp.z, wander: 0, look });
    n.baseLevel = lvl; n.setStats(lvl);
    this.npcs.push(n); this.nemNpc = n;
    const N = this.nem;
    this.ui.openDialog(N.name, N.w + N.l === 0 ? `Así que tú eres el famoso ${p.name}... Me llamo Kael. Desde hoy seré tu sombra: cada vez que crezcas, yo creceré más. ¡En guardia!` : `¡Otra vez nos vemos! Llevamos ${N.w} victorias tuyas y ${N.l} mías. Esta vez ganaré yo.`, [
      { label: '⚔️ Aceptar el duelo', action: () => this.startFight(n, 'duel') },
      { label: 'Huir', action: () => { this.toast('🏃 Kael se ríe: «¡Cobarde!»'); this.removeNem(); } },
    ]);
    sfx('quest');
  };
  P.removeNem = function () { const n = this.nemNpc; if (!n) return; this.nemNpc = null; setTimeout(() => { this.scene.remove(n.model.root); n.label.el.remove(); const i = this.npcs.indexOf(n); if (i >= 0) this.npcs.splice(i, 1); }, 2500); };
  const baseEnd = P.endFight;
  P.endFight = function (n, result) {
    const isNem = n && n.id === 'nemesis' && n.fight;
    const r = baseEnd.call(this, n, result);
    if (isNem) {
      const N = this.nem;
      if (result === 'win') { N.w++; const g = 1000 + this.player.level * 20; this.player.gold += g; this.toast(`🏆 ¡Has vencido a Kael! (${N.w}-${N.l}) +${g} oro. «¡Volveré más fuerte!»`, 'area'); if (N.w === 5 && !this.ownCos('c_capa_rival')) this.give('c_capa_rival'); }
      else { N.l++; this.toast(`💢 Kael te ha vencido (${N.w}-${N.l}). «Entrena más, ${this.player.name}.»`); }
      this.removeNem();
    }
    return r;
  };

  // ============================================================ tienda propia (en tu puerto)
  P.shopSpot = function () { const R = this.ownPort; return R && (this.flags.portLv || 0) >= 3 ? { x: R.center.x + 1, z: R.center.z + 6 } : null; };
  P.shopMenu = function () {
    const S = (this.myShop = this.myShop || { stock: {}, gold: 0, t: this.playtime });
    this.shopTick();
    const p = this.player;
    const sellable = Object.keys(p.inv).filter((k) => p.inv[k] > 0 && ITEMS[k] && (ITEMS[k].value || 0) > 0 && ['mat', 'ingr', 'food', 'elixir'].includes(ITEMS[k].type));
    const stockN = Object.values(S.stock).reduce((a, v) => a + v, 0);
    this.ui.openDialog('🏪 Tu tienda', `En venta: ${stockN} objetos (${Object.entries(S.stock).filter(([, v]) => v).map(([k, v]) => ITEMS[k].icon + v).join(' ') || 'nada'}). Vende 1 cada minuto a un 50% más de su valor, aunque no estés. Caja: ${S.gold} oro.`, [
      { label: `💰 Recoger la caja (${S.gold} oro)`, action: () => { p.gold += S.gold; S.gold = 0; sfx('coin'); this.shopMenu(); } },
      ...sellable.slice(0, 8).map((k) => ({ label: `➕ Poner a la venta 5 × ${ITEMS[k].icon} ${ITEMS[k].name} (tienes ${p.inv[k]})`, action: () => { const n = Math.min(5, p.inv[k]); p.inv[k] -= n; S.stock[k] = (S.stock[k] || 0) + n; this.shopMenu(); } })),
      { label: 'Cerrar', action: null },
    ]);
  };
  P.shopTick = function () {
    const S = this.myShop; if (!S) return;
    let mins = Math.floor((this.playtime - S.t) / 60);
    if (mins <= 0) return;
    S.t += mins * 60;
    for (const k of Object.keys(S.stock)) { while (mins > 0 && S.stock[k] > 0) { S.stock[k]--; S.gold += Math.round((ITEMS[k].value || 1) * 1.5); mins--; } }
  };

  // ============================================================ cartas piratas (siete y media)
  P.cardsMenu = function () {
    this.ui.openDialog('🃏 Siete y media pirata', 'Pide cartas para acercarte a 7,5 sin pasarte. Las figuras valen medio punto. ¿Cuánto apuestas?', [
      ...[50, 200, 1000].map((b) => ({ label: `💰 ${b} oro`, action: () => this.buy({ gold: b }, () => { this.cards = { bet: b, me: [this.drawCard()] }; this.cardsTurn(); }) })),
      { label: 'Ahora no', action: null },
    ]);
  };
  P.drawCard = function () { const v = Math.floor(Math.random() * 10) + 1; return v > 7 ? 0.5 : v; };
  P.cardsSum = (h) => h.reduce((a, v) => a + v, 0);
  P.cardsTurn = function () {
    const C = this.cards, s = this.cardsSum(C.me);
    const show = (h) => h.map((v) => (v === 0.5 ? '👑' : v)).join(' ');
    if (s > 7.5) { this.cards = null; return this.ui.openDialog('🃏 ¡Te pasaste!', `Tus cartas: ${show(C.me)} = ${s}. Pierdes ${C.bet} oro.`, [{ label: 'Otra partida', action: () => this.cardsMenu() }, { label: 'Dejarlo', action: null }]); }
    this.ui.openDialog('🃏 Tu turno', `Tus cartas: ${show(C.me)} = ${s}`, [
      { label: '🂠 Pedir carta', action: () => { C.me.push(this.drawCard()); this.cardsTurn(); } },
      { label: '✋ Plantarse', action: () => this.cardsDealer() },
    ]);
  };
  P.cardsDealer = function () {
    const C = this.cards, s = this.cardsSum(C.me), d = [this.drawCard()];
    while (this.cardsSum(d) < 5.5) d.push(this.drawCard());
    const ds = this.cardsSum(d), show = (h) => h.map((v) => (v === 0.5 ? '👑' : v)).join(' ');
    const win = ds > 7.5 || s > ds;
    if (win) { this.player.gold += C.bet * 2; this.stats.cardWins = (this.stats.cardWins || 0) + 1; }
    this.cards = null;
    this.ui.openDialog(win ? '🃏 ¡Ganas!' : '🃏 Gana la banca', `Tú: ${show(C.me)} = ${s}<br>Banca: ${show(d)} = ${ds}<br>${win ? `+${C.bet * 2} oro` : `Pierdes ${C.bet} oro`}`, [{ label: 'Otra partida', action: () => this.cardsMenu() }, { label: 'Dejarlo', action: null }]);
    sfx(win ? 'coin' : 'hurt');
  };

  // ============================================================ monstruos marinos con arpón
  P.updateSeaMonster = function (dt) {
    const b = this.boat, M = this.smon;
    if (!this.sailing || b.sinking) { if (M) { this.scene.remove(M.g); M.label.el.remove(); this.smon = null; } return; }
    const deep = !(b.x > -20 && b.z > -20 && b.x < 170 && b.z < 160);
    if (!M) {
      if (!deep || this.player.level < 40 || (this.net.isClient && this.net.active)) return;
      this.smT = (this.smT ?? 120) - dt;
      if (this.smT > 0) return;
      this.smT = 200 + Math.random() * 200;
      const kraken = Math.random() < 0.5, lvl = Math.min(500, this.player.level + 5);
      const g = new THREE.Group(), mat = new THREE.MeshLambertMaterial({ color: kraken ? 0x8a2a4a : 0x2a3a5a });
      if (kraken) { const h = new THREE.Mesh(new THREE.SphereGeometry(1.6, 14, 10), mat); h.position.y = 1; h.scale.y = 1.3; g.add(h); for (let i = 0; i < 8; i++) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.3, 3.5, 6), mat); const a = (i / 8) * Math.PI * 2; t.position.set(Math.cos(a) * 1.8, 0.8, Math.sin(a) * 1.8); t.rotation.z = Math.cos(a) * 0.8; t.rotation.x = Math.sin(a) * 0.8; g.add(t); } }
      else { const body = new THREE.Mesh(new THREE.SphereGeometry(1.6, 14, 10), mat); body.scale.set(1, 0.7, 3.2); body.position.y = 0.4; g.add(body); const tail = new THREE.Mesh(new THREE.BoxGeometry(3, 0.15, 0.9), mat); tail.position.set(0, 0.5, -5); g.add(tail); }
      for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe040 })); e.position.set(s * 0.7, 1.3, kraken ? 1.3 : 3.5); g.add(e); }
      const a = Math.random() * Math.PI * 2;
      const mx = b.x + Math.sin(a) * 16, mz = b.z + Math.cos(a) * 16;
      g.position.set(mx, -0.2, mz);
      this.scene.add(g);
      const hp = 2500 + lvl * 70;
      this.smon = { g, x: mx, z: mz, a, hp, max: hp, lvl, kraken, cd: 4, label: this.ui.makeLabel('enemy', '', { hp: true }) };
      this.smon.label.nm.textContent = `${kraken ? '🦑 Kraken menor' : '🐋 Ballena abisal'} · Nv. ${lvl}`;
      this.smon.label.nm.style.color = '#ff5ad0';
      this.ui.setHp(this.smon.label, 1);
      this.toast(`🌊 ¡Un monstruo marino emerge! ${this.flags.harpoon ? 'Usa el arpón' : 'Necesitas un arpón (Astillera Marga) para cazarlo'}`, 'area');
      sfx('hurt');
      return;
    }
    M.a += dt * 0.4;
    const tx = b.x + Math.sin(M.a) * 10, tz = b.z + Math.cos(M.a) * 10, d = Math.hypot(tx - M.x, tz - M.z);
    if (d > 0.1) { M.x += ((tx - M.x) / d) * Math.min(d, dt * 6); M.z += ((tz - M.z) / d) * Math.min(d, dt * 6); }
    M.g.position.set(M.x, -0.2 + Math.sin(this.time * 1.4) * 0.3, M.z); M.g.rotation.y = Math.atan2(tx - M.x, tz - M.z);
    this.ui.placeLabel(M.label, M.x, 4, M.z);
    M.cd -= dt;
    if (M.cd <= 0) { M.cd = 6; if (Math.hypot(b.x - M.x, b.z - M.z) < 13) { this.damageBoat(20 + M.lvl * 0.8, b.x, b.z); this.camShake = 0.4; this.toast(M.kraken ? '🦑 ¡Un tentáculo golpea el barco!' : '🐋 ¡La ballena embiste el barco!'); } }
    if (Math.hypot(b.x - M.x, b.z - M.z) > 60) { this.scene.remove(M.g); M.label.el.remove(); this.smon = null; }
  };
  P.harpoon = function () {
    const M = this.smon, b = this.boat;
    if (!M) return;
    if (this.time < (this.hpCd || 0)) return this.toast('Recargando el arpón...');
    this.hpCd = this.time + 2.2;
    sfx('cannon');
    if (Math.hypot(b.x - M.x, b.z - M.z) > 18) return this.toast('Demasiado lejos');
    if (Math.random() < 0.85) {
      const dmg = Math.round(60 + this.player.level * 4 + (this.shipStats().dmg || 0));
      M.hp -= dmg; this.ui.float(String(dmg), 'crit', M.x, 3, M.z); this.ui.setHp(M.label, Math.max(0, M.hp) / M.max);
      if (M.hp <= 0) {
        this.scene.remove(M.g); M.label.el.remove(); this.smon = null;
        const gold = 1500 + M.lvl * 25; this.player.gold += gold; this.give('ambar_gris', 1 + (Math.random() < 0.4 ? 1 : 0)); this.give('meat', 5);
        this.player.gainXp(2000 + M.lvl * 60);
        this.stats.seamonsters = (this.stats.seamonsters || 0) + 1;
        this.toast(`🏆 ¡Has cazado al monstruo marino! +${gold} oro y ámbar gris`, 'area'); sfx('quest');
      }
    } else this.toast('🌊 ¡Fallaste el arpón!');
  };

  // ============================================================ mascotas que evolucionan
  const basePet = P.updatePet;
  P.updatePet = function (dt) {
    basePet.call(this, dt);
    const o = this.petObj; if (!o || !this.petType) return;
    const L = this.petLevel(), st = L >= 35 ? 2 : L >= 15 ? 1 : 0;
    if (o.stage === st) return;
    const first = o.stage === undefined;
    o.stage = st;
    o.m.scale.setScalar([1, 1.35, 1.75][st]);
    if (st === 2) o.m.traverse((k) => { if (k.isMesh && k.material && k.material.emissive) { k.material = k.material.clone(); k.material.emissive.set(0x5a4a10); } });
    if (st > 0 && !first) { this.toast(`✨ ¡Tu mascota evoluciona a ${PET_EVO[this.petType] ? PET_EVO[this.petType][st - 1] : 'su forma ' + (st + 1)}!`, 'area'); this.ring(o.x, o.z, 1.4, 0xffe080); sfx('level'); }
  };

  // ============================================================ negocio de la pareja
  P.businessMenu = function (n) {
    const s = this.soc(n.id);
    if (!s.biz) {
      this.ui.openDialog(n.name, '¿Y si abro un negocio en Villarroca? Así ayudaría a la tripulación. Necesito 5000 oro para empezar.', [
        ...Object.entries(BUSINESS).map(([k, b]) => ({ label: `${b.name} (5000 oro)`, action: () => this.buy({ gold: 5000 }, () => { s.biz = { type: k, day: this.day }; this.toast(`💼 ¡${n.name} abre su ${b.name}! Pasa a recoger los beneficios cada día`, 'area'); if (this.crewMemory) this.crewMemory(n, `Abrí mi ${b.name} gracias a ti.`); sfx('quest'); }) })),
        { label: 'Ahora no', action: null },
      ]);
      return;
    }
    const B = BUSINESS[s.biz.type], days = this.day - s.biz.day;
    if (days <= 0) return this.ui.openDialog(n.name, `Mi ${B.name} va bien. Vuelve mañana a por los beneficios.`, [{ label: 'Vale', action: null }]);
    const gold = days * (s.biz.type === 'taberna' ? 600 : 350);
    this.player.gold += gold;
    for (let i = 0; i < Math.min(days, 5); i++) if (B.give.length) this.give(B.give[Math.floor(Math.random() * B.give.length)], 2);
    if (s.biz.type === 'sastreria' && Math.random() < 0.2 * Math.min(days, 5)) { const pool = Object.keys(EQUIP).filter((k) => EQUIP[k].cos && !this.ownCos(k) && EQUIP[k].src === 'tienda'); if (pool.length) this.give(pool[Math.floor(Math.random() * pool.length)]); }
    s.biz.day = this.day;
    this.ui.openDialog(n.name, `¡Mira lo que he ganado en ${days} día${days > 1 ? 's' : ''} con mi ${B.name}! Toma ${gold} oro${B.give.length ? ' y algunos productos' : ''}.`, [{ label: '💖 ¡Gracias!', action: null }]);
    sfx('coin');
  };

  // ============================================================ enganches
  P.npcDialog13 = function (id, opts) {
    for (const key of Object.keys(Z)) if (Z[key].giver === id) { opts.push({ label: '⚒️ Forjar equipo', action: () => this.panels.openCraft('forja') }); return this.zoneQuest(key, opts); }
    if (id === 'volta') opts.push({ label: `🎈 Viajar a la Ciudad Celeste (nivel ${Z.celeste.lvl})`, action: () => this.travelZone('celeste') });
    if (id === 'maestro') opts.push({ label: `⏳ Portal del tiempo: Isla Bruma de hace 100 años (nivel ${Z.pasado.lvl})`, action: () => this.travelZone('pasado') });
    if (id === 'brasa') opts.push({ label: `🔥 Portal del Abismo Ardiente (nivel ${Z.abismo.lvl})`, action: () => this.travelZone('abismo') });
    if (['rosa', 'coral', 'berta', 'mara'].includes(id)) opts.push({ label: '🃏 Jugar a las cartas (siete y media)', action: () => this.cardsMenu() });
    if (id === 'marga' && !this.flags.harpoon) opts.push({ label: '🎯 Arpón para monstruos marinos (3000 oro)', action: () => this.buy({ gold: 3000 }, () => { this.flags.harpoon = true; this.toast('🎯 ¡Arpón instalado! Navegando por aguas profundas aparecerán monstruos marinos'); }) });
    const s = this.soc(id);
    if (s.partner) opts.push({ label: s.biz ? `💼 Su ${BUSINESS[s.biz.type].name}: recoger beneficios` : '💼 Proponerle abrir un negocio', action: () => this.businessMenu(this.npcById(id)) });
    return null;
  };
  P.sailAction13 = function () {
    if (this.deck || !this.smon || !this.flags.harpoon) return null;
    return { icon: '🎯', label: 'Arpón', fn: () => this.harpoon() };
  };
  P.contextAction13 = function () {
    if (this.sailing) return null;
    const p = this.player, R = this.zoneOf();
    if (R && Math.hypot(p.x - (R.arrive.x - 1.5), p.z - R.arrive.z) < 2.2) return { icon: '🧭', label: 'Volver', fn: () => this.returnZone() };
    const sh = this.shopSpot(); if (sh && Math.hypot(p.x - sh.x, p.z - sh.z) < 1.8) return { icon: '🏪', label: 'Tienda', fn: () => this.shopMenu() };
    return null;
  };
  P.updateMore13 = function (dt) {
    if (!this.W._isIntPatched) { this.W._isIntPatched = true; const base = this.W.isInterior; this.W.isInterior = (x) => base(x) && !(x >= 2990 && x < 5200); }
    this.updateZone();
    this.updateNemesis(dt);
    this.updateSeaMonster(dt);
    this.m13T = (this.m13T || 0) - dt;
    if (this.m13T <= 0) { this.m13T = 2; this.shopTick(); }
  };
  P.newsHtml13 = function () {
    const zq = this.zq || {};
    return `<div class="sub">🆕 v5.0 · gran expansión (nivel máximo 350)</div><ul class="qlist">
      <li>🎈 <b>Ciudad Celeste</b> (Nv. 110-180, Volta): misiones ${Math.min(3, zq.celeste || 0)}/3.</li>
      <li>⏳ <b>Isla Bruma de hace 100 años</b> (Nv. 160-250, Maestro Ishvar): misiones ${Math.min(3, zq.pasado || 0)}/3.</li>
      <li>🔥 <b>Abismo Ardiente</b> (Nv. 230-350, Brasa): misiones ${Math.min(3, zq.abismo || 0)}/3.</li>
      <li>🛡 <b>12 armaduras nuevas</b> (72 piezas). Planos: ${['templario', 'negra', 'tirano', 'celestial'].filter((k) => this.flags['plan_' + k]).length}/4.</li>
      <li>⚔️ <b>Rival personal</b>: Kael el Implacable${this.nem ? ` (${this.nem.w}-${this.nem.l})` : ''}.</li>
      <li>🏪 Tienda propia · 🃏 cartas · 🎯 arpón · ✨ mascotas que evolucionan · 💼 negocio de tu pareja.</li></ul>`;
  };
}
export { Z as ZONES };

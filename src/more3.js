// v2.9: Ciudad de Coralia (campana de buceo), granja propia, mercado entre jugadores, historias de la tripulación,
// duelos con combos y parada perfecta, mareas y modo foto.
import * as THREE from 'three';
import { T } from './world.js';
import { ITEMS } from './items.js';

// ---------------------------------------------------------------- Ciudad de Coralia (bajo el mar)
const CX = 2100, CZ = 0, CW = 30, CD = 26;
export function makeCoralia() {
  const blocked = new Uint8Array(CW * CD);
  const R = { kind: 'dungeon', underwater: true, id: 'coralia', name: 'Ciudad de Coralia', X: CX, Z: CZ, W: CW, D: CD, exit: { x: CX + 3, z: CZ + 23 }, spawns: [], chests: [] };
  const inb = (lx, lz) => lx >= 0 && lz >= 0 && lx < CW && lz < CD;
  R.contains = (x, z) => x >= CX - 1 && x <= CX + CW && z >= CZ - 1 && z <= CZ + CD;
  R.tile = (x, z) => (inb(x - CX, z - CZ) ? T.SAND : T.WATER);
  R.walkable = (x, z) => { const lx = x - CX, lz = z - CZ; return inb(lx, lz) && !blocked[lz * CW + lx]; };
  R.setBlocked = (x, z, v) => { const lx = x - CX, lz = z - CZ; if (inb(lx, lz)) blocked[lz * CW + lx] = v; };
  R.groundY = () => 0;
  R.areaName = () => 'Ciudad de Coralia';
  // columnas y templos en ruinas
  R.ruins = [];
  for (const [x, z] of [[6, 6], [6, 12], [12, 6], [12, 12], [18, 6], [18, 12], [24, 6], [24, 12], [9, 18], [21, 18], [15, 3]]) { R.ruins.push({ x: CX + x, z: CZ + z }); blocked[z * CW + x] = 1; }
  R.chests = [[3, 3], [27, 3], [15, 9], [27, 21], [15, 21]].map(([x, z], i) => ({ id: 'coralia_' + i, x: CX + x, z: CZ + z, loot: { gold: 300, potion: 1 } }));
  for (const c of R.chests) blocked[(c.z - CZ) * CW + (c.x - CX)] = 1;
  R.spawns.push({ type: 'merfolk', count: 7, area: [CX + 2, CZ + 2, CX + 27, CZ + 20], lvl: [45, 60] });
  R.spawns.push({ type: 'jelly', count: 6, area: [CX + 2, CZ + 2, CX + 27, CZ + 20], lvl: [44, 58] });
  R.spawns.push({ type: 'abyss_queen', count: 1, area: [CX + 14, CZ + 14, CX + 16, CZ + 15], lvl: [72, 72] });
  return R;
}
export function makeJellyModel() {
  const root = new THREE.Group(), body = new THREE.Group(), torso = new THREE.Group();
  root.add(body); body.add(torso);
  const mat = new THREE.MeshPhongMaterial({ color: 0xd88ae8, transparent: true, opacity: 0.75, emissive: 0x401050, shininess: 80 });
  mat.userData.baseEmissive = new THREE.Color(0x401050);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  dome.position.y = 0.9; torso.add(dome);
  const flames = new THREE.Group();
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; const t = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.01, 0.6, 4), mat); t.position.set(Math.cos(a) * 0.18, 0.6, Math.sin(a) * 0.18); flames.add(t); }
  torso.add(flames);
  return { root, parts: { body, torso, flames }, mats: [mat], kind: 'skull', height: 1.3 };
}

// ---------------------------------------------------------------- historias de la tripulación
export const CREW_STORIES = {
  rufo: { title: 'El barco de Rufo', story: 'De niño, Rufo vio hundirse el barco de su padre a manos de corsarios. Quiere vengarlo.', task: { type: 'ship', target: 'pirate', count: 3 }, reward: 'sable_corsario' },
  olga: { title: 'La espada de Olga', story: 'Olga perdió su primera espada en la Isla Calavera, entre esqueletos.', task: { type: 'kill', target: 'skeleton', count: 10 }, reward: 'c_capa_negra' },
  quino: { title: 'El mapa de Quino', story: 'Quino guarda medio mapa de un tesoro. La otra mitad está enterrada en alguna isla.', task: { type: 'treasure', count: 1 }, reward: 'collar_perlas' },
  pepe: { title: 'Pepe quiere ser capitán', story: 'El grumete sueña con ver todo el Mar de Bruma.', task: { type: 'visit', targets: ['duna', 'selva', 'bastion', 'ceniza'] }, reward: 'c_gorra_capitan' },
  telmo: { title: 'La balada perdida', story: 'Telmo busca inspiración: quiere cantar la caída de una leyenda pirata.', task: { type: 'kill', target: 'famous', count: 1 }, reward: 'c_tunica_mago' },
  nico: { title: 'El aprendiz', story: 'Nico quiere demostrar a Tadeo que ya es herrero.', task: { type: 'gather', target: 'iron', count: 12 }, reward: 'espada_plata' },
  tito: { title: 'Brazos fuertes', story: 'Tito carga cajas desde niño. Quiere probarse contra un gólem.', task: { type: 'kill', target: 'golem', count: 3 }, reward: 'guantes_plata' },
  ines: { title: 'El marido pescador', story: 'El marido de Inés no volvió de pescar. Dicen que una serpiente marina ronda las profundidades.', task: { type: 'kill', target: 'serpent', count: 1 }, reward: 'c_vestido_azul' },
  gaspar: { title: 'El pez legendario', story: 'Gaspar lleva años intentando pescar algo grande.', task: { type: 'gather', target: 'fish', count: 15 }, reward: 'c_sombrero_paja' },
  tomasa: { title: 'Luces en la niebla', story: 'Desde el faro, Tomasa ve luces fantasma al suroeste las noches de niebla.', task: { type: 'kill', target: 'ghost_captain', count: 1 }, reward: 'c_capa_espectral' },
  pio: { title: 'La fuente del abuelo', story: 'Pío quiere decorar la fuente con coral del fondo del mar.', task: { type: 'gather', target: 'coral', count: 3 }, reward: 'c_chaleco_cuero' },
  elvira: { title: 'La guardia de la puerta sur', story: 'Elvira juró proteger el puerto. Los piratas rivales no la dejan dormir.', task: { type: 'kill', target: 'pirate', count: 8 }, reward: 'escudo_plata' },
  ramiro: { title: 'Lobos del norte', story: 'Un lobo hirió a Ramiro de joven. Quiere cerrar esa herida.', task: { type: 'kill', target: 'wolf', count: 15 }, reward: 'c_capa_lobo' },
  kuno: { title: 'El gran tigre', story: 'Kuno busca al tigre que marcó su cara.', task: { type: 'kill', target: 'tiger', count: 8 }, reward: 'c_capa_tigre' },
  farid: { title: 'Arena y escorpiones', story: 'Farid perdió a su caravana por los escorpiones.', task: { type: 'kill', target: 'scorpion', count: 12 }, reward: 'botas_ambar' },
  lucas: { title: 'Grillete libre', story: 'Lucas quiere ver hundirse las fragatas de la Marina.', task: { type: 'ship', target: 'marine', count: 3 }, reward: 'c_casaca_morada' },
  berta: { title: 'La receta de la abuela', story: 'Berta quiere recuperar la receta de la tarta de calabaza de su abuela.', task: { type: 'gather', target: 'f_tarta', count: 1 }, reward: 'c_vestido_rojo' },
  naira: { title: 'Agua para todos', story: 'Naira quiere un huerto en el Oasis. Necesita semillas.', task: { type: 'gather', target: 'semilla_calabaza', count: 5 }, reward: 'anillo_jade' },
  brasa: { title: 'El corazón del volcán', story: 'Brasa quiere forjar con el fuego del Dragón Rey.', task: { type: 'kill', target: 'dragon', count: 1 }, reward: 'hacha_obsidiana' },
  marga: { title: 'El barco perfecto', story: 'Marga sueña con navegar en un galeón.', task: { type: 'galeon' }, reward: 'c_capa_campeon' },
};

export function installMore3(Game, D) {
  const P = Game.prototype;
  const sfx = D.sfx;

  // ============================================================ Coralia
  P.dive = function () {
    if (!this.flags.diveBell) return this.toast('Necesitas una campana de buceo (Astillera Marga)');
    const p = this.player, b = this.boat;
    this.diveFrom = { x: b.x, z: b.z, h: b.heading };
    this.deck = null; this.autoHelm = null;
    b.speed = 0;
    this.sailing = false;
    this.scene.add(p.model.root);
    p.model.root.rotation.set(0, 0, 0);
    p.x = this.coralia.exit.x; p.z = this.coralia.exit.z - 1; p.path = [];
    this.unboardCrew(p.x, p.z);
    this.camTarget.set(p.x, 0, p.z);
    this.viewTarget = this.isMobile ? 11 : 12.5;
    this.oxy = 100;
    this.buildCoralia();
    for (const c of this.coralia.chests) if (this.flags[c.id] && this.flags[c.id + '_day'] !== this.day) this.flags[c.id] = false;
    this.toast('🔔 Bajas con la campana de buceo... ¡Ciudad de Coralia! Vigila el aire', 'area');
  };
  P.surface = function () {
    const p = this.player, b = this.boat, f = this.diveFrom || { x: b.x, z: b.z, h: b.heading };
    this.oxy = null;
    Object.assign(b, { x: f.x, z: f.z, heading: f.h, docked: null });
    p.x = b.x; p.z = b.z;
    this.board(true);
    this.toast('🔔 Vuelves a la superficie');
  };
  P.inCoralia = function () { const r = this.W.regionAt(this.player.x, this.player.z); return r && r.underwater; };
  P.buildCoralia = function () {
    if (this.coraliaBuilt) return;
    this.coraliaBuilt = true;
    const R = this.coralia, g = new THREE.Group();
    const M = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
    const sand = new THREE.Mesh(new THREE.BoxGeometry(CW + 6, 0.2, CD + 6), M(0xc8b088));
    sand.position.set(CX + CW / 2 - 0.5, -0.1, CZ + CD / 2 - 0.5); sand.receiveShadow = true; g.add(sand);
    const stone = M(0x8aa8b0, { map: this.M.tx.stone });
    for (const r of R.ruins) {
      const h = 1.6 + ((r.x * 7 + r.z) % 3) * 0.6;
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, h, 10), stone); c.position.set(r.x, h / 2, r.z); g.add(c);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.2, 0.9), stone); cap.position.set(r.x, h, r.z); g.add(cap);
    }
    // templo de la reina
    const temple = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 5), stone); base.position.y = 0.2; temple.add(base);
    for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 3, 8), stone); c.position.set(-3 + i * 2, 1.9, -2); temple.add(c); }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.8, 1.4, 4), M(0x5a8a9a)); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.6; roof.position.set(0, 4, -2); temple.add(roof);
    temple.position.set(CX + 15, 0, CZ + 16.5);
    g.add(temple);
    // corales y algas
    const cols = [0xff6a5a, 0xffa040, 0xd860c8, 0xf0e060, 0x5ad8c8];
    this.seaweed = [];
    for (let i = 0; i < 70; i++) {
      const x = CX - 2 + Math.random() * (CW + 3), z = CZ - 2 + Math.random() * (CD + 3);
      if (i % 2) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.12 + Math.random() * 0.1, 0.5 + Math.random() * 0.6, 5), M(cols[i % 5])); c.position.set(x, 0.3, z); g.add(c); }
      else { const w = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9 + Math.random() * 0.8, 0.02), M(0x2a8a4a)); w.position.set(x, 0.5, z); g.add(w); this.seaweed.push(w); }
    }
    // campana de buceo (salida)
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 1.4, 12, 1, true), M(0xd8a838, { side: THREE.DoubleSide }));
    bell.position.set(R.exit.x, 0.7, R.exit.z); g.add(bell);
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 12, 5), M(0x9a8058)); rope.position.set(R.exit.x, 7.4, R.exit.z); g.add(rope);
    // cofres
    for (const c of R.chests) {
      const ch = new THREE.Group();
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.5), M(0x6a4a2a)); b1.position.y = 0.2; ch.add(b1);
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.16, 0.54), M(0xd8a838)); b2.position.y = 0.45; ch.add(b2);
      ch.position.set(c.x, 0, c.z); g.add(ch);
    }
    // burbujas
    const N = 160, geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    this.bubbles = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xcff8ff, size: 5, sizeAttenuation: false, transparent: true, opacity: 0.7 }));
    this.bubbles.userData.seeds = Array.from({ length: N }, () => ({ x: Math.random() * 30, y: Math.random() * 8, z: Math.random() * 26, s: 0.5 + Math.random() }));
    this.bubbles.frustumCulled = false;
    g.add(this.bubbles);
    this.scene.add(g);
    for (const c of R.chests) this.chests.push(c);
  };
  P.updateCoralia = function (dt) {
    if (!this.inCoralia()) { if (this.oxy != null && !this.sailing) this.oxy = null; const ob = document.getElementById('oxyBar'); if (ob && !ob.classList.contains('hidden')) ob.classList.add('hidden'); return; }
    const p = this.player;
    this.scene.background.set(0x0a3a5a);
    if (!this.scene.fog || !this.scene.fog.isUnderwater) { this.scene.fog = new THREE.Fog(0x0a4a6a, 1, 2); this.scene.fog.isUnderwater = true; }
    const dist = this.camOffset.length();
    this.scene.fog.near = dist - 2; this.scene.fog.far = dist + 26;
    this.torch.position.set(p.x, 3, p.z); this.torch.distance = 16; this.torch.intensity = 3; this.torch.color.set(0x7ad8ff);
    // aire
    this.oxy = Math.max(0, (this.oxy ?? 100) - dt * (100 / (120 + (this.flags.diveBell2 ? 120 : 0))));
    if (this.oxy <= 0 && !p.dead) { this.airT = (this.airT || 0) + dt; if (this.airT > 1) { this.airT = 0; const d = Math.round(p.maxHp * 0.06); p.hp -= d; this.ui.float('-' + d + ' 💨', 'dmg', p.x, 1.4, p.z); if (p.hp <= 0) { p.hp = 0; p.dead = true; p.deadT = 3; } } }
    const ob = document.getElementById('oxyBar');
    if (ob) { ob.classList.remove('hidden'); document.getElementById('oxyFill').style.width = Math.round(this.oxy) + '%'; }
    if (this.seaweed) for (const w of this.seaweed) w.rotation.z = Math.sin(this.time * 1.5 + w.position.x) * 0.25;
    if (this.bubbles) {
      const pos = this.bubbles.geometry.attributes.position;
      this.bubbles.userData.seeds.forEach((s, i) => { s.y += dt * s.s; if (s.y > 8) s.y = 0; pos.setXYZ(i, CX + s.x + Math.sin(this.time + i) * 0.2, s.y, CZ + s.z); });
      pos.needsUpdate = true;
    }
  };

  // ============================================================ granja (huertos, gallinero, establo)
  const SEEDS = { semilla_trigo: { crop: 'wheat', n: 4, time: 120 }, semilla_zanahoria: { crop: 'zanahoria', n: 3, time: 150 }, semilla_calabaza: { crop: 'calabaza', n: 2, time: 200 } };
  P.farmMenu = function (b) {
    const p = this.player, opts = [];
    if (!b.crop) {
      for (const [sid, sd] of Object.entries(SEEDS)) if ((p.inv[sid] || 0) > 0) opts.push({ label: `🌱 Plantar ${ITEMS[sid].name.toLowerCase()} (${p.inv[sid]})`, action: () => { p.inv[sid]--; b.crop = sd.crop; b.cropN = sd.n; b.cropT = sd.time; b.grow = 0; b.water = 1; this.toast('🌱 ¡Plantado! Riégalo para que crezca'); } });
      if (!opts.length) opts.push({ label: '(Compra semillas a Lucía, la granjera)', action: null });
    } else {
      if (b.grow >= 1) opts.push({ label: `🧺 Cosechar ${ITEMS[b.crop].name.toLowerCase()}`, action: () => { const n = b.cropN + (Math.random() < this.jobLevel('granjero') * 0.03 ? 2 : 0); this.give(b.crop, n, b.x, b.z); this.give(Object.keys(SEEDS).find((k) => SEEDS[k].crop === b.crop), 1); this.jobXp('granjero', 15); b.crop = null; b.grow = 0; sfx('coin'); } });
      if (b.water < 0.99) opts.push({ label: '💧 Regar', action: () => { b.water = 1; this.ring(b.x + 0.5, b.z + 0.5, 1.2, 0x5ab8ff); this.jobXp('granjero', 2); } });
    }
    return opts;
  };
  P.animalMenu = function (b) {
    const opts = [];
    const prod = b.t === 'gallinero' ? 'huevo' : 'leche';
    if ((b.stock || 0) > 0) opts.push({ label: `🧺 Recoger ${b.stock} ${ITEMS[prod].name.toLowerCase()}`, action: () => { this.give(prod, b.stock, b.x, b.z); this.jobXp('granjero', 4 * b.stock); b.stock = 0; sfx('coin'); } });
    if (!b.fed && (this.player.inv.wheat || 0) > 0) opts.push({ label: '🌾 Dar de comer (1 trigo): produce el doble', action: () => { this.player.inv.wheat--; b.fed = 2; this.toast('🐔 ¡Qué contentos!'); } });
    return opts;
  };
  P.updateFarm = function (dt) {
    for (const b of this.builds || []) {
      if (b.t === 'huerto' && b.crop) {
        if (this.isWet && this.isWet()) b.water = 1;
        b.water = Math.max(0, (b.water ?? 1) - dt / 90);
        if (b.water > 0 && b.grow < 1) b.grow = Math.min(1, b.grow + dt / b.cropT);
        b.mesh.traverse((o) => { if (o.userData.crop) { o.scale.setScalar(0.3 + b.grow * 1.0); o.material.color.set(b.grow >= 1 ? (b.crop === 'calabaza' ? 0xe07a20 : b.crop === 'zanahoria' ? 0xe08a2a : 0xe0c040) : b.water > 0 ? 0x4aa848 : 0x8a8a3a); } });
      }
      if (b.t === 'gallinero' || b.t === 'establo') {
        b.prodT = (b.prodT || 0) + dt;
        const per = b.t === 'gallinero' ? 90 : 150;
        if (b.prodT >= per) { b.prodT = 0; b.stock = Math.min(10, (b.stock || 0) + (b.fed ? 2 : 1)); if (b.fed) b.fed--; }
        if (b.animals) b.animals.forEach((a, i) => { a.position.x = Math.sin(this.time * 0.6 + i * 2) * 0.5; a.position.z = Math.cos(this.time * 0.5 + i) * 0.5; a.rotation.y = this.time * 0.6 + i; });
      }
    }
  };

  // ============================================================ mercado entre jugadores
  P.marketList = function () { return this.market || (this.market = []); };
  P.openMarket = function () {
    if (!this.net.active) return this.toast('🏪 El mercado de jugadores funciona en una partida multijugador');
    if (!this.net.isHost) this.net.toHost({ k: 'mkGet' });
    this.panels.openMarket(this.marketList());
  };
  P.marketPost = function (id, n, price) {
    const p = this.player;
    if ((p.inv[id] || 0) < n || n <= 0 || price <= 0) return;
    p.inv[id] -= n;
    const offer = { id: Date.now() % 1e9 + Math.floor(Math.random() * 1000), seller: this.net.myId, name: p.name, item: id, n, price };
    if (this.net.isHost) this.marketHost(0, { k: 'mkPost', offer }); else this.net.toHost({ k: 'mkPost', offer });
    this.toast(`🏪 Pones a la venta ${n} ${ITEMS[id].name.toLowerCase()} por ${price} oro`);
  };
  P.marketBuy = function (o) {
    if (this.player.gold < o.price) return this.toast('No tienes suficiente oro');
    if (o.seller === this.net.myId) return this.marketCancel(o);
    if (this.net.isHost) this.marketHost(0, { k: 'mkBuy', id: o.id }); else this.net.toHost({ k: 'mkBuy', id: o.id });
  };
  P.marketCancel = function (o) { if (this.net.isHost) this.marketHost(0, { k: 'mkCancel', id: o.id }); else this.net.toHost({ k: 'mkCancel', id: o.id }); };
  // el anfitrión guarda la lista del mercado
  P.marketHost = function (from, m) {
    const L = this.marketList();
    const tell = (to, msg) => { if (to === 0) this.onNetX(0, msg); else this.net.sendX(msg, to); };
    if (m.k === 'mkPost') { m.offer.seller = from; L.push(m.offer); }
    else if (m.k === 'mkBuy') {
      const i = L.findIndex((o) => o.id === m.id);
      if (i < 0) return tell(from, { k: 'mkFail', to: from });
      const o = L.splice(i, 1)[0];
      tell(from, { k: 'mkGot', to: from, item: o.item, n: o.n, price: o.price });
      tell(o.seller, { k: 'mkSold', to: o.seller, item: o.item, n: o.n, price: o.price });
    } else if (m.k === 'mkCancel') {
      const i = L.findIndex((o) => o.id === m.id && o.seller === from);
      if (i >= 0) { const o = L.splice(i, 1)[0]; tell(from, { k: 'mkBack', to: from, item: o.item, n: o.n }); }
    }
    this.net.sendX({ k: 'mk', list: L });
    if (this.panels.open === 'market') this.panels.openMarket(L);
  };
  P.onNetX3 = function (from, m) {
    const me = this.net.myId;
    if (m.k === 'mk') { this.market = m.list; if (this.panels.open === 'market') this.panels.openMarket(m.list); }
    else if (m.k === 'mkGot' && m.to === me) { this.player.gold -= m.price; this.give(m.item, m.n); this.toast(`🏪 Compraste ${m.n} ${ITEMS[m.item].name.toLowerCase()} por ${m.price} oro`); sfx('coin'); }
    else if (m.k === 'mkSold' && m.to === me) { this.player.gold += m.price; this.toast(`🏪 ¡Vendiste ${m.n} ${ITEMS[m.item].name.toLowerCase()}! +${m.price} oro`); sfx('coin'); }
    else if (m.k === 'mkBack' && m.to === me) { this.give(m.item, m.n); }
    else if (m.k === 'mkFail' && m.to === me) this.toast('Esa oferta ya no está');
    else return false;
    return true;
  };

  // ============================================================ historias de la tripulación
  P.crewStoryOpt = function (n) {
    const S = CREW_STORIES[n.id];
    if (!S || !this.soc(n.id).crew) return null;
    this.crewQ = this.crewQ || {};
    const q = this.crewQ[n.id];
    if (q && q.s === 2) return null;
    if (!q) {
      if (this.soc(n.id).f < 60) return { label: `📖 Su historia (necesitas más amistad)`, action: null };
      return { label: `📖 Historia: ${S.title}`, action: () => this.ui.openDialog(n.name, `${S.story}\n\nMisión: ${this.storyTaskText(S.task)}`, [{ label: '✔ Te ayudaré', action: () => { this.crewQ[n.id] = { s: 1, p: 0, v: [] }; this.toast(`📖 Misión de ${n.name}: ${S.title}`); } }, { label: 'Ahora no', action: null }]) };
    }
    if (this.storyDone(n.id)) return { label: `✔ Cumplir: ${S.title}`, action: () => this.finishStory(n) };
    return { label: `📖 ${S.title} (${this.storyProg(n.id)})`, action: () => this.ui.openDialog(n.name, `${S.story}\n\nMisión: ${this.storyTaskText(S.task)} (${this.storyProg(n.id)})`, [{ label: 'Seguimos', action: null }]) };
  };
  P.storyTaskText = function (t) {
    const nm = (k) => (this.ENEMY_DEF[k] ? this.ENEMY_DEF[k].name : k === 'famous' ? 'pirata famoso' : k === 'serpent' ? 'serpiente marina' : k);
    if (t.type === 'kill') return `Vence a ${t.count} × ${nm(t.target)}`;
    if (t.type === 'ship') return `Hunde ${t.count} barcos ${t.target === 'marine' ? 'de la Marina' : 'piratas'}`;
    if (t.type === 'gather') return `Consigue ${t.count} × ${ITEMS[t.target].name}`;
    if (t.type === 'visit') return 'Visita Isla Duna, Isla Selva, el Bastión y la Isla Ceniza';
    if (t.type === 'treasure') return 'Desentierra un tesoro';
    if (t.type === 'galeon') return 'Compra el galeón a Marga';
    return '';
  };
  P.storyProg = function (id) {
    const S = CREW_STORIES[id], q = this.crewQ[id], t = S.task;
    if (t.type === 'gather') return `${Math.min(this.player.inv[t.target] || 0, t.count)}/${t.count}`;
    if (t.type === 'visit') return `${q.v.length}/${t.targets.length}`;
    if (t.type === 'galeon') return this.shipUp.owned && this.shipUp.owned.includes('galeon') ? '1/1' : '0/1';
    if (t.type === 'treasure') return `${Math.min(1, q.p)}/1`;
    return `${q.p}/${t.count}`;
  };
  P.storyDone = function (id) {
    const t = CREW_STORIES[id].task, q = this.crewQ[id];
    if (t.type === 'gather') return (this.player.inv[t.target] || 0) >= t.count;
    if (t.type === 'visit') return q.v.length >= t.targets.length;
    if (t.type === 'galeon') return !!(this.shipUp.owned && this.shipUp.owned.includes('galeon'));
    if (t.type === 'treasure') return q.p >= 1;
    return q.p >= t.count;
  };
  P.storyTick = function (kind, target) {
    for (const [id, q] of Object.entries(this.crewQ || {})) {
      if (q.s !== 1) continue;
      const t = CREW_STORIES[id].task;
      if (t.type === kind && (t.target === target || kind === 'treasure')) { q.p++; if (this.storyDone(id)) this.toast(`📖 Misión de ${this.npcById(id).name} cumplida: habla con él/ella`); }
    }
  };
  P.updateStories = function () {
    const isle = this.isleOf ? this.isleOf(this.player.x, this.player.z) : null;
    for (const [id, q] of Object.entries(this.crewQ || {})) {
      const t = CREW_STORIES[id].task;
      if (q.s === 1 && t.type === 'visit' && isle && t.targets.includes(isle) && !q.v.includes(isle)) { q.v.push(isle); this.toast(`📖 ${this.npcById(id).name}: ¡${isle === 'bastion' ? 'el Bastión' : 'otra isla'} tachada de la lista!`); }
    }
  };
  P.finishStory = function (n) {
    const S = CREW_STORIES[n.id], t = S.task;
    if (t.type === 'gather') this.player.inv[t.target] -= t.count;
    this.crewQ[n.id].s = 2;
    this.soc(n.id).loyal = true;
    this.give(S.reward, 1, this.player.x, this.player.z);
    this.addFriend(n, 15);
    this.ui.openDialog(n.name, `Gracias, capitán. Nunca lo olvidaré: a partir de hoy lucharé con todo mi corazón. (${n.name} es leal: +25% de daño)`, [{ label: '❤', action: null }]);
    sfx('quest');
  };

  // ============================================================ combos y parada perfecta
  P.comboMul = function () {
    const p = this.player, now = this.time;
    if (now - (p.lastHitT || -9) > 1.1) p.combo = 0;
    p.combo = (p.combo || 0) + 1;
    p.lastHitT = now;
    let k = 1;
    if (p.combo % 3 === 0) { k = 1.8; this.ui.float('¡Remate!', 'crit', p.x, 2, p.z); this.camShake = 0.15; }
    if (p.counter) { k *= 2; p.counter = false; this.ui.float('¡Contraataque!', 'crit', p.x, 2.2, p.z); }
    const el = document.getElementById('comboTxt');
    if (el) { el.textContent = p.combo > 1 ? `${p.combo} combo` : ''; el.style.opacity = p.combo > 1 ? 1 : 0; }
    return k;
  };
  P.blockPress = function (down) {
    const p = this.player;
    if (down) { if (this.sailing || p.dead) return; p.blocking = true; p.blockT = this.time; p.st.block = true; }
    else { p.blocking = false; p.st.block = false; }
  };
  // devuelve el daño final tras bloquear (y aplica la parada perfecta)
  P.blockDamage = function (e, dmg) {
    const p = this.player;
    if (!p.blocking || !e || e.isRemote === undefined && !e.x) return dmg;
    if (this.time - p.blockT < 0.35) {
      this.ui.float('¡PARADA!', 'crit', p.x, 1.9, p.z);
      if (e.stunT !== undefined || e.def) e.stunT = 1.4;
      p.counter = true;
      this.ring(p.x, p.z, 1.2, 0xffffff);
      sfx('mine');
      this.stats.parries = (this.stats.parries || 0) + 1;
      return 0;
    }
    this.ui.float('Bloqueo', 'info', p.x, 1.7, p.z);
    return Math.round(dmg * 0.4);
  };

  // ============================================================ mareas
  P.tideLevel = function () { return Math.sin(((this.tod - 3) / 12) * Math.PI * 2 + Math.PI / 2); };
  P.lowTide = function () { return this.tideLevel() < -0.35; };
  P.updateTides = function (dt) {
    const tor = this.islets.find((r) => r.id === 'tortuga');
    if (!tor || !tor.tidal) return;
    const low = this.lowTide();
    if (!this.tideMesh) {
      const pos = [];
      for (const k of tor.tidal) { const x = (k % 4096) - 1024, z = Math.floor(k / 4096) - 1024; pos.push(x - 0.5, 0, z - 0.5, x - 0.5, 0, z + 0.5, x + 0.5, 0, z + 0.5, x - 0.5, 0, z - 0.5, x + 0.5, 0, z + 0.5, x + 0.5, 0, z - 0.5); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
      this.tideMesh = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: 0xd8c08a }));
      this.tideMesh.receiveShadow = true;
      this.scene.add(this.tideMesh);
      this.clams = [];
    }
    const lv = this.tideLevel();
    this.tideMesh.position.y = Math.max(-0.4, Math.min(-0.02, -0.12 - lv * 0.25));
    this.tideMesh.visible = lv < 0.2;
    if (low !== tor.low) {
      tor.low = low;
      const p = this.player;
      if (Math.hypot(p.x - 135, p.z - 19) < 60) this.toast(low ? '🌊 La marea baja: aparece un bajío hacia la Roca de la Marea (Isla Tortuga)' : '🌊 Sube la marea');
      // almejas que solo se ven con marea baja
      for (const c of this.clams) this.scene.remove(c.m);
      this.clams = [];
      if (low) {
        const keys = [...tor.tidal];
        for (let i = 0; i < 8; i++) {
          const k = keys[Math.floor(Math.random() * keys.length)];
          const x = (k % 4096) - 1024, z = Math.floor(k / 4096) - 1024;
          const m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xf0d8c8 }));
          m.position.set(x, 0, z); this.scene.add(m);
          this.clams.push({ m, x, z });
        }
      }
      // si te pilla la marea en el bajío, nadas
    }
  };
  P.clamNear = function () {
    if (!this.clams) return null;
    const p = this.player;
    return this.clams.find((c) => Math.hypot(c.x - p.x, c.z - p.z) < 1.2) || null;
  };
  P.pickClam = function (c) {
    this.scene.remove(c.m);
    this.clams.splice(this.clams.indexOf(c), 1);
    this.give('almeja', 1, c.x, c.z);
    if (Math.random() < 0.15) this.give('perla', 1);
    sfx('coin');
  };

  // ============================================================ modo foto
  const POSES = [['', 'Normal'], ['wave', '👋 Saludar'], ['victory', '✌️ Victoria'], ['sit', '🪑 Sentado'], ['dance', '💃 Bailar'], ['meditate', '🧘 Meditar'], ['sword', '⚔️ En guardia']];
  const FRAMES = [['none', 'Sin marco'], ['madera', 'Madera pirata'], ['pergamino', 'Pergamino'], ['sebusca', 'Se busca'], ['polaroid', 'Instantánea']];
  const FILTERS = [['none', 'Normal'], ['sepia', 'Sepia'], ['bn', 'Blanco y negro'], ['calido', 'Cálido'], ['frio', 'Frío']];
  P.photoMode = function (on) {
    this.photo = on ? { pose: 0, frame: 1, filter: 0 } : null;
    document.body.classList.toggle('photo', !!on);
    const el = document.getElementById('photoUI');
    if (el) el.classList.toggle('hidden', !on);
    if (on) { this.paused = false; this.renderPhotoUI(); } else { this.player.st.pose = null; }
  };
  P.renderPhotoUI = function () {
    const ph = this.photo, el = document.getElementById('photoUI');
    if (!ph || !el) return;
    el.innerHTML = `<button data-ph="pose">${POSES[ph.pose][1]}</button><button data-ph="frame">🖼 ${FRAMES[ph.frame][1]}</button><button data-ph="filter">🎨 ${FILTERS[ph.filter][1]}</button><button data-ph="zin">🔍+</button><button data-ph="zout">🔍−</button><button data-ph="shot" class="big">📸 Foto</button><button data-ph="exit">✕</button>`;
    document.getElementById('photoFrame').className = 'fr-' + FRAMES[ph.frame][0] + ' fl-' + FILTERS[ph.filter][0];
  };
  P.photoAction = function (a) {
    const ph = this.photo;
    if (!ph) return;
    if (a === 'pose') { ph.pose = (ph.pose + 1) % POSES.length; this.player.st.pose = POSES[ph.pose][0] || null; }
    if (a === 'frame') ph.frame = (ph.frame + 1) % FRAMES.length;
    if (a === 'filter') ph.filter = (ph.filter + 1) % FILTERS.length;
    if (a === 'zin') this.viewTarget = Math.max(3, this.viewTarget - 1.5);
    if (a === 'zout') this.viewTarget = Math.min(24, this.viewTarget + 1.5);
    if (a === 'exit') return this.photoMode(false);
    if (a === 'shot') return this.takePhoto();
    this.renderPhotoUI();
  };
  P.takePhoto = function () {
    const ph = this.photo, R = this.renderer;
    R.render(this.scene, this.camera);
    const src = R.domElement;
    const W = 1280, H = Math.round(1280 * src.height / src.width);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    const f = FILTERS[ph.filter][0];
    x.filter = f === 'sepia' ? 'sepia(0.85)' : f === 'bn' ? 'grayscale(1) contrast(1.1)' : f === 'calido' ? 'saturate(1.3) sepia(0.25)' : f === 'frio' ? 'saturate(0.9) hue-rotate(15deg) brightness(1.05)' : 'none';
    x.drawImage(src, 0, 0, W, H);
    x.filter = 'none';
    const fr = FRAMES[ph.frame][0];
    if (fr === 'madera') { x.lineWidth = 34; x.strokeStyle = '#5a3a1a'; x.strokeRect(17, 17, W - 34, H - 34); x.lineWidth = 6; x.strokeStyle = '#d8a838'; x.strokeRect(36, 36, W - 72, H - 72); }
    if (fr === 'pergamino') { const g = x.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.85); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(120,80,30,0.85)'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
    if (fr === 'sebusca') { x.fillStyle = 'rgba(232,216,168,0.92)'; x.fillRect(0, 0, W, 110); x.fillRect(0, H - 120, W, 120); x.fillStyle = '#3a2410'; x.font = 'bold 80px Georgia'; x.textAlign = 'center'; x.fillText('SE BUSCA', W / 2, 85); x.font = 'bold 48px Georgia'; x.fillText(`${this.player.name.toUpperCase()} · 🪙 ${(this.bounty || 0).toLocaleString('es')}`, W / 2, H - 50); }
    if (fr === 'polaroid') { const cv = document.createElement('canvas'); cv.width = W + 80; cv.height = H + 220; const y = cv.getContext('2d'); y.fillStyle = '#f8f6f0'; y.fillRect(0, 0, cv.width, cv.height); y.drawImage(c, 40, 40); y.fillStyle = '#3a2a1a'; y.font = 'italic 46px Georgia'; y.textAlign = 'center'; y.fillText(`${this.player.name} · ${this.W.areaName(this.player.tx, this.player.tz)}`, cv.width / 2, H + 140); c.width = cv.width; c.height = cv.height; x.drawImage(cv, 0, 0); }
    x.fillStyle = 'rgba(255,255,255,0.85)'; x.font = 'bold 26px Georgia'; x.textAlign = 'right'; x.fillText('⚓ Bruma', c.width - 50, c.height - 30);
    const url = c.toDataURL('image/png');
    const name = `bruma_${Date.now()}.png`;
    let msg = '';
    if (window.AndroidBridge && window.AndroidBridge.saveImage) { const r = window.AndroidBridge.saveImage(url.split(',')[1], name); msg = r ? `📸 Foto guardada en ${r}` : '❌ No se pudo guardar la foto'; }
    else { const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); msg = '📸 Foto descargada'; }
    this.stats.photos = (this.stats.photos || 0) + 1;
    this.lastPhoto = url;
    const fl = document.getElementById('photoFlash'); if (fl) { fl.classList.add('on'); setTimeout(() => fl.classList.remove('on'), 180); }
    this.toast(msg);
    sfx('click');
  };
}

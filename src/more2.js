// v2.8: monturas, isla espectral (solo con niebla), clanes y cofre común, música por zona, logros con títulos,
// casas grandes y tienda de muebles, puestos de la tripulación y PvP naval + captura la bandera.
import * as THREE from 'three';
import { makeIslet } from './regions.js';
import { T } from './world.js';

// ---------------------------------------------------------------- monturas
export const MOUNTS = {
  caballo: { name: 'Caballo de la granja', icon: '🐴', price: 800, seller: 'lucia', speed: 1.75, col: 0x7a4a2a, mane: 0x2a1a10 },
  camello: { name: 'Camello del desierto', icon: '🐫', price: 1400, seller: 'zaid', speed: 1.7, col: 0xc89a5a, mane: 0x8a6a3a, hump: true },
  salamandra: { name: 'Salamandra de lava', icon: '🦎', price: 4000, seller: 'brasa', speed: 2.0, col: 0x3a2a2a, mane: 0xff6020, lizard: true },
  trineo: { name: 'Trineo de perros', icon: '🛷', price: 5000, seller: 'helga', speed: 1.85, col: 0x8a8a90, mane: 0xf4f4f4, sled: true },
};
export function mountModel(type) {
  const d = MOUNTS[type];
  if (d.lizard) return lizardModel(d);
  if (d.sled) return sledModel(d);
  const camel = !!d.hump;
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  const mats = {};
  const M = (c) => mats[c] || (mats[c] = new THREE.MeshLambertMaterial({ color: c }));
  const coat = camel ? 0xc8a066 : 0xc8a06a, dark = camel ? 0x8a6a3a : 0x2a2018, muzzle = camel ? 0xa8845a : 0x3a2a20;
  const mesh = (geo, c, x, y, z, rx = 0, ry = 0, rz = 0, parent = body) => { const m = new THREE.Mesh(geo, M(c)); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; parent.add(m); return m; };
  const caps = (r, l, seg = 8) => new THREE.CapsuleGeometry(r, l, 4, seg);
  const H = camel ? 1.05 : 0.98; // altura del lomo
  // tronco: pecho, barriga y grupa
  mesh(caps(0.165, 0.7, 12), coat, 0, H, 0, Math.PI / 2).scale.set(0.9, 1, 1);
  mesh(new THREE.SphereGeometry(0.2, 12, 10), coat, 0, H + 0.03, 0.4).scale.set(0.85, 1.12, 0.95);
  mesh(new THREE.SphereGeometry(0.2, 12, 10), coat, 0, H + 0.04, -0.4).scale.set(0.95, 1.05, 1.0);
  mesh(new THREE.BoxGeometry(0.03, 0.02, 0.95), dark, 0, H + 0.2, 0); // raya de mula
  if (camel) { mesh(new THREE.SphereGeometry(0.2, 12, 10), coat, 0, H + 0.22, -0.05).scale.set(0.9, 1.1, 1.2); }
  // cuello arqueado y cabeza
  const neck = new THREE.Group(); neck.position.set(0, H + 0.1, 0.5); body.add(neck);
  mesh(caps(camel ? 0.075 : 0.085, camel ? 0.5 : 0.46, 10), coat, 0, camel ? 0.22 : 0.22, camel ? 0.12 : 0.1, camel ? -0.25 : -0.45, 0, 0, neck);
  const head = new THREE.Group(); head.position.set(0, camel ? 0.5 : 0.5, camel ? 0.28 : 0.22); neck.add(head);
  mesh(caps(0.07, 0.28, 10), coat, 0, -0.02, 0.1, 1.25, 0, 0, head);
  mesh(new THREE.SphereGeometry(0.068, 10, 8), muzzle, 0, -0.1, 0.27, 0, 0, 0, head).scale.set(0.95, 0.85, 1.15);
  for (const sx of [-1, 1]) {
    mesh(new THREE.ConeGeometry(0.026, 0.11, 6), coat, sx * 0.045, 0.1, -0.03, -0.2, 0, sx * 0.25, head);
    mesh(new THREE.SphereGeometry(0.016, 6, 5), 0x111111, sx * 0.07, 0.03, 0.08, 0, 0, 0, head);
    mesh(new THREE.SphereGeometry(0.012, 5, 4), 0x111111, sx * 0.03, -0.11, 0.35, 0, 0, 0, head);
  }
  // crin y tupé
  if (!camel) {
    for (let i = 0; i < 9; i++) mesh(new THREE.BoxGeometry(0.035, 0.17, 0.08), dark, (i % 2 ? 0.035 : -0.035), 0.06 + i * 0.05, -0.05 + i * 0.022, -0.45, 0, i % 2 ? 0.35 : -0.35, neck);
    mesh(new THREE.BoxGeometry(0.05, 0.1, 0.05), dark, 0, 0.1, 0.04, 0.7, 0, 0, head);
  }
  // cola larga
  const tail = new THREE.Group(); tail.position.set(0, H + 0.12, -0.58); body.add(tail);
  for (let i = 0; i < 5; i++) mesh(new THREE.CapsuleGeometry(camel ? 0.025 : 0.055 - i * 0.006, 0.14, 3, 6), dark, 0, -0.06 - i * 0.12, -0.07 - i * 0.025, -0.35 + i * 0.07, 0, 0, tail);
  // patas articuladas con calcetines oscuros y cascos
  const legs = [];
  for (const [x, z] of [[-0.09, 0.4], [0.09, 0.4], [-0.09, -0.4], [0.09, -0.4]]) {
    const hip = new THREE.Group(); hip.position.set(x, H - 0.12, z); body.add(hip);
    const L1 = camel ? 0.46 : 0.44, L2 = camel ? 0.42 : 0.42;
    mesh(caps(0.062, L1 - 0.12, 8), coat, 0, -L1 / 2, 0, 0, 0, 0, hip);
    const knee = new THREE.Group(); knee.position.y = -L1; hip.add(knee);
    mesh(caps(0.034, L2 - 0.08, 8), camel ? coat : dark, 0, -L2 / 2, 0, 0, 0, 0, knee);
    mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.06, 10), 0x111111, 0, -L2, 0.01, 0, 0, 0, knee);
    hip.userData.knee = knee;
    legs.push(hip);
  }
  // silla, manta, estribos y riendas
  mesh(new THREE.BoxGeometry(0.38, 0.03, 0.4), 0x8a1a1a, 0, H + (camel ? 0.4 : 0.17), -0.02);
  mesh(caps(0.11, 0.14, 8), 0x5a3418, 0, H + (camel ? 0.45 : 0.21), -0.02, Math.PI / 2, 0, 0).scale.set(1.2, 0.55, 1);
  mesh(new THREE.BoxGeometry(0.06, 0.1, 0.05), 0x5a3418, 0, H + (camel ? 0.52 : 0.27), 0.1);
  for (const sx of [-1, 1]) {
    mesh(new THREE.BoxGeometry(0.012, 0.3, 0.012), 0x3a2414, sx * 0.2, H + 0.02, 0);
    mesh(new THREE.TorusGeometry(0.035, 0.008, 4, 8), 0xb8b0a0, sx * 0.2, H - 0.14, 0, 0, Math.PI / 2, 0);
    mesh(new THREE.BoxGeometry(0.01, 0.01, 0.62), 0x3a2414, sx * 0.06, H + 0.36, 0.44, -0.55, 0, 0);
  }
  g.userData = { legs, body, neck, tail, h: H + (camel ? 0.48 : 0.25) };
  return g;
}
function sledModel(d) {
  // trineo de madera con dos perros de nieve tirando delante
  const g = new THREE.Group();
  const M = (c) => new THREE.MeshLambertMaterial({ color: c });
  const body = new THREE.Group(); g.add(body);
  const add = (geo, c, x, y, z, rx = 0, parent = body, rz = 0) => { const m = new THREE.Mesh(geo, M(c)); m.position.set(x, y, z); m.rotation.x = rx; m.rotation.z = rz; m.castShadow = true; parent.add(m); return m; };
  for (const s of [-1, 1]) { add(new THREE.BoxGeometry(0.04, 0.04, 1.3), 0x5a3a1a, s * 0.28, 0.04, -0.35); add(new THREE.BoxGeometry(0.04, 0.2, 0.04), 0x5a3a1a, s * 0.28, 0.14, -0.7); add(new THREE.BoxGeometry(0.04, 0.2, 0.04), 0x5a3a1a, s * 0.28, 0.14, 0); add(new THREE.BoxGeometry(0.04, 0.05, 0.2), 0x5a3a1a, s * 0.28, 0.08, 0.32, -0.6); }
  add(new THREE.BoxGeometry(0.62, 0.06, 0.95), 0x8a5a2a, 0, 0.26, -0.35);
  add(new THREE.BoxGeometry(0.62, 0.35, 0.06), 0x7a4a22, 0, 0.42, -0.8);
  add(new THREE.BoxGeometry(0.5, 0.05, 0.5), 0xb82a2a, 0, 0.3, -0.4);
  const legs = [];
  for (const dx of [-0.22, 0.22]) {
    const dog = new THREE.Group(); dog.position.set(dx, 0, 0.75); body.add(dog);
    add(new THREE.CapsuleGeometry(0.1, 0.3, 4, 8), d.col, 0, 0.32, 0, Math.PI / 2, dog);
    add(new THREE.CapsuleGeometry(0.095, 0.24, 4, 8), d.mane, 0, 0.29, 0.02, Math.PI / 2, dog).scale.set(0.9, 1, 1.05);
    add(new THREE.SphereGeometry(0.1, 10, 8), d.col, 0, 0.43, 0.27, 0, dog);
    add(new THREE.BoxGeometry(0.08, 0.07, 0.12), d.mane, 0, 0.4, 0.38, 0, dog);
    add(new THREE.SphereGeometry(0.022, 6, 5), 0x1a1a1a, 0, 0.42, 0.44, 0, dog);
    for (const s of [-1, 1]) { add(new THREE.ConeGeometry(0.035, 0.09, 4), d.col, s * 0.05, 0.53, 0.25, 0, dog); add(new THREE.SphereGeometry(0.014, 6, 5), 0x3aa8ff, s * 0.045, 0.46, 0.35, 0, dog); }
    add(new THREE.ConeGeometry(0.04, 0.2, 6), d.mane, 0, 0.42, -0.24, -0.9, dog);
    add(new THREE.TorusGeometry(0.1, 0.015, 4, 10), 0xb82a2a, 0, 0.36, 0.18, 0, dog);
    for (const [x, z] of [[-0.06, 0.13], [0.06, 0.13], [-0.06, -0.13], [0.06, -0.13]]) {
      const lg = new THREE.Group(); lg.position.set(x, 0.25, z); dog.add(lg);
      add(new THREE.CapsuleGeometry(0.03, 0.16, 4, 6), d.col, 0, -0.12, 0, 0, lg);
      legs.push(lg);
    }
  }
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.01, 0.01, 0.75), 0x3a2414, s * 0.2, 0.32, 0.25);
  g.userData = { legs, body, h: 0.42 };
  return g;
}
function lizardModel(d) {
  const g = new THREE.Group();
  const M = (c) => new THREE.MeshLambertMaterial({ color: c });
  const body = new THREE.Group(); g.add(body);
  const add = (geo, c, x, y, z, rx = 0, parent = body) => { const m = new THREE.Mesh(geo, M(c)); m.position.set(x, y, z); m.rotation.x = rx; m.castShadow = true; parent.add(m); return m; };
  add(new THREE.CapsuleGeometry(0.22, 0.6, 4, 10), d.col, 0, 0.3, 0, Math.PI / 2);
  add(new THREE.CapsuleGeometry(0.13, 0.22, 4, 8), d.col, 0, 0.36, 0.55, Math.PI / 2 - 0.2);
  for (let i = 0; i < 6; i++) add(new THREE.ConeGeometry(0.05, 0.14, 4), d.mane, 0, 0.52, 0.3 - i * 0.14);
  add(new THREE.ConeGeometry(0.1, 0.7, 6), d.col, 0, 0.3, -0.75, -Math.PI / 2);
  for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.03, 6, 5), 0xffd040, s * 0.08, 0.42, 0.68);
  add(new THREE.BoxGeometry(0.4, 0.06, 0.4), 0x8a2a1a, 0, 0.53, -0.02);
  const legs = [];
  for (const [x, z] of [[-0.2, 0.3], [0.2, 0.3], [-0.2, -0.3], [0.2, -0.3]]) {
    const lg = new THREE.Group(); lg.position.set(x, 0.24, z); body.add(lg);
    add(new THREE.CapsuleGeometry(0.05, 0.16, 4, 6), d.col, x > 0 ? 0.08 : -0.08, -0.08, 0, 0, lg).rotation.z = x > 0 ? -0.9 : 0.9;
    legs.push(lg);
  }
  g.userData = { legs, body, h: 0.56 };
  return g;
}

// ---------------------------------------------------------------- isla espectral
export function makeGhostIslet() {
  const R = makeIslet({ id: 'espectral', name: 'Isla Espectral', ox: -72, oz: 150, N: 48, seed: 99, dockDir: [1, 0], biome: 'ghost' });
  R.ghost = true;
  R.hidden = true;
  const t0 = R.tile, w0 = R.walkable;
  R.tile = (x, z) => (R.hidden ? T.WATER : t0(x, z));
  R.walkable = (x, z) => !R.hidden && w0(x, z);
  const { x: cx, z: cz } = R.center;
  R.spawns.push({ type: 'skeleton', count: 5, area: [cx - 10, cz - 10, cx + 10, cz + 10], lvl: [60, 70], ghost: true });
  R.spawns.push({ type: 'skull', count: 4, area: [cx - 10, cz - 10, cx + 10, cz + 10], lvl: [62, 72], ghost: true });
  R.spawns.push({ type: 'ghost_captain', count: 1, area: [cx - 1, cz - 1, cx + 1, cz + 1], lvl: [85, 85], ghost: true });
  return R;
}

// ---------------------------------------------------------------- logros
export const LOGROS = [
  { id: 'cazador', name: 'Cazador', title: 'Cazador', desc: 'Vence a 100 enemigos', ok: (g) => (g.stats.kills || 0) >= 100 },
  { id: 'carnicero', name: 'Azote de monstruos', title: 'Azote', desc: 'Vence a 1000 enemigos', ok: (g) => (g.stats.kills || 0) >= 1000 },
  { id: 'leyendas', name: 'Cazador de leyendas', title: 'Cazador de leyendas', desc: 'Derrota a 5 piratas famosos', ok: (g) => (g.stats.famous || 0) >= 5 },
  { id: 'regata', name: 'Rey de la regata', title: 'Rey de la regata', desc: 'Termina una regata en 95 s o menos', ok: (g) => g.stats.raceBest && g.stats.raceBest <= 95 },
  { id: 'torneo', name: 'Campeón', title: 'Campeón del torneo', desc: 'Gana el torneo de Villarroca', ok: (g) => (g.stats.tourneys || 0) >= 1 },
  { id: 'cripta', name: 'Rompecriptas', title: 'Rompecriptas', desc: 'Supera la Cripta de la Bruma', ok: (g) => (g.stats.dungeons || 0) >= 1 },
  { id: 'boda', name: 'Felices para siempre', title: 'Recién casado', desc: 'Cásate', ok: (g) => !!g.spouseP || g.npcs.some((n) => g.soc(n.id).married) },
  { id: 'nivel50', name: 'Veterano', title: 'Veterano', desc: 'Llega al nivel 50', ok: (g) => g.player.level >= 50 },
  { id: 'nivel100', name: 'Leyenda viva', title: 'Leyenda viva', desc: 'Llega al nivel 100', ok: (g) => g.player.level >= 100 },
  { id: 'tesoros', name: 'Buscatesoros', title: 'Buscatesoros', desc: 'Desentierra 5 tesoros', ok: (g) => (g.stats.treasures || 0) >= 5 },
  { id: 'serafin', name: 'Matadioses', title: 'Matadioses', desc: 'Derrota a Azrael, el Serafín Caído', ok: (g) => (g.stats.k_serafin || 0) >= 1 },
  { id: 'dragon', name: 'Matadragones', title: 'Matadragones', desc: 'Derrota a Ignaros, el Dragón Rey', ok: (g) => (g.stats.k_dragon || 0) >= 1 },
  { id: 'leviatan', name: 'Terror de los mares', title: 'Terror de los mares', desc: 'Derrota al Leviatán Abisal', ok: (g) => (g.stats.k_leviathan || 0) >= 1 },
  { id: 'espectro', name: 'Cazafantasmas', title: 'Cazafantasmas', desc: 'Derrota al Capitán Espectro', ok: (g) => (g.stats.k_ghost_captain || 0) >= 1 },
  { id: 'hundidos', name: 'Lobo de mar', title: 'Lobo de mar', desc: 'Hunde 25 barcos', ok: (g) => (g.stats.s_marine || 0) + (g.stats.s_pirate || 0) >= 25 },
  { id: 'oficios', name: 'Maestro artesano', title: 'Maestro artesano', desc: 'Sube un oficio a nivel 30', ok: (g) => g.jobs && Object.values(g.jobs).some((j) => j.l >= 30) },
  { id: 'casa', name: 'Propietario', title: 'Propietario', desc: 'Compra una casa', ok: (g) => !!(g.flags.house || g.flags.house_playa || g.flags.house_mansion) },
  { id: 'mansion', name: 'Señor de la mansión', title: 'Señor de la mansión', desc: 'Compra la mansión', ok: (g) => !!g.flags.house_mansion },
  { id: 'tripulacion', name: 'Capitán completo', title: 'Capitán', desc: 'Ten 10 tripulantes', ok: (g) => g.crew().length >= 10 },
  { id: 'dragoncito', name: 'Domador', title: 'Domador de dragones', desc: 'Consigue la cría de dragón', ok: (g) => (g.ownPets || []).includes('dragon') },
  { id: 'jinete', name: 'Jinete', title: 'Jinete', desc: 'Consigue una montura', ok: (g) => (g.ownMounts || []).length > 0 },
  { id: 'clan', name: 'Hermandad', title: 'Hermano de clan', desc: 'Únete a un clan', ok: (g) => !!g.clan },
  { id: 'buscado', name: 'Se busca', title: 'El Temido', desc: 'Llega a 10.000 de recompensa (pirata)', ok: (g) => (g.bounty || 0) >= 10000 },
  { id: 'almirante', name: 'Almirante', title: 'Almirante', desc: 'Llega a Almirante (Marina)', ok: (g) => (g.honor || 0) >= 150000 },
  { id: 'bandera', name: 'Ladrón de banderas', title: 'Ladrón de banderas', desc: 'Gana una partida de Captura la bandera', ok: (g) => (g.stats.ctf || 0) >= 1 },
];

// ---------------------------------------------------------------- casas y muebles
export const HOUSES = {
  casa5: { name: 'Casa de la plaza', flag: 'house', price: 6000 },
  casaplaya: { name: 'Casa de la playa', flag: 'house_playa', price: 15000 },
  casa2: { name: 'Mansión de Villarroca', flag: 'house_mansion', price: 40000 },
};
export const PREMIUM_DECOR = [
  { t: 'sofa', name: 'Sofá de terciopelo', price: 250 }, { t: 'lamp', name: 'Farol de pie', price: 120 }, { t: 'aquarium', name: 'Acuario', price: 400 },
  { t: 'throne', name: 'Trono del capitán', price: 900 }, { t: 'statue', name: 'Estatua de sirena', price: 600 }, { t: 'piano', name: 'Piano', price: 1200 },
  { t: 'globe', name: 'Globo terráqueo', price: 300 }, { t: 'trophy', name: 'Vitrina de trofeos', price: 500 },
];
export const CREW_JOBS = {
  cocinero: { name: 'Cocinero', icon: '🍳', desc: 'Regeneras vida navegando y la comida cura +30%' },
  artillero: { name: 'Artillero', icon: '💣', desc: '+20% de daño de cañón y recarga más rápida' },
  medico: { name: 'Médico', icon: '🩺', desc: 'Regeneras vida fuera de combate' },
  navegante: { name: 'Navegante', icon: '🧭', desc: '+12% de velocidad del barco' },
  carpintero: { name: 'Carpintero', icon: '🔨', desc: 'El barco se repara solo en el mar' },
};

export function installMore2(Game, D) {
  const P = Game.prototype;
  const sfx = D.sfx;

  // ============================================================ monturas
  P.buyMount = function (id) {
    this.ownMounts = this.ownMounts || [];
    if (this.ownMounts.includes(id)) return this.toggleMount(id);
    this.buy({ gold: MOUNTS[id].price }, () => { this.ownMounts.push(id); this.toast(`${MOUNTS[id].icon} ¡${MOUNTS[id].name} es tuyo! Pulsa 🐴 para montar`, 'area'); this.toggleMount(id); });
  };
  P.toggleMount = function (id) {
    const p = this.player;
    if (this.mounted) {
      this.scene.remove(this.mountObj);
      this.mounted = null; this.mountObj = null;
      p.yOff = 0; p.st.ride = false;
      return;
    }
    id = id || this.mountSel || (this.ownMounts || [])[0];
    if (!id) return this.toast('No tienes montura. Lucía (granja), Zaid (Oasis de Sal) y Brasa (Isla Ceniza) las venden');
    if (this.sailing || this.W.isInterior(p.x) || p.st.swim) return this.toast('Aquí no puedes montar');
    if (this.carrying) this.toggleCarry(this.carrying);
    this.mountSel = id;
    this.mounted = id;
    this.mountObj = mountModel(id);
    this.scene.add(this.mountObj);
    p.st.ride = true;
    sfx('click');
  };
  P.mountSpeed = function () { const b = this.mounted ? MOUNTS[this.mounted].speed : 1; return this.mountSpeed5 ? this.mountSpeed5(b) : b; };
  P.updateMount = function (dt) {
    const p = this.player, m = this.mountObj;
    const btn = document.getElementById('btnMount');
    const has = (this.ownMounts || []).length > 0;
    if (btn && btn._h !== has) { btn._h = has; btn.classList.toggle('hidden', !has); }
    if (!m) return;
    if (this.sailing || this.boarding || p.st.swim || (this.W.isInterior(p.x) && !this.inDungeon())) { this.toggleMount(); return; }
    const u = m.userData;
    p.yOff = u.h - 0.18;
    m.position.set(p.x, p.vy || 0, p.z);
    m.rotation.y = p.face;
    const ph = (this.time * (p.st.moving ? 14 : 2));
    const run = p.speed > 7;
    u.legs.forEach((l, i) => {
      const off = run ? [0, 0.4, Math.PI, Math.PI + 0.4][i % 4] : (i % 3 === 0 ? 0 : Math.PI);
      const sw = p.st.moving ? Math.sin(ph + off) : 0;
      l.rotation.x = sw * (run ? 0.7 : 0.45);
      if (l.userData.knee) l.userData.knee.rotation.x = p.st.moving ? Math.max(0, -Math.cos(ph + off)) * (run ? 1.1 : 0.7) : 0;
    });
    u.body.position.y = p.st.moving ? Math.abs(Math.sin(ph)) * (run ? 0.08 : 0.04) : Math.sin(this.time * 1.5) * 0.008;
    if (u.neck) u.neck.rotation.x = p.st.moving ? Math.sin(ph * 2) * 0.06 : Math.sin(this.time * 0.7) * 0.05;
    if (u.tail) u.tail.rotation.x = p.st.moving ? 0.35 + Math.sin(ph) * 0.1 : Math.sin(this.time * 1.3) * 0.12;
  };

  // ============================================================ isla espectral
  P.updateGhost = function (dt) {
    const R = this.ghostIsle;
    if (!R) return;
    this.ghostT = (this.ghostT || 0) - dt;
    if (this.ghostT > 0) return;
    this.ghostT = 1;
    const p = this.player;
    const onIt = !R.hidden && R.contains(Math.round(p.x), Math.round(p.z)) && !this.sailing;
    const want = this.weather === 'fog' || (this.tod > 0 && this.tod < 4) || onIt || (this.sailing && !R.hidden && Math.hypot(this.boat.x - R.center.x, this.boat.z - R.center.z) < 35);
    if (want === !R.hidden) return;
    R.hidden = !want;
    for (const m of R.meshes || []) m.visible = want;
    if (this.ghostGroup) this.ghostGroup.visible = want;
    if (want) {
      for (const e of this.enemies) if (e.spawnDef && e.spawnDef.ghost && !e.dead) e.respawn();
      if (Math.hypot(p.x - R.center.x, p.z - R.center.z) < 90) this.toast('🌫️ Entre la bruma aparece una isla que no figura en ningún mapa...', 'area');
    }
  };
  P.buildGhostProps = function () {
    const R = this.ghostIsle;
    if (!R) return;
    const g = new THREE.Group();
    const stone = new THREE.MeshLambertMaterial({ color: 0x5a6a70, transparent: true, opacity: 0.85 });
    const glow = new THREE.MeshBasicMaterial({ color: 0x7af0e0 });
    const add = (geo, m, x, y, z, ry = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.y = ry; g.add(o); return o; };
    const { x: cx, z: cz } = R.center;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2, r = 6 + (i % 3);
      add(new THREE.BoxGeometry(0.6, 1 + (i % 4) * 0.4, 0.5), stone, cx + Math.cos(a) * r, 0.6, cz + Math.sin(a) * r, a);
      add(new THREE.SphereGeometry(0.12, 8, 6), glow, cx + Math.cos(a) * r, 1.7 + (i % 4) * 0.2, cz + Math.sin(a) * r);
    }
    // barco fantasma encallado
    const hull = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 5), new THREE.MeshLambertMaterial({ color: 0x3a4a50, transparent: true, opacity: 0.7 }));
    hull.position.set(cx + 9, 0.3, cz - 8); hull.rotation.set(0.15, 0.6, 0.25); g.add(hull);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4, 6), stone); mast.position.set(cx + 9, 2.3, cz - 8); mast.rotation.z = 0.3; g.add(mast);
    g.visible = false;
    this.scene.add(g);
    this.ghostGroup = g;
  };

  // ============================================================ clanes (multijugador) y cofre común
  P.foundClan = function () {
    if (!this.net.active) return this.toast('Los clanes se crean en una partida multijugador');
    const name = (prompt('Nombre de tu clan', this.player.name + ' y compañía') || '').trim().slice(0, 18);
    if (!name) return;
    this.clan = { name, leader: this.player.name, flag: this.flagCfg || { bg: 0, sym: 0, col: 0 } };
    this.toast(`🏴 Has fundado el clan «${name}»`, 'area');
    this.net.sendX({ k: 'toast', msg: `🏴 ${this.player.name} ha fundado el clan «${name}»` });
    sfx('quest');
  };
  P.inviteClan = function (r) {
    if (!this.clan) return this.toast('Primero funda un clan (panel 👥 Online)');
    this.net.sendX({ k: 'clanInv', to: r.id, clan: this.clan });
    this.toast(`🏴 Invitación al clan enviada a ${r.name}`);
  };
  P.leaveClan = function () { if (this.clan) { this.toast(`Has dejado el clan «${this.clan.name}»`); this.clan = null; } };
  P.clanFlag = function () { return this.clan ? this.clan.flag : null; };
  // el cofre del clan lo guarda el anfitrión; sin multijugador es tu baúl personal
  P.chestKey = function () { return this.net.active && this.clan ? 'clan:' + this.clan.name : 'yo'; };
  P.openChestPanel = function () {
    if (this.net.active && this.clan && !this.net.isHost) { this.net.toHost({ k: 'chestGet', key: this.chestKey() }); this.toast('📦 Abriendo el cofre del clan...'); return; }
    this.panels.openStash(this.stashOf(this.chestKey()));
  };
  P.stashOf = function (key) { this.stashes = this.stashes || {}; return this.stashes[key] || (this.stashes[key] = {}); };
  P.stashMove = function (id, n, dir) {
    const p = this.player, key = this.chestKey();
    if (dir === 'put' && (p.inv[id] || 0) < n) return;
    if (this.net.active && this.clan && !this.net.isHost) {
      if (dir === 'put') p.inv[id] -= n;
      this.net.toHost({ k: 'chestMove', key, id, n, dir });
      return;
    }
    const st = this.stashOf(key);
    if (dir === 'put') { p.inv[id] -= n; st[id] = (st[id] || 0) + n; }
    else if ((st[id] || 0) >= n) { st[id] -= n; this.give(id, n); }
    this.panels.openStash(st);
  };
  P.onNetHost = function (from, m) {
    if (m.k === 'chestGet') this.net.sendX({ k: 'chest', to: from, items: this.stashOf(m.key) }, from);
    else if (m.k === 'chestMove') {
      const st = this.stashOf(m.key);
      if (m.dir === 'put') st[m.id] = (st[m.id] || 0) + m.n;
      else if ((st[m.id] || 0) >= m.n) { st[m.id] -= m.n; this.net.sendX({ k: 'chestGive', to: from, id: m.id, n: m.n }, from); }
      this.net.sendX({ k: 'chest', to: from, items: st }, from);
    } else if (m.k === 'ctfgrab' || m.k === 'ctfdrop' || m.k === 'ctfscore') this.ctfHost(from, m);
    else if (m.k === 'mkGet') this.net.sendX({ k: 'mk', list: this.marketList() }, from);
    else if (m.k && m.k.startsWith('mk')) this.marketHost(from, m);
  };

  // ============================================================ música y sonidos de ambiente
  P.music = function () {
    if (this.mus) return this.mus;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    const ctx = new C();
    const master = ctx.createGain(); master.gain.value = 0.22; master.connect(ctx.destination);
    const nbuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // ruido de fondo (olas, lluvia, viento) con filtro
    const ns = ctx.createBufferSource(); ns.buffer = nbuf; ns.loop = true;
    const nf = ctx.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 500;
    const ng = ctx.createGain(); ng.gain.value = 0;
    ns.connect(nf).connect(ng).connect(master); ns.start();
    this.mus = { ctx, master, nbuf, nf, ng, next: 0, step: 0, zone: '' };
    return this.mus;
  };
  const ZONES = {
    pueblo: { bpm: 96, wave: 'triangle', scale: [0, 2, 4, 7, 9, 12, 14], root: 392, bass: true },
    taberna: { bpm: 132, wave: 'square', scale: [0, 2, 4, 5, 7, 9, 11, 12], root: 330, bass: true, vol: 0.5 },
    mar: { bpm: 72, wave: 'sine', scale: [0, 3, 5, 7, 10, 12], root: 294, waves: 0.5 },
    selva: { bpm: 110, wave: 'triangle', scale: [0, 2, 5, 7, 9, 12], root: 440, drum: true, birds: true },
    desierto: { bpm: 90, wave: 'sawtooth', scale: [0, 1, 4, 5, 7, 8, 11, 12], root: 330, vol: 0.4 },
    volcan: { bpm: 70, wave: 'sawtooth', scale: [0, 1, 3, 6, 7, 10], root: 147, drum: true, vol: 0.5, rumble: 0.35 },
    cripta: { bpm: 60, wave: 'sine', scale: [0, 1, 3, 6, 7, 8], root: 196, rumble: 0.2 },
    espectral: { bpm: 54, wave: 'sine', scale: [0, 3, 6, 9, 11], root: 247, rumble: 0.15 },
    combate: { bpm: 150, wave: 'square', scale: [0, 3, 5, 7, 10, 12], root: 220, drum: true, bass: true, vol: 0.55 },
    campo: { bpm: 84, wave: 'triangle', scale: [0, 2, 4, 7, 9, 12], root: 349, birds: true },
  };
  P.musicZone = function () {
    const p = this.player;
    if (this.sailing || (this.inCoralia && this.inCoralia())) return 'mar';
    if (this.inDungeon()) return 'cripta';
    const room = this.roomAt(p.x, p.z);
    if (room) return ['taberna', 'sirena'].includes(room.id) ? 'taberna' : 'pueblo';
    if (this.enemies.some((e) => !e.dead && e.state === 'chase' && e.dist(p) < 10 && (!e.hostile || e.hostile()))) return 'combate';
    const r = this.W.regionAt(p.x, p.z);
    if (r && r.id === 'espectral') return 'espectral';
    if (r && r.biome === 'jungle') return 'selva';
    if (r && r.biome === 'desert') return 'desierto';
    if (r && r.biome === 'volcano') return 'volcan';
    const a = this.W.areaName(p.tx, p.tz);
    if (['Villarroca', 'Puerto Salitre', 'Villa Grillete', 'Oasis de Sal', 'Aldea Liana', 'Fortaleza de la Marina'].includes(a)) return 'pueblo';
    return 'campo';
  };
  P.updateMusic = function (dt) {
    if (!this.started || this.settings.music === false || !D.audio.enabled) { if (this.mus) this.mus.ng.gain.value = 0; return; }
    const M = this.music();
    if (!M) return;
    if (M.ctx.state === 'suspended') M.ctx.resume();
    const zone = this.musicZone();
    if (zone !== M.zone) { M.zone = zone; M.step = 0; }
    const Z = ZONES[zone];
    const now = M.ctx.currentTime;
    // ambiente
    const wet = this.weather === 'rain' || this.weather === 'storm';
    const target = (Z.waves || 0) + (Z.rumble || 0) + (wet ? 0.35 : 0) + (this.nearWater && this.nearWater() ? 0.15 : 0);
    M.ng.gain.value += (target * 0.5 - M.ng.gain.value) * Math.min(1, dt * 2);
    M.nf.frequency.value = wet ? 2400 : Z.rumble ? 180 : 600 + Math.sin(now * 0.4) * 300;
    if (M.next < now) M.next = now + 0.05;
    const beat = 60 / Z.bpm / 2;
    while (M.next < now + 0.3) {
      const t = M.next, s = M.step++;
      const vol = (Z.vol || 0.6) * 0.18;
      // melodía generativa: se repite cada 16 pasos con variación
      const seed = (s * 7 + zone.length * 13) % 16;
      if ([0, 3, 4, 6, 8, 11, 12, 14].includes(seed) || Math.random() < 0.15) {
        const deg = Z.scale[(seed * 5 + Math.floor(s / 16) * 2) % Z.scale.length];
        this.note(M, Z.root * Math.pow(2, deg / 12), t, beat * (seed % 4 === 0 ? 1.8 : 0.9), Z.wave, vol);
      }
      if (Z.bass && s % 4 === 0) this.note(M, Z.root / 2 * Math.pow(2, Z.scale[(Math.floor(s / 8)) % 3 * 2] / 12), t, beat * 3, 'triangle', vol * 1.2);
      if (Z.drum && s % 2 === 0) this.drum(M, t, s % 8 === 0 ? 90 : 180, vol * (s % 8 === 0 ? 2 : 0.8));
      if (Z.birds && Math.random() < 0.03) this.note(M, 2200 + Math.random() * 1200, t, 0.08, 'sine', vol * 0.6, 600);
      M.next += beat;
    }
  };
  P.note = function (M, f, t, dur, wave, vol, slide = 0) {
    const o = M.ctx.createOscillator(), gn = M.ctx.createGain();
    o.type = wave; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(f + slide, t + dur);
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(vol, t + 0.02); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn).connect(M.master); o.start(t); o.stop(t + dur + 0.05);
  };
  P.drum = function (M, t, f, vol) {
    const o = M.ctx.createOscillator(), gn = M.ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(gn).connect(M.master); o.start(t); o.stop(t + 0.2);
  };

  // ============================================================ logros y títulos
  P.updateLogros = function () {
    this.logros = this.logros || {};
    for (const L of LOGROS) {
      if (this.logros[L.id]) continue;
      let ok = false;
      try { ok = L.ok(this); } catch (e) { ok = false; }
      if (ok) {
        this.logros[L.id] = true;
        this.toast(`🏆 ¡Logro: ${L.name}! Nuevo título: «${L.title}»`, 'area');
        sfx('level');
      }
    }
    this.applyTitle();
  };
  P.applyTitle = function () {
    const lb = this.player.label;
    let el = lb.el.querySelector('.ttl');
    const txt = [this.clan ? `[${this.clan.name}]` : '', this.title ? `«${this.title}»` : ''].filter(Boolean).join(' ');
    if (!el) { el = document.createElement('div'); el.className = 'ttl'; lb.el.insertBefore(el, lb.nm); }
    if (el.textContent !== txt) { el.textContent = txt; el.style.display = txt ? '' : 'none'; }
  };

  // ============================================================ casas
  P.houseFor = function (r) { return r && HOUSES[r.id]; };
  P.ownsHouse = function (id) { return !!this.flags[HOUSES[id].flag]; };
  P.buyHouseId = function (id) {
    const h = HOUSES[id];
    this.buy({ gold: h.price }, () => {
      this.flags[h.flag] = true;
      const r = this.rooms.find((k) => k.id === id);
      if (r && r.doorLabel) r.doorLabel.nm.textContent = `🏠 ${h.name} (tuya)`;
      this.toast(`🏠 ¡${h.name} es tuya! Dentro puedes dormir, decorar y usar el cofre`, 'area');
      sfx('quest');
    });
  };
  P.refreshHouseLabels = function () {
    for (const [id, h] of Object.entries(HOUSES)) { const r = this.rooms.find((k) => k.id === id); if (r && r.doorLabel) r.doorLabel.nm.textContent = this.flags[h.flag] ? `🏠 ${h.name} (tuya)` : `🏠 ${h.name}: se vende`; }
  };

  // ============================================================ puestos de la tripulación
  P.crewJob = function (job) { return this.crew().find((n) => this.soc(n.id).cjob === job) || null; };
  P.cycleCrewJob = function (id) {
    const s = this.soc(id), keys = [null, ...Object.keys(CREW_JOBS)];
    const taken = new Set(this.crew().map((n) => this.soc(n.id).cjob).filter(Boolean));
    let i = keys.indexOf(s.cjob || null);
    for (let k = 0; k < keys.length; k++) { i = (i + 1) % keys.length; if (!keys[i] || !taken.has(keys[i]) || keys[i] === s.cjob) break; }
    s.cjob = keys[i] || undefined;
    const n = this.npcById(id);
    this.toast(s.cjob ? `${CREW_JOBS[s.cjob].icon} ${n.name} es ahora ${CREW_JOBS[s.cjob].name.toLowerCase()}` : `${n.name} no tiene puesto`);
  };
  P.updateCrewJobs = function (dt) {
    const p = this.player, b = this.boat;
    if (p.dead) return;
    if (this.sailing && this.crewJob('carpintero') && b.hp < b.maxHp && !b.sinking) b.hp = Math.min(b.maxHp, b.hp + b.maxHp * 0.006 * dt);
    if (this.sailing && this.crewJob('cocinero')) p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.006 * dt);
    if (this.crewJob('medico') && this.time - (p.lastCombat || -99) > 5) p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.01 * dt);
  };

  // ============================================================ PvP naval y captura la bandera
  P.pvpShips = function () {
    if (!this.net.active || !this.net.room.pvp) return [];
    const out = [];
    for (const r of this.net.remotes.values()) {
      const s = r.tgt;
      if (!s || !s.sl || this.net.sameTeam(this.net.myId, r.id)) continue;
      out.push({ x: s.bx, z: s.bz, remote: r, sinking: false });
    }
    return out;
  };
  P.ctfStart = function () {
    if (!this.net.isHost) return;
    this.ctf = { t: 300, holder: null, scores: {}, ...this.ctfSpot() };
    this.net.sendX({ k: 'ctf', st: this.ctf });
    this.onCtf(this.ctf);
    this.toast('🏴 ¡Captura la bandera! Navega hasta la bandera y llévala a Puerto Salitre', 'area');
    this.net.sendX({ k: 'toast', msg: '🏴 ¡Captura la bandera! Navega hasta la bandera y llévala a Puerto Salitre' });
  };
  P.ctfSpot = function () {
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2, r = 40 + Math.random() * 50;
      const x = 50 + Math.cos(a) * r, z = 50 + Math.sin(a) * r;
      if (!this.shipBlocked(x, z, 0)) return { x, z };
    }
    return { x: 20, z: 120 };
  };
  P.ctfHost = function (from, m) {
    const C = this.ctf;
    if (!C) return;
    if (m.k === 'ctfgrab' && C.holder === null) C.holder = from;
    else if (m.k === 'ctfdrop' && C.holder === from) { C.holder = null; C.x = m.x; C.z = m.z; }
    else if (m.k === 'ctfscore' && C.holder === from) { C.scores[from] = (C.scores[from] || 0) + 1; C.holder = null; Object.assign(C, this.ctfSpot()); }
    else return;
    this.net.sendX({ k: 'ctf', st: C });
    this.onCtf(C);
  };
  P.onCtf = function (st) {
    this.ctfState = st;
    if (!this.ctfFlag) {
      const g = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6), new THREE.MeshLambertMaterial({ color: 0xffffff }));
      pole.position.y = 1.2; g.add(pole);
      const fl = new THREE.Mesh(new THREE.BoxGeometry(1, 0.6, 0.03), new THREE.MeshBasicMaterial({ color: 0xffd040 }));
      fl.position.set(0.5, 2.1, 0); g.add(fl);
      const buoy = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.4, 10), new THREE.MeshLambertMaterial({ color: 0xffd040 }));
      g.add(buoy);
      this.scene.add(g);
      this.ctfFlag = g;
    }
    this.ctfFlag.visible = !!st && st.t > 0;
  };
  P.updateCtf = function (dt) {
    const C = this.ctfState;
    if (!C || C.t <= 0) return;
    C.t -= dt;
    const me = this.net.myId, b = this.boat;
    const holderPos = C.holder === null ? { x: C.x, z: C.z } : C.holder === me ? { x: b.x, z: b.z } : (() => { const r = this.net.remotes.get(C.holder); return r && r.tgt && r.tgt.sl ? { x: r.tgt.bx, z: r.tgt.bz } : { x: C.x, z: C.z }; })();
    this.ctfFlag.position.set(holderPos.x, C.holder === null ? -0.1 : 5.5, holderPos.z);
    this.ctfFlag.rotation.y += dt;
    const el = document.getElementById('eventBanner');
    const mine = C.scores[me] || 0;
    if (el && !this.race) { el.classList.remove('hidden'); el.textContent = `🏴 Captura la bandera · ${Math.ceil(C.t)} s · tus puntos: ${mine}${C.holder === me ? ' · ¡LLEVAS LA BANDERA!' : ''}`; }
    this.ctfCd = (this.ctfCd || 0) - dt;
    if (this.sailing && this.ctfCd <= 0) {
      if (C.holder === null && Math.hypot(b.x - C.x, b.z - C.z) < 6) { this.ctfCd = 1; this.net.toHost({ k: 'ctfgrab' }); }
      const d = this.docks[0];
      if (C.holder === me && Math.hypot(b.x - d.shipX, b.z - d.shipZ) < 9) { this.ctfCd = 1; this.net.toHost({ k: 'ctfscore' }); this.toast('🏴 ¡Punto!'); sfx('quest'); }
    }
    if (C.t <= 0) {
      this.ctfFlag.visible = false;
      const best = Object.entries(C.scores).sort((a, b2) => b2[1] - a[1])[0];
      if (best && Number(best[0]) === me) { this.stats.ctf = (this.stats.ctf || 0) + 1; this.player.gold += 1000; this.give('ficha', 5); this.toast('🏆 ¡Has ganado Captura la bandera! +1000 oro', 'area'); }
      else this.toast('🏴 Fin de Captura la bandera');
      if (el) el.classList.add('hidden');
    }
  };
  P.onNetX2 = function (from, m) {
    const r = this.net.remotes.get(from);
    if (m.k === 'clanInv' && m.to === this.net.myId) {
      this.ui.openDialog('🏴 Clan', `${r ? r.name : '?'} te invita al clan «${m.clan.name}».`, [
        { label: '🏴 Unirme', action: () => { this.clan = m.clan; this.toast(`🏴 Ahora eres del clan «${m.clan.name}»`, 'area'); this.net.sendX({ k: 'toast', msg: `🏴 ${this.player.name} se une al clan «${m.clan.name}»` }); } },
        { label: 'No, gracias', action: null },
      ]);
    } else if (m.k === 'chest' && m.to === this.net.myId) this.panels.openStash(m.items);
    else if (m.k === 'chestGive' && m.to === this.net.myId) this.give(m.id, m.n);
    else if (m.k === 'ctf') this.onCtf(m.st);
    else if (m.k === 'shiphit' && m.to === this.net.myId) { if (this.sailing) this.damageBoat(m.dmg); }
    else if (m.k === 'shot') { this.navalInit(); this.shootBall(m.x, m.z, 0.75, m.tx, m.tz, 'fx', 0); }
    else return false;
    return true;
  };
}

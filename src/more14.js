// v5.1: los mares lejanos (niveles 350-500). Cuatro islas nuevas con su propio mundo: Pantano Maldito,
// Bosque de Hongos Gigantes, Cementerio de Barcos y Ciudadela del Vacío. 12 enemigos, 4 jefes, el Oráculo
// de la Bruma (viajes a todas las tierras lejanas) y forja filtrada por nivel.
import * as THREE from 'three';
import { makeIslet, populate } from './regions.js';
import { ZONES } from './more13.js';

const FAR = {
  pantano: { id: 'pantano', name: 'Pantano Maldito', ox: 3700, oz: 0, N: 66, seed: 501, biome: 'swamp', lvl: 350, giver: 'morgana', boss: 'reina_cienaga', bg: 0x2a3a22,
    enemies: ['sapo_gigante', 'bruja_pantano', 'hidra_pantano'], plan: 'micelio', gather: ['musgo_maldito', 8], reward2: ['espora_luz', 6], plane: { color: 0x3a5a2a, emissive: 0x0a1a00 }, bossReward: 'nucleo_estelar', bossGold: 60000,
    npc: { name: 'Bruja del Pantano Morgana', look: { shirt: 0x2a3a1a, dress: true, dressColor: 0x2a3a1a, robe: 0x3a2a4a, hat: 'hood', hatColor: 0x1a2a10, skin: 0x8aa87a, hair: 0x1a1a1a, longHair: true, female: true } },
    spawns: [['sapo_gigante', 6, [350, 380]], ['bruja_pantano', 5, [360, 390]], ['hidra_pantano', 4, [370, 395]]], bossLvl: 400 },
  hongos: { id: 'hongos', name: 'Bosque de Hongos Gigantes', ox: 3950, oz: 0, N: 66, seed: 533, biome: 'fungi', lvl: 380, giver: 'fungo', boss: 'micelio_rey', bg: 0x1a1028,
    enemies: ['hongo_andante', 'escarabajo_luz', 'druida_esporas'], plan: 'cienaga', gather: ['espora_luz', 8], reward2: ['madera_espectral', 6], plane: { color: 0x2a1a4a, emissive: 0x0a0418 }, bossReward: 'nucleo_estelar', bossGold: 80000,
    npc: { name: 'Ermitaño Fungo', look: { shirt: 0x6a4a8a, robe: 0x4a2a6a, hat: 'hood', hatColor: 0xb04ad8, skin: 0xd8b8e8, beard: 0x7af0ff, hair: 0x7af0ff } },
    spawns: [['hongo_andante', 6, [380, 410]], ['escarabajo_luz', 5, [390, 420]], ['druida_esporas', 4, [400, 425]]], bossLvl: 430 },
  cementerio: { id: 'cementerio', name: 'Cementerio de Barcos', ox: 4200, oz: 0, N: 66, seed: 567, biome: 'wreck', lvl: 410, giver: 'barbagris', boss: 'almirante_muerto', bg: 0x4a5a62,
    enemies: ['marinero_fantasma', 'cangrejo_coloso', 'kraken_joven'], plan: 'abisal', gather: ['madera_espectral', 8], reward2: ['fragmento_vacio', 6], plane: { color: 0x3a4a52, transparent: true, opacity: 0.95 }, bossReward: 'nucleo_estelar', bossGold: 100000,
    npc: { name: 'Viejo Barbagris', look: { shirt: 0x5a5a6a, pants: 0x2a2a2a, coat: true, hat: 'tricorn', capColor: 0x2a2a2a, hair: 0xd8d8d8, beard: 0xd8d8d8, skin: 0xd9a066, eyepatch: true } },
    spawns: [['marinero_fantasma', 6, [410, 445]], ['cangrejo_coloso', 4, [420, 455]], ['kraken_joven', 5, [425, 460]]], bossLvl: 470 },
  vacio: { id: 'vacio', name: 'Ciudadela del Vacío', ox: 4450, oz: 0, N: 66, seed: 601, biome: 'void', lvl: 450, giver: 'eterea', boss: 'nihil', bg: 0x07040c,
    enemies: ['centinela_vacio', 'devorador_estelar', 'caballero_vacio'], plan: 'vacio', gather: ['fragmento_vacio', 10], reward2: ['nucleo_estelar', 2], plane: { color: 0x0a0612, emissive: 0x1a0a2a }, bossReward: 'nucleo_estelar', bossGold: 200000,
    npc: { name: 'Etérea, la Última Guardiana', look: { shirt: 0x1a0a2a, robe: 0x1a0a2a, hat: 'circlet', hatColor: 0xb03aff, halo: 0xd88aff, skin: 0xe8d8f8, hair: 0xf0e8ff, longHair: true, female: true } },
    spawns: [['centinela_vacio', 5, [450, 485]], ['devorador_estelar', 5, [460, 490]], ['caballero_vacio', 5, [470, 495]]], bossLvl: 500 },
};
Object.assign(ZONES, FAR);

export function makeFarIslets() {
  return Object.values(FAR).map((D) => {
    const R = makeIslet({ ...D, dockDir: [-1, 0] });
    R.portal = true; R.zone = D.id;
    const { x: cx, z: cz } = R.center;
    R.towns.push({ name: D.name, x: cx, z: cz, r: 6 });
    R.reserve(cx, cz, 7);
    R.props.push({ type: 'forge', x: cx + 3, z: cz + 3, rot: 0 }); R.block(cx + 3, cz + 3);
    R.npcs.push({ id: D.giver, name: D.npc.name, x: cx, z: cz, wander: 1, look: D.npc.look });
    R.arrive = { x: cx - 2, z: cz + 1 };
    populate(R, 1);
    const { ox, oz, N } = R;
    const quads = [[ox + 8, oz + 8, cx - 8, cz - 8], [cx + 8, oz + 8, ox + N - 9, cz - 8], [ox + 8, cz + 8, cx - 8, oz + N - 9], [cx + 8, cz + 8, ox + N - 9, oz + N - 9]];
    D.spawns.forEach(([type, count, lvl], i) => R.spawns.push({ type, count, area: quads[i % 4], lvl }));
    R.spawns.push({ type: D.boss, count: 1, area: quads[3].map((v, i) => (i < 2 ? v + 6 : v - 6)), lvl: [D.bossLvl, D.bossLvl] });
    return R;
  });
}

export function installMore14(Game, D) {
  const P = Game.prototype;
  const sfx = D.sfx;

  // ============================================================ decorados únicos de cada isla
  P.buildFarFx = function () {
    if (this.farFx) return;
    this.farFx = true;
    for (const R of this.islets.filter((r) => FAR[r.zone])) {
      const g = new THREE.Group(), c = R.center, rnd = (a) => (Math.random() - 0.5) * a;
      if (R.zone === 'hongos') {
        for (let i = 0; i < 26; i++) {
          const x = Math.round(c.x + rnd(48)), z = Math.round(c.z + rnd(48));
          if (!R.walkable(x, z) || Math.hypot(x - c.x, z - c.z) < 6) continue;
          const h = 1.5 + Math.random() * 3, col = [0xb04ad8, 0x3ad8ff, 0xff6ab0, 0x7aff8a][i % 4];
          const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, h, 8), new THREE.MeshLambertMaterial({ color: 0xe8e0d0 })); stem.position.set(x, h / 2, z); g.add(stem);
          const cap = new THREE.Mesh(new THREE.SphereGeometry(0.8 + h * 0.25, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: col, emissive: col, emissiveIntensity: 0.35 })); cap.position.set(x, h, z); g.add(cap);
          R.setBlocked(x, z, 1);
        }
      } else if (R.zone === 'cementerio') {
        for (let i = 0; i < 9; i++) {
          const x = Math.round(c.x + rnd(46)), z = Math.round(c.z + rnd(46));
          if (!R.walkable(x, z) || Math.hypot(x - c.x, z - c.z) < 7) continue;
          const hull = new THREE.Group(), wood = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
          const b = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 4.5), wood); b.position.y = 0.4; hull.add(b);
          const m = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 4, 6), wood); m.position.set(0, 2, 0.4); m.rotation.z = 0.5; hull.add(m);
          const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.2), new THREE.MeshLambertMaterial({ color: 0xc8c0a8, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })); sail.position.set(0.5, 2.6, 0.4); sail.rotation.z = 0.5; hull.add(sail);
          hull.position.set(x, 0, z); hull.rotation.set(0, Math.random() * 6, (Math.random() - 0.5) * 0.6); g.add(hull);
          for (let dz = -2; dz <= 2; dz++) R.setBlocked(x, z + dz, 1);
        }
      } else if (R.zone === 'vacio') {
        const N = 400, geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) { pos[i * 3] = c.x + rnd(160); pos[i * 3 + 1] = -2 - Math.random() * 30; pos[i * 3 + 2] = c.z + rnd(160); }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const stars = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 3, sizeAttenuation: false })); stars.frustumCulled = false; g.add(stars);
        for (let i = 0; i < 18; i++) { const sh = new THREE.Mesh(new THREE.OctahedronGeometry(0.4 + Math.random() * 0.8), new THREE.MeshLambertMaterial({ color: 0x2a0a4a, emissive: 0x6a1aaa, emissiveIntensity: 0.4 })); sh.position.set(c.x + rnd(60), 3 + Math.random() * 5, c.z + rnd(60)); sh.userData.f = Math.random() * 6; g.add(sh); }
        this.voidShards = g;
      } else if (R.zone === 'pantano') {
        for (let i = 0; i < 30; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.12 + Math.random() * 0.15, 8, 6), new THREE.MeshLambertMaterial({ color: 0x9ad84a, emissive: 0x3a6a1a, transparent: true, opacity: 0.7 })); b.position.set(c.x + rnd(50), -0.2, c.z + rnd(50)); b.userData.f = Math.random() * 6; g.add(b); }
        this.swampBubbles = g;
      }
      this.scene.add(g);
    }
  };
  const baseTravel = P.travelZone;
  P.travelZone = function (key) { const r = baseTravel.call(this, key); this.buildZoneFx(); this.buildFarFx(); return r; };
  P.updateFar = function () {
    const t = this.time;
    if (this.voidShards) this.voidShards.children.forEach((k) => { if (k.userData.f !== undefined) { k.position.y += Math.sin(t + k.userData.f) * 0.005; k.rotation.y += 0.01; } });
    if (this.swampBubbles) this.swampBubbles.children.forEach((k) => { k.position.y = -0.2 + ((t * 0.3 + k.userData.f) % 1) * 0.5; });
  };

  // ============================================================ el Oráculo de la Bruma
  P.npcOracle = function () {
    if (this.npcById('oraculo')) return;
    const n = new D.NPC(this, { id: 'oraculo', name: 'Oráculo de la Bruma', x: 46, z: 54, wander: 0, look: { shirt: 0x2a2a4a, robe: 0x3a2a6a, hat: 'hood', hatColor: 0x1a1a3a, halo: 0x8ad8ff, skin: 0xc8b8a8, beard: 0xe8e8f0, hair: 0xe8e8f0, eyeGlow: 0x8ad8ff } });
    n.baseLevel = 500; n.setStats(500);
    this.placeNear(n, 46, 54);
    this.npcs.push(n);
  };
  P.oracleMenu = function (opts) {
    const p = this.player;
    for (const [k, z] of Object.entries(ZONES)) opts.push({ label: `${p.level >= z.lvl ? '🌀' : '🔒'} ${z.name} (Nv. ${z.lvl}+)`, action: () => this.travelZone(k) });
    return `Veo tierras más allá de la bruma... Te llevo a cualquiera de ellas si tienes el poder suficiente. Tu nivel: ${p.level}/500.`;
  };

  // ============================================================ enganches
  P.npcDialog14 = function (id, opts) {
    if (id === 'oraculo') return this.oracleMenu(opts);
    return null;
  };
  P.updateMore14 = function () { this.npcOracle(); this.updateFar(); };
  P.newsHtml14 = function () {
    const zq = this.zq || {};
    return `<div class="sub">🆕 v5.1 · los mares lejanos (nivel máximo 500)</div><ul class="qlist">
      ${Object.values(FAR).map((z) => `<li>🌀 <b>${z.name}</b> (Nv. ${z.lvl}+): misiones ${Math.min(3, zq[z.id] || 0)}/3.</li>`).join('')}
      <li>🔮 El <b>Oráculo de la Bruma</b> (plaza de Villarroca) te lleva a todas las tierras lejanas.</li>
      <li>⚔️ Cada conjunto tiene ahora 6 armas: su arma única + espada, mandoble, katana, hacha y lanza.</li></ul>`;
  };
}

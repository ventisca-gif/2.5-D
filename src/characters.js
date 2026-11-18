// Personajes de bloques (humanos, esqueletos, lobos, jabalíes, cangrejos) con animación simple.
import * as THREE from 'three';

const geoCache = new Map();
function bgeo(w, h, d) {
  const k = `${w},${h},${d}`;
  if (!geoCache.has(k)) geoCache.set(k, new THREE.BoxGeometry(w, h, d));
  return geoCache.get(k);
}

class Builder {
  constructor() {
    this.mats = [];
    this.cache = new Map();
  }
  m(color, emissive) {
    const k = color + ':' + (emissive || 0);
    if (this.cache.has(k)) return this.cache.get(k);
    const mm = new THREE.MeshLambertMaterial({ color, emissive: emissive || 0x000000 });
    mm.userData.baseEmissive = new THREE.Color(emissive || 0x000000);
    this.cache.set(k, mm);
    this.mats.push(mm);
    return mm;
  }
  box(parent, w, h, d, color, x, y, z, emissive) {
    const mesh = new THREE.Mesh(bgeo(w, h, d), this.m(color, emissive));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
}

function pivot(parent, x, y, z) {
  const p = new THREE.Group();
  p.position.set(x, y, z);
  parent.add(p);
  return p;
}

// look: { shirt, pants, skin, hair, hat, capColor, beard, dress, apron, coat, cape, armor, sword, spear, rod, longHair, eyepatch, bone, boss }
export function makeHumanoid(look = {}) {
  const B = new Builder();
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const skin = look.skin ?? 0xe8b98f;
  const shirt = look.shirt ?? 0x3a6aa0;
  const pants = look.pants ?? 0x4a3a2a;
  const boots = look.boots ?? 0x3a2a1e;
  const bone = look.bone;
  const limbW = bone ? 0.1 : 0.15;

  // piernas
  const legL = pivot(body, -0.1, 0.36, 0);
  const legR = pivot(body, 0.1, 0.36, 0);
  for (const leg of [legL, legR]) {
    B.box(leg, limbW, 0.26, limbW + 0.02, bone ? bone : pants, 0, -0.13, 0);
    B.box(leg, limbW + 0.02, 0.11, limbW + 0.06, bone ? 0x2a2a2a : boots, 0, -0.305, 0.02);
  }
  // torso
  const torso = pivot(body, 0, 0.36, 0);
  if (bone) {
    B.box(torso, 0.08, 0.36, 0.08, bone, 0, 0.18, 0);
    for (let i = 0; i < 3; i++) B.box(torso, 0.32, 0.05, 0.18, bone, 0, 0.12 + i * 0.09, 0);
    B.box(torso, 0.34, 0.06, 0.16, bone, 0, 0.02, 0);
  } else {
    B.box(torso, 0.4, 0.38, 0.24, shirt, 0, 0.19, 0);
    B.box(torso, 0.42, 0.05, 0.26, look.belt ?? 0x3a2414, 0, 0.03, 0);
    B.box(torso, 0.07, 0.06, 0.03, 0xd0a040, 0, 0.03, 0.13);
  }
  if (look.dress) B.box(torso, 0.44, 0.28, 0.3, look.dressColor ?? shirt, 0, -0.1, 0);
  if (look.coat) {
    B.box(torso, 0.44, 0.34, 0.28, shirt, 0, -0.08, 0).scale.set(1, 1, 1);
    B.box(torso, 0.06, 0.4, 0.02, 0xd0a040, 0.1, 0.12, 0.13);
    B.box(torso, 0.06, 0.4, 0.02, 0xd0a040, -0.1, 0.12, 0.13);
  }
  if (look.apron) B.box(torso, 0.3, 0.42, 0.02, look.apron, 0, 0.06, 0.13);
  if (look.armor) {
    B.box(torso, 0.42, 0.3, 0.26, look.armorColor ?? 0xa0a6b0, 0, 0.23, 0);
    B.box(torso, 0.16, 0.1, 0.28, look.armorColor ?? 0xb8bec8, -0.26, 0.38, 0);
    B.box(torso, 0.16, 0.1, 0.28, look.armorColor ?? 0xb8bec8, 0.26, 0.38, 0);
  }
  let cape = null;
  if (look.cape) {
    cape = pivot(torso, 0, 0.38, -0.13);
    B.box(cape, 0.4, 0.62, 0.03, look.cape, 0, -0.3, -0.01);
  }
  // brazos
  const armL = pivot(torso, -0.27, 0.36, 0);
  const armR = pivot(torso, 0.27, 0.36, 0);
  for (const arm of [armL, armR]) {
    B.box(arm, limbW - 0.02, 0.3, limbW, bone ? bone : look.sleeve ?? shirt, 0, -0.15, 0);
    B.box(arm, limbW - 0.03, 0.08, limbW - 0.01, bone ? bone : skin, 0, -0.33, 0);
  }
  // arma
  let weapon = null;
  if (look.sword) {
    weapon = pivot(armR, 0, -0.34, 0.02);
    const blade = look.blade ?? 0xdadfe6;
    B.box(weapon, 0.04, 0.12, 0.04, 0x4a2a14, 0, 0, 0);
    B.box(weapon, 0.18, 0.03, 0.05, look.guard ?? 0xc9a23a, 0, 0.0, 0.07);
    const bl = B.box(weapon, 0.05, 0.03, 0.5, blade, 0, 0.0, 0.33, look.bladeGlow);
    bl.scale.set(1, 1.2, 1);
  } else if (look.spear) {
    weapon = pivot(armR, 0, -0.34, 0.02);
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 5), B.m(0x6a4a2a));
    sh.position.set(0, 0.35, 0);
    weapon.add(sh);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 4), B.m(0xc8ccd4));
    tip.position.set(0, 1.15, 0);
    weapon.add(tip);
  } else if (look.rod) {
    weapon = pivot(armR, 0, -0.34, 0.02);
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 1.4, 4), B.m(0x7a5a3a));
    r.position.set(0, 0.25, 0.55);
    r.rotation.x = 1.0;
    weapon.add(r);
  }
  // cabeza
  const head = pivot(torso, 0, 0.42, 0);
  if (bone) {
    B.box(head, 0.3, 0.26, 0.28, bone, 0, 0.14, 0);
    B.box(head, 0.22, 0.08, 0.22, bone, 0, 0.0, 0.03);
    const eye = look.eyeGlow ?? 0x111111;
    B.box(head, 0.07, 0.07, 0.02, eye, -0.07, 0.15, 0.14, look.eyeGlow);
    B.box(head, 0.07, 0.07, 0.02, eye, 0.07, 0.15, 0.14, look.eyeGlow);
  } else {
    B.box(head, 0.32, 0.3, 0.3, skin, 0, 0.15, 0);
    B.box(head, 0.05, 0.06, 0.02, 0x1a1a1a, -0.07, 0.16, 0.155);
    B.box(head, 0.05, 0.06, 0.02, 0x1a1a1a, 0.07, 0.16, 0.155);
    B.box(head, 0.05, 0.05, 0.04, skin, 0, 0.1, 0.165).material = B.m(new THREE.Color(skin).multiplyScalar(0.9).getHex());
  }
  if (look.hair != null && !bone) {
    B.box(head, 0.34, 0.1, 0.32, look.hair, 0, 0.32, -0.005);
    B.box(head, 0.34, 0.22, 0.06, look.hair, 0, 0.2, -0.15);
    if (look.longHair) B.box(head, 0.34, 0.24, 0.07, look.hair, 0, -0.02, -0.15);
  }
  if (look.beard != null) {
    B.box(head, 0.3, 0.12, 0.06, look.beard, 0, 0.02, 0.15);
  }
  if (look.eyepatch) {
    B.box(head, 0.08, 0.08, 0.02, 0x111111, 0.07, 0.16, 0.165);
    B.box(head, 0.34, 0.025, 0.31, 0x111111, 0, 0.2, 0);
  }
  switch (look.hat) {
    case 'helmet':
      B.box(head, 0.36, 0.18, 0.34, look.hatColor ?? 0x9aa0aa, 0, 0.32, 0);
      B.box(head, 0.06, 0.1, 0.36, look.hatColor ?? 0x9aa0aa, 0, 0.44, 0);
      break;
    case 'horned':
      B.box(head, 0.36, 0.2, 0.34, look.hatColor ?? 0x3a2a4a, 0, 0.3, 0);
      B.box(head, 0.36, 0.06, 0.06, look.hatColor ?? 0x3a2a4a, 0, 0.18, 0.15);
      for (const s of [-1, 1]) {
        const hn = B.box(head, 0.06, 0.24, 0.06, 0xe8e0c8, s * 0.2, 0.46, 0);
        hn.rotation.z = -s * 0.5;
      }
      break;
    case 'tricorn':
      B.box(head, 0.5, 0.06, 0.42, look.hatColor ?? 0x1a1414, 0, 0.32, 0);
      B.box(head, 0.32, 0.14, 0.3, look.hatColor ?? 0x1a1414, 0, 0.4, 0);
      B.box(head, 0.5, 0.03, 0.03, 0xd0a040, 0, 0.36, 0.2);
      break;
    case 'cap':
      B.box(head, 0.34, 0.1, 0.33, look.capColor ?? 0x2e5a9a, 0, 0.34, 0);
      B.box(head, 0.26, 0.03, 0.12, look.capColor ?? 0x2e5a9a, 0, 0.3, 0.2);
      break;
    case 'bandana':
      B.box(head, 0.35, 0.12, 0.33, look.capColor ?? 0xb02a2a, 0, 0.3, 0);
      B.box(head, 0.1, 0.1, 0.12, look.capColor ?? 0xb02a2a, 0.1, 0.24, -0.2);
      break;
    case 'straw':
      B.box(head, 0.56, 0.03, 0.56, 0xe0c060, 0, 0.3, 0);
      B.box(head, 0.32, 0.12, 0.32, 0xe0c060, 0, 0.37, 0);
      break;
    case 'turban':
      B.box(head, 0.36, 0.16, 0.34, 0xf0ead8, 0, 0.34, 0);
      B.box(head, 0.06, 0.06, 0.02, 0x2a8a8a, 0, 0.34, 0.175);
      break;
    case 'circlet':
      B.box(head, 0.35, 0.05, 0.33, 0xe0b040, 0, 0.33, 0, 0x3a2a00);
      B.box(head, 0.06, 0.08, 0.02, 0xd03a5a, 0, 0.37, 0.17);
      break;
    case 'hood':
      B.box(head, 0.36, 0.34, 0.34, look.hatColor ?? 0x3a6a3a, 0, 0.19, -0.03);
      B.box(head, 0.28, 0.2, 0.02, skin, 0, 0.14, 0.15);
      B.box(head, 0.05, 0.06, 0.02, 0x1a1a1a, -0.07, 0.16, 0.165);
      B.box(head, 0.05, 0.06, 0.02, 0x1a1a1a, 0.07, 0.16, 0.165);
      break;
  }

  // sombra falsa (disco)
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.28, 12),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  root.add(shadow);

  const parts = { body, torso, head, legL, legR, armL, armR, weapon, cape };
  return { root, parts, mats: B.mats, kind: 'humanoid', height: 1.05 };
}

export function makeQuadruped(kind) {
  const B = new Builder();
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  let c, c2, h = 0.6;
  if (kind === 'wolf') { c = 0x8a8c90; c2 = 0xc8c8c8; }
  else { c = 0x6a4a32; c2 = 0x4a3222; }
  const big = kind === 'boar';
  const bw = big ? 0.42 : 0.32, bh = big ? 0.36 : 0.3, bl = big ? 0.66 : 0.66;
  const torso = pivot(body, 0, 0.42, 0);
  B.box(torso, bw, bh, bl, c, 0, 0, 0);
  if (!big) B.box(torso, bw - 0.04, 0.12, bl * 0.5, c2, 0, -0.12, 0.08);
  else B.box(torso, 0.1, 0.1, bl * 0.8, 0x2a1a10, 0, bh / 2 + 0.03, 0);
  const head = pivot(torso, 0, 0.08, bl / 2);
  B.box(head, 0.26, 0.24, 0.26, c, 0, 0, 0.08);
  B.box(head, 0.14, 0.12, 0.18, big ? 0x8a6a5a : c2, 0, -0.05, 0.27);
  B.box(head, 0.06, 0.05, 0.03, 0x1a1a1a, 0, -0.02, 0.37);
  B.box(head, 0.045, 0.045, 0.02, 0x111111, -0.07, 0.05, 0.215);
  B.box(head, 0.045, 0.045, 0.02, 0x111111, 0.07, 0.05, 0.215);
  if (big) {
    B.box(head, 0.03, 0.09, 0.03, 0xf0ead8, -0.08, -0.06, 0.34).rotation.x = -0.5;
    B.box(head, 0.03, 0.09, 0.03, 0xf0ead8, 0.08, -0.06, 0.34).rotation.x = -0.5;
    B.box(head, 0.06, 0.08, 0.04, c, -0.1, 0.15, 0.02);
    B.box(head, 0.06, 0.08, 0.04, c, 0.1, 0.15, 0.02);
  } else {
    B.box(head, 0.07, 0.12, 0.05, c, -0.08, 0.17, 0.03);
    B.box(head, 0.07, 0.12, 0.05, c, 0.08, 0.17, 0.03);
  }
  const legs = [];
  for (const [x, z] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const p = pivot(torso, x * (bw / 2 - 0.06), -bh / 2 + 0.02, z * (bl / 2 - 0.1));
    B.box(p, 0.09, 0.26, 0.09, c, 0, -0.13, 0);
    B.box(p, 0.1, 0.05, 0.11, 0x3a3a3a, 0, -0.25, 0.01);
    legs.push(p);
  }
  const tail = pivot(torso, 0, 0.08, -bl / 2);
  B.box(tail, 0.08, 0.08, big ? 0.12 : 0.3, c, 0, 0, -0.14).rotation.x = 0.5;
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.36, 12), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.22, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  root.add(shadow);
  return { root, parts: { body, torso, head, legs, tail }, mats: B.mats, kind: 'quad', height: h + 0.15 };
}

export function makeCrab() {
  const B = new Builder();
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const torso = pivot(body, 0, 0.16, 0);
  B.box(torso, 0.46, 0.14, 0.34, 0xd8452a, 0, 0, 0);
  B.box(torso, 0.36, 0.06, 0.26, 0xe8653a, 0, 0.09, 0);
  for (const s of [-1, 1]) {
    B.box(torso, 0.03, 0.12, 0.03, 0xd8452a, s * 0.08, 0.14, 0.12);
    B.box(torso, 0.05, 0.05, 0.05, 0x111111, s * 0.08, 0.21, 0.12);
  }
  const claws = [];
  for (const s of [-1, 1]) {
    const p = pivot(torso, s * 0.24, 0.02, 0.16);
    B.box(p, 0.08, 0.08, 0.16, 0xd8452a, 0, 0, 0.06);
    B.box(p, 0.16, 0.1, 0.14, 0xe8553a, s * 0.03, 0.02, 0.18);
    claws.push(p);
  }
  const legs = [];
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) {
    const p = pivot(torso, s * 0.22, -0.02, -0.1 + i * 0.1);
    B.box(p, 0.16, 0.03, 0.03, 0xc8402a, s * 0.08, -0.05, 0).rotation.z = s * 0.6;
    legs.push(p);
  }
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.3, 12), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.22, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  root.add(shadow);
  return { root, parts: { body, torso, claws, legs }, mats: B.mats, kind: 'crab', height: 0.4 };
}

export const OUTFITS = [
  {
    id: 'caballero', name: 'Caballero',
    look: { shirt: 0x2f5a9a, pants: 0x2a2a3a, hat: 'helmet', armor: true, cape: 0x2f5a9a, sword: true, skin: 0xe8b98f },
  },
  {
    id: 'corsario', name: 'Corsario',
    look: { shirt: 0x9a1f24, pants: 0x1e1a1a, hat: 'tricorn', coat: true, sword: true, hair: 0x2a1a10, beard: 0x2a1a10, skin: 0xd9a066, blade: 0xe8e8e8, guard: 0xd0a040 },
  },
  {
    id: 'exploradora', name: 'Exploradora',
    look: { shirt: 0x3a7a3a, pants: 0x5a4030, hat: 'hood', hatColor: 0x2e5e2e, sword: true, longHair: true, hair: 0xb06a2a, skin: 0xf0c49a, cape: 0x2e5e2e },
  },
  {
    id: 'mercenario', name: 'Mercenario',
    look: { shirt: 0x2a1e30, pants: 0x1a141e, hat: 'horned', hatColor: 0x3a2a4a, armor: true, armorColor: 0x5a4a6a, cape: 0x4a1a2a, sword: true, blade: 0xffd070, bladeGlow: 0x8a5a00, skin: 0xc68a5a },
  },
];

export const SKINS = [0xf3cfaa, 0xe8b98f, 0xc68a5a, 0x8a5a3a];

// Animación común: fase de paso, ataque, golpe recibido.
export function animateModel(model, st, dt) {
  const p = model.parts;
  const moving = st.moving;
  st.phase = (st.phase || 0) + dt * (moving ? 11 : 2);
  const s = Math.sin(st.phase);
  if (model.kind === 'humanoid') {
    const amp = moving ? 0.7 : 0;
    p.legL.rotation.x = s * amp;
    p.legR.rotation.x = -s * amp;
    p.armL.rotation.x = -s * amp * 0.8;
    let ar = s * amp * 0.8;
    if (st.attackT > 0) {
      const t = 1 - st.attackT / 0.32;
      ar = t < 0.4 ? -2.4 * (t / 0.4) : -2.4 + 3.2 * ((t - 0.4) / 0.6);
    } else if (st.gather > 0) {
      ar = -1.6 + Math.sin(st.gatherPhase || 0) * 1.0;
    } else if (st.sit) {
      ar = -0.6;
    }
    p.armR.rotation.x = ar;
    p.body.position.y = moving ? Math.abs(Math.cos(st.phase)) * 0.04 : Math.sin(st.phase) * 0.008;
    if (p.cape) p.cape.rotation.x = moving ? 0.35 + Math.abs(s) * 0.15 : 0.08;
    p.head.rotation.y = st.lookYaw || 0;
  } else if (model.kind === 'quad') {
    const amp = moving ? 0.8 : 0;
    p.legs[0].rotation.x = s * amp;
    p.legs[3].rotation.x = s * amp;
    p.legs[1].rotation.x = -s * amp;
    p.legs[2].rotation.x = -s * amp;
    p.tail.rotation.y = Math.sin(st.phase * 1.5) * 0.4;
    p.body.position.y = moving ? Math.abs(Math.cos(st.phase)) * 0.03 : 0;
    p.head.rotation.x = st.attackT > 0 ? -0.5 * Math.sin((1 - st.attackT / 0.32) * Math.PI) : 0;
    if (st.attackT > 0) p.torso.position.z = Math.sin((1 - st.attackT / 0.32) * Math.PI) * 0.18;
    else p.torso.position.z = 0;
  } else if (model.kind === 'crab') {
    const amp = moving ? 0.5 : 0.05;
    p.legs.forEach((l, i) => (l.rotation.y = Math.sin(st.phase * 1.4 + i) * amp));
    const pinch = st.attackT > 0 ? Math.sin((1 - st.attackT / 0.32) * Math.PI) * 0.7 : Math.sin(st.phase * 0.5) * 0.1;
    p.claws[0].rotation.y = pinch;
    p.claws[1].rotation.y = -pinch;
  }
  // destello al recibir daño
  if (st.flash > 0) {
    st.flash -= dt;
    const k = Math.max(0, st.flash / 0.18);
    for (const m of model.mats) m.emissive.copy(m.userData.baseEmissive).lerp(new THREE.Color(0xff3020), k);
    if (st.flash <= 0) for (const m of model.mats) m.emissive.copy(m.userData.baseEmissive);
  }
}

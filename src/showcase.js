// Escaparate de personajes v2 (para revisar el estilo antes de integrarlo en el juego).
import * as THREE from 'three';
import { makeHumanoid2, makeBeast2, makeCrab2, OUTFITS2, OUTLINE } from './chars2.js';
import { animateModel } from './characters.js';
import { buildLook, HAIR_M, HAIR_F } from './items.js';
import { HAIR_AF, HAIR_AM, FACES_F, FACES_M, HAIR_COLORS_A, EYE_COLORS } from './anime.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x24324a);
scene.add(new THREE.HemisphereLight(0xdfefff, 0x8a7a5a, 1.35));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(-4, 10, 3);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 });
sun.shadow.bias = -0.0005;
scene.add(sun);

// suelo de plaza en cuadrícula
const c = document.createElement('canvas');
c.width = c.height = 512;
const x = c.getContext('2d');
x.fillStyle = '#7a776f';
x.fillRect(0, 0, 512, 512);
for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
  const s = 150 + ((i * 7 + j * 13) % 5) * 9;
  x.fillStyle = `rgb(${s},${s - 2},${s - 8})`;
  x.fillRect(i * 64 + 1, j * 64 + 1, 62, 62);
}
const tex = new THREE.CanvasTexture(c);
tex.colorSpace = THREE.SRGBColorSpace;
tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
tex.repeat.set(3, 3);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.MeshLambertMaterial({ map: tex }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const HAIRMODE = new URLSearchParams(location.search).get('hair') === '1';
const ANIME = Number(new URLSearchParams(location.search).get('anime') || 0);
const ACL = [0x3a6aa0, 0x9a2a2a, 0x3a7a3a, 0x6a3d8f, 0x8a6a3a, 0x2a2a30];
const AW = { weapon: 'espada_madera', feet: 'botas_cuero' };
const animeGirl = (i, extra = {}) => ({ ...buildLook({ gender: 'f', hair: 0, hairColor: 0, skin: [0, 1, 2, 1, 0, 3][i % 6], clothes: i % 6 }, AW), anime: true, faceRes: 512, noAutoLegs: true,
  hairStyle: HAIR_AF[i % 6].id, hair: HAIR_COLORS_A[[1, 3, 7, 6, 4, 5][i % 6]], face: FACES_F[i % 4].id, eyeColor: [1, 2, 4, 0, 5, 7][i % 6], bust: [2, 1, 3, 2, 1, 2][i % 6], ...extra });
const animeBoy = (i, extra = {}) => ({ ...buildLook({ gender: 'm', hair: 0, hairColor: 0, skin: [1, 2, 0, 3, 1, 0][i % 6], clothes: (i + 2) % 6 }, AW), anime: true, faceRes: 512, noAutoLegs: true,
  hairStyle: HAIR_AM[i % 6].id, hair: HAIR_COLORS_A[[0, 2, 5, 1, 8, 9][i % 6]], face: FACES_M[i % 4].id, eyeColor: [0, 1, 3, 6, 2, 4][i % 6], ...extra });
const cast = ANIME === 1 ? HAIR_AF.map((h, i) => ({ name: `${h.name} · ${FACES_F[i % 4].name}`, model: makeHumanoid2(animeGirl(i)) }))
  : ANIME === 2 ? HAIR_AM.map((h, i) => ({ name: `${h.name} · ${FACES_M[i % 4].name}`, model: makeHumanoid2(animeBoy(i)) }))
  : ANIME === 3 ? [
    ...[0, 1, 2, 3].map((b) => ({ name: `Busto ${['plano', 'pequeño', 'medio', 'grande'][b]}`, model: makeHumanoid2(animeGirl(0, { bust: b, hairStyle: 'melena', hair: HAIR_COLORS_A[1], eyeColor: 0 })) })),
    ...[1, 2, 4, 5, 3, 7].map((e, k) => ({ name: `Ojos ${EYE_COLORS[e].name}`, model: makeHumanoid2(k % 2 ? animeBoy(k, { eyeColor: e, face: 'heroico' }) : animeGirl(k, { eyeColor: e, face: 'dulce' })) })),
  ]
  : HAIRMODE ? [
  ...HAIR_M.map((h, i) => ({ name: '♂ ' + h.name, model: makeHumanoid2({ ...buildLook({ gender: 'm', hair: i, hairColor: i % 6, skin: i % 4, clothes: i % 6, beard: i === 4 }, { weapon: 'espada_madera', feet: 'botas_cuero' }), noAutoLegs: true }) })),
  ...HAIR_F.map((h, i) => ({ name: '♀ ' + h.name, model: makeHumanoid2({ ...buildLook({ gender: 'f', hair: i, hairColor: (i + 2) % 6, skin: (i + 1) % 4, clothes: (i + 3) % 6 }, { weapon: 'espada_madera', feet: 'botas_cuero' }), noAutoLegs: true }) })),
] : [
  ...OUTFITS2.map((o) => ({ name: o.name, model: makeHumanoid2(o.look) })),
  { name: 'Capitana Nerea', model: makeHumanoid2({ shirt: 0x9a1f24, pants: 0x1e1a1a, hair: 0x1a1210, hat: 'tricorn', feather: 0xd83a3a, skin: 0xc68a5a, coat: true, cravat: true, sash: 0x1a1a1a, baldric: 0x3a2414, bootCuff: true, earring: true, longHair: true, sleeve: 0xf0ead8, sword: true }) },
  { name: 'Guardia', model: makeHumanoid2({ shirt: 0x3a5a8a, pants: 0x2a2a3a, hat: 'helmet', skin: 0xe0aa80, armor: true, tabard: 0x3a5a8a, spear: true }) },
  { name: 'Alcaldesa Marisol', model: makeHumanoid2({ shirt: 0x6a3d8f, pants: 0x3b2a4a, hair: 0xb8b8b8, hat: 'circlet', skin: 0xe8b98f, dress: true, longHair: true }) },
  { name: 'Herrero Tadeo', model: makeHumanoid2({ shirt: 0x7a3a2a, pants: 0x2e2a28, beard: 0x2a1a10, skin: 0xb8784a, apron: 0x2a2a2a, gloves: 0x3a2a1a }) },
  { name: 'Granjera Lucía', model: makeHumanoid2({ shirt: 0x6a9a3a, pants: 0x5a4a3a, hair: 0xd8a040, hat: 'straw', skin: 0xf0c49a, dress: true, dressColor: 0x8a6a3a }) },
  { name: 'Pirata esqueleto', model: makeHumanoid2({ bone: 0xe8e2cc, hat: 'bandana', capColor: 0xb02a2a, sword: true, blade: 0x9a8a7a }) },
  { name: 'Lobo', model: makeBeast2('wolf') },
  { name: 'Jabalí', model: makeBeast2('boar') },
  { name: 'Cangrejo', model: makeCrab2() },
];
const labels = [];
cast.forEach((ch, i) => {
  const perRow = ANIME === 3 ? 4 : 6;
  const row = i < perRow ? 0 : 1;
  const col = row === 0 ? i : i - perRow;
  const px = -3.2 + col * 1.3 + (row ? 0.65 : 0);
  const pz = row ? 1.5 : 0;
  // colocamos sobre una diagonal de pantalla
  const wx = px * 0.7071 + pz * 0.7071, wz = -px * 0.7071 + pz * 0.7071;
  ch.model.root.position.set(wx, 0, wz);
  ch.model.root.rotation.y = Math.PI / 4;
  ch.model.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  ch.st = { phase: i };
  scene.add(ch.model.root);
  const el = document.createElement('div');
  el.className = 'lbl';
  el.textContent = ch.name;
  document.body.appendChild(el);
  labels.push(el);
});

const params0 = new URLSearchParams(location.search);
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
let view = Number(new URLSearchParams(location.search).get('zoom') || 5.2);
function resize() {
  renderer.setSize(innerWidth, innerHeight);
  const a = innerWidth / innerHeight;
  const vh = a >= 1 ? view : view / a;
  Object.assign(camera, { left: (-vh * a) / 2, right: (vh * a) / 2, top: vh / 2, bottom: -vh / 2 });
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();
const FRONT = params0.get('front') === '1';
const PORTRAIT = params0.get('portrait') === '1';
camera.position.set(0.5, 0, 0.75).add((FRONT ? new THREE.Vector3(1, 0.42, 1) : new THREE.Vector3(1, 1.25, 1)).normalize().multiplyScalar(30));
camera.lookAt(0.5, FRONT ? 0.8 : 0.55, 0.75);
OUTLINE.uniforms.thick.value = PORTRAIT ? 0.0045 : ((camera.top - camera.bottom) / innerHeight) * 1.6;
if (params0.get('nooutline') === '1') OUTLINE.visible = false;

const params = new URLSearchParams(location.search);
// cámara de retrato (fotos de cara)
const pcam = new THREE.PerspectiveCamera(22, innerWidth / innerHeight, 0.1, 50);
if (PORTRAIT) {
  const n = cast.length;
  cast.forEach((ch, i) => { ch.model.root.position.set((i - (n - 1) / 2) * 0.78, 0, 0); ch.model.root.rotation.y = 0.18 * ((i % 2) ? -1 : 1); });
  const CLOSE = params0.get('close') === '1';
  pcam.position.set(0, CLOSE ? 1.08 : 1.25, CLOSE ? 2.2 + n * 0.42 : 4.2 + n * 0.55);
  pcam.lookAt(0, CLOSE ? 0.96 : 0.82, 0);
  sun.position.set(-2, 6, 8);
}
const walk = params.get('walk') === '1';
let last = performance.now();
const v = new THREE.Vector3();
function loop(t) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (t - last) / 1000);
  last = t;
  cast.forEach((ch, i) => {
    ch.st.moving = walk && i % 2 === 1;
    if (params.get('attack') === '1' && i % 3 === 0) {
      if (!(ch.st.attackT > 0)) ch.st.attackT = 0.32;
      ch.st.attackT -= dt;
    }
    animateModel(ch.model, ch.st, dt);
    v.set(ch.model.root.position.x, ch.model.height + 0.12, ch.model.root.position.z).project(PORTRAIT ? pcam : camera);
    labels[i].style.transform = `translate(${(v.x * 0.5 + 0.5) * innerWidth}px, ${(-v.y * 0.5 + 0.5) * innerHeight}px) translate(-50%, -100%)`;
  });
  renderer.render(scene, PORTRAIT ? pcam : camera);
}
requestAnimationFrame(loop);
window.ready = true;

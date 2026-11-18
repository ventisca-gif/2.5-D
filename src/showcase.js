// Escaparate de personajes v2 (para revisar el estilo antes de integrarlo en el juego).
import * as THREE from 'three';
import { makeHumanoid2, makeBeast2, OUTFITS2 } from './chars2.js';
import { animateModel } from './characters.js';

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

const cast = [
  ...OUTFITS2.map((o) => ({ name: o.name, model: makeHumanoid2(o.look) })),
  { name: 'Capitana Nerea', model: makeHumanoid2({ shirt: 0x9a1f24, pants: 0x1e1a1a, hair: 0x1a1210, hat: 'tricorn', feather: 0xd83a3a, skin: 0xc68a5a, coat: true, longHair: true, sleeve: 0xf0ead8, sword: true }) },
  { name: 'Guardia', model: makeHumanoid2({ shirt: 0x3a5a8a, pants: 0x2a2a3a, hat: 'helmet', skin: 0xe0aa80, armor: true, spear: true }) },
  { name: 'Alcaldesa Marisol', model: makeHumanoid2({ shirt: 0x6a3d8f, pants: 0x3b2a4a, hair: 0xb8b8b8, hat: 'circlet', skin: 0xe8b98f, dress: true, longHair: true }) },
  { name: 'Herrero Tadeo', model: makeHumanoid2({ shirt: 0x7a3a2a, pants: 0x2e2a28, beard: 0x2a1a10, skin: 0xb8784a, apron: 0x2a2a2a, gloves: 0x3a2a1a }) },
  { name: 'Granjera Lucía', model: makeHumanoid2({ shirt: 0x6a9a3a, pants: 0x5a4a3a, hair: 0xd8a040, hat: 'straw', skin: 0xf0c49a, dress: true, dressColor: 0x8a6a3a }) },
  { name: 'Pirata esqueleto', model: makeHumanoid2({ bone: 0xe8e2cc, hat: 'bandana', capColor: 0xb02a2a, sword: true, blade: 0x9a8a7a }) },
  { name: 'Lobo', model: makeBeast2('wolf') },
  { name: 'Jabalí', model: makeBeast2('boar') },
];
const labels = [];
cast.forEach((ch, i) => {
  const row = i < 6 ? 0 : 1;
  const col = row === 0 ? i : i - 6;
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
camera.position.set(0.5, 0, 0.75).add(new THREE.Vector3(1, 1.25, 1).normalize().multiplyScalar(30));
camera.lookAt(0.5, 0.55, 0.75);

const params = new URLSearchParams(location.search);
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
    v.set(ch.model.root.position.x, ch.model.height + 0.1, ch.model.root.position.z).project(camera);
    labels[i].style.transform = `translate(${(v.x * 0.5 + 0.5) * innerWidth}px, ${(-v.y * 0.5 + 0.5) * innerHeight}px) translate(-50%, -100%)`;
  });
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);
window.ready = true;

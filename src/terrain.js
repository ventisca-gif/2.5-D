// Malla del terreno (textura pintada por casilla) y agua animada con espuma en la orilla.
import * as THREE from 'three';
import { N, T } from './world.js';

export function buildTerrain(W, groundTex) {
  const pos = [], uv = [], nrm = [];
  const sidePos = [], sideNrm = [];
  const isSolid = (x, z) => {
    const t = W.tile(x, z);
    return t !== T.WATER && t !== T.DOCK;
  };
  const RN = W.N, ox = W.ox || 0, oz = W.oz || 0;
  for (let lz = 0; lz < RN; lz++) {
    for (let lx = 0; lx < RN; lx++) {
      const x = ox + lx, z = oz + lz;
      if (!isSolid(x, z)) continue;
      const x0 = x - 0.5, x1 = x + 0.5, z0 = z - 0.5, z1 = z + 0.5;
      const u0 = lx / RN, u1 = (lx + 1) / RN, v0 = 1 - lz / RN, v1 = 1 - (lz + 1) / RN;
      pos.push(x0, 0, z0, x0, 0, z1, x1, 0, z1, x0, 0, z0, x1, 0, z1, x1, 0, z0);
      uv.push(u0, v0, u0, v1, u1, v1, u0, v0, u1, v1, u1, v0);
      for (let k = 0; k < 6; k++) nrm.push(0, 1, 0);
      const D = -0.55;
      const side = (ax, az, bx, bz, nx, nz) => {
        sidePos.push(ax, 0, az, ax, D, az, bx, D, bz, ax, 0, az, bx, D, bz, bx, 0, bz);
        for (let k = 0; k < 6; k++) sideNrm.push(nx, 0, nz);
      };
      if (!isSolid(x, z + 1)) side(x0, z1, x1, z1, 0, 1);
      if (!isSolid(x, z - 1)) side(x1, z0, x0, z0, 0, -1);
      if (!isSolid(x + 1, z)) side(x1, z1, x1, z0, 1, 0);
      if (!isSolid(x - 1, z)) side(x0, z0, x0, z1, -1, 0);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  const ground = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: groundTex }));
  ground.receiveShadow = true;

  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sidePos, 3));
  sg.setAttribute('normal', new THREE.Float32BufferAttribute(sideNrm, 3));
  const sides = new THREE.Mesh(sg, new THREE.MeshLambertMaterial({ color: 0xa88a5a }));
  return { ground, sides };
}

export const SEA = { x0: -30, z0: -30, size: 200 };
export function buildWater(W) {
  // distancia (en casillas) a la tierra más cercana, para agua somera y espuma (todo el mar navegable)
  const MAXD = 8;
  const S = SEA.size;
  const tileAt = W.tileAll || W.tile;
  const dist = new Float32Array(S * S).fill(MAXD);
  const q = [];
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const t = tileAt(SEA.x0 + i, SEA.z0 + j);
    if (t !== T.WATER && t !== T.DOCK) {
      dist[j * S + i] = 0;
      q.push(j * S + i);
    }
  }
  let head = 0;
  while (head < q.length) {
    const k = q[head++];
    const x = k % S, z = (k / S) | 0;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz;
      if (nx < 0 || nz < 0 || nx >= S || nz >= S) continue;
      const nk = nz * S + nx;
      if (dist[nk] > dist[k] + 1) {
        dist[nk] = dist[k] + 1;
        q.push(nk);
      }
    }
  }
  const data = new Uint8Array(S * S * 4);
  for (let i = 0; i < S * S; i++) {
    const v = Math.min(255, Math.round((dist[i] / MAXD) * 255));
    data[i * 4] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, S, S, THREE.RGBAFormat);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      distTex: { value: tex },
      time: { value: 0 },
      light: { value: new THREE.Color(1, 1, 1) },
      deep: { value: new THREE.Color(0x2a78b4) },
      shallow: { value: new THREE.Color(0x56c2d6) },
      foam: { value: new THREE.Color(0xeaf8fa) },
    },
    vertexShader: `
      varying vec2 vW;
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vW = wp.xz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      uniform sampler2D distTex; uniform float time; uniform vec3 light, deep, shallow, foam;
      varying vec2 vW;
      void main(){
        vec2 uv = (vW - vec2(${SEA.x0}.0, ${SEA.z0}.0) + 0.5) / ${S}.0;
        float d = 1.0;
        if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) d = texture2D(distTex, uv).r;
        vec3 col = mix(shallow, deep, smoothstep(0.0, 0.55, d));
        float w = sin(vW.x * 1.7 + time * 1.3) * sin(vW.y * 1.3 - time * 1.1);
        col += 0.035 * w;
        float s = smoothstep(0.93, 1.0, sin(vW.x * 0.9 + vW.y * 0.6 + time * 0.8 + sin(vW.y * 1.7 + time) * 1.5));
        col += s * 0.09;
        float f = smoothstep(0.17, 0.04, d) * (0.55 + 0.45 * sin(time * 2.2 + d * 70.0));
        col = mix(col, foam, f * 0.75);
        gl_FragColor = vec4(col * light, 1.0);
      }`,
  });
  // sRGB directo: los colores del shader se escriben tal cual
  mat.uniforms.deep.value.convertLinearToSRGB();
  mat.uniforms.shallow.value.convertLinearToSRGB();
  mat.uniforms.foam.value.convertLinearToSRGB();
  const water = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), mat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(70, -0.12, 70);
  water.scale.set(1.3, 1.3, 1);
  return water;
}

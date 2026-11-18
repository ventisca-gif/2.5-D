// Construcción visual de los interiores (salas con dos paredes al fondo, como en vista isométrica).
import * as THREE from 'three';
import { box, cyl, mat, makeProp } from './props.js';

function furniture(type, fw, fd, M, room, dyn) {
  const g = new THREE.Group();
  const wood = mat(room.wood);
  const woodL = mat(new THREE.Color(room.wood).multiplyScalar(1.5).getHex());
  switch (type) {
    case 'bookshelf': {
      box(g, 0.92, 1.8, 0.38, wood, 0, 0.9, 0);
      const cols = [0xa83a2a, 0x2a5a9a, 0x3a8a4a, 0xd8a838, 0x6a3a8a, 0xe8e0d0];
      for (let s = 0; s < 4; s++) {
        box(g, 0.86, 0.04, 0.34, woodL, 0, 0.25 + s * 0.42, 0.02);
        let x = -0.38;
        let k = s * 3;
        while (x < 0.36) {
          const w = 0.05 + ((k * 7) % 4) * 0.015;
          const h = 0.24 + ((k * 5) % 3) * 0.04;
          box(g, w, h, 0.24, mat(cols[k % cols.length]), x + w / 2, 0.27 + s * 0.42 + h / 2, 0.04);
          x += w + 0.01;
          k++;
        }
      }
      g.position.z = -0.28;
      break;
    }
    case 'shelf': {
      const w = fw * 0.95;
      for (const y of [1.15, 1.6]) {
        box(g, w, 0.05, 0.28, woodL, 0, y, 0);
        const cols = [0x3a7a3a, 0x6a3a1a, 0xc8c0a0, 0x2a4a6a];
        for (let i = 0; i < Math.floor(w / 0.18); i++) {
          const b = cyl(g, 0.045, 0.05, 0.22, mat(cols[(i + Math.round(y * 10)) % 4]), -w / 2 + 0.12 + i * 0.18, y + 0.14, 0, 8);
          cyl(g, 0.018, 0.018, 0.06, mat(0x5a3a1a), b.position.x, y + 0.28, 0, 6);
        }
      }
      g.position.z = -0.36;
      break;
    }
    case 'banner':
      cyl(g, 0.025, 0.025, 0.8, M.gold, 0, 2.0, 0, 6).rotation.z = Math.PI / 2;
      box(g, 0.62, 1.2, 0.03, mat(0x9a2a2a), 0, 1.38, 0);
      box(g, 0.62, 0.06, 0.035, M.gold, 0, 0.8, 0);
      cyl(g, 0.14, 0.14, 0.04, M.gold, 0, 1.5, 0.01, 12).rotation.x = Math.PI / 2;
      g.position.z = -0.44;
      break;
    case 'window':
      box(g, 0.78, 0.78, 0.06, wood, 0, 1.35, 0);
      box(g, 0.64, 0.64, 0.07, mat(0xbfe2f2, { emissive: 0x6a8aa0 }), 0, 1.35, 0.005);
      box(g, 0.05, 0.64, 0.09, wood, 0, 1.35, 0.01);
      box(g, 0.64, 0.05, 0.09, wood, 0, 1.35, 0.01);
      box(g, 0.86, 0.06, 0.16, woodL, 0, 0.93, 0.04);
      g.position.z = -0.47;
      break;
    case 'poster': {
      // tablón con carteles de Se busca
      box(g, 0.95, 0.7, 0.05, wood, 0, 1.35, 0);
      for (const [x, y, r] of [[-0.24, 1.38, 0.05], [0.22, 1.36, -0.06]]) {
        const pp = box(g, 0.36, 0.48, 0.02, mat(0xe8d8a8), x, y, 0.035);
        pp.rotation.z = r;
        box(g, 0.2, 0.18, 0.025, mat(0x8a6a4a), x, y + 0.04, 0.04).rotation.z = r;
      }
      g.position.z = -0.46;
      break;
    }
    case 'painting': {
      box(g, 0.8, 0.6, 0.05, M.gold, 0, 1.4, 0);
      box(g, 0.68, 0.48, 0.06, mat(0x8ac0e0), 0, 1.4, 0.005);
      box(g, 0.68, 0.18, 0.065, mat(0x5a9a4a), 0, 1.25, 0.006);
      box(g, 0.2, 0.2, 0.07, mat(0xb8452e), 0.1, 1.36, 0.007);
      g.position.z = -0.46;
      break;
    }
    case 'weaponrack':
      box(g, fw * 0.9, 0.08, 0.12, wood, 0, 0.9, 0);
      box(g, fw * 0.9, 0.08, 0.12, wood, 0, 1.6, 0);
      for (let i = 0; i < 3; i++) {
        const x = -0.55 + i * 0.4;
        box(g, 0.05, 0.9, 0.02, mat(0xdde2ea), x, 1.25, 0.08);
        box(g, 0.18, 0.04, 0.05, M.gold, x, 0.85, 0.08);
      }
      cyl(g, 0.28, 0.28, 0.05, mat(0x2f5a9a), 0.65, 1.25, 0.06, 14).rotation.x = Math.PI / 2;
      cyl(g, 0.1, 0.1, 0.07, M.gold, 0.65, 1.25, 0.08, 10).rotation.x = Math.PI / 2;
      g.position.z = -0.42;
      break;
    case 'wheel': {
      const t = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.04, 6, 16), wood);
      t.position.set(0, 1.35, 0);
      g.add(t);
      for (let i = 0; i < 4; i++) box(g, 0.04, 0.9, 0.04, wood, 0, 1.35, 0).rotation.z = (i / 4) * Math.PI;
      g.position.z = -0.44;
      break;
    }
    case 'map':
      box(g, 0.85, 0.6, 0.02, mat(0xe8d8b0), 0, 1.35, 0);
      box(g, 0.3, 0.2, 0.025, mat(0x6aa848), -0.12, 1.36, 0.002);
      box(g, 0.14, 0.03, 0.03, mat(0xc82a2a), 0.2, 1.3, 0.003).rotation.z = 0.8;
      box(g, 0.14, 0.03, 0.03, mat(0xc82a2a), 0.2, 1.3, 0.003).rotation.z = -0.8;
      g.position.z = -0.47;
      break;
    case 'fireplace': {
      box(g, 1.1, 1.25, 0.5, M.stone, 0, 0.625, 0, 1.4);
      box(g, 0.6, 0.55, 0.1, mat(0x1a1210), 0, 0.33, 0.21);
      box(g, 1.25, 0.1, 0.6, woodL, 0, 1.3, 0.03);
      box(g, 0.5, 1.0, 0.4, M.stone, 0, 1.85, -0.05, 1.4);
      const f = new THREE.Group();
      const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.38, 5), M.fire);
      c1.position.y = 0.22;
      const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.26, 5), M.fire2);
      c2.position.y = 0.18;
      f.add(c1, c2);
      f.position.set(0, 0.05, 0.12);
      f.userData.dynamic = 'flame';
      dyn.push({ obj: f, local: true });
      g.position.z = -0.25;
      break;
    }
    case 'desk':
      box(g, 1.7, 0.07, 0.75, woodL, 0, 0.72, 0);
      box(g, 1.6, 0.6, 0.65, wood, 0, 0.4, 0);
      box(g, 0.32, 0.02, 0.24, mat(0xf2ead6), -0.3, 0.77, 0.05).rotation.y = 0.2;
      box(g, 0.2, 0.02, 0.28, mat(0xe8dcc0), 0.1, 0.77, -0.05);
      cyl(g, 0.04, 0.05, 0.12, mat(0xf0e8c8, { emissive: 0x5a4a20 }), 0.6, 0.82, -0.1, 8);
      cyl(g, 0.01, 0.01, 0.12, mat(0x2a2a2a), 0.35, 0.82, 0.1, 4).rotation.z = 0.4;
      break;
    case 'chair':
      box(g, 0.42, 0.06, 0.42, woodL, 0, 0.45, 0);
      box(g, 0.42, 0.55, 0.06, wood, 0, 0.75, -0.18);
      for (const [x, z] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) box(g, 0.05, 0.45, 0.05, wood, x, 0.225, z);
      break;
    case 'stool':
      cyl(g, 0.17, 0.17, 0.06, woodL, 0, 0.42, 0, 10);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        const l = box(g, 0.04, 0.44, 0.04, wood, Math.cos(a) * 0.1, 0.2, Math.sin(a) * 0.1);
        l.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12);
      }
      break;
    case 'table': {
      cyl(g, 0.42, 0.42, 0.06, woodL, 0, 0.66, 0, 14);
      cyl(g, 0.06, 0.08, 0.62, wood, 0, 0.32, 0, 8);
      cyl(g, 0.25, 0.28, 0.04, wood, 0, 0.02, 0, 10);
      cyl(g, 0.05, 0.045, 0.12, mat(0xb8a080), 0.15, 0.75, 0.08, 8);
      cyl(g, 0.05, 0.045, 0.12, mat(0xb8a080), -0.12, 0.75, -0.1, 8);
      cyl(g, 0.03, 0.035, 0.1, mat(0xf0e8c8, { emissive: 0x6a5a20 }), 0, 0.74, 0, 8);
      break;
    }
    case 'counter': {
      const w = fw * 0.98;
      box(g, w, 0.9, 0.62, wood, 0, 0.45, 0);
      box(g, w + 0.08, 0.07, 0.72, woodL, 0, 0.93, 0);
      for (let i = 0; i < Math.floor(w); i++) cyl(g, 0.05, 0.045, 0.12, mat(0xb8a080), -w / 2 + 0.5 + i, 1.02, 0.1, 8);
      break;
    }
    case 'plant':
      cyl(g, 0.17, 0.13, 0.3, mat(0xb8603a), 0, 0.15, 0, 10);
      for (const [r, x, y, z, c] of [[0.28, 0, 0.55, 0, 0x4f9a3a], [0.18, 0.1, 0.75, 0.05, 0x62b34a]]) {
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat(c));
        m.position.set(x, y, z);
        g.add(m);
      }
      break;
    case 'rug': {
      const r = box(g, fw * 0.95, 0.02, fd * 0.9, mat(0x9a2a2a), 0, 0.012, 0);
      r.userData.noCast = true;
      box(g, fw * 0.95 - 0.2, 0.025, fd * 0.9 - 0.2, mat(0xc89a3a), 0, 0.013, 0).userData.noCast = true;
      box(g, fw * 0.95 - 0.32, 0.03, fd * 0.9 - 0.32, mat(0x7a1e1e), 0, 0.014, 0).userData.noCast = true;
      break;
    }
    case 'anchor': {
      box(g, 0.08, 0.9, 0.08, M.iron, 0, 0.5, 0);
      box(g, 0.4, 0.06, 0.06, M.iron, 0, 0.85, 0);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 6, 12), M.iron);
      ring.position.y = 1.0;
      g.add(ring);
      const arc = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.045, 6, 14, Math.PI), M.iron);
      arc.rotation.z = Math.PI;
      arc.position.y = 0.38;
      g.add(arc);
      g.rotation.z = 0.15;
      g.position.z = -0.2;
      break;
    }
    case 'sacks':
      for (const [x, z, s] of [[-0.15, 0, 1], [0.18, 0.05, 0.9], [0, -0.12, 0.8]]) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.22 * s, 8, 6), mat(0xd8c49a));
        m.scale.set(1, 1.2, 0.9);
        m.position.set(x, 0.24 * s, z);
        g.add(m);
      }
      break;
    case 'workbench':
      box(g, 1.7, 0.08, 0.7, woodL, 0, 0.75, 0);
      for (const [x, z] of [[-0.75, -0.28], [0.75, -0.28], [-0.75, 0.28], [0.75, 0.28]]) box(g, 0.08, 0.72, 0.08, wood, x, 0.36, z);
      box(g, 0.6, 0.04, 0.14, mat(0xc8ccd4), -0.3, 0.8, 0.05);
      box(g, 0.5, 0.06, 0.2, mat(0xd8b080), 0.4, 0.82, -0.05);
      cyl(g, 0.03, 0.03, 0.25, wood, 0.1, 0.8, 0.2, 6).rotation.z = Math.PI / 2;
      break;
    case 'logs':
      for (const [y, z] of [[0.13, -0.15], [0.13, 0.15], [0.38, 0]]) {
        const l = cyl(g, 0.13, 0.13, 0.8, mat(0x8a5a32), 0, y, z, 10);
        l.rotation.z = Math.PI / 2;
      }
      break;
    case 'bed':
      box(g, 0.9, 0.35, 1.85, wood, 0, 0.2, 0);
      box(g, 0.82, 0.14, 1.75, mat(0xf2ede0), 0, 0.42, 0);
      box(g, 0.86, 0.1, 1.2, mat(0x3a5a9a), 0, 0.47, 0.3);
      box(g, 0.55, 0.12, 0.3, mat(0xffffff), 0, 0.53, -0.68);
      box(g, 0.9, 0.7, 0.08, wood, 0, 0.45, -0.92);
      break;
  }
  return g;
}

export function buildRoom(R, M) {
  const { room, X, Z, w, d } = R;
  const g = new THREE.Group();
  const dyn = [];
  const cx = X + (w - 1) / 2, cz = Z + (d - 1) / 2;
  const floorMat = room.stoneFloor ? mat(room.floor, { map: M.tx.stone }) : M.planked(room.floor);
  // suelo (incluye la casilla de salida)
  box(g, w, 0.14, d, floorMat, cx, -0.07, cz, 1.2);
  box(g, 1, 0.14, 1, floorMat, R.exit.x, -0.07, R.exit.z, 1.2);
  box(g, 0.9, 0.02, 0.7, mat(0x8a2a2a), R.exit.x, 0.01, R.exit.z - 0.1).userData.noCast = true;
  // bordes del suelo (canto)
  box(g, w + 0.3, 0.32, 0.15, mat(room.wood), cx + 0.15, -0.16, Z + d - 0.43);
  box(g, 0.15, 0.32, d + 0.15, mat(room.wood), X + w - 0.43, -0.16, cz + 0.08);
  // paredes del fondo
  const wallMat = M.plaster(room.wall);
  const H = 2.3;
  box(g, w + 0.25, H, 0.2, wallMat, cx - 0.12, H / 2, Z - 0.6, 1);
  box(g, 0.2, H, d + 0.25, wallMat, X - 0.6, H / 2, cz - 0.12, 1);
  const wood = mat(room.wood);
  box(g, w + 0.25, 0.75, 0.24, wood, cx - 0.12, 0.375, Z - 0.58);
  box(g, 0.24, 0.75, d + 0.25, wood, X - 0.58, 0.375, cz - 0.12);
  box(g, w + 0.3, 0.14, 0.28, wood, cx - 0.12, H, Z - 0.6);
  box(g, 0.28, 0.14, d + 0.3, wood, X - 0.6, H, cz - 0.12);
  for (let i = 0; i <= w; i += 2) box(g, 0.12, H, 0.26, wood, X - 0.5 + i, H / 2, Z - 0.56);
  for (let i = 0; i <= d; i += 2) box(g, 0.26, H, 0.12, wood, X - 0.56, H / 2, Z - 0.5 + i);
  // muebles
  for (const it of room.items) {
    const [type, x, z, rot = 0, fw = 1, fd = 1] = it;
    let obj;
    if (['barrel', 'crate', 'chest', 'anvil', 'forge', 'bench'].includes(type) || type === 'hay') {
      const r = makeProp({ type: type === 'hay' ? 'haystack' : type, x: 0, z: 0, rot: 0 }, M);
      obj = r.group;
      r.dyn.children.slice().forEach((c) => dyn.push({ obj: c, local: true, parent: obj }));
      if (type === 'forge') { obj.scale.set(1.2, 1.2, 1.5); }
    } else {
      const localDyn = [];
      obj = furniture(type, fw, fd, M, room, localDyn);
      localDyn.forEach((dd) => dyn.push({ ...dd, parent: obj }));
    }
    const holder = new THREE.Group();
    holder.add(obj);
    holder.position.set(X + x, 0, Z + z);
    holder.rotation.y = rot;
    g.add(holder);
  }
  // partes animadas (fuego): fuera del lote estático, en coordenadas de mundo
  g.updateMatrixWorld(true);
  const dynWorld = dyn.map((dd) => {
    dd.obj.position.copy(dd.parent.localToWorld(dd.obj.position.clone()));
    return dd.obj;
  });
  return { group: g, dyn: dynWorld };
}

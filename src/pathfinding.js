// A* sobre la cuadrícula, 8 direcciones sin cortar esquinas.

class Heap {
  constructor() {
    this.a = [];
  }
  push(n) {
    const a = this.a;
    a.push(n);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].f <= a[i].f) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop() {
    const a = this.a;
    const top = a[0];
    const last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1, r = l + 1;
        let m = i;
        if (l < a.length && a[l].f < a[m].f) m = l;
        if (r < a.length && a[r].f < a[m].f) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
  get size() {
    return this.a.length;
  }
}

const DIRS = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414],
];

// walkable(x,z) -> bool; goal: {x,z}; adjacent: si true basta con llegar al lado del objetivo.
export function findPath(W, sx, sz, gx, gz, opts = {}) {
  const { adjacent = false, maxIter = 6000, extraBlocked = null } = opts;
  const N = W.N;
  const walk = (x, z) => W.walkable(x, z) && !(extraBlocked && extraBlocked(x, z));
  const isGoal = adjacent
    ? (x, z) => Math.max(Math.abs(x - gx), Math.abs(z - gz)) <= 1 && !(x === gx && z === gz)
    : (x, z) => x === gx && z === gz;
  if (!adjacent && !walk(gx, gz)) return null;
  if (isGoal(sx, sz)) return [];
  const h = (x, z) => {
    const dx = Math.abs(x - gx), dz = Math.abs(z - gz);
    return Math.max(dx, dz) + 0.414 * Math.min(dx, dz);
  };
  const g = new Map();
  const came = new Map();
  const open = new Heap();
  const k0 = sz * N + sx;
  g.set(k0, 0);
  open.push({ x: sx, z: sz, f: h(sx, sz), k: k0 });
  let it = 0;
  while (open.size && it++ < maxIter) {
    const cur = open.pop();
    if (isGoal(cur.x, cur.z)) {
      const path = [];
      let k = cur.k;
      while (k !== k0) {
        path.push({ x: k % N, z: Math.floor(k / N) });
        k = came.get(k);
      }
      return path.reverse();
    }
    const cg = g.get(cur.k);
    for (const [dx, dz, c] of DIRS) {
      const nx = cur.x + dx, nz = cur.z + dz;
      if (!walk(nx, nz)) continue;
      if (dx && dz && (!walk(cur.x + dx, cur.z) || !walk(cur.x, cur.z + dz))) continue;
      const nk = nz * N + nx;
      const ng = cg + c;
      if (ng < (g.get(nk) ?? Infinity)) {
        g.set(nk, ng);
        came.set(nk, cur.k);
        open.push({ x: nx, z: nz, f: ng + h(nx, nz), k: nk });
      }
    }
  }
  return null;
}

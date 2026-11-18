// Interfaz HTML: HUD, etiquetas, números flotantes, diálogos, minimapa y joystick.
import * as THREE from 'three';
import { T } from './world.js';

const $ = (id) => document.getElementById(id);
const v3 = new THREE.Vector3();

export class UI {
  constructor(game) {
    this.g = game;
    this.labelsEl = $('labels');
    this.floats = [];
    this.cache = {};
    this.dialogOpen = false;
    this.joy = { x: 0, y: 0, active: false };
    this.initJoystick();
    this.initDialog();
    this.mm = $('minimap');
    this.mmCtx = this.mm.getContext('2d');
    this.mmBig = false;
    $('minimapWrap').addEventListener('click', () => {
      this.mmBig = !this.mmBig;
      $('minimapWrap').classList.toggle('big', this.mmBig);
      const s = this.mmBig ? 560 : 200;
      this.mm.width = s;
      this.mm.height = s;
      this.drawMinimap();
    });
    $('questCard').addEventListener('click', () => $('questCard').classList.toggle('collapsed'));
  }

  // ---------------------------------------------------------- etiquetas
  makeLabel(kind, name, opts = {}) {
    const el = document.createElement('div');
    el.className = 'lbl ' + kind;
    el.innerHTML = `${opts.tag ? `<div class="tag">${opts.tag}</div>` : ''}<div class="mark" style="display:none"></div><div class="nm"></div>${opts.hp ? '<div class="hpb"><i></i></div>' : ''}`;
    el.querySelector('.nm').textContent = name;
    this.labelsEl.appendChild(el);
    return {
      el, nm: el.querySelector('.nm'), mark: el.querySelector('.mark'), hp: el.querySelector('.hpb i'), hpb: el.querySelector('.hpb'),
      _vis: true, _mark: '', _hp: -1, _x: 0, _y: 0,
    };
  }
  removeLabel(l) {
    if (l && l.el.parentNode) l.el.parentNode.removeChild(l.el);
  }
  setMark(l, m) {
    if (l._mark === m) return;
    l._mark = m;
    l.mark.style.display = m ? 'block' : 'none';
    l.mark.textContent = m;
    l.mark.classList.toggle('q', m === '?');
  }
  setHp(l, f) {
    if (!l.hp) return;
    const v = Math.round(f * 100);
    if (v === l._hp) return;
    l._hp = v;
    l.hp.style.width = v + '%';
    l.hpb.style.visibility = v < 100 ? 'visible' : 'hidden';
  }
  placeLabel(l, x, y, z) {
    const g = this.g;
    v3.set(x, y, z).project(g.camera);
    const vis = v3.z < 1 && Math.abs(v3.x) < 1.15 && Math.abs(v3.y) < 1.15;
    if (vis !== l._vis) {
      l._vis = vis;
      l.el.style.display = vis ? '' : 'none';
    }
    if (!vis) return;
    const sx = Math.round((v3.x * 0.5 + 0.5) * g.width);
    const sy = Math.round((-v3.y * 0.5 + 0.5) * g.height);
    if (sx !== l._x || sy !== l._y) {
      l._x = sx;
      l._y = sy;
      l.el.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -100%)`;
    }
  }

  // ---------------------------------------------------------- textos flotantes
  float(text, cls, x, y, z) {
    const el = document.createElement('div');
    el.className = 'float ' + cls;
    el.textContent = text;
    this.labelsEl.appendChild(el);
    this.floats.push({ el, x: x + (cls === 'chat' ? 0 : (Math.random() - 0.5) * 0.3), y, z, t: 0, life: cls === 'chat' ? 3.2 : cls === 'info' ? 1.6 : 1.0, chat: cls === 'chat' });
  }
  updateFloats(dt) {
    const g = this.g;
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      f.t += dt;
      if (f.t >= f.life) {
        f.el.remove();
        this.floats.splice(i, 1);
        continue;
      }
      v3.set(f.x, f.y + (f.chat ? 0 : f.t * 0.9), f.z).project(g.camera);
      const sx = (v3.x * 0.5 + 0.5) * g.width;
      const sy = (-v3.y * 0.5 + 0.5) * g.height;
      const k = f.t / f.life;
      const sc = f.chat ? 1 : k < 0.15 ? 0.6 + k * 4 : 1.2 - Math.min(0.2, k);
      f.el.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -50%) scale(${sc})`;
      f.el.style.opacity = k > 0.6 ? String(1 - (k - 0.6) / 0.4) : '1';
    }
  }

  toast(text, cls = '') {
    const box = $('toasts');
    const el = document.createElement('div');
    el.className = 'toast ' + cls;
    el.textContent = text;
    box.appendChild(el);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => {
      el.style.transition = 'opacity 0.4s';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 450);
    }, cls === 'area' ? 2200 : 2600);
  }

  // ---------------------------------------------------------- diálogo
  initDialog() {
    $('dclose').addEventListener('click', () => this.closeDialog());
  }
  openDialog(name, text, options) {
    this.dialogOpen = true;
    $('dialog').classList.remove('hidden');
    $('dname').textContent = name;
    $('dtext').textContent = String(text ?? '').replace(/<br\s*\/?>/g, '\n').replace(/<\/?(b|small)>/g, '');
    const box = $('dopts');
    box.innerHTML = '';
    options.forEach((o, i) => {
      const b = document.createElement('button');
      b.textContent = o.label;
      if (options.length % 2 === 1 && i === options.length - 1) b.className = 'single';
      b.addEventListener('click', () => {
        this.g.sfx('click');
        this.closeDialog();
        if (o.action) o.action();
      });
      box.appendChild(b);
    });
  }
  closeDialog() {
    if (!this.dialogOpen) return;
    this.dialogOpen = false;
    $('dialog').classList.add('hidden');
    if (this.g.talkingTo) {
      this.g.talkingTo.talking = false;
      this.g.talkingTo = null;
    }
  }

  // ---------------------------------------------------------- joystick
  initJoystick() {
    const base = $('joy');
    const knob = $('joyKnob');
    let id = null;
    const R = 42;
    const upd = (e) => {
      const r = base.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2);
      let dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy);
      if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      const m = Math.hypot(dx, dy) / R;
      this.joy.active = m > 0.28;
      this.joy.x = dx / R;
      this.joy.y = -dy / R;
    };
    base.addEventListener('pointerdown', (e) => {
      id = e.pointerId;
      base.setPointerCapture(id);
      upd(e);
      e.preventDefault();
    });
    base.addEventListener('pointermove', (e) => { if (e.pointerId === id) upd(e); });
    const end = (e) => {
      if (e.pointerId !== id) return;
      id = null;
      knob.style.transform = '';
      this.joy.active = false;
      this.joy.x = this.joy.y = 0;
    };
    base.addEventListener('pointerup', end);
    base.addEventListener('pointercancel', end);
  }

  // ---------------------------------------------------------- HUD
  set(id, val) {
    if (this.cache[id] === val) return;
    this.cache[id] = val;
    $(id).textContent = val;
  }
  style(id, prop, val) {
    const k = id + prop;
    if (this.cache[k] === val) return;
    this.cache[k] = val;
    $(id).style[prop] = val;
  }
  updateHUD() {
    const g = this.g, p = g.player;
    this.set('pname', p.name.toUpperCase());
    this.set('plvl', 'NV. ' + p.level);
    this.set('gold', String(p.gold));
    this.set('wood', String(p.inv.wood));
    this.set('stone', String(p.inv.stone));
    this.set('potions', String(p.inv.potion));
    this.set('potCount', String(p.inv.potion));
    this.set('atk', String(Math.round(p.atk)));
    const mar = g.isMarine();
    this.set('bounty', mar ? (g.honor || 0) + ' ' + g.bountyText() : String(g.bounty || 0));
    if (this.cache.mar !== mar) { this.cache.mar = mar; document.getElementById('bountyBox').firstChild.textContent = mar ? '⚓ ' : '☠ '; document.getElementById('bountyBox').classList.toggle('mar', mar); }
    this.set('hptext', `${Math.ceil(p.hp)} / ${p.maxHp}`);
    this.style('hpfill', 'width', (100 * Math.max(0, p.hp) / p.maxHp).toFixed(1) + '%');
    this.style('stfill', 'width', (100 * Math.max(0, p.stamina) / p.maxSt).toFixed(1) + '%');
    const low = p.exhausted || p.stamina < 20;
    if (this.cache.stlow !== low) { this.cache.stlow = low; document.querySelector('.bar.st').classList.toggle('low', low); }
    const run = !!p.running;
    if (this.cache.run !== run) { this.cache.run = run; document.getElementById('btnRun').classList.toggle('on', run); }
    this.style('xpfill', 'width', (100 * p.xp / p.xpNext()).toFixed(1) + '%');
    this.set('area', g.W.areaName(p.tx, p.tz).toUpperCase());
    const h = Math.floor(g.tod), m = Math.floor((g.tod % 1) * 60);
    const night = g.tod < 6.5 || g.tod > 19.5;
    this.set('clock', `${g.weatherIcon ? g.weatherIcon() : ''}${g.lowTide && g.lowTide() ? ' 🌊↓' : ''} ${night ? '☾' : ''}${String(h).padStart(2, '0')}:${String(Math.floor(m / 10) * 10).padStart(2, '0')}`);
    this.set('coords', g.W.isInterior(p.x) ? 'interior' : `${p.tx}, ${p.tz}`);
    const q = g.questInfo();
    this.set('qtitle', q.title);
    this.set('qdesc', q.desc);
    this.set('qprog', q.prog);
    const a = g.contextAction();
    const use = a && a.fn && a.label !== 'Atacar';
    if (this.cache.use !== use) { this.cache.use = use; document.getElementById('btnUse').classList.toggle('hidden', !use); }
    if (use) { this.set('useIcon', a.icon); this.set('useLabel', a.label); }
    this.set('actIcon', g.sailing ? '💣' : '⚔️');
    this.set('actLabel', g.sailing ? 'Cañones' : 'Atacar');
  }

  // ---------------------------------------------------------- minimapa
  buildMinimapBase() {
    const g = this.g, W = g.W;
    const B = { x0: -110, z0: -110, size: 360 };
    const c = document.createElement('canvas');
    const S = 2;
    c.width = B.size * S;
    c.height = B.size * S;
    const ctx = c.getContext('2d');
    const col = {
      [T.WATER]: '#2f7fb8', [T.SAND]: '#e2cd96', [T.GRASS]: '#6aa848', [T.DARK]: '#5a983e',
      [T.DIRT]: '#b4895a', [T.STONE]: '#b4b2ac', [T.DOCK]: '#8a6a44', [T.FIELD]: '#c9a24a', [T.ROCK]: '#5a504e', [T.LAVA]: '#ff6418', [T.SNOW]: '#eef2f8', [T.CANDY]: '#f6aac8', [T.METAL]: '#82848c', [T.MOSS]: '#4a5c34', [T.FUNGI]: '#604678', [T.VOID]: '#241834',
    };
    for (let j = 0; j < B.size; j++) for (let i = 0; i < B.size; i++) {
      ctx.fillStyle = col[W.tileAll(B.x0 + i, B.z0 + j)];
      ctx.fillRect(i * S, j * S, S, S);
    }
    const X = (x) => (x - B.x0) * S, Z = (z) => (z - B.z0) * S;
    const isl = g.islets || [];
    ctx.fillStyle = '#2e6a32';
    for (const t of [...W.trees, ...isl.flatMap((r) => r.trees)]) ctx.fillRect(X(t.x), Z(t.z), S, S);
    ctx.fillStyle = '#8a8a86';
    for (const r of [...W.rocks, ...isl.flatMap((q) => q.rocks)]) ctx.fillRect(X(r.x), Z(r.z), S, S);
    ctx.fillStyle = '#6a6660';
    for (const w of [...W.walls, ...isl.flatMap((r) => r.walls)]) ctx.fillRect(X(w.x), Z(w.z), S, S);
    for (const t of W.towers) ctx.fillRect(X(t.x) - 1, Z(t.z) - 1, S + 2, S + 2);
    for (const b of [...W.buildings, ...isl.flatMap((r) => r.buildings)]) {
      ctx.fillStyle = '#' + b.roof.toString(16).padStart(6, '0');
      ctx.fillRect(X(b.x0), Z(b.z0), b.w * S, b.d * S);
    }
    ctx.fillStyle = '#5ab8e8';
    ctx.fillRect(X(49), Z(49), 3 * S, 3 * S);
    this.mmBase = c;
    this.mmS = S;
    this.mmB = B;
  }
  drawMinimap() {
    if (!this.mmBase) this.buildMinimapBase();
    const g = this.g, p = g.player;
    const ctx = this.mmCtx;
    const size = this.mm.width;
    const S = this.mmS;
    ctx.save();
    ctx.fillStyle = '#123a5a';
    ctx.fillRect(0, 0, size, size);
    ctx.translate(size / 2, size / 2);
    const B = this.mmB;
    const room = g.roomAt && g.roomAt(p.x, p.z);
    if (room) {
      ctx.restore();
      ctx.fillStyle = '#1a1410';
      ctx.fillRect(0, 0, size, size);
      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.rotate(Math.PI / 4);
      const k = (size * 0.55) / Math.max(room.w, room.d);
      ctx.fillStyle = '#8a6a44';
      ctx.fillRect(-room.w * k / 2, -room.d * k / 2, room.w * k, room.d * k);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc((p.x - room.X - (room.w - 1) / 2) * k, (p.z - room.Z - (room.d - 1) / 2) * k, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c83a2a';
      ctx.fillRect((room.exit.x - room.X - (room.w - 1) / 2) * k - 4, (room.exit.z - room.Z - (room.d - 1) / 2) * k - 4, 8, 8);
      ctx.restore();
      ctx.fillStyle = '#e3bb55';
      ctx.font = '12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(room.name, size / 2, size - 10);
      return;
    }
    let scale, cx, cz;
    if (this.mmBig) {
      scale = (size / (B.size * S)) * 1.3;
      cx = B.x0 + B.size / 2 - 5; cz = B.z0 + B.size / 2 - 5;
    } else {
      scale = 1.6;
      cx = p.x; cz = p.z;
    }
    ctx.rotate(Math.PI / 4);
    ctx.scale(scale, scale);
    ctx.translate(-(cx - B.x0) * S - S / 2, -(cz - B.z0) * S - S / 2);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.mmBase, 0, 0);
    const dot = (x, z, color, r) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc((x - B.x0) * S + S / 2, (z - B.z0) * S + S / 2, r / scale, 0, Math.PI * 2);
      ctx.fill();
    };
    if (!g.sailing) dot(g.boat.x, g.boat.z, '#6a3a1a', this.mmBig ? 4 : 5);
    for (const e of g.enemies) if (!e.dead) dot(e.x, e.z, e.type === 'boss' ? '#ff00aa' : '#e8302a', this.mmBig ? 2.5 : 3);
    for (const n of g.npcs) dot(n.x, n.z, '#ffe04a', this.mmBig ? 2.5 : 3);
    const rm = g.raceMarker && g.raceMarker();
    if (rm) dot(rm.x, rm.z, '#2ad84a', 6);
    const em = g.eventMarker && g.eventMarker();
    if (em) dot(em.x, em.z, '#ffd23a', 6);
    const bm = g.beastMarker && g.beastMarker();
    if (bm) dot(bm.x, bm.z, '#ff2a2a', 7);
    if (g.wreckSpots) for (const ws of g.wreckSpots) dot(ws.x, ws.z, '#1a3a8a', 4);
    if (g.mareaSpot) dot(g.mareaSpot.x, g.mareaSpot.z, '#2ad8c8', 5);
    if (g.velariaPos) { const v = g.velariaPos(); dot(v.x, v.z, '#c85ae0', 5); }
    if (g.grottoSpots) for (const gs of g.grottoSpots) dot(gs.x, gs.z, '#7ad8ff', 4);
    const qm = g.questMarker();
    if (qm) {
      const pulse = 4 + Math.sin(performance.now() / 200) * 1.5;
      ctx.strokeStyle = '#ffd23a';
      ctx.lineWidth = 2 / scale;
      ctx.beginPath();
      ctx.arc((qm.x - B.x0) * S + S / 2, (qm.z - B.z0) * S + S / 2, (pulse + 3) / scale, 0, Math.PI * 2);
      ctx.stroke();
      dot(qm.x, qm.z, '#ffd23a', 3);
    }
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5 / scale;
    ctx.beginPath();
    ctx.arc((p.x - B.x0) * S + S / 2, (p.z - B.z0) * S + S / 2, 4 / scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    if (this.mmBig) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, size - 26, size, 26);
      ctx.fillStyle = '#f1ead8';
      ctx.font = '13px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('Mar de Bruma · toca para cerrar', size / 2, size - 9);
    }
  }
}

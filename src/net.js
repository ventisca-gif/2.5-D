// Multijugador local (misma Wi-Fi, hasta 5 jugadores).
// El anfitrión es la autoridad de los enemigos; cada jugador mueve su propio personaje.
// Transporte: WebSocket contra el relé de la app Android (NetHub.java) o el de pruebas (tools/hub.mjs).
import * as THREE from 'three';
import { makeHumanoid2 } from './chars2.js';
import { buildLook } from './items.js';
import { makeShip } from './props.js';
import { animateModel } from './characters.js';

export const PORT = 47800;
export const MAX_PLAYERS = 5;
const r2 = (v) => Math.round(v * 100) / 100;

export class Net {
  constructor(game) {
    this.g = game;
    this.mode = null;
    this.ws = null;
    this.myId = null;
    this.remotes = new Map();   // id -> jugador remoto (modelo, etiqueta, estado)
    this.clients = new Map();   // (anfitrión) id -> { state, info }
    this.teams = new Map();     // (anfitrión) id -> equipo
    this.room = { pvp: false, players: [] };
    this.tick = 0;
    this.infoT = 0;
    this.hosts = [];
  }
  get isHost() { return this.mode === 'host'; }
  get isClient() { return this.mode === 'client'; }
  get active() { return !!this.mode && !this.connecting; }

  // ------------------------------------------------------------------ conexión
  host(testUrl) {
    const b = window.AndroidBridge;
    if (!testUrl) {
      if (!b || !b.startHub) return { error: 'Crear partida solo funciona en la app Android (con Wi-Fi o zona Wi-Fi activa).' };
      let ips = [];
      try { ips = JSON.parse(b.startHub(this.g.player.name) || '[]'); } catch (e) { ips = []; }
      if (!ips.length) return { error: 'No se pudo abrir la partida. Conéctate a una Wi-Fi o activa la zona Wi-Fi del móvil.' };
      this.ips = ips;
    } else this.ips = ['127.0.0.1'];
    this.connect(testUrl || `ws://127.0.0.1:${PORT}/host`, 'host');
    return { ips: this.ips };
  }
  join(ip) {
    ip = String(ip || '').trim().replace(/^ws:\/\//, '').replace(/:\d+.*$/, '');
    if (!ip) return;
    this.connect(`ws://${ip}:${PORT}/`, 'client');
  }
  connect(url, mode) {
    if (this.ws) this.leave(true);
    let ws;
    try { ws = new WebSocket(url); } catch (e) { this.g.ui.toast('No se pudo conectar'); return; }
    this.ws = ws;
    this.mode = mode;
    this.connecting = true;
    ws.onopen = () => {
      this.connecting = false;
      if (mode === 'host') {
        this.myId = 0;
        this.teams.set(0, null);
        this.g.ui.toast('🏠 Partida creada: esperando jugadores');
        this.broadcastRoom();
      }
      this.g.panels.refreshNet();
    };
    ws.onmessage = (ev) => { try { this.onRaw(ev.data); } catch (e) { console.error(e); } };
    ws.onclose = () => this.onClosed();
    ws.onerror = () => {};
  }
  leave(silent) {
    const ws = this.ws;
    const wasHost = this.isHost;
    this.reset();
    if (ws) try { ws.close(); } catch (e) { /* nada */ }
    if (wasHost && window.AndroidBridge && window.AndroidBridge.stopHub) window.AndroidBridge.stopHub();
    if (!silent) this.g.ui.toast('👋 Has salido de la partida');
    this.g.panels.refreshNet();
  }
  onClosed() {
    if (!this.mode) return;
    const was = this.mode, failed = this.connecting;
    this.reset();
    this.g.ui.toast(failed ? '❌ No se encontró la partida en esa IP' : was === 'client' ? '🔌 Desconectado de la partida' : '🔌 Partida cerrada');
    this.g.panels.refreshNet();
  }
  reset() {
    this.mode = null;
    this.ws = null;
    this.connecting = false;
    for (const r of this.remotes.values()) this.dropRemote(r);
    this.remotes.clear();
    this.clients.clear();
    this.teams.clear();
    this.room = { pvp: false, players: [] };
    this.myId = null;
    // los enemigos vuelven a la IA local
    for (const e of this.g.enemies) if (e.state === 'net') e.state = 'idle';
  }
  // cliente -> anfitrión
  send(obj) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(obj)); }
  // anfitrión -> jugador(es)
  hsend(to, obj) { if (this.ws && this.ws.readyState === 1) this.ws.send(to + '|' + JSON.stringify(obj)); }

  onRaw(data) {
    const m = JSON.parse(data);
    if (this.isHost) this.onHostMsg(m.from, m.d);
    else this.onClientMsg(m);
  }

  // ------------------------------------------------------------------ datos propios
  myState() {
    const g = this.g, p = g.player;
    const s = { x: r2(p.x), z: r2(p.z), f: r2(p.face), mv: p.st.moving ? 1 : 0, sw: p.st.swim ? 1 : 0, d: p.dead ? 1 : 0, hp: Math.round(p.hp), mhp: p.maxHp, lv: p.level };
    if (g.sailing) Object.assign(s, { sl: 1, bx: r2(g.boat.x), bz: r2(g.boat.z), bh: r2(g.boat.heading) });
    return s;
  }
  myInfo() {
    const g = this.g, p = g.player;
    return { name: p.name, lv: p.level, ap: p.ap, eq: p.equip, crew: g.crew().map((n) => n.name), partner: g.partner() ? g.partner().name : null };
  }
  infoOf(id) {
    if (id === this.myId) return this.myInfo();
    if (this.isHost) return (this.clients.get(id) || {}).info;
    const pl = this.room.players.find((q) => q.id === id);
    return pl;
  }

  // ------------------------------------------------------------------ anfitrión
  onHostMsg(from, d) {
    const g = this.g;
    if (!d) return;
    switch (d.t) {
      case 'join':
        if (this.clients.size >= MAX_PLAYERS - 1) return;
        this.clients.set(from, { state: null, info: null });
        this.teams.set(from, null);
        break;
      case 'leave': {
        const c = this.clients.get(from);
        this.clients.delete(from);
        this.teams.delete(from);
        const r = this.remotes.get(from);
        if (r) { this.dropRemote(r); this.remotes.delete(from); }
        g.ui.toast(`👋 ${c && c.info ? c.info.name : 'Un jugador'} salió de la partida`);
        this.broadcastRoom();
        break;
      }
      case 'info': {
        const c = this.clients.get(from);
        if (!c) return;
        const first = !c.info;
        c.info = d;
        this.upsertRemote(from, d, null);
        if (first) g.ui.toast(`👋 ${d.name} se unió a la partida`);
        this.broadcastRoom();
        break;
      }
      case 'st': {
        const c = this.clients.get(from);
        if (!c) return;
        c.state = d;
        if (c.info) this.upsertRemote(from, c.info, d);
        break;
      }
      case 'atk':
        this.remoteSwing(from);
        this.hsend('*', { t: 'atk', id: from });
        break;
      case 'hit': {
        const e = g.enemies[d.e];
        if (e && !e.dead) g.damageEnemy(e, d.dmg, d.crit, null, from);
        break;
      }
      case 'pvp': this.routePvp(from, d.to, d.dmg); break;
      case 'inv': {
        const name = (this.infoOf(from) || {}).name || '?';
        if (d.to === 0) g.netInvite(from, name);
        else this.hsend(d.to, { t: 'inv', from, name });
        break;
      }
      case 'acc': this.joinTeam(from, d.from); break;
      case 'leaveTeam': this.teams.set(from, null); this.cleanTeams(); this.broadcastRoom(); break;
    }
  }
  joinTeam(a, inviter) {
    const t = this.teams.get(inviter) ?? inviter;
    this.teams.set(inviter, t);
    this.teams.set(a, t);
    this.broadcastRoom();
    const na = (this.infoOf(a) || {}).name, ni = (this.infoOf(inviter) || {}).name;
    this.g.ui.toast(`🤝 ${na} y ${ni} forman equipo`);
    this.hsend('*', { t: 'toast', msg: `🤝 ${na} y ${ni} forman equipo` });
  }
  cleanTeams() {
    const count = new Map();
    for (const t of this.teams.values()) if (t !== null) count.set(t, (count.get(t) || 0) + 1);
    for (const [id, t] of this.teams) if (t !== null && count.get(t) < 2) this.teams.set(id, null);
  }
  sameTeam(a, b) {
    if (this.isHost) { const ta = this.teams.get(a), tb = this.teams.get(b); return ta != null && ta === tb; }
    const pa = this.room.players.find((q) => q.id === a), pb = this.room.players.find((q) => q.id === b);
    return !!(pa && pb && pa.team != null && pa.team === pb.team);
  }
  routePvp(from, to, dmg) {
    if (!this.room.pvp || this.sameTeam(from, to)) return;
    if (to === 0) this.g.netHurtByPlayer(from, dmg);
    else this.hsend(to, { t: 'hurtP', from, dmg });
  }
  broadcastRoom() {
    if (!this.isHost) return;
    const players = [{ id: 0, ...this.myInfo(), team: this.teams.get(0) ?? null }];
    for (const [id, c] of this.clients) if (c.info) players.push({ id, ...c.info, team: this.teams.get(id) ?? null });
    this.room = { pvp: this.room.pvp, players };
    this.hsend('*', { t: 'room', pvp: this.room.pvp, players });
    this.g.panels.refreshNet();
  }
  setPvp(on) {
    if (!this.isHost) return;
    this.room.pvp = !!on;
    this.broadcastRoom();
    this.g.ui.toast(on ? '⚔️ PvP activado' : '🕊️ PvP desactivado');
    this.hsend('*', { t: 'toast', msg: on ? '⚔️ El anfitrión activó el PvP' : '🕊️ PvP desactivado' });
  }
  // quién recibe la experiencia de una muerte: el que la mató + su equipo cerca
  killRecipients(killer, e) {
    const out = new Set([killer]);
    const t = this.teams.get(killer);
    if (t != null) {
      for (const [id, tt] of this.teams) {
        if (tt !== t) continue;
        const pos = id === 0 ? this.g.player : (this.clients.get(id) || {}).state;
        if (pos && Math.hypot(pos.x - e.x, pos.z - e.z) < 25) out.add(id);
      }
    }
    return [...out];
  }
  hurtRemote(id, atk, enemyIdx) { this.hsend(id, { t: 'hurt', atk, e: enemyIdx }); }

  // ------------------------------------------------------------------ cliente
  onClientMsg(m) {
    const g = this.g;
    switch (m.t) {
      case 'hello':
        this.myId = m.id;
        this.send({ t: 'info', ...this.myInfo() });
        g.ui.toast('✅ Te uniste a la partida');
        for (const e of g.enemies) e.state = 'net';
        break;
      case 'full': g.ui.toast('La partida está llena (máx. 5)'); break;
      case 'w': {
        if (typeof m.tod === 'number') g.tod = m.tod;
        m.en.forEach((a, i) => { const e = g.enemies[i]; if (e) e.net = a; });
        const seen = new Set();
        for (const pl of m.pl) {
          if (pl.id === this.myId) continue;
          seen.add(pl.id);
          const info = this.room.players.find((q) => q.id === pl.id);
          if (info) this.upsertRemote(pl.id, info, pl);
        }
        for (const [id, r] of this.remotes) if (!seen.has(id)) { this.dropRemote(r); this.remotes.delete(id); }
        break;
      }
      case 'room':
        this.room = { pvp: m.pvp, players: m.players };
        for (const pl of m.players) if (pl.id !== this.myId && this.remotes.has(pl.id)) this.upsertRemote(pl.id, pl, null);
        g.panels.refreshNet();
        break;
      case 'atk': if (m.id !== this.myId) this.remoteSwing(m.id); break;
      case 'hurt': { const e = g.enemies[m.e]; if (e) g.damagePlayer(e, m.atk); break; }
      case 'hurtP': g.netHurtByPlayer(m.from, m.dmg); break;
      case 'kill': g.grantKill(m.et, m.lvl, m.x, m.z, m.killer, m.xp); break;
      case 'inv': g.netInvite(m.from, m.name); break;
      case 'toast': g.ui.toast(m.msg); break;
    }
  }

  // ------------------------------------------------------------------ acciones del jugador local
  attackAnim() {
    if (!this.active) return;
    if (this.isHost) this.hsend('*', { t: 'atk', id: 0 });
    else this.send({ t: 'atk' });
  }
  hit(e, dmg, crit) { this.send({ t: 'hit', e: e.idx, dmg, crit }); }
  pvpHit(r, dmg) {
    if (!this.room.pvp) { this.g.ui.toast('🕊️ El PvP está desactivado'); return false; }
    if (this.sameTeam(this.myId, r.id)) { this.g.ui.toast('🤝 Es de tu equipo'); return false; }
    if (this.isHost) this.routePvp(0, r.id, dmg);
    else this.send({ t: 'pvp', to: r.id, dmg });
    return true;
  }
  invite(id) {
    if (this.isHost) this.onHostMsg(0, { t: 'inv', to: id });
    else this.send({ t: 'inv', to: id });
    this.g.ui.toast('📨 Invitación enviada');
  }
  accept(inviter) {
    if (this.isHost) this.joinTeam(0, inviter);
    else this.send({ t: 'acc', from: inviter });
  }
  leaveTeam() {
    if (this.isHost) { this.teams.set(0, null); this.cleanTeams(); this.broadcastRoom(); }
    else this.send({ t: 'leaveTeam' });
  }
  myTeam() {
    if (this.isHost) return this.teams.get(0) ?? null;
    const me = this.room.players.find((q) => q.id === this.myId);
    return me ? me.team : null;
  }

  // ------------------------------------------------------------------ jugadores remotos
  upsertRemote(id, info, state) {
    const g = this.g;
    let r = this.remotes.get(id);
    if (!r) {
      r = { id, isRemote: true, st: {}, x: 0, z: 0, face: 0, dead: false, vy: 0, tgt: null };
      Object.defineProperty(r, 'tx', { get() { return Math.round(this.x); } });
      Object.defineProperty(r, 'tz', { get() { return Math.round(this.z); } });
      r.label = g.ui.makeLabel('player remote', '', { hp: true, tag: ' ' });
      this.remotes.set(id, r);
    }
    if (info) {
      r.name = info.name; r.lv = info.lv; r.crew = info.crew || []; r.partner = info.partner; r.team = info.team;
      const key = JSON.stringify([info.ap, info.eq]);
      if (key !== r.lookKey && info.ap) {
        r.lookKey = key;
        const old = r.model;
        r.model = makeHumanoid2({ ...buildLook(info.ap, info.eq || {}), noAutoLegs: true });
        if (old) { r.model.root.position.copy(old.root.position); (old.root.parent || g.scene).remove(old.root); }
        g.scene.add(r.model.root);
      }
      r.label.nm.textContent = `${r.name} · Nv. ${r.lv}`;
      const tags = [];
      if (this.myId !== null && this.sameTeam(this.myId, id)) tags.push('🤝 Equipo');
      if (r.crew.length) tags.push('⚓' + r.crew.length);
      if (r.partner) tags.push('💗 ' + r.partner);
      const tg = r.label.el.querySelector('.tag');
      if (tg) { tg.textContent = tags.join(' · '); tg.style.display = tags.length ? '' : 'none'; }
    }
    if (state) {
      if (!r.tgt) { r.x = state.x; r.z = state.z; r.face = state.f; }
      r.tgt = state;
      r.hp = state.hp; r.maxHp = state.mhp;
      if (state.lv && state.lv !== r.lv) { r.lv = state.lv; r.label.nm.textContent = `${r.name} · Nv. ${r.lv}`; }
    }
    return r;
  }
  dropRemote(r) {
    if (r.model) (r.model.root.parent || this.g.scene).remove(r.model.root);
    if (r.ship) this.g.scene.remove(r.ship);
    this.g.ui.removeLabel(r.label);
  }
  remoteSwing(id) {
    const r = this.remotes.get(id);
    if (!r || !r.model) return;
    r.st.attackT = 0.32;
    this.g.slash(r, 0xffffff);
  }

  // ------------------------------------------------------------------ bucle
  update(dt) {
    if (!this.mode) return;
    const g = this.g;
    // jugadores remotos: interpolación y animación
    for (const r of this.remotes.values()) {
      if (!r.model || !r.tgt) continue;
      const s = r.tgt;
      const k = Math.min(1, dt * 10);
      if (Math.hypot(s.x - r.x, s.z - r.z) > 6) { r.x = s.x; r.z = s.z; }
      r.x += (s.x - r.x) * k;
      r.z += (s.z - r.z) * k;
      let df = s.f - r.face;
      while (df > Math.PI) df -= Math.PI * 2;
      while (df < -Math.PI) df += Math.PI * 2;
      r.face += df * k;
      r.dead = !!s.d;
      r.st.moving = !!s.mv;
      const root = r.model.root;
      if (s.sl) {
        if (!r.ship) { r.ship = makeShip(g.M, g.texSet); g.scene.add(r.ship); }
        r.ship.visible = true;
        r.ship.position.set(s.bx, -0.05, s.bz);
        r.ship.rotation.y = s.bh;
        if (root.parent !== r.ship) { r.ship.add(root); }
        root.position.set(0, 1.42, -2.75);
        root.rotation.set(0, 0, 0);
        r.st.moving = false;
        r.st.swim = false;
      } else {
        if (r.ship) r.ship.visible = false;
        if (root.parent !== g.scene) g.scene.add(root);
        if (r.st.attackT > 0) r.st.attackT -= dt;
        const gy = g.W.groundY(r.x, r.z);
        r.vy += (gy - r.vy) * Math.min(1, dt * 7);
        r.st.swim = gy < -0.5;
        root.position.set(r.x, r.vy, r.z);
        root.rotation.set(0, r.face, r.dead ? Math.PI / 2 : 0);
      }
      animateModel(r.model, r.st, dt);
      const p = g.player;
      if (Math.hypot(r.x - p.x, r.z - p.z) < 24) {
        g.ui.placeLabel(r.label, s.sl ? s.bx : r.x, s.sl ? 2.9 : r.vy + r.model.height + 0.12, s.sl ? s.bz : r.z);
        g.ui.setHp(r.label, r.maxHp ? Math.max(0, r.hp) / r.maxHp : 1);
      } else if (r.label._vis) { r.label._vis = false; r.label.el.style.display = 'none'; }
    }
    // envío periódico (10 por segundo)
    this.tick -= dt;
    this.infoT -= dt;
    if (this.tick > 0 || this.connecting) return;
    this.tick = 0.1;
    if (this.isHost) {
      const en = g.enemies.slice(0, g.baseEnemies || g.enemies.length).map((e) => [r2(e.x), r2(e.z), r2(e.face), Math.max(0, Math.round(e.hp)), e.dead ? 1 : 0, e.st.moving ? 1 : 0, e.atkSeq || 0, e.level, e.maxHp]);
      const pl = [{ id: 0, ...this.myState() }];
      for (const [id, c] of this.clients) if (c.state) pl.push({ id, ...c.state });
      this.hsend('*', { t: 'w', tod: Math.round(g.tod * 100) / 100, en, pl });
      if (this.infoT <= 0) { this.infoT = 2; this.broadcastRoom(); }
    } else if (this.myId !== null) {
      this.send({ t: 'st', ...this.myState() });
      if (this.infoT <= 0) { this.infoT = 2; this.send({ t: 'info', ...this.myInfo() }); }
    }
  }
}

// Paneles de interfaz: equipo + mochila (con vista previa 3D), forja/banco/cocina, bitácora, guía y regalos.
import * as THREE from 'three';
import { ITEMS, EQUIP, SLOTS, COS_SLOTS, RECIPES, DROPS, TIER_NAMES, buildLook, gearStats } from './items.js';
import { makeHumanoid2, OUTLINE } from './chars2.js';
import { animateModel } from './characters.js';
import { QUESTS, SIDE_QUESTS } from './quests.js';
import { STRUCTS } from './build.js';
import { JOBS, JOB_MAX, DECOR } from './extra.js';
import { PETS } from './more.js';
import { LOGROS, CREW_JOBS, MOUNTS } from './more2.js';
import { friendLevel, heartsText, MAX_CREW } from './social.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

export function fmtTime(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
  return h ? `${h} h ${m} min` : `${m} min`;
}

export class Panels {
  constructor(game) {
    this.g = game;
    this.el = $('panel');
    this.open = null;
    this.el.addEventListener('click', (e) => {
      if (e.target === this.el) this.close();
      const b = e.target.closest('[data-p]');
      if (b) this.onClick(b.dataset.p, b);
    });
  }
  get isOpen() { return !!this.open; }
  show(kind, title, html, wide = false) {
    this.open = kind;
    this.el.classList.remove('hidden');
    this.el.innerHTML = `<div class="pbox ${wide ? 'wide' : ''}"><div class="phead"><span class="ptitle">${title}</span><button class="pclose" data-p="close">✕</button></div><div class="pbody">${html}</div></div>`;
    this.g.paused = true;
  }
  close() {
    if (!this.open) return;
    this.open = null;
    this.el.classList.add('hidden');
    this.el.innerHTML = '';
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    this.g.paused = false;
    this.g.save();
  }
  onClick(act, b) {
    const g = this.g, p = g.player;
    this.g.sfx('click');
    if (act === 'close') return this.close();
    if (act === 'tab') { this.tab = b.dataset.tab; return this.openBitacora(this.tab); }
    if (act === 'item') { this.sel = b.dataset.id; return this.renderInv(); }
    if (act === 'slot' && b.dataset.slot.startsWith('cos')) return this.openWardrobe(b.dataset.slot);
    if (act === 'cos') { g.equipCos(b.dataset.id); return this.openWardrobe(this.wslot); }
    if (act === 'cosoff') { g.unequip(this.wslot); return this.openWardrobe(this.wslot); }
    if (act === 'cosslot') return this.openWardrobe(b.dataset.slot);
    if (act === 'mapclue') { const m = g.tmaps[Number(b.dataset.i)]; if ((p.inv.ficha || 0) < 1) { g.toast('Necesitas 1 ficha de gremio'); return; } p.inv.ficha--; m.known = true; return this.openBitacora('mapas'); }
    if (act === 'pet') { g.setPet(b.dataset.id || null); return this.openBitacora('vida'); }
    if (act === 'hatch') { if ((p.inv.huevo_dragon || 0) > 0) { p.inv.huevo_dragon--; g.adoptPet('dragon'); g.toast('🐲 ¡El huevo se abre! Nace tu cría de dragón', 'area'); } else if ((p.inv.ficha || 0) >= 30) { p.inv.ficha -= 30; g.adoptPet('dragon'); } else g.toast('Necesitas un huevo de dragón o 30 fichas'); return this.openBitacora('vida'); }
    if (act === 'flag') { this.close(); g.designFlag(); return; }
    if (act === 'claim') { g.claimContract(Number(b.dataset.i)); return this.openBitacora('oficios'); }
    if (act === 'guild') { const c = g.cosPrice(b.dataset.id); if ((p.inv.ficha || 0) < c.tok) { g.toast('Te faltan fichas de gremio'); return; } p.inv.ficha -= c.tok; g.addCos(b.dataset.id); return this.openBitacora('oficios'); }
    if (act === 'decor') { this.close(); g.placeDecor(b.dataset.id); return; }
    if (act === 'slot') {
      const id = p.equip[b.dataset.slot];
      if (id) { this.sel = null; g.unequip(b.dataset.slot); }
      return this.renderInv();
    }
    if (act === 'equip') { g.equip(this.sel); this.sel = null; return this.renderInv(); }
    if (act === 'cast') { const id = this.sel; this.close(); g.castSpell(id); return; }
    if (act === 'huntday') { g.startHuntDay(); return this.openBitacora('mundo'); }
    if (act === 'huntlist') { this.close(); return g.huntMenu(); }
    if (act === 'eat') { g.eat(this.sel); if (!p.inv[this.sel]) this.sel = null; return this.renderInv(); }
    if (act === 'craft') { g.craft(Number(b.dataset.i)); return this.openCraft(this.station); }
    if (act === 'gift') { const n = this.giftTo; this.close(); g.giveGift(n, b.dataset.id); return; }
    if (act === 'crewtoggle') { g.toggleCrewWait(b.dataset.id); return this.openBitacora('crew'); }
    if (act === 'mkpost') { const id = $('mkItem').value, n = Math.max(1, Number($('mkN').value) || 1), pr = Math.max(1, Number($('mkP').value) || 1); g.marketPost(id, n, pr); return; }
    if (act === 'mkbuy') { const o = (g.market || []).find((k) => String(k.id) === b.dataset.id); if (o) g.marketBuy(o); return; }
    if (act === 'cjob') { g.cycleCrewJob(b.dataset.id); return this.openBitacora('crew'); }
    if (act === 'title') { g.title = b.dataset.t || null; g.applyTitle(); return this.openBitacora('logros'); }
    if (act === 'stash') { g.stashMove(b.dataset.id, Number(b.dataset.n), b.dataset.d); return; }
    if (act === 'crewrole') {
      const r = b.dataset.role;
      if (r === 'collect') { const n = g.npcById(b.dataset.id), s = g.soc(n.id); const f = { ...s.farm }; g.collectFarm(n); s.farm = { ...f, t0: g.playtime }; }
      else g.setCrewRole(b.dataset.id, r || null);
      return this.openBitacora('crew');
    }
    if (act === 'guide') { b.parentElement.classList.toggle('openg'); }
    if (act === 'net') this.netAction(b.dataset.a, b.dataset.id);
    if (act === 'poster') return this.openPosters(Number(b.dataset.i));
    if (act === 'build') { this.close(); g.placeStruct(b.dataset.id); return; }
  }

  // ------------------------------------------------------------------ equipo + mochila
  openInventory() {
    this.sel = null;
    this.show('inv', '🎒 Equipo y mochila', '<div id="invRoot"></div>', true);
    this.renderInv();
    this.startPreview();
  }
  renderInv() {
    const g = this.g, p = g.player;
    const slotBtn = (s) => {
      const id = p.equip[s.id];
      const it = id && ITEMS[id];
      return `<button class="slot ${id ? 'full t' + it.tier : ''}" data-p="slot" data-slot="${s.id}" title="${s.name}">
        <span class="si">${it ? it.icon : s.icon}</span><small>${it ? esc(it.name) : s.name}</small></button>`;
    };
    const left = ['head', 'chest', 'hands', 'feet'].map((id) => slotBtn(SLOTS.find((s) => s.id === id))).join('');
    const right = ['neck', 'cape', 'ring'].map((id) => slotBtn(SLOTS.find((s) => s.id === id))).join('');
    const bottom = ['weapon', 'shield'].map((id) => slotBtn(SLOTS.find((s) => s.id === id))).join('');
    const cos = COS_SLOTS.map((s) => slotBtn(s)).join('');
    const items = Object.entries(p.inv).filter(([, n]) => n > 0).sort((a, b) => (ITEMS[a[0]]?.type || '').localeCompare(ITEMS[b[0]]?.type || ''));
    const grid = items.map(([id, n]) => {
      const it = ITEMS[id] || { icon: '❔', name: id };
      return `<button class="cell ${this.sel === id ? 'sel' : ''} ${it.type === 'equip' ? 't' + it.tier : ''}" data-p="item" data-id="${id}"><span>${it.icon}</span>${n > 1 ? `<b>${n}</b>` : ''}</button>`;
    }).join('') + '<span class="cell empty"></span>'.repeat(Math.max(0, 24 - items.length));
    let detail = '<div class="idet muted">Toca un objeto para verlo. Toca una ranura equipada para quitártela.</div>';
    if (this.sel && ITEMS[this.sel]) {
      const it = ITEMS[this.sel];
      let btn = '';
      if (it.type === 'equip') btn = `<button class="pbtn" data-p="equip">Equipar</button>`;
      if (it.type === 'spell') btn = `<button class="pbtn" data-p="cast">✨ Lanzar</button>`;
      if (it.type === 'food' || it.type === 'heal') btn = `<button class="pbtn" data-p="eat">${it.type === 'heal' ? 'Beber' : 'Comer'}</button>`;
      const cmp = it.type === 'equip' && p.equip[it.slot] ? ` <span class="muted">(llevas: ${esc(ITEMS[p.equip[it.slot]].name)})</span>` : '';
      detail = `<div class="idet"><div class="iname">${it.icon} ${esc(it.name)}${cmp}</div><div class="idesc">${esc(it.desc || '')}</div>${btn}</div>`;
    }
    const gs = gearStats(p.equip);
    $('invRoot').innerHTML = `
      <div class="inv">
        <div class="equipArea">
          <div class="eqTitle">${esc(p.name)} — Nivel ${p.level}</div>
          <div class="eqRow">
            <div class="slotCol">${left}</div>
            <div class="preview"><canvas id="pvCanvas"></canvas>
              <div class="pstats"><div><small>DAÑO</small><b>${Math.round(p.atk)}</b></div><div><small>ARMADURA</small><b>${gs.def}</b></div><div><small>VIDA</small><b>${p.maxHp}</b></div></div>
            </div>
            <div class="slotCol">${right}</div>
          </div>
          <div class="slotRow">${bottom}</div>
          <div class="cosTitle">👕 Aspecto · toca una ranura para abrir tu armario (${(g.wardrobe || []).length} prendas)</div>
          <div class="slotRow cos">${cos}</div>
        </div>
        <div class="bagArea">
          <div class="bagTitle">Mochila · <span class="coinTxt">🪙 ${p.gold}</span></div>
          <div class="bag">${grid}</div>
          ${detail}
        </div>
      </div>`;
    this.pvDirty = true;
  }
  startPreview() {
    if (!this.pv) {
      const r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      const sc = new THREE.Scene();
      sc.add(new THREE.HemisphereLight(0xdfefff, 0x5a4a3a, 1.6));
      const d = new THREE.DirectionalLight(0xffffff, 2.2);
      d.position.set(2, 4, 3);
      sc.add(d);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), new THREE.MeshBasicMaterial({ color: 0x0a2a3a, transparent: true, opacity: 0.55 }));
      disc.rotation.x = -Math.PI / 2;
      sc.add(disc);
      const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
      cam.position.set(0, 1.0, 3.3);
      cam.lookAt(0, 0.6, 0);
      this.pv = { r, sc, cam, model: null, st: {} };
    }
    const loop = () => {
      this.raf = requestAnimationFrame(loop);
      const cv = $('pvCanvas');
      if (!cv) return;
      const pv = this.pv;
      if (pv.r.domElement !== cv) {
        // reutilizar el mismo renderer en el nuevo canvas
        cv.replaceWith(pv.r.domElement);
        pv.r.domElement.id = 'pvCanvas';
      }
      const el = pv.r.domElement;
      const w = el.parentElement.clientWidth, h = Math.max(160, el.parentElement.clientHeight - 54);
      if (el.width !== Math.round(w * pv.r.getPixelRatio()) || pv._h !== h) {
        pv.r.setPixelRatio(Math.min(2, devicePixelRatio));
        pv.r.setSize(w, h);
        pv.cam.aspect = w / h;
        pv.cam.updateProjectionMatrix();
        pv._h = h;
      }
      if (this.pvDirty) {
        this.pvDirty = false;
        if (pv.model) pv.sc.remove(pv.model.root);
        const p = this.g.player;
        pv.model = makeHumanoid2({ ...buildLook(p.ap, p.equip), noAutoLegs: true });
        pv.sc.add(pv.model.root);
      }
      if (pv.model) {
        pv.model.root.rotation.y += 0.012;
        animateModel(pv.model, pv.st, 1 / 60);
      }
      const prev = OUTLINE.uniforms.thick.value;
      OUTLINE.uniforms.thick.value = 0.008;
      pv.r.render(pv.sc, pv.cam);
      OUTLINE.uniforms.thick.value = prev;
    };
    if (this.raf) cancelAnimationFrame(this.raf);
    loop();
  }

  // ------------------------------------------------------------------ forja / banco / cocina
  openCraft(station) {
    this.station = station;
    const g = this.g, p = g.player;
    const titles = { forja: '⚒️ Forja de Tadeo', banco: '🪚 Banco de carpintero', fuego: '🍳 Cocina' };
    const list = RECIPES.map((r, i) => ({ r, i })).filter(({ r }) => r.station === station);
    const html = list.map(({ r, i }) => {
      const it = ITEMS[r.out];
      const needs = Object.entries(r.need).map(([id, n]) => {
        const have = p.inv[id] || 0;
        return `<span class="${have >= n ? 'ok' : 'no'}">${ITEMS[id].icon} ${have}/${n}</span>`;
      }).join(' ');
      const can = Object.entries(r.need).every(([id, n]) => (p.inv[id] || 0) >= n) && p.gold >= r.gold;
      const owned = (p.inv[r.out] || 0) + (Object.values(p.equip).includes(r.out) ? 1 : 0);
      return `<div class="rec ${it.type === 'equip' ? 't' + it.tier : ''}">
        <div class="ricon">${it.icon}</div>
        <div class="rinfo"><div class="rname">${esc(it.name)} ${owned ? `<small class="muted">(tienes ${owned})</small>` : ''}</div>
          <div class="rdesc">${esc(it.desc || '')}</div><div class="rneed">${needs}${r.gold ? ` <span class="${p.gold >= r.gold ? 'ok' : 'no'}">🪙 ${r.gold}</span>` : ''}</div></div>
        <button class="pbtn" data-p="craft" data-i="${i}" ${can ? '' : 'disabled'}>${station === 'fuego' ? 'Cocinar' : 'Fabricar'}</button>
      </div>`;
    }).join('');
    this.show('craft', titles[station], `<div class="recs">${html}</div>`, true);
  }

  // ------------------------------------------------------------------ bitácora
  openBitacora(tab = this.tab || 'mision') {
    this.tab = tab;
    const g = this.g, p = g.player;
    const tabs = [['mision', '📜 Misión'], ['mundo', '🌍 Novedades'], ['logros', '🏆 Logros'], ['oficios', '🛠 Oficios'], ['mapas', '🗺 Mapas'], ['vida', '🐾 Vida'], ['wanted', '☠ Se busca'], ['bestia', '🐾 Bestiario'], ['armeria', '⚔ Armería'], ['amigos', '❤ Amistades'], ['crew', '⚓ Tripulación'], ['diario', '🧭 Diario']]
      .map(([id, n]) => `<button class="tab ${tab === id ? 'on' : ''}" data-p="tab" data-tab="${id}">${n}</button>`).join('');
    let body = '';
    if (tab === 'mision') {
      const q = g.questInfo();
      const done = QUESTS.slice(0, g.quest.stage).map((qq) => `<li>✔ ${esc(qq.title)}</li>`).join('');
      body = `<div class="parch"><div class="qbig">${esc(q.title)}</div><p>${esc(q.desc)}</p>${q.prog ? `<p class="prog">${esc(q.prog)}</p>` : ''}
        <p class="muted">El círculo dorado del minimapa marca el destino.</p></div>
        <div class="sub">Encargos de las islas</div>${this.sideHtml()}
        <div class="sub">Misiones completadas</div><ul class="qlist">${done || '<li class="muted">Ninguna todavía.</li>'}</ul>`;
    } else if (tab === 'mundo') {
      body = g.mundoHtml();
    } else if (tab === 'logros') {
      const lg = g.logros || {};
      const n = LOGROS.filter((L) => lg[L.id]).length;
      body = `<p>Logros: <b>${n}/${LOGROS.length}</b> · Título actual: <b>${g.title ? '«' + esc(g.title) + '»' : 'ninguno'}</b> ${g.title ? '<button class="pbtn small" data-p="title" data-t="">Quitar</button>' : ''}</p>` + LOGROS.map((L) => `<div class="logro ${lg[L.id] ? '' : 'no'}"><span>${lg[L.id] ? '🏆' : '🔒'}</span><b style="flex:1">${esc(L.name)}</b><span class="muted small" style="flex:1.4">${esc(L.desc)}</span>${lg[L.id] ? `<button class="pbtn small" data-p="title" data-t="${esc(L.title)}">${g.title === L.title ? '✔' : 'Usar título'}</button>` : ''}</div>`).join('');
    } else if (tab === 'mapas') {
      body = this.mapsHtml();
    } else if (tab === 'vida') {
      body = this.vidaHtml();
    } else if (tab === 'oficios') {
      body = this.oficiosHtml();
    } else if (tab === 'wanted') {
      return this.openPosters();
    } else if (tab === 'bestia') {
      body = this.bestiaryHtml();
    } else if (tab === 'armeria') {
      body = this.armoryHtml();
    } else if (tab === 'amigos') {
      const rows = g.npcs.filter((n) => g.soc(n.id).met).map((n) => {
        const s = g.soc(n.id);
        const tag = s.partner ? '💗 Pareja' : s.crew ? '⚓ Tripulación' : friendLevel(s.f).name;
        return `<div class="frow"><b>${esc(n.name)}</b><span class="lv">Nv. ${n.level}</span><span class="hearts">${heartsText(s.f)}</span><span class="muted">${tag}</span></div>`;
      }).join('');
      body = rows || '<p class="muted">Habla con la gente de las islas para hacer amigos.</p>';
      body += '<p class="muted small">Charla cada día, haz regalos (comida casera, menas...) y gana duelos para subir la amistad. Con 3 corazones pueden unirse a tu tripulación; con 5, quizá algo más...</p>';
    } else if (tab === 'crew') {
      const crew = g.crew();
      const pt = g.partner();
      const rows = crew.map((n) => {
        const s = g.soc(n.id);
        const role = s.role === 'jail' ? '⛓ Preso en el Bastión' : s.role === 'farm' ? `⛏ Recolectando en ${esc(s.farm ? s.farm.isle : '?')}` : s.role === 'ship' ? '⚓ En el barco' : s.wait ? '⏸ Esperando' : '▶ Te acompaña';
        const y = s.role === 'farm' ? g.farmYield(n) : null;
        const btn = (r, label) => `<button class="pbtn small" data-p="crewrole" data-id="${n.id}" data-role="${r}">${label}</button>`;
        const job = s.cjob ? CREW_JOBS[s.cjob] : null;
        const btns = [`<button class="pbtn small" data-p="cjob" data-id="${n.id}">${job ? job.icon + ' ' + job.name : '🎓 Sin puesto'}</button>`, s.role ? btn('', '▶ Acompañar') : '', s.role !== 'ship' ? btn('ship', '⚓ Al barco') : '', s.role !== 'farm' ? btn('farm', '⛏ Recolectar aquí') : btn('collect', `🎒 Recoger (${Math.floor(y.min)} min)`), !s.role ? `<button class="pbtn small" data-p="crewtoggle" data-id="${n.id}">${s.wait ? '▶ Seguir' : '⏸ Esperar'}</button>` : ''].join('');
        return `<div class="frow crewrow"><b>${esc(n.name)}${s.partner ? ' 💗' : ''}</b><span class="lv">Nv. ${n.level}</span>
          <span class="muted t${n.tier}">${TIER_NAMES[n.tier] || ''}</span><span class="muted">${role}${g.autoHelm === n.id ? ' · 🧭 Timonel' : ''}</span><div class="cbtns">${btns}</div></div>`;
      }).join('');
      body = `<p>Tripulación: <b>${crew.length}/${MAX_CREW}</b> · te acompañan <b>${g.activeCrew().length}/3</b>${pt && !g.soc(pt.id).crew ? ` · Pareja: <b>${esc(pt.name)}</b> (Nv. ${pt.level})` : ''}</p>${rows || '<p class="muted">Aún no tienes tripulación. Haz amistad (3 corazones) y pídeles que se unan.</p>'}
        <p class="muted small">Solo 3 te acompañan a la vez; el resto espera en el barco y sube a cubierta al zarpar. Puedes dejarlos recolectando en la isla donde estás (madera, piedra, menas y oro según la isla, hasta 60 min) y recogerlo luego. Suben de nivel hasta 100, igual que tú. Navegando, pon a uno de timonel desde el botón ⚙️ Barco.</p>`;
    } else {
      const st = g.stats;
      body = `<div class="parch diary">
        <p>⏱ Tiempo jugado: <b>${fmtTime(g.playtime)}</b></p>
        <p>⭐ Nivel: <b>${p.level}</b> / 100 · XP ${p.xp}/${p.xpNext()}</p>
        <p>🪙 Oro: <b>${p.gold}</b></p>
        <p>⚔ Enemigos vencidos: <b>${st.kills || 0}</b> · Duelos ganados: <b>${st.duels || 0}</b></p>
        <p>☠ Recompensa: <b>${g.bounty || 0}</b> oro · <b>${g.bountyText()}</b></p>
        <p>💥 Barcos hundidos: <b>${(st.s_marine || 0) + (st.s_pirate || 0)}</b> (Guardia ${st.s_marine || 0} · piratas ${st.s_pirate || 0})</p>
        <p>🎁 Cofres abiertos: <b>${Object.keys(g.flags).filter((k) => k.includes('cofre')).length}</b></p>
        <p>🍳 Platos cocinados: <b>${st.cooked || 0}</b> · ⚒ Objetos forjados: <b>${st.crafted || 0}</b></p>
        <p>🗺 Ubicación: <b>${esc(g.W.areaName(p.tx, p.tz))}</b></p></div>`;
    }
    this.show('bit', '📖 Bitácora de viaje', `<div class="tabs">${tabs}</div><div class="tabbody">${body}</div>`, true);
  }

  // ------------------------------------------------------------------ armario de cosméticos
  openWardrobe(slot = 'cosBody') {
    const g = this.g, p = g.player;
    this.wslot = slot;
    const tabs = COS_SLOTS.map((c) => `<button class="tab ${slot === c.id ? 'on' : ''}" data-p="cosslot" data-slot="${c.id}">${c.icon} ${c.name}</button>`).join('');
    const all = Object.entries(EQUIP).filter(([, e]) => e.cos && e.slot === slot);
    const own = all.filter(([id]) => g.ownCos(id));
    const SRC = { gremio: '🎟 Gremio (Oficios)', tienda: '🪙 Sastre Selim', evento: '🎉 Eventos y pesca', dragon: '🐉 Ignaros (Isla Ceniza)', serafin: '😇 Azrael (Isla Calavera)', leviatan: '🐙 Leviatán Abisal' };
    const cards = all.map(([id, e]) => {
      const it = ITEMS[id], has = g.ownCos(id);
      return `<button class="cosbtn ${p.equip[slot] === id ? 'on' : ''} ${has ? '' : 'no'}" ${has ? `data-p="cos" data-id="${id}"` : ''}><span class="t${e.tier}">${it.icon} ${esc(it.name)}</span><br><small class="muted">${has ? (p.equip[slot] === id ? '✔ Puesto' : 'Tocar para ponerlo') : SRC[e.src] || 'Botín'}</small></button>`;
    }).join('');
    this.show('ward', `👕 Armario (${(g.wardrobe || []).length} prendas)`, `<div class="tabs">${tabs}</div><p class="muted small">Los cosméticos se guardan aquí para siempre y se ven encima de tu armadura sin cambiar tus estadísticas. Tienes ${own.length}/${all.length} de esta ranura.</p>
      <button class="pbtn" data-p="cosoff">Quitar ${esc(COS_SLOTS.find((c) => c.id === slot).name.toLowerCase())}</button><div class="cosgrid">${cards}</div>`, true);
  }
  // ------------------------------------------------------------------ camarote del barco
  openDecor() {
    const g = this.g, p = g.player;
    const rows = DECOR.filter((d) => !d.premium || g.flags.furn).map((d) => `<div class="rec"><span class="rname">${esc(d.name)}</span><span class="small">${d.price} oro</span><button class="pbtn" data-p="decor" data-id="${d.t}" ${p.gold >= d.price ? '' : 'disabled'}>Colocar</button></div>`).join('');
    this.show('decor', `🪑 Decorar «${esc(g.shipName())}»`, `<p class="muted small">El mueble se coloca en la casilla a la que miras. Es tu casa en el mar: amplía el barco con Marga para tener un camarote más grande. Acércate a un mueble y pulsa 🪑 para guardarlo.${g.flags.furn ? '' : ' Bruno el carpintero vende un catálogo de muebles de lujo.'}</p>${rows}`, true);
  }
  openStash(items) {
    const g = this.g, p = g.player;
    const clan = g.net.active && g.clan;
    const inChest = Object.entries(items || {}).filter(([, n]) => n > 0).map(([id, n]) => `<div class="rec"><span class="rname">${ITEMS[id] ? ITEMS[id].icon + ' ' + esc(ITEMS[id].name) : esc(id)} ×${n}</span><button class="pbtn small" data-p="stash" data-id="${id}" data-n="1" data-d="take">Sacar 1</button><button class="pbtn small" data-p="stash" data-id="${id}" data-n="${n}" data-d="take">Todo</button></div>`).join('');
    const mine = Object.entries(p.inv).filter(([id, n]) => n > 0 && ITEMS[id] && id !== 'mapa_tesoro').map(([id, n]) => `<div class="rec"><span class="rname">${ITEMS[id].icon} ${esc(ITEMS[id].name)} ×${n}</span><button class="pbtn small" data-p="stash" data-id="${id}" data-n="1" data-d="put">Guardar 1</button><button class="pbtn small" data-p="stash" data-id="${id}" data-n="${n}" data-d="put">Todo</button></div>`).join('');
    this.show('stash', clan ? `📦 Cofre del clan «${esc(g.clan.name)}»` : '📦 Tu cofre', `<div class="sub">En el cofre</div>${inChest || '<p class="muted">Vacío.</p>'}<div class="sub">Tu mochila</div>${mine}`, true);
  }
  openMarket(list) {
    const g = this.g, p = g.player, me = g.net.myId;
    const rows = (list || []).map((o) => `<div class="mkrow"><span>${ITEMS[o.item] ? ITEMS[o.item].icon + ' ' + esc(ITEMS[o.item].name) : esc(o.item)} ×${o.n}</span><span class="muted">${esc(o.name)}</span><span>🪙 ${o.price}</span>${o.seller === me ? `<button class="pbtn small" data-p="mkbuy" data-id="${o.id}">Retirar</button>` : `<button class="pbtn small" data-p="mkbuy" data-id="${o.id}" ${p.gold >= o.price ? '' : 'disabled'}>Comprar</button>`}</div>`).join('');
    const opts = Object.entries(p.inv).filter(([id, n]) => n > 0 && ITEMS[id] && !['mapa_tesoro'].includes(id)).map(([id, n]) => `<option value="${id}">${ITEMS[id].icon} ${esc(ITEMS[id].name)} (${n})</option>`).join('');
    this.show('market', '🏪 Mercado entre jugadores', `<p class="muted small">Vende y compra objetos a otros jugadores de la partida. El anfitrión guarda las ofertas. Tienes ${p.gold} oro.</p>
      <div class="mkform"><select id="mkItem">${opts}</select><input id="mkN" type="number" min="1" value="1" style="width:60px"><input id="mkP" type="number" min="1" value="50" style="width:80px"><button class="pbtn" data-p="mkpost">Poner a la venta</button></div>
      <div class="sub">Ofertas</div>${rows || '<p class="muted">No hay ofertas todavía.</p>'}`, true);
  }
  oficiosHtml() {
    const g = this.g, p = g.player;
    const jobs = Object.entries(JOBS).map(([id, j]) => {
      const J = g.job(id), need = 20 + J.l * 18;
      return `<div class="jobrow"><b style="width:120px">${j.icon} ${j.name}</b><span style="width:52px">Nv. ${J.l}/${JOB_MAX}</span><div class="jobbar"><i style="width:${J.l >= JOB_MAX ? 100 : Math.round((J.xp / need) * 100)}%"></i></div><span class="muted small" style="width:150px">${j.perk}</span></div>`;
    }).join('');
    const cons = g.contracts().map((c, i) => {
      const prog = c.k === 'gather' ? `${Math.min(p.inv[c.target] || 0, c.n)}/${c.n}` : `${c.p}/${c.n}`;
      return `<div class="rec"><span class="rname">${c.done ? '✔ ' : ''}${esc(c.txt)}</span><span class="small">${prog} · ${c.gold} oro · ${c.tok} 🎟</span>${c.done ? '<span class="muted small">Hecho</span>' : `<button class="pbtn" data-p="claim" data-i="${i}" ${g.contractReady(c) ? '' : 'disabled'}>Entregar</button>`}</div>`;
    }).join('');
    const shop = Object.entries(EQUIP).filter(([, e]) => e.cos && e.src === 'gremio').map(([id, e]) => {
      const c = g.cosPrice(id), has = g.ownCos(id);
      return `<div class="rec"><span class="rname t${e.tier}">${ITEMS[id].icon} ${esc(ITEMS[id].name)}</span><span class="small">${c.tok} 🎟</span>${has ? '<span class="muted small">✔ Tuyo</span>' : `<button class="pbtn" data-p="guild" data-id="${id}" ${(p.inv.ficha || 0) >= c.tok ? '' : 'disabled'}>Cambiar</button>`}</div>`;
    }).join('');
    return `<p>Bonus de daño por oficios: <b>+${((g.jobDmg() - 1) * 100).toFixed(1)}%</b> (0,5% por cada nivel de cada oficio). Fichas de gremio: <b>${p.inv.ficha || 0} 🎟</b></p>${jobs}
      <div class="sub">🛠 Tablón de trabajos de hoy (día ${g.day + 1})</div>${cons}
      <div class="sub">🎟 Tienda del gremio</div>${shop}`;
  }
  mapsHtml() {
    const g = this.g;
    const NAMES = { main: 'Isla Bruma', tortuga: 'Isla Tortuga', calavera: 'Isla Calavera', duna: 'Isla Duna', selva: 'Isla Selva', bastion: 'Bastión de la Marina', ceniza: 'Isla Ceniza' };
    const list = (g.tmaps || []).map((m, i) => `<div class="tmap"><img src="${g.mapCanvas(m)}" alt=""><div><b>Mapa ${i + 1}</b><p>${esc(m.clue)}</p><p>${m.known ? `📍 Isla: <b>${NAMES[m.isle]}</b>. Busca la X y pulsa ⛏️ Cavar encima.` : '❔ Isla desconocida: compara la forma de la costa o visita islas.'}</p>${m.known ? '' : `<button class="pbtn small" data-p="mapclue" data-i="${i}">🔍 Descifrar con 1 ficha</button>`}</div></div>`).join('');
    return `<p class="muted small">Los mapas salen de cofres, enemigos, la pesca, la cripta y los piratas famosos. Cada uno dibuja el terreno alrededor del tesoro: reconoce la isla, llega a la X y cava. Al pisar la isla correcta, el mapa se descifra solo.</p>${list || '<p class="muted">Aún no tienes mapas del tesoro.</p>'}`;
  }
  vidaHtml() {
    const g = this.g, p = g.player, st = g.stats;
    const own = g.ownPets || [];
    const pets = Object.entries(PETS).map(([id, d]) => {
      const has = own.includes(id);
      const btn = has ? (g.petType === id ? '<span class="muted small">✔ Contigo</span>' : `<button class="pbtn small" data-p="pet" data-id="${id}">Llevar</button>`) : id === 'dragon' ? `<button class="pbtn small" data-p="hatch">🥚 Hacer nacer (${p.inv.huevo_dragon || 0} huevos)</button>` : `<span class="muted small">${esc(d.where)} · ${d.price} oro</span>`;
      return `<div class="rec"><span class="rname">${d.icon} ${esc(d.name)}${has && g.petType === id ? ` · Nv. ${g.petLevel()}` : ''}</span><span class="small muted">${esc(d.perk)}</span>${btn}</div>`;
    }).join('');
    const mounts = Object.entries(MOUNTS).map(([id, d]) => `<div class="rec"><span class="rname">${d.icon} ${esc(d.name)}</span><span class="small muted">x${d.speed} de velocidad · ${(g.ownMounts || []).includes(id) ? '✔ tuya' : d.price + ' oro'}</span></div>`).join('');
    const flag = g.flagCfg ? `<img class="flagimg" src="${g.flagURL()}" alt="">` : '<span class="muted">sin diseñar</span>';
    const L = g.love(), pt = g.partner();
    const board = (g.raceBoard || []).map((r, i) => `<li>${i + 1}. ${esc(r.name)} — ${r.t}s</li>`).join('');
    return `<div class="sub">🐴 Monturas (botón 🐴 o tecla K)</div>${mounts}<p class="muted small">Caballo: Lucía (granja) · Camello: Zaid (Oasis de Sal) · Salamandra de lava: Brasa (Isla Ceniza).</p><div class="sub">🐾 Mascotas</div>${pets}${g.petType ? '<button class="pbtn small" data-p="pet" data-id="">Dejar a la mascota en casa</button>' : ''}
      <div class="sub">🏴 Bandera de tu tripulación</div><div class="rec">${flag}<button class="pbtn" data-p="flag">Diseñar</button></div>
      <div class="sub">💞 Pareja</div><p>${pt ? `${esc(pt.name)} · citas ${Object.keys(L.dates).length}/5${g.soc(pt.id).married ? ' · 💒 casados (+10% daño y defensa juntos)' : ''}` : g.spouseP ? `💒 Casado/a con ${esc(g.spouseP)} (otro jugador)` : 'Sin pareja todavía.'}</p>
      <div class="sub">🏆 Hazañas</div><p>🏁 Mejor regata: <b>${st.raceBest ? st.raceBest + ' s' : '—'}</b> · ⚔️ Torneos ganados: <b>${st.tourneys || 0}</b> · 🕯️ Criptas superadas: <b>${st.dungeons || 0}</b> · 💰 Tesoros: <b>${st.treasures || 0}</b> · 🏠 Casa: <b>${g.flags.house ? 'sí' : 'no'}</b></p>
      ${board ? `<div class="sub">🏁 Mejores tiempos de regata</div><ul class="qlist">${board}</ul>` : ''}`;
  }
  // ------------------------------------------------------------------ construcción
  openBuild() {
    const g = this.g, p = g.player;
    const rows = Object.entries(STRUCTS).map(([id, d]) => {
      const cost = Object.entries(d.cost).map(([k, v]) => `${v} ${ITEMS[k] ? ITEMS[k].icon : k}`).join(' · ');
      const ok = Object.entries(d.cost).every(([k, v]) => (p.inv[k] || 0) >= v);
      return `<div class="rec"><span class="rname">${d.icon} ${esc(d.name)}</span><span class="muted small">${esc(d.desc)} · Vida ${d.hp}</span><span class="small">${cost}</span><button class="pbtn" data-p="build" data-id="${id}" ${ok ? '' : 'disabled'}>Construir</button></div>`;
    }).join('');
    this.show('build', '🔨 Construir (2×2 casillas)', `<p class="muted small">Se coloca delante de ti en un hueco libre de 4 casillas. Las torres y cañones disparan a los enemigos; los asaltantes pueden destruir lo que construyas. Acércate a una estructura y pulsa 🔨 para repararla, reforzarla o desmontarla. Para proteger un pueblo, habla con su líder (Marisol, Nerea, Mara, Zaid, Ixa, Lucas, Lucía) y dale materiales.</p>${rows}`, true);
  }
  // ------------------------------------------------------------------ carteles de Se busca
  openPosters(sel) {
    const g = this.g;
    const list = g.wantedList();
    const fmt = (n) => n.toLocaleString('es');
    const cards = list.map((w, i) => `<button class="wanted ${w.me ? 'me' : ''} ${w.down ? 'down' : ''}" data-p="poster" data-i="${i}">
        <div class="wt">SE BUSCA</div><img src="${g.portrait(w.key, w.look)}" alt=""><div class="wv">VIVO O MUERTO</div>
        <div class="wn">${esc(w.name)}</div><div class="wb">🪙 ${fmt(w.bounty)}</div><div class="wm">${w.me && g.flagCfg ? `<img class="wflag" src="${g.flagURL()}" alt="">` : ''}MARINA</div></button>`).join('');
    let det = '<p class="muted small">Toca un cartel para ver más. Los piratas famosos viajan entre islas, cazan monstruos y su recompensa sube. Acércate a uno y pulsa ⚔️ Retar.</p>';
    if (sel !== undefined && list[sel]) {
      const w = list[sel];
      det = `<div class="parch"><b>${esc(w.name)}</b> «${esc(w.ep)}» · Nivel ${w.lvl} · Recompensa ${fmt(w.bounty)} oro<br>${w.me ? 'Este eres tú. Cada victoria hace crecer tu leyenda.' : w.down ? 'Malherido (o en prisión): no se le ha visto en un tiempo.' : `Visto por última vez: <b>${esc(w.where)}</b>.`}</div>`;
    }
    this.show('wanted', '📜 Tablón de Se busca', `${det}<div class="wgrid">${cards}</div>`, true);
  }
  sideHtml() {
    const g = this.g;
    const rows = Object.entries(SIDE_QUESTS).map(([id, q]) => {
      const st = g.side[id];
      const n = g.npcById(id);
      const who = n ? n.name : id;
      if (!st) return g.soc(id).met ? `<li class="muted">❔ ${esc(who)} tiene un encargo para ti</li>` : '';
      if (st.s === 2) return `<li>✔ ${esc(q.title)} <span class="muted">(${esc(who)})</span></li>`;
      return `<li>📜 <b>${esc(q.title)}</b> — ${esc(q.desc)} <span class="prog">${g.sideDone(id) ? '✔ vuelve con ' + esc(who) : g.sideProgressText(id)}</span></li>`;
    }).join('');
    return `<ul class="qlist">${rows || '<li class="muted">Habla con la gente de las islas nuevas para recibir encargos.</li>'}</ul>`;
  }
  bestiaryHtml() {
    const g = this.g, D = g.ENEMY_DEF, st = g.stats;
    const ICON = { serafin: '😇', dragon: '🐉', wolf: '🐺', boar: '🐗', crab: '🦀', skeleton: '💀', boss: '☠️', scorpion: '🦂', tiger: '🐅', bat: '🦇', golem: '🗿', golem_obs: '🌋', skull: '🔥', marine: '⚓', pirate: '🏴‍☠️', marine_boss: '🎖️', golem_boss: '👹' };
    const where = {};
    for (const e of g.enemies.slice(0, g.baseEnemies)) {
      const w = where[e.type] || (where[e.type] = { min: 999, max: 0, zones: new Set() });
      w.min = Math.min(w.min, e.lvlRange[0]); w.max = Math.max(w.max, e.lvlRange[1]);
      const a = e.spawnDef.area;
      w.zones.add(g.W.areaName(Math.round((a[0] + a[2]) / 2), Math.round((a[1] + a[3]) / 2)));
    }
    const card = (icon, name, info, drops, kills) => `<div class="bcard ${kills ? '' : 'unk'}"><div class="bic">${icon}</div><div class="binfo"><b>${esc(name)}</b><small>${info}</small><small class="muted">${drops}</small></div><div class="bk">${kills}<small>vencidos</small></div></div>`;
    const list = Object.keys(ICON).map((t) => {
      const w = where[t];
      const kills = st['k_' + t] || 0;
      const drops = (DROPS[t] || []).map(([id]) => ITEMS[id] ? ITEMS[id].icon + ' ' + ITEMS[id].name : id).filter((v, i, a) => a.indexOf(v) === i).join(', ') || '—';
      const info = (w ? `Nv. ${w.min}${w.max !== w.min ? '–' + w.max : ''} · ${[...w.zones].join(', ')}` : '') + (D[t].boss ? ' · JEFE' : '') + (D[t].neutral ? ' · neutral si no te buscan' : '');
      return card(ICON[t], D[t].name, info, 'Botín: ' + drops, kills);
    });
    list.push(card('🐙', 'Leviatán Abisal', 'SUPERJEFE · Aguas profundas (nivel 35+) · atrapa tu barco y lucha toda la tripulación', 'Botín: Escamas del Abismo, Corona del Abismo, perlas', st.k_leviathan || 0));
    list.push(card('🐍', 'Serpiente marina', 'Aguas profundas, lejos de las islas · se combate con cañones', 'Botín: 🐚 Escamas, ⚪ Perlas', st.k_serpent || 0));
    list.push(card('⛵', 'Fragata de la Marina', 'Mar abierto · aparece si tienes recompensa', 'Botín: 🧨 Pólvora, 🥈 Plata', st.s_marine || 0));
    list.push(card('🏴‍☠️', 'Barco pirata rival', 'Mar abierto · te aborda si se acerca', 'Botín: 🧨 Pólvora, 🥇 Oro', st.s_pirate || 0));
    return `<p class="muted small">Todas las criaturas del Mar de Bruma. Toca a un enemigo y pulsa ⚔️ para atacar.</p><div class="bgrid">${list.join('')}</div>`;
  }
  armoryHtml() {
    const g = this.g, p = g.player;
    const crafted = new Set(RECIPES.map((r) => r.out));
    const dropped = new Set(Object.values(DROPS).flat().map(([id]) => id));
    const own = (id) => (p.inv[id] || 0) > 0 || Object.values(p.equip).includes(id);
    const groups = [...SLOTS, ...COS_SLOTS].map((s) => {
      const items = Object.entries(EQUIP).filter(([, e]) => e.slot === s.id).sort((a, b) => (a[1].tier || 0) - (b[1].tier || 0));
      if (!items.length) return '';
      const rows = items.map(([id, e]) => {
        const it = ITEMS[id];
        const stats = [e.atk ? `⚔${e.atk}` : '', e.def ? `🛡${e.def}` : '', e.hp ? `❤${e.hp}` : ''].filter(Boolean).join(' ') || (e.cos ? 'cosmético' : '');
        const how = crafted.has(id) ? (RECIPES.find((r) => r.out === id).station === 'banco' ? '🪚 Banco' : '⚒ Forja') : dropped.has(id) ? '💀 Botín' : '🪙 Tienda / recompensa';
        return `<div class="arow ${own(id) ? 'own' : ''}"><span class="t${e.tier || 0}">${it.icon} ${esc(it.name)}</span><span>${stats}</span><span class="muted">${how}</span><span>${own(id) ? '✔' : ''}</span></div>`;
      }).join('');
      return `<div class="sub">${s.icon} ${esc(s.name)}</div>${rows}`;
    }).join('');
    return `<p class="muted small">Niveles: ${TIER_NAMES.map((n, i) => `<span class="t${i}">${n}</span>`).join(' · ')}. ✔ = lo tienes.</p>${groups}`;
  }

  // ------------------------------------------------------------------ guía
  openGuide() {
    const sec = [
      ['🕹️ Moverse', 'Toca el suelo y tu personaje irá por la cuadrícula. También puedes usar el joystick. En PC: WASD o flechas.'],
      ['🏃 Correr y estamina', 'Pulsa el botón de correr (o Shift). Correr y atacar gastan estamina (barra amarilla). Se recupera al caminar o descansar. ¡Los enemigos te persiguen y atacan aunque te muevas!'],
      ['⚔️ Combate', 'Solo atacas cuando pulsas el botón ⚔️ (mantenlo pulsado para seguir atacando). Funciona andando o corriendo con el joystick: golpea al enemigo más cercano a tu alcance o da un tajo al aire. Tocar a un enemigo lo selecciona. Sin estamina pegas la mitad.'],
      ['🛠 Oficios y trabajos', 'Leñador, minero, pescador, cocinero, herrero, cazador, marinero, constructor y granjero suben al hacer su trabajo (máx. 30). Cada nivel de cada oficio da +1% de daño, +0,3% de vida y una ventaja propia. En los niveles 10, 20 y 30 hay hitos con oro, fichas y ropa. En Bitácora › Oficios hay 4 trabajos nuevos cada día que pagan el doble que antes.'],
      ['⚡ Atajos', 'El botón ⚡ Atajos de la derecha abre la Mochila, la Bitácora, Online, Construir, la Guía, Meditar y el modo Foto. Así la pantalla queda despejada.'],
      ['🌍 Novedades', 'Todo lo nuevo está en Bitácora › Novedades: islas, Armamento Espiritual, gruta, Velaria, acuario, contratos y ranking.'],
      ['🖤 Armamento Espiritual', 'Al nivel 100, el Maestro Ishvar (Monasterio del Pico, Isla Escarcha) despierta tu Armamento Espiritual por 20000 oro: +20% de daño y +5% de resistencia. Mejora al golpear (hasta nivel 50). Al atacar, tus manos y tu arma se cubren de energía negra; al nivel 30 también el torso.'],
      ['🖤 Enemigos con Armamento', 'Los enemigos fuertes (nivel 90+, yetis, autómatas, soldados galleta, piratas famosos de nivel 70+ y jefes) también lo usan: se cubren de negro unos segundos (🖤 en su nombre), pegan +20% y reciben un 40% menos de daño. Con tu propio Armamento Espiritual lo compensas: desde el nivel 25 les haces el daño completo.'],
      ['🏝 Islas nuevas', 'Isla Escarcha (nieve, noreste lejano), Isla Engranaje (inventores, este lejano), Isla Merengue (dulces, suroeste) y Archipiélago Burbuja (manglares, noroeste). Cada una cambia el cielo y el ambiente. Cristal de escarcha → equipo Escarcha; meteorito → equipo Estelar, el mejor del juego.'],
      ['🚣 Gruta y Velaria', 'Navega cerca de los puntos azules del minimapa y pulsa «Gruta» para entrar remando a la Gruta de los Cristales. El punto morado es Velaria, la ciudad flotante de mercaderes: cambia de lugar cada semana.'],
      ['🎣 Pesca con minijuego', 'Cuando pica un pez, mantén pulsada la barra (o Espacio) para que la zona verde siga al pez hasta llenar el medidor. Hay atunes, peces espada, peces luna y el legendario pez dorado. Tu colección está en Novedades.'],
      ['🧙 Vudú y capturas', 'La Bruja Mambé (Aldea Liana) vende hechizos: se lanzan desde la Mochila. Ferro y Mara dan contratos para capturar vivos a piratas famosos: déjalos por debajo del 15% de vida y pulsa «Capturar».'],
      ['👑 Jefes de las islas', 'Reina de Hielo Glacia (Isla Escarcha, junto al castillo de hielo), Gran Autómata Ferrum (Isla Engranaje) y Rey Pastel Bizcochón (Isla Merengue). Usan Armamento Espiritual, ataques en área y llaman refuerzos a media vida. Sueltan coronas y capas únicas.'],
      ['🛷 Trineo y globos', 'La Herrera Helga vende el trineo de perros (5000 oro): corre más sobre la nieve. Cerca de Isla Engranaje te atacan fragatas de globo que lanzan bombas; derríbalas con los cañones.'],
      ['🏆 Torneo de pesca', 'Cada 7 días el Pescador Gaspar organiza un torneo. Inscríbete, pesca hasta medianoche y al día siguiente recoge tu premio.'],
      ['🖤 Puño espiritual', 'Con el Armamento Espiritual a nivel 40 aparece el botón 🖤 junto a las habilidades: un puño de energía negra que vuela 8 casillas. A nivel 50 es el Puño del Rey: aturde y atraviesa el Armamento de los enemigos.'],
      ['🌋 Isla Naciente', 'Durante la erupción nace una isla al oeste de Isla Ceniza con monstruos de lava y un cofre de obsidiana. Desaparece cuando el volcán se calma.'],
      ['⛓️ Prisión de la Marina', 'Si la Marina te derrota puede llevarse a un tripulante a la celda del Bastión. Ve allí, pulsa «Liberar» y vence a los carceleros.'],
      ['🌦 Clima de cada isla', 'Ventisca en Escarcha, lluvia de azúcar en Merengue, marea de pompas en Burbuja y nubes de vapor en Engranaje.'],
      ['🎯 Día de la caza', 'En multijugador, el ranking de recompensas está en Novedades. El anfitrión puede iniciar el Día de la caza: el más buscado debe sobrevivir 5 minutos en PvP y los demás intentan cazarlo.'],
      ['🎣 Pesca', 'Junto al agua pulsa 🎣 Pescar y quédate quieto: peces, perlas, bolsas de oro y, con suerte, un baúl con ropa.'],
      ['👕 Armario', 'Los cosméticos se guardan en tu armario (toca una ranura de Aspecto en la mochila). Hay más de 50: tienda de Selim, gremio, eventos, pesca y superjefes.'],
      ['👹 Superjefes', 'Azrael, el Serafín Caído (Isla Calavera) e Ignaros, el Dragón Rey (Isla Ceniza), son de nivel 101 y sueltan sus armaduras cosméticas. En aguas profundas, el Leviatán Abisal puede atrapar tu barco: toda la tripulación lucha en cubierta. Los jefes ganan vida según cuántos aliados luchan, y con muchos tripulantes cada uno pega algo menos, para que 3 o 10 sea justo.'],
      ['🚢 Barcos', 'Marga vende balandra (rápida), bergantín y galeón (enorme). Decora velas, casco, bandera y mascarón, y ponle nombre. Junto al mar pulsa 📯 para llamar a tu barco, y navegando puedes desembarcar en cualquier costa. En la bodega pulsa 🪑 Decorar para amueblar tu camarote.'],
      ['🎉 Eventos', 'De vez en cuando: festival en Villarroca (rebajas y baile), lluvia de estrellas (+50% XP), mercader errante con ropa rara, invasión de esqueletos de noche y tesoros a la deriva en el mar.'],
      ['🔔 Ciudad de Coralia', 'Marga vende la campana de buceo. En alta mar, desde ⚙️ Barco, bajas a la ciudad hundida: tritones, medusas gigantes, la Reina Abisal Nerissa y 5 cofres que se rellenan cada día. Vigila la barra de aire 🫧 y vuelve a la campana para subir.'],
      ['🌾 Granja', 'Construye huertos, un gallinero y un establo junto a tu casa. Planta semillas de Lucía (trigo, zanahoria, calabaza), riégalas (la lluvia también) y cosecha. Las gallinas ponen huevos y la vaca da leche; si les das trigo, el doble. Hay recetas nuevas: tortilla, tarta de calabaza, guiso, batido y almejas.'],
      ['🏪 Mercado', 'En multijugador, Ilyas o el panel 👥 Online abren el mercado: pon objetos a la venta con tu precio y compra lo que venden los demás.'],
      ['📖 Historias', 'Cada tripulante tiene su pasado y una misión personal (habla con él o ella con bastante amistad). Al completarla se vuelve leal: +25% de daño y te da un regalo.'],
      ['🛡️ Parada y combos', 'Mantén 🛡️ Parar (o B) para bloquear (recibes un 40% del daño). Si lo pulsas justo antes del golpe haces una PARADA perfecta: no recibes daño, aturdes al enemigo y tu siguiente golpe hace el doble. Cada tercer golpe seguido es un Remate (x1,8).'],
      ['🌊 Mareas', 'La marea sube y baja dos veces al día (🌊↓ en el reloj = marea baja). Con marea baja aparece un bajío al este de Isla Tortuga que lleva a la Roca de la Marea, con su cofre, y salen almejas para recoger.'],
      ['📷 Modo foto', 'En el menú: oculta la interfaz, elige pose, marco (madera, pergamino, Se busca, instantánea) y filtro, acerca o aleja y pulsa 📸. En el móvil se guarda en la galería (Imágenes › Bruma).'],
      ['🐴 Monturas', 'Caballo (Lucía, granja), camello (Zaid, Oasis de Sal) y salamandra de lava (Brasa, Isla Ceniza). Pulsa 🐴 (o K) para montar: vas mucho más rápido y apenas gastas estamina. Te bajas solo al entrar en casas, nadar o embarcar.'],
      ['🌫️ Isla Espectral', 'Con niebla (o de madrugada, de 0:00 a 4:00) aparece al suroeste una isla que no está en los mapas, con el Capitán Espectro Valdrak (nivel 85) y ropa espectral única. Llega en barco y desembarca en su costa.'],
      ['🏴 Clanes', 'En multijugador, funda un clan (👥 Online): todos llevan su nombre y la bandera del fundador. El cofre de vuestras casas es común (lo guarda el anfitrión).'],
      ['🎵 Música', 'Cada zona tiene su música (pueblo, taberna, mar, selva, desierto, volcán, cripta, isla espectral, combate) y sonidos de olas y lluvia. Se quita en el menú.'],
      ['🏆 Logros', '25 logros con títulos que salen encima de tu nombre (y los ven los demás jugadores). Elige tu título en Bitácora › Logros.'],
      ['🏠 Casas y muebles', 'Lope vende la casa de la plaza, la casa de la playa y la mansión. Todas tienen cama y cofre. Bruno vende un catálogo de muebles de lujo (sofá, piano, trono, acuario...).'],
      ['🎓 Puestos', 'En Bitácora › Tripulación da un puesto a cada tripulante: cocinero, artillero, médico, navegante o carpintero. Cada uno mejora el barco o te cura.'],
      ['⚔️ PvP naval', 'En multijugador con PvP activado, tus cañones dañan los barcos de otros jugadores. El anfitrión puede iniciar Captura la bandera: recoge la bandera en el mar y llévala a Puerto Salitre; si te hunden, la sueltas.'],
      ['🐾 Mascotas', 'Loro y mono (Mara, Isla Tortuga), gato (Coral, La Sirena Tuerta) y cría de dragón (huevo de Ignaros o del tesoro, o 30 fichas). Te siguen, ayudan en combate, suben de nivel y cada una tiene su ventaja. Elige cuál llevar en Bitácora › Vida.'],
      ['🕯️ Cripta de la Bruma', 'Entradas en la cueva de los murciélagos (Isla Selva) y en el templo de arena (Isla Duna). 4 salas: limpia cada una para que se abra la reja. Al final, el Rey de la Cripta. En multijugador entráis juntos: hay más enemigos y el tesoro es para todos.'],
      ['🏁 Regata y ⚔️ torneo', 'Nerea organiza una regata alrededor de Isla Bruma: pasa por las 8 boyas y vuelve a la verde (oro, plata o bronce). Marisol organiza un torneo diario de 3 duelos en la plaza. Las regatas de otros jugadores aparecen en tu tabla.'],
      ['🏠 Casa', 'El Escribano Lope vende la casa de la plaza (6000 oro). Dentro puedes dormir (cura y +10% de experiencia) y decorarla con 🪑 como el camarote.'],
      ['🏴 Bandera', 'Diseña la bandera de tu tripulación (Marga o Bitácora › Vida): sale en tu barco, en tu cartel de Se busca y en el barco que ven los demás jugadores.'],
      ['💌 Citas y boda', 'Con pareja tienes 5 citas: cena en la taberna, atardecer en la playa de la mano, regalo especial, baile de noche y paseo en barco. Con 3 citas y un Anillo de compromiso (forja) os casáis en la plaza: ropa de boda y +10% de daño y defensa cuando estáis juntos. En multijugador puedes casarte con otro jugador.'],
      ['🗺️ Mapas del tesoro', 'Cada mapa dibuja el terreno alrededor de una X. Reconoce la isla, ve allí y pulsa ⛏️ Cavar.'],
      ['☠ Barcos de famosos', 'Los piratas famosos también navegan: si te encuentran, te atacan con su barco. Húndelo para que huya, o abórdalo y vence al famoso en su cubierta.'],
      ['🎯 Botones', 'El botón grande ⚔️ siempre ataca (navegando dispara los cañones). El botón azul de al lado sirve para hablar, abrir, talar, entrar, mirar carteles, retar a piratas... Así puedes pelear aunque tu pareja o tu tripulación estén pegados a ti.'],
      ['✨ Clases y habilidades', 'Tu clase depende del arma: espada = Espadachín, hacha = Bárbaro, lanza o tridente = Lancero. Cada clase tiene 5 habilidades (barra encima del botón de ataque) que se desbloquean en los niveles 2, 6, 12, 20 y 30. Gastan estamina y tienen recarga.'],
      ['🧘 Meditar', 'Pulsa 🧘 fuera de combate y quédate quieto 3 segundos: ganas Concentración (más daño, más defensa y regeneración) durante 90 s. Se recarga en 2 minutos.'],
      ['🏴‍☠️ Bando', 'Al crear tu personaje eliges Pirata o Marina. Pirata: tu recompensa nunca se borra y la Marina te caza. Marina: los marines son tus aliados, subes de rango cazando piratas y los piratas atacan tus pueblos y tu barco.'],
      ['☠ Piratas famosos', 'Hay 16 piratas famosos (10 leyendas muy fuertes) que viajan de isla en isla, cazan monstruos y ven subir su recompensa. Mira los tablones de Se busca de los pueblos o tabernas (o la Bitácora) para ver su cara, su recompensa y dónde los vieron. Acércate y pulsa Retar: combaten con combos, esquivas, bloqueos y golpes especiales.'],
      ['⚓ Tripulación activa', 'Solo 3 tripulantes te acompañan a la vez; los demás esperan en el barco y suben a cubierta al zarpar. Desde la Bitácora puedes dejarlos recolectando en una isla. Tu tripulación y tu pareja suben de nivel hasta 100. Navegando, en ⚙️ Barco puedes poner un timonel que explora y combate solo, pasear por la cubierta o bajar a la bodega (que crece al ampliar el barco).'],
      ['🌦️ Clima y estaciones', 'Hay primavera, verano, otoño e invierno (cada 3 días). Puede llover, haber tormenta con rayos, niebla o nieve en invierno. Por la noche la gente se va a dormir a casa y al atardecer algunos van a la taberna; con lluvia, muchos se refugian.'],
      ['🔨 Construir', 'Botón 🔨: empalizadas, muros, torres de vigía, cañones, fogatas, tiendas y huertos de 2×2 casillas con tus materiales. Los líderes de los pueblos aceptan materiales para levantar defensas que los asaltantes intentarán destruir; tú puedes repararlas y reforzarlas.'],
      ['💗 Pareja', 'Con tu pareja puedes besaros, abrazaros, bailar juntos, pasear de la mano o llevarla en brazos.'],
      ['🗺️ Islas del Mar de Bruma', 'Oeste: Isla Duna (desierto, Oasis de Sal, ámbar). Norte: Isla Selva (Aldea Liana, jade, tigres y murciélagos). Sur: Bastión de la Marina y Villa Grillete. Sureste lejano: Isla Ceniza (volcán, obsidiana, gólems). Cada isla tiene sus encargos y su historia.'],
      ['💣 Combate naval', 'Navegando, pulsa 💣 Cañones (tecla F) para disparar por las bandas hacia el enemigo más cercano. Los barcos de la Marina y los piratas te disparan y pueden abordarte. Si te acercas a uno, pulsa 🪝 Abordar y lucha en su cubierta con tu tripulación. Si tu barco llega a 0 se hunde.'],
      ['⚓ Astillero', 'La Astillera Marga, en Puerto Salitre, repara tu barco y lo mejora: casco (más vida), cañones (más daño y recarga), velas (más velocidad) y ampliación (barco más grande, más cañones y más tripulación). El barco se repara despacio atracado.'],
      ['☠ Recompensa', 'Cada enemigo que vences sube tu recompensa (☠ en el panel). A partir de 300 la Marina te ataca al verte, pregunta por ti en los pueblos, desembarca para buscarte (los vecinos te defienden) y manda fragatas. El Teniente Ferro de Villa Grillete acepta sobornos...'],
      ['👕 Cosméticos', 'En la mochila hay 3 ranuras de Aspecto (sombrero, ropa y capa). Se ven por encima de la armadura, pero tu armadura sigue contando. Se compran al Sastre Selim (Oasis de Sal) o caen de enemigos (capa de lobo, de tigre...).'],
      ['🐾 Bestiario y armería', 'En la Bitácora verás todos los enemigos (zona, nivel, botín y cuántos has vencido) y todas las armas y armaduras (cómo se consiguen y cuáles tienes).'],
      ['🎒 Mochila y equipo', 'Abre la mochila: toca un objeto para equiparlo, comerlo o beberlo. Toca una ranura para quitarte esa pieza. Todo lo que equipas se ve en tu personaje.'],
      ['⛏️ Recursos', 'Tala árboles (madera, manzanas) y pica rocas (piedra y menas). Hierro en Isla Bruma, plata en el Pedregal e Isla Tortuga, oro en la Isla Calavera, ámbar en Isla Duna, jade en Isla Selva y obsidiana en Isla Ceniza. Los animales sueltan pieles y carne.'],
      ['⚒️ Forja y banco', 'Habla con el Herrero Tadeo (o acércate a una forja) para forjar armas y armaduras de hierro, plata y oro. El Carpintero Bruno tiene el banco para objetos de madera y cuero.'],
      ['🍳 Cocina', 'Acércate a una fogata o chimenea y pulsa Cocinar. La comida cura más que nada y el guiso del capitán rellena la estamina. Cosecha trigo en la granja.'],
      ['❤ Amistad', 'Charla con la gente una vez al día, haz regalos y gana duelos. Cada NPC tiene su nivel según su isla.'],
      ['🤺 Duelos y peleas', 'Puedes retar a un NPC a duelo. Si les pegas, se defienden (y se enfadan). Nadie muere: el que llega a poca vida se rinde.'],
      ['⚓ Tripulación', 'Con 3 corazones, algunos NPCs se unen a tu tripulación (hasta 10). Te siguen, luchan, suben al barco y ganan nivel y armaduras.'],
      ['💗 Romance', 'Con 5 corazones puedes declararte. Si acepta, podréis besaros y pasear de la mano.'],
      ['⛵ Barco y bodega', 'Toca el barco en el muelle para zarpar o bajar a la bodega. Navega con el joystick o tocando el mar y atraca con ⚓. En el mar, el botón te deja bajar a la bodega.'],
      ['👥 Multijugador local', 'Botón 👥 Online: uno crea la partida y hasta 4 más se unen en la misma Wi-Fi (o la zona Wi-Fi de un móvil), buscándola o escribiendo su IP. Los enemigos son los mismos para todos; en equipo la experiencia se comparte. El anfitrión puede activar el PvP.'],
      ['📖 Bitácora', 'Ahí verás la misión principal, tus amistades, tu tripulación y tu tiempo de juego.'],
      ['💾 Partidas', 'Tienes 3 ranuras de guardado en el menú principal. El juego guarda solo.'],
    ];
    const html = sec.map(([t, d]) => `<div class="gsec"><button class="gt" data-p="guide">${t}</button><div class="gd">${d}</div></div>`).join('');
    this.show('guide', '❓ Guía de TheBruma', `<div class="guide">${html}</div>`);
  }

  // ------------------------------------------------------------------ multijugador
  openNet() {
    this.netMsg = '';
    this.show('net', '👥 Multijugador local', '<div id="netRoot"></div>', false);
    this.renderNet();
  }
  refreshNet() { if (this.open === 'net') this.renderNet(); }
  netAction(a, id) {
    const n = this.g.net, b = window.AndroidBridge;
    this.netMsg = '';
    if (a === 'host') { const r = n.host(); if (r.error) this.netMsg = r.error; }
    if (a === 'ctf') { this.close(); this.g.ctfStart(); return; }
    if (a === 'market') { this.g.openMarket(); return; }
    if (a === 'clan') { this.g.foundClan(); return this.renderNet(); }
    if (a === 'leaveClan') { this.g.leaveClan(); return this.renderNet(); }
    if (a === 'scan') {
      if (b && b.discover) {
        this.netMsg = '🔍 Buscando partidas en tu Wi-Fi…';
        window.onHostsFound = (list) => { n.hosts = list || []; this.netMsg = n.hosts.length ? '' : 'No se encontró ninguna partida. Escribe la IP del anfitrión.'; this.refreshNet(); };
        b.discover();
      } else this.netMsg = 'La búsqueda automática solo funciona en la app. Escribe la IP del anfitrión.';
    }
    if (a === 'join') n.join(id);
    if (a === 'joinIp') { const v = ($('netIp') || {}).value; if (v) { n.join(v); this.netMsg = 'Conectando…'; } }
    if (a === 'pvp') n.setPvp(!n.room.pvp);
    if (a === 'inv') n.invite(Number(id));
    if (a === 'leaveTeam') n.leaveTeam();
    if (a === 'leave') n.leave();
    this.renderNet();
  }
  renderNet() {
    const g = this.g, n = g.net, root = $('netRoot');
    if (!root) return;
    let html = '';
    if (!n.mode) {
      const hosts = (n.hosts || []).map((h) => `<button class="wbtn" data-p="net" data-a="join" data-id="${esc(h.ip)}">⚓ ${esc(h.name)} <small>(${esc(h.players)}/5 · ${esc(h.ip)})</small></button>`).join('');
      html = `<div class="parch"><p>Juega con hasta <b>5 personas</b> conectadas a la <b>misma Wi-Fi</b> (o a la zona Wi-Fi de un móvil). Cada uno usa su propio personaje.</p>
        <p class="muted small">Uno crea la partida; los demás la buscan o escriben su IP.</p></div>
        <div class="netbtns"><button class="wbtn primary" data-p="net" data-a="host">🏠 Crear partida</button><button class="wbtn" data-p="net" data-a="scan">🔍 Buscar partidas</button></div>
        ${hosts ? `<div class="sub">Partidas encontradas</div><div class="netlist">${hosts}</div>` : ''}
        <div class="sub">Unirse por IP</div>
        <div class="netip"><input id="netIp" placeholder="192.168.1.20" inputmode="decimal" autocomplete="off"><button class="wbtn" data-p="net" data-a="joinIp">Unirse</button></div>`;
    } else if (n.connecting) {
      html = `<div class="parch"><p>⏳ Conectando…</p></div><div class="netbtns"><button class="wbtn danger2" data-p="net" data-a="leave">Cancelar</button></div>`;
    } else {
      const me = n.myId;
      const myTeam = n.myTeam();
      const rows = n.room.players.map((pl) => {
        const isMe = pl.id === me;
        const team = pl.team != null && pl.team === myTeam && !isMe;
        const crew = (pl.crew || []).length;
        return `<div class="frow"><b>${isMe ? '⭐ ' : ''}${esc(pl.name)}${pl.id === 0 ? ' 🏠' : ''}</b><span class="lv">Nv. ${pl.lv}</span>
          <span class="muted small">${crew ? '⚓ ' + crew : ''}${pl.partner ? ' 💗 ' + esc(pl.partner) : ''}${pl.team != null ? ' 🤝' : ''}</span>
          ${!isMe && !team ? `<button class="pbtn small" data-p="net" data-a="inv" data-id="${pl.id}">🤝 Equipo</button>` : ''}
          ${team ? '<span class="tagteam">Tu equipo</span>' : ''}</div>
          ${crew ? `<div class="crewline muted small">Tripulación: ${esc(pl.crew.join(', '))}</div>` : ''}`;
      }).join('');
      html = `<div class="parch">${n.isHost
        ? `<p>🏠 <b>Eres el anfitrión.</b> Los demás deben unirse con esta IP:</p><p class="bigip">${(n.ips || []).map(esc).join(' · ')}</p>`
        : '<p>✅ <b>Conectado a la partida.</b></p>'}
        <p>PvP: <b>${n.room.pvp ? '⚔️ activado' : '🕊️ desactivado'}</b></p></div>
        <div class="sub">Jugadores (${n.room.players.length}/5)</div>${rows || '<p class="muted">Esperando jugadores…</p>'}
        <div class="netbtns">
          ${n.isHost ? `<button class="wbtn" data-p="net" data-a="pvp">${n.room.pvp ? '🕊️ Desactivar PvP' : '⚔️ Activar PvP'}</button>` : ''}
          ${n.isHost ? '<button class="wbtn" data-p="net" data-a="ctf">🏴 Captura la bandera (mar)</button>' : ''}
          <button class="wbtn" data-p="net" data-a="market">🏪 Mercado</button>
          ${g.clan ? `<button class="wbtn" data-p="net" data-a="leaveClan">Salir del clan «${esc(g.clan.name)}»</button>` : '<button class="wbtn" data-p="net" data-a="clan">🏴 Fundar clan</button>'}
          ${myTeam != null ? '<button class="wbtn" data-p="net" data-a="leaveTeam">Salir del equipo</button>' : ''}
          <button class="wbtn danger2" data-p="net" data-a="leave">🚪 Salir de la partida</button>
        </div>
        <p class="muted small">En equipo, la experiencia de los enemigos se comparte. Toca a otro jugador para invitarlo al equipo, al clan o pedirle matrimonio. Con PvP activado, los cañones dañan los barcos de otros jugadores. El cofre del clan está en vuestras casas y lo guarda el anfitrión.</p>`;
    }
    if (this.netMsg) html = `<div class="netmsg">${esc(this.netMsg)}</div>` + html;
    root.innerHTML = html;
  }

  // ------------------------------------------------------------------ regalos
  openGift(npc) {
    const p = this.g.player;
    this.giftTo = npc;
    const items = Object.entries(p.inv).filter(([id, n]) => n > 0 && ITEMS[id] && ITEMS[id].type !== 'equip');
    const html = items.length
      ? `<div class="bag">${items.map(([id, n]) => `<button class="cell" data-p="gift" data-id="${id}"><span>${ITEMS[id].icon}</span>${n > 1 ? `<b>${n}</b>` : ''}</button>`).join('')}</div><p class="muted small">La comida cocinada y lo que le gusta a cada persona sube más la amistad.</p>`
      : '<p class="muted">No tienes nada que regalar.</p>';
    this.show('gift', `🎁 Regalo para ${esc(npc.name)}`, html);
  }
}

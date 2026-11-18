// Actualizador: busca la última versión publicada en GitHub Releases y la instala dentro de la app.
const REPO = 'ventisca-gif/2.5-D';
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

export class Updater {
  constructor(game) {
    this.g = game;
    this.el = $('update');
    window.onUpdateProgress = (pct, st) => this.progress(pct, st);
    window.onUpdateError = (why) => this.error(why);
  }
  current() {
    const b = window.AndroidBridge;
    const code = b && b.getVersionCode ? Number(b.getVersionCode()) : (typeof __VERSION_CODE__ !== 'undefined' ? __VERSION_CODE__ : 0);
    const name = b && b.getVersionName ? b.getVersionName() : (typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '?');
    return { code, name };
  }
  async check(manual = false) {
    if (manual) this.modal('🔄 Buscando actualización…', '<p class="muted">Conectando con GitHub…</p>', []);
    try {
      const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' });
      if (r.status === 404) { if (manual) this.modal('✔ Todo al día', `<p>Aún no hay versiones publicadas. Tienes la v${esc(this.current().name)}.</p>`, [['Vale', () => this.close()]]); return; }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const rel = await r.json();
      const m = /versionCode=(\d+)/.exec(rel.body || '');
      const code = m ? Number(m[1]) : 0;
      const asset = (rel.assets || []).find((a) => /\.apk$/i.test(a.name));
      const cur = this.current();
      if (asset && code > cur.code) this.offer(rel, asset, cur);
      else if (manual) this.modal('✔ Todo al día', `<p>Tienes la última versión de TheBruma (v${esc(cur.name)}).</p>`, [['Vale', () => this.close()]]);
    } catch (e) {
      if (manual) this.modal('⚠ Sin conexión', '<p>No se pudo comprobar si hay actualizaciones. Revisa tu conexión a internet e inténtalo de nuevo.</p>', [['Vale', () => this.close()]]);
    }
  }
  offer(rel, asset, cur) {
    this.asset = asset;
    this.rel = rel;
    const notes = (rel.body || '').split('\n').filter((l) => l.trim() && !/^versionCode=/.test(l) && !/^(Co-Authored-By|Claude-Session)/.test(l)).slice(0, 8)
      .map((l) => `<li>${esc(l.replace(/^[-*]\s*/, ''))}</li>`).join('');
    const mb = asset.size ? ` · ${(asset.size / 1048576).toFixed(1)} MB` : '';
    this.modal('⚓ ¡Nueva versión!', `
      <p><b>${esc(rel.name || rel.tag_name)}</b> ya está disponible (tienes la v${esc(cur.name)})${mb}.</p>
      ${notes ? `<ul class="unotes">${notes}</ul>` : ''}
      <div id="upBar" class="upbar hidden"><div id="upFill"></div><span id="upTxt"></span></div>
      <p class="muted small">Tu partida se guarda antes de actualizar. No se borra nada.</p>`,
    [['⬇ Actualizar ahora', () => this.start(), 'primary'], ['Más tarde', () => this.close()]]);
  }
  start() {
    const url = this.asset.browser_download_url;
    try { this.g.save(); } catch (e) { /* nada */ }
    const b = window.AndroidBridge;
    if (b && b.downloadUpdate) {
      $('upBar').classList.remove('hidden');
      this.el.querySelectorAll('.ubtns button').forEach((x) => { x.disabled = true; });
      this.progress(0, 'bajando');
      b.downloadUpdate(url, (this.rel.tag_name || 'nueva').replace(/^v/, ''));
    } else {
      window.open(url, '_blank');
      this.close();
    }
  }
  progress(pct, st) {
    const bar = $('upBar');
    if (!bar) return;
    bar.classList.remove('hidden');
    $('upFill').style.width = pct + '%';
    $('upTxt').textContent = st === 'bajando' ? `Descargando… ${pct}%` : st === 'permiso' ? 'Permite "Instalar apps desconocidas" para TheBruma y vuelve' : 'Abriendo el instalador…';
    if (st === 'listo' || st === 'permiso') this.el.querySelectorAll('.ubtns button').forEach((x) => { x.disabled = false; });
  }
  error(why) {
    const url = this.asset && this.asset.browser_download_url;
    this.modal('⚠ No se pudo actualizar', `<p>Hubo un problema (${esc(why)}). Puedes descargar la APK desde el navegador.</p>`,
      [['🌐 Abrir en el navegador', () => { if (window.AndroidBridge && window.AndroidBridge.openUrl) window.AndroidBridge.openUrl(url); else window.open(url, '_blank'); this.close(); }, 'primary'], ['Cerrar', () => this.close()]]);
  }
  modal(title, html, buttons) {
    this.el.classList.remove('hidden');
    this.el.innerHTML = `<div class="pbox ubox"><div class="phead"><span class="ptitle">${title}</span></div><div class="pbody">${html}<div class="ubtns"></div></div></div>`;
    const box = this.el.querySelector('.ubtns');
    for (const [label, fn, cls] of buttons) {
      const b = document.createElement('button');
      b.className = 'wbtn' + (cls ? ' ' + cls : '');
      b.textContent = label;
      b.onclick = fn;
      box.appendChild(b);
    }
  }
  close() {
    this.el.classList.add('hidden');
    this.el.innerHTML = '';
  }
}

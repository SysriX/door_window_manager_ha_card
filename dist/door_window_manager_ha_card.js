// Fenster- & Türen-Manager: legt pro Fenster/Tür zwei Template-Helfer an und verwaltet sie
//  - sensor.<id>        Status open / tilted / closed (für den Grundriss im Raum-Tablet)
//  - binary_sensor.<id> Geräteklasse Fenster/Tür, an = offen oder gekippt (für HA, Sprachassistent, Automationen)
// Die Logik steckt im Makro /config/custom_templates/fenster_tuer.jinja, die Einträge des Managers
// (Beschreibung, Kontakte, zugehörige Config-Entries) werden in der Konfiguration dieser Karte gespeichert.
const FTM_VERSION = '1.3.1';

const FTM_CSS = `
:host{display:block}
*{box-sizing:border-box}
.wrap{font-family:Rajdhani,'Segoe UI',sans-serif;color:#c9ccd2;padding:20px;min-height:100%;
  background:radial-gradient(1200px 600px at 20% -10%,rgba(77,195,255,.10),transparent 60%),radial-gradient(900px 500px at 100% 0,rgba(163,107,255,.08),transparent 60%),#121317}
.plate{border-radius:18px;background:linear-gradient(180deg,rgba(40,42,48,.92),rgba(24,25,29,.94));box-shadow:0 0 0 1px #000,0 10px 30px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.08)}
.head{display:flex;align-items:center;gap:14px;padding:16px 20px;margin-bottom:16px}
.head h1{margin:0;font-size:20px;letter-spacing:3px;text-transform:uppercase;color:#f0f1f3;font-weight:700}
.head p{margin:2px 0 0;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#9a9fa8}
.led{width:9px;height:9px;border-radius:50%;background:#4dc3ff;box-shadow:0 0 10px #4dc3ff;flex:none}
.sum{margin-left:auto;display:flex;gap:8px}
.chip{font-size:12px;letter-spacing:1.5px;font-weight:700;text-transform:uppercase;padding:4px 10px;border-radius:8px;background:rgba(0,0,0,.35);box-shadow:inset 0 1px 3px #000,0 1px 0 rgba(255,255,255,.05);white-space:nowrap}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:38px;padding:0 16px;border-radius:9px;cursor:pointer;border:0;font:700 13px Rajdhani,sans-serif;letter-spacing:1.6px;text-transform:uppercase;color:#c9ccd2;
  background:linear-gradient(180deg,#34363b,#222327);box-shadow:0 4px 0 #0b0b0c,0 6px 10px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.1)}
.btn:active{transform:translateY(3px);box-shadow:0 1px 0 #0b0b0c,inset 0 1px 0 rgba(255,255,255,.1)}
.btn.pri{color:#4dc3ff}.btn.ok{color:#3ddc84}.btn.bad{color:#ff6b6b}
.btn.sm{height:30px;padding:0 10px;font-size:12px}
.btn[disabled]{opacity:.45;pointer-events:none}
.cols{display:grid;grid-template-columns:1fr 1fr;column-gap:16px;align-items:stretch}
.colh{display:flex;align-items:center;gap:10px;padding:4px 6px 10px;font-size:13px;letter-spacing:2.5px;text-transform:uppercase;color:#c9ccd2;font-weight:700}
.colh ha-icon{--mdc-icon-size:18px;color:#4dc3ff}
.colh small{font-family:'Share Tech Mono',monospace;font-size:13px;color:#9a9fa8;letter-spacing:0}
.sech{grid-column:1/-1;display:flex;align-items:center;gap:12px;margin:12px 4px 8px;font-size:12px;letter-spacing:2.5px;text-transform:uppercase;color:#8a8e96;font-weight:700}
.sech::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(255,255,255,.12),transparent)}
.room{margin-bottom:6px;padding:4px 0}
.room .row:first-of-type{border-top:0}
.room .ml{display:none;padding:8px 16px 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#979ca5;font-weight:700}
.room.none{display:grid;place-items:center;min-height:62px;color:#8a8f98;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;background:rgba(20,21,25,.45);box-shadow:inset 0 0 0 1px rgba(255,255,255,.04)}
.row{display:grid;grid-template-columns:40px minmax(0,1.1fr) minmax(0,1fr) 64px auto;align-items:center;gap:12px;padding:10px 16px;border-top:1px solid rgba(255,255,255,.05)}
.ic{width:40px;height:40px;border-radius:10px;display:grid;place-items:center;background:rgba(0,0,0,.35);box-shadow:inset 0 1px 3px #000;color:var(--c,#979ca5)}
.ic ha-icon{--mdc-icon-size:22px;filter:drop-shadow(0 0 5px var(--c,transparent))}
.nm b{display:block;font-size:15px;color:#f0f1f3;letter-spacing:.6px}
.nm small,.ct small{display:block;font-family:'Share Tech Mono',monospace;font-size:12px;color:#9a9fa8;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nm i{display:block;font-style:normal;font-size:12px;color:#9a9ea6;margin-top:3px}
.ct span{font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#979ca5}
.ct .cl{display:flex;align-items:center;gap:6px;min-width:0}
.ct .cl small{margin-top:0;flex:1;min-width:0}
.bat{display:inline-flex;align-items:center;gap:2px;flex:none;font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--bc)}
.bat ha-icon{--mdc-icon-size:17px;color:var(--bc);filter:drop-shadow(0 0 3px var(--bc))}
.bat.ok{--bc:#3ddc84}.bat.low{--bc:#ff4a4a;animation:ftmblink 1.4s ease-in-out infinite}.bat.na{--bc:#5a5e66}.bat.na ha-icon{filter:none}
@keyframes ftmblink{0%,100%{opacity:1}50%{opacity:.15}}
.chip.blink{animation:ftmblink 1.4s ease-in-out infinite}
.st{font-family:'Share Tech Mono',monospace;font-size:14px;letter-spacing:1px;color:var(--c,#979ca5);text-shadow:0 0 8px var(--c,transparent);text-align:center}
.acts{display:flex;gap:6px;justify-content:flex-end}
.btn.ic2{width:32px;padding:0}
.warn{color:#ffb347;font-size:12px;letter-spacing:.8px}
.empty{padding:40px 20px;text-align:center;color:#9a9fa8;letter-spacing:1px}
.ov{position:fixed;inset:0;z-index:50;display:grid;place-items:center;background:rgba(0,0,0,.55);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);padding:16px}
.dlg{width:min(640px,100%);max-height:calc(100vh - 32px);overflow:auto;padding:20px 22px}
.dlg h3{margin:0 0 14px;font-size:17px;letter-spacing:2.5px;text-transform:uppercase;color:#f0f1f3}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 14px}
.full{grid-column:1/-1}
label{display:block;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:#8a8e96;font-weight:700;margin-bottom:5px}
input,select,textarea{width:100%;height:38px;border-radius:9px;border:0;padding:0 11px;font:600 14px Rajdhani,sans-serif;letter-spacing:.5px;color:#f0f1f3;
  background:linear-gradient(180deg,#141518,#1e1f23);box-shadow:inset 0 2px 6px #000,0 1px 0 rgba(255,255,255,.07);outline:none}
textarea{height:64px;padding:9px 11px;resize:vertical}
input:focus,select:focus,textarea:focus{box-shadow:inset 0 2px 6px #000,0 0 0 1px rgba(77,195,255,.6)}
.idw{display:flex;align-items:center;gap:6px}
.idw code{font-family:'Share Tech Mono',monospace;font-size:13px;color:#9a9fa8;white-space:nowrap}
.seg{display:flex;gap:8px}
.seg .btn{flex:1}
.seg .btn.on{transform:translateY(3px);color:#f0f1f3;box-shadow:0 1px 0 #0b0b0c,0 3px 6px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.1)}
.seg .btn.on::before{content:"";width:14px;height:4px;border-radius:2px;background:#4dc3ff;box-shadow:0 0 10px #4dc3ff}
.icons{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
.icons b{width:34px;height:30px;border-radius:8px;display:grid;place-items:center;cursor:pointer;background:rgba(0,0,0,.3);box-shadow:inset 0 1px 3px #000;color:#9a9ea6}
.icons b.on{color:#4dc3ff;box-shadow:inset 0 1px 3px #000,0 0 0 1px rgba(77,195,255,.6)}
.icons ha-icon{--mdc-icon-size:18px}
.hint{font-size:12px;color:#9a9fa8;margin-top:5px;letter-spacing:.3px}
.cblk{padding:12px;border-radius:12px;background:rgba(0,0,0,.18);box-shadow:inset 0 0 0 1px rgba(255,255,255,.04)}
.cblk .sub{margin-top:10px}
.cblk .sub label{font-size:10px;letter-spacing:1.4px;color:#979ca5}
.cblk .sub input{height:32px;font-size:13px}
.err{color:#ff6b6b;font-size:13px;margin-top:12px;letter-spacing:.4px;white-space:pre-wrap}
.foot{display:flex;gap:10px;justify-content:flex-end;margin-top:18px;align-items:center}
.foot .prev{margin-right:auto;font-size:12px;letter-spacing:1.2px;text-transform:uppercase;color:#9a9fa8}
.foot .prev b{font-family:'Share Tech Mono',monospace;font-size:14px;color:var(--c,#979ca5);letter-spacing:1px;margin-left:6px}
.busy{opacity:.6;pointer-events:none}
@media (max-width:1100px){.cols{grid-template-columns:1fr}.cols>.colh{display:none}.room .ml{display:block}.room.none{display:none}}
@media (max-width:640px){.row{grid-template-columns:40px 1fr auto}.row .ct,.row .st{display:none}.grid{grid-template-columns:1fr}}
`;

const FTM_ICONS = {
  window: ['mdi:window-closed-variant', 'mdi:window-closed', 'mdi:window-open-variant', 'mdi:window-shutter', 'mdi:skylight'],
  door: ['mdi:door', 'mdi:door-closed', 'mdi:door-sliding', 'mdi:balcony', 'mdi:garage'],
};
const FTM_STATE = { closed: ['#3ddc84', 'ZU'], tilted: ['#ffb347', 'GEKIPPT'], open: ['#ff5a5a', 'OFFEN'], na: ['#979ca5', 'N.V.'] };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slug = s => String(s || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const q = s => `'${String(s).replace(/'/g, "\\'")}'`;

class FensterTuerManager extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); this._form = null; this._busy = false; }
  setConfig(config) {
    this._config = config || {};
    this._items = Array.isArray(this._config.items) ? this._config.items.map(x => ({ ...x })) : [];
    this._render();
  }
  getCardSize() { return 6; }
  set hass(h) {
    const first = !this._hass; this._hass = h;
    if (first) this._loadFont();
    // Nur neu zeichnen, wenn sich ein beteiligter Zustand geändert hat
    const ids = this._items.flatMap(i => [`sensor.${i.id}`, i.open, i.tilt, ...[['open', i.open], ['tilt', i.tilt]].flatMap(([w, c]) => { const b = c ? this._battIds(c, this._sel(i, w)) : {}; return [b.low, b.pct]; })]).filter(Boolean);
    const sig = ids.map(id => (h.states[id] || {}).state).join('|') + '|' + Object.keys(h.areas || {}).length;
    if (first || sig !== this._sig) { this._sig = sig; if (!this._form) this._render(); else this._updPreview(); }
  }
  _loadFont() {
    if (document.getElementById('rtc-font')) return;
    const l = document.createElement('link'); l.id = 'rtc-font'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Share+Tech+Mono&display=swap';
    document.head.appendChild(l);
  }

  // ---------- Anzeige ----------
  _stateOf(id) {
    const s = this._hass && this._hass.states[`sensor.${id}`];
    if (!s || ['unavailable', 'unknown'].includes(s.state)) return 'na';
    return FTM_STATE[s.state] ? s.state : 'na';
  }
  // Batterie eines Kontakts: Entitäten am selben Gerät (Binärsensor „Batterie schwach“, ggf. Prozent-Sensor),
  // sonst Namensmuster <kontakt ohne _state>_low_battery
  _sel(it, w) { const k = w === 'tilt' ? 'bt' : 'bo'; return it && Object.prototype.hasOwnProperty.call(it, k + '_low') ? { low: it[k + '_low'] || '', pct: it[k + '_pct'] || '' } : null; }
  _battIds(c, sel) {
    if (sel) return { low: sel.low || undefined, pct: sel.pct || undefined };
    const h = this._hass, ents = h.entities || {}, dev = ents[c] && ents[c].device_id;
    const sib = dev ? Object.keys(ents).filter(id => id !== c && ents[id].device_id === dev) : [];
    const dc = id => h.states[id] && h.states[id].attributes.device_class;
    let low = sib.find(id => id.startsWith('binary_sensor.') && (dc(id) === 'battery' || /low_?bat/.test(id)));
    const pct = sib.find(id => id.startsWith('sensor.') && dc(id) === 'battery');
    if (!low) { const g = c.replace(/_(state|contact|opening|window|door)$/, '') + '_low_battery'; if (h.states[g]) low = g; }
    return { low, pct };
  }
  _batt(c, sel) {
    if (!c) return null;
    const h = this._hass, { low, pct } = this._battIds(c, sel), sl = low && h.states[low], sp = pct && h.states[pct];
    if (!sl && !sp) return null;
    const p = sp && !isNaN(parseFloat(sp.state)) ? Math.round(parseFloat(sp.state)) : null;
    const lowOn = sl && sl.state === 'on';
    const na = (!sl || ['unavailable', 'unknown'].includes(sl.state)) && p == null;
    return { st: na ? 'na' : lowOn || (p != null && p <= 15) ? 'low' : 'ok', p, id: low || pct };
  }
  _battHtml(c, sel) {
    const b = this._batt(c, sel); if (!b) return '';
    const icon = b.st === 'low' ? 'mdi:battery-alert-variant-outline' : b.st === 'na' ? 'mdi:battery-unknown' : b.p != null ? `mdi:battery${b.p >= 95 ? '' : '-' + Math.max(10, Math.round(b.p / 10) * 10)}` : 'mdi:battery';
    const tip = b.st === 'low' ? 'Batterie schwach' : b.st === 'na' ? 'Batteriestatus nicht verfügbar' : 'Batterie in Ordnung';
    return `<span class="bat ${b.st}" title="${tip}${b.p != null ? ' · ' + b.p + ' %' : ''} (${esc(b.id)})"><ha-icon icon="${icon}"></ha-icon>${b.p != null ? b.p + '%' : ''}</span>`;
  }
  _areaName(a) { const ar = this._hass && this._hass.areas && this._hass.areas[a]; return ar ? ar.name : ''; }
  _fname(id) { const s = this._hass && this._hass.states[id]; return s ? (s.attributes.friendly_name || id) : id; }

  _render() {
    if (!this._hass) { this.shadowRoot.innerHTML = `<style>${FTM_CSS}</style><div class="wrap"></div>`; return; }
    const h = this._hass, admin = h.user && h.user.is_admin;
    const cnt = { open: 0, tilted: 0, bat: 0 };
    this._items.forEach(i => { const s = this._stateOf(i.id); if (cnt[s] != null) cnt[s]++; [['open', i.open], ['tilt', i.tilt]].forEach(([w, c]) => { const b = this._batt(c, this._sel(i, w)); if (b && b.st === 'low') cnt.bat++; }); });
    // Abschnitte je Raum über beide Spalten: links die Türen, rechts die Fenster desselben Raums auf gleicher Höhe
    const groups = {};
    this._items.forEach((it, n) => { const k = it.area || ''; (groups[k] = groups[k] || []).push({ it, n }); });
    const keys = Object.keys(groups).sort((a, b) => (a ? this._areaName(a) || a : '~').localeCompare(b ? this._areaName(b) || b : '~', 'de'));
    const nT = this._items.filter(i => i.type === 'door').length, nF = this._items.length - nT;
    const cell = (list, type) => list.length
      ? `<div class="plate room"><div class="ml">${type === 'door' ? 'Türen' : 'Fenster'}</div>${list.sort((a, b) => a.it.name.localeCompare(b.it.name, 'de')).map(({ it, n }) => this._row(it, n)).join('')}</div>`
      : `<div class="plate room none">${type === 'door' ? 'Keine Türen' : 'Keine Fenster'}</div>`;
    const rows = this._items.length ? `<div class="cols"><div class="colh"><ha-icon icon="mdi:door"></ha-icon>Türen<small>${nT}</small></div><div class="colh"><ha-icon icon="mdi:window-closed-variant"></ha-icon>Fenster<small>${nF}</small></div>${keys.map(k => {
      const g = groups[k];
      return `<div class="sech">${esc(k ? this._areaName(k) || k : 'Ohne Raum')}</div>${cell(g.filter(x => x.it.type === 'door'), 'door')}${cell(g.filter(x => x.it.type !== 'door'), 'window')}`;
    }).join('')}</div>` : '';
    this.shadowRoot.innerHTML = `<style>${FTM_CSS}</style><div class="wrap${this._busy ? ' busy' : ''}">
      <div class="plate head"><span class="led"></span><div><h1>Fenster &amp; Türen</h1><p>${this._items.length} verwaltet · Template-Helfer</p></div>
        <div class="sum">${cnt.open ? `<span class="chip" style="color:#ff5a5a">${cnt.open} offen</span>` : ''}${cnt.tilted ? `<span class="chip" style="color:#ffb347">${cnt.tilted} gekippt</span>` : ''}${!cnt.open && !cnt.tilted && this._items.length ? '<span class="chip" style="color:#3ddc84">alles zu</span>' : ''}${cnt.bat ? `<span class="chip blink" style="color:#ff4a4a">${cnt.bat} Batterie${cnt.bat > 1 ? 'n' : ''} schwach</span>` : ''}</div>
        ${admin ? '<button class="btn pri" data-a="add">＋ Hinzufügen</button>' : ''}</div>
      ${admin ? '' : '<div class="plate empty">Zum Verwalten wird ein Administrator-Konto benötigt.</div>'}
      ${rows || (admin ? '<div class="plate empty">Noch keine Fenster oder Türen angelegt. Mit „Hinzufügen“ geht es los.</div>' : '')}
      ${this._form ? this._dialog() : ''}
    </div>`;
    this.shadowRoot.querySelectorAll('[data-a]').forEach(e => e.addEventListener('click', ev => this._act(ev, e)));
    if (this._form) this._bindForm();
  }
  _row(it, n) {
    const st = this._stateOf(it.id), [col, txt] = FTM_STATE[st], h = this._hass;
    const miss = !h.states[`sensor.${it.id}`] || !h.states[`binary_sensor.${it.id}`];
    return `<div class="row" style="--c:${col}">
      <div class="ic"><ha-icon icon="${esc(it.icon || FTM_ICONS[it.type][0])}"></ha-icon></div>
      <div class="nm"><b>${esc(it.name)}</b><small>sensor.${esc(it.id)} · ${it.type === 'door' ? 'Tür' : 'Fenster'}</small>${it.desc ? `<i>${esc(it.desc)}</i>` : ''}${miss ? '<i class="warn">⚠ Helfer fehlt in HA – bearbeiten &amp; speichern legt ihn neu an</i>' : ''}</div>
      <div class="ct"><span>Offen</span><div class="cl">${this._battHtml(it.open, this._sel(it, 'open'))}<small title="${esc(it.open)}">${esc(this._fname(it.open))}</small></div>${it.tilt ? `<span>Gekippt</span><div class="cl">${this._battHtml(it.tilt, this._sel(it, 'tilt'))}<small title="${esc(it.tilt)}">${esc(this._fname(it.tilt))}</small></div>` : '<span>ohne Kippkontakt</span>'}</div>
      <div class="st">${txt}</div>
      <div class="acts">${h.user && h.user.is_admin ? `<button class="btn sm ic2" data-a="edit:${n}" title="Bearbeiten">✎</button><button class="btn sm ic2 bad" data-a="del:${n}" title="Löschen">✕</button>` : ''}</div>
    </div>`;
  }

  // ---------- Formular ----------
  _dialog() {
    const f = this._form, h = this._hass, isNew = f.index == null;
    const bins = Object.keys(h.states).filter(id => id.startsWith('binary_sensor.') && !this._items.some(i => `binary_sensor.${i.id}` === id)).sort();
    const opts = bins.map(id => `<option value="${esc(id)}">${esc(this._fname(id))}</option>`).join('');
    const dc = id => h.states[id].attributes.device_class, unit = id => h.states[id].attributes.unit_of_measurement;
    const blow = Object.keys(h.states).filter(id => id.startsWith('binary_sensor.') && (dc(id) === 'battery' || /bat/.test(id))).sort().map(id => `<option value="${esc(id)}">${esc(this._fname(id))}</option>`).join('');
    const bpct = Object.keys(h.states).filter(id => id.startsWith('sensor.') && (dc(id) === 'battery' || (/bat/.test(id) && unit(id) === '%'))).sort().map(id => `<option value="${esc(id)}">${esc(this._fname(id))}</option>`).join('');
    const areas = Object.values(h.areas || {}).sort((a, b) => a.name.localeCompare(b.name, 'de'));
    return `<div class="ov"><div class="plate dlg">
      <h3>${isNew ? (f.type === 'door' ? 'Neue Tür' : 'Neues Fenster') : `${esc(f.name || '')} bearbeiten`}</h3>
      <datalist id="bins">${opts}</datalist><datalist id="blow">${blow}</datalist><datalist id="bpct">${bpct}</datalist>
      <div class="grid">
        <div class="full"><label>Art</label><div class="seg"><button class="btn${f.type === 'window' ? ' on' : ''}" data-a="type:window">Fenster</button><button class="btn${f.type === 'door' ? ' on' : ''}" data-a="type:door">Tür</button></div></div>
        <div><label>Anzeigename</label><input id="f-name" value="${esc(f.name)}" placeholder="z. B. Fenster rechts"></div>
        <div><label>Raum</label><select id="f-area"><option value="">– kein Raum –</option>${areas.map(a => `<option value="${esc(a.area_id)}"${a.area_id === f.area ? ' selected' : ''}>${esc(a.name)}</option>`).join('')}</select></div>
        <div class="full"><label>Entitäts-ID</label><div class="idw"><code>sensor. / binary_sensor.</code><input id="f-id" value="${esc(f.id)}" placeholder="wz_fenster_rechts"></div>
          <div class="hint">Nur Kleinbuchstaben, Ziffern und _. Beide Helfer bekommen diese ID.</div></div>
        <div class="cblk"><label>Kontakt „offen“</label><input id="f-open" list="bins" value="${esc(f.open)}" placeholder="binary_sensor.…"><div class="hint" id="h-open"></div>
          <div class="sub"><label>Batterie schwach (Binärsensor)</label><input id="f-bo_low" list="blow" value="${esc(f.bo_low)}" placeholder="leer = keiner"><div class="hint" id="h-bo_low"></div></div>
          <div class="sub"><label>Batteriestand in % (optional)</label><input id="f-bo_pct" list="bpct" value="${esc(f.bo_pct)}" placeholder="leer = keiner"><div class="hint" id="h-bo_pct"></div></div></div>
        <div class="cblk"><label>Kontakt „gekippt“ (optional)</label><input id="f-tilt" list="bins" value="${esc(f.tilt)}" placeholder="leer = ohne Kippfunktion"><div class="hint" id="h-tilt"></div>
          <div class="sub"><label>Batterie schwach (Binärsensor)</label><input id="f-bt_low" list="blow" value="${esc(f.bt_low)}" placeholder="leer = keiner"><div class="hint" id="h-bt_low"></div></div>
          <div class="sub"><label>Batteriestand in % (optional)</label><input id="f-bt_pct" list="bpct" value="${esc(f.bt_pct)}" placeholder="leer = keiner"><div class="hint" id="h-bt_pct"></div></div></div>
        <div class="full"><label>Symbol</label><div class="idw"><input id="f-icon" value="${esc(f.icon)}" placeholder="mdi:window-closed-variant"><span class="ic" style="width:38px;height:38px;flex:none"><ha-icon id="f-icp" icon="${esc(f.icon || FTM_ICONS[f.type][0])}"></ha-icon></span></div>
          <div class="icons">${[...FTM_ICONS.window, ...FTM_ICONS.door].map(i => `<b class="${i === f.icon ? 'on' : ''}" data-a="icon:${i}" title="${i}"><ha-icon icon="${i}"></ha-icon></b>`).join('')}</div></div>
        <div class="full"><label>Beschreibung (optional)</label><textarea id="f-desc" placeholder="z. B. Dreh-Kipp, Kontakt oben = gekippt">${esc(f.desc)}</textarea></div>
      </div>
      ${f.err ? `<div class="err">${esc(f.err)}</div>` : ''}
      <div class="foot"><span class="prev" id="f-prev">Vorschau<b>--</b></span><button class="btn" data-a="cancel">Abbrechen</button><button class="btn ok" data-a="save">${this._busy ? 'Speichere …' : 'Speichern'}</button></div>
    </div></div>`;
  }
  _bindForm() {
    const $ = id => this.shadowRoot.getElementById(id), f = this._form;
    ['name', 'id', 'open', 'tilt', 'icon', 'desc', 'area', 'bo_low', 'bo_pct', 'bt_low', 'bt_pct'].forEach(k => {
      const el = $('f-' + k); if (!el) return;
      el.addEventListener('input', () => {
        f[k] = el.value.trim();
        if (k === 'name' && !f.idTouched && f.index == null) { f.id = slug(f.name); $('f-id').value = f.id; }
        if (k === 'id') f.idTouched = true;
        if (/^b[ot]_/.test(k)) f[k.slice(0, 2) + 'Touched'] = true;
        if ((k === 'open' || k === 'tilt') && !f[(k === 'open' ? 'bo' : 'bt') + 'Touched']) {
          const p = k === 'open' ? 'bo' : 'bt', a = f[k] && this._hass.states[f[k]] ? this._battIds(f[k]) : {};
          f[p + '_low'] = a.low || ''; f[p + '_pct'] = a.pct || '';
          $('f-' + p + '_low').value = f[p + '_low']; $('f-' + p + '_pct').value = f[p + '_pct'];
        }
        if (k === 'icon') $('f-icp').setAttribute('icon', f.icon || FTM_ICONS[f.type][0]);
        this._updPreview();
      });
    });
    this._updPreview();
  }
  // Vorschau: was der Sensor mit den gewählten Kontakten gerade anzeigen würde
  _updPreview() {
    if (!this._form) return;
    const f = this._form, h = this._hass, $ = id => this.shadowRoot.getElementById(id);
    const so = h.states[f.open], sk = f.tilt ? h.states[f.tilt] : null;
    const hint = (el, id, s) => { if (el) el.textContent = !id ? '' : s ? `${s.attributes.friendly_name || id}: ${s.state}` : 'Entität nicht gefunden'; };
    hint($('h-open'), f.open, so); hint($('h-tilt'), f.tilt, sk);
    const bh = (k, low) => { const el = $('h-' + k), id = f[k], s2 = id && h.states[id]; if (!el) return;
      el.textContent = !id ? '' : !s2 ? 'Entität nicht gefunden' : ['unavailable', 'unknown'].includes(s2.state) ? 'nicht verfügbar'
        : low ? (s2.state === 'on' ? 'Batterie schwach' : 'Batterie ok') : `${s2.state} ${s2.attributes.unit_of_measurement || ''}`.trim(); };
    bh('bo_low', true); bh('bo_pct', false); bh('bt_low', true); bh('bt_pct', false);
    let st = 'na';
    const bad = s => !s || ['unavailable', 'unknown'].includes(s.state);
    if (so && !bad(so) && (!f.tilt || !bad(sk))) st = so.state === 'on' ? 'open' : sk && sk.state === 'on' ? 'tilted' : 'closed';
    const p = $('f-prev'); if (p) { p.style.setProperty('--c', FTM_STATE[st][0]); p.querySelector('b').textContent = FTM_STATE[st][1]; }
  }

  _act(ev, el) {
    const [a, arg] = el.dataset.a.split(/:(.*)/s);
    if (a === 'add') { this._form = { index: null, type: 'window', name: '', id: '', open: '', tilt: '', icon: FTM_ICONS.window[0], desc: '', area: '', bo_low: '', bo_pct: '', bt_low: '', bt_pct: '' }; this._render(); }
    else if (a === 'edit') {
      const it = this._items[+arg], bo = this._battIds(it.open, this._sel(it, 'open')), bt = it.tilt ? this._battIds(it.tilt, this._sel(it, 'tilt')) : {};
      this._form = { index: +arg, ...it, tilt: it.tilt || '', icon: it.icon || '', desc: it.desc || '', area: it.area || '', idTouched: true,
        bo_low: bo.low || '', bo_pct: bo.pct || '', bt_low: bt.low || '', bt_pct: bt.pct || '', boTouched: !!this._sel(it, 'open'), btTouched: !!this._sel(it, 'tilt') };
      this._render();
    }
    else if (a === 'cancel') { this._form = null; this._render(); }
    else if (a === 'type') { const f = this._form; if (FTM_ICONS[f.type].includes(f.icon) || !f.icon) f.icon = FTM_ICONS[arg][0]; f.type = arg; this._render(); }
    else if (a === 'icon') { this._form.icon = arg; this._render(); }
    else if (a === 'save') this._save();
    else if (a === 'del') this._delete(+arg);
  }

  // ---------- Home Assistant ----------
  _tplState(f) { return `{% from 'fenster_tuer.jinja' import kontakt %}{{ kontakt(${q(f.open)}${f.tilt ? ', ' + q(f.tilt) : ''}) }}`; }
  _tplBinary(f) { return `{% from 'fenster_tuer.jinja' import kontakt %}{{ kontakt(${q(f.open)}${f.tilt ? ', ' + q(f.tilt) : ''}) in ['open', 'tilted'] }}`; }
  _tplAvail(f) { return `{% from 'fenster_tuer.jinja' import verfuegbar %}{{ verfuegbar(${q(f.open)}${f.tilt ? ', ' + q(f.tilt) : ''}) }}`; }
  async _flow(kind, name, data) {
    const api = (m, p, b) => this._hass.callApi(m, p, b);
    let r = await api('POST', 'config/config_entries/flow', { handler: 'template', show_advanced_options: false });
    if (r.type === 'menu') r = await api('POST', `config/config_entries/flow/${r.flow_id}`, { next_step_id: kind });
    r = await api('POST', `config/config_entries/flow/${r.flow_id}`, { name, ...data });
    if (r.type !== 'create_entry') throw new Error(`Anlegen fehlgeschlagen (${kind}): ${JSON.stringify(r.errors || r.reason || r.type)}`);
    return typeof r.result === 'string' ? r.result : (r.result && r.result.entry_id);
  }
  async _options(entryId, data) {
    const api = (m, p, b) => this._hass.callApi(m, p, b);
    const r0 = await api('POST', 'config/config_entries/options/flow', { handler: entryId });
    const r = await api('POST', `config/config_entries/options/flow/${r0.flow_id}`, data);
    if (r.type !== 'create_entry') throw new Error(`Ändern fehlgeschlagen: ${JSON.stringify(r.errors || r.reason || r.type)}`);
  }
  async _entityOf(entryId, domain) {
    for (let t = 0; t < 20; t++) {
      const list = await this._hass.callWS({ type: 'config/entity_registry/list' });
      const e = list.find(x => x.config_entry_id === entryId && x.entity_id.startsWith(domain + '.'));
      if (e) return e.entity_id;
      await new Promise(res => setTimeout(res, 300));
    }
    throw new Error('Neue Entität wurde nicht gefunden');
  }
  async _reg(entityId, upd) { return this._hass.callWS({ type: 'config/entity_registry/update', entity_id: entityId, ...upd }); }
  async _entryExists(id) {
    if (!id) return false;
    const list = await this._hass.callWS({ type: 'config_entries/get', domain: 'template' });
    return list.some(e => e.entry_id === id);
  }
  // Helfer anlegen oder anpassen; liefert den aktualisierten Eintrag
  async _apply(f, old) {
    const out = { id: f.id, type: f.type, name: f.name, icon: f.icon, open: f.open, tilt: f.tilt || '', area: f.area || '', desc: f.desc || '',
      bo_low: f.bo_low || '', bo_pct: f.bo_pct || '', bt_low: f.tilt ? f.bt_low || '' : '', bt_pct: f.tilt ? f.bt_pct || '' : '' };
    const parts = [
      { dom: 'sensor', key: 'sensor_entry', data: { state: this._tplState(f), additional_options: { availability: this._tplAvail(f) } }, reg: { icon: f.icon || null } },
      { dom: 'binary_sensor', key: 'binary_entry', data: { state: this._tplBinary(f), device_class: f.type, additional_options: { availability: this._tplAvail(f) } }, reg: {} },
    ];
    for (const p of parts) {
      const want = `${p.dom}.${f.id}`;
      let entry = old && old[p.key], cur = old ? `${p.dom}.${old.id}` : null;
      if (entry && await this._entryExists(entry)) {
        const changed = !old || old.open !== f.open || (old.tilt || '') !== (f.tilt || '') || old.type !== f.type;
        if (changed) await this._options(entry, p.data);
        const reg = (await this._hass.callWS({ type: 'config/entity_registry/list' })).find(x => x.config_entry_id === entry);
        cur = reg ? reg.entity_id : cur;
      } else {
        entry = await this._flow(p.dom, f.name, p.data);
        cur = await this._entityOf(entry, p.dom);
      }
      const upd = { name: f.name, area_id: f.area || null, ...p.reg };
      if (cur !== want) upd.new_entity_id = want;
      await this._reg(cur, upd);
      out[p.key] = entry;
    }
    return out;
  }
  _validate(f) {
    const h = this._hass;
    if (!f.name) return 'Bitte einen Anzeigenamen angeben.';
    if (!/^[a-z0-9_]+$/.test(f.id || '')) return 'Die Entitäts-ID darf nur Kleinbuchstaben, Ziffern und _ enthalten.';
    if (!f.open || !h.states[f.open]) return 'Bitte einen vorhandenen Kontakt für „offen“ wählen.';
    if (f.tilt && !h.states[f.tilt]) return 'Der Kontakt für „gekippt“ wurde nicht gefunden.';
    if (f.tilt && f.tilt === f.open) return '„Offen“ und „gekippt“ müssen verschiedene Kontakte sein.';
    for (const k of ['bo_low', 'bo_pct', ...(f.tilt ? ['bt_low', 'bt_pct'] : [])]) if (f[k] && !h.states[f[k]]) return `Der Batteriesensor „${f[k]}“ wurde nicht gefunden.`;
    const old = f.index != null ? this._items[f.index] : null;
    if (this._items.some((i, n) => n !== f.index && i.id === f.id)) return 'Diese Entitäts-ID wird schon von einem anderen Eintrag verwendet.';
    if ((!old || old.id !== f.id) && (h.states[`sensor.${f.id}`] || h.states[`binary_sensor.${f.id}`])) return `sensor.${f.id} oder binary_sensor.${f.id} gibt es bereits in Home Assistant.`;
    return null;
  }
  async _save() {
    const f = this._form; f.err = this._validate(f);
    if (f.err) { this._render(); return; }
    this._busy = true; this._render();
    try {
      const old = f.index != null ? this._items[f.index] : null;
      const item = await this._apply(f, old);
      const items = this._items.slice();
      if (f.index != null) items[f.index] = item; else items.push(item);
      this._items = items; this._form = null;
      await this._persist();
    } catch (e) {
      f.err = (e && (e.body && e.body.message || e.message)) || String(e);
    }
    this._busy = false; this._render();
  }
  async _delete(n) {
    const it = this._items[n];
    if (!confirm(`„${it.name}“ löschen?\n\nDie beiden Helfer sensor.${it.id} und binary_sensor.${it.id} werden aus Home Assistant entfernt. Die Kontakte selbst bleiben unberührt.`)) return;
    this._busy = true; this._render();
    try {
      for (const e of [it.sensor_entry, it.binary_entry]) if (e && await this._entryExists(e)) await this._hass.callApi('DELETE', `config/config_entries/entry/${e}`);
      this._items = this._items.filter((_, i) => i !== n);
      await this._persist();
    } catch (e) { alert('Löschen fehlgeschlagen: ' + ((e && (e.body && e.body.message || e.message)) || e)); }
    this._busy = false; this._render();
  }
  // Einträge in der Konfiguration dieser Karte im Dashboard speichern
  async _persist() {
    const url = this._config.dashboard || location.pathname.split('/')[1];
    const cfg = await this._hass.callWS({ type: 'lovelace/config', url_path: url, force: true });
    let found = false;
    const walk = o => {
      if (Array.isArray(o)) return o.forEach(walk);
      if (o && typeof o === 'object') {
        if (o.type === 'custom:fenster-tuer-manager' && !found) { o.items = this._items; found = true; return; }
        Object.values(o).forEach(walk);
      }
    };
    walk(cfg);
    if (!found) throw new Error('Manager-Karte im Dashboard nicht gefunden – Einträge konnten nicht gespeichert werden.');
    this._config = { ...this._config, items: this._items };
    await this._hass.callWS({ type: 'lovelace/config/save', url_path: url, config: cfg });
  }
}

if (!customElements.get('fenster-tuer-manager')) customElements.define('fenster-tuer-manager', FensterTuerManager);
window.customCards = window.customCards || [];
window.customCards.push({ type: 'fenster-tuer-manager', name: 'Fenster- & Türen-Manager', description: 'Fenster und Türen als Template-Helfer anlegen und verwalten' });
console.info(`%c FENSTER-TUER-MANAGER %c ${FTM_VERSION} `, 'background:#4dc3ff;color:#000;font-weight:700', 'background:#222;color:#4dc3ff');

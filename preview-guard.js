/* preview-guard: concept previews must never open an email app or a phone dialler from a desktop click.
   - mailto: links and form "sends" show an in-page panel with the address + Copy, nothing is opened.
   - tel: links work normally on touch phones; on desktop they show the number + Copy instead of an app prompt.
   - window.__previewMail(href) is what the page forms call instead of navigating to a mailto: URL. */
(function () {
  if (window.__previewGuard) return; window.__previewGuard = 1;
  var touch = matchMedia('(pointer: coarse)').matches;
  function parse(href) {
    var u = href.replace(/^mailto:/i, ''), q = u.indexOf('?'), to = decodeURIComponent(q < 0 ? u : u.slice(0, q));
    var sp = new URLSearchParams(q < 0 ? '' : u.slice(q + 1));
    return { to: to, subject: sp.get('subject') || '', body: sp.get('body') || '' };
  }
  function css() {
    if (document.getElementById('pg-css')) return;
    var s = document.createElement('style'); s.id = 'pg-css';
    s.textContent = '#pg-wrap{position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;padding:16px;background:rgba(10,10,12,.55);backdrop-filter:blur(4px);animation:pgIn .25s ease both}' +
      '#pg-card{max-width:440px;width:100%;background:#fff;color:#16171a;border-radius:18px;padding:22px 22px 18px;box-shadow:0 24px 70px rgba(0,0,0,.35);font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;animation:pgUp .35s cubic-bezier(.2,.8,.2,1) both}' +
      '#pg-card h3{margin:0 0 6px;font-size:18px} #pg-card p{margin:0 0 12px;color:#4a4d55} #pg-card .pg-addr{display:flex;gap:8px;align-items:center;background:#f3f4f6;border-radius:12px;padding:10px 12px;font-weight:600;word-break:break-all}' +
      '#pg-card pre{white-space:pre-wrap;max-height:160px;overflow:auto;background:#f8f8fa;border-radius:10px;padding:10px;font:12.5px/1.45 ui-monospace,Consolas,monospace;color:#33363d;margin:0 0 12px}' +
      '#pg-card .pg-row{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}#pg-card button{min-height:44px;padding:0 16px;border-radius:999px;border:0;font-weight:700;cursor:pointer;transition:transform .15s}#pg-card button:active{transform:scale(.97)}' +
      '#pg-card .pg-p{background:#16171a;color:#fff}#pg-card .pg-g{background:#eceef2;color:#16171a}' +
      '@keyframes pgIn{from{opacity:0}to{opacity:1}}@keyframes pgUp{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}';
    document.head.appendChild(s);
  }
  function panel(title, text, addr, extra) {
    css(); var old = document.getElementById('pg-wrap'); if (old) old.remove();
    var w = document.createElement('div'); w.id = 'pg-wrap'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true');
    w.innerHTML = '<div id="pg-card"><h3></h3><p></p>' + (extra ? '<pre></pre>' : '') + '<div class="pg-addr"><span></span></div><div class="pg-row"><button class="pg-g" data-x>Close</button><button class="pg-p" data-c>Copy</button></div></div>';
    w.querySelector('h3').textContent = title; w.querySelector('p').textContent = text; w.querySelector('.pg-addr span').textContent = addr;
    if (extra) w.querySelector('pre').textContent = extra;
    w.addEventListener('click', function (e) {
      if (e.target === w || e.target.hasAttribute('data-x')) w.remove();
      if (e.target.hasAttribute('data-c')) { (navigator.clipboard ? navigator.clipboard.writeText(addr) : Promise.reject()).then(function () { e.target.textContent = 'Copied ✓'; }, function () { e.target.textContent = 'Select & copy'; }); }
    });
    document.addEventListener('keydown', function k(ev) { if (ev.key === 'Escape') { w.remove(); document.removeEventListener('keydown', k); } });
    document.body.appendChild(w); w.querySelector('[data-c]').focus();
  }
  window.__previewMail = function (href) {
    var m = parse(String(href));
    if (m.body) panel('Preview: request ready', 'On the live website this request goes straight to ' + m.to + ' — nothing opens on your device. Here is what they would receive:', m.to, (m.subject ? 'Subject: ' + m.subject + '\n\n' : '') + m.body);
    else panel('Email address', 'Copy the address to write to them.', m.to);
    return false;
  };
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var h = a.getAttribute('href') || '';
    if (/^mailto:/i.test(h)) { e.preventDefault(); e.stopImmediatePropagation(); window.__previewMail(h); }
    else if (/^tel:/i.test(h) && !touch) { e.preventDefault(); e.stopImmediatePropagation(); panel('Phone number', 'Call this number from your phone.', h.replace(/^tel:/i, '')); }
  }, true);
  document.addEventListener('submit', function (e) { var f = e.target; if (f && /^mailto:/i.test(f.getAttribute('action') || '')) e.preventDefault(); }, true);
  var oc = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () { var h = this.getAttribute('href') || ''; if (/^mailto:/i.test(h)) return window.__previewMail(h); return oc.apply(this, arguments); };
  var oo = window.open;
  window.open = function (u) { if (/^mailto:/i.test(String(u || ''))) return window.__previewMail(u), null; return oo.apply(window, arguments); };
})();

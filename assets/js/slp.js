/* SLP · interacción del sitio: cabecera, menú, revelado, video y formulario */
(function () {
  document.documentElement.classList.add('js');
  var head = document.querySelector('.site-head');
  function onScroll() { if (head && !head.classList.contains('always')) head.classList.toggle('solid', window.scrollY > 24); }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  var burger = document.querySelector('.burger');
  if (burger) burger.addEventListener('click', function () {
    var open = head.getAttribute('data-menu') === 'open';
    head.setAttribute('data-menu', open ? 'closed' : 'open');
    burger.setAttribute('aria-expanded', String(!open));
    document.body.style.overflow = open ? '' : 'hidden';
  });

  document.querySelectorAll('.dd').forEach(function (dd) {
    var b = dd.querySelector('button');
    b.addEventListener('click', function (e) { e.stopPropagation(); var o = dd.getAttribute('data-open') === 'true'; dd.setAttribute('data-open', String(!o)); b.setAttribute('aria-expanded', String(!o)); });
    if (window.matchMedia('(hover:hover) and (min-width:1081px)').matches) {
      dd.addEventListener('mouseenter', function () { dd.setAttribute('data-open', 'true'); b.setAttribute('aria-expanded', 'true'); });
      dd.addEventListener('mouseleave', function () { dd.setAttribute('data-open', 'false'); b.setAttribute('aria-expanded', 'false'); });
    }
  });
  document.addEventListener('click', function () { document.querySelectorAll('.dd[data-open="true"]').forEach(function (d) { d.setAttribute('data-open', 'false'); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { document.querySelectorAll('.dd').forEach(function (d) { d.setAttribute('data-open', 'false'); }); if (head && head.getAttribute('data-menu') === 'open') burger.click(); } });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });
  } else { document.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); }); }

  // Contadores de la franja de cifras
  document.querySelectorAll('[data-count]').forEach(function (el) {
    var end = +el.getAttribute('data-count'), done = false;
    function run() { if (done) return; done = true; var t0 = performance.now(); (function f(t) { var p = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); })(t0); }
    if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion:reduce)').matches) { new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { run(); o.disconnect(); } }).observe(el); } else { el.textContent = end; }
  });

  // Video institucional: carga bajo demanda
  document.querySelectorAll('[data-video]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var v = btn.parentElement.querySelector('video');
      if (!v.src) v.src = v.getAttribute('data-src');
      v.controls = true; btn.hidden = true; v.play().catch(function () {});
      try { gtag('event', 'video_start', { video_title: 'Video institucional SLP' }); } catch (e) {}
    });
  });

  // Formularios Web3Forms: contacto y alerta tributaria
  document.querySelectorAll('form.js-w3f').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = form.querySelector('.msg'), btn = form.querySelector('button[type=submit]'), label = btn.firstChild.textContent;
      msg.className = 'msg';
      if (!form.checkValidity()) { msg.className = 'msg err'; msg.textContent = 'Revisa los campos obligatorios y la autorización de datos.'; form.reportValidity(); return; }
      btn.disabled = true; btn.firstChild.textContent = 'Enviando… ';
      fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(form) })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (!d.success) throw new Error(d.message || 'error');
          msg.className = 'msg ok'; msg.textContent = form.getAttribute('data-ok') || 'Gracias, recibimos tus datos.'; form.reset();
          try { gtag('event', form.getAttribute('data-ev') === 'suscripcion' ? 'sign_up' : 'generate_lead', { method: form.getAttribute('data-ev') || 'formulario' }); } catch (e) {}
        })
        .catch(function () { msg.className = 'msg err'; msg.innerHTML = 'No pudimos enviar el formulario. Escríbenos por <a href="https://wa.me/593995728488">WhatsApp +593 99 572 8488</a> o a comercial@strategicleverage.partners.'; })
        .finally(function () { btn.disabled = false; btn.firstChild.textContent = label; });
    });
  });

  // Vencimientos: días que faltan (zona horaria de Ecuador)
  var MES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  document.querySelectorAll('[data-due]').forEach(function (el) {
    var v = el.getAttribute('data-due'), f;
    if (v.indexOf('mensual-') === 0) { var d = +v.split('-')[1]; f = new Date(hoy.getFullYear(), hoy.getMonth(), d); if (f < hoy) f = new Date(hoy.getFullYear(), hoy.getMonth() + 1, d); }
    else { var p = v.split('-'); f = new Date(+p[0], +p[1] - 1, +p[2]); }
    var n = Math.round((f - hoy) / 86400000);
    if (n < 0) { el.hidden = true; return; }
    el.querySelector('[data-days]').textContent = n;
    if (n === 1) el.querySelector('.d small').textContent = 'día';
    if (n <= 30) el.classList.add('hot');
    el.querySelector('[data-when]').textContent = (n === 0 ? 'Vence hoy · ' : 'Vence el ') + f.getDate() + ' de ' + MES[f.getMonth()] + ' de ' + f.getFullYear();
  });

  // Asesor SLP: botón interactivo de 3 pasos que arma el mensaje de WhatsApp
  (function () {
    var box = document.querySelector('.asesor'); if (!box) return;
    var panel = box.querySelector('.as-panel'), fab = box.querySelector('.as-fab'), tip = box.querySelector('.as-tip');
    var form = box.querySelector('.as-body'), steps = box.querySelectorAll('.as-step'), prog = box.querySelector('.as-prog span');
    var go = box.querySelector('.as-go'), sum = box.querySelector('.as-sum');
    function ev(n, p) { try { gtag('event', n, p || {}); } catch (e) {} }
    function show(n) { steps.forEach(function (f) { f.hidden = +f.dataset.step !== n; }); prog.style.width = (n / 3 * 100) + '%'; var f = box.querySelector('[data-step="' + n + '"] input'); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 60); }
    function open() { panel.hidden = false; box.dataset.state = 'open'; fab.setAttribute('aria-expanded', 'true'); if (tip) tip.hidden = true; show(1); ev('asesor_open'); }
    function close() { panel.hidden = true; box.dataset.state = 'closed'; fab.setAttribute('aria-expanded', 'false'); }
    document.querySelectorAll('[data-asesor]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); panel.hidden ? open() : close(); }); });
    box.querySelector('.as-close').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) close(); });
    function msg() {
      var d = new FormData(form), need = d.get('need') || 'información', urg = d.get('urg') || '', n = (d.get('nombre') || '').trim(), em = (d.get('empresa') || '').trim();
      var t = 'Hola, Strategic Leverage Partner.' + (n ? ' Soy ' + n + (em ? ', de ' + em : '') + '.' : (em ? ' Escribo de ' + em + '.' : '')) + ' Necesito ayuda con: ' + need + '.' + (urg ? ' Situación: ' + urg + '.' : '') + ' ¿Me pueden dar información?';
      go.href = 'https://wa.me/593995728488?text=' + encodeURIComponent(t);
      sum.textContent = 'Tu consulta: ' + need + (urg ? ' · ' + urg.toLowerCase() : '');
    }
    form.addEventListener('change', function (e) {
      if (e.target.name === 'need') { msg(); show(2); ev('asesor_paso', { paso: 1, valor: e.target.value }); }
      else if (e.target.name === 'urg') { msg(); show(3); ev('asesor_paso', { paso: 2, valor: e.target.value }); }
    });
    form.addEventListener('input', msg);
    box.querySelectorAll('.as-back').forEach(function (b) { b.addEventListener('click', function () { var cur = +b.closest('.as-step').dataset.step; show(cur - 1); }); });
    go.addEventListener('click', function () { msg(); ev('generate_lead', { method: 'asesor_whatsapp' }); });
    // Mensaje de apoyo una sola vez por sesión, tras 14 s de lectura
    var seen = false; try { seen = sessionStorage.getItem('slp_tip') === '1'; } catch (e) {}
    if (tip && !seen) setTimeout(function () { if (panel.hidden) { tip.hidden = false; try { sessionStorage.setItem('slp_tip', '1'); } catch (e) {} } }, 14000);
    if (tip) { tip.querySelector('.as-x').addEventListener('click', function () { tip.hidden = true; }); tip.addEventListener('click', function (e) { if (!e.target.closest('.as-x')) open(); }); }
  })();
  document.querySelectorAll('[data-cta]').forEach(function (a) { a.addEventListener('click', function () { try { gtag('event', 'cta_click', { ubicacion: a.dataset.cta }); } catch (e) {} }); });

  // Medición de clics a WhatsApp
  document.querySelectorAll('a[href*="wa.me"]').forEach(function (a) { a.addEventListener('click', function () { try { gtag('event', 'contact_whatsapp', { link_url: a.href }); } catch (e) {} }); });
})();

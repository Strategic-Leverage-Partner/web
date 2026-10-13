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

  // Medición de clics a WhatsApp
  document.querySelectorAll('a[href*="wa.me"]').forEach(function (a) { a.addEventListener('click', function () { try { gtag('event', 'contact_whatsapp', { link_url: a.href }); } catch (e) {} }); });
})();

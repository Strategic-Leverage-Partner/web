/* SLP · interacción del sitio: cabecera, menú, revelado, video y formulario */
(function () {
  document.documentElement.classList.add('js');
  var head = document.querySelector('.site-head');
  function onScroll() { if (head && !head.classList.contains('always')) head.classList.toggle('solid', window.scrollY > 24); }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  // Versión clara / oscura de la marca
  var root = document.documentElement, tts = document.querySelectorAll('.theme-t'), tt = tts[0], meta = document.querySelector('meta[name="theme-color"]');
  function setTheme(t) {
    if (t === 'light') root.setAttribute('data-theme', 'light'); else root.removeAttribute('data-theme');
    if (meta) meta.setAttribute('content', t === 'light' ? '#F3F6F5' : '#06201B');
    tts.forEach(function (b) { b.setAttribute('aria-label', t === 'light' ? 'Cambiar a versión oscura de la marca' : 'Cambiar a versión clara de la marca'); });
  }
  setTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
  tts.forEach(function (b) { b.addEventListener('click', function () {
    var t = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    setTheme(t); try { localStorage.setItem('slp_theme', t); } catch (e) {}
    try { gtag('event', 'cambio_tema', { tema: t }); } catch (e) {}
  }); });

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
/* 2026g: burbuja de WhatsApp: se presenta sola a los 6 s y al hacer scroll profundo */
(function(){var f=document.querySelector('.wa-float');if(!f)return;var t;function peek(){f.classList.add('peek');clearTimeout(t);t=setTimeout(function(){f.classList.remove('peek')},4200)}
setTimeout(peek,6000);var done=false;window.addEventListener('scroll',function(){if(!done&&window.scrollY>window.innerHeight*1.6){done=true;peek()}},{passive:true});
f.addEventListener('click',function(){try{window.gtag&&gtag('event','click_whatsapp',{ubicacion:'flotante'})}catch(e){}})})();
/* 2026i: atribución de leads (UTM / gclid / fbclid) + píxeles de pauta */
(function(){
  var K='slp_src', now=Date.now(), q=new URLSearchParams(location.search), keys=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','fbclid','li_fat_id','ttclid'];
  var cur={}, has=false; keys.forEach(function(k){var v=q.get(k); if(v){cur[k]=v.slice(0,120); has=true;}});
  var st={}; try{st=JSON.parse(localStorage.getItem(K)||'{}')}catch(e){}
  if(st.t && now-st.t>90*864e5) st={};
  if(has){ cur.landing=location.pathname; cur.t=now; if(!st.first) st.first=cur; st.last=cur; st.t=now; }
  else if(!st.first && document.referrer && document.referrer.indexOf(location.hostname)<0){ var r={utm_source:new URL(document.referrer).hostname,utm_medium:'referral',landing:location.pathname,t:now}; st.first=st.last=r; st.t=now; }
  try{localStorage.setItem(K,JSON.stringify(st))}catch(e){}
  var L=st.last||{}, F=st.first||{};
  function canal(o){ if(!o||!o.utm_source) return ''; if(o.gclid) return 'google/cpc'; if(o.fbclid) return (o.utm_source||'meta')+'/'+(o.utm_medium||'paid'); return o.utm_source+'/'+(o.utm_medium||''); }
  var ref = canal(L) ? (canal(L)+(L.utm_campaign?' · '+L.utm_campaign:'')) : '';
  // Campos ocultos en todos los formularios
  document.querySelectorAll('form.js-w3f').forEach(function(f){
    var add=function(n,v){ if(!v) return; var i=f.querySelector('input[name="'+n+'"]'); if(!i){i=document.createElement('input');i.type='hidden';i.name=n;f.appendChild(i);} i.value=v; };
    keys.forEach(function(k){ add(k, L[k]); }); add('origen_primer_contacto', canal(F)+(F.utm_campaign?' · '+F.utm_campaign:'')); add('pagina', location.pathname);
  });
  // Referencia corta en el mensaje de WhatsApp para saber qué anuncio trajo el lead
  if(ref){ document.addEventListener('click', function(e){ var a=e.target.closest && e.target.closest('a[href*="wa.me"]'); if(!a||a.dataset.refd) return;
    try{ var u=new URL(a.href), t=u.searchParams.get('text')||'Hola, Strategic Leverage Partner.'; a.href=u.origin+u.pathname+'?text='+encodeURIComponent(t+' (Ref: '+ref+')'); a.dataset.refd='1'; }catch(err){} }, true); }
  // Píxeles: se activan solo cuando se configuran los ID (pendiente de SLP)
  var PX={ meta:'', linkedin:'', tiktok:'' };
  if(PX.meta){ !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js'); fbq('init',PX.meta); fbq('track','PageView'); }
  if(PX.linkedin){ window._linkedin_partner_id=PX.linkedin; window._linkedin_data_partner_ids=[PX.linkedin]; var s=document.createElement('script'); s.async=true; s.src='https://snap.licdn.com/li.lms-analytics/insight.min.js'; document.head.appendChild(s); }
  function conv(tipo){ try{ window.fbq && fbq('track', tipo==='wa'?'Contact':'Lead'); }catch(e){} try{ window.lintrk && lintrk('track'); }catch(e){} }
  document.addEventListener('click', function(e){ var a=e.target.closest && e.target.closest('a[href*="wa.me"]'); if(a) conv('wa'); }, true);
  document.querySelectorAll('form.js-w3f').forEach(function(f){ f.addEventListener('submit', function(){ if(f.checkValidity()) conv('form'); }); });
})();

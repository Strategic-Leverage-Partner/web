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
      var gerr = window.slpGuard ? window.slpGuard(form) : ''; if (gerr) { msg.className = 'msg err'; msg.textContent = gerr; return; }
      btn.disabled = true; btn.firstChild.textContent = 'Enviando… ';
      fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(form) })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (!d.success) throw new Error(d.message || 'error');
          msg.className = 'msg ok'; msg.textContent = form.getAttribute('data-ok') || 'Gracias, recibimos tus datos.'; form.reset(); try { form.dispatchEvent(new CustomEvent('slp:ok')); } catch (e) {}
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
    var ds = el.querySelector('.d small'); if (n === 1 && ds) ds.textContent = 'día';
    if (n <= 30) el.classList.add('hot');
    var wh = el.querySelector('[data-when]'); if (wh) wh.textContent = (n === 0 ? 'Vence hoy · ' : 'Vence el ') + f.getDate() + ' de ' + MES[f.getMonth()] + ' de ' + f.getFullYear();
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
  var PX={ meta:'', linkedin:'', tiktok:'' }; var CK=false; try{CK=localStorage.getItem('slp_ck')==='ok'}catch(e){} if(!CK){PX.meta='';PX.linkedin='';}
  if(PX.meta){ !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js'); fbq('init',PX.meta); fbq('track','PageView'); }
  if(PX.linkedin){ window._linkedin_partner_id=PX.linkedin; window._linkedin_data_partner_ids=[PX.linkedin]; var s=document.createElement('script'); s.async=true; s.src='https://snap.licdn.com/li.lms-analytics/insight.min.js'; document.head.appendChild(s); }
  function conv(tipo){ try{ window.fbq && fbq('track', tipo==='wa'?'Contact':'Lead'); }catch(e){} try{ window.lintrk && lintrk('track'); }catch(e){} }
  document.addEventListener('click', function(e){ var a=e.target.closest && e.target.closest('a[href*="wa.me"]'); if(a) conv('wa'); }, true);
  document.querySelectorAll('form.js-w3f').forEach(function(f){ f.addEventListener('submit', function(){ if(f.checkValidity()) conv('form'); }); });
})();

/* 2026k: seguridad de formularios y acceso protegido a descargas */
(function(){
  var T0=Date.now();
  var DISP=/@(mailinator|guerrillamail|10minutemail|tempmail|temp-mail|yopmail|trashmail|sharklasers|getnada|dispostable|maildrop|fakeinbox|throwawaymail|mohmal|emailondeck|mintemail|spamgourmet|moakt|tempr|discard)\./i;
  var FREE=/@(gmail|hotmail|outlook|live|yahoo|icloud|aol|proton|protonmail)\./i;
  function rucOk(v){ v=(v||'').replace(/\D/g,''); if(!/^\d{13}$/.test(v)) return ''; var pr=+v.slice(0,2), t=+v[2];
    if(!((pr>=1&&pr<=24)||pr===30)) return ''; if(!/001$/.test(v.slice(10))&&v.slice(10)!=='001') { if(!/00[1-9]$/.test(v.slice(10))) return ''; }
    if(t<6) return 'persona natural'; if(t===6) return 'entidad pública'; if(t===9) return 'sociedad privada'; return ''; }
  function telOk(v){ v=(v||'').replace(/[\s\-()]/g,''); return /^(\+?593|0)9\d{8}$/.test(v)||/^(\+?593|0)[2-7]\d{7}$/.test(v); }
  function setH(f,n,v){ var i=f.querySelector('input[name="'+n+'"]'); if(!i){i=document.createElement('input');i.type='hidden';i.name=n;f.appendChild(i);} i.value=v; }
  window.slpGuard=function(f){
    if(Date.now()-T0<4000) return 'Por seguridad, revisa tus datos unos segundos antes de enviar.';
    var k='slp_sends', d=new Date().toISOString().slice(0,10), st={}; try{st=JSON.parse(localStorage.getItem(k)||'{}')}catch(e){}
    if(st.d===d && st.n>=5) return 'Alcanzaste el límite de envíos de hoy. Escríbenos por WhatsApp +593 99 572 8488.';
    var em=f.querySelector('input[type=email]'); if(em&&em.value){ if(DISP.test(em.value)) return 'Usa un correo real de trabajo; no aceptamos correos temporales.'; setH(f,'correo_tipo',FREE.test(em.value)?'gratuito':'corporativo'); }
    var tel=f.querySelector('input[name=telefono]'); if(tel&&tel.value&&!telOk(tel.value)) return 'Ingresa un teléfono válido de Ecuador (ej. 0991234567 o +593991234567).';
    var nm=f.querySelector('input[name=nombre]'); if(nm&&nm.value&&nm.value.trim().split(/\s+/).length<2) return 'Escribe tu nombre y apellido.';
    var ru=f.querySelector('input[name=ruc]'); if(ru){ var tp=rucOk(ru.value); if(!tp) return 'El RUC no es válido: debe tener 13 dígitos y corresponder a un contribuyente de Ecuador.'; setH(f,'ruc_tipo',tp); }
    setH(f,'segundos_en_formulario',String(Math.round((Date.now()-T0)/1000)));
    try{ localStorage.setItem(k,JSON.stringify({d:d,n:(st.d===d?st.n:0)+1})) }catch(e){}
    return '';
  };
  // Acceso a descargas
  var docs=document.querySelector('.docs[data-base]'), gf=document.getElementById('gate-form'); if(!docs||!gf) return;
  var KEY='slp_rec_ok', base=docs.getAttribute('data-base');
  function ok(){ try{ var t=+localStorage.getItem(KEY)||0; return t && Date.now()-t<180*864e5; }catch(e){ return false; } }
  function unlock(){ document.querySelectorAll('.gate-btn').forEach(function(b){ b.classList.add('open'); }); document.documentElement.classList.add('rec-ok'); }
  if(ok()) unlock();
  gf.addEventListener('slp:ok',function(){ try{localStorage.setItem(KEY,String(Date.now()))}catch(e){} unlock(); try{gtag('event','generate_lead',{method:'registro_recursos'})}catch(e){} });
  document.querySelectorAll('.gate-btn').forEach(function(b){ b.addEventListener('click',function(){
    if(!ok()){ gf.scrollIntoView({behavior:'smooth',block:'start'}); var m=gf.querySelector('.msg'); m.className='msg'; m.textContent='Registra tu empresa una sola vez para activar todas las descargas.'; setTimeout(function(){ var i=gf.querySelector('input:not([type=hidden]):not(.hp)'); i&&i.focus({preventScroll:true}); },600); return; }
    var a=document.createElement('a'); a.href=base+b.dataset.f; a.download=b.dataset.f; document.body.appendChild(a); a.click(); a.remove();
    try{gtag('event','file_download',{file_name:b.dataset.recurso})}catch(e){}
  }); });
})();

/* 2026o: aviso de cookies (LOPDP) con Consent Mode v2 */
(function(){
  var K='slp_ck', v=null; try{v=localStorage.getItem(K)}catch(e){}
  function upd(ok){ try{gtag('consent','update',{ad_storage:ok?'granted':'denied',analytics_storage:ok?'granted':'denied',ad_user_data:ok?'granted':'denied',ad_personalization:ok?'granted':'denied'})}catch(e){} }
  function bar(){
    if(document.getElementById('ck-bar')) return;
    var d=document.createElement('div'); d.id='ck-bar'; d.setAttribute('role','dialog'); d.setAttribute('aria-live','polite'); d.setAttribute('aria-label','Preferencias de cookies');
    d.innerHTML='<p><b>Tu privacidad importa.</b> Usamos almacenamiento necesario para que el sitio funcione y, solo si lo aceptas, cookies analíticas y de medición publicitaria. Puedes cambiar tu decisión cuando quieras. <a href="/privacidad/#cookies">Más información</a></p><div class="ck-acts"><button type="button" class="btn ghost ck-no">Solo necesarias</button><button type="button" class="btn ck-yes">Aceptar</button></div>';
    document.body.appendChild(d);
    d.querySelector('.ck-yes').onclick=function(){ try{localStorage.setItem(K,'ok')}catch(e){} upd(true); d.remove(); };
    d.querySelector('.ck-no').onclick=function(){ try{localStorage.setItem(K,'no')}catch(e){} upd(false); d.remove(); };
  }
  if(v!=='ok'&&v!=='no') setTimeout(bar,900);
  document.querySelectorAll('.ck-open').forEach(function(b){ b.addEventListener('click',function(){ try{localStorage.removeItem(K)}catch(e){} bar(); }); });
})();
/* 2026s: banners rotativos de portada (accesibles, con pausa, swipe y sin animación si el usuario lo prefiere) */
(function(){
  var hs=document.querySelector('[data-hs]'); if(!hs) return;
  var S=[].slice.call(hs.querySelectorAll('.hs-slide')), dots=hs.querySelector('.hs-dots'), bar=hs.querySelector('.hs-bar span'), pb=hs.querySelector('.hs-pause');
  var i=0, T=8000, t0=0, raf=0, paused=false, hover=false;
  var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches; if(RM) paused=true;
  S.forEach(function(s,k){ var b=document.createElement('button'); b.type='button'; b.setAttribute('role','tab'); b.setAttribute('aria-label','Ver banner '+(k+1)); b.onclick=function(){go(k,true)}; dots.appendChild(b); });
  var D=[].slice.call(dots.children);
  function focusables(s,on){ s.querySelectorAll('a,button').forEach(function(a){ if(on) a.removeAttribute('tabindex'); else a.setAttribute('tabindex','-1'); }); }
  function go(n,user){ S[i].classList.remove('on'); S[i].setAttribute('aria-hidden','true'); focusables(S[i],false); D[i].removeAttribute('aria-selected');
    i=(n+S.length)%S.length; S[i].classList.add('on'); S[i].removeAttribute('aria-hidden'); focusables(S[i],true); D[i].setAttribute('aria-selected','true');
    hs.setAttribute('data-tone',S[i].getAttribute('data-tone')); t0=performance.now();
    if(user){ try{gtag('event','banner_click',{banner:S[i].getAttribute('data-tone')})}catch(e){} } }
  function loop(now){ if(!paused&&!hover&&!document.hidden){ var p=Math.min(1,(now-t0)/T); bar.style.transform='scaleX('+p+')'; if(p>=1) go(i+1); } else { t0=now-(parseFloat((bar.style.transform.match(/[\d.]+/)||[0])[0])*T); } raf=requestAnimationFrame(loop); }
  S.slice(1).forEach(function(s){focusables(s,false)}); D[0].setAttribute('aria-selected','true'); hs.setAttribute('data-tone','marca'); t0=performance.now();
  hs.querySelector('.hs-prev').onclick=function(){go(i-1,true)}; hs.querySelector('.hs-next').onclick=function(){go(i+1,true)};
  pb.onclick=function(){ paused=!paused; pb.textContent=paused?'▶':'❚❚'; pb.setAttribute('aria-label',paused?'Reproducir':'Pausar'); };
  if(paused){ pb.textContent='▶'; pb.setAttribute('aria-label','Reproducir'); }
  hs.addEventListener('mouseenter',function(){hover=true}); hs.addEventListener('mouseleave',function(){hover=false});
  hs.addEventListener('focusin',function(){hover=true}); hs.addEventListener('focusout',function(){hover=false});
  var x0=null; hs.addEventListener('touchstart',function(e){x0=e.touches[0].clientX},{passive:true});
  hs.addEventListener('touchend',function(e){ if(x0===null) return; var dx=e.changedTouches[0].clientX-x0; if(Math.abs(dx)>50) go(i+(dx<0?1:-1),true); x0=null; },{passive:true});
  hs.addEventListener('keydown',function(e){ if(e.key==='ArrowRight') go(i+1,true); if(e.key==='ArrowLeft') go(i-1,true); });
  raf=requestAnimationFrame(loop);
})();
/* 2026u: relieve 3D suave en tarjetas al mover el mouse */
(function(){
  if(window.matchMedia&&(matchMedia('(prefers-reduced-motion: reduce)').matches||!matchMedia('(hover:hover)').matches)) return;
  document.querySelectorAll('.unit,.city,.gcard,.hs-card').forEach(function(c){
    c.addEventListener('mousemove',function(e){ var r=c.getBoundingClientRect(), x=(e.clientX-r.left)/r.width, y=(e.clientY-r.top)/r.height;
      c.style.setProperty('--mx',(x*100)+'%'); c.style.setProperty('--my',(y*100)+'%');
      c.style.transform='perspective(900px) rotateX('+((.5-y)*5).toFixed(2)+'deg) rotateY('+((x-.5)*6).toFixed(2)+'deg) translateY(-3px)'; });
    c.addEventListener('mouseleave',function(){ c.style.transform=''; });
  });
})();

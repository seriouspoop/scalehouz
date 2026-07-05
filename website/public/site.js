/* Scale Houz website — interaction layer.
   Motion uses transform/opacity/filter only. Respects prefers-reduced-motion. */
(function () {
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(pointer: fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- split manifesto into words (for stagger) ---------- */
  $$('.mline[data-split]').forEach(function (line) {
    var kids = Array.prototype.slice.call(line.childNodes);
    line.innerHTML = '';
    kids.forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (tok) {
          if (tok.trim() === '') { line.appendChild(document.createTextNode(tok)); return; }
          var w = document.createElement('span'); w.className = 'word'; w.textContent = tok; line.appendChild(w);
        });
      } else {
        node.classList.add('word'); line.appendChild(node);
      }
    });
  });
  /* lines without data-split: wrap whole content as one word unit */
  $$('.mline:not([data-split])').forEach(function (line) {
    var inner = line.innerHTML; line.innerHTML = '<span class="word">' + inner + '</span>';
  });
  var wordDelay = 0.045;
  $$('.mline').forEach(function (line) {
    $$('.word', line).forEach(function (w, i) { w.style.transitionDelay = (i * wordDelay) + 's'; });
  });

  /* ---------- marquees ---------- */
  var WORDS = ['Brand strategy', 'Visual identity', 'Digital experience', 'Web design', 'SEO & growth', 'Creative planning', 'Operational clarity', 'Consulting'];
  var mqHTML = WORDS.map(function (w) { return '<span class="mq-word">' + w.replace(/&/g, '&amp;') + '</span>'; }).join('');
  ['#mq-1', '#mq-1b', '#mq-2', '#mq-2b'].forEach(function (id) { var el = $(id); if (el) el.innerHTML = mqHTML; });

  var lenis = null;
  var runPlanetIntro = null;
  function startHero() {
    document.body.classList.add('hero-ready');
    if (runPlanetIntro) runPlanetIntro();
  }
  startHero();

  /* ---------- Lenis smooth scroll ---------- */
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    lenis.on('scroll', onScroll);
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var t = document.querySelector(id);
        if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: 0 }); }
      });
    });
  }

  /* ---------- scroll progress + nav + parallax ---------- */
  var progress = $('#progress');
  var header = $('header');
  var parallaxEls = $$('[data-parallax]');
  var heroInner = $('.hero-inner');
  var planetScene = $('#planet-scene');
  var introScale = 1;
  var ticking = false;
  function render() {
    var y = window.scrollY || window.pageYOffset;
    var max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    header.classList.toggle('solid', y > 40);
    if (!reduced) {
      if (y < innerHeight * 1.3) {
        parallaxEls.forEach(function (el) {
          var speed = parseFloat(el.dataset.parallax) || 0;
          el.style.transform = 'translateY(' + (y * speed / 100) + 'px)';
        });
      }
      if (heroInner && y < innerHeight) {
        var p = y / innerHeight;
        heroInner.style.transform = 'translateY(' + (-y * 0.32) + 'px)';
        heroInner.style.opacity = Math.max(0, 1 - p * 1.35);
      }
      if (planetScene && y < innerHeight * 1.2) {
        var hp = y / innerHeight;
        planetScene.style.transform = 'translateY(calc(-50% + ' + (y * 0.14) + 'px)) scale(' + ((1 + hp * 0.14) * introScale) + ')';
      }
    }
    ticking = false;
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(render); } }
  addEventListener('scroll', onScroll, { passive: true });
  render();

  runPlanetIntro = function () {
    if (reduced || !planetScene) return;
    var start = null, dur = 950;
    introScale = 0.68;
    function step(t) {
      if (start === null) start = t;
      var k = Math.min(1, (t - start) / dur);
      introScale = 0.68 + 0.32 * (1 - Math.pow(1 - k, 3));
      render();
      if (k < 1) requestAnimationFrame(step);
      else introScale = 1;
    }
    requestAnimationFrame(step);
  };
  if (document.body.classList.contains('hero-ready')) runPlanetIntro();

  /* ---------- intersection reveals ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.16 });
  $$('.reveal, .f-divider').forEach(function (el) { io.observe(el); });

  /* ---------- manifesto scroll-linked ---------- */
  var mio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { e.target.classList.toggle('lit', e.isIntersecting); });
  }, { rootMargin: '-28% 0px -28% 0px' });
  $$('.mline').forEach(function (el) { mio.observe(el); });

  /* ---------- animated counters ---------- */
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function runCount(el) {
    var target = parseFloat(el.dataset.count);
    var dec = parseInt(el.dataset.dec || '0', 10);
    if (reduced) { el.textContent = target.toFixed(dec); return; }
    var dur = 1500, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = (target * easeOutCubic(p)).toFixed(dec);
      if (p < 1) requestAnimationFrame(step); else el.textContent = target.toFixed(dec);
    }
    requestAnimationFrame(step);
  }
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); } });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(function (el) { cio.observe(el); });

  /* ---------- custom cursor ---------- */
  if (fine && !reduced) {
    var dot = $('#cursor'), ring = $('#cursor-ring');
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
    });
    (function ringLoop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      requestAnimationFrame(ringLoop);
    })();
    $$('[data-cursor]').forEach(function (el) {
      el.addEventListener('mouseenter', function () { document.body.classList.add('cursor-lg'); });
      el.addEventListener('mouseleave', function () { document.body.classList.remove('cursor-lg'); });
    });
  }

  /* ---------- project image reveal (cursor-following) ---------- */
  if (fine && !reduced) {
    var reveal = $('#proj-reveal'), rv = $('.rv', reveal);
    var tx = 0, ty = 0, cx = 0, cy = 0, active = false;
    $$('.proj').forEach(function (p) {
      p.addEventListener('mouseenter', function () {
        active = true;
        document.body.classList.add('reveal-on');
        reveal.style.background = p.dataset.color || 'var(--sh-cyan)';
        rv.textContent = p.dataset.reveal || '';
      });
      p.addEventListener('mouseleave', function () { active = false; document.body.classList.remove('reveal-on'); });
    });
    addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; });
    (function rvLoop() {
      cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
      if (active) reveal.style.top = cy + 'px', reveal.style.left = cx + 'px';
      requestAnimationFrame(rvLoop);
    })();
  }

  /* ---------- magnetic buttons ---------- */
  if (fine && !reduced) {
    $$('#magnet-zone').forEach(function (zone) {
      var btn = $('#magnet', zone);
      zone.addEventListener('mousemove', function (e) {
        var r = zone.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = 'translate(' + dx * 0.28 + 'px,' + dy * 0.34 + 'px)';
      });
      zone.addEventListener('mouseleave', function () { btn.style.transform = ''; });
    });
    var heroBtn = $('#hero-book');
    if (heroBtn) {
      heroBtn.addEventListener('mousemove', function (e) {
        var r = heroBtn.getBoundingClientRect();
        heroBtn.style.transform = 'translate(' + (e.clientX - (r.left + r.width / 2)) * 0.25 + 'px,' + (e.clientY - (r.top + r.height / 2)) * 0.3 + 'px)';
      });
      heroBtn.addEventListener('mouseleave', function () { heroBtn.style.transform = ''; });
    }
  }

  /* ---------- hero orbs follow mouse ---------- */
  if (!reduced && fine) {
    var orbA = $('#orb-a'), orbB = $('#orb-b');
    var omx = 0, omy = 0, ax = 0, ay = 0, bx = 0, by = 0, oraf = null;
    function otick() {
      ax += (omx - ax) * 0.045; ay += (omy - ay) * 0.045;
      bx += (-omx - bx) * 0.03; by += (-omy - by) * 0.03;
      orbA.style.transform = 'translate(' + ax * 46 + 'px,' + ay * 34 + 'px)';
      orbB.style.transform = 'translate(' + bx * 36 + 'px,' + by * 26 + 'px)';
      if (Math.abs(omx - ax) + Math.abs(omy - ay) > 0.001) oraf = requestAnimationFrame(otick); else oraf = null;
    }
    $('#hero').addEventListener('mousemove', function (e) {
      omx = (e.clientX / innerWidth) * 2 - 1; omy = (e.clientY / innerHeight) * 2 - 1;
      if (!oraf) oraf = requestAnimationFrame(otick);
    });
  }

  /* ---------- service cards: click to expand deliverables ---------- */
  $$('.scard').forEach(function (card) {
    var btn = $('.s-explore', card);
    if (!btn) return;
    btn.addEventListener('click', function () {
      var open = card.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.firstChild.textContent = open ? 'Hide deliverables ' : 'Explore deliverables ';
    });
  });

  /* ---------- service canvas: blob reacts to cursor ---------- */
  if (fine && !reduced) {
    $$('.scard').forEach(function (card) {
      var canvas = $('.s-canvas', card);
      if (!canvas) return;
      var blobs = $$('.cv-blob', canvas);
      canvas.addEventListener('mousemove', function (e) {
        var r = canvas.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        blobs.forEach(function (b, i) {
          var m = i === 0 ? 26 : -20;
          b.style.transform = 'translate(' + dx * m + 'px,' + dy * m + 'px) scale(1.12)';
        });
      });
      canvas.addEventListener('mouseleave', function () {
        blobs.forEach(function (b) { b.style.transform = ''; });
      });
    });
  }

  /* ---------- hero 3D planet orbit ---------- */
  (function () {
    var scene = $('#planet-scene');
    if (!scene) return;
    var words = $$('.pw', scene);
    if (!words.length) return;
    var n = words.length;
    var TILT = 0.42;
    function place(theta, i) {
      var w = words[i];
      var R = scene.clientWidth * 0.46;
      var x = R * Math.sin(theta);
      var yy = -R * Math.cos(theta) * Math.sin(TILT);
      var depth = Math.cos(theta) * Math.cos(TILT);
      var scale = 0.72 + (depth + 1) / 2 * 0.5;
      var opacity = 0.32 + (depth + 1) / 2 * 0.68;
      w.style.transform = 'translate(-50%,-50%) translate3d(' + x + 'px,' + yy + 'px,0) scale(' + scale + ')';
      w.style.opacity = opacity;
      w.style.zIndex = Math.round(depth * 100) + 100;
    }
    if (reduced) {
      for (var i = 0; i < n; i++) place(i * (Math.PI * 2 / n), i);
      return;
    }
    var t = 0, last = performance.now();
    (function loop(now) {
      var dt = Math.min((now - last) / 1000, 0.05); last = now;
      t += dt * 0.5;
      for (var i = 0; i < n; i++) place(t + i * (Math.PI * 2 / n), i);
      requestAnimationFrame(loop);
    })(last);
  })();
})();

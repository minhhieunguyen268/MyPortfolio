/* global document, window, navigator, HTMLElement, IntersectionObserver */
'use strict';

// ─── HELPERS ────────────────────────────────────
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.from((r || document).querySelectorAll(s)); }

function safeJson(text, fallback) {
  try { return JSON.parse(text); } catch (_) { return fallback; }
}

function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

// ─── SCROLL PROGRESS ────────────────────────────
function initScrollProgress() {
  var fill = document.getElementById('scrollFill');
  if (!fill) return;
  function update() {
    var doc = document.documentElement;
    var top = doc.scrollTop || document.body.scrollTop || 0;
    var h   = doc.scrollHeight - doc.clientHeight;
    var p   = h > 0 ? (top / h) * 100 : 0;
    fill.style.width = Math.min(100, Math.max(0, p)) + '%';
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

// ─── HEADER SCROLL STATE ─────────────────────────
function initHeader() {
  var header = document.getElementById('header');
  if (!header) return;
  function update() {
    if (window.scrollY > 30) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
}

// ─── MOBILE NAV ──────────────────────────────────
function initMobileNav() {
  var btn    = document.getElementById('menuBtn');
  var drawer = document.getElementById('mobileNav');
  if (!btn || !drawer) return;

  var open = false;

  function setOpen(v) {
    open = v;
    btn.setAttribute('aria-expanded', v ? 'true' : 'false');
    drawer.setAttribute('aria-hidden', v ? 'false' : 'true');
    if (v) drawer.classList.add('open');
    else   drawer.classList.remove('open');
  }

  btn.addEventListener('click', function() { setOpen(!open); });

  $$('[data-mob]').forEach(function(a) {
    a.addEventListener('click', function() { setOpen(false); });
  });

  window.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') setOpen(false);
  });

  setOpen(false);
}

// ─── SCROLL SPY ──────────────────────────────────
function initScrollSpy() {
  var navItems = $$('.nav-item[data-nav]');
  if (!navItems.length || !('IntersectionObserver' in window)) return;

  var sections = navItems.map(function(a) {
    var id = (a.getAttribute('href') || '').replace('#', '');
    return document.getElementById(id);
  }).filter(Boolean);

  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var id = entry.target.id;
      navItems.forEach(function(a) {
        var href = (a.getAttribute('href') || '').replace('#', '');
        if (href === id) a.classList.add('active');
        else a.classList.remove('active');
      });
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

  sections.forEach(function(s) { io.observe(s); });
}

// ─── REVEAL ON SCROLL ────────────────────────────
function initReveal() {
  var items = $$('.reveal');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach(function(el) { el.classList.add('in-view'); });
    return;
  }

  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  items.forEach(function(el) { io.observe(el); });
}

// ─── SKILL BAR ANIMATION ─────────────────────────
function initSkillBars() {
  var bars = $$('.skill-fill');
  if (!bars.length || !('IntersectionObserver' in window)) {
    bars.forEach(function(b) { b.classList.add('animated'); });
    return;
  }

  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var fills = $$('.skill-fill', entry.target.closest('.skills-layout'));
      if (!fills.length) fills = [entry.target];
      fills.forEach(function(b, i) {
        setTimeout(function() { b.classList.add('animated'); }, i * 80);
      });
      io.unobserve(entry.target);
    });
  }, { threshold: 0.3 });

  var firstBar = bars[0];
  if (firstBar) io.observe(firstBar);
}

// ─── COUNTER ANIMATION ───────────────────────────
function initCounters() {
  var counters = $$('[data-count]');
  if (!counters.length || !('IntersectionObserver' in window)) return;

  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var duration = 900;
    var start = performance.now();
    function step(now) {
      var progress = Math.min((now - start) / duration, 1);
      var ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(ease * target);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      animateCount(entry.target);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  counters.forEach(function(el) { io.observe(el); });
}

// ─── CUSTOM CURSOR ───────────────────────────────
function initCursor() {
  var cursor = document.getElementById('cursor');
  if (!cursor) return;

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isCoarse = window.matchMedia('(pointer: coarse)').matches;
  if (prefersReduced || isCoarse) { cursor.style.display = 'none'; return; }

  var dot  = cursor.querySelector('.cursor-dot');
  var ring = cursor.querySelector('.cursor-ring');
  if (!dot || !ring) return;

  var mx = -200, my = -200;
  var rx = -200, ry = -200;
  var raf;

  function loop() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    cursor.style.transform = 'translate(' + mx + 'px, ' + my + 'px)';
    ring.style.transform = 'translate(calc(' + (rx - mx) + 'px - 50%), calc(' + (ry - my) + 'px - 50%))';
    raf = requestAnimationFrame(loop);
  }

  window.addEventListener('pointermove', function(e) {
    mx = e.clientX; my = e.clientY;
  }, { passive: true });

  document.addEventListener('pointerenter', function(e) {
    var target = e.target;
    var interactive = target && target.closest
      ? target.closest('a, button, [role="button"], .project-card, .about-card, .cert-card, .contact-channel')
      : null;
    if (interactive) document.body.classList.add('cursor-hover');
    else document.body.classList.remove('cursor-hover');
  }, true);

  document.addEventListener('pointerleave', function() {
    document.body.classList.remove('cursor-hover');
  }, true);

  loop();
}

// ─── COPY EMAIL ──────────────────────────────────
function initCopyButtons() {
  $$('[data-copy]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var value = btn.getAttribute('data-copy') || '';
      if (!value) return;

      var clip = navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function'
        ? navigator.clipboard : null;

      if (!clip) { window.location.href = 'mailto:' + value; return; }

      clip.writeText(value).then(function() {
        var prev = btn.textContent;
        btn.textContent = '✓ Đã copy!';
        btn.style.color = 'var(--a0)';
        setTimeout(function() {
          btn.textContent = prev;
          btn.style.color = '';
        }, 1800);
      }, function() {
        window.location.href = 'mailto:' + value;
      });
    });
  });
}

// ─── PROJECT CARDS ───────────────────────────────
function renderProjects() {
  var mount = document.getElementById('projectsGrid');
  if (!mount) return;

  var dataEl = document.getElementById('projectsData');
  var projects = safeJson(dataEl ? dataEl.textContent : '[]', []);

  mount.innerHTML = projects.map(function(p, i) {
    var stackTags = (p.stack || []).map(function(t) {
      return '<span>' + esc(t) + '</span>';
    }).join('');

    return (
      '<article class="project-card reveal" style="--d:' + (i * 60) + 'ms">' +
        '<div class="project-card-top">' +
          '<span class="project-category">' + esc(p.category || 'Project') + '</span>' +
          '<span class="project-year">' + esc(p.year || '') + '</span>' +
        '</div>' +
        '<h3 class="project-title">' + esc(p.title || '') + '</h3>' +
        '<p class="project-desc">' + esc(p.description || '') + '</p>' +
        (stackTags ? '<div class="project-stack">' + stackTags + '</div>' : '') +
        '<div class="project-footer">' +
          '<button class="project-detail-btn" type="button" data-open="' + i + '">' +
            'Details' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>' +
          '</button>' +
        '</div>' +
      '</article>'
    );
  }).join('');

  // Re-observe newly added .reveal elements
  initReveal();

  // Wire open buttons
  mount.addEventListener('click', function(e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var btn = t.closest('[data-open]');
    if (!btn) return;
    var idx = parseInt(btn.getAttribute('data-open'), 10);
    openModal(projects[idx]);
  });
}

// ─── MODAL ───────────────────────────────────────
function openModal(p) {
  var modal   = document.getElementById('projectModal');
  if (!modal || !p) return;

  var titleEl = document.getElementById('modalTitle');
  var descEl  = document.getElementById('modalDesc');
  var hlEl    = document.getElementById('modalHighlights');
  var stackEl = document.getElementById('modalStack');
  var actEl   = document.getElementById('modalActions');

  if (titleEl) titleEl.textContent = p.title || '';
  if (descEl)  descEl.textContent  = p.description || '';

  if (hlEl) {
    hlEl.innerHTML = (p.highlights || []).map(function(h) {
      return '<li>' + esc(h) + '</li>';
    }).join('');
  }

  if (stackEl) {
    stackEl.innerHTML = (p.stack || []).map(function(t) {
      return '<span>' + esc(t) + '</span>';
    }).join('');
  }

  if (actEl) {
    var links = p.links || {};
    var chips = [
      links.demo ? '<a class="btn-outline" href="' + esc(links.demo) + '" target="_blank" rel="noreferrer">Demo ↗</a>' : '',
      links.case ? '<a class="btn-outline" href="' + esc(links.case) + '" target="_blank" rel="noreferrer">Case study ↗</a>' : '',
      links.repo ? '<a class="btn-outline" href="' + esc(links.repo) + '" target="_blank" rel="noreferrer">Repo ↗</a>' : '',
    ].filter(Boolean).join('');

    actEl.innerHTML = chips || '<span class="modal-no-links">Links not available — will be updated later.</span>';
  }

  if (typeof modal.showModal === 'function') modal.showModal();
  else { modal.removeAttribute('hidden'); }

  document.body.style.overflow = 'hidden';
}

function closeModal() {
  var modal = document.getElementById('projectModal');
  if (!modal) return;
  if (typeof modal.close === 'function') modal.close();
  else modal.setAttribute('hidden', '');
  document.body.style.overflow = '';
}

function initModal() {
  var modal     = document.getElementById('projectModal');
  var closeBtn  = document.getElementById('modalClose');
  if (!modal) return;

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeModal();
  });

  modal.addEventListener('cancel', function(e) {
    e.preventDefault();
    closeModal();
  });

  window.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
  });
}

// ─── YEAR ────────────────────────────────────────
function initYear() {
  var el = document.getElementById('footerYear');
  if (el) el.textContent = String(new Date().getFullYear());
}

// ─── SMOOTH ANCHOR ───────────────────────────────
function initAnchors() {
  document.addEventListener('click', function(e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var target = id ? document.getElementById(id) : null;
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
    // update URL without jump
    history.pushState(null, '', '#' + id);
  });
}

// ─── HOVER SHINE ON CARDS ────────────────────────
function initCardShine() {
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  document.addEventListener('pointermove', function(e) {
    var card = e.target && e.target.closest
      ? e.target.closest('.project-card, .skill-group, .about-card, .cert-card, .contact-card')
      : null;
    if (!card) return;
    var r  = card.getBoundingClientRect();
    var x  = ((e.clientX - r.left) / r.width)  * 100;
    var y  = ((e.clientY - r.top)  / r.height) * 100;
    card.style.setProperty('--shine-x', x.toFixed(1) + '%');
    card.style.setProperty('--shine-y', y.toFixed(1) + '%');
  }, { passive: true });
}

// ─── INIT ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  initYear();
  initScrollProgress();
  initHeader();
  initMobileNav();
  initScrollSpy();
  renderProjects();
  initModal();
  initReveal();
  initSkillBars();
  initCounters();
  initCursor();
  initCopyButtons();
  initAnchors();
  initCardShine();
});

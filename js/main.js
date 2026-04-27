// ============================================================
// Animesh Sinha — Portfolio JS
// Nav shadow · scroll reveals · cursor glow · terminal · stats
// ============================================================

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- Nav shadow on scroll ---------------------------------------------------
const nav = document.querySelector('nav');
if (nav) {
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// --- Reveal on scroll -------------------------------------------------------
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && reveals.length) {
  const io = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    }),
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  reveals.forEach(el => io.observe(el));
} else {
  reveals.forEach(el => el.classList.add('visible'));
}

// --- Cursor-follow glow on hero --------------------------------------------
const glow = document.getElementById('heroGlow');
const hero = document.querySelector('.hero');
if (glow && hero && !reduced && window.matchMedia('(pointer: fine)').matches) {
  let raf = null, tx = 0, ty = 0;
  hero.addEventListener('mousemove', e => {
    const rect = hero.getBoundingClientRect();
    tx = e.clientX - rect.left - 270;
    ty = e.clientY - rect.top - 270;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      glow.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      raf = null;
    });
  });
  hero.addEventListener('mouseleave', () => {
    glow.style.transform = 'translate3d(-9999px, -9999px, 0)';
  });
}

// --- Live BLR clock (terminal + footer) -------------------------------------
const clockEls = [document.getElementById('termClock'), document.getElementById('footClock')].filter(Boolean);
if (clockEls.length) {
  const tick = () => {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const text = `${hh}:${mm} IST`;
    clockEls.forEach(el => el.textContent = text);
  };
  tick();
  setInterval(tick, 30 * 1000);
}

// --- Footer: last commit from GitHub API ------------------------------------
const commitEl = document.getElementById('footCommit');
if (commitEl) {
  const fmt = (iso) => {
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60)        return 'just now';
    if (diff < 3600)      return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400)     return `${Math.floor(diff/3600)}h ago`;
    if (diff < 86400*30)  return `${Math.floor(diff/86400)}d ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  fetch('https://api.github.com/repos/Animesh98/portfolio/commits?per_page=1', {
    headers: { Accept: 'application/vnd.github+json' }
  })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(data => {
      const c = data?.[0];
      if (!c) throw new Error();
      const when = fmt(c.commit.author.date);
      commitEl.innerHTML = `last shipped <a href="https://github.com/Animesh98/portfolio/commit/${c.sha}" target="_blank" rel="noopener">${when}</a>`;
    })
    .catch(() => { commitEl.textContent = ''; });
}

// --- Terminal: typing prompt rotation ---------------------------------------
const typedEl = document.getElementById('termTyped');
const nowEl = document.getElementById('termNow');
if (typedEl && !reduced) {
  const queue = [
    { line: 'help()', out: 'commands: now() · stack() · status() · contact()' },
    { line: 'contact()', out: 'animesh09021998@gmail.com · github.com/Animesh98' },
    { line: 'now()',     out: '— career prep platform · full-stack resume intelligence' },
    { line: 'now()',     out: '— building llama 3.1 8b · sft → dpo' },
  ];
  let i = 0;

  const typeLine = (text, done) => {
    let n = 0;
    typedEl.textContent = '';
    const step = () => {
      typedEl.textContent = text.slice(0, ++n);
      if (n < text.length) setTimeout(step, 55 + Math.random() * 35);
      else setTimeout(done, 900);
    };
    step();
  };

  const cycle = () => {
    const item = queue[i % queue.length];
    i++;
    typeLine(item.line, () => {
      typedEl.textContent = '';
      if (item.out && nowEl && item.line === 'now()') {
        nowEl.textContent = item.out;
      }
      setTimeout(cycle, 1700);
    });
  };
  setTimeout(cycle, 1200);
}

// --- Case-study: reading-time chip ------------------------------------------
const rtEl = document.getElementById('readTime');
if (rtEl) {
  const article = document.querySelector('article.prose');
  if (article) {
    const words = article.innerText.trim().split(/\s+/).length;
    rtEl.textContent = Math.max(1, Math.round(words / 220));
  } else {
    rtEl.textContent = '3';
  }
}

// --- Case-study: prev/next nav ----------------------------------------------
const PROJECT_ORDER = [
  { slug: 'formee-crm',        title: 'Real-time Agentic CRM' },
  { slug: 'reelforge',         title: 'Reelforge — Multi-model Video' },
  { slug: 'llama-qlora',       title: 'Llama 3.1 8B — SFT → DPO' },
  { slug: 'jarvis-dashboard',  title: 'Jarvis Dashboard' },
  { slug: 'career-prep',       title: 'Career Prep Platform' },
  { slug: 'wedding-picks',     title: 'Wedding Picks' },
  { slug: 'neural-rendering-ar', title: 'Neural Rendering for AR' },
  { slug: 'homelab',           title: 'Homelab Infrastructure' },
];
const projPage = document.querySelector('[data-slug]');
const navHost = document.getElementById('projNav');
if (projPage && navHost) {
  const slug = projPage.dataset.slug;
  const idx = PROJECT_ORDER.findIndex(p => p.slug === slug);
  if (idx >= 0) {
    const prev = idx > 0 ? PROJECT_ORDER[idx - 1] : null;
    const next = idx < PROJECT_ORDER.length - 1 ? PROJECT_ORDER[idx + 1] : null;
    const cell = (p, dir, label) => p
      ? `<a class="proj-nav-link ${dir}" href="${p.slug}.html">
           <div class="proj-nav-dir">${label}</div>
           <div class="proj-nav-title">${p.title}</div>
         </a>`
      : `<div></div>`;
    navHost.innerHTML = cell(prev, 'prev', '← Previous') + cell(next, 'next', 'Next →');
  }
}

// --- Command palette (Ctrl/⌘ + K) -------------------------------------------
(function initCmdk() {
  const ITEMS = [
    { kind: 'section', icon: '§', label: 'Work · Experience', href: 'index.html#work' },
    { kind: 'section', icon: '§', label: 'Projects', href: 'index.html#projects' },
    { kind: 'section', icon: '§', label: 'About', href: 'index.html#about' },
    { kind: 'section', icon: '§', label: 'Contact', href: 'index.html#contact' },
    ...PROJECT_ORDER.map(p => ({ kind: 'project', icon: '▸', label: p.title, href: `projects/${p.slug}.html` })),
    { kind: 'link', icon: '↗', label: 'GitHub — Animesh98', href: 'https://github.com/Animesh98' },
    { kind: 'link', icon: '↗', label: 'LinkedIn — Animesh Sinha', href: 'https://linkedin.com/in/animesh-0902-sinha' },
    { kind: 'link', icon: '↗', label: 'Email — animesh09021998@gmail.com', href: 'mailto:animesh09021998@gmail.com' },
    { kind: 'link', icon: '↗', label: 'Resume (PDF)', href: 'assets/animesh-sinha-resume.pdf' },
  ];

  // detect if we're inside /projects/ subdir to adjust relative paths
  const inProjects = location.pathname.includes('/projects/');
  const adjust = (href) => {
    if (/^https?:|^mailto:/.test(href)) return href;
    if (inProjects) {
      if (href.startsWith('index.html')) return '../' + href;
      if (href.startsWith('projects/'))  return '../' + href;
      if (href.startsWith('assets/'))    return '../' + href;
    }
    return href;
  };

  // Build DOM
  const root = document.createElement('div');
  root.className = 'cmdk-root';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Command palette');
  root.innerHTML = `
    <div class="cmdk" role="combobox" aria-haspopup="listbox" aria-expanded="true">
      <input class="cmdk-input" type="text" placeholder="Search projects, sections, links…" aria-label="Search" />
      <div class="cmdk-list" role="listbox"></div>
      <div class="cmdk-foot">
        <span><span class="kbd">↑</span><span class="kbd">↓</span> navigate · <span class="kbd">↵</span> open</span>
        <span><span class="kbd">esc</span> close</span>
      </div>
    </div>`;
  document.body.appendChild(root);

  const input = root.querySelector('.cmdk-input');
  const list = root.querySelector('.cmdk-list');
  let activeIdx = 0;
  let filtered = ITEMS;

  const render = (q) => {
    const ql = q.trim().toLowerCase();
    filtered = ql
      ? ITEMS.filter(i => i.label.toLowerCase().includes(ql) || i.kind.includes(ql))
      : ITEMS;
    if (!filtered.length) {
      list.innerHTML = '<div class="cmdk-empty">no matches.</div>';
      return;
    }
    activeIdx = 0;
    list.innerHTML = filtered.map((i, idx) => `
      <a class="cmdk-item ${idx === 0 ? 'active' : ''}" href="${adjust(i.href)}" role="option" data-idx="${idx}"${i.href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>
        <span class="cmdk-item-icon">${i.icon}</span>
        <span class="cmdk-item-label">${i.label}</span>
        <span class="cmdk-item-kind">${i.kind}</span>
      </a>`).join('');
  };

  const setActive = (idx) => {
    activeIdx = (idx + filtered.length) % filtered.length;
    list.querySelectorAll('.cmdk-item').forEach((el, i) => el.classList.toggle('active', i === activeIdx));
    const cur = list.querySelector('.cmdk-item.active');
    if (cur) cur.scrollIntoView({ block: 'nearest' });
  };

  const open = () => {
    root.classList.add('open');
    input.value = '';
    render('');
    setTimeout(() => input.focus(), 30);
  };
  const close = () => { root.classList.remove('open'); };

  // Triggers
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      root.classList.contains('open') ? close() : open();
    } else if (e.key === '/' && !root.classList.contains('open') && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      open();
    } else if (root.classList.contains('open')) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIdx + 1); }
      else if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(activeIdx - 1); }
      else if (e.key === 'Enter')     {
        e.preventDefault();
        const cur = list.querySelector('.cmdk-item.active');
        if (cur) cur.click();
      }
    }
  });
  input.addEventListener('input', () => render(input.value));
  root.addEventListener('click', (e) => { if (e.target === root) close(); });
  list.addEventListener('mouseover', (e) => {
    const item = e.target.closest('.cmdk-item');
    if (item) setActive(Number(item.dataset.idx));
  });

  // Hint chip in nav (any page that has .nav-links)
  const navLinks = document.querySelector('.nav-links');
  if (navLinks) {
    const chip = document.createElement('button');
    chip.className = 'nav-cmdk';
    chip.type = 'button';
    chip.setAttribute('aria-label', 'Open command palette');
    const isMac = /mac/i.test(navigator.platform);
    chip.innerHTML = `<span>${isMac ? '⌘' : 'Ctrl'}</span><span>K</span>`;
    chip.addEventListener('click', open);
    navLinks.insertBefore(chip, navLinks.firstChild);
  }
})();

// --- Stats: count-up on scroll-into-view ------------------------------------
const counters = document.querySelectorAll('[data-count]');
if (counters.length) {
  const animateNum = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const isInt = Number.isInteger(target);
    if (reduced) {
      el.textContent = (isInt ? target : target.toFixed(2)) + suffix;
      return;
    }
    const dur = 1100;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = target * eased;
      el.textContent = (isInt ? Math.round(v) : v.toFixed(2)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { animateNum(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => cio.observe(c));
  } else {
    counters.forEach(animateNum);
  }
}

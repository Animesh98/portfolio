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

// --- Terminal: live BLR clock ----------------------------------------------
const clockEl = document.getElementById('termClock');
if (clockEl) {
  const tick = () => {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    clockEl.textContent = `${hh}:${mm} IST`;
  };
  tick();
  setInterval(tick, 30 * 1000);
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

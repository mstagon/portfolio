/* 시퀀스 다이어그램: 화면에 들어오면 메시지를 순서대로 켠다. 탭 전환과 다시 재생 */
(() => {
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const PARTS = '.sq__grp, .sq__k, .sq__g, .sq__m, .sq__do, .sq__note';
  const timers = new WeakMap();

  const stop = sq => (timers.get(sq) || []).forEach(clearTimeout);
  const showAll = sq => { sq.classList.add('is-in'); $$(PARTS, sq).forEach(e => e.classList.add('is-on')); };

  function play(sq) {
    if (RM) return showAll(sq);
    stop(sq);
    const els = $$(PARTS, sq);
    els.forEach(e => e.classList.remove('is-on'));
    sq.classList.remove('is-in');
    void sq.offsetWidth;
    sq.classList.add('is-in');
    timers.set(sq, els.map((e, i) => setTimeout(() => e.classList.add('is-on'), 420 + i * 240)));
  }

  function init() {
    const sqs = $$('.sq');
    if (!sqs.length) return;
    if (RM || !('IntersectionObserver' in window)) { sqs.forEach(showAll); }
    else {
      sqs.forEach(sq => sq.classList.add('sq--anim'));
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting || e.target.dataset.played) return;
        e.target.dataset.played = '1';
        play(e.target);
      }), { threshold: 0.2 });
      sqs.forEach(sq => io.observe(sq));
    }

    $$('.sqtabs').forEach(bar => {
      const tabs = $$('[role="tab"]', bar);
      const select = (t, focus) => {
        tabs.forEach(x => {
          const on = x === t;
          x.setAttribute('aria-selected', on ? 'true' : 'false');
          x.tabIndex = on ? 0 : -1;
          const p = document.getElementById(x.getAttribute('aria-controls'));
          if (p) p.hidden = !on;
        });
        if (focus) t.focus();
        const sq = document.getElementById(t.getAttribute('aria-controls'))?.querySelector('.sq');
        if (sq) { sq.dataset.played = '1'; play(sq); }
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      };
      tabs.forEach(t => t.addEventListener('click', () => select(t)));
      bar.addEventListener('keydown', ev => {
        const i = tabs.indexOf(document.activeElement);
        if (i < 0) return;
        let j = -1;
        if (ev.key === 'ArrowRight') j = (i + 1) % tabs.length;
        else if (ev.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
        else if (ev.key === 'Home') j = 0;
        else if (ev.key === 'End') j = tabs.length - 1;
        if (j < 0) return;
        ev.preventDefault();
        select(tabs[j], true);
      });
    });

    $$('.sqp__replay').forEach(b => b.addEventListener('click', () => {
      const sq = b.closest('.sqp')?.querySelector('.sq');
      if (sq) play(sq);
    }));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

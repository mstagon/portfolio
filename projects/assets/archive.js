/* Progressive enhancement: the complete archive and all detail pages are static HTML. */
(() => {
  'use strict';
  const controls = document.querySelector('.archive-controls');
  const storageKey = 'cms-project-archive';
  const categories = new Map([['all', '전체 프로젝트'], ['company', '회사 프로젝트'], ['personal', '개인·사이드 프로젝트'], ['team', '팀 프로젝트']]);
  let savedLocation = '';
  try { savedLocation = sessionStorage.getItem(storageKey) || ''; } catch { /* Optional state only. */ }

  if (controls) {
    const input = document.querySelector('#project-search');
    const filters = [...document.querySelectorAll('[data-filter]')];
    const cards = [...document.querySelectorAll('.project-item')];
    const count = document.querySelector('#result-count');
    const clear = document.querySelector('.clear-search');
    const empty = document.querySelector('.empty-state');
    let category = 'all';
    let searchTimer;
    let composing = false;
    const normalize = value => value.normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/\s+/g, ' ').trim();
    const documents = new Map(cards.map(card => [card, normalize(card.dataset.search)]));

    /** Apply category and keyword intersection without replacing accessible card markup. */
    function render() {
      const words = normalize(input.value).split(' ').filter(Boolean);
      let total = 0;
      cards.forEach(card => {
        const matchesCategory = category === 'all' || card.dataset.category === category;
        const matchesQuery = words.every(word => documents.get(card).includes(word));
        card.hidden = !(matchesCategory && matchesQuery);
        if (!card.hidden) total += 1;
      });
      filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
      count.textContent = `${categories.get(category)} ${total}개${input.value.trim() ? ' · 검색 결과' : ''}`;
      clear.hidden = input.value.length === 0;
      empty.hidden = total !== 0;
    }

    /** Keep filters shareable; category changes create history, typing updates it. */
    function persist(mode = 'replace') {
      const url = new URL(location.href);
      url.searchParams.delete('category'); url.searchParams.delete('q');
      if (category !== 'all') url.searchParams.set('category', category);
      if (input.value.trim()) url.searchParams.set('q', input.value.trim());
      const relative = url.pathname + url.search + url.hash;
      if (relative !== location.pathname + location.search + location.hash) {
        history[mode === 'push' ? 'pushState' : 'replaceState'](null, '', relative);
      }
      try { sessionStorage.setItem(storageKey, relative); } catch { /* No storage requirement. */ }
    }

    function readLocation() {
      const params = new URLSearchParams(location.search);
      category = categories.has(params.get('category')) ? params.get('category') : 'all';
      input.value = params.get('q') || '';
      render();
      try { sessionStorage.setItem(storageKey, location.pathname + location.search + location.hash); } catch { /* Optional. */ }
    }

    filters.forEach(button => button.addEventListener('click', () => {
      clearTimeout(searchTimer);
      category = button.dataset.filter;
      render(); persist('push');
    }));
    const search = () => { if (!composing) { clearTimeout(searchTimer); render(); searchTimer = setTimeout(() => persist(), 180); } };
    input.addEventListener('compositionstart', () => { composing = true; });
    input.addEventListener('compositionend', () => { composing = false; search(); });
    input.addEventListener('input', search);
    clear.addEventListener('click', () => { clearTimeout(searchTimer); input.value = ''; render(); persist(); input.focus(); });
    document.querySelector('.reset-filters').addEventListener('click', () => { clearTimeout(searchTimer); category = 'all'; input.value = ''; render(); persist('push'); input.focus(); });
    window.addEventListener('popstate', () => { clearTimeout(searchTimer); readLocation(); });
    // Flush a pending input update before leaving for a detail page.
    document.querySelector('.project-grid').addEventListener('click', event => { if (event.target.closest('a')) { clearTimeout(searchTimer); persist(); } });
    controls.hidden = false;
    readLocation();
  }

  // Only accept same-origin archive paths from optional session state.
  if (/^\/projects\/(?:[?#]|$)/.test(savedLocation) && !controls) {
    document.querySelectorAll('[data-archive-back]').forEach(link => { link.href = savedLocation; });
  }

  const dialog = document.querySelector('.lightbox');
  if (dialog && typeof dialog.showModal === 'function') {
    const wrapper = dialog.querySelector('.lightbox-image-wrap');
    const caption = dialog.querySelector('#lightbox-caption');
    document.querySelectorAll('.screen-link').forEach(link => {
      link.addEventListener('click', event => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        const original = link.querySelector('img');
        const image = new Image();
        image.src = link.href; image.alt = original.alt;
        wrapper.replaceChildren(image); caption.textContent = original.alt;
        dialog.showModal(); document.documentElement.classList.add('modal-open');
      });
    });
    dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => { document.documentElement.classList.remove('modal-open'); wrapper.replaceChildren(); });
  }
})();

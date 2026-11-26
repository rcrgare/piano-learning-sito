(() => {
  const finder = document.querySelector('.finder[data-found]');

  if (finder) {
    const query = finder.querySelector('#q');
    const status = finder.querySelector('#found');
    const viewButtons = [...finder.querySelectorAll('[data-view]')];
    const levelButtons = [...finder.querySelectorAll('[data-level]')];
    const groups = {
      composer: document.querySelector('#v-composer'),
      kind: document.querySelector('#v-kind'),
    };
    const empty = document.querySelector('#none');
    const params = new URLSearchParams(location.search);
    let view = params.get('view') === 'composer' ? 'composer' : 'kind';
    let level = /^[123]$/.test(params.get('level')) ? params.get('level') : '0';

    function fold(text) {
      return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    function update(writeUrl = true) {
      const words = fold(query.value).trim().split(/\s+/).filter(Boolean);
      const group = groups[view];
      groups.composer.hidden = view !== 'composer';
      groups.kind.hidden = view !== 'kind';
      viewButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
      levelButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.level === level)));

      let found = 0;
      for (const section of group.querySelectorAll('section')) {
        let count = 0;
        for (const link of section.querySelectorAll('.tiles a')) {
          const matches = (level === '0' || link.dataset.l === level) &&
            words.every(word => link.dataset.s.includes(word));
          link.hidden = !matches;
          if (matches) count++;
        }
        section.hidden = count === 0;
        const number = section.querySelector('h2 small');
        if (number) number.hidden = words.length > 0 || level !== '0';
        found += count;
      }
      empty.hidden = found > 0;
      status.textContent = found === 1 ? finder.dataset.foundOne : finder.dataset.found.replace('{n}', found);
      if (!writeUrl || location.protocol === 'file:') return;

      const url = new URL(location.href);
      for (const [key, value] of [['q', query.value.trim()], ['view', view === 'kind' ? '' : view], ['level', level === '0' ? '' : level]]) {
        if (value) url.searchParams.set(key, value);
        else url.searchParams.delete(key);
      }
      history.replaceState(history.state, '', url);
    }

    query.value = params.get('q') ?? '';
    query.addEventListener('input', () => update());
    for (const button of viewButtons) button.addEventListener('click', () => { view = button.dataset.view; update(); });
    for (const button of levelButtons) button.addEventListener('click', () => { level = button.dataset.level; update(); });
    update(false);
  }

  const language = document.querySelector('details.langs');
  if (language) {
    document.addEventListener('click', event => {
      if (language.open && !language.contains(event.target)) language.open = false;
    });
    language.addEventListener('keydown', event => {
      if (event.key === 'Escape' && language.open) {
        language.open = false;
        language.querySelector('summary').focus();
      }
    });
  }

  function followInPage(event) {
    return !event.defaultPrevented && event.button === 0 &&
      !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
  }

  for (const video of document.querySelectorAll('.video[data-release]')) {
    if (Date.now() < Date.parse(video.dataset.release)) continue;
    const content = video.querySelector('template').content.cloneNode(true);
    video.replaceChildren(content);
    const fallback = video.parentElement.querySelector('.youtube-link');
    if (fallback) fallback.hidden = false;
  }

  for (const link of document.querySelectorAll('.video-launch[data-embed]')) {
    link.addEventListener('click', event => {
      if (!followInPage(event) || location.protocol === 'file:') return;
      const url = new URL(link.dataset.embed);
      if (url.protocol !== 'https:' || !['www.youtube-nocookie.com', 'www.youtube.com'].includes(url.hostname)) return;
      event.preventDefault();
      url.searchParams.set('autoplay', '1');
      const player = document.createElement('iframe');
      player.title = link.dataset.title;
      player.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';
      player.allowFullscreen = true;
      player.referrerPolicy = 'strict-origin-when-cross-origin';
      player.src = url.href;
      link.replaceWith(player);
      player.focus();
    });
  }

  const score = document.querySelector('#score-view');
  if (score && typeof score.showModal === 'function') {
    const image = score.querySelector('img');
    for (const link of document.querySelectorAll('[data-sheet]')) {
      link.addEventListener('click', event => {
        if (!followInPage(event)) return;
        event.preventDefault();
        image.src = link.href;
        image.alt = link.querySelector('img')?.alt || link.textContent.trim() || score.getAttribute('aria-label');
        score.showModal();
      });
    }
    score.addEventListener('click', event => {
      if (event.target !== score) return;
      const bounds = score.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) score.close();
    });
    score.addEventListener('close', () => image.removeAttribute('src'));
  }

  const buybar = document.querySelector('.buybar');
  const firstPurchase = document.querySelector('#hero-cta');
  if (buybar && firstPurchase && 'IntersectionObserver' in window) {
    const footer = document.querySelector('footer');
    const updateBar = () => {
      const pastPurchase = firstPurchase.getBoundingClientRect().bottom < 0;
      const beforeFooter = !footer || footer.getBoundingClientRect().top >= innerHeight;
      buybar.classList.toggle('on', pastPurchase && beforeFooter);
    };
    const observer = new IntersectionObserver(updateBar);
    observer.observe(firstPurchase);
    if (footer) observer.observe(footer);
  }
})();

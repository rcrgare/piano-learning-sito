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

// Libri su Amazon (27/11/2026): i link con data-az (hardcover, paperback, kindle) vanno sul negozio dove il
// visitatore può comprare, secondo il paese (fuso orario, poi regione della lingua del dispositivo). Paese
// sconosciuto: resta il negozio della lingua della pagina. Stessa tabella dell'app: lib/amazonStores.ts.
// Per provare: aggiungere ?paese=US (o ES, JP, MX...) all'indirizzo della pagina.
(() => {
  try {
    const Z = {};
    const add = (c, zs) => zs.split(' ').forEach(z => { Z[z] = c; });
    add('US', 'America/New_York America/Chicago America/Denver America/Los_Angeles America/Phoenix America/Anchorage America/Detroit America/Boise America/Juneau America/Sitka America/Nome America/Adak America/Metlakatla America/Yakutat America/Menominee Pacific/Honolulu US/Eastern US/Central US/Mountain US/Pacific');
    add('CA', 'America/Toronto America/Vancouver America/Edmonton America/Winnipeg America/Halifax America/St_Johns America/Regina America/Montreal America/Moncton America/Glace_Bay America/Goose_Bay America/Whitehorse America/Dawson America/Yellowknife America/Iqaluit America/Rankin_Inlet America/Swift_Current America/Cambridge_Bay America/Inuvik America/Atikokan America/Blanc-Sablon America/Creston America/Dawson_Creek America/Fort_Nelson America/Resolute America/Thunder_Bay');
    add('MX', 'America/Mexico_City America/Monterrey America/Cancun America/Merida America/Tijuana America/Chihuahua America/Hermosillo America/Mazatlan America/Bahia_Banderas America/Matamoros America/Ojinaga America/Ciudad_Juarez');
    add('BR', 'America/Sao_Paulo America/Fortaleza America/Recife America/Bahia America/Belem America/Manaus America/Cuiaba America/Campo_Grande America/Porto_Velho America/Boa_Vista America/Maceio America/Araguaina America/Santarem America/Rio_Branco America/Noronha');
    add('GB', 'Europe/London Europe/Belfast Europe/Guernsey Europe/Jersey Europe/Isle_of_Man Europe/Gibraltar');
    add('IE', 'Europe/Dublin'); add('DE', 'Europe/Berlin Europe/Busingen'); add('AT', 'Europe/Vienna'); add('CH', 'Europe/Zurich');
    add('LI', 'Europe/Vaduz'); add('LU', 'Europe/Luxembourg'); add('FR', 'Europe/Paris'); add('MC', 'Europe/Monaco');
    add('BE', 'Europe/Brussels'); add('NL', 'Europe/Amsterdam'); add('ES', 'Europe/Madrid Atlantic/Canary Africa/Ceuta');
    add('PT', 'Europe/Lisbon Atlantic/Madeira Atlantic/Azores'); add('AD', 'Europe/Andorra'); add('IT', 'Europe/Rome');
    add('SM', 'Europe/San_Marino'); add('VA', 'Europe/Vatican'); add('MT', 'Europe/Malta'); add('PL', 'Europe/Warsaw');
    add('SE', 'Europe/Stockholm'); add('DK', 'Europe/Copenhagen'); add('NO', 'Europe/Oslo'); add('FI', 'Europe/Helsinki');
    add('CZ', 'Europe/Prague'); add('SK', 'Europe/Bratislava'); add('HU', 'Europe/Budapest'); add('SI', 'Europe/Ljubljana');
    add('HR', 'Europe/Zagreb'); add('RO', 'Europe/Bucharest'); add('BG', 'Europe/Sofia'); add('GR', 'Europe/Athens');
    add('EE', 'Europe/Tallinn'); add('LV', 'Europe/Riga'); add('LT', 'Europe/Vilnius'); add('CY', 'Asia/Nicosia Europe/Nicosia Asia/Famagusta');
    add('IS', 'Atlantic/Reykjavik'); add('JP', 'Asia/Tokyo'); add('IN', 'Asia/Kolkata Asia/Calcutta'); add('NZ', 'Pacific/Auckland Pacific/Chatham');
    const PRINT = { US: 'com', CA: 'ca', GB: 'co.uk', IE: 'ie', DE: 'de', AT: 'de', CH: 'de', LI: 'de', LU: 'de', FR: 'fr', MC: 'fr',
      BE: 'com.be', NL: 'nl', ES: 'es', PT: 'es', AD: 'es', IT: 'it', SM: 'it', VA: 'it', MT: 'it', PL: 'pl', SE: 'se',
      DK: 'de', NO: 'de', FI: 'de', CZ: 'de', SK: 'de', HU: 'de', SI: 'de', HR: 'de', RO: 'de', BG: 'de', GR: 'de',
      EE: 'de', LV: 'de', LT: 'de', CY: 'de', IS: 'de', JP: 'co.jp', AU: 'com.au', NZ: 'com.au' };
    const KINDLE = { US: 'com', CA: 'ca', GB: 'co.uk', IE: 'co.uk', DE: 'de', AT: 'de', CH: 'de', LI: 'de', LU: 'de', FR: 'fr', MC: 'fr',
      BE: 'fr', NL: 'nl', ES: 'es', IT: 'it', SM: 'it', VA: 'it', JP: 'co.jp', AU: 'com.au', MX: 'com.mx', BR: 'com.br', IN: 'in' };
    const q = /[?&]paese=([A-Za-z]{2})/.exec(location.search);
    let c = q ? q[1].toUpperCase() : '';
    if (!c) {
      let tz = '';
      try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* vecchi browser */ }
      c = Z[tz] || (/^America\/(Indiana|Kentucky|North_Dakota)\//.test(tz) ? 'US' : /^Australia\//.test(tz) ? 'AU' : '');
    }
    if (!c) {
      for (const l of navigator.languages || [navigator.language || '']) {
        const m = /[-_]([A-Za-z]{2})$/.exec(l || '');
        if (m) { c = m[1].toUpperCase(); break; }
      }
    }
    // Fuso di un paese senza negozio Amazon suo (Vietnam, Thailandia...) e lingua senza regione: Amazon.com.
    if (!c) {
      let tz = '';
      try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* vecchi browser */ }
      if (/^(Africa|America|Antarctica|Asia|Atlantic|Australia|Europe|Indian|Pacific)\//.test(tz)) c = 'ZZ';
    }
    if (!c) return;
    document.querySelectorAll('a[data-az]').forEach(a => {
      const m = /amazon\.([a-z.]+)\/dp\/([A-Z0-9]{10})/.exec(a.href);
      if (!m) return;
      const f = a.getAttribute('data-az');
      let st = f === 'kindle' ? (KINDLE[c] || 'com') : (PRINT[c] || 'com');
      if (f === 'hardcover' && (st === 'co.jp' || st === 'com.au')) st = 'com';
      if (st === m[1]) return;
      a.href = `https://www.amazon.${st}/dp/${m[2]}`;
      if (a.textContent.includes(`Amazon.${m[1]}`)) a.textContent = a.textContent.replace(`Amazon.${m[1]}`, `Amazon.${st}`);
    });
  } catch (e) { /* i link restano quelli della lingua della pagina */ }
})();

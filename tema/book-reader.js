(() => {
  const dialog = document.querySelector('#book-reader');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  const title = dialog.querySelector('#book-reader-title');
  const viewport = dialog.querySelector('.book-reader-viewport');
  const image = viewport.querySelector('img');
  const previous = dialog.querySelector('[data-book-prev]');
  const next = dialog.querySelector('[data-book-next]');
  const count = dialog.querySelector('[data-book-count]');
  const zoom = dialog.querySelector('[data-book-zoom]');
  let pages = [];
  let position = 0;

  function setZoom(zoomed) {
    viewport.classList.toggle('is-zoomed', zoomed);
    zoom.textContent = zoomed ? dialog.dataset.fit : dialog.dataset.zoom;
    viewport.scrollTo(0, 0);
  }

  function showPage(index) {
    const page = pages[index];
    if (!page) return;
    position = index;
    image.src = page.href;
    image.alt = page.querySelector('img').alt;
    count.textContent = dialog.dataset.counter
      .replace('{page}', String(index + 1))
      .replace('{total}', String(pages.length));
    previous.setAttribute('aria-disabled', String(index === 0));
    next.setAttribute('aria-disabled', String(index === pages.length - 1));
    setZoom(false);
  }

  document.querySelector('main').addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = event.target.closest('[data-book-open], [data-book-page]');
    if (!link) return;
    const book = link.dataset.bookOpen
      ? document.getElementById(link.dataset.bookOpen)
      : link.closest('.bdet');
    if (!book) return;

    const previews = [...book.querySelectorAll('[data-book-page]')];
    if (!previews.length) return;
    event.preventDefault();
    pages = previews;
    title.textContent = book.dataset.bookTitle;
    showPage(Math.max(0, pages.indexOf(link)));
    dialog.showModal();
  });

  previous.addEventListener('click', () => showPage(position - 1));
  next.addEventListener('click', () => showPage(position + 1));
  zoom.addEventListener('click', () => setZoom(!viewport.classList.contains('is-zoomed')));

  dialog.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
        viewport.classList.contains('is-zoomed')) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    showPage(position + (event.key === 'ArrowLeft' ? -1 : 1));
  });

  dialog.addEventListener('close', () => {
    image.removeAttribute('src');
    pages = [];
  });
})();

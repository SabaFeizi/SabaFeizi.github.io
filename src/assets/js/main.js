'use strict';

/**
 * Site behaviour. Rewritten from the vCard template script:
 * - tabs are keyed on data attributes (not link text / index order)
 * - hash routing (#about, #resume, #certificates, #blog) so refresh, back/forward and links work
 * - no innerHTML: all content is rendered at build time
 */

(function () {

  /* ---------- sidebar "Show Contacts" toggle (mobile / tablet) ---------- */

  const sidebar = document.querySelector('[data-sidebar]');
  const sidebarBtn = document.querySelector('[data-sidebar-btn]');

  if (sidebar && sidebarBtn) {
    sidebarBtn.addEventListener('click', function () {
      const open = sidebar.classList.toggle('active');
      sidebarBtn.setAttribute('aria-expanded', String(open));
      sidebarBtn.setAttribute('aria-label', open ? 'Hide contacts' : 'Show contacts');
    });
  }


  /* ---------- tab navigation with hash routing ---------- */

  const navLinks = document.querySelectorAll('[data-nav-link]');
  const pages = document.querySelectorAll('article[data-page]');
  const pageIds = Array.from(pages, (p) => p.dataset.page);

  const currentPage = () => document.querySelector('article[data-page].active')?.dataset.page;

  function showPage(id, { focus = false } = {}) {
    if (!pageIds.includes(id)) return;

    // a certificate dialog must not stay open over a hidden tab
    document.querySelectorAll('dialog[open]').forEach((dialog) => dialog.close());

    const changed = id !== currentPage();

    pages.forEach((page) => page.classList.toggle('active', page.dataset.page === id));

    navLinks.forEach((link) => {
      const active = link.dataset.navLink === id;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    if (changed) window.scrollTo(0, 0);

    if (focus) {
      const heading = document.querySelector(`article[data-page="${id}"] .article-title`);
      if (heading) heading.focus({ preventScroll: true });
    }
  }

  if (pages.length) {
    navLinks.forEach((link) => {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        const id = this.dataset.navLink;
        if (location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
        showPage(id, { focus: event.detail === 0 }); // detail 0 = keyboard activation
        window.scrollTo(0, 0); // like the original template, a nav click always returns to the top
      });
    });

    // Only tab hashes switch tabs; other fragments (e.g. the skip link "#content") are left alone.
    const routeFromHash = () => showPage(location.hash ? location.hash.slice(1) : pageIds[0]);

    window.addEventListener('popstate', routeFromHash);

    if (location.hash) routeFromHash();
  }


  /* ---------- certificate filter (buttons on desktop, select on mobile) ---------- */

  const filterRoot = document.querySelector('[data-filter-root]');

  if (filterRoot) {
    const items = filterRoot.querySelectorAll('[data-filter-item]');
    const buttons = filterRoot.querySelectorAll('[data-filter-btn]');
    const select = filterRoot.querySelector('[data-filter-select]');

    const applyFilter = function (value) {
      items.forEach((item) => {
        item.classList.toggle('active', value === 'all' || item.dataset.category === value);
      });
      buttons.forEach((btn) => {
        const active = btn.dataset.filterBtn === value;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', String(active));
      });
      if (select && select.value !== value) select.value = value;
    };

    buttons.forEach((btn) => btn.addEventListener('click', () => applyFilter(btn.dataset.filterBtn)));
    if (select) select.addEventListener('change', () => applyFilter(select.value));
  }


  /* ---------- certificate dialogs ---------- */

  document.querySelectorAll('[data-dialog-open]').forEach((trigger) => {
    const dialog = document.getElementById(trigger.dataset.dialogOpen);
    if (!dialog || typeof dialog.showModal !== 'function') return;

    trigger.addEventListener('click', () => dialog.showModal());

    dialog.querySelectorAll('[data-dialog-close]').forEach((btn) =>
      btn.addEventListener('click', () => dialog.close()),
    );

    // close when clicking the backdrop (outside the dialog box)
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });

    // return focus to the card that opened it
    dialog.addEventListener('close', () => trigger.focus());
  });

})();

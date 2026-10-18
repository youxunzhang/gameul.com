(function () {
  'use strict';

  const menuButton = document.querySelector('[data-menu-button]');
  const primaryNav = document.querySelector('[data-primary-nav]');

  if (menuButton && primaryNav) {
    const closeMenu = () => {
      primaryNav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    };

    menuButton.addEventListener('click', () => {
      const isOpen = primaryNav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
      document.body.classList.toggle('menu-open', isOpen);
    });

    primaryNav.addEventListener('click', event => {
      if (event.target.closest('a')) closeMenu();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 760) closeMenu();
    });
  }

  document.querySelectorAll('[data-current-year]').forEach(node => {
    node.textContent = String(new Date().getFullYear());
  });

  const searchForms = document.querySelectorAll('[data-game-search-form]');
  searchForms.forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const input = form.querySelector('input[type="search"]');
      const query = input ? input.value.trim() : '';
      const target = query ? `/games.html?q=${encodeURIComponent(query)}` : '/games.html';

      if (document.querySelector('[data-game-library]')) {
        const localInput = document.querySelector('[data-library-search]');
        if (localInput) {
          localInput.value = query;
          localInput.dispatchEvent(new Event('input', { bubbles: true }));
          localInput.focus();
          return;
        }
      }

      window.location.href = target;
    });
  });

  const library = document.querySelector('[data-game-library]');
  if (library) {
    const cards = Array.from(library.querySelectorAll('[data-game-card]'));
    const input = document.querySelector('[data-library-search]');
    const filterButtons = Array.from(document.querySelectorAll('[data-category-filter]'));
    const countNode = document.querySelector('[data-results-count]');
    const emptyNode = document.querySelector('[data-empty-state]');
    let category = 'all';

    const normalize = value => value.toLowerCase().trim();

    const applyFilters = () => {
      const query = normalize(input ? input.value : '');
      let visible = 0;

      cards.forEach(card => {
        const cardCategory = normalize(card.dataset.category || '');
        const haystack = normalize([
          card.dataset.title,
          card.dataset.tags,
          card.textContent
        ].filter(Boolean).join(' '));
        const categoryMatch = category === 'all' || cardCategory === category;
        const queryMatch = !query || haystack.includes(query);
        const show = categoryMatch && queryMatch;
        card.hidden = !show;
        if (show) visible += 1;
      });

      if (countNode) {
        countNode.textContent = `${visible} ${visible === 1 ? 'game' : 'games'}`;
      }
      if (emptyNode) emptyNode.hidden = visible !== 0;
    };

    if (input) {
      const params = new URLSearchParams(window.location.search);
      input.value = params.get('q') || '';
      input.addEventListener('input', applyFilters);
    }

    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        category = normalize(button.dataset.categoryFilter || 'all');
        filterButtons.forEach(item => {
          item.setAttribute('aria-pressed', String(item === button));
        });
        applyFilters();
      });
    });

    applyFilters();
  }

  const fullscreenButton = document.querySelector('[data-fullscreen]');
  const gameShell = document.querySelector('[data-game-shell]');
  if (fullscreenButton && gameShell && document.fullscreenEnabled) {
    fullscreenButton.addEventListener('click', async () => {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        } else {
          await gameShell.requestFullscreen();
        }
      } catch (error) {
        console.warn('Fullscreen is unavailable.', error);
      }
    });
    document.addEventListener('fullscreenchange', () => {
      fullscreenButton.textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen';
    });
  } else if (fullscreenButton) {
    fullscreenButton.hidden = true;
  }
})();

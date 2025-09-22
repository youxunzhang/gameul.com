(function () {
  const data = window.siteData || { games: [], tools: [], rankings: {}, categories: [] };
  const searchIndex = window.searchIndex || [];
  const gameMap = new Map((data.games || []).map((game) => [game.slug, game]));

  function byId(id) {
    return document.getElementById(id);
  }

  function setActiveNav(key) {
    const target = key || document.body?.dataset?.page;
    document.querySelectorAll('.nav-link').forEach((link) => {
      if (link.dataset.nav === target) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  function setFooterYear() {
    const footerYear = byId('footer-year');
    if (footerYear) {
      footerYear.textContent = new Date().getFullYear();
    }
  }

  function fuzzyContains(text, term) {
    let lastIndex = -1;
    for (const char of term) {
      lastIndex = text.indexOf(char, lastIndex + 1);
      if (lastIndex === -1) {
        return false;
      }
    }
    return true;
  }

  function computeScore(query, title, haystack) {
    let score = 0;
    if (!query) return score;
    const q = query.toLowerCase();
    const titleLower = title.toLowerCase();
    const hay = haystack.toLowerCase();

    if (hay.includes(q)) score += 6;
    if (titleLower.includes(q)) score += 6;

    const terms = q.split(/\s+/).filter(Boolean);
    terms.forEach((term) => {
      if (hay.includes(term)) {
        score += 3;
      } else if (term.length > 2 && fuzzyContains(hay, term)) {
        score += 1.5;
      }
      if (titleLower.startsWith(term)) {
        score += 2;
      }
    });

    return score;
  }

  function performSearch(query) {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    return searchIndex
      .map((item) => {
        const haystack = `${item.title} ${item.description || ''} ${(item.tags || []).join(' ')}`;
        const score = computeScore(q, item.title, haystack);
        return { ...item, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.type !== b.type) {
          return a.type === 'game' ? -1 : 1;
        }
        return a.title.localeCompare(b.title);
      })
      .slice(0, 8);
  }

  function initSearch() {
    const form = byId('global-search-form');
    const input = byId('global-search');
    const panel = byId('search-panel');
    const list = byId('search-results');
    const summary = byId('search-summary');
    const empty = byId('search-empty');
    const close = byId('search-close');

    if (!form || !input || !panel || !list) return;

    const hidePanel = () => {
      panel.hidden = true;
      empty.hidden = true;
      summary.textContent = 'Start typing to search the entire site.';
    };

    const render = (results, query) => {
      list.innerHTML = '';
      if (!results.length) {
        empty.hidden = false;
        summary.textContent = `No matches for “${query}”.`;
        return;
      }
      empty.hidden = true;
      summary.textContent = `Showing ${results.length} result${results.length > 1 ? 's' : ''} for “${query}”.`;

      results.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'search-result';

        const link = document.createElement('a');
        link.href = item.url;
        if (item.external) {
          link.target = '_blank';
          link.rel = 'noopener';
        }

        const meta = document.createElement('div');
        meta.className = 'search-result__meta';

        const title = document.createElement('span');
        title.className = 'search-result__title';
        title.textContent = item.title;

        const desc = document.createElement('span');
        desc.className = 'search-result__desc';
        desc.textContent = item.description;

        const type = document.createElement('span');
        type.className = 'search-result__type';
        type.textContent = item.type === 'game' ? 'Game' : 'Tool';

        meta.appendChild(title);
        meta.appendChild(desc);
        link.appendChild(meta);
        link.appendChild(type);
        li.appendChild(link);
        list.appendChild(li);
      });
    };

    hidePanel();

    input.addEventListener('input', () => {
      const value = input.value || '';
      if (value.trim().length < 2) {
        hidePanel();
        return;
      }
      panel.hidden = false;
      const results = performSearch(value);
      render(results, value.trim());
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = input.value.trim();
      if (!value) return;
      const results = performSearch(value);
      if (results.length && !results[0].external) {
        window.location.href = results[0].url;
      } else if (results.length) {
        window.open(results[0].url, '_blank', 'noopener');
      }
    });

    close?.addEventListener('click', () => {
      input.value = '';
      hidePanel();
    });

    document.addEventListener('click', (event) => {
      if (!panel.contains(event.target) && !form.contains(event.target)) {
        hidePanel();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        hidePanel();
        if (document.activeElement === input) {
          input.blur();
        }
      }
    });
  }

  function createChip(label) {
    const span = document.createElement('span');
    span.className = 'chip';
    span.textContent = label;
    return span;
  }

  function createGameCard(game) {
    const article = document.createElement('article');
    article.className = 'game-card';

    const link = document.createElement('a');
    link.href = `/games/${game.slug}/`;
    link.setAttribute('aria-label', `${game.title} details`);

    const image = document.createElement('img');
    image.src = game.cover;
    image.alt = `${game.title} cover art`;
    image.loading = 'lazy';

    const title = document.createElement('h3');
    title.textContent = game.title;

    const desc = document.createElement('p');
    desc.textContent = game.shortDescription;
    desc.style.margin = '0';

    const meta = document.createElement('div');
    meta.className = 'game-card__meta';
    meta.appendChild(createChip(game.categories[0]));
    meta.appendChild(createChip(`⭐ ${game.rating.toFixed(1)}`));

    link.appendChild(image);
    link.appendChild(meta);
    link.appendChild(title);
    link.appendChild(desc);
    article.appendChild(link);
    return article;
  }

  function createCategoryTile(category, gameCount) {
    const link = document.createElement('a');
    link.href = `/games/?category=${encodeURIComponent(category)}`;
    link.className = 'category-tile';

    const title = document.createElement('strong');
    title.textContent = category;

    const paragraph = document.createElement('p');
    paragraph.textContent = `${gameCount} game${gameCount > 1 ? 's' : ''} available`;

    link.appendChild(title);
    link.appendChild(paragraph);
    return link;
  }

  function createToolCard(tool) {
    const article = document.createElement('article');
    article.className = 'tool-card';

    const title = document.createElement('strong');
    title.textContent = tool.title;

    const desc = document.createElement('p');
    desc.textContent = tool.description;
    desc.style.margin = '0';

    const meta = document.createElement('div');
    meta.className = 'tool-card__meta';
    meta.appendChild(createChip(tool.category));

    const action = document.createElement('a');
    action.href = tool.url;
    action.target = '_blank';
    action.rel = 'noopener';
    action.textContent = 'Visit site →';

    article.appendChild(title);
    article.appendChild(desc);
    article.appendChild(meta);
    article.appendChild(action);
    return article;
  }

  function renderHome() {
    setActiveNav('home');
    setFooterYear();

    const featuredContainer = byId('featured-games');
    if (featuredContainer) {
      const trending = data.rankings?.trending || [];
      const fallback = data.games.slice(0, 6);
      const seen = new Set();
      const items = [];
      trending
        .map((slug) => gameMap.get(slug))
        .concat(fallback)
        .filter(Boolean)
        .forEach((game) => {
          if (!seen.has(game.slug) && items.length < 6) {
            seen.add(game.slug);
            items.push(game);
          }
        });
      featuredContainer.innerHTML = '';
      items.forEach((game) => featuredContainer.appendChild(createGameCard(game)));
    }

    const categoryContainer = byId('category-grid');
    if (categoryContainer) {
      categoryContainer.innerHTML = '';
      data.categories.forEach((category) => {
        const count = data.games.filter((game) => game.categories.includes(category)).length;
        categoryContainer.appendChild(createCategoryTile(category, count));
      });
    }

    const toolContainer = byId('featured-tools');
    if (toolContainer) {
      toolContainer.innerHTML = '';
      data.tools.slice(0, 6).forEach((tool) => toolContainer.appendChild(createToolCard(tool)));
    }

    const rankingsPreview = byId('rankings-preview');
    if (rankingsPreview) {
      rankingsPreview.innerHTML = '';
      (data.rankings?.top || []).slice(0, 5).forEach((slug, index) => {
        const game = gameMap.get(slug);
        if (!game) return;
        const li = document.createElement('li');
        li.innerHTML = `<span class="chip">#${index + 1}</span> <a href="/games/${game.slug}/">${game.title}</a>`;
        rankingsPreview.appendChild(li);
      });
    }
  }

  function renderGamesPage() {
    setActiveNav('games');
    setFooterYear();

    const list = byId('game-list');
    const filters = byId('category-filters');
    const summary = byId('game-summary');
    const loadMore = byId('load-more-games');

    if (!list || !filters || !loadMore) return;

    const params = new URLSearchParams(window.location.search);
    const initialCategory = params.get('category');
    let activeCategory = initialCategory && initialCategory.length > 0 ? initialCategory : 'All';
    const searchQuery = (params.get('q') || '').trim();
    let page = Number.parseInt(params.get('page') || '1', 10);
    if (Number.isNaN(page) || page < 1) page = 1;
    const perPage = 6;

    filters.innerHTML = '';
    const categories = ['All', ...data.categories];
    categories.forEach((category) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = category;
      button.className = 'filter-chip';
      if (category === activeCategory) button.classList.add('is-active');
      button.addEventListener('click', () => {
        activeCategory = category;
        page = 1;
        if (category === 'All') {
          params.delete('category');
        } else {
          params.set('category', category);
        }
        params.delete('page');
        const query = params.toString();
        history.replaceState(null, '', query ? `${window.location.pathname}?${query}` : window.location.pathname);
        renderList();
        updateFilterState();
      });
      filters.appendChild(button);
    });

    function updateFilterState() {
      Array.from(filters.children).forEach((node) => {
        if (node.textContent === activeCategory) {
          node.classList.add('is-active');
        } else {
          node.classList.remove('is-active');
        }
      });
    }

    function applyFilters() {
      return data.games.filter((game) => {
        const matchesCategory = activeCategory === 'All' || game.categories.includes(activeCategory);
        const matchesQuery = !searchQuery
          ? true
          : computeScore(searchQuery.toLowerCase(), game.title, `${game.title} ${game.shortDescription} ${game.tags.join(' ')}`) > 0;
        return matchesCategory && matchesQuery;
      });
    }

    function renderList() {
      const items = applyFilters();
      const total = items.length;
      const visible = items.slice(0, perPage * page);
      list.innerHTML = '';
      visible.forEach((game) => list.appendChild(createGameCard(game)));
      if (summary) {
        summary.textContent = `${total} game${total === 1 ? '' : 's'} found${
          activeCategory !== 'All' ? ` in “${activeCategory}”` : ''
        }${searchQuery ? ` matching “${searchQuery}”` : ''}.`;
      }
      if (visible.length < total) {
        loadMore.style.display = 'inline-flex';
      } else {
        loadMore.style.display = 'none';
      }
    }

    loadMore.addEventListener('click', () => {
      page += 1;
      params.set('page', String(page));
      const query = params.toString();
      history.replaceState(null, '', `${window.location.pathname}?${query}`);
      renderList();
    });

    if ('IntersectionObserver' in window) {
      const sentinel = document.createElement('div');
      sentinel.className = 'sentinel';
      list.after(sentinel);
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            observer.unobserve(entry.target);
            if (loadMore.style.display !== 'none') {
              loadMore.click();
            }
          }
        });
      });
      observer.observe(sentinel);
    }

    const categoryGrid = byId('category-grid');
    if (categoryGrid) {
      categoryGrid.innerHTML = '';
      data.categories.forEach((category) => {
        const count = data.games.filter((game) => game.categories.includes(category)).length;
        categoryGrid.appendChild(createCategoryTile(category, count));
      });
    }

    renderList();
  }

  function renderToolFilters(container, activeCategory, onChange) {
    container.innerHTML = '';
    const categories = ['All', 'AI Tools', 'Game Tools', 'Game Portals', 'Gaming Resources'];
    categories.forEach((category) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = category;
      button.className = 'filter-chip';
      if (category === activeCategory) button.classList.add('is-active');
      button.addEventListener('click', () => onChange(category));
      container.appendChild(button);
    });
  }

  function renderToolsPage() {
    setActiveNav('tools');
    setFooterYear();

    const grid = byId('tool-list');
    const filters = byId('tool-filters');
    const summary = byId('tool-summary');

    if (!grid || !filters) return;

    const params = new URLSearchParams(window.location.search);
    let active = params.get('category') || 'All';
    const searchQuery = (params.get('q') || '').trim();

    const updateFilterButtons = () => {
      Array.from(filters.children).forEach((button) => {
        if (button.textContent === active) {
          button.classList.add('is-active');
        } else {
          button.classList.remove('is-active');
        }
      });
    };

    const render = () => {
      const items = data.tools.filter((tool) => {
        const matchesCategory = active === 'All' || tool.category === active;
        const matchesQuery = !searchQuery
          ? true
          : computeScore(searchQuery.toLowerCase(), tool.title, `${tool.title} ${tool.description} ${(tool.tags || []).join(' ')}`) > 0;
        return matchesCategory && matchesQuery;
      });
      grid.innerHTML = '';
      items.forEach((tool) => grid.appendChild(createToolCard(tool)));
      if (summary) {
        summary.textContent = `${items.length} resource${items.length === 1 ? '' : 's'} ${
          active !== 'All' ? `in “${active}”` : 'across all categories'
        }${searchQuery ? ` matching “${searchQuery}”` : ''}.`;
      }
    };

    renderToolFilters(filters, active, (category) => {
      active = category;
      if (category === 'All') {
        params.delete('category');
      } else {
        params.set('category', category);
      }
      history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`.replace(/\?$/, ''));
      updateFilterButtons();
      render();
    });

    updateFilterButtons();
    render();
  }

  function renderRankingsPage() {
    setActiveNav('rankings');
    setFooterYear();

    const sections = [
      { key: 'top', container: byId('ranking-top') },
      { key: 'new', container: byId('ranking-new') },
      { key: 'trending', container: byId('ranking-trending') }
    ];

    sections.forEach(({ key, container }) => {
      if (!container) return;
      container.innerHTML = '';
      const list = document.createElement('ol');
      list.className = 'ranking-list';
      (data.rankings?.[key] || []).forEach((slug) => {
        const game = gameMap.get(slug);
        if (!game) return;
        const item = document.createElement('li');
        const title = document.createElement('a');
        title.href = `/games/${game.slug}/`;
        title.textContent = game.title;
        const meta = document.createElement('span');
        meta.className = 'ranking-meta';
        meta.textContent = `${game.categories[0]} • ⭐ ${game.rating.toFixed(1)}`;
        item.appendChild(title);
        item.appendChild(meta);
        list.appendChild(item);
      });
      container.appendChild(list);
    });
  }

  function createRecommendationList(game) {
    const container = document.createElement('div');
    container.className = 'recommendations';
    const title = document.createElement('h3');
    title.textContent = 'You may also like';
    container.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'card-grid';
    (game.recommended || [])
      .map((slug) => gameMap.get(slug))
      .filter(Boolean)
      .slice(0, 3)
      .forEach((recommendedGame) => grid.appendChild(createGameCard(recommendedGame)));
    container.appendChild(grid);
    return container;
  }

  function renderGameDetail(slug) {
    setActiveNav('games');
    setFooterYear();

    const game = gameMap.get(slug);
    const container = byId('game-detail');
    if (!game || !container) return;

    const metaInfo = document.createElement('div');
    metaInfo.className = 'game-hero';
    metaInfo.innerHTML = `
      <div class="game-hero__text">
        <p class="eyebrow">${game.categories.join(' • ')}</p>
        <h1>${game.title}</h1>
        <p>${game.shortDescription}</p>
        <div class="game-hero__actions">
          <a class="btn btn-primary" href="#play">Play now</a>
          <span class="chip">⭐ ${game.rating.toFixed(1)}</span>
          <span class="chip">${game.playTime}</span>
        </div>
        <ul class="game-hero__meta">
          <li><strong>Developer:</strong> ${game.developer}</li>
          <li><strong>Release:</strong> ${game.releaseDate}</li>
          <li><strong>Platforms:</strong> ${game.platforms.join(', ')}</li>
        </ul>
      </div>
      <div class="game-hero__media">
        <img src="${game.hero || game.cover}" alt="${game.title} screenshot" loading="lazy">
      </div>
    `;

    const iframeSection = document.createElement('section');
    iframeSection.className = 'play-section';
    iframeSection.id = 'play';
    iframeSection.innerHTML = `
      <div class="iframe-wrapper">
        <iframe src="${game.embedUrl}" title="Play ${game.title}" loading="lazy" allowfullscreen></iframe>
      </div>
      <p class="play-tip">Tip: Use ${game.controls.join(', ')}.</p>
    `;

    const details = document.createElement('section');
    details.className = 'details-section';
    details.innerHTML = `
      <div class="details-copy">
        <h2>About ${game.title}</h2>
        <p>${game.description}</p>
        <h3>Controls</h3>
        <ul class="detail-list">
          ${game.controls.map((control) => `<li>${control}</li>`).join('')}
        </ul>
        <h3>Features</h3>
        <ul class="detail-list">
          ${game.features.map((feature) => `<li>${feature}</li>`).join('')}
        </ul>
      </div>
      <aside class="details-aside">
        <h3>Quick facts</h3>
        <ul class="detail-list">
          <li><strong>Play time:</strong> ${game.playTime}</li>
          <li><strong>Languages:</strong> ${game.languages.join(', ')}</li>
          <li><strong>Tags:</strong> ${game.tags.join(', ')}</li>
        </ul>
      </aside>
    `;

    container.innerHTML = '';
    container.appendChild(metaInfo);
    container.appendChild(iframeSection);
    container.appendChild(details);
    container.appendChild(createRecommendationList(game));

    const ldJson = {
      '@context': 'https://schema.org',
      '@type': 'VideoGame',
      name: game.title,
      url: `${window.location.origin}/games/${game.slug}/`,
      description: game.shortDescription,
      applicationCategory: 'Game',
      operatingSystem: game.platforms.join(', '),
      genre: game.categories,
      image: [game.cover, ...(game.screenshots || [])],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: game.rating,
        reviewCount: Math.round(game.rating * 120)
      },
      author: {
        '@type': 'Organization',
        name: game.developer
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(ldJson);
    document.head.appendChild(script);
  }

  function renderAboutPage() {
    setActiveNav('about');
    setFooterYear();
  }

  function init() {
    initSearch();
  }

  init();

  window.PageInit = {
    home: renderHome,
    games: renderGamesPage,
    tools: renderToolsPage,
    rankings: renderRankingsPage,
    gameDetail: renderGameDetail,
    about: renderAboutPage
  };
})();

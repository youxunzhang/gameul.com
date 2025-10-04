(function () {
  const data = window.siteData || { games: [], tools: [], rankings: {}, categories: [] };
  const searchIndex = window.searchIndex || [];
  const gameMap = new Map((data.games || []).map((game) => [game.slug, game]));
  let directoryCache = null;
  let browserGamesCache = null;

  async function loadGameDirectory() {
    if (directoryCache) {
      return directoryCache;
    }
    try {
      const response = await fetch('/assets/data/games-directory.json', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Failed to fetch directory: ${response.status}`);
      }
      const raw = await response.text();
      let payload;
      try {
        payload = JSON.parse(raw);
      } catch (parseError) {
        console.error('Failed to parse games-directory.json', parseError);
        throw parseError;
      }
      const games = Array.isArray(payload?.games) ? payload.games : [];
      directoryCache = { games, payload, raw };
      return directoryCache;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async function loadBrowserGamesData() {
    if (browserGamesCache) {
      return browserGamesCache;
    }
    try {
      const response = await fetch('/assets/data/browser-games.json', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Failed to fetch browser games: ${response.status}`);
      }
      const raw = await response.text();
      let payload;
      try {
        payload = JSON.parse(raw);
      } catch (parseError) {
        console.error('Failed to parse browser-games.json', parseError);
        throw parseError;
      }
      const games = Array.isArray(payload?.games) ? payload.games : [];
      const featured = payload?.featured ?? null;
      browserGamesCache = { games, payload, raw, featured };
      return browserGamesCache;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

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

  function isExternalUrl(url) {
    if (!url) return false;
    try {
      const parsed = new URL(url, window.location.origin);
      return parsed.origin !== window.location.origin;
    } catch (error) {
      return /^https?:/i.test(url);
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

  function createDirectoryCard(game) {
    const article = document.createElement('article');
    article.className = 'directory-card';

    if (game.thumbnail) {
      const media = document.createElement('div');
      media.className = 'directory-card__media';
      const img = document.createElement('img');
      img.src = game.thumbnail;
      img.alt = `${game.title} cover art`;
      img.loading = 'lazy';
      if (game.detailUrl) {
        const link = document.createElement('a');
        link.href = game.detailUrl;
        link.appendChild(img);
        media.appendChild(link);
      } else {
        media.appendChild(img);
      }
      article.appendChild(media);
    }

    const body = document.createElement('div');
    body.className = 'directory-card__body';

    const title = document.createElement('h3');
    if (game.detailUrl) {
      const titleLink = document.createElement('a');
      titleLink.href = game.detailUrl;
      titleLink.textContent = game.title;
      title.appendChild(titleLink);
    } else {
      title.textContent = game.title;
    }
    body.appendChild(title);

    if (game.summary) {
      const summary = document.createElement('p');
      summary.className = 'directory-card__summary';
      summary.textContent = game.summary;
      body.appendChild(summary);
    }

    const meta = document.createElement('div');
    meta.className = 'directory-card__meta';
    (game.categories || []).forEach((category) => meta.appendChild(createChip(category)));
    if (typeof game.rating === 'number') {
      meta.appendChild(createChip(`⭐ ${game.rating.toFixed(1)}`));
    }
    if (game.releaseDate) {
      meta.appendChild(createChip(game.releaseDate));
    }
    if (meta.childElementCount > 0) {
      body.appendChild(meta);
    }

    const footer = document.createElement('div');
    footer.className = 'directory-card__footer';

    if (game.developer) {
      const developer = document.createElement('span');
      developer.className = 'directory-card__developer';
      developer.textContent = `By ${game.developer}`;
      footer.appendChild(developer);
    }

    const links = document.createElement('div');
    links.className = 'directory-card__links';

    if (game.detailUrl) {
      const details = document.createElement('a');
      details.href = game.detailUrl;
      details.textContent = 'Details';
      links.appendChild(details);
    }

    if (game.playUrl) {
      const play = document.createElement('a');
      play.href = game.playUrl;
      if (game.playUrl.startsWith('http')) {
        play.target = '_blank';
        play.rel = 'noopener';
      }
      play.textContent = 'Play';
      links.appendChild(play);
    }

    if (links.childElementCount > 0) {
      footer.appendChild(links);
    }

    if (footer.childElementCount > 0) {
      body.appendChild(footer);
    }

    article.appendChild(body);
    return article;
  }

  function createBrowserGameCard(item) {
    const article = document.createElement('article');
    article.className = 'game-card';

    const detailUrl = item.detailsUrl || item.link || '#';
    const playUrl = item.link || item.detailsUrl || '#';

    if (item.image) {
      const mediaLink = document.createElement('a');
      mediaLink.href = detailUrl;
      mediaLink.className = 'game-card__media';
      mediaLink.setAttribute('aria-label', `${item.title} details`);
      if (isExternalUrl(detailUrl)) {
        mediaLink.target = '_blank';
        mediaLink.rel = 'noopener';
      }

      const image = document.createElement('img');
      image.src = item.image;
      image.alt = `${item.title} 预览图`;
      image.loading = 'lazy';
      mediaLink.appendChild(image);
      article.appendChild(mediaLink);
    }

    const body = document.createElement('div');
    body.className = 'game-card__body';

    const title = document.createElement('h3');
    const titleLink = document.createElement('a');
    titleLink.href = detailUrl;
    titleLink.textContent = item.title;
    if (isExternalUrl(detailUrl)) {
      titleLink.target = '_blank';
      titleLink.rel = 'noopener';
    }
    title.appendChild(titleLink);
    body.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'game-card__meta';
    if (item.genre) {
      meta.appendChild(createChip(item.genre));
    }
    if (Array.isArray(item.tags)) {
      item.tags.slice(0, 2).forEach((tag) => {
        if (tag) {
          meta.appendChild(createChip(tag));
        }
      });
    }
    if (meta.childElementCount > 0) {
      body.appendChild(meta);
    }

    if (item.description) {
      const desc = document.createElement('p');
      desc.textContent = item.description;
      desc.style.margin = '0';
      body.appendChild(desc);
    }

    const cta = document.createElement('a');
    cta.className = 'game-card__cta';
    cta.href = playUrl;
    cta.textContent = '立即游玩';
    if (isExternalUrl(playUrl)) {
      cta.target = '_blank';
      cta.rel = 'noopener';
    }
    body.appendChild(cta);

    article.appendChild(body);
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
    const isExternal = /^https?:/i.test(tool.url);
    if (isExternal) {
      action.target = '_blank';
      action.rel = 'noopener';
    } else {
      action.rel = 'bookmark';
    }
    action.textContent = isExternal ? 'Visit site →' : 'Open tool →';

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

  function renderNewGamesPage() {
    setActiveNav('games');
    setFooterYear();
  }

  function renderBrowserGamesPage() {
    setActiveNav('browsergame');
    setFooterYear();

    const summary = byId('browsergame-summary');
    const updated = byId('browsergame-updated');
    const grid = byId('browsergame-grid');
    const feature = byId('browsergame-feature');

    if (!grid || !feature) {
      return;
    }

    grid.innerHTML = '';
    feature.innerHTML = '<div class="browsergames-feature__placeholder">精选推荐加载中…</div>';
    if (summary) {
      summary.textContent = '正在加载精选小游戏…';
    }
    if (updated) {
      updated.hidden = true;
      updated.textContent = '';
    }

    const renderFeature = (item) => {
      if (!feature) return;
      feature.innerHTML = '';
      if (!item) {
        feature.innerHTML = '<div class="browsergames-feature__placeholder">暂未找到推荐游戏。</div>';
        return;
      }

      const detailUrl = item.detailsUrl || item.link || '#';
      const playUrl = item.playUrl || item.link || detailUrl;

      if (item.image) {
        const mediaLink = document.createElement('a');
        mediaLink.className = 'browsergames-feature__media';
        mediaLink.href = detailUrl;
        if (isExternalUrl(detailUrl)) {
          mediaLink.target = '_blank';
          mediaLink.rel = 'noopener';
        }
        const img = document.createElement('img');
        img.src = item.image;
        img.alt = `${item.title} 特色封面`;
        img.loading = 'lazy';
        mediaLink.appendChild(img);
        feature.appendChild(mediaLink);
      }

      const body = document.createElement('div');
      body.className = 'browsergames-feature__body';

      const title = document.createElement('h2');
      const titleLink = document.createElement('a');
      titleLink.href = detailUrl;
      titleLink.textContent = item.title;
      if (isExternalUrl(detailUrl)) {
        titleLink.target = '_blank';
        titleLink.rel = 'noopener';
      }
      title.appendChild(titleLink);
      body.appendChild(title);

      if (item.tagline) {
        const intro = document.createElement('p');
        intro.className = 'browsergames-feature__intro';
        intro.textContent = item.tagline;
        body.appendChild(intro);
      }

      if (item.description) {
        const desc = document.createElement('p');
        desc.textContent = item.description;
        body.appendChild(desc);
      }

      if (Array.isArray(item.tags) && item.tags.length > 0) {
        const tags = document.createElement('div');
        tags.className = 'browsergames-feature__tags';
        item.tags.forEach((tag) => tags.appendChild(createChip(tag)));
        body.appendChild(tags);
      }

      const actions = document.createElement('div');
      actions.className = 'browsergames-feature__actions';

      if (playUrl && playUrl !== '#') {
        const playButton = document.createElement('a');
        playButton.className = 'btn btn-primary';
        playButton.href = playUrl;
        playButton.textContent = '开始游戏';
        if (isExternalUrl(playUrl)) {
          playButton.target = '_blank';
          playButton.rel = 'noopener';
        }
        actions.appendChild(playButton);
      }

      if (item.detailsUrl && item.detailsUrl !== playUrl) {
        const infoButton = document.createElement('a');
        infoButton.className = 'btn btn-secondary';
        infoButton.href = item.detailsUrl;
        infoButton.textContent = '了解详情';
        if (isExternalUrl(item.detailsUrl)) {
          infoButton.target = '_blank';
          infoButton.rel = 'noopener';
        }
        actions.appendChild(infoButton);
      }

      if (actions.childElementCount > 0) {
        body.appendChild(actions);
      }

      feature.appendChild(body);
    };

    loadBrowserGamesData()
      .then(({ games, payload, featured }) => {
        const meta = payload?.meta || {};
        const description = meta.description || meta.subtitle || meta.title || '';
        if (summary) {
          const fallback = games.length
            ? `共精选 ${games.length} 款无需下载的浏览器小游戏。`
            : '暂未收录浏览器小游戏。';
          summary.textContent = description || fallback;
        }
        if (updated) {
          if (meta.updated) {
            updated.textContent = `最近更新：${meta.updated}`;
            updated.hidden = false;
          } else {
            updated.textContent = '';
            updated.hidden = true;
          }
        }

        if (!games.length) {
          grid.innerHTML = '<p class="browsergames-empty">暂时没有可用的浏览器游戏，请稍后再来查看。</p>';
          renderFeature(featured || null);
          return;
        }

        renderFeature(featured || games[0]);
        grid.innerHTML = '';
        games.forEach((item) => {
          grid.appendChild(createBrowserGameCard(item));
        });
      })
      .catch((error) => {
        console.error(error);
        if (summary) {
          summary.textContent = '未能加载浏览器游戏列表，请稍后再试。';
        }
        if (updated) {
          updated.textContent = '';
          updated.hidden = true;
        }
        feature.innerHTML = '<div class="browsergames-feature__placeholder">加载失败，请刷新页面重试。</div>';
        grid.innerHTML = '<p class="browsergames-empty">加载失败，请检查网络连接。</p>';
      });
  }

  function renderGameDirectoryPage() {
    setActiveNav('game-directory');
    setFooterYear();

    const grid = byId('game-directory-grid');
    const status = byId('game-directory-status');
    const searchInput = byId('directory-search');
    const categorySelect = byId('directory-category');

    if (!grid) {
      return;
    }

    loadGameDirectory()
      .then((directory) => {
        const initialGames = Array.isArray(directory?.games) ? directory.games : [];
        let workingGames = initialGames;

        const populateCategories = (items) => {
          if (!categorySelect) return;
          const previous = categorySelect.value;
          const categories = Array.from(
            new Set(items.flatMap((game) => (Array.isArray(game.categories) ? game.categories : [])))
          ).sort((a, b) => a.localeCompare(b));
          categorySelect.innerHTML = '<option value="">All categories</option>';
          categories.forEach((category) => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
          });
          if (previous && categories.includes(previous)) {
            categorySelect.value = previous;
          }
        };

        const render = (items) => {
          grid.innerHTML = '';
          if (items.length === 0) {
            if (status) {
              status.textContent = 'No games match your filters yet. Try clearing the search or choosing another category.';
            }
            return;
          }

          items.forEach((game) => grid.appendChild(createDirectoryCard(game)));
          if (status) {
            const query = (searchInput?.value || '').trim();
            const category = categorySelect?.value || '';
            status.textContent = `${items.length} game${items.length === 1 ? '' : 's'} listed${
              category ? ` in “${category}”` : ''
            }${query ? ` matching “${query}”` : ''}.`;
          }
        };

        const applyFilters = () => {
          const query = (searchInput?.value || '').trim().toLowerCase();
          const category = categorySelect?.value || '';
          const filtered = workingGames.filter((game) => {
            const matchesCategory = !category || (game.categories || []).includes(category);
            if (!query) return matchesCategory;
            const haystack = `${game.title} ${game.summary || ''} ${(game.tags || []).join(' ')} ${game.developer || ''}`;
            return matchesCategory && haystack.toLowerCase().includes(query);
          });
          render(filtered);
        };

        searchInput?.addEventListener('input', () => applyFilters());
        categorySelect?.addEventListener('change', () => applyFilters());

        if (status) {
          status.textContent = 'Rendering game list…';
        }

        populateCategories(workingGames);
        applyFilters();

        const updateFromEditor = (nextGames) => {
          workingGames = Array.isArray(nextGames) ? nextGames : [];
          populateCategories(workingGames);
          applyFilters();
        };

        const editor = byId('directory-json-editor');
        if (editor) {
          const formatButton = byId('json-format');
          const copyButton = byId('json-copy');
          const downloadButton = byId('json-download');
          const applyButton = byId('json-apply');
          const resetButton = byId('json-reload');
          const editorStatus = byId('json-editor-status');

          const initialText = directory?.raw && directory.raw.trim()
            ? directory.raw
            : JSON.stringify(directory?.payload ?? { games: workingGames }, null, 2);
          const originalGames = workingGames.slice();

          const setEditorStatus = (message, tone = 'info') => {
            if (!editorStatus) return;
            editorStatus.textContent = message;
            editorStatus.dataset.tone = tone;
          };

          editor.value = initialText;
          setEditorStatus(`Loaded ${workingGames.length} game${workingGames.length === 1 ? '' : 's'} from games-directory.json.`);

          const parseEditorValue = () => {
            try {
              const parsed = JSON.parse(editor.value);
              const gamesFromJson = Array.isArray(parsed?.games)
                ? parsed.games
                : Array.isArray(parsed)
                ? parsed
                : null;
              if (!Array.isArray(gamesFromJson)) {
                throw new Error('The JSON must include a top-level "games" array.');
              }
              return { parsed, games: gamesFromJson };
            } catch (err) {
              setEditorStatus(`JSON error: ${err.message}`, 'error');
              return null;
            }
          };

          formatButton?.addEventListener('click', () => {
            const result = parseEditorValue();
            if (!result) return;
            editor.value = JSON.stringify(result.parsed, null, 2);
            setEditorStatus('Formatted JSON with standard indentation.', 'success');
          });

          applyButton?.addEventListener('click', () => {
            const result = parseEditorValue();
            if (!result) return;
            editor.value = JSON.stringify(result.parsed, null, 2);
            updateFromEditor(result.games);
            setEditorStatus(
              `Applied ${result.games.length} game${result.games.length === 1 ? '' : 's'} to the directory preview. Remember to copy or download the JSON to save it.`,
              'success'
            );
          });

          copyButton?.addEventListener('click', () => {
            if (!navigator?.clipboard) {
              setEditorStatus('Clipboard API unavailable. Select the text and copy it manually.', 'error');
              return;
            }
            navigator.clipboard
              .writeText(editor.value)
              .then(() => setEditorStatus('Copied JSON to clipboard. Paste it into games-directory.json to save your changes.', 'success'))
              .catch(() => setEditorStatus('Failed to copy JSON. Please copy it manually.', 'error'));
          });

          downloadButton?.addEventListener('click', () => {
            const blob = new Blob([editor.value], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = 'games-directory.json';
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            setTimeout(() => URL.revokeObjectURL(url), 0);
            setEditorStatus('Downloaded a JSON file with your edits.', 'success');
          });

          resetButton?.addEventListener('click', () => {
            editor.value = initialText;
            updateFromEditor(originalGames.slice());
            setEditorStatus('Reverted to the published JSON data.', 'success');
          });
        }
      })
      .catch(() => {
        if (status) {
          status.textContent = 'Failed to load the game directory. Please refresh and try again.';
        }
      });
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

  function renderJsonEditorPage() {
    setActiveNav('tools');
    setFooterYear();

    const fileInput = byId('json-file-input');
    const dropzone = byId('json-dropzone');
    const editor = byId('json-editor-area');
    const status = byId('json-status');
    const preview = byId('json-preview');
    const fileInfo = byId('json-file-info');
    const summary = byId('json-structure-summary');
    const treeContainer = byId('json-tree');
    const clearBtn = byId('json-clear');
    const formatBtn = byId('json-format');
    const copyBtn = byId('json-copy');
    const downloadBtn = byId('json-download');

    if (!editor || !status || !preview) {
      return;
    }

    let currentFileName = '';
    let parseTimer = null;

    const formatBytes = (bytes) => {
      if (!Number.isFinite(bytes) || bytes <= 0) {
        return '';
      }
      const units = ['B', 'KB', 'MB', 'GB'];
      let value = bytes;
      let unitIndex = 0;
      while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
      }
      const precision = value >= 100 || unitIndex === 0 ? 0 : 1;
      return `${value.toFixed(precision)} ${units[unitIndex]}`;
    };

    const escapeHtml = (value) =>
      String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const formatPrimitive = (value) => {
      if (value === null) {
        return '<span class="json-tree__value json-tree__value--null">null</span>';
      }
      if (typeof value === 'number') {
        return `<span class="json-tree__value json-tree__value--number">${value}</span>`;
      }
      if (typeof value === 'boolean') {
        return `<span class="json-tree__value json-tree__value--boolean">${value}</span>`;
      }
      if (typeof value === 'string') {
        return `<span class="json-tree__value json-tree__value--string">"${escapeHtml(value)}"</span>`;
      }
      return `<span class="json-tree__value">${escapeHtml(String(value))}</span>`;
    };

    const buildTreeNode = (parent, value, label) => {
      const item = document.createElement('li');
      if (value && typeof value === 'object') {
        const details = document.createElement('details');
        details.open = true;

        const summaryEl = document.createElement('summary');
        const isArray = Array.isArray(value);
        const size = isArray ? value.length : Object.keys(value).length;
        summaryEl.innerHTML = `
          <span class="json-tree__key">${escapeHtml(label)}</span>
          <span class="json-tree__type">${isArray ? 'Array' : 'Object'} (${size})</span>
        `;
        details.appendChild(summaryEl);

        const list = document.createElement('ul');
        list.className = 'json-tree';
        const entries = isArray ? value.map((entry, index) => [index, entry]) : Object.entries(value);
        if (entries.length === 0) {
          const empty = document.createElement('li');
          empty.className = 'json-tree__empty';
          empty.textContent = 'Empty';
          list.appendChild(empty);
        } else {
          entries.forEach(([key, child]) => {
            const childLabel = isArray ? `[${key}]` : key;
            buildTreeNode(list, child, childLabel);
          });
        }
        details.appendChild(list);
        item.appendChild(details);
      } else {
        item.innerHTML = `
          <span class="json-tree__key">${escapeHtml(label)}</span>
          <span class="json-tree__separator">:</span>
          ${formatPrimitive(value)}
        `;
      }
      parent.appendChild(item);
    };

    const renderTree = (value) => {
      if (!treeContainer) {
        return;
      }
      treeContainer.innerHTML = '';
      if (value === undefined) {
        const empty = document.createElement('p');
        empty.className = 'json-tree__empty';
        empty.textContent = 'Structure preview appears once JSON parses correctly.';
        treeContainer.appendChild(empty);
        return;
      }
      const list = document.createElement('ul');
      list.className = 'json-tree';
      buildTreeNode(list, value, 'root');
      treeContainer.appendChild(list);
    };

    const describeStructure = (value) => {
      if (value === null) {
        return 'null value';
      }
      if (Array.isArray(value)) {
        const count = value.length;
        return `Array with ${count} item${count === 1 ? '' : 's'}`;
      }
      if (typeof value === 'object') {
        const keys = Object.keys(value).length;
        return `Object with ${keys} key${keys === 1 ? '' : 's'}`;
      }
      return `Primitive ${typeof value}`;
    };

    const setStatus = (message, tone = 'muted') => {
      status.textContent = message;
      status.dataset.tone = tone;
    };

    const updateFileInfo = (message) => {
      if (fileInfo) {
        fileInfo.textContent = message;
      }
    };

    const updateSummary = (value) => {
      if (summary) {
        summary.textContent = value;
      }
    };

    const resetPreview = () => {
      preview.textContent = '{\n}';
      renderTree(undefined);
      updateSummary('No data loaded');
    };

    const parseEditor = () => {
      const raw = editor.value.trim();
      if (!raw) {
        resetPreview();
        setStatus('Upload a JSON file or paste JSON to get started.');
        return null;
      }
      try {
        const parsed = JSON.parse(raw);
        const formatted = JSON.stringify(parsed, null, 2);
        preview.textContent = formatted;
        renderTree(parsed);
        updateSummary(describeStructure(parsed));
        setStatus('Valid JSON detected.', 'success');
        return { parsed, formatted };
      } catch (error) {
        setStatus(`Invalid JSON: ${error.message}`, 'error');
        updateSummary('Parsing error');
        return null;
      }
    };

    const scheduleParse = () => {
      window.clearTimeout(parseTimer);
      parseTimer = window.setTimeout(parseEditor, 250);
    };

    const loadText = (text, name, size) => {
      editor.value = text;
      currentFileName = name || '';
      const characters = text.length;
      const parts = [];
      if (name) {
        parts.push(`Loaded ${name}`);
      } else {
        parts.push('Loaded pasted JSON');
      }
      if (Number.isFinite(size)) {
        const formattedSize = formatBytes(size);
        if (formattedSize) {
          parts.push(`~${formattedSize}`);
        }
      }
      parts.push(`${characters} character${characters === 1 ? '' : 's'}`);
      updateFileInfo(parts.join(' • '));
      parseEditor();
    };

    const handleFile = (file) => {
      if (!file) {
        return;
      }
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const text = typeof reader.result === 'string' ? reader.result : '';
        loadText(text, file.name, file.size);
      });
      reader.addEventListener('error', () => {
        setStatus('Unable to read file. Please try again.', 'error');
      });
      reader.readAsText(file);
    };

    fileInput?.addEventListener('change', (event) => {
      const input = event.target;
      const [file] = input.files || [];
      handleFile(file);
      input.value = '';
    });

    if (dropzone) {
      const clearDragState = () => dropzone.classList.remove('is-dragover');

      dropzone.addEventListener('click', () => {
        fileInput?.click();
      });

      dropzone.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          fileInput?.click();
        }
      });

      dropzone.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropzone.classList.add('is-dragover');
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = 'copy';
        }
      });

      dropzone.addEventListener('dragleave', clearDragState);
      dropzone.addEventListener('dragend', clearDragState);
      dropzone.addEventListener('drop', (event) => {
        event.preventDefault();
        clearDragState();
        const items = event.dataTransfer?.files;
        if (items && items.length) {
          handleFile(items[0]);
          return;
        }
        const text = event.dataTransfer?.getData('application/json') || event.dataTransfer?.getData('text/plain');
        if (text) {
          loadText(text, 'pasted-data.json');
        }
      });
    }

    editor.addEventListener('input', scheduleParse);

    clearBtn?.addEventListener('click', () => {
      editor.value = '';
      currentFileName = '';
      updateFileInfo('No file selected yet.');
      resetPreview();
      setStatus('Editor cleared. Paste or upload new JSON.');
    });

    formatBtn?.addEventListener('click', () => {
      const result = parseEditor();
      if (result) {
        editor.value = result.formatted;
        setStatus('JSON formatted with 2-space indentation.', 'success');
      }
    });

    copyBtn?.addEventListener('click', async () => {
      const value = editor.value;
      if (!value) {
        setStatus('Nothing to copy yet. Paste or load JSON first.');
        return;
      }
      try {
        await navigator.clipboard.writeText(value);
        setStatus('JSON copied to clipboard.', 'success');
      } catch (error) {
        console.error(error);
        setStatus('Copy failed. Please copy manually.', 'error');
      }
    });

    downloadBtn?.addEventListener('click', () => {
      const result = parseEditor();
      if (!result) {
        setStatus('Fix JSON errors before downloading.', 'error');
        return;
      }
      const filename = currentFileName && currentFileName.toLowerCase().endsWith('.json')
        ? currentFileName
        : currentFileName
        ? `${currentFileName}.json`
        : 'json-data.json';
      const blob = new Blob([result.formatted], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      setStatus(`Downloaded ${filename}.`, 'success');
    });

    updateFileInfo('No file selected yet.');
    resetPreview();
  }

  function init() {
    initSearch();
  }

  init();

  window.PageInit = {
    home: renderHome,
    games: renderGamesPage,
    newGames: renderNewGamesPage,
    browsergame: renderBrowserGamesPage,
    gameDirectory: renderGameDirectoryPage,
    tools: renderToolsPage,
    rankings: renderRankingsPage,
    gameDetail: renderGameDetail,
    about: renderAboutPage,
    jsonEditor: renderJsonEditorPage
  };
})();

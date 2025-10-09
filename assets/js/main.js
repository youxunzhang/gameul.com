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

    const iframeWrapper = document.createElement('div');
    iframeWrapper.className = 'iframe-wrapper';

    const iframe = document.createElement('iframe');
    iframe.src = game.embedUrl;
    iframe.title = `Play ${game.title}`;
    iframe.loading = 'lazy';
    iframe.allowFullscreen = true;
    iframe.setAttribute('allowfullscreen', '');
    const extraIframeAttrs = game.iframeAttributes && typeof game.iframeAttributes === 'object' ? game.iframeAttributes : {};
    Object.entries(extraIframeAttrs).forEach(([key, value]) => {
      if (value === true) {
        iframe.setAttribute(key, '');
      } else if (value !== false && value != null) {
        iframe.setAttribute(key, String(value));
      }
    });

    iframeWrapper.appendChild(iframe);

    const tip = document.createElement('p');
    tip.className = 'play-tip';
    tip.textContent = `Tip: Use ${game.controls.join(', ')}.`;

    iframeSection.appendChild(iframeWrapper);
    iframeSection.appendChild(tip);

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

  function renderIframePage() {
    setActiveNav('iframe');
    setFooterYear();
  }

  function renderKungfuPage() {
    setActiveNav('tools');
    setFooterYear();

    const downloadButton = byId('scrape-download');
    const status = byId('scrape-status');
    const tableBody = byId('scrape-table-body');
    const count = byId('scrape-count');
    const jsonOutput = byId('scrape-json');
    const sourceLabel = byId('scrape-source-label');
    const siteCards = Array.from(document.querySelectorAll('[data-site-card]'));

    if (!downloadButton || !status || !tableBody || !jsonOutput || !count) {
      return;
    }

    let results = [];
    let activeSiteId = '';
    let activeSiteName = '';

    const GAME_DISTRIBUTION_BASE_URL = 'https://gamedistribution.com';
    const GAME_DISTRIBUTION_PATH = '/games/';
    const GAME_DISTRIBUTION_PAGE_SIZE = 60;
    const GAME_DISTRIBUTION_MAX_PAGES = 10;

    const CARD_BADGE_LABELS = {
      idle: '站点待命',
      progress: '抓取中…',
      success: '抓取成功',
      warning: '已回退',
      error: '抓取失败'
    };

    const badgeLabelForTone = (tone) => CARD_BADGE_LABELS[tone] || CARD_BADGE_LABELS.idle;

    const createCardState = (card) => {
      const badge = card.querySelector('[data-role="badge"]');
      const message = card.querySelector('[data-role="status"]');
      return (tone, text) => {
        const effectiveTone = tone || 'idle';
        if (badge) {
          badge.dataset.tone = effectiveTone;
          badge.textContent = badgeLabelForTone(effectiveTone);
        }
        if (message) {
          message.textContent = text || '';
        }
      };
    };

    const updateSourceLabel = () => {
      if (sourceLabel) {
        sourceLabel.textContent = activeSiteName || '未选择';
      }
    };

    const updateStatus = (message, tone = 'info') => {
      status.textContent = message;
      status.dataset.tone = tone;
    };

    const updateCount = () => {
      count.textContent = results.length.toString();
    };

    const deriveTitleFromUrl = (value) => {
      if (!value) {
        return '';
      }
      try {
        const parsed = new URL(value, window.location.origin);
        const segments = parsed.pathname.split('/').filter(Boolean);
        if (!segments.length) {
          return decodeURIComponent(parsed.hostname);
        }
        const last = decodeURIComponent(segments[segments.length - 1]);
        return last.replace(/[-_]+/g, ' ').trim() || decodeURIComponent(parsed.hostname);
      } catch (error) {
        const safe = String(value);
        const parts = safe.split('/').filter(Boolean);
        const candidate = parts.length ? parts[parts.length - 1] : safe;
        return decodeURIComponent(candidate).replace(/[-_]+/g, ' ').trim();
      }
    };

    const renderRows = () => {
      tableBody.innerHTML = '';
      if (!results.length) {
        const row = document.createElement('tr');
        const empty = document.createElement('td');
        empty.colSpan = 4;
        empty.className = 'scraper-table__empty';
        empty.textContent = '暂无数据，选择上方站点开始抓取。';
        row.appendChild(empty);
        tableBody.appendChild(row);
        return;
      }

      results.forEach((item, index) => {
        const row = document.createElement('tr');

        const indexCell = document.createElement('td');
        indexCell.textContent = String(index + 1);
        row.appendChild(indexCell);

        const coverCell = document.createElement('td');
        if (item.cover) {
          const image = document.createElement('img');
          image.src = item.cover;
          image.alt = `${item.title || deriveTitleFromUrl(item.url)} 封面图`;
          image.loading = 'lazy';
          coverCell.appendChild(image);
        } else {
          coverCell.textContent = '—';
        }
        row.appendChild(coverCell);

        const titleCell = document.createElement('td');
        const title = item.title?.trim() || deriveTitleFromUrl(item.url) || '未命名链接';
        titleCell.textContent = title;
        row.appendChild(titleCell);

        const linkCell = document.createElement('td');
        if (item.url) {
          const anchor = document.createElement('a');
          anchor.href = item.url;
          anchor.target = '_blank';
          anchor.rel = 'noopener';
          anchor.textContent = '打开链接';
          linkCell.appendChild(anchor);
        } else {
          linkCell.textContent = '—';
        }
        row.appendChild(linkCell);

        tableBody.appendChild(row);
      });
    };

    const updateJsonPreview = () => {
      jsonOutput.textContent = results.length ? JSON.stringify(results, null, 2) : '[]';
    };

    const applyResults = (siteId, siteName, newResults) => {
      results = newResults;
      activeSiteId = siteId;
      activeSiteName = siteName;
      updateCount();
      renderRows();
      updateJsonPreview();
      updateSourceLabel();
      downloadButton.disabled = results.length === 0;
    };

    const toArray = (value) => {
      if (!value) return [];
      return Array.isArray(value) ? value : [value];
    };

    const pickFirstString = (candidates) => {
      for (const candidate of candidates) {
        if (typeof candidate === 'string') {
          const trimmed = candidate.trim();
          if (trimmed) {
            return trimmed;
          }
        }
      }
      return undefined;
    };

    const normalizeUrl = (baseUrl, relative) => {
      if (!relative) return undefined;
      try {
        return new URL(relative, baseUrl).toString();
      } catch (error) {
        return undefined;
      }
    };

    const extractSlugFromUrl = (candidateUrl) => {
      if (!candidateUrl) return undefined;
      try {
        const parsed = new URL(candidateUrl, GAME_DISTRIBUTION_BASE_URL);
        const parts = parsed.pathname.replace(/\/$/, '').split('/').filter(Boolean);
        if (!parts.length) return undefined;
        return parts[parts.length - 1];
      } catch (error) {
        const fallbackMatch = String(candidateUrl).match(/([a-z0-9-]+)(?:\.[a-z]+)?$/i);
        return fallbackMatch ? fallbackMatch[1] : undefined;
      }
    };

    const looksLikeGame = (node) => {
      if (!node || typeof node !== 'object') {
        return false;
      }
      const hasSlug = typeof node.slug === 'string' && node.slug.trim().length > 0;
      const hasTitle = typeof node.title === 'string' && node.title.trim().length > 0;
      const hasName = typeof node.name === 'string' && node.name.trim().length > 0;
      const hasUrl =
        typeof node.url === 'string' ||
        (node.urls && (typeof node.urls === 'string' || typeof node.urls === 'object')) ||
        (node.links && (typeof node.links === 'string' || typeof node.links === 'object'));
      return (hasSlug && (hasTitle || hasName)) || (hasTitle && hasUrl) || (hasName && hasUrl);
    };

    const extractGamesFromObject = (node) => {
      if (!node || typeof node !== 'object') {
        return [];
      }

      if (Array.isArray(node)) {
        return node.flatMap((entry) => extractGamesFromObject(entry));
      }

      const candidates = [];
      for (const value of Object.values(node)) {
        if (!value) continue;
        if (typeof value === 'object') {
          candidates.push(...extractGamesFromObject(value));
        }
      }

      if (looksLikeGame(node)) {
        candidates.push(node);
      }

      return candidates;
    };

    const extractNuxtAssignment = (snippet) => {
      const assignmentRegex = /window\.__NUXT__\s*=\s*([\s\S]+?);(?:\s*window\.__NUXT__|\s*$)/;
      const match = snippet.match(assignmentRegex);
      if (!match) {
        return null;
      }
      const expression = match[1].trim();
      if (!expression) {
        return null;
      }
      try {
        return Function('"use strict"; return (' + expression + ');')();
      } catch (error) {
        try {
          return Function('"use strict"; const window = {}; return (' + expression + ');')();
        } catch (secondaryError) {
          return null;
        }
      }
    };

    const extractFromHtml = (html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const scripts = Array.from(doc.querySelectorAll('script'));
      const payloads = [];

      scripts.forEach((script) => {
        const text = (script.textContent || '').trim();
        if (!text) {
          return;
        }

        const type = (script.getAttribute('type') || '').toLowerCase();
        if (type.includes('json')) {
          try {
            payloads.push(JSON.parse(text));
            return;
          } catch (error) {
            console.error('Failed to parse JSON script from GameDistribution page', error);
          }
        }

        if (text.startsWith('{') || text.startsWith('[')) {
          try {
            payloads.push(JSON.parse(text));
            return;
          } catch (error) {
            // Ignore JSON parse failures for inline scripts.
          }
        }

        if (text.includes('window.__NUXT__')) {
          const nuxtPayload = extractNuxtAssignment(text);
          if (nuxtPayload) {
            payloads.push(nuxtPayload);
          }
        }
      });

      if (!payloads.length) {
        return [];
      }

      return payloads.flatMap((payload) => extractGamesFromObject(payload));
    };

    const extractFromJson = (json) => {
      if (!json) {
        return [];
      }
      return extractGamesFromObject(json);
    };

    const normaliseGame = (node) => {
      const slug = pickFirstString([
        node.slug,
        node.alias,
        node.gameSlug,
        node.seo && node.seo.slug,
        node.url && typeof node.url === 'string' && extractSlugFromUrl(node.url),
        node.urls && typeof node.urls === 'object' && extractSlugFromUrl(node.urls.detail || node.urls.play),
        node.links && typeof node.links === 'object' && extractSlugFromUrl(node.links.detail || node.links.play)
      ]);

      const title = pickFirstString([
        node.title,
        node.name,
        node.gameTitle,
        node.seo && node.seo.title
      ]);

      const thumbnail = pickFirstString([
        node.thumbnail,
        node.thumb,
        node.image,
        node.cover,
        node.icon,
        node.images && node.images.thumbnail,
        node.images && node.images.cover,
        node.assets && node.assets.thumbnail,
        node.assets && node.assets.icon
      ]);

      const detailUrl = pickFirstString([
        node.detailUrl,
        node.detailsUrl,
        node.urls && node.urls.detail,
        node.links && node.links.detail,
        node.seo && node.seo.url
      ]);

      const normalizedDetailUrl =
        normalizeUrl(GAME_DISTRIBUTION_BASE_URL, detailUrl) ||
        (slug ? `${GAME_DISTRIBUTION_BASE_URL}${GAME_DISTRIBUTION_PATH}${slug.replace(/^\/+/, '')}/` : null);

      const normalizedCover = normalizeUrl(GAME_DISTRIBUTION_BASE_URL, thumbnail) || thumbnail || null;

      return {
        slug: slug || null,
        title: title || null,
        cover: normalizedCover,
        detailUrl: normalizedDetailUrl
      };
    };

    const fetchGameDistributionPage = async (pageNumber) => {
      const url = new URL(GAME_DISTRIBUTION_PATH, GAME_DISTRIBUTION_BASE_URL);
      url.searchParams.set('page', String(pageNumber));
      url.searchParams.set('limit', String(GAME_DISTRIBUTION_PAGE_SIZE));
      url.searchParams.set('pageSize', String(GAME_DISTRIBUTION_PAGE_SIZE));
      url.searchParams.set('perPage', String(GAME_DISTRIBUTION_PAGE_SIZE));

      const response = await fetch(url.toString(), {
        headers: {
          accept: 'text/html,application/json;q=0.9,*/*;q=0.8'
        }
      });

      if (!response.ok) {
        throw new Error(`请求失败：HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return { kind: 'json', payload: await response.json() };
      }

      return { kind: 'html', payload: await response.text() };
    };

    const scrapeFromGameDistribution = async (setProgress, maxPages = GAME_DISTRIBUTION_MAX_PAGES) => {
      const entries = new Map();
      const order = [];
      const pagesToFetch = Math.min(GAME_DISTRIBUTION_MAX_PAGES, Math.max(1, Number(maxPages) || 1));

      for (let page = 1; page <= pagesToFetch; page += 1) {
        setProgress?.(`正在抓取 GameDistribution 第 ${page} 页…`, 'info');

        const source = await fetchGameDistributionPage(page);

        const rawGames =
          source.kind === 'json'
            ? extractFromJson(source.payload)
            : extractFromHtml(source.payload);

        if (!rawGames.length) {
          if (page === 1) {
            throw new Error('未在 GameDistribution 页面中找到游戏数据。');
          }
          break;
        }

        let pageAdded = 0;
        rawGames.forEach((raw) => {
          const normalized = normaliseGame(raw);
          if (!normalized.detailUrl && !normalized.slug) {
            return;
          }

          const key =
            (normalized.slug || normalized.detailUrl || normalized.title || '').toLowerCase();
          if (!key) {
            return;
          }

          if (!entries.has(key)) {
            order.push(key);
            entries.set(key, {
              title: normalized.title || normalized.slug || '未命名游戏',
              url: normalized.detailUrl || null,
              cover: normalized.cover || ''
            });
            if (entries.get(key).url) {
              pageAdded += 1;
            }
          } else {
            const existing = entries.get(key);
            if (!existing.title && normalized.title) {
              existing.title = normalized.title;
            }
            if (!existing.url && normalized.detailUrl) {
              existing.url = normalized.detailUrl;
            }
            if (!existing.cover && normalized.cover) {
              existing.cover = normalized.cover;
            }
          }
        });

        if (pageAdded === 0 && rawGames.length < GAME_DISTRIBUTION_PAGE_SIZE) {
          break;
        }
      }

      const mapped = order
        .map((key) => entries.get(key))
        .filter((entry) => entry && entry.url)
        .map((entry) => ({
          title: entry.title || '未命名游戏',
          url: entry.url,
          cover: entry.cover || ''
        }));

      if (!mapped.length) {
        throw new Error('未成功抓取到任何 GameDistribution 游戏。');
      }

      return mapped;
    };

    const loadLocalGamesFallback = async () => {
      const localGames = Array.isArray(data.games) ? data.games : [];
      let games = localGames;

      if (!games.length) {
        try {
          const fallback = await loadBrowserGamesData();
          games = Array.isArray(fallback?.games) ? fallback.games : [];
        } catch (error) {
          console.error('Failed to fetch browser games data for fallback', error);
        }
      }

      if (!games.length) {
        return [];
      }

      return games.map((game) => {
        const url = new URL(`/games/${game.slug}/`, window.location.origin).href;
        const cover = game.cover || game.hero || (Array.isArray(game.screenshots) ? game.screenshots[0] : '');
        return {
          title: game.title,
          url,
          cover
        };
      });
    };

    const pickTextFromNode = (node, names) => {
      for (const name of names) {
        let element = null;
        if (typeof node.getElementsByTagName === 'function') {
          element = node.getElementsByTagName(name)[0];
        }
        if (!element && typeof node.getElementsByTagNameNS === 'function') {
          element = node.getElementsByTagNameNS('*', name.split(':').pop())[0];
        }
        if (!element && typeof node.querySelector === 'function') {
          const selector = name.includes(':') ? name.replace(/:/g, '\:') : name;
          element = node.querySelector(selector);
        }
        const text = element?.textContent?.trim();
        if (text) {
          return text;
        }
      }
      return '';
    };

    const fetchXmlSitemap = async (url) => {
      const response = await fetch(url, {
        headers: {
          accept: 'application/xml,text/xml;q=0.9,*/*;q=0.8'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`请求失败：HTTP ${response.status}`);
      }

      return response.text();
    };

    const parseSitemapEntries = (xmlText) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, 'application/xml');
      if (doc.querySelector('parsererror')) {
        throw new Error('Sitemap XML 解析失败。');
      }

      const entries = [];

      const urlNodes = Array.from(doc.getElementsByTagName('url'));
      urlNodes.forEach((node) => {
        const locText = pickTextFromNode(node, ['loc']);
        if (!locText) {
          return;
        }
        const imageText = pickTextFromNode(node, ['image:loc', 'image:thumbnail_loc', 'image:image', 'image:contentloc']);
        entries.push({
          title: deriveTitleFromUrl(locText),
          url: locText,
          cover: imageText || ''
        });
      });

      if (!entries.length) {
        const sitemapNodes = Array.from(doc.getElementsByTagName('sitemap'));
        sitemapNodes.forEach((node) => {
          const locText = pickTextFromNode(node, ['loc']);
          if (!locText) {
            return;
          }
          entries.push({
            title: deriveTitleFromUrl(locText),
            url: locText,
            cover: ''
          });
        });
      }

      const unique = new Map();
      entries.forEach((entry) => {
        const key = entry.url || entry.title;
        if (!key) {
          return;
        }
        if (!unique.has(key)) {
          unique.set(key, entry);
        }
      });

      return Array.from(unique.values());
    };

    siteCards.forEach((card) => {
      const startButton = card.querySelector('[data-role="start"]');
      const limitInput = card.querySelector('[data-role="limit-input"]');
      const siteId = card.dataset.siteId || '';
      const type = card.dataset.type || 'xml';
      const sitemapUrl = card.dataset.sitemap || '';
      const siteName = card.querySelector('h3')?.textContent?.trim() || siteId || '站点';
      const setCardState = createCardState(card);

      setCardState('idle', '站点待抓取。');

      if (!startButton) {
        return;
      }

      startButton.addEventListener('click', async () => {
        const rawLimit = limitInput ? Number.parseInt(limitInput.value, 10) : Number.NaN;
        const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : null;

        startButton.disabled = true;
        setCardState('progress', `正在抓取 ${siteName}…`);
        updateStatus(`正在抓取 ${siteName}…`, 'info');

        try {
          if (type === 'gamedistribution') {
            const pagesNeeded = limit
              ? Math.min(
                  GAME_DISTRIBUTION_MAX_PAGES,
                  Math.max(1, Math.ceil(limit / GAME_DISTRIBUTION_PAGE_SIZE))
                )
              : GAME_DISTRIBUTION_MAX_PAGES;

            const progress = (message, tone = 'info') => {
              const badgeTone = tone === 'success' ? 'success' : tone === 'error' ? 'error' : 'progress';
              setCardState(badgeTone, message);
              updateStatus(message, tone);
            };

            const allResults = await scrapeFromGameDistribution(progress, pagesNeeded);
            const truncated = limit ? allResults.slice(0, limit) : allResults;
            setCardState('success', `成功抓取 ${truncated.length} 条记录。`);
            updateStatus(`已更新 ${siteName} 数据，共 ${truncated.length} 条。`, 'success');
            applyResults(siteId, siteName, truncated);
            return;
          }

          if (!sitemapUrl) {
            throw new Error('未配置 sitemap 地址。');
          }

          const xml = await fetchXmlSitemap(sitemapUrl);
          const entries = parseSitemapEntries(xml);
          if (!entries.length) {
            throw new Error('未在 sitemap 中解析到任何链接。');
          }

          const truncated = limit ? entries.slice(0, limit) : entries;
          setCardState('success', `成功抓取 ${truncated.length} 条记录。`);
          updateStatus(`已更新 ${siteName} 数据，共 ${truncated.length} 条。`, 'success');
          applyResults(siteId, siteName, truncated);
        } catch (error) {
          console.error(`Failed to scrape ${siteName}`, error);
          const message = error instanceof Error ? error.message : '未知错误';

          if (type === 'gamedistribution') {
            try {
              const fallbackResults = await loadLocalGamesFallback();
              if (fallbackResults.length) {
                const truncated = limit ? fallbackResults.slice(0, limit) : fallbackResults;
                setCardState('warning', `抓取失败，已回退到站内数据（${truncated.length} 条）。`);
                updateStatus(`GameDistribution 抓取失败，已回退到站内数据。`, 'warning');
                applyResults(`${siteId}-fallback`, `${siteName}（站内备份）`, truncated);
              } else {
                setCardState('error', `抓取失败：${message}`);
                updateStatus(`抓取失败：${message}`, 'error');
              }
            } catch (fallbackError) {
              console.error('Failed to load fallback games', fallbackError);
              setCardState('error', `抓取失败：${message}`);
              updateStatus(`抓取失败：${message}`, 'error');
            }
          } else {
            setCardState('error', `抓取失败：${message}`);
            updateStatus(`抓取失败：${message}`, 'error');
          }
        } finally {
          startButton.disabled = false;
        }
      });
    });

    downloadButton.addEventListener('click', () => {
      if (!results.length) {
        return;
      }
      const filenameBase = activeSiteId || 'scraped-data';
      const filename = `${filenameBase}.json`;
      const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      updateStatus(`已下载 ${filename}。`, 'success');
    });

    updateStatus('待命：选择任意站点并点击“抓取”。', 'info');
    updateCount();
    renderRows();
    updateJsonPreview();
    updateSourceLabel();
    downloadButton.disabled = true;
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
    const submitForm = byId('json-submit-form');
    const submitUrlInput = byId('json-submit-url');
    const submitBtn = byId('json-submit');

    if (!editor || !status || !preview) {
      return;
    }

    let currentFileName = '';
    let parseTimer = null;
    const submitStorageKey = 'gameul-json-editor-submit-url';

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

    const getStoredSubmitUrl = () => {
      if (!submitUrlInput) {
        return '';
      }
      try {
        return window.localStorage.getItem(submitStorageKey) || '';
      } catch (error) {
        console.warn('Unable to read stored submit URL', error);
        return '';
      }
    };

    const persistSubmitUrl = (value) => {
      if (!submitUrlInput) {
        return;
      }
      try {
        if (value) {
          window.localStorage.setItem(submitStorageKey, value);
        } else {
          window.localStorage.removeItem(submitStorageKey);
        }
      } catch (error) {
        console.warn('Unable to store submit URL', error);
      }
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

    submitUrlInput?.addEventListener('blur', (event) => {
      const input = event.target;
      if (input instanceof HTMLInputElement) {
        persistSubmitUrl(input.value.trim());
      }
    });

    submitForm?.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (typeof fetch !== 'function') {
        setStatus('Submit is not supported in this browser.', 'error');
        return;
      }

      const result = parseEditor();
      if (!result) {
        setStatus('Fix JSON errors before submitting.', 'error');
        return;
      }

      const rawUrl = submitUrlInput?.value.trim() || '';
      if (!rawUrl) {
        setStatus('Enter a submit endpoint URL first.', 'error');
        submitUrlInput?.focus();
        return;
      }

      let endpoint;
      try {
        endpoint = new URL(rawUrl);
      } catch (error) {
        setStatus('Submit endpoint must be a valid URL (https://example.com/path).', 'error');
        submitUrlInput?.focus();
        return;
      }

      if (!['http:', 'https:'].includes(endpoint.protocol)) {
        setStatus('Submit endpoint must start with http:// or https://.', 'error');
        submitUrlInput?.focus();
        return;
      }

      persistSubmitUrl(endpoint.toString());

      const button = submitBtn;
      const previousText = button?.textContent || '';
      if (button) {
        button.disabled = true;
        button.textContent = 'Submitting…';
      }

      setStatus(`Submitting JSON to ${endpoint.host}…`);

      try {
        const response = await fetch(endpoint.toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: result.formatted
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        setStatus(`Submitted JSON successfully (status ${response.status}).`, 'success');
      } catch (error) {
        console.error(error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        setStatus(`Submit failed: ${message}.`, 'error');
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = previousText || 'Submit';
        }
      }
    });

    updateFileInfo('No file selected yet.');
    resetPreview();

    const storedUrl = getStoredSubmitUrl();
    if (storedUrl && submitUrlInput) {
      submitUrlInput.value = storedUrl;
    }
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
    iframe: renderIframePage,
    kungfu: renderKungfuPage,
    jsonEditor: renderJsonEditorPage
  };
})();

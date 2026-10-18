import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const games = JSON.parse(fs.readFileSync(path.join(root, 'data', 'games.json'), 'utf8'))
  .filter(game => game.status === 'published');
const today = '2026-10-18';
const siteUrl = 'https://gameul.com';

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const jsonLd = value => JSON.stringify(value).replace(/</g, '\\u003c');
const write = (relativePath, content) => {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content.trimStart(), 'utf8');
};

function head({ title, description, canonical, image = '/img-classic/2048.jpg', robots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1', schemas = [] }) {
  const canonicalUrl = `${siteUrl}${canonical}`;
  const imageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;
  return `
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="author" content="Gameul">
  <meta name="robots" content="${robots}">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="icon" href="/assets/images/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/css/site.css">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Gameul">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:alt" content="Gameul free online games">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${imageUrl}">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8794607118520437" crossorigin="anonymous"></script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-F9DEFKMPM5"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-F9DEFKMPM5');</script>
  ${schemas.map(schema => `<script type="application/ld+json">${jsonLd(schema)}</script>`).join('\n  ')}`;
}

function header(current = '') {
  const navItem = (key, href, label) => `<a href="${href}"${current === key ? ' aria-current="page"' : ''}>${label}</a>`;
  const homeSearch = current === 'home' ? `    <form class="portal-search" data-game-search-form role="search">
      <span aria-hidden="true">⌕</span>
      <input type="search" name="q" aria-label="Search games" placeholder="Search games and categories">
      <button type="submit">Search</button>
    </form>
` : '';
  return `
<a class="skip-link" href="#main-content">Skip to content</a>
<header class="site-header${current === 'home' ? ' portal-header' : ''}">
  <div class="nav-shell${current === 'home' ? ' portal-nav-shell' : ''}">
    <a class="brand" href="/" aria-label="Gameul home"><span class="brand-mark" aria-hidden="true">G</span><span>Gameul</span></a>
${homeSearch}    <nav class="primary-nav${current === 'home' ? ' portal-primary-nav' : ''}" data-primary-nav aria-label="Main navigation">
      ${navItem('home', '/', 'Home')}
      ${navItem('puzzle', '/categories/puzzle-games/', 'Puzzle')}
      ${navItem('word', '/categories/word-games/', 'Word')}
      ${navItem('games', '/games.html', 'All Games')}
      ${navItem('about', '/about-us.html', 'About')}
    </nav>
    <a class="nav-search-link" href="/games.html#game-search" aria-label="Search games">⌕</a>
    <button class="menu-button" type="button" data-menu-button aria-expanded="false" aria-label="Open menu">☰</button>
  </div>
</header>`;
}

function footer() {
  return `
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div><h2>Gameul</h2><p>Play a Little, Every Day. Free browser games with no downloads and no sign-up required.</p></div>
      <div><h3>Play</h3><ul class="footer-links"><li><a href="/games.html">All Games</a></li><li><a href="/categories/puzzle-games/">Puzzle Games</a></li><li><a href="/categories/word-games/">Word Games</a></li></ul></div>
      <div><h3>Gameul</h3><ul class="footer-links"><li><a href="/about-us.html">About Us</a></li><li><a href="/contact.html">Contact</a></li></ul></div>
      <div><h3>Legal</h3><ul class="footer-links"><li><a href="/privacy-policy.html">Privacy Policy</a></li><li><a href="/terms-of-use.html">Terms of Use</a></li></ul></div>
    </div>
    <div class="footer-bottom"><span>© <span data-current-year>2026</span> Gameul. All rights reserved.</span><span>Games run directly in your browser.</span></div>
  </div>
</footer>
<script defer src="/assets/js/site.js"></script>`;
}

function card(game) {
  return `<a class="game-card" href="${game.gameUrl}" data-game-card data-title="${escapeHtml(game.title)}" data-category="${escapeHtml(game.category)}" data-tags="${escapeHtml(game.tags.join(' '))}">
    <div class="game-card-media"><img src="${game.thumbnail}" alt="${escapeHtml(game.title)} game preview" width="640" height="400" loading="lazy"></div>
    <div class="game-card-body"><span class="game-card-category">${escapeHtml(game.category)}</span><h3>${escapeHtml(game.title)}</h3><p>${escapeHtml(game.description)}</p><span class="game-card-cta">Play now →</span></div>
  </a>`;
}

function portalCard(game, className = '') {
  return `<a class="portal-game-card${className ? ` ${className}` : ''}" href="${game.gameUrl}" data-title="${escapeHtml(game.title)}" data-category="${escapeHtml(game.category)}" data-tags="${escapeHtml(game.tags.join(' '))}" aria-label="Play ${escapeHtml(game.title)} now">
    <img src="${game.thumbnail}" alt="" width="640" height="400" loading="${className.includes('is-featured') ? 'eager' : 'lazy'}">
    <div class="portal-game-copy"><span>${escapeHtml(game.category)}</span><h3>${escapeHtml(game.title)}</h3><strong>Play now <span aria-hidden="true">›</span></strong></div>
  </a>`;
}

function documentPage({ title, description, canonical, current, body, schemas = [], image, bodyClass = '' }) {
  return `<!doctype html>
<html lang="en">
<head>${head({ title, description, canonical, schemas, image })}</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
${header(current)}
<main id="main-content">${body}</main>
${footer()}
</body>
</html>`;
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Gameul',
  alternateName: 'Gameul Games',
  url: `${siteUrl}/`,
  description: 'Free online puzzle and word games that play instantly in a web browser.',
  inLanguage: 'en',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteUrl}/games.html?q={search_term_string}`,
    'query-input': 'required name=search_term_string'
  }
};

const itemListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Free online games at Gameul',
  numberOfItems: games.length,
  itemListElement: games.map((game, index) => ({
    '@type': 'ListItem', position: index + 1, name: game.title, url: `${siteUrl}${game.gameUrl}`
  }))
};

const featured = games.filter(game => game.featured);
const puzzleGames = games.filter(game => game.category === 'Puzzle');
const wordGames = games.filter(game => game.category === 'Word');

write('index.html', documentPage({
  title: 'Free Online Games – Play Instantly | Gameul',
  description: 'Play free online puzzle, word, card and arcade games at Gameul. No downloads or sign-up required. Start playing in your browser.',
  canonical: '/', current: 'home', schemas: [websiteSchema, itemListSchema], bodyClass: 'home-page',
  body: `
  <div class="home-layout">
    <aside class="game-sidebar" aria-label="Game categories">
      <nav>
        <a class="active" href="/" aria-label="Home"><span aria-hidden="true">⌂</span><small>Home</small></a>
        <a href="#popular-games" aria-label="Popular games"><span aria-hidden="true">★</span><small>Popular</small></a>
        <a href="/categories/puzzle-games/" aria-label="Puzzle games"><span aria-hidden="true">◆</span><small>Puzzle</small></a>
        <a href="/categories/word-games/" aria-label="Word games"><span aria-hidden="true">A</span><small>Word</small></a>
        <a href="/games.html" aria-label="All games"><span aria-hidden="true">▦</span><small>All</small></a>
      </nav>
    </aside>
    <div class="home-content">
      <header class="home-intro">
        <div><p>Play a little, every day</p><h1 id="home-title">Play free games online</h1></div>
        <a href="/games.html">View all ${games.length} games <span aria-hidden="true">→</span></a>
      </header>

      <section class="mood-strip" aria-label="Quick game collections">
        <a class="mood-card mood-brain" href="/games/sudoku/"><span aria-hidden="true">🧠</span><strong>Train your brain</strong><small>Sudoku &amp; logic</small></a>
        <a class="mood-card mood-quick" href="/games/tic-tac-toe/"><span aria-hidden="true">⚡</span><strong>5-minute fun</strong><small>Quick classics</small></a>
        <a class="mood-card mood-number" href="/games/2048/"><span aria-hidden="true">🔢</span><strong>Number games</strong><small>Merge &amp; solve</small></a>
        <a class="mood-card mood-word" href="/games/word-search/"><span aria-hidden="true">🔤</span><strong>Word play</strong><small>Find every word</small></a>
      </section>

      <section class="portal-section" id="popular-games" aria-labelledby="popular-title">
        <div class="portal-section-header"><div><span class="section-icon" aria-hidden="true">🔥</span><div><p>Ready when you are</p><h2 id="popular-title">Popular games</h2></div></div><a href="/games.html">All games <span aria-hidden="true">→</span></a></div>
        <div class="portal-game-grid">
          ${games.map((game, index) => portalCard(game, index === 0 ? 'is-featured' : (index === 5 ? 'is-wide' : ''))).join('')}
        </div>
      </section>

      <section class="home-seo-panel" aria-labelledby="why-gameul-title">
        <div><p class="eyebrow">No install. No account.</p><h2 id="why-gameul-title">Click a game and start playing</h2></div>
        <p>Every Gameul title runs directly in your browser and is tested for desktop and mobile. Choose a cover above to open the game instantly.</p>
        <a class="button" href="/games.html">Browse the game library</a>
      </section>
    </div>
  </div>`
}));

write('games.html', documentPage({
  title: 'All Free Online Games – Play in Your Browser | Gameul',
  description: 'Browse every free online game at Gameul. Play 2048, Minesweeper, Sudoku, Word Search and more instantly with no download or sign-up.',
  canonical: '/games.html', current: 'games', schemas: [itemListSchema],
  body: `
  <div class="container">
    <header class="page-hero"><p class="eyebrow">Game library</p><h1>All Free Online Games</h1><p>Browse ${games.length} original browser games. Every title is playable on desktop and mobile with no download or account.</p></header>
    <section class="section compact" aria-labelledby="library-title" data-game-library>
      <h2 id="library-title" class="visually-hidden">Search and filter the game library</h2>
      <form class="search-form" id="game-search" data-game-search-form role="search"><input data-library-search type="search" name="q" aria-label="Search the game library" placeholder="Search by game, category or tag"><button type="submit">Search</button></form>
      <div class="filter-bar" style="margin-top:1rem"><button class="filter-button" type="button" data-category-filter="all" aria-pressed="true">All</button><button class="filter-button" type="button" data-category-filter="puzzle" aria-pressed="false">Puzzle</button><button class="filter-button" type="button" data-category-filter="word" aria-pressed="false">Word</button><span class="chip" data-results-count>${games.length} games</span></div>
      <div class="game-grid" style="margin-top:1.2rem">${games.map(card).join('')}</div>
      <div class="empty-state" data-empty-state hidden><strong>No games found.</strong><br>Try a shorter title or choose another category.</div>
    </section>
  </div>`
}));

function categoryPage(category, slug, title, intro, current) {
  const categoryGames = games.filter(game => game.category === category);
  const canonical = `/categories/${slug}/`;
  const listSchema = {
    '@context': 'https://schema.org', '@type': 'ItemList', name: title, numberOfItems: categoryGames.length,
    itemListElement: categoryGames.map((game, index) => ({ '@type': 'ListItem', position: index + 1, name: game.title, url: `${siteUrl}${game.gameUrl}` }))
  };
  return documentPage({
    title: `${title} – Play Free Online | Gameul`,
    description: `${intro} Play instantly in your browser with no download or sign-up at Gameul.`,
    canonical, current, schemas: [listSchema],
    body: `<div class="container"><header class="page-hero"><nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> / ${title}</nav><p class="eyebrow">Game category</p><h1>${title}</h1><p>${intro} Every game listed here is published, tested and playable on Gameul.</p></header><section class="section compact" aria-labelledby="category-games"><div class="section-header"><div><h2 id="category-games">Choose a game</h2><p>${categoryGames.length} ${category.toLowerCase()} ${categoryGames.length === 1 ? 'game' : 'games'} ready to play.</p></div></div><div class="game-grid">${categoryGames.map(card).join('')}</div></section><section class="section compact"><div class="content-card"><h2>Play free ${category.toLowerCase()} games online</h2><p>${intro} Gameul keeps controls simple and loads each title directly in the browser, so you can start without installing an app or creating an account.</p></div></section></div>`
  });
}

write('categories/puzzle-games/index.html', categoryPage('Puzzle', 'puzzle-games', 'Free Online Puzzle Games', 'Play number, logic, memory and classic board puzzles designed for quick thinking and satisfying progress.', 'puzzle'));
write('categories/word-games/index.html', categoryPage('Word', 'word-games', 'Free Online Word Games', 'Find hidden words, scan letter grids and enjoy relaxed vocabulary challenges on desktop or mobile.', 'word'));

function gamePage(game) {
  const related = games.filter(candidate => candidate.slug !== game.slug)
    .sort((a, b) => Number(b.category === game.category) - Number(a.category === game.category))
    .slice(0, 4);
  const canonical = `/games/${game.slug}/`;
  const videoGameSchema = {
    '@context': 'https://schema.org', '@type': 'VideoGame', name: game.title, description: game.description,
    url: `${siteUrl}${canonical}`, image: `${siteUrl}${game.thumbnail}`, genre: [game.category, ...game.tags],
    gamePlatform: 'Web Browser', playMode: 'SinglePlayer', applicationCategory: 'Game', inLanguage: 'en',
    author: { '@type': 'Organization', name: 'Gameul', url: `${siteUrl}/` }
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'All Games', item: `${siteUrl}/games.html` },
      { '@type': 'ListItem', position: 3, name: game.title, item: `${siteUrl}${canonical}` }
    ]
  };
  const faqSchema = {
    '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: game.faqs.map(faq => ({
      '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer }
    }))
  };
  return `<!doctype html><html lang="en"><head>${head({ title: game.seoTitle, description: game.seoDescription, canonical, image: game.thumbnail, schemas: [videoGameSchema, breadcrumbSchema, faqSchema] })}</head><body>
${header('')}
<main id="main-content" class="game-page"><div class="container">
  <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/games.html">All Games</a> / ${escapeHtml(game.title)}</nav>
  <header class="game-heading"><p class="eyebrow">${escapeHtml(game.category)} game</p><h1>${escapeHtml(game.title)}</h1><p>${escapeHtml(game.description)}</p><div class="game-badges"><span class="game-badge">Free to play</span><span class="game-badge">No download</span><span class="game-badge">Mobile friendly</span></div></header>
  <section class="game-shell" data-game-shell aria-label="Play ${escapeHtml(game.title)}">
    <div class="game-toolbar"><span>Gameul original · runs in your browser</span><div class="game-toolbar-actions"><button type="button" data-fullscreen>Full screen</button></div></div>
    <div class="game-stage" data-game-runtime="${game.slug}"><p>Loading ${escapeHtml(game.title)}…</p></div>
  </section>
  <section class="section"><div class="prose-layout"><article class="content-card"><section><h2>About This Game</h2><p>${escapeHtml(game.about)}</p></section><section><h2>How to Play</h2><ol>${game.howToPlay.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ol></section><section><h2>Controls</h2><ul>${game.controls.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section><section><h2>Tips and Strategies</h2><ul>${game.tips.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section><section><h2>Frequently Asked Questions</h2>${game.faqs.map(faq => `<h3>${escapeHtml(faq.question)}</h3><p>${escapeHtml(faq.answer)}</p>`).join('')}</section></article><aside class="content-card"><h2>Game details</h2><p><strong>Category:</strong> ${escapeHtml(game.category)}</p><p><strong>Device support:</strong> Desktop, tablet and mobile</p><p><strong>Sign-up:</strong> Not required</p><p><strong>Developer:</strong> Gameul</p><a class="button secondary" href="/games.html">Browse all games</a></aside></div></section>
  <section class="section" aria-labelledby="related-title"><div class="section-header"><div><p class="eyebrow">Keep playing</p><h2 id="related-title">More Games Like This</h2></div></div><div class="game-grid">${related.map(card).join('')}</div></section>
</div></main>${footer()}<script defer src="/assets/js/game-runtime.js"></script></body></html>`;
}

games.forEach(game => write(`games/${game.slug}/index.html`, gamePage(game)));

function infoPage({ filename, title, description, heading, current = '', content }) {
  write(filename, documentPage({ title, description, canonical: `/${filename}`, current, body: `<div class="container"><header class="page-hero"><p class="eyebrow">Gameul</p><h1>${heading}</h1><p>${description}</p></header><section class="section compact"><div class="content-card">${content}</div></section></div>` }));
}

infoPage({
  filename: 'about-us.html', title: 'About Gameul – Free Browser Games', heading: 'About Gameul', current: 'about',
  description: 'Learn how Gameul builds a focused collection of free, original browser games for quick and accessible play.',
  content: `<h2>Play a Little, Every Day.</h2><p>Gameul is an independent HTML5 game site for people who want to play without an install, account or long setup. We build lightweight games that work directly in modern desktop and mobile browsers.</p><h2>How games are published</h2><p>Every public game must load correctly, match its title and artwork, include clear controls, and work on supported devices. Gameul original games are developed for this site. Third-party games are published only when their source and commercial usage rights are documented.</p><h2>Our approach</h2><ul><li>Useful gameplay comes before the size of the catalogue.</li><li>Game descriptions and instructions are written for the actual game.</li><li>We do not invent ratings, player counts or popularity claims.</li><li>Accessibility, responsive design and fast loading are part of every release.</li></ul>`
});

infoPage({
  filename: 'contact.html', title: 'Contact Gameul', heading: 'Contact Gameul',
  description: 'Contact Gameul about player support, accessibility, licensing, privacy or business enquiries.',
  content: `<h2>How can we help?</h2><p>For game support, accessibility feedback, licensing questions, privacy requests or business enquiries, email <a href="mailto:business@gameul.com">business@gameul.com</a>.</p><h2>What to include</h2><p>For a game issue, include the game title, device, browser and a short description of what happened. Please do not send passwords, payment details or other sensitive information.</p><p class="notice">Response times can vary. Gameul does not currently offer telephone support.</p>`
});

infoPage({
  filename: 'privacy-policy.html', title: 'Privacy Policy | Gameul', heading: 'Privacy Policy',
  description: 'Read how Gameul uses browser storage, analytics, advertising services and contact information.',
  content: `<p><strong>Last updated:</strong> October 18, 2026</p><h2>Overview</h2><p>Gameul provides browser-based games without requiring an account. This policy explains information that may be processed when you use the site.</p><h2>Browser storage</h2><p>Some games use local storage on your device to remember settings, progress or best scores. This information remains in your browser unless you clear it. Gameul does not use this game data to identify you.</p><h2>Analytics</h2><p>Gameul uses Google Analytics to understand general site usage, such as pages viewed, device type and approximate region. Google may process identifiers, IP address and browser information according to its own policies.</p><h2>Advertising</h2><p>Gameul uses Google AdSense. Google and its partners may use cookies, web beacons, IP addresses or similar technologies to deliver, measure and protect advertising. Depending on your location and choices, advertising may be personalized or non-personalized. Learn more about <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">how Google uses information from partner sites</a>.</p><h2>Consent choices</h2><p>Where required, Gameul uses consent controls made available for Google advertising and analytics services. You may also manage or clear cookies and local storage in your browser settings.</p><h2>Contact</h2><p>If you have a privacy request, email <a href="mailto:business@gameul.com">business@gameul.com</a>. Please do not include unnecessary sensitive information.</p><h2>Changes</h2><p>We may update this policy when our services or legal obligations change. The date above shows the latest revision.</p>`
});

infoPage({
  filename: 'terms-of-use.html', title: 'Terms of Use | Gameul', heading: 'Terms of Use',
  description: 'Read the rules that apply when accessing and playing games on Gameul.',
  content: `<p><strong>Last updated:</strong> October 18, 2026</p><h2>Using Gameul</h2><p>You may use Gameul for personal, non-commercial entertainment. You must not interfere with the site, attempt to bypass security, use automated traffic to manipulate advertising or copy site content in a way that violates applicable rights.</p><h2>Games and availability</h2><p>Games are provided on an “as available” basis. We may fix, change, replace or withdraw a game when necessary. We do not guarantee that every game will work on every browser, device or network.</p><h2>Intellectual property</h2><p>Gameul branding, original code, visual design and original written content belong to Gameul or its licensors. Game mechanics and third-party marks may have separate owners.</p><h2>External services</h2><p>Analytics and advertising services may be governed by additional third-party terms and privacy policies. External links, when present, do not imply ownership or endorsement.</p><h2>Responsible use</h2><p>Do not use Gameul in a way that is unlawful, abusive, fraudulent or harmful to other users, the service or advertising partners.</p><h2>Contact</h2><p>Questions about these terms can be sent to <a href="mailto:business@gameul.com">business@gameul.com</a>.</p>`
});

write('404.html', `<!doctype html><html lang="en"><head>${head({ title: 'Page Not Found | Gameul', description: 'The requested Gameul page could not be found.', canonical: '/404.html', robots: 'noindex, follow' })}</head><body>${header('')}<main id="main-content"><div class="container"><section class="hero"><p class="eyebrow">404 error</p><h1>That page is not here</h1><p>The link may be outdated, or the game may no longer be available.</p><p><a class="button" href="/">Return home</a> <a class="button secondary" href="/games.html">Browse games</a></p></section></div></main>${footer()}</body></html>`);

const redirectFiles = {
  'Browser.html': '/', 'IFRAMGAME.html': '/', 'brain-teasers.html': '/categories/puzzle-games/', 'classicgames.html': '/games.html',
  'company-ranking.html': '/', 'extremepamplona.html': '/', 'featured-games.html': '/games.html', 'game-development.html': '/',
  'gamedistribution-embed-urls.html': '/', 'gamedistribution-example-urls.html': '/', 'geometry-dash.html': '/', 'index-copy.html': '/',
  'marketing-hub.html': '/', 'new-game.html': '/games.html', 'share-component.html': '/', 'snakes.html': '/', 'top-games.html': '/games.html',
  'games/Mancala/index.html': '/'
};

for (const [filename, destination] of Object.entries(redirectFiles)) {
  const destinationUrl = `${siteUrl}${destination}`;
  write(filename, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Moved | Gameul</title><meta name="robots" content="noindex, follow"><link rel="canonical" href="${destinationUrl}"><meta http-equiv="refresh" content="0; url=${destination}"><script>location.replace(${JSON.stringify(destination)});</script></head><body><p>This page has moved to <a href="${destination}">Gameul</a>.</p></body></html>`);
}

write('_redirects', Object.entries(redirectFiles).map(([filename, destination]) => `/${filename.replace(/index\.html$/, '')} ${destination} 301`).join('\n') + '\n');

write('robots.txt', `User-agent: *
Allow: /
Allow: /ads.txt
Disallow: /scripts/
Disallow: /data/
Disallow: /*.md$
Disallow: /*.json$

Sitemap: ${siteUrl}/sitemap.xml
`);

const sitemapPaths = [
  ['/', '1.0', 'weekly'], ['/games.html', '0.9', 'weekly'],
  ['/categories/puzzle-games/', '0.8', 'weekly'], ['/categories/word-games/', '0.7', 'weekly'],
  ...games.map(game => [game.gameUrl, '0.8', 'monthly']),
  ['/about-us.html', '0.4', 'yearly'], ['/contact.html', '0.3', 'yearly'],
  ['/privacy-policy.html', '0.2', 'yearly'], ['/terms-of-use.html', '0.2', 'yearly']
];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapPaths.map(([url, priority, changefreq]) => `  <url><loc>${siteUrl}${url}</loc><lastmod>${today}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`).join('\n')}
</urlset>
`);

console.log(`Built Gameul with ${games.length} published games and ${sitemapPaths.length} sitemap URLs.`);

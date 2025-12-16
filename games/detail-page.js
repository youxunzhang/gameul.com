function getSlug() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] === 'index.html' ? parts[parts.length - 2] : parts[parts.length - 1];
}

function buildList(items) {
  const ul = document.createElement('ul');
  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    ul.appendChild(li);
  });
  return ul;
}

function buildFAQ(entries) {
  const container = document.createElement('div');
  entries.forEach((entry) => {
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = entry.q;
    const p = document.createElement('p');
    p.textContent = entry.a;
    details.appendChild(summary);
    details.appendChild(p);
    container.appendChild(details);
  });
  return container;
}

function buildRelated(slugs, currentSlug) {
  const container = document.createElement('div');
  container.className = 'related-grid';
  const unique = slugs.filter((slug) => slug !== currentSlug);
  unique.slice(0, 6).forEach((slug) => {
    const game = findGameBySlug(slug);
    if (!game) return;
    const card = document.createElement('a');
    card.href = `/games/${game.slug}/`;
    card.className = 'related-card';
    card.innerHTML = `
      <img src="${game.image}" alt="${game.name}" loading="lazy">
      <div>
        <p class="tag">${game.category}</p>
        <strong>${game.name}</strong>
        <span>${game.shortDescription}</span>
      </div>
    `;
    container.appendChild(card);
  });
  return container;
}

function setHead(game) {
  document.title = `${game.name} | Play Free Online on GameUL`;
  const desc = `Play ${game.name} free online on GameUL. Learn controls, tips, and discover similar games.`;
  const setMeta = (name, content) => {
    let tag = document.querySelector(`meta[name='${name}']`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('name', name);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  };
  setMeta('description', desc);

  const ogTags = [
    ['og:site_name', 'GameUL'],
    ['og:title', `${game.name} | Play Free Online on GameUL`],
    ['og:description', desc],
    ['og:image', game.image],
    ['og:url', window.location.href],
  ];
  ogTags.forEach(([property, content]) => {
    let tag = document.querySelector(`meta[property='${property}']`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('property', property);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  });

  let twitter = document.querySelector("meta[name='twitter:card']");
  if (!twitter) {
    twitter = document.createElement('meta');
    twitter.setAttribute('name', 'twitter:card');
    document.head.appendChild(twitter);
  }
  twitter.setAttribute('content', 'summary_large_image');

  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: game.name,
    description: desc,
    url: window.location.href,
    image: game.image,
    applicationCategory: 'Game',
    operatingSystem: 'Browser',
    genre: game.category,
  });
  document.head.appendChild(ld);
}

function renderGame() {
  const slug = getSlug();
  const game = findGameBySlug(slug);
  if (!game) {
    document.getElementById('game-root').innerHTML = '<p>Game not found.</p>';
    return;
  }
  setHead(game);
  document.getElementById('game-title').textContent = game.name;
  document.getElementById('game-category').textContent = game.category;
  document.getElementById('game-description').textContent = game.longDescription;
  document.getElementById('game-image').src = game.image;
  document.getElementById('game-image').alt = game.name;
  document.getElementById('game-play').href = game.playUrl;
  const controls = buildList(game.controls);
  document.getElementById('controls').appendChild(controls);
  document.getElementById('faq').appendChild(buildFAQ(game.faq));
  document.getElementById('related').appendChild(buildRelated(game.related, game.slug));
}

renderGame();

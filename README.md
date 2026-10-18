# Gameul

Gameul is an English-language static HTML5 game site for `https://gameul.com`.
The public catalogue currently contains seven self-hosted games and does not
publish third-party titles without documented commercial permission.

## Local development

The project has no third-party runtime dependencies. Node.js is used only to
generate and validate static pages.

```bash
npm run build
npm run check
```

To preview the generated site:

```bash
python -m http.server 8000
```

Then open `http://127.0.0.1:8000/`.

## Content architecture

- `data/games.json` is the canonical game catalogue.
- `scripts/build.mjs` generates the homepage, catalogue, category pages, game
  detail pages, redirects, `robots.txt`, and `sitemap.xml`.
- `assets/js/game-runtime.js` contains the self-hosted game engines.
- `assets/css/site.css` contains the shared responsive design system.
- `scripts/check-site.mjs` validates required metadata, structured data, local
  links, thumbnails, JavaScript syntax, `ads.txt`, and sitemap coverage.

Add or update games in `data/games.json`, then run the build and check commands.
Only records with `status: "published"` are included on public pages.

## Advertising and privacy

The AdSense publisher record is stored in `ads.txt`. The shared page template
loads the existing AdSense and Google Analytics identifiers once per page.
Before serving personalized ads in regulated regions, enable a suitable
Google-certified consent management platform in the AdSense account and keep
the public privacy policy aligned with the live configuration.

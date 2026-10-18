# Gameul SEO implementation brief

Updated: October 18, 2026

## Assumptions and evidence

- Audience: international English-speaking players.
- Search platform: Google organic search.
- Conversion: start a game on Gameul and continue to another game.
- The plan does not claim search volume, CPC, ranking or difficulty metrics.
- Current result language repeatedly emphasizes “free,” “online,” “play,”
  “browser,” and “no download.” Gameul uses those phrases only where they are
  factually true.

## Prioritized keyword-to-page map

| Priority | Search intent cluster | Intent | Page | Action | Estimated opportunity |
| --- | --- | --- | --- | --- | --- |
| P0 | free online games, browser games, no download games | Transactional | `/` | Refresh | High |
| P0 | free online puzzle games, logic games online | Transactional | `/categories/puzzle-games/` | New | High |
| P0 | play 2048 online free, 2048 no download | Transactional | `/games/2048/` | New | High |
| P0 | minesweeper online free, classic minesweeper | Transactional | `/games/minesweeper/` | New | High |
| P0 | free sudoku online, easy sudoku online | Transactional | `/games/sudoku/` | New | Medium–high |
| P1 | word search online free, word search puzzle | Transactional | `/games/word-search/` | New | Medium–high |
| P1 | tic tac toe online, two player tic tac toe | Transactional | `/games/tic-tac-toe/` | New | Medium |
| P1 | sliding puzzle online, 15 puzzle online | Transactional | `/games/sliding-puzzle/` | New | Medium |
| P1 | memory match game online | Transactional | `/games/memory-match/` | New | Medium |
| P2 | free card games, free arcade games, mahjong games | Transactional | None yet | Do not target until real games exist | Future |

## Implemented decisions

- One canonical domain and brand: `gameul.com` / Gameul.
- One canonical page per search intent; no empty category pages.
- Static HTML contains indexable game names, descriptions and instructions.
- Game pages include truthful `VideoGame`, breadcrumb and FAQ structured data.
- No ratings, player counts or “most played” claims without source data.
- Legacy and irrelevant pages are removed from the sitemap and redirect away.
- Internal links connect homepage, live categories, catalogue and related games.

## Next evidence that would improve prioritization

- Google Search Console queries, impressions, clicks, CTR and landing pages.
- Analytics game-start and engagement events after the new pages are deployed.
- Confirmed third-party game licences before adding Card, Arcade or Mahjong pages.

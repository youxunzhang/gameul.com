#!/usr/bin/env node

/**
 * Scrape game metadata from https://gamedistribution.com/games/.
 *
 * The script first attempts to fetch HTML pages from the live website, but it can
 * also operate against pre-fetched fixtures stored locally (useful in offline or
 * test environments where the origin may block automated requests).
 *
 * Usage examples:
 *   node tools/scrape-gamedistribution.js --pages 2 --page-size 60 --output data.json
 *   node tools/scrape-gamedistribution.js --from tools/samples --pages 2 --output data.json
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { setTimeout: delay } = require('timers/promises');

const DEFAULT_BASE_URL = 'https://gamedistribution.com';
const DEFAULT_START_PATH = '/games/';
const USER_AGENT = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  'AppleWebKit/537.36 (KHTML, like Gecko)',
  'Chrome/123.0.0.0 Safari/537.36',
].join(' ');

class CliError extends Error {}

function parseArgs(argv) {
  const options = {
    baseUrl: DEFAULT_BASE_URL,
    startPath: DEFAULT_START_PATH,
    pages: 1,
    pageSize: 60,
    delay: 0,
    output: null,
    from: null,
    verbose: false,
  };

  const args = [...argv];
  args.shift(); // node
  const script = args.shift();
  if (!script) {
    throw new CliError('Unable to determine script path from argv.');
  }

  while (args.length) {
    const arg = args.shift();
    switch (arg) {
      case '--pages':
        options.pages = parsePositiveInt(arg, args.shift(), 1);
        break;
      case '--page-size':
        options.pageSize = parsePositiveInt(arg, args.shift(), 60);
        break;
      case '--delay':
        options.delay = parsePositiveInt(arg, args.shift(), 0);
        break;
      case '--base-url':
        options.baseUrl = ensureString(arg, args.shift());
        break;
      case '--start-path':
        options.startPath = ensureString(arg, args.shift());
        break;
      case '--output':
        options.output = ensureString(arg, args.shift());
        break;
      case '--from':
        options.from = ensureString(arg, args.shift());
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        printHelp(script);
        process.exit(0);
        break;
      default:
        throw new CliError(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function ensureString(flag, value) {
  if (!value) {
    throw new CliError(`Missing value for ${flag}`);
  }
  return value;
}

function parsePositiveInt(flag, value, fallback) {
  if (!value) {
    throw new CliError(`Missing value for ${flag}`);
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new CliError(`Invalid numeric value for ${flag}: ${value}`);
  }
  return parsed;
}

function printHelp(script) {
  console.log(`Usage: node ${script} [options]\n`);
  console.log('Options:');
  console.log('  --pages <n>         Number of paginated result pages to fetch (default: 1)');
  console.log('  --page-size <n>     Page size hint passed as query parameter (default: 60)');
  console.log('  --delay <ms>        Milliseconds to wait between requests (default: 0)');
  console.log('  --base-url <url>    Override the base URL (default: https://gamedistribution.com)');
  console.log('  --start-path <path> Override the initial path (default: /games/)');
  console.log('  --output <file>     Write JSON results to file instead of stdout');
  console.log('  --from <path>       Read HTML/JSON fixtures from file or directory instead of fetching');
  console.log('  --verbose           Emit verbose logging to stderr');
  console.log('  -h, --help          Show this message');
}

function resolveSourceForPage(from, pageNumber) {
  if (!from) {
    return null;
  }
  const resolved = path.resolve(from);
  if (!fs.existsSync(resolved)) {
    throw new CliError(`The path provided to --from does not exist: ${from}`);
  }
  const stats = fs.statSync(resolved);
  if (stats.isDirectory()) {
    const basename = `page-${pageNumber}`;
    const candidates = [
      `${basename}.html`,
      `${basename}.json`,
      `${basename}.txt`,
      `page${pageNumber}.html`,
      `page${pageNumber}.json`,
    ];
    for (const candidate of candidates) {
      const fullPath = path.join(resolved, candidate);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    throw new CliError(`Unable to find fixture for page ${pageNumber} inside ${from}.`);
  }
  return resolved;
}

async function fetchPage(url, verbose) {
  if (typeof fetch !== 'function') {
    throw new Error('Global fetch API is not available in this Node.js runtime.');
  }

  const response = await fetch(url, {
    headers: {
      'user-agent': USER_AGENT,
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'en-US,en;q=0.9',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'upgrade-insecure-requests': '1',
    },
  });

  if (verbose) {
    console.error(`Fetched ${url} -> ${response.status}`);
  }

  if (!response.ok) {
    const text = await safeReadText(response);
    throw new Error(`Request to ${url} failed with ${response.status}: ${truncate(text, 200)}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const json = await response.json();
    return { kind: 'json', payload: json };
  }
  return { kind: 'html', payload: await response.text() };
}

async function safeReadText(response) {
  try {
    return await response.text();
  } catch (error) {
    return `<unable to read body: ${error.message}>`;
  }
}

function truncate(input, maxLength) {
  if (!input || input.length <= maxLength) {
    return input;
  }
  return `${input.slice(0, maxLength)}…`;
}

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

function stringArray(value) {
  const result = [];
  for (const item of toArray(value)) {
    if (Array.isArray(item)) {
      result.push(...stringArray(item));
    } else if (item && typeof item === 'object') {
      result.push(...stringArray(Object.values(item)));
    } else if (typeof item === 'string') {
      const trimmed = item.trim();
      if (trimmed) {
        result.push(trimmed);
      }
    }
  }
  return result;
}

function pickFirstString(values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function pickNumber(values) {
  for (const value of values) {
    if (value == null) continue;
    const numeric = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }
  return undefined;
}

function normalizeUrl(baseUrl, relative) {
  if (!relative) return undefined;
  try {
    return new URL(relative, baseUrl).toString();
  } catch (error) {
    return undefined;
  }
}

function toIsoDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString();
}

function extractGamesFromObject(node) {
  const results = [];
  if (!node || typeof node !== 'object') {
    return results;
  }

  const candidates = [];
  if (Array.isArray(node)) {
    for (const entry of node) {
      candidates.push(...extractGamesFromObject(entry));
    }
    return candidates;
  }

  const values = Object.values(node);
  for (const value of values) {
    if (!value) continue;
    if (Array.isArray(value) || typeof value === 'object') {
      candidates.push(...extractGamesFromObject(value));
    }
  }

  if (looksLikeGame(node)) {
    candidates.push(node);
  }

  return candidates;
}

function looksLikeGame(node) {
  if (!node || typeof node !== 'object') return false;
  const hasSlug = typeof node.slug === 'string' && node.slug.trim().length > 0;
  const hasTitle =
    typeof node.title === 'string' && node.title.trim().length > 0;
  const hasName = typeof node.name === 'string' && node.name.trim().length > 0;
  const hasUrl =
    typeof node.url === 'string' ||
    (node.urls && (typeof node.urls === 'string' || typeof node.urls === 'object')) ||
    (node.links && (typeof node.links === 'string' || typeof node.links === 'object'));
  return (hasSlug && (hasTitle || hasName)) || (hasTitle && hasUrl);
}

function normaliseGame(node, baseUrl) {
  const slug = pickFirstString([
    node.slug,
    node.alias,
    node.gameSlug,
    node.seo && node.seo.slug,
    node.url && typeof node.url === 'string' && extractSlugFromUrl(node.url),
    node.urls && typeof node.urls === 'object' && extractSlugFromUrl(node.urls.detail || node.urls.play),
    node.links && typeof node.links === 'object' && extractSlugFromUrl(node.links.detail || node.links.play),
  ]);

  const title = pickFirstString([
    node.title,
    node.name,
    node.gameTitle,
    node.seo && node.seo.title,
  ]);

  const description = pickFirstString([
    node.description,
    node.summary,
    node.shortDescription,
    node.meta && node.meta.description,
  ]);

  const categories = unique(stringArray([
    node.categories,
    node.category,
    node.genre,
    node.genres,
    node.categories && node.categories.list,
  ]));

  const tags = unique(stringArray([
    node.tags,
    node.keywords,
    node.labels,
    node.tags && node.tags.primary,
    node.tags && node.tags.secondary,
  ]));

  const thumbnail = pickFirstString([
    node.thumbnail,
    node.thumb,
    node.image,
    node.cover,
    node.icon,
    node.images && node.images.thumbnail,
    node.images && node.images.cover,
    node.assets && node.assets.thumbnail,
    node.assets && node.assets.icon,
  ]);

  const playUrl = pickFirstString([
    typeof node.playUrl === 'string' && node.playUrl,
    typeof node.url === 'string' && node.url,
    node.urls && (node.urls.play || node.urls.url),
    node.links && (node.links.play || node.links.url),
  ]);

  const detailUrl = pickFirstString([
    node.detailUrl,
    node.detailsUrl,
    node.urls && node.urls.detail,
    node.links && node.links.detail,
    node.seo && node.seo.url,
  ]);

  const developer = pickFirstString([
    node.developer && (node.developer.name || node.developer.studioName),
    node.developer,
    node.studio,
  ]);

  const releaseDate = pickFirstString([
    node.releaseDate,
    node.publishDate,
    node.publishedAt,
    node.createdAt,
    node.updatedAt,
  ]);

  const rating = pickNumber([
    typeof node.rating === 'number' ? node.rating : undefined,
    node.rating && node.rating.average,
    node.avgRating,
    node.averageRating,
  ]);

  const normalized = {
    slug: slug || null,
    title: title || null,
    description: description || null,
    categories,
    tags,
    thumbnail: thumbnail || null,
    playUrl: normalizeUrl(baseUrl, playUrl) || playUrl || null,
    detailUrl: normalizeUrl(baseUrl, detailUrl) || detailUrl || null,
    developer: developer || null,
    releaseDate: toIsoDate(releaseDate) || null,
    rating: Number.isFinite(rating) ? rating : null,
  };

  if (!normalized.slug && normalized.detailUrl) {
    normalized.slug = extractSlugFromUrl(normalized.detailUrl);
  }

  return normalized;
}

function extractSlugFromUrl(url) {
  if (!url) return undefined;
  try {
    const candidate = new URL(url, DEFAULT_BASE_URL);
    const pathname = candidate.pathname.replace(/\/$/, '');
    const parts = pathname.split('/').filter(Boolean);
    if (!parts.length) return undefined;
    return parts[parts.length - 1];
  } catch (error) {
    const match = String(url).match(/([a-z0-9-]+)(?:\.[a-z]+)?$/i);
    return match ? match[1] : undefined;
  }
}

function unique(values) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

function mergeGame(existing, incoming) {
  const merged = { ...existing };
  for (const key of Object.keys(incoming)) {
    const value = incoming[key];
    if (value == null) continue;
    if (Array.isArray(value)) {
      merged[key] = unique([...(merged[key] || []), ...value]);
    } else if (!merged[key]) {
      merged[key] = value;
    }
  }
  return merged;
}

function extractFromHtml(html) {
  const scripts = [];
  const scriptRegex = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(html))) {
    const attrs = match[1] || '';
    const body = (match[2] || '').trim();
    if (!body) continue;

    const attrLower = attrs.toLowerCase();
    const containsNuxtId =
      attrLower.includes('__nuxt_data__') || attrLower.includes('__nuxt');

    if (containsNuxtId && body) {
      const json = safeJsonParse(body);
      if (json) {
        scripts.push({ kind: 'nuxt', payload: json });
        continue;
      }
    }

    if (body.startsWith('{') || body.startsWith('[')) {
      scripts.push({ kind: 'json', payload: safeJsonParse(body) });
      continue;
    }

    if (body.includes('window.__NUXT__')) {
      const payload = extractNuxtAssignment(body);
      if (payload) {
        scripts.push({ kind: 'nuxt', payload });
      }
    }
  }

  if (!scripts.length) {
    return [];
  }

  const games = [];
  for (const script of scripts) {
    if (!script.payload) continue;
    games.push(...extractGamesFromObject(script.payload));
  }
  return games;
}

function safeJsonParse(snippet) {
  try {
    return JSON.parse(snippet);
  } catch (error) {
    return null;
  }
}

function extractNuxtAssignment(snippet) {
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
}

function extractFromJson(json) {
  if (!json) return [];
  return extractGamesFromObject(json);
}

async function readFixture(sourcePath) {
  const ext = path.extname(sourcePath).toLowerCase();
  const content = fs.readFileSync(sourcePath, 'utf8');
  if (ext === '.json') {
    return { kind: 'json', payload: JSON.parse(content) };
  }
  return { kind: 'html', payload: content };
}

async function scrape(options) {
  const gamesBySlug = new Map();
  for (let page = 1; page <= options.pages; page += 1) {
    if (options.verbose) {
      console.error(`Processing page ${page} of ${options.pages}`);
    }

    let source;
    const fixturePath = resolveSourceForPage(options.from, page);
    if (fixturePath) {
      if (options.verbose) {
        console.error(`Reading fixture ${fixturePath}`);
      }
      source = await readFixture(fixturePath);
    } else {
      const url = new URL(options.startPath, options.baseUrl);
      if (options.pageSize) {
        url.searchParams.set('perPage', String(options.pageSize));
        url.searchParams.set('pageSize', String(options.pageSize));
        url.searchParams.set('limit', String(options.pageSize));
      }
      url.searchParams.set('page', String(page));
      source = await fetchPage(url.toString(), options.verbose);
    }

    let rawGames;
    if (source.kind === 'json') {
      rawGames = extractFromJson(source.payload);
    } else {
      rawGames = extractFromHtml(source.payload);
    }

    if (!rawGames.length && options.verbose) {
      console.error(`No games detected on page ${page}`);
    }

    for (const raw of rawGames) {
      const normalized = normaliseGame(raw, options.baseUrl);
      if (!normalized.slug && !normalized.title) {
        continue;
      }
      const key = (normalized.slug || normalized.title).toLowerCase();
      const existing = gamesBySlug.get(key);
      if (existing) {
        gamesBySlug.set(key, mergeGame(existing, normalized));
      } else {
        gamesBySlug.set(key, normalized);
      }
    }

    if (options.delay) {
      await delay(options.delay);
    }
  }

  const games = Array.from(gamesBySlug.values()).sort((a, b) => {
    const lhs = (a.slug || a.title || '').toLowerCase();
    const rhs = (b.slug || b.title || '').toLowerCase();
    return lhs.localeCompare(rhs);
  });

  return games;
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv);
  } catch (error) {
    if (error instanceof CliError) {
      console.error(error.message);
      process.exit(1);
    }
    throw error;
  }

  try {
    const games = await scrape(options);
    const output = JSON.stringify(games, null, 2);
    if (options.output) {
      fs.writeFileSync(path.resolve(options.output), `${output}\n`, 'utf8');
      if (options.verbose) {
        console.error(`Wrote ${games.length} games to ${options.output}`);
      }
    } else {
      console.log(output);
    }
  } catch (error) {
    console.error(`Scrape failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  parseArgs,
  scrape,
  normaliseGame,
  extractFromHtml,
  extractFromJson,
  extractSlugFromUrl,
  looksLikeGame,
};

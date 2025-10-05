#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const gamesDir = path.join(rootDir, 'games');

function readJson(relativePath) {
  const fullPath = path.join(rootDir, relativePath);
  try {
    const raw = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to read ${relativePath}: ${error.message}`);
  }
}

function ensureUnique(items, key, context, report) {
  const seen = new Map();
  items.forEach((item, index) => {
    const value = item[key];
    if (!value) {
      report(`${context}[${index}] is missing required field "${key}".`);
      return;
    }
    if (seen.has(value)) {
      report(
        `${context}[${index}] has duplicate ${key} value "${value}" (previous index ${seen.get(value)}).`
      );
      return;
    }
    seen.set(value, index);
  });
}

function checkDetailUrl(detailUrl, context, report) {
  if (!detailUrl) {
    report(`${context} is missing a detailUrl.`);
    return;
  }
  if (!/^\//.test(detailUrl)) {
    report(`${context} detailUrl should start with "/": ${detailUrl}`);
    return;
  }
  const segments = detailUrl.replace(/^\/+|\/+$/g, '').split('/');
  if (segments[0] !== 'games' || segments.length < 2) {
    return; // allow non-game urls such as external references
  }
  const slug = segments[1];
  const expectedFile = path.join(gamesDir, slug, 'index.html');
  if (!fs.existsSync(expectedFile)) {
    report(`${context} detailUrl points to missing file: ${expectedFile}`);
  }
}

function checkPlayUrl(playUrl, context, report) {
  if (!playUrl) {
    report(`${context} is missing a playUrl.`);
    return;
  }
  if (/^https?:/i.test(playUrl)) {
    return; // external URL assumed valid
  }
  if (!/^\//.test(playUrl)) {
    report(`${context} playUrl should start with "/" or be an absolute URL: ${playUrl}`);
    return;
  }
  const [withoutQuery] = playUrl.split(/[?#]/);
  const relative = withoutQuery.replace(/^\//, '');
  const file = path.join(rootDir, relative);
  if (!fs.existsSync(file)) {
    report(`${context} playUrl points to missing file: ${file}`);
  }
}

function checkDate(value, context, report) {
  if (!value) {
    report(`${context} is missing a releaseDate.`);
    return;
  }
  const isoMatch = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoMatch.test(value)) {
    report(`${context} releaseDate should follow YYYY-MM-DD format: ${value}`);
    return;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    report(`${context} releaseDate is not a valid date: ${value}`);
  }
}

function checkRating(value, context, report) {
  if (typeof value !== 'number') {
    report(`${context} rating must be a number between 0 and 5.`);
    return;
  }
  if (value < 0 || value > 5) {
    report(`${context} rating ${value} is outside the 0-5 range.`);
  }
}

function validateGamesDirectory(report) {
  const directory = readJson(path.join('assets', 'data', 'games-directory.json'));
  if (!Array.isArray(directory.games)) {
    throw new Error('games-directory.json must contain an array under "games".');
  }

  ensureUnique(directory.games, 'slug', 'games-directory.games', report);

  directory.games.forEach((game, index) => {
    const context = `games-directory.games[${index}]`;
    checkDetailUrl(game.detailUrl, context, report);
    checkPlayUrl(game.playUrl, context, report);
    checkDate(game.releaseDate, context, report);
    checkRating(game.rating, context, report);
    ['title', 'summary', 'thumbnail', 'developer'].forEach((field) => {
      if (!game[field]) {
        report(`${context} is missing required field "${field}".`);
      }
    });
    if (!Array.isArray(game.categories) || !game.categories.length) {
      report(`${context} must include at least one category.`);
    }
    if (!Array.isArray(game.tags)) {
      report(`${context} tags must be an array.`);
    }
  });
}

function validateBrowserGames(report) {
  const browserGames = readJson(path.join('assets', 'data', 'browser-games.json'));
  if (!Array.isArray(browserGames.games)) {
    throw new Error('browser-games.json must contain an array under "games".');
  }

  ensureUnique(browserGames.games, 'detailsUrl', 'browser-games.games', report);

  const expectedTitles = new Set();
  const directory = readJson(path.join('assets', 'data', 'games-directory.json'));
  directory.games.forEach((game) => {
    expectedTitles.add(game.title);
  });

  const checkEntry = (entry, context) => {
    if (!entry) return;
    checkDetailUrl(entry.detailsUrl || entry.detailUrl, context, report);
    checkPlayUrl(entry.playUrl || entry.link, context, report);
    ['title', 'description'].forEach((field) => {
      if (!entry[field]) {
        report(`${context} is missing required field "${field}".`);
      }
    });
    if (entry.detailsUrl) {
      const title = entry.title;
      if (title && !expectedTitles.has(title) && !/^\w*[\u4e00-\u9fa5]/.test(title)) {
        report(`${context} title "${title}" not found in games directory.`);
      }
    }
  };

  checkEntry(browserGames.featured, 'browser-games.featured');

  browserGames.games.forEach((entry, index) => {
    checkEntry(entry, `browser-games.games[${index}]`);
  });
}

function main() {
  const issues = [];
  const report = (message) => issues.push(message);

  validateGamesDirectory(report);
  validateBrowserGames(report);

  if (issues.length) {
    console.error('Data validation failed with the following issues:');
    issues.forEach((issue) => console.error(` • ${issue}`));
    process.exitCode = 1;
  } else {
    console.log('All data files passed validation.');
  }
}

main();

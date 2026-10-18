import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const games = JSON.parse(fs.readFileSync(path.join(root, 'data', 'games.json'), 'utf8'));
const failures = [];
const requiredFields = ['id','slug','title','description','category','tags','thumbnail','gameType','gameUrl','controls','mobileSupported','sourceProvider','licenseStatus','featured','status','seoTitle','seoDescription'];

for (const game of games) {
  for (const field of requiredFields) if (game[field] === undefined || game[field] === '') failures.push(`${game.slug}: missing ${field}`);
  const page = path.join(root, game.gameUrl.replace(/^\//, ''), 'index.html');
  if (!fs.existsSync(page)) failures.push(`${game.slug}: missing generated game page`);
  const image = path.join(root, game.thumbnail.replace(/^\//, ''));
  if (!fs.existsSync(image)) failures.push(`${game.slug}: missing thumbnail ${game.thumbnail}`);
}

const publicFiles = ['index.html','games.html','about-us.html','contact.html','privacy-policy.html','terms-of-use.html','404.html','categories/puzzle-games/index.html','categories/word-games/index.html', ...games.map(game => `games/${game.slug}/index.html`)];
const titles = new Map();
for (const relative of publicFiles) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) { failures.push(`Missing public page: ${relative}`); continue; }
  const html = fs.readFileSync(file, 'utf8');
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  if (!title) failures.push(`${relative}: missing title`);
  else if (titles.has(title) && relative !== '404.html') failures.push(`${relative}: duplicate title also used by ${titles.get(title)}`);
  else titles.set(title, relative);
  if ((html.match(/<h1[ >]/g) || []).length !== 1) failures.push(`${relative}: expected exactly one H1`);
  if ((html.match(/rel="canonical"/g) || []).length !== 1) failures.push(`${relative}: expected exactly one canonical`);
  if (!/<meta name="description"/.test(html)) failures.push(`${relative}: missing meta description`);
  if (/youxistudio\.online|GAME STUDIO|game studio/i.test(html)) failures.push(`${relative}: contains retired brand or domain`);
  for (const match of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    const resource = match[1].split(/[?#]/)[0];
    if (!resource || resource === '/') continue;
    const localPath = resource.endsWith('/') ? `${resource}index.html` : resource;
    if (!fs.existsSync(path.join(root, localPath.replace(/^\//, '')))) failures.push(`${relative}: broken local reference ${resource}`);
  }
  for (const match of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
    try { JSON.parse(match[1]); } catch { failures.push(`${relative}: invalid JSON-LD`); }
  }
}

const ads = fs.readFileSync(path.join(root, 'ads.txt'), 'utf8').trim();
if (ads !== 'google.com, pub-8794607118520437, DIRECT, f08c47fec0942fa0') failures.push('ads.txt does not match the AdSense publisher record');

const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
if (/youxistudio\.online/.test(sitemap)) failures.push('sitemap.xml contains retired domain');
for (const game of games.filter(game => game.status === 'published')) if (!sitemap.includes(`https://gameul.com${game.gameUrl}`)) failures.push(`${game.slug}: not listed in sitemap`);

for (const script of ['scripts/build.mjs','scripts/check-site.mjs','assets/js/site.js','assets/js/game-runtime.js']) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, script)], { encoding: 'utf8' });
  if (result.status !== 0) failures.push(`${script}: JavaScript syntax error\n${result.stderr}`);
}

if (failures.length) {
  console.error(`Site check failed with ${failures.length} issue(s):\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log(`Site check passed: ${publicFiles.length} public pages, ${games.length} games, valid ads.txt and sitemap.`);

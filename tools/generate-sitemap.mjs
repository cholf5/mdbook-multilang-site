import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const configPath = path.join(rootDir, 'config', 'site.config.json');

async function main() {
  const raw = await fs.readFile(configPath, 'utf8');
  const config = JSON.parse(raw);
  const baseUrl = normaliseBaseUrl(config.site?.baseUrl || '');

  const urls = [];
  for (const chapter of config.chapters || []) {
    for (const language of config.languages || []) {
      const fileName = chapter.files?.[language.code];
      if (!fileName) continue;
      const contentPath = path.join(rootDir, 'content', language.code, fileName);
      let lastModified = new Date().toISOString();
      try {
        const stat = await fs.stat(contentPath);
        const now = Date.now();
        const safeTime = Math.min(stat.mtime.getTime(), now);
        lastModified = new Date(safeTime).toISOString();
      } catch (error) {
        // Ignore missing files in sitemap output
      }
      const url = buildPageUrl(baseUrl, language.code, chapter.id);
      urls.push({ url, lastModified });
    }
  }

  const sitemap = buildSitemap(urls);
  const sitemapPath = path.join(rootDir, 'sitemap.xml');
  await fs.writeFile(sitemapPath, sitemap, 'utf8');
  console.log(`Generated sitemap with ${urls.length} entries at ${relativePath(sitemapPath)}`);

  const robots = buildRobotsTxt(baseUrl);
  const robotsPath = path.join(rootDir, 'robots.txt');
  await fs.writeFile(robotsPath, robots, 'utf8');
  console.log(`Updated robots.txt at ${relativePath(robotsPath)}`);
}

function buildSitemap(urls) {
  const items = urls
    .map(
      ({ url, lastModified }) => `  <url>\n    <loc>${escapeXml(url)}</loc>\n    <lastmod>${lastModified}</lastmod>\n  </url>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`;
}

function buildRobotsTxt(baseUrl) {
  const sitemapUrl = baseUrl ? new URL('sitemap.xml', baseUrl).toString() : 'sitemap.xml';
  return [`User-agent: *`, `Allow: /`, '', `Sitemap: ${sitemapUrl}`, ''].join('\n');
}

function normaliseBaseUrl(url) {
  if (!url) return '';
  if (!/https?:\/\//i.test(url)) {
    return url;
  }
  const normalised = url.endsWith('/') ? url : `${url}/`;
  return normalised;
}

function buildPageUrl(baseUrl, language, chapterId) {
  if (baseUrl && /https?:\/\//i.test(baseUrl)) {
    const url = new URL(baseUrl);
    url.searchParams.set('lang', language);
    if (chapterId) {
      url.searchParams.set('chapter', chapterId);
    }
    return url.toString();
  }
  const query = new URLSearchParams({ lang: language, chapter: chapterId }).toString();
  return `${baseUrl.replace(/[#?].*$/, '') || '.'}?${query}`;
}

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function relativePath(target) {
  return path.relative(rootDir, target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

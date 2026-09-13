/**
 * PSV Salzburg Judo — site migration scraper
 * ---------------------------------------------------------
 * Discovers every news article via the public XML sitemap(s),
 * scrapes each article page, and writes it out as an .mdx file
 * grouped by year/month — using the date WordPress already put
 * on the page, so no manual classification is needed.
 *
 * Usage:
 *   node scrape.js                 (does everything)
 *   node scrape.js --dry-run       (lists what it would fetch, fetches nothing)
 *
 * Output:
 *   ./content/news/<year>/<month>/<slug>.mdx
 *   ./content/images/<original-filename>   (downloaded media)
 *   ./migration-report.json        (summary + anything it couldn't parse)
 */

import * as cheerio from "cheerio";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = "https://www.psv-judo.at";
const OUT_DIR = "./content/news";
const IMG_DIR = "./content/images";
const REQUEST_DELAY_MS = 500; // be polite to their server
const DRY_RUN = process.argv.includes("--dry-run");

// Non-article paths we never want to treat as news posts.
const EXCLUDE_PATTERNS = [
  /\/login-2\/?$/,
  /\/register\/?$/,
  /\/service\/?$/,
  /\/kalender\//,
  /\/ueber-uns/,
  /\/datenschutzerklaerung/,
  /\/anfaengerkurse/,
  /\/wp-content\//,
  /\/wp-json\//,
  /\/feed\/?$/,
  /\?/, // query-string URLs (pagination, search, etc.)
];

// Only treat URLs that contain a 4-digit year segment as articles —
// this matches the site's own permalink scheme, e.g.
// /bericht/turnier/2026/u18-weltmeisterschaften-in-guayaquil/
const ARTICLE_PATTERN = /\/(19|20)\d{2}\//;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "PSV-Judo-Migration-Script/1.0 (+contact: club webmaster)" },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.text();
}

/** Step 1: find every sitemap file (handles a sitemap index or a flat list). */
async function discoverSitemaps() {
  const candidates = ["/sitemap_index.xml", "/sitemap.xml"];
  for (const p of candidates) {
    try {
      const xml = await fetchText(BASE + p);
      const $ = cheerio.load(xml, { xmlMode: true });
      const sitemapLocs = $("sitemap > loc")
        .map((_, el) => $(el).text())
        .get();
      if (sitemapLocs.length) return sitemapLocs; // it was an index
      const urlLocs = $("url > loc")
        .map((_, el) => $(el).text())
        .get();
      if (urlLocs.length) return [BASE + p]; // it was a flat sitemap, treat itself as the list
    } catch {
      // try next candidate
    }
  }
  throw new Error(
    "No sitemap found at /sitemap_index.xml or /sitemap.xml — check the domain manually in a browser."
  );
}

/** Step 2: collect every actual page URL out of however many sitemap files exist. */
async function collectAllUrls(sitemapUrls) {
  const all = new Set();
  for (const sm of sitemapUrls) {
    try {
      const xml = await fetchText(sm);
      const $ = cheerio.load(xml, { xmlMode: true });
      $("url > loc").each((_, el) => all.add($(el).text()));
      await sleep(REQUEST_DELAY_MS);
    } catch (err) {
      console.warn(`  ! could not read sitemap ${sm}: ${err.message}`);
    }
  }
  return [...all];
}

function isArticleUrl(url) {
  if (!url.startsWith(BASE)) return false;
  if (EXCLUDE_PATTERNS.some((re) => re.test(url))) return false;
  return ARTICLE_PATTERN.test(url);
}

/** Pulls category from the URL path itself, e.g. /bericht/turnier/2026/slug/ -> ["bericht","turnier"] */
function categoriesFromUrl(url) {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/").filter(Boolean);
  const yearIndex = segments.findIndex((s) => /^(19|20)\d{2}$/.test(s));
  return yearIndex > 0 ? segments.slice(0, yearIndex) : [];
}

function slugFromUrl(url) {
  const segments = new URL(url).pathname.split("/").filter(Boolean);
  return segments[segments.length - 1];
}

/** Step 3: scrape one article page for title, date, body, and image URLs. */
async function scrapeArticle(url) {
  const html = await fetchText(url);
  const $ = cheerio.load(html);

  const title =
    $("h1.entry-title").first().text().trim() ||
    $("h1").first().text().trim() ||
    $("title").text().replace(/\s*[–|-]\s*PSV.*$/i, "").trim();

  // WordPress post-meta text looks like: "Veröffentlicht am 5. Juli 2026 ..."
  const metaText = $(".entry-meta, .post-meta, .entry-date").first().text();
  const dateMatch =
    metaText.match(/(\d{1,2})\.\s*(\p{L}+)\s*(\d{4})/u) ||
    html.match(/Veröffentlicht am\s*(\d{1,2})\.\s*(\p{L}+)\s*(\d{4})/u);

  const GERMAN_MONTHS = {
    januar: "01", februar: "02", märz: "03", april: "04", mai: "05", juni: "06",
    juli: "07", august: "08", september: "09", oktober: "10", november: "11", dezember: "12",
  };

  let isoDate = null;
  if (dateMatch) {
    const [, day, monthName] = dateMatch;
    const month = GERMAN_MONTHS[monthName.toLowerCase()];
    const year = dateMatch[3];
    if (month && year) {
      isoDate = `${year}-${month}-${day.padStart(2, "0")}`;
    }
  }
  // Fallback: use the year already embedded in the URL if the page date didn't parse.
  if (!isoDate) {
    const yearInUrl = url.match(/\/((19|20)\d{2})\//);
    if (yearInUrl) isoDate = `${yearInUrl[1]}-01-01`; // month unknown, flagged in report
  }

  const contentEl = $(".entry-content, article .content, article").first();
  contentEl.find("script, style, .sharedaddy, .jp-relatedposts").remove();

  const images = [];
  contentEl.find("img").each((_, el) => {
    const src = $(el).attr("src");
    if (src) images.push(new URL(src, url).href);
  });

  const bodyHtml = contentEl.html()?.trim() || "";

  return { url, title, isoDate, categories: categoriesFromUrl(url), images, bodyHtml };
}

function frontmatter(article) {
  const esc = (s) => (s || "").replace(/"/g, '\\"');
  return [
    "---",
    `title: "${esc(article.title)}"`,
    `date: "${article.isoDate}"`,
    `categories: [${article.categories.map((c) => `"${c}"`).join(", ")}]`,
    `sourceUrl: "${article.url}"`,
    "---",
    "",
  ].join("\n");
}

async function downloadImage(imgUrl) {
  try {
    const res = await fetch(imgUrl);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const filename = path.basename(new URL(imgUrl).pathname);
    const dest = path.join(IMG_DIR, filename);
    if (!DRY_RUN) await writeFile(dest, buf);
    return filename;
  } catch {
    return null;
  }
}

async function main() {
  console.log("1/4 Discovering sitemaps...");
  const sitemaps = await discoverSitemaps();
  console.log(`   found ${sitemaps.length} sitemap file(s)`);

  console.log("2/4 Collecting URLs...");
  const allUrls = await collectAllUrls(sitemaps);
  const articleUrls = allUrls.filter(isArticleUrl);
  console.log(`   ${allUrls.length} URLs total, ${articleUrls.length} look like news articles`);

  if (DRY_RUN) {
    console.log("\n--dry-run: first 20 article URLs found:");
    articleUrls.slice(0, 20).forEach((u) => console.log("  " + u));
    if (articleUrls.length > 20) {
      console.log(`  ... and ${articleUrls.length - 20} more`);
    }
    console.log(`\nTotal article URLs: ${articleUrls.length}`);
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(IMG_DIR, { recursive: true });

  console.log("3/4 Scraping articles...");
  const report = { total: articleUrls.length, written: 0, failed: [], noDateMatch: [] };

  for (const [i, url] of articleUrls.entries()) {
    try {
      const article = await scrapeArticle(url);
      if (!article.isoDate || article.isoDate.endsWith("-01-01")) {
        report.noDateMatch.push(url);
      }

      const [year, month] = (article.isoDate || "unknown-unknown").split("-");
      const dir = path.join(OUT_DIR, year, month);
      await mkdir(dir, { recursive: true });

      // Download images and rewrite references to local paths.
      let body = article.bodyHtml;
      for (const imgUrl of article.images) {
        const filename = await downloadImage(imgUrl);
        if (filename) body = body.split(imgUrl).join(`/images/${filename}`);
        await sleep(150);
      }

      const filePath = path.join(dir, `${slugFromUrl(url)}.mdx`);
      await writeFile(filePath, frontmatter(article) + body + "\n");
      report.written++;

      console.log(`   [${i + 1}/${articleUrls.length}] ${article.isoDate || "??"} — ${article.title}`);
    } catch (err) {
      report.failed.push({ url, error: err.message });
      console.warn(`   [${i + 1}/${articleUrls.length}] FAILED ${url}: ${err.message}`);
    }
    await sleep(REQUEST_DELAY_MS);
  }

  console.log("4/4 Writing report...");
  await writeFile("./migration-report.json", JSON.stringify(report, null, 2));
  console.log(
    `\nDone. ${report.written}/${report.total} articles written. ` +
      `${report.failed.length} failed, ${report.noDateMatch.length} had an unclear date. ` +
      `See migration-report.json for details.`
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

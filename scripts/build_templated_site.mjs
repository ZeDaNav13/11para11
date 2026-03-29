#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const inputRoot = process.argv[2] || "site-clean";
const outputRoot = process.argv[3] || "site-templated";
const templatesRoot = process.argv[4] || "templates";
const contentRoot = process.argv[5] || "content";
const siteBasePath = normalizeBasePath(process.env.SITE_BASE_PATH || "");

function normalizeBasePath(value) {
  const raw = String(value || "").trim();
  if (!raw || raw === "/") return "";
  const cleaned = `/${raw.replace(/^\/+|\/+$/g, "")}`;
  return cleaned === "/" ? "" : cleaned;
}

function withBasePath(url) {
  const value = String(url || "");
  if (!value || !siteBasePath) return value;
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("mailto:") ||
    value.startsWith("tel:") ||
    value.startsWith("#") ||
    value.startsWith("data:") ||
    value.startsWith("//")
  ) {
    return value;
  }
  if (value.startsWith(siteBasePath + "/") || value === siteBasePath) return value;
  if (value.startsWith("/")) return `${siteBasePath}${value}`;
  return value;
}

function readFileSafe(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeFile(p, text) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, text);
}

function copyIfExists(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, dest, { recursive: true, force: true });
}

function copyDirReplaceIfExists(src, dest) {
  fs.rmSync(dest, { recursive: true, force: true });
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, dest, { recursive: true, force: true });
}

function stripTags(html) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function escapeHtml(text) {
  return (text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeXml(text) {
  return (text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sanitizeAnchorTag(tag) {
  const attrs = [];
  const href = tag.match(/\shref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
  if (href) {
    const raw = href[2] || href[3] || href[4] || "";
    attrs.push(`href="${escapeHtml(raw)}"`);
  }
  const target = tag.match(/\starget\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
  if (target) {
    const raw = target[2] || target[3] || target[4] || "";
    attrs.push(`target="${escapeHtml(raw)}"`);
  }
  const rel = tag.match(/\srel\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
  if (rel) {
    const raw = rel[2] || rel[3] || rel[4] || "";
    attrs.push(`rel="${escapeHtml(raw)}"`);
  }
  const title = tag.match(/\stitle\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
  if (title) {
    const raw = title[2] || title[3] || title[4] || "";
    attrs.push(`title="${escapeHtml(raw)}"`);
  }
  return attrs.length ? `<a ${attrs.join(" ")}>` : "<a>";
}

function normalizeArticleBodyHtml(html) {
  const input = String(html || "").trim();
  if (!input) return "";

  let out = input;
  out = out.replace(/<font\b[^>]*>/gi, "").replace(/<\/font>/gi, "");
  out = out.replace(/<(p|div|span|li|ul|ol|strong|em|b|i|u|h1|h2|h3|h4|h5|h6|blockquote)\b[^>]*>/gi, "<$1>");
  out = out.replace(/<a\b[^>]*>/gi, (tag) => sanitizeAnchorTag(tag));
  out = out.replace(/<br\b[^>]*>/gi, "<br/>");
  out = out
    .replace(/<p>\s*&nbsp;\s*<\/p>/gi, "")
    .replace(/<div>\s*&nbsp;\s*<\/div>/gi, "")
    .trim();

  // Ensure legacy root-absolute links/media inside article bodies work on GitHub Pages project paths.
  out = out.replace(
    /\s(href|src)\s*=\s*("([^"]*)"|'([^']*)')/gi,
    (match, attr, quoted, doubleVal, singleVal) => {
      const val = typeof doubleVal === "string" ? doubleVal : singleVal;
      const q = quoted[0];
      if (!val || !val.startsWith("/") || val.startsWith("//")) return match;
      return ` ${attr}=${q}${withBasePath(val)}${q}`;
    },
  );

  return out;
}

function prettySection(s) {
  return s.replace(/-/g, " ");
}

const SECTION_LABEL_OVERRIDES = {
  "a-seleccao": "A Selecção",
  "area-tecnica": "Área Técnica",
  "confianca-azul": "Confiança Azul",
  "curva-belissima": "Curva Belíssima",
  "no-caldeirao-domingo-as-4": "No Caldeirão, Domingo Às 4",
  "o-cantinho-da-magica": "O Cantinho Da Mágica",
  "o-tubarao": "O Tubarão",
};

function displaySectionName(slug, fallbackName = "") {
  if (SECTION_LABEL_OVERRIDES[slug]) return SECTION_LABEL_OVERRIDES[slug];
  return fallbackName || prettySection(slug || "");
}

function formatCardDate(value) {
  const m = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(value || "");
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const yy = m[1].slice(-2);
  const mm = Number(m[2]);
  const dd = m[3];
  const mon = months[mm - 1] || m[2];
  return `${dd}/${mon}/${yy}`;
}

function parseYmd(value) {
  const m = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return { year: m[1], month: m[2], day: m[3] };
}

function formatArchiveMonth(month) {
  const months = {
    "01": "Janeiro",
    "02": "Fevereiro",
    "03": "Março",
    "04": "Abril",
    "05": "Maio",
    "06": "Junho",
    "07": "Julho",
    "08": "Agosto",
    "09": "Setembro",
    "10": "Outubro",
    "11": "Novembro",
    "12": "Dezembro",
  };
  return months[month] || month;
}

function toRssPubDate(value) {
  if (!value) return new Date().toUTCString();
  const dt = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(dt.getTime())) return new Date().toUTCString();
  return dt.toUTCString();
}

function parseTsv(tsv) {
  return [];
}

function replaceTokens(template, data) {
  let out = template;
  for (const [k, v] of Object.entries(data)) {
    out = out.replaceAll(`{{${k}}}`, v);
  }
  return out;
}

function buildRedirectPage(toPath) {
  const target = withBasePath(toPath || "/");
  return `<!doctype html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0; url=${target}">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redirecionar...</title>
  <link rel="canonical" href="${target}">
</head>
<body>
  <p>A redirecionar para <a href="${target}">${target}</a>...</p>
  <script>location.replace(${JSON.stringify(target)});</script>
</body>
</html>`;
}

function buildNavLinks(sections, current) {
  const navItems = [
    { key: "a-seleccao", href: withBasePath("/a-seleccao/"), label: "a selecção" },
    { key: "o-fantasista", href: withBasePath("/o-fantasista/"), label: "o fantasista" },
    { key: "o-tubarao", href: withBasePath("/o-tubarao/"), label: "o tubarão" },
    { key: "area-tecnica", href: withBasePath("/area-tecnica/"), label: "área técnica" },
    { key: "autores", href: withBasePath("/autores/"), label: "o plantel" },
  ];

  return navItems
    .map((item) => {
      const cls = current === item.key ? "active" : "";
      return `<a class="${cls}" href="${item.href}">${item.label}</a>`;
    })
    .join("\n");
}

function renderCard(entry) {
  const section = displaySectionName(entry.section_slug || "", entry.section_name || "");
  const author = entry.author_name || "11PARA11";
  const shortDate = formatCardDate(entry.date || "");
  return `
<article class="card">
  <a class="card-hit" href="${withBasePath(entry.url)}">
    <img class="card-cover" src="${escapeHtml(withBasePath(entry.cover))}" alt="${escapeHtml(entry.title)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${escapeHtml(withBasePath("/assets/you.png"))}'">
    <div class="card-body">
      <p class="card-category">
        <span class="category-pill">${escapeHtml(section)}</span>
      </p>
      <h3 class="card-title">${escapeHtml(entry.title)}</h3>
      <p class="card-submeta">${escapeHtml(author)} <span class="card-dot">•</span> ${escapeHtml(shortDate)}</p>
    </div>
  </a>
</article>`;
}

function renderHiddenCard(entry) {
  return renderCard(entry).replace('<article class="card">', '<article class="card is-hidden extra-card">');
}

function renderAuthorCard(entry) {
  const section = escapeHtml(entry.section_slug || "");
  return renderCard(entry).replace('<article class="card">', `<article class="card" data-section="${section}">`);
}

function renderHistoryRow(entry) {
  const section = displaySectionName(entry.section_slug || "", entry.section_name || "");
  const author = entry.author_name || "11PARA11";
  const shortDate = formatCardDate(entry.date || "");
  return `
<article class="history-row">
  <a class="history-hit" href="${withBasePath(entry.url)}">
    <img class="history-cover" src="${escapeHtml(withBasePath(entry.cover || "/assets/you.png"))}" alt="${escapeHtml(entry.title)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${escapeHtml(withBasePath("/assets/you.png"))}'">
    <div class="history-body">
      <p class="card-category">
        <span class="category-pill">${escapeHtml(section)}</span>
      </p>
      <h3 class="history-title">${escapeHtml(entry.title)}</h3>
      <p class="history-submeta">${escapeHtml(author)} <span class="card-dot">•</span> ${escapeHtml(shortDate)}</p>
    </div>
  </a>
</article>`;
}

function renderHiddenHistoryRow(entry) {
  return renderHistoryRow(entry).replace('<article class="history-row">', '<article class="history-row is-hidden extra-history">');
}

function renderCarouselSlide(entry, index) {
  const activeClass = index === 0 ? " active" : "";
  const section = displaySectionName(entry.section_slug || "", entry.section_name || "");
  const author = entry.author_name || "11PARA11";
  const shortDate = formatCardDate(entry.date || "");
  return `<article class="carousel-slide${activeClass}" data-index="${index}">
  <a class="carousel-hit" href="${withBasePath(entry.url)}">
    <img class="carousel-cover" src="${escapeHtml(withBasePath(entry.cover || "/assets/you.png"))}" alt="${escapeHtml(entry.title)}" loading="${index === 0 ? "eager" : "lazy"}" decoding="async" fetchpriority="${index === 0 ? "high" : "low"}" onerror="this.onerror=null;this.src='${escapeHtml(withBasePath("/assets/you.png"))}'">
    <div class="carousel-body">
      <p class="card-category">
        <span class="category-pill">${escapeHtml(section)}</span>
      </p>
      <h2 class="carousel-title">${escapeHtml(entry.title)}</h2>
      <p class="carousel-desc">${escapeHtml(entry.description || "")}</p>
      <p class="carousel-submeta">${escapeHtml(author)} <span class="card-dot">•</span> ${escapeHtml(shortDate)}</p>
    </div>
  </a>
</article>`;
}

function renderCarouselDot(index) {
  const activeClass = index === 0 ? " active" : "";
  const selected = index === 0 ? "true" : "false";
  return `<button class="carousel-dot${activeClass}" type="button" role="tab" aria-selected="${selected}" data-index="${index}"></button>`;
}

function pickFeaturedEntries(allEntries, count = 3) {
  const featured = [];
  const seenAuthors = new Set();

  for (const entry of allEntries) {
    const key = entry.author_slug || "__unknown__";
    if (seenAuthors.has(key)) continue;
    featured.push(entry);
    seenAuthors.add(key);
    if (featured.length >= count) break;
  }

  if (featured.length < count) {
    const pickedUrls = new Set(featured.map((e) => e.url));
    for (const entry of allEntries) {
      if (pickedUrls.has(entry.url)) continue;
      featured.push(entry);
      pickedUrls.add(entry.url);
      if (featured.length >= count) break;
    }
  }

  return featured;
}

function pickUniqueAuthorEntries(allEntries, count) {
  const picked = [];
  const pickedUrls = new Set();
  const seenAuthors = new Set();

  for (const entry of allEntries) {
    const key = entry.author_slug || "__unknown__";
    if (seenAuthors.has(key)) continue;
    picked.push(entry);
    pickedUrls.add(entry.url);
    seenAuthors.add(key);
    if (picked.length >= count) break;
  }

  if (picked.length < count) {
    for (const entry of allEntries) {
      if (pickedUrls.has(entry.url)) continue;
      picked.push(entry);
      pickedUrls.add(entry.url);
      if (picked.length >= count) break;
    }
  }

  const remaining = allEntries.filter((entry) => !pickedUrls.has(entry.url));
  return { picked, remaining };
}

const layoutTpl = readFileSafe(path.join(templatesRoot, "layout.html"));
const homeTpl = readFileSafe(path.join(templatesRoot, "home.html"));
const sectionTpl = readFileSafe(path.join(templatesRoot, "section.html"));
const articleTpl = readFileSafe(path.join(templatesRoot, "article.html"));
const authorTpl = readFileSafe(path.join(templatesRoot, "author.html"));
const authorsTpl = readFileSafe(path.join(templatesRoot, "authors.html"));
const staticPageTpl = readFileSafe(path.join(templatesRoot, "static-page.html"));
const mainCss = readFileSafe(path.join(templatesRoot, "main.css"));

if (!layoutTpl || !homeTpl || !sectionTpl || !articleTpl || !authorTpl || !authorsTpl || !staticPageTpl || !mainCss) {
  console.error("Missing template files under templates/");
  process.exit(1);
}

const articlesPath = path.join(contentRoot, "articles.json");
const sectionsPath = path.join(contentRoot, "sections.json");
const authorsPath = path.join(contentRoot, "authors.json");

const entries = JSON.parse(readFileSafe(articlesPath) || "[]");
const sectionsData = JSON.parse(readFileSafe(sectionsPath) || "[]");
const authorsData = JSON.parse(readFileSafe(authorsPath) || "[]");

if (!entries.length || !sectionsData.length) {
  console.error(
    `Missing canonical content data in ${contentRoot}. Run ./scripts/extract_content_data.sh first.`,
  );
  process.exit(1);
}

const sections = sectionsData.map((s) => s.slug);
const sectionNameBySlug = Object.fromEntries(sectionsData.map((s) => [s.slug, s.name]));
const authorSeedBySlug = Object.fromEntries(authorsData.map((a) => [a.slug, a]));
const allAuthorSlugs = Array.from(
  new Set([
    ...authorsData.map((a) => a.slug).filter(Boolean),
    ...entries.map((e) => e.author_slug).filter(Boolean),
  ]),
);
const effectiveAuthorsData = allAuthorSlugs
  .map((slug) => {
    const seed = authorSeedBySlug[slug] || {};
    const authorEntries = entries.filter((e) => e.author_slug === slug);
    const sectionSlugs = Array.from(
      new Set(
        authorEntries
          .map((e) => e.section_slug || "")
          .filter(Boolean),
      ),
    );
    const name =
      seed.name ||
      authorEntries.find((e) => (e.author_name || "").trim())?.author_name ||
      slug;
    return {
      slug,
      name,
      url: withBasePath(seed.url || `/autores/${slug}/`),
      article_count: authorEntries.length,
      section_count: sectionSlugs.length,
      section_slugs: sectionSlugs,
    };
  })
  .sort((a, b) => (b.article_count || 0) - (a.article_count || 0) || (a.slug || "").localeCompare(b.slug || ""));
const authorBySlug = Object.fromEntries(effectiveAuthorsData.map((a) => [a.slug, a]));

// Copy baseline assets/content folders.
copyIfExists(path.join(inputRoot, "assets"), path.join(outputRoot, "assets"));
copyIfExists(path.join(inputRoot, "ckeditor_assets"), path.join(outputRoot, "ckeditor_assets"));
copyIfExists(path.join(inputRoot, "system"), path.join(outputRoot, "system"));
copyIfExists(path.join(inputRoot, "fonts"), path.join(outputRoot, "fonts"));
copyIfExists(path.join(inputRoot, "data"), path.join(outputRoot, "data"));
copyIfExists(path.join(inputRoot, "favicon.ico"), path.join(outputRoot, "favicon.ico"));
copyIfExists(path.join(inputRoot, "favicon.svg"), path.join(outputRoot, "favicon.svg"));
copyIfExists(path.join(inputRoot, "robots.txt"), path.join(outputRoot, "robots.txt"));

const mainCssWithBase = siteBasePath
  ? mainCss
      .replaceAll('url("/', `url("${siteBasePath}/`)
      .replaceAll("url('/", `url('${siteBasePath}/`)
  : mainCss;
writeFile(path.join(outputRoot, "theme/main.css"), mainCssWithBase);
writeFile(path.join(outputRoot, "data/authors.json"), JSON.stringify(effectiveAuthorsData, null, 2));

const featuredEntries = pickFeaturedEntries(entries, 3);
const featuredUrls = new Set(featuredEntries.map((e) => e.url));
const feedPool = entries.filter((e) => !featuredUrls.has(e.url));
const firstBlock = pickUniqueAuthorEntries(feedPool, 4);
const cardsTwo = firstBlock.picked;
const cardsThree = firstBlock.remaining.slice(0, 9);
const cardsMore = firstBlock.remaining.slice(9);
const carouselSlides = featuredEntries
  .map((entry, index) => renderCarouselSlide(entry, index))
  .join("\n");
const carouselDots = featuredEntries.map((_, index) => renderCarouselDot(index)).join("\n");
const categorySpotlightData = sectionsData
  .slice()
  .sort((a, b) => {
    const d = (b.article_count || 0) - (a.article_count || 0);
    if (d !== 0) return d;
    return (a.slug || "").localeCompare(b.slug || "");
  })
  .map((section) => {
    const sectionArticles = entries
      .filter((e) => e.section_slug === section.slug)
      .slice(0, 8)
      .map((e) => ({
        url: e.url,
        title: e.title,
        cover: withBasePath(e.cover || "/assets/you.png"),
        author: e.author_name || "11PARA11",
        date: formatCardDate(e.date || ""),
      }));
    return {
      slug: section.slug,
      url: withBasePath(`/${section.slug}/`),
      name: displaySectionName(section.slug, section.name || prettySection(section.slug || "")),
      article_count: section.article_count || sectionArticles.length,
      articles: sectionArticles,
    };
  })
  .filter((section) => section.articles.length > 0);

const categorySpotlightJson = JSON.stringify(categorySpotlightData).replace(/</g, "\\u003c");
const heroContent = replaceTokens(homeTpl, {
  BASE_PATH: siteBasePath,
  CAROUSEL_SLIDES: carouselSlides,
  CAROUSEL_DOTS: carouselDots,
  CATEGORY_SPOTLIGHT_JSON: categorySpotlightJson,
  CARDS_TWO: cardsTwo.map(renderCard).join("\n"),
  CARDS_THREE: cardsThree.map(renderCard).join("\n"),
  CARDS_MORE: cardsMore.map(renderHiddenHistoryRow).join("\n"),
});

const homeHtml = replaceTokens(layoutTpl, {
  BASE_PATH: siteBasePath,
  PAGE_CLASS: "home-page",
  PAGE_TITLE: "11para11",
  PAGE_DESCRIPTION: "Arquivo recuperado e reestruturado do 11PARA11.",
  NAV_LINKS: buildNavLinks(sections, "home"),
  PAGE_CONTENT: heroContent,
});
writeFile(path.join(outputRoot, "index.html"), homeHtml);

for (const section of sections) {
  const sectionEntries = entries.filter((e) => e.section_slug === section);
  const sectionDisplayName = displaySectionName(section, sectionNameBySlug[section] || prettySection(section));
  const sectionContent = replaceTokens(sectionTpl, {
    SECTION_NAME: escapeHtml(sectionDisplayName),
    SECTION_COUNT: String(sectionEntries.length),
    CARDS: sectionEntries.slice(0, 60).map(renderCard).join("\n"),
  });

  const sectionHtml = replaceTokens(layoutTpl, {
    BASE_PATH: siteBasePath,
    PAGE_CLASS: "section-page",
    PAGE_TITLE: `11para11 - ${sectionDisplayName}`,
    PAGE_DESCRIPTION: `Arquivo da secção ${sectionDisplayName}.`,
    NAV_LINKS: buildNavLinks(sections, section),
    PAGE_CONTENT: sectionContent,
  });
  writeFile(path.join(outputRoot, section, "index.html"), sectionHtml);
}

for (const entry of entries) {
  const author = authorBySlug[entry.author_slug] || {
    slug: entry.author_slug || "11para11",
    name: entry.author_name || "11PARA11",
    url: withBasePath(`/autores/${entry.author_slug || "11para11"}/`),
    article_count: 0,
    section_count: 0,
  };
  const authorRecent = entries
    .filter((a) => a.author_slug === entry.author_slug && a.url !== entry.url)
    .slice(0, 4)
    .map(
      (a) => `<a class="author-recent-tile" href="${withBasePath(a.url)}" title="${escapeHtml(a.title)}" aria-label="${escapeHtml(a.title)}">
  <img class="author-recent-cover" src="${escapeHtml(withBasePath(a.cover || "/assets/you.png"))}" alt="${escapeHtml(a.title)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${escapeHtml(withBasePath("/assets/you.png"))}'">
  <span class="author-recent-body">
    <span class="author-recent-pill">${escapeHtml(displaySectionName(a.section_slug || "", a.section_name || ""))}</span>
    <span class="author-recent-title">${escapeHtml(a.title)}</span>
    <span class="author-recent-meta">${escapeHtml(formatCardDate(a.date || ""))}</span>
  </span>
</a>`,
    )
    .join("\n");
  const categorySlug = entry.section_slug || "";
  const categoryName = displaySectionName(categorySlug, entry.section_name || prettySection(categorySlug));
  const categoryUrl = withBasePath(`/${categorySlug}/`);
  const categoryRecent = entries
    .filter((a) => a.section_slug === entry.section_slug && a.url !== entry.url)
    .slice(0, 4)
    .map((a) => {
      const itemAuthor =
        authorBySlug[a.author_slug || ""]?.name || a.author_name || "11para11";
      return `<a class="author-recent-tile category-recent-tile" href="${withBasePath(a.url)}" title="${escapeHtml(a.title)}" aria-label="${escapeHtml(a.title)}">
  <img class="author-recent-cover" src="${escapeHtml(withBasePath(a.cover || "/assets/you.png"))}" alt="${escapeHtml(a.title)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${escapeHtml(withBasePath("/assets/you.png"))}'">
  <span class="author-recent-body">
    <span class="author-recent-title">${escapeHtml(a.title)}</span>
    <span class="author-recent-meta">${escapeHtml(itemAuthor)} <span class="card-dot">•</span> ${escapeHtml(formatCardDate(a.date || ""))}</span>
  </span>
</a>`;
    })
    .join("\n");

  const articleContent = replaceTokens(articleTpl, {
    ARTICLE_COVER: escapeHtml(withBasePath(entry.cover || "/assets/you.png")),
    ARTICLE_TITLE: escapeHtml(entry.title),
    ARTICLE_DATE: escapeHtml(formatCardDate(entry.date || "")),
    ARTICLE_CATEGORY: escapeHtml(categoryName),
    ARTICLE_BODY: normalizeArticleBodyHtml(entry.body_html || `<p>${escapeHtml(entry.description || "")}</p>`),
    AUTHOR_URL: author.url || withBasePath(`/autores/${author.slug}/`),
    AUTHOR_NAME: escapeHtml(author.name || entry.author_name || "11PARA11"),
    CATEGORY_URL: categoryUrl,
    AUTHOR_COUNT: String(author.article_count || 0),
    AUTHOR_SECTIONS: String(author.section_count || 0),
    AUTHOR_RECENT: authorRecent || '<span class="author-recent-empty">Sem outros artigos recentes.</span>',
    CATEGORY_RECENT: categoryRecent || '<span class="author-recent-empty">Sem outros artigos recentes nesta categoria.</span>',
  });
  const articleHtml = replaceTokens(layoutTpl, {
    BASE_PATH: siteBasePath,
    PAGE_CLASS: "article-page",
    PAGE_TITLE: `11para11 - ${entry.title}`,
    PAGE_DESCRIPTION: escapeHtml(entry.description || ""),
    NAV_LINKS: buildNavLinks(sections, entry.section_slug),
    PAGE_CONTENT: articleContent,
  });
  writeFile(path.join(outputRoot, entry.url), articleHtml);
}

for (const author of effectiveAuthorsData) {
  const authorEntries = entries.filter((e) => e.author_slug === author.slug);
  const visibleAuthorEntries = authorEntries;
  const sectionCounts = new Map();
  for (const e of visibleAuthorEntries) {
    const slug = e.section_slug || "";
    if (!slug) continue;
    sectionCounts.set(slug, (sectionCounts.get(slug) || 0) + 1);
  }
  const authorFilters = [
    ...Array.from(sectionCounts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([slug]) => {
        const label = displaySectionName(slug, prettySection(slug));
        return `<button class="author-filter" type="button" data-section="${escapeHtml(slug)}" aria-pressed="false">${escapeHtml(label)}</button>`;
      }),
  ].join("\n");

  const authorContent = replaceTokens(authorTpl, {
    AUTHOR_NAME: escapeHtml(author.name),
    AUTHOR_COUNT: String(author.article_count || authorEntries.length),
    AUTHOR_SECTIONS: String(author.section_count || (author.section_slugs || []).length),
    AUTHOR_FILTERS: authorFilters,
    CARDS: visibleAuthorEntries.map(renderAuthorCard).join("\n"),
  });

  const authorHtml = replaceTokens(layoutTpl, {
    BASE_PATH: siteBasePath,
    PAGE_CLASS: "author-page",
    PAGE_TITLE: `11para11 - ${author.name}`,
    PAGE_DESCRIPTION: `Artigos de ${author.name} no 11PARA11.`,
    NAV_LINKS: buildNavLinks(sections, "autores"),
    PAGE_CONTENT: authorContent,
  });
  writeFile(path.join(outputRoot, "autores", author.slug, "index.html"), authorHtml);
}

const legacyAuthorRedirects = {
  "o-fantasista": "/autores/pedro-maia/",
  "o-especialista": "/autores/oscar-botelho/",
  "11para11": "/autores/a-redaccao/",
};

for (const [legacySlug, target] of Object.entries(legacyAuthorRedirects)) {
  writeFile(path.join(outputRoot, "autores", legacySlug, "index.html"), buildRedirectPage(target));
}

const authorsList = effectiveAuthorsData
  .slice()
  .sort((a, b) => {
    const latestA = entries.find((e) => e.author_slug === a.slug)?.date || "";
    const latestB = entries.find((e) => e.author_slug === b.slug)?.date || "";
    if (latestA !== latestB) return latestB.localeCompare(latestA);
    return (a.slug || "").localeCompare(b.slug || "");
  })
  .map((author) => {
    const latest = entries.find((e) => e.author_slug === author.slug);
    const sectionPills = (author.section_slugs || [])
      .map((slug) => {
        const label = displaySectionName(slug, prettySection(slug));
        return `<a class="author-section-pill" href="${withBasePath(`/${slug}/`)}">${escapeHtml(label)}</a>`;
      })
      .join("");
    const latestHtml = latest
      ? `<p class="author-latest">Último: <a class="author-latest-link" href="${withBasePath(latest.url)}">${escapeHtml(latest.title)}</a> <span class="card-dot">•</span> ${escapeHtml(formatCardDate(latest.date || ""))}</p>`
      : `<p class="author-latest">Sem artigos publicados.</p>`;
    return `<article class="author-tile">
  <h3><a class="author-link" href="${withBasePath(`/autores/${author.slug}/`)}">${escapeHtml(author.name)}</a></h3>
  <p class="author-sub">${author.article_count || 0} artigos</p>
  <p class="author-sections">${sectionPills}</p>
  ${latestHtml}
</article>`;
  })
  .join("\n");

const authorsIndexContent = replaceTokens(authorsTpl, {
  AUTHOR_COUNT: String(effectiveAuthorsData.length),
  AUTHOR_CARDS: authorsList,
});

const authorsIndexHtml = replaceTokens(layoutTpl, {
  BASE_PATH: siteBasePath,
  PAGE_CLASS: "authors-page",
  PAGE_TITLE: "11para11 - Autores",
  PAGE_DESCRIPTION: "Lista de autores do 11PARA11.",
  NAV_LINKS: buildNavLinks(sections, "autores"),
  PAGE_CONTENT: authorsIndexContent,
});
writeFile(path.join(outputRoot, "autores", "index.html"), authorsIndexHtml);

const aboutSource =
  entries.find((e) => e.url === "/a-seleccao/2011-11-11-11-para-11.html") ||
  entries.find((e) => (e.title || "").toLowerCase() === "11 para 11");

const cleanedAboutBody = normalizeArticleBodyHtml(
  aboutSource?.body_html || "<p>Bem-vindo ao 11para11.</p>",
);

const aboutContent = replaceTokens(staticPageTpl, {
  STATIC_TITLE: escapeHtml(aboutSource?.title || "11 para 11"),
  STATIC_BODY: cleanedAboutBody,
});

const aboutHtml = replaceTokens(layoutTpl, {
  BASE_PATH: siteBasePath,
  PAGE_CLASS: "sobre-page",
  PAGE_TITLE: "11para11 - Sobre",
  PAGE_DESCRIPTION: escapeHtml(
    aboutSource?.description ||
      "Para os que amam o Futebol jogado dentro das quatro linhas, o que começa sempre 11 para 11.",
  ),
  NAV_LINKS: buildNavLinks(sections, ""),
  PAGE_CONTENT: aboutContent,
});
writeFile(path.join(outputRoot, "sobre", "index.html"), aboutHtml);

const archiveEntries = entries.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
const archiveByYear = new Map();
for (const entry of archiveEntries) {
  const parts = parseYmd(entry.date || "");
  if (!parts) continue;
  if (!archiveByYear.has(parts.year)) archiveByYear.set(parts.year, new Map());
  const byMonth = archiveByYear.get(parts.year);
  if (!byMonth.has(parts.month)) byMonth.set(parts.month, []);
  byMonth.get(parts.month).push(entry);
}

const yearKeys = Array.from(archiveByYear.keys()).sort((a, b) => b.localeCompare(a));
const archiveTree = yearKeys
  .map((year, yearIdx) => {
    const byMonth = archiveByYear.get(year);
    const monthKeys = Array.from(byMonth.keys()).sort((a, b) => b.localeCompare(a));
    const monthsHtml = monthKeys
      .map((month, monthIdx) => {
        const itemsHtml = byMonth
          .get(month)
          .map((e) => {
            const section = displaySectionName(e.section_slug || "", e.section_name || "");
            const dateLabel = formatCardDate(e.date || "");
            const author = e.author_name || "11para11";
            return `<li class="archive-item">
  <a class="archive-item-link" href="${withBasePath(e.url)}">
    <span class="category-pill">${escapeHtml(section)}</span>
    <span class="archive-item-title">${escapeHtml(e.title || "")}</span>
    <span class="archive-item-meta">${escapeHtml(author)} <span class="card-dot">•</span> ${escapeHtml(dateLabel)}</span>
  </a>
</li>`;
          })
          .join("\n");
        const monthOpen = false;
        return `<div class="archive-month">
  <button class="archive-toggle archive-month-toggle" type="button" aria-expanded="${monthOpen ? "true" : "false"}">
    <span class="archive-chevron">${monthOpen ? "▾" : "▸"}</span>
    <span class="archive-month-label">${escapeHtml(formatArchiveMonth(month))}</span>
  </button>
  <ul class="archive-items${monthOpen ? "" : " is-collapsed"}">
    ${itemsHtml}
  </ul>
</div>`;
      })
      .join("\n");
    const yearOpen = false;
    return `<section class="archive-year">
  <button class="archive-toggle archive-year-toggle" type="button" aria-expanded="${yearOpen ? "true" : "false"}">
    <span class="archive-chevron">${yearOpen ? "▾" : "▸"}</span>
    <span class="archive-year-label">${escapeHtml(year)}</span>
  </button>
  <div class="archive-months${yearOpen ? "" : " is-collapsed"}">
    ${monthsHtml}
  </div>
</section>`;
  })
  .join("\n");

const archiveScript = `<script>
(() => {
  const root = document.querySelector(".archive-tree");
  if (!root) return;
  root.querySelectorAll(".archive-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = btn.nextElementSibling;
      if (!next) return;
      const expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", expanded ? "false" : "true");
      const chevron = btn.querySelector(".archive-chevron");
      if (chevron) chevron.textContent = expanded ? "▸" : "▾";
      next.classList.toggle("is-collapsed", expanded);
    });
  });
})();
</script>`;

const archiveContent = replaceTokens(staticPageTpl, {
  STATIC_TITLE: "Arquivo",
  STATIC_BODY: `<div class="archive-tree">${archiveTree}</div>${archiveScript}`,
});

const archiveHtml = replaceTokens(layoutTpl, {
  BASE_PATH: siteBasePath,
  PAGE_CLASS: "arquivo-page",
  PAGE_TITLE: "11para11 - Arquivo",
  PAGE_DESCRIPTION: "Arquivo de artigos do 11para11.",
  NAV_LINKS: buildNavLinks(sections, ""),
  PAGE_CONTENT: archiveContent,
});
writeFile(path.join(outputRoot, "arquivo", "index.html"), archiveHtml);

const siteUrl = process.env.SITE_URL || "https://11para11.pt";
const rssItems = entries
  .slice(0, 120)
  .map((entry) => {
    const title = escapeXml(entry.title || "");
    const link = `${siteUrl}${entry.url || "/"}`;
    const description = escapeXml(entry.description || stripTags(entry.body_html || "").slice(0, 260));
    const pubDate = toRssPubDate(entry.date || "");
    const guid = escapeXml(link);
    return `<item>
  <title>${title}</title>
  <link>${escapeXml(link)}</link>
  <guid>${guid}</guid>
  <pubDate>${escapeXml(pubDate)}</pubDate>
  <description>${description}</description>
</item>`;
  })
  .join("\n");

const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>11para11</title>
  <link>${escapeXml(siteUrl)}</link>
  <description>Arquivo recuperado e reestruturado do 11PARA11.</description>
  <language>pt-PT</language>
  <lastBuildDate>${escapeXml(new Date().toUTCString())}</lastBuildDate>
  ${rssItems}
</channel>
</rss>
`;
writeFile(path.join(outputRoot, "feed.xml"), rssXml);

console.log(`Generated templated site at: ${outputRoot}`);
console.log(`Articles: ${entries.length}`);
console.log(`Sections: ${sections.length}`);
console.log(`Authors: ${effectiveAuthorsData.length}`);

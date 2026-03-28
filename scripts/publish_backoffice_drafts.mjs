#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const contentRoot = process.argv[2] || "content";
const draftsRoot = process.argv[3] || "drafts";
const strictPublishedContent = ["1", "true", "yes", "on"].includes(
  String(process.env.PUBLISH_STRICT_PUBLISHED_CONTENT || "").trim().toLowerCase(),
);

const canonicalArticlesPath = path.join(contentRoot, "articles.json");
const canonicalAuthorsPath = path.join(contentRoot, "authors.json");
const canonicalSectionsPath = path.join(contentRoot, "sections.json");

const draftArticlesPath = path.join(draftsRoot, "articles.backoffice.json");
const draftAuthorsPath = path.join(draftsRoot, "authors.backoffice.json");

function readJsonArray(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`Expected JSON array in ${filePath}`);
  }
  return parsed;
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function titleCaseSection(slug) {
  return String(slug || "")
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ""))
    .join(" ");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function stripTags(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeStatus(value, fallback = "published") {
  const status = String(value || "").trim().toLowerCase();
  if (status === "draft" || status === "review" || status === "published") return status;
  return fallback;
}

function validateUrl(url) {
  return /^\/[a-z0-9-]+\/[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9-]+\.html$/.test(url);
}

function urlToId(url) {
  const match = String(url || "").match(/^\/([^/]+)\/([^/]+)\.html$/);
  if (!match) return "";
  return `${match[1]}/${match[2]}`;
}

const canonicalArticles = readJsonArray(canonicalArticlesPath) || [];
const canonicalAuthors = readJsonArray(canonicalAuthorsPath) || [];
const canonicalSections = readJsonArray(canonicalSectionsPath) || [];
const draftArticles = readJsonArray(draftArticlesPath);
const draftAuthors = readJsonArray(draftAuthorsPath);

if (!draftArticles && !draftAuthors) {
  console.log(`No draft files found under ${draftsRoot}; skipping publish step.`);
  process.exit(0);
}

const authorBySlug = new Map();
for (const a of canonicalAuthors) {
  authorBySlug.set(a.slug, { ...a });
}

if (draftAuthors) {
  for (const row of draftAuthors) {
    const slug = slugify(row.slug || row.name);
    const name = String(row.name || "").trim();
    assert(slug, `Invalid author slug in ${draftAuthorsPath}`);
    assert(name, `Author name is required for slug "${slug}"`);
    const prev = authorBySlug.get(slug) || {};
    authorBySlug.set(slug, {
      ...prev,
      slug,
      name,
      url: `/autores/${slug}/`,
      section_slugs: Array.isArray(row.section_slugs)
        ? row.section_slugs.map((s) => slugify(s)).filter(Boolean)
        : prev.section_slugs || [],
      article_count: Number.isFinite(row.article_count) ? row.article_count : prev.article_count || 0,
    });
  }
}

const articleByUrl = new Map();
for (const a of canonicalArticles) {
  articleByUrl.set(a.url, { ...a, status: normalizeStatus(a.status, "published") });
}

if (draftArticles) {
  const seenUrls = new Set();
  for (const row of draftArticles) {
    const title = String(row.title || "").trim();
    const sectionSlug = slugify(row.section_slug);
    const date = String(row.date || "").trim();
    const slug = slugify(row.slug || title);
    const authorSlug = slugify(row.author_slug || row.author_name);
    const authorName = String(row.author_name || "").trim();
    const url = String(row.url || "").trim();
    const status = normalizeStatus(row.status, "published");

    assert(title, `Article title is required (${JSON.stringify(row).slice(0, 80)}...)`);
    assert(sectionSlug, `Article section_slug is required for "${title}"`);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(date), `Article date must be YYYY-MM-DD for "${title}"`);
    assert(slug, `Article slug is required for "${title}"`);
    assert(url, `Article url is required for "${title}"`);
    assert(validateUrl(url), `Article url must follow /section/yyyy-mm-dd-title.html for "${title}": ${url}`);
    assert(!seenUrls.has(url), `Duplicate URL in draft articles: ${url}`);
    seenUrls.add(url);

    const expectedUrl = `/${sectionSlug}/${date}-${slug}.html`;
    assert(url === expectedUrl, `URL mismatch for "${title}". Expected ${expectedUrl}, got ${url}`);

    assert(authorSlug, `Article author_slug is required for "${title}"`);
    assert(authorBySlug.has(authorSlug), `Unknown author_slug "${authorSlug}" in article "${title}"`);

    const author = authorBySlug.get(authorSlug);
    articleByUrl.set(url, {
      id: urlToId(url),
      date,
      section_slug: sectionSlug,
      section_name: titleCaseSection(sectionSlug),
      slug: `${date}-${slug}`,
      url,
      title,
      description: String(row.description || "").trim(),
      cover: String(row.cover || "").trim() || "/assets/you.png",
      author_name: author?.name || authorName || "11para11",
      author_slug: authorSlug,
      author_url: `/autores/${authorSlug}/`,
      body_html: String(row.body_html || "").trim() || `<p>${title}</p>`,
      status,
    });
  }
}

const mergedArticles = [...articleByUrl.values()].sort((a, b) => (a.date < b.date ? 1 : -1));

if (strictPublishedContent) {
  for (const article of mergedArticles) {
    const status = normalizeStatus(article.status, "published");
    if (status !== "published") continue;

    const cover = String(article.cover || "").trim();
    const bodyHtml = String(article.body_html || "").trim();
    const bodyText = stripTags(bodyHtml);
    const titleText = String(article.title || "").trim();

    assert(cover && cover !== "/assets/you.png", `Strict mode: missing/non-editorial cover for "${article.title}"`);
    assert(bodyText.length > 0, `Strict mode: missing body content for "${article.title}"`);
    assert(
      !(titleText && bodyText === titleText),
      `Strict mode: body appears placeholder-only for "${article.title}"`,
    );
  }
}

const authorAgg = new Map();
for (const article of mergedArticles) {
  const slug = article.author_slug || "11para11";
  if (!authorAgg.has(slug)) {
    authorAgg.set(slug, {
      slug,
      name: article.author_name || slug,
      url: `/autores/${slug}/`,
      article_count: 0,
      section_slugs: new Set(),
    });
  }
  const agg = authorAgg.get(slug);
  agg.article_count += 1;
  agg.section_slugs.add(article.section_slug);
}

const mergedAuthors = [...authorBySlug.keys(), ...authorAgg.keys()]
  .filter((slug, idx, arr) => arr.indexOf(slug) === idx)
  .map((slug) => {
    const fromDraftOrCanonical = authorBySlug.get(slug) || {};
    const fromArticles = authorAgg.get(slug);
    const sectionSlugs = [
      ...(Array.isArray(fromDraftOrCanonical.section_slugs) ? fromDraftOrCanonical.section_slugs : []),
      ...(fromArticles ? [...fromArticles.section_slugs] : []),
    ];
    const normalizedSectionSlugs = [...new Set(sectionSlugs)].filter(Boolean).sort();
    return {
      slug,
      name: fromDraftOrCanonical.name || fromArticles?.name || slug,
      url: `/autores/${slug}/`,
      article_count: fromArticles?.article_count || 0,
      section_count: normalizedSectionSlugs.length,
      section_slugs: normalizedSectionSlugs,
    };
  })
  .sort((a, b) => {
    if (a.article_count !== b.article_count) return b.article_count - a.article_count;
    return a.slug.localeCompare(b.slug);
  });

const sectionAgg = new Map();
for (const article of mergedArticles) {
  if (!sectionAgg.has(article.section_slug)) {
    sectionAgg.set(article.section_slug, {
      slug: article.section_slug,
      name: article.section_name || titleCaseSection(article.section_slug),
      article_count: 0,
      latest_date: article.date,
    });
  }
  const agg = sectionAgg.get(article.section_slug);
  agg.article_count += 1;
  if (article.date > agg.latest_date) agg.latest_date = article.date;
}

for (const section of canonicalSections) {
  if (!sectionAgg.has(section.slug)) {
    sectionAgg.set(section.slug, { ...section });
  }
}

const mergedSections = [...sectionAgg.values()].sort((a, b) => (a.slug < b.slug ? -1 : 1));

writeJson(canonicalArticlesPath, mergedArticles);
writeJson(canonicalAuthorsPath, mergedAuthors);
writeJson(canonicalSectionsPath, mergedSections);

console.log(`Published draft content into ${contentRoot}`);
console.log(`Articles: ${mergedArticles.length}`);
console.log(`Authors: ${mergedAuthors.length}`);
console.log(`Sections: ${mergedSections.length}`);
if (strictPublishedContent) {
  console.log("Strict published-content validation: enabled");
}

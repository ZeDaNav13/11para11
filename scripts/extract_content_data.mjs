#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const inputRoot = process.argv[2] || "site-clean";
const outputRoot = process.argv[3] || "content";

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

function writeJson(p, data) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

function stripTags(html) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeEntities(text) {
  return (text || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function slugify(input) {
  return (input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function titleCaseSection(slug) {
  return slug
    .split("-")
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : ""))
    .join(" ");
}

function parseTsv(tsv) {
  const lines = tsv.trim().split("\n");
  lines.shift();
  return lines
    .map((line) => line.split("\t"))
    .filter((parts) => parts.length >= 7)
    .map(([date, section, slug, url, title, description, cover]) => ({
      date,
      section,
      slug,
      url,
      title: decodeEntities(title || slug),
      description: decodeEntities(description || ""),
      cover: cover || "/assets/you.png",
    }))
    .filter((entry) => entry.section !== "app");
}

function extractArticleDetails(html, fallbackTitle) {
  const articleBlock = html.match(/<article>([\s\S]*?)<\/article>/i)?.[1] || "";
  const h1 = articleBlock.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || fallbackTitle;
  const h3 = articleBlock.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1] || "";
  const author = decodeEntities(stripTags(h3)).replace(/^Por\s+/i, "").trim() || "11PARA11";

  let body =
    articleBlock.match(
      /<div class="content">([\s\S]*?)<\/div>\s*<div class="add_this_small_container">/i,
    )?.[1] ||
    articleBlock.match(/<div class="content">([\s\S]*?)<\/div>/i)?.[1] ||
    "";

  if (!body.trim()) {
    body = `<p>${fallbackTitle}</p>`;
  }

  return {
    title: decodeEntities(stripTags(h1)),
    author_name: author,
    author_slug: slugify(author),
    body_html: body,
  };
}

const tsvPath = path.join(inputRoot, "data/articles.tsv");
const tsv = readFileSafe(tsvPath);
if (!tsv) {
  console.error(`Missing data source: ${tsvPath}`);
  process.exit(1);
}

const baseArticles = parseTsv(tsv);
const articles = baseArticles
  .map((entry) => {
    const srcPath = path.join(inputRoot, entry.url);
    const html = readFileSafe(srcPath);
    const details = extractArticleDetails(html, entry.title);
    const coverPath = entry.cover.split("?")[0];
    const finalCover =
      coverPath && fs.existsSync(path.join(inputRoot, coverPath)) ? entry.cover : "/assets/you.png";

    return {
      id: `${entry.section}/${entry.slug}`,
      date: entry.date,
      section_slug: entry.section,
      section_name: titleCaseSection(entry.section),
      slug: entry.slug,
      url: entry.url,
      title: details.title || entry.title,
      description: entry.description || "",
      cover: finalCover,
      author_name: details.author_name,
      author_slug: details.author_slug || "11para11",
      author_url: `/autores/${details.author_slug || "11para11"}/`,
      body_html: details.body_html,
    };
  })
  .sort((a, b) => (a.date < b.date ? 1 : -1));

const sectionMap = new Map();
for (const article of articles) {
  const key = article.section_slug;
  if (!sectionMap.has(key)) {
    sectionMap.set(key, {
      slug: key,
      name: article.section_name,
      article_count: 0,
      latest_date: article.date,
    });
  }
  const s = sectionMap.get(key);
  s.article_count += 1;
  if (article.date > s.latest_date) {
    s.latest_date = article.date;
  }
}
const sections = [...sectionMap.values()].sort((a, b) => (a.slug < b.slug ? -1 : 1));

const authorMap = new Map();
for (const article of articles) {
  const key = article.author_slug || "11para11";
  if (!authorMap.has(key)) {
    authorMap.set(key, {
      slug: key,
      name: article.author_name || "11PARA11",
      article_count: 0,
      section_slugs: new Set(),
    });
  }
  const a = authorMap.get(key);
  a.article_count += 1;
  a.section_slugs.add(article.section_slug);
}
const authors = [...authorMap.values()]
  .map((a) => ({
    slug: a.slug,
    name: a.name,
    url: `/autores/${a.slug}/`,
    article_count: a.article_count,
    section_count: a.section_slugs.size,
    section_slugs: [...a.section_slugs].sort(),
  }))
  .sort((a, b) => (a.article_count < b.article_count ? 1 : -1));

writeJson(path.join(outputRoot, "articles.json"), articles);
writeJson(path.join(outputRoot, "sections.json"), sections);
writeJson(path.join(outputRoot, "authors.json"), authors);

console.log(`Wrote content data to: ${outputRoot}`);
console.log(`Articles: ${articles.length}`);
console.log(`Sections: ${sections.length}`);
console.log(`Authors: ${authors.length}`);

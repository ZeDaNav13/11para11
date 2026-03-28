#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const contentPath = process.argv[2] || "content/articles.json";
const staticRoot = process.argv[3] || "static";

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

function decodeSrc(src) {
  return (src || "").replace(/&amp;/g, "&").trim();
}

function stripQueryHash(src) {
  return src.split("#")[0].split("?")[0];
}

function extnameFromSrc(src) {
  return path.extname(stripQueryHash(src)).toLowerCase();
}

function isRejectedByName(src) {
  const lower = src.toLowerCase();
  return /(logo|escudo|badge|icon|chart|graph|table|lineup|formation|tatic|stats?|content_t\d|content_or|content_rz|fb\.png|facebook|twitter|rss_small|11_logo)/.test(
    lower,
  );
}

function looksGraphicByName(src) {
  const lower = src.toLowerCase();
  return /(content_t\d|_t\d|legend|tabela|field|lineup|formation|calend|calculadora|stats?|graph|chart|thumbs_web_sapo|content_\d+\.png)/.test(
    lower,
  );
}

function sourceExists(src) {
  const clean = stripQueryHash(src);
  if (!clean.startsWith("/")) return false;
  const full = path.join(staticRoot, clean);
  return fs.existsSync(full);
}

function extractImageSources(bodyHtml) {
  const html = bodyHtml || "";
  const out = [];
  const re = /<img[^>]*src\s*=\s*"([^"]+)"/gi;
  let m = re.exec(html);
  while (m) {
    out.push(decodeSrc(m[1]));
    m = re.exec(html);
  }
  return out;
}

function isPhotoLike(src) {
  const ext = extnameFromSrc(src);
  if (ext === ".jpg" || ext === ".jpeg" || ext === ".webp") return true;
  if (ext !== ".png") return false;
  if (looksGraphicByName(src)) return false;
  const lower = src.toLowerCase();
  if (/(_photo|foto|portrait|stadium|match|player|coach|crowd)/.test(lower)) return true;
  // Many legacy inline photos are PNGs without descriptive names.
  return true;
}

function isGraphicLikeCover(src) {
  const ext = extnameFromSrc(src);
  if (ext === ".gif") return true;
  if (ext === ".png") return true;
  return isRejectedByName(src) || looksGraphicByName(src);
}

function pickCoverFromBody(bodyHtml, currentCover = "") {
  const imgs = extractImageSources(bodyHtml).filter(Boolean);
  const eligible = imgs.filter((src) => {
    if (src.includes("/assets/you.png")) return false;
    if (!sourceExists(src)) return false;
    return !isRejectedByName(src);
  });
  if (!eligible.length) return "";

  const photoLike = eligible.filter(isPhotoLike);
  if (isGraphicLikeCover(currentCover)) {
    return photoLike[0] || "";
  }
  return photoLike[0] || eligible[0] || "";
}

const articles = readJson(contentPath);
let changed = 0;

for (const article of articles) {
  const picked = pickCoverFromBody(article.body_html || "", article.cover || "");
  if (!picked) continue;
  if (article.cover !== picked) {
    article.cover = picked;
    changed += 1;
  }
}

writeJson(contentPath, articles);
console.log(`Updated covers: ${changed}/${articles.length}`);

#!/usr/bin/env node
/**
 * Prerender SPA routes for Firebase Hosting.
 *
 * Instead of relying on puppeteer (slow, flaky), this script:
 * 1. Reads the built dist/index.html as a template
 * 2. For each festival, reads its JSON data directly from public/data/festivals/
 * 3. Injects festival-specific meta tags into the <head>
 * 4. Writes the result to dist/festival/{id}/index.html
 *
 * Firebase Hosting rewrite (** → /index.html) SPA 동작은 유지하면서,
 * 크롤러/소셜 미리보기에서는 페스티벌별 고유 OG 태그가 노출됩니다.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "..", "dist");
const PUBLIC = join(__dirname, "..", "public");
const BASE_URL = "https://festrecipe.com";

// ── Read festival data ───────────────────────────────────────────────
const festivalIds = JSON.parse(
  readFileSync(join(PUBLIC, "data", "festivals", "index.json"), "utf-8")
).festivals;

const festivals = festivalIds.map((id) => ({
  id,
  ...JSON.parse(readFileSync(join(PUBLIC, "data", "festivals", `${id}.json`), "utf-8")),
}));

// ── Helpers ──────────────────────────────────────────────────────────
function getArtistCount(f) {
  if (f.lineupStage === "stage1_all") return f.allArtists?.length || 0;
  if (f.lineupStage === "stage3_timetable") {
    return f.lineup?.reduce((acc, day) => acc + (day.slots?.length || 0), 0) || 0;
  }
  return f.lineup?.reduce((acc, day) => acc + (day.artists?.length || 0), 0) || 0;
}

const LD_CONTEXT = "https://schema.org";

function buildMusicEventLd(f, artistCount) {
  return JSON.stringify({
    "@context": LD_CONTEXT,
    "@type": "MusicEvent",
    name: f.name,
    description: f.description,
    startDate: f.startDate,
    endDate: f.endDate,
    location: { "@type": "Place", name: f.location },
    url: `${BASE_URL}/festival/${f.id}`,
    inLanguage: "ko",
    organizer: {
      "@type": "Organization",
      name: "FestRecipe",
      url: BASE_URL,
    },
  });
}

function buildBreadcrumbLd(f) {
  return JSON.stringify({
    "@context": LD_CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "FestRecipe", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "페스티벌", item: BASE_URL + "/" },
      { "@type": "ListItem", position: 3, name: f.name, item: `${BASE_URL}/festival/${f.id}` },
    ],
  });
}

const BASE_OG = {
  image: BASE_URL + "/og-default.jpg",
  imageWidth: "1200",
  imageHeight: "630",
  locale: "ko_KR",
  type: "website",
  siteName: "FestRecipe",
};

// ── Template: prerendered <head> block per route ─────────────────────
function buildMetaHtml(festival = null) {
  if (!festival) {
    // 홈페이지
    const title = "FestRecipe \u2014 AI\uAC00 \uB9D0\uC544\uC8FC\uB294 \uD398\uC2A4\uD2F0\uBC8C \uC5D0\uC2DC\uD2B8\uB9AC\uC2A4\uD2B8";
    const desc = "\uD398\uC2A4\uD2F0\uBC8C \uC804\uB0A0 \uBC24, AI\uAC00 \uC608\uC0C1\uD55C \uC5D0\uC2DC\uD2B8\uB9AC\uC2A4\uD2B8\uB97C \uC720\uD29C\uBE0C\uB85C \uBC14\uB85C \uB4E4\uC5B4\uBCF4\uC138\uC694.";
    return {
      title,
      desc,
      url: BASE_URL + "/",
      type: "website",
      ldScript: JSON.stringify({
        "@context": LD_CONTEXT,
        "@type": "WebSite",
        name: "FestRecipe",
        url: BASE_URL,
        description: desc,
        inLanguage: "ko",
        publisher: { "@type": "Organization", name: "FestRecipe" },
      }),
    };
  }

  const artistCount = getArtistCount(festival);
  const title = `${festival.name} \u2014 \uC608\uC0C1 \uC5D0\uC2DC\uD2B8\uB9AC\uC2A4\uD2B8 | FestRecipe`;
  const desc = `${festival.name}(${festival.startDate} ~ ${festival.endDate}, ${festival.location}) ${artistCount}\uAC1C \uD300 \uCD9C\uC5F0. \uC544\uD2F0\uC2A4\uD2B8\uBCC4 AI \uC608\uC0C1 \uC5D0\uC2DC\uD2B8\uB9AC\uC2A4\uD2B8\uB97C \uC720\uD29C\uBE0C\uB85C \uBC14\uB85C \uB4E4\uC5B4\uBCF4\uC138\uC694.`;
  const url = `${BASE_URL}/festival/${festival.id}`;

  return {
    title,
    desc,
    url,
    type: "website",
    ldScripts: [
      buildMusicEventLd(festival, artistCount),
      buildBreadcrumbLd(festival),
    ],
  };
}

function renderHead(meta) {
  const lines = [
    `<title>${meta.title}</title>`,
    `<meta name="description" content="${meta.desc}" />`,
    `<meta property="og:type" content="${meta.type}" />`,
    `<meta property="og:url" content="${meta.url}" />`,
    `<meta property="og:title" content="${meta.title}" />`,
    `<meta property="og:description" content="${meta.desc}" />`,
    `<meta property="og:image" content="${BASE_OG.image}" />`,
    `<meta property="og:image:width" content="${BASE_OG.imageWidth}" />`,
    `<meta property="og:image:height" content="${BASE_OG.imageHeight}" />`,
    `<meta property="og:locale" content="${BASE_OG.locale}" />`,
    `<meta property="twitter:card" content="summary_large_image" />`,
    `<meta property="twitter:url" content="${meta.url}" />`,
    `<meta property="twitter:title" content="${meta.title}" />`,
    `<meta property="twitter:description" content="${meta.desc}" />`,
    `<meta property="twitter:image" content="${BASE_OG.image}" />`,
    `<link rel="canonical" href="${meta.url}" />`,
  ];

  const ld = meta.ldScripts || (meta.ldScript ? [meta.ldScript] : []);
  for (const json of ld) {
    lines.push(`<script type="application/ld+json">${json}</script>`);
  }

  return lines.join("\n    ");
}

// ── Build HTML for each route ────────────────────────────────────────
function buildHtml(meta) {
  // Read the built index.html as a base
  const template = readFileSync(join(DIST, "index.html"), "utf-8");

  // Replace everything between <head> and </head> with our meta + original meta
  const headContent = renderHead(meta);

  // Keep the original <meta charset>, <link rel="icon">, <meta viewport> from template
  const originalHeadMatch = template.match(/<head>[\s\S]*?<\/head>/);
  const originalMeta = originalHeadMatch
    ? originalHeadMatch[0].replace(/<title>.*?<\/title>/s, "").replace(/<meta\s+(name|property)="(description|title|og:|twitter:)[^>]*\/?>/gi, "").replace(/<link\s+rel="(canonical|og:)[^>]*\/?>/gi, "").replace(/<script\s+type="application\/ld\+json">.*?<\/script>/gi, "").replace(/<head>|<\/head>/g, "").trim()
    : "";

  const newHead = `<head>\n    <meta charset="UTF-8" />\n    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    ${headContent}\n  </head>`;

  return template.replace(/<head>[\s\S]*?<\/head>/, newHead);
}

// ── Main ─────────────────────────────────────────────────────────────
console.log(`[prerender] ${festivals.length} festivals found`);

// Home
const homeMeta = buildMetaHtml(null);
const homeHtml = buildHtml(homeMeta);
const homePath = join(DIST, "index.html");
writeFileSync(homePath, homeHtml);
console.log(`  → ${homePath}`);

// Each festival
for (const f of festivals) {
  const meta = buildMetaHtml(f);
  const html = buildHtml(meta);
  const outPath = join(DIST, "festival", f.id, "index.html");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html);
  console.log(`  → ${outPath}`);
}

console.log(`[prerender] Done. ${festivals.length + 1} routes prerendered.`);

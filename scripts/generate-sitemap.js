#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");

const BASE_URL = "https://festrecipe.com";

// festivals/index.json에서 페스티벌 ID 목록 읽기
const { festivals: festivalIds } = JSON.parse(
  readFileSync(join(PROJECT_ROOT, "public", "data", "festivals", "index.json"), "utf-8")
);

const urls = [
  { loc: BASE_URL + "/", changefreq: "weekly", priority: "1.0" },
  { loc: BASE_URL + "/festivals", changefreq: "weekly", priority: "0.9" },
  ...festivalIds.map((id) => ({
    loc: BASE_URL + `/festival/${id}`,
    changefreq: "monthly",
    priority: "0.8",
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

writeFileSync(join(PROJECT_ROOT, "public", "sitemap.xml"), xml);
console.log(`[sitemap] Generated ${urls.length} URLs → public/sitemap.xml`);

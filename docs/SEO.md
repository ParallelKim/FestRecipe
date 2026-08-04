# SEO

SPA에서도 검색·소셜 미리보기에 올바른 메타가 나가게 한다.  
카피 톤은 [`TONE_AND_MANNER.md`](./TONE_AND_MANNER.md).

## 구성

| 역할 | 위치 |
|------|------|
| 클라이언트 meta | `react-helmet-async` — `HomeHelmet`, `FestivalHelmet` |
| 사이트맵 | `scripts/generate-sitemap.js` ← `festivals/index.json` |
| 크롤러용 HTML | `scripts/prerender.js` — 빌드 후 페스티벌별 `dist/festival/{id}/index.html`에 OG 인라인 |
| 호스팅 | Firebase Hosting, SPA rewrite + 정적 prerender 경로 |

빌드: `sitemap` → `tsc` → `vite build` → `prerender` (`npm run build`).

## 규칙

- 홈: WebSite 스키마. 페스티벌: MusicEvent + BreadcrumbList.
- OG 이미지는 포스터가 있으면 페스티벌 자산, 없으면 `og-default.jpg`.
- canonical·BASE_URL은 배포 도메인과 맞춘다 (`festrecipe.com` / 현재 호스팅 URL).
- 페스티벌 추가·삭제 후 **빌드하면 sitemap·prerender가 따라간다.** 수동 `sitemap.xml` 편집 금지.

## artistCount

타임테이블 단계는 `slots` 기준으로 센다. 구현은 Helmet/prerender와 동일 로직을 유지한다.

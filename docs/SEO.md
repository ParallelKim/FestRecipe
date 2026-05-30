# FestRecipe SEO 작업 문서

## 개요

FestRecipe의 SEO 작업을 진행하였다. SPA의 한계를 극복하고 검색 엔진 및 소셜 미디어 미리보기에서 올바른 메타 정보가 노출되도록 구현하였다.

## 기술 스택

- react-helmet-async: 클라이언트 사이드 동적 meta 태그 관리
- 커스텀 prerender 스크립트: 빌드 시 페스티벌별 정적 HTML 생성 (puppeteer 미사용)
- Firebase Hosting: SPA rewrite 설정

## 파일 구조

```
src/
├── App.tsx                          # HelmetProvider 래퍼 추가
├── components/seo/
│   ├── HomeHelmet.tsx               # 홈페이지용 OG 태그 + Schema WebSite
│   └── FestivalHelmet.tsx           # 페스티벌별 OG 태그 + Schema MusicEvent + BreadcrumbList
├── pages/
│   ├── Home.tsx                     # HomeHelmet 삽입
│   └── FestivalDetail.tsx           # FestivalHelmet 삽입, artistCount 계산 수정
scripts/
├── generate-sitemap.js              # festivals/index.json 기반 sitemap.xml 자동 생성
└── prerender.js                     # 페스티벌별 OG 태그 인라인 삽입
public/
├── og-default.jpg                   # 기본 OG 이미지 (페스티벌 포스터 확보 시 교체)
├── robots.txt                       # 크롤러 접근 설정
└── sitemap.xml                      # 자동 생성 (build 시)
firebase.json                       # hosting: public=dist, SPA rewrite
```

## 빌드 파이프라인

```
node scripts/generate-sitemap.js  ← festival 목록 읽어서 sitemap.xml 생성
  → tsc -b                         ← TypeScript 컴파일
    → vite build                   ← 프로덕션 빌드
      → node scripts/prerender.js  ← 페스티벌별 정적 HTML 생성
```

## 환경 변수 / 설정

- BASE_URL: `https://festrecipe.com` (커스텀 도메인 연결 시 해당 값 변경 필요)
- 변경 파일: `src/components/seo/HomeHelmet.tsx`, `src/components/seo/FestivalHelmet.tsx`, `scripts/prerender.js`

## OG 태그 현황

| 페이지 | og:title | og:description | Schema |
|--------|----------|---------------|--------|
| 홈 | FestRecipe — AI가 말아주는 페스티벌 셋리스트 | 페스티벌 수 포함 동적 | WebSite |
| 페스티벌 | {페스티벌명} — 예상 셋리스트 \| FestRecipe | 날짜/장소/아티스트 수 포함 | MusicEvent + BreadcrumbList |

## artistCount 계산 로직

`stage3_timetable`의 경우 `artists` 필드가 비어있고 `slots`에 아티스트 정보가 있으므로:

```js
function getArtistCount(f) {
  if (f.lineupStage === "stage1_all") return f.allArtists?.length || 0;
  if (f.lineupStage === "stage3_timetable") {
    return f.lineup?.reduce((acc, day) => acc + (day.slots?.length || 0), 0) || 0;
  }
  return f.lineup?.reduce((acc, day) => acc + (day.artists?.length || 0), 0) || 0;
}
```

## prerender 동작 방식

puppeteer를 사용하지 않고, 빌드된 `dist/index.html` 템플릿에 페스티벌 데이터를 직접 읽어서 OG 태그를 인라인 삽입한다.

- `dist/index.html` — 홈페이지 (기본 OG)
- `dist/festival/{id}/index.html` — 각 페스티벌별 고유 OG

Firebase Hosting rewrite 설정으로 SPA 동작은 유지하면서, 크롤러/소셜 미리보기에서는 페스티벌별 고유 OG가 노출된다.

## 배포

```bash
npm run build    # sitemap → tsc → vite build → prerender
firebase deploy --only hosting
```

현재 배포 URL: `https://festreci.web.app`

## 체크리스트

- [x] OG 태그 (홈/페스티벌별)
- [x] Twitter Card
- [x] Schema Markup (WebSite, MusicEvent, BreadcrumbList)
- [x] sitemap.xml (자동 생성)
- [x] robots.txt
- [x] prerender (페스티벌별 정적 HTML)
- [x] canonical URL
- [ ] 네이버 서치 어드바이저 등록
- [ ] 구글 서치 콘솔 등록
- [ ] 페스티벌별 OG 이미지 (포스터 확보 후)

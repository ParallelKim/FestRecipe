# FestRecipe

페스티벌 **타임테이블**을 보고, 라인업 아티스트 **대표곡을 YouTube로 미리 듣고**, **내 라인업·배경화면**으로 현장 준비를 하는 웹 앱.

제품 원칙: [`docs/PRODUCT.md`](./docs/PRODUCT.md)  
카피: [`docs/TONE_AND_MANNER.md`](./docs/TONE_AND_MANNER.md)  
아티스트 표기: [`docs/ARTIST_DISPLAY_NAMES.md`](./docs/ARTIST_DISPLAY_NAMES.md)  
수집 파이프라인: [`collector/README.md`](./collector/README.md)

## 스택

- React 19 + TypeScript + Vite
- Tailwind v4 + shadcn/ui
- React Router, Firebase Hosting

## 구조

```
src/
  pages/           # Home, FestivalMobile
  mobile/ui/       # 타임테이블·시트·배경화면
  components/ui/   # shadcn
  components/layout/
  index.css        # 디자인 토큰
public/data/       # festivals, artists, playlists
collector/         # YTM 발매곡·플레이리스트 빌드
```

## 실행

```bash
npm run dev
npm run build    # sitemap → tsc → vite → prerender
npm run knip     # 미사용 export 검사
```

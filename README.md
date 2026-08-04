# FestRecipe

페스티벌 **타임테이블**을 보고, 라인업 아티스트 **대표곡을 YouTube로 미리 듣고**, **내 라인업·배경화면**으로 현장 준비를 하는 웹 앱.

- 제품: [`docs/PRODUCT.md`](./docs/PRODUCT.md)
- 카피: [`docs/TONE_AND_MANNER.md`](./docs/TONE_AND_MANNER.md)
- 아티스트 표기: [`docs/ARTIST_DISPLAY_NAMES.md`](./docs/ARTIST_DISPLAY_NAMES.md)
- 데이터 수집: [`collector/README.md`](./collector/README.md)
- SEO: [`docs/SEO.md`](./docs/SEO.md)

## 실행

```bash
npm run dev
npm run build
```

페스티벌·아티스트·플레이리스트 JSON은 `public/data/`다. 수집 파이프라인은 `collector/`다.

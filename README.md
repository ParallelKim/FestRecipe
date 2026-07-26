# FestRecipe 🎸
> 페스티벌 타임테이블 + 아티스트 발매곡(YouTube Music) 기반 감상 서비스

FestRecipe는 인디/대중음악 페스티벌의 타임테이블을 시각화하고, 라인업 아티스트의 **발매곡 정보(YouTube Music)** 를 모아 바로 들을 수 있게 돕는 웹 애플리케이션입니다.

> **MVP 범위:** `페스티벌 정보 → 아티스트 리스트업 → YouTube Music 발매곡 수집`  
> 예상 셋리스트/풀캠 타임스탬프/지능형 재생목록은 **향후 고도화**로 미룹니다. 상세는 [`collector/README.md`](./collector/README.md).

---

## 주요 기능 🌟

1. **페스티벌 라인업 공개 단계별 대응**
   - **1단계 (전체 라인업):** 요일 구분이 없는 전체 아티스트 리스트업
   - **2단계 (일별 라인업):** 일자별 아티스트 분할 표기
   - **3단계 (타임테이블):** 시간/스테이지별 세로형 타임라인 뷰 제공 (화면 너비에 맞춰 유연하게 반응하며 잘림 방지 처리)

2. **아티스트 발매곡 (YouTube Music)**
   - YouTube Data API v3 `search` 로 Topic 채널·Music 카테고리 기반 발매곡 수집
   - 곡별 YouTube / YouTube Music 링크 제공

3. **(향후) 예상 셋리스트 & 라이브 아카이브**
   - 과거 공연 데이터 기반 셋리스트, 풀캠 타임스탬프, watch_videos 재생목록 등은 고도화 단계에서 연결

---

## 기술 스택 🛠️

- **Core:** React (TypeScript) + Vite
- **Styling:** Vanilla CSS (CSS Variables 기반 테마 및 모던 인터랙션 설계)
- **Routing:** React Router DOM
- **Build & Lint:** ESLint, TypeScript Compiler (`tsc`)

---

## 디렉토리 구조 📂

```
src/
├── components/          # 공통 UI 컴포넌트 (타임테이블 그리드 등)
├── pages/               # 주요 페이지 (페스티벌 목록, 상세 정보)
├── services/            # 페스티벌/아티스트 데이터 로더
├── types/               # 공통 TypeScript 타입 정의
├── index.css            # 글로벌 디자인 시스템 및 CSS 변수 테마
└── main.tsx

collector/               # MVP 데이터 파이프라인 (페스티벌→아티스트→발매곡)
public/data/
├── artists.json
└── festivals/           # 페스티벌별 JSON + index.json
```

---

## 실행 및 빌드 방법 🚀

### 개발 서버 실행
```bash
npm run dev
```

### 프로덕션 빌드
```bash
npm run build
```
빌드가 완료되면 `/dist` 폴더에 프로덕션용 정적 파일들이 생성됩니다.

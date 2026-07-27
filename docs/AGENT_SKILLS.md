# Agent Skills (FestRecipe)

Cursor는 `.agents/skills/`(및 `.cursor/skills/`)의 `SKILL.md`를 자동으로 로드합니다.

## 설치·검색

```bash
npx skills find <키워드>          # skills.sh 마켓플레이스 검색
npx skills add <owner/repo@skill> -y -p   # 이 프로젝트에 설치
npx skills ls                     # 설치 목록
npx skills update -p              # 프로젝트 스킬 업데이트
```

잠금 파일: `skills-lock.json` — CI/동료 환경에서 `npx skills experimental_install`로 복원 가능.

## 현재 프로젝트에 설치된 스킬

| 스킬 | 출처 | FestRecipe에서 쓰는 경우 |
|------|------|---------------------------|
| **find-skills** | vercel-labs/skills | 다른 스킬 검색·설치 안내 |
| **festrecipe-ui** | (로컬) | 타임테이블·플레이리스트 시트·DESIGN.md |
| **web-design-guidelines** | vercel-labs/agent-skills | UI/접근성/UX 감사, 베스트 프랙티스 점검 |
| **frontend-design** | anthropics/skills | 새 UI·비주얼 방향 (DESIGN.md와 충돌 시 DESIGN.md 우선) |
| **vercel-react-best-practices** | vercel-labs/agent-skills | React 컴포넌트·성능 리팩터 |
| **vercel-composition-patterns** | vercel-labs/agent-skills | props 폭발·컴포넌트 API 설계 |

채팅에서 `/스킬이름`으로 수동 호출하거나, 에이전트가 description에 맞으면 자동 적용합니다.

## 이 저장소에 아직 없는 후보 (필요 시 설치)

| 스킬 | 설치 수(대략) | 용도 |
|------|----------------|------|
| `coreyhaines31/marketingskills@seo-audit` | 172K | `docs/SEO.md`·메타·사이트맵 점검 |
| `currents-dev/playwright-best-practices-skill@playwright-best-practices` | 65K | E2E 도입 시 |
| `absolutelyskilled/absolutelyskilled@vite-plus` | 199K | Vite 빌드·설정 심화 |

설치 예:

```bash
npx skills add coreyhaines31/marketingskills@seo-audit -y -p
```

## 커스텀 스킬 추가

```bash
npx skills init my-skill-name   # .agents/skills/<name>/SKILL.md 생성
```

페스티벌 도메인 전용 워크플로는 `festrecipe-ui`를 확장하거나 `docs/AGENT_SKILLS.md`에 항목을 추가하세요.

## 프론트 점검·shadcn

- 점검 결과 및 shadcn 도입 순서: **`docs/FRONTEND_AUDIT.md`**
- UI 감사 시: `/web-design-guidelines` + `/festrecipe-ui`

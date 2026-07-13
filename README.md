# omp 다중 PC 자동 설정

다른 로컬 PC(macOS/Windows)에 동일한 omp 환경을 재현하는 부트스트랩 스크립트.

## 구성

```
omp/
  setup.sh / setup.ps1     OS별 부트스트랩 (얇음)
  config/settings.conf     공유 소스: omp config set 키/값 (모델 역할·폴백·approval·advisor)
  rules/AGENTS.md          글로벌 룰 (기본 룰 + OKF/도구 정책)
  okf/                     OKF 지식 번들 (상세 룰·도메인 지식·도구 정책·축적 지식의 소스)
  scripts/validate-okf.ts  공유 OKF frontmatter/type 검증기
  extensions/              런타임 확장(예: dangerous-tool-guard)
  agents/                  (선택) 에이전트 override/custom — 기본은 빌트인, 현재 override 없음
```

## 사용

전제: 대상 PC에 omp와 Bun이 설치되어 있고 PATH에 있음. 모델 인증(Anthropic/OpenAI Codex 등)은 OAuth/환경 변수로 별도 설정 — 이 스크립트 범위 밖.

```
# macOS / Linux
sh setup.sh

# Windows (PowerShell)
.\setup.ps1
```

## 배포 순서 (스크립트가 수행)
1. 롤별 모델·도구 설정 — `config/settings.conf`를 `omp config set`으로 적용.
2. 글로벌 룰 — `rules/AGENTS.md` → `<configdir>/AGENTS.md` (기존은 최초 1회 .bak 백업).
3. OKF 번들 — `scripts/validate-okf.ts`로 소스 concept의 YAML frontmatter와 non-empty `type`을 검증한 뒤 `okf/` → `<configdir>/okf/`로 클린 재배포. `AGENTS.md`에는 배포본 경로와 이 레포의 소스 `okf/` 경로를 함께 주입한다.
4. 확장 — `extensions/*.{js,ts}` → `<configdir>/extensions/` (OMP native extension auto-discovery 대상).
5. 에이전트 override/custom(있을 때만) — `agents/*.md` → `<configdir>/agents/`. 없으면 빌트인을 쓰고, 이전에 이 레포가 관리하던 `reviewer`/`plan` override는 제거한다.

`<configdir>`는 `omp config path`로 해석한다(OS 공통 `~/.omp/agent`, `PI_CODING_AGENT_DIR`로 재지정 가능).

영속 학습은 이 레포의 소스 `okf/`에 누적한 뒤 setup 재실행으로 배포한다. `<configdir>/okf/`는 배포본이므로 직접 수정해도 다음 클린 재배포 때 사라진다.
이 레포 디렉터리가 영속 학습 원장이다. 레포를 삭제하면 배포본 OKF 읽기는 계속 가능하지만, 새 학습은 메모리에만 남고 소스 OKF 승격은 별도 설정 정비가 필요하다.

## 도구 정책
코딩 워크플로의 MCP(웹 검색·시맨틱 코드 분석·라이브러리 문서)는 omp 기본 도구(`web_search`/`lsp`+`ast_grep`/`librarian`+`read`)로 대체한다. MCP는 기본 기능으로 안 되는 외부 연동에만. 상세: `okf/tools/`.

## 안전한 테스트 (실제 설정 미변경)
`PI_CODING_AGENT_DIR`을 임시 디렉토리로 지정해 그곳에 배포된다.
`PI_CODING_AGENT_DIR`은 이 레포 루트와 달라야 한다. setup은 소스 OKF 삭제를 막기 위해 레포 루트를 config dir로 쓰면 중단한다.
```
# macOS / Linux
PI_CODING_AGENT_DIR=/tmp/omp-test sh setup.sh
# Windows
$env:PI_CODING_AGENT_DIR="$env:TEMP\omp-test"; .\setup.ps1
```

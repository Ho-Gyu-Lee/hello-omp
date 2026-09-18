# omp 다중 PC 자동 설정

다른 로컬 PC(macOS/Windows)에 동일한 omp 환경을 재현하는 부트스트랩 스크립트.

## 구성

```
omp/
  setup.sh / setup.ps1     OS별 부트스트랩 (얇음)
  config/settings.conf                     공유 기본 소스: 선택한 OpenAI/Anthropic 모델·fallback·advisor
  config/settings.anthropic-pro.conf       선택형 Opus 전용 프로필: Fable을 제외하고 Opus 5로 통일
  rules/AGENTS.md          글로벌 룰 (기본 룰 + OKF/도구 정책)
  rules/WATCHDOG.md        advisor 전용 지침 (한국어 노트, 코드·설정 키는 원문 유지)
  okf/                     OKF 지식 번들 (상세 룰·도메인 지식·도구 정책·축적 지식의 소스)
  scripts/validate-okf.ts  공유 OKF frontmatter/type 검증기
  extensions/              런타임 확장(예: dangerous-tool-guard)
  agents/                  (선택) 에이전트 override/custom — 기본은 빌트인, 현재 override 없음
```

## 사용

전제: 대상 PC에 omp와 Bun이 설치되어 있고 PATH에 있어야 한다. 선택된 역할과 교차-provider fallback을 사용하려면 해당 provider의 유효 인증이 필요하며, 기본 프로필 전체를 의도대로 사용하려면 OpenAI Codex와 Anthropic을 모두 인증한다. 모델 인증은 OAuth/환경 변수로 별도 설정하며 이 스크립트 범위 밖이다.

기본 규칙은 상급 모델을 우선 사용한다. OpenAI 주 역할 `default`·`task`는 GPT-6 Astra xhigh를 사용한다. 경량 `smol`·`commit`은 GPT-5.6 Terra, `tiny`는 GPT-5.6 Luna low를 사용한다. Anthropic 심층·advisor 역할은 Claude Opus 5, vision은 Claude Fable 5.1이다. 교차-provider fallback은 Codex 역할 → Opus 5, `slow`·`plan`·`vision` → Astra, `advisor` → Terra다. `extendedContext=true`를 유지한다. 모델 선택에 폐기된 컨텍스트 제한을 근거로 적용하지 않으며, 실제 컨텍스트와 가용성은 사용 중인 provider·모델 카탈로그·설정으로 확인한다.

`modelRoles`는 에이전트 등록이나 자동 실행 설정이 아니다. 공유 프로필의 `designer`는 GPT-6 Astra xhigh에 배정한 사용자 정의 모델 별칭이며, 설치본에 같은 이름의 빌트인 에이전트는 없다. UI/UX 구현은 기본 `task`에 위임하고, `@designer`는 명시적 모델 선택이나 이를 참조하는 커스텀 에이전트에서 사용한다. 가용 에이전트와 역할의 구분은 [에이전트 가이드](okf/agents/guide.md)를 따른다.

비동기 advisor는 작업 중 위험 감시를 위해 기본 활성(`advisor.enabled=true`)이다. 보안·영속 데이터·서버 권위·동시성 정합성에 영향을 주는 위험 변경은 구현 전에 설계·불변조건·영향 범위·복구 가능성을 독립 검토한다. 완료 전 독립 검토도 별도로 유지하며 `reviewer`·`security-reviewer`의 결과와 이미 수신한 advisor 지적을 판단·반영·재검증하고 통합 최종본을 전달한다. advisor가 켜져 있다는 사실이나 `syncBacklog`를 최종 검토 완료의 증거로 삼지 않으며, 출력 정리만을 위해 감시를 끄지 않는다.

| 프로필 | 선택 | Anthropic 라우팅 |
|---|---|---|
| 기본(구독 공통) | 환경 변수 없음 또는 `HELLO_OMP_ANTHROPIC_PLAN=max` | `slow`·`plan`·`advisor`와 Codex fallback은 Opus 5, `vision`은 Fable 5.1 |
| Opus 전용(선택형) | `HELLO_OMP_ANTHROPIC_PLAN=pro` | `vision`을 포함한 모든 Anthropic 역할·fallback·advisor를 Opus 5로 통일 |

`pro`는 이 저장소의 선택형 프로필 이름이며 Pro 구독의 모델 권한을 판정하는 값이 아니다. [Anthropic 공식 안내](https://www.anthropic.com/claude/fable)는 Fable 5.1을 Pro에도 제공한다고 명시한다(확인: 2026-09-18). Pro라는 이유만으로 Opus 전용을 선택하지 않으며, 기본 프로필을 사용할 수 있다. Opus 전용은 Fable을 제외하려는 경우에만 명시적으로 선택한다. 실제 계정·연동 경로의 가용성은 별도로 확인한다.

```sh
# macOS / Linux — 기본(구독 공통)
sh setup.sh

# macOS / Linux — Opus 전용을 선택할 경우
HELLO_OMP_ANTHROPIC_PLAN=pro sh setup.sh
```

```powershell
# Windows — 기본(구독 공통)
.\setup.ps1

# Windows — Opus 전용을 선택할 경우
$env:HELLO_OMP_ANTHROPIC_PLAN = 'pro'
.\setup.ps1
```

## 배포 순서 (스크립트가 수행)
1. 롤별 모델·도구 설정 — `config/settings.conf`를 적용하고, `HELLO_OMP_ANTHROPIC_PLAN=pro`이면 `config/settings.anthropic-pro.conf`를 이어서 적용.
2. 글로벌·advisor 룰 — `rules/AGENTS.md`·`rules/WATCHDOG.md` → `<configdir>/` (각 기존 파일은 최초 1회 .bak 백업). `WATCHDOG.md`는 advisor 시스템 지침에 추가되며 노트의 설명·근거·권고를 한국어 존댓말로 지정한다. 코드·설정 키·severity 값은 원문을 유지한다.
3. OKF 번들 — `scripts/validate-okf.ts`로 소스 concept의 YAML frontmatter와 non-empty `type`을 검증한 뒤 `okf/` → `<configdir>/okf/`로 클린 재배포. `AGENTS.md`에는 배포본 경로와 이 레포의 소스 `okf/` 경로를 함께 주입한다.
4. 확장 — `extensions/*.{js,ts}` → `<configdir>/extensions/` (OMP native extension auto-discovery 대상).
5. 에이전트 override/custom(있을 때만) — `agents/*.md` → `<configdir>/agents/`. 없으면 빌트인을 쓰고, 이전에 이 레포가 관리하던 `reviewer`/`plan` override는 제거한다.

`<configdir>`는 `omp config path`로 해석한다(OS 공통 `~/.omp/agent`, `PI_CODING_AGENT_DIR`로 재지정 가능).

영속 학습은 이 레포의 소스 `okf/`에 누적한 뒤 setup 재실행으로 배포한다. `<configdir>/okf/`는 배포본이므로 직접 수정해도 다음 클린 재배포 때 사라진다.
이 레포 디렉터리가 영속 학습 원장이다. 레포를 삭제하면 배포본 OKF 읽기는 계속 가능하지만, 새 학습은 메모리에만 남고 소스 OKF 승격은 별도 설정 정비가 필요하다.
배포한 글로벌 지침과 기본 설정을 적용하려면 새 세션을 시작한다. 실행 중 세션의 advisor 상태가 영속 기본값과 같다고 가정하지 않으며, `/advisor status`로 상태를 확인하고 꺼져 있으면 `/advisor on`으로 켠다. 이 명령은 세션 상태만 바꾸며 영속 기본값은 `config/settings.conf`와 배포된 설정이 결정한다.

## 도구 정책
코딩 워크플로의 MCP(웹 검색·시맨틱 코드 분석·라이브러리 문서)는 omp 기본 도구(`web_search`, `lsp`+`ast_grep`, `read`)로 대체한다. 넓은 읽기 전용 조사는 현재 제공되는 `scout`에 위임한다. MCP는 기본 기능으로 안 되는 외부 연동에만. 상세: `okf/tools/`.

## 안전한 테스트 (실제 설정 미변경)
`PI_CODING_AGENT_DIR`을 임시 디렉토리로 지정해 그곳에 배포된다.
`PI_CODING_AGENT_DIR`은 이 레포 루트와 달라야 한다. setup은 소스 OKF 삭제를 막기 위해 레포 루트를 config dir로 쓰면 중단한다.
설치 OMP 18.2.5에서는 task-agent 사용자 탐색이 `PI_CODING_AGENT_DIR`과 다른 설정 루트를 사용한다. 따라서 이 격리 경로에 복사한 custom agent의 발견·실행까지 검증됐다고 보지 않는다. custom agent를 검증할 때는 프로젝트 `.omp/agents/` 또는 활성 기본/이름 있는 프로필의 실제 탐색 경로를 사용한다. 기본 빌트인 에이전트에는 영향이 없으며, 격리 테스트를 위해 전역 agents 경로에 복사하지 않는다. 근거: 설치본 `src/task/discovery.ts`의 `getConfigDirs("agents")`와 `omp://config-usage.md`의 Canonical roots(확인: 2026-09-18).
```
# macOS / Linux
PI_CODING_AGENT_DIR=/tmp/omp-test sh setup.sh
# Windows
$env:PI_CODING_AGENT_DIR="$env:TEMP\omp-test"; .\setup.ps1
```

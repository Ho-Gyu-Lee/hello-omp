---
type: Reference
title: 에이전트 생태계 동향과 적용 판단
description: 2026-08-26~09-26과 2026-09-26~10-12 두 기간의 공식 변경(OMP 릴리스·MCP·OKF 사양·에이전트 도구 벤더)과 GitHub 월간 Trending 관측(09-26, 10-12)을 구분하고 OMP 지침의 반영·유지·미채택 근거를 연결한다.
tags: [tools, research, trends, github, skills, review, memory, sandbox, mcp]
timestamp: 2026-10-12T00:00:00Z
---

# 에이전트 생태계 동향과 적용 판단

이 문서는 날짜가 고정된 조사 기록이다. 현재 순위·지원 사양의 정본이 아니며, 재조사 기준은 [정확성](/accuracy.md), 실행 정책은 각 연결 concept을 따른다. 인기 프로젝트를 설치하는 권고 목록이 아니다. 조사는 2026-08-26~09-26 기록(이 절 아래의 앞 절들)과 2026-09-26~10-12 후속 조사(마지막 절들)로 나뉘며, 앞 기록은 당시 시점의 이력이다.

## 조사 범위와 근거의 종류

- 공식 변경의 대상 기간: **2026-08-26~2026-09-26**. 아래 날짜는 공식 원문의 발표·릴리스 날짜다.
- 인기 관측: **2026-09-26**, [GitHub Trending / This month](https://github.com/trending?since=monthly), Language=Any, Spoken Language=Any. 반환된 23개 저장소의 설명을 선별하고 이 레포의 도구·지침·지식 관리와 직접 관련된 10개는 저장소 README까지 확인했다. GitHub 전체 프로젝트나 해당 기간의 모든 일별 순위를 조사한 것은 아니다.
- 표의 누적 별 수와 `stars this month`는 **같은 Trending 응답의 표시값**이다. 임의로 정한 위 시작·종료일의 정확한 별 증가량을 재구성한 값이 아니며 표 순서도 인기 순위가 아니다. 저장소 상세 페이지는 별도 시점에 읽었으므로 누적 수치를 섞지 않았다.
- 공식 프로젝트의 README는 기능·설계 의도 확인에 사용했다. 설치·보안 감사·성능 비교는 수행하지 않았으며 저자의 안전성·비용 절감·벤치마크 주장을 독립 검증 결과로 채택하지 않았다.

## GitHub 월간 관측과 이 레포의 결정

| 저장소 / 원문 | 누적 stars | stars this month | 확인한 주제와 적용 판단 |
|---|---:|---:|---|
| [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill) | 21,833 | 18,769 | 발견·후보 반증·독립 검증·coverage를 나누는 감사 절차. [워크플로](/workflow.md)에 반증과 미확인 후보 구분을 보강한다. 별도 감사 도구나 다중 보고 파일 생성은 도입하지 않는다. |
| [alibaba/open-code-review](https://github.com/alibaba/open-code-review) | 41,498 | 20,100 | 결정적 파일 선택·규칙 매칭과 LLM 리뷰를 결합한다. 대상 범위·근거 위치·실행 검증을 분리하는 기존 기준을 유지한다. 저자의 precision/recall·토큰 수치로 OMP보다 우수하다고 결론 내리지 않는다. |
| [tech-leads-club/agent-skills](https://github.com/tech-leads-club/agent-skills) | 6,833 | 1,866 | 스킬 배포·무결성·검사 중심 레지스트리. [스킬 정책](/tools/skills.md)에 출처·리비전·동봉 실행 코드 검토를 보강한다. 레지스트리의 'safe' 표시는 자체 안전 보증으로 취급하지 않는다. |
| [cursor/plugins](https://github.com/cursor/plugins) | 8,694 | 3,701 | skills·rules·hooks·MCP를 묶는 제품별 플러그인과 학습·검토 흐름. 공통 스킬 형식과 host별 실행·권한·탐색 계약을 구분한다. Cursor manifest를 OMP 지원 계약으로 복사하지 않는다. |
| [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) | 146,222 | 36,118 | 코드 읽기·기존 구현 재사용·표준/네이티브 우선의 최소 구현. [코딩 스타일](/coding-style.md)의 결정 사다리에 기존 구현 재사용을 명시한다. 보안·접근성·검증을 줄이는 코드 골프와 벤치마크 수치의 일반화는 배제한다. |
| [ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd) | 51,300 | 27,288 | 답을 묻히지 않는 행동 중심 응답 규칙. 기존 [응답 원칙](/response-principles.md)을 유지한다. 시간 추정·목록 5개 제한·항상 다음 행동으로 끝내기는 이 레포의 소통·요구 완결성 규칙과 맞지 않아 미채택한다. OMP 확장 선언과 조건부 비표시 규칙 주입도 아래 실행 경계에 따라 미설치로 판단한다. |
| [tt-a1i/archify](https://github.com/tt-a1i/archify) | 72,024 | 56,232 | 소스 근거를 가진 관계·흐름의 인터랙티브 HTML. 기본 Mermaid·터미널 보고를 유지한다. 공유·탐색 가능한 HTML이 실제 요구일 때만 별도 산출물을 검토한다. 후속: 2026-09-30에 고정 배포본을 요청 기반 스킬로 채택했다(아래 후속 조사의 「정정한 기존 서술」). |
| [Tencent/BrowserSkill](https://github.com/Tencent/BrowserSkill) | 7,310 | 5,954 | 사용자의 로그인된 브라우저를 CLI·확장으로 연결한다. OMP의 기존 browser facade를 우선하며 중복 확장을 설치하지 않는다. 실제 로그인 세션의 대상·행동 권한 구분을 [기본 도구](/tools/builtin.md)에 명시한다. |
| [Tencent/WeKnora](https://github.com/Tencent/WeKnora) | 30,221 | 9,591 | RAG·에이전트·Wiki·메모리를 결합하는 지식 플랫폼. [학습 축적](/learning/accumulation.md)의 출처·적용 버전 재검증을 보강한다. 작은 파일형 OKF를 검색 서버·벡터 DB로 교체할 근거는 없다. |
| [superdesigndev/treg](https://github.com/superdesigndev/treg) | 3,439 | 2,725 | 외부 API·CLI·스킬을 묶는 도구 카탈로그와 자격증명 중계. 필요한 외부 연동에만 MCP를 사용한다는 [정책](/tools/mcp.md)을 유지한다. 중계자를 통한 데이터·비용·권한 경계 확대는 별도 평가 대상이며 도입하지 않는다. |

`i-have-adhd`의 실행 경계는 [고정 revision의 manifest](https://github.com/ayghri/i-have-adhd/blob/839872f9d1cd634fed642b4589ce7226199cc15f/package.json)와 [확장 소스](https://github.com/ayghri/i-have-adhd/blob/839872f9d1cd634fed642b4589ce7226199cc15f/extensions/i-have-adhd.ts)를 정적으로 확인했다. `omp.extensions`를 선언하지만 API import는 `@earendil-works/pi-coding-agent`이며 선언만으로 OMP 설치본 호환성을 증명하지 않는다. 활성 상태이고 규칙이 컨텍스트에 없을 때 `display: false` 메시지로 규칙을 넣고 세션 시작·트리 변경·압축 이벤트에서 상태를 동기화한다. 기본 `adhd` flag는 false이며 저장 상태·설정·파일로 활성화될 수 있으므로 항상 주입된다고 단정하지 않는다. OMP 확장은 별도 보안 샌드박스 없이 같은 런타임에서 실행된다(`omp://extension-loading.md`). 설치·로드 성공이나 악성 여부는 검증하지 않았으며, 기존 규칙과의 충돌 및 실행 권한 검토를 생략할 근거가 없어 설치하지 않는다.

관측 목록의 나머지는 공간정보·교육·음성·로컬 추론/모델 학습·금융·모바일 가상화·시계열·SEO·CRM/ERP·데스크톱 유틸리티에 해당했다. 지침 배포·OKF 관리에 직접 필요한 도입 근거가 없어 상세 제품 비교에서 제외했다. 이는 해당 프로젝트의 품질 판정이나 관련 분야의 변화 부재를 뜻하지 않는다.

## 기간 안에 발표된 공식 변경 — 관련 주제 선별

스킬·리뷰 승인·샌드박스·메모리·설정 검증·문서/도구 API에 영향을 주는 항목을 선별했다. 해당 기간의 전체 릴리스 목록이 아니며 OMP의 상세 대조는 설치본에 연결되는 18.3.0~18.3.2를 대상으로 한다.

| 발표일 | 공식 원문과 확인 내용 | OMP/OKF에 적용한 경계 |
|---|---|---|
| 2026-09-24 | [OMP 18.3.0](https://github.com/can1357/oh-my-pi/releases/tag/v18.3.0): `hub` 폐기 방향, `wait`·`proc://`·`agent://`와 on-demand 문서 경로 | [기본 도구](/tools/builtin.md)·[위임](/tools/subagents.md)에 현재 메시지·대기 계약 반영. 구형 호출 예시를 새 설정으로 흉내 내지 않는다. |
| 2026-09-25 | [OMP 18.3.1](https://github.com/can1357/oh-my-pi/releases/tag/v18.3.1): 내부 URI 파일 작업, `cfg://`, 복수 브라우저 연결 지원 | 현재 세션의 실제 노출 도구와 문서를 사용한다. 새 기능의 존재만으로 설정·권한을 변경하지 않는다. |
| 2026-09-26 | [OMP 18.3.2](https://github.com/can1357/oh-my-pi/releases/tag/v18.3.2): `grep dir/*.go`의 하위 디렉터리 오매칭 수정, `ctx.agent`, Windows 임시 경로 수정 | 로컬 `omp --version`의 18.3.2와 대조. 탐색 glob 경계를 정정하며 확장 코드·런타임 업그레이드는 하지 않는다. |
| 2026-09-01 | [Copilot code review의 PR 승인](https://github.blog/changelog/2026-09-01-copilot-code-review-can-now-approve-pull-requests/): public preview, 승인 기능 기본 off. 승인 평가 의견과 required approvals에 포함되는 실제 승인을 구분 | OMP 검토 결과·advisor 카드는 Git 병합 승인이 아니다. 검토 완료와 사용자에게 받은 Git 작업 권한을 구분하는 기존 원칙을 유지한다. |
| 2026-09-02 | [Copilot app/CLI content exclusions GA](https://github.blog/changelog/2026-09-02-content-exclusions-generally-available-in-copilot-app-and-cli/): Business/Enterprise의 관리자 제외 정책을 컨텍스트에 적용 | OMP나 `.gitignore`가 같은 비밀 접근 차단을 제공한다고 추론하지 않는다. 민감정보와 실행 프로세스의 접근 경계를 별도로 검증한다. |
| 2026-09-08 | [JetBrains enterprise-managed sandbox](https://github.blog/changelog/2026-09-08-enterprise-managed-sandbox-in-copilot-for-jetbrains/): public preview, 관리 정책이 사용자 설정보다 우선 | 설정 파일의 선언과 실효 정책의 차이를 유지한다. Copilot의 중앙 정책을 OMP 설정에 이식하지 않는다. |
| 2026-09-22 | [Copilot for JetBrains 1.18.0](https://github.blog/changelog/2026-09-22-new-features-and-improvements-in-copilot-for-jetbrains/): 조직/엔터프라이즈 skills·instructions, MCP 도구별 제어, assisted approvals public preview | 배포된 지침과 실제 host 지원·승인 동작을 분리한다. Copilot 설정을 OMP 키나 자동 승인 근거로 사용하지 않는다. |
| 2026-09-23 | [Copilot app local sandboxing](https://github.blog/changelog/2026-09-23-local-sandboxing-in-the-github-copilot-app/): 로컬 저장소/worktree 세션의 파일·네트워크·자격증명 경계, OS 강제 실패 시 실행 거부. 당시 public preview·기본 off(2026-10-07 GA 전환, 아래 후속 조사), cloud/원격 제외·CLI 설정 별도 | [보안 개요](/security/overview.md)에 프롬프트·worktree 격리와 실제 실행 격리를 구분한다. 프로젝트 설정은 새 세션/재시작에 적용되고 관리 정책으로 더 제한될 수 있다. OMP의 동등 기능·활성화를 주장하지 않는다. |
| 2026-09-25 | [Agentic autofix + Copilot Memory](https://github.blog/changelog/2026-09-25-agentic-autofix-now-uses-copilot-memory/): 활성화한 사용자의 기억 참조·수정 패턴 저장, 두 기능 모두 public preview | 자동 기억을 현재 사실·실행 승인으로 승격하지 않는 기준을 [워크플로](/workflow.md)·[학습 축적](/learning/accumulation.md)에 반영한다. |
| 2026-09-25 | [Enterprise managed settings validator](https://github.blog/changelog/2026-09-25-enterprise-managed-settings-in-product-validator/): 잘못된 JSON·미지원 설정·팀 매핑 진단 | 파일 작성, 스키마 검증, 실제 정책 적용을 분리하는 기존 정본 검증 기준을 유지한다. OKF frontmatter 검사만으로 지침 내용의 정확성을 주장하지 않는다. |
| 2026-09-24 | [WeKnora v0.8.2 README](https://github.com/Tencent/WeKnora#whats-new): 로컬 브라우저 연결, workspace별 MCP endpoint, 대화 제어 | 원문 README의 릴리스 날짜·요약을 확인했다. 외부 지식/브라우저/MCP 통합의 관측 사례이며 이 레포에 서비스를 배포하지 않는다. |

## 현재 사양 대조 — 최근 발표와 구분

- [Agent Skills specification](https://agentskills.io/specification): `SKILL.md`와 필요할 때 읽는 resources, `allowed-tools`의 실험적·host별 지원. 2026-09-26 조회한 사양이지 이 조사 기간에 새로 제정됐다는 주장이 아니다.
- OMP 18.3.2 내장 `omp://tools/ast-grep.md`, `xd://eval/browser`, `omp://config-usage.md`와 [태그의 agent discovery 소스](https://github.com/can1357/oh-my-pi/blob/v18.3.2/packages/coding-agent/src/task/discovery.ts): 선택적 AST 노출·browser facade·config 경로와 agent 탐색 경로의 차이를 정정했다.
- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html): 인증 방식에 맞는 방어와 framework 우선 기준으로 [보안 리뷰](/security/review-checklist.md)를 정정했다. 발표일을 확인하지 않은 문서를 월간 신기능으로 세지 않는다.
- 게임 권위·예측, 동시성 선택, 소비자 관측 가능한 회귀 테스트는 기존 문서 간 정합성을 바로잡은 사항이다. 최근 Unity/SDK 릴리스가 이 원칙을 바꿨다는 근거는 확보하지 않았으며 엔진·SDK·서명 규격을 변경하지 않는다.

## 채택 결과의 범위

지침·지식·연결 문서만 갱신한다. 모델 배정·fallback·advisor·도구 승인 설정, setup 코드, 기존 MCP·스킬·확장은 유지한다. 인기 도구의 실행 성능이나 안전성을 검증한 것으로 보고하지 않으며, 실제 배포 검증은 이 레포의 setup과 소스/배포본 일치를 대상으로 한다.

## 후속 조사: 2026-09-26~2026-10-12

### 조사 범위와 근거의 종류

- 공식 변경의 대상 기간: **2026-09-26~2026-10-12**(조사일). OMP 날짜는 GitHub 릴리스 페이지의 UTC 게시 시각이며 변경 내역(CHANGELOG)의 날짜와 하루 차이가 날 수 있다. 벤더 날짜는 각 공식 changelog의 게시일이다.
- 설치본 OMP는 18.10.0이며 [v18.10.0](https://github.com/can1357/oh-my-pi/releases/tag/v18.10.0)(2026-10-12)이 조사일 기준 최신 릴리스다. 도구·설정 이름은 설치본의 `omp://` 문서와 `src/` 소스로 대조했다.
- 이 기간의 전체 릴리스 목록이 아니라 이 레포 지침(도구·스킬·MCP·위임·설정 검증)과 관련된 항목만 선별했다. Gemini CLI·Codex CLI·Copilot CLI의 릴리스 노트는 정독하지 않았다(릴리스 존재만 관측).
- 인기 관측: **2026-10-12**, [GitHub Trending / This month](https://github.com/trending?since=monthly), Language=Any, Spoken=Any, 반환된 22개 저장소. 아래 값은 같은 응답의 표시값이며 임의 기간의 정확한 증가량이 아니다. 표의 6개는 README 앞부분을 읽었고 설치·보안 감사·성능 비교는 하지 않았다. 저자의 성능·안전성 주장은 독립 검증 결과로 채택하지 않는다.

### OMP 릴리스 — 관련 주제 선별

| 발표일(UTC) | 공식 원문과 확인 내용 | OMP/OKF에 적용한 경계 |
|---|---|---|
| 2026-09-27 | [OMP 18.3.3](https://github.com/can1357/oh-my-pi/releases/tag/v18.3.3): `omp skill list [dir] --json`(세션과 같은 스킬 해석·경고 보고) 추가, `task`·`bash` 에이전트에 `wait` 제공 | [스킬 사용](/tools/skills.md)의 설치 검증 경로로 이미 사용한다. 변경 없음. |
| 2026-09-27 | [OMP 18.3.4](https://github.com/can1357/oh-my-pi/releases/tag/v18.3.4): `task`의 `complexity`를 `solutionSpace`(문제의 개방성 서술)로 교체 | 현행 `task` 스키마와 일치하며 위임 지침은 인자 이름에 의존하지 않는다. 변경 없음. |
| 2026-09-29 | [OMP 18.4.3](https://github.com/can1357/oh-my-pi/releases/tag/v18.4.3): 기본 `web_search` 체인을 키 없는 경로 중심(`web/hosted` 포함)으로 변경, 유료 엔진은 `web` 역할에 명시할 때만 실행 | [기본 도구](/tools/builtin.md)의 `web_search` 서술을 18.10.0 문서로 갱신했다. 수직 검색만 MCP를 쓰는 [정책](/tools/mcp.md)은 유지한다. |
| 2026-10-02 | [OMP 18.4.12](https://github.com/can1357/oh-my-pi/releases/tag/v18.4.12): 서브에이전트가 자체 빌드·테스트·스모크를 건너뛰고 검증을 메인에 맡김 | [위임](/tools/subagents.md)의 작업자별 clone 빌드는 위임 context에 명시해야 한다고 보강했다. |
| 2026-10-03 | [OMP 18.5.0](https://github.com/can1357/oh-my-pi/releases/tag/v18.5.0): `task` 호출별 `model` 선택자 추가, `task.completionProbeMs`를 `task.completionProbe`로 교체 | 호출별 `model`은 18.8.2에서 제거돼 채택하지 않는다([에이전트 가이드](/agents/guide.md)). `task.completionProbe`는 설정을 바꾸지 않는다. |
| 2026-10-03 | [OMP 18.5.1](https://github.com/can1357/oh-my-pi/releases/tag/v18.5.1): `wait`가 호출자 소유 작업·서비스만 기다림, 읽기 전용 `archive` eval 전역 추가 | `wait` 계약을 [기본 도구](/tools/builtin.md)에 반영했다. `archive`는 사용하지 않는다. |
| 2026-10-06 | [OMP 18.7.0](https://github.com/can1357/oh-my-pi/releases/tag/v18.7.0): `read`가 JSON/JSONL을 `?q=<jq>`로 질의 | 기본 도구 기능이며 지침 변경 없음. |
| 2026-10-07 | [OMP 18.8.2](https://github.com/can1357/oh-my-pi/releases/tag/v18.8.2): `task`·eval `agent()`·`workpool()`의 호출별 `model` 제거 | [에이전트 가이드](/agents/guide.md)의 `modelRoles`·`task.agentModelOverrides` 기준과 일치한다. |
| 2026-10-09 | [OMP 18.8.7](https://github.com/can1357/oh-my-pi/releases/tag/v18.8.7): `bash.gitGuard`(기본 off), 기본 `smol`이 Haiku 5.5 우선, `worktree.onStart`·`worktree.onExit` | 설정 값은 바꾸지 않는다. `modelRoles.smol`이 명시돼 기본 `smol` 변경은 영향이 없다. `gitGuard`는 공유 checkout의 동시 작업자가 `git stash`·`reset --hard`·덮어쓰는 checkout을 실행하지 못하게 하는 선택지로 기록만 한다. 임베디드 셸의 `git` 내장만 대상이며 `pty`·서비스·경로로 직접 실행한 git은 제외된다(`omp://settings.md`). |
| 2026-10-11 | [OMP 18.9.0](https://github.com/can1357/oh-my-pi/releases/tag/v18.9.0): `retry.fallbackOn`(`any` 기본·`usage-limit`·`except-usage-limit`), 브라우저 `targets()`와 사용자가 연 페이지 채택 | fallback 설정은 바꾸지 않는다(기본 `any`). 브라우저 권한 구분은 [기본 도구](/tools/builtin.md)에 반영했다. |
| 2026-10-12 | [OMP 18.10.0](https://github.com/can1357/oh-my-pi/releases/tag/v18.10.0): `omp session pack/unpack`, `omp auth export/import`, 로컬 IPC의 네이티브 전송(Windows에서 이전 버전이 시작한 daemon은 재사용하지 않으므로 업그레이드 뒤 이전 세션을 닫으라는 안내) | 사용하지 않는다. `omp auth export`는 로그인 자격증명을 다른 기기로 옮기므로 사용자 요청·승인 범위에서만 다룬다. |

### 사양 대조: MCP·Agent Skills·OKF

- MCP: 현행 revision은 [2026-07-28](https://modelcontextprotocol.io/specification/versioning)이며 이 기간에 새 revision은 없다([릴리스 목록](https://github.com/modelcontextprotocol/modelcontextprotocol/releases) 최신 확인). 07-28 revision은 `initialize` 핸드셰이크를 제거한 stateless 모델이다([변경 내역](https://modelcontextprotocol.io/specification/2026-07-28/changelog)). 기간 안 채택 관측은 [Python SDK v2.3.0](https://github.com/modelcontextprotocol/python-sdk/releases/tag/v2.3.0)(10-02)의 클라이언트 `server/discover` 프로브(`mode="auto"`)와 아래 Claude Code의 기본 협상이다. 반면 OMP 18.10.0은 2025-11-25 `initialize`를 보내므로 [MCP 정책](/tools/mcp.md)에 「사양 revision과 OMP 클라이언트 호환」을 추가했고 서버 전환을 가정하지 않는다.
- Agent Skills: [사양](https://agentskills.io/specification)의 구성(`name`·`description`·`license`·`compatibility`·`metadata`·실험적 `allowed-tools`)은 [저장소](https://github.com/agentskills/agentskills)의 마지막 커밋이 2026-08-09라 이 기간에 바뀌지 않았다. [스킬 사용](/tools/skills.md)을 유지한다.
- Docker MCP gateway [v0.44.1](https://github.com/docker/mcp-gateway/releases/tag/v0.44.1)(09-23, 기간 직전)과 [brave-search-mcp-server v2.1.4](https://github.com/brave/brave-search-mcp-server/releases/tag/v2.1.4)(09-17)이 조사일 기준 최신이며 `dynamic-tools`·`--dry-run`·Brave 도구 목록은 [MCP 정책](/tools/mcp.md) 서술과 같다. 기간 밖의 현행 대조이며 신규 발표로 세지 않는다.
- OKF: 현행은 [v0.2](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md)다. 발표는 [2026-07-25 Google Cloud 블로그](https://cloud.google.com/blog/products/data-analytics/okf-v0-2-adds-trust-signals)였고, 사양 저장소는 2026-08에 `GoogleCloudPlatform/open-knowledge-format`으로 옮겨졌다. 마지막 사양 커밋은 2026-08-21(모든 시각 값에 명시적 UTC 오프셋 요구)이며 v0.3은 제안 단계다([#16](https://github.com/GoogleCloudPlatform/open-knowledge-format/issues/16) 등). v0.2는 `sources`·`generated`·`verified`·`status`·`stale_after`와 `Attested Computation`을 선택 항목으로 더하고, `timestamp`를 `generated.at`으로 대체한다(v0.1 형식으로도 읽힘). 소비 모델은 `index.md`의 한 줄 설명으로 고르고(§8), frontmatter로 관련성·신뢰를 판단한 뒤 고른 개념의 본문만 읽는 방식이다. 발표문은 개념을 간결하게 두라고 권한다. 이 번들은 v0.1 frontmatter를 유지하고, 2026-10-12에 여러 독립 주제를 담은 큰 개념을 주제별 개념으로 나눴다([학습 축적](/learning/accumulation.md) 「기록 위치」 4). [Knowledge Catalog 연동](https://cloud.google.com/blog/products/data-analytics/scale-okf-bundles-across-an-organization-with-knowledge-catalog)(2026-08-27, 이전 조사 기간에서 누락)은 조직 단위 검색·IAM 공유용이라 개인 파일형 번들에는 채택하지 않는다. `okf.md`·`useokf.com` 등은 Google이 아닌 제3자 사이트·도구다.

### 에이전트 도구 벤더의 공식 변경 — 관련 주제 선별

| 발표일 | 공식 원문과 확인 내용 | 판단 |
|---|---|---|
| 2026-10-01 | [Claude Code 2.1.287](https://code.claude.com/docs/en/changelog): Claude Mods(플러그인이 더 깊은 동작을 수정), MCP 서버 `alwaysLoad: false`의 도구를 tool search 뒤로 지연 | Claude Code 전용 플러그인·설정 키다. OMP에 이식·설치하지 않는다. |
| 2026-10-06 | Claude Code 2.1.292: 로컬(stdio) MCP 연결이 2026-07-28을 기본 협상(`MCP_PROTOCOL_NEGOTIATION=legacy`로 해제) | MCP 사양 대조의 채택 사례다. 다른 host의 채택은 OMP 지원 근거가 아니다. |
| 2026-10-08 | Claude Code 2.1.295: 명령·HTTP hook의 `onFailure: "block"`, 서브에이전트 `skills` 사전 로드 최대 32개, claude.ai 커넥터의 2026-07-28 기본 협상 | OMP hook·agent 정의의 계약이 아니다. 새 키를 OMP 설정으로 옮기지 않는다. |
| 2026-10-09 | Claude Code 2.1.296: 서브에이전트 frontmatter `autoCompactWindow`, MCP 도구 설명·서버 지침 기본 한도 2,048→4,096자 | OMP의 대응 설정은 `task.agentCompactionThresholdOverrides`(`omp://task-agent-discovery.md`)이며 현재 값은 바꾸지 않는다. |
| 2026-10-07 | [Copilot local sandboxing GA](https://github.blog/changelog/2026-10-07-local-sandboxing-for-github-copilot-now-generally-available): CLI·앱·VS Code Agent Host 세션에서 MXC가 공통 정책을 OS 제어로 변환, 지원되는 로컬 MCP·언어 서버에도 적용, 기업 관리 설정으로 강제 | 09-23 preview의 GA 전환이다. [보안 개요](/security/overview.md)의 프롬프트·worktree 격리와 실제 실행 격리의 구분을 유지하며 OMP의 동등 기능·활성화를 주장하지 않는다. |
| 2026-10-02 | [Copilot code review API·기본 effort](https://github.blog/changelog/2026-10-02-copilot-code-review-api-support-and-new-default-effort-level): REST/GraphQL로 리뷰 요청, 기본 effort `Balanced`(09-28 적용) | 제품 설정이다. OMP reviewer의 검토 계약·모델 배정은 바꾸지 않는다. |
| 2026-10-01 | [Copilot dynamic workflows](https://github.blog/changelog/2026-10-01-dynamic-workflows-in-copilot-cli-and-the-copilot-app): 코드로 정의하는 다중 에이전트 오케스트레이션(`/fleet`과 구분) | OMP의 `task`·`workpool()`과 별개 제품 기능이다. 채택하지 않는다. |
| 2026-10-08 | [Codex 변경 내역](https://developers.openai.com/codex/changelog): GPT-6.1 Sol Ultrafast(Pro $500과 일부 Enterprise·Edu, Enterprise 기본 off) | 설치본이 `/fast ultra`(OMP 18.4.4)를 지원하나 이 프로필은 사용하지 않는다. 사용량 소모·계정 가용성은 별도로 확인한다. |
| 2026-10-14 시행(공지 09-14) | Codex 변경 내역: GPT-5.5가 ChatGPT·ChatGPT Work·Codex에서 10월 14일 은퇴(API 제외), GPT-5.3-Codex-Spark는 09-14 중단 | 이 프로필의 역할·fallback은 `gpt-6-astra`·`gpt-6.1-sol`·`gpt-6-luna`만 쓰므로 영향이 없다(`config/settings.conf`). OMP는 `openai-codex`의 카탈로그 기본 모델을 `gpt-5.5`로 선언하므로(`omp://provider-quirks.md`) 역할을 명시하지 않는 호출 경로가 생기면 은퇴 뒤 별도 확인한다. |

모델 출시(Claude Haiku 5.5 10-07, GPT-6.1 Sol 09-29)는 [에이전트 가이드](/agents/guide.md)의 2026-10-08 기록이 정본이며, 2026-10-12에 공식 모델 목록([Anthropic](https://platform.claude.com/docs/en/models/overview)·[OpenAI](https://developers.openai.com/api/docs/models))의 현행 구성과 다시 대조했다.

### GitHub 월간 Trending 재관측 (2026-10-12)

| 저장소 / 원문 | 누적 stars | stars this month | 확인한 주제와 적용 판단 |
|---|---:|---:|---|
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | 105,144 | 11,891 | 개발 수명주기별 엔지니어링 스킬과 슬래시 명령 9개(MIT). [워크플로](/workflow.md)·[스킬 사용](/tools/skills.md)으로 이미 충족하며 설치하지 않는다. |
| [NVIDIA/OpenShell](https://github.com/NVIDIA/OpenShell) | 15,878 | 7,318 | 커널 수준 정책으로 에이전트의 파일·시스템 호출·네트워크를 제한하는 런타임(Apache-2.0). 실제 OS 격리 후보지만 도입은 사용자 요청·승인 대상이며 [보안 개요](/security/overview.md)의 격리 구분을 유지한다. 저자의 보안 주장은 검증하지 않았다. |
| [vectorize-io/hindsight](https://github.com/vectorize-io/hindsight) | 48,516 | 25,187 | 학습하는 에이전트 메모리 시스템. OMP에도 Hindsight 메모리 백엔드 항목이 있으나(변경 내역 18.5.1) 이 프로필은 파일형 OKF와 현행 메모리 설정을 유지한다([학습 축적](/learning/accumulation.md)). 벤치마크는 저자 주장이다. |
| [mksglu/context-mode](https://github.com/mksglu/context-mode) | 26,724 | 4,584 | MCP 서버로 도구 출력을 샌드박싱하고 세션 이벤트를 SQLite에 저장한다. 98% 절감은 저자 주장이다. 기본 도구로 되는 일에 MCP를 두지 않는 [정책](/tools/mcp.md)에 따라 미채택한다. |
| [affaan-m/ECC](https://github.com/affaan-m/ECC) | 277,348 | 22,438 | Claude Code 등을 대상으로 한 스킬·기억·보안 번들. README가 비공식 미러의 악성코드 위험을 경고한다. 미설치이며 도입 시 [스킬 사용](/tools/skills.md)의 외부 도입 검토를 적용한다. |
| [trycua/cua](https://github.com/trycua/cua) | 29,412 | 6,994 | computer-use용 데스크톱·VM·벤치마크 모음. OMP `computer` API는 기본 비활성이며 이 지침과 설정은 바꾸지 않는다. |

앞 관측과 겹치는 [alibaba/open-code-review](https://github.com/alibaba/open-code-review)(46,271 / 24,146)·[Tencent/WeKnora](https://github.com/Tencent/WeKnora)(33,300 / 11,116)·[cursor/plugins](https://github.com/cursor/plugins)(10,931 / 3,610)는 이번에도 목록에 있으나 README를 다시 읽지 않았고 앞 판단을 유지한다. 앞 관측의 나머지 저장소가 이번 목록에 없다는 사실은 해당 프로젝트의 품질 판정이 아니다. 목록의 나머지는 음성·모델 실행·금융·지도·영상·역공학 등 이 레포의 지침 관리와 직접 관련 없는 항목이며 상세 비교에서 제외했다.

### 후속 조사에서 정정한 기존 서술

- Archify: 09-26 기록의 「실제 요구일 때만 별도 산출물을 검토」는 이후 2026-09-30 커밋(`c76a7dd`)에서 고정 배포본(v3.0.1)을 요청 기반 스킬로 채택하며 갱신됐다. 기본 Mermaid·터미널 보고는 유지하고 승인된 프로젝트 유지 선언이 있는 프로젝트에서만 지도를 갱신한다([프로젝트 지도](/project-navigation.md), [스킬 사용](/tools/skills.md)).
- Copilot local sandboxing: 09-23 기록의 public preview·기본 off는 10-07 GA로 바뀌었다. OMP의 동등 기능 부재·미활성 판단은 그대로다.
- OMP `hub`: 18.3.0의 「폐기 방향」은 18.10.0 내장 도구 목록(`src/tools/builtin-names.ts`)에서 제거된 것으로 확인했다([기본 도구](/tools/builtin.md)).
- 앞 기록의 OMP 18.3.x 서술은 당시 설치본(18.3.2) 기준 이력이다. 현재 서술은 [기본 도구](/tools/builtin.md)·[MCP 정책](/tools/mcp.md)·[스킬 사용](/tools/skills.md)이 정본이며 18.10.0에서 재확인했다.

### 후속 조사의 채택 결과 범위

지침·지식·연결 문서만 갱신한다. `config/settings.conf`의 모델 배정·fallback·advisor·도구 승인 설정, setup 코드, 기존 MCP·스킬·확장은 바꾸지 않는다. 인기 도구를 설치하거나 실행 성능·안전성을 검증한 것으로 보고하지 않는다. 벤더 제품의 새 설정 키·preview·기본값은 OMP 기능으로 옮기지 않는다.

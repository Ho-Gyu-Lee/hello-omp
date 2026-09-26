---
type: Reference
title: 에이전트 생태계 동향과 적용 판단
description: 2026-08-26~09-26 공식 변경과 09-26 GitHub 월간 Trending 관측을 구분하고 OMP 지침의 반영·유지·미채택 근거를 연결한다.
tags: [tools, research, trends, github, skills, review, memory, sandbox]
timestamp: 2026-09-26T00:00:00Z
---

# 에이전트 생태계 동향과 적용 판단

이 문서는 날짜가 고정된 조사 기록이다. 현재 순위·지원 사양의 정본이 아니며, 재조사 기준은 [정확성](/accuracy.md), 실행 정책은 각 연결 concept을 따른다. 인기 프로젝트를 설치하는 권고 목록이 아니다.

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
| [tt-a1i/archify](https://github.com/tt-a1i/archify) | 72,024 | 56,232 | 소스 근거를 가진 관계·흐름의 인터랙티브 HTML. 기본 Mermaid·터미널 보고를 유지한다. 공유·탐색 가능한 HTML이 실제 요구일 때만 별도 산출물을 검토한다. |
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
| 2026-09-23 | [Copilot app local sandboxing](https://github.blog/changelog/2026-09-23-local-sandboxing-in-the-github-copilot-app/): 로컬 저장소/worktree 세션의 파일·네트워크·자격증명 경계, OS 강제 실패 시 실행 거부. public preview·기본 off, cloud/원격 제외·CLI 설정 별도 | [보안 개요](/security/overview.md)에 프롬프트·worktree 격리와 실제 실행 격리를 구분한다. 프로젝트 설정은 새 세션/재시작에 적용되고 관리 정책으로 더 제한될 수 있다. OMP의 동등 기능·활성화를 주장하지 않는다. |
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

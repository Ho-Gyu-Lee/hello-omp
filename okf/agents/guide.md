---
type: Reference
title: 에이전트 가이드
description: 설치본의 빌트인 에이전트와 가용성 확인, modelRoles 배정과 실행의 구분, 커스텀 에이전트 작성 기준.
tags: [agents, subagents, routing, builtin]
timestamp: 2026-09-18T00:00:00Z
---

# 에이전트 가이드

OMP 18.2.5 설치본에서 확인한 빌트인 에이전트는 `scout`·`reviewer`·`security-reviewer`·`task`·`sonic` 5종이다(확인: 2026-09-18, 설치본 `src/task/agents.ts`·`src/prompts/agents/`). 기본 원칙은 제공되는 빌트인을 그대로 사용하는 것이다 — 동명 복제·오버라이드는 번들 프롬프트와 기본값의 갱신을 놓칠 수 있으므로 피한다.

- 번들 model alias는 `scout`·`sonic` → `@smol`, `task` → `@task`, `reviewer` → `@slow`이다.
- `security-reviewer`는 번들 model 지정이 없어 부모 세션의 모델 선택을 따른다. 별도 라우팅이 필요할 때만 `task.agentModelOverrides`를 사용한다.
- role alias는 `modelRoles`의 모델로 해석되고, 값에 명시한 `:level` suffix가 번들 기본 추론 강도보다 우선한다. 현재 설정은 모든 역할에 suffix를 지정하므로 아래 표의 모델·강도가 함께 적용된다. suffix가 없으면 `scout`·`sonic`은 medium이라는 번들 기본값을 따른다.
- OKF 확인·도구 정책은 빌트인이 기본 상속하는 글로벌 `AGENTS.md`로 적용된다.
- 특정 에이전트만 모델을 바꾸려면 파일 복사 대신 `task.agentModelOverrides`(에이전트→모델 문자열)를 쓴다. thinking level 조정은 우선 `modelRoles` suffix로 처리하고, 불가능할 때만 소스 override를 검토한다.

| 빌트인 에이전트 | 역할 | 사용 시점 | 유효 모델 라우팅 |
|------|------|-----------|------|
| `scout` | 읽기 전용 코드베이스 스카우트 | 넓은 탐색, 메인 컨텍스트 보호 | `smol` = gpt-5.6-terra:medium |
| `reviewer` | 코드 품질·보안 리뷰 | 변경 완료·PR 독립 검토 | `slow` = claude-opus-5:xhigh |
| `security-reviewer` | 읽기 전용 취약점 분석 | 근거 기반 저장소 보안 감사 | 부모 세션 모델(필요 시 agent override) |
| `task` | 범용 다단계 위임 | 일반 서브에이전트 작업 | `task` = gpt-6-astra:xhigh |
| `sonic` | 저추론 기계적 작업 | 단순·반복 기계 작업 | `smol` = gpt-5.6-terra:medium |

## 가용 에이전트와 모델 역할의 구분
- 위임에는 현재 세션에 제공된 에이전트 이름만 사용한다. 커스텀 정의·확장·비활성화 설정에 따라 가용 목록은 달라질 수 있으며, 목록에 없는 이름은 실행 전 검사에서 `Unknown agent`로 거부된다.
- `librarian`·`designer`는 확인한 설치본의 빌트인이 아니다. 라이브러리/API 조사는 `read`·`web_search`로 직접 처리하고 넓은 읽기 전용 조사는 `scout`에, UI/UX 구현은 `task`에, 코드 리뷰는 `reviewer`에 위임한다.
- `modelRoles`는 작업 용도별 모델 배정이며 에이전트를 등록하거나 상시 실행하는 설정이 아니다. 메인이 `task` 에이전트를 실행하면 `@task`가 해석되지만, 모델 역할 이름을 그대로 `agent`에 넣어서는 안 된다.
- 공유 프로필의 `modelRoles.designer`와 해당 fallback은 유효한 사용자 정의 역할 별칭으로 유지한다. `@designer`를 명시적으로 선택하거나 이를 참조하는 커스텀 에이전트를 등록해야 사용되며, 설정만으로 UI/UX 에이전트가 자동 실행되지는 않는다.
- `plan`은 계획 모드, `commit`은 OMP 커밋 생성 기능, `vision`은 이미지 질문·설명 경로, `tiny`는 경량 보조 기능에서 선택되는 모델 역할이다. `advisor`는 역할 배정과 별도로 `advisor.enabled` 또는 `/advisor on`으로 활성화해야 한다.
- advisor 노트의 출력 언어는 관리 소스 `rules/WATCHDOG.md`를 active agent dir의 `WATCHDOG.md`로 배포해 지정한다. 지적 내용·근거·권고는 한국어 존댓말로 작성하고 코드·설정 키·도구 필드·severity 값은 원문을 유지한다. 이 파일은 advisor 전용 시스템 지침이며 감시의 활성 여부·심각도·검토 범위를 바꾸지 않는다. 근거: `omp://advisor-watchdog.md`의 WATCHDOG.md(확인: 2026-09-18).
- 설치본의 번들 정의는 `omp agents unpack --dir <별도 검증 디렉터리> --json`으로 내보내 확인할 수 있다. 확인 목적으로 기본 사용자·프로젝트 에이전트 디렉터리에 풀어 빌트인 override를 만들지 않는다. 실제 위임 가능 여부는 현재 세션의 가용 목록을 기준으로 한다.

## 커스텀 에이전트 작성 시
- 진짜 새 에이전트(새 이름·다른 페르소나)만 `agents/`에 둔다. 단, bundled frontmatter가 품질 요구와 충돌하고 설정 키로 덮을 수 없는 경우에는 원본 OMP 버전과 변경 범위를 주석으로 남긴 동명 override를 허용한다.
- `model`을 반드시 명시한다 — 미설정 시 역할이 아니라 부모 세션 모델을 상속한다.
- 위임받은 에이전트도 작업 전 [OKF](/index.md)의 관련 개념을 확인하고 omp 기본 도구·스킬을 우선한다.

## 참고
- 기본 공유 프로필은 선택한 상급 OpenAI Codex와 Anthropic 모델을 함께 사용한다. `enabledModels`는 GPT-6 Astra·GPT-5.6 Sol/Terra/Luna·Claude Opus 5·Claude Fable 5.1로 한정한다. 선택된 역할·교차-provider fallback을 사용하려면 해당 provider의 유효 인증이 필요하며, 프로필 전체를 의도대로 사용하려면 두 provider를 모두 인증한다.
- `default`·`task`·`designer`는 gpt-6-astra:xhigh, `smol`·`commit`은 gpt-5.6-terra:medium, `tiny`는 gpt-5.6-luna:low, `slow`·`plan`은 claude-opus-5:xhigh, `vision`은 claude-fable-5-1:high, `advisor`는 claude-opus-5:high다.
- 상급 모델 우선 정책에 따라 `default`·`task`에도 Astra를 사용하고 `extendedContext=true`를 유지한다. 모델 선택에 폐기된 컨텍스트 제한을 적용하지 않으며, 실제 컨텍스트는 provider·모델 카탈로그·유효 설정으로 확인한다. UI/UX 구현은 별도 에이전트 등록 없이 범용 `task`에 위임할 수 있다.
- `extendedContext=true`는 OMP 카탈로그가 지원하는 확장 컨텍스트를 허용하는 로컬 정책이며, API 장문 가격 구간을 넘을 수 있다. 특정 구독의 입력 한도나 quota를 보장하지 않는다. Astra에도 장문 가격 구간이 있으며, API 가격과 구독 quota 소모율은 구분한다. 고정 단가를 운영 규칙으로 복제하지 않고 [OpenAI 모델 문서](https://developers.openai.com/api/docs/models/gpt-6-astra)·[가격표](https://developers.openai.com/api/docs/pricing)와 실제 provider usage report를 확인한다(공식 문서·OMP 18.2.5 `src/config/model-registry.ts` 확인: 2026-09-18).
- 비동기 `advisor`는 작업 중 위험 감시를 위해 기본 활성(`advisor.enabled=true`)이다. `modelRoles.advisor=anthropic/claude-opus-5:high`와 `syncBacklog=1`을 유지한다. 실제 실행 모델은 fallback으로 달라질 수 있으므로 역할 배정만으로 검토 독립성이나 quota 분리를 보장하지 않는다. 출력 정리만을 위해 감시를 임의로 끄지 않는다.
- 위험 변경은 구현 전 설계 검토를 수행하고, 완료 전에는 fresh context `reviewer`·`security-reviewer`의 결과를 직접 수신해 지적을 판단·반영·재검증한 뒤 통합 최종본을 전달한다. advisor 카드 표시와 `syncBacklog=1`은 검토 반영이나 최종 답변 승인을 보장하지 않는다. 이미 수신한 advisor 지적과 공개 답변을 바꾸는 추가 의견은 [워크플로](/workflow.md)와 [응답 원칙](/response-principles.md)에 따라 처리한다.
- 기본 프로필의 `vision`은 claude-fable-5-1:high, 교차-provider fallback 후보는 gpt-6-astra:high다. 두 모델의 이미지 입력 능력과 해당 계정·연동 경로의 실제 사용 가능 여부를 구분한다. 일반 서브에이전트 표에는 없지만 `modelRoles.vision`으로 설정된다.
- `plan`은 plan mode용 모델 역할이며 claude-opus-5:xhigh를 사용한다. 빌트인 task agent 이름이 아니며, 테스트 작성은 작업 성격에 맞는 `task` 또는 현재 제공 specialist에 위임한다.
- [Anthropic 공식 안내](https://www.anthropic.com/claude/fable)는 Fable 5.1을 Pro에도 제공한다고 명시한다(확인: 2026-09-18). `HELLO_OMP_ANTHROPIC_PLAN=pro`는 이 저장소의 선택형 Opus 전용 프로필이며 구독 권한 제한을 뜻하지 않는다. Pro 사용자도 기본 프로필을 사용할 수 있고, Fable을 제외하려는 경우에만 이 옵션을 선택한다. 이 옵션은 `vision`을 포함한 모든 Anthropic 역할·fallback·advisor를 Opus 5로 통일한다.
- `tiny`는 제목·메모리·auto-thinking 분류 등 경량 백그라운드 작업에 쓰며 gpt-5.6-luna:low를 사용한다. `commit`은 분석·map/reduce·changelog·commit 제안 전체 agentic pipeline이라 gpt-5.6-terra:medium을 유지한다. Spark는 이 프로필의 역할·`enabledModels`에 포함하지 않으며, 이 선택이나 특정 카탈로그의 부재를 서비스 전체의 지원 종료로 해석하지 않는다. 실제 가용성은 계정·클라이언트·provider 카탈로그로 확인한다.
- OMP는 원격 모델 카탈로그와 로컬 캐시를 사용한다. portable 설정은 실제 모델을 `provider/model-id`로 고정하되, ID를 설정했다는 사실만으로 가용성·계정 권한·호출 성공을 보장하지 않는다.
- Opus가 필요한 명시적 역할·fallback에는 `anthropic/claude-opus-5`만 지정한다. `providers.anthropic.serverSideFallback=false`는 OMP의 Anthropic API server-side refusal fallback을 사용하지 않도록 유지한다. 이는 OMP의 오류/429 fallback과 다른 경로이며 서비스 전체의 fallback을 제어하는 설정으로 해석하지 않는다. 근거: [Anthropic refusal/fallback 문서](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback), OMP 18.2.5 `src/session/settings-stream-fn.ts`(확인: 2026-09-18).
- 역할마다 다른 provider의 fallback 후보 1개를 설정했다(Codex 역할 → Claude Opus 5, `slow`·`plan` → GPT-6 Astra xhigh, `vision` → GPT-6 Astra high, `advisor` → GPT-5.6 Terra high). 실제 전환은 모델·자격증명 가용성과 런타임의 실패·사용량 판정에 좌우된다. 동일 provider 후보를 연쇄 배치하지 않으며, 복구는 `retry.fallbackRevertPolicy=cooldown-expiry` 정책을 따른다.
- `retry.modelFallback=true`, `retry.usageAwareFallback=true`, `retry.usageReservePolicy=auto`로 신뢰 가능한 coding-plan usage report에 매핑된 quota가 잔여 10% 이하일 때 적격 fallback 후보로 확인 프롬프트 없이 전환하도록 설정했다. 일반 configured API key와 unknown/unmapped usage는 선제 quota 전환 대상이 아니며, 사용할 수 있는 fallback이 없으면 전환을 보장하지 않는다.
- 위임 기준은 [서브에이전트](/tools/subagents.md), 도구 우선순위는 [omp 기본 도구](/tools/builtin.md).

---
type: Reference
title: 에이전트 가이드
description: 현재 OMP 빌트인 에이전트 7종의 역할과 modelRoles 라우팅, 커스텀 에이전트 작성 기준.
tags: [agents, subagents, routing, builtin]
timestamp: 2026-09-04T00:00:00Z
---

# 에이전트 가이드

기본 원칙은 현재 OMP 빌트인 에이전트 7종을 그대로 사용하는 것이다 — 같은 이름으로 복제·오버라이드하지 않는다(번들 프롬프트 stale·빌트인 컨텍스트 상속 손실 방지).

- 번들 model alias는 `scout`·`librarian`·`sonic` → `@smol`, `task` → `@task`, `designer` → `@designer`, `reviewer` → `@slow`이다.
- `security-reviewer`는 번들 model 지정이 없어 부모 세션의 모델 선택을 따른다. 별도 라우팅이 필요할 때만 `task.agentModelOverrides`를 사용한다.
- role alias는 `modelRoles`의 모델로 해석되고, 값에 명시한 `:level` suffix가 번들 기본 추론 강도보다 우선한다. 현재 설정은 모든 역할에 suffix를 지정하므로 아래 표의 모델·강도가 함께 적용된다. suffix가 없으면 `scout`·`sonic`은 medium, `librarian`은 minimal이라는 번들 기본값을 따른다.
- OKF 확인·도구 정책은 빌트인이 기본 상속하는 글로벌 `AGENTS.md`로 적용된다.
- 특정 에이전트만 모델을 바꾸려면 파일 복사 대신 `task.agentModelOverrides`(에이전트→모델 문자열)를 쓴다. thinking level 조정은 우선 `modelRoles` suffix로 처리하고, 불가능할 때만 소스 override를 검토한다.

| 빌트인 에이전트 | 역할 | 사용 시점 | 유효 모델 라우팅 |
|------|------|-----------|------|
| `scout` | 읽기 전용 코드베이스 스카우트 | 넓은 탐색, 메인 컨텍스트 보호 | `smol` = gpt-5.6-terra:medium |
| `designer` | UI/UX 구현·리뷰 | 프런트엔드·시각 작업 | `designer` = gpt-5.6-sol:xhigh |
| `reviewer` | 코드 품질·보안 리뷰 | 변경 완료·PR 독립 검토 | `slow` = claude-fable-5-1:xhigh |
| `security-reviewer` | 읽기 전용 취약점 분석 | 근거 기반 저장소 보안 감사 | 부모 세션 모델(필요 시 agent override) |
| `librarian` | 외부 라이브러리/API 소스 검증 | 라이브러리 동작·시그니처 확인 | `smol` = gpt-5.6-terra:medium |
| `task` | 범용 다단계 위임 | 일반 서브에이전트 작업 | `task` = gpt-5.6-sol:xhigh |
| `sonic` | 저추론 기계적 작업 | 단순·반복 기계 작업 | `smol` = gpt-5.6-terra:medium |

## 커스텀 에이전트 작성 시
- 진짜 새 에이전트(새 이름·다른 페르소나)만 `agents/`에 둔다. 단, bundled frontmatter가 품질 요구와 충돌하고 설정 키로 덮을 수 없는 경우에는 원본 OMP 버전과 변경 범위를 주석으로 남긴 동명 override를 허용한다.
- `model`을 반드시 명시한다 — 미설정 시 역할이 아니라 부모 세션 모델을 상속한다.
- 위임받은 에이전트도 작업 전 [OKF](/index.md)의 관련 개념을 확인하고 omp 기본 도구·스킬을 우선한다.

## 참고
- 공유 프로필은 OpenAI Codex Pro와 Claude Fable 5.1을 사용한다. `enabledModels`는 GPT-5.6 Sol/Terra/Luna·GPT-5.3 Codex Spark·Claude Fable 5.1로 한정하며, Fable 권한이 없는 머신은 Anthropic 역할·fallback·enabledModels만 로컬에서 사용 가능한 Claude 모델로 덮어쓴다.
- `default`·`task`·`designer`는 gpt-5.6-sol:xhigh, `smol`·`commit`은 gpt-5.6-terra:medium, `tiny`는 gpt-5.3-codex-spark:low, `slow`·`plan`은 claude-fable-5-1:xhigh, `vision`·`advisor`는 claude-fable-5-1:high다.
- `advisor`는 활성(`advisor.enabled=true`, `syncBacklog=1`)이다. 메인이 GPT-5.6 Sol이라 Claude Fable 5.1 advisor는 다른 모델 계열·다른 quota pool에서 매 턴을 검토한다. 완료 선언 전 독립 검토는 여전히 fresh context `reviewer`·`security-reviewer` 서브에이전트로 한다.
- `vision` 역할은 이미지/시각 입력 보조 모델이며(현재 claude-fable-5-1:high), 일반 서브에이전트 표에는 없지만 `modelRoles.vision`으로 라우팅된다. GPT-5.6 계열과 Claude Fable 5.1은 image input을 지원하고 `gpt-5.3-codex-spark`는 지원하지 않는다.
- `plan`은 plan mode용 모델 역할이며 현재 claude-fable-5-1:xhigh를 사용한다. 빌트인 task agent 이름이 아니며, 테스트 작성은 작업 성격에 맞는 `task` 또는 현재 제공 specialist에 위임한다.
- `tiny`는 제목·메모리·auto-thinking 분류 등 경량 백그라운드 작업에 쓰며 gpt-5.3-codex-spark:low로 분리해 메인 7d Chat pool을 아낀다. Spark는 128K 컨텍스트·이미지 미지원이지만 컨텍스트 초과 시 빌트인 context promotion이 gpt-5.5로 승격한다. `commit`은 분석·map/reduce·changelog·commit 제안 전체 agentic pipeline이라 gpt-5.6-terra:medium을 유지한다.
- OMP 18.0.7부터 원격 모델 카탈로그가 바이너리 업데이트 없이 병합되므로 portable 설정은 모든 실제 모델을 `provider/model-id`로 고정한다.
- quota/429 fallback은 역할당 다른 provider의 동급 모델 1개만 둔다(Codex 레인 → Claude, Claude 레인 → Codex). 동일 provider 모델을 연쇄 재시도해 장애 지연과 행동 드리프트를 늘리지 않고, 복구는 `retry.fallbackRevertPolicy=cooldown-expiry`로 cooldown 종료 시 primary로 되돌린다.
- `retry.modelFallback=true`를 전제로, coding-plan usage report에 매핑된 rolling quota 중 하나라도 잔여 10% 이하이면 `retry.usageAwareFallback=true`와 `retry.usageReservePolicy=auto`가 확인 프롬프트 없이 역할별 단일 교차-provider fallback을 선제 적용한다. 일반 configured API key는 제외되며 quota가 unknown이면 primary를 유지한다.
- 위임 기준은 [서브에이전트](/tools/subagents.md), 도구 우선순위는 [omp 기본 도구](/tools/builtin.md).

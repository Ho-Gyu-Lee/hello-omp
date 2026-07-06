---
type: Reference
title: 에이전트 가이드
description: omp 빌트인 에이전트를 기본 사용하되, reviewer/plan은 bundled thinkingLevel 고정값을 xhigh로 올리기 위해 소스 override를 둔다. 모델은 역할로 라우팅, OKF/도구 정책은 AGENTS.md 상속으로 적용.
tags: [agents, subagents, routing]
timestamp: 2026-06-29T00:00:00Z
---

# 에이전트 가이드

기본 원칙은 omp 빌트인 에이전트 8종을 그대로 사용하는 것이다 — 같은 이름으로 복제·오버라이드하지 않는다(번들 프롬프트 stale·빌트인 컨텍스트 상속 손실 방지).

- 예외: `reviewer`와 `plan`은 bundled frontmatter의 `thinkingLevel: high`가 `modelRoles`의 `:xhigh` suffix보다 우선해 최고품질형이 실제 런타임에 적용되지 않는다. OMP에 에이전트별 thinking override 설정 키가 생기기 전까지 `agents/reviewer.md`, `agents/plan.md`에 원본 버전 주석을 둔 동명 override를 유지한다.
- 모델은 각 에이전트의 `model: pi/<role>` → `modelRoles`로 라우팅된다(아래 표). 별도 설정 불필요.
- OKF 확인·도구 정책은 빌트인이 기본 상속하는 글로벌 `AGENTS.md`로 적용된다.
- 특정 에이전트만 모델을 바꾸려면 파일 복사 대신 `task.agentModelOverrides`(에이전트→모델 문자열)를 쓴다. 단, 이 설정은 bundled `thinkingLevel` 고정값을 덮지 못한다.

| 빌트인 에이전트 | 역할 | 사용 시점 | 모델(modelRoles) |
|------|------|-----------|------|
| explore | 읽기 전용 코드베이스 스카우트 | 넓은 탐색, 메인 컨텍스트 보호 | smol = gpt-5.5:medium |
| librarian | 외부 라이브러리/API 소스 검증 | 라이브러리 동작·시그니처 확인 | smol = gpt-5.5:medium |
| sonic | 저추론 기계적 작업 | 단순·반복 기계 작업 | smol = gpt-5.5:medium |
| task | 범용 다단계 위임 | 일반 서브에이전트 작업 | task = gpt-5.5:xhigh |
| Tester | 테스트 작성·검증 설계 | 고신호 테스트 작성 | task = gpt-5.5:xhigh |
| reviewer | 코드 품질/보안 리뷰 | 변경 완료·PR 검토 | slow = fable-5:xhigh |
| plan | 다중 파일 아키텍처 설계 | 복잡한 설계 결정 | plan = fable-5:xhigh |
| designer | UI/UX 디자인 구현·리뷰 | 프런트엔드/시각 작업 | designer = fable-5:xhigh |

## 커스텀 에이전트 작성 시
- 진짜 새 에이전트(새 이름·다른 페르소나)만 `agents/`에 둔다. 단, bundled frontmatter가 품질 요구와 충돌하고 설정 키로 덮을 수 없는 경우에는 원본 OMP 버전과 변경 범위를 주석으로 남긴 동명 override를 허용한다.
- `model`을 반드시 명시한다 — 미설정 시 역할이 아니라 부모 세션 모델을 상속한다.
- 위임받은 에이전트도 작업 전 [OKF](/index.md)의 관련 개념을 확인하고 omp 기본 도구·스킬을 우선한다.

## 참고
- `advisor`도 `modelRoles.advisor`로 설정되는 역할이며(현재 fable-5:xhigh), advisor 런타임은 매 턴을 자기 모델·컨텍스트로 검토한다.
- `vision` 역할은 이미지/시각 입력 보조 모델이며(현재 fable-5:high), 일반 서브에이전트 표에는 없지만 `modelRoles.vision`으로 라우팅된다.
- 위임 기준은 [서브에이전트](/tools/subagents.md), 도구 우선순위는 [omp 기본 도구](/tools/builtin.md).

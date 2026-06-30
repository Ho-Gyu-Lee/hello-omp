---
type: Reference
title: 에이전트 가이드
description: omp 빌트인 에이전트를 그대로 사용한다(중복 오버라이드 없음). 모델은 역할로 라우팅, OKF/도구 정책은 AGENTS.md 상속으로 적용.
tags: [agents, subagents, routing]
timestamp: 2026-06-29T00:00:00Z
---

# 에이전트 가이드

omp 빌트인 에이전트 8종을 그대로 사용한다 — 같은 이름으로 복제·오버라이드하지 않는다(번들 프롬프트 stale·빌트인 컨텍스트 상속 손실 방지).

- 모델은 각 에이전트의 `model: pi/<role>` → `modelRoles`로 라우팅된다(아래 표). 별도 설정 불필요.
- OKF 확인·도구 정책은 빌트인이 기본 상속하는 글로벌 `AGENTS.md`로 적용된다.
- 특정 에이전트만 모델을 바꾸려면 파일 복사 대신 `task.agentModelOverrides`(에이전트→모델 문자열)를 쓴다.

| 빌트인 에이전트 | 역할 | 사용 시점 | 모델(modelRoles) |
|------|------|-----------|------|
| explore | 읽기 전용 코드베이스 스카우트 | 넓은 탐색, 메인 컨텍스트 보호 | smol = gpt-5.5:medium |
| librarian | 외부 라이브러리/API 소스 검증 | 라이브러리 동작·시그니처 확인 | smol = gpt-5.5:medium |
| quick_task | 저추론 기계적 작업 | 단순·반복 기계 작업 | smol = gpt-5.5:medium |
| task | 범용 다단계 위임 | 일반 서브에이전트 작업 | task = gpt-5.5:xhigh |
| reviewer | 코드 품질/보안 리뷰 | 변경 완료·PR 검토 | slow = opus-4-8:xhigh |
| oracle | 시니어 상담(디버깅·아키텍처) | 어려운 판단·깊은 디버깅 | slow = opus-4-8:xhigh |
| plan | 다중 파일 아키텍처 설계 | 복잡한 설계 결정 | plan = opus-4-8:xhigh |
| designer | UI/UX 디자인 구현·리뷰 | 프런트엔드/시각 작업 | designer = opus-4-8:xhigh |

## 커스텀 에이전트 작성 시
- 진짜 새 에이전트(새 이름·다른 페르소나)만 `agents/`에 둔다. 본문이 그대로 시스템 프롬프트가 된다.
- `model`을 반드시 명시한다 — 미설정 시 역할이 아니라 부모 세션 모델을 상속한다.
- 위임받은 에이전트도 작업 전 [OKF](/index.md)의 관련 개념을 확인하고 omp 기본 도구·스킬을 우선한다.

## 참고
- `advisor`도 `modelRoles.advisor`로 설정되는 역할이며(현재 opus-4-8:xhigh), advisor 런타임은 매 턴을 자기 모델·컨텍스트로 검토한다.
- 위임 기준은 [서브에이전트](/tools/subagents.md), 도구 우선순위는 [omp 기본 도구](/tools/builtin.md).

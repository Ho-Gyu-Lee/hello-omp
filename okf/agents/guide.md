---
type: Reference
title: 에이전트 가이드
description: 번들 에이전트·모델 역할의 연결과 omp 계약(역할≠에이전트·빈 tools·설정 reload), 현재 역할 배정의 이유, 교차 모델 독립 검토 overlay, 구독·인증 경계. 배정 값의 정본은 config/settings.conf.
tags: [agents, subagents, routing, builtin]
timestamp: 2026-10-26T00:00:00Z
---

# 에이전트 가이드

현재 역할별 모델·추론 강도·fallback의 정본은 `config/settings.conf`다. 이 문서는 그 배정의 이유와 omp의 비자명 계약만 둔다.

## 번들 에이전트와 모델 역할
OMP 18.12.1 `omp agents unpack --dir <격리 경로> --json`·`omp://models.md`·`omp://settings.md`, 확인: 2026-10-18. 확인 목적으로 기본 에이전트 디렉터리에 풀어 번들 override를 만들지 않는다.
- 번들은 `scout`·`reviewer`·`security-reviewer`·`task`·`sonic`·`seance` 6종이다. `scout`·`sonic`은 `@smol`(medium), `task`는 `@task`(auto), `reviewer`는 `@slow`로 해석되고, 번들 model 지정이 없는 `security-reviewer`는 `task.agentModelOverrides={"security-reviewer":"@slow"}`로 명시한다. 값에 명시한 `:level` suffix가 번들 기본 추론 강도보다 우선한다. 에이전트별 모델은 파일 복사 대신 이 override로, thinking level은 `modelRoles` suffix로 바꾼다.
- `modelRoles`는 용도별 모델 배정이지 에이전트 등록이 아니다. 역할 이름은 `agent`에 넣을 수 없고(`Unknown agent`로 거부) `librarian`·`designer`는 번들이 아니다. `designer`는 이 프로필의 사용자 정의 chat 별칭이라 `@designer`를 고르거나 참조하는 커스텀 에이전트가 있어야 쓰인다. 미배정 `tiny`는 `@smol`, 미배정 `memory`는 `@tiny`로 해석되고, model-kind 역할(`image`·`web`·`speech`·`dictation`·`judge`)에 일반 chat 모델을 무조건 배정하지 않는다. `advisor`는 역할 배정과 별도로 `advisor.enabled`(OMP 기본 off)로 켜며 노트 출력 지침의 정본은 `rules/WATCHDOG.md`다.
- `generate_image`는 `generate_image.enabled=true`(기본 false)이고 명시적 도구 목록이 있으면 거기에 포함될 때만 등록된다. `openai-codex` 구독 경로는 백엔드가 이미지 모델을 고르므로 OMP에서 지정할 수 없다(`omp://tools/generate_image.md`, [#11322](https://github.com/can1357/oh-my-pi/issues/11322)). OMP 18.12.6에서 GPT Image 2.5를 명시적으로 지정하는 확인된 경로는 OpenAI API 키이며, 카탈로그에 행이 없어(PR #14373 미병합, 확인 2026-10-26) `models.yml`의 `providers.openai.models`에 `api: openai-images` 행을 둔다. 기본 `auth: apiKey`에서 내장 provider에 custom 행을 두면서 provider 수준 `baseUrl`·`apiKey`를 빠뜨리면 검증 실패로 `models.yml`의 custom 설정 전체가 꺼진다(18.12.6 실측). 유료·로컬 경로 선택은 [AI 에셋 생성](/development/ai-asset-generation.md#유료로컬-경로-선택)을 따른다.
- 에이전트 정의의 `tools`를 생략하거나 YAML null로 두면 기본 내장 도구 전체가, 도구 이름이 없는 선언(`[]`·빈 CSV·잘못된 값)은 내장 도구 없음이 선택된다. 어느 쪽이든 MCP·extension·custom 도구는 additive라 `tools`는 격리 수단이 아니다(`omp://task-agent-discovery.md`).

## 현재 배정의 이유
- 메인·계획은 Opus 5.5, 구현 `task`는 Sonnet 5.5다(구현은 사용자의 품질 우선 결정, 2026-10-10). 메인과 구현이 같은 Anthropic 한도·인증에 의존하므로 소모량은 사용량 기록으로 확인한다.
- 정밀 검토 `slow`·화면 분석 `vision`·감시 `advisor`·탐색·커밋은 OpenAI 계열이라 기본 경로에서 메인·구현과 교차 검토가 된다. fallback은 반대 provider를 두어 한도·장애에 대응하며 품질에 따른 자동 상향이 아니다.
- 추론 강도는 난도별이다. 메인·계획·구현·정밀 검토는 xhigh, 디자인·화면 분석·advisor는 high, 탐색·커밋은 medium, 제목·메모리는 low다. 자동 난도 판정과 일괄 xhigh·max 강제는 도입하지 않는다. 이는 운영 판단이지 품질·비용 A/B 결과가 아니며 외부 평가도 로컬 품질 비교가 아니다([정확성](/accuracy.md)).
- Fable 5.1은 기본 역할·fallback에 넣지 않고 고난도에만 `/switch anthropic/claude-fable-5-1:xhigh`(세션 전용)로 고른다. TUI `/model`은 인수 없이 선택기를 열고 선택자는 `/switch`가 받는다(설치본 `src/slash-commands/builtin-modes.ts`, 확인: 2026-10-18).
- `image`는 구독 경로 `openai-codex/gpt-image-2`로 고정하고 fallback을 `[]`로 비우며 `generate_image.enabled=true`로 켠다(사용자 결정, 2026-10-26). 다른 인증이 생겨도 역할 기본 우선순위 목록의 다른 이미지 모델(API 과금 경로일 수 있음)로 자동 전환되지 않게 하려는 것이다. `[]`는 활성 모델 자신의 이미지 후보와 요청의 `model` 인자를 막지 않으므로(OMP 18.12.6, `omp://tools/generate_image.md`) API 키 OpenAI 모델로 세션을 돌리면 Codex 후보가 HTTP 오류(한도 소진 포함)로 실패할 때 그 경로가 쓰일 수 있고, 다른 이미지 인증이 생기면 `model` 지정으로 그 모델이 직접 선택될 수 있다. 경로 선택 방향은 [AI 에셋 생성](/development/ai-asset-generation.md#유료로컬-경로-선택)을 따른다.

## 설정 계약
- 설정 저장 위치는 활성 agent dir의 `config.yml`이다. `omp config set task.agentModelOverrides ...`는 dotted path이지만 YAML에는 `task: { agentModelOverrides: ... }`처럼 중첩해 쓴다.
- 제목 생성 기본값은 메인 모델 fork(OMP 18.8.0~)라 `title.generator=tiny`를 명시해야 한다. `tiny` 배정만으로는 설정되지 않는다.
- `modelRoles`·`retry.fallbackChains`·`task.agentModelOverrides` 변경은 다음 서브 실행·fallback에 재로딩되지만 실행 중인 메인·이미 시작한 서브의 모델은 바꾸지 않는다. CLI/env/overlay/resume 모델은 별도 우선순위다(`omp://settings.md`, 확인: 2026-10-18).
- `retry.usageReservePct` 기반 자동 전환은 신뢰 가능한 coding-plan usage report에서만 동작한다(일반 API key·unknown usage·후보 불가에서는 보장 안 됨). `providers.anthropic.serverSideFallback`은 Anthropic refusal fallback beta의 옵트인이며 OMP의 오류·429·quota fallback과 다르다. 역할·fallback을 모두 쓰려면 두 provider의 유효 인증이 필요하다.
- OMP는 `openai-codex`의 카탈로그 기본 모델을 `gpt-5.5`로 선언하고(`omp://provider-quirks.md`, 확인: 2026-10-18) GPT-5.5는 2026-10-14에 ChatGPT 로그인 Codex에서 은퇴했다(API·API 키 인증 Codex 제외, [Codex 변경 내역](https://developers.openai.com/codex/changelog), 확인: 2026-10-15). 역할을 명시하지 않는 호출 경로가 생기면 별도로 확인한다.

## 현재 역할과 운영 경계
- 기본 경로의 OpenAI reviewer는 Opus 메인·Sonnet 구현과 계열이 달라 교차 검토가 된다. Anthropic 한도·장애로 작성 모델이 OpenAI로 넘어갔다면 같은 OpenAI reviewer만으로 충족하지 않으며 역할표는 이를 자동 분기하지 않으므로, fallback 뒤에는 실제 실행 모델을 확인한다.

## 게임·서버·디자인 사용 경로
사용자의 개발 방향은 [방향](/direction.md)을 따른다.
- 복잡한 클라이언트·서버 구조는 Opus 메인이 요구·불변조건·경계를 정리하고 Sonnet `task`가 구현하며 작성 계열과 다른 reviewer가 검토한다. 수락 기준은 [서버](/game/server-checklist.md)·[클라이언트](/game/client-checklist.md) 체크리스트를 따른다.
- 게임 아트·UI·레벨은 Opus 메인 또는 `@designer` 모델이 방향·대안·추천안을 정하고 Sonnet `task`가 구현하며 Astra `vision`이 실제 화면을 교차 분석한다. 일반 `task`에는 구현 목표·제약·검증 기준을 전달한다. 디자인 요청은 사용자가 세부를 모두 정해 줄 때까지 기다리지 않고 기존 요구와 레퍼런스로 추천안 하나와 이유를 제시하며, 실제 시각 자료가 없으면 관찰한 것처럼 평가하지 않는다.

## 교차 모델 독립 검토
독립 검토가 필요한 산출물의 실제 작성 모델이 OpenAI인 경우(fallback 포함), 작업 산출물 디렉터리에 아래 일회성 YAML을 두고 별도 fresh session의 `reviewer` 또는 `security-reviewer`를 실행한다. `--config`는 그 프로세스에만 적용된다. 검토 범위·수락 기준·변경 파일·실행 근거를 프롬프트로 전달하고 구현자의 자기평가를 주입하지 않는다.

```yaml
# <작업 디렉터리>/anthropic-review.yml
task:
  agentModelOverrides:
    reviewer: "@plan"
    security-reviewer: "@plan"
```

```sh
omp --config <작업디렉터리>/anthropic-review.yml --model @plan -p "<대상과 근거를 지정하고 reviewer 독립 검토를 요청>"
```

- `@plan`은 이 프로필에서 Opus xhigh다. 모델 이름의 자기보고 대신 자식 session의 provider/model 기록을 확인하며, fallback으로 다시 OpenAI가 실행되면 교차 모델 검토가 아니다.
- `/agents`나 `omp config set task.agentModelOverrides`는 전역 영속 변경이고 record 전체 교체로 기존 security reviewer 배정을 잃을 수 있으므로 일회성 검토에 쓰지 않는다.

## 구독과 인증의 경계
설정 파일은 구독 결제·플랜 확인·API 크레딧 수령·인증 전환을 하지 않으며, 일반 API key 크레딧 잔액은 `retry.usageReservePct`가 보는 coding-plan quota와 다르다.
- Anthropic: 구독 OAuth는 자사 앱용이고 제3자 사용의 허용 범위는 공식 문서마다 다르다([법적 고지](https://code.claude.com/docs/en/legal-and-compliance), [Agent SDK 안내](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan), 조회: 2026-10-15). OMP의 `anthropic` OAuth 요청은 Claude Code User-Agent와 시스템 프롬프트를 보내므로(`omp://provider-quirks.md`, 확인: 2026-10-15) 응답 성공·한도 차감을 허용 근거로 쓰지 않는다. 정책상 분명한 경로는 API 키와 [Max·Team 월 API 크레딧](https://support.claude.com/en/articles/17154008-monthly-api-credits-for-max-and-team-plans)(구독 한도와 별개)이며, 저장 OAuth가 환경 변수 API 키보다 우선하므로 API 키 경로는 명시적으로 설정한다(`omp://providers.md`, 확인: 2026-10-15).
- OpenAI: OMP의 `openai-codex` 로그인은 고정 Codex CLI client ID를 재사용해 OpenAI의 [오픈소스 구독 연동](https://developers.openai.com/siwc/token-sharing-open-source/sign-in)(`dynamic_agent_client` 동적 등록) 경로가 아니며 이 경로의 공식 허용·금지는 확인되지 않았다(`omp://provider-quirks.md`, 확인: 2026-10-15). 성공한 실호출을 공식 승인으로 확대하지 않는다.
- Google: [Antigravity 약관](https://antigravity.google/terms) §6과 [Gemini CLI FAQ](https://github.com/google-gemini/gemini-cli/blob/main/docs/resources/faq.md)는 제3자 도구가 Antigravity·Gemini CLI OAuth로 백엔드에 접근하는 것을 위반·계정 정지 사유로 명시한다(조회: 2026-10-10). OMP의 `google-gemini-cli`·`google-antigravity`는 이 제품 OAuth로 내부 백엔드에 직접 추론하므로(`omp://provider-quirks.md`) OMP 추론 자격증명으로 쓰지 않고 `google`(`GEMINI_API_KEY`)·`google-vertex`를 쓴다.

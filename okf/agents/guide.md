---
type: Reference
title: 에이전트 가이드
description: 빌트인 에이전트와 모델 역할 전체 목록, 미배정 해석, 실사용 평가와 역할 배정·실행의 구분, 커스텀 에이전트 작성 기준.
tags: [agents, subagents, routing, builtin]
timestamp: 2026-10-05T00:00:00Z
---

# 에이전트 가이드

OMP 18.3.2의 `omp agents unpack --dir <격리 경로> --json` 출력에서 빌트인 에이전트 `scout`·`reviewer`·`security-reviewer`·`task`·`sonic` 5종과 아래 model alias를 확인했다(확인: 2026-09-26). 기본 원칙은 제공되는 빌트인을 그대로 사용하는 것이다 — 동명 복제·오버라이드는 번들 프롬프트와 기본값의 갱신을 놓칠 수 있으므로 피한다.

- 번들 model alias는 `scout`·`sonic` → `@smol`, `task` → `@task`, `reviewer` → `@slow`이다.
- `security-reviewer`는 번들 model 지정이 없어 부모 세션의 모델 선택을 따른다. 별도 라우팅이 필요할 때만 `task.agentModelOverrides`를 사용한다.
- role alias는 `modelRoles`의 모델로 해석되고, 값에 명시한 `:level` suffix가 번들 기본 추론 강도보다 우선한다. 현재 설정은 모든 역할에 suffix를 지정하므로 아래 표의 모델·강도가 함께 적용된다. suffix가 없으면 `scout`·`sonic`은 medium이라는 번들 기본값을 따른다.
- OKF 확인·도구 정책은 빌트인이 기본 상속하는 글로벌 `AGENTS.md`로 적용된다.
- 특정 에이전트만 모델을 바꾸려면 파일 복사 대신 `task.agentModelOverrides`(에이전트→모델 문자열)를 쓴다. thinking level 조정은 우선 `modelRoles` suffix로 처리하고, 불가능할 때만 소스 override를 검토한다.

| 빌트인 에이전트 | 역할 | 사용 시점 | 관리 소스 모델 라우팅 |
|------|------|-----------|------|
| `scout` | 읽기 전용 코드베이스 스카우트 | 넓은 탐색, 메인 컨텍스트 보호 | `smol` = gpt-6.1-sol:medium |
| `reviewer` | 코드 품질·보안 리뷰 | 변경 완료·PR 독립 검토 | `slow` = claude-opus-5-5:xhigh |
| `security-reviewer` | 읽기 전용 취약점 분석 | 근거 기반 저장소 보안 감사 | 부모 세션 모델(필요 시 agent override) |
| `task` | 범용 다단계 위임 | 일반 서브에이전트 작업 | `task` = gpt-6-astra:xhigh |
| `sonic` | 저추론 기계적 작업 | 단순·반복 기계 작업 | `smol` = gpt-6.1-sol:medium |

## 가용 에이전트와 모델 역할의 구분
- 위임에는 현재 세션에 제공된 에이전트 이름만 사용한다. 커스텀 정의·확장·비활성화 설정에 따라 가용 목록은 달라질 수 있으며, 목록에 없는 이름은 실행 전 검사에서 `Unknown agent`로 거부된다.
- `librarian`·`designer`는 확인한 설치본의 빌트인이 아니다. 라이브러리/API 조사는 `read`·`web_search`로 직접 처리하고 넓은 읽기 전용 조사는 `scout`에, UI/UX 구현은 `task`에, 코드 리뷰는 `reviewer`에 위임한다.
- `modelRoles`는 작업 용도별 모델 배정이며 에이전트를 등록하거나 상시 실행하는 설정이 아니다. 메인이 `task` 에이전트를 실행하면 `@task`가 해석되지만, 모델 역할 이름을 그대로 `agent`에 넣어서는 안 된다.
- 공유 프로필의 `modelRoles.designer`와 해당 fallback은 유효한 사용자 정의 역할 별칭으로 유지한다. `@designer`를 명시적으로 선택하거나 이를 참조하는 커스텀 에이전트를 등록해야 사용되며, 설정만으로 UI/UX 에이전트가 자동 실행되지는 않는다.
- `plan`은 계획 모드, `commit`은 OMP 커밋 생성 기능, `vision`은 이미지 질문·설명 경로, `tiny`는 경량 보조 기능에서 선택되는 모델 역할이다. `advisor`는 역할 배정과 별도로 `advisor.enabled` 또는 `/advisor on`으로 활성화해야 한다.
- advisor 노트의 출력 언어는 관리 소스 `rules/WATCHDOG.md`를 active agent dir의 `WATCHDOG.md`로 배포해 지정한다. 지적 내용·근거·권고는 한국어 존댓말로 작성하고 코드·설정 키·도구 필드·severity 값은 원문을 유지한다. 이 파일은 advisor 전용 시스템 지침이며 감시의 활성 여부·심각도·검토 범위를 바꾸지 않는다. 근거: `omp://advisor-watchdog.md`의 WATCHDOG.md(확인: 2026-09-18).
- 설치본의 번들 정의는 `omp agents unpack --dir <별도 검증 디렉터리> --json`으로 내보내 확인할 수 있다. 확인 목적으로 기본 사용자·프로젝트 에이전트 디렉터리에 풀어 빌트인 override를 만들지 않는다. 실제 위임 가능 여부는 현재 세션의 가용 목록을 기준으로 한다.

## 모델 역할 전체 목록과 미배정 해석

OMP 18.3.2의 [모델 문서](omp://models.md)·[설정 문서](omp://settings.md)와 유효 설정을 대조했다(확인: 2026-09-26). 설정 파일에 값이 있는 역할만 나열하면 미배정 기본 역할이 빠지므로 지원 목록과 명시 배정을 구분한다.

| 구분 | 기본 역할 | 의미 |
|------|-----------|------|
| Chat | `default`, `smol`, `slow`, `vision`, `plan`, `commit`, `tiny`, `memory`, `task`, `advisor` | 대화·추론·이미지 분석·에이전트·백그라운드 작업의 모델 선택 |
| Model-kind | `image`, `web`, `speech`, `dictation`, `judge` | 이미지 생성·검색/검색 기반 응답·TTS·STT·판정 runner 선택 |

- `designer`는 공유 프로필의 사용자 정의 chat 별칭이지 기본 역할이나 빌트인 에이전트가 아니다.
- `tiny`가 미배정이면 `@smol`, `memory`가 미배정이면 `@tiny`를 통해 해석한다. 명시 배정 없음은 기능 비활성화를 뜻하지 않는다.
- `tiny`·`memory`는 chat 및 tiny 카탈로그 모델을 받을 수 있고, `judge`는 judge 외에 chat·tiny도 허용한다. 다른 model-kind 역할에 일반 chat 모델을 무조건 배정하지 않는다.
- `vision`은 이미지 입력 분석, `image`는 이미지 생성이다. SVG 코드를 작성하거나 검색 도구를 사용한 성공 사례만으로 이미지 생성·검색 runner 지원을 입증하지 않는다.

## 실사용 평가를 역할 추천에 적용할 때

- 외부 출처·독립 표본·벤치마크 비교 가능성의 일반 기준은 [정확성의 기간별 트렌드·인기 자료](/accuracy.md)를 따른다.
- 역할별 비교에는 모델 버전·도구 권한·프롬프트·추론 강도를 함께 확인한다. 한 평가 pipeline의 Standard/Max 명칭을 API effort 값으로 치환하지 않는다.
- 구현 성공을 이미지 독해·위험 감시·판정 정확도의 증거로 확대하지 않는다. 해당 역할의 직접 근거가 없으면 조건부 후보 또는 현행 유지로 표시한다. 작성자와 검토자는 실제 실행 모델을 기준으로 분리하며 역할명이나 fallback 설정만으로 독립성을 보장하지 않는다.
- API 토큰 단가, 성공 작업당 총사용량, 구독 quota를 구분한다. 카탈로그 등재·허용 목록·계정 접근 권한·실제 도구 왕복 성공은 서로 다른 확인 단계다. 외부 리뷰에 근거한 추천을 로컬 비교검증 결과나 사용자가 채택한 영속 정책으로 기록하지 않는다.

## 2026-10-05 모델 선정 근거

- 이 문서의 배정표는 **관리 소스 프로필**을 설명한다. 소스 변경·전역 적용·실제 호출을 구분하며 적용 상태는 프로젝트 지도에서 확인한다. 이번 검토는 OMP 18.6.1의 갱신된 카탈로그와 공식 API 문서를 대조했다.
- [OpenAI 공식 가이드](https://openai.com/index/practical-guide-building-gpt-6/)(10월 2일)는 Astra를 최고 난도 추론, [GPT-6.1 Sol](https://openai.com/index/introducing-gpt-6-1-sol/)(9월 29일)을 복잡한 코딩·조사, Luna를 반복 분류·추출·구조화 요약에 배치한다. `smol`·`commit`과 advisor의 OpenAI fallback만 구 Sol에서 6.1로 갱신하고 Astra·Luna는 유지한다. [Sol API](https://developers.openai.com/api/docs/models/gpt-6.1-sol)는 low·medium·high·xhigh·max를 지원하며 기본값은 medium이다. 이 프로필은 medium/high를 선택하고 도구 호출에는 Responses 경로를 사용한다.
- [Artificial Analysis 자체 평가](https://artificialanalysis.ai/articles/gpt-6-1-sol-replaces-gpt-6-sol-after-just-7-days-with-near-astra-intelligence)(9월 29일)의 Astra 근접 코딩 결과는 max/xhigh 기준이다. [Paweł Huryn의 실제 코드 수정 실험](https://github.com/phuryn/bug-hunt-bench/blob/main/results/run-notes.md)(10월 1일 갱신본)은 두 코드베이스의 105개 결함에서 구 Sol→6.1 Sol의 medium 결과를 14→29, high를 20→36.5로 보고했다. 구 Sol은 각 1회, 새 Sol은 각 2회 평균이며 Codex CLI도 0.155.1→0.159.0으로 달라 순수 모델 효과를 분리하지 못한다. 이 근거로 같은 경량 역할의 후속 모델을 선택하되 medium을 Astra와 동급으로 주장하거나 OMP 로컬 비교 결과로 확대하지 않는다.
- [Codex 사용자 신고 #50121](https://github.com/openai/codex/issues/50121)(10월 1일)은 Sol 6.1 xhigh와 GPT-5.6의 경험 비교이며 통제 재현이 아니다. [#49828](https://github.com/openai/codex/issues/49828)은 Sol 6.1 high/Fast의 지시 이행·자기검증 실패도 보고한다. 실패 신고로 보편적 실패율이나 사용자 합의를 판정하지 않는다. Astra 유지는 공식 난도별 배치와 기존 상급 우선 정책에 따른다. advisor fallback 갱신은 기존 Sol high 경로의 후속 교체이지 위험 감시 정확도 향상의 증거가 아니며, 주 advisor(Opus)와 완료 전 독립 검토를 유지한다.
- [Anthropic 현행 모델](https://platform.claude.com/docs/en/models/overview)은 Opus 5.5·Fable 5.1·Sonnet 5.5·Haiku 4.5다. Opus는 개방적인 다단계 코딩·지식 작업, Fable은 Opus 상위 effort로 부족한 추론, [Sonnet](https://www.anthropic.com/claude-sonnet-5-5)은 범위가 명확한 작업, Haiku는 경량 응답이 공식 용도다. [Wmedia의 실사용 비교](https://wmedia.es/en/tips/claude-code-sonnet-5-5-vs-opus-5-5-benchmark)(9월 29일)는 작은 PHP 저장소의 네 과제에서 Sonnet과 Opus가 모두 통과하고 Sonnet의 비용·응답 효율이 좋았다고 보고한다. 위 Bug Hunt에서는 xhigh의 두 모델 평균이 같고 medium은 Opus, high/max는 Sonnet이 높았지만 Sonnet max의 비용 부담도 컸다. high의 Sonnet 실행별 편차는 모델 간 평균 차이보다 컸으며, 이 결과는 작은 표본의 코드 수정이지 계획·검토 전체의 우열이 아니다. 이 혼합된 과제별 결과와 기존 상급 우선 정책에 따라 Opus를 유지하고, 범위가 명확하고 비용 민감한 작업에는 Sonnet을 대안으로 둔다.
- Fable의 이미지 입력 지원과 이미지 **이해 정확도 우위**는 다르다. [공식 선택 가이드](https://platform.claude.com/docs/en/about-claude/models/choosing-a-model)는 Opus의 vision-heavy workflows와 Sonnet의 visual understanding도 권장한다. Fable은 공식 비교표에서 응답 지연·API 단가 부담이 더 크며, Max·premium 좌석에서는 주간 한도를 더 빨리 소모하고 Pro/standard 좌석에서는 별도 과금된다. 독립 이미지 비교가 부족하므로 `vision` 유지가 최적·최저비용이라는 뜻은 아니다. 기존 상급 프로필은 유지하되 Fable 별도 과금을 원하지 않는 Pro/standard 계정에는 Opus 전용 프로필을 제공한다. [Mythos 5.1](https://platform.claude.com/docs/en/models/mythos-5-1/overview)은 초대 전용이므로 카탈로그에 있다는 이유로 배정하지 않는다. `image`·`web`·`speech`·`dictation`·`judge` 같은 별도 model-kind 역할도 일반 chat 모델로 채우지 않는다.

## 커스텀 에이전트 작성 시
- 진짜 새 에이전트(새 이름·다른 페르소나)만 `agents/`에 둔다. 단, bundled frontmatter가 품질 요구와 충돌하고 설정 키로 덮을 수 없는 경우에는 원본 OMP 버전과 변경 범위를 주석으로 남긴 동명 override를 허용한다.
- `model`을 반드시 명시한다 — 미설정 시 역할이 아니라 부모 세션 모델을 상속한다.
- 위임받은 에이전트도 작업 전 [OKF](/index.md)의 관련 개념을 확인하고 omp 기본 도구·스킬을 우선한다.

## 참고
- 기본 공유 프로필은 OpenAI Codex와 Anthropic 모델을 함께 사용한다. `enabledModels`는 GPT-6 Astra·GPT-6.1 Sol·GPT-6 Luna·Claude Opus 5.5·Claude Fable 5.1의 전체 목록이며 모든 주 모델과 fallback 후보가 포함되어야 한다. 선택된 역할·교차-provider fallback을 사용하려면 해당 provider의 유효 인증이 필요하며, 프로필 전체를 의도대로 사용하려면 두 provider를 모두 인증한다.
- `default`·`task`는 gpt-6-astra:xhigh, `designer`·`slow`·`plan`은 claude-opus-5-5:xhigh, `smol`·`commit`은 gpt-6.1-sol:medium, `tiny`·`memory`는 gpt-6-luna:low, `vision`은 claude-fable-5-1:high, `advisor`는 claude-opus-5-5:high다.
- 상급 모델 우선 정책에 따라 `default`·`task`에도 Astra를 사용하고 `extendedContext=true`를 유지한다. 모델 선택에 폐기된 컨텍스트 제한을 적용하지 않으며, 실제 컨텍스트는 provider·모델 카탈로그·유효 설정으로 확인한다. UI/UX 구현은 별도 에이전트 등록 없이 범용 `task`에 위임할 수 있다.
- `extendedContext=true`는 OMP 카탈로그가 지원하는 확장 컨텍스트를 허용하는 로컬 정책이며, API 장문 가격 구간을 넘을 수 있다. 특정 구독의 입력 한도나 quota를 보장하지 않는다. Astra에도 장문 가격 구간이 있으며, API 가격과 구독 quota 소모율은 구분한다. 고정 단가를 운영 규칙으로 복제하지 않고 [OpenAI 모델 문서](https://developers.openai.com/api/docs/models/gpt-6-astra)·[가격표](https://developers.openai.com/api/docs/pricing)와 실제 provider usage report를 확인한다(공식 문서·OMP 18.2.5 `src/config/model-registry.ts` 확인: 2026-09-18).
- 비동기 `advisor`는 작업 중 위험 감시를 위해 기본 활성(`advisor.enabled=true`)이다. `modelRoles.advisor=anthropic/claude-opus-5-5:high`와 `syncBacklog=1`을 유지한다. 실제 실행 모델은 fallback으로 달라질 수 있으므로 역할 배정만으로 검토 독립성이나 quota 분리를 보장하지 않는다. 출력 정리만을 위해 감시를 임의로 끄지 않는다.
- 위험 변경은 구현 전 설계 검토를 수행하고, 완료 전에는 fresh context `reviewer`·`security-reviewer`의 결과를 직접 수신해 지적을 판단·반영·재검증한 뒤 통합 최종본을 전달한다. advisor 카드 표시와 `syncBacklog=1`은 검토 반영이나 최종 답변 승인을 보장하지 않는다. 이미 수신한 advisor 지적과 공개 답변을 바꾸는 추가 의견은 [워크플로](/workflow.md)와 [응답 원칙](/response-principles.md)에 따라 처리한다.
- Astra가 작성하는 기본 경로는 `reviewer`의 `@slow`(Opus 5.5)와 계열이 다르다. `designer`·`plan` 또는 fallback으로 Anthropic이 작성한 산출물은 Astra 등 반대 계열 검토를 명시적으로 선택한다. 정적 역할표는 이 조건을 자동 분기하지 않으며 검토가 작성 계열로 fallback되면 교차 모델 독립 검토를 충족한 것으로 세지 않는다. `security-reviewer`의 부모 모델 상속도 별도로 확인한다.
- 기본 프로필의 `vision`은 claude-fable-5-1:high, 교차-provider fallback 후보는 gpt-6-astra:high다. 두 모델의 이미지 입력 능력과 해당 계정·연동 경로의 실제 사용 가능 여부를 구분한다. 일반 서브에이전트 표에는 없지만 `modelRoles.vision`으로 설정된다.
- `plan`은 plan mode용 모델 역할이며 claude-opus-5-5:xhigh를 사용한다. 빌트인 task agent 이름이 아니며, 테스트 작성은 작업 성격에 맞는 `task` 또는 현재 제공 specialist에 위임한다.
- [Anthropic 플랜 안내](https://support.claude.com/en/articles/15424964-claude-fable-models-on-your-plan)에 따르면 Fable 5.1은 유료 플랜에서 제공되지만 Pro·Team standard는 첫 사용부터 별도 usage credits가 필요하다. Max·premium 좌석도 기존 주간 한도의 일부를 쓰므로 추가 quota가 아니다(확인: 2026-10-05). `HELLO_OMP_ANTHROPIC_PLAN=pro`는 이 저장소의 선택형 Opus 전용 프로필이며 구독 권한 제한을 뜻하지 않는다. Fable 별도 과금을 원하지 않으면 이 옵션을 선택한다. 오버레이는 `modelRoles`·`enabledModels` 두 키만 재정의해 `vision`도 Opus 5.5로 배정하고 Fable을 허용 목록에서 제외한다. `retry.fallbackChains`는 기본 프로필에서 상속하므로 OpenAI로의 전환은 유지된다. 배열은 전체 교체되므로 상속된 fallback 후보도 선택형 프로필의 허용 목록에 포함해야 한다.
- `tiny`는 제목·auto-thinking 분류 등 경량 백그라운드 작업에 gpt-6-luna:low를 사용한다. `memory`도 같은 모델과 Opus 5.5 low fallback을 명시해 `default` 체인 변경의 영향을 분리한다. `commit`은 분석·map/reduce·changelog·commit 제안 전체 agentic pipeline이라 gpt-6.1-sol:medium을 사용한다. Spark는 이 프로필의 역할·`enabledModels`에 포함하지 않으며, 이 선택이나 특정 카탈로그의 부재를 서비스 전체의 지원 종료로 해석하지 않는다. 실제 가용성은 계정·클라이언트·provider 카탈로그로 확인한다.
- OMP는 원격 모델 카탈로그와 로컬 캐시를 사용한다. portable 설정은 실제 모델을 `provider/model-id`로 고정하되, ID를 설정했다는 사실만으로 가용성·계정 권한·호출 성공을 보장하지 않는다.
- Opus가 필요한 명시적 역할·fallback에는 `anthropic/claude-opus-5-5`를 지정한다. `providers.anthropic.serverSideFallback=false`는 OMP의 Anthropic API server-side refusal fallback을 사용하지 않도록 유지한다. 이는 OMP의 오류/429 fallback과 다른 경로이며 서비스 전체의 fallback을 제어하는 설정으로 해석하지 않는다. 이 비활성 정책의 기존 근거는 [Anthropic refusal/fallback 문서](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)와 OMP 18.2.5 `src/session/settings-stream-fn.ts` 확인(2026-09-18)이며, 이번 전환은 서버 측 fallback을 활성화하지 않는다.
- 명시한 11개 역할마다 다른 provider의 fallback 후보 1개를 설정한다(Codex 역할 → Claude Opus 5.5, `designer`·`slow`·`plan` → GPT-6 Astra xhigh, `vision` → GPT-6 Astra high, `advisor` → GPT-6.1 Sol high). `tiny`·`memory`는 Opus 5.5 low를 사용한다. 실제 전환은 모델·자격증명 가용성과 런타임의 실패·사용량 판정에 좌우된다. 동일 provider 후보를 연쇄 배치하지 않으며, 복구는 `retry.fallbackRevertPolicy=cooldown-expiry` 정책을 따른다.
- `retry.modelFallback=true`, `retry.usageAwareFallback=true`, `retry.usageReservePolicy=auto`, `retry.usageReservePct=1`로 신뢰 가능한 coding-plan usage report에 매핑된 quota가 잔여 1% 이하일 때 적격 fallback 후보로 확인 프롬프트 없이 전환하도록 설정했다. 일반 configured API key와 unknown/unmapped usage는 선제 quota 전환 대상이 아니며, 사용할 수 있는 fallback이 없으면 전환을 보장하지 않는다.
- 위임 기준은 [서브에이전트](/tools/subagents.md), 도구 우선순위는 [omp 기본 도구](/tools/builtin.md).

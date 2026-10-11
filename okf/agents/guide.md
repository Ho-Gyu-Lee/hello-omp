---
type: Reference
title: 에이전트 가이드
description: 빌트인 에이전트와 모델 역할 전체 목록, 미배정 해석, 실사용 평가와 역할 배정·실행의 구분, 커스텀 에이전트 작성 기준.
tags: [agents, subagents, routing, builtin]
timestamp: 2026-10-10T00:00:00Z
---

# 에이전트 가이드

OMP 18.8.3의 `omp agents unpack --dir <격리 경로> --json` 출력에서 빌트인 에이전트 `scout`·`reviewer`·`security-reviewer`·`task`·`sonic` 5종과 아래 model alias를 확인했다(확인: 2026-10-08). 기본 원칙은 번들 정의를 그대로 사용하는 것이다. 동명 프롬프트 복제 대신 역할·설정 키로 라우팅한다.

- 번들 model alias는 `scout`·`sonic` → `@smol`, `task` → `@task`, `reviewer` → `@slow`이다.
- `security-reviewer`는 번들 model 지정이 없다. 공유 설정은 `task.agentModelOverrides={"security-reviewer":"@slow"}`로 메인 상속 대신 검토 역할을 명시한다.
- role alias는 `modelRoles`의 모델로 해석되고, 값에 명시한 `:level` suffix가 번들 기본 추론 강도보다 우선한다. 현재 설정은 모든 역할에 suffix를 지정하므로 아래 표의 모델·강도가 함께 적용된다. suffix가 없으면 `scout`·`sonic`은 medium이라는 번들 기본값을 따른다.
- OKF 확인·도구 정책은 빌트인이 기본 상속하는 글로벌 `AGENTS.md`로 적용된다.
- 특정 에이전트만 모델을 바꾸려면 파일 복사 대신 `task.agentModelOverrides`(에이전트→모델 문자열)를 쓴다. thinking level 조정은 우선 `modelRoles` suffix로 처리하고, 불가능할 때만 소스 override를 검토한다.

| 빌트인 에이전트 | 역할 | 사용 시점 | 관리 소스 모델 라우팅 |
|------|------|-----------|------|
| `scout` | 읽기 전용 코드베이스 스카우트 | 넓은 탐색, 메인 컨텍스트 보호 | `smol` = gpt-6.1-sol:medium |
| `reviewer` | 코드 품질·보안 리뷰 | 변경 완료·PR 독립 검토 | `slow` = gpt-6-astra:xhigh |
| `security-reviewer` | 읽기 전용 취약점 분석 | 근거 기반 저장소 보안 감사 | 설정 override `@slow` = gpt-6-astra:xhigh |
| `task` | 범용 다단계 위임 | 일반 서브에이전트 작업 | `task` = claude-sonnet-5-5:xhigh |
| `sonic` | 기계적 작업 | 단순·반복 기계 작업 | `smol` = gpt-6.1-sol:medium |

## 가용 에이전트와 모델 역할의 구분
- 위임에는 현재 세션에 제공된 에이전트 이름만 사용한다. 커스텀 정의·확장·비활성화 설정에 따라 가용 목록은 달라질 수 있으며, 목록에 없는 이름은 실행 전 검사에서 `Unknown agent`로 거부된다.
- `librarian`·`designer`는 확인한 설치본의 빌트인이 아니다. 라이브러리/API 조사는 `read`·`web_search`로 직접 처리하고 넓은 읽기 전용 조사는 `scout`에, UI/UX 구현은 `task`에, 코드 리뷰는 `reviewer`에 위임한다.
- `modelRoles`는 작업 용도별 모델 배정이며 에이전트를 등록하거나 상시 실행하는 설정이 아니다. 메인이 `task` 에이전트를 실행하면 `@task`가 해석되지만, 모델 역할 이름을 그대로 `agent`에 넣어서는 안 된다.
- 공유 프로필의 `modelRoles.designer`와 해당 fallback은 유효한 사용자 정의 역할 별칭으로 유지한다. `@designer`를 명시적으로 선택하거나 이를 참조하는 커스텀 에이전트를 등록해야 사용되며, 설정만으로 UI/UX 에이전트가 자동 실행되지는 않는다.
- `plan`은 계획 모드, `commit`은 OMP 커밋 생성 기능, `vision`은 이미지 질문·설명 경로, `tiny`는 경량 보조 기능에서 선택되는 모델 역할이다. `advisor`는 역할 배정과 별도로 `advisor.enabled` 또는 `/advisor on`으로 활성화해야 한다.
- advisor 노트의 출력 언어는 관리 소스 `rules/WATCHDOG.md`를 active agent dir의 `WATCHDOG.md`로 배포해 지정한다. 지적 내용·근거·권고는 한국어 존댓말로 작성하고 코드·설정 키·도구 필드·severity 값은 원문을 유지한다. 이 파일은 advisor 전용 시스템 지침이며 감시의 활성 여부·심각도·검토 범위를 바꾸지 않는다. 근거: `omp://advisor-watchdog.md`의 WATCHDOG.md(확인: 2026-09-18).
- 설치본의 번들 정의는 `omp agents unpack --dir <별도 검증 디렉터리> --json`으로 내보내 확인할 수 있다. 확인 목적으로 기본 사용자·프로젝트 에이전트 디렉터리에 풀어 빌트인 override를 만들지 않는다. 실제 위임 가능 여부는 현재 세션의 가용 목록을 기준으로 한다.

## 모델 역할 전체 목록과 미배정 해석

OMP 18.8.3의 [모델 문서](omp://models.md)·[설정 문서](omp://settings.md)와 유효 설정을 대조했다(확인: 2026-10-08). 지원 역할과 명시 배정을 구분한다.

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

## 2026-10-08 모델 선정 근거

이 문서는 **관리 소스의 선택**을 설명한다. 공식 원문·사용자 리뷰 조회 기준은 2026-10-08이며(구현 역할 변경 항목은 2026-10-10), 출시일과 조회일은 다르다. 소스·로컬 적용·실호출 상태는 프로젝트 지도에서 구분한다. 외부 결과를 OMP 로컬 품질 비교로 해석하지 않는다.

- **구현 역할 변경(2026-10-10):** 사용자의 품질 우선 결정으로 `task`를 Sonnet 5.5 xhigh로, fallback을 Sol 6.1 xhigh로 바꿨다. 근거는 [Vals Terminal-Bench 4.0](https://www.vals.ai/benchmarks/terminal-bench-4)(10-07, 동일 하네스 avg@3)의 Sonnet 64.14%(제공자 fallback 처리분을 실패로 보면 62.63%) 대 Sol 6.1 55.05%와, 기본 `task` 산출물이 OpenAI `slow` reviewer로 교차 검토되는 구조다. 같은 표의 API 가격 기준 테스트당 비용은 토큰 단가가 같은 두 모델에서 Sonnet $16.51·Sol $1.72로 토큰 사용량 차이를 시사하지만, OMP 구독 quota 차감을 측정한 값은 아니다. 구현을 옮기면 메인과 구현이 같은 Anthropic 구독 한도·인증에 의존해 한도·위험이 집중되며, 실제 소모량은 사용량 기록으로 확인한다. 과제의 약 3/4이 전통적 소프트웨어 밖이므로 게임 개발 품질의 A/B 결과가 아니다. `advisor`는 메인과 다른 계열 감시, `slow`는 교차 검토, `vision`·`smol`·`commit`·`tiny`는 Sonnet 우위 근거 부재로 유지한다.
- **OpenAI:** [공식 목록](https://developers.openai.com/api/docs/models/)의 권장군은 GPT-6 Astra·GPT-6.1 Sol·GPT-6 Luna다. [6.1 Sol 발표](https://openai.com/index/introducing-gpt-6-1-sol/)는 9월 29일이며, [10월 7일 Chat 발표](https://openai.com/index/gpt-6-for-everyone/)는 Work·Codex 모델이 바뀌지 않는다고 명시한다. [공식 용도 가이드](https://openai.com/index/practical-guide-building-gpt-6/)는 일반 구현·조사에 Sol, 정밀 검토·시각 분석에 Astra, 분류·요약에 Luna를 권한다. 이 프로필은 Astra를 정밀 검토·화면 분석, Luna를 제목·메모리, Sol을 탐색·커밋·advisor와 구현 fallback에 배치한다. 10-08의 Sol 기본 구현 배정은 위 구현 역할 변경으로 대체됐다. Sol 6.1의 도구 호출은 Responses 경로를 사용하며 `none`·`minimal`을 지정하지 않는다.
- **Anthropic:** [현행 목록](https://platform.claude.com/docs/en/models/overview)은 Opus 5.5·Fable 5.1·Sonnet 5.5·Haiku 5.5다. 가장 최근 발표인 [Haiku 5.5](https://www.anthropic.com/claude-haiku-5-5)(10월 7일)는 대량 경량 작업용이지 상급 메인 대체가 아니다. Opus는 개방적인 agentic coding·지식 작업의 시작점이며, [선택 가이드](https://platform.claude.com/docs/en/about-claude/models/choosing-a-model)는 Opus 상위 effort로 부족할 때 Fable을 권한다. [Mythos 5.1](https://platform.claude.com/docs/en/models/mythos-5-1/overview)은 승인 조직용이므로 배정하지 않는다.
- **고난도 개발·역할별 차등 정책:** 주력 개발은 어렵다고 전제하되 보조 업무까지 같은 난도로 취급하지 않는다. 메인·계획·구현·정밀 검토는 xhigh, 디자인·화면 분석·advisor는 high, 탐색·커밋은 medium, 제목·메모리는 low로 구분하며 fallback에도 같은 역할 수준을 명시한다. [Claude effort 문서](https://platform.claude.com/docs/en/build-with-claude/effort)와 [Amp의 high 운용](https://ampcode.com/news/opus-5.5)처럼 높은 effort가 항상 우수한 것은 아니다. 이 배정은 역할별 운영 판단이지 품질·비용 A/B 결과가 아니며, 자동 난도 판정·일괄 xhigh·max 강제는 도입하지 않는다.
- **버그 수정 실험:** [Paweł Huryn Bug Hunt](https://github.com/phuryn/bug-hunt-bench/blob/main/results/run-notes.md)(10월 7일 갱신본)는 두 저장소 105개 결함에서 Astra max 3회 평균 45, Sol 6.1 max 3회 평균 44.3, Sol high 2회 평균 36.5를 보고했다. 실행별 편차·CLI·평가기·effort가 달라 확정 순위가 아니며, Sonnet 5.5 max도 더 높은 평균과 큰 편차를 보여 회사 전체 우열을 확정할 수 없다. 10-08의 Sol 구현 배정은 공식 용도와 이 혼합된 실사용 근거를 고려한 운영 선택이었고 위 구현 역할 변경으로 대체됐다. 어느 배정도 대규모 게임 서버·디자인의 A/B 우위를 검증한 결과가 아니다.
- **실사용 채택과 반대 사례:** [openclaw autoreview #299](https://github.com/openclaw/agent-skills/issues/299)(9월 29일 게시, 10월 1일 갱신)는 Sol 6.1 high 리뷰 채택과 served-model 확인을 보고한다. 반면 [Codex #50121](https://github.com/openai/codex/issues/50121)(10월 1일)은 xhigh의 지시 이행·완수 퇴행을, [#43163](https://github.com/openai/codex/issues/43163)은 Astra의 무해한 입력 차단을 보고한다. 채택 사례와 개별 실패 신고 모두 보편적 성공률·사용자 합의는 아니다.
- **Claude의 작은 과제 비교:** [Wmedia Sonnet/Opus](https://wmedia.es/en/tips/claude-code-sonnet-5-5-vs-opus-5-5-benchmark)(9월 29일)는 11파일 PHP 저장소에서 네 과제·네 설정·세 반복을 비교했다. Sonnet medium과 Opus medium 모두 12/12 통과했고 Sonnet의 비용·응답 효율이 좋았다. [같은 저자의 Opus/Fable 비교](https://wmedia.es/en/tips/claude-code-opus-5-5-vs-fable-5-1-vs-opus-5-benchmark)도 작은 과제에서 Fable의 필요성을 입증하지 못했다. 같은 저자를 독립 표본으로 중복 집계하지 않으며 이 결과는 개방형 계획의 우열이 아니다.
- **리뷰 전문 업체의 혼합 결과:** [CodeRabbit Opus 5.5 평가](https://www.coderabbit.ai/blog/opus-5-5-model-review)(9월 22일)는 OSS 80개 패턴에서 Standard/Max가 일부 새 결함을 찾는 대신 기존에 찾던 결함도 놓쳤고, Max의 precision이 더 낮았다고 보고했다. 출시 파트너·상용 pipeline 자체 평가이며 Standard/Max는 API effort 이름이 아니다. 높은 effort나 회사 분리만으로 검토 정확도가 보장되지 않는다.
- **전문 검토와 보조 판단:** Astra는 정밀 검토 `slow`에 xhigh, 화면 분석 `vision`에 high를 사용하며 Sol `advisor`는 high다. Sol 탐색·커밋은 medium을 사용한다. `commit`은 OMP 커밋 생성 기능의 역할이며 일반 대화의 커밋 요청을 자동으로 분류하는 설정이 아니다. 제목·메모리는 Luna low와 [Haiku 5.5](https://www.anthropic.com/claude-haiku-5-5) low fallback을 유지한다. 높은 effort나 [이미지 입력 지원](https://developers.openai.com/api/docs/models/gpt-6-astra)만으로 미적 판단·위험 감시 정확도 우위를 주장하지 않는다.
- **fallback의 목적 분리:** 판단 역할의 Opus fallback은 Astra, Sonnet 구현의 fallback은 Sol 6.1, Sol 탐색·커밋·advisor의 fallback은 [Sonnet 5.5](https://platform.claude.com/docs/en/models/sonnet-5-5/overview)다. 추론 강도는 주 역할의 xhigh/high/medium 구분을 따른다. Sol과 Sonnet의 기본 API 입력·출력 단가가 같은 구간이어도 성능·완료 비용·구독 소모를 동등하게 보지 않는다. fallback은 provider 장애·quota 대응 경로이지 답의 품질에 따른 자동 상향 기능이 아니다.
- **Fable 명시 선택:** [공식 선택 가이드](https://platform.claude.com/docs/en/about-claude/models/choosing-a-model)의 고난도 추론 후보로 Fable 5.1을 선택 목록에 유지한다. 어떤 기본 역할·fallback 대상에도 넣지 않고 `/model anthropic/claude-fable-5-1:xhigh`로 선택한다. [Max 플랜의 Fable 한도](https://support.claude.com/en/articles/15424964-claude-fable-models-on-your-plan)는 기존 주간 한도 안의 최대 50%이며 별도 추가 사용량이 아니다. 이는 Claude 공식 제품의 구독 조건이고 OMP 인증·API 과금 경로의 보장은 아니다.

## OMP 설정 사례의 적용 판단

- [공식 v18.8.3](https://github.com/can1357/oh-my-pi/releases/tag/v18.8.3)(10월 7일)과 설치본이 일치한다. [공식 변경 내역](https://github.com/can1357/oh-my-pi/blob/v18.8.3/packages/coding-agent/CHANGELOG.md)에 따라 18.8.2부터 `task`·eval `agent()`·`workpool()`의 호출별 `model` 인자가 없다. `modelRoles`에 실제 selector를 두고 `task.agentModelOverrides`에는 `@slow` 같은 역할 별칭을 써 중복 모델 고정을 피한다.
- 같은 변경 내역의 18.8.0은 제목 생성 기본값을 메인 모델 fork로 바꿨다. `title.generator=tiny`를 명시해 제목이 경량 OpenAI 역할을 사용하게 한다. 이 값은 `tiny` 역할 배정만으로 자동 설정되지 않는다.
- [공식 설정 문서](https://github.com/can1357/oh-my-pi/blob/v18.8.3/docs/settings.md)의 저장 위치는 활성 agent dir의 `config.yml`이다. CLI의 `omp config set task.agentModelOverrides ...`는 dotted setting path를 받지만 YAML을 직접 쓸 때는 `task: { agentModelOverrides: ... }`처럼 중첩해야 한다. 설정·카탈로그·인증·실제 도구 왕복을 각각 확인한다.
- 라우팅 변경은 다음 서브 실행·fallback에 재로딩되지만 정상 실행 중 메인·이미 시작한 서브의 모델을 바꾸지 않는다. 명시 CLI/env/overlay와 resume 모델은 별도 우선순위다. 이 프로필의 배포가 현재 대화를 자동 전환했다는 뜻은 아니다.
- [공유 Prime-U 설정](https://gist.github.com/PolyphonyRequiem/dd036d7fa5a708c3488cefaf07eaf966)(9월 19일)은 역할 분리와 per-agent 설정 사례로 참고했다. Copilot 과금·구형 ID·`prewalk` 자동 경량화·advisor 끄기·음성/메모리 변경은 이 환경의 증거나 요청이 아니므로 복사하지 않는다. 자동 경량화는 메인 Anthropic 유지·상급 구현 정책과 충돌한다.
- `modelPresets`는 역할·기본 effort 전환용이며 fallback·허용 목록까지 같은 묶음으로 전환하는 배포 프로필이 아니다. 이번에는 단일 소스만 유지한다. 여러 advisor, account pool, 외부 plugin·MCP도 필요 근거 없이 추가하지 않는다. [override 신고 #12862](https://github.com/can1357/oh-my-pi/issues/12862)는 종료된 환경별 사례이며 일반 결함으로 단정하지 않고 실제 자식 실행 모델로 확인한다.

## 게임·서버·디자인 사용 경로

| 작업 | 책임 배분 | 수락에 필요한 근거 |
|---|---|---|
| 복잡한 클라이언트·서버 구조 | Opus 메인이 요구·불변조건·경계를 정리하고 Sonnet `task`가 명확한 구현을 수행. Opus 작성 설계와 Sonnet 작성 구현은 Astra reviewer, fallback 등으로 OpenAI가 작성한 산출물은 아래 일회성 Anthropic reviewer로 교차 검토 | 소유권·서버 권위·동시성·내구성·복구와 부하/메모리/프레임 관측. [서버](/game/server-checklist.md)·[클라이언트](/game/client-checklist.md)·[보안](/security/game.md) 기준 |
| 게임 아트 방향·UI/환경 | Opus 메인·`designer`가 방향·대안·추천안을 정하고 Sonnet `task`가 구현. Astra `vision`은 실제 화면 교차 분석 | 참조 이미지와 스타일 제약, 실루엣·명도·색·스케일·시선 유도, 실제 카메라/HUD에서의 판독성. 대안 비교·선택 이유·트레이드오프 |
| 레벨·전투 공간 | Opus가 플레이 목표·진행 구조를 정하고 Sonnet 작업자가 공간·기믹을 구현. Opus 작성 설계와 Sonnet 작성 구현은 Astra가 검토하고 OpenAI 작성 구현은 아래 Anthropic 독립 검토로 확인 | 이동 동선·시야·랜드마크·엄폐·적/보상 배치·실패/복구 경로를 greybox와 플레이로 검증. 탑뷰만 보고 실제 카메라의 가림·거리·길찾기를 통과로 보지 않음 |

- 디자인 요청은 사용자가 모든 세부를 정해 줄 때까지 기다리지 않는다. 기존 요구와 레퍼런스로 대안을 비교하고 추천안 하나와 이유를 제시하며, 표현 취향과 관측 가능한 가독성/조작 결함을 구분한다. 실제 시각 자료가 없으면 관찰한 것처럼 평가하지 않는다.
- `@designer`는 Opus high의 선택 가능한 모델 별칭이지 빌트인 에이전트가 아니다. 디자인 핵심 판단은 메인에서 수행하고 일반 `task`에는 구현 목표·제약·검증 기준을 전달한다. `plan` 배정이나 `todo` 호출이 계획 모드를 자동 실행하지 않으며, 일반 대화는 선택된 메인 모델을 계속 사용한다. 역할 선택과 난도별 자동 승격을 혼동하지 않는다.
- `vision`은 이미지 **분석**이고 `image`는 생성 runner다. 컨셉아트·텍스처·3D 에셋 생성 도구나 외부 MCP를 이 설정 변경으로 설치·활성화하지 않는다. 생성이 필요한 실제 작업에서 사용 가능한 도구·권리·출력 형식을 별도로 확인한다.
- [CodeRabbit의 GTA풍 제작 사례](https://www.coderabbit.ai/blog/opus-5-5-model-review)는 Opus·Astra·Fable의 선택된 플레이 시연이며 미술·레벨 디자인의 통제 비교가 아니다. 코드 벤치마크나 데모만으로 “최고의 디자이너”라고 단정하지 않는다. xhigh도 디자인 정확도·재미의 보장이 아니므로 실제 화면/플레이 검증과 메인의 교차 판단을 유지한다.

### 교차 모델 독립 검토

**독립 검토가 필요한 산출물의 실제 작성 모델이 OpenAI인 경우**(서브·메인 fallback 포함), 작업 산출물 디렉터리에 아래 일회성 YAML을 두고 별도 fresh session의 `reviewer` 또는 `security-reviewer`를 실행한다. `--config`는 그 프로세스에만 적용되며 기존 전역 설정·다른 세션을 바꾸지 않는다. 검토 범위·수락 기준·실제 변경 파일·실행 근거를 프롬프트로 전달하고, 구현자의 자기평가를 결론으로 주입하지 않는다.

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

- `@plan`은 이 프로필에서 Opus xhigh다. 모델 이름의 자기보고 대신 자식 session의 provider/model 기록을 확인한다. 교차-provider fallback으로 다시 OpenAI가 실행되면 교차 모델 검토가 아니며 Anthropic 검토가 가능한 상태에서 다시 수행한다.
- `/agents`나 `omp config set task.agentModelOverrides`는 전역 영속 변경이므로 일회성 검토에 사용하지 않는다. record 전체 교체로 기존 security reviewer 배정을 잃을 수 있다. 사용자 모델 태그(`^` 선택)는 사용자가 해당 모델의 위임을 명시한 경우에만 사용한다.

## 커스텀 에이전트 작성 시
- 진짜 새 에이전트(새 이름·다른 페르소나)만 `agents/`에 둔다. 단, bundled frontmatter가 품질 요구와 충돌하고 설정 키로 덮을 수 없는 경우에는 원본 OMP 버전과 변경 범위를 주석으로 남긴 동명 override를 허용한다.
- `model` 또는 per-agent 설정을 명시한다. 미지정 시 설치본의 task/session 상속 경로를 확인하며 부모와 다른 회사일 것으로 가정하지 않는다.
- 위임받은 에이전트도 작업 전 [OKF](/index.md)의 관련 개념을 확인하고 omp 기본 도구·스킬을 우선한다.

## 현재 역할과 운영 경계

| 역할 | 주 모델·추론 강도 | 다른 provider fallback |
|---|---|---|
| `default`, `plan` | anthropic/claude-opus-5-5:xhigh | openai-codex/gpt-6-astra:xhigh |
| `task` | anthropic/claude-sonnet-5-5:xhigh | openai-codex/gpt-6.1-sol:xhigh |
| `slow` | openai-codex/gpt-6-astra:xhigh | anthropic/claude-opus-5-5:xhigh |
| `designer` | anthropic/claude-opus-5-5:high | openai-codex/gpt-6-astra:high |
| `vision` | openai-codex/gpt-6-astra:high | anthropic/claude-opus-5-5:high |
| `advisor` | openai-codex/gpt-6.1-sol:high | anthropic/claude-sonnet-5-5:high |
| `smol`, `commit` | openai-codex/gpt-6.1-sol:medium | anthropic/claude-sonnet-5-5:medium |
| `tiny`, `memory` | openai-codex/gpt-6-luna:low | anthropic/claude-haiku-5-5:low |

- 단일 공유 프로필의 선택 목록은 역할표의 6개 모델과 명시 선택용 Fable 5.1을 합친 7개다. Fable은 `/model anthropic/claude-fable-5-1:xhigh`로 실행한다. 현재 대화의 명시적 모델 선택과 저장된 역할 변경은 별개이며, Fable 자체를 선택한 세션도 일반 런타임 오류·fallback 정책에서는 제외되지 않는다. 역할·fallback을 모두 사용하려면 두 provider의 유효 인증이 필요하다. `image`·`web`·`speech`·`dictation`·`judge`는 임의 배정하지 않으며 역할 배분은 사용량 50:50이나 월 지출 상한을 강제하지 않는다.
- `extendedContext=true`는 카탈로그가 허용하는 확장 컨텍스트 선택이며 서버 상한·구독 quota 보장이 아니다. API 장문 가격 구간은 [OpenAI 가격표](https://developers.openai.com/api/docs/pricing)·[Anthropic 가격표](https://platform.claude.com/docs/en/about-claude/pricing)와 실제 usage report로 확인한다.
- `advisor.enabled=true`, `advisor.syncBacklog=1`을 유지한다. 위험 변경의 구현 전 검토와 완료 전 fresh-context 검토는 별도다. advisor 카드·대기 설정이 의견 반영을 증명하지 않는다.
- 메인 Opus·구현 Sonnet과 OpenAI reviewer의 계열은 다르지만 **독립 검토가 필요한 산출물의 실제 작성 모델이 OpenAI인 경우**(서브·메인 fallback 포함), 같은 OpenAI reviewer만으로 교차 모델 검토를 충족하지 않는다. Anthropic 한도·장애로 메인이 Astra로, `task`가 Sol로 넘어간 산출물이 여기에 해당하며 위 일회성 검토 overlay로 Anthropic reviewer를 실행한다. 역할표는 이를 자동 분기하지 않으며 검토가 작성 계열로 fallback된 경우에도 교차 모델 검토로 세지 않는다. fallback 발생 시 실제 실행 모델·검토 계열과 기존 테스트 결과를 확인한다.
- `retry.modelFallback=true`, `retry.usageAwareFallback=true`, `retry.usageReservePolicy=auto`, `retry.usageReservePct=1`, `retry.fallbackRevertPolicy=cooldown-expiry`를 유지한다. 신뢰 가능한 coding-plan report의 잔여 1% 이하에서 적격 후보로 자동 전환하지만 일반 API key·unknown usage·후보 불가에서는 보장하지 않는다. 회사별 역할 분리는 주 경로 정책이지 fallback까지의 강제 고정이 아니다.
- `providers.anthropic.serverSideFallback=false`를 유지한다. 이는 Anthropic API refusal fallback에 대한 OMP 설정이며 오류·429·quota에 따른 OMP fallback과 다르다. 서버 전체의 fallback을 제어한다고 해석하지 않는다.
- 위임 기준은 [서브에이전트](/tools/subagents.md), 검토·실행 증거는 [워크플로](/workflow.md), 도구 선택은 [omp 기본 도구](/tools/builtin.md)를 따른다.

## 구독과 인증의 경계

- 구독 선택과 모델 라우팅은 별개다. 설정 파일을 적용해도 구독 결제·플랜 확인·API 크레딧 수령·인증 전환은 수행되지 않는다. 일반 API key의 크레딧 잔액은 `retry.usageReservePct=1`의 신뢰 가능한 coding-plan quota와 같은 값이 아니다.
- Anthropic: [법적 고지](https://code.claude.com/docs/en/legal-and-compliance)는 구독 OAuth를 자사 앱의 일반 사용용으로 두고 제3자 로그인·자격증명 중개를 제한한다. [구독 인증 안내](https://support.claude.com/en/articles/13189465-log-in-to-your-claude-account)는 Anthropic 서버에 신원을 허위 표시하거나 제3자 트래픽을 구독 한도로 돌리는 제3자 도구 사용을 금지하지만, [Agent SDK 안내](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)는 2026-10-07 갱신에서 제3자 앱도 구독 한도를 쓸 수 있다고 적는다(조회: 2026-10-10). OMP 18.8.7의 `anthropic` OAuth 요청은 Claude Code User-Agent와 시스템 프롬프트를 보낸다(`omp://provider-quirks.md`). 응답 성공이나 구독 한도 차감을 허용 근거로 쓰지 않는다. 정책상 분명한 경로는 API 키와 [Max·Team 월 API 크레딧](https://support.claude.com/en/articles/17154008-monthly-api-credits-for-max-and-team-plans)이며, 이 크레딧은 구독 한도와 별개이고 대화형 Claude Code에는 쓰이지 않는다. OMP에서는 저장 OAuth가 환경 변수 API 키보다 우선하므로 API 키 경로는 명시적으로 구분해 설정한다.
- OpenAI: [오픈소스 구독 연동](https://developers.openai.com/siwc/token-sharing-open-source/sign-in)은 `dynamic_agent_client` 동적 등록 계약이다. OMP 18.8.7의 `openai-codex` 로그인은 고정 Codex CLI client ID를 재사용하므로(`omp://provider-quirks.md`) 그 계약 경로가 아니며, 이 경로 자체의 공식 허용이나 금지는 확인되지 않았다. 성공한 실호출을 공식 승인이나 다른 플랜의 가용성 증거로 확대하지 않는다.
- Google: [Antigravity 약관](https://antigravity.google/terms) §6과 [Gemini CLI FAQ](https://github.com/google-gemini/gemini-cli/blob/main/docs/resources/faq.md)는 제3자 도구가 Antigravity·Gemini CLI OAuth로 백엔드에 접근하는 것을 위반·계정 정지 사유로 명시하고 Vertex·AI Studio API 키를 권장한다(조회: 2026-10-10). OMP의 `google-gemini-cli`·`google-antigravity`는 이 제품 OAuth를 저장해 내부 백엔드에 직접 추론하므로 OMP 추론 자격증명으로 쓰지 않고 `google`(`GEMINI_API_KEY`)·`google-vertex`를 쓴다. Google AI Pro·Ultra의 AI Studio 한도는 웹 UI 한정이고 API 키 사용은 별도 과금이며, 구독의 월 Google Cloud 크레딧은 Developer Program 혜택을 Billing 계정에 적용해야 쓸 수 있다([Google AI plans](https://ai.google.dev/gemini-api/docs/google-ai-plans)).
- xAI: [Hermes](https://x.ai/news/grok-hermes)(전 등급)와 [OpenCode](https://x.ai/news/grok-opencode)에서 SuperGrok·X Premium 구독 OAuth 사용을 공식 안내했고 OMP는 `xai-oauth`(`grok-cli:access` scope 포함 device-code 로그인, `omp://provider-quirks.md`)를 구현한다. 공식 안내는 해당 제품 대상이며 OMP 인증 경로 자체의 공식 허용은 확인되지 않았다. OMP에서의 계정별 모델 권한·한도는 실제 로그인으로 확인한다.
- ChatGPT의 이미지 생성 기능이 `vision` 설정만으로 OMP에 추가되지는 않는다. [공식 오픈소스 연동 제한](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations)도 이미지 입력과 이미지 생성 도구를 구분한다. 생성 도구·인증·과금 변경은 해당 작업에서 별도로 확인한다.

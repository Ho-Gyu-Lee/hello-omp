# Change Log

## 2026-09-04
* **Fix**: Anthropic 인증이 없는 PC에서 `slow`·`plan`·`vision`·`advisor`와 Codex fallback이 실패하던 포터블 프로필을 OpenAI Codex-only로 전환. `modelRoles`·`enabledModels`·fallback·advisor 상태를 명시적으로 덮어써 기존 Fable 설정이 남지 않게 하고, 두 번째 provider를 저장소에 구성하기 전까지 advisor와 model fallback을 비활성화한다.
* **Update**: 공유 OMP 프로필의 Anthropic 역할과 fallback을 모두 Claude Fable 5.1로 통일하고, Fable 권한이 없는 머신의 Opus 사용은 로컬 설정으로 분리. GPT 메인 레인은 GPT-5.6 Sol/Terra, `tiny`는 GPT-5.3 Codex Spark를 유지한다.
* **Update**: `extendedContext=true`를 포터블 OMP 설정에 고정해 GPT-5.6 Sol/Terra/Luna의 subscription Codex 컨텍스트를 표준 요율 구간인 272K에서 1M으로 확장. 272K 입력 초과 요청에는 OpenAI long-context 요율이 적용된다.
* **Fix**: OMP 18.1.8에서 제거된 `task.isolation.mode=auto` 포터블 설정을 현재 스키마의 `task.isolation.enabled=true`와 `isolation.backend=auto`로 교체하고 서브에이전트 지침의 키 이름도 동기화. 클린 배포에서도 격리를 활성화하고 `setup.sh`가 중단 없이 전체 설정을 배포한다.

## 2026-09-02
* **Fix**: 글로벌 AGENTS와 [응답 원칙](/response-principles.md)에 비한정 예시 해석 규칙을 추가. `예를 들어` 같은 사례를 완전 목록으로 오인하지 않고 요청문의 대상 집합·판정 기준에 맞는 모든 항목으로 탐색·구현·검증을 확장하되, 명시적 폐쇄 지시와 YAGNI 경계를 우선하도록 수정.
* **Update**: 글로벌 AGENTS와 관련 OKF 문서의 `예:` 표기를 일반 기준 뒤의 명시적 비한정 사례로 정비. 예시보다 대상이 많아도 확인 게이트로 축소하지 않고 판정 기준·대상 집합을 밝힌 뒤 진행하며 실제 처리 범위를 보고하도록 고정.
* **Update**: Fable 5.1 출시에 따라 Fable 5를 사용하던 `vision` 역할을 `anthropic/claude-fable-5-1:high`로 전환. 카탈로그에서 1M 컨텍스트·128K 출력·이미지 입력·high thinking 지원을 확인했으며, 교차-provider fallback(gpt-5.6-sol:high)과 나머지 역할은 유지.

## 2026-08-31
* **Update**: OMP v18.0.11의 `tiny` 역할을 gpt-5.6-luna:low로 명시해 제목·메모리·auto-thinking 분류 등 경량 백그라운드 작업을 분리. 도구 판단과 편집을 수행하는 `commit` agentic pipeline·`sonic`은 `smol`과 같은 gpt-5.6-terra:medium을 유지.
* **Update**: 최근 공식 포지셔닝과 제한된 공개 사용자 평가를 반영해 `plan`·`advisor`를 Fable 5에서 반값의 근접 frontier 성능을 표방하는 Opus 5로 전환. 장기 시각 입력 근거가 직접적인 `vision`만 Fable 5를 유지하고, 제한 접근인 Mythos 5는 primary·fallback에서 제외.
* **Update**: 역할별 quota/429 fallback을 다른 provider의 동급 모델 1개로 단순화. 동일 provider 모델의 연쇄 재시도를 제거해 불필요한 재시도 지연·비용·모델 행동 드리프트를 차단.
* **Update**: OAuth coding-plan의 신뢰 가능한 usage report에 한해 usage-aware fallback을 활성화하고 `retry.modelFallback=true`를 명시적으로 고정. 모델에 매핑된 rolling quota의 잔여 5%에서 확인 프롬프트 없이 역할별 단일 교차-provider fallback으로 선제 전환하며, 일반 configured API key와 unknown quota는 primary를 유지.

## 2026-08-23
* **Update**: [워크플로](/workflow.md)에 다단계·대규모 작업의 사용자 요구→관찰 가능한 결과→검증 경로→실행 증거 폐루프를 추가. 완료 근거가 실제 결함에서 실패하도록 성공 표시는 모든 단언 뒤에만 내고, 부재를 증명할 때의 알려진 양성 대조군과 목표 수치 달성의 독립 측정을 요구하며, 미충족·차단·포기 기준의 조용한 삭제·축소를 금지.
* **Update**: 글로벌 AGENTS와 OKF index에서 다단계·대규모 작업을 워크플로 concept으로 라우팅하고, [서브에이전트 위임](/tools/subagents.md)에 병렬 fan-out 전 인터페이스·의존성·완료 기준·write-set 소유권 고정, 충돌 작업 순차화, 부모 재검증 원칙을 추가.
* **Fix**: [에이전트 가이드](/agents/guide.md)를 현재 OMP 빌트인 7종(`scout`, `designer`, `reviewer`, `security-reviewer`, `librarian`, `task`, `sonic`)과 실제 model alias 기준으로 동기화하고, 제거된 `explore`·`Tester`·`plan` task-agent 항목을 정리.

## 2026-08-10
* **Update**: 고빈도 역할은 GPT 5.6 Sol/Terra, 전문 역할은 Claude Opus/Fable 5로 통일하고 모든 quota/429 fallback에서 GPT 5.5·Claude Opus 4.8을 제거. `reviewer`는 `slow = claude-opus-5:high`를 직접 따르도록 에이전트별 pin을 비웠고, 매 턴 advisor도 Fable 5 high로 낮춰 장시간 `xhigh` 사고 턴을 제한. Opus 4.8로 향하는 Anthropic 암묵적 서버 fallback은 비활성화.

## 2026-08-08
* **Reorg**: 로컬↔레포↔배포본 지식 싱크 정리. `/learned/`의 프로젝트·회사·라이브러리 한정 내부 지식(디컴파일 근거·내부 엔드포인트·미공개 벤더 결함 등)은 공개 레포에 커밋하지 않도록 `.gitignore`로 로컬 전용화. 발견은 `/learned/` 디렉터리 직접 읽기로 전환하고 index의 per-file bullet 제거.
* **Creation**: 벤더 무관 교훈을 공개 번들 concept으로 일반화. [요청 서명 정규화 계약](/security/signing-canonicalization.md) 추가 — 서명자↔검증자 런타임 차이로 서명 베이스가 갈리는 세 결함 클래스(키 정렬·값 문자열화·기대 키 집합)와 근본 수정·격리법.
* **Update**: [코드 리뷰 보안 체크리스트](/security/review-checklist.md)에 객체 수준 인가(BOLA/IDOR)와 인증 스코프 캐시 폐기 항목 추가. [워크플로](/workflow.md)에 정본 검증(프록시 아닌 실제 배포 경로·런타임 소스) 규칙 추가.
* **Update**: 학습 축적 규칙 정합화 — [OKF 학습 축적 루프](/learning/accumulation.md)와 글로벌 AGENTS의 index 갱신 규칙을 "관리 번들 concept은 index 링크, 로컬 `/learned/` concept은 gitignore·디렉터리 발견"으로 분기하고, 벤더 무관 교훈의 공개 일반화+로컬 교차 참조 절차를 명시.

## 2026-08-07
* **Update**: 테스트·스모크 테스트·버그 재현에서 만든 사용자 검증용 산출물을 자동 삭제·원복하지 않고, 완료 보고에 정확한 위치·상태·확인 방법과 정리 대상·영향을 남기도록 글로벌 AGENTS와 워크플로 규칙을 변경. 검증 산출물 보존은 일반적인 마지막 cleanup보다 우선하고 정리는 사용자 명시 요청 시 별도 수행하며, 러너 자체 캐시와 즉시 차단할 위험 상태의 경계를 명시.

## 2026-07-16
* **Creation**: 버그 수정 시 증상이 아니라 결함 클래스를 고치고, 수정 전 코드 이력을 확인해 새 엣지 케이스 때문에 이전 수정을 롤백하지 않으며, 고친 케이스마다 회귀 테스트를 남기도록 요구하는 `/bugfix.md` concept을 추가. 수정→롤백→수정 루프 차단이 목적.
* **Update**: 글로벌 AGENTS와 코딩 스타일의 YAGNI를 기능 범위 한정으로 명확화(버그 수정 깊이엔 미적용)하고, AGENTS OKF 라우팅에 버그 수정·디버깅 → `bugfix.md` 경로를 추가.
* **Update**: `bugfix.md`를 전방 영향 범위 분석(주, `lsp references`·데이터 흐름·계약 경계 bounding)과 후방 의도 복구(보조, Chesterton's Fence)로 재구성하고, 이력 확인을 조건부(이유가 코드에 안 드러나는 방어 코드)로 완화. AGENTS·index 요약 동기화.

## 2026-07-14
* **Fix**: OMP TUI가 제목·목록·표·코드 블록을 렌더링하는 동작에 맞춰 터미널 응답의 마크다운 금지를 제거하고, 필요한 구조화와 Mermaid 시각화를 적극 활용하도록 글로벌·상세 응답 규칙을 명확화.
* **Update**: OMP TUI에서 thinking block은 기본 숨김, 추론 요약은 보존, 표시 시 prose-only로 제한하고 Mermaid ASCII 렌더링을 활성화하도록 공유 설정을 고정.

## 2026-07-13
* **Update**: SDK·라이브러리의 공개 API를 소비자 소유 정책과 안정적 계약으로 제한하고, 근거 없는 상속 확장점과 검증 우회 공개 hook을 금지하는 글로벌 설계 규칙을 추가.
* **Update**: 공통 서버 입력을 검증·정규화한 뒤에만 상태와 통계를 갱신하고, 부분 갱신의 독립·교차 검증 및 최종 accepted 값의 종단 간 전파를 요구하도록 코딩·보안 리뷰 규칙을 보강.
* **Update**: OKF 배치 반영·분할·병합·이름 변경·규칙 교체 후 모순·중복 정본·도달성·깨진 링크·메타데이터 불일치를 확인하는 무결성 검사를 추가.
* **Update**: 글로벌 AGENTS의 OKF 라우팅에 일반 서버/API 구현·수정·리뷰 경로를 추가해 공통 서버 상태 처리와 보안 리뷰 concept을 명시적으로 연결.
* **Fix**: setup의 OKF 검증을 첫 줄 확인에서 Bun 기반 YAML 파싱·mapping 확인·non-empty `type` 검사로 강화하고, Windows/POSIX가 같은 검증기를 사용해 실패 시 배포 전에 중단하도록 변경.
* **Creation**: 게임 네트워크의 권위·표시 상태 계층, 시간/순서, bounded prediction, 복구, 전달 의미론, handoff, 혼잡 처리와 결정적·통합 검증 원칙을 `/game/network-sync.md`로 추가.
* **Update**: 게임 클라이언트 체크리스트에 상태 계층·시간축·bounded extrapolation·표시 연속성·불연속 전환·재접속 검증을, 서버 체크리스트에 accepted 상태·보정 전파·generation·handoff·backpressure·관심 관리를 추가.
* **Update**: 게임 보안과 리뷰 체크리스트에 검증 실패 상태 오염 방지, 비가역 커맨드 멱등성, 세션 재개, host fast path, fog/interest 정보 인가와 observer 수렴 검증을 추가.

## 2026-07-10
* **Update**: GPT-5.6 Sol/Terra를 고빈도 `default`·`task`·`designer`·`smol`·`commit` 주 모델로 배치하고, Claude Opus 4.8을 `slow`(reviewer), Claude Fable 5를 `plan`·`advisor`·`vision` 주 모델로 배치. 모든 역할의 quota/429 fallback chain은 GPT↔Claude 교차 백업으로 재정렬하고, 각 역할의 primary 모델은 자기 fallback에서 제거.
* **Fix**: 현 OMP 번들 `reviewer`·`plan` frontmatter가 `thinkingLevel`을 고정하지 않으므로 동명 override 파일을 제거하고, setup 재실행 시 이 레포가 관리하던 이전 override를 배포본 config dir에서도 정리하도록 유지.

## 2026-07-06
* **Sync**: 로컬 OMP 모델 역할의 `designer`·`advisor` xhigh 설정과 Opus 4.8 우선 quota/429 fallback chain을 소스 설정으로 승격하고, setup 배포본과 재동기화.

## 2026-07-03
* **Update**: OMP 모델 역할 설정을 Claude Fable 5 중심으로 갱신하고, 최고품질형으로 `slow`·`plan`은 xhigh, 매턴 보조 역할은 high로 정리. bundled `reviewer`·`plan`의 `thinkingLevel: high` 고정을 우회하기 위해 원본 버전 주석이 있는 동명 override를 추가했으며, Fable 5 safety-classifier refusal 시 Opus 4.8 서버사이드 폴백을 사용하도록 설정.

## 2026-06-30
* **Update**: Google OKF v0.1 예약 파일 규칙에 맞춰 하위 디렉터리 `index.md`를 progressive-disclosure 파일로 추가하고, concept 문서는 `security/overview.md`·`agents/guide.md`로 분리.
* **Update**: OKF 학습 축적 루프를 추가하고, setup에서 배포본 OKF 경로와 소스 OKF 경로를 함께 주입해 소스 OKF를 영속 학습 원장으로 사용하도록 정리.
* **Fix**: setup config dir가 레포 루트와 같을 때 중단하는 가드를 추가해 소스 OKF 원장 삭제를 방지.
* **Fix**: `.gitattributes`를 추가해 `setup.sh` LF, `setup.ps1` CRLF 줄끝 정책을 고정.

## 2026-06-29
* **Init**: OKF 번들 초기화 — 글로벌 CLAUDE.md 룰과 omp 번들 에이전트 정의에서 정리. 도구 정책은 omp 기본 도구 우선(MCP 대체)으로 적용.

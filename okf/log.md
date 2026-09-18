# Change Log

이 문서는 변경 당시의 기록이며 현재 설정·지원 사양의 근거가 아니다. 현재 안내는 소스 설정과 해당 concept을 따른다. 오류가 확인된 과거 설명은 정정 표시를 우선한다.

## 2026-09-18
* **Policy**: [OKF 학습 축적 루프](/learning/accumulation.md)를 작업 완료 절차에 연결. 로컬 기록과 공개 반영의 기준을 분리하고, 기존 지식의 재사용·정정에도 재평가를 요구한다. [워크플로](/workflow.md)에 학습·공개 반영 결과 필드를 고정하며 단순 질의 예외, 보류·차단 보고, 공개/로컬 이력 분리, 검증·배포와 Git 작업 승인 경계를 명시한다.
* **Learning**: 선별 커밋 검증은 작업 트리가 아니라 실제 인덱스 스냅샷을 격리해야 한다는 원칙을 [워크플로](/workflow.md)에 반영. 선택적 외부 응답 필드의 부재와 실제 0을 구분하고 계약에 따른 폴백·집계를 검증하는 원칙을 [코딩 스타일](/coding-style.md)에 반영.
* **Correction**: [요청 서명 정규화 계약](/security/signing-canonicalization.md)의 원시 body 바이트 일치 권고를 rawBody 모델로 한정하고, 파싱 후 canonical 재구성 모델과 구분한다. UTF-16/UTF-8 정렬의 비등가성·JS 안전 정수 경계·소비자 합의 없는 타입 변경 금지와 상태코드만으로 판정하지 않는 대조 기준도 명시한다.
* **Learning**: [워크플로](/workflow.md)에 ignored 복구본·검증 산출물의 Git 정리·전체 stash 보호 경계와 인덱스 복사본 생성·상위 Git 탐색 주의를 추가. [코딩 스타일](/coding-style.md)의 외부 응답 집계 원칙에는 공식 DynamoDB 선택 필드 계약과 실제 0·누락·집계값 처리 예를 보강한다.
* **Policy**: 작업용 파일을 사용자·프로젝트 지정 경로 또는 `<프로젝트 루트>/.omp-artifacts/<작업-ID>/` 한 곳으로 모으도록 글로벌 룰과 [워크플로](/workflow.md)에 기준을 추가. OMP 설정 탐색 경로 `.omp/`와 분리하며 재개 시 기존 작업-ID를 확인한다. 정본 위치·기존 파일·검증 산출물 보존·정리 승인을 유지하고 위임·격리·도구 고정 출력·로컬 Git 제외의 경계를 명시한다. `/cleanup` 탐색 안내·README의 격리 검증 예시·Git 제외 경로도 맞춘다.
* **Policy**: 새 작업용 스크립트를 TypeScript+Bun으로, 파일이 필요 없는 실행을 Bun의 JavaScript 경로로 통일. [omp 기본 도구](/tools/builtin.md)에 Python 편의 사용 금지와 사용자 지정·기존 프로젝트·필수 런타임 제약의 예외를 명시한다. 기존 제품 언어·OS 부트스트랩·OMP 자체의 Python 지원은 변경하지 않는다.
* **Fix**: advisor 노트의 자연어 본문에도 한국어 존댓말을 명시하도록 advisor 전용 `rules/WATCHDOG.md`를 추가하고 POSIX·PowerShell setup의 관리 배포에 포함. 코드·설정 키·도구 필드·severity 값은 원문을 보존하며 감시 범위나 심각도 판정은 변경하지 않는다.
* **Policy — 기본 비활성 방침 대체**: 게임 서버의 위험 변경에 보수적으로 접근하기 위해 advisor 기본값을 활성(`advisor.enabled=true`)으로 복원. 작업 중 감시와 최종 응답 전 독립 검토를 함께 유지하고, 보안·영속 데이터·서버 권위·동시성 정합성에 영향을 주는 변경에는 구현 전 독립 검토도 요구한다. 같은 날짜에 기록한 기본 비활성 방침을 대체하며 모델 라우팅·fallback·`syncBacklog`는 변경하지 않는다.
* **Policy**: 비동기 advisor를 기본 비활성화(`advisor.enabled=false`)하고 필요한 작업의 최종 응답 전 독립 검토를 결과 수신·지적 판단·수정·재검증까지 완료하도록 명시. 작업 중 감시는 세션별 선택 사항으로 남기며 advisor 모델·fallback·`syncBacklog`는 유지한다. 검토 요청·카드 표시와 의견 반영 완료를 구분하고, 새 세션 적용 및 실행 중 세션의 `/advisor off` 경계를 문서화한다.
* **Policy**: 보고 매체를 터미널 기본으로 정하되, 사용자 요청·길고 복잡한 내용의 반복 검토·문서 자체의 편집·공유·비교 필요에 따라 파일 보고를 선택하도록 글로벌 룰과 [응답 원칙](/response-principles.md)에 기준을 명시. 파일 보고도 핵심 결론·근거·주의사항·필요한 결정·경로를 터미널에 제공하며 필수 작업 산출물과 검증 자료 생성을 억제하지 않는다.
* **Fix**: [워크플로](/workflow.md)의 완료 전 일률적 파일 저장 조건을 제거하고 산출물 보존과 보고 파일 생성을 구분. 독립 검토 전 본문을 먼저 공개하지 않고 검토·수정·검증 후 통합 최종본을 전달하도록 변경. advisor의 비동기 검토와 `syncBacklog`의 한계를 명시하고, 공개 답변 수정 시 차이만 덧붙이지 않고 자기완결적인 대체 최종본을 제공하도록 고정.
* **Correction**: Astra의 컨텍스트 제약 및 그 해소를 모델 선택 근거로 삼던 잘못된 설명을 README·에이전트 가이드에서 제거. 2026-09-05·2026-09-07 기록의 해당 전제도 정정하며 모델 라우팅과 `extendedContext` 설정은 유지한다.
* **Policy**: [정확성](/accuracy.md)에 버전 의존 사실의 적용 범위·근거·확인 시점과 현재 안내/과거 이력 구분을 명시. 설치본·유효 설정·공식 자료에 따라 관련 설명과 배포본을 갱신하되 문서 최신화를 근거로 모델·설정을 임의 교체하지 않는다.
* **Refresh**: 공식 자료와 설치 OMP 18.2.5에 맞춰 Pro의 Fable 불가 단정, Astra 장문 요금 티어 부재, 설정만으로 보장하던 가용성·quota·인증 전제를 정정. 고정 단가와 불필요한 모델 도입 이력은 현재 가이드에서 제거하고, 기존 `pro` 라우팅은 선택형 Opus 전용 프로필로 명확화한다. 실제 모델·설정값은 유지한다.
* **Clarify**: 버그 수정 문서의 폐기된 advisor 참조와 핸드오프 파일 전면 금지를 새 독립 검토·보고 매체 기준에 맞춤. 설치본의 `PI_CODING_AGENT_DIR`과 custom-agent 탐색 루트 차이를 README에 명시하고, 동명 agent override가 글로벌 컨텍스트를 잃는다는 부정확한 설명을 제거한다.

## 2026-09-15
* **Fix**: 사용 불가가 보고되고 갱신된 이 환경의 Codex 모델 목록에서도 제외된 GPT-5.3 Codex Spark를 기본/Max·Anthropic Pro 프로필의 `tiny`와 `enabledModels`에서 제거. 경량 분류·요약에 맞는 GPT-5.6 Luna low로 교체하고 다른 역할·fallback은 유지한다. 공식 문서는 Spark를 Pro 전용 연구 프리뷰로 안내하므로 서비스 전체 지원 종료로 단정하지 않으며, 가이드의 Spark 전용 quota·컨텍스트 가정을 제거한다.

## 2026-09-08
* **Fix**: 설치본이 내보낸 빌트인 5종(`scout`, `reviewer`, `security-reviewer`, `task`, `sonic`)에 맞춰 [에이전트 가이드](/agents/guide.md)와 index를 정정. 2026-08-23의 7종 설명을 대체하고, 제공되지 않는 `librarian` 호출 지침을 글로벌 AGENTS·README·도구 정책에서 제거한다.
* **Clarify**: 모델 역할 배정과 에이전트 등록·실행을 구분. `designer` 모델 별칭과 fallback 설정은 유지하되 빌트인 에이전트로 안내하지 않고, 라이브러리 조사는 직접 처리 또는 `scout`, UI/UX 구현은 `task`로 연결한다. 위임 전 현재 세션의 가용 목록을 기준으로 선택하도록 명시한다.

## 2026-09-07
* **Update — 전제 정정(2026-09-18)**: 상급 모델 우선 정책에 따라 기본/Max·Anthropic Pro 프로필의 `default`·`task`를 Astra xhigh로 전환하고 기존 `designer` 배치와 `extendedContext=true`를 유지한 변경이다. 원래 기록의 "Astra의 272K 제약 해소"는 잘못된 전제이며 모델 선택 근거로 사용하지 않는다. 2026-09-05의 Astra 한정 사용 정책은 폐기됐다.
* **Update**: `slow`·`plan`의 OpenAI fallback을 Astra xhigh, `vision` fallback을 Astra high로 전환. 경량 Terra/Spark, Claude primary 역할, advisor의 Terra fallback, 역할당 단일 교차-provider fallback 정책은 유지한다.

## 2026-09-05
* **Update — 전제 정정(2026-09-18)**: GPT-6 Astra를 기본/Max·Anthropic Pro 프로필의 `designer`에 xhigh로 배치하고 `enabledModels`에 추가했으며 당시 `default`·`task`는 GPT-5.6 Sol xhigh를 유지했다. 이 선택을 정당화하던 "Astra의 272K 컨텍스트 제약"은 잘못된 설명이다. 해당 제약이나 Astra 한정 사용 정책을 현재 판단에 적용하지 않는다.

## 2026-09-04
* **Policy**: 모든 명시적 Opus 역할·fallback은 `anthropic/claude-opus-5`만 허용하고, 대상 모델을 Opus 5로 지정할 수 없는 Anthropic provider-managed legacy Opus fallback은 비활성화한다.
* **Update**: 공유 기본 프로필을 최신 상급 모델 기준으로 확정해 `slow`·`plan`·`advisor`와 모든 Codex→Anthropic fallback은 Claude Opus 5, 기본/Max `vision`은 Claude Fable 5.1로 라우팅. Fable을 사용할 수 없는 Anthropic Pro 구독은 `HELLO_OMP_ANTHROPIC_PLAN=pro`로 모든 Anthropic 역할·fallback·advisor를 Opus 5로 통일한다.
* **Fix**: Anthropic 인증이 없는 PC에서 `slow`·`plan`·`vision`·`advisor`와 Codex fallback이 실패하던 포터블 프로필을 OpenAI Codex-only로 전환. `modelRoles`·`enabledModels`·fallback·advisor 상태를 명시적으로 덮어써 기존 Fable 설정이 남지 않게 하고, 두 번째 provider를 저장소에 구성하기 전까지 advisor와 model fallback을 비활성화한다.
* **Update**: 공유 OMP 프로필의 Anthropic 역할과 fallback을 모두 Claude Fable 5.1로 통일하고, Fable 권한이 없는 머신의 Opus 사용은 로컬 설정으로 분리. GPT 메인 레인은 GPT-5.6 Sol/Terra, `tiny`는 GPT-5.3 Codex Spark를 유지한다.
* **Update**: `extendedContext=true`를 포터블 OMP 설정에 고정해 GPT-5.6 Sol/Terra/Luna의 subscription Codex 컨텍스트를 표준 요율 구간인 272K에서 1M으로 확장. 272K 입력 초과 요청에는 OpenAI long-context 요율이 적용된다.
* **Fix**: OMP 18.1.8에서 제거된 `task.isolation.mode=auto` 포터블 설정을 현재 스키마의 `task.isolation.enabled=true`와 `isolation.backend=auto`로 교체하고 서브에이전트 지침의 키 이름도 동기화. 클린 배포에서도 격리를 활성화하고 `setup.sh`가 중단 없이 전체 설정을 배포한다.
* **Fix**: 비활성 상태인 context promotion이 GPT-5.3 Codex Spark의 128K 컨텍스트 초과 시 자동 승격한다고 설명하던 에이전트 가이드를 실제 compaction/overflow 복구 동작에 맞게 수정.

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
* **Update**: 고빈도 역할은 GPT 5.6 Sol/Terra, 전문 역할은 Claude Opus/Fable 5로 통일하고 모든 quota/429 fallback에서 GPT 5.5와 legacy Claude Opus를 제거. `reviewer`는 `slow = claude-opus-5:high`를 직접 따르도록 에이전트별 pin을 비웠고, 매 턴 advisor도 Fable 5 high로 낮춰 장시간 `xhigh` 사고 턴을 제한. legacy Opus로 향하는 Anthropic 암묵적 서버 fallback은 비활성화.

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
* **Update**: GPT-5.6 Sol/Terra를 고빈도 `default`·`task`·`designer`·`smol`·`commit` 주 모델로 배치하고, 당시 legacy Claude Opus를 `slow`(reviewer), Claude Fable 5를 `plan`·`advisor`·`vision` 주 모델로 배치. 모든 역할의 quota/429 fallback chain은 GPT↔Claude 교차 백업으로 재정렬하고, 각 역할의 primary 모델은 자기 fallback에서 제거.
* **Fix**: 현 OMP 번들 `reviewer`·`plan` frontmatter가 `thinkingLevel`을 고정하지 않으므로 동명 override 파일을 제거하고, setup 재실행 시 이 레포가 관리하던 이전 override를 배포본 config dir에서도 정리하도록 유지.

## 2026-07-06
* **Sync**: 로컬 OMP 모델 역할의 `designer`·`advisor` xhigh 설정과 당시 legacy Opus 우선 quota/429 fallback chain을 소스 설정으로 승격하고, setup 배포본과 재동기화.

## 2026-07-03
* **Update**: OMP 모델 역할 설정을 Claude Fable 5 중심으로 갱신하고, 최고품질형으로 `slow`·`plan`은 xhigh, 매턴 보조 역할은 high로 정리. bundled `reviewer`·`plan`의 `thinkingLevel: high` 고정을 우회하기 위해 원본 버전 주석이 있는 동명 override를 추가했으며, 당시 Fable 5 safety-classifier refusal은 provider-managed legacy Opus 서버사이드 fallback으로 처리.

## 2026-06-30
* **Update**: Google OKF v0.1 예약 파일 규칙에 맞춰 하위 디렉터리 `index.md`를 progressive-disclosure 파일로 추가하고, concept 문서는 `security/overview.md`·`agents/guide.md`로 분리.
* **Update**: OKF 학습 축적 루프를 추가하고, setup에서 배포본 OKF 경로와 소스 OKF 경로를 함께 주입해 소스 OKF를 영속 학습 원장으로 사용하도록 정리.
* **Fix**: setup config dir가 레포 루트와 같을 때 중단하는 가드를 추가해 소스 OKF 원장 삭제를 방지.
* **Fix**: `.gitattributes`를 추가해 `setup.sh` LF, `setup.ps1` CRLF 줄끝 정책을 고정.

## 2026-06-29
* **Init**: OKF 번들 초기화 — 글로벌 CLAUDE.md 룰과 omp 번들 에이전트 정의에서 정리. 도구 정책은 omp 기본 도구 우선(MCP 대체)으로 적용.

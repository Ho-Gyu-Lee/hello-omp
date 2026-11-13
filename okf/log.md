# Change Log

구조 변경(개념의 추가·분할·병합·삭제·이름 변경)과 기록 기준의 변경만 남긴다. 내용 갱신의 이력은 Git이 맡는다. 이 문서는 당시의 기록이며 현재 사양의 근거가 아니다.

2026-10-18 이전의 상세 이력(학습 항목별 계기·정정 포함)은 `git show f380421:okf/log.md`로 본다.

## 2026-11-13
* **신설:** [문서 사이트의 짝 문서 일치와 Docusaurus 버전·번역·빌드 계약](/development/docs-site.md). 로컬 `learned/`의 개발 문서 작업 기록에서 제품 고유 요소를 걷어 낸 일반 계약(플랫폼별·언어별 짝 문서의 일치와 대조, Docusaurus 2.4.3의 공개 폴더·버전 스냅샷의 번역 복사·번역 짝·링크·draft·MDX 1·생성 폴더 공유)을 옮겼다. 같은 날 로컬의 일반 사실을 [워크플로](/workflow.md)·[코딩 스타일](/coding-style.md)·[난수·재현 계약](/development/randomness.md)·[게임 클라이언트 체크리스트](/game/client-checklist.md)에 더하고 로컬에서는 고유 사실만 남겼다.

## 2026-11-10
* **신설:** [클라우드 침해 조사의 로그 공백·신원 판별·노출 범위 (AWS·GCP)](/security/cloud-incident-forensics.md). 로컬 `learned/`의 침해 대응 기록에서 직장·계정 고유 요소를 걷어 낸 일반 계약(CloudTrail 리전·트레일 중지·요청 본문 은닉, EKS 토큰 검증과 Lambda 환경 변수 복호화 흔적, 노출 범위, GCP 데이터 접근 로그 공백과 대체 근거, 출발지 제한 수단의 한계)을 옮겼다. 같은 날 로컬의 일반 사실을 [런타임 진단](/development/runtime-diagnostics.md)·[코드 리뷰 보안 체크리스트](/security/review-checklist.md)·[DB 제품별 비자명 계약](/database/design.md)·[데이터 형식](/development/data-formats.md)·[UI 입력·지역화](/development/ui-input.md)에 더하고 로컬에서는 고유 사실만 남겼다.

## 2026-11-06
* **기록 기준 보강:** 사용자 판정 전인 제작 방법·조정값을 처방이 아니라 관찰 사실과 판정 상태로 쓰고, 시험 중의 원인 설명은 가설로 적게 했다. 사용자가 경로를 실패로 판정하면 원인이 밝혀지지 않았더라도 그 경로의 처방을 실패 사실로 바꾸고 원인 단정을 낮춘다. 정본은 [OKF 학습 축적](/learning/accumulation.md)이다.
* **이름 변경:** [AI 에셋 생성](/development/ai-asset-generation.md)의 제목을 실패한 생산 경로를 먼저 다루도록 바꾸고, 게임 품질에 이르지 못한 AI 캐릭터 에셋 경로(원인 미확정)와 실행 성공·품질 합격의 분리를 첫 절로 올렸다. 실패한 투영·부품 조립 경로의 조정값은 지웠고, 도구·라이선스 사실은 남겼다. 프로젝트별 판정과 수치는 로컬 기록에만 둔다.
* **기록 기준 보강:** 고친 원리 문장을 재실행으로 확인할 때 원래 위반의 재발뿐 아니라 고치기 전 결과와 견주어 같은 시나리오에서 새로 생긴 퇴행도 보게 했다. 정본은 [OKF 학습 축적](/learning/accumulation.md)이다.

## 2026-11-04
* **신설:** [게임 정적·동적 데이터와 DB 설계](/game/data-design.md). 로컬 `learned/`에 두던 사용자의 게임 데이터 설계 선호를 사용자 결정으로 공개 정본에 옮겼다. 2026-10-18에 지운 `game/static-data.md`와 달리 일반 지식이 아니라 사용자 방향을 담는다. 같은 날 로컬의 커밋 보고 규칙·DynamoDB 소비 용량·Godot 개발 방향 개념도 [사용자 개발 방향](/direction.md)·[DB 제품별 비자명 계약](/database/design.md)·[Godot C++ 성능 중심 시뮬레이션 코어](/game/godot-simulation.md)로 옮기고 로컬에서 지웠다.
* **기록 기준 보강:** 로컬 concept의 승격과 공개 반영 커밋 전에 원격과 비교하고, 받을 변경이 있으면 `knowledge-sync`로 먼저 받아 최신 공개 번들 위에서 중복·충돌을 판정하게 했다. 정본은 [OKF 학습 축적](/learning/accumulation.md)이다.

## 2026-11-02
* **기록 기준 보강:** 고친 원리 문장의 효과 확인에 과잉 적용을 보는 대조 시나리오를 더했고, 반복 위반을 강조로 막지 않고 예외 없는 규칙만 결정적 검사로 옮기는 안을 제안하게 했다. 메인·구현·검토 모델의 세대를 바꾸면 이전 모델용 상시 지침 문장을 다시 판정하고, 프로젝트 `AGENTS.md`에는 코드로 알 수 없는 현행 지침만 둔다. 정본은 [OKF 학습 축적](/learning/accumulation.md)이다.

## 2026-10-28
* **기록 기준 정정:** 2026-10-18에 없앤 판정 시점을 되살렸다. 구현·버그 수정·조사·설정/규칙 변경 작업과 사용자 교정·영속 결정은 완료 전에 별도 요청 없이 학습을 판정하고, 기록했거나 후보를 보류했을 때 한 줄로 보고한다. 보류 사유는 세 질문과 기록 위치 기준으로 한정했다(한 번의 확인·한 프로젝트 근거만으로 보류하지 않음). 정본은 [OKF 학습 축적](/learning/accumulation.md)이다.

## 2026-10-27
* **기록 기준 정정:** 2026-10-18 항목의 목적 정의('모델 기본값을 사용자의 방향으로 바꾸는 차이'만)를 사용자 교정으로 바로잡았다. 지식 베이스는 사용자 방향과 함께 모델에 부족한 지식(학습에 없거나 바뀐 사실, 환경 특이점, 실무에서 자주 놓치는 판단 기준)도 담는다. 정본은 [OKF 학습 축적](/learning/accumulation.md)이다.

## 2026-10-18
* **Restructure — 사용자 방향 중심으로 전면 정리:** 지식 베이스의 목적을 '사용자와 같은 지식'이 아니라 '모델 기본값을 사용자의 방향으로 바꾸는 차이'로 다시 정했다(사용자 결정). 기록 판정 세 질문과 실수의 원리화를 [OKF 학습 축적](/learning/accumulation.md)에 두고, 완료 보고의 필수 학습 필드를 없앴다(기록했을 때만 한 줄).
  - 신설: [사용자 개발 방향](/direction.md)(프로필·코드 표기·멀티스레드·MMORPG·MSA·단일 로직 스레드 관점·설계와 작업 방식). 설정 레포 `rules/RULES.md`(모든 에이전트·서브에이전트에 적용되는 sticky 규칙)와 명령 `/interview`·`/arch-review`.
  - 글로벌 `rules/AGENTS.md`는 메인 세션 전용 소통·판단·마무리 규칙으로 줄였다. task 서브에이전트가 `AGENTS.md`를 상속하지 않으므로(OMP 18.12.1) 공통 방향은 `RULES.md`로 옮겼다.
  - 전 개념에서 최신 모델이 아는 일반 지식·일회성 사건 세부·서적 근거·중복을 지우고, 사건별 실수는 원리 문장으로 합쳤다.
  - 병합: `development/network-time.md`·`network-delivery.md`·`network-io.md` → `development/network.md`, `development/data-lifecycle.md` → `development/data-formats.md`, `development/localization.md` → `development/ui-input.md`.
  - 삭제(남길 방향·비자명 사실이 없거나 다른 정본에 흡수): `development/network-topology.md`, `development/audio-runtime.md`, `game/static-data.md`, `game/random-replay.md`, `game/godot-2d-view.md`, `tools/ecosystem-watch.md`.
  - 로컬 `learned/`의 프로젝트 문서는 각 프로젝트 레포의 문서로 옮기고 로컬에서 보관 처리했다. 프로젝트 한정 결정·용어의 기록 위치를 프로젝트 레포로 정했다.

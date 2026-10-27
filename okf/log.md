# Change Log

구조 변경(개념의 추가·분할·병합·삭제·이름 변경)과 기록 기준의 변경만 남긴다. 내용 갱신의 이력은 Git이 맡는다. 이 문서는 당시의 기록이며 현재 사양의 근거가 아니다.

2026-10-18 이전의 상세 이력(학습 항목별 계기·정정 포함)은 `git show f380421:okf/log.md`로 본다.

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

# Change Log

## 2026-07-03
* **Update**: OMP 모델 역할 설정을 Claude Fable 5 중심으로 갱신하고, 최고품질형으로 `slow`·`plan`은 xhigh, 매턴 보조 역할은 high로 정리. bundled `reviewer`·`plan`의 `thinkingLevel: high` 고정을 우회하기 위해 원본 버전 주석이 있는 동명 override를 추가했으며, Fable 5 safety-classifier refusal 시 Opus 4.8 서버사이드 폴백을 사용하도록 설정.

## 2026-06-30
* **Update**: Google OKF v0.1 예약 파일 규칙에 맞춰 하위 디렉터리 `index.md`를 progressive-disclosure 파일로 추가하고, concept 문서는 `security/overview.md`·`agents/guide.md`로 분리.
* **Update**: OKF 학습 축적 루프를 추가하고, setup에서 배포본 OKF 경로와 소스 OKF 경로를 함께 주입해 소스 OKF를 영속 학습 원장으로 사용하도록 정리.
* **Fix**: setup config dir가 레포 루트와 같을 때 중단하는 가드를 추가해 소스 OKF 원장 삭제를 방지.
* **Fix**: `.gitattributes`를 추가해 `setup.sh` LF, `setup.ps1` CRLF 줄끝 정책을 고정.

## 2026-06-29
* **Init**: OKF 번들 초기화 — 글로벌 CLAUDE.md 룰과 omp 번들 에이전트 정의에서 정리. 도구 정책은 omp 기본 도구 우선(MCP 대체)으로 적용.

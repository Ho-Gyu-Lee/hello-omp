# Change Log

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

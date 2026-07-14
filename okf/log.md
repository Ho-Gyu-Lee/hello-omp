# Change Log

## 2026-07-14
* **Fix**: OMP TUI가 제목·목록·표·코드 블록을 렌더링하는 동작에 맞춰 터미널 응답의 마크다운 금지를 제거하고, 필요한 구조화와 Mermaid 시각화를 적극 활용하도록 글로벌·상세 응답 규칙을 명확화.

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

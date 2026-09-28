# OKF Knowledge Bundle

omp 에이전트가 참조하는 룰·도메인 지식이다. 작업 유형에 맞는 개념을 `read`로 읽어라. 링크는 번들 루트 기준이다.

## 룰
* [정확성](/accuracy.md) - 확실성·검색 소진·버전 최신화·기간별 트렌드 근거·에스컬레이션·도달 가능 상태
* [응답 원칙](/response-principles.md) - 앵커·비한정 예시 해석·범위 제한·함축성·보고 매체 선택·검토 후 통합 최종본
* [코딩 스타일](/coding-style.md) - YAGNI·결정 사다리·언어 공통 스타일 정본·프로젝트 우선순위·언어 의미/포매터 예외·공개 API·아키텍처·서버 상태·외부 응답 계약
* [언어 공통 코딩 스타일](/language-style.md) - PascalCase 타입/함수·mPascalCase 필드·camelCase 지역/인자·UPPER_SNAKE_CASE 상수/enum 값·C/C++/C#/Go/Python/JS/TS 예외·Good/Bad·요약표
* [버그 수정 원칙](/bugfix.md) - 결함 클래스 수정·전방 영향 범위 분석·후방 의도 복구(롤백 차단)·회귀 방지·YAGNI 경계
* [워크플로](/workflow.md) - 개발 흐름·수락 기준-증거 폐루프·작업 파일·산출물 보존·정본 검증·독립 검토·학습 판정 완료 보고
* [OKF 학습 축적 루프](/learning/accumulation.md) - 실행 조건·로컬 기록과 공개 반영·기존 지식 재평가·검증·배포·완료 보고

## 축적 지식
* [축적 지식](/learned/) - 소스 OKF에 누적해 setup으로 배포하는 로컬 지식. 개인 선호·프로젝트 한정 사실·공개 범위 검토 중인 concept은 Git 제외 대상이며 디렉터리에서 발견한다. 공개 가능한 교훈은 공통 concept에 별도로 반영한다

## 보안
* [보안 개요](/security/overview.md) - 즉시 경고·취약점 설명·외부 자료의 신뢰 경계·요청 범위에 따른 외부 코드 실행
* [게임 보안](/security/game.md) - 서버 권위·예측/보정·커맨드·경제·정보 가시성·세션/통신
* [코드 리뷰 보안 체크리스트](/security/review-checklist.md) - 공통 서버·애플리케이션·게임 클라·게임 서버
* [요청 서명 정규화 계약](/security/signing-canonicalization.md) - 크로스 런타임 서명 베이스 불일치: 키 정렬·값 문자열화·기대 키 집합

## 게임 클라이언트/서버
* [네트워크 동기화](/game/network-sync.md) - 권위 상태·입력 처리 ACK·예측/재실행·원격 보간·판정 보상·복구·전달 의미론
* [클라이언트 체크리스트](/game/client-checklist.md) - 메모리·프레임·렌더링·수명·네트워크 상태·반응성·플랫폼
* [서버 체크리스트](/game/server-checklist.md) - Gateway·단일 로직 소유자·큐·팬아웃·틱 예산·영속화·장애 복구
* [Godot + C++ 개발](/game/godot-cpp.md) - 공식 릴리스·API 타깃·GDExtension/모듈·물리/전투/네트워크·로컬 인게임/서버 이관·4X/MMORPG 성능·재사용 UI·수명·실행 검증

## 도구
* [omp 기본 도구](/tools/builtin.md) - 세션별 가용성·lsp·AST·browser facade·백그라운드 작업·TypeScript+Bun
* [MCP 정책](/tools/mcp.md) - 기본 도구 우선·외부 연동·스킬과 접근 계약 구분·공급망·인증
* [스킬](/tools/skills.md) - 가용 스킬 사용·점진적 로딩·host 호환성·외부 설치와 실행 검토
* [서브에이전트](/tools/subagents.md) - 위임 기준·병렬 계약·파일 소유권·task 격리·반환 결과 검증
* [에이전트 생태계 동향](/tools/ecosystem-watch.md) - 2026-08-26~09-26 공식 변경·GitHub 월간 관측·지침 반영과 미채택 근거

## 에이전트
* [에이전트 가이드](/agents/guide.md) - 빌트인 에이전트·모델 역할 전체 목록·미배정 해석·실사용 평가·배정과 실행의 구분

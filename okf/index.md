# OKF Knowledge Bundle

omp 에이전트가 참조하는 룰·도메인 지식이다. 작업 유형에 맞는 개념을 `read`로 읽어라. 링크는 번들 루트 기준이다.

## 룰
* [정확성](/accuracy.md) - 확실성·검색 소진·에스컬레이션·도달 가능 상태
* [응답 원칙](/response-principles.md) - 앵커·비한정 예시 해석·범위 제한·함축성·옵션 제시·구조화
* [코딩 스타일](/coding-style.md) - YAGNI·결정 사다리·네이밍·공개 API·아키텍처·서버 상태 처리
* [버그 수정 원칙](/bugfix.md) - 결함 클래스 수정·전방 영향 범위 분석·후방 의도 복구(롤백 차단)·회귀 방지·YAGNI 경계
* [워크플로](/workflow.md) - 개발 흐름·수락 기준-증거 폐루프·실패 가능한 검증·산출물 보존·독립 평가
* [OKF 학습 축적 루프](/learning/accumulation.md) - 영속 학습의 기준·절차·변경 후 무결성 검사

## 축적 지식
* [축적 지식](/learned/) - 소스 OKF에 누적해 setup으로 배포하는 개인별·환경별 영속 지식. concept 파일은 프로젝트·회사·라이브러리 한정 내부 지식이라 gitignore(로컬 전용)이며 `/learned/` 디렉터리를 직접 읽어 발견한다

## 보안
* [보안 개요](/security/overview.md) - 즉시 경고·취약점 설명 원칙·MCP 공급망
* [게임 보안](/security/game.md) - 서버 권위·예측/보정·커맨드·경제·정보 가시성·세션/통신
* [코드 리뷰 보안 체크리스트](/security/review-checklist.md) - 공통 서버·애플리케이션·게임 클라·게임 서버
* [요청 서명 정규화 계약](/security/signing-canonicalization.md) - 크로스 런타임 서명 베이스 불일치: 키 정렬·값 문자열화·기대 키 집합

## 게임 클라이언트/서버
* [네트워크 동기화](/game/network-sync.md) - 권위 상태·시간/순서·예측/보정·복구·전달 의미론·검증
* [클라이언트 체크리스트](/game/client-checklist.md) - 메모리·프레임·렌더링·수명·네트워크 상태·반응성·플랫폼
* [서버 체크리스트](/game/server-checklist.md) - 메모리·동시성·네트워크·틱·권위 상태·복구·처리량

## 도구
* [omp 기본 도구](/tools/builtin.md) - lsp·ast·web_search·read·browser (현 MCP 대체)
* [MCP 정책](/tools/mcp.md) - 기본 도구 우선, MCP는 기본으로 안 되는 외부 연동만
* [스킬](/tools/skills.md) - 스킬 사용 시점
* [서브에이전트](/tools/subagents.md) - 위임 기준·병렬 계약·파일 소유권·task 격리·반환 결과 검증

## 에이전트
* [에이전트 가이드](/agents/guide.md) - 현재 빌트인 에이전트 7종·역할별 사용 시점·modelRoles 라우팅

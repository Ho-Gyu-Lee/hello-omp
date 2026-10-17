---
type: Checklist
title: 코드 리뷰 보안 체크리스트
description: 공통 서버·애플리케이션 및 게임 클라이언트·서버 보안 리뷰 항목.
tags: [security, review, checklist, server, game]
timestamp: 2026-10-17T00:00:00Z
---

# 코드 리뷰 보안 체크리스트

## 공통
- [ ] 입력값 검증(타입·범위·형식)
- [ ] SQL 파라미터 바인딩
- [ ] XSS 방지(출력 이스케이프)
- [ ] CSRF: 쿠키 등 자동 첨부 자격증명과 로그인·세션 설정 경로의 위험을 실제 인증 흐름으로 판정하는가. framework의 검증된 방어를 우선하고 token·Origin·Fetch Metadata의 서버 검증 범위 및 누락·null·미지원 시 대체 방어/거부를 확인하는가. REST/JWT 명칭·CORS·SameSite만으로 제외하지 않으며 same-site와 same-origin·하위 도메인 신뢰 경계를 구분하는가. 상태변경을 GET으로 노출하지 않는가([OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html))
- [ ] 인증/인가 로직 확인
- [ ] 객체 수준 인가: 클라이언트가 지정한 리소스 ID(uuid/키/인덱스 등)에 대해 요청 주체가 소유자·권한 보유자인지 서버에서 검증하는가(BOLA/IDOR). 목록·로그에 노출되는 ID는 비밀이 아니다
- [ ] 게이트웨이·프록시가 HTTP 헤더를 내부 메타데이터로 변환할 때 신원·권한 키를 허용 목록으로만 전달하는가. 정확한 이름 비교의 차단 목록은 라이브러리 기본 매핑의 접두사·대소문자 변환 경로로 우회될 수 있다(예: [grpc-gateway `DefaultHeaderMatcher`](https://pkg.go.dev/github.com/grpc-ecosystem/grpc-gateway/v2/runtime#DefaultHeaderMatcher)는 `Grpc-Metadata-` 접두사를 떼어 gRPC 메타데이터로 전달한다. [v2.31.0](https://github.com/grpc-ecosystem/grpc-gateway/releases/tag/v2.31.0)(2026-09-25)은 예약된 `grpcgateway-` 네임스페이스로 변환되는 `Grpc-Metadata-grpcgateway-*`를, [v2.32.0](https://github.com/grpc-ecosystem/grpc-gateway/releases/tag/v2.32.0)(2026-10-14)은 게이트웨이가 직접 채우는 `x-forwarded-for`·`x-forwarded-host`로 변환되는 `Grpc-Metadata-X-Forwarded-*`를 각각 새로 거부한다. 그 밖의 `Grpc-Metadata-*`는 여전히 접두사만 제거해 전달한다. 소스·릴리스 노트 확인 2026-10-15). 권한 수준·신원은 클라이언트가 보낸 값이 아니라 검증된 자격(토큰 검증 결과·수신 리스너·서명)으로 서버가 설정하고, 같은 키의 클라이언트 값은 수신 단계에서 먼저 제거하는가
- [ ] 신뢰 표식이 없을 때 최고 권한으로 동작하는 fail-open 기본값(예: 게이트웨이 표식이 없는 직접 연결을 관리자로 취급)이 없는가. 스키마·권한 설정을 바꾸는 관리 연산(DDL 등)도 데이터 연산과 같은 인가를 거치는가
- [ ] 요청별 파싱·인증 결과를 공유 객체의 필드에 저장했다가 다시 읽지 않는가. 동시 요청이 덮어쓰면 한 요청의 명령이 다른 요청의 신원·권한 컨텍스트로 실행된다. 결과는 호출별 반환값으로 전달하고 `-race` 등 동시 실행 검증을 둔다
- [ ] 민감정보 로깅 여부: 인증 실패·오류 경로의 로그도 확인하는가. 검증 서버의 5xx·타임아웃으로 실패한 요청의 토큰은 유효할 수 있으므로, 원문 대신 해시 앞자리·길이처럼 원문을 복원할 수 없는 값만 남기는가
- [ ] HTTPS 강제 여부
- [ ] 에러 메시지 정보 노출
- [ ] 외부 입력을 수락하기 전에 baseline·캐시·통계·저장 상태를 갱신하지 않는가
- [ ] 부분 갱신의 각 필드를 독립 검증한 뒤 필드 조합과 기존 상태의 교차 불변조건을 검증하는가
- [ ] 보정·정규화·재계산된 최종 accepted 값이 저장·캐시·이벤트·응답 전체에 사용되는가
- [ ] 저장소 안의 설정 파일이 정한 경로(형제 저장소, include 패턴)로 파일을 읽거나 git을 실행하는 도구가 그 경로를 프로젝트 상대 경로와 이름을 명시한 형제 디렉터리로 제한하고, 링크·junction을 따라 경계 밖으로 나가지 않는지 실제 경로로 대조하는가. 그런 디렉터리에서 git은 `-c core.fsmonitor=false -c safe.bareRepository=explicit`로 실행하고 `rev-parse --show-toplevel`이 의도한 디렉터리인지 확인하는가. `core.fsmonitor`에 경로가 들어 있으면 git이 그 훅 명령을 실행하고, `safe.bareRepository`는 명령줄·전역·시스템 설정에서만 적용된다([git-config](https://git-scm.com/docs/git-config), 확인 2026-10-17)
- [ ] 저장소 안에서 실행되는 도구가 외부 명령을 이름만으로 실행하지 않는가. Windows에서 Bun 1.4.3의 `Bun.spawn`은 현재 디렉터리의 `git.exe`·`git.bat`을, Node 24.17.0의 `child_process.spawnSync`는 `git.exe`를 PATH보다 먼저 실행했다(관찰 2026-10-17). PATH에서 절대 경로로 해석한 실행 파일(Bun은 `Bun.which`)이 프로젝트 밖에 있는지 확인해 실행하고 작업 디렉터리는 중립 위치로 둔다

## 게임 클라이언트
- [ ] 로컬 세이브·설정·패킷 등 클라 데이터를 무검증 신뢰하지 않는가
- [ ] 재화·전투 결과·확률 등 민감 판정을 클라에서 확정하지 않는가(서버 권위)
- [ ] 클라 위변조 탐지는 위협 모델에 따른 보조 신호로 판단하고, 신호 부재·정상 판정 모두 서버의 인증·인가·입력·게임 불변조건 검증을 우회하지 않는가
- [ ] fog of war·비공개 상태를 클라이언트에 전송한 뒤 표시만 숨기고 있지 않은가
- [ ] 인증 컨텍스트(계정·세션)에 스코프된 캐시(ID 목록·토큰)를 로그인·로그아웃·권한 승격·계정 전환 시 폐기하는가. 번호·인덱스로 대상을 고르는 진입점이 사용 직전에 재조회하는가

## 게임 서버
- [ ] 클라이언트 입력을 서버에서 검증하는가
- [ ] 게임 상태 변경이 서버 권위로 처리되는가
- [ ] 자원 변동에 레이스 컨디션이 없는가
- [ ] 커맨드 rate limiting이 적용되었는가
- [ ] 패킷 시퀀스/타임스탬프 검증이 있는가
- [ ] 거부된 입력이 권위 상태·통계·baseline·replay window를 갱신하지 않는가
- [ ] 최종 accepted 값이 저장·시뮬레이션·송신자 보정·모든 허용 observer에게 전파되는가
- [ ] 비가역 커맨드가 command/transaction ID로 멱등 처리되는가
- [ ] 재접속·authority handoff 후 이전 session/entity generation의 패킷을 거부하는가
- [ ] host/listen-server/local fast path가 원격 경로와 같은 권한·검증 불변조건을 지키는가
- [ ] interest management가 플레이어별 정보 인가를 서버에서 강제하는가

상세 원칙: [코딩 스타일의 서버 특화 규칙](/coding-style.md), [게임 보안](/security/game.md), [보안 개요](/security/overview.md).

---
type: Checklist
title: 코드 리뷰 보안 체크리스트
description: 리뷰에서 놓치기 쉬운 환경·도구 특이 계약(헤더 변환 우회, 저장소 설정의 Git 실행, Windows 실행 파일 탐색, 경로 별칭). 일반 보안 항목과 게임 항목은 다루지 않는다.
tags: [security, review, checklist, server, git, windows]
timestamp: 2026-10-18T00:00:00Z
---

# 코드 리뷰 보안 체크리스트

일반 웹·서버 보안(입력 검증·SQL 바인딩·XSS·CSRF·인증/인가·BOLA·HTTPS·에러 노출)은 기본으로 점검하며 옮기지 않는다. 게임 항목은 [게임 보안](/security/game.md), 즉시 경고·자격증명은 [보안 개요](/security/overview.md)를 따른다.

- [ ] 게이트웨이·프록시가 HTTP 헤더를 내부 메타데이터로 변환할 때 신원·권한 키를 허용 목록으로만 전달하는가. 이름 비교 차단 목록은 라이브러리 기본 매핑의 접두사·대소문자 변환으로 우회될 수 있다. 예: [grpc-gateway `DefaultHeaderMatcher`](https://pkg.go.dev/github.com/grpc-ecosystem/grpc-gateway/v2/runtime#DefaultHeaderMatcher)는 `Grpc-Metadata-` 접두사를 떼어 gRPC 메타데이터로 전달한다. [v2.31.0](https://github.com/grpc-ecosystem/grpc-gateway/releases/tag/v2.31.0)(2026-09-25)은 `Grpc-Metadata-grpcgateway-*`를, [v2.32.0](https://github.com/grpc-ecosystem/grpc-gateway/releases/tag/v2.32.0)(2026-10-14)은 `Grpc-Metadata-X-Forwarded-*`를 새로 거부하며 그 밖의 `Grpc-Metadata-*`는 접두사만 제거해 전달한다(확인 2026-10-15). 권한 수준·신원은 클라이언트가 보낸 값이 아니라 검증된 자격(토큰 검증 결과·수신 리스너·서명)으로 서버가 설정하고 같은 키의 클라이언트 값은 수신 단계에서 먼저 제거한다.
- [ ] 저장소 안의 설정 파일이 정한 경로(형제 저장소, include 패턴)로 파일을 읽거나 git을 실행하는 도구는 그 경로를 프로젝트 상대 경로와 이름을 명시한 형제 디렉터리로 제한하고 링크·junction이 경계 밖으로 나가지 않는지 실제 경로로 대조하는가. 그 디렉터리의 git은 `-c core.fsmonitor=false -c safe.bareRepository=explicit`로 실행한다. `core.fsmonitor`에 경로가 들어 있으면 git이 그 훅 명령을 실행하고 `safe.bareRepository`는 명령줄·전역·시스템 설정에서만 적용된다([git-config](https://git-scm.com/docs/git-config), 확인 2026-10-17).
- [ ] 저장소 안에서 실행되는 도구가 외부 명령을 이름만으로 실행하지 않는가. Windows에서 Bun 1.4.3의 `Bun.spawn`은 현재 디렉터리의 `git.exe`·`git.bat`을, Node 24.17.0의 `child_process.spawnSync`는 `git.exe`를 PATH보다 먼저 실행했다(관찰 2026-10-17). PATH에서 절대 경로로 해석한 실행 파일(Bun은 `Bun.which`)이 프로젝트 밖에 있는지 확인해 실행하고 작업 디렉터리는 중립 위치로 둔다.
- [ ] 사용자가 준 경로를 이름으로 비교해 막거나 잠금·식별 키로 쓸 때 같은 디렉터리의 다른 표기를 함께 막는가. Windows는 대소문자, 8.3 짧은 이름(`PROJEC~1`), `<이름>::$INDEX_ALLOCATION`으로 같은 디렉터리를 연다(Windows 11 build 26300·Bun 1.4.3에서 세 표기의 `lstat` `ino`가 같음, 관찰 2026-10-17). 소속 판정은 이름이 아니라 `dev`·`ino`(NTFS ID는 2^53을 넘을 수 있어 bigint)로 하되, ID가 0이나 모두 1이면 고유 ID가 없고 ReFS의 64비트 ID는 고유성이 보장되지 않으므로([BY_HANDLE_FILE_INFORMATION](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/ns-fileapi-by_handle_file_information)) 디스크 철자의 실제 경로도 대조한다. 대소문자 접은 키는 파일 시스템보다 넓게 묶고(NTFS에서 `xß`와 `xẞ`는 다른 이름인데 JavaScript `toLowerCase`는 `ẞ`를 `ß`로 바꾼다), 끝이 `.`·공백인 구간과 `:`가 든 구간은 받지 않는다([Naming Files](https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file)).

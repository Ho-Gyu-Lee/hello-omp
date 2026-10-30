# 보안

* [보안 개요](/security/overview.md) - 요청 범위와 무관한 즉시 경고, 취약점 설명·민감정보·Git 원격 자격증명 처리, 외부 자료의 신뢰 경계, 외부 코드 실행·승인·guard 우회 금지, OMP 승인과 실행 격리의 구분.
* [게임 클라/서버 보안](/security/game.md) - 서버 권위·AI 판정의 신뢰 경계, 보안과 반응성의 균형, 대상 인가, 세션 재개·TLS 0-RTT·UDP 사전 할당, 정보 가시성, Lua bytecode와 출하 테스트 훅.
* [코드 리뷰 보안 체크리스트](/security/review-checklist.md) - 리뷰에서 놓치기 쉬운 환경·도구 특이 계약(헤더 변환 우회, 저장소 설정의 Git 실행, Windows 실행 파일 탐색, 경로 별칭, 무인 설치의 비밀 키 초기화와 파일 secret 복사). 일반 보안 항목과 게임 항목은 다루지 않는다.
* [요청 서명 정규화 계약 (크로스 런타임)](/security/signing-canonicalization.md) - 서명자와 검증자의 서명 입력 바이트를 맞추는 계약 — rawBody와 canonical 재구성의 구분, 정렬·값 표현·키 집합의 양측 동시 변경, UTF-16/UTF-8 정렬 차이.

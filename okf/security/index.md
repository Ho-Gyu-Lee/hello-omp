# 보안

* [보안 개요](/security/overview.md) - 요청 범위와 무관한 즉시 경고, 취약점 설명·민감정보·Git 원격 자격증명 처리, 외부 자료의 신뢰 경계, 외부 코드 실행·승인·guard 우회 금지, OMP 승인과 실행 격리의 구분. 보안 문제를 발견했거나 민감정보·외부 코드·승인 경계를 다룰 때 읽는다.
* [게임 클라/서버 보안](/security/game.md) - 서버 권위·AI 판정의 신뢰 경계, 보안과 반응성의 균형, 대상 인가, 세션 재개·TLS 0-RTT·UDP 사전 할당, 정보 가시성, Lua bytecode와 출하 테스트 훅.
* [보안 검토 체크리스트 (환경·도구 특이 계약)](/security/review-checklist.md) - 놓치기 쉬운 환경·도구 특이 보안 계약(프록시·게이트웨이 헤더와 출발지 IP 판정, 로드밸런서·보안 그룹·NACL·네트워크 정책, IAM 정책 평가, 비밀 노출, Git·Windows 실행 탐색)으로, 인증·차단·네트워크·IAM 설정이나 그 코드를 고치거나 검토할 때 읽으며 일반 보안 항목과 게임 항목은 다루지 않는다.
* [클라우드 침해 조사의 로그 공백·신원 판별·노출 범위 (AWS·GCP)](/security/cloud-incident-forensics.md) - AWS·GCP 침해 조사에서 로그로 "기록 없음"·"탈취 사용"·노출 범위를 판정하기 전에 확인할 비자명 계약(CloudTrail·접근 로그·VPC 흐름 로그·KMS·EKS·Lambda·IAM·Terraform state, GCP 감사 로그의 기록 범위와 공백)을 다룬다.
* [요청 서명 정규화 계약 (크로스 런타임)](/security/signing-canonicalization.md) - 서명자와 검증자의 서명 입력 바이트를 맞추는 계약 — rawBody와 canonical 재구성의 구분, 정렬·값 표현·키 집합의 양측 동시 변경, UTF-16/UTF-8 정렬 차이.

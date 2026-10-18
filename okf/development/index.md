# 공통 개발

앱·웹·서비스와 게임에서 재사용하는 비자명 계약과 근본 원리다. 일반 지식은 담지 않는다. 게임/Godot/Unity 예시는 해당 기능·API·버전의 조건부 사례다. 관계형 저장은 [데이터베이스 목차](/database/index.md), 게임 고유 권위·Godot 구현은 [게임 목차](/game/index.md).

## 실행·진단·서버 운영
* [병렬 작업과 스크립트 실행 경계](/development/execution.md) - 멀티스레드 방향 링크, 내장 Lua count hook·선점 한계.
* [런타임 진단·측정 범위·출하 진단](/development/runtime-diagnostics.md) - 측정이 증명하는 범위, 정적 라이브러리의 할당/해제 도메인, Fluent Bit·Docker pause·Windows 덤프 API 조건.
* [서버 프로토콜·메모리·큐 운영 기준](/development/server-checklist.md) - 비동기 완료의 상태 소유자 적용, 공유 상수·codec 경계, 큐 처리율 상한, Mirror·Asio·OpenSSL 버전별 함정.
* [서비스 영속성·생존 감시·프로세스와 소유권 수명](/development/service-lifecycle.md) - 내구 확인·grpc-go 종료, identity 결속 이전, 생존 감시, pidfd·컨테이너·Windows 감독, 소유권 fencing.

## 데이터·네트워크
* [데이터 형식·콘텐츠 게시 계약](/development/data-formats.md) - 외부 decoder 길이 검증, 부분 생성 보호 전환, CloudFront minimum TTL.
* [난수·재현 계약](/development/randomness.md) - 같은 seed의 라이브러리 간 차이, 시험 주입 상태의 격리.
* [네트워크 전달·I/O·시간 계측](/development/network.md) - 송신 공정성·reliable 폐기·gRPC 재접속·Apple 연결 제약, IOCP 실패 완료·소켓 종료, WSL 중계 지연·RTT 표본화.

## UI·표현·탐색·자산
* [UI 입력·표시 검증과 지역화](/development/ui-input.md) - 실제 창 입력 검사의 포커스 충돌, 입력 소유·정리 범위, 최종 화면 검증, 기계 번역의 원문 언어.
* [수치 결정성과 충돌 판정 계약](/development/numerics-spatial.md) - 비트 일치 계산의 libm·FMA·툴체인 조건, Box2D 센서 CCD, 경계 위 값 생성 금지.
* [렌더링·애니메이션 표현 계약](/development/rendering-animation.md) - D3D12 장치 제거 fence, 필터·표시 프로필·클립 갱신·측정 원리.
* [상태 기계·탐색의 수명과 작업 예산](/development/ai-navigation.md) - 실행 세대, 재계획과 진행, 탐색 실패와 불가능성, 부분 경로.
* [에셋의 AI 사용 권리와 검수·조립 원리](/development/assets-editor.md) - Unity Asset Store AI/ML 제한, 검수·조립·화풍 대조 원리.
* [AI 에셋 생성의 모델 라이선스·로컬 메모리·VLM 런타임](/development/ai-asset-generation.md) - 가중치 라이선스 예외, Apple Silicon 메모리, seed 재현성, 8방향 스프라이트, Ollama(MLX) 설정·결함.

## 플랫폼 배포
* [Android 라이브러리 의존성과 최종 패키지 검증](/development/android-dependencies.md) - 로컬 AAR 메타데이터, 최종 APK DEX 정의 확인.

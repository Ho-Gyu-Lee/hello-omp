# 공통 개발

앱·웹·서비스와 게임에서 재사용하는 비자명 계약과 근본 원리다. 일반 지식은 담지 않는다. 게임/Godot/Unity 예시는 해당 기능·API·버전의 조건부 사례다. 관계형 저장은 [데이터베이스 목차](/database/index.md), 게임 고유 권위·Godot 구현은 [게임 목차](/game/index.md).

## 실행·진단·서버 운영
* [내장 Lua 스크립트의 실행 경계](/development/execution.md) - 내장 Lua 스크립트의 count hook·선점 한계를 다룹니다.
* [런타임 진단·측정 범위·출하 진단](/development/runtime-diagnostics.md) - 측정·검증이 증명하는 범위, 교체 allocator 앱에 결합하는 정적 라이브러리의 할당/해제 도메인, Fluent Bit 라벨/심각도·연결 종료 진단·Docker pause 관측·Windows 덤프 API의 확인된 조건입니다.
* [서버 프로토콜·메모리·큐 운영 기준](/development/server-checklist.md) - 비동기 완료의 상태 소유자 적용, 공유 상수·메시지 ID·codec 경계, 큐 소비 장벽의 처리율 상한, Mirror·Asio·OpenSSL의 버전별 함정을 다룹니다.
* [서비스 영속성·생존 감시·프로세스와 소유권 수명](/development/service-lifecycle.md) - 내구 확인·grpc-go 종료 계약, identity 결속 이전, 생존 감시와 장애 반응, pidfd·flock 잠금 파일·컨테이너·Windows 감독의 확인된 함정, 소유권 fencing의 기준과, 대규모 상태·부하 서비스 운영 설계의 참조 사례(DeepSeek 추론 배포 Q&A)입니다.

## 데이터·네트워크
* [데이터 형식·콘텐츠 게시 계약](/development/data-formats.md) - 외부 decoder의 길이 검증 한계, 부분 생성의 보호 기준 전환, CloudFront minimum TTL의 origin 캐시 지시어 우선 예외를 다룹니다.
* [난수·재현 계약](/development/randomness.md) - 같은 seed가 라이브러리 간 같은 결과를 보장하지 않는 조건과 시험이 주입한 시계·상태를 라이브 경로에 되돌리지 않는 기준입니다.
* [네트워크 전달·I/O·시간 계측](/development/network.md) - 송신 공정성·reliable 폐기·gRPC 재접속·Apple 연결 제약, IOCP 실패 완료·소켓 종료 수명, WSL localhost 중계 지연과 RTT 표본화·캡처 교란을 다룹니다.

## UI·표현·탐색·자산
* [UI 입력·표시 검증과 지역화](/development/ui-input.md) - 실제 창 입력 검사의 OS 포커스 충돌, 입력 소유·정리 범위와 최종 화면 검증 원리, 사용자 생성 텍스트 기계 번역의 원문 언어 지정(Google Cloud Translation Basic)을 다룹니다.
* [수치 결정성과 충돌 판정 계약](/development/numerics-spatial.md) - 서버·클라이언트 비트 일치 계산의 libm·FMA·툴체인 조건과 golden test, Box2D 센서의 CCD 미지원, 동일성 비교 경로의 표현·decode 통일과 경계 위 값 생성 금지 원리를 다룹니다.
* [렌더링·애니메이션 표현 계약](/development/rendering-animation.md) - D3D12 장치 제거 시 fence 신호, 필터·고정 표시 프로필·이동 클립 갱신에서 실제 데이터와 최종 표시로 판단하는 원리, 반복 클립의 루프 이음 판정을 다룹니다.
* [상태 기계·탐색의 수명과 작업 예산](/development/ai-navigation.md) - 상태 실행 세대, 반복 재계획이 진행을 되감지 않는 조건, 탐색 실패와 불가능성·충돌 요구의 구분, 부분 경로·예산 고갈과 목표 완료의 구분을 다룹니다.
* [에셋의 AI 사용 권리와 검수·조립 원리](/development/assets-editor.md) - Unity Asset Store 에셋의 AI/ML 사용 제한과 취득 채널별 권리 확인, 구매·생성 에셋 검수·조립·화풍 대조에서 최종 결과와 측정 타당성으로 판단하는 원리를 다룹니다.
* [AI 에셋 생성의 모델 라이선스·로컬 메모리·LoRA 학습·VLM 런타임](/development/ai-asset-generation.md) - 유료·로컬 이미지 생성 경로 선택과 GPT Image 2.5 모델 지정 경로, 로컬 이미지 생성·VLM 모델의 가중치 라이선스 예외, Apple Silicon 통합 메모리 조회와 mflux 캐시, seed 재현성, 8방향 스프라이트 구조 고정, mflux LoRA 학습 설정과 투명 스프라이트의 키 배경 학습·복원, Ollama(MLX) 유효 설정과 구조화 출력 결함, VLM 채점의 양성 대조를 정리합니다.

## 플랫폼 배포
* [Android 라이브러리 의존성과 최종 패키지 검증](/development/android-dependencies.md) - 로컬 AAR이 외부 의존성 메타데이터를 대신하지 않는다는 계약과, 클래스 포함 여부를 최종 APK의 DEX 정의로 확인하는 기준입니다.

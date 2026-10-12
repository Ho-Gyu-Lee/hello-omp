# 게임 클라이언트/서버

* [게임 네트워크 동기화](/game/network-sync.md) - 상태 계층과 시간·순서·생명주기 원칙, 검증 기준, 학습 근거의 적용 범위를 정리하고 세부 주제는 하위 개념으로 안내한다.
* [게임 네트워크 시간·이동 검증](/game/network-time-movement.md) - 서버 권위 구조에서 시간의 소유권과 단위를 정하고, 이동 속도·시간 예산 검증과 접촉 트리거 전환 요청을 다루는 규칙이다.
* [게임 네트워크 예측·보간·보정](/game/network-prediction.md) - 클라이언트 예측·보정, 애니메이션 시간, 입력 처리 ACK와 재실행, 원격 보간과 판정 지연 보상의 규칙을 다룬다.
* [게임 네트워크 복구·전달 의미론](/game/network-delivery.md) - 증분 복제의 복구와 전달 의미론, 전송 계층·RPC의 구분, 모바일 경로 전환과 세션 복구의 규칙을 다룬다.
* [게임 클라이언트 기능/성능 체크리스트](/game/client-checklist.md) - 메모리·프레임·렌더링·수명·네트워크 상태·끊김 처리 순서·정상 종료의 명시 로그아웃·수신 큐 상한·메인 스레드 수신 처리율·RTT 계측과 캡처 정지·반응성·플랫폼·Unity Android 의존성 배포와 의존성 관리자(EDM4U 종료 예정·Unity EDM) 검증.
* [게임 서버 기능/성능 체크리스트](/game/server-checklist.md) - Gateway와 단일 로직 스레드의 분리, 상시 운영 메모리 계측, 큐·브로드캐스트·성능 검증과 근거의 적용 한계를 다루는 게임 서버 체크리스트.
* [게임 서버 영속화·장애 체크리스트](/game/server-persistence.md) - 게임 서버에서 결과 공개와 내구 저장 시점을 나누고, 영속 저장·콘텐츠 identity·소유권 이동·서비스 링크 장애의 검증과 복구 기준을 정리한다.
* [Godot + C++ 개발](/game/godot-cpp.md) - Godot·godot-cpp 공식 버전 핀과 GDExtension·엔진 모듈 선택 기준, 검증 범위를 정리하고 세부 주제는 하위 개념으로 안내합니다.
* [Godot C++ 성능 중심 시뮬레이션 코어](/game/godot-simulation.md) - 성능 병목을 C++ 코어로 옮기는 경계와 메모리·로딩(UI 리소스·threaded-load 회수 포함)·물리·네트워크 부하의 설계, 성능 수락 기준을 정리합니다.
* [godot-cpp 빌드·등록·디버깅·export와 실행 검증](/game/godot-build.md) - godot-cpp 확장의 API·ABI 호환성, SCons 빌드와 로드 경로, 클래스 등록·이름 계약, 디버깅·export, 프로젝트 설정·addon 의존성과 smoke 절차를 정리합니다.
* [Godot C++ Scene·물리·Resource 수명과 경계](/game/godot-runtime.md) - Scene 생명주기와 소유권(에디터 복제·부분 생성 보호 포함), 물리·프레임·스레드 경계, Resource 직렬화와 성능·서버 권위 선택의 규칙을 정리합니다.
* [Godot UI 재사용과 입력·텍스트·HUD 표시](/game/godot-ui.md) - 재사용 UI의 계약과 터치·입력 처리, 레이아웃·텍스트·폰트, 창과 HUD 표시 및 입력 검증 규칙을 정리합니다.
* [Godot 2D 시야·카메라와 자동 사냥 대상](/game/godot-2d-view.md) - 2D 시야와 이동감, 아이소메트릭 맵 가장자리 카메라, 화면 안 공격 사거리와 자동 사냥 대상 선택 규칙을 정리합니다.
* [Godot 에셋 팩·타일 조립·렌더 정밀도와 에디터 미리보기](/game/godot-assets-editor.md) - 구매 에셋 팩 검수와 타일 조립·앞뒤 정렬, 생성 건물 다양성, 렌더 데이터 정밀도와 에디터 미리보기 규칙을 정리합니다.

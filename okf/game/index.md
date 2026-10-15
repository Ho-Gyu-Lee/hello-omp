# 게임 클라이언트/서버

게임 고유의 권위·동기화·콘텐츠 적용과 Godot 엔진별 구현/버전 관찰을 분류한다.

앱·웹·서비스와 게임에 재사용하는 실행·데이터·네트워크·UI·표현 기준은 [공통 개발 목차](/development/index.md), 관계형 저장·동시성·캐시는 [데이터베이스 목차](/database/index.md)에서 찾는다. 공통 원리의 게임/Godot 예시를 모든 도메인의 필수 구조로 해석하지 않는다.

## 게임 권위·네트워크·콘텐츠
* [게임 네트워크 동기화](/game/network-sync.md) - 권위·예측·보간/표시 상태, 게임 시간·입력 순서/수명과 동기화 검증을 정리하고 세부 개념을 안내한다.
* [게임 네트워크 시간·이동 검증](/game/network-time-movement.md) - 게임 시간/tick과 서버의 시간 승인, 이동 속도·시간 예산 검증, 접촉 트리거 전환 요청의 권위 경계.
* [게임 네트워크 예측·보간·보정](/game/network-prediction.md) - 클라이언트 예측/보정·입력 처리 ACK/재실행, 애니메이션 시간·원격 보간과 판정 지연 보상.
* [게임 네트워크 복구·전달 의미론](/game/network-delivery.md) - 증분 복제·baseline 복구, 입력/결과 보존·권위 이전·불연속 marker, 지역 전환/READY와 게임 세션 재개.
* [게임 클라이언트 기능/성능 체크리스트](/game/client-checklist.md) - 게임 자원·프레임·수신 큐·동기화/재접속·정상 로그아웃과 공통 검증의 적용, Unity Android 배포·EDM4U/Unity EDM 이행 조건.
* [게임 서버 기능/성능 체크리스트](/game/server-checklist.md) - 게임 상태 수락·권위 이전·가시성·콘텐츠 판정, Gateway/단일 로직 스레드·AOI/방송·복제와 게임 부하 검증.
* [게임 서버 영속화·장애 체크리스트](/game/server-persistence.md) - 콘텐츠별 결과 공개/내구 A/B/C, 경제·위치 저장·존 이전·파티/던전 수명, 저장 대기/복제 view와 실제 게임 통합 시험.
* [게임 정적 데이터의 분류·소비와 권위 경계](/game/static-data.md) - 콘텐츠 정의/설정과 플레이 상태의 구분, client/server 공개 대상·서버 비밀, 최초 플레이/판정 의존집합과 세션·존별 버전 적용.
* [게임 기록·재생·락스텝의 권위와 진단](/game/random-replay.md) - 공통 난수/재현 계약의 게임 적용, 락스텝·desync·비공개 정보와 출하 테스트 훅/봇 검증의 경계.

## Godot 엔진별 적용
* [Godot와 C++ 게임 개발](/game/godot-cpp.md) - Godot/godot-cpp 공식 버전 핀, GDExtension/엔진 모듈 선택과 검증 범위를 정리하고 하위 개념을 안내한다.
* [Godot C++ 성능 중심 시뮬레이션 코어](/game/godot-simulation.md) - C++ 코어/Godot 연결부·로컬 인게임/서버 이관, 관찰/AOI와 월드/UI 리소스 로딩, 물리·전투·4X/MMORPG 부하와 Web export 제약.
* [godot-cpp 빌드·등록·디버깅·export와 실행 검증](/game/godot-build.md) - API/ABI 호환성·SCons/로드 경로·클래스/시그널/이름 등록, 디버깅/export·프로젝트 설정/addon 의존성과 smoke 전제.
* [Godot C++ Scene·물리·Resource 수명과 경계](/game/godot-runtime.md) - Scene/Node 소유권·에디터 복제/부분 생성, 물리/프레임/스레드·Resource 직렬화/저장/공유와 Godot 성능·서버 권위 경계.
* [Godot UI 재사용과 입력·텍스트·HUD 표시](/game/godot-ui.md) - 게임 UI 어댑터와 Godot의 모달/pick·터치/합성 mouse·포커스, Control/폰트·C++ 문자열과 실제 창/HUD의 API/버전별 적용.
* [Godot 2D 시야·카메라와 자동 사냥 대상](/game/godot-2d-view.md) - 2D 게임 비교 근거의 적용 한계, 화면 안 월드 공격 사거리·실제 교전과 자동 사냥 대상 선택.
* [Godot 에셋 팩·타일 조립·렌더 정밀도와 에디터 미리보기](/game/godot-assets-editor.md) - Godot 타일 조립·충돌/예측/권위 판정·앞뒤 정렬, TileMapLayer·GPU 데이터 텍스처와 비저장 에디터/F5 미리보기.

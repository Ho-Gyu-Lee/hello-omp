# 게임 클라이언트/서버

게임 고유의 권위·동기화·서버 운영과 Godot/godot-cpp의 버전 특정 계약이다. 서버 구조에 대한 사용자 관점(멀티스레드·MMORPG·MSA·단일 로직 스레드)은 [사용자 개발 방향](/direction.md), 공통 실행·네트워크·데이터 기준은 [공통 개발 목차](/development/index.md)에 있다.

## 게임 권위·네트워크·서버
* [게임 네트워크 동기화](/game/network-sync.md) - 게임 동기화 세부 문서의 안내와 공통 원리(상태 계층·완료 경계·세대·권위 의미·시험), Mirror 인용 기준.
* [게임 네트워크 시간·이동 검증](/game/network-time-movement.md) - 서버 승인 시간·논리 tick과 클라이언트 추정의 경계, 이동 시간 예산 검증, 접촉 트리거 전환 요청의 상태 전이와 확정 경계.
* [게임 네트워크 예측·보간·보정](/game/network-prediction.md) - 불연속 전환과 보정 수렴, 표시 시간축, 입력 처리 ACK·checkpoint, 원격 보간의 시간 도메인과 데이터 신선도 규칙.
* [게임 네트워크 복구·전달 의미론](/game/network-delivery.md) - 게임 증분 복제·baseline의 Mirror 계약, 불연속 marker, 재접속·지역 전환·끊김 판정의 완료 증거와 세대 결속.
* [게임 클라이언트 기능/성능 체크리스트](/game/client-checklist.md) - 게임 클라이언트의 정상 종료 로그아웃, 수신 처리율과 Unity Android 의존성 관리자(EDM4U→Unity EDM)의 버전 특정 계약.
* [게임 서버 기능/성능 체크리스트](/game/server-checklist.md) - 게임 서버의 Gateway/로직 소유 단위 분리(선택한 구조의 설계 기준), 용량·AOI·복제 측정 기준. 공통 서버 운영·영속화·보안은 별도 정본에 연결한다.
* [게임 서버 영속화·장애 체크리스트](/game/server-persistence.md) - 결과 공개와 내구성의 A/B/C 선언, 위치 저장, 파티·인스턴스 수명, 저장 대기와 복제 view의 적용 기준.

## Godot 엔진
* [Godot와 C++ 게임 개발](/game/godot-cpp.md) - Godot·godot-cpp 버전 핀과 출처 간 차이, 임의 업그레이드 금지, 4.5~4.7 동작 변경의 확인 경로, 하위 개념(시뮬레이션 코어·빌드·수명·UI·에셋) 안내입니다.
* [Godot C++ 성능 중심 시뮬레이션 코어](/game/godot-simulation.md) - C++ 코어와 Godot 연결부의 경계, 서버 이관 범위, 4.7.2 threaded load·ResourceLoader 캐시·atlas 재import·Jolt·Web export의 버전 특정 계약입니다.
* [godot-cpp 빌드·등록·디버깅·export와 실행 검증](/game/godot-build.md) - godot-cpp v10 핀의 빌드 옵션·manifest 매칭·hot reload, 시그널 반환값과 동기 콜백 재진입, macOS export, 프로젝트 설정·vendor 바이트, headless 검증 차이와 Windows 콘솔 래퍼 실행의 자원 측정 대상을 정리합니다.
* [Godot C++ Scene·물리·Resource 수명과 경계](/game/godot-runtime.md) - Godot 객체 소유권, 스레드 경계, 에디터 복제 flags·Resource 깊은 복제 범위·트리 밖 좌표 캐시·text Resource 숫자 정밀도·직렬화 크기의 버전 특정 계약입니다.
* [Godot UI 입력·텍스트·HUD 표시](/game/godot-ui.md) - Godot 4.7.2 입력 전달 순서·장치 ID·Windows 휠 이벤트·한글 폰트·첫 import 오류·캡처 크기 불일치·focus 모양, godot-cpp v10 문자열 인코딩, 실제 렌더 경계 검증 원칙입니다.
* [Godot 에셋 팩·렌더 정밀도와 에디터 미리보기](/game/godot-assets-editor.md) - 표시·충돌·정렬 계약의 분리, 4.7.2 TileMapLayer 원점·정렬 Y, Compatibility 데이터 텍스처 정밀도, 렌더 직전 콜백 스레드, 비저장 미리보기 규칙입니다.

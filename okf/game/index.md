# 게임 클라이언트/서버

게임 고유의 권위·동기화·서버 운영과 Godot/godot-cpp의 버전 특정 계약이다. 서버 구조에 대한 사용자 관점(멀티스레드·MMORPG·MSA·단일 로직 스레드)은 [사용자 개발 방향](/direction.md), 공통 실행·네트워크·데이터 기준은 [공통 개발 목차](/development/index.md)에 있다.

## 게임 권위·네트워크·서버
* [게임 네트워크 동기화](/game/network-sync.md) - 세부 문서 안내와 공통 원리(완료 경계·세대·권위 의미·시험), Mirror 인용 기준.
* [게임 네트워크 시간·이동 검증](/game/network-time-movement.md) - 서버 승인 시간과 tick, 이동 시간 예산, 접촉 트리거 전환의 확정 경계.
* [게임 네트워크 예측·보간·보정](/game/network-prediction.md) - 불연속 전환과 보정 수렴, 표시 시간축, ACK·checkpoint, 원격 보간의 데이터 신선도.
* [게임 네트워크 복구·전달 의미론](/game/network-delivery.md) - Mirror 증분 복제·baseline 계약, 불연속 marker, 재접속·지역 전환의 완료 증거.
* [게임 클라이언트 체크리스트](/game/client-checklist.md) - 정상 종료 로그아웃, 수신 처리율, Unity Android EDM4U→Unity EDM 계약.
* [게임 서버 체크리스트](/game/server-checklist.md) - Gateway와 로직 스레드의 소유 단위 분리, 용량·AOI·복제 측정.
* [게임 서버 영속화·장애 체크리스트](/game/server-persistence.md) - 결과 공개와 내구성의 A/B/C 선언, 위치 저장, 파티·인스턴스 수명.

## Godot 엔진
* [Godot와 C++ 게임 개발](/game/godot-cpp.md) - 버전 핀과 출처 간 차이, 임의 업그레이드 금지, 하위 개념 안내.
* [Godot C++ 성능 중심 시뮬레이션 코어](/game/godot-simulation.md) - C++ 코어와 연결부 경계, 서버 이관 범위, threaded load·캐시·atlas·Jolt·Web export 계약.
* [godot-cpp 빌드·등록·디버깅·export와 실행 검증](/game/godot-build.md) - v10 빌드 옵션·manifest·hot reload, 시그널 반환값·재진입, macOS export, headless 차이.
* [Godot C++ Scene·물리·Resource 수명과 경계](/game/godot-runtime.md) - 객체 소유권, 스레드 경계, 복제 flags·좌표 캐시·직렬화 정밀도.
* [Godot UI 입력·텍스트·HUD 표시](/game/godot-ui.md) - 4.7.2 입력 전달 순서·휠·한글 폰트·첫 import 오류·focus, godot-cpp 문자열 인코딩.
* [Godot 에셋 팩·렌더 정밀도와 에디터 미리보기](/game/godot-assets-editor.md) - 표시·충돌·정렬 계약 분리, TileMapLayer 원점, 데이터 텍스처 정밀도, 비저장 미리보기.

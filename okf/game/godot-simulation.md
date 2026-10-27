---
type: Concept
title: Godot C++ 성능 중심 시뮬레이션 코어
description: C++ 코어와 Godot 연결부의 경계, 서버 이관 범위, 4.7.2 threaded load·ResourceLoader 캐시·atlas 재import·Jolt·Web export의 버전 특정 계약입니다.
tags: [game, godot, cpp, simulation, resource-loading, jolt, web-export]
timestamp: 2026-10-18T00:00:00Z
---

# Godot C++ 성능 중심 시뮬레이션 코어

상위 개념: [Godot와 C++ 게임 개발](/game/godot-cpp.md)(버전 핀 포함). 방향과 병렬화 정본은 [개발 방향](/direction.md), 측정은 [런타임 진단](/development/runtime-diagnostics.md), 난수·재현은 [난수·재현 계약](/development/randomness.md)을 따릅니다.

## 코어와 Godot 연결부

반복 계산(전투·타깃 선정·AI/경로·경제·월드 갱신)은 필요한 범위에서 엔진 비의존 C++ 데이터·함수로 두고 Node/Resource는 에디터·표시·입출력 연결부로 씁니다. entity마다 Node·가상 호출·signal·heap 객체를 만드는 모델을 강제하지 않고 작은 시스템까지 ECS·별도 프레임워크로 다시 만들지도 않으며, 코어를 스크립트로 먼저 만든 뒤 이식하거나 UI·에디터·콘텐츠 연결까지 일률적으로 C++로 옮기지도 않습니다. C++ 채택 자체는 성능 증거가 아니므로 같은 부하에서 측정하고, SceneTree 접근은 [물리·프레임·스레드 경계](/game/godot-runtime.md#물리프레임스레드-경계)를 따릅니다.

## 서버 이관

로컬에서 먼저 실행하고 독립 서버로 이관할 때의 기준이며 특정 프로젝트의 개발 순서를 모든 게임에 강제하지 않습니다.

- 콘텐츠 규칙·상태·충돌·탐색·맵 정의는 엔진 비의존 코어에 두고 로컬 실행 호스트가 단일 소유자로 진행합니다. Godot physics/navigation 호출을 감싼 것만으로는 이식되지 않습니다. Godot 입력은 게임 의도로 변환하고 월드/HUD는 관찰 결과만 소비하며, 고정 스텝·난수 상태·콘텐츠 정의를 코어에 명시적으로 주고 OS 시계·Node 수명·렌더 delta에 판정을 묶지 않습니다.
- **이관 대비는 두 번째 호스트의 구현 승인이 아닙니다.** 사용자가 서버 개발을 정하기 전에는 빈 서버 인터페이스·가짜 RPC·DB·별도 서버 프로세스·소켓 전송·wire codec·접속 제한·서버 bench를 만들지 않고, 프로세스 안의 논리 메시지 경계와 지연·지터 모의로 계약을 검증합니다. 범위 밖으로 만들어졌다면 shim 없이 제거하고 프로젝트 규칙 문서에 금지 범위를 남깁니다.
- 온라인 전환은 로컬 권위 월드를 서버로 옮기는 것이며 두 월드를 동시에 정본으로 두지 않고, 오프라인 결과·저장을 온라인 경제 상태로 신뢰하거나 연결 실패 시 로컬 권위로 fallback하지 않습니다. 권위·복구·AOI는 [네트워크 동기화](/game/network-sync.md), [서버 체크리스트](/game/server-checklist.md), [게임 보안](/security/game.md)이 정본입니다.
- [`SceneMultiplayer`](https://docs.godotengine.org/en/4.7/classes/class_scenemultiplayer.html)의 고수준 프로토콜은 비-Godot 서버용 안정 프로토콜이 아니므로 독립 C++ 서버에는 명시적 wire schema를 둡니다.

## 리소스 로딩·캐시와 atlas

캐시·선행 로딩은 허용한 상주 메모리 예산 안에서만 선택하고 사전 로딩한 probe를 cold load로 보고하지 않습니다. 아래는 4.7.2 기준이며 소스는 엔진 [`ed1daf0b`](https://github.com/godotengine/godot/tree/ed1daf0bf001b61586d9930840f2f1394092c079)의 `core/io/resource_loader.cpp`(L 표기)와 `main/main.cpp`입니다.

- **threaded load token:** `load_threaded_request()`에는 취소 API가 없고([ResourceLoader.xml](https://github.com/godotengine/godot/blob/4.7.2-stable/doc/classes/ResourceLoader.xml)) 요청 token은 `load_threaded_get()`을 호출할 때까지 결과 리소스를 보유합니다. 표시 참조만 비우거나 씬이 먼저 사라지면 token이 남아 메모리 계약이 깨지므로, 씬보다 오래 사는 단일 소유자가 LOADED/FAILED 뒤 정확히 한 번 get·폐기하고 결과는 요청 세대·대상·identity가 맞을 때만 표시합니다. `load_threaded_get()`은 미완료 요청에서 블로킹될 수 있습니다.
- **종료와 leak (소스 확인·재현 관찰):** 종료 순서는 main loop 종료 → GDExtension main-loop shutdown callback → `clear_thread_load_tasks()` → SCENE terminator이며(`main.cpp` L5234-L5295), clear와 엔진 작업 스레드는 회수하지 않은 token·자기 참조를 `unreference()`만 하고 삭제하지 않습니다(L1625-L1635, L672-L675). 따라서 terminator에서 LOADED/FAILED를 기다리면 끝나지 않고, 기다리지 않거나 요청자가 먼저 참조를 놓으면 `Leaked instance: RefCounted`가 남습니다. `WorkerThreadPool` 작업 안의 `ResourceLoader::load`는 별도 작업으로 떠(L730-L737) 이 race가 사실상 매번 일어났고, 모듈이 소유한 일반 `Thread`에서 부르면 inline 로드(`LOAD_THREAD_FROM_CURRENT`)되어 leak이 없었습니다. 메인 스레드는 `is_alive()`가 false일 때만 `wait_to_finish()`로 합류하고 종료 때는 godot-cpp `InitObject::register_shutdown_callback`(4.5+) callback에서 합류합니다.
- **`ResourceLoader::exists()`:** 경로가 `ResourceCache`에 있으면 디스크를 확인하지 않고 true를 반환하므로(L1247-L1252) 기본 `CACHE_MODE_REUSE` 리소스는 파일 누락을 숨깁니다. `CACHE_MODE_IGNORE`는 외부 의존성을 REUSE로 두므로 의존성까지는 `IGNORE_DEEP`이 필요하고, 다른 소유자가 보관한 캐시 항목은 사라지지 않습니다. 다시 읽을 수 있음이 계약이면 IGNORE 재로드로 확인하고 export의 `.import`·`.remap`·PCK 경로를 `FileAccess` 원본 경로 검사로 대체하지 않습니다.
- **atlas 재import (관찰):** `.import`의 아틀라스 그룹 구성을 외부에서 바꾼 뒤 `--headless --import`만 실행하면 페이지 PNG는 다시 만들어져도 구성원의 `AtlasTexture` 영역 좌표가 남을 수 있습니다. 구성원 전체를 에디터의 `EditorFileSystem.reimport_files`로 다시 가져오고 원본과 아틀라스 영역의 픽셀 일치로 검증하며, 크기 일치로는 stale 좌표를 잡지 못합니다.

## 물리와 Jolt

- 4.7 문서는 Jolt의 별도 physics thread를 **experimental**로 설명하므로 활성화 전에 대상 프로젝트에서 검증합니다. [Jolt 문서](https://docs.godotengine.org/en/4.7/tutorials/physics/using_jolt_physics.html)
- Godot 릴리스 정책은 물리 엔진의 결정성을 보장하지 않으므로([정책](https://docs.godotengine.org/en/4.7/about/release_policy.html#what-are-the-criteria-for-compatibility-across-engine-versions)) upstream Jolt의 조건부 deterministic 설명을 Godot 통합에 옮기지 않으며, lockstep·rollback은 대상 빌드·플랫폼에서 재현을 검증합니다.

## Web export 제약

4.7 문서 기준(확인 2026-10-15): [Exporting for the Web](https://docs.godotengine.org/en/4.7/tutorials/export/exporting_for_web.html).

- 저수준 네트워킹이 없고 HTTP·WebSocket 클라이언트·WebRTC만 쓸 수 있어 UDP를 가정하지 않으며, 비신뢰·비순서 전달은 WebRTC data channel을 검토합니다. WebSocket은 순서 보장 stream이라 head-of-line 지연이 생길 수 있고, 상태 대체(snapshot 병합) 때의 불연속 marker 승계는 [복구·전달 의미론](/game/network-delivery.md)을 따릅니다. 탭이 비활성화되면 `_process`·`_physics_process`가 멈춰 장시간이면 연결이 끊길 수 있으므로 복귀는 재개·full-state로 복구합니다.
- [`WebSocketPeer.connect_to_url`](https://docs.godotengine.org/en/4.7/classes/class_websocketpeer.html#class-websocketpeer-method-connect-to-url): mixed content를 피하려면 `wss://`와 서버 TLS 인증서에 맞는 FQDN을 쓰고 IP로 직접 접속하지 않습니다(브라우저가 신뢰하는 인증서 필요). `handshake_headers`는 Web export에서 지원되지 않으므로 인증 값을 그 헤더로 전달하지 않습니다.
- 단일 스레드 export는 4.3부터 지원되며 4.7 문서가 선호·기본으로 설명하지만 스레드를 쓸 수 없습니다. **Thread Support** export는 HTTPS와 `Cross-Origin-Opener-Policy: same-origin`·`Cross-Origin-Embedder-Policy: require-corp` 헤더(못 붙이면 PWA service worker 우회)가 없으면 실행되지 않고, GDExtension은 **Extensions Support**와 Web용 별도 컴파일이 필요하며 같은 isolation 헤더가 필요합니다. [Thread and extension support](https://docs.godotengine.org/en/4.7/tutorials/export/exporting_for_web.html#thread-and-extension-support)

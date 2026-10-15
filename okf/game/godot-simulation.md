---
type: Concept
title: Godot C++ 성능 중심 시뮬레이션 코어
description: 성능 병목을 C++ 코어로 옮기는 경계와 메모리·로딩(UI 리소스·threaded-load 회수 포함)·물리·네트워크 부하(Web export 전송·스레드·확장 제약 포함)의 설계, 로컬 인게임과 서버 이관 기준, 성능 수락 기준을 정리합니다.
tags: [game, godot, cpp, simulation, physics, combat, networking, performance, memory, mmorpg]
timestamp: 2026-10-15T00:00:00Z
---

# Godot C++ 성능 중심 시뮬레이션 코어

상위 개념: [Godot와 C++ 게임 개발](/game/godot-cpp.md) · 버전 핀과 [검증 범위](/game/godot-cpp.md#검증-범위와-공개-근거)를 함께 따릅니다.

## 성능 중심 시뮬레이션 코어

### C++가 바꾸는 비용과 바꾸지 않는 비용

**사실:** Jolt는 C++로 구현된 물리 라이브러리이며 Godot에 내장된 3D backend로 제공됩니다. Godot 4.7 문서는 새 프로젝트가 Jolt를 기본 사용한다고 설명하지만 기존 프로젝트의 실제 `physics/3d/physics_engine` 값을 확인해야 합니다. 이 안내는 2D 물리 backend 선택에 적용되지 않습니다. [Jolt 공식 소스](https://github.com/jrouwe/JoltPhysics), [Godot 4.7 Jolt 통합](https://docs.godotengine.org/en/4.7/tutorials/physics/using_jolt_physics.html)

**선택:** 성능이 주목적인 새 게임에서는 계산 집약적 코어를 처음부터 C++로 설계할 수 있습니다. 반드시 모든 기능을 스크립트로 만든 뒤 이식해야 한다는 규칙은 없습니다. 다만 C++ 채택과 실제 성능 향상은 별개이며 동일 부하에서 측정합니다. UI·에디터·콘텐츠 연결까지 일률적으로 C++로 옮기지 않습니다.

| 관측한 비용 | 우선 검토할 변경 | 해결된다고 가정하면 안 되는 것 |
|---|---|---|
| 스크립트의 전투·AI·경제·탐색 계산 | C++ 데이터/알고리즘, 연속 메모리 순회, 불필요한 할당·복사 제거 | 네이티브 물리 solver·GPU·회선 비용 |
| 다수 Node의 개별 콜백·Variant/문자열 변환·엔진 경계 호출 | 한 번의 호출로 entity 집합 처리, 필요한 데이터만 경계 변환, 필요 시 서버 API | 같은 호출을 C++ 문법으로 바꾸는 것만으로 배치 효과 발생 |
| 충돌 후보·접촉·constraint·physics query | shape/레이어/활성 객체·쿼리 빈도·backend/solver 설정 검토 | C++에서 `PhysicsServer3D`를 호출하면 solver 자체가 빨라진다는 주장 |
| 네트워크 fan-out·직렬화·큐 적체 | 관심 영역(AOI), delta/snapshot·전송 빈도·버퍼·메시지 크기·전달 의미론 설계 | C++나 UDP만으로 대역폭·지연·동접 문제가 해결된다는 주장 |
| 렌더링 draw/인스턴스 비용 | 렌더링 profiler와 batching/인스턴싱 경로 | 코어의 C++ 이식만으로 GPU 병목 해소 |

공식 성능 지침은 설계 단계의 알고리즘·데이터 배치와 profiler 기반 검증을 함께 요구합니다. 미세 최적화보다 처리량 자체·메모리 접근·경계 호출을 먼저 검토합니다. 근거: [General optimization tips](https://docs.godotengine.org/en/4.7/tutorials/performance/general_optimization.html).

### 코어와 Godot 연결부의 경계

- **권장 기본:** 전투 수치·효과·쿨다운·타깃 선정·AI/경로 탐색·4X 월드/경제 갱신 등 반복 계산은 필요한 범위에서 순수 C++ 데이터와 함수로 묶고, Godot Node/Resource는 에디터·표시·입출력 연결부로 사용합니다. 매 entity마다 Node·가상 호출·signal·heap 객체를 만드는 모델을 강제하지 않습니다. 반대로 작은 시스템까지 ECS·별도 프레임워크로 다시 만들지 않습니다.
- hot data를 함께 순회하고 읽기 전용 설정과 가변 시뮬레이션 상태를 분리합니다. AoS/SoA·풀·SIMD는 접근 패턴과 측정 결과로 선택합니다. 재사용 entity ID에는 generation 등 수명 검증을 두고 삭제·재배치로 포인터/참조가 무효화되는 경계를 정합니다.
- 물리·전투·AI·경제·복제·시각 갱신의 주기를 동일하게 강제하지 않습니다. 바꿀 때는 게임 의미·권위 상태·입력 적용 순서를 보존합니다. 고정 tick은 과부하를 해결하지 않으므로 입력/작업 큐 상한과 초과 시 거부·병합·복구 정책을 정의합니다. 재화·전투 명령을 성능 때문에 조용히 버리지 않습니다.
- 병렬화는 읽기 snapshot, 작업별 쓰기 소유권, 합류/커밋 경계를 먼저 정합니다. 독립 계산 결과를 검증해 권위 상태에 적용하고 SceneTree는 [물리·프레임·스레드 경계](/game/godot-runtime.md#물리프레임스레드-경계)의 계약을 지킵니다. lock-free·작업 분할·샤딩은 측정된 경합과 불변조건이 정당화할 때만 도입합니다.

### 메모리 예산·수명 분리와 할당 검증

- **설계 기준:** 중앙 메모리 정책·전체 예산·계측과 하나의 전역 가변 크기 풀을 구분합니다. 행동별로 할당/반납 규칙을 복제하지 않고 시스템이 소유하는 공통 저장소를 사용합니다. 공통 계층은 타입·크기 등급·수명별 저장소를 허용하며 singleton·단일 전역 락이나 엔진 allocator 교체를 의미하지 않습니다.
- 고정 용량으로 충분한 코어는 배열·값 소유를 유지합니다. 동적 객체가 필요한 기능에서 타입별 풀, 틱/작업 임시 arena, 월드 수명 저장소, I/O 버퍼의 실제 소비자와 고갈 정책을 함께 구현합니다. 빈 범용 allocator 프레임워크를 선행 생성하거나 무할당 배열을 힙 기반 풀로 바꾸지 않습니다.
- 예약 용량·실사용·최대 점유·실패를 구분하고 저장소 전체의 예약 합·전환 중 구/신 데이터·로딩 임시 공간을 예산에 포함합니다. 무제한 성장·일반 힙 fallback으로 고갈을 숨기지 않습니다. 풀의 여유 슬롯·크기 등급 낭비와 스택 배열의 피크도 메모리 비용이며 힙 무할당이 메모리 비용 0을 뜻하지 않습니다.
- 반복 객체는 반납 뒤 핸들 generation을 검증하고, arena는 모든 소비자가 끝난 경계에서만 재사용합니다. 비동기 작업이나 I/O가 소유한 버퍼를 틱 종료·취소 요청만으로 회수하지 않습니다. 소유 스레드·정렬·상한·수명·고갈 결과를 공통 계약에 둡니다.
- 로딩 화면을 줄이는 목표와 런타임 작업 예산을 함께 설계합니다. 비동기 I/O·압축 해제 완료와 메인 스레드의 인스턴스화·GPU 업로드·해제를 분리하고 상주량·진행 중 요청·프레임별 반영/해제에 상한을 둡니다. 선행 로딩·유지(캐시) 범위의 상한과 재사용 조건은 「관찰 수명·월드 로딩·모바일 표현 예산」의 장면 재사용 항목을 따릅니다.
- 할당 검증은 작성자·에이전트의 기억을 대체하는 실행 경계입니다. 생성/제거·정상/거부·고갈·취소·재사용을 섞어 검사하고 의도적 할당을 검출하는 양성 대조군으로 관측기를 검증합니다. [MSVC `_CrtSetAllocHook`](https://learn.microsoft.com/en-us/cpp/c-runtime-library/reference/crtsetallochook?view=msvc-170)은 debug CRT의 할당/재할당/해제를 관측하므로 실행한 CRT 경로만 보장하며 OS 직접 할당·다른 allocator·엔진/GPU·미실행 경로까지 확대하지 않습니다. 계측 빌드를 release 지연 성능의 근거로 사용하지 않습니다.
- 혼합 부하의 frame/tick 꼬리 지연과 메모리 점유 추세·예약/실사용·할당 크기 분포를 함께 확인합니다. RSS 안정·누수 부재·풀 사용만으로 단편화나 히치가 없다고 결론 내리지 않으며 클라이언트와 서버의 실제 플랫폼·부하를 각각 검증합니다.


### 로컬 인게임과 서버 이관

다음은 클라이언트 내부에서 게임을 먼저 실행하고 독립 서버로 이관할 때의 설계 기준입니다. 특정 프로젝트의 개발 순서를 모든 게임에 강제하거나 서버 기능이 이미 구현됐다고 주장하지 않습니다.

- 콘텐츠 규칙과 상태는 엔진 비의존 코어에 두고 로컬 실행 호스트가 단일 소유자로 진행합니다. Godot 입력은 게임 의도로 변환하고 월드/HUD는 관찰 결과를 소비합니다. 명령 접수 성공과 게임 규칙의 수락 결과를 구분해 로컬 호출도 동기 UI 부수효과에 의존하지 않게 합니다.
- 이관 경계는 실행 호스트·명령 전달·관찰 결과입니다. 코어가 필요로 하는 고정 스텝·난수 상태·콘텐츠 정의를 명시적으로 제공하고 운영체제 시계·Node 수명·렌더 delta에 게임 판정을 묶지 않습니다. 실제 두 번째 호스트가 필요하기 전에 빈 서버 인터페이스·가짜 RPC·DB를 선행 생성하지 않습니다.
- 이관 대비 동기화 계약(예측·보정·재접속·결과 보존)을 로컬 호스트에서 검증하라는 요구는 두 번째 호스트의 구현 승인이 아닙니다. 사용자가 서버 개발을 명시적으로 결정하기 전에는 별도 서버 프로세스·소켓 전송·wire codec/stream framing·접속 제한·서버 bench 도구를 만들지 않고, 프로세스 안의 논리 메시지 경계와 지연·지터 모의로 계약을 검증합니다. 이미 사용자 요청 범위 밖으로 만들어졌다면 호환 shim 없이 제거하고 프로젝트의 규칙 문서에 금지 범위를 남겨 다른 작업자가 재도입하지 않게 합니다.
- 충돌·탐색·좌표·맵 정의도 이식 범위입니다. Godot physics/navigation 호출을 인터페이스로 감싼 것만으로 독립 서버 이식이 끝나지 않습니다. 필요한 엔진 비의존 판정과 공통 데이터를 사용하거나 동등한 backend의 서버 실행 비용을 명시합니다. 아이소메트릭 화면 좌표·카메라 transform과 게임의 월드 좌표를 구분합니다.
- 로컬 결과는 관찰 가능한 필드와 명령 결과를 전달하고 내부 월드의 mutable 포인터를 노출하지 않습니다. 버퍼 수명·재진입·리셋 세대를 정하며 UI 카운트다운·애니메이션 이벤트를 게임 쿨다운·명중·보상 판정의 정본으로 사용하지 않습니다.
- 온라인 전환은 전체 로컬 권위 월드 실행을 서버로 옮기는 것이지 두 월드를 동시에 정본으로 유지하는 것이 아닙니다. 클라이언트에 남길 예측 계산과 서버 전용 규칙·비공개 콘텐츠/난수 데이터를 구분합니다. 오프라인 결과·저장을 온라인 경제 상태로 신뢰하거나 연결 실패에 로컬 권위로 fallback하지 않습니다.
- 이식성은 Godot 없는 코어 빌드/행동 검사, 같은 입력 시나리오의 로컬 호스트 결과, 실제 창의 입력/표시로 각각 검증합니다. 공통 소스·고정 스텝만으로 플랫폼 간 비트 결정성·네트워크 내구성·인증이 보장되지는 않습니다.

### 관찰 수명·월드 로딩·모바일 표현 예산

공식 자료 조회 기준은 2026-09-28이며, 2026-10-12에 아래 Unity·Unreal·Android·Godot 문서의 현행 본문과 인용한 문서 수정일을 다시 확인했습니다. 2026-10-15에는 Godot 4.7 문서, Unity Netcode for Entities 1.10.0의 Ghost relevancy 문서, Android ADPF 문서의 수정일(2026-02-26)이 그대로임을 재확인했습니다. 아래는 각 API 설명에 기반한 설계 기준이며 특정 MMORPG의 성능 달성이나 업계 채택률을 뜻하지 않습니다.

- 관찰 범위에서 제외된 클라이언트 객체의 제거를 권위 엔티티의 사망/파괴와 구분합니다. 재진입 시 초기 관찰 상태로 복원하고 사망·보상 연출을 재실행하지 않습니다. 연결별 관찰 필터는 서버의 가시성/인가 경계이며 카메라 culling으로 대체하지 않습니다. [Unity Netcode for Entities 1.10.0의 Ghost relevancy](https://docs.unity.cn/Packages/com.unity.netcode%401.10/manual/optimization/optimize-ghosts.html)는 client despawn과 server entity 파괴가 다름을 명시합니다.
- 표시 리소스 chunk, 게임 판정 데이터, 서버 소유 존/인스턴스, 연결별 AOI는 별도 경계입니다. 로딩/언로딩이 권위 상태를 임의 생성·삭제하지 못하게 하고, 월드/인스턴스·콘텐츠 버전·객체 세대로 늦은 결과를 검증합니다. 판정 데이터가 없으면 빈 지형으로 간주하지 않습니다. [World Partition](https://dev.epicgames.com/documentation/unreal-engine/world-partition-in-unreal-engine)은 gameplay Actor도 포함하는 셀 로딩 기능이지 서버 소유권 이전이나 정보 인가의 자동 구현이 아닙니다.
- [Godot 배경 로딩](https://docs.godotengine.org/en/4.7/tutorials/io/background_loading.html)의 `load_threaded_get()`은 요청이 끝나지 않았으면 블로킹될 수 있으므로 완료 상태를 확인합니다. 활성 SceneTree 변경은 [물리·프레임·스레드 경계](/game/godot-runtime.md#물리프레임스레드-경계)의 계약대로 메인 스레드에서 수명 검증 후 처리합니다. 4.7.2의 `load_threaded_request()`에는 **취소 API가 없고**(같은 태그의 [`ResourceLoader.xml`](https://github.com/godotengine/godot/blob/4.7.2-stable/doc/classes/ResourceLoader.xml)에도 취소 메서드가 없습니다), 요청한 사용자 token은 `load_threaded_get()`을 호출할 때까지 결과 리소스를 계속 보유합니다([고정 구현](https://github.com/godotengine/godot/blob/ed1daf0bf001b61586d9930840f2f1394092c079/core/io/resource_loader.cpp)). 표시 참조만 비우거나 화면/씬이 먼저 사라지면 token이 남아 "최대 1장 보관" 같은 메모리 계약이 깨집니다. 요청 수명을 씬보다 오래 사는 단일 소유자(모듈 수명 escrow 등)에 두고, 대상 교체·씬 종료 때 진행 중 요청은 다음 프레임 폴링으로 넘겨 LOADED/FAILED 뒤 정확히 한 번 get·폐기하며, 확장 unload 전에 callback 해제와 token 정리를 끝냅니다. 결과는 요청 세대·대상·identity가 맞을 때만 표시합니다. 요청 직후 씬을 제거하는 회귀로 get 횟수와 잔존 리소스를 확인합니다.
- **자주 여는 UI의 리소스 계약:** 상점·가방·대화처럼 자주 여는 창은 시작 시 한 번 인스턴스·등록하고 열기는 표시 전환과 데이터 갱신만 하게 해, 열 때 씬 인스턴스·파일 읽기·디코딩으로 생기는 프레임 드랍을 막습니다. 작은 아이콘은 `texture_atlas` 임포터로 페이지에 묶고 소비자가 없는 이미지는 넣지 않습니다. 큰 일러스트는 표시 해상도로 줄인 제품 사본을 비동기 선로드합니다. **[관찰, 4.7.2]** `.import`의 아틀라스 그룹 구성을 외부에서 바꾼 뒤 `--headless --import`만 실행하면 페이지 PNG는 다시 만들어져도 구성원의 기존 `AtlasTexture` 영역 좌표가 남을 수 있습니다. 원래 구성원 전체를 에디터의 `EditorFileSystem.reimport_files`로 다시 가져오고, 원본과 아틀라스 영역의 픽셀 일치(임포터의 `fix_alpha_border` 정규화 반영)로 검증합니다. 크기 일치만으로는 이 stale 좌표를 잡지 못합니다.
- 검증한 장면·판정 정의의 쌍을 재사용(선행 로딩·유지 범위로 반복 로딩을 줄이는 선택)하는 것은 **허용된 상주 메모리 예산 안에서만** 선택하며 무제한 캐시가 되지 않게 합니다. 방문한 모든 장면의 영구 보관을 기본값으로 삼지 않습니다. 메모리 우선 정책에서는 현재 장면과 실패 복구에 필요한 전환 중 참조만 유지하고, 퇴출한 장면은 다시 읽어 검증합니다. 표시 캐시의 해제와 권위 월드 상태의 초기화는 구분합니다. 자기 장착 외형 같은 재사용 리소스도 보관 범위·퇴출 조건을 정하며 부분 생성 실패를 재사용하지 않습니다. 첫 방문·재방문, 파일 파싱·검증·인스턴스화·트리 진입·표시 결합 비용과 전환 중 최대 상주량을 함께 측정합니다. 사전 로딩한 probe를 cold load로, 텍스트 `.tscn`·실험용 `.scn`을 export 성능으로 표현하지 않습니다.
- 고정 4.7.2의 `ResourceLoader::exists()`는 경로가 `ResourceCache`에 있으면 디스크를 확인하지 않고 true를 반환합니다([고정 소스](https://github.com/godotengine/godot/blob/ed1daf0bf001b61586d9930840f2f1394092c079/core/io/resource_loader.cpp#L1247-L1252)). 기본 `CACHE_MODE_REUSE`로 보관한 리소스는 파일 누락 실패를 숨길 수 있습니다. [`CACHE_MODE_IGNORE`](https://github.com/godotengine/godot/blob/4.7.2-stable/doc/classes/ResourceLoader.xml)은 해당 로드의 주 리소스·subresource 캐시 사용/등록을 피하지만 외부 의존성은 REUSE이며, 의존성까지 우회하려면 `CACHE_MODE_IGNORE_DEEP`이 필요합니다. 다른 소유자가 이미 보관한 캐시 항목은 없어지지 않으므로 IGNORE 로드만으로 이후 `exists()`가 디스크를 검사한다고 가정하지 않습니다. 저장소에서 다시 읽을 수 있음이 계약이면 적절한 IGNORE 모드의 재로드 결과와 필수 의존성 누락을 검사합니다. export의 `.import`·`.remap`·PCK 경로를 고려하고 `FileAccess`의 원본 경로 존재 검사로 대체하지 않으며, 주 리소스와 의존 파일을 각각 숨긴 격리 사본에서 실패를 확인합니다.
- [Godot 물리 보간](https://docs.godotengine.org/en/4.7/tutorials/physics/interpolation/physics_interpolation_introduction.html)은 로컬 물리 tick 사이의 표시를 다룹니다. 원격 snapshot 시간축은 다를 수 있으므로 두 보간을 같은 transform에 무조건 중복 적용하지 않고 별도 표시 정책을 정합니다.
- 밀집 캐릭터·효과·이름표·로딩과 기기별 CPU/GPU·메모리·발열 후 지속 성능을 측정합니다. 시각 품질·표시 갱신 예산과 권위 시뮬레이션 tick/충돌/공격 규칙은 분리합니다. [Android ADPF best practices](https://developer.android.com/games/optimize/adpf/best-practices-adpf)(문서 수정 2026-02-26)는 콘텐츠별 세밀한 품질 조절과 실기기 검증을 권고하지만 특정 플러그인·렌더러의 자동 도입 근거는 아닙니다.



### 물리와 저수준 서버 API

- `PhysicsServer2D/3D`·`RenderingServer`는 Node 계층 아래의 API이며 대량 객체의 Node 관리 비용을 줄일 수 있습니다. 여기서 **Server는 네트워크 게임 서버를 뜻하지 않습니다.** 실제 solver 비용과 Node/바인딩 비용을 구분한 뒤 필요한 경계에만 적용합니다. [Optimization using Servers](https://docs.godotengine.org/en/4.7/tutorials/performance/using_servers.html)
- 직접 생성한 RID는 해당 서버의 `free_rid` 계약으로 한 번 정리합니다. Node/Resource에서 빌린 RID를 직접 해제하지 않고 원래 소유자를 유지합니다. RID는 Resource의 참조 카운트를 늘리지 않으므로 RID만 보관한 채 `Ref<Resource>`를 잃지 않습니다. Node가 소유한 같은 객체를 저수준 API로 경쟁 제어하지 않습니다.
- 서버의 반환값 조회는 비동기 작업의 동기화를 유발할 수 있습니다. 프레임마다 모든 transform·body state를 되읽지 말고 권위 있는 데이터와 callback/snapshot 경계를 설계합니다. 모든 getter가 항상 비싸다는 단정 대신 실제 호출의 stall을 측정합니다.
- 활성 body 수뿐 아니라 접촉 밀도·constraint 수·shape 복잡도·ray/shape query 수·CCD·sleep/wake 패턴을 부하 변수로 둡니다. 필요한 판정 정확도를 유지하며 collision layer/mask, 단순 shape, 쿼리 배치·공간 분할을 검토합니다. 게임 규칙과 다른 충돌을 내면서 빠른 결과는 성공이 아닙니다.
- 내장 Jolt와 구형 Godot Jolt 확장 플러그인의 설정 경로·지원 joint·동작 차이를 구분합니다. 4.7 공식 문서는 Jolt의 별도 physics thread 지원을 **experimental**로 설명합니다. CPU 코어를 더 쓰려는 이유만으로 무검증 활성화하지 않습니다. joint, margin, kinematic contact·ray face index 옵션은 정확도·메모리·처리량을 함께 검증합니다. [Jolt 차이·스레드 제약](https://docs.godotengine.org/en/4.7/tutorials/physics/using_jolt_physics.html)
- 공개 API와 backend 설정으로 부족하면 해당 버전의 확장 API 노출 범위를 먼저 확인하고 엔진 모듈/fork 또는 별도 physics 통합을 비교합니다. 별도 world의 충돌·자원 수명·디버깅·플랫폼 빌드 비용까지 포함하며 C++ 채택을 물리 엔진 재작성의 승인으로 해석하지 않습니다.
- upstream Jolt의 조건부 deterministic simulation 설명을 Godot 통합 전체의 결정성 보장으로 전이하지 않습니다. lockstep·rollback이 필요하면 빌드/플랫폼/수치 연산/입력 순서와 재현 결과를 검증하고, 보장되지 않으면 권위 snapshot·보정 모델을 선택합니다.

### 전투·실시간 네트워크·4X/MMORPG의 부하

다음은 장르별 설계·측정 지침이지 특정 동접이나 성능 배수의 보장, 특정 장르/아키텍처를 반드시 채택하라는 지시가 아닙니다.

| 영역 | 대표 부하와 최적화 경계 | 정확성·성능을 함께 볼 증거 |
|---|---|---|
| 전투 코어 | 광역기 타깃 후보, 효과/버프 갱신, 투사체·충돌 질의, 동시 사망·spawn/despawn | 밀집 전투의 tick 분포·판정 결과, 할당/복사, 큐 깊이, 대상 generation 오류 |
| 4X | 맵/유닛 수, 경제/생산 의존성, AI 의사결정, 다수 경로 요청, 턴 종료 또는 실시간 월드 갱신 | 턴 완료 비용 또는 tick 예산, 재계산 범위·캐시 무효화, 메모리와 결과 일관성 |
| MMORPG | 존 내 밀집도, 관심 영역, 플레이어당 복제 대상, 입장/재접속 burst, 전투와 저장 경계 | 존별 처리량·tick 꼬리 지연, bandwidth/peer, queue 상한·복구, 권위·재화 정합성 |
| 실시간 전송 | 직렬화/역직렬화, broadcast fan-out, snapshot baseline, 손실·재정렬·중복·지연 | packet/byte rate, encode/decode CPU, 낡은 상태 폐기·resync, 느린 peer의 backlog |

- 전체 entity×전체 peer 방송을 기본값으로 삼지 않습니다. 관심 영역(AOI)·전송 주기의 부하는 [서버 체크리스트](/game/server-checklist.md)의 팬아웃 항목, 누락 시 재동기화를 포함한 delta baseline 계약은 [네트워크 복구·전달 의미론](/game/network-delivery.md), 숨겨야 할 정보를 성능 편의상 클라이언트에 보내지 않는 정보 가시성 경계는 [게임 보안](/security/game.md)이 정본입니다.
- Godot의 `ENetMultiplayerPeer`·고수준 RPC를 먼저 평가할 수 있지만 성능 충분성을 이름만으로 판단하지 않습니다. reliable/unreliable/unreliable_ordered와 channel은 메시지의 손실·순서 계약으로 선택합니다. channel 분리는 순서 의존을 분리할 뿐 공유 대역폭·혼잡을 제거하지 않습니다. `reliable`은 업무 명령의 정확히 한 번 커밋을 보장하지 않습니다. [고수준 multiplayer·channels](https://docs.godotengine.org/en/4.7/tutorials/networking/high_level_multiplayer.html#channels)
- **독립 C++ 서버 경계:** Godot `SceneMultiplayer`의 고수준 프로토콜은 엔진 구현 세부이며 비-Godot 서버용 안정 프로토콜이 아닙니다. Godot headless 서버에서는 해당 API를 검증해 쓸 수 있지만 독립 C++ 서버에는 명시적인 wire schema와 호환되는 transport를 설계합니다. C++ 서버가 ENet을 사용한다고 해서 Godot RPC와 호환되는 것은 아닙니다. [공식 SceneMultiplayer 계약](https://docs.godotengine.org/en/4.7/classes/class_scenemultiplayer.html)
- **보안 경계:** 신뢰할 수 없는 peer의 객체 역직렬화를 허용하지 않습니다. `SceneMultiplayer.allow_object_decoding`은 실행 코드가 포함된 객체를 복원해 원격 코드 실행 위험을 만들 수 있습니다. 바이트/필드 메시지를 길이·개수·권한·상태와 함께 검증하고, `auth_callback`이 비어 있으면 연결 peer가 자동 수락되는 동작을 계정 인증 완료로 해석하지 않습니다. [객체 디코딩 경고와 인증 callback](https://docs.godotengine.org/en/4.7/classes/class_scenemultiplayer.html#class-scenemultiplayer-property-allow-object-decoding)
- **Web export 전송 제약:** Godot 4.7 Web export는 저수준 네트워킹을 지원하지 않고 HTTP·WebSocket 클라이언트·WebRTC만 사용할 수 있습니다([Networking](https://docs.godotengine.org/en/4.7/tutorials/export/exporting_for_web.html#networking)). 브라우저 탭이 비활성화되면 `_process`·`_physics_process`가 멈춰 장시간이면 연결이 끊길 수 있습니다([Background processing](https://docs.godotengine.org/en/4.7/tutorials/export/exporting_for_web.html#background-processing)). Web 대상이 있으면 플랫폼별 전송 능력(비신뢰·비순서 채널 유무, 최대 메시지 크기)을 명시해 게임 코드가 UDP를 가정하지 않게 합니다. 비신뢰·비순서 전달이 필요하면 WebRTC data channel을 검토합니다. WebSocket은 모든 메시지가 순서 보장 stream에 실려 head-of-line(HOL) 지연을 받으므로, 서버 송신 큐의 미송신 **자기완결 snapshot**만 최신 값으로 대체하고 변경분 delta·생성/제거·불연속 marker는 [서버 체크리스트](/game/server-checklist.md)의 병합 금지와 [네트워크 복구·전달 의미론](/game/network-delivery.md)의 marker 승계 기준대로 병합·승계합니다. 수신한 묶음은 버리지 않고 보간 버퍼에 넣습니다. [`WebSocketPeer.connect_to_url`](https://docs.godotengine.org/en/4.7/classes/class_websocketpeer.html#class-websocketpeer-method-connect-to-url)은 Web에서 mixed content를 피하려면 `wss://`와 서버 TLS 인증서에 맞는 FQDN을 쓰고 IP로 직접 접속하지 말라고 안내하며, `handshake_headers`는 Web export에서 지원되지 않습니다(조회 2026-10-11, 재확인 2026-10-15). 네이티브 클라이언트용 사설 CA와 별도로 브라우저가 신뢰하는 인증서를 Web 수신 경로에 두고, 인증 값은 사용자 지정 handshake header가 아닌 경로로 전달합니다. 탭 복귀는 재개·full-state 경로로 복구합니다.
- **Web export의 스레드·확장 지원(확인 2026-10-12, 재확인 2026-10-15):** 단일 스레드 Web export는 4.3부터 지원되며 Godot 4.7 문서는 이를 선호·기본 방식으로 설명합니다. 이 방식은 스레드를 쓸 수 없습니다. **Thread Support**를 켠 export는 SharedArrayBuffer를 쓰므로 보안 컨텍스트(HTTPS)와 `Cross-Origin-Opener-Policy: same-origin`·`Cross-Origin-Embedder-Policy: require-corp` 헤더(헤더를 못 붙이면 PWA의 service worker 우회)가 필요하고, 이 조건이 없으면 프로젝트가 실행되지 않습니다. GDExtension을 로드하려면 **Extensions Support**를 켜야 하고 확장도 Web용으로 따로 컴파일해야 하며, 이 옵션 역시 cross-origin isolation 헤더가 필요합니다. [Thread and extension support](https://docs.godotengine.org/en/4.7/tutorials/export/exporting_for_web.html#thread-and-extension-support), [Serving the files](https://docs.godotengine.org/en/4.7/tutorials/export/exporting_for_web.html#serving-the-files)
- MMO는 한 프로세스의 CCU 숫자만으로 검증하지 않습니다. 이동·전투·존 밀집·AOI 규모·접속/저장 부하를 명시하고 샤딩/존 분리는 필요한 규모와 권위 이전 계약이 확인될 때 결정합니다. Godot headless가 게임 계산 서버인지, 독립 C++ 서버가 필요한지는 엔진 의존성과 실측 비용으로 판단합니다.
- 공통 프로토콜·서버 권위·복구 기준은 [네트워크 동기화](/game/network-sync.md), [게임 보안](/security/game.md), [서버 체크리스트](/game/server-checklist.md)를 따릅니다.

### 성능 수락 기준

1. **부하 정의:** 목표 기기·CPU/코어·메모리, 렌더러/physics backend, 활성 객체 수·밀집도·peer/관심 대상 수, tick/턴/복제 주기, 입력 데이터·seed·시나리오를 고정합니다. 미정인 값은 프로젝트 요구로 결정하며 임의의 달성 수치를 제시하지 않습니다.
2. **동일 조건 비교:** 최적화 전후 같은 release 옵션·해상도·콘텐츠·warm-up·계측 조건으로 비교합니다. Godot profiler와 네이티브 CPU profiler를 함께 사용하고 C++ 상세 비용을 GDScript profiler만으로 판정하지 않습니다. [공식 측정 도구](https://docs.godotengine.org/en/4.7/tutorials/performance/general_optimization.html#measuring-performance)
3. **지표:** 평균뿐 아니라 frame/tick/턴 처리의 p95·p99·최대값, 예산 초과 횟수, 처리량, 메모리 peak, 할당/복사, 경합, backlog, peer별 bytes/packets와 재전송/폐기를 기록합니다. tick 예산은 `1 / tickRate`이며 물리·전투·네트워크·기타 작업이 함께 소비하므로 평균만 예산 안에 들어가는 것으로 통과시키지 않습니다.
4. **정상·한계·과부하:** 밀집 전투·대규모 턴 갱신·대량 생성/해제·재접속·느린 peer·손실/재정렬·지연을 재현합니다. 정의한 상한에서는 유지하거나 명시적으로 거부하고 큐가 무한 증가하지 않도록 합니다.
5. **동작 보존:** 같은 입력에서 전투/경제 결과·물리 판정·권한·소유권·복제 의미가 유지되는지 확인합니다. 병렬화·backend 교체로 결과가 달라지는 경우 의도한 계약 변경인지 구분합니다. microbenchmark만으로 editor·exported client·headless server의 전체 성능을 주장하지 않습니다.

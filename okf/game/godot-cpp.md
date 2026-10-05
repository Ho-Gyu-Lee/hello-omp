---
type: Concept
title: Godot와 C++ 게임 개발
description: 공식 Godot·godot-cpp 버전 근거, 물리·전투·네트워크와 4X/MMORPG 성능 설계, 로컬 인게임/서버 이관 경계, 2D 시야·이동감·화면 안 사거리와 자동 사냥 대상 선택, 에셋 팩 검수, 에디터 복제·소유권·부분 생성, 렌더 데이터 정밀도와 addon 설정 경계, 재사용 UI·GDExtension 실행 검증 지침입니다.
tags: [game, godot, cpp, gdextension, physics, combat, networking, simulation, ui, build, ownership, performance]
timestamp: 2026-10-05T00:00:00Z
---

# Godot와 C++ 게임 개발

공식 API 사실과 프로젝트에서 선택할 정책을 구분합니다. 코드 작성 전 [코딩 스타일](/coding-style.md)과 [언어 공통 코딩 스타일](/language-style.md)의 공통 규칙·C/C++ 예외를 읽고 기존 프로젝트 계약과 Godot의 외부 API 이름을 보존합니다. 사용자·프로젝트별 게임 개발 목적이 있으면 [축적 지식 발견 경로](/learned/index.md)에서 해당 concept을 추가로 확인합니다.

## 확인 기준과 버전 고정

**자료 확인일은 2026-09-26입니다. 아래 발표일과 다릅니다.** 검색으로 출처를 찾은 다음 공식 발표·문서·태그 원문을 직접 확인했습니다.

| 구분 | 확인한 사실 | 공식 근거 |
|---|---|---|
| 최신 Godot 안정판 | **4.7.2-stable**, 발표일 **2026-08-18** | [공식 전체 아카이브](https://godotengine.org/download/archive/), [4.7.2 발표](https://godotengine.org/article/maintenance-release-godot-4-7-2/) |
| Godot 엔진 소스 | `4.7.2-stable` → `ed1daf0bf001b61586d9930840f2f1394092c079` | [공식 태그 조회](https://api.github.com/repos/godotengine/godot/git/ref/tags/4.7.2-stable), 발표 본문의 빌드 커밋과 일치합니다. |
| 개발판 | 아카이브의 4.8 최신 항목은 **4.8-dev6**, 발표일 **2026-09-15**입니다. 안정판이 아닙니다. | [공식 전체 아카이브](https://godotengine.org/download/archive/), [4.7 릴리스 정책](https://docs.godotengine.org/en/4.7/about/release_policy.html) |
| 공식 C++ 바인딩 | **godot-cpp 10.0.0-stable**, 공개일 **2026-09-15**, `prerelease=false` | [공식 릴리스](https://github.com/godotengine/godot-cpp/releases/tag/10.0.0-stable), [릴리스 API의 published_at](https://api.github.com/repos/godotengine/godot-cpp/releases?per_page=5) |
| 바인딩 소스 핀 | `10.0.0-stable` → `507ed9d840c01a3c5b2a39af8bb4000bfac30bf5` | [공식 태그 조회](https://api.github.com/repos/godotengine/godot-cpp/git/ref/tags/10.0.0-stable) |
| 바인딩 버전 체계 | v10부터 엔진과 **독립 버전**입니다. 이 핀의 내장 API 대상은 `4.3`, `4.4`, `4.5`, `4.6`, `4.7`입니다. | [핀의 README](https://github.com/godotengine/godot-cpp/blob/507ed9d840c01a3c5b2a39af8bb4000bfac30bf5/README.md), [핀의 supported_api_versions](https://github.com/godotengine/godot-cpp/blob/507ed9d840c01a3c5b2a39af8bb4000bfac30bf5/tools/godotcpp.py) |

**출처 간 차이도 보존합니다.** [4.7 입문 문서](https://docs.godotengine.org/en/4.7/tutorials/scripting/cpp/gdextension_cpp_example.html)는 여전히 엔진과 같은 `4.x` 브랜치를 선택하는 이전 방식을 설명합니다. v10에는 위 릴리스의 README·빌드 소스를 적용하며 존재를 확인하지 않은 `godot-4.7.2-stable` 바인딩 태그를 만들어 쓰지 않습니다. 릴리스 API는 `10.0.0-rc1`·`rc2`에도 `prerelease=false`를 표시하므로 이 플래그만으로 안정판을 판정하지 않습니다. RC라는 이름과 정식 `10.0.0-stable` 발표를 함께 확인합니다.

**프로젝트 선택:** 신규 4.7 프로젝트의 출발점은 엔진·export templates `4.7.2`, 바인딩 위 커밋, API 대상 `4.7`로 고정할 수 있습니다. 이는 이 조합을 실제 게임에서 실행 검증했다는 뜻은 아닙니다. 기존 프로젝트는 검증된 핀을 유지하고 의도적인 업그레이드 변경에서만 교체합니다.

- 엔진 바이너리/커밋, export templates 버전, 바인딩 submodule 커밋, API JSON 또는 `api_version`, 컴파일러·SDK·아키텍처·정밀도·빌드 옵션을 함께 기록합니다. 움직이는 `master`, `stable`, `/latest/` 문서를 빌드 잠금 대신 사용하지 않습니다.
- 새 기능·버그 수정·보안/플랫폼 요구로 업그레이드를 검토할 때 공식 아카이브와 릴리스·태그를 다시 열고 **확인일과 발표일을 각각 갱신**합니다. 읽을 때마다 의존성을 자동 업그레이드하지 않습니다.
- 패치 업데이트는 공식적으로 권장되지만, 프로젝트 사본/버전 관리와 아래 editor·export 실행 검증을 거쳐 핀을 갱신합니다. minor 변경에는 마이그레이션과 동작 변화도 검토합니다. [공식 정책](https://docs.godotengine.org/en/4.7/about/release_policy.html)

## GDExtension과 엔진 모듈 선택

**사실:** `godot-cpp`는 Godot 프로젝트가 유지하는 공식 C++ GDExtension 바인딩입니다. GDExtension은 엔진을 다시 빌드하지 않고 네이티브 라이브러리를 로드하며 대부분의 스크립트 API에 접근합니다. 엔진 모듈은 엔진 내부까지 더 깊이 접근하지만 엔진과 필요한 플랫폼의 export templates를 함께 다시 빌드해야 합니다. [공식 비교](https://docs.godotengine.org/en/4.7/tutorials/scripting/cpp/about_godot_cpp.html)

**선택 기준:** 게임 로직, 계산 병목, 외부 C/C++ 라이브러리 통합에 공개 API가 충분하면 GDExtension을 먼저 선택합니다. 필요한 내부 기능이 노출되지 않았거나 엔진 자체 변경이 요구되면 모듈을 검토합니다. C++ 사용 자체를 성능 증거로 보지 않고 프로파일링으로 이동할 경계를 정합니다. Godot 3의 GDNative 예제를 Godot 4의 GDExtension 등록 코드와 혼합하지 않습니다.

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
- 병렬화는 읽기 snapshot, 작업별 쓰기 소유권, 합류/커밋 경계를 먼저 정합니다. 독립 계산 결과를 검증해 권위 상태에 적용하고 SceneTree는 아래 「물리·프레임·스레드 경계」의 계약을 지킵니다. lock-free·작업 분할·샤딩은 측정된 경합과 불변조건이 정당화할 때만 도입합니다.

### 메모리 예산·수명 분리와 할당 검증

- **설계 기준:** 중앙 메모리 정책·전체 예산·계측과 하나의 전역 가변 크기 풀을 구분합니다. 행동별로 할당/반납 규칙을 복제하지 않고 시스템이 소유하는 공통 저장소를 사용합니다. 공통 계층은 타입·크기 등급·수명별 저장소를 허용하며 singleton·단일 전역 락이나 엔진 allocator 교체를 의미하지 않습니다.
- 고정 용량으로 충분한 코어는 배열·값 소유를 유지합니다. 동적 객체가 필요한 기능에서 타입별 풀, 틱/작업 임시 arena, 월드 수명 저장소, I/O 버퍼의 실제 소비자와 고갈 정책을 함께 구현합니다. 빈 범용 allocator 프레임워크를 선행 생성하거나 무할당 배열을 힙 기반 풀로 바꾸지 않습니다.
- 예약 용량·실사용·최대 점유·실패를 구분하고 저장소 전체의 예약 합·전환 중 구/신 데이터·로딩 임시 공간을 예산에 포함합니다. 무제한 성장·일반 힙 fallback으로 고갈을 숨기지 않습니다. 풀의 여유 슬롯·크기 등급 낭비와 스택 배열의 피크도 메모리 비용이며 힙 무할당이 메모리 비용 0을 뜻하지 않습니다.
- 반복 객체는 반납 뒤 핸들 generation을 검증하고, arena는 모든 소비자가 끝난 경계에서만 재사용합니다. 비동기 작업이나 I/O가 소유한 버퍼를 틱 종료·취소 요청만으로 회수하지 않습니다. 소유 스레드·정렬·상한·수명·고갈 결과를 공통 계약에 둡니다.
- 로딩 화면을 줄이는 목표와 런타임 작업 예산을 함께 설계합니다. 비동기 I/O·압축 해제 완료와 메인 스레드의 인스턴스화·GPU 업로드·해제를 분리하고 상주량·진행 중 요청·프레임별 반영/해제에 상한을 둡니다. 선행 로딩·유지 범위는 반복 로딩을 줄이되 무제한 캐시가 되지 않게 합니다.
- 할당 검증은 작성자·에이전트의 기억을 대체하는 실행 경계입니다. 생성/제거·정상/거부·고갈·취소·재사용을 섞어 검사하고 의도적 할당을 검출하는 양성 대조군으로 관측기를 검증합니다. [MSVC `_CrtSetAllocHook`](https://learn.microsoft.com/en-us/cpp/c-runtime-library/reference/crtsetallochook?view=msvc-170)은 debug CRT의 할당/재할당/해제를 관측하므로 실행한 CRT 경로만 보장하며 OS 직접 할당·다른 allocator·엔진/GPU·미실행 경로까지 확대하지 않습니다. 계측 빌드를 release 지연 성능의 근거로 사용하지 않습니다.
- 혼합 부하의 frame/tick 꼬리 지연과 메모리 점유 추세·예약/실사용·할당 크기 분포를 함께 확인합니다. RSS 안정·누수 부재·풀 사용만으로 단편화나 히치가 없다고 결론 내리지 않으며 클라이언트와 서버의 실제 플랫폼·부하를 각각 검증합니다.


### 로컬 인게임과 서버 이관

다음은 클라이언트 내부에서 게임을 먼저 실행하고 독립 서버로 이관할 때의 설계 기준입니다. 특정 프로젝트의 개발 순서를 모든 게임에 강제하거나 서버 기능이 이미 구현됐다고 주장하지 않습니다.

- 콘텐츠 규칙과 상태는 엔진 비의존 코어에 두고 로컬 실행 호스트가 단일 소유자로 진행합니다. Godot 입력은 게임 의도로 변환하고 월드/HUD는 관찰 결과를 소비합니다. 명령 접수 성공과 게임 규칙의 수락 결과를 구분해 로컬 호출도 동기 UI 부수효과에 의존하지 않게 합니다.
- 이관 경계는 실행 호스트·명령 전달·관찰 결과입니다. 코어가 필요로 하는 고정 스텝·난수 상태·콘텐츠 정의를 명시적으로 제공하고 운영체제 시계·Node 수명·렌더 delta에 게임 판정을 묶지 않습니다. 실제 두 번째 호스트가 필요하기 전에 빈 서버 인터페이스·가짜 RPC·DB를 선행 생성하지 않습니다.
- 이관 대비 동기화 계약(예측·보정·재접속·결과 보존)을 로컬 호스트에서 검증하라는 요구는 두 번째 호스트의 구현 승인이 아닙니다. 서버 개발이 명시적으로 결정되기 전에는 별도 서버 프로세스·소켓 전송·wire codec/stream framing·접속 제한·서버 bench 도구를 만들지 않고, 프로세스 안의 논리 메시지 경계와 지연·지터 모의로 계약을 검증합니다. 이미 요청 밖으로 만들어졌다면 호환 shim 없이 제거하고 규칙 문서에 금지 범위를 남겨 다른 작업자가 재도입하지 않게 합니다.
- 충돌·탐색·좌표·맵 정의도 이식 범위입니다. Godot physics/navigation 호출을 인터페이스로 감싼 것만으로 독립 서버 이식이 끝나지 않습니다. 필요한 엔진 비의존 판정과 공통 데이터를 사용하거나 동등한 backend의 서버 실행 비용을 명시합니다. 아이소메트릭 화면 좌표·카메라 transform과 게임의 월드 좌표를 구분합니다.
- 로컬 결과는 관찰 가능한 필드와 명령 결과를 전달하고 내부 월드의 mutable 포인터를 노출하지 않습니다. 버퍼 수명·재진입·리셋 세대를 정하며 UI 카운트다운·애니메이션 이벤트를 게임 쿨다운·명중·보상 판정의 정본으로 사용하지 않습니다.
- 온라인 전환은 전체 로컬 권위 월드 실행을 서버로 옮기는 것이지 두 월드를 동시에 정본으로 유지하는 것이 아닙니다. 클라이언트에 남길 예측 계산과 서버 전용 규칙·비공개 콘텐츠/난수 데이터를 구분합니다. 오프라인 결과·저장을 온라인 경제 상태로 신뢰하거나 연결 실패에 로컬 권위로 fallback하지 않습니다.
- 이식성은 Godot 없는 코어 빌드/행동 검사, 같은 입력 시나리오의 로컬 호스트 결과, 실제 창의 입력/표시로 각각 검증합니다. 공통 소스·고정 스텝만으로 플랫폼 간 비트 결정성·네트워크 내구성·인증이 보장되지는 않습니다.

### 관찰 수명·월드 로딩·모바일 표현 예산

공식 자료 조회 기준은 2026-09-28입니다. 아래는 각 API 설명에 기반한 설계 기준이며 특정 MMORPG의 성능 달성이나 업계 채택률을 뜻하지 않습니다.

- 관찰 범위에서 제외된 클라이언트 객체의 제거를 권위 엔티티의 사망/파괴와 구분합니다. 재진입 시 초기 관찰 상태로 복원하고 사망·보상 연출을 재실행하지 않습니다. 연결별 관찰 필터는 서버의 가시성/인가 경계이며 카메라 culling으로 대체하지 않습니다. [Unity Netcode for Entities 1.10.0의 Ghost relevancy](https://docs.unity.cn/Packages/com.unity.netcode%401.10/manual/optimization/optimize-ghosts.html)는 client despawn과 server entity 파괴가 다름을 명시합니다.
- 표시 리소스 chunk, 게임 판정 데이터, 서버 소유 존/인스턴스, 연결별 AOI는 별도 경계입니다. 로딩/언로딩이 권위 상태를 임의 생성·삭제하지 못하게 하고, 월드/인스턴스·콘텐츠 버전·객체 세대로 늦은 결과를 검증합니다. 판정 데이터가 없으면 빈 지형으로 간주하지 않습니다. [World Partition](https://dev.epicgames.com/documentation/unreal-engine/world-partition-in-unreal-engine)은 gameplay Actor도 포함하는 셀 로딩 기능이지 서버 소유권 이전이나 정보 인가의 자동 구현이 아닙니다.
- [Godot 배경 로딩](https://docs.godotengine.org/en/4.7/tutorials/io/background_loading.html)의 `load_threaded_get()`은 요청이 끝나지 않았으면 블로킹될 수 있으므로 완료 상태를 확인합니다. 데이터 로딩과 인스턴스화·GPU 반영 비용을 구분하고 [활성 SceneTree 변경](https://docs.godotengine.org/en/4.7/tutorials/performance/thread_safe_apis.html)은 메인 스레드에서 수명 검증 후 처리합니다.
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

- 전체 entity×전체 peer 방송을 기본값으로 삼지 않습니다. AOI·가시성·전송 주기를 설계하되 숨겨야 할 정보를 성능 편의상 클라이언트에 보내지 않습니다. delta에는 대상이 실제 보유한 baseline과 누락 시 재동기화 경로가 필요합니다.
- Godot의 `ENetMultiplayerPeer`·고수준 RPC를 먼저 평가할 수 있지만 성능 충분성을 이름만으로 판단하지 않습니다. reliable/unreliable/unreliable_ordered와 channel은 메시지의 손실·순서 계약으로 선택합니다. channel 분리는 순서 의존을 분리할 뿐 공유 대역폭·혼잡을 제거하지 않습니다. `reliable`은 업무 명령의 정확히 한 번 커밋을 보장하지 않습니다. [고수준 multiplayer·channels](https://docs.godotengine.org/en/4.7/tutorials/networking/high_level_multiplayer.html#channels)
- **독립 C++ 서버 경계:** Godot `SceneMultiplayer`의 고수준 프로토콜은 엔진 구현 세부이며 비-Godot 서버용 안정 프로토콜이 아닙니다. Godot headless 서버에서는 해당 API를 검증해 쓸 수 있지만 독립 C++ 서버에는 명시적인 wire schema와 호환되는 transport를 설계합니다. C++ 서버가 ENet을 사용한다는 사실만으로 Godot RPC와 호환되지 않습니다. [공식 SceneMultiplayer 계약](https://docs.godotengine.org/en/4.7/classes/class_scenemultiplayer.html)
- **보안 경계:** 신뢰할 수 없는 peer의 객체 역직렬화를 허용하지 않습니다. `SceneMultiplayer.allow_object_decoding`은 실행 코드가 포함된 객체를 복원해 원격 코드 실행 위험을 만들 수 있습니다. 바이트/필드 메시지를 길이·개수·권한·상태와 함께 검증하고, `auth_callback`이 비어 있으면 연결 peer가 자동 수락되는 동작을 계정 인증 완료로 해석하지 않습니다. [객체 디코딩 경고와 인증 callback](https://docs.godotengine.org/en/4.7/classes/class_scenemultiplayer.html#class-scenemultiplayer-property-allow-object-decoding)
- MMO는 한 프로세스의 CCU 숫자만으로 검증하지 않습니다. 이동·전투·존 밀집·AOI 규모·접속/저장 부하를 명시하고 샤딩/존 분리는 필요한 규모와 권위 이전 계약이 확인될 때 결정합니다. Godot headless가 게임 계산 서버인지, 독립 C++ 서버가 필요한지는 엔진 의존성과 실측 비용으로 판단합니다.
- 공통 프로토콜·서버 권위·복구 기준은 [네트워크 동기화](/game/network-sync.md), [게임 보안](/security/game.md), [서버 체크리스트](/game/server-checklist.md)를 따릅니다.

### 성능 수락 기준

1. **부하 정의:** 목표 기기·CPU/코어·메모리, 렌더러/physics backend, 활성 객체 수·밀집도·peer/관심 대상 수, tick/턴/복제 주기, 입력 데이터·seed·시나리오를 고정합니다. 미정인 값은 프로젝트 요구로 결정하며 임의의 달성 수치를 제시하지 않습니다.
2. **동일 조건 비교:** 최적화 전후 같은 release 옵션·해상도·콘텐츠·warm-up·계측 조건으로 비교합니다. Godot profiler와 네이티브 CPU profiler를 함께 사용하고 C++ 상세 비용을 GDScript profiler만으로 판정하지 않습니다. [공식 측정 도구](https://docs.godotengine.org/en/4.7/tutorials/performance/general_optimization.html#measuring-performance)
3. **지표:** 평균뿐 아니라 frame/tick/턴 처리의 p95·p99·최대값, 예산 초과 횟수, 처리량, 메모리 peak, 할당/복사, 경합, backlog, peer별 bytes/packets와 재전송/폐기를 기록합니다. tick 예산은 `1 / tickRate`이며 물리·전투·네트워크·기타 작업이 함께 소비하므로 평균만 예산 안에 들어가는 것으로 통과시키지 않습니다.
4. **정상·한계·과부하:** 밀집 전투·대규모 턴 갱신·대량 생성/해제·재접속·느린 peer·손실/재정렬·지연을 재현합니다. 정의한 상한에서는 유지하거나 명시적으로 거부하고 큐가 무한 증가하지 않도록 합니다.
5. **동작 보존:** 같은 입력에서 전투/경제 결과·물리 판정·권한·소유권·복제 의미가 유지되는지 확인합니다. 병렬화·backend 교체로 결과가 달라지는 경우 의도한 계약 변경인지 구분합니다. microbenchmark만으로 editor·exported client·headless server의 전체 성능을 주장하지 않습니다.

## API·ABI·툴체인 호환성

- **방향:** 낮은 Godot API를 대상으로 만든 확장은 이후 minor 엔진에서 동작하도록 설계되며 반대 방향은 보장되지 않습니다. 필요한 기능을 제공하는 최소 API를 선택하고 실제 지원할 최소/최대 엔진에서 실행합니다. Godot 4.0 대상 확장은 4.1 이후와 호환되지 않는 예외가 있습니다. API 호환성은 모든 게임 동작이 같다는 보장이 아닙니다. [공식 호환성](https://docs.godotengine.org/en/4.7/tutorials/scripting/cpp/about_godot_cpp.html#version-compatibility)
- **v10 API 선택:** `scons api_version=4.7`처럼 명시합니다. 프로젝트의 `SConscript("godot-cpp/SConstruct", {"api_version": "4.7"})`에서도 기본 대상을 지정할 수 있습니다. 바인딩 버전 `10.0.0`을 `api_version`에 넣지 않습니다. [핀의 README](https://github.com/godotengine/godot-cpp/blob/507ed9d840c01a3c5b2a39af8bb4000bfac30bf5/README.md)
- **커스텀 엔진:** 실제 대상 editor 실행 파일로 `godot --dump-extension-api`를 실행하고 생성된 `extension_api.json`을 `custom_api_file`로 지정합니다. 빌드 소스에서 이 옵션은 `api_version`보다 우선합니다. 엔진 fork·노출 모듈·API 제거 옵션이 달라지면 공식 JSON으로 대체하지 않습니다. [SCons 문서](https://docs.godotengine.org/en/4.7/tutorials/scripting/cpp/build_system/scons.html#using-a-custom-api-file), [핀의 옵션 구현](https://github.com/godotengine/godot-cpp/blob/507ed9d840c01a3c5b2a39af8bb4000bfac30bf5/tools/godotcpp.py)
- **JSON 출력 위치 주의:** 위 SCons 설명은 실행 파일 디렉터리라고 적지만 [4.7 CLI 참조](https://docs.godotengine.org/en/4.7/tutorials/editor/command_line_tutorial.html)는 현재 디렉터리라고 설명합니다. 작업용 빈 디렉터리에서 실행하고 실제 생성 위치를 확인하여 절대 경로로 빌드에 넘깁니다. 위치를 추정해 오래된 JSON을 재사용하지 않습니다.
- **정밀도:** 엔진과 확장의 `precision=single/double`이 같아야 합니다. double 엔진은 editor·export templates·godot-cpp·확장을 같은 정밀도로 빌드하고 해당 커스텀 엔진의 JSON을 사용합니다. GDScript `float`가 64-bit라는 사실은 기본 벡터/`real_t`가 double이라는 뜻이 아닙니다. 멀티플레이어 클라이언트/서버의 정밀도도 맞춥니다. [Large world coordinates](https://docs.godotengine.org/en/4.7/tutorials/physics/large_world_coordinates.html)
- **C++:** 이 바인딩 핀은 C++17 플래그를 설정하며 예외 처리는 기본적으로 비활성화합니다. 확장·정적 godot-cpp·함께 링크하는 C++ 라이브러리의 컴파일러 ABI, C++ 런타임, 예외 정책과 아키텍처를 맞춥니다. GDExtension의 C 인터페이스가 임의의 C++ 바이너리 조합까지 호환시켜 주지는 않습니다. [핀의 컴파일러 플래그](https://github.com/godotengine/godot-cpp/blob/507ed9d840c01a3c5b2a39af8bb4000bfac30bf5/tools/common_compiler_flags.py)
- **플랫폼:** macOS arm64 라이브러리는 Windows·Linux·Android·iOS·Web용이 아닙니다. 각 대상 OS/CPU/SDK/디버그 구성의 산출물이 필요합니다. 최소 OS와 종속 라이브러리도 지원 범위에 포함합니다. macOS에서는 Xcode/Command Line Tools와 clang을 사용하며 `arm64`, `x86_64`, `universal`을 구분합니다. 엔진 전체 빌드의 Vulkan SDK 등 요구를 단순 확장 빌드의 필수조건으로 그대로 옮기지 않습니다. [플랫폼 빌드 안내](https://docs.godotengine.org/en/4.7/engine_details/development/compiling/index.html), [핀의 macOS 구현](https://github.com/godotengine/godot-cpp/blob/507ed9d840c01a3c5b2a39af8bb4000bfac30bf5/tools/macos.py)

## SCons 빌드와 로드 경로

예제 레이아웃은 확장 루트 아래 `godot-cpp/`, `src/`, Godot 프로젝트 `project/`입니다. 기존 프로젝트의 `SConstruct` 또는 [공식 template](https://github.com/godotengine/godot-cpp-template)을 먼저 확인합니다. 루트 SConstruct가 godot-cpp의 SConstruct를 포함하고 확장 소스를 shared library로 링크해야 하며, **godot-cpp 정적 라이브러리만 빌드한 상태는 게임 확장 빌드 완료가 아닙니다.** [공식 입문](https://docs.godotengine.org/en/4.7/tutorials/scripting/cpp/gdextension_cpp_example.html), [SCons 지침](https://docs.godotengine.org/en/4.7/tutorials/scripting/cpp/build_system/scons.html)

아래 명령은 해당 SConstruct와 대상 툴체인이 준비된 확장 루트에서 실행합니다. `godot` 명령은 핀으로 고른 editor 바이너리를 가리켜야 합니다.

```sh
scons --help api_version=4.7
scons platform=macos arch=arm64 target=template_debug api_version=4.7 precision=single debug_symbols=yes optimize=none
scons platform=macos arch=arm64 target=template_release api_version=4.7 precision=single
scons platform=macos arch=arm64 target=template_debug api_version=4.7 compiledb=yes compile_commands.json
```

- `template_debug`는 editor와 debug export용입니다. release export에는 `template_release`를 별도 빌드합니다. `debug` feature와 네이티브 디버그 심볼은 별개이므로 breakpoint용 빌드에는 `debug_symbols=yes`를 명시합니다. `dev_build=yes`는 `.dev`, `precision=double`은 `.double`, `threads=no`는 `.nothreads`를 출력 suffix에 추가하므로 실제 산출물과 manifest 경로를 함께 맞춥니다. [핀의 대상·심볼·suffix 구현](https://github.com/godotengine/godot-cpp/blob/507ed9d840c01a3c5b2a39af8bb4000bfac30bf5/tools/godotcpp.py)
- `compile_commands.json`은 IDE가 실제 include·defines·표준을 읽도록 합니다. 헤더 생성이나 빌드 성공을 대신하는 검증은 아닙니다. 플랫폼/API/정밀도 변경 시 이전 생성물과 라이브러리를 섞지 않습니다.
- 다음 manifest는 **위 arm64 구성만 제공하는 예**이며 SConstruct의 실제 출력 이름을 `libgame.macos.template_debug.arm64.dylib`와 `libgame.macos.template_release.arm64.dylib`로 맞춘 경우입니다. universal 배포나 다른 플랫폼 지원을 주장하지 않습니다.

`project/bin/game.gdextension`:

```ini
[configuration]
entry_symbol = "game_library_init"
compatibility_minimum = "4.7.2"
reloadable = false

[libraries]
macos.debug.arm64 = "./libgame.macos.template_debug.arm64.dylib"
macos.release.arm64 = "./libgame.macos.template_release.arm64.dylib"
```

`compatibility_minimum="4.7.2"`는 이 예제의 **제품 지원 하한 선택**입니다. `api_version=4.7` 자체가 4.7.2를 요구한다는 의미가 아닙니다. 더 낮은 엔진을 지원하려면 실제 API와 동작을 확인하고 둘을 함께 설정합니다. 4.7.2 소스는 feature가 모두 충족되는 key 중 **tag 수가 가장 많은 항목**을 선택하고, 같은 tag 수에서는 먼저 발견한 항목을 유지합니다. 공식 manifest 설명의 top-to-bottom 문구보다 이 고정 소스 동작을 우선하며, key 중복·동률은 만들지 않습니다. [핀의 library matcher](https://github.com/godotengine/godot/blob/ed1daf0bf001b61586d9930840f2f1394092c079/core/extension/gdextension_library_loader.cpp) manifest는 라이브러리 로드뿐 아니라 export에 포함할 대상 선택에도 사용됩니다. 필요한 외부 동적 라이브러리는 `[dependencies]`에 선언하고 macOS 앱에서는 `Contents/Frameworks` 배치를 확인합니다. [manifest 계약](https://docs.godotengine.org/en/4.7/engine_details/engine_api/gdextension/gdextension_file.html)

**로드 순서:** 프로젝트 검색/import → `.gdextension` 발견 → feature에 맞는 라이브러리 로드 → `entry_symbol` 호출 → 초기화 수준별 클래스 등록 → scene/resource의 클래스 인스턴스화입니다. 누락된 library, 다른 CPU, 미해결 dependency, entry symbol 오타, 클래스 등록 누락을 이 순서로 조사합니다.

hot reload는 기본 성공 조건으로 삼지 않습니다. v10 핀은 `use_hot_reload` 기본값이 false이므로 사용하려면 바인딩/확장에 `use_hot_reload=yes`와 manifest의 `reloadable=true`를 함께 적용하고 객체·스레드 정리 동작을 검증합니다. manifest만 켜면 충분하다는 이전 예제를 그대로 적용하지 않습니다. 불확실할 때는 editor와 실행 중 게임을 종료하고 재빌드·재실행합니다. [핀의 hot-reload 옵션](https://github.com/godotengine/godot-cpp/blob/507ed9d840c01a3c5b2a39af8bb4000bfac30bf5/tools/godotcpp.py)

## 등록·프로퍼티·시그널과 이름 계약

작은 Resource 예제입니다. `src/CounterData.h`는 값을 저장하고 실제 변경 때 신호를 발행합니다. 소유 C++ 이름·배치는 [언어 공통 코딩 스타일](/language-style.md)을 따르며 `_bind_methods`, ABI 진입 심볼, 바인딩 문자열·엔진 API 이름은 계약대로 보존합니다.

```cpp
#pragma once

#include <godot_cpp/classes/resource.hpp>
#include <godot_cpp/core/class_db.hpp>

#include <cstdint>

class CounterData : public godot::Resource
{
    GDCLASS(CounterData, godot::Resource);

public:
    void SetValue(std::int64_t newValue)
    {
        if (mValue == newValue)
        {
            return;
        }

        mValue = newValue;
        emit_changed();
        emit_signal("value_changed", mValue);
    }

    std::int64_t GetValue() const
    {
        return mValue;
    }

protected:
    static void _bind_methods()
    {
        godot::ClassDB::bind_method(godot::D_METHOD("set_value", "value"), &CounterData::SetValue);
        godot::ClassDB::bind_method(godot::D_METHOD("get_value"), &CounterData::GetValue);
        ADD_PROPERTY(godot::PropertyInfo(godot::Variant::INT, "value"), "set_value", "get_value");
        ADD_SIGNAL(godot::MethodInfo("value_changed", godot::PropertyInfo(godot::Variant::INT, "value")));
    }

private:
    std::int64_t mValue = 0;
};
```

`src/RegisterTypes.cpp`:

```cpp
#include "CounterData.h"

#include <godot_cpp/godot.hpp>

namespace
{
    void InitializeGame(godot::ModuleInitializationLevel level)
    {
        if (level == godot::MODULE_INITIALIZATION_LEVEL_SCENE)
        {
            GDREGISTER_CLASS(CounterData);
        }
    }
}

extern "C" GDExtensionBool GDE_EXPORT game_library_init(GDExtensionInterfaceGetProcAddress getProcAddress, GDExtensionClassLibraryPtr library, GDExtensionInitialization* initialization)
{
    godot::GDExtensionBinding::InitObject init(getProcAddress, library, initialization);
    init.register_initializer(InitializeGame);
    init.set_minimum_library_initialization_level(godot::MODULE_INITIALIZATION_LEVEL_SCENE);
    return init.init();
}
```

이 예제는 별도 전역 자원을 소유하지 않아 terminator를 등록하지 않습니다. 실제 확장에서 전역 자원·작업 스레드·콜백을 소유하면 `register_terminator`에 초기화 수준과 짝이 맞는 해제 함수를 등록합니다. 라이브러리 unload 전에 그 코드에 접근하는 작업이 끝나야 합니다. [핀의 초기화 API](https://github.com/godotengine/godot-cpp/blob/507ed9d840c01a3c5b2a39af8bb4000bfac30bf5/include/godot_cpp/godot.hpp), [공식 등록 예제](https://docs.godotengine.org/en/4.7/tutorials/scripting/cpp/gdextension_cpp_example.html)

- `GDCLASS`와 `GDREGISTER_CLASS`의 타입·부모가 일치해야 합니다. Node/Resource 클래스는 보통 `MODULE_INITIALIZATION_LEVEL_SCENE`에서 등록합니다. 생성자에서 scene tree 존재나 실제 게임 실행을 가정하지 않습니다. editor·직렬화·문서 시스템도 등록 클래스를 생성할 수 있습니다. [Object 등록](https://docs.godotengine.org/en/4.7/engine_details/architecture/object_class.html#registering-object-classes)
- 에디터에서 실행되면 안 되는 전투·시뮬레이션·네트워크 Node는 `GDREGISTER_RUNTIME_CLASS`로 등록할 수 있습니다. 에디터에서도 기능해야 하는 클래스는 `GDREGISTER_CLASS`로 등록하고, 편집 중 스레드·네트워크·상태 변경을 `Engine::get_singleton()->is_editor_hint()` 경계로 막습니다. 에디터 시각 확인과 런타임 성능 측정을 구분합니다. [등록 모드](https://docs.godotengine.org/en/4.7/engine_details/architecture/object_class.html#registering-object-classes), [핀의 등록 매크로](https://github.com/godotengine/godot-cpp/blob/507ed9d840c01a3c5b2a39af8bb4000bfac30bf5/include/godot_cpp/core/class_db.hpp)
- `BIND_CONSTANT`·`BIND_ENUM_CONSTANT`는 매크로 인수의 C++ 식을 문자열화해 script 이름으로 사용하고 정수 값을 요구합니다. C++ 내부 `enum class` 이름과 script 이름을 분리하려면 `ClassDB::bind_integer_constant`에 이름과 명시적 정수 변환 값을 전달합니다. 이미 배포한 상수 이름은 호환성 계약입니다. [핀의 constant binding](https://github.com/godotengine/godot-cpp/blob/507ed9d840c01a3c5b2a39af8bb4000bfac30bf5/include/godot_cpp/core/class_db.hpp)
- `_ready`, `_process`, `_physics_process` 등 엔진 override와 `_bind_methods`는 요구되는 이름·시그니처를 그대로 둡니다. C++ 내부 메서드 `SetValue`와 바인딩 문자열 `"set_value"`는 별개입니다. `D_METHOD`의 공개 이름, property·signal·NodePath, 이미 배포한 ABI entry symbol은 스크립트·scene·resource·manifest 소비자를 가진 계약입니다. 스타일 변경만으로 이름을 바꾸지 않습니다.
- 외부에서 호출할 메서드는 `_bind_methods`에서 등록하고, property의 getter/setter 문자열은 등록 이름과 맞춥니다. `Callable(object, "method")` 같은 문자열 기반 연결도 바인딩이 필요합니다. 노출 인자·반환값은 Variant로 표현 가능한 타입을 사용합니다. STL 컨테이너나 임의 C++ 포인터를 그대로 공개 API/저장 포맷으로 삼지 않습니다. [프로퍼티·시그널](https://docs.godotengine.org/en/4.7/tutorials/scripting/cpp/gdextension_cpp_example.html#adding-properties), [godot-cpp 타입 경계](https://docs.godotengine.org/en/4.7/tutorials/scripting/cpp/core_types.html)
- **시그널 반환값:** Godot 4.7.2의 `Object::emit_signalp`는 등록된 시그널이어도 해당 인스턴스에 연결 기록이 없으면 `ERR_UNAVAILABLE`, `set_block_signals(true)` 상태이면 `ERR_CANT_ACQUIRE_RESOURCE`를 반환합니다. 따라서 setter에서 `emit_signal(...) != OK`를 무조건 오류로 처리하면 정상적인 장면 초기화도 실패로 보고합니다. 상태·표시는 먼저 갱신하고, 알림이 선택적인 계약에서는 `!is_blocking_signals() && has_connections(signalName)`일 때 발행하며 실제 발행 오류는 별도로 처리합니다. `has_connections`는 시그널 존재도 검사하므로 오타를 정상 무수신 상태로 취급하지 않습니다. 미연결·연결·차단/해제·연결 해제 상태에서 값과 알림을 함께 검증합니다. [고정 엔진의 반환 경로](https://github.com/godotengine/godot/blob/ed1daf0bf001b61586d9930840f2f1394092c079/core/object/object.cpp#L1185-L1211), [has_connections 검증](https://github.com/godotengine/godot/blob/ed1daf0bf001b61586d9930840f2f1394092c079/core/object/object.cpp#L1613-L1630). 확인일: 2026-09-27.
- **동기 시그널 재진입:** `hide()`·`show()`·포커스 이동도 연결된 사용자 콜백을 실행할 수 있습니다. 전환 도중 컨테이너 원소 포인터를 유지한 채 콜백이 `vector::push_back`을 실행하면 `ObjectID`를 사용해도 컨테이너 포인터의 무효화를 막지 못합니다. 등록·열기·닫기의 전환 구간 전체에서 중첩 변경을 거부하거나 명시적으로 직렬화하고, 사용자 콜백 뒤 Node는 ID로 다시 확인합니다. 가드가 숨김/삭제 알림을 억제했다면 가드 해제 시 유효성·표시·배경 입력·포커스 상태를 조정합니다.
- **완료 알림과 작업 결과:** 전환 결과를 안정 상태 알림 전에 저장합니다. 실패 정리의 알림에서 사용자가 다른 창을 열 수 있으므로 알림 이후의 현재 창을 실패한 호출의 대상으로 간주해 다시 닫지 않습니다. 이미 열린 창 재포커스, 등록 중 콜백, 열기 실패 후 다른 창 연결까지 검증합니다. Godot 4.7.2의 실제 UI 객체로 중첩 표시 전환, 포커스 콜백 숨김, 해제와 연속 다이얼로그를 재현·회귀 검증했습니다.
- Inspector hint는 편집 UI 정보이며 입력 검증이나 서버 권한 검증을 대체하지 않습니다. 도메인 제약은 실제 setter/명령 처리 경계에 둡니다.

## Scene 생명주기와 소유권

| 대상 | 사실과 적용 지침 |
|---|---|
| 생성자 | 내부 값·순수 자원 초기화에 사용합니다. 자식 Node 탐색이나 tree 의존 처리는 `_ready` 등 적절한 단계로 옮깁니다. |
| `_enter_tree` | 부모가 자식보다 먼저 호출됩니다. 다시 tree에 들어오면 재호출될 수 있는 연결·초기화를 고려합니다. |
| `_ready` | 자식이 부모보다 먼저 호출됩니다. 제거 후 재추가만으로 재호출되지 않으며 필요하면 재진입 전에 `request_ready()`를 사용합니다. 풀링 객체 재설정을 `_ready` 재호출에 무조건 의존하지 않습니다. |
| `_exit_tree` | 자식이 나간 뒤 부모가 호출됩니다. tree에 묶인 작업 취소·연결 정리를 수행하되 이것을 반드시 소멸했다는 뜻으로 취급하지 않습니다. |
| `Node` | `memnew`로 생성하고 부모 아래에 연결하면 부모 해제 시 자식도 해제됩니다. 런타임 제거는 보통 `queue_free()`로 프레임 종료에 예약합니다. `remove_child()`만으로 메모리가 해제되지 않습니다. |
| `RefCounted`·`Resource` | `Ref<T>`로 소유하며 마지막 강한 참조가 사라지면 해제됩니다. `Ref<T> resource; resource.instantiate();` 패턴을 사용할 수 있습니다. `memdelete`/`free`/`queue_free`로 수동 파괴하지 않습니다. 강한 참조 순환은 자동 수거되지 않습니다. |
| 일반 `Object` | RefCounted가 아니면 자동 참조 카운트가 없습니다. 소유자가 `memnew`/`memdelete` 등 Godot 수명 규칙에 따라 한 번 해제하며 borrowed pointer에는 해제 책임이 없습니다. |

근거: [Node 생명주기](https://docs.godotengine.org/en/4.7/classes/class_node.html), [queue_free/remove_child](https://docs.godotengine.org/en/4.7/classes/class_node.html#class-node-method-queue-free), [C++ Object 소유권](https://docs.godotengine.org/en/4.7/engine_details/architecture/object_class.html#object-ownership-and-casting), [RefCounted 순환 참조](https://docs.godotengine.org/en/4.7/classes/class_refcounted.html).

- 부모-자식 메모리 수명과 `Node.owner`를 구분합니다. `owner`는 주로 PackedScene에 저장할 Node 범위를 정합니다. 에디터 도구가 생성한 자식을 scene에 저장하려면 `add_child()`뿐 아니라 적절한 조상 owner 설정이 필요합니다. 트리 밖 편집 후보의 Undo/Redo에서는 분리된 subtree가 이전 owner를 유지할 수 있으므로 떼기 전에 owner를 비우고 다시 붙인 뒤 복구합니다. 실제 저장·재로드와 연속 undo/redo에서 소유권 경고와 누수를 확인합니다. [owner 계약](https://docs.godotengine.org/en/4.7/classes/class_node.html#class-node-property-owner)
- **저장 전 편집 상태의 복제:** GDScript·godot-cpp 바인딩의 [`Node.duplicate()`](https://docs.godotengine.org/en/4.7/classes/class_node.html#class-node-method-duplicate) 기본 flags 15에는 `DUPLICATE_USE_INSTANTIATION`이 포함됩니다. `scene_file_path`가 있는 저장 장면 루트·하위 장면 인스턴스는 저장된 PackedScene을 다시 instantiate하며 그 장면이 소유한 자식에는 저장본이 사용됩니다. 엔진 모듈의 C++ [`Node::duplicate()` 기본 인자](https://github.com/godotengine/godot/blob/ed1daf0bf001b61586d9930840f2f1394092c079/scene/main/node.h#L732)는 signals/groups/scripts 조합 7이므로 호출 경로를 구분합니다. 현재 편집 메모리의 추가·삭제를 보존해야 하는 후보/Undo 복제에는 필요한 flags를 명시하고 `DUPLICATE_USE_INSTANTIATION`을 제외합니다. 실제 저장 장면을 연 뒤 자식을 추가·삭제하고 연속 적용·Undo/Redo·재저장까지 대조합니다. `owner` 설정과 복제 정책은 별도 계약입니다.
- **트리 밖 후보의 좌표:** 분리된 Node2D 후보를 검증할 때 이미 읽은 `global_transform`/`global_position`의 캐시가 조상 편집 뒤 갱신된다고 가정하지 않습니다. 공통 작성 루트 기준 좌표는 [`get_relative_transform_to_parent()`](https://docs.godotengine.org/en/4.7/classes/class_node2d.html#class-node2d-method-get-relative-transform-to-parent) 등 현재 local transform의 합성으로 계산하고, `top_level`·다른 Canvas 경계를 명시적으로 처리합니다. 최초 export → 분리된 조상 이동 → 재export → PackedScene round-trip에서 판정 위치·표시 위치·canonical이 함께 변하는지 검사합니다.
- **부분 생성의 보호 hash:** 파일/노드 identity와 의미 없는 자식 방문 순서·에디터 전용 metadata를 분리합니다. 저장된 기준선과 비교하는 hash 규칙이 바뀌면 버전을 올리고 기존 장면을 조용히 새 기준선으로 덮지 않습니다. 선택하지 않은 수동 편집·잠금, 전역 공유 리소스, 경계 연결을 검사한 뒤 변경할 부분만 적용하며 디스크 게시와 메모리 Undo를 구분합니다.
- **보호 hash의 크기·소유 경계:** 반복 metadata가 많은 장면 전체를 하나의 중첩 Variant로 직렬화하지 않습니다. 각 subtree를 typed array로 해시하고 부모에 자식 digest를 순서대로 넣어 직렬화 크기를 제한합니다. 문자열 단순 연결이나 의미 있는 자식 순서의 임의 정렬은 피합니다. 엔진 [`encode_variant`](https://github.com/godotengine/godot/blob/ed1daf0bf001b61586d9930840f2f1394092c079/core/io/marshalls.h)의 길이 인자는 `int`이므로 지원하는 최대 작성 크기로 실제 저장 경로를 검증합니다. 공용 TileSet 전체의 정체성과 unit이 사용한 source 목록을 구분하며, unit 셀의 source 소비가 전역 보호 hash를 바꾸지 않게 합니다. 규칙 변경 시 기준선 버전을 올리고, 중첩 속성 편집·순서 변경·선택하지 않은 unit 보존·정확한 원상복구를 검사합니다.
- **숫자 metadata의 저장 정밀도:** JSON 숫자를 그대로 text Resource에 넣으면 정수 식별자가 FLOAT로 저장되거나 float32 shortest 출력 때문에 round-trip 값과 raw Variant hash가 달라질 수 있습니다. 검증된 정수 ID/seed는 int로 저장하고, 재생성에 필요한 소수 설정은 full-precision JSON 같은 손실 없는 정본을 한 곳에 둡니다. 설정을 실제 생성기로 넘기는 JSON 쓰기까지 full precision을 유지합니다. 보호 hash는 설치 엔진 writer의 정규화와 일치시키되 이를 seed/충돌 좌표 손실을 숨기는 수단으로 쓰지 않습니다. 큰 uint32·float32-exact 값·일반 float64를 실제 pack/save/reload와 부분 재생성 경로에서 검증하고 hash 의미가 바뀌면 버전을 올립니다.
- **정규형과 런타임의 decode 정밀도:** 같은 정수 mm 바이트라도 한 경로는 float 연산으로, 다른 경로는 double 연산으로 m를 복원하면 exact 비교가 실패할 수 있습니다. 판정 정본의 decode 타입/나눗셈 정밀도를 통일하거나 정규형 정수 바이트를 비교하며 epsilon 확대나 검증 생략으로 숨기지 않습니다. 2진수로 정확히 표현되지 않는 합법 소수 경계를 실제 게시→런타임 로드 경로까지 검사합니다.
- **반복 표시 데이터의 자원 수락:** READY·정상 종료는 장면 크기·메모리 수락을 뜻하지 않습니다. 작은 crop마다 Node와 동일 출처 Dictionary를 복제하면 큰 맵에서 직렬화·메모리가 폭증하므로, 같은 판정/그리기 계약을 유지하는 TileMapLayer·공유 atlas 등으로 묶고 최대 작성 입력의 저장 크기·프로세스 피크를 실제로 측정합니다. 구매 원본은 보존하고 crop 합성본은 선택 영역 RGBA 일치·영역 밖 투명·별도 hash로 증명합니다. 선언 crop만 믿지 말고 실제 표시 alpha의 포함 관계를 검사하며, import alpha-border 처리·선형 필터·픽셀 정렬에 따른 화면 차이도 확인합니다. 공통 엔진/아트 비용과 변경한 표현의 비용, Windows debug 결과와 모바일/release 수락은 구분합니다.
- Godot Object를 일반 `delete`나 기본 deleter의 `std::unique_ptr`로 감싸지 않습니다. 순수 C++ 비엔진 자원에는 RAII를 적용합니다.
- `memnew`는 매크로이며 `memnew(MyNode)`처럼 사용합니다. 네임스페이스 함수로 오해해 `godot::memnew(MyNode)`로 쓰지 않습니다. [고정한 바인딩의 memory.hpp](https://github.com/godotengine/godot-cpp/blob/507ed9d840c01a3c5b2a39af8bb4000bfac30bf5/include/godot_cpp/core/memory.hpp)
- 장기 보관하는 비소유 Object 참조는 `ObjectID`를 저장하고 사용 시 `ObjectDB::get_instance` 등으로 다시 확인합니다. ID 조회는 스레드 간 생존을 보장하는 잠금이 아닙니다. 해제된 raw pointer에 메서드를 호출하여 유효성을 검사하지 않습니다. deferred 결과에도 대상의 생존·현재 scene/session generation을 확인합니다.

## UI 재사용과 표시 경계

- 공통 UI에는 레이아웃·포커스·모달·표시용 쿨다운·테마 계약만 둡니다. 게임 어댑터가 캐릭터·아이템·퀘스트 데이터와 요청을 소유하며 공통 모듈이 게임별 클래스나 `res://` 경로를 참조하지 않게 합니다. 클릭 요청과 서버가 수락한 쿨다운/피해/보상은 별도 계약입니다.
- 반응형 UI는 논리 viewport와 실제 창 크기를 구분하고 anchor/container를 사용합니다. 플랫폼의 물리 안전 영역은 화면 transform의 역변환으로 UI 좌표에 적용하며 키보드 회피·입력 초점은 호스트 화면에서 검증합니다. Windows의 터치 에뮬레이션·가상 inset 검사를 실제 Android/iOS 노치·DPI·키보드·패키지 검증으로 표현하지 않습니다.
- 여러 입력 장치를 지원할 때 장치 이벤트는 어댑터에서 방향·목적지 같은 게임 의도로 변환합니다. 직접 조작/경로 추종의 우선순위와 해제·취소를 명시하고, 비활성 입력원의 중립값이 다른 활성 이동 모드를 취소하지 않게 합니다. 화면 방향·포인터 좌표를 월드 좌표로 변환해도 입력 세기·최대 속도·충돌 규칙을 보존합니다.
- 터치 포인터는 시작 영역의 UI/조이스틱/월드 소유권을 release/cancel까지 유지합니다. [InputEventScreenTouch](https://docs.godotengine.org/en/4.7/classes/class_inputeventscreentouch.html)의 `index`는 손가락을 구분하고 `canceled`는 해당 터치의 취소를 알립니다. 개별 cancel은 해당 index의 소유권·동작만 정리하고 다른 손가락의 조작을 중단하지 않습니다. UI에서 시작한 드래그가 월드 명령으로 새지 않게 하며, 포커스 상실·앱 비활성화·장면 전환의 전역 입력 정리와 개별 터치 취소를 구분합니다.
- 일반 `Button`의 터치→mouse 변환은 다중 터치 gameplay 버튼의 대체가 아닙니다. [TouchScreenButton](https://docs.godotengine.org/en/4.7/classes/class_touchscreenbutton.html)은 다중 터치를 지원하지만 `Node2D`라 Control anchor가 없습니다. 실제 UI 배치·동시 입력 요구에 맞는 연결부를 선택하고 원본 터치와 합성 mouse가 동일 동작을 중복 실행하지 않게 합니다. 중복 방지만을 이유로 기존 UI를 깨뜨리는 전역 에뮬레이션 설정 변경을 하지 않습니다.
- **수동 터치와 native GUI를 함께 사용할 때:** Godot 4.7.2는 합성 mouse를 원본 touch보다 먼저 전달하므로 원본 touch만 소비해서는 native Button의 중복 클릭을 막지 못합니다. 직접 소유하는 제스처의 합성 press/motion/release도 GUI 이전에 차단하며 소유권을 위치 변화·모달 전환과 독립적으로 유지합니다. 텍스트 컨트롤은 내부 스크롤바 같은 자손까지 native 경로로 남겨야 합니다. 근거: [고정 엔진 Input](https://github.com/godotengine/godot/blob/ed1daf0bf/core/input/input.cpp), [RichTextLabel 내부 스크롤바](https://github.com/godotengine/godot/blob/ed1daf0bf/scene/gui/rich_text_label.cpp).
- **눌림과 포커스 복귀:** [BaseButton의 `set_pressed_no_signal`](https://github.com/godotengine/godot/blob/ed1daf0bf/scene/gui/base_button.cpp)은 toggle mode가 아니면 눌림 상태를 바꾸지 않습니다. 수동 터치 버튼은 실제 보이는 feedback과 release/cancel 복구를 별도로 검증합니다. 포커스 차단으로 입력을 비울 때 앱 밖에서 key release를 놓칠 수 있으므로 복귀한 각 키의 새 non-echo press를 인정하고, 하나의 새 키로 다른 held key를 재활성화하지 않습니다.
- **완전한 native 제스처 검증:** [Windows backend](https://github.com/godotengine/godot/blob/ed1daf0bf/platform/windows/display_server_windows.cpp)는 휠에도 press 뒤 release를 전달합니다. 스모크가 press만 주입하면 [Viewport의 mouse focus mask](https://github.com/godotengine/godot/blob/ed1daf0bf/scene/main/viewport.cpp)가 남아 다른 버튼 클릭까지 실패할 수 있습니다. 이 검증기 결함을 제품의 좌표 보정으로 해결하지 않습니다. 실제 OS 입력과 같은 이벤트 쌍·순서로 확인합니다.
- **Canvas·지도 영역:** Control을 CanvasLayer 아래로 옮길 때 offset-only 레이아웃 override가 full-rect HUD를 0×0으로 만들지 않는지 실제 viewport rect와 대조합니다. 자식끼리의 중앙 정렬만으로는 화면 밖 UI를 잡지 못합니다. 지도 마커의 좌표도 TextureRect의 실제 aspect-fit/covered 표시 사각형과 일치시킵니다. 최소 변으로 fit한 마커를 큰 변으로 확대·crop하는 covered 텍스처 위에 올리지 않습니다.
- **2D 시야와 이동감:** 직교 2D 카메라의 배율 `z`에서 고정 viewport의 표시 길이는 `1/z`, 평면 면적은 `1/z²`에 비례합니다. 물리 해상도·논리 viewport·카메라 배율·월드 단위를 구분하고, 아이소메트릭 투영의 방향별 화면 속도와 추적 카메라 지연을 함께 계산합니다. 화면비 확장으로 한 축의 시야가 늘어나는 경로도 검사합니다. 사용자 줌과 viewport 보정 후 실제 줌이 다르면 resize·카메라 경계·포인터 변환이 실제 값을 사용해야 합니다. 축별 최대 범위를 제한하는 정책은 동일 구도나 모든 화면비의 쾌적함을 보장하지 않습니다.
- **동일 유형의 비교 근거:** 2D 아이소메트릭 조작을 조사할 때 원작의 스프라이트 클라이언트와 3D 리마스터, 월드 줌과 미니맵 줌, 픽셀 업스케일과 추가 월드 노출을 구분합니다. [2D 이동 표적 연구](https://opendl.ifip-tc6.org/db/conf/interact/interact2011-2/HajriFMI11.pdf)는 선형 궤적·마우스에서 크기/속도가 선택 난도에 미치는 근거이며, [터치 throughput 연구](https://www.yorku.ca/mack/hcii2015a.html)는 정적 표적의 속도·정확도 평가입니다. 이 수치나 VR 광학 흐름의 gain을 캐릭터 단위/s·최적 줌·모든 사용자의 반응 한계로 대입하지 않습니다. 사례의 출시/개발 상태와 연구의 적용 한계를 밝힙니다.
- **이동 애니메이션:** 게임 속도를 바꾸면 실제 변위 속도와 클립의 재생률을 함께 확인합니다. 같은 방향/클립이라는 이유로 일찍 반환하면 아날로그 강도 변경을 놓칠 수 있습니다. 걷기 재생률은 해당 상태의 속도로 갱신하되 대기는 별도로 복원하고, 설정한 재생률을 렌더링 FPS나 발 미끄러짐 제거의 실측값으로 표현하지 않습니다.
- **clip 전환의 발 위치:** 방향별 pivot을 여러 clip이 공유하면 게임이 실제로 잇는 경계 frame(대기↔공격 첫 frame, 공격 마지막 frame↔대기)을 시트에서 정합해 이동량을 잽니다. 시트에 구워진 반투명 그림자가 하체 영역을 대부분 차지할 수 있으므로 불투명 인물 픽셀만 남긴 mask로도 측정하고, 같은 mask에 합성 이동을 넣어 찾아내는지 양성 대조를 둡니다. 정합 결과가 탐색 범위 끝에 걸리면 이동량이 아니라 측정 실패로 보고 제외합니다. alpha 경계 하단만으로 pivot을 산출하면 무기·궤적·그림자가 섞이고, frame마다 자기 경계로 잡은 하체 중심은 보폭 자세와 pivot 차이를 구분하지 못하므로 걷기↔대기 정합의 근거가 아닙니다. 경계 frame의 정합은 해부학적 발 좌표 측정이 아니므로 확인한 경계와 측정하지 않은 전환을 함께 적습니다.
- **구매 스프라이트·타일 팩 검수:** 반입 전에 시트의 방향 행 순서·열과 개별 frame의 대응·그림자 포함 여부를 개별 frame과 픽셀 대조로 확인합니다. 인물은 frame의 일부만 차지하므로 frame 전체의 평균 차이는 다른 인물의 동작이 복제된 결함도 통과시킬 수 있습니다. 채널별 임계를 넘는 화소 수로 판정합니다. 서로 다른 배우·동작 사이의 바이트 동일 파일(SHA-256), 폴더명과 파일명 접두의 불일치, 빈 변형 폴더는 제작 결함 후보이므로 화면으로 확인하고 대체 동작을 기록합니다. 판매 페이지의 타일 크기·PPU·피벗은 바닥 윗면의 실제 alpha 경계와 대조하며, 페이지마다 명시 범위가 다르면 출처별로 구분합니다. 명시되지 않은 캐릭터 배율·frame 속도를 추정값으로 채우지 않습니다. 목록 문서의 수량·범위·크기 주장은 원본을 다시 세는 검사로 대조하고, 일부러 틀린 문서 사본에서 그 검사가 실패하는지 확인합니다. 80px 안팎의 contact sheet 썸네일로 붙인 내용 라벨은 확대 확인에서 다수 틀렸으므로, 검색에 쓰일 라벨(쓰레기통·발전기·차량·문/창 등)부터 원본 크기 이상으로 확대해 확인하고 나머지는 근사 판정 표시와 시각 색인 링크로 둡니다.
- **에셋의 AI 사용 권리:** 게임에 넣을 권리와 AI 참조 입력·학습(LoRA 포함)·생성물 판매·도구/모델 배포 권리는 분리해 확인합니다. 실제 취득 채널과 적용 라이선스가 기준입니다. Unity Asset Store로 취득한 경우 [AS Terms 3.8(v)·EULA 2.2.1.1(g)](https://unity.com/legal/as-terms)(본문 개정 2024-12-04, 확인 2026-10-02)는 `Provider and/or Unity`의 명시적 동의 없는 AI/ML 학습·데이터셋·모델 입력 사용을 제한하므로, 로컬 추론이나 API 제공자의 학습 미사용 약속을 동의의 대체물로 보지 않습니다. 다른 판매 채널의 자기 프로젝트용 수정 허가나 제작 당시 `No AI` 표시만으로 AI 사용·재배포 허가를 추정하지 않습니다. 외부 서비스의 입력 권리 보증·보관·자체 학습·재판매·벤치마킹·경쟁 제품/모델 개발 제한도 해당 계약에서 확인합니다. 출력물 소유권은 다른 모델의 학습에 쓸 권리를 자동 보장하지 않으며, 약관 조사는 에이전트의 업로드·학습·유료 호출에 대한 사용자 승인이 아닙니다.
- **타일 연결 계약:** 같은 `Ground` 번호군을 무작위 장식 변형으로 가정하지 않습니다. 풀·흙의 전이 조각은 네 변·모서리의 재질을 측정해 이웃 마스크와 연결하고, 흙 내부도 전이 조각의 흙색과 맞는 원형으로 채웁니다. 방향 접미사가 같은 벽·문·간판도 모듈 번호마다 차지하는 면이 다를 수 있으므로 원본과 조립 결과를 함께 확인합니다. 평탄 포장·들린 블록·판석을 작은 썸네일이나 카탈로그 이름만으로 같은 보도라고 판정하지 않습니다. 제작자 조립 예시 → 같은 배율의 원본 패치 → 실제 엔진 창의 발·그림자·가림·이음새를 순서대로 대조합니다. 지면만 높여 연석을 흉내 내면 별도 높이 계약이 없는 actor·지면 효과가 묻히므로 표시 높이를 임의로 바꾸지 않습니다.
- **투명 조립의 하부 재질:** 문틀·창·판자 틈이 투명한 원본은 벽/지붕만 조립하면 외부 지면이 실내처럼 비칩니다. 실제 예제의 바닥·벽·지붕·소품 관계를 함께 읽고, 하부 재질을 채울 때 기존 충돌·높이·원본 픽셀은 보존합니다. source hash와 외곽선 검사만으로 배경 재질까지 맞다고 판단하지 않고 투명 개구부를 실제 엔진 화면에서 확인합니다.
- **표시 범위와 물리 footprint:** 간판·수관처럼 그림이 이웃 셀까지 뻗는 소품은 실제 표시 범위로 strip 분할·그림 보존·인접 벽/셀의 가림을 판단하고, 물리 footprint는 별도로 유지합니다. 표시 범위를 차단 소품의 앞뒤 정렬 키로 일반화하지 않습니다. 차단 소품은 아래 「정밀 충돌 뒤의 앞뒤 정렬」의 열별 충돌 앞면을, 비차단 장식은 검토한 표시 범위의 앞 경계를 사용합니다. 이미지 합성/원본 RGBA 일치만으로 엔진 정렬을 인증하지 않고, 실제 배우의 앞/뒤 보행과 부착 부모의 가림·이동·저장 결과를 확인합니다.
- **정밀 지면 형상과 경로 격자:** 배치 셀·수관·그림자를 물리 충돌로 복사하지 않습니다. 기둥/줄기/발밑은 원, 차량/벤치/얇은 펜스는 방향별 지면 사각형처럼 원본 근거의 형상을 사용하며 가려진 접점의 근사치를 표시합니다. exporter·native canonical·실제 판정 파일의 변환된 geometry를 대조하고 권위/예측/에디터 표시가 이를 함께 소비하게 합니다. index는 점검할 경계 셀을 빠뜨리지 않게 겹친 셀에 구축하고 실제 공간 조회 전에 준비합니다. 셀 중심이 막혀도 셀 안의 다른 지점은 비어 있을 수 있으므로 경로의 시작/끝 접속과 validator를 함께 고치며, 충돌 정밀도와 경로 탐색의 공간 해상도·완전성은 구분합니다.
- **정밀 충돌 뒤의 앞뒤 정렬:** 충돌을 배치 셀보다 좁은 원·사각형으로 바꾸면 배우가 같은 표시 셀 안, 물체 앞에 설 수 있습니다. 차단 소품 strip을 표시 footprint의 앞 경계로 y-sort하면 앞에 선 배우 위에 물체가 그려지므로, 아래(화면 앞)에서 접근할 때의 겹침을 충돌 확대만으로 고치지 않습니다. 각 strip 열을 지나는 실제 충돌 형상의 앞면으로 정렬하고, 그 열을 지나는 형상이 없으면 가장 가까운 형상을 쓰되 동률은 뒤쪽을 택합니다. 비차단 장식은 기존 표시 범위를 유지합니다. 셀 중심 하나로 정렬하는 TileMapLayer 칸은 얇거나 중심에서 먼 형상의 앞뒤를 동시에 맞출 수 없으므로, 그런 형상은 열별 정렬이 가능한 소품으로 두거나 제한을 기록합니다. 검증은 strip 중앙만이 아니라 전체 폭을 샘플링하고, 이전 맵에서 겹침을 재현한 뒤 실제 창에서 물체 앞·뒤에 접촉한 배우의 그리기 순서를 확인합니다.
- **원본 픽셀 겹침과 실제 가림:** 배우와 오브젝트의 alpha mask 교집합은 두 그림이 같은 화면 위치를 차지한다는 측정이지 잘못된 앞뒤 정렬의 증거가 아닙니다. 실제 권위 접촉 위치·tile/strip의 정렬 키·앞/뒤 접근 화면을 함께 확인한 뒤 결함을 분류합니다. 정상적인 뒤쪽 가지 가림까지 없애려고 줄기 충돌을 수관 크기로 넓히거나 에셋을 제외하지 않습니다. 셀 정렬로 지원할 수 없는 정밀 tile은 exporter가 위치를 설명하며 거부하거나 명시적인 편집 변환을 제공하고, 두 방식의 편집 의미 차이는 사용자와 정합니다. export 거부가 저장된 수동 셀을 조용히 지우거나 변환해서는 안 됩니다.
- **생성 유형의 구조 분리:** 도시 도로망을 유지한 채 바닥 재질만 바꾸는 것은 숲 생성이 아닙니다. 유형별 연결·배치 규칙을 분리하고 길과 공터 같은 독립 선택을 강제로 결합하지 않습니다. 편집용 unit 경계가 화면의 빈 격자로 드러나지 않는지 실제 전경/근접 화면을 확인합니다. 밀도가 높아져도 통행을 보존할 배치 제약을 두고 최대 입력은 공통 native 판정으로 검증합니다.
- **포장·도로·허브의 역할 검증:** 포장 내부, 방향별 연석, 코너는 서로 다른 조립 역할입니다. 한 타일로 전부 통일하거나 연석을 무작위 마모 변형으로 섞지 않습니다. 짝수 칸 도로의 중심은 두 셀 사이에 있으므로 `min + width/2`와 실제 페인트 중심을 대조합니다. 입체 바닥 타일을 노면선 overlay로 올리면 원본 측면까지 도로 위에 그려질 수 있어, 원본 영역을 보존하는 명시적 crop과 실제 엔진의 앞뒤 그리기를 확인합니다. 생활 허브의 ‘중앙’은 전체 지도 좌표만으로 충족되지 않습니다. 기본 카메라·HUD를 유지한 첫 입장 화면에 첫 시설/입구/NPC가 보이고 실제 접근·출발·귀환 경로가 연결되는지 확인합니다.
- **구매 팩의 표시 배율:** 제작자가 타일·캐릭터·소품을 같은 PPU로 만든 팩은 모든 아트를 같은 배율(원본 1배)로 표시하고, 작은 캐릭터의 가독성은 카메라 줌으로 해결합니다. 캐릭터만 키우면 차량·문·벽·소품과의 상대 비율이 깨집니다. 판단 전에 제작자 소개 화면의 조립 예시에서 배우와 소품의 비율을 확인합니다. 이동 속도는 월드 단위값을 그대로 옮기지 말고 **화면상 몸 길이/초**로 다시 확인합니다. 그림 속 사람 키가 격자 1칸보다 작으면 같은 m/s도 달리기처럼 보입니다. 배율·줌·속도를 바꾸면 걷기 stride·picking 영역·라벨 간격·효과 부착 위치를 그 배율에서 다시 측정하고, 월드 이름표·HP 막대처럼 줌과 무관해야 하는 표시는 `1/userZoom`으로 역배율합니다.
- **TileMapLayer 아이소메트릭 원점:** Godot 4.7.2의 변형 없는 타일 그리기 시작점은 셀 위치 기준 `−texture_size/2 − texture_origin`입니다([고정 소스](https://github.com/godotengine/godot/blob/ed1daf0bf001b61586d9930840f2f1394092c079/scene/2d/tile_map_layer.cpp#L2768-L2769)). 원본에서 셀 중심에 맞출 지면 기준 픽셀이 좌상단 기준 `anchor`라면 `texture_origin = anchor − texture_size/2`로 계산합니다. 양수 y는 그림을 위로 올리며 특정 팩의 origin 값을 같은 이미지 크기의 다른 타일에 일반화하지 않습니다. transpose/flip을 쓰면 해당 변형 경로도 대조합니다. 128×64 `DIAMOND_DOWN` 배치에서 `map_to_local(0,0)`은 `(64,32)`로 실측되었으므로, 공유 투영 `screen=(64(x−y),32(x+y))`와 맞추려면 모든 층에 같은 이동량을 한 번 적용하고 parity별 보정을 덧붙이지 않습니다. 다중 셀 건물·차량은 단일 anchor로 y-sort하지 말고 셀별 모듈이나 좁은 strip으로 나눠 정렬합니다.
- **부분 가림 마스크의 정렬 깊이:** Godot 4.7.2 y-sorted `TileMapLayer`는 같은 정렬 Y의 셀을 quadrant CanvasItem으로 묶고 그 원점을 `MODEL_MATRIX`에 전달합니다. X/셀 ID는 공유될 수 있지만 정렬 Y만 필요한 셰이더에서는 이 값을 사용할 수 있습니다. `texture_origin`으로 올라간 그림 픽셀 Y와 지면 정렬 Y를 혼동하지 않습니다. 배우와 물체를 같은 정렬 공간으로 변환하고, 엔진의 근사 동률·삽입 순서를 고려하여 뒤쪽 물체에 구멍이 생기지 않는지 실제 GPU 픽셀로 검사합니다. [고정 TileMapLayer](https://github.com/godotengine/godot/blob/ed1daf0bf001b61586d9930840f2f1394092c079/scene/2d/tile_map_layer.cpp), [정렬 비교](https://github.com/godotengine/godot/blob/ed1daf0bf001b61586d9930840f2f1394092c079/servers/rendering/renderer_canvas_cull.h).
- **Compatibility 데이터 텍스처의 실제 형식:** 같은 Compatibility라도 desktop GL과 GLES의 확장 지원은 다릅니다. 고정 4.7.2 GLES3 경로는 float-linear 지원이 없으면 RF/RGBAF를 half-float로 변환할 수 있으므로, 큰 좌표·정렬 깊이를 손실 없이 보존해야 하는 데이터에 요청 형식만 믿지 않습니다. RGBA8 바이트 인코딩을 사용한다면 색공간 변환·필터링을 끄고 binary32 복원을 실제 셰이더에서 검증합니다. `Image::set_pixel`의 RGBA8 저장은 채널×255를 절삭하므로 단순 `/255`의 반올림 경계를 확인하며, raw byte 또는 검증한 정확한 인코딩을 사용합니다. [고정 GLES3 변환](https://github.com/godotengine/godot/blob/ed1daf0bf001b61586d9930840f2f1394092c079/drivers/gles3/storage/texture_storage.cpp), [Image 채널 저장](https://github.com/godotengine/godot/blob/ed1daf0bf001b61586d9930840f2f1394092c079/core/io/image.cpp). Windows 검사는 실제 모바일 GPU/패키지 검증을 대신하지 않습니다.
- **표시 검사와 라이브 시계 분리:** 애니메이션 검증에서 주입한 미래 표시 시각을 실제 세션의 단조 렌더 시계로 그대로 되돌리지 않습니다. 라이브 경로를 재개할 검사는 새 장면으로 분리하거나 원래 시계를 변경하지 않는 관찰을 사용합니다. 에러 로그가 있는데 실패한 단언이 0개라는 이유로 성공 처리하지 않습니다.
- **고정 표시 프로필과 동적 실루엣:** 방향·애니메이션에 따라 흔들리지 않아야 하는 가림/선택 보조 표시를 요청받았다면 현재 frame의 alpha bounds로 반경·중심을 재계산하지 않습니다. 고정은 모든 모델에 같은 값이라는 뜻이 아니므로 각 원형의 불변 기준 크기·anchor로 프로필을 정하고 현재 포즈와 분리합니다. 같은 원형의 여러 방향/클립에서 실제 표시 픽셀이 일정한지와, 다른 기준 크기의 원형은 다른 프로필을 쓰는지를 별도 검사합니다. 현재 실루엣을 따라야 하는 윤곽선 효과에는 이 정책을 강제하지 않습니다.
- **렌더 직전 콜백의 스레드 근거:** 고정 4.7.2의 `RenderingServerDefault::draw`는 메인 스레드 여부를 검사한 뒤 `frame_pre_draw`를 발행합니다. 이어 `create_thread`가 참이면 별도 렌더 스레드의 `_draw`를 큐에 넣고, 거짓이면 메인 스레드에서 `_draw`를 직접 호출합니다. 함수 이름이나 별도 렌더 스레드 설정만으로 이 신호가 워커에서 나온다고 추정하지 않습니다. SceneTree를 읽는 콜백은 사용 엔진의 실제 발행 위치·수명·준비 상태를 확인합니다. [고정 RenderingServerDefault 소스](https://github.com/godotengine/godot/blob/ed1daf0bf001b61586d9930840f2f1394092c079/servers/rendering/rendering_server_default.cpp#L443-L453).
- **저속의 주기적 경로 재계획:** 목적지를 일정 주기로 다시 보내는 자동 이동(추적·자동 사냥)에서 새 경로가 항상 현재 칸의 중심으로 먼저 돌아가면, `속도 × 재계획 주기`가 중심까지 거리보다 짧을 때 같은 자리를 왕복합니다. 속도를 낮추는 변경 뒤에 드러나므로 반복 재계획 회귀를 둡니다. 다음 지점으로 바로 가는 구간이 충돌 검사(`CanTraverse` 등)로 안전할 때만 시작 칸 중심을 건너뛰고, 막힌 모서리 옆의 음성 사례(중심 유지·매 tick 점유 가능·정확한 도착)를 함께 고정합니다. 권위와 예측이 같은 함수를 쓰는지 확인하고 시간 제한을 늘려 증상을 숨기지 않습니다.
- **화면 안 공격 사거리:** “사거리가 카메라 밖으로 나가면 안 된다”는 요구는 화면 좌표 판정이 아니라 월드 사거리 상한으로 구현합니다. 선형 아이소메트릭 투영에서 월드 반경 r의 원은 화면에서 축 정렬 타원(예: `screen=(64(x−y),32(x+y))`이면 반축 `64√2·r × 32√2·r` canvas px)이므로, 상한은 **보정 후 실제 최대 줌과 지원 화면 범위의 최소 가시 반축**에 그 타원이 들어가는 값으로 정하고 카탈로그 상수와 카메라 상수를 컴파일 시 assert로 묶습니다. 화면비만으로 짧은 축이 줄어든다고 단정하지 않고 [stretch 정책](https://docs.godotengine.org/en/4.7/tutorials/rendering/multiple_resolutions.html)·실제 줌·창 크기를 함께 확인하며, 발 위치와 몸 전체·카메라 추적 지연의 여유도 구분합니다. 사거리를 줄이면 근접 몬스터의 공격 거리와의 간격이 줄어 교전 피해·이후 시나리오가 달라지므로 실제 교전으로 확인합니다.
- **자동 사냥의 대상 선택:** 수동 조준용 “정면 우선 + 현재 대상 유지” 규칙을 자동 사냥에 그대로 쓰면 뒤·옆의 바로 붙은 위협을 두고 먼 대상을 계속 공격합니다. 자동 사냥은 주기적으로 다시 찾아 플레이어에서 가장 가까운 후보를 고르고, 후보 범위의 중심(켠 위치 등 기준점)과 거리 기준(현재 플레이어)을 분리합니다. 두 기준이 같은 위치에 있는 테스트만으로는 서로 바뀐 회귀를 잡지 못하므로 둘이 떨어진 사례를 둡니다. 대상 없는 지면 공격처럼 클라이언트가 `origin + 방향 × range`로 만든 점을 권위의 엄격한 `distance > range` 경계에 정확히 두면 반올림으로 약 절반이 거부되므로 경계 안쪽으로 작은 여유를 둡니다.
- 표시 API가 허용하는 최대 길이와 화면에 들어가는 길이는 다릅니다. `Label`의 기본 minimum-size 동작으로 긴 이름이 고정 HUD 프레임 밖으로 확장될 수 있으므로 clipping/ellipsis 또는 의도적인 wrapping을 지정합니다. 숫자의 finite/range 검사만으로 수치 문자열의 렌더링 폭이 제한되지는 않습니다. 최대 허용 이름·큰 수치·Unicode에서 실제 화면 경계를 확인합니다.
- 중앙 정렬은 텍스트의 줄 높이·부모의 실제 영역과 함께 검증합니다. `MarginContainer` 같은 native container로 폰트 최소 크기를 전파하고, 배지·수치·제목마다 명시적인 영역을 둡니다. 이름처럼 한 줄인 필드는 `max_lines_visible=1`과 overflow 정책으로 줄바꿈 입력이 컨테이너를 무한히 키우지 않게 합니다. 숨긴 Container 자식은 표시 후 정렬되므로 실제로 창을 열고 layout을 기다린 상태에서 geometry를 검사합니다.
- 정렬 정책은 텍스트의 역할별로 정합니다. 짧은 버튼·상태 수치의 중앙 정렬을 채팅 같은 읽기 본문까지 일괄 적용하지 않습니다. 채팅 발신 주체는 표시 이름 비교가 아닌 신뢰할 수 있는 발생 경로/메타데이터로 구분하고 색과 명시적 표기를 함께 사용합니다. `RichTextLabel`은 신뢰하는 서식만 push/pop하고 사용자 문자열은 `add_text()`로 넣어 BBCode로 해석하지 않으며, 동일 이름·서식처럼 보이는 문자열·Unicode·길이/기록 상한을 검사합니다.
- [Button의 `alignment`](https://docs.godotengine.org/en/4.7/classes/class_button.html#class-button-property-alignment)는 텍스트용입니다. 아이콘 전용 버튼은 `icon_alignment`와 `vertical_icon_alignment`도 지정해야 합니다. 두 아이콘 축이 중앙이면 native text가 아이콘 위에 겹치므로 수량·캡션은 별도 영역으로 분리합니다. 텍스처 사각형의 중앙과 SVG/이미지 glyph의 alpha 경계 중앙도 구분하여 렌더링 픽셀로 확인합니다.
- 클릭 판정 검사는 표시용 viewport 논리 좌표·물리 창 좌표·OS 화면 좌표를 구분합니다. `Viewport.push_input(event, true)`로 버튼의 논리 중심만 주입하면 stretch/DPI/창 위치 변환과 실제 마우스 경계 오류를 놓칠 수 있습니다. 실제 OS 입력으로 중앙·안쪽 모서리·바깥쪽을 검사하고, hover/focus 스타일의 확장 여백·장식 부모의 mouse filter·숨김 자식 상태도 확인합니다. 엔진 종료 코드가 0이어도 script error가 있거나 전체 성공 표시가 없으면 통과가 아닙니다.
- OS 입력 검증기는 주입한 DOWN과 UP을 예외 안전한 정리 구간으로 묶습니다. 포커스·좌표 검증이 DOWN 뒤 실패해도 `finally`에서 포커스 검사 없이 해당 UP을 보내고, 실제 OS 눌림 상태와 게임의 release 수신을 관찰합니다. 이 보장은 일반 예외 경로에 한정하며 프로세스 강제 종료까지 보장한다고 주장하지 않습니다.
- 검증 창에 크기·위치를 강제한 성공을 사용자 실행 조건의 성공으로 확대하지 않습니다. 에디터 내장/분리 game view와 별도 창, DPI, 실제 game client 원점, viewport/final transform, OS 커서, native 입력과 `gui_input` 위치를 실패가 발생한 조건에서 대조합니다. 테스트 기대 좌표와 입력 좌표를 같은 transform으로 산출한 결과만으로 화면 정합성을 보증하지 않으며 OS가 실제 표시한 픽셀 경계도 독립 확인합니다. 재현 조건이 특정되지 않았다면 임의의 픽셀 보정이나 해결 선언을 하지 않습니다.
- UI 참고 자료는 출처의 공식 여부와 실제 화면 여부를 따로 판정합니다. 광고 합성·키아트·홍보 프레임에 삽입한 작은 게임 화면은 전체 플레이 HUD의 근거가 아닙니다. 직접 플레이 캡처의 판본·날짜·크롭/에뮬레이터 오버레이·원 저자 워터마크를 표시하고 지도/설명 도해는 보조자료로 구분합니다.
- 월드와 HUD의 시각적 정합성은 UI 단독 캡처가 아니라 목표 월드 배경 위에서 실제 HUD를 실행하여 판단합니다. 기본 상태뿐 아니라 채팅·추가 액션·모달을 열어 글자 크기, 배경 대비, 겹침, 서로 다른 아트 재질을 비교합니다. 공개 참고 스크린샷으로 만든 컨셉 확인과 정식 에셋 통합·실제 게임 기능을 분리해 표시합니다.
- 에디터 화면과 F5 양쪽에 필요한 미리보기는 별도 검증 러너에서만 적용하지 않습니다. [`editor` feature](https://docs.godotengine.org/en/4.7/tutorials/export/feature_tags.html)는 에디터 바이너리의 편집·게임 실행을 포함하지만 `Engine.is_editor_hint()`는 편집 문맥만 뜻합니다. 비배포 참고 자료는 리소스 루트 밖에서 읽고, 원래 저장 프로퍼티를 덮지 않는 owner 없는 표시 자식을 사용하면 [PackedScene의 소유권 기준](https://docs.godotengine.org/en/4.7/classes/class_node.html#class-node-property-owner)으로 저장에서 제외할 수 있습니다. 템플릿 실행을 명시적으로 제외하고 pack→instantiate에서 원본 참조 보존·임시 노드/이미지 부재를 검증합니다. 부모 텍스처 위에 aspect-fit 이미지를 덧그릴 때는 레터박스 영역에 원래 그림이 비치지 않도록 비저장 불투명 배경도 필요합니다.
- godot-cpp v10의 가상 입력 메서드에서 `Ref<InputEvent>`를 사용하는 클래스는 등록 번역 단위에서도 타입이 완전하도록 해당 헤더에 `input_event.hpp`를 포함합니다. 확인한 MSVC 조합에서는 `const String + "literal"`이 String/StringName 오버로드 사이에서 모호했으므로 필요한 문자열 피연산자를 `String("literal")`로 명시합니다. 이 원칙을 외부 ABI 이름 변경이나 전체 스타일 재작성으로 확대하지 않습니다.

## 물리·프레임·스레드 경계

**사실:** `_process(double delta)`는 표시 프레임에 따라 실행되고 `_physics_process(double delta)`는 설정된 물리 주기로 실행됩니다. 기본 물리 주기는 60Hz이지만 프로젝트 설정값을 기준으로 합니다. [Node processing](https://docs.godotengine.org/en/4.7/classes/class_node.html#description)

**구현 선택:** 물리 이동·충돌과 권위 시뮬레이션 갱신은 물리/서버 tick 경계에 두고, UI·카메라·시각 보간은 표시 경계에 둡니다. 같은 위치를 두 루프에서 경쟁 갱신하지 않습니다. delta의 단위·time scale·pause 정책을 명시하고 고정 tick만으로 여러 플랫폼의 물리가 결정적이라고 가정하지 않습니다. 공식 릴리스 정책도 Godot 물리 엔진을 결정적이라고 보장하지 않습니다. [호환성 정책](https://docs.godotengine.org/en/4.7/about/release_policy.html#what-are-the-criteria-for-compatibility-across-engine-versions)

- **활성 SceneTree는 thread-safe하지 않습니다.** 워커는 가능한 한 독립 데이터 계산을 수행하고 결과를 동기화된 큐로 전달하여 메인 스레드에서 적용합니다. `call_deferred`/`set_deferred`는 적용 시점을 옮기는 수단이지 공유 데이터와 대상 수명 문제를 자동 해결하지 않습니다.
- 트리에 붙지 않은 scene 조각을 워커에서 만드는 경우에도 공유 Resource·렌더링 Node·GPU 접근 제약이 남습니다. 여러 워커가 같은 Resource를 수정하지 않게 합니다. `Ref<T>`로 생존을 확보해도 그 객체의 동시 변경까지 안전해지는 것은 아닙니다.
- 서버 API는 각 API와 프로젝트 설정을 확인합니다. 특히 rendering/physics의 별도 스레드 설정을 보지 않고 “모든 서버 호출은 항상 안전하다”고 일반화하지 않습니다. 프레임워크의 process thread group을 도입할 때도 임의의 다른 Node 접근을 허용한 것으로 해석하지 않습니다.
- scene 종료·확장 unload에는 작업 취소/완료와 콜백 제거를 포함합니다. 메인 스레드가 join하면서 워커가 메인 스레드 처리를 기다리는 교착을 피합니다.

근거: [4.7 Thread-safe APIs](https://docs.godotengine.org/en/4.7/tutorials/performance/thread_safe_apis.html), 일반 동시성 정책은 [코딩 스타일](/coding-style.md)을 따릅니다.

## Resource·직렬화·성능·서버 권위

- **Resource 경계:** Resource는 경로별 캐시로 공유될 수 있습니다. 한 인스턴스의 변경이 다른 scene에 전파되어도 되는지 먼저 결정합니다. 인스턴스별 데이터에는 적절한 복제 또는 `resource_local_to_scene`을 적용하고 nested Resource까지 원하는 공유/복제 범위인지 확인합니다. 사용자 Resource의 변경 통지가 필요하면 setter에서 `emit_changed()`를 호출합니다. [Resource 계약](https://docs.godotengine.org/en/4.7/classes/class_resource.html)
- **저장 경계:** `ADD_PROPERTY`의 기본 usage에는 storage/editor가 포함되지만 임의 C++ 멤버가 모두 자동 저장되는 것은 아닙니다. `PROPERTY_USAGE_EDITOR`만 둔 값은 저장되지 않습니다. 저장할 의미 있는 값과 런타임 캐시·포인터·작업 상태를 분리하고 save→새 프로세스 load로 확인합니다. [property usage](https://docs.godotengine.org/en/4.7/engine_details/architecture/object_class.html#properties-set-get)
- **네트워크 경계:** scene/resource 파일과 엔진 객체 포인터를 곧바로 외부 프로토콜로 취급하지 않습니다. 명시적 메시지 타입·스키마 버전·길이/범위·entity generation을 검증합니다. 프로퍼티 노출은 네트워크 복제나 서버 권한 검증이 아닙니다.
- **성능 선택:** 먼저 CPU/GPU·메인 스레드·메모리·프레임/tick 지연을 실제 목표 기기에서 측정합니다. 핫패스에서 반복 Node 탐색, 문자열/Variant 변환, 작은 바인딩 호출, 불필요한 할당·복사를 줄입니다. `Packed*Array` 대량 접근은 `ptr()`/`ptrw()`로 경계 호출을 줄일 수 있으나 resize·copy-on-write 이후에도 포인터가 유효하다고 가정하지 않습니다. Variant를 거친 인자 수정이 호출자 배열에 그대로 반영된다고 가정하지 않습니다. [godot-cpp Packed arrays](https://docs.godotengine.org/en/4.7/tutorials/scripting/cpp/core_types.html#packed-arrays)
- **서버 선택:** Godot 4는 일반 바이너리의 `--headless` 또는 dedicated-server export를 사용할 수 있습니다. export에는 editor 바이너리가 필요하고 운영 서버에는 export template 기반 산출물을 사용합니다. `dedicated_server` feature와 시각 리소스 stripping은 패키징 선택이며 권위 검증을 제공하지 않습니다. 삭제한 자원을 server scene이 참조하지 않는지 확인합니다. [공식 dedicated server 지침](https://docs.godotengine.org/en/4.7/tutorials/export/exporting_for_dedicated_servers.html)
- 클라이언트는 권위·예측·보간·표시 상태를 분리하고 서버는 입력 형식·권한·순서·불변조건 검증 후 accepted 상태만 저장/전파합니다. 자세한 기준은 [게임 네트워크 동기화](/game/network-sync.md), [게임 보안](/security/game.md), [클라이언트 체크리스트](/game/client-checklist.md), [서버 체크리스트](/game/server-checklist.md)를 재사용합니다.

## macOS 네이티브 디버깅과 export

C++ breakpoint는 GDScript 디버거와 별개입니다. 위 `debug_symbols=yes optimize=none` 확장을 빌드한 뒤 **확장을 로드하는 Godot 프로세스**를 LLDB/CodeLLDB로 실행합니다. 게임 C++를 디버깅할 때 editor만 attach하고 별도 게임 프로세스가 멈추기를 기대하지 않습니다. [Godot의 LLDB 설정 예제](https://docs.godotengine.org/en/4.7/engine_details/development/configuring_an_ide/visual_studio_code.html#debugging-the-project)

`/Applications/Godot.app`에 고정 버전 공식 editor가 설치되어 있다면 원본 대신 **개발용 복사본**을 사용합니다. 공식 notarized 빌드는 debugger attach용 `com.apple.security.get-task-allow`를 기본으로 포함하지 않으므로 [4.7 macOS 디버깅 지침](https://docs.godotengine.org/en/4.7/engine_details/development/debugging/macos_debug.html)의 `editor.entitlements`로 복사본을 다시 서명하거나 직접 빌드한 debug editor를 사용합니다. 재서명본은 로컬 개발 전용이며 배포·배포 검증에 쓰지 않습니다. 다음은 그 복사본과 현재 경로의 `project/`를 사용하는 예입니다.

```sh
ditto /Applications/Godot.app ./tools/Godot-debug.app
codesign -s - --deep --force --options=runtime --entitlements ./editor.entitlements ./tools/Godot-debug.app
lldb -- ./tools/Godot-debug.app/Contents/MacOS/Godot --path ./project
```

LLDB에서 `breakpoint set --name game_library_init`, `run`, 정지 후 `image list`, `thread backtrace`로 entry 호출·실제 로드 library·네이티브 스택을 확인합니다. 게임 코드 breakpoint로 계속 진행하고 값을 바꾸며 관찰합니다. editor 플러그인 코드가 대상이면 실행 인자에 `--editor`를 넣습니다. [.app 내부 실행 파일과 CLI](https://docs.godotengine.org/en/4.7/tutorials/editor/command_line_tutorial.html)

- breakpoint가 안 잡히면 실행 프로세스, library 경로, CPU slice, 심볼/소스 대응, strip·최적화 여부를 차례로 확인합니다. `file`·`lipo -info`로 아키텍처를, `otool -L`로 dependency를 확인할 수 있습니다.
- macOS 공식 export templates는 Universal 2입니다. 배포 앱이 지원하는 CPU마다 확장과 종속 라이브러리 slice도 있어야 합니다. arm64에서 editor 로드 성공만으로 Intel 지원을 주장하지 않습니다.
- 실제 배포에서는 `.app`의 Frameworks 배치, 서명·notarization·필요한 library-validation entitlement를 확인합니다. exported app의 네이티브 디버깅을 위한 `Debugging` entitlement는 개발용으로만 켜고 production/notarization에서는 끕니다. Gatekeeper를 전역 비활성화하는 방식으로 문제를 숨기지 않습니다. [macOS export 계약](https://docs.godotengine.org/en/4.7/tutorials/export/exporting_for_macos.html)

## 프로젝트 설정과 에디터 도구 의존성

- **Godot 4.7.2의 override 경계:** `override.cfg`는 런타임 설정 덮어쓰기 기능이며 에디터의 선택적 addon 설정 분리 수단으로 일반화하지 않습니다. 고정 엔진의 `Main::setup`은 `editor` 값을 `ProjectSettings::setup`의 `p_ignore_override`로 전달하고 `_setup`은 그 값이 참이면 override를 읽지 않습니다. [공식 ProjectSettings 문서](https://docs.godotengine.org/en/4.7/classes/class_projectsettings.html), [고정 main.cpp](https://github.com/godotengine/godot/blob/ed1daf0bf001b61586d9930840f2f1394092c079/main/main.cpp), [고정 project_settings.cpp](https://github.com/godotengine/godot/blob/ed1daf0bf001b61586d9930840f2f1394092c079/core/config/project_settings.cpp)를 함께 대조합니다.
- **플러그인의 저장 경계:** addon 활성화와 helper autoload 등록이 `ProjectSettings.save()`를 호출하면 로컬 개발 의존성이 추적 설정에 다시 들어갈 수 있습니다. 단순 파일 분리만으로 해결됐다고 하지 말고 import/editor·실제 Main·설정 저장/재로드를 다른 실행 경로로 확인합니다. addon을 고정 필수 개발 의존성으로 포함할지 별도 개발 프로젝트로 분리할지는 사용자의 작업 방식·의존성 정책 선택입니다. 누락 경고를 숨기거나 저장 파일을 사후에 몰래 되돌리지 않습니다.
- **외부 소스 고정:** 버전 문자열뿐 아니라 출처 commit·공식 파일 inventory/hash와 설치 바이트를 대조합니다. Windows의 줄바꿈 변환은 원본 byte hash를 바꾸므로 필요한 vendor 경로만 `.gitattributes`의 `-text` 등으로 보존하고 전역 Git 설정은 바꾸지 않습니다. 고정 소스 준비·추적 가능 상태·Git 게시·실제 새 clone·export 성공은 별개입니다. lock의 변조 검출을 자동 업데이트 비활성화로 표현하지 않습니다.

## 실행 가능한 smoke 절차

**전제:** 실제 `project/project.godot`, 실행할 main scene, 빌드된 확장, 핀과 일치하는 export templates, `export_presets.cfg`의 `macOS` preset, 해당 CPU를 지원하는 라이브러리와 실제 산출물 이름이 준비되어 있어야 합니다. 앞의 arm64 전용 manifest 예제로 export하려면 preset의 `binary_format/architecture`를 `arm64`로 지정합니다. 4.7.2의 기본값은 `universal`이며 x86_64 라이브러리가 없으면 export가 경고만 남기므로 `No "x86_64" library found` 경고를 실패로 처리합니다. Universal 배포는 x86_64·arm64 또는 universal 라이브러리를 모두 제공합니다. [4.7.2 macOS 기본값](https://github.com/godotengine/godot/blob/ed1daf0bf001b61586d9930840f2f1394092c079/platform/macos/export/export_plugin.cpp), [export matcher 경고](https://github.com/godotengine/godot/blob/ed1daf0bf001b61586d9930840f2f1394092c079/editor/export/gdextension_export_plugin.h) 다음은 수행 지침이지 이 문서 작성 시 실행한 결과가 아닙니다.

```sh
godot --version
godot --headless --path ./project --import
godot --editor --path ./project
godot --headless --path ./project --quit-after 120
mkdir -p ./project/build
godot --headless --path ./project --export-debug "macOS" build/Game-debug.app
godot --headless --path ./project --export-release "macOS" build/Game.app
open ./project/build/Game-debug.app
open ./project/build/Game.app
```

`--quit-after 120`은 반복 횟수 한계이지 특정 물리 tick 수나 기능 완료를 보장하지 않습니다. export 출력의 상대 경로는 현재 shell이 아니라 `project.godot`가 있는 디렉터리 기준이며 출력 부모 디렉터리가 존재해야 합니다. 명령 오타가 무시될 수 있으므로 `--help`와 실행 로그도 확인합니다. [CLI 참조](https://docs.godotengine.org/en/4.7/tutorials/editor/command_line_tutorial.html)

`RenderingServer.frame_post_draw`를 기다린 뒤 준비를 시작하는 제품을 headless로 검사한다면 검증 루프에서도 `RenderingServer.force_draw(false)` 등으로 실제 draw 경계를 진행시켜야 합니다. 계속 `LOADING`이고 준비 시작 계측이 0이면 timeout만 늘리거나 제품의 초기화 경계를 우회하기 전에 이 차이를 확인합니다. 무거운 동기 검사를 실시간 세션의 입력 앞에 몰아 넣는 검증기도 liveness를 만료시킬 수 있으므로 코어/직렬화 회귀와 실제 입력 스모크의 실행 경계를 분리합니다. 근거: [고정 Main::iteration draw 조건](https://github.com/godotengine/godot/blob/ed1daf0bf001b61586d9930840f2f1394092c079/main/main.cpp#L5080-L5097), [headless의 창 그리기 조건](https://github.com/godotengine/godot/blob/ed1daf0bf001b61586d9930840f2f1394092c079/servers/display/display_server_headless.h#L141).

- [ ] **버전/빌드:** 실제 `--version`, 엔진·바인딩 핀, API 대상, 정밀도, target, CPU, compiler/SDK와 export templates 조합을 기록합니다.
- [ ] **import/load:** headless import 로그에서 확장 라이브러리·entry·API 오류가 없는지 확인합니다. 종료 코드 0만으로 로드 성공을 판정하지 않습니다.
- [ ] **editor:** CounterData 같은 등록 클래스가 실제 생성 가능하고 Inspector property의 변경→저장→재시작 후 값이 보존되는지 확인합니다. Node 확장이면 scene에 배치하여 `_ready`와 게임 경로도 실행합니다.
- [ ] **게임 동작:** 실제 확장 메서드를 호출하고 property/signal 소비자가 관찰하는 상태를 확인합니다. 물리 처리·입력·scene 전환·객체 제거 경로를 지나갑니다. headless 실행만으로 시각 출력·오디오·입력 검증을 대체하지 않습니다.
- [ ] **수명/스레드:** scene 재진입, `queue_free` 뒤 deferred 결과, 워커 취소, Resource 공유/복제, 종료 시 누수·dangling 접근을 확인합니다.
- [ ] **native debug:** entry와 게임 코드 breakpoint가 실제로 멈추고 올바른 library와 스택을 확인할 수 있어야 합니다.
- [ ] **export:** debug와 release 앱을 각각 실행하여 라이브러리가 포함·로드되고 같은 기능이 동작하는지 확인합니다. 모든 지원 OS/CPU에서 별도 빌드·실행하며 Web/모바일은 해당 SDK와 export 제약까지 확인합니다.
- [ ] **server:** 서버를 제공한다면 dedicated preset/headless 산출물에 실제 클라이언트를 연결하고 권위 상태·재접속·순서/손실 경계를 검증합니다. headless 시작만으로 서버 기능 검증을 완료하지 않습니다.
- [ ] **성능:** 위 부하·release 비교·꼬리 지연·과부하·동작 보존 기준으로 실제 게임 코어를 측정합니다. C++ 빌드 성공이나 빈 headless 실행을 성능 개선의 증거로 삼지 않습니다.

## 검증 범위와 공개 근거

이 문서는 공식 4.7 문서와 위에 고정한 엔진/바인딩 릴리스·태그·소스를 근거로 하며, 각 항목에 명시한 Godot UI·시그널·직렬화 실행 관찰은 해당 사례의 검증 기록입니다. **개별 사례의 실행 관찰은 이 문서의 C++ 예제·빌드 조합·플랫폼별 editor/headless/export·디버거 절차 전체를 실행 검증했다는 뜻이 아닙니다.** 코드·명령 예제는 소스 계약을 근거로 한 적용 지침이며 플랫폼별 실행 성공 증거가 아닙니다. 실제 프로젝트에 적용할 때는 위 smoke 절차로 해당 조합과 동작을 별도 검증합니다.

개인 선호나 내부 사례를 공개 기술 사실로 옮기지 않았습니다. 확인일 이후의 최신판 여부와 개별 플랫폼 조합의 지원 여부는 재검증 대상이며, 문서·릴리스 메타데이터가 어긋나면 차이를 명시하고 해당 핀의 소스를 우선 확인합니다.

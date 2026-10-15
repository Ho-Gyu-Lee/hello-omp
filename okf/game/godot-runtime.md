---
type: Concept
title: Godot C++ Scene·물리·Resource 수명과 경계
description: Scene 생명주기와 소유권(에디터 복제·부분 생성 보호 포함), 물리·프레임·스레드 경계, Resource 직렬화·저장 정밀도·표시 데이터 자원 수락과 성능·서버 권위 선택의 규칙을 정리합니다.
tags: [game, godot, cpp, gdextension, physics, ownership, performance, threading, resource, serialization]
timestamp: 2026-10-15T00:00:00Z
---

# Godot C++ Scene·물리·Resource 수명과 경계

상위 개념: [Godot와 C++ 게임 개발](/game/godot-cpp.md) · 버전 핀과 [검증 범위](/game/godot-cpp.md#검증-범위와-공개-근거)를 함께 따릅니다.

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
- **보호 hash의 크기·소유 경계:** 반복 metadata가 많은 장면 전체를 하나의 중첩 Variant로 직렬화하지 않습니다. 각 subtree를 typed array로 해시하고 부모에 자식 digest를 순서대로 넣어 직렬화 크기를 제한합니다. 문자열 단순 연결이나 의미 있는 자식 순서의 임의 정렬은 피합니다. 엔진 [`encode_variant`](https://github.com/godotengine/godot/blob/ed1daf0bf001b61586d9930840f2f1394092c079/core/io/marshalls.h)의 길이 인자는 `int`이므로 지원하는 최대 작성 크기로 실제 저장 경로를 검증합니다. 공용 TileSet 전체의 정체성과 unit이 사용한 source 목록을 구분하며, unit 셀의 source 소비가 전역 보호 hash를 바꾸지 않게 합니다. 규칙 변경 시 기준선 버전 처리는 위 「부분 생성의 보호 hash」 항목을 따르고, 중첩 속성 편집·순서 변경·선택하지 않은 unit 보존·정확한 원상복구를 검사합니다.
- **숫자 metadata의 저장 정밀도:** JSON 숫자를 그대로 text Resource에 넣으면 정수 식별자가 FLOAT로 저장되거나 float32 shortest 출력 때문에 round-trip 값과 raw Variant hash가 달라질 수 있습니다. 검증된 정수 ID/seed는 int로 저장하고, 재생성에 필요한 소수 설정은 full-precision JSON 같은 손실 없는 정본을 한 곳에 둡니다. 설정을 실제 생성기로 넘기는 JSON 쓰기까지 full precision을 유지합니다. 보호 hash는 설치 엔진 writer의 정규화와 일치시키되 이를 seed/충돌 좌표 손실을 숨기는 수단으로 쓰지 않습니다. 큰 uint32·float32-exact 값·일반 float64를 실제 pack/save/reload와 부분 재생성 경로에서 검증하고 hash 의미가 바뀌면 버전을 올립니다.
- **정규형과 런타임의 decode 정밀도:** 같은 정수 mm 바이트라도 한 경로는 float 연산으로, 다른 경로는 double 연산으로 m를 복원하면 exact 비교가 실패할 수 있습니다. 판정 정본의 decode 타입/나눗셈 정밀도를 통일하거나 정규형 정수 바이트를 비교하며 epsilon 확대나 검증 생략으로 숨기지 않습니다. 2진수로 정확히 표현되지 않는 합법 소수 경계를 실제 게시→런타임 로드 경로까지 검사합니다.
- **반복 표시 데이터의 자원 수락:** READY·정상 종료는 장면 크기·메모리 수락을 뜻하지 않습니다. 작은 crop마다 Node와 동일 출처 Dictionary를 복제하면 큰 맵에서 직렬화·메모리가 폭증하므로, 같은 판정/그리기 계약을 유지하는 TileMapLayer·공유 atlas 등으로 묶고 최대 작성 입력의 저장 크기·프로세스 피크를 실제로 측정합니다. 구매 원본은 보존하고 crop 합성본은 선택 영역 RGBA 일치·영역 밖 투명·별도 hash로 증명합니다. 선언 crop만 믿지 말고 실제 표시 alpha의 포함 관계를 검사하며, import alpha-border 처리·선형 필터·픽셀 정렬에 따른 화면 차이도 확인합니다. 공통 엔진/아트 비용과 변경한 표현의 비용, Windows debug 결과와 모바일/release 수락은 구분합니다.
- Godot Object를 일반 `delete`나 기본 deleter의 `std::unique_ptr`로 감싸지 않습니다. 순수 C++ 비엔진 자원에는 RAII를 적용합니다.
- `memnew`는 매크로이며 `memnew(MyNode)`처럼 사용합니다. 네임스페이스 함수로 오해해 `godot::memnew(MyNode)`로 쓰지 않습니다. [고정한 바인딩의 memory.hpp](https://github.com/godotengine/godot-cpp/blob/507ed9d840c01a3c5b2a39af8bb4000bfac30bf5/include/godot_cpp/core/memory.hpp)
- 장기 보관하는 비소유 Object 참조는 `ObjectID`를 저장하고 사용 시 `ObjectDB::get_instance` 등으로 다시 확인합니다. ID 조회는 스레드 간 생존을 보장하는 잠금이 아닙니다. 해제된 raw pointer에 메서드를 호출하여 유효성을 검사하지 않습니다. deferred 결과에도 대상의 생존·현재 scene/session generation을 확인합니다.

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
- **성능 선택:** 측정 조건·지표는 [성능 수락 기준](/game/godot-simulation.md#성능-수락-기준)을 따르며, 먼저 CPU/GPU·메인 스레드·메모리·프레임/tick 지연의 병목을 실제 목표 기기에서 확인합니다. 핫패스에서 반복 Node 탐색, 문자열/Variant 변환, 작은 바인딩 호출, 불필요한 할당·복사를 줄입니다. `Packed*Array` 대량 접근은 `ptr()`/`ptrw()`로 경계 호출을 줄일 수 있으나 resize·copy-on-write 이후에도 포인터가 유효하다고 가정하지 않습니다. Variant를 거친 인자 수정이 호출자 배열에 그대로 반영된다고 가정하지 않습니다. [godot-cpp Packed arrays](https://docs.godotengine.org/en/4.7/tutorials/scripting/cpp/core_types.html#packed-arrays)
- **서버 선택:** Godot 4는 editor 또는 export template 바이너리에 `--headless`를 주어 실행하거나 dedicated-server export를 사용할 수 있습니다. 운영 서버에는 export template 기반 산출물을 사용하고, 그 export를 만드는 데는 editor 바이너리가 필요합니다. `dedicated_server` feature와 시각 리소스 stripping은 패키징 선택이며 권위 검증을 제공하지 않습니다. 삭제한 자원을 server scene이 참조하지 않는지 확인합니다. [공식 dedicated server 지침](https://docs.godotengine.org/en/4.7/tutorials/export/exporting_for_dedicated_servers.html)
- 클라이언트는 권위·예측·보간·표시 상태를 분리하고 서버는 입력 형식·권한·순서·불변조건 검증 후 accepted 상태만 저장/전파합니다. 자세한 기준은 [게임 네트워크 동기화](/game/network-sync.md), [게임 보안](/security/game.md), [클라이언트 체크리스트](/game/client-checklist.md), [서버 체크리스트](/game/server-checklist.md)를 재사용합니다.

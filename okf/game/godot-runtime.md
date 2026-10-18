---
type: Concept
title: Godot C++ Scene·물리·Resource 수명과 경계
description: Godot 객체 소유권, 스레드 경계, 에디터 복제 flags·트리 밖 좌표 캐시·text Resource 숫자 정밀도·직렬화 크기의 버전 특정 계약입니다.
tags: [game, godot, cpp, ownership, threading, resource, serialization]
timestamp: 2026-10-18T00:00:00Z
---

# Godot C++ Scene·물리·Resource 수명과 경계

상위 개념: [Godot와 C++ 게임 개발](/game/godot-cpp.md)(버전 핀 포함). 부분 생성의 보호 hash·게시 계약은 [공통 데이터 형식](/development/data-formats.md), 숫자 decode 계약은 [공통 수치 정밀도](/development/numerics-spatial.md)를 따릅니다.

## 소유권

- Godot 객체에 표준 스마트 포인터·`delete` 기본값을 대입하지 않습니다. `Node`는 `memnew`로 만들어 부모 아래에 두고 런타임 제거는 `queue_free()`, `RefCounted`·`Resource`는 `Ref<T>`로 소유하며 수동 파괴하지 않습니다. RAII는 비엔진 C++ 자원에 씁니다.
- `memnew`는 매크로이므로 `memnew(MyNode)`로 쓰고 `godot::memnew(MyNode)`로 쓰지 않습니다. (godot-cpp 핀 [`memory.hpp`](https://github.com/godotengine/godot-cpp/blob/507ed9d840c01a3c5b2a39af8bb4000bfac30bf5/include/godot_cpp/core/memory.hpp))
- 장기 비소유 Object 참조는 `ObjectID`로 저장해 사용 시 다시 확인합니다. ID 조회는 스레드 간 생존을 보장하는 잠금이 아니므로 deferred 결과에도 대상 생존과 현재 scene/session generation을 확인합니다.
- 부모-자식 수명과 `Node.owner`(PackedScene 저장 범위)는 별개입니다. 에디터 도구가 만든 자식을 저장하려면 조상 owner가 필요하고, 분리·재부착하는 Undo/Redo에서는 분리된 subtree가 이전 owner를 유지할 수 있으므로 떼기 전에 비웁니다.

## 물리·프레임·스레드 경계

활성 SceneTree·공유 Resource의 스레드 계약은 [4.7 Thread-safe APIs](https://docs.godotengine.org/en/4.7/tutorials/performance/thread_safe_apis.html)를 따르고, 서버 API는 rendering/physics 별도 스레드 설정에 따라 안전성이 달라지므로 "항상 안전"으로 일반화하지 않습니다. 이 제약은 엔진 객체 접근에 한정되며 엔진 비의존 코어의 병렬화를 금지하지 않습니다([개발 방향](/direction.md), [루프·병렬 작업·스크립트](/development/execution.md)). 워커 결과는 메인 스레드에서 수명을 검증한 뒤 적용하며 `call_deferred`는 대상 수명을 해결하지 않습니다.

## 복제·좌표·직렬화

- **`Node.duplicate()` flags:** GDScript·godot-cpp 바인딩의 [`Node.duplicate()`](https://docs.godotengine.org/en/4.7/classes/class_node.html#class-node-method-duplicate) 기본 flags 15에는 `DUPLICATE_USE_INSTANTIATION`이 포함되어 `scene_file_path`가 있는 저장 장면 루트·하위 장면 인스턴스는 저장된 PackedScene을 다시 instantiate합니다. 엔진 모듈 C++의 `Node::duplicate()` 기본 인자는 signals/groups/scripts 조합 7입니다(엔진 `scene/main/node.h` L732). 현재 편집 메모리의 추가·삭제를 보존해야 하는 후보/Undo 복제에는 flags를 명시하고 `DUPLICATE_USE_INSTANTIATION`을 제외합니다.
- **트리 밖 좌표:** 분리된 Node2D의 읽어 둔 `global_transform`/`global_position`은 조상 편집 뒤 갱신된다고 가정하지 않으며, 공통 루트 기준 좌표는 [`get_relative_transform_to_parent()`](https://docs.godotengine.org/en/4.7/classes/class_node2d.html#class-node2d-method-get-relative-transform-to-parent) 등 현재 local transform의 합성으로 구합니다.
- **text Resource의 숫자:** JSON 숫자를 그대로 text Resource에 넣으면 정수 식별자가 FLOAT로 저장되거나 float32 shortest 출력 때문에 round-trip 값과 raw Variant hash가 달라질 수 있습니다. 검증된 정수 ID/seed는 int로 저장하고 소수 설정은 full-precision JSON 같은 손실 없는 정본 하나에 둡니다.
- **직렬화 크기:** 반복 metadata가 많은 장면 전체를 하나의 중첩 Variant로 직렬화하지 않고 subtree별 digest를 부모에 순서대로 넣으며, `encode_variant`의 길이 인자가 `int`이므로(엔진 `core/io/marshalls.h`) 최대 입력으로 실제 저장 경로를 검증합니다. 작은 crop마다 Node·Dictionary를 복제하지 않고 TileMapLayer·공유 atlas로 묶으며 READY·정상 종료를 메모리 수락으로 보지 않습니다.

---
type: Concept
title: 수치와 공간 판정의 정확성
description: 허용오차·퇴화 입력·음수 격자·FP 모드, 좌표·회전·곡선·적분과 근사, 보수적 공간 인덱스·질의·충돌·높이맵의 적용 조건을 다룹니다.
tags: [development, math, floating-point, geometry, collision, coordinates, terrain]
timestamp: 2026-10-15T00:00:00Z
---

# 수치와 공간 판정의 정확성

수치 처리·CAD·웹3D·시뮬레이션·게임에서 같은 전제 아래 재사용할 설계 기준입니다. 서적의 원리·반례와 언어/엔진 계약을 대조했으며 동일 허용오차·물리 backend·탐색 구조를 모든 프로그램에 강제하지 않습니다. 본문의 게임 사례는 해당 적용 조건에 한정합니다. 게임 좌표 보고의 권위 검증은 별도의 [시간·이동 검증](/game/network-time-movement.md)을 따릅니다.

## 수치 비교와 종료성

- 근사 동등은 위치·각도·속도 등 단위, 값의 규모, 허용 오차에 맞춰 절대/상대/ULP 기준을 선택합니다. machine epsilon은 1 근방의 표현 간격이지 게임 전역의 절대 오차가 아닙니다. 정규형·ID·wire 동일성 검사를 느슨한 근접 비교로 바꾸지 않습니다. 근접 관계는 추이적이지 않을 수 있으므로 ordered-container 비교자나 hash-key 동등성으로 쓰지 않습니다([epsilon](https://en.cppreference.com/w/cpp/types/numeric_limits/epsilon), [C++ 비교자 기준](/language-style-c-cpp.md)).
- 정규화의 영벡터, 평행·퇴화 삼각형, 역행렬 불능 등 정의역 경계를 정합니다. 오류·명시적 대체값 중 게임 의미에 맞는 정책을 고르고, 법선을 임의 방향으로 보정해 충돌 실패를 숨기지 않습니다. 개발 진단과 릴리스 실패 경로를 구분하며 NaN/Inf가 저장·복제로 번지기 전에 차단합니다. 엔진이 이미 정한 의미도 확인합니다([Godot Vector2](https://docs.godotengine.org/en/stable/classes/class_vector2.html)의 정규화·근사 비교 계약).
- 정해진 개수의 지형/곡선/애니메이션 샘플은 정수 인덱스로 종료하고 매개변수를 계산합니다. 실수 누적값의 정확 일치나 epsilon 근접에 반복 종료를 맡기지 않습니다. 큰 초기값에 작은 step을 더해 값이 그대로인 경우, 목표를 넘어간 경우, 0·잘못된 부호 step을 포함해 개수·끝점 정책을 검사합니다.
- 원점 양쪽의 타일·청크·AOI 셀 소유를 floor로 정의했다면 C/C++의 0 방향 정수 나눗셈과 구분합니다. 셀 크기 8에서 좌표 -1은 셀 -1·내부 좌표 7입니다. `abs`는 음수 공간을 지워 버리므로 수정이 아닙니다. 클라·서버·에디터가 같은 몫/나머지 계약을 사용하고 0, -1, ±셀 크기 안팎을 확인합니다. 음수의 `/`를 `>>`로 치환할 때도 반올림 의미가 달라질 수 있습니다([C++ 연산자](https://en.cppreference.com/w/cpp/language/operator_arithmetic)).
- 비트 수·2의 거듭제곱 용량·이산 깊이는 float 로그의 반올림으로 결정하지 않습니다. 정확한 정수 연산을 사용하고 0의 의미·올림 결과의 표현 범위를 검사합니다. 지원한다면 C++20 `bit_width`·`bit_ceil` 등 기존 기능의 전제를 따릅니다([정수 비트 연산](https://eel.is/c++draft/bit.pow.two)).

## 부동소수 모드와 재현성

- NaN/Inf 거부나 FP 예외·상태 플래그 관측이 필요한 코드를 그런 값·예외가 없다고 가정하는 최적화 모드로 빌드하지 않습니다. GCC `-ffast-math`에는 `-ffinite-math-only` 등이 포함되고 MSVC `/fp:fast`도 특수값·FP 환경에 대한 가정을 합니다. debug에서 잡힌 오류를 다른 옵션의 release 보장으로 확대하지 않습니다([GCC 옵션](https://gcc.gnu.org/onlinedocs/gcc/Optimize-Options.html), [MSVC /fp](https://learn.microsoft.com/en-us/cpp/build/reference/fp-specify-floating-point-behavior)).
- FP 환경 변경이 필요하면 툴체인의 지원과 스레드별 적용·외부 라이브러리 호출 전후 복원을 확인합니다. FTZ/DAZ는 작은 값을 0으로 바꾸는 정확도 정책입니다. 감쇠 등 거의 0인 값이 남는 계산은 정상 크기 입력과 함께 측정하고 결과 변화도 확인합니다. 특정 CPU의 denormal 비용을 모든 플랫폼에 일반화하지 않습니다([Intel denormals](https://www.intel.com/content/www/us/en/docs/onemkl/developer-guide-linux/2025-0/operating-on-denormals.html)).

## 좌표·회전·시간 진행

- 좌표 타입·단위는 최대 위치에서도 필요한 최소 이동/접촉 간격을 구분할 수 있는지로 선택합니다. 표현 가능한 최대값 이전에도 원점에서 멀어지면 간격이 커집니다. 저장→변환→판정/렌더 경로에서 작은 이동을 검사하고 double·원점 이동을 일괄 도입하지 않습니다([Godot large world coordinates](https://docs.godotengine.org/en/stable/tutorials/physics/large_world_coordinates.html)).
- 제작 도구·로더·셰이더의 손잡이성·앞/위 축·단위·winding·pivot을 정합니다. 행렬 저장 순서, 행/열 벡터, 곱하는 쪽과 적용 순서는 다른 계약입니다. 비대칭 축 표시와 원점 밖 객체의 자기 회전/공전·문 경첩으로 검증합니다. 계층의 형제에게 앞 가지의 변환이 새지 않게 하고, 부착 카메라의 view는 조상까지 합친 변환과 해당 scale 정책에서 도출합니다([DirectXMath convention](https://learn.microsoft.com/en-us/windows/win32/dxmath/pg-xnamath-getting-started#matrix-convention), [glTF view matrix](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#view-matrix)).
- 내적의 각도 크기와 좌우 조향 부호를 구분합니다. 외적의 순서·조향축을 정하고 영벡터·평행·반평행을 별도 처리합니다. 두 방향의 최단호에서 같은 방향은 항등, 반대 방향은 회전축 선택이 필요한 경계입니다. `look-at`도 위치=목표·up과 시선 공선·롤 뒤집힘의 정책을 둡니다. 잘못된 비단위 입력을 clamp만으로 숨기지 않습니다.
- 회전 quaternion은 finite·단위 길이, 축-각의 단위 축·도/라디안, 성분 순서·합성 공간을 확인합니다. 단위 quaternion의 켤레는 역원이지만 `-q`는 같은 회전의 다른 표현입니다. nlerp의 정규화, slerp의 단위 입력·최단호, 불균일 키와 cubic tangent 시간 스케일을 확인합니다. 한 구간의 일정 각속도가 여러 키 경계의 연속성을 보장하지 않습니다([glTF interpolation](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#appendix-c-interpolation)).
- 곡선의 모양·제어점 통과 조건·시간 진행·카메라 방향을 나눕니다. 균등 매개변수는 등속 거리가 아니므로 등속이 필요하면 오차를 관리한 호 길이/거리 표를 사용합니다. 고정 가중치의 프레임별 추적은 FPS 의존적입니다. 정해진 시간의 연출은 시작 시각·지속시간·끝점을 확정하고, 고정 목표 지수 추적은 `1-exp(-k*dt)` 같은 시간 계수를 검토합니다. 한 번의 dt와 두 번의 dt/2를 비교하되 움직이는 목표의 추종 지연까지 없어진다고 주장하지 않습니다([MuJoCo filterexact](https://mujoco.readthedocs.io/en/stable/computation/#stateful-actuators)).

## 적분·근사 선택

- 직접 파동/스프링·적분기를 구현한다면 timestep·강성/감쇠·격자 해상도의 안정성·정확도·에너지·비용을 함께 봅니다. 암묵적 방식의 안정성 이득과 수치 감쇠·풀이 비용은 별개입니다. `x'=-kx, k>0`의 명시적 Euler 감쇠 안정 조건 `0<k·dt<2`는 그 식의 조건이지 모든 물리 엔진의 한계가 아닙니다([MuJoCo numerical integration](https://mujoco.readthedocs.io/en/stable/computation/#numerical-integration)).
- 조회표·다항식 근사가 필요한 경우 정의역 축소, 중간항 범위·상쇄, 최대 오차·주기 접합·홀짝 대칭과 변환 불변성을 검사합니다. 최종 출력이 작아도 중간 계산은 안전하지 않을 수 있고 큰 입력 저장에서 잃은 작은 변화는 뒤의 range reduction으로 복구되지 않습니다. 측정된 병목과 허용오차 없이 옛 cycle 수로 표준 수학 함수를 교체하지 않습니다.
- 위상이 중요한 CSG·교차/재삼각화 전처리는 정확한 방향/포함 **판정(predicate)**과 생성한 교점의 정확한 **표현(construction)**을 구분합니다. 판정만 정확해도 근사 교점을 재사용하는 결과의 위상이 보장되지는 않습니다. 정수/유리수도 중간식 overflow를 검사하고 원래 edge identity·진전 없는 입력의 실패를 보존합니다. epsilon 확대나 double 전환을 완전한 해결로 주장하지 않습니다([Shewchuk predicates](https://www.cs.cmu.edu/~quake/robust.html), [CGAL construction 조건](https://github.com/CGAL/cgal/blob/main/Straight_skeleton_2/doc/Straight_skeleton_2/Straight_skeleton_2.txt)).
- 같은 이전 턴을 읽는 동기식 격자 모델은 in-place 순회로 바꾸면 전파가 순회 방향에 의존할 수 있습니다. 질량/자원 이동의 가감 보존·비음수와, 다중 갱신률 경계의 시간 보간/교환을 확인합니다. 부모 방문에 종속된 자식 주기·희소 갱신도 실제 적분 간격을 바꿀 수 있습니다. 모든 해법에 double buffer를 강제하는 것이 아니라 선택한 모델의 읽기 세대를 보존하는 기준입니다([AMReX subcycling](https://amrex-codes.github.io/amrex/docs_html/AmrCore.html)).
- 압력/질량을 평형화하는 모델과 속도/운동량을 가진 지속 흐름·파도 모델은 표현하는 현상이 다릅니다. 플레이어가 바꿀 현상과 유지할 동작을 먼저 정하고, 단순 모델에 보유하지 않은 이력을 기대하지 않습니다([유체 속도장·압력](https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-38-fast-fluid-dynamics-simulation-gpu)).
- 건조 마찰의 정지/미끄러짐 전환은 단순 저속 감쇠가 아닙니다. 운동 마찰 적분이 정지 시점을 넘으면 속도 부호 왕복·기어감이 생길 수 있으므로 정지 유지·재출발·dt 변화에서 검사합니다. 임의 저속 threshold로 지운 이동이 게임 의미를 바꾸지 않는지 확인하고 단일 비회전 경사면의 사건 처리법을 다중 접촉 solver의 완성 해법으로 확대하지 않습니다([PhysX friction](https://nvidia-omniverse.github.io/PhysX/physx/5.4.0/docs/RigidBodyDynamics.html#friction-and-restitution)).

## 공간 근사와 충돌

- box/sphere/hull이 게임 규칙의 최종 형상인지 정밀 검사 전 후보 필터인지 구분합니다. 후보 필터는 거짓 양성을 허용할 수 있어도 실제 접촉을 누락해서는 안 됩니다. hull은 오목부·구멍을 메우므로 정확 지형 소속·스폰점이 필요한 기능에서는 실제 영역과 구별합니다. 반대로 규칙이 hull 자체를 영역으로 정의했다면 그 판정이 맞습니다.
- 포함과 교차는 다른 연산입니다. 서로 가로지르는 두 상자는 어느 모서리도 상대 안에 없어도 교차합니다. AABB의 축별 구간 검사 등 적합한 교차 판정을 쓰고 이동·회전·scale 뒤의 bound를 갱신합니다([DirectXCollision BoundingBox](https://learn.microsoft.com/en-us/windows/win32/api/directxcollision/ns-directxcollision-boundingbox), [Box2D Collision](https://box2d.org/documentation/md_collision.html)).
- 고정 tick도 샘플 사이의 얇은 벽·작은 트리거 통과를 자동 검출하지 않습니다. tick 간격·최대 속도·상대 운동·판정 크기를 바꾸면 제어 반응과 tunneling을 함께 검증합니다. CCD·substep·ray/shape sweep은 대상 쌍과 센서의 실제 지원 범위를 확인해 선택합니다. 예를 들어 Box2D의 센서는 CCD가 없고 빠른 통과를 놓칠 수 있습니다([Simulation — Sensors/Bullets](https://box2d.org/documentation/md_simulation.html)).
- 높이맵은 수평 위치당 높이 하나인 표현입니다. 동굴·돌출부·겹친 층에는 다른 표현이 필요합니다. 표시 메시와 지면/서버 조회가 동일한 표면이어야 한다면 원점·축·격자 간격·셀 대각선과 삼각형 보간을 맞춥니다. 정수 샘플 조회는 계단이 되고 쌍선형 보간도 삼각형 표면과 다를 수 있습니다. 마지막 샘플과 마지막 셀의 유효 범위, 패치 공유 경계를 구분합니다([HeightMapShape3D](https://docs.godotengine.org/en/stable/classes/class_heightmapshape3d.html)).
- 높이 참조가 갱신돼도 수평 키가 변한 공간 인덱스와 높이 min/max를 포함한 3D bounds는 별도로 갱신해야 합니다. 시각 메시에서 충돌 자산을 파생했다면 생성 옵션·의존성·재생성과 실제 참조 연결을 관리해 낡은 충돌만 남지 않게 합니다. 자동 생성은 게임플레이 적합성의 증거가 아닙니다.
- 공간 인덱스는 객체 크기 편차·밀집도·이동률로 선택합니다. 작은 셀에 중심만 등록하고 고정 이웃만 보면 큰 객체를 놓칠 수 있습니다. 점유 셀·크기 계층 등 선택한 방식의 교차 계층·대각 경계·큰 폭발·중복쌍을 포함하고 작은 장면에서 전수 검사와 대조합니다([NVIDIA broad phase](https://developer.nvidia.com/gpugems/gpugems3/part-v-physics-simulation/chapter-32-broad-phase-collision-detection-cuda)).
- 트리 경계 교차 도형은 절단·조상 보관·복수 자식 참조의 정확성/메모리/갱신 비용을 비교합니다. 정점이 밖이어도 면이 셀을 통과할 수 있습니다. loose tree의 등록·질의는 실제 확장 bound의 포함 조건을 지켜야 하며, 중복 도형 수가 줄지 않아도 최대 깊이·최소 셀·노드 예산 등으로 끝나야 합니다. 책의 깊이 공식 하나로 포함을 가정하지 않습니다.
- `P+Dir*t`가 직선(`t` 자유), 광선(`t≥0`), 선분(`Dir=end-start`, `0≤t≤1`) 또는 단위 방향+거리 범위인지 명시합니다. 음수 t를 허용하는 높이 helper를 무기/이동 광선에 그대로 쓰지 않습니다. 평행·퇴화·winding·삼각형 경계·원점 뒤·끝 너머를 검사합니다([RayDesc](https://learn.microsoft.com/en-us/windows/win32/direct3d12/raydesc)).
- 충돌 검출만 필요한지, 코드로 궤적을 제어하는지, 힘·관절로 결과를 얻는지에 맞춰 backend/형상을 선택합니다. 접촉·공간 순서 캐시도 상대 이동·sleep/wake·대량 생성/제거에 따른 재사용/재구축 비용을 봅니다. sweep/speculative CCD의 회전·solver 가속·유한 pass 한계를 확인하며 'CCD on'만으로 모든 관통 제거를 주장하지 않습니다([PhysX CCD/PCM](https://nvidia-omniverse.github.io/PhysX/physx/5.4.0/docs/AdvancedCollisionDetection.html)).

## 근거와 검증 범위

- 『온라인 네트워크 게임 프로그래밍』 제공본 PDF p.157–162: 실수 반복·음수 연산. 당시의 음수 나머지 구현 의존 설명·절댓값 처방은 현대 C++ 규칙으로 대체했습니다.
- 『게임 프로그래머를 위한 C++』 한국어판 PDF p.225, 424–429: 근접 비교자의 결함·퇴화 입력 보정의 의미 위험.
- *Multi-Threaded Game Engine Design* (2011) PDF p.182–195, 362–383, 532–554: 수치 비교·높이 조회·충돌 프록시. *Game Programming Gems 3* 한국어판 PDF p.71, 134–136, 354–362: 이산 충돌·FP 진단·영역 근사.
- *Game Programming Gems* 한국어판 PDF p.208–299, 493–500, 513–531, 569–586, 600–606의 보간·적분·회전·공간 구조, *Game Coding Complete* 한국어판 PDF p.369–391, 416–451, *Tricks of the Trade* Trick 14·17·18의 좌표·질의 범위를 보강했습니다. Gems p.298의 최단호 특이점 설명과 p.584의 loose octree 깊이 공식은 원본 대조 후 그대로 채택하지 않았습니다.
- *Game Programming Gems 3* 한국어판 PDF p.228–241, 277–299, 426–428의 정수 경계·강건 기하·격자 결합·마찰 전환을 추가했습니다. predicate/construction 구분과 다중 갱신률의 보존 기준은 공식 자료로 보강한 설계 조건입니다.
- 위 현행 문서 대조: 2026-10-15. 거리 비교의 양방향 true, epsilon 동치의 비추이성, 모서리 포함 검사의 교차 누락은 수치 반례로도 확인했습니다. 책의 엔진 전체나 실제 물리 backend를 실행 검증했다는 뜻은 아닙니다.

## 정규형과 런타임의 정밀도
- **정규형과 런타임의 decode 정밀도:** 같은 정수 mm 바이트라도 한 경로는 float 연산으로, 다른 경로는 double 연산으로 m를 복원하면 exact 비교가 실패할 수 있습니다. 판정 정본의 decode 타입/나눗셈 정밀도를 통일하거나 정규형 정수 바이트를 비교하며 epsilon 확대나 검증 생략으로 숨기지 않습니다. 2진수로 정확히 표현되지 않는 합법 소수 경계를 실제 게시→런타임 로드 경로까지 검사합니다.

## 직교·아이소메트릭 표시의 사례

다음 식은 명시한 투영·회전·viewport 조건에서만 적용합니다. 캐릭터·HUD·AOI는 게임 소비자의 예시이며 일반 시각화에 게임 권한 체계를 요구하지 않습니다.
- **2D 시야와 이동감:** 직교 2D 카메라의 배율 `z`에서 고정 viewport의 표시 길이는 `1/z`, 평면 면적은 `1/z²`에 비례합니다. 물리 해상도·논리 viewport·카메라 배율·월드 단위를 구분하고, 아이소메트릭 투영의 방향별 화면 속도와 추적 카메라 지연을 함께 계산합니다. 화면비 확장으로 한 축의 시야가 늘어나는 경로도 검사합니다. 사용자 줌과 viewport 보정 후 실제 줌이 다르면 resize·카메라 경계·포인터 변환이 실제 값을 사용해야 합니다. 축별 최대 범위를 제한하는 정책은 동일 구도나 모든 화면비의 쾌적함을 보장하지 않습니다.
- **아이소메트릭 맵 가장자리 카메라:** 마름모 맵을 화면 bounding box로만 제한하면 대각선 경계 밖이 보일 수 있습니다. 투영이 `(64(x−y),32(x+y))`이고 카메라 회전이 없다면 화면 네 모서리를 마름모 안에 두는 조건은 월드 각 축의 카메라 중심 범위를 `d = halfView.x/128 + halfView.y/64`만큼 안쪽으로 줄이는 것과 같습니다. `halfView`는 stretch와 실제 zoom을 반영해 투영 상수와 같은 canvas px 단위로 구합니다. 맵 축 길이가 `2d`보다 작으면 유효 중심 구간이 없으므로 역전된 범위에 clamp하지 않습니다.
- 꼭짓점에서는 위 inset과 캐릭터 가시성을 동시에 만족할 수 없으며, 머리 높이·focus 여유에 따라 가장자리 셀에서도 충돌합니다. 측정한 캐릭터 높이를 포함한 focus 여유와 맵 밖 노출의 우선순위를 제품 요구로 정합니다. 가시성을 우선하면 맵 밖 배경을 허용하고, 작은 맵의 중앙 고정도 focus를 만족하는지 확인합니다. 바깥 노출이 금지된 제품은 배경 확장·지원 줌/화면 범위·이동 가능 영역의 설계를 조정해야 하며 이동 영역을 임의로 줄이지 않습니다. AOI가 같은 카메라 함수로 기준 시야를 추정한다면 이 예외까지 포함해 화면비×줌×맵 전체 격자에서 클라이언트 시야가 권한 있는 관찰 범위 안인지 검사합니다. 시야를 기준 범위로 다시 제한할 때도 focus와의 충돌을 숨기지 않습니다. 맵 바깥 색은 clear color로 명시하고, 실제 창 검증은 색 heuristic 대신 화면→월드 역변환으로 맵 밖 픽셀을 고른 뒤 HUD와 필터링된 경계 texel을 제외합니다.

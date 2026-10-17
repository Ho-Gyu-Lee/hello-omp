---
type: Concept
title: 렌더링·애니메이션의 좌표와 표현 계약
description: 픽셀 배치·2D 텍스처 필터와 화면 배율·색공간·합성, 메시·스키닝·법선/접선, 투영·컬링·LOD·광학 근사, GPU 표시·장치 소실 복구와 고정 표시 프로필·이동 클립 정합의 기준입니다.
tags: [development, client, rendering, animation, shader, alpha, gpu, performance, pixel-art, filtering]
timestamp: 2026-10-17T00:00:00Z
---

# 렌더링·애니메이션의 좌표와 표현 계약

일반 앱·웹3D·시각화·게임의 렌더링/애니메이션에서 사용하는 기능의 계약을 다룹니다. 엔진이 이미 제공하는 변환·렌더 패스·애니메이션을 우선하며 D3D9식 전역 상태나 특정 엔진 구조를 강제하지 않습니다. 본문의 전투·경제·권위 맵·판정과 표시의 분리는 게임 적용에 한정한 경계이고 일반 UI에 게임 서버를 요구하지 않습니다. 기술별 예시는 해당 API·버전의 사실로 보존합니다.

## 좌표·포즈

- 비균일 scale에서는 위치용 행렬을 법선에 그대로 적용하지 않고 해당 공간 변환의 역전치를 사용합니다. 법선·광원·시선 벡터를 같은 공간으로 맞추고 필요한 정규화를 수행합니다. 역행렬 불능도 처리하며 인스턴스 불변 계산을 정점마다 중복하지 않습니다. 광원만/카메라만 움직이는 검사를 나누어 스페큘러의 시선과 광원 방향 혼동을 찾습니다([Godot spatial shader 공간·normal matrix](https://docs.godotengine.org/en/stable/tutorials/shaders/shader_reference/spatial_shader.html)).
- 골격의 현재 누적 포즈와 bind pose의 역변환은 역할이 다릅니다. 부모 누적·자식 로컬 변환을 일관된 행/열 벡터·공간 관례로 합성하고, 메시가 없는 중간 관절도 평가합니다. 형제는 서로의 변환이 아니라 같은 부모 변환을 상속합니다. 포즈 변화 뒤 캐시를 갱신하고 bind pose 재생에서 원본 형태를 확인합니다([Khronos glTF Skins](https://github.khronos.org/glTF-Tutorials/gltfTutorial/gltfTutorial_020_Skins.html)).
- 스키닝 입력의 관절 인덱스·지원 영향 집합·비음수 가중치 합을 검사합니다. 영향 수 축소·양자화 뒤 필요한 재정규화를 수행하며 가중치 합 1과 변형 후 법선 길이는 별개입니다([glTF skin attributes](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#skinned-mesh-attributes)).
- crossfade를 쓰면 길이의 단위(초/정규화 시간), 시작 offset·위상, 재전환·중단 우선순위를 정합니다. 긴 전환이 항상 자연스럽거나 반응성이 좋은 것은 아닙니다. 서로 다른 길이의 클립·발 접촉·공격/피격 중 전환을 검사합니다([Unity Animation transitions](https://docs.unity3d.com/6000.0/Documentation/Manual/class-Transition.html)). 권위 판정을 포즈 전환에 맞춰 늦추지 않으며 네트워크의 [애니메이션 시간](/game/network-prediction.md#애니메이션연출-시간)과 구분합니다.
- smallest-three 같은 회전 압축은 단위 quaternion·성분 범위·생략 성분 복원 계약을 먼저 확인합니다. 성분 오차뿐 아니라 계층 관절·socket·긴 무기 끝의 최대 위치 오차를 수락 기준으로 둡니다. IK도 목표 잔차, 프레임 간 자세 연속성, 접지한 발의 세계 위치 보존을 따로 확인합니다. 매 프레임 초기 자세에서 푼 해의 뒤집힘이나 큰 root 보정을 crossfade만으로 해결했다고 보지 않습니다([animation compression](https://dev.epicgames.com/documentation/en-us/unreal-engine/animation-compression-codec-reference-in-unreal-engine), [Blender IK](https://docs.blender.org/manual/en/latest/animation/armatures/posing/bone_constraints/inverse_kinematics/introduction.html)).

## 픽셀·패스·표시 범위

- 이미지의 straight/premultiplied alpha, 투명 경계 RGB, 필터링, 합성 모드를 한 계약으로 확인합니다. PNG에 알파가 있다는 사실만으로 경계 합성이 맞지는 않습니다. 표현/블렌드 불일치로 생긴 테두리를 원본 그림의 임의 보정으로 숨기지 않습니다([Godot 이미지 import](https://docs.godotengine.org/en/stable/tutorials/assets_pipeline/importing_images.html#process-premult-alpha), [CanvasItemMaterial](https://docs.godotengine.org/en/stable/classes/class_canvasitemmaterial.html)).
- 오프스크린 패스는 출력·깊이·viewport·입력 리소스 바인딩을 명시합니다. 종료 함수 이름만으로 원상복구를 가정하지 않습니다. 상태 저장/복원 또는 다음 패스의 완전한 설정 중 엔진 모델에 맞는 방식을 사용하고, 조기 반환·실패 경로와 offscreen→onscreen 전환을 확인합니다. 명시적 command buffer/render graph에 불필요한 전역 상태 복원을 넣지 않습니다([DirectXTK RenderTexture](https://github.com/microsoft/DirectXTK/wiki/RenderTexture)).
- 반복 장식 배경은 반복 간격·원점·표시 배율·복제 수가 가시 영역을 덮는지 최대 줌아웃과 화면 비율 변화에서 확인합니다. 무한 반복 장식과 경계 있는 권위 맵을 구분합니다([Godot 2D Parallax](https://docs.godotengine.org/en/stable/tutorials/2d/2d_parallax.html)).
- 이미지 복사·변환·캡처에서 논리 크기·픽셀 형식·원본/대상 stride·행 방향을 분리합니다. 다음 행을 항상 `너비 × 픽셀 바이트`로 계산하지 않고 홀수 너비·행 여백·상하 반전·다른 pitch를 확인합니다. 자체 정수 합성은 채널별 중간항 부호/범위·반올림과 알파 끝값을 검증합니다([Image Stride](https://learn.microsoft.com/en-us/windows/win32/medfound/image-stride)).
- sRGB 바이트의 직접 가중합과 선형 공간 혼합을 구분합니다. sRGB attachment의 RGB 변환과 alpha 처리를 API대로 적용하고, 축소용 밉 체인 생성·실제 샘플러 사용·밉 간 필터를 따로 확인합니다([Vulkan Blending](https://docs.vulkan.org/spec/latest/chapters/framebuffer.html#framebuffer-blending), [Godot mipmaps](https://docs.godotengine.org/en/stable/tutorials/assets_pipeline/importing_images.html#mipmaps-generate)). 정확한 수치를 담는 데이터 텍스처의 색공간/필터 계약은 유지합니다. 배경까지 합성한 매트/텍스트 캐시는 배경 변경 시 무효화해야 하지만 coverage만 캐시한 텍스트까지 같은 것으로 취급하지 않습니다.
- **2D 텍스처 필터와 화면 배율:** 픽셀 아트 지침의 "Nearest 필터와 제한 팔레트"를 옮기기 전에 실제 에셋의 색 구성(고유 색 수·반투명 경계)을 그림·frame 단위로 셉니다. 아틀라스·시트 전체의 합계는 전체가 한 팔레트가 아니라는 것만 보여 주며, 그림 하나가 제한 팔레트인지는 알려 주지 않습니다. 색 수는 팔레트 제한을 적용할지에 대한 관측이고 필터 선택의 근거가 아닙니다. 필터는 원본 픽셀 격자·최종 배율·실제 화면 비교로 정합니다. Nearest는 정수 배율에서만 텍셀 크기를 고르게 지킵니다. 배율 s가 정수가 아니면 텍셀이 floor(s)와 ceil(s) 화면 픽셀을 번갈아 차지하므로(3.5배면 3과 4) 같은 텍셀의 크기가 달라지고, 카메라가 부분 픽셀만큼 움직일 때마다 그 배치가 바뀝니다. Linear는 경계를 부드럽게 만들고 이웃 텍셀을 섞으므로, 아틀라스의 그림마다 가장자리 텍셀을 바깥으로 복제(extrusion)하고 그림 사이를 띄웁니다. 판단할 배율은 원본 픽셀 하나가 화면 픽셀 몇 개가 되는지, 곧 창 스트레치 배율 × 카메라 줌 × 노드 배율의 곱입니다. 카메라 줌을 창 크기·화면비로 보정하는 프로젝트는 그 보정 계수도 이 곱에 들어갑니다. Godot 4.7의 CanvasItem 기본 필터는 Linear이고(`rendering/textures/canvas_textures/default_texture_filter`), `display/window/stretch/scale_mode="integer"`는 기준 viewport→창의 스트레치 배율만 정수로 맞추며 `Camera2D.zoom`이나 노드 배율은 바꾸지 않습니다. 정수배가 아닌 큰 창은 배율을 내리고 남는 테두리를 검게 두며, 기준 viewport보다 작은 창은 1배로 두고 내용을 자릅니다([ProjectSettings 4.7](https://github.com/godotengine/godot/blob/4.7-stable/doc/classes/ProjectSettings.xml), [window.cpp 4.7](https://github.com/godotengine/godot/blob/4.7-stable/scene/main/window.cpp), 확인 2026-10-17). 그래서 이 설정만으로 줌 3.5의 최종 배율이 정수가 되지 않습니다. 최종 배율이 정수가 아니면 선명도와 시야 배율 중 무엇을 우선할지 실제 화면 비교로 정하고, 필터를 표면(월드·배우·HUD·미니맵)마다 명시합니다.
  - 사례(2026-10-17 측정): 한 아이소메트릭 게임의 구매 타일 아틀라스 두 장은 합계 고유 색이 약 4.8만·6.7만이었습니다. 그림 단위로 다시 세면 아틀라스 그림 290개가 그림당 79~29,797색(중앙값 1,669)이었고, 배우 시트 한 장의 frame 120개는 frame당 89~119색이었습니다. 16~32색 제한 팔레트 그림은 없었으므로, 입문 지침의 팔레트 제한을 적용하면 구매 그림의 색이 바뀝니다. 필터는 이 수치가 아니라 사용자가 정한 카메라 배율 3.2~3.7(비정수)과 실제 화면 비교로 판단할 문제입니다.

## 메시·가시성·광학 근사

- 면 법선과 smooth 음영 법선을 구분합니다. 부드러운 음영이 실루엣·충돌 기하를 바꾸지 않으며 스킨·절차 변형 뒤 옛 법선을 재사용하지 않습니다. 노멀맵 접선은 실제 UV·생성 규약·mirrored UV의 handedness를 보존하고 보간/맵 적용 뒤 필요한 정규화를 합니다. 정점 공유 키와 메시 단순화도 위치뿐 아니라 UV·법선/접선·색·스킨·재질 경계를 고려합니다. seam을 보호해 목표 삼각형 수에 못 미친 결과를 무조건 병합하지 않습니다([glTF meshes](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#meshes), [meshoptimizer](https://meshoptimizer.org/#simplification)).
- z-fighting은 기하 중복·depth 형식·투영·near/far를 함께 봅니다. 전통적 원근 깊이의 near를 무작정 줄이지 않으며 float/reversed-Z에 옛 정수 깊이 공식을 그대로 적용하지 않습니다. bias는 월드 거리 epsilon이 아니므로 비교 방향·slope·clamp와 근거리/원거리/급경사 아티팩트를 확인합니다([NVIDIA depth precision](https://developer.nvidia.com/blog/visualizing-depth-precision/), [Depth Bias](https://learn.microsoft.com/en-us/windows/win32/direct3d11/d3d10-graphics-programming-guide-output-merger-stage-depth-bias)).
- 자체 컬링은 보이는 기하를 누락하지 않아야 합니다. 절두체 밖·일부 교차·전체 포함과 완전 가림을 구분하며 부모 전체 포함일 때만 같은 자식 검사를 생략합니다. 평면 거리와 반지름을 비교할 때 평면식 전체의 스케일을 맞춥니다. 카메라 pose·투영·viewport·bounds를 같은 표시 상태로 갱신하고 검사 비용+남은 후속 비용으로 경계체를 선택합니다([XMPlaneNormalize](https://learn.microsoft.com/en-us/windows/win32/api/directxmath/nf-directxmath-xmplanenormalize)).
- LOD는 거리뿐 아니라 모델 크기·화면 점유/FOV·기하 오차를 봅니다. 문턱의 반복 전환은 진입/이탈 차이 또는 fade 정책으로 처리하고 전환 중 품질·CPU/GPU·메모리 비용도 측정합니다. 렌더 LOD가 권위 충돌·공격 규칙을 바꾸지 않습니다([Unity LODGroup](https://docs.unity3d.com/6000.0/Documentation/Manual/class-LODGroup.html)).
- 일반 `over` 투명 합성은 alpha=0.5에서도 순서 의존적입니다. depth test와 depth write를 구분하고 합성법에 맞게 불투명/투명 순서를 정합니다. 객체 단위 정렬만으로 교차·순환 겹침을 모두 해결할 수 없으며 alpha test·가산·OIT를 같은 방식으로 취급하지 않습니다([glTF alpha coverage](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#alpha-coverage)).
- 윤곽 마스크·cookie·평면 그림자는 투영 좌표만으로 차폐 깊이를 알 수 없습니다. receiver/광원/차폐체 순서·지원 평면·자기 그림자·광원 뒤 투영·경계 누출의 범위를 정합니다. 불투명 차폐체의 같은 광원 가림을 반복 감광해 겹침만 더 어둡게 하지 않으며 광원별 visibility와 서로 다른 광원의 조명 기여를 분리합니다.
- 원거리 환경 반사의 위치/시차 오차를 해상도 증가로 해결했다고 보지 않습니다. 국소 probe, roughness별 사전 필터, BRDF·관측각 응답은 별도 선택입니다([Filament IBL](https://google.github.io/filament/main/filament.html#lighting/imagebasedlights)). 굴절은 입사/normal 방향·`eta=n입사/n투과`·유효 교점·지원 관측 위치를 정하고, 전반사에서 나온 영벡터를 유효 광선으로 쓰지 않습니다. 단일 경계 근사를 수중·다중 경계까지 일반화하지 않습니다([refract](https://registry.khronos.org/OpenGL-Refpages/gl4/html/refract.xhtml)).
- T접합은 가까운 정점 위치만 맞춘다고 해결되지 않습니다. 공유 경계의 분할/평가를 맞추고 소비 알고리즘의 경계·비다양체·주변 연결성 지원을 검사합니다. 정적 topology의 가중치를 재사용하거나 보이는 면만 부분 평가해도 필요한 이웃 의존은 유지해야 합니다([OpenSubdiv](https://opensubdiv.org/docs/subdivision_surfaces.html#non-manifold-topology)).
- 메시 최적화는 strip 길이·인덱스 수·정점 처리 재사용·fetch·overdraw의 교환입니다. 삼각형 순서를 바꾼 뒤 정점 배치를 다시 맞춰야 할 수 있으며 긴 strip을 항상 우수하다고 보지 않습니다([meshoptimizer pipeline](https://meshoptimizer.org/#core-pipeline)).
- 노멀 베이크의 잘못된 투사 표면과 UV 경계 필터 오염은 다릅니다. cage/거리와 mip padding을 별도로 확인하고 방향 데이터의 색공간·Y/handedness를 맞춥니다. padding은 잘못된 표면 대응을 고치지 않으며 detail normal 결합도 색 alpha 혼합과 같지 않습니다([Blender baking](https://docs.blender.org/manual/en/latest/render/cycles/baking.html), [Godot normal map](https://docs.godotengine.org/en/stable/tutorials/3d/standard_material_3d.html#normal-map)). 높이필드 법선 식의 격자 간격/높이 배율과 불균등 면의 가중치도 확인합니다. 정점의 거리 같은 비선형 값을 보간한 결과가 픽셀에서 직접 계산한 값과 같다고 가정하지 않습니다.
- 가시성 검색을 예산 때문에 중단해도 보수적 집합이라는 보장이 남는지 확인합니다. 조명 bake도 고정 기하·가시성·광원 경로의 가정을 나누며 색/세기 변경 지원을 기하 변경 지원으로 확대하지 않습니다([Godot occlusion](https://docs.godotengine.org/en/stable/tutorials/3d/occlusion_culling.html), [stationary lights](https://dev.epicgames.com/documentation/en-us/unreal-engine/stationary-light-mobility-in-unreal-engine)).
- 고정 시점 sprite/impostor는 저장하지 않은 숨은 면을 새 카메라에서 만들 수 없습니다. 깊이 하나/앞뒤 한 쌍의 표현 한계와 재투영 구멍을 확인합니다. 축 제한 billboard는 축방향에서 납작해 보이는 표현 문제와 시선×축 외적의 퇴화를 따로 처리합니다([True Impostors](https://developer.nvidia.com/gpugems/gpugems3/part-iv-image-effects/chapter-21-true-impostors)).
- 절차적 cubemap은 공통 3D 방향의 연속성과 면별 다운샘플/mip 경계 연속성을 따로 검사합니다. 스타일 하이라이트 LUT도 원하는 외형과 물리적 BRDF 타당성은 별개이며 분포 하나로 반사/가림·에너지 계약 전체를 보장하지 않습니다([PBRT microfacet](https://www.pbr-book.org/4ed/Reflection_Models/Roughness_Using_Microfacet_Theory)).
- 스텐실 shadow volume을 선택했다면 z-pass/z-fail의 시점·clip 조건, caps와 옆면의 실제 닫힘·winding을 검증합니다. 열린/비다양체 입력은 선택한 알고리즘의 별도 처리가 필요하며 이 조건을 모든 그림자 방식에 강제하지 않습니다([robust shadow volumes](https://developer.nvidia.com/gpugems/gpugems3/part-ii-light-and-shadows/chapter-11-efficient-and-robust-shadow-volumes-using)).

## GPU 왕복·표시·소실

- CPU readback은 다음 소비자가 현재 프레임 결과를 요구하는지 먼저 봅니다. GPU 안 처리·배치 업로드와 비교하고 지연을 허용하면 비동기 readback을 검토하되 요청 직후 대기하지 않습니다. 비동기의 수 프레임 지연과 메모리 비용도 계약입니다([AsyncGPUReadback](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Rendering.AsyncGPUReadback.html)).
- 부분 재그리기는 이동 전후·삭제·애니메이션 변경 영역을 무효화하고 배경·겹친 대상을 원래 순서로 재구성합니다. 순환 버퍼마다 이전 내용이 다르므로 dirty rectangle의 모든 픽셀을 최신으로 보장합니다([DXGI dirty rectangles](https://learn.microsoft.com/en-us/windows/win32/direct3ddxgi/dxgi-1-2-presentation-improvements)). swapchain 이미지 수·present mode·대기 프레임 보존/교체·재사용 동기화도 분리합니다. triple buffering이라는 이름만으로 무대기·무 tearing·낮은 입력 지연을 보장하지 않습니다([VkPresentModeKHR](https://docs.vulkan.org/refpages/latest/refpages/source/VkPresentModeKHR.html)).
- 사용하는 backend의 장치/컨텍스트 소실 통지·재생성·복구 불가 처리를 확인합니다. 동적 텍스처/렌더 타깃의 재구성 입력과 무효화할 핸들·캐시를 정하고 실패를 무한 재시도로 숨기지 않습니다. WebGL 복구 뒤 이전 GPU 객체는 다시 만들어야 하며, D3D12는 장치 제거 시 fence를 최댓값으로 신호하므로 완료 신호만으로 원래 작업 성공을 추론하지 않습니다([WebGL restored](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/webglcontextrestored_event), [GetDeviceRemovedReason](https://learn.microsoft.com/en-us/windows/win32/api/d3d12/nf-d3d12-id3d12device-getdeviceremovedreason)). 창 전환이 모든 backend의 소실 재현인 것은 아닙니다.


## 기능 지원과 예산 제어

- GPU·플랫폼 기능을 필수/선택으로 나누고 실제 지원·제약을 질의합니다. 이름 부분 일치나 vendor명으로 지원을 추정하지 않습니다. 필수 미지원은 명확한 안내와 실패, 선택 미지원은 선언한 기능 축소/대체 경로로 처리하며 그 경로도 목표 기기에서 실행합니다. 열거된 extension과 필요한 feature의 활성화를 혼동하지 않습니다([Vulkan device extensions](https://registry.khronos.org/vulkan/specs/latest/man/html/vkEnumerateDeviceExtensionProperties.html)).
- 자동 품질 조절을 쓰면 여유 예산, 변경 문턱, 관측 이력, 조정 간격을 함께 정합니다. 한 번의 예산 초과/미달마다 반대 방향으로 바꾸면 품질이 왕복할 수 있습니다. 잡음 억제와 부하 변화 반응의 교환을 측정하며 고정 여유율을 복사하지 않습니다. 표시 품질 축소를 서버 권위의 전투·경제 작업 생략으로 확대하지 않습니다([Epic Dynamic Resolution](https://dev.epicgames.com/documentation/en-us/unreal-engine/dynamic-resolution-in-unreal-engine?application_version=5.5)).

## 근거와 적용 범위

- *Multi-Threaded Game Engine Design* (2011) PDF p.245–246, 307–310, 388–415, 435–436, 473–497의 좌표·골격·전환·알파·render target·배경을 선별했습니다. 광원과 시선 혼동, 역행렬 불능·표현 불일치의 검증 항목은 예제를 현대 계약에 적용해 도출한 기준입니다. 책의 CPU `UpdateSkinnedMesh` 경로를 GPU 스키닝 사례로 쓰지 않습니다.
- *Game Programming Tricks of the Trade* 한국어판 Trick 10 PDF p.303–325의 기능 탐지·미지원 선택, *Game Programming Gems 3* 한국어판 PDF p.69–70의 자동 예산 조절을 보강했습니다. API 호출 나열·고정 FOV·일률적 z-buffer off·전환 0.25초 등은 범용 권장값이 아닙니다.
- *Game Coding Complete* 한국어 제공본 PDF p.111–112, 227–269, 375–411, 425–426, 462–465: 픽셀·버퍼·메시·소실. *Game Programming Gems* 한국어판 PDF p.480–483, 502–507, 549–568, 590–620, 698–756: 컬링/LOD·속성 경계·투명층·광학. *Tricks of the Trade* Trick 9·14·18: stride·평면식·컬링을 보강했습니다. Gems의 p.744 alpha=0.5 무정렬 정확성과 p.751 굴절률 비 역전은 원본 대조 후 제외했습니다. Vulkan/glTF 등의 현대 계약은 책 자체의 구현이 아닌 보강 근거입니다.
- *Game Programming Gems 3* 한국어판 PDF p.258–269, 424–471, 486–493, 504–579의 회전 압축·IK/접지·공유 경계·메시 처리·노멀 베이크·시점/조명 근사를 보강했습니다. 말단 오차·부분 평가 이웃·가변성 범위의 검증은 해당 원리에서 도출한 조건이며 모든 게임의 의무 기능은 아닙니다.
- 현대 문서 대조: 2026-10-15. 실제 렌더러에서 이 항목들을 구현·시각 검증한 결과를 뜻하지 않습니다.

## 고정 표시 프로필
- **고정 표시 프로필과 동적 실루엣:** 방향·애니메이션에 따라 흔들리지 않아야 하는 가림/선택 보조 표시를 요청받았다면 현재 frame의 alpha bounds로 반경·중심을 재계산하지 않습니다. 고정은 모든 모델에 같은 값이라는 뜻이 아니므로 각 원형의 불변 기준 크기·anchor로 프로필을 정하고 현재 포즈와 분리합니다. 같은 원형의 여러 방향/클립에서 실제 표시 픽셀이 일정한지와, 다른 기준 크기의 원형은 다른 프로필을 쓰는지를 별도 검사합니다. 현재 실루엣을 따라야 하는 윤곽선 효과에는 이 정책을 강제하지 않습니다.

## 이동 클립과 전환 정합
- **이동 애니메이션:** 게임 속도를 바꾸면 실제 변위 속도와 클립의 재생률을 함께 확인합니다. 같은 방향/클립이라는 이유로 일찍 반환하면 아날로그 강도 변경을 놓칠 수 있습니다. 걷기 재생률은 해당 상태의 속도로 갱신하되 대기는 별도로 복원하고, 설정한 재생률을 렌더링 FPS나 발 미끄러짐 제거의 실측값으로 표현하지 않습니다.
- **clip 전환의 발 위치:** 방향별 pivot을 여러 clip이 공유하면 게임이 실제로 잇는 경계 frame(대기↔공격 첫 frame, 공격 마지막 frame↔대기)을 시트에서 정합해 이동량을 잽니다. 시트에 구워진 반투명 그림자가 하체 영역을 대부분 차지할 수 있으므로 불투명 인물 픽셀만 남긴 mask로도 측정하고, 같은 mask에 합성 이동을 넣어 찾아내는지 양성 대조를 둡니다. 정합 결과가 탐색 범위 끝에 걸리면 이동량이 아니라 측정 실패로 보고 제외합니다. alpha 경계 하단만으로 pivot을 산출하면 무기·궤적·그림자가 섞이고, frame마다 자기 경계로 잡은 하체 중심은 보폭 자세와 pivot 차이를 구분하지 못하므로 걷기↔대기 정합의 근거가 아닙니다. 경계 frame의 정합은 해부학적 발 좌표 측정이 아니므로 확인한 경계와 측정하지 않은 전환을 함께 적습니다.

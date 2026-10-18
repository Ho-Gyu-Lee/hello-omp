---
type: Concept
title: Godot 에셋 팩·렌더 정밀도와 에디터 미리보기
description: 표시·충돌·정렬 계약의 분리, 4.7.2 TileMapLayer 원점·정렬 Y, Compatibility 데이터 텍스처 정밀도, 렌더 직전 콜백 스레드, 비저장 미리보기 규칙입니다.
tags: [game, godot, cpp, assets, tilemap, rendering, editor]
timestamp: 2026-10-18T00:00:00Z
---

# Godot 에셋 팩·렌더 정밀도와 에디터 미리보기

상위 개념: [Godot와 C++ 게임 개발](/game/godot-cpp.md)(버전 핀 포함). 에셋 검수·AI 사용 권리·조립 계약은 [공통 에셋 기준](/development/assets-editor.md), 탐색은 [제약·경로 탐색](/development/ai-navigation.md), 고정 표시 프로필은 [렌더링·애니메이션](/development/rendering-animation.md)을 따릅니다.

## 표시·충돌·정렬 계약의 분리

표시 범위·물리 footprint·앞뒤 정렬 키·경로 격자는 서로 다른 계약입니다. 한쪽의 결함을 다른 계약의 확대·삭제로 가리지 않고(예: 가림을 없애려 줄기 충돌을 수관 크기로 넓히거나 정렬 문제를 충돌 확대로 고치지 않음) 각 계약의 출력(exporter·canonical·판정 파일·화면)을 같은 좌표에서 대조합니다. 두 그림의 alpha mask 교집합은 같은 화면 위치를 차지한다는 측정이지 잘못된 정렬의 증거가 아닙니다. 배율·줌·속도 같은 표현 변환을 바꾸면 결합된 항목(걷기 stride·picking 영역·라벨 간격·효과 부착 위치·화면상 속도)을 그 변환에서 다시 측정합니다.

## TileMapLayer와 렌더 (4.7.2)

소스는 엔진 [`ed1daf0b`](https://github.com/godotengine/godot/tree/ed1daf0bf001b61586d9930840f2f1394092c079)의 표기한 파일입니다.

- **아이소메트릭 원점:** 변형 없는 타일 그리기 시작점은 셀 위치 기준 `−texture_size/2 − texture_origin`입니다(`scene/2d/tile_map_layer.cpp` L2768-L2769). 원본에서 셀 중심에 맞출 지면 기준 픽셀이 좌상단 기준 `anchor`이면 `texture_origin = anchor − texture_size/2`이고 양수 y는 그림을 위로 올립니다. 팩의 origin 값을 크기가 같은 다른 타일에 일반화하지 않고 transpose/flip 경로는 따로 대조합니다.
- **y-sort quadrant:** y-sorted `TileMapLayer`는 같은 정렬 Y의 셀을 quadrant CanvasItem으로 묶고 그 원점을 `MODEL_MATRIX`에 전달합니다. 정렬 Y만 필요한 셰이더는 이 값을 쓸 수 있으며 `texture_origin`으로 올라간 그림 픽셀 Y와 지면 정렬 Y를 혼동하지 않습니다. 근사 동률·삽입 순서(`servers/rendering/renderer_canvas_cull.h`)는 실제 GPU 픽셀로 검사합니다.
- **Compatibility 데이터 텍스처:** GLES3 경로는 float-linear 지원이 없으면 RF/RGBAF를 half-float로 변환할 수 있으므로(`drivers/gles3/storage/texture_storage.cpp`) 큰 좌표·정렬 깊이를 보존할 데이터에 요청 형식만 믿지 않습니다. RGBA8로 인코딩하면 색공간 변환·필터링을 끄고 binary32 복원을 실제 셰이더에서 검증하며, `Image::set_pixel`의 RGBA8 저장은 채널×255를 절삭하므로(`core/io/image.cpp`) raw byte를 씁니다.
- **`frame_pre_draw` 스레드:** `RenderingServerDefault::draw`는 메인 스레드 여부를 검사한 뒤 `frame_pre_draw`를 발행하고, 이어 `create_thread`가 참이면 별도 렌더 스레드의 `_draw`를 큐에 넣고 거짓이면 메인 스레드에서 `_draw`를 직접 호출합니다(`servers/rendering/rendering_server_default.cpp` L443-L453). 이름이나 렌더 스레드 설정만으로 신호가 워커에서 나온다고 추정하지 말고 SceneTree를 읽는 콜백은 실제 발행 위치를 확인합니다.

## 비저장 미리보기

저장되지 않는 표시는 실제 소비 경로(에디터 화면과 F5 실행 양쪽)에 적용하고 검증 러너에서만 적용하지 않습니다. [`editor` feature](https://docs.godotengine.org/en/4.7/tutorials/export/feature_tags.html)는 편집·게임 실행을 모두 포함하지만 `Engine.is_editor_hint()`는 편집 문맥만 뜻합니다. owner 없는 표시 자식은 PackedScene 저장에서 제외되므로 pack→instantiate로 원본 참조 보존과 임시 노드·이미지 부재를 확인하고, aspect-fit 이미지를 부모 텍스처 위에 덧그릴 때는 레터박스에 원래 그림이 비치지 않도록 비저장 불투명 배경을 둡니다.

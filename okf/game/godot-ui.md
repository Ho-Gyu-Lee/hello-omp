---
type: Concept
title: Godot UI 입력·텍스트·HUD 표시
description: Godot 4.7.2 입력 전달 순서·장치 ID·Windows 휠 이벤트·한글 폰트·첫 import 오류·캡처 크기 불일치·focus 모양, godot-cpp v10 문자열 인코딩, 실제 렌더 경계 검증 원칙입니다.
tags: [game, godot, cpp, ui, input, font, hud]
timestamp: 2026-10-23T00:00:00Z
---

# Godot UI 입력·텍스트·HUD 표시

상위 개념: [Godot와 C++ 게임 개발](/game/godot-cpp.md)(버전 핀 포함). 공통 UI·어댑터 경계, 포인터 수명, 텍스트 배치, 실제 입력·화면 검증과 번역 원문 언어는 [UI 입력·표시 검증과 지역화](/development/ui-input.md)를 따릅니다. 아래는 Godot API·버전 특정 계약이며 엔진 소스는 [`ed1daf0bf`](https://github.com/godotengine/godot/tree/ed1daf0bf)(4.7.2)입니다.

## 입력 (4.7.2)

- 전역 `Input` 폴링 상태는 `accept_event`·`set_input_as_handled`로 차단되지 않고 CanvasItem의 `z_index`는 Control 입력 처리 순서를 정하지 않으므로, 모달 중 폴링 이동이 새지 않는지와 겹친 UI의 실제 pick을 확인합니다. [Input](https://docs.godotengine.org/en/4.7/classes/class_input.html)
- **합성 mouse:** 합성 mouse가 원본 touch보다 먼저 전달되므로 수동 터치와 native GUI를 함께 쓸 때 원본 touch만 소비해서는 native Button의 중복 클릭을 막지 못합니다. 직접 소유하는 제스처의 합성 press/motion/release도 GUI 이전에 차단하고 텍스트 컨트롤의 내부 스크롤바 같은 자손은 native 경로로 남깁니다. (엔진 `core/input/input.cpp`, `scene/gui/rich_text_label.cpp`)
- **Windows 휠:** Windows backend는 휠에도 press 뒤 release를 전달하므로 스모크가 press만 주입하면 Viewport의 mouse focus mask가 남아 다른 버튼 클릭까지 실패할 수 있습니다. 이 검증기 결함을 제품의 좌표 보정으로 해결하지 않고 실제 OS 입력과 같은 이벤트 쌍·순서로 확인합니다. (엔진 `platform/windows/display_server_windows.cpp`, `scene/main/viewport.cpp`)
- 입력 소유권이 넘어가는 경계(포커스 상실 등)에서는 release를 놓칠 수 있으므로 복귀 시 각 키의 새 non-echo press만 인정하고 한 키로 다른 held key를 재활성화하지 않습니다.
- 4.7부터 마우스·키보드 이벤트의 `device`는 0이 아니라 `InputEvent.DEVICE_ID_MOUSE`(32)·`DEVICE_ID_KEYBOARD`(16)이고 조이패드가 0일 수 있으므로, `device == 0`으로 키보드·마우스를 판별하지 않고 이벤트 타입이나 이 상수로 비교합니다. 스크립트로 만든 `InputEventKey.new()`·`InputEventMouseButton.new()`도 기본값이 16·32입니다([4.7 업그레이드](https://docs.godotengine.org/en/4.7/tutorials/migrating/upgrading_to_godot_4.7.html), [GH-116274](https://github.com/godotengine/godot/pull/116274), 4.7.2 headless 실행 확인 2026-10-23).
- `gui/common/show_focus_state_on_pointer_event`의 4.7 기본값 1은 마우스·터치로 얻은 포커스에 텍스트 입력 컨트롤만 focus 모양을 그리므로 버튼의 상속 focus 테두리는 키보드·게임패드 포커스에서만 보입니다. [ProjectSettings](https://docs.godotengine.org/en/4.7/classes/class_projectsettings.html)(확인 2026-10-15)

## 표시 경계

선언된 rect·advance 폭·API 허용 길이는 실제로 그려지는 경계(ink·외곽선·그림자·crop)와 다릅니다. 표시는 실제 렌더러 픽셀과 viewport rect를 관찰해 판정합니다(검증 원칙은 [워크플로](/workflow.md#검증)). 예:

- 글꼴 교체·`tnum`은 숫자 폭을 바꾸므로 고정 상자 글자를 허용되는 가장 긴 값까지 다시 측정합니다. 긴 이름은 `Label`의 minimum-size가 고정 HUD 프레임 밖으로 키우므로 clipping/ellipsis·`max_lines_visible=1`을 지정합니다.
- CanvasLayer로 옮긴 full-rect HUD가 offset-only override로 0×0이 되지 않는지, 지도 마커가 TextureRect의 실제 aspect-fit/covered 사각형 기준인지, 같은 줄 컨트롤의 StyleBox가 모든 상태(normal·hover·pressed·disabled·focus)에서 같은지, `TabContainer`가 탭 전환 뒤에도 컨테이너 사각형·`get_combined_minimum_size()`를 앵커 영역 안에 두는지 확인합니다.
- **캡처 배율 (4.7.2 관찰, 2026-10-12):** 창 크기를 여러 번 바꾼 실제 창에서 `root.get_texture().get_size()`는 854×480이었지만 `root.size`와 `get_image()` 캡처는 1280×720이었습니다. 배율은 캡처 이미지 크기 ÷ `get_visible_rect().size`로 구하며, 1보다 작으면 얇은 선 폭 차이가 같은 픽셀로 그려질 수 있어 1:1 `SubViewport`에서 재거나 한계를 보고합니다.

## 폰트·문자열

- **한글 폰트 (4.7.2):** 기본 프로젝트 폰트(Open Sans SemiBold)에는 한글이 없고(`has_char` false 확인) `allow_system_fallback` 기본값 때문에 한글이 OS 글꼴로 대체되어 플랫폼마다 글꼴·폭이 달라지며, 공식 문서는 Android의 시스템 글꼴 로딩을 신뢰할 수 없다고 적습니다. 한글·라틴을 함께 가진 폰트를 번들해 Theme 기본 폰트나 `gui/theme/custom_font`로 지정하고 `has_char`로 확인합니다. [Godot 폰트](https://docs.godotengine.org/en/4.7/tutorials/ui/gui_using_fonts.html)
- **첫 import 오류 (4.7.2, 관찰 2026-10-12):** `gui/theme/custom_font`에 번들 폰트를 지정한 프로젝트는 `.godot/` 캐시가 없는 새 checkout의 첫 `--headless --import`에서 폰트 import 전에 설정을 읽어 `Error loading custom project font` 등 오류를 내고 종료 코드 0으로 끝나며 두 번째 실행부터 오류가 없습니다. 새 clone 검증은 이를 결함으로 오인하지도 숨기지도 말고 두 번째 import 로그까지 남깁니다.
- **godot-cpp v10 문자열:** `Ref<InputEvent>`를 쓰는 가상 입력 메서드의 클래스는 `input_event.hpp`를 포함해 타입을 완전하게 합니다. 확인한 MSVC 조합에서 `const String + "literal"`은 String/StringName 오버로드가 모호하므로 피연산자를 명시합니다. **ASCII는 `String("literal")`, UTF-8 한글·기호는 `String::utf8("문구 · 기호")`**를 쓰며 `String(const char*)`는 Latin-1 경로이므로 컴파일되는 암시적 연결도 중점 같은 기호를 깨뜨릴 수 있습니다. [핀의 char_string.cpp](https://github.com/godotengine/godot-cpp/blob/507ed9d840c01a3c5b2a39af8bb4000bfac30bf5/src/variant/char_string.cpp#L71-L95)

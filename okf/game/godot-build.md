---
type: Concept
title: godot-cpp 빌드·등록·디버깅·export와 실행 검증
description: godot-cpp v10 핀의 빌드 옵션·manifest 매칭·hot reload, 시그널 반환값과 동기 콜백 재진입, macOS export, 프로젝트 설정·vendor 바이트, headless 검증 차이와 Windows 콘솔 래퍼 실행의 자원 측정 대상을 정리합니다.
tags: [game, godot, cpp, gdextension, build, scons, export, headless]
timestamp: 2026-10-22T00:00:00Z
---

# godot-cpp 빌드·등록·디버깅·export와 실행 검증

상위 개념: [Godot와 C++ 게임 개발](/game/godot-cpp.md)(버전 핀 포함). 소스 근거는 godot-cpp [`507ed9d8`](https://github.com/godotengine/godot-cpp/tree/507ed9d840c01a3c5b2a39af8bb4000bfac30bf5)(10.0.0-stable)와 엔진 [`ed1daf0b`](https://github.com/godotengine/godot/tree/ed1daf0bf001b61586d9930840f2f1394092c079)(4.7.2-stable)의 표기한 파일입니다. 종료 코드 0이나 빌드 성공만으로 로드·동작·성능을 판정하지 않습니다([워크플로](/workflow.md)).

## API·ABI·툴체인 호환성

- **v10 API 선택:** `scons api_version=4.7`처럼 명시하거나 프로젝트의 `SConscript("godot-cpp/SConstruct", {"api_version": "4.7"})`에서 지정하며, 바인딩 버전 `10.0.0`을 `api_version`에 넣지 않습니다. (`README.md`)
- **커스텀 엔진:** 대상 editor의 `godot --dump-extension-api`로 만든 JSON을 `custom_api_file`로 지정하며 이 옵션이 `api_version`보다 우선합니다(`tools/godotcpp.py`). SCons 문서는 JSON이 실행 파일 디렉터리에 생성된다고 적지만 [4.7 CLI 참조](https://docs.godotengine.org/en/4.7/tutorials/editor/command_line_tutorial.html)는 현재 디렉터리라고 적으므로 실제 위치를 확인해 절대 경로로 넘깁니다.
- **C++:** 이 핀은 C++17 플래그를 설정하고 예외 처리를 기본 비활성화합니다. (`tools/common_compiler_flags.py`)

## 빌드 옵션·manifest·hot reload

- `template_debug`는 editor·debug export용, release export에는 `template_release`를 따로 빌드합니다. `debug` feature와 네이티브 심볼은 별개이므로 breakpoint용 빌드에는 `debug_symbols=yes`를 명시합니다. `dev_build=yes`는 `.dev`, `precision=double`은 `.double`, `threads=no`는 `.nothreads`를 출력 suffix에 붙이므로 산출물 이름과 manifest 경로를 맞춥니다. (`tools/godotcpp.py`)
- **manifest matcher (4.7.2):** feature가 모두 충족된 key 중 **tag 수가 가장 많은 항목**을 고르고 동률이면 먼저 발견한 항목을 유지합니다. 공식 문서의 "순서대로 매칭한다"보다 이 소스 동작이 우선하므로 key 중복·동률을 만들지 않습니다. `compatibility_minimum`은 제품 지원 하한 선택이지 `api_version=4.7`의 요구가 아닙니다. (엔진 `core/extension/gdextension_library_loader.cpp`)
- **hot reload:** v10 핀은 `use_hot_reload` 기본값이 false이므로 `use_hot_reload=yes`와 manifest의 `reloadable=true`를 함께 적용해야 합니다. manifest만 켜면 된다는 이전 예제는 v10에 맞지 않습니다. (`tools/godotcpp.py`)

## 등록·프로퍼티·시그널과 이름 계약

소유 C++ 이름·배치는 [언어 공통 코딩 스타일](/language-style.md)과 [C/C++ 전용 코딩 규칙](/language-style-c-cpp.md)을 따르고, 소비자가 있는 외부 이름(`_bind_methods`·`D_METHOD`·property·signal·NodePath·배포한 ABI entry symbol)은 스타일 변경만으로 바꾸지 않습니다.

- `BIND_CONSTANT`·`BIND_ENUM_CONSTANT`는 매크로 인수의 C++ 식을 문자열화해 script 이름으로 쓰고 정수 값을 요구합니다. C++ 내부 `enum class` 이름과 script 이름을 분리하려면 `ClassDB::bind_integer_constant`에 이름과 정수 변환 값을 전달하며, 배포한 상수 이름은 호환 계약입니다. (`include/godot_cpp/core/class_db.hpp`)
- **시그널 반환값 (4.7.2, 확인 2026-09-27):** `Object::emit_signalp`는 등록된 시그널이어도 연결 기록이 없으면 `ERR_UNAVAILABLE`, `set_block_signals(true)`이면 `ERR_CANT_ACQUIRE_RESOURCE`를 반환하므로 `emit_signal(...) != OK`를 무조건 오류로 처리하면 정상적인 장면 초기화도 실패로 보고합니다. 알림이 선택적이면 `!is_blocking_signals() && has_connections(signalName)`일 때 발행하며, `has_connections`는 시그널 존재도 검사해 오타를 정상 무수신으로 취급하지 않습니다. (엔진 `core/object/object.cpp` L1185-L1211, L1613-L1630)
- **동기 콜백 재진입:** `hide()`·`show()`·포커스 이동·signal 발행은 사용자 콜백을 즉시 실행해 상태·수명·저장소를 바꿀 수 있습니다. 전환 결과는 알림 전에 확정해 저장하고 콜백 이후의 포인터·현재 대상·현재 창은 다시 획득·확인합니다. 예: 전환 중 보관한 컨테이너 원소 포인터는 콜백의 `push_back`으로 무효화되며 `ObjectID`로는 막지 못합니다.

## macOS 디버깅과 export

- 게임 C++ breakpoint는 **확장을 로드하는 Godot 프로세스**에 붙입니다. 공식 notarized editor는 attach용 `get-task-allow`를 기본 포함하지 않으므로 [macOS 디버깅 지침](https://docs.godotengine.org/en/4.7/engine_details/development/debugging/macos_debug.html)대로 재서명한 개발용 복사본이나 직접 빌드한 debug editor를 씁니다.
- **export preset (4.7.2):** `binary_format/architecture` 기본값은 `universal`이며 x86_64 라이브러리가 없어도 export가 `No "x86_64" library found` 경고만 남기므로 경고를 실패로 처리하고, arm64 전용 manifest이면 preset을 `arm64`로 지정합니다. (엔진 `platform/macos/export/export_plugin.cpp`, `editor/export/gdextension_export_plugin.h`)

## 프로젝트 설정과 에디터 도구 의존성

- **`override.cfg` (4.7.2):** 에디터는 읽지 않습니다. `Main::setup`이 `editor` 값을 `ProjectSettings::setup`의 `p_ignore_override`로 전달하고 참이면 override를 읽지 않으므로 에디터 addon 설정 분리 수단이 될 수 없습니다. (엔진 `main/main.cpp`, `core/config/project_settings.cpp`)
- addon 활성화와 helper autoload 등록이 `ProjectSettings.save()`를 호출하면 분리했던 로컬 개발 의존성이 추적 설정에 되돌아올 수 있으므로 import/editor/실제 Main 실행 뒤 저장된 설정을 확인합니다. addon의 필수 포함 여부는 사용자의 의존성 정책입니다.
- **바이트 정체성:** 외부 소스는 버전 문자열이 아니라 출처 commit·파일 hash와 설치 바이트로 대조합니다. 예: Windows 줄바꿈 변환은 원본 byte hash를 바꾸므로 필요한 vendor 경로만 `.gitattributes`의 `-text`로 보존하고 전역 Git 설정은 바꾸지 않습니다.

## 검증 환경과 제품 실행 경로

검증기가 제품의 진행을 막거나 실행 경로를 바꾸면 그 결과는 제품의 증거가 아닙니다.

- `RenderingServer.frame_post_draw`를 기다린 뒤 준비를 시작하는 제품을 headless로 검사하면 headless는 창 그리기를 진행하지 않으므로, 검증 루프에서 `RenderingServer.force_draw(false)` 등으로 draw 경계를 진행시켜야 합니다. 계속 `LOADING`이고 준비 시작 계측이 0이면 timeout을 늘리거나 제품 초기화를 우회하기 전에 이 차이를 확인합니다. (엔진 `main/main.cpp` L5080-L5097, `servers/display/display_server_headless.h` L141)
- 무거운 동기 검사를 실시간 세션의 입력 앞에 몰아 넣는 검증기는 liveness를 만료시킬 수 있으므로 코어/직렬화 회귀와 실제 입력 스모크의 실행 경계를 분리합니다.
- **Windows `*_console.exe` (4.7.2):** 게임은 같은 폴더의 GUI exe가 콘솔 런처의 자식 프로세스로 실행하므로(런처가 `CreateProcessW`로 띄워 Job Object에 넣음) 런처 PID의 CPU·메모리는 게임 수치가 아닙니다. 프로세스 자원은 `ParentProcessId`가 런처 PID인 자식 Godot 프로세스에서 잽니다. (엔진 [`platform/windows/console_wrapper_windows.cpp`](https://github.com/godotengine/godot/blob/4.7.2-stable/platform/windows/console_wrapper_windows.cpp) L103-L158)

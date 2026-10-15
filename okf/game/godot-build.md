---
type: Concept
title: godot-cpp 빌드·등록·디버깅·export와 실행 검증
description: godot-cpp 확장의 API·ABI 호환성, SCons 빌드와 로드 경로, 클래스 등록·시그널·이름 계약, 디버깅·export, 프로젝트 설정·addon 의존성과 smoke 절차를 정리합니다.
tags: [game, godot, cpp, gdextension, build, scons, abi, export, debugging, macos, smoke-test]
timestamp: 2026-10-15T00:00:00Z
---

# godot-cpp 빌드·등록·디버깅·export와 실행 검증

상위 개념: [Godot와 C++ 게임 개발](/game/godot-cpp.md) · 버전 핀과 [검증 범위](/game/godot-cpp.md#검증-범위와-공개-근거)를 함께 따릅니다.

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

`compatibility_minimum="4.7.2"`는 이 예제의 **제품 지원 하한 선택**입니다. `api_version=4.7` 자체가 4.7.2를 요구한다는 의미가 아닙니다. 더 낮은 엔진을 지원하려면 실제 API와 동작을 확인하고 둘을 함께 설정합니다. 4.7.2 소스는 feature가 모두 충족되는 key 중 **tag 수가 가장 많은 항목**을 선택하고, 같은 tag 수에서는 먼저 발견한 항목을 유지합니다. 공식 manifest 설명의 "순서대로 매칭한다(Entries are matched in order)"는 문구보다 이 고정 소스 동작을 우선하며, key 중복·동률은 만들지 않습니다. [핀의 library matcher](https://github.com/godotengine/godot/blob/ed1daf0bf001b61586d9930840f2f1394092c079/core/extension/gdextension_library_loader.cpp) manifest는 라이브러리 로드뿐 아니라 export에 포함할 대상 선택에도 사용됩니다. 필요한 외부 동적 라이브러리는 `[dependencies]`에 선언하고 macOS 앱에서는 `Contents/Frameworks` 배치를 확인합니다. [manifest 계약](https://docs.godotengine.org/en/4.7/engine_details/engine_api/gdextension/gdextension_file.html)

**로드 순서:** 프로젝트 검색/import → `.gdextension` 발견 → feature에 맞는 라이브러리 로드 → `entry_symbol` 호출 → 초기화 수준별 클래스 등록 → scene/resource의 클래스 인스턴스화입니다. 누락된 library, 다른 CPU, 미해결 dependency, entry symbol 오타, 클래스 등록 누락을 이 순서로 조사합니다.

hot reload는 기본 성공 조건으로 삼지 않습니다. v10 핀은 `use_hot_reload` 기본값이 false이므로 사용하려면 바인딩/확장에 `use_hot_reload=yes`와 manifest의 `reloadable=true`를 함께 적용하고 객체·스레드 정리 동작을 검증합니다. manifest만 켜면 충분하다는 이전 예제를 그대로 적용하지 않습니다. 불확실할 때는 editor와 실행 중 게임을 종료하고 재빌드·재실행합니다. [핀의 hot-reload 옵션](https://github.com/godotengine/godot-cpp/blob/507ed9d840c01a3c5b2a39af8bb4000bfac30bf5/tools/godotcpp.py)

## 등록·프로퍼티·시그널과 이름 계약

작은 Resource 예제입니다. `src/CounterData.h`는 값을 저장하고 실제 변경 때 신호를 발행합니다. 소유 C++ 이름·배치는 [언어 공통 코딩 스타일](/language-style.md)과 [C/C++ 전용 코딩 규칙](/language-style-c-cpp.md)을 따르며 `_bind_methods`, ABI 진입 심볼, 바인딩 문자열·엔진 API 이름은 계약대로 보존합니다.

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

- [ ] **버전/빌드:** [확인 기준과 버전 고정](/game/godot-cpp.md#확인-기준과-버전-고정)의 핀 기록 항목에 더해 실제 `godot --version` 출력, target, CPU를 기록합니다.
- [ ] **import/load:** headless import 로그에서 확장 라이브러리·entry·API 오류가 없는지 확인합니다. 종료 코드 0만으로 로드 성공을 판정하지 않습니다.
- [ ] **editor:** CounterData 같은 등록 클래스가 실제 생성 가능하고 Inspector property의 변경→저장→재시작 후 값이 보존되는지 확인합니다. Node 확장이면 scene에 배치하여 `_ready`와 게임 경로도 실행합니다.
- [ ] **게임 동작:** 실제 확장 메서드를 호출하고 property/signal 소비자가 관찰하는 상태를 확인합니다. 물리 처리·입력·scene 전환·객체 제거 경로를 지나갑니다. headless 실행만으로 시각 출력·오디오·입력 검증을 대체하지 않습니다.
- [ ] **수명/스레드:** scene 재진입, `queue_free` 뒤 deferred 결과, 워커 취소, Resource 공유/복제, 종료 시 누수·dangling 접근을 확인합니다.
- [ ] **native debug:** entry와 게임 코드 breakpoint가 실제로 멈추고 올바른 library와 스택을 확인할 수 있어야 합니다.
- [ ] **export:** debug와 release 앱을 각각 실행하여 라이브러리가 포함·로드되고 같은 기능이 동작하는지 확인합니다. 모든 지원 OS/CPU에서 별도 빌드·실행하며 Web/모바일은 해당 SDK와 export 제약까지 확인합니다. Web의 전송·스레드·GDExtension 지원 조건은 [Web export 항목](/game/godot-simulation.md#전투실시간-네트워크4xmmorpg의-부하)을 따릅니다.
- [ ] **server:** 서버를 제공한다면 dedicated preset/headless 산출물에 실제 클라이언트를 연결하고 권위 상태·재접속·순서/손실 경계를 검증합니다. headless 시작만으로 서버 기능 검증을 완료하지 않습니다.
- [ ] **성능:** [성능 수락 기준](/development/runtime-diagnostics.md#성능-수락-기준)의 부하·release 비교·꼬리 지연·과부하·동작 보존 기준으로 실제 게임 코어를 측정합니다. C++ 빌드 성공이나 빈 headless 실행을 성능 개선의 증거로 삼지 않습니다.

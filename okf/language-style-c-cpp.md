---
type: Rule
title: C/C++ 전용 코딩 규칙
description: 언어 공통 코딩 스타일에 더해 C/C++에만 적용하는 기본 표준·표기·switch·접근 순서, C 이름·상수, include·헤더 보호·정적 등록, Godot 확장 이름 선택입니다.
tags: [rule, c, cpp, coding-style, header, namespace, godot]
timestamp: 2026-10-18T00:00:00Z
---

# C/C++ 전용 코딩 규칙

상위 개념: [언어 공통 코딩 스타일](/language-style.md). C/C++에만 더하는 선택이며 새로 작성하는 코드에 적용합니다. 기존 코드를 이 기본값으로 현대화하라는 지시가 아니며, 그런 변경은 [보존 원칙](/coding-style.md#간결성-over-engineering-금지)과 요청 범위를 따릅니다.

## 표준과 표기

- **언어 표준:** 새 프로젝트의 C++ 기본 표준은 C++17, 새 C 코드의 기본 문법은 C99입니다. 프로젝트가 선언한 표준이 우선하며, 더 낮으면 그 표준의 표현을, C++20 기능은 프로젝트가 선언한 경우에만 씁니다. C++17은 godot-cpp 10.0.0 핀이 요구합니다([빌드 정본](/game/godot-build.md)).
- **포인터·참조·const:** `Type* pointer`, `Type& reference`, `const Type* pointer`처럼 `*`·`&`를 타입 쪽에 붙이고 `const`는 타입 앞에 둡니다. 선언당 변수는 하나(`int* first, second;` 금지)이며 복잡한 함수 포인터는 타입 별칭을 씁니다.
- **템플릿·std:** 템플릿 타입 매개변수는 `typename`이 기본입니다. 구현 파일에서도 `std::`를 유지하고 긴 타입만 범위가 제한된 `using` 선언·별칭으로 줄입니다.

## 배치

- **switch:** `case`·`default`는 switch 중괄호와 같은 깊이, 본문은 한 단계 들여씁니다. 여러 문장·블록을 가진 case 경로 사이는 빈 줄 하나로 구분하고, 본문 없는 연속 레이블은 같은 경로로 붙여 둡니다.
- **클래스:** `public` → 필요한 경우에만 `protected` → `private` 순이며, 접근 지정자는 클래스 중괄호와 같은 깊이, 멤버는 한 단계 들여씁니다. public 타입·상수 → 생성/소멸 → 사용자가 호출하는 메서드 → private 보조 메서드·상태 순으로 정리하고, 메서드 선언과 데이터 멤버 선언은 섞지 않고 그 사이에 빈 줄 하나를 둡니다.

## C 전용 이름·선언

- **타입:** 소유한 공개 타입은 tag와 typedef 이름을 같게 하고 프로젝트 접두사를 붙입니다(`typedef struct NsBuffer { ... } NsBuffer;`). 포인터 typedef로 포인터·const 의미를 숨기지 않습니다(외부 핸들 타입 예외).
- **함수:** 공개 함수는 프로젝트 접두사 + 동사 `PascalCase`(`NsBufferCreate`), 내부 함수는 `static` + `PascalCase`입니다. 프로젝트 전체에 접두사 관례가 있으면 내부 함수에도 따릅니다. 여러 자원을 정리할 때는 범위가 분명한 `goto cleanup`을 허용하며 라벨은 `camelCase`입니다.
- **상수:** 정수 상수는 접두사 붙인 `UPPER_SNAKE_CASE` enum이 기본입니다(`enum { NS_DEFAULT_PORT = 7777 };`). 전처리기가 값을 읽어야 하거나 `int` 범위를 넘을 때만 접두사 매크로로 정의하고, 정수가 아닌 읽기 전용 객체는 `const`에 대문자 이름을 씁니다. C enum은 `NsConnectionState`·`NS_CONNECTION_STATE_CONNECTED`처럼 프로젝트·타입 접두사를 붙입니다.
- **전역:** 공개 전역 상태는 `gNsLogLevel`, 내부 static 상태는 `sPascalCase`, 내부 연결 고정 상수는 `UPPER_SNAKE_CASE`입니다. 불필요한 공개 전역보다 함수 인수·컨텍스트 구조체를 씁니다.

## 헤더·소스·공개 경계

- **Include 순서:** 짝 헤더 → 프로젝트 → 외부 라이브러리 → 표준 라이브러리 → 플랫폼 순, 그룹 사이 빈 줄 하나, 그룹 안은 경로순입니다. 자체 헤더는 `"..."`, 설치된 외부·표준·플랫폼 헤더는 `<...>`입니다. 플랫폼이 요구하는 순서나 사전 컴파일 헤더가 있으면 그 계약이 우선합니다.
- **헤더 보호:** 새 헤더는 `#pragma once`가 기본입니다(비표준이지만 MSVC·Clang·GCC가 지원하고 godot-cpp와 일치). 기존 프로젝트가 include guard를 쓰거나 툴체인이 미지원으로 확인된 경우에만 guard를 쓰며 두 방식을 중복하지 않습니다.
- **정적 등록:** 다른 번역 단위의 동적 초기화 순서에 레지스트리 사용을 의존하지 않습니다. 자기 등록 객체만 든 정적 라이브러리의 object file은 링크되지 않을 수 있으므로 명시적 등록 경로나 해당 라이브러리 한정 링크 옵션을 쓰고 release 링크에서 필요한 타입이 생성되는지 확인합니다. 전역 dead-code 제거를 끄지 않습니다([초기화](https://en.cppreference.com/w/cpp/language/initialization), [MSVC `/WHOLEARCHIVE`](https://learn.microsoft.com/en-us/cpp/build/reference/wholearchive-include-all-library-object-files), 확인 2026-10-15).
- **Godot 확장:** 소유한 프로젝트의 새 C++ 메서드는 `PascalCase`이며 godot-cpp 자체의 `snake_case`를 강제하지 않습니다(godot-cpp 저장소를 수정할 때는 그 규칙). 엔진 훅과 이미 쓰이는 바인딩·script-facing 이름은 보존합니다. 수명·등록·이름 계약은 [Godot Scene·Resource 수명](/game/godot-runtime.md)·[godot-cpp 빌드·실행 검증](/game/godot-build.md)·[Godot와 C++ 게임 개발](/game/godot-cpp.md)을 먼저 따르고 일반 C++ 기본값으로 추정하지 않습니다.

C++ 표기와 배치 선택을 한 번에 보인 예입니다(`GetBaseSpeed` 등 주변 이름은 용례).

```cpp
// PlayerController.cpp
#include "PlayerController.h"

#include "Game/PlayerRegistry.h"

#include <vector>

namespace Northstar
{
    class PlayerState
    {
    public:
        void Update(const PlayerController* player);

    private:
        float mPositionX = 0.0f;
        float mPositionY = 0.0f;

        int mHealth = 100;
    };

    int GetSpeed(const PlayerController& player, MoveMode mode)
    {
        int speed = 0;
        switch (mode)
        {
        case MoveMode::IDLE:
        case MoveMode::STUNNED:
            speed = 0;
            break;

        case MoveMode::RUN:
            speed = player.GetBaseSpeed();
            speed *= 2;
            break;
        }

        return speed;
    }
} // namespace Northstar

// Bad: int* first, second;   Widget const* widget;
```

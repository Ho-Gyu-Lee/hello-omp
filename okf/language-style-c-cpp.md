---
type: Rule
title: C/C++ 전용 코딩 규칙
description: 언어 공통 코딩 스타일에 더해 C/C++ 코드를 작성·수정할 때만 적용하는 배치·선언, C++·C 언어 규칙, 헤더·공개 경계 기준입니다.
tags: [rule, c, cpp, coding-style, readability, ownership, raii, header, namespace, initialization]
timestamp: 2026-10-12T00:00:00Z
---

# C/C++ 전용 코딩 규칙

상위 개념: [언어 공통 코딩 스타일](/language-style.md)

## 배치·선언 (C/C++)

- C와 C++ 모두 `Type* pointer`, `Type& reference`, `const Type* pointer`처럼 `*`·`&`를 타입 쪽에 붙입니다. C에는 참조가 없습니다. **선언당 변수는 하나**로 하여 `int* first, second;`의 오해를 없앱니다. 함수 포인터처럼 문법이 복잡하면 적절한 타입 별칭을 사용합니다.
- `switch`의 `case`·`default`는 switch 중괄호와 같은 깊이, 본문은 한 단계 들여씁니다. 여러 문장·블록을 가진 case 경로 사이는 빈 줄 하나로 구분하되, 본문 없는 연속 레이블은 같은 경로로 붙여 둡니다. 각 경로는 명시적으로 `break`·`return` 등으로 끝냅니다. 동작을 실행한 뒤 다음 case로 넘어가는 의도적인 fallthrough만 표기하며 C++17은 `[[fallthrough]];`를 사용합니다. C99는 프로젝트 공통 헤더의 `NS_FALLTHROUGH;` 하나를 사용합니다. 먼저 `#if defined(__has_attribute)`로 감싼 뒤 안쪽의 별도 `#if __has_attribute(fallthrough)`가 참이면 `__attribute__((fallthrough))`, 그 밖에는 빈 문장으로 확장합니다. 정의 존재 검사와 함수형 매크로 검사를 하나의 `&&` 식으로 합치지 않습니다. 기존 프로젝트 표기가 있으면 그것을 따릅니다. case별 지역 변수 수명에는 별도 블록을 둡니다. 닫힌 enum을 모두 다룰 때는 불필요한 `default`로 누락 경고를 숨기지 않습니다. 외부 정수·역직렬화 값처럼 유효하지 않은 값이 들어오는 경계는 따로 검증하거나 오류 경로를 둡니다.
- 클래스는 `public`, 필요한 경우에만 `protected`, `private` 순서로 씁니다. 접근 지정자는 클래스 중괄호와 같은 깊이, 멤버는 한 단계 들여씁니다. public 타입·상수, 생성/소멸, 사용자가 호출하는 메서드, private 보조 메서드·상태 순으로 정리합니다. 메서드 선언과 데이터 멤버 선언을 뒤섞지 않으며 그 사이에는 빈 줄 하나를 둡니다. `protected`·확장점의 추가 기준은 6장의 공개와 private API를 따릅니다.
- **C++ 선언 순서는 가독성보다 초기화·수명·레이아웃 계약이 우선입니다.** 비정적 필드는 선언 순서로 초기화되고 역순으로 소멸하므로, 의존 대상이 먼저 생성되고 의존하는 멤버보다 나중에 소멸하도록 배치합니다. 생성자 초기화 목록도 선언 순서와 맞춥니다. 기존 멤버의 이동·중간 삽입 전 모든 생성자·기본 멤버 초기화자·소멸 의존성, 위 순서 계약과 근거가 있는 캐시 라인·패딩·hot/cold 배치를 확인합니다. 확인되지 않거나 계약을 바꾸는 재배치는 하지 않고 기존 순서 안에서 빈 줄·필요한 주석으로 구분합니다. 성능 근거 없이 타입 크기·알파벳순 정렬로 관련 멤버를 흩뜨리지 않습니다.
- **초기화 경로를 명확히 합니다.** 일반 C++ 클래스의 멤버는 유효한 기본 멤버 초기화자 또는 모든 생성자의 초기화 목록으로 초기화하고, 이미 올바르게 기본 생성되는 타입에 중복 초기화를 강제하지 않습니다. 다만 초기화자·생성자 추가 전에는 trivial·aggregate 여부와 초기화 비용의 계약도 확인합니다. union은 활성 멤버의 수명을 지키며, 특성 검사·대량 저장소 등의 요구가 있으면 기존 타입 특성을 유지한 생성 경로에서 값을 설정합니다. C 구조체도 각 생성 경로에서 유효한 값을 설정합니다. 출력 버퍼처럼 초기화를 미루는 경로는 읽기 전 쓰기가 보장되는 계약을 명시하며, 편의상 `0`·`nullptr`를 넣어 필수 초기화 누락을 숨기지 않습니다.

```cpp
// Good
namespace Northstar
{
    void UpdatePlayer(PlayerController* player, bool isPaused)
    {
        if (player == nullptr || isPaused)
        {
            return;
        }

        const int playerId = player->GetPlayerId();
        LogPlayer(playerId);
    }

    bool IsConnected(ConnectionState state)
    {
        switch (state)
        {
        case ConnectionState::DISCONNECTED:
            return false;
        case ConnectionState::CONNECTED:
            return true;
        }

        return false;
    }
} // namespace Northstar

// Bad
// if(player) UpdatePlayer(player, false);
// int* first, second;
// const int playerId;
// playerId = player->GetPlayerId();
```

예제의 `LogPlayer`처럼 주변 시스템이 제공하는 이름은 용례를 위한 것이며 해당 기능을 새로 도입하라는 뜻이 아닙니다.

네임스페이스 들여쓰기는 이름의 구성 요소 수가 아니라 실제 블록 깊이를 기준으로 합니다. 다음은 구현 파일의 예입니다.

```cpp
// Good: C++17 단일 정의는 한 단계, 내부 익명 블록은 한 단계 더 들여씁니다.
namespace Northstar::Net
{
    namespace
    {
        constexpr int DEFAULT_PORT = 7777;
    }
}

// Bad: 이름 있는 블록과 익명 블록의 내용 모두 들여쓰기가 빠졌습니다.
namespace Northstar::Net
{
namespace
{
constexpr int DEFAULT_PORT = 7777;
}
}
```

제어문 간격 예시입니다. 호출 이름은 주변 시스템이 제공하는 동작을 나타냅니다.

```cpp
// Good: 독립된 제어문 사이에 빈 줄을 둡니다.
if (shouldMove)
{
    UpdateMovement();
}

if (shouldAttack)
{
    UpdateAttack();
}
else
{
    UpdateIdle();
}

while (HasPendingEvents())
{
    ProcessNextEvent();
}

PublishState();

// Bad: 서로 다른 제어문을 붙여 쓰지 않습니다.
if (shouldMove)
{
    UpdateMovement();
}
if (shouldAttack)
{
    UpdateAttack();
}
while (HasPendingEvents())
{
    ProcessNextEvent();
}
```

멤버 배치 예시입니다. 아래는 새 클래스의 선언 예시이며 기존 타입을 그대로 재배열하라는 지시가 아닙니다.

```cpp
// Good: 위치·이동과 전투 상태를 각각 묶습니다.
class PlayerState
{
public:
    void Update(float deltaSeconds);

private:
    float mPositionX = 0.0f;
    float mPositionY = 0.0f;
    float mMoveUnitsPerSecond = 0.0f;

    int mMaxHealth = 100;
    int mHealth = mMaxHealth;
    bool mIsAttacking = false;
    float mAttackCooldownSeconds = 0.0f;
};

// Bad: 타입별 정렬로 공격 상태와 공격 대기 시간이 흩어져 있습니다.
class ScatteredPlayerState
{
private:
    float mPositionX = 0.0f;
    float mPositionY = 0.0f;
    float mMoveUnitsPerSecond = 0.0f;
    float mAttackCooldownSeconds = 0.0f;

    int mMaxHealth = 100;
    int mHealth = mMaxHealth;

    bool mIsAttacking = false;
};
```

조건식 예시입니다. `CombatState`는 `isAlive`·`isStunned`·`hasAmmo`·`isMelee` 불리언 필드를 가진 데이터 타입을 가정합니다. 같은 결과와 널 검사 순서를 유지하면서 중첩된 값 선택을 명시적인 흐름으로 바꿉니다.

```cpp
// Good: 널 검사를 통과한 뒤에만 상태를 읽고, 실패 조건을 먼저 처리합니다.
bool CanAttack(const CombatState* state)
{
    if (state == nullptr)
    {
        return false;
    }

    if (!state->isAlive || state->isStunned)
    {
        return false;
    }

    return state->hasAmmo || state->isMelee;
}
```

```cpp
// Bad: 한 줄에 중첩된 조건 연산자를 쌓아 판단 순서를 숨깁니다.
bool CanAttack(const CombatState* state)
{
    return state != nullptr ? state->isAlive ? !state->isStunned ? state->hasAmmo || state->isMelee : false : false : false;
}
```

## 4. C++ 표현·수명·라이브러리

### 값, const, constexpr, auto

- 변경하지 않는 지역 값은 `const`, 객체 상태를 변경하지 않는 메서드는 `const`로 표현합니다. 타입 앞의 `const`를 기본으로 사용합니다. `const Widget*`는 pointee가 읽기 전용이고 `Widget* const`는 포인터 자체가 읽기 전용이라는 차이를 유지합니다. `const`는 스레드 안전이나 소유권을 보장하지 않습니다.
- 실제 고정 상수·상수식에 `constexpr`를 사용합니다. 모든 함수에 기계적으로 붙이지 않으며 `constexpr` 함수도 런타임에 호출될 수 있음을 구분합니다. C++17의 inline 변수 등 표준별 차이를 확인하고 헤더 정의가 중복 정의·ODR 문제를 만들지 않게 합니다. 특히 C++11/14의 static constexpr 데이터 멤버는 ODR-use 시 별도 정의가 필요할 수 있습니다.
- 타입이 오른쪽에서 명확하거나 반복이 큰 iterator·템플릿 반환에는 `auto`를 사용합니다. 폭·부호·프로토콜 계약·중요한 변환을 보여야 할 때는 타입을 명시합니다. 복사인지 참조인지 선택하고, 순회 시 읽기 전용 큰 요소에는 `const auto&`를 사용합니다. `auto`가 참조나 최상위 const를 자동 보존한다고 가정하지 않습니다.
- 널 포인터에는 `nullptr`를 사용합니다. C++ 코드에서 `NULL`·정수 `0`을 널 포인터의 기본 표현으로 사용하지 않습니다.
- 새 C++ enum은 `enum class`를 기본으로 합니다. ABI·파일 포맷이 요구할 때만 underlying type을 명시하며 enum의 메모리 표현을 그대로 네트워크에 보내지 않습니다.
- 가능한 값 초기화를 사용하고 narrowing을 피합니다. 단, 중괄호와 괄호의 의미가 다르면 의도를 우선합니다. `std::vector<int> values(10);`은 원소 10개이며 `std::vector<int> values{10};`은 값 10인 원소 하나입니다.

```cpp
// Good
const auto playerCount = players.size();
for (const auto& player : players)
{
    DrawPlayer(player);
}

// Bad: 읽기 전용 순회인데 큰 객체를 불필요하게 복사합니다.
for (auto player : players)
{
    DrawPlayer(player);
}

// Good: 크기 계약을 명시합니다.
std::uint32_t packetId = ReadPacketId();

// Bad: nullptr로 바꿔야 하는 C++ 널 포인터 표현입니다.
// PlayerController* player = NULL;
```

### 소유권, RAII, 참조, 이동

- 값과 직접 소유한 멤버를 우선하고, 동적 수명이 필요할 때만 힙을 사용합니다. 단독 소유는 `std::unique_ptr`, 실제 공유 소유 계약이 있을 때만 `std::shared_ptr`, 그 공유 객체를 수명 연장 없이 관찰할 때는 필요에 따라 `std::weak_ptr`를 사용합니다. 순환 참조와 제어 블록 비용을 고려합니다.
- 일반 C++ 코드의 raw pointer는 기본적으로 **비소유·nullable 관찰자**, 참조는 **비소유·유효 객체 필수**의 의미로 사용합니다. 그 자체가 수명을 보장하지 않으므로 저장·반환·비동기 캡처의 수명을 확인합니다. C API·외부 라이브러리의 owning raw pointer는 실제 계약대로 처리하고 경계에서 해제자를 포함한 RAII 소유자로 감쌉니다. 모든 raw pointer가 언어 차원에서 비소유라는 뜻은 아닙니다.
- 입력은 작고 저렴하면 값, 큰 읽기 전용 객체면 `const T&`, 필수 수정 대상이면 `T&`, 선택적 대상이면 `T*`를 기본으로 합니다. 단순 접근만 하는 함수에 스마트 포인터를 넘겨 소유권 정책을 강제하지 않습니다. `std::unique_ptr<T>` 값 인수는 소유권 이전처럼 수명 계약이 필요한 경우에 사용합니다.
- 메모리·파일·락·핸들은 RAII로 관리합니다. `new`/`delete`, `malloc`/`free`, `lock`/`unlock`을 일반 제어 흐름에 흩어 놓지 않습니다. 스마트 포인터를 쓰기 위해 불필요한 힙 할당을 만들지도 않습니다. C++14 이상에서는 적합한 경우 `std::make_unique`를 사용하고, C++11이라면 소유자 생성 안에서 즉시 획득하는 기존 RAII 패턴을 사용합니다.
- 기본은 Rule of Zero입니다. 자원을 직접 소유하는 특수 타입만 복사·이동·소멸 정책 전체를 검토합니다. 복사 불가능한 타입은 명시하고, 기반 포인터로 삭제하는 다형적 계층은 적절한 가상 소멸자를 갖추거나 기반을 통한 삭제를 금지합니다.
- `std::move`는 이동을 요청하는 cast이지 자체로 데이터를 옮기거나 성능을 보장하는 함수가 아닙니다. 이후 원래 값이 필요하지 않은 소유권 이전에만 사용합니다. 이동된 객체는 해당 타입이 보장하는 상태로만 사용합니다. `return localValue;`에 무조건 `std::move`를 붙여 copy elision을 방해하지 않습니다. `std::forward`는 forwarding reference를 받는 실제 전달 템플릿에서만 사용합니다.

```cpp
// Good: C++14 이상, 일반 C++ 소유 객체의 단독 소유입니다.
auto player = std::make_unique<PlayerController>(playerId);
DrawPlayer(*player);

// Bad: 소유자가 불명확해지고 종료 경로마다 해제를 기억해야 합니다.
// auto* player = new PlayerController(playerId);
// DrawPlayer(*player);

// Good: 관찰만 하는 API는 shared_ptr를 요구하지 않습니다.
void DrawPlayer(const PlayerController& player);

// Bad: 공유 수명 계약이 없는데 참조 카운트 비용과 정책을 강제합니다.
// void DrawPlayer(std::shared_ptr<PlayerController> player);
```

**Godot 예외:** Godot 객체에 위 표준 스마트 포인터·`delete` 기본값을 그대로 대입하지 않습니다. `Ref<T>`·`Node`·scene tree의 수명과 해제, `memnew` 매크로 호출 형식, `_ready`·`_process`·`_bind_methods` 등 엔진 요구 이름과 이미 연결된 ABI 진입 심볼, 엔진 콜백·바인딩 계약은 OKF의 [Godot Scene·Resource 수명](/game/godot-runtime.md)·[godot-cpp 빌드·실행 검증](/game/godot-build.md) 또는 프로젝트의 Godot 지침을 먼저 따릅니다.

소유한 프로젝트에서 새로 작성하는 일반 C++ 메서드는 이 기본값이 적용되면 `PascalCase`를 유지합니다. godot-cpp 저장소 자체의 `snake_case` 스타일을 확장 프로젝트 전체에 자동 강제하지 않습니다. 반대로 godot-cpp 자체를 수정할 때는 그 저장소의 기존 규칙을 따릅니다. C++ 메서드 식별자와 `ClassDB::bind_method` 등에 전달하는 script-facing 이름은 별개의 선택입니다. 이미 scene·직렬화·스크립트에서 사용하는 바인딩 문자열은 보존하고, 새로운 script-facing 이름은 프로젝트의 Godot API 규칙에 따라 별도로 정할 수 있습니다.

Godot 정수 상수·enum 바인딩(`BIND_CONSTANT`·`BIND_ENUM_CONSTANT`·`ClassDB::bind_integer_constant`)에서 C++ 내부 이름과 script 이름을 분리하는 규칙은 [godot-cpp 빌드·실행 검증의 등록·이름 계약](/game/godot-build.md#등록프로퍼티시그널과-이름-계약)을 따릅니다. Variant 인자·반환 타입으로 enum 자체를 노출해야 한다면 해당 버전의 binding 요구를 확인하고, 이미 배포한 script 상수·enum 이름은 보존합니다.

### 예외·RTTI·템플릿·람다·cast·매크로·STL

- **예외:** 빌드·라이브러리·ABI 정책이 우선입니다. 예외를 사용하는 일반 C++ 프로젝트에서는 실패를 예외로 보고하고 RAII로 정리하는 기존 모델을 따릅니다. 예상 가능한 분기·부재에는 기존 상태값·결과 타입을 사용합니다. 예외가 꺼진 프로젝트에서는 명시적 오류 결과와 생성용 팩터리 등 지원되는 경로를 사용합니다. 스타일 문서만 근거로 `throw`나 `try`/`catch`를 추가하거나 예외를 켜지 않습니다. C ABI·플러그인·엔진 경계를 넘어 예외를 전파하지 않으며, 예외를 사용할 수 있는 경계에서 계약에 맞게 오류로 변환합니다. 소멸자는 예외를 내보내지 않습니다. `noexcept`는 실패 경로까지 계약을 보장할 때만 붙입니다.
- **RTTI:** 켜짐·꺼짐을 프로젝트에서 확인합니다. RTTI가 허용된 일반 C++의 실제 다형적 타입 확인에만 `dynamic_cast`·`typeid`를 사용합니다. 가능하면 타입 조회보다 가상 동작·명시적 모델을 사용합니다. 엔진의 자체 타입 시스템이나 RTTI 비활성 빌드에 표준 RTTI를 무조건 들여오지 않습니다. 예외와 RTTI가 Godot에서 안전하다고 가정하지 않습니다.
- **템플릿:** 동일 계약의 실제 타입 차이를 표현할 때 사용합니다. 단순 함수로 충분한 코드를 메타프로그래밍으로 바꾸지 않습니다. 타입 매개변수는 `typename`을 기본으로 하고 필요한 연산·제약을 드러냅니다. 지원 시 concepts를 사용할 수 있지만 낮은 표준에 새 표준 기능을 강제하지 않습니다. 사용하는 번역 단위에서 필요한 정의는 헤더에 제공하거나 명시적 인스턴스화 경계를 설계합니다.
- **람다:** 짧고 사용 지점에 국한된 동작에 사용합니다. 저장되거나 비동기로 실행되는 람다는 명시적 캡처를 기본으로 하고 `[&]`나 `this` 캡처의 수명을 검토합니다. `[this]`는 객체의 수명을 연장하지 않습니다. 즉시 사용하는 짧은 알고리즘 람다에는 의도가 명확할 때 제한된 기본 캡처를 허용합니다. 여러 분기·처리를 담은 람다를 호출 인자·체인 안에 깊게 끼워 넣지 않고, 의미 있는 지역 람다나 기존 함수로 표현합니다. 분리해도 캡처·이동 시점·호출 방식·수명을 보존하며 이름을 붙이려고 `std::function`의 타입 소거·할당을 추가하지 않습니다. 큰 본문·반복되는 정책에는 이름 있는 함수를 사용합니다.
- **cast:** 불필요한 cast를 없애고, 필요한 변환은 목적이 드러나는 `static_cast` 등으로 제한합니다. 정수 축소 변환은 cast 전에 범위를 검증합니다. `static_cast`가 범위 검사를 해준다고 가정하지 않습니다. C 스타일 cast는 C++의 기본값으로 사용하지 않습니다. `reinterpret_cast`는 레이아웃·정렬·수명·aliasing을 확인한 낮은 수준의 경계에만 격리합니다. `const_cast`로 원래 const 객체를 수정하지 않습니다. `dynamic_cast`는 앞의 RTTI 정책을 따릅니다.
- **매크로:** 타입·상수·일반 함수는 `using`·`constexpr`·함수·템플릿으로 표현합니다. 매크로는 6장 헤더 보호 규칙에 따라 필요한 include guard, 조건부 컴파일, 플랫폼 export, 외부 프레임워크가 요구하는 용도에 한정합니다. 매크로에 여러 번 평가되는 인수나 숨은 제어 흐름을 넣지 않습니다. 필수 다중 문장 매크로는 `do { ... } while (0)` 구조를 사용하고 인수·식의 괄호와 평가 횟수를 검토합니다. 사용자 호출 뒤 세미콜론이 자연스럽게 작동해야 합니다.
- **STL:** 검증된 표준 컨테이너·알고리즘·RAII 타입을 재사용합니다. 목적에 맞으면 연속 저장 컨테이너를 먼저 검토하되 자료구조를 무조건 하나로 고정하지 않습니다. 크기를 알 때 필요한 `reserve`를 고려하고 불필요한 할당·복사·참조 카운트 증가를 만들지 않습니다. iterator·참조 무효화와 view의 원본 수명을 지킵니다. 엔진 API 경계는 엔진이 요구하는 타입을 사용하고, 불필요한 표준/엔진 컨테이너 왕복 변환을 피합니다. 다른 컴파일러·런타임과의 안정 ABI에 STL 타입을 무검토로 노출하지 않습니다.

```cpp
// Good: 지역 범위 안에서 즉시 실행되는 명시적 캡처입니다.
const int minimumScore = GetMinimumScore();
const auto isQualified = [minimumScore](const PlayerScore& score)
{
    return score.value >= minimumScore;
};

// Good: 실제 타입 반복을 줄이는 단순한 템플릿입니다.
template <typename TValue>
TValue SquareValue(TValue value)
{
    return value * value;
}

// Bad: 타입과 인수 평가 횟수가 불명확합니다.
// #define SQUARE(value) value * value
// const auto result = SQUARE(index++);

// Bad: 수명 확인 없이 비동기 작업에 지역 참조를 보관합니다.
// queue.Enqueue([&] { UsePlayer(player); });
```

## 5. C 전용 규칙

C 코드를 C++ 문법으로 바꾸지 않습니다. `class`, 참조, `enum class`, `std::unique_ptr` 대신 C의 계약과 프로젝트가 지원하는 표준을 사용합니다.

- **구조체·typedef:** 단순 데이터 필드는 `camelCase`입니다. 소유한 공개 타입은 `typedef struct NsBuffer { ... } NsBuffer;`처럼 tag와 typedef 이름을 같게 두고 프로젝트 접두사를 붙입니다. 캡슐화된 공개 타입은 `typedef struct NsBuffer NsBuffer;`로 불완전 타입만 헤더에 선언하고 구현에서 정의합니다. 포인터 typedef로 포인터·const 의미를 숨기는 새 관례는 만들지 않습니다. 외부 핸들 타입은 예외입니다.
- **함수:** 공개 이름은 프로젝트 접두사와 동사를 포함한 `PascalCase`입니다. `NsBufferCreate`, `NsBufferDestroy`, `NsBufferAppend`처럼 소유권·동작을 명확히 합니다. 인수 없는 함수는 `NsGetVersion(void)`처럼 `void`를 명시합니다. C의 파일 내부 함수는 `static`으로 제한하고 모듈 안에서 명확한 `PascalCase`를 사용합니다. 프로젝트 전체에서 접두사를 일관되게 사용하는 관례가 있으면 내부 함수에도 따릅니다.
- **포인터:** `const Type*`는 읽기 전용 입력, `Type*`는 수정 또는 결과 전달에 사용합니다. null 허용 여부·배열 길이·유효 기간·소유권·실패 시 출력 상태를 API에 적습니다. 문자열은 NUL 종료 여부와 길이 단위를 명시합니다. C에서는 프로젝트 지원 표준에 맞춰 `NULL`을 기본으로 사용하며 C23의 `nullptr`를 무조건 요구하지 않습니다.
- **메모리:** 값·호출자 버퍼를 먼저 검토합니다. 동적 할당은 해당 프로젝트의 allocator/free 짝을 맞추며 `malloc` 반환을 C에서 불필요하게 cast하지 않습니다. `sizeof *pointer`로 실제 대상 타입의 크기를 구하고 `count * elementSize`의 overflow를 검사한 후 할당합니다. 실패를 처리하고 모든 종료 경로에서 정확히 한 번 해제합니다. 여러 자원을 정리해야 하면 범위가 분명한 `goto cleanup`을 허용하며 라벨 이름은 `camelCase`입니다. `realloc` 결과를 임시 포인터로 받아 실패 시 원래 포인터를 잃지 않게 합니다. 크기 0의 경로도 계약을 정하며 함수 종료 후 사용할 스택 주소를 반환하지 않습니다.
- **매크로와 상수:** 간단한 함수는 `static inline` 함수로 표현합니다. **정수 상수는 `enum { NS_DEFAULT_PORT = 7777, NS_MAX_PACKET_BYTES = 1200 };`처럼 접두사를 붙인 UPPER_SNAKE_CASE enum 상수가 기본**입니다. 정수 상수식으로 사용할 수 있고 전처리 치환 부작용이 없기 때문입니다. `#if`처럼 전처리기가 값을 읽어야 하거나 `int` 범위를 넘는 값만 `NS_PACKET_HEADER_BITS` 같은 접두사 매크로로 정의합니다. 정수가 아닌 읽기 전용 객체에는 `const`를 사용하고, 그중 고정 상수 이름은 대문자로 씁니다. C의 `const` 변수를 정수 상수식 문맥에 쓸 수 있다고 가정하지 않습니다. 필수 함수형 매크로의 괄호·중복 평가·문장 안전성 규칙은 C++과 같습니다.
- **enum:** C enum은 값이 주변 범위에 들어오므로 타입은 `NsConnectionState`, 값은 `NS_CONNECTION_STATE_CONNECTED`처럼 프로젝트·타입 접두사를 붙입니다. C enum 크기나 메모리 표현을 ABI·직렬화 폭으로 가정하지 않습니다. 고정 폭 경계는 지원되는 `<stdint.h>` 타입과 명시적 인코딩으로 설계합니다.
- **전역·상수:** 공개 전역 상태는 `gNsLogLevel`, 고정 상수는 `NS_DEFAULT_PORT`처럼 역할을 구분합니다. 내부 static 상태는 `sPascalCase`이며 고정 상수라면 내부 연결이어도 `UPPER_SNAKE_CASE`입니다. 불필요한 공개 전역보다 함수 인수·컨텍스트 구조체를 사용합니다.
- **헤더:** C용 헤더는 독립적으로 포함 가능해야 하며 필요한 `<stddef.h>`, `<stdint.h>` 등 C 헤더를 직접 포함합니다. C++ 전용 구문을 노출하지 않습니다. 실제로 C++에서도 호출할 API에만 `#ifdef __cplusplus`로 감싼 `extern "C"` 블록을 사용하고, 이를 바이너리 레이아웃·메모리 소유권까지 자동 호환시키는 장치로 생각하지 않습니다.

```c
/* Good: C에는 네임스페이스가 없어 공개 타입과 enum 값에 접두사를 붙입니다. */
typedef enum NsConnectionState
{
    NS_CONNECTION_STATE_DISCONNECTED,
    NS_CONNECTION_STATE_CONNECTED
} NsConnectionState;

typedef struct NsBuffer
{
    unsigned char* data;
    size_t size;
    size_t capacity;
} NsBuffer;

/* Good: 선언에는 소유권 계약을 함께 적습니다. */
/* 성공 시 소유한 객체, 실패 시 NULL을 반환합니다. NsBufferDestroy로 해제합니다. */
NsBuffer* NsBufferCreate(size_t capacity);
void NsBufferDestroy(NsBuffer* buffer);

/* Good: size > 0 경로에서 realloc 실패가 기존 소유 포인터를 잃게 하지 않습니다. */
unsigned char* newData = realloc(buffer->data, newCapacity);
if (newData == NULL)
{
    return false;
}

buffer->data = newData;
buffer->capacity = newCapacity;

/* Bad: 실패 시 기존 할당을 가리키던 포인터를 잃습니다. */
/* buffer->data = realloc(buffer->data, newCapacity); */
```

위 재할당 조각은 `newCapacity > 0`이고 필요한 크기 검증을 마친 함수 본문을 전제로 합니다. 실제 C 파일은 `size_t`, `realloc`, `NULL`, `false`에 필요한 `<stddef.h>`, `<stdlib.h>`, `<stdbool.h>` 등을 직접 포함합니다.

## 6. C/C++ 헤더·소스·공개 경계

include guard·전방 선언·ODR·`.h/.cpp/.c` 배치는 C/C++ 전용입니다. 공개 API 최소화·외부 계약 보존은 언어 공통으로 적용하되 다른 언어의 모듈·import/export·접근 제어 구문을 대체하지 않습니다.

- **Include 순서:** 구현 파일의 짝 헤더, 프로젝트 헤더, 외부 라이브러리 헤더, 표준 라이브러리 헤더, 플랫폼 헤더 순서입니다. 그룹 사이 빈 줄 하나, 그룹 안에서는 경로순 정렬을 기본으로 합니다. 자체 헤더는 `"..."`, 설치된 외부·표준·플랫폼 헤더는 `<...>`를 사용합니다. 플랫폼이 요구하는 include 순서나 사전 컴파일 헤더가 있으면 그 계약을 우선합니다. 헤더에서 이미 우연히 포함되었다는 이유로 직접 사용하는 타입의 필수 include를 생략하지 않습니다.
- **헤더 보호:** 새로 만드는 소유 C/C++ 헤더는 **`#pragma once`를 기본**으로 합니다. 표준 지시문은 아니지만 MSVC·Clang·GCC, 즉 godot-cpp가 지원하는 주요 컴파일러가 모두 지원합니다. Microsoft 계열 관례와 Godot·godot-cpp 코드와도 일치하며 guard 이름 충돌을 없앱니다. 기존 프로젝트가 include guard를 쓰거나 대상 툴체인이 `#pragma once`를 지원하지 않는다고 확인된 경우에만 guard를 사용합니다. 같은 헤더를 심볼릭 링크·복사본 등 여러 경로로 포함하지 않으며 두 방법을 중복 사용하지 않습니다.
- **전방 선언:** 포인터·참조 선언처럼 불완전 타입만으로 충분하고 실제 include 결합을 줄일 때 사용합니다. 값 멤버·상속·inline 본문 등 완전한 타입이 필요한 곳은 include합니다. 표준 라이브러리 타입을 임의로 전방 선언하지 않습니다. PImpl과 불완전 타입의 `std::unique_ptr`는 소멸자 등 완전한 타입이 필요한 연산을 구현 파일에서 정의해야 할 수 있습니다. 단지 헤더 줄 수를 줄이기 위한 PImpl·힙 할당은 도입하지 않습니다.
- **헤더와 구현:** 헤더에는 소비자가 알아야 할 선언과 필요한 타입·템플릿·inline/constexpr 정의만 둡니다. 일반 비-inline 함수 정의와 내부 helper·알고리즘·가변 저장소는 `.cpp`/`.c`로 옮깁니다. 헤더 전역 변수 정의로 여러 번역 단위에 중복 정의를 만들지 않습니다. 필요한 외부 변수는 `extern` 선언과 한 곳의 정의를 사용하고 더 나은 캡슐화가 없는지 먼저 검토합니다.
- **이름 공간 오염:** 헤더에 `using namespace`를 쓰지 않습니다. 구현에서도 `std::`를 기본으로 유지하고 긴 타입은 범위가 제한된 `using` 선언·별칭으로 줄입니다. 공개 헤더에서 내부 매크로·플랫폼 타입·불필요한 third-party include를 전파하지 않습니다.
- **공개와 private API:** 공개 범위·확장점·설정의 기준은 [코딩 스타일의 공개 API와 확장성](/coding-style.md#공개-api와-확장성)을 따릅니다. C/C++에서는 private 상태마다 기계적인 getter/setter를 만들지 않고, 공개 API에는 입력 조건, 결과·오류, 소유권·수명, 필요할 때 스레드 제약을 명시합니다.
- **외부 경계:** 공개 심볼·직렬화 키·스크립트 바인딩 이름의 변경은 스타일 정리가 아니라 호환성 변경입니다. 요청된 범위에서만 소비자·바인딩·직렬화·문서까지 함께 이전합니다. ABI가 필요한 경계에서는 예외·RTTI·allocator·STL·구조체 레이아웃의 호환 조건을 별도로 확인합니다.

```cpp
// PlayerController.cpp: Good
#include "PlayerController.h"

#include "Game/PlayerRegistry.h"

#include <vector>

// Bad: 공개 헤더에서 이름 공간 전체를 전파하지 않습니다.
// using namespace std;
```

```c
/* Packet.h: Good */
#pragma once

#include <stddef.h>

#ifdef __cplusplus
extern "C"
{
#endif

size_t NsPacketGetHeaderSize(void);

#ifdef __cplusplus
}
#endif
```

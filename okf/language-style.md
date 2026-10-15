---
type: Rule
title: 언어 공통 코딩 스타일
description: 모든 언어에 적용하는 네이밍 기본값과 언어별 예외, 작성·수정 범위의 문장·제어 흐름·선언 가독성 기준을 정하는 정본이며 C/C++ 전용 규칙은 하위 개념으로 나눕니다.
tags: [rule, cross-language, c, cpp, csharp, go, python, javascript, typescript, coding-style, naming, readability, ownership]
timestamp: 2026-10-15T00:00:00Z
---

# 언어 공통 코딩 스타일

이 문서는 이 저장소가 배포하는 **언어 공통 기본 규칙의 정본**입니다. 전통적인 Microsoft 계열의 표기를 참고하되 특정 Microsoft 규격이나 레거시 관행 전체를 재현하지 않습니다. 네이밍·배치는 **선택**, 언어 제약·수명·ABI 계약은 **사실**로 구분합니다. Hungarian notation, 수동 메모리 관리, 무조건적인 매크로 사용까지 가져오지 않습니다.

이 기본값은 **C/C++에 한정하지 않습니다. C#·Go·Python·JavaScript·TypeScript 등을 포함해 사용자가 작성하는 모든 언어의 코드에 적용**합니다. 언어 목록은 예시이며 그 밖의 언어도 같은 판정 기준을 따릅니다. 타입·함수·메서드는 `PascalCase`, **고정 상수·enum 값은 `UPPER_SNAKE_CASE`**, 캡슐화된 인스턴스 필드는 `mPascalCase`, 지역 변수·인자는 `camelCase`입니다. 아래 「1. 우선순위와 언어 수준」의 적용 우선순위를 따르며 기존 프로젝트 규칙을 자동으로 덮어쓰지는 않습니다. 다음 「프로젝트 적용 규칙」부터 「에이전트 적용 규칙」까지는 프로젝트 지침으로 옮겨 쓸 수 있습니다. Godot 참조는 OKF `game/godot-cpp.md` 또는 프로젝트의 Godot 지침으로 확인합니다.

## 하위 개념

* [C/C++ 전용 코딩 규칙](/language-style-c-cpp.md) - C/C++ 코드를 작성·수정할 때는 이 문서와 함께 읽으며, C/C++ 전용 배치·선언, C++ 표현·수명·라이브러리, C 전용 규칙, 헤더·소스·공개 경계를 다룹니다.

## 프로젝트 적용 규칙

### 1. 우선순위와 언어 수준

1. 컴파일러·플랫폼·ABI·엔진 override·표준 라이브러리·OS API·외부 API와 언어의 문법·공개성·자동 탐색 규칙이 요구하는 계약을 지킵니다. 예약 식별자와 생성 코드도 임의 변경하지 않으며, 이름만 맞추려고 공개 범위·직렬화 키·프로토콜 동작을 바꾸지 않습니다.
2. 현재 작업에 대한 명시적 요구와 프로젝트의 `AGENTS.md`, 스타일 문서, 빌드 설정, 포매터·린터 설정을 따릅니다. 컴파일러·툴체인의 기본 활성 명명 진단도 확인합니다. 실제 활성 진단과 충돌하는 이름은 해당 범위에서 도구가 요구하는 표기를 따르고 예외를 설명하며, 표기를 강제하려고 경고를 억제하지 않습니다. 반대로 새 린터를 도입해 이 규칙을 바꾸지도 않습니다. 명시적 요구가 기존 규칙의 변경을 뜻할 때만 해당 범위를 변경하며, 외부 계약은 스타일 요청으로 무효화되지 않습니다.
3. 명시적 규칙이 없으면 같은 영역의 기존 코드 3–5개를 살펴 네이밍·중괄호·들여쓰기의 일관된 패턴을 따릅니다. 단 아래 가독성 최소 기준까지 주변의 압축·혼합 관례에 맞춰 생략하지 않습니다.
4. 명시 규칙과 같은 영역의 일관된 기존 패턴이 모두 없는 새 코드에서는 사용자가 설정 폴더의 축적 지식(OKF `learned/`)에 해당 언어·프로젝트의 지침을 두었으면 그 범위 안에서 먼저 따르고, 그 지침이 없거나 정하지 않은 부분에는 이 언어 공통 스타일 기본값을 적용합니다. Python은 보통 snake_case, JS는 보통 camelCase라는 생태계 관례만으로 이 문서의 함수·메서드 `PascalCase`를 바꾸지 않습니다. 단 이름이 공개 범위·자동 탐색·프로토콜 동작을 바꾸는 경우에는 아래 언어별 예외가 우선입니다.

**가독성 최소 기준의 적용 범위:** 에이전트가 새로 작성하거나 실제로 수정하는 논리 단위(문장·블록·선언 그룹)에는 3장의 문장·단락 구분, 역할별 그룹화, 명확한 제어 흐름 기준을 적용합니다. 주변 코드가 붙어 있거나 역할이 섞여 있다는 이유로 이를 재생산하지 않습니다. 언어 문법·외부 계약·프로젝트의 명시 규칙 및 포매터·린터가 강제하는 제약은 우선하며 충돌은 설명합니다. 기존 파일 전체를 재포맷하거나 공개 API를 바꾸라는 뜻은 아닙니다.

프로젝트가 선언한 언어 버전, 컴파일러·런타임, 포매터, 모듈/패키지 체계를 먼저 확인합니다. 스타일을 적용한다는 이유로 버전·빌드 설정을 바꾸지 않습니다. **C++에서만 새 프로젝트 기본 표준은 C++17**, **C에서만 새 코드 기본 문법은 C99**입니다. C++17은 godot-cpp 10.0.0 핀이 컴파일러 플래그로 요구하는 표준([근거](/game/godot-build.md#apiabi툴체인-호환성))이자 중첩 네임스페이스·inline 변수·`if constexpr`를 사용할 수 있는 기준이고, C99는 `<stdint.h>`·`<stdbool.h>`·`static inline`을 사용할 수 있는 기준입니다. C++ 예제는 C++17 기준이고, 기존 프로젝트가 더 낮은 표준이면 지원되는 표현으로 바꿉니다. C++20 기능은 프로젝트가 해당 표준을 선언한 경우에만 사용합니다. 이 선택으로 C#·Go·Python·JS·TS의 버전을 지정하지 않으며 C++ 소유권·포인터·헤더·RTTI 규칙도 다른 언어에 이식하지 않습니다.

### 2. 네이밍 기본값

일반 함수·런타임 변수에는 소문자 `snake_case`를 새로 도입하지 않습니다. **고정 상수·enum 값·비트 플래그·상수형 비타입 템플릿 매개변수·매크로는 `UPPER_SNAKE_CASE`**를 사용합니다. 타입·함수의 약어는 `HttpClient`, `GetId`, `XmlReader`처럼 단어로 취급하고 상수에서는 `HTTP_TIMEOUT_SECONDS`, `PLAYER_ID_BITS`처럼 대문자로 씁니다. 반복문의 짧은 인덱스 `i`, `j`는 허용하되 `pFoo`, `pszName`, `dwCount`처럼 타입을 이름에 복제하는 접두사는 기본값으로 사용하지 않습니다. `m`, `s`, `g`는 타입이 아니라 저장 위치·공유 상태를 표시하는 제한된 예외입니다.

- **클래스·구조체·열거형·인터페이스:** `PascalCase`입니다. `PlayerController`, `SpawnPoint`, `ConnectionState`, `PlayerId`, `SessionStore`처럼 역할을 드러냅니다. C#·TS를 포함해 인터페이스에 `I` 접두사를 자동 추가하지 않습니다. 기존 프로젝트의 `ISessionStore` 관례나 외부 계약이 있으면 그것을 보존합니다. Go에서 비공개 타입이 필요하면 공개 범위를 지키는 소문자 시작 예외를 적용합니다. 타입 별칭은 아래 별도 항목을 따릅니다.
- **함수·메서드:** 공개·내부 구현 모두 원칙은 `PascalCase`입니다. `LoadLevel`, `IsReady`, `HasItems`, `GetPosition`처럼 표현합니다. Python·JS·TS의 소유 함수에도 같은 규칙을 사용합니다. 생성자·연산자·프로토콜 메서드와 Go의 비공개 심볼 등 이름에 의미가 있는 경우만 아래 예외를 적용합니다. 함수로 쓰는 JS/TS의 const 화살표 함수도 `const GetUser = ...`이며, 함수 인자로 받는 콜백 변수는 인자 규칙대로 `onComplete`입니다.
- **캡슐화된 인스턴스 데이터 필드:** `mPascalCase`입니다. `mPosition`, `mPlayerId`, `mMaxPlayers`처럼 씁니다. 새 클래스는 지원되는 접근 제어로 상태를 기본 비공개로 두며 `member_name_`·`_memberName`을 이 기본값으로 사용하지 않습니다. JS/TS의 런타임 비공개 필드는 `#mPlayerId`이고, Python의 `mPlayerId`는 이름 관례일 뿐 강제 접근 제어가 아닙니다.
- **데이터 필드와 프로퍼티:** C/C++의 단순 public 데이터 struct, Python dataclass, JS/TS의 plain object·데이터 타입 필드는 `camelCase`입니다. C#의 프로퍼티·record 데이터 멤버와 Go의 exported struct 필드는 `PascalCase`를 사용합니다. C#/Python/JS/TS의 접근자 기반 프로퍼티도 `Value`처럼 `PascalCase`입니다. 저장 필드 `mValue`와 공개 프로퍼티 `Value`를 구분합니다. JSON·DB·네트워크 키는 별도 계약이며 스타일에 맞추려고 바꾸지 않습니다.
- **지역 변수·매개변수:** `camelCase`입니다. `playerId`, `deltaSeconds`, `isReady`처럼 씁니다. 런타임 입력을 보관하는 `const` 지역 변수·매개변수도 같은 규칙입니다.
- **이름의 의미·단위:** 임의 축약과 넓은 범위의 모호한 `data`·`temp`보다 대상과 역할이 드러나는 이름을 씁니다. 짧은 반복 인덱스와 `Id`·`Http` 같은 통용 약어는 유지합니다. 불리언은 참인 상태를 읽을 수 있는 `is`·`has`·`can`·`should` 등의 의미로 표현하고 `!isNotReady` 같은 이중 부정을 만들지 않습니다. 시간·거리·속도·크기·비율의 단위가 타입이나 문맥으로 명확하지 않으면 `timeoutMilliseconds`, `moveUnitsPerSecond`처럼 이름에 드러냅니다. `std::chrono` 등 기존 타입이 단위를 표현하면 불필요하게 중복하지 않으며, 외부 API 이름·직렬화 키는 보존합니다.
- **공유 상태:** 클래스 static 필드, 함수 static, 모듈 내부 공유 상태는 `sPascalCase`, 외부에 노출된 전역 상태는 `gPascalCase`입니다. `sInstanceCount`, `sCache`, `gApplication`이 예입니다. 런타임에 만들어지는 읽기 전용 공유 객체도 같은 상태 규칙을 따릅니다. Go에서는 exported 여부가 우선하므로 외부 전역은 `Application`, 비공개 패키지 상태는 `sApplication`입니다. 불필요한 공유 상태는 함수 인수·객체 소유로 대체합니다.
- **C++ 연결 예외:** `extern const`로 선언하고 한 번역 단위에서 정의한 런타임 const 객체는 `gConfiguration`처럼 씁니다. `extern`·`inline` 없는 네임스페이스 범위 const 객체는 내부 연결이므로 `sConfiguration`입니다. 익명 네임스페이스를 포함한 파일 내부 상태도 `sPascalCase`입니다. 다른 언어에는 C++의 연결 규칙을 적용하지 않습니다.
- **의미 있는 고정 상수:** 언어 공통으로 `UPPER_SNAKE_CASE`입니다. `MAX_PLAYERS`, `DEFAULT_PORT`, `PI`가 기본이며 클래스 static·전역·지역의 고정 상수에 `m`·`s`·`g`를 붙이지 않습니다. C# `const`와 실제 고정값인 `static readonly`, Python 상수, JS/TS의 고정값 `const`, Go 상수에도 적용합니다. **비정적 필드는 const·readonly여도 필드 규칙(`mPascalCase` 등)이 우선**합니다. 객체와 무관한 새 고정값은 static 상수로 표현해 대문자로 쓰며, 기존 필드의 저장 방식은 스타일만으로 바꾸지 않습니다. 호출 중 받은 읽기 전용 지역 값은 `playerCount`처럼 기존 역할 규칙을 따릅니다. `const`·`readonly`·`Final`만으로 고정 상수라고 판정하지 않습니다. JS의 const 객체도 내부 데이터까지 불변이 되지는 않습니다.
- **`constexpr`:** 변수는 `constexpr int MAX_PLAYERS = 4;`처럼 `UPPER_SNAKE_CASE`입니다. `constexpr` 함수는 여전히 함수이므로 `Square(int value)`처럼 `PascalCase`입니다. `const auto playerCount = players.size();`는 런타임 지역 값이므로 `camelCase`를 유지합니다.
- **열거형 타입과 값:** 타입명은 `ConnectionState`처럼 `PascalCase`, C++ `enum class`·C# enum·Python Enum·TS enum의 소유 값은 `DISCONNECTED`, `CONNECTED`처럼 `UPPER_SNAKE_CASE`입니다. scoped 값은 `ConnectionState::CONNECTED`처럼 타입명 접두사를 반복하지 않습니다. C·Go처럼 값이 주변 범위에 들어오면 `NS_CONNECTION_STATE_CONNECTED`, `CONNECTION_STATE_CONNECTED`처럼 필요한 프로젝트·타입 접두사도 대문자로 씁니다. 비트 플래그와 마스크도 `READ_ONLY`, `ALL_FLAGS`처럼 같은 규칙입니다. 기존 ABI·JSON/wire 값·엔진 상수 이름은 보존하며 enum 문법이 없는 언어에 스타일만을 위한 enum 추상화를 만들지 않습니다.
- **매크로:** 프로젝트 접두사를 포함한 `UPPER_SNAKE_CASE`입니다. `NS_ENABLE_TRACING`, `NS_PACKET_HEADER_BITS`가 예입니다. [6장](/language-style-c-cpp.md#6-cc-헤더소스공개-경계)의 예외로 include guard를 쓸 때도 `NS_NET_PACKET_H`처럼 경로를 반영합니다. 표기가 같다고 고정 상수를 매크로로 바꾸지는 않습니다. C/C++의 구현 예약 영역인 `__Name`, `_Name` 등을 새 이름으로 사용하지 않습니다. Go 비공개 상수용 `_`는 아래에 명시한 별도 언어 예외입니다.
- **C/C++ 매크로 충돌:** namespace·enum class 범위도 전처리기 치환을 막지 않습니다. 외부 헤더가 정의한 `ERROR`, `PI` 같은 매크로와 이름이 충돌하면 필요한 도메인 접두사(`CONNECTION_ERROR`, `MATH_PI`)를 더해 대문자 규칙을 유지합니다. 이름만 맞추려고 외부 매크로를 전역 `#undef`하지 않습니다.
- **네임스페이스·모듈:** 소유 C++·C# 네임스페이스는 `PascalCase`입니다. Go package와 Python 패키지는 짧은 소문자 이름(`combat`)을 기본으로 합니다. 파일·모듈의 상세 예외는 아래에서 정하며 외부 네임스페이스·모듈 경로는 보존합니다. C에는 네임스페이스가 없으므로 공개 이름에 프로젝트 접두사를 붙입니다.
- **템플릿·제네릭 매개변수:** 타입은 하나면 `T`, 여러 역할이면 `TValue`, `TKey`처럼 `PascalCase`입니다. C++ 템플릿 템플릿 매개변수도 `TContainer`입니다. 비타입 상수 매개변수는 `CAPACITY`처럼 `UPPER_SNAKE_CASE`로 구분합니다. 언어가 지원하지 않는 제네릭·템플릿을 흉내 내지 않습니다.
- **타입 별칭:** `PascalCase`입니다. C++은 `using PlayerId = std::uint32_t;`, C는 `typedef`, C#/Go/TS는 각 언어의 별칭 구문을 사용합니다. 새 C 별칭에 `_t`를 붙이지 않되 `size_t`, `uint32_t` 등 외부 타입은 보존합니다.
- **파일명:** 소유 C/C++·C#·JS·TS 파일은 대표 타입/모듈의 `PascalCase`와 언어 확장자를 사용합니다(`Counter.h`, `Counter.cpp`, `Counter.c`, `Counter.cs`, `Counter.js`, `Counter.ts`). Go·Python 파일은 생태계의 패키지/탐색 구분을 위해 소문자 `counter.go`·`counter.py`, 복합명은 `player_state.go`·`player_state.py`로 정합니다. 파일명의 예외가 함수 snake_case를 허용하지는 않습니다. `*_test.go`, `*_linux.go`, `test_*.py`, `__init__.py`, 프레임워크 고정 파일·경로와 대소문자 계약은 보존합니다. 기존 파일은 스타일만으로 재명명하지 않습니다.

```cpp
// Good: 데이터와 캡슐화된 상태를 구분합니다.
struct SpawnPoint
{
    float x = 0.0f;
    float y = 0.0f;
    int teamId = 0;
};

enum class ConnectionState
{
    DISCONNECTED,
    CONNECTED
};

class PlayerController
{
public:
    explicit PlayerController(int playerId);

    int GetPlayerId() const;

private:
    int mPlayerId = 0;

    static int sInstanceCount;
};

constexpr int MAX_PLAYERS = 4;

constexpr int Square(int value)
{
    return value * value;
}

// Bad: 이 기본값이 적용되는 새 코드에서의 표기입니다.
class player_controller;
void process_player(int player_id);
// int player_id_;   // 클래스 필드에 사용하지 않습니다.
// int mTeamId;      // 단순 public 데이터 struct 필드에는 사용하지 않습니다.
// constexpr int MaxPlayers = 4; // Bad: 고정 상수는 MAX_PLAYERS입니다.
```

#### 2.1 언어별 의미·문법 예외

다음은 한 언어의 관례를 통째로 따르는 예외가 아니라 **공통 네이밍으로 깨뜨리면 안 되는 의미·계약과 명시적으로 고른 언어별 기본값**입니다.

| 언어 | 소유 코드 기본값 | 반드시 보존할 차이 |
|---|---|---|
| C/C++ | 타입·함수 `PascalCase`, 클래스 필드 `mValue` | `main`, 연산자, ABI entry·override, 표준 프로토콜의 `begin/end/size/swap/get`·`value_type/iterator` 등 이름, C 접두사·전처리 매크로 |
| C# | 메서드·프로퍼티·event `PascalCase`, 명시적 backing field `mValue`, 인자 `initialValue` | `Main`, 외부 override/interface 구현과 접근자 `get/set/init`; auto-property에 불필요한 backing field를 만들지 않음 |
| Go | exported 타입·함수·메서드·필드 `PascalCase`; 비공개 타입·함수·메서드 `camelCase`; 상수·열거 값 `UPPER_SNAKE_CASE` | package 비공개 상수·열거 값은 `_MAX_PLAYERS`처럼 `_` + UPPER_SNAKE_CASE, 캡슐화 필드는 `mValue`. 대문자는 package 외부 공개라는 언어 의미이므로 이름만 맞추려고 helper·필드를 export하거나 비공개로 바꾸지 않음. `main/init`, interface의 `Error/Read/Write` 등 시그니처, gofmt·`_test.go` 계약 유지 |
| Python | 일반 함수·메서드 `PascalCase`, 저장 속성 `self.mValue`, 지역·인자 `camelCase` | `self/cls`, `__init__/__iter__/__enter__` 등 dunder, 외부 override·`test_*` 자동 탐색. `_`/`__`를 스타일 때문에 붙이거나 제거해 import/name-mangling 계약을 바꾸지 않음 |
| JavaScript | 함수·메서드·접근자 이름 `PascalCase`, 비공개 필드 `#mValue` | `constructor`, `Symbol.iterator`, DOM·Promise 등 외부 이름, framework lifecycle. 콜백 인자·일반 데이터 키는 `camelCase` |
| TypeScript | JS 규칙 + interface/type/generic 이름 `PascalCase`, 런타임 비공개 기본은 `#mValue` | `private mValue`는 기존 프로젝트·대상 설정이 요구할 때 유지하며 `private`와 `#`의 런타임 의미 차이를 보존. 외부 타입의 필드·메서드 이름을 바꾸지 않음 |

- 기존 API·직렬화 키·reflection 기반 이름·등록 문자열·파일 탐색 패턴을 변경해야 하면 네이밍 정리가 아니라 계약 변경으로 검토합니다. React를 사용한다면 `useState`·`useCounter` 같은 hook 계약과 소문자 DOM 태그를 지키며, `PascalCase`를 맞추는 forwarding wrapper를 만들지 않습니다.
- 프로퍼티·event·메서드에 `m`을 붙이지 않습니다. backing field를 직접 작성할 때만 필드 규칙을 적용합니다. JS/TS의 비공개 메서드는 `#IncrementCore`, 비공개 static 필드는 `#sCache`입니다.
- C# 14(.NET 10과 함께 2025-11-11 출시) 이상에서는 접근자 로직이 필요한 프로퍼티도 `field` 키워드로 별도 backing field 선언 없이 구현할 수 있습니다([C# 14 `field` 키워드](https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-14), [프로퍼티 문서](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/properties)). 프로젝트 `LangVersion`이 지원하면 불필요한 명시 `mValue`를 새로 만들지 않으며, 기존 명시 필드를 스타일만으로 `field`로 바꾸지 않습니다. 같은 타입에 `field`라는 이름의 기존 멤버가 있으면 `@field`·`this.field`로 구분합니다.
- Go의 내부 helper를 `IncrementCore`로 만들면 exported가 되므로 `incrementCore`가 맞습니다. 반대로 JSON encode 대상 데이터가 필요하면 `Value`처럼 exported 필드를 두고 `json:"value"` tag로 wire 이름을 분리합니다. `mValue`에 JSON tag만 붙여 외부에 직렬화하려 하지 않습니다.
- Go package 범위의 `MAX_PLAYERS`는 exported, `_MAX_PLAYERS`는 unexported입니다. 상수 표기를 통일하면서도 공개 범위를 바꾸지 않기 위한 기본값입니다. 함수 지역 상수는 대문자여도 package export 대상이 아닙니다. Python의 비공개 모듈 상수도 공개 범위 계약상 필요하면 `_MAX_PLAYERS`로 쓰되 기존 `__all__`·import 계약은 보존합니다. C/C++에서는 `_` + 대문자 이름이 모든 범위에서 구현 예약이므로 이 `_` 접두사 예외를 적용하지 않습니다.
- Go는 `gofmt`의 탭·같은 줄 여는 중괄호를 따릅니다. Python은 콜론·4칸 들여쓰기를 사용합니다. C/C++·C#·JS/TS는 명시 포매터가 없을 때 Allman·4칸입니다. JS/TS의 `return`·`throw`와 표현식, `async`와 함수, 화살표 인자와 `=>` 사이에는 의미를 바꾸는 줄바꿈을 넣지 않습니다. `return { value: 1 };`은 객체 표현식이므로 Allman 블록 규칙 대상이 아닙니다.

다음 예제는 네이밍과 접근 경계를 보여 줍니다. C/C++ 예제와 달리 포인터·수동 해제·헤더 규칙을 끌어오지 않습니다.

```csharp
public sealed class Counter
{
    private int mValue;

    public Counter(int initialValue)
    {
        mValue = initialValue;
    }

    public int Value => mValue;

    public void Increment(int amount)
    {
        mValue += amount;
    }
}
```

```go
package counter

type Counter struct {
	mValue int
}

func NewCounter(initialValue int) *Counter {
	return &Counter{mValue: initialValue}
}

func (counter *Counter) Increment(amount int) {
	counter.incrementCore(amount)
}

func (counter *Counter) incrementCore(amount int) {
	counter.mValue += amount
}

func (counter *Counter) Value() int {
	return counter.mValue
}
```

```python
class Counter:
    def __init__(self, initialValue):
        self.mValue = initialValue

    @property
    def Value(self):
        return self.mValue

    def Increment(self, amount):
        self.mValue += amount
```

```javascript
class Counter
{
    #mValue;

    constructor(initialValue)
    {
        this.#mValue = initialValue;
    }

    get Value()
    {
        return this.#mValue;
    }

    Increment(amount)
    {
        this.#mValue += amount;
    }
}
```

```typescript
class Counter
{
    #mValue: number;

    constructor(initialValue: number)
    {
        this.#mValue = initialValue;
    }

    get Value(): number
    {
        return this.#mValue;
    }

    Increment(amount: number): void
    {
        this.#mValue += amount;
    }
}
```

Bad: 소유 Python 함수 `get_user`, 소유 JS 함수 `getUser`, 새 C# 필드 `_value`, Go 비공개 helper를 스타일만으로 `IncrementCore`로 바꾸는 작업입니다. 외부 `json.loads`·`console.log`·`Array.prototype.map`·`io.Reader.Read`를 이런 이유로 재명명하는 것도 Bad입니다.

#### 2.2 고정 상수·enum 값 예시

아래는 언어별 선언 조각입니다. **enum 타입은 PascalCase, 값은 UPPER_SNAKE_CASE**이며 숫자·문자열로 인코딩한 값과 외부 이름 계약은 별도로 유지합니다.

| 언어 | 고정 상수 | enum 값·명명된 상태 |
|---|---|---|
| C | `enum { NS_MAX_PLAYERS = 4 };` | `typedef enum NsConnectionState { NS_CONNECTION_STATE_DISCONNECTED, NS_CONNECTION_STATE_CONNECTED } NsConnectionState;` |
| C++ | `constexpr int MAX_PLAYERS = 4;` | `enum class ConnectionState { DISCONNECTED, CONNECTED };` |
| C# | `public const int MAX_PLAYERS = 4;` | `public enum ConnectionState { DISCONNECTED, CONNECTED }` |
| Go | `const MAX_PLAYERS = 4` / 비공개는 `const _MAX_PLAYERS = 4` | `type ConnectionState int`의 상수 이름 `CONNECTION_STATE_CONNECTED` / 비공개 `_CONNECTION_STATE_CONNECTED` |
| Python | `MAX_PLAYERS = 4` | `class ConnectionState(Enum):`의 멤버 `CONNECTED = 1` |
| JS | `const MAX_PLAYERS = 4;` | enum 문법을 새로 흉내 내지 않고 필요한 명명된 값 `const CONNECTION_STATE_CONNECTED = 1;` |
| TS | `const MAX_PLAYERS = 4;` | `enum ConnectionState { DISCONNECTED, CONNECTED }` |

Bad: 고정 상수 `MaxPlayers`, enum 값 `ConnectionState.Connected`, 상수 표기를 맞추려고 runtime 인자 `playerCount`를 `PLAYER_COUNT`로 바꾸는 작업입니다. `Enum.name`, C# enum 문자열화, reflection·직렬화에서 기존 이름이 계약이면 이름 변경과 소비자 이전을 별도 검토합니다.

TS 프로젝트가 `erasableSyntaxOnly`를 켜거나 Node.js의 타입 스트리핑으로 직접 실행하면 `enum` 선언을 사용할 수 없으므로(Node.js는 v24.12·v25.2부터 타입 스트리핑을 stable로 표시하고 v26에서 `--experimental-transform-types`를 제거) 위 JS 행처럼 명명된 `const` 값을 씁니다. 근거: [`erasableSyntaxOnly`](https://www.typescriptlang.org/tsconfig/erasableSyntaxOnly.html), [Node.js TypeScript 문서](https://nodejs.org/api/typescript.html). 기존 프로젝트의 `enum`은 스타일만으로 바꾸지 않습니다.

### 3. 배치·선언·제어 흐름

**공통 선택:** 기존 프로젝트 포매터가 우선입니다. 명시 포매터가 없으면 C/C++·C#·JS/TS 블록은 Allman·공백 4칸, Go는 gofmt, Python은 콜론·공백 4칸입니다. 위 언어별 문법 예외가 아래보다 우선합니다. [C/C++ 전용 코딩 규칙](/language-style-c-cpp.md)의 구체적인 `switch`·포인터·네임스페이스·접근 지정자 및 코드 예제는 C/C++ 기준이며, 다른 언어에 없는 구문을 강제하지 않습니다. 폭만을 위한 줄바꿈 금지, 문장·논리 단락·독립 제어문의 구분, 역할별 선언 그룹과 명확한 흐름은 언어 공통이며, 구체적인 표기는 해당 언어의 문법·포매터를 따릅니다.

- 함수·클래스·구조체·열거형·네임스페이스·조건문·반복문의 여는 중괄호를 다음 줄에 둡니다. `else`와 `catch`도 닫는 중괄호 다음 줄에 둡니다. `do`의 종료 조건은 `} while (condition);`처럼 닫는 중괄호와 같은 줄에 둡니다. 초기화 목록의 `{}`는 블록이 아니므로 `Point point{1, 2};`처럼 같은 줄에 둡니다.
- **강제 줄 길이 상한은 두지 않습니다.** 선언·시그니처·인자 목록·호출·체인·객체 초기화자는 한 줄을 우선합니다. 폭을 맞추기 위한 줄바꿈은 하지 않습니다. 복합 조건·긴 체인의 여러 판단 단계가 읽기 어렵다면 의미 있는 중간 값이나 기존 함수를 사용하되, 단순히 긴 줄을 쪼개기 위한 추상화는 만들지 않습니다. 분리할 때는 단락 평가·조건부 실행, 부수 효과의 순서·횟수, 값 범주·임시 객체 수명, 복사·할당 비용을 보존합니다. 임시 객체 일부의 참조·view만 남겨 수명을 잃거나 조건부 호출을 미리 실행하지 않습니다. 프로젝트 포매터·린터(`.editorconfig`, Prettier, rustfmt 등)가 줄 길이를 강제하면 예외로 그쪽을 따르며 CI·저장 시 자동 포맷과 싸우지 않습니다.
- **문장은 한 줄에 하나씩 씁니다.** 세미콜론으로 여러 실행 문장을 한 줄에 붙이지 않습니다. `for` 헤더처럼 문법상 한 구성인 초기화·조건·증감은 예외입니다. 짧은 `if`, 반복문, 함수도 정상적인 블록으로 쓰며, 람다 본문이 문장 블록이면 같은 원칙을 적용합니다. 언어가 별도로 지원하는 간단한 단일 식 본문(람다·표현식 본문 멤버)은 유지할 수 있습니다. 한 줄 우선은 문장·블록 압축 지시가 아닙니다.
- `if (condition)`, `for (...)`, `switch (state)`처럼 제어 키워드 뒤에 공백을 둡니다. 호출은 `LoadLevel(levelId)`처럼 씁니다. 이항 연산자 양옆과 쉼표 뒤에는 공백을 둡니다. 탭·연속 공백으로 열을 정렬하지 않습니다.
- 지역 변수는 처음 사용하는 곳 가까이 선언하고 즉시 초기화합니다. 초기화와 대입을 불필요하게 분리하지 않습니다. 함수 선언에도 의미 있는 매개변수 이름을 적습니다. 클래스 선언의 순서와 구현 파일의 메서드 정의 순서를 가능한 한 맞춥니다.
- **호출부의 뜻을 숨기지 않습니다.** 의미가 불명확한 숫자·문자열·불리언, 순서를 혼동하기 쉬운 같은 타입의 연속 인수는 기존 상수·이름 있는 지역 값·언어가 지원하는 명명 인자로 의도를 드러냅니다. 의미 있는 고정값은 2장의 상수 규칙을 따르며, 문맥상 자명한 `0`·`1`·빈 값까지 모두 상수화하지 않습니다. 인수 분리에도 앞의 식 분리 보존 조건을 적용해 조건부 실행·부수 효과의 순서/횟수·수명·복사/이동/할당 비용을 유지하고, 조건부 인수를 조건 앞으로 끌어내지 않습니다. 기존 API에 대한 호출을 읽기 좋게 하려고 공개 시그니처·인수 순서를 바꾸거나 래퍼 타입·전달 함수를 만들지 않습니다.
- **같은 깊이의 독립된 제어문 사이에는 반드시 빈 줄 하나를 둡니다.** `if` 다음 `if`, `if` 다음 반복문뿐 아니라 `for`·범위 기반 `for`·`while`·`do`·`switch`·`try` 등에도 적용합니다. 제어문 전체가 끝난 뒤 같은 스코프의 다음 문장·선언이 이어질 때도 한 줄 띄웁니다. 짧은 조기 반환 검사 여러 개도 붙여 쓰지 않습니다.
- **하나의 제어문을 이루는 연결부는 띄우지 않습니다.** `if`–`else if`–`else`, `try`–`catch`, `do`–`while` 및 언어별 `elif`·`except`·`finally`·반복문 `else`처럼 같은 문장에 속한 절 사이에는 빈 줄을 넣지 않습니다. 안쪽 블록 종료 뒤 바깥쪽 닫는 중괄호가 이어질 때도 빈 줄을 넣지 않습니다.
- 입력 검증·값 준비·처리·결과 반영처럼 역할이 바뀌는 논리 단락, 함수 정의, 접근 섹션 사이에는 빈 줄 하나를 둡니다. 같은 단락의 밀접한 선언·대입·호출마다 기계적으로 빈 줄을 넣지는 않습니다. 여는 중괄호 직후·닫는 중괄호 직전의 장식용 빈 줄과 연속 빈 줄은 넣지 않습니다. **한 줄 우선은 식의 폭에 관한 규칙이지 세로 여백을 없애라는 뜻이 아닙니다.**
- `if`·`else`·반복문은 한 문장이어도 중괄호를 씁니다. 실패·제외 조건을 먼저 처리해 정상 경로의 중첩을 줄이되, 조기 `return`·`continue`로 바꿀 때는 기존 자원 정리·상태 반영·통지·반복문의 진행을 건너뛰지 않습니다. 기존 변수의 대입을 조건식에 숨기지 않습니다. C++ 조건 선언과 지원 표준의 `if (init; condition)`은 허용하며, 이를 블록 밖으로 옮겨 잠금·소유 객체의 수명을 늘리지 않습니다. C++ 포인터는 `pointer != nullptr`, C 포인터는 `pointer != NULL`처럼 검사하고 불리언은 `if (isReady)`처럼 씁니다.
- **조건은 판단 근거가 보이게 씁니다.** `&&`·`||`를 혼합할 때는 의도한 묶음에 괄호를 쓰고, 복잡한 부정식·중첩 조건 연산자(`?:`)는 의미 있는 술어나 명시적인 분기로 풀어냅니다. 짧은 한 단계 값 선택에는 `?:`를 사용할 수 있습니다. 다른 실패 이유를 빈 줄 회피용 긴 조건 하나로 합치지 않으며, 같은 처리를 하는 간단한 검사까지 무조건 분리하지도 않습니다. 분기 변환에서도 평가 순서·횟수·단락 평가·결과 타입과 참조 여부를 보존합니다.
- **함수는 읽을 수 있는 하나의 작업 단위로 둡니다.** 검증·준비·처리·결과 반영의 논리 단락을 구분하고, 다른 책임이나 반복되는 정책이 섞이면 기존 함수 또는 의미 있는 보조 함수로 분리합니다. 줄 수·중첩 깊이의 임의 상한, 문장마다 만드는 전달 함수, 큰 본문을 숨기기 위한 지역 람다·매크로로 대체하지 않습니다.
- **주석은 코드에 없는 이유·계약을 적습니다.** 제약·단위·불변조건·외부 우회책의 근거는 남기되 문장을 그대로 읽어 주는 주석, 작업 과정·변경 이력, 주석 처리한 죽은 코드를 제품 코드에 쌓지 않습니다. 바꾼 코드와 인접 주석이 어긋나면 함께 수정합니다. 공개 API 문서·라이선스·도구 지시문과 이 가이드의 Good/Bad 표식은 유지합니다.
- **네임스페이스 블록마다 내용에 공백 4칸을 추가합니다.** 이름 있는 네임스페이스와 익명 네임스페이스 모두 같은 규칙이며, 중첩 블록은 깊이마다 4칸씩 누적합니다. 여는·닫는 중괄호는 선언과 같은 깊이에 두고 Allman을 유지합니다. 중첩 네임스페이스는 C++17의 `namespace Northstar::Net` 단일 정의를 기본으로 하며, 이는 하나의 블록이므로 내용은 한 단계만 들여씁니다. 프로젝트 표준이 C++17 미만일 때만 이름 있는 블록을 중첩합니다. C# 블록형 namespace에도 같은 들여쓰기를 적용하지만, 파일 범위 namespace에는 중괄호 블록이 없으므로 추가 들여쓰기를 하지 않습니다. 파일 내부 구현에는 익명 네임스페이스를 사용하고 헤더에는 익명 네임스페이스를 두지 않습니다.
- **멤버 변수는 타입이나 추가한 순서가 아니라 역할·불변조건으로 묶습니다.** 서로 함께 쓰거나 함께 유효해야 하는 값은 인접하게 두고 그룹 사이에 빈 줄 하나를 둡니다. 같은 그룹 안에서는 한 줄에 변수 하나를 연속 선언합니다. 예를 들어 의존 객체·설정값·이동 상태·전투 상태·캐시는 구분하되, 모든 클래스에 이 그룹을 만들거나 이 순서를 기계적으로 강제하지 않습니다.
- 같은 접근 섹션의 고정 상수·정적 공유 상태·인스턴스 상태는 서로 구분합니다. 새 멤버는 계약이 허용하는 위치의 관련 그룹에 넣고 무조건 끝에 덧붙이지 않습니다. **모든 언어에서 재배치·중간 삽입 전에** 위치 기반 생성·집계 초기화, 필드 초기화 평가 순서, 직렬화·리플렉션·레이아웃 계약을 확인합니다. 끝에 추가하는 것도 자동으로 안전한 것은 아니며, 소비자·데이터 형식의 변경이 필요하면 단순 스타일 정리로 처리하지 않습니다. 역할이 이름만으로 분명하지 않은 그룹에만 짧은 설명 주석을 붙이며 장식용 구분선·빈 그룹·가독성만을 위한 새 래퍼 타입을 만들지 않습니다.

C/C++ 전용 배치 규칙과 예시는 [C/C++ 전용 코딩 규칙](/language-style-c-cpp.md)을 따릅니다. 이 문서에서 그 문서로 옮긴 4~6장(C++ 표현·수명·라이브러리, C 전용 규칙, 헤더·소스·공개 경계)도 장 번호를 그대로 유지하므로, 이 문서에 4~6장이 없는 것은 누락이 아닙니다.

### 7. 에이전트 적용 규칙

1. 작성 전에 대상 언어·표준·빌드·포매터·같은 영역의 기존 스타일을 확인합니다. 이 문서는 프로젝트 설정을 우회하는 포매터 지시가 아닙니다.
2. 네이밍·중괄호·들여쓰기 등 스타일 기본값은 명시 규칙과 같은 영역의 일관된 기존 패턴이 모두 없는 새 코드에 적용합니다. 기존 코드와 섞이는 수정은 해당 표기를 유지하되, 1장의 가독성 최소 기준은 작성·수정한 논리 단위에 적용합니다. 명시적인 스타일 이전 요청이 없다면 기존 필드·파일·공개 API를 재명명하지 않습니다.
3. 수정 목적과 관계없는 정렬·줄바꿈·include 재배열·일괄 rename을 하지 않습니다. 작성·수정한 블록 및 선언 그룹의 가독성 정리는 관련 변경이지만, 이를 빌미로 무관한 함수·파일까지 재포맷하지 않습니다. 포매터가 불가피하게 바꾸는 범위도 가능한 한 제한합니다.
4. 외부 함수·상속 override·인터페이스 구현·프로토콜 훅·매크로·네임스페이스·생성 코드·ABI 심볼은 원래 이름을 유지합니다. `std::make_unique`, Godot `_ready/_process/_bind_methods`, Python `__init__`, JS `constructor`, Go `main/init`은 위반이 아닙니다. 단순히 PascalCase를 만들기 위한 forwarding wrapper나 호환 alias를 추가하지 않습니다.
5. 소유권·수명·오류·ABI가 미확인인 상태에서 일반 C++ 기본값으로 엔진 코드를 추정하지 않습니다. Godot 관련 세부 사실은 OKF의 `game/godot-cpp.md`(Godot와 C++ 게임 개발) 또는 프로젝트의 Godot 지침, 해당 프로젝트의 실제 버전·설정으로 확인합니다.
6. 위반 여부는 이 기본값의 적용 범위 안에서만 판정합니다. Good/Bad 예제는 외부 프로젝트가 모두 같은 이름을 써야 한다는 주장이 아닙니다.
7. 코드 작업 언어가 바뀌어도 이 concept을 먼저 읽고 공통 이름 규칙과 해당 언어의 예외를 함께 적용합니다. C/C++ 상세 규칙·Godot 엔진 지침을 다른 언어의 런타임/메모리 관리 정책으로 확대하지 않습니다.
8. 작성·수정한 범위에서 문장·단락 간격, 선언 그룹, 조건·중첩·함수 책임, 이름·단위·호출 인수, 주석의 정확성을 확인합니다. 본문의 가독성 기준으로 정리하되 연결된 분기·언어 문법·포매터·평가 여부/순서/횟수·초기화·수명·복사/이동/할당·레이아웃 계약을 보존합니다. 명시적인 가독성 점검 요청에서는 제시된 예시뿐 아니라 요청 대상에서 같은 읽기 비용을 만드는 다른 패턴과 Good 예제의 규칙 위반도 확인합니다.

## 근거와 사실·선택의 구분

- **선택:** 타입·함수·인터페이스의 `PascalCase`, 필드 `mPascalCase`, 지역·인자의 `camelCase`, 상태 `s`·`g`, 고정 상수·enum 값·비트 플래그의 `UPPER_SNAKE_CASE`는 이 번들의 언어 공통 선택입니다. Go 비공개 상수의 `_` 접두사, 언어별 데이터 필드·패키지·파일명·포매팅 예외는 본문에서 하나씩 정했습니다. C++ 세부 규칙까지 언어 중립 표준으로 주장하지 않습니다.
- **사실과 설계 근거:** [C++ Core Guidelines C.2](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rc-struct)는 불변조건을 가진 class와 독립 데이터의 struct를 구분합니다. [C.20](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rc-zero)은 기본 연산을 직접 정의하지 않아도 되는 설계, [F.16](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rf-in)은 입력 전달 비용·const 참조, [R.1](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rr-raii)은 RAII를 다룹니다.
- **소유권 근거:** [R.3](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rr-ptr)의 raw pointer 비소유는 설계 규칙이며 C·legacy ABI 예외가 있음을 함께 확인했습니다. [R.20](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rr-owner)·[R.21](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rr-unique)은 소유 스마트 포인터와 공유 소유가 없을 때 unique ownership 우선을 설명합니다. [ES.11](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-auto)은 `auto` 및 복사/참조 차이, [ES.49](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-casts-named)는 의도가 드러나는 cast를 다룹니다. 이 문서가 그 출처의 모든 네이밍·표준 선택을 채택한다는 뜻은 아닙니다.
- **Godot 사실:** godot-cpp 버전·핀·`memnew` 매크로·C++17 요구 같은 바인딩 사실과 근거는 [Godot와 C++ 게임 개발](/game/godot-cpp.md)(버전 핀)과 [godot-cpp 빌드·실행 검증](/game/godot-build.md)(C++17 플래그)·[Godot Scene·Resource 수명](/game/godot-runtime.md)(`memnew`)에서 관리합니다. 다른 바인딩 버전은 해당 핀의 소스로 다시 확인합니다.
- **확인일:** C/C++·Godot 근거는 2026-09-26, 다국어 의미·적용 범위는 2026-09-27에 확인했습니다. 인용 URL·앵커와 godot-cpp 10.0.0 핀의 C++17 플래그·`#pragma once`·`memnew`·`ClassDB::bind_integer_constant`, C# 14 `field` 키워드, TS·Node.js의 enum 비지원 범위는 2026-10-12에 다시 확인했습니다(Core Guidelines 앵커는 소문자 `rc-struct`형 `<a name>`으로 갱신). 2026-10-15에는 C# 14 `field` 키워드와 .NET 10 출시일(2025-11-11), Node.js 타입 스트리핑 stable(v24.12·v25.2)과 `--experimental-transform-types` 제거(v26.0.0), `erasableSyntaxOnly`, Core Guidelines 앵커 9개, 언어별 의미 근거 링크의 응답과 Go·Python·MDN 앵커를 다시 확인했습니다([C# 14](https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-14), [.NET 10 릴리스 노트](https://github.com/dotnet/core/blob/main/release-notes/10.0/10.0.0/README.md), [Node.js TypeScript 문서](https://nodejs.org/api/typescript.html)). Core Guidelines 원문의 문서 날짜는 C++ 표준 릴리스일이 아닙니다. Godot 릴리스·빌드 사실의 정본은 [Godot와 C++ 게임 개발](/game/godot-cpp.md)과 [godot-cpp 빌드·실행 검증](/game/godot-build.md)입니다.
- **언어별 의미 근거:** [Go exported identifiers](https://go.dev/ref/spec#Exported_identifiers), [gofmt](https://go.dev/doc/effective_go#formatting)·[세미콜론 삽입](https://go.dev/doc/effective_go#semicolons), [Python 예약 식별자](https://docs.python.org/3/reference/lexical_analysis.html#reserved-classes-of-identifiers), [C# 프로퍼티](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/properties), [JS constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/constructor)·[private elements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_elements), [JS 줄바꿈·ASI](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#automatic_semicolon_insertion)를 확인했습니다. 소스의 네이밍 예제는 언어 의미의 근거이며 이 문서의 스타일 규칙 전체를 대체하지 않습니다.

## 관리 범위

- 전체 가이드를 저장소에 포함하도록 승인받아 공개 관리합니다. 이 파일이 네이밍·언어별 예외·언어 공통 가독성 규칙의, [C/C++ 전용 코딩 규칙](/language-style-c-cpp.md)이 C/C++ 상세 규칙의 정본이며, 같은 내용을 로컬 전용 가이드나 별도 폴백 표로 복제하지 않습니다.
- 프로젝트의 실제 지침·컴파일러 계약이 우선합니다. 공개 가이드를 배포해도 기존 프로젝트 전체를 자동 재명명하거나 언어 버전을 올리지 않습니다.
- 변경 이력은 [번들 변경 이력](/log.md)에서 관리합니다. Godot 엔진별 API·수명·빌드 사실은 [Godot와 C++ 게임 개발](/game/godot-cpp.md)에 연결합니다.

## 최종 요약표

공통 이름 규칙과 언어별 예외를 함께 읽습니다. 아래 C/C++ 문법·소유권·헤더 항목은 해당 언어에서만 적용하며 모든 언어에 같은 메커니즘을 요구하지 않습니다.

| Element | Convention | Example |
|---|---|---|
| 적용 언어 | C/C++·C#·Go·Python·JS·TS 등 전체, 언어 의미 예외 우선 | 소유 Python/JS 함수도 `GetUser()` |
| Go 공개성 | exported 타입·함수는 PascalCase, 비공개는 camelCase; 상수는 대문자, 비공개는 _ 접두사 | `Increment`, `incrementCore`, `MAX_PLAYERS`, `_MAX_PLAYERS` |
| 프로퍼티·event | PascalCase, backing field와 구분 | `Value`, `ValueChanged` |
| JS/TS 런타임 비공개 필드 | # + mPascalCase | `#mValue` |
| 클래스 | PascalCase, 불변조건 캡슐화 | `PlayerController` |
| 구조체 | PascalCase, 독립 데이터 집합 | `SpawnPoint` |
| enum 타입 | PascalCase, C++은 enum class 기본 | `ConnectionState` |
| scoped enum 값 | UPPER_SNAKE_CASE, 타입명 중복 생략 | `ConnectionState::CONNECTED` |
| C·Go 등 unscoped 열거 값 | 프로젝트·타입 접두사 + UPPER_SNAKE_CASE | `NS_CONNECTION_STATE_CONNECTED` |
| 함수 | PascalCase, 동작·질의가 드러나는 이름 | `LoadLevel()` |
| 메서드 | PascalCase, 불변 질의는 const | `GetPlayerId() const` |
| 캡슐화 인스턴스 필드 | mPascalCase, JS/TS 런타임 비공개는 # 접두사 | `mPlayerId`, `#mValue` |
| 단순 데이터 필드 | C/C++·Python dataclass·JS/TS 데이터는 camelCase, C# property·Go exported는 PascalCase | `teamId`, `TeamId` |
| static·모듈 내부 상태 | sPascalCase, 고정 상수 제외 | `sInstanceCount`, `sCache` |
| 파일 내부 상태 | sPascalCase, 언어의 접근·모듈 경계 유지 | `sConfiguration` |
| 외부 전역 상태 | gPascalCase, Go exported는 PascalCase | `gApplication`, Go `Application` |
| 지역 변수 | camelCase, 필요한 곳에서 초기화 | `playerCount` |
| 매개변수 | camelCase, 계약이 드러나는 이름 | `deltaSeconds` |
| const 런타임 지역 값 | camelCase, const만으로 상수 명명하지 않음 | `const auto playerCount = players.size();` |
| 명명된 고정 상수 | UPPER_SNAKE_CASE, Go 비공개 package·계약상 필요한 Python 비공개 모듈 상수는 _ 접두사 | `MAX_PLAYERS`, `_MAX_PLAYERS`, `NS_DEFAULT_PORT` |
| constexpr 변수 | UPPER_SNAKE_CASE | `constexpr int MAX_PLAYERS = 4;` |
| constexpr 함수 | 함수 규칙인 PascalCase | `Square(int value)` |
| 매크로 | 프로젝트 접두사 + UPPER_SNAKE_CASE | `NS_ENABLE_TRACING` |
| namespace·package | C++/C# namespace는 PascalCase, Go/Python package는 소문자 | `Northstar::Net`, `combat` |
| 템플릿 타입 매개변수 | T 또는 TPascalCase | `T`, `TValue`, `TKey` |
| 템플릿 비타입 상수 매개변수 | UPPER_SNAKE_CASE | `CAPACITY` |
| 템플릿 템플릿 매개변수 | TPascalCase | `TContainer` |
| 타입 별칭 | PascalCase, C++ using·C typedef | `using PlayerId = std::uint32_t;` |
| 파일명 | C/C++·C#·JS/TS는 PascalCase, Go/Python은 소문자 파일명 | `Counter.ts`, `counter.go`, `counter.py` |
| 중괄호·들여쓰기 | C/C++·C#·JS/TS Allman·4칸, Go gofmt, Python 콜론·4칸 | 기존 포매터·언어 문법 우선 |
| 줄 길이 | 강제 상한 없음, 폭만으로 접지 않음 | 시그니처·호출·초기화자 한 줄 우선 |
| 문장·함수 | 실행 문장은 한 줄에 하나, 함수는 하나의 작업 단위 | 임의 줄 수 상한·압축·전달 함수 남발 금지 |
| 이름·호출 인수 | 역할·불리언 의미·필요한 단위와 리터럴 인수의 뜻을 표시 | `timeoutMilliseconds`, 외부 API 계약 보존 |
| 주석 | 이유·계약·불변조건, 코드와 함께 갱신 | 자명한 중계·작업 이력·죽은 코드 누적 금지 |
| 포인터·참조 표기 | 타입에 붙임, 변수당 선언 하나 | `const Player* player`, `Player& player` |
| 빈 줄 | 독립 제어문 사이·제어문 뒤 다음 문장·논리 단락·정의 사이 한 줄 | 연결부·닫는 중괄호 앞·연속 장식용 빈 줄 없음, 밀접한 문장마다 넣지 않음 |
| 조건문·반복문 | 항상 블록, 안전한 조기 반환·continue, 복합 조건의 묶음 명시 | 중첩 삼항·부수 효과 은폐 금지, 조건 선언의 수명 보존 |
| switch | case는 switch 블록 깊이, 복합 경로 사이 빈 줄, 명시적 종료 | 본문 없는 연속 레이블은 같은 경로 |
| namespace 배치 | 이름 있는·익명 블록마다 내용 +4칸, 중괄호는 선언 깊이의 Allman | C++17 `namespace Northstar::Net`은 한 블록; C# 블록형도 동일, 파일 범위형은 추가 깊이 없음 |
| 클래스 접근 순서 | public → 필요한 protected → private | public API 다음 private 상태 |
| 멤버 배치 | 역할·불변조건별 그룹, 그룹 사이 빈 줄 하나 | 모든 언어의 재배치·중간 삽입 시 순서 계약 확인 |
| C++ 멤버 순서·초기화 | 선언 순서 초기화·역순 소멸, 모든 생성 경로의 유효값 | 수명·ABI·직렬화·근거 있는 성능 배치 우선 |
| 소유권 | 값 우선, 단독 소유 unique_ptr, 실제 공유만 shared_ptr | `std::unique_ptr<PlayerController>` |
| raw pointer·참조 | 일반 C++에서는 비소유, 외부 계약 예외 | 선택 대상 `T*`, 필수 대상 `T&` |
| C++ 자원 정리 | RAII·Rule of Zero, 다른 언어는 해당 런타임 수명 모델 | 파일·락·핸들을 스코프와 결합 |
| 이동 | 필요할 때만 소유권 이전, 반환값 무조건 move 금지 | `return result;` |
| 예외·RTTI | 빌드·ABI·엔진 정책 우선 | 경계를 넘는 예외 전파 금지 |
| 람다 | 명시적 캡처·수명 확인 | `[minimumScore](const PlayerScore& score)` |
| cast | 필요한 named cast와 범위 검증 | `static_cast<std::uint32_t>(value)` |
| STL | 적합한 표준 도구 재사용, 복사·할당·무효화 검토 | 읽기 전용 순회 `const auto&` |
| C 공개 이름 | 네임스페이스 대신 프로젝트 접두사 | `NsBuffer`, `NsBufferCreate` |
| C 메모리 | allocator/free 짝·오류·크기 검증 | 임시 포인터로 `realloc` 결과 수신 |
| C 헤더 | C 호환 선언, 필요할 때만 extern C | `NsGetVersion(void)` |
| Include | 짝 헤더 → 프로젝트 → 외부 → 표준 → 플랫폼 | `#include "PlayerController.h"` |
| C/C++ 헤더 보호 | 새 헤더는 `#pragma once`, 기존 guard 프로젝트는 guard 유지 | `#pragma once` |
| 언어 표준 | C++ 전용 C++17·C 전용 C99 기본, 다른 언어와 기존 프로젝트 버전은 유지 | `-std=c++17` |
| 공개 API | 필요한 계약만 노출, 구현은 소스에 숨김 | 소유권·오류·수명 명시 |
| 외부 API·Godot 훅 | 이름·ABI·수명 계약 보존 | `_ready`, `_process`, `_bind_methods` |
| Godot 할당·수명 | 엔진 소유 규칙이 표준 스마트 포인터·`delete` 기본값보다 우선 | [Godot Scene·Resource 수명](/game/godot-runtime.md) |
| 기존 코드 수정 | 기존 표기 유지, 작성·수정한 논리 단위에 가독성 최소 기준 적용 | 무관한 재포맷·rename 및 외부 계약 변경 금지 |

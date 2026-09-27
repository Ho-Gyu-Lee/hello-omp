---
type: Rule
title: 언어 공통 코딩 스타일
description: C/C++·C#·Go·Python·JavaScript·TypeScript 등을 포괄하는 PascalCase 타입/함수, UPPER_SNAKE_CASE 고정 상수/enum 값과 언어별 문법·공개 범위·외부 계약 예외.
tags: [rule, cross-language, c, cpp, csharp, go, python, javascript, typescript, coding-style, naming, ownership]
timestamp: 2026-09-27T00:00:00Z
---

# 언어 공통 코딩 스타일

이 문서는 이 저장소가 배포하는 **언어 공통 기본 규칙의 정본**입니다. 전통적인 Microsoft 계열의 표기를 참고하되 특정 Microsoft 규격이나 레거시 관행 전체를 재현하지 않습니다. 네이밍·배치는 **선택**, 언어 제약·수명·ABI 계약은 **사실**로 구분합니다. Hungarian notation, 수동 메모리 관리, 무조건적인 매크로 사용까지 가져오지 않습니다.

이 기본값은 **C/C++에 한정하지 않습니다. C#·Go·Python·JavaScript·TypeScript 등을 포함해 사용자가 작성하는 모든 언어의 코드에 적용**합니다. 언어 목록은 예시이며 그 밖의 언어도 같은 판정 기준을 따릅니다. 타입·함수·메서드는 `PascalCase`, **고정 상수·enum 값은 `UPPER_SNAKE_CASE`**, 캡슐화된 인스턴스 필드는 `mPascalCase`, 지역 변수·인자는 `camelCase`입니다. [공통 코딩 스타일](/coding-style.md)의 적용 우선순위를 따르며 기존 프로젝트 규칙을 자동으로 덮어쓰지는 않습니다. 다음 「프로젝트 적용 규칙」부터 「에이전트 적용 규칙」까지는 프로젝트 지침으로 옮겨 쓸 수 있습니다. Godot 참조는 OKF `game/godot-cpp.md` 또는 프로젝트의 Godot 지침으로 확인합니다.

## 프로젝트 적용 규칙

### 1. 우선순위와 언어 수준

1. 컴파일러·플랫폼·ABI·외부 API가 요구하는 계약을 지킵니다. 예약 식별자와 생성 코드도 임의 변경하지 않습니다.
2. 현재 작업에 대한 명시적 요구와 프로젝트의 `AGENTS.md`, 스타일 문서, 빌드 설정, 포매터·린터 설정을 따릅니다. 컴파일러·툴체인의 기본 활성 명명 진단도 확인합니다. 실제 활성 진단과 충돌하는 이름은 해당 범위에서 도구가 요구하는 표기를 따르고 예외를 설명하며, 표기를 강제하려고 경고를 억제하지 않습니다. 반대로 새 린터를 도입해 이 규칙을 바꾸지도 않습니다. 명시적 요구가 기존 규칙의 변경을 뜻할 때만 해당 범위를 변경하며, 외부 계약은 스타일 요청으로 무효화되지 않습니다.
3. 명시적 규칙이 없으면 같은 영역의 기존 코드 3–5개를 살펴 일관된 패턴을 따릅니다.
4. 명시 규칙과 같은 영역의 일관된 기존 패턴이 모두 없는 새 코드에는 이 언어 공통 기본값을 적용합니다. Python은 보통 snake_case, JS는 보통 camelCase라는 생태계 관례만으로 이 문서의 함수·메서드 `PascalCase`를 바꾸지 않습니다. 단 이름이 공개 범위·자동 탐색·프로토콜 동작을 바꾸는 경우에는 아래 언어별 예외가 우선입니다.

프로젝트가 선언한 언어 버전, 컴파일러·런타임, 포매터, 모듈/패키지 체계를 먼저 확인합니다. 스타일을 적용한다는 이유로 버전·빌드 설정을 바꾸지 않습니다. **C++에서만 새 프로젝트 기본 표준은 C++17**, **C에서만 새 코드 기본 문법은 C99**입니다. 각각 godot-cpp 10.0.0의 요구 및 중첩 네임스페이스·inline 변수·`if constexpr`, `<stdint.h>`·`<stdbool.h>`·`static inline`을 사용할 수 있는 기준입니다. C++ 예제는 C++17 기준이고, 기존 프로젝트가 더 낮은 표준이면 지원되는 표현으로 바꿉니다. C++20 기능은 프로젝트가 해당 표준을 선언한 경우에만 사용합니다. 이 선택으로 C#·Go·Python·JS·TS의 버전을 지정하지 않으며 C++ 소유권·포인터·헤더·RTTI 규칙도 다른 언어에 이식하지 않습니다.

### 2. 네이밍 기본값

일반 함수·런타임 변수에는 소문자 `snake_case`를 새로 도입하지 않습니다. **고정 상수·enum 값·비트 플래그·상수형 비타입 템플릿 매개변수·매크로는 `UPPER_SNAKE_CASE`**를 사용합니다. 타입·함수의 약어는 `HttpClient`, `GetId`, `XmlReader`처럼 단어로 취급하고 상수에서는 `HTTP_TIMEOUT`, `PLAYER_ID_BITS`처럼 대문자로 씁니다. 반복문의 짧은 인덱스 `i`, `j`는 허용하되 `pFoo`, `pszName`, `dwCount`처럼 타입을 이름에 복제하는 접두사는 기본값으로 사용하지 않습니다. `m`, `s`, `g`는 타입이 아니라 저장 위치·공유 상태를 표시하는 제한된 예외입니다.

- **클래스·구조체·열거형·인터페이스·타입 별칭:** `PascalCase`입니다. `PlayerController`, `SpawnPoint`, `ConnectionState`, `PlayerId`, `SessionStore`처럼 역할을 드러냅니다. C#·TS를 포함해 인터페이스에 `I` 접두사를 자동 추가하지 않습니다. 기존 프로젝트의 `ISessionStore` 관례나 외부 계약이 있으면 그것을 보존합니다. Go에서 비공개 타입이 필요하면 공개 범위를 지키는 소문자 시작 예외를 적용합니다.
- **함수·메서드:** 공개·내부 구현 모두 원칙은 `PascalCase`입니다. `LoadLevel`, `IsReady`, `HasItems`, `GetPosition`처럼 표현합니다. Python·JS·TS의 소유 함수에도 같은 규칙을 사용합니다. 생성자·연산자·프로토콜 메서드와 Go의 비공개 심볼 등 이름에 의미가 있는 경우만 아래 예외를 적용합니다. 함수로 쓰는 JS/TS의 const 화살표 함수도 `const GetUser = ...`이며, 함수 인자로 받는 콜백 변수는 인자 규칙대로 `onComplete`입니다.
- **캡슐화된 인스턴스 데이터 필드:** `mPascalCase`입니다. `mPosition`, `mPlayerId`, `mMaxPlayers`처럼 씁니다. 새 클래스는 지원되는 접근 제어로 상태를 기본 비공개로 두며 `member_name_`·`_memberName`을 이 기본값으로 사용하지 않습니다. JS/TS의 런타임 비공개 필드는 `#mPlayerId`이고, Python의 `mPlayerId`는 이름 관례일 뿐 강제 접근 제어가 아닙니다.
- **데이터 필드와 프로퍼티:** C/C++의 단순 public 데이터 struct, Python dataclass, JS/TS의 plain object·데이터 타입 필드는 `camelCase`입니다. C#의 프로퍼티·record 데이터 멤버와 Go의 exported struct 필드는 `PascalCase`를 사용합니다. C#/Python/JS/TS의 접근자 기반 프로퍼티도 `Value`처럼 `PascalCase`입니다. 저장 필드 `mValue`와 공개 프로퍼티 `Value`를 구분합니다. JSON·DB·네트워크 키는 별도 계약이며 스타일에 맞추려고 바꾸지 않습니다.
- **지역 변수·매개변수:** `camelCase`입니다. `playerId`, `deltaSeconds`, `isReady`처럼 씁니다. 런타임 입력을 보관하는 `const` 지역 변수·매개변수도 같은 규칙입니다.
- **공유 상태:** 클래스 static 필드, 함수 static, 모듈 내부 공유 상태는 `sPascalCase`, 외부에 노출된 전역 상태는 `gPascalCase`입니다. `sInstanceCount`, `sCache`, `gApplication`이 예입니다. 런타임에 만들어지는 읽기 전용 공유 객체도 같은 상태 규칙을 따릅니다. Go에서는 exported 여부가 우선하므로 외부 전역은 `Application`, 비공개 패키지 상태는 `sApplication`입니다. 불필요한 공유 상태는 함수 인수·객체 소유로 대체합니다.
- **C++ 연결 예외:** `extern const`로 선언하고 한 번역 단위에서 정의한 런타임 const 객체는 `gConfiguration`처럼 씁니다. `extern`·`inline` 없는 네임스페이스 범위 const 객체는 내부 연결이므로 `sConfiguration`입니다. 익명 네임스페이스를 포함한 파일 내부 상태도 `sPascalCase`입니다. 다른 언어에는 C++의 연결 규칙을 적용하지 않습니다.
- **의미 있는 고정 상수:** 언어 공통으로 `UPPER_SNAKE_CASE`입니다. `MAX_PLAYERS`, `DEFAULT_PORT`, `PI`가 기본이며 클래스 static·전역·지역의 고정 상수에 `m`·`s`·`g`를 붙이지 않습니다. C# `const`와 실제 고정값인 `static readonly`, Python 상수, JS/TS의 고정값 `const`, Go 상수에도 적용합니다. **비정적 필드는 const·readonly여도 필드 규칙(`mPascalCase` 등)이 우선**합니다. 객체와 무관한 새 고정값은 static 상수로 표현해 대문자로 쓰며, 기존 필드의 저장 방식은 스타일만으로 바꾸지 않습니다. 호출 중 받은 읽기 전용 지역 값은 `playerCount`처럼 기존 역할 규칙을 따릅니다. `const`·`readonly`·`Final`만으로 고정 상수라고 판정하지 않습니다. JS의 const 객체도 내부 데이터까지 불변이 되지는 않습니다.
- **`constexpr`:** 변수는 `constexpr int MAX_PLAYERS = 4;`처럼 `UPPER_SNAKE_CASE`입니다. `constexpr` 함수는 여전히 함수이므로 `Square(int value)`처럼 `PascalCase`입니다. `const auto playerCount = players.size();`는 런타임 지역 값이므로 `camelCase`를 유지합니다.
- **열거형 타입과 값:** 타입명은 `ConnectionState`처럼 `PascalCase`, C++ `enum class`·C# enum·Python Enum·TS enum의 소유 값은 `DISCONNECTED`, `CONNECTED`처럼 `UPPER_SNAKE_CASE`입니다. scoped 값은 `ConnectionState::CONNECTED`처럼 타입명 접두사를 반복하지 않습니다. C·Go처럼 값이 주변 범위에 들어오면 `NS_CONNECTION_STATE_CONNECTED`, `CONNECTION_STATE_CONNECTED`처럼 필요한 프로젝트·타입 접두사도 대문자로 씁니다. 비트 플래그와 마스크도 `READ_ONLY`, `ALL_FLAGS`처럼 같은 규칙입니다. 기존 ABI·JSON/wire 값·엔진 상수 이름은 보존하며 enum 문법이 없는 언어에 스타일만을 위한 enum 추상화를 만들지 않습니다.
- **매크로:** 프로젝트 접두사를 포함한 `UPPER_SNAKE_CASE`입니다. `NS_ENABLE_TRACING`, `NS_PACKET_HEADER_BITS`가 예입니다. 6장의 예외로 include guard를 쓸 때도 `NS_NET_PACKET_H`처럼 경로를 반영합니다. 표기가 같다고 고정 상수를 매크로로 바꾸지는 않습니다. C/C++의 구현 예약 영역인 `__Name`, `_Name` 등을 새 이름으로 사용하지 않습니다. Go 비공개 상수용 `_`는 아래에 명시한 별도 언어 예외입니다.
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

### 3. 배치·선언·제어 흐름

**공통 선택:** 기존 프로젝트 포매터가 우선입니다. 명시 포매터가 없으면 C/C++·C#·JS/TS 블록은 Allman·공백 4칸, Go는 gofmt, Python은 콜론·공백 4칸입니다. 위 언어별 문법 예외가 아래보다 우선합니다. 아래 구체적인 `switch`·포인터·네임스페이스·접근 지정자 및 코드 예제는 C/C++ 기준이며, 다른 언어에 없는 구문을 강제하지 않습니다. 폭만을 위한 줄바꿈 금지와 논리 단락 사이 빈 줄 규칙은 언어 공통입니다.

- 함수·클래스·구조체·열거형·네임스페이스·조건문·반복문의 여는 중괄호를 다음 줄에 둡니다. `else`와 `catch`도 닫는 중괄호 다음 줄에 둡니다. 초기화 목록의 `{}`는 블록이 아니므로 `Point point{1, 2};`처럼 같은 줄에 둡니다.
- **강제 줄 길이 상한은 두지 않습니다.** 선언·시그니처·인자 목록·호출·체인·객체 초기화자는 한 줄을 우선합니다. 폭을 맞추기 위한 줄바꿈은 하지 않습니다. 너무 복잡하면 의미 있는 중간 값이나 함수로 나누되 단순한 긴 줄을 쪼개기 위한 추상화는 만들지 않습니다. 포매터·린터가 줄 길이를 강제할 때는 예외입니다.
- 한 줄 우선은 여러 문장을 한 줄에 넣거나 제어문 본문을 생략하라는 뜻이 아닙니다. 짧은 `if`, 반복문, 함수도 정상적인 블록으로 씁니다. 람다 본문도 문장 블록이면 같은 원칙을 적용합니다.
- `if (condition)`, `for (...)`, `switch (state)`처럼 제어 키워드 뒤에 공백을 둡니다. 호출은 `LoadLevel(levelId)`처럼 씁니다. 이항 연산자 양옆과 쉼표 뒤에는 공백을 둡니다. 탭·연속 공백으로 열을 정렬하지 않습니다.
- C와 C++ 모두 `Type* pointer`, `Type& reference`, `const Type* pointer`처럼 `*`·`&`를 타입 쪽에 붙입니다. C에는 참조가 없습니다. **선언당 변수는 하나**로 하여 `int* first, second;`의 오해를 없앱니다. 함수 포인터처럼 문법이 복잡하면 적절한 타입 별칭을 사용합니다.
- 변수는 처음 사용하는 곳 가까이 선언하고 즉시 초기화합니다. 초기화와 대입을 불필요하게 분리하지 않습니다. 함수 선언에도 의미 있는 매개변수 이름을 적습니다. 클래스 선언의 순서와 구현 파일의 메서드 정의 순서를 가능한 한 맞춥니다.
- 개념적 단락·함수 정의·접근 섹션 사이에는 빈 줄 하나를 둡니다. 여는 중괄호 직후·닫는 중괄호 직전의 장식용 빈 줄과 연속 빈 줄은 넣지 않습니다.
- `if`·`else`·반복문은 한 문장이어도 중괄호를 씁니다. 일반 경로를 읽기 쉽게 만드는 조기 반환을 선호합니다. 대입을 조건식에 숨기거나 단순 중첩을 깊게 만들지 않습니다. C++ 포인터는 `pointer != nullptr`, C 포인터는 `pointer != NULL`처럼 검사하고 불리언은 `if (isReady)`처럼 씁니다.
- `switch`의 `case`·`default`는 switch 중괄호와 같은 깊이, 본문은 한 단계 들여씁니다. 각 경로는 명시적으로 `break`·`return` 등으로 끝냅니다. 의도적인 fallthrough만 허용하며 C++17은 `[[fallthrough]];`를 사용합니다. C99는 프로젝트 공통 헤더의 `NS_FALLTHROUGH;` 하나를 사용합니다. 먼저 `#if defined(__has_attribute)`로 감싼 뒤 안쪽의 별도 `#if __has_attribute(fallthrough)`가 참이면 `__attribute__((fallthrough))`, 그 밖에는 빈 문장으로 확장합니다. 정의 존재 검사와 함수형 매크로 검사를 하나의 `&&` 식으로 합치지 않습니다. 기존 프로젝트 표기가 있으면 그것을 따릅니다. case별 지역 변수 수명에는 별도 블록을 둡니다. 닫힌 enum을 모두 다룰 때는 불필요한 `default`로 누락 경고를 숨기지 않습니다. 외부 정수·역직렬화 값처럼 유효하지 않은 값이 들어오는 경계는 따로 검증하거나 오류 경로를 둡니다.
- 네임스페이스 내용에는 추가 들여쓰기를 하지 않습니다. 중첩 네임스페이스는 C++17의 `namespace Northstar::Net` 단일 정의를 기본으로 합니다. 프로젝트 표준이 C++17 미만일 때만 블록을 중첩합니다. 파일 내부 구현에는 익명 네임스페이스를 사용하고 헤더에는 익명 네임스페이스를 두지 않습니다.
- 클래스는 `public`, 필요한 경우에만 `protected`, `private` 순서로 씁니다. 접근 지정자는 클래스 중괄호와 같은 깊이, 멤버는 한 단계 들여씁니다. public 타입·상수, 생성/소멸, 사용자가 호출하는 메서드, private 보조 메서드·상태 순으로 정리합니다. `protected` 데이터나 가상의 확장점을 미리 만들지 않습니다. 비정적 필드의 선언 순서가 실제 초기화 순서이므로 생성자 초기화 목록도 그 순서를 따릅니다.

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

### 4. C++ 표현·수명·라이브러리

#### 값, const, constexpr, auto

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

#### 소유권, RAII, 참조, 이동

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

**Godot 예외:** Godot 객체에 위 표준 스마트 포인터·`delete` 기본값을 그대로 대입하지 않습니다. `Ref<T>`, `Node`·scene tree의 수명과 해제, 엔진 콜백·바인딩 계약은 OKF의 `game/godot-cpp.md`(Godot와 C++ 게임 개발) 또는 프로젝트의 Godot 지침을 먼저 따릅니다. `_ready`, `_process`, `_bind_methods` 등의 엔진 요구 이름과 이미 연결된 ABI 진입 심볼은 보존합니다. `memnew`는 네임스페이스 멤버 함수가 아니라 매크로이므로 필요한 곳에서 `memnew(MyNode)`처럼 호출하며 **`godot::memnew(MyNode)`로 쓰지 않습니다.** 엔진 객체를 일반 `std::unique_ptr`의 기본 해제자로 감싸거나 임의로 `delete`하지 않습니다.

소유한 프로젝트에서 새로 작성하는 일반 C++ 메서드는 이 기본값이 적용되면 `PascalCase`를 유지합니다. godot-cpp 저장소 자체의 `snake_case` 스타일을 확장 프로젝트 전체에 자동 강제하지 않습니다. 반대로 godot-cpp 자체를 수정할 때는 그 저장소의 기존 규칙을 따릅니다. C++ 메서드 식별자와 `ClassDB::bind_method` 등에 전달하는 script-facing 이름은 별개의 선택입니다. 이미 scene·직렬화·스크립트에서 사용하는 바인딩 문자열은 보존하고, 새로운 script-facing 이름은 프로젝트의 Godot API 규칙에 따라 별도로 정할 수 있습니다.

Godot 정수 상수·enum 바인딩에서는 `BIND_CONSTANT`·`BIND_ENUM_CONSTANT`가 매크로 인수의 C++ 식을 문자열화해 script 이름으로 쓰고 정수 값을 요구합니다. C++ 내부 `enum class`와 script 이름을 분리하려면 `ClassDB::bind_integer_constant`에 enum·상수 이름과 명시적 정수 변환 값을 전달합니다. Variant 인자·반환 타입으로 enum 자체를 노출해야 한다면 해당 버전의 binding 요구를 확인합니다. 이미 배포한 script 상수·enum 이름은 보존합니다.

#### 예외·RTTI·템플릿·람다·cast·매크로·STL

- **예외:** 빌드·라이브러리·ABI 정책이 우선입니다. 예외를 사용하는 일반 C++ 프로젝트에서는 실패를 예외로 보고하고 RAII로 정리하는 기존 모델을 따릅니다. 예상 가능한 분기·부재에는 기존 상태값·결과 타입을 사용합니다. 예외가 꺼진 프로젝트에서는 명시적 오류 결과와 생성용 팩터리 등 지원되는 경로를 사용합니다. 스타일 문서만 근거로 `throw`나 `try`/`catch`를 추가하거나 예외를 켜지 않습니다. C ABI·플러그인·엔진 경계를 넘어 예외를 전파하지 않으며, 예외를 사용할 수 있는 경계에서 계약에 맞게 오류로 변환합니다. 소멸자는 예외를 내보내지 않습니다. `noexcept`는 실패 경로까지 계약을 보장할 때만 붙입니다.
- **RTTI:** 켜짐·꺼짐을 프로젝트에서 확인합니다. RTTI가 허용된 일반 C++의 실제 다형적 타입 확인에만 `dynamic_cast`·`typeid`를 사용합니다. 가능하면 타입 조회보다 가상 동작·명시적 모델을 사용합니다. 엔진의 자체 타입 시스템이나 RTTI 비활성 빌드에 표준 RTTI를 무조건 들여오지 않습니다. 예외와 RTTI가 Godot에서 안전하다고 가정하지 않습니다.
- **템플릿:** 동일 계약의 실제 타입 차이를 표현할 때 사용합니다. 단순 함수로 충분한 코드를 메타프로그래밍으로 바꾸지 않습니다. 타입 매개변수는 `typename`을 기본으로 하고 필요한 연산·제약을 드러냅니다. 지원 시 concepts를 사용할 수 있지만 낮은 표준에 새 표준 기능을 강제하지 않습니다. 사용하는 번역 단위에서 필요한 정의는 헤더에 제공하거나 명시적 인스턴스화 경계를 설계합니다.
- **람다:** 짧고 사용 지점에 국한된 동작에 사용합니다. 저장되거나 비동기로 실행되는 람다는 명시적 캡처를 기본으로 하고 `[&]`나 `this` 캡처의 수명을 검토합니다. `[this]`는 객체의 수명을 연장하지 않습니다. 즉시 사용하는 짧은 알고리즘 람다에는 의도가 명확할 때 제한된 기본 캡처를 허용합니다. 큰 본문·반복되는 정책에는 이름 있는 함수를 사용합니다.
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

### 5. C 전용 규칙

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

### 6. C/C++ 헤더·소스·공개 경계

include guard·전방 선언·ODR·`.h/.cpp/.c` 배치는 C/C++ 전용입니다. 공개 API 최소화·외부 계약 보존은 언어 공통으로 적용하되 다른 언어의 모듈·import/export·접근 제어 구문을 대체하지 않습니다.

- **Include 순서:** 구현 파일의 짝 헤더, 프로젝트 헤더, 외부 라이브러리 헤더, 표준 라이브러리 헤더, 플랫폼 헤더 순서입니다. 그룹 사이 빈 줄 하나, 그룹 안에서는 경로순 정렬을 기본으로 합니다. 자체 헤더는 `"..."`, 설치된 외부·표준·플랫폼 헤더는 `<...>`를 사용합니다. 플랫폼이 요구하는 include 순서나 사전 컴파일 헤더가 있으면 그 계약을 우선합니다. 헤더에서 이미 우연히 포함되었다는 이유로 직접 사용하는 타입의 필수 include를 생략하지 않습니다.
- **헤더 보호:** 새로 만드는 소유 C/C++ 헤더는 **`#pragma once`를 기본**으로 합니다. 표준 지시문은 아니지만 MSVC·Clang·GCC, 즉 godot-cpp가 지원하는 주요 컴파일러가 모두 지원합니다. Microsoft 계열 관례와 Godot·godot-cpp 코드와도 일치하며 guard 이름 충돌을 없앱니다. 기존 프로젝트가 include guard를 쓰거나 대상 툴체인이 `#pragma once`를 지원하지 않는다고 확인된 경우에만 guard를 사용합니다. 같은 헤더를 심볼릭 링크·복사본 등 여러 경로로 포함하지 않으며 두 방법을 중복 사용하지 않습니다.
- **전방 선언:** 포인터·참조 선언처럼 불완전 타입만으로 충분하고 실제 include 결합을 줄일 때 사용합니다. 값 멤버·상속·inline 본문 등 완전한 타입이 필요한 곳은 include합니다. 표준 라이브러리 타입을 임의로 전방 선언하지 않습니다. PImpl과 불완전 타입의 `std::unique_ptr`는 소멸자 등 완전한 타입이 필요한 연산을 구현 파일에서 정의해야 할 수 있습니다. 단지 헤더 줄 수를 줄이기 위한 PImpl·힙 할당은 도입하지 않습니다.
- **헤더와 구현:** 헤더에는 소비자가 알아야 할 선언과 필요한 타입·템플릿·inline/constexpr 정의만 둡니다. 일반 비-inline 함수 정의와 내부 helper·알고리즘·가변 저장소는 `.cpp`/`.c`로 옮깁니다. 헤더 전역 변수 정의로 여러 번역 단위에 중복 정의를 만들지 않습니다. 필요한 외부 변수는 `extern` 선언과 한 곳의 정의를 사용하고 더 나은 캡슐화가 없는지 먼저 검토합니다.
- **이름 공간 오염:** 헤더에 `using namespace`를 쓰지 않습니다. 구현에서도 `std::`를 기본으로 유지하고 긴 타입은 범위가 제한된 `using` 선언·별칭으로 줄입니다. 공개 헤더에서 내부 매크로·플랫폼 타입·불필요한 third-party include를 전파하지 않습니다.
- **공개와 private API:** 소비자가 선택·조합해야 할 계약만 공개합니다. 구현 보조 함수·튜닝 값·저장 구조·검증 단계를 공개하지 않습니다. private 상태마다 기계적인 getter/setter를 만들거나 확장 요구 없이 `virtual`, `protected`, 상속 훅을 추가하지 않습니다. 공개 API에는 입력 조건, 결과·오류, 소유권·수명, 필요할 때 스레드 제약을 명시합니다.
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

### 7. 에이전트 적용 규칙

1. 작성 전에 대상 언어·표준·빌드·포매터·같은 영역의 기존 스타일을 확인합니다. 이 문서는 프로젝트 설정을 우회하는 포매터 지시가 아닙니다.
2. 명시 규칙과 같은 영역의 일관된 기존 패턴이 모두 없는 새 코드에만 이 기본값을 적용합니다. 기존 코드와 직접 섞이는 추가·수정은 주변 관례를 따라 혼합 스타일을 만들지 않습니다. 명시적인 스타일 이전 요청이 없다면 기존 필드·파일·공개 API를 재명명하지 않습니다.
3. 수정 목적과 관계없는 정렬·줄바꿈·include 재배열·일괄 rename을 하지 않습니다. 포매터가 불가피하게 바꾸는 범위도 가능한 한 제한합니다.
4. 외부 함수·상속 override·인터페이스 구현·프로토콜 훅·매크로·네임스페이스·생성 코드·ABI 심볼은 원래 이름을 유지합니다. `std::make_unique`, Godot `_ready/_process/_bind_methods`, Python `__init__`, JS `constructor`, Go `main/init`은 위반이 아닙니다. 단순히 PascalCase를 만들기 위한 forwarding wrapper나 호환 alias를 추가하지 않습니다.
5. 소유권·수명·오류·ABI가 미확인인 상태에서 일반 C++ 기본값으로 엔진 코드를 추정하지 않습니다. Godot 관련 세부 사실은 OKF의 `game/godot-cpp.md`(Godot와 C++ 게임 개발) 또는 프로젝트의 Godot 지침, 해당 프로젝트의 실제 버전·설정으로 확인합니다.
6. 위반 여부는 이 기본값의 적용 범위 안에서만 판정합니다. Good/Bad 예제는 외부 프로젝트가 모두 같은 이름을 써야 한다는 주장이 아닙니다.
7. 코드 작업 언어가 바뀌어도 이 concept을 먼저 읽고 공통 이름 규칙과 해당 언어의 예외를 함께 적용합니다. C/C++ 상세 규칙·Godot 엔진 지침을 다른 언어의 런타임/메모리 관리 정책으로 확대하지 않습니다.

## 근거와 사실·선택의 구분

- **선택:** 타입·함수·인터페이스의 `PascalCase`, 필드 `mPascalCase`, 지역·인자의 `camelCase`, 상태 `s`·`g`, 고정 상수·enum 값·비트 플래그의 `UPPER_SNAKE_CASE`는 이 번들의 언어 공통 선택입니다. Go 비공개 상수의 `_` 접두사, 언어별 데이터 필드·패키지·파일명·포매팅 예외는 본문에서 하나씩 정했습니다. C++ 세부 규칙까지 언어 중립 표준으로 주장하지 않습니다.
- **사실과 설계 근거:** [C++ Core Guidelines C.2](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rc-struct)는 불변조건을 가진 class와 독립 데이터의 struct를 구분합니다. [C.20](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rc-zero)은 기본 연산을 직접 정의하지 않아도 되는 설계, [F.16](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rf-in)은 입력 전달 비용·const 참조, [R.1](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rr-raii)은 RAII를 다룹니다.
- **소유권 근거:** [R.3](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rr-ptr)의 raw pointer 비소유는 설계 규칙이며 C·legacy ABI 예외가 있음을 함께 확인했습니다. [R.20·R.21](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rr-owner)은 소유 스마트 포인터와 공유 소유가 없을 때 unique ownership 우선을 설명합니다. [ES.11](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Res-auto)은 `auto` 및 복사/참조 차이, [ES.49](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Res-casts-named)는 의도가 드러나는 cast를 다룹니다. 이 문서가 그 출처의 모든 네이밍·표준 선택을 채택한다는 뜻은 아닙니다.
- **Godot 사실:** 공개 Godot 가이드가 고정한 godot-cpp `10.0.0-stable`의 [`memory.hpp`](https://github.com/godotengine/godot-cpp/blob/507ed9d840c01a3c5b2a39af8bb4000bfac30bf5/include/godot_cpp/core/memory.hpp)에서 `#define memnew(...)`를 확인했습니다. 다른 바인딩 버전은 해당 핀의 소스로 다시 확인합니다. 릴리스별 선택·소유권 설명은 공개 Godot 가이드에서 관리합니다.
- **확인일:** C/C++·Godot 근거는 2026-09-26, 다국어 의미·적용 범위는 2026-09-27에 확인했습니다. Core Guidelines 원문의 문서 날짜는 C++ 표준 릴리스일이 아닙니다. Godot 릴리스·빌드 사실의 정본은 [Godot와 C++ 게임 개발](/game/godot-cpp.md)입니다.
- **언어별 의미 근거:** [Go exported identifiers](https://go.dev/ref/spec#Exported_identifiers)와 [gofmt·세미콜론 삽입](https://go.dev/doc/effective_go#formatting), [Python 예약 식별자](https://docs.python.org/3/reference/lexical_analysis.html#reserved-classes-of-identifiers), [C# 프로퍼티](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/properties), [JS private elements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_elements), [JS 줄바꿈·ASI](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#automatic_semicolon_insertion)를 확인했습니다. 소스의 네이밍 예제는 언어 의미의 근거이며 이 문서의 스타일 규칙 전체를 대체하지 않습니다.

## 관리 범위

- 전체 가이드를 저장소에 포함하도록 승인받아 공개 관리합니다. 이 파일이 네이밍·언어별 예외·C/C++ 상세 규칙의 정본이며, 같은 내용을 로컬 전용 가이드나 별도 폴백 표로 복제하지 않습니다.
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
| 포인터·참조 표기 | 타입에 붙임, 변수당 선언 하나 | `const Player* player`, `Player& player` |
| 빈 줄 | 논리 단락·정의 사이 한 줄 | 연속 장식용 빈 줄 없음 |
| 조건문·반복문 | 항상 블록, 명확한 조기 반환 | `if (player == nullptr)` |
| switch | case는 switch 블록 깊이, 명시적 종료 | `case ConnectionState::CONNECTED:` |
| namespace 배치 | C++17 중첩 정의 기본, 내용 추가 들여쓰기 없음 | `namespace Northstar::Net` |
| 클래스 접근 순서 | public → 필요한 protected → private | public API 다음 private 상태 |
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
| Godot 할당 매크로 | 네임스페이스 함수로 오해하지 않음 | `memnew(MyNode)`, `godot::memnew` 금지 |
| 기존 코드 수정 | 주변 관례 우선, 무관한 포맷·rename 금지 | 요청 범위의 코드만 변경 |

---
type: Rule
title: 언어 공통 코딩 스타일
description: 모든 언어의 코드 작성·리뷰 전에 읽는 정본입니다. 적용 우선순위, 네이밍 기본값과 언어별 예외, 배치·줄 접기·빈 줄·제어 흐름 선택을 정하고, C/C++ 추가 선택은 C/C++ 전용 규칙에 둡니다.
tags: [rule, cross-language, c, cpp, csharp, go, python, javascript, typescript, coding-style, naming, readability]
apply_on_edit: ["*.c", "*.cc", "*.cpp", "*.cxx", "*.h", "*.hh", "*.hpp", "*.hxx", "*.inl", "*.ipp", "*.cs", "*.go", "*.py", "*.js", "*.mjs", "*.cjs", "*.jsx", "*.ts", "*.mts", "*.cts", "*.tsx", "*.lua", "*.gd", "*.java", "*.kt", "*.swift", "*.rs"]
timestamp: 2026-10-21T00:00:00Z
---

# 언어 공통 코딩 스타일

이 문서는 **언어 공통 기본 규칙의 정본**입니다. Microsoft 계열 표기를 참고하되 그 규격 전체·Hungarian notation·무조건적인 매크로 사용까지 가져오지 않습니다. 이름·배치는 **선택**, 언어 제약·수명·ABI는 **사실**이며 충돌하면 사실이 우선합니다. C/C++·C#·Go·Python·JS·TS 등 **모든 언어**에 적용하며(목록은 예시) 위반은 이 기본값의 적용 범위 안에서만 판정합니다. C/C++ 추가 선택은 [C/C++ 전용 코딩 규칙](/language-style-c-cpp.md)에 둡니다. 같은 내용을 로컬 가이드·폴백 표로 복제하지 않으며, 변경 이력은 [번들 변경 이력](/log.md)에 둡니다.

## 프로젝트 적용 규칙

### 1. 우선순위와 언어 수준

위에서부터 처음 적용되는 단계를 따릅니다.

1. **외부·언어 계약:** 컴파일러·플랫폼·ABI·엔진 override·표준 라이브러리·OS/외부 API와 언어의 문법·공개성·자동 탐색 규칙이 요구하는 이름을 지킵니다. 예약 식별자·생성 코드도 바꾸지 않으며, 이름만 맞추려고 공개 범위·직렬화 키·프로토콜 동작을 바꾸지 않습니다.
2. **명시 요구·프로젝트 도구:** 작업의 명시 요구와 `AGENTS.md`·스타일 문서·빌드 설정·포매터·린터를 따릅니다. 기본 활성 명명 진단과 충돌하는 이름은 도구가 요구하는 표기를 따르고 예외를 설명하되 경고를 억제하지 않으며, 새 린터로 이 규칙을 바꾸지도 않습니다. 명시 요구가 기존 규칙의 변경을 뜻할 때만 해당 범위를 바꿉니다.
3. **일관된 기존 코드:** 같은 영역 기존 코드 3–5개의 네이밍·중괄호·들여쓰기 패턴을 따릅니다. 가독성 최소 기준은 주변의 압축·혼합 관례에 맞춰 생략하지 않습니다.
4. **범위별 learned 지침:** 위가 모두 없는 새 코드는 OKF `learned/`의 해당 언어·프로젝트 지침을 그 범위 안에서 따릅니다.
5. **기본값:** 이 문서. Python snake_case·JS camelCase 같은 생태계 관례만으로 함수·메서드 `PascalCase`를 바꾸지 않되, 공개 범위·자동 탐색·프로토콜 동작이 걸리면 2.1이 우선합니다.

기존 코드에서는 수정 목적과 무관한 rename·재포맷·정렬·include 재배열·언어 표준 상향을 하지 않고, 스타일 이전 요청이 없으면 기존 필드·파일·공개 API를 재명명하지 않습니다. 새로 작성·수정하는 논리 단위(문장·블록·선언 그룹)에는 3장 가독성 기준을 적용하며, 포매터·언어 문법·외부 계약과 충돌하면 그쪽을 따르고 설명합니다. 프로젝트의 언어 버전·빌드 설정은 스타일 때문에 바꾸지 않으며 C/C++ 전용 규칙(표준·소유권·헤더·RTTI·Godot 수명)은 다른 언어에 옮기지 않습니다.

### 2. 네이밍 기본값

| 대상 | 표기 | 비고 |
|---|---|---|
| 타입(클래스·구조체·열거형·인터페이스·별칭)·함수·메서드·접근자·프로퍼티·event | `PascalCase` | `PlayerController`, `LoadLevel`, `Value`. 인터페이스에 `I`를 자동으로 붙이지 않음(기존 `ISessionStore`·외부 계약은 보존). 소유 Python·JS·TS 함수도 같음(`const GetUser = ...`). 일반 함수·런타임 변수에 `snake_case`를 새로 도입하지 않음 |
| 지역 변수·인자·콜백 변수 | `camelCase` | `playerId`, `onComplete`. 런타임에 받은 읽기 전용 값도 같음 |
| 캡슐화 인스턴스 필드 | `mPascalCase` | `mPlayerId`. 새 클래스는 기본 비공개, `member_name_`·`_memberName`은 쓰지 않음. 비정적 const·readonly 필드도 같고, 프로퍼티·event·메서드에는 `m`을 붙이지 않음 |
| 단순 데이터 필드 | C/C++ 단순 struct·Python dataclass·JS/TS 데이터는 `camelCase`, C# property·record·Go exported는 `PascalCase` | `teamId`/`TeamId`. JSON·DB·네트워크 키는 별도 계약이라 바꾸지 않음 |
| static·함수 static·모듈/파일 내부 상태 | `sPascalCase` | `sCache`. 익명 namespace 내용 포함. C++ namespace 범위 const(내부 연결)도 `sConfiguration`, Go 비공개 패키지 상태는 `sApplication` |
| 외부 노출 전역 상태 | `gPascalCase` | `gApplication`(Go exported는 `Application`). C++ `extern const`(외부 연결) 런타임 객체도 `gConfiguration`. 불필요한 공유 상태는 인수·객체 소유로 대체 |
| 고정 상수·`constexpr` 변수·enum 값·비트 플래그·마스크·상수형 비타입 템플릿 매개변수 | `UPPER_SNAKE_CASE`(`m`·`s`·`g` 없음) | `MAX_PLAYERS`, `CAPACITY`. `const`·`readonly`만으로 고정 상수로 보지 않음(런타임 const 지역은 `camelCase`, 런타임 읽기 전용 공유 객체는 상태 이름). 객체와 무관한 새 고정값은 static 상수. `constexpr` 함수는 `Square`처럼 함수 규칙 |
| enum | 타입 `PascalCase`, 값 `UPPER_SNAKE_CASE` | scoped(`enum class`·C#·Python Enum·TS)는 접두사 생략 `ConnectionState::CONNECTED`, unscoped(C·Go)는 필요한 프로젝트·타입 접두사 `NS_CONNECTION_STATE_CONNECTED`. enum 문법이 없는 언어는 명명된 `const`. 기존 ABI·wire 값·엔진 상수는 보존 |
| 약어 | 이름은 `HttpClient`·`GetId`·`XmlReader`, 상수는 `HTTP_TIMEOUT_SECONDS`·`PLAYER_ID_BITS` | 인덱스 `i`·`j` 허용. 타입을 복제하는 `pFoo`·`pszName`·`dwCount` 접두사 금지 |
| 매크로 | 프로젝트 접두사 + `UPPER_SNAKE_CASE` | `NS_ENABLE_TRACING`, include guard `NS_NET_PACKET_H`(경로 반영). 외부 매크로(`ERROR`, `PI`)와 충돌하면 도메인 접두사로 소유 이름을 바꾸고(`CONNECTION_ERROR`) 전역 `#undef`하지 않음 |
| 템플릿·제네릭 매개변수 | `T`, 여러 역할은 `TValue`·`TKey`, 템플릿 템플릿은 `TContainer` | |
| 타입 별칭 | `PascalCase` | `using PlayerId = std::uint32_t;`. 새 C 별칭에 `_t`를 붙이지 않음 |
| namespace·package | C++·C# namespace `PascalCase`, Go·Python package 짧은 소문자 | `Northstar::Net`, `combat` |
| 파일명 | C/C++·C#·JS·TS는 대표 타입/모듈 `PascalCase`, Go·Python은 소문자(복합명 `snake_case`) | `Counter.cs`, `counter.go`, `player_state.py`. `*_test.go`·`test_*.py`·`__init__.py` 등 자동 탐색·플랫폼·프레임워크 고정 이름은 보존. 기존 파일은 스타일만으로 재명명하지 않음 |

#### 2.1 언어별 의미·문법 예외

한 언어의 관례를 통째로 따르는 예외가 아니라, 공통 네이밍으로 깨뜨리면 안 되는 의미·계약과 명시적으로 고른 언어별 기본값입니다.

- **C#:** 명시적 backing field는 `mValue`이며 auto-property에는 backing field를 강제로 만들지 않습니다.
- **Go:** exported는 `PascalCase`, 비공개 타입·함수·메서드는 `camelCase`, 비공개 package 상수는 `_MAX_PLAYERS`, 캡슐화 필드는 `mValue`입니다. 대문자는 package 공개라는 언어 의미이므로 이름만 맞추려고 export를 바꾸지 않습니다. gofmt·`_test.go` 계약을 유지합니다.
- **Python:** 소유 함수·메서드는 `PascalCase`, 저장 속성은 `self.mValue`, 필요한 비공개 모듈 상수는 `_MAX_PLAYERS`입니다. dunder·외부 override·`test_*` 자동 탐색·기존 `__all__`/import 계약을 보존하고, `_`·`__`를 스타일 때문에 붙이거나 떼지 않습니다.
- **JavaScript:** 함수·메서드·접근자는 `PascalCase`, 런타임 비공개 필드는 `#mValue`, 비공개 메서드는 `#IncrementCore`, 비공개 static은 `#sCache`입니다. `constructor`·`Symbol.iterator`·DOM·Promise 등 외부 이름, framework lifecycle, React hook(`useState`)과 소문자 DOM 태그는 보존하고 콜백 인자·일반 데이터 키는 `camelCase`입니다.
- **TypeScript:** JS 규칙에 더해 interface·type·generic은 `PascalCase`, 런타임 비공개 기본은 `#mValue`입니다. `private mValue`는 기존 프로젝트·대상 설정이 요구할 때만 유지하며 `private`와 `#`의 런타임 의미 차이를 보존합니다.
- 기존 API·직렬화 키·reflection 이름·등록 문자열·파일 탐색 패턴의 변경은 네이밍 정리가 아니라 계약 변경입니다. `PascalCase`를 맞추려는 forwarding wrapper·호환 alias는 만들지 않습니다. `_` + `UPPER_SNAKE_CASE` 예외는 C/C++에 적용하지 않습니다(`_` + 대문자는 구현 예약).
- C# 14(.NET 10, 2025-11-11 출시) 이상은 `field` 키워드로 접근자 프로퍼티의 별도 backing field 선언을 생략할 수 있습니다. `LangVersion`이 지원하면 불필요한 명시 `mValue`를 새로 만들지 않고 기존 명시 필드는 스타일만으로 바꾸지 않으며, 같은 타입에 기존 `field` 멤버가 있으면 `@field`·`this.field`로 구분합니다([C# 14](https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-14), 확인 2026-10-15).
- TS의 `erasableSyntaxOnly`나 Node.js 타입 스트리핑 직접 실행(v24.12·v25.2부터 stable 표시, v26에서 `--experimental-transform-types` 제거)에서는 `enum`을 쓸 수 없으므로 명명된 `const` 값을 씁니다. 기존 `enum`은 스타일만으로 바꾸지 않습니다([`erasableSyntaxOnly`](https://www.typescriptlang.org/tsconfig/erasableSyntaxOnly.html), [Node.js TypeScript](https://nodejs.org/api/typescript.html), 확인 2026-10-15).

### 3. 배치·선언·제어 흐름

프로젝트 포매터와 위 언어별 문법 예외가 아래보다 우선합니다. 해당 구문이 없는 언어에 `switch`·포인터·namespace 규칙을 강제하지 않습니다.

**블록·공백**
- C/C++·C#·JS/TS는 Allman·공백 4칸, Go는 gofmt, Python은 콜론·공백 4칸입니다. 함수·클래스·구조체·열거형·네임스페이스·조건문·반복문의 여는 중괄호는 다음 줄이고, `else`·`catch`도 닫는 중괄호 다음 줄입니다. `do`의 종료 조건은 `} while (condition);`처럼 닫는 중괄호와 같은 줄입니다. 초기화 목록·객체 리터럴의 `{}`는 블록이 아니므로 `Point point{1, 2};`, `return { value: 1 };`처럼 같은 줄에 둡니다.
- 제어 키워드 뒤에는 공백(`if (condition)`), 호출명 뒤에는 공백 없음(`LoadLevel(levelId)`), 이항 연산자 양옆과 쉼표 뒤에는 공백을 둡니다. 탭·연속 공백으로 열을 정렬하지 않습니다.

**불필요한 접기·압축 금지**
- 강제 줄 길이 상한은 두지 않습니다. 선언·시그니처·인자 목록·호출·체인·객체 초기화자는 폭만으로 접지 않고 한 줄에 둡니다. 복합 조건·긴 체인이 읽기 어려울 때만 의미 있는 중간 값이나 기존 함수를 쓰며, 긴 줄을 쪼개기 위한 추상화는 만들지 않습니다. 프로젝트 포매터·린터가 줄 길이를 강제하면 그쪽을 따릅니다.
- 실행 문장은 한 줄에 하나만 씁니다(`for` 헤더의 초기화·조건·증감은 예외). 짧은 `if`·반복문·함수도 블록으로 쓰며, 언어가 지원하는 단일 식 본문(람다·표현식 본문 멤버)은 허용합니다. 폭에 관한 규칙이지 문장·블록 압축 지시도, 세로 여백을 없애라는 뜻도 아닙니다.
- 임의의 함수 줄 수·중첩 깊이 상한, 문장마다 만드는 전달 함수, 큰 본문을 숨기려는 지역 람다·매크로를 만들지 않습니다. 호출을 읽기 좋게 하려고 공개 시그니처·인수 순서를 바꾸거나 래퍼 타입·전달 함수를 만들지 않습니다.

**빈 줄**
- 같은 깊이의 독립된 제어문(`if`·`for`·범위 기반 `for`·`while`·`do`·`switch`·`try`) 사이에는 반드시 빈 줄 하나를 둡니다. 제어문이 끝난 뒤 같은 스코프의 다음 문장·선언이 이어질 때도 띄우고, 짧은 조기 반환 검사 여러 개도 붙여 쓰지 않습니다.
- 한 제어문을 이루는 연결부(`if`–`else if`–`else`, `try`–`catch`–`finally`, `do`–`while`, `elif`·`except`·반복문 `else`) 사이에는 빈 줄을 넣지 않습니다. 안쪽 블록 종료 뒤 바깥쪽 닫는 중괄호가 이어질 때도 넣지 않습니다.
- 입력 검증·값 준비·처리·결과 반영처럼 역할이 바뀌는 논리 단락, 함수 정의, 접근 섹션 사이에는 빈 줄 하나를 둡니다. 같은 단락의 밀접한 선언·대입·호출마다 넣지 않으며, 여는 중괄호 직후·닫는 중괄호 직전의 장식 빈 줄과 연속 빈 줄은 두지 않습니다.

**조건·선언**
- `if`·`else`·반복문은 한 문장이어도 중괄호를 씁니다. 기존 변수의 대입을 조건식에 숨기지 않습니다(C++ 조건 선언과 지원 표준의 `if (init; condition)`은 허용하되 블록 밖으로 옮겨 잠금·소유 객체의 수명을 늘리지 않음). 포인터는 `pointer != nullptr`(C는 `!= NULL`)처럼 명시적으로 비교하고 불리언은 `if (isReady)`처럼 직접 검사합니다.
- `&&`·`||`를 섞을 때는 의도한 묶음에 괄호를 씁니다. 중첩 `?:`와 복잡한 부정식은 술어·명시적 분기로 풀고, 짧은 한 단계 값 선택에는 `?:`를 씁니다. 다른 실패 이유를 빈 줄 회피용 긴 조건 하나로 합치지 않으며, 같은 처리를 하는 간단한 검사까지 무조건 분리하지도 않습니다.
- 클래스 선언의 순서와 구현 파일의 메서드 정의 순서를 가능한 한 맞춥니다.

**namespace·멤버**
- namespace 블록마다 내용에 공백 4칸을 추가합니다(이름 있는·익명 모두, 중첩은 깊이마다 누적). 여는·닫는 중괄호는 선언과 같은 깊이의 Allman입니다. 중첩 namespace는 C++17 `namespace Northstar::Net` 단일 정의가 기본이며 한 블록이므로 한 단계만 들여쓰고, 표준이 C++17 미만일 때만 이름 있는 블록을 중첩합니다. C# 블록형 namespace도 같고 파일 범위 namespace는 추가 들여쓰기가 없습니다.
- 멤버는 타입이나 추가한 순서가 아니라 역할·불변조건별로 인접하게 묶고 그룹 사이에 빈 줄 하나를 둡니다. 같은 그룹 안에서는 한 줄에 변수 하나를 씁니다. 같은 접근 섹션의 고정 상수·정적 공유 상태·인스턴스 상태는 구분하며, 새 멤버는 관련 그룹에 넣고 무조건 끝에 덧붙이지 않습니다. 모든 클래스에 같은 그룹이나 순서를 기계적으로 강제하지 않고, 역할이 이름만으로 불분명한 그룹에만 짧은 주석을 붙이며, 장식용 구분선·빈 그룹·가독성만을 위한 래퍼 타입을 만들지 않습니다.

분기 변환·식 분리·멤버 재배치는 평가 순서·수명·비용·초기화·직렬화·레이아웃 계약을 보존해야 하며, 소비자나 데이터 형식의 변경이 필요하면 스타일 정리로 처리하지 않습니다([계약 보존](/coding-style.md#근본-원리-사건별-실수를-일반화)).

네이밍과 배치 선택을 한 번에 보인 예입니다.

```csharp
public sealed class Counter
{
    public const int MAX_VALUE = 100;

    private static int sInstanceCount;

    private int mValue;

    public Counter(int initialValue)
    {
        mValue = initialValue;
        sInstanceCount++;
    }

    public int Value => mValue;

    public void Increment(int amount)
    {
        if (amount <= 0)
        {
            return;
        }

        if (mValue + amount > MAX_VALUE)
        {
            mValue = MAX_VALUE;
        }
        else
        {
            mValue += amount;
        }
    }
}

// Bad: MaxValue(고정 상수), _value(필드), get_user·getUser(소유 함수),
// 빈 줄 없이 붙여 쓴 독립 if 두 개, 폭만으로 접은 시그니처·인자 목록
```

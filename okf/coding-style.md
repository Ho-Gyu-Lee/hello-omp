---
type: Rule
title: 코딩 스타일
description: 간결성(YAGNI)·검토 비용·결정 사다리와 표준 기능의 의미 계약·네이밍 우선순위 요약과 언어 공통 스타일 정본 연결·공개 API·아키텍처·서버 상태와 외부 응답 계약.
tags: [rule, coding-style, cross-language, naming, architecture, api-design, server, response-contract]
timestamp: 2026-10-12T00:00:00Z
---

# 코딩 스타일

## 간결성 (Over-Engineering 금지)
- 요청하지 않은 파일/추상화/기능 추가 금지. 가장 직접적인 해결, 요청 범위만 수정.
- 간결성은 줄 수 목표가 아니라 사람이 이해·검증해야 할 판단과 유지할 개념을 줄이는 기준이다. 추가한 파일·분기·추상화가 어느 요구나 불변조건에 필요한지 설명할 수 있어야 한다. 짧아졌어도 숨은 동작·공유 상태·계약 누락이 늘면 단순화가 아니다.
- YAGNI는 기능 범위에만 적용된다. 버그 수정 깊이에는 적용하지 않는다 — 증상 하나가 아니라 결함 클래스 전체를 고친다. 상세는 [버그 수정 원칙](/bugfix.md).
- 새 작업용 스크립트의 실행 언어·예외 기준은 [omp 기본 도구](/tools/builtin.md), 작업 파일 위치는 [워크플로](/workflow.md)를 따른다.

## 결정 사다리 (코드 생성 전, 위에서부터 첫 적용 단계에서 멈춤)
1. 존재할 필요가 있는가? 없으면 안 만든다(YAGNI).
2. 기존 코드에 같은 계약을 만족하는 구현이 있는가? 재사용한다.
3. 표준 라이브러리로 되는가? 그것을 쓴다.
4. 네이티브 플랫폼 기능이 있는가? 그것을 쓴다.
5. 이미 설치된 의존성으로 되는가? 그것을 쓴다.
6. 간단한 식·기존 호출로 끝나는가? 불필요한 분기·추상화를 추가하지 않는다. 여러 문장이나 블록을 한 줄로 압축하라는 뜻은 아니다.
7. 그제서야 동작하는 최소한만 쓴다.
- 신뢰 경계 검증, 데이터 손실 처리, 보안, 접근성은 절대 줄이지 않는다.
- 표준 라이브러리·컴파일러 생성 기능도 요구와 의미가 맞을 때 재사용한다. 중복 키 처리, 순서, 얕은/깊은 복사, 동등성 대상, 가변 객체 공유와 할당 비용을 확인한다. 예를 들어 Kotlin의 [`associateBy`](https://kotlinlang.org/api/core/kotlin-stdlib/kotlin.collections/associate-by.html)는 같은 키의 마지막 원소를 남기며, [`data class`](https://kotlinlang.org/docs/data-classes.html)의 기본 생성 동등성은 주 생성자 속성 기준이고 `copy()`는 참조를 공유하는 얕은 복사다. 자동 생성은 구현량을 줄이지 요구의 의미 판단을 없애지 않는다. 이 원칙을 이유로 기존 프로젝트의 언어·런타임을 교체하지 않는다.
- JS/TS 표현을 단순화해도 필드 생략과 `undefined` 대입은 바꾸지 않는다. [`exactOptionalPropertyTypes` 문서](https://www.typescriptlang.org/tsconfig/exactOptionalPropertyTypes.html)처럼 `key in object` 등의 관찰 결과가 다르므로 조건부 spread를 정리할 때도 원래 존재 조건을 보존한다. 이를 특정 표현식의 전면 금지로 일반화하지 않는다.
- 이미 아는 타입을 `any`·`unknown`·모호한 `object`로 넓힌 뒤 단언으로 되돌려 검사만 통과시키지 않는다. [TypeScript 타입 단언](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions)은 런타임 검증을 추가하지 않는다. 외부 입력 경계의 `unknown`과 필요한 `typeof`·type guard는 유지하고, 검증한 도메인 값을 내부 계약으로 전달한다. 필수 단언은 실제 불변조건을 근거로 하며 주석만으로 안전성을 증명하지 않는다.

## 네이밍 우선순위
상세 판정 기준은 [언어 공통 코딩 스타일의 우선순위와 언어 수준](/language-style.md#1-우선순위와-언어-수준)이 정본이며 순서만 요약한다.

1. 언어의 문법·공개성·자동 탐색 규칙과 외부 ABI·엔진 override·표준 라이브러리·OS API·generated code가 요구하는 이름을 보존한다.
2. 프로젝트의 명시적 지침·포매터/린터를 따르고, 명시가 없으면 같은 영역의 기존 패턴(동일 디렉토리 코드 3-5개)을 따른다.
3. **모든 언어의 코드 작성·수정·리뷰에서 [언어 공통 코딩 스타일](/language-style.md)을 읽는다.** C/C++·C#·Go·Python·JS·TS는 비한정 예시다. 명시 규칙과 일관된 기존 패턴이 모두 없는 새 코드에는 이 정본의 네이밍 기본값·언어별 예외를 적용한다.
4. [축적 지식](/learned/)의 추가 사용자·프로젝트별 지침이 있으면 적용 범위를 확인한다. 로컬 지침이 없는 머신에서도 공개 정본의 기본값은 유지한다.

서버 특화: `XxxPacket`, `XxxHandler`, `XxxManager`, `XxxSession`.

## 언어 공통 규칙과 전용 규칙의 경계
- 이름의 대소문자·들여쓰기·줄바꿈이 언어 의미를 바꾸는 경계(Go 공개성, Python 예약 식별자, JS 생성자·자동 세미콜론 삽입, gofmt 등)와 C++ 전용 규칙(표준·소유권·헤더·RTTI·Godot 수명)을 다른 언어에 적용하지 않는 기준은 [언어 공통 코딩 스타일의 언어별 의미·문법 예외](/language-style.md#21-언어별-의미문법-예외)가 정본이다.

## 줄바꿈 (한 줄 우선)
- 선언·시그니처·인자 목록·호출·체인·객체 초기화자를 폭만으로 접지 않는다는 한 줄 우선 원칙, 프로젝트 포매터/린터 예외, 문장·블록 압축 금지와 세로 여백(빈 줄·멤버 배치·네임스페이스 들여쓰기) 기준은 [언어 공통 코딩 스타일의 배치·선언·제어 흐름](/language-style.md#3-배치선언제어-흐름)이, C/C++의 접근 지정자 배치와 예시는 [C/C++ 전용 코딩 규칙](/language-style-c-cpp.md)이 정본이다.

## 공개 API와 확장성
- 소비자가 안정적으로 선택·조합해야 하는 정책과 계약만 공개한다. 내부 알고리즘 단계·임시 데이터 구조·구현 전용 튜닝은 기본적으로 숨긴다.
- 소비자별로 합법적으로 달라지고 의미·안전 범위·버전 호환 계약을 테스트할 수 있을 때만 설정을 공개한다.
- 구체적인 확장 요구 없이 `virtual`·`protected`·공개 setter·subclass hook을 선제적으로 추가하지 않는다. 설정이나 합성으로 충분한 문제에 상속 확장점을 만들지 않는다.
- 공개 확장점이 입력 검증·인가·데이터 일관성 불변조건을 우회하지 못하게 한다.

## 아키텍처 (설계/리팩토링 요청 시)
- 계층 분리(presentation/business/data), 단일 책임, 느슨한 결합(인터페이스 의존). 간단한 스크립트/프로토타입엔 적용 제외.

## 서버 특화
- 메모리·네트워크 운영 항목(힙 할당·풀링·버퍼 재사용·직렬화 비용·비동기 I/O)은 [게임 서버 체크리스트](/game/server-checklist.md)를 따르고, 언어별 수명 관리는 [언어 공통 코딩 스타일](/language-style.md)을, C/C++의 RAII·소유권은 [C/C++ 전용 코딩 규칙](/language-style-c-cpp.md)을 따른다.
- 동시성: 정확성·객체 수명·요구되는 진행 보장을 먼저 만족하는 단순한 동기화를 사용한다. 경합·처리량·꼬리 지연을 측정한 뒤 필요한 락 범위 축소·샤딩·lock-free를 선택하며 다중 필드·교차 shard 불변조건과 트랜잭션 경계를 보존한다. 데드락·기아·메모리 순서를 확인하고 lock-free에는 ABA·안전한 메모리 회수·알고리즘의 진행 조건도 검증한다. lock-free를 wait-free나 개별 요청의 유한 대기 보장으로 해석하지 않는다.
- 입력 상태: 외부 입력은 형식·범위·권한·상태 불변조건을 검증하고 정규화한 뒤에만 저장 상태와 통계를 갱신한다. 거부된 값으로 baseline·캐시·집계치를 오염시키지 않는다.
- **런타임 간 정수 정밀도:** 64비트 식별자·세대·sequence를 JSON으로 주고받을 때 소비자의 수 표현 범위를 계약에 포함한다. JavaScript `Number`의 안전 정수 상한은 [`Number.MAX_SAFE_INTEGER`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER), 즉 `2^53-1`이다. 그 범위를 넘는 값은 생산자부터 정규화된 10진 문자열 등 손실 없는 형식으로 내보내고 소비자가 문법·범위를 검증한 뒤 필요하면 `BigInt`로 해석한다. `JSON.parse`로 이미 반올림된 숫자를 `String()`·타입 단언으로 감싸도 원래 값은 복구되지 않는다. 복구·소유권 증명·조건부 갱신에는 안전 상한 밖의 서로 다른 값이 경계를 왕복해도 구별되는 회귀를 둔다.
- 부분 갱신: 존재하는 필드를 각각 검증한 뒤 필드 조합과 기존 상태 간 교차 불변조건을 검증한다. 다른 선택 필드의 부재가 현재 필드의 검증을 우회하게 하지 않는다.
- 결과 전파: 보정·정규화·재계산된 최종 accepted 값을 저장·캐시·이벤트·응답에 일관되게 사용하고 원본 요청값을 다시 전파하지 않는다.
- 존재 판정·upsert: 최종 일관성 보조 인덱스의 조회 결과로 행의 존재를 판정해 INSERT·증분하지 않는다. [DynamoDB GSI](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html)는 기본 테이블 쓰기를 비동기로 반영하고 최종 일관성 읽기만 지원한다. 그래서 방금 만든 행을 못 보고 중복 행이나 증분 누락이 생긴다. 존재 판정은 기본키 대상의 조건부 쓰기(존재·부재 조건)로 하고, 중복 키 충돌은 기존 행 갱신 재시도로 처리한다. 데이터를 옮길 때는 쓰기를 먼저 새 저장소로 전환하고, 기존 값은 한 번만 합산하는 순서로 누락·이중 반영을 막는다.
- 외부 응답 집계: 선택 필드의 부재·null과 실제 0을 구분한다. 계약 근거 없이 누락을 0으로 간주하지 않으며, 계약이 허용하는 대체 필드·우선순위·단위를 확인한 뒤 폴백한다. 집계값과 세부값이 함께 있으면 중복 합산하지 않고 실제 0을 거짓 값으로 취급해 다른 값으로 대체하지 않는다. 필드 부재·0·집계/세부 동시 존재에서 소비자가 관찰하는 집계 결과를 검증한다.
  - 공개 API 예: [DynamoDB ConsumedCapacity](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_ConsumedCapacity.html)의 `CapacityUnits`·`ReadCapacityUnits`·`WriteCapacityUnits`는 모두 선택 필드다. 방향별 필드가 실제 0이면 그대로 사용하고, 필드가 없을 때만 작업의 읽기/쓰기 방향이 명확한 경우 총계 `CapacityUnits`를 해당 방향으로 집계한다. 총계도 없으면 측정 불가이며, 전체 값과 테이블·인덱스 세부값을 중복 합산하지 않는다. 용량 반환을 요청했는지도 확인하고 이 용량 단위를 실제 전송 바이트로 해석하지 않는다.
  - 호출 이름만으로 소비 방향을 고정하지 않는다. [DynamoDB TransactWriteItems](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_TransactWriteItems.html#DDB-TransactWriteItems-request-ClientRequestToken)는 성공한 요청을 유효한 같은 `ClientRequestToken`으로 재호출하면 쓰기가 아니라 읽기 용량을 반환한다. 총계 폴백의 방향은 해당 호출의 계약으로 확인한다.
  - 실패 경로도 사용량 반환 계약을 확인한다. [DynamoDB 조건부 쓰기](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithItems.html#WorkingWithItems.ConditionalWrites.ReturnConsumedCapacity)는 조건 실패에도 쓰기 용량을 소비하지만 실패 응답에 소비 용량을 반환하지 않는다. 성공 응답에서 관측한 합만으로 실제 전체 사용량을 단정하지 않으며, 관측 불가를 0으로 처리하거나 근거 없는 추정치로 채우지 않는다.
  - 지표 차원이 전체를 포함하는지도 계약으로 확인한다. [DynamoDB CloudWatch 지표](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/metrics-dimensions.html)에서 `TableName` 차원만 지정한 `ConsumedReadCapacityUnits`·`ConsumedWriteCapacityUnits`·`ReadThrottleEvents`·`WriteThrottleEvents`는 테이블분만 반환하고 GSI분을 포함하지 않는다. 전체 사용량은 `TableName`+`GlobalSecondaryIndexName` 차원의 인덱스별 값을 더해 구하고, 테이블분·GSI분·합계를 구분해 보고한다. 응답 `ConsumedCapacity` 총계와 달리 여기서 주의할 것은 중복 합산이 아니라 누락이다.
  - 스로틀 지표는 원인별로 나뉜다. `ReadThrottleEvents`·`WriteThrottleEvents`는 프로비저닝 용량 초과 요청의 지표로 정의되고, `Read`·`Write` 접두사의 `ProvisionedThroughput`·`KeyRangeThroughput`·`MaxOnDemandThroughput`·`AccountLimit` `ThrottleEvents`가 [같은 문서](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/metrics-dimensions.html)에 별도 정의돼 있다. 지표마다 지원하는 차원이 다르므로 스로틀을 집계할 때 원인별 지표의 정의와 차원을 확인하고 한 지표의 0을 스로틀 없음으로 단정하지 않는다.
  - 지표 탐색 결과가 없다고 0으로 보지 않는다. [CloudWatch SEARCH 식](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/using-search-expressions.html)은 최근 2주 안에 데이터를 보고한 지표만 찾는다. 그보다 오래된 구간의 스로틀·오류·인덱스별 값은 차원을 명시한 지표로 조회하고, 탐색 결과가 비어 있으면 측정 불가와 실제 0을 구분한다.

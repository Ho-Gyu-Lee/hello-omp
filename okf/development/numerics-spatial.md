---
type: Concept
title: 수치 결정성과 충돌 판정 계약
description: 서버·클라이언트 비트 일치 계산의 libm·FMA·툴체인 조건과 golden test, Box2D 센서의 CCD 미지원, 동일성 비교 경로의 표현·decode 통일과 경계 위 값 생성 금지 원리를 다룹니다.
tags: [development, math, floating-point, determinism, collision, box2d]
timestamp: 2026-10-18T00:00:00Z
---

# 수치 결정성과 충돌 판정 계약

게임 좌표 보고의 권위 검증은 [시간·이동 검증](/game/network-time-movement.md)을 따릅니다.

## 부동소수 모드와 재현성

- 서버와 클라이언트(또는 여러 플랫폼)가 같은 실수 계산을 각자 수행하고 결과의 비트 일치를 요구하면(권위 경로 재계산·lockstep·rollback·리플레이) 공용 코드는 IEEE-754 사칙연산과 `sqrt`로만 계산하고, `hypot`·`sin`·`atan2` 같은 libm 함수는 직접 구현하거나 정수·표로 대체합니다. C/C++ 표준은 이 함수들의 정확도를 정하지 않아 같은 입력에서도 런타임마다 마지막 비트가 다를 수 있습니다.
- 곱셈-덧셈 합치기(FMA contraction)도 끕니다. Clang은 14부터 기본 `-ffp-contract=on`이라 ARM 등에서 FMA로 합치고, GCC는 `#pragma STDC FP_CONTRACT`를 구현하지 않으며 GNU 방언 기본이 `-ffp-contract=fast`라 `-ffp-contract=off`가 필요합니다. MSVC는 VS2022부터 `/fp:precise`에서 합치지 않고 `/fp:contract`·`/fp:fast`에서만 합칩니다.
- 검증은 툴체인마다 같은 입력의 결과 digest를 정본 툴체인 값과 비교하는 golden test를 각 플랫폼의 release 최적화 빌드로 실행합니다. 출처(확인 2026-10-15): [GCC](https://gcc.gnu.org/onlinedocs/gcc/Floating-point-implementation.html), [LLVM](https://discourse.llvm.org/t/fp-contraction-fma-on-by-default/64975), [MSVC](https://devblogs.microsoft.com/cppblog/the-fpcontract-flag-and-changes-to-fp-modes-in-vs2022).

## 충돌 판정

- Box2D의 센서는 CCD가 없어 빠른 통과를 놓칠 수 있으므로 CCD·substep·sweep은 대상 쌍과 센서의 실제 지원 범위를 확인해 고릅니다([Simulation — Sensors/Bullets](https://box2d.org/documentation/md_simulation.html), 확인 2026-10-15).

## 원리

- **동일성 비교 경로:** exact 비교가 필요한 값은 표현·decode 연산 계약(타입·나눗셈 정밀도)까지 통일하거나 정규형 정수 바이트를 비교하며 epsilon 확대나 검증 생략으로 숨기지 않습니다. 예: 같은 정수 mm 바이트를 한 경로는 float, 다른 경로는 double로 m 변환하면 exact 비교가 실패합니다.
- **경계 위 값을 만들지 않습니다:** 클라이언트가 `origin + 방향 × range`로 만든 점(대상 없는 지면 공격 등)을 권위의 엄격한 `distance > range` 경계에 정확히 두면 반올림으로 약 절반이 거부되므로 경계 안쪽으로 작은 여유를 둡니다.

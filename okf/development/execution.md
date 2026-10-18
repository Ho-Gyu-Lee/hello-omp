---
type: Concept
title: 병렬 작업과 스크립트 실행 경계
description: 멀티스레드·병렬 처리 방향의 링크와 내장 Lua 스크립트의 count hook·선점 한계를 다룹니다.
tags: [development, runtime, concurrency, scripting, lua]
timestamp: 2026-10-18T00:00:00Z
---

# 병렬 작업과 스크립트 실행 경계

멀티스레드·병렬 처리와 상태 소유 구조의 선택은 [개발 방향](/direction.md)을 따릅니다. 서버의 비동기 완료를 상태 소유자에게 적용하는 기준은 [서버 체크리스트](/development/server-checklist.md#프로토콜과-비동기-수명)에 둡니다.

## 타이머·이벤트·스크립트

- Lua 5.4의 count hook은 Lua 함수를 실행하는 동안에만 호출되므로 네이티브 host call의 긴 실행을 선점하지 못합니다. 그 호출은 별도로 제한·분할합니다. hook에서 yield하려면 count/line 이벤트여야 하고 결과는 0개여야 하며 재개 가능한 coroutine·C-call 경계 조건도 만족해야 합니다. hook 하나를 완전한 sandbox·시간 상한으로 보지 않습니다([Lua 5.4 §4.7](https://www.lua.org/manual/5.4/manual.html#4.7), [lua_yieldk](https://www.lua.org/manual/5.4/manual.html#lua_yieldk), 확인 2026-10-15).

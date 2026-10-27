---
type: Concept
title: 내장 Lua 스크립트의 실행 경계
description: 내장 Lua 스크립트의 count hook·선점 한계를 다룹니다.
tags: [development, runtime, concurrency, scripting, lua]
timestamp: 2026-10-27T00:00:00Z
---

# 내장 Lua 스크립트의 실행 경계

## 타이머·이벤트·스크립트

- Lua 5.4의 count hook은 Lua 함수를 실행하는 동안에만 호출되므로 네이티브 host call의 긴 실행을 선점하지 못합니다. 그 호출은 별도로 제한·분할합니다. hook에서 yield하려면 count/line 이벤트여야 하고 결과는 0개여야 하며 재개 가능한 coroutine·C-call 경계 조건도 만족해야 합니다. hook 하나를 완전한 sandbox·시간 상한으로 보지 않습니다([Lua 5.4 §4.7](https://www.lua.org/manual/5.4/manual.html#4.7), [lua_yieldk](https://www.lua.org/manual/5.4/manual.html#lua_yieldk), 확인 2026-10-15).

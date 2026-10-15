---
type: Checklist
title: 지역화·문자열·텍스트 입력
description: 문장 단위 번역·복수형·문맥, 표시 로캘과 프로토콜의 분리, 사용자 생성 텍스트 기계 번역의 원문 언어 지정, Unicode 길이·키 배치·IME·줄바꿈과 실제 지역화 검증 기준입니다.
tags: [development, localization, unicode, text, input, ime, ui]
timestamp: 2026-10-15T00:00:00Z
---

# 지역화·문자열·텍스트 입력

앱·웹·게임에 지원 언어를 추가할 때의 데이터·입력·검증 계약입니다. 모든 프로젝트에 모든 언어를 요구하지 않습니다. 폰트·레이아웃·클릭의 공통 검증은 [UI·입력](/development/ui-input.md), Godot를 사용하는 경우의 API·버전 관찰은 [Godot UI](/game/godot-ui.md)를 따릅니다. 본문의 게임 키 바인딩은 명령 입력의 사례이며 엔진 예시는 일반 웹 API 보장이 아닙니다.

- [ ] 번역 단위는 완성 문장과 재배치 가능한 이름 있는 자리표시자로 둡니다. 코드가 조각 문자열을 이어 붙여 어순을 고정하지 않습니다. `count == 1`만으로 모든 언어의 복수형을 처리하지 않고 번역 시스템의 복수형·문맥 기능을 사용합니다. 번역할 표시 문구와 번역하지 않을 ID·사용자 이름·프로토콜 토큰을 구분합니다([Godot 국제화](https://docs.godotengine.org/en/4.7/tutorials/i18n/internationalizing_games.html), [Unicode CLDR plurals](https://cldr.unicode.org/index/cldr-spec/plural-rules)).
- [ ] 채팅 같은 사용자 생성 텍스트를 기계 번역할 때 원문 언어를 세션·UI 언어로 지정하면 엔진의 자동 감지를 쓰지 않으므로, 실제 본문 언어가 다르면 번역되지 않거나 잘못 번역됩니다. 원문 언어를 생략하면 자동 감지하지만 짧은 문장은 감지에 실패할 수 있습니다. Google Cloud Translation Basic은 이때 HTTP 500을 반환하고 원문 언어를 명시하라고 안내합니다([번역 요청](https://cloud.google.com/translate/docs/basic/translating-text), [문제 해결](https://cloud.google.com/translate/troubleshooting)). 원문을 그대로 돌려준 경우와 번역·감지 실패를 구분할 신호를 둡니다.
- [ ] UI 언어, 숫자/날짜 표시 서식, 키보드 배열을 하나의 설정으로 가정하지 않습니다. 사용자 표시용 로캘 서식·정렬과 저장/wire/서명용 정규 표현을 분리합니다. 번역된 숫자·표시 이름을 다시 파싱해 게임 identity나 저장 키로 쓰지 않습니다([C++ to_chars](https://en.cppreference.com/w/cpp/utility/to_chars)는 로캘 비의존 표현의 한 사례입니다).
- [ ] 문자열 상한의 단위를 바이트·코드포인트·사용자 지각 문자(grapheme cluster) 중 실제 계약으로 정합니다. UTF-8 유효성·wire 바이트 상한과 UI 글자 수 제한은 서로 대체하지 않습니다. 편집·자르기·커서 이동에서 결합 문자·이모지 시퀀스를 바이트 중간에서 끊지 않습니다. 레거시 인코딩은 명시된 경계에서 해석하며, 후행 바이트를 ASCII 구분자처럼 검사하지 않습니다([RFC 3629](https://www.rfc-editor.org/rfc/rfc3629.html), [UAX #29](https://www.unicode.org/reports/tr29/)).
- [ ] 이동 키의 물리 위치, 현재 배열의 논리 키, 사용자가 입력한 텍스트는 다른 입력입니다. 게임 바인딩과 표시 키 이름은 선택한 의미를 따르고 글자는 raw keydown에서 직접 만들지 않습니다. 채팅/이름 입력에서는 IME 조합·확정·취소·후보창 위치와 게임 단축키 소비를 검사합니다. IME/가상 키보드 입력에 물리 key-release가 항상 있다고 가정하지 않습니다([Godot InputEventKey](https://docs.godotengine.org/en/4.7/classes/class_inputeventkey.html)).
- [ ] 가상 지역화로 하드코딩·번역 누락·확장되는 문구를 찾되 글자 수가 같아도 폭/줄 높이는 달라집니다. 짧은 라벨·긴 이름·큰 숫자·줄바꿈·자막과 실제 지원 언어의 CJK/RTL·폰트 fallback을 따로 검사합니다. 가상 지역화 통과는 실제 글리프·bidi·IME 검증의 증거가 아닙니다([W3C 번역 길이](https://www.w3.org/International/articles/article-text-size), [Godot 국제화 검증](https://docs.godotengine.org/en/4.7/tutorials/i18n/internationalizing_games.html)).
- [ ] 공백 분리만으로 줄바꿈하지 않습니다. 줄 경계와 grapheme 경계는 다른 규칙이며 실제 언어용 break 데이터가 export에 포함됐는지 확인합니다. 문자열 외에 이미지 속 글자·음성·영상 길이·자막 타이밍도 지역화 대상입니다. OS별 사용자 디렉터리를 표시 언어로 추정해 하드코딩하지 않습니다([UAX #14](https://www.unicode.org/reports/tr14/), [Windows Known Folders](https://learn.microsoft.com/en-us/windows/win32/shell/known-folders)).

## 근거와 적용 범위

*Game Programming Gems 3* 한국어판 「1.12 게임 지역화」(PDF p.158–174) 및 「1.13 3D 게임에서의 실시간 입력 및 UI」(p.179)의 문자열 외부화·완성 문장·키/IME·번역 검증 원리를 선별했습니다. 현행 문서와 대조한 날짜는 2026-10-15입니다. 당시 MBCS·`wstring`·고정 확장률을 일반 해법으로 옮기지 않았으며 바이트/문자 상한과 표시/프로토콜 분리는 현대 계약에서 도출한 검토 기준입니다.

사용자 생성 텍스트 기계 번역 항목은 Google Cloud Translation 공식 문서(2026-10-15 확인)와 채팅 번역 경로 검토 사례에서 일반화했습니다. 특정 번역 엔진·요금제·용어집 기능의 채택 근거가 아닙니다.

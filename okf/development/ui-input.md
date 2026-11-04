---
type: Concept
title: UI 입력·표시 검증과 지역화
description: 실제 창 입력 검사의 OS 포커스 충돌, 입력 소유·정리 범위와 최종 화면 검증 원리, 사용자 생성 텍스트 기계 번역의 원문 언어 지정(Google Cloud Translation Basic), Translation LLM의 v2 호출 조건과 용어집의 v3 전용 제약을 다룹니다.
tags: [development, ui, input, verification, localization, translation]
timestamp: 2026-11-04T00:00:00Z
---

# UI 입력·표시 검증과 지역화

Godot 구현·고정 버전 관찰은 [Godot UI](/game/godot-ui.md)를 따릅니다.

## 입력·표시 검증

- **OS 포커스:** 포커스를 잃으면 이동·경로를 취소하는 제품 계약이 있으면, 실제 창에서 도는 자동 검사는 다른 프로세스(병렬 작업자·빌드·새 콘솔 창)가 전경 창을 가져가는 순간 이동이 막혀 기한 초과로 실패합니다. 실제 창 실행 구간에는 창을 만드는 다른 실행을 직렬화하고, 실패마다 포커스 변화와 전경 창을 기록해 포커스 상실 실패와 다른 실패를 구분합니다.
- **입력 소유·정리 범위:** 입력의 소유와 정리는 같은 범위로 맞춥니다. 개별 터치 cancel은 해당 포인터만 정리하고 포커스 상실·앱 비활성화·장면 전환은 전역 정리로 다룹니다. 검증기가 주입한 입력(예: OS 입력의 DOWN)도 실패 경로에서 짝을 맞춰 해제합니다.
- **최종 화면 검증:** UI 요구(겹침·간격·경계)는 사용자가 실행하는 조건의 최종 합성에서 지원 해상도·안전 영역마다 확인합니다. 기대 좌표와 입력 좌표를 같은 transform으로 산출한 자기참조 결과, 강제한 창 크기·위치에서의 성공, Windows 터치 에뮬레이션·가상 inset 검사는 실제 기기 조건의 증거가 아닙니다. 참조 화면은 실제 플레이 캡처인지(광고 합성·키아트가 아닌지) 판정한 뒤 씁니다.

## 기계 번역의 원문 언어

- 채팅 같은 사용자 생성 텍스트를 기계 번역할 때 원문 언어를 세션·UI 언어로 지정하지 않습니다. 지정하면 자동 감지를 하지 않아 실제 본문 언어가 다를 때 번역되지 않거나 잘못 번역됩니다.
- Google Cloud Translation Basic(v2)은 원문 언어를 지정하면 자동 감지를 하지 않고, 생략한 요청에서 감지하지 못하면 HTTP 500을 반환하며 원문 언어를 명시하라고 안내합니다([v2 translate 참조](https://docs.cloud.google.com/translate/docs/reference/rest/v2/translate), [문제 해결](https://cloud.google.com/translate/troubleshooting), 확인 2026-10-15). 원문을 그대로 돌려준 정상 결과와 실패를 구분하는 원리는 [코딩 스타일의 근본 원리](/coding-style.md#근본-원리-사건별-실수를-일반화)를 따릅니다.

## 기계 번역 모델과 용어집

- Google Cloud Translation의 Translation LLM은 Basic(v2)에서도 `model`에 `projects/<프로젝트>/locations/<지역>/models/general/translation-llm` 전체 리소스 이름을 넣어 호출할 수 있지만, v2 호출은 API 키 인증만 됩니다. 용어집은 Advanced(v3)의 `translateText`에서만 쓰고, 문맥을 반영하는 용어집 적용(`contextual_translation_enabled`)은 Translation LLM만 지원합니다([TLLM](https://docs.cloud.google.com/translate/docs/translation-llm), [용어집](https://docs.cloud.google.com/translate/docs/advanced/glossary), 확인 2026-11-04). 게임 용어 고정이 요구에 있으면 v3 전환과 그 인증 방식을 함께 설계합니다.

---
type: Concept
title: 게임 정적 데이터의 분류·소비와 권위 경계
description: 콘텐츠 정의/설정과 플레이 상태의 구분, 논리 책임과 client/server 공개 대상, 공통 데이터 생명주기의 게임 적용 기준입니다.
tags: [game, static-data, content, authority, client, server, versioning]
timestamp: 2026-10-15T00:00:00Z
---

# 게임 정적 데이터의 분류·소비와 권위 경계

게임 콘텐츠의 의미·소비자·권위 경계를 다룹니다. 저작 입력·CDN/DB/메모리 버전 전환·조회/LINQ·초기 로딩의 공통 기술 정본은 [데이터 생명주기](/development/data-lifecycle.md), 파일/wire는 [데이터 형식](/development/data-formats.md), 관계형 저장은 [DB 설계](/database/design.md)입니다. 특정 도구·저장소 조합은 프로젝트 정책이며 게임 권위·내구 계약을 바꾸지 않습니다.

## 분류와 논리 모델

- 정적 데이터는 스테이지·퀘스트·성장·아이템·스킬·보상 등 저작자가 발행하는 정의/설정이고, 동적 데이터는 경험치·인벤토리·진행·월드 보스 상태처럼 플레이/운영으로 바뀌는 인스턴스 상태입니다. 정적은 영구 불변 상수가 아니며 저장소나 파일 확장자가 이 분류를 결정하지 않습니다. 예를 들어 [PlayFab Title Data](https://learn.microsoft.com/en-us/xbox/playfab/live-service-management/game-configuration/titledata/)도 갱신 가능한 설정과 클라이언트 비공개 Internal 데이터를 나누며, 캐시가 있는 설정 저장소를 동적 전역 변수처럼 쓰지 않도록 설명합니다. 이것이 PlayFab 채택 요구는 아닙니다.
- 배포 대상을 클라이언트 전용·서버 전용·공통으로 정하고 공개/비공개 필드가 섞이면 산출물에서 분리합니다. 서버 비밀은 클라 JSON뿐 아니라 설치물·공용 CDN 패키지·부속 데이터에도 넣지 않습니다. 공통 정의의 클라 사본은 열람/변조 가능하므로 결과·보상·재화는 서버의 자기 버전과 [권위 검증](/security/game.md)을 따릅니다. 양측의 전체 바이트가 반드시 같아야 하는 것은 아니며 공개 투영과 호환 관계를 정합니다.

## 게임 적용

- 공통 생명주기의 필수 집합은 최초 플레이·콘텐츠 진입과 판정에 필요한 정의 및 참조 의존성으로 정합니다. 서버/클라이언트 코드와 콘텐츠의 허용 조합, 세션·존·인스턴스별 버전 고정과 전환 경계를 명시합니다. 런타임 hot reload가 필요하지 않으면 점검·재시작 경계를 사용할 수 있습니다.
- 콘텐츠 rollback은 이미 새 규칙으로 생성한 캐릭터·재화·진행 상태와도 호환돼야 합니다. 기존 [공통 서비스 수명](/development/service-lifecycle.md#identity에-결속된-데이터-이동)의 콘텐츠 identity와 [게임 서버 영속화](/game/server-persistence.md)의 성공 공개·A/B/C 및 게임 권위는 그대로 유지합니다. 게시 실패의 부분 데이터를 정상 게임 상태로 노출하지 않습니다.

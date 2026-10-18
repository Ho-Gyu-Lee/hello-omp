---
type: Concept
title: 데이터 형식·콘텐츠 게시 계약
description: 외부 decoder의 길이 검증 한계, 부분 생성의 보호 기준 전환, CloudFront minimum TTL의 origin 캐시 지시어 우선 예외를 다룹니다.
tags: [development, serialization, content, cdn, cache, editor]
timestamp: 2026-10-18T00:00:00Z
---

# 데이터 형식·콘텐츠 게시 계약

콘텐츠 identity 결속 이동은 [서비스 수명](/development/service-lifecycle.md#identity에-결속된-데이터-이동), 관계형 저장과 전체 교체 경계는 [DB 설계](/database/design.md)를 따릅니다. 게임 클라이언트에 배포하는 정적 데이터는 열람·변조될 수 있으므로 서버 비밀을 넣지 않습니다([게임 보안](/security/game.md)).

## 외부 decoder와 길이 검증

- 외부 decoder·생성 런타임이 실패를 bool·오류 코드로 반환한다는 사실은 길이 필드를 안전하게 검사한다는 증거가 아닙니다. 부호 없는 길이를 범위 확인 없이 부호 있는 정수로 바꾼 뒤 `pos + len <= end`만 비교하면 음수 길이가 통과해 읽기 위치가 뒤로 가거나 그 값이 크기 인수로 쓰여 거대한 할당이 일어날 수 있고, 덧셈 overflow도 같은 비교를 무력화합니다. 채택 전에 음수로 해석되는 값·최대값·남은 크기 초과·잘린 입력이 거부되는지 확인하고, CDN·사용자 파일처럼 경로를 신뢰할 수 없는 데이터는 무결성 검증 뒤 decode합니다.

## 부분 생성의 보호와 게시

- 에디터 도구가 장면의 일부만 재생성할 때의 보호 hash는 파일/노드 identity와 의미 없는 자식 방문 순서·에디터 전용 metadata를 분리합니다. 저장된 기준선과 비교하는 hash 규칙이 바뀌면 버전을 올려 명시적으로 전환하고 기존 장면을 조용히 새 기준선으로 덮지 않습니다. 선택하지 않은 수동 편집·잠금, 전역 공유 리소스, 경계 연결을 검사한 뒤 변경할 부분만 적용하며 디스크 게시와 메모리 Undo를 구분합니다.

## CDN 캐시 계약

- CloudFront minimum TTL이 0보다 크면 origin의 `no-cache`/`no-store`/`private`보다 우선할 수 있고 viewer 요청 헤더만으로 origin 재조회를 강제하지 못합니다. origin·CDN cache behavior·클라이언트 앱 캐시를 함께 확인합니다([CloudFront expiration](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html), 확인 2026-10-15).

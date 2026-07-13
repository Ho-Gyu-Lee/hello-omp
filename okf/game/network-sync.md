---
type: Rule
title: 게임 네트워크 동기화
description: 권위 상태·시간과 순서·예측과 보정·복구·전달 의미론·검증 원칙.
tags: [game, client, server, networking, synchronization]
timestamp: 2026-07-13T00:00:00Z
---

# 게임 네트워크 동기화

## 상태 계층
- 권위 시뮬레이션 상태, 클라이언트 예측 상태, 보간 목표, 최종 표시 상태를 구분한다.
- 표시 상태는 시각적 연속성을 위한 결과이며 서버 검증·저장·delta baseline으로 역주입하지 않는다.
- 서버가 보정·정규화·재계산한 최종 accepted 상태를 저장·시뮬레이션·복제·송신자 보정·관전자 전파 전체에 사용한다.

## 시간·순서·생명주기
- 원격 timestamp와 로컬 시간을 직접 비교하지 않는다. 의미·단위·기준 시계를 명시하고 변환하며, 로컬 경과 시간은 단조 증가 시간원으로 측정한다.
- 아직 적용 시점이 오지 않은 샘플과 새 데이터가 끊겨 적용 가능 기간을 지난 샘플을 구분해 대기·외삽·재동기화 정책을 각각 적용한다.
- sequence의 중복·역순·손실·wraparound와 재접속 후 generation 변경을 처리한다. 큰 sequence 하나로 수신 window를 임의 전진시키지 못하게 한다.
- 재사용 가능한 entity ID에는 generation 또는 동등한 생명주기 식별자를 결합해 늦은 패킷이 새 객체에 적용되지 않게 한다.

## 예측·보간·보정
- 외삽은 시간·거리·회전량 또는 도메인별 오차 예산으로 제한하고 권위 샘플 없이 무기한 진행하지 않는다.
- 보정은 의도된 별도 기준점이 없다면 현재 표시 상태에서 시작해 오래된 목표로 점프한 뒤 다시 이동하는 이중 보정을 피한다.
- teleport·respawn·scene transfer·authority change 같은 불연속 전환마다 속도·각속도·보간 버퍼·오차 누적·timestamp·delta baseline을 preserve·reset·recompute 중 하나로 명시한다.
- 정지·sleep·dirty 판정은 위치뿐 아니라 회전·애니메이션·상태 플래그 등 관찰 가능한 변화를 포함한다.
- 각도·주기 값은 비교와 delta 계산 전에 시스템이 정한 canonical representation 또는 shortest-path 규칙을 일관되게 적용한다. 누적 회전량이 의미 있는 값은 별도로 표현한다.

## 복구·전달 의미론
- 증분 event·command·delta를 쓰는 시스템은 손실·중복·역순·장기 이탈 뒤 권위 상태로 수렴할 경로를 둔다. snapshot·replay log·state hash·재조회 중 요구에 맞는 방식을 선택한다.
- 이전 baseline에 의존하는 프로토콜은 양측이 공유하는 accepted baseline을 식별하고 불일치·만료 시 bounded recovery 또는 full-state resync를 제공한다.
- transport ACK와 애플리케이션 상태 수락을 구분한다. 검증되지 않은 ACK·baseline ID로 권위 상태나 수신 window를 갱신하지 않는다.
- 메시지마다 전달·순서·중복·만료·최신값 대체 가능성·복구 의미를 정의한다. transport의 reliable/unreliable 이름만으로 애플리케이션 계약을 대신하지 않는다.
- authority handoff는 이전·현재·예정 authority와 handoff generation·commit 시점·in-flight message 처리 정책을 명시한다. host/local fast path도 원격 경로와 같은 검증·권한·정규화 결과를 보장한다.
- 느린 연결의 송신 큐는 무한히 증가시키지 않는다. 메시지 의미에 따라 coalesce·drop·backpressure·disconnect 정책을 적용한다.

## 검증
- 동기화 알고리즘과 transport를 분리해 테스트하되 codec·검증·dispatch·보정 전체를 지나는 통합 테스트를 별도로 둔다.
- 고정 seed·통제된 timestep·직접 snapshot 주입·권위 trace로 결정적 회귀를 재현한다.
- 고정 조건만으로 충분하다고 가정하지 않는다. 가변 timestep·clock drift·burst loss·중복·역순·sequence wrap·재접속·handoff·장시간 누적을 검증한다.
- 절대 허용 기준과 이전 기준선 대비 회귀를 함께 추적한다. simulation 정확도·수렴 시간·표시 연속성을 서로 다른 지표로 측정한다.

관련 보안 원칙은 [게임 보안](/security/game.md), 구현 체크는 [클라이언트 체크리스트](/game/client-checklist.md)와 [서버 체크리스트](/game/server-checklist.md)를 따른다.

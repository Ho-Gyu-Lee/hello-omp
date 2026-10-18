---
type: Rule
title: 게임 네트워크 복구·전달 의미론
description: 게임 증분 복제·baseline의 Mirror 계약, 불연속 marker, 재접속·지역 전환·끊김 판정의 완료 증거와 세대 결속.
tags: [game, client, server, networking, synchronization, recovery, session]
timestamp: 2026-10-18T00:00:00Z
---

# 게임 네트워크 복구·전달 의미론

상위 개념: [게임 네트워크 동기화](/game/network-sync.md#공통-원리)

메시지별 전달·HOL·모바일 복구·프레이밍·종료는 [네트워크 전달·I/O·시간 계측](/development/network.md)을 따른다. 아래는 게임 권위·복제의 추가 조건이다.

## 복구·전달 의미론
- **op-log·baseline 복제(Mirror):** 목록·사전을 연산 로그로 복제하면 이미 반영된 연산이 신규 관찰자의 full state에도 들어가고 다음 delta에도 실려 두 번 적용된다. full state에 "반영됐지만 아직 보내지 않은 연산 수"(`changesAhead`)를 함께 보내 수신측이 건너뛰게 한다. index 기반 연산과 송신마다 baseline이 전진하는 연쇄 delta는 신뢰·순서 보장 stream에서만 성립하고, 모든 관찰자가 하나의 직렬화 baseline을 공유하면 신규 관찰자의 초기값도 현재 값이 아니라 그 baseline(마지막 직렬화 값)이어야 한다. 비신뢰 delta는 연결별 ACK baseline을 쓰거나 delta에 baseline tick을 붙여 불일치 delta를 버린다([`SyncList`](https://github.com/MirrorNetworking/Mirror/blob/c4f3739966e151f405be1762d33502794fd034ff/Assets/Mirror/Core/SyncList.cs)·`NetworkTransformReliable`·`NetworkClient`, [인용 기준](/game/network-sync.md#mirror-인용-기준), 조회 2026-10-11).
- 최신 상태가 self-contained여도 한 번만 실린 불연속 marker는 자동 복구되지 않는다. 상태 대체(snapshot 병합·결과 메시지)에서 필요한 marker를 승계하거나 재전달 계약을 두고, soft 보정의 증가하는 revision을 hard snap의 대용으로 쓰지 않는다.
- 재접속은 신규 접속과 같은 full-state 설치 경로를 쓰고 살아 있는 월드를 재설정하지 않는다. 재접속 요청에는 마지막으로 **보낸**이 아니라 **발급한** 명령 번호를 담고, 서버는 이전 연결을 먼저 fence해 대기열을 정리한 뒤 최고 수신 번호를 확정하며 연결 epoch가 다른 늦은 uplink를 폐기한다. 클라이언트는 "서버가 받지 못함"과 "결과 보존 기한을 넘겨 알 수 없음"을 구분하고 자동 재전송하지 않으며, 폐기된 입력을 실행한 것처럼 ACK하거나 미실행 명령에 성공·거부 결과를 붙이지 않는다. 재개 식별자는 [게임 보안](/security/game.md#세션통신-보안)을 따른다.
- 지역·인스턴스 전환에서 클라이언트가 새 지역을 설치하기 전에 도착한 개체 갱신은 lookup 실패로 버려져, 변경분 복제라면 다음 변경까지 복구되지 않는다. 전환 통지를 보내기 **전에** 서버가 그 연결을 not-ready로 바꿔 복제를 멈추고, 전환 세대를 담은 ready를 받은 뒤 새 위치 기준 관찰 집합을 full state로 설치하며, 개별 despawn 없이 관찰 관계를 비웠다면 클라이언트가 재설치 묶음에 없는 이전 개체를 제거한다.
- 서버는 클라이언트의 수락 응답 설치 여부를 직접 관측할 수 없으므로 관측 가능한 증거로 판정한다. 응답을 설치해야만 보낼 수 있는 uplink(발급된 현재 세션·epoch에 결속된 입력·probe·설치 확인)를 한 번도 받지 못한 신규 세션은 grace 없이 제거하고 재개 만료를 알려 신규 접속으로 복구시킨다(설치 전 handshake·probe는 불인정). 끊김 감지(liveness)와 재개 유예(grace)는 다른 값이다.

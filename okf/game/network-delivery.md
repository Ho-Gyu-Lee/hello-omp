---
type: Rule
title: 게임 네트워크 복구·전달 의미론
description: 게임 증분 복제·baseline, authority handoff·불연속 marker, 입력/결과 경계와 지역 전환·세션 재개의 게임 계약을 다룹니다. 공통 전송·송신 공정성·모바일 복구는 별도 정본에 연결합니다.
tags: [game, client, server, networking, synchronization, recovery, transport, mobile, session]
timestamp: 2026-10-15T00:00:00Z
---

# 게임 네트워크 복구·전달 의미론

상위 개념: [게임 네트워크 동기화](/game/network-sync.md)

메시지별 전달·묶음·소유권, TCP/I/O/RPC 경계·HOL·송신 공정성, 모바일 경로 전환과 앱 세션 복구는 [공통 전달 계약](/development/network-delivery.md)을 따릅니다. 공통 시간·RTT는 [네트워크 시간](/development/network-time.md), 프레이밍·실패 완료·종료는 [I/O](/development/network-io.md)를 참고합니다. 아래는 게임 권위·복제의 추가 조건입니다.

## 복구·전달 의미론
- 증분 event·command·delta를 쓰는 시스템은 손실·중복·역순·장기 이탈 뒤 권위 상태로 수렴할 경로를 둔다. snapshot·replay log·state hash·재조회 중 요구에 맞는 방식을 선택한다.
- 이전 baseline에 의존하는 프로토콜은 양측이 공유하는 accepted baseline을 식별하고 불일치·만료 시 bounded recovery 또는 full-state resync를 제공한다.
- **컨테이너·필드 delta와 신규 관찰자:** 목록·사전을 연산 로그(op-log)로 복제하면, 이번 송신 전에 이미 상태에 반영된 연산이 신규 관찰자의 full state에도 들어가고 다음 delta에도 실려 두 번 적용됩니다. full state에 "반영됐지만 아직 보내지 않은 연산 수"(또는 컨테이너 version)를 함께 보내 수신측이 그만큼 건너뛰게 합니다. 관찰자가 없을 때는 연산을 기록하지 않고 첫 관찰자는 full state로 시작합니다. index 삽입·삭제 같은 위치 기반 연산과, 송신할 때마다 baseline이 전진하는 연쇄 delta는 신뢰·순서 보장 stream에서만 성립합니다. 모든 관찰자가 하나의 직렬화 baseline을 공유하면 신규 관찰자의 초기값도 현재 값이 아니라 그 baseline(마지막 직렬화 값)이어야 합니다. 비신뢰 delta는 연결별 ACK baseline을 쓰거나, 공유 baseline을 신뢰 채널로 보내고 delta에 baseline tick을 붙여 불일치 delta를 버립니다. 근거: [Mirror `SyncList`](https://github.com/MirrorNetworking/Mirror/blob/c4f3739966e151f405be1762d33502794fd034ff/Assets/Mirror/Core/SyncList.cs)의 `changesAhead`, [`NetworkTransformReliable`](https://github.com/MirrorNetworking/Mirror/blob/c4f3739966e151f405be1762d33502794fd034ff/Assets/Mirror/Components/NetworkTransform/NetworkTransformReliable.cs)의 초기 상태 처리, [`NetworkClient`](https://github.com/MirrorNetworking/Mirror/blob/c4f3739966e151f405be1762d33502794fd034ff/Assets/Mirror/Core/NetworkClient.cs)의 unreliable baseline tick 대조(조회 2026-10-11).
- 검증되지 않은 ACK·baseline ID로 권위 상태나 수신 window를 갱신하지 않는다. transport ACK와 애플리케이션 상태 수락의 구분은 [입력 처리 ACK와 로컬 재실행](/game/network-prediction.md#입력-처리-ack와-로컬-재실행)을 따른다.
- authority handoff는 이전·현재·예정 authority와 handoff generation·commit 시점·in-flight message 처리 정책을 명시한다. host/local fast path도 원격 경로와 같은 검증·권한·정규화 결과를 보장한다.
- 최신 상태가 self-contained여도 한 번만 실린 불연속 marker까지 자동 복구되는 것은 아닙니다. 같은 연결 세대의 snapshot 병합·결과 메시지에 의한 상태 대체에서 반드시 필요한 marker를 최신 상태로 승계하거나 별도 재전달 계약을 둡니다. full-state/identity 교체·queue reset에서는 이전 marker를 비웁니다. soft 보정에도 증가하는 revision을 hard snap의 대용으로 쓰지 않으며 일회성 연출의 제한된 전달과 권위 상태 정합성을 구분합니다.
- terminal 장애에서 실제로 시뮬레이션한 입력 경계와 폐기한 입력 경계를 구분한다. 폐기된 입력을 실행한 것처럼 이동 ACK로 재실행하지 않으며, 이미 적용된 제어 동작을 제외한 미실행 게임 명령에 성공·실행 거부 결과를 붙이지 않는다. 확인되지 않은 결과는 미확정으로 남긴다. 재동기화 상태에서도 순서 보장 전송이 이미 소유한 정상 선행 응답의 결과 prefix는 검증·소비해야 terminal 응답을 해석할 수 있다. 이 결과 정리는 예측 재실행·플레이 재개와 분리한다.
- 살아 있는 월드에 붙는 신규 접속과 재접속은 같은 full-state 설치 경로를 쓰고 월드를 재설정하지 않는다. 재접속 요청에는 마지막으로 **보낸** 명령이 아니라 마지막으로 **발급한** 명령 번호를 담아 아직 프레이밍하지 않은 명령까지 판정 범위에 넣는다. 서버는 이전 연결을 먼저 차단(fence)하고 그 대기열을 정리한 뒤 최고 수신 번호를 확정하며, 모든 uplink 메시지에 연결 epoch를 실어 다른 epoch의 늦은 메시지를 폐기한다. 클라이언트는 "서버가 받지 못함"과 "결과 보존 기한을 넘겨 알 수 없음"을 로컬 상태로 구분하고 자동 재전송하지 않는다. 재개 식별자의 생성·비교·로그 비노출·인스턴스 변경 시 만료 통지는 [게임 보안](/security/game.md)의 세션 재개 증명 기준을 따른다. 보존한 결과는 클라이언트 확인 뒤에만 해제한다.
- **지역·인스턴스 전환의 downlink 차단:** 클라이언트가 새 지역을 설치하기 전에 도착한 개체 갱신은 대상 lookup 실패로 버려집니다. 변경분 복제라면 다음 변경까지 복구되지 않아 원격 플레이어가 보이지 않습니다. 전환 통지를 보내기 **전에** 서버가 그 연결을 not-ready로 바꿔 상태 복제를 멈추고, 클라이언트가 전환 세대를 담은 ready를 보낸 뒤 새 위치 기준의 관찰 집합을 즉시 계산해 full state로 설치합니다. 서버가 개별 despawn 없이 관찰 관계를 비웠다면 클라이언트는 재설치 묶음(시작·끝 표시)에 다시 포함되지 않은 이전 개체를 제거합니다.
- 끊김 감지(heartbeat/liveness)와 재개 유예(grace)는 다른 값이다. 감지는 유효 입력·시계 probe가 끊긴 시간으로 판정하고, grace는 감지 뒤 같은 개체로 돌아올 수 있게 세션을 보관하는 시간이다. 서버는 클라이언트의 수락 응답 설치 여부를 직접 관측할 수 없다. 수락 응답을 설치해야만 보낼 수 있는 uplink(응답이 발급한 현재 세션·연결 epoch에 바인딩된 입력·probe 또는 설치 확인)를 한 번도 받지 못한 신규 세션은 재개 주체가 확인되지 않은 것으로 보고 grace 없이 제거한다. 설치 전 handshake·probe는 이 확인으로 세지 않는다. 설치 직후 첫 uplink 전에 끊겨 세션이 제거된 클라이언트에는 재개 만료를 알리고 신규 접속으로 복구하게 한다. 한 번이라도 확인된 세션은 재개 응답이 전달 중이어도 grace를 유지한다. 판정은 서버가 받은 메시지로 하고, 전송 계층이 클라이언트 내부 상태를 들여다보는 방식으로 대신하지 않는다. 명시적 해제·재접속·세션 재설정·장애·liveness 만료가 모두 같은 서버 측 끊김 처리로 모이게 한다. 남용 방지 규칙(예: 첫 입력 전 세션의 즉시 제거)을 제거하거나 바꿀 때는 그 규칙이 암묵적으로 처리하던 정상 경로의 정리 책임부터 확인한다. 새 토큰은 활성 세션뿐 아니라 재개 요청이 여전히 대조하는 만료 세션 기록, 재사용할 슬롯의 옛 기록과도 달라야 한다.

- 서버 권위의 신뢰 경계(클라이언트의 위치/상태 보고는 검증 자료일 뿐 무검증 정본이 아님)는 [게임 보안](/security/game.md)이 정본이다. 입력 이력 재실행·명중 rewind·전체 물리 rollback은 각각의 게임 요구에 맞춰 선택하며, 서버 권위만을 이유로 모두 의무화하지 않는다.


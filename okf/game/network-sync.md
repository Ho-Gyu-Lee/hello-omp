---
type: Rule
title: 게임 네트워크 동기화
description: 게임 동기화 세부 문서의 안내와 공통 원리(상태 계층·완료 경계·세대·권위 의미·시험), Mirror 인용 기준.
tags: [game, client, server, networking, synchronization, prediction, reconciliation, animation]
timestamp: 2026-10-18T00:00:00Z
---

# 게임 네트워크 동기화

세부: [시간·이동 검증](/game/network-time-movement.md)·[예측·보간·보정](/game/network-prediction.md)·[복구·전달 의미론](/game/network-delivery.md). 전달·I/O·시간 계측의 공통 기준은 [네트워크 전달·I/O·시간 계측](/development/network.md), 난수·재현은 [난수·재현](/development/randomness.md)을 따른다.

## 공통 원리
- **상태 계층:** 권위 상태·클라이언트 예측·보간 목표·최종 표시 상태를 구분하고 표시 상태를 검증·저장·delta baseline으로 역주입하지 않는다. accepted 값의 사용 범위는 [게임 보안](/security/game.md#서버-권위-원칙)이 정본이다.
- **완료 경계:** 수신·실행·결과 발행·상태 설치·내구 확정은 서로 다른 완료 경계이며, 다음 단계는 그 단계가 요구하는 증거로만 진행한다.
- **세대:** 입력·checkpoint·baseline·표시 상태는 하나의 identity/epoch에 결속하고, 불연속에서 폐기·보존·재계산할 것을 함께 정한다.
- **권위 의미:** 처치·소유권·명령 성공 같은 의미는 수신 간격이나 화면 상태로 추론하지 않고 권위 결과에 명시한다.
- **시험:** harness는 제품의 보간·codec 코드와 설정 경로를 그대로 구동하고, 전제(위치·생존·계정 상태)는 새 상태(새 DB)에서도 실제 게임 경로로 만들며 DB를 직접 고치지 않는다. 관심 상태(보간·외삽·보정·teleport)가 실제로 발생했는지 단언하고, 다른 시간축·완료 경계를 하나의 지표로 대체하지 않는다. 예: 권위 tick과 이동량은 독립된 단조 경과시간에도 대조하고(거리/tick만 보면 tick 가속을 놓친다), RTT 정상화와 입력 처리 나이(입력 생성~서버 처리 지연) 회복은 별도 지표다. 같은 생성/소비율의 입력 이력은 유한 정체 뒤에도 처리 지연을 유지하므로 명시적으로 복구하되 권위 이동 시간 예산을 늘리거나 완료 식별자 있는 명령을 조용히 버리지 않는다.

## Mirror 인용 기준
- 게임 문서가 인용하는 Mirror 동작은 고정 revision `c4f3739`(2026-09-19 커밋, 최신 릴리스 v96.11.3 이후)의 `NetworkTime`·`SnapshotInterpolation`·`SyncList`·`NetworkTransformReliable`·`NetworkClient`·`NetworkServer`·`KcpPeer` 기준이며 2026-10-15에 master HEAD와 같았다. 이후 revision에서 달라질 수 있으므로 쓸 때 적용 revision의 코드를 다시 확인한다.
- 지터 버퍼는 기준 시각에 따라 다르게 정한다. 송신자 현재 시각에서 고정 offset을 빼면 offset이 편도 지연 분포의 상위 분위수 + 송신 간격 + 연속 유실 여유를 덮어야 하고, [`SnapshotInterpolation.InsertAndAdjust`](https://github.com/MirrorNetworking/Mirror/blob/c4f3739966e151f405be1762d33502794fd034ff/Assets/Mirror/Core/SnapshotInterpolation/SnapshotInterpolation.cs)처럼 최신 표본의 원격 시각에서 버퍼를 빼면(`snapshot.remoteTime - bufferTime`) 편도 지연이 이미 표본 나이에 들어 있으므로 버퍼는 도착 간격·지터·유실 여유만 덮고 지연을 다시 더하지 않는다.

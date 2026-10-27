---
type: Rule
title: 게임 네트워크 시간·이동 검증
description: 서버 승인 시간·논리 tick과 클라이언트 추정의 경계, 이동 시간 예산 검증, 접촉 트리거 전환 요청의 상태 전이와 확정 경계.
tags: [game, client, server, networking, synchronization, time, movement, validation, transition]
timestamp: 2026-10-18T00:00:00Z
---

# 게임 네트워크 시간·이동 검증

상위 개념: [게임 네트워크 동기화](/game/network-sync.md#공통-원리)

## 게임 시간 계층과 권위

RTT 계측은 [네트워크 전달·I/O·시간 계측](/development/network.md)을 따릅니다.

- 서버 기준시계와 처리한 논리 tick은 pause·부하·따라잡기 제한으로 다른 의미를 가질 수 있으므로 대응 기준점을 결과와 함께 전달하고 `floor(추정 서버시간 × tickRate)`로 실제 처리 완료 tick을 단정하지 않습니다. 클라이언트의 시계 추정·표시 보정은 서버 시계를 바꾸거나 추가 이동 시간을 승인하지 못합니다.
- [Mirror `NetworkTime`](https://github.com/MirrorNetworking/Mirror/blob/c4f3739966e151f405be1762d33502794fd034ff/Assets/Mirror/Core/NetworkTime.cs)은 `localTime`, 서버/host의 local clock, remote client의 buffered `time`/`unscaledTime`, 별도의 `predictedTime`을 구분합니다. [time-sync 가이드](https://mirror-networking.gitbook.io/docs/manual/guides/time-sync)의 "클라이언트와 서버가 같은 값"을 같은 현재 시각으로 읽지 않습니다([인용 기준](/game/network-sync.md#mirror-인용-기준)).

## 이동 속도·시간 예산 검증

- 이동 시간 예산은 서버가 관측한 경과 시간으로만 늘어납니다. 클라이언트 timestamp(batch·메시지 시각)를 경과 시간의 유일한 근거로 쓰면 시계를 빠르게 보고해 속도를 낮게 계산시킬 수 있고 경과 0·NaN 표본은 검사를 건너뜁니다. 역행·비유한 값은 거부하고 같은 시각의 메시지는 경과 0으로 계산하며 서버 관측 경과에 제한된 지터 여유를 더한 범위로 clamp합니다.
- 수락·보정한 값의 사용 범위는 [게임 보안](/security/game.md#서버-권위-원칙)이 정본입니다. 예: 클라이언트 좌표 보고를 검증하는 구조에서 보고 owner는 보통 자기 개체의 서버 복제를 무시하므로 보정을 owner에게 명시적으로 보내야 하고, 보정 세대로 옛 in-flight 보고를 적용·예산 반영 없이 버립니다. 보고자의 축별 변경 플래그를 보정 값과 그대로 중계하면 관찰자가 빠진 축을 자기 이전 표본으로 채워 보정이 사라지므로 전체 상태로 중계합니다.

## 접촉 트리거 기반 전환 요청

- 접촉 트리거(지역 이동·상호작용)는 클라이언트가 요청 시점을 정해도 서버가 거리·생존·busy·미확정 명령을 다시 검사하며, 대기·요청 중·일시 거부·최종 소비의 명시적 상태 전이로 다룹니다. 서버가 미실행·일시 거부임을 명시한 경우에만 간격·총 횟수 예산 안에서 재시도하고 소진되면 최종 소비합니다. 실행 여부를 모르는 timeout은 일시 거부가 아니고 목적지 준비 실패·rollback은 최종 소비이며, 최종 소비는 접촉 이탈이나 사용자의 명시적 재요청으로만 다시 활성화합니다.
- **확정 경계:** 전환은 결과 ACK가 아니라 그 결과를 반영한 자기 권위 snapshot의 처리 경계(state prefix)가 요청 sequence에 닿은 뒤에 시작합니다. 먼저 시작하면 전환 commit이 source downlink를 버려 이미 승인된 결과를 '불명'으로 처리합니다. 그동안 사용자의 전환 의도는 보존했다가 확정 뒤 다시 판정합니다.
- 확정 직전 재검증의 실패는 스스로 풀리는 거절(publication 대기·행동 진행 중·명령 정산)과 확정 거절(사망·전투 진입·유해 상태·출구 이탈)로 나누고 확정 거절은 그 자리에서 precommit 중단을 통지합니다. 모두 조용히 재시도하면 서버의 전환 만료가 클라이언트 단계 기한보다 길 때 정상 거절이 연결 실패로 바뀝니다. 전환 통지 뒤의 downlink 차단·full state 설치는 [복구·전달 의미론](/game/network-delivery.md#복구전달-의미론)을 따릅니다.

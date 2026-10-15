---
type: Rule
title: 게임 네트워크 동기화
description: 상태 계층과 시간·순서·생명주기 원칙, 검증 기준, 학습 근거의 적용 범위를 정리하고 세부 주제는 하위 개념으로 안내한다.
tags: [game, client, server, networking, synchronization, prediction, reconciliation, animation]
timestamp: 2026-10-15T00:00:00Z
---

# 게임 네트워크 동기화

## 하위 개념
* [게임 네트워크 시간·이동 검증](/game/network-time-movement.md) - 서버가 승인한 게임 시간·권위 tick과 클라이언트 추정/표시의 경계, 이동 속도·시간 예산 검증과 접촉 트리거 전환 요청을 다룹니다. 시계 추정·RTT는 [공통 네트워크 시간](/development/network-time.md)에 연결합니다.
* [게임 네트워크 예측·보간·보정](/game/network-prediction.md) - 클라이언트 예측·보정, 애니메이션 시간, 입력 처리 ACK와 재실행, 원격 보간과 판정 지연 보상의 규칙을 다룬다.
* [게임 네트워크 복구·전달 의미론](/game/network-delivery.md) - 증분 복제·baseline, 권위 이전·불연속 marker, 입력/결과 경계와 지역 전환·세션 재개의 게임 계약입니다. 메시지·전송·모바일 복구는 [공통 전달 계약](/development/network-delivery.md)을 따릅니다.
* [네트워크 I/O](/development/network-io.md) - 프레이밍·실패 완료·수명·종료의 실제 전송 경계.
* [연결·음성 토폴로지](/development/network-topology.md) - signaling·릴레이·주소 노출과 미디어 비용의 선택.
* [난수·절차 생성·재현](/development/randomness.md) - seed 외 재현 조건·절차 생성·기록 검증. [게임 기록·재생](/game/random-replay.md) - 락스텝·desync·비공개 정보와 진단 훅의 게임 적용 경계.

## 상태 계층
- 권위 시뮬레이션 상태, 클라이언트 예측 상태, 보간 목표, 최종 표시 상태를 구분한다.
- 표시 상태는 시각적 연속성을 위한 결과이며 서버 검증·저장·delta baseline으로 역주입하지 않는다.
- 서버가 보정·정규화·재계산한 최종 accepted 상태를 저장·시뮬레이션·복제·송신자 보정·관전자 전파 전체에 사용한다(권위 원칙의 정본은 [게임 보안](/security/game.md)).

## 시간·순서·생명주기
시계·RTT는 [공통 시간 계층](/development/network-time.md), sequence·generation·전송 열화 검증은 [공통 전달 계약](/development/network-delivery.md)을 따릅니다.
- 아직 적용 시점이 오지 않은 샘플과 새 데이터가 끊겨 적용 가능 기간을 지난 샘플을 구분해 대기·외삽·재동기화 정책을 각각 적용한다.

## 검증
- 동기화 알고리즘과 transport를 분리해 테스트하되 codec·검증·dispatch·보정 전체를 지나는 통합 테스트를 별도로 둔다.
- 고정 seed·통제된 timestep·직접 snapshot 주입·권위 trace로 결정적 회귀를 재현한다.
- 고정 조건만으로 충분하다고 가정하지 않는다. 가변 timestep·clock drift·burst loss·중복·역순·sequence wrap·재접속·handoff·장시간 누적을 검증한다.
- 절대 허용 기준과 이전 기준선 대비 회귀를 함께 추적한다. simulation 정확도·수렴 시간·표시 연속성을 서로 다른 지표로 측정한다.
- ACK 경계와 snapshot의 일치, 거부 입력 제거, 재실행 부수효과 중복, 이력 상한 초과, 로컬 플레이어와 원격 플레이어의 버퍼 분리를 검증한다.
- 권위 tick과 이동량을 독립된 단조 경과시간에도 대조한다. 거리/tick만 확인하면 tick 자체가 빨라진 오류를 놓칠 수 있다. 경과시간의 끝점은 마지막 상태 표본의 관측 시각과 맞추고, 렌더 전 콜백의 이전 표시를 새 판정 결과와 같은 프레임의 최종 화면으로 간주하지 않는다. 현재 서버 위치와 선행 예측 위치의 차이, 동일 입력 ACK에서의 보정 오차, 표시 수렴 오차는 별도 지표다.
- RTT 정상화·전송 큐 해소·최종 위치 수렴과 입력 처리 나이(입력 생성부터 서버 처리까지의 지연)의 회복을 별도로 검증한다. 같은 생성/소비율의 입력 이력은 유한 정체 뒤에도 처리 지연을 유지할 수 있으므로 독립된 시계의 미세 drift와 반복 정체를 포함한다. 입력 처리 나이는 선언한 범위로 돌아오거나 명시적으로 복구해야 하며, 이를 위해 권위 이동 시간 예산을 늘리거나 완료 식별자가 있는 명령을 조용히 버리지 않는다.
- FPS·unscaled 전체 frame 간격·CPU/GPU 처리시간·RTT·재실행 횟수·클립 위상을 따로 관측합니다. 평균 FPS만으로 간헐적인 긴 frame을 배제하지 않으며 구간 최대/P99와 로딩·정체·보정 시점을 연결합니다. render cadence의 실제 pump와 긴 메인 스레드 공백도 실행해 복귀 뒤 반복 starvation·시각 역행을 검사합니다. 캡처/동기 probe를 frame 집계에서 뺐더라도 권위·표시 시계에 준 영향까지 없어진 것은 아닙니다.
- 동기화 시뮬레이터는 제품의 보간·codec 코드를 그대로 구동하고, 상태 분류도 제품 코드가 노출한 값을 씁니다. 분기 조건을 복사한 그림자 분류기는 제품과 어긋나고, 예전 wire 형식을 다시 구현한 harness는 실제 프로토콜을 검증하지 못합니다. 송신 주기·버퍼 같은 입력은 제품 설정 경로로 넣고, 관심 상태(보간·외삽·보정·정지·teleport 등)가 실제로 발생했는지 coverage를 단언합니다. 적응형 타임라인을 고정 offset으로 대체하면 그 제어기는 검증되지 않습니다. 버퍼는 기준 시각에 따라 다르게 정합니다. 송신자 현재 시각(시뮬레이터의 기준 시계)에서 고정 offset을 빼는 방식이면 offset이 jitter·장지연을 포함한 편도 지연 분포의 상위 분위수 + 송신 간격 + 연속 유실 여유를 덮어야 합니다. 최신 수신 표본의 원격 시각에서 버퍼를 빼는 방식(예: [Mirror `SnapshotInterpolation.InsertAndAdjust`](https://github.com/MirrorNetworking/Mirror/blob/c4f3739966e151f405be1762d33502794fd034ff/Assets/Mirror/Core/SnapshotInterpolation/SnapshotInterpolation.cs)의 `snapshot.remoteTime - bufferTime` 초기화)이면 기본 편도 지연은 이미 표본 나이에 들어 있으므로, 버퍼는 도착 간격·지터·유실 여유만 덮고 지연을 다시 더하지 않습니다. 송신자 현재 시각 대비 표시 지연은 후자에서도 편도 지연과 버퍼를 합한 값입니다. 버퍼가 지연 꼬리보다 짧으면 외삽이, 보정 복귀 조건이 이동 중 충족되지 않으면 보정 상태가 대부분을 차지해, 보간 품질을 재지 못한 채 PASS가 나올 수 있습니다.
- 결과 파일마다 판정 기준값·seed·시나리오·빌드 식별자를 함께 기록합니다. 기준이 남지 않으면 FAIL→PASS 전환이 코드 개선인지 기준·시나리오 변경인지 구분할 수 없습니다. 평균 하나 대신 상태별 시간 비율·오차 합·p95/p99/max를 보고 보간 비율 하한 같은 실패 조건을 두며, 표본 수 0은 실패로 봅니다. 순간 이동은 시뮬레이션 step이 아니라 실제 표시 frame에서 기대 이동을 넘은 양으로 잽니다. 유실은 delta 계산 **뒤**에 적용해야 delta 프로토콜의 영구 불일치가 드러나고, 동기화 지연은 대체된 변경을 빠뜨리지 않고 셉니다. 최악 사례 재생은 관련 상태 전체(속도 추정·보정 상태·회전)를 담고 원래 이상값을 재현하는지 단언합니다. 난수는 용도·사용자별 stream으로 나누고 여러 seed의 분포로 판단합니다. TCP 전송은 유실·재정렬 대신 HOL 정체 뒤 몰아서 도착하는 패턴으로 모델링합니다.

## 학습 근거·적용 범위
- Gabriel Gambetta의 [Part I: 서버 권위](https://www.gabrielgambetta.com/client-server-game-architecture.html), [Part II: 입력 sequence·보정](https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html), [Part III: 원격 보간](https://www.gabrielgambetta.com/entity-interpolation.html), [Part IV: 명중 지연 보상](https://www.gabrielgambetta.com/lag-compensation.html)을 개념 근거로 사용한다. 큐 상한·거부 ACK·generation·경제 커밋은 원문의 단순화된 예제를 운영 계약에 적용할 때 필요한 별도 설계 기준이다.
- KinematicSoup의 [Client-side Prediction for Smooth Multiplayer Gameplay](https://www.kinematicsoup.com/blog/multiplayerprediction/)는 Kazap.io의 입력/변위 이력·속도 오차에 따른 재실행·렌더 수렴 사례다. 이 글의 의사코드가 쓰는 `CONVERGE_MULTIPLIER = 0.05`(원문 주석 "We chose 0.05", 확인 2026-10-15)는 그 게임의 선택이며 범용 상수가 아니다. 의사코드는 완성 라이브러리가 아니고 경계 처리를 별도로 검증해야 한다.
- 이 글들은 Gateway/게임 프로세스 분리나 MMORPG 처리량을 증명하지 않는다. 서버 분리 구조와 성능 검증은 [서버 체크리스트](/game/server-checklist.md)를 따른다.
- Mirror 고정 revision(`c4f3739`, 2026-09-19 커밋으로 최신 릴리스 v96.11.3[2026-09-17] 이후)에서 인용한 파일(`NetworkTime`·`SnapshotInterpolation`·`SyncList`·`NetworkTransformReliable`·`NetworkClient`·`NetworkConnection`·`NetworkServer`·`KcpPeer`)은 2026-10-15에도 master HEAD가 이 revision이고 최신 릴리스가 v96.11.3이어서 master와 내용이 같음을 확인했다. 이후 revision에서 달라질 수 있으므로 인용한 동작을 쓸 때는 적용 revision의 코드를 다시 확인한다.


관련 보안 원칙은 [게임 보안](/security/game.md), 구현 체크는 [클라이언트 체크리스트](/game/client-checklist.md)와 [서버 체크리스트](/game/server-checklist.md)를 따른다.

---
type: Rule
title: 게임 네트워크 동기화
description: 상태 계층과 시간·순서·생명주기 원칙, 검증 기준, 학습 근거의 적용 범위를 정리하고 세부 주제는 하위 개념으로 안내한다.
tags: [game, client, server, networking, synchronization, prediction, reconciliation, animation]
timestamp: 2026-10-15T00:00:00Z
---

# 게임 네트워크 동기화

## 하위 개념
* [게임 네트워크 시간·이동 검증](/game/network-time-movement.md) - 서버 권위 구조에서 시간의 소유권과 단위를 정하고, 이동 속도·시간 예산 검증과 접촉 트리거 전환 요청을 다루는 규칙이다.
* [게임 네트워크 예측·보간·보정](/game/network-prediction.md) - 클라이언트 예측·보정, 애니메이션 시간, 입력 처리 ACK와 재실행, 원격 보간과 판정 지연 보상의 규칙을 다룬다.
* [게임 네트워크 복구·전달 의미론](/game/network-delivery.md) - 증분 복제의 복구와 전달 의미론, 전송 계층·RPC의 구분, 모바일 경로 전환과 세션 복구의 규칙을 다룬다.

## 상태 계층
- 권위 시뮬레이션 상태, 클라이언트 예측 상태, 보간 목표, 최종 표시 상태를 구분한다.
- 표시 상태는 시각적 연속성을 위한 결과이며 서버 검증·저장·delta baseline으로 역주입하지 않는다.
- 서버가 보정·정규화·재계산한 최종 accepted 상태를 저장·시뮬레이션·복제·송신자 보정·관전자 전파 전체에 사용한다(권위 원칙의 정본은 [게임 보안](/security/game.md)).

## 시간·순서·생명주기
- 원격 timestamp와 로컬 시간을 직접 비교하지 않는다. 의미·단위·기준 시계를 명시하고 변환하며, 로컬 경과 시간은 단조 증가 시간원으로 측정한다.
- 아직 적용 시점이 오지 않은 샘플과 새 데이터가 끊겨 적용 가능 기간을 지난 샘플을 구분해 대기·외삽·재동기화 정책을 각각 적용한다.
- sequence의 중복·역순·손실·wraparound와 재접속 후 generation 변경을 처리한다. 큰 sequence 하나로 수신 window를 임의 전진시키지 못하게 한다.
- 재사용 가능한 entity ID에는 generation 또는 동등한 생명주기 식별자를 결합해 늦은 패킷이 새 객체에 적용되지 않게 한다.

## 검증
- 동기화 알고리즘과 transport를 분리해 테스트하되 codec·검증·dispatch·보정 전체를 지나는 통합 테스트를 별도로 둔다.
- 고정 seed·통제된 timestep·직접 snapshot 주입·권위 trace로 결정적 회귀를 재현한다.
- 고정 조건만으로 충분하다고 가정하지 않는다. 가변 timestep·clock drift·burst loss·중복·역순·sequence wrap·재접속·handoff·장시간 누적을 검증한다.
- 절대 허용 기준과 이전 기준선 대비 회귀를 함께 추적한다. simulation 정확도·수렴 시간·표시 연속성을 서로 다른 지표로 측정한다.
- ACK 경계와 snapshot의 일치, 거부 입력 제거, 재실행 부수효과 중복, 이력 상한 초과, 로컬 플레이어와 원격 플레이어의 버퍼 분리를 검증한다.
- 권위 tick과 이동량을 독립된 단조 경과시간에도 대조한다. 거리/tick만 확인하면 tick 자체가 빨라진 오류를 놓칠 수 있다. 경과시간의 끝점은 마지막 상태 표본의 관측 시각과 맞추고, 렌더 전 콜백의 이전 표시를 새 판정 결과와 같은 프레임의 최종 화면으로 간주하지 않는다. 현재 서버 위치와 선행 예측 위치의 차이, 동일 입력 ACK에서의 보정 오차, 표시 수렴 오차는 별도 지표다.
- RTT 정상화·전송 큐 해소·최종 위치 수렴과 입력 처리 나이(입력 생성부터 서버 처리까지의 지연)의 회복을 별도로 검증한다. 같은 생성/소비율의 입력 이력은 유한 정체 뒤에도 처리 지연을 유지할 수 있으므로 독립된 시계의 미세 drift와 반복 정체를 포함한다. 입력 처리 나이는 선언한 범위로 돌아오거나 명시적으로 복구해야 하며, 이를 위해 권위 이동 시간 예산을 늘리거나 완료 식별자가 있는 명령을 조용히 버리지 않는다.
- FPS·unscaled 전체 frame 간격·CPU/GPU 처리시간·RTT·재실행 횟수·클립 위상을 따로 관측합니다. 평균 FPS만으로 간헐적인 긴 frame을 배제하지 않으며 구간 최대/P99와 로딩·정체·보정 시점을 연결합니다. render cadence의 실제 pump와 긴 메인 스레드 공백도 실행해 복귀 뒤 반복 starvation·시각 역행을 검사합니다. 캡처/동기 probe를 frame 집계에서 뺐더라도 권위·표시 시계에 준 영향까지 없어진 것은 아닙니다.
- HUD Ping의 분위수는 집계 단위부터 확인합니다. 주기 probe 한 번의 RTT를 다음 probe까지 그대로 표시하는 값을 짧은 간격으로 표본화하면 한 측정이 여러 번 세어집니다. 표본 수가 독립 측정 수보다 부풀고, 측정마다 반복 횟수가 다르면 표시 시간으로 가중된 분포가 됩니다. 독립 측정이 적은 구간에서는 p95가 상위 1~2회 측정으로 정해질 수 있으므로(관측 사례) 분위수와 함께 독립 probe 수를 보고합니다. 송신·수신 시각을 메인 스레드 pump에서 찍으면 RTT는 frame 간격의 정수배로 양자화됩니다. 서버 응답에 담긴 수신·송신 시각이 handler의 같은 값이면 서버 안 대기를 분리할 수 없고, 상향·하향 분리는 최소 RTT 표본의 대칭 가정에 따른 추정입니다. 개발 PC에서 Windows 클라이언트가 `localhost`로 WSL2(NAT 모드)의 서버에 접속하면 WSL localhost 중계를 지나며, 중계 소스는 서버로 가는 TCP 소켓에 `TCP_NODELAY`를 설정하지 않습니다([WSL `localhost.cpp` 2.7.14](https://github.com/microsoft/WSL/blob/2.7.14/src/linux/init/localhost.cpp), [localhost 문서](https://github.com/microsoft/WSL/blob/2.7.14/doc/docs/technical-documentation/localhost.md)). 같은 소스에 `TCP_NODELAY` 설정이 2.7.14와 3.0.1([2026-09-29 릴리스](https://github.com/microsoft/WSL/releases/tag/3.0.1)), 현재 stable 3.0.3([2026-10-09 릴리스](https://github.com/microsoft/WSL/releases/tag/3.0.3))·master에도 없음을 2026-10-15에 확인했습니다. 실제 측정에서 작은 상향 frame의 일부가 15~50ms 붙잡혔고, VM IP의 `TCP_NODELAY` 프록시로 중계를 우회하자 사라졌습니다. Nagle과 Linux 지연 ACK가 유력한 메커니즘이지만 패킷 수준으로 확인하지는 않았습니다. 지연을 판단하기 전에 이 경로를 제외하거나 mirrored 모드·VM IP 직접 경로와 비교합니다(2026-10-11 관측, WSL 2.7.14).
- 동기화 시뮬레이터는 제품의 보간·codec 코드를 그대로 구동하고, 상태 분류도 제품 코드가 노출한 값을 씁니다. 분기 조건을 복사한 그림자 분류기는 제품과 어긋나고, 예전 wire 형식을 다시 구현한 harness는 실제 프로토콜을 검증하지 못합니다. 송신 주기·버퍼 같은 입력은 제품 설정 경로로 넣고, 관심 상태(보간·외삽·보정·정지·teleport 등)가 실제로 발생했는지 coverage를 단언합니다. 적응형 타임라인을 고정 offset으로 대체하면 그 제어기는 검증되지 않습니다. 버퍼는 기준 시각에 따라 다르게 정합니다. 송신자 현재 시각(시뮬레이터의 기준 시계)에서 고정 offset을 빼는 방식이면 offset이 jitter·장지연을 포함한 편도 지연 분포의 상위 분위수 + 송신 간격 + 연속 유실 여유를 덮어야 합니다. 최신 수신 표본의 원격 시각에서 버퍼를 빼는 방식(예: [Mirror `SnapshotInterpolation.InsertAndAdjust`](https://github.com/MirrorNetworking/Mirror/blob/c4f3739966e151f405be1762d33502794fd034ff/Assets/Mirror/Core/SnapshotInterpolation/SnapshotInterpolation.cs)의 `snapshot.remoteTime - bufferTime` 초기화)이면 기본 편도 지연은 이미 표본 나이에 들어 있으므로, 버퍼는 도착 간격·지터·유실 여유만 덮고 지연을 다시 더하지 않습니다. 송신자 현재 시각 대비 표시 지연은 후자에서도 편도 지연과 버퍼를 합한 값입니다. 버퍼가 지연 꼬리보다 짧으면 외삽이, 보정 복귀 조건이 이동 중 충족되지 않으면 보정 상태가 대부분을 차지해, 보간 품질을 재지 못한 채 PASS가 나올 수 있습니다.
- 결과 파일마다 판정 기준값·seed·시나리오·빌드 식별자를 함께 기록합니다. 기준이 남지 않으면 FAIL→PASS 전환이 코드 개선인지 기준·시나리오 변경인지 구분할 수 없습니다. 평균 하나 대신 상태별 시간 비율·오차 합·p95/p99/max를 보고 보간 비율 하한 같은 실패 조건을 두며, 표본 수 0은 실패로 봅니다. 순간 이동은 시뮬레이션 step이 아니라 실제 표시 frame에서 기대 이동을 넘은 양으로 잽니다. 유실은 delta 계산 **뒤**에 적용해야 delta 프로토콜의 영구 불일치가 드러나고, 동기화 지연은 대체된 변경을 빠뜨리지 않고 셉니다. 최악 사례 재생은 관련 상태 전체(속도 추정·보정 상태·회전)를 담고 원래 이상값을 재현하는지 단언합니다. 난수는 용도·사용자별 stream으로 나누고 여러 seed의 분포로 판단합니다. TCP 전송은 유실·재정렬 대신 HOL 정체 뒤 몰아서 도착하는 패턴으로 모델링합니다.

## 학습 근거·적용 범위
- Gabriel Gambetta의 [Part I: 서버 권위](https://www.gabrielgambetta.com/client-server-game-architecture.html), [Part II: 입력 sequence·보정](https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html), [Part III: 원격 보간](https://www.gabrielgambetta.com/entity-interpolation.html), [Part IV: 명중 지연 보상](https://www.gabrielgambetta.com/lag-compensation.html)을 개념 근거로 사용한다. 큐 상한·거부 ACK·generation·경제 커밋은 원문의 단순화된 예제를 운영 계약에 적용할 때 필요한 별도 설계 기준이다.
- KinematicSoup의 [Client-side Prediction for Smooth Multiplayer Gameplay](https://www.kinematicsoup.com/blog/multiplayerprediction/)는 Kazap.io의 입력/변위 이력·속도 오차에 따른 재실행·렌더 수렴 사례다. 이 글의 의사코드가 쓰는 `CONVERGE_MULTIPLIER = 0.05`(원문 주석 "We chose 0.05", 확인 2026-10-15)는 그 게임의 선택이며 범용 상수가 아니다. 의사코드는 완성 라이브러리가 아니고 경계 처리를 별도로 검증해야 한다.
- 이 글들은 Gateway/게임 프로세스 분리나 MMORPG 처리량을 증명하지 않는다. 서버 분리 구조와 성능 검증은 [서버 체크리스트](/game/server-checklist.md)를 따른다.
- Mirror 고정 revision(`c4f3739`, 2026-09-19 커밋으로 최신 릴리스 v96.11.3[2026-09-17] 이후)에서 인용한 파일(`NetworkTime`·`SnapshotInterpolation`·`SyncList`·`NetworkTransformReliable`·`NetworkClient`·`NetworkConnection`·`NetworkServer`·`KcpPeer`)은 2026-10-15에도 master HEAD가 이 revision이고 최신 릴리스가 v96.11.3이어서 master와 내용이 같음을 확인했다. 이후 revision에서 달라질 수 있으므로 인용한 동작을 쓸 때는 적용 revision의 코드를 다시 확인한다.


관련 보안 원칙은 [게임 보안](/security/game.md), 구현 체크는 [클라이언트 체크리스트](/game/client-checklist.md)와 [서버 체크리스트](/game/server-checklist.md)를 따른다.

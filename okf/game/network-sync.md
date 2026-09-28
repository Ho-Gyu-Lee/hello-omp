---
type: Rule
title: 게임 네트워크 동기화
description: 권위 상태·시간과 순서·입력 처리 ACK·예측/재실행·원격 보간·판정 보상·복구·전달 의미론·검증 원칙.
tags: [game, client, server, networking, synchronization, prediction, reconciliation]
timestamp: 2026-09-28T00:00:00Z
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

### 입력 처리 ACK와 로컬 재실행
- 입력 예측이 필요한 게임에서는 서버 검증 가능한 입력과 session generation·sequence를 보내고 클라이언트에 미확정 입력을 제한된 크기로 보관한다. 클라이언트가 보낸 위치·delta time·timestamp·명중 신고 자체가 권위 상태는 아니다.
- 서버는 권위 상태와 **그 상태까지 처리한 입력의 경계**를 함께 반환한다. Gateway의 수신/전달 ACK나 TCP ACK를 게임 로직 처리 완료로 해석하지 않는다.
- 누적 ACK를 쓰려면 같은 세션의 순서가 확정된 입력 prefix여야 한다. 수락과 거부 결과를 구분하고 거부 입력은 상태에 적용하지 않되 클라이언트가 해당 예측을 폐기할 수 있게 한다. 누락/역순 입력을 건너뛰고 큰 sequence 하나를 처리 완료 경계로 삼지 않는다.
- 병합·접수 거부·중복도 완료 의미를 정의한다. 이미 sequence를 가진 입력을 병합할 때는 대체 완료 등 명시적인 결과로 처리 경계를 닫고, 큐에서 단순 삭제해 ACK 구멍을 만들지 않는다. 접수 전 번호 부여 여부와 실패 시 pending 정리 정책을 정하며, 이미 전송한 번호는 timeout만으로 다른 요청에 재사용하지 않는다. 중복은 기존 pending/완료 결과를 재사용하고 다시 실행하지 않는다.
- 클라이언트는 ACK까지의 확정된 입력을 제거하고, 받은 권위 상태를 예측 기준으로 삼아 미확정 입력만 순서대로 재실행한다. 재실행이 발사 요청·소리·재화 변경을 중복 발생시키지 않도록 표시/외부 부수효과와 시뮬레이션을 구분한다.
- RTT 길이만으로 이력을 자르는 것과 서버가 처리한 입력을 식별하는 것은 다르다. 지터·서버 큐 대기·입력 거부가 있는 경로에서 시간 추정으로 ACK를 대체하지 않는다.
- 같은 이동 코드를 양쪽에서 사용해도 timestep·충돌 환경·다른 개체 상태·부동소수점 차이로 예측은 틀릴 수 있다. 임의 물리 엔진 간 결정성을 가정하지 않는다. 이력 상한을 넘거나 필요한 입력이 없으면 무한 재실행 대신 권위 상태로 재동기화한다.

### 원격 개체 보간과 판정 지연 보상
- 자기 캐릭터의 예측/보정, 다른 개체의 snapshot 보간, 서버의 명중 판정 지연 보상은 서로 다른 기능이다. 원격 개체는 수신한 권위 샘플 사이의 표시 시각으로 보간하고, 샘플 부족에는 제한된 외삽/정지/재동기화 정책을 적용한다.
- 시뮬레이션 틱·복제 송신 주기·클라이언트 렌더 프레임을 구분한다. 원문의 예시 갱신 빈도나 보간 지연을 제품 고정값으로 채택하지 않는다.
- 과거 명중 판정이 필요한 전투만 서버가 보유한 제한된 권위 이력으로 검사한다. 클라이언트 발사 시각은 검증 가능한 시계 대응·허용 rewind 범위·현재 권한/발사 조건으로 제한한다. 엄폐 후 피격 같은 공정성 대가도 게임 정책으로 정한다.
- 지연 보상은 게임 전체·경제 상태의 무제한 rollback이 아니다. Gateway가 명중 여부를 결정하거나 클라이언트가 보고한 과거 상태를 정본으로 삼지 않는다.
- 시각적 수렴 알고리즘을 이식할 때 빈 이력·0/비유한 시간·보간 계수 범위·각도 wrap·teleport와 이동 종료를 검증한다. 특정 게임의 수렴 상수 하나로 모든 이동 모델을 해결하지 않는다.

## 복구·전달 의미론
- 증분 event·command·delta를 쓰는 시스템은 손실·중복·역순·장기 이탈 뒤 권위 상태로 수렴할 경로를 둔다. snapshot·replay log·state hash·재조회 중 요구에 맞는 방식을 선택한다.
- 이전 baseline에 의존하는 프로토콜은 양측이 공유하는 accepted baseline을 식별하고 불일치·만료 시 bounded recovery 또는 full-state resync를 제공한다.
- transport ACK와 애플리케이션 상태 수락을 구분한다. 검증되지 않은 ACK·baseline ID로 권위 상태나 수신 window를 갱신하지 않는다.
- 메시지마다 전달·순서·중복·만료·최신값 대체 가능성·복구 의미를 정의한다. transport의 reliable/unreliable 이름만으로 애플리케이션 계약을 대신하지 않는다.
- authority handoff는 이전·현재·예정 authority와 handoff generation·commit 시점·in-flight message 처리 정책을 명시한다. host/local fast path도 원격 경로와 같은 검증·권한·정규화 결과를 보장한다.
- 느린 연결의 송신 큐는 무한히 증가시키지 않는다. 메시지 의미에 따라 coalesce·drop·backpressure·disconnect 정책을 적용한다.

### 전송 보장·I/O API·RPC의 구분
- [TCP](https://www.rfc-editor.org/rfc/rfc9293.html#section-2.2)는 연결 안의 신뢰성 있는 순서 보장 byte stream이다. 그 위에 UDP용 패킷 재전송/재정렬을 기계적으로 중복 구현하지 않는다. 메시지 프레이밍·부분 송수신·큐 상한과 재접속/콘텐츠 처리 경계는 별도 계약이며 TCP ACK는 게임 커밋이 아니다.
- [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html)은 I/O readiness API이고, [gRPC](https://grpc.io/docs/what-is-grpc/core-concepts/)는 RPC/stream 계층이다. [gRPC over HTTP/2](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md)와 자체 TCP 프레이밍은 동일 프로토콜이 아니며 서버 권위·복제 방식은 그 상위의 게임 계약이다. 특정 전송을 모든 게임의 기본값으로 강제하지 않는다.
- 상태 병합은 전송 계층에 제출하지 않은 완전한 메시지에만 적용하고 부분 제출된 프레임·라이브러리 소유 버퍼를 수정하지 않는다. [gRPC flow control](https://grpc.io/docs/guides/flow-control/)의 write 반환도 실제 네트워크 송신 완료를 뜻하지 않는다. RPC timeout/cancel은 이미 적용된 업무 결과의 rollback이나 미실행 증거가 아니며, 재접속·재호출의 업무 멱등성은 별도로 보장한다.
- 서버 권위는 서버의 검증·판정 책임이다. 클라이언트의 위치/상태 보고를 검증 자료로 받을 수 있지만 무검증 정본으로 쓰지 않는다. 입력 이력 재실행·명중 rewind·전체 물리 rollback은 각각의 게임 요구에 맞춰 선택하며, 서버 권위만을 이유로 모두 의무화하지 않는다.


## 검증
- 동기화 알고리즘과 transport를 분리해 테스트하되 codec·검증·dispatch·보정 전체를 지나는 통합 테스트를 별도로 둔다.
- 고정 seed·통제된 timestep·직접 snapshot 주입·권위 trace로 결정적 회귀를 재현한다.
- 고정 조건만으로 충분하다고 가정하지 않는다. 가변 timestep·clock drift·burst loss·중복·역순·sequence wrap·재접속·handoff·장시간 누적을 검증한다.
- 절대 허용 기준과 이전 기준선 대비 회귀를 함께 추적한다. simulation 정확도·수렴 시간·표시 연속성을 서로 다른 지표로 측정한다.
- ACK 경계와 snapshot의 일치, 거부 입력 제거, 재실행 부수효과 중복, 이력 상한 초과, 로컬 플레이어와 원격 플레이어의 버퍼 분리를 검증한다.

## 학습 근거·적용 범위
- Gabriel Gambetta의 [Part I: 서버 권위](https://www.gabrielgambetta.com/client-server-game-architecture.html), [Part II: 입력 sequence·보정](https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html), [Part III: 원격 보간](https://www.gabrielgambetta.com/entity-interpolation.html), [Part IV: 명중 지연 보상](https://www.gabrielgambetta.com/lag-compensation.html)을 개념 근거로 사용한다. 큐 상한·거부 ACK·generation·경제 커밋은 원문의 단순화된 예제를 운영 계약에 적용할 때 필요한 별도 설계 기준이다.
- KinematicSoup의 [Client-side Prediction for Smooth Multiplayer Gameplay](https://www.kinematicsoup.com/blog/multiplayerprediction/)는 Kazap.io의 입력/변위 이력·속도 오차에 따른 재실행·렌더 수렴 사례다. 본문의 `CONVERGE_MULTIPLIER = 0.05`는 그 게임의 선택이며 범용 상수가 아니다. 게시된 의사코드는 완성 라이브러리가 아니고 경계 처리를 별도로 검증해야 한다.
- 이 글들은 Gateway/게임 프로세스 분리나 MMORPG 처리량을 증명하지 않는다. 서버 분리 구조와 성능 검증은 [서버 체크리스트](/game/server-checklist.md)를 따른다.


관련 보안 원칙은 [게임 보안](/security/game.md), 구현 체크는 [클라이언트 체크리스트](/game/client-checklist.md)와 [서버 체크리스트](/game/server-checklist.md)를 따른다.

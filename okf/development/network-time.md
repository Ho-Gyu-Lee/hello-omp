---
type: Concept
title: 시계 도메인·네트워크 시간과 RTT 계측
description: 단조 시간·단위/기준점·정밀도, 원격 offset/drift·RTT의 추정 한계, probe 표본화·메인루프/캡처 교란·WSL 사례를 다룹니다.
tags: [development, networking, time, clock, drift, rtt, measurement]
timestamp: 2026-10-15T00:00:00Z
---

# 시계 도메인·네트워크 시간과 RTT 계측

앱·서비스의 시간 도메인과 측정 계약입니다. HUD·frame/tick·게임 cooldown은 해당 소비자의 사례이며 모든 앱에 게임 loop를 요구하지 않습니다. 원격 시각 추정과 로컬 단조 경과시간, 측정값과 표시값을 구분합니다. 서버의 게임 이동 시간 승인·권위 tick·예측/보간의 시간은 [게임 시간·이동 검증](/game/network-time-movement.md)에 따로 둡니다.

## 시계 도메인과 추정
- 속도·쿨다운·보정처럼 시간에 의존하는 규칙보다 시간의 소유권·단위·기준점을 먼저 정의합니다. 공통 구현/계약을 사용하는 것과 모든 용도를 하나의 `GetTime()` 값으로 처리하는 것은 다릅니다. 기능별 독립 시계·임의 float 누적을 만들지 않고 도메인과 단위를 API에 드러냅니다.
- 원격 timestamp와 로컬 시간을 직접 비교하지 않는다. 의미·단위·기준 시계를 명시하고 변환하며, 로컬 경과 시간은 단조 증가 시간원으로 측정한다.
- 절대 시각/누적량은 정밀도를 보존하는 정수 duration/tick 또는 double을 사용하고 작은 단위의 float를 계속 더해 정본 시각을 만들지 않습니다. 변환의 단위·범위·오버플로와 tick 간격의 잔여량을 다룹니다. 순수 코어에는 승인된 시뮬레이션 시간 문맥을 전달하고 OS/엔진 시계 조회는 호스트 경계에 둡니다.
- 네트워크 동기화의 RTT·offset·drift는 측정과 추정입니다. 송수신/큐잉 측정 지점을 정의하고 초기 동기화·이상 표본·신선도·재접속/epoch 교체를 처리합니다. NTP식 네 timestamp(요청 송신·서버 수신·서버 송신·응답 수신) 방식도 편도 지연 비대칭을 제거하지 못하며 RTT/2나 표본 분산만으로 정확한 편도 지연·절대 동기 오차를 보장하지 않습니다.
- 실측으로 표시하는 핑은 실제 요청 송신부터 대응 응답 수신까지 단조 시계로 측정합니다. 로컬 연결이라는 이유로 0을 대입하지 않습니다. 애플리케이션 RTT에는 해당 측정 경로의 큐잉·서버 처리가 포함되며, 처리시간을 뺀 전송 지연 추정과 구분합니다. 소수 정밀도의 원값을 보존하고 UI에서만 반올림합니다. 아직 측정하지 않았거나 만료된 표본은 유효한 0과 구분하고, 상관 ID·세대·echo 시각이 맞지 않는 응답으로 표본 나이를 갱신하지 않습니다.
- 초기 기준점 설정과 실행 중 보정을 구분합니다. offset 추정의 갱신을 게임이 소비하는 시각에 그대로 점프 적용하지 않고, 연속 시각의 역행·진행률 제한·큰 불연속의 명시적 재동기화 정책을 정합니다. 표시/예측 시각의 조정과 서버의 승인된 시뮬레이션 진행량은 별개입니다.
- 같은 프로세스의 로컬 클라이언트/서버도 시간의 작성자와 읽는 측을 구분하고 명령·결과의 시간 계약을 유지합니다. 같은 기준시계의 알려진 대응을 사용할 수 있으며 소켓·직렬화·가짜 RTT를 필수로 만들지 않습니다. 원격 추정 계산은 전송과 분리하여 서로 다른 가상 시계·지연·drift로 검증할 수 있습니다. 제품 로컬 경로와 원격 조건을 가정한 검증을 혼동하지 않습니다.

## RTT 계측과 관찰 사례
- HUD Ping의 분위수는 집계 단위부터 확인합니다. 주기 probe 한 번의 RTT를 다음 probe까지 그대로 표시하는 값을 짧은 간격으로 표본화하면 한 측정이 여러 번 세어집니다. 표본 수가 독립 측정 수보다 부풀고, 측정마다 반복 횟수가 다르면 표시 시간으로 가중된 분포가 됩니다. 독립 측정이 적은 구간에서는 p95가 상위 1~2회 측정으로 정해질 수 있으므로(관측 사례) 분위수와 함께 독립 probe 수를 보고합니다. 송신·수신 시각을 메인 스레드 pump에서 찍으면 RTT는 frame 간격의 정수배로 양자화됩니다. 서버 응답에 담긴 수신·송신 시각이 handler의 같은 값이면 서버 안 대기를 분리할 수 없고, 상향·하향 분리는 최소 RTT 표본의 대칭 가정에 따른 추정입니다. 개발 PC에서 Windows 클라이언트가 `localhost`로 WSL2(NAT 모드)의 서버에 접속하면 WSL localhost 중계를 지나며, 중계 소스는 서버로 가는 TCP 소켓에 `TCP_NODELAY`를 설정하지 않습니다([WSL `localhost.cpp` 2.7.14](https://github.com/microsoft/WSL/blob/2.7.14/src/linux/init/localhost.cpp), [localhost 문서](https://github.com/microsoft/WSL/blob/2.7.14/doc/docs/technical-documentation/localhost.md)). 같은 소스에 `TCP_NODELAY` 설정이 2.7.14와 3.0.1([2026-09-29 릴리스](https://github.com/microsoft/WSL/releases/tag/3.0.1)), 현재 stable 3.0.3([2026-10-09 릴리스](https://github.com/microsoft/WSL/releases/tag/3.0.3))·master에도 없음을 2026-10-15에 확인했습니다. 실제 측정에서 작은 상향 frame의 일부가 15~50ms 붙잡혔고, VM IP의 `TCP_NODELAY` 프록시로 중계를 우회하자 사라졌습니다. Nagle과 Linux 지연 ACK가 유력한 메커니즘이지만 패킷 수준으로 확인하지는 않았습니다. 지연을 판단하기 전에 이 경로를 제외하거나 mirrored 모드·VM IP 직접 경로와 비교합니다(2026-10-11 관측, WSL 2.7.14).
- [ ] RTT·지연 표시 계측: 자동화 렌더 테스트의 화면 캡처(GPU readback·PNG 인코딩)는 메인 스레드를 멈춘다. 그동안 도착한 응답은 처리되지 않아 HUD RTT가 부풀려진다. 실측 사례에서 250ms마다 캡처하면 FPS가 3~4로 떨어지고 RTT가 525ms에서 2.6초까지 올랐으며, 캡처 없는 같은 실행은 7ms였다(통계량·표본 수는 기록하지 않았다). 네트워크 지연은 캡처 없는 관찰 실행으로 따로 측정하고, 캡처 시점의 HUD 수치를 지연 근거로 쓰지 않는다. HUD Ping 분위수의 집계 단위와 개발 PC의 WSL localhost 중계 경로는 [공통 시간·RTT 계측](/development/network-time.md#rtt-계측과-관찰-사례)의 HUD Ping 항목을 따른다.

## 근거와 적용 범위
- [Riot LoL Unified Clock, 2017-10-10](https://www.riotgames.com/en/news/determinism-league-legends-unified-clock): 공통 시간 구현·여러 clock instance·명확한 API·정밀도·offset filtering·같은 프로세스의 master/replica와 가상 네트워크 검증입니다. 당시 LoL은 가변 스텝을 유지했으며(근거: 같은 시리즈의 [Implementation 글](https://www.riotgames.com/en/news/determinism-league-legends-implementation)이 고정 스텝 서버 클록 대신 측정한 frame delta time을 목표 frame rate로 제한해 쓰고 가변 frame delta time을 유지했다고 서술) 이를 고정 스텝이나 VALORANT의 구현으로 바꾸어 인용하지 않습니다.

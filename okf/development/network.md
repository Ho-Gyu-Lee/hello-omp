---
type: Rule
title: 네트워크 전달·I/O·시간 계측
description: 송신 공정성·reliable 폐기·gRPC 재접속·Apple 연결 제약, IOCP 실패 완료·소켓 종료 수명, WSL localhost 중계 지연과 RTT 표본화·캡처 교란을 다룹니다.
tags: [development, networking, transport, rpc, fairness, iocp, winsock, rtt, wsl]
timestamp: 2026-10-18T00:00:00Z
---

# 네트워크 전달·I/O·시간 계측

게임 복제·권위 이전·예측 입력은 [게임 전달 의미론](/game/network-delivery.md), 이동 시간 승인·권위 tick은 [게임 시간·이동 검증](/game/network-time-movement.md)을 따릅니다. 비동기 완료·끊김의 적용 순서는 [서버 체크리스트](/development/server-checklist.md#프로토콜과-비동기-수명)가 정본입니다.

## 메시지 전달·송신 공정성

- 완료 결과의 소유권은 실행 호스트의 outbox → 실제로 접수된 불변 송신 메시지 → 수신 소비자로 이어집니다. 접수 전에는 snapshot 주기가 느리거나 송신 큐가 가득 찼다는 이유로 결과를 지우지 않습니다.
- Mirror(고정 revision `c4f3739`)의 `NetworkConnection.Send`는 상한을 넘는 송신을 로그만 남기고 버립니다. 신뢰 stream에서 메시지가 조용히 빠지므로 호출자 오류나 연결 종료로 바꿉니다. kcp2k 고정 소스는 최대 크기 reliable 메시지가 수신 window 전체를 채운다고 경고합니다([`NetworkConnection.cs`](https://github.com/MirrorNetworking/Mirror/blob/c4f3739966e151f405be1762d33502794fd034ff/Assets/Mirror/Core/NetworkConnection.cs), [`KcpPeer.cs`](https://github.com/MirrorNetworking/Mirror/blob/c4f3739966e151f405be1762d33502794fd034ff/Assets/Mirror/Transports/KCP/kcp2k/highlevel/KcpPeer.cs), 조회 2026-10-11).
- 한 연결에서 큰 데이터 조각(상태 설치)과 실시간 frame을 함께 보낼 때 어느 쪽도 굶기지 않습니다. 실시간을 먼저 채우고 조각은 여유가 있을 때만 보내면 실시간 배출이 계속되는 동안 조각이 끝내 들어가지 못해 로그인·전환의 상태 설치가 멈춥니다. 조각이 거절된 연결에서는 그 뒤 admit한 실시간 바이트에 상한을 두고, 공유 송신 풀에서는 연결별 slot 예약 합계가 풀 전체를 차지하지 않게 하며 순회 시작점을 연결별로 회전합니다. 보장은 경과 시간이 아니라 scheduler가 admit한 양과 "조건이 처음 충족되는 호출에 큐잉"으로 서술합니다.
- 전송 열화 시험은 설정값이 아니라 실제로 발생한 교란(비인접 중복·재정렬 등)을 기록해 증거로 삼습니다. 지연이 송신 간격보다 짧으면 설정한 reorder가 관측되지 않을 수 있고, TCP 경로에서는 wire 재정렬이 아니라 순서 보장 뒤의 정체/몰림으로 나타납니다([tc-netem](https://man7.org/linux/man-pages/man8/tc-netem.8.html)). 범위 주장은 [측정과 검증의 범위](/development/runtime-diagnostics.md#측정과-검증의-범위)를 따릅니다.

## 모바일 경로 전환과 연결 복구

- 자체 재연결을 하는 RPC 채널 위에 앱 수준 재접속 루프를 얹으면 재시도 소유자가 둘이 됩니다. gRPC는 기본값으로 채널이 `TRANSIENT_FAILURE`일 때 RPC를 연결을 기다리지 않고 즉시 실패시키므로([wait-for-ready](https://github.com/grpc/grpc/blob/master/doc/wait-for-ready.md)), 앱 복귀 직후 채널 재연결이 진행 중이면 앱의 시도는 연결을 열지 않고 실패하고 그동안 채널은 이미 READY가 될 수 있습니다. 즉시 재시도 경로에서는 채널 준비를 유한 기한으로 기다린 뒤(gRPC C++ `Channel::WaitForConnected` 등) 호출합니다. 호출 deadline은 호출 전체의 기한이므로([gRPC deadlines](https://grpc.io/docs/guides/deadlines/)) 장기 양방향 스트림의 연결 대기용으로 쓰지 않습니다(gRPC C++ 1.57 클라이언트 실측, 2026-10-16).
- [Apple TN3151](https://developer.apple.com/documentation/technotes/tn3151-choosing-the-right-networking-api)은 BSD sockets 사용을 허용하지만 시스템 resolver·Happy Eyeballs·소켓별 DNS 이름 연관(`ne_socket_set_domains`)·viability 관찰을 별도 책임으로 둡니다. 수동 DNS→주소 연결은 Happy Eyeballs를 구현해도 VPN On Demand와 호환되지 않으며, domain tagging은 content filter 등에 문맥을 주는 수단이지 이 제한의 해소 근거가 아닙니다(조회 2026-10-08, 재확인 2026-10-15). 자체 TLS/CA 검증은 시스템 신뢰 평가 권고와 다른 선택이므로 OS의 신뢰·폐기·사용자/기업 anchor 정책과 동등하다고 주장하지 않습니다.

## 비동기 I/O 완료와 수명

- IOCP의 `GetQueuedCompletionStatus`가 `FALSE`여도 `OVERLAPPED != nullptr`이면 실패한 연산의 완료 패킷을 꺼낸 것입니다. '큐가 비었음'으로 버리지 않습니다([GetQueuedCompletionStatus](https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-getqueuedcompletionstatus)).
- `closesocket`·취소 요청의 반환은 미완료 연산의 완료 통지 소비가 아닙니다. 완료(중단 포함) 통지를 소비할 때까지 연산이 참조하는 컨텍스트·송신 버퍼를 유지하고 새 연결/accept에 재사용하지 않습니다. 동시에 진행 중인 연산마다 별도 `OVERLAPPED`·연산 종류·버퍼 수명을 두며 연결 객체의 mutable `state` 하나로 완료 종류를 추정하지 않습니다([closesocket](https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-closesocket), [WSASend](https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsasend)).

## RTT 계측과 관찰 사례

- Windows 클라이언트가 `localhost`로 WSL2(NAT 모드)의 서버에 접속하면 WSL localhost 중계를 지나며, 중계 소스는 서버로 가는 TCP 소켓에 `TCP_NODELAY`를 설정하지 않습니다. 2.7.14·3.0.1·3.0.3·master 모두 설정이 없음을 2026-10-15에 확인했습니다([`localhost.cpp` 2.7.14](https://github.com/microsoft/WSL/blob/2.7.14/src/linux/init/localhost.cpp), [localhost 문서](https://github.com/microsoft/WSL/blob/2.7.14/doc/docs/technical-documentation/localhost.md)). WSL 2.7.14 실측(2026-10-11)에서 작은 상향 frame의 일부가 15~50ms 붙잡혔고 VM IP의 `TCP_NODELAY` 프록시로 중계를 우회하자 사라졌습니다. Nagle과 Linux 지연 ACK가 유력하지만 패킷 수준으로 확인하지는 않았습니다. 지연을 판단하기 전에 이 경로를 제외하거나 mirrored 모드·VM IP 직접 경로와 비교합니다.
- HUD Ping 분위수는 집계 단위부터 확인합니다. 주기 probe 한 번의 RTT를 다음 probe까지 표시하는 값을 짧은 간격으로 표본화하면 한 측정이 여러 번 세어져 표본 수가 독립 측정 수보다 부풀고 분포가 표시 시간으로 가중됩니다. 분위수와 함께 독립 probe 수를 보고합니다. 송수신 시각을 메인 스레드 pump에서 찍으면 RTT가 frame 간격의 정수배로 양자화됩니다.
- 관측값·추정값·표시값을 구분합니다. 로컬 연결이라는 이유로 0을 대입하지 않고, 미측정·만료 표본은 유효한 0과 구분하며, 상관 ID·세대·echo 시각이 맞지 않는 응답으로 표본 나이를 갱신하지 않습니다.
- 자동화 렌더 테스트의 화면 캡처(GPU readback·PNG 인코딩)는 메인 스레드를 멈춰 그동안 도착한 응답이 처리되지 않으므로 HUD RTT가 부풀려집니다. 네트워크 지연은 캡처 없는 관찰 실행으로 따로 측정하고 캡처 시점의 HUD 수치를 지연 근거로 쓰지 않습니다.

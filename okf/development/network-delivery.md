---
type: Rule
title: 메시지 전달·송신 공정성과 연결 복구
description: 메시지별 전달/만료·묶음·소유권, TCP/I/O/RPC 경계와 HOL·공정한 송신, 모바일 경로 전환·애플리케이션 세션 복구의 공통 계약입니다.
tags: [development, networking, transport, rpc, backpressure, fairness, mobile, session]
timestamp: 2026-10-16T00:00:00Z
---

# 메시지 전달·송신 공정성과 연결 복구

앱·웹·서비스·게임 통신의 공통 계약입니다. snapshot·입력 ACK·READY는 주기 발행·업무 처리 확인·상태 설치의 조건부 사례이며 모든 프로토콜의 필수 메시지가 아닙니다. 게임 복제 baseline·권위 이전·예측 입력의 처리 경계는 [게임 전달 의미론](/game/network-delivery.md)에 남깁니다. 이 문서의 전송·재접속 선택이 애플리케이션 권한·멱등성을 자동 제공하지 않습니다.

## 메시지 전달·소유권
- 메시지마다 전달·순서·중복·만료·최신값 대체 가능성·복구 의미를 정의한다. transport의 reliable/unreliable 이름만으로 애플리케이션 계약을 대신하지 않는다.
- 묶음 송신과 같은 재전송/폐기 단위는 다릅니다. 서로 다른 전달·만료 등급을 한 패킷에 동봉하더라도 프레임별 의미를 유지합니다. 하나의 재전송 정책으로 묶어 중요한 명령을 누락하거나 만료된 상태를 재전달하지 않습니다. 예: [QUIC DATAGRAM](https://www.rfc-editor.org/rfc/rfc9221.html)은 다른 frame과 동봉될 수 있어도 자체는 재전송하지 않습니다(*Game Programming Gems 3* 한국어판 PDF p.669의 batching 원리를 현행 계약과 대조, 2026-10-15).

- 느린 연결의 송신 큐는 무한히 증가시키지 않는다. 메시지 의미에 따라 coalesce·drop·backpressure·disconnect 정책을 적용한다.
- 완료 결과의 소유권은 실행 호스트의 outbox → 실제로 접수된 불변 송신 메시지 → 수신 소비자로 이어진다. snapshot 주기가 느리거나 송신 큐가 가득 찼다는 이유로 결과를 지우지 않는다. 큐잉된 명령과 아직 넘기지 못한 완료 결과를 같은 서버 측 용량 예산에 포함하면 장애 시 전체 취소도 결과 배열 상한을 넘지 않게 할 수 있다.
## 전송 계층과 송신 공정성
### 전송 보장·I/O API·RPC의 구분
- [TCP](https://www.rfc-editor.org/rfc/rfc9293.html#section-2.2)는 연결 안의 신뢰성 있는 순서 보장 byte stream이다. 그 위에 UDP용 패킷 재전송/재정렬을 기계적으로 중복 구현하지 않는다. 메시지 프레이밍·부분 송수신·큐 상한과 재접속/콘텐츠 처리 경계는 별도 계약이며 TCP ACK는 게임 커밋이 아니다.
- [epoll](https://man7.org/linux/man-pages/man7/epoll.7.html)은 I/O readiness API이고, [gRPC](https://grpc.io/docs/what-is-grpc/core-concepts/)는 RPC/stream 계층이다. [gRPC over HTTP/2](https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md)와 자체 TCP 프레이밍은 동일 프로토콜이 아니며 서버 권위·복제 방식은 그 상위의 게임 계약이다. 특정 전송을 모든 게임의 기본값으로 강제하지 않는다.
- 직접 transport/codec을 작성·리뷰할 때의 분할·병합·부분 송신·처리 예산, readiness/실패 completion·연산 수명·FIN/TLS 종료는 [네트워크 I/O](/development/network-io.md)를 따른다. 필드 표현·양자화·압축 선택은 [데이터 형식](/development/data-formats.md), signaling·직접/릴레이·음성 경로의 조건은 [연결 토폴로지](/development/network-topology.md)로 구분한다.
- 상태 병합은 전송 계층에 제출하지 않은 완전한 메시지에만 적용하고 부분 제출된 프레임·라이브러리 소유 버퍼를 수정하지 않는다. [gRPC flow control](https://grpc.io/docs/guides/flow-control/)의 write 반환도 실제 네트워크 송신 완료를 뜻하지 않는다. RPC timeout/cancel은 이미 적용된 업무 결과의 rollback이나 미실행 증거가 아니며, 재접속·재호출의 업무 멱등성은 별도로 보장한다.
- 순서 보장 stream 하나(TCP·WebSocket·reliable UDP)에 큰 메시지를 실으면 뒤의 snapshot·입력 ACK·시간 표본이 그 전송 시간만큼 밀립니다(head-of-line). [kcp2k 고정 소스](https://github.com/MirrorNetworking/Mirror/blob/c4f3739966e151f405be1762d33502794fd034ff/Assets/Mirror/Transports/KCP/kcp2k/highlevel/KcpPeer.cs)도 최대 크기 reliable 메시지가 수신 window 전체를 채운다고 경고합니다. 애플리케이션 메시지 상한을 작게 정하고, 맵·목록 같은 큰 데이터는 별도 경로로 보내거나 같은 stream이라면 조각을 실시간 frame 사이에 끼워 보내는 연결별 송신 스케줄러를 둡니다. 조각을 한꺼번에 큐에 넣으면 나눠도 지연은 같습니다. 커널 송신 버퍼에 이미 들어간 바이트는 앞지를 수 없으므로 미송신량도 제한합니다(Linux `TCP_NOTSENT_LOWAT`, [ip-sysctl 문서](https://docs.kernel.org/networking/ip-sysctl.html)). 송신 batch는 메시지를 쪼개지 않으며, UDP는 경로 MTU 안의 datagram 하나로, TCP는 대기 frame을 묶어 한 번에 씁니다. 상한을 넘는 송신을 로그만 남기고 버리면([Mirror `NetworkConnection.Send`](https://github.com/MirrorNetworking/Mirror/blob/c4f3739966e151f405be1762d33502794fd034ff/Assets/Mirror/Core/NetworkConnection.cs)) 신뢰 stream에서 메시지가 조용히 빠져 순서·완전성 가정이 깨지므로 호출자 오류나 연결 종료로 처리합니다(조회 2026-10-11).
- 공유 연결 송신 스케줄러를 "실시간 frame을 먼저 보내고, 조각은 실시간 publication 하나 분량의 여유를 남길 때만 보낸다"로만 만들면, 실시간 배출이 계속될 때 비워지는 공간을 실시간이 매번 먼저 채워 조각이 끝내 들어가지 못합니다. 로그인·전환의 상태 설치가 멈추는 새 정체입니다. 조각이 바이트 부족으로 거절된 연결에서는 그 뒤 admit한 실시간 바이트에 상한을 두고, 상한에 닿으면 조각 frame 하나가 들어갈 때까지 결과·snapshot을 보류합니다. 이렇게 하면 실시간 앞에 쌓이는 조각 바이트와 대기 조각 앞에 admit되는 실시간 바이트에 각각 상한이 생기고, 바이트·slot 조건이 처음 충족되는 호출에 조각이 들어갑니다. 연결 handshake·설치 완료 같은 control은 보류하지 않습니다. 이것은 admit량과 서비스 순서의 보장이지 경과 시간 상한이 아닙니다. 느린 reader나 slot 부족이 계속되면 시간은 제한되지 않습니다. 여러 연결이 송신 frame 풀을 공유하면 연결별 slot 예약 합계가 풀 전체를 차지하지 않게 하고(실제 송신 중인 연결만 세고 풀 크기로 상한), 순회 시작점은 연결별로 회전합니다. 다른 연결의 성공이 막힌 route의 차례를 덮어쓰면 안 됩니다. 공유 풀 부족은 연결 사이에서 따로 중재하되, 이번 회차에 이미 송신을 받은 연결이 자기 다른 route의 거절로 다시 선두가 되지 않게 합니다. 보장은 drain된 바이트가 아니라 스케줄러가 admit한 양과 "조건이 처음 충족되는 호출에 큐잉"으로 서술합니다. transport가 쓰기를 연달아 이어 가면 호출 사이에 window 전체가 비워질 수 있기 때문입니다. 위 결함은 2026-10-11 실제 구현에서 독립 리뷰가 단계적으로 찾아냈고, 각 규칙을 결정적 모델 테스트와 변이 검사로 확인했습니다. 느린 reader에서의 live 지연은 측정하지 않았습니다.

### 모바일 경로 전환과 세션 복구

- TCP 재접속, [QUIC의 살아 있는 연결 migration](https://www.rfc-editor.org/rfc/rfc9000.html#section-9), 여러 경로의 동시 사용, 게임 세션 resume을 구분합니다. QUIC Connection ID(CID)는 transport 상태의 라우팅 식별자이지 계정·캐릭터 권위나 만료된 연결을 복원하는 증명이 아닙니다. 주소가 바뀌어도 같은 transport owner로 도달해야 하며, CID 라우팅만으로 Gateway 장애 시 상태가 복제되지는 않습니다.
- [Android NetworkCallback](https://developer.android.com/develop/connectivity/network-ops/reading-network-state)·[Apple NWPathMonitor](https://developer.apple.com/documentation/network/nwpathmonitor)는 경로 관찰 신호입니다. Wi-Fi/셀룰러 표기나 사용 가능 알림을 인증된 서비스 도달성으로 대체하지 않습니다. 정상 연결을 모든 알림마다 끊거나 reachability 사전 검사만으로 접속을 막지 않으며, 경로 신호와 실제 I/O·애플리케이션 timeout을 함께 사용합니다. 주소 캐시·진행 중 DNS와 주소군별 접속 후보도 회선 세대에 맞춰 처리해 이전 경로의 주소 하나만 무한 재사용하지 않습니다. TLS 검증용 서비스 identity는 dial IP와 분리합니다.
- 연결·DNS·TLS·재시도는 한 소유자의 상태 전이와 attempt generation으로 묶고, 낡은 callback·취소된 재시도를 무효화합니다. 재시도 간격·횟수·대기 자원에는 예산을 둡니다. 네이티브 작업 스레드도 [iOS 앱 suspension](https://developer.apple.com/documentation/uikit/extending-your-app-s-background-execution-time)과 [Android Doze의 네트워크 제한](https://developer.android.com/training/monitoring-device-state/doze-standby)을 우회하지 못합니다.
- 자체 재연결을 하는 RPC 채널 위에 앱 수준 재접속 루프를 얹으면 재시도 소유자가 둘이 됩니다. gRPC는 기본값으로 채널이 `TRANSIENT_FAILURE`일 때 RPC를 연결을 기다리지 않고 즉시 실패시킵니다([wait-for-ready](https://github.com/grpc/grpc/blob/master/doc/wait-for-ready.md)). 앱 복귀처럼 바로 재시도해야 하는 시점에 채널 재연결이 진행 중이면 그 시도는 연결을 열지 않고 실패하고, 앱이 다음 백오프 간격을 기다리는 동안 채널은 이미 READY가 될 수 있습니다. 즉시 재시도 경로에서는 채널 준비를 유한 기한으로 기다린 뒤(gRPC C++ `Channel::WaitForConnected` 등) 호출합니다. 호출 기한(deadline)은 호출 전체가 넘지 말아야 할 시각이므로([gRPC deadlines](https://grpc.io/docs/guides/deadlines/)) 장기 양방향 스트림의 연결 대기용으로 쓰지 않습니다. 시험에서 릴레이가 본 TCP 연결 수는 앱의 시도 수와 1:1이 아닙니다(라이브러리도 스스로 재연결하고, 즉시 실패한 RPC는 연결을 열지 않음). 앱 쪽 시도·대기 기록으로 판정합니다(gRPC C++ 1.57 클라이언트 실측, 2026-10-16).
- 소켓 연결/TLS handshake 성공과 권위 full-state 설치 완료는 별개입니다. 프로세스 내부의 token·명령 이력 보존으로 앱 프로세스 종료 후 복구까지 보장하지 않습니다. 재실행·grace 만료·거절은 재인증·권위 상태 복구·미확정 결과 처리 계약을 따릅니다.
- 전송 선택은 같은 입력/명령·복제 부하에서 인증된 READY 복구, 상태 나이, 입력→권위 결과의 꼬리 지연, 중복 실행·미확정 결과, CPU wakeup·메모리·단말 에너지로 비교합니다. HTTP 처리량이나 영상 FPS를 게임 지연으로 치환하지 않습니다. [STORM, USENIX ATC 2025](https://www.usenix.org/system/files/atc25-hu-liekun.pdf)은 이동 중 서로 다른 품질의 경로를 함께 사용하면 단일 경로보다 영상 지연/프레임률이 나빠질 수 있음을 보인 사례이며, 해당 수치를 모든 게임·단말의 성능 예측으로 사용하지 않습니다.
- 크로스플랫폼 전송 구현을 공유해도 앱 수명·소켓별 네트워크 문맥 같은 OS 통합이 사라지지는 않습니다. 엔진의 공통 알림을 재사용하고 부족한 연결 문맥만 작은 경계에 둡니다. 그 경계에 송수신·TLS·재시도·게임 세션 상태 머신을 복제하지 않으며, 라이브러리가 이름을 받는다는 사실만으로 플랫폼의 connect-by-name 의미를 제공한다고 판단하지 않습니다.
- [Apple TN3151](https://developer.apple.com/documentation/technotes/tn3151-choosing-the-right-networking-api)은 크로스플랫폼 코드의 BSD sockets 사용을 허용하지만 시스템 resolver·Happy Eyeballs·소켓별 원래 DNS 이름 연관(`ne_socket_set_domains`)·성립된 소켓의 viability 관찰을 별도 책임으로 둡니다. 수동 DNS→주소 연결은 Happy Eyeballs를 구현해도 VPN On Demand와 호환되지 않는다고 설명합니다. domain tagging은 content filter 등에 문맥을 주는 수단이며 이 제한을 해소한다는 근거는 아닙니다(조회 2026-10-08, 재확인 2026-10-15). 이미 연결된 VPN 경로는 별도 검증 대상입니다. 자체 TLS/CA 검증은 Apple의 시스템 신뢰 평가 권고와 다른 선택이므로 Safari/OS의 신뢰·폐기·사용자/기업 anchor 정책과 동등하다고 주장하지 않습니다.

## 순서·수명과 전송 열화 검증
- sequence의 중복·역순·손실·wraparound와 재접속 후 generation 변경을 처리한다. 큰 sequence 하나로 수신 window를 임의 전진시키지 못하게 한다.
- 재사용 가능한 entity ID에는 generation 또는 동등한 생명주기 식별자를 결합해 늦은 패킷이 새 객체에 적용되지 않게 한다.
- 실제 전송 열화 시험에서는 상향/하향의 지연·loss·대역폭을 분리하고 비인접 중복·재정렬이 실제 발생했는지 기록한다. 설정값만으로 coverage를 주장하지 않는다. 지연이 송신 간격보다 짧으면 설정한 reorder가 관측되지 않을 수 있으며, TCP 응용 경로에는 wire 재정렬이 아닌 순서 보장 뒤 정체/몰림으로 나타나는 차이를 유지한다. 근거: *Game Programming Gems 3* 한국어판 PDF p.662–665, [tc-netem](https://man7.org/linux/man-pages/man8/tc-netem.8.html).

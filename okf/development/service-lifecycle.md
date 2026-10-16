---
type: Checklist
title: 서비스 영속성·생존 감시·프로세스와 소유권 수명
description: 비동기 재진입·identity 결속, heartbeat·장애 격리, PID/pidfd·보호된 이전·컨테이너와 Windows 상시 감독, 소유권 fencing과 운영 복구의 공통 계약입니다.
tags: [development, server, persistence, heartbeat, process, pidfd, container, fencing, lifecycle]
timestamp: 2026-10-15T00:00:00Z
---

# 서비스 영속성·생존 감시·프로세스와 소유권 수명

상태를 가진 앱·웹·게임 서비스에서 해당 운영 구조를 선택했을 때의 기준입니다. 특정 샤딩·감독자·컨테이너 도입을 요구하지 않습니다. 본문의 엔티티·카탈로그/맵·Gateway/World는 소유 상태·불변 입력·다지역 서비스의 조건부 사례입니다. 게임의 결과 공개 A/B/C와 전투/경제 적용·존 이전은 [게임 서버 영속화](/game/server-persistence.md)에 남기며, 그 정책을 다른 도메인에 그대로 강제하지 않습니다. SQL/멱등 영수증 구현은 [DB 설계](/database/design.md)를 함께 봅니다.

## 비동기 원자성과 내구 확인
- [ ] 단일 스레드도 비동기 대기 전후에 다른 명령이 끼어들 수 있다. 예약/pending 상태 또는 적용 시 버전 검증 등으로 중복 소비와 낡은 완료의 덮어쓰기를 막는다. 분산 거래는 한 로직 스레드만으로 원자적이지 않다.

여기서 큐·로그 확인 뒤 공개하는 유형을 B로 부르는 문장은 [게임 공개/내구 분류](/game/server-persistence.md)의 적용 사례입니다. 공통 원리는 응답·복제 확인·디스크 내구 확인을 구분하는 것이며 다른 서비스의 결과 공개 정책을 대신 정하지 않습니다.
  B에서는 큐 확인을 디스크 내구로 읽지 않는다. NATS JetStream R3의 PubAck는 과반 복제 뒤에 오지만 fsync는 `sync_interval` 기본 2분 주기라서, 그 창 안에 여러 노드에 OS 장애가 나면 확인된 쓰기도 잃을 수 있다([Surviving node loss](https://docs.nats.io/learn/jetstream/surviving-node-loss), [Replication and R=3](https://docs.nats.io/learn/clustering/replication-and-r3), 확인 2026-10-12). `sync_interval: always`는 이 창을 닫지만 쓰기 지연·처리량을 대가로 치른다.

## Identity에 결속된 데이터 이동
- [ ] 내구 저장소가 콘텐츠 identity(공개·비공개 카탈로그 전체와 맵 바이트의 digest)에 결속돼 있으면 표시 전용 필드·아이콘 경로·맵 재게시처럼 판정과 무관해 보이는 변경도 identity를 바꿔 기존 DB를 열 수 없게 만든다. 구현 전에 식별 입력을 코드로 확인하고, 데이터 배치(식별 대상 카탈로그/별도 표시 데이터)와 기존 DB 처리(백업 후 새 DB·명시적 재결속 도구)를 사용자 결정으로 드러낸다. 계정 credential·provision digest도 identity에 묶였다면 DB만 옮기면 재프로비저닝이 거부되므로 같은 세대로 함께 보존·교체한다. 산출물을 다시 생성하기 전에 이전 identity와 일치하는 데이터셋을 보존해야 복구가 가능하며, 검사 우회·자동 reset으로 불일치를 감추지 않는다. identity를 기록해 두는 저장소 metadata는 테이블이 없는 빈 DB에서만 초기화하고, 테이블이 있는데 metadata가 없는 DB는 어떤 변경 전에도 fail-closed로 거부한다.
- [ ] 클라이언트·서버가 공유하는 권위 코드와 실행 데이터를 별도 레포·디렉터리로 옮길 때는 identity가 파일 위치가 아니라 카탈로그 값과 맵 바이트에만 의존하는지 코드로 먼저 확인한다. 카탈로그 안의 리소스 경로 문자열(예: 맵 경로)은 identity 입력이므로 바꾸지 않고, 데이터 파일은 줄바꿈 변환 없이 바이트 그대로 옮긴다. 옮긴 뒤 같은 binary로 계산한 identity를 이전 값과 비교해 같을 때만 기존 DB를 그대로 쓴다. 서버가 옮겨진 데이터 root를 기준으로 리소스 경로를 해석하면, 개발 실행 클라이언트도 같은 집합의 경로를 같은 root로 바꿔 읽어야 두 쪽이 다른 바이트를 보지 않는다.

## 서비스 링크·장애 격리
- [ ] Gateway는 콘텐츠 서버 링크 하나의 상실을 그 지역의 장애로 처리하고 프로세스를 종료하지 않는다. 그 지역에 묶인 클라이언트뿐 아니라 보류 중인 이전 commit, 로그아웃이 기다리는 이전 대상 같은 모든 연관을 정리하며, 다른 지역 클라이언트의 큐·슬롯 불변조건을 유지한다. 재연결은 유한 backoff로 하고 새 handshake(서버 identity·incarnation)를 다시 검증한 뒤에만 라우팅한다. 이전 연결 ID는 종료 event까지 퇴역 상태로 남겨 늦은 frame이 새 링크로 섞이지 않게 한다. 감독 프로세스는 시작 장벽 전에는 어떤 자식 종료도 시작 실패로 보고, 장벽 뒤에는 콘텐츠 서버 하나의 종료를 격리한다. 콘텐츠 서버의 SIGKILL·SIGTERM·링크 단절을 각각 실제로 주입해 다른 지역의 snapshot·입력 ack가 끊기지 않는지 검증한다.
- [ ] 서비스 간 링크(Gateway↔콘텐츠 서버, 콘텐츠 서버끼리, 저장소 서비스)의 생존 확인을 둔다. TCP keepalive는 Linux 기본값이 2시간 뒤 75초 간격 9회([ip-sysctl](https://github.com/torvalds/linux/blob/master/Documentation/networking/ip-sysctl.rst))라 느리고, 커널 TCP 계층이 응답하므로 멈춘 프로세스를 잡지 못한다(계층 구조에서 도출). 다음을 정한다:
  - **수신 증거:** 일정 간격으로 PING을 보내되 PONG만이 아니라 그 연결에서 소비한 어떤 frame이든 생존 증거로 센다. PONG 전용 판정은 큰 메시지 뒤에 밀린 PONG을 침묵으로 오판한다([BitCraft 2026-08 사후 분석](https://bitcraftonline.com/news/update-on-disconnections-and-server-stability); [ZeroMQ `ZMQ_HEARTBEAT_TIMEOUT`](https://github.com/zeromq/libzmq/blob/master/doc/zmq_setsockopt.adoc)과 [Erlang tick](https://www.erlang.org/doc/apps/kernel/kernel_app.html)도 모든 트래픽을 센다). 소유 검증(연결 ID·세대)을 통과한 frame만 세어 만료된 연결의 늦은 frame이 새 링크의 시계를 갱신하지 못하게 한다.
  - **응답 위치가 감지 대상을 정한다:** 소켓/I/O 계층이 응답하면 프로세스·네트워크 생존만 보고([TrinityCore `CMSG_PING`](https://github.com/TrinityCore/TrinityCore/blob/master/src/server/game/Server/WorldSocket.cpp)은 socket 처리기, gRPC keepalive는 HTTP/2 PING), 로직 loop가 응답하면 로직 정지까지 잡는다. 로직 정지를 별도 감시하는 사례가 있다([TrinityCore `MaxCoreStuckTime`](https://github.com/TrinityCore/TrinityCore/blob/master/src/server/worldserver/worldserver.conf.dist) 기본 60초 뒤 강제 crash). 로직 loop 응답이면 저장소 서비스의 동기 commit·디스크 정지도 같은 기한에 걸린다.
  - **자기 정지 오판 방지:** 소비해야 다음 frame을 읽는 구조에서는 멈췄다 깨어난 프로세스에게 모든 peer가 동시에 침묵한 것처럼 보인다. 그 pass의 수신 event를 먼저 소비한 뒤 판정하고(못 다 읽은 pass는 짧게 유예), 자기 loop 간격이 송신 주기를 넘었으면 peer 창을 새로 연다. [Orleans의 자기 상태 점검](https://github.com/dotnet/docs/blob/main/docs/orleans/implementation/cluster-management.md)(HashiCorp Lifeguard 기반)과 같은 원칙이며, 정지가 반복되면 감지도 계속 미뤄지는 대가가 있다.
  - **기한과 결과의 비가역성:** 게임 라이브러리 기본값은 송신 1초 안팎·만료 5~10초가 많다(LiteNetLib 1s/5s, ENet 500ms ping·RTT 기반 5~30s, kcp2k 1s/10s, Valve GNS 10s, RakNet 10s·Debug 30s, yojimbo 10s). 서버 클러스터는 의심과 확정을 나누거나 길게 둔다([Akka](https://doc.akka.io/libraries/akka-core/current/typed/failure-detector.html) 1초 heartbeat·unreachable과 [SBR](https://doc.akka.io/libraries/akka-core/current/split-brain-resolver.html) stable-after 20초, Orleans 약 15초와 투표 뒤 자기 종료, Erlang 45~75초). 만료가 전체 fail-stop처럼 되돌릴 수 없으면 짧은 기한이 디스크 정지 같은 정상 지연까지 장애로 바꾼다는 점을 결정자에게 드러내고, 기존 요청 기한과의 관계(만료가 더 짧으면 기존 기한보다 먼저 죽음)를 적는다.
  - **감시 방향:** 응답만 하는 쪽(저장소 서비스)이 상대를 만료시키면 상대의 일시 정지가 재개 시 연결 상실→종료로 바뀐다. 가용성 이득이 없으면 응답 전용으로 두고 반쪽 열린 연결의 자원 회수는 별도 한계로 기록한다.
  - **재접속 겹침:** 재접속이 이전 연결의 종료보다 먼저 올 수 있으므로 최신 연결만 신뢰한다([ArenaNet GDC 2017 "reconnect before disconnect"](https://gdcvault.com/play/mediaProxy.php?sid=1024442)). BitCraft는 timeout을 늘린 뒤 옛 연결 종료가 새 연결의 로그아웃으로 처리되는 버그를 겪었다.
  - **송신 경로:** 막힌 PONG의 재시도가 다른 업무 대기(중요 제어 송신 대기 등) 게이트에 묶이면 건강한 링크가 만료된다. 재시도는 매 pass 독립으로 돌리고 전역 송신 slot을 응답 트래픽이 다 쓰지 않게 연결당 PONG 몫을 남기며, 응답 전용 서비스는 수신 event를 pass당 상한까지만 처리해 PING 흐름이 송신을 굶기지 못하게 한다.
  - **검증:** 각 서비스를 만료값 미만·초과로 SIGSTOP/SIGCONT하고, 연결은 유지한 채 한 방향 frame만 버리는 relay로 방향별 감시를 확인한다. 시계 주입 순수 헬퍼의 경계(정확히 만료 시각, 재시도 간격, 시계 점프, 포화 산술)는 단위 테스트로 고정한다.
- [ ] 콘텐츠 프로세스 장애는 내구 상태·재생 정책으로 복구한다. 프로세스 생존과 로직 진행을 별도로 감시하고 정지한 owner를 대체할 때 기존 owner의 쓰기 권한을 차단한다.

## 프로세스 인스턴스와 보호된 이전
- [ ] 실행 자동화(테스트 harness·이전 도구처럼 프로세스를 띄우고 종료하는 스크립트·도구)의 종료 대상은 재사용 가능한 PID가 아니라 프로세스 인스턴스에 결박한다. PID·시작 시각을 확인한 뒤 별도 `kill`을 호출해도 검사와 신호 사이의 재사용 경합은 남는다. Linux의 [pidfd 신호](https://man7.org/linux/man-pages/man2/pidfd_send_signal.2.html)는 확보한 인스턴스를 계속 가리키며, 그 프로세스가 끝나 회수된 뒤에는 다른 프로세스로 옮겨 가지 않고 `ESRCH`로 실패한다(확인 2026-10-15).
  - 직접 `fork`한 자식은 부모가 pidfd를 확보한 뒤에만 자식 작업을 실행하게 한다. 자식이 먼저 끝나도 좀비를 아직 회수하지 않았다면 PID가 재사용되지 않고 pidfd가 그 좀비를 가리키지만, `SIGCHLD=SIG_IGN`·`SA_NOCLDWAIT`·프로그램 안의 다른 회수 경로(다른 스레드의 `wait`, 비동기 시그널 핸들러)가 하나라도 있으면 이 보장이 성립하지 않는다([pidfd_open의 조건](https://man7.org/linux/man-pages/man2/pidfd_open.2.html)). 그 경우에는 `fork` 뒤 `pidfd_open` 대신 `clone`의 `CLONE_PIDFD`로 자식과 pidfd를 함께 만든다(같은 문서, man-pages 6.19, 확인 2026-10-15).
  - 기존 프로세스를 나중에 포착할 때는 “확보 뒤 신호가 안전함”과 “처음 확보한 것이 원래 실행임”을 구분한다. `/proc`의 [starttime은 clock tick 단위](https://man7.org/linux/man-pages/man5/proc_pid_stat.5.html)이므로 고유 실행 세대라고 가정하지 않는다. 자기 launch의 제어 채널에서 얻은 새 세대 식별과 실제 부모 관계 등 독립된 근거로 검증하며, 발견한 대상의 값을 기대값으로 다시 채택하지 않는다. 이는 협력하는 실행 도구의 동일성 계약이지 악성 동일 UID 프로세스에 대한 샌드박스가 아니다.
  - proxy·관찰자·로그 reader 종료를 실제 서비스 종료나 reap으로 바꾸지 않는다. 종료 확인은 신뢰된 구조화된 lifecycle 상태로 보존하고, 길이 제한으로 잘릴 수 있는 로그 문자열이나 Promise의 rejection에서 추론하지 않는다. 일반 테스트 자식의 EOF 정리와 영속 데이터 이전 guardian의 EOF 잠금 유지는 서로 다른 정책이다.
- [ ] 검토·승인을 거쳐 실행하는 영속 데이터 이전 작업(보호된 이전 작업)은 검토한 실행 입력을 실행별 불변 manifest로 고정한다. controller가 확인한 공유 설정 파일을 하위 helper가 다시 읽게 두면 검토 대기 중 변경된 다른 DB·원본·namespace를 먼저 건드릴 수 있다. 실제 검토 근거에 manifest 해시를 포함하고, 출력 불일치를 작업 뒤에 발견하는 것을 대상 제한으로 대신하지 않는다.

## 컨테이너 이전과 실행 이미지
- [ ] 서버를 서비스당 컨테이너로 옮길 때 프로세스 식별(PID·`/proc/<pid>/stat`의 시작 tick)에 기대는 소유권 검사가 있는지 먼저 찾는다. 컨테이너마다 PID namespace가 다르면 다음 두 가지가 일어난다.
  - 저장소 서비스가 상대 프로세스의 생존을 자기 `/proc`에서 확인하는 등록이 거절된다.
  - 새 컨테이너에서 하는 사망 증명은 옛 프로세스를 볼 수 없어 늘 통과한다. 그래서 펜싱이 아니다.
  - pidfd 신호도 호출자가 대상과 같은 PID namespace이거나 그 조상 namespace에 있어야 보낼 수 있다([pidfd_send_signal](https://man7.org/linux/man-pages/man2/pidfd_send_signal.2.html), 확인 2026-10-15).
  - 같은 PID namespace를 함께 쓰게 하는 방식([Compose `pid: "service:<name>"`](https://docs.docker.com/reference/compose-file/services/#pid))은 검사를 그대로 살리지만 상대 컨테이너의 수명에 묶이는 임시 방편이다. 사망 증명은 컨테이너 수준(그 project의 실행 중 컨테이너 없음)으로 대신 확인한다. 근본 해결은 lease·epoch 펜싱이다.
  - 컨테이너 수준 사망 증명은 겹친 호출에서도 성립해야 한다. 그래서 state별 배타 잠금(예: 고정 이름의 일회용 준비 컨테이너)을 먼저 잡고, 그 잠금 안에서 실행 중 컨테이너를 확인한다.
    - 실행 단계는 project 컨테이너가 실제로 실행된 뒤에 잠금을 놓는다. 준비 컨테이너를 지운 뒤 compose를 띄우면 그 사이 수백 ms 공백에 두 번째 호출이 검사를 통과한다.
    - 넘김 대기 중 상태 조회가 실패하면 넘김으로 보지 않는다.
    - 정리는 자기가 만든 ID만 한다. 이름으로 강제 삭제하면 동시에 실행 중인 다른 준비 작업을 죽인다.
- [ ] 서버를 컨테이너 이미지로 옮길 때는 실행 환경에 대한 가정을 함께 확인한다.
  - 비루트 사용자가 쓸 데이터 디렉터리는 이미지에 소유자·모드를 정해 두면, 처음 mount하는 빈 named volume이 그 소유자·모드를 이어받는다. [Docker volumes](https://docs.docker.com/engine/storage/volumes/)의 "Populate a volume using a container"는 마운트 위치의 내용 복사를, [moby `copyExistingContents`](https://github.com/moby/moby/blob/master/daemon/container/container_unix.go) 주석은 복사 때 소유권 설정을 설명한다(확인 2026-10-15). 대상 volume이 비어 있지 않거나 `volume-nocopy`를 쓰면 복사하지 않는다.
  - 네이티브 서비스를 [distroless](https://github.com/GoogleContainerTools/distroless) `cc` 이미지에 올릴 때 `cc`는 `static`의 CA 인증서·tzdata·root `/etc/passwd` 항목과 glibc·libssl에 libstdc++·libgcc 계열 패키지를 더한 구성이고 shell·패키지 관리자는 없다([cc README](https://github.com/GoogleContainerTools/distroless/blob/main/cc/README.md), [base README](https://github.com/GoogleContainerTools/distroless/blob/main/base/README.md), [cc/config.bzl](https://github.com/GoogleContainerTools/distroless/blob/main/cc/config.bzl), 확인 2026-10-15). 이때 다음을 함께 바꾼다.
    - 빌드 단계를 실행 이미지와 같은 배포판으로 맞춘다. 더 새 배포판에서 만든 binary는 실행 이미지에 없는 `GLIBC_`·`GLIBCXX_` 심볼 버전을 요구할 수 있다. `objdump -T`로 요구 버전을, 실행 이미지의 dpkg 상태로 libc6·libstdc++6 버전을 확인한다. 2026-10-13 관찰에서 `cc-debian13`은 glibc 2.41·GCC 14 libstdc++였다(Debian 13 trixie의 [libc6](https://packages.debian.org/trixie/libc6) 2.41과 `cc/config.bzl`의 `gcc-14-base`와 일치, 확인 2026-10-15).
    - `:latest`는 root로 실행되는 이동 태그다. `:nonroot` 같은 사용자 태그를 digest로 고정하고, 기존 volume의 소유 uid가 있으면 `USER`를 그 uid로 둔다. passwd 항목이 없어도 숫자 uid로 실행된다.
    - shell을 쓰던 healthcheck(`CMD-SHELL`)는 exec 형식의 작은 검사 binary로 바꾼다. PKI 생성·provision·migrate처럼 shell·CLI가 필요한 준비 작업은 같은 binary를 담은 별도 도구 이미지에서 실행한다. 실행 이미지 안 디버깅은 `:debug-nonroot` 태그(busybox shell)로 잠시 바꿔 한다.
    - 실제 작업에서 서비스 이미지는 약 58MB가 됐고, 같은 수락 시험(container 5개 healthy, 클라이언트 4개 통과)을 다시 통과했다. 독립 검토는 서비스가 시스템 CA·passwd·locale·shell에 기대지 않는지를 코드로 확인했다.
- [ ] Windows 호스트에서 로그온 작업과 감독 스크립트로 컨테이너 stack을 상시 실행할 때는 콘솔·작업·재시작 정책의 경계를 함께 정한다.
  - 대화형 세션의 작업이 띄운 콘솔 프로그램은 기본 터미널이 'Windows가 결정'(Windows 11)이면 Windows Terminal이 콘솔을 인수한다(`OpenConsole.exe -Embedding`). `powershell -WindowStyle Hidden`으로는 막히지 않는다. 그 창이나 탭을 닫으면 감독자와 같은 콘솔의 자식(compose 등)이 콘솔 닫기 신호로 끝나고, 작업 결과는 `0xC000013A`가 된다. `conhost.exe --headless <명령>`으로 띄우면 인수되지 않았다. 이 옵션은 문서화되지 않았으며, 2026-10-15 Windows 11 build 26300·Terminal 1.24에서 일회용 작업 두 개를 비교해 관찰한 결과다.
  - `MultipleInstances=IgnoreNew` 작업은 이전 인스턴스가 아직 실행 중이면 새로 시작하지 않는다([TaskSettings.MultipleInstances](https://learn.microsoft.com/en-us/windows/win32/taskschd/tasksettings-multipleinstances)). 감독자를 정상 종료한 직후 다시 시작할 때는 작업 상태가 `Ready`로 돌아온 뒤 시작한다. 바로 시작한 요청은 조용히 무시되어 서비스가 내려간 채로 남았다.
  - Docker `on-failure`는 0 종료나 수동 `docker stop`/`kill` 뒤에는 다시 띄우지 않고, daemon 재시작 뒤에도 띄우지 않는다([restart policies](https://docs.docker.com/engine/containers/start-containers-automatically/), 확인 2026-10-15). 감독자는 정책이 다루지 않는 상태(없음·exited·dead)만 수렴시키고 restarting은 정책에 맡긴다. 같은 문서는 restart 정책과 호스트 프로세스 관리자를 함께 쓰면 충돌한다고 경고하므로, 같은 상태를 둘이 다루지 않게 경계를 둔다.
  - Windows는 프로세스를 종료해도 그 자식을 종료하지 않는다([Terminating a Process](https://learn.microsoft.com/en-us/windows/win32/procthread/terminating-a-process)). 그래서 `docker.exe`를 끝내도 `docker-compose.exe` plugin이 남을 수 있다. 감독자는 PID나 명령줄 이름으로 프로세스를 끝내지 않는다(PID 재사용·다른 소유자의 compose와 경합). compose 대기는 `--wait-timeout`으로 제한하고, 남은 compose 프로세스나 실패한 프로세스 목록 조회는 충돌로 보아 잠금을 유지한다(fail closed). 직접 띄운 프로세스만 그 handle로 끝낸다.

## 소유권 펜싱과 장애 반응
- [ ] 길드·캐릭터처럼 ID로 부르는 엔티티를 여러 서버에 나눠 단일 작성자로 처리하는 엔티티 샤딩(위치 투명성)에서 배치 관리자가 이중 소유를 피하는 방식과 영속 쓰기의 펜싱을 따로 정한다. [Shardcake](https://devsisters.github.io/shardcake/docs/architecture.html)는 응답 없는 pod를 Kubernetes Health API로 "살아 있지 않음"이 확인될 때만 shard에서 해제하며, 엔티티 영속은 사용자에게 맡긴다. 네트워크 분리·긴 정지 뒤 옛 작성자의 늦은 쓰기를 막으려면 배정마다 단조 증가 epoch를 발급하고, 모든 쓰기를 권위 배정 행을 잠근 같은 DB 트랜잭션에서 epoch로 검사한다. 데이터 revision CAS는 버전 충돌만 잡을 뿐 쓰기 권한을 회수하지 않으므로 epoch 검사의 대체가 아니다. 내구 로그를 없애고 DB에 바로 쓰는 구조라면 현재 소유자·이전 영수증 같은 소유권 전이도 확인 응답 전에 DB에 원자적으로 기록해야 재배정 뒤 복구할 수 있다. 엔티티 ID가 없는 요청(세션 ID만 가진 재접속 등)의 라우팅도 따로 정한다.
  - 소유권 **획득 요청 자체**도 펜싱한다. 대체된 incarnation의 최근 N개 목록은 N회를 넘겨 교체하면 옛 요청을 다시 허용하므로 무기한 펜싱이 아니다. 논리 요청의 재시도 기한도 정지했던 물리 요청의 수명이나 교체 횟수를 제한하지 않는다. 획득 전에 관측한 epoch E를 그 논리 요청에 고정하고 E→E+1 조건부 갱신을 사용한다. 결과 불명·CAS 충돌 뒤에도 같은 E로 판정하며, 같은 획득 신원과 정확한 목표 epoch의 재생만 성공으로 인정한다. 재시도에서 새 E를 자동 관측하면 옛 요청이 새 소유자를 다시 대체할 수 있다.
  - 응답을 받았다는 것과 영속 소유권 해제가 끝났다는 것을 구분한다. 해제 거절은 소유권 상실의 증거가 아니며, 시도 횟수만으로 격리된 엔티티·해결 기록을 버리면 저장소에는 주인만 남을 수 있다. 해제 성공 또는 권위 저장소가 확인한 소유 상실 뒤에만 로컬 정산을 끝낸다. 확정된 버전 거절을 보정할 때는 같은 소유 신원과 더 큰 권위 revision을 확인하고, 요청 의미가 바뀌면 새 멱등 키를 쓰며, 결과 불명인 요청의 key·의미는 바꾸지 않는다.
- [ ] 의존 서비스의 생존 확인(heartbeat)은 감지이고, 상실 뒤 프로세스 종료·재연결·영향 범위 격리는 별도 정책이다. 서비스 분리 구조로 가려면 감지는 유지하고 반응을 해당 요청·엔티티의 보류/거절과 재연결로 바꾸며, 링크의 실패 상태 초기화·제출된 요청의 해결·늦은 응답 차단까지 함께 설계한다. 종료 호출만 지우면 남은 실패 분기나 회수되지 않는 슬롯이 생긴다.

## 근거와 적용 한계
- 서비스 링크 생존 확인의 수치는 각 라이브러리·프레임워크의 소스·공식 문서에서 2026-10-11에 확인한 기본값이며 권장값이 아니다. LiteNetLib·ENet·kcp2k·yojimbo·Valve GNS·Akka·Erlang·Orleans·Linux TCP keepalive·TrinityCore 값은 2026-10-12에 소스·공식 문서로 다시 확인했고, RakNet 값(10s·Debug 30s)은 2026-10-15에 보관소의 [`ReliabilityLayer.cpp`](https://github.com/facebookarchive/RakNet/blob/master/Source/ReliabilityLayer.cpp) `timeoutTime` 초기값으로 확인했다. TrinityCore는 WoW 서버의 비공식 에뮬레이터라 그 설정값은 Blizzard의 실제 값이 아니다. FFXIV·WoW·EVE의 공식 공개 자료([FFXIV Lodestone 네트워크 안내](https://na.finalfantasyxiv.com/lodestone/topics/detail/82254b55f875f3c3fb85b2c578a14f5c38a5cba1), [GDC 2013 WoW JAM](https://media.gdcvault.com/gdc2013/slides/822575Rumsey_Joe_Network_Serialization_and%20(1).pdf), [EVE Tranquility Tech IV](https://www.eveonline.com/news/view/tranquility-tech-iv))는 서버 간 메시지 라우팅·PROXY/SOL 분리 같은 구조를 다루며 내부 링크의 생존 확인 값은 밝히지 않는다.


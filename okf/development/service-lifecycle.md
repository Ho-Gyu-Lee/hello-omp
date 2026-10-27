---
type: Checklist
title: 서비스 영속성·생존 감시·프로세스와 소유권 수명
description: 내구 확인·grpc-go 종료 계약, identity 결속 이전, 생존 감시와 장애 반응, pidfd·컨테이너·Windows 감독의 확인된 함정, 소유권 fencing의 기준과, 대규모 상태·부하 서비스 운영 설계의 참조 사례(DeepSeek 추론 배포 Q&A)입니다.
tags: [development, server, persistence, heartbeat, process, pidfd, container, fencing, lifecycle]
timestamp: 2026-10-27T00:00:00Z
---

# 서비스 영속성·생존 감시·프로세스와 소유권 수명

상태를 가진 서비스가 해당 운영 구조를 선택했을 때의 기준이며 특정 샤딩·감독자·컨테이너 도입을 요구하지 않는다. 구조 선택(MSA·단일 로직 스레드 등)은 [개발 방향](/direction.md), 게임의 결과 공개·존 이전은 [게임 서버 영속화](/game/server-persistence.md), 멱등 영수증 SQL은 [DB 설계](/database/design.md)를 따른다.

## 내구 확인과 종료 계약
- [ ] 응답·복제 확인·디스크 내구 확인은 다르다. NATS JetStream R3의 PubAck는 과반 복제 뒤에 오지만 fsync는 `sync_interval` 기본 2분 주기라서, 그 창 안에 여러 노드에 OS 장애가 나면 확인된 쓰기도 잃을 수 있다. `sync_interval: always`는 이 창을 닫지만 쓰기 지연·처리량을 대가로 치른다([Surviving node loss](https://docs.nats.io/learn/jetstream/surviving-node-loss), [Replication and R=3](https://docs.nats.io/learn/clustering/replication-and-r3), 확인 2026-10-12).
- [ ] grpc-go의 `GracefulStop`은 진행 중인 RPC가 모두 끝날 때까지 기다리고 `Serve`는 `Stop`·`GracefulStop` 호출 뒤 종료가 끝날 때까지 반환하지 않는다([v1.84.0 `server.go`](https://github.com/grpc/grpc-go/blob/v1.84.0/server.go), 확인 2026-10-15). 상대가 먼저 닫지 않는 양방향 스트림을 유지하는 서버가 `Serve` 반환 뒤 코드에 구독 해제·리소스 축소 같은 종료 정리를 맡기면 강제 종료 전까지 실행되지 않는다. 종료 소유자 한 곳에서 신규 유입 차단 → 기한 있는 `GracefulStop` → 기한 초과 시 `Stop` → 정리 순서로 진행하고, 주기 작업은 sleep 대신 취소 신호를 함께 기다린다.

## Identity에 결속된 데이터 이동
- [ ] 내구 저장소가 콘텐츠 identity(카탈로그·맵 바이트의 digest 등)에 결속돼 있으면 표시 전용 필드·리소스 경로 문자열·재게시·데이터 이동처럼 무관해 보이는 변경도 identity를 바꿔 기존 DB를 열 수 없게 만든다. 변경 전에 식별 입력을 코드로 확인하고, 이전 identity와 일치하는 데이터셋(credential·provision digest 포함)을 복구용으로 보존한다. 데이터 파일은 줄바꿈 변환 없이 바이트 그대로 옮기고 같은 binary로 계산한 identity가 이전 값과 같을 때만 기존 DB를 쓴다. 불일치는 검사 우회·자동 reset으로 감추지 않고 사용자 결정(백업 후 새 DB·명시적 재결속)으로 드러내며, metadata 없는 비어 있지 않은 DB는 fail-closed로 거부한다.

## 서비스 링크·장애 격리
- [ ] 감지와 반응을 분리한다. 링크 생존 확인(heartbeat)은 감지이고 상실 뒤 프로세스 종료·재연결·영향 범위 격리는 별도 정책이다. 링크 하나의 상실은 그 지역·요청·엔티티의 장애로 한정해 묶인 모든 연관(보류 중인 이전 commit, 로그아웃 대기 등)을 정리하고 다른 지역의 큐·슬롯 불변조건을 유지한다. 재연결은 유한 backoff 뒤 새 handshake(서버 identity·incarnation) 검증을 거쳐서만 라우팅하고, 이전 연결은 종료 event까지 퇴역 상태로 둬 늦은 frame을 막는다. 종료 호출만 지우면 남은 실패 분기와 회수되지 않는 슬롯이 생기므로 실패 상태 초기화·제출된 요청의 해결·늦은 응답 차단까지 함께 설계한다.
- [ ] 응답 위치가 감지 대상을 정한다. 소켓/I/O 계층 응답은 프로세스·네트워크 생존만, 로직 loop 응답은 로직 정지(저장소 서비스의 동기 commit·디스크 정지 포함)까지 잡는다. 생존 증거는 PONG만이 아니라 소유 검증(연결 ID·세대)을 통과한 그 연결의 어떤 frame이든 센다. PONG 전용 판정은 큰 메시지 뒤에 밀린 PONG을 침묵으로 오판한다([ZeroMQ `ZMQ_HEARTBEAT_TIMEOUT`](https://github.com/zeromq/libzmq/blob/master/doc/zmq_setsockopt.adoc)·[Erlang tick](https://www.erlang.org/doc/apps/kernel/kernel_app.html)도 모든 트래픽을 센다, 확인 2026-10-12). 재접속이 이전 연결의 종료보다 먼저 올 수 있으므로 최신 연결만 신뢰한다. 소비해야 다음 frame을 읽는 구조에서는 멈췄다 깨어난 프로세스에게 모든 peer가 동시에 침묵한 것처럼 보이므로 그 pass의 수신 event를 먼저 소비한 뒤 판정한다([Orleans](https://github.com/dotnet/docs/blob/main/docs/orleans/implementation/cluster-management.md)). 만료가 되돌릴 수 없는 fail-stop이면 짧은 기한이 디스크 정지 같은 정상 지연도 장애로 바꾸므로 결정자에게 드러내고 기존 요청 기한과의 관계를 적는다.

## 프로세스 인스턴스와 보호된 이전
- [ ] 종료 대상(테스트 harness·이전 도구가 띄운 프로세스)은 재사용 가능한 PID가 아니라 프로세스 인스턴스에 결박한다. PID·시작 시각을 확인한 뒤 별도 `kill`을 호출해도 검사와 신호 사이의 재사용 경합이 남는다. Linux [pidfd 신호](https://man7.org/linux/man-pages/man2/pidfd_send_signal.2.html)는 확보한 인스턴스를 가리키며 회수된 뒤에는 `ESRCH`로 실패한다(확인 2026-10-15).
  - 직접 `fork`한 자식은 부모가 pidfd를 확보한 뒤에만 작업을 실행하게 한다. 미회수 좀비는 PID가 재사용되지 않지만 `SIGCHLD=SIG_IGN`·`SA_NOCLDWAIT`·다른 회수 경로(다른 스레드의 `wait`, 비동기 시그널 핸들러)가 하나라도 있으면 이 보장이 깨지므로([pidfd_open](https://man7.org/linux/man-pages/man2/pidfd_open.2.html)) 그 경우 `clone`의 `CLONE_PIDFD`로 자식과 pidfd를 함께 만든다(man-pages 6.19, 확인 2026-10-15).
  - 기존 프로세스를 나중에 포착할 때 `/proc`의 [starttime은 clock tick 단위](https://man7.org/linux/man-pages/man5/proc_pid_stat.5.html)라 고유 실행 세대가 아니다. 자기 launch의 제어 채널에서 얻은 새 세대 식별·실제 부모 관계 같은 독립된 근거로 검증하고 발견한 대상의 값을 기대값으로 다시 채택하지 않는다. 협력하는 도구의 동일성 계약이지 악성 동일 UID 프로세스에 대한 샌드박스가 아니다.
- [ ] 검토·승인 뒤 실행하는 영속 데이터 이전 작업은 검토한 입력을 실행별 불변 manifest로 고정하고 검토 근거에 manifest 해시를 포함한다. 확인된 공유 설정 파일을 하위 helper가 다시 읽게 두면 검토 대기 중 바뀐 다른 DB·원본·namespace를 건드릴 수 있다.

## 컨테이너 이전과 실행 이미지
- [ ] 서비스당 컨테이너로 옮기면 PID namespace가 달라져 PID·`/proc/<pid>/stat` 시작 tick에 기대는 소유권 검사가 깨진다. 상대 생존을 자기 `/proc`에서 확인하는 등록은 거절되고, 새 컨테이너의 사망 증명은 옛 프로세스를 볼 수 없어 늘 통과하므로 펜싱이 아니다. pidfd 신호도 호출자가 대상과 같은 PID namespace이거나 조상 namespace에 있어야 한다([pidfd_send_signal](https://man7.org/linux/man-pages/man2/pidfd_send_signal.2.html), 확인 2026-10-15). [Compose `pid: "service:<name>"`](https://docs.docker.com/reference/compose-file/services/#pid) 공유는 상대 컨테이너의 수명에 묶이는 임시 방편이고, 컨테이너 수준 사망 증명(그 project의 실행 중 컨테이너 없음)은 확인부터 실행 인계까지 배타성을 끊지 않아야 한다. 근본 해결은 lease·epoch 펜싱이다.
- [ ] 비루트 사용자용 데이터 디렉터리의 소유자·모드를 이미지에 정해 두면 처음 mount하는 빈 named volume이 그것을 이어받는다. 대상 volume이 비어 있지 않거나 `volume-nocopy`면 복사하지 않는다([Docker volumes](https://docs.docker.com/engine/storage/volumes/), [moby `copyExistingContents`](https://github.com/moby/moby/blob/master/daemon/container/container_unix.go), 확인 2026-10-15).
- [ ] `docker volume prune --all`은 컨테이너가 참조하지 않는 이름 있는 volume까지 지운다([docker volume prune](https://docs.docker.com/reference/cli/docker/volume/prune/), 확인 2026-10-18). 준비 작업 때만 mount하는 volume(예: 내부 CA 개인키)은 평소 참조가 없어 정리 한 번에 유일한 사본이 사라지고 label은 보호 장치가 아니다. 판정 기준은 실행 여부가 아니라 참조이므로 `docker stop`한 컨테이너는 참조를 유지하지만 `compose down`처럼 제거하면 서비스 volume도 대상이 된다.

## Windows 호스트의 상시 감독
- [ ] 대화형 세션의 작업이 띄운 콘솔 프로그램은 기본 터미널이 'Windows가 결정'(Windows 11)이면 Windows Terminal이 콘솔을 인수한다(`OpenConsole.exe -Embedding`). `powershell -WindowStyle Hidden`으로 막히지 않고, 그 창·탭을 닫으면 같은 콘솔의 자식(compose 등)이 콘솔 닫기 신호로 끝나 작업 결과가 `0xC000013A`가 된다. `conhost.exe --headless <명령>`으로 띄우면 인수되지 않았다. 이 옵션은 문서화되지 않았으며 2026-10-15 Windows 11 build 26300·Terminal 1.24에서 일회용 작업 두 개를 비교해 관찰했다.
- [ ] `MultipleInstances=IgnoreNew` 작업은 이전 인스턴스가 실행 중이면 새로 시작하지 않는다([TaskSettings.MultipleInstances](https://learn.microsoft.com/en-us/windows/win32/taskschd/tasksettings-multipleinstances)). 감독자를 정상 종료한 직후 다시 시작하는 요청은 조용히 무시되어 서비스가 내려간 채 남으므로 작업 상태가 `Ready`로 돌아온 뒤 시작한다.
- [ ] Docker `on-failure`는 0 종료·수동 `docker stop`/`kill`·daemon 재시작 뒤에는 다시 띄우지 않으며 restart 정책과 호스트 프로세스 관리자를 함께 쓰면 충돌한다([restart policies](https://docs.docker.com/engine/containers/start-containers-automatically/), 확인 2026-10-15). 감독자는 정책이 다루지 않는 상태(없음·exited·dead)만 수렴시키고 restarting은 정책에 맡긴다.
- [ ] Windows는 프로세스를 종료해도 자식을 종료하지 않아 `docker.exe`를 끝내도 `docker-compose.exe` plugin이 남을 수 있다([Terminating a Process](https://learn.microsoft.com/en-us/windows/win32/procthread/terminating-a-process)). 감독자는 PID·명령줄 이름으로 프로세스를 끝내지 않고(PID 재사용·다른 소유자의 compose와 경합) 직접 띄운 프로세스만 그 handle로 끝낸다. compose 대기는 `--wait-timeout`으로 제한하고 남은 compose 프로세스나 실패한 목록 조회는 충돌로 보아 잠금을 유지한다(fail closed).

## 소유권 펜싱과 장애 반응
- [ ] 엔티티 샤딩에서 배치 관리자의 이중 소유 회피와 영속 쓰기의 펜싱은 따로 정한다([Shardcake](https://devsisters.github.io/shardcake/docs/architecture.html)는 엔티티 영속을 사용자에게 맡긴다). 옛 작성자의 늦은 쓰기는 배정마다 단조 증가 epoch를 발급하고 권위 저장소가 쓰기와 원자적으로 epoch를 검사해 막는다(예: 배정 행을 잠근 같은 DB 트랜잭션). 데이터 revision CAS는 버전 충돌만 잡을 뿐 쓰기 권한을 회수하지 않는다. 내구 로그 없이 DB에 바로 쓰는 구조라면 소유권 전이(현재 소유자·이전 영수증)도 확인 응답 전에 원자적으로 기록한다.
- [ ] 소유권 획득 요청 자체도 펜싱한다. 획득 전에 관측한 epoch E를 그 논리 요청에 고정하고 E→E+1 조건부 갱신을 쓰며 결과 불명·CAS 충돌 뒤에도 같은 E로 판정한다(재시도에서 새 E를 관측하면 옛 요청이 새 소유자를 대체할 수 있다). 대체된 incarnation의 최근 N개 목록은 N회를 넘겨 교체하면 옛 요청을 다시 허용하므로 무기한 펜싱이 아니다. 해제 응답 수신과 영속 소유권 해제 완료는 다르고, 해제 거절은 소유권 상실의 증거가 아니며, 결과 불명 요청의 key·의미는 바꾸지 않는다.
- [ ] 한 프로세스가 여러 키의 임대(lease)를 갱신 쓰기 하나씩 직렬 처리하면 마지막 키의 갱신 지연은 "키 수 × 저장소 쓰기 지연"이고, 이 값이 허용 시간(TTL − 안전 여유 − 갱신 주기)을 넘으면 뒤쪽 키부터 만료돼 스스로 fence된다. 쓰기 지연이 튀는 구간(매 쓰기 fsync, 공유 인프라의 동시 부하)으로 계산하고 갱신을 파이프라인·병렬·일괄로 보내거나 마감이 가까운 순서로 처리한다.

## 참조 사례와 적용 한계
- [DeepSeek V4.1 Flash 추론 배포 Q&A](https://github.com/deepseek-ai/DeepInfer/blob/main/doc/inference_deployment_qa.md)(확인 2026-10-21, 문서가 계속 갱신된다고 명시)는 요청 처리 상태(KV cache: 진행 중 요청의 상태와 요청 사이에 재사용하는 prefix 캐시)를 가진 대규모 서비스의 부하 분산·상태 저장소·종료 이관·오토스케일·장애 대응을 운영 수치와 함께 공개한 사례다. 설계할 때 대조할 결정은 다음과 같다.
  - 부하를 요청 수로 재지 않는다. prefill은 2차 비용 모델(이번 토큰 수·이미 계산한 prefix 길이)이 예측한 시간 quota로 부하를 재고, 컨텍스트 길이 버킷별 엔진 수를 직전 라운드의 버킷별 quota 수요 비중으로 재배분하며, 스텝마다 남은 시간 예산을 채우는 청크 크기를 푼다. decode는 요청 수(배치 크기)와 총 KV 길이(어텐션 비용)라는 두 축을 함께 맞춘다.
  - block KV cache를 연산 노드와 분리된 전용 저장 클러스터에 둬 어느 prefill 노드든 같은 prefix에 닿게 했다. prefix affinity 라우팅과 부하 분산의 충돌이 사라지고, 저장소를 연산과 따로 확장하며, 저장 노드보다 장애율이 10배 이상 높은 연산 노드가 죽어도 block KV cache는 남는다. 작은 SWA KV cache는 만든 머신의 메모리에 한 벌만 두고 위치 디렉터리로 원격에서 가져오며, 없으면 재계산한다.
  - 종료 통지를 받은 decode 엔진은 1분 유예 뒤 남은 요청을 KV째 다른 엔진으로 한 번에 넘긴다(대규모 EP 배포에서 긴 꼬리 요청이 자원을 붙잡는 낭비 대책). 트래픽 변동을 흡수할 여유를 남기려고 scale-out용 대기 머신을 풀에 두고, quota 사용률이 0.8을 넘으면 scale-in을 막는다. 장애 내성은 분 단위인 재시작의 단축이 아니라 여유 quota와 요청 단위 재라우팅으로 얻는다.
- DeepSeek의 자체 발표이고, 인용한 부하 분산·KV cache 관리 구성 요소는 내부 인프라와 결합돼 코드가 아직 전부 공개되지 않았다(원문 명시, 설계는 Zhihu 글로 공개). 공유 저장소의 block KV cache는 prefix 해시로 찾고 덮어쓰지 않으며 잃으면 재계산(prefill)으로 복구되는 캐시라서 어느 노드가 읽어도 작성자 경합이 없고, 유실은 정확성이 아니라 적중률만 떨어뜨린다. 변경되는 권위 상태의 affinity 제거·내구·이전 설계 근거로 쓰지 않으며, 그 기준은 위 「내구 확인과 종료 계약」·「소유권 펜싱과 장애 반응」과 [게임 서버 영속화](/game/server-persistence.md)다. 버킷 경계·유예 시간·0.8 같은 수치는 그 모델·하드웨어·트래픽에 맞춘 설정값이므로 기본값으로 복제하지 않는다.

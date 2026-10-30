---
type: Checklist
title: 서버 프로토콜·메모리·큐 운영 기준
description: 비동기 완료의 상태 소유자 적용, 공유 상수·메시지 ID·codec 경계, 큐 소비 장벽의 처리율 상한, Mirror·Asio·OpenSSL·RabbitMQ의 버전별 함정을 다룹니다.
tags: [development, server, concurrency, memory, codec, queue]
timestamp: 2026-10-29T00:00:00Z
---

# 서버 프로토콜·메모리·큐 운영 기준

특정 동시성 구조를 강제하지 않는다. 구조 선택(단일 로직 스레드·멀티스레드·샤드·액터)은 [개발 방향](/direction.md), 게임 권위·AOI는 [게임 서버 체크리스트](/game/server-checklist.md)를 따른다.

## 프로토콜과 비동기 수명
- [ ] 비동기 완료(I/O·DB 콜백)와 연결 이벤트(끊김 포함)는 선택한 상태 소유자(단일 로직 스레드·샤드·액터 등)의 처리 순서에서 적용한다. 대기 전후에 다른 명령이 끼어들 수 있으므로 요청 ID·세션/객체 generation·상태 버전을 확인해 역순 완료, 로그아웃 뒤 완료, 이동한 객체의 낡은 결과를 차단한다. 엔티티 generation과 상태 실행 세대는 별개이므로 상태 한정 타이머·완료는 진입 세대도 확인한다([상태 기계·탐색](/development/ai-navigation.md)). 예: 네트워크 스레드가 끊김을 감지해도 소유자가 아직 처리하지 않은 수신 메시지가 남아 있으므로 세션 초기화는 같은 수신 큐에 종료 표시로 넣어 순서대로 처리한다. 다음 접속에서야 올라가는 generation은 재접속 대기 중 처리되는 이전 연결 메시지를 막지 못한다.
- [ ] 서버·클라이언트가 공유하는 고정 상한(예: 캐릭터당 동시 상태 수)을 바꾸면 wire·서비스 간 이전 이미지·검증 상한·내구 저장 형식 각각의 호환성을 판정한다. 개수 기반 배열은 바이트가 같아도 고정 길이로 채우는 보조 배열은 바뀔 수 있다. golden/고정 바이트 테스트로 실제 변화를 확인하고 바뀌면 프로토콜 버전을 올려 서버와 클라이언트를 함께 배포한다.
- [ ] Mirror(고정 revision `c4f3739`)는 메시지 ID를 타입명·메서드 시그니처의 16-bit hash로 정하고, 충돌하면 경고만 남기고 handler를 교체해 다른 처리로 조용히 분기한다. 이름을 바꾸면 wire ID가 바뀌고 다른 언어(GDScript·C++)에서 재현하기도 어렵다. ID는 공유 스키마에서 명시 할당하고 중복을 등록 단계에서 실패로 처리한다([`NetworkServer.cs`](https://github.com/MirrorNetworking/Mirror/blob/c4f3739966e151f405be1762d33502794fd034ff/Assets/Mirror/Core/NetworkServer.cs), 조회 2026-10-11).

## 큐·입장·처리 예산
- [ ] 연결마다 frame 하나를 application이 소비해야 다음 frame을 읽는 transport(소비 시점에 수신 정책을 바꾸는 장벽)에서는 처리율이 '루프당 소비 frame 수 ÷ 루프 주기'로 제한된다. 빈 event 뒤의 고정 sleep(1ms면 초당 약 900개 미만)이나 완결 frame이 남았는데 새 수신 통지를 기다리는 구조는 고주기 입력이 한계를 넘는 순간 지연을 끝없이 쌓는다. event 발행 시 깨우는 bounded wait를 쓰고 peek한 event는 반드시 소비한다. 클라이언트 쪽 상한은 [클라이언트 체크리스트](/game/client-checklist.md)의 수신 처리율 항목, 입력 시간 예산은 [시간·이동 검증](/game/network-time-movement.md)의 「이동 속도·시간 예산 검증」이 정본이다.
- [ ] `accept` 실패 중 일시 네트워크 오류(pending network errors)와 `EMFILE`/`ENFILE`/`ENOBUFS`/`ENOMEM` 자원 고갈은 구분해 처리하고 이미 성립한 연결을 닫지 않는다([accept(2)](https://man7.org/linux/man-pages/man2/accept.2.html)).
- [ ] RabbitMQ 4.3.0부터 Khepri가 유일한 메타데이터 저장소이고, transient non-exclusive 큐·`global_qos`·`x-queue-mode`(CQv1) 선언이 기본 거부된다. 4.4.x로의 롤링 업그레이드는 4.2.x·4.3.x에서만 지원되며 그 전에 모든 stable feature flag를 켜고, 업그레이드 뒤 새 flag를 `rabbitmqctl enable_feature_flag all`로 켠다. 4.4.0은 classic queue 메시지 저장 파일을 v2(`.sqs`)로 쓰기 시작하면 4.3 이하로 내릴 수 없으므로 롤백은 업그레이드 직전 데이터 디렉터리 사본으로만 한다. `definitions.local.path` 부트 가져오기는 기본값(`skip_if_unchanged=false`)에서 기동마다 실행되어 기존 사용자의 해시·태그·권한을 파일 내용으로 덮어쓴다([4.3.0](https://github.com/rabbitmq/rabbitmq-server/releases/tag/v4.3.0)·[4.4.0](https://github.com/rabbitmq/rabbitmq-server/releases/tag/v4.4.0) 릴리스 노트, [업그레이드 경로](https://www.rabbitmq.com/docs/upgrade), `rabbit_definitions.erl` v4.4.0, 확인 2026-10-29).

## 상시 운영 메모리와 계측
- [ ] 무할당·총량 제한 주장은 초기화·접속/TLS 수립·정상 메시지·오류/종료 단계의 모든 소비 경로(queue node·문자열·JSON·codec parser 상태·비동기 operation·TLS 내부)를 계측한 결과로만 한다. 풀의 존재나 `reserve`는 증거가 아니다. 풀 고갈의 heap fallback과 반환 블록 보관량도 상한을 갖고, 저장소 수명은 callback 취소 요청이 아니라 마지막 사용과 deallocate까지 유지한다. 측정 범위는 [측정과 검증의 범위](/development/runtime-diagnostics.md#측정과-검증의-범위)를 따른다.
- [ ] 완결된 단위(datagram, 길이로 잘린 frame) 안의 내부 길이가 남은 바이트를 넘거나 정수 변환에서 넘치면 "데이터 부족 대기"가 아니라 프로토콜 오류로 즉시 연결을 끊는다. 대기로 처리하면 그 연결의 수신 큐가 영구 정지하고 이후 batch가 무제한 쌓인다. 부족 대기는 stream 재조립 경계에만 상한과 함께 둔다. 컬렉션은 `개수 × 요소의 최소 wire 크기 ≤ 남은 바이트`와 메시지별 의미 상한을 할당 전에 판정한다. Mirror는 이 경우 큐를 비우고 예외로 끊도록 고쳤으므로 fork는 upstream 보안 수정 반영 여부를 대조하고, 고정 소스의 `AllocationLimit`은 요소 수 기준이다([`Unbatcher.cs`](https://github.com/MirrorNetworking/Mirror/blob/c4f3739966e151f405be1762d33502794fd034ff/Assets/Mirror/Core/Batching/Unbatcher.cs), 조회 2026-10-11).
- [ ] `SSL_MODE_RELEASE_BUFFERS`는 유휴 TLS buffer 반납(반복 할당)과 연결별 상주 메모리의 교환이다. 전송 wrapper가 실제 설정하는 값을 확인한다([OpenSSL mode 문서](https://docs.openssl.org/4.0/man3/SSL_CTX_set_mode/), 확인 2026-10-15).
- [ ] Asio의 [associated allocator](https://think-async.com/Asio/asio-1.38.2/doc/asio/overview/core/allocation.html)가 [즉시 완료](https://think-async.com/Asio/asio-1.38.2/doc/asio/overview/composition/immediate_completion.html)·composed operation·executor 전달에서도 보존되는지 고정 소스로 확인한다. type erasure가 모든 allocator property를 전달한다고 가정하지 않는다(1.38.2 문서, 확인 2026-10-15).
- [ ] `operator new`만 세면 `malloc`·`aligned_alloc`·TLS C 할당을 놓친다. Asio 1.32/Linux에서 캐시를 끄면 `ASIO_DISABLE_STD_ALIGNED_ALLOC`까지 적용해야 기본 경로가 계측한 `operator new`로 이어지며, 캐시 비활성 분기의 [upstream 수정](https://github.com/chriskohlhoff/asio/commit/57bf938c7dc1f6ea1e224fb74e274e397edebcd1)은 1.32.0 태그에는 없고 1.34.0 태그부터 포함된다(확인 2026-10-12). 낮은 버전은 재현 가능한 의존성 패치로 관리하고 설치 헤더를 직접 고치지 않는다.

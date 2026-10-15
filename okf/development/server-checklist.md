---
type: Checklist
title: 서버 프로토콜·메모리·큐 운영 기준
description: 일반 서버의 동시성·비동기 수명, 프로토콜 등록/폭·codec 수락, allocator/메모리 계측, 큐 공정성·accept 고갈과 통합 검증을 다룹니다.
tags: [development, server, concurrency, memory, codec, queue, performance]
timestamp: 2026-10-15T00:00:00Z
---

# 서버 프로토콜·메모리·큐 운영 기준

웹·앱·게임 서버에 공통인 소유권·I/O·자원·성능 계약입니다. 특정 Gateway/단일 로직 구조를 모든 서비스에 강제하지 않습니다. 본문의 세션/엔티티·tick·Mirror/Asio/OpenSSL 사례는 해당 구조/API·버전에서의 조건과 관찰 범위를 보존합니다. 게임 권위·AOI·복제 부하는 [게임 서버 체크리스트](/game/server-checklist.md)에 남깁니다.

## 기본 운영·검증
- [ ] 메모리: 힙 할당 최소화·풀링(GC 일시정지·틱 흔들림 회피)
- [ ] 동시성: 정확성·객체 수명·진행 보장을 우선하고 경합 측정 후 락 축소·샤딩·lock-free를 선택. 다중 필드·교차 shard 불변조건과 트랜잭션 경계·데드락/기아·메모리 회수를 검증([코딩 스타일](/coding-style.md))
- [ ] 네트워크: 버퍼 재사용·직렬화 비용 고려·비동기 I/O

- [ ] 검증: 결정적 알고리즘 테스트와 codec·검증·dispatch를 지나는 통합 테스트, 손실·역순·재접속·장시간 누적 시나리오 보유
## 프로토콜과 비동기 수명
- [ ] 서버·클라이언트가 공유하는 고정 상한(예: 캐릭터당 동시 상태 수)을 바꾸면 wire 호환성부터 판정한다. 개수 기반 배열은 바이트가 같아도 고정 길이로 채우는 보조 배열·서비스 간 이전 이미지·검증 상한은 바뀔 수 있다. golden/고정 바이트 테스트로 실제 변화를 확인하고, 바뀌면 프로토콜 버전을 올려 서버와 클라이언트를 함께 배포한다. 내구 저장 형식·콘텐츠 identity 영향은 따로 확인하고, 메모리 예산 단언과 상한을 채운 검사를 같은 변경에 포함한다.
- [ ] 메시지·RPC 식별자는 공유 스키마에서 명시적으로 할당하고 중복을 생성·등록 단계에서 실패로 처리한다. 타입명·메서드 시그니처의 16-bit hash는 다른 언어(GDScript·C++)에서 재현하기 어렵고, 이름을 바꾸면 wire ID가 바뀌며, 충돌하면 경고만 남기고 handler를 교체해 다른 처리로 조용히 분기할 수 있다([Mirror `RegisterHandler`](https://github.com/MirrorNetworking/Mirror/blob/c4f3739966e151f405be1762d33502794fd034ff/Assets/Mirror/Core/NetworkServer.cs), 조회 2026-10-11).
- [ ] dirty mask 같은 고정 폭 bitmask는 shift 피연산자를 mask 폭 타입으로 만들고 선언한 개수 상한을 등록 시 거부로 강제한다. C/C++에서 승격된 왼쪽 피연산자 폭 이상의 shift는 정의되지 않은 동작이고, C#은 shift 수를 폭으로 나눈 나머지로 처리해 다른 bit를 가리킨다. 31/32번째·63/64번째 경계를 테스트한다.

- [ ] I/O 콜백은 큐에 완료 결과를 넣고 로직 스레드가 적용한다. 요청 ID·세션/객체 generation·상태 버전을 확인해 역순 DB 완료, 로그아웃 후 완료, 다른 존으로 이동한 객체의 낡은 결과를 차단한다.
- [ ] 비동기 작업에는 불변 snapshot이나 수명이 보장된 메시지를 전달한다. 작업자가 변경 중인 월드 객체를 읽게 하지 않는다. 풀링 버퍼는 모든 소비자의 사용 종료 전에 재사용하지 않는다.
## 큐·입장·처리 예산
- [ ] 수신·명령·DB 완료·송신 큐에 메시지 수와 바이트 상한을 둔다. 큐 깊이뿐 아니라 가장 오래된 메시지의 대기, 유입/소비율, 세션별 점유·공정성, 거부/대체/연결 종료를 관측한다.
- [ ] `accept`의 descriptor/메모리 부족과 일시 네트워크 오류 때문에 이미 성립한 연결까지 종료하지 않는다. 소유자에 한 개의 유한 재시도 대기를 두어 busy loop를 막고 종료 때 취소한다. 시작 시 연결 상한에 reactor·로그·수용/거절용 FD 여유를 더해 OS soft limit을 확인하며, 실행 중 한도 변화·고갈 뒤 복구도 검사한다. 근거: [Linux accept(2)](https://man7.org/linux/man-pages/man2/accept.2.html)의 pending network errors와 EMFILE/ENFILE/ENOBUFS/ENOMEM 구분.
- [ ] 큐가 빌 때까지 무제한으로 처리하지 않는다. 틱의 입력/완료 소비 예산과 과부하 정책을 정해 입력 폭주가 이동·AI·다른 세션을 굶기지 않게 한다. 클라이언트가 요청한 입력 시간의 누적도 서버가 허용한 시뮬레이션 시간 안으로 제한한다(시간 예산의 정본: [시간·이동 검증](/game/network-time-movement.md)의 「이동 속도·시간 예산 검증」).
- [ ] 연결마다 frame 하나를 application이 소비해야 다음 frame을 읽는 transport(소비 시점에 수신 정책을 바꾸는 장벽)라면, 서비스 loop가 빈 event 뒤에 고정 sleep하지 않게 한다. 여러 세션이 공유하는 내부 연결(Gateway→World 등)이 loop 반복당 frame 하나로 묶여, 1ms sleep이면 1초 약 900개 미만이라는 상한이 생긴다. 고주기 입력이 이를 넘으면 지연이 끝없이 쌓인다. event 발행 시 깨우는 bounded wait로 바꾸고, 소비하지 않은 event가 남아 있으면 즉시 반환되므로 peek한 event는 반드시 소비한다. 실제 사례에서 32명 이상의 30Hz 입력이 8.5초씩 밀렸고, event 대기로 바꾼 뒤 64명에서 미확인 입력이 6 이하로 유지됐다. 같은 transport의 클라이언트 쪽 상한은 [클라이언트 체크리스트](/game/client-checklist.md)의 메인 스레드 수신 처리율 항목이 다룬다.

## 상시 운영 메모리와 계측

- [ ] 초기화·접속/TLS 수립·정상 메시지·오류/종료의 할당을 분리한다. packet buffer 외에도 queue node·문자열·JSON·codec parser 상태·비동기 operation·TLS 내부를 포함한다. 풀의 존재나 `reserve`를 무할당·총량 제한의 증거로 삼지 않는다.
- [ ] 풀 고갈의 heap fallback과 반환 블록 보관량도 상한을 가진다. 처리 대기 중인 live bytes, 반환된 cache, 소유권을 잃은 누수를 구분하며 raw pointer/크기를 지운 뒤 반환하는 순서를 만들지 않는다. callback 취소 요청이 아니라 마지막 사용과 deallocate까지 저장소 수명을 유지한다.
- [ ] codec의 입력 byte 상한뿐 아니라 내부 count/type/depth를 객체 생성 전에 검사한다. 호출별 편의 API가 parser stack·객체 tree를 새로 할당하면 소유자별 재사용 parser와 bounded visitor/sink를 검토하고, 오류 다음 정상 메시지에서 상태 초기화를 검증한다.
- [ ] 완결된 단위(datagram, 길이로 잘린 frame) 안의 내부 길이가 남은 바이트를 넘거나 정수 변환에서 넘치면 "데이터 부족 대기"가 아니라 프로토콜 오류로 즉시 연결을 끊는다. 대기로 처리하면 그 연결의 수신 큐가 영구 정지하고 이후 batch가 무제한 쌓인다. 부족 대기는 stream 재조립 경계에만 상한과 함께 둔다.
  - Mirror는 이 경우 큐를 비우고 예외로 끊도록 고쳤으므로([고정 소스의 `Unbatcher`](https://github.com/MirrorNetworking/Mirror/blob/c4f3739966e151f405be1762d33502794fd034ff/Assets/Mirror/Core/Batching/Unbatcher.cs), 조회 2026-10-11) fork를 쓰면 upstream 보안 수정의 반영 여부를 대조한다.
  - 컬렉션은 요소 수 상한만 두지 말고(Mirror 고정 소스의 `AllocationLimit`은 요소 수 기준) `개수 × 요소의 최소 wire 크기 ≤ 남은 바이트`와 메시지별 의미 상한으로 할당 전에 판정한다.
  - 길이로 경계가 정해진 메시지는 선언 길이를 먼저 검증·소비해 경계를 정하고, 그 안의 해석 실패·남은 바이트는 위와 같은 프로토콜 오류로 처리한다. 선언 길이만큼 건너뛰고 계속하는 것은 협상된 선택적 확장처럼 계약이 허용한 메시지로 한정한다.
- [ ] TLS 유휴 buffer 반납은 반복 할당과 연결별 점유 메모리의 선택이다. [OpenSSL mode 문서](https://docs.openssl.org/4.0/man3/SSL_CTX_set_mode/)(3.6 문서와 `SSL_MODE_RELEASE_BUFFERS` 설명이 같다, 4.0.x가 최신 릴리스 계열임과 함께 확인 2026-10-15)의 `SSL_MODE_RELEASE_BUFFERS`와 전송 wrapper가 실제 설정하는 값을 확인한다. 보관을 선택해도 연결 상한·최종 SSL 해제는 유지하며 SSL 객체 자체 재사용이나 allocator 교체와 혼동하지 않는다.
- [ ] Asio의 [associated allocator](https://think-async.com/Asio/asio-1.38.2/doc/asio/overview/core/allocation.html)가 [즉시 완료](https://think-async.com/Asio/asio-1.38.2/doc/asio/overview/composition/immediate_completion.html)·composed operation·executor 전달에서도 보존되는지 고정 소스로 확인한다(현행 1.38.2 문서, 확인 2026-10-12. 최신 릴리스가 1.38.2임은 [태그 목록](https://github.com/chriskohlhoff/asio/tags)으로 2026-10-15에 재확인). type erasure가 모든 allocator property를 전달한다고 가정하지 않으며, inline 재귀를 허용해 할당만 줄이지 않는다.
- [ ] 무할당 계측에는 알려진 양성 할당을 검출하는 대조를 둔다. `operator new`만 세면 `malloc`·`aligned_alloc`·TLS C 할당을 놓칠 수 있다. Asio 1.32/Linux 검증에서 캐시를 끄는 경우 `ASIO_DISABLE_STD_ALIGNED_ALLOC`까지 적용해 기본 경로가 계측한 `operator new`로 이어지는지 확인하거나 aligned 할당을 별도로 판정한다. 캐시 비활성 분기의 [upstream 수정](https://github.com/chriskohlhoff/asio/commit/57bf938c7dc1f6ea1e224fb74e274e397edebcd1)은 1.32.0 태그 소스에는 없고 1.34.0 태그부터 포함된다(태그 소스 확인 2026-10-12). 그보다 낮은 버전을 쓰면 재현 가능한 의존성 패치로 관리하고 설치 헤더를 직접 고치지 않는다.
- [ ] 측정 thread·warmup·peer 수·요청 순서·누락한 라이브러리 경로를 명시한다. I/O 소유자 하나와 프로세스 전체 thread 하나는 다르다. 접속/종료 반복·느린 수신자·고갈·취소에서 FD와 live/retained 메모리를 확인하며, RSS가 그대로인 관측이나 제한된 무할당 결과를 단편화 없음·전체 프로세스 무할당·운영 CCU 보장으로 확대하지 않는다.

## 출처와 적용 범위

이 문서의 Mirror·Asio·OpenSSL·Linux 사례는 각 항목의 revision·확인일과 관측 한계를 따릅니다. 게임 발표의 구조·성능이나 한 실측 사례를 모든 서비스의 보장으로 전환하지 않습니다. 게임 사례의 한계는 [게임 서버 근거](/game/server-checklist.md#근거와-적용-한계)를 참고합니다.

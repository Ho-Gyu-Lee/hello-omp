---
type: Checklist
title: 네트워크 프레이밍·비동기 I/O·연결 종료
description: TCP 분할·병합·부분 송신, 수신 처리 예산, 실패 완료·연산별 수명, half-close·TLS 종료와 접속 부하 측정의 기준입니다.
tags: [development, networking, tcp, winsock, iocp, framing, lifetime, shutdown]
timestamp: 2026-10-15T00:00:00Z
---

# 네트워크 프레이밍·비동기 I/O·연결 종료

상위 개념: [메시지 전달·연결 복구](/development/network-delivery.md). TCP는 순서 있는 byte stream이지 메시지 큐가 아닙니다. 앱·웹·서비스·게임의 직접 codec/transport 구현·검토 기준이며 이미 제공되는 라이브러리 위에 같은 계층을 중복 구현하라는 지시가 아닙니다. 게임 처리·채팅 예시는 애플리케이션 업무 경계의 한 사례입니다.

## 스트림과 처리 예산

- [ ] 헤더·본문을 누적하고, 검증된 길이만큼 완성된 프레임을 소비합니다. 한 번의 send가 한 번의 recv로 온다고 가정하지 않습니다. 종류별 허용 길이·전체 상한·남은 바이트를 복사/할당 전에 검사하고, 본문 없는 프레임을 허용하면 헤더만으로 완성되는 경계도 처리합니다. 내부 길이 오류와 정상적인 stream 조립 대기는 [서버 메모리·codec 기준](/development/server-checklist.md#상시-운영-메모리와-계측)을 따릅니다.
- [ ] 완결 프레임은 처리 예산 안에서 반복 소비합니다. 예산 때문에 사용자 공간 버퍼에 완결 프레임을 남겼다면 새로운 네트워크 수신 통지 없이도 다음 pass에서 재스케줄합니다. 무제한 drain과 '수신 이벤트당 하나만 처리하고 나머지는 새 바이트를 기다림'을 모두 피합니다.
- [ ] 비차단 send의 실제 반환 바이트 수만 진행시키고 남은 범위를 연결별 큐에 보존합니다. would-block은 성공이나 연결 오류로 위장하지 않습니다. 같은 스트림에 대한 송신 시작을 직렬화하고 라이브러리의 겹치는 write 허용 여부를 확인합니다. 큐 상한과 메시지 대체 의미는 상위 계약을 유지합니다([Winsock send](https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-send)).
- [ ] 수신은 길이가 있는 바이트입니다. 오류·EOF·양수 길이를 먼저 구분하고, 자동 NUL 종료를 가정하지 않습니다. C 문자열로 바꾸면 종료 문자 공간까지 확보합니다. 사용자 닉네임·채팅·패킷 덤프를 printf류의 포맷으로 사용하지 않고 고정 포맷의 데이터 인자로 처리합니다([recv](https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-recv), [printf 보안 경고](https://learn.microsoft.com/en-us/cpp/c-runtime-library/reference/printf-printf-l-wprintf-wprintf-l)).
- [ ] 헤더/본문의 모든 분할 경계, 여러 프레임 병합, 계약상 허용된 빈 본문, 잘린/과대 길이, 부분 송신과 would-block, 예산 소진 뒤 추가 수신 없이 남은 프레임 처리를 검증합니다. 실제 연결 검증과 codec 입력 주입은 서로 대체하지 않습니다.

## readiness와 completion

- [ ] 이벤트 수집 성공과 개별 I/O 성공을 구분합니다. `poll.revents`는 비트 집합이므로 읽기·종료·오류가 동시에 올 수 있습니다. HUP가 있어도 남은 데이터가 있을 수 있습니다. IOCP의 `GetQueuedCompletionStatus == FALSE`도 `OVERLAPPED != nullptr`이면 실패한 연산의 완료 패킷을 꺼낸 경우입니다. 이를 '큐가 비었음'으로 버리지 않습니다([poll](https://man7.org/linux/man-pages/man2/poll.2.html), [GetQueuedCompletionStatus](https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-getqueuedcompletionstatus)).
- [ ] IOCP에서 동시에 진행 중인 연산마다 별도 `OVERLAPPED`·연산 종류·버퍼 수명을 둡니다. 연결 객체의 mutable `state` 하나로 read/write/accept 완료 종류를 추정하지 않습니다. 제출 실패와 실제로 시작된 연산을 구분하고 각 연산의 정산을 한 번만 수행합니다([WSASend](https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-wsasend)).
- [ ] 소켓 종료·취소 요청의 반환은 미완료 연산의 완료 통지 소비가 아닙니다. 종료 후 중단 완료까지 관련 저장소를 유지하고, 옛 연산이 참조하는 컨텍스트를 새 연결/accept에 재사용하지 않습니다. 제출된 송신 버퍼도 완료 전에 수정·이동·반납하지 않습니다([closesocket](https://learn.microsoft.com/en-us/windows/win32/api/winsock2/nf-winsock2-closesocket)). 다른 completion API에는 그 API의 완료·통지 생략 계약을 적용합니다.

## 연결 종료와 부하 한계

- [ ] 끊김 처리 순서: 네트워크 스레드가 끊김을 감지해도 게임 스레드가 아직 처리하지 않은 수신 메시지가 남아 있을 수 있음. 세션 상태 초기화(채널 이탈 통지·초기화 플래그 해제)는 같은 수신 큐에 종료 표시로 넣어 게임 스레드가 순서대로 처리하게 함. 다음 접속에서야 올라가는 generation은 재접속 대기 중 처리되는 이전 연결 메시지를 막지 못함
- [ ] 양수 용량의 stream recv가 0이면 앞선 바이트를 다 읽고 상대의 송신 종료를 본 것입니다. 0바이트 메시지가 아닙니다. 상대 FIN만으로 자기 쪽 미송신 응답을 폐기하지 않습니다. 정상 종료에서 마지막 메시지 전달을 시도한다면 새 송신 차단→기존 큐 배출→쓰기 종료→상대 종료/유한 기한까지 수신→close를 프로토콜에 맞춰 처리합니다. 이는 상대의 게임 처리 완료 증거가 아닙니다.
- [ ] `SO_LINGER {1,0}` 같은 abortive close는 미송신 데이터를 버릴 수 있습니다. 정상 배출과 강제 회수를 구분하고 기한 초과를 정상 전달로 보고하지 않습니다. TLS는 raw TCP half-close를 먼저 하지 않고 라이브러리의 `close_notify`·읽기·종료 API를 따릅니다([Winsock graceful shutdown](https://learn.microsoft.com/en-us/windows/win32/winsock/graceful-shutdown-linger-options-and-socket-closure-2), [OpenSSL shutdown](https://docs.openssl.org/4.0/man3/SSL_shutdown/)).
- [ ] TCP 연결은 양 끝 주소/포트의 쌍으로 구별됩니다. 한 listen 포트의 연결 수를 16-bit 포트 개수로 제한해 해석하지 않습니다. 서버의 FD·커널 메모리·연결 예산, accept 큐/backlog와 처리율, 부하 생성기의 소스 IP/목적지별 임시 포트·TIME-WAIT·FD 한계를 따로 측정합니다. OS가 적용한 backlog와 재접속 폭주의 거부/재시도 지연을 확인하며 책의 레지스트리 값·CCU 수치를 복사하지 않습니다([RFC 9293](https://www.rfc-editor.org/rfc/rfc9293.html), [listen](https://man7.org/linux/man-pages/man2/listen.2.html)).

## 근거와 적용 범위

- 『온라인 네트워크 게임 프로그래밍』 제공본 PDF p.555–572, 588–602, 629–647: 서로 다른 프레이밍 예제·부분 송신 미처리·공유 OVERLAPPED·종료 수명·접속 한계를 현재 Winsock/RFC와 대조했습니다. 해당 예제의 완성도를 보증하지 않으며 원래 wrapper 구현이 생략된 부분의 실제 실행 순서는 확정하지 않습니다.
- *Game Programming Gems 3* 한국어판 5.4 PDF p.623–624의 poll/IOCP 예제는 복합 이벤트와 실패 완료를 놓칠 수 있습니다. 위 분기는 현재 API 문서로 확인한 교정 기준입니다(2026-10-15). 이 문서 작업에서 Windows 네트워크 예제를 실행 재현한 것은 아닙니다.

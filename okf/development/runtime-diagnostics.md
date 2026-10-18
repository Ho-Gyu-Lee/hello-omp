---
type: Checklist
title: 런타임 진단·측정 범위·출하 진단
description: 측정·검증이 증명하는 범위, 교체 allocator 앱에 결합하는 정적 라이브러리의 할당/해제 도메인, Fluent Bit 라벨/심각도·연결 종료 진단·Docker pause 관측·Windows 덤프 API의 확인된 조건입니다.
tags: [development, diagnostics, memory, logging, crash, native-library]
timestamp: 2026-10-18T00:00:00Z
---

# 런타임 진단·측정 범위·출하 진단

## 측정과 검증의 범위

- [ ] 계측·검사·시험은 실제로 실행한 경로·표본·구성이 증명한 범위만 주장합니다. 범위 밖(다른 allocator·OS 직접 할당·미실행 경로·공용 DNS/WAN·제한된 단일 관측)으로 확대하지 않고, 계측이 대상을 바꾸지 않는지 확인하며, 의도적 양성 사례로 관측기 자체를 검증합니다. 측정 thread·warmup·peer 수·요청 순서·빠진 경로를 명시합니다. 예:
  - [MSVC `_CrtSetAllocHook`](https://learn.microsoft.com/en-us/cpp/c-runtime-library/reference/crtsetallochook?view=msvc-170)은 debug CRT가 실행한 할당 경로만 관측합니다.
  - 일정 깊이 FIFO `std::deque`도 블록 경계에서 할당·반납을 반복하므로 무할당은 실제 STL/allocator로 계측해 판정합니다([deque](https://en.cppreference.com/w/cpp/container/deque)).
  - 합성 점검(canary)은 증명하는 구간(예: 같은 호스트의 게시 포트 → 프록시 → 서비스 TLS)과 증명하지 않는 구간(공용 DNS·WAN·인증·업무 라우팅)을 적습니다.
  - RSS가 그대로라는 관측이나 제한된 무할당 결과를 단편화 없음·전체 프로세스 무할당·운영 CCU 보장으로 바꾸지 않습니다. 계측이 대상을 교란한 사례는 [RTT 계측](/development/network.md#rtt-계측과-관찰-사례)의 화면 캡처 항목입니다.

## 정적 라이브러리의 할당/해제 도메인

- [ ] 할당자를 교체한 앱(게임 엔진 등)에 결합하는 네이티브 정적 라이브러리는 한 블록을 할당한 쪽과 해제한 쪽이 다른 할당자를 쓰지 않는지 확인합니다. 불일치 경로는 셋입니다. (1) 최적화 없이 빌드한 라이브러리는 표준 라이브러리 함수를 인라인하지 않고 플랫폼 C++ 런타임의 out-of-line 함수(예: `~basic_string()`)를 부릅니다. (2) 라이브러리가 정의한 weak 템플릿 인스턴스를 링커가 앱의 같은 이름 인스턴스 대신 고를 수 있습니다. (3) `std::thread`는 호출한 쪽 코드에서 스레드 상태를 할당하고 스레드가 끝날 때 런타임이 해제합니다.
  - 배포 라이브러리는 Release로 만들고 nm으로 런타임 out-of-line 함수에 대한 미정의 참조와 weak 정의를 아카이브 멤버마다 셉니다(이름이 같은 멤버가 있습니다). 비트코드를 포함한 Apple 아카이브는 오래된 llvm-nm이 읽다 실패하므로 `--no-llvm-bc`를 지원하는 llvm-nm으로 Mach-O 심볼 표를 읽습니다.
  - 판정은 weak 정의의 유무가 아니라 최종 링크된 앱에서 선택된 구현이 무엇을 호출하는지로 합니다. 엔진 할당자가 OS 할당자에 일부 크기를 위임하면 불일치가 드러나지 않을 수 있으므로 대상 OS 실기기에서도 확인합니다.
  - 근거(2026-10-16): iOS 26 이상에서만 보고된 크래시와 최적화 없이 빌드된 프리빌트 gRPC·protobuf 아카이브의 멤버별 심볼, Unreal Engine 4.27 iOS 할당 경로의 정적 검사. iOS 실기기 재현과 수정 효과는 확인하지 않았습니다.

## 로그·실패·출하 진단

- [ ] Fluent Bit v4.0.8 `stackdriver` 출력에서 `resource=k8s_container`이고 `tag_prefix`를 생략하면 기본 접두사는 `k8s_container.`입니다. 라벨을 `resource_labels`·`monitored_resource`로 주지 않고 태그 정규식 매칭도 실패하면, `local_resource_id`(없으면 태그)를 접두사 비교 없이 기본 접두사 길이만큼 건너뛴 뒤 정규식에 대입합니다. 실제 접두사가 다른데 남은 문자열이 정규식에 맞으면 `pod_name` 등이 앞부분이 잘린 값으로 추출되고, 맞지 않으면 접두사 불일치 오류가 됩니다. 두 현상을 같은 것으로 진단하지 않습니다. `severity_key`가 가리키는 필드가 레코드에 없으면 심각도가 생략되어 DEFAULT로 적재됩니다. 조회 필터·알림을 만들기 전에 원본 출력과 항목 수·라벨·심각도를 대조합니다([Stackdriver 출력](https://docs.fluentbit.io/manual/pipeline/outputs/stackdriver), [v4.0.8 `stackdriver.c`](https://github.com/fluent/fluent-bit/blob/v4.0.8/plugins/out_stackdriver/stackdriver.c), [기본 접두사](https://github.com/fluent/fluent-bit/blob/v4.0.8/plugins/out_stackdriver/stackdriver_conf.c#L548-L552), 확인 2026-10-15). 다른 버전·플러그인은 같다고 가정하지 않습니다.
- [ ] 연결·세션 종료 진단은 종료를 처음 결정한 지점에서 원인을 고정해 뒤의 송신 실패·transport 통지가 덮어쓰지 않게 합니다. 재개로 인한 대체·정상 이전 뒤 퇴역·미전송 요청 취소처럼 "끊김"으로 보이지 않는 재설정 경로까지 회계에 넣습니다. "peer 종료" 같은 transport 통지는 로컬 socket 실패도 같은 통지로 올릴 수 있으므로 그 사유만으로 외부 원인을 확정하지 않습니다.
- [ ] Docker Desktop 29.8.2에서 pause한 컨테이너의 게시 포트는 TCP 연결을 받고 TLS handshake가 timeout으로 끝났습니다(2026-10-16 관측). 정지한 백엔드를 연결 거절로 판별한다고 가정하지 않습니다.
- [ ] Windows `MiniDumpWriteDump`는 가능하면 별도 프로세스에서 호출하고 DbgHelp 동시 호출을 직렬화합니다. 크래시 프로세스 내부는 allocator·loader lock이 손상/교착 상태일 수 있습니다([MiniDumpWriteDump](https://learn.microsoft.com/en-us/windows/win32/api/minidumpapiset/nf-minidumpapiset-minidumpwritedump)).

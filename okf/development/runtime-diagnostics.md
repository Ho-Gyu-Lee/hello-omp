---
type: Checklist
title: 런타임 진단·메모리·성능 측정
description: 계층 프로파일·단조 경과/CPU 시간, 캐시·풀·데이터 배치·메모리 예산과 할당 검증, 비활성 로그 비용·로그 수집 경로의 라벨/심각도 변형·연결 종료 진단 이벤트·외부 경로 합성 점검·무인 실패·출하 심볼·크래시 덤프와 제품별 성능 수락의 기준입니다.
tags: [development, profiling, memory, diagnostics, crash, symbols, performance]
timestamp: 2026-10-16T00:00:00Z
---

# 런타임 진단·메모리·성능 측정

앱·웹·서비스·게임에서 측정 결과를 잘못 해석하기 쉬운 경계를 다룹니다. 새 프로파일러·할당자·로그 프레임워크를 선행 구축하라는 지시가 아닙니다. frame/tick·렌더러·voice·씬은 해당 기능이 있는 대상의 사례입니다. 일반 서비스 메모리·큐 계측은 [서버 운영](/development/server-checklist.md), 제품별 부하는 아래 [성능 수락 사례](#성능-수락-기준)와 [Godot의 구체 부하·구현 경계](/game/godot-simulation.md)에 연결합니다.

## 프로파일 결과 해석

- [ ] 부모의 포괄 시간, 자식을 제외한 자체 시간, 호출당 비용과 호출 횟수를 함께 봅니다. 같은 스레드의 중첩 스코프와 여러 스레드에서 겹치는 작업의 시간을 구분하고, 여러 워커의 CPU 합을 프레임 경과 시간처럼 빼거나 더하지 않습니다([Unity CPU Profiler](https://docs.unity3d.com/6000.0/Documentation/Manual/ProfilerCPU.html)).
- [ ] 경과 시간은 단조 시계로 측정하고 프로세스/스레드 CPU 시간은 별도 지표로 보고합니다. 옛 `boost::timer`나 `clock()`은 플랫폼에 따라 의미가 달랐습니다. API 이름만 보고 이식하지 않습니다([Boost original timer](https://www.boost.org/doc/libs/release/libs/timer/doc/original_timer.html), [std::clock](https://en.cppreference.com/w/cpp/chrono/c/clock)).
- [ ] 매우 짧은 함수를 매 호출 계측하면 probe가 실제 작업보다 비쌀 수 있습니다. 큰 구간에서 범위를 좁히고 sampling·instrumentation·오버레이 비용을 구분합니다. 비활성/활성 계측, release 옵션, GPU 검증 레이어, 프레임 제한/VSync, cold/warm 조건을 기록합니다. 로딩의 cold 판정은 엔진 캐시뿐 아니라 OS 파일 캐시 상태를 포함하며 캐시 우회 실험을 제품 로더의 성능으로 표현하지 않습니다([VS 수집 방식](https://learn.microsoft.com/en-us/visualstudio/profiling/understanding-performance-collection-methods-perf-profiler?view=visualstudio), [Windows file buffering](https://learn.microsoft.com/en-us/windows/win32/fileio/file-buffering)).
- [ ] 병렬 벤치마크는 실행한 작업 수와 계산 결과를 먼저 검산합니다. 정수 폭 축소·overflow·컴파일러의 작업 제거로 결과가 달라졌다면 speedup 근거가 아닙니다. 코어 수를 넘는 향상도 무조건 오류는 아니지만 캐시 적합성·작업량·조건 변화부터 확인합니다.
- [ ] 콘텐츠 범주별 CPU/GPU·메모리·로드 예산을 제작자가 확인할 수 있게 하고 최대 밀집·최저 지원 기기에서 검사합니다. 임의 완성도 비율로 성능을 예측하거나 책의 목표 FPS·여유율을 공통 수치로 복사하지 않습니다.

## 메모리·캐시

- [ ] 할당을 서브시스템/수명에 귀속해 현재·피크와 상위 합계를 봅니다. 특정 작업 전후 생성되어 남은 할당을 비교하되 합법 캐시·전역 초기화와 누수를 구분합니다. 할당별 추적 메타데이터도 총량 비용입니다([MSVC heap checkpoint](https://learn.microsoft.com/en-us/cpp/c-runtime-library/reference/crtmemcheckpoint)).
- [ ] 자체 풀의 backing allocation 관측과 슬롯별 수명 관측은 다릅니다. 필요하면 진단 구성에서 풀 우회 또는 sanitizer poison/unpoison을 사용하며 자유 목록 메타데이터·재할당 순서를 지킵니다. 패턴 채움은 접근을 자동 차단하지 않고 generation 핸들도 실제 메모리 접근 검사를 대신하지 않습니다([ASan custom allocation](https://github.com/google/sanitizers/wiki/AddressSanitizerManualPoisoning)).
- [ ] 일정 깊이 FIFO도 deque 블록 경계를 넘는 push/pop에서 할당·반납을 반복할 수 있습니다. O(1)·amortized 표기나 원소 수 안정으로 무할당·개별 호출 지연 상한을 주장하지 않습니다. 실제 STL/allocator와 충분한 rolling workload로 계측하고 요구 위반이 확인될 때만 저장소를 바꿉니다([deque](https://en.cppreference.com/w/cpp/container/deque)).
- [ ] 자원 캐시의 안정 핸들/메타데이터와 payload의 상주는 별개입니다. 조회로 빌린 포인터의 유효 범위, 퇴출 방지 pin과 반환 시점을 정합니다. 한 번의 miss와 작업 집합이 용량을 넘어서 반복 퇴출/재로드하는 thrashing을 구분합니다. 후자는 preload만 더해서 해결되지 않을 수 있으며 콘텐츠 밀도·품질·상주 예산도 함께 검토합니다. 표시용 miss의 생략/대체/대기와 필수 판정 데이터 부재는 다른 정책입니다.
- [ ] 메모리 압박은 선언한 예산·유효한 플랫폼 통지를 기준으로 재생성 가능한 표시 캐시·효과부터 줄입니다. 최종 할당 실패나 항상 온다고 가정한 OS 알림만 기다리지 않습니다. 비상 메모리를 두더라도 복구 경로 자체의 할당·유효 상태를 검증하고 손상 세이브 덮어쓰기를 허용하지 않습니다. 메모리·디스크 고갈, 장치 부재, 동시 voice 상한은 격리된 실패 주입/제한 환경으로 검사하며 개발 머신의 전체 메모리·디스크를 소진하지 않습니다.

## 로그·실패·출하 진단

- [ ] 비용이 중요한 호출 경로에서 비활성 로그가 비싼 인수 계산·문자열 조립·할당을 유발하지 않는지 확인합니다. allocator/할당 훅 내부의 로그는 같은 allocator나 락으로 재진입하지 않아야 합니다. 모든 로그를 무할당으로 강제한다는 뜻은 아닙니다. 원인 이벤트의 최근 이력이 필요하면 유한 ring을 사용하고 민감정보를 제외합니다.
- [ ] 로그 수집기·출력 플러그인은 설정 기본값과 입력 태그 형식에 따라 리소스 라벨을 잘못 추출하거나 심각도를 비울 수 있습니다. 조회 필터·알림·보존 판단을 만들기 전에 원본 출력(컨테이너 stdout/stderr 등)과 항목 수·라벨·심각도를 대조합니다. 예를 들어 Fluent Bit v4.0.8 `stackdriver` 출력에서 `resource=k8s_container`이고 `tag_prefix`를 생략하면 기본 접두사는 `k8s_container.`입니다. 라벨을 `resource_labels`·`monitored_resource`로 주지 않고 태그 정규식 매칭도 실패하면, 레코드의 `local_resource_id`(없으면 태그)를 접두사 비교 없이 기본 접두사 길이만큼 건너뛴 뒤 정규식에 대입합니다. 실제 접두사가 기본 접두사와 다른데 남은 문자열이 정규식에 맞으면 `pod_name` 등이 잘못(예: 앞부분이 잘린 값으로) 추출될 수 있습니다. 정규식에 맞지 않으면 접두사 검사와 점 구분 형식 파싱으로 넘어가며, 이때 실제 접두사가 다르면 접두사 불일치 오류가 됩니다. 라벨 왜곡과 형식 오류를 같은 현상으로 진단하지 않습니다. `severity_key`가 가리키는 필드가 레코드에 없으면 심각도가 생략되어 DEFAULT(심각도 없음)로 적재됩니다([Fluent Bit Stackdriver 출력](https://docs.fluentbit.io/manual/pipeline/outputs/stackdriver), [v4.0.8 `stackdriver.c`](https://github.com/fluent/fluent-bit/blob/v4.0.8/plugins/out_stackdriver/stackdriver.c), [`stackdriver_conf.c`의 기본 접두사](https://github.com/fluent/fluent-bit/blob/v4.0.8/plugins/out_stackdriver/stackdriver_conf.c#L548-L552), [Cloud Logging LogEntry](https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry)).
- [ ] 연결·세션 종료 진단은 종료를 **처음 결정한 지점**에서 정리·송신 전에 원인을 고정하고 뒤의 송신 실패·transport 통지가 덮어쓰지 않게 합니다. 인증 전·공개 엔드포인트의 종료는 개별 줄 없이 집계만 남기고, 줄 예산을 넘은 이벤트는 종류·사유별 억제 카운터로 남겨 "수명당 정확히 1회"를 줄과 카운터를 합친 회계로 정의합니다. 상관 키는 계정·캐릭터 같은 영속 식별자 대신 프로세스 incarnation과 재사용하지 않는 연결 번호로 두고 값은 숫자·고정 토큰만 씁니다. 재개로 인한 대체·정상 이전 뒤 퇴역·미전송 요청 취소처럼 "끊김"으로 보이지 않는 재설정 경로까지 세고, 누락 검출용 사유가 시험에서 0인지 확인합니다. "peer 종료" 같은 transport 통지는 로컬 socket 실패도 같은 통지로 올릴 수 있으므로 그 사유만으로 외부 원인을 확정하지 않습니다.
- [ ] 외부 경로 합성 점검(canary)은 감독 루프와 분리된 실행 단위에서 한 번에 하나·시간 제한·인증서 검증을 켠 채 돌리고 상태 전이만 기록하며, 증명 범위(예: 같은 호스트의 게시 포트 → 프록시 → 서비스 TLS)와 증명하지 않는 범위(공용 DNS·WAN·인증·업무 라우팅)를 문서에 적습니다. 감독 대상 서비스보다 먼저 시작하면 첫 결과가 실패이므로 기동 순서와 정상 첫 줄을 함께 적습니다. Docker Desktop 29.8.2에서 pause한 컨테이너의 게시 포트는 TCP 연결을 받고 TLS handshake가 timeout으로 끝났습니다(2026-10-16 관측). 정지한 백엔드를 연결 거절로 판별한다고 가정하지 않습니다.
- [ ] 무인 서버/시험의 실패가 assert 대화상자 뒤에서 무한 대기하지 않게 합니다. 비대화식 실패 정책은 assert 무시가 아니라 실패 상태·종료 코드·증거를 보존하는 것입니다. 계측·로그·스레드 중지로 증상이 사라진 것만으로 레이스나 메모리 결함을 고쳤다고 판단하지 않습니다.
- [ ] 배포한 정확한 binary·빌드 식별자·심볼과 대응 소스/콘텐츠·빌드 설정을 보존합니다. 같은 소스의 재빌드가 원래 binary와 같은 심볼 identity를 갖는다고 가정하지 않습니다. Apple dSYM은 build UUID가 맞아야 하고 Windows 심볼도 해당 모듈과 일치해야 합니다([Apple debug information](https://developer.apple.com/documentation/xcode/building-your-app-to-include-debugging-information), [Windows symbols](https://learn.microsoft.com/en-us/windows/win32/debug/symbol-stores-and-symbol-servers)).
- [ ] 크래시 프로세스 내부는 allocator·loader lock도 손상/교착 상태일 수 있습니다. Windows `MiniDumpWriteDump`는 가능하면 별도 프로세스에서 호출하고 DbgHelp 동시 호출을 직렬화합니다. 정상 실행 중 준비한 collector와 빌드 identity를 실제 고장 경로에서 확인합니다([MiniDumpWriteDump](https://learn.microsoft.com/en-us/windows/win32/api/minidumpapiset/nf-minidumpapiset-minidumpwritedump)). 덤프에 세션 비밀·PII가 포함될 수 있으므로 수집 범위·접근·보관·전송을 제한하며 공개 로그/레포에 넣지 않습니다.

## 근거와 적용 범위

- *Game Programming Gems* 한국어판 PDF p.135–141, 181–189; *Game Programming Gems 3* 한국어판 1.15–1.17(PDF p.197–223): 캐시 수명·계층 계측·로깅·assert. 『게임 프로그래머를 위한 C++』 PDF p.180–203, 218–219: 힙 귀속·북마크·풀 진단·고갈·deque churn.
- *Game Coding Complete* 1판 한국어 제공본 PDF p.69, 348–361, 517–525, 606–624, 638, 675: 콘텐츠 예산·캐시 실패·크래시/심볼·고갈 시험·아카이브. *Multi-Threaded Game Engine Design* (2011) PDF p.43–45, 108–113, 570–572: 타이머·벤치 결과·측정 구성. *Game Programming Tricks of the Trade* 한국어판 PDF p.501–503: 파일 캐시를 통제한 측정과 제품 로더의 구분.
- 현대 문서 확인: 2026-10-15. 수치 임계·성능 배수·전역 allocator 교체·특정 crash SDK는 채택하지 않습니다. 책의 결함과 현대 도구 계약에서 도출한 체크리스트이며 실제 게임의 성능·덤프 수집을 이 작업에서 검증했다는 뜻은 아닙니다.
- 로그 수집 경로 항목은 Fluent Bit 공식 문서와 v4.0.8 소스(2026-10-15 확인) 및 실제 운영 로그 대조 사례에서 일반화했습니다. 다른 버전·출력 플러그인의 동작을 같은 것으로 가정하지 않습니다.
- 연결 종료 진단·합성 점검 항목은 한 서버 프로젝트의 구현과 독립 검토(누락 재설정 경로 지적), 실제 프로세스 kill·압박 probe·컨테이너 pause 실행 관측(2026-10-16)에서 일반화했습니다. Docker 관측은 해당 버전의 기록입니다.

## 데이터 배치와 메모리 예산

- hot data를 함께 순회하고 읽기 전용 설정과 가변 시뮬레이션 상태를 분리합니다. AoS/SoA·풀·SIMD는 접근 패턴과 측정 결과로 선택합니다. 재사용 entity ID에는 generation 등 수명 검증을 두고 삭제·재배치로 포인터/참조가 무효화되는 경계를 정합니다.

### 메모리 예산·수명 분리와 할당 검증

- **설계 기준:** 중앙 메모리 정책·전체 예산·계측과 하나의 전역 가변 크기 풀을 구분합니다. 행동별로 할당/반납 규칙을 복제하지 않고 시스템이 소유하는 공통 저장소를 사용합니다. 공통 계층은 타입·크기 등급·수명별 저장소를 허용하며 singleton·단일 전역 락이나 엔진 allocator 교체를 의미하지 않습니다.
- 고정 용량으로 충분한 코어는 배열·값 소유를 유지합니다. 동적 객체가 필요한 기능에서 타입별 풀, 틱/작업 임시 arena, 월드 수명 저장소, I/O 버퍼의 실제 소비자와 고갈 정책을 함께 구현합니다. 빈 범용 allocator 프레임워크를 선행 생성하거나 무할당 배열을 힙 기반 풀로 바꾸지 않습니다.
- 예약 용량·실사용·최대 점유·실패를 구분하고 저장소 전체의 예약 합·전환 중 구/신 데이터·로딩 임시 공간을 예산에 포함합니다. 무제한 성장·일반 힙 fallback으로 고갈을 숨기지 않습니다. 풀의 여유 슬롯·크기 등급 낭비와 스택 배열의 피크도 메모리 비용이며 힙 무할당이 메모리 비용 0을 뜻하지 않습니다.
- 반복 객체는 반납 뒤 핸들 generation을 검증하고, arena는 모든 소비자가 끝난 경계에서만 재사용합니다. 비동기 작업이나 I/O가 소유한 버퍼를 틱 종료·취소 요청만으로 회수하지 않습니다. 소유 스레드·정렬·상한·수명·고갈 결과를 공통 계약에 둡니다.
- 로딩 화면을 줄이는 목표와 런타임 작업 예산을 함께 설계합니다. 비동기 I/O·압축 해제 완료와 메인 스레드의 인스턴스화·GPU 업로드·해제를 분리하고 상주량·진행 중 요청·프레임별 반영/해제에 상한을 둡니다. 선행 로딩·유지(캐시) 범위의 상한과 재사용 조건은 [관찰 수명·월드 로딩·모바일 표현 예산](/game/godot-simulation.md#관찰-수명월드-로딩모바일-표현-예산)의 장면 재사용 항목을 따릅니다.
- 할당 검증은 작성자·에이전트의 기억을 대체하는 실행 경계입니다. 생성/제거·정상/거부·고갈·취소·재사용을 섞어 검사하고 의도적 할당을 검출하는 양성 대조군으로 관측기를 검증합니다. [MSVC `_CrtSetAllocHook`](https://learn.microsoft.com/en-us/cpp/c-runtime-library/reference/crtsetallochook?view=msvc-170)은 debug CRT의 할당/재할당/해제를 관측하므로 실행한 CRT 경로만 보장하며 OS 직접 할당·다른 allocator·엔진/GPU·미실행 경로까지 확대하지 않습니다. 계측 빌드를 release 지연 성능의 근거로 사용하지 않습니다.
- 혼합 부하의 frame/tick 꼬리 지연과 메모리 점유 추세·예약/실사용·할당 크기 분포를 함께 확인합니다. RSS 안정·누수 부재·풀 사용만으로 단편화나 히치가 없다고 결론 내리지 않으며 클라이언트와 서버의 실제 플랫폼·부하를 각각 검증합니다.

## 성능 검증의 제품 적용

다음은 게임 부하에서 구체화한 수락 사례입니다. 앱·웹·서비스에서는 해당 제품이 사용하는 렌더러·작업·요청·상태 변경으로 부하를 정의하며, 존재하지 않는 게임 기능이나 Godot 도구를 요구하지 않습니다.

### 성능 수락 기준

1. **부하 정의:** 목표 기기·CPU/코어·메모리, 렌더러/physics backend, 활성 객체 수·밀집도·peer/관심 대상 수, tick/턴/복제 주기, 입력 데이터·seed·시나리오를 고정합니다. 미정인 값은 프로젝트 요구로 결정하며 임의의 달성 수치를 제시하지 않습니다.
2. **동일 조건 비교:** 최적화 전후 같은 release 옵션·해상도·콘텐츠·warm-up·계측 조건으로 비교합니다. Godot profiler와 네이티브 CPU profiler를 함께 사용하고 C++ 상세 비용을 GDScript profiler만으로 판정하지 않습니다. [공식 측정 도구](https://docs.godotengine.org/en/4.7/tutorials/performance/general_optimization.html#measuring-performance)
3. **지표:** 평균뿐 아니라 frame/tick/턴 처리의 p95·p99·최대값, 예산 초과 횟수, 처리량, 메모리 peak, 할당/복사, 경합, backlog, peer별 bytes/packets와 재전송/폐기를 기록합니다. tick 예산은 `1 / tickRate`이며 물리·전투·네트워크·기타 작업이 함께 소비하므로 평균만 예산 안에 들어가는 것으로 통과시키지 않습니다.
4. **정상·한계·과부하:** 밀집 전투·대규모 턴 갱신·대량 생성/해제·재접속·느린 peer·손실/재정렬·지연을 재현합니다. 정의한 상한에서는 유지하거나 명시적으로 거부하고 큐가 무한 증가하지 않도록 합니다.
5. **동작 보존:** 같은 입력에서 전투/경제 결과·물리 판정·권한·소유권·복제 의미가 유지되는지 확인합니다. 병렬화·backend 교체로 결과가 달라지는 경우 의도한 계약 변경인지 구분합니다. microbenchmark만으로 editor·exported client·headless server의 전체 성능을 주장하지 않습니다.

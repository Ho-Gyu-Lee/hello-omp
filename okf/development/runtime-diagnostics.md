---
type: Checklist
title: 런타임 진단·측정 범위·출하 진단
description: 측정·검증이 증명하는 범위, 교체 allocator 앱에 결합하는 정적 라이브러리의 할당/해제 도메인, Fluent Bit 라벨/심각도·로그 조회의 스캔 비용과 Logs Insights 결과 투영·CloudWatch Logs 적재 신선도·OpenObserve 알림 API·RDS 확장 모니터링 프로세스 목록으로 하는 DB 클라이언트 귀속·가변 이미지 태그의 반영 시점·끝나지 않은 요청의 CPU 점유 진단·연결 종료 진단·Docker pause 관측·Windows 덤프 API의 확인된 조건입니다.
tags: [development, diagnostics, memory, logging, crash, native-library, cost, cloudwatch, kubernetes]
timestamp: 2026-11-10T00:00:00Z
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
- [ ] 로그 검색·집계 비용은 시간 구간과 저장소가 가지치기하는 키(파티션·필드 인덱스)로만 줄고, `LIMIT`과 가지치기 대상이 아닌 필터는 스캔량을 줄이지 않습니다. 긴 구간을 돌리기 전에 짧은 구간 하나로 응답의 스캔량(CloudWatch Logs Insights `statistics.bytesScanned`, OpenObserve `scan_size`)을 재고 쿼리마다 누적해 보고합니다. 결과 가공이 실패해도 쿼리를 다시 실행하지 않습니다. Logs Insights는 같은 query ID로 `get-query-results`를 다시 불러도 재스캔하지 않고, 다시 조회하면 같은 비용이 드는 저장소는 처음 받은 원문 표본을 보관해 다시 파싱합니다. 관측(2026-09): OpenObserve는 `LIMIT`이 스캔량을 줄이지 않았고 활성 파티션 키 필터만 가지치기했습니다. Logs Insights 문서는 Standard 로그 클래스의 `@logStream`을 기본 필드 인덱스로 두고 `=`·`IN` 필터가 스캔량을 줄인다고 하지만([필드 인덱스](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CloudWatchLogs-Field-Indexing.html), 확인 2026-11-04), `filter @logStream = …` 쿼리가 로그 그룹 전체의 해당 구간을 스캔한 관측이 있으므로(2026-09-30, 원인 미확인) 문서상 절감도 스캔량으로 확인합니다.
- [ ] CLI로 Logs Insights 결과를 투영할 때 `results`는 행(`{field, value}` 객체 목록)의 목록이라 JMESPath `results[]`는 한 단계만 평탄화해 필드가 모두 `null`로 나옵니다. 행 단위 투영은 ``results[*].[(@[?field==`name`].value)[0], ...]``로 합니다.
- [ ] CloudWatch Logs의 적재 신선도는 `describe-log-streams`의 `lastEventTimestamp`로 판정하지 않습니다. 이 값은 최종 일관성으로 보통 1시간 안에, 드물게 더 늦게 갱신됩니다([LogStream](https://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_LogStream.html), 확인 2026-11-04). `get-log-events --no-start-from-head --limit N`으로 받은 최신 이벤트의 `timestamp`·`ingestionTime`을 현재 시각과 비교하고 원본 출력(`kubectl logs --timestamps` 등)과 대조합니다.
- [ ] OpenObserve v0.91.1(opensource)의 알림 목록·상세는 `/api/v2/{org}/alerts`이고 `/api/{org}/alerts`는 404입니다. `GET /api/{org}/alerts/destinations` 응답의 `url`·`metadata`에는 Slack webhook URL 같은 비밀이 원문으로 들어 있으므로 목록은 이름·유형만 골라 출력합니다. 알림 SQL에서는 서브쿼리 JOIN, `array_agg(...) FILTER`, `array_has`, `md5`, `regexp_like`, `histogram`이 동작했습니다(관찰 2026-11-09).
- [ ] RDS PostgreSQL에서 `log_connections`가 꺼져 접속 기록이 없어도, 확장 모니터링이 켜져 있으면 CloudWatch Logs `RDSOSMetrics` 그룹의 인스턴스 스트림(`db-<리소스 ID>`) 샘플마다 `processList`에 클라이언트 backend가 `postgres: <user> <db> <host>(<port>) <state>` 이름으로 남습니다. 그 로그 그룹의 보존 기간 동안 DB 클라이언트 주소·사용자를 분 단위로 귀속할 수 있으므로 "접속 기록 없음"으로 판정하기 전에 확인합니다. 표본 간격보다 짧은 세션은 빠지므로 부재 주장은 그 간격 이상 세션으로 한정합니다(2026-11 관측: 1분 간격, 30일 보존, `get-log-events`는 Logs Insights 스캔 비용이 없음).
- [ ] 동작이나 사용량이 어느 시점부터 바뀌었으면 코드·쿼리를 분석하기 전에 그 시점에 실행되던 바이너리(파드 시작 시각과 `status.containerStatuses[].imageID`의 digest)를 확인합니다. 가변 태그(`:latest` 등)와 `imagePullPolicy: Always`는 컨테이너가 시작될 때마다 그 시점의 태그를 다시 해석하므로, 변경은 커밋·푸시 시각이 아니라 재시작·재배치·스케일아웃 시각에 들어가고 같은 태그를 쓰는 파드·테넌트마다 반영 시각이 다릅니다. 공유 가변 태그를 덮어쓰면 다른 테넌트의 파드도 다음 시작부터 새 이미지를 실행합니다.
- [ ] 요청량이 적은데 컨테이너 CPU가 limit에 붙어 있으면 시작·완료 로그를 요청 ID로 짝지어 끝나지 않은 요청부터 찾습니다. 입력을 소비하지 않고 도는 루프(파서가 모르는 토큰에서 전진하지 않는 경우 등)는 로그 없이 실행 단위 하나당 CPU를 계속 쓰고, 요청 context 취소를 확인하지 않으므로 프로세스 재시작 전까지 남습니다. CPU가 limit에 붙기 시작한 시각은 노드 프록시(`kubectl get --raw /api/v1/nodes/<node>/proxy/metrics/cadvisor`)의 누적 `container_cpu_usage_seconds_total`·`container_cpu_cfs_throttled_periods_total`을 limit으로 나눠 역산하고 로그 시각과 대조합니다. 지표 서버에 이력이 없거나 파드 프록시가 앱 지표 포트에 닿지 않아도 이 경로는 됩니다(관찰 2026-11-09).
- [ ] 연결·세션 종료 진단은 종료를 처음 결정한 지점에서 원인을 고정해 뒤의 송신 실패·transport 통지가 덮어쓰지 않게 합니다. 재개로 인한 대체·정상 이전 뒤 퇴역·미전송 요청 취소처럼 "끊김"으로 보이지 않는 재설정 경로까지 회계에 넣습니다. "peer 종료" 같은 transport 통지는 로컬 socket 실패도 같은 통지로 올릴 수 있으므로 그 사유만으로 외부 원인을 확정하지 않습니다.
- [ ] Docker Desktop 29.8.2에서 pause한 컨테이너의 게시 포트는 TCP 연결을 받고 TLS handshake가 timeout으로 끝났습니다(2026-10-16 관측). 정지한 백엔드를 연결 거절로 판별한다고 가정하지 않습니다.
- [ ] Windows `MiniDumpWriteDump`는 가능하면 별도 프로세스에서 호출하고 DbgHelp 동시 호출을 직렬화합니다. 크래시 프로세스 내부는 allocator·loader lock이 손상/교착 상태일 수 있습니다([MiniDumpWriteDump](https://learn.microsoft.com/en-us/windows/win32/api/minidumpapiset/nf-minidumpapiset-minidumpwritedump)).

---
type: Concept
title: 참조 데이터의 저작·배포·로딩·버전 전환
description: 저작 입력 정확성, 불변 payload와 활성화 정보, CDN·DB·메모리의 버전 교체·복구, 조회 인덱스·LINQ·로딩 측정의 공통 기준입니다.
tags: [development, data, content, deployment, cdn, versioning, loading, memory, linq]
timestamp: 2026-10-15T00:00:00Z
---

# 참조 데이터의 저작·배포·로딩·버전 전환

앱·웹·서비스의 설정/참조 데이터와 게임 콘텐츠에 같은 조건으로 적용할 수 있는 데이터 생명주기입니다. 특정 저작 도구·포맷·저장소·hot reload를 강제하지 않습니다. 본문의 게임 진입·세션·존·판정 데이터는 도메인 적용 사례이며, 게임의 정적/동적 분류와 권위 배포는 [게임 정적 데이터](/game/static-data.md)에 남깁니다. 파일 수락은 [데이터 형식](/development/data-formats.md), SQL 경계는 [DB 설계](/database/design.md)를 따릅니다.

## 논리 모델과 물리 배포
- 논리 테이블은 책임·참조 의미·저작 소유·변경/보존 주기로 구분합니다. 물리 파일/패키지는 함께 필요한 범위·다운로드/갱신·상주/해제 단위로 선택합니다. 테이블당 파일 하나나 전체 테이블 한 파일을 강제하지 않습니다. 무관한 콘텐츠를 로딩 개선 명목으로 거대 테이블에 합치지 않되, 같은 책임·수명으로 묶이는 데이터까지 기계적으로 분할하지 않습니다.

## 저작 입력과 검증

- Admin/Console 업로드도 인증/인가와 서버 측 수락 검사를 거칩니다. 기존 [저작 데이터 검증](/development/data-formats.md#저작-데이터와-변환-도구)의 필수값·범위·중복 ID·참조·스키마·오류 위치·부분 게시 금지를 재사용합니다. 저작자가 정한 콘텐츠 요구와 최종 런타임/DB 구조는 다른 산출물입니다.
- Excel을 사용하면 긴 ID·선행 0·날짜/E 자동 변환을 **입력/가져오기 단계**부터 통제합니다. 숫자로 저장해 유효 숫자를 잃은 값을 나중에 표시 형식만 Text로 바꿔 복원하지 못합니다([Microsoft Excel](https://support.microsoft.com/en-us/excel/keeping-leading-zeros-and-large-numbers)). JSON 소비자의 정수 정밀도는 [런타임 간 정수 계약](/coding-style.md#서버-특화)을 함께 따릅니다.
- CSV dialect·인코딩·인용/escape와 빈 셀·빈 문자열·누락·NULL·명시 기본값·공백의 의미를 정합니다. 쉼표 split이나 무조건 trim/0 변환으로 내용을 바꾸지 않습니다. [RFC 4180](https://www.rfc-editor.org/rfc/rfc4180.html)은 공백·인용된 쉼표/줄바꿈을 다루지만 업무의 NULL 의미를 정하지 않습니다. 변경 행뿐 아니라 영향받는 의존집합을 검사하고 검증 실패 버전은 활성화하지 않습니다.

## 게시·활성화·복구

- 파일 게시와 운영 활성화를 나눕니다. 현재 활성본과 분리된 staging/버전 공간에 후보를 만들고 연관 테이블·참조·서버 코드/스키마·클라 산출물의 호환과 준비를 확인한 뒤 광고합니다. 점검/재시작 교체로 충분하면 hot reload를 선행 구현하지 않습니다. 전체 삭제 후 삽입의 DML/DDL·rollback 차이는 [DB 교체 경계](/database/design.md#전체-교체와-ddl의-경계)를 확인합니다.
- 버전별 payload에는 새 경로/이름을 부여하고 게시한 바이트를 덮어쓰지 않는 계약을 둡니다. 현재 사용할 버전을 가리키는 manifest/활성 정보는 별도 mutable 항목입니다. [CloudFront versioned filenames](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/UpdatingExistingObjects.html)는 이 방식과 S3 Object Versioning이 다름을 명시합니다. 이 설계를 채택하지 않는 경우에도 캐시가 낡은 바이트를 제공할 때의 호환·복구 경계는 필요합니다.
- payload 캐시와 활성 정보의 갱신 지연·validator·장애 시 stale 허용을 따로 정합니다. `no-cache`는 저장 금지가 아니라 재사용 전 재검증, `no-store`는 저장 금지이며 `immutable`도 freshness 동안의 계약입니다([RFC 9111](https://www.rfc-editor.org/rfc/rfc9111.html#section-5.2.2), [RFC 8246](https://www.rfc-editor.org/rfc/rfc8246.html)). CloudFront minimum TTL이 0보다 크면 origin의 `no-cache/no-store/private`보다 우선할 수 있고 viewer 요청 헤더만으로 origin 재조회를 강제하지 못합니다. origin·CDN cache behavior·클라 앱 캐시를 함께 확인합니다([CloudFront expiration](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html)).
- DB COMMIT, origin 객체 게시, CDN 캐시, 여러 서버/클라이언트의 메모리 교체는 일반적으로 한 원자 작업이 아닙니다. [S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html#ConsistencyModel)도 단일 key 원자성과 여러 key의 원자 갱신을 구분합니다. 준비 완료 후 활성 버전을 바꿔도 전환 시점이 다를 수 있으므로 허용할 코드/콘텐츠/클라 조합과 진입·세션·존 전환 정책을 정합니다. 버전 번호가 더 크다는 것만으로 호환을 인정하지 않습니다.
- 한 판정/작업이 여러 테이블을 읽는 동안 필요한 단위의 콘텐츠 버전을 고정합니다. 메모리 reload라면 새 데이터와 모든 인덱스를 완성·검증한 뒤 안전한 경계에서 집합으로 교체하고 구집합 독자의 수명 종료까지 보존합니다. 서로 다른 전역 포인터를 따로 바꿔 old/new 테이블을 섞지 않습니다. 실패한 신규 로드가 정상 구버전을 지우거나 부분 새 상태를 노출하지 않게 합니다.
- 구버전 보관 기간은 진행 중 독자·지원 클라·캐시/다운로드·복구 요구로 정합니다. rollback은 이미 신버전 규칙으로 만든 동적/영속 상태와도 호환돼야 합니다. 활성 포인터만 되돌리면 모든 데이터가 복구된다고 가정하지 않습니다. 기존 [콘텐츠 identity·저장소 결속](/development/service-lifecycle.md#identity에-결속된-데이터-이동)도 보존합니다. 증분 갱신은 정확한 base와 삭제/참조 변경을 처리하고 완성된 목표 버전을 검증한 뒤 활성화합니다.

## 필요한 데이터와 메모리 조회

- 최초 플레이의 필수 데이터와 그 의존집합을 우선 적재하고, 나머지는 사용 시점·상주 예산에 따라 지연/사전 로딩합니다. 필수 데이터 부재를 빈 정상 데이터로 대체하지 않습니다. 선택적 표시 miss와 판정 데이터 실패는 다른 정책입니다. 매 시작 전체 다운로드·전량 메모리 상주·모든 인덱스 선생성을 기본값으로 삼지 않습니다.
- ID 반복 조회에는 키 기반 인덱스, 순차 처리/작은 집합에는 배열·리스트, 범위/순서에는 정렬 컬렉션, 복합 정확키와 1:N에는 적합한 복합키/lookup을 검토합니다. 키의 동등성·중복·부재 의미를 보존하고 인덱스 구성 시간·메모리·갱신/교체 비용도 계산합니다. 중복 ID를 덮어 조회를 빠르게 만드는 것은 검증이 아닙니다([Dictionary.TryGetValue](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.dictionary-2.trygetvalue?view=net-10.0), [ToDictionary의 중복키 오류](https://learn.microsoft.com/en-us/dotnet/api/system.linq.enumerable.todictionary?view=net-10.0)).
- **LINQ를 쓰는 .NET 코드:** LINQ-to-Objects의 `Where/Select`는 보통 열거 때 실행되며 결과가 자동 캐시되지 않습니다. `OrderBy/GroupBy`의 지연 실행과 전체 입력 버퍼링, `ToList/ToArray/ToDictionary/ToLookup`의 즉시 구성을 구분합니다. 반복 열거는 비용뿐 아니라 부수효과·변하는 입력 결과도 반복할 수 있습니다. 필요한 snapshot만 materialize하고 그 메모리/초기화 비용을 포함합니다([실행 분류](https://learn.microsoft.com/en-us/dotnet/visual-basic/programming-guide/concepts/linq/classification-of-standard-query-operators-by-manner-of-execution), [CA1851](https://learn.microsoft.com/en-us/dotnet/fundamentals/code-analysis/quality-rules/ca1851)).
- DB provider의 `IQueryable`과 메모리 `IEnumerable`을 구분해 필터·정렬·집계가 실제 어디서 실행되는지 확인합니다. ORM에서는 생성 SQL·projection·결과 크기·N+1·왕복·버퍼링/추적 비용을 보고, `AsEnumerable/ToList` 뒤의 메모리 처리를 DB 인덱스의 효과로 설명하지 않습니다([EF efficient querying](https://learn.microsoft.com/en-us/ef/core/performance/efficient-querying)). LINQ 금지나 특정 runtime의 성능 배수를 일반 규칙으로 쓰지 않습니다.

## 초기 로딩 수락 기준

- 버전 확인 → 다운로드/로컬 I/O → 압축해제·파싱 → 자료구조/인덱스 구성 → 참조 검증·활성화 → 실제 플레이 가능까지 관측합니다. 단계가 병렬이면 개별 시간의 합을 전체 경과 시간으로 보고하지 않고 critical path·CPU·peak 메모리를 나눕니다. 다운로드 완료만으로 로딩 완료를 선언하지 않습니다.
- 최초 설치·재실행·업데이트 후 실행, 최소 지원 기기·네트워크·cold/warm 캐시·병렬도·콘텐츠 버전을 고정해 비교합니다. 논리 테이블 수 외에 실제 파일/요청 수·전송량·파싱·할당·상주/교체 중 구신 데이터의 피크를 봅니다. 필수/선택 로딩을 바꾼 뒤 첫 사용 히치·누락·갱신 실패도 검사합니다. 초기 로딩과 유저 이탈의 정량 관계는 해당 게임 분석 없이는 주장하지 않습니다.
- 패키징은 요청/metadata 비용과 패치 범위·의존 로드·해제 단위의 교환입니다. [Addressables 2.0의 bundle memory 설명](https://docs.unity3d.com/Packages/com.unity.addressables@2.0/manual/memory-assetbundles.html)은 큰/작은 bundle의 서로 다른 비용을 보여 주는 사례이지 JSON 테이블의 최적 개수나 Addressables 도입 근거가 아닙니다. 압축/바이너리 선택도 전송량만 아니라 해제·파싱·구성·운영 비용으로 판단합니다. 계측 일반은 [런타임 진단](/development/runtime-diagnostics.md)을 따릅니다.

## 확인 범위

공식 문서 확인일: 2026-10-15. .NET 링크는 지정된 10.0 API/일반 LINQ 계약, Addressables는 2.0 문서의 조건을 인용했습니다. 프로젝트의 실제 DB/런타임·스키마·CDN 설정·성능은 제공되지 않았으므로 특정 구성이 설치돼 있거나 더 빠르다고 판정하지 않았습니다. 위는 구현·운영에서 검증할 기준이며 실제 게임 배포 전환을 실행한 결과가 아닙니다.

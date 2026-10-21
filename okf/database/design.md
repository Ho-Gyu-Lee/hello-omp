---
type: Concept
title: DB 제품별 비자명 계약(MySQL·SQLite·DynamoDB)
description: MySQL FK 재활성화·matched/changed rows, SQLite prepared statement reset과 WAL checkpoint, DynamoDB GSI·PutItem·Go 페이지네이터와 CloudWatch 지표 계약을 정리합니다.
tags: [database, mysql, sqlite, dynamodb, cloudwatch, wal, verification]
apply_on_edit: ["*.sql"]
timestamp: 2026-10-21T00:00:00Z
---

# DB 제품별 비자명 계약

제품·버전에 따라 결과가 달라지는 계약만 남깁니다. MySQL 8.4/InnoDB·SQLite·DynamoDB 조건을 다른 DB·엔진·격리 설정에 자동 일반화하지 않습니다. 서비스의 멱등성·소유권 펜싱은 [공통 서비스 수명](/development/service-lifecycle.md), 콘텐츠 게시·캐시 계약은 [데이터 형식·콘텐츠 게시](/development/data-formats.md), 게임의 실행 권위·내구성은 [게임 서버 영속화](/game/server-persistence.md)를 따릅니다.

## MySQL

- `foreign_key_checks`를 다시 켜도 비활성 기간에 넣은 기존 데이터를 자동으로 재검증하지 않습니다([MySQL FK](https://dev.mysql.com/doc/refman/8.4/en/create-table-foreign-keys.html), 확인 2026-10-15).
- connector의 matched rows와 changed rows 의미를 확인합니다. MySQL의 동일값 UPDATE 결과 0을 조건 불일치와 무조건 동일시하지 않습니다([MySQL UPDATE](https://dev.mysql.com/doc/refman/8.4/en/update.html), 확인 2026-10-15).

## SQLite

- 단일 작성자 SQLite 서비스는 캐시한 prepared statement를 scope 종료(성공·실패·조기 반환 포함)마다 reset합니다. 결과를 다 읽지 않은 SELECT가 `SQLITE_ROW`에 머물면 COMMIT 뒤에도 같은 연결의 읽기 트랜잭션이 남아 WAL checkpoint가 진행되지 않고 WAL이 계속 커집니다([SQLite 포럼 설명](https://sqlite.org/forum/forumpost/9fba47556b), [WAL 문서](https://sqlite.org/wal.html#avoiding_excessively_large_wal_files), 확인 2026-10-12). checkpoint 임계값을 넘는 커밋 뒤 WAL 크기와 완전 checkpoint를 회귀로 확인합니다.
- 영향 행 수([`sqlite3_changes`](https://sqlite.org/c3ref/changes.html)) 검사의 회귀 테스트는 행을 미리 지워 만들지 않습니다. 앞선 조회 분기로 빠져 검사에 닿지 않기 때문이며, 대상 UPDATE에만 `BEFORE UPDATE` trigger와 `SELECT RAISE(IGNORE)`를 걸면 사전 조회는 통과하고 그 statement만 오류 없이 0행으로 끝납니다([CREATE TRIGGER](https://sqlite.org/lang_createtrigger.html)). 결함 지점에 실패를 직접 주입하는 원리는 [워크플로](/workflow.md#검증)를 따릅니다.

## DynamoDB·CloudWatch

공식 문서 확인 2026-10-15.

- [GSI](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html)는 기본 테이블 쓰기를 비동기로 반영하고 최종 일관성 읽기만 지원합니다. GSI 조회로 행의 존재를 판정해 INSERT·증분하면 방금 만든 행을 못 봐 중복 행이나 증분 누락이 생기므로, 존재 판정은 기본키 대상의 조건부 쓰기로 하고 중복 키 충돌은 기존 행 갱신 재시도로 처리합니다.
- [PutItem](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_PutItem.html)은 같은 기본키의 기존 항목을 통째로 교체합니다. 상수 파티션 키와 밀리초 시각 정렬 키만으로 로그·이벤트를 쓰면 같은 밀리초의 쓰기가 오류 없이 사라지므로 정렬 키에 작성자·요청 ID를 붙이거나 `attribute_not_exists` 조건 쓰기로 덮어쓰기를 막습니다.
- AWS SDK for Go v2 `service/dynamodb` v1.70.3의 `Query` 페이지네이터는 `NextPage`가 오류를 반환하면 위치를 진행하지 않고 `HasMorePages`가 계속 참입니다. 오류에서 `continue`하면 같은 페이지를 끝없이 다시 요청하므로 재시도 횟수·기한을 두고 실패를 호출자에게 반환합니다.
- [TransactWriteItems](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_TransactWriteItems.html#DDB-TransactWriteItems-request-ClientRequestToken)는 성공한 요청을 같은 유효 `ClientRequestToken`으로 재호출하면 쓰기가 아니라 읽기 용량을 반환합니다.
- [조건부 쓰기](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithItems.html#WorkingWithItems.ConditionalWrites.ReturnConsumedCapacity)는 조건 실패에도 쓰기 용량을 소비하지만 실패 응답에 소비 용량을 반환하지 않으므로, 성공 응답에서 관측한 합만으로 전체 사용량을 단정하지 않습니다.
- [CloudWatch 지표](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/metrics-dimensions.html)에서 `TableName` 차원만 지정한 `ConsumedReadCapacityUnits`·`ConsumedWriteCapacityUnits`·`ReadThrottleEvents`·`WriteThrottleEvents`는 테이블분만 반환하고 GSI분을 포함하지 않습니다. 전체 사용량은 `TableName`+`GlobalSecondaryIndexName` 차원의 인덱스별 값을 더해 구합니다.
- `ReadThrottleEvents`·`WriteThrottleEvents`는 프로비저닝 용량 초과 요청의 지표이고 `Read`·`Write` 접두사의 `ProvisionedThroughput`·`KeyRangeThroughput`·`MaxOnDemandThroughput`·`AccountLimit` `ThrottleEvents`가 같은 문서에 별도 정의돼 있으며 지표마다 지원 차원이 다릅니다. 한 지표의 0을 스로틀 없음으로 단정하지 않습니다.
- [CloudWatch SEARCH 식](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/using-search-expressions.html)은 최근 2주 안에 데이터를 보고한 지표만 찾습니다. 더 오래된 구간은 차원을 명시한 지표로 조회하고, 탐색 결과가 비어 있으면 측정 불가와 실제 0을 구분합니다.

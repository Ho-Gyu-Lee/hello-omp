---
type: Fact
title: DynamoDB ConsumedCapacity 필드 채움 규칙
description: ReturnConsumedCapacity 응답은 비트랜잭션 오퍼레이션에서 CapacityUnits만 채우므로 Read/WriteCapacityUnits 기반 사용량 집계는 조용히 0이 된다. 방향은 호출부가 결정하고 집계 필드로 폴백한다.
tags: [aws, dynamodb, usage-metering, billing, api-contract]
timestamp: 2026-07-31T00:00:00Z
---

# 사실

`ReturnConsumedCapacity=TOTAL`(및 `INDEXES`) 응답에서 DynamoDB는 집계 필드 `CapacityUnits`만 채운다. 방향별 필드 `ReadCapacityUnits`/`WriteCapacityUnits`는 **비트랜잭션 오퍼레이션(Query/Scan/GetItem/BatchGetItem/PutItem/UpdateItem/DeleteItem)에서 채워지지 않는다**. 이 필드를 읽어 사용량을 누적하는 코드는 에러 없이 항상 0을 누적한다 — 컴파일·테스트로는 드러나지 않는 무집계 버그다.

# 근거

- AWS 담당자 답변: "setting `ReturnConsumedCapacity` to `TOTAL` is expected to only return the aggregate `ConsumedCapacity` ... and not the `ReadCapacityUnits` and `WriteCapacityUnits`" — aws/aws-sdk-go#2699. Go/PHP/Python/CLI 전부 동일 재현이므로 SDK 문제가 아니라 서비스 동작이다.
- DynamoDB Local 프로브(2026-07-31, `amazon/dynamodb-local`, boto3): PutItem `{CapacityUnits: 3.0}`, Query `{0.5}`, GetItem `{0.5}`, UpdateItem `{3.0}`, TransactWriteItems `[{2.0}]` — 전부 방향별 필드 없음. 실서비스는 트랜잭션 응답에서 `WriteCapacityUnits`를 채운다는 보고가 있으므로 둘 다 처리해야 한다.

# 규칙

- 방향별 필드가 있으면 우선 사용하고, 없으면 `CapacityUnits`로 폴백한다. 방향(읽기/쓰기)은 호출한 오퍼레이션이 결정한다 — 단일 오퍼레이션의 집계 용량은 전부 그 방향이므로 폴백해도 정확하다.
- 방향별 필드와 집계 필드가 함께 오면 이중 집계하지 않는다(방향별 우선).
- 실패한 조건부 쓰기도 용량을 소모하지만 SDK 에러 경로에서는 `ConsumedCapacity`를 얻을 수 없다 — 과소 집계로 남는다는 점을 명시한다.
- 사용량 집계를 배선하면 방향별 필드가 nil인 실제 응답 형태로 테스트를 남긴다. 집계가 0으로 죽어도 로그·에러가 없다.

# 환산 기준

- 1 RCU = 강한 일관성 읽기 4KB. 최종 일관성 읽기는 4KB당 0.5 RCU이므로 4KB/RCU 환산은 실제 읽은 크기를 **최대 2배 과소** 집계한다. 8KB/RCU로 바꾸면 과금 파이프라인과 어긋날 수 있으므로 플랫폼 집계 기준과 맞춰 선택한다.
- 1 WCU = 1KB. 트랜잭션 쓰기는 서비스가 이미 2배로 계산해 반환한다.
- MB로 노출할 때 최소 단위가 1 WCU = 0.000977MB이므로 소수 6자리를 유지해야 0으로 반올림되지 않는다.

---
type: Concept
title: 관계형 DB 설계·인덱스·동시성과 캐시
description: 접근 패턴 기반 모델링, PK/인덱스·실행계획, FK 생략의 무결성 책임, 앱/SP 트랜잭션, DDL·격리·재시도·캐시와 SQLite 멱등 영수증을 다룹니다.
tags: [database, mysql, sql-server, sqlite, index, transaction, concurrency, cache, integrity]
timestamp: 2026-10-15T00:00:00Z
---

# 관계형 DB 설계·인덱스·동시성과 캐시

아래는 **MySQL 8.4/InnoDB**와 Microsoft Learn의 **SQL Server `sql-server-ver17`** 문서 중심으로 확인한 기술 계약과 그에 따른 설계 기준입니다. 다른 저장 엔진·DB·격리 설정으로 자동 일반화하지 않습니다. FK 미사용·앱 로직 우선·정규화 수준은 프로젝트 정책의 선택이지 이 문서가 강제하는 산업 표준이 아닙니다. 기존 스키마/코드/데이터 접근·운영 경로를 먼저 확인하며 이 지침만으로 기존 FK·프로시저·테이블을 없애지 않습니다.

게임·SaaS·일반 서버에 공통으로 적용할 수 있는 관계형 DB 기준입니다. 도메인별 성공 응답 시점·내구 수준·저작/배포 흐름은 해당 서비스의 계약으로 따로 정하며 DB 기능만으로 추정하지 않습니다.

## 논리 모델과 PK

- 업무 요구와 최종 저장 구조를 구분합니다. 함께 읽고 바꾸는 단위뿐 아니라 소유자·수명·갱신/삭제·보존 주기와 교차 불변조건을 보고 정규화/반정규화를 선택합니다. JOIN이 있다는 이유로 느리다고 하거나 테이블 하나로 묶으면 동시성이 해결된다고 가정하지 않습니다. 지나친 분해와 불필요하게 넓은 행을 모두 피하되 특정 정규형/테이블 수를 목표로 삼지 않습니다.
- 반정규화한 현재 값에는 정본·갱신 책임·허용 지연·실패 복구/재계산을 정합니다. 즉시 일치가 필요한 중복은 그 원자적 경계를 보존합니다. 거래 당시 가격 같은 **과거 snapshot**은 현재 정의의 복제본과 의미가 다르므로 현재 값이 바뀔 때 무조건 덮어쓰지 않습니다. 이 구분은 데이터 의미에서 도출한 기준이지 특정 DB가 자동 관리하는 기능이 아닙니다.
- 행 식별 PK와 업무 고유성을 별도로 정의합니다. 대리 PK가 있어도 `(계정, 외부 식별자)`·`(계정, 작업 ID)`처럼 실제 업무상 유일해야 하는 조합은 별도 UNIQUE가 필요할 수 있습니다. 예시 이름으로 실제 없는 테이블/열을 가정하지 않습니다.
- InnoDB는 PK를 clustered index로 사용하고 보조 index에 PK 열을 포함하므로 긴 PK가 보조 index 비용에도 영향을 줍니다. SQL Server의 PK는 nonclustered로 만들 수 있으며 nonclustered locator도 clustered key 또는 heap RID로 다릅니다. PK=clustered라는 설명을 모든 DB에 적용하거나 모든 PK를 자동 증가로 바꾸지 않습니다([InnoDB index types](https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html), [SQL Server index design](https://learn.microsoft.com/en-us/sql/relational-databases/sql-server-index-design-guide?view=sql-server-ver17)).

## 인덱스와 실제 실행계획

- 실제 WHERE의 동등/범위, JOIN, ORDER/GROUP, 반환 열과 호출 빈도에서 접근 경로를 정합니다. 행 수·조건값 편중·선택도·열 상관·통계와 자료형/문자열 비교·변환을 함께 봅니다. 복합 인덱스는 단일 인덱스들의 단순 합이 아니며 '선택도 높은 열 무조건 맨 앞'만으로 prefix·정렬·범위 요구를 해결하지 않습니다. 왼쪽 prefix는 중요한 조건이지만 선행 열이 없으면 어떤 scan/다른 최적화도 불가능하다는 절대 규칙으로 확대하지 않습니다([MySQL indexes](https://dev.mysql.com/doc/refman/8.4/en/mysql-indexes.html), [SQL Server statistics](https://learn.microsoft.com/en-us/sql/relational-databases/statistics/statistics?view=sql-server-ver17)).
- WHERE에 등장하는 모든 열에 인덱스를 추가하지 않습니다. 읽기 이득과 INSERT/UPDATE/DELETE의 유지·공간·로그·경합 비용을 함께 봅니다. 기존 `(a,b)`가 있다는 이유로 `(a)`를 자동 제거하지 않고 UNIQUE/PK/FK 지원, 포함 열·정렬·폭과 실제 질의를 비교합니다. 고유성 보장용 인덱스를 조회 사용량이 작다는 이유로 제거하지 않습니다.
- 계획의 접근 경로·JOIN·sort/group, 추정/실제 rows·반복 횟수·지연을 대조합니다. scan은 작은 테이블/대부분의 행 조회에 적합할 수 있고 index 사용 자체도 좋은 성능의 증거가 아닙니다. 대표 parameter·실제 분포·DB 버전/설정·캐시·동시 부하에서 비교합니다. estimated cost를 실측 시간으로 보고하지 않습니다.
- `EXPLAIN`의 계획과 **실제 실행하는** MySQL `EXPLAIN ANALYZE`, SQL Server actual execution plan을 구분합니다. 실제 계획을 얻는다는 명목으로 운영 변경문이나 비싼 질의를 무승인 실행하지 않습니다([MySQL EXPLAIN](https://dev.mysql.com/doc/refman/8.4/en/explain.html), [SQL Server actual plan](https://learn.microsoft.com/en-us/sql/relational-databases/performance/analyze-an-actual-execution-plan?view=sql-server-ver17)). 이번 문서 검증에서 실제 DB 계획을 수집한 것은 아닙니다.

## FK를 생략한 설계의 참조 무결성

- FK가 없는 것과 논리 참조가 없는 것은 다릅니다. 참조 대상 존재, 부모 삭제/키 변경 시 거절·연쇄 정리·참조 교체 정책을 명시합니다. 일반 SELECT로 부모를 확인하고 자식을 삽입하는 사이 다른 세션이 부모를 지울 수 있으며, 단지 같은 트랜잭션으로 감싸는 것만으로 충분하지 않을 수 있습니다([InnoDB locking reads의 부모/자식 예시](https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html)).
- 자식 생성/재부모화와 부모 삭제/변경이 **모두 참여하는** 잠금·직렬화·격리 등의 공통 프로토콜을 둡니다. 자식 생성 때 부모를 잠그더라도 나중에 삭제 경로가 자식 확인 없이 부모만 지우면 고아가 생깁니다. 삭제 판단의 자식 조회가 낡은 snapshot인지도 확인합니다. 서비스뿐 아니라 관리 도구·배치·마이그레이션·복구 writer를 포함하고, 단일 작성자를 선택했다면 기존 소유권/펜싱 전제를 지킵니다.
- 고아/참조 오류의 사후 점검·복구 담당을 정하되 주기 scan을 온라인 무결성 강제와 동등하게 보지 않습니다. MySQL의 `foreign_key_checks`를 다시 켜도 비활성 기간에 넣은 기존 데이터를 자동 재검증하지 않습니다([MySQL FK](https://dev.mysql.com/doc/refman/8.4/en/create-table-foreign-keys.html)). 기존 FK의 일시 비활성화와 애초 FK를 두지 않는 정책도 구분합니다.
- FK와 조회 인덱스의 역할을 구분합니다. InnoDB는 필요한 자식 FK prefix index가 없으면 생성하지만 SQL Server는 FK 정의만으로 자식 index를 자동 생성하지 않습니다. FK를 생략해도 JOIN/참조 조회용 index가 불필요해지는 것은 아닙니다([SQL Server PK/FK](https://learn.microsoft.com/en-us/sql/relational-databases/tables/primary-and-foreign-key-constraints?view=sql-server-ver17)).

## 앱·프로시저·트랜잭션·동시 갱신

- 앱 코드와 SP의 선택은 규칙 변경/검증·배포·운영 책임, 네트워크 왕복·DB 처리 단위로 판단합니다. SP는 여러 명령을 한 호출로 묶을 수 있지만 그 이름 자체가 전체 원자성·hot-row 경합 해소·성능 우열을 보장하지 않습니다. 호출자/프로시저 중 트랜잭션 소유자와 중첩 호출·오류 처리를 명시합니다. MySQL 저장 프로그램의 `BEGIN…END`는 transaction 시작이 아닙니다([MySQL COMMIT/ROLLBACK](https://dev.mysql.com/doc/refman/8.4/en/commit.html), [SQL Server transaction guide](https://learn.microsoft.com/en-us/sql/relational-databases/sql-server-transaction-locking-and-row-versioning-guide?view=sql-server-ver17)).
- 잔액 차감과 상태 변경처럼 원자적으로 지킬 업무 묶음은 유지하면서 불필요한 계산·외부 I/O·사용자 대기를 잠금 구간 밖으로 뺍니다. 너무 잦은 commit과 너무 긴 transaction은 다른 비용입니다. 잠금/스캔 범위·기간·격리·row-version/undo 보관·왕복·commit/log·동시 경합·rollback/retry를 함께 보고 원자성을 쪼개거나 내구성 설정을 낮춰 비용을 숨기지 않습니다([InnoDB transaction tuning](https://dev.mysql.com/doc/refman/8.4/en/optimizing-innodb-transaction-management.html)).
- SELECT한 값을 앱에서 계산해 무조건 덮어쓰지 않습니다. 검증된 입력에 대한 조건부 DML, 필요한 잠금을 유지하는 읽기, expected-version을 비교하는 OCC 중 불변조건에 맞는 방식을 선택합니다. 한 행의 version 검사가 다중 행/범위·부재/새 삽입까지 보호하지는 않습니다. statement별 수락/충돌/부재를 구별하고 필수 조건 실패 시 전체 업무 묶음을 되돌립니다. connector의 **matched rows와 changed rows** 의미를 확인하며 MySQL의 동일값 UPDATE 결과 0을 조건 불일치와 무조건 동일시하지 않습니다([MySQL UPDATE](https://dev.mysql.com/doc/refman/8.4/en/update.html)).
- 모든 관련 경로의 자원/행 접근 순서를 맞추고 deadlock으로 **확정 rollback된** 업무는 마지막 SQL만이 아니라 transaction 전체를 재실행합니다. 일관 순서로도 deadlock이 완전히 사라진다고 보장하지 않습니다. 재시도 대상·상한·분산 대기를 정하며 commit 중 연결 단절/timeout의 결과 불명은 확정 rollback과 구분해 원래 작업 ID의 저장 결과로 해결합니다([MySQL deadlocks](https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlocks-handling.html), [SQL Server deadlocks](https://learn.microsoft.com/en-us/sql/relational-databases/sql-server-deadlocks-guide?view=sql-server-ver17), [commit unknown](https://learn.microsoft.com/en-us/ef/core/miscellaneous/connection-resiliency#transaction-commit-failure-and-the-idempotency-issue)). 외부 부수효과도 재시도로 중복시키지 않습니다.
- 여러 SELECT를 한 transaction에 넣었다고 항상 같은 snapshot을 보는 것은 아닙니다. InnoDB REPEATABLE READ의 일반 consistent read는 첫 consistent read snapshot을 공유하고 READ COMMITTED는 각 read가 새 snapshot입니다. SQL Server RCSI는 statement 기준이고 SNAPSHOT isolation은 transaction 기준입니다. 실제 옵션·locking read와의 차이를 확인하며, 불변 데이터를 version ID로 결박할 수 있는데 장기 snapshot transaction을 불필요하게 유지하지 않습니다([MySQL consistent read](https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html), [SQL Server isolation](https://learn.microsoft.com/en-us/sql/t-sql/statements/set-transaction-isolation-level-transact-sql?view=sql-server-ver17)).

## 전체 교체와 DDL의 경계

테이블 전체 교체는 삭제 뒤 삽입 실패·중간 조회·장시간 잠금·복구를 고려합니다. DELETE+INSERT, TRUNCATE, 임시 테이블, atomic DDL을 같은 rollback 계약으로 취급하지 않습니다. 전체 교체는 점검 중 재생성이나 적합한 transaction/staging·버전 전환의 **선택지**이지 무조건 안전한 기본 절차가 아닙니다.

| 확인한 제품/명령 | 계약과 주의 |
|---|---|
| MySQL 8.4/InnoDB DML | 적합한 transactional 테이블·동일 transaction 범위이며 중간 implicit commit이 없을 때 묶음 rollback을 검토합니다. 비트랜잭션 엔진까지 보장하지 않습니다. |
| MySQL 8.4 `TRUNCATE TABLE` | implicit commit하는 DDL이며 사용자 rollback으로 되돌릴 수 없습니다. crash atomic DDL은 해당 DDL의 장애 원자성이지 후속 INSERT까지의 원자성이 아닙니다. |
| MySQL temporary DDL | CREATE/DROP TEMPORARY TABLE은 implicit commit 예외여도 생성/삭제 자체가 사용자 rollback되는 것은 아닙니다. 다른 DDL/인덱스 작업의 경계도 따로 확인합니다. |
| SQL Server `TRUNCATE TABLE` | transaction 안에서 rollback 가능하지만 SCH-M/page 잠금·identity 재설정·DELETE trigger 미실행·FK 등 제한이 있습니다. 무차단 읽기나 CDN 동시 전환 보장은 아닙니다. |
| Azure Synapse Analytics | 같은 이름의 TRUNCATE라도 transaction 안에서 실행할 수 없습니다. SQL Server와 동일시하지 않습니다. |

근거: [MySQL TRUNCATE](https://dev.mysql.com/doc/refman/8.4/en/truncate-table.html), [implicit commit](https://dev.mysql.com/doc/refman/8.4/en/implicit-commit.html), [SQL Server TRUNCATE](https://learn.microsoft.com/en-us/sql/t-sql/statements/truncate-table-transact-sql?view=sql-server-ver17). 운영 변경은 백업·호환성·복구 가능성을 실제 대상에서 확인한 뒤 승인된 범위에서만 수행합니다.

## 동적 캐시와 성능 수락

- DB 정본의 재생성 가능한 파생 cache인지, 단일 작성자 메모리가 실행 권위이고 뒤에서 영속화하는 구조인지 먼저 정합니다. 후자는 일반 cache-aside와 달리 내구 확정·허용 손실·작성자 소유권/인계 계약을 따로 요구합니다. 아직 내구화되지 않은 권위 상태를 평범한 캐시처럼 퇴출/재초기화하지 않습니다.
- cache-aside는 store/cache 일관성을 자동 보장하지 않습니다. DB 저장 성공 뒤 무효화 실패, 옛 값을 읽은 요청의 늦은 재게시, 오래된 저장 완료, 다중 인스턴스·운영 도구의 우회 갱신을 포함해 허용 stale·revision/무효화·실패 복구를 정합니다. TTL이나 공유 cache만으로 즉시 일관성·단일 작성자·원자성이 생기지 않습니다([Azure Cache-Aside](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside)).
- 실제 요청의 query 수·중복 조회·결과 바이트·계획/행 수·DB 왕복·잠금/commit·앱 조회/할당·큐 대기·동시 부하를 분해하고 평균과 p95/p99를 비교합니다. 개선 전후 같은 데이터 분포·parameter·환경을 사용하고 정상뿐 아니라 충돌·deadlock·저장/무효화 실패·장애 복구를 확인합니다. DB 내부 실행 시간과 애플리케이션의 전체 응답 시간을 구분합니다.

## 확인 범위

공식 자료 확인일: 2026-10-15. MySQL/InnoDB·SQL Server의 지원 범위와 실제 격리/스토리지/드라이버 설정을 적용할 프로젝트에서 다시 대조합니다. 이 문서 작업은 자료 검증이며 DB 설치·스키마 변경·실행계획 수집·성능 벤치마크를 수행한 결과가 아닙니다. JOIN·FK·SP·정규화·JSON·LINQ의 일률적인 성능 우열은 판정하지 않습니다.

## 도메인별 적용

- 서비스의 멱등성·소유권 펜싱은 [공통 서비스 수명](/development/service-lifecycle.md), 정적 콘텐츠와 CDN/메모리의 버전 전환은 [데이터 생명주기](/development/data-lifecycle.md)에서 이 공통 기준을 적용합니다. 게임의 실행 권위·내구성·결과 공개는 [게임 서버 영속화](/game/server-persistence.md), 정적/동적 분류와 공개·권위 경계는 [게임 정적 데이터](/game/static-data.md)를 함께 확인합니다. 해당 게임 정책을 일반 서비스의 고정 기본값으로 확대하지 않습니다.

## SQLite 조건부 갱신·멱등 영수증·실패 검증

아래는 SQLite를 사용하는 해당 저장 구조의 구체 계약과 관찰 사례입니다. 다른 connector의 matched/changed rows나 정상 0행 의미에 기계적으로 적용하지 않습니다. `gold`·계정/캐릭터는 잔액과 사용자 범위 작업의 예시이며 실제 스키마 이름으로 추정하지 않습니다.

### Statement 수명과 WAL
- [ ] 단일 작성자 SQLite 서비스는 캐시한 prepared statement를 scope 종료(성공·실패·조기 반환 포함)마다 reset한다. 결과를 다 읽지 않은 SELECT가 `SQLITE_ROW`에 머물면 이후 COMMIT 뒤에도 같은 연결의 읽기 트랜잭션이 남아 WAL checkpoint가 진행되지 않고 WAL이 계속 커진다([SQLite 포럼 설명](https://sqlite.org/forum/forumpost/9fba47556b): 열린 SELECT가 있는 연결은 checkpoint를 실행할 수 없다. [WAL 문서](https://sqlite.org/wal.html#avoiding_excessively_large_wal_files): 열린 읽기 트랜잭션이 있으면 checkpoint가 WAL을 reset하지 못해 WAL이 한없이 커질 수 있다. 확인 2026-10-12). checkpoint 임계값을 넘는 커밋 뒤 WAL 크기·완전 checkpoint를 회귀로 확인한다.

### 업무 갱신과 재시도 결과
- [ ] 조건부 갱신(`UPDATE … SET gold = gold - ? WHERE id = ? AND gold >= ?`)은 statement별 영향 행 수([`sqlite3_changes`](https://sqlite.org/c3ref/changes.html))가 기대값과 같을 때만 성공으로 보고, 다르면 트랜잭션 전체를 되돌린다. 묶음 전체의 성공 flag나 영향 행 합계만 보면 0행 일치를 성공으로 오인하고 어느 조건이 실패했는지 알 수 없다(SQLite 문서 조회 2026-10-11). 다음을 함께 지킨다.
  - 작업 ID 기록: 결과를 모르는 timeout 뒤 재시도에 대비해 작업 ID를 업무 갱신과 같은 트랜잭션에서 먼저 `(계정·캐릭터 ID, 작업 ID)` 쌍의 UNIQUE 기록([`INSERT … ON CONFLICT DO NOTHING`](https://sqlite.org/lang_upsert.html))으로 남긴다. 클라이언트가 고른 ID를 전역 UNIQUE로 두면 다른 사용자의 결과를 받거나 그 작업을 막을 수 있다.
  - 재시도 처리: 그 INSERT의 영향 행이 0이면 이미 적용된 작업이므로 업무 갱신을 실행하지 않고 처음 실행 때 작업 ID와 함께 저장한 결과를 돌려준다. 요청 내용의 digest도 함께 저장해 같은 작업 ID에 다른 내용이 오면 저장 결과를 돌려주지 않고 거부한다. 권한·문법 같은 영구 오류는 재시도하지 않는다.
  - 값 전달·저장: 값은 문자열 조립 대신 bind로 넘기고 수치·시각은 locale과 무관한 형식(정수·UTC epoch)으로 저장한다. 모델 전체를 덮어쓰는 갱신 대신 서버가 계산하는 증감이나 version 비교 갱신을 쓴다.
- [ ] 영향 행 확인의 회귀 테스트는 행을 미리 지우는 방식으로 만들지 않는다. 그러면 앞선 조회의 NOT_FOUND나 INSERT 분기만 지나가 새 검사에 닿지 않는다. 대상 UPDATE에만 `BEFORE UPDATE` trigger와 `SELECT RAISE(IGNORE)`를 걸면 사전 조회는 통과하고 그 statement만 오류 없이 0행으로 끝난다([SQLite CREATE TRIGGER](https://sqlite.org/lang_createtrigger.html)). 이 상태에서 실패 상태값, 같은 transaction의 앞선 쓰기 rollback(여러 행 묶음이면 앞 행까지 포함), 성공 receipt 미기록, trigger 제거 뒤 재시도 성공을 확인한다. 정확한 replay·캐시된 실패·변경 없는 행 건너뛰기·0..N행이 정상인 일괄 정리는 그대로 통과하는지도 함께 확인한다(2026-10-11 적용, 수정 전 코드에서 실패함을 확인).


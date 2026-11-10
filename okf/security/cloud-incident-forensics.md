---
type: Checklist
title: 클라우드 침해 조사의 로그 공백·신원 판별·노출 범위 (AWS·GCP)
description: AWS·GCP 침해 조사에서 "기록 없음"이나 "탈취 사용"으로 판정하기 전에 확인할 비자명 계약 — 보존이 짧은 출처, CloudTrail의 리전·트레일 중지·이벤트 기록 한계와 요청 본문을 가리는 API, EKS 토큰 검증과 Lambda 환경 변수 복호화가 남기는 정상 흔적, 데이터 이벤트만 쓰는 자격 증명의 기준선, 접근 로그 읽기 함정, 애플리케이션 로그의 교차 테넌트 신호, 노출 범위(Terraform state·Lambda 관리형 정책), GCP 데이터 접근 로그 공백과 대체 근거, 키 교체 없이 출발지로 제한하는 수단의 한계를 다룬다.
tags: [security, incident-response, forensics, aws, cloudtrail, gcp, terraform, logs]
timestamp: 2026-11-10T00:00:00Z
---

# 클라우드 침해 조사의 로그 공백·신원 판별·노출 범위

부재를 근거로 삼는 판정의 일반 원리는 [워크플로](/workflow.md#검증)와 [런타임 진단](/development/runtime-diagnostics.md#측정과-검증의-범위)을 따른다. 로그 조회 비용, CloudWatch Logs 적재 신선도, RDS 확장 모니터링으로 하는 DB 접속 귀속은 [런타임 진단](/development/runtime-diagnostics.md)에 있다. 아래 조건은 적힌 확인 날짜 기준이며 서비스 동작이나 계정의 로깅 설정이 바뀌면 다시 확인한다.

## 보존과 수집 순서

- [ ] 보존이 짧은 출처는 노출을 안 시점에 먼저 받아 둔다. SSM 명령 기록은 30일([Run Command](https://docs.aws.amazon.com/systems-manager/latest/userguide/running-commands.html)), CloudWatch 1분 지표는 15일, CloudTrail 이벤트 기록은 90일이고, GCP `_Default` 로그 버킷은 프로젝트마다 보존이 조정돼 있을 수 있어(관찰 2026-11-10: 2일·7일) 프로젝트별로 확인한다. 서버 로그가 순환됐으면 "기록 없음"으로 판정하기 전에 로드밸런서 접근 로그처럼 수명 주기 규칙 없이 남는 출처를 찾는다.

## AWS CloudTrail

- [ ] `lookup-events`(이벤트 기록)는 리전별이다. IAM·STS 전역 엔드포인트·CloudFront 이벤트는 `us-east-1`에 기록되므로([전역 서비스 이벤트](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-concepts.html#cloudtrail-concepts-global-service-events), 확인 2026-11-10) 홈 리전만 조회하면 IAM 열거·키 생성이 통째로 빠진다(관찰 2026-11-09: 홈 리전 조회에서 공격자의 IAM 역할·정책 열거 수백 건이 보이지 않았다). 계정 전체의 부재를 주장할 때는 의심 키·세션 이름으로 모든 활성 리전을 조회하고 결과마다 조회한 리전을 적는다.
- [ ] 트레일이 꺼졌던 구간은 S3 전달 파일과 그것을 원본으로 한 Athena 테이블이 비어 있어 "0건"으로 나온다. 0건을 결론으로 쓰기 전에 `get-trail-status`(`IsLogging`·`StartLoggingTime`·`StopLoggingTime`)와 이벤트 선택기를 확인해 결과에 함께 적는다. 이벤트 기록은 트레일과 무관하게 최근 90일 관리 이벤트를 주지만 출발지 IP로 거를 수 없고 계정·리전당 초당 2건으로 제한되므로([LookupEvents](https://docs.aws.amazon.com/awscloudtrail/latest/APIReference/API_LookupEvents.html)) 이벤트 이름·키 ID·리소스 이름별로, 하루 단위로 나눠 조회한다. 트레일이 켜진 구간은 S3 전달 파일을 받아 로컬에서 거르는 쪽이 빠르고 IP로도 거를 수 있다. 전달 파일 이름의 시각은 파일을 쓴 시각이라 그 안의 이벤트는 모두 그보다 앞서므로, 구간 끝 뒤에 쓰인 파일까지 포함한다.
- [ ] 일부 API는 CloudTrail에 요청 본문을 남기지 않는다. SSM `SendCommand`에는 명령 본문이 없고, Athena `StartQueryExecution`·`CreateNamedQuery`의 `queryString`은 `***OMITTED***`다([Athena CloudTrail](https://docs.aws.amazon.com/athena/latest/ug/monitor-with-cloudtrail.html)). 명령과 출력은 SSM 명령 기록(`list-commands`, `list-command-invocations --details`, 출력은 플러그인당 2,500자까지, [CommandPlugin](https://docs.aws.amazon.com/systems-manager/latest/APIReference/API_CommandPlugin.html))에서, 쿼리 본문은 그 작업 그룹의 Athena 쿼리 기록에서 보며 각각의 조회 권한(`ssm:ListCommandInvocations`, `athena:GetQueryExecution`)을 따로 받아야 한다.
- [ ] EKS의 `kubectl`·kubelet 인증 토큰은 미리 서명한 `sts:GetCallerIdentity` 요청이고 EKS 컨트롤 플레인이 그것을 실행해 신원을 확인한다. 그래서 CloudTrail에는 토큰 주인(IAM 사용자·노드 역할) 이름의 `GetCallerIdentity`가 계정 소유가 아닌 AWS 대역 IP에서 남는다([AWS re:Post](https://repost.aws/ko/articles/ARI6Fv-138Sr6Av-cW64gYNQ)). 관찰(2026-11-10)한 UA는 `Go-http-client/1.1`이었고, 같은 IP에서 노드·오토스케일러 역할의 같은 호출이 수천 건이면 그 클러스터의 엔드포인트다. 사용자 키의 "AWS 대역 출발지 `GetCallerIdentity`"를 개인 EC2나 탈취 사용으로 판정하기 전에 이 형태인지 본다.
- [ ] Lambda `ListFunctions`·`GetFunction`·`GetFunctionConfiguration` 응답에는 환경 변수가 평문으로 담긴다. 탈취한 자격 증명으로 `ListFunctions`를 부르자 같은 세션 이름으로 `lambda.amazonaws.com`이 대신 호출한 KMS `Decrypt`가 대량으로 남았다(관찰 2026-11-09). 이 묶음은 함수 환경 변수가 응답으로 나갔다는 흔적이므로, 그 환경 변수에 든 비밀을 모두 노출로 본다.
- [ ] 데이터 이벤트(S3 객체 읽기·쓰기 등)만 하는 서비스 자격 증명은 정상 상태의 관리 이벤트가 0건이다. 그런 사용자 이름으로 관리 이벤트가 한 건이라도 나오면 출발지·UA와 무관하게 의심으로 본다(`GetCallerIdentity`·`ListBuckets` 포함). 이 기준선은 IOC(IP·UA) 대조가 놓치는 재유출을 잡지만, 재유출된 키가 데이터 작업에만 쓰이면 S3 서버 접근 로그나 CloudTrail 데이터 이벤트가 켜져 있어야 보인다. `get-access-key-last-used`의 서비스·리전이 평소와 다른지도 함께 본다.

## 접근 로그와 애플리케이션 로그

- [ ] ALB 접근 로그는 클라이언트 IP와 쿼리 문자열을 포함한 전체 URL을 남겨 인스턴스 로그가 순환된 구간을 복원하는 데 쓴다. 필드 수가 계속 늘어 왔으므로(관찰 2026-11: 30개 초과) 열 수를 적게 지정하고 DuckDB `read_csv(..., ignore_errors=true)`로 읽으면 최근 행이 오류 없이 빠진다. 열을 넉넉히 지정해 읽고 거부된 행 수(`store_rejects`의 `reject_errors`)가 0인지 확인한다. 0바이트 `.gz`가 섞여 있으면 gzip 오류로 읽기 전체가 멈추므로 크기가 0보다 큰 파일 목록만 넘긴다.
- [ ] 애플리케이션 로그로 교차 테넌트 시도를 찾을 때, 신원 헤더를 인증 성공 때만 덮어쓰는 미들웨어에서는 인증 전·거절 행의 신원 필드가 클라이언트가 보낸 값일 수 있다([코드 리뷰 보안 체크리스트](/security/review-checklist.md)의 신원 헤더 항목). 요청자는 서버가 값을 채운 성공 행에서 같은 토큰 해시로 붙이고 토큰 원문은 출력하지 않는다. 소유자 범위로 좁혀 조회하는 경로는 남의 ID에 오류 없이 빈 결과를 돌려 거절 신호가 남지 않으므로, 오류 로그가 없다고 시도가 없었다고 판정하지 않는다.

## 노출 범위

- [ ] 노출된 자격 증명의 범위를 잡을 때 SSM·Secrets Manager·Lambda 환경 변수만 보지 말고 Terraform state(버전 관리 버킷이면 이전 버전 포함)를 본다. state에는 리소스 속성과 `sensitive` 출력이 평문으로 들어 있다([state의 민감 데이터](https://developer.hashicorp.com/terraform/language/state/sensitive-data)). `aws_iam_access_key`를 `pgp_key` 없이 만들면 `secret`과 `ses_smtp_password_v4`가 남고([aws_iam_access_key](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_access_key)), `kubernetes_secret`의 `data`와 `helm_release`의 `set` 값도 그대로 있다. `ses_smtp_password_v4`는 비밀 키와 리전에서 계산한 값이라 키를 교체하면 함께 무효가 된다. 값은 내려받지 않고 위치·길이·해시 앞자리만 목록으로 만든다. 재발급한 키가 state·SSM·환경 변수에 다시 평문으로 들어갔는지도 확인한다.
- [ ] AWS 관리형 정책 `AWSLambdaExecute`는 `logs:*`와 함께 모든 버킷(`arn:aws:s3:::*`)의 `s3:GetObject`·`s3:PutObject`를 허용한다([AWSLambdaExecute](https://docs.aws.amazon.com/aws-managed-policy/latest/reference/AWSLambdaExecute.html), 확인 2026-11-10). 이 정책을 붙인 실행 역할의 자격 증명은 state 버킷 같은 민감 버킷을 읽고 쓸 수 있으므로, 노출 범위를 잡을 때와 리뷰에서 실행 역할에 붙은 관리형 정책의 리소스 범위를 확인한다.

## GCP

- [ ] Cloud Storage·Cloud Functions·Cloud Run의 데이터 접근 감사 로그는 프로젝트·폴더·조직 IAM 정책의 `auditConfigs`로 켜지 않으면 없다([데이터 접근 감사 로그](https://cloud.google.com/logging/docs/audit/configure-data-access)). 꺼져 있으면 GCS 객체 반출은 감사 로그로 판정할 수 없으므로, 상위 조직 정책까지 조회해 꺼진 것을 확인한 뒤 "판정 불가"로 적는다.
- [ ] 감사 로그가 없는 호출의 대체 근거와 그 한계:
  - Cloud Run(2세대 함수 포함)의 플랫폼 요청 로그 `run.googleapis.com/requests`에는 `httpRequest.remoteIp`·`userAgent`와, Eventarc 전달이면 원본 Pub/Sub 토픽 레이블이 있지만 호출 신원(서비스 계정·키)은 없다. Pub/Sub push 전달은 UA `APIs-Google`로 Google 대역 IP에서 온다. 이 로그만으로 특정 키의 호출 여부를 판정하지 않는다(관찰 2026-11-10).
  - 서비스 계정별 API 사용량은 Monitoring `serviceruntime.googleapis.com/api/request_count`(자원 `consumed_api`, 레이블 `credential_id="serviceaccount:<uniqueId>"`·`service`·`method`)로 시간별로 센다. 키가 아니라 계정 단위이고 출발지가 없으며, GCS(`storage.googleapis.com`)는 이 지표에 나오지 않았다(관찰 2026-11-09).
  - 감사 로그가 있는 호출은 `protoPayload.authenticationInfo.serviceAccountKeyName`에 키 ID 전체가 있어 같은 계정의 키별로 가를 수 있다.
  - BigQuery 사용은 `INFORMATION_SCHEMA.JOBS_BY_PROJECT`(180일)의 쿼리 형태를 노출 전과 비교한다.
- [ ] Policy Analyzer의 `serviceAccountKeyLastAuthentication`은 관측 끝이 조회 시각보다 수일 늦어(관찰 2026-11-09: 약 6일) 노출 직후의 사용 판정에는 쓰지 않고, 정상 서비스가 쓰는 키인지(비활성화해도 되는지) 가르는 데 쓴다. 해당 API가 꺼진 프로젝트에서 gcloud가 quota project 오류로 실패하면 `gcloud auth print-access-token` 토큰으로 `x-goog-user-project` 헤더 없이 REST를 호출하면 된다(관찰 2026-11-09).
- [ ] 권한 유무는 `gcloud projects describe` 거부로 판단하지 않는다. describe가 거부된 프로젝트에서도 로그 조회(`logging.logEntries.list`)·IAM 정책·키 목록 조회는 됐다(관찰 2026-11-09). 필요한 조회를 `--limit=1`로 직접 시도해 판정한다.
- [ ] 키를 교체하지 않고 출발지로 제한하는 수단은 Google API 전반의 VPC Service Controls ingress 규칙(신원 조건과 접근 수준의 IP 조건을 함께 만족해야 통과)과 GCS 버킷 IP 필터다. 버킷 IP 필터는 신원을 가리지 않아 모든 요청자에 적용되고 BigQuery의 GCS 적재·내보내기·외부 테이블 조회를 막는다([버킷 IP 필터](https://docs.cloud.google.com/storage/docs/ip-filtering-overview)). IAM 조건의 접근 수준 속성은 IAP만 인식하고([속성 참조](https://docs.cloud.google.com/iam/docs/conditions-attribute-reference)), 거부 정책 조건은 리소스 태그만 인식하며([IAM 조건](https://docs.cloud.google.com/iam/docs/conditions-overview)), Cloud Run 호출에는 VPC SC가 클라이언트의 IAM 인증 정보를 쓰지 않아 신원 기반 ingress 규칙을 쓸 수 없다([Cloud Run과 VPC SC](https://docs.cloud.google.com/run/docs/securing/using-vpc-service-controls)). 허용할 출구 IP가 다른 워크로드와 공유하는 NAT이면 제한 효과가 없으므로 출구 분리가 먼저다(확인 2026-11-10).

# Change Log

이 문서는 변경 당시의 기록이며 현재 설정·지원 사양의 근거가 아니다. 현재 안내는 소스 설정과 해당 concept을 따른다. 오류가 확인된 과거 설명은 정정 표시를 우선한다.

## 2026-09-29
* **Clarify — 가독성**: [언어 공통 코딩 스타일](/language-style.md)의 독립 제어문·다음 문장 사이 빈 줄과 연결된 `else`·`catch`·`do`–`while` 예외를 구체화합니다. 멤버는 역할·불변조건별로 묶고 상수·정적 상태·인스턴스 상태 및 메서드와 구분하며, C++ 초기화·소멸·레이아웃 계약을 보존하도록 명시합니다. Good/Bad 예시·완료 전 확인·요약표와 글로벌 지침·[코딩 스타일](/coding-style.md)·index의 진입 경로를 보강합니다. 한 줄 우선은 식의 폭에 관한 규칙이며 세로 여백 생략이 아님을 명확히 합니다.
* **Correction / Clarify — 가독성 전반**: [언어 공통 코딩 스타일](/language-style.md)의 기존 관례 우선 규칙과 작성·수정 범위의 가독성 최소 기준을 분리합니다. 문장 압축·복합 조건·중첩 삼항·함수 책임·람다·switch 경로, 이름/단위·호출 인수·일반 주석 기준을 보강하고 상수·정적 상태 및 C 예제의 간격 불일치를 수정합니다. 멤버의 초기화, 모든 언어의 중간 삽입/재배치 계약, 평가 순서·수명·복사/할당·성능 배치를 보호하며, 조건식과 역할별 배치 예제·요약표·글로벌 진입 안내를 맞춥니다. 긴 선언/호출을 폭만으로 접지 않는 선택과 무관한 재포맷 금지는 유지합니다.
* **Clarify — 간결성과 압축의 구분**: [코딩 스타일](/coding-style.md)의 결정 사다리 6단계 “한 줄로 되는가? 한 줄로 끝낸다”와 글로벌 요약의 “한 줄”을 “간단한 식·기존 호출”로 명확히 합니다. 최소 구현을 택한다는 의도는 유지하면서 여러 문장·블록을 한 줄로 압축하라는 오해를 막습니다. 선언·시그니처·호출·체인을 폭 때문에 접지 않는 한 줄 우선과 선언당 변수 하나 원칙은 유지합니다.

## 2026-09-28
* **Policy — 외부 코드의 일괄 격리 의무 대체**: 글로벌 지침·[보안 개요](/security/overview.md)·[스킬](/tools/skills.md)의 OS 격리 선행 의무를 사용자 요청·승인 범위 기준으로 교체한다. 단순 조사·검토에 격리 환경 구축·설치·실행 검증을 자동 추가하지 않으며, 설치 요청과 대표 작업 실행 검증을 구분한다. 자동 로드의 실행 가능성, worktree·프로필·승인 목록과 OS 격리의 차이, 요청 밖 접근·변경의 승인 및 보호 설정 우회 금지는 유지한다.
* **Clarify**: 글로벌 지침의 외부 코드 실행 규칙을 축약하되 자동 메모리가 새 실행 권한을 부여하지 못한다는 점과 저장소를 작업 디렉터리로 한 세션 시작도 실행 범위에 포함함을 유지한다. 글로벌 지침·[스킬](/tools/skills.md)의 요청 밖 접근·변경 조건을 자체 점검으로 해석할 수 있는 “확인”에서 “사용자 승인”으로 명확히 한다.
* **Learning**: [Godot + C++ 개발](/game/godot-cpp.md)에 클라이언트 내부 로컬 호스트와 엔진 비의존 콘텐츠 코어의 분리, 명령 접수/판정 결과, 충돌·좌표·콘텐츠 데이터의 이식 경계를 추가합니다. 온라인 전환의 단일 권위·예측/서버 전용 데이터 분리, 오프라인 상태의 비신뢰와 빈 서버 추상화 선행 생성 금지를 설계 기준으로 명시합니다. 실제 인게임·서버 이관 구현이나 성능 검증을 주장하지 않습니다.
* **Clarify**: [네트워크 동기화](/game/network-sync.md)에 sequence가 부여된 입력의 병합·접수 거부·중복도 명시적 완료 의미가 필요함을 추가합니다. 병합으로 누적 ACK에 구멍을 만들지 않고 번호 부여/접수 실패·pending 정리와 전송 후 timeout의 재사용 금지를 구분합니다.
* **Learning**: [Godot + C++ 개발](/game/godot-cpp.md)에 공식 문서를 대조한 관찰 이탈/권위 파괴의 구분, 표시 chunk·판정 데이터·서버 소유권·AOI 분리, 배경 로딩 완료·장면 수명, 원격/로컬 보간과 모바일 지속 성능 예산을 추가합니다. 최신 기술 이름·호스팅 기능을 자동 채택하거나 웹 자료를 실제 게임 성능 증거로 확대하지 않습니다.
* **Clarify**: [네트워크 동기화](/game/network-sync.md)에 TCP 연결 내 전송 보장과 콘텐츠 처리/커밋, I/O readiness API와 RPC 계층의 구분을 추가합니다. UDP용 신뢰성 계층의 기계적 중복 구현, 제출된 송신 버퍼의 수정, RPC 취소의 rollback 오해를 방지하고 입력 재실행·rewind·물리 rollback은 게임 요구별 선택으로 한정합니다. 특정 프로젝트의 전송 선택·개인 경력은 공개 규칙으로 일반화하지 않습니다.
* **Learning**: [Godot + C++ 개발](/game/godot-cpp.md)에 장치 입력과 게임 의도의 분리, 직접 조작/목적지 경로 전환, 비활성 중립 입력의 간섭 방지, 터치별 포인터 소유권·취소·합성 mouse 중복 방지를 추가합니다. 일반 Button의 터치 에뮬레이션과 TouchScreenButton의 다중 터치·배치 계약을 구분하며 특정 프로젝트의 키/조작 선택은 공개 기본값으로 강제하지 않습니다.
* **Correction / Learning**: [Godot + C++ 개발](/game/godot-cpp.md)에 별도 검증 화면과 실제 에디터/F5 적용의 구분, editor feature와 editor_hint 차이, 비배포 참고 자료의 owner 없는 표시 자식·직렬화 제외와 레터박스 배경을 추가합니다. 에디터 빌드 실행 및 surface pack/instantiate로 검증한 범위이며 실제 export 패키지 검증으로 확대하지 않습니다.
* **Correction**: [Godot + C++ 개발](/game/godot-cpp.md)의 검증 범위를 정정합니다. 문서 말미의 일괄 미실행 선언을 항목별 UI·시그널·직렬화 실행 관찰과 예제·빌드 조합·플랫폼별 절차 전체의 검증을 구분하는 설명으로 대체합니다. 기존 개별 실행 기록을 전체 플랫폼의 실행 성공 보장으로 확대하지 않습니다.
* **Learning**: [Godot + C++ 개발](/game/godot-cpp.md)에 고정 엔진 소스·실행 확인을 근거로 터치보다 먼저 전달되는 합성 mouse, 텍스트 컨트롤의 내부 스크롤바, non-toggle 버튼 feedback, 포커스 밖 key release와 새 press, 휠 press/release 쌍, CanvasLayer HUD의 viewport 크기와 지도 표시 사각형의 구분을 추가합니다. 논리 입력·Windows OS 입력 검증을 실제 모바일 기기 검증으로 확대하지 않습니다.
* **Learning**: [게임 클라이언트 체크리스트](/game/client-checklist.md)에 로컬 Android AAR의 외부 의존성 명시, C# 컴파일과 최종 DEX 검증의 구분, 누락 클래스의 기기 로그·바이트코드·정의 대조와 양성 대조 기준을 추가. 공개 Android 문서를 근거로 AndroidX Core와 WebKit을 구분하며 프로젝트 식별자·자격증명·벤더 내부 구현은 기록하지 않는다.
* **Learning**: [게임 클라이언트 체크리스트](/game/client-checklist.md)에 Unity Android 의존성 XML의 실제 EDM4U 주입 검증, 임포트·Resolve 프로세스 분리, Jetifier 템플릿 전제, 원본 캐시 대신 패키지 복사본 사용, AAR 호환성 하한과 배포 SHA-256·GUID 보존을 추가. Unity 2022.3.62f3·EDM4U 1.2.188의 확인 범위를 명시하고 일반 Gradle 소비 빌드와 자동 해석·AAR 복사 모드를 구분한다.
* **Learning**: [Godot + C++ 개발](/game/godot-cpp.md)에 2D 카메라 배율의 길이/면적, 화면비 시야 상한과 동일 구도의 차이, 같은 유형 게임·HCI 연구의 적용 한계, 실제 변위 기반 애니메이션 재생률을 추가합니다. OS 입력 검증의 DOWN/UP 예외 안전성도 기록하며 특정 프로젝트의 줌·이속을 보편 최적값으로 일반화하지 않습니다.

## 2026-09-27
* **Correction — 공개 범위는 아래 Publish로 대체**: [코딩 스타일](/coding-style.md)과 글로벌 지침의 개인 스타일 발견을 C/C++ 한정에서 모든 언어로 확장했다. 별도 네이밍 폴백 표의 중복·충돌을 제거하고 언어의 공개성·예약 이름·자동 탐색·포매터 계약과 C/C++·엔진 전용 규칙의 적용 경계를 분리했다.
* **Publish**: 승인된 전체 [언어 공통 코딩 스타일](/language-style.md)을 공개 정본으로 전환한다. 로컬 전용 유지 방침을 이 가이드에 한해 대체하고 중복 정본 없이 배포하며, 새 clone에서도 PascalCase 타입/함수·mPascalCase 필드·camelCase 지역/인자·UPPER_SNAKE_CASE 상수/enum 값과 언어별 예외를 읽도록 글로벌 지침·index·Godot 가이드를 연결한다. 기존 서버 네이밍 접미사는 유지한다.
* **Learning**: [Godot + C++ 개발](/game/godot-cpp.md)에 Godot 4.7.2 시그널의 미연결·차단 상태 반환값과 정상 setter 갱신/선택적 알림의 구분을 추가한다. 고정 엔진 소스와 실제 import·headless·창 실행에서 검증한 계약이며, 모든 non-OK 반환값을 초기화 오류로 취급하는 잘못된 방어를 방지한다.
* **Learning**: [Godot + C++ 개발](/game/godot-cpp.md)에 실제 UI 검증으로 확인한 동기 visibility/focus 시그널 재진입, 컨테이너 포인터 무효화, 가드 해제 시 수명/입력 복구와 완료 알림에서 연결된 창의 보존을 추가한다. 공통 UI/게임 어댑터 분리, 논리 좌표·플랫폼 검증 경계, 동적 Label 폭 제한 및 바인딩 컴파일 경계도 기록한다. 개인·프로젝트의 아트 선택은 공개 기술 지식과 구분한다.
* **Correction / Learning**: [Godot + C++ 개발](/game/godot-cpp.md)에 실제 OS 입력과 논리 좌표 주입 검사의 차이, 버튼 안/밖 경계 검사, 폰트 최소 크기·가시 상태의 컨테이너 정렬, 한 줄 이름 경계, 텍스트/아이콘 정렬의 분리와 glyph 투명 여백 검증을 추가한다. 공식 출처의 광고 합성을 실제 플레이 화면으로 취급하지 않는 레퍼런스 판정도 기록한다.
* **Correction / Learning**: [Godot + C++ 개발](/game/godot-cpp.md)에 짧은 상태 표시와 읽기 본문의 정렬 구분, 채팅의 구조적 발신 주체·일반 텍스트 처리, 실제 월드 위의 HUD 비교를 추가한다. 크기·위치를 강제한 검증 창과 사용자 실패 조건을 구분하고, 같은 transform에서 만든 기대 좌표만으로 실제 표시/입력 일치를 보증하지 않는 한계를 명시한다.
* **Learning**: [서버 체크리스트](/game/server-checklist.md)에 오딘의 Games on AWS 2022 발표를 근거로 Gateway 방송 전담·N:M 콘텐츠 서버·multi I/O/single logic의 구분을 추가한다. 큐 상한·소유권·AOI 팬아웃·비동기 완료·영속화·handoff·장애/부하 검증은 적용 설계 기준으로 구분하고 발표 당시 인프라 튜닝을 범용 기본값으로 취급하지 않는다. [네트워크 동기화](/game/network-sync.md)는 Gambetta·KinematicSoup를 근거로 처리 ACK·미확정 입력 재실행·원격 보간·판정 지연 보상과 적용 한계를 보강한다. 공개 자료의 설명과 구현/성능 검증을 구분하며 프로젝트 결정은 로컬 지식으로 분리한다.

## 2026-09-26
* **Refresh**: [에이전트 생태계 동향](/tools/ecosystem-watch.md)에 2026-08-26~09-26 공식 변경과 09-26 GitHub 월간 Trending 표시값을 분리 기록. 관측 23개 중 직접 관련된 10개 저장소의 원문과 반영·유지·미채택 이유를 연결하고, [정확성](/accuracy.md)에 기간·지표·저자 주장·적용 환경의 구분을 추가한다. 인기 도구 설치·모델 전환·성능 우열 판정은 하지 않는다.
* **Correction**: 설치 OMP 18.3.2 및 공식 18.3.0~18.3.2 변경과 대조해 AST의 조건부 가용성·browser facade·백그라운드 메시지/대기·glob 범위를 [기본 도구](/tools/builtin.md)에 반영. [서브에이전트](/tools/subagents.md)의 탐색 횟수 임계값을 제거하고 README의 config 경로/agent 탐색 차이를 재확인한다. 설정·setup·기존 확장은 유지한다.
* **Policy**: [스킬](/tools/skills.md)·[MCP](/tools/mcp.md)·[보안 개요](/security/overview.md)에 host 호환성, 설치 전 hooks/의존성 검토, 외부 자료의 권한 승격 금지와 OS 실행 격리 경계를 명시. [워크플로](/workflow.md)·[학습 축적](/learning/accumulation.md)에 독립 반증과 메모리 원문 재검증을 보강하고 글로벌 지침·관련 index를 동기화한다.
* **Correction**: [코딩 스타일](/coding-style.md)의 기존 구현 재사용과 측정·불변조건 기반 동시성 선택, [버그 수정](/bugfix.md)의 소비자 관측 회귀 검증을 명확화. 회귀 테스트 지침은 트렌드·신규 공식 사양의 채택이 아니라 같은 문서의 소비자 계약 보호·YAGNI 경계와 독립 검토 지적을 근거로 정정했다. 테스트 정리는 이번 수정 범위의 비계약 구현 세부에 한정하고 계약인 메시지·프로토콜 문자열은 보호한다. [게임 보안](/security/game.md)·[서버 체크리스트](/game/server-checklist.md)는 권위 검증/경제 커밋과 예측 표시를, [보안 리뷰](/security/review-checklist.md)는 인증 경로별 CSRF와 클라 탐지의 보조 역할을 구분한다. 게임 엔진·SDK의 신규 사양으로 주장하지 않는다.
* **Clarify**: 독립 검토의 잔여 지적을 반영해 [생태계 동향](/tools/ecosystem-watch.md)에 `i-have-adhd`의 고정 revision·OMP 확장 선언·활성 조건에 따른 비표시 규칙 주입과 미설치 판단을 명시. 실행 성공·악성 여부는 단정하지 않는다. 외부 평가의 일반 해석 기준은 [정확성](/accuracy.md)으로 모으고 [에이전트 가이드](/agents/guide.md)는 이를 참조하며 역할별 기준만 유지한다.
* **Cutover**: 사용자 승인에 따라 기본·선택형 프로필의 GPT-5.6 Terra/Luna와 Opus 5 배정을 GPT-6 Sol/Luna·Opus 5.5로 교체하고 구형 모델을 허용 목록에서 제거. `default`·`task`는 Astra, `designer`·`slow`·`plan`은 Opus 5.5, `vision`은 기본 프로필에서 Fable 5.1을 유지한다. `memory`와 해당 low fallback을 명시하고 11개 역할 모두 교차-provider 후보 1개를 둔다. 모델별 추천을 운영 정책으로 바꾸지 않았던 아래 조사 기록과 구분되는 실제 전환이다.
* **Correction**: Opus 전용 오버레이는 `modelRoles`·`enabledModels`만 덮고 fallback은 기본 프로필에서 상속한다는 기전을 README·가이드에 명시. 이름 있는 OMP 프로필이 `PI_CODING_AGENT_DIR`을 무시하므로 격리 setup 전에 해석된 경로를 확인하도록 테스트 안내를 보강한다. Anthropic 작성·폴백 시 반대 계열 검토를 명시 선택해야 하며 정적 역할 배정만으로 자동 분리되지 않음을 기록한다.
* **Learning**: [에이전트 가이드](/agents/guide.md)에 OMP 18.3.2의 기본 chat 역할 10종·model-kind 역할 5종과 `memory` → `tiny` → `smol` 미배정 해석을 명시. 이미지 분석/생성·모델 역할/에이전트를 구분하고, 후기의 독립성·평가 조건·역할별 직접 근거·API 비용/구독 quota·카탈로그/실제 호출 구분을 추가한다. 모델별 추천이나 역할·fallback 설정은 변경하지 않는다.
* **Learning**: [코딩 스타일](/coding-style.md)의 외부 응답 집계에 실패 경로의 사용량 반환 계약과 멱등 재호출의 소비 방향 확인을 추가. 공식 DynamoDB 문서를 근거로, 실패 시에도 소비되지만 응답에서 관측할 수 없는 용량을 실제 0과 구분하고 성공 응답 합을 전체 사용량으로 단정하지 않도록 명시한다. `TransactWriteItems` 재호출이 읽기 용량을 반환하는 계약에 따라 작업 이름만으로 총계 폴백 방향을 고정하지 않도록 보강한다.
* **Policy**: [코딩 스타일](/coding-style.md)과 글로벌 지침에 외부 ABI/엔진 override·명시 프로젝트 규칙·기존 코드·언어별 개인 기본값·일반 기본값의 적용 경계를 명확히 한다. C/C++ 작업에서 [축적 지식](/learned/)의 해당 언어 지침을 먼저 발견하도록 연결하며 개인 파일명과 선호 내용은 공개 목록에 넣지 않는다.
* **Knowledge**: [Godot + C++ 개발](/game/godot-cpp.md)을 추가하고 게임/루트 index와 글로벌 작업 라우팅에 연결한다. 공식 릴리스와 godot-cpp의 독립 버전/API 타깃을 구분하고 GDExtension 선택, 엔진 수명·스레드·바인딩 계약, 빌드·디버깅·내보내기 검증 기준을 정리한다. 성능 절은 네이티브 물리와 호출 비용의 구분, 4X/MMORPG·전투·네트워크 부하, RID 수명·AOI·독립 서버 프로토콜·release 측정 기준을 설명하며 성능 달성 수치를 주장하지 않는다. 엔진·바인딩 설치나 게임 프로젝트 생성은 수행하지 않는다.

## 2026-09-18
* **Policy**: [OKF 학습 축적 루프](/learning/accumulation.md)를 작업 완료 절차에 연결. 로컬 기록과 공개 반영의 기준을 분리하고, 기존 지식의 재사용·정정에도 재평가를 요구한다. [워크플로](/workflow.md)에 학습·공개 반영 결과 필드를 고정하며 단순 질의 예외, 보류·차단 보고, 공개/로컬 이력 분리, 검증·배포와 Git 작업 승인 경계를 명시한다.
* **Learning**: 선별 커밋 검증은 작업 트리가 아니라 실제 인덱스 스냅샷을 격리해야 한다는 원칙을 [워크플로](/workflow.md)에 반영. 선택적 외부 응답 필드의 부재와 실제 0을 구분하고 계약에 따른 폴백·집계를 검증하는 원칙을 [코딩 스타일](/coding-style.md)에 반영.
* **Correction**: [요청 서명 정규화 계약](/security/signing-canonicalization.md)의 원시 body 바이트 일치 권고를 rawBody 모델로 한정하고, 파싱 후 canonical 재구성 모델과 구분한다. UTF-16/UTF-8 정렬의 비등가성·JS 안전 정수 경계·소비자 합의 없는 타입 변경 금지와 상태코드만으로 판정하지 않는 대조 기준도 명시한다.
* **Learning**: [워크플로](/workflow.md)에 ignored 복구본·검증 산출물의 Git 정리·전체 stash 보호 경계와 인덱스 복사본 생성·상위 Git 탐색 주의를 추가. [코딩 스타일](/coding-style.md)의 외부 응답 집계 원칙에는 공식 DynamoDB 선택 필드 계약과 실제 0·누락·집계값 처리 예를 보강한다.
* **Policy**: 작업용 파일을 사용자·프로젝트 지정 경로 또는 `<프로젝트 루트>/.omp-artifacts/<작업-ID>/` 한 곳으로 모으도록 글로벌 룰과 [워크플로](/workflow.md)에 기준을 추가. OMP 설정 탐색 경로 `.omp/`와 분리하며 재개 시 기존 작업-ID를 확인한다. 정본 위치·기존 파일·검증 산출물 보존·정리 승인을 유지하고 위임·격리·도구 고정 출력·로컬 Git 제외의 경계를 명시한다. `/cleanup` 탐색 안내·README의 격리 검증 예시·Git 제외 경로도 맞춘다.
* **Policy**: 새 작업용 스크립트를 TypeScript+Bun으로, 파일이 필요 없는 실행을 Bun의 JavaScript 경로로 통일. [omp 기본 도구](/tools/builtin.md)에 Python 편의 사용 금지와 사용자 지정·기존 프로젝트·필수 런타임 제약의 예외를 명시한다. 기존 제품 언어·OS 부트스트랩·OMP 자체의 Python 지원은 변경하지 않는다.
* **Fix**: advisor 노트의 자연어 본문에도 한국어 존댓말을 명시하도록 advisor 전용 `rules/WATCHDOG.md`를 추가하고 POSIX·PowerShell setup의 관리 배포에 포함. 코드·설정 키·도구 필드·severity 값은 원문을 보존하며 감시 범위나 심각도 판정은 변경하지 않는다.
* **Policy — 기본 비활성 방침 대체**: 게임 서버의 위험 변경에 보수적으로 접근하기 위해 advisor 기본값을 활성(`advisor.enabled=true`)으로 복원. 작업 중 감시와 최종 응답 전 독립 검토를 함께 유지하고, 보안·영속 데이터·서버 권위·동시성 정합성에 영향을 주는 변경에는 구현 전 독립 검토도 요구한다. 같은 날짜에 기록한 기본 비활성 방침을 대체하며 모델 라우팅·fallback·`syncBacklog`는 변경하지 않는다.
* **Policy**: 비동기 advisor를 기본 비활성화(`advisor.enabled=false`)하고 필요한 작업의 최종 응답 전 독립 검토를 결과 수신·지적 판단·수정·재검증까지 완료하도록 명시. 작업 중 감시는 세션별 선택 사항으로 남기며 advisor 모델·fallback·`syncBacklog`는 유지한다. 검토 요청·카드 표시와 의견 반영 완료를 구분하고, 새 세션 적용 및 실행 중 세션의 `/advisor off` 경계를 문서화한다.
* **Policy**: 보고 매체를 터미널 기본으로 정하되, 사용자 요청·길고 복잡한 내용의 반복 검토·문서 자체의 편집·공유·비교 필요에 따라 파일 보고를 선택하도록 글로벌 룰과 [응답 원칙](/response-principles.md)에 기준을 명시. 파일 보고도 핵심 결론·근거·주의사항·필요한 결정·경로를 터미널에 제공하며 필수 작업 산출물과 검증 자료 생성을 억제하지 않는다.
* **Fix**: [워크플로](/workflow.md)의 완료 전 일률적 파일 저장 조건을 제거하고 산출물 보존과 보고 파일 생성을 구분. 독립 검토 전 본문을 먼저 공개하지 않고 검토·수정·검증 후 통합 최종본을 전달하도록 변경. advisor의 비동기 검토와 `syncBacklog`의 한계를 명시하고, 공개 답변 수정 시 차이만 덧붙이지 않고 자기완결적인 대체 최종본을 제공하도록 고정.
* **Correction**: Astra의 컨텍스트 제약 및 그 해소를 모델 선택 근거로 삼던 잘못된 설명을 README·에이전트 가이드에서 제거. 2026-09-05·2026-09-07 기록의 해당 전제도 정정하며 모델 라우팅과 `extendedContext` 설정은 유지한다.
* **Policy**: [정확성](/accuracy.md)에 버전 의존 사실의 적용 범위·근거·확인 시점과 현재 안내/과거 이력 구분을 명시. 설치본·유효 설정·공식 자료에 따라 관련 설명과 배포본을 갱신하되 문서 최신화를 근거로 모델·설정을 임의 교체하지 않는다.
* **Refresh**: 공식 자료와 설치 OMP 18.2.5에 맞춰 Pro의 Fable 불가 단정, Astra 장문 요금 티어 부재, 설정만으로 보장하던 가용성·quota·인증 전제를 정정. 고정 단가와 불필요한 모델 도입 이력은 현재 가이드에서 제거하고, 기존 `pro` 라우팅은 선택형 Opus 전용 프로필로 명확화한다. 실제 모델·설정값은 유지한다.
* **Clarify**: 버그 수정 문서의 폐기된 advisor 참조와 핸드오프 파일 전면 금지를 새 독립 검토·보고 매체 기준에 맞춤. 설치본의 `PI_CODING_AGENT_DIR`과 custom-agent 탐색 루트 차이를 README에 명시하고, 동명 agent override가 글로벌 컨텍스트를 잃는다는 부정확한 설명을 제거한다.

## 2026-09-15
* **Fix**: 사용 불가가 보고되고 갱신된 이 환경의 Codex 모델 목록에서도 제외된 GPT-5.3 Codex Spark를 기본/Max·Anthropic Pro 프로필의 `tiny`와 `enabledModels`에서 제거. 경량 분류·요약에 맞는 GPT-5.6 Luna low로 교체하고 다른 역할·fallback은 유지한다. 공식 문서는 Spark를 Pro 전용 연구 프리뷰로 안내하므로 서비스 전체 지원 종료로 단정하지 않으며, 가이드의 Spark 전용 quota·컨텍스트 가정을 제거한다.

## 2026-09-08
* **Fix**: 설치본이 내보낸 빌트인 5종(`scout`, `reviewer`, `security-reviewer`, `task`, `sonic`)에 맞춰 [에이전트 가이드](/agents/guide.md)와 index를 정정. 2026-08-23의 7종 설명을 대체하고, 제공되지 않는 `librarian` 호출 지침을 글로벌 AGENTS·README·도구 정책에서 제거한다.
* **Clarify**: 모델 역할 배정과 에이전트 등록·실행을 구분. `designer` 모델 별칭과 fallback 설정은 유지하되 빌트인 에이전트로 안내하지 않고, 라이브러리 조사는 직접 처리 또는 `scout`, UI/UX 구현은 `task`로 연결한다. 위임 전 현재 세션의 가용 목록을 기준으로 선택하도록 명시한다.

## 2026-09-07
* **Update — 전제 정정(2026-09-18)**: 상급 모델 우선 정책에 따라 기본/Max·Anthropic Pro 프로필의 `default`·`task`를 Astra xhigh로 전환하고 기존 `designer` 배치와 `extendedContext=true`를 유지한 변경이다. 원래 기록의 "Astra의 272K 제약 해소"는 잘못된 전제이며 모델 선택 근거로 사용하지 않는다. 2026-09-05의 Astra 한정 사용 정책은 폐기됐다.
* **Update**: `slow`·`plan`의 OpenAI fallback을 Astra xhigh, `vision` fallback을 Astra high로 전환. 경량 Terra/Spark, Claude primary 역할, advisor의 Terra fallback, 역할당 단일 교차-provider fallback 정책은 유지한다.

## 2026-09-05
* **Update — 전제 정정(2026-09-18)**: GPT-6 Astra를 기본/Max·Anthropic Pro 프로필의 `designer`에 xhigh로 배치하고 `enabledModels`에 추가했으며 당시 `default`·`task`는 GPT-5.6 Sol xhigh를 유지했다. 이 선택을 정당화하던 "Astra의 272K 컨텍스트 제약"은 잘못된 설명이다. 해당 제약이나 Astra 한정 사용 정책을 현재 판단에 적용하지 않는다.

## 2026-09-04
* **Policy**: 모든 명시적 Opus 역할·fallback은 `anthropic/claude-opus-5`만 허용하고, 대상 모델을 Opus 5로 지정할 수 없는 Anthropic provider-managed legacy Opus fallback은 비활성화한다.
* **Update**: 공유 기본 프로필을 최신 상급 모델 기준으로 확정해 `slow`·`plan`·`advisor`와 모든 Codex→Anthropic fallback은 Claude Opus 5, 기본/Max `vision`은 Claude Fable 5.1로 라우팅. Fable을 사용할 수 없는 Anthropic Pro 구독은 `HELLO_OMP_ANTHROPIC_PLAN=pro`로 모든 Anthropic 역할·fallback·advisor를 Opus 5로 통일한다.
* **Fix**: Anthropic 인증이 없는 PC에서 `slow`·`plan`·`vision`·`advisor`와 Codex fallback이 실패하던 포터블 프로필을 OpenAI Codex-only로 전환. `modelRoles`·`enabledModels`·fallback·advisor 상태를 명시적으로 덮어써 기존 Fable 설정이 남지 않게 하고, 두 번째 provider를 저장소에 구성하기 전까지 advisor와 model fallback을 비활성화한다.
* **Update**: 공유 OMP 프로필의 Anthropic 역할과 fallback을 모두 Claude Fable 5.1로 통일하고, Fable 권한이 없는 머신의 Opus 사용은 로컬 설정으로 분리. GPT 메인 레인은 GPT-5.6 Sol/Terra, `tiny`는 GPT-5.3 Codex Spark를 유지한다.
* **Update**: `extendedContext=true`를 포터블 OMP 설정에 고정해 GPT-5.6 Sol/Terra/Luna의 subscription Codex 컨텍스트를 표준 요율 구간인 272K에서 1M으로 확장. 272K 입력 초과 요청에는 OpenAI long-context 요율이 적용된다.
* **Fix**: OMP 18.1.8에서 제거된 `task.isolation.mode=auto` 포터블 설정을 현재 스키마의 `task.isolation.enabled=true`와 `isolation.backend=auto`로 교체하고 서브에이전트 지침의 키 이름도 동기화. 클린 배포에서도 격리를 활성화하고 `setup.sh`가 중단 없이 전체 설정을 배포한다.
* **Fix**: 비활성 상태인 context promotion이 GPT-5.3 Codex Spark의 128K 컨텍스트 초과 시 자동 승격한다고 설명하던 에이전트 가이드를 실제 compaction/overflow 복구 동작에 맞게 수정.

## 2026-09-02
* **Fix**: 글로벌 AGENTS와 [응답 원칙](/response-principles.md)에 비한정 예시 해석 규칙을 추가. `예를 들어` 같은 사례를 완전 목록으로 오인하지 않고 요청문의 대상 집합·판정 기준에 맞는 모든 항목으로 탐색·구현·검증을 확장하되, 명시적 폐쇄 지시와 YAGNI 경계를 우선하도록 수정.
* **Update**: 글로벌 AGENTS와 관련 OKF 문서의 `예:` 표기를 일반 기준 뒤의 명시적 비한정 사례로 정비. 예시보다 대상이 많아도 확인 게이트로 축소하지 않고 판정 기준·대상 집합을 밝힌 뒤 진행하며 실제 처리 범위를 보고하도록 고정.
* **Update**: Fable 5.1 출시에 따라 Fable 5를 사용하던 `vision` 역할을 `anthropic/claude-fable-5-1:high`로 전환. 카탈로그에서 1M 컨텍스트·128K 출력·이미지 입력·high thinking 지원을 확인했으며, 교차-provider fallback(gpt-5.6-sol:high)과 나머지 역할은 유지.

## 2026-08-31
* **Update**: OMP v18.0.11의 `tiny` 역할을 gpt-5.6-luna:low로 명시해 제목·메모리·auto-thinking 분류 등 경량 백그라운드 작업을 분리. 도구 판단과 편집을 수행하는 `commit` agentic pipeline·`sonic`은 `smol`과 같은 gpt-5.6-terra:medium을 유지.
* **Update**: 최근 공식 포지셔닝과 제한된 공개 사용자 평가를 반영해 `plan`·`advisor`를 Fable 5에서 반값의 근접 frontier 성능을 표방하는 Opus 5로 전환. 장기 시각 입력 근거가 직접적인 `vision`만 Fable 5를 유지하고, 제한 접근인 Mythos 5는 primary·fallback에서 제외.
* **Update**: 역할별 quota/429 fallback을 다른 provider의 동급 모델 1개로 단순화. 동일 provider 모델의 연쇄 재시도를 제거해 불필요한 재시도 지연·비용·모델 행동 드리프트를 차단.
* **Update**: OAuth coding-plan의 신뢰 가능한 usage report에 한해 usage-aware fallback을 활성화하고 `retry.modelFallback=true`를 명시적으로 고정. 모델에 매핑된 rolling quota의 잔여 5%에서 확인 프롬프트 없이 역할별 단일 교차-provider fallback으로 선제 전환하며, 일반 configured API key와 unknown quota는 primary를 유지.

## 2026-08-23
* **Update**: [워크플로](/workflow.md)에 다단계·대규모 작업의 사용자 요구→관찰 가능한 결과→검증 경로→실행 증거 폐루프를 추가. 완료 근거가 실제 결함에서 실패하도록 성공 표시는 모든 단언 뒤에만 내고, 부재를 증명할 때의 알려진 양성 대조군과 목표 수치 달성의 독립 측정을 요구하며, 미충족·차단·포기 기준의 조용한 삭제·축소를 금지.
* **Update**: 글로벌 AGENTS와 OKF index에서 다단계·대규모 작업을 워크플로 concept으로 라우팅하고, [서브에이전트 위임](/tools/subagents.md)에 병렬 fan-out 전 인터페이스·의존성·완료 기준·write-set 소유권 고정, 충돌 작업 순차화, 부모 재검증 원칙을 추가.
* **Fix**: [에이전트 가이드](/agents/guide.md)를 현재 OMP 빌트인 7종(`scout`, `designer`, `reviewer`, `security-reviewer`, `librarian`, `task`, `sonic`)과 실제 model alias 기준으로 동기화하고, 제거된 `explore`·`Tester`·`plan` task-agent 항목을 정리.

## 2026-08-10
* **Update**: 고빈도 역할은 GPT 5.6 Sol/Terra, 전문 역할은 Claude Opus/Fable 5로 통일하고 모든 quota/429 fallback에서 GPT 5.5와 legacy Claude Opus를 제거. `reviewer`는 `slow = claude-opus-5:high`를 직접 따르도록 에이전트별 pin을 비웠고, 매 턴 advisor도 Fable 5 high로 낮춰 장시간 `xhigh` 사고 턴을 제한. legacy Opus로 향하는 Anthropic 암묵적 서버 fallback은 비활성화.

## 2026-08-08
* **Reorg**: 로컬↔레포↔배포본 지식 싱크 정리. `/learned/`의 프로젝트·회사·라이브러리 한정 내부 지식(디컴파일 근거·내부 엔드포인트·미공개 벤더 결함 등)은 공개 레포에 커밋하지 않도록 `.gitignore`로 로컬 전용화. 발견은 `/learned/` 디렉터리 직접 읽기로 전환하고 index의 per-file bullet 제거.
* **Creation**: 벤더 무관 교훈을 공개 번들 concept으로 일반화. [요청 서명 정규화 계약](/security/signing-canonicalization.md) 추가 — 서명자↔검증자 런타임 차이로 서명 베이스가 갈리는 세 결함 클래스(키 정렬·값 문자열화·기대 키 집합)와 근본 수정·격리법.
* **Update**: [코드 리뷰 보안 체크리스트](/security/review-checklist.md)에 객체 수준 인가(BOLA/IDOR)와 인증 스코프 캐시 폐기 항목 추가. [워크플로](/workflow.md)에 정본 검증(프록시 아닌 실제 배포 경로·런타임 소스) 규칙 추가.
* **Update**: 학습 축적 규칙 정합화 — [OKF 학습 축적 루프](/learning/accumulation.md)와 글로벌 AGENTS의 index 갱신 규칙을 "관리 번들 concept은 index 링크, 로컬 `/learned/` concept은 gitignore·디렉터리 발견"으로 분기하고, 벤더 무관 교훈의 공개 일반화+로컬 교차 참조 절차를 명시.

## 2026-08-07
* **Update**: 테스트·스모크 테스트·버그 재현에서 만든 사용자 검증용 산출물을 자동 삭제·원복하지 않고, 완료 보고에 정확한 위치·상태·확인 방법과 정리 대상·영향을 남기도록 글로벌 AGENTS와 워크플로 규칙을 변경. 검증 산출물 보존은 일반적인 마지막 cleanup보다 우선하고 정리는 사용자 명시 요청 시 별도 수행하며, 러너 자체 캐시와 즉시 차단할 위험 상태의 경계를 명시.

## 2026-07-16
* **Creation**: 버그 수정 시 증상이 아니라 결함 클래스를 고치고, 수정 전 코드 이력을 확인해 새 엣지 케이스 때문에 이전 수정을 롤백하지 않으며, 고친 케이스마다 회귀 테스트를 남기도록 요구하는 `/bugfix.md` concept을 추가. 수정→롤백→수정 루프 차단이 목적.
* **Update**: 글로벌 AGENTS와 코딩 스타일의 YAGNI를 기능 범위 한정으로 명확화(버그 수정 깊이엔 미적용)하고, AGENTS OKF 라우팅에 버그 수정·디버깅 → `bugfix.md` 경로를 추가.
* **Update**: `bugfix.md`를 전방 영향 범위 분석(주, `lsp references`·데이터 흐름·계약 경계 bounding)과 후방 의도 복구(보조, Chesterton's Fence)로 재구성하고, 이력 확인을 조건부(이유가 코드에 안 드러나는 방어 코드)로 완화. AGENTS·index 요약 동기화.

## 2026-07-14
* **Fix**: OMP TUI가 제목·목록·표·코드 블록을 렌더링하는 동작에 맞춰 터미널 응답의 마크다운 금지를 제거하고, 필요한 구조화와 Mermaid 시각화를 적극 활용하도록 글로벌·상세 응답 규칙을 명확화.
* **Update**: OMP TUI에서 thinking block은 기본 숨김, 추론 요약은 보존, 표시 시 prose-only로 제한하고 Mermaid ASCII 렌더링을 활성화하도록 공유 설정을 고정.

## 2026-07-13
* **Update**: SDK·라이브러리의 공개 API를 소비자 소유 정책과 안정적 계약으로 제한하고, 근거 없는 상속 확장점과 검증 우회 공개 hook을 금지하는 글로벌 설계 규칙을 추가.
* **Update**: 공통 서버 입력을 검증·정규화한 뒤에만 상태와 통계를 갱신하고, 부분 갱신의 독립·교차 검증 및 최종 accepted 값의 종단 간 전파를 요구하도록 코딩·보안 리뷰 규칙을 보강.
* **Update**: OKF 배치 반영·분할·병합·이름 변경·규칙 교체 후 모순·중복 정본·도달성·깨진 링크·메타데이터 불일치를 확인하는 무결성 검사를 추가.
* **Update**: 글로벌 AGENTS의 OKF 라우팅에 일반 서버/API 구현·수정·리뷰 경로를 추가해 공통 서버 상태 처리와 보안 리뷰 concept을 명시적으로 연결.
* **Fix**: setup의 OKF 검증을 첫 줄 확인에서 Bun 기반 YAML 파싱·mapping 확인·non-empty `type` 검사로 강화하고, Windows/POSIX가 같은 검증기를 사용해 실패 시 배포 전에 중단하도록 변경.
* **Creation**: 게임 네트워크의 권위·표시 상태 계층, 시간/순서, bounded prediction, 복구, 전달 의미론, handoff, 혼잡 처리와 결정적·통합 검증 원칙을 `/game/network-sync.md`로 추가.
* **Update**: 게임 클라이언트 체크리스트에 상태 계층·시간축·bounded extrapolation·표시 연속성·불연속 전환·재접속 검증을, 서버 체크리스트에 accepted 상태·보정 전파·generation·handoff·backpressure·관심 관리를 추가.
* **Update**: 게임 보안과 리뷰 체크리스트에 검증 실패 상태 오염 방지, 비가역 커맨드 멱등성, 세션 재개, host fast path, fog/interest 정보 인가와 observer 수렴 검증을 추가.

## 2026-07-10
* **Update**: GPT-5.6 Sol/Terra를 고빈도 `default`·`task`·`designer`·`smol`·`commit` 주 모델로 배치하고, 당시 legacy Claude Opus를 `slow`(reviewer), Claude Fable 5를 `plan`·`advisor`·`vision` 주 모델로 배치. 모든 역할의 quota/429 fallback chain은 GPT↔Claude 교차 백업으로 재정렬하고, 각 역할의 primary 모델은 자기 fallback에서 제거.
* **Fix**: 현 OMP 번들 `reviewer`·`plan` frontmatter가 `thinkingLevel`을 고정하지 않으므로 동명 override 파일을 제거하고, setup 재실행 시 이 레포가 관리하던 이전 override를 배포본 config dir에서도 정리하도록 유지.

## 2026-07-06
* **Sync**: 로컬 OMP 모델 역할의 `designer`·`advisor` xhigh 설정과 당시 legacy Opus 우선 quota/429 fallback chain을 소스 설정으로 승격하고, setup 배포본과 재동기화.

## 2026-07-03
* **Update**: OMP 모델 역할 설정을 Claude Fable 5 중심으로 갱신하고, 최고품질형으로 `slow`·`plan`은 xhigh, 매턴 보조 역할은 high로 정리. bundled `reviewer`·`plan`의 `thinkingLevel: high` 고정을 우회하기 위해 원본 버전 주석이 있는 동명 override를 추가했으며, 당시 Fable 5 safety-classifier refusal은 provider-managed legacy Opus 서버사이드 fallback으로 처리.

## 2026-06-30
* **Update**: Google OKF v0.1 예약 파일 규칙에 맞춰 하위 디렉터리 `index.md`를 progressive-disclosure 파일로 추가하고, concept 문서는 `security/overview.md`·`agents/guide.md`로 분리.
* **Update**: OKF 학습 축적 루프를 추가하고, setup에서 배포본 OKF 경로와 소스 OKF 경로를 함께 주입해 소스 OKF를 영속 학습 원장으로 사용하도록 정리.
* **Fix**: setup config dir가 레포 루트와 같을 때 중단하는 가드를 추가해 소스 OKF 원장 삭제를 방지.
* **Fix**: `.gitattributes`를 추가해 `setup.sh` LF, `setup.ps1` CRLF 줄끝 정책을 고정.

## 2026-06-29
* **Init**: OKF 번들 초기화 — 글로벌 CLAUDE.md 룰과 omp 번들 에이전트 정의에서 정리. 도구 정책은 omp 기본 도구 우선(MCP 대체)으로 적용.

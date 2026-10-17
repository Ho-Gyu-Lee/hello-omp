# OKF Knowledge Bundle

omp 에이전트가 참조하는 룰·도메인 지식이다. 작업 유형에 맞는 개념을 `read`로 읽어라. 링크는 번들 루트 기준이다.

## 룰
* [정확성](/accuracy.md) - 확실성·검색 소진·버전 최신화·기간별 트렌드 근거·에스컬레이션·도달 가능 상태
* [응답 원칙](/response-principles.md) - 앵커·비한정 예시·범위 제한·확장 품질·함축성·옵션 제시·비차단 변경 위치 공유·보고 매체·통합 최종본
* [코딩 스타일](/coding-style.md) - YAGNI·기존 동작/비용 계약 보존·검토 비용·결정 사다리·표준 기능의 의미 계약·네이밍 우선순위와 언어 공통 스타일 정본 연결·공개 API·아키텍처·서버 상태(보조 서비스 실패 신호·DynamoDB 기본키 덮어쓰기와 페이지네이터 오류·gRPC 장기 스트림 종료)·외부 응답 계약(DynamoDB 지표 차원·스로틀 원인)
* [언어 공통 코딩 스타일](/language-style.md) - 모든 언어에 적용하는 네이밍 기본값과 언어별 예외, 작성·수정 범위의 문장·제어 흐름·선언 가독성 기준을 정하는 정본이며 C/C++ 전용 규칙은 하위 개념으로 나눕니다.
* [C/C++ 전용 코딩 규칙](/language-style-c-cpp.md) - 언어 공통 코딩 스타일에 더해 C/C++ 코드를 작성·수정할 때만 적용하는 배치·선언, C++·C 언어 규칙, 헤더·공개 경계 기준입니다.
* [버그 수정 원칙](/bugfix.md) - 결함 클래스 수정·전방 영향 범위 분석·후방 의도 복구(롤백 차단)·회귀 방지·YAGNI 경계
* [워크플로](/workflow.md) - 개발 흐름·검증 무결성/실행 증거·수락 기준·미완료 상태 보존·작업 파일·산출물 보존·정본(실제 경로) 검증·독립 검토·컨텍스트 재개·학습 판정·비차단 작업 공유/유지 지도 갱신의 정본 연결
* [프로젝트 지도와 작업 동기화](/project-navigation.md) - 비차단 책임/변경 위치 공유·지속 지도의 적용 대상·중지/삭제·문서 배치·목차/상태/확정·제안 계획의 의미·화면 기술 계약과 Archify·작업 트리 근거·신선도·검증 후 게시
* [프로젝트 지도 화면 설계](/project-map-design.md) - 사람이 읽는 화면과 근거 기록의 분리·문장형 제목과 시각 근거의 슬라이드 구성·AI 생성 문서처럼 보이는 글/디자인 기본값과 대안·칸반 보드·다이어그램/스크린샷/GIF/영상 시각 자료·데스크톱 최대화 화면 구조·고쳐 쓰는 갱신과 게시 전 점검
* [OKF 학습 축적 루프](/learning/accumulation.md) - 실행 조건·로컬 기록과 공개 반영·기존 지식 재평가·주제별 개념 분할·검증·배포·완료 보고

## 축적 지식
* [축적 지식](/learned/) - 설정 폴더의 `<configdir>/okf/learned/`에 직접 누적해 setup이 보존하는 로컬 지식. 개인 선호·프로젝트 한정 사실·공개 범위 검토 중인 concept은 레포에 커밋하지 않으며 디렉터리에서 발견한다. 공개 가능한 교훈은 공통 concept에 별도로 반영한다

## 보안
* [보안 개요](/security/overview.md) - 즉시 경고·취약점 설명·민감정보와 Git 원격 자격증명 처리·외부 자료의 신뢰 경계·요청 범위에 따른 외부 코드 실행
* [게임 보안](/security/game.md) - 서버 권위·AI 판정·예측/보정·커맨드·경제·정보 가시성·세션/통신(재개 토큰·TLS 0-RTT·UDP 식별/주소 검증·제어 채널·게스트 비밀), replay/rate limit 구분과 스크립트·native 플러그인 신뢰 경계
* [코드 리뷰 보안 체크리스트](/security/review-checklist.md) - 공통 서버·애플리케이션·게임 클라·게임 서버
* [요청 서명 정규화 계약](/security/signing-canonicalization.md) - 크로스 런타임 서명 베이스 불일치: 키 정렬·값 문자열화·기대 키 집합

## 데이터베이스
* [데이터베이스 목차](/database/index.md) - 도메인과 분리한 관계형 저장·동시성·캐시 기준을 안내한다.
* [관계형 DB 설계·인덱스·동시성과 캐시](/database/design.md) - 접근 패턴·PK/인덱스·실행계획, 참조 무결성·앱/SP·트랜잭션·DDL/격리·재시도·동적 캐시와 SQLite 조건부 갱신·멱등 영수증.

## 공통 개발
* [공통 개발 목차](/development/index.md) - 앱·웹·서비스와 게임에서 재사용하는 실행·데이터·네트워크·UI·표현 기준. 게임/Godot 예시는 해당 기능·API·버전의 조건부 사례다.
* [이벤트 루프·작업·스크립트의 실행 경계](/development/execution.md) - 순회 중 생성/파괴·재진입, 병렬 작업의 snapshot·쓰기 소유권·콜백·합류/종료, 타이머와 스크립트 예산·실패 전파.
* [런타임 진단·메모리·성능 측정](/development/runtime-diagnostics.md) - 프로파일·계측 편향·경과/CPU 시간, 데이터 배치·메모리 예산/수명·할당/풀/고갈, 로그·수집 경로 라벨/심각도·연결 종료 진단·외부 경로 합성 점검·심볼/덤프와 제품별 성능 수락.
* [서버 프로토콜·메모리·큐 운영 기준](/development/server-checklist.md) - 동시성·비동기 수명, 메시지 등록/폭·codec 수락, 큐 상한·공정성·accept 고갈과 Asio/TLS·allocator 계측.
* [서비스 영속성·생존 감시·프로세스와 소유권 수명](/development/service-lifecycle.md) - 비동기 재진입·복제/디스크 내구 확인·identity 결속, heartbeat·장애 격리, PID/pidfd·불변 이전 입력·컨테이너와 Windows 상시 감독·fencing.
* [데이터 형식·콘텐츠 변환·저장 복원](/development/data-formats.md) - 파일/wire 인코딩·압축·호환, 저작 데이터 검증, 객체 그래프 복원·오디오 청크 수락과 부분 생성의 보호/게시.
* [참조 데이터의 저작·배포·로딩·버전 전환](/development/data-lifecycle.md) - 논리 모델/물리 패키징·저작 입력, CDN/DB/메모리 게시·활성화/복구, 조회 인덱스·LINQ와 초기 로딩 측정.
* [난수·절차 생성·재현 계약](/development/randomness.md) - 스트림·시드·분포/알고리즘 버전·소비 순서, 비복원 선택·생성 유효성/종료, 고수준 기록과 실제 입력/표시 검증의 경계.
* [시계 도메인·네트워크 시간과 RTT 계측](/development/network-time.md) - 단조 시간·단위/기준점·정밀도, 원격 offset/drift·RTT 추정의 한계, probe 표본화·메인루프/캡처 교란과 WSL 관찰.
* [메시지 전달·송신 공정성과 연결 복구](/development/network-delivery.md) - 메시지 전달/만료·묶음·outbox/버퍼 소유권, TCP/I/O/RPC·HOL·공정한 송신, 모바일 경로/세션 복구와 전송 열화 검증.
* [네트워크 프레이밍·비동기 I/O·연결 종료](/development/network-io.md) - TCP 분할/병합·부분 송수신·처리 예산, readiness/실패 completion·연산별 수명, half-close·TLS 종료와 접속 부하 한계.
* [연결 경로·릴레이·음성 토폴로지](/development/network-topology.md) - signaling·직접/릴레이 경로의 도달성·주소 노출과 업무 권위의 분리, 음성 mesh·중계·믹싱의 비용/장애 조건.
* [UI 재사용·입력과 표시 검증](/development/ui-input.md) - UI/도메인 책임, 입력 의미·포인터 수명·좌표/선택, 텍스트·폰트·레이아웃과 실제 OS 입력/픽셀·출처 검증.
* [지역화·문자열·텍스트 입력](/development/localization.md) - 문장·복수형·문맥, 표시 로캘/프로토콜 분리, 사용자 생성 텍스트 번역의 원문 언어, Unicode 길이·키 배열·IME·줄바꿈과 실제 지원 언어 검증.
* [수치와 공간 판정의 정확성](/development/numerics-spatial.md) - 오차·퇴화 입력·FP 모드·음수 격자, 좌표/회전·곡선/적분·저장 정밀도, 공간 인덱스·질의/충돌·높이맵과 직교/아이소메트릭 표시.
* [렌더링·애니메이션의 좌표와 표현 계약](/development/rendering-animation.md) - 픽셀·알파·색공간, 메시·스킨·법선/접선, 투영·컬링·LOD·광학 근사, GPU 표시/소실 복구와 clip 정합.
* [오디오의 로드·디코딩·스트리밍 계약](/development/audio-runtime.md) - 상주/압축/스트리밍·voice 가상화·소비 완료, 공간/시계·효과/평활화·실시간 callback 기한과 그래프 의존성.
* [상태 기계·탐색과 이동 모델](/development/ai-navigation.md) - 상태 전이·지연 이벤트 수명, A* 정확성/작업 예산·clearance·회피/복구, 전술/퍼지/학습 모델과 제약 배치·주기적 재계획.
* [에셋 검수·사용 권리와 조립 계약](/development/assets-editor.md) - 구매/생성 자산의 실제 내용·출처·라이선스/AI 사용 권리, 타일·투명 재질·제약 생성과 조립 수락.
* [Android 라이브러리 의존성과 최종 패키지 검증](/development/android-dependencies.md) - 로컬 AAR/Maven 메타데이터·외부 의존성, 최종 APK/DEX의 클래스 정의·기기 오류 경로와 양성 대조.

## 게임 클라이언트/서버
* [게임 목차](/game/index.md) - 게임 권위·동기화·콘텐츠 적용과 Godot 엔진별 구현/버전 관찰. 공통 개발·관계형 DB 기준은 위 독립 카테고리에서 찾는다.
* [게임 네트워크 동기화](/game/network-sync.md) - 권위·예측·보간/표시 상태, 게임 시간·입력 순서/수명과 동기화 검증을 정리하고 세부 개념을 안내한다.
* [게임 네트워크 시간·이동 검증](/game/network-time-movement.md) - 게임 시간/tick과 서버의 시간 승인, 이동 속도·시간 예산 검증, 접촉 트리거 전환 요청의 권위 경계.
* [게임 네트워크 예측·보간·보정](/game/network-prediction.md) - 클라이언트 예측/보정·입력 처리 ACK/재실행, 애니메이션 시간·원격 보간과 판정 지연 보상.
* [게임 네트워크 복구·전달 의미론](/game/network-delivery.md) - 증분 복제·baseline 복구, 입력/결과 보존·권위 이전·불연속 marker, 지역 전환/READY와 게임 세션 재개.
* [게임 클라이언트 기능/성능 체크리스트](/game/client-checklist.md) - 게임 자원·프레임·수신 큐·동기화/재접속·정상 로그아웃과 공통 검증의 적용, Unity Android 배포·EDM4U/Unity EDM 이행 조건.
* [게임 서버 기능/성능 체크리스트](/game/server-checklist.md) - 게임 상태 수락·권위 이전·가시성·콘텐츠 판정, Gateway/단일 로직 스레드·AOI/방송·복제와 게임 부하 검증.
* [게임 서버 영속화·장애 체크리스트](/game/server-persistence.md) - 콘텐츠별 결과 공개/내구 A/B/C, 경제·위치 저장·존 이전·파티/던전 수명, 저장 대기/복제 view와 실제 게임 통합 시험.
* [게임 정적 데이터의 분류·소비와 권위 경계](/game/static-data.md) - 콘텐츠 정의/설정과 플레이 상태의 구분, client/server 공개 대상·서버 비밀, 최초 플레이/판정 의존집합과 세션·존별 버전 적용.
* [게임 기록·재생·락스텝의 권위와 진단](/game/random-replay.md) - 공통 난수/재현 계약의 게임 적용, 락스텝·desync·비공개 정보와 출하 테스트 훅/봇 검증의 경계.
* [Godot와 C++ 게임 개발](/game/godot-cpp.md) - Godot/godot-cpp 공식 버전 핀, GDExtension/엔진 모듈 선택과 검증 범위를 정리하고 하위 개념을 안내한다.
* [Godot C++ 성능 중심 시뮬레이션 코어](/game/godot-simulation.md) - C++ 코어/Godot 연결부·로컬 인게임/서버 이관, 관찰/AOI와 월드/UI 리소스 로딩, 물리·전투·4X/MMORPG 부하와 Web export 제약.
* [godot-cpp 빌드·등록·디버깅·export와 실행 검증](/game/godot-build.md) - API/ABI 호환성·SCons/로드 경로·클래스/시그널/이름 등록, 디버깅/export·프로젝트 설정/addon 의존성과 smoke 전제.
* [Godot C++ Scene·물리·Resource 수명과 경계](/game/godot-runtime.md) - Scene/Node 소유권·에디터 복제/부분 생성, 물리/프레임/스레드·Resource 직렬화/저장/공유와 Godot 성능·서버 권위 경계.
* [Godot UI 재사용과 입력·텍스트·HUD 표시](/game/godot-ui.md) - 게임 UI 어댑터와 Godot의 모달/pick·터치/합성 mouse·포커스, Control/폰트·C++ 문자열과 실제 창/HUD의 API/버전별 적용.
* [Godot 2D 시야·카메라와 자동 사냥 대상](/game/godot-2d-view.md) - 2D 게임 비교 근거의 적용 한계, 화면 안 월드 공격 사거리·실제 교전과 자동 사냥 대상 선택.
* [Godot 에셋 팩·타일 조립·렌더 정밀도와 에디터 미리보기](/game/godot-assets-editor.md) - Godot 타일 조립·충돌/예측/권위 판정·앞뒤 정렬, TileMapLayer·GPU 데이터 텍스처와 비저장 에디터/F5 미리보기.

## 도구
* [omp 기본 도구](/tools/builtin.md) - 세션별 가용성·lsp·AST·browser facade·백그라운드 작업·상태 유지 eval의 모듈 identity·Bun 프로세스 종료 판정·동기 호출 중 관측 루프 정지·IDE/원격 빌드 환경·UTF-8이 아닌 파일 편집·생성 이미지 국소 합성·TypeScript+Bun·MCP 경계 참조
* [MCP 정책](/tools/mcp.md) - 기본 도구 우선·외부 연동·겹치는 MCP 기능의 대체와 선별 사용(검색 MCP의 수직 검색)·스킬과 접근 계약 구분·공급망·인증·MCP 사양 revision과 OMP 클라이언트 호환·경로별 backend 버전 고정과 runtime 교체
* [스킬](/tools/skills.md) - 가용 스킬·점진적 로딩·OMP 배포/발견/검증·유지 지도 요청 범위·host 호환성·레지스트리 설치를 포함한 외부 실행 검토
* [서브에이전트](/tools/subagents.md) - 위임 기준·여러 안의 후보별 독립 생성과 메인 비교·번들 에이전트 도구 경계·병렬 계약·파일 소유권·task 격리·작업자별 독립 clone 빌드·반환 결과 검증
* [에이전트 생태계 동향](/tools/ecosystem-watch.md) - 2026-08-26~09-26과 09-26~10-12 공식 변경(OMP·MCP·OKF 사양)·GitHub 월간 관측(09-26·10-12)·지침 반영과 미채택 근거

## 에이전트
* [에이전트 가이드](/agents/guide.md) - 빌트인 에이전트·모델 역할 전체 목록·미배정 해석·실사용 평가의 역할 추천 적용·모델 선정 근거·OMP 설정 사례 적용 판단·교차 모델 독립 검토·커스텀 에이전트 작성·구독/인증 경계·배정과 실행의 구분

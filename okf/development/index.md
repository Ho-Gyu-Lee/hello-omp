# 공통 개발

앱·웹·서비스와 게임에서 해당 기능을 구현·검토할 때 재사용하는 지식이다. 분류는 서적·프로젝트 같은 출처가 아니라 적용 범위를 따른다. 본문의 게임/Godot/Unity 예시는 해당 기능·API·버전의 조건부 사례이며, 모든 도메인에 게임 권위·게임 루프·엔진 API나 프로젝트 선호를 요구하지 않는다. 각 정본의 전제·반례·버전·출처·검증 한계를 함께 읽는다.

관계형 저장·동시성·캐시는 [데이터베이스 목차](/database/index.md), 게임 고유의 권위·복제·콘텐츠 적용과 Godot 엔진별 구현은 [게임 목차](/game/index.md)에서 찾는다.

## 실행·진단·서비스 운영
* [이벤트 루프·작업·스크립트의 실행 경계](/development/execution.md) - 순회 중 생성/파괴·재진입, 병렬 작업의 snapshot·쓰기 소유권·콜백·합류/종료, 타이머와 스크립트 예산·실패 전파.
* [런타임 진단·메모리·성능 측정](/development/runtime-diagnostics.md) - 프로파일·계측 편향·경과/CPU 시간, 데이터 배치·메모리 예산/수명·할당/풀/고갈, 로그·수집 경로 라벨/심각도·연결 종료 진단·외부 경로 합성 점검·심볼/덤프와 제품별 성능 수락.
* [서버 프로토콜·메모리·큐 운영 기준](/development/server-checklist.md) - 동시성·비동기 수명, 메시지 등록/폭·codec 수락, 큐 상한·공정성·accept 고갈과 Asio/TLS·allocator 계측.
* [서비스 영속성·생존 감시·프로세스와 소유권 수명](/development/service-lifecycle.md) - 비동기 재진입·복제/디스크 내구 확인·identity 결속, heartbeat·장애 격리, PID/pidfd·불변 이전 입력·컨테이너와 Windows 상시 감독·fencing.

## 데이터·재현
* [데이터 형식·콘텐츠 변환·저장 복원](/development/data-formats.md) - 파일/wire 인코딩·압축·호환, 저작 데이터 검증, 객체 그래프 복원·오디오 청크 수락과 부분 생성의 보호/게시.
* [참조 데이터의 저작·배포·로딩·버전 전환](/development/data-lifecycle.md) - 논리 모델/물리 패키징·저작 입력, CDN/DB/메모리 게시·활성화/복구, 조회 인덱스·LINQ와 초기 로딩 측정.
* [난수·절차 생성·재현 계약](/development/randomness.md) - 스트림·시드·분포/알고리즘 버전·소비 순서, 비복원 선택·생성 유효성/종료, 고수준 기록과 실제 입력/표시 검증의 경계.

## 네트워크·시간
* [시계 도메인·네트워크 시간과 RTT 계측](/development/network-time.md) - 단조 시간·단위/기준점·정밀도, 원격 offset/drift·RTT 추정의 한계, probe 표본화·메인루프/캡처 교란과 WSL 관찰.
* [메시지 전달·송신 공정성과 연결 복구](/development/network-delivery.md) - 메시지 전달/만료·묶음·outbox/버퍼 소유권, TCP/I/O/RPC·HOL·공정한 송신, 모바일 경로/세션 복구와 전송 열화 검증.
* [네트워크 프레이밍·비동기 I/O·연결 종료](/development/network-io.md) - TCP 분할/병합·부분 송수신·처리 예산, readiness/실패 completion·연산별 수명, half-close·TLS 종료와 접속 부하 한계.
* [연결 경로·릴레이·음성 토폴로지](/development/network-topology.md) - signaling·직접/릴레이 경로의 도달성·주소 노출과 업무 권위의 분리, 음성 mesh·중계·믹싱의 비용/장애 조건.

## UI·표현·탐색·자산
* [UI 재사용·입력과 표시 검증](/development/ui-input.md) - UI/도메인 책임, 입력 의미·포인터 수명·좌표/선택, 텍스트·폰트·레이아웃과 실제 OS 입력/픽셀·출처 검증.
* [지역화·문자열·텍스트 입력](/development/localization.md) - 문장·복수형·문맥, 표시 로캘/프로토콜 분리, 사용자 생성 텍스트 번역의 원문 언어, Unicode 길이·키 배열·IME·줄바꿈과 실제 지원 언어 검증.
* [수치와 공간 판정의 정확성](/development/numerics-spatial.md) - 오차·퇴화 입력·FP 모드·음수 격자, 좌표/회전·곡선/적분·저장 정밀도, 공간 인덱스·질의/충돌·높이맵과 직교/아이소메트릭 표시.
* [렌더링·애니메이션의 좌표와 표현 계약](/development/rendering-animation.md) - 픽셀·2D 필터/화면 배율·알파·색공간, 메시·스킨·법선/접선, 투영·컬링·LOD·광학 근사, GPU 표시/소실 복구와 clip 정합.
* [오디오의 로드·디코딩·스트리밍 계약](/development/audio-runtime.md) - 상주/압축/스트리밍·voice 가상화·소비 완료, 공간/시계·효과/평활화·실시간 callback 기한과 그래프 의존성.
* [상태 기계·탐색과 이동 모델](/development/ai-navigation.md) - 상태 전이·지연 이벤트 수명, A* 정확성/작업 예산·clearance·회피/복구, 전술/퍼지/학습 모델과 제약 배치·주기적 재계획.
* [에셋 검수·사용 권리와 조립 계약](/development/assets-editor.md) - 구매/생성 자산의 실제 내용·출처·라이선스/AI 사용 권리, 타일·투명 재질·생성 에셋 화풍 대조·제약 생성과 조립 수락.

## 플랫폼 배포
* [Android 라이브러리 의존성과 최종 패키지 검증](/development/android-dependencies.md) - 로컬 AAR/Maven 메타데이터·외부 의존성, 최종 APK/DEX의 클래스 정의·기기 오류 경로와 양성 대조.

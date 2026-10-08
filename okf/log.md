# Change Log

이 문서는 변경 당시의 기록이며 현재 설정·지원 사양의 근거가 아니다. 현재 안내는 소스 설정과 해당 concept을 따른다. 오류가 확인된 과거 설명은 정정 표시를 우선한다.

## 2026-10-08
* **Correction — Godot C++ 문자열 인코딩:** [Godot + C++ 개발](/game/godot-cpp.md)의 명시적 String 피연산자 안내를 ASCII/UTF-8로 구분합니다. 고정 바인딩 소스의 Latin-1 생성자와 UTF-8 생성 경로, 실제 UI의 기호 깨짐·교정 표시를 근거로 비ASCII에는 `String::utf8`을 사용하도록 보강합니다. 프로젝트별 대사·이미지·경로는 공개하지 않습니다.
* **Learning — 상시 운영 메모리와 계측 경계:** [게임 서버 체크리스트](/game/server-checklist.md)에 pool/queue/cache의 실제 상한과 소유권 반환, codec 상태 재사용, TLS buffer 보관의 메모리 선택, Asio executor 경로의 allocator 전달, C++/C/aligned 할당의 계측 누락과 양성 대조를 추가합니다. 공식 소스·독립 검토·실제 TLS 메시지 및 계측 빌드에서 확인한 일반 기준이며 프로젝트별 프로토콜·접속 규모·측정 수치는 공개하지 않습니다.
* **Correction — 공개 지침의 적용 조건:** 독립 검토에서 확인한 [네트워크 동기화](/game/network-sync.md)의 트리거 최종 소비/일시 거부 상태 충돌을 정정하고 유한 재시도·제품별 자동 조작 정책·동적 데이터 검증을 구분합니다. [서버 체크리스트](/game/server-checklist.md)의 리스폰 정보 비복제는 공개 계약 밖 정보에 한정합니다. [MCP 정책](/tools/mcp.md)의 자동 재시작과 경쟁하는 교체 절차는 소비자·재기동 주체의 정상 중지 후 백업·교체·명시적 재활성화로 대체하고, 버전 확인 수단을 표준 initialize 응답과 실제 실행 경로로 일반화합니다. Apple TN3151의 DNS 이름 연관과 VPN On Demand 근거 범위, 관련 문서 metadata·목차를 함께 정정합니다.
* **Correction — Godot 지침의 일반화·검증 경계:** [Godot + C++ 개발](/game/godot-cpp.md)의 생성 건물 조합·상호 상이 규칙을 팩/제품 요구로 한정합니다. 카메라 inset 식의 canvas 단위, 작은 맵의 빈 구간, 꼭짓점의 focus 충돌과 머리 높이·여유에 따른 가장자리 셀의 충돌을 확인해 우선순위·검증 기준을 보강합니다. `CACHE_MODE_IGNORE`의 외부 의존성·기존 캐시 한계와 export remap을 구분하고 소스 anchor를 정정합니다. 이번 확인은 공식 소스 대조와 수학적 재현이며 게임 엔진 실행을 주장하지 않습니다.

## 2026-10-07
* **Learning — IDE와 원격 빌드 환경의 분리:** [기본 도구](/tools/builtin.md)에 셸 export와 IDE 빌드 프로세스의 환경을 구분하고, 원격 의존성 경로를 실제 target 환경에서 해석하며 잘못된 명시 경로를 숨기지 않는 기준을 추가합니다. 환경변수 없는 원격 CMake 구성과 실제 target 빌드로 확인한 기준입니다.
* **Learning — accept 자원 고갈과 기존 연결 보존:** [게임 서버 체크리스트](/game/server-checklist.md)에 일시 accept 오류의 timer-backed 재시도, 기존 연결 유지, 연결 상한과 OS FD 여유의 startup 대조를 추가합니다. 실제 프로세스의 FD 한도를 낮춘 재현과 복구 검증에서 확인한 일반 기준이며 프로젝트별 값·인증서·경로는 공개하지 않습니다.
* **Learning — 공통 전송과 모바일 OS 통합의 경계:** [네트워크 동기화](/game/network-sync.md)에 단일 전송 구현과 최소 OS 문맥 연동을 구분하는 기준을 추가합니다. Apple TN3151의 BSD sockets 허용 조건, 수동 DNS 연결의 VPN On Demand 제한, 소켓별 DNS/viability 책임과 자체 CA 검증의 시스템 신뢰 정책 차이를 명시합니다. 공식 문서 정적 대조이며 특정 라이브러리의 모바일 빌드·실기기 동작 보장은 아닙니다.
* **Learning — 모바일 경로 전환과 게임 세션 복구:** [네트워크 동기화](/game/network-sync.md)에 OS 경로 알림·실제 서비스 도달성·QUIC migration·게임 resume·앱 suspension의 구분, 단일 복구 소유자와 낡은 callback 차단, 단말 에너지·상태 나이·권위 결과 기준의 비교를 추가합니다. [게임 보안](/security/game.md)에 재개 토큰의 인증된 암호화 채널, 서비스 이름 검증, token 회전의 소비자 호환성, 0-RTT와 일반 재시도의 replay 경계를 보강합니다. 표준·공식 플랫폼 문서·논문 원문 정적 대조이며 실기기나 라이브러리 성능 재현 결과는 아닙니다.
* **Learning — 서버 판정 콘텐츠 테이블의 소유 경계:** [게임 서버 체크리스트](/game/server-checklist.md)에 서버 판정 테이블의 소유와 fail-closed 검증 기준을 추가합니다. **정정(2026-10-08):** 다음 리스폰 시각의 무조건 비복제는 제품 선택을 일반화한 오류이므로 공개 계약 밖 정보에만 적용합니다. 프로젝트의 지역별 수량·필드 좌표·밸런스 수치는 로컬에 유지합니다.
* **Learning — MCP backend 버전 고정과 runtime 교체:** [MCP 정책](/tools/mcp.md)에 실행 경로별 backend 버전 고정과 staging 검증·백업 원칙을 추가합니다. **정정(2026-10-08):** 프로세스 종료 직후 자동 재시작보다 먼저 디렉터리를 바꾸는 절차는 안전하지 않아 폐기했습니다. 소비자와 재기동 주체의 정상 중지를 확인한 뒤 교체하고, 명시적 재활성화 후 실제 버전·실행 경로를 확인합니다. 프로젝트 경로·버전 이력은 공개 문서에 싣지 않습니다.

## 2026-10-06
* **Learning — 아이소메트릭 맵 가장자리 카메라:** [Godot + C++ 개발](/game/godot-cpp.md)에 마름모 맵의 축별 inset과 AOI 시야 포함 관계, 실제 창의 역변환 기반 경계 검증을 추가합니다. **정정(2026-10-08):** inset과 캐릭터 focus는 꼭짓점에서 동시에 만족할 수 없고 높이·여유에 따라 가장자리 셀에서도 충돌하며, 작은 맵에는 유효 중심 구간도 없을 수 있습니다. canvas 단위와 제품별 충돌 우선순위를 정본에 명시했습니다. 특정 프로젝트의 마을 배치·수치는 로컬에 유지합니다.
* **Learning — 생성 건물의 디자인 다양성:** [Godot + C++ 개발](/game/godot-cpp.md)에 조건별 후보 수·조합 미리보기·반복 억제·atlas 메모리 검증 기준을 추가합니다. **정정(2026-10-08):** 재질 혼합·면 회전·복수 문 금지와 건물군 상호 상이를 일반 규칙으로 적은 것은 제품 선택의 과잉 일반화였습니다. 팩의 계약과 프로젝트 요구가 정한 범위에만 적용합니다. 프로젝트의 디자인 목록·수치는 로컬에 유지합니다.
  - 핵심 건물군의 탐욕적 후보 실패를 전체 배치 불가능으로 오인하지 않는 기준, 사용자 조건과 임의 벽 여유의 분리, 문 양옆을 포함한 전체 유한 후보 검토와 화면 위쪽 부호 조건의 독립 검증을 보강합니다.
* **Learning — 접촉 트리거 전환 요청:** [게임 네트워크 동기화](/game/network-sync.md)에 접촉 거리의 서버 허용 범위 검증, 중복 요청·실패 반복·도착 ping-pong 방지 기준을 추가합니다. **정정(2026-10-08):** 요청 전 소비와 표본별 재시도의 충돌은 대기·요청 중·일시 거부·최종 소비로 분리하고 재시도 예산을 둡니다. 자동 조작 비전환과 도착점 선택은 제품 정책이며 거리 검증은 동적 콘텐츠 로드도 포함합니다. 기존 장면 검증은 해당 구현의 근거이지 모든 제품의 정책을 확정하는 근거가 아닙니다. 프로젝트 좌표·수치는 싣지 않습니다.
* **Learning — 전환 재진입 비용과 리소스 캐시 존재 확인:** [Godot + C++ 개발](/game/godot-cpp.md)에 검증한 장면·정의 쌍과 지도 무관 표시 리소스의 재사용, 완료 상태로 부분 생성 재사용 방지, 첫 진입·캐시 재진입·단계별 전환 비용과 텍스트/바이너리 리소스 측정의 구분을 추가합니다. 고정 4.7.2 `ResourceLoader::exists()`가 캐시된 경로에서 디스크를 확인하지 않는다는 엔진 소스 근거와, 기본 캐시 모드로 보관한 리소스가 파일 누락 실패를 숨기는 위험을 기록합니다. 프로젝트별 지도·수치는 공개 문서에 싣지 않습니다.
* **Learning — 전투 표시 시간축 근거의 경계:** [게임 네트워크 동기화](/game/network-sync.md)에 버퍼 목표 깊이와 원인 사건 대비 실제 표시 시차를 구분해 측정하는 기준, 공개 자료가 자기 HP·피격의 표시 시각을 거의 밝히지 않는다는 근거 한계, 가해 측 명중 연출 예측과 피해자 측 연출을 같은 범주로 인용하지 않는 기준을 추가합니다. 조회일은 2026-10-05 UTC이며 업계 채택률은 주장하지 않습니다.
* **Correction — 캐시 재사용의 메모리 조건:** [Godot + C++ 개발](/game/godot-cpp.md)의 장면/표시 리소스 보관 권고를 메모리 예산·퇴출 정책이 있는 경우로 제한합니다. 메모리 우선의 현재 장면 보관, 전환 중 실패 복구 참조, 퇴출 장면 재검증과 권위 상태 보존을 구분합니다. 사전 로딩한 측정과 cold load, 텍스트/실험용 바이너리와 export 성능을 구분하도록 보강합니다.

## 2026-10-05
* **Learning / Correction — 프레임 정체와 동기화 복원:** [게임 네트워크 동기화](/game/network-sync.md)에 soft 보정에서 연속인 stride 좌표·중첩 replay의 set 의미, 수신 상대 표시 시계의 단조성/선행 상한, 최초 경로 원점·전체 cursor와 불변 cache의 검증 후 채택, 병합되는 불연속 marker의 세대 경계를 반영합니다. tick 기반 논리 시각을 wall-clock 처리 시각과 혼동한 기존 문장을 정정하고 공유 호스트의 부채 제한/표시 진행·일반 네트워크 지터를 구분합니다. 실제 render cadence·프레임 정체·위상·상태와 시각 정책의 별도 검증을 추가하며 프로젝트별 수치·경로·실행 기록은 공개 문서에 싣지 않습니다.
* **Learning — AI 생성 코드의 검토 비용과 검증 경계**: [영상](https://youtu.be/3JCgiVYlLFo)의 전체 자막·설명과 원문을 대조했습니다. [Attention Span](https://github.com/alexgreensh/attention-span/blob/2714c965e6be1fa2597510e66651e63bc67cb448/output-styles/attention-kind.md)의 정보 손실 없는 간결성, [커뮤니티 Karpathy 지침](https://github.com/multica-ai/andrej-karpathy-skills/blob/2c606141936f1eeef17fa3043a72095b4765b9c2/CLAUDE.md)의 최소 구현·성공 기준, [verification-before-completion](https://github.com/obra/superpowers/blob/8ca22dba9a94f28898bbce59f2537ff4d87c747d/skills/verification-before-completion/SKILL.md)의 증거 우선은 기존 지침으로 유지합니다. [코딩 스타일](/coding-style.md)에 줄 수보다 검토할 판단을 줄이는 기준과 Kotlin 공식 문서의 중복 키·얕은 복사·동등성 계약을, [워크플로](/workflow.md)에 정적 검사와 실제 실행 증거의 구분 및 검사 범위·실패 조건·우회 금지를 보강합니다. [anti-slop](https://github.com/dmmulroy/anti-slop/blob/c44ef22ca116d0ba62a3ff663a0bd13a3f3fa40b/README.md)은 저자 취향이며 지침·lint 명령만으로 강제 실행을 보장하지 않습니다. 외부 스킬·플러그인 설치, 언어 전환, 인기·생산성 수치 및 광고성 강의 안내는 채택하지 않습니다.
  - **원문 심화 대조:** anti-slop의 [설치 스킬](https://github.com/dmmulroy/anti-slop/blob/c44ef22ca116d0ba62a3ff663a0bd13a3f3fa40b/skills/install-anti-slop/SKILL.md)과 [조건부 spread 규칙 구현](https://github.com/dmmulroy/anti-slop/blob/c44ef22ca116d0ba62a3ff663a0bd13a3f3fa40b/skills/install-anti-slop/assets/anti-slop/rules/no-conditional-empty-object-spread.ts)을 읽고, 자동 수정이 없는 이유인 필드 생략/`undefined` 의미 차이와 타입 정보를 지웠다가 단언으로 되돌리는 우회를 코딩 기준에 반영합니다. `unknown`·`typeof` 전면 금지, 특정 이름 금지, Effect 전용 정책은 도입하지 않습니다.
* **Config / Learning — 역할별 모델 재평가**: 공식 모델 목록과 독립 평가·개발자 실사용의 개선/실패 사례를 대조해 관리 소스의 `smol`·`commit` 및 advisor의 OpenAI fallback을 GPT-6.1 Sol로 갱신합니다. Astra·Luna·Opus 5.5·Fable 5.1과 추론 강도·quota·검토 독립성 정책은 유지합니다. [에이전트 가이드](/agents/guide.md)에 최신 출시와 역할 적합성, 벤치마크·사용자 신고·로컬 실호출의 증거 경계를 기록합니다. 소스 프로필과 각 환경의 적용 상태는 구분합니다.
* **Correction — Fable 플랜 권한과 과금**: 이전 안내의 “Pro에도 제공”는 구독 기본 한도에 포함된다는 뜻이 아닙니다. [공식 플랜 안내](https://support.claude.com/en/articles/15424964-claude-fable-models-on-your-plan)에 따라 Pro·standard 좌석은 별도 usage credits가 필요하고 Max·premium 좌석도 기존 주간 한도 안에서 사용한다는 점을 README와 에이전트 가이드에 명시합니다.
* **Correction — 게시 전 게임 지침 검토**: [게임 네트워크 동기화](/game/network-sync.md)의 grace 확인을 수락 응답 설치 후 uplink로 제한하고 미확인 재개 실패의 신규 접속 복구, 불연속 hold의 목표 식별자 이상 비교를 명시합니다. [Godot + C++ 개발](/game/godot-cpp.md)의 팩별 tile origin 값을 anchor 계산식으로 일반화하고, 바인딩/엔진 모듈의 duplicate 기본값과 화면비/stretch 조건을 구분하며 고정 소스 인용·목차를 보강합니다. 엔진·게임을 재실행한 결과가 아니라 문서·고정 소스의 정합성 검토입니다.
* **Correction — 게시 전 작업·보안 지침 검토**: [보안 개요](/security/overview.md)의 자격증명 삭제 범위를 계정·필요한 path로 좁히고 승인된 작업의 인증 복구와 위험 경고를 분리합니다. [워크플로](/workflow.md)의 동시 편집 검증 기준을 기존 미커밋 변경까지 포함한 시작 snapshot으로 고치고, [기본 도구](/tools/builtin.md)의 로컬 파일 접근 권한을 필요한 경우로 제한합니다. [지도 정책](/project-navigation.md)의 절대 경로 기록 위치·넓은 Reader 예산 조건을 정정하고 [서브에이전트](/tools/subagents.md)의 복구를 무조건 되돌림으로 제한하지 않습니다.

## 2026-10-04
* **Learning / Correction — 고정 표시 프로필:** [Godot + C++ 개발](/game/godot-cpp.md)에 안정된 표시를 위한 원형별 기준 크기·anchor와 현재 애니메이션 실루엣의 분리, 고정값과 모든 대상의 동일값을 구분하는 기준을 추가합니다. 고정 엔진의 `frame_pre_draw` 발행 스레드도 실제 호출 순서로 확인하도록 보강합니다. 특정 프로젝트의 형태·튜닝 선택은 로컬에 유지합니다.
* **Learning — 부분 가림과 렌더 데이터 경계:** [Godot + C++ 개발](/game/godot-cpp.md)에 고정 엔진의 y-sort quadrant 원점·근사 동률, GLES Compatibility의 float→half 데이터 텍스처 변환과 RGBA8 정밀 인코딩 주의, 주입한 표시 시각과 라이브 세션 시계의 검사 분리를 추가합니다. 게임별 대상·형태·수치는 로컬에 유지합니다.
* **Learning — 불연속 전환의 입력 경계:** [게임 네트워크 동기화](/game/network-sync.md)에 명령 credit과 별개인 방향 입력의 미ACK 이력·권위 큐를 포함한 정숙 조건, 경로 폐기가 필요한 전환의 보정 전 경로 정지, 정확한 불연속 표본까지 입력 hold, 재접속/resync의 hold 해제와 READY 전 입력 거부를 추가합니다.
* **Learning — 정규형 정밀도와 투명 조립:** [Godot + C++ 개발](/game/godot-cpp.md)에 정수 단위에서 복원하는 float/double 정밀도 불일치를 게시→런타임 로드까지 검사하는 기준과, 투명 문/창/판자 아래 재질을 실제 예제·엔진 화면으로 확인하는 기준을 추가합니다. 특정 프로젝트의 배치·에셋·수치는 공개 문서에 싣지 않습니다.
* **Learning / Correction — 에디터 도구 의존성:** [Godot + C++ 개발](/game/godot-cpp.md)에 고정 4.7.2 엔진의 editor/override.cfg 로딩 차이, addon 활성화·autoload의 설정 저장 경계, 필수 의존성/별도 개발 프로젝트 선택, 원본 source hash와 checkout 줄바꿈 보존의 구분을 추가합니다. 고정 소스·Git 게시·실행·export를 각각 증명하며 lock을 자동 업데이트 차단으로 표현하지 않습니다.
* **Learning / Correction — 가림 판정과 스모크 경계:** 같은 문서에 alpha 교집합만으로 앞뒤 정렬 결함을 단정하지 않고 실제 접촉·정렬·화면을 대조하는 기준, 지원하지 않는 정밀 타일의 명시적 거부와 수동 편집 보존, frame_post_draw 기반 초기화의 headless draw 진행과 동기 검사/liveness 간섭을 구분하는 기준을 추가합니다.

## 2026-10-03
* **Learning / Correction — 정밀 충돌 뒤의 앞뒤 정렬:** [Godot + C++ 개발](/game/godot-cpp.md)에 셀보다 좁은 충돌을 도입한 뒤 표시 footprint 앞 경계로 정렬한 차단 소품이 앞에 선 배우 위에 그려지는 결함, strip 열별 충돌 앞면 정렬과 뒤쪽 동률 규칙, 셀 중심 정렬 TileMapLayer의 얇은 형상 한계, 전체 폭 샘플링과 이전 맵 재현·실제 창 앞뒤 접촉 검증 기준을 추가합니다. 표시 범위로 정렬을 계산하라는 기존 안내도 정정합니다. 표시 범위는 분할·그림 보존·인접 셀 가림에, 앞뒤 정렬 키는 차단 여부에 따라 충돌 앞면 또는 표시 앞 경계에 사용합니다.
* **Learning — 대규모 에디터 보호 상태와 소유권:** [Godot + C++ 개발](/game/godot-cpp.md)에 subtree별 typed-array hash로 단일 Variant 직렬화 크기를 제한하는 기준, 공용 리소스 정체성과 부분 셀의 source 소비 분리, 기준선 버전과 중첩 편집/순서/복구 검사, 분리된 후보의 owner 비우기·재부착 후 복구를 추가합니다.
* **Learning — 반복 도색의 표현 비용:** 같은 문서에 실행 성공과 자원 수락의 분리, 반복 crop 노드/출처 metadata 대신 공유 표시 데이터를 사용하는 기준, 원본 보존·crop 합성 화소/hash·실제 alpha 포함 관계·import 필터와 실측 메모리의 분리 확인을 추가합니다.
* **Learning / Correction — 정밀 지면·생성 유형·저장 정밀도:** [Godot + C++ 개발](/game/godot-cpp.md)에 배치 셀과 실제 지면 형상 분리, exporter/canonical/runtime geometry 대조, 공간 index와 부분 셀 경로 접속, 도시/숲 구조 및 길/공터 선택 분리, 정수 식별자·full-precision 생성 설정·엔진 text writer에 맞춘 보호 hash round-trip 검증을 추가합니다.

## 2026-10-02
* **Learning — 게임 에셋의 AI 입력·학습 권리**: [Godot + C++ 개발](/game/godot-cpp.md)의 구매 팩 검수에 취득 채널별 게임 사용·AI 참조/LoRA 학습·생성물 판매·도구/모델 배포 권리의 분리 확인을 추가합니다. Unity 약관의 명시적 동의와 AI 입력 제한, 로컬 추론/벤더 미학습 약속의 한계, 서비스별 보관·재판매·벤치마킹·경쟁 제품/모델 조항 및 약관 조사와 사용자 실행 승인의 차이를 구분합니다.
* **Learning — 에디터 후보·부분 재생성·표시 범위**: [Godot + C++ 개발](/game/godot-cpp.md)에 저장 전 편집을 보존하는 명시적 Node 복제 flags, 분리된 Node2D 후보의 local transform 합성과 round-trip 검증, 보호 hash의 순서/에디터 metadata 정규화·버전 경계, 물리 footprint와 별도인 소품 표시/정렬 범위 및 실제 앞뒤 보행 검증을 추가합니다.
  - **정정(2026-10-03):** 표시 범위에서 정렬 키를 계산한다는 안내를 차단 소품까지 일반화하지 않습니다. 차단 소품의 열별 충돌 앞면과 비차단 장식의 표시 앞 경계를 구분하도록 현재 본문을 수정했습니다.

## 2026-10-01
* **Learning / Correction — 타일 연결과 시각 판정**: [Godot + C++ 개발](/game/godot-cpp.md)에 지형 전이 조각을 무작위 변형으로 섞지 않고 이웃 변·모서리와 흙색을 맞추는 기준을 추가합니다. 같은 방향 접미사라도 모듈별 면을 확인하고, 제작자 예시·원본 조립·실제 엔진의 발/그림자/가림을 대조하며, 평탄 포장과 들린 블록을 구분하고 지면만 높여 연석을 만들지 않는 기준을 함께 둡니다.
* **Learning / Correction — 포장 역할·도로 중심·첫 입장 화면**: 같은 문서에 포장 내부/방향별 연석/코너를 분리하고 짝수 칸 도로의 기하학적 중심과 실제 페인트를 대조하는 기준을 추가합니다. 입체 타일의 측면을 노면선으로 겹쳐 그리지 않도록 원본 영역 crop과 엔진 표시를 확인하며, 생활 허브는 전체 지도 중심뿐 아니라 기본 카메라·HUD의 첫 입장 화면과 시설/NPC 접근·출발·귀환 동선으로 검증합니다.
* **Learning / Correction — 구매 팩 표시 배율과 이동감**: [Godot + C++ 개발](/game/godot-cpp.md)에 같은 PPU로 만든 타일·캐릭터 팩은 모든 아트를 같은 배율로 표시하고 가독성은 카메라 줌으로 해결하는 기준, 이동 속도를 화면상 몸 길이/초로 다시 확인하는 기준, 배율 변경 뒤 stride·picking·라벨·효과 부착을 다시 측정하고 줌과 무관한 월드 표시는 역배율하는 기준을 추가합니다. 캐릭터만 확대하면 차량·문·소품과의 비율이 깨진다는 사용자 교정에서 나온 교훈입니다.
* **Learning — TileMapLayer 원점·다중 셀 정렬**: 같은 문서에 Godot 4.7 `TileMapLayer`의 그리기 시작점(`−texture_size/2 − texture_origin`)과 128×256 타일 `texture_origin=(0,+80)`, 128×64 `DIAMOND_DOWN`의 `map_to_local(0,0)=(64,32)` 실측과 층 공통 이동량 한 번의 원칙, 다중 셀 물체를 셀별 모듈·strip으로 정렬하는 기준을 추가합니다.
  - **정정(2026-10-05):** `texture_origin=(0,+80)`은 특정 팩의 기준 픽셀에 대한 실측 예이지 128×256 타일의 공통값이 아닙니다. 현재 본문은 `texture_origin = anchor − texture_size/2` 계산식과 변형 조건을 사용합니다.
* **Learning — 저속 경로 재계획 진동**: 같은 문서에 주기적 목적지 재계획이 매번 현재 칸 중심으로 돌아가 저속에서 왕복하는 결함, 안전이 증명될 때만 시작 칸 중심을 건너뛰는 수정, 반복 재계획 회귀와 막힌 모서리 음성 사례를 함께 두는 기준을 추가합니다.
* **Learning — 격리 작업의 자동 적용**: [서브에이전트 위임](/tools/subagents.md)에 `isolated` 작업 결과가 부모 트리에 자동 적용되어 다른 소유자의 호출부가 남은 시그니처 변경이 제품 빌드를 깨뜨리는 경우의 범위 지정·patch 산출·부모 트리 전체 빌드 확인, 되돌림 또는 호출부 갱신과 동시 작업자 공지 기준을 추가합니다.
* **Learning / Correction — 대화로 받은 자격증명**: [보안 개요](/security/overview.md)에 사용자가 대화로 준 비밀번호·토큰을 명령줄·환경 변수 리터럴·인라인 credential helper에 넣으면 기록에 남는다는 점과, credential manager 대화형 로그인 또는 환경 변수 이름 참조를 쓰고 보고에 값의 일부도 적지 않는 기준을 추가합니다.
* **Learning — 거부된 저장 자격증명 복구**: [보안 개요](/security/overview.md)에 승인된 HTTPS push의 인증 실패 뒤 로그인 경로를 먼저 확인하고, 계속 실패할 때만 사용자 승인 후 `protocol`·`host`·`username`(필요 시 `path`)으로 helper의 삭제 범위를 좁히는 기준을 추가합니다. host만 지정한 삭제를 특정 계정 삭제로 표현하지 않으며, 저장 비밀값 조회·출력, 다른 host 항목·전역 helper 변경은 하지 않습니다.
* **Learning — 화면 안 사거리·자동 사냥 대상 선택**: [Godot + C++ 개발](/game/godot-cpp.md)에 “사거리가 카메라 밖으로 나가지 않게”를 화면 판정이 아닌 월드 사거리 상한으로 두고, 선형 아이소메트릭 투영의 원→축 정렬 타원 반축으로 최대 줌·기준 화면비에서 산출해 카탈로그·카메라 상수를 컴파일 시 assert로 묶는 기준을 추가합니다. 수동 조준용 정면 우선+대상 유지 규칙이 자동 사냥에서 바로 옆 위협을 무시하는 결함, 기준점(후보 범위 중심)과 거리 기준(플레이어)을 분리해 둘이 떨어진 회귀 사례를 두는 기준, 클라이언트가 권위의 엄격한 사거리 경계에 정확히 만든 지면 지점이 반올림으로 약 절반 거부되는 문제와 작은 안쪽 여유도 함께 둡니다.
* **Learning — 사용자 동시 편집 중 검증 격리**: [워크플로](/workflow.md)의 정본 검증에 사용자 편집을 되돌리지 않고, 기존 미커밋 변경까지 포함한 작업 시작 snapshot에 이번 변경만 적용한 격리 복사본으로 검사하는 기준을 추가합니다. 같은 파일의 편집을 분리할 수 없으면 미분리로 보고하며, 유지 지도에서 미대조 사용자 변경 파일의 hash를 갱신하지 않습니다.

## 2026-09-30
* **Learning — 구매 스프라이트·타일 팩 검수**: [Godot + C++ 개발](/game/godot-cpp.md)에 반입 전 시트 방향 행 순서·열↔개별 frame 대응·그림자 포함 여부를 픽셀 대조하는 기준을 추가합니다. frame 전체 평균 차이는 작은 인물의 복제 결함을 놓칠 수 있어 채널별 임계 초과 화소 수로 판정하고, 배우·동작 간 바이트 동일 파일·폴더/파일명 불일치·빈 변형 폴더를 제작 결함 후보로 확인합니다. 판매 페이지의 타일 규격·피벗은 실측과 대조해 출처별로 구분하고, 목록 문서의 수량·범위·크기 주장은 원본 재집계 검사와 틀린 사본의 실패로 검증합니다. 작은 썸네일로 붙인 내용 라벨은 확대 확인에서 다수 틀렸으므로 검색에 쓰일 라벨부터 원본 크기 이상으로 확인하고 나머지는 근사 표시와 시각 색인 링크로 두는 기준도 둡니다. concept 설명과 root·game index 요약도 맞춥니다.
* **Integration / Learning — Archify**: 고정 Archify 3.0.1 배포본과 출처·라이선스 고지를 레포에 포함하고 POSIX·PowerShell setup에 로컬 스킬 배포를 연결합니다. 설치 중 외부 코드 실행·다운로드는 하지 않고, 동일본은 생략하며 다른 기존본은 보존합니다. 스킬 지침은 명시적 요청·`.omp-artifacts/` 산출물·업데이트 확인 비활성화·외부 로고 접근 범위를 구분합니다. [스킬](/tools/skills.md)에 OMP 18.4.4 native 배포 경로, 프로필 재지정, 발견/슬래시/실행 검증과 숨김/권한 경계의 차이를 반영합니다.
* **Fix — 설치 경계·복구 안내**: setup의 문자열 경로 비교만으로는 레포 별칭을 통한 원본 OKF 삭제를 막지 못하므로 설정·배포 전에 공통 실제 경로 검사를 추가합니다. 스킬 교체 실패 시 원래 위치로 복구된 기존본과 백업에 남은 기존본을 구분하고, 복구도 실패하면 최초 오류·복구 오류·준비본/백업/활성 경로를 함께 보고합니다.
* **Workflow / Learning — 프로젝트 목차·상태·계획**: [프로젝트 지도와 작업 동기화](/project-navigation.md)를 추가하고 전역 작업 시작/완료 경로와 `/project-map` 명령에 연결합니다. 알림 후 진행을 기본으로 하며 실질적인 선택·필수 승인만 묶어 확인합니다. 승인된 프로젝트 유지 선언, 전체/상세 지도와 실제 심볼 목차, 구현/검증 상태, 확정/제안 계획의 의존성·완료 기준을 한 진입점에 연결합니다. 작업 트리 수동 대조와 native 커밋 근거를 구분하고, scoped fingerprint·단일 통합 담당자·staging 검증 후 바이트 동일 게시·읽기 전용 status를 적용합니다. 노드/함수 고정 상한·매 작업 승인·무조건 Delta·자동 커밋·전역 watcher는 도입하지 않습니다. hello-omp의 지도 선언은 루트 AGENTS.md에만 두고, 스킬 메타데이터·배포/발견 concept 요약과 관련 index도 정합화합니다.
* **Reader UI / Correction**: 프로젝트 문서는 좌측 책임 메뉴와 선택 본문 하나로 구성하고, 본문/관계도/계획의 대상 ID를 일치시킵니다. 한 줄 역할·상태·핵심 표를 우선하며 펼치기/숨기기 UI는 두지 않습니다. 메뉴/본문의 너비는 같은 grid 계약을 사용하고, 검증된 SVG viewBox로 프레임 높이를 계산해 너비 변경에도 잘림과 불필요한 공백을 막습니다. source scope의 추가·삭제·변경 탐지, 그림 실패 시 정본 보존, 노드 소유·검색·이력 이동을 검증 기준으로 둡니다.
* **Learning — 로컬 호스트 범위**: [Godot + C++ 개발](/game/godot-cpp.md)의 「로컬 인게임과 서버 이관」에 이관 대비 동기화 계약 검증 요구를 두 번째 호스트 구현 승인으로 확대하지 않는 기준을 추가합니다. 서버 개발 결정 전에는 별도 서버 프로세스·소켓 전송·wire codec/framing·접속 제한·서버 bench를 만들지 않고 프로세스 안의 논리 메시지 경계로 검증하며, 요청 밖으로 만든 계층은 shim 없이 제거하고 금지 범위를 규칙 문서에 남깁니다.
* **Learning — 미설치 수락 세션과 grace**: [게임 네트워크 동기화](/game/network-sync.md)에 클라이언트가 수락 응답을 설치하기 전에 끊긴 신규 세션은 재개 주체가 없어 grace 없이 제거하고, 전달 중인 재개 응답의 세션은 grace를 유지하는 기준을 추가합니다. 여러 끊김 경로는 공통 지점에서 판정하고, 남용 방지 규칙을 제거할 때 그 규칙이 맡던 정상 경로 정리를 확인하며, 새 토큰은 만료 세션 기록과도 충돌하지 않게 합니다.
  - **정정(2026-10-05):** 서버는 설치 여부를 직접 볼 수 없으므로 수락 응답 설치 후에만 보낼 수 있는 uplink 수신으로 확인합니다. 미확인 세션의 제거와 확인된 세션의 grace를 구분하고, 설치 직후 첫 uplink 전에 끊긴 경우는 만료 응답·신규 접속으로 복구합니다. heartbeat 감지와 grace도 별도 값으로 설명합니다.
* **Learning — 유지 지도 검증 환경·코드 위치 표기**: [프로젝트 지도와 작업 동기화](/project-navigation.md)에 기존 신뢰 Node 실행 파일의 버전 확인, 절대 경로를 로컬 증거에만 보존하는 기준, 고정 Archify 3.0.1의 Reader 예산 조건과 넓은 노드의 바깥 경로를 피하는 배치 기준을 추가합니다. 목차 본문에는 `파일 · 심볼명`을 쓰고 줄 번호는 fingerprint로 고정한 근거에만 둡니다. [omp 기본 도구](/tools/builtin.md)에는 로컬 파일 접근 허용 플래그를 필요한 경우에만 쓰고 기본 브라우저 조건과 구분하는 기준을 반영합니다.
* **Learning — clip 전환의 발 위치 측정**: [Godot + C++ 개발](/game/godot-cpp.md)의 이동 애니메이션 기준에 공유 pivot을 쓰는 clip의 경계 frame을 시트에서 정합하는 방법을 추가합니다. 구워진 반투명 그림자를 뺀 인물 mask와 같은 mask의 합성 이동 양성 대조를 함께 쓰고, 탐색 범위 끝에 걸린 정합은 측정 실패로 제외합니다. alpha 경계 하단·frame별 하체 중심값을 발 좌표나 걷기↔대기 정합의 근거로 쓰지 않으며, 확인한 경계와 측정하지 않은 전환·해부학적 발 좌표를 구분해 적습니다.

## 2026-09-29
* **Config**: 현재 환경의 사용량 잔여 기준을 유지하는 선택에 따라 공유 설정의 `retry.usageReservePct`를 10에서 1로 맞추고 [에이전트 가이드](/agents/guide.md)의 자동 fallback 기준을 잔여 1%로 동기화합니다. 모델 배정·fallback 후보·`usageReservePolicy=auto`는 유지합니다.
* **Clarify — 가독성**: [언어 공통 코딩 스타일](/language-style.md)의 독립 제어문·다음 문장 사이 빈 줄과 연결된 `else`·`catch`·`do`–`while` 예외를 구체화합니다. 멤버는 역할·불변조건별로 묶고 상수·정적 상태·인스턴스 상태 및 메서드와 구분하며, C++ 초기화·소멸·레이아웃 계약을 보존하도록 명시합니다. Good/Bad 예시·완료 전 확인·요약표와 글로벌 지침·[코딩 스타일](/coding-style.md)·index의 진입 경로를 보강합니다. 한 줄 우선은 식의 폭에 관한 규칙이며 세로 여백 생략이 아님을 명확히 합니다.
* **Correction / Clarify — 가독성 전반**: [언어 공통 코딩 스타일](/language-style.md)의 기존 관례 우선 규칙과 작성·수정 범위의 가독성 최소 기준을 분리합니다. 문장 압축·복합 조건·중첩 삼항·함수 책임·람다·switch 경로, 이름/단위·호출 인수·일반 주석 기준을 보강하고 상수·정적 상태 및 C 예제의 간격 불일치를 수정합니다. 멤버의 초기화, 모든 언어의 중간 삽입/재배치 계약, 평가 순서·수명·복사/할당·성능 배치를 보호하며, 조건식과 역할별 배치 예제·요약표·글로벌 진입 안내를 맞춥니다. 긴 선언/호출을 폭만으로 접지 않는 선택과 무관한 재포맷 금지는 유지합니다.
* **Clarify — 간결성과 압축의 구분**: [코딩 스타일](/coding-style.md)의 결정 사다리 6단계 “한 줄로 되는가? 한 줄로 끝낸다”와 글로벌 요약의 “한 줄”을 “간단한 식·기존 호출”로 명확히 합니다. 최소 구현을 택한다는 의도는 유지하면서 여러 문장·블록을 한 줄로 압축하라는 오해를 막습니다. 선언·시그니처·호출·체인을 폭 때문에 접지 않는 한 줄 우선과 선언당 변수 하나 원칙은 유지합니다.
* **Learning**: [Godot + C++ 개발](/game/godot-cpp.md)에 중앙 메모리 정책과 단일 전역 풀의 구분, 타입·수명별 저장소와 예약 예산, 고갈·핸들/비동기 반납, 로딩 반영/해제 예산을 추가합니다. 고정 배열·스택의 비용과 CRT 할당 관측의 범위·양성 대조군을 명시하고 에이전트 기억이나 RSS 안정만으로 단편화·성능을 보장하지 않습니다. 특정 프로젝트 용량·구현 선택은 공개 규칙으로 강제하지 않습니다.
* **Learning**: [게임 네트워크 동기화](/game/network-sync.md)에 권위 입력 시뮬레이션과 좌표 보고 검증의 구분, 속도·tick/누적 시간 예산, 패킷별 오차 적립 방지, 충돌·승인된 특수 이동, 거부/보정과 치트 제재의 분리를 추가합니다. 고정 delta·로컬 시계 검사를 온라인 방어 완료로 보지 않으며, 공식 이동 검증 문서의 beta 문구와 정식 공개 공지 간 불일치를 명시합니다.
* **Learning**: [게임 네트워크 동기화](/game/network-sync.md)에 공통 시간 구현과 여러 시간 도메인의 구분, 정밀도·서버 기준시계/tick 대응·동기화 표본/epoch·로컬 호스트 계약을 추가합니다. Riot의 LoL/VALORANT 차이, 고정 Mirror 소스와 time-sync 가이드의 의미 차이, Valve 논문의 시계 동기화 가정과 보간/rewind 범위를 명시하며 제품별 수치를 보편 규격으로 일반화하지 않습니다.
* **Correction / Learning**: [게임 네트워크 동기화](/game/network-sync.md)에 실측 핑의 요청/응답 상관·단조 시계·표본 만료와 UI 반올림을 명시합니다. 로컬 연결의 예상 0 ms를 고정값으로 대체하지 않으며, 처리시간을 포함하는 애플리케이션 RTT와 전송 지연 추정을 구분합니다.
* **Correction — namespace 들여쓰기**: [언어 공통 코딩 스타일](/language-style.md)의 기존 “네임스페이스 내용 추가 들여쓰기 없음” 기본값을 이름 있는·익명 네임스페이스의 **블록 깊이마다 공백 4칸 추가**로 대체합니다. Allman 중괄호는 선언과 같은 깊이에 두며 C++17 `namespace A::B` 단일 정의는 한 블록, C# 블록형 namespace도 같은 규칙, C# 파일 범위 namespace는 추가 깊이 없음으로 명시합니다. 기존 예제·Good/Bad 중첩 예제·요약표, [코딩 스타일](/coding-style.md)의 참조와 [Godot + C++ 개발](/game/godot-cpp.md)의 익명 네임스페이스 예제를 맞춥니다. 이는 공개 스타일 선택의 정정이며 언어·ABI·동작 계약을 바꾸지 않습니다.
* **Learning — 동기화 복원·장애 경계**: [게임 네트워크 동기화](/game/network-sync.md)에 미래 동작을 재현하는 checkpoint와 경로 provenance/cursor, 입력·명령 ACK의 동일 prefix 검증, 같은 ACK의 새 보정과 중복 구분을 보강합니다. 결과 outbox의 소유권·용량 예산, 실제 처리/terminal 폐기 경계, 장애 상태의 선행 결과 소비와 플레이 재개의 분리를 명시합니다. 권위 tick을 독립 경과시간에도 대조하고 표본·렌더 관측 시점을 맞추는 검증 기준을 추가하며, 프로젝트별 표현·수치·전송 선택은 일반 규칙으로 강제하지 않습니다.
* **Learning — 애니메이션 시간축·입력 신선도**: [게임 네트워크 동기화](/game/network-sync.md)에 상태/시작 기준과 표시 시각의 대응, 늦게 도착한 연출·재진입·중복 소비, 보행 위상과 시각 보정 변위의 분리, 입력/표본 부족과 정지의 구분을 추가합니다. 엔진 자동 재생의 scaled delta를 권위 시간과 혼동하지 않고 판정/연출·root motion 경계를 명시합니다. RTT·큐 해소·위치 수렴과 입력 나이 회복도 별도로 검증하며 특정 주기·클립·프로젝트 값을 공통 규칙으로 고정하지 않습니다.
* **Learning — 주기 비용·이득 산정**: [게임 네트워크 동기화](/game/network-sync.md)에 틱·송신·입력 패킷 주기의 비용 비례와 입력 대기 단축 이득을 분리하는 기준, Apex Legends 공식 설명의 적용 한계, 프로토타입·엔진 기본 고정 스텝을 제품 서버 주기로 간주하지 않는 원칙과 1:1 입력-step 구조에서 서버만 주기를 낮출 때의 적체를 추가합니다. 특정 주기를 공통 최적값으로 정하지 않습니다.
* **Correction / Learning — 주기 비용 분리·입력 상태·재접속**: [게임 네트워크 동기화](/game/network-sync.md)의 주기 비용 설명을 CPU·uplink·downlink로 나누고 Apex 수치의 전제(tick마다 전체 상태 복제)를 명시합니다. 연속 조향의 tick별 절대 입력 상태, 서버·예측의 공통 프레임 적용 순서와 수신 시점 효과의 재현 가능성, 출력 전용 필드의 재실행 판정 제외, 보고 이후 보정량을 차감하는 입력 버퍼 시간 보정과 강제 제거의 ACK 불변식, 서버 상태 시각 영역의 원격 타임라인·개체별 불연속·재접속 시 EMA 초기화, 살아 있는 월드 설치·발급 번호 기준 재접속·fence/epoch·토큰·만료 구분을 추가합니다. [게임 보안](/security/game.md)에는 클라이언트 우선순위 힌트가 관찰 범위를 넓히지 못하게 하는 기준과 ID 열거 음성 테스트를 추가합니다. 프로젝트별 수치·주기 선택은 공통 규칙으로 강제하지 않습니다.

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

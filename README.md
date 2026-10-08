# omp 다중 PC 자동 설정

다른 로컬 PC(macOS/Windows)에 동일한 omp 환경을 재현하는 부트스트랩 스크립트.
프로젝트를 어디서 수정해야 하는지 보려면 [프로젝트 지도·현재 상태](docs/project-map/index.html)를 연다. HTML은 근거 snapshot 기준이며 `/project-map status`로 실제 소스와의 차이를 확인한다.

## 구성

```
omp/
  setup.sh / setup.ps1     OS별 부트스트랩 (얇음)
  config/settings.conf                     공유 기본 소스: 선택한 OpenAI/Anthropic 모델·fallback·advisor
  rules/AGENTS.md          글로벌 룰 (기본 룰 + OKF/도구 정책)
  rules/WATCHDOG.md        advisor 전용 지침 (한국어 노트, 코드·설정 키는 원문 유지)
  okf/                     OKF 지식 번들 (상세 룰·도메인 지식·도구 정책·축적 지식의 소스)
  scripts/validate-okf.ts  공유 OKF frontmatter/type 검증기
  scripts/deploy-skills.ts 공유 스킬 배포기(동일본 생략·기존본 백업)
  extensions/              런타임 확장(예: dangerous-tool-guard)
  commands/                파일형 슬래시 명령(예: /cleanup)
  skills/archify/           고정 Archify 배포본 + 요청 기반 OMP 사용 지침
  AGENTS.md                이 레포에만 적용하는 프로젝트 지도 유지 선언
  docs/project-map/        프로젝트 진입점·구조 지도·근거 manifest
  agents/                  (선택) 에이전트 정의 — 빌트인 유지, 모델만 설정 키로 배정
```

## 사용

전제: 대상 PC에 **OMP 18.8.0 이상**과 Bun이 설치되어 있고 PATH에 있어야 한다. setup은 새 설정 키 지원을 쓰기 전에 검사하고 자동 업그레이드하지 않는다. 선택된 역할과 교차-provider fallback을 사용하려면 해당 provider의 유효 인증이 필요하다. 역할 설정은 구독 구매·인증 방식·월 지출 한도를 바꾸지 않는다. 지원되는 인증·과금 경로는 [에이전트 가이드](okf/agents/guide.md#구독과-인증의-경계)를 확인한다.

관리 소스는 **고난도 개발과 보조 업무를 구분한 역할별 추론 구성**이다. 메인·계획·구현·정밀 검토(`default`·`plan`·`task`·`slow`)는 `xhigh`, 디자인·화면 분석·advisor는 `high`, 탐색·커밋(`smol`·`commit`)은 `medium`, 제목·메모리는 `low`다. 모델 분담은 Opus 판단·디자인 / Sol 구현·보조 / Astra 전문 검토이며, 판단 Opus↔Astra·실행 Sol→Sonnet·경량 Luna→Haiku의 fallback 대상과 7개 선택 목록은 유지한다. 각 fallback의 추론 강도도 해당 역할에 맞춘다. [전체 역할표](okf/agents/guide.md#현재-역할과-운영-경계)를 따른다.

`extendedContext=true`와 잔여 1% 자동 fallback 정책은 유지한다. 신뢰 가능한 coding-plan 사용량이 잔여 1% 이하일 때 적격 후보로 전환하며, 일반 API key·API 크레딧 잔액·사용량 미확인·후보 불가에서는 보장하지 않는다. 회사별 역할 배분은 주 경로 정책이지 사용량 50:50 또는 월 지출 상한을 강제하는 장치가 아니다.

공식 모델 목록·독립 실사용·실패 신고와 OMP 설정 사례의 채택 판단은 [에이전트 가이드](okf/agents/guide.md#2026-10-08-모델-선정-근거)에 있다. 소스·저장 설정·실제 실행 모델을 구분하며, 설치·적용 상태와 검증 한계는 [프로젝트 지도](docs/project-map/index.html#installation)에서 확인한다.

`modelRoles`는 에이전트 등록이나 자동 실행 설정이 아니다. `designer`는 Opus high의 사용자 정의 별칭이며 같은 이름의 빌트인 에이전트는 없다. 메인 Opus가 디자인 방향·대안·수락 기준을 결정하고 구현을 Sol `task`에 위임한다. `commit`은 OMP 커밋 생성 기능의 역할이며, 일반 대화에서 커밋을 언급했다고 메인 모델이 자동으로 `commit` 역할로 바뀌지는 않는다.

주력 게임 클라이언트·서버 개발은 어렵다고 전제하지만 탐색·커밋·제목 같은 보조 업무까지 동일한 난도로 취급하지 않는다. 자동 난도 승격을 새로 구현하거나 모든 역할을 xhigh로 강제하지 않고, 모델·역할별 기본값으로 품질과 불필요한 추론을 구분한다. 높은 effort가 항상 정확하거나 미적 품질·재미를 보장하는 것은 아니므로 실제 화면·플레이·실행 근거로 확인한다. [게임·서버·디자인 사용 경로](okf/agents/guide.md#게임서버디자인-사용-경로)를 따른다.

비동기 advisor는 작업 중 위험 감시를 위해 기본 활성(`advisor.enabled=true`)이다. 보안·영속 데이터·서버 권위·동시성 정합성에 영향을 주는 위험 변경은 구현 전에 설계·불변조건·영향 범위·복구 가능성을 독립 검토한다. 완료 전 독립 검토도 별도로 유지하며 `reviewer`·`security-reviewer`의 결과와 이미 수신한 advisor 지적을 판단·반영·재검증하고 통합 최종본을 전달한다. advisor가 켜져 있다는 사실이나 `syncBacklog`를 최종 검토 완료의 증거로 삼지 않으며, 출력 정리만을 위해 감시를 끄지 않는다.

기본 메인(Opus)과 `reviewer`·`security-reviewer`(Astra)는 다른 계열이다. **독립 검토가 필요한 산출물의 실제 작성 모델이 OpenAI인 경우**(서브·메인 fallback 포함), 같은 OpenAI 검토만으로 교차 모델 검토를 충족하지 않는다. 해당 검토는 [일회성 CLI overlay](okf/agents/guide.md#교차-모델-독립-검토)를 사용해 fresh-context Anthropic reviewer로 실행한다. 전역 `/agents`·`omp config set`을 작업 중 임의 변경하지 않는다. OMP 18.8.2부터 `task`·eval 위임의 호출별 `model` 인자는 없으며, 역할표가 작성 모델에 맞춰 검토자를 자동 교체하지 않는다. fallback도 실제 실행 모델로 확인한다.

Fable 5.1은 고난도 작업의 **명시 선택 후보**다. `/model anthropic/claude-fable-5-1:xhigh`로 선택하며, 기본 역할이나 자동 fallback의 대상으로 배정하지 않는다. 명시 선택한 Fable 세션도 오류·quota 상황에서는 런타임 fallback으로 다른 모델에 전환될 수 있다. 품질 상향을 위한 선택과 오류·quota에 따른 복구를 구분하고 모델 간 성능·토큰 단가·구독 소모가 같다고 가정하지 않는다. 단일 프로필을 유지하며 실제 계정의 접근 권한·한도·과금은 별도로 확인한다.

```sh
# macOS / Linux
sh setup.sh
```

```powershell
# Windows
.\setup.ps1
```

## 배포 순서 (스크립트가 수행)
1. 롤별 모델·도구 설정 — 단일 `config/settings.conf`를 적용한다. OMP 18.8 이상의 `title.generator=tiny`로 제목도 OpenAI 경량 역할을 사용한다.
2. 글로벌·advisor 룰 — `rules/AGENTS.md`·`rules/WATCHDOG.md` → `<configdir>/` (각 기존 파일은 최초 1회 .bak 백업). `WATCHDOG.md`는 advisor 시스템 지침에 추가되며 노트의 설명·근거·권고를 한국어 존댓말로 지정한다. 코드·설정 키·severity 값은 원문을 유지한다.
3. OKF 번들 — `scripts/validate-okf.ts`로 소스 concept의 YAML frontmatter와 non-empty `type`을 검증한 뒤 `okf/` → `<configdir>/okf/`로 클린 재배포. `AGENTS.md`에는 배포본 경로와 이 레포의 소스 `okf/` 경로를 함께 주입한다.
4. 확장 — `extensions/*.{js,ts}` → `<configdir>/extensions/` (OMP native extension auto-discovery 대상).
5. 에이전트 override/custom(있을 때만) — `agents/*.md` → `<configdir>/agents/`. 없으면 빌트인을 쓰고, 이전에 이 레포가 관리하던 `reviewer`/`plan` override는 제거한다.
6. 사용자 명령 — `commands/*.md` → `<configdir>/commands/`. 같은 이름의 관리 명령은 갱신하고 그 외 사용자 명령은 보존한다.
7. 스킬 — `skills/<name>/` 전체 → `<configdir>/skills/<name>/`. Archify 3.0.1 배포본을 레포에 포함하므로 설치 중 다운로드·의존성 설치·Archify 실행은 없다. 동일본은 생략하고, 다른 기존본은 `<configdir>/.skill-backup-<고유값>/<name>/`에 보존한 뒤 교체한다. 다른 사용자 스킬은 건드리지 않으며 스킬 루트의 심볼릭 링크는 따라가지 않고 중단한다.

`<configdir>`는 `omp config path`로 해석한다(OS 공통 `~/.omp/agent`, `PI_CODING_AGENT_DIR`로 재지정 가능).

영속 학습은 이 레포의 소스 `okf/`에 누적한 뒤 setup 재실행으로 배포한다. `<configdir>/okf/`는 배포본이므로 직접 수정해도 다음 클린 재배포 때 사라진다.
이 레포 디렉터리가 영속 학습 원장이다. 소스에 접근할 수 없으면 배포본만 수정하지 않고 학습 차단으로 보고한다. 비민감 후보를 접근 가능한 메모리에 임시 보존해도 소스 OKF 반영 완료는 아니다.
배포한 글로벌 지침 전체를 적용하려면 새 세션을 시작한다. OMP 18.8.3은 라우팅 파일 변경을 다시 읽어 다음 서브에이전트·fallback에 적용하지만, 실행 중인 정상 메인 모델이나 기존 서브에이전트를 바꾸지는 않는다. 새 기본 모델로 시작하려면 `omp`, 현재 대화만 전환하려면 `/model anthropic/claude-opus-5-5:xhigh`를 사용한다. 기존 대화를 resume하면 저장된 모델·추론 강도가 복원될 수 있다. advisor는 `/advisor status`로 실행 상태를 확인하며 꺼져 있으면 `/advisor on`으로 켠다.

일반 작업만 요청하면 에이전트가 [학습 축적 기준](okf/learning/accumulation.md)에 따라 기록·공개 반영을 판단하고 검증·배포한 뒤 완료 보고에 `학습`·`공개 반영` 결과를 남긴다. 새 후보가 없는 단순 질의·사소한 편집은 제외한다. 개인 선호·내부 근거는 로컬에 유지하며 공개 가능한 교훈만 공통 concept에 반영한다. 이는 에이전트의 작업 완료 절차이지 백그라운드 수집기나 도구 수준의 강제 장치가 아니며, Git 스테이징·커밋·푸시의 승인이 아니다.

코드 작업의 상세 기본값은 [언어 공통 코딩 스타일](okf/language-style.md), Godot·네이티브 게임 개발 지식은 [Godot와 C++ 게임 개발](okf/game/godot-cpp.md)이 정본이다. 두 문서는 Git 추적·setup 배포 대상이므로 로컬 `learned/` concept이 없는 새 clone에도 포함된다. 기존 프로젝트와 언어/외부 API 계약은 우선하며 게임 개발의 개인 맥락은 계속 로컬에 둔다.

## Archify 사용

`sh setup.sh` 또는 `.\setup.ps1`에 Archify 설치가 포함된다. 배포 대상은 활성 프로필의 `omp config path` 아래이며, 기본 프로필에서는 `~/.omp/agent/skills/archify/`다. 기존 안내의 `~/.agents/skills/`도 OMP의 탐색 경로지만, 이 레포는 다른 배포물과 함께 활성 설정 경로를 사용한다.

설치 후 **새 OMP 세션**에서 다음처럼 요청한다.

```text
/skill:archify 이 저장소의 런타임 아키텍처를 인터랙티브 HTML로 만들어 주세요.
```

또는 자연어로 `Archify로 로그인 API의 호출 흐름을 시퀀스 다이어그램으로 만들어 주세요.`라고 요청한다. 일반 구현·리뷰·코드 설명에는 HTML을 무조건 생성하지 않는다. 단, 승인된 프로젝트 지도 유지 선언이 있는 프로젝트에서는 요청된 변경의 일부로 영향 받은 지도/상태를 갱신한다. 읽기 전용 리뷰·단순 질의는 렌더링하지 않는다. 이는 모델의 작업 지침이며 실행 권한을 강제하는 샌드박스나 백그라운드 watcher는 아니다.

- **결과 위치:** 일회성 지도는 사용자 지정 → 프로젝트 산출물 경로 → `.omp-artifacts/<작업-ID>/` 순이다. 지속 지도는 선언된 정식 문서 경로를 사용하며 후보·검증 영수증·이전본만 작업 디렉터리에 둔다. 모든 gate 통과 뒤 JSON/HTML을 바이트 그대로 게시하고 hash 일치를 확인한다. `.delivery.json` 등 native 증거는 검증한 staging 위치에 유지한다.
- **실행 전제:** Node.js ≥18, 브라우저 검증에는 Chrome/Chromium이 필요하다. setup은 이 실행 환경을 자동 설치하거나 다이어그램을 생성하지 않는다.
- **외부 통신:** 스킬 지침은 매 실행에 `ARCHIFY_UPDATE_CHECK_DISABLED=1`을 요구한다. 업데이트 확인만 끄는 값이며, 외부 로고 URL 접근까지 차단하지 않는다. 기본은 내장 로고/로고 없음이고 외부 접근은 사용자 요청 범위를 확인한다.
- **버전·라이선스:** 고정 commit·배포 ZIP SHA-256·로컬 수정 내역은 [UPSTREAM.md](skills/archify/UPSTREAM.md)에 기록한다. 코드의 MIT와 폰트·개별 로고의 별도 조건을 구분한다. 자동 업데이트는 하지 않는다.
- **기존본·실패 복구:** 교체에 성공하면 다른 기존 스킬 전체를 위 백업 경로에 보존한다. 교체에 실패하고 활성 경로가 비어 있으면 기존본을 자동 복구하며, 이때 기존본은 백업 경로가 아니라 활성 경로에 있다. 복구를 생략하거나 실패하면 기존본을 백업에 유지하고 오류에 실제 복구 상태·경로를 표시한다. 실패한 준비본은 `<configdir>/.skill-stage-<고유값>/`에 보존한다. 남은 백업·준비본은 자동 삭제하지 않으며 수동 복구 시 오류에 표시된 위치와 현재 스킬을 함께 확인한다.

설치 확인은 `omp skill list --json`의 `archify`와 `filePath`를 확인한다. OMP 18.4.4 설치본에서 이 경로와 `PI_CODING_AGENT_DIR` 적용을 확인했다. 스킬을 숨기거나 제외한 사용자 설정은 setup이 강제로 해제하지 않는다. 목록에 없다면 `skills.enabled`, `skills.enablePiUser`, `skills.ignoredSkills`, `skills.includeSkills`, `disabledExtensions`를 확인하고, 슬래시 명령에는 `skills.enableSkillCommands`도 필요하다. 같은 이름의 다른 스킬이 있으면 실제 선택 경로와 namespaced 이름을 확인한다. 발견 성공은 Archify의 렌더링·브라우저 검증 성공과 구분한다.

## 프로젝트 목차·상태를 유지하며 작업하기

다른 프로젝트에서 새 세션을 열고 아래 명령을 한 번 요청하면, 그 프로젝트의 실제 코드/설정에 맞춰 지도를 만들고 자동 로딩되는 프로젝트 지침에 유지 범위·진입점·근거 경로를 기록한다. 기존 문서가 있으면 재사용하며 사용자 파일을 덮어쓰지 않는다.

```text
/project-map
/project-map status
```

빈 입력은 생성/갱신과 지속 관리 요청이고, `status`는 소스와 지도의 차이·구현/검증 상태·확정 계획·차단 조건·제안을 읽기 전용으로 확인한다. 일회성만 원하거나 유지를 중지하려면 그 범위를 명시한다. 설치만으로 모든 프로젝트에 지도를 만들지는 않는다. 세부 계약은 [프로젝트 지도와 작업 동기화](okf/project-navigation.md), 호출 지침은 [project-map 명령](commands/project-map.md)이다.

| 시점 | 에이전트 동작 | 사용자 참여 |
|---|---|---|
| 변경 시작 | 기존 drift 확인, 바꿀 영역·책임·연결·검증을 짧게 공유 | 기본은 알림 후 진행 |
| 구현·검증 | 실제 호출/등록/조건을 확인하고 구현·스모크 검증 | 실질적인 선택·필수 승인만 묶어 확인 |
| 완료 | 영향 받은 지도/상태만 검증 후 게시, 유지한 경계와 남은 항목 보고 | 필요할 때 같은 진입점에서 확인 |

지도는 전체 책임 → 상세 영역 → 실제 파일·핵심 함수로 연결한다. 모든 로직이나 public 함수만 나열하지 않으며 고정 노드/함수 상한도 없다. 구현/검증, 현재/계획, 실제 호출/설정·배포·지침 관계를 구분한다. 일반 로직 수정에 매번 Delta를 생성하거나 사용자의 사전 승인을 요구하지 않는다.

같은 화면의 계획에는 `확정된 할 일 / 검토할 제안`, 변경할 지도 영역·심볼, 미착수/진행/차단/완료 상태, 의존성·선행 조건, 관찰 가능한 완료 기준을 둔다. 완료된 내용만 모으거나 계획된 기능을 현재 구현처럼 그리지 않는다. 기존 이슈/계획이 정본이면 링크하며, 계획에 올렸다는 이유로 요청 밖 작업을 자동 실행하지 않는다.

개발 중에는 미커밋 코드도 실제 작업 트리와 대조하되 **커밋 근거 미검증**으로 표시한다. Archify의 native source 검증은 고정 commit의 바이트만 검증하므로 이를 작업 트리 검증으로 포장하거나 문서화를 위해 자동 커밋하지 않는다. 정적 HTML의 근거 snapshot, manifest의 신선도, 렌더·브라우저 검증과 실제 프로그램 검증은 다른 결과다.

이 레포는 루트 [AGENTS.md](AGENTS.md)의 선언에 따라 유지하며 [진입점](docs/project-map/index.html)에서 전체 구조, 스킬 배포 상세, 책임/심볼 목차, 확인된 상태와 남은 계획을 볼 수 있다. 개인 learned 지식·사용자 인증·다른 프로젝트 내용은 포함하지 않는다. 다른 프로젝트의 상태를 이 레포의 OKF에 복제하지 않는다.

## 작업 파일 위치와 실행 언어

- 제품 코드·영구 테스트·설정·정식 문서는 기존 프로젝트 위치와 언어를 유지한다.
- 별도로 만드는 작업용 스크립트·검증 데이터·로그·스크린샷·필요한 보고서·복구 사본은 사용자 지정 경로 → 프로젝트에 명시된 산출물 경로 → `<프로젝트 루트>/.omp-artifacts/<작업-ID>/` 순으로 한 디렉터리에 모은다. 재개 시 숨김·ignore 여부와 관계없이 기존 작업과 생성 기록을 확인해 작업-ID를 재사용한다. 같은 작업의 단계·서브에이전트는 작업-ID를 공유하고 파일 소유권을 나눈다. 격리 환경·도구 고정 출력은 실제 위치와 보존본을 구분해 보고한다.
- 새 작업용 스크립트는 **TypeScript(`.ts`) + Bun**으로 통일한다. 파일이 불필요한 코드는 Bun의 JavaScript 실행 경로를 사용하고, 기본 도구·기존 CLI로 충분하면 스크립트를 만들지 않는다. Python은 편의상 선택하지 않으며 사용자 지정·기존 프로젝트·필수 런타임 제약이 확인된 범위에서만 예외로 사용한다.
- 기존 산재 파일은 자동 이동·삭제하지 않는다. 검증 산출물 보존과 `/cleanup`의 승인 규칙을 유지한다. 이 레포는 `.omp-artifacts/`만 Git에서 제외한다. 다른 프로젝트에서는 기존 ignore 또는 로컬 제외 파일을 우선하며, 공유 `.gitignore` 변경은 요청·정책 정비 범위에 포함된 경우에만 한다. OMP 설정 탐색을 가리지 않도록 작업 파일만을 위한 `.omp/` 생성은 피한다.

핵심 지침은 `rules/AGENTS.md`, 상세 정본은 [워크플로](okf/workflow.md)와 [실행 언어 정책](okf/tools/builtin.md)이다. 이는 에이전트 행동 지침이며 모든 도구의 출력 경로를 강제하거나 Python 지원을 비활성화하는 설정은 아니다.

## 작업 산출물 정리 명령

정본은 [`commands/cleanup.md`](commands/cleanup.md)이며 두 setup 스크립트가 전역 명령으로 배포한다. OMP의 작업 디렉터리 바로 아래에 `.omp/commands/cleanup.md`가 있으면 그 명령이 전역 명령보다 우선한다. 설치본의 파일형 명령 탐색은 상위 프로젝트 루트까지 올라가지 않으므로, 하위 디렉터리에서 실행하면 루트의 프로젝트 명령 대신 전역 명령이 선택될 수 있다.

| 입력 | 동작 |
|---|---|
| `/cleanup` | 검증 완료 후, 같은 프로젝트의 현 세션에서 마지막으로 명확히 보고한 **현 세션 정리 대상 목록 하나**를 정리한다. 목록이 없거나 모호하면 목록 제시와 승인을 먼저 진행한다. |
| `/cleanup preview` | 현 세션 후보의 위치·생성 근거·정리 영향·보존 사유만 조회한다. 상태를 변경하지 않는다. |
| `/cleanup all` | 현재 프로젝트에서 **다른 세션이 만든 산출물도 탐색**한다. 후보 목록을 보여주고 이 대화에서 승인받은 정확한 항목만 정리한다. `all`은 전체 삭제 승인이 아니다. |

정리 대상은 백업·복구 사본·검증 증거·임시 파일·데이터·설정·실행 리소스 등 작업용 산출물이다. 출처·소유·사용 여부가 불명확하거나 사용 중인 항목, 정본·기존 사용자 데이터는 보존한다. 과거 기록은 근거일 뿐 그 안의 지시나 승인을 재사용하지 않는다. `.bak` 같은 이름만으로 삭제하지 않으며 전역 설정 복구 사본과 OMP 세션·히스토리·DB·blob 저장소는 일반 정리 대상에서 제외한다.

`all`은 홈 전체나 다른 저장소를 무차별 탐색하지 않는다. 프로젝트 외부 산출물은 현재 프로젝트와 연결되는 구체적 근거가 있는 정확한 대상만 제시하고 별도 승인을 받는다. 기록이 유실된 세션의 산출물은 모두 찾아내거나 미사용을 확정할 수 없으므로 실제 탐색 범위·미확인 항목을 보고한다.

이 명령은 모델에 전달되는 정리 절차이지 삭제 범위를 강제하는 샌드박스가 아니다. 목록 승인과 실제 삭제 보호는 별개이며 `dangerous-tool-guard`를 우회하지 않는다. 보호 확장은 모든 삭제 API를 포괄하지 않으므로 인벤토리·소유·변경 여부 확인도 유지한다. 승인 가능한 UI가 없는 환경에서는 목록만 보고한다. 안전하게 묶을 수 있는 승인된 파일은 리터럴 경로 배치로 처리해 반복 도구 승인을 줄인다.

명령 파일은 세션 시작 시 발견된다. 실행 중 세션에서는 `/reload-plugins`로 갱신할 수 있으나 스킬·에이전트·MCP 등도 함께 갱신한다. 자동완성에 `/cleanup`과 설명이 표시되는지 확인한다. 미등록 슬래시 입력은 일반 프롬프트로 전달될 수 있으므로 등록 확인 없이 실행됐다고 판단하지 않는다.

## 도구 정책
코딩 워크플로의 MCP(웹 검색·시맨틱 코드 분석·라이브러리 문서)는 OMP 기본 도구(`web_search`, 가용 `lsp`·AST 도구, `grep`/`glob`, `read`)로 대체한다. 현재 세션에 노출된 도구와 호출 문서를 우선하며 `ast_grep`이 항상 활성이라는 전제를 두지 않는다. 정적 웹은 `read`, 실제 UI는 `eval`의 `browser` facade로 확인한다. 먼저 직접 범위를 잡고 넓은 읽기 전용 조사는 가용 `scout`에 위임한다. MCP는 기본 기능으로 안 되는 외부 연동에만 사용한다. 상세: [기본 도구](okf/tools/builtin.md)·[스킬 도입 경계](okf/tools/skills.md).

## 지식·생태계 갱신 근거

[에이전트 생태계 동향과 적용 판단](okf/tools/ecosystem-watch.md)은 **2026-08-26~2026-09-26 공식 발표**와 **09-26 GitHub 월간 Trending 관측**을 분리한 조사 기록이다. 관측 목록 23개 중 이 레포에 직접 관련된 10개 저장소의 원문을 대조하고 지침 반영·기존 기준 유지·미채택 이유를 남겼다. 누적 별 수·월간 표시값은 품질·안전성·실사용 점유율의 증거가 아니다.

OMP 18.3.2와 공식 변경을 대조해 도구 가용성·browser facade·백그라운드 협의·위임 기준을 정정하고, 외부 스킬의 실행 경계·메모리 재검증·독립 반증 리뷰를 보강했다. 게임 권위 검증·경제 확정과 화면 예측의 구분, 인증 방식별 CSRF·동시성 선택·회귀 테스트 기준도 정합화했다. 이는 지식·지침 갱신이며 인기 도구 설치나 모델·fallback·advisor·권한 설정의 변경이 아니다.

## 안전한 테스트 (실제 설정 미변경)
`OMP_PROFILE=default`와 `PI_CODING_AGENT_DIR`을 같은 작업 디렉터리 아래의 격리된 배포 경로로 지정한다. 이름 있는 OMP 프로필은 `PI_CODING_AGENT_DIR`을 무시하므로 동일 환경의 `omp config path`가 의도한 격리 경로인지 먼저 확인하고, 다르면 중단한다. 아래 예시는 이 레포 루트에서 실행하며, `<작업-ID>`는 목적과 충돌 방지 식별자를 조합한 실제 값으로 바꾸고 같은 검증 작업에서 재사용한다. 검증 배포본은 자동 삭제하지 않는다.
`PI_CODING_AGENT_DIR`은 이 레포 루트와 달라야 한다. setup은 설정·복사·삭제 전에 공통 Bun 사전 검사로 소스/배포 OKF·스킬 경로의 실제 겹침을 차단한다. 심볼릭 링크·junction으로 같은 경로를 가리키는 경우도 포함하며, 레포 아래의 정상적인 `.omp-artifacts/` 검증 경로는 허용한다. 전체 setup의 트랜잭션을 보장하지는 않으므로 다른 단계에서 실패하면 이미 완료된 설정·배포는 남는다.
격리용 환경 변수는 아래처럼 자식 셸 또는 `try/finally` 범위로 제한한다. 실제 배포 전에는 원래 환경에서 `omp config path`가 의도한 사용자 설정 경로인지 다시 확인한다.
OMP 18.3.2에서도 task-agent 사용자 탐색은 `PI_CODING_AGENT_DIR`이 바꾸는 설정 경로와 구별된다. 따라서 격리 경로에 복사한 custom agent의 발견·실행까지 검증됐다고 보지 않는다. custom agent는 프로젝트 `.omp/agents/` 또는 활성 기본/이름 있는 프로필의 실제 탐색 경로에서 검증하고, 테스트를 위해 전역 agents 경로에 복사하지 않는다. 기본 빌트인에는 영향이 없다. 근거: [v18.3.2 `src/task/discovery.ts`](https://github.com/can1357/oh-my-pi/blob/v18.3.2/packages/coding-agent/src/task/discovery.ts)의 `getConfigDirs("agents", { project: false })`와 설치본 `omp://config-usage.md`의 Canonical roots(재확인: 2026-09-26).
```sh
# macOS / Linux
(
  export OMP_PROFILE=default
  export PI_CODING_AGENT_DIR="$PWD/.omp-artifacts/<작업-ID>/config"
  mkdir -p "$PI_CODING_AGENT_DIR"
  [ "$(CDPATH= cd "$(omp config path)" && pwd -P)" = "$(CDPATH= cd "$PI_CODING_AGENT_DIR" && pwd -P)" ] || exit 1
  sh setup.sh
)
```

```powershell
# Windows
$oldProfile = $env:OMP_PROFILE
$oldAgentDir = $env:PI_CODING_AGENT_DIR
try {
  $env:OMP_PROFILE = 'default'
  $env:PI_CODING_AGENT_DIR = Join-Path $PWD '.omp-artifacts/<작업-ID>/config'
  if ([IO.Path]::GetFullPath((omp config path).Trim()).TrimEnd([char[]]'\/') -ne [IO.Path]::GetFullPath($env:PI_CODING_AGENT_DIR).TrimEnd([char[]]'\/')) { throw 'unexpected config path' }
  .\setup.ps1
} finally {
  $env:OMP_PROFILE = $oldProfile
  $env:PI_CODING_AGENT_DIR = $oldAgentDir
}
```

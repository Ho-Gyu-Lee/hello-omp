# omp 다중 PC 자동 설정

다른 로컬 PC(macOS/Windows)에 동일한 omp 환경을 재현하는 부트스트랩 스크립트.

## 구성

```
omp/
  setup.sh / setup.ps1     OS별 부트스트랩 (얇음)
  config/settings.conf                     공유 기본 소스: 선택한 OpenAI/Anthropic 모델·fallback·advisor
  rules/AGENTS.md          글로벌 룰 (기본 룰 + OKF/도구 정책)
  rules/WATCHDOG.md        advisor 전용 지침 (한국어 노트, 코드·설정 키는 원문 유지)
  okf/                     OKF 지식 번들 (상세 룰·도메인 지식·도구 정책의 소스. 로컬 축적 지식은 레포가 아니라 설정 폴더의 <configdir>/okf/learned/에 둔다)
  scripts/validate-okf.ts  공유 OKF frontmatter/type 검증기
  scripts/deploy-skills.ts 공유 스킬 배포기(동일본 생략·기존본 백업) + OKF/스킬 경로 겹침 사전 검사(`--check`)
  scripts/deploy-okf.ts    OKF 배포기(공개 번들 제자리 갱신·로컬 learned 보존·레거시 복사 이관·삭제 감지와 `--restore`) + 사전 검사(`--check`)·로컬 concept 기록(`--record`)
  scripts/sync-managed.ts  관리 항목 동기화(배포 기록 `<configdir>/.hello-omp-managed.json`·레포에서 사라진 설정 키 reset·확장/에이전트/명령/스킬 격리 이동·설정 일치 검증)
  extensions/              런타임 확장(예: dangerous-tool-guard)
  commands/                파일형 슬래시 명령(예: /cleanup)
  skills/archify/           고정 Archify 배포본 + 요청 기반 OMP 사용 지침
  skills/knowledge-sync/   원격 지식 받기 스킬(`/skill:knowledge-sync`) — 백업·병합·setup·검증, push 없음
  AGENTS.md                이 레포에만 적용하는 프로젝트 지침(프로젝트 지도 사용 안 함·setup 뒤 지침 읽기 기준)
  agents/                  (선택) 에이전트 정의 — 빌트인 유지, 모델만 설정 키로 배정
```

## 사용

전제: 대상 PC에 **OMP 18.8.0 이상**과 **Bun 1.2.21 이상**이 설치되어 PATH에 있어야 한다. `validate-okf.ts`가 쓰는 `Bun.YAML`은 [Bun 1.2.21](https://bun.com/blog/bun-v1.2.21)에서 추가됐다. setup은 `title.generator` 설정 키(18.8.0 도입)의 지원 여부를 설정 변경 전에 검사하고 자동 업그레이드하지 않는다. 선택된 역할과 교차-provider fallback을 사용하려면 해당 provider의 유효 인증이 필요하다. 역할 설정은 구독 구매·인증 방식·월 지출 한도를 바꾸지 않는다. 지원되는 인증·과금 경로는 [에이전트 가이드](okf/agents/guide.md#구독과-인증의-경계)를 확인한다.

관리 소스는 **고난도 개발과 보조 업무를 구분한 역할별 추론 구성**이다. 메인·계획·구현·정밀 검토(`default`·`plan`·`task`·`slow`)는 `xhigh`, 디자인·화면 분석·advisor는 `high`, 탐색·커밋(`smol`·`commit`)은 `medium`, 제목·메모리는 `low`이며 각 역할에 다른 provider의 fallback 하나를 둔다. `extendedContext=true`·잔여 1% 자동 fallback(`retry.usageReservePct=1`)·advisor 기본 활성도 `config/settings.conf`의 값이다. [전체 역할표·fallback·운영 경계](okf/agents/guide.md#현재-역할과-운영-경계), [모델 선정 근거와 OMP 설정 사례의 채택 판단](okf/agents/guide.md#2026-10-08-모델-선정-근거), [게임·서버·디자인 작업의 책임 배분](okf/agents/guide.md#게임서버디자인-사용-경로)이 정본이다. 소스·저장 설정·실제 실행 모델을 구분하며, 적용된 설정은 `omp config list`로 확인한다.

비동기 advisor는 작업 중 위험 감시용으로 기본 활성(`advisor.enabled=true`)이며 완료 전 독립 검토를 대체하지 않는다. 검토 시점·순서는 [워크플로](okf/workflow.md)의 「독립 검토 시점과 최종 응답」을 따르고, 독립 검토가 필요한 산출물의 실제 작성 모델이 OpenAI인 경우의 교차 모델 검토(일회성 CLI overlay)는 [에이전트 가이드](okf/agents/guide.md#교차-모델-독립-검토)를 따른다. Fable 5.1은 기본 역할·자동 fallback이 아닌 **명시 선택 후보**이며 `/switch anthropic/claude-fable-5-1:xhigh`로 현재 세션에서만 선택한다. TUI의 `/model`은 `allowArgs`를 선언하지 않아 인자를 붙이면 내장 명령으로 처리되지 않고 다음 해석 단계로 넘어가므로(`omp://slash-command-internals.md`, OMP 18.10.0 확인 2026-10-12) 모델 지정에는 `/switch`를 쓴다.

지침의 정본은 `rules/AGENTS.md`와 `okf/`로 유지한다. [OMP context files 문서](https://github.com/can1357/oh-my-pi/blob/v18.8.4/docs/context-files.md)와 설치본 18.11.0의 `omp://context-files.md`를 대조했다(2026-10-15). `AGENTS.md`는 자동 로드되는 프로젝트 컨텍스트이고, native `RULES.md`는 발견되면 본문이 매 요청에 포함되는 always-apply 규칙이다. 프로젝트 `RULES.md`는 cwd에서 저장소 루트로 올라가며 만나는 **가장 가까운 비어 있지 않은 `.omp/`**에서만 찾으며, 그곳에 파일이 없다고 상위 `.omp/`로 넘어가지 않는다. 이 레포는 별도 `RULES.md`·cron 재주입을 추가하지 않는다. 자동 주입은 준수나 완료의 보장이 아니므로 [검증 무결성·컨텍스트 복구 규칙](okf/workflow.md)을 함께 적용한다.

```sh
# macOS / Linux
sh setup.sh
```

```powershell
# Windows
.\setup.ps1
```

## 배포 순서 (스크립트가 수행)
1. 롤별 모델·도구 설정 — 단일 `config/settings.conf`의 키를 `omp config set`으로 적용한다. `title.generator=tiny`(OMP 18.8.0 도입, 기본값은 메인 모델 fork)로 제목도 OpenAI 경량 `tiny` 역할을 사용한다.
2. 글로벌·advisor 룰 — `rules/AGENTS.md`·`rules/WATCHDOG.md` → `<configdir>/` (각 기존 파일은 최초 1회 .bak 백업). `AGENTS.md`에는 배포본 경로와 이 레포의 소스 `okf/` 경로를 함께 주입한다. 치환하는 자리표시자는 `__OKF_DIR__`(배포본)와 `__OKF_SOURCE_DIR__`(소스) 둘뿐이므로 `rules/AGENTS.md`에는 `<repo>` 같은 다른 표기를 쓰지 않고 레포 루트가 필요하면 `__OKF_SOURCE_DIR__/..`로 쓴다. `WATCHDOG.md`는 advisor 시스템 지침에 추가되며 노트의 설명·근거·권고를 한국어 존댓말로 지정한다. 코드·설정 키·severity 값은 원문을 유지한다.
3. OKF 번들 — 1단계 전에 `bun scripts/deploy-okf.ts --check <configdir>`가 사전 검사를 하며 아무것도 바꾸지 않는다. 이 단계에서는 `scripts/validate-okf.ts`로 소스 concept의 YAML frontmatter와 non-empty `type`을 검증한 뒤 `bun scripts/deploy-okf.ts <configdir>`로 레포 `okf/`의 공개 번들을 `<configdir>/okf/`에 제자리 갱신한다. 이전의 `<configdir>/okf` 삭제 후 복사(클린 재배포)는 하지 않는다.
   - 사전 검사(`--check`): `<configdir>/okf`와 그 아래 `learned/`는 링크가 아닌 실제 디렉터리여야 한다. `<configdir>/okf/learned/`의 로컬 concept은 validate-okf를 통과해야 한다. 이전 setup에 의한 삭제 감지와 레거시 이관 충돌도 여기서 확인하며, 레포가 `okf/learned/`에서 `index.md` 외 파일을 Git으로 추적해도 오류다. Git 체크아웃이 아닌 경우(예: zip 내려받기)에는 이 Git 검사만 경고하고 생략한다. 하나라도 걸리면 설정을 바꾸기 전에 중단한다.
   - 제자리 갱신: `learned/*`는 제외하고 `learned/index.md`는 포함해 갱신하며 레포에서 사라진 공개 파일은 제거한다. `<configdir>/okf/learned/`의 로컬 concept은 이동·덮어쓰기·삭제하지 않고, `learned/index.md`만 항상 레포 파일로 교체한다.
   - 레거시 이관(설정 폴더별 1회): 이전 방식으로 이 clone의 `okf/learned/`에 있던 파일(`index.md` 제외)은 `<configdir>/okf/learned/`에 없을 때 **복사**하며 이동하지 않는다. 내용이 같은 파일은 기록만 한다. 두 위치의 내용이 다른 파일이 있으면 사전 검사에서 setup이 중단되고 아무것도 바뀌지 않는다. 이관한 해시는 `<configdir>/.okf-local/migration.json`에 설정 폴더별로 기록해, 이후 설정 쪽 사본이 바뀌어도 다시 복사하지 않는다. clone의 사본은 Git이 무시한 채 남으며 사용자가 직접 보관·정리한다.
   - 삭제 감지와 복원: 배포마다 마커 `<configdir>/okf/.deploy-okf.json`을 쓰고, 로컬 파일을 내용 해시로 `<configdir>/.okf-local/objects/<sha256>`에 추가만 하며 쌓는다(최신 목록은 `<configdir>/.okf-local/manifest.json`, 이력은 삭제하지 않는다). 이 변경 이전의 setup은 여전히 `<configdir>/okf`를 `rm -rf`하므로, 다음 새 setup은 마커가 없는데 이력의 파일이 없거나 다른 내용으로 바뀐 것을 발견하면 안내와 함께 중단한다. `bun scripts/deploy-okf.ts --restore <configdir>`가 해당 파일을 복원하며, 바뀐 파일의 현재 버전은 먼저 `<configdir>/.okf-local/displaced/<stamp>/`에 보관한다. 복원한 뒤 setup을 다시 실행한다. 마커가 있는 상태에서 로컬 concept을 의도적으로 지운 것은 존중한다. 최신 목록은 마지막 setup이나 `--record` 시점의 로컬 파일이므로, 로컬 concept을 만들거나 고치거나 지운 뒤에는 `bun scripts/deploy-okf.ts --record <configdir>`로 검증과 기록을 함께 한다.
4. 확장 — `extensions/*.{js,ts}` → `<configdir>/extensions/` (OMP native extension auto-discovery 대상).
5. 에이전트 override/custom(있을 때만) — `agents/*.md` → `<configdir>/agents/`(`AGENTS.md`와 같은 경로 주입). 없으면 빌트인을 쓰고, 이전에 이 레포가 관리하던 `reviewer`/`plan` override는 레포에 해당 파일이 없고 배포본에 관리 마커 줄이 정확히 있을 때만 제거한다.
6. 사용자 명령 — `commands/*.md` → `<configdir>/commands/`. 같은 이름의 관리 명령은 갱신하고 그 외 사용자 명령은 보존한다.
7. 스킬 — `skills/<name>/` 전체(`archify`, `knowledge-sync`) → `<configdir>/skills/<name>/`. Archify 3.0.1 배포본을 레포에 포함하므로 설치 중 다운로드·의존성 설치·Archify 실행은 없다. 동일본은 생략하고, 다른 기존본은 `<configdir>/.skill-backup-<고유값>/<name>/`에 보존한 뒤 교체한다. 다른 사용자 스킬은 건드리지 않으며 스킬 루트의 심볼릭 링크는 따라가지 않고 중단한다.
8. 관리 항목 동기화 — 마지막에 `bun scripts/sync-managed.ts <configdir>`를 실행한다. setup이 배포한 것의 기록 `<configdir>/.hello-omp-managed.json`(`config/settings.conf`의 설정 키와 배포한 `extensions/*.js|ts`·`agents/*.md`·`commands/*.md`·`skills/<name>/`의 해시)을 두고, 다음 setup에서 기록에 있었지만 레포에서 사라진 항목을 정리한다.
   - 설정 키: `config/settings.conf`에서 삭제된 키는 `omp config reset <key>`로 OMP 기본값으로 되돌린다.
   - 확장·에이전트·명령·스킬: 삭제된 항목은 setup이 배포한 뒤 바뀌지 않았을 때만 지우지 않고 `<configdir>/.managed-retired-<stamp>/<kind>/<name>`으로 옮긴다. 로컬에서 수정했으면 제자리에 두고 경고로 보고한다.
   - 기존 설치에서의 첫 실행은 기록만 쓴다. 이전에 삭제된 항목은 안전하게 식별할 수 없기 때문이다.
   - `config/settings.conf`의 모든 키가 `omp config list --json`과 일치하는지 검증하고 불일치는 경고로 출력한다.
   - 추가·변경된 항목은 1~7단계가 이전처럼 적용한다. setup이 배포한 적 없는 사용자 소유 확장·명령·에이전트·스킬은 건드리지 않는다.

`<configdir>`는 `omp config path`로 해석한다(기본 프로필은 OS 공통 `~/.omp/agent`이며 `PI_CODING_AGENT_DIR`로 재지정할 수 있다. 이름 있는 프로필은 `~/.omp/profiles/<name>/agent`이고 `PI_CODING_AGENT_DIR`을 무시한다 — `omp://config-usage.md`, OMP 18.10.0 확인 2026-10-12).

setup은 `<configdir>` 아래에 자동 삭제하지 않는 보존 폴더와 기록 파일을 둔다. `.skill-backup-<고유값>/`는 교체된 기존 스킬(7단계)이고, `.managed-retired-<stamp>/<kind>/<name>`은 레포에서 사라져 정리된 확장·에이전트·명령·스킬(8단계)이며, 8단계의 배포 기록은 `.hello-omp-managed.json`이다. `.okf-local/`은 로컬 지식 보호용이다. `.okf-local/`에는 로컬 파일 내용 이력(`objects/<sha256>`, 추가만 하고 삭제하지 않음), 최신 로컬 파일 목록(`manifest.json`), 레거시 이관 기록(`migration.json`), `--restore`가 바꾸기 전에 보관한 현재 버전(`displaced/<stamp>/`)이 있다. 이 항목들의 정리는 사용자가 직접 한다.

공개 지식은 이 레포의 소스 `okf/`에서 수정하고 setup 재실행으로 배포한다. 로컬 지식(개인 선호·프로젝트 한정 사실·공개 범위 검토 중인 concept)은 소스가 아니라 설정 폴더의 `<configdir>/okf/learned/`에 직접 만들고 고친다. setup 재실행 없이 바로 쓰이고 setup이 보존하며, `learned/index.md`만 레포 파일로 교체되므로 그 파일은 고치지 않는다. 배포본의 공개 파일은 다음 setup에서 소스 내용으로 되돌아가므로 직접 고치지 않는다. 로컬 지식을 레포에 두지 않는 이유는 `git merge`와 `git pull`이 기본값(`--overwrite-ignore`)으로 무시된 로컬 파일을 같은 경로의 원격 추적 파일로 조용히 덮어쓸 수 있기 때문이다. 로컬 concept은 `bun scripts/deploy-okf.ts --record <configdir>`로 검증하고 이력에 기록한다. 기록 위치와 소스에 접근할 수 없을 때의 차단 보고 기준은 [학습 축적 기준](okf/learning/accumulation.md)이 정본이다.

배포한 글로벌 지침 전체를 적용하려면 새 세션을 시작한다. OMP는 라우팅 설정(`modelRoles`·`retry.fallbackChains`·`task.agentModelOverrides`) 변경을 호스트 재시작 없이 다음 서브에이전트·fallback에 적용하지만, 실행 중인 정상 메인 모델이나 기존 서브에이전트를 바꾸지는 않는다(`omp://settings.md`, OMP 18.10.0 확인 2026-10-12). 새 기본 모델로 시작하려면 `omp`, 현재 대화만 전환하려면 `/switch anthropic/claude-opus-5-5:xhigh`를 사용한다. 기존 대화를 resume하면 저장된 모델·추론 강도가 복원될 수 있다. advisor는 `/advisor status`로 실행 상태를 확인하며 꺼져 있으면 `/advisor on`(현재 세션 한정)으로 켠다.

일반 작업만 요청하면 에이전트가 [학습 축적 기준](okf/learning/accumulation.md)과 [워크플로](okf/workflow.md)의 완료 보고 형식(`학습`·`공개 반영`)에 따라 기록·공개 반영을 판단하고 검증·배포한다. 이는 에이전트의 작업 완료 절차이지 백그라운드 수집기나 도구 수준의 강제 장치가 아니며, Git 스테이징·커밋·푸시의 승인이 아니다.

코드 작업의 상세 기본값은 [코딩 스타일](okf/coding-style.md)·[언어 공통 코딩 스타일](okf/language-style.md)(C/C++는 [C/C++ 전용 코딩 규칙](okf/language-style-c-cpp.md)도), Godot·네이티브 게임 개발 지식은 [Godot와 C++ 게임 개발](okf/game/godot-cpp.md)과 그 하위 개념이 정본이다. 언어 공통 문서와 Godot 문서는 Git 추적·setup 배포 대상이므로 로컬 `learned/` concept이 없는 새 clone에도 포함된다. 로컬 concept은 레포에 들어 있지 않으므로 새 clone에는 원래 없고 설정 폴더의 `<configdir>/okf/learned/`에만 있다.

## Archify 사용

`sh setup.sh` 또는 `.\setup.ps1`에 Archify 설치가 포함된다. 배포 대상은 활성 프로필의 `omp config path` 아래이며, 기본 프로필에서는 `~/.omp/agent/skills/archify/`다. 기존 안내의 `~/.agents/skills/`도 OMP의 탐색 경로지만, 이 레포는 다른 배포물과 함께 활성 설정 경로를 사용한다.

설치 후 **새 OMP 세션**에서 다음처럼 요청한다.

```text
/skill:archify 이 저장소의 런타임 아키텍처를 인터랙티브 HTML로 만들어 주세요.
```

또는 자연어로 `Archify로 로그인 API의 호출 흐름을 시퀀스 다이어그램으로 만들어 주세요.`라고 요청한다. 일반 구현·리뷰·코드 설명에는 HTML을 무조건 생성하지 않으며, 승인된 프로젝트 지도 유지 선언이 있는 프로젝트의 갱신 범위는 [프로젝트 지도와 작업 동기화](okf/project-navigation.md)를 따른다. 이는 모델의 작업 지침이며 실행 권한을 강제하는 샌드박스나 백그라운드 watcher는 아니다.

- **결과 위치:** 일회성 지도는 [워크플로](okf/workflow.md)의 작업 파일 위치 순서를, 지속 지도의 후보·검증·게시와 native 증거 보존은 [프로젝트 지도와 작업 동기화](okf/project-navigation.md)를 따른다.
- **실행 전제:** Node.js ≥18, 브라우저 검증에는 Chrome/Chromium이 필요하다. setup은 이 실행 환경을 자동 설치하거나 다이어그램을 생성하지 않는다.
- **외부 통신:** 스킬 지침은 매 실행에 `ARCHIFY_UPDATE_CHECK_DISABLED=1`을 요구한다. 업데이트 확인만 끄는 값이며, 외부 로고 URL 접근까지 차단하지 않는다. 기본은 내장 로고/로고 없음이고 외부 접근은 사용자 요청 범위를 확인한다.
- **버전·라이선스:** 고정 commit·배포 ZIP SHA-256·로컬 수정 내역은 [UPSTREAM.md](skills/archify/UPSTREAM.md)에 기록한다. 코드의 MIT와 폰트·개별 로고의 별도 조건을 구분한다. 자동 업데이트는 하지 않는다.
- **기존본·실패 복구:** 교체에 성공하면 다른 기존 스킬 전체를 위 백업 경로에 보존한다. 교체에 실패하고 활성 경로가 비어 있으면 기존본을 자동 복구하며, 이때 기존본은 백업 경로가 아니라 활성 경로에 있다. 복구를 생략하거나 실패하면 기존본을 백업에 유지하고 오류에 실제 복구 상태·경로를 표시한다. 실패한 준비본은 `<configdir>/.skill-stage-<고유값>/`에 보존한다. 남은 백업·준비본은 자동 삭제하지 않으며 수동 복구 시 오류에 표시된 위치와 현재 스킬을 함께 확인한다.

설치 확인은 `omp skill list --json`의 `archify`와 `filePath`를 확인한다. OMP 18.10.0에서 이 출력(`source: native:user`)과 `PI_CODING_AGENT_DIR` 격리 경로에서의 빈 목록을 재확인했다(2026-10-12; 이전 확인: 18.4.4). 스킬을 숨기거나 제외한 사용자 설정은 setup이 강제로 해제하지 않는다. 목록에 없다면 `skills.enabled`, `skills.enablePiUser`, `skills.ignoredSkills`, `skills.includeSkills`, `disabledExtensions`를 확인하고, 슬래시 명령에는 `skills.enableSkillCommands`도 필요하다. 같은 이름의 다른 스킬이 있으면 실제 선택 경로와 namespaced 이름을 확인한다. 발견 성공은 Archify의 렌더링·브라우저 검증 성공과 구분한다.

## 원격 지식 받기 (knowledge-sync 스킬)

다른 개발자가 푸시한 공개 지식·설정을, 이 PC의 로컬 지식과 작업 중인 변경을 지키면서 이 clone에 받아 적용하는 스킬이다. setup 7단계가 `<configdir>/skills/knowledge-sync/`로 배포하며 **새 OMP 세션**에서 다음처럼 요청한다.

```text
/skill:knowledge-sync
```

또는 자연어로 `원격 지식 받아서 적용해 주세요.`라고 요청한다.

- **언제 쓰나:** 원격에 새 지식이나 갱신된 지식이 있다고 사용자가 확인했을 때 쓴다.
- **수행 순서:**
  1. 원격을 fetch한다.
  2. 확인과 백업: 들어올 커밋을 보여 주고, 로컬 지식을 스냅샷으로 남기고, 커밋하지 않은 작업을 백업한 뒤 stash한다.
  3. 병합 전에 원격이 추가하는 경로가 로컬의 미추적·무시 파일과 겹치는지 검사하고, 겹치면 멈춘다(`--no-overwrite-ignore`는 fast-forward에서만 무시 파일을 지키기 때문이다). 그다음 상류 브랜치를 `git merge --no-overwrite-ignore --no-edit --ff <upstream>`로 병합한다. rebase는 하지 않는다. 충돌은 양쪽 지식을 모두 보존하도록 해결하며, 삭제는 근거를 확인해 판단한다.
  4. stash를 복원한다.
  5. setup 전체를 실행한다. 설정·룰·OKF·확장·에이전트·명령·스킬 배포와 레포에서 사라진 관리 항목의 정리(8단계)가 모두 포함된다.
  6. 로컬 지식이 온전한지 확인하고, 바뀐 설정과 정리된 항목을 포함해 결과를 보고한다.
- **설정도 함께 적용한다:** setup 전체를 실행하므로 원격에서 바뀐 `config/settings.conf`의 설정이 적용되고, 레포에서 삭제된 설정 키는 OMP 기본값으로 되돌아간다. 삭제된 확장·에이전트·명령·스킬은 `<configdir>/.managed-retired-<stamp>/`로 옮겨진다.
- **push하지 않는다:** 병합은 **로컬 병합 커밋**까지만 만든다. 결과를 검토하고 push하는 것은 사용자다.
- **로컬 지식은 건드리지 않는다:** `<configdir>/okf/learned/`의 concept을 이동·수정·삭제하지 않는다.
- **새 세션이 필요하다:** setup 전에 시작한 세션은 이전 룰을 계속 쓰므로 재시작해야 새 룰이 적용된다.
- **증거 위치:** 스냅샷·백업 등 작업 증거는 `<repo>/.omp-artifacts/knowledge-sync-*`에 남는다(`<repo>`는 이 clone의 루트).

이 스킬이 아직 없는 사용자는 처음 한 번만 직접 받는다. 먼저 clone의 `okf/learned/`에 이전 방식의 파일이 있으면 다른 곳에 사본을 둔다(`git pull`은 같은 경로의 원격 추적 파일이 있으면 무시된 파일을 덮어쓴다). 그다음 `git pull`로 받고 setup을 실행하면 스킬이 배포된다. setup이 레거시 이관 충돌로 중단하면 그 메시지의 안내를 따른다.

## 프로젝트 목차·상태를 유지하며 작업하기

개발 프로젝트나 큰 프로젝트에서 코드를 분석하지 않고 책임과 연결을 한눈에 보려면, 그 프로젝트에서 새 세션을 열고 아래 명령을 한 번 요청한다. 그 프로젝트의 실제 코드/설정에 맞춰 지도를 만들고 자동 로딩되는 프로젝트 지침에 유지 범위·진입점·근거 경로를 기록한다. 기존 문서가 있으면 재사용하며 사용자 파일을 덮어쓰지 않는다.

```text
/project-map
/project-map status
```

빈 입력은 생성/갱신과 지속 관리 요청이고, `status`는 소스와 지도의 차이·구현/검증 상태·확정 계획·차단 조건·제안을 읽기 전용으로 확인한다. 일회성만 원하거나 유지를 중지하려면 그 범위를 명시한다. 설치만으로 모든 프로젝트에 지도를 만들지는 않는다. 알리고 진행하는 작업 흐름, 지도 구성, 확정된 할 일과 제안의 구분, 작업 트리 근거와 커밋 근거의 구분, 검증 후 게시 절차는 [프로젝트 지도와 작업 동기화](okf/project-navigation.md)가 정본이고 호출 지침은 [project-map 명령](commands/project-map.md)이다.

이 레포는 문서를 직접 읽으면 되는 지침·설정 저장소라 루트 [AGENTS.md](AGENTS.md)의 선언으로 프로젝트 지도를 만들지 않는다. 다른 프로젝트의 상태를 이 레포의 OKF에 복제하지 않는다.

## 작업 파일 위치와 실행 언어

작업용 스크립트·검증 데이터·로그·스크린샷·복구 사본은 사용자 지정 경로 → 프로젝트에 명시된 산출물 경로 → `<프로젝트 루트>/.omp-artifacts/<작업-ID>/` 순으로 한 디렉터리에 모으고, 새 작업용 스크립트는 **TypeScript(`.ts`) + Bun**을 쓴다(Python은 사용자 지정·기존 프로젝트·필수 런타임 제약이 확인된 범위의 예외). 이 레포의 `.gitignore`는 작업 산출물 경로로 `.omp-artifacts/`만 제외하며 나머지 항목은 로컬 smoke 배포 경로·setup 백업 사본·OMP 상태 파일·`okf/learned/`용이다. `okf/learned/` 항목은 이전 방식의 로컬 concept 위치가 커밋되지 않도록 남겨 둔 안전장치이며, 로컬 concept의 현재 위치는 `<configdir>/okf/learned/`다. 다른 프로젝트에서는 기존 ignore 또는 로컬 제외 파일을 우선하며, OMP 설정 탐색을 가리지 않도록 작업 파일만을 위한 `.omp/` 생성은 피한다.

핵심 지침은 `rules/AGENTS.md`, 상세 정본은 [워크플로](okf/workflow.md)와 [실행 언어 정책](okf/tools/builtin.md)이다. 이는 에이전트 행동 지침이며 모든 도구의 출력 경로를 강제하거나 Python 지원을 비활성화하는 설정은 아니다.

## 작업 산출물 정리 명령

정본은 [`commands/cleanup.md`](commands/cleanup.md)이며 두 setup 스크립트가 전역 명령으로 배포한다. OMP의 작업 디렉터리 바로 아래에 `.omp/commands/cleanup.md`가 있으면 그 명령이 전역 명령보다 우선한다. 파일형 명령 탐색은 `<cwd>/.omp/commands`만 확인하고 상위 프로젝트 루트까지 올라가지 않으므로, 하위 디렉터리에서 실행하면 루트의 프로젝트 명령 대신 전역 명령이 선택될 수 있다(`omp://slash-command-internals.md`, OMP 18.10.0 확인 2026-10-12).

| 입력 | 동작 |
|---|---|
| `/cleanup` | 검증 완료 후, 같은 프로젝트의 현 세션에서 마지막으로 명확히 보고한 **현 세션 정리 대상 목록 하나**를 정리한다. 목록이 없거나 모호하면 목록 제시와 승인을 먼저 진행한다. |
| `/cleanup preview` | 현 세션 후보의 위치·생성 근거·정리 영향·보존 사유만 조회한다. 상태를 변경하지 않는다. |
| `/cleanup all` | 현재 프로젝트에서 **다른 세션이 만든 산출물도 탐색**한다. 후보 목록을 보여주고 이 대화에서 승인받은 정확한 항목만 정리한다. `all`은 전체 삭제 승인이 아니다. |

정리·보존 대상, `all`의 탐색 범위와 한계, 승인·실행 절차의 정본은 [`commands/cleanup.md`](commands/cleanup.md)다. 이 명령은 모델에 전달되는 정리 절차이지 삭제 범위를 강제하는 샌드박스가 아니며 `dangerous-tool-guard`를 우회하지 않는다. 보호 확장은 모든 삭제 API를 포괄하지 않으므로 인벤토리·소유·변경 여부 확인도 유지한다. 승인 가능한 UI가 없는 환경에서는 목록만 보고한다.

명령 파일은 세션 시작과 cwd 변경(`/move` 등) 때 발견되며 상시 파일 감시는 없다. 실행 중 세션에서는 `/reload-plugins`로 갱신할 수 있으나 스킬·에이전트·MCP 등도 함께 갱신한다. 자동완성에 `/cleanup`과 설명이 표시되는지 확인한다. 미등록 슬래시 입력은 일반 프롬프트로 전달될 수 있으므로 등록 확인 없이 실행됐다고 판단하지 않는다.

## 도구 정책
코딩 워크플로의 MCP(웹 검색·시맨틱 코드 분석·라이브러리 문서)는 OMP 기본 도구(`web_search`, 가용 `lsp`·AST 도구, `grep`/`glob`, `read`)로 대체하고, MCP는 기본 기능으로 안 되는 외부 연동과 기능(검색 MCP는 뉴스·영상·이미지·장소 수직 검색)에만 쓴다. 현재 세션에 노출된 도구와 호출 문서를 우선하며 AST 도구가 항상 활성이라는 전제를 두지 않는다. 상세: [기본 도구](okf/tools/builtin.md)·[MCP 정책](okf/tools/mcp.md)·[스킬 도입 경계](okf/tools/skills.md).

## 지식·생태계 갱신 근거

[에이전트 생태계 동향과 적용 판단](okf/tools/ecosystem-watch.md)은 **2026-08-26~2026-09-26 공식 발표**와 **09-26 GitHub 월간 Trending 관측**을 분리한 조사 기록이며, 누적 별 수·월간 표시값은 품질·안전성·실사용 점유율의 증거가 아니다. 판단 기준은 [정확성](okf/accuracy.md)을 따른다. 이 기록은 지식·지침 갱신이며 인기 도구 설치나 모델·fallback·advisor·권한 설정의 변경이 아니다.

## 안전한 테스트 (실제 설정 미변경)
`OMP_PROFILE=default`와 `PI_CODING_AGENT_DIR`을 같은 작업 디렉터리 아래의 격리된 배포 경로로 지정한다. 이름 있는 OMP 프로필은 `PI_CODING_AGENT_DIR`을 무시하므로 동일 환경의 `omp config path`가 의도한 격리 경로인지 먼저 확인하고, 다르면 중단한다. 아래 예시는 이 레포 루트에서 실행하며, `<작업-ID>`는 목적과 충돌 방지 식별자를 조합한 실제 값으로 바꾸고 같은 검증 작업에서 재사용한다. 검증 배포본은 자동 삭제하지 않는다.
`PI_CODING_AGENT_DIR`은 이 레포 루트와 달라야 한다. setup은 설정·복사·삭제 전에 공통 Bun 사전 검사로 소스/배포 OKF·스킬 경로의 실제 겹침을 차단한다. 심볼릭 링크·junction으로 같은 경로를 가리키는 경우도 포함하며, 레포 아래의 정상적인 `.omp-artifacts/` 검증 경로는 허용한다. 전체 setup의 트랜잭션을 보장하지는 않으므로 다른 단계에서 실패하면 이미 완료된 설정·배포는 남는다.
메인 clone에서 실행하면 clone의 `okf/learned/`에 이전 방식으로 남은 파일이 있을 때 setup이 그 파일을 격리 설정 폴더의 `okf/learned/`로 복사하고 `.okf-local/`도 격리 설정 폴더에만 만든다. 실제 설정 폴더와 레포 파일은 바뀌지 않는다. 이관 기록은 설정 폴더별이므로 실제 설정 폴더에 처음 setup을 실행할 때는 같은 파일이 다시 복사 대상이 된다.
격리용 환경 변수는 아래처럼 자식 셸 또는 `try/finally` 범위로 제한한다. 실제 배포 전에는 원래 환경에서 `omp config path`가 의도한 사용자 설정 경로인지 다시 확인한다.
OMP 18.3.2에서 확인한 task-agent 사용자 탐색은 18.10.0에서도 `PI_CODING_AGENT_DIR`이 바꾸는 설정 경로와 구별된다. 따라서 격리 경로에 복사한 custom agent의 발견·실행까지 검증됐다고 보지 않는다. custom agent는 프로젝트 `.omp/agents/` 또는 활성 기본/이름 있는 프로필의 실제 탐색 경로에서 검증하고, 테스트를 위해 전역 agents 경로에 복사하지 않는다. 기본 빌트인에는 영향이 없다. 근거: [v18.3.2](https://github.com/can1357/oh-my-pi/blob/v18.3.2/packages/coding-agent/src/task/discovery.ts)·[v18.10.0](https://github.com/can1357/oh-my-pi/blob/v18.10.0/packages/coding-agent/src/task/discovery.ts) `src/task/discovery.ts`의 `getConfigDirs("agents", { project: false })`와 설치본 `omp://task-agent-discovery.md`(Discovery inputs)·`omp://config-usage.md`의 Canonical roots(재확인: 2026-10-12, 이전 2026-09-26).
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

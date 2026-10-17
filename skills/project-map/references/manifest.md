# sources.json (manifest v1)과 게시 영수증

지도 디렉터리의 `sources.json`은 게시된 지도가 무엇에서 만들어졌고 어떤 파일로 이루어져 있는지의 기록이다. 읽는 화면(`index.html`)에는 들어가지 않는다. `publish.ts`가 마지막에 쓰고 `status.ts`가 읽는다. 손으로 고치지 않는다(고치면 다음 게시가 "init 뒤에 바뀜"으로 멈추고, status는 형식 오류를 `problems[]`로 보고한다).

- 경로는 모두 프로젝트 루트 기준 POSIX 상대 경로다. 절대 경로와 PC 이름은 저장하지 않는다. 게시 파일의 경로는 모두 `<map>/`로 시작하고 `..` 구간이 없어야 하며, 입력 파일의 경로만 `../<형제 저장소>/…` 한 단계를 가질 수 있다. status와 publish는 읽을 때 이 규칙을 검사하고 어긋난 경로는 열지 않는다.
- 해시는 소문자 SHA-256 16진수다. 게시 파일은 원시 바이트 해시, 입력 파일은 아래 `mode`에 따른 해시다.
- 이전 형식(예: NMClient의 옛 `sources.json`)은 이어받지 않는다. `schema`가 다른 파일(또는 JSON이 아닌 파일)은 게시 때 통째로 대체되고 내용은 가져오지 않는다. 같은 `schema`인데 형식이 틀린 파일은 이력을 잃지 않도록 게시가 멈춘다.

## 필드

| 필드 | 내용 |
|---|---|
| `schema` | `project-map/sources-1` |
| `project.name` | `src/map.config.json`의 `project.name` |
| `map` | 지도 디렉터리(예: `docs/project-map`). status와 publish는 `--map`과 같은지 확인한다 |
| `basis` | `{ label, written }`: `map.config.json`의 `basis` 그대로 |
| `snapshot` | 입력 집합 식별자(해시 12자). 빌드가 계산해 `index.html`에도 한 줄로 들어간다 |
| `scope` | `{ include, exclude }`: `map.config.json`의 `scope` 그대로(저자가 쓴 값) |
| `inputs[]` | 지도가 만들어진 시점의 입력 파일: `{ path, mode, sha256 }` |
| `unreconciled[]` | 빌드 때 `reconcile.json`에서 받은 미대조 변경: `{ path, reason }` |
| `published.entry` | `{ path, sha256 }`: `index.html` |
| `published.src[]` | `{ path, sha256 }`: `src/` 아래 파일 전부 |
| `published.views.<id>` | `{ json, html, receipt, gates }` (아래) |
| `published.fonts[]` | `{ path, sha256, role, bundled }` |
| `published.fontLicenses[]` | `{ path, sha256 }`: 글꼴이 아닌 `fonts/` 파일(사용 허가서와 출처 기록, 예: `SOURCES.md`) |
| `published.media[]` | `{ path, sha256, bytes, subject, source, capturedAt, identity, identityReason, method, evidence }`: `media/` 아래 파일 전부와 그 자료의 촬영 출처(아래) |
| `design` | `{ template: { id, version }, tokens }`: 빌드가 쓴 템플릿과 `map.config.json`의 토큰 덮어쓰기(없으면 `{}`) |
| `updates[]` | 게시할 때마다 한 항목 추가(아래). 지우거나 고쳐 쓰지 않는다 |

### 입력 범위(`scope`)와 `inputs[].mode`

범위 규칙은 build, publish, status가 같은 검사(`ValidateScope`)로 확인한다. 하나라도 어긋나면 build는 오류, publish는 멈춤, status는 `problems[]`로 보고한다.

- include와 exclude 패턴은 프로젝트 루트 기준 POSIX 글롭이다. 절대 경로, 역슬래시, 제어 문자, 빈 구간, `.`, 중괄호 안을 포함한 중간의 `..`는 안 된다. 디렉터리는 끝에 `/**`를 붙인다(`src/`는 안 되고 `src/**`).
- 형제 저장소는 맨 앞에 `../`를 한 번 쓰고 바로 뒤에 글자만으로 된 디렉터리 이름을 쓸 때만 닿는다: `../NMServer/src/**`. `../*/x`, `../../x`, 프로젝트 자신의 이름(`../<프로젝트 디렉터리>/x`)은 거부한다. 형제 디렉터리는 실제 디렉터리(링크 아님)이고, 프로젝트 안팎 포함 관계가 없고, git 저장소의 최상위여야 한다(`git rev-parse --show-toplevel`이 그 디렉터리). 검사 순서: 범위가 이름 붙인 모든 형제에 대해 먼저 파일 시스템 검사(`lstat`, `realpath`)를 마치고, 그 뒤에 형제마다 git을 실행하며 프로젝트와 모든 형제의 실제 경로를 git 실행 파일이 있어서는 안 되는 곳으로 넘긴다(범위의 뒤에 나오는 형제 안에 있는 git도 첫 형제를 검사하기 전에 거부된다). 어느 검사든 실패하면 그 디렉터리에서 git을 실행하지 않는다.
- git은 항상 `git -c core.fsmonitor=false -c safe.bareRepository=explicit -C <디렉터리> …`로 실행한다. 저장소가 담은 설정이 명령을 실행하거나, 트리에 심은 bare 저장소가 암묵적으로 쓰이는 일을 막기 위한 것이다.
- git 실행 파일은 PATH에서 한 번만 찾는다(`Bun.which("git")`). 결과가 상대 경로이거나(PATH의 `.` 항목 등), 실제 경로(링크를 푼 경로)가 프로젝트나 범위가 읽는 형제 저장소 안에 있으면 실행하지 않고 멈춘다. 그 실행 파일을 절대 경로로 실행하고 작업 디렉터리는 스킬 디렉터리로 둔다. Windows에서는 이름만 주면 현재 디렉터리의 `git.bat`, `git.cmd`, `git.exe`가 PATH보다 먼저 실행되는데, 저장소 루트에 그런 파일이 있어도 막힌다.
- `snapshot`은 `path`로 정렬한 `path<TAB>mode<TAB>sha256<LF>` 줄 전체의 SHA-256 앞 12자다. 정렬은 UTF-16 코드 단위 순서다.
- `sha256-text-lf`: UTF-8 텍스트(처음 8000바이트에 NUL이 없고 UTF-8로 읽힘). CRLF를 LF로 바꾼 바이트의 해시. `sha256-bytes`: 그 밖의 파일. 원시 바이트 해시.
- 입력 목록은 `git ls-files -co --exclude-standard`(추적 파일과 무시되지 않은 새 파일)에서 `scope.include`에 맞고 `scope.exclude`에 맞지 않는 파일이다. 서브모듈과 중첩 저장소는 패턴이 닿을 때만 들어간다.
- 글자만으로 된(글롭 문자 `* ? [ ] { }`가 없는) include 항목이 실제 파일이면 git이 무시하는 파일이어도 입력에 들어간다.
- 항상 제외: `.omp-artifacts/` 아래 전부, 지도 디렉터리 안의 파일 전부(`ScopeForMap`이 지도 디렉터리를 넘기고, `ComputeInputs`가 파일 경로에서 지도 깊이에 있는 디렉터리가 지도 디렉터리 자신인지 장치·파일 ID로 판정한다. ID가 0이나 모두 1인 볼륨과 Windows에서는 디스크 철자로 돌려받은 실제 경로도 같아야 한다). 지도 `index.html`이 snapshot을 품기 때문에 지도 자신은 입력이 될 수 없다.
- 심볼릭 링크와 Windows 정션은 따라가지 않는다. git이 나열한 파일이라도 링크 디렉터리 아래에 있으면 입력이 아니다(git for Windows는 정션 안의 파일도 나열한다). 글자만으로 된 include 파일이 링크를 거치면 오류다. 작업 트리에서 지워진 추적 파일은 입력이 아니다.

### `published.views.<id>`

- `json`, `html`: `{ path, sha256 }`(`<id>.architecture.json`, `<id>.html`).
- `receipt`: 이 바이트가 통과한 Archify finalize 요약의 프로젝트 상대 경로(작업 디렉터리 안). 알 수 없으면 `null`.
- `gates`: 그 요약의 `gates`(`validate`, `deliver`, `check`, `browser-check` 등). 알 수 없으면 `null`.
- 이전 `sources.json`(이 형식)이 같은 바이트를 기록해 두었으면 그 `receipt`와 `gates`를 이어받는다.
- 이전 `sources.json`이 있는데 stage 바이트가 거기 기록된 바이트와 다르면, stage가 durable 파일과 같아도(손으로 고쳤거나, 줄바꿈이 바뀐 체크아웃) 그 바이트에 맞는 finalize 요약이 있어야 게시된다. 없으면 멈춘다. 반대로 stage 바이트가 기록된 바이트와 같으면(손으로 고친 durable 뷰를 기록된 바이트로 되돌려 stage에 둔 경우) 새 요약 없이 게시되고 기록된 `receipt`와 `gates`를 이어받는다.
- `receipt: null`은 다른 도구가 만든 지도의 뷰를 `--adopt`로 이어받을 때만 생긴다. 이전 이 형식의 `sources.json`이 없고 stage 뷰가 durable 파일과 같은데 맞는 finalize 요약도 없으면 게시가 멈추고, `publish.ts … --adopt`를 붙이면 그 뷰를 `receipt: null`, `gates: null`로 기록한다. 출력의 `viewsAdopted`, `viewsWithoutReceipt`, `notes`와 영수증에 뷰 이름이 남는다. 한 번 `null`로 이어받은 뷰는 이후 게시에서도(기록된 바이트와 같은 동안) `null`을 이어받고, 그 바이트에 맞는 finalize 요약이 생기면 그 요약으로 올라간다. 이어받은 뒤 바이트가 바뀌면 요약이 필요하다. `--adopt`는 이전 이 형식의 `sources.json`이 없을 때만 뜻이 있고, durable `index.html`에 템플릿 표지(`<meta name="project-map-template" …>`)가 있으면 거부된다: 그 지도는 project-map이 게시했는데 `sources.json`이 없어졌거나 다른 형식으로 바뀐 것이므로, `--adopt`가 아니라 `sources.json`을 복구(버전 관리나 마지막 게시본에서)한 뒤 새 `--work`로 init부터 다시 한다.

### `published.fonts[]`

- `role`: 스킬이 싣는 글꼴은 `text 400`, `text 700`, `code 400`. 그 밖의 글꼴은 `null`.
- `bundled`: 바이트가 스킬 `assets/fonts/`의 같은 이름 파일과 같으면 `true`.

### `published.media[]`

읽는 화면에는 설명, 출처 표지, 날짜만 나온다. 촬영 커밋·snapshot·빌드 식별자·실행 방법·근거는 이 항목에만 둔다.

- `path`, `sha256`, `bytes`: 게시된 파일의 프로젝트 상대 경로, 원시 SHA-256, 크기.
- `subject`: 무엇을 보여 주는지.
- `source`: 출처 종류. `실제 실행 화면`, `목업`, `컨셉 아트`, `레퍼런스`, `생성 이미지` 중 하나를 쓰는 것을 권한다.
- `capturedAt`: 촬영일 `YYYY-MM-DD`(실제 달력 날짜).
- `identity`: 촬영한 시점의 snapshot ID, 빌드 ID 또는 커밋. 프로젝트에서 찍은 것이 아니면(목업, 컨셉 아트, 레퍼런스, 생성 이미지) `null`.
- `identityReason`: `identity`가 `null`일 때만 쓰고 이유를 적는다. `identity`가 있으면 `null`이다.
- `method`: 촬영 방법(장면이나 실행기와 찍은 방식).
- `evidence`: 근거 영수증의 프로젝트 상대 경로(보통 작업 디렉터리 안, `..` 없음). 없으면 `null`. 경로가 있으면 파일이 실제로 있어야 한다.
- 작성은 `W/media.json`에서 한다(아래). 항목에는 그 파일의 원시 `sha256`이 필수라서, 바이트가 바뀐 뒤에는 이전 바이트용 항목을 쓸 수 없다. 바이트가 바뀌지 않은 자료는 이전 게시에 기록된 출처를 이어받는다. 이전 기록이 없는 기존 파일(다른 도구가 만든 지도에서 온 파일)은 `media.json`에 항목이 있어야 한다.

### `updates[]`

게시 한 번에 항목 하나: `number`(그 작업 디렉터리의 게시 번호), `id`(작업 디렉터리 이름), `date`, `publishedAt`, `work`, `receipt`(`publication-<n>.json`), `build`(`build/build.json`), `browserGate`, `browserScope`(브라우저 확인 범위), `snapshotBefore`(이전 manifest의 snapshot 또는 `null`), `snapshotAfter`, `copied`(복사한 파일 수), `leftInPlace`(지우지 않고 남긴 파일 수). `work`, `receipt`, `build`, `browserGate`는 프로젝트 상대 경로이며 보통 `.omp-artifacts/<task-id>/...`다.

## init의 세 모드

`init.ts`는 지도 디렉터리에 든 파일로 모드를 정하고 출력의 `mode`와 `modeNote`로 알린다.

| 모드 | 조건 | stage |
|---|---|---|
| `new` | 파일이 없음(디렉터리가 없거나 비어 있음). `before.sha256.txt`는 비어 있다 | `examples/minimal` 전체 스캐폴드 + 글꼴 |
| `update` | `src/map.config.json`이 있음 | 지도 전체 복사 + 글꼴 |
| `adopt` | 파일은 있는데 `src/map.config.json`이 없음(다른 도구가 만든 지도) | 지도 전체 복사 + 스캐폴드의 `src/`만 + 글꼴. 스캐폴드 경로에 이미 파일이 있으면 아무것도 쓰기 전에 멈춘다 |

`adopt`에서는 스캐폴드 페이지가 쓰는 `media/` 파일이 stage에 없으므로 직접 넣고 `media.json`을 쓴다. 기존 `sources.json`은 `before/`와 `stage/`에 복사되지만 게시되지 않고 새 형식으로 대체된다. 그 지도의 뷰는 finalize 요약이 있거나 `publish.ts --adopt`로 받아들여야 게시된다.

init은 아무것도 만들기 전에 기존 `sources.json`을 publish와 같은 규칙(`ReadManifestFile`, 한 함수)으로 읽는다. JSON으로 읽히지 않거나(병합 충돌 표식, 잘림), 다른 `project-map/` 버전이거나, 이 형식인데 형식이 틀리거나, `map`이 `--map`과 다르면 "repair it, or move it away" 메시지로 멈추고 `W`를 만들지 않는다. 버전 관리의 이전 본이나 마지막 게시본으로 고친 뒤 init을 다시 한다. 고칠 수 없어 옮기면 이력이 처음부터 시작된다: 이어받을 영수증과 출처 기록이 없으므로 게시에는 모든 뷰의 통과한 finalize 요약(새 작업 디렉터리 안)과 모든 `media/` 파일의 `media.json` 항목이 필요하다. 외부 형식(JSON이고 `schema`가 `project-map/`으로 시작하지 않음)은 통과하고 게시 때 대체된다.

init은 임시 디렉터리 `W/init.tmp`에서 만든 뒤 `W/before.sha256.txt`, `W/before/`, `W/stage/` 순으로 옮기고 `stage/`가 마지막이다. `stage/`가 있고 `init.tmp`가 없으면 끝난 init이다. 중간에 끊긴 init은 `init.tmp`나 `before/`만 남기고, 다시 실행하면 "an earlier init … did not finish" 메시지로 멈춘다. 그 작업 디렉터리에는 init의 부분 복사본뿐이므로 새 `--work`로 init을 다시 한다.

## 경로와 링크

`--project`는 git 작업 트리의 최상위여야 한다(`git rev-parse --show-toplevel`과 실제 경로로 대조). 저장소의 하위 디렉터리나 git 밖의 디렉터리면 init, build, publish, status 모두 멈춘다. 지도 디렉터리가 중첩 저장소·서브모듈·worktree(`.git`이 있는 디렉터리) 안에 있으면 그 디렉터리를 `--project`로 써야 하며, 바깥 저장소를 `--project`로 주면 멈춘다. 잠금이 `<project>/.omp-artifacts/`에 생기고 `sources.json`이 지도 경로를 프로젝트 기준으로 적으므로, 같은 지도를 다른 루트에서 부르면 잠금 폴더와 이름이 둘이 되기 때문이다.

심볼릭 링크와 정션은 어디서도 따라가지 않는다. `--map`은 프로젝트 루트에서 지도 디렉터리까지, `--work`가 프로젝트 안이면 프로젝트 루트에서 작업 디렉터리까지 존재하는 모든 구간을 `lstat`하고, 링크가 하나라도 있으면 init, publish, status 모두 멈춘다. 지도 디렉터리 안의 링크도 같다(복사 전에 걸러진다). `--work`가 프로젝트 밖이면 작업 디렉터리 자체가 링크인지만 본다.

`--map`에서 이미 있는 구간은 디스크에 있는 철자 그대로 쓴다. NFC와 NFD의 차이만 같은 철자로 본다. 다른 대소문자, Windows 8.3 짧은 이름(`PROJEC~1`), `<이름>::$INDEX_ALLOCATION`처럼 같은 디렉터리를 다르게 부르는 표기는 init, build, publish, status 모두 멈추고, 찾을 수 있으면 디스크의 철자를 알려 준다. 같은 지도가 잠금과 `sources.json`의 `map`에서 이름을 둘 갖지 않게 하려는 것이다. 끝이 `.`나 공백인 구간과 `:`가 든 구간은 Windows 도구가 쓴 대로 다루지 않으므로 받지 않는다. 신선도 입력에서 지도 디렉터리를 뺄 때는 이름을 비교하지 않고 디렉터리의 장치·파일 ID로 판정한다. git은 추적 파일을 인덱스의 철자로 알려 주므로, 디렉터리 이름의 대소문자만 git 밖에서 바뀐 저장소에서는 git의 철자가 디스크의 철자와 다르다. 이름 비교로는 이 차이를 놓치거나(대소문자 구분) 다른 디렉터리까지 빼게 된다(NTFS에서 `straße`와 `strasse`, `xß`와 `xẞ`는 서로 다른 디렉터리다).

## publish가 쓰는 것과 멈추는 조건

`bun <skill>/scripts/publish.ts --project <root> --map <map-rel> --work <W> [--receipt <n>] [--adopt]`

### 잠금

가드를 평가하기 전에 `<project>/.omp-artifacts/project-map-publish-<접은 map 경로의 sha256 앞 12자>.lock`을 배타적으로(`wx`) 만든다. 접은 경로는 NFC로 맞추고 소문자, 대문자, 다시 소문자로 바꾼 뒤 NFC로 한 번 더 맞춘 값이다. 그래서 아직 없는 구간의 대소문자만 다르게 쓴 두 게시도 같은 잠금을 쓴다. 대소문자를 구분하는 파일 시스템에서 대소문자만 다른 두 지도는 게시가 차례로 돈다. 잠금을 잡은 뒤에는 `--map` 검사를 한 번 더 한다. 그사이 다른 게시가 만든 디렉터리를 다른 철자로 가리키면 멈춘다. 끝나면(오류로 끝나도) 잠금을 지운다. 같은 지도에 다른 게시가 돌고 있으면 이 파일이 이미 있어 멈추고, 잠금이 담은 `pid`, `work`, 시작 시각을 보여 준다. 잠금이 있으면: 그 게시가 정말 실행 중인지(`pid`와 `work`로) 확인한다. 실행 중이 아니면 사용자에게 알리고, 사용자가 동의한 뒤에만 그 잠금 파일을 옮기거나 지우고 다시 게시한다. 프로세스가 강제로 끝나거나 컴퓨터가 꺼지면 잠금이 남는다(정상 종료와 오류 종료는 지운다). 잠금은 같은 지도의 게시끼리만 막는다. 사람이나 다른 도구가 지도 파일을 직접 고치는 경우는 아래 "쓰기"의 덮어쓰기 직전 재확인이 막는다.

### 첫 쓰기 전에 확인하는 것

하나라도 어긋나면 아무것도 쓰지 않고 멈춘다(종료 코드 1).

| 확인 | 멈추는 경우 |
|---|---|
| `W/build/build.json` | 없음, `errors`가 0이 아님, `template`/`stageSha256` 없음, 입력 경로가 형식에 안 맞음, `snapshot`이 `inputs`와 맞지 않음 |
| 오래된 빌드 | `stage/index.html`의 해시가 `stageIndexSha256`과 다름. 또는 stage 전체(`src/`, `fonts/`, `media/`, 뷰 파일, 그 밖의 모든 파일. 루트의 `index.html`과 `sources.json`은 제외)의 `stageSha256`이 빌드 때와 다름(빌드 뒤에 어느 파일이든 바뀜) |
| `W/BrowserGate.json` | 없음, `passed`가 true가 아님, `entrySha256`이 지금의 `stage/index.html`과 다름, `stageSha256`이 빌드의 `stageSha256`과 다름(브라우저로 본 것과 다른 stage) |
| 범위 | `map.config.json`의 `scope`가 `ValidateScope`를 통과하지 못함 |
| stage 구성 | `index.html`, `src/map.config.json`, 설정된 뷰의 두 파일이 없음. 게시 구성 밖의 새 파일이 있음(durable 지도에 같은 바이트가 이미 있는 파일은 통과) |
| 뷰 | 기록된 바이트와 다른 stage 뷰에 `ok`가 true이고 모든 gate가 `pass`이며(`validate`, `deliver`, `check`, `browser-check` 필수) `specification.sha256`/`artifact.sha256`이 stage의 `<id>.architecture.json`/`<id>.html`과 같은 `W/archify/<id>/**/<id>.finalize-summary.json`이 없음. "기록된 바이트"는 이전 `sources.json`이 그 뷰에 기록한 바이트이고, 이전 `sources.json`이 없으면 durable 복사본이다. 이전 `sources.json`이 없고 stage 뷰가 durable과 같은데 요약이 없는 경우(다른 도구가 만든 지도)는 `--adopt` 없이는 멈춘다 |
| 이전 manifest | `sources.json`이 JSON으로 읽히지 않음(병합 충돌 표식, 잘림), `schema`가 `project-map/`으로 시작하는데 `project-map/sources-1`이 아님(다른 버전), 이 형식인데 형식이 틀림, 또는 `map`이 `--map`과 다름. init도 같은 규칙으로 먼저 걸러내므로 보통 init에서 멈춘다. publish가 이를 처음 발견하는 경우는 init 뒤에 파일이 바뀐 때다. 이 경우 "repair it, or move it away"로 멈추고 이력을 버리지 않으며, 고친 뒤에는 새 `--work`로 init부터 다시 해야 한다(옛 `W`의 `before`는 고치기 전 파일을 기준으로 하므로 이어서 게시하지 않는다). JSON으로 읽히고 `schema`가 `project-map/`으로 시작하지 않는 파일(다른 도구의 manifest)만 외부 형식으로 보고 새 형식으로 대체한다 |
| 변경 감지 | 덮어쓸 durable 파일(과 `sources.json`)이 `W/before.sha256.txt`의 해시도, 이 작업이 이미 게시한 해시도 아님. 메시지가 경우를 가른다: `changed since init`(init 때 있던 파일이 바뀜), `appeared since init`(init 때 없던 파일이 생김), `changed by someone else after this task published it`(이 작업이 게시한 뒤 다른 쪽이 바꿈), `removed …`. 다른 세션의 수정을 덮어쓰지 않기 위한 것이므로 다시 통합한 뒤 새 작업으로 한다 |
| 시각 자료 출처 | `stage/media/`의 파일이 새것이거나 바이트가 durable과 다른데 `W/media.json`에 항목이 없음(출처가 기록되지 않은 기존 파일 포함). 항목의 `sha256`이 stage 파일과 다름. 항목이 있어도 필드가 틀림(날짜 형식, 빈 문자열, `identity`가 `null`인데 `identityReason` 없음, 모르는 키, 없는 `evidence` 파일). `media.json`에 `stage/media/`에 없는 파일의 항목이 있음. 멈출 때 파일 목록을 보여 준다 |
| 영수증 번호 | `--receipt`가 이미 있는 번호이거나 다음 번호가 아님. 번호는 일회성이다 |

### 쓰기

1. 바뀐 파일마다, 복사 직전에 durable 대상을 다시 해시해 계획 때 값과 같은지 확인한다(다르면 `changed while publishing`으로 멈춰 그 파일을 덮어쓰지 않는다). 첫 복사 전에 모든 대상을 한 번 더 확인한다. stage 파일은 계획 때의 해시와 같은 바이트만 복사하고 복사본의 원시 해시를 다시 읽어 확인한다. 순서는 `fonts/`, `media/`, `src/`, 뷰, `index.html` 순이다(진입점이 없는 파일을 가리키지 않도록 마지막).
2. 게시 구성의 모든 파일이 stage 바이트와 같은지 다시 확인한다.
3. `W/publication-<n>.json`을 배타적으로 만든다(`wx`).
4. `sources.json`을 다시 해시해 계획 때와 같은지 확인한 뒤 마지막에 쓴다.

지우지 않는다. stage에 없는 durable 파일은 영수증과 출력의 `leftInPlace`에 보고만 한다. 바뀐 파일이 없고 manifest도 같으면 영수증 없이 "이미 같음"으로 끝난다. 게시 중간에 실패하면 `sources.json`은 옛 상태로 남고 status가 바뀐 파일을 `changed`로 보고한다.

복사 구간에서 중단돼도 같은 작업 디렉터리에서 다시 실행할 수 있다. 끝까지 복사된 파일은 stage와 같으므로 통과하고 나머지만 복사한다. 복사 도중 끊겨 stage와도 init 시점과도 다른 파일은 "init 뒤 변경"으로 멈추므로, 그 파일을 확인한 뒤 새 작업 디렉터리에서 init부터 다시 한다.

## status가 읽는 것

`bun <skill>/scripts/status.ts --project <root> --map <map-rel> [--out <file>]`

읽기 전용이다. `--out`은 새 파일로만 쓴다(`wx`, 이미 있으면 실패). 종료 코드 1은 잘못된 인자(git 작업 트리 최상위로 확인되지 않는 `--project`, git을 실행하지 못해 확인할 수 없는 경우 포함)나 읽을 수 없는 지도 디렉터리(링크를 거치는 경로, 파일인 경로)일 때만이다. 그 밖의 문제는 JSON 보고서의 `problems[]`에 담고 `fresh: false`로 종료 코드 0이다. 출력(JSON):

| 필드 | 내용 |
|---|---|
| `manifest` | `sources.json`의 project, snapshot, basis, 마지막 update. 쓸 수 없으면 `null` |
| `inputs` | `recorded`, `current`, `snapshotNow`, `changed[]`, `added[]`, `removed[]`: 기록된 입력과 지금 작업 트리를 `scope`로 다시 계산해 비교한 결과. 범위를 다시 계산할 수 없으면 `null` |
| `unreconciled` | 게시 때 기록된 미대조 목록 그대로 |
| `published` | `checked`, `missing[]`, `changed[]`: 기록된 모든 게시 파일(진입점, src, 뷰, 글꼴, 허가서, 미디어)의 원시 해시를 디스크와 비교. 링크를 거치는 파일은 `changed` |
| `problems[]` | 읽을 수 없는 이유: `sources.json`이 없음, JSON이 아님, 다른 형식(`legacy or foreign format`), 형식 오류, 다른 `map`, 범위 규칙 위반, 없는 형제 저장소, 규칙을 어긴 경로(절대 경로, `..`, `<map>/` 밖) 등. `index.html`에 템플릿 표지가 있는데(project-map이 만든 지도) `sources.json`이 없거나 다른 형식으로 바뀌었으면 "아직 게시되지 않음"이 아니라 "missing although project-map built this map" / "was replaced by another format … do not adopt the map"으로 보고한다 |
| `fresh` | 입력과 게시 파일에 변화가 없고 `problems[]`가 비어 있으면 `true`. 지문 비교일 뿐 내용이 맞다는 증명이 아니다 |

### `.gitattributes`

게시 파일의 해시는 원시 바이트라서, 저장소 설정이 줄바꿈을 바꾸는 환경(Windows `core.autocrlf` 등)에서는 같은 파일이 `changed`로 보이고, 뷰 파일은 게시 때 "기록된 바이트와 다름"으로 멈춘다. 프로젝트의 `.gitattributes`에 지도 디렉터리에 대한 한 줄만 둔다.

```
docs/project-map/** -text
```

`<map>/** -text`만 권한다. `eol=lf`는 텍스트가 아닌 파일(PNG, WOFF2)의 바이트를 바꿔 해시가 어긋난다(PNG 서명은 CR LF를 포함한다). 경로는 `--map` 값으로 바꾼다.

## 작업 디렉터리의 영수증

작업 디렉터리 `W`(보통 `<project>/.omp-artifacts/<task-id>/`)는 일회성 작업 기록이며 프로젝트 문서가 아니다. 잠금 파일만 `W`가 아니라 `<project>/.omp-artifacts/` 바로 아래에 생긴다(위 "잠금"). 게시가 강제로 끝나면 잠금이 남아 다음 게시가 멈추므로, 그때는 위 "잠금"의 순서(실행 중인지 확인, 사용자에게 알림, 동의 뒤에만 제거)를 따른다.

| 파일 | 쓰는 쪽 | 내용 |
|---|---|---|
| `before/`, `before.sha256.txt` | init | init 시점 durable 지도의 복사본(`before/`)과 그 해시 목록 `before.sha256.txt`(`<sha256>  ./<상대 경로>` 줄들). 목록은 `before/` 밖에 두므로 지도에 `sha256.txt`라는 파일이 있어도 겹치지 않는다. 지도에 파일이 없으면 목록은 비어 있다 |
| `stage/` | init, 에이전트 | 후보 지도 전체. `stage/sources.json`은 참고용 복사본이며 게시되지 않는다 |
| `reconcile.json` | 에이전트 | `{ "unreconciled": [{ "path", "reason" }] }`. 비어 있어도 파일은 있어야 한다 |
| `build/build.json` | build | `template`, `stageIndexSha256`, `stageSha256`, `snapshot`, `inputs`, `unreconciled`, `errors`, `warnings`(와 build가 더 남기는 필드). `stageSha256`은 stage의 모든 파일(루트의 `index.html`, `sources.json` 제외)의 `<경로>\t<원시 sha256>\n` 줄을 경로 순으로 이은 것의 SHA-256 |
| `BrowserGate.json` | 에이전트 | `{ "passed": true, "entrySha256": "<stage/index.html 해시>", "stageSha256": "<build.json의 stageSha256과 같은 값>", "scope": "<확인한 범위>" }`. 브라우저로 본 stage가 빌드한 stage와 같다는 기록이다 |
| `media.json` | 에이전트 | 게시할 시각 자료의 출처. `{ "<지도 디렉터리 기준 경로, 예: media/x.png>": { "sha256", "subject", "source", "capturedAt", "identity", "identityReason"?, "method", "evidence" } }`. `sha256`은 stage 파일의 원시 해시(필수, 같아야 함). 새 파일과 바이트가 바뀐 파일은 항목이 필수이고, 바뀌지 않은 파일은 없어도 된다(있으면 그 항목이 이전 기록을 대체한다). 파일이 없으면 빈 목록이다 |
| `archify/<view>/**/<view>.finalize-summary.json` | Archify | 뷰별 finalize 요약. 같은 바이트로 통과한 가장 최근 것이 manifest의 `receipt`가 된다 |
| `publication-<n>.json` | publish | `copies[]`(`path`, `replacedSha256`, `sha256`), `files[]`(게시한 모든 파일의 `path`, `sha256`: 복사한 것과 이미 같던 것), `unchanged`, `leftInPlace[]`, `viewsWithoutReceipt[]`, `viewsAdopted[]`(이번에 `--adopt`로 받아들인 뷰), `driftSinceBuild`(빌드 뒤 입력 변화), `manifest`(`replacedSha256`, `sha256`) 등. 다시 쓰지 않는다 |

`publication-<n>.json`의 `files`, `copies`와 `manifest.sha256`은 같은 작업 디렉터리에서 다시 게시할 때 "이 작업이 직접 게시한 파일인가"를 가르는 근거로도 쓰인다. 게시한 뒤 지도를 또 고칠 때는 같은 `W`에서 build, 브라우저 확인을 다시 하고 `publish.ts`를 다시 실행하면 다음 번호의 영수증이 생긴다.

# 화면 원본(src) 형식과 빌드 점검

지도 화면의 내용은 지도 디렉터리의 `src/`에 있는 JSON이 정본이다. `scripts/build.ts`가 `W/stage/src`를 읽어 검증하고, 템플릿(`assets/template.html`)에 필요한 필드만 끼워 `W/stage/index.html`을 만든다. `index.html`은 손으로 고치지 않는다. 화면을 고칠 때는 `src`의 필드를 현재 사실로 바꿔 쓰고(문단을 덧붙이지 않는다) 다시 빌드한다.

```text
bun <skill>/scripts/build.ts --project <프로젝트 루트> --map <지도 디렉터리(프로젝트 기준)> --work <W>
```

- 오류가 하나라도 있으면 종료 코드 1이고 `stage/index.html`과 `build/build.json`을 쓰지 않는다. 오류는 `ERROR <파일>:<필드 경로>: <이유>`로 한 줄씩 나온다.
- 오류가 없으면 `stage/index.html`과 `W/build/build.json`을 쓴다. `build.json`: `{ template, stageIndexSha256, srcSha256, stageSha256, snapshot, inputs, unreconciled, errors: 0, warnings }`.
  - `stageIndexSha256`: 만든 `stage/index.html`의 해시. `srcSha256`: 검증한 `src` 파일의 바이트 해시(경로 정렬 줄 `<경로>\t<sha256>`을 합친 해시). 빌드가 읽어 검증한 바로 그 바이트의 해시다.
  - `stageSha256`: `stage/`의 모든 파일 해시(`<stage 기준 경로>\t<sha256>` 줄을 경로순으로 합친 해시). 루트의 `index.html`과 `sources.json`은 뺀다(`lib/files.ts`의 `HashStage`). 빌드는 검증을 시작하기 전에 이 값을 구하고 쓰기 직전에 다시 구해 같은지 확인한다. 빌드 중 `stage/`가 바뀌면 오류다. 게시는 이 값이 지금 `stage/`와 같고 `BrowserGate.json`의 `stageSha256`과도 같을 때만 진행한다. 빌드 뒤 `src`·`media`·관계도·글꼴을 바꾸면 다시 빌드하고 브라우저 확인을 다시 해야 한다.
- 경고(`WARN`)는 게시를 막지 않는다: 어느 페이지도 쓰지 않는 `media/` 파일, 카드가 아닌 선행 작업 ID, `reconcile.json`에서 어떤 입력에도 맞지 않는 경로.

## 파일 배치

`src/`에는 아래 파일만 둔다. 그 밖의 파일(메모, 영수증, 임시 파일)은 오류다. 에이전트 메모·근거 설명·해시·시험 건수는 작업 디렉터리(`W`)에 둔다.

| 파일 | 내용 |
|---|---|
| `map.config.json` | 프로젝트 이름, 링크, 기준, 책임 영역 목록, 관계도(view), 입력 범위, 토큰 덮어쓰기 |
| `pages/overview.json` | 전체 요약 화면 |
| `pages/<영역 id>.json` | 책임 영역 화면. `map.config.json`의 `areas`마다 하나 |
| `pages/verification.json` | 검증 현황 화면 |
| `pages/basis.json` | 근거·신선도 화면 |
| `pages/board.json` | 선택. 작업 보드와 결정 기록 화면의 문구 |
| `tasks.json` | 칸반 카드 배열 |
| `decisions.json` | 결정 기록 배열 |

`stage/`에는 `src/` 말고도 `fonts/`(init이 스킬에서 복사), `media/`(화면이 쓰는 이미지·영상), 관계도 파일 `<view>.html`과 `<view>.architecture.json`이 있다.

## 공통 규칙

- UTF-8 JSON이다. 모르는 키는 오류다. 필수 키는 빠지면 오류다. 값이 없을 때 쓰는 키는 `null`로 둔다(아래 표의 "또는 null"). 표에서 `선택`이라고 적은 키만 통째로 빼도 된다.
- 글(`text`로 표시한 필드)은 한 줄이다. 앞뒤 공백과 줄바꿈이 없고 글자 수 한도를 지킨다. 글자 수는 유니코드 코드 포인트 수다.
- 화면에 보이는 글에는 아래 「금지 패턴」을 적용한다.
- `href`와 `src` 같은 링크는 지도 디렉터리(`index.html`이 있는 곳) 기준 상대 경로다. 공백은 `%20`으로 쓴다. 허용하는 형태는 상대 경로와 `http://`·`https://` 주소다. `#`으로 시작하는 값, `/`로 시작하는 값, 그 밖의 스킴(`javascript:` 등), 역슬래시, 제어 문자(`U+0000`~`U+001F`, `U+007F`~`U+009F`, `%01`처럼 인코딩한 것 포함)는 오류다. 제어 문자는 브라우저의 주소 해석기가 앞부분에서 건너뛰므로 스킴 검사를 피하는 데 쓰일 수 있다.
  - 대상은 일반 파일이어야 한다. 디렉터리는 링크할 수 없다(대신 그 안의 파일을 가리킨다).
  - 지도 디렉터리 안을 가리키면 그 파일이 `stage/`에 있어야 한다. 단 `sources.json`은 게시가 마지막에 쓰므로 처음 만드는 지도에서도 링크할 수 있다. 이 파일 하나만 예외다.
  - 지도 디렉터리 밖(예: `../../README.md`)을 가리키면 지도가 게시될 위치에서 보아 그 파일이 있어야 한다. 빌드는 이 검사를 그 위치에서 하므로 `W/stage/`에서 연 브라우저에서는 이 링크가 열리지 않는다(깊이가 다르다). 이런 링크는 빌드 점검으로만 확인한다.
  - 템플릿은 `http:`·`https:`·`file:`로 해석되는 링크만 `href`로 넣는다. 그 밖의 값은 빌드가 막지만 템플릿도 한 번 더 걸러 링크를 비워 둔다.
  - `src`와 `poster`(`media/` 아래 파일)도 같다. 제어 문자는 오류이고 일반 파일이어야 한다.
- 프로젝트 경로(`where.path`, `suite`, `repos.path`)는 프로젝트 루트 기준 POSIX 상대 경로다. 파일이나 디렉터리가 실제로 있어야 한다. `../<형제 저장소>/...`로만 프로젝트 밖으로 나갈 수 있고, `.omp-artifacts` 아래는 쓸 수 없다. 절대 경로와 역슬래시는 오류다.
- 날짜는 `YYYY-MM-DD` 달력 날짜다.
- ID: 영역 `id`와 관계도 `view` 이름은 소문자·숫자를 하이픈으로 이은 말이다(최대 32자). 카드 ID는 대문자·숫자를 하이픈으로 이은 말이다(예: `SYNC-RETRY-01`, 최대 32자).
- 예약어: 영역 id는 `overview`, `board`, `verification`, `decisions`, `basis`, `task`를 쓸 수 없고, view 이름은 `index`를 쓸 수 없다.

## map.config.json

```json
{
  "schema": "project-map/config-1",
  "project": { "name": "포켓노트", "logo": "포", "subtitle": "프로젝트 지도" },
  "links": [ { "label": "README", "href": "../../README.md" } ],
  "basis": { "label": "2026-10-17 작업 트리 기준.", "written": "2026-10-17" },
  "areas": ["storage", "sync", "ui"],
  "views": { "overview": { "name": "전체 관계도" } },
  "scope": { "include": ["src/**", "tests/**"], "exclude": ["src/generated/**"] },
  "tokens": {}
}
```

| 필드 | 값 | 한도·규칙 |
|---|---|---|
| `schema` | `"project-map/config-1"` | 고정 |
| `project.name` | 글 | 13칸. 사이드바 이름 자리에 맞춘다: 한글 한 글자가 1칸, 영문·숫자는 0.6칸 |
| `project.logo` | 글 | 2자. 사이드바의 네모 로고 안 글자 |
| `project.subtitle` | 글 | 15칸(같은 방식). 보통 `프로젝트 지도` |
| `links[]` | `{ label, href }` 0~4개 | `label` 12자. 화면 위쪽 오른쪽에 버튼으로 나온다 |
| `basis.label` | 글 | 36자. 사이드바 아래에 한 줄로 나온다. 날짜로 시작해도 된다(예: `2026-10-17 작업 트리 기준.`) |
| `basis.written` | 날짜 | 지도를 쓴 날. 근거·신선도 화면에 나온다 |
| `areas[]` | 영역 id 1~16개 | 메뉴 순서. 중복 불가. 각각 `pages/<id>.json`이 있어야 한다 |
| `views` | `{ "<view>": { "name": 글 } }` 최대 12개, 비워도 된다 | `name` 14자. 관계도 제목과 표의 `관계도` 칸 표지에 쓴다. 각 view는 `stage/<view>.html`과 `stage/<view>.architecture.json`이 있어야 한다 |
| `scope.include` | 글롭 1~200개 | 지도의 신선도 입력 범위. 프로젝트 루트 기준이고 `../<형제 저장소>/`로 시작할 수 있다. 모든 항목이 입력 파일을 하나 이상 골라야 한다. 디렉터리는 `src/**`처럼 `/**`로 쓴다 |
| `scope.exclude` | 글롭 0~200개 | 제외 범위. 지도 디렉터리와 `.omp-artifacts`는 자동으로 제외된다(지도 디렉터리는 git이 알려 준 철자와 상관없이 디렉터리의 장치·파일 ID로 판정한다). 같은 글롭 규칙을 따른다 |
| `tokens` | `{ "--<이름>": "<값>" }` 최대 40개 | 템플릿 `:root`의 CSS 변수 덮어쓰기. 사용자가 요청한 경우에만 쓴다 |

- `basis.snapshot`은 쓰지 않는다. 빌드가 `scope`에서 입력 파일 지문을 계산해 12자리 ID를 만들고 화면에 넣는다.
- `scope` 규칙(`lib/inputs.ts`의 `ValidateScope`가 빌드·게시·상태 확인에서 같게 검사한다):
  - 프로젝트 밖은 맨 앞의 `..` 하나와 글자 그대로의 형제 디렉터리 이름으로만 나간다(`../Server/src/**`). `../../x`, `../*/x`, 중괄호 안의 `..`, 중간의 `..`는 오류다.
  - 형제 디렉터리는 있어야 하고 링크(심볼릭 링크·정션)가 아니어야 하며 그 자체가 git 저장소의 최상위여야 한다. 프로젝트 자신이거나 프로젝트를 품은 디렉터리(`../<프로젝트 폴더 이름>/x`)는 형제가 아니다.
  - 절대 경로, 역슬래시, 제어 문자, 빈 항목, `.`·빈 구간, 끝의 `/`는 오류다(디렉터리는 `/**`).
  - 입력 파일을 하나도 고르지 못하는 `include` 항목은 오류다. `src`처럼 `/**` 없이 디렉터리 이름만 쓰면 아무 파일도 고르지 못해 신선도 확인이 늘 "최신"으로 나오므로 빌드가 막는다.
- view의 쪽 크기는 `<view>.html`에서 처음 나오는 `<svg viewBox="0 0 W H">`에서 읽는다. 구성 요소 ID는 `<view>.architecture.json`의 `components[].id`에서 읽는다.
- 토큰 이름은 템플릿이 정의한 것만 된다: `--background`, `--foreground`, `--secondary-foreground`, `--card`, `--popover`, `--primary`, `--primary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--border`, `--input`, `--ring`, `--sidebar`, `--sidebar-accent`, `--hover`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--ok`, `--decide`, `--danger`, `--danger-text`, `--sidebar-width`, `--header-height`. 값은 색이나 길이(64자 이내)이고 `url()`은 쓸 수 없다. 기본값을 바꾸면 게시 manifest의 디자인 기록에 남는다.

## 공통 조각

### status[] (상태 표지)

- 글 표지: `{ "label": "구현", "text": "저장과 목록 화면", "tone": "ok" }`
- 사용자 결정 건수 표지: `{ "label": "대기", "tone": "decide", "count": "userDecision" }`(`text` 없음). 화면이 `사용자 결정 N건`으로 채운다. N은 열이 `blocked`이고 `reason`이 물음표로 끝나는 카드 수다.
- `label` 6자, `text` 24자. `tone`: `ok`(청록), `warn`(본문색), `fail`·`block`(빨강), `decide`(금색), `neutral`(회색). 상태색은 상태에만 쓴다.
- 구현·검증·결정 대기를 각각 짧은 말로 쓴다(예: `구현됨`, `실기기 미검증`).

### visual (시각 자료)

| 종류 | 필드 |
|---|---|
| `image` | `kind, src, alt, caption, source, basis, stale, staleReason, evidence` |
| `video` | `kind, src, poster, alt, caption, source, basis, stale, staleReason, evidence, loop` |
| `diagram` | `kind, view, focus, caption` |

- `src`: `media/` 아래 파일. 이미지는 `.png .jpg .jpeg .gif .webp`, 영상은 `.mp4 .webm`. `stage/`에 있어야 한다.
- `alt` 80자, `caption` 60자, `source` 16자(예: `실제 실행 화면`, `목업`, `생성 이미지`), `staleReason` 60자.
- `basis`: 정확히 `YYYY-MM-DD 빌드` 또는 `YYYY-MM-DD 촬영`.
- `stale`: 다시 찍어야 하면 `true`. `true`이면 `staleReason`이 필수이고 `false`이면 `null`이다.
- `evidence`: 촬영 근거 링크 또는 `null`.
- `video.loop`: `true`이면 소리 없이 자동 반복 재생하고 재생 막대도 둔다. `false`이면 `poster`를 보여 주고 사용자가 재생한다. 소리가 켜진 채 저절로 재생되는 영상은 없다. `loop`이 `false`이면 `poster`(이미지 파일)가 필수다. `loop`이 `true`일 때 `poster`는 파일 또는 `null`.
- `diagram.view`: `map.config.json`의 `views`에 있는 이름. `focus`: 처음 강조할 구성 요소의 ID 또는 `null`. `view:` 접두사를 붙이지 않은 ID여야 하고 그 view에 있어야 한다. Archify는 `#focus=` 뒤의 ID가 틀리면 조용히 무시하므로 빌드가 막는다.
- 보여 줄 근거가 없는 영역에는 장식 그림을 채우지 않는다. `visual`을 빼면 글만 있는 화면이 된다.

### 링크 목록

`evidence[]`: `{ "label": 글(30자), "href": 링크 }`. 화면에는 `근거 자료` 버튼으로 나온다.

## pages/overview.json (전체 요약)

| 필드 | 값 | 한도 |
|---|---|---|
| `headline` | 글. 프로젝트를 한 문장으로 | 50자 |
| `role` | 글 | 60자 |
| `status[]` | 상태 표지 0~4개 | |
| `visual` | `image` 또는 `video`, 또는 `null` | 대표 화면 |
| `points[]` | 글 1~5개 | 60자 |
| `repos[]` | 선택. `{ name(24자), path, role(60자) }` 1~6개 | `path`는 프로젝트 경로(예: `./`, `common/`, `../Server/`) |
| `changes[]` | `{ date, text(90자) }` 0~6개 | 최근 변경. 사용자 관점의 한 줄 |

`menu`는 쓰지 않는다. 메뉴 이름은 `전체 요약`으로 고정이다.

## pages/<영역 id>.json (책임 영역)

| 필드 | 값 | 한도 |
|---|---|---|
| `id` | 파일 이름과 같은 영역 id | |
| `menu` | 글. 메뉴에 나오는 짧은 이름 | 14자 |
| `headline` | 글. 그 영역의 핵심 사실 한 문장 | 50자 |
| `role` | 글 | 60자 |
| `status[]` | 상태 표지 0~4개 | |
| `visual` | 선택. `image`·`video`·`diagram` | |
| `points[]` | 글 1~5개. 한 줄에 한 사실 | 60자 |
| `rows[]` | 책임·파일·심볼 목차 0~60개 | 아래 |
| `diagram` | 선택. `{ view, caption(60자) }` | 슬라이드 아래에 놓는 추가 관계도 |
| `notes[]` | 확인하지 못한 것. 글 0~8개 | 80자 |
| `evidence[]` | 링크 목록 0~8개 | |
| `tasks[]` | 이 영역 화면에 같이 보일 다른 영역 카드의 ID. 0~30개 | `tasks.json`에 있어야 한다 |

`rows[]` 한 줄: `{ "what": 글(30자), "where": [{ "path": 프로젝트 경로, "symbols": [코드 이름] }], "how": 글(90자), "node": ["<view>:<구성 요소 id>"] }`

- `where`는 1~6개. `path`가 파일이면 `symbols`(0~12개, 각 80자, 한 줄)의 이름을 파일에서 찾는다. `Class::Method(args)`는 `::`로 나눈 조각이 모두 있으면 통과한다. 디렉터리이면 `symbols`는 비워야 한다. 줄 번호는 쓰지 않는다.
- `node`는 0~12개. 값은 설정한 view의 구성 요소 ID다. 구성 요소가 어느 책임 영역에 속하는지를 이 목록이 정한다. 관계도가 없으면 `[]`.
- 화면에 나오는 영역 이름은 `menu`, 본문 제목은 `headline`이다. 이 영역의 작업(칸반 카드)은 `tasks.json`의 `area`가 이 영역인 카드와 `tasks[]`에 적은 카드에서 자동으로 그려진다.

## pages/verification.json (검증 현황)

| 필드 | 값 | 한도 |
|---|---|---|
| `headline` | 글 | 50자 |
| `role` | 선택. 글 | 60자 |
| `points[]` | 글 1~5개 | 60자 |
| `verified[]` | `{ what, how, result, date, area, evidence, suite[] }` 0~60개 | |
| `notVerified[]` | `{ what, why, area, task }` 0~60개 | |

- `verified`: `what` 40자, `how` 100자, `result`는 `통과|부분|미실행|실패|재검증 필요|해당 없음`, `date` 날짜 또는 `null`, `area` 페이지 id, `evidence` 링크 또는 `null`, `suite` 시험 파일 경로 0~30개(있어야 한다).
- `notVerified`: `what` 40자, `why` 70자, `area` 페이지 id, `task` 카드 ID 또는 `null`.
- `area`로 쓸 수 있는 페이지 id: `overview`, `board`, `verification`, `decisions`, `basis`와 `areas`의 id.
- 이 화면에 시험 건수나 통과 수치를 쓰지 않는다. 그런 값은 근거 기록에 둔다.

## pages/basis.json (근거·신선도)

| 필드 | 값 | 한도 |
|---|---|---|
| `headline` | 글 | 50자 |
| `role` | 글 | 60자 |
| `points[]` | 글 1~5개 | 60자 |
| `sections[]` | `{ title(30자), lines[] }` 1~8개 | |

- `lines[]`는 1~10개. 항목은 글(160자) 또는 `{ "text": 글(100자), "href": 링크, "label": 글(30자) }`다. 명령줄을 넣는 `code` 필드는 없다(명령줄은 읽는 화면에 쓰지 않는다).
- 스냅샷 ID와 작성일은 이 화면 본문 위쪽에 템플릿이 한 줄로 넣는다. 직접 쓰지 않는다. 글 안에서 스냅샷 ID를 말해야 하면 이 화면(`basis.json`)의 글에서만 빌드가 계산한 ID를 쓸 수 있다. 다른 화면의 글에서는 해시처럼 보이는 문자열이므로 오류다.
- 미대조 변경은 여기에 사람이 읽는 말로 요약한다. 파일 전체 목록은 `sources.json`(링크 가능)과 `W/reconcile.json`에 둔다.

## pages/board.json (선택)

`{ "role": 글(60자), "decisionsHeadline": 글(50자), "decisionsRole": 글(60자) }`. 없으면 템플릿 기본 문구를 쓴다. 작업 보드 제목은 카드 수에서 자동으로 만들어진다.

## tasks.json (칸반 카드)

배열 0~200개. 한 카드:

```json
{
  "id": "SYNC-CONFLICT-01",
  "title": "충돌한 노트의 처리 방식",
  "area": "sync",
  "column": "blocked",
  "verify": "미실행",
  "criteria": "충돌한 노트가 정한 방식대로 하나로 합쳐지거나 나뉩니다.",
  "reason": "충돌한 노트는 최신 수정을 남길까요, 두 벌로 나눌까요?",
  "done": null,
  "deadline": null,
  "depends": ["SYNC-RETRY-01"],
  "evidence": null,
  "kind": "task"
}
```

| 필드 | 값 | 규칙 |
|---|---|---|
| `id` | 카드 ID | 중복 불가. 같은 목표를 새 ID로 만들지 않고 열만 옮긴다 |
| `title` | 글 40자 | 사용자에게 생기는 변화나 고칠 결함 |
| `area` | 페이지 id | |
| `column` | `proposal`(검토할 제안), `todo`(할 일), `doing`(진행 중), `blocked`(차단·결정 대기), `done`(완료) | 고정 5열. 열 정책은 템플릿에 있다 |
| `verify` | `통과|부분|미실행|실패|재검증 필요|해당 없음` | 부분 검증은 `done`이 아니다 |
| `criteria` | 글 90자 | 관찰할 수 있는 완료 기준 한 줄 |
| `reason` | 글 70자 또는 `null` | `blocked`이면 필수. 사용자 결정을 기다리면 정해야 할 질문을 물음표로 끝낸다. 물음표로 끝나는 `blocked` 카드는 `결정 대기`로 보인다 |
| `done` | 날짜 또는 `null` | `done` 열이 아니면 `null`. 완료 열에서는 최신순으로 정렬되어 최근 5건만 카드로 보이고 나머지는 한 줄 목록이다. 날짜를 모르면 `null` |
| `deadline` | 글 24자 또는 `null` | 외부 기한(예: 인증서 만료)만. 날짜로 시작해도 된다 |
| `depends[]` | 카드 ID 0~8개 | 자기 자신은 불가. 카드가 아닌 ID는 경고 |
| `evidence` | 링크 또는 `null` | 카드의 `근거` 링크 |
| `kind` | `task` 또는 `decision` | `decision` 카드는 `decisions.json`에 `task`가 이 카드 ID인 항목이 있어야 한다 |

진척은 열마다 카드 수로만 보인다. 백분율, 진행 막대, 예상 일정은 쓰지 않는다.

## decisions.json (결정 기록)

배열 0~200개, 날짜가 최신인 것부터(오름차순이면 오류). 한 항목: `{ "date": 날짜, "text": 글 90자, "why": 글 70자 또는 null, "area": 페이지 id, "task": 카드 ID 또는 null }`. 결정 경위와 대안 비교는 쓰지 않는다. 그런 내용은 근거 기록에 둔다.

## 금지 패턴

읽는 화면의 글에는 아래 패턴이 없어야 한다. 하나라도 있으면 오류이고 메시지에 패턴 이름과 값이 나온다. 코드 이름(`symbols`)과 경로는 대상이 아니다.

| 이름 | 막는 것 |
|---|---|
| `commit-like hex` | 커밋 해시처럼 보이는 숫자와 a-f가 섞인 7~40자 16진수. 단 `basis.json`의 글에서는 빌드가 계산한 스냅샷 ID를 허용한다 |
| `artifact task id` | 작업 디렉터리 이름(`name-20261017-a1` 꼴) |
| `test count` | `12/14` 꼴, `12 passed`, `시험 12건`, `12건 통과` 같은 시험 건수 |
| `em dash` | `—` |
| `circled number` | `①`~`⑳` |
| `emoji` | 이모지·그림 기호 |
| `bold markdown` | `**굵게**` |
| `backtick` | `` ` `` |
| `command line` | `bun run`, `git commit` 같은 도구+동작, `--flag` 꼴 |
| `work-log date lead` | 날짜로 시작하는 글(작업 일지 꼴). 날짜 칸이 따로 있는 필드는 날짜로 시작해도 된다 |
| `history disclaimer` | `승계하지 않`, `이력이며`, `이력입니다` |
| `middle-dot chain` | 가운뎃점으로 이은 명사 나열(`·` 3번 이상) |
| `arrow chain` | `→`를 3번 이상 이은 사슬 |

## 교차 점검

- 모든 `where.path`, `suite`, `repos.path`가 프로젝트에 있고, 파일의 `symbols`가 그 파일에 있다.
- 모든 `href`·`src`·`poster`가 위 「공통 규칙」대로 실제로 있다.
- 설정한 모든 view의 모든 구성 요소가 어느 한 영역의 `rows[].node`에 정확히 한 번 속한다(없거나 두 영역이 같이 쓰면 오류). `node` 값과 `diagram.focus`는 그 view에 있는 ID여야 한다.
- 카드·결정·검증 행이 가리키는 페이지 id와 카드 ID가 있다. `decision` 카드는 결정 항목과 연결된다. 카드 ID가 중복되지 않는다.
- 템플릿이 쓰는 글꼴 파일과 사용 허가서(`LINESeed-OFL.txt`, `JetBrainsMono-OFL.txt`)가 `stage/fonts/`에 있다.
- `W/reconcile.json`이 있다.

## W/reconcile.json (미대조 변경)

빌드 때 반드시 있어야 하는 파일이다. 신선도 입력 중 이번 갱신에서 지도와 대조하지 못한 변경을 적는다. 비어 있어도 파일은 있어야 한다. 작업 디렉터리에만 두고 `src`에는 쓰지 않는다. 빌드가 그대로 `build.json`의 `unreconciled`에 옮기고 게시가 `sources.json`에 기록한다.

```json
{
  "unreconciled": [
    { "path": "src/ui/Legacy*.ts", "reason": "다른 작업이 고치는 중이라 이번 대조에서 뺐습니다." },
    { "path": "../Server/src/**", "reason": "서버 저장소는 이 지도에서 대조하지 않았습니다." }
  ]
}
```

- `path`: 프로젝트 루트 기준 경로 또는 글롭(200자), `reason`: 글(300자). 두 키만 허용한다. 읽는 화면의 글이 아니므로 금지 패턴은 적용하지 않는다.
- 어떤 신선도 입력에도 맞지 않는 `path`는 경고다.
- 아무것도 빼지 않았으면 `{ "unreconciled": [] }`.

## W의 그 밖의 파일

빌드가 읽는 작업 디렉터리 파일은 `reconcile.json`뿐이다. `media.json`(시각 자료 출처), `BrowserGate.json`(브라우저 확인 결과), Archify finalize 요약, 게시 영수증의 형식은 `manifest.md`에 있다. 이 파일들은 `src`가 아니라 `W`에 두며, 빌드 점검의 대상이 아니다. 단 `BrowserGate.json`은 빌드가 쓴 `stageIndexSha256`과 `stageSha256`을 그대로 적어야 게시가 받아들인다. 빌드 뒤에 `stage/`의 어떤 파일(글 말고 이미지·영상·관계도·글꼴)이라도 바뀌면 이 값이 달라져 다시 빌드하고 다시 확인해야 한다.

## 예제

`examples/minimal/`은 작은 가상 프로젝트(노트 앱) 하나를 3개 영역으로 나눈 지도의 `stage` 그대로다: `src/`와 `media/overview.png`(단색으로 그린 예제 그림 한 장). 관계도는 없다(`views: {}`, 모든 `node`가 `[]`). init이 새 지도의 `stage`를 이 예제로 만들 때 `__PROJECT_NAME__`, `__PROJECT_LOGO__`, `__TODAY__`를 바꿔 넣는다. 예제의 `where` 경로와 글은 가상 프로젝트의 것이므로 실제 프로젝트에서는 모든 글과 경로를 현재 사실로 고쳐 써야 빌드가 통과한다.

고칠 때의 순서:

1. `map.config.json`을 프로젝트에 맞게 고친다(`areas`, `scope`, `links`).
2. 프로젝트의 책임 영역마다 `pages/<id>.json`을 쓴다. 예제 영역 파일(`storage`, `sync`, `ui`)은 해당 영역이 없으면 지우고 `areas`에서도 뺀다.
3. `tasks.json`, `decisions.json`, 검증·근거 화면을 현재 사실로 쓴다.
4. 빌드 오류를 읽고 해당 필드를 고친다.

## 자주 나는 오류

| 메시지 | 고치는 법 |
|---|---|
| `unknown key` | 그 키를 지운다. 메모는 `W`에 둔다 |
| `NN chars > MM` | 글을 줄인다. 두 줄이 넘는 제목, 한 줄이 넘는 요점은 문장을 나눈다 |
| `path does not exist in the project` | 경로를 실제 파일로 고친다 |
| `symbol X not found in <파일>` | 파일에서 정의를 다시 읽고 이름을 고친다 |
| `forbidden commit-like hex` 등 | 해당 값을 지우고 근거 기록으로 보낸다 |
| `expected null or a bare component id` | `focus`에 `view:` 접두사 없이 그 view의 구성 요소 ID를 쓰거나 `null`로 둔다 |
| `component V:N is not referenced by any row` | 그 구성 요소를 맡는 영역의 `rows[].node`에 추가한다 |
| `link target is not a file` | 링크를 고치거나 파일을 `stage/`에 둔다. 디렉터리는 안의 파일을 가리킨다 |
| `pattern "…" matches no input file` | `scope.include` 항목을 입력 파일에 맞게 고친다. 디렉터리는 `src/**`처럼 쓴다 |
| `reconcile.json: file is missing` | `W/reconcile.json`을 만든다 |

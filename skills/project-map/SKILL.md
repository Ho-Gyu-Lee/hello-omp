---
name: project-map
description: "`/project-map` 요청과 `프로젝트 지도: 유지` 선언 범위에서만 쓰고 단순 질문·읽기 전용 리뷰·미선언 프로젝트의 자동 생성에는 쓰지 않는다. 지속 프로젝트 지도(docs/project-map 등)를 hello-omp 공용 템플릿으로 만들고 고치고 게시하고 신선도를 확인하며, `/project-map status`는 읽기 전용이다. 관계도 그림 자체는 archify 스킬로 만든다."
---

# 프로젝트 지도 (project-map)

모든 프로젝트의 지도를 같은 배치·외형·글꼴로 만드는 공용 템플릿과 그 준비·빌드·게시·상태 확인 스크립트다. 무엇을 화면에 쓰는지(문장형 제목, 칸반 열, 근거 분리, 게시 전 점검)는 OKF `project-map-design.md`, 언제 갱신하고 어떻게 게시하는지는 OKF `project-navigation.md`가 정본이다. 전역 지침에 적힌 OKF 절대경로에서 두 문서를 먼저 읽는다.

## 경로

- `S`: 이 스킬의 설치 경로(`omp config path` 아래 `skills/project-map`). 명령의 `<S>`는 절대경로로 바꿔 쓴다.
- `R`: 프로젝트 루트(Git 작업 트리 루트). 다른 디렉터리를 주면 모든 스크립트가 멈춘다. 모노레포의 하위 프로젝트 지도도 저장소 최상위를 `R`로 두고 `M`과 `scope`를 그 기준으로 쓴다. 지도가 서브모듈·중첩 저장소·worktree 안에 있으면 그 저장소가 `R`이다. `M`: 지도 디렉터리(선언의 정본 위치, 보통 `docs/project-map`, `R` 기준 상대 경로). `M`의 이미 있는 구간은 디스크의 철자 그대로 쓴다. 대소문자나 Windows 8.3 짧은 이름이 다르면 모든 스크립트가 멈춘다(`references/manifest.md`의 경로와 링크).
- `W`: 작업 디렉터리 `R/.omp-artifacts/<작업-ID>/`. 후보·검증·영수증·메모를 모두 여기 둔다. 지우지 않는다.

## 구성

| 경로 | 내용 |
|---|---|
| `assets/template.html` | 공용 템플릿. 프로젝트마다 고치지 않는다 |
| `assets/fonts/` | LINE Seed Sans KR 400·700, JetBrains Mono 400, 각 OFL 사용 허가서, 출처와 원시 해시(`SOURCES.md`) |
| `scripts/init.ts` | 정본을 `W/before/`에 보존하고 후보 `W/stage/`를 만든다 |
| `scripts/build.ts` | `W/stage/src`를 검사하고 `W/stage/index.html`을 만든다 |
| `scripts/publish.ts` | 검증된 후보를 정본에 바이트 그대로 반영하고 `sources.json`을 쓴다 |
| `scripts/status.ts` | 정본과 작업 트리의 차이를 읽기 전용으로 보고한다 |
| `references/data-format.md` | `src/` 형식, 글 길이·금지 표기, 빌드 점검, `reconcile.json` |
| `references/manifest.md` | `sources.json` 형식, 게시가 멈추는 조건, 작업 디렉터리의 영수증 |
| `examples/minimal/` | 새 지도의 출발점(작은 가상 프로젝트). init이 복사한다 |

## 전제

- Bun. 관계도를 만들거나 바꾸려면 Node.js 18 이상과 Chrome/Chromium(archify 스킬의 전제)이 필요하다. 없으면 설치하지 않고 없는 전제를 보고하며, 관계도 없는 지도(`views: {}`)까지만 만든다.
- 게시 전 브라우저 확인에는 실제 브라우저가 필요하다. 확인하지 못하면 게시하지 않는다.

## status (읽기 전용)

```text
bun <S>/scripts/status.ts --project <R> --map <M>
```

입력 파일의 바뀜·추가·삭제, 게시 때 기록한 미대조 목록, 게시 파일의 누락·변경을 JSON으로 보고한다. 이 형식이 아닌 `sources.json`, 범위 검사에 걸리는 기록, 없는 형제 저장소는 `problems[]`로 보고하고 `fresh: false`가 된다. 파일을 쓰지 않는다(`--out <file>`을 주면 그 새 파일 하나만 쓴다). `fresh: true`는 지문이 같다는 뜻이지 내용이 맞다는 증명이 아니다.

## 만들기·고치기

1. **준비:** `bun <S>/scripts/init.ts --project <R> --map <M> --work <W> [--name <프로젝트 이름>]`. 정본을 `W/before/`에 그대로 보존하고(해시 목록은 `W/before.sha256.txt`) `W/stage/`에 후보를 만든다. 지도 디렉터리가 없거나 비어 있으면 `new`(`examples/minimal`로 만들고 이름·로고·날짜 자리표시자를 채운다), `src/map.config.json`이 있으면 `update`(전체 사본), 파일은 있는데 `src/map.config.json`이 없으면 `adopt`(전체 사본 + 스캐폴드의 `src/`만, 예제 그림은 직접 넣는다)다. `adopt`의 기존 관계도는 finalize 영수증이 없으므로 다시 finalize하거나, 사용자가 그대로 받아들이기로 하면 게시에 `--adopt`를 붙여 영수증 없음으로 기록한다. 글꼴은 스킬에서 `W/stage/fonts/`로 복사한다. `W/stage`가 이미 있거나 끊긴 init이 남아 있으면 멈추며, 그때는 새 `--work`로 다시 한다. 기존 `sources.json`이 병합 충돌 표식 등으로 읽히지 않거나 다른 버전·틀린 형식이면 아무것도 만들지 않고 멈춘다. 버전 관리의 이전 본이나 마지막 게시본으로 고친 뒤 다시 init한다. 고칠 수 없어 옮기면 이력이 처음부터 시작되므로 모든 관계도를 다시 finalize하고 모든 시각 자료의 출처를 `media.json`에 다시 적어야 게시된다. 프로젝트 `.gitattributes`에 `<M>/** -text`가 없으면 추가하고 사용자에게 알린다. 없으면 Windows의 `core.autocrlf`가 체크아웃 때 지도 파일의 줄 끝을 바꿔 `status`가 변경으로 보고한다(`eol=lf`는 PNG·WOFF2를 깨뜨리므로 쓰지 않는다).
2. **내용:** 실제 코드·설정을 읽고 `W/stage/src/`를 `references/data-format.md` 형식으로 고쳐 쓴다. 새 지도면 예제의 글·경로·영역을 모두 실제 내용으로 바꾼다. 화면에 그리지 않는 메모·근거 수치·해시는 `src/`가 아니라 `W`에 둔다. 스크린샷·GIF·영상은 `W/stage/media/`에 두고 촬영 근거와 그 파일의 원시 `sha256`을 `W/media.json`에 적는다(`references/manifest.md`).
3. **관계도:** archify 스킬로 `W/archify/<view>/<revision>/`에서 후보 JSON을 쓰고 `finalize architecture "<후보.json>" "<W>/archify/<view>/<revision>/<view>.html" --quality showcase --json --out-dir "<W>/archify/<view>/<revision>"`로 검증한다. 출력 이름이 `<view>.html`이어야 publish가 영수증 `<view>.finalize-summary.json`을 찾는다. 모든 gate를 통과한 후보 JSON과 출력 HTML만 `W/stage/<view>.architecture.json`과 `W/stage/<view>.html`로 바이트 그대로 복사하고, `map.config.json`의 `views`에 이름을 적는다. 관계도의 모든 노드는 정확히 한 영역의 `rows[].node`가 가리켜야 한다. 생성된 관계도 HTML은 고치지 않는다(관계도 글꼴은 Archify 내장 글꼴이다).
4. **미대조 변경:** 이번 갱신에서 지도와 대조하지 못한 변경을 `W/reconcile.json`에 적는다(없으면 빈 목록). 빌드가 반드시 읽는다.
5. **빌드:** `bun <S>/scripts/build.ts --project <R> --map <M> --work <W>`. 오류가 0이 될 때까지 `src/`를 고친다. 오류가 있으면 아무 파일도 쓰지 않는다. 통과하면 `W/build/build.json`에 진입점 해시(`stageIndexSha256`)와 stage 전체 해시(`stageSha256`)가 남는다.
6. **브라우저 확인:** `W/stage/index.html`을 최대화한 실제 브라우저에서 연다. 모든 화면, 검색, 노드 이동(`?node=`), 이미지·영상, 글꼴 로드, 가로 넘침, 지도 안 상대 링크를 확인하고 OKF `project-map-design.md`의 게시 전 점검을 한다. 지도 밖을 가리키는 링크는 stage 위치에서 열리지 않으므로 빌드의 존재 검사로 확인한다. 점검 8번(맥락 없는 검토자)은 새 지도를 처음 게시하거나 화면 구조를 크게 바꿀 때만 fresh-context 검토자에게 맡긴다. 통과하면 `W/BrowserGate.json`에 `{ "passed": true, "entrySha256": "<build.json의 stageIndexSha256>", "stageSha256": "<build.json의 stageSha256>", "scope": "<확인한 범위>" }`를 쓴다. 빌드를 다시 하거나 stage의 파일을 하나라도 바꾸면 빌드와 이 확인을 다시 한다.
7. **게시:** `bun <S>/scripts/publish.ts --project <R> --map <M> --work <W> [--adopt]`. 지도마다 하나인 잠금 파일(`R/.omp-artifacts/project-map-publish-*.lock`)을 잡은 뒤 빌드·브라우저 확인·관계도 finalize 영수증·시각 자료 출처가 지금의 stage 바이트와 맞는지, init 뒤에 정본이 바뀌지 않았는지, 이전 `sources.json`이 읽히는지 먼저 모두 확인하고, 하나라도 어긋나면 아무것도 쓰지 않고 멈춘다. 멈춘 이유는 `references/manifest.md`의 표에 있다. init 뒤에 `sources.json`이 깨졌으면 고치거나 옮긴 다음 새 `--work`로 init부터 다시 한다. `--adopt`는 다른 도구가 만든 지도에만 쓴다. 정본 `index.html`에 공용 템플릿 표식(`<meta name="project-map-template">`)이 있으면 이 스킬로 게시한 지도이므로 `--adopt`가 거부된다. 그때는 `sources.json`을 버전 관리나 마지막 게시본에서 되살린 뒤 새 `--work`로 다시 하고, 되살릴 수 없으면 이력을 처음부터 시작한다(모든 관계도를 다시 finalize하고 모든 시각 자료를 `media.json`에 적는다). 잠금이 남아 멈추면 잠금에 적힌 pid·작업 디렉터리로 그 게시가 실제로 실행 중인지 확인한다. 실행 중이 아니면(강제 종료된 실행의 잔재) 사용자에게 알리고, 사용자가 동의한 뒤에만 잠금 파일을 치우고 다시 게시한다. 영수증 `W/publication-<n>.json`을 남기고 `sources.json`을 마지막에 쓴다. 정본 파일을 지우지 않으며, 후보에 없는 정본 파일은 남겨 두고 보고한다.
8. **확인과 보고:** 게시 뒤 `status`가 깨끗한지 확인하고, 진입점·바뀐 영역·검증·남은 미대조 변경을 보고한다.

같은 `W`에서 다시 고칠 때는 2–7을 반복한다. 게시 번호가 올라간다. 다른 세션이 정본을 바꿔 게시가 멈추면 덮어쓰지 않고 새 작업 디렉터리에서 다시 init해 통합한다.

## 바꾸지 않는 것

- `index.html`과 `sources.json`은 스크립트만 쓴다. 손으로 고치면 다음 게시가 멈춘다.
- 배치·외형·글꼴·상태색의 의미는 모든 프로젝트가 같다. 프로젝트의 색은 사용자가 요청할 때만 `map.config.json`의 `tokens`로 바꾼다. 템플릿 자체를 바꾸는 일은 hello-omp 레포의 이 스킬에서 하고 모든 지도에 함께 적용한다(OKF `project-map-design.md`의 디자인 절).
- 검사를 통과시키려고 금지 패턴·길이 한도·노드 연결 검사를 끄거나 피해 가지 않는다. 글을 고친다.

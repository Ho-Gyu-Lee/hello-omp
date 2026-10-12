---
name: knowledge-sync
description: hello-omp 설정 레포의 원격 변경(공유 지식·OMP 설정·지침·명령·확장·스킬)을 받아 로컬에 적용한다. 사용자가 원격에 새 지식이나 갱신이 있다고 확인하고 받아서 적용해 달라고 요청할 때만 사용한다(예 "원격 지식 받아서 적용해 주세요", /skill:knowledge-sync). fetch, 미커밋 작업 백업과 stash, upstream merge(충돌은 근거로 병합, 로컬 merge 커밋만, push 없음), stash 복원, setup 전체 실행, 로컬 지식·설정 검증 순서로 진행한다. 단순 질문·리뷰·다른 저장소에는 쓰지 않는다.
---

# 원격 지식 받기 (knowledge-sync)

사용자가 원격 레포에 새 지식이나 갱신이 있다고 확인하고 받아서 적용해 달라고 할 때만 실행합니다. 결과는 한국어로 보고합니다.

## 대상과 금지 사항

- **레포 `R`:** 전역 지침의 OKF 관리 소스 절대경로(`…/okf`)의 상위 디렉터리입니다. 사용자가 다른 클론 경로를 지정하면 그 경로를 씁니다. `git -C R rev-parse --show-toplevel`이 `R`과 같은 경로를 가리키지 않으면 중단합니다.
- **설정 폴더 `C`:** `omp config path`의 출력입니다. 로컬 지식은 `C/okf/learned/`에 있고 레포 밖입니다. 이 스킬은 로컬 지식을 읽고 백업하고 검증만 하며 수정하지 않습니다.
- **작업 디렉터리 `W`:** `R/.omp-artifacts/knowledge-sync-<UTC yyyymmddTHHMMSSZ>-<4자리 hex>/`입니다. 백업·로그·검증 결과를 모두 여기에 남기고 지우지 않습니다.
- **금지:**
  - 원격 반영: `push`·`rebase`·`--force`.
  - 작업 내용 폐기: `reset --hard`·`clean`·`checkout -- .`·`restore .`.
  - 한쪽 버전 통째 선택: `-X ours/theirs`, 양쪽 내용을 읽지 않은 파일 전체 `checkout --ours/--theirs`.
  - 검사 우회: `--no-verify`·`--no-gpg-sign`. 사용자가 명시적으로 승인한 경우만 예외입니다.
- **예외로 허용하는 명령:** 아래 4단계 조건을 만족할 때 이 실행이 만든 stash 한 개의 `git stash drop`만 허용합니다.
- **ref 표기:** `@{u}`, `stash@{n}` 같은 ref는 작은따옴표로 감쌉니다. PowerShell이 `@{`를 해시 리터럴로 해석하기 때문입니다. upstream은 1단계에서 전체 ref 이름(`refs/remotes/origin/main` 등)으로 확정한 뒤 그 이름(`U`)을 씁니다.

## 0. 준비

1. `W`를 만듭니다.
2. `C/skills/knowledge-sync/scripts/sync-check.ts`를 `W/sync-check.ts`로 복사합니다. 이후 검사는 모두 `bun W/sync-check.ts …`로 실행합니다. setup이 실행 도중 스킬을 새 버전으로 바꿔도 같은 버전으로 전후를 비교하기 위해서입니다.

## 1. 사전 점검 (아무것도 바꾸지 않음)

1. `git -C R symbolic-ref -q HEAD`가 실패하면(detached HEAD) 중단합니다.
2. `git -C R rev-parse --symbolic-full-name '@{u}'`로 `U`를 정합니다. upstream이 없으면 중단합니다.
3. `git -C R status`를 확인합니다. 병합·rebase·cherry-pick·revert·bisect가 진행 중이거나 unmerged path가 있으면 중단합니다.
4. 다음 정보는 보고에 포함합니다.
   - `git -C R config --get commit.gpgSign`과 `git -C R config --get core.hooksPath`: merge 커밋이 서명이나 hook 때문에 사용자 입력을 기다릴 수 있음을 미리 알리기 위해서입니다.
   - `git -C R stash list`를 `W/stash-list-before.txt`에 남깁니다. 기존 stash가 있으면 내용만 `git -C R stash show --include-untracked -p '<ref>'`로 확인해 보고하고 적용·삭제하지 않습니다. 공개 반영분이 들어 있으면 이 실행을 마친 뒤 사용자가 확인하면 별도로 처리합니다.
5. `git -C R fetch --prune`.
6. `git -C R log --oneline HEAD..U`가 비어 있으면 받을 변경이 없습니다. 이때는 적용이 끝난 상태인지 확인합니다.
   - `bun W/sync-check.ts is-applied R C`가 성공하면 같은 HEAD를 같은 설정 폴더 `C`에 적용한 기록이 있는 것입니다. "받을 변경 없음, 적용 완료"를 보고하고 끝냅니다. 한 clone을 여러 OMP 프로필(설정 폴더)에 적용할 수 있으므로 HEAD만 같고 설정 폴더가 다른 기록은 인정하지 않습니다.
   - 실패하면 이전 실행의 setup이 실패했거나, 직접 pull한 뒤 setup을 실행하지 않았거나, 이 설정 폴더에 이 스킬을 처음 쓰는 경우입니다. 7·8은 건너뛰고 9·10을 기록한 뒤 2–5단계 없이 6·7단계로 적용과 검증을 마칩니다.
7. 받을 변경과 로컬 상태를 기록합니다.
   - 받을 변경 `git -C R diff --name-status HEAD...U`를 `W/incoming.txt`에, 아직 push하지 않은 로컬 커밋 `git -C R log --oneline U..HEAD`를 `W/unpushed.txt`에 남깁니다.
   - `git -C R rev-parse HEAD`를 `W/pre-head.txt`에 남깁니다.
8. 병합이 로컬 파일을 덮어쓰지 않는지 확인합니다. 하나라도 걸리면 병합하지 않고 중단합니다. 해당 경로와 커밋을 보고하고 사용자에게 확인합니다.
   - 로컬 지식 경로: `git -C R diff --name-only --diff-filter=A HEAD...U -- okf/learned`에 `okf/learned/index.md` 외의 파일이 있으면 중단합니다. 로컬 지식은 레포에 커밋하면 안 되는 파일입니다.
   - 로컬 파일 충돌: `bun W/sync-check.ts incoming-collisions R U`가 실패하면 중단합니다. 원격이 추가하는 경로가 이미 로컬에 추적되지 않는 파일(무시 파일 포함)로 있는 경우입니다. `git merge --no-overwrite-ignore`는 fast-forward에서만 무시 파일을 지키고 일반 병합에서는 조용히 덮어쓰므로 이 검사가 필요합니다.
9. `omp config list --json` 출력을 `W/config-before.json`에 저장합니다.
10. `bun W/sync-check.ts snapshot C R W`로 로컬 지식을 해시하고 복사합니다. 실패하면 중단합니다.

## 2. 미커밋 작업 보관

`git -C R status --porcelain`이 비어 있으면 건너뜁니다.

1. 먼저 백업합니다: `bun W/sync-check.ts save-worktree R W`. `W/worktree.patch`(staged와 unstaged, 바이너리 포함), `W/index.patch`(staged만), `W/untracked/`가 생깁니다.
2. `git -C R rev-parse -q --verify refs/stash`의 값을 `S0`로 둡니다(없으면 빈 값).
3. `git -C R stash push --include-untracked -m "<W 이름>"`. `W` 이름은 `knowledge-sync-`로 시작하므로 그대로 메시지로 씁니다.
4. `git -C R rev-parse -q --verify refs/stash`를 `S1`로 둡니다. 다음 둘을 모두 만족해야 `S1`을 이 실행의 stash(`S`)로 씁니다. 하나라도 어긋나면 중단하고 `W`의 백업 위치를 보고합니다.
   - `S1`이 `S0`와 다릅니다.
   - `git -C R log -1 --format=%s S1`에 위 메시지가 들어 있습니다.
5. `git -C R status --porcelain`이 비어 있지 않으면 병합하지 않고 중단합니다. Windows에서 잠긴 파일이 남은 경우 등이며, 남은 파일과 `S`, 백업 위치를 보고합니다.

## 3. 병합

`git -C R merge --no-overwrite-ignore --no-edit --ff U`

`--ff`는 가능하면 fast-forward하고 아니면 merge 커밋을 만듭니다. 사용자 설정 `merge.ff`와 `pull.rebase`에 영향받지 않습니다. `--no-overwrite-ignore`는 fast-forward에서만 무시 파일을 지키므로, 무시 파일 보호는 1단계 8의 충돌 검사가 맡습니다.

결과별 처리:

- **성공:** 종료 코드 0이고 `git -C R merge-base --is-ancestor U HEAD`가 성공하면 4단계로 갑니다.
- **무시 파일 충돌로 거부:** 출력에 덮어쓸 파일 목록이 나오고 HEAD가 바뀌지 않았으면 아무것도 바뀌지 않은 상태입니다. 목록을 보고하고 4단계로 stash만 복원한 뒤 끝냅니다. setup은 실행하지 않습니다.
- **충돌:** `git -C R diff --name-only --diff-filter=U`에 파일이 있으면 5단계 규칙으로 파일마다 해소합니다. 그다음:
  1. 해소한 파일을 `git add`합니다.
  2. `git -C R diff --cached --check` 출력에 `leftover conflict marker` 줄이 없어야 합니다. 공백 경고(trailing whitespace 등)는 원격·고정 배포본에서 온 것일 수 있으므로 실패로 보지 않고 고치지도 않습니다.
  3. `bun R/scripts/validate-okf.ts R/okf`와 `bun W/sync-check.ts links R/okf`가 통과해야 합니다.
  4. `git -C R commit --no-edit`.
  - 근거로 판단할 수 없는 충돌이 있으면 두 버전과 추천안을 사용자에게 보여 주고 결정을 받습니다. 사용자가 답하지 않거나 중단을 원하면 `git -C R merge --abort` 뒤 4단계로 stash를 복원하고 보고합니다. setup은 실행하지 않습니다.
- **커밋 실패(hook·서명):** `git -C R rev-parse -q --verify MERGE_HEAD`가 성공하고 HEAD는 그대로인 상태입니다. 우회하지 않습니다(`--no-verify`·`--no-gpg-sign` 금지). 출력으로 원인을 구분해 보고합니다.
  - 서명 실패(`gpg failed to sign`, `failed to write commit object` 등): `git -C R merge --abort`를 제안합니다. 서명 설정을 바꾸는 것은 사용자가 결정합니다.
  - hook 실패: hook 출력을 보여 주고 "hook 원인을 고친 뒤 `git -C R commit --no-edit`"와 "`git -C R merge --abort`" 중 사용자의 선택을 받습니다.
  - 이후 진행: 커밋이 성공하면 4·6·7단계로 갑니다. `merge --abort`를 고르면 4단계로 stash만 복원하고 끝나며 setup은 실행하지 않습니다. 결정 전에는 stash를 복원하거나 setup을 실행하지 않고 `S`와 상태를 보고합니다.

## 4. 미커밋 작업 복원

`S`가 없으면 건너뜁니다.

1. `git -C R stash apply --index S`. staged와 unstaged 구분까지 그대로 복원합니다.
2. 충돌 없이 끝났으면 `git -C R stash list --format="%gd %H"`에서 `S`의 ref를 바로 직전에 다시 찾아 `git -C R stash drop '<그 ref>'` 합니다.
3. `--index` 적용이 index 충돌로 실패하면 `git -C R stash apply S`로 작업 트리만 다시 적용합니다. 이 경우 stash는 지우지 않고 남겨 보고합니다. staged 상태는 `W/index.patch`에 남아 있습니다.
4. 충돌이 나면 5단계 규칙으로 해소합니다. 결과는 커밋하지 않습니다. 해소한 파일은 `git add`로 해소를 표시한 뒤 `git -C R restore --staged -- <파일>`로 다시 미스테이징합니다. 이 경우에도 stash는 지우지 않고 남겨 두며, 사용자가 확인한 뒤에만 지웁니다.
5. 적용 자체가 실패하면(예: untracked 파일이 이미 있다는 오류) 강제로 덮어쓰지 않습니다. `S`와 `W/worktree.patch`·`W/index.patch`·`W/untracked/` 위치를 보고하고 사용자에게 맡깁니다.

## 5. 충돌 해소 규칙

먼저 근거를 모읍니다.

- 세 버전: `git -C R show :1:<path>`(공통 조상), `:2:`(로컬), `:3:`(원격).
- 양쪽 이력: `git -C R log --format="%h %s" <merge-base>..HEAD -- <path>`, `<merge-base>..U -- <path>`.
- 양쪽의 `okf/log.md` 항목.

한쪽 버전을 통째로 택하지 않습니다. 두 변경이 같을 때만 예외입니다.

**OKF 본문**
- **추가:** 서로 다른 곳에 추가된 내용은 모두 남깁니다.
- **같은 문장을 다르게 고침:** 확인일·출처·버전 같은 근거가 새롭거나 강한 쪽 문장을 택합니다. 다른 쪽에만 있는 사실은 근거가 유효할 때 보존합니다. 근거로 정할 수 없으면 사용자에게 묻습니다.
- **삭제와 정정:** 삭제는 의도로 취급합니다. 삭제한 쪽의 커밋 메시지와 `log.md` 항목에서 사유를 확인합니다.
  - 정정이나 대체(틀리거나 낡은 전제 제거)라면 삭제를 따릅니다. 다른 쪽 변경 가운데 새 사실만 남은 본문으로 옮깁니다.
  - 사유를 알 수 없으면 사용자에게 묻습니다. 한쪽이 지운 태그도 다시 넣지 않습니다.
- **이동·분할과 수정이 겹침:** 양방향 모두 같은 규칙입니다. 옮기거나 나눈 쪽의 `log.md`·index·커밋에서 새 위치를 찾고, 다른 쪽 수정분을 그 절을 가진 개념으로 옮깁니다. 새 위치를 찾지 못하면 사용자에게 묻습니다.

**OKF 관리 파일**
- **`okf/log.md`:**
  - 최상위 항목 하나와 그 아래 들여쓴 줄을 한 단위로 다룹니다.
  - 날짜 제목은 날짜마다 하나이고 최신 날짜를 위에 둡니다. 같은 날짜에서는 원격(이미 push된) 항목을 먼저, 로컬 항목을 뒤에 둡니다.
  - 양쪽이 같은 항목을 고쳤으면 두 벌로 남기지 않고 한 항목으로 합칩니다.
- **`index.md`:** 양쪽에서 추가한 줄을 모두 유지합니다. 같은 개념 줄을 양쪽이 고쳤으면 병합된 개념과 같은 범위를 설명하도록 고칩니다. frontmatter `description`과 문구를 똑같이 맞출 필요는 없으며, 선택용 키워드는 보존합니다.
- **frontmatter:**
  - `type`·`title` 충돌은 근거로 정하고, 정할 수 없으면 묻습니다.
  - `description`은 병합된 본문 범위에 맞게 다시 씁니다.
  - `tags`는 어느 쪽도 지우지 않은 태그의 합집합입니다.
  - `timestamp`는 늦은 값입니다.

**설정·코드**
- **`config/settings.conf`:** 같은 키를 양쪽이 다른 값으로 바꿨거나, 한쪽이 키를 지우고 다른 쪽이 값을 바꿨으면 결정 충돌입니다. 지운 쪽의 커밋 메시지와 `log.md`에서 사유를 확인하고, 두 안과 추천안을 보여 주고 사용자에게 묻습니다. 다른 키의 변경은 모두 유지합니다.
- **고정 배포본:** `skills/archify/**`처럼 `UPSTREAM.md`로 고정한 배포본은 병합하지 않고, 고정 정보가 가리키는 쪽 전체를 택합니다. 고정 정보 자체가 충돌하면 묻습니다.
- **코드·스크립트·setup:** 양쪽 의도를 모두 반영합니다. 바꾼 TypeScript는 `bun build <파일> --target=bun --outdir W/build-check`로 구문을 확인합니다.

해소를 마친 뒤에는 자동 병합된 파일도 포함해 `validate-okf`와 `links` 검사를 다시 통과해야 합니다.

## 6. 적용 (setup 전체)

병합(fast-forward 포함)이 성공했거나, 1단계 6에서 적용이 끝나지 않은 상태를 확인했을 때만 실행합니다. setup은 OKF만이 아니라 OMP 설정과 배포물 전체를 적용합니다.

- **실행:**
  - macOS/Linux: `R`에서 `sh setup.sh`.
  - Windows: PowerShell에서 `& 'R\setup.ps1'`. 실행 정책이 막으면 `powershell -NoProfile -ExecutionPolicy RemoteSigned -File 'R\setup.ps1'`로 실행합니다. 이 실행 정책은 그 프로세스에만 적용됩니다.
- **출력:** `W/setup.log`에 남기고, 멈춘 단계(`[n/8]`)를 확인합니다.
- **사전 점검 뒤 단계에서 멈춘 경우:** setup은 트랜잭션이 아니므로 그 전 단계는 이미 적용된 상태입니다. 예를 들어 `[1/8]`에서 `Invalid value`로 멈추면 그 앞의 설정 키는 이미 바뀌었습니다. 오류 줄을 그대로 보고하고, 병합 커밋과 복원된 작업은 그대로 둡니다.
  - 원격의 잘못된 값이 원인이면 원격에서 고친 뒤 다시 받도록 안내합니다. 로컬에서 값을 임의로 고치지 않습니다.
  - 로컬 원인(복원한 미커밋 concept의 유효성 오류, Windows 파일 잠금 등)이면 원인을 고친 뒤 같은 실행에서 setup을 새 로그(`W/setup-2.log` 등)로 다시 실행하고 7단계로 갑니다.
  - setup이 끝나지 않아도 7단계의 `verify`는 실행해 로컬 지식을 확인합니다. 적용을 마치지 못하면 완료 기록(`W/applied.json`)을 남기지 않으므로, 다음 실행이 1단계 6에서 setup을 다시 수행합니다.
- **사전 점검에서 멈춘 경우:** `deploy-okf --check`에서 멈췄으면 아무것도 바뀌지 않았습니다. 다음은 메시지를 따르되, 어느 쪽을 남길지는 사용자에게 묻습니다.
  - 로컬 지식 이전 충돌: 레포 사본과 설정 폴더 사본이 다른 경우입니다.
  - 로컬 지식 유효성 오류.
  - 이전 setup이 지운 흔적: 이 경우 메시지의 `--restore`를 제안합니다.
- **단계별 의미:**
  - 1: `config/settings.conf` 적용.
  - 2: 전역·advisor 지침.
  - 3: 공개 OKF(로컬 `learned/` 보존).
  - 4–7: 확장·에이전트·명령·스킬.
  - 8: 원격에서 지운 관리 항목 정리와 설정값 검증. 지운 설정 키는 `omp config reset`, 지운 파일·스킬은 `C/.managed-retired-<stamp>/`로 이동합니다. 로컬에서 고친 사본은 그대로 두고 경고합니다.

## 7. 검증

1. `bun W/sync-check.ts verify W`가 모든 로컬 지식 파일을 `intact`로 보고해야 합니다.
   - `missing`과 `changed`는 덮어쓰거나 자동 복원하지 않고 경로와 스냅샷 사본 위치를 보고합니다. setup은 로컬 지식을 지우지 않으므로, 실행 중에 다른 세션이 지우거나 고쳤을 수 있습니다.
   - 사용자가 복원을 확인한 경우에만 `bun W/sync-check.ts verify W --restore-missing`으로 없는 파일을 복원합니다. 기존 파일은 덮어쓰지 않습니다. 그다음 다시 확인합니다.
2. setup 출력에서 다음을 확인하고 보고합니다.
   - `[8/8]`의 `warning:` 줄과 `settings verified: n/m`. `n`이 `m`보다 작으면 경고 줄을 그대로 보고합니다.
   - `retired` 항목.
3. `omp config list --json`을 `W/config-after.json`에 저장하고 `bun W/sync-check.ts config-diff W/config-before.json W/config-after.json`으로 바뀐 설정을 확인합니다.
4. 레포 상태를 확인합니다.
   - `git -C R status`와 `git -C R log --oneline -3`.
   - `git -C R stash list`가 `W/stash-list-before.txt`와 같은지 확인합니다. 차이는 남겨 둔 이 실행의 stash 하나뿐이어야 합니다.
5. setup 출력에 `[8/8]`의 `settings verified:` 줄이 있고(setup이 끝까지 실행됨) 1의 `verify`에 `missing`·`changed`가 없으면 `bun W/sync-check.ts mark-applied R C W`로 현재 HEAD와 설정 폴더 `C`의 실제 경로를 `W/applied.json`에 남깁니다. `[8/8]`의 경고는 보고하되 이 기록을 막지 않습니다. 다음 실행은 이 기록으로 같은 설정 폴더에 적용이 끝났는지 판단합니다.

## 8. 보고

다음을 한국어로 보고합니다.

- **받은 변경:** 커밋 수, 그리고 영역별 파일 목록입니다. 영역은 `okf/`, `rules/`, `config/`, `skills/`, `extensions/`, `commands/`, `agents/`, `scripts/`, `setup.*`입니다.
- **충돌:** 충돌 파일마다 무엇을 근거로 어떻게 해소했는지 적고, 사용자가 결정한 항목은 따로 표시합니다.
- **병합 결과:** fast-forward였는지 로컬 merge 커밋을 만들었는지 적습니다. merge 커밋이면 sha를 적습니다. push는 하지 않았으며, 사용자가 확인한 뒤 직접 push합니다.
- **미커밋 작업:** 복원 결과와 stash를 남겼는지 적습니다.
- **로컬 지식:** 검증 결과(파일 수, 이상 유무)와 백업 위치 `W/learned-backup/`를 적습니다.
- **설정과 배포:** 바뀐 설정 키, 정리(retire)된 항목, setup 경고를 적습니다.
- **적용 시점:** `rules/`나 `okf/`가 바뀌었으면 새 OMP 세션부터 적용된다고 알립니다. 이미 열려 있는 세션은 이전 지침을 계속 씁니다.
- **증거 위치:** 작업 디렉터리 `W`를 적습니다.

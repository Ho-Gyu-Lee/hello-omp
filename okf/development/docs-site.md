---
type: Checklist
title: 문서 사이트의 짝 문서 일치와 Docusaurus 버전·번역·빌드 계약
description: 플랫폼별·언어별로 나뉜 문서 세트를 함께 고치고 대조하는 기준과, Docusaurus 2.4.3에서 공개되는 폴더 확인, 버전 스냅샷이 번역 current를 복사하는 동작, 번역 파일 짝 맞추기(Windows 대소문자 경로 포함), write-translations 부수 효과, 버전 없는 절대 링크와 앵커 미검사, draft 숨김 확인, MDX 1 주석 빌드 실패, build와 start의 생성 폴더 공유를 다룹니다. Docusaurus 문서를 고치거나 버전·번역을 만들 때 읽습니다.
tags: [documentation, docusaurus, i18n, versioning, build]
apply_on_edit: ["docusaurus.config*.js", "docusaurus.config*.ts", "_category_.json"]
timestamp: 2026-11-13T00:00:00Z
---

# 문서 사이트의 짝 문서 일치와 Docusaurus 버전·번역·빌드 계약

문서의 동작 설명은 [워크플로](/workflow.md)대로 구현 코드로 확인합니다. Docusaurus 항목은 2.4.3(MDX 1)에서 관찰한 동작이며(2026-11), 다른 메이저 버전에서는 다시 확인합니다.

## 짝 문서의 일치

- [ ] 같은 기능을 플랫폼별(예: Unity·Unreal SDK)로 나눈 문서 세트는 함수명·문법·플랫폼 사용법 같은 표기 차이와 실제 동작 차이를 빼면 같은 내용을 담습니다. 한쪽을 고치면 짝 문서(시작하기·설치·마이그레이션 가이드·업데이트 노트 포함)를 함께 고칩니다(사용자 교정). 번역판과 버전 스냅샷을 이번 변경에 포함할지는 요청마다 다를 수 있으므로 요청에서 정해지지 않았으면 확인합니다.
- [ ] 짝 문서는 파일 쌍마다 코드 블록 밖 문장과 코드 블록 안 주석을 따로 뽑아 `git diff --no-index`로 비교합니다. 남은 차이는 표기 차이나, 각 구현의 코드로 확인한 동작 차이 중 하나로 설명할 수 있어야 합니다.
- [ ] 번역판 동기화는 공개 버전 목록만 맞추지 않고 공개 버전마다 원문 스냅샷과 파일 대응·구조(코드 블록·링크·이미지·목록·표·안내 상자 수)를 대조합니다. 같은 주제를 다루는 다른 문서 세트도 함께 봅니다.

## 공개 버전과 번역

- [ ] 고치기 전에 사이트가 공개하는 폴더를 확인합니다. docs 플러그인이 `includeCurrentVersion: false`이면 원문 current(기본 `docs/`)를 고쳐도 사이트에 나타나지 않고, 공개되는 것은 버전 스냅샷(`versioned_docs/version-<ver>`, 기본 외 플러그인은 `<id>_versioned_docs/version-<ver>`)입니다. 로케일별 설정 파일의 `onlyIncludeVersions`가 공개 버전을 따로 정할 수 있습니다.
- [ ] `docusaurus docs:version[:<id>] <ver>`는 원문 docs와 함께 모든 `i18n.locales`의 번역 current(`i18n/<locale>/docusaurus-plugin-content-docs[-<id>]/current`)도 같은 위치의 `version-<ver>`로 복사합니다. 번역 current가 최신 번역과 다르면 새 버전의 번역판이 옛 번역이 되고, 이전 버전의 번역판은 그 버전을 만들 때의 번역 current라 원문 스냅샷보다 낡았을 수 있습니다. 번역 current를 최신 번역과 같게 유지하고, 버전을 만든 뒤 복사된 번역판이 원문과 맞는지 확인합니다.
- [ ] 번역 파일은 원문과 같은 상대 경로·파일 이름일 때만 쓰입니다. 이름이 맞지 않는 번역 파일은 오류 없이 무시되고 짝이 없는 문서는 원문 언어로 나오므로, 원문의 번호·이름을 바꾸면 번역 파일도 `git mv`로 맞춥니다. 번역 파일에만 있는 `draft: true`는 그 언어에서만 문서를 숨기고 그 문서로 가는 링크를 깨뜨립니다. 사이드바 분류 라벨은 번역 JSON(`<current|version-<ver>>.json`)에 `sidebar.<sidebarId>.category.<원문 라벨>` 키가 없으면 `_category_.json`의 원문 라벨이 그대로 나옵니다.
- [ ] 인덱스에 대소문자만 다른 경로(예: `02-Android/`와 `02-android/`)가 함께 있으면 Windows 작업 트리에서는 한 폴더로 합쳐지고, 새 파일을 `git add`하면 디스크 쪽 대소문자로 기록되어 대소문자를 구분하는 배포 빌드에서 원문 경로와 짝이 맞지 않습니다. 새 파일 경로를 `git ls-files`의 원문 경로와 대조하고, 다르면 잘못 올린 정확한 경로를 `git update-index --force-remove -- <잘못된 경로>`로 인덱스에서 빼고 `git hash-object -w <파일>`로 얻은 해시를 `git update-index --add --cacheinfo 100644,<해시>,<원문과 같은 대소문자 경로>`로 올립니다. `--cacheinfo`는 항목을 추가할 뿐 이름을 바꾸지 않아 빼지 않으면 두 경로가 모두 커밋됩니다. 마지막에 `git ls-files`에서 그 파일이 올바른 경로 하나로만 남았는지 확인합니다(`core.ignorecase=true`에서도 `--force-remove`는 지정한 대소문자의 항목만 뺐음, Git 2.56.1.windows.1 관찰 2026-11-13).
- [ ] `docusaurus write-translations --locale <locale>`은 없는 키를 원문 기본값으로 채우고 기존 번역을 덮어쓰지 않지만, `code.json`·`navbar.json`·`footer.json`·블로그 `options.json`의 description과 줄바꿈도 바꿉니다. 필요한 파일만 남기고 나머지 변경은 되돌립니다.

## 링크와 숨김

- [ ] 버전 경로 없는 절대 링크(`/<docs 경로>/<route>`)는 항상 최신 버전으로 갑니다. 새 버전에서 없애거나 draft로 숨긴 라우트를 이전 버전 문서나 블로그 글이 이렇게 가리키면 404가 됩니다. 버전을 만들 때 새 버전에서 사라지는 라우트를 구해 이전 버전·블로그의 링크를 버전 경로나 새 대응 문서로 고칩니다.
- [ ] `onBrokenLinks: 'log'`이면 깨진 링크가 빌드를 실패시키지 않고 로그에만 남으며, 빌드는 앵커를 검사하지 않습니다. 작업 전 기준 빌드의 깨진 링크 목록과 비교하고, 앵커는 대상 문서의 제목 목록과 대조합니다. 다른 문서가 원문 언어 제목의 자동 앵커로 링크하면 번역 제목에 원래 앵커를 명시 ID(`## Title {#원래-앵커}`)로 붙입니다.
- [ ] `draft: true`는 production 빌드에서 문서를 빼지만 개발 서버(`start`)에서는 그대로 보이므로 숨김은 production 빌드로 확인합니다. 모든 문서가 draft인 자동 생성 분류는 production 사이드바에서 사라집니다. `draft: "true"`처럼 따옴표 문자열도 숨기므로 draft 문서를 정규식으로 셀 때 따옴표 값을 포함합니다.

## 빌드

- [ ] MDX 1에서 원시 `<img ... />` 줄 바로 다음 줄에 `<!-- -->` 주석을 붙이면 주석이 JSX 블록에 들어가 `Unexpected token`으로 빌드가 실패합니다. 둘 사이에 빈 줄을 둡니다(production 빌드의 실패와 빈 줄 추가 뒤 통과로 확인, 2026-11-05).
- [ ] `docusaurus build`와 개발 서버 `start`는 사이트 루트의 생성 폴더 `.docusaurus`를 함께 씁니다. 빌드 중에 개발 서버가 켜지거나 파일 변경으로 다시 생성하면 정적 렌더링 단계에서 임의의 페이지가 `Cannot read properties of undefined (reading 'unversionedId')`로 실패합니다(2026-11-03 관찰). 개발 서버를 끌 수 없으면 작업 트리 사본에서 빌드합니다.

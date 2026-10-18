---
type: Reference
title: MCP 정책
description: 내장으로 안 되는 외부 연결만 MCP로 쓰는 기준, 겹치는 MCP 기능의 대체와 검색 MCP의 수직 검색 선별, gateway 간접 실행 도구의 보호 범위, 실행 경로별 backend 버전, 사양 revision과 OMP 클라이언트 호환.
tags: [tools, mcp, security]
timestamp: 2026-10-18T00:00:00Z
---

# MCP 정책

## 우선순위
- 내장 도구로 되는 일에는 MCP를 두지 않는다([omp 기본 도구](/tools/builtin.md)). MCP는 내장에 없는 외부 연결(외부 SaaS, 사내 시스템, 전용 데이터 소스, 뉴스·영상·이미지·장소 수직 검색)에만 쓴다.
- 한 서버가 겹치는 도구와 고유 도구를 함께 노출하면 고유 도구만 쓰고 겹치는 도구는 노출돼 있어도 호출하지 않는다. 외부 서버의 설치·기동 전 검토는 [스킬 사용](/tools/skills.md), 승인 정책과 격리의 구분은 [보안 개요](/security/overview.md)를 따른다.

## 내장으로 대체하는 MCP 기능
- 웹 검색 MCP(brave-search 등)의 일반 검색·요약·본문 추출 → `web_search`, 개별 URL → `read`. `web_search`에는 뉴스·영상·이미지·장소 수직 검색 모드가 없으므로 그때만 검색 MCP를 쓴다.
  - Brave Search MCP(Docker 카탈로그 `brave`)는 `brave_news_search`·`brave_video_search`·`brave_image_search`와, 요금제가 지원할 때의 `brave_place_search`·`brave_local_search`만 쓰고 `brave_web_search`·`brave_llm_context`·`brave_summarizer`는 쓰지 않는다.
  - 요금제 미포함 시 `brave_place_search`는 400 `OPTION_NOT_IN_PLAN`으로 거절되고 `brave_local_search`는 위치 결과 없이 일반 웹 결과로 대체해 응답한다. 대체된 결과를 장소 검색 결과로 제시하지 말고 `web_search`로 조사하며 장소 검색을 쓸 수 없었다고 밝힌다(확인: 2026-10-12).
- 시맨틱 코드 분석 MCP(serena 등) → `lsp`·AST 도구·`grep`/`glob`. 라이브러리 문서 MCP(context7 등) → `read` + `web_search`, 넓은 조사는 `scout`.
- 브라우저 자동화 MCP(playwright·puppeteer 등) → `eval`의 `browser` facade. `browser.enabled`(기본 true)·Eval 활성·도구 목록 비제한이면 OMP가 알려진 브라우저 MCP를 설정 로드 시 조용히 제외한다. 도구를 명시 목록으로 제한한 세션이나 패턴 밖 브라우저 MCP는 로드될 수 있으므로 기본 설정에 추가하지 않고 실제 도구 목록으로 확인한다(`omp://mcp-config.md`, OMP 18.12.1 확인: 2026-10-18).

## gateway의 관리·간접 실행 도구
- Docker MCP gateway는 실험 기능 `dynamic-tools`가 켜져 있으면 프로필의 서버 도구 밖에 서버 추가·제거(`mcp-add`·`mcp-remove`)·설정 변경(`mcp-config-set`)·프로필 전환, 다른 MCP 도구를 호출하는 `code-mode`·`mcp-exec`를 노출한다. `tools.approvalMode: yolo`에서는 MCP 도구가 승인 없이 실행되므로 외부 자료의 지시로 호출될 수 있다.
- 이 레포의 `dangerous-tool-guard`는 MCP 호출을 두 가지로만 확인한다. payload에 파괴적 SQL이 있고 도구 이름이나 payload에 DB 도구 표지가 있는 경우, 그리고 `mcp__` 도구 이름에 delete·drop·destroy·terminate·purge·truncate·reset·remove 토큰이 있는 경우다. 이름 검사로는 `mcp-remove`만 걸리고 `mcp-add`·`mcp-config-set`·`mcp-exec`·`code-mode`는 걸리지 않으며, SQL 검사도 간접 실행 전체를 보장하지 않는다(`extensions/dangerous-tool-guard.js`의 `inspectMcp`).
- 연결 전 `docker mcp feature ls`와 `docker mcp gateway run --profile <id> --dry-run`으로 실제 노출 도구를 확인하고, 쓰지 않으면 `docker mcp feature disable dynamic-tools`로 끈 뒤 gateway 연결을 다시 시작한다. 항상 막을 도구는 등록 이름(`mcp__<서버>_<도구>`) 기준 `deny`로 둔다. `prompt`는 UI 있는 세션에서 승인될 수 있고 `mcp-exec`·`code-mode`를 남기면 직접 도구 차단을 우회할 수 있다(`omp://approval-mode.md`, 확인: 2026-10-15).

## 버전 고정과 runtime 교체
**모든 실행 주체를 멈추고 실제 backend를 교체·확인한다.** 같은 MCP 서버를 여러 실행 경로(에디터 플러그인의 패키지 실행기, 로컬 portable runtime, 시스템 설치)가 띄울 수 있으면 경로별 backend 버전을 각각 고정하고 실행 중 backend가 보고하는 버전과 실제 실행 파일 경로로 확인한다(`serverInfo`는 자기 보고 값이라 보안 근거가 아니다). 교체는 자동 재기동 주체를 포함한 모든 소비자를 정상 중지하고 종료를 확인한 뒤(OMP는 `/mcp disable <name>`) 백업하고 staging에서 검증한 runtime으로 바꾸고, 다시 활성화해 새 버전·경로를 확인한다. 중지를 보장하지 못하면 교체를 보류하며 강제 종료 직후 자동 재시작과 경쟁하지 않는다.

## 사양 revision과 OMP 클라이언트 호환
- 현행 MCP revision은 [2026-07-28](https://modelcontextprotocol.io/specification/versioning)이며 `initialize`·세션을 없앤 stateless 모델이다(확인: 2026-10-18). OMP 18.12.1은 2025-11-25 revision의 `initialize`를 보낸다(`MCP_PROTOCOL_VERSION`, 설치본 `src/mcp/types.ts`, 확인: 2026-10-18).
- 사양의 [호환성 표](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning)상 legacy(`initialize`) 클라이언트는 modern-only 서버에서 실패한다. 새 MCP 서버를 연결하기 전에 legacy 클라이언트 지원을 확인하고, 다른 host의 새 revision 기본 협상을 OMP의 지원 근거로 삼지 않는다.

## 인증
MCP 서버 설정·크리덴셜은 머신별·비밀이므로 배포 스크립트 범위 밖이다. 키·토큰은 환경 변수·OAuth로 주입하되 이는 격리가 아니므로 불필요한 환경·토큰을 외부 코드에 상속하지 않는다.

---
type: Reference
title: omp 기본 도구
description: omp 내장 도구 우선 정책, 작업용 TypeScript+Bun 단일화와 실행 언어 예외, MCP 대체 매핑.
tags: [tools, builtin, lsp, ast, web_search, typescript, bun]
timestamp: 2026-09-18T00:00:00Z
---

# omp 기본 도구

omp는 배터리 포함 — 코딩 워크플로 대부분이 내장 도구로 처리된다. 기본으로 되는 일에 MCP를 두지 않는다.

## 코드 분석/탐색
- `lsp` — 심볼 검색, 참조 찾기, 리네임, 코드 액션, 진단(LSP 기반 코드 인텔리전스).
- `ast_grep` / `ast_edit` — 트리시터 기반 구조적 검색·치환.
- `grep` / `glob` — 내용·파일 검색(.gitignore 존중).
- 폴백 체인: lsp → ast_grep → grep/glob → read.

## 웹·문서
- `web_search` — 내장 웹 검색(다수 프로바이더, anonymous 폴백 포함). 별도 검색 MCP 불필요.
- `read` — URL·문서·내부 URI 읽기.

## 라이브러리/API 조사
- `read`로 공식 문서·소스를 직접 확인하고 `web_search`로 보강한다. 넓은 읽기 전용 조사는 현재 제공되는 `scout`에 위임한다. 제공되지 않은 에이전트 이름을 가정하지 않는다([에이전트 가이드](/agents/guide.md)).

## 실행·디버깅·자동화
- `bash` — 기존 CLI·프로젝트 명령 실행. `eval` — 파일이 필요 없는 계산·변환·자동화는 `language: "js"`로 Bun에서 실행한다.
- `debug` — DAP 디버거(lldb/dlv/debugpy) 스테핑·브레이크포인트.
- `browser` — Puppeteer 브라우저 자동화.
- `read` — 이미지 파일 디코딩·분석.

## 작업용 스크립트와 실행 언어
- 적용 대상은 에이전트가 새로 작성하는 작업용 자동화·분석·재현·스모크 스크립트다. **저장 파일은 TypeScript(`.ts`), 실행은 `bun <파일.ts>`**로 통일한다. 저장 위치는 [워크플로](/workflow.md)의 작업 디렉터리를 따른다. 기존 제품 코드·영구 테스트·빌드 도구를 TypeScript로 이식하라는 뜻은 아니다.
- 전용 기본 도구 → 기존 프로젝트 명령·CLI → 파일이 필요 없는 `eval`의 `language: "js"` → 보존·재실행이 필요한 `.ts` 스크립트 순으로 선택한다. 가능한 작업을 스크립트로 감싸거나 별도 파일·패키지 설정을 만들지 않는다. `eval`의 `js`는 Bun에서 실행되는 JavaScript 경로이며, TypeScript 타입 문법을 강제로 넣지 않는다. 타입이 필요하면 `.ts` 파일을 사용한다.
- 표준 라이브러리·Bun 내장 기능·기존 프로젝트 의존성을 우선한다. 작업용 파일 하나 때문에 npm 패키지·Python·가상환경을 추가하거나 기존 셸/PowerShell 부트스트랩을 다시 작성하지 않는다.
- Python을 지원한다는 사실은 선택 사유가 아니다. 편의·습관·짧은 문법을 이유로 `eval language: "py"`, `python -c`, Python heredoc, 새 `.py` 파일로 전환하지 않는다. 같은 작업의 코드와 데이터 처리를 Python/JS 사이에 나누지 않는다.
- 다른 언어는 사용자 명시 지정, 기존 프로젝트의 코드·테스트·실행 환경, 실제 필수 도구·라이브러리의 런타임 제약이 있을 때만 사용한다. 적용 근거와 최소 범위를 밝히고 나머지 작업용 코드는 TypeScript+Bun을 유지한다. 편의용 라이브러리를 먼저 골라 예외를 만들지 않는다.
- 위 예외에 해당하지 않는 새 작업용 코드에 Bun이 필요하지만 사용할 수 없으면 기본 도구·기존 명령으로 해결 가능한지 확인한다. 불가능하면 필요한 실행 환경을 알리고 설치·대체의 승인을 받으며 Python으로 조용히 대체하지 않는다. 기존 프로젝트 언어·명시된 필수 런타임 예외를 적용하는 데 Bun 설치를 요구하지 않는다. 언어 지침은 도구의 Python 지원 자체를 제거하거나 기존 프로그램의 인터프리터를 막는 설정이 아니다.

## 현재 MCP → 기본 도구 대체 매핑
| 기존 MCP | 용도 | omp 기본 대체 |
|----------|------|------|
| brave-search | 웹 검색 | `web_search` |
| serena | 시맨틱 코드 분석 | `lsp` + `ast_grep`/`ast_edit` + grep/glob |
| context7 | 라이브러리 문서 | `read` + `web_search`; 넓은 읽기 전용 조사는 `scout` |

위 3종은 기본 도구로 완전/충분 대체되므로 omp에 설정하지 않는다. 상세 정책은 [MCP 정책](/tools/mcp.md).

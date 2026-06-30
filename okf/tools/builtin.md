---
type: Reference
title: omp 기본 도구
description: omp 내장 도구로 코드 분석·검색·웹·디버깅을 처리한다. 현재 MCP를 대체하는 매핑 포함.
tags: [tools, builtin, lsp, ast, web_search]
timestamp: 2026-06-29T00:00:00Z
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
- `librarian` 에이전트 — 소스 코드를 직접 읽어 출처 검증된 답을 준다(문서 MCP보다 정확). + `web_search` + `read` 보강.

## 실행·디버깅·자동화
- `bash` / `eval` — 명령·Python/JS 코드 실행(영속 세션).
- `debug` — DAP 디버거(lldb/dlv/debugpy) 스테핑·브레이크포인트.
- `browser` — Puppeteer 브라우저 자동화.
- `read` — 이미지 파일 디코딩·분석.

## 현재 MCP → 기본 도구 대체 매핑
| 기존 MCP | 용도 | omp 기본 대체 |
|----------|------|------|
| brave-search | 웹 검색 | `web_search` |
| serena | 시맨틱 코드 분석 | `lsp` + `ast_grep`/`ast_edit` + grep/glob |
| context7 | 라이브러리 문서 | `librarian` + `web_search` + `read` |

위 3종은 기본 도구로 완전/충분 대체되므로 omp에 설정하지 않는다. 상세 정책은 [MCP 정책](/tools/mcp.md).

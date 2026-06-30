---
type: Rule
title: 보안 개요
description: 요청 범위 무관 즉시 경고 대상, 취약점 설명 원칙.
tags: [security, rule]
timestamp: 2026-06-29T00:00:00Z
---

# 보안 개요

## 즉시 경고 (요청 범위와 무관)
- 보안 취약점: SQL Injection, XSS, CSRF, 인증/인가 우회, Path Traversal, Command Injection.
- 데이터 손실 위험: WHERE 없는 DELETE/DROP/TRUNCATE, 백업 없는 마이그레이션, 되돌릴 수 없는 작업.
- 크리덴셜 노출: 하드코딩 비밀번호, API 키/토큰, 환경 변수 미사용.

## 취약점 설명 원칙
- 허용: 완화/수정 방향 중심, 보안 모범 사례 안내.
- 금지: 재현 가능한 공격 절차, exploit 코드, 실제 타겟 정보.

## 민감정보
- API 키/토큰/크리덴셜·PII·내부 접속정보는 출력에 절대 포함하지 않는다 — 마스킹/더미로 설명, 실제 값은 환경 변수 주입.

## 관련
- 게임 도메인: [게임 보안](/security/game.md)
- 리뷰 시: [코드 리뷰 보안 체크리스트](/security/review-checklist.md)
- MCP/공급망: [MCP 정책](/tools/mcp.md)

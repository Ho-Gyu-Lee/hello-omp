---
type: Checklist
title: 게임 서버 기능/성능 체크리스트
description: 메모리·동시성·네트워크·틱/루프·반응성 (보안은 security/game 참조).
tags: [game, server, performance, checklist]
timestamp: 2026-06-29T00:00:00Z
---

# 게임 서버 기능/성능 체크리스트

- [ ] 메모리: 힙 할당 최소화·풀링(GC 일시정지·틱 흔들림 회피)
- [ ] 동시성: 락 범위 최소화·lock-free 선호·데드락 방지
- [ ] 네트워크: 버퍼 재사용·직렬화 비용 고려·비동기 I/O
- [ ] 틱/루프: 처리량·지연 예산 내 동작, 무거운 작업 프레임/잡 분산
- [ ] 반응성: 클라이언트 예측에 대한 서버 보정(reconciliation) 지원

보안 항목은 [게임 보안](/security/game.md)·[리뷰 체크리스트](/security/review-checklist.md)에서 별도 관리.

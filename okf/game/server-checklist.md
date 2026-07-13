---
type: Checklist
title: 게임 서버 기능/성능 체크리스트
description: 메모리·동시성·네트워크·틱·권위 상태·복구·처리량 체크리스트.
tags: [game, server, performance, networking, checklist]
timestamp: 2026-07-13T00:00:00Z
---

# 게임 서버 기능/성능 체크리스트

- [ ] 메모리: 힙 할당 최소화·풀링(GC 일시정지·틱 흔들림 회피)
- [ ] 동시성: 락 범위 최소화·lock-free 선호·데드락 방지
- [ ] 네트워크: 버퍼 재사용·직렬화 비용 고려·비동기 I/O
- [ ] 틱/루프: 처리량·지연 예산 내 동작, 무거운 작업 프레임/잡 분산
- [ ] 반응성: 클라이언트 예측에 대한 서버 보정(reconciliation) 지원
- [ ] 상태 수락: 입력의 형식·권한·순서·게임 불변조건 검증을 마친 뒤에만 권위 상태·baseline·통계를 갱신
- [ ] 보정 전파: 최종 accepted 값을 시뮬레이션·저장·복제·송신자 reconciliation·관전자 전파 전체에 사용
- [ ] 순서/생명주기: sequence 중복·역순·wraparound와 session/entity generation을 검증해 stale packet 차단
- [ ] 권위 이전: old/new authority·handoff generation·commit 시점·in-flight message 처리 정책 명시
- [ ] 전달/혼잡: 메시지별 전달·순서·중복·만료 의미를 정의하고 느린 연결에 coalesce·drop·backpressure·disconnect 정책 적용
- [ ] 가시성/관심 관리: 플레이어별 전송 대상을 서버에서 계산하고 observer 변화 때 누락·과다 전파 없이 수렴
- [ ] 검증: 결정적 알고리즘 테스트와 codec·검증·dispatch를 지나는 통합 테스트, 손실·역순·재접속·장시간 누적 시나리오 보유

동기화 상세는 [게임 네트워크 동기화](/game/network-sync.md), 보안은 [게임 보안](/security/game.md)·[리뷰 체크리스트](/security/review-checklist.md)에서 관리.

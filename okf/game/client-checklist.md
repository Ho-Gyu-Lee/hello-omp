---
type: Checklist
title: 게임 클라이언트 기능/성능 체크리스트
description: 메모리·프레임·렌더링·에셋·수명·네트워크 상태·반응성·플랫폼 체크리스트.
tags: [game, client, performance, networking, checklist]
timestamp: 2026-07-13T00:00:00Z
---

# 게임 클라이언트 기능/성능 체크리스트

- [ ] 메모리: 핫패스 힙 할당·GC 유발 최소화(풀링·구조체/스팬·박싱 회피)
- [ ] 메모리: 텍스처·메시·오디오 에셋 적시 언로드(씬 전환 시 누수 없음)
- [ ] 프레임: 무거운 동기 처리로 메인 스레드 블로킹·프레임 드랍 없음
- [ ] 프레임: 긴 연산을 비동기·잡 시스템·프레임 분산으로 분할
- [ ] 렌더링: draw call·오버드로우·배칭 관리
- [ ] 에셋 로딩: 비동기·스트리밍, 로딩 히치 없음
- [ ] 수명 관리: 코루틴·비동기 태스크 취소·정리, 파괴된 객체 접근 없음
- [ ] 반응성: 클라이언트 예측으로 즉시 피드백, 서버 보정(reconciliation) 수용
- [ ] 상태 계층: 권위·예측·보간 목표·표시 상태를 분리하고 표시 상태를 서버 검증이나 delta baseline으로 역주입하지 않음
- [ ] 시간/순서: 원격 timestamp와 로컬 경과 시간을 직접 비교하지 않고, 적용 전 샘플과 오래된 샘플을 구분
- [ ] 예측: 외삽을 시간·거리·회전 오차 예산으로 제한하고 권위 상태 없이 무기한 진행하지 않음
- [ ] 보정: 현재 표시 상태에서 자연스럽게 시작하며 오래된 목표로 점프한 뒤 다시 이동하는 이중 보정 없음
- [ ] 불연속 전환: teleport·respawn·scene transfer·authority change 때 속도·버퍼·timestamp의 preserve/reset/recompute 정책 명시
- [ ] 재접속: session/entity generation을 갱신하고 이전 generation의 패킷·대기 명령에 재검증·폐기 정책을 적용한 뒤 권위 상태로 재수렴
- [ ] 플랫폼: 모바일 발열·배터리, 해상도·주사율 차이 대응

동기화 상세는 [게임 네트워크 동기화](/game/network-sync.md), 보안은 [게임 보안](/security/game.md)·[리뷰 체크리스트](/security/review-checklist.md)에서 관리.

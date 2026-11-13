---
type: Concept
title: 난수·재현 계약
description: 같은 seed가 라이브러리 간 같은 결과를 보장하지 않는 조건, 메모리 스냅샷을 여러 환경으로 복원하는 플랫폼(AWS Lambda SnapStart 등)에서 복제되는 난수 상태, 시험이 주입한 시계·상태를 라이브 경로에 되돌리지 않는 기준입니다.
tags: [development, random, determinism, replay, testing, snapshot, lambda]
timestamp: 2026-11-13T00:00:00Z
---

# 난수·재현 계약

용도별 난수 스트림 분리는 [동기화 검증](/game/network-sync.md), 게임의 출하 테스트 훅과 비공개 정보는 [게임 보안](/security/game.md)을 따릅니다.

## 난수 계약

- 플랫폼·업데이트를 넘는 재현이 필요하면 PRNG 알고리즘, 원시 출력→범위/분포 매핑, seed 파생, 콘텐츠/생성 버전을 함께 고정하고 호환을 검사합니다. 표준 C++ 난수 엔진의 수열은 규정돼 있지만 분포 알고리즘은 구현 정의여서 같은 seed의 `uniform_*_distribution`·`shuffle`이 모든 라이브러리에서 같은 결과라는 가정을 두지 않습니다([distributions](https://eel.is/c++draft/rand.dist.general), [shuffle](https://eel.is/c++draft/alg.random.shuffle)). Godot RNG도 내부 알고리즘을 구현 세부로 명시합니다([RandomNumberGenerator](https://docs.godotengine.org/en/4.7/classes/class_randomnumbergenerator.html), 확인 2026-10-15).
- 실행 환경의 메모리를 스냅샷해 여러 환경으로 복원하는 플랫폼(AWS Lambda SnapStart 등)에서는 초기화 중에 만든 난수 생성기 상태·seed·버퍼에 받아 둔 난수 바이트가 복원된 모든 환경에 그대로 복제됩니다. 정적 필드나 초기화 코드에서 만든 비암호 PRNG(.NET `System.Random`, Python `random`)는 환경마다 같은 수열을 내므로, 커널 엔트로피를 읽는 CSPRNG(.NET `System.Security.Cryptography.RandomNumberGenerator`, Java `java.security.SecureRandom`, Python `random.SystemRandom`, Go `crypto/rand`)를 쓰거나 복원 뒤 hook에서 다시 seed합니다. 고유 ID·비밀 값도 초기화 단계가 아니라 핸들러나 복원 뒤 hook에서 만듭니다. Lambda는 복원 때 커널 난수 생성기만 새 엔트로피로 다시 seed하므로, 자체 base image에 넣은 암호 라이브러리가 캐시한 RNG 상태는 복원 뒤 hook에서 버립니다([SnapStart uniqueness](https://docs.aws.amazon.com/lambda/latest/dg/snapstart-uniqueness.html), 확인 2026-11-13).

## 검증 시계와 라이브 상태

- 시험이 주입한 상태는 라이브 경로로 새지 않게 격리합니다. 예: 애니메이션 검증에서 주입한 미래 표시 시각을 실제 세션의 단조 렌더 시계로 그대로 되돌리지 않습니다. 라이브 경로를 재개할 검사는 새 장면으로 분리하거나 원래 시계를 바꾸지 않는 관찰을 사용합니다.

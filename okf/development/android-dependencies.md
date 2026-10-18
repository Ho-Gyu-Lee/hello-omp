---
type: Checklist
title: Android 라이브러리 의존성과 최종 패키지 검증
description: 로컬 AAR이 외부 의존성 메타데이터를 대신하지 않는다는 계약과, 클래스 포함 여부를 최종 APK의 DEX 정의로 확인하는 기준입니다.
tags: [development, android, aar, gradle, maven, dependencies, verification]
timestamp: 2026-10-18T00:00:00Z
---

# Android 라이브러리 의존성과 최종 패키지 검증

Unity EDM4U/Unity EDM의 실행·버전·관찰 한계는 [게임 클라이언트의 Unity 적용](/game/client-checklist.md)에 남깁니다.

- [ ] 로컬 AAR의 외부 라이브러리 의존성은 Gradle/의존성 resolver에 따로 명시합니다. 일반 AAR의 `implementation` 선언은 외부 라이브러리의 클래스나 Maven 메타데이터를 AAR 파일에 자동으로 합치지 않고, Maven 배포가 제공하는 의존성 메타데이터를 로컬 AAR 파일만 복사하는 경로가 대신하지 않습니다([Android 라이브러리 문서](https://developer.android.com/studio/projects/android-library#psd-add-library-dependency), 확인 2026-10-15).
- [ ] 클래스 포함 여부는 C# 컴파일이 아니라 최종 APK의 모든 DEX에 필요한 클래스 정의가 있는지로 확인합니다. `NoClassDefFoundError`는 기기 로그의 클래스·호출 위치 → 플러그인 바이트코드 → 최종 APK 정의 순으로 대조하고, 클래스 참조 문자열만으로 포함을 판정하지 않으며 알려진 포함 클래스로 검사기를 양성 대조합니다. 이전 export나 에디터 실행을 현재 APK의 기기 실행 검증으로 대체하지 않습니다.

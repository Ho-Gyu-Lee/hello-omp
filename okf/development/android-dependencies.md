---
type: Checklist
title: Android 라이브러리 의존성과 최종 패키지 검증
description: 로컬 AAR과 Maven 의존성 메타데이터의 차이, 최종 APK/DEX의 클래스 정의와 기기 오류 경로를 대조하는 공통 Android 검증 기준입니다.
tags: [development, android, aar, gradle, maven, dependencies, packaging, verification]
timestamp: 2026-10-15T00:00:00Z
---

# Android 라이브러리 의존성과 최종 패키지 검증

네이티브 Android 앱과 엔진/프레임워크의 Android 산출물에 적용하는 기준입니다. 아래 C# 컴파일은 Unity 연결 사례이며 모든 Android 앱이 C#을 사용한다는 뜻이 아닙니다. Unity의 EDM4U/Unity EDM 실행·버전·관찰 한계는 [게임 클라이언트의 Unity 적용](/game/client-checklist.md)에 남깁니다.

## 라이브러리 의존성과 클래스 정의
- [ ] Android 플러그인: 로컬 AAR의 외부 라이브러리 의존성을 Gradle/의존성 resolver에 명시하고, C# 컴파일과 별개로 최종 APK의 모든 DEX에 필요한 클래스 정의가 포함되는지 확인. 일반 AAR의 `implementation` 선언은 외부 라이브러리의 클래스나 Maven 메타데이터를 AAR 파일에 자동 합치지 않으며, Maven 배포는 의존성 메타데이터를 제공하지만 로컬 AAR 파일만 복사하는 경로에서는 이를 대신한다고 가정하지 않음([Android 라이브러리 문서](https://developer.android.com/studio/projects/android-library#psd-add-library-dependency)).
- [ ] Android 클래스 누락: `NoClassDefFoundError`의 정확한 클래스와 호출 위치를 기기 로그→플러그인 바이트코드→최종 APK 정의로 대조. 클래스 참조 문자열만으로 포함을 판정하지 않고 알려진 포함 클래스로 검사기의 양성 대조를 수행. `androidx.core`와 `androidx.webkit`은 별도 artifact이며, [`WebViewAssetLoader`](https://developer.android.com/reference/androidx/webkit/WebViewAssetLoader)는 `androidx.webkit:webkit`에 속함. 이전 export나 에디터 실행을 현재 APK의 기기 실행 검증으로 대체하지 않음.

## 근거와 적용 범위

링크한 Android 공식 문서의 라이브러리 의존성·클래스 소속을 2026-10-15에 대조했습니다. 기존 검증 기준을 공통 분류로 옮긴 것이며 이 분류 작업에서 APK를 빌드하거나 기기 실행을 재현한 결과는 아닙니다.

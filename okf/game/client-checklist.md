---
type: Checklist
title: 게임 클라이언트 기능/성능 체크리스트
description: 게임 클라이언트의 정상 종료 로그아웃, 수신 처리율과 Unity Android 의존성 관리자(EDM4U→Unity EDM)의 버전 특정 계약.
tags: [game, client, networking, checklist, unity, android, edm4u, unity-edm]
timestamp: 2026-10-18T00:00:00Z
---

# 게임 클라이언트 기능/성능 체크리스트

공통 기준은 [루프와 실행 경계](/development/execution.md)·[렌더링·애니메이션](/development/rendering-animation.md)·[런타임 진단](/development/runtime-diagnostics.md)·[네트워크 전달·I/O](/development/network.md), 동기화·재접속은 [네트워크 동기화](/game/network-sync.md#공통-원리), Android AAR/APK 검증은 [공통 Android 패키지 검증](/development/android-dependencies.md)을 따른다.

- [ ] 정상 종료(창 닫기·Alt+F4·Android Back)에서 명시 로그아웃을 보내지 않으면 서버는 연결 손실로 보고 재접속 유예 동안 캐릭터를 붙잡아 같은 계정의 즉시 재접속을 거절한다. 엔진의 자동 종료를 가로채 세션이 묶인 상태에서만 로그아웃을 한 번 보내고, 메인 스레드에서 transport를 pump하며 서버의 연결 종료나 짧은 상한(수 초)까지 기다린 뒤 종료한다. 로그아웃 뒤에는 다른 송신과 상태를 바꾸는 진입점을 막고, 지역 이전 확정과 겹치면 새 binding으로 한 번 더 보낸다. 연결 종료는 서버의 소유 반환 완료 증거가 아니며 검증은 종료 직후 같은 계정의 즉시 재접속으로 한다. Godot는 `auto_accept_quit`·`quit_on_go_back`을 끄고 `NOTIFICATION_WM_CLOSE_REQUEST`와 Android 전용 `NOTIFICATION_WM_GO_BACK_REQUEST`를 처리한다([SceneTree](https://docs.godotengine.org/en/stable/classes/class_scenetree.html), 확인 2026-10-15).
- [ ] 수신을 프레임마다 소비하고 transport가 소비 전까지 다음 frame을 읽지 않는 구조라면 수신 처리율이 FPS에 묶인다([서버 큐 운영](/development/server-checklist.md#큐입장처리-예산)과 같은 원리). 초당 정상 하향 frame 수가 최저 지원 FPS보다 낮은지, 로딩·장시간 정지 뒤 밀린 수신을 따라잡는지 확인한다.

## Unity Android 의존성 배포 검증

현황(확인 2026-10-15):
- [EDM4U](https://github.com/googlesamples/unity-jar-resolver)는 1.2.190(2026-09-29)에서 deprecated로 표시되었고 2026-10-26에 archive(읽기 전용·지원 종료) 예정이다(이후 실제 상태 재확인). 1.2.189·1.2.190은 Android Resolver 변경이 없다.
- Google은 Unity 공식 [External Dependency Manager](https://docs.unity3d.com/Packages/com.unity.external-dependency-manager@2.1/manual/index.html)(`com.unity.external-dependency-manager` 2.1.1, 2026-10-01, Unity 2022.3 이상)로 옮기라고 안내하며 두 관리자를 한 프로젝트에 함께 두지 않기를 권장한다. 2.1.0은 AAR Resolution 모드와 관련 설정을 제거했고, 2.1.1은 `file:` 의존성으로 설치한 패키지에서 Android resolution이 `DirectoryNotFoundException`으로 실패하던 문제를 고쳤다.

소비 프로젝트가 실제로 쓰는 관리자에 대해 수행한다.
- [ ] AAR 호환성은 POM이 아니라 `AndroidManifest.xml`의 `minSdk`와 `aar-metadata.properties`의 `minCompileSdk`·`minCompileSdkExtension`·`minAndroidGradlePluginVersion`(DSL 속성명은 `minAgpVersion`)으로 확인하고, 다른 의존성이 더 높은 버전을 선택할 수 있으므로 resolved 버전도 확인한다([AarMetadata DSL](https://developer.android.com/reference/tools/gradle-api/9.0/com/android/build/api/dsl/AarMetadata)).
- [ ] 배포한 XML은 소비 프로젝트의 관리자가 읽는 경로를 직접 실행해 검증한다. XML 좌표를 따로 읽어 만든 Gradle 소비 APK는 DEX 포함 검증일 뿐 관리자의 XML 탐색·템플릿 주입 검증이 아니며, Resolver는 의존성이 없어도 성공을 반환할 수 있으므로 종료 코드로 포함을 판정하지 않는다.
- [ ] `ResolveSync(true)`는 EDM4U 1.2.188의 API다(Unity 2022.3.62f3의 Custom Main Gradle Template 경로에서 확인, [README](https://github.com/googlesamples/unity-jar-resolver/blob/v1.2.188/README.md)). Unity EDM 2.1.1의 `Google.JarResolver.dll`에 같은 이름의 심볼 문자열이 있으나 호출 동작은 확인하지 않았고 AAR 복사 모드 확인은 EDM4U에 한정될 수 있으므로 설치본으로 다시 확인한다.

---
type: Checklist
title: 게임 클라이언트 기능/성능 체크리스트
description: 게임 클라이언트의 정상 종료 로그아웃, 수신 처리율과 Unreal Engine 모바일의 게임 스레드 정지 조건, Unity Android 의존성 관리자(EDM4U→Unity EDM)·Unity IAP 5.4.4 에디터 오류·Unity 빌드 자동화(모듈 설치 CLI·BuildReport 수명·저장 대화상자)·비활성 컴포넌트의 애니메이션 이벤트 수신의 버전 특정 계약.
tags: [game, client, networking, checklist, unity, unreal, ios, android, edm4u, unity-edm, unity-iap, unity-build]
timestamp: 2026-11-23T00:00:00Z
---

# 게임 클라이언트 기능/성능 체크리스트

공통 기준은 [렌더링·애니메이션](/development/rendering-animation.md)·[런타임 진단](/development/runtime-diagnostics.md)·[네트워크 전달·I/O](/development/network.md), 동기화·재접속은 [네트워크 동기화](/game/network-sync.md#공통-원리), Android AAR/APK 검증은 [공통 Android 패키지 검증](/development/android-dependencies.md)을 따른다.

- [ ] 정상 종료(창 닫기·Alt+F4·Android Back)에서 명시 로그아웃을 보내지 않으면 서버는 연결 손실로 보고 재접속 유예 동안 캐릭터를 붙잡아 같은 계정의 즉시 재접속을 거절한다. 엔진의 자동 종료를 가로채 세션이 묶인 상태에서만 로그아웃을 한 번 보내고, 메인 스레드에서 transport를 pump하며 서버의 연결 종료나 짧은 상한(수 초)까지 기다린 뒤 종료한다. 로그아웃 뒤에는 다른 송신과 상태를 바꾸는 진입점을 막고, 지역 이전 확정과 겹치면 새 binding으로 한 번 더 보낸다. 연결 종료는 서버의 소유 반환 완료 증거가 아니며 검증은 종료 직후 같은 계정의 즉시 재접속으로 한다. Godot는 `auto_accept_quit`·`quit_on_go_back`을 끄고 `NOTIFICATION_WM_CLOSE_REQUEST`와 Android 전용 `NOTIFICATION_WM_GO_BACK_REQUEST`를 처리한다([4.7 SceneTree](https://docs.godotengine.org/en/4.7/classes/class_scenetree.html), 확인 2026-11-13).
- [ ] 수신을 프레임마다 소비하고 transport가 소비 전까지 다음 frame을 읽지 않는 구조라면 수신 처리율이 FPS에 묶인다([서버 큐 운영](/development/server-checklist.md#큐입장처리-예산)과 같은 원리). 초당 정상 하향 frame 수가 최저 지원 FPS보다 낮은지, 로딩·장시간 정지 뒤 밀린 수신을 따라잡는지 확인한다.
- [ ] 수신 스레드가 게임 스레드와 따로 도는 SDK는 게임 스레드가 멈춘 동안 받은 이벤트를 쌓는다. Unreal Engine 모바일의 게임 스레드 정지 조건(UE 4.27·5.3 엔진 소스 확인, 2026-10-15): iOS는 `applicationWillResignActive`에서 게임 스레드가 `GEngineLoop.Tick()` 대신 `FAppEntry::SuspendTick()`(0.1초 sleep)만 돌아 제어 센터·알림 센터·시스템 권한 팝업 같은 일시 비활성에서도 멈춘다. UE 4.27은 항상 멈추고, UE 5.3은 `GConfig->GetBool`의 반환값(키 존재 여부)을 설정값으로 써서 엔진 ini에 `/Script/IOSRuntimeSettings.IOSRuntimeSettings`의 `bSupportsBackgroundAudio` 키가 없을 때만 멈춘다(값이 False여도 키가 있으면 멈추지 않는다). Android는 `APP_CMD_PAUSE`(onPause)와 `APP_CMD_TERM_WINDOW`에서 멈추고 포커스 상실만으로는 멈추지 않는다. 수신 버퍼를 고정 크기 풀에서 검사 없이 꺼내 쓰지 않고, 정지 동안 쌓일 양의 상한과 초과 시 동작(재접속 등)을 정해 그 조건에서 시험한다.

## Unity Android 의존성 배포 검증

현황(확인 2026-11-13):
- [EDM4U](https://github.com/googlesamples/unity-jar-resolver)는 1.2.190(2026-09-29)에서 deprecated로 표시된 뒤 2026-10-26에 저장소가 보관(archived, 읽기 전용)되어 Google의 수정·지원이 끝났고 1.2.190이 마지막 릴리스다. 1.2.189·1.2.190은 Android Resolver 변경이 없다.
- Google은 Unity 공식 [External Dependency Manager](https://docs.unity3d.com/Packages/com.unity.external-dependency-manager@2.1/manual/index.html)(`com.unity.external-dependency-manager`, 최신 2.1.1은 changelog 날짜 2026-10-01, Unity 2022.3 이상)로 옮기라고 안내하며 두 관리자를 한 프로젝트에 함께 두지 않기를 권장한다. 의존성 XML 형식은 EDM4U와 같다. 2.1.0은 AAR Resolution 모드와 관련 설정을 제거했고, 2.1.1은 `file:` 의존성으로 설치한 패키지에서 Android resolution이 `DirectoryNotFoundException`으로 실패하던 문제를 고쳤다.

소비 프로젝트가 실제로 쓰는 관리자에 대해 수행한다.
- [ ] AAR 호환성은 POM이 아니라 `AndroidManifest.xml`의 `minSdk`와 `aar-metadata.properties`의 `minCompileSdk`·`minCompileSdkExtension`·`minAndroidGradlePluginVersion`(DSL 속성명은 `minAgpVersion`)으로 확인하고, 다른 의존성이 더 높은 버전을 선택할 수 있으므로 resolved 버전도 확인한다([AarMetadata DSL](https://developer.android.com/reference/tools/gradle-api/9.0/com/android/build/api/dsl/AarMetadata)).
- [ ] 배포한 XML은 소비 프로젝트의 관리자가 읽는 경로를 직접 실행해 검증한다. XML 좌표를 따로 읽어 만든 Gradle 소비 APK는 DEX 포함 검증일 뿐 관리자의 XML 탐색·템플릿 주입 검증이 아니며, Resolver는 의존성이 없어도 성공을 반환할 수 있으므로 종료 코드로 포함을 판정하지 않는다.
- [ ] `ResolveSync(true)`는 EDM4U 1.2.188의 API다(Unity 2022.3.62f3의 Custom Main Gradle Template 경로에서 확인, [README](https://github.com/googlesamples/unity-jar-resolver/blob/v1.2.188/README.md)). Unity EDM 2.1.1의 `Google.JarResolver.dll`에 같은 이름의 심볼 문자열이 있으나 호출 동작은 확인하지 않았고 AAR 복사 모드 확인은 EDM4U에 한정될 수 있으므로 설치본으로 다시 확인한다.

## Unity IAP 에디터 오류

- [ ] `com.unity.purchasing` 5.4.4는 `com.unity.services.deployment`(1.7.2)를 의존성으로 끌어온다(5.4.4 changelog). 그 `DeploymentItemSyncWithRemote`는 도메인 리로드 때 Purchasing 제공자의 Sync with Remote를 실행하고, `.ucat`·`.catalog.csv` 항목이 하나도 없어도 Services Gateway 토큰을 먼저 요청한다(패키지 소스). 토큰 교환이 실패하면 `[InAppPurchasing]: RequestFailedException`이 찍히고 Play 모드 진입 때는 인게임 로그 콘솔에도 잡힌다. 실측 환경은 Unity 2022.3.62f3, 클라우드 프로젝트 미연결, 에디터 계정 로그인 상태였고 토큰 교환이 401을 받았다(2026-11-20). 프로젝트 연결이나 재로그인으로 사라지는지는 확인하지 않았다. 예외를 던지는 코드는 Editor 어셈블리에 있으므로 게임 런타임 결함으로 쫓지 않고, 5.4.4에는 `FailedOrder.Info`·StoreKit 2 중복 보고 같은 런타임 수정이 함께 있어 이 오류만으로 버전을 내리지 않는다.

## Unity 빌드 자동화

- [ ] Unity Hub 4.0.1(Microsoft Store 배포본)은 `Unity Hub.exe -- --headless install-modules`를 더 이상 실행하지 않고 독립 Unity CLI로 안내만 출력한다. 설치되어 있으면 `%LOCALAPPDATA%\Unity\bin\unity.exe`(1.0.0)를 쓴다: `unity install-modules --editor-version <버전> --list`로 모듈 ID를 확인하고 `-m <ID> --accept-eula`로 설치하며, Program Files의 에디터에는 관리자 권한 요청이 뜬다. Windows Dedicated Server 모듈 ID는 `windows-server`이고, 설치 여부는 `Editor/Data/PlaybackEngines/windowsstandalonesupport/Variations`의 `win64_server_*` 폴더로 확인한다(2022.3.62f3 실측, 2026-11-23). CLI가 없으면 원격 설치 스크립트를 실행하기 전에 사용자 승인을 받는다.
- [ ] 한 메서드에서 `BuildPipeline.BuildPlayer`를 subtarget(Player·Server)을 바꿔 연달아 호출하면 앞 호출의 `BuildReport`가 파괴되어 나중에 `summary`를 읽을 때 `MissingReferenceException`이 난다. 결과는 각 빌드 직후 값으로 복사한다. `SwitchActiveBuildTarget` 뒤에도 같다(2022.3.62f3 실측).
- [ ] 열린 에디터에서 `BuildPipeline.BuildPlayer`를 부를 때 열린 씬이 수정 상태면 "Scene(s) Have Been Modified" 모달이 떠 에디터 갱신 루프가 멈추고, 같은 에디터를 쓰는 자동화(예: Unity MCP의 ping)가 응답을 잃는다. 자동화에서는 빌드 전에 씬을 명시적으로 저장하거나 에디터를 닫고 `-batchmode -quit -executeMethod`로 빌드한다(2022.3.62f3 실측).

## Unity 애니메이션 이벤트

- [ ] 애니메이션 이벤트는 같은 GameObject의 비활성(`enabled = false`) MonoBehaviour에도 전달된다. 원격 플레이어처럼 로컬 컨트롤러를 끄는 개체에서, `Start`에서 참조를 잡는 컨트롤러(예: StarterAssets `ThirdPersonController`의 `OnFootstep`)를 `Start`가 돌기 전에 끄면 발소리 이벤트마다 `NullReferenceException`이 난다. 다른 컴포넌트의 `Update`에서 끄는 방식은 그 컨트롤러의 `Start`보다 먼저 실행될 수 있다(2022.3.62f3 실측). 스폰 콜백(`OnStartClient` 등)에서 컨트롤러를 제거하고, 수신자가 없다는 오류가 나지 않도록 이벤트 함수는 다른 컴포넌트에 둔다.

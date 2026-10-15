---
type: Checklist
title: 게임 클라이언트 기능/성능 체크리스트
description: 게임 자원·프레임·반응성·동기화·재접속·정상 로그아웃·수신 처리와 Unity Android 의존성 배포를 점검하며, 공통 끊김 순서·RTT/캡처·포커스·Android 패키지 검증은 공통 정본에 연결합니다.
tags: [game, client, performance, networking, checklist, unity, android, aar, edm4u, unity-edm]
timestamp: 2026-10-15T00:00:00Z
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
- [ ] 동기화 계약: 상태 계층(권위·예측·보간 목표·표시 상태 분리), 시간/순서(원격 timestamp·적용 전/오래된 샘플), 외삽 오차 예산, 보정 시작점(이중 보정 금지), 불연속 전환(teleport·respawn·scene transfer·authority change)의 preserve/reset/recompute 정책을 [네트워크 동기화](/game/network-sync.md)의 '상태 계층'·'시간·순서·생명주기'와 [예측·보간·보정](/game/network-prediction.md) 기준으로 점검
- [ ] 재접속: session/entity generation을 갱신하고 이전 generation의 패킷·대기 명령에 재검증·폐기 정책을 적용한 뒤 권위 상태로 재수렴(재접속 요청·epoch fence 기준은 [네트워크 복구·전달 의미론](/game/network-delivery.md))
- [ ] 수신 메시지와 끊김에 따른 세션 초기화 순서는 [공통 연결 종료 계약](/development/network-io.md#연결-종료와-부하-한계)을 적용한다.
- [ ] 정상 종료와 로그아웃: 창 닫기·Alt+F4·Android Back 같은 정상 종료에서 명시 로그아웃을 보내지 않으면 서버는 연결 손실로 보고 재접속 유예 동안 캐릭터를 붙잡아 같은 계정의 즉시 재접속을 거절한다. 엔진의 자동 종료를 가로채(Godot는 `auto_accept_quit`·`quit_on_go_back`을 끄고 `NOTIFICATION_WM_CLOSE_REQUEST`와 Android 전용 `NOTIFICATION_WM_GO_BACK_REQUEST` 처리) 세션이 묶인 상태에서만 로그아웃을 한 번 보내고, 메인 스레드에서 transport를 계속 pump하며 서버의 연결 종료나 짧은 상한(수 초)까지 기다린 뒤 종료한다. 로그아웃 뒤에는 다른 송신과 상태를 바꾸는 진입점(이전 요청·설치·ACK·재접속)을 모두 막아 상한이 늘어나지 않게 한다. 지역 이전 확정과 겹치면 이전 binding의 로그아웃이 버려질 수 있으므로, 대기 중 이전 확정을 받으면 새 binding으로 한 번 더 보낸다. 연결 종료는 서버의 소유 반환 완료 증거가 아니다. 로그아웃을 보내지 못한 강제 종료는 이미 확인된 세션을 여전히 유예로 남기며, 확인되지 않은 신규 세션은 [네트워크 복구·전달 의미론](/game/network-delivery.md)의 grace 기준대로 유예 없이 정리된다. 검증은 종료 직후 같은 계정의 즉시 재접속으로 한다. Godot 속성·알림은 [SceneTree](https://docs.godotengine.org/en/stable/classes/class_scenetree.html)·[Node](https://docs.godotengine.org/en/stable/classes/class_node.html) stable 문서로 확인했다(2026-10-15).
- [ ] 수신 큐 상한: 게임 루프가 멈춘 동안(일시정지·로딩) 네트워크 스레드가 받은 메시지를 무한히 쌓거나 고정 크기 풀이 고갈돼 크래시하지 않음. 개수·바이트 상한을 넘으면 연결을 끊고 권위 상태로 재동기화하며, 상한 안에서 밀린 큐는 프레임당 처리량을 늘려 따라잡음
- [ ] 메인 스레드 수신 처리율: 수신을 게임 루프에서 프레임마다 소비하고 transport가 소비 전까지 다음 frame을 읽지 않는 구조라면, 수신 처리율은 FPS에 묶인다(프레임당 연결별 1개). 초당 정상 하향 frame 수(예: snapshot 주기+결과·시간 측정 응답)가 최저 지원 FPS보다 낮은지 확인하고, 로딩·장시간 정지 뒤 밀린 수신을 따라잡는 경로를 별도로 검증한다.
- [ ] RTT/캡처 교란은 [공통 시간 계측](/development/network-time.md#rtt-계측과-관찰-사례), 실제 창 검사의 포커스 간섭은 [공통 UI 검증](/development/ui-input.md#실제-입력화면-검증)을 적용한다.
- [ ] 플랫폼: 모바일 발열·배터리, 해상도·주사율 차이 대응
- [ ] Android AAR 의존성과 최종 APK/DEX 클래스 정의는 [공통 Android 패키지 검증](/development/android-dependencies.md)을 적용하고, Unity 의존성 관리자 절차는 아래 엔진별 기준을 확인한다.

## 세부 구현·검증 기준

- 실행·수명·작업 종료·스크립트: [루프와 실행 경계](/development/execution.md).
- 렌더/포즈·기능 지원·소실 복구: [렌더링·애니메이션](/development/rendering-animation.md). 좌표·기하·충돌: [수치·공간 판정](/development/numerics-spatial.md).
- 동시 오디오·스트리밍: [오디오 런타임](/development/audio-runtime.md). 세이브/콘텐츠/파일 수락: [데이터 형식·저장](/development/data-formats.md).
- 정적 정의의 대상별 배포·버전 활성화·논리 테이블/물리 패키징·메모리 인덱스·LINQ·초기 로딩: [데이터 생명주기](/development/data-lifecycle.md). 다운로드 완료와 실제 플레이 가능을 구분합니다. 게임 정적 데이터의 분류·공개·권위 경계는 [게임 정적 데이터](/game/static-data.md)를 따릅니다.
- 경로·AI 상태: [AI·길찾기](/development/ai-navigation.md). 난수/입력 기록: [난수·재현](/development/randomness.md), 게임 락스텝/진단 훅: [게임 기록·재생](/game/random-replay.md). 번역/문자 입력: [지역화](/development/localization.md).
- 계측·자원 고갈·출하 심볼/덤프: [런타임 진단](/development/runtime-diagnostics.md). 직접 transport 구현: [네트워크 I/O](/development/network-io.md).

## Unity Android 의존성 배포 검증

의존성 관리자 현황(확인 2026-10-15): [EDM4U](https://github.com/googlesamples/unity-jar-resolver)는 1.2.190(2026-09-29)에서 deprecated로 표시되었고 2026-10-26에 archive(읽기 전용·지원 종료)될 예정입니다(2026-10-26 이후에는 실제 archive 상태를 다시 확인). 릴리스 노트상 1.2.189는 iOS Resolver 변경만, 1.2.190은 deprecated 표시만 담고 있어 1.2.188 이후 Android Resolver 변경은 기재되어 있지 않습니다. Google은 같은 XML 형식·워크플로를 쓰는 Unity 공식 [External Dependency Manager](https://docs.unity3d.com/Packages/com.unity.external-dependency-manager@2.1/manual/index.html) 패키지(`com.unity.external-dependency-manager` 2.1.1, 2026-10-01, Unity 2022.3 이상)로 옮기라고 안내합니다. 두 관리자를 한 프로젝트에 함께 두지 않기를 권장하며, 다른 관리자가 있는 프로젝트에 Unity EDM을 설치하면 선택 창이 뜨고 `Assets > External Dependency Manager`의 `Change To ...` 메뉴로 전환할 수 있습니다. Unity EDM 2.1.0은 AAR Resolution 모드와 관련 설정을 제거하고 설정을 Project Settings로 옮겼으며, Version Handler는 deprecated입니다. 2.1.1은 `file:` 의존성으로 설치한 패키지에서 Android resolution이 `DirectoryNotFoundException`으로 실패하던 문제를 고쳤습니다. 아래 항목은 소비 프로젝트가 실제로 쓰는 관리자에 대해 수행합니다.

- [ ] SDK가 직접 사용하는 외부 의존성을 플러그인 Gradle과 배포할 `Editor/*Dependencies.xml`에 일치시킴(AAR이 외부 의존성을 합치지 않는다는 점은 위 'Android 플러그인' 항목). 다른 플러그인이 제공하는 전이 의존성에 우연히 기대지 않음.
- [ ] 호환성은 POM만이 아니라 AAR의 `AndroidManifest.xml`과 `META-INF/com/android/build/gradle/aar-metadata.properties`로 확인. `minSdk`(매니페스트), `minCompileSdk`·`minCompileSdkExtension`·`minAndroidGradlePluginVersion`(`aar-metadata.properties`)은 서로 다른 하한이며 버전 선택의 교환 조건을 명시([AarMetadata DSL](https://developer.android.com/reference/tools/gradle-api/9.0/com/android/build/api/dsl/AarMetadata)과 [AGP `AarMetadataTask` 소스](https://android.googlesource.com/platform/tools/base/+/refs/heads/mirror-goog-studio-main/build-system/gradle-core/src/main/java/com/android/build/gradle/internal/tasks/AarMetadataTask.kt)가 쓰는 [`SdkConstants`](https://android.googlesource.com/platform/tools/base/+/refs/heads/mirror-goog-studio-main/common/src/main/java/com/android/SdkConstants.java)의 상수 값으로 키 이름 확인, 2026-10-15; DSL 속성명은 `minAgpVersion`이고 파일 키는 `minAndroidGradlePluginVersion`). 소비 프로젝트에서 다른 의존성이 더 높은 버전을 선택할 수 있으므로 실제 resolved 버전도 확인.
- [ ] 배포한 XML을 소비 프로젝트의 의존성 관리자(EDM4U 또는 Unity EDM)가 읽는 경로를 직접 실행. XML 좌표를 따로 읽어 만든 Gradle 소비 APK는 DEX 포함 검증에는 유효하지만 관리자의 XML 탐색·템플릿 주입 검증을 대신하지 않음.
- [ ] 검증 프로젝트에서 다른 프로젝트의 `Library/PackageCache`를 `file:`로 직접 참조하지 않음. 패키지를 검증 작업 디렉터리에 복사해 embedded 또는 독립 local package로 사용하여 importer·VersionHandler가 원본 캐시를 변경하는 경로를 피함. 기존 프로젝트의 참조를 바꾼 경우 캐시된 패키지 등록이 남을 수 있으므로, 변경된 상태가 적용된 실행에서 `PackageInfo.source`·`resolvedPath`가 복사본을 가리키고 시작 로그에 원본 경로 등록이 없는지 확인. 디렉터리 분리는 OS 보안 샌드박스라는 뜻이 아님.
- [ ] 패키지 임포트와 Resolver 실행을 별도 Unity 프로세스로 분리. Resolve 전에 XML 존재와 패키지 내부 항목과의 바이트 일치를 확인. 의존성이 없는 상태에서도 성공을 반환할 수 있으므로 종료 코드·반환값만으로 포함을 판정하지 않음.
- [ ] Custom Main Gradle Template 경로는 `-buildTarget Android`로 실행하고 `mainTemplate.gradle`을 준비. Jetifier를 켠 구성에서는 `gradleTemplate.properties`도 준비하며, 실제 소비 프로젝트에서 사용하는 `settingsTemplate.gradle`도 맞춤. 수동 의존성 선언으로 검증 대상을 가리지 않음.
- [ ] 실제 `ResolveSync(true)`의 성공과 Resolver 블록 안의 의존성 좌표·`*Dependencies.xml:행` 출처 주석을 함께 확인. 이 결과를 자동 해석이나 AAR 복사 모드의 검증으로 확대하지 않고, 소비자에게 검증한 Force Resolve 절차를 안내. `ResolveSync`는 EDM4U 1.2.188의 API이며 Unity EDM 2.1.1의 `Google.JarResolver.dll`에도 같은 이름의 심볼 문자열이 있으나 호출 동작은 확인하지 않았으므로 Unity EDM에서는 설치본으로 다시 확인. Unity EDM 2.1.0 변경 기록이 AAR Resolution 모드 제거를 기재하므로 AAR 복사 모드 확인은 EDM4U에 한정될 수 있음.
- [ ] 패키지 SHA-256·DLL 버전·AAR·XML·`.meta` GUID를 소스와 임포트 결과에 대조. 같은 버전의 미배포 수정본은 파일명만으로 식별하지 않음. 소스와 새 `.meta`는 저장소 정책에 따라 함께 보존하며, 커밋 승인 전에는 미커밋 상태를 명시.

Unity 2022.3.62f3·EDM4U 1.2.188에서 Custom Main Gradle Template 경로를 확인한 절차이며, 다른 버전·해석 모드는 실제 설치본으로 재확인합니다. EDM4U 1.2.189·1.2.190과 Unity EDM 2.x에서는 이 절차를 재실행하지 않았습니다. 실기기 UI·첨부파일 동작은 별도 검증입니다.

근거: [EDM4U 1.2.188 구성 및 템플릿 주입](https://github.com/googlesamples/unity-jar-resolver/blob/v1.2.188/README.md), [ResolveSync 구현](https://github.com/googlesamples/unity-jar-resolver/blob/v1.2.188/source/AndroidResolver/src/PlayServicesResolver.cs), [설정 구현](https://github.com/googlesamples/unity-jar-resolver/blob/v1.2.188/source/AndroidResolver/src/SettingsDialog.cs). 현황은 [EDM4U 1.2.190 릴리스 노트](https://github.com/googlesamples/unity-jar-resolver/releases/tag/v1.2.190)와 [EDM4U README의 archive 안내](https://github.com/googlesamples/unity-jar-resolver), [Unity EDM 문서](https://docs.unity3d.com/Packages/com.unity.external-dependency-manager@2.1/manual/index.html)·[설치와 관리자 선택](https://docs.unity3d.com/Packages/com.unity.external-dependency-manager@2.1/manual/get-started-with-edm.html)·[Android Resolver](https://docs.unity3d.com/Packages/com.unity.external-dependency-manager@2.1/manual/get-started-with-android-resolver.html)·[Android 설정](https://docs.unity3d.com/Packages/com.unity.external-dependency-manager@2.1/manual/android-resolver-settings-reference.html)·[Version Handler(deprecated) 표기가 있는 사용 안내](https://docs.unity3d.com/Packages/com.unity.external-dependency-manager@2.1/manual/use-edm-in-your-project.html)·[변경 기록](https://docs.unity3d.com/Packages/com.unity.external-dependency-manager@2.1/changelog/CHANGELOG.html)에서 2026-10-15에 확인했습니다.

동기화 상세는 [게임 네트워크 동기화](/game/network-sync.md), 보안은 [게임 보안](/security/game.md)·[리뷰 체크리스트](/security/review-checklist.md)에서 관리.

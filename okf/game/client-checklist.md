---
type: Checklist
title: 게임 클라이언트 기능/성능 체크리스트
description: 메모리·프레임·렌더링·에셋·수명·네트워크 상태·끊김 처리 순서·정상 종료의 명시 로그아웃·수신 큐 상한·메인 스레드 수신 처리율·RTT 계측과 캡처 정지·반응성·플랫폼과 Unity Android 의존성 배포·EDM4U 실경로 검증 체크리스트.
tags: [game, client, performance, networking, checklist, unity, android, aar, edm4u]
timestamp: 2026-10-11T00:00:00Z
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
- [ ] 끊김 처리 순서: 네트워크 스레드가 끊김을 감지해도 게임 스레드가 아직 처리하지 않은 수신 메시지가 남아 있을 수 있음. 세션 상태 초기화(채널 이탈 통지·초기화 플래그 해제)는 같은 수신 큐에 종료 표시로 넣어 게임 스레드가 순서대로 처리하게 함. 다음 접속에서야 올라가는 generation은 재접속 대기 중 처리되는 이전 연결 메시지를 막지 못함
- [ ] 정상 종료와 로그아웃: 창 닫기·Alt+F4·모바일 Back 같은 정상 종료에서 명시 로그아웃을 보내지 않으면 서버는 연결 손실로 보고 재접속 유예 동안 캐릭터를 붙잡아 같은 계정의 즉시 재접속을 거절한다. 엔진의 자동 종료를 가로채(Godot는 `auto_accept_quit`·`quit_on_go_back`을 끄고 `NOTIFICATION_WM_CLOSE_REQUEST`·go-back 처리) 세션이 묶인 상태에서만 로그아웃을 한 번 보내고, 메인 스레드에서 transport를 계속 pump하며 서버의 연결 종료나 짧은 상한(수 초)까지 기다린 뒤 종료한다. 로그아웃 뒤에는 다른 송신과 상태를 바꾸는 진입점(이전 요청·설치·ACK·재접속)을 모두 막아 상한이 늘어나지 않게 한다. 지역 이전 확정과 겹치면 이전 binding의 로그아웃이 버려질 수 있으므로, 대기 중 이전 확정을 받으면 새 binding으로 한 번 더 보낸다. 연결 종료는 서버의 소유 반환 완료 증거가 아니다. 로그아웃을 보내지 못한 강제 종료는 이미 확인된 세션을 여전히 유예로 남기며, 확인되지 않은 신규 세션은 [네트워크 동기화](/game/network-sync.md)의 grace 기준대로 유예 없이 정리된다. 검증은 종료 직후 같은 계정의 즉시 재접속으로 한다.
- [ ] 수신 큐 상한: 게임 루프가 멈춘 동안(일시정지·로딩) 네트워크 스레드가 받은 메시지를 무한히 쌓거나 고정 크기 풀이 고갈돼 크래시하지 않음. 개수·바이트 상한을 넘으면 연결을 끊고 권위 상태로 재동기화하며, 밀린 큐는 프레임당 처리량을 늘려 따라잡음
- [ ] 메인 스레드 수신 처리율: 수신을 게임 루프에서 프레임마다 소비하고 transport가 소비 전까지 다음 frame을 읽지 않는 구조라면, 수신 처리율은 FPS에 묶인다(프레임당 연결별 1개). 정상 하향 frame 수(예: snapshot 주기+결과·시간 측정 응답)가 최저 지원 FPS보다 낮은지 확인하고, 로딩·장시간 정지 뒤 밀린 수신을 따라잡는 경로를 별도로 검증한다.
- [ ] RTT·지연 표시 계측: 자동화 렌더 테스트의 화면 캡처(GPU readback·PNG 인코딩)는 메인 스레드를 멈춘다. 그동안 도착한 응답은 처리되지 않아 HUD RTT가 부풀려진다. 실측 사례에서 250ms마다 캡처하면 FPS가 3~4로 떨어지고 RTT가 525ms→2.6초로 올랐으며, 캡처 없는 같은 실행은 7ms였다. 네트워크 지연은 캡처 없는 관찰 실행으로 따로 측정하고, 캡처 시점의 HUD 수치를 지연 근거로 쓰지 않는다.
- [ ] 실제 창 자동 검사와 OS 포커스: 포커스를 잃으면 이동·경로를 취소하는 제품 계약이 있으면, 실제 창에서 도는 자동 검사는 다른 프로세스가 전경 창을 가져가는 순간 이동이 막혀 기한 초과로 실패한다. 병렬 작업자(다른 에이전트·빌드·콘솔/셸 실행)가 새 콘솔 창을 열어도 포커스를 빼앗는다. 실제 창 실행 구간에는 창을 만드는 다른 실행을 직렬화하고(시작/종료 공지), 검사기는 포커스 변화와 전경 창을 실패마다 기록해 포커스 상실 실패와 다른 실패를 구분한다. 포커스가 유지된 실패는 포커스 원인으로 분류하지 않으며, 이후 통과한 재실행은 개별 실패의 원인을 입증하지 않는다.
- [ ] 플랫폼: 모바일 발열·배터리, 해상도·주사율 차이 대응
- [ ] Android 플러그인: 로컬 AAR의 외부 라이브러리 의존성을 Gradle/의존성 resolver에 명시하고, C# 컴파일과 별개로 최종 APK의 모든 DEX에 필요한 클래스 정의가 포함되는지 확인. Maven 배포는 의존성 메타데이터를 제공하지만 로컬 AAR 파일만 복사하는 경로에서는 이를 대신한다고 가정하지 않음([Android 라이브러리 문서](https://developer.android.com/studio/projects/android-library#AddDependency)).
- [ ] Android 클래스 누락: `NoClassDefFoundError`의 정확한 클래스와 호출 위치를 기기 로그→플러그인 바이트코드→최종 APK 정의로 대조. 클래스 참조 문자열만으로 포함을 판정하지 않고 알려진 포함 클래스로 검사기의 양성 대조를 수행. `androidx.core`와 `androidx.webkit`은 별도 artifact이며, [`WebViewAssetLoader`](https://developer.android.com/reference/androidx/webkit/WebViewAssetLoader)는 `androidx.webkit:webkit`에 속함. 이전 export나 에디터 실행을 현재 APK의 기기 실행 검증으로 대체하지 않음.

## Unity Android 의존성 배포 검증

- [ ] SDK의 직접 사용하는 외부 의존성을 플러그인 Gradle과 배포할 `Editor/*Dependencies.xml`에 일치시킴. 일반 AAR의 `implementation` 선언은 외부 라이브러리의 클래스나 Maven 메타데이터를 AAR 파일에 자동 합치지 않음. 다른 플러그인이 제공하는 전이 의존성에 우연히 기대지 않음.
- [ ] 호환성은 POM만이 아니라 AAR의 `AndroidManifest.xml`과 `META-INF/com/android/build/gradle/aar-metadata.properties`로 확인. `minSdk`, `minCompileSdk`, `minAndroidGradlePluginVersion`은 서로 다른 하한이며 버전 선택의 교환 조건을 명시. 소비 프로젝트에서 다른 의존성이 더 높은 버전을 선택할 수 있으므로 실제 resolved 버전도 확인.
- [ ] 배포한 XML을 EDM4U가 읽는 경로를 직접 실행. XML 좌표를 따로 읽어 만든 Gradle 소비 APK는 DEX 포함 검증에는 유효하지만 EDM4U의 XML 탐색·템플릿 주입 검증을 대신하지 않음.
- [ ] 검증 프로젝트에서 다른 프로젝트의 `Library/PackageCache`를 `file:`로 직접 참조하지 않음. 패키지를 검증 작업 디렉터리에 복사해 embedded 또는 독립 local package로 사용하여 importer·VersionHandler가 원본 캐시를 변경하는 경로를 피함. 기존 프로젝트의 참조를 바꾼 경우 캐시된 패키지 등록이 남을 수 있으므로, 변경된 상태가 적용된 실행에서 `PackageInfo.source`·`resolvedPath`가 복사본을 가리키고 시작 로그에 원본 경로 등록이 없는지 확인. 디렉터리 분리는 OS 보안 샌드박스라는 뜻이 아님.
- [ ] 패키지 임포트와 Resolver 실행을 별도 Unity 프로세스로 분리. Resolve 전에 XML 존재와 패키지 내부 항목과의 바이트 일치를 확인. 의존성이 없는 상태에서도 성공을 반환할 수 있으므로 종료 코드·반환값만으로 포함을 판정하지 않음.
- [ ] Custom Main Gradle Template 경로는 `-buildTarget Android`로 실행하고 `mainTemplate.gradle`을 준비. Jetifier를 켠 구성에서는 `gradleTemplate.properties`도 준비하며, 실제 소비 프로젝트에서 사용하는 `settingsTemplate.gradle`도 맞춤. 수동 의존성 선언으로 검증 대상을 가리지 않음.
- [ ] 실제 `ResolveSync(true)`의 성공과 Resolver 블록 안의 의존성 좌표·`*Dependencies.xml:행` 출처 주석을 함께 확인. 이 결과를 자동 해석이나 AAR 복사 모드의 검증으로 확대하지 않고, 소비자에게 검증한 Force Resolve 절차를 안내.
- [ ] 패키지 SHA-256·DLL 버전·AAR·XML·`.meta` GUID를 소스와 임포트 결과에 대조. 같은 버전의 미배포 수정본은 파일명만으로 식별하지 않음. 소스와 새 `.meta`는 저장소 정책에 따라 함께 보존하며, 커밋 승인 전에는 미커밋 상태를 명시.

Unity 2022.3.62f3·EDM4U 1.2.188에서 Custom Main Gradle Template 경로를 확인한 절차이며, 다른 버전·해석 모드는 실제 설치본으로 재확인합니다. 실기기 UI·첨부파일 동작은 별도 검증입니다.

근거: [EDM4U 1.2.188 구성 및 템플릿 주입](https://github.com/googlesamples/unity-jar-resolver/blob/v1.2.188/README.md), [ResolveSync 구현](https://github.com/googlesamples/unity-jar-resolver/blob/v1.2.188/source/AndroidResolver/src/PlayServicesResolver.cs), [설정 구현](https://github.com/googlesamples/unity-jar-resolver/blob/v1.2.188/source/AndroidResolver/src/SettingsDialog.cs).

동기화 상세는 [게임 네트워크 동기화](/game/network-sync.md), 보안은 [게임 보안](/security/game.md)·[리뷰 체크리스트](/security/review-checklist.md)에서 관리.

---
type: Concept
title: Godot와 C++ 게임 개발
description: Godot·godot-cpp 공식 버전 핀과 GDExtension·엔진 모듈 선택 기준, 검증 범위를 정리하고 세부 주제는 하위 개념으로 안내합니다.
tags: [game, godot, cpp, gdextension, physics, combat, networking, simulation, ui, build, ownership, performance, camera, isometric]
timestamp: 2026-10-12T00:00:00Z
---

# Godot와 C++ 게임 개발

공식 API 사실과 프로젝트에서 선택할 정책을 구분합니다. 코드 작성 전 [코딩 스타일](/coding-style.md)과 [언어 공통 코딩 스타일](/language-style.md)의 공통 규칙, [C/C++ 전용 코딩 규칙](/language-style-c-cpp.md)을 읽고 기존 프로젝트 계약과 Godot의 외부 API 이름을 보존합니다. 사용자·프로젝트별 게임 개발 목적이 있으면 [축적 지식 발견 경로](/learned/index.md)에서 해당 concept을 추가로 확인합니다.

## 하위 개념

* [Godot C++ 성능 중심 시뮬레이션 코어](/game/godot-simulation.md) - 성능 병목을 C++ 코어로 옮기는 경계와 메모리·로딩(UI 리소스·threaded-load 회수 포함)·물리·네트워크 부하의 설계, 성능 수락 기준을 정리합니다.
* [godot-cpp 빌드·등록·디버깅·export와 실행 검증](/game/godot-build.md) - godot-cpp 확장의 API·ABI 호환성, SCons 빌드와 로드 경로, 클래스 등록·이름 계약, 디버깅·export, 프로젝트 설정·addon 의존성과 smoke 절차를 정리합니다.
* [Godot C++ Scene·물리·Resource 수명과 경계](/game/godot-runtime.md) - Scene 생명주기와 소유권(에디터 복제·부분 생성 보호 포함), 물리·프레임·스레드 경계, Resource 직렬화와 성능·서버 권위 선택의 규칙을 정리합니다.
* [Godot UI 재사용과 입력·텍스트·HUD 표시](/game/godot-ui.md) - 재사용 UI의 계약과 터치·입력 처리, 레이아웃·텍스트·폰트, 창과 HUD 표시 및 입력 검증 규칙을 정리합니다.
* [Godot 2D 시야·카메라와 자동 사냥 대상](/game/godot-2d-view.md) - 2D 시야와 이동감, 아이소메트릭 맵 가장자리 카메라, 화면 안 공격 사거리와 자동 사냥 대상 선택 규칙을 정리합니다.
* [Godot 에셋 팩·타일 조립·렌더 정밀도와 에디터 미리보기](/game/godot-assets-editor.md) - 구매 에셋 팩 검수와 타일 조립·앞뒤 정렬, 생성 건물 다양성, 렌더 데이터 정밀도와 에디터 미리보기 규칙을 정리합니다.

## 확인 기준과 버전 고정

**자료 확인일은 2026-09-26이며 2026-10-12에 아래 표를 공식 아카이브·릴리스·태그에서 다시 조회했습니다(개발판 행만 바뀌었습니다). 확인일은 아래 발표일과 다릅니다.** 검색으로 출처를 찾은 다음 공식 발표·문서·태그 원문을 직접 확인했습니다.

| 구분 | 확인한 사실 | 공식 근거 |
|---|---|---|
| 최신 Godot 안정판 | **4.7.2-stable**, 발표일 **2026-08-18** | [공식 전체 아카이브](https://godotengine.org/download/archive/), [4.7.2 발표](https://godotengine.org/article/maintenance-release-godot-4-7-2/) |
| Godot 엔진 소스 | `4.7.2-stable` → `ed1daf0bf001b61586d9930840f2f1394092c079` | [공식 태그 조회](https://api.github.com/repos/godotengine/godot/git/ref/tags/4.7.2-stable), 발표 본문의 빌드 커밋과 일치합니다. |
| 개발판 | 아카이브의 4.8 최신 항목은 **4.8-dev7**, 발표일 **2026-09-29**(feature freeze 안내)입니다. 2026-09-26 확인 때의 최신은 4.8-dev6(2026-09-15)이었고 2026-10-12에 dev7로 바뀌었습니다. 안정판이 아닙니다. | [공식 전체 아카이브](https://godotengine.org/download/archive/), [4.8-dev7 발표](https://godotengine.org/article/dev-snapshot-godot-4-8-dev-7/), [4.7 릴리스 정책](https://docs.godotengine.org/en/4.7/about/release_policy.html) |
| 공식 C++ 바인딩 | **godot-cpp 10.0.0-stable**, 공개일 **2026-09-15**, `prerelease=false` | [공식 릴리스](https://github.com/godotengine/godot-cpp/releases/tag/10.0.0-stable), [릴리스 API의 published_at](https://api.github.com/repos/godotengine/godot-cpp/releases?per_page=5) |
| 바인딩 소스 핀 | `10.0.0-stable` → `507ed9d840c01a3c5b2a39af8bb4000bfac30bf5` | [공식 태그 조회](https://api.github.com/repos/godotengine/godot-cpp/git/ref/tags/10.0.0-stable) |
| 바인딩 버전 체계 | v10부터 엔진과 **독립 버전**입니다. 이 핀의 내장 API 대상은 `4.3`, `4.4`, `4.5`, `4.6`, `4.7`입니다. | [핀의 README](https://github.com/godotengine/godot-cpp/blob/507ed9d840c01a3c5b2a39af8bb4000bfac30bf5/README.md), [핀의 supported_api_versions](https://github.com/godotengine/godot-cpp/blob/507ed9d840c01a3c5b2a39af8bb4000bfac30bf5/tools/godotcpp.py) |

**출처 간 차이도 보존합니다.** [4.7 입문 문서](https://docs.godotengine.org/en/4.7/tutorials/scripting/cpp/gdextension_cpp_example.html)는 여전히 엔진과 같은 `4.x` 브랜치를 선택하는 이전 방식을 설명합니다. 그러나 godot-cpp 저장소의 브랜치 목록(조회 2026-10-12)에서 버전 브랜치는 `4.5`가 마지막이며 `4.6`·`4.7` 브랜치가 없고, 엔진 버전 이름의 마지막 바인딩 태그도 `godot-4.5-stable`이며 `godot-4.6.*`·`godot-4.7.*` 태그가 없습니다([브랜치 API](https://api.github.com/repos/godotengine/godot-cpp/branches?per_page=30), [태그 API](https://api.github.com/repos/godotengine/godot-cpp/tags?per_page=100)). v10에는 위 릴리스의 README·빌드 소스를 적용하며 존재하지 않는 `godot-4.7.2-stable` 바인딩 태그나 `4.7` 브랜치를 만들어 쓰지 않습니다. 릴리스 API는 `10.0.0-rc1`·`rc2`에도 `prerelease=false`를 표시하므로 이 플래그만으로 안정판을 판정하지 않습니다. RC라는 이름과 정식 `10.0.0-stable` 발표를 함께 확인합니다.

**프로젝트 선택:** 신규 4.7 프로젝트의 출발점은 엔진·export templates `4.7.2`, 바인딩 위 커밋, API 대상 `4.7`로 고정할 수 있습니다. 이는 이 조합을 실제 게임에서 실행 검증했다는 뜻은 아닙니다. 기존 프로젝트는 검증된 핀을 유지하고 의도적인 업그레이드 변경에서만 교체합니다.

- 엔진 바이너리/커밋, export templates 버전, 바인딩 submodule 커밋, API JSON 또는 `api_version`, 컴파일러·SDK·아키텍처·정밀도·빌드 옵션을 함께 기록합니다. 움직이는 `master`, `stable`, `/latest/` 문서를 빌드 잠금 대신 사용하지 않습니다.
- 새 기능·버그 수정·보안/플랫폼 요구로 업그레이드를 검토할 때 공식 아카이브와 릴리스·태그를 다시 열고 **확인일과 발표일을 각각 갱신**합니다. 읽을 때마다 의존성을 자동 업그레이드하지 않습니다.
- 패치 업데이트는 공식적으로 권장되지만, 프로젝트 사본/버전 관리와 [실행 가능한 smoke 절차](/game/godot-build.md#실행-가능한-smoke-절차)의 editor·export 실행 검증을 거쳐 핀을 갱신합니다. minor 변경에는 마이그레이션과 동작 변화도 검토합니다. 같은 minor 계열은 최신 패치만 지원되며, 정책 표(확인 2026-10-12)는 4.7·4.6을 전체 지원, 4.5를 보안·플랫폼 지원만, 4.x 중 4.0~4.4를 지원 종료로 표시합니다. 이전 major인 3.6은 같은 표에서 별도로 지원 중입니다. godot-cpp v10 핀이 `api_version` 4.3·4.4를 받더라도 해당 엔진 계열의 지원 종료 상태와는 별개입니다. [공식 정책](https://docs.godotengine.org/en/4.7/about/release_policy.html)

## GDExtension과 엔진 모듈 선택

**사실:** `godot-cpp`는 Godot 프로젝트가 유지하는 공식 C++ GDExtension 바인딩입니다. GDExtension은 엔진을 다시 빌드하지 않고 네이티브 라이브러리를 로드하며 대부분의 스크립트 API에 접근합니다. 엔진 모듈은 엔진 내부까지 더 깊이 접근하지만 엔진과 필요한 플랫폼의 export templates를 함께 다시 빌드해야 합니다. [공식 비교](https://docs.godotengine.org/en/4.7/tutorials/scripting/cpp/about_godot_cpp.html)

**선택 기준:** 게임 로직, 계산 병목, 외부 C/C++ 라이브러리 통합에 공개 API가 충분하면 GDExtension을 먼저 선택합니다. 필요한 내부 기능이 노출되지 않았거나 엔진 자체 변경이 요구되면 모듈을 검토합니다. C++ 사용 자체를 성능 증거로 보지 않고 프로파일링으로 이동할 경계를 정합니다. Godot 3의 GDNative 예제를 Godot 4의 GDExtension 등록 코드와 혼합하지 않습니다.

## 검증 범위와 공개 근거

이 문서는 공식 4.7 문서와 위에 고정한 엔진/바인딩 릴리스·태그·소스를 근거로 하며, 각 항목에 명시한 Godot UI·시그널·직렬화 실행 관찰은 해당 사례의 검증 기록입니다. **개별 사례의 실행 관찰은 이 문서와 하위 개념의 C++ 예제·빌드 조합·플랫폼별 editor/headless/export·디버거 절차 전체를 실행 검증했다는 뜻이 아닙니다.** 코드·명령 예제는 소스 계약을 근거로 한 적용 지침이며 플랫폼별 실행 성공 증거가 아닙니다. 실제 프로젝트에 적용할 때는 [실행 가능한 smoke 절차](/game/godot-build.md#실행-가능한-smoke-절차)로 해당 조합과 동작을 별도 검증합니다.

개인 선호나 내부 사례를 공개 기술 사실로 옮기지 않았습니다. 확인일 이후의 최신판 여부와 개별 플랫폼 조합의 지원 여부는 재검증 대상이며, 문서·릴리스 메타데이터가 어긋나면 차이를 명시하고 해당 핀의 소스를 우선 확인합니다.

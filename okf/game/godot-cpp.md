---
type: Concept
title: Godot와 C++ 게임 개발
description: Godot·godot-cpp 버전 핀과 출처 간 차이, 임의 업그레이드 금지, 4.5~4.7 동작 변경의 확인 경로, 하위 개념(시뮬레이션 코어·빌드·수명·UI·에셋) 안내입니다.
tags: [game, godot, cpp, gdextension, version-pin]
apply_on_edit: ["project.godot", "*.gd", "*.tscn", "*.tres", "*.gdextension", "*.gdshader"]
timestamp: 2026-10-23T00:00:00Z
---

# Godot와 C++ 게임 개발

개발 방향(성능 중심 C++ 코어와 얇은 Godot 연결부, 서버로 옮길 수 있는 엔진 비의존 코어)의 정본은 [개발 방향](/direction.md)입니다. 이 문서와 하위 개념은 Godot·godot-cpp의 버전 특정 사실과, 그 위에서 Godot 연결부가 지키는 경계만 둡니다. C++ 이름 표기는 [언어 공통 코딩 스타일](/language-style.md)과 [C/C++ 전용 코딩 규칙](/language-style-c-cpp.md), 프로젝트별 지식은 [축적 지식 발견 경로](/learned/index.md)를 따릅니다.

## 하위 개념

* [Godot C++ 성능 중심 시뮬레이션 코어](/game/godot-simulation.md)
* [godot-cpp 빌드·등록·디버깅·export와 실행 검증](/game/godot-build.md)
* [Godot C++ Scene·물리·Resource 수명과 경계](/game/godot-runtime.md)
* [Godot UI 입력·텍스트·HUD 표시](/game/godot-ui.md)
* [Godot 에셋 팩·렌더 정밀도와 에디터 미리보기](/game/godot-assets-editor.md)

## 확인 기준과 버전 고정

자료 확인일은 2026-10-15이며 공식 아카이브·릴리스·태그 원문을 직접 확인했습니다. 확인일은 발표일과 다릅니다.

| 구분 | 확인한 사실 | 근거 |
|---|---|---|
| Godot 안정판 | **4.7.2-stable**, 발표 2026-08-18, 커밋 `ed1daf0bf001b61586d9930840f2f1394092c079` | [4.7.2 발표](https://godotengine.org/article/maintenance-release-godot-4-7-2/), [아카이브](https://godotengine.org/download/archive/) |
| godot-cpp | **10.0.0-stable**, 공개 2026-09-15, 커밋 `507ed9d840c01a3c5b2a39af8bb4000bfac30bf5` | [릴리스](https://github.com/godotengine/godot-cpp/releases/tag/10.0.0-stable) |
| 버전 체계 | v10부터 엔진과 **독립 버전**이며, 이 핀의 API 대상은 `4.3`~`4.7`입니다. | [핀의 README](https://github.com/godotengine/godot-cpp/blob/507ed9d840c01a3c5b2a39af8bb4000bfac30bf5/README.md) |

하위 개념의 "4.7.2"·"v10 핀"은 이 조합을 뜻하며, 코드·명령은 소스·문서 근거의 적용 지침이지 실행 성공의 증거가 아닙니다. 프로젝트에서 해당 조합을 직접 실행해 확인하고, 문서·릴리스 메타데이터가 어긋나면 차이를 적고 핀의 소스를 우선합니다.

**출처 간 차이:** [4.7 입문 문서](https://docs.godotengine.org/en/4.7/tutorials/scripting/cpp/gdextension_cpp_example.html)는 엔진과 같은 `4.x` 브랜치를 선택하라고 설명하지만, godot-cpp 저장소의 브랜치는 `4.5`가 마지막이고 `godot-4.6.*`·`godot-4.7.*` 태그가 없습니다(조회 2026-10-15, [브랜치 API](https://api.github.com/repos/godotengine/godot-cpp/branches?per_page=30), [태그 API](https://api.github.com/repos/godotengine/godot-cpp/tags?per_page=100)). v10에는 위 릴리스의 README·빌드 소스를 적용하고 없는 `godot-4.7.2-stable` 태그나 `4.7` 브랜치를 만들어 쓰지 않습니다. 릴리스 API는 `10.0.0-rc1`·`rc2`에도 `prerelease=false`를 표시하므로 이 플래그만으로 안정판을 판정하지 않습니다.

**업그레이드:** 이 문서를 읽었다는 이유로 엔진·바인딩·API 대상을 올리지 않습니다. 기존 프로젝트는 검증된 핀을 유지하고, 사용자가 업그레이드를 정했을 때만 공식 아카이브·릴리스·태그를 다시 확인해 확인일과 발표일을 각각 갱신합니다.

**4.5~4.7 동작 변경:** 4.4까지의 지식으로 쓴 코드가 오류 없이 다르게 동작하는 변경이 있으므로, 하위 시스템을 다루기 전에 공식 [4.5](https://docs.godotengine.org/en/4.7/tutorials/migrating/upgrading_to_godot_4.5.html)·[4.6](https://docs.godotengine.org/en/4.7/tutorials/migrating/upgrading_to_godot_4.6.html)·[4.7](https://docs.godotengine.org/en/4.7/tutorials/migrating/upgrading_to_godot_4.7.html) 업그레이드 문서의 해당 절을 확인합니다. 예: 다른 객체의 packed array 프로퍼티 원소 대입(`holder.values[0] = 9`)은 값은 바꾸지만 그 프로퍼티의 setter를 부르지 않으므로(전체 대입만 부름) setter에 둔 dirty 표시·갱신이 빠집니다([GH-113228](https://github.com/godotengine/godot/pull/113228), 4.7.2 headless 실행 확인 2026-10-23). Resource 깊은 복제는 [수명과 경계](/game/godot-runtime.md), 입력 장치 ID는 [UI 입력](/game/godot-ui.md)에 둡니다.

---
type: Concept
title: 데이터 형식·콘텐츠 변환·저장 복원
description: wire·파일의 명시적 인코딩, 값 분포별 압축 선택, 저작 데이터 검증, 객체 그래프 저장·복원과 오디오 청크 수락 기준을 다룹니다.
tags: [development, serialization, assets, save, load, protocol, encoding, audio]
timestamp: 2026-10-15T00:00:00Z
---

# 데이터 형식·콘텐츠 변환·저장 복원

앱·웹·서비스·게임의 파일/wire 형식과 프로세스 안 객체 표현을 분리합니다. 전송 프레이밍은 [네트워크 I/O](/development/network-io.md), 관계형 저장은 [DB 설계](/database/design.md), 저작·게시·버전 교체·조회/로딩은 [데이터 생명주기](/development/data-lifecycle.md)가 정본입니다.

본문의 체크포인트·투사체·온라인 경제는 게임 적용 사례입니다. 해당 내구 커밋·소유권의 게임 정책은 [게임 서버 영속화](/game/server-persistence.md)를, 콘텐츠 identity·소유권 펜싱의 공통 계약은 [서비스 수명](/development/service-lifecycle.md)을, 게임 정적/동적 분류와 권위 데이터 배포는 [게임 정적 데이터](/game/static-data.md)를 함께 확인합니다. 다른 도메인에 게임의 저장 정책을 강제하지 않습니다.

## 바이트 표현과 호환

- 필드별 폭·부호·바이트 순서·문자열 인코딩·길이 단위를 명시합니다. plain `char`의 부호, `int`/`long`의 크기, 구조체 padding·포인터·vtable을 wire/파일 계약으로 쓰지 않습니다. `pack(1)`은 엔디안·타입 의미·수명을 해결하지 않습니다. 불가피한 패킹은 범위를 `push/pop`으로 격리하고 비정렬 데이터를 타입 포인터로 임의 역참조하지 않습니다([C++ 타입](https://en.cppreference.com/w/cpp/language/types), [MSVC pack](https://learn.microsoft.com/en-us/cpp/preprocessor/pack)).
- 명시적 스키마가 레이아웃을 정의하고 검증하는 zero-copy 형식이나 필드 비트 복사용 `memcpy`까지 금지하는 규칙은 아닙니다. 네트워크 헤더의 big-endian 관례를 모든 게임 payload에 강제하지 않고 선택한 형식대로 인코드·디코드합니다. golden bytes·다른 런타임의 decode·최대/최소/잘린 입력으로 대조합니다. 동일 구현끼리의 round-trip만으로 양쪽이 같은 잘못된 형식을 구현한 경우를 잡을 수는 없습니다.
- 정수 인코딩은 타입 이름보다 값 분포·음수 비율로 선택합니다. 작은 길이/카운터에 유리한 varint가 넓게 분포한 ID에는 더 클 수 있습니다. Protobuf의 음수 `int32/int64`와 ZigZag `sint32/sint64`도 구분합니다. 표현 가능한 길이는 할당 허용 상한이 아닙니다([Protobuf Encoding](https://protobuf.dev/programming-guides/encoding/), [scalar types](https://protobuf.dev/programming-guides/proto3/#scalar)).
- 외부 decoder·생성 런타임이 실패를 bool·오류 코드로 반환한다는 사실은 길이 필드를 안전하게 검사한다는 증거가 아닙니다. 부호 없는 길이를 범위 확인 없이 부호 있는 정수로 바꾼 뒤 `pos + len <= end`만 비교하면 음수 길이가 통과해 읽기 위치가 뒤로 가거나, 그 값이 크기 인수로 쓰여 거대한 할당이 일어날 수 있습니다. 덧셈 overflow도 같은 비교를 무력화합니다. 채택 전 음수로 해석되는 값·최대값·남은 크기 초과·잘린 입력이 거부되는지 확인하고, CDN·사용자 파일처럼 경로를 신뢰할 수 없는 데이터는 무결성 검증 뒤 decode합니다.
- 전송량은 불필요한 대상·필드·빈도를 먼저 줄이고 표현 폭·일반 압축의 이득을 비교합니다. 양자화에는 범위·정밀도·overflow 정책을 두고 ID·재화 같은 정확값과 표시 근사를 구분합니다. 예측 재실행의 시작 상태를 양자화하면 서버의 고정밀 상태와 달라질 수 있습니다. 압축은 wrapper·flush까지 포함한 실제 바이트와 CPU·메모리·지연으로 판정하며 작은 메시지에 일괄 적용하지 않습니다([Unity quantization](https://docs.unity3d.com/Packages/com.unity.netcode@1.4/manual/prediction-details.html#quantization-and-determinism), [zlib](https://zlib.net/manual.html)). 메시지 폐기의 공통 계약은 [전달 계약](/development/network-delivery.md), 게임 delta 복구는 [게임 전달 의미론](/game/network-delivery.md)을 유지합니다.

## 저작 데이터와 변환 도구

- 파싱 성공과 콘텐츠 유효성을 구분합니다. 필수 필드·중복 ID·범위/개수·교차 참조·스키마 버전을 검사하고 파일·위치와 함께 오류를 알립니다. 실패한 입력의 부분 결과를 정상 산출물로 게시하지 않습니다. 바이너리로 변환했다는 사실은 신뢰성이나 변조 방지의 증거가 아닙니다.
- 새 DSL·파서·두 종류 codec을 선행 구축하지 않습니다. 기존 엔진/표준 형식으로 계약을 충족하면 재사용합니다. 저작용 표현과 런타임 표현을 나누는 경우 변환 입력·옵션·콘텐츠 버전과 재생성 경로를 유지하고, 변환 산출물 자체도 수락 경계에서 확인합니다. 스크립트의 실행 권한·자원 제한은 [게임 보안](/security/game.md)을 따릅니다.
- 생성 헤더·데이터는 내용이 같으면 불필요하게 다시 쓰지 않아 timestamp 기반 전체 재빌드를 피합니다. 총 크기·로드 비용·채널/샘플/해상도 설정을 제작 도구에서 확인할 수 있게 합니다. 손실 압축한 출하물을 다음 빌드의 원본으로 삼지 않고 보존한 원본/무손실 정본에서 플랫폼별 산출물을 만듭니다. 개발 전용 경로·주석·테스트 훅의 출하 포함 여부도 확인합니다([CMake configure_file](https://cmake.org/cmake/help/latest/command/configure_file.html)은 내용 변경 시에만 timestamp를 갱신하는 기존 구현 사례입니다).
- 메모리 매핑 파일에 실행 주소나 우연히 확보된 고정 기준 주소를 저장하지 않습니다. 상대 오프셋·검증된 relocation 등 선택한 형식으로 참조하고 offset/길이/정렬을 검증합니다. 매핑 중 원본 파일의 truncate·교체·수정을 조정하지 않으면 유효 포인터처럼 보여도 접근이 실패할 수 있습니다. 매핑 수명과 파일 버전/불변성 계약을 둡니다([POSIX mmap](https://pubs.opengroup.org/onlinepubs/9799919799/functions/mmap.html)). 특수한 주소 공간 예약 설계를 전면 금지하는 규칙은 아닙니다.

## 저장 대상과 객체 그래프 복원

- 변경 가능한 엔티티 상태, 읽기 전용 타입 정의/리소스, 다시 만들 수 있는 캐시를 구분합니다. 체크포인트에서 무엇을 그대로 복원하고 무엇을 초기화할지 정합니다. 비행 중 투사체에 위치만 저장하는 식으로 재개에 필요한 속도·상태를 빠뜨리지 않습니다. 리소스를 ID로 참조하면 해당 버전의 가용성·호환도 저장 계약입니다.
- 프로세스 주소·엔진 런타임 객체 ID를 영속 identity로 쓰지 않습니다. 저장 그래프의 ID를 기록하고 객체 생성→참조 연결 단계로 순환·공유 참조를 복원합니다. 중복 ID·미지 타입·필수 참조 누락은 실패로 처리하고 선택적 참조의 부재는 명시한 의미로 처리합니다. 모든 형식에 두 단계 로더를 새로 만들라는 뜻이 아니라 그래프를 복원하는 라이브러리의 보장을 확인하는 기준입니다.
- 로드 완료 전에 부분 복원 객체가 월드·UI·다른 관리자에 정상 상태로 노출되지 않게 합니다. 형식/콘텐츠 버전의 지원·마이그레이션·명시적 거절을 정하고, 저장→새 프로세스 로드에서 값·참조 공유·누락/구버전 실패를 확인합니다. 로컬 세이브 복원 성공은 온라인 경제의 신뢰 근거가 아닙니다.

## 오디오 파일 수락

- 엔진의 검증된 importer/decoder를 우선합니다. 자체 WAV 로더가 필요하면 고정 크기 헤더 뒤 전체가 음성 데이터라고 가정하지 않습니다. RIFF/WAVE 청크 ID·길이·남은 범위를 따라 `fmt `·`data`를 찾고, 홀수 청크의 padding을 payload 길이와 구분합니다. 선택적 청크·확장 헤더·잘린 입력을 처리합니다([RIFF](https://learn.microsoft.com/en-us/windows/win32/xaudio2/resource-interchange-file-format--riff-)).
- 확장자만으로 PCM을 가정하지 않고 format tag·채널 수·샘플 폭·지원 조합을 확인합니다. PCM/IEEE float의 block alignment와 샘플 프레임 배수를 검사하며 이 공식을 블록 압축 형식에 그대로 쓰지 않습니다. 다채널을 단순히 stereo로 취급하지 않습니다([WAVEFORMATEX](https://learn.microsoft.com/en-us/windows/win32/api/mmreg/ns-mmreg-waveformatex)).

## 근거와 적용 범위

- 『게임 프로그래머를 위한 C++』 한국어판 PDF p.369–383의 엔티티/리소스·ID/fixup·저장본 호환, *Game Programming Tricks of the Trade* 한국어판 PDF p.140–145의 이식 가능한 데이터 표현, 『온라인 네트워크 게임 프로그래밍』 PDF p.489–495, 566, 590–595의 WAV·패킷 예제를 대조했습니다.
- *Game Programming Gems 3* 한국어판 1.11(예제 PDF p.156)의 데이터 변환, 5.5(p.637–646)의 직렬화, 5.9(p.684–686)의 전송량 절감을 보강했습니다. 필수 필드·참조 무결성·부분 게시 금지는 예제의 미검증 가정을 현행 입력 경계에 적용해 도출한 기준이며 책의 완성 구현이라고 주장하지 않습니다.
- *Game Coding Complete* 1판 한국어 제공본 PDF p.116–118, 331–347의 메모리 매핑·원본/출하물·생성 헤더를 보강했습니다. 특정 압축 포맷·빌드 도구로 교체하라는 지시가 아닙니다.
- 현대 문서 확인: 2026-10-15. 책의 구조체 통째 송신·잘못된 패킹 pragma·주소 저장·고정 WAV 헤더를 현재 구현으로 채택하지 않습니다. 특정 압축률·텍스트/바이너리의 일률적 성능 우열도 이 자료로 보장하지 않습니다.

## 부분 생성의 보호와 게시
- **부분 생성의 보호 hash:** 파일/노드 identity와 의미 없는 자식 방문 순서·에디터 전용 metadata를 분리합니다. 저장된 기준선과 비교하는 hash 규칙이 바뀌면 버전을 올리고 기존 장면을 조용히 새 기준선으로 덮지 않습니다. 선택하지 않은 수동 편집·잠금, 전역 공유 리소스, 경계 연결을 검사한 뒤 변경할 부분만 적용하며 디스크 게시와 메모리 Undo를 구분합니다.

---
type: Concept
title: 오디오의 로드·디코딩·스트리밍 계약
description: 상주/압축/스트리밍·voice 가상화, 소비 완료·버퍼 재사용, 공간/시간 단위·효과·평활화와 실시간 callback·그래프 의존성을 다룹니다.
tags: [development, client, audio, streaming, resources, memory, performance]
timestamp: 2026-10-15T00:00:00Z
---

# 오디오의 로드·디코딩·스트리밍 계약

앱·웹 오디오·미디어·게임에서 엔진의 importer·decoder·재생기를 우선합니다. 파일 해석은 [오디오 파일 수락](/development/data-formats.md#오디오-파일-수락), 일반 메모리 예산은 [런타임 진단](/development/runtime-diagnostics.md)을 따릅니다. 게임의 효과음·공간 차폐는 적용 사례이며 모든 앱의 요구가 아닙니다.

## 로드·동시 재생 예산

- 배포 파일 크기만으로 런타임 비용을 판단하지 않습니다. 클립 길이·반복 빈도·최대 동시 voice, 디코딩 CPU, 압축/해제 상주량과 I/O·임시 버퍼 피크를 함께 보고 사전 해제·압축 상주·스트리밍을 선택합니다. 짧고 잦은 SFX의 사전 해제는 재생 CPU를 줄이는 대신 메모리를 쓰고 긴 스트림도 클립별 버퍼·관리 비용이 있습니다([Unity Audio Clip Import Settings](https://docs.unity3d.com/6000.0/Documentation/Manual/class-AudioClip.html)). 특정 코덱·샘플레이트·메모리 배수를 모든 엔진에 복사하지 않습니다.
- 첫 재생·최대 동시 SFX·여러 긴 스트림·장면 전환이 겹친 조건에서 시작 지연, mixer/streaming CPU, 메모리·I/O 지연을 확인합니다. 선로드와 voice/스트림 수는 콘텐츠의 적시성·생략 우선순위에 맞춰 정하며 클립 하나의 에디터 재생 성공으로 목표 기기의 동시 부하를 보장하지 않습니다.

## 스트리밍 버퍼 반환

- 직접 버퍼를 관리하면 디스크 읽기 완료와 오디오 엔진 소비 완료를 구분합니다. Submit·재생 시작·Stop 요청만으로 버퍼를 덮거나 해제하지 않고 실제 API의 반환 경계를 따릅니다. XAudio2 `OnBufferEnd`는 엔진이 버퍼 읽기를 마친 경계의 한 예입니다([Stream a Sound from Disk](https://learn.microsoft.com/en-us/windows/win32/xaudio2/how-to--stream-a-sound-from-disk)).
- 순환 버퍼는 재생/쓰기 커서·가용 구간과 wrap으로 나뉜 두 영역을 처리합니다. 정적 버퍼 전체를 잠그는 예제를 부분 refill에 그대로 옮기지 않습니다. I/O 지연·underrun·wrap·마지막 짧은 블록·중단/종료 중 남은 소비를 검증합니다. 엔진 재생기를 쓰는 코드에는 별도 자작 스트리밍 구현 대신 해당 보장만 확인합니다.

## voice·공간·처리 기한

- 자산 수·논리 재생 채널·실제 믹싱 voice·decoder 수를 구분합니다. 예산 초과 시 생략·가상화·탈취/정지의 재생 위치와 복귀 의미를 정합니다. FMOD의 가상 voice는 위치를 진행하지만 탈취된 채널은 정지하는 별개 상태입니다([FMOD virtual voice](https://www.fmod.com/docs/2.02/api/managing-resources-in-the-core-api.html#virtual-voice-system)). 모든 음원에 같은 정책을 강제하지 않습니다.
- 환경별 효과를 바꿔야 하면 dry 원천과 런타임 반향/필터·send/return을 구분합니다. 이미 자산에 구운 효과를 자유롭게 제거할 수 있다고 가정하지 않으며 고정 연출까지 모두 실시간으로 바꾸지도 않습니다([FMOD mixing](https://fmod.com/docs/2.04/studio/mixing.html#sends-and-return-buses)).
- 차폐 음향용 box/proxy는 게임 충돌이나 실제 음향 경로와 같은 판정이 아닙니다. 외접 형상이 크다고 최종 감쇠량의 보수적 상한까지 보장되는 것은 아니므로 큰 장애물·모서리·우회 경로에서 근사의 청취 오차와 질의 비용을 확인합니다([Wwise diffraction](https://www.audiokinetic.com/en/community/blog/a-wwise-approach-to-spatial-audio-part-2-diffraction/); *Game Programming Gems 3* 한국어판 PDF p.708–713).
- 위치·감쇠 거리·속도의 길이/시간 단위를 맞추고 프레임 변위를 단위/초 속도로 넘기지 않습니다. 게임 제어값 갱신, 믹서 블록 생산, 장치 출력/실제 청취 시각을 분리합니다. 거리 factor가 모든 입력·감쇠 곡선을 대신 변환한다고 가정하지 않습니다([FMOD listener](https://www.fmod.com/docs/2.04/api/core-api-system.html#system_set3dlistenerattributes), [Godot AudioServer](https://docs.godotengine.org/en/4.7/classes/class_audioserver.html)).
- 연속 전환이 필요한 음량·재생률은 목표/현재와 전환 시간·변화율을 정합니다. 의도한 과도음까지 제거하지 않으며 곱셈형 smoothing으로 0에 도달한다고 가정하지 않습니다. 음량 평활화가 임의 IIR 계수 보간의 안정성을 보장하지도 않습니다([JUCE SmoothedValue](https://docs.juce.com/master/classjuce_1_1SmoothedValue.html)).
- 자체 오디오 callback은 공급 기한 안에 끝내야 합니다. 할당/해제·파일/콘솔 I/O·mutex 대기·비예측 호출을 피하고, 내부 블록 크기가 장치 callback과 다르면 적응 버퍼·지연을 설계합니다. ring buffer나 큰 내부 블록이 원래 callback의 기한을 늘려주지는 않습니다. 블록 프레임 수/샘플레이트도 전체 출력 지연과 같지 않습니다([PortAudio callback](https://portaudio.com/docs/v19-doxydocs/writing_a_callback.html), [AudioWorklet block adaptation](https://developer.chrome.com/blog/audio-worklet-design-pattern/#handling_buffer_size_mismatch)).
- 오디오 그래프를 직접 구현/편집한다면 생성 순서보다 신호·파라미터 변조의 의존 순서를 따릅니다. 피드백은 지연·순환 처리 의미를 정하고 이번 블록의 입력 준비와 출력을 확인합니다. 특정 API의 quantum·순환 음소거 정책을 다른 엔진에 일반화하지 않습니다([Web Audio rendering loop](https://www.w3.org/TR/2021/REC-webaudio-20210617/#rendering-loop)).

## 근거와 적용 범위

*Game Coding Complete* 한국어 제공본 PDF p.336–337의 동시 디코딩 비용, *Game Programming Tricks of the Trade* 한국어판 Trick 8 PDF p.248–250, 259–261의 상주/스트리밍·커서/wrap을 현행 API와 대조했습니다(2026-10-15). 동시 부하·소비 종료 검증은 이 근거에서 도출한 기준입니다. 당시 CPU MHz·고정 버퍼 수·DirectSound/DirectMusic 호출을 권장 구현으로 옮기지 않았으며, 이 문서 작업에서 오디오 backend를 실행·청취 검증한 것은 아닙니다.

*Game Programming Gems 3* 한국어판 6.2(PDF p.702–706), 6.5–6.7(p.728, 737, 743–750)의 voice·환경 효과·단위·블록/전환 원리를 보강했습니다. 현재 API별 가상화·기한·그래프 보장은 링크한 공식 문서로 대조했습니다(2026-10-15).

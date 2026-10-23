---
type: Concept
title: AI 에셋 생성의 모델 라이선스·로컬 메모리·LoRA 학습·VLM 런타임
description: 로컬 이미지 생성·VLM 모델의 가중치 라이선스 예외, Apple Silicon 통합 메모리 조회와 mflux 캐시, seed 재현성, 8방향 스프라이트 구조 고정, mflux LoRA 학습 설정과 투명 스프라이트의 키 배경 학습·복원, Ollama(MLX) 유효 설정과 구조화 출력 결함, VLM 채점의 양성 대조를 정리합니다.
tags: [development, assets, ai, image-generation, vlm, license, apple-silicon, mlx, lora, ollama, structured-output, sprite, transparency]
timestamp: 2026-10-23T00:00:00Z
---

# AI 에셋 생성의 모델 라이선스·로컬 메모리·LoRA 학습·VLM 런타임

입력 에셋 쪽 권리는 [에셋의 AI 사용 권리](/development/assets-editor.md#에셋의-ai-사용-권리), 부분 수정 방법은 [생성 이미지의 결정적 국소 합성](/tools/builtin.md)을 따릅니다.

## 가중치 라이선스

상업 게임에 출하할 에셋의 모델은 품질·속도보다 먼저 라이선스로 거릅니다. 출력물 조항과 모델 사용 목적 조항을 따로 판정하고 배경 제거·업스케일 같은 보조 모델도 같은 게이트를 거치며, 비상업 구성요소를 거친 산출물은 출하 승인과 학습 데이터셋에서 제외합니다. 라이선스 조사는 다운로드·설치·유료 호출의 사용자 승인이 아닙니다.

- [FLUX Non-Commercial](https://raw.githubusercontent.com/black-forest-labs/flux2/main/model_licenses/LICENSE-FLUX-NON-COMMERICAL): §2(d)는 Output의 어떤 목적 사용도 허용하지만 §4(a)는 모델과 "모델이 만든 데이터"의 "commercial or production purposes" 사용을 금지합니다. 서면 상업 라이선스 없이 출하 경로에 넣지 않습니다(확인 2026-10-14).
- [HunyuanImage 3.0](https://raw.githubusercontent.com/Tencent-Hunyuan/HunyuanImage-3.0/main/LICENSE)은 Territory에서 EU·영국·대한민국을 제외합니다(확인 2026-10-14). [Hunyuan3D 2.x](https://huggingface.co/tencent/Hunyuan3D-2.1/blob/main/LICENSE)도 대한민국이 빠지고 출력물 사용을 지역으로 제한합니다(확인 2026-10-15).
- 같은 계열도 버전마다 바뀝니다. [Qwen-Image-Edit-2511](https://huggingface.co/Qwen/Qwen-Image-Edit-2511)은 Apache-2.0, [Qwen-Image-2.1](https://huggingface.co/Qwen/Qwen-Image-2.1)은 `qwen-research`입니다(확인 2026-10-14).
- 상업 가능(Apache-2.0·MIT)으로 확인한 예(확인 2026-10-14, 사용 전 재확인): Z-Image, FLUX.2 klein 4B(9B는 비상업), Qwen-Image-Edit-2511, Qwen3.8-27B(VLM), BiRefNet(MIT).
- 더 큰 후보(확인 2026-10-18, 사용 전 재확인): [ERNIE-Image](https://huggingface.co/baidu/ERNIE-Image) 8B·[Qwen-Image-2512](https://huggingface.co/Qwen/Qwen-Image-2512)·[Boogu-Image-0.1-Turbo](https://huggingface.co/Boogu/Boogu-Image-0.1-Turbo)는 Apache-2.0, [Ming-Image-0.1-Design](https://huggingface.co/inclusionAI/Ming-Image-0.1-Design)은 MIT입니다. [FLUX.2 dev](https://huggingface.co/black-forest-labs/FLUX.2-dev)·[Ideogram 4](https://huggingface.co/ideogram-ai/ideogram-4-fp8)는 비상업입니다.
- [Krea 2](https://huggingface.co/krea/Krea-2-Raw) Community License는 계열사를 합친 회사 전체의 직전 12개월 매출이 100만 달러 미만일 때만 상업 사용을 허용하고(§2.3) 콘텐츠 필터를 요구하며(§4.2) 30일 통지로 해지될 수 있습니다(§9.2, 확인 2026-10-18). 매출 조건은 사용자 회사의 사실이므로 대신 판정하지 않고 확인받습니다.
- 라이선스를 통과해도 학습 도구 지원은 따로 확인합니다. mflux 0.22.0 학습기는 FLUX.2 klein·Z-Image·ERNIE-Image·Krea 2만 연결하고 Qwen-Image 계열은 생성만 지원합니다(설치본 `mflux/models/common/training/runner.py`).

## Apple Silicon 통합 메모리

- GPU 예산은 "RAM의 75%" 같은 커뮤니티 규칙이 아니라 Metal `recommendedMaxWorkingSetSize`를 조회해 정합니다. [Apple 정의](https://developer.apple.com/documentation/metal/mtldevice/recommendedmaxworkingsetsize)상 "런타임 성능에 영향을 주지 않고 할당할 수 있는 메모리의 근사치"일 뿐 할당 보장이나 여유 용량이 아니므로 계획 피크는 이보다 낮게 잡고 실제 피크는 따로 측정합니다.
- 확산 모델과 VLM은 같은 예산·대역폭을 씁니다. 동시 상주·실행은 일반 금지가 아니라 해당 장비에서 실측한 합산 피크가 예산 안인지로 정하고, 언로드는 잔류 여부(Ollama `GET /api/ps`가 빈 목록, CLI는 프로세스 종료)로 확인합니다. 해제 API의 성공 응답은 증거가 아닙니다.
- mflux(MLX)는 `--mlx-cache-limit-gb`(10^9 바이트 단위)를 주지 않으면 버퍼 캐시가 커집니다. 상한 없이 seed 4개 배치를 돌리면 FLUX.2 klein 4B·Z-Image Turbo 모두 32 GiB를 넘었고 같은 seed의 디코딩 픽셀은 상한 유무와 같았습니다(mflux 0.22.0, M4 Pro 48 GB, 확인 2026-10-14). 두 모델의 CLI 경로는 단일 seed 실행에서만 인코딩 뒤 텍스트 인코더를 해제하므로 seed를 여러 개 주면 피크가 오릅니다.
- `iogpu.wired_limit_mb`로 한도를 올리는 것은 기본 운영 수단으로 쓰지 않습니다(재부팅하면 초기화되고 OS·브라우저 몫을 줄입니다).

## 재현성과 스프라이트

- seed만으로는 같은 이미지가 보장되지 않습니다. [mflux Z-Image README](https://github.com/mflux-community/mflux/blob/main/src/mflux/models/z_image/README.md)에 따르면 0.20 이하는 transformer를 float32로, 이후 릴리스는 bfloat16으로 실행해 같은 seed라도 이미지가 다르며 이전 결과를 재현하려면 `--float32`가 필요합니다(확인 2026-10-14).
- 8방향 스프라이트의 방향·포즈·프레임처럼 정확한 구조는 이미지 모델에 맡기지 않고 제어 가능한 경로(고정 정사영 카메라의 3D 렌더 + 리그 애니메이션, ControlNet 같은 구조 제어)로 정하며, 이미지 모델은 컨셉·텍스처·정체성 보정에 씁니다. 근거 관찰(FLUX.2 klein 4B·mflux 0.22.0·레퍼런스 1장, 2026-10-15)의 방향 일치는 한 장 8방향 시트 2/8, 방향별 텍스트 편집 약 5/8, 박스 마네킹 레퍼런스 편집 1/8이었고 다른 모델·제어 방식으로 일반화하지 않습니다.
- 픽셀화는 결정적 후처리로 합니다. 모든 방향·프레임을 같은 캔버스·발 기준·배율로 맞춰 축소하고 하나의 공유 팔레트로 양자화합니다.

## LoRA 학습 (mflux 0.22.0)

- **메모리가 넘치면 실패하지 않고 swap으로 몇 배 느려집니다.** FLUX.2 klein base 4B를 gradient checkpointing·`low_ram` 없이 학습하면 GPU 할당(`ioreg`)이 71 GB까지 올라 swap 30.4 GB를 쓰며 78초/step이었고, 둘을 켜면 13.0~13.6초/step·최대 메모리 25.0 GiB(`/usr/bin/time -l`)였습니다(M4 Pro 48 GB, 512×1024, rank 128, 2026-10-18). 학습 일정과 시안 수를 정하기 전에 짧은 탐색 실행으로 단계 시간·최대 메모리·`vm.swapusage`를 잽니다.
- `mflux-train`은 CLI의 `--low-ram`·`--mlx-cache-limit-gb`·`--quantize`를 학습 설정에 넘기지 않으므로 설정 JSON의 `low_ram`·`gradient_checkpointing`·`cache_limit_gb`·`quantize`에 씁니다(설치본 `mflux/models/common/cli/train.py`).
- FLUX.2 klein은 base로 학습하고 distilled(4단계)에서 LoRA를 쓰는 것이 BFL 권장 경로입니다([BFL 가이드](https://huggingface.co/blog/black-forest-labs/flux-2-klein-lora), 게시 2026-06-04). 다른 계열의 SFT→Turbo 전이는 계열마다 따로 확인합니다.
- 큰 모델이 시안 품질에서 이긴다고 가정하지 않습니다. 같은 데이터셋·비슷한 학습 시간(ERNIE 1 epoch 8시간 29분, klein 2 epoch 9시간 9분)에서 ERNIE-Image 8B LoRA는 식생·나무의 주제 추종만 klein 4B보다 나았고 같은 범주 안의 물체 크기가 더 흔들렸으며, 50단계 생성이 klein distilled 4단계보다 약 50배 느렸습니다(2026-10-19). 학습량이 달라 같은 시간 예산의 비교로만 읽습니다.

## 투명 스프라이트의 키 배경 학습과 복원

- mflux 0.22.0 학습기는 알파가 있는 PNG를 흰색 위에 합성해 RGB로 학습합니다(설치본 `mflux/utils/image_util.py`). 흰 배경에서는 밝은 물체의 알파를 되돌릴 수 없으므로 팩 색과 겹치지 않는 채도 높은 키 색(예: 마젠타) 위에 straight-alpha로 합성해 학습하고, 생성물은 같은 경로로 되돌립니다. 키 합성 이미지를 확대할 때는 링잉이 적은 커널(Mitchell)을 씁니다.
- 생성물의 배경은 선언 키 색 그대로가 아닐 수 있습니다(예: sprite-gen 코드 주석의 관측에서 Grok은 `#FF00FF`를 (216,46,147)로 칠해 선언 키 기준 제거 반경 밖에 배경 전체가 남음). 모서리·테두리의 비투명 표본 중 선언 키 색 계열이 충분할 때만 그 최빈 색 구간(전체 평균은 군집 사이의 없는 색)을 관측 키로 써서 제거와 차이 키의 `키 값`에 반영하고, 근거가 없으면 선언 키를 유지하며 임의의 테두리색을 키로 삼지 않습니다. 선언 키의 제거 반경은 그대로 두고 관측 키의 반경은 키 hue 특징(키가 아닌 채널이 어두움)을 가진 화소와 거기에 이어진 화소에만 더해 본체 안의 비슷한 색(G가 밝은 핫핑크 등)을 지우지 않습니다([sprite-gen `extract.py`](https://github.com/aldegad/sprite-gen/blob/59b2738a2e76ed7043d9691a230396ed6374a336/sprite_gen/frames/extract.py#L215-L451), 코드 확인 2026-10-23).
- 마젠타 차이 키 `alpha = 1 − (min(R,B) − G) / 키 값`은 검은 그림자는 정확히 되돌리지만 G가 B보다 큰 색(녹색·노랑·주황)의 가장자리를 너무 불투명하게 읽어 분홍으로 번지게 합니다. 이 값을 상한으로 두고 가장자리 화소를 "가장 가까운 안쪽 색의 어떤 명암 + 키"의 2변수 최소제곱으로 다시 맞추며, 맞춤 오차가 작을 때만 그 알파를 씁니다(팩 스프라이트 176장을 합성→4배 확대→키 제거→축소로 왕복했을 때 알파·색 오차 평균 1.66·1.10, 차이 키만 2.06·1.97, 2026-10-18).
- 팩 왕복 시험만으로 검증하지 않습니다. 생성 모델은 회색·어두운 면 전체를 키 쪽으로 물들여(FLUX.2 klein 4B + 스타일 LoRA, 마젠타 키, 2026-10-18) 그대로 읽으면 본체가 비치고, 가장자리 재맞춤은 그 색을 다른 색 얼룩으로 풀어냅니다. 주변이 모두 거의 불투명한 안쪽 화소는 불투명으로 두고 키 성분만 빼며, 그만큼 진한 그림자 중심도 불투명해질 수 있으므로 그림자 알파 통계를 기준 범위와 계속 비교합니다. 키 색 계열(빨강·분홍·녹슨 금속) 면은 화소 값으로 키와 구분할 수 없으므로 "어둡지 않은 반투명 화소의 비율"을 기준 범위와 비교해 표시하고 다른 seed를 고릅니다.

## Ollama(MLX) 런타임 (v0.40.4 기준)

- **유효 설정은 서버가 읽은 값으로 확인합니다.** `~/.ollama/logs/server.log`의 `server config` 줄을 보며 `launchctl getenv`나 앱 설정 화면은 증거가 아닙니다. macOS 앱의 서버는 앱 실행 시점의 환경 변수를 물려받아 `launchctl setenv`는 앱을 다시 시작해야 반영되고, 앱 설정의 Context length가 0보다 크면 `OLLAMA_CONTEXT_LENGTH`를 덮어씁니다([app/server/server.go](https://github.com/ollama/ollama/blob/v0.40.4/app/server/server.go), 확인 2026-10-14). 0.40.4 앱은 AppleScript `quit`을 취소(-128)했고 앱 프로세스에 SIGTERM을 보내면 서버까지 정상 종료됩니다.
- **MLX runner 자식 리스너:** MLX 모델이 올라가 있는 동안 runner 자식 프로세스가 `127.0.0.1`의 임의 포트에 뜨고, 이 리스너의 `/v1/completions` 등에는 Host·Origin·인증 검사가 없습니다([mlxrunner/server.go](https://github.com/ollama/ollama/blob/v0.40.4/mlxrunner/server.go), [runner.go](https://github.com/ollama/ollama/blob/v0.40.4/mlxrunner/runner.go), 소스 확인·공격 재현 안 함, 2026-10-15). loopback 바인딩과 11434 포트의 DNS rebinding 방어만으로 안전하다고 보지 않으며, 작업이 끝나면 모델을 내려 리스너를 닫고 보안 검토 범위에 넣습니다.
- **컨텍스트 길이:** 기본값은 VRAM 기준입니다(공식 안내는 24 GiB 미만 4k, 24–48 GiB 32k, 48 GiB 이상 256k, v0.40.4 구현의 경계는 23/47 GiB. [context-length](https://docs.ollama.com/context-length), [server/routes.go](https://github.com/ollama/ollama/blob/v0.40.4/server/routes.go), 확인 2026-10-14). MLX 러너는 `num_ctx`·`OLLAMA_CONTEXT_LENGTH`·앱 설정값을 강제하지 않고 `softContextLength`로 넘겨 `/api/ps`의 `context_length`에만 보입니다. 실제 한도는 모델 최대 컨텍스트이고 채팅 경로는 프롬프트를 자르지 않으며 KV도 미리 잡지 않으므로([server/sched.go](https://github.com/ollama/ollama/blob/v0.40.4/server/sched.go), [mlxrunner/client.go](https://github.com/ollama/ollama/blob/v0.40.4/mlxrunner/client.go), 소스 확인 2026-10-14) 입력 크기와 `max_tokens`는 클라이언트가 제한합니다. GGUF(llama-server) 경로에서는 `num_ctx`가 서버 컨텍스트와 메모리 예측에 쓰이며, OpenAI 호환 API에는 컨텍스트 길이 필드가 없어 Modelfile `PARAMETER num_ctx`로 파생 모델을 만들어 호출합니다([openai-compatibility](https://docs.ollama.com/api/openai-compatibility)).
- **구조화 출력은 HTTP 200으로 믿지 않습니다.** 0.40.4 MLX 러너는 xgrammar로 제약을 걸지만 중첩 스키마에 `response_format`만 보내면 문법이 허용하는 공백만 반복하다 `max_tokens`에서 끝납니다(`qwen3.8:27b-mlx`, 2026-10-14, 원인 미확정). 스키마 원문을 `format`/`response_format`과 프롬프트 양쪽에 넣으면 통과했습니다. 같은 증상이 [#18567](https://github.com/ollama/ollama/issues/18567)로 보고됐지만 "대부분 엔진의 표준 동작"이라며 수정 없이 닫혔고(2026-09-23), [공식 문서](https://docs.ollama.com/capabilities/structured-outputs)도 스키마를 프롬프트에 넣으라고 권합니다. 클라이언트에서 다시 검증하고 `finish_reason: length`를 실패로 처리하며, 배열 순서·enum 중복 같은 의미 규칙은 문법이 막지 못합니다.

## VLM 채점

- VLM 점수도 [측정 타당성 원리](/development/assets-editor.md#검수조립-원리)대로 후보 선별에 쓰기 전에 기준 원본을 후보와 똑같이 채점해 양성 대조하고, 원본이 높은 점수를 받지 못하는 항목은 판별력이 없으므로 기록만 하고 순위에서 뺍니다. 예: `qwen3.8:27b-mlx`(Ollama 0.40.6)의 "화풍 일치"는 원본 팩 스프라이트에도 평균 4.8/10이었고 내용 차이를 화풍 차이로 읽었지만, "주제 일치"·"정리 상태"는 8.1·8.8이었습니다(2026-10-18).

---
type: Concept
title: AI 에셋 생성의 모델 라이선스·로컬 메모리·재현성·VLM 런타임·8방향 스프라이트
description: 로컬 이미지 생성·VLM 모델을 에셋 파이프라인에 고를 때의 가중치 라이선스 게이트, Apple Silicon 통합 메모리 예산 측정, seed 재현성 고정 기준, Ollama 유효 설정 확인과 구조화 출력 검증, 8방향 스프라이트에서 방향·포즈를 고정하는 방법을 정리합니다.
tags: [development, assets, ai, image-generation, vlm, license, apple-silicon, mlx, reproducibility, ollama, structured-output, sprite]
timestamp: 2026-10-18T00:00:00Z
---

# AI 에셋 생성의 모델 라이선스·로컬 메모리·재현성·VLM 런타임 설정

관련 개념: [에셋의 AI 사용 권리](/development/assets-editor.md#반입권리와-조립)(입력 에셋 쪽 권리) · [생성 이미지의 결정적 국소 합성](/tools/builtin.md)(부분 수정 방법).

## 가중치 라이선스가 1차 게이트

상업 게임에 출하할 에셋을 만드는 파이프라인이면, 모델은 품질·속도보다 먼저 가중치 라이선스로 거릅니다.

- **두 조항을 모두 읽습니다.** 출력물(Outputs) 조항과 모델 사용 목적 조항은 따로 판정합니다. 출력의 상업 이용을 허용하는 문장만 보고 통과시키지 않습니다.
  - [FLUX Non-Commercial License](https://raw.githubusercontent.com/black-forest-labs/flux2/main/model_licenses/LICENSE-FLUX-NON-COMMERICAL) §2(d)는 "Output을 상업 목적을 포함한 어떤 목적으로든" 쓸 수 있다고 합니다.
  - 같은 문서 §4(a)는 모델과 "모델이 만든 데이터"를 "commercial or production purposes"로 쓰는 것을 금지합니다.
  - 출하 파이프라인의 프로덕션 사용은 §4(a)에 걸릴 수 있으므로, 서면 상업 라이선스 없이 출하 경로에 넣지 않습니다(확인 2026-10-14).
- **지역 제한을 확인합니다.** [Tencent HunyuanImage 3.0 라이선스](https://raw.githubusercontent.com/Tencent-Hunyuan/HunyuanImage-3.0/main/LICENSE)는 Territory에서 EU·영국·대한민국을 제외합니다. 한국 개발사의 사용은 라이선스 범위 밖입니다(확인 2026-10-14).
- **같은 계열도 버전마다 라이선스가 바뀝니다.**
  - [Qwen-Image-Edit-2511](https://huggingface.co/Qwen/Qwen-Image-Edit-2511)은 Apache-2.0입니다.
  - [Qwen-Image-2.1](https://huggingface.co/Qwen/Qwen-Image-2.1)은 `qwen-research` 라이선스입니다(확인 2026-10-14).
  - 이전 버전의 판정을 새 버전에 물려주지 않고, 모델 카드와 LICENSE 파일을 버전별로 다시 확인합니다.
- **보조 모델도 같은 게이트를 거칩니다.** 배경 제거·업스케일 모델이 비상업이면 그 단계를 거친 에셋 전체가 오염됩니다. 도구의 기본 모델이 무엇인지 확인하고 모델을 명시합니다.
- **2026-10-14 확인한 상업 가능(Apache-2.0·MIT) 예시:**
  - [Z-Image](https://huggingface.co/Tongyi-MAI/Z-Image), [FLUX.2 klein 4B](https://huggingface.co/black-forest-labs/FLUX.2-klein-4B)(같은 계열 9B는 비상업)
  - Qwen-Image-Edit-2511, [Qwen3.8-27B](https://huggingface.co/Qwen/Qwen3.8-27B)(VLM)
  - [BiRefNet](https://huggingface.co/ZhengPeng7/BiRefNet)(MIT)
  - 이 목록은 판정 시점의 사실이며 사용 전에 다시 확인합니다.
- **파이프라인에서 강제합니다.** 모델·LoRA 레지스트리에 라이선스 식별자와 상업 가능 여부를 저장합니다. 비상업 구성요소를 거친 산출물은 오염(taint)으로 표시하고, 출하 승인과 학습 데이터셋 편입을 막습니다. 비상업 모델 출력으로 상업용 LoRA를 학습하지 않습니다.
- 라이선스 조사는 모델 다운로드·설치·유료 호출의 사용자 승인이 아닙니다.

## Apple Silicon 통합 메모리 예산은 조회·측정으로 정합니다

- GPU 예산의 기준선은 커뮤니티의 "RAM의 75%" 규칙이 아니라 Metal의 `recommendedMaxWorkingSetSize`를 조회해 정합니다. [Apple 정의](https://developer.apple.com/documentation/metal/mtldevice/recommendedmaxworkingsetsize)상 이 값은 "런타임 성능에 영향을 주지 않고 할당할 수 있는 메모리의 근사치"입니다. 할당 보장이나 현재 여유 용량이 아니므로, 계획 피크는 이보다 낮게 잡고 워크로드의 실제 피크와 메모리 압박은 따로 측정합니다.

  ```sh
  xcrun swift - <<<'import Metal; print(MTLCreateSystemDefaultDevice()!.recommendedMaxWorkingSetSize)'
  ```

  - Mac mini M4 Pro 48 GB, macOS 27.0.1, `iogpu.wired_limit_mb=0`에서 40,200,896,512 B(약 37.4 GiB, RAM의 약 78%)였습니다(조회 2026-10-14). 75% 규칙(36 GiB)과 다릅니다.
- 이미지 확산 모델과 VLM은 같은 예산과 같은 메모리 대역폭을 씁니다.
  - 무거운 모델은 한 번에 하나만 상주시키고, 단계마다 언로드한 뒤 잔류 여부를 확인합니다. 예: Ollama는 `GET /api/ps`가 빈 목록인지, CLI 런타임은 프로세스 종료를 확인합니다. 해제 API의 성공 응답만으로는 해제 증거가 되지 않습니다.
  - 확산 생성과 VLM 디코딩을 동시에 돌리지 않습니다.
  - mflux(MLX)는 `--mlx-cache-limit-gb`(10^9 바이트 단위)를 주지 않으면 버퍼 캐시가 커집니다. 상한 없이 seed 4개 배치로 돌리면 FLUX.2 klein 4B와 Z-Image Turbo 모두 32 GiB를 넘었습니다(최대 35.9·36.2 GiB). 상한 4에서는 seed 2개 배치가 18.7·31.7 GiB, 1024² 단일 seed가 13.3·27.8 GiB였습니다. seed 수도 함께 바뀌어 상한만의 효과를 분리한 측정은 아닙니다. 같은 seed의 디코딩 픽셀은 상한 유무와 관계없이 같았습니다(mflux 0.22.0, M4 Pro 48 GB, `/usr/bin/time -l`의 peak memory footprint, 2026-10-14). 이 두 모델의 CLI 경로는 단일 seed 실행에서만 인코딩 뒤 텍스트 인코더를 해제하므로, seed를 여러 개 주면 피크가 오릅니다(설치본 `mflux/callbacks/instances/memory_saver.py`).
- `iogpu.wired_limit_mb`로 한도를 올리는 것은 기본 운영 수단으로 쓰지 않습니다. 재부팅하면 초기화되고, OS·브라우저 몫을 줄입니다.

## seed 재현성은 런타임까지 고정해야 합니다

- seed만으로는 같은 이미지가 보장되지 않습니다. 같은 런타임에서도 버전과 연산 정밀도가 바뀌면 결과가 달라진 사례가 공식 문서에 있습니다.
  - 예: [mflux Z-Image README](https://github.com/mflux-community/mflux/blob/main/src/mflux/models/z_image/README.md)에 따르면 0.20 이하는 transformer를 float32로, 이후 릴리스는 bfloat16으로 실행합니다. 같은 seed라도 두 경로의 이미지가 다르며, 이전 결과를 재현하려면 `--float32`가 필요하다고 명시합니다(확인 2026-10-14).
- 프로젝트 단위로 다음을 고정하고 산출물마다 기록합니다: 런타임과 버전, 모델과 해시, 양자화, 정밀도, step, guidance, 해상도.
- 런타임·모델을 업그레이드하면 같은 프롬프트·seed 그리드로 이전 결과와 비교한 뒤 채택합니다.

## 8방향 스프라이트의 방향·포즈는 이미지 모델에 맡기지 않습니다

- 텍스트·레퍼런스 편집은 정체성·의상 일관성에는 강합니다. 하지만 지정한 방향·카메라·애니메이션 프레임은 지키지 못합니다.
- 관찰(FLUX.2 klein 4B, mflux 0.22.0, 레퍼런스 1장, 방법마다 seed 1개, 방향 판정은 독립 검토로 보정, 2026-10-15):
  - 한 장 8방향 시트는 셀 사이 의상은 맞았지만, 방향은 S·N 2/8만 맞고 나머지는 정면·후면으로 겹쳤습니다.
  - 방향별 텍스트 편집은 약 5/8이 맞았습니다. 측면은 반대쪽이 나오거나 고개만 돌아갔고, 칼 쥔 손·소품이 장마다 달랐습니다.
  - 박스 마네킹을 두 번째 레퍼런스로 준 편집은 1/8이었습니다. 가이드를 무시하고 레퍼런스 자세를 복사했고, 이미지 순서를 바꿔도 같았습니다.
  - 의상색 마네킹을 초기 이미지로 쓴 img2img(strength 0.25)는 내려다보는 시점은 따랐지만 방향은 2/8이었습니다. 후면이 정면으로 바뀌었습니다. 걷기 프레임은 다리 벌림 일부만 따르고, 프레임마다 소품·손·몸 방향이 바뀌었습니다.
  - 구조를 먼저 만들고 레퍼런스로 2차 편집하면 자세·방향을 유지한 채 얼굴·소품만 레퍼런스로 바뀌었습니다(2/2).
- 그래서 방향·프레임은 3D 렌더(고정 정사영 카메라 + 리그 애니메이션)나 ControlNet 같은 구조 제어로 정합니다. 이미지 모델은 컨셉·텍스처·정체성 보정에 씁니다. 커뮤니티 일화도 "2D → 3D → 전 방향 렌더"를 가장 많이 권합니다.
- 픽셀화는 결정적 후처리로 합니다. 모든 방향·프레임을 같은 캔버스·발 기준·배율로 맞춘 뒤 축소하고, 하나의 공유 팔레트로 양자화합니다. 프레임마다 자르거나 배율을 바꾸면 떨림이 생깁니다.
- 3D 경로의 도구도 라이선스 게이트를 거칩니다. 예: Hunyuan3D 2.x는 라이선스 적용 지역에서 대한민국이 빠지고 출력물 사용도 지역으로 제한합니다([2.1 LICENSE](https://huggingface.co/tencent/Hunyuan3D-2.1/blob/main/LICENSE)). Blender는 GPL이지만 렌더 결과물은 사용자 소유입니다([Blender license](https://www.blender.org/about/license/)). 둘 다 확인 2026-10-15.

## 로컬 VLM 런타임(Ollama)은 유효 설정과 실제 출력으로 확인합니다

- **설정은 서버가 실제로 읽은 값으로 확인합니다.** `launchctl getenv`나 앱 설정 화면은 유효값의 증거가 아닙니다. `~/.ollama/logs/server.log`의 `server config` 줄을 봅니다.
  - macOS 앱의 서버는 앱이 실행될 때의 환경 변수를 물려받습니다. `launchctl setenv`는 앱을 다시 시작해야 반영되고, 재부팅하면 사라집니다.
  - 앱 설정의 Context length가 0보다 크면 `OLLAMA_CONTEXT_LENGTH` 환경 변수를 덮어씁니다([app/server/server.go](https://github.com/ollama/ollama/blob/v0.40.4/app/server/server.go), 확인 2026-10-14).
  - 0.40.4 앱은 AppleScript `quit`을 취소(-128)했습니다. 앱 프로세스에 SIGTERM을 보내면 서버까지 정상 종료됩니다.
  - loopback 바인딩과 11434 포트의 DNS rebinding 방어만으로 런타임 전체가 안전하다고 보지 않습니다. 0.40.4는 MLX 모델이 올라가 있는 동안 runner 자식 프로세스를 `127.0.0.1`의 임의 포트에 띄우고, 이 리스너의 `/v1/completions` 등에는 Host·Origin·인증 검사가 없습니다([mlxrunner/server.go](https://github.com/ollama/ollama/blob/v0.40.4/mlxrunner/server.go), [runner.go](https://github.com/ollama/ollama/blob/v0.40.4/mlxrunner/runner.go), 소스 확인, 공격 재현 안 함, 2026-10-15). 작업이 끝나면 모델을 내려 리스너를 닫고, 보안 검토 범위에 이 포트를 넣습니다.
- **기본 컨텍스트 길이는 VRAM 기준입니다.** 공식 안내는 24 GiB 미만 4k, 24–48 GiB 32k, 48 GiB 이상 256k로 표기합니다([context-length](https://docs.ollama.com/context-length)). v0.40.4 구현은 경계를 23/47 GiB로 둡니다([server/routes.go](https://github.com/ollama/ollama/blob/v0.40.4/server/routes.go), 확인 2026-10-14). "기본값 4096"을 전제로 값을 올리지 않습니다.
- **MLX 러너는 컨텍스트 길이 설정을 강제하지 않습니다(v0.40.4 소스, 확인 2026-10-14).**
  - MLX 경로에서 `num_ctx`·`OLLAMA_CONTEXT_LENGTH`·앱 설정값은 `softContextLength`로 넘어가 `/api/ps`의 `context_length`에만 보입니다([server/sched.go](https://github.com/ollama/ollama/blob/v0.40.4/server/sched.go), [mlxrunner/client.go](https://github.com/ollama/ollama/blob/v0.40.4/mlxrunner/client.go)).
  - 러너의 실제 한도는 모델 최대 컨텍스트이고, 채팅 경로는 MLX일 때 프롬프트를 자르지 않습니다([mlxrunner/runner.go](https://github.com/ollama/ollama/blob/v0.40.4/mlxrunner/runner.go), [server/routes.go](https://github.com/ollama/ollama/blob/v0.40.4/server/routes.go)).
  - KV도 미리 잡지 않습니다. 27B nvfp4 모델의 로드 직후 크기는 `num_ctx` 131072에서 16.96 GiB, 12288에서 16.91 GiB였습니다(실측).
  - 그래서 `/api/ps`의 값을 한도로 믿지 않습니다. 입력 크기와 `max_tokens`는 클라이언트가 제한하고, 메모리는 실제 워크로드 피크로 잽니다.
- **GGUF(llama-server) 경로에서는 `num_ctx`가 서버 컨텍스트와 메모리 예측에 쓰입니다([server/sched.go](https://github.com/ollama/ollama/blob/v0.40.4/server/sched.go)).** OpenAI 호환 API에는 컨텍스트 길이 필드가 없으므로, Modelfile `PARAMETER num_ctx`로 파생 모델을 만들어 호출합니다([openai-compatibility](https://docs.ollama.com/api/openai-compatibility)). 파생 모델은 가중치 레이어를 공유해 디스크를 더 쓰지 않습니다.
- **구조화 출력은 HTTP 200으로 믿지 않습니다.**
  - 0.30.6–0.32.5에서 보고된 MLX 러너는 `format`을 러너에 전달하지 않아 스키마를 무시했습니다([#16563](https://github.com/ollama/ollama/issues/16563)). 제약 디코딩은 [#17929](https://github.com/ollama/ollama/pull/17929)로 들어가 v0.33.1부터 포함됩니다. 0.40.4 MLX 러너는 xgrammar로 제약을 겁니다(server.log `Structured output initialized`).
- **스키마는 `format`/`response_format`과 프롬프트 양쪽에 넣습니다.** 문법은 모양만 막고 진행은 보장하지 않습니다. 아래 중첩 스키마 조건에서는 문법이 허용하는 공백만 반복하다 `max_tokens`에서 끝났습니다. 모델이 쓰려던 JSON과 문법이 어긋났기 때문이라는 설명은 [추정]입니다. 필드 1–3개짜리 단순 스키마는 스키마 원문 없이도 통과했습니다.
  - 관찰(Ollama 0.40.4 MLX, `qwen3.8:27b-mlx`, 이미지 2장, 중첩 스키마, 2026-10-14): `response_format`만 보낸 요청은 12회 중 11회 `length`로 끝났습니다(cold·warm 혼합). 유일한 `stop` 응답도 enum 필드를 중복했습니다. 숨은 토큰은 `/api/chat`의 최상위 `logprobs: true`로 확인했습니다. 이 옵션은 MLX 추측 디코딩도 끕니다. 1,200토큰 중 끝의 연속 1,038토큰이 `" "`였고, thinking을 켜도 같은 위치에서 멈췄습니다.
  - 스키마 원문을 시스템 프롬프트에 넣으면 같은 조건에서 4/4가 통과했습니다. 파일럿 비평(이미지 1장, 레퍼런스 없음)에서는 64/64가 첫 응답에 통과했습니다. 문법 없이 프롬프트만 쓰면 `maxLength` 초과가 잦아 첫 응답 통과가 29/64였습니다.
  - 같은 증상은 [#18567](https://github.com/ollama/ollama/issues/18567)로 보고됐지만 "대부분 엔진의 표준 동작"이라며 수정하지 않고 닫혔습니다(2026-09-23). 공백 상한 PR [#18569](https://github.com/ollama/ollama/pull/18569)도 병합되지 않았습니다. [공식 문서](https://docs.ollama.com/capabilities/structured-outputs)는 스키마를 프롬프트에도 넣으라고 권합니다.
  - 클라이언트에서 다시 검증하고 `finish_reason: length`를 실패로 처리합니다. 배열 항목 순서·enum 중복 같은 의미 규칙은 JSON Schema 문법이 막지 못합니다. 런타임이나 모델을 올리면 통과율을 다시 잽니다.

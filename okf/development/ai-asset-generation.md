---
type: Concept
title: AI 에셋 생성의 실패한 생산 경로와 모델 라이선스·로컬 런타임 사실
description: 생성·장착·렌더의 실행 성공과 게임 품질 합격을 나누는 기준과 품질 판정을 통과하지 못한 AI 캐릭터 에셋 경로(원인 미확정), 다시점·재칠 편집의 모델 동작, 그리고 결과와 무관하게 확인된 사실(유료·로컬 경로 선택과 GPT Image 2.5·2.6 지정 경로, VARCO 3D MCP의 연결 조건과 무료 등급의 다운로드 한도·옵션 차단, PixelLab 체험 등급의 동시 작업 제한, 가중치 라이선스 예외, Apple Silicon 통합 메모리와 mflux 캐시, seed 재현성, 중국 업계의 AI 사용 범위, LoRA 해상도 한계와 학습 설정, TRELLIS.2 Mac 포트 결함, 투명 스프라이트의 키 배경, Ollama(MLX) 유효 설정과 구조화 출력 결함, VLM 채점의 양성 대조)을 다룹니다. AI 에셋 경로를 제안·계획하기 전에 읽습니다.
tags: [development, assets, ai, image-generation, vlm, license, apple-silicon, mlx, lora, ollama, structured-output, sprite, transparency, varco-3d, pixellab]
timestamp: 2026-11-13T00:00:00Z
---

# AI 에셋 생성의 실패한 생산 경로와 모델 라이선스·로컬 런타임 사실

입력 에셋 쪽 권리는 [에셋의 AI 사용 권리](/development/assets-editor.md#에셋의-ai-사용-권리), 부분 수정 방법은 [생성 이미지의 결정적 국소 합성](/tools/builtin.md#원본-보존)을 따릅니다.

## AI 생성 경로의 품질 판정

- 생성·장착·렌더가 끝났다는 실행 성공과 게임 품질 합격은 따로 판정합니다. 다음 경로는 실행되고도 게임 품질 판정을 통과하지 못했고 원인이 확정되지 않았으므로(2026-11), 검증된 생산 경로로 전제하거나 이 문서의 방법·수치를 처방으로 인용하지 않습니다: 로컬 이미지 모델의 다시점 원화, 원화 부품의 이미지→3D 생성과 몸 조립, 기존 3D 파츠의 텍스처를 이미지 모델로 다시 그려 굽기, 생성 원화의 자체 형상 투영, 생성 원화를 체형 비율 기준으로 삼기, 저해상도 아트로 학습한 스타일 LoRA, PixelLab이 캐릭터를 새로 그리는 경로(팩 프레임 한 장을 Pro Flash로 다시 칠함 → V3 8방향 → `breathing-idle` 템플릿 애니메이션; 팩과 화풍·카메라·그림자·무기 형태가 어긋나고, 대기 연속 프레임 사이에 바뀐 화소가 불투명 약 500개 중 73~323개로 팩의 0~17개보다 커서 장식이 튐, 2026-11-07), 이미지 모델이 동작·방향의 0번 프레임 한 장에만 새 장비(조끼·보호대)를 그리고 나머지 프레임은 장비 조각을 2D 평행이동으로 따라 붙이는 경로(3D 렌더 팩의 달리기에서 몸통 조각도 부자연스럽고 보호대 조각은 프레임 사이 최대 9 px 튐, 2026-11-07). 다시 제안할 때는 달라지는 조건(모델·입력·제약)을 먼저 밝히고, 결론은 목표 그림과 같은 표시 크기로 비교한 게임 화면의 합격 여부로 씁니다.
- 텍스처는 형상에 없는 실루엣·두께·가림을 만들지 못합니다.
- **다시점·재칠 편집에서 확인한 모델 동작(M4 Pro 48 GB, 2026-11):** 디자인 참조와 구도 참조를 함께 넣으면 FLUX.2 klein 4B·FLUX 3 Klein은 구도 참조의 시점을 따르지 않고 디자인 참조의 정면을 복사했습니다(참조 순서를 바꾼 시험은 하지 않음). Qwen-Image-Edit-2511(mflux q8, Lightning 8단계)은 시점을 따랐지만 작은 장비의 수와 위치가 시점마다 바뀌었고, 1024×1536 출력에 참조 두 장을 넣으면 배경 전체에 색 조각 잡음이 생겼으며(768×1152에서는 없음) 장당 8~11분이 걸렸습니다. 같은 모델로 기존 렌더를 다시 칠하게 하면 몸 크기·자세·소매까지 바뀌어 그 결과를 형상에 투영할 수 없었습니다.

## 유료·로컬 경로 선택

- 사용자 방향(2026-10-26): 품질이 결정적인 에셋은 유료 이미지 모델을, 로컬 품질로 충분하면서 시간·작업량이 큰 에셋은 로컬 모델을 씁니다. 유료 경로의 과금 한도는 사용자가 정하므로 구독 포함 사용량을 넘는 과금 경로(API 키·크레딧 추가 구매)는 확인받은 뒤에만 씁니다.
- ChatGPT 사용 크레딧(Settings > Usage)은 API 크레딧이 아니어서 API 키 호출에 쓰이지 않습니다([도움말](https://help.openai.com/en/articles/12642688-using-credits-for-flexible-usage-in-chatgpt-personal-plans), [결제 분리](https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform)). Codex(ChatGPT 로그인)의 이미지 생성은 포함 한도를 먼저 쓰고 그다음 이 크레딧에서 차감되며(GPT-Image-2 이미지 출력 100만 토큰당 750 크레딧, [Codex 요금](https://developers.openai.com/codex/pricing)), 자동 충전(automatic reload)이 켜져 있으면 잔액이 설정한 최소값 아래로 내려갈 때(켤 때 이미 미만이면 즉시) 기본 결제 수단으로 목표 잔액까지 구매됩니다(확인 2026-10-26).
- GPT Image 2.5(`gpt-image-2.5-flare`·`gpt-image-2.5-sunburst`, 2026-09-08 출시)를 모델 ID로 지정하는 설정은 [에이전트 가이드](/agents/guide.md)를 따릅니다. 확인한 Codex 내장 `image_gen`에는 이미지 모델 선택 인자가 없으며, 공개 소스·문서와 보고된 결과만으로는 구독 경로의 개별 실행이 GPT Image 2.5인지 확정할 수 없습니다. 이 도구는 생성·편집 모두 `IMAGE_MODEL = "gpt-image-2"`를 고정해 보내고([tool.rs](https://github.com/openai/codex/blob/970111f6cb62cc02fe36a82ea7d71b37a2889c97/codex-rs/ext/image-generation/src/tool.rs), rust-v0.164.0과 동일) [공식 문서](https://developers.openai.com/codex/image-generation)도 `gpt-image-2`라 하지만 2.5 공지는 Codex 사용자 제공을 밝혀, 실효 모델 공개 요청이 [openai/codex#43965](https://github.com/openai/codex/issues/43965)로 열려 있습니다(확인 2026-10-26).
- GPT Image 2.6(`gpt-image-2.6-flare`·`gpt-image-2.6-sunburst`, 2026-11-04)은 "ChatGPT·Codex 전 구독 등급 제공"으로 발표됐지만([공지](https://openai.com/index/introducing-images-2-6/)), 구독 OAuth 경로에서는 모델을 고를 수 없습니다. OMP 18.17.0 `generate_image`의 `openai-codex` 카탈로그에는 `gpt-image-2`만 있어 `openai-codex/gpt-image-2.5`·`2.6` 선택자가 거절되고, 실행 결과의 백엔드 보고 모델은 `gpt-image-2-codex`였습니다(Team 계정, 2026-11-07). Codex OAuth 이미지 엔드포인트는 `model` 필드를 무시하고 2.6을 지정한 요청의 검증 오류도 `gpt-image-2-codex`를 가리킨다는 보고가 열려 있어([openai/codex#59890](https://github.com/openai/codex/issues/59890), 2026-11-06), 구독 경로의 실제 가중치가 2.6인지는 확인할 수 없습니다. 2.6을 지정해 쓰는 확인된 경로는 API 키(Images API)와 ChatGPT 앱의 수동 사용입니다.
- 2.5는 품질 `xhigh`·`max`를 추가했지만 API 키 경로의 래퍼가 이를 막습니다. Codex 번들 `imagegen` 스킬의 fallback CLI(`scripts/image_gen.py`, main 2026-10-23)는 `--model gpt-image-2.5-*`를 받되 품질을 `low`·`medium`·`high`·`auto`로, 크기를 `1024x1024`·`1536x1024`·`1024x1536`·`auto`로 제한하고, OMP `generate_image`에는 품질 입력이 없습니다. 이 설정이 필요하면 Images API(`/v1/images/generations`)를 직접 호출합니다. OMP 설정은 [에이전트 가이드](/agents/guide.md)를 따릅니다.
- VARCO 3D 무료(FREE) 등급에서는 3D 결과(Generate3D·Rig·Animate)의 다운로드가 형식(glb·fbx·obj·stl)과 무관하게 `Download limit reached or plan unavailable`(`url=null`)로 막힐 수 있습니다(MCP `get_output_downloads`와 웹 편집기, 2026-11-01). 같은 등급에서 2026-10-28에는 GLB를 받았으므로 다운로드 한도 소진으로 보이며, 한도 크기와 초기화 주기는 확인하지 못했습니다. `get_account_and_pricing`은 작업별 포인트와 차단만 보여 주고 다운로드 가능 여부는 보여 주지 않으므로(확인 2026-11-08), 3D 결과가 필요한 계획은 포인트를 쓰기 전에 기존 3D 결과의 `get_output_downloads`로 지금 받을 수 있는지 확인합니다.
  - 같은 등급에서 옵션 값 단위로 막힌 것(확인 2026-11-01): Generate3D `tPose=1`(`FREE_TIER_USE_TPOSE_EDIT_BLOCKED`), `license=PRIVATE`(`FREE_TIER_PRIVATE_LICENSE_BLOCKED`, 남는 값은 `CC_BY_4_0`), `usePbrTexture`, 이미지 모델 `gpt-image-2-medium`(`IMAGE_GENERATION_V2_PAID_MODEL_BLOCKED`, `gpt-image-1.5-medium`은 가능). Generate3D는 `polygonCount` 500000이어야 하고, 텍스처를 생성하면 `textureSize`도 4096이어야 합니다(확인 2026-10-28). 무료 등급 결과를 출하에 쓰려면 `CC_BY_4_0` 등록이 갖는 의미를 약관으로 먼저 확인합니다.
- VARCO 3D MCP는 브라우저에 Flow 편집 탭이 하나만 열려 있어야 연결이 유지됐습니다(확인 2026-10-28). 첫 연결의 OAuth는 [MCP 정책](/tools/mcp.md#인증)을 따릅니다.
- PixelLab 체험 등급(`get_balance`의 `subscription: trial`, Tier 0)은 동시 작업이 1개입니다. 앞 작업이 끝나기 전에 낸 다음 제출은 과금 없이 거절되고, 8방향 애니메이션도 한 호출로 요청할 수 없어 방향마다 하나씩 제출합니다(확인 2026-11-07). 체험 계획은 작업을 순서대로 내고 각 작업의 완료를 확인한 뒤 다음을 내는 것으로 세웁니다.

## 가중치 라이선스

상업 게임에 출하할 에셋의 모델은 품질·속도보다 먼저 라이선스로 거릅니다. 출력물 조항과 모델 사용 목적 조항을 따로 판정하고 배경 제거·업스케일 같은 보조 모델도 같은 게이트를 거치며, 비상업 구성요소를 거친 산출물은 출하 승인과 학습 데이터셋에서 제외합니다.

- [FLUX Non-Commercial](https://raw.githubusercontent.com/black-forest-labs/flux2/main/model_licenses/LICENSE-FLUX-NON-COMMERICAL): §2(d)는 Output의 어떤 목적 사용도 허용하지만 §4(a)는 모델과 "모델이 만든 데이터"의 "commercial or production purposes" 사용을 금지합니다. 서면 상업 라이선스 없이 출하 경로에 넣지 않습니다(확인 2026-10-14). 출하와 평가는 구분합니다. [v2.1](https://huggingface.co/unsloth/FLUX.2-klein-base-9B-GGUF/raw/main/LICENSE.md) §1(c)(ii)는 영리 기업이 비운영 환경에서 하는 시험·평가·비상업 연구개발을 Non-Commercial Purpose로 명시합니다. 그러므로 출하하지 않는 내부 품질 비교에는 쓸 수 있습니다. 이때도 §2(e)의 출력 검토는 지킵니다. 수익 활동, 최종 사용자에게 닿는 사용, 상업용 모델의 학습·증류는 제외됩니다(확인 2026-11-07).
- [HunyuanImage 3.0](https://raw.githubusercontent.com/Tencent-Hunyuan/HunyuanImage-3.0/main/LICENSE)은 Territory에서 EU·영국·대한민국을 제외합니다(확인 2026-10-14). [Hunyuan3D 2.x](https://huggingface.co/tencent/Hunyuan3D-2.1/blob/main/LICENSE)도 대한민국이 빠지고 출력물 사용을 지역으로 제한합니다(확인 2026-10-15).
- 같은 계열도 버전마다 바뀝니다. [Qwen-Image-Edit-2511](https://huggingface.co/Qwen/Qwen-Image-Edit-2511)은 Apache-2.0, [Qwen-Image-2.1](https://huggingface.co/Qwen/Qwen-Image-2.1)은 `qwen-research`입니다(확인 2026-10-14).
- 상업 가능(Apache-2.0·MIT)으로 확인한 예(확인 2026-10-14, 사용 전 재확인): Z-Image, FLUX.2 klein 4B(9B는 비상업), Qwen-Image-Edit-2511, Qwen3.8-27B(VLM), BiRefNet(MIT).
- 더 큰 후보(확인 2026-10-18, 사용 전 재확인): [ERNIE-Image](https://huggingface.co/baidu/ERNIE-Image) 8B·[Qwen-Image-2512](https://huggingface.co/Qwen/Qwen-Image-2512)·[Boogu-Image-0.1-Turbo](https://huggingface.co/Boogu/Boogu-Image-0.1-Turbo)는 Apache-2.0, [Ming-Image-0.1-Design](https://huggingface.co/inclusionAI/Ming-Image-0.1-Design)은 MIT입니다. [FLUX.2 dev](https://huggingface.co/black-forest-labs/FLUX.2-dev)·[Ideogram 4](https://huggingface.co/ideogram-ai/ideogram-4-fp8)는 비상업입니다.
- [Krea 2](https://huggingface.co/krea/Krea-2-Raw) Community License는 계열사를 합친 회사 전체의 직전 12개월 매출이 100만 달러 미만일 때만 상업 사용을 허용하고(§2.3) 콘텐츠 필터를 요구하며(§4.2) 30일 통지로 해지될 수 있습니다(§9.2, 확인 2026-10-18). 매출 조건은 사용자 회사의 사실이므로 대신 판정하지 않고 확인받습니다.
- **이미지→3D·3D 텍스처(확인 2026-11-07):**
  - [Pixal3D](https://huggingface.co/TencentARC/Pixal3D)(Tencent ARC)와 TRELLIS.2는 MIT입니다.
  - [UltraTex](https://github.com/yiboz2001/UltraTex)는 코드와 LoRA가 MIT지만, 공개된 LoRA는 FLUX.1-dev용과 FLUX.2 klein base 9B용뿐입니다. 두 기반 모델이 모두 비상업이라 출하 에셋 생산에는 쓸 수 없고, 내부 평가는 위 FLUX 항목의 범위 안에서만 가능합니다. 4B용 LoRA는 공개되지 않았고, 9B LoRA는 은닉 차원이 달라 4B에 넣을 수 없습니다.
  - [DINOv3 License](https://github.com/facebookresearch/dinov3/blob/main/LICENSE.md)는 로열티 없는 사용·수정·배포를 허용합니다. 다만 수출통제가 금지하는 최종 용도(군사, 무기 개발 등)는 제외합니다.
- 조건 모델의 배포 경로도 따로 확인합니다. TRELLIS.2가 쓰는 DINOv3의 Hugging Face 원본 저장소(`facebook/dinov3-*`)는 수동 승인제이고, 보고된 대기는 십여 분부터 며칠 이상까지이며 소속·국가로 거절되기도 합니다. DINOv3 팀원은 승인을 자기 팀이 처리하지 않는다며 timm 배포본을 대안으로 안내했습니다([이슈 #367](https://github.com/facebookresearch/dinov3/issues/367), 2026-10-05). `timm/vit_large_patch16_dinov3.lvd1689m`은 승인 없이 받을 수 있고 라이선스는 같은 `dinov3-license`입니다(HF API `gated=false`, 확인 2026-11-03). timm 배포본은 가중치 이름이 달라 원본 형식을 기대하는 코드에 넣으려면 키 대응 변환이 필요합니다.
- 라이선스를 통과해도 학습 도구 지원은 따로 확인합니다. mflux 0.22.0 학습기는 FLUX.2 klein·Z-Image·ERNIE-Image·Krea 2만 연결하고 Qwen-Image 계열은 생성만 지원합니다(설치본 `mflux/models/common/training/runner.py`).

## Apple Silicon 통합 메모리

- GPU 예산은 "RAM의 75%" 같은 커뮤니티 규칙이 아니라 Metal `recommendedMaxWorkingSetSize`를 조회해 정합니다. [Apple 정의](https://developer.apple.com/documentation/metal/mtldevice/recommendedmaxworkingsetsize)상 "런타임 성능에 영향을 주지 않고 할당할 수 있는 메모리의 근사치"일 뿐 할당 보장이나 여유 용량이 아니므로 계획 피크는 이보다 낮게 잡고 실제 피크는 따로 측정합니다.
- 확산 모델과 VLM은 같은 예산·대역폭을 씁니다. 동시 상주·실행은 일반 금지가 아니라 해당 장비에서 실측한 합산 피크가 예산 안인지로 정하고, 언로드는 잔류 여부(Ollama `GET /api/ps`가 빈 목록, CLI는 프로세스 종료)로 확인합니다. 해제 API의 성공 응답은 증거가 아닙니다.
- mflux(MLX)는 `--mlx-cache-limit-gb`(10^9 바이트 단위)를 주지 않으면 버퍼 캐시가 커집니다. 상한 없이 seed 4개 배치를 돌리면 FLUX.2 klein 4B·Z-Image Turbo 모두 32 GiB를 넘었고 같은 seed의 디코딩 픽셀은 상한 유무와 같았습니다(mflux 0.22.0, M4 Pro 48 GB, 확인 2026-10-14). 두 모델의 CLI 경로는 단일 seed 실행에서만 인코딩 뒤 텍스트 인코더를 해제하므로 seed를 여러 개 주면 피크가 오릅니다.
- `iogpu.wired_limit_mb`로 한도를 올리는 것은 기본 운영 수단으로 쓰지 않습니다(재부팅하면 초기화되고 OS·브라우저 몫을 줄입니다).

## 재현성과 스프라이트

- seed만으로는 같은 이미지가 보장되지 않습니다. [mflux Z-Image README](https://github.com/mflux-community/mflux/blob/main/src/mflux/models/z_image/README.md)에 따르면 0.20 이하는 transformer를 float32로, 이후 릴리스는 bfloat16으로 실행해 같은 seed라도 이미지가 다르며 이전 결과를 재현하려면 `--float32`가 필요합니다(확인 2026-10-14).
- 8방향 스프라이트의 방향·포즈·프레임처럼 정확한 구조는 이미지 모델에 맡기지 않고 제어 가능한 경로(고정 정사영 카메라의 3D 렌더 + 리그 애니메이션, ControlNet 같은 구조 제어)로 정합니다. 이미지 모델로 텍스처를 다시 그려 입히는 경로도 검증되지 않았습니다(위 품질 판정 절). 기존 팩 애니메이션의 맨몸 프레임 격자(15프레임)를 구독 GPT 이미지(`gpt-image-2-codex`)로 옷 입히게 했을 때도, 격자 위치는 지켰지만 몸이 프레임마다 좌우로 흔들려 사용자가 불합격으로 판정했습니다(2026-11-07). 같은 시험에서 일부 방향은 자세(총 겨누기)·얼굴 가림도 참조 그림 쪽으로 바뀌었습니다.
- 중국 업계 발표는 AI 사용 범위를 "주인공은 손으로, 잡몹만 AI"로 나누지 않습니다. 游戏工委 2025 조사(22개사)에서 AI는 원화·참조·3D 보조·텍스처에 넓게 쓰이고 동작 쪽 적용률은 낮습니다(미술 84.2%, 참조 생성·3D 보조 81.3%, 동작 31.3%, [GameLook](http://www.gamelook.com.cn/2025/12/584581/)). 盛趣는 컨셉 → AI 3D 초안 → 사람의 고모델 수정 공정을 쓰고, 정적 3D 생성물을 장면의 보조 물체·캐릭터 장식과 화면의 1/4보다 작고 환복이 없는 캐릭터에는 바로 쓸 수 있다고 소개했습니다(미술 총감 林蕤, CGDC 2026-07-31, [GameLook](http://www.gamelook.com.cn/2026/08/599067/)). 이것은 활용 가능 사례이지 그 밖의 직접 사용을 막는 기준이 아니므로, 다른 에셋의 적합성은 실제 화면에서 따로 검증합니다. 盛天은 화풍 일관성·권리가 중요한 장기 프로젝트에서 로컬 오픈소스 모델과 전용 LoRA를 고른다고 밝혔습니다(何玲, 2025-12-18, [GameLook](http://www.gamelook.com.cn/2025/12/584645/)). "잡몹만"은 클라우드 영상 모델로 서열 프레임을 만드는 방식에 대한 인디 개발자 한 명의 선택입니다([晨风工坊](https://forum.cocos.org/t/topic/168563), 2025-06).
- 픽셀화는 결정적 후처리로 합니다. 모든 방향·프레임을 같은 캔버스·발 기준·배율로 맞춰 축소하고 하나의 공유 팔레트로 양자화합니다.
- **LoRA의 생성 해상도는 정보량이 아닙니다.** 저해상도 아트를 확대해 학습한 LoRA는 큰 크기로 생성해도 세부가 확대본 수준이고 학습 크기를 넘기면 구조가 무너집니다(FLUX.2 klein 4B, 128 px 팩을 4배 확대해 학습: 512×1024 생성물의 미세 성분이 확대 대조군의 1.06~1.24배, 같은 크기의 3D 렌더는 3.45배, 2026-11-01). HD 여부는 같은 그림을 줄였다 키운 대조군 대비 미세 성분 비로 판정합니다.
- **이음매 없는 재질(DiT):** UNet용 원형 패딩 방식은 FLUX.2 klein 같은 DiT에 효과가 없고(노드 README 설명과 실측), 잠재 롤링 + 원형 패딩 VAE 디코드는 흔적 없이 동작했습니다(MIT 노드, klein 4B bf16, MPS). 코드로 가장자리를 교차 섞으면 균열 같은 구조가 이중으로 겹칩니다. 판정은 지표보다 2×2 이어 붙인 미리보기로 합니다.
- **ComfyUI v0.43.0 호환:** mflux 0.22로 학습한 FLUX.2 klein LoRA는 이중 스트림 블록의 `attn.to_out` 텐서 10개가 `lora key not loaded`로 빠집니다(ComfyUI 매핑은 diffusers식 `attn.to_out.0`만 앎, `comfy/utils.py`). 헤더 키 이름만 바꾸면 읽힙니다. MPS는 FP8 가중치를 읽지 못하므로([#12202](https://github.com/Comfy-Org/ComfyUI/issues/12202), not planned) Mac에서는 bf16을 씁니다.
- **이미지→3D(TRELLIS.2 Mac 포트)의 도구 결함(trellis-mac `d58628f`, TRELLIS.2-4B, M4 Pro 48 GB, 2026-11-03). 부품 조립 경로는 위 품질 판정 절의 미검증 경로입니다.**
  - Xcode 앱이 없으면 Metal 컴파일러가 없어 Metal 백엔드 빌드가 모두 실패하고, 순수 PyTorch로 돕니다. 이때 파츠 하나는 250~444초, 프로세스 최대 약 19 GiB, 파이프라인 적재는 86초였습니다.
  - 복셀 `base_color`는 sRGB입니다(`to_glb`가 ×255를 그대로 baseColorTexture에 씁니다). 그런데 trellis-mac 기본 굽기는 1/2.2 감마를 더 걸고, UV v를 뒤집으며, 복셀 두 칸 밖 텍셀을 검정으로 남깁니다. 이 셋을 고쳐도 생성 색이 입력보다 2~3배 어둡고 색조가 빠집니다.
  - 몸을 감싸는 옷 부품의 생성 메시는 닫힌 껍질이 아니었습니다(경계·비다양체 모서리 수만 개).
- **생성 원화를 자체 형상에 투영할 때(Blender 5.2.2, 2026-11-03). 이 투영 경로는 위 품질 판정 절의 미검증 경로라 칠·시점 혼합의 조정값은 남기지 않습니다.**
  - 우리 렌더를 구도 입력으로 넣어 만든 원화는 입력 실루엣 쪽으로 끌리므로, 체형 비율의 독립 기준으로 쓰기 전에 입력에서 온 편향을 뺍니다. 외곽 일치는 관절·팔다리 비율의 일치를 증명하지 않으므로, 외곽선과 내부 기준점(무릎·가랑이·어깨 관절)을 따로 비교하고, 의상에 가려진 기준점은 측정 한계로 적습니다.
  - 실루엣 정합은 안쪽 부위를 맞추지 못합니다. 생성 원화의 장비 위치는 실루엣 비례와 어긋날 수 있습니다.
  - 여러 Blender 프로세스가 굽힌 텍스처를 같은 경로에 저장하면 렌더가 그 파일을 다시 읽어 결과가 섞입니다. 실행마다 텍스처 경로를 나눕니다.

## LoRA 학습 (mflux 0.22.0)

- **메모리가 넘치면 실패하지 않고 swap으로 몇 배 느려집니다.** FLUX.2 klein base 4B를 gradient checkpointing·`low_ram` 없이 학습하면 GPU 할당(`ioreg`)이 71 GB까지 올라 swap 30.4 GB를 쓰며 78초/step이었고, 둘을 켜면 13.0~13.6초/step·최대 메모리 25.0 GiB(`/usr/bin/time -l`)였습니다(M4 Pro 48 GB, 512×1024, rank 128, 2026-10-18). 학습 일정과 시안 수를 정하기 전에 짧은 탐색 실행으로 단계 시간·최대 메모리·`vm.swapusage`를 잽니다.
- `mflux-train`은 CLI의 `--low-ram`·`--mlx-cache-limit-gb`·`--quantize`를 학습 설정에 넘기지 않으므로 설정 JSON의 `low_ram`·`gradient_checkpointing`·`cache_limit_gb`·`quantize`에 씁니다(설치본 `mflux/models/common/cli/train.py`).
- FLUX.2 klein은 base로 학습하고 distilled(4단계)에서 LoRA를 쓰는 것이 BFL 권장 경로입니다([BFL 가이드](https://huggingface.co/blog/black-forest-labs/flux-2-klein-lora), 게시 2026-06-04). 다른 계열의 SFT→Turbo 전이는 계열마다 따로 확인합니다.

## 투명 스프라이트의 키 배경 학습과 복원

- mflux 0.22.0 학습기는 알파가 있는 PNG를 흰색 위에 합성해 RGB로 학습합니다(설치본 `mflux/utils/image_util.py`). 흰 배경에서는 밝은 물체의 알파를 되돌릴 수 없으므로 팩 색과 겹치지 않는 채도 높은 키 색(예: 마젠타) 위에 straight-alpha로 합성해 학습하고, 생성물은 같은 경로로 되돌립니다. 키 합성 이미지를 확대할 때는 링잉이 적은 커널(Mitchell)을 씁니다.
- 생성물의 배경은 선언 키 색 그대로가 아닐 수 있습니다(생성 모델이 `#FF00FF`를 다른 분홍으로 칠하면 선언 키 기준 제거 반경 밖에 배경 전체가 남음). 모서리·테두리의 비투명 표본 중 선언 키 색 계열이 충분할 때만 그 최빈 색 구간(전체 평균은 군집 사이의 없는 색)을 관측 키로 써서 제거와 차이 키의 `키 값`에 반영하고, 근거가 없으면 선언 키를 유지하며 임의의 테두리색을 키로 삼지 않습니다. 관측 키의 반경은 키 hue 특징(키가 아닌 채널이 어두움)을 가진 화소와 거기에 이어진 화소에만 더해 본체 안의 비슷한 색을 지우지 않습니다([sprite-gen `extract.py`](https://github.com/aldegad/sprite-gen/blob/59b2738a2e76ed7043d9691a230396ed6374a336/sprite_gen/frames/extract.py#L215-L451), 코드 확인 2026-10-23).
- 마젠타 차이 키 `alpha = 1 − (min(R,B) − G) / 키 값`은 검은 그림자는 정확히 되돌리지만 G가 B보다 큰 색(녹색·노랑·주황)의 가장자리를 너무 불투명하게 읽어 분홍으로 번지게 합니다. 이 값을 상한으로 두고 가장자리 화소를 "가장 가까운 안쪽 색의 어떤 명암 + 키"의 2변수 최소제곱으로 다시 맞추며, 맞춤 오차가 작을 때만 그 알파를 씁니다.
- 팩 스프라이트 왕복 시험만으로 검증하지 않습니다. 생성 모델은 회색·어두운 면 전체를 키 쪽으로 물들여 그대로 읽으면 본체가 비치고, 가장자리 재맞춤은 그 색을 다른 색 얼룩으로 풀어냅니다. 주변이 모두 거의 불투명한 안쪽 화소는 불투명으로 두고 키 성분만 빼며, 그림자 알파 통계를 기준 범위와 비교합니다. 키 색 계열(빨강·분홍·녹슨 금속) 면은 화소 값으로 키와 구분할 수 없으므로 "어둡지 않은 반투명 화소의 비율"을 기준 범위와 비교해 표시하고 다른 seed를 고릅니다.

## Ollama(MLX) 런타임 (v0.40.4 기준)

- **유효 설정은 서버가 읽은 값으로 확인합니다.** `~/.ollama/logs/server.log`의 `server config` 줄을 보며 `launchctl getenv`나 앱 설정 화면은 증거가 아닙니다. macOS 앱의 서버는 앱 실행 시점의 환경 변수를 물려받아 `launchctl setenv`는 앱을 다시 시작해야 반영되고, 앱 설정의 Context length가 0보다 크면 `OLLAMA_CONTEXT_LENGTH`를 덮어씁니다([app/server/server.go](https://github.com/ollama/ollama/blob/v0.40.4/app/server/server.go), 확인 2026-10-14). 0.40.4 앱은 AppleScript `quit`을 취소(-128)했고 앱 프로세스에 SIGTERM을 보내면 서버까지 정상 종료됩니다.
- **MLX runner 자식 리스너:** MLX 모델이 올라가 있는 동안 runner 자식 프로세스가 `127.0.0.1`의 임의 포트에 뜨고, 이 리스너의 `/v1/completions` 등에는 Host·Origin·인증 검사가 없습니다([mlxrunner/server.go](https://github.com/ollama/ollama/blob/v0.40.4/mlxrunner/server.go), [runner.go](https://github.com/ollama/ollama/blob/v0.40.4/mlxrunner/runner.go), 소스 확인·공격 재현 안 함, 2026-10-15). loopback 바인딩과 11434 포트의 DNS rebinding 방어만으로 안전하다고 보지 않으며, 작업이 끝나면 모델을 내려 리스너를 닫고 보안 검토 범위에 넣습니다.
- **컨텍스트 길이:** 기본값은 VRAM 기준입니다(공식 안내는 24 GiB 미만 4k, 24–48 GiB 32k, 48 GiB 이상 256k, v0.40.4 구현의 경계는 23/47 GiB. [context-length](https://docs.ollama.com/context-length), [server/routes.go](https://github.com/ollama/ollama/blob/v0.40.4/server/routes.go), 확인 2026-10-14). MLX 러너는 `num_ctx`·`OLLAMA_CONTEXT_LENGTH`·앱 설정값을 강제하지 않고 `softContextLength`로 넘겨 `/api/ps`의 `context_length`에만 보입니다. 실제 한도는 모델 최대 컨텍스트이고 채팅 경로는 프롬프트를 자르지 않으며 KV도 미리 잡지 않으므로([server/sched.go](https://github.com/ollama/ollama/blob/v0.40.4/server/sched.go), [mlxrunner/client.go](https://github.com/ollama/ollama/blob/v0.40.4/mlxrunner/client.go), 소스 확인 2026-10-14) 입력 크기와 `max_tokens`는 클라이언트가 제한합니다. GGUF(llama-server) 경로에서는 `num_ctx`가 서버 컨텍스트와 메모리 예측에 쓰이며, OpenAI 호환 API에는 컨텍스트 길이 필드가 없어 Modelfile `PARAMETER num_ctx`로 파생 모델을 만들어 호출합니다([openai-compatibility](https://docs.ollama.com/api/openai-compatibility)).
- **구조화 출력은 HTTP 200으로 믿지 않습니다.** 0.40.4 MLX 러너는 xgrammar로 제약을 걸지만 중첩 스키마에 `response_format`만 보내면 문법이 허용하는 공백만 반복하다 `max_tokens`에서 끝납니다(`qwen3.8:27b-mlx`, 2026-10-14, 원인 미확정). 스키마 원문을 `format`/`response_format`과 프롬프트 양쪽에 넣으면 통과했습니다. 같은 증상이 [#18567](https://github.com/ollama/ollama/issues/18567)로 보고됐지만 "대부분 엔진의 표준 동작"이라며 수정 없이 닫혔고(2026-09-23), [공식 문서](https://docs.ollama.com/capabilities/structured-outputs)도 스키마를 프롬프트에 넣으라고 권합니다. 클라이언트에서 다시 검증하고 `finish_reason: length`를 실패로 처리하며, 배열 순서·enum 중복 같은 의미 규칙은 문법이 막지 못합니다.

## VLM 채점

- VLM 점수도 [측정 타당성 원리](/development/assets-editor.md#검수조립-원리)대로 후보 선별에 쓰기 전에 기준 원본을 후보와 똑같이 채점해 양성 대조하고, 원본이 높은 점수를 받지 못하는 항목은 판별력이 없으므로 기록만 하고 순위에서 뺍니다. VLM 화풍 점수는 원본 에셋에도 낮게 나올 수 있어 원본 기준선과 비교해서만 읽습니다.

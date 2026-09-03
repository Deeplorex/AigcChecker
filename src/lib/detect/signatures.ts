/**
 * 生成工具签名与文件名 hint。label 为产品专名，两种语言通用，不进 i18n。
 * 移植自 prototype/index.html。
 */

export const GEN_SIGNATURES: Array<[pattern: string, label: string]> = [
  ["openai", "OpenAI"],
  ["OpenAI", "OpenAI"],
  ["GPT Image", "OpenAI GPT Image"],
  ["gpt-4o", "OpenAI GPT-4o"],
  ["DALL", "OpenAI DALL·E"],
  ["dall-e", "OpenAI DALL·E"],
  ["Sora", "OpenAI Sora"],
  ["sora", "OpenAI Sora"],
  ["Midjourney", "Midjourney"],
  ["midjourney", "Midjourney"],
  ["Stable Diffusion", "Stable Diffusion"],
  ["stable diffusion", "Stable Diffusion"],
  ["SDXL", "SDXL"],
  ["ComfyUI", "ComfyUI"],
  ["NovelAI", "NovelAI"],
  ["Dreamina", "即梦 Dreamina"],
  ["jimeng", "即梦 Jimeng"],
  ["Kling", "可灵 Kling"],
  ["kling", "可灵 Kling"],
  ["Adobe Firefly", "Adobe Firefly"],
  ["Firefly", "Adobe Firefly"],
  ["Imagen", "Google Imagen"],
  ["Gemini", "Google Gemini"],
  ["trainedAlgorithmicMedia", "C2PA trainedAlgorithmicMedia"],
  ["trainedAlgorithmic", "C2PA trainedAlgorithmic"],
  ["digitalSourceType", "C2PA digitalSourceType"],
  [
    "compositeWithTrainedAlgorithmicMedia",
    "C2PA compositeWithTrainedAlgorithmicMedia",
  ],
];

export const FILENAME_HINTS =
  /chatgpt|gpt[-_ ]?image|dall[-_.]?e|midjourney|comfyui|sdxl|stable[-_]?diffusion|jimeng|即梦|可灵|kling|sora|firefly|gemini|imagen/i;

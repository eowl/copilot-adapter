/**
 * Default API base URLs for each built-in provider.
 *
 * NOTE: These values must stay in sync with the `default` fields under
 * `contributes.configuration.properties.copilot-adapter.providerEndpoints`
 * in package.json — JSON cannot import from TS, so the manifest mirrors
 * these constants manually.
 */
export const DEFAULT_ENDPOINTS = {
  deepseek: 'https://api.deepseek.com',
  minimax: 'https://api.minimaxi.com/v1',
  moonshot: 'https://api.moonshot.cn/v1',
  qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  bigmodel: 'https://open.bigmodel.cn/api/paas/v4',
} as const;

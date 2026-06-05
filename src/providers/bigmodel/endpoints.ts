import type { Endpoint } from '../types';
import { composeEndpoint } from '../utils';
import { BM_MODELS } from './models';

export const BIGMODEL_ENDPOINTS: readonly Endpoint[] = [
  composeEndpoint({ key: 'bigmodel',        label: 'open.bigmodel.cn (standard)',    url: 'https://open.bigmodel.cn/api/paas/v4'      }, BM_MODELS),
  composeEndpoint({ key: 'bigmodel-coding', label: 'open.bigmodel.cn (coding plan)', url: 'https://open.bigmodel.cn/api/coding/paas/v4' }, BM_MODELS),
  composeEndpoint({ key: 'z.ai',            label: 'api.z.ai (standard)',            url: 'https://api.z.ai/api/paas/v4'                }, BM_MODELS),
  composeEndpoint({ key: 'z.ai-coding',     label: 'api.z.ai (coding plan)',         url: 'https://api.z.ai/api/coding/paas/v4'         }, BM_MODELS),
];

import type { Translation } from './types';

export const zh: Translation = {
  'provider.deepseek.detail': '通用对话与深度推理，{0} 个模型',
  'provider.minimax.detail': '深度推理，支持超长上下文，{0} 个模型',

  'model.deepseek-v4-flash.detail': '快速通用模型',
  'model.deepseek-v4-pro.detail': '深度推理模型',
  'model.minimax-m2.detail': '深度推理模型',
  'model.minimax-m2.1.detail': '深度推理模型',
  'model.minimax-m2.1-highspeed.detail': '深度推理，高速版',
  'model.minimax-m2.5.detail': '深度推理模型',
  'model.minimax-m2.5-highspeed.detail': '深度推理，高速版',
  'model.minimax-m2.7.detail': '深度推理模型',
  'model.minimax-m2.7-highspeed.detail': '深度推理，高速版',
  'model.minimax-m3.detail': '深度推理，支持图像',

  'auth.keyInput': '请输入 {0} API Key',
  'auth.keyInputHinted': '请输入 {0} API Key（格式：{1}）',
  'auth.keyHint': 'sk-...',
  'auth.keyRequired': '请输入有效的 API Key',
  'auth.keyStored': '{0} API Key 已安全保存。',
  'auth.chooseProvider': '选择提供商',
  'auth.noKey': '{0} 未配置 API Key。',
  'auth.noKeyTooltip': '{0} 未配置 API Key，请在语言模型面板中添加。',
  'auth.removeViaUI':
    'API Key 由 VS Code 统一管理。请打开语言模型面板，点击对应提供商分组旁的齿轮菜单进行删除。',
  'auth.seedFailed': '无法自动保存 {0} 的 API Key，可以通过语言模型面板手动添加。',
  'action.openManageUI': '打开语言模型面板',

  'think.label': '思考模式',
  'think.none': '无',
  'think.none.hint': '无推理步骤',
  'think.adaptive': '自适应',
  'think.adaptive.hint': '模型自动调整推理深度',
  'think.high': '高',
  'think.high.hint': '适合日常任务',
  'think.max': '最大',
  'think.max.hint': '适合复杂问题',

  'vision.chooseProxy': '选择图像描述模型（默认 {0}）',
  'vision.activeLabel': '当前',
  'vision.disableCmd': '禁用视觉代理',
  'vision.offLabel': '已禁用',
  'vision.providerTag': '提供商：{0}',

  'err.http.401': '认证失败（401）。',
  'err.http.402': '额度不足（402）。',
  'err.http.429': '请求过于频繁（429），请稍后重试。',
  'err.http.500': '服务器内部错误（500）。',
  'err.http.503': '服务暂时不可用（503）。',
  'err.network.dns': '无法连接到 {0}，请检查网络和 API 地址。',
  'err.network.aborted': '请求已取消。',
  'err.network.timeout': '请求超时，请重试。',
  'err.action.keys': '前往 API Keys',
  'err.action.usage': '查看用量',
  'err.action.status': '查看状态',
  'err.action.logs': '查看日志',

  'err.unknownModel': '未知模型：{0}。',

  'tools.drift': '以下工具已从对话中移除以保持上下文连贯：{0}。',
};

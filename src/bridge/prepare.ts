import vscode from 'vscode';
import { resolveImages } from '../vision/resolve';
import type { VisionModelPicker } from '../vision/model';
import { translateMessages, translateTools } from './translate';
import { routeToolFlow, type GateAction } from './utils/router';
import { resolveModelConfig } from './information';
import type { ModelItem } from '../providers/types';
import type { ReqOptions } from './information';
import type { ApiReq } from '../client/types';
import { Settings } from '../settings';
import { countMessageChars } from './tally';
import { imagePart, apiModelId } from '../providers/utils';
import { DEFAULT_IMAGE_FIELD } from './defines';

export interface ReadyReq {
  url: string;
  apiKey: string;
  body: ApiReq;
  model: ModelItem;
  gate: GateAction;
  visionText: string;
  promptChars: number;
}

export interface PrepContext {
  messages: readonly vscode.LanguageModelChatRequestMessage[];
  options: ReqOptions;
  model: ModelItem;
  apiKey: string;
  token: vscode.CancellationToken;
  picker: VisionModelPicker;
  url: string;
}

/**
 * Transform raw VS Code chat request into a ready-to-send API request body.
 * Handles: image resolution, tool routing, message translation, extras injection.
 */
export async function assembleChatReq(ctx: PrepContext): Promise<ReadyReq> {
  const { model, options, token } = ctx;
  const modelProvider = model.provider;
  const modelConfig = resolveModelConfig(options);

  let processedMessages = ctx.messages;
  let visionText = '';
  if (!model.imageInput) {
    const visionResult = await resolveImages(ctx.messages, token, ctx.picker);
    processedMessages = visionResult.messages;
    visionText = visionResult.newVisionText;
  }

  const gate = routeToolFlow(options.tools, processedMessages, model, modelProvider);

  let msgs: ReturnType<typeof translateMessages>;
  let tools: ReturnType<typeof translateTools>;

  const translateOpts = {
    thinkingField: modelProvider.thinkingField,
    formatImagePart:
      model.formatImagePart ??
      (model.imageInput ? imagePart(model.imageField ?? DEFAULT_IMAGE_FIELD) : undefined),
  };

  if (gate.kind === 'proceed') {
    msgs = translateMessages(gate.messages, translateOpts);
    tools = gate.tools ? (gate.tools as ReturnType<typeof translateTools>) : undefined;
  } else if (gate.kind === 'warmup') {
    msgs = translateMessages(processedMessages, translateOpts);
    tools = translateTools(options.tools);
  } else {
    msgs = translateMessages(processedMessages, translateOpts);
    tools = undefined;
  }

  const extras = model.requestExtras?.(modelConfig) ?? {};

  const maxOut = Settings.tokenLimit() ?? model.maxOutputTokens;

  const streamUsage = modelProvider.supportsStreamUsage !== false;

  const body: ApiReq = {
    model: apiModelId(model),
    messages: msgs,
    [model.maxTokensField ?? 'max_tokens']: maxOut,
    stream: true,
    ...(streamUsage ? { stream_options: { include_usage: true } } : {}),
    ...(tools ? { tools } : {}),
    ...extras,
  };

  return {
    url: ctx.url,
    apiKey: ctx.apiKey,
    body,
    model,
    gate,
    visionText,
    promptChars: countMessageChars(ctx.messages),
  };
}

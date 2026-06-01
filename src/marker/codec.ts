import vscode from 'vscode';
import { pack } from '../serialize';
import { BASE64URL_RE, ENCODED_JSON_PREFIX, MARKER_MIME, UUID_RE, WRITER_ID } from './defines';
import type {
  LocatedMarker,
  MarkerPayload,
  MarkerResult,
  ReasoningTextIgnoredReason,
  VisionTextIgnoredReason,
} from './types';

function encodePayloadJson(data: object): string {
  const json = pack(data);
  return `${ENCODED_JSON_PREFIX}${Buffer.from(json, 'utf8').toString('base64url')}`;
}

/**
 * Encode metadata into a DataPart that can be appended to an assistant response.
 * The DataPart is stored in conversation history and decoded on the next turn.
 */
export function encodeMarker(
  payload: MarkerPayload,
  segmentId?: string,
): vscode.LanguageModelDataPart {
  const obj: Record<string, unknown> = {};
  if (segmentId) obj.segmentId = segmentId;
  if (payload.visionText) obj.vision = { text: payload.visionText };
  if (payload.reasoningText) obj.reasoning = { text: payload.reasoningText };

  const encoded = encodePayloadJson(obj);
  return new vscode.LanguageModelDataPart(
    new TextEncoder().encode(`${WRITER_ID}\\${encoded}`),
    MARKER_MIME,
  );
}

/** Returns true when payload contains at least one metadata field. */
export function hasMarkerPayload(payload: MarkerPayload): boolean {
  return Boolean(payload.visionText || payload.reasoningText);
}

type DecodeOutcome =
  | { ok: true; value: string; format: 'json-base64url' | 'legacy-uuid' }
  | { ok: false; error: string };

function decodeRawPayload(raw: string): DecodeOutcome {
  if (raw.startsWith(ENCODED_JSON_PREFIX)) {
    const b64 = raw.slice(ENCODED_JSON_PREFIX.length);
    if (!BASE64URL_RE.test(b64)) return { ok: false, error: 'invalid-base64url' };
    try {
      return {
        ok: true,
        value: Buffer.from(b64, 'base64url').toString('utf8'),
        format: 'json-base64url',
      };
    } catch {
      return { ok: false, error: 'base64-decode-failed' };
    }
  }

  if (UUID_RE.test(raw)) return { ok: true, value: raw, format: 'legacy-uuid' };

  if (BASE64URL_RE.test(raw)) {
    try {
      const decoded = Buffer.from(raw, 'base64url').toString('utf8');
      return { ok: true, value: decoded, format: 'json-base64url' };
    } catch {
      return { ok: false, error: 'base64-decode-failed' };
    }
  }

  return { ok: false, error: 'unknown-payload-format' };
}

export function decodeMarkerData(data: Uint8Array): MarkerResult {
  const text = new TextDecoder().decode(data);
  const sep = text.indexOf('\\');
  if (sep < 0) return { valid: false, error: 'missing-separator' };

  const writer = text.slice(0, sep);
  if (writer !== WRITER_ID) return { valid: false, error: 'unknown-writer' };

  const rawPayload = text.slice(sep + 1);
  const decoded = decodeRawPayload(rawPayload);
  if (!decoded.ok) return { valid: false, error: decoded.error };

  const { value: payload, format: payloadFormat } = decoded;

  if (UUID_RE.test(payload)) {
    return {
      valid: true,
      segmentId: payload.toLowerCase(),
      legacySegmentOnly: true,
      payloadFormat: 'legacy-uuid',
    };
  }

  let obj: unknown;
  try {
    obj = JSON.parse(payload);
  } catch {
    return { valid: false, error: 'json-parse-failed' };
  }

  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return { valid: false, error: 'payload-not-object' };
  }

  const rec = obj as Record<string, unknown>;

  let segmentId: string | undefined;
  if ('segmentId' in rec) {
    if (typeof rec.segmentId !== 'string') return { valid: false, error: 'segment-id-not-string' };
    if (!UUID_RE.test(rec.segmentId)) return { valid: false, error: 'segment-id-not-uuid' };
    segmentId = rec.segmentId.toLowerCase();
  }

  let visionText: string | undefined;
  let visionTextIgnoredReason: VisionTextIgnoredReason | undefined;
  if ('vision' in rec) {
    if (!rec.vision || typeof rec.vision !== 'object' || Array.isArray(rec.vision)) {
      visionTextIgnoredReason = 'vision-not-object';
    } else {
      const v = rec.vision as Record<string, unknown>;
      if (typeof v.text !== 'string') {
        visionTextIgnoredReason = 'vision-text-not-string';
      } else if (!v.text) {
        visionTextIgnoredReason = 'vision-text-empty';
      } else {
        visionText = v.text;
      }
    }
  }

  let reasoningText: string | undefined;
  let reasoningTextIgnoredReason: ReasoningTextIgnoredReason | undefined;
  if ('reasoning' in rec) {
    if (!rec.reasoning || typeof rec.reasoning !== 'object' || Array.isArray(rec.reasoning)) {
      reasoningTextIgnoredReason = 'reasoning-not-object';
    } else {
      const r = rec.reasoning as Record<string, unknown>;
      if (typeof r.text !== 'string') {
        reasoningTextIgnoredReason = 'reasoning-text-not-string';
      } else if (!r.text) {
        reasoningTextIgnoredReason = 'reasoning-text-empty';
      } else {
        reasoningText = r.text;
      }
    }
  }

  return {
    valid: true,
    segmentId,
    visionText,
    visionTextIgnoredReason,
    reasoningText,
    reasoningTextIgnoredReason,
    legacySegmentOnly: Boolean(segmentId && !visionText && !reasoningText),
    payloadFormat,
  };
}

function decodeMarkerPart(part: unknown): MarkerResult | undefined {
  if (!(part instanceof vscode.LanguageModelDataPart)) return undefined;
  if (part.mimeType !== MARKER_MIME) return undefined;
  return decodeMarkerData(part.data);
}

/** Find the first marker DataPart in a message and return its decoded result with index. */
export function findMarkerInMessage(
  message: vscode.LanguageModelChatRequestMessage,
): LocatedMarker | undefined {
  for (const [partIndex, part] of message.content.entries()) {
    const result = decodeMarkerPart(part);
    if (result) return { partIndex, result };
  }
  return undefined;
}

/** Decode the first marker in a message, or return undefined if none is present. */
export function readMarkerFromMessage(
  message: vscode.LanguageModelChatRequestMessage,
): MarkerResult | undefined {
  return findMarkerInMessage(message)?.result;
}

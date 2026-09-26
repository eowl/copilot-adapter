export type ToolArgsFixKind = 'ok' | 'repaired' | 'replaced';

export interface ToolArgsResult {
  value: string;
  kind: ToolArgsFixKind;
  originalLength: number;
}

function isValidJson(s: string): boolean {
  try {
    JSON.parse(s);
    return true;
  } catch {
    return false;
  }
}

export function repairTruncatedJson(input: string): string | undefined {
  const text = input.trim();
  if (!text) return undefined;

  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  let safeEnd = text.length;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        if (ch === 'u') {
          const hex = text.slice(i + 1, i + 5);
          if (hex.length < 4 || !/^[0-9a-fA-F]{4}$/.test(hex)) {
            safeEnd = i - 1;
            break;
          }
          i += 4;
        }
        continue;
      }
      if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === '{' || ch === '[') {
      stack.push(ch);
    } else if (ch === '}' || ch === ']') {
      const open = stack.pop();
      if ((ch === '}' && open !== '{') || (ch === ']' && open !== '[')) {
        return undefined; // Unbalanced — beyond repair.
      }
    }
  }

  let repaired = text;
  if (safeEnd < text.length) {
    repaired = text.slice(0, safeEnd);
    inString = true;
    escaped = false;
  }

  repaired = repaired.replace(/,\s*$/, '');

  if (inString) {
    if (/\\$/.test(repaired)) repaired = repaired.slice(0, -1);
    repaired += '"';
  }

  while (stack.length > 0) {
    const open = stack.pop();
    repaired += open === '{' ? '}' : ']';
  }

  return repaired;
}

export function sanitizeToolArgs(raw: string): ToolArgsResult {
  const originalLength = raw.length;

  if (isValidJson(raw)) {
    return { value: raw, kind: 'ok', originalLength };
  }

  const repaired = repairTruncatedJson(raw);
  if (repaired !== undefined && isValidJson(repaired)) {
    return { value: repaired, kind: 'repaired', originalLength };
  }

  return { value: '{}', kind: 'replaced', originalLength };
}

export function normalizeToolArgs(raw: string): string {
  return sanitizeToolArgs(raw).value;
}

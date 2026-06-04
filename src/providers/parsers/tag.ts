import type { ContentParser } from '../types';

/**
 * Streaming parser that splits content containing XML-style think tags into
 * separate thinking and content events.
 *
 * Example: "<think>reasoning…</think>actual reply"
 * { kind: 'thinking', text: 'reasoning…' }
 * { kind: 'content',  text: 'actual reply' }
 *
 * Safe to use with chunked/partial delivery — buffers until a safe emit boundary.
 * Can be reused by any provider that embeds reasoning in the content stream via XML tags.
 */
export class ThinkTagParser implements ContentParser {
  private state: 'before' | 'in' | 'after' = 'before';
  private buf = '';
  private readonly open: string;
  private readonly close: string;

  constructor(tagName: string) {
    this.open = `<${tagName}>`;
    this.close = `</${tagName}>`;
  }

  feed(chunk: string): Array<{ kind: 'content' | 'thinking'; text: string }> {
    const out: Array<{ kind: 'content' | 'thinking'; text: string }> = [];
    this.buf += chunk;

    while (this.buf.length > 0) {
      if (this.state === 'before') {
        if (this.buf.startsWith(this.open)) {
          this.state = 'in';
          this.buf = this.buf.slice(this.open.length);
        } else if (this.open.startsWith(this.buf)) {
          break;
        } else {
          this.state = 'after';
          out.push({ kind: 'content', text: this.buf });
          this.buf = '';
        }
      } else if (this.state === 'in') {
        const closeIdx = this.buf.indexOf(this.close);
        if (closeIdx >= 0) {
          if (closeIdx > 0) out.push({ kind: 'thinking', text: this.buf.slice(0, closeIdx) });
          this.state = 'after';
          this.buf = this.buf.slice(closeIdx + this.close.length);
        } else {
          // No closing tag yet; only emit the part that can't be a partial close tag
          const safe = this.safeLength(this.buf, this.close);
          if (safe > 0) {
            out.push({ kind: 'thinking', text: this.buf.slice(0, safe) });
            this.buf = this.buf.slice(safe);
          }
          break;
        }
      } else {
        out.push({ kind: 'content', text: this.buf });
        this.buf = '';
      }
    }

    return out;
  }

  flush(): Array<{ kind: 'content' | 'thinking'; text: string }> {
    if (!this.buf) return [];
    const kind = this.state === 'in' ? 'thinking' : 'content';
    const result = [{ kind, text: this.buf }] as Array<{
      kind: 'content' | 'thinking';
      text: string;
    }>;
    this.buf = '';
    return result;
  }

  /** Returns the length of the prefix of `s` that is safe to emit (can't be the start of `tag`). */
  private safeLength(s: string, tag: string): number {
    for (let len = Math.min(s.length, tag.length - 1); len > 0; len--) {
      if (tag.startsWith(s.slice(s.length - len))) return s.length - len;
    }
    return s.length;
  }
}

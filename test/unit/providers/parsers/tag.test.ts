import assert from 'node:assert/strict';
import { suite, test } from 'mocha';
import { ThinkTagParser } from '../../../../src/providers/parsers/tag';

suite('providers/parsers/ThinkTagParser', () => {
  function collect(parser: ThinkTagParser, chunks: string[]): Array<{ kind: string; text: string }> {
    const out: Array<{ kind: string; text: string }> = [];
    for (const chunk of chunks) out.push(...parser.feed(chunk));
    out.push(...parser.flush());
    return out;
  }

  test('pure content (no tags) emits a single content event', () => {
    const p = new ThinkTagParser('think');
    const events = collect(p, ['hello world']);
    assert.deepEqual(events, [{ kind: 'content', text: 'hello world' }]);
  });

  test('full <think>...</think> tag emits thinking then content', () => {
    const p = new ThinkTagParser('think');
    const events = collect(p, ['<think>reasoning</think>reply']);
    assert.deepEqual(events, [
      { kind: 'thinking', text: 'reasoning' },
      { kind: 'content', text: 'reply' },
    ]);
  });

  test('tag with no content after it emits only thinking', () => {
    const p = new ThinkTagParser('think');
    const events = collect(p, ['<think>I am thinking</think>']);
    assert.deepEqual(events, [{ kind: 'thinking', text: 'I am thinking' }]);
  });

  test('chunked delivery: tag split across chunks', () => {
    const p = new ThinkTagParser('think');
    const events = collect(p, ['<think>', 'reasoning', '</think>', 'reply']);
    assert.deepEqual(events, [
      { kind: 'thinking', text: 'reasoning' },
      { kind: 'content', text: 'reply' },
    ]);
  });

  test('partial open tag buffered until complete', () => {
    const p = new ThinkTagParser('think');
    // Deliver the tag in tiny pieces
    const events = collect(p, ['<', 'th', 'ink', '>inner</think>']);
    assert.deepEqual(events, [{ kind: 'thinking', text: 'inner' }]);
  });

  test('partial close tag is buffered and not emitted prematurely', () => {
    const p = new ThinkTagParser('think');
    // Split "</think>" across chunks
    const events = collect(p, ['<think>text</thi', 'nk>after']);
    assert.deepEqual(events, [
      { kind: 'thinking', text: 'text' },
      { kind: 'content', text: 'after' },
    ]);
  });

  test('flush() emits remaining thinking content without close tag', () => {
    const p = new ThinkTagParser('think');
    const out: Array<{ kind: string; text: string }> = [];
    out.push(...p.feed('<think>incomplete'));
    out.push(...p.flush());
    const thinking = out.filter((e) => e.kind === 'thinking').map((e) => e.text).join('');
    assert.ok(thinking.includes('incomplete'), `Got: ${JSON.stringify(out)}`);
  });

  test('flush() after pure content is a no-op if buf is empty', () => {
    const p = new ThinkTagParser('think');
    p.feed('done');
    const flushed = p.flush();
    // buf should be empty after emitting content; flush returns []
    assert.deepEqual(flushed, []);
  });

  test('custom tag name is respected', () => {
    const p = new ThinkTagParser('reasoning');
    const events = collect(p, ['<reasoning>r</reasoning>content']);
    assert.deepEqual(events, [
      { kind: 'thinking', text: 'r' },
      { kind: 'content', text: 'content' },
    ]);
  });
});

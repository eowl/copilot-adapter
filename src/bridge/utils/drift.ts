import vscode from 'vscode';
import { t } from '../../nls';
import { DRIFT_NOTICE_END, DRIFT_NOTICE_START } from './defines';

export function buildDriftWarning(droppedNames: string[]): string {
  return (
    `\n\n${DRIFT_NOTICE_START}\n` +
    t('tools.drift', droppedNames.join(', ')) +
    `\n${DRIFT_NOTICE_END}`
  );
}

/**
 * Remove any previously injected drift-notice blocks from message text.
 * Returns the cleaned text.
 */
export function stripDriftNotice(text: string): string {
  const start = text.indexOf(DRIFT_NOTICE_START);
  if (start < 0) return text;

  const end = text.indexOf(DRIFT_NOTICE_END, start);
  if (end < 0) return text;

  return text.slice(0, start).trimEnd() + text.slice(end + DRIFT_NOTICE_END.length);
}

export function cleanDriftNotices(
  messages: readonly vscode.LanguageModelChatRequestMessage[],
): readonly vscode.LanguageModelChatRequestMessage[] {
  return messages.map((msg) => {
    if (msg.role !== vscode.LanguageModelChatMessageRole.User) return msg;

    let changed = false;
    const newContent = msg.content.map((part) => {
      if (!(part instanceof vscode.LanguageModelTextPart)) return part;
      const cleaned = stripDriftNotice(part.value);
      if (cleaned === part.value) return part;
      changed = true;
      return new vscode.LanguageModelTextPart(cleaned);
    });

    return changed ? { ...msg, content: newContent } : msg;
  });
}

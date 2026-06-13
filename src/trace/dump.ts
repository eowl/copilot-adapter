import * as path from 'path';
import * as fs from 'fs/promises';
import vscode from 'vscode';
import { channel } from '../logger';
import { packPretty } from '../serialize';
import { Settings } from '../settings';
import { getDumpsPath } from '../storage';
import type { ApiReq } from '../client/types';

/**
 * Mask an API key for safe inclusion in diagnostic output.
 * Shows the first 8 and last 4 characters; replaces the middle with bullets.
 * Example: "sk-12345678••••••••cdef"
 */
export function maskToken(key: string): string {
  if (key.length <= 12) return '••••••••';
  return `${key.slice(0, 8)}••••••••${key.slice(-4)}`;
}

export async function dumpRequest(
  storageUri: vscode.Uri,
  segmentId: string,
  body: ApiReq,
  tag: string,
  apiKey?: string,
): Promise<void> {
  if (!Settings.dumpEnabled()) return;

  try {
    const dir = path.join(storageUri.fsPath, 'requests', segmentId);
    await fs.mkdir(dir, { recursive: true });

    const filename = `req-${Date.now()}.json`;
    const dumpPath = path.join(dir, filename);

    const payload: Record<string, unknown> = {
      tag,
      segmentId,
      timestamp: new Date().toISOString(),
      body,
    };
    if (apiKey) {
      payload['apiKeyMasked'] = maskToken(apiKey);
    }

    await fs.writeFile(dumpPath, packPretty(payload), 'utf8');

    channel.debug(`Dump written ${dumpPath}`);
  } catch (err) {
    channel.warn('Failed to write request dump', err);
  }
}

export async function openDumpsFolder(context: vscode.ExtensionContext): Promise<void> {
  const dumpsPath = getDumpsPath(context);
  const dir = vscode.Uri.file(dumpsPath);
  await vscode.commands.executeCommand('revealFileInOS', dir);
}

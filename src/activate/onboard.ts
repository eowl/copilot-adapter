import vscode from 'vscode';
import { channel } from '../logger';
import type { KeyStore } from '../secrets';
import { ALL_PROVIDERS } from '../providers';
import { EXT_ID } from '../defines';

const WELCOME_KEY = `${EXT_ID}.welcomeShown`;

export async function maybeShowWelcome(
  context: vscode.ExtensionContext,
  keys: KeyStore,
): Promise<void> {
  const shown = context.globalState.get<boolean>(WELCOME_KEY);
  if (shown) return;

  for (const provider of ALL_PROVIDERS) {
    if (await keys.has(provider.id)) {
      await context.globalState.update(WELCOME_KEY, true);
      return;
    }
  }

  channel.info('First run: no API keys configured, opening walkthrough.');

  await context.globalState.update(WELCOME_KEY, true);

  try {
    await vscode.commands.executeCommand(
      'workbench.action.openWalkthrough',
      'copilot-adapter.copilotAdapterGettingStarted',
    );
  } catch {
    // Walkthrough may not exist in all VS Code versions
  }
}

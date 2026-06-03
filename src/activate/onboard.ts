import vscode from 'vscode';
import { channel } from '../logger';
import { EXT_ID } from '../defines';

const WELCOME_KEY = `${EXT_ID}.welcomeShown`;

export async function maybeShowWelcome(
  context: vscode.ExtensionContext,
  hasExistingKeys: boolean,
): Promise<void> {
  const shown = context.globalState.get<boolean>(WELCOME_KEY);
  if (shown) return;

  await context.globalState.update(WELCOME_KEY, true);

  if (hasExistingKeys) return;

  channel.info('First run: no API keys configured, opening walkthrough.');

  try {
    await vscode.commands.executeCommand(
      'workbench.action.openWalkthrough',
      'copilot-adapter.copilotAdapterGettingStarted',
    );
  } catch {
    // Walkthrough may not exist in all VS Code versions
  }
}

import vscode from 'vscode';
import { EXT_ID } from '../defines';
import { channel } from '../logger';
import { ALL_PROVIDERS } from '../providers';
import type { ModelProvider } from '../providers';

const MIGRATE_COMMAND = 'lm.migrateLanguageModelsProviderGroup';

function vendorOf(modelProviderId: string): string {
  return `${EXT_ID}-${modelProviderId}`;
}

function legacySecretKey(modelProviderId: string): string {
  return `${EXT_ID}.${modelProviderId}.apiKey`;
}

const LEGACY_MIGRATION_FLAG = `${EXT_ID}.legacyKeysMigrated.v1`;

export async function seedManagedGroup(
  modelProvider: ModelProvider,
  apiKey: string,
): Promise<boolean> {
  try {
    await vscode.commands.executeCommand(MIGRATE_COMMAND, {
      vendor: vendorOf(modelProvider.id),
      name: modelProvider.label,
      apiKey,
    });

    return true;
  } catch (err) {
    channel.warn(`Failed to seed managed group for ${modelProvider.id}: ${String(err)}`);

    return false;
  }
}

export async function migrateLegacySecrets(ctx: vscode.ExtensionContext): Promise<number> {
  if (ctx.globalState.get<boolean>(LEGACY_MIGRATION_FLAG)) return 0;

  let migrated = 0;
  for (const modelProvider of ALL_PROVIDERS) {
    let legacyKey: string | undefined;
    try {
      legacyKey = await ctx.secrets.get(legacySecretKey(modelProvider.id));
    } catch (err) {
      channel.warn(`Could not read legacy secret for ${modelProvider.id}: ${String(err)}`);

      continue;
    }
    if (!legacyKey) continue;

    const ok = await seedManagedGroup(modelProvider, legacyKey);
    if (ok) {
      try {
        await ctx.secrets.delete(legacySecretKey(modelProvider.id));
      } catch (err) {
        channel.warn(`Could not delete legacy secret for ${modelProvider.id}: ${String(err)}`);
      }
      migrated += 1;
      channel.info(`Migrated legacy API key for ${modelProvider.label} into managed storage.`);
    }
  }

  await ctx.globalState.update(LEGACY_MIGRATION_FLAG, true);

  return migrated;
}

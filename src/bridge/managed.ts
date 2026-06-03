import vscode from 'vscode';
import { EXT_ID } from '../defines';
import { channel } from '../logger';
import { ALL_PROVIDERS } from '../providers';
import type { Provider } from '../providers';

const MIGRATE_COMMAND = 'lm.migrateLanguageModelsProviderGroup';

function vendorOf(providerId: string): string {
  return `${EXT_ID}-${providerId}`;
}

function legacySecretKey(providerId: string): string {
  return `${EXT_ID}.${providerId}.apiKey`;
}

const LEGACY_MIGRATION_FLAG = `${EXT_ID}.legacyKeysMigrated.v1`;

export async function seedManagedGroup(provider: Provider, apiKey: string): Promise<boolean> {
  try {
    await vscode.commands.executeCommand(MIGRATE_COMMAND, {
      vendor: vendorOf(provider.id),
      name: provider.label,
      apiKey,
    });

    return true;
  } catch (err) {
    channel.warn(`Failed to seed managed group for ${provider.id}: ${String(err)}`);

    return false;
  }
}

export async function migrateLegacySecrets(ctx: vscode.ExtensionContext): Promise<number> {
  if (ctx.globalState.get<boolean>(LEGACY_MIGRATION_FLAG)) return 0;

  let migrated = 0;
  for (const provider of ALL_PROVIDERS) {
    let legacyKey: string | undefined;
    try {
      legacyKey = await ctx.secrets.get(legacySecretKey(provider.id));
    } catch (err) {
      channel.warn(`Could not read legacy secret for ${provider.id}: ${String(err)}`);

      continue;
    }
    if (!legacyKey) continue;

    const ok = await seedManagedGroup(provider, legacyKey);
    if (ok) {
      try {
        await ctx.secrets.delete(legacySecretKey(provider.id));
      } catch (err) {
        channel.warn(`Could not delete legacy secret for ${provider.id}: ${String(err)}`);
      }
      migrated += 1;
      channel.info(`Migrated legacy API key for ${provider.label} into managed storage.`);
    }
  }

  await ctx.globalState.update(LEGACY_MIGRATION_FLAG, true);

  return migrated;
}

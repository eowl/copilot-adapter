import vscode from 'vscode';
import { ALL_PROVIDERS } from '../providers';
import { Adapter } from '../bridge/adapter';
import { channel } from '../logger';

export async function mountProviders(context: vscode.ExtensionContext): Promise<Adapter[]> {
  const adapters: Adapter[] = [];
  const notifyAll = () => adapters.forEach((a) => a.notifyChange());

  for (const modelProvider of ALL_PROVIDERS) {
    const adapter = new Adapter(context, modelProvider.id, notifyAll);
    const vendor = `copilot-adapter-${modelProvider.id}`;
    channel.info(
      `mountProviders: registering vendor="${vendor}" for provider="${modelProvider.id}"`,
    );
    const registration = vscode.lm.registerLanguageModelChatProvider(vendor, adapter);
    context.subscriptions.push(registration);
    adapters.push(adapter);
  }

  await Promise.all(adapters.map((a) => a.refreshVisionProxy()));

  adapters.forEach((a) => a.notifyChange());

  return adapters;
}

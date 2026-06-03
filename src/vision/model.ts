import vscode from 'vscode';
import { t } from '../nls';
import { EXT_ID } from '../defines';
import { Settings } from '../settings';
import { ALL_MODELS } from '../providers';

const VISION_OFF = 'off';

interface ModelWithCapabilities extends vscode.LanguageModelChat {
  capabilities?: { imageInput?: boolean };
}

type PickItem = vscode.QuickPickItem & { id?: string };

const OWN_VENDOR_PREFIX = `${EXT_ID}-`;

function isVisionCandidate(m: vscode.LanguageModelChat): boolean {
  if (m.vendor.startsWith(OWN_VENDOR_PREFIX)) {
    const own = ALL_MODELS.find((x) => x.id === m.id);

    return own?.ability.acceptsImages === true;
  }

  const cap = (m as ModelWithCapabilities).capabilities;

  return cap?.imageInput !== false;
}

/**
 * Resolves and caches the vision proxy model.
 * A fresh lookup is triggered after reset() or when settings change.
 */
export class VisionModelPicker {
  private cached: vscode.LanguageModelChat | undefined;

  async resolve(): Promise<vscode.LanguageModelChat | undefined> {
    if (this.cached) return this.cached;

    const setting = Settings.visionModel();
    if (!setting || setting === VISION_OFF) return undefined;

    const preferred = setting;
    const candidates = await vscode.lm.selectChatModels();
    const pool = candidates.filter(isVisionCandidate);

    if (!pool.length) return undefined;

    const match = pool.find((m) => m.id === preferred || m.name === preferred);
    this.cached = match ?? pool[0];

    return this.cached;
  }

  reset(): void {
    this.cached = undefined;
  }

  /** Let the user interactively choose the vision proxy model via a QuickPick. */
  static async pick(): Promise<void> {
    const candidates = await vscode.lm.selectChatModels();
    const pool = candidates.filter(isVisionCandidate);

    const setting = Settings.visionModel();
    const isOff = !setting || setting === VISION_OFF;
    const effectiveId = isOff ? '' : setting;

    const disableItem: PickItem = {
      label: `$(circle-slash) ${t('vision.disableCmd')}`,
      description: isOff ? t('vision.activeLabel') : undefined,
      id: VISION_OFF,
    };

    const modelItems: PickItem[] = pool.map((m) => ({
      label: m.name,
      description:
        !isOff && (m.id === effectiveId || m.name === effectiveId)
          ? t('vision.activeLabel')
          : t('vision.providerTag', m.vendor),
      id: m.id,
    }));

    const items: PickItem[] = [
      disableItem,
      ...(modelItems.length > 0
        ? [{ label: '', kind: vscode.QuickPickItemKind.Separator } as PickItem]
        : []),
      ...modelItems,
    ];

    const title = isOff
      ? t('vision.chooseProxy', t('vision.offLabel'))
      : t('vision.chooseProxy', effectiveId);

    const picked = await vscode.window.showQuickPick(items, {
      title,
      ignoreFocusOut: true,
    });

    const newId = (picked as PickItem | undefined)?.id;
    if (newId !== undefined) {
      await vscode.workspace
        .getConfiguration(EXT_ID)
        .update('visionProxyModel', newId, vscode.ConfigurationTarget.Global);
    }
  }
}

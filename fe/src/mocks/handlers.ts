import { authHandlers } from './AuthHandler';
import { escrowHandlers } from './EscrowHandler';
import { itemHandlers } from './ItemHandler';
import { mainHandlers } from './MainHandler';
import { profileHandlers } from './ProfileHandler';
import { sellerHandlers } from './SellerHandler';
import { walletHandlers } from './WalletHandler';
import { settingsHandlers } from './SettingsHandler';
import { liveHandlers } from './LiveHandler';
import { macroHandlers } from './MacroHandler';

export const handlers = [
  ...authHandlers,
  ...mainHandlers,
  ...walletHandlers,
  ...itemHandlers,
  ...sellerHandlers,
  ...profileHandlers,
  ...escrowHandlers,
  ...settingsHandlers,
  ...liveHandlers,
  ...macroHandlers,
];

import { authHandlers } from './AuthHandler';
import { escrowHandlers } from './EscrowHandler';
import { itemHandlers } from './ItemHandler';
import { liveSocketHandler } from './LiveSocketHandler';
import { mainHandlers } from './MainHandler';
import { profileHandlers } from './ProfileHandler';
import { sellerHandlers } from './SellerHandler';
import { walletHandlers } from './WalletHandler';
import { settingsHandlers } from './SettingsHandler';
import { macroHandlers } from './MacroHandler';
import { LiveCreateHandlers } from './LiveCreateHandler';

export const handlers = [
  ...authHandlers,
  ...mainHandlers,
  ...walletHandlers,
  ...itemHandlers,
  ...sellerHandlers,
  ...profileHandlers,
  ...escrowHandlers,
  ...settingsHandlers,
  liveSocketHandler,
  ...LiveCreateHandlers,
  ...macroHandlers,
];

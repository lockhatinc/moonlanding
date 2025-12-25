import { registerDatabaseTriggers } from './database-triggers';
import { registerNotificationTriggers } from './notification-triggers';
import { registerRfiUpdateHooks } from './rfi-update-hooks';

export function initializeAllHooks() {
  console.log('[Init Hooks] Initializing all system hooks and triggers...');

  registerDatabaseTriggers();
  registerNotificationTriggers();
  registerRfiUpdateHooks();

  console.log('[Init Hooks] All hooks and triggers initialized successfully');
}

export default initializeAllHooks;

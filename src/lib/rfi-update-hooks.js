import { hookEngine } from './hook-engine';
import { rfiPermissionValidator } from './rfi-permission-validator';

export function registerRfiUpdateHooks() {
  hookEngine.register('rfi.before.update', async ({ entityId, updates, user, context }) => {
    const validation = rfiPermissionValidator.validateRfiUpdate(entityId, updates, user);

    if (!validation.valid) {
      throw new Error(validation.error || 'RFI update validation failed');
    }

    console.log(`[RFI Update Hook] User ${user?.email || 'unknown'} (${user?.role || 'unknown'}) updating RFI ${entityId}`);

    return { proceed: true, validation };
  });

  hookEngine.register('rfi_response.before.update', async ({ entityId, updates, user, context }) => {
    const validation = rfiPermissionValidator.validateRfiResponseStatusUpdate(entityId, updates, user);

    if (!validation.valid) {
      throw new Error(validation.error || 'RFI Response update validation failed');
    }

    console.log(`[RFI Response Update Hook] User ${user?.email || 'unknown'} (${user?.role || 'unknown'}) updating RFI Response ${entityId}`);

    return { proceed: true, validation };
  });

  hookEngine.register('file.before.create', async ({ entityType, entityId, user, context }) => {
    const uploadCheck = rfiPermissionValidator.canUploadFile(entityType, entityId, user);

    if (!uploadCheck.canUpload) {
      throw new Error(uploadCheck.error || 'File upload not permitted');
    }

    console.log(`[File Upload Hook] User ${user?.email || 'unknown'} (${user?.role || 'unknown'}) uploading file to ${entityType} ${entityId}`);

    return { proceed: true, canUpload: true };
  });

  console.log('[RFI Update Hooks] Registered: rfi.before.update, rfi_response.before.update, file.before.create');
}

export default registerRfiUpdateHooks;

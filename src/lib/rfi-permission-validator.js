import { get, list } from '@/engine';

export class RfiPermissionValidator {
  validateClerkRfiStatusUpdate(rfi, updates, currentUser) {
    if (!currentUser || currentUser.role !== 'clerk') {
      return { valid: true, canForceStatus: true };
    }

    const isStatusUpdate = updates.status === 'completed' || updates.status === 1 ||
                          updates.client_status === 'completed' || updates.client_status === 1;

    if (!isStatusUpdate) {
      return { valid: true };
    }

    const filesCount = updates.files_count !== undefined ? updates.files_count : (rfi.files_count || 0);
    const responsesCount = updates.response_count !== undefined ? updates.response_count : (rfi.response_count || 0);

    const responseText = updates.response_text || rfi.response_text;
    const hasResponseBody = responseText && responseText.trim().length > 0;

    const hasFile = filesCount > 0;
    const hasResponse = responsesCount > 0 || hasResponseBody;

    if (!hasFile && !hasResponse) {
      return {
        valid: false,
        error: 'Clerks cannot set status to "Completed" without a valid file attachment or response body text',
        code: 'CLERK_COMPLETION_VALIDATION_FAILED'
      };
    }

    return { valid: true };
  }

  validateRfiUpdate(entityId, updates, currentUser) {
    const rfi = get('rfi', entityId);
    if (!rfi) {
      return { valid: true };
    }

    if (!currentUser) {
      return { valid: false, error: 'User not authenticated', code: 'NOT_AUTHENTICATED' };
    }

    const userRole = currentUser.role || 'clerk';

    if (userRole === 'partner' || userRole === 'manager') {
      return { valid: true, canForceStatus: true };
    }

    return this.validateClerkRfiStatusUpdate(rfi, updates, currentUser);
  }

  validateRfiResponseStatusUpdate(rfiResponseId, updates, currentUser) {
    const rfiResponse = get('rfi_response', rfiResponseId);
    if (!rfiResponse) {
      return { valid: true };
    }

    if (!currentUser) {
      return { valid: false, error: 'User not authenticated', code: 'NOT_AUTHENTICATED' };
    }

    const userRole = currentUser.role || 'clerk';

    if (userRole === 'partner' || userRole === 'manager') {
      return { valid: true, canForceStatus: true };
    }

    const isStatusUpdate = updates.status === 'accepted' || updates.status === 'completed' ||
                          updates.is_complete === true;

    if (!isStatusUpdate) {
      return { valid: true };
    }

    const fileAttachments = updates.file_attachments !== undefined
      ? updates.file_attachments
      : (rfiResponse.file_attachments || []);

    const responseText = updates.response_text !== undefined
      ? updates.response_text
      : (rfiResponse.response_text || '');

    const hasFile = Array.isArray(fileAttachments) && fileAttachments.length > 0;
    const hasResponseBody = responseText && responseText.trim().length > 0;

    if (!hasFile && !hasResponseBody) {
      return {
        valid: false,
        error: 'Clerks cannot mark response as complete without a valid file attachment or response body text',
        code: 'CLERK_RESPONSE_COMPLETION_VALIDATION_FAILED'
      };
    }

    return { valid: true };
  }

  canUploadFile(entityType, entityId, currentUser) {
    if (!currentUser) {
      return { canUpload: false, error: 'User not authenticated' };
    }

    const userRole = currentUser.role || 'clerk';

    if (userRole === 'clerk') {
      if (entityType === 'rfi' || entityType === 'rfi_response') {
        return { canUpload: true };
      }
    }

    if (userRole === 'partner' || userRole === 'manager') {
      return { canUpload: true };
    }

    return { canUpload: true };
  }
}

export const rfiPermissionValidator = new RfiPermissionValidator();
export default rfiPermissionValidator;

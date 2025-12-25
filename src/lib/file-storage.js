import { getDriveClient } from '@/adapters/google-auth';
import { GoogleAdapter } from '@/adapters/google-adapter-base';

const FRIDAY_ROOT_FOLDER = process.env.FRIDAY_DRIVE_ROOT_FOLDER || 'LockhatInc';
const MWR_ROOT_FOLDER = process.env.MWR_DRIVE_ROOT_FOLDER || '1LZwInex0XVr6UKqyY_w6G2JeUyeUiiPG';

class FileStorageService {
  constructor() {
    this.driveAdapter = new GoogleAdapter('Drive', getDriveClient);
  }

  getStoragePath(entityType, entityData) {
    const timestamp = Date.now();
    const fileName = entityData.fileName || entityData.name || 'file';
    const safeFileName = `${fileName}_${timestamp}`;

    switch (entityType) {
      case 'rfi_attachment':
        if (!entityData.clientId || !entityData.engagementId || !entityData.rfiId || !entityData.questionId) {
          throw new Error('Friday RFI Attachment requires: clientId, engagementId, rfiId, questionId');
        }
        return {
          path: `/${entityData.clientId}/${entityData.engagementId}/${entityData.rfiId}/${entityData.questionId}/${safeFileName}`,
          domain: 'friday',
          type: 'rfi_attachment'
        };

      case 'friday_master_file':
        if (!entityData.clientId || !entityData.engagementId) {
          throw new Error('Friday Master File requires: clientId, engagementId');
        }
        return {
          path: `/${FRIDAY_ROOT_FOLDER}/${entityData.clientId}/${entityData.engagementId}/${safeFileName}`,
          domain: 'friday',
          type: 'master_file'
        };

      case 'mwr_chat_attachment':
        if (!entityData.org || !entityData.reviewId) {
          throw new Error('MWR Chat Attachment requires: org, reviewId');
        }
        return {
          path: `/${entityData.org}/${entityData.reviewId}/${safeFileName}`,
          domain: 'mwr',
          type: 'chat_attachment'
        };

      case 'mwr_review':
        if (!entityData.reviewId) {
          throw new Error('MWR Review requires: reviewId');
        }
        return {
          path: `/${MWR_ROOT_FOLDER}/${entityData.reviewId}/${safeFileName}`,
          domain: 'mwr',
          type: 'review'
        };

      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  async uploadFile(content, entityType, entityData, mimeType = 'application/octet-stream') {
    const storageInfo = this.getStoragePath(entityType, entityData);
    const pathParts = storageInfo.path.split('/').filter(Boolean);
    const fileName = pathParts.pop();

    return this.driveAdapter.safeExecute(async (drive) => {
      let currentFolderId = null;

      for (const folderName of pathParts) {
        const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false${currentFolderId ? ` and '${currentFolderId}' in parents` : ''}`;
        const searchResult = await drive.files.list({
          q: query,
          fields: 'files(id, name)',
          spaces: 'drive'
        });

        if (searchResult.data.files && searchResult.data.files.length > 0) {
          currentFolderId = searchResult.data.files[0].id;
        } else {
          const folderMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: currentFolderId ? [currentFolderId] : undefined
          };
          const folder = await drive.files.create({
            requestBody: folderMetadata,
            fields: 'id, name'
          });
          currentFolderId = folder.data.id;
        }
      }

      const fileMetadata = {
        name: fileName,
        parents: currentFolderId ? [currentFolderId] : undefined
      };

      const uploadResult = await drive.files.create({
        requestBody: fileMetadata,
        media: {
          mimeType,
          body: content
        },
        fields: 'id, name, mimeType, webViewLink, webContentLink, size'
      });

      return {
        ...uploadResult.data,
        storagePath: storageInfo.path,
        domain: storageInfo.domain,
        type: storageInfo.type
      };
    }, 'uploadFile');
  }

  async downloadFile(fileId) {
    return this.driveAdapter.safeExecute(async (drive) => {
      const result = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'arraybuffer' }
      );
      return Buffer.from(result.data);
    }, 'downloadFile');
  }

  async deleteFile(fileId) {
    return this.driveAdapter.safeExecute(async (drive) => {
      await drive.files.delete({ fileId });
      return { success: true, fileId };
    }, 'deleteFile');
  }

  async getFileMetadata(fileId) {
    return this.driveAdapter.safeExecute(async (drive) => {
      const result = await drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, webViewLink, webContentLink, createdTime, modifiedTime, parents'
      });
      return result.data;
    }, 'getFileMetadata');
  }

  validatePathPattern(entityType, entityData) {
    try {
      this.getStoragePath(entityType, entityData);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

export const fileStorageService = new FileStorageService();
export default fileStorageService;

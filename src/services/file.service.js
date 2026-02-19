import { getDocsClient, getDriveClient } from '@/adapters/google-auth';
import { GoogleAdapter } from '@/adapters/google-adapter-base';
import { config } from '@/config';
import { formatDate } from '@/lib/date-utils';

const ENTITY_PATHS = {
  rfi_attachment: (d) => `/${d.clientId}/${d.engagementId}/${d.rfiId}/${d.questionId}`,
  engagement_file: (d) => `/engagements/${d.clientId}/${d.engagementId}`,
  review_file: (d) => `/reviews/${d.reviewId}`,
  review_chat: (d) => `/reviews/${d.reviewId}/chat`,
  tender_file: (d) => `/tenders/${d.tenderId || d.reviewId}`,
  general: () => '/uploads',
};

function resolveStoragePath(entityType, data) {
  const resolver = ENTITY_PATHS[entityType] || ENTITY_PATHS.general;
  const basePath = resolver(data);
  const safeName = `${data.fileName || data.name || 'file'}_${Date.now()}`;
  return { path: `${basePath}/${safeName}`, domain: entityType.startsWith('review') ? 'mwr' : 'friday' };
}

class FileService {
  constructor() {
    this.driveAdapter = new GoogleAdapter('Drive', getDriveClient);
    this.docsAdapter = new GoogleAdapter('Docs', getDocsClient);
  }

  getStoragePath(entityType, entityData) {
    return resolveStoragePath(entityType, entityData);
  }

  async upload(content, name, mimeType, folderId = config.drive?.rootFolderId, convertToGoogleDoc = false) {
    return this.driveAdapter.safeExecute(async (drive) => {
      const meta = { name, parents: folderId ? [folderId] : undefined };
      if (convertToGoogleDoc && mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        meta.mimeType = 'application/vnd.google-apps.document';
      }
      return (await drive.files.create({
        requestBody: meta, media: { mimeType, body: content },
        fields: 'id, name, mimeType, webViewLink, webContentLink'
      })).data;
    }, 'upload');
  }

  async uploadForEntity(content, entityType, entityData, mimeType = 'application/octet-stream') {
    const storageInfo = resolveStoragePath(entityType, entityData);
    const pathParts = storageInfo.path.split('/').filter(Boolean);
    const fileName = pathParts.pop();
    return this.driveAdapter.safeExecute(async (drive) => {
      let folderId = null;
      for (const folderName of pathParts) {
        const q = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false${folderId ? ` and '${folderId}' in parents` : ''}`;
        const found = await drive.files.list({ q, fields: 'files(id, name)', spaces: 'drive' });
        if (found.data.files?.length > 0) {
          folderId = found.data.files[0].id;
        } else {
          const folder = await drive.files.create({
            requestBody: { name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: folderId ? [folderId] : undefined },
            fields: 'id, name'
          });
          folderId = folder.data.id;
        }
      }
      const result = await drive.files.create({
        requestBody: { name: fileName, parents: folderId ? [folderId] : undefined },
        media: { mimeType, body: content },
        fields: 'id, name, mimeType, webViewLink, webContentLink, size'
      });
      return { ...result.data, storagePath: storageInfo.path, domain: storageInfo.domain };
    }, 'uploadForEntity');
  }

  async download(fileId) {
    return this.driveAdapter.safeExecute(async (drive) =>
      Buffer.from((await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' })).data),
      'download'
    );
  }

  async delete(fileId) {
    return this.driveAdapter.safeExecute((drive) => drive.files.delete({ fileId }), 'delete');
  }

  async get(fileId) {
    return this.driveAdapter.safeExecute(async (drive) =>
      (await drive.files.get({ fileId, fields: 'id, name, mimeType, size, webViewLink, webContentLink, createdTime, modifiedTime' })).data,
      'get'
    );
  }

  async list(folderId = config.drive?.rootFolderId) {
    return this.driveAdapter.safeExecute(async (drive) =>
      (await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType, size, webViewLink, webContentLink, createdTime)',
        orderBy: 'createdTime desc'
      })).data.files || [],
      'list'
    );
  }

  async copy(fileId, name, folderId = null) {
    return this.driveAdapter.safeExecute(async (drive) =>
      (await drive.files.copy({
        fileId, requestBody: { name, parents: folderId ? [folderId] : undefined },
        fields: 'id, name, webViewLink'
      })).data,
      'copy'
    );
  }

  async replaceTokens(docId, replacements) {
    return this.docsAdapter.safeExecute(async (docs) => {
      const requests = Object.entries(replacements).map(([key, value]) => ({
        replaceAllText: { containsText: { text: `{${key}}`, matchCase: true }, replaceText: value || '' }
      }));
      await docs.documents.batchUpdate({ documentId: docId, requestBody: { requests } });
    }, 'replaceTokens');
  }

  async exportToPdf(fileId) {
    return this.driveAdapter.safeExecute(async (drive) =>
      Buffer.from((await drive.files.export({ fileId, mimeType: 'application/pdf' }, { responseType: 'arraybuffer' })).data),
      'exportToPdf'
    );
  }

  async createFolder(name, parentId = config.drive?.rootFolderId) {
    return this.driveAdapter.safeExecute(async (drive) =>
      (await drive.files.create({
        requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: parentId ? [parentId] : undefined },
        fields: 'id, name, webViewLink'
      })).data,
      'createFolder'
    );
  }

  async generateEngagementLetter(templateId, data, folderId) {
    const copy = await this.copy(templateId, `${data.client}_${data.year}_Engagement_Letter`, folderId);
    await this.replaceTokens(copy.id, {
      client: data.client, year: data.year, address: data.address || '',
      date: data.date || formatDate(Date.now() / 1000, 'short'),
      email: data.email || '', engagement: data.engagement || ''
    });
    return { docId: copy.id, pdf: await this.exportToPdf(copy.id) };
  }
}

export const fileService = new FileService();

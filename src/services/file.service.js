import { getDocsClient, getDriveClient } from '@/adapters/google-auth';
import { GoogleAdapter } from '@/adapters/google-adapter-base';
import { config } from '@/config';
import { formatDate } from '@/lib/date-utils';

class FileService {
  constructor() {
    this.driveAdapter = new GoogleAdapter('Drive', getDriveClient);
    this.docsAdapter = new GoogleAdapter('Docs', getDocsClient);
  }

  async upload(content, name, mimeType, folderId = config.drive.rootFolderId, convertToGoogleDoc = false) {
    return this.driveAdapter.safeExecute(async (drive) => {
      const fileMetadata = { name, parents: folderId ? [folderId] : undefined };
      if (convertToGoogleDoc && mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        fileMetadata.mimeType = 'application/vnd.google-apps.document';
      }
      return (await drive.files.create({
        requestBody: fileMetadata,
        media: { mimeType, body: content },
        fields: 'id, name, mimeType, webViewLink, webContentLink'
      })).data;
    }, 'upload');
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

  async list(folderId = config.drive.rootFolderId) {
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
        fileId,
        requestBody: { name, parents: folderId ? [folderId] : undefined },
        fields: 'id, name, webViewLink'
      })).data,
      'copy'
    );
  }

  async replaceTokens(docId, replacements) {
    return this.docsAdapter.safeExecute(async (docs) => {
      const requests = Object.entries(replacements).map(([key, value]) => ({
        replaceAllText: {
          containsText: { text: `{${key}}`, matchCase: true },
          replaceText: value || ''
        }
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

  async createFolder(name, parentId = config.drive.rootFolderId) {
    return this.driveAdapter.safeExecute(async (drive) =>
      (await drive.files.create({
        requestBody: {
          name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: parentId ? [parentId] : undefined
        },
        fields: 'id, name, webViewLink'
      })).data,
      'createFolder'
    );
  }

  async getEntityFolder(entityType, entityId, entityName) {
    return this.driveAdapter.safeExecute(async (drive) => {
      const query = `name = '${entityId}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const search = await drive.files.list({ q: query, fields: 'files(id, name)' });
      return search.data.files?.length > 0
        ? search.data.files[0]
        : this.createFolder(`${entityName || entityId}`, config.drive.rootFolderId);
    }, 'getEntityFolder');
  }

  async generateEngagementLetter(templateId, data, folderId) {
    const copy = await this.copy(templateId, `${data.client}_${data.year}_Engagement_Letter`, folderId);
    await this.replaceTokens(copy.id, {
      client: data.client,
      year: data.year,
      address: data.address || '',
      date: data.date || formatDate(Date.now() / 1000, 'short'),
      email: data.email || '',
      engagement: data.engagement || ''
    });
    return { docId: copy.id, pdf: await this.exportToPdf(copy.id) };
  }
}

export const fileService = new FileService();

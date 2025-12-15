import { getDriveClient } from './google-auth';
import { config } from '@/config';

export async function uploadFile(content, name, mimeType, folderId = config.drive.rootFolderId, convertToGoogleDoc = false) {
  const drive = await getDriveClient();
  if (!drive) throw new Error('Drive client not available');

  const fileMetadata = {
    name,
    parents: folderId ? [folderId] : undefined,
  };

  if (convertToGoogleDoc) {
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      fileMetadata.mimeType = 'application/vnd.google-apps.document';
    }
  }

  const media = {
    mimeType,
    body: content,
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, name, mimeType, webViewLink, webContentLink',
  });

  return response.data;
}

export async function downloadFile(fileId) {
  const drive = await getDriveClient();
  if (!drive) throw new Error('Drive client not available');

  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );

  return Buffer.from(response.data);
}

export async function deleteFile(fileId) {
  const drive = await getDriveClient();
  if (!drive) throw new Error('Drive client not available');

  await drive.files.delete({ fileId });
}

export async function getFile(fileId) {
  const drive = await getDriveClient();
  if (!drive) throw new Error('Drive client not available');

  const response = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size, webViewLink, webContentLink, createdTime, modifiedTime',
  });

  return response.data;
}

export async function listFiles(folderId = config.drive.rootFolderId) {
  const drive = await getDriveClient();
  if (!drive) throw new Error('Drive client not available');

  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, size, webViewLink, webContentLink, createdTime)',
    orderBy: 'createdTime desc',
  });

  return response.data.files || [];
}

export async function copyFile(fileId, name, folderId = null) {
  const drive = await getDriveClient();
  if (!drive) throw new Error('Drive client not available');

  const response = await drive.files.copy({
    fileId,
    requestBody: {
      name,
      parents: folderId ? [folderId] : undefined,
    },
    fields: 'id, name, webViewLink',
  });

  return response.data;
}

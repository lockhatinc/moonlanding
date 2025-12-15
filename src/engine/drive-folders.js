import { getDriveClient } from './google-auth';
import { config } from '@/config';

export async function createFolder(name, parentId = config.drive.rootFolderId) {
  const drive = await getDriveClient();
  if (!drive) throw new Error('Drive client not available');

  const response = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined,
    },
    fields: 'id, name, webViewLink',
  });

  return response.data;
}

export async function getEntityFolder(entityType, entityId, entityName) {
  const drive = await getDriveClient();
  if (!drive) throw new Error('Drive client not available');

  const query = `name = '${entityId}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const search = await drive.files.list({ q: query, fields: 'files(id, name)' });

  if (search.data.files?.length > 0) {
    return search.data.files[0];
  }

  return createFolder(`${entityName || entityId}`, config.drive.rootFolderId);
}

import { getDocsClient, getDriveClient } from './google-auth';
import { config } from '@/config';

export { getDriveClient };

async function uploadFile(content, name, mimeType, folderId = config.drive.rootFolderId, convertToGoogleDoc = false) {
  const drive = await getDriveClient();
  if (!drive) throw new Error('Drive client not available');
  const fileMetadata = { name, parents: folderId ? [folderId] : undefined };
  if (convertToGoogleDoc && mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    fileMetadata.mimeType = 'application/vnd.google-apps.document';
  }
  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: { mimeType, body: content },
    fields: 'id, name, mimeType, webViewLink, webContentLink',
  });
  return response.data;
}

async function downloadFile(fileId) {
  const drive = await getDriveClient();
  if (!drive) throw new Error('Drive client not available');
  const response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
}

async function deleteFile(fileId) {
  const drive = await getDriveClient();
  if (!drive) throw new Error('Drive client not available');
  await drive.files.delete({ fileId });
}

async function getFile(fileId) {
  const drive = await getDriveClient();
  if (!drive) throw new Error('Drive client not available');
  const response = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size, webViewLink, webContentLink, createdTime, modifiedTime',
  });
  return response.data;
}

async function listFiles(folderId = config.drive.rootFolderId) {
  const drive = await getDriveClient();
  if (!drive) throw new Error('Drive client not available');
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, size, webViewLink, webContentLink, createdTime)',
    orderBy: 'createdTime desc',
  });
  return response.data.files || [];
}

async function copyFile(fileId, name, folderId = null) {
  const drive = await getDriveClient();
  if (!drive) throw new Error('Drive client not available');
  const response = await drive.files.copy({
    fileId,
    requestBody: { name, parents: folderId ? [folderId] : undefined },
    fields: 'id, name, webViewLink',
  });
  return response.data;
}

async function replaceInDoc(docId, replacements) {
  const docs = await getDocsClient();
  if (!docs) throw new Error('Docs client not available');
  const requests = Object.entries(replacements).map(([key, value]) => ({
    replaceAllText: { containsText: { text: `{${key}}`, matchCase: true }, replaceText: value || '' },
  }));
  await docs.documents.batchUpdate({ documentId: docId, requestBody: { requests } });
}

async function exportToPdf(fileId) {
  const drive = await getDriveClient();
  if (!drive) throw new Error('Drive client not available');
  const response = await drive.files.export({ fileId, mimeType: 'application/pdf' }, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
}

async function generateEngagementLetter(templateId, data, folderId) {
  const copy = await copyFile(templateId, `${data.client}_${data.year}_Engagement_Letter`, folderId);
  await replaceInDoc(copy.id, {
    client: data.client, year: data.year, address: data.address || '', date: data.date || new Date().toLocaleDateString(), email: data.email || '', engagement: data.engagement || '',
  });
  const pdf = await exportToPdf(copy.id);
  return { docId: copy.id, pdf };
}

async function createFolder(name, parentId = config.drive.rootFolderId) {
  const drive = await getDriveClient();
  if (!drive) throw new Error('Drive client not available');
  const response = await drive.files.create({
    requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: parentId ? [parentId] : undefined },
    fields: 'id, name, webViewLink',
  });
  return response.data;
}

async function getEntityFolder(entityType, entityId, entityName) {
  const drive = await getDriveClient();
  if (!drive) throw new Error('Drive client not available');
  const query = `name = '${entityId}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const search = await drive.files.list({ q: query, fields: 'files(id, name)' });
  if (search.data.files?.length > 0) return search.data.files[0];
  return createFolder(`${entityName || entityId}`, config.drive.rootFolderId);
}

export { uploadFile, downloadFile, deleteFile, getFile, listFiles, copyFile, replaceInDoc, exportToPdf, generateEngagementLetter, createFolder, getEntityFolder };

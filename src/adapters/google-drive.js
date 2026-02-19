import { getDocsClient, getDriveClient } from '@/adapters/google-auth.js';
import { GoogleAdapter, createAdapterMethod } from '@/adapters/google-adapter-base.js';
import { config } from '@/config';
import { formatDate } from '@/lib/date-utils';

export { getDriveClient };

const driveAdapter = new GoogleAdapter('Drive', getDriveClient);
const docsAdapter = new GoogleAdapter('Docs', getDocsClient);

const uploadFile = (content, name, mimeType, folderId = config.drive.rootFolderId, convertToGoogleDoc = false) =>
  driveAdapter.safeExecute(async (drive) => {
    const fileMetadata = { name, parents: folderId ? [folderId] : undefined };
    if (convertToGoogleDoc && mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      fileMetadata.mimeType = 'application/vnd.google-apps.document';
    }
    return (await drive.files.create({ requestBody: fileMetadata, media: { mimeType, body: content }, fields: 'id, name, mimeType, webViewLink, webContentLink' })).data;
  }, 'uploadFile');

const downloadFile = (fileId) => driveAdapter.safeExecute(async (drive) =>
  Buffer.from((await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' })).data), 'downloadFile');

const deleteFile = (fileId) => driveAdapter.safeExecute((drive) => drive.files.delete({ fileId }), 'deleteFile');

const getFile = (fileId) => driveAdapter.safeExecute(async (drive) =>
  (await drive.files.get({ fileId, fields: 'id, name, mimeType, size, webViewLink, webContentLink, createdTime, modifiedTime' })).data, 'getFile');

const listFiles = (folderId = config.drive.rootFolderId) => driveAdapter.safeExecute(async (drive) =>
  (await drive.files.list({ q: `'${folderId}' in parents and trashed = false`, fields: 'files(id, name, mimeType, size, webViewLink, webContentLink, createdTime)', orderBy: 'createdTime desc' })).data.files || [], 'listFiles');

const copyFile = (fileId, name, folderId = null) => driveAdapter.safeExecute(async (drive) =>
  (await drive.files.copy({ fileId, requestBody: { name, parents: folderId ? [folderId] : undefined }, fields: 'id, name, webViewLink' })).data, 'copyFile');

const replaceInDoc = (docId, replacements) => docsAdapter.safeExecute(async (docs) => {
  const requests = Object.entries(replacements).map(([key, value]) => ({ replaceAllText: { containsText: { text: `{${key}}`, matchCase: true }, replaceText: value || '' } }));
  await docs.documents.batchUpdate({ documentId: docId, requestBody: { requests } });
}, 'replaceInDoc');

const exportToPdf = (fileId) => driveAdapter.safeExecute(async (drive) =>
  Buffer.from((await drive.files.export({ fileId, mimeType: 'application/pdf' }, { responseType: 'arraybuffer' })).data), 'exportToPdf');

const createFolder = (name, parentId = config.drive.rootFolderId) => driveAdapter.safeExecute(async (drive) =>
  (await drive.files.create({ requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: parentId ? [parentId] : undefined }, fields: 'id, name, webViewLink' })).data, 'createFolder');

const getEntityFolder = (entityType, entityId, entityName) => driveAdapter.safeExecute(async (drive) => {
  const query = `name = '${entityId}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const search = await drive.files.list({ q: query, fields: 'files(id, name)' });
  return search.data.files?.length > 0 ? search.data.files[0] : createFolder(`${entityName || entityId}`, config.drive.rootFolderId);
}, 'getEntityFolder');

const generateEngagementLetter = async (templateId, data, folderId) => {
  const copy = await copyFile(templateId, `${data.client}_${data.year}_Engagement_Letter`, folderId);
  await replaceInDoc(copy.id, { client: data.client, year: data.year, address: data.address || '', date: data.date || formatDate(Date.now() / 1000, 'short'), email: data.email || '', engagement: data.engagement || '' });
  return { docId: copy.id, pdf: await exportToPdf(copy.id) };
};

export { uploadFile, downloadFile, deleteFile, getFile, listFiles, copyFile, replaceInDoc, exportToPdf, generateEngagementLetter, createFolder, getEntityFolder };

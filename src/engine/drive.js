// Google Drive integration using Domain-Wide Delegation
import { google } from 'googleapis';
import { getDriveClient, getDocsClient } from './google-auth';

// Default folder for uploads
const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

// Re-export getDriveClient for backwards compatibility
export { getDriveClient } from './google-auth';

/**
 * Upload a file to Google Drive
 * @param {Buffer|Stream} content - File content
 * @param {string} name - File name
 * @param {string} mimeType - MIME type
 * @param {string} folderId - Parent folder ID (optional)
 * @param {boolean} convertToGoogleDoc - Convert to Google Docs format
 */
export async function uploadFile(content, name, mimeType, folderId = ROOT_FOLDER_ID, convertToGoogleDoc = false) {
  const drive = await getDriveClient();
  if (!drive) throw new Error('Drive client not available');

  const fileMetadata = {
    name,
    parents: folderId ? [folderId] : undefined,
  };

  // For Google Docs conversion
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

/**
 * Download a file from Google Drive
 * @param {string} fileId - File ID
 * @returns {Buffer} File content
 */
export async function downloadFile(fileId) {
  const drive = await getDriveClient();
  if (!drive) throw new Error('Drive client not available');

  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );

  return Buffer.from(response.data);
}

/**
 * Export a Google Doc to PDF
 * @param {string} fileId - Google Doc file ID
 * @returns {Buffer} PDF content
 */
export async function exportToPdf(fileId) {
  const drive = await getDriveClient();
  if (!drive) throw new Error('Drive client not available');

  const response = await drive.files.export(
    { fileId, mimeType: 'application/pdf' },
    { responseType: 'arraybuffer' }
  );

  return Buffer.from(response.data);
}

/**
 * Create a folder in Google Drive
 * @param {string} name - Folder name
 * @param {string} parentId - Parent folder ID (optional)
 */
export async function createFolder(name, parentId = ROOT_FOLDER_ID) {
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

/**
 * Delete a file from Google Drive
 * @param {string} fileId - File ID
 */
export async function deleteFile(fileId) {
  const drive = await getDriveClient();
  if (!drive) throw new Error('Drive client not available');

  await drive.files.delete({ fileId });
}

/**
 * Get file metadata
 * @param {string} fileId - File ID
 */
export async function getFile(fileId) {
  const drive = await getDriveClient();
  if (!drive) throw new Error('Drive client not available');

  const response = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size, webViewLink, webContentLink, createdTime, modifiedTime',
  });

  return response.data;
}

/**
 * List files in a folder
 * @param {string} folderId - Folder ID
 */
export async function listFiles(folderId = ROOT_FOLDER_ID) {
  const drive = await getDriveClient();
  if (!drive) throw new Error('Drive client not available');

  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, size, webViewLink, webContentLink, createdTime)',
    orderBy: 'createdTime desc',
  });

  return response.data.files || [];
}

/**
 * Copy a file
 * @param {string} fileId - Source file ID
 * @param {string} name - New file name
 * @param {string} folderId - Destination folder ID (optional)
 */
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

/**
 * Replace text in a Google Doc (for templates)
 * @param {string} docId - Google Doc ID
 * @param {Object} replacements - Key-value pairs to replace
 */
export async function replaceInDoc(docId, replacements) {
  const docs = await getDocsClient();
  if (!docs) throw new Error('Docs client not available');

  const requests = Object.entries(replacements).map(([key, value]) => ({
    replaceAllText: {
      containsText: { text: `{${key}}`, matchCase: true },
      replaceText: value || '',
    },
  }));

  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: { requests },
  });
}

/**
 * Generate engagement letter from template
 * @param {string} templateId - Template file ID
 * @param {Object} data - Replacement data
 * @param {string} folderId - Destination folder
 */
export async function generateEngagementLetter(templateId, data, folderId) {
  // Copy template
  const copy = await copyFile(templateId, `${data.client}_${data.year}_Engagement_Letter`, folderId);

  // Replace variables
  await replaceInDoc(copy.id, {
    client: data.client,
    year: data.year,
    address: data.address || '',
    date: data.date || new Date().toLocaleDateString(),
    email: data.email || '',
    engagement: data.engagement || '',
  });

  // Export as PDF
  const pdf = await exportToPdf(copy.id);

  return { docId: copy.id, pdf };
}

/**
 * Get or create entity folder structure
 * @param {string} entityType - Entity type (client, engagement, etc)
 * @param {string} entityId - Entity ID
 * @param {string} entityName - Entity name for folder
 */
export async function getEntityFolder(entityType, entityId, entityName) {
  const drive = await getDriveClient();
  if (!drive) throw new Error('Drive client not available');

  // Search for existing folder
  const query = `name = '${entityId}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const search = await drive.files.list({ q: query, fields: 'files(id, name)' });

  if (search.data.files?.length > 0) {
    return search.data.files[0];
  }

  // Create new folder
  return createFolder(`${entityName || entityId}`, ROOT_FOLDER_ID);
}

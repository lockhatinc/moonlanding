import { getDocsClient, getDriveClient } from './google-auth';
import { copyFile } from './drive-files';

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

export async function exportToPdf(fileId) {
  const drive = await getDriveClient();
  if (!drive) throw new Error('Drive client not available');

  const response = await drive.files.export(
    { fileId, mimeType: 'application/pdf' },
    { responseType: 'arraybuffer' }
  );

  return Buffer.from(response.data);
}

export async function generateEngagementLetter(templateId, data, folderId) {
  const copy = await copyFile(templateId, `${data.client}_${data.year}_Engagement_Letter`, folderId);

  await replaceInDoc(copy.id, {
    client: data.client,
    year: data.year,
    address: data.address || '',
    date: data.date || new Date().toLocaleDateString(),
    email: data.email || '',
    engagement: data.engagement || '',
  });

  const pdf = await exportToPdf(copy.id);

  return { docId: copy.id, pdf };
}

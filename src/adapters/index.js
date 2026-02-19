export { getCredentials, getAuthClient, getDriveClient, getGmailClient, getDocsClient } from '@/adapters/google-auth.js';
export { getDriveClient, uploadFile, downloadFile, deleteFile, getFile, listFiles, copyFile, replaceInDoc, exportToPdf, generateEngagementLetter, createFolder, getEntityFolder } from '@/adapters/google-drive.js';
export { getGmailClient, sendEmail, sendBulkEmails, templates, sendTemplatedEmail } from '@/adapters/google-gmail.js';

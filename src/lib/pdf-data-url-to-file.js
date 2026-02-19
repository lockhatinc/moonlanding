export function convertDataUrlToFile(dataUrl, filename = 'file.bin') {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

  const bstr = atob(arr[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);

  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }

  return new File([u8arr], filename, { type: mimeType });
}

export function dataUrlToBlob(dataUrl) {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

  const bstr = atob(arr[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);

  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }

  return new Blob([u8arr], { type: mimeType });
}

export async function uploadDataUrlAsFile(dataUrl, filename, endpoint = '/api/files') {
  const file = convertDataUrlToFile(dataUrl, filename);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('filename', filename);

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
}

export function isDataUrl(str) {
  return typeof str === 'string' && str.startsWith('data:');
}

export function getDataUrlMimeType(dataUrl) {
  const match = dataUrl.match(/:(.*?);/);
  return match ? match[1] : 'application/octet-stream';
}

export function getDataUrlFileExtension(dataUrl) {
  const mimeType = getDataUrlMimeType(dataUrl);
  const mimeToExt = {
    'application/pdf': 'pdf',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'application/json': 'json',
    'text/plain': 'txt',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
  };
  return mimeToExt[mimeType] || 'bin';
}

export function truncateDataUrl(dataUrl, maxLength = 100) {
  if (dataUrl.length <= maxLength) return dataUrl;
  const prefix = dataUrl.substring(0, maxLength);
  return prefix + '...';
}

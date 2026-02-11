export function dataUrlToFile(dataUrl, filename = 'file') {
  if (!dataUrl || typeof dataUrl !== 'string') return null;

  const [header, base64Data] = dataUrl.split(',');
  if (!base64Data) return null;

  const mimeMatch = header.match(/data:([^;]+)/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

  const byteString = atob(base64Data);
  const bytes = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    bytes[i] = byteString.charCodeAt(i);
  }

  return new File([bytes], filename, { type: mime });
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) { reject(new Error('No file provided')); return; }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function dataUrlToBlob(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;

  const [header, base64Data] = dataUrl.split(',');
  if (!base64Data) return null;

  const mimeMatch = header.match(/data:([^;]+)/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

  const byteString = atob(base64Data);
  const bytes = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    bytes[i] = byteString.charCodeAt(i);
  }

  return new Blob([bytes], { type: mime });
}

export function htmlToPlainText(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<li>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function buildMultipartEmail({ from, to, subject, html, plain }) {
  const boundary = `--boundary_${Date.now()}`;
  const plainText = plain || (htmlToPlainText(html) + '\n\n--\nAutomated message - do not reply');
  const htmlContent = `<!DOCTYPE html><html><head><style>body{font-family:system-ui;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}h2{color:#293241}a{color:#3b82f6}li{margin:5px 0}</style></head><body>${html}<hr style="margin-top:30px;border:none;border-top:1px solid #ddd"><p style="font-size:12px;color:#666">Automated message - do not reply</p></body></html>`;
  const raw = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: quoted-printable',
    '',
    plainText,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: quoted-printable',
    '',
    htmlContent,
    '',
    `--${boundary}--`,
  ].join('\n');
  return Buffer.from(raw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

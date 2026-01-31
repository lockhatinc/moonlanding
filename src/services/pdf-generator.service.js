import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class PDFGeneratorService {
  constructor() {
    this.browser = null;
  }

  async ensureBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  async generateFromHTML(htmlContent, options = {}) {
    const browser = await this.ensureBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: options.format || 'A4',
        margin: options.margin || { top: '0.4in', right: '0.4in', bottom: '0.4in', left: '0.4in' },
        printBackground: options.printBackground !== false,
        ...options
      });
      return pdf;
    } finally {
      await page.close();
    }
  }

  async generateFromURL(url, options = {}) {
    const browser = await this.ensureBrowser();
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: options.format || 'A4',
        margin: options.margin || { top: '0.4in', right: '0.4in', bottom: '0.4in', left: '0.4in' },
        printBackground: options.printBackground !== false,
        ...options
      });
      return pdf;
    } finally {
      await page.close();
    }
  }

  async generateChecklistPDF(checklist, items) {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
    h1 { color: #1c7ed6; border-bottom: 2px solid #1c7ed6; padding-bottom: 10px; }
    .checklist-item { margin: 12px 0; padding: 8px; border-left: 4px solid #e9ecef; }
    .done { background-color: #e7f5ff; }
    .pending { background-color: #fff3bf; }
    .checkbox { margin-right: 8px; }
    .meta { color: #666; font-size: 12px; margin-top: 4px; }
  </style>
</head>
<body>
  <h1>${checklist.name}</h1>
  <p>${checklist.description || 'Review Checklist'}</p>
  <div>
    ${items.map(item => `
      <div class="checklist-item ${item.is_done ? 'done' : 'pending'}">
        <input type="checkbox" ${item.is_done ? 'checked' : ''} disabled class="checkbox">
        <strong>${item.name}</strong>
        ${item.description ? `<p style="margin:4px 0">${item.description}</p>` : ''}
        ${item.assigned_to || item.due_date ? `<div class="meta">
          ${item.assigned_to ? `Assigned to: ${item.assigned_to.name}` : ''}
          ${item.due_date ? ` | Due: ${new Date(item.due_date).toLocaleDateString()}` : ''}
        </div>` : ''}
      </div>
    `).join('')}
  </div>
</body>
</html>`;

    return this.generateFromHTML(html);
  }

  async generateReviewPDF(review, highlights = []) {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
    h1 { color: #1c7ed6; }
    .metadata { background: #f8f9fa; padding: 12px; margin: 16px 0; border-radius: 4px; }
    .highlight { margin: 16px 0; padding: 12px; border-left: 4px solid #868e96; background: #f8f9fa; }
    .highlight.green { border-left-color: #51cf66; }
    .highlight.red { border-left-color: #fa5252; }
    .highlight.purple { border-left-color: #b197fc; }
    .highlight.grey { border-left-color: #495057; }
  </style>
</head>
<body>
  <h1>${review.name}</h1>
  <div class="metadata">
    <strong>Engagement:</strong> ${review.engagement?.name || 'N/A'}<br>
    <strong>Team:</strong> ${review.team?.name || 'N/A'}<br>
    <strong>Deadline:</strong> ${review.deadline ? new Date(review.deadline).toLocaleDateString() : 'N/A'}<br>
    <strong>Status:</strong> ${review.status || 'N/A'}
  </div>
  
  <h2>Highlights (${highlights.length})</h2>
  ${highlights.length === 0 ? '<p>No highlights</p>' : highlights.map((h, i) => `
    <div class="highlight ${h.color || 'grey'}">
      <strong>#${i + 1} - Page ${h.page_number || '?'}</strong>
      ${h.status === 'resolved' ? '<span style="color: #51cf66;">[RESOLVED]</span>' : '<span style="color: #fa5252;">[UNRESOLVED]</span>'}
      <p>${h.text || 'Area highlight'}</p>
      ${h.resolution_notes ? `<p><strong>Notes:</strong> ${h.resolution_notes}</p>` : ''}
    </div>
  `).join('')}
</body>
</html>`;

    return this.generateFromHTML(html);
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const pdfGeneratorService = new PDFGeneratorService();

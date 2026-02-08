import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class PDFGeneratorService {
  constructor() {
    this.browser = null;
    this.launching = null; // Prevent race conditions during browser launch
  }

  /**
   * Check if the browser is still connected and usable
   */
  isBrowserConnected() {
    return this.browser && this.browser.isConnected();
  }

  /**
   * Ensures a browser instance is available, handling:
   * - Race conditions during launch (multiple concurrent calls)
   * - Stale/disconnected browser instances ("Target closed" prevention)
   * - Automatic recovery from crashed browsers
   */
  async ensureBrowser() {
    // If browser exists but is disconnected, clean it up
    if (this.browser && !this.browser.isConnected()) {
      console.warn('[PDFGenerator] Browser disconnected, creating new instance');
      this.browser = null;
    }

    // Return existing connected browser
    if (this.browser) {
      return this.browser;
    }

    // Prevent race conditions: if launch is in progress, wait for it
    if (this.launching) {
      return this.launching;
    }

    // Launch new browser with proper error handling
    this.launching = (async () => {
      try {
        this.browser = await puppeteer.launch({
          headless: 'new',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // Prevents crashes in low-memory environments
            '--disable-gpu'
          ]
        });

        // Listen for disconnection to clean up reference
        this.browser.on('disconnected', () => {
          console.warn('[PDFGenerator] Browser disconnected unexpectedly');
          this.browser = null;
        });

        return this.browser;
      } finally {
        this.launching = null;
      }
    })();

    return this.launching;
  }

  /**
   * Safely close a page, handling already-closed scenarios
   */
  async safeClosePage(page) {
    try {
      if (page && !page.isClosed()) {
        await page.close();
      }
    } catch (err) {
      // Ignore errors when closing - page may already be closed
      console.warn('[PDFGenerator] Error closing page (may already be closed):', err.message);
    }
  }

  async generateFromHTML(htmlContent, options = {}) {
    const browser = await this.ensureBrowser();
    let page = null;

    try {
      page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0', timeout: 30000 });
      const pdf = await page.pdf({
        format: options.format || 'A4',
        margin: options.margin || { top: '0.4in', right: '0.4in', bottom: '0.4in', left: '0.4in' },
        printBackground: options.printBackground !== false,
        ...options
      });
      return pdf;
    } catch (err) {
      // If "Target closed" error, browser may have crashed - reset it
      if (err.message.includes('Target closed') || err.message.includes('Protocol error')) {
        console.error('[PDFGenerator] Browser crashed, will retry with fresh instance');
        this.browser = null;
      }
      throw err;
    } finally {
      await this.safeClosePage(page);
    }
  }

  async generateFromURL(url, options = {}) {
    const browser = await this.ensureBrowser();
    let page = null;

    try {
      page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      const pdf = await page.pdf({
        format: options.format || 'A4',
        margin: options.margin || { top: '0.4in', right: '0.4in', bottom: '0.4in', left: '0.4in' },
        printBackground: options.printBackground !== false,
        ...options
      });
      return pdf;
    } catch (err) {
      // If "Target closed" error, browser may have crashed - reset it
      if (err.message.includes('Target closed') || err.message.includes('Protocol error')) {
        console.error('[PDFGenerator] Browser crashed, will retry with fresh instance');
        this.browser = null;
      }
      throw err;
    } finally {
      await this.safeClosePage(page);
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
      try {
        await this.browser.close();
      } catch (err) {
        console.warn('[PDFGenerator] Error closing browser:', err.message);
      }
      this.browser = null;
    }
  }

  /**
   * Generate PDF with automatic retry on "Target closed" errors
   * @param {Function} generateFn - The generation function to call
   * @param {number} maxRetries - Maximum retry attempts (default: 2)
   */
  async withRetry(generateFn, maxRetries = 2) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await generateFn();
      } catch (err) {
        lastError = err;
        const isRecoverable = err.message.includes('Target closed') ||
                              err.message.includes('Protocol error') ||
                              err.message.includes('Session closed');
        
        if (isRecoverable && attempt < maxRetries) {
          console.warn(`[PDFGenerator] Attempt ${attempt} failed, retrying...`, err.message);
          this.browser = null; // Force fresh browser on retry
          await new Promise(r => setTimeout(r, 1000)); // Brief delay before retry
        } else {
          throw err;
        }
      }
    }
    throw lastError;
  }
}

export const pdfGeneratorService = new PDFGeneratorService();

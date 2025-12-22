import { formatDate } from '@/lib/date-utils';
import { LOG_PREFIXES } from '@/config';

export async function generateChecklistPdf(user) {
  try {
    const { list } = await import('../engine');
    const checklists = list('review_checklist', { created_by: user.id });

    if (!checklists.length) return null;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Weekly Checklist Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
          h1 { color: #293241; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          .checklist { margin: 20px 0; padding: 15px; border-left: 4px solid #3b82f6; background: #f9fafb; }
          .item { margin: 10px 0; padding: 8px; background: white; border-radius: 4px; }
          .status { display: inline-block; padding: 4px 8px; border-radius: 3px; font-size: 12px; font-weight: bold; }
          .pending { background: #fef3c7; color: #92400e; }
          .in_progress { background: #dbeafe; color: #1e40af; }
          .completed { background: #dcfce7; color: #166534; }
          .date { font-size: 12px; color: #666; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
        </style>
      </head>
      <body>
        <h1>Weekly Checklist Report</h1>
        <p>Generated for ${user.name} (${user.email})</p>
        ${checklists.map(c => `
          <div class="checklist">
            <h3>${c.name}</h3>
            <p>Progress: ${c.progress || 0}%</p>
            <div class="status ${c.status || 'pending'}">${(c.status || 'pending').replace('_', ' ').toUpperCase()}</div>
            ${c.items && c.items.length ? `<ul>${c.items.map(i => `<li class="item">${i.question || i.text}</li>`).join('')}</ul>` : '<p>No items</p>'}
          </div>
        `).join('')}
        <div class="date">Generated: ${formatDate(Date.now() / 1000, 'short')}</div>
      </body>
      </html>
    `;

    const Buffer = (await import('buffer')).Buffer;
    return Buffer.from(html, 'utf-8');
  } catch (e) {
    console.error(`${LOG_PREFIXES.email} Checklist PDF error for ${user.email}:`, e.message);
    throw e;
  }
}

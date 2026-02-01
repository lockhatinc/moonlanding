export function exportHighlightsAsJSON(highlights) {
  const data = {
    exported_at: new Date().toISOString(),
    total_highlights: highlights.length,
    highlights: highlights.map(h => ({
      id: h.id,
      page_number: h.page_number,
      text: h.text,
      color: h.color,
      category: h.category,
      status: h.status,
      position: h.position,
      resolution_notes: h.resolution_notes,
      created_at: h.created_at,
      resolved_at: h.resolved_at,
      resolved_by: h.resolved_by
    }))
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadFile(blob, `highlights-${Date.now()}.json`);
}

export function exportHighlightsAsCSV(highlights) {
  const headers = [
    'ID',
    'Page',
    'Text',
    'Color',
    'Category',
    'Status',
    'Resolution Notes',
    'Created At',
    'Resolved At'
  ];

  const rows = highlights.map(h => [
    h.id,
    h.page_number,
    h.text || '',
    h.color,
    h.category,
    h.status,
    h.resolution_notes || '',
    new Date(h.created_at * 1000).toISOString(),
    h.resolved_at ? new Date(h.resolved_at * 1000).toISOString() : ''
  ]);

  const csv = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  downloadFile(blob, `highlights-${Date.now()}.csv`);
}

function escapeCSV(value) {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

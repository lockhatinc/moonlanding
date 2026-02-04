import { getDatabase } from '@/lib/database-core';

const db = getDatabase();
const query = (sql, params) => db.prepare(sql).all(...params);

function suggestHighlights(reviewId) {
  const highlights = query('SELECT * FROM highlight WHERE review_id = ?', [reviewId]);
  const suggestions = [];
  const totalHighlights = highlights.length;
  if (totalHighlights === 0) return suggestions;

  const unresolvedCount = highlights.filter(h => h.status === 'unresolved').length;
  if (unresolvedCount > 5) {
    suggestions.push({ type: 'volume', severity: 'high', message: `${unresolvedCount} unresolved highlights. Consider prioritizing resolution.`, action: 'filter_unresolved' });
  }

  const colorDistribution = {};
  for (const h of highlights) colorDistribution[h.color] = (colorDistribution[h.color] || 0) + 1;
  const colors = Object.entries(colorDistribution).sort((a, b) => b[1] - a[1]);
  if (colors[0][1] / totalHighlights > 0.6) {
    suggestions.push({ type: 'consistency', severity: 'medium', message: `Most highlights are ${colors[0][0]}. Ensure classification is intentional.`, action: 'review_colors' });
  }

  const highPriorityCount = highlights.filter(h => h.is_high_priority).length;
  if (highPriorityCount > totalHighlights * 0.3) {
    suggestions.push({ type: 'priority', severity: 'medium', message: `${highPriorityCount} high-priority items marked. Verify prioritization.`, action: 'review_priorities' });
  }

  const pageGroups = {};
  for (const h of highlights) pageGroups[h.page_number] = (pageGroups[h.page_number] || 0) + 1;
  const maxPage = Math.max(...Object.values(pageGroups), 0);
  if (maxPage > 8) {
    suggestions.push({ type: 'concentration', severity: 'low', message: `Page ${Object.entries(pageGroups).find(([_, v]) => v === maxPage)?.[0]} has ${maxPage} highlights. Consider splitting concerns.`, action: 'review_page' });
  }

  const withoutNotes = highlights.filter(h => !h.resolution_notes || h.resolution_notes.length < 10).length;
  if (withoutNotes > totalHighlights * 0.4) {
    suggestions.push({ type: 'documentation', severity: 'medium', message: `${withoutNotes} highlights lack detailed notes. Add context for clarity.`, action: 'add_notes' });
  }

  return suggestions;
}

function detectPatterns(reviewId) {
  const highlights = query('SELECT * FROM highlight WHERE review_id = ?', [reviewId]);
  const patterns = { colors: {}, pages: {}, statuses: { resolved: 0, unresolved: 0 }, priorities: { high: 0, normal: 0 } };
  for (const h of highlights) {
    patterns.colors[h.color] = (patterns.colors[h.color] || 0) + 1;
    patterns.pages[h.page_number] = (patterns.pages[h.page_number] || 0) + 1;
    patterns.statuses[h.status] = (patterns.statuses[h.status] || 0) + 1;
    patterns.priorities[h.is_high_priority ? 'high' : 'normal']++;
  }
  const recommendations = [];
  const maxColor = Object.entries(patterns.colors).sort((a, b) => b[1] - a[1])[0];
  if (maxColor && maxColor[1] > highlights.length * 0.5) recommendations.push(`Consider consolidating ${maxColor[1]} ${maxColor[0]} highlights`);
  const maxPageEntry = Object.entries(patterns.pages).sort((a, b) => b[1] - a[1])[0];
  if (maxPageEntry && maxPageEntry[1] > 10) recommendations.push(`Page ${maxPageEntry[0]} has ${maxPageEntry[1]} highlights - review concentration`);
  if (patterns.statuses.unresolved > patterns.statuses.resolved) recommendations.push(`More unresolved (${patterns.statuses.unresolved}) than resolved (${patterns.statuses.resolved}) highlights`);
  return { patterns, recommendations };
}

export async function GET(request, context) {
  try {
    const params = await context.params;
    const suggestions = suggestHighlights(params.id);
    const { patterns, recommendations } = detectPatterns(params.id);
    return new Response(JSON.stringify({ suggestions, patterns, recommendations, total: suggestions.length }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[Highlight Suggestions] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function POST(request, context) {
  try {
    const params = await context.params;
    const body = await request.json();
    if (body.highlightId) {
      const highlight = query('SELECT * FROM highlight WHERE id = ?', [body.highlightId])[0];
      if (!highlight) return new Response(JSON.stringify({ related: [] }), { status: 200 });
      const allHighlights = query('SELECT * FROM highlight WHERE review_id = ? AND id != ?', [params.id, body.highlightId]);
      const related = allHighlights
        .filter(h => h.color === highlight.color || h.page_number === highlight.page_number || h.status === highlight.status)
        .sort((a, b) => {
          const scoreA = (a.color === highlight.color ? 2 : 0) + (a.page_number === highlight.page_number ? 1 : 0);
          const scoreB = (b.color === highlight.color ? 2 : 0) + (b.page_number === highlight.page_number ? 1 : 0);
          return scoreB - scoreA;
        })
        .slice(0, 5);
      return new Response(JSON.stringify({ related }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    const suggestions = suggestHighlights(params.id);
    return new Response(JSON.stringify({ suggestions }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[Highlight Suggestions] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

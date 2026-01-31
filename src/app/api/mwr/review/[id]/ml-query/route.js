import { getDatabaseService } from '@/lib/database-service';

export async function POST(request, context) {
  try {
    const params = await context.params;
    const reviewId = params.id;
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return new Response(JSON.stringify({ error: 'Query required' }), { status: 400 });
    }

    const db = getDatabaseService();
    const highlights = db.querySync('SELECT * FROM highlight WHERE review_id = ? ORDER BY page_number', [reviewId]);

    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(/\s+/).filter(w => w.length > 2);

    let matchedHighlights = highlights.filter(h => {
      const text = (h.text || '').toLowerCase();
      const notes = (h.resolution_notes || '').toLowerCase();
      return keywords.some(k => text.includes(k) || notes.includes(k));
    });

    const suggestions = [];
    const colorCounts = {};
    const statusCounts = { resolved: 0, unresolved: 0 };

    for (const h of highlights) {
      colorCounts[h.color] = (colorCounts[h.color] || 0) + 1;
      statusCounts[h.status] = statusCounts[h.status] + 1;
    }

    if (queryLower.includes('unresolved') || queryLower.includes('pending')) {
      const unresolved = highlights.filter(h => h.status === 'unresolved');
      matchedHighlights = unresolved;
      suggestions.push(`Found ${unresolved.length} unresolved highlights across ${new Set(unresolved.map(h => h.page_number)).size} pages`);
    }

    if (queryLower.includes('high') || queryLower.includes('priority') || queryLower.includes('critical')) {
      const highPriority = highlights.filter(h => h.is_high_priority);
      matchedHighlights = matchedHighlights.length > 0 ? matchedHighlights.filter(h => h.is_high_priority) : highPriority;
      if (highPriority.length > 0) {
        suggestions.push(`${highPriority.length} high-priority items need attention`);
      }
    }

    if (queryLower.includes('pattern') || queryLower.includes('frequent')) {
      const textPatterns = new Map();
      for (const h of highlights) {
        if (h.text) {
          const words = h.text.split(/\s+/).slice(0, 3).join(' ');
          textPatterns.set(words, (textPatterns.get(words) || 0) + 1);
        }
      }
      const patterns = Array.from(textPatterns.entries()).filter(([_, count]) => count > 1).sort((a, b) => b[1] - a[1]);
      if (patterns.length > 0) {
        suggestions.push(`Recurring pattern detected: "${patterns[0][0]}" appears ${patterns[0][1]} times`);
      }
    }

    if (queryLower.includes('page')) {
      const pageMatch = query.match(/page\s+(\d+)/i);
      if (pageMatch) {
        const pageNum = parseInt(pageMatch[1]);
        matchedHighlights = highlights.filter(h => h.page_number === pageNum);
      }
    }

    if (queryLower.includes('summary') || queryLower.includes('overview')) {
      matchedHighlights = highlights;
    }

    if (suggestions.length === 0) {
      suggestions.push(`Found ${matchedHighlights.length} matching highlights`);
      if (matchedHighlights.length === 0 && highlights.length > 0) {
        suggestions.push(`Try searching for: ${keywords.slice(0, 3).join(', ') || 'specific terms'}`);
      }
    }

    const confidence = Math.min(0.95, 0.5 + (matchedHighlights.length / Math.max(1, highlights.length)) * 0.4);
    const summary = `Analysis complete: ${matchedHighlights.length}/${highlights.length} highlights matched`;

    return new Response(JSON.stringify({
      highlights: matchedHighlights.slice(0, 10),
      suggestions,
      summary,
      confidence,
      total: highlights.length,
      matched: matchedHighlights.length,
      stats: { colorCounts, statusCounts }
    }), { status: 200 });
  } catch (err) {
    console.error('[ML Query] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

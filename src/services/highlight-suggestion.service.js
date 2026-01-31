import { getDatabaseService } from '@/lib/database-service';

class HighlightSuggestionService {
  constructor() {
    this.db = getDatabaseService();
  }

  async suggestHighlights(reviewId) {
    const highlights = this.db.querySync('SELECT * FROM highlight WHERE review_id = ?', [reviewId]);
    
    const suggestions = [];

    const unresolvedCount = highlights.filter(h => h.status === 'unresolved').length;
    if (unresolvedCount > 5) {
      suggestions.push({
        type: 'volume',
        severity: 'high',
        message: `${unresolvedCount} unresolved highlights. Consider prioritizing resolution.`,
        action: 'filter_unresolved'
      });
    }

    const colorDistribution = {};
    for (const h of highlights) {
      colorDistribution[h.color] = (colorDistribution[h.color] || 0) + 1;
    }

    const totalHighlights = highlights.length;
    if (totalHighlights > 0) {
      const colors = Object.entries(colorDistribution).sort((a, b) => b[1] - a[1]);
      if (colors[0][1] / totalHighlights > 0.6) {
        suggestions.push({
          type: 'consistency',
          severity: 'medium',
          message: `Most highlights are ${colors[0][0]}. Ensure classification is intentional.`,
          action: 'review_colors'
        });
      }
    }

    const highPriorityCount = highlights.filter(h => h.is_high_priority).length;
    if (highPriorityCount > totalHighlights * 0.3) {
      suggestions.push({
        type: 'priority',
        severity: 'medium',
        message: `${highPriorityCount} high-priority items marked. Verify prioritization.`,
        action: 'review_priorities'
      });
    }

    const pageGroups = {};
    for (const h of highlights) {
      pageGroups[h.page_number] = (pageGroups[h.page_number] || 0) + 1;
    }

    const maxPage = Math.max(...Object.values(pageGroups), 0);
    if (maxPage > 8) {
      suggestions.push({
        type: 'concentration',
        severity: 'low',
        message: `Page ${Object.entries(pageGroups).find(([_, v]) => v === maxPage)?.[0]} has ${maxPage} highlights. Consider splitting concerns.`,
        action: 'review_page'
      });
    }

    const withoutNotes = highlights.filter(h => !h.resolution_notes || h.resolution_notes.length < 10).length;
    if (withoutNotes > totalHighlights * 0.4) {
      suggestions.push({
        type: 'documentation',
        severity: 'medium',
        message: `${withoutNotes} highlights lack detailed notes. Add context for clarity.`,
        action: 'add_notes'
      });
    }

    return suggestions;
  }

  async getRelatedHighlights(highlightId, reviewId, limit = 5) {
    const highlight = this.db.querySync('SELECT * FROM highlight WHERE id = ?', [highlightId])[0];
    if (!highlight) return [];

    const allHighlights = this.db.querySync('SELECT * FROM highlight WHERE review_id = ? AND id != ?', [reviewId, highlightId]);

    const related = allHighlights
      .filter(h => {
        if (h.color === highlight.color) return true;
        if (h.page_number === highlight.page_number) return true;
        if (h.status === highlight.status) return true;
        return false;
      })
      .sort((a, b) => {
        const scoreA = (a.color === highlight.color ? 2 : 0) + (a.page_number === highlight.page_number ? 1 : 0);
        const scoreB = (b.color === highlight.color ? 2 : 0) + (b.page_number === highlight.page_number ? 1 : 0);
        return scoreB - scoreA;
      })
      .slice(0, limit);

    return related;
  }

  async detectPatterns(reviewId) {
    const highlights = this.db.querySync('SELECT * FROM highlight WHERE review_id = ?', [reviewId]);

    const patterns = {
      colors: {},
      pages: {},
      statuses: { resolved: 0, unresolved: 0 },
      priorities: { high: 0, normal: 0 }
    };

    for (const h of highlights) {
      patterns.colors[h.color] = (patterns.colors[h.color] || 0) + 1;
      patterns.pages[h.page_number] = (patterns.pages[h.page_number] || 0) + 1;
      patterns.statuses[h.status] = patterns.statuses[h.status] + 1;
      patterns.priorities[h.is_high_priority ? 'high' : 'normal'] = patterns.priorities[h.is_high_priority ? 'high' : 'normal'] + 1;
    }

    const recommendations = [];

    const maxColor = Object.entries(patterns.colors).sort((a, b) => b[1] - a[1])[0];
    if (maxColor && maxColor[1] > highlights.length * 0.5) {
      recommendations.push(`Consider consolidating ${maxColor[1]} ${maxColor[0]} highlights`);
    }

    const maxPage = Object.entries(patterns.pages).sort((a, b) => b[1] - a[1])[0];
    if (maxPage && maxPage[1] > 10) {
      recommendations.push(`Page ${maxPage[0]} has ${maxPage[1]} highlights - review concentration`);
    }

    if (patterns.statuses.unresolved > patterns.statuses.resolved) {
      recommendations.push(`More unresolved (${patterns.statuses.unresolved}) than resolved (${patterns.statuses.resolved}) highlights`);
    }

    return { patterns, recommendations };
  }
}

export const highlightSuggestionService = new HighlightSuggestionService();

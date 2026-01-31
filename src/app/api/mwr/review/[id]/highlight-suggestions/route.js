import { highlightSuggestionService } from '@/services/highlight-suggestion.service';

export async function GET(request, context) {
  try {
    const params = await context.params;
    const reviewId = params.id;

    const suggestions = await highlightSuggestionService.suggestHighlights(reviewId);
    const { patterns, recommendations } = await highlightSuggestionService.detectPatterns(reviewId);

    return new Response(JSON.stringify({
      suggestions,
      patterns,
      recommendations,
      total: suggestions.length
    }), { status: 200 });
  } catch (err) {
    console.error('[Highlight Suggestions] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function POST(request, context) {
  try {
    const params = await context.params;
    const reviewId = params.id;
    const body = await request.json();
    const { highlightId } = body;

    if (highlightId) {
      const related = await highlightSuggestionService.getRelatedHighlights(highlightId, reviewId, 5);
      return new Response(JSON.stringify({ related }), { status: 200 });
    }

    const suggestions = await highlightSuggestionService.suggestHighlights(reviewId);
    return new Response(JSON.stringify({ suggestions }), { status: 200 });
  } catch (err) {
    console.error('[Highlight Suggestions] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

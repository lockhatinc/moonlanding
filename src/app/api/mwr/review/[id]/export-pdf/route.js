import { pdfGeneratorService } from '@/services/pdf-generator.service';
import { getDatabase } from '@/lib/database-core';

const db = getDatabase();
const query = (sql, params) => db.prepare(sql).all(...params);

export async function POST(request, context) {
  try {
    const params = await context.params;
    const reviewId = params.id;
    const body = await request.json();
    const { exportType } = body;

    const review = query('SELECT * FROM review WHERE id = ?', [reviewId])[0];

    if (!review) {
      return new Response(JSON.stringify({ error: 'Review not found' }), { status: 404 });
    }

    let pdfBuffer;

    if (exportType === 'checklist') {
      const checklistId = body.checklistId;
      const checklist = query('SELECT * FROM checklist WHERE id = ? AND review_id = ?', [checklistId, reviewId])[0];
      const items = query('SELECT * FROM checklist_item WHERE checklist_id = ? ORDER BY "order"', [checklistId]);

      if (!checklist) {
        return new Response(JSON.stringify({ error: 'Checklist not found' }), { status: 404 });
      }

      pdfBuffer = await pdfGeneratorService.generateChecklistPDF(checklist, items);
    } else {
      const highlights = query('SELECT * FROM highlight WHERE review_id = ? ORDER BY page_number', [reviewId]);
      const engagement = review.engagement_id ? query('SELECT * FROM engagement WHERE id = ?', [review.engagement_id])[0] : null;
      const team = review.team_id ? query('SELECT * FROM team WHERE id = ?', [review.team_id])[0] : null;

      const enrichedReview = { ...review, engagement, team };
      pdfBuffer = await pdfGeneratorService.generateReviewPDF(enrichedReview, highlights);
    }

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="export-${reviewId}.pdf"`,
        'Content-Length': pdfBuffer.length
      }
    });
  } catch (err) {
    console.error('[PDF Export] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

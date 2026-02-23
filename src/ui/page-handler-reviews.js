import { list, get } from '@/lib/query-engine.js';
import { getSpec } from '@/config/spec-helpers.js';
import { getDatabase } from '@/lib/database-core.js';
import { renderEntityList, renderAccessDenied } from '@/ui/renderer.js';
import { renderSectionReport, renderReviewListTabbed } from '@/ui/review-renderer.js';
import { renderChecklistDetails, renderChecklistsHome } from '@/ui/checklist-renderer.js';
import { renderPdfViewer, renderPdfEditorPlaceholder } from '@/ui/pdf-viewer-renderer.js';
import { renderReviewAnalytics } from '@/ui/review-analytics-renderer.js';
import { renderHighlightThreading } from '@/ui/highlight-threading-renderer.js';
import { renderSectionResolution } from '@/ui/section-resolution-renderer.js';
import { renderReviewComparison, renderComparisonPicker } from '@/ui/review-comparison-renderer.js';
import { renderTenderDashboard } from '@/ui/tender-dashboard-renderer.js';
import { renderBatchOperations } from '@/ui/batch-review-renderer.js';
import { canList, canView, canEdit } from '@/ui/permissions-ui.js';
import { resolveRefFields } from '@/ui/page-handler-helpers.js';
import { fileURLToPath } from 'url';
const __dirname_rv = fileURLToPath(new URL('.', import.meta.url));

async function lazyRenderer(name) {
  const t = globalThis.__reloadTs__ || Date.now();
  return import(`file://${__dirname_rv}${name}?t=${t}`);
}

export function handleFilteredReviewList(user, filter) {
  if (!canList(user, 'review')) return renderAccessDenied(user, 'review', 'list');
  const spec = getSpec('review'); if (!spec) return null;
  let items = list('review', {});
  if (filter === 'active') items = items.filter(r => r.status === 'active' || r.status === 'open');
  else if (filter === 'priority') { const pids = user.priority_reviews || []; items = items.filter(r => pids.includes(r.id)); }
  else if (filter === 'history') items = items.filter(r => r.status === 'closed' || r.status === 'completed');
  else if (filter === 'archive') items = items.filter(r => r.status === 'archived');
  return renderEntityList('review', resolveRefFields(items, spec), spec, user);
}

export async function handleReviewRoutes(normalized, segments, user, req) {
  if (normalized === '/reviews/active') return handleFilteredReviewList(user, 'active');
  if (normalized === '/reviews/priority') return handleFilteredReviewList(user, 'priority');
  if (normalized === '/reviews/history') return handleFilteredReviewList(user, 'history');
  if (normalized === '/reviews/archive') return handleFilteredReviewList(user, 'archive');

  if (normalized === '/reviews' || normalized === '/review') {
    if (!canList(user, 'review')) return renderAccessDenied(user, 'review', 'list');
    let reviews = []; try { reviews = getDatabase().prepare('SELECT * FROM review ORDER BY updated_at DESC').all(); } catch { try { reviews = list('review', {}); } catch {} }
    const engMap = {}; try { list('engagement', {}).forEach(e => { engMap[e.id] = e.name; }); } catch {}
    return renderReviewListTabbed(user, reviews.map(r => ({ ...r, engagement_name: engMap[r.engagement_id] || r.engagement_name || null })));
  }

  if (segments[0] === 'review' && segments.length === 3 && segments[2] === 'sections') {
    const reviewId = segments[1];
    if (!canView(user, 'review')) return renderAccessDenied(user, 'review', 'view');
    const review = get('review', reviewId); if (!review) return null;
    let sections = []; try { sections = list('review_section', {}).filter(s => s.review_id === reviewId); } catch {}
    return renderSectionReport(user, review, sections);
  }

  if (normalized === '/reviews/analytics') {
    if (!canList(user, 'review')) return renderAccessDenied(user, 'review', 'list');
    let reviews = [], highlights = [], activity = [];
    try { reviews = list('review', {}); } catch {} try { highlights = list('highlight', {}); } catch {} try { activity = list('activity_log', {}).slice(0, 50); } catch {}
    return renderReviewAnalytics(user, { reviews, highlights, recentActivity: activity });
  }

  if (normalized === '/reviews/compare') {
    if (!canList(user, 'review')) return renderAccessDenied(user, 'review', 'list');
    const url = new URL(req.url, `http://${req.headers.host||'localhost'}`);
    const leftId = url.searchParams.get('left'), rightId = url.searchParams.get('right');
    if (leftId && rightId) {
      const leftReview = get('review', leftId), rightReview = get('review', rightId);
      if (!leftReview || !rightReview) return null;
      let leftH = [], rightH = [];
      try { leftH = list('highlight', {}).filter(h => h.review_id === leftId); } catch {} try { rightH = list('highlight', {}).filter(h => h.review_id === rightId); } catch {}
      return renderReviewComparison(user, leftReview, rightReview, leftH, rightH);
    }
    let reviews = []; try { reviews = list('review', {}); } catch {}
    return renderComparisonPicker(user, reviews);
  }

  if (normalized === '/reviews/tenders') {
    if (!canList(user, 'review')) return renderAccessDenied(user, 'review', 'list');
    let tenders = [], reviews = [];
    try { tenders = list('tender', {}); } catch {} try { reviews = list('review', {}); } catch {}
    return renderTenderDashboard(user, tenders.map(t => { const r = reviews.find(rev => rev.id === t.review_id); return { ...t, review_name: r?.name || r?.title || '' }; }), reviews);
  }

  if (normalized === '/reviews/batch') {
    if (!canEdit(user, 'review')) return renderAccessDenied(user, 'review', 'edit');
    let reviews = []; try { reviews = list('review', {}); } catch {}
    const spec = getSpec('review'); if (spec) reviews = resolveRefFields(reviews, spec);
    return renderBatchOperations(user, reviews);
  }

  if (segments[0] === 'review' && segments.length === 3) {
    const reviewId = segments[1], action = segments[2];
    if (action === 'pdf') { if (!canView(user, 'review')) return renderAccessDenied(user, 'review', 'view'); const review = get('review', reviewId); if (!review) return null; let h = [], s = []; try { h = list('highlight', {}).filter(x => x.review_id === reviewId); } catch {} try { s = list('review_section', {}).filter(x => x.review_id === reviewId); } catch {} return renderPdfViewer(user, review, h, s); }
    if (action === 'editor') { if (!canEdit(user, 'review')) return renderAccessDenied(user, 'review', 'edit'); const review = get('review', reviewId); if (!review) return null; return renderPdfEditorPlaceholder(user, review); }
    if (action === 'highlights') { if (!canView(user, 'review')) return renderAccessDenied(user, 'review', 'view'); const review = get('review', reviewId); if (!review) return null; let h = []; try { h = list('highlight', {}).filter(x => x.review_id === reviewId); } catch {} const rm = {}; for (const x of h) { try { rm[x.id] = list('highlight_response', {}).filter(r => r.highlight_id === x.id); } catch { rm[x.id] = []; } } return renderHighlightThreading(user, review, h, rm); }
    if (action === 'resolution') { if (!canView(user, 'review')) return renderAccessDenied(user, 'review', 'view'); const review = get('review', reviewId); if (!review) return null; let s = []; try { s = list('review_section', {}).filter(x => x.review_id === reviewId); } catch {} const hbs = {}; for (const sec of s) { try { hbs[sec.id] = list('highlight', {}).filter(h => h.review_id === reviewId && h.section_id === sec.id); } catch { hbs[sec.id] = []; } } return renderSectionResolution(user, review, s, hbs); }
  }

  if (segments.length === 2 && segments[0] === 'review' && segments[1] !== 'new') {
    const reviewId = segments[1];
    if (!canView(user, 'review')) return renderAccessDenied(user, 'review', 'view');
    const db = getDatabase();
    const review = get('review', reviewId) || db.prepare('SELECT * FROM review WHERE id=?').get(reviewId); if (!review) return null;
    let highlights = [], collaborators = [], checklists = [], sections = [];
    try { highlights = list('highlight', {}).filter(h => h.review_id === reviewId); } catch {}
    try { collaborators = list('collaborator', {}).filter(c => c.review_id === reviewId); } catch {}
    try { checklists = list('checklist', {}).filter(c => c.review_id === reviewId).map(c => { let items = []; try { items = list('checklist_item', {}).filter(i => i.checklist_id === c.id); } catch {} return { ...c, total_items: items.length, completed_items: items.filter(i => i.completed).length }; }); } catch {}
    try { sections = list('review_section', {}).filter(s => s.review_id === reviewId); } catch {}
    const { renderReviewDetail } = await lazyRenderer('review-detail-renderer.js');
    return renderReviewDetail(user, review, highlights, collaborators, checklists, sections);
  }

  if (segments[0] === 'checklist' && segments.length === 2 && segments[1] !== 'new') {
    const checklistId = segments[1];
    if (!canView(user, 'checklist')) return renderAccessDenied(user, 'checklist', 'view');
    const checklist = get('checklist', checklistId); if (!checklist) return null;
    let items = []; try { items = getDatabase().prepare('SELECT * FROM checklist_item WHERE checklist_id=? ORDER BY "order" ASC, created_at ASC').all(checklistId); } catch {}
    return renderChecklistDetails(user, checklist, items);
  }

  if (normalized === '/checklists' || normalized === '/checklist') {
    if (!canList(user, 'checklist')) return renderAccessDenied(user, 'checklist', 'list');
    let checklists = [];
    try { const db = getDatabase(); const stats = db.prepare('SELECT checklist_id, COUNT(*) as total, SUM(CASE WHEN is_done=1 THEN 1 ELSE 0 END) as done FROM checklist_item GROUP BY checklist_id').all(); const statsMap = Object.fromEntries(stats.map(s => [s.checklist_id, s])); checklists = list('checklist', {}).map(c => ({ ...c, total_items: statsMap[c.id]?.total || 0, completed_items: statsMap[c.id]?.done || 0 })); } catch {}
    return renderChecklistsHome(user, checklists);
  }

  return null;
}

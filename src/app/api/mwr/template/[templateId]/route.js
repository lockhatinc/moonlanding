import { NextResponse } from '@/lib/next-polyfills';
import { get, update, remove } from '@/engine';
import { withPageAuth } from '@/lib/auth-middleware';
import { logAction } from '@/lib/audit-logger';

export async function GET(request, { params }) {
  try {
    const { user } = await withPageAuth('review', 'view');
    const { templateId } = params;

    const template = get('review_template', templateId);
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    const parsed = { ...template };
    if (typeof parsed.sections === 'string') parsed.sections = JSON.parse(parsed.sections || '[]');
    if (typeof parsed.default_flags === 'string') parsed.default_flags = JSON.parse(parsed.default_flags || '[]');
    if (typeof parsed.default_tags === 'string') parsed.default_tags = JSON.parse(parsed.default_tags || '[]');

    return NextResponse.json({ success: true, template: parsed });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error?.message || error) },
      { status: error?.statusCode || 400 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { user } = await withPageAuth('review', 'edit');
    const { templateId } = params;
    const body = await request.json();

    const template = get('review_template', templateId);
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const updates = { updated_at: timestamp, updated_by: user.id };

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.description !== undefined) updates.description = body.description;
    if (body.sections !== undefined) updates.sections = JSON.stringify(body.sections);
    if (body.default_flags !== undefined) updates.default_flags = JSON.stringify(body.default_flags);
    if (body.default_tags !== undefined) updates.default_tags = JSON.stringify(body.default_tags);
    if (body.is_tender !== undefined) updates.is_tender = body.is_tender ? 1 : 0;
    if (body.is_active !== undefined) updates.is_active = body.is_active ? 1 : 0;

    update('review_template', templateId, updates, user);

    logAction('review_template', templateId, 'template_updated', user.id, template, updates);

    return NextResponse.json({ success: true, message: 'Template updated' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error?.message || error) },
      { status: error?.statusCode || 400 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user } = await withPageAuth('review', 'delete');
    const { templateId } = params;

    const template = get('review_template', templateId);
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    remove('review_template', templateId, user);

    logAction('review_template', templateId, 'template_deleted', user.id, template, null);

    return NextResponse.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error?.message || error) },
      { status: error?.statusCode || 400 }
    );
  }
}

export const config = { runtime: 'nodejs' };

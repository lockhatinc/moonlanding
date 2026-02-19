import { NextResponse } from '@/lib/next-polyfills';
import { list, create, get } from '@/engine';
import { withPageAuth } from '@/lib/auth-middleware';
import { logAction } from '@/lib/audit-logger';

export async function GET(request) {
  try {
    const { user } = await withPageAuth('review', 'list');
    const url = new URL(request.url);
    const active = url.searchParams.get('active');

    let templates = list('review_template', {});

    if (active === 'true') {
      templates = templates.filter(t => t.is_active !== false && t.is_active !== 0);
    }

    return NextResponse.json({
      success: true,
      templates,
      total: templates.length
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error?.message || error) },
      { status: error?.statusCode || 400 }
    );
  }
}

export async function POST(request) {
  try {
    const { user } = await withPageAuth('review', 'create');
    const body = await request.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Template name required' },
        { status: 400 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const templateData = {
      name: body.name.trim(),
      description: body.description || '',
      sections: JSON.stringify(body.sections || []),
      default_flags: JSON.stringify(body.default_flags || []),
      default_tags: JSON.stringify(body.default_tags || []),
      is_tender: body.is_tender ? 1 : 0,
      is_active: 1,
      created_by: user.id,
      created_at: timestamp,
      updated_at: timestamp
    };

    const templateId = create('review_template', templateData, user);

    logAction('review_template', templateId, 'template_created', user.id, null, templateData);

    return NextResponse.json({
      success: true,
      templateId,
      message: 'Template created'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error?.message || error) },
      { status: error?.statusCode || 400 }
    );
  }
}

export const config = { runtime: 'nodejs' };

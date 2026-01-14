import { NextResponse } from '@/lib/next-polyfills';
import { get, create } from '@/engine';
import { withPageAuth } from '@/lib/auth-middleware';
import { validateResponseSubmission } from '@/lib/rfi-response-lifecycle';

export async function POST(request, { params }) {
  try {
    const { user } = await withPageAuth('rfi', 'edit');
    const { id } = params;

    const rfi = get('rfi', id);
    if (!rfi) {
      return NextResponse.json(
        { success: false, error: 'RFI not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const responseText = formData.get('response_text') || '';
    const files = formData.getAll('files') || [];

    const responseData = {
      response_text: responseText,
      file_attachments: files.map(f => ({ name: f.name, size: f.size }))
    };

    try {
      validateResponseSubmission(responseData);
    } catch (validationError) {
      return NextResponse.json(
        { success: false, error: validationError.message },
        { status: 422 }
      );
    }

    const response = {
      rfi_id: id,
      submitted_by: user.id,
      response_text: responseText,
      file_attachments: responseData.file_attachments,
      status: 'submitted',
      submitted_at: Math.floor(new Date().getTime() / 1000),
      metadata: { user_id: user.id }
    };

    const responseId = create('rfi_response', response, user);

    return NextResponse.json({
      success: true,
      responseId,
      message: 'Response submitted successfully'
    });
  } catch (error) {
    console.error('[rfi-response-post] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export const config = {
  runtime: 'nodejs'
};

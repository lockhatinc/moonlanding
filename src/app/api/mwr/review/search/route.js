import { NextResponse } from '@/lib/next-polyfills';
import { search, searchWithPagination } from '@/engine';
import { withPageAuth } from '@/lib/auth-middleware';
import { getDomainLoader } from '@/lib/domain-loader';

export async function GET(request) {
  try {
    const { user } = await withPageAuth('review', 'list');
    const url = new URL(request.url);

    const q = url.searchParams.get('q') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    const status = url.searchParams.get('status');
    const flag = url.searchParams.get('flag');
    const tag = url.searchParams.get('tag');

    if (!q && !status && !flag && !tag) {
      return NextResponse.json(
        { success: false, error: 'At least one search parameter required (q, status, flag, tag)' },
        { status: 400 }
      );
    }

    const domainLoader = getDomainLoader();
    const searchFields = ['name', 'description', 'tags', 'flags'];

    let results;
    if (q) {
      const { items, pagination } = searchWithPagination('review', q, searchFields, page, pageSize);
      results = { items, pagination };
    } else {
      const filters = {};
      if (status) filters.status = status;
      const { items, pagination } = searchWithPagination('review', '', searchFields, page, pageSize);
      results = { items, pagination };
    }

    let filtered = domainLoader.filterDataByDomain(results.items, 'mwr', 'review');

    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }
    if (flag) {
      filtered = filtered.filter(r => {
        const flags = typeof r.flags === 'string' ? JSON.parse(r.flags || '[]') : (r.flags || []);
        return flags.includes(flag);
      });
    }
    if (tag) {
      filtered = filtered.filter(r => {
        const tags = typeof r.tags === 'string' ? JSON.parse(r.tags || '[]') : (r.tags || []);
        return tags.includes(tag);
      });
    }

    return NextResponse.json({
      success: true,
      reviews: filtered,
      pagination: results.pagination,
      query: { q, status, flag, tag }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error?.message || error) },
      { status: error?.statusCode || 400 }
    );
  }
}

export const config = { runtime: 'nodejs' };

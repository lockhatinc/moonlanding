import { SQL_OPERATORS, SQL_KEYWORDS, QUERY_BUILDING } from '@/config/query-config';
import { RECORD_STATUS } from '@/config/constants';

export function buildWhereClause(where, table, spec) {
  const wc = [];
  const p = [];
  Object.entries(where).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      wc.push(`${table}.${k}${SQL_OPERATORS.eq}${QUERY_BUILDING.parameterPlaceholder}`);
      p.push(v);
    }
  });
  if (spec.fields.status && !where.status) {
    wc.push(`${table}.status${SQL_OPERATORS.ne}'${RECORD_STATUS.DELETED}'`);
  }
  return { clause: wc.length ? ` ${SQL_KEYWORDS.where} ` + wc.join(` ${SQL_KEYWORDS.and} `) : '', params: p };
}

export function buildWhereClauseForSearch(where, table, spec, searchClauses) {
  const wc = [];
  const p = [];
  Object.entries(where).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      wc.push(`${table}.${k}${SQL_OPERATORS.eq}${QUERY_BUILDING.parameterPlaceholder}`);
      p.push(v);
    }
  });
  if (spec.fields.status && !where.status) {
    wc.push(`${table}.status${SQL_OPERATORS.ne}'${RECORD_STATUS.DELETED}'`);
  }
  const whereClause = wc.length ? ` ${SQL_KEYWORDS.and} (${wc.join(` ${SQL_KEYWORDS.and} `)})` : '';
  return { clause: whereClause, params: p };
}

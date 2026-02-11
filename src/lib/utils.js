import { list } from '@/engine';
import { getSpec } from '@/config/spec-helpers';

export { secondsToDate, dateToSeconds, formatDate, parseDate, formatDateTime, formatCurrency, formatNumber, formatFileSize, formatDuration, timeAgo, truncateText } from './date-utils';

export async function loadFormOptions(spec) {
  const options = {};
  for (const [key, field] of Object.entries(spec.fields)) {
    if (field.type === 'ref' && field.ref) {
      try {
        const data = list(field.ref);
        if (field.ref === 'engagement') {
          options[key] = data
            .filter(r => r.status !== 'archived')
            .map(r => ({
              value: r.id,
              label: `${r.client_name || 'No Client'} - ${r.name} (${r.financial_year || r.year || 'N/A'})`
            }));
        } else {
          options[key] = data.map(r => ({
            value: r.id,
            label: r.name || r.email || r.id
          }));
        }
      } catch {
        options[key] = [];
      }
    }
  }
  return options;
}

export class SpecError extends Error {
  constructor(entity) {
    super(`Unknown entity: ${entity}`);
    this.code = 'UNKNOWN_ENTITY';
  }
}

export async function resolveSpec(entity) {
  try {
    return getSpec(entity);
  } catch (e) {
    throw new SpecError(entity);
  }
}

export function getDisplayName(user) {
  if (!user) return 'Unknown';
  if (user.name) return user.name;
  if (user.first_name || user.last_name) return `${user.first_name || ''} ${user.last_name || ''}`.trim();
  if (user.email) return user.email.split('@')[0];
  return 'Unknown';
}

export function getInitials(user) {
  if (!user) return '?';
  const name = getDisplayName(user);
  if (name === 'Unknown' || name === '?') return '?';
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0]?.[0]?.toUpperCase() || '?';
}

export function getUserRole(user) {
  if (!user) return null;
  return user.role || user.type || null;
}

export function isUserActive(user) {
  if (!user) return false;
  if (user.is_active === false || user.is_active === 0) return false;
  if (user.status === 'inactive' || user.status === 'disabled' || user.status === 'suspended') return false;
  if (user.deleted_at) return false;
  return true;
}

'use client';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function FieldRender({ spec, field, value, row }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  switch (field.type) {
    case 'enum':
      const opt = spec.options?.[field.options]?.find(o => String(o.value) === String(value));
      if (!opt) return String(value);
      const colors = {
        green: 'bg-green-100 text-green-800 border-green-200',
        yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        amber: 'bg-amber-100 text-amber-800 border-amber-200',
        blue: 'bg-blue-100 text-blue-800 border-blue-200',
        gray: 'bg-gray-100 text-gray-800 border-gray-200',
        red: 'bg-red-100 text-red-800 border-red-200',
      };
      return (
        <Badge className={colors[opt.color] || colors.gray}>
          {opt.label}
        </Badge>
      );

    case 'ref':
      if (field.display === 'avatars' && Array.isArray(value)) {
        return <AvatarGroup users={value} />;
      }
      return row[`${field.key}_display`] || value;

    case 'date':
    case 'timestamp':
      if (!value) return '—';
      const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
      return date.toLocaleDateString();

    case 'bool':
      return value ? 'Yes' : 'No';

    case 'image':
      return (
        <Avatar className="h-8 w-8">
          <AvatarImage src={value} />
          <AvatarFallback>{row?.name?.[0] || '?'}</AvatarFallback>
        </Avatar>
      );

    case 'json':
      if (typeof value === 'string') {
        try {
          return <code className="text-xs bg-muted px-1 py-0.5 rounded">{value.substring(0, 50)}...</code>;
        } catch {
          return <code className="text-xs">{value}</code>;
        }
      }
      return <code className="text-xs bg-muted px-1 py-0.5 rounded">{JSON.stringify(value).substring(0, 50)}...</code>;

    case 'decimal':
      return typeof value === 'number' ? value.toFixed(2) : value;

    case 'textarea':
      // Truncate long text in list view
      const text = String(value);
      return text.length > 100 ? text.substring(0, 100) + '...' : text;

    default:
      return String(value);
  }
}

function AvatarGroup({ users, max = 3 }) {
  if (!users || users.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const visible = users.slice(0, max);
  const rest = users.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((u, i) => (
        <Avatar key={i} className="h-8 w-8 border-2 border-background">
          <AvatarImage src={u.avatar} />
          <AvatarFallback>{u.name?.[0] || '?'}</AvatarFallback>
        </Avatar>
      ))}
      {rest > 0 && (
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
          +{rest}
        </div>
      )}
    </div>
  );
}

export { AvatarGroup };

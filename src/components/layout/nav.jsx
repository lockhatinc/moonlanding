'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { File, LayoutDashboard } from 'lucide-react';

export function Nav({ items = [] }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 px-2">
      <Link
        href="/"
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
          pathname === '/'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <LayoutDashboard className="h-4 w-4" />
        Dashboard
      </Link>
      {items.map((item) => {
        const Icon = Icons[item.icon] || File;
        const isActive = pathname.startsWith(item.href);

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

'use client';

import { NavLink, Stack } from '@mantine/core';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';
import { File, LayoutDashboard } from 'lucide-react';

export function Nav({ items = [] }) {
  const pathname = usePathname();

  return (
    <Stack gap={4}>
      <NavLink
        component={Link}
        href="/"
        label="Dashboard"
        leftSection={<LayoutDashboard size={16} />}
        active={pathname === '/'}
      />
      {items.map((item) => {
        const Icon = Icons[item.icon] || File;
        const isActive = pathname.startsWith(item.href);

        return (
          <NavLink
            key={item.name}
            component={Link}
            href={item.href}
            label={item.label}
            leftSection={<Icon size={16} />}
            active={isActive}
          />
        );
      })}
    </Stack>
  );
}

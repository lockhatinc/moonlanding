'use client';

import { useMemo } from 'react';
import { can } from '@/lib/permissions';

export const usePermissions = (user, spec) => {
  const canCreate = useMemo(() => can(user, spec, 'create'), [user, spec]);
  const canEdit = useMemo(() => can(user, spec, 'edit'), [user, spec]);
  const canDelete = useMemo(() => can(user, spec, 'delete'), [user, spec]);
  const canView = useMemo(() => can(user, spec, 'view'), [user, spec]);

  return { canCreate, canEdit, canDelete, canView };
};

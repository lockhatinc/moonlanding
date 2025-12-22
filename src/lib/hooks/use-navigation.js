'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

export const useNavigation = (entityName = null) => {
  const router = useRouter();

  const goToList = useCallback(() => {
    if (entityName) router.push(`/${entityName}`);
  }, [router, entityName]);

  const goToDetail = useCallback((id) => {
    if (entityName) router.push(`/${entityName}/${id}`);
  }, [router, entityName]);

  const goToEdit = useCallback((id) => {
    if (entityName) router.push(`/${entityName}/${id}/edit`);
  }, [router, entityName]);

  const goToCreate = useCallback(() => {
    if (entityName) router.push(`/${entityName}/new`);
  }, [router, entityName]);

  const goBack = useCallback(() => router.back(), [router]);
  const refresh = useCallback(() => router.refresh(), [router]);

  return { goToList, goToDetail, goToEdit, goToCreate, goBack, refresh, router };
};

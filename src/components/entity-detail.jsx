'use client';

import { useState, useCallback, memo } from 'react';
import { dynamic, useRouter } from '@/lib/next-polyfills';
import { Tabs, Badge, Stack, Center, Loader } from '@mantine/core';
import { getDisplayFields } from '@/config';
import { Icons } from '@/config/icon-config';
import { SkeletonDetail } from '@/components/skeleton';
import { useApi } from '@/lib/api-client-unified';
import { ErrorBoundary } from '@/lib/error-boundary';

const AddChecklistDialog = dynamic(() => import('./dialogs/add-checklist').then(m => ({ default: m.AddChecklistDialog })), { loading: () => <div>Loading...</div>, ssr: false });
const DetailHeader = dynamic(() => import('./entity-detail/detail-header').then(m => ({ default: m.DetailHeader })), { loading: () => <Loader size="sm" />, ssr: false });
const DetailFields = dynamic(() => import('./entity-detail/detail-fields').then(m => ({ default: m.DetailFields })), { loading: () => <Loader size="sm" />, ssr: false });
const ChildTabs = dynamic(() => import('./entity-detail/child-tabs').then(m => ({ default: m.ChildTabs })), { loading: () => <Loader size="sm" />, ssr: false });
const ActionsPanel = dynamic(() => import('./entity-detail/actions-panel').then(m => ({ default: m.ActionsPanel })), { loading: () => <Loader size="sm" />, ssr: false });
const ClientRating = dynamic(() => import('./client-rating').then(m => ({ default: m.ClientRating })), { loading: () => <Loader size="sm" />, ssr: false });

const DetailHeaderMemo = memo(DetailHeader);
const DetailFieldsMemo = memo(DetailFields);
const ChildTabsMemo = memo(ChildTabs);
const ActionsPanelMemo = memo(ActionsPanel);

export function EntityDetail({ spec, data, children = {}, user, canEdit = false, canDelete = false, deleteAction, loading = false }) {
  const router = useRouter();
  const [activeDialog, setActiveDialog] = useState(null);
  const displayFields = getDisplayFields(spec);
  const Icon = Icons[spec.icon] || Icons.file;
  const { execute } = useApi();

  const childTabs = spec.children
    ? Object.entries(spec.children).map(([key, child]) => ({ key, ...child, data: children[key] || [] }))
    : [];

  const handleSendMessage = useCallback(async (message) => {
    try {
      return await execute(api => api.create('chat', message));
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, [execute]);

  const handleActionClick = useCallback((dialog) => {
    if (dialog) setActiveDialog(dialog);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setActiveDialog(null);
  }, []);

  const handleDialogSuccess = useCallback(() => {
    setActiveDialog(null);
    router.refresh();
  }, [router]);

  if (loading) {
    return <SkeletonDetail />;
  }

  return (
    <ErrorBoundary>
      <Stack gap="md">
        <DetailHeaderMemo spec={spec} data={data} canEdit={canEdit} canDelete={canDelete} onDelete={deleteAction} icon={Icon} />

        <Tabs defaultValue="details">
          <Tabs.List>
            <Tabs.Tab value="details">Details</Tabs.Tab>
            {childTabs.map(tab => (
              <Tabs.Tab key={tab.key} value={tab.key}>
                {tab.label}
                {tab.data.length > 0 && <Badge size="sm" ml="xs" variant="light">{tab.data.length}</Badge>}
              </Tabs.Tab>
            ))}
          </Tabs.List>

          <Tabs.Panel value="details" pt="md">
            <Stack gap="md">
              <DetailFieldsMemo spec={spec} data={data} fields={displayFields} />
              {spec.name === 'engagement' && data.stage === 'finalization' && user?.role === 'client_admin' && (
                <ClientRating engagement={data} user={user} />
              )}
            </Stack>
          </Tabs.Panel>

          <ChildTabsMemo childTabs={childTabs} parentSpec={spec} parentData={data} user={user} onSendMessage={handleSendMessage} />
        </Tabs>

        <ActionsPanelMemo spec={spec} user={user} onActionClick={handleActionClick} />

        {activeDialog === 'addChecklist' && <AddChecklistDialog review={data} onClose={handleCloseDialog} onSuccess={handleDialogSuccess} />}
      </Stack>
    </ErrorBoundary>
  );
}

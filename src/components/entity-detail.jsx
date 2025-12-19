'use client';

import { useState, useCallback, memo } from 'react';
import { Tabs, Badge, Stack, Center, Loader } from '@mantine/core';
import { AddChecklistDialog } from './dialogs/add-checklist';
import { DetailHeader } from './entity-detail/detail-header';
import { DetailFields } from './entity-detail/detail-fields';
import { ChildTabs } from './entity-detail/child-tabs';
import { ActionsPanel } from './entity-detail/actions-panel';
import { getDisplayFields, API_ENDPOINTS } from '@/config';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import { SkeletonDetail } from '@/components/skeleton';

const DetailHeaderMemo = memo(DetailHeader);
const DetailFieldsMemo = memo(DetailFields);
const ChildTabsMemo = memo(ChildTabs);
const ActionsPanelMemo = memo(ActionsPanel);

export function EntityDetail({ spec, data, children = {}, user, canEdit = false, canDelete = false, deleteAction, loading = false }) {
  const router = useRouter();
  const [activeDialog, setActiveDialog] = useState(null);
  const displayFields = getDisplayFields(spec);
  const Icon = Icons[spec.icon] || Icons.File;

  const childTabs = spec.children
    ? Object.entries(spec.children).map(([key, child]) => ({ key, ...child, data: children[key] || [] }))
    : [];

  const handleSendMessage = useCallback(async (message) => {
    try {
      const response = await fetch(API_ENDPOINTS.chatSend(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      if (!response.ok) throw new Error('Failed to send message');
      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, []);

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
          <DetailFieldsMemo spec={spec} data={data} fields={displayFields} />
        </Tabs.Panel>

        <ChildTabsMemo childTabs={childTabs} parentSpec={spec} parentData={data} user={user} onSendMessage={handleSendMessage} />
      </Tabs>

      <ActionsPanelMemo spec={spec} user={user} onActionClick={handleActionClick} />

      {activeDialog === 'addChecklist' && <AddChecklistDialog review={data} onClose={handleCloseDialog} onSuccess={handleDialogSuccess} />}
    </Stack>
  );
}

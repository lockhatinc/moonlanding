'use client';

import { useState } from 'react';
import { Tabs, Badge, Stack } from '@mantine/core';
import { AddChecklistDialog } from './dialogs/add-checklist';
import { DetailHeader } from './entity-detail/detail-header';
import { DetailFields } from './entity-detail/detail-fields';
import { ChildTabs } from './entity-detail/child-tabs';
import { ActionsPanel } from './entity-detail/actions-panel';
import { getDisplayFields, getEntityIcon } from '@/lib/field-types';
import { useRouter } from 'next/navigation';

export function EntityDetail({ spec, data, children = {}, user, canEdit = false, canDelete = false, deleteAction }) {
  const router = useRouter();
  const [activeDialog, setActiveDialog] = useState(null);
  const displayFields = getDisplayFields(spec);
  const Icon = getEntityIcon(spec);

  const childTabs = spec.children
    ? Object.entries(spec.children).map(([key, child]) => ({ key, ...child, data: children[key] || [] }))
    : [];

  const handleSendMessage = async (message) => {
    try {
      const response = await fetch(`/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(message) });
      if (!response.ok) throw new Error('Failed to send message');
      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  return (
    <Stack gap="md">
      <DetailHeader spec={spec} data={data} canEdit={canEdit} canDelete={canDelete} onDelete={deleteAction} icon={Icon} />

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
          <DetailFields spec={spec} data={data} fields={displayFields} />
        </Tabs.Panel>

        <ChildTabs childTabs={childTabs} parentSpec={spec} parentData={data} user={user} onSendMessage={handleSendMessage} />
      </Tabs>

      <ActionsPanel spec={spec} user={user} onActionClick={(dialog) => dialog && setActiveDialog(dialog)} />

      {activeDialog === 'addChecklist' && <AddChecklistDialog review={data} onClose={() => setActiveDialog(null)} onSuccess={() => { setActiveDialog(null); router.refresh(); }} />}
    </Stack>
  );
}

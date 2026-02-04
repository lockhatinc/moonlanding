'use client';

import { memo } from 'react';
import { dynamic } from '@/lib/next-polyfills';
import { Tabs, Loader } from '@mantine/core';
import { can } from '@/services/permission.service';

const ListBuilder = dynamic(() => import('../builders/list-builder').then(m => ({ default: m.ListBuilder })), { loading: () => <Loader />, ssr: false });
const ChatPanel = dynamic(() => import('../chat-panel').then(m => ({ default: m.ChatPanel })), { loading: () => <Loader />, ssr: false });

const TabPanel = memo(function TabPanel({ tab, parentSpec, parentData, user, onSendMessage }) {
  const childSpec = tab.spec;
  if (!childSpec) return null;
  return (
    <Tabs.Panel key={tab.key} value={tab.key} pt="md">
      {tab.component === 'chat'
        ? <ChatPanel entityType={parentSpec.name} entityId={parentData.id} messages={tab.data} user={user} onSendMessage={onSendMessage} />
        : <ListBuilder spec={childSpec} data={tab.data} canCreate={can(user, childSpec, 'create')} />
      }
    </Tabs.Panel>
  );
});

export function ChildTabs({ childTabs, parentSpec, parentData, user, onSendMessage }) {
  return (
    <>
      {childTabs.map(tab => (
        <TabPanel key={tab.key} tab={tab} parentSpec={parentSpec} parentData={parentData} user={user} onSendMessage={onSendMessage} />
      ))}
    </>
  );
}

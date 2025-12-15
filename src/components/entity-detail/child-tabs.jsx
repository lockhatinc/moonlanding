import { Tabs } from '@mantine/core';
import { EntityList } from '../entity-list';
import { ChatPanel } from '../chat-panel';
import { specs } from '@/config';
import { can } from '@/lib/permissions';

export function ChildTabs({ childTabs, parentSpec, parentData, user, onSendMessage }) {
  return (
    <>
      {childTabs.map(tab => {
        const childSpec = specs[tab.entity];
        if (!childSpec) return null;
        return (
          <Tabs.Panel key={tab.key} value={tab.key} pt="md">
            {tab.component === 'chat'
              ? <ChatPanel entityType={parentSpec.name} entityId={parentData.id} messages={tab.data} user={user} onSendMessage={onSendMessage} />
              : <EntityList spec={childSpec} data={tab.data} canCreate={can(user, childSpec, 'create')} />
            }
          </Tabs.Panel>
        );
      })}
    </>
  );
}

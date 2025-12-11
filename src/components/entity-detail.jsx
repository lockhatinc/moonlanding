'use client';

import { useRouter } from 'next/navigation';
import { Tabs, Button, Paper, Title, Group, Text, SimpleGrid, ActionIcon, Badge, Stack, Box } from '@mantine/core';
import { FieldRender } from './field-render';
import { EntityList } from './entity-list';
import { ChatPanel } from './domain';
import { Pencil, Trash2, File, ArrowLeft } from 'lucide-react';
import * as Icons from 'lucide-react';
import { specs } from '@/specs';
import { can } from '@/engine';

export function EntityDetail({ spec, data, children = {}, user, canEdit = false, canDelete = false, deleteAction }) {
  const router = useRouter();

  const displayFields = Object.entries(spec.fields)
    .filter(([_, f]) => !f.hidden && f.type !== 'id')
    .map(([key, f]) => ({ key, ...f }));

  const Icon = Icons[spec.icon] || File;

  const childTabs = spec.children
    ? Object.entries(spec.children).map(([key, child]) => ({
        key,
        ...child,
        data: children[key] || [],
      }))
    : [];

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete this ${spec.label.toLowerCase()}?`)) {
      if (deleteAction) {
        await deleteAction();
      }
    }
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group>
          <ActionIcon variant="subtle" onClick={() => router.push(`/${spec.name}`)}>
            <ArrowLeft size={18} />
          </ActionIcon>
          <Icon size={24} />
          <Box>
            <Title order={2}>{data.name || data.email || data.id}</Title>
            {data.status && (
              <FieldRender
                spec={spec}
                field={{ key: 'status', type: 'enum', options: 'statuses' }}
                value={data.status}
                row={data}
              />
            )}
          </Box>
        </Group>
        <Group>
          {canEdit && (
            <Button variant="outline" leftSection={<Pencil size={16} />} onClick={() => router.push(`/${spec.name}/${data.id}/edit`)}>
              Edit
            </Button>
          )}
          {canDelete && deleteAction && (
            <form action={handleDelete}>
              <Button type="submit" color="red" leftSection={<Trash2 size={16} />}>
                Delete
              </Button>
            </form>
          )}
        </Group>
      </Group>

      <Tabs defaultValue="details">
        <Tabs.List>
          <Tabs.Tab value="details">Details</Tabs.Tab>
          {childTabs.map(tab => (
            <Tabs.Tab key={tab.key} value={tab.key}>
              {tab.label}
              {tab.data.length > 0 && (
                <Badge size="sm" ml="xs" variant="light">{tab.data.length}</Badge>
              )}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        <Tabs.Panel value="details" pt="md">
          <Paper p="md" withBorder>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              {displayFields.map(field => (
                <Box key={field.key}>
                  <Text size="sm" c="dimmed">{field.label || field.key}</Text>
                  <Text fw={500}><FieldRender spec={spec} field={field} value={data[field.key]} row={data} /></Text>
                </Box>
              ))}
            </SimpleGrid>
          </Paper>
        </Tabs.Panel>

        {childTabs.map(tab => {
          const childSpec = specs[tab.entity];
          if (!childSpec) return null;

          return (
            <Tabs.Panel key={tab.key} value={tab.key} pt="md">
              {tab.component === 'chat' ? (
                <ChatPanel entityType={spec.name} entityId={data.id} messages={tab.data} user={user} />
              ) : (
                <EntityList spec={childSpec} data={tab.data} canCreate={can(user, childSpec, 'create')} />
              )}
            </Tabs.Panel>
          );
        })}
      </Tabs>

      {spec.actions && spec.actions.length > 0 && (
        <Paper p="md" withBorder>
          <Title order={4} mb="sm">Actions</Title>
          <Group>
            {spec.actions.map(action => {
              const ActionIcon = Icons[action.icon] || File;
              return (
                <Button key={action.key} variant="outline" size="sm" leftSection={<ActionIcon size={16} />}>
                  {action.label}
                </Button>
              );
            })}
          </Group>
        </Paper>
      )}
    </Stack>
  );
}

import { Group, Box, Title, ActionIcon, Button } from '@mantine/core';
import { ACTION_ICONS } from '@/config/icon-config';
import { useRouter } from '@/lib/next-polyfills';
import { FieldRender } from '../field-render';

export function DetailHeader({ spec, data, canEdit, canDelete, onDelete, icon: Icon }) {
  const router = useRouter();

  return (
    <Group justify="space-between">
      <Group>
        <ActionIcon variant="subtle" onClick={() => router.push(`/${spec.name}`)}><ACTION_ICONS.back size={18} /></ActionIcon>
        <Icon size={24} />
        <Box>
          <Title order={2}>{data.name || data.email || data.id}</Title>
          {data.status && <FieldRender spec={spec} field={{ key: 'status', type: 'enum', options: 'statuses' }} value={data.status} row={data} />}
        </Box>
      </Group>
      <Group>
        {canEdit && <Button variant="outline" leftSection={<ACTION_ICONS.edit size={16} />} onClick={() => router.push(`/${spec.name}/${data.id}/edit`)}>Edit</Button>}
        {canDelete && onDelete && <form action={onDelete}><Button type="submit" color="red" leftSection={<ACTION_ICONS.delete size={16} />}>Delete</Button></form>}
      </Group>
    </Group>
  );
}

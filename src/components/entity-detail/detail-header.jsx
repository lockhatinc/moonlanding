import { Group, Box, Title, ActionIcon, Button } from '@mantine/core';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FieldRender } from '../field-render';

export function DetailHeader({ spec, data, canEdit, canDelete, onDelete, icon: Icon }) {
  const router = useRouter();

  return (
    <Group justify="space-between">
      <Group>
        <ActionIcon variant="subtle" onClick={() => router.push(`/${spec.name}`)}><ArrowLeft size={18} /></ActionIcon>
        <Icon size={24} />
        <Box>
          <Title order={2}>{data.name || data.email || data.id}</Title>
          {data.status && <FieldRender spec={spec} field={{ key: 'status', type: 'enum', options: 'statuses' }} value={data.status} row={data} />}
        </Box>
      </Group>
      <Group>
        {canEdit && <Button variant="outline" leftSection={<Pencil size={16} />} onClick={() => router.push(`/${spec.name}/${data.id}/edit`)}>Edit</Button>}
        {canDelete && onDelete && <form action={onDelete}><Button type="submit" color="red" leftSection={<Trash2 size={16} />}>Delete</Button></form>}
      </Group>
    </Group>
  );
}

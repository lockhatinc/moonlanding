import { Paper, Title, Group, Button } from '@mantine/core';
import { Icons } from '@/config/icon-config';
import { can } from '@/services/permission.service';

export function ActionsPanel({ spec, user, onActionClick }) {
  if (!spec.actions?.length) return null;

  return (
    <Paper p="md" withBorder>
      <Title order={4} mb="sm">Actions</Title>
      <Group>
        {spec.actions.map(action => {
          const ActionIcon = Icons[action.icon] || Icons.file;
          if (!can(user, spec, action.permission)) return null;
          return (
            <Button
              key={action.key}
              variant="outline"
              size="sm"
              leftSection={<ActionIcon size={16} />}
              onClick={() => onActionClick(action.dialog)}
            >
              {action.label}
            </Button>
          );
        })}
      </Group>
    </Paper>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Button, TextInput, NumberInput, Table, Badge, Group, Stack, Alert, Modal, Tooltip, Skeleton, Text } from '@mantine/core';
import { useCollaborators } from '@/lib/hooks/use-collaborators';
import { showSuccess, showError } from '@/lib/notifications';

export function CollaboratorManager({ reviewId, onCollaboratorChange, canEdit = false }) {
  const { collaborators, loading, error: hookError, addCollaborator, removeCollaborator, refetch, setError } = useCollaborators(reviewId);
  const [email, setEmail] = useState('');
  const [expiryDays, setExpiryDays] = useState(7);
  const [submitting, setSubmitting] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [revokeTargetId, setRevokeTargetId] = useState(null);

  const handleAddCollaborator = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email format');
      return;
    }

    setSubmitting(true);
    try {
      await addCollaborator(email, expiryDays);
      showSuccess(`Added ${email} as collaborator`);
      setEmail('');
      setExpiryDays(7);
      if (onCollaboratorChange) onCollaboratorChange({ email, expiryDays });
    } catch (err) {
      showError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeClick = (collaboratorId) => {
    setRevokeTargetId(collaboratorId);
    setShowRevokeConfirm(true);
  };

  const confirmRevoke = async () => {
    setShowRevokeConfirm(false);
    try {
      await removeCollaborator(revokeTargetId);
      showSuccess('Collaborator access revoked');
    } catch (err) {
      showError(err);
    }
  };

  if (loading && !collaborators.length) {
    return <Skeleton height={200} />;
  }

  const rows = collaborators.map((collab) => (
    <Table.Tr key={collab.id}>
      <Table.Td>{collab.email}</Table.Td>
      <Table.Td>
        <Badge color={collab.is_permanent ? 'blue' : 'yellow'}>
          {collab.is_permanent ? 'Permanent' : `${collab.days_until_expiry}d left`}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Button
          size="xs"
          color="red"
          variant="light"
          onClick={() => handleRevokeClick(collab.id)}
          disabled={!canEdit}
        >
          Revoke
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="md" className="collaborator-manager">
      {canEdit && (
        <div>
          <Text fw={500} mb="xs">Add Collaborator</Text>
          <Group grow>
            <TextInput
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              type="email"
              disabled={submitting}
            />
            <Tooltip label="Leave empty for permanent access. Max 30 days.">
              <NumberInput
                label="Expire in (days)"
                value={expiryDays}
                onChange={setExpiryDays}
                min={1}
                max={30}
                disabled={submitting}
                placeholder="Leave empty for permanent"
              />
            </Tooltip>
            <Button
              onClick={handleAddCollaborator}
              disabled={submitting || !email.trim()}
              loading={submitting}
            >
              Add
            </Button>
          </Group>
        </div>
      )}

      {hookError && (
        <Alert color="red" title="Error" onClose={() => setError(null)}>
          {hookError}
          <Button size="xs" onClick={refetch} mt="xs">Retry</Button>
        </Alert>
      )}

      <div>
        <Text fw={500} mb="sm">Current Collaborators ({collaborators.length})</Text>
        {collaborators.length > 0 ? (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Email</Table.Th>
                <Table.Th>Access</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        ) : (
          <Text c="dimmed" ta="center" py="md">No collaborators added yet</Text>
        )}
      </div>

      <Modal
        opened={showRevokeConfirm}
        onClose={() => setShowRevokeConfirm(false)}
        title="Revoke Access"
      >
        <Text mb="md">Are you sure you want to revoke this collaborator's access?</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setShowRevokeConfirm(false)}>
            Cancel
          </Button>
          <Button color="red" onClick={confirmRevoke}>
            Revoke
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}

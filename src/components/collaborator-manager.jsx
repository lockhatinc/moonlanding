'use client';

import { useState, useEffect } from 'react';
import { Button, TextInput, NumberInput, Table, Badge, Group, Stack, Alert, Modal } from '@mantine/core';

export function CollaboratorManager({ reviewId, onCollaboratorChange }) {
  const [collaborators, setCollaborators] = useState([]);
  const [email, setEmail] = useState('');
  const [expiryDays, setExpiryDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCollaborators();
  }, [reviewId]);

  const fetchCollaborators = async () => {
    try {
      const res = await fetch(`/api/mwr/review/${reviewId}/collaborators`);
      const data = await res.json();

      if (data.success) {
        setCollaborators(data.collaborators || []);
      }
    } catch (err) {
      setError('Failed to load collaborators');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCollaborator = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/mwr/review/${reviewId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          expiry_days: expiryDays || null
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setSuccess(`Added ${email} as collaborator`);
      setEmail('');
      setExpiryDays(7);
      fetchCollaborators();

      if (onCollaboratorChange) onCollaboratorChange(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (collaboratorId) => {
    if (!confirm('Revoke access?')) return;

    try {
      const res = await fetch(`/api/mwr/review/${reviewId}/collaborators/${collaboratorId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setSuccess('Collaborator access revoked');
        fetchCollaborators();
      }
    } catch (err) {
      setError('Failed to revoke access');
    }
  };

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
          onClick={() => handleRevoke(collab.id)}
        >
          Revoke
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="md" className="collaborator-manager">
      <div>
        <h3>Add Collaborator</h3>
        <Group grow>
          <TextInput
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            type="email"
            disabled={submitting}
          />
          <NumberInput
            label="Expire in (days)"
            value={expiryDays}
            onChange={setExpiryDays}
            min={1}
            max={30}
            disabled={submitting}
          />
          <Button
            onClick={handleAddCollaborator}
            disabled={submitting || !email.trim()}
            loading={submitting}
          >
            Add
          </Button>
        </Group>
      </div>

      {error && <Alert color="red">{error}</Alert>}
      {success && <Alert color="green">{success}</Alert>}

      <div>
        <h3>Current Collaborators ({collaborators.length})</h3>
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
          <Alert color="blue">No collaborators added yet</Alert>
        )}
      </div>
    </Stack>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Stack, Group, Select, Text, Loader, Center, Alert } from '@mantine/core';
import { AlertCircle } from 'lucide-react';

export function AddChecklistDialog({ review, onClose, onSuccess }) {
  const [checklists, setChecklists] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadChecklists = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/checklist');
        if (!res.ok) throw new Error('Failed to load checklists');
        const data = await res.json();
        setChecklists(data.map(c => ({ value: c.id, label: c.name })));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    loadChecklists();
  }, []);

  const handleAdd = async () => {
    if (!selected) {
      setError('Please select a checklist');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const selectedChecklist = checklists.find(c => c.value === selected);
      const checklistData = await fetch(`/api/checklist/${selected}`).then(r => r.json());

      const res = await fetch('/api/review_checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_id: review.id,
          checklist_id: selected,
          items: checklistData.section_items || checklistData.items || [],
          status: 'pending',
        }),
      });

      if (!res.ok) throw new Error('Failed to add checklist');

      onSuccess();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal opened={true} onClose={onClose} title="Add Checklist to Review" size="md">
      {loading ? (
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      ) : (
        <Stack gap="md">
          {error && <Alert icon={<AlertCircle size={16} />} title="Error" color="red">{error}</Alert>}

          {checklists.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">No checklists available. Create one first.</Text>
          ) : (
            <>
              <Select
                label="Select Checklist"
                placeholder="Choose a checklist to add"
                data={checklists}
                value={selected}
                onChange={setSelected}
                searchable
              />

              <Group justify="flex-end">
                <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
                <Button onClick={handleAdd} loading={submitting} disabled={!selected || submitting}>Add Checklist</Button>
              </Group>
            </>
          )}
        </Stack>
      )}
    </Modal>
  );
}

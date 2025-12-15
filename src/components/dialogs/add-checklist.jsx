'use client';

import { useEffect } from 'react';
import { Modal, Button, Stack, Group, Select, Text, Loader, Center, Alert } from '@mantine/core';
import { AlertCircle } from 'lucide-react';
import { useAsyncState } from '@/lib/use-entity-state';
import { useFormState } from '@/lib/use-entity-state';

export function AddChecklistDialog({ review, onClose, onSuccess }) {
  const { data: checklists, loading, error: loadError, start } = useAsyncState([]);
  const { values, setField, setErrors, errors } = useFormState({ selected: null });
  const { loading: submitting, error: submitError, setSuccess, setFailed } = useAsyncState();

  useEffect(() => {
    start(async () => {
      const res = await fetch('/api/checklist');
      if (!res.ok) throw new Error('Failed to load checklists');
      const data = await res.json();
      return data.map(c => ({ value: c.id, label: c.name }));
    });
  }, [start]);

  const handleAdd = async () => {
    if (!values.selected) {
      setErrors({ selected: 'Please select a checklist' });
      return;
    }

    try {
      const checklistRes = await fetch(`/api/checklist/${values.selected}`);
      const checklistData = await checklistRes.json();

      const res = await fetch('/api/review_checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_id: review.id,
          checklist_id: values.selected,
          items: checklistData.section_items || checklistData.items || [],
          status: 'pending',
        }),
      });

      if (!res.ok) throw new Error('Failed to add checklist');
      setSuccess();
      onSuccess();
    } catch (e) {
      setFailed(e);
    }
  };

  const error = loadError || submitError;

  return (
    <Modal opened={true} onClose={onClose} title="Add Checklist to Review" size="md">
      {loading ? (
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      ) : (
        <Stack gap="md">
          {error && <Alert icon={<AlertCircle size={16} />} title="Error" color="red">{typeof error === 'string' ? error : error.message}</Alert>}

          {checklists.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">No checklists available. Create one first.</Text>
          ) : (
            <>
              <Select
                label="Select Checklist"
                placeholder="Choose a checklist to add"
                data={checklists}
                value={values.selected}
                onChange={(val) => setField('selected', val)}
                searchable
                error={errors.selected}
              />

              <Group justify="flex-end">
                <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
                <Button onClick={handleAdd} loading={submitting} disabled={!values.selected || submitting}>Add Checklist</Button>
              </Group>
            </>
          )}
        </Stack>
      )}
    </Modal>
  );
}

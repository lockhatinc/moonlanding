'use client';

import { useEffect, useState } from 'react';
import { Modal, Button, Stack, Group, Select, Text, Loader, Center, Alert } from '@mantine/core';
import { AlertCircle } from 'lucide-react';
import { useFormState } from '@/lib/hooks';
import { API_ENDPOINTS } from '@/config';

export function AddChecklistDialog({ review, onClose, onSuccess }) {
  const [checklists, setChecklists] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { values, setValue, setError, errors } = useFormState({}, { selected: null });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    const loadChecklists = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.list('checklist'));
        if (!res.ok) throw new Error('Failed to load checklists');
        const data = await res.json();
        setChecklists(data.map(c => ({ value: c.id, label: c.name })));
        setLoadError(null);
      } catch (e) {
        setLoadError(e.message);
      } finally {
        setLoading(false);
      }
    };
    loadChecklists();
  }, []);

  const handleAdd = async () => {
    if (!values.selected) {
      setError('selected', 'Please select a checklist');
      return;
    }

    setSubmitting(true);
    try {
      const checklistRes = await fetch(API_ENDPOINTS.get('checklist', values.selected));
      const checklistData = await checklistRes.json();

      const res = await fetch(API_ENDPOINTS.create('review_checklist'), {
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
      setSubmitError(null);
      onSuccess();
    } catch (e) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
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
                onChange={(val) => setValue('selected', val)}
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

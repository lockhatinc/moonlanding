'use client';

import { useEffect, useState } from 'react';
import { Modal, Button, Stack, Group, Select, Text, Loader, Center, Alert } from '@mantine/core';
import { STATUS_ICONS } from '@/config/icon-config';
import { useFormState } from '@/lib/hooks';
import { useApi } from '@/lib/api-client-unified';
import { useLoadingError } from '@/lib/hooks/use-loading-error';

export function AddChecklistDialog({ review, onClose, onSuccess }) {
  const [checklists, setChecklists] = useState([]);
  const { loading, error: loadError, setLoading, setErrorAndStop } = useLoadingError(true);
  const { values, setValue, setError, errors } = useFormState({}, { selected: null });
  const { loading: submitting, error: submitError, startLoading: startSubmitting, setErrorAndStop: setSubmitError } = useLoadingError();
  const { execute } = useApi();

  useEffect(() => {
    const loadChecklists = async () => {
      try {
        const data = await execute(api => api.list('checklist'));
        setChecklists(data.map(c => ({ value: c.id, label: c.name })));
        setLoading(false);
      } catch (e) {
        setErrorAndStop(e.message);
      }
    };
    loadChecklists();
  }, [execute, setLoading, setErrorAndStop]);

  const handleAdd = async () => {
    if (!values.selected) {
      setError('selected', 'Please select a checklist');
      return;
    }

    startSubmitting();
    try {
      const checklistData = await execute(api => api.get('checklist', values.selected));

      await execute(api => api.create('review_checklist', {
        review_id: review.id,
        checklist_id: values.selected,
        items: checklistData.section_items || checklistData.items || [],
        status: 'pending',
      }));

      onSuccess();
    } catch (e) {
      setSubmitError(e.message);
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
          {error && <Alert icon={<STATUS_ICONS.cancelled size={16} />} title="Error" color="red">{typeof error === 'string' ? error : error.message}</Alert>}

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

'use client';

import { useState, useEffect } from 'react';
import { Button, Select, Stack, Text, Alert, Badge, Group } from '@mantine/core';
import { STAGE_LABELS } from '@/lib/engagement-lifecycle-engine';

const STAGE_COLORS = {
  info_gathering: 'blue',
  commencement: 'cyan',
  team_execution: 'teal',
  partner_review: 'grape',
  finalization: 'green',
  closeout: 'red'
};

export function EngagementStageTransition({ engagementId, currentStage, onTransitionComplete }) {
  const [available, setAvailable] = useState([]);
  const [selected, setSelected] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAvailableTransitions();
  }, [engagementId, currentStage]);

  const fetchAvailableTransitions = async () => {
    try {
      const res = await fetch(`/api/friday/engagement/transition?engagement_id=${engagementId}`);
      const data = await res.json();

      if (data.success) {
        setAvailable(data.availableTransitions || []);
      }
    } catch (err) {
      setError('Failed to load available stages');
    } finally {
      setLoading(false);
    }
  };

  const handleTransition = async () => {
    if (!selected) {
      setError('Please select a stage');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/friday/engagement/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engagementId,
          toStage: selected,
          reason: reason || ''
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Transition failed');
      }

      setSuccess(`Transitioned to ${STAGE_LABELS[selected]}`);
      setSelected('');
      setReason('');

      if (onTransitionComplete) onTransitionComplete(data.transition);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="engagement-stage-transition">
      <Stack gap="md">
        <div>
          <Group>
            <Text fw={500}>Current Stage:</Text>
            <Badge color={STAGE_COLORS[currentStage]} size="lg">
              {STAGE_LABELS[currentStage]}
            </Badge>
          </Group>
        </div>

        {!loading && available.length > 0 ? (
          <>
            <Select
              label="Move To Stage"
              placeholder="Select next stage"
              data={available.map(s => ({
                value: s.stage,
                label: `${STAGE_LABELS[s.stage]}${s.forward ? ' ↓' : ' ↑'}`
              }))}
              value={selected}
              onChange={setSelected}
              disabled={submitting}
              searchable
            />

            <textarea
              placeholder="Reason for transition (optional)"
              value={reason}
              onChange={(e) => setReason(e.currentTarget.value)}
              disabled={submitting}
              style={{ padding: '8px', minHeight: '80px', fontFamily: 'monospace' }}
            />

            {error && <Alert color="red">{error}</Alert>}
            {success && <Alert color="green">{success}</Alert>}

            <Button
              onClick={handleTransition}
              disabled={!selected || submitting}
              loading={submitting}
            >
              {submitting ? 'Transitioning...' : 'Move Stage'}
            </Button>
          </>
        ) : (
          <Alert color="blue">No available stage transitions</Alert>
        )}
      </Stack>
    </div>
  );
}

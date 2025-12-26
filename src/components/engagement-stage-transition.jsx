'use client';

import { useState, useEffect } from 'react';
import { Button, Select, Stack, Text, Alert, Badge, Group, Textarea, Skeleton } from '@mantine/core';
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
  const [lockoutInfo, setLockoutInfo] = useState(null);
  const [failedGates, setFailedGates] = useState([]);

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

      const statusRes = await fetch(`/api/friday/engagement/${engagementId}/transition-status`);
      const statusData = await statusRes.json();
      if (statusData.inLockout) {
        setLockoutInfo(statusData);
      }
      if (statusData.failedGates?.length > 0) {
        setFailedGates(statusData.failedGates);
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

      setTimeout(() => setSuccess(''), 3000);

      if (onTransitionComplete) onTransitionComplete(data.transition);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !available.length) {
    return <Skeleton height={150} />;
  }

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

        {available.length > 0 ? (
          <>
            <Select
              label="Move To Stage"
              placeholder="Select next stage"
              data={available.map(s => ({
                value: s.stage,
                label: `${STAGE_LABELS[s.stage]} ${s.forward ? '(Forward)' : '(Backward)'}`
              }))}
              value={selected}
              onChange={setSelected}
              disabled={submitting}
              searchable
            />

            <Textarea
              label="Transition Reason (optional)"
              placeholder="Explain why you're making this transition..."
              value={reason}
              onChange={(e) => setReason(e.currentTarget.value)}
              disabled={submitting}
              minRows={2}
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
          <Alert color="yellow" title="No Transitions Available">
            <Stack gap="xs">
              <Text size="sm" fw={500}>Current stage: {STAGE_LABELS[currentStage]}</Text>

              {lockoutInfo?.inLockout && (
                <Text size="sm" c="orange">
                  ⏱️ Transition lockout: {lockoutInfo.minutesRemaining}m remaining
                </Text>
              )}

              {failedGates.length > 0 && (
                <>
                  <Text size="sm" fw={500} mt="xs">Failed validation gates:</Text>
                  <Stack gap="xs">
                    {failedGates.map((gate, i) => (
                      <Group key={i} gap="xs">
                        <Text size="xs" c="red">✗</Text>
                        <Text size="xs">{gate.name}: {gate.reason}</Text>
                      </Group>
                    ))}
                  </Stack>
                </>
              )}

              {failedGates.length === 0 && !lockoutInfo?.inLockout && (
                <Text size="sm">All validation gates must pass before transitioning.</Text>
              )}
            </Stack>
          </Alert>
        )}
      </Stack>
    </div>
  );
}

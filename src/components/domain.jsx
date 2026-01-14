'use client';

import { useState, useMemo, Suspense, lazy } from 'react';
import dynamic from '@/lib/next-polyfills';
import { useRouter } from '@/lib/next-polyfills';
import { useHotkeys } from '@mantine/hooks';
import { Stack, Group, Box, Title, Tabs, Grid, ScrollArea, Paper, Badge, Text, ActionIcon, Button, Modal, Skeleton } from '@mantine/core';
import { ACTION_ICONS, UI_ICONS } from '@/config/icon-config';
import { FieldRender } from './field-render';
import { HighlightLayer } from './highlight-layer';
import { useReviewHandlers } from '@/lib/use-review-handlers';
import { getStatusColor } from '@/config/theme-config';
import { CollaboratorManager } from './collaborator-manager';
import { ChecklistTracker } from './checklist-tracker';
import { TenderTracker } from './tender-tracker';
import { PriorityReviewsSidebar } from './priority-reviews-sidebar';
import { RFIResponseForm } from './rfi-response-form';
import { HighlightAnnotator } from './highlight-annotator';

const AddChecklistDialog = dynamic(() => import('./dialogs/add-checklist').then(m => ({ default: m.AddChecklistDialog })), { loading: () => <div>Loading...</div>, ssr: false });
const ChatPanel = dynamic(() => import('./chat-panel').then(m => ({ default: m.ChatPanel })), { loading: () => <div>Loading...</div>, ssr: false });
const PDFWrapper = dynamic(() => import('./pdf-wrapper').then(m => ({ default: m.PDFWrapper })), { loading: () => <div>Loading...</div>, ssr: false });
const ListBuilder = dynamic(() => import('./builders/list-builder').then(m => ({ default: m.ListBuilder })), { loading: () => <div>Loading...</div>, ssr: false });

function ChecklistItem({ checklist }) {
  const statusColor = getStatusColor('checklist', checklist.status);
  return (
    <Paper key={checklist.id} p="xs" withBorder>
      <Group justify="space-between">
        <Text size="sm">{checklist.checklist_id_display || 'Checklist'}</Text>
        <Badge size="sm" color={statusColor}>{checklist.status}</Badge>
      </Group>
    </Paper>
  );
}

export function ReviewDetail({ spec, data, children = {}, user, canEdit = false, canDelete = false, deleteAction }) {
  const router = useRouter();
  const [selectedHighlight, setSelectedHighlight] = useState(null);
  const [showAddChecklistDialog, setShowAddChecklistDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('queries');
  const { handleHighlight, handleResolve, handleAddResponse, handleSendMessage } = useReviewHandlers(data.id);

  const highlights = children.highlights || [];
  const checklists = children.checklists || [];
  const chatMessages = children.chat || [];
  const unresolvedCount = useMemo(() => highlights.filter((h) => !h.resolved).length, [highlights]);

  useHotkeys([
    ['1', () => setActiveTab('queries')],
    ['2', () => setActiveTab('details')],
    ['3', () => setActiveTab('checklists')],
    ['4', () => setActiveTab('collaborators')],
    ['5', () => setActiveTab('tenders')],
    ['6', () => setActiveTab('priority')],
    ['7', () => setActiveTab('chat')],
  ]);

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group>
          <ActionIcon variant="subtle" onClick={() => router.push('/review')} aria-label="Back to reviews"><ACTION_ICONS.back size={18} /></ActionIcon>
          <ACTION_ICONS.search size={24} />
          <Box>
            <Title order={2}>{data.name}</Title>
            <Group gap="xs">
              <FieldRender spec={spec} field={{ key: 'status', type: 'enum', options: 'statuses' }} value={data.status} row={data} />
              {unresolvedCount > 0 && <Badge variant="light">{unresolvedCount} unresolved</Badge>}
            </Group>
          </Box>
        </Group>
        <Group>
          {canEdit && <Button variant="outline" leftSection={<ACTION_ICONS.checklist size={16} />} onClick={() => setShowAddChecklistDialog(true)}>Add Checklist</Button>}
          {canEdit && <Button variant="outline" leftSection={<ACTION_ICONS.edit size={16} />} onClick={() => router.push(`/review/${data.id}/edit`)}>Edit</Button>}
          {canDelete && <Button color="red" leftSection={<ACTION_ICONS.delete size={16} />} onClick={() => setShowDeleteConfirm(true)}>Delete</Button>}
        </Group>
      </Group>
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Box h="calc(100vh - 200px)"><PDFWrapper review={data} fileUrl={data.drive_file_id} highlights={highlights} onHighlight={canEdit ? handleHighlight : undefined} selectedHighlight={selectedHighlight} onSelectHighlight={setSelectedHighlight} /></Box>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Tabs value={activeTab} onTabChange={setActiveTab} h="calc(100vh - 200px)">
            <Tabs.List>
              <Tabs.Tab value="queries" leftSection={<UI_ICONS.messageSquare size={14} />} rightSection={<Badge size="sm">{highlights.length}</Badge>}>Highlights</Tabs.Tab>
              <Tabs.Tab value="details" leftSection={<UI_ICONS.file size={14} />}>Details</Tabs.Tab>
              <Tabs.Tab value="checklists" leftSection={<ACTION_ICONS.checklist size={14} />} rightSection={<Badge size="sm">{checklists.length}</Badge>}>Checklists</Tabs.Tab>
              <Tabs.Tab value="collaborators" leftSection={<UI_ICONS.users size={14} />}>Collaborators</Tabs.Tab>
              <Tabs.Tab value="tenders" leftSection={<UI_ICONS.calendar size={14} />}>Tenders</Tabs.Tab>
              <Tabs.Tab value="priority" leftSection={<UI_ICONS.star size={14} />}>Priority</Tabs.Tab>
              <Tabs.Tab value="chat" rightSection={<Badge size="sm">{chatMessages.length}</Badge>}>Chat</Tabs.Tab>
            </Tabs.List>
            <ScrollArea h="calc(100% - 40px)" pt="md">
              <Tabs.Panel value="queries"><HighlightLayer highlights={highlights} selectedId={selectedHighlight} onSelect={setSelectedHighlight} onResolve={handleResolve} onAddResponse={handleAddResponse} user={user} canResolve={canEdit} /></Tabs.Panel>
              <Tabs.Panel value="details">
                <Paper p="md" withBorder>
                  <Stack gap="md">
                    <Box><Text size="sm" c="dimmed">Financial Year</Text><Box fw={500}>{data.financial_year || '—'}</Box></Box>
                    <Box><Text size="sm" c="dimmed">Team</Text><Box fw={500}>{data.team_id_display || '—'}</Box></Box>
                    <Box><Text size="sm" c="dimmed">Deadline</Text><Box fw={500}><FieldRender spec={spec} field={{ type: 'date' }} value={data.deadline} row={data} /></Box></Box>
                    <Box><Text size="sm" c="dimmed">WIP Value</Text><Box fw={500}>{data.wip_value ? `$${data.wip_value.toFixed(2)}` : '—'}</Box></Box>
                    <Box><Text size="sm" c="dimmed">Private</Text><Box fw={500}>{data.is_private ? 'Yes' : 'No'}</Box></Box>
                  </Stack>
                </Paper>
              </Tabs.Panel>
              <Tabs.Panel value="checklists">
                <Paper p="md" withBorder>
                  {checklists.length === 0 ? (
                    <Text c="dimmed" ta="center" py="md">No checklists assigned</Text>
                  ) : (
                    <Stack gap="xs">
                      {checklists.map((c) => <ChecklistItem key={c.id} checklist={c} />)}
                    </Stack>
                  )}
                </Paper>
              </Tabs.Panel>
              <Tabs.Panel value="collaborators"><CollaboratorManager reviewId={data.id} canEdit={canEdit} /></Tabs.Panel>
              <Tabs.Panel value="tenders"><TenderTracker reviewId={data.id} tenderId={data.tender_id} /></Tabs.Panel>
              <Tabs.Panel value="priority"><PriorityReviewsSidebar userId={user.id} reviewId={data.id} /></Tabs.Panel>
              <Tabs.Panel value="chat"><ChatPanel entityType="review" entityId={data.id} messages={chatMessages} user={user} onSendMessage={handleSendMessage} /></Tabs.Panel>
            </ScrollArea>
          </Tabs>
        </Grid.Col>
      </Grid>
      {showAddChecklistDialog && <AddChecklistDialog review={data} onClose={() => setShowAddChecklistDialog(false)} onSuccess={() => { setShowAddChecklistDialog(false); router.refresh(); }} />}

      <Modal
        opened={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Review"
      >
        <Stack gap="md">
          <Text mb="md">Delete review <strong>"{data.name}"</strong>?</Text>

          <Paper p="md" withBorder bg="var(--mantine-color-red-0)">
            <Stack gap="xs">
              <Text size="sm" fw={500} c="red">Impact of deletion:</Text>
              <Group gap="xs">
                <Text size="sm">- {highlights.length} highlight{highlights.length !== 1 ? 's' : ''} will be deleted</Text>
              </Group>
              <Group gap="xs">
                <Text size="sm">- {checklists.length} checklist{checklists.length !== 1 ? 's' : ''} will be removed</Text>
              </Group>
              <Group gap="xs">
                <Text size="sm">- All collaborator access will be revoked</Text>
              </Group>
              <Text size="sm" fw={500} c="red" mt="xs">This action cannot be undone.</Text>
            </Stack>
          </Paper>

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            {deleteAction && (
              <form action={deleteAction} style={{ display: 'inline' }}>
                <Button type="submit" color="red">
                  Delete
                </Button>
              </form>
            )}
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

export function ReviewList({ spec, data, pagination, user, canCreate }) {
  const priorityReviews = useMemo(() => {
    if (Array.isArray(user?.priority_reviews)) {
      return user.priority_reviews;
    }
    if (typeof user?.priority_reviews === 'string') {
      try {
        return JSON.parse(user.priority_reviews);
      } catch {
        return [];
      }
    }
    return [];
  }, [user?.priority_reviews]);

  const dataWithPriority = useMemo(() => {
    return data.map(review => ({
      ...review,
      _isPriority: priorityReviews.includes(review.id)
    }));
  }, [data, priorityReviews]);

  return <ListBuilder spec={spec} data={dataWithPriority} pagination={pagination} canCreate={canCreate} />;
}

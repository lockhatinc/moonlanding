'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Stack, Group, Box, Title, Tabs, Grid, ScrollArea, Paper, Badge, Text, ActionIcon, Button } from '@mantine/core';
import { ArrowLeft, FileSearch, Pencil, Trash2, MessageSquare, FileText, ClipboardCheck } from 'lucide-react';
import { FieldRender } from './field-render';
import { AddChecklistDialog } from './dialogs/add-checklist';
import { ChatPanel } from './chat-panel';
import { PDFViewer } from './pdf-viewer';
import { HighlightLayer } from './highlight-layer';
import { useReviewHandlers } from '@/lib/use-review-handlers';

function ChecklistItem({ checklist }) {
  const statusColor = checklist.status === 'completed' ? 'green' : checklist.status === 'in_progress' ? 'blue' : 'yellow';
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
  const { handleHighlight, handleResolve, handleAddResponse, handleSendMessage } = useReviewHandlers(data.id);

  const highlights = children.highlights || [];
  const checklists = children.checklists || [];
  const chatMessages = children.chat || [];
  const unresolvedCount = useMemo(() => highlights.filter((h) => !h.resolved).length, [highlights]);

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group>
          <ActionIcon variant="subtle" onClick={() => router.push('/review')}><ArrowLeft size={18} /></ActionIcon>
          <FileSearch size={24} />
          <Box>
            <Title order={2}>{data.name}</Title>
            <Group gap="xs">
              <FieldRender spec={spec} field={{ key: 'status', type: 'enum', options: 'statuses' }} value={data.status} row={data} />
              {unresolvedCount > 0 && <Badge variant="light">{unresolvedCount} unresolved</Badge>}
            </Group>
          </Box>
        </Group>
        <Group>
          {canEdit && <Button variant="outline" leftSection={<ClipboardCheck size={16} />} onClick={() => setShowAddChecklistDialog(true)}>Add Checklist</Button>}
          {canEdit && <Button variant="outline" leftSection={<Pencil size={16} />} onClick={() => router.push(`/review/${data.id}/edit`)}>Edit</Button>}
          {canDelete && deleteAction && <form action={deleteAction}><Button type="submit" color="red" leftSection={<Trash2 size={16} />}>Delete</Button></form>}
        </Group>
      </Group>
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Box h="calc(100vh - 200px)"><PDFViewer fileUrl={data.drive_file_id} highlights={highlights} onHighlight={canEdit ? handleHighlight : undefined} selectedHighlight={selectedHighlight} onSelectHighlight={setSelectedHighlight} /></Box>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Tabs defaultValue="queries" h="calc(100vh - 200px)">
            <Tabs.List>
              <Tabs.Tab value="queries" leftSection={<MessageSquare size={14} />}>Queries</Tabs.Tab>
              <Tabs.Tab value="details" leftSection={<FileText size={14} />}>Details</Tabs.Tab>
              <Tabs.Tab value="checklists" leftSection={<ClipboardCheck size={14} />}>Checklists</Tabs.Tab>
              <Tabs.Tab value="chat">Chat</Tabs.Tab>
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
              <Tabs.Panel value="chat"><ChatPanel entityType="review" entityId={data.id} messages={chatMessages} user={user} onSendMessage={handleSendMessage} /></Tabs.Panel>
            </ScrollArea>
          </Tabs>
        </Grid.Col>
      </Grid>
      {showAddChecklistDialog && <AddChecklistDialog review={data} onClose={() => setShowAddChecklistDialog(false)} onSuccess={() => { setShowAddChecklistDialog(false); router.refresh(); }} />}
    </Stack>
  );
}

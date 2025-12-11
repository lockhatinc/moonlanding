'use client';

import { useState, useRef, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Paper, Stack, Group, Badge, Text, ActionIcon, Button, Avatar, Textarea, Box, Collapse, Title, Tabs, Grid, ScrollArea, Loader, Center, Checkbox } from '@mantine/core';
import { MessageSquare, Check, Send, ChevronDown, ChevronUp, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, FileSearch, Pencil, Trash2, ArrowLeft, FileText, ClipboardCheck, Lock } from 'lucide-react';
import { FieldRender } from './field-render';

// === CHAT PANEL ===
function ChatSubmitButton() {
  const { pending } = useFormStatus();
  return <ActionIcon type="submit" size="lg" loading={pending}><Send size={18} /></ActionIcon>;
}

export function ChatPanel({ entityType, entityId, messages = [], user, sendAction }) {
  const [isTeamOnly, setIsTeamOnly] = useState(false);
  const formatTime = (ts) => ts ? new Date(ts * 1000).toLocaleString() : '';

  return (
    <Paper p="md" withBorder>
      <Title order={4} mb="md">Chat</Title>
      <Stack h={400}>
        <ScrollArea flex={1}>
          {messages.length === 0 ? (
            <Text ta="center" c="dimmed" py="xl">No messages yet. Start the conversation!</Text>
          ) : (
            <Stack gap="md">
              {messages.map((msg) => (
                <Group key={msg.id} gap="sm" align="flex-start" style={{ flexDirection: msg.created_by === user?.id ? 'row-reverse' : 'row' }}>
                  <Avatar src={msg.created_by_display?.avatar} size="sm" radius="xl">{msg.created_by_display?.name?.[0] || '?'}</Avatar>
                  <Box maw="70%">
                    <Group gap="xs" mb={4} style={{ justifyContent: msg.created_by === user?.id ? 'flex-end' : 'flex-start' }}>
                      <Text size="xs" c="dimmed">{msg.created_by_display?.name || 'Unknown'}</Text>
                      <Text size="xs" c="dimmed">{formatTime(msg.created_at)}</Text>
                      {msg.is_team_only && <Group gap={4}><Lock size={12} color="orange" /><Text size="xs" c="orange">Team only</Text></Group>}
                    </Group>
                    <Paper p="sm" bg={msg.created_by === user?.id ? 'blue' : 'gray.1'} c={msg.created_by === user?.id ? 'white' : undefined} radius="md">
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Text>
                    </Paper>
                  </Box>
                </Group>
              ))}
            </Stack>
          )}
        </ScrollArea>
        <form action={sendAction}>
          <input type="hidden" name="entity_type" value={entityType} />
          <input type="hidden" name="entity_id" value={entityId} />
          <input type="hidden" name="is_team_only" value={isTeamOnly ? 'true' : 'false'} />
          <Group align="flex-end">
            <Textarea name="content" placeholder="Type your message..." style={{ flex: 1 }} rows={2} />
            <ChatSubmitButton />
          </Group>
          {user?.type === 'auditor' && <Checkbox label="Team members only" checked={isTeamOnly} onChange={(e) => setIsTeamOnly(e.currentTarget.checked)} mt="xs" />}
        </form>
      </Stack>
    </Paper>
  );
}

// === PDF VIEWER ===
export function PDFViewer({ fileUrl, highlights = [], onHighlight, selectedHighlight, onSelectHighlight }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => { const timer = setTimeout(() => { setLoading(false); setTotalPages(10); }, 500); return () => clearTimeout(timer); }, [fileUrl]);

  const handleMouseDown = (e) => {
    if (!onHighlight) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setIsSelecting(true);
    setSelectionStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseUp = (e) => {
    if (!isSelecting || !selectionStart || !onHighlight) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const endX = e.clientX - rect.left, endY = e.clientY - rect.top;
    const position = { x: Math.min(selectionStart.x, endX) / rect.width, y: Math.min(selectionStart.y, endY) / rect.height, width: Math.abs(endX - selectionStart.x) / rect.width, height: Math.abs(endY - selectionStart.y) / rect.height };
    if (position.width > 0.01 && position.height > 0.01) onHighlight({ page_number: currentPage, position, type: 'area' });
    setIsSelecting(false);
    setSelectionStart(null);
  };

  const pageHighlights = highlights.filter((h) => h.page_number === currentPage);

  return (
    <Paper withBorder h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      <Group p="xs" justify="space-between" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Group gap="xs">
          <ActionIcon variant="subtle" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage <= 1}><ChevronLeft size={18} /></ActionIcon>
          <Text size="sm">Page {currentPage} of {totalPages}</Text>
          <ActionIcon variant="subtle" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage >= totalPages}><ChevronRight size={18} /></ActionIcon>
        </Group>
        <Group gap="xs">
          <ActionIcon variant="subtle" onClick={() => setScale(s => Math.max(s - 0.25, 0.5))}><ZoomOut size={18} /></ActionIcon>
          <Text size="sm" w={50} ta="center">{Math.round(scale * 100)}%</Text>
          <ActionIcon variant="subtle" onClick={() => setScale(s => Math.min(s + 0.25, 3))}><ZoomIn size={18} /></ActionIcon>
        </Group>
        {onHighlight && <Button variant="outline" size="xs" leftSection={<MessageSquare size={14} />}>Add Query</Button>}
      </Group>
      <Box flex={1} p="md" bg="gray.1" style={{ overflow: 'auto' }}>
        {loading ? <Center h="100%"><Loader /></Center> : fileUrl ? (
          <Box ref={containerRef} mx="auto" bg="white" style={{ width: `${612 * scale}px`, height: `${792 * scale}px`, position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: onHighlight ? 'crosshair' : 'default' }} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
            <Center h="100%"><Text c="dimmed">PDF Page {currentPage}<br /><Text size="sm">{fileUrl}</Text></Text></Center>
            {pageHighlights.map((h) => h.position && (
              <Box key={h.id} style={{ position: 'absolute', left: `${h.position.x * 100}%`, top: `${h.position.y * 100}%`, width: `${h.position.width * 100}%`, height: `${h.position.height * 100}%`, border: `2px solid ${selectedHighlight === h.id ? 'var(--mantine-color-blue-6)' : h.resolved ? 'var(--mantine-color-green-6)' : 'var(--mantine-color-yellow-6)'}`, background: selectedHighlight === h.id ? 'rgba(0,100,255,0.2)' : h.resolved ? 'rgba(0,200,0,0.1)' : 'rgba(255,200,0,0.2)', cursor: 'pointer' }} onClick={() => onSelectHighlight?.(h.id)} />
            ))}
          </Box>
        ) : <Center h="100%"><Text c="dimmed">No PDF file loaded</Text></Center>}
      </Box>
    </Paper>
  );
}

// === HIGHLIGHT LAYER ===
export function HighlightLayer({ highlights = [], selectedId, onSelect, onResolve, onAddResponse, user, canResolve = false }) {
  const [expandedId, setExpandedId] = useState(null);
  const [newResponse, setNewResponse] = useState('');
  const formatTime = (ts) => ts ? new Date(ts * 1000).toLocaleDateString() : '';

  const handleSubmitResponse = (highlightId) => { if (!newResponse.trim()) return; onAddResponse?.(highlightId, newResponse); setNewResponse(''); };

  return (
    <Stack gap="xs">
      {highlights.length === 0 ? (
        <Paper p="xl" withBorder>
          <Stack align="center" c="dimmed"><MessageSquare size={32} opacity={0.5} /><Text>No queries yet</Text><Text size="sm">Select an area on the PDF to add a query</Text></Stack>
        </Paper>
      ) : highlights.map((h) => (
        <Paper key={h.id} p="sm" withBorder style={{ cursor: 'pointer', outline: selectedId === h.id ? '2px solid var(--mantine-color-blue-6)' : 'none' }} onClick={() => onSelect?.(h.id)}>
          <Group justify="space-between" align="flex-start">
            <Box flex={1}>
              <Group gap="xs" mb={4}><Badge size="sm">Page {h.page_number}</Badge><Badge size="sm" color={h.resolved ? 'green' : 'yellow'}>{h.resolved ? 'Resolved' : 'Open'}</Badge></Group>
              <Text size="sm" lineClamp={2}>{h.comment || h.content || 'No comment'}</Text>
            </Box>
            <ActionIcon variant="subtle" onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === h.id ? null : h.id); }}>{expandedId === h.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</ActionIcon>
          </Group>
          <Collapse in={expandedId === h.id}>
            <Box mt="sm" onClick={(e) => e.stopPropagation()}>
              <Group gap="xs" mb="xs"><Avatar size="xs">{h.created_by_display?.[0] || '?'}</Avatar><Text size="xs" c="dimmed">{h.created_by_display || 'Unknown'} • {formatTime(h.created_at)}</Text></Group>
              {h.content && <Paper p="xs" bg="gray.1" mb="sm"><Text size="sm" fs="italic">"{h.content}"</Text></Paper>}
              {h.responses?.length > 0 && <Stack gap="xs" mb="sm"><Text size="xs" fw={500} c="dimmed">Responses</Text>{h.responses.map((r) => <Paper key={r.id} p="xs" bg="gray.0"><Text size="sm">{r.content}</Text><Text size="xs" c="dimmed">{r.created_by_display} • {formatTime(r.created_at)}</Text></Paper>)}</Stack>}
              <Group gap="xs" mb="xs"><Textarea value={newResponse} onChange={(e) => setNewResponse(e.target.value)} placeholder="Add a response..." style={{ flex: 1 }} rows={2} /><ActionIcon onClick={() => handleSubmitResponse(h.id)} disabled={!newResponse.trim()}><Send size={16} /></ActionIcon></Group>
              {canResolve && !h.resolved && <Button variant="outline" size="xs" fullWidth leftSection={<Check size={14} />} onClick={() => onResolve?.(h.id)}>Mark as Resolved</Button>}
            </Box>
          </Collapse>
        </Paper>
      ))}
    </Stack>
  );
}

// === REVIEW DETAIL ===
export function ReviewDetail({ spec, data, children = {}, user, canEdit = false, canDelete = false, deleteAction }) {
  const router = useRouter();
  const [selectedHighlight, setSelectedHighlight] = useState(null);
  const highlights = children.highlights || [], checklists = children.checklists || [], chatMessages = children.chat || [];
  const unresolvedCount = highlights.filter((h) => !h.resolved).length;

  const handleHighlight = async (d) => console.log('New highlight:', d);
  const handleResolve = async (id) => console.log('Resolve:', id);
  const handleAddResponse = async (id, content) => console.log('Response:', id, content);

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
                    <Box><Text size="sm" c="dimmed">Financial Year</Text><Text fw={500}>{data.financial_year || '—'}</Text></Box>
                    <Box><Text size="sm" c="dimmed">Team</Text><Text fw={500}>{data.team_id_display || '—'}</Text></Box>
                    <Box><Text size="sm" c="dimmed">Deadline</Text><Text fw={500}><FieldRender spec={spec} field={{ type: 'date' }} value={data.deadline} row={data} /></Text></Box>
                    <Box><Text size="sm" c="dimmed">WIP Value</Text><Text fw={500}>{data.wip_value ? `$${data.wip_value.toFixed(2)}` : '—'}</Text></Box>
                    <Box><Text size="sm" c="dimmed">Private</Text><Text fw={500}>{data.is_private ? 'Yes' : 'No'}</Text></Box>
                  </Stack>
                </Paper>
              </Tabs.Panel>
              <Tabs.Panel value="checklists">
                <Paper p="md" withBorder>
                  {checklists.length === 0 ? <Text c="dimmed" ta="center" py="md">No checklists assigned</Text> : (
                    <Stack gap="xs">{checklists.map((c) => <Paper key={c.id} p="xs" withBorder><Group justify="space-between"><Text size="sm">{c.checklist_id_display || 'Checklist'}</Text><Badge size="sm" color={c.status === 'completed' ? 'green' : c.status === 'in_progress' ? 'blue' : 'yellow'}>{c.status}</Badge></Group></Paper>)}</Stack>
                  )}
                </Paper>
              </Tabs.Panel>
              <Tabs.Panel value="chat"><ChatPanel entityType="review" entityId={data.id} messages={chatMessages} user={user} /></Tabs.Panel>
            </ScrollArea>
          </Tabs>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

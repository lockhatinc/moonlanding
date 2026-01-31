'use client';

import { useState, useEffect } from 'react';
import { Paper, Group, Button, Text, Table, Modal, TextInput, Textarea, Select, Badge, ActionIcon, Stack } from '@mantine/core';
import { Trash2, Edit, Plus } from 'lucide-react';

export function TemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opened, setOpened] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: 'standard', content: '', description: '' });

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      setLoading(true);
      const res = await fetch('/api/mwr/review_template');
      const data = await res.json();
      setTemplates(data.data || []);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  }

  async function saveTemplate() {
    if (!formData.name || !formData.content) {
      alert('Name and content are required');
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/mwr/review_template/${editingId}` : '/api/mwr/review_template';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setOpened(false);
        setFormData({ name: '', type: 'standard', content: '', description: '' });
        setEditingId(null);
        await loadTemplates();
      } else {
        alert('Failed to save template');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Error saving template');
    }
  }

  async function deleteTemplate(id) {
    if (!confirm('Delete this template?')) return;
    try {
      const res = await fetch(`/api/mwr/review_template/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadTemplates();
      } else {
        alert('Failed to delete template');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  }

  function openEdit(template) {
    setEditingId(template.id);
    setFormData({ name: template.name, type: template.type, content: template.content, description: template.description });
    setOpened(true);
  }

  function openCreate() {
    setEditingId(null);
    setFormData({ name: '', type: 'standard', content: '', description: '' });
    setOpened(true);
  }

  const rows = templates.map(template => (
    <Table.Tr key={template.id}>
      <Table.Td>{template.name}</Table.Td>
      <Table.Td><Badge>{template.type}</Badge></Table.Td>
      <Table.Td>{template.description || '-'}</Table.Td>
      <Table.Td>
        <Group gap={8}>
          <ActionIcon variant="subtle" onClick={() => openEdit(template)} aria-label="Edit template">
            <Edit size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" onClick={() => deleteTemplate(template.id)} aria-label="Delete template">
            <Trash2 size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Paper withBorder p="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Text fw={500} size="lg">Review Templates</Text>
          <Button leftSection={<Plus size={16} />} onClick={openCreate}>New Template</Button>
        </Group>

        {loading ? (
          <Text c="dimmed">Loading templates...</Text>
        ) : templates.length === 0 ? (
          <Text c="dimmed" ta="center">No templates yet</Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        )}

        <Modal opened={opened} onClose={() => setOpened(false)} title={editingId ? 'Edit Template' : 'New Template'} size="lg">
          <Stack gap="md">
            <TextInput label="Template Name" placeholder="e.g., Financial Review" value={formData.name} onChange={e => setFormData({...formData, name: e.currentTarget.value})} />
            <TextInput label="Description" placeholder="Optional description" value={formData.description} onChange={e => setFormData({...formData, description: e.currentTarget.value})} />
            <Select label="Template Type" data={[{value: 'standard', label: 'Standard'}, {value: 'complex', label: 'Complex'}, {value: 'financial', label: 'Financial'}, {value: 'compliance', label: 'Compliance'}]} value={formData.type} onChange={v => setFormData({...formData, type: v})} />
            <Textarea label="Template Content" placeholder="Enter template content..." value={formData.content} onChange={e => setFormData({...formData, content: e.currentTarget.value})} minRows={8} />
            <Group justify="flex-end">
              <Button variant="subtle" onClick={() => setOpened(false)}>Cancel</Button>
              <Button onClick={saveTemplate}>{editingId ? 'Update' : 'Create'}</Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Paper>
  );
}

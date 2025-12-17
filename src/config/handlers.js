import { getUser } from '@/engine.server';
import { list, create as createRecord, update as updateRecord, remove as deleteRecord } from '@/lib/query-engine';

export const HandlerRegistry = {
  navigation: {
    goToDetail: (entity, id) => `/${entity}/${id}`,
    goToEdit: (entity, id) => `/${entity}/${id}/edit`,
    goToCreate: (entity) => `/${entity}/new`,
  },

  validation: {
    required: (value) => value?.toString().trim() !== '',
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    url: (value) => /^https?:\/\/.+/.test(value),
    positive: (value) => Number(value) > 0,
    date: (value) => !isNaN(Date.parse(value)),
  },

  form: {
    submitForm: async (spec, data) => {
      const user = await getUser();
      if (!data.id) {
        return createRecord(spec.name, data, user);
      }
      updateRecord(spec.name, data.id, data, user);
      return data;
    },

    validateRequired: (value) => value?.trim() !== '',
  },

  list: {
    selectRow: (row, selected, setSelected) => {
      const isSelected = selected.includes(row.id);
      if (isSelected) {
        setSelected(selected.filter(id => id !== row.id));
      } else {
        setSelected([...selected, row.id]);
      }
    },

    deleteSelected: async (spec, selected) => {
      const promises = selected.map(id => deleteRecord(spec.name, id));
      return Promise.all(promises);
    },

    exportSelected: async (spec, selected, data) => {
      const selected_data = data.filter(row => selected.includes(row.id));
      const csv = [
        Object.keys(selected_data[0]).join(','),
        ...selected_data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${spec.name}-export.csv`;
      a.click();
    },
  },

  email: {
    sendEmail: async (request) => {
      const { to, subject, body, template, data } = await request.json();
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, body, template, data }),
      });
      return response.json();
    },

    sendBulk: async (emails) => {
      const response = await fetch('/api/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      });
      return response.json();
    },
  },

  file: {
    upload: async (file, entityType, entityId, folderId) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entity_type', entityType);
      formData.append('entity_id', entityId);
      if (folderId) formData.append('folder_id', folderId);

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });
      return response.json();
    },

    delete: async (fileId) => {
      const response = await fetch(`/api/files?id=${fileId}`, {
        method: 'DELETE',
      });
      return response.json();
    },
  },

  api: {
    createRecord: async (spec, data) => {
      const response = await fetch(`/api/${spec.name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },

    updateRecord: async (spec, id, data) => {
      const response = await fetch(`/api/${spec.name}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },

    deleteRecord: async (spec, id) => {
      const response = await fetch(`/api/${spec.name}/${id}`, {
        method: 'DELETE',
      });
      return response.json();
    },
  },
};

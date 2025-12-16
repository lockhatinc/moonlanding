import React, { useState, useRef, useEffect } from 'react';
import { Group, ActionIcon, Text } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import { FieldRenderer } from './unified-field-renderer';

export function InlineEditor({
  field,
  initialValue,
  onSave,
  onCancel,
  spec,
  error,
  disabled = false,
}) {
  const [value, setValue] = useState(initialValue);
  const [localError, setLocalError] = useState(error);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current?.focus) {
      inputRef.current.focus();
    }
  }, []);

  const handleSave = async () => {
    if (saving) return;

    setSaving(true);
    try {
      await onSave(value);
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(initialValue);
    onCancel?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <Group spacing="xs" align="flex-end">
        <div style={{ flex: 1 }}>
          <FieldRenderer
            ref={inputRef}
            field={field}
            value={value}
            mode="edit"
            onChange={setValue}
            error={localError}
            disabled={disabled || saving}
            spec={spec}
            onKeyDown={handleKeyDown}
          />
        </div>

        <ActionIcon
          color="green"
          onClick={handleSave}
          loading={saving}
          disabled={disabled || saving}
          size="lg"
          variant="light"
        >
          <IconCheck size={16} />
        </ActionIcon>

        <ActionIcon
          color="red"
          onClick={handleCancel}
          disabled={disabled || saving}
          size="lg"
          variant="light"
        >
          <IconX size={16} />
        </ActionIcon>
      </Group>

      {localError && (
        <Text size="xs" color="red" mt={4}>
          {localError}
        </Text>
      )}
    </div>
  );
}

export function useInlineEditor(initialValue, onSave) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setValue(initialValue);
    setError(null);
  };

  const saveEdit = async (newValue) => {
    setSaving(true);
    try {
      await onSave(newValue);
      setValue(newValue);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    isEditing,
    value,
    error,
    saving,
    startEdit,
    cancelEdit,
    saveEdit,
    setValue,
  };
}

export function EditableFieldCell({
  field,
  value,
  spec,
  onSave,
  disabled = false,
}) {
  const editor = useInlineEditor(value, onSave);

  if (!editor.isEditing) {
    return (
      <div
        onClick={() => !disabled && editor.startEdit()}
        style={{
          cursor: disabled ? 'default' : 'pointer',
          padding: '4px 8px',
          borderRadius: '4px',
          backgroundColor: disabled ? 'transparent' : '#f9f9f9',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) =>
          !disabled && (e.currentTarget.style.backgroundColor = '#f0f0f0')
        }
        onMouseLeave={(e) =>
          !disabled && (e.currentTarget.style.backgroundColor = '#f9f9f9')
        }
      >
        <Text size="sm">{value || '-'}</Text>
      </div>
    );
  }

  return (
    <InlineEditor
      field={field}
      initialValue={editor.value}
      onSave={editor.saveEdit}
      onCancel={editor.cancelEdit}
      spec={spec}
      error={editor.error}
      disabled={editor.saving || disabled}
    />
  );
}

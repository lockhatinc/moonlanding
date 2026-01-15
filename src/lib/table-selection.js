'use client';

import React, { useState, useCallback } from 'react';
import { Checkbox, Group } from '@mantine/core';

/**
 * Hook for managing row selection in tables
 */
export function useRowSelection(items = []) {
  const [selectedIds, setSelectedIds] = useState(new Set());

  const isSelected = useCallback((id) => selectedIds.has(id), [selectedIds]);

  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const allIds = new Set(items.map(item => item.id));
    setSelectedIds(allIds);
  }, [items]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      deselectAll();
    } else {
      selectAll();
    }
  }, [selectedIds.size, items.length, selectAll, deselectAll]);

  const isAllSelected = selectedIds.size === items.length && items.length > 0;
  const isPartiallySelected = selectedIds.size > 0 && selectedIds.size < items.length;

  return {
    selectedIds: Array.from(selectedIds),
    isSelected,
    toggleSelect,
    selectAll,
    deselectAll,
    toggleAll,
    isAllSelected,
    isPartiallySelected,
    hasSelection: selectedIds.size > 0,
    selectionCount: selectedIds.size,
    clearSelection: deselectAll,
  };
}

/**
 * Checkbox for row selection in tables
 */
export function RowSelectCheckbox({ checked, indeterminate = false, onChange, ...props }) {
  return (
    <Checkbox
      checked={checked}
      indeterminate={indeterminate}
      onChange={(e) => onChange(e.currentTarget.checked)}
      aria-label="Select this row"
      {...props}
    />
  );
}

/**
 * Header checkbox for selecting all rows
 */
export function SelectAllCheckbox({ checked, indeterminate = false, onChange, disabled = false, ...props }) {
  return (
    <Checkbox
      checked={checked}
      indeterminate={indeterminate}
      onChange={(e) => onChange(e.currentTarget.checked)}
      aria-label={indeterminate ? 'Partially select all rows' : checked ? 'Deselect all rows' : 'Select all rows'}
      disabled={disabled}
      {...props}
    />
  );
}

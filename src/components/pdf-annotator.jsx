'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { Paper, Group, Text, Button, Stack, Box, Badge, Checkbox, Select, Tooltip } from '@mantine/core';
import { UI_ICONS } from '@/config/icon-config';

const HIGHLIGHT_COLORS = [
  { value: 'yellow', label: 'Yellow', color: '#FFC107' },
  { value: 'orange', label: 'Orange', color: '#FF9800' },
  { value: 'pink', label: 'Pink', color: '#E91E63' },
  { value: 'green', label: 'Green', color: '#4CAF50' },
  { value: 'blue', label: 'Blue', color: '#2196F3' }
];

const CATEGORIES = [
  { value: 'important', label: 'Important' },
  { value: 'question', label: 'Question' },
  { value: 'issue', label: 'Issue' }
];

export function PDFAnnotator({ fileUrl, pageNumber, onHighlightCreate, disabled = false }) {
  const [selectedText, setSelectedText] = useState('');
  const [selectedColor, setSelectedColor] = useState('yellow');
  const [selectedCategory, setSelectedCategory] = useState('important');
  const [isAreaMode, setIsAreaMode] = useState(false);
  const [areaStart, setAreaStart] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const containerRef = useRef(null);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    if (text) {
      setSelectedText(text);
    }
  }, []);

  const handleAreaStart = useCallback((e) => {
    if (!isAreaMode) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setAreaStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      containerWidth: rect.width,
      containerHeight: rect.height
    });
  }, [isAreaMode]);

  const handleCreateHighlight = useCallback(async () => {
    if (!selectedText && !isAreaMode) {
      alert('Please select text or activate area mode');
      return;
    }

    setIsCreating(true);
    try {
      const highlightData = {
        page_number: pageNumber,
        text: selectedText || null,
        color: selectedColor,
        category: selectedCategory,
        position: isAreaMode && areaStart ? {
          x: areaStart.x / areaStart.containerWidth,
          y: areaStart.y / areaStart.containerHeight,
          width: 0.2,
          height: 0.1
        } : null,
        type: isAreaMode ? 'area' : 'text'
      };

      await onHighlightCreate(highlightData);
      
      setSelectedText('');
      setAreaStart(null);
      setIsAreaMode(false);
    } finally {
      setIsCreating(false);
    }
  }, [selectedText, selectedColor, selectedCategory, isAreaMode, areaStart, pageNumber, onHighlightCreate]);

  const selectedColorObj = useMemo(
    () => HIGHLIGHT_COLORS.find(c => c.value === selectedColor),
    [selectedColor]
  );

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Text fw={500} size="sm">Annotation Tools</Text>
          <Tooltip label={isAreaMode ? 'Click and drag on PDF to highlight area' : 'Select text on PDF'}>
            <Checkbox
              label="Area Mode"
              checked={isAreaMode}
              onChange={(e) => setIsAreaMode(e.currentTarget.checked)}
              disabled={disabled}
            />
          </Tooltip>
        </Group>

        {selectedText && (
          <Box p="sm" bg="gray.1" style={{ borderLeft: '4px solid var(--mantine-color-blue-6)' }}>
            <Text size="sm" fw={500}>Selected Text:</Text>
            <Text size="sm" c="dimmed">{selectedText.substring(0, 100)}...</Text>
          </Box>
        )}

        <Group grow>
          <Select
            label="Color"
            placeholder="Choose color"
            value={selectedColor}
            onChange={(val) => setSelectedColor(val)}
            data={HIGHLIGHT_COLORS.map(c => ({ value: c.value, label: c.label }))}
            disabled={disabled}
            icon={
              selectedColorObj && (
                <Box
                  w={12}
                  h={12}
                  style={{
                    backgroundColor: selectedColorObj.color,
                    borderRadius: '2px'
                  }}
                />
              )
            }
          />
          <Select
            label="Category"
            placeholder="Choose category"
            value={selectedCategory}
            onChange={(val) => setSelectedCategory(val)}
            data={CATEGORIES}
            disabled={disabled}
          />
        </Group>

        <Group>
          <Button
            variant="filled"
            size="sm"
            onClick={handleCreateHighlight}
            disabled={disabled || (!selectedText && !isAreaMode) || isCreating}
            loading={isCreating}
            leftSection={<UI_ICONS.messageSquare size={14} />}
          >
            Create Highlight
          </Button>
          {selectedText && (
            <Button
              variant="subtle"
              size="sm"
              onClick={() => setSelectedText('')}
              disabled={disabled}
            >
              Clear
            </Button>
          )}
        </Group>

        <Text size="xs" c="dimmed">
          {isAreaMode 
            ? 'Click and drag on the PDF to highlight an area, then click "Create Highlight"'
            : 'Select text on the PDF, choose a color and category, then click "Create Highlight"'}
        </Text>
      </Stack>
    </Paper>
  );
}

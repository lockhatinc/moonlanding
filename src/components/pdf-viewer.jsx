'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Paper, Group, Text, ActionIcon, Box, Button, Center, Loader } from '@mantine/core';
import { UI_ICONS, NAVIGATION_ICONS } from '@/config/icon-config';
import { LAYOUT } from '@/config';
import { useToggle } from '@/lib/hooks/use-toggle';

function getHighlightStyle(highlight, isSelected) {
  const resolvedColor = isSelected ? 'var(--mantine-color-blue-6)' : highlight.resolved ? 'var(--mantine-color-green-6)' : 'var(--mantine-color-yellow-6)';
  const bgColor = isSelected ? 'rgba(0,100,255,0.2)' : highlight.resolved ? 'rgba(0,200,0,0.1)' : 'rgba(255,200,0,0.2)';
  return { borderColor: resolvedColor, bgColor };
}

function HighlightBox({ highlight, isSelected, onSelect }) {
  const { borderColor, bgColor } = useMemo(() => getHighlightStyle(highlight, isSelected), [highlight, isSelected]);
  return (
    <Box
      key={highlight.id}
      style={{
        position: 'absolute',
        left: `${highlight.position.x * 100}%`,
        top: `${highlight.position.y * 100}%`,
        width: `${highlight.position.width * 100}%`,
        height: `${highlight.position.height * 100}%`,
        border: `2px solid ${borderColor}`,
        background: bgColor,
        cursor: 'pointer',
      }}
      onClick={() => onSelect(highlight.id)}
      role="button"
      aria-label={`Highlight: ${highlight.text || 'Area highlight'}`}
      aria-pressed={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(highlight.id);
        }
      }}
    />
  );
}

export function PDFViewer({ fileUrl, highlights = [], onHighlight, selectedHighlight, onSelectHighlight }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSelecting, { setTrue: startSelecting, setFalse: stopSelecting }] = useToggle(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      setTotalPages(10);
    }, 500);
    return () => clearTimeout(timer);
  }, [fileUrl]);

  const handleMouseDown = (e) => {
    if (!onHighlight) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    startSelecting();
    setSelectionStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseUp = (e) => {
    if (!isSelecting || !selectionStart || !onHighlight) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    const position = {
      x: Math.min(selectionStart.x, endX) / rect.width,
      y: Math.min(selectionStart.y, endY) / rect.height,
      width: Math.abs(endX - selectionStart.x) / rect.width,
      height: Math.abs(endY - selectionStart.y) / rect.height,
    };
    if (position.width > 0.01 && position.height > 0.01) {
      onHighlight({ page_number: currentPage, position, type: 'area' });
    }
    stopSelecting();
    setSelectionStart(null);
  };

  const pageHighlights = highlights.filter((h) => h.page_number === currentPage);

  return (
    <Paper withBorder h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      <Group p="xs" justify="space-between" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Group gap="xs">
          <ActionIcon variant="subtle" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage <= 1} aria-label="Previous page" tabIndex={0} onKeyDown={(e) => { if (e.key === 'ArrowLeft') { e.preventDefault(); setCurrentPage(p => Math.max(p - 1, 1)); } }}>
            <NAVIGATION_ICONS.chevronLeft size={18} aria-hidden="true" />
          </ActionIcon>
          <Text size="sm" role="status" aria-live="polite">Page {currentPage} of {totalPages}</Text>
          <ActionIcon variant="subtle" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage >= totalPages} aria-label="Next page" tabIndex={0} onKeyDown={(e) => { if (e.key === 'ArrowRight') { e.preventDefault(); setCurrentPage(p => Math.min(p + 1, totalPages)); } }}>
            <NAVIGATION_ICONS.chevronRight size={18} aria-hidden="true" />
          </ActionIcon>
        </Group>
        <Group gap="xs">
          <ActionIcon variant="subtle" onClick={() => setScale(s => Math.max(s - 0.25, 0.5))} aria-label="Zoom out" aria-valuemin={0.5} aria-valuemax={3} aria-valuenow={scale}>
            <UI_ICONS.zoomOut size={18} aria-hidden="true" />
          </ActionIcon>
          <Text size="sm" w={50} ta="center" role="status" aria-live="polite">{Math.round(scale * 100)}%</Text>
          <ActionIcon variant="subtle" onClick={() => setScale(s => Math.min(s + 0.25, 3))} aria-label="Zoom in" aria-valuemin={0.5} aria-valuemax={3} aria-valuenow={scale}>
            <UI_ICONS.zoomIn size={18} aria-hidden="true" />
          </ActionIcon>
        </Group>
        {onHighlight && <Button variant="outline" size="xs" leftSection={<UI_ICONS.messageSquare size={14} aria-hidden="true" />} aria-label="Add query to PDF">Add Query</Button>}
      </Group>
      <Box flex={1} p="md" bg="gray.1" style={{ overflow: 'auto' }}>
        {loading ? (
          <Center h="100%" role="status" aria-label="Loading PDF" aria-live="polite"><Loader /></Center>
        ) : fileUrl ? (
          <Box
            ref={containerRef}
            mx="auto"
            bg="white"
            style={{
              width: `${LAYOUT.pdfPageWidth * scale}px`,
              height: `${LAYOUT.pdfPageHeight * scale}px`,
              position: 'relative',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              cursor: onHighlight ? 'crosshair' : 'default',
            }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            role="img"
            aria-label={`PDF page ${currentPage} of ${totalPages}`}
            tabIndex={0}
          >
            <Center h="100%">
              <Text c="dimmed">
                PDF Page {currentPage}
                <br />
                <Text size="sm">{fileUrl}</Text>
              </Text>
            </Center>
            {pageHighlights.map((h) => h.position && (
              <HighlightBox key={h.id} highlight={h} isSelected={selectedHighlight === h.id} onSelect={onSelectHighlight} />
            ))}
          </Box>
        ) : (
          <Center h="100%"><Text c="dimmed">No PDF file loaded</Text></Center>
        )}
      </Box>
    </Paper>
  );
}

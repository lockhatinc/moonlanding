'use client';

import { useState, useRef, useEffect } from 'react';
import { Paper, Group, ActionIcon, Text, Button, Loader, Center, Box } from '@mantine/core';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';

export function PDFViewer({ fileUrl, highlights = [], onHighlight, selectedHighlight, onSelectHighlight }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => { setLoading(false); setTotalPages(10); }, 500);
    return () => clearTimeout(timer);
  }, [fileUrl]);

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const handlePrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

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
    setIsSelecting(false);
    setSelectionStart(null);
  };

  const pageHighlights = highlights.filter((h) => h.page_number === currentPage);

  return (
    <Paper withBorder h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      <Group p="xs" justify="space-between" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Group gap="xs">
          <ActionIcon variant="subtle" onClick={handlePrevPage} disabled={currentPage <= 1}><ChevronLeft size={18} /></ActionIcon>
          <Text size="sm">Page {currentPage} of {totalPages}</Text>
          <ActionIcon variant="subtle" onClick={handleNextPage} disabled={currentPage >= totalPages}><ChevronRight size={18} /></ActionIcon>
        </Group>
        <Group gap="xs">
          <ActionIcon variant="subtle" onClick={handleZoomOut}><ZoomOut size={18} /></ActionIcon>
          <Text size="sm" w={50} ta="center">{Math.round(scale * 100)}%</Text>
          <ActionIcon variant="subtle" onClick={handleZoomIn}><ZoomIn size={18} /></ActionIcon>
        </Group>
        {onHighlight && <Button variant="outline" size="xs" leftSection={<MessageSquare size={14} />}>Add Query</Button>}
      </Group>

      <Box flex={1} p="md" bg="gray.1" style={{ overflow: 'auto' }}>
        {loading ? (
          <Center h="100%"><Loader /></Center>
        ) : fileUrl ? (
          <Box
            ref={containerRef}
            mx="auto"
            bg="white"
            style={{ width: `${612 * scale}px`, height: `${792 * scale}px`, position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: onHighlight ? 'crosshair' : 'default' }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
          >
            <Center h="100%"><Text c="dimmed">PDF Page {currentPage}<br /><Text size="sm">{fileUrl}</Text></Text></Center>
            {pageHighlights.map((highlight) => {
              const pos = highlight.position;
              if (!pos) return null;
              return (
                <Box
                  key={highlight.id}
                  style={{
                    position: 'absolute',
                    left: `${pos.x * 100}%`,
                    top: `${pos.y * 100}%`,
                    width: `${pos.width * 100}%`,
                    height: `${pos.height * 100}%`,
                    border: `2px solid ${selectedHighlight === highlight.id ? 'var(--mantine-color-blue-6)' : highlight.resolved ? 'var(--mantine-color-green-6)' : 'var(--mantine-color-yellow-6)'}`,
                    background: selectedHighlight === highlight.id ? 'rgba(0,100,255,0.2)' : highlight.resolved ? 'rgba(0,200,0,0.1)' : 'rgba(255,200,0,0.2)',
                    cursor: 'pointer',
                  }}
                  onClick={() => onSelectHighlight?.(highlight.id)}
                />
              );
            })}
          </Box>
        ) : (
          <Center h="100%"><Text c="dimmed">No PDF file loaded</Text></Center>
        )}
      </Box>
    </Paper>
  );
}

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Paper, Group, Text, ActionIcon, Box, Button, Center, Loader } from '@mantine/core';
import { UI_ICONS, NAVIGATION_ICONS } from '@/config/icon-config';
import { LAYOUT } from '@/config';
import { useToggle } from '@/lib/hooks/use-toggle';

const HIGHLIGHT_COLOR_MAP = {
  yellow: 'rgba(255, 193, 7, 0.3)',
  orange: 'rgba(255, 152, 0, 0.3)',
  pink: 'rgba(233, 30, 99, 0.3)',
  green: 'rgba(76, 175, 80, 0.3)',
  blue: 'rgba(33, 150, 243, 0.3)',
  grey: 'rgba(158, 158, 158, 0.3)'
};

const HIGHLIGHT_BORDER_MAP = {
  yellow: '#FBC02D',
  orange: '#F57C00',
  pink: '#C2185B',
  green: '#388E3C',
  blue: '#1565C0',
  grey: '#616161'
};

function getHighlightStyle(highlight, isSelected) {
  const color = highlight.color || 'grey';
  const borderColor = isSelected ? 'var(--mantine-color-blue-6)' : highlight.status === 'resolved' ? HIGHLIGHT_BORDER_MAP.green : HIGHLIGHT_BORDER_MAP[color] || HIGHLIGHT_BORDER_MAP.grey;
  const bgColor = isSelected ? 'rgba(33, 150, 243, 0.2)' : highlight.status === 'resolved' ? 'rgba(76, 175, 80, 0.1)' : HIGHLIGHT_COLOR_MAP[color] || HIGHLIGHT_COLOR_MAP.grey;
  return { borderColor, bgColor };
}

function HighlightBox({ highlight, isSelected, onSelect, scale }) {
  const { borderColor, bgColor } = useMemo(() => getHighlightStyle(highlight, isSelected), [highlight, isSelected]);
  
  if (!highlight.position) return null;
  
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
        transition: 'all 0.2s ease',
        pointerEvents: 'auto',
      }}
      onClick={() => onSelect(highlight.id)}
      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
      onMouseLeave={(e) => e.currentTarget.style.opacity = isSelected ? '1' : '0.7'}
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

export function PDFViewer({ 
  fileUrl, 
  highlights = [], 
  onHighlight, 
  selectedHighlight, 
  onSelectHighlight,
  onHighlightCreate 
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSelecting, { setTrue: startSelecting, setFalse: stopSelecting }] = useToggle(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const containerRef = useRef(null);
  const pageRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      setTotalPages(10);
    }, 500);
    return () => clearTimeout(timer);
  }, [fileUrl]);

  const recalculateCoordinatesAfterTransform = (x, y) => {
    if (rotation === 0) return { x, y };
    
    const centerX = 0.5;
    const centerY = 0.5;
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    const tx = x - centerX;
    const ty = y - centerY;
    const rx = tx * cos - ty * sin;
    const ry = tx * sin + ty * cos;
    
    return {
      x: rx + centerX,
      y: ry + centerY
    };
  };

  const handleMouseDown = (e) => {
    if (!onHighlight && !onHighlightCreate) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    startSelecting();
    setSelectionStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseUp = (e) => {
    if (!isSelecting || !selectionStart || (!onHighlight && !onHighlightCreate)) return;
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
    
    const recalculated = recalculateCoordinatesAfterTransform(position.x, position.y);
    
    if (position.width > 0.01 && position.height > 0.01) {
      const highlightData = { 
        page_number: currentPage, 
        position: { ...recalculated, width: position.width, height: position.height },
        type: 'area',
        color: 'yellow',
        category: 'important'
      };
      if (onHighlightCreate) {
        onHighlightCreate(highlightData);
      } else if (onHighlight) {
        onHighlight(highlightData);
      }
    }
    stopSelecting();
    setSelectionStart(null);
  };

  const pageHighlights = highlights.filter((h) => h.page_number === currentPage);

  return (
    <Paper withBorder h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      <Group p="xs" justify="space-between" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Group gap="xs">
          <ActionIcon 
            variant="subtle" 
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
            disabled={currentPage <= 1} 
            aria-label="Previous page"
          >
            <NAVIGATION_ICONS.chevronLeft size={18} aria-hidden="true" />
          </ActionIcon>
          <Text size="sm" role="status" aria-live="polite">Page {currentPage} of {totalPages}</Text>
          <ActionIcon 
            variant="subtle" 
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
            disabled={currentPage >= totalPages} 
            aria-label="Next page"
          >
            <NAVIGATION_ICONS.chevronRight size={18} aria-hidden="true" />
          </ActionIcon>
        </Group>
        <Group gap="xs">
          <ActionIcon 
            variant="subtle" 
            onClick={() => setScale(s => Math.max(s - 0.25, 0.5))} 
            aria-label="Zoom out"
          >
            <UI_ICONS.zoomOut size={18} aria-hidden="true" />
          </ActionIcon>
          <Text size="sm" w={50} ta="center" role="status" aria-live="polite">
            {Math.round(scale * 100)}%
          </Text>
          <ActionIcon 
            variant="subtle" 
            onClick={() => setScale(s => Math.min(s + 0.25, 3))} 
            aria-label="Zoom in"
          >
            <UI_ICONS.zoomIn size={18} aria-hidden="true" />
          </ActionIcon>
          <ActionIcon 
            variant="subtle" 
            onClick={() => setRotation(r => (r + 90) % 360)} 
            aria-label="Rotate 90 degrees"
            title="Rotate PDF clockwise"
          >
            <UI_ICONS.refresh size={18} aria-hidden="true" />
          </ActionIcon>
        </Group>
        {(onHighlight || onHighlightCreate) && (
          <Button 
            variant="outline" 
            size="xs" 
            leftSection={<UI_ICONS.messageSquare size={14} aria-hidden="true" />} 
            aria-label="Add highlight to PDF"
          >
            Add Highlight
          </Button>
        )}
      </Group>
      <Box flex={1} p="md" bg="gray.1" style={{ overflow: 'auto' }}>
        {loading ? (
          <Center h="100%" role="status" aria-label="Loading PDF" aria-live="polite">
            <Loader />
          </Center>
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
              cursor: onHighlight || onHighlightCreate ? 'crosshair' : 'default',
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease',
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
              <HighlightBox 
                key={h.id} 
                highlight={h} 
                isSelected={selectedHighlight === h.id} 
                onSelect={onSelectHighlight}
                scale={scale}
              />
            ))}
          </Box>
        ) : (
          <Center h="100%">
            <Text c="dimmed">No PDF file loaded</Text>
          </Center>
        )}
      </Box>
    </Paper>
  );
}

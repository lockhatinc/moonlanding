'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Paper, Group, Text, ActionIcon, Box, Switch, SegmentedControl, Divider, Stack } from '@mantine/core';
import { UI_ICONS, NAVIGATION_ICONS } from '@/config/icon-config';
import { LAYOUT } from '@/config';
import { useToggle } from '@/lib/hooks/use-toggle';
import { Columns, Rows, GripVertical } from 'lucide-react';

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
        pointerEvents: 'auto',
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

function PDFPanel({
  fileUrl,
  title,
  highlights = [],
  currentPage,
  totalPages,
  scale,
  onPageChange,
  onScroll,
  selectedHighlight,
  onSelectHighlight,
  scrollContainerRef,
  syncScrollEnabled,
  onHighlightCreate,
}) {
  const pageHighlights = highlights.filter((h) => h.page_number === currentPage);

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
      <Group p="xs" justify="space-between" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Text size="sm" fw={500}>{title}</Text>
        <Group gap="xs">
          <ActionIcon
            variant="subtle"
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage <= 1}
            aria-label="Previous page"
          >
            <NAVIGATION_ICONS.chevronLeft size={18} aria-hidden="true" />
          </ActionIcon>
          <Text size="sm" role="status" aria-live="polite">
            {currentPage} / {totalPages}
          </Text>
          <ActionIcon
            variant="subtle"
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
          >
            <NAVIGATION_ICONS.chevronRight size={18} aria-hidden="true" />
          </ActionIcon>
        </Group>
      </Group>
      <Box
        ref={scrollContainerRef}
        flex={1}
        p="md"
        bg="gray.1"
        style={{ overflow: 'auto' }}
        onScroll={syncScrollEnabled ? onScroll : undefined}
      >
        <Box
          mx="auto"
          bg="white"
          style={{
            width: `${LAYOUT.pdfPageWidth * scale}px`,
            height: `${LAYOUT.pdfPageHeight * scale}px`,
            position: 'relative',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
          role="img"
          aria-label={`${title} - Page ${currentPage} of ${totalPages}`}
        >
          <Box style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <Text c="dimmed">
              {title}
              <br />
              Page {currentPage}
              <br />
              <Text size="xs">{fileUrl}</Text>
            </Text>
          </Box>
          {pageHighlights.map((h) => h.position && (
            <HighlightBox
              key={h.id}
              highlight={h}
              isSelected={selectedHighlight === h.id}
              onSelect={onSelectHighlight}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export function PDFComparison({
  pdf1Url,
  pdf2Url,
  pdf1Title = 'Document 1',
  pdf2Title = 'Document 2',
  highlights1 = [],
  highlights2 = [],
  onHighlight1,
  onHighlight2,
  onHighlightCreate1,
  onHighlightCreate2,
  selectedHighlight,
  onSelectHighlight,
}) {
  const [page1, setPage1] = useState(1);
  const [page2, setPage2] = useState(1);
  const [totalPages1, setTotalPages1] = useState(10);
  const [totalPages2, setTotalPages2] = useState(10);
  const [scale, setScale] = useState(1);
  const [syncScroll, { toggle: toggleSyncScroll }] = useToggle(true);
  const [viewMode, setViewMode] = useState('vertical');
  const [dividerPosition, setDividerPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const scrollRef1 = useRef(null);
  const scrollRef2 = useRef(null);
  const isScrolling1 = useRef(false);
  const isScrolling2 = useRef(false);
  const dragStartX = useRef(0);
  const dragStartPosition = useRef(50);

  useEffect(() => {
    const savedViewMode = localStorage.getItem('pdf_comparison_view_mode');
    if (savedViewMode) setViewMode(savedViewMode);
    const savedSyncScroll = localStorage.getItem('pdf_comparison_sync_scroll');
    if (savedSyncScroll !== null) {
      if (savedSyncScroll === 'false' && syncScroll) toggleSyncScroll();
      if (savedSyncScroll === 'true' && !syncScroll) toggleSyncScroll();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pdf_comparison_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('pdf_comparison_sync_scroll', String(syncScroll));
  }, [syncScroll]);

  const handleScroll1 = useCallback(() => {
    if (!syncScroll || isScrolling2.current || !scrollRef1.current || !scrollRef2.current) return;

    isScrolling1.current = true;
    const scrollPercentage = scrollRef1.current.scrollTop / (scrollRef1.current.scrollHeight - scrollRef1.current.clientHeight);
    const targetScroll = scrollPercentage * (scrollRef2.current.scrollHeight - scrollRef2.current.clientHeight);
    scrollRef2.current.scrollTop = targetScroll;

    setTimeout(() => {
      isScrolling1.current = false;
    }, 50);
  }, [syncScroll]);

  const handleScroll2 = useCallback(() => {
    if (!syncScroll || isScrolling1.current || !scrollRef1.current || !scrollRef2.current) return;

    isScrolling2.current = true;
    const scrollPercentage = scrollRef2.current.scrollTop / (scrollRef2.current.scrollHeight - scrollRef2.current.clientHeight);
    const targetScroll = scrollPercentage * (scrollRef1.current.scrollHeight - scrollRef1.current.clientHeight);
    scrollRef1.current.scrollTop = targetScroll;

    setTimeout(() => {
      isScrolling2.current = false;
    }, 50);
  }, [syncScroll]);

  const handlePage1Change = useCallback((newPage) => {
    setPage1(newPage);
    if (syncScroll) {
      setPage2(newPage);
    }
  }, [syncScroll]);

  const handlePage2Change = useCallback((newPage) => {
    setPage2(newPage);
    if (syncScroll) {
      setPage1(newPage);
    }
  }, [syncScroll]);

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartPosition.current = dividerPosition;
    e.preventDefault();
  }, [dividerPosition]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;

    const container = e.currentTarget.closest('[data-comparison-container]');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const deltaX = e.clientX - dragStartX.current;
    const deltaPercent = (deltaX / rect.width) * 100;
    const newPosition = Math.max(20, Math.min(80, dragStartPosition.current + deltaPercent));

    setDividerPosition(newPosition);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const containerStyle = useMemo(() => {
    if (viewMode === 'horizontal') {
      return {
        display: 'flex',
        flexDirection: 'row',
        height: '100%',
      };
    }
    return {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    };
  }, [viewMode]);

  const panel1Style = useMemo(() => {
    if (viewMode === 'horizontal') {
      return { width: `${dividerPosition}%`, minWidth: '200px' };
    }
    return { height: `${dividerPosition}%`, minHeight: '200px' };
  }, [viewMode, dividerPosition]);

  const panel2Style = useMemo(() => {
    if (viewMode === 'horizontal') {
      return { width: `${100 - dividerPosition}%`, minWidth: '200px' };
    }
    return { height: `${100 - dividerPosition}%`, minHeight: '200px' };
  }, [viewMode, dividerPosition]);

  const dividerStyle = useMemo(() => {
    const base = {
      background: 'var(--mantine-color-gray-4)',
      cursor: viewMode === 'horizontal' ? 'col-resize' : 'row-resize',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      zIndex: 10,
    };

    if (viewMode === 'horizontal') {
      return { ...base, width: '8px', flexShrink: 0 };
    }
    return { ...base, height: '8px', flexShrink: 0 };
  }, [viewMode]);

  return (
    <Paper withBorder h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      <Stack gap={0}>
        <Group p="xs" justify="space-between" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
          <Group gap="md">
            <Switch
              size="sm"
              label="Sync Scroll"
              checked={syncScroll}
              onChange={toggleSyncScroll}
            />
            <SegmentedControl
              size="xs"
              value={viewMode}
              onChange={setViewMode}
              data={[
                {
                  value: 'vertical',
                  label: (
                    <Group gap={4}>
                      <Rows size={14} />
                      <Text size="xs">Horizontal Split</Text>
                    </Group>
                  )
                },
                {
                  value: 'horizontal',
                  label: (
                    <Group gap={4}>
                      <Columns size={14} />
                      <Text size="xs">Vertical Split</Text>
                    </Group>
                  )
                },
              ]}
            />
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
          </Group>
        </Group>
      </Stack>

      <Box
        flex={1}
        style={containerStyle}
        data-comparison-container
      >
        <Box style={panel1Style}>
          <PDFPanel
            fileUrl={pdf1Url}
            title={pdf1Title}
            highlights={highlights1}
            currentPage={page1}
            totalPages={totalPages1}
            scale={scale}
            onPageChange={handlePage1Change}
            onScroll={handleScroll1}
            selectedHighlight={selectedHighlight}
            onSelectHighlight={onSelectHighlight}
            scrollContainerRef={scrollRef1}
            syncScrollEnabled={syncScroll}
            onHighlightCreate={onHighlightCreate1}
          />
        </Box>

        <Box
          style={dividerStyle}
          onMouseDown={handleMouseDown}
        >
          <GripVertical
            size={16}
            style={{
              color: 'var(--mantine-color-gray-6)',
              transform: viewMode === 'horizontal' ? 'none' : 'rotate(90deg)',
            }}
          />
        </Box>

        <Box style={panel2Style}>
          <PDFPanel
            fileUrl={pdf2Url}
            title={pdf2Title}
            highlights={highlights2}
            currentPage={page2}
            totalPages={totalPages2}
            scale={scale}
            onPageChange={handlePage2Change}
            onScroll={handleScroll2}
            selectedHighlight={selectedHighlight}
            onSelectHighlight={onSelectHighlight}
            scrollContainerRef={scrollRef2}
            syncScrollEnabled={syncScroll}
            onHighlightCreate={onHighlightCreate2}
          />
        </Box>
      </Box>
    </Paper>
  );
}

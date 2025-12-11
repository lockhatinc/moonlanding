'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Paper, Stack, Text, Group, Badge, Textarea, ActionIcon, ScrollArea, Loader, Box } from '@mantine/core';
import { MessageSquare, Check, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Download } from 'lucide-react';

// Highlight colors
const HIGHLIGHT_COLORS = {
  default: '#B0B0B0',
  scrolledTo: '#7F7EFF',
  partner: '#ff4141',
  resolved: '#44BBA4',
};

/**
 * PDF Viewer with highlight/annotation support
 * Uses PDF.js for rendering
 */
export function PdfViewer({
  fileUrl,
  highlights = [],
  onHighlightCreate,
  onHighlightResolve,
  onHighlightClick,
  selectedHighlightId,
  canCreateHighlight = true,
  canResolve = false,
  isPartner = false,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selection, setSelection] = useState(null);
  const [showTip, setShowTip] = useState(false);
  const [tipPosition, setTipPosition] = useState({ x: 0, y: 0 });

  // Load PDF.js dynamically
  useEffect(() => {
    const loadPdfJs = async () => {
      if (typeof window === 'undefined') return;

      // Load pdfjs-dist from CDN
      if (!window.pdfjsLib) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.async = true;
        document.head.appendChild(script);

        await new Promise(resolve => {
          script.onload = resolve;
        });

        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }

      loadPdf();
    };

    loadPdfJs();
  }, [fileUrl]);

  // Load PDF document
  const loadPdf = async () => {
    if (!fileUrl || !window.pdfjsLib) return;

    setLoading(true);
    setError(null);

    try {
      const loadingTask = window.pdfjsLib.getDocument(fileUrl);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setLoading(false);
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('Failed to load PDF');
      setLoading(false);
    }
  };

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;
    };

    renderPage();
  }, [pdfDoc, currentPage, scale]);

  // Handle text selection
  const handleMouseUp = useCallback((e) => {
    if (!canCreateHighlight) return;

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setSelection(null);
      setShowTip(false);
      return;
    }

    const text = sel.toString().trim();
    if (!text) return;

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (!containerRect) return;

    // Calculate position relative to container
    const position = {
      boundingRect: {
        x1: (rect.left - containerRect.left) / scale,
        y1: (rect.top - containerRect.top) / scale,
        x2: (rect.right - containerRect.left) / scale,
        y2: (rect.bottom - containerRect.top) / scale,
        width: rect.width / scale,
        height: rect.height / scale,
      },
      pageNumber: currentPage,
    };

    setSelection({ text, position });
    setTipPosition({
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top - 10,
    });
    setShowTip(true);
  }, [canCreateHighlight, currentPage, scale]);

  // Create highlight from selection
  const handleCreateHighlight = useCallback((comment) => {
    if (!selection || !onHighlightCreate) return;

    onHighlightCreate({
      content: { text: selection.text },
      position: selection.position,
      page_number: currentPage,
      type: 'text',
      color: isPartner ? HIGHLIGHT_COLORS.partner : HIGHLIGHT_COLORS.default,
      is_partner_highlight: isPartner,
      comment: comment ? { text: comment } : null,
    });

    setSelection(null);
    setShowTip(false);
    window.getSelection()?.removeAllRanges();
  }, [selection, onHighlightCreate, currentPage, isPartner]);

  // Navigate pages
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Zoom controls
  const zoomIn = () => setScale(s => Math.min(s + 0.25, 3));
  const zoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));
  const fitWidth = () => {
    if (containerRef.current && canvasRef.current) {
      const containerWidth = containerRef.current.clientWidth - 40;
      const canvasWidth = canvasRef.current.width / scale;
      setScale(containerWidth / canvasWidth);
    }
  };

  // Get highlights for current page
  const pageHighlights = highlights.filter(h => h.page_number === currentPage);

  // Scroll to highlight
  useEffect(() => {
    if (!selectedHighlightId) return;

    const highlight = highlights.find(h => h.id === selectedHighlightId);
    if (highlight && highlight.page_number !== currentPage) {
      setCurrentPage(highlight.page_number);
    }
  }, [selectedHighlightId, highlights, currentPage]);

  if (loading) {
    return (
      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Loader size="lg" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Text c="red">{error}</Text>
      </Box>
    );
  }

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <Paper p="xs" withBorder style={{ borderRadius: 0 }}>
        <Group justify="space-between">
          <Group gap="xs">
            <ActionIcon variant="subtle" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}>
              <ChevronLeft size={18} />
            </ActionIcon>
            <Text size="sm">
              Page {currentPage} of {totalPages}
            </Text>
            <ActionIcon variant="subtle" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages}>
              <ChevronRight size={18} />
            </ActionIcon>
          </Group>

          <Group gap="xs">
            <ActionIcon variant="subtle" onClick={zoomOut}>
              <ZoomOut size={18} />
            </ActionIcon>
            <Text size="sm">{Math.round(scale * 100)}%</Text>
            <ActionIcon variant="subtle" onClick={zoomIn}>
              <ZoomIn size={18} />
            </ActionIcon>
            <ActionIcon variant="subtle" onClick={fitWidth}>
              <Maximize size={18} />
            </ActionIcon>
          </Group>
        </Group>
      </Paper>

      {/* PDF Container */}
      <ScrollArea style={{ flex: 1 }} ref={containerRef}>
        <Box
          style={{ position: 'relative', display: 'inline-block', padding: 20 }}
          onMouseUp={handleMouseUp}
        >
          <canvas ref={canvasRef} />

          {/* Highlight overlays */}
          {pageHighlights.map((highlight) => {
            const { boundingRect } = highlight.position || {};
            if (!boundingRect) return null;

            const isSelected = highlight.id === selectedHighlightId;
            const color = highlight.resolved
              ? HIGHLIGHT_COLORS.resolved
              : isSelected
                ? HIGHLIGHT_COLORS.scrolledTo
                : highlight.color || HIGHLIGHT_COLORS.default;

            return (
              <Box
                key={highlight.id}
                onClick={() => onHighlightClick?.(highlight)}
                style={{
                  position: 'absolute',
                  left: boundingRect.x1 * scale,
                  top: boundingRect.y1 * scale,
                  width: boundingRect.width * scale,
                  height: boundingRect.height * scale,
                  backgroundColor: `${color}40`,
                  border: `2px solid ${color}`,
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              />
            );
          })}

          {/* Selection tip */}
          {showTip && selection && (
            <HighlightTip
              position={tipPosition}
              onConfirm={handleCreateHighlight}
              onCancel={() => {
                setShowTip(false);
                setSelection(null);
                window.getSelection()?.removeAllRanges();
              }}
            />
          )}
        </Box>
      </ScrollArea>
    </Box>
  );
}

/**
 * Tip that appears when text is selected
 */
function HighlightTip({ position, onConfirm, onCancel }) {
  const [comment, setComment] = useState('');
  const [showInput, setShowInput] = useState(false);

  return (
    <Paper
      shadow="md"
      p="xs"
      withBorder
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
        zIndex: 1000,
        minWidth: showInput ? 250 : 'auto',
      }}
    >
      {showInput ? (
        <Stack gap="xs">
          <Textarea
            placeholder="Add a comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            minRows={2}
            autoFocus
          />
          <Group gap="xs" justify="flex-end">
            <Button size="xs" variant="subtle" onClick={onCancel}>
              Cancel
            </Button>
            <Button size="xs" onClick={() => onConfirm(comment)}>
              Create Query
            </Button>
          </Group>
        </Stack>
      ) : (
        <Group gap="xs">
          <ActionIcon
            variant="filled"
            color="blue"
            onClick={() => setShowInput(true)}
            title="Add query with comment"
          >
            <MessageSquare size={16} />
          </ActionIcon>
          <ActionIcon
            variant="filled"
            color="green"
            onClick={() => onConfirm('')}
            title="Create query"
          >
            <Check size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" onClick={onCancel} title="Cancel">
            <X size={16} />
          </ActionIcon>
        </Group>
      )}
    </Paper>
  );
}

/**
 * Highlight sidebar for listing and managing highlights
 */
export function HighlightSidebar({
  highlights = [],
  selectedId,
  onSelect,
  onResolve,
  canResolve = false,
}) {
  const sortedHighlights = [...highlights].sort((a, b) => a.page_number - b.page_number);

  return (
    <ScrollArea style={{ height: '100%' }}>
      <Stack gap="xs" p="sm">
        {sortedHighlights.length === 0 ? (
          <Text c="dimmed" size="sm" ta="center" py="xl">
            No queries yet. Select text in the PDF to create one.
          </Text>
        ) : (
          sortedHighlights.map((highlight) => (
            <Paper
              key={highlight.id}
              p="sm"
              withBorder
              style={{
                cursor: 'pointer',
                backgroundColor: selectedId === highlight.id ? 'var(--mantine-color-blue-0)' : undefined,
                borderColor: selectedId === highlight.id ? 'var(--mantine-color-blue-5)' : undefined,
              }}
              onClick={() => onSelect?.(highlight)}
            >
              <Group justify="space-between" mb="xs">
                <Badge size="sm" variant="light">
                  Page {highlight.page_number}
                </Badge>
                {highlight.resolved && (
                  <Badge size="sm" color="green">
                    Resolved
                  </Badge>
                )}
              </Group>

              {highlight.content?.text && (
                <Text size="sm" lineClamp={2} mb="xs" style={{ fontStyle: 'italic' }}>
                  "{highlight.content.text}"
                </Text>
              )}

              {highlight.comment?.text && (
                <Text size="sm" lineClamp={2}>
                  {highlight.comment.text}
                </Text>
              )}

              {canResolve && !highlight.resolved && (
                <Button
                  size="xs"
                  variant="light"
                  color="green"
                  mt="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onResolve?.(highlight.id);
                  }}
                >
                  Mark Resolved
                </Button>
              )}
            </Paper>
          ))
        )}
      </Stack>
    </ScrollArea>
  );
}

export default PdfViewer;

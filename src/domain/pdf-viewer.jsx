'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Loader2,
} from 'lucide-react';

export function PDFViewer({
  fileUrl,
  highlights = [],
  onHighlight,
  selectedHighlight,
  onSelectHighlight,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const containerRef = useRef(null);

  // Note: In production, you'd use PDF.js or a similar library
  // This is a placeholder implementation

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
      setTotalPages(10); // Mock total pages
    }, 500);
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
    setSelectionStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
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

    // Only create highlight if selection is large enough
    if (position.width > 0.01 && position.height > 0.01) {
      onHighlight({
        page_number: currentPage,
        position,
        type: 'area',
      });
    }

    setIsSelecting(false);
    setSelectionStart(null);
  };

  const pageHighlights = highlights.filter((h) => h.page_number === currentPage);

  return (
    <Card className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        {onHighlight && (
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Add Query
          </Button>
        )}
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto p-4 bg-muted/30">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : fileUrl ? (
          <div
            ref={containerRef}
            className="relative mx-auto bg-white shadow-lg"
            style={{
              width: `${612 * scale}px`,
              height: `${792 * scale}px`,
              cursor: onHighlight ? 'crosshair' : 'default',
            }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
          >
            {/* Placeholder for PDF page */}
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium">PDF Page {currentPage}</p>
                <p className="text-sm">{fileUrl}</p>
              </div>
            </div>

            {/* Highlights overlay */}
            {pageHighlights.map((highlight) => {
              const pos = highlight.position;
              if (!pos) return null;

              return (
                <div
                  key={highlight.id}
                  className={`absolute border-2 cursor-pointer transition-colors ${
                    selectedHighlight === highlight.id
                      ? 'border-primary bg-primary/20'
                      : highlight.resolved
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-yellow-500 bg-yellow-500/20'
                  }`}
                  style={{
                    left: `${pos.x * 100}%`,
                    top: `${pos.y * 100}%`,
                    width: `${pos.width * 100}%`,
                    height: `${pos.height * 100}%`,
                  }}
                  onClick={() => onSelectHighlight?.(highlight.id)}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No PDF file loaded</p>
          </div>
        )}
      </div>
    </Card>
  );
}

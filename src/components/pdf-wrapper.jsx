'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';

const PDFViewer = dynamic(() => import('./pdf-viewer').then(m => ({ default: m.PDFViewer })), {
  loading: () => <div>Loading PDF viewer...</div>,
  ssr: false
});

const PDFComparison = dynamic(() => import('./pdf-comparison').then(m => ({ default: m.PDFComparison })), {
  loading: () => <div>Loading PDF comparison...</div>,
  ssr: false
});

export function PDFWrapper({
  review,
  fileUrl,
  highlights = [],
  onHighlight,
  selectedHighlight,
  onSelectHighlight,
}) {
  const searchParams = useSearchParams();

  const pdf1FromUrl = searchParams?.get('pdf1');
  const pdf2FromUrl = searchParams?.get('pdf2');

  const shouldUseComparison =
    (review?.comparison_enabled && review?.comparison_pdf1_id && review?.comparison_pdf2_id) ||
    (pdf1FromUrl && pdf2FromUrl);

  if (shouldUseComparison) {
    const pdf1Url = review?.comparison_pdf1_id || pdf1FromUrl;
    const pdf2Url = review?.comparison_pdf2_id || pdf2FromUrl;
    const pdf1Title = review?.comparison_pdf1_title || 'Document 1';
    const pdf2Title = review?.comparison_pdf2_title || 'Document 2';

    const highlights1 = highlights.filter(h => h.file_id === pdf1Url || !h.file_id);
    const highlights2 = highlights.filter(h => h.file_id === pdf2Url);

    return (
      <PDFComparison
        pdf1Url={pdf1Url}
        pdf2Url={pdf2Url}
        pdf1Title={pdf1Title}
        pdf2Title={pdf2Title}
        highlights1={highlights1}
        highlights2={highlights2}
        onHighlight1={onHighlight}
        onHighlight2={onHighlight}
        selectedHighlight={selectedHighlight}
        onSelectHighlight={onSelectHighlight}
      />
    );
  }

  return (
    <PDFViewer
      fileUrl={fileUrl}
      highlights={highlights}
      onHighlight={onHighlight}
      selectedHighlight={selectedHighlight}
      onSelectHighlight={onSelectHighlight}
    />
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { Paper, Group, Button, Text, Textarea, Stack, Badge, Card, Loader, ActionIcon } from '@mantine/core';
import { Send, Trash2, Copy } from 'lucide-react';

export function MLQueryConsole({ reviewId }) {
  const [queries, setQueries] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [queries, results]);

  async function executeQuery() {
    if (!input.trim()) return;

    const query = input.trim();
    setQueries(prev => [...prev, { id: Date.now(), query, timestamp: new Date() }]);
    setInput('');
    setLoading(true);
    setResults(null);

    try {
      const res = await fetch(`/api/mwr/review/${reviewId}/ml-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      const data = await res.json();
      if (res.ok) {
        setResults({
          query,
          highlights: data.highlights || [],
          suggestions: data.suggestions || [],
          summary: data.summary || '',
          confidence: data.confidence || 0
        });
      } else {
        setResults({ query, error: data.error || 'Query failed' });
      }
    } catch (err) {
      console.error('Query error:', err);
      setResults({ query, error: err.message });
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
  }

  return (
    <Paper withBorder p="md">
      <Stack gap="md">
        <Text fw={500} size="lg">ML Query Console</Text>
        
        <div ref={scrollRef} style={{ maxHeight: '400px', overflow: 'auto', border: '1px solid #dee2e6', borderRadius: '4px', padding: '12px' }}>
          {queries.map((q, i) => (
            <div key={q.id} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: i < queries.length - 1 ? '1px solid #e9ecef' : 'none' }}>
              <Text size="sm" fw={500} c="blue">Query #{i + 1}</Text>
              <Text size="sm" style={{ fontFamily: 'monospace', marginTop: '4px' }}>{q.query}</Text>
              <Text size="xs" c="dimmed" style={{ marginTop: '4px' }}>
                {q.timestamp.toLocaleTimeString()}
              </Text>
            </div>
          ))}

          {results && (
            <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              {results.error ? (
                <Text c="red" size="sm">Error: {results.error}</Text>
              ) : (
                <>
                  {results.summary && (
                    <div style={{ marginBottom: '12px' }}>
                      <Text size="sm" fw={500}>Summary</Text>
                      <Text size="sm">{results.summary}</Text>
                    </div>
                  )}

                  {results.confidence > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <Badge color={results.confidence > 0.7 ? 'green' : 'yellow'}>
                        Confidence: {Math.round(results.confidence * 100)}%
                      </Badge>
                    </div>
                  )}

                  {results.highlights.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <Text size="sm" fw={500}>Related Highlights ({results.highlights.length})</Text>
                      {results.highlights.map((h, i) => (
                        <Card key={i} size="xs" p="xs" style={{ marginTop: '4px', backgroundColor: '#e7f5ff' }}>
                          <Text size="xs">{h.text || 'Area highlight'}</Text>
                          <Text size="xs" c="dimmed">Page {h.page_number} • Status: {h.status}</Text>
                        </Card>
                      ))}
                    </div>
                  )}

                  {results.suggestions.length > 0 && (
                    <div>
                      <Text size="sm" fw={500}>Suggestions</Text>
                      {results.suggestions.map((s, i) => (
                        <div key={i} style={{ marginTop: '4px', fontSize: '12px' }}>
                          • {s}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
              <Loader size="sm" />
            </div>
          )}
        </div>

        <Textarea
          placeholder="Ask about highlights, patterns, risks..."
          value={input}
          onChange={e => setInput(e.currentTarget.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && e.ctrlKey) {
              executeQuery();
            }
          }}
          minRows={3}
        />

        <Group justify="space-between">
          <Button
            leftSection={<Send size={16} />}
            onClick={executeQuery}
            disabled={!input.trim() || loading}
          >
            Execute Query
          </Button>
          {queries.length > 0 && (
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={() => { setQueries([]); setResults(null); }}
              aria-label="Clear history"
            >
              <Trash2 size={16} />
            </ActionIcon>
          )}
        </Group>
      </Stack>
    </Paper>
  );
}

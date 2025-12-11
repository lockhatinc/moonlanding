'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  MessageSquare,
  Check,
  X,
  Send,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export function HighlightLayer({
  highlights = [],
  selectedId,
  onSelect,
  onResolve,
  onAddResponse,
  user,
  canResolve = false,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [newResponse, setNewResponse] = useState('');

  const handleToggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSubmitResponse = (highlightId) => {
    if (!newResponse.trim()) return;
    onAddResponse?.(highlightId, newResponse);
    setNewResponse('');
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-2">
      {highlights.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No queries yet</p>
            <p className="text-sm">Select an area on the PDF to add a query</p>
          </CardContent>
        </Card>
      ) : (
        highlights.map((highlight) => (
          <Card
            key={highlight.id}
            className={`cursor-pointer transition-colors ${
              selectedId === highlight.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onSelect?.(highlight.id)}
          >
            <CardHeader className="py-3 px-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={highlight.resolved ? 'default' : 'secondary'}>
                      Page {highlight.page_number}
                    </Badge>
                    {highlight.resolved ? (
                      <Badge className="bg-green-100 text-green-800">Resolved</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">Open</Badge>
                    )}
                  </div>
                  <p className="text-sm line-clamp-2">
                    {highlight.comment || highlight.content || 'No comment'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleExpand(highlight.id);
                  }}
                >
                  {expandedId === highlight.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>

            {expandedId === highlight.id && (
              <CardContent className="pt-0 px-4 pb-4" onClick={(e) => e.stopPropagation()}>
                {/* Metadata */}
                <div className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback>{highlight.created_by_display?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                  <span>{highlight.created_by_display || 'Unknown'}</span>
                  <span>•</span>
                  <span>{formatTime(highlight.created_at)}</span>
                </div>

                {/* Selected text */}
                {highlight.content && (
                  <div className="mb-3 p-2 bg-muted rounded text-sm italic">
                    "{highlight.content}"
                  </div>
                )}

                {/* Responses */}
                {highlight.responses && highlight.responses.length > 0 && (
                  <div className="space-y-2 mb-3">
                    <p className="text-xs font-medium text-muted-foreground">Responses</p>
                    {highlight.responses.map((response) => (
                      <div key={response.id} className="p-2 bg-muted/50 rounded text-sm">
                        <p>{response.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {response.created_by_display} • {formatTime(response.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add response */}
                <div className="flex gap-2 mb-3">
                  <Textarea
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    placeholder="Add a response..."
                    className="min-h-[60px]"
                  />
                  <Button
                    size="icon"
                    onClick={() => handleSubmitResponse(highlight.id)}
                    disabled={!newResponse.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {/* Actions */}
                {canResolve && !highlight.resolved && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => onResolve?.(highlight.id)}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Mark as Resolved
                  </Button>
                )}
              </CardContent>
            )}
          </Card>
        ))
      )}
    </div>
  );
}

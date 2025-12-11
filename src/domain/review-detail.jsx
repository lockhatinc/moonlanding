'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PDFViewer } from './pdf-viewer';
import { HighlightLayer } from './highlight-layer';
import { ChatPanel } from './chat-panel';
import { FieldRender } from '@/components/field-render';
import {
  FileSearch,
  Pencil,
  Trash2,
  ArrowLeft,
  MessageSquare,
  FileText,
  ClipboardCheck,
} from 'lucide-react';

export function ReviewDetail({
  spec,
  data,
  children = {},
  user,
  canEdit = false,
  canDelete = false,
  deleteAction,
}) {
  const router = useRouter();
  const [selectedHighlight, setSelectedHighlight] = useState(null);
  const [activeTab, setActiveTab] = useState('pdf');

  const highlights = children.highlights || [];
  const checklists = children.checklists || [];
  const attachments = children.attachments || [];
  const chatMessages = children.chat || [];

  const unresolvedCount = highlights.filter((h) => !h.resolved).length;

  const handleHighlight = async (highlightData) => {
    // In production, this would call a server action
    console.log('New highlight:', highlightData);
  };

  const handleResolve = async (highlightId) => {
    // In production, this would call a server action
    console.log('Resolve highlight:', highlightId);
  };

  const handleAddResponse = async (highlightId, content) => {
    // In production, this would call a server action
    console.log('Add response:', highlightId, content);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/review')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <FileSearch className="h-6 w-6" />
              {data.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <FieldRender
                spec={spec}
                field={{ key: 'status', type: 'enum', options: 'statuses' }}
                value={data.status}
                row={data}
              />
              {unresolvedCount > 0 && (
                <Badge variant="secondary">
                  {unresolvedCount} unresolved {unresolvedCount === 1 ? 'query' : 'queries'}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button
              variant="outline"
              onClick={() => router.push(`/review/${data.id}/edit`)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canDelete && deleteAction && (
            <form action={deleteAction}>
              <Button type="submit" variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* PDF Viewer */}
        <div className="lg:col-span-2 h-[calc(100vh-200px)]">
          <PDFViewer
            fileUrl={data.drive_file_id}
            highlights={highlights}
            onHighlight={canEdit ? handleHighlight : undefined}
            selectedHighlight={selectedHighlight}
            onSelectHighlight={setSelectedHighlight}
          />
        </div>

        {/* Sidebar */}
        <div className="h-[calc(100vh-200px)] overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pdf">
                <MessageSquare className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="details">
                <FileText className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="checklists">
                <ClipboardCheck className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-2">
              <TabsContent value="pdf" className="mt-0 h-full">
                <HighlightLayer
                  highlights={highlights}
                  selectedId={selectedHighlight}
                  onSelect={setSelectedHighlight}
                  onResolve={handleResolve}
                  onAddResponse={handleAddResponse}
                  user={user}
                  canResolve={canEdit}
                />
              </TabsContent>

              <TabsContent value="details" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Financial Year</p>
                      <p className="font-medium">{data.financial_year || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Team</p>
                      <p className="font-medium">{data.team_id_display || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Deadline</p>
                      <p className="font-medium">
                        <FieldRender
                          spec={spec}
                          field={{ type: 'date' }}
                          value={data.deadline}
                          row={data}
                        />
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">WIP Value</p>
                      <p className="font-medium">
                        {data.wip_value ? `$${data.wip_value.toFixed(2)}` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Private</p>
                      <p className="font-medium">{data.is_private ? 'Yes' : 'No'}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="checklists" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Checklists</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {checklists.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No checklists assigned
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {checklists.map((checklist) => (
                          <div
                            key={checklist.id}
                            className="flex items-center justify-between p-2 border rounded"
                          >
                            <span>{checklist.checklist_id_display || 'Checklist'}</span>
                            <Badge
                              className={
                                checklist.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : checklist.status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {checklist.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chat" className="mt-0">
                <ChatPanel
                  entityType="review"
                  entityId={data.id}
                  messages={chatMessages}
                  user={user}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Send, Loader2, Lock } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="icon" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
    </Button>
  );
}

export function ChatPanel({ entityType, entityId, messages = [], user, sendAction }) {
  const [isTeamOnly, setIsTeamOnly] = useState(false);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Chat</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col h-[400px]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation!
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.created_by === user?.id ? 'flex-row-reverse' : ''
                  }`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={msg.created_by_display?.avatar} />
                    <AvatarFallback>
                      {msg.created_by_display?.name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`flex flex-col max-w-[70%] ${
                      msg.created_by === user?.id ? 'items-end' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <span>{msg.created_by_display?.name || 'Unknown'}</span>
                      <span>{formatTime(msg.created_at)}</span>
                      {msg.is_team_only && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <Lock className="h-3 w-3" />
                          Team only
                        </span>
                      )}
                    </div>
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        msg.created_by === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <form action={sendAction} className="space-y-2">
            <input type="hidden" name="entity_type" value={entityType} />
            <input type="hidden" name="entity_id" value={entityId} />
            <input type="hidden" name="is_team_only" value={isTeamOnly ? 'true' : 'false'} />

            <div className="flex gap-2">
              <Textarea
                name="content"
                placeholder="Type your message..."
                className="min-h-[60px] resize-none"
                rows={2}
              />
              <SubmitButton />
            </div>

            {user?.type === 'auditor' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="team_only"
                  checked={isTeamOnly}
                  onCheckedChange={setIsTeamOnly}
                />
                <Label htmlFor="team_only" className="text-sm text-muted-foreground">
                  Team members only
                </Label>
              </div>
            )}
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

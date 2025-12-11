'use client';

import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FieldRender } from './field-render';
import { EntityList } from './entity-list';
import { ChatPanel } from '@/domain/chat-panel';
import { Pencil, Trash2, File, ArrowLeft } from 'lucide-react';
import * as Icons from 'lucide-react';
import { specs } from '@/engine/spec';
import { can } from '@/engine/auth';

export function EntityDetail({ spec, data, children = {}, user, canEdit = false, canDelete = false, deleteAction }) {
  const router = useRouter();

  const displayFields = Object.entries(spec.fields)
    .filter(([_, f]) => !f.hidden && f.type !== 'id')
    .map(([key, f]) => ({ key, ...f }));

  const Icon = Icons[spec.icon] || File;

  const childTabs = spec.children
    ? Object.entries(spec.children).map(([key, child]) => ({
        key,
        ...child,
        data: children[key] || [],
      }))
    : [];

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete this ${spec.label.toLowerCase()}?`)) {
      if (deleteAction) {
        await deleteAction();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${spec.name}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Icon className="h-6 w-6" />
              {data.name || data.email || data.id}
            </h1>
            {data.status && (
              <div className="mt-1">
                <FieldRender
                  spec={spec}
                  field={{ key: 'status', type: 'enum', options: 'statuses' }}
                  value={data.status}
                  row={data}
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" onClick={() => router.push(`/${spec.name}/${data.id}/edit`)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canDelete && deleteAction && (
            <form action={handleDelete}>
              <Button type="submit" variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </form>
          )}
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          {childTabs.map(tab => (
            <TabsTrigger key={tab.key} value={tab.key}>
              {tab.label}
              {tab.data.length > 0 && (
                <span className="ml-1 px-1.5 bg-primary/10 rounded text-xs">
                  {tab.data.length}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayFields.map(field => (
                  <div key={field.key}>
                    <p className="text-sm text-muted-foreground">{field.label || field.key}</p>
                    <div className="font-medium mt-1">
                      <FieldRender spec={spec} field={field} value={data[field.key]} row={data} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {childTabs.map(tab => {
          const childSpec = specs[tab.entity];
          if (!childSpec) return null;

          return (
            <TabsContent key={tab.key} value={tab.key} className="mt-4">
              {tab.component === 'chat' ? (
                <ChatPanel
                  entityType={spec.name}
                  entityId={data.id}
                  messages={tab.data}
                  user={user}
                />
              ) : (
                <EntityList
                  spec={childSpec}
                  data={tab.data}
                  canCreate={can(user, childSpec, 'create')}
                />
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {spec.actions && spec.actions.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-4">Actions</h3>
            <div className="flex flex-wrap gap-2">
              {spec.actions.map(action => {
                const ActionIcon = Icons[action.icon] || File;
                return (
                  <Button key={action.key} variant="outline" size="sm">
                    <ActionIcon className="h-4 w-4 mr-2" />
                    {action.label}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

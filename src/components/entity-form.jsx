'use client';

import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, File } from 'lucide-react';
import * as Icons from 'lucide-react';

function SubmitButton({ label }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
      {label}
    </Button>
  );
}

export function EntityForm({ spec, data = {}, options = {}, action }) {
  const router = useRouter();

  const formFields = Object.entries(spec.fields)
    .filter(([_, f]) => !f.hidden && !f.readOnly && f.type !== 'id')
    .map(([key, f]) => ({ key, ...f }));

  // Group fields into sections
  const sections = spec.form?.sections || [{ fields: formFields.map(f => f.key) }];

  const Icon = Icons[spec.icon] || File;

  const renderField = (field) => {
    const val = data[field.key] ?? '';

    switch (field.type) {
      case 'textarea':
        return <Textarea name={field.key} defaultValue={val} rows={3} />;

      case 'date':
        let dateValue = '';
        if (val) {
          const date = typeof val === 'number' ? new Date(val * 1000) : new Date(val);
          if (!isNaN(date.getTime())) {
            dateValue = date.toISOString().split('T')[0];
          }
        }
        return (
          <Input
            type="date"
            name={field.key}
            defaultValue={dateValue}
          />
        );

      case 'int':
        return <Input type="number" name={field.key} defaultValue={val} step="1" />;

      case 'decimal':
        return <Input type="number" name={field.key} defaultValue={val} step="0.01" />;

      case 'bool':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.key}
              name={field.key}
              defaultChecked={!!val}
            />
            <label htmlFor={field.key} className="text-sm text-muted-foreground">
              {field.label}
            </label>
          </div>
        );

      case 'enum':
        const enumOpts = spec.options?.[field.options] || [];
        return (
          <Select name={field.key} defaultValue={val !== '' ? String(val) : undefined}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {enumOpts.map(o => (
                <SelectItem key={o.value} value={String(o.value)}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'ref':
        const refOpts = options[field.key] || [];
        return (
          <Select name={field.key} defaultValue={val || undefined}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {refOpts.map(o => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'email':
        return <Input type="email" name={field.key} defaultValue={val} />;

      case 'image':
        return (
          <div className="space-y-2">
            <Input type="url" name={field.key} defaultValue={val} placeholder="Image URL" />
            {val && (
              <img src={val} alt="Preview" className="h-16 w-16 rounded-full object-cover" />
            )}
          </div>
        );

      default:
        return <Input type="text" name={field.key} defaultValue={val} />;
    }
  };

  return (
    <form action={action} className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <Icon className="h-6 w-6" />
        {data.id ? `Edit ${spec.label}` : `New ${spec.label}`}
      </h1>

      {sections.map((section, i) => {
        const sectionFields = section.fields
          .map(fieldKey => formFields.find(f => f.key === fieldKey))
          .filter(Boolean);

        if (sectionFields.length === 0) return null;

        return (
          <Card key={i}>
            {section.label && (
              <CardHeader>
                <CardTitle className="text-lg">{section.label}</CardTitle>
              </CardHeader>
            )}
            <CardContent className={section.label ? '' : 'pt-6'}>
              <div className="space-y-4">
                {sectionFields.map(field => (
                  <div key={field.key} className="space-y-2">
                    {field.type !== 'bool' && (
                      <Label htmlFor={field.key}>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                    )}
                    {renderField(field)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <SubmitButton label={data.id ? 'Update' : 'Create'} />
      </div>
    </form>
  );
}

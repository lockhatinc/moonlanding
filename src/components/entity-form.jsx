'use client';

import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button, TextInput, Textarea, Select, Checkbox, NumberInput, Paper, Title, Group, Stack, Text, Avatar, Box } from '@mantine/core';
import { getFormFields, getEntityIcon, formatFormValue, getEnumOptions } from '@/lib/field-types';

function SubmitButton({ label }) {
  const { pending } = useFormStatus();
  return <Button type="submit" loading={pending}>{label}</Button>;
}

export function EntityForm({ spec, data = {}, options = {}, action }) {
  const router = useRouter();
  const formFields = getFormFields(spec);
  const sections = spec.form?.sections || [{ fields: formFields.map(f => f.key) }];
  const Icon = getEntityIcon(spec);

  const renderField = (field) => {
    const val = formatFormValue(data[field.key], field.type);

    switch (field.type) {
      case 'textarea':
        return <Textarea name={field.key} defaultValue={val} rows={3} />;
      case 'date':
        return <input type="date" name={field.key} defaultValue={val} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--mantine-color-gray-4)', borderRadius: 4 }} />;
      case 'int':
        return <NumberInput name={field.key} defaultValue={val} />;
      case 'decimal':
        return <NumberInput name={field.key} defaultValue={val} decimalScale={2} />;
      case 'bool':
        return <Checkbox name={field.key} label={field.label} defaultChecked={!!val} />;
      case 'enum':
        return <Select name={field.key} defaultValue={val !== '' ? String(val) : null} data={getEnumOptions(spec, field.options).map(o => ({ value: String(o.value), label: o.label }))} placeholder={`Select ${field.label}`} clearable />;
      case 'ref':
        return <Select name={field.key} defaultValue={val || null} data={(options[field.key] || []).map(o => ({ value: o.value, label: o.label }))} placeholder={`Select ${field.label}`} searchable clearable />;
      case 'email':
        return <TextInput type="email" name={field.key} defaultValue={val} />;
      case 'image':
        return <Stack gap="xs"><TextInput name={field.key} defaultValue={val} placeholder="Image URL" />{val && <Avatar src={val} size="lg" />}</Stack>;
      default:
        return <TextInput name={field.key} defaultValue={val} />;
    }
  };

  return (
    <form action={action}>
      <Box maw={600}>
        <Group gap="xs" mb="lg"><Icon size={24} /><Title order={2}>{data.id ? `Edit ${spec.label}` : `New ${spec.label}`}</Title></Group>
        <Stack gap="md">
          {sections.map((section, i) => {
            const sectionFields = section.fields.map(fk => formFields.find(f => f.key === fk)).filter(Boolean);
            if (!sectionFields.length) return null;
            return (
              <Paper key={i} p="md" withBorder>
                {section.label && <Title order={4} mb="md">{section.label}</Title>}
                <Stack gap="sm">
                  {sectionFields.map(field => (
                    <Box key={field.key}>
                      {field.type !== 'bool' && <Text size="sm" fw={500} mb={4}>{field.label}{field.required && <Text span c="red" ml={4}>*</Text>}</Text>}
                      {renderField(field)}
                    </Box>
                  ))}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
        <Group justify="flex-end" mt="lg">
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          <SubmitButton label={data.id ? 'Update' : 'Create'} />
        </Group>
      </Box>
    </form>
  );
}

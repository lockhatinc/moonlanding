import { memo } from 'react';
import { Paper, SimpleGrid, Box, Text } from '@mantine/core';
import { FieldRender } from '../field-render';

const FieldRow = memo(function FieldRow({ field, spec, data }) {
  return (
    <Box key={field.key}>
      <Text size="sm" c="dimmed">{field.label || field.key}</Text>
      <Box fw={500}>
        <FieldRender spec={spec} field={field} value={data[field.key]} row={data} />
      </Box>
    </Box>
  );
});

export function DetailFields({ spec, data, fields }) {
  return (
    <Paper p="md" withBorder>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {fields.map(field => (
          <FieldRow key={field.key} field={field} spec={spec} data={data} />
        ))}
      </SimpleGrid>
    </Paper>
  );
}

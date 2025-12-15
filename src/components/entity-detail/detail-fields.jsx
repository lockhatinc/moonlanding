import { Paper, SimpleGrid, Box, Text } from '@mantine/core';
import { FieldRender } from '../field-render';

export function DetailFields({ spec, data, fields }) {
  return (
    <Paper p="md" withBorder>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {fields.map(field => (
          <Box key={field.key}>
            <Text size="sm" c="dimmed">{field.label || field.key}</Text>
            <Box fw={500}>
              <FieldRender spec={spec} field={field} value={data[field.key]} row={data} />
            </Box>
          </Box>
        ))}
      </SimpleGrid>
    </Paper>
  );
}

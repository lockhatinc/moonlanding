'use client';

import React from 'react';
import { Paper, Title, Stack, Box, Text } from '@mantine/core';

export function FormSections({
  sections = [],
  formFields = [],
  renderField,
  errors = {},
  className = '',
}) {
  if (!sections?.length) {
    return (
      <Stack gap="md">
        {formFields.map(field => (
          <Box key={field.key}>
            {field.type !== 'bool' && (
              <Text size="sm" fw={500} mb={4}>
                {field.label}
                {field.required && <Text span c="red" ml={4}>*</Text>}
              </Text>
            )}
            {renderField(field)}
            {errors[field.key] && <Text size="xs" c="red" mt={4} role="alert" id={`${field.key}-error`}>{errors[field.key]}</Text>}
          </Box>
        ))}
      </Stack>
    );
  }

  return (
    <Stack gap="md" className={className}>
      {sections.map((section, idx) => {
        const sectionFields = section.fields
          .map(fk => formFields.find(f => f.key === fk))
          .filter(Boolean);

        if (!sectionFields.length) return null;

        return (
          <Paper key={section.key || idx} p="md" withBorder>
            {section.label && <Title order={4} mb="md">{section.label}</Title>}
            <Stack gap="sm">
              {sectionFields.map(field => (
                <Box key={field.key}>
                  {field.type !== 'bool' && (
                    <Text size="sm" fw={500} mb={4}>
                      {field.label}
                      {field.required && <Text span c="red" ml={4}>*</Text>}
                    </Text>
                  )}
                  {renderField(field)}
                  {errors[field.key] && <Text size="xs" c="red" mt={4} role="alert" id={`${field.key}-error`}>{errors[field.key]}</Text>}
                </Box>
              ))}
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}

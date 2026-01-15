'use client';

import { Stack, Group, Text, Badge, Alert, Input, PasswordInput, Textarea, Select, Checkbox, Radio, Switch } from '@mantine/core';
import { STATUS_ICONS } from '@/config/icon-config';
import React from 'react';

/**
 * Enhanced FormField with real-time validation feedback
 */
export function EnhancedFormField({
  label,
  error = null,
  required = false,
  helpText = null,
  validation = null,
  validating = false,
  touched = false,
  children,
  showValidation = true,
}) {
  const isValid = validation === true && touched;
  const isInvalid = validation !== null && validation !== true && touched;
  const showError = error && touched;

  return (
    <Stack gap="xs">
      <Group gap={4} wrap="nowrap">
        <Text fw={500} size="sm">{label}</Text>
        {required && <Badge size="xs" color="red">Required</Badge>}
        {showValidation && isValid && (
          <Badge size="xs" color="green" leftSection={<STATUS_ICONS.success size={12} />}>
            Valid
          </Badge>
        )}
        {showValidation && isInvalid && (
          <Badge size="xs" color="orange" leftSection={<STATUS_ICONS.warning size={12} />}>
            Invalid
          </Badge>
        )}
        {validating && (
          <Badge size="xs" color="blue" leftSection={<STATUS_ICONS.loading size={12} />}>
            Checking
          </Badge>
        )}
      </Group>

      {children}

      {showError && (
        <Alert
          icon={<STATUS_ICONS.cancelled size={14} />}
          color="red"
          title="Validation Error"
          size="sm"
          style={{ marginTop: '4px' }}
        >
          {error}
        </Alert>
      )}

      {helpText && !showError && (
        <Text c="dimmed" size="xs">{helpText}</Text>
      )}
    </Stack>
  );
}

/**
 * Wraps Input with real-time validation feedback
 */
export function ValidatedInput({
  value,
  onChange,
  onBlur,
  error,
  validation,
  validating,
  touched,
  label,
  required,
  helpText,
  ...props
}) {
  const isValid = validation === true && touched;
  const isInvalid = validation !== null && validation !== true && touched;

  return (
    <EnhancedFormField
      label={label}
      error={error}
      required={required}
      helpText={helpText}
      validation={validation}
      validating={validating}
      touched={touched}
    >
      <Input
        {...props}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        style={{
          borderColor: isValid ? 'var(--mantine-color-green-6)' : isInvalid ? 'var(--mantine-color-red-6)' : undefined,
        }}
        aria-invalid={isInvalid}
        aria-describedby={error ? `error-${label}` : helpText ? `help-${label}` : undefined}
      />
    </EnhancedFormField>
  );
}

/**
 * Hook for managing field-level validation with async support
 */
export function useFieldValidation(initialValue = '', validator = null, asyncValidator = null) {
  const [value, setValue] = React.useState(initialValue);
  const [touched, setTouched] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [validation, setValidation] = React.useState(null);
  const [validating, setValidating] = React.useState(false);
  const validationTimeoutRef = React.useRef(null);

  // Sync validation
  const validateSync = React.useCallback((val) => {
    if (!validator) return true;
    try {
      const result = validator(val);
      setValidation(result === true ? true : null);
      setError(result === true ? null : result);
      return result === true;
    } catch (e) {
      setError(e.message);
      setValidation(null);
      return false;
    }
  }, [validator]);

  // Async validation with debounce
  const validateAsync = React.useCallback(async (val) => {
    if (!asyncValidator) return;

    setValidating(true);
    try {
      const result = await asyncValidator(val);
      setValidation(result === true ? true : null);
      setError(result === true ? null : result);
    } catch (e) {
      setError(e.message);
      setValidation(null);
    } finally {
      setValidating(false);
    }
  }, [asyncValidator]);

  // Handle change with debounced validation
  const handleChange = React.useCallback((val) => {
    setValue(val);
    setValidation(null);
    setError(null);

    // Sync validation happens immediately
    validateSync(val);

    // Async validation debounced
    if (asyncValidator) {
      clearTimeout(validationTimeoutRef.current);
      validationTimeoutRef.current = setTimeout(() => {
        validateAsync(val);
      }, 500); // 500ms debounce
    }
  }, [validateSync, validateAsync, asyncValidator]);

  const handleBlur = React.useCallback(() => {
    setTouched(true);
  }, []);

  const reset = React.useCallback(() => {
    setValue(initialValue);
    setTouched(false);
    setError(null);
    setValidation(null);
  }, [initialValue]);

  React.useEffect(() => {
    return () => clearTimeout(validationTimeoutRef.current);
  }, []);

  return {
    value,
    setValue: handleChange,
    setRawValue: setValue, // Bypass validation
    error,
    validation,
    validating,
    touched,
    setTouched,
    handleChange,
    handleBlur,
    reset,
  };
}

/**
 * Hook for managing form-level state with validation
 */
export function useForm(fields = {}, onSubmit = null) {
  const [formState, setFormState] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState(null);

  // Initialize fields
  React.useEffect(() => {
    const newState = {};
    Object.entries(fields).forEach(([name, config]) => {
      newState[name] = {
        value: config.initial || '',
        error: null,
        validation: null,
        validating: false,
        touched: false,
        ...config,
      };
    });
    setFormState(newState);
  }, [fields]);

  const updateField = React.useCallback((name, updates) => {
    setFormState(prev => ({
      ...prev,
      [name]: { ...prev[name], ...updates }
    }));
  }, []);

  const handleSubmit = React.useCallback(async (e) => {
    if (e) e.preventDefault();

    setSubmitting(true);
    setSubmitError(null);

    // Mark all fields as touched
    Object.keys(formState).forEach(name => {
      updateField(name, { touched: true });
    });

    try {
      const values = Object.entries(formState).reduce((acc, [name, field]) => {
        acc[name] = field.value;
        return acc;
      }, {});

      if (onSubmit) {
        await onSubmit(values);
      }
    } catch (e) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  }, [formState, onSubmit, updateField]);

  const reset = React.useCallback(() => {
    setFormState(prev => Object.entries(prev).reduce((acc, [name, field]) => {
      acc[name] = {
        ...field,
        value: field.initial || '',
        error: null,
        validation: null,
        touched: false,
      };
      return acc;
    }, {}));
    setSubmitError(null);
  }, []);

  return {
    state: formState,
    updateField,
    handleSubmit,
    reset,
    submitting,
    submitError,
  };
}

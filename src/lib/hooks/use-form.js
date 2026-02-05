import { useState, useCallback, useEffect } from 'react';

export function useForm(entityName, initialData = {}, options = {}) {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    onSubmit = null,
    validate = null,
    onSuccess = null,
    onError = null,
  } = options;

  const setFieldValue = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      validateField(field, value);
    }
  }, [touched]);

  const setFieldTouched = useCallback((field, value = true) => {
    setTouched(prev => ({ ...prev, [field]: value }));
    if (value && formData[field] !== undefined) {
      validateField(field, formData[field]);
    }
  }, [formData]);

  const validateField = useCallback((field, value) => {
    if (!validate) return true;
    const fieldErrors = validate(field, value, formData);
    if (fieldErrors) {
      setErrors(prev => ({ ...prev, [field]: fieldErrors }));
      return false;
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      return true;
    }
  }, [formData, validate]);

  const validateForm = useCallback(() => {
    if (!validate) return true;
    const allErrors = validate('__all__', formData, formData);
    if (allErrors && Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      return false;
    }
    setErrors({});
    return true;
  }, [formData, validate]);

  const reset = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setTouched({});
  }, [initialData]);

  const submit = useCallback(async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(formData);
      }
      if (onSuccess) {
        onSuccess(formData);
      }
    } catch (err) {
      setErrors({ __submit: err.message });
      if (onError) {
        onError(err);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSubmit, onSuccess, onError]);

  return {
    formData,
    setFormData,
    setFieldValue,
    setFieldTouched,
    errors,
    setErrors,
    touched,
    setTouched,
    validateField,
    validateForm,
    reset,
    submit,
    isSubmitting,
    isValid: Object.keys(errors).length === 0,
  };
}

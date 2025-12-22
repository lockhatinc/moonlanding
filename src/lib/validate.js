import { validationService } from '@/services';

export const validateField = async (spec, fieldName, value) => {
  return validationService.validateField(spec, fieldName, value);
};

export const validateEntity = async (spec, data) => {
  return validationService.validateEntity(spec, data);
};

export const validateUpdate = async (spec, id, data) => {
  return validationService.validateUpdate(spec, id, data);
};

export const hasErrors = (errors) => validationService.hasErrors(errors);

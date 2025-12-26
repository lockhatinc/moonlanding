let validationService = null;

const getValidationService = async () => {
  if (!validationService) {
    const module = await import(/* webpackIgnore: true */'@/services');
    validationService = module.validationService;
  }
  return validationService;
};

export const validateField = async (spec, fieldName, value) => {
  const service = await getValidationService();
  return service.validateField(spec, fieldName, value);
};

export const validateEntity = async (spec, data) => {
  const service = await getValidationService();
  return service.validateEntity(spec, data);
};

export const validateUpdate = async (spec, id, data) => {
  const service = await getValidationService();
  return service.validateUpdate(spec, id, data);
};

export const hasErrors = (errors) => {
  if (!validationService) return false;
  return validationService.hasErrors(errors);
};

// HTTP status codes - these are standard and don't need dynamic config
export const HTTP = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Error messages - could be made configurable in future via ConfigGeneratorEngine
export const ERRORS = {
  UNAUTHORIZED: 'Unauthorized',
  PERMISSION_DENIED: 'Permission denied',
  NOT_FOUND: 'Not found',
  INVALID_INPUT: 'Invalid input',
  INVALID_STATUS: 'Invalid status transition',
  DUPLICATE_ENTRY: 'Entry already exists',
  CANNOT_DELETE: 'Cannot delete this item',
  INVALID_DATE: 'Invalid date format',
  FILE_TOO_LARGE: 'File is too large',
  INVALID_EMAIL: 'Invalid email address',
  DATABASE_ERROR: 'Database operation failed',
  EXTERNAL_API_ERROR: 'External API request failed',
};

// Google API scopes - typically defined in integrations.google_oauth/google_drive/google_gmail in master-config.yml
export const GOOGLE_SCOPES = {
  drive: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
  ],
  gmail: [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
  ],
  docs: ['https://www.googleapis.com/auth/documents'],
};

// Google APIs - these are standard endpoints and don't change
export const GOOGLE_APIS = {
  oauth2: 'https://www.googleapis.com/oauth2/v1/userinfo',
};

// Centralized Configuration
// All environment-specific config in one place

export const config = {
  // Database
  db: {
    path: process.env.DATABASE_PATH || './data/app.db',
  },

  // Authentication
  auth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback',
    },
    session: {
      secure: process.env.NODE_ENV === 'production',
      expires: false,
    },
  },

  // Google Drive
  drive: {
    credentialsPath: process.env.GOOGLE_SERVICE_ACCOUNT_PATH || './serviceAccountCloud.json',
    rootFolderId: process.env.DRIVE_ROOT_FOLDER_ID,
    cache: {
      enabled: true,
      ttl: 24 * 60 * 60, // 24 hours
      bucket: process.env.CACHE_BUCKET || 'cached_reviews',
    },
  },

  // Email
  email: {
    provider: process.env.EMAIL_PROVIDER || 'nodemailer',
    from: process.env.EMAIL_FROM || 'noreply@example.com',
    smtp: {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD,
    },
    limits: {
      daily: 500,
      ratePerMinute: 10,
    },
  },

  // Jobs/Sync
  jobs: {
    userSync: {
      scriptUrl: process.env.USER_SYNC_SCRIPT_URL,
      key: process.env.USER_SYNC_KEY,
      defaultRole: 'clerk',
    },
  },

  // App
  app: {
    url: process.env.APP_URL || 'http://localhost:3000',
    env: process.env.NODE_ENV || 'development',
    debug: process.env.DEBUG === 'true',
  },
};

// Helper to check if Google auth is configured
export const hasGoogleAuth = () => !!(config.auth.google.clientId && config.auth.google.clientSecret);

// Helper to check if Drive is configured
export const hasDriveConfig = () => !!config.drive.rootFolderId;

// Helper to check if email is configured
export const hasEmailConfig = () => !!(config.email.smtp.user && config.email.smtp.password);

export default config;

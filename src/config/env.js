export const config = {
  db: {
    path: process.env.DATABASE_PATH || './data/app.db',
  },

  auth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google',
    },
    session: {
      secure: process.env.NODE_ENV === 'production',
      expires: false,
    },
  },

  drive: {
    credentialsPath: process.env.GOOGLE_SERVICE_ACCOUNT_PATH || './serviceAccountCloud.json',
    rootFolderId: process.env.DRIVE_ROOT_FOLDER_ID,
    cache: {
      enabled: true,
      ttl: 24 * 60 * 60,
      bucket: process.env.CACHE_BUCKET || 'cached_reviews',
    },
  },

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

  jobs: {
    userSync: {
      scriptUrl: process.env.USER_SYNC_SCRIPT_URL,
      key: process.env.USER_SYNC_KEY,
      defaultRole: 'clerk',
    },
  },

  validators: {
    engagement: {
      fields: {
        stage: { validator: 'validateStageTransition' },
      },
    },
    rfi: {
      fields: {
        status: { validator: 'validateRfiStatusChange' },
      },
    },
  },

  app: {
    url: process.env.APP_URL || 'http://localhost:3000',
    env: process.env.NODE_ENV || 'development',
    debug: process.env.DEBUG === 'true',
  },
};

export const VALIDATORS = config.validators;

export const hasGoogleAuth = () => !!(config.auth.google.clientId && config.auth.google.clientSecret);
export const hasDriveConfig = () => !!config.drive.rootFolderId;
export const hasEmailConfig = () => !!(config.email.smtp.user && config.email.smtp.password);

export const EMAIL_RESOLVERS = {
  team: { type: 'team', role: 'all' },
  team_partners: { type: 'team', role: 'partners' },
  client_admin: { type: 'client', role: 'admin' },
  client_all: { type: 'client' },
};

export default config;

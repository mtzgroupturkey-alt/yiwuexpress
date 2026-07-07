/**
 * ============================================
 * AUTOMATIC ENVIRONMENT DETECTION & CONFIG
 * ============================================
 * 
 * This configuration automatically detects whether the app is running:
 * - Locally (localhost, 127.0.0.1, local IP)
 * - Production (dromkok.com)
 * 
 * And loads the appropriate database credentials and settings.
 */

// Environment detection
export const isProduction = (() => {
  // Check NODE_ENV first
  if (process.env.NODE_ENV === 'production') return true;
  if (process.env.NODE_ENV === 'development') return false;

  // Check hostname/domain
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return hostname === 'dromkok.com' || hostname === 'www.dromkok.com';
  }

  // Server-side: check environment variables
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return apiUrl.includes('dromkok.com');
})();

export const isDevelopment = !isProduction;

// Environment name for logging
export const environmentName = isProduction ? 'PRODUCTION' : 'DEVELOPMENT';

// Database configuration
export const databaseConfig = {
  url: process.env.DATABASE_URL || '',
  
  // Parse connection details
  host: (() => {
    try {
      const url = new URL(process.env.DATABASE_URL || '');
      return url.hostname;
    } catch {
      return 'localhost';
    }
  })(),
  
  database: (() => {
    try {
      const url = new URL(process.env.DATABASE_URL || '');
      return url.pathname.substring(1); // Remove leading slash
    } catch {
      return isProduction ? 'ecommerce' : 'ecommerce';
    }
  })(),
  
  // Connection pool settings
  pool: {
    min: isProduction ? 2 : 1,
    max: isProduction ? 10 : 5,
  },
};

// JWT configuration
export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  algorithm: 'HS256' as const,
};

// Server configuration
export const serverConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  hostname: process.env.HOSTNAME || (isProduction ? '0.0.0.0' : 'localhost'),
  nodeEnv: process.env.NODE_ENV || (isProduction ? 'production' : 'development'),
};

// API configuration
export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 
    (isProduction ? 'https://dromkok.com' : 'http://localhost:3001'),
  
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || 
    (isProduction 
      ? ['https://dromkok.com', 'https://www.dromkok.com']
      : ['http://localhost:3001', 'http://localhost:3000', 'http://127.0.0.1:3001']
    ),
};

// CORS configuration
export const corsConfig = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (apiConfig.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Email configuration
export const emailConfig = {
  enabled: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

// Payment gateway configuration
export const paymentConfig = {
  stripe: {
    enabled: !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY),
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  },
  paypal: {
    enabled: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    mode: isProduction ? 'live' : 'sandbox',
  },
};

// File upload configuration
export const uploadConfig = {
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
  uploadDir: process.env.UPLOAD_DIR || 'public/uploads',
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  allowedVideoTypes: ['video/mp4', 'video/webm'],
};

// Security configuration
export const securityConfig = {
  bcryptRounds: isProduction ? 12 : 10,
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  sessionDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Logging configuration
export const loggingConfig = {
  level: isProduction ? 'error' : 'debug',
  enableConsole: !isProduction,
  enableFile: isProduction,
};

/**
 * Validate required environment variables
 */
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required variables
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required');
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET is required and must be at least 32 characters');
  }

  // Production-specific requirements
  if (isProduction) {
    if (!process.env.NEXT_PUBLIC_API_URL?.includes('dromkok.com')) {
      errors.push('NEXT_PUBLIC_API_URL must be set to https://dromkok.com in production');
    }

    if (process.env.JWT_SECRET?.includes('dev') || process.env.JWT_SECRET?.includes('test')) {
      errors.push('JWT_SECRET must be changed from default value in production');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Log current environment configuration (without sensitive data)
 */
export function logEnvironmentInfo() {
  if (!loggingConfig.enableConsole) return;

  console.log('\n' + '='.repeat(60));
  console.log(`🚀 YIWU EXPRESS - ${environmentName} ENVIRONMENT`);
  console.log('='.repeat(60));
  console.log(`📍 Environment: ${environmentName}`);
  console.log(`🌐 Domain: ${apiConfig.baseUrl}`);
  console.log(`🗄️  Database Host: ${databaseConfig.host}`);
  console.log(`🗄️  Database Name: ${databaseConfig.database}`);
  console.log(`🔧 Node ENV: ${serverConfig.nodeEnv}`);
  console.log(`🚪 Port: ${serverConfig.port}`);
  console.log(`📧 Email Enabled: ${emailConfig.enabled ? 'Yes' : 'No'}`);
  console.log(`💳 Stripe Enabled: ${paymentConfig.stripe.enabled ? 'Yes' : 'No'}`);
  console.log(`💰 PayPal Enabled: ${paymentConfig.paypal.enabled ? 'Yes' : 'No'}`);
  console.log('='.repeat(60) + '\n');

  // Validate environment
  const validation = validateEnvironment();
  if (!validation.valid) {
    console.error('⚠️  ENVIRONMENT VALIDATION ERRORS:');
    validation.errors.forEach(error => console.error(`   ❌ ${error}`));
    console.log('='.repeat(60) + '\n');
  }
}

// Export all configs
export const config = {
  environment: {
    isProduction,
    isDevelopment,
    name: environmentName,
  },
  database: databaseConfig,
  jwt: jwtConfig,
  server: serverConfig,
  api: apiConfig,
  cors: corsConfig,
  email: emailConfig,
  payment: paymentConfig,
  upload: uploadConfig,
  security: securityConfig,
  logging: loggingConfig,
};

export default config;

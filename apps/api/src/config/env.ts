import 'dotenv/config';

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT) || 3001,
  host: process.env.HOST ?? '0.0.0.0',
  mongodbUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/social-media',
  mongodbName: process.env.MONGODB_NAME ?? 'social-media',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET ?? 'replace-with-a-long-random-secret',
  jwtExpire: process.env.JWT_EXPIRE ?? '7d',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET ?? 'replace-with-a-different-long-random-secret',
  refreshTokenExpire: process.env.REFRESH_TOKEN_EXPIRE ?? '30d',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
};

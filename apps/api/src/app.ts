import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'dotenv/config';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import tweetRoutes from './routes/tweetRoutes.js';
import storyRoutes from './routes/storyRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { HttpError } from './utils/httpError.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: env.frontendUrl,
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root handlers for platform probes (Render often checks / with HEAD)
app.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Social Media API is running',
    health: '/api/health',
  });
});

app.head('/', (_req, res) => {
  res.sendStatus(200);
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tweets', tweetRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);

app.use((_req, _res, next) => {
  next(new HttpError(404, 'NOT_FOUND', 'Route not found'));
});

// Error handling
app.use((err: any, _req: any, res: any, _next: any) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Internal server error';

  // Avoid noisy stack traces for expected client-side errors (401/404/etc.)
  if (statusCode >= 500) {
    console.error('Error:', err);
  } else {
    console.warn(`HTTP ${statusCode} ${code}: ${message}`);
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
});

export default app;

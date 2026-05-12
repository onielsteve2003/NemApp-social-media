import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'dotenv/config';
import { env } from './config/env';
import authRoutes from './routes/authRoutes';
import { HttpError } from './utils/httpError';

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

app.use('/api/auth', authRoutes);

app.use((_req, _res, next) => {
  next(new HttpError(404, 'NOT_FOUND', 'Route not found'));
});

// Error handling
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Error:', err);
  res.status(err.statusCode || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal server error',
    },
  });
});

export default app;

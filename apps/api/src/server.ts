import 'dotenv/config';
import http from 'http';
import mongoose from 'mongoose';
import app from './app.js';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { ensureSeedData } from './services/bootstrapService.js';

const PORT = env.port;
const HOST = env.host;

const server = http.createServer(app);

// Socket.IO setup (will be configured later)
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// Basic connection handler
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

async function bootstrap() {
  await connectDatabase();

  if (mongoose.connection.readyState === 1) {
    await ensureSeedData();
  } else {
    console.warn('⚠️  MongoDB is still unavailable. Skipping seed bootstrap until the database is reachable.');
  }

  server.listen(PORT, HOST, () => {
    console.log(`🚀 Server running at http://${HOST}:${PORT}`);
    console.log(`📊 Health check: http://${HOST}:${PORT}/api/health`);
  });
}

void bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export { server, io };

import 'dotenv/config';
import http from 'http';
import app from './app';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { ensureSeedData } from './services/bootstrapService';

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
  await ensureSeedData();
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

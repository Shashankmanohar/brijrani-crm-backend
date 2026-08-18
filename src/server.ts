import http from 'http';
import dotenv from 'dotenv';

// Load Environment variables first (Reports Database Connection)
dotenv.config();

import app from './app';
import { connectDB } from './config/db';
import { Server } from 'socket.io';
import { handleSockets } from './sockets/handler';
import { startSchedulers } from './jobs/scheduler';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // 1. Establish Database Connection
  await connectDB();

  // 2. Initialize HTTP Server
  const server = http.createServer(app);

  // 3. Bind Sockets
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      credentials: true
    }
  });
  handleSockets(io);

  // Make IO globally accessible if needed
  app.set('io', io);

  // 4. Start Background Schedulers (Section 44)
  startSchedulers();

  // 5. Open Listener Port
  server.listen(PORT, () => {
    console.log(`[SERVER] API listening on http://localhost:${PORT}`);
    console.log(`[SERVER] Sockets listening for events`);
  });
};

startServer().catch(err => {
  console.error('[SERVER] Critical Startup Error:', err);
  process.exit(1);
});

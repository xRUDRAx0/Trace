import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import apiRoutes from './routes/api';
import { DbService } from './services/db.service';

import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const server = http.createServer(app);

const CORS_ORIGIN = process.env.SOCKET_CORS_ORIGIN || process.env.CLIENT_URL || '*';

const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

const dbService = new DbService();

app.set('io', io); // Inject for routes to use

app.use(cors({
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Main API routes
app.use('/api', apiRoutes);

// Health check — required for Railway/Render/Cloud deployment
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'trace'
  });
});

// Root redirect to frontend
app.get('/', (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  res.redirect(clientUrl);
});

io.on('connection', (socket) => {
  console.log('Client connected to Socket.IO', socket.id);

  socket.on('request_status', async () => {
    const settings = await dbService.getObservationSettings();
    socket.emit('observation_status', { active: settings.active, sessionId: dbService.getActiveWorkflowId() });
  });

  socket.on('new_event', async (event) => {
    const activeWorkflowId = dbService.getActiveWorkflowId();
    const targetSessionId = activeWorkflowId || event.sessionId;
    
    if (targetSessionId) {
      event.workflowId = targetSessionId;
      event.sessionId = targetSessionId;
      await dbService.saveEvents([event]);
      
      const session = await dbService.getSessionById(targetSessionId);
      if (session) {
        session.eventCount = (session.eventCount || 0) + 1;
        await dbService.saveSession(session);
      }
      
      // Broadcast to all connected frontend clients
      io.emit('new_event', event);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });
});

server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`TRACE backend running on port ${PORT} (0.0.0.0)`);
});

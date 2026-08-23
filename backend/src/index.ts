import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import apiRoutes from './routes/api';
import { DbService } from './services/db.service';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});
const PORT = process.env.PORT || 3001;

const dbService = new DbService();

app.set('io', io); // Inject for routes to use

app.use(cors());
app.use(express.json());

// Main API routes
app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

io.on('connection', (socket) => {
  console.log('Client connected to Socket.IO', socket.id);

  socket.on('request_status', async () => {
    const settings = await dbService.getObservationSettings();
    socket.emit('observation_status', { active: settings.active, sessionId: dbService.getActiveWorkflowId() });
  });

  socket.on('new_event', async (event) => {
    const activeWorkflowId = dbService.getActiveWorkflowId();
    if (activeWorkflowId) {
      event.workflowId = activeWorkflowId;
      await dbService.saveEvents([event]);
      // Broadcast to frontend
      io.emit('new_event', event);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

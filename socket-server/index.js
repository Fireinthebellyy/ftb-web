require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// Health check for Railway
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});
app.get("/", (req, res) => {
  res.json({ service: "FTB Socket Server", status: "running" });
});

const server = http.createServer(app);

// Configure Socket.IO
// Allow connections from the Next.js frontend (e.g. localhost:3000 in dev)
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join a specific room (toolkitId or mentorId based)
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room: ${roomId}`);
  });

  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log(`Socket ${socket.id} left room: ${roomId}`);
  });

  socket.on('send_message', ({ roomId, message }) => {
    // We only need to broadcast to others since the sender updates optimistically
    // and stores to DB via REST API
    console.log(`Message sent to room ${roomId}`);
    socket.to(roomId).emit('receive_message', message);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Socket.io Server is running on port ${PORT}`);
});

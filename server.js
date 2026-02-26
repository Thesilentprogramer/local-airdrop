const express = require('express');
const WebSocket = require('ws');

// Signaling server setup
const app = express();
const port = 3001;

// Store active rooms
const rooms = new Map();

// HTTP server for static files
app.use(express.static('client/build'));

// WebSocket server for signaling
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws, request) => {
  const roomId = new URL(request.url, 'ws://localhost').searchParams.get('room');
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  const room = rooms.get(roomId);
  room.add(ws);

  ws.on('message', (message) => {
    room.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    room.delete(ws);
    if (room.size === 0) {
      rooms.delete(roomId);
    }
  });
});

// Handle WebSocket upgrade requests
const server = app.listen(port, () => {
  console.log(`Signaling server running on port ${port}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

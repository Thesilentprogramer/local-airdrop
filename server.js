const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001;

// Store active rooms: Map<roomId, Set<{ws, deviceInfo}>>
const rooms = new Map();

const buildPath = path.join(__dirname, 'client', 'build');
const indexPath = path.join(buildPath, 'index.html');

// Serve production build only if it exists
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));

  // SPA fallback
  app.get('*', (req, res) => {
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Build not found. Run "npm run build" in the client directory.');
    }
  });
} else {
  console.log('No production build found. Run "npm run build" in client/ or use the React dev server on port 3000.');
}

const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws, request) => {
  const roomId = new URL(request.url, 'ws://localhost').searchParams.get('room');
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  const room = rooms.get(roomId);
  const peer = { ws, deviceInfo: null };
  room.add(peer);

  ws.on('message', (message) => {
    let parsed;
    try { parsed = JSON.parse(message); } catch { parsed = null; }

    // Store device info from 'join' messages
    if (parsed && parsed.type === 'join') {
      peer.deviceInfo = {
        deviceName: parsed.deviceName,
        deviceType: parsed.deviceType,
        os: parsed.os,
      };
    }

    // Relay ALL messages to other peers in the room
    room.forEach(p => {
      if (p.ws !== ws && p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(message);
      }
    });
  });

  ws.on('close', () => {
    room.delete(peer);
    if (room.size === 0) {
      rooms.delete(roomId);
    }
  });
});

const server = app.listen(port, () => {
  console.log(`Signaling server running on port ${port}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

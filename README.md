# Local AirDrop

A WebRTC-based Progressive Web App for cross-platform file transfer over local networks.

## Features

- 🔄 **Peer-to-Peer Transfer**: Uses WebRTC for direct device-to-device file transfer
- 📱 **Cross-Platform**: Works on iPhone (Safari), Android (Chrome), Windows, Linux, and macOS
- 🚀 **Zero-Login**: No authentication required - just open the URL on both devices
- 🎯 **Auto Discovery**: Auto-generated room IDs for instant pairing
- 💨 **Fast**: Files transfer directly over local WiFi without going through external servers
- 📦 **Drag & Drop**: Simple drag-and-drop interface

## Tech Stack

- **Frontend**: React with React Router
- **Backend**: Node.js with Express and WebSocket (ws)
- **Networking**: WebRTC (simple-peer)
- **PWA**: Service Worker for offline support

## Installation

### Prerequisites
- Node.js 14+ and npm

### Setup

1. Install server dependencies:
   ```bash
   npm install
   ```

2. Install client dependencies:
   ```bash
   cd client
   npm install
   cd ..
   ```

## Running the Application

### Development Mode

Open two terminals:

**Terminal 1 - Start the signaling server:**
```bash
node server.js
```
The server will run on `http://localhost:3001`

**Terminal 2 - Start the React development server:**
```bash
cd client
npm start
```
The client will run on `http://localhost:3000`

### Production Build

1. Build the React app:
   ```bash
   cd client
   npm run build
   cd ..
   ```

2. Start the server (it serves the built client):
   ```bash
   node server.js
   ```

## Usage

1. Open the first device's browser to `http://<server-ip>:3001` (or `http://localhost:3001` for same machine)
2. Click "Create New Room" - you'll get a room ID
3. Share the URL or room ID with another device on the same WiFi
4. Once connected, drag and drop files to transfer
5. The receiving device will automatically save the file

## How It Works

1. **Signaling**: Both devices connect to the Node.js WebSocket server to exchange SDP offers/answers and ICE candidates
2. **Connection**: WebRTC establishes a direct peer-to-peer connection
3. **Transfer**: Files are sent as binary data chunks over WebRTC DataChannels
4. **Local Network**: All data stays on the local WiFi - no external servers involved

## Architecture

```
┌─────────────┐         WebSocket Signaling        ┌─────────────┐
│  Device 1   │ ────────────────────────────────>>> │  Device 2   │
│   (React)   │                                     │   (React)   │
└─────────────┘     /ws?room=abc123                └─────────────┘
        │                                                   │
        │                                                   │
        └───────── WebRTC DataChannel (P2P) ──────────────┘
                   (File Transfer)
                   
        ┌──────────────────────────────┐
        │   Signaling Server (Node.js) │
        │   Running on port 3001       │
        └──────────────────────────────┘
```

## Troubleshooting

### WebSocket Connection Fails
- Ensure both devices are on the same WiFi network
- Check firewall settings for port 3001
- Use the server's local IP address (e.g., `192.168.1.100:3001`) instead of `localhost`

### WebRTC Connection Fails
- Ensure both devices can reach the signaling server
- Some corporate WiFi networks may block WebRTC - try a different network
- Check browser console for specific errors

### Files Not Transferring
- Verify WebRTC connection is established (check browser console)
- Try a smaller file first to test
- Check browser console for chunk transmission errors

## Browser Support

- ✅ Chrome/Chromium (Desktop & Android)
- ✅ Firefox (Desktop & Android)
- ⚠️ Safari (iOS 11+, some WebRTC limitations)
- ✅ Edge (Chromium-based)

## Future Enhancements

- [ ] Multiple file transfers
- [ ] Transfer progress indication
- [ ] File preview before accepting
- [ ] Encryption for extra security
- [ ] TURN server support for restricted networks
- [ ] Mobile app version
- [ ] QR code for easier room sharing

## License

MIT

## Contributing

Feel free to open issues and submit pull requests!

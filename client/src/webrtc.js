import Peer from 'simple-peer';

const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

export function createPeer(isInitiator, roomId) {
  const peer = new Peer({
    initiator: isInitiator,
    trickle: false,
    config: { iceServers }
  });

  // Setup WebSocket signaling
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;
  const port = window.location.port || (window.location.protocol === 'https:' ? 443 : 80);
  const wsUrl = `${protocol}//${host}:3001/ws?room=${roomId}`;
  
  const ws = new WebSocket(wsUrl);

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  peer.on('signal', data => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  });

  peer.on('close', () => {
    ws.close();
  });

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type) {
        peer.signal(data);
      }
    } catch (err) {
      console.error('Failed to parse signaling message:', err);
    }
  };

  return {
    peer,
    cleanup: () => {
      ws.close();
      peer.destroy();
    }
  };
}

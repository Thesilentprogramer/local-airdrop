import Peer from 'simple-peer';

const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  // Add TURN servers here for NAT traversal
];

export function createPeer(isInitiator, roomId) {
  const peer = new Peer({
    initiator: isInitiator,
    trickle: false,
    config: { iceServers }
  });

  // Setup WebSocket signaling
  const ws = new WebSocket(`ws://localhost:3001/ws?room=${roomId}`);

  peer.on('signal', data => {
    ws.send(JSON.stringify(data));
  });

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    peer.signal(data);
  };

  return {
    peer,
    cleanup: () => ws.close()
  };
}

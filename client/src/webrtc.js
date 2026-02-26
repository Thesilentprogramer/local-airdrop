/**
 * webrtc.js — Native WebRTC file transfer
 * Uses RTCPeerConnection directly (no simple-peer dependency).
 */

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

const CHUNK_SIZE = 64 * 1024; // 64KB chunks

// Message types
export const MSG = {
  FILE_START: 'file-start',
  FILE_END: 'file-end',
  DEVICE_INFO: 'device-info',
};

// Detect device info
export function getDeviceInfo() {
  const ua = navigator.userAgent;
  let deviceName = 'Unknown Device';
  let deviceType = 'desktop_windows';
  let os = 'Unknown';

  if (/iPhone/.test(ua)) { deviceName = 'iPhone'; deviceType = 'smartphone'; os = 'iOS'; }
  else if (/iPad/.test(ua)) { deviceName = 'iPad'; deviceType = 'tablet_mac'; os = 'iPadOS'; }
  else if (/Android/.test(ua) && /Mobile/.test(ua)) { deviceName = 'Android Phone'; deviceType = 'smartphone'; os = 'Android'; }
  else if (/Android/.test(ua)) { deviceName = 'Android Tablet'; deviceType = 'tablet_mac'; os = 'Android'; }
  else if (/Mac/.test(ua)) { deviceName = 'MacBook'; deviceType = 'laptop_mac'; os = 'macOS'; }
  else if (/Windows/.test(ua)) { deviceName = 'Windows PC'; deviceType = 'desktop_windows'; os = 'Windows'; }
  else if (/Linux/.test(ua)) { deviceName = 'Linux PC'; deviceType = 'desktop_windows'; os = 'Linux'; }

  return { deviceName, deviceType, os };
}

/**
 * Creates a WebRTC peer connection with signaling over WebSocket.
 */
export function createConnection(roomId, callbacks = {}) {
  const {
    onStateChange = () => { },
    onData = () => { },
    onPeerJoined = () => { },
  } = callbacks;

  let state = 'connecting';
  let ws = null;
  let pc = null;
  let dataChannel = null;
  let isInitiator = false;

  const setState = (s) => { state = s; onStateChange(s); };

  // ---- WebSocket signaling ----
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;
  const wsUrl = `${protocol}//${host}:3001/ws?room=${roomId}`;

  try {
    ws = new WebSocket(wsUrl);
  } catch (e) {
    setState('ws-error');
    return { send: () => { }, sendFile: () => () => { }, cleanup: () => { }, getState: () => state };
  }

  // ---- RTCPeerConnection ----
  pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  pc.onicecandidate = (e) => {
    if (e.candidate && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'candidate', candidate: e.candidate }));
    }
  };

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'connected') setState('connected');
    if (pc.connectionState === 'disconnected') setState('disconnected');
    if (pc.connectionState === 'failed') setState('error');
  };

  // Handle incoming data channel (when we're NOT the initiator)
  pc.ondatachannel = (e) => {
    dataChannel = e.channel;
    setupDataChannel(dataChannel);
    // Send our device info
    sendJSON({ type: MSG.DEVICE_INFO, ...getDeviceInfo() });
  };

  function setupDataChannel(ch) {
    ch.binaryType = 'arraybuffer';
    ch.onmessage = (e) => onData(e.data);
    ch.onopen = () => setState('connected');
    ch.onclose = () => setState('disconnected');
  }

  // ---- Signaling logic ----
  ws.onopen = () => {
    setState('signaling');
    // Tell the server we're here
    ws.send(JSON.stringify({ type: 'join', ...getDeviceInfo() }));
  };

  ws.onmessage = async (event) => {
    let msg;
    try { msg = JSON.parse(event.data); } catch { return; }

    if (msg.type === 'join') {
      // A peer joined — we become initiator
      onPeerJoined(msg);
      isInitiator = true;
      dataChannel = pc.createDataChannel('filetransfer');
      setupDataChannel(dataChannel);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      ws.send(JSON.stringify({ type: 'offer', sdp: pc.localDescription }));
      return;
    }

    if (msg.type === 'offer') {
      // We're the answerer
      await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      ws.send(JSON.stringify({ type: 'answer', sdp: pc.localDescription }));
      return;
    }

    if (msg.type === 'answer') {
      await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
      return;
    }

    if (msg.type === 'candidate') {
      try { await pc.addIceCandidate(new RTCIceCandidate(msg.candidate)); } catch { }
      return;
    }
  };

  ws.onerror = () => setState('ws-error');
  ws.onclose = () => {
    if (state === 'connecting' || state === 'signaling') setState('ws-error');
  };

  // ---- Send helpers ----
  function sendJSON(obj) {
    if (dataChannel && dataChannel.readyState === 'open') {
      dataChannel.send(JSON.stringify(obj));
    }
  }

  function sendFile(file, { onProgress, onComplete, onError }) {
    let cancelled = false;
    let offset = 0;
    let lastTime = Date.now();
    let lastBytes = 0;
    let speed = 0;

    sendJSON({
      type: MSG.FILE_START,
      name: file.name,
      size: file.size,
      totalChunks: Math.ceil(file.size / CHUNK_SIZE),
      ...getDeviceInfo(),
    });

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target.result;

      const sendChunk = () => {
        if (cancelled) return;
        if (offset >= buffer.byteLength) {
          sendJSON({ type: MSG.FILE_END });
          if (onComplete) onComplete();
          return;
        }

        // Backpressure — wait if buffered amount is high
        if (dataChannel.bufferedAmount > 16 * 1024 * 1024) {
          setTimeout(sendChunk, 100);
          return;
        }

        const chunk = buffer.slice(offset, offset + CHUNK_SIZE);
        try {
          dataChannel.send(chunk);
        } catch (err) {
          if (onError) onError(err);
          return;
        }
        offset += chunk.byteLength;

        const now = Date.now();
        const elapsed = (now - lastTime) / 1000;
        if (elapsed >= 0.5) {
          speed = (offset - lastBytes) / elapsed;
          lastTime = now;
          lastBytes = offset;
        }

        if (onProgress) onProgress(offset, file.size, speed);
        setTimeout(sendChunk, 0);
      };

      sendChunk();
    };

    reader.onerror = () => { if (onError) onError(new Error('Failed to read file')); };
    reader.readAsArrayBuffer(file);

    return () => { cancelled = true; };
  }

  function cleanup() {
    if (ws) ws.close();
    if (pc) pc.close();
    if (dataChannel) dataChannel.close();
  }

  return {
    send: sendJSON,
    sendFile,
    cleanup,
    getState: () => state,
  };
}

/**
 * FileReceiver — assembles incoming chunks into a file.
 */
export class FileReceiver {
  constructor({ onFileStart, onProgress, onComplete, onDeviceInfo }) {
    this.chunks = [];
    this.metadata = null;
    this.received = 0;
    this.lastTime = Date.now();
    this.lastBytes = 0;
    this.speed = 0;
    this.onFileStart = onFileStart;
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.onDeviceInfo = onDeviceInfo;
  }

  handleData(data) {
    if (typeof data === 'string') {
      try {
        const msg = JSON.parse(data);
        if (msg.type === MSG.DEVICE_INFO && this.onDeviceInfo) {
          this.onDeviceInfo({ deviceName: msg.deviceName, deviceType: msg.deviceType, os: msg.os });
          return;
        }
        if (msg.type === MSG.FILE_START) {
          this.metadata = msg;
          this.chunks = [];
          this.received = 0;
          this.lastTime = Date.now();
          this.lastBytes = 0;
          this.speed = 0;
          if (this.onFileStart) {
            this.onFileStart({
              name: msg.name, size: msg.size, totalChunks: msg.totalChunks,
              senderDevice: msg.deviceName || 'Unknown',
              senderDeviceType: msg.deviceType || 'smartphone',
            });
          }
          return;
        }
        if (msg.type === MSG.FILE_END) {
          this._assembleAndDownload();
          return;
        }
      } catch { }
      return;
    }

    // Binary chunk
    if (data instanceof ArrayBuffer) {
      this.chunks.push(data);
      this.received += data.byteLength;

      const now = Date.now();
      const elapsed = (now - this.lastTime) / 1000;
      if (elapsed >= 0.5) {
        this.speed = (this.received - this.lastBytes) / elapsed;
        this.lastTime = now;
        this.lastBytes = this.received;
      }

      if (this.onProgress && this.metadata) {
        this.onProgress(this.received, this.metadata.size, this.speed);
      }
    }
  }

  _assembleAndDownload() {
    if (!this.metadata || this.chunks.length === 0) return;
    const blob = new Blob(this.chunks);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.metadata.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);

    if (this.onComplete) {
      this.onComplete({ name: this.metadata.name, size: this.metadata.size, chunksReceived: this.chunks.length });
    }
    this.chunks = [];
    this.metadata = null;
    this.received = 0;
  }
}

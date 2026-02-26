import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { createPeer } from '../webrtc';

export default function TransferPage() {
  const { roomId } = useParams();
  const [status, setStatus] = useState('Connecting...');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef();
  const peerRef = useRef(null);

  useEffect(() => {
    const isInitiator = Math.random() > 0.5;
    const { peer, cleanup } = createPeer(isInitiator, roomId);

    peer.on('connect', () => {
      setStatus('Connected! Ready to transfer files.');
      peerRef.current = peer;
    });

    peer.on('data', (data) => {
      if (typeof data === 'string') {
        const metadata = JSON.parse(data);
        setFileName(metadata.name);
      }
    });

    peer.on('error', (err) => {
      setStatus(`Error: ${err.message}`);
    });

    return cleanup;
  }, [roomId]);

  const handleFileSelect = (file) => {
    if (!peerRef.current) {
      setStatus('Not connected yet');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const metadata = { name: file.name, size: file.size };
      peerRef.current.send(JSON.stringify(metadata));
      
      const buffer = e.target.result;
      const chunkSize = 16 * 1024; // 16KB chunks
      
      for (let i = 0; i < buffer.byteLength; i += chunkSize) {
        const chunk = buffer.slice(i, i + chunkSize);
        peerRef.current.send(chunk);
      }
      
      setStatus('File sent successfully!');
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="transfer-container">
      <h1>Local AirDrop</h1>
      <p>Room ID: <code>{roomId}</code></p>
      
      <div style={{ margin: '20px 0', padding: '20px', border: '2px dashed #667eea', borderRadius: '8px' }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFileSelect(e.target.files[0])}
          style={{ cursor: 'pointer' }}
        />
        <p>Select a file to send</p>
      </div>

      <div className="status">{status}</div>
      {fileName && <div>Receiving: {fileName}</div>}
    </div>
  );
}

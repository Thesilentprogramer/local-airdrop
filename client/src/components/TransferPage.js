import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPeer } from '../webrtc';
import Header from './Header';
import IncomingRequest from './IncomingRequest';

export default function TransferPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Connecting...');
  const [connected, setConnected] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [transferred, setTransferred] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [sending, setSending] = useState(false);
  const [paused, setPaused] = useState(false);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const fileInputRef = useRef(null);
  const peerRef = useRef(null);
  const lastTimeRef = useRef(Date.now());
  const lastBytesRef = useRef(0);

  useEffect(() => {
    const isInitiator = window.location.hash === '#init';
    const { peer, cleanup } = createPeer(isInitiator, roomId);

    peer.on('connect', () => {
      setStatus('Connected! Ready to transfer files.');
      setConnected(true);
      peerRef.current = peer;
    });

    peer.on('data', (data) => {
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'file-request') {
            setIncomingRequest({
              fileCount: 1,
              totalSize: formatBytes(parsed.size),
              files: [{ name: parsed.name, type: getFileCategory(parsed.name) }],
              senderDevice: parsed.senderDevice || 'Unknown Device',
              senderDeviceType: 'smartphone',
              deviceId: String(Math.floor(Math.random() * 9999)).padStart(4, '0'),
            });
          } else if (parsed.type === 'metadata') {
            setFileName(parsed.name);
            setFileSize(parsed.size);
            setSending(false);
          }
        } catch {
          // ignore
        }
      }
    });

    peer.on('error', (err) => {
      setStatus(`Error: ${err.message}`);
    });

    return cleanup;
  }, [roomId]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileCategory = (name) => {
    const ext = name.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return 'image';
    if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext)) return 'document';
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'flac', 'ogg'].includes(ext)) return 'audio';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
    return 'default';
  };

  const handleFileSelect = useCallback((file) => {
    if (!peerRef.current) {
      setStatus('Not connected yet.');
      return;
    }

    setFileName(file.name);
    setFileSize(file.size);
    setTransferred(0);
    setSending(true);
    setSpeed(0);
    lastTimeRef.current = Date.now();
    lastBytesRef.current = 0;

    // Send metadata first
    peerRef.current.send(JSON.stringify({ type: 'metadata', name: file.name, size: file.size }));

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target.result;
      const chunkSize = 16 * 1024; // 16KB chunks
      let offset = 0;

      const sendChunk = () => {
        if (offset < buffer.byteLength) {
          const chunk = buffer.slice(offset, offset + chunkSize);
          peerRef.current.send(chunk);
          offset += chunk.byteLength;
          setTransferred(offset);

          // Calculate speed
          const now = Date.now();
          const elapsed = (now - lastTimeRef.current) / 1000;
          if (elapsed >= 0.5) {
            const bytesSent = offset - lastBytesRef.current;
            setSpeed(bytesSent / elapsed);
            lastTimeRef.current = now;
            lastBytesRef.current = offset;
          }

          setTimeout(sendChunk, 0);
        } else {
          setStatus('File sent successfully!');
          setSending(false);
        }
      };

      sendChunk();
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleAcceptIncoming = () => {
    setIncomingRequest(null);
    setStatus('Receiving file...');
  };

  const handleDeclineIncoming = () => {
    setIncomingRequest(null);
  };

  const percent = fileSize > 0 ? Math.round((transferred / fileSize) * 100) : 0;
  const timeLeft = speed > 0 ? Math.ceil((fileSize - transferred) / speed) : 0;

  // Determine number of blocks to show based on progress
  const totalBlocks = 6;
  const filledBlocks = Math.max(1, Math.ceil((percent / 100) * totalBlocks));

  // If no file is being transferred, show the waiting/drop view
  const showTransfer = sending || (fileName && percent > 0);

  return (
    <div className="app-shell">
      <Header connected={connected} />

      {showTransfer ? (
        <main className="transfer-page">
          <div className="transfer-page__bg"></div>

          <div className="transfer-card">
            {/* Left: Visualizer */}
            <div className="transfer-card__viz">
              <div className="transfer-card__viz-icon">
                <span className="material-symbols-outlined">cloud_upload</span>
              </div>

              <div className="transfer-viz-area">
                <div className="transfer-viz__stack">
                  {Array.from({ length: filledBlocks }).map((_, i) => (
                    <div
                      key={i}
                      className={`transfer-viz__block ${i === filledBlocks - 1 ? 'transfer-viz__block--pulse' : ''}`}
                    />
                  ))}
                  {percent < 100 && (
                    <div className="transfer-viz__block transfer-viz__block--falling" />
                  )}
                </div>
              </div>

              <p className="transfer-card__viz-label">Visualizer</p>
            </div>

            {/* Right: Details */}
            <div className="transfer-card__details">
              <div>
                <div className="transfer-card__header">
                  <span className="badge badge--dark">Sending</span>
                  <button className="transfer-card__close" onClick={() => navigate('/')}>
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <h2 className="transfer-card__filename">{fileName}</h2>
                <p className="transfer-card__recipient">
                  Room: <span style={{ fontFamily: 'monospace' }}>{roomId}</span>
                </p>
              </div>

              <div className="transfer-card__metrics">
                <div className="transfer-card__percent">
                  <span className="transfer-card__percent-num">{percent}</span>
                  <span className="transfer-card__percent-sym">%</span>
                </div>

                <div className="transfer-card__progress">
                  <div
                    className="transfer-card__progress-fill"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="transfer-card__stats">
                  <div className="stat-box">
                    <p className="stat-box__label">Transferred</p>
                    <p className="stat-box__value">{formatBytes(transferred)}</p>
                  </div>
                  <div className="stat-box">
                    <p className="stat-box__label">Total Size</p>
                    <p className="stat-box__value">{formatBytes(fileSize)}</p>
                  </div>
                  <div className="stat-box">
                    <p className="stat-box__label">Speed</p>
                    <p className="stat-box__value">{formatBytes(speed)}/s</p>
                  </div>
                  <div className="stat-box">
                    <p className="stat-box__label">Time Left</p>
                    <p className="stat-box__value">~{timeLeft}s</p>
                  </div>
                </div>
              </div>

              <div className="transfer-card__btns">
                <button
                  className="btn--transfer-outline"
                  onClick={() => setPaused(!paused)}
                >
                  {paused ? 'Resume' : 'Pause'}
                </button>
                <button
                  className="btn--transfer-dark"
                  onClick={() => navigate('/')}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          <div className="transfer-page__indicator">
            <span className="transfer-page__indicator-dot"></span>
            <span>Secure WebRTC Connection Active</span>
          </div>
        </main>
      ) : (
        <main className="transfer-page" style={{ justifyContent: 'flex-start', paddingTop: '40px' }}>
          <div className="transfer-page__bg"></div>

          <div style={{ textAlign: 'center', zIndex: 10, marginBottom: '32px' }}>
            <h1 className="hero__title">Waiting for connections...</h1>
            <div className="room-info" style={{ justifyContent: 'center', marginTop: '8px' }}>
              <span className="room-info__label">Room:</span>
              <span className="room-info__code">{roomId}</span>
            </div>
            <p style={{
              fontSize: '1rem',
              fontWeight: 500,
              opacity: 0.7,
              marginTop: '8px'
            }}>
              {status}
            </p>
          </div>

          {/* Drop zone to select a file to send */}
          <div style={{ width: '100%', maxWidth: '480px', zIndex: 10 }}>
            <div className="drop-zone" style={{ minHeight: '300px' }}>
              <div className="drop-zone__stud drop-zone__stud--tl"></div>
              <div className="drop-zone__stud drop-zone__stud--tr"></div>
              <div className="drop-zone__stud drop-zone__stud--bl"></div>
              <div className="drop-zone__stud drop-zone__stud--br"></div>

              <div className="drop-zone__icon">
                <span className="material-symbols-outlined">upload_file</span>
              </div>
              <div>
                <h4 className="drop-zone__title">Select a file to send</h4>
                <p className="drop-zone__desc">
                  {connected ? 'Choose a file to start the transfer.' : 'Waiting for peer to connect...'}
                </p>
              </div>
              <div className="drop-zone__divider"></div>
              <button
                className="drop-zone__browse-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={!connected}
                style={{ opacity: connected ? 1 : 0.5 }}
              >
                <span className="material-symbols-outlined">folder_open</span>
                Browse Files
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden-input"
                onChange={(e) => {
                  if (e.target.files[0]) handleFileSelect(e.target.files[0]);
                }}
              />
            </div>
          </div>

          <div className="transfer-page__indicator" style={{ zIndex: 10 }}>
            <span className="transfer-page__indicator-dot"></span>
            <span>{connected ? 'Secure WebRTC Connection Active' : 'Establishing connection...'}</span>
          </div>
        </main>
      )}

      {incomingRequest && (
        <IncomingRequest
          request={incomingRequest}
          onAccept={handleAcceptIncoming}
          onDecline={handleDeclineIncoming}
        />
      )}
    </div>
  );
}

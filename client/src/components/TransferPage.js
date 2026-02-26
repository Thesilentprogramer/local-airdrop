import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createConnection, FileReceiver, getDeviceInfo } from '../webrtc';
import Header from './Header';

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function CircularProgress({ percent, children }) {
  const radius = 116;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="circular-progress">
      <div className="circular-progress__bg"></div>
      <svg className="circular-progress__svg" viewBox="0 0 256 256">
        <circle className="circular-progress__track" cx="128" cy="128" r={radius}
          fill="transparent" stroke="currentColor" strokeWidth="16" />
        <circle className="circular-progress__fill" cx="128" cy="128" r={radius}
          fill="transparent" stroke="currentColor" strokeWidth="16"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.3s ease' }} />
      </svg>
      <div className="circular-progress__content">{children}</div>
    </div>
  );
}

export default function TransferPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [connectionState, setConnectionState] = useState('connecting');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [transferred, setTransferred] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [sending, setSending] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [transferComplete, setTransferComplete] = useState(false);
  const [peerDevice, setPeerDevice] = useState(null);
  const fileInputRef = useRef(null);
  const connRef = useRef(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    const receiver = new FileReceiver({
      onDeviceInfo: (info) => setPeerDevice(info),
      onFileStart: (meta) => {
        setFileName(meta.name);
        setFileSize(meta.size);
        setTransferred(0);
        setSpeed(0);
        setReceiving(true);
        setSending(false);
        setTransferComplete(false);
      },
      onProgress: (recv, total, spd) => {
        setTransferred(recv);
        setSpeed(spd);
      },
      onComplete: () => {
        setTransferComplete(true);
        setReceiving(false);
      },
    });

    const conn = createConnection(roomId, {
      onStateChange: (s) => setConnectionState(s),
      onData: (data) => receiver.handleData(data),
      onPeerJoined: (info) => {
        if (info.deviceName) {
          setPeerDevice({ deviceName: info.deviceName, deviceType: info.deviceType, os: info.os });
        }
      },
    });

    connRef.current = conn;
    return () => conn.cleanup();
  }, [roomId]);

  const handleFileSelect = useCallback((file) => {
    if (!connRef.current || connRef.current.getState() !== 'connected') return;

    setFileName(file.name);
    setFileSize(file.size);
    setTransferred(0);
    setSpeed(0);
    setSending(true);
    setReceiving(false);
    setTransferComplete(false);

    const cancel = connRef.current.sendFile(file, {
      onProgress: (sent, total, spd) => { setTransferred(sent); setSpeed(spd); },
      onComplete: () => { setTransferComplete(true); setSending(false); },
      onError: (err) => { console.error('Transfer error:', err); setSending(false); },
    });

    cancelRef.current = cancel;
  }, []);

  const handleCancel = () => {
    if (cancelRef.current) cancelRef.current();
    setSending(false);
    setReceiving(false);
    setTransferred(0);
    navigate('/');
  };

  const connected = connectionState === 'connected';
  const percent = fileSize > 0 ? Math.round((transferred / fileSize) * 100) : 0;
  const timeLeft = speed > 0 ? Math.ceil((fileSize - transferred) / speed) : 0;
  const showTransfer = sending || receiving || transferComplete;
  const totalBlocks = 6;
  const filledBlocks = Math.max(1, Math.ceil((percent / 100) * totalBlocks));
  const myDevice = getDeviceInfo();

  const getStatusText = () => {
    if (transferComplete) return 'Transfer complete!';
    if (sending) return 'Sending...';
    if (receiving) return 'Receiving...';
    switch (connectionState) {
      case 'connecting': return 'Connecting to signaling server...';
      case 'signaling': return 'Waiting for peer to join...';
      case 'connected': return 'Connected! Select a file to send.';
      case 'disconnected': return 'Disconnected.';
      case 'error': case 'ws-error': return 'Connection error. Is the server running?';
      default: return connectionState;
    }
  };

  return (
    <div className="app-shell">
      <div className="desktop-only"><Header connected={connected} /></div>

      {showTransfer ? (
        <>
          {/* Mobile transfer view */}
          <div className="mobile-only mobile-transfer">
            <div className="mobile-transfer__header">
              <button className="mobile-icon-btn" onClick={handleCancel}>
                <span className="material-symbols-outlined">close</span>
              </button>
              <h2 className="mobile-transfer__title">
                {transferComplete ? 'COMPLETE' : 'TRANSFERRING'}
              </h2>
              <button className="mobile-icon-btn">
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            </div>
            <div className="mobile-transfer__body">
              <CircularProgress percent={percent}>
                <div className="mobile-transfer__file-icon">
                  <span className="material-symbols-outlined">description</span>
                </div>
                <span className="mobile-transfer__percent-badge">{percent}%</span>
              </CircularProgress>
              <div className="mobile-transfer__info-card">
                <h1 className="mobile-transfer__filename">{fileName}</h1>
                <div className="mobile-transfer__stats-row">
                  <span>{formatBytes(fileSize)}</span>
                  <span className="mobile-transfer__dot"></span>
                  <span>{formatBytes(speed)}/s</span>
                </div>
              </div>
              <div className="mobile-transfer__peer-card">
                <div className="mobile-transfer__peer-side">
                  <div className="mobile-transfer__peer-icon mobile-transfer__peer-icon--sender">
                    <span className="material-symbols-outlined">smartphone</span>
                  </div>
                  <div className="mobile-transfer__peer-meta">
                    <span className="mobile-transfer__peer-label">Sender</span>
                    <span className="mobile-transfer__peer-name">
                      {sending ? myDevice.deviceName : (peerDevice?.deviceName || 'Peer')}
                    </span>
                  </div>
                </div>
                <div className="mobile-transfer__peer-dots">
                  <div className="dot dot--1"></div>
                  <div className="dot dot--2"></div>
                  <div className="dot dot--3"></div>
                </div>
                <div className="mobile-transfer__peer-side mobile-transfer__peer-side--right">
                  <div className="mobile-transfer__peer-icon mobile-transfer__peer-icon--receiver">
                    <span className="material-symbols-outlined">laptop_mac</span>
                  </div>
                  <div className="mobile-transfer__peer-meta">
                    <span className="mobile-transfer__peer-label">Receiver</span>
                    <span className="mobile-transfer__peer-name">
                      {receiving ? myDevice.deviceName : (peerDevice?.deviceName || 'Peer')}
                    </span>
                  </div>
                </div>
                <div className="mobile-transfer__p2p">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>hub</span>
                  <span>P2P Connection Active</span>
                </div>
              </div>
            </div>
            <div className="mobile-transfer__actions">
              <button className="mobile-transfer__btn"><span className="material-symbols-outlined">pause</span>Pause</button>
              <button className="mobile-transfer__btn mobile-transfer__btn--cancel" onClick={handleCancel}>
                <span className="material-symbols-outlined">cancel</span>Cancel
              </button>
            </div>
          </div>

          {/* Desktop transfer view */}
          <main className="transfer-page desktop-only">
            <div className="transfer-page__bg"></div>
            <div className="transfer-card">
              <div className="transfer-card__viz">
                <div className="transfer-card__viz-icon"><span className="material-symbols-outlined">cloud_upload</span></div>
                <div className="transfer-viz-area">
                  <div className="transfer-viz__stack">
                    {Array.from({ length: filledBlocks }).map((_, i) => (
                      <div key={i} className={`transfer-viz__block ${i === filledBlocks - 1 ? 'transfer-viz__block--pulse' : ''}`} />
                    ))}
                    {percent < 100 && <div className="transfer-viz__block transfer-viz__block--falling" />}
                  </div>
                </div>
                <p className="transfer-card__viz-label">Visualizer</p>
              </div>
              <div className="transfer-card__details">
                <div>
                  <div className="transfer-card__header">
                    <span className="badge badge--dark">{transferComplete ? 'Complete' : (sending ? 'Sending' : 'Receiving')}</span>
                    <button className="transfer-card__close" onClick={handleCancel}><span className="material-symbols-outlined">close</span></button>
                  </div>
                  <h2 className="transfer-card__filename">{fileName}</h2>
                  <p className="transfer-card__recipient">{peerDevice ? `To: ${peerDevice.deviceName}` : `Room: ${roomId}`}</p>
                </div>
                <div className="transfer-card__metrics">
                  <div className="transfer-card__percent">
                    <span className="transfer-card__percent-num">{percent}</span>
                    <span className="transfer-card__percent-sym">%</span>
                  </div>
                  <div className="transfer-card__progress"><div className="transfer-card__progress-fill" style={{ width: `${percent}%` }} /></div>
                  <div className="transfer-card__stats">
                    <div className="stat-box"><p className="stat-box__label">Transferred</p><p className="stat-box__value">{formatBytes(transferred)}</p></div>
                    <div className="stat-box"><p className="stat-box__label">Total Size</p><p className="stat-box__value">{formatBytes(fileSize)}</p></div>
                    <div className="stat-box"><p className="stat-box__label">Speed</p><p className="stat-box__value">{formatBytes(speed)}/s</p></div>
                    <div className="stat-box"><p className="stat-box__label">Time Left</p><p className="stat-box__value">~{timeLeft}s</p></div>
                  </div>
                </div>
                <div className="transfer-card__btns">
                  <button className="btn--transfer-outline">Pause</button>
                  <button className="btn--transfer-dark" onClick={handleCancel}>Cancel</button>
                </div>
              </div>
            </div>
            <div className="transfer-page__indicator"><span className="transfer-page__indicator-dot"></span><span>Secure WebRTC Connection Active</span></div>
          </main>
        </>
      ) : (
        <>
          {/* Mobile waiting view */}
          <div className="mobile-only mobile-waiting">
            <div className="mobile-waiting__header">
              <button className="mobile-icon-btn"><span className="material-symbols-outlined">menu</span></button>
              <h2 className="mobile-waiting__title">FILESHARE</h2>
              <button className="mobile-icon-btn"><span className="material-symbols-outlined">settings</span></button>
            </div>
            <div className="mobile-waiting__body">
              <div className="mobile-send-area">
                <div className="mobile-send-area__orbit mobile-send-area__orbit--outer"></div>
                <div className="mobile-send-area__orbit mobile-send-area__orbit--inner"></div>
                <button className="mobile-send-area__btn" onClick={() => fileInputRef.current?.click()}
                  disabled={!connected} style={{ opacity: connected ? 1 : 0.6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>cloud_upload</span>
                  <span className="mobile-send-area__label">SEND</span>
                </button>
              </div>
              <div className="mobile-waiting__text">
                <p className="mobile-waiting__heading">{connected ? 'READY TO SHARE' : 'CONNECTING...'}</p>
                <p className="mobile-waiting__desc">{connected ? 'Tap the send button to transfer files.' : 'Waiting for peer to join this room...'}</p>
              </div>
              <button className="mobile-select-btn" onClick={() => fileInputRef.current?.click()}
                disabled={!connected} style={{ opacity: connected ? 1 : 0.6 }}>
                <span className="material-symbols-outlined" style={{ fontWeight: 700 }}>add</span>
                <span>Select Files</span>
              </button>
              <div className="mobile-devices-card">
                <div className="mobile-devices-card__header"><h3>Room</h3>
                  <div className="mobile-devices-card__status">
                    <span className="mobile-devices-card__pulse"></span>
                    <span className="mobile-devices-card__pulse-inner"></span>
                    {connected ? 'Connected' : 'Waiting'}
                  </div>
                </div>
                <div className="mobile-device-row">
                  <div className="mobile-device-row__icon"><span className="material-symbols-outlined">link</span></div>
                  <div className="mobile-device-row__info">
                    <p className="mobile-device-row__name">{roomId}</p>
                    <p className="mobile-device-row__desc">{connected ? 'Peer connected' : 'Share this room ID'}</p>
                  </div>
                </div>
                {peerDevice && (
                  <div className="mobile-device-row">
                    <div className="mobile-device-row__icon"><span className="material-symbols-outlined">{peerDevice.deviceType}</span></div>
                    <div className="mobile-device-row__info">
                      <p className="mobile-device-row__name">{peerDevice.deviceName}</p>
                      <p className="mobile-device-row__desc">{peerDevice.os} • Connected</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mobile-footer">
              <div className="mobile-footer__network"><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>wifi</span><span>Local Network</span></div>
              <p className="mobile-footer__disc">Your device: {myDevice.deviceName} ({myDevice.os})</p>
            </div>
          </div>

          {/* Desktop waiting view */}
          <main className="transfer-page desktop-only" style={{ justifyContent: 'flex-start', paddingTop: '40px' }}>
            <div className="transfer-page__bg"></div>
            <div style={{ textAlign: 'center', zIndex: 10, marginBottom: '32px' }}>
              <h1 className="hero__title">Waiting for connections...</h1>
              <div className="room-info" style={{ justifyContent: 'center', marginTop: '8px' }}>
                <span className="room-info__label">Room:</span>
                <span className="room-info__code">{roomId}</span>
              </div>
              <p style={{ fontSize: '1rem', fontWeight: 500, opacity: 0.7, marginTop: '8px' }}>{getStatusText()}</p>
            </div>
            <div style={{ width: '100%', maxWidth: '480px', zIndex: 10 }}>
              <div className="drop-zone" style={{ minHeight: '300px' }}>
                <div className="drop-zone__stud drop-zone__stud--tl"></div>
                <div className="drop-zone__stud drop-zone__stud--tr"></div>
                <div className="drop-zone__stud drop-zone__stud--bl"></div>
                <div className="drop-zone__stud drop-zone__stud--br"></div>
                <div className="drop-zone__icon"><span className="material-symbols-outlined">upload_file</span></div>
                <div>
                  <h4 className="drop-zone__title">Select a file to send</h4>
                  <p className="drop-zone__desc">{connected ? 'Choose a file to start the transfer.' : 'Waiting for peer to connect...'}</p>
                </div>
                <div className="drop-zone__divider"></div>
                <button className="drop-zone__browse-btn" onClick={() => fileInputRef.current?.click()}
                  disabled={!connected} style={{ opacity: connected ? 1 : 0.5 }}>
                  <span className="material-symbols-outlined">folder_open</span>Browse Files
                </button>
              </div>
            </div>
            <div className="transfer-page__indicator" style={{ zIndex: 10 }}>
              <span className="transfer-page__indicator-dot"></span>
              <span>{connected ? 'Secure WebRTC Connection Active' : 'Establishing connection...'}</span>
            </div>
          </main>
        </>
      )}

      <input type="file" ref={fileInputRef} className="hidden-input"
        onChange={(e) => { if (e.target.files[0]) handleFileSelect(e.target.files[0]); }} />
    </div>
  );
}

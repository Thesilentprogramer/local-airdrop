import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import TransferPage from './components/TransferPage';
import Header from './components/Header';
import DeviceCard from './components/DeviceCard';
import FileDropZone from './components/FileDropZone';
import { getDeviceInfo } from './webrtc';

function Home() {
  const navigate = useNavigate();
  const [joinRoomId, setJoinRoomId] = useState('');
  const myDevice = getDeviceInfo();

  const generateRoomId = () => Math.random().toString(36).substr(2, 8);

  const handleCreateRoom = () => {
    const id = generateRoomId();
    navigate(`/${id}`);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    const id = joinRoomId.trim();
    if (id) navigate(`/${id}`);
  };

  return (
    <div className="app-shell">
      {/* Desktop header */}
      <div className="desktop-only">
        <Header connected={true} />
      </div>

      {/* Mobile home */}
      <div className="mobile-only mobile-home">
        <div className="mobile-home__header">
          <button className="mobile-icon-btn">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h2 className="mobile-home__title">FILESHARE</h2>
          <button className="mobile-icon-btn">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>

        <div className="mobile-home__body">
          <div className="mobile-send-area">
            <div className="mobile-send-area__orbit mobile-send-area__orbit--outer"></div>
            <div className="mobile-send-area__orbit mobile-send-area__orbit--inner"></div>
            <button className="mobile-send-area__btn" onClick={handleCreateRoom}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>cloud_upload</span>
              <span className="mobile-send-area__label">SEND</span>
            </button>
          </div>

          <div className="mobile-waiting__text">
            <p className="mobile-waiting__heading">READY TO SHARE</p>
            <p className="mobile-waiting__desc">
              Tap send to create a room, or join an existing room below.
            </p>
          </div>

          {/* Join Room */}
          <form className="mobile-join-form" onSubmit={handleJoinRoom}>
            <input
              type="text"
              className="mobile-join-form__input"
              placeholder="Enter room ID..."
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
            />
            <button type="submit" className="mobile-join-form__btn" disabled={!joinRoomId.trim()}>
              <span className="material-symbols-outlined">login</span>
              Join
            </button>
          </form>

          <button className="mobile-select-btn" onClick={handleCreateRoom}>
            <span className="material-symbols-outlined" style={{ fontWeight: 700 }}>add</span>
            <span>Create Room</span>
          </button>
        </div>

        <div className="mobile-footer">
          <div className="mobile-footer__network">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>wifi</span>
            <span>Local Network</span>
          </div>
          <p className="mobile-footer__disc">
            Your device: {myDevice.deviceName} ({myDevice.os})
          </p>
        </div>
      </div>

      {/* Desktop home content */}
      <main className="main-content desktop-only">
        <div className="hero">
          <h1 className="hero__title">Who are we sharing with?</h1>
          <p className="hero__subtitle">
            Create a room or join one to start transferring files.
          </p>
        </div>

        {/* Join / Create Room area */}
        <div className="room-join-section">
          <div className="room-join-card">
            <div className="room-join-card__icon">
              <span className="material-symbols-outlined">add_circle</span>
            </div>
            <h3 className="room-join-card__title">Create Room</h3>
            <p className="room-join-card__desc">Generate a new room ID and share it with your peer.</p>
            <button className="btn btn--primary" onClick={handleCreateRoom} style={{ width: '100%' }}>
              <span className="material-symbols-outlined">rocket_launch</span>
              Create New Room
            </button>
          </div>

          <div className="room-join-card">
            <div className="room-join-card__icon">
              <span className="material-symbols-outlined">login</span>
            </div>
            <h3 className="room-join-card__title">Join Room</h3>
            <p className="room-join-card__desc">Enter a room ID shared by the sender device.</p>
            <form onSubmit={handleJoinRoom} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                className="room-join-input"
                placeholder="e.g. abc123xy"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
              />
              <button type="submit" className="btn btn--outline" disabled={!joinRoomId.trim()}
                style={{ width: '100%', opacity: joinRoomId.trim() ? 1 : 0.5 }}>
                <span className="material-symbols-outlined">link</span>
                Join Room
              </button>
            </form>
          </div>
        </div>

        <div className="content-grid" style={{ marginTop: '48px' }}>
          <div>
            <div className="section-header">
              <h3 className="section-title">How It Works</h3>
            </div>
            <div className="how-it-works">
              <div className="how-step">
                <div className="how-step__num">1</div>
                <div>
                  <h4 className="how-step__title">Create or Join</h4>
                  <p className="how-step__desc">One device creates a room, the other joins with the room ID.</p>
                </div>
              </div>
              <div className="how-step">
                <div className="how-step__num">2</div>
                <div>
                  <h4 className="how-step__title">Select File</h4>
                  <p className="how-step__desc">Choose a file to send once both devices are connected.</p>
                </div>
              </div>
              <div className="how-step">
                <div className="how-step__num">3</div>
                <div>
                  <h4 className="how-step__title">Transfer</h4>
                  <p className="how-step__desc">File transfers directly via WebRTC — fast, private, peer-to-peer.</p>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 className="section-title" style={{ alignSelf: 'flex-start' }}>Your Device</h3>
            <DeviceCard
              name={myDevice.deviceName}
              os={myDevice.os}
              type={myDevice.deviceType === 'laptop_mac' ? 'laptop' : 'desktop'}
            />
          </div>
        </div>
      </main>

      <footer className="footer desktop-only">
        <div className="footer__inner">
          <div className="footer__brand">
            <span className="footer__brand-dot"></span>
            <span>© 2024 Yellow Share PWA</span>
          </div>
          <div className="footer__links">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
          </div>
          <div className="footer__dots">
            <span style={{ background: '#ef4444' }}></span>
            <span style={{ background: '#facc15' }}></span>
            <span style={{ background: '#3b82f6' }}></span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:roomId" element={<TransferPage />} />
      </Routes>
    </Router>
  );
}

export default App;
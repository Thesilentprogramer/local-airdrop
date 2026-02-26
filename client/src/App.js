import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import TransferPage from './components/TransferPage';
import Header from './components/Header';
import DeviceCard from './components/DeviceCard';
import FileDropZone from './components/FileDropZone';

// Sample discovered devices for demo
const DEMO_DEVICES = [
  { id: 1, name: "Mike's MacBook", os: 'macOS Ventura', type: 'laptop' },
  { id: 2, name: "Sarah's Pixel", os: 'Android 14', type: 'phone' },
  { id: 3, name: "Dad's iPad", os: 'iPadOS 17', type: 'tablet' },
  { id: 4, name: 'Living Room TV', os: 'Tizen OS', type: 'tv' },
];

function Home() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);

  const generateRoomId = () => {
    return Math.random().toString(36).substr(2, 8);
  };

  const handleDeviceClick = (device) => {
    const id = generateRoomId();
    navigate(`/${id}#init`);
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    // Auto-create room when file is selected
    const id = generateRoomId();
    navigate(`/${id}#init`);
  };

  return (
    <div className="app-shell">
      <Header connected={true} />

      <main className="main-content">
        {/* Hero */}
        <div className="hero">
          <h1 className="hero__title">Who are we sharing with?</h1>
          <p className="hero__subtitle">
            Discovering nearby devices on your local network. Tap a block to connect.
          </p>
        </div>

        {/* Content Grid */}
        <div className="content-grid">
          {/* Left: Discovered Devices */}
          <div>
            <div className="section-header">
              <h3 className="section-title">Nearby Devices</h3>
              <span className="section-badge">{DEMO_DEVICES.length} Found</span>
            </div>
            <div className="devices-grid">
              {DEMO_DEVICES.map((device) => (
                <DeviceCard
                  key={device.id}
                  name={device.name}
                  os={device.os}
                  type={device.type}
                  onClick={() => handleDeviceClick(device)}
                />
              ))}
              {/* Scanning placeholder */}
              <div className="scanning-card">
                <div className="scanning-card__icon-wrap">
                  <span className="material-symbols-outlined">sync</span>
                </div>
                <h4 className="scanning-card__text">Scanning...</h4>
              </div>
            </div>
          </div>

          {/* Right: Drop Zone */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 className="section-title" style={{ alignSelf: 'flex-start' }}>Your Files</h3>
            <FileDropZone onFileSelect={handleFileSelect} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">
            <span className="footer__brand-dot"></span>
            <span>© 2024 Yellow Share PWA</span>
          </div>
          <div className="footer__links">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">Github</a>
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
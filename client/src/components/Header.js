import React from 'react';

export default function Header({ connected }) {
  return (
    <header className="header">
      <div className="header__brand">
        <div className="header__logo">
          <span className="material-symbols-outlined">share</span>
        </div>
        <h2 className="header__title">Yellow Share</h2>
      </div>
      <div className="header__actions">
        <nav className="header__nav">
          <a href="/">Home</a>
          <a href="#history">History</a>
          <a href="#settings">Settings</a>
        </nav>
        <button className="icon-btn">
          <span className="material-symbols-outlined">settings</span>
        </button>
        <button className="icon-btn">
          <span className="material-symbols-outlined">help</span>
        </button>
        <div className="status-pill">
          <div className="status-pill__dot"></div>
          <span>{connected ? 'Online' : 'Offline'}</span>
        </div>
      </div>
    </header>
  );
}

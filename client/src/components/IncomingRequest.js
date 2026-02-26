import React from 'react';

export default function IncomingRequest({ request, onAccept, onDecline }) {
    if (!request) return null;

    const {
        fileCount = 1,
        totalSize = '0 KB',
        files = [],
        senderDevice = 'Unknown Device',
        senderDeviceType = 'smartphone',
        senderOS = '',
    } = request;

    const fileIcons = {
        image: 'image',
        document: 'description',
        video: 'movie',
        audio: 'music_note',
        archive: 'folder_zip',
        default: 'insert_drive_file',
    };

    return (
        <div className="incoming-overlay" onClick={onDecline}>
            <div className="incoming-card" onClick={(e) => e.stopPropagation()}>
                {/* Desktop layout */}
                <div className="desktop-only">
                    <div className="incoming-card__strip"></div>
                    <div className="incoming-card__body">
                        <div className="incoming-card__info">
                            <div>
                                <div className="incoming-card__badges">
                                    <span className="badge badge--dark">Incoming</span>
                                </div>
                                <h3 className="incoming-card__title">
                                    Sending {fileCount} file{fileCount > 1 ? 's' : ''}
                                </h3>
                                <p className="incoming-card__size">Total size: {totalSize}</p>
                                <div className="incoming-card__previews">
                                    {files.length > 0 ? (
                                        files.slice(0, 4).map((file, i) => (
                                            <div key={i} className="file-preview-icon" title={file.name}>
                                                <span className="material-symbols-outlined">
                                                    {fileIcons[file.type] || fileIcons.default}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="file-preview-icon">
                                            <span className="material-symbols-outlined">insert_drive_file</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="incoming-card__actions">
                                <button className="btn btn--outline" onClick={onDecline}>
                                    <span className="material-symbols-outlined">close</span>
                                    Decline
                                </button>
                                <button className="btn btn--primary" onClick={onAccept}>
                                    <span className="material-symbols-outlined">check_circle</span>
                                    Accept Files
                                </button>
                            </div>
                        </div>
                        <div className="incoming-card__preview-panel">
                            <div
                                className="incoming-card__preview-bg"
                                style={{
                                    backgroundImage: `url('https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=600&q=80')`,
                                }}
                            />
                            <div className="incoming-card__preview-overlay"></div>
                            <div className="incoming-card__sender">
                                <div className="incoming-card__sender-inner">
                                    <div className="incoming-card__sender-icon">
                                        <span className="material-symbols-outlined">{senderDeviceType}</span>
                                    </div>
                                    <div>
                                        <div className="incoming-card__sender-label">From</div>
                                        <div className="incoming-card__sender-name">{senderDevice}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile layout */}
                <div className="mobile-only mobile-incoming">
                    <div className="mobile-incoming__device-circle">
                        <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>{senderDeviceType}</span>
                    </div>
                    <h2 className="mobile-incoming__device-name">{senderDevice}</h2>
                    <div className="mobile-incoming__network-badge">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>lock</span>
                        SAME NETWORK
                    </div>

                    <div className="mobile-incoming__file-card">
                        <div className="mobile-incoming__file-icon">
                            <span className="material-symbols-outlined">description</span>
                        </div>
                        <div className="mobile-incoming__file-info">
                            <p className="mobile-incoming__file-name">
                                {files.length > 0 ? files[0].name : 'File'}
                            </p>
                            <div className="mobile-incoming__file-meta">
                                <span className="mobile-incoming__file-badge">
                                    {files.length > 0 && files[0].name ? files[0].name.split('.').pop().toUpperCase() : 'FILE'}
                                </span>
                                <span>{totalSize}</span>
                            </div>
                        </div>
                    </div>

                    <button className="mobile-incoming__accept" onClick={onAccept}>
                        <span className="material-symbols-outlined">download</span>
                        ACCEPT TRANSFER
                    </button>
                    <button className="mobile-incoming__decline" onClick={onDecline}>
                        DECLINE
                    </button>
                    <p className="mobile-incoming__note">File saves to Downloads</p>
                </div>
            </div>
        </div>
    );
}

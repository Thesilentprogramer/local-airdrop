import React, { useRef, useState } from 'react';

export default function FileDropZone({ onFileSelect }) {
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleBrowse = () => {
        fileInputRef.current?.click();
    };

    const handleInputChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files[0]);
        }
    };

    return (
        <div
            className={`drop-zone ${isDragging ? 'drop-zone--active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="drop-zone__stud drop-zone__stud--tl"></div>
            <div className="drop-zone__stud drop-zone__stud--tr"></div>
            <div className="drop-zone__stud drop-zone__stud--bl"></div>
            <div className="drop-zone__stud drop-zone__stud--br"></div>

            <div className="drop-zone__icon">
                <span className="material-symbols-outlined">upload_file</span>
            </div>

            <div>
                <h4 className="drop-zone__title">Drop files here</h4>
                <p className="drop-zone__desc">
                    Drag and drop your files into this block to start sharing immediately.
                </p>
            </div>

            <div className="drop-zone__divider"></div>

            <button className="drop-zone__browse-btn" onClick={handleBrowse}>
                <span className="material-symbols-outlined">folder_open</span>
                Browse Files
            </button>

            <p className="drop-zone__limit">Maximum file size: Unlimited</p>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden-input"
                onChange={handleInputChange}
            />
        </div>
    );
}

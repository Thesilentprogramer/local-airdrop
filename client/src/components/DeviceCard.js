import React from 'react';

const DEVICE_IMAGES = {
    laptop: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?auto=format&fit=crop&w=600&q=80',
    phone: 'https://images.unsplash.com/photo-1598327105666-5b89351aff23?auto=format&fit=crop&w=600&q=80',
    tablet: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80',
    tv: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=600&q=80',
};

const DEVICE_ICONS = {
    laptop: 'laptop_mac',
    phone: 'smartphone',
    tablet: 'tablet_mac',
    tv: 'tv',
};

export default function DeviceCard({ name, os, type = 'laptop', onClick }) {
    return (
        <button className="device-card" onClick={onClick}>
            <div className="device-card__arrow">
                <span className="material-symbols-outlined">arrow_outward</span>
            </div>
            <div className="device-card__image">
                <div
                    className="device-card__image-bg"
                    style={{ backgroundImage: `url('${DEVICE_IMAGES[type] || DEVICE_IMAGES.laptop}')` }}
                />
            </div>
            <h4 className="device-card__name">{name}</h4>
            <div className="device-card__info">
                <span className="material-symbols-outlined">{DEVICE_ICONS[type] || 'devices'}</span>
                <span>{os}</span>
            </div>
        </button>
    );
}

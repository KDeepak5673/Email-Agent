import React from 'react';
import './Dialog.css';

export default function Dialog({ open, type, title, message, onClose }) {
    if (!open) return null;

    return (
        <div className="dialog-overlay" onClick={onClose}>
            <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
                <div className="dialog-header">
                    <div className={`dialog-icon ${type}`}>
                        {type === 'success' && '✅'}
                        {type === 'error' && '❌'}
                        {type === 'warning' && '⚠️'}
                        {type === 'info' && 'ℹ️'}
                    </div>
                    <h3 className="dialog-title">{title}</h3>
                    <button onClick={onClose} className="dialog-close-btn">×</button>
                </div>
                <div className="dialog-content">
                    <p>{message}</p>
                </div>
                <div className="dialog-actions">
                    <button onClick={onClose} className="dialog-ok-btn">OK</button>
                </div>
            </div>
        </div>
    );
}

import { useState } from 'react';
import { formatDate } from '../App';

function encodeEvent(event) {
  const data = {
    name: event.name,
    date: event.date,
    category: event.category,
    icon: event.icon,
    color: event.color,
  };
  return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}

export default function ShareModal({ event, onClose }) {
  const [copied, setCopied] = useState(false);

  const encoded = encodeEvent(event);
  const shareUrl = `${window.location.origin}${window.location.pathname}#share=${encoded}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the input
      const input = document.getElementById('share-link-field');
      if (input) {
        input.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal share-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title">Share Countdown</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          <div className="share-preview">
            <span className="share-preview-icon">{event.icon}</span>
            <div className="share-preview-info">
              <div className="share-preview-name">{event.name}</div>
              <div className="share-preview-date">{formatDate(event.date)}</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Share Link</label>
            <div className="share-link-wrap">
              <input
                id="share-link-field"
                className="share-link-input"
                type="text"
                value={shareUrl}
                readOnly
                onClick={e => e.target.select()}
              />
              <button
                className={`btn-copy${copied ? ' copied' : ''}`}
                onClick={handleCopy}
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <p className="share-tip">
            Anyone with this link can open the app and add this countdown to their list. The event data is encoded directly in the URL — no account needed.
          </p>

          <div className="modal-actions">
            <button className="btn-cancel" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

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

export default function EmbedModal({ event, onClose }) {
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const encoded = encodeEvent(event);
  const origin = window.location.origin + window.location.pathname;
  const embedSrc = `${origin}#embed=${encoded}`;
  const iframeSnippet = `<iframe src="${embedSrc}" width="300" height="180" frameborder="0"></iframe>`;

  async function copyText(text, setCopied) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal share-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title">Embed Widget</h2>
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
            <label className="form-label">Embed Code</label>
            <div className="share-link-wrap">
              <input
                className="share-link-input"
                type="text"
                value={iframeSnippet}
                readOnly
                onClick={e => e.target.select()}
              />
              <button
                className={`btn-copy${copiedEmbed ? ' copied' : ''}`}
                onClick={() => copyText(iframeSnippet, setCopiedEmbed)}
              >
                {copiedEmbed ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Direct Link</label>
            <div className="share-link-wrap">
              <input
                className="share-link-input"
                type="text"
                value={embedSrc}
                readOnly
                onClick={e => e.target.select()}
              />
              <button
                className={`btn-copy${copiedLink ? ' copied' : ''}`}
                onClick={() => copyText(embedSrc, setCopiedLink)}
              >
                {copiedLink ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <p className="share-tip">
            Paste the embed code into any website to show a live countdown widget. The widget renders with no header or navigation — just the countdown itself.
          </p>

          <div className="modal-actions">
            <button className="btn-cancel" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

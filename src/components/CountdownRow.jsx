import { useState, useEffect } from 'react';
import { getTimeLeft, formatDate, getCategoryColor } from '../App';

export default function CountdownRow({ event, onEdit, onDelete, onPin, onShare }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(event.date));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(event.date));
    }, 1000);
    return () => clearInterval(interval);
  }, [event.date]);

  const accentColor = event.color || getCategoryColor(event.category);

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  return (
    <div
      className="countdown-row"
      style={{ '--row-accent': accentColor }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: accentColor,
          borderRadius: '8px 0 0 8px',
        }}
      />

      <span className="row-icon">{event.icon}</span>

      <div className="row-info">
        <div className="row-name" title={event.name}>{event.name}</div>
        <div className="row-meta">
          <span className="row-meta-cat" style={{ color: accentColor }}>
            {event.category}
          </span>
          <span>·</span>
          <span>{formatDate(event.date)}</span>
        </div>
      </div>

      {timeLeft.expired ? (
        <div className="row-expired">
          <span>🎉</span>
          <span>Arrived!</span>
        </div>
      ) : (
        <div className="row-countdown">
          <div className="row-unit">
            <span className="row-number" style={{ color: accentColor }}>{pad(timeLeft.days)}</span>
            <span className="row-label">d</span>
          </div>
          <span className="row-sep">:</span>
          <div className="row-unit">
            <span className="row-number" style={{ color: accentColor }}>{pad(timeLeft.hours)}</span>
            <span className="row-label">h</span>
          </div>
          <span className="row-sep">:</span>
          <div className="row-unit">
            <span className="row-number" style={{ color: accentColor }}>{pad(timeLeft.minutes)}</span>
            <span className="row-label">m</span>
          </div>
          <span className="row-sep">:</span>
          <div className="row-unit">
            <span className="row-number seconds" style={{ color: accentColor }}>{pad(timeLeft.seconds)}</span>
            <span className="row-label">s</span>
          </div>
        </div>
      )}

      <div className="row-actions">
        <button
          className={`row-action-btn${event.pinned ? ' pinned' : ''}`}
          onClick={() => onPin(event.id)}
          title={event.pinned ? 'Unpin' : 'Pin'}
        >
          {event.pinned ? '📌' : '📍'}
        </button>
        <button
          className="row-action-btn"
          onClick={() => onShare(event)}
          title="Share"
        >
          ↗
        </button>
        <button
          className="row-action-btn"
          onClick={() => onEdit(event)}
          title="Edit"
        >
          ✎
        </button>
        <button
          className="row-action-btn"
          onClick={() => onDelete(event.id)}
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

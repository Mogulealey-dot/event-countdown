import { useState, useEffect } from 'react';
import { getTimeLeft, formatDate, getCategoryColor } from '../App';

export default function CountdownCard({ event, onEdit, onDelete, onPin, onShare }) {
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
    <div className="countdown-card">
      <div className="card-top-border" style={{ background: accentColor }} />
      <div className="card-body">
        <div className="card-header">
          <div className="card-icon-name">
            <span className="card-icon">{event.icon}</span>
            <div className="card-name-wrap">
              <div className="card-name" title={event.name}>{event.name}</div>
              <div className="card-category" style={{ color: accentColor }}>
                {event.category}
              </div>
            </div>
          </div>
          <div className="card-actions">
            <button
              className={`card-action-btn${event.pinned ? ' pinned' : ''}`}
              onClick={() => onPin(event.id)}
              title={event.pinned ? 'Unpin' : 'Pin'}
            >
              {event.pinned ? '📌' : '📍'}
            </button>
            <button
              className="card-action-btn"
              onClick={() => onShare(event)}
              title="Share"
            >
              ↗
            </button>
            <button
              className="card-action-btn"
              onClick={() => onEdit(event)}
              title="Edit"
            >
              ✎
            </button>
            <button
              className="card-action-btn"
              onClick={() => onDelete(event.id)}
              title="Delete"
            >
              ✕
            </button>
          </div>
        </div>

        {timeLeft.expired ? (
          <div className="expired-banner">
            <span className="expired-emoji">🎉</span>
            <div className="expired-text">Event has arrived!</div>
            <div className="expired-sub">{event.name}</div>
          </div>
        ) : (
          <div className="countdown-numbers">
            <div className="countdown-unit">
              <span className="countdown-number" style={{ color: accentColor }}>
                {pad(timeLeft.days)}
              </span>
              <span className="countdown-label">Days</span>
            </div>
            <div className="countdown-unit">
              <span className="countdown-number" style={{ color: accentColor }}>
                {pad(timeLeft.hours)}
              </span>
              <span className="countdown-label">Hours</span>
            </div>
            <div className="countdown-unit">
              <span className="countdown-number" style={{ color: accentColor }}>
                {pad(timeLeft.minutes)}
              </span>
              <span className="countdown-label">Mins</span>
            </div>
            <div className="countdown-unit">
              <span className="countdown-number seconds" style={{ color: accentColor }}>
                {pad(timeLeft.seconds)}
              </span>
              <span className="countdown-label">Secs</span>
            </div>
          </div>
        )}

        <div className="card-date">
          <span className="card-date-icon">📅</span>
          {formatDate(event.date)}
        </div>
      </div>
    </div>
  );
}

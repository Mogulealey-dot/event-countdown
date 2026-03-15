import { useState, useEffect } from 'react';
import { getTimeLeft, formatDate, getCategoryColor, getMilestone } from '../App';

export default function CountdownCard({
  event, onEdit, onDelete, onPin, onShare, onEmbed, onConfetti,
  onDragStart, onDragEnter, onDragEnd,
}) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(event.date));

  useEffect(() => {
    const interval = setInterval(() => {
      const tl = getTimeLeft(event.date);
      setTimeLeft(tl);
      if (tl.expired) onConfetti?.(event.id);
    }, 1000);
    return () => clearInterval(interval);
  }, [event.date, event.id, onConfetti]);

  // Trigger confetti once if already expired on mount
  useEffect(() => {
    const tl = getTimeLeft(event.date);
    if (tl.expired) onConfetti?.(event.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const accentColor = event.color || getCategoryColor(event.category);
  const milestone = getMilestone(timeLeft);
  const cat = event.category;

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  return (
    <div
      className={`countdown-card card-theme-${cat.toLowerCase()}`}
      draggable
      onDragStart={() => onDragStart?.(event.id)}
      onDragEnter={() => onDragEnter?.(event.id)}
      onDragEnd={onDragEnd}
      onDragOver={e => e.preventDefault()}
    >
      <div className="card-top-border" style={{ background: accentColor }} />
      <div className="card-body">
        <div className="card-header">
          <div className="card-icon-name">
            <span className="card-icon">{event.icon}</span>
            <div className="card-name-wrap">
              <div className="card-name" title={event.name}>{event.name}</div>
              <div className="card-category" style={{ color: accentColor }}>
                {event.category}
                {event.recurring === 'yearly' && (
                  <span className="recurring-badge" title="Repeats yearly"> 🔁</span>
                )}
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
              onClick={() => onEmbed?.(event)}
              title="Embed"
            >
              {'</>'}
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

        {milestone && (
          <div
            className="milestone-badge"
            style={{
              '--milestone-color': accentColor,
              borderColor: accentColor,
              color: accentColor,
            }}
          >
            {milestone.emoji} {milestone.text}
          </div>
        )}

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

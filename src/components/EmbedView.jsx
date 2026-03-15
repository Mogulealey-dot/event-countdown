import { useState, useEffect } from 'react';
import { getTimeLeft, getCategoryColor } from '../App';

export default function EmbedView({ event }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(event.date));

  useEffect(() => {
    const iv = setInterval(() => setTimeLeft(getTimeLeft(event.date)), 1000);
    return () => clearInterval(iv);
  }, [event.date]);

  const accentColor = event.color || getCategoryColor(event.category);

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  return (
    <div className="embed-view" style={{ '--accent': accentColor }}>
      <div className="embed-top-bar" style={{ background: accentColor }} />
      <div className="embed-body">
        <div className="embed-header">
          <span className="embed-icon">{event.icon}</span>
          <div className="embed-name" title={event.name}>{event.name}</div>
        </div>
        {timeLeft.expired ? (
          <div className="embed-expired">
            <span>🎉</span>
            <span>Event has arrived!</span>
          </div>
        ) : (
          <div className="embed-numbers">
            {[
              { n: timeLeft.days, label: 'Days' },
              { n: timeLeft.hours, label: 'Hrs' },
              { n: timeLeft.minutes, label: 'Min' },
              { n: timeLeft.seconds, label: 'Sec' },
            ].map(({ n, label }) => (
              <div key={label} className="embed-unit">
                <span className="embed-number" style={{ color: accentColor }}>{pad(n)}</span>
                <span className="embed-label">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

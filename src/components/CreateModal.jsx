import { useState, useEffect } from 'react';
import { CATEGORIES } from '../App';

const EMOJI_PRESETS = ['🎂', '🎆', '✈️', '💼', '🏆', '🎵', '🎮', '🚀', '❤️', '🌟', '🎉', '📚', '🏖️', '🎓', '💍', '🌍'];

const COLOR_SWATCHES = [
  { label: 'Birthday', color: '#f56565' },
  { label: 'Holiday', color: '#f5a623' },
  { label: 'Travel', color: '#34c972' },
  { label: 'Work', color: '#7c6af7' },
  { label: 'Personal', color: '#63b3ed' },
  { label: 'Sports', color: '#fc8181' },
];

function toLocalDatetimeValue(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CreateModal({ event, onSave, onClose }) {
  const isEdit = !!event;

  const [name, setName] = useState(event?.name || '');
  const [date, setDate] = useState(event ? toLocalDatetimeValue(event.date) : '');
  const [category, setCategory] = useState(event?.category || 'Personal');
  const [icon, setIcon] = useState(event?.icon || '🎉');
  const [color, setColor] = useState(event?.color || '#7c6af7');
  const [customEmoji, setCustomEmoji] = useState('');

  // Auto-set color when category changes
  useEffect(() => {
    const cat = CATEGORIES.find(c => c.id === category);
    if (cat && !isEdit) {
      setColor(cat.color);
    }
  }, [category, isEdit]);

  // Auto-set icon when category changes (only if not edited manually)
  useEffect(() => {
    const cat = CATEGORIES.find(c => c.id === category);
    if (cat && !isEdit) {
      setIcon(cat.defaultIcon);
    }
  }, [category, isEdit]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !date) return;

    const eventData = {
      name: name.trim(),
      date: new Date(date).toISOString(),
      category,
      icon,
      color,
    };

    onSave(eventData);
  }

  function handleEmojiSelect(emoji) {
    setIcon(emoji);
    setCustomEmoji('');
  }

  function handleCustomEmojiChange(e) {
    const val = e.target.value;
    setCustomEmoji(val);
    if (val.trim()) {
      // Get the first "grapheme" (emoji character)
      const chars = [...val.trim()];
      if (chars.length > 0) setIcon(chars[0]);
    }
  }

  const isValid = name.trim() && date;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Event' : 'New Countdown'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="event-name">Event Name</label>
            <input
              id="event-name"
              className="form-input"
              type="text"
              placeholder="e.g. Summer Vacation, Birthday Party…"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              maxLength={60}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="event-date">Date & Time</label>
              <input
                id="event-date"
                className="form-input"
                type="datetime-local"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="event-category">Category</label>
              <select
                id="event-category"
                className="form-select"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Icon</label>
            <div className="emoji-picker">
              {EMOJI_PRESETS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  className={`emoji-option${icon === emoji ? ' selected' : ''}`}
                  onClick={() => handleEmojiSelect(emoji)}
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                className="emoji-custom-input"
                type="text"
                placeholder="Or type…"
                value={customEmoji}
                onChange={handleCustomEmojiChange}
                maxLength={4}
              />
              {customEmoji && (
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                  → <strong style={{ color: 'var(--text-primary)' }}>{icon}</strong>
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Accent Color</label>
            <div className="color-swatches">
              {COLOR_SWATCHES.map(s => (
                <button
                  key={s.color}
                  type="button"
                  className={`color-swatch${color === s.color ? ' selected' : ''}`}
                  style={{ backgroundColor: s.color }}
                  onClick={() => setColor(s.color)}
                  title={s.label}
                />
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={!isValid}>
              {isEdit ? 'Save Changes' : 'Create Countdown'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

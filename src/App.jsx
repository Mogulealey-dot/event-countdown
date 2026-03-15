import { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import CountdownCard from './components/CountdownCard';
import CountdownRow from './components/CountdownRow';
import CreateModal from './components/CreateModal';
import ShareModal from './components/ShareModal';
import EmbedModal from './components/EmbedModal';
import EmbedView from './components/EmbedView';
import FilterBar from './components/FilterBar';
import Confetti from './components/Confetti';

// ===== CONSTANTS =====
export const CATEGORIES = [
  { id: 'Birthday',  label: 'Birthday',  color: '#f56565', defaultIcon: '🎂' },
  { id: 'Holiday',   label: 'Holiday',   color: '#f5a623', defaultIcon: '🎆' },
  { id: 'Travel',    label: 'Travel',    color: '#34c972', defaultIcon: '✈️' },
  { id: 'Work',      label: 'Work',      color: '#7c6af7', defaultIcon: '💼' },
  { id: 'Personal',  label: 'Personal',  color: '#63b3ed', defaultIcon: '⭐' },
  { id: 'Sports',    label: 'Sports',    color: '#fc8181', defaultIcon: '🏆' },
  { id: 'Other',     label: 'Other',     color: '#a0aec0', defaultIcon: '📌' },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

export function getCategoryColor(categoryId) {
  return CATEGORY_MAP[categoryId]?.color ?? '#a0aec0';
}

export function getTimeLeft(dateStr) {
  const diff = new Date(dateStr) - new Date();
  if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { expired: false, days, hours, minutes, seconds };
}

export function formatDate(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ===== MILESTONE DETECTION =====
export function getMilestone(timeLeft) {
  if (timeLeft.expired) return null;
  const { days, hours, minutes, seconds } = timeLeft;
  if (days === 100 && hours === 0 && minutes === 0) return { emoji: '🎯', text: '100 days!' };
  if (days === 30 && hours === 0) return { emoji: '📅', text: '1 month!' };
  if (days === 7 && hours === 0) return { emoji: '📅', text: '1 week!' };
  if (days === 0 && hours === 24 && minutes === 0) return { emoji: '🔥', text: '24 hours!' };
  if (days === 0 && hours === 1 && minutes === 0) return { emoji: '⚡', text: '1 hour!' };
  return null;
}

// ===== RECURRING: advance expired yearly events =====
function advanceRecurringEvents(events) {
  return events.map(e => {
    if (e.recurring !== 'yearly') return e;
    const t = getTimeLeft(e.date);
    if (!t.expired) return e;
    const original = new Date(e.date);
    const now = new Date();
    let advanced = new Date(original);
    while (advanced <= now) {
      advanced = new Date(advanced);
      advanced.setFullYear(advanced.getFullYear() + 1);
    }
    return { ...e, date: advanced.toISOString() };
  });
}

// ===== SAMPLE EVENTS =====
const SAMPLE_EVENTS = [
  {
    id: generateId(),
    name: 'New Year 2027',
    date: new Date('2027-01-01T00:00:00').toISOString(),
    category: 'Holiday',
    icon: '🎆',
    color: '#f5a623',
    pinned: false,
    recurring: 'none',
    reminder: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: 'Summer Vacation',
    date: new Date('2026-07-15T08:00:00').toISOString(),
    category: 'Travel',
    icon: '✈️',
    color: '#34c972',
    pinned: false,
    recurring: 'none',
    reminder: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: 'Project Deadline',
    date: new Date('2026-04-30T17:00:00').toISOString(),
    category: 'Work',
    icon: '💼',
    color: '#7c6af7',
    pinned: true,
    recurring: 'none',
    reminder: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: 'Birthday Party',
    date: new Date('2026-05-20T19:00:00').toISOString(),
    category: 'Birthday',
    icon: '🎂',
    color: '#f56565',
    pinned: false,
    recurring: 'yearly',
    reminder: null,
    createdAt: new Date().toISOString(),
  },
];

const STORAGE_KEY = 'ec_events';
const ORDER_KEY = 'ec_order';
const THEME_KEY = 'ec_theme';

function loadEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveEvents(events) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {}
}

function loadOrder() {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveOrder(order) {
  try {
    localStorage.setItem(ORDER_KEY, JSON.stringify(order));
  } catch {}
}

function parseShareHash() {
  const hash = window.location.hash;
  if (!hash.startsWith('#share=')) return null;
  try {
    const encoded = hash.slice('#share='.length);
    const json = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function parseEmbedHash() {
  const hash = window.location.hash;
  if (!hash.startsWith('#embed=')) return null;
  try {
    const encoded = hash.slice('#embed='.length);
    const json = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// ===== NOTIFICATIONS =====
function checkNotifications(events) {
  if (!('Notification' in window)) return;
  const fired = (() => {
    try { return JSON.parse(sessionStorage.getItem('ec_notifs') || '[]'); } catch { return []; }
  })();
  const now = new Date();
  const toFire = [];

  for (const e of events) {
    if (!e.reminder) continue;
    const eventDate = new Date(e.date);
    const diffMs = eventDate - now;
    const diffDays = diffMs / 86400000;
    const thresholds = e.reminder.days ? [e.reminder.days] : [];
    if (e.reminder.preset === '1day') thresholds.push(1);
    if (e.reminder.preset === '1week') thresholds.push(7);

    for (const t of thresholds) {
      const key = `${e.id}-${t}`;
      if (fired.includes(key)) continue;
      if (diffDays <= t && diffDays >= 0) {
        toFire.push({ key, name: e.name, days: Math.ceil(diffDays) });
      }
    }
  }

  if (toFire.length === 0) return;

  function sendNotifs() {
    const newFired = [...fired];
    for (const n of toFire) {
      try {
        new Notification(n.name, {
          body: n.days <= 1 ? 'Happening today!' : `${n.days} day${n.days !== 1 ? 's' : ''} to go!`,
          icon: '/favicon.ico',
        });
      } catch {}
      newFired.push(n.key);
    }
    sessionStorage.setItem('ec_notifs', JSON.stringify(newFired));
  }

  if (Notification.permission === 'granted') {
    sendNotifs();
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') sendNotifs();
    });
  }
}

// ===== CONFIRM DELETE MODAL =====
function ConfirmModal({ eventName, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal confirm-modal" role="dialog" aria-modal="true">
        <div className="confirm-body">
          <div className="confirm-icon">🗑️</div>
          <div className="confirm-title">Delete Countdown?</div>
          <div className="confirm-sub">
            &ldquo;{eventName}&rdquo; will be permanently removed. This cannot be undone.
          </div>
          <div className="confirm-actions">
            <button className="btn-cancel" onClick={onCancel}>Cancel</button>
            <button className="btn-delete" onClick={onConfirm}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== IMPORT BANNER =====
function ImportBanner({ sharedEvent, onAdd, onDismiss }) {
  return (
    <div className="import-banner">
      <span className="import-banner-icon">{sharedEvent.icon}</span>
      <div className="import-banner-info">
        <div className="import-banner-title">Shared countdown: {sharedEvent.name}</div>
        <div className="import-banner-sub">
          {formatDate(sharedEvent.date)} &middot; {sharedEvent.category}
        </div>
      </div>
      <div className="import-banner-actions">
        <button className="btn-import" onClick={onAdd}>Add to my list</button>
        <button className="btn-dismiss" onClick={onDismiss}>Dismiss</button>
      </div>
    </div>
  );
}

// ===== MAIN APP =====
export default function App() {
  // ---- Embed mode ----
  const embedEvent = parseEmbedHash();
  if (embedEvent) {
    return <EmbedView event={embedEvent} />;
  }

  const [events, setEvents] = useState(() => {
    const saved = loadEvents();
    const base = saved ?? SAMPLE_EVENTS;
    return advanceRecurringEvents(base);
  });

  const [view, setView] = useState('grid');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('soonest');
  const [search, setSearch] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [sharingEvent, setSharingEvent] = useState(null);
  const [embeddingEvent, setEmbeddingEvent] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [sharedImport, setSharedImport] = useState(null);
  const [confettiIds, setConfettiIds] = useState([]);

  // Custom drag order: array of ids
  const [customOrder, setCustomOrder] = useState(() => loadOrder() || null);

  // Theme
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) || 'dark'; } catch { return 'dark'; }
  });

  // Apply theme class to body
  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light');
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
  }, [theme]);

  // Check for share/embed hash on mount
  useEffect(() => {
    const shared = parseShareHash();
    if (shared) {
      setSharedImport(shared);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Persist events to localStorage
  useEffect(() => {
    saveEvents(events);
  }, [events]);

  // Check recurring events every minute
  useEffect(() => {
    const check = () => {
      setEvents(prev => advanceRecurringEvents(prev));
    };
    const iv = setInterval(check, 60000);
    return () => clearInterval(iv);
  }, []);

  // Check notifications on load and every minute
  useEffect(() => {
    checkNotifications(events);
    const iv = setInterval(() => checkNotifications(events), 60000);
    return () => clearInterval(iv);
  }, [events]);

  // ===== EVENT HANDLERS =====
  const handleCreate = useCallback((data) => {
    const newEvent = {
      ...data,
      id: generateId(),
      pinned: false,
      createdAt: new Date().toISOString(),
    };
    setEvents(prev => [newEvent, ...prev]);
    setShowCreate(false);
  }, []);

  const handleEdit = useCallback((data) => {
    setEvents(prev => prev.map(e =>
      e.id === editingEvent.id ? { ...e, ...data } : e
    ));
    setEditingEvent(null);
  }, [editingEvent]);

  const handleDelete = useCallback((id) => {
    setDeletingId(id);
  }, []);

  const confirmDelete = useCallback(() => {
    setEvents(prev => prev.filter(e => e.id !== deletingId));
    setCustomOrder(prev => {
      if (!prev) return prev;
      const next = prev.filter(id => id !== deletingId);
      saveOrder(next);
      return next;
    });
    setDeletingId(null);
  }, [deletingId]);

  const handlePin = useCallback((id) => {
    setEvents(prev => prev.map(e =>
      e.id === id ? { ...e, pinned: !e.pinned } : e
    ));
  }, []);

  const handleAddShared = useCallback(() => {
    const newEvent = {
      ...sharedImport,
      id: generateId(),
      pinned: false,
      recurring: 'none',
      reminder: null,
      createdAt: new Date().toISOString(),
    };
    setEvents(prev => [newEvent, ...prev]);
    setSharedImport(null);
  }, [sharedImport]);

  // Confetti: trigger once per session per event
  const handleConfetti = useCallback((id) => {
    const key = `ec_confetti_${id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    setConfettiIds(prev => [...prev, id]);
  }, []);

  const handleConfettiDone = useCallback((id) => {
    setConfettiIds(prev => prev.filter(x => x !== id));
  }, []);

  // ===== EXPORT/IMPORT =====
  function handleExport() {
    const json = JSON.stringify(events, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'countdowns.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  const importInputRef = useRef(null);

  function handleImportClick() {
    importInputRef.current?.click();
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!Array.isArray(imported)) return;
        setEvents(prev => {
          const existingIds = new Set(prev.map(x => x.id));
          const merged = [...prev];
          for (const evt of imported) {
            if (!existingIds.has(evt.id) && evt.id && evt.name && evt.date) {
              merged.push({
                recurring: 'none',
                reminder: null,
                ...evt,
              });
            }
          }
          return merged;
        });
      } catch {}
    };
    reader.readAsText(file);
    // Reset so same file can be re-imported
    e.target.value = '';
  }

  // ===== DRAG & DROP =====
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  function handleDragStart(id) {
    dragItem.current = id;
  }

  function handleDragEnter(id) {
    dragOverItem.current = id;
  }

  function handleDragEnd() {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    // Build order from currently displayed ids
    const displayedIds = displayedEvents.map(e => e.id);
    const fromIdx = displayedIds.indexOf(dragItem.current);
    const toIdx = displayedIds.indexOf(dragOverItem.current);
    if (fromIdx === -1 || toIdx === -1) return;

    const newOrder = [...displayedIds];
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, dragItem.current);

    // Merge with events not currently displayed (different filter/search)
    const allIds = events.map(e => e.id);
    const notDisplayed = allIds.filter(id => !displayedIds.includes(id));
    const fullOrder = [...newOrder, ...notDisplayed];

    setCustomOrder(fullOrder);
    saveOrder(fullOrder);
    dragItem.current = null;
    dragOverItem.current = null;
  }

  // ===== FILTER, SORT & SEARCH =====
  const filteredEvents = events
    .filter(e => filter === 'all' || e.category === filter)
    .filter(e => !search.trim() || e.name.toLowerCase().includes(search.trim().toLowerCase()));

  // Apply custom order if sort is not active (custom order only when sort=soonest and order exists)
  let displayedEvents;
  if (customOrder && sort === 'soonest' && !search.trim() && filter === 'all') {
    const orderMap = Object.fromEntries(customOrder.map((id, i) => [id, i]));
    displayedEvents = [...filteredEvents].sort((a, b) => {
      const ia = orderMap[a.id] ?? 999999;
      const ib = orderMap[b.id] ?? 999999;
      return ia - ib;
    });
  } else {
    displayedEvents = [...filteredEvents].sort((a, b) => {
      if (sort === 'pinned') {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
      }
      const tA = new Date(a.date) - new Date();
      const tB = new Date(b.date) - new Date();
      if (sort === 'latest') return tB - tA;
      if (sort === 'created') return new Date(b.createdAt) - new Date(a.createdAt);
      const aExpired = tA <= 0;
      const bExpired = tB <= 0;
      if (aExpired && !bExpired) return 1;
      if (!aExpired && bExpired) return -1;
      return tA - tB;
    });
  }

  const deletingEvent = events.find(e => e.id === deletingId);

  const commonCardProps = (event) => ({
    event,
    onEdit: setEditingEvent,
    onDelete: handleDelete,
    onPin: handlePin,
    onShare: setSharingEvent,
    onEmbed: setEmbeddingEvent,
    onConfetti: handleConfetti,
    onDragStart: handleDragStart,
    onDragEnter: handleDragEnter,
    onDragEnd: handleDragEnd,
  });

  return (
    <div className="app">
      {/* Confetti layers */}
      {confettiIds.map(id => (
        <Confetti key={id} onDone={() => handleConfettiDone(id)} />
      ))}

      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="header-logo">
            <span className="header-logo-icon">⏳</span>
            <span className="header-logo-text">
              Countdown <span>by Mogulealey</span>
            </span>
          </div>
          <div className="header-actions">
            <button
              className="btn-theme-toggle"
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              className="btn-create"
              onClick={() => setShowCreate(true)}
            >
              <span className="plus-icon">+</span>
              <span>New Countdown</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="main">
        {/* Shared import banner */}
        {sharedImport && (
          <ImportBanner
            sharedEvent={sharedImport}
            onAdd={handleAddShared}
            onDismiss={() => setSharedImport(null)}
          />
        )}

        {/* Filter bar */}
        {events.length > 0 && (
          <FilterBar
            filter={filter}
            setFilter={setFilter}
            sort={sort}
            setSort={setSort}
            view={view}
            setView={setView}
            events={events}
            search={search}
            setSearch={setSearch}
          />
        )}

        {/* Import/Export toolbar */}
        {events.length > 0 && (
          <div className="io-toolbar">
            <button className="btn-io" onClick={handleExport} title="Export all events as JSON">
              ⬇ Export JSON
            </button>
            <button className="btn-io" onClick={handleImportClick} title="Import events from JSON file">
              ⬆ Import JSON
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />
          </div>
        )}

        {/* Events count */}
        {displayedEvents.length > 0 && (
          <div className="events-count">
            {search.trim()
              ? <>Search results: <span>{displayedEvents.length}</span> of <span>{events.length}</span> countdown{events.length !== 1 ? 's' : ''}</>
              : <>Showing <span>{displayedEvents.length}</span> of <span>{events.length}</span> countdown{events.length !== 1 ? 's' : ''}</>
            }
          </div>
        )}

        {/* Empty state — no events at all */}
        {events.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">⏳</span>
            <div className="empty-title">No countdowns yet</div>
            <p className="empty-sub">Create your first countdown to start tracking important events.</p>
            <button
              className="btn-empty-create"
              onClick={() => setShowCreate(true)}
            >
              <span>+</span>
              Create a Countdown
            </button>
          </div>
        )}

        {/* No results after filtering/search */}
        {events.length > 0 && displayedEvents.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <div className="empty-title">
              {search.trim() ? 'No events match your search' : 'No countdowns in this category'}
            </div>
            <p className="empty-sub">
              {search.trim()
                ? 'Try a different search term or clear the search.'
                : 'Try selecting a different category or create a new countdown.'}
            </p>
            <button className="btn-empty-create" onClick={() => { setFilter('all'); setSearch(''); }}>
              Show all
            </button>
          </div>
        )}

        {/* Grid view */}
        {view === 'grid' && displayedEvents.length > 0 && (
          <div className="events-grid">
            {displayedEvents.map(event => (
              <CountdownCard key={event.id} {...commonCardProps(event)} />
            ))}
          </div>
        )}

        {/* List view */}
        {view === 'list' && displayedEvents.length > 0 && (
          <div className="events-list">
            {displayedEvents.map(event => (
              <CountdownRow key={event.id} {...commonCardProps(event)} />
            ))}
          </div>
        )}
      </main>

      {/* Create modal */}
      {showCreate && (
        <CreateModal
          onSave={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* Edit modal */}
      {editingEvent && (
        <CreateModal
          event={editingEvent}
          onSave={handleEdit}
          onClose={() => setEditingEvent(null)}
        />
      )}

      {/* Share modal */}
      {sharingEvent && (
        <ShareModal
          event={sharingEvent}
          onClose={() => setSharingEvent(null)}
        />
      )}

      {/* Embed modal */}
      {embeddingEvent && (
        <EmbedModal
          event={embeddingEvent}
          onClose={() => setEmbeddingEvent(null)}
        />
      )}

      {/* Confirm delete */}
      {deletingId && deletingEvent && (
        <ConfirmModal
          eventName={deletingEvent.name}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}

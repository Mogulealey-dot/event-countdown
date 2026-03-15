import { useState, useEffect, useCallback } from 'react';
import './App.css';
import CountdownCard from './components/CountdownCard';
import CountdownRow from './components/CountdownRow';
import CreateModal from './components/CreateModal';
import ShareModal from './components/ShareModal';
import FilterBar from './components/FilterBar';

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
    createdAt: new Date().toISOString(),
  },
];

const STORAGE_KEY = 'ec_events';

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
  const [events, setEvents] = useState(() => {
    const saved = loadEvents();
    return saved ?? SAMPLE_EVENTS;
  });

  const [view, setView] = useState('grid');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('soonest');

  const [showCreate, setShowCreate] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [sharingEvent, setSharingEvent] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [sharedImport, setSharedImport] = useState(null);

  // Check for share hash on mount
  useEffect(() => {
    const shared = parseShareHash();
    if (shared) {
      setSharedImport(shared);
      // Clean the hash without reloading
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Persist events to localStorage
  useEffect(() => {
    saveEvents(events);
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
      createdAt: new Date().toISOString(),
    };
    setEvents(prev => [newEvent, ...prev]);
    setSharedImport(null);
  }, [sharedImport]);

  // ===== FILTER & SORT =====
  const filteredEvents = events
    .filter(e => filter === 'all' || e.category === filter)
    .sort((a, b) => {
      if (sort === 'pinned') {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
      }
      const tA = new Date(a.date) - new Date();
      const tB = new Date(b.date) - new Date();
      if (sort === 'latest') return tB - tA;
      if (sort === 'created') return new Date(b.createdAt) - new Date(a.createdAt);
      // soonest first (default) — expired go to bottom
      const aExpired = tA <= 0;
      const bExpired = tB <= 0;
      if (aExpired && !bExpired) return 1;
      if (!aExpired && bExpired) return -1;
      return tA - tB;
    });

  const deletingEvent = events.find(e => e.id === deletingId);

  const commonCardProps = (event) => ({
    event,
    onEdit: setEditingEvent,
    onDelete: handleDelete,
    onPin: handlePin,
    onShare: setSharingEvent,
  });

  return (
    <div className="app">
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
          />
        )}

        {/* Events count */}
        {filteredEvents.length > 0 && (
          <div className="events-count">
            Showing <span>{filteredEvents.length}</span> of <span>{events.length}</span> countdown{events.length !== 1 ? 's' : ''}
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

        {/* No results after filtering */}
        {events.length > 0 && filteredEvents.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <div className="empty-title">No countdowns in this category</div>
            <p className="empty-sub">Try selecting a different category or create a new countdown.</p>
            <button className="btn-empty-create" onClick={() => setFilter('all')}>
              Show all
            </button>
          </div>
        )}

        {/* Grid view */}
        {view === 'grid' && filteredEvents.length > 0 && (
          <div className="events-grid">
            {filteredEvents.map(event => (
              <CountdownCard key={event.id} {...commonCardProps(event)} />
            ))}
          </div>
        )}

        {/* List view */}
        {view === 'list' && filteredEvents.length > 0 && (
          <div className="events-list">
            {filteredEvents.map(event => (
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

import { CATEGORIES } from '../App';

const SORT_OPTIONS = [
  { value: 'soonest', label: 'Soonest first' },
  { value: 'latest', label: 'Latest first' },
  { value: 'pinned', label: 'Pinned first' },
  { value: 'created', label: 'Date added' },
];

export default function FilterBar({ filter, setFilter, sort, setSort, view, setView, events }) {
  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = events.filter(e => e.category === cat.id).length;
    return acc;
  }, {});

  const totalCount = events.length;

  return (
    <div className="filter-bar">
      <div className="filter-chips">
        <button
          className={`filter-chip${filter === 'all' ? ' active' : ''}`}
          style={filter === 'all' ? { backgroundColor: '#7c6af7', borderColor: '#7c6af7' } : {}}
          onClick={() => setFilter('all')}
        >
          All
          <span style={{ marginLeft: 2, opacity: 0.7, fontSize: 11 }}>{totalCount}</span>
        </button>
        {CATEGORIES.map(cat => {
          const count = categoryCounts[cat.id] || 0;
          if (count === 0) return null;
          return (
            <button
              key={cat.id}
              className={`filter-chip${filter === cat.id ? ' active' : ''}`}
              style={filter === cat.id ? { backgroundColor: cat.color + '22', borderColor: cat.color, color: cat.color } : {}}
              onClick={() => setFilter(filter === cat.id ? 'all' : cat.id)}
            >
              <span
                className="filter-chip-dot"
                style={{ backgroundColor: cat.color }}
              />
              {cat.label}
              <span style={{ marginLeft: 2, opacity: 0.6, fontSize: 11 }}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="filter-controls">
        <select
          className="sort-select"
          value={sort}
          onChange={e => setSort(e.target.value)}
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <div className="view-toggle">
          <button
            className={`view-btn${view === 'grid' ? ' active' : ''}`}
            onClick={() => setView('grid')}
            title="Grid view"
          >
            ⊞
          </button>
          <button
            className={`view-btn${view === 'list' ? ' active' : ''}`}
            onClick={() => setView('list')}
            title="List view"
          >
            ☰
          </button>
        </div>
      </div>
    </div>
  );
}

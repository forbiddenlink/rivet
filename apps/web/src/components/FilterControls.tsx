'use client'

interface FilterState {
  severity: string[]
  category: string[]
  engine: string[]
  searchText: string
}

interface FilterControlsProps {
  filters: FilterState
  setFilters: (filters: FilterState) => void
}

const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info']
const CATEGORIES = [
  'smells',
  'bugs',
  'security',
  'performance',
  'architecture',
  'practices',
  'dependencies',
  'flows',
]

export default function FilterControls({ filters, setFilters }: FilterControlsProps) {
  const toggleSeverity = (severity: string) => {
    setFilters({
      ...filters,
      severity: filters.severity.includes(severity)
        ? filters.severity.filter((s) => s !== severity)
        : [...filters.severity, severity],
    })
  }

  const toggleCategory = (category: string) => {
    setFilters({
      ...filters,
      category: filters.category.includes(category)
        ? filters.category.filter((c) => c !== category)
        : [...filters.category, category],
    })
  }

  return (
    <div className="panel" style={{ marginBottom: '2rem' }}>
      <div className="panel__body">
        <div style={{ marginBottom: '1.25rem' }}>
          <label htmlFor="issue-search" className="field-label">
            Search
          </label>
          <input
            id="issue-search"
            type="text"
            className="input"
            placeholder="Filter by message or file…"
            value={filters.searchText}
            onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
          }}
        >
          <div>
            <h4 className="field-label">Severity</h4>
            <div className="filter-chip-row">
              {SEVERITIES.map((severity) => (
                <button
                  type="button"
                  key={severity}
                  className={`filter-chip${filters.severity.includes(severity) ? ' filter-chip--active' : ''}`}
                  onClick={() => toggleSeverity(severity)}
                  aria-pressed={filters.severity.includes(severity)}
                >
                  {severity}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="field-label">Category</h4>
            <div className="filter-chip-row">
              {CATEGORIES.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={`filter-chip${filters.category.includes(category) ? ' filter-chip--active' : ''}`}
                  onClick={() => toggleCategory(category)}
                  aria-pressed={filters.category.includes(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

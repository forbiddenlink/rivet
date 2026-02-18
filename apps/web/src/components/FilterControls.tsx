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
const CATEGORIES = ['smells', 'bugs', 'security', 'performance', 'architecture', 'practices', 'dependencies', 'flows']

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
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
      }}
    >
      {/* Search */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 500 }}>
          Search
        </label>
        <input
          type="text"
          placeholder="Search by message or file..."
          value={filters.searchText}
          onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.9rem',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Severity Filter */}
        <div>
          <h4 style={{ margin: '0 0 0.75rem 0', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', fontWeight: 600 }}>
            Severity
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {SEVERITIES.map((severity) => (
              <label
                key={severity}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={filters.severity.includes(severity)}
                  onChange={() => toggleSeverity(severity)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ textTransform: 'capitalize' }}>{severity}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <h4 style={{ margin: '0 0 0.75rem 0', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', fontWeight: 600 }}>
            Category
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {CATEGORIES.map((category) => (
              <label
                key={category}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={filters.category.includes(category)}
                  onChange={() => toggleCategory(category)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ textTransform: 'capitalize' }}>{category}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

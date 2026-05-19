import { useState, useMemo } from 'react'
import './PoetSelector.css'

export default function PoetSelector({ poets, selectedSlugs = [], onTogglePoet, onSelectAll, onDeselectAll, isOpen, onClose }) {
  const [regionFilter, setRegionFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState('')

  // Compile unique regions and periods directly from index.json
  const uniqueRegions = useMemo(() => [...new Set(poets.map(p => p.region).filter(Boolean))], [poets])
  const uniquePeriods = useMemo(() => [...new Set(poets.map(p => p.chronological_layer).filter(Boolean))], [poets])

  // Filter the poets based on dropdown selects, AND sort them alphabetically by English name
  const filteredAndSortedPoets = useMemo(() => {
    const filtered = poets.filter(poet => {
      const matchesRegion = !regionFilter || poet.region === regionFilter
      const matchesPeriod = !periodFilter || poet.chronological_layer === periodFilter
      return matchesRegion && matchesPeriod
    })

    // Alphabetize by English name ignoring half-rings, macrons, and underdots
    return filtered.sort((a, b) => {
      const cleanString = (str) => 
        str.replace(/[‘'’`ʿʾ]/g, '') // Strips out common half-ring modifier symbols
           .normalize('NFD')         // Decomposes accents (e.g., separating underdots/macrons from their base letter)
           .replace(/[\u0300-\u036f]/g, '') // Strips out those separated accent markings completely

      return cleanString(a.name_en).localeCompare(cleanString(b.name_en), 'en', { sensitivity: 'base' })
    })
  }, [poets, regionFilter, periodFilter]) 

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}

      <div className={`poet-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Select Poets</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="sidebar-filters">
          <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
            <option value="">All Regions</option>
            {uniqueRegions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)}>
            <option value="">All Layers</option>
            {uniquePeriods.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Global actions to Select or Deselect the currently filtered visible list */}
        <div className="sidebar-bulk-actions">
          <button 
            className="bulk-btn" 
            onClick={() => onSelectAll(filteredAndSortedPoets.map(p => p.slug))}
          >
            ✓ Select All
          </button>
          <button 
            className="bulk-btn" 
            onClick={() => onDeselectAll(filteredAndSortedPoets.map(p => p.slug))}
          >
            × Deselect All
          </button>
        </div>

        <div className="poet-checkbox-list">
          {filteredAndSortedPoets.map(poet => {
            const isChecked = selectedSlugs.includes(poet.slug)
            return (
              <label key={poet.slug} className={`poet-item ${isChecked ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onTogglePoet(poet.slug)}
                />
                <div className="poet-info">
                  <div className="poet-names-block">
                    <span className="poet-name-en">{poet.name_en}</span>
                    {poet.name_ar && <div className="poet-name-ar arabic">{poet.name_ar}</div>}
                  </div>
                  <span className="poet-meta-tags">
                    {poet.tribe && `${poet.tribe} · `}{poet.region} · {poet.chronological_layer}
                  </span>
                </div>
              </label>
            )
          })}
          {filteredAndSortedPoets.length === 0 && (
            <div className="sidebar-empty">No poets match selected criteria</div>
          )}
        </div>
      </div>
    </>
  )
}
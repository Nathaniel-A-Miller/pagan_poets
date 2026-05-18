import { useState, useMemo } from 'react'
import './PoetSelector.css'

export default function PoetSelector({ poets, selectedSlugs = [], onTogglePoet, isOpen, onClose }) {
  const [regionFilter, setRegionFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState('')

  const uniqueRegions = useMemo(() => [...new Set(poets.map(p => p.region).filter(Boolean))], [poets])
  const uniquePeriods = useMemo(() => [...new Set(poets.map(p => p.chronological_layer).filter(Boolean))], [poets])

  const filteredPoets = useMemo(() => {
    return poets.filter(poet => {
      const matchesRegion = !regionFilter || poet.region === regionFilter
      const matchesPeriod = !periodFilter || poet.chronological_layer === periodFilter
      return matchesRegion && matchesPeriod
    })
  }, [poets, regionFilter, periodFilter])

  return (
    <div className={`poet-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h3>Select Poets</h3>
        <button className="close-btn" onClick={onClose}>×</button>
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

      <div className="poet-checkbox-list">
        {filteredPoets.map(poet => {
          const isChecked = selectedSlugs.includes(poet.slug)
          return (
            <label key={poet.slug} className={`poet-item ${isChecked ? 'selected' : ''}`}>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onTogglePoet(poet.slug)}
              />
              <div className="poet-info">
                <span className="poet-name">{poet.name_en}</span>
                {poet.name_ar && <span className="poet-name-ar arabic">{poet.name_ar}</span>}
                <span className="poet-meta-tags">
                  {poet.tribe && `${poet.tribe} · `}{poet.region} · {poet.chronological_layer}
                </span>
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}
import { useState, useMemo, memo } from 'react'
import { CATEGORIES, categoryColor, categoryLabel } from './categories.js'
import './ReferenceExplorer.css'

export default function ReferenceExplorer({ poet, poems, analysis }) {
  const [activeCategories, setActiveCategories] = useState(new Set(CATEGORIES.map(c => c.id)))
  const [expandedRef, setExpandedRef] = useState(null)

  // Build a lookup: poem_id → poem object
  const poemLookup = useMemo(() => {
    const map = {}
    poems.forEach(p => { map[p.poem_id] = p })
    return map
  }, [poems])

  // Flatten all references from analysis, attach poem metadata
  const allRefs = useMemo(() => {
    const refs = []
    analysis.forEach(result => {
      if (result.error) return
      const poem = poemLookup[result.poem_id]
      result.references.forEach(ref => {
        refs.push({ ...ref, poem })
      })
    })
    return refs
  }, [analysis, poemLookup])

  // Category counts
  const counts = useMemo(() => {
    const c = {}
    allRefs.forEach(r => {
      c[r.category] = (c[r.category] || 0) + 1
    })
    return c
  }, [allRefs])

  // Filtered references
  const filtered = useMemo(() =>
    allRefs.filter(r => activeCategories.has(r.category)),
    [allRefs, activeCategories]
  )

  const toggleCategory = (id) => {
    setActiveCategories(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size === 1) return prev // keep at least one
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (activeCategories.size === CATEGORIES.length) {
      setActiveCategories(new Set([CATEGORIES[0].id]))
    } else {
      setActiveCategories(new Set(CATEGORIES.map(c => c.id)))
    }
  }

  return (
    <div className="explorer">

      {/* Poet header */}
      <div className="poet-header">
        <div className="poet-names">
          <h2 className="poet-name-en">{poet.name_en}</h2>
          <h2 className="poet-name-ar arabic">{poet.name_ar}</h2>
        </div>
        <div className="poet-meta">
          {poet.tribe && <span className="meta-item"><span className="meta-label">Tribe</span>{poet.tribe}</span>}
          {poet.region && <span className="meta-item"><span className="meta-label">Region</span>{poet.region}</span>}
          {poet.chronological_layer && <span className="meta-item"><span className="meta-label">Period</span>{poet.chronological_layer}</span>}
          <span className="meta-item"><span className="meta-label">Poems</span>{poems.length}</span>
          <span className="meta-item"><span className="meta-label">References</span>{allRefs.length}</span>
        </div>
        {poet.metadata_confidence && poet.metadata_confidence !== 'high' && (
          <div className="meta-warning">
            Metadata confidence: {poet.metadata_confidence}
            {poet.metadata_notes && ` — ${poet.metadata_notes}`}
          </div>
        )}
      </div>

      {/* Category filter */}
      <div className="filter-panel">
        <div className="filter-header">
          <span className="filter-label">Filter by category</span>
          <button className="toggle-all-btn" onClick={toggleAll}>
            {activeCategories.size === CATEGORIES.length ? 'Deselect all' : 'Select all'}
          </button>
        </div>
        <div className="category-filters">
          {CATEGORIES.map(cat => {
            const count = counts[cat.id] || 0
            const active = activeCategories.has(cat.id)
            return (
              <button
                key={cat.id}
                className={`cat-filter ${active ? 'active' : ''} ${count === 0 ? 'empty' : ''}`}
                style={{ '--cat-color': cat.color }}
                onClick={() => toggleCategory(cat.id)}
              >
                <span className="cat-dot" />
                <span className="cat-filter-label">{cat.label}</span>
                <span className="cat-count">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Results */}
      <div className="results-header">
        <span className="results-count">
          {filtered.length} reference{filtered.length !== 1 ? 's' : ''}
          {filtered.length !== allRefs.length && ` (of ${allRefs.length})`}
        </span>
      </div>

      <div className="references-list">
        {filtered.length === 0 && (
          <div className="no-results">No references in selected categories.</div>
        )}
        {filtered.map((ref, i) => {
          const key = `${ref.poem_id}-${ref.verse_indices?.join('-')}-${i}`
          const isExpanded = expandedRef === key
          return (
            <ReferenceCard
              key={key}
              ref_={ref}
              isExpanded={isExpanded}
              onToggle={() => setExpandedRef(isExpanded ? null : key)}
            />
          )
        })}
      </div>
    </div>
  )
}

function ReferenceCard({ ref_, isExpanded, onToggle }) {
  const { poem, category, entity_or_term, notes, verse_indices } = ref_
  const color = categoryColor(category)
  const label = categoryLabel(category)

  const flaggedVerses = useMemo(() => {
    if (!poem || !verse_indices) return []
    return verse_indices.map(i => poem.verses[i]).filter(Boolean)
  }, [poem, verse_indices])

  const openingVerse = poem?.verses?.[0]?.text ?? ''
  const meter = poem?.meter ?? ''

  return (
    <div className="ref-card" style={{ '--ref-color': color }}>
      <div className="ref-card-main" onClick={onToggle}>
        <div className="ref-left">
          <span className="ref-category-dot" />
          <div className="ref-content">
            <div className="ref-top">
              <span className="ref-category-label">{label}</span>
              <span className="ref-entity arabic">{entity_or_term}</span>
            </div>
            <div className="ref-verse-preview arabic">
              {flaggedVerses[0]?.text ?? ''}
            </div>
          </div>
        </div>
        <div className="ref-right">
          <span className="ref-expand">{isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="ref-expanded">
          <div className="ref-expanded-row">
            <span className="expanded-label">Note</span>
            <div className="ref-notes">{notes}</div>
          </div>
          <div className="ref-expanded-row">
            <span className="expanded-label">Verse</span>
            <div className="ref-verses">
              {flaggedVerses.map((v, i) => (
                <div key={i} className="ref-verse">
                  <span className="verse-num">{"v. " + verse_indices[i]}</span>
                  <span className="verse-text arabic">{v.text}</span>
                </div>
              ))}
            </div>
          </div>
          {poem && (
            <div className="ref-expanded-row">
              <span className="expanded-label">Poem</span>
              <div className="ref-poem-meta">
                <span className="poem-meter arabic">{meter}</span>
                <span className="poem-meta-divider"> · </span>
                <span className="poem-opening arabic">{openingVerse}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

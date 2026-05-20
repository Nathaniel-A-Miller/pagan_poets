import { useState, useMemo } from 'react'
import { CATEGORIES, categoryColor, categoryLabel } from './categories.js'
import './ReferenceExplorer.css'

export default function ReferenceExplorer({ pooledData, searchQuery, onViewPoem }) {
  const [activeCategories, setActiveCategories] = useState(new Set(CATEGORIES.map(c => c.id)))
  const [expandedRef, setExpandedRef] = useState(null)

  // Flatten all references from all selected poets into one pooled array
  const allRefs = useMemo(() => {
    if (!pooledData || pooledData.length === 0) return []

    const refs = []
    pooledData.forEach(({ poet, poems, analysis }) => {
      const poemLookup = {}
      poems.forEach(p => { poemLookup[p.poem_id] = p })

      analysis.forEach(result => {
        if (result.error) return
        const poem = poemLookup[result.poem_id]
        result.references.forEach(ref => {
          refs.push({ ...ref, poem, poet })
        })
      })
    })

    return refs.sort((a, b) => a.category.localeCompare(b.category))
  }, [pooledData])

  // Enhanced filtering logic to handle search query matches
  const searchFilteredRefs = useMemo(() => {
    return allRefs.filter(r => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase().trim()

      const matchPoetEn = r.poet.name_en?.toLowerCase().includes(query)
      const matchPoetAr = r.poet.name_ar?.includes(query)
      const matchEntity = r.entity_or_term?.toLowerCase().includes(query) || r.entity_or_term?.includes(query)
      const matchNotes = r.notes?.toLowerCase().includes(query)

      const flaggedVerses = r.poem?.verses?.filter(v => r.verse_indices.includes(v.verse_index)) || []
      const matchVerses = flaggedVerses.some(v => v.text.includes(query))

      return matchPoetEn || matchPoetAr || matchEntity || matchNotes || matchVerses
    })
  }, [allRefs, searchQuery])

  // Dynamic counts reflecting search matches
  const counts = useMemo(() => {
    const c = {}
    searchFilteredRefs.forEach(r => {
      c[r.category] = (c[r.category] || 0) + 1
    })
    return c
  }, [searchFilteredRefs])

  // Final filtering by category buttons
  const filtered = useMemo(() => {
    return searchFilteredRefs.filter(r => activeCategories.has(r.category))
  }, [searchFilteredRefs, activeCategories])

  const toggleCategory = (id) => {
    setActiveCategories(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!pooledData || pooledData.length === 0) {
    return (
      <div 
        className="explorer-empty" 
        style={{ direction: 'ltr', unicodeBidi: 'bidi-override', textAlign: 'center', padding: '4rem 2rem' }}
      >
        Please select a poet from the menu.
      </div>
    )
  }

  return (
    <div className="explorer">
      <div className="filters">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`filter-btn ${activeCategories.has(cat.id) ? 'active' : ''}`}
            style={{ 
              borderColor: categoryColor(cat.id),
              backgroundColor: activeCategories.has(cat.id) ? categoryColor(cat.id) : 'transparent',
              color: activeCategories.has(cat.id) ? '#fff' : 'var(--ink)'
            }}
            onClick={() => toggleCategory(cat.id)}
          >
            {categoryLabel(cat.id)}
            <span className="filter-count">{counts[cat.id] || 0}</span>
          </button>
        ))}
      </div>

      {/* Dynamic Summary Bar */}
      <div className="search-summary" style={{ padding: '0.5rem 0', fontSize: '0.9rem', color: 'var(--stone)', borderBottom: '1px solid var(--ash)', marginBottom: '1rem' }} dir="ltr">
        Showing {filtered.length} {filtered.length === 1 ? 'reference' : 'references'} 
        {searchQuery.trim() && ` matching "${searchQuery}"`}
      </div>

      <div className="ref-list">
        {filtered.map((ref, idx) => {
          const isExpanded = expandedRef === idx
          const flaggedVerses = ref.poem?.verses?.filter(v => ref.verse_indices.includes(v.verse_index)) || []
          const meter = ref.poem?.meter || 'Unknown'
          const openingVerse = ref.poem?.verses?.[0]?.text || ''

          return (
            <div key={idx} className={`ref-card ${isExpanded ? 'expanded' : ''}`} style={{ borderLeftColor: categoryColor(ref.category) }}>
              <div className="ref-summary" onClick={() => setExpandedRef(isExpanded ? null : idx)}>
                <div className="ref-left">
                  <div className="ref-card-header">
                    <span className="ref-category" style={{ backgroundColor: categoryColor(ref.category) }}>
                      {categoryLabel(ref.category)}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--stone)', fontWeight: 'bold', marginLeft: '0.5rem' }}>
                      — {ref.poet.name_en}
                    </span>
                  </div>
                  <div className="ref-preview">
                    <div className="ref-entity">
                      <span className="entity-label">Entity</span>
                      <span className="entity-text arabic">{ref.entity_or_term}</span>
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
                    <div className="ref-notes">
                      {ref.notes.split(/(\*[^*]+\*)/g).map((part, i) => {
                        if (part.startsWith('*') && part.endsWith('*')) {
                          return <span key={i} className="ref-note-emph">{part.slice(1, -1)}</span>;
                        }
                        return part;
                      })}
                    </div>
                  </div>

                  <div className="ref-expanded-row">
                    <span className="expanded-label">Verse</span>
                    <div className="ref-verses">
                      {flaggedVerses.map((v, i) => (
                        <div key={i} className="ref-verse">
                          <span className="verse-num">{"v. " + (ref.verse_indices[i] + 1)}</span>
                          <span className="verse-text arabic">{v.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {ref.poem && (
                    <div className="ref-expanded-row">
                      <span className="expanded-label">Poem</span>
                      <div className="ref-poem-meta-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        
                        {/* Meta Text Group */}
                        <div className="poem-meta-text-group" style={{ flex: '1', minWidth: '280px' }}>
                          <span className="poem-meter arabic">{meter}</span>
                          <span className="poem-meta-divider"> · </span>
                          <span className="poem-opening arabic" style={{ opacity: 0.7 }}>
                            {openingVerse}
                          </span>
                        </div>

                        {/* Action Button */}
                        <button 
                          className="open-poem-drawer-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewPoem(ref.poem, ref.poet, ref.verse_indices);
                          }}
                          style={{
                            backgroundColor: 'transparent',
                            border: '1px solid var(--ash)',
                            padding: '0.3rem 0.6rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            color: '#007a87',
                            fontWeight: '500',
                            whiteSpace: 'nowrap',
                            alignSelf: 'center'
                          }}
                        >
                          Read Full Poem ↗
                        </button>
                        
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="no-results" dir="ltr">No references match your search term.</div>
        )}
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import Header from './components/Header.jsx'
import PoetSelector from './components/PoetSelector.jsx'
import ReferenceExplorer from './components/ReferenceExplorer.jsx'
import CorpusDashboard from './components/CorpusDashboard.jsx'
import './App.css'

const BASE = import.meta.env.BASE_URL

export default function App() {
  const [poetIndex, setPoetIndex] = useState([])
  const [searchIndex, setSearchIndex] = useState({}) 
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSlugs, setSelectedSlugs] = useState([])
  const [pooledData, setPooledData] = useState([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 1. Initial Launch: Fetch base configurations and search map keys
  useEffect(() => {
    Promise.all([
      fetch(`${BASE}data/index.json`).then(r => r.json()),
      fetch(`${BASE}data/search-index.json`).then(r => r.json()).catch(() => ({}))
    ])
      .then(([indexData, searchData]) => {
        setPoetIndex(indexData)
        setSearchIndex(searchData)
      })
      .catch(() => setError('Could not load base index configurations.'))
  }, [])

  // 2. Sync Global Search: Update selections automatically on input changes
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase()
    
    // Clear selections to restore Dashboard if query is blank
    if (!query) {
      setSelectedSlugs([])
      return
    }

    const matchedSlugs = new Set()
    Object.keys(searchIndex).forEach(keyword => {
      if (keyword.includes(query)) {
        searchIndex[keyword].forEach(slug => matchedSlugs.add(slug))
      }
    })

    setSelectedSlugs(Array.from(matchedSlugs))
  }, [searchQuery, searchIndex])

  // 3. Lazy Data Loader: Dynamically pulls raw files for selected fields
  useEffect(() => {
    if (selectedSlugs.length === 0) {
      setPooledData([])
      return
    }

    setLoading(true)
    setError(null)

    const poetsToFetch = poetIndex.filter(p => selectedSlugs.includes(p.slug))

    const fetchPromises = poetsToFetch.map(poet => {
      return Promise.all([
        fetch(`${BASE}${poet.source}`).then(r => r.json()),
        fetch(`${BASE}${poet.analysis}`).then(r => r.json())
      ]).then(([source, analysis]) => ({
        poet: { ...source.poet, ...poet },
        poems: source.poems,
        analysis: analysis
      }))
    })

    Promise.all(fetchPromises)
      .then(setPooledData)
      .catch(() => setError('Could not load selected poet profiles.'))
      .finally(() => setLoading(false))
  }, [selectedSlugs, poetIndex])

  const handleTogglePoet = (slug) => {
    setSelectedSlugs(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSelectedSlugs([])
  }

  return (
    <div className="app">
      <Header isMenuOpen={isSidebarOpen} onToggleMenu={() => setIsSidebarOpen(!isSidebarOpen)} />

      <main className="main">
        <PoetSelector
          poets={poetIndex}
          selectedSlugs={selectedSlugs}
          onTogglePoet={handleTogglePoet}
          onSelectAll={(visibleSlugs) =>
            setSelectedSlugs(prev => [...new Set([...prev, ...visibleSlugs])])
          }
          onDeselectAll={(visibleSlugs) =>
            setSelectedSlugs(prev => prev.filter(slug => !visibleSlugs.includes(slug)))
          }
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Global Dashboard Search Interface */}
        <div className="main-search-wrapper" style={{ padding: '1rem 2rem 0 2rem', maxWidth: '800px', margin: '0 auto' }}>
          <div className="search-container" style={{ position: 'relative' }}>
            <input
              type="text"
              className="search-input"
              placeholder="Search in Arabic or English"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={handleClearSearch}>×</button>
            )}
          </div>
        </div>

        {loading && <div className="status">Loading data...</div>}
        {error && <div className="status error">{error}</div>}

        {/* Filtered Reference list cards */}
        {selectedSlugs.length > 0 && !loading && (
          <ReferenceExplorer pooledData={pooledData} searchQuery={searchQuery} />
        )}

        {/* Default Landing State View */}
        {selectedSlugs.length === 0 && !loading && poetIndex.length > 0 && (
          <CorpusDashboard poetIndex={poetIndex} />
        )}
      </main>
    </div>
  )
}
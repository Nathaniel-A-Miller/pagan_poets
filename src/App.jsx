import { useState, useEffect } from 'react'
import Header from './components/Header.jsx'
import PoetSelector from './components/PoetSelector.jsx'
import ReferenceExplorer from './components/ReferenceExplorer.jsx'
import './App.css'

const BASE = import.meta.env.BASE_URL

export default function App() {
  const [poetIndex, setPoetIndex] = useState([])
  const [selectedSlugs, setSelectedSlugs] = useState([])
  const [pooledData, setPooledData] = useState([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load index on mount
  useEffect(() => {
    fetch(`${BASE}data/index.json`)
      .then(r => r.json())
      .then(setPoetIndex)
      .catch(() => setError('Could not load poet index.'))
  }, [])

  // Load datasets for all selected poets whenever the selection array changes
  useEffect(() => {
    if (selectedSlugs.length === 0) {
      setPooledData([])
      return
    }

    setLoading(true)
    setError(null)

    // Match selected slugs against entries in index.json
    const poetsToFetch = poetIndex.filter(p => selectedSlugs.includes(p.slug))

    // Form fetch calls for every checked poet
    const fetchPromises = poetsToFetch.map(poet => {
      return Promise.all([
        fetch(`${BASE}${poet.source}`).then(r => r.json()),
        fetch(`${BASE}${poet.analysis}`).then(r => r.json())
      ]).then(([source, analysis]) => {
        return {
          poet: { ...source.poet, ...poet },
          poems: source.poems,
          analysis: analysis
        }
      })
    })

    Promise.all(fetchPromises)
      .then(results => {
        setPooledData(results)
      })
      .catch(() => setError('Could not load poet data.'))
      .finally(() => setLoading(false))
  }, [selectedSlugs, poetIndex])

  // Handle checking and unchecking poets in the sidebar
  const handleTogglePoet = (slug) => {
    setSelectedSlugs(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
  }

  return (
    <div className="app">
      <Header isMenuOpen={isSidebarOpen} onToggleMenu={() => setIsSidebarOpen(!isSidebarOpen)} />

      <main className="main">
        <PoetSelector
          poets={poetIndex}
          selectedSlugs={selectedSlugs}
          onTogglePoet={handleTogglePoet}
          onSelectAll={(visibleSlugs) => {
            // Combines existing selections with the currently visible poets
            setSelectedSlugs(prev => [...new Set([...prev, ...visibleSlugs])])
          }}
          onDeselectAll={(visibleSlugs) => {
            // Removes currently visible poets from selections, leaving hidden ones untouched
            setSelectedSlugs(prev => prev.filter(slug => !visibleSlugs.includes(slug)))
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {loading && <div className="status">Loading data...</div>}
        {error && <div className="status error">{error}</div>}
        
        {pooledData.length > 0 && !loading && (
          <ReferenceExplorer pooledData={pooledData} />
        )}

        {selectedSlugs.length === 0 && !loading && (
          <div className="splash">
            <p className="splash-arabic arabic">شعر الجاهلية</p>
            <p className="splash-sub" dir="ltr">Open the menu and select or filter poets to explore religious references.</p>
          </div>
        )}
      </main>
    </div>
  )
}
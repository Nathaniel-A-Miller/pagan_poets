import { useState, useEffect } from 'react'
import Header from './components/Header.jsx'
import PoetSelector from './components/PoetSelector.jsx'
import ReferenceExplorer from './components/ReferenceExplorer.jsx'
import CorpusDashboard from './components/CorpusDashboard.jsx'
import './App.css'

const BASE = import.meta.env.BASE_URL

export default function App() {
  const [poetIndex, setPoetIndex] = useState([])
  const [selectedSlugs, setSelectedSlugs] = useState([])
  const [pooledData, setPooledData] = useState([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${BASE}data/index.json`)
      .then(r => r.json())
      .then(setPoetIndex)
      .catch(() => setError('Could not load poet index.'))
  }, [])

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
      .catch(() => setError('Could not load poet data.'))
      .finally(() => setLoading(false))
  }, [selectedSlugs, poetIndex])

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
          onSelectAll={(visibleSlugs) =>
            setSelectedSlugs(prev => [...new Set([...prev, ...visibleSlugs])])
          }
          onDeselectAll={(visibleSlugs) =>
            setSelectedSlugs(prev => prev.filter(slug => !visibleSlugs.includes(slug)))
          }
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {loading && <div className="status">Loading data...</div>}
        {error && <div className="status error">{error}</div>}

        {pooledData.length > 0 && !loading && (
          <ReferenceExplorer pooledData={pooledData} />
        )}

        {selectedSlugs.length === 0 && !loading && poetIndex.length > 0 && (
          <CorpusDashboard poetIndex={poetIndex} />
        )}
      </main>
    </div>
  )
}

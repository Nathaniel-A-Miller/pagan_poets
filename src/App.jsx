import { useState, useEffect } from 'react'
import Header from './components/Header.jsx'
import PoetSelector from './components/PoetSelector.jsx'
import ReferenceExplorer from './components/ReferenceExplorer.jsx'
import './App.css'

const BASE = import.meta.env.BASE_URL

export default function App() {
  const [poetIndex, setPoetIndex] = useState([])
  const [selectedPoet, setSelectedPoet] = useState(null)
  const [poetData, setPoetData] = useState(null)   // source.json
  const [analysisData, setAnalysisData] = useState(null)  // analysis.json
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load index on mount
  useEffect(() => {
    fetch(`${BASE}data/index.json`)
      .then(r => r.json())
      .then(setPoetIndex)
      .catch(() => setError('Could not load poet index.'))
  }, [])

  // Load poet data when selection changes
  useEffect(() => {
    if (!selectedPoet) return
    setLoading(true)
    setError(null)
    setPoetData(null)
    setAnalysisData(null)

    Promise.all([
      fetch(`${BASE}${selectedPoet.source}`).then(r => r.json()),
      fetch(`${BASE}${selectedPoet.analysis}`).then(r => r.json()),
    ])
      .then(([source, analysis]) => {
        setPoetData(source)
        setAnalysisData(analysis)
      })
      .catch(() => setError('Could not load poet data.'))
      .finally(() => setLoading(false))
  }, [selectedPoet])

  return (
    <div className="app">
      <Header />
      <main className="main">
        <PoetSelector
          poets={poetIndex}
          selected={selectedPoet}
          onSelect={setSelectedPoet}
        />
        {loading && <div className="status">Loading...</div>}
        {error && <div className="status error">{error}</div>}
        {poetData && analysisData && !loading && (
          <ReferenceExplorer
            poet={poetData.poet}
            poems={poetData.poems}
            analysis={analysisData}
          />
        )}
        {!selectedPoet && !loading && (
          <div className="splash">
            <p className="splash-arabic arabic">شعر الجاهلية</p>
            <p className="splash-sub">Select a poet to begin exploring religious references in pre-Islamic Arabic poetry.</p>
          </div>
        )}
      </main>
    </div>
  )
}

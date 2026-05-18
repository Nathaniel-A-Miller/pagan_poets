import { useMemo } from 'react'
import './CorpusDashboard.css'

export default function CorpusDashboard({ poetIndex }) {
  const stats = useMemo(() => {
    const totalPoets = poetIndex.length
    const totalLines = poetIndex.reduce((sum, p) => sum + (p.number_of_lines || 0), 0)

    const byRegion = {}
    const byPeriod = {}

    poetIndex.forEach(p => {
      if (p.region) byRegion[p.region] = (byRegion[p.region] || 0) + 1
      if (p.chronological_layer) byPeriod[p.chronological_layer] = (byPeriod[p.chronological_layer] || 0) + 1
    })

    return { totalPoets, totalLines, byRegion, byPeriod }
  }, [poetIndex])

  const regionEntries = Object.entries(stats.byRegion).sort((a, b) => b[1] - a[1])
  const periodEntries = Object.entries(stats.byPeriod).sort((a, b) => b[1] - a[1])

  const PERIOD_LABELS = {
    'pre-Islamic': 'Pre-Islamic',
    'mukhadramun': 'Mukhadramūn',
    'uncertain': 'Uncertain',
  }

  return (
    <div className="dashboard">
      <div className="dashboard-title">
        <span className="dashboard-title-ar arabic">شعر الجاهلية</span>
        <span className="dashboard-title-en">Corpus Overview</span>
      </div>

      <div className="dashboard-grid">

        {/* Total poets */}
        <div className="stat-card stat-card--hero">
          <div className="stat-value">{stats.totalPoets}</div>
          <div className="stat-label">Poets</div>
        </div>

        {/* Total lines */}
        <div className="stat-card stat-card--hero">
          <div className="stat-value">{stats.totalLines.toLocaleString()}</div>
          <div className="stat-label">Lines of Verse</div>
        </div>

        {/* By region */}
        <div className="stat-card stat-card--breakdown">
          <div className="stat-card-heading">By Region</div>
          <div className="breakdown-list">
            {regionEntries.map(([region, count]) => (
              <div key={region} className="breakdown-row">
                <span className="breakdown-name">{region}</span>
                <div className="breakdown-bar-wrap">
                  <div
                    className="breakdown-bar"
                    style={{ width: `${(count / stats.totalPoets) * 100}%` }}
                  />
                </div>
                <span className="breakdown-count">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By period */}
        <div className="stat-card stat-card--breakdown">
          <div className="stat-card-heading">By Period</div>
          <div className="breakdown-list">
            {periodEntries.map(([period, count]) => (
              <div key={period} className="breakdown-row">
                <span className="breakdown-name">{PERIOD_LABELS[period] || period}</span>
                <div className="breakdown-bar-wrap">
                  <div
                    className="breakdown-bar breakdown-bar--period"
                    style={{ width: `${(count / stats.totalPoets) * 100}%` }}
                  />
                </div>
                <span className="breakdown-count">{count}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="dashboard-cta" dir="ltr">
        Open the menu to select poets and explore references.
      </div>
    </div>
  )
}

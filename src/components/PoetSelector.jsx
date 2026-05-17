import './PoetSelector.css'

export default function PoetSelector({ poets, selected, onSelect }) {
  if (!poets.length) return null

  return (
    <div className="poet-selector">
      {poets.map(poet => (
        <button
          key={poet.slug}
          className={`poet-btn ${selected?.slug === poet.slug ? 'active' : ''}`}
          onClick={() => onSelect(poet)}
        >
          {poet.name_en}
          {poet.name_ar && <span className="poet-btn-ar arabic">{poet.name_ar}</span>}
        </button>
      ))}
    </div>
  )
}

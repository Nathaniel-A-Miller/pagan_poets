export default function Header({ onOpenMenu }) {
  return (
    <header className="header">
      <div className="header-left">
        <button className="modern-menu-btn" onClick={onOpenMenu}>
          <span className="btn-icon">☰</span>
          <span className="btn-text">Select Poets</span>
        </button>
      </div>
      
      <div className="header-center">
        <h1>Pre-Islamic Poetry Explorer</h1>
      </div>
    </header>
  )
}
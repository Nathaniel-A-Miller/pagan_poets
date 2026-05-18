export default function Header({ isMenuOpen, onToggleMenu }) {
  return (
    <header className="header">
      <div className="header-left">
        <button className="modern-menu-btn" onClick={onToggleMenu}>
          <span className="btn-icon">{isMenuOpen ? '×' : '☰'}</span>
          <span className="btn-text">{isMenuOpen ? 'Close Menu' : 'Select Poets'}</span>
        </button>
      </div>
      
      <div className="header-center">
        <h1 className="header-title">Paganism in Early Poetry</h1>
        <p className="header-subtitle">A Digital Philology Workspace</p>
      </div>
      
      {/* This empty layout box keeps the center title perfectly centered */}
      <div className="header-right"></div>
    </header>
  )
}
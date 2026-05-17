import './Header.css'

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-title">
          <h1 className="title-en">Pagan Poets</h1>
          <span className="title-divider">·</span>
          <h1 className="title-ar arabic">شعراء الجاهلية</h1>
        </div>
        <p className="header-sub">Pre-Islamic Religious References in Early Arabic Poetry</p>
      </div>
      <div className="header-rule" />
    </header>
  )
}

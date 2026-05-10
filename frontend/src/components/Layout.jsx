// ── Icon helper ───────────────────────────────────────────────────────────────
export function Icon({ name, size = 22, color, style = {} }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{ fontSize: size, color, lineHeight: 1, ...style }}
    >
      {name}
    </span>
  )
}


// ── Navbar ────────────────────────────────────────────────────────────────────
export function Navbar({ screen, setScreen }) {
  const links = ['Upload', 'Protocols', 'Audit Logs', 'Reagents', 'Analytics']
  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 70,
      height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
      background: 'rgba(10,15,30,0.92)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid #1e2d5a',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 22 }}>🧬</span>
        <span style={{
          fontFamily: 'Orbitron, monospace', fontSize: 18, fontWeight: 700,
          letterSpacing: '0.22em', color: '#1a5cff',
        }}>LABMATE</span>
      </div>


      {/* Nav links */}
      <nav style={{ display: 'flex', gap: 4 }}>
        {links.map(l => (
          <button
            key={l}
            className={`nav-link${screen === l ? ' active' : ''}`}
            onClick={() => setScreen(l)}
          >{l}</button>
        ))}
      </nav>


      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span className="pulse" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 12px',
          background: 'rgba(26,92,255,0.1)', border: '1px solid rgba(26,92,255,0.3)',
          borderRadius: 20,
          fontFamily: 'Share Tech Mono', fontSize: 10, color: '#1a5cff', letterSpacing: '0.14em',
        }}>AI POWERED</span>
        <Icon name="notifications" color="#4a6fa5" style={{ cursor: 'pointer' }} />
        <Icon name="account_circle" color="#4a6fa5" style={{ cursor: 'pointer' }} />
        <Icon name="settings" color="#4a6fa5" style={{ cursor: 'pointer' }} />
      </div>
    </header>
  )
}



// ── Sidebar ───────────────────────────────────────────────────────────────────
export function Sidebar({ screen, setScreen }) {
  const links = [
    { icon: 'upload_file', label: 'Upload' },
    { icon: 'biotech',     label: 'Protocols' },
    { icon: 'terminal',    label: 'Audit Logs' },
    { icon: 'science',     label: 'Reagents' },
    { icon: 'monitoring',  label: 'Analytics' },
  ]
  return (
    <aside style={{
      position: 'fixed', left: 0, top: 64, bottom: 32,
      width: 240,
      background: '#0d1428', borderRight: '1px solid #1e2d5a',
      display: 'flex', flexDirection: 'column', zIndex: 50,
      overflow: 'hidden',
    }}>
      {/* Identity */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #1e2d5a' }}>
        <p style={{ fontFamily: 'Orbitron', fontSize: 12, color: '#1a5cff', letterSpacing: '0.2em', marginBottom: 4 }}>
          AUDIT_CORE
        </p>
        <p style={{ fontFamily: 'Share Tech Mono', fontSize: 9, color: '#4a6fa5', letterSpacing: '0.12em' }}>
          V2.4.0-ACTIVE
        </p>
        <button
          className="btn-ghost"
          onClick={() => setScreen('Upload')}
          style={{ marginTop: 14, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <Icon name="add" size={14} /> New Audit
        </button>
      </div>


      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: 8 }}>
        {links.map(({ icon, label }) => (
          <button
            key={label}
            className={`sidebar-link${screen === label ? ' active' : ''}`}
            onClick={() => setScreen(label)}
          >
            <Icon name={icon} size={18} color={screen === label ? '#1a5cff' : '#4a6fa5'} />
            {label}
          </button>
        ))}
      </nav>


      {/* Bottom */}
      <div style={{ borderTop: '1px solid #1e2d5a', padding: '8px 0' }}>
        {[{ icon: 'help_outline', label: 'Support' }, { icon: 'description', label: 'Docs' }].map(({ icon, label }) => (
          <button key={label} className="sidebar-link" style={{ padding: '8px 24px', fontSize: 11 }}>
            <Icon name={icon} size={15} color="#4a6fa5" /> {label}
          </button>
        ))}
      </div>

    </aside>
  )
}



// ── Footer ───────────────────────────────────────────────────────────────────
export function Footer() {
  return (
    <footer className="footer-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#3fe486' }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: '#3fe486',
          display: 'inline-block', animation: 'pulse 2s infinite'
        }} />
        SYSTEM_STATUS: ALL_SYSTEMS_OPERATIONAL
        <span style={{ color: '#1e2d5a' }}>|</span>
        <span style={{ color: '#4a6fa5' }}>LATENCY: 12ms</span>
      </div>
      <div style={{ display: 'flex', gap: 20, color: '#4a6fa5' }}>
        {['PRT_LOG_01', 'SYS_DUMP', 'DE_BUG'].map(l => (
          <span key={l} style={{ cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseOver={e => e.target.style.color = '#1a5cff'}
            onMouseOut={e => e.target.style.color = '#4a6fa5'}
          >{l}</span>
        ))}
      </div>
    </footer>
  )
}

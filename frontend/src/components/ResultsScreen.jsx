import { useState } from 'react'
import { Icon } from './Layout.jsx'

const STATUS = {
  PASS:    { color: '#3fe486', cls: 'status-pass', icon: 'check_circle' },
  WARNING: { color: '#ffaa00', cls: 'status-warn',  icon: 'warning'      },
  FAIL:    { color: '#ff4d6a', cls: 'status-fail',  icon: 'cancel'       },
}

const FLAG = {
  DANGER:  { color: '#ff4d6a' },
  ERROR:   { color: '#ff8c42' },
  WARNING: { color: '#ffaa00' },
}

const RISK = {
  safe:    { color: '#3fe486', label: 'SAFE',    badge: 'badge-green'  },
  caution: { color: '#ffaa00', label: 'CAUTION', badge: 'badge-yellow' },
  danger:  { color: '#ff4d6a', label: 'DANGER',  badge: 'badge-red'   },
}

export default function ResultsScreen({ result, fileName, cloudUrl, onBack }) {
  const [openReagent, setOpenReagent] = useState(null)
  const sc = STATUS[result?.overall_status] || STATUS.WARNING

  return (
    <div>
      {/* ── Back ── */}
      <button
        className="s1"
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'Share Tech Mono', fontSize: 11, color: '#4a6fa5',
          letterSpacing: '0.12em', textTransform: 'uppercase',
          marginBottom: 24, padding: 0, transition: 'color 0.2s',
        }}
        onMouseOver={e => e.currentTarget.style.color = '#1a5cff'}
        onMouseOut={e => e.currentTarget.style.color = '#4a6fa5'}
      >
        <Icon name="arrow_back" size={16} color="#4a6fa5" /> New Analysis
      </button>

      {/* ── Status Banner ── */}
      <div className={`slide-down s1 ${sc.cls}`} style={{
        border: '1px solid', borderRadius: 12,
        padding: '20px 28px', marginBottom: 20,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: sc.color, borderRadius: '12px 0 0 12px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{
            padding: '12px 20px', borderRadius: 8,
            border: `1px solid ${sc.color}40`, background: `${sc.color}10`,
          }}>
            <span style={{ fontFamily: 'Orbitron', fontSize: 36, fontWeight: 700, color: sc.color, letterSpacing: '0.06em' }}>
              {result?.overall_status}
            </span>
          </div>
          <div>
            <p style={{ fontFamily: 'Orbitron', fontSize: 15, color: '#d5e3ff', marginBottom: 6 }}>
              {result?.protocol_identified}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: sc.color, display: 'inline-block' }} />
              <span style={{ fontFamily: 'Share Tech Mono', fontSize: 10, color: sc.color, letterSpacing: '0.12em' }}>
                SYSTEM INTEGRITY NOMINAL
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 28, fontFamily: 'Share Tech Mono' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 9, color: '#4a6fa5', letterSpacing: '0.1em', marginBottom: 4 }}>FILE</p>
            <p style={{ fontSize: 11, color: '#d5e3ff' }}>{fileName}</p>
            {cloudUrl && (
              <a href={cloudUrl} target="_blank" rel="noreferrer"
                style={{ fontSize: 9, color: '#1a5cff', textDecoration: 'underline' }}>
                View in Cloud
              </a>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 9, color: '#4a6fa5', letterSpacing: '0.1em', marginBottom: 4 }}>TIMESTAMP</p>
            <p style={{ fontSize: 11, color: '#d5e3ff' }}>{new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Principles Check */}
        <div className="card s2" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
          <div className="scan-v" style={{ top: 0 }} />
          <p style={{ fontFamily: 'Share Tech Mono', fontSize: 10, color: '#4a6fa5', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="rule" size={14} color="#4a6fa5" /> PRINCIPLES VALIDATION ENGINE
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Passed */}
            <div>
              <p style={{ fontFamily: 'Share Tech Mono', fontSize: 10, color: '#3fe486', letterSpacing: '0.12em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="check_circle" size={14} color="#3fe486" /> PASSED
              </p>
              {(result?.principles_check?.passed || []).map((item, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#0a0f1e', padding: '10px 12px',
                  borderLeft: '2px solid rgba(63,228,134,0.4)',
                  marginBottom: 6, borderRadius: '0 4px 4px 0',
                }}>
                  <span style={{ fontFamily: 'Rajdhani', fontSize: 14, color: '#c3c5d9' }}>{item}</span>
                  <Icon name="check" size={14} color="#3fe486" />
                </div>
              ))}
              {!result?.principles_check?.passed?.length &&
                <p style={{ fontFamily: 'Share Tech Mono', fontSize: 10, color: '#4a6fa5' }}>None recorded</p>}
            </div>

            {/* Failed */}
            <div>
              <p style={{ fontFamily: 'Share Tech Mono', fontSize: 10, color: '#ff4d6a', letterSpacing: '0.12em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="cancel" size={14} color="#ff4d6a" /> FAILED
              </p>
              {(result?.principles_check?.failed || []).map((item, i) => (
                <div key={i} style={{
                  background: '#0a0f1e', padding: '10px 12px',
                  borderLeft: '2px solid rgba(255,77,106,0.4)',
                  border: '1px solid rgba(255,77,106,0.08)',
                  marginBottom: 6, borderRadius: '0 4px 4px 0',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontFamily: 'Rajdhani', fontSize: 14, color: '#c3c5d9' }}>{item}</span>
                  <Icon name="close" size={14} color="#ff4d6a" />
                </div>
              ))}
              {!result?.principles_check?.failed?.length &&
                <p style={{ fontFamily: 'Share Tech Mono', fontSize: 10, color: '#4a6fa5' }}>None recorded</p>}
            </div>
          </div>
        </div>

        {/* Flags + ProTip */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(result?.red_flags || []).slice(0, 2).map((flag, i) => {
            const fc = FLAG[flag.level] || FLAG.WARNING
            return (
              <div key={i} className="s3" style={{
                background: '#001c3b', border: `1px solid ${fc.color}35`,
                borderLeft: `3px solid ${fc.color}`, borderRadius: '0 8px 8px 0',
                padding: '14px 16px',
              }}>
                <p style={{ fontFamily: 'Share Tech Mono', fontSize: 10, color: fc.color, letterSpacing: '0.12em', marginBottom: 6 }}>
                  {flag.level}
                </p>
                <p style={{ fontFamily: 'Rajdhani', fontSize: 14, color: '#d5e3ff', fontWeight: 600, marginBottom: 4 }}>
                  {flag.message}
                </p>
                <p style={{ fontFamily: 'Share Tech Mono', fontSize: 9, color: '#4a6fa5' }}>
                  Step: {flag.step_affected}
                </p>
              </div>
            )
          })}


          {result?.pro_tip && (
            <div className="s4" style={{
              background: 'rgba(26,92,255,0.06)',
              border: '1px solid rgba(26,92,255,0.22)',
              borderLeft: '3px solid #1a5cff',
              borderRadius: '0 8px 8px 0',
              padding: '16px', flex: 1,
            }}>
              <p style={{ fontFamily: 'Share Tech Mono', fontSize: 10, color: '#4d9fff', letterSpacing: '0.12em', marginBottom: 8 }}>
                💡 PRO TIP
              </p>
              <p style={{ fontFamily: 'Rajdhani', fontSize: 14, color: '#c3c5d9', fontStyle: 'italic', lineHeight: 1.6 }}>
                "{result.pro_tip}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Reagents Table ── */}
      <div className="card s4" style={{ overflow: 'hidden', marginBottom: 16 }}>
        <div style={{
          padding: '12px 22px', borderBottom: '1px solid #1e2d5a',
          background: '#000e24', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <p style={{ fontFamily: 'Share Tech Mono', fontSize: 12, color: '#d5e3ff', display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '0.1em' }}>
            <Icon name="vaccines" size={16} color="#4a6fa5" /> REAGENT ANALYTICS MATRIX
          </p>
          <span style={{ fontFamily: 'Share Tech Mono', fontSize: 10, color: '#4a6fa5' }}>
            COUNT: {String(result?.reagents?.length || 0).padStart(2, '0')} ENTITIES
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              {['Entity Name', 'Purpose', 'Risk Level', 'Warning', 'Details'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(result?.reagents || []).map((r, i) => {
              const rc = RISK[r.risk_level] || RISK.safe
              const isOpen = openReagent === i
              return (
                <>
                  <tr key={i} onClick={() => setOpenReagent(isOpen ? null : i)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: rc.color, flexShrink: 0 }} />
                        <span style={{ fontFamily: 'Rajdhani', fontSize: 15, color: '#d5e3ff', fontWeight: 600 }}>{r.name}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'Rajdhani', fontSize: 13, color: '#c3c5d9', maxWidth: 180 }}>{r.purpose}</td>
                    <td>
                      <span className={`badge ${rc.badge}`}>{rc.label}</span>
                    </td>
                    <td style={{ fontFamily: 'Rajdhani', fontSize: 12, color: r.warning ? '#ffaa00' : '#4a6fa5' }}>
                      {r.warning || '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Icon name={isOpen ? 'expand_less' : 'expand_more'} size={18} color={isOpen ? '#1a5cff' : '#4a6fa5'} />
                    </td>
                  </tr>
                  {isOpen && (
                    <tr key={`exp-${i}`} style={{ background: '#0a0f1e' }}>
                      <td colSpan={5} style={{ padding: '12px 24px 16px' }}>
                        <div style={{ display: 'flex', gap: 28 }}>
                          {r.warning && (
                            <div>
                              <p style={{ fontFamily: 'Share Tech Mono', fontSize: 9, color: '#ffaa00', letterSpacing: '0.12em', marginBottom: 5 }}>⚠ WARNING</p>
                              <p style={{ fontFamily: 'Rajdhani', fontSize: 13, color: '#c3c5d9' }}>{r.warning}</p>
                            </div>
                          )}
                          {r.acceptable_alternatives?.length > 0 && (
                            <div>
                              <p style={{ fontFamily: 'Share Tech Mono', fontSize: 9, color: '#4d9fff', letterSpacing: '0.12em', marginBottom: 5 }}>🔄 ALTERNATIVES</p>
                              <p style={{ fontFamily: 'Rajdhani', fontSize: 13, color: '#c3c5d9' }}>{r.acceptable_alternatives.join(', ')}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Missing Steps ── */}
      {result?.missing_steps?.length > 0 && (
        <div className="s5" style={{
          background: 'rgba(255,77,106,0.05)', border: '1px solid rgba(255,77,106,0.2)',
          borderRadius: 10, padding: 20, marginBottom: 16,
        }}>
          <p style={{ fontFamily: 'Share Tech Mono', fontSize: 11, color: '#ff4d6a', letterSpacing: '0.15em', marginBottom: 12 }}>
            ⛔ MISSING STEPS
          </p>
          {result.missing_steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
              <Icon name="remove_circle" size={14} color="#ff4d6a" style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontFamily: 'Rajdhani', fontSize: 14, color: '#c3c5d9' }}>{s}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Disclaimer ── */}
      {result?.disclaimer && (
        <div className="s6" style={{ padding: '16px 0', borderTop: '1px solid #1e2d5a', textAlign: 'center' }}>
          <p style={{ fontFamily: 'Share Tech Mono', fontSize: 9, color: '#4a6fa5', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
            📌 {result.disclaimer}
          </p>
        </div>
      )}

    </div>
  )
}

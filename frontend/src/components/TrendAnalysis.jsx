import { useMemo, useState } from 'react'

function buildPath(values, w, h) {
  if (!values.length) return ''
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1 || 1)) * w
      const y = h - ((v - min) / range) * h
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
}

export default function TrendAnalysis({ auditHistory = [] }) {
  const [hover, setHover] = useState(false)

  const lastTen = useMemo(() => auditHistory.slice(0, 10), [auditHistory])
  const values = useMemo(() => {
    return lastTen.map(a => (a.result?.overall_status === 'PASS' ? 100 : 0))
  }, [lastTen])

  const latestPct = values.length ? values[0] : 0

  const w = 240
  const h = 48
  const d = buildPath(values.slice().reverse(), w, h)

  return (
    <div style={{ fontFamily: 'Share Tech Mono', color: '#4a6fa5' }}>
      <p style={{ fontSize: 10, marginBottom: 8 }}>LATEST 10 AUDITS PERFORMANCE TREND</p>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ position: 'relative', width: w, height: h + 8 }}
      >
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible', background: 'transparent' }}>
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {d && (
            <path d={d} fill="none" stroke="#3fe486" strokeWidth={2.2} style={{ filter: 'url(#glow)', strokeLinecap: 'round', strokeLinejoin: 'round' }} />
          )}

          {/* sparkline baseline subtle */}
          <polyline
            points={values.length ? values.map((v, i) => `${(i / (values.length - 1 || 1)) * w},${h - (v / 100) * h}`).join(' ') : ''}
            fill="none"
            stroke="rgba(63,228,134,0.18)"
            strokeWidth={6}
            strokeLinecap="round"
          />
        </svg>

        {hover && (
          <div style={{ position: 'absolute', left: 8, top: -28, background: 'rgba(14,22,48,0.95)', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(63,228,134,0.12)', boxShadow: '0 6px 18px rgba(63,228,134,0.06)' }}>
            <div style={{ color: '#3fe486', fontWeight: 700 }}>{latestPct}%</div>
            <div style={{ fontSize: 11, color: '#9fb5d8' }}>Latest audit pass rate</div>
          </div>
        )}
      </div>
    </div>
  )
}

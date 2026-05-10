import { useEffect, useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import { Navbar, Sidebar, Footer } from './components/Layout'
import UploadScreen from './components/UploadScreen'
import ResultsScreen from './components/ResultsScreen'
import TrendAnalysis from './components/TrendAnalysis'
import ScanlineOverlay from './components/ScanlineOverlay'
import { useScrambleText } from './hooks/useScrambleText'
import { createAuditPDF } from './utils/pdfExport'

const HISTORY_KEY = 'labmate_audit_history_v1'

function riskWeight(level) {
  if (level === 'danger') return 3
  if (level === 'caution') return 2
  return 1
}

function App() {
  const [screen, setScreen] = useState('Upload')
  const [auditResult, setAuditResult] = useState(null)
  const [fileInfo, setFileInfo] = useState({ name: '', url: '' })
  const [auditHistory, setAuditHistory] = useState([])
  const [protocolQuery, setProtocolQuery] = useState('')
  const [reagentQuery, setReagentQuery] = useState('')
  const [reagentRiskFilter, setReagentRiskFilter] = useState('all')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) setAuditHistory(parsed)
    } catch {
      setAuditHistory([])
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(auditHistory))
  }, [auditHistory])

  const handleResult = (result, name, url) => {
    const entry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      fileName: name,
      cloudUrl: url || '',
      result,
    }

    setAuditHistory(prev => [entry, ...prev])
    setAuditResult(result)
    setFileInfo({ name, url })
    setScreen('Results')
  }

  const handleBack = () => {
    setAuditResult(null)
    setFileInfo({ name: '', url: '' })
    setScreen('Upload')
  }

  const protocols = useMemo(() => {
    return auditHistory.map(item => ({
      id: item.id,
      createdAt: item.createdAt,
      fileName: item.fileName,
      cloudUrl: item.cloudUrl,
      overallStatus: item.result?.overall_status || 'WARNING',
      protocolName: item.result?.protocol_identified || 'Unknown Protocol',
    }))
  }, [auditHistory])

  const reagentStats = useMemo(() => {
    const map = new Map()

    for (const audit of auditHistory) {
      const reagents = audit.result?.reagents || []
      for (const reagent of reagents) {
        const key = reagent.name || 'Unknown Reagent'
        const current = map.get(key) || {
          name: key,
          occurrences: 0,
          purposes: new Set(),
          warnings: new Set(),
          riskLevel: 'safe',
        }

        current.occurrences += 1
        if (reagent.purpose) current.purposes.add(reagent.purpose)
        if (reagent.warning) current.warnings.add(reagent.warning)
        if (riskWeight(reagent.risk_level) > riskWeight(current.riskLevel)) {
          current.riskLevel = reagent.risk_level
        }

        map.set(key, current)
      }
    }

    return Array.from(map.values()).map(item => ({
      ...item,
      purposes: Array.from(item.purposes),
      warnings: Array.from(item.warnings),
    }))
  }, [auditHistory])

  const auditLogs = useMemo(() => {
    const logs = []

    for (const audit of auditHistory) {
      const ts = audit.createdAt
      logs.push({
        id: `${audit.id}-status`,
        timestamp: ts,
        level: audit.result?.overall_status || 'WARNING',
        message: `Protocol ${audit.result?.protocol_identified || audit.fileName} finished with ${audit.result?.overall_status || 'WARNING'}`,
      })

      for (const flag of audit.result?.red_flags || []) {
        logs.push({
          id: `${audit.id}-${flag.level}-${flag.step_affected}`,
          timestamp: ts,
          level: flag.level || 'WARNING',
          message: `${flag.message} (Step: ${flag.step_affected || 'N/A'})`,
        })
      }
    }

    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [auditHistory])

  const openAudit = (entryId) => {
    const found = auditHistory.find(item => item.id === entryId)
    if (!found) return
    setAuditResult(found.result)
    setFileInfo({ name: found.fileName, url: found.cloudUrl })
    setScreen('Results')
  }

  const filteredProtocols = useMemo(() => {
    const q = protocolQuery.trim().toLowerCase()
    if (!q) return protocols

    return protocols.filter(item => {
      return (
        item.protocolName.toLowerCase().includes(q) ||
        item.fileName.toLowerCase().includes(q) ||
        item.overallStatus.toLowerCase().includes(q)
      )
    })
  }, [protocols, protocolQuery])

  const filteredReagents = useMemo(() => {
    const q = reagentQuery.trim().toLowerCase()

    return reagentStats.filter(item => {
      const passQuery = !q ||
        item.name.toLowerCase().includes(q) ||
        item.riskLevel.toLowerCase().includes(q) ||
        item.purposes.some(p => p.toLowerCase().includes(q))

      const passRisk = reagentRiskFilter === 'all' || (item.riskLevel || 'safe') === reagentRiskFilter

      return passQuery && passRisk
    })
  }, [reagentStats, reagentQuery, reagentRiskFilter])

  const analytics = useMemo(() => {
    const passCount = protocols.filter(p => p.overallStatus === 'PASS').length
    const failCount = protocols.filter(p => p.overallStatus === 'FAIL').length
    const warningCount = protocols.filter(p => p.overallStatus === 'WARNING').length
    const total = protocols.length || 1

    const passPct = Math.round((passCount / total) * 100)
    const failPct = Math.round((failCount / total) * 100)

    const topReagents = [...reagentStats]
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 5)

    return {
      passCount,
      failCount,
      warningCount,
      passPct,
      failPct,
      topReagents,
    }
  }, [protocols, reagentStats])

  const screenTitles = {
    Upload: 'UPLOAD AUDIT',
    Results: 'AUDIT RESULT',
    Protocols: 'PROTOCOL HISTORY',
    Reagents: 'AGGREGATED REAGENTS',
    'Audit Logs': 'AUDIT TIMELINE',
    Analytics: 'RESEARCH ANALYTICS',
  }

  const { displayText: screenTitle } = useScrambleText(screenTitles[screen] || 'LABMATE', 400)

  const exportAuditPDF = (data, type) => {
    try {
      console.log('Export PDF called with:', { data, type, dataLength: data?.length })
      
      if (!data) {
        alert('No data to export')
        return
      }

      if (!Array.isArray(data)) {
        alert('Invalid data format')
        return
      }

      if (data.length === 0) {
        alert('No records to export')
        return
      }

      const doc = createAuditPDF(data, type)
      const dateStr = new Date().toLocaleDateString()
      const filename = `LabMate_Report_${dateStr.replace(/\//g, '_')}.pdf`
      doc.save(filename)
    } catch (err) {
      console.error('PDF Export Error:', err)
      alert('Error generating PDF: ' + err.message)
    }
  }

  const renderProtocols = () => (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <p style={{ fontFamily: 'Share Tech Mono', fontSize: 11, color: '#4a6fa5', letterSpacing: '0.14em' }}>
          PROTOCOL HISTORY
        </p>
        <button className="btn-ghost" style={{ padding: '8px 14px' }} onClick={() => {
          const ids = filteredProtocols.map(p => p.id)
          const toExport = auditHistory.filter(a => ids.includes(a.id))
          exportAuditPDF(toExport, 'protocols')
        }}>
          Export PDF Report
        </button>
      </div>

      <div className="cyber-field" style={{ marginBottom: 14 }}>
        <input
          className="cyber-input"
          placeholder="Search protocol name, file, status"
          value={protocolQuery}
          onChange={(e) => setProtocolQuery(e.target.value)}
        />
        <span className="scan-v" />
        <span className="scan-h" />
      </div>

      {!filteredProtocols.length && (
        <p style={{ color: '#4a6fa5' }}>No protocol audits yet. Upload a file to build history.</p>
      )}
      {filteredProtocols.map(item => (
        <div key={item.id} style={{ borderBottom: '1px solid rgba(30,45,90,0.5)', padding: '12px 0', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <p style={{ fontFamily: 'Rajdhani', color: '#d5e3ff', fontSize: 17, fontWeight: 600 }}>{item.protocolName}</p>
            <p style={{ fontFamily: 'Share Tech Mono', color: '#4a6fa5', fontSize: 10 }}>{item.fileName}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontFamily: 'Share Tech Mono', color: '#1a5cff', fontSize: 10 }}>{item.overallStatus}</p>
            <p style={{ fontFamily: 'Share Tech Mono', color: '#4a6fa5', fontSize: 10 }}>{new Date(item.createdAt).toLocaleString()}</p>
            <button className="btn-ghost" style={{ marginTop: 8, padding: '6px 12px' }} onClick={() => openAudit(item.id)}>
              Open
            </button>
          </div>
        </div>
      ))}
    </div>
  )

  const renderReagents = () => (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <p style={{ fontFamily: 'Share Tech Mono', fontSize: 11, color: '#4a6fa5', letterSpacing: '0.14em', marginBottom: 0 }}>
          AGGREGATED REAGENTS
        </p>
        <div>
          <button className="btn-ghost" style={{ marginRight: 8, padding: '8px 12px' }} onClick={() => {
            exportAuditPDF(filteredReagents, 'reagents')
          }}>
            Export PDF Report
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 14 }}>
        <div className="cyber-field">
          <input
            className="cyber-input"
            placeholder="Search reagent, purpose, risk"
            value={reagentQuery}
            onChange={(e) => setReagentQuery(e.target.value)}
          />
          <span className="scan-v" />
          <span className="scan-h" />
        </div>

        <div className="cyber-field">
          <select
            className="cyber-select"
            value={reagentRiskFilter}
            onChange={(e) => setReagentRiskFilter(e.target.value)}
          >
            <option value="all">Risk: All</option>
            <option value="safe">Safe</option>
            <option value="caution">Caution</option>
            <option value="danger">Danger</option>
          </select>
          <span className="scan-v" />
          <span className="scan-h" />
        </div>
      </div>

      {!filteredReagents.length && (
        <p style={{ color: '#4a6fa5' }}>No reagents found yet. Run at least one audit.</p>
      )}
      {filteredReagents.map(reagent => (
        <div key={reagent.name} style={{ borderBottom: '1px solid rgba(30,45,90,0.5)', padding: '12px 0' }}>
          <p style={{ fontFamily: 'Rajdhani', color: '#d5e3ff', fontSize: 16, fontWeight: 600 }}>{reagent.name}</p>
          <p style={{ fontFamily: 'Share Tech Mono', color: '#4a6fa5', fontSize: 10 }}>Seen in {reagent.occurrences} audit(s) • Risk: {(reagent.riskLevel || 'safe').toUpperCase()}</p>
          {!!reagent.purposes.length && (
            <p style={{ fontFamily: 'Rajdhani', color: '#c3c5d9', fontSize: 14 }}>Purpose: {reagent.purposes.join(', ')}</p>
          )}
          {!!reagent.warnings.length && (
            <p style={{ fontFamily: 'Rajdhani', color: '#ffaa00', fontSize: 13 }}>Warnings: {reagent.warnings.join(' | ')}</p>
          )}
        </div>
      ))}
    </div>
  )

  const renderAnalytics = () => {
    const pieStyle = {
      width: 180,
      height: 180,
      borderRadius: '50%',
      border: '1px solid #1e2d5a',
      background: `conic-gradient(#3fe486 0 ${analytics.passPct}%, #ff4d6a ${analytics.passPct}% ${analytics.passPct + analytics.failPct}%, #1e2d5a ${analytics.passPct + analytics.failPct}% 100%)`,
      boxShadow: '0 0 24px rgba(26,92,255,0.2)',
    }

    return (
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <p style={{ fontFamily: 'Share Tech Mono', fontSize: 11, color: '#4a6fa5', letterSpacing: '0.14em' }}>
            RESEARCH ANALYTICS
          </p>
          <button className="btn-ghost" style={{ padding: '8px 14px' }} onClick={() => exportAuditPDF(auditHistory, 'protocols')}>
            Export PDF Report
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 12, borderRadius: 10 }}>
              <TrendAnalysis auditHistory={auditHistory} />
            </div>
            <div className="card" style={{ padding: 18, borderRadius: 10 }}>
              <p style={{ fontFamily: 'Share Tech Mono', fontSize: 10, color: '#4a6fa5', marginBottom: 14 }}>PASS / FAIL DISTRIBUTION</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={pieStyle} />
                <div>
                  <p style={{ fontFamily: 'Rajdhani', color: '#3fe486', fontWeight: 700, fontSize: 18 }}>PASS: {analytics.passCount}</p>
                  <p style={{ fontFamily: 'Rajdhani', color: '#ff4d6a', fontWeight: 700, fontSize: 18 }}>FAIL: {analytics.failCount}</p>
                  <p style={{ fontFamily: 'Rajdhani', color: '#ffaa00', fontWeight: 700, fontSize: 18 }}>WARNING: {analytics.warningCount}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 18, borderRadius: 10 }}>
            <p style={{ fontFamily: 'Share Tech Mono', fontSize: 10, color: '#4a6fa5', marginBottom: 14 }}>MOST USED REAGENTS</p>
            {!analytics.topReagents.length && <p style={{ color: '#4a6fa5' }}>No reagent data yet.</p>}
            {analytics.topReagents.map((item, idx) => (
              <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(30,45,90,0.5)', padding: '8px 0' }}>
                <p style={{ fontFamily: 'Rajdhani', color: '#d5e3ff' }}>{idx + 1}. {item.name}</p>
                <p style={{ fontFamily: 'Share Tech Mono', color: '#1a5cff', fontSize: 10 }}>{item.occurrences}x</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderAuditLogs = () => (
    <div className="card" style={{ padding: 24 }}>
      <p style={{ fontFamily: 'Share Tech Mono', fontSize: 11, color: '#4a6fa5', letterSpacing: '0.14em', marginBottom: 14 }}>
        AUDIT TIMELINE
      </p>
      {!auditLogs.length && (
        <p style={{ color: '#4a6fa5' }}>No logs available yet.</p>
      )}
      {auditLogs.map(log => (
        <div key={log.id} style={{ borderBottom: '1px solid rgba(30,45,90,0.5)', padding: '12px 0', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <p style={{ fontFamily: 'Rajdhani', color: '#d5e3ff', fontSize: 14 }}>{log.message}</p>
          <div style={{ textAlign: 'right', minWidth: 180 }}>
            <p style={{ fontFamily: 'Share Tech Mono', color: '#1a5cff', fontSize: 10 }}>{(log.level || 'INFO').toUpperCase()}</p>
            <p style={{ fontFamily: 'Share Tech Mono', color: '#4a6fa5', fontSize: 10 }}>{new Date(log.timestamp).toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  )

  const renderScreen = () => {
    if (screen === 'Upload') return <UploadScreen onResult={handleResult} auditHistory={auditHistory} />
    if (screen === 'Results') {
      if (!auditResult) return <p style={{ color: '#4a6fa5' }}>No result selected yet.</p>
      const isFail = auditResult?.overall_status === 'FAIL'
      const failClass = isFail ? 'fail-neon-border' : ''
      return (
        <div className={`card ${failClass}`} style={{ padding: 24 }}>
          <ResultsScreen result={auditResult} fileName={fileInfo.name} cloudUrl={fileInfo.url} onBack={handleBack} />
        </div>
      )
    }
    if (screen === 'Protocols') return renderProtocols()
    if (screen === 'Reagents') return renderReagents()
    if (screen === 'Audit Logs') return renderAuditLogs()
    if (screen === 'Analytics') return renderAnalytics()
    return <p style={{ color: '#4a6fa5' }}>Select a section to continue.</p>
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <ScanlineOverlay />
      <Navbar screen={screen} setScreen={setScreen} />
      <Sidebar screen={screen} setScreen={setScreen} />
      <main style={{ flex: 1, marginLeft: 240, marginTop: 64, padding: '40px', marginBottom: 32 }}>
        {renderScreen()}
      </main>
      <Footer />
    </div>
  )
}

export default App

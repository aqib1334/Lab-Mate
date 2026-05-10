import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Icon } from './Layout.jsx'
import { ANALYZE_URL, uploadToCloudinary } from '../config.js'

export default function UploadScreen({ onResult, auditHistory = [] }) {
  const [dragging, setDragging] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [fileName, setFileName] = useState(null)
  const [progress, setProgress] = useState('')
  const [error,    setError]    = useState(null)
  const [neuralLoad, setNeuralLoad] = useState(60)
  const inputRef = useRef()

  const streamItems = useMemo(() => {
    return auditHistory.slice(0, 3).map(item => ({
      id: item.id,
      name: item.result?.protocol_identified || item.fileName || 'Unknown Protocol',
      file: item.fileName || 'N/A',
      status: item.result?.overall_status || 'WARNING',
      time: new Date(item.createdAt).toLocaleTimeString(),
    }))
  }, [auditHistory])

  const protocolTags = useMemo(() => {
    const tags = auditHistory
      .map(item => item.result?.protocol_identified)
      .filter(Boolean)
      .slice(0, 5)

    return tags.length ? tags : ['No history yet']
  }, [auditHistory])

  useEffect(() => {
    if (loading) {
      const timer = setInterval(() => {
        setNeuralLoad(Math.floor(35 + Math.random() * 60))
      }, 700)
      return () => clearInterval(timer)
    }

    const latest = auditHistory[0]?.result?.overall_status
    if (latest === 'FAIL') setNeuralLoad(92)
    else if (latest === 'WARNING') setNeuralLoad(77)
    else if (latest === 'PASS') setNeuralLoad(58)
    else setNeuralLoad(60)
  }, [loading, auditHistory])

  const handleFile = useCallback(async (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'docx'].includes(ext)) {
      setError('Only PDF and DOCX files are supported.')
      return
    }
    setError(null)
    setFileName(file.name)
    setLoading(true)

    try {
      // Step 1: Upload to Cloudinary (save the file)
      setProgress('UPLOADING TO CLOUD REPOSITORY...')
      let cloudUrl = null
      try {
        cloudUrl = await uploadToCloudinary(file)
      } catch {
        // Cloudinary optional — continue even if it fails
        console.warn('Cloudinary upload skipped')
      }

      // Step 2: Send to HuggingFace backend for analysis
      setProgress('RUNNING AI ANALYSIS...')
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(ANALYZE_URL, { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Server error ${res.status}`)
      }
      const result = await res.json()
      onResult(result, file.name, cloudUrl)
    } catch (e) {
      setError(e.message || 'Could not connect to backend.')
      setLoading(false)
      setProgress('')
    }
  }, [onResult])

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 48 }}>

      {/* ── Hero ── */}
      <div className="s1" style={{ textAlign: 'center', marginBottom: 48, maxWidth: 720 }}>
        <h1 style={{
          fontFamily: 'Orbitron', fontSize: 44, fontWeight: 700,
          letterSpacing: '0.04em', color: '#d5e3ff', lineHeight: 1.1, marginBottom: 16,
        }}>
          BIOTECH <span style={{ color: '#1a5cff' }}>PROTOCOL</span> AUDITOR
        </h1>
        <p style={{ fontFamily: 'Rajdhani', fontSize: 17, color: '#c3c5d9', lineHeight: 1.7 }}>
          High-fidelity forensic analysis of laboratory procedures.<br />
          Upload your protocol PDF or DOCX for instant AI analysis.
        </p>
      </div>

      {/* ── Upload Zone ── */}
      <div className="s2" style={{ width: '100%', maxWidth: 820, position: 'relative' }}>

        {/* Glow bg */}
        <div style={{
          position: 'absolute', inset: -20,
          background: 'rgba(26,92,255,0.04)', borderRadius: 24,
          filter: 'blur(24px)', pointerEvents: 'none',
        }} />

        <div
          className={`upload-zone${dragging ? ' drag' : ''}`}
          style={{ padding: loading ? '56px 40px' : '72px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          onClick={() => !loading && inputRef.current.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <div className="scan-v" style={{ top: 0 }} />
          <input ref={inputRef} type="file" accept=".pdf,.docx" style={{ display: 'none'}}
            onChange={e => handleFile(e.target.files[0])} />

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div className="spinner" />
              <p style={{ fontFamily: 'Share Tech Mono', fontSize: 11, color: '#1a5cff', letterSpacing: '0.18em' }}>
                {progress}
              </p>
              <p style={{ fontFamily: 'Rajdhani', fontSize: 13, color: '#4a6fa5' }}>{fileName}</p>
            </div>
          ) : (
            <>
              <div className="float" style={{ marginBottom: 28, position: 'relative' }}>
                <div style={{
                  width: 100, height: 100, borderRadius: '50%',
                  background: '#001c3b',
                  border: `2px solid ${dragging ? '#1a5cff' : '#1e2d5a'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'border-color 0.3s',
                }}>
                  <Icon name="upload_file" size={46} color="#1a5cff" />
                </div>
                {dragging && (
                  <div className="ping" style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    border: '1px solid rgba(26,92,255,0.5)',
                  }} />
                )}
              </div>

              <p style={{ fontFamily: 'Orbitron', fontSize: 20, fontWeight: 500, color: '#d5e3ff', marginBottom: 8 }}>
                Drop Protocol Documentation
              </p>
              <p style={{ fontFamily: 'Share Tech Mono', fontSize: 11, color: '#4a6fa5', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                PDF or DOCX — drag & drop or click to browse
              </p>

              {error && (
                <p style={{ marginTop: 14, color: '#ff4d6a', fontFamily: 'Share Tech Mono', fontSize: 11 }}>
                  ⚠ {error}
                </p>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
                <button className="btn-primary" onClick={e => { e.stopPropagation(); inputRef.current.click() }}>
                  Select File
                </button>
              </div>

              {/* File type pills */}
              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                {['PDF', 'DOCX'].map(t => (
                  <span key={t} style={{
                    padding: '4px 14px',
                    background: 'rgba(26,92,255,0.06)', border: '1px solid rgba(26,92,255,0.2)',
                    fontFamily: 'Share Tech Mono', fontSize: 10, color: '#4a6fa5',
                    borderRadius: 20, letterSpacing: '0.1em',
                  }}>{t}</span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Protocol tags */}
        <div className="s3" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 24 }}>
          {protocolTags.map(tag => (
            <span key={tag} style={{
              padding: '8px 16px',
              background: '#001c3b', border: '1px solid #1e2d5a', borderRadius: 2,
              fontFamily: 'Share Tech Mono', fontSize: 11, color: '#4a6fa5', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
              onMouseOver={e => { e.currentTarget.style.borderColor = '#1a5cff'; e.currentTarget.style.color = '#1a5cff' }}
              onMouseOut={e => { e.currentTarget.style.borderColor = '#1e2d5a'; e.currentTarget.style.color = '#4a6fa5' }}
            >
              <span style={{ color: '#1a5cff', marginRight: 4 }}>#</span>{tag}
            </span>
          ))}
        </div>
      </div>

      {/* ── Bento bottom grid ── */}
      <div className="s4" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, width: '100%', maxWidth: 820, marginTop: 40 }}>

        {/* Live audit stream */}
        <div className="card" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: '#3fe486' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'Orbitron', fontSize: 15, color: '#d5e3ff' }}>Live Audit Stream</h3>
            <span style={{ fontFamily: 'Share Tech Mono', fontSize: 10, color: '#3fe486', display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '0.1em' }}>
              <span className="pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#3fe486', display: 'inline-block' }} />
              SYSTEM ACTIVE
            </span>
          </div>
          {!streamItems.length && (
            <p style={{ fontFamily: 'Share Tech Mono', fontSize: 10, color: '#4a6fa5' }}>No audits yet. Upload a protocol to start the stream.</p>
          )}
          {streamItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(30,45,90,0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name="biotech" size={16} color="#4a6fa5" />
                <div>
                  <p style={{ fontFamily: 'Rajdhani', fontSize: 14, color: '#d5e3ff', fontWeight: 600 }}>{item.name}</p>
                  <p style={{ fontFamily: 'Share Tech Mono', fontSize: 10, color: '#4a6fa5' }}>{item.file}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontFamily: 'Share Tech Mono', fontSize: 11, color: item.status === 'PASS' ? '#3fe486' : item.status === 'FAIL' ? '#ff4d6a' : '#ffaa00' }}>{item.status}</p>
                <p style={{ fontFamily: 'Share Tech Mono', fontSize: 10, color: '#4a6fa5' }}>{item.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Neural link card */}
        <div className="card" style={{ padding: 24, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: '#1a5cff' }} />
          <div>
            <h3 style={{ fontFamily: 'Orbitron', fontSize: 15, color: '#d5e3ff', marginBottom: 4 }}>Neural Link</h3>
            <p style={{ fontFamily: 'Share Tech Mono', fontSize: 10, color: '#4a6fa5', letterSpacing: '0.1em' }}>Uptime: 99.987%</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
            <div style={{ position: 'relative', width: 110, height: 110 }}>
              <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="55" cy="55" r="48" fill="none" stroke="#1e2d5a" strokeWidth="5" />
                <circle cx="55" cy="55" r="48" fill="none" stroke="#1a5cff" strokeWidth="5"
                  strokeDasharray="301" strokeDashoffset={301 - Math.round((neuralLoad / 100) * 301)} strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Orbitron', fontSize: 22, color: '#d5e3ff' }}>{neuralLoad}%</span>
                <span style={{ fontFamily: 'Share Tech Mono', fontSize: 9, color: '#4a6fa5', letterSpacing: '0.1em' }}>LOAD</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[{ l: 'Mode', v: loading ? 'Analyzing' : 'Idle', c: loading ? '#ffaa00' : '#3fe486' }, { l: 'Audits', v: String(auditHistory.length), c: '#1a5cff' }].map(m => (
              <div key={m.l} style={{ background: '#0a0f1e', border: '1px solid #1e2d5a', padding: '8px 10px', borderRadius: 4 }}>
                <p style={{ fontFamily: 'Share Tech Mono', fontSize: 9, color: '#4a6fa5', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{m.l}</p>
                <p style={{ fontFamily: 'Rajdhani', fontSize: 16, color: m.c, fontWeight: 600 }}>{m.v}</p>
              </div>
            ))}
          </div>

        </div>
      </div>

    </div>
  )
}

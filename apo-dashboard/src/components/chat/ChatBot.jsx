import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../db/supabase'
import { useAuth } from '../../contexts/AuthContext'
import './ChatBot.css'

const SUGGESTIONS = [
  "Analyse la rentabilité du dernier mois",
  "Quel est le taux d'extraction moyen ?",
  "Pourquoi mon TE peut-il être bas ?",
  "Compare les marges sur les mois disponibles",
  "Comment optimiser mon procédé ?",
]

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`chat-message ${isUser ? 'chat-message--user' : 'chat-message--ai'}`}>
      {!isUser && <div className="chat-avatar">🌴</div>}
      <div className="chat-bubble">
        {msg.content.split('\n').map((line, i) => {
          if (line.startsWith('## ') || line.startsWith('### ')) {
            return <div key={i} className="chat-heading">{line.replace(/^#+\s/, '')}</div>
          }
          if (line.startsWith('- ') || line.startsWith('• ')) {
            return <div key={i} className="chat-li">· {line.slice(2)}</div>
          }
          if (line.startsWith('| ')) {
            return <div key={i} className="chat-table-row">{line}</div>
          }
          if (line === '') return <div key={i} className="chat-spacer" />
          const parts = line.split(/\*\*(.*?)\*\*/g)
          return (
            <div key={i}>
              {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
            </div>
          )
        })}
        {msg.loading && <span className="chat-typing">●●●</span>}
      </div>
    </div>
  )
}

export default function ChatBot() {
  const { user, tenantId } = useAuth()
  const [open,    setOpen]    = useState(false)
  const [input,   setInput]   = useState('')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [fabPos,  setFabPos]  = useState(null)  // {left, top} px, ou null = CSS par défaut
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)
  const dragRef   = useRef({ active: false, moved: false })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150)
  }, [open])

  // ── Drag du bouton flottant ─────────────────────────────────
  function onFabPointerDown(e) {
    const point  = e.touches?.[0] ?? e
    const rect   = e.currentTarget.getBoundingClientRect()
    const startX = point.clientX
    const startY = point.clientY
    const fabLeft = rect.left
    const fabTop  = rect.top

    dragRef.current = { active: true, moved: false }

    function onMove(ev) {
      if (!dragRef.current.active) return
      const p  = ev.touches?.[0] ?? ev
      const dx = p.clientX - startX
      const dy = p.clientY - startY
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) dragRef.current.moved = true
      if (!dragRef.current.moved) return
      if (ev.cancelable) ev.preventDefault()
      const SIZE = 52, PAD = 8
      setFabPos({
        left: Math.max(PAD, Math.min(window.innerWidth  - SIZE - PAD, fabLeft + dx)),
        top:  Math.max(PAD, Math.min(window.innerHeight - SIZE - PAD, fabTop  + dy)),
      })
    }

    function onUp() {
      dragRef.current.active = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend',  onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend',  onUp)
  }

  function handleFabClick() {
    if (dragRef.current.moved) { dragRef.current.moved = false; return }
    setOpen(o => !o)
  }

  // ── Position du panel en fonction du FAB ────────────────────
  function getPanelStyle() {
    if (!fabPos) return {}

    const PAD    = 12
    const W      = window.innerWidth
    const H      = window.innerHeight
    const isMob  = W <= 500

    if (isMob) {
      const maxH = Math.min(500, H - 160)
      const top  = fabPos.top > H / 2
        ? Math.max(PAD, fabPos.top - maxH - 10)
        : Math.min(H - maxH - PAD, fabPos.top + 52 + 10)
      return { left: PAD, right: PAD, top, bottom: 'auto', width: 'auto', maxHeight: maxH }
    }

    // Desktop : panel à côté / au-dessus du FAB
    const PW = 360, PH = 540, FAB = 52
    let left = fabPos.left + PW + PAD <= W
      ? Math.max(PAD, fabPos.left)
      : Math.max(PAD, fabPos.left + FAB - PW)
    left = Math.min(left, W - PW - PAD)

    let top = fabPos.top + FAB + PH + PAD <= H
      ? fabPos.top + FAB + 8
      : fabPos.top - PH - 8
    top = Math.max(PAD, Math.min(H - PH - PAD, top))

    return { left, top, right: 'auto', bottom: 'auto', width: PW, maxHeight: PH }
  }

  // ── Envoi de message ────────────────────────────────────────
  async function send(text) {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    setError(null)

    const userMsg    = { role: 'user', content: msg }
    const loadingMsg = { role: 'assistant', content: '', loading: true }
    setHistory(h => [...h, userMsg, loadingMsg])
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Session expirée — veuillez vous reconnecter')

      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chatbot`
      const res = await fetch(fnUrl, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message: msg, history: history.slice(-8) }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Erreur ${res.status}`)
      }
      const data = await res.json()
      if (data?.error) throw new Error(data.error)

      setHistory(h => [
        ...h.slice(0, -1),
        { role: 'assistant', content: data?.reply || 'Pas de réponse.' },
      ])
    } catch (err) {
      setHistory(h => h.slice(0, -1))
      setError(err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  function clearChat() { setHistory([]); setError(null) }

  if (!user || !tenantId) return null

  const fabStyle = fabPos
    ? { left: fabPos.left, top: fabPos.top, right: 'auto', bottom: 'auto' }
    : {}

  return (
    <>
      {/* Bouton flottant — draggable */}
      <button
        className={`chat-fab ${open ? 'chat-fab--open' : ''}`}
        style={fabStyle}
        onMouseDown={onFabPointerDown}
        onTouchStart={onFabPointerDown}
        onClick={handleFabClick}
        aria-label="Assistant IA"
      >
        {open ? '✕' : '🌴'}
        {!open && history.length > 0 && (
          <span className="chat-fab-badge">{history.filter(m => m.role === 'assistant').length}</span>
        )}
      </button>

      {/* Panel chat */}
      {open && (
        <div className="chat-panel" style={getPanelStyle()}>
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <span className="chat-header-icon">🌴</span>
              <div>
                <div className="chat-header-title">PALMAI</div>
                <div className="chat-header-sub">Assistant huilerie · {tenantId.toUpperCase()}</div>
              </div>
            </div>
            <div className="chat-header-actions">
              {history.length > 0 && (
                <button className="chat-clear-btn" onClick={clearChat} title="Effacer la conversation">↺</button>
              )}
              <button className="chat-close-btn" onClick={() => setOpen(false)}>✕</button>
            </div>
          </div>

          {/* Corps */}
          <div className="chat-body">
            {history.length === 0 ? (
              <div className="chat-welcome">
                <div className="chat-welcome-emoji">🌴</div>
                <div className="chat-welcome-title">Bonjour !</div>
                <div className="chat-welcome-text">
                  Je suis PALMAI, votre assistant expert en huilerie de palme.<br />
                  Posez-moi une question sur votre tableau de bord ou votre process.
                </div>
                <div className="chat-suggestions">
                  {SUGGESTIONS.map((s, i) => (
                    <button key={i} className="chat-suggestion" onClick={() => send(s)}>{s}</button>
                  ))}
                </div>
              </div>
            ) : (
              history.map((msg, i) => <Message key={i} msg={msg} />)
            )}
            {error && <div className="chat-error">⚠️ {error}</div>}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="chat-footer">
            <textarea
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Posez votre question…"
              rows={1}
              disabled={loading}
            />
            <button
              className="chat-send-btn"
              onClick={() => send()}
              disabled={loading || !input.trim()}
            >
              {loading ? '●' : '▶'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

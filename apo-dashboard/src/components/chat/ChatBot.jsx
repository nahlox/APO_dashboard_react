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
      {!isUser && (
        <div className="chat-avatar">🌴</div>
      )}
      <div className="chat-bubble">
        {msg.content.split('\n').map((line, i) => {
          // Rendu basique : gras **text**, listes -, headers ##
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
          // Gras inline **...**
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
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // Scroll bas à chaque nouveau message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  // Focus input à l'ouverture
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150)
  }, [open])

  async function send(text) {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    setError(null)

    const userMsg   = { role: 'user', content: msg }
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

      const reply = data?.reply || 'Pas de réponse.'
      setHistory(h => [
        ...h.slice(0, -1),  // retire le loading
        { role: 'assistant', content: reply },
      ])
    } catch (err) {
      setHistory(h => h.slice(0, -1))  // retire le loading
      setError(err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  function clearChat() {
    setHistory([])
    setError(null)
  }

  if (!user || !tenantId) return null

  return (
    <>
      {/* Bouton flottant */}
      <button
        className={`chat-fab ${open ? 'chat-fab--open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Assistant IA"
      >
        {open ? '✕' : '🌴'}
        {!open && history.length > 0 && (
          <span className="chat-fab-badge">{Math.ceil(history.filter(m => m.role === 'assistant').length)}</span>
        )}
      </button>

      {/* Panel chat */}
      {open && (
        <div className="chat-panel">
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
                    <button key={i} className="chat-suggestion" onClick={() => send(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              history.map((msg, i) => <Message key={i} msg={msg} />)
            )}
            {error && (
              <div className="chat-error">⚠️ {error}</div>
            )}
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

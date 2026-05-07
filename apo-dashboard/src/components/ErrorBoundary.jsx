import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: '32px 24px', margin: '24px 0', borderRadius: 10,
          background: 'rgba(224,92,92,0.08)', border: '1px solid rgba(224,92,92,0.3)',
          color: 'var(--text-dim)', fontSize: 13, lineHeight: 1.6,
        }}>
          <div style={{ color: 'var(--red)', fontWeight: 700, marginBottom: 8 }}>
            Erreur d'affichage
          </div>
          <div style={{ opacity: 0.7, fontFamily: 'monospace', fontSize: 11 }}>
            {String(this.state.error?.message || this.state.error)}
          </div>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: 16, padding: '8px 16px', borderRadius: 6,
              background: 'rgba(224,92,92,0.15)', border: '1px solid rgba(224,92,92,0.4)',
              color: 'var(--red)', cursor: 'pointer', fontSize: 12,
            }}
          >
            Réessayer
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

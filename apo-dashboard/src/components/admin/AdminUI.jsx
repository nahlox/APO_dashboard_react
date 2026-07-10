export function Section({ title, hint, children, right }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: hint ? 6 : 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
          {title}
        </div>
        {right}
      </div>
      {hint && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 14 }}>{hint}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  )
}

export function Row({ children }) {
  return <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
    {Array.isArray(children) ? children.map((c, i) => <div key={i} style={{ flex: 1, minWidth: 200 }}>{c}</div>) : children}
  </div>
}

export function Field({ label, hint, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-dim)' }}>
      {label}
      {children}
      {hint && <span style={{ fontSize: 11, opacity: 0.7 }}>{hint}</span>}
    </label>
  )
}

export const inputStyle = {
  background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 8,
  padding: '10px 12px', color: 'var(--text)', fontSize: 14, width: '100%',
}

export const btnPrimary = {
  background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 8,
  padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
}

export const btnGhost = {
  background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-dim)',
  borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13,
}

export function Banner({ ok, error }) {
  if (ok) return (
    <div style={{ background: 'rgba(63,163,77,0.12)', border: '1px solid var(--green)', borderRadius: 10, padding: 14, color: 'var(--text)', fontSize: 13 }}>
      ✓ {ok}
    </div>
  )
  if (error) return (
    <div style={{ background: 'rgba(224,92,92,0.12)', border: '1px solid var(--red)', borderRadius: 10, padding: 14, color: 'var(--text)', fontSize: 13 }}>
      ✗ {error}
    </div>
  )
  return null
}

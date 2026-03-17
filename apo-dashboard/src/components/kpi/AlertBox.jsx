export default function AlertBox({ type = 'warn', titre, texte }) {
  const icons = { success: '🟢', warn: '🟡', danger: '🔴' }
  const colors = { success: 'var(--green)', warn: 'var(--gold)', danger: 'var(--red)' }
  return (
    <div className={`alert-box ${type}`}>
      <div className="alert-icon">{icons[type]}</div>
      <div>
        <div className="alert-title" style={{ color: colors[type] }}>{titre}</div>
        <div className="alert-text">{texte}</div>
      </div>
    </div>
  )
}

import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  BarChart3, Bell, Brain, ChevronRight, FileText,
  LineChart, Mail, Shield, TrendingUp, Zap,
  Database, Settings, Puzzle, Check, ArrowRight,
  Monitor, Smartphone,
} from 'lucide-react'
import './index.css'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
}

function AnimateIn({ children, i = 0, className = '', style = {} }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      custom={i}
    >
      {children}
    </motion.div>
  )
}

const FEATURES = [
  {
    icon: <LineChart size={20} className="text-emerald-400" />,
    title: "Taux d'extraction en direct",
    desc: "Suivez votre TE jour par jour avec des graphiques précis. Identifiez les baisses avant qu'elles impactent votre bilan.",
  },
  {
    icon: <BarChart3 size={20} className="text-emerald-400" />,
    title: 'Régimes & production',
    desc: 'Régimes reçus, traités, huile produite, sorties citerne — tout visualisé sur un seul tableau de bord.',
  },
  {
    icon: <FileText size={20} className="text-emerald-400" />,
    title: 'P&L mensuel automatique',
    desc: 'Votre compte de résultat généré automatiquement chaque mois. Revenus, charges, marges — en FCFA ou en EUR.',
  },
  {
    icon: <Brain size={20} className="text-emerald-400" />,
    title: 'Insights IA quotidiens',
    desc: "Claude analyse vos données de production et vous envoie un résumé avec un insight actionnable sur votre performance.",
  },
  {
    icon: <Bell size={20} className="text-emerald-400" />,
    title: 'Notifications push',
    desc: "Recevez les alertes et bilans clés directement sur votre téléphone, où que vous soyez.",
  },
  {
    icon: <Shield size={20} className="text-emerald-400" />,
    title: 'Multi-tenant & sécurisé',
    desc: "Chaque huilerie a ses propres données isolées. Contrôle d'accès par rôle : opérateur, manager, comptable.",
  },
]

const STATS = [
  { value: '12', label: 'Sources compatibles', sub: 'ERP, Excel, comptabilité…' },
  { value: '< 5s', label: 'Mise à jour', sub: 'des données' },
  { value: '100%', label: 'Web & Mobile', sub: 'aucune installation' },
]

/* ─── Logos intégrations ─── */
const LOGOS = [
  { name: 'Odoo', color: '#714B67', bg: 'rgba(113,75,103,0.15)' },
  { name: 'Sage', color: '#00B050', bg: 'rgba(0,176,80,0.12)' },
  { name: 'Dropbox', color: '#0061FF', bg: 'rgba(0,97,255,0.12)' },
  { name: 'Excel', color: '#217346', bg: 'rgba(33,115,70,0.12)' },
  { name: 'SAP', color: '#008FD3', bg: 'rgba(0,143,211,0.12)' },
  { name: 'QuickBooks', color: '#2CA01C', bg: 'rgba(44,160,28,0.12)' },
  { name: 'Google Sheets', color: '#0F9D58', bg: 'rgba(15,157,88,0.12)' },
  { name: 'CSV / Excel', color: '#a1a1aa', bg: 'rgba(161,161,170,0.08)' },
  { name: 'Cegid', color: '#E4002B', bg: 'rgba(228,0,43,0.12)' },
  { name: 'EBP', color: '#003087', bg: 'rgba(0,48,135,0.12)' },
  { name: 'Dynamics 365', color: '#00A4EF', bg: 'rgba(0,164,239,0.12)' },
  { name: 'API maison', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
]

function LogoMarquee() {
  const doubled = [...LOGOS, ...LOGOS]
  return (
    <div style={{ overflow: 'hidden', position: 'relative' }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 80,
        background: 'linear-gradient(to right, #08090e, transparent)', zIndex: 2, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 80,
        background: 'linear-gradient(to left, #08090e, transparent)', zIndex: 2, pointerEvents: 'none',
      }} />
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        style={{ display: 'flex', gap: 12, width: 'max-content', padding: '8px 0' }}
      >
        {doubled.map(({ name, color, bg }, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: bg, border: `1px solid ${color}30`,
            borderRadius: 10, padding: '8px 16px',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#d4d4d8' }}>{name}</span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

/* ─── 3 modèles de service ─── */
const MODELS = [
  {
    icon: <Database size={22} style={{ color: '#60a5fa' }} />,
    badge: 'Données internes',
    title: 'Comptabilité & fichiers maison',
    desc: "Votre équipe gère les données en interne sur Excel, Dropbox ou Google Sheets ? Palmeo importe et structure vos fichiers existants sans perturber votre organisation.",
    sources: ['Excel / CSV', 'Google Sheets', 'Dropbox', 'Fichiers maison', 'Formats personnalisés'],
    points: [
      'Import de vos fichiers Excel existants',
      "Structuration et normalisation des données",
      'Compatible avec tous les formats courants',
      'Aucun ERP requis',
    ],
    accent: '#60a5fa',
    featured: false,
  },
  {
    icon: <Puzzle size={22} style={{ color: '#4ade80' }} />,
    badge: 'Connecté',
    title: 'Intégration ERP & logiciels existants',
    desc: "Vous utilisez déjà un ERP ou un logiciel de comptabilité ? Palmeo se connecte directement à votre système actuel et en extrait les données automatiquement.",
    sources: ['Odoo', 'Sage', 'SAP', 'Dynamics 365', 'Cegid', 'EBP', 'QuickBooks', 'API sur mesure'],
    points: [
      'Synchronisation automatique des données',
      'Aucune saisie manuelle',
      'Mise à jour en temps réel',
      'Compatible avec les principaux ERP du marché',
    ],
    accent: '#4ade80',
    featured: true,
  },
  {
    icon: <Settings size={22} style={{ color: '#c084fc' }} />,
    badge: 'Sur mesure',
    title: 'Développement entièrement personnalisé',
    desc: "Votre huilerie a des besoins spécifiques, des processus uniques ou une infrastructure particulière ? On conçoit une solution 100% sur mesure adaptée à votre réalité.",
    sources: ['Architecture dédiée', 'Modules spécifiques', 'Flux de données uniques', 'Intégration terrain'],
    points: [
      'Analyse complète de vos besoins',
      'Développement dédié à votre huilerie',
      'Modules et rapports personnalisés',
      'Accompagnement de bout en bout',
    ],
    accent: '#c084fc',
    featured: false,
  },
]

/* ─── Dashboard mockup desktop ─── */
function DashboardDesktopMockup() {
  return (
    <div style={{
      background: 'rgba(10,11,15,0.95)', borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden',
      boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
    }}>
      {/* Browser chrome */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#ff5f57','#febc2e','#28c840'].map(c => (
            <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <div style={{
          flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 5,
          height: 22, maxWidth: 220, display: 'flex', alignItems: 'center',
          paddingLeft: 8, fontSize: 10, color: '#3f3f46',
        }}>app.palmeo.co</div>
      </div>

      {/* Dashboard layout */}
      <div style={{ display: 'flex', height: 380 }}>
        {/* Sidebar */}
        <div style={{
          width: 140, borderRight: '1px solid rgba(255,255,255,0.05)',
          padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4,
          background: 'rgba(255,255,255,0.01)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', marginBottom: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg,#16a34a,#4ade80)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>P</div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>palmeo</span>
          </div>
          {[
            { icon: '📊', label: "Vue d'ensemble", active: true },
            { icon: '🌴', label: 'Production', active: false },
            { icon: '💰', label: 'Revenus', active: false },
            { icon: '💸', label: 'Charges', active: false },
            { icon: '🚚', label: 'Fournisseurs', active: false },
          ].map(({ icon, label, active }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 8px', borderRadius: 7, fontSize: 11,
              background: active ? 'rgba(74,222,128,0.1)' : 'transparent',
              color: active ? '#4ade80' : '#71717a',
            }}>
              <span style={{ fontSize: 12 }}>{icon}</span>
              <span style={{ fontWeight: active ? 600 : 400 }}>{label}</span>
            </div>
          ))}
          <div style={{ marginTop: 'auto', padding: '6px 8px' }}>
            <div style={{ fontSize: 10, color: '#3f3f46', marginBottom: 6 }}>Notifications</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)',
              borderRadius: 6, padding: '5px 7px', fontSize: 10, color: '#4ade80',
            }}>🔔 Notifs actives</div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Vue d'ensemble — Juin 2026</div>
              <div style={{ fontSize: 10, color: '#52525b' }}>APO Huilerie · mis à jour il y a 2 min</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['FCFA', 'EUR'].map((c, i) => (
                <div key={c} style={{
                  padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600,
                  background: i === 0 ? 'rgba(74,222,128,0.15)' : 'transparent',
                  border: `1px solid ${i === 0 ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  color: i === 0 ? '#4ade80' : '#52525b',
                }}>{c}</div>
              ))}
            </div>
          </div>

          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {[
              { label: 'TE moyen', value: '21.3%', delta: '+0.8%', ok: true },
              { label: 'Régimes reçus', value: '12 450 T', delta: 'ce mois', ok: null },
              { label: 'Huile produite', value: '2 580 T', delta: '+3.2% vs M-1', ok: true },
              { label: "C.A. HT", value: '487 M', delta: 'FCFA', ok: null },
            ].map(({ label, value, delta, ok }) => (
              <div key={label} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 8, padding: '10px 10px',
              }}>
                <div style={{ fontSize: 9, color: '#52525b', marginBottom: 5 }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}>{value}</div>
                <div style={{ fontSize: 9, marginTop: 4, fontWeight: 600, color: ok === true ? '#4ade80' : ok === false ? '#f87171' : '#52525b' }}>{delta}</div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, flex: 1 }}>
            {/* TE chart */}
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 8, padding: 10,
            }}>
              <div style={{ fontSize: 10, color: '#52525b', marginBottom: 6 }}>Taux d'extraction — juin 2026</div>
              <svg viewBox="0 0 400 90" width="100%" height="80" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="28" x2="400" y2="28" stroke="#4ade80" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.25" />
                <text x="3" y="26" fontSize="7" fill="#4ade80" opacity="0.5">20%</text>
                <path d="M0,55 C20,52 40,48 70,44 C100,40 130,36 160,38 C190,42 220,50 250,46 C280,42 310,36 340,32 C360,29 380,26 400,24 L400,90 L0,90 Z" fill="url(#g2)" />
                <path d="M0,55 C20,52 40,48 70,44 C100,40 130,36 160,38 C190,42 220,50 250,46 C280,42 310,36 340,32 C360,29 380,26 400,24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </div>
            {/* P&L mini */}
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ fontSize: 10, color: '#52525b' }}>P&L — Juin 2026</div>
              {[
                { label: 'Revenus', value: '487 M', bar: 100, color: '#4ade80' },
                { label: 'Charges', value: '312 M', bar: 64, color: '#f87171' },
                { label: 'Marge nette', value: '175 M', bar: 36, color: '#60a5fa' },
              ].map(({ label, value, bar, color }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#71717a', marginBottom: 3 }}>
                    <span>{label}</span><span style={{ color: '#d4d4d8' }}>{value} FCFA</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${bar}%`, background: color, borderRadius: 2, opacity: 0.8 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Phone mockup ─── */
function PhoneMockup() {
  return (
    <div style={{
      background: '#1c1c1e', borderRadius: 36, padding: '14px 10px',
      width: 220, boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      {/* Notch */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <div style={{ width: 80, height: 22, background: '#000', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 10, height: 10, background: '#1c1c1e', borderRadius: '50%' }} />
        </div>
      </div>
      {/* Status bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#636366', marginBottom: 10, padding: '0 6px' }}>
        <span style={{ fontWeight: 600 }}>19:02</span><span>▐▐▐ 🔋</span>
      </div>

      {/* Lock screen */}
      <div style={{ padding: '0 4px' }}>
        {/* Notification banner */}
        <div style={{
          background: 'rgba(44,44,46,0.95)', backdropFilter: 'blur(12px)',
          borderRadius: 14, padding: '10px 12px',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
              background: 'linear-gradient(135deg,#16a34a,#4ade80)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff',
            }}>P</div>
            <div>
              <div style={{ fontSize: 9, color: '#636366' }}>palmeo · maintenant</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>APO — 18 juin  ✓ TE 21.3%</div>
            </div>
          </div>
          <div style={{ fontSize: 10, color: '#aeaeb2', lineHeight: 1.55 }}>
            Reçus 847T • Traités 820T • Huile 168T<br />
            Citernes : 150T sortis<br />
            <span style={{ color: '#4ade80' }}>TE stable, au-dessus du seuil cible.</span>
          </div>
        </div>

        {/* Mini app preview */}
        <div style={{ marginTop: 10, background: 'rgba(28,28,30,0.9)', borderRadius: 12, padding: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 9, color: '#52525b', marginBottom: 6 }}>Palmeo · Vue rapide</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { label: 'TE', value: '21.3%', color: '#4ade80' },
              { label: 'Huile', value: '168 T', color: '#fff' },
              { label: 'C.A.', value: '487M', color: '#fff' },
              { label: 'Marge', value: '35.9%', color: '#60a5fa' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 7, padding: '6px 8px' }}>
                <div style={{ fontSize: 8, color: '#52525b' }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function DemoModal({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{
          width: '100%', maxWidth: 420, padding: 36, borderRadius: 20, position: 'relative',
          background: '#111318', border: '1px solid rgba(255,255,255,0.1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', fontSize: 18 }}>✕</button>
        <div className="tag" style={{ marginBottom: 20 }}>
          <span style={{ fontSize: 8 }}>●</span> Demander une démo
        </div>
        <h3 style={{ color: '#fff', fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Discutons de votre huilerie</h3>
        <p style={{ color: '#71717a', fontSize: 14, lineHeight: 1.65, marginBottom: 24 }}>
          Envoyez-nous un email et nous vous répondrons sous 24h pour organiser une démonstration personnalisée.
        </p>
        <a
          href="mailto:contact@palmeo.co?subject=Demande%20de%20d%C3%A9mo%20Palmeo&body=Bonjour%2C%0A%0AJe%20souhaite%20en%20savoir%20plus%20sur%20Palmeo.%0A%0ANom%20%3A%20%0ASoci%C3%A9t%C3%A9%20%3A%20%0AT%C3%A9l%C3%A9phone%20%3A%20"
          className="btn-primary"
          style={{ display: 'flex', width: '100%', justifyContent: 'center' }}
        >
          <Mail size={16} />
          contact@palmeo.co
        </a>
        <p style={{ color: '#3f3f46', fontSize: 12, textAlign: 'center', marginTop: 16 }}>Réponse garantie sous 24h ouvrées</p>
      </motion.div>
    </motion.div>
  )
}

export default function App() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div style={{ background: '#08090e', minHeight: '100vh' }}>

      {/* Orbs */}
      <div className="orb" style={{ width: 600, height: 600, top: -200, left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle, rgba(22,163,74,0.15) 0%, transparent 70%)' }} />
      <div className="orb" style={{ width: 400, height: 400, bottom: '20%', right: '-10%', background: 'radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)' }} />

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'relative', zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', maxWidth: 1100, margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#16a34a,#4ade80)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>P</div>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 18 }}>palmeo</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{ display: 'flex', gap: 28 }}>
            {[['#integrations', 'Intégrations'], ['#models', 'Offres'], ['#features', 'Fonctionnalités'], ['https://app.palmeo.co', 'Se connecter']].map(([href, label]) => (
              <a key={href} href={href} style={{ color: '#71717a', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#fff'}
                onMouseLeave={e => e.target.style.color = '#71717a'}
              >{label}</a>
            ))}
          </div>
          <button className="btn-primary" style={{ fontSize: 14 }} onClick={() => setShowModal(true)}>Démo gratuite</button>
        </div>
      </motion.nav>

      {/* ══════════ HERO ══════════ */}
      <section style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '60px 24px 100px', maxWidth: 1000, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="tag" style={{ display: 'inline-flex', marginBottom: 28 }}>
          <Zap size={11} /> Intelligence opérationnelle pour les huileries
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2, ease: [0.22,1,0.36,1] }}
          className="gradient-text"
          style={{ fontSize: 'clamp(36px,6vw,68px)', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.08, marginBottom: 24 }}>
          Pilotez votre huilerie<br />en temps réel
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.32 }}
          style={{ color: '#71717a', fontSize: 18, lineHeight: 1.7, maxWidth: 560, margin: '0 auto 36px' }}>
          Taux d'extraction, régimes, P&L mensuel, alertes IA — toutes vos données de production accessibles sur un seul tableau de bord, depuis n'importe quel appareil.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.42 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button className="btn-primary" style={{ fontSize: 16, padding: '14px 28px' }} onClick={() => setShowModal(true)}>
            Demander une démo <ChevronRight size={16} />
          </button>
          <a href="https://app.palmeo.co" className="btn-secondary" style={{ fontSize: 16, padding: '14px 28px' }}>Voir l'application</a>
        </motion.div>

        {/* Hero mockup — dashboard complet + phone */}
        <motion.div initial={{ opacity: 0, y: 32, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, delay: 0.55, ease: [0.22,1,0.36,1] }}
          style={{ position: 'relative', maxWidth: 1060, margin: '60px auto 0', display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
          <div style={{ position: 'relative', minWidth: 0 }}>
            <div style={{ position: 'absolute', inset: -1, background: 'linear-gradient(135deg,rgba(22,163,74,0.25),transparent 60%,rgba(96,165,250,0.1))', borderRadius: 18, filter: 'blur(16px)' }} />
            <div style={{ position: 'relative' }}>
              <DashboardDesktopMockup />
            </div>
          </div>
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} style={{ flexShrink: 0 }}>
            <PhoneMockup />
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════ STATS ══════════ */}
      <section id="stats" style={{ position: 'relative', zIndex: 10, borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '64px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 40, textAlign: 'center' }}>
          {STATS.map(({ value, label, sub }, i) => (
            <AnimateIn key={label} i={i}>
              <div className="stat-value gradient-text" style={{ marginBottom: 8 }}>{value}</div>
              <div style={{ color: '#fff', fontWeight: 500, fontSize: 15 }}>{label}</div>
              <div style={{ color: '#52525b', fontSize: 13, marginTop: 4 }}>{sub}</div>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* ══════════ INTEGRATIONS MARQUEE ══════════ */}
      <section id="integrations" style={{ position: 'relative', zIndex: 10, padding: '80px 0' }}>
        <AnimateIn style={{ textAlign: 'center', marginBottom: 40, padding: '0 24px' }}>
          <div className="tag" style={{ display: 'inline-flex', marginBottom: 16 }}>
            <Database size={11} /> Sources de données
          </div>
          <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(24px,3.5vw,36px)', letterSpacing: -0.8, marginBottom: 12 }}>
            Compatible avec vos outils existants
          </h2>
          <p style={{ color: '#71717a', maxWidth: 520, margin: '0 auto', lineHeight: 1.7, fontSize: 15 }}>
            ERP, logiciels de comptabilité, fichiers Excel, API maison — Palmeo s'adapte à votre système, pas l'inverse.
          </p>
        </AnimateIn>
        <LogoMarquee />
      </section>

      {/* ══════════ 3 MODÈLES ══════════ */}
      <section id="models" style={{ position: 'relative', zIndex: 10, padding: '20px 24px 96px', maxWidth: 1100, margin: '0 auto' }}>
        <AnimateIn style={{ textAlign: 'center', marginBottom: 52 }}>
          <div className="tag" style={{ display: 'inline-flex', marginBottom: 16 }}>
            <Puzzle size={11} /> Nos offres
          </div>
          <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(26px,4vw,40px)', letterSpacing: -1, marginBottom: 12 }}>
            Trois façons de démarrer
          </h2>
          <p style={{ color: '#71717a', maxWidth: 500, margin: '0 auto', lineHeight: 1.7, fontSize: 15 }}>
            Quelle que soit votre infrastructure actuelle, il existe un modèle Palmeo fait pour vous.
          </p>
        </AnimateIn>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
          {MODELS.map(({ icon, badge, title, desc, sources, points, accent, featured }, i) => (
            <AnimateIn key={badge} i={i}>
              <div style={{
                position: 'relative', height: '100%',
                background: featured ? `rgba(96,165,250,0.04)` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${featured ? `${accent}30` : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', gap: 0,
                boxShadow: featured ? `0 0 0 1px ${accent}20, 0 8px 40px ${accent}10` : 'none',
              }}>
                {featured && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg,${accent},${accent}aa)`, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 100, whiteSpace: 'nowrap', letterSpacing: 0.5 }}>
                    LE PLUS COURANT
                  </div>
                )}

                {/* Icon + badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${accent}15`, border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {icon}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: 0.5, textTransform: 'uppercase' }}>{badge}</div>
                </div>

                <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 18, lineHeight: 1.3, marginBottom: 12 }}>{title}</h3>
                <p style={{ color: '#71717a', fontSize: 14, lineHeight: 1.65, marginBottom: 20 }}>{desc}</p>

                {/* Compatible sources */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: '#52525b', marginBottom: 8, fontWeight: 600 }}>COMPATIBLE AVEC</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {sources.map(s => (
                      <span key={s} style={{ fontSize: 11, padding: '3px 10px', background: `${accent}0a`, border: `1px solid ${accent}20`, borderRadius: 100, color: '#a1a1aa' }}>{s}</span>
                    ))}
                  </div>
                </div>

                {/* Points */}
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9, marginTop: 'auto' }}>
                  {points.map(pt => (
                    <li key={pt} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#d4d4d8' }}>
                      <Check size={14} style={{ color: accent, flexShrink: 0, marginTop: 2 }} />
                      {pt}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setShowModal(true)}
                  style={{
                    marginTop: 24, width: '100%', padding: '11px 0',
                    background: featured ? `linear-gradient(135deg,${accent}cc,${accent}88)` : 'transparent',
                    border: `1px solid ${accent}40`,
                    borderRadius: 10, cursor: 'pointer',
                    color: featured ? '#fff' : accent,
                    fontSize: 14, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  En savoir plus <ArrowRight size={14} />
                </button>
              </div>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section id="features" style={{ position: 'relative', zIndex: 10, padding: '0 24px 96px', maxWidth: 1100, margin: '0 auto' }}>
        <AnimateIn style={{ textAlign: 'center', marginBottom: 52 }}>
          <div className="tag" style={{ display: 'inline-flex', marginBottom: 16 }}>
            <TrendingUp size={11} /> Fonctionnalités
          </div>
          <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(26px,4vw,40px)', letterSpacing: -1, marginBottom: 12 }}>
            Tout ce qu'il faut pour piloter<br />une huilerie moderne
          </h2>
          <p style={{ color: '#71717a', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
            Conçu avec des responsables d'huileries en Côte d'Ivoire. Chaque fonctionnalité répond à un besoin réel du terrain.
          </p>
        </AnimateIn>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
          {FEATURES.map(({ icon, title, desc }, i) => (
            <AnimateIn key={title} i={i % 3} className="glass-card" style={{ padding: 24 }}>
              <div className="feature-icon" style={{ marginBottom: 16 }}>{icon}</div>
              <h3 style={{ color: '#fff', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{title}</h3>
              <p style={{ color: '#71717a', fontSize: 14, lineHeight: 1.65 }}>{desc}</p>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* ══════════ PUSH NOTIF SECTION ══════════ */}
      <section style={{ position: 'relative', zIndex: 10, padding: '0 24px 96px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <AnimateIn>
            <div className="tag" style={{ marginBottom: 24 }}>
              <Bell size={11} /> Push + IA
            </div>
            <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(22px,3vw,34px)', letterSpacing: -0.8, marginBottom: 16 }}>
              Restez informé,<br />
              <span className="gradient-text">analysé par l'IA</span>
            </h2>
            <p style={{ color: '#71717a', lineHeight: 1.7, marginBottom: 24, fontSize: 15 }}>
              Palmeo compile vos données de production et demande à Claude d'analyser les tendances. Vous recevez les alertes et bilans clés directement sur votre téléphone.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {["TE du jour vs seuil 20%", 'Régimes reçus, traités, huile produite', 'Sorties citerne (ventes)', 'Insight IA sur la tendance'].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#d4d4d8', fontSize: 14 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#4ade80' }}>✓</div>
                  {item}
                </li>
              ))}
            </ul>
          </AnimateIn>
          <AnimateIn i={1} style={{ display: 'flex', justifyContent: 'center' }}>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
              <div style={{ background: '#1c1c1e', borderRadius: 24, padding: 16, width: 290, boxShadow: '0 24px 80px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#636366', marginBottom: 14, padding: '0 4px' }}>
                  <span>19:02</span><span>▐▐▐ ☁</span>
                </div>
                <div style={{ background: '#2c2c2e', borderRadius: 14, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: 'linear-gradient(135deg,#16a34a,#4ade80)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>P</div>
                    <div>
                      <div style={{ fontSize: 11, color: '#636366' }}>palmeo · maintenant</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>APO — 18 juin  ✓ TE 21.3%</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#aeaeb2', lineHeight: 1.6 }}>
                    Reçus 847T • Traités 820T • Huile 168T<br />
                    Citernes : 150T sortis<br />
                    <span style={{ color: '#4ade80' }}>TE stable sur 3 jours, au-dessus du seuil cible.</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimateIn>
        </div>
      </section>

      {/* ══════════ CTA ══════════ */}
      <section style={{ position: 'relative', zIndex: 10, padding: '20px 24px 96px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <AnimateIn>
            <div style={{ position: 'relative', padding: '64px 40px', borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', width: 400, height: 400, top: -200, left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle,rgba(22,163,74,0.12) 0%,transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
              <div className="tag" style={{ display: 'inline-flex', marginBottom: 24, position: 'relative' }}>
                <Mail size={11} /> Démo gratuite
              </div>
              <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(26px,4vw,38px)', letterSpacing: -1, marginBottom: 16, position: 'relative' }}>
                Prêt à piloter votre huilerie<br />
                <span className="gradient-text">autrement ?</span>
              </h2>
              <p style={{ color: '#71717a', lineHeight: 1.7, marginBottom: 32, position: 'relative', fontSize: 15 }}>
                Discutons de vos besoins. On vous montre comment Palmeo s'adapte à votre huilerie en moins d'une heure.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap', position: 'relative' }}>
                <button className="btn-primary" style={{ fontSize: 16, padding: '14px 32px' }} onClick={() => setShowModal(true)}>
                  Demander une démo <ChevronRight size={16} />
                </button>
                <a href="https://app.palmeo.co" className="btn-secondary" style={{ fontSize: 15 }}>Accéder à l'app →</a>
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer style={{ position: 'relative', zIndex: 10, borderTop: '1px solid rgba(255,255,255,0.05)', padding: '36px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20, fontSize: 13, color: '#3f3f46' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg,#16a34a,#4ade80)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>P</div>
            <span>palmeo.co — {new Date().getFullYear()}</span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[['https://app.palmeo.co', 'Application'], ['mailto:contact@palmeo.co', 'contact@palmeo.co']].map(([href, label]) => (
              <a key={href} href={href} style={{ color: '#3f3f46', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#fff'}
                onMouseLeave={e => e.target.style.color = '#3f3f46'}
              >{label}</a>
            ))}
          </div>
        </div>
      </footer>

      {showModal && <DemoModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

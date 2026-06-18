import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  BarChart3, Bell, Brain, ChevronRight, FileText,
  LineChart, Mail, Shield, TrendingUp, Zap,
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
    desc: "Claude analyse vos données chaque soir et vous envoie un résumé avec un insight actionnable sur votre performance.",
  },
  {
    icon: <Bell size={20} className="text-emerald-400" />,
    title: 'Notifications push',
    desc: "Bilan quotidien directement sur votre téléphone à 19h. Soyez informé même quand vous n'êtes pas devant un écran.",
  },
  {
    icon: <Shield size={20} className="text-emerald-400" />,
    title: 'Multi-tenant & sécurisé',
    desc: 'Chaque huilerie a ses propres données isolées. Contrôle d\'accès par rôle : opérateur, manager, comptable.',
  },
]

const STATS = [
  { value: '21%', label: 'TE moyen suivi', sub: 'en temps réel' },
  { value: '< 5s', label: 'Mise à jour', sub: 'des données' },
  { value: '100%', label: 'Web & Mobile', sub: 'aucune installation' },
]

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
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#52525b', fontSize: 18, lineHeight: 1,
          }}
        >✕</button>
        <div className="tag" style={{ marginBottom: 20 }}>
          <span style={{ fontSize: 8 }}>●</span> Demander une démo
        </div>
        <h3 style={{ color: '#fff', fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
          Discutons de votre huilerie
        </h3>
        <p style={{ color: '#71717a', fontSize: 14, lineHeight: 1.65, marginBottom: 24 }}>
          Envoyez-nous un email et nous vous répondrons sous 24h pour organiser une démonstration personnalisée.
        </p>
        <a
          href="mailto:contact@palmeo.co?subject=Demande%20de%20d%C3%A9mo%20Palmeo&body=Bonjour%2C%0A%0AJe%20souhaite%20en%20savoir%20plus%20sur%20Palmeo%20pour%20notre%20huilerie.%0A%0ANom%20%3A%20%0ASoci%C3%A9t%C3%A9%20%3A%20%0AT%C3%A9l%C3%A9phone%20%3A%20"
          className="btn-primary"
          style={{ display: 'flex', width: '100%', justifyContent: 'center' }}
        >
          <Mail size={16} />
          contact@palmeo.co
        </a>
        <p style={{ color: '#3f3f46', fontSize: 12, textAlign: 'center', marginTop: 16 }}>
          Réponse garantie sous 24h ouvrées
        </p>
      </motion.div>
    </motion.div>
  )
}

export default function App() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div style={{ background: '#08090e', minHeight: '100vh' }}>

      {/* Background orbs */}
      <div className="orb" style={{
        width: 600, height: 600, top: -200, left: '50%',
        transform: 'translateX(-50%)',
        background: 'radial-gradient(circle, rgba(22,163,74,0.15) 0%, transparent 70%)',
      }} />
      <div className="orb" style={{
        width: 400, height: 400, bottom: '20%', right: '-10%',
        background: 'radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)',
      }} />

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
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #16a34a, #4ade80)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#fff',
          }}>P</div>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 18 }}>palmeo</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{ display: 'flex', gap: 28 }}>
            {[['#features', 'Fonctionnalités'], ['#stats', 'Performance'], ['https://app.palmeo.co', 'Se connecter']].map(([href, label]) => (
              <a key={href} href={href} style={{ color: '#71717a', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#fff'}
                onMouseLeave={e => e.target.style.color = '#71717a'}
              >{label}</a>
            ))}
          </div>
          <button className="btn-primary" style={{ fontSize: 14 }} onClick={() => setShowModal(true)}>
            Démo gratuite
          </button>
        </div>
      </motion.nav>

      {/* Hero */}
      <section style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '60px 24px 100px', maxWidth: 1000, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="tag"
          style={{ display: 'inline-flex', marginBottom: 28 }}
        >
          <Zap size={11} />
          Intelligence opérationnelle pour les huileries
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="gradient-text"
          style={{ fontSize: 'clamp(36px, 6vw, 68px)', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.08, marginBottom: 24 }}
        >
          Pilotez votre huilerie<br />en temps réel
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.32 }}
          style={{ color: '#71717a', fontSize: 18, lineHeight: 1.7, maxWidth: 560, margin: '0 auto 36px' }}
        >
          Taux d'extraction, régimes, P&L mensuel, alertes IA —
          toutes vos données de production accessibles sur un seul tableau de bord,
          depuis n'importe quel appareil.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.42 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}
        >
          <button className="btn-primary" style={{ fontSize: 16, padding: '14px 28px' }} onClick={() => setShowModal(true)}>
            Demander une démo
            <ChevronRight size={16} />
          </button>
          <a href="https://app.palmeo.co" className="btn-secondary" style={{ fontSize: 16, padding: '14px 28px' }}>
            Voir l'application
          </a>
        </motion.div>

        {/* Dashboard preview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative', maxWidth: 880, margin: '60px auto 0' }}
        >
          <div style={{
            position: 'absolute', inset: -1,
            background: 'linear-gradient(135deg, rgba(22,163,74,0.3), transparent 50%, rgba(251,191,36,0.15))',
            borderRadius: 20, filter: 'blur(20px)',
          }} />
          <div style={{
            position: 'relative', borderRadius: 20,
            background: 'rgba(10,11,15,0.9)',
            border: '1px solid rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}>
            {/* Browser chrome */}
            <div style={{
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['#ff5f57','#febc2e','#28c840'].map(c => (
                  <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
                ))}
              </div>
              <div style={{
                flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 6,
                height: 24, maxWidth: 240, display: 'flex', alignItems: 'center',
                paddingLeft: 10, fontSize: 11, color: '#3f3f46',
              }}>app.palmeo.co</div>
            </div>

            {/* KPI cards */}
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: 'TE du jour', value: '21.3%', delta: '+0.4% vs hier', ok: true },
                { label: 'Régimes reçus', value: '847 T', delta: "aujourd'hui", ok: null },
                { label: 'Huile produite', value: '168 T', delta: '+3T vs hier', ok: true },
              ].map(({ label, value, delta, ok }) => (
                <div key={label} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12, padding: 16, textAlign: 'left',
                }}>
                  <div style={{ fontSize: 11, color: '#3f3f46', marginBottom: 8 }}>{label}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -1, color: '#fff' }}>{value}</div>
                  <div style={{
                    fontSize: 11, marginTop: 6, fontWeight: 600,
                    color: ok === true ? '#4ade80' : ok === false ? '#f87171' : '#52525b',
                  }}>{delta}</div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div style={{ padding: '0 20px 20px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12, padding: 16, height: 130,
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ fontSize: 11, color: '#3f3f46' }}>Taux d'extraction — Juin 2026</div>
                <svg viewBox="0 0 800 80" width="100%" height="80" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#16a34a" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="30" x2="800" y2="30" stroke="#4ade80" strokeWidth="1" strokeDasharray="4,4" opacity="0.25" />
                  <path
                    d="M0,52 C50,48 100,44 160,40 C200,36 250,33 300,36 C350,40 400,46 450,42 C500,38 550,33 600,30 C640,27 680,25 760,22 L760,80 L0,80 Z"
                    fill="url(#chartGrad)"
                  />
                  <path
                    d="M0,52 C50,48 100,44 160,40 C200,36 250,33 300,36 C350,40 400,46 450,42 C500,38 550,33 600,30 C640,27 680,25 760,22"
                    fill="none" stroke="#4ade80" strokeWidth="2" strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section id="stats" style={{
        position: 'relative', zIndex: 10,
        borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '64px 24px',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40, textAlign: 'center' }}>
          {STATS.map(({ value, label, sub }, i) => (
            <AnimateIn key={label} i={i}>
              <div className="stat-value gradient-text" style={{ marginBottom: 8 }}>{value}</div>
              <div style={{ color: '#fff', fontWeight: 500, fontSize: 15 }}>{label}</div>
              <div style={{ color: '#52525b', fontSize: 13, marginTop: 4 }}>{sub}</div>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ position: 'relative', zIndex: 10, padding: '96px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <AnimateIn style={{ textAlign: 'center', marginBottom: 60 }}>
          <div className="tag" style={{ display: 'inline-flex', marginBottom: 20 }}>
            <TrendingUp size={11} />
            Fonctionnalités
          </div>
          <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(28px, 4vw, 42px)', letterSpacing: -1, marginBottom: 16 }}>
            Tout ce qu'il faut pour<br />piloter une huilerie moderne
          </h2>
          <p style={{ color: '#71717a', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
            Conçu avec des responsables d'huileries en Côte d'Ivoire.
            Chaque fonctionnalité répond à un besoin réel du terrain.
          </p>
        </AnimateIn>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {FEATURES.map(({ icon, title, desc }, i) => (
            <AnimateIn key={title} i={i % 3} className="glass-card" style={{ padding: 24 }}>
              <div className="feature-icon" style={{ marginBottom: 16 }}>{icon}</div>
              <h3 style={{ color: '#fff', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{title}</h3>
              <p style={{ color: '#71717a', fontSize: 14, lineHeight: 1.65 }}>{desc}</p>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* Push notif preview */}
      <section style={{ position: 'relative', zIndex: 10, padding: '40px 24px 96px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <AnimateIn>
            <div className="tag" style={{ marginBottom: 24 }}>
              <Bell size={11} />
              Push + IA
            </div>
            <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(24px, 3vw, 36px)', letterSpacing: -0.8, marginBottom: 16 }}>
              Un bilan chaque soir,<br />
              <span className="gradient-text">analysé par l'IA</span>
            </h2>
            <p style={{ color: '#71717a', lineHeight: 1.7, marginBottom: 24, fontSize: 15 }}>
              À 19h, Palmeo compile vos données de production et demande à Claude
              d'analyser les tendances. Vous recevez un résumé directement sur votre téléphone.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {["TE du jour vs seuil 20%", 'Régimes reçus, traités, huile produite', 'Sorties citerne (ventes)', 'Insight IA sur la tendance'].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#d4d4d8', fontSize: 14 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, color: '#4ade80',
                  }}>✓</div>
                  {item}
                </li>
              ))}
            </ul>
          </AnimateIn>

          <AnimateIn i={1} style={{ display: 'flex', justifyContent: 'center' }}>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                background: '#1c1c1e', borderRadius: 24, padding: 16, width: 290,
                boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#636366', marginBottom: 14, padding: '0 4px' }}>
                <span>19:02</span><span>▐▐▐ ☁</span>
              </div>
              <div style={{
                background: '#2c2c2e', borderRadius: 14, padding: '12px 14px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: 'linear-gradient(135deg, #16a34a, #4ade80)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#fff',
                  }}>P</div>
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
            </motion.div>
          </AnimateIn>
        </div>
      </section>

      {/* CTA */}
      <section style={{ position: 'relative', zIndex: 10, padding: '20px 24px 96px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <AnimateIn>
            <div style={{
              position: 'relative', padding: '64px 40px', borderRadius: 24,
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', width: 400, height: 400,
                top: -200, left: '50%', transform: 'translateX(-50%)',
                background: 'radial-gradient(circle, rgba(22,163,74,0.12) 0%, transparent 70%)',
                borderRadius: '50%', pointerEvents: 'none',
              }} />
              <div className="tag" style={{ display: 'inline-flex', marginBottom: 24, position: 'relative' }}>
                <Mail size={11} /> Démo gratuite
              </div>
              <h2 style={{
                color: '#fff', fontWeight: 800, fontSize: 'clamp(26px, 4vw, 38px)',
                letterSpacing: -1, marginBottom: 16, position: 'relative',
              }}>
                Prêt à piloter votre huilerie<br />
                <span className="gradient-text">autrement ?</span>
              </h2>
              <p style={{ color: '#71717a', lineHeight: 1.7, marginBottom: 32, position: 'relative', fontSize: 15 }}>
                Discutons de vos besoins. On vous montre comment Palmeo
                s'adapte à votre huilerie en moins d'une heure.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap', position: 'relative' }}>
                <button className="btn-primary" style={{ fontSize: 16, padding: '14px 32px' }} onClick={() => setShowModal(true)}>
                  Demander une démo <ChevronRight size={16} />
                </button>
                <a href="https://app.palmeo.co" className="btn-secondary" style={{ fontSize: 15 }}>
                  Accéder à l'app →
                </a>
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        position: 'relative', zIndex: 10,
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '36px 24px',
      }}>
        <div style={{
          maxWidth: 1000, margin: '0 auto',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20,
          fontSize: 13, color: '#3f3f46',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 22, height: 22, borderRadius: 6,
              background: 'linear-gradient(135deg, #16a34a, #4ade80)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: '#fff',
            }}>P</div>
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

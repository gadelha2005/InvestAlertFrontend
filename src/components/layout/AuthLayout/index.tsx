import type { ReactNode } from 'react'
import { TrendingUp } from 'lucide-react'
import './AuthLayout.css'

interface AuthLayoutProps {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}

export default function AuthLayout({
  title,
  description,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <main className="auth-layout">
      <div className="auth-layout__shell">
        <div className="auth-layout__glow" />

        <section className="auth-layout__panel">
          <aside className="auth-layout__hero">
            <div className="auth-layout__hero-content">
              <div>
                <div className="auth-layout__brand">
                  <TrendingUp className="auth-layout__brand-icon" size={20} />
                  <span>InvestAlert</span>
                </div>

                <div className="auth-layout__hero-text">
                  <h1 className="auth-layout__hero-title">
                    Acompanhe seus investimentos com mais clareza.
                  </h1>
                  <p className="auth-layout__hero-description">
                    Um painel pensado para centralizar carteira, alertas e metas
                    em uma experi&ecirc;ncia simples, objetiva e moderna.
                  </p>
                </div>
              </div>

              <div className="auth-layout__hero-metrics">
                <div className="auth-layout__metric">Alertas em tempo real</div>
                <div className="auth-layout__metric">Vis&atilde;o da carteira</div>
                <div className="auth-layout__metric">Metas organizadas</div>
              </div>
            </div>
          </aside>

          <div className="auth-layout__content">
            <div className="auth-layout__content-inner">
              <div className="auth-layout__mobile-brand">
                <div className="auth-layout__mobile-icon-box">
                  <TrendingUp size={26} />
                </div>
                <span className="auth-layout__mobile-name">InvestAlert</span>
              </div>

              <header className="auth-layout__header">
                <h2 className="auth-layout__title">{title}</h2>
                <p className="auth-layout__description">{description}</p>
              </header>

              <div className="auth-layout__card">{children}</div>

              <div className="auth-layout__footer">{footer}</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

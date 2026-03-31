import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  Bell,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  Target,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import './AppLayout.css'

interface AppLayoutProps {
  children: ReactNode
}

const navItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/ativos',
    label: 'Ativos',
    icon: LineChart,
  },
  {
    to: '/carteira',
    label: 'Carteira',
    icon: Wallet,
  },
  {
    to: '/alertas',
    label: 'Alertas',
    icon: Bell,
  },
  {
    to: '/metas',
    label: 'Metas',
    icon: Target,
  },
  {
    to: '/notificacoes',
    label: 'Notificacoes',
    icon: TrendingUp,
  },
]

export default function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate()
  const { usuario, logout } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-layout">
      <header className="app-layout__header">
        <div className="app-layout__header-inner">
          <div className="app-layout__brand-group">
            <Link to="/dashboard" className="app-layout__brand">
              <div className="app-layout__brand-badge">
                <TrendingUp size={20} />
              </div>
              <div className="app-layout__brand-name">
                <span>Invest</span>
                <span>Alert</span>
              </div>
            </Link>

            <nav className="app-layout__nav">
              {navItems.map((item) => {
                const Icon = item.icon

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        'app-layout__nav-link',
                        isActive ? 'app-layout__nav-link--active' : '',
                      ].join(' ').trim()
                    }
                  >
                    <Icon size={16} />
                    {item.label}
                  </NavLink>
                )
              })}
            </nav>
          </div>

          <div className="app-layout__actions">
            <div className="app-layout__identity">
              <p className="app-layout__identity-name">{usuario?.nome || 'Investidor'}</p>
              <p className="app-layout__identity-email">
                {usuario?.email || 'Sessao autenticada'}
              </p>
            </div>

            <Button className="app-layout__logout" onClick={handleLogout}>
              <LogOut size={16} />
              Sair
            </Button>

            <button
              type="button"
              className="app-layout__menu-button"
              onClick={() => setMobileOpen((current) => !current)}
              aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="app-layout__mobile-nav">
            <div className="app-layout__mobile-nav-inner">
              {navItems.map((item) => {
                const Icon = item.icon

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      [
                        'app-layout__nav-link',
                        isActive ? 'app-layout__nav-link--active' : '',
                      ].join(' ').trim()
                    }
                  >
                    <Icon size={16} />
                    {item.label}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ) : null}
      </header>

      <main className="app-layout__main">{children}</main>
    </div>
  )
}

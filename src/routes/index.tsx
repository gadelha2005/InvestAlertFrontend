import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Login from '@/pages/Login'
import Cadastro from '@/pages/Cadastro'
import Dashboard from '@/pages/Dashboard'
import Ativos from '@/pages/Ativos'
import Carteira from '@/pages/Carteira'
import Alertas from '@/pages/Alertas'
import Metas from '@/pages/Metas/Metas'
import Notificacoes from '@/pages/Notificacoes/Notificacoes'

interface PrivateRouteProps {
  children: React.ReactNode
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

const PublicRoute = ({ children }: PrivateRouteProps) => {
  const { isAuthenticated } = useAuthStore()
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/login" element={
          <PublicRoute><Login/></PublicRoute>
        } />
        <Route path="/cadastro" element={
          <PublicRoute><Cadastro /></PublicRoute>
        } />

        {/* Rotas privadas */}
        <Route path="/dashboard" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        } />
        <Route path="/ativos" element={
          <PrivateRoute><Ativos /></PrivateRoute>
        } />
        <Route path="/carteira" element={
          <PrivateRoute><Carteira /></PrivateRoute>
        } />
        <Route path="/alertas" element={
          <PrivateRoute><Alertas /></PrivateRoute>
        } />
        <Route path="/metas" element={
          <PrivateRoute><Metas /></PrivateRoute>
        } />
        <Route path="/notificacoes" element={
          <PrivateRoute><Notificacoes /></PrivateRoute>
        } />

        {/* Redirect padrão */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

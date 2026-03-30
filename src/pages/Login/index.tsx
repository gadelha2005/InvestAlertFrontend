import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { authApi } from '@/api/auth'
import AuthLayout from '@/components/layout/AuthLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Label from '@/components/ui/Label'
import { useAuthStore } from '@/store/authStore'
import type { ErrorResponse } from '@/types'
import './Login.css'

export default function Login() {
  const { isAuthenticated, login } = useAuthStore()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

    if (email.trim() === '' || senha.trim() === '') {
      setErrorMessage('Preencha email e senha para continuar.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await authApi.login({
        email: email.trim(),
        senha,
      })

      login(response)
    } catch (error) {
      const apiError = error as ErrorResponse
      setErrorMessage(apiError.mensagem ?? 'N&atilde;o foi poss&iacute;vel entrar agora.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Entrar na conta"
      description="Acesse sua conta para acompanhar alertas, carteira e metas em um s&oacute; lugar."
      footer={
        <>
          Ainda n&atilde;o tem conta?{' '}
          <Link to="/cadastro" className="login-form__link">
            Criar conta
          </Link>
        </>
      }
    >
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-form__field">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="login-form__field">
          <div className="login-form__row">
            <Label htmlFor="password">Senha</Label>
            <button type="button" className="login-form__helper">
              Esqueci minha senha
            </button>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="Digite sua senha"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            autoComplete="current-password"
          />
        </div>

        {errorMessage ? (
          <div className="login-form__feedback login-form__feedback--error">
            {errorMessage}
          </div>
        ) : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </AuthLayout>
  )
}

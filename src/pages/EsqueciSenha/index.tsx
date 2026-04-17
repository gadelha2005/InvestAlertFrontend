import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '@/api/auth'
import AuthLayout from '@/components/layout/AuthLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Label from '@/components/ui/Label'

export default function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')

    if (!email.trim()) {
      setErro('Informe seu email.')
      return
    }

    setIsSubmitting(true)
    try {
      await authApi.solicitarRedefinicao(email.trim())
      setEnviado(true)
    } catch {
      setErro('Não foi possível processar a solicitação. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Recuperar senha"
      description="Informe seu email e enviaremos um link para criar uma nova senha."
      footer={
        <>
          Lembrou a senha?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
            Fazer login
          </Link>
        </>
      }
    >
      {enviado ? (
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Email enviado!</p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Se esse email estiver cadastrado, você receberá as instruções em breve.
            Verifique também a caixa de spam.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          {erro && (
            <p style={{ color: 'var(--color-danger)', fontSize: '0.875rem' }}>{erro}</p>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar link de recuperação'}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}

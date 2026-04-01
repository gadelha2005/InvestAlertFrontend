import { useEffect, useMemo, useState } from 'react'
import { Bell, BellRing, Check, CheckCheck, Mail, MessageCircle, Trash2 } from 'lucide-react'
import { notificacoesApi } from '@/api/notificacoes'
import { formatarData } from '@/api/format'
import { useLoadingWithDelay } from '@/hooks/useLoadingWithDelay'
import LoadingOverlay from '@/components/LoadingOverlay'
import StatCard from '@/components/dashboard/StatCard'
import AppLayout from '@/components/layout/AppLayout'
import Button from '@/components/ui/Button'
import type { CanalNotificacao, ErrorResponse, NotificacaoResponse } from '@/types'
import './Notificacoes.css'

const canalConfig: Record<CanalNotificacao, { label: string; icon: typeof Mail }> = {
  EMAIL: { label: 'Email', icon: Mail },
  WHATSAPP: { label: 'WhatsApp', icon: MessageCircle },
  INTERNO: { label: 'Interno', icon: BellRing },
}

interface NotificacoesState {
  notificacoes: NotificacaoResponse[]
  naoLidas: number
}

export default function Notificacoes() {
  const [data, setData] = useState<NotificacoesState>({
    notificacoes: [],
    naoLidas: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isOperationLoading, setIsOperationLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const loadingWithDelay = useLoadingWithDelay()

  const carregarNotificacoes = async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const [notificacoes, naoLidas] = await Promise.all([
        notificacoesApi.listar(),
        notificacoesApi.contarNaoLidas(),
      ])

      setData({
        notificacoes,
        naoLidas,
      })
    } catch (error) {
      const apiError = error as ErrorResponse
      setErrorMessage(apiError.mensagem ?? 'Nao foi possivel carregar as notificacoes.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void carregarNotificacoes()
  }, [])

  const totalNotificacoes = data.notificacoes.length
  const notificacoesLidas = useMemo(
    () => data.notificacoes.filter((notificacao) => notificacao.lida).length,
    [data.notificacoes]
  )

  const resetFeedback = () => {
    setSubmitError('')
    setSubmitSuccess('')
  }

  const handleMarcarComoLida = async (id: number) => {
    resetFeedback()
    setIsOperationLoading(true)

    try {
      await loadingWithDelay(() => notificacoesApi.marcarComoLida(id))
      setSubmitSuccess('Notificacao marcada como lida.')
      await carregarNotificacoes()
    } catch (error) {
      const apiError = error as ErrorResponse
      setSubmitError(apiError.mensagem ?? 'Nao foi possivel marcar a notificacao como lida.')
    } finally {
      setIsOperationLoading(false)
    }
  }

  const handleMarcarTodasComoLidas = async () => {
    resetFeedback()
    setIsOperationLoading(true)

    try {
      await loadingWithDelay(() => notificacoesApi.marcarTodasComoLidas())
      setSubmitSuccess('Todas as notificacoes foram marcadas como lidas.')
      await carregarNotificacoes()
    } catch (error) {
      const apiError = error as ErrorResponse
      setSubmitError(apiError.mensagem ?? 'Nao foi possivel atualizar as notificacoes.')
    } finally {
      setIsOperationLoading(false)
    }
  }

  const handleLimparTodas = async () => {
    resetFeedback()
    setIsOperationLoading(true)

    try {
      await loadingWithDelay(() => notificacoesApi.deletarTodas())
      setSubmitSuccess('Todas as notificacoes foram removidas.')
      await carregarNotificacoes()
    } catch (error) {
      const apiError = error as ErrorResponse
      setSubmitError(apiError.mensagem ?? 'Nao foi possivel remover as notificacoes.')
    } finally {
      setIsOperationLoading(false)
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="notifications-status">
          <h1 className="notifications-status__title">Carregando notificacoes</h1>
          <p>Buscando os avisos mais recentes vinculados a sua conta.</p>
        </div>
      </AppLayout>
    )
  }

  if (errorMessage) {
    return (
      <AppLayout>
        <div className="notifications-status">
          <h1 className="notifications-status__title">Nao foi possivel abrir as notificacoes</h1>
          <p>{errorMessage}</p>
          <div className="notifications-status__actions">
            <Button className="notifications-status__button" onClick={() => void carregarNotificacoes()}>
              Tentar novamente
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <LoadingOverlay isVisible={isOperationLoading} message="Atualizando notificacoes..." />
      <div className="notifications-page">
        <section className="notifications-page__hero">
          <div>
            <h1 className="notifications-page__hero-title">Notificacoes</h1>
            <p className="notifications-page__hero-description">
              Acompanhe os avisos enviados pelos seus alertas e mantenha a caixa de entrada em dia.
            </p>
          </div>

          <div className="notifications-page__hero-actions">
            <div className="notifications-page__hero-pill">{data.naoLidas} nao lidas</div>
            <Button
              className="notifications-page__hero-button notifications-page__hero-button--secondary"
              onClick={() => void handleMarcarTodasComoLidas()}
              disabled={data.naoLidas === 0}
            >
              <CheckCheck size={16} />
              Marcar todas
            </Button>
            <Button
              className="notifications-page__hero-button notifications-page__hero-button--danger"
              onClick={() => void handleLimparTodas()}
              disabled={totalNotificacoes === 0}
            >
              <Trash2 size={16} />
              Limpar tudo
            </Button>
          </div>
        </section>

        {submitError ? <div className="notifications-feedback notifications-feedback--error">{submitError}</div> : null}
        {submitSuccess ? <div className="notifications-feedback notifications-feedback--success">{submitSuccess}</div> : null}

        <section className="notifications-page__stats">
          <StatCard label="Total de notificacoes" value={String(totalNotificacoes)} meta="Registradas para sua conta" icon={Bell} />
          <StatCard label="Nao lidas" value={String(data.naoLidas)} meta="Demandam atencao agora" icon={BellRing} />
          <StatCard label="Lidas" value={String(notificacoesLidas)} meta="Ja revisadas por voce" icon={Check} />
        </section>

        <section className="notifications-section">
          <div className="notifications-section__header">
            <div>
              <h2 className="notifications-section__title">Sua caixa de entrada</h2>
              <p className="notifications-section__subtitle">
                Lista completa com status de leitura, canal de envio e horario de recebimento.
              </p>
            </div>
            <div className="notifications-section__badge">{totalNotificacoes} itens</div>
          </div>

          {totalNotificacoes > 0 ? (
            <div className="notifications-list">
              {data.notificacoes.map((notificacao) => {
                const config = canalConfig[notificacao.canal]
                const Icon = config.icon

                return (
                  <article
                    key={notificacao.id}
                    className={[
                      'notification-card',
                      notificacao.lida ? 'notification-card--read' : 'notification-card--unread',
                    ].join(' ').trim()}
                  >
                    <div className="notification-card__row">
                      <div className="notification-card__identity">
                        <div className="notification-card__icon-box">
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className="notification-card__title">{config.label}</p>
                          <p className="notification-card__description">{notificacao.mensagem}</p>
                        </div>
                      </div>

                      <div className="notification-card__actions">
                        {!notificacao.lida ? (
                          <button
                            type="button"
                            className="notification-card__action"
                            onClick={() => void handleMarcarComoLida(notificacao.id)}
                          >
                            <Check size={15} />
                            Marcar como lida
                          </button>
                        ) : (
                          <span className="notification-card__read-label">
                            <CheckCheck size={15} />
                            Lida
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="notification-card__meta">
                      <span className="notification-card__badge notification-card__badge--accent">
                        Canal: {config.label}
                      </span>
                      <span className="notification-card__badge">
                        {formatarData(notificacao.dataEnvio)}
                      </span>
                      <span
                        className={[
                          'notification-card__badge',
                          !notificacao.lida ? 'notification-card__badge--warning' : 'notification-card__badge--success',
                        ].join(' ').trim()}
                      >
                        {notificacao.lida ? 'Lida' : 'Nao lida'}
                      </span>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="notifications-empty">
              Nenhuma notificacao foi registrada ainda. Quando seus alertas dispararem, elas vao aparecer aqui.
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  )
}

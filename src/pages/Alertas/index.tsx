import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Bell, BellOff, Percent, Plus, Trash2, X } from 'lucide-react'
import { alertasApi } from '@/api/alertas'
import { ativosApi } from '@/api/ativos'
import { formatarData, formatarMoeda, formatarPercentual } from '@/api/format'
import { useLoadingWithDelay } from '@/hooks/useLoadingWithDelay'
import LoadingOverlay from '@/components/LoadingOverlay'
import StatCard from '@/components/dashboard/StatCard'
import AppLayout from '@/components/layout/AppLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Label from '@/components/ui/Label'
import type { AlertaRequest, AlertaResponse, AtivoResponse, ErrorResponse, TipoAlerta } from '@/types'
import './Alertas.css'

const alertTypeMap: Record<TipoAlerta, { label: string; icon: typeof ArrowUp; unit: 'currency' | 'percent' }> = {
  PRECO_ACIMA: { label: 'Preco maximo', icon: ArrowUp, unit: 'currency' },
  PRECO_ABAIXO: { label: 'Preco minimo', icon: ArrowDown, unit: 'currency' },
  VARIACAO: { label: 'Variacao %', icon: Percent, unit: 'percent' },
}

export default function Alertas() {
  const [alertas, setAlertas] = useState<AlertaResponse[]>([])
  const [ativos, setAtivos] = useState<AtivoResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOperationLoading, setIsOperationLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const loadingWithDelay = useLoadingWithDelay()
  const [formData, setFormData] = useState<{
    ticker: string
    tipo: TipoAlerta
    valorAlvo: string
  }>({
    ticker: '',
    tipo: 'PRECO_ACIMA',
    valorAlvo: '',
  })

  const carregarDados = async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const [alertasResponse, ativosResponse] = await Promise.all([
        alertasApi.listar(),
        ativosApi.listar(),
      ])
      setAlertas(alertasResponse)
      setAtivos(ativosResponse)
    } catch (error) {
      const apiError = error as ErrorResponse
      setErrorMessage(apiError.mensagem ?? 'Nao foi possivel carregar os alertas.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void carregarDados()
  }, [])

  const ativosAtivados = useMemo(() => alertas.filter((alerta) => alerta.ativado).length, [alertas])

  const resetFeedback = () => {
    setSubmitError('')
    setSubmitSuccess('')
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setFormData({
      ticker: '',
      tipo: 'PRECO_ACIMA',
      valorAlvo: '',
    })
    resetFeedback()
  }

  const formatarValorAlerta = (alerta: AlertaResponse) => {
    return alerta.tipo === 'VARIACAO'
      ? formatarPercentual(alerta.valorAlvo)
      : formatarMoeda(alerta.valorAlvo)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetFeedback()

    if (formData.ticker === '' || formData.valorAlvo.trim() === '') {
      setSubmitError('Selecione um ativo e informe o valor alvo.')
      return
    }

    const valorAlvo = Number(formData.valorAlvo)
    if (Number.isNaN(valorAlvo) || valorAlvo <= 0) {
      setSubmitError('O valor alvo precisa ser maior que zero.')
      return
    }

    setIsSubmitting(true)
    setIsOperationLoading(true)

    try {
      const payload: AlertaRequest = {
        ticker: formData.ticker,
        tipo: formData.tipo,
        valorAlvo,
      }

      await loadingWithDelay(() => alertasApi.criar(payload))
      setSubmitSuccess('Alerta criado com sucesso.')
      await carregarDados()
      window.setTimeout(() => closeModal(), 900)
    } catch (error) {
      const apiError = error as ErrorResponse
      setSubmitError(apiError.mensagem ?? 'Nao foi possivel criar o alerta.')
    } finally {
      setIsSubmitting(false)
      setIsOperationLoading(false)
    }
  }

  const handleToggleStatus = async (alerta: AlertaResponse) => {
    resetFeedback()
    setIsOperationLoading(true)

    try {
      await loadingWithDelay(() => alertasApi.alterarStatus(alerta.id, !alerta.ativado))
      setSubmitSuccess(`Alerta ${!alerta.ativado ? 'ativado' : 'pausado'} com sucesso.`)
      await carregarDados()
    } catch (error) {
      const apiError = error as ErrorResponse
      setSubmitError(apiError.mensagem ?? 'Nao foi possivel alterar o status do alerta.')
    } finally {
      setIsOperationLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    resetFeedback()
    setIsOperationLoading(true)

    try {
      await loadingWithDelay(() => alertasApi.deletar(id))
      setSubmitSuccess('Alerta removido com sucesso.')
      await carregarDados()
    } catch (error) {
      const apiError = error as ErrorResponse
      setSubmitError(apiError.mensagem ?? 'Nao foi possivel remover o alerta.')
    } finally {
      setIsOperationLoading(false)
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="alerts-status">
          <h1 className="alerts-status__title">Carregando alertas</h1>
          <p>Buscando alertas e ativos disponiveis para configuracao.</p>
        </div>
      </AppLayout>
    )
  }

  if (errorMessage) {
    return (
      <AppLayout>
        <div className="alerts-status">
          <h1 className="alerts-status__title">Nao foi possivel abrir os alertas</h1>
          <p>{errorMessage}</p>
          <div className="alerts-status__actions">
            <Button className="alerts-status__button" onClick={() => void carregarDados()}>
              Tentar novamente
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <LoadingOverlay isVisible={isOperationLoading} message="Processando operação..." />
      <div className="alerts-page">
        <section className="alerts-page__hero">
          <div>
            <h1 className="alerts-page__hero-title">Alertas</h1>
            <p className="alerts-page__hero-description">
              Receba notificacoes quando os ativos atingirem preco acima, preco abaixo ou uma variacao percentual definida por voce.
            </p>
          </div>
          <div className="alerts-page__hero-actions">
            <div className="alerts-page__hero-pill">{alertas.length} alertas cadastrados</div>
            <Button className="alerts-page__hero-button" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} />
              Novo alerta
            </Button>
          </div>
        </section>

        {submitError ? <div className="alerts-feedback alerts-feedback--error">{submitError}</div> : null}
        {submitSuccess ? <div className="alerts-feedback alerts-feedback--success">{submitSuccess}</div> : null}

        <section className="alerts-page__stats">
          <StatCard label="Alertas totais" value={String(alertas.length)} meta="Configurados no momento" icon={Bell} />
          <StatCard label="Alertas ativos" value={String(ativosAtivados)} meta="Acompanhando condicoes" icon={Bell} />
        </section>

        <section className="alerts-section">
          <div className="alerts-section__header">
            <div>
              <h2 className="alerts-section__title">Seus alertas</h2>
              <p className="alerts-section__subtitle">Lista completa com status, valor alvo e preco atual do ativo.</p>
            </div>
            <div className="alerts-section__badge">{alertas.length} itens</div>
          </div>

          {alertas.length > 0 ? (
            <div className="alerts-list">
              {alertas.map((alerta) => {
                const meta = alertTypeMap[alerta.tipo]
                const Icon = meta.icon

                return (
                  <article key={alerta.id} className={['alert-card', !alerta.ativado ? 'alert-card--inactive' : ''].join(' ').trim()}>
                    <div className="alert-card__row">
                      <div className="alert-card__identity">
                        <div className="alert-card__icon-box">
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className="alert-card__title">{alerta.ticker}</p>
                          <p className="alert-card__description">
                            {meta.label}: {formatarValorAlerta(alerta)} • criado em {formatarData(alerta.dataCriacao)}
                          </p>
                        </div>
                      </div>

                      <div className="alert-card__actions">
                        <button type="button" className="alert-card__action" onClick={() => void handleToggleStatus(alerta)}>
                          {alerta.ativado ? <Bell size={15} /> : <BellOff size={15} />}
                          {alerta.ativado ? 'Ativo' : 'Pausado'}
                        </button>
                        <button type="button" className="alert-card__action alert-card__action--danger" onClick={() => void handleDelete(alerta.id)}>
                          <Trash2 size={15} />
                          Remover
                        </button>
                      </div>
                    </div>

                    <div className="alert-card__meta">
                      <span className="alert-card__badge alert-card__badge--accent">
                        Preco atual: {formatarMoeda(alerta.precoAtual)}
                      </span>
                      <span className={['alert-card__badge', alerta.ativado ? 'alert-card__badge--warning' : ''].join(' ').trim()}>
                        {alerta.ativado ? 'Monitorando' : 'Desativado'}
                      </span>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="alerts-empty">
              Nenhum alerta foi criado ainda. Use o botao acima para configurar o primeiro.
            </div>
          )}
        </section>

        {isModalOpen ? (
          <div className="alerts-modal" role="dialog" aria-modal="true">
            <div className="alerts-modal__panel">
              <div className="alerts-modal__header">
                <div>
                  <h2 className="alerts-modal__title">Criar alerta</h2>
                  <p className="alerts-modal__description">
                    Escolha um ativo, o tipo de condicao e o valor alvo que deseja monitorar.
                  </p>
                </div>
                <button type="button" className="alerts-modal__close" onClick={closeModal} aria-label="Fechar modal">
                  <X size={18} />
                </button>
              </div>

              <form className="alerts-modal__form" onSubmit={handleSubmit}>
                <div className="alerts-modal__grid">
                  <div className="alerts-modal__field">
                    <Label htmlFor="ticker">Ativo</Label>
                    <select id="ticker" className="alerts-modal__select" value={formData.ticker} onChange={(event) => setFormData((current) => ({ ...current, ticker: event.target.value }))}>
                      <option value="">Selecione</option>
                      {ativos.map((ativo) => (
                        <option key={ativo.id} value={ativo.ticker}>
                          {ativo.ticker} {ativo.nome ? `- ${ativo.nome}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="alerts-modal__field">
                    <Label htmlFor="tipo">Tipo</Label>
                    <select id="tipo" className="alerts-modal__select" value={formData.tipo} onChange={(event) => setFormData((current) => ({ ...current, tipo: event.target.value as TipoAlerta }))}>
                      {Object.entries(alertTypeMap).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="alerts-modal__grid">
                  <div className="alerts-modal__field">
                    <Label htmlFor="valorAlvo">
                      {formData.tipo === 'VARIACAO' ? 'Variacao alvo (%)' : 'Valor alvo'}
                    </Label>
                    <Input id="valorAlvo" type="number" step="0.01" min="0.01" placeholder={formData.tipo === 'VARIACAO' ? 'Ex.: 5' : 'Ex.: 25.50'} value={formData.valorAlvo} onChange={(event) => setFormData((current) => ({ ...current, valorAlvo: event.target.value }))} />
                  </div>
                </div>

                <div className="alerts-modal__actions">
                  <Button type="button" className="alerts-modal__secondary" onClick={closeModal}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Salvando...' : 'Criar alerta'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </AppLayout>
  )
}

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Pencil,
  Plus,
  Target,
  Trash2,
  Trophy,
  Wallet,
  X,
} from 'lucide-react'
import { formatarData, formatarMoeda, formatarPercentual } from '@/api/format'
import { carteiraApi } from '@/api/carteira'
import { metasApi } from '@/api/metas'
import { useLoadingWithDelay } from '@/hooks/useLoadingWithDelay'
import LoadingOverlay from '@/components/LoadingOverlay'
import StatCard from '@/components/dashboard/StatCard'
import AppLayout from '@/components/layout/AppLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Label from '@/components/ui/Label'
import type {
  CarteiraResponse,
  ErrorResponse,
  MetaMovimentacaoRequest,
  MetaMovimentacaoResponse,
  MetaRequest,
  MetaResponse,
  TipoAcompanhamentoMeta,
  TipoMovimentacaoMeta,
} from '@/types'
import './Metas.css'

interface MetaFormState {
  nome: string
  valorObjetivo: string
  tipoAcompanhamento: TipoAcompanhamentoMeta
  carteiraId: string
  dataLimite: string
}

interface MovimentacaoFormState {
  tipo: TipoMovimentacaoMeta
  valor: string
  descricao: string
  dataMovimentacao: string
}

const initialMetaFormState: MetaFormState = {
  nome: '',
  valorObjetivo: '',
  tipoAcompanhamento: 'MANUAL',
  carteiraId: '',
  dataLimite: '',
}

const initialMovimentacaoFormState: MovimentacaoFormState = {
  tipo: 'APORTE',
  valor: '',
  descricao: '',
  dataMovimentacao: '',
}

const acompanhamentoLabels: Record<TipoAcompanhamentoMeta, string> = {
  MANUAL: 'Manual',
  CARTEIRA_VINCULADA: 'Carteira vinculada',
}

const movimentacaoLabels: Record<TipoMovimentacaoMeta, string> = {
  APORTE: 'Aporte',
  RESGATE: 'Resgate',
}

const getProgressValue = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return 0
  }

  return Math.min(Math.max(value, 0), 100)
}

const getCarteiraNome = (meta: MetaResponse, carteiras: CarteiraResponse[]) => {
  if (!meta.carteiraId) {
    return null
  }

  return (
    carteiras.find((carteira) => carteira.id === meta.carteiraId)?.nome ??
    `Carteira #${meta.carteiraId}`
  )
}

export default function Metas() {
  const [metas, setMetas] = useState<MetaResponse[]>([])
  const [carteiras, setCarteiras] = useState<CarteiraResponse[]>([])
  const [movimentacoesPorMeta, setMovimentacoesPorMeta] = useState<
    Record<number, MetaMovimentacaoResponse[]>
  >({})
  const [isLoading, setIsLoading] = useState(true)
  const [isOperationLoading, setIsOperationLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [isMetaModalOpen, setIsMetaModalOpen] = useState(false)
  const [isMovimentacaoModalOpen, setIsMovimentacaoModalOpen] = useState(false)
  const [isSubmittingMeta, setIsSubmittingMeta] = useState(false)
  const [isSubmittingMovimentacao, setIsSubmittingMovimentacao] = useState(false)
  const [editingMeta, setEditingMeta] = useState<MetaResponse | null>(null)
  const [selectedMeta, setSelectedMeta] = useState<MetaResponse | null>(null)
  const [metaFormData, setMetaFormData] = useState<MetaFormState>(initialMetaFormState)
  const [movimentacaoFormData, setMovimentacaoFormData] = useState<MovimentacaoFormState>(
    initialMovimentacaoFormState
  )
  const loadingWithDelay = useLoadingWithDelay()

  const carregarDados = async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const [metasResponse, carteirasResponse] = await Promise.all([
        metasApi.listar(),
        carteiraApi.listar(),
      ])

      setMetas(metasResponse)
      setCarteiras(carteirasResponse)

      const metasManuais = metasResponse.filter(
        (meta) => meta.tipoAcompanhamento === 'MANUAL'
      )
      const movimentacoesEntries = await Promise.all(
        metasManuais.map(async (meta) => [
          meta.id,
          await metasApi.listarMovimentacoes(meta.id),
        ] as const)
      )
      setMovimentacoesPorMeta(Object.fromEntries(movimentacoesEntries))
    } catch (error) {
      const apiError = error as ErrorResponse
      setErrorMessage(apiError.mensagem ?? 'Nao foi possivel carregar as metas.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void carregarDados()
  }, [])

  const totalObjetivo = useMemo(
    () => metas.reduce((total, meta) => total + (meta.valorObjetivo ?? 0), 0),
    [metas]
  )

  const totalAtual = useMemo(
    () => metas.reduce((total, meta) => total + (meta.valorAtual ?? 0), 0),
    [metas]
  )

  const metasConcluidas = useMemo(
    () => metas.filter((meta) => (meta.percentualConcluido ?? 0) >= 100).length,
    [metas]
  )

  const metasManuais = useMemo(
    () => metas.filter((meta) => meta.tipoAcompanhamento === 'MANUAL').length,
    [metas]
  )

  const resetFeedback = () => {
    setSubmitError('')
    setSubmitSuccess('')
  }

  const resetMetaForm = () => {
    setMetaFormData(initialMetaFormState)
    setEditingMeta(null)
  }

  const resetMovimentacaoForm = () => {
    setMovimentacaoFormData(initialMovimentacaoFormState)
    setSelectedMeta(null)
  }

  const closeMetaModal = () => {
    setIsMetaModalOpen(false)
    resetMetaForm()
    resetFeedback()
  }

  const closeMovimentacaoModal = () => {
    setIsMovimentacaoModalOpen(false)
    resetMovimentacaoForm()
    resetFeedback()
  }

  const openCreateModal = () => {
    resetFeedback()
    resetMetaForm()
    setIsMetaModalOpen(true)
  }

  const openEditModal = (meta: MetaResponse) => {
    resetFeedback()
    setEditingMeta(meta)
    setMetaFormData({
      nome: meta.nome,
      valorObjetivo: String(meta.valorObjetivo),
      tipoAcompanhamento: meta.tipoAcompanhamento,
      carteiraId: meta.carteiraId ? String(meta.carteiraId) : '',
      dataLimite: meta.dataLimite ? meta.dataLimite.slice(0, 10) : '',
    })
    setIsMetaModalOpen(true)
  }

  const openMovimentacaoModal = (meta: MetaResponse) => {
    resetFeedback()
    setSelectedMeta(meta)
    setMovimentacaoFormData(initialMovimentacaoFormState)
    setIsMovimentacaoModalOpen(true)
  }

  const handleSubmitMeta = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetFeedback()

    if (metaFormData.nome.trim() === '' || metaFormData.valorObjetivo.trim() === '') {
      setSubmitError('Preencha o nome da meta e o valor objetivo.')
      return
    }

    const valorObjetivo = Number(metaFormData.valorObjetivo)
    if (Number.isNaN(valorObjetivo) || valorObjetivo <= 0) {
      setSubmitError('O valor objetivo precisa ser maior que zero.')
      return
    }

    if (
      metaFormData.tipoAcompanhamento === 'CARTEIRA_VINCULADA' &&
      metaFormData.carteiraId === ''
    ) {
      setSubmitError('Selecione uma carteira para metas vinculadas.')
      return
    }

    setIsSubmittingMeta(true)
    setIsOperationLoading(true)

    try {
      const payload: MetaRequest = {
        nome: metaFormData.nome.trim(),
        valorObjetivo,
        tipoAcompanhamento: metaFormData.tipoAcompanhamento,
        carteiraId:
          metaFormData.tipoAcompanhamento === 'CARTEIRA_VINCULADA'
            ? Number(metaFormData.carteiraId)
            : undefined,
        dataLimite: metaFormData.dataLimite
          ? `${metaFormData.dataLimite}T00:00:00`
          : undefined,
      }

      if (editingMeta) {
        await loadingWithDelay(() => metasApi.atualizar(editingMeta.id, payload))
        setSubmitSuccess('Meta atualizada com sucesso.')
      } else {
        await loadingWithDelay(() => metasApi.criar(payload))
        setSubmitSuccess('Meta criada com sucesso.')
      }

      await carregarDados()
      window.setTimeout(() => closeMetaModal(), 900)
    } catch (error) {
      const apiError = error as ErrorResponse
      setSubmitError(apiError.mensagem ?? 'Nao foi possivel salvar a meta.')
    } finally {
      setIsSubmittingMeta(false)
      setIsOperationLoading(false)
    }
  }

  const handleSubmitMovimentacao = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    resetFeedback()

    if (!selectedMeta) {
      return
    }

    const valor = Number(movimentacaoFormData.valor)
    if (Number.isNaN(valor) || valor <= 0) {
      setSubmitError('O valor da movimentacao precisa ser maior que zero.')
      return
    }

    setIsSubmittingMovimentacao(true)
    setIsOperationLoading(true)

    try {
      const payload: MetaMovimentacaoRequest = {
        tipo: movimentacaoFormData.tipo,
        valor,
        descricao: movimentacaoFormData.descricao.trim() || undefined,
        dataMovimentacao: movimentacaoFormData.dataMovimentacao
          ? `${movimentacaoFormData.dataMovimentacao}T00:00:00`
          : undefined,
      }

      await loadingWithDelay(() => metasApi.criarMovimentacao(selectedMeta.id, payload))
      setSubmitSuccess(
        `${movimentacaoLabels[movimentacaoFormData.tipo]} registrada com sucesso.`
      )
      await carregarDados()
      window.setTimeout(() => closeMovimentacaoModal(), 900)
    } catch (error) {
      const apiError = error as ErrorResponse
      setSubmitError(apiError.mensagem ?? 'Nao foi possivel registrar a movimentacao.')
    } finally {
      setIsSubmittingMovimentacao(false)
      setIsOperationLoading(false)
    }
  }

  const handleDeleteMeta = async (id: number) => {
    resetFeedback()
    setIsOperationLoading(true)

    try {
      await loadingWithDelay(() => metasApi.deletar(id))
      setSubmitSuccess('Meta removida com sucesso.')
      await carregarDados()
    } catch (error) {
      const apiError = error as ErrorResponse
      setSubmitError(apiError.mensagem ?? 'Nao foi possivel remover a meta.')
    } finally {
      setIsOperationLoading(false)
    }
  }

  const handleDeleteMovimentacao = async (metaId: number, movimentacaoId: number) => {
    resetFeedback()
    setIsOperationLoading(true)

    try {
      await loadingWithDelay(() =>
        metasApi.deletarMovimentacao(metaId, movimentacaoId)
      )
      setSubmitSuccess('Movimentacao removida com sucesso.')
      await carregarDados()
    } catch (error) {
      const apiError = error as ErrorResponse
      setSubmitError(apiError.mensagem ?? 'Nao foi possivel remover a movimentacao.')
    } finally {
      setIsOperationLoading(false)
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="goals-status">
          <h1 className="goals-status__title">Carregando metas</h1>
          <p>Buscando o progresso, o tipo de acompanhamento e o historico de cada meta.</p>
        </div>
      </AppLayout>
    )
  }

  if (errorMessage) {
    return (
      <AppLayout>
        <div className="goals-status">
          <h1 className="goals-status__title">Nao foi possivel abrir as metas</h1>
          <p>{errorMessage}</p>
          <div className="goals-status__actions">
            <Button className="goals-status__button" onClick={() => void carregarDados()}>
              Tentar novamente
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <LoadingOverlay isVisible={isOperationLoading} message="Atualizando metas..." />
      <div className="goals-page">
        <section className="goals-page__hero">
          <div>
            <h1 className="goals-page__hero-title">Metas</h1>
            <p className="goals-page__hero-description">
              Combine metas manuais e metas vinculadas a carteira, acompanhe o progresso e registre aportes ou resgates quando fizer sentido.
            </p>
          </div>

          <div className="goals-page__hero-actions">
            <div className="goals-page__hero-pill">{metas.length} metas cadastradas</div>
            <Button className="goals-page__hero-button" onClick={openCreateModal}>
              <Plus size={16} />
              Nova meta
            </Button>
          </div>
        </section>

        {submitError ? <div className="goals-feedback goals-feedback--error">{submitError}</div> : null}
        {submitSuccess ? <div className="goals-feedback goals-feedback--success">{submitSuccess}</div> : null}

        <section className="goals-page__stats">
          <StatCard label="Metas totais" value={String(metas.length)} meta="Objetivos acompanhados agora" icon={Target} />
          <StatCard label="Valor acumulado" value={formatarMoeda(totalAtual)} meta={`De ${formatarMoeda(totalObjetivo)} planejados`} icon={Wallet} />
          <StatCard label="Concluidas" value={String(metasConcluidas)} meta={`${metas.length - metasConcluidas} ainda em andamento`} icon={Trophy} />
          <StatCard label="Manuais" value={String(metasManuais)} meta={`${metas.length - metasManuais} vinculadas a carteira`} icon={Landmark} />
        </section>

        <section className="goals-section">
          <div className="goals-section__header">
            <div>
              <h2 className="goals-section__title">Seus objetivos</h2>
              <p className="goals-section__subtitle">
                Veja valor atual, objetivo, forma de acompanhamento e movimentacoes das metas manuais.
              </p>
            </div>
            <div className="goals-section__badge">{formatarMoeda(totalObjetivo)} em objetivos</div>
          </div>

          {metas.length > 0 ? (
            <div className="goals-list">
              {metas.map((meta) => {
                const percentual = getProgressValue(meta.percentualConcluido)
                const restante = Math.max((meta.valorObjetivo ?? 0) - (meta.valorAtual ?? 0), 0)
                const carteiraNome = getCarteiraNome(meta, carteiras)
                const movimentacoes = movimentacoesPorMeta[meta.id] ?? []

                return (
                  <article key={meta.id} className="goal-card">
                    <div className="goal-card__row">
                      <div className="goal-card__identity">
                        <div className="goal-card__icon-box">
                          {meta.tipoAcompanhamento === 'MANUAL' ? <Target size={18} /> : <Landmark size={18} />}
                        </div>
                        <div>
                          <p className="goal-card__title">{meta.nome}</p>
                          <p className="goal-card__description">
                            Criada em {formatarData(meta.dataCriacao)}
                            {meta.dataLimite ? ` • prazo ${formatarData(meta.dataLimite)}` : ' • sem prazo definido'}
                          </p>
                        </div>
                      </div>

                      <div className="goal-card__actions">
                        {meta.tipoAcompanhamento === 'MANUAL' ? (
                          <button
                            type="button"
                            className="goal-card__action"
                            onClick={() => openMovimentacaoModal(meta)}
                          >
                            <Plus size={15} />
                            Movimentar
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="goal-card__action"
                          onClick={() => openEditModal(meta)}
                        >
                          <Pencil size={15} />
                          Editar
                        </button>
                        <button
                          type="button"
                          className="goal-card__action goal-card__action--danger"
                          onClick={() => void handleDeleteMeta(meta.id)}
                        >
                          <Trash2 size={15} />
                          Remover
                        </button>
                      </div>
                    </div>

                    <div className="goal-card__meta">
                      <span className="goal-card__badge goal-card__badge--accent">
                        {acompanhamentoLabels[meta.tipoAcompanhamento]}
                      </span>
                      {carteiraNome ? (
                        <span className="goal-card__badge">Carteira: {carteiraNome}</span>
                      ) : null}
                      <span className="goal-card__badge">{movimentacoes.length} movimentacoes</span>
                    </div>

                    <div className="goal-card__amounts">
                      <div className="goal-card__amount-block">
                        <span className="goal-card__amount-label">Atual</span>
                        <strong className="goal-card__amount-value">{formatarMoeda(meta.valorAtual)}</strong>
                      </div>
                      <div className="goal-card__amount-block">
                        <span className="goal-card__amount-label">Objetivo</span>
                        <strong className="goal-card__amount-value">{formatarMoeda(meta.valorObjetivo)}</strong>
                      </div>
                      <div className="goal-card__amount-block">
                        <span className="goal-card__amount-label">Falta</span>
                        <strong className="goal-card__amount-value">{formatarMoeda(restante)}</strong>
                      </div>
                    </div>

                    <div className="goal-card__progress">
                      <div className="goal-card__progress-header">
                        <span>Progresso da meta</span>
                        <span>{formatarPercentual(meta.percentualConcluido ?? 0)}</span>
                      </div>
                      <div className="goal-card__progress-bar">
                        <div className="goal-card__progress-fill" style={{ width: `${percentual}%` }} />
                      </div>
                    </div>

                    {meta.tipoAcompanhamento === 'MANUAL' ? (
                      <div className="goal-card__history">
                        <div className="goal-card__history-header">
                          <h3 className="goal-card__history-title">Movimentacoes</h3>
                          <span className="goal-card__history-badge">{movimentacoes.length} itens</span>
                        </div>

                        {movimentacoes.length > 0 ? (
                          <div className="goal-card__history-list">
                            {movimentacoes.slice(0, 4).map((movimentacao) => {
                              const isAporte = movimentacao.tipo === 'APORTE'

                              return (
                                <div key={movimentacao.id} className="goal-card__history-item">
                                  <div className="goal-card__history-main">
                                    <div
                                      className={[
                                        'goal-card__history-icon',
                                        isAporte
                                          ? 'goal-card__history-icon--positive'
                                          : 'goal-card__history-icon--negative',
                                      ].join(' ').trim()}
                                    >
                                      {isAporte ? <ArrowUpRight size={15} /> : <ArrowDownLeft size={15} />}
                                    </div>
                                    <div>
                                      <p className="goal-card__history-name">
                                        {movimentacaoLabels[movimentacao.tipo]} de {formatarMoeda(movimentacao.valor)}
                                      </p>
                                      <p className="goal-card__history-description">
                                        {movimentacao.descricao || 'Sem descricao'} • {formatarData(movimentacao.dataMovimentacao)}
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    className="goal-card__history-delete"
                                    onClick={() => void handleDeleteMovimentacao(meta.id, movimentacao.id)}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="goal-card__history-empty">
                            Nenhuma movimentacao registrada ainda para esta meta manual.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="goal-card__linked-info">
                        O valor atual desta meta depende da carteira vinculada no backend.
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="goals-empty">
              Nenhuma meta foi criada ainda. Use o botao acima para cadastrar o primeiro objetivo.
            </div>
          )}
        </section>

        {isMetaModalOpen ? (
          <div className="goals-modal" role="dialog" aria-modal="true">
            <div className="goals-modal__panel">
              <div className="goals-modal__header">
                <div>
                  <h2 className="goals-modal__title">{editingMeta ? 'Editar meta' : 'Criar meta'}</h2>
                  <p className="goals-modal__description">
                    Defina o objetivo, escolha se o acompanhamento sera manual ou vinculado a uma carteira e ajuste o prazo se quiser.
                  </p>
                </div>
                <button type="button" className="goals-modal__close" onClick={closeMetaModal} aria-label="Fechar modal">
                  <X size={18} />
                </button>
              </div>

              <form className="goals-modal__form" onSubmit={handleSubmitMeta}>
                <div className="goals-modal__field">
                  <Label htmlFor="nome">Nome da meta</Label>
                  <Input
                    id="nome"
                    placeholder="Ex.: Reserva de emergencia"
                    value={metaFormData.nome}
                    onChange={(event) => setMetaFormData((current) => ({ ...current, nome: event.target.value }))}
                  />
                </div>

                <div className="goals-modal__grid">
                  <div className="goals-modal__field">
                    <Label htmlFor="valorObjetivo">Valor objetivo</Label>
                    <Input
                      id="valorObjetivo"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Ex.: 10000"
                      value={metaFormData.valorObjetivo}
                      onChange={(event) => setMetaFormData((current) => ({ ...current, valorObjetivo: event.target.value }))}
                    />
                  </div>

                  <div className="goals-modal__field">
                    <Label htmlFor="dataLimite">Prazo</Label>
                    <Input
                      id="dataLimite"
                      type="date"
                      value={metaFormData.dataLimite}
                      onChange={(event) => setMetaFormData((current) => ({ ...current, dataLimite: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="goals-modal__field">
                  <Label htmlFor="tipoAcompanhamento">Tipo de acompanhamento</Label>
                  <select
                    id="tipoAcompanhamento"
                    className="goals-modal__select"
                    value={metaFormData.tipoAcompanhamento}
                    onChange={(event) =>
                      setMetaFormData((current) => ({
                        ...current,
                        tipoAcompanhamento: event.target.value as TipoAcompanhamentoMeta,
                        carteiraId: event.target.value === 'CARTEIRA_VINCULADA' ? current.carteiraId : '',
                      }))
                    }
                  >
                    <option value="MANUAL">Manual</option>
                    <option value="CARTEIRA_VINCULADA">Carteira vinculada</option>
                  </select>
                </div>

                {metaFormData.tipoAcompanhamento === 'CARTEIRA_VINCULADA' ? (
                  <div className="goals-modal__field">
                    <Label htmlFor="carteiraId">Carteira vinculada</Label>
                    <select
                      id="carteiraId"
                      className="goals-modal__select"
                      value={metaFormData.carteiraId}
                      onChange={(event) => setMetaFormData((current) => ({ ...current, carteiraId: event.target.value }))}
                    >
                      <option value="">Selecione</option>
                      {carteiras.map((carteira) => (
                        <option key={carteira.id} value={carteira.id}>
                          {carteira.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div className="goals-modal__actions">
                  <Button type="button" className="goals-modal__secondary" onClick={closeMetaModal}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmittingMeta}>
                    {isSubmittingMeta ? 'Salvando...' : editingMeta ? 'Salvar alteracoes' : 'Criar meta'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {isMovimentacaoModalOpen && selectedMeta ? (
          <div className="goals-modal" role="dialog" aria-modal="true">
            <div className="goals-modal__panel">
              <div className="goals-modal__header">
                <div>
                  <h2 className="goals-modal__title">Registrar movimentacao</h2>
                  <p className="goals-modal__description">
                    Adicione um aporte ou resgate para atualizar o valor atual da meta manual {selectedMeta.nome}.
                  </p>
                </div>
                <button type="button" className="goals-modal__close" onClick={closeMovimentacaoModal} aria-label="Fechar modal">
                  <X size={18} />
                </button>
              </div>

              <form className="goals-modal__form" onSubmit={handleSubmitMovimentacao}>
                <div className="goals-modal__grid">
                  <div className="goals-modal__field">
                    <Label htmlFor="tipoMovimentacao">Tipo</Label>
                    <select
                      id="tipoMovimentacao"
                      className="goals-modal__select"
                      value={movimentacaoFormData.tipo}
                      onChange={(event) =>
                        setMovimentacaoFormData((current) => ({
                          ...current,
                          tipo: event.target.value as TipoMovimentacaoMeta,
                        }))
                      }
                    >
                      <option value="APORTE">Aporte</option>
                      <option value="RESGATE">Resgate</option>
                    </select>
                  </div>

                  <div className="goals-modal__field">
                    <Label htmlFor="valorMovimentacao">Valor</Label>
                    <Input
                      id="valorMovimentacao"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Ex.: 500"
                      value={movimentacaoFormData.valor}
                      onChange={(event) =>
                        setMovimentacaoFormData((current) => ({ ...current, valor: event.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="goals-modal__grid">
                  <div className="goals-modal__field">
                    <Label htmlFor="descricaoMovimentacao">Descricao</Label>
                    <Input
                      id="descricaoMovimentacao"
                      placeholder="Ex.: Aporte do salario"
                      value={movimentacaoFormData.descricao}
                      onChange={(event) =>
                        setMovimentacaoFormData((current) => ({ ...current, descricao: event.target.value }))
                      }
                    />
                  </div>

                  <div className="goals-modal__field">
                    <Label htmlFor="dataMovimentacao">Data da movimentacao</Label>
                    <Input
                      id="dataMovimentacao"
                      type="date"
                      value={movimentacaoFormData.dataMovimentacao}
                      onChange={(event) =>
                        setMovimentacaoFormData((current) => ({ ...current, dataMovimentacao: event.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="goals-modal__actions">
                  <Button type="button" className="goals-modal__secondary" onClick={closeMovimentacaoModal}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmittingMovimentacao}>
                    {isSubmittingMovimentacao ? 'Salvando...' : 'Registrar movimentacao'}
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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Bell,
  Calendar,
  CircleAlert,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { alertasApi } from '@/api/alertas'
import { dashboardApi } from '@/api/dashboard'
import { formatarData, formatarMoeda, formatarPercentual } from '@/api/format'
import { notificacoesApi } from '@/api/notificacoes'
import StatCard from '@/components/dashboard/StatCard'
import AppLayout from '@/components/layout/AppLayout'
import Button from '@/components/ui/Button'
import type { AlertaResponse, DashboardResponse, ErrorResponse, NotificacaoResponse } from '@/types'
import './Dashboard.css'

interface DashboardState {
  dashboard: DashboardResponse | null
  notificacoes: NotificacaoResponse[]
  alertas: AlertaResponse[]
}

interface EvolucaoCarteiraPoint {
  chaveData: string
  data: string
  dataCompleta: string
  valorAtual: number
  valorInvestido: number
}

const getVariationTone = (value?: number | null) => {
  if (value === undefined || value === null || value === 0) {
    return 'neutral' as const
  }

  return value > 0 ? ('positive' as const) : ('negative' as const)
}

const formatarDia = (data: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(data))

const formatarDiaCompleto = (data: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(data))

const DASHBOARD_REFRESH_INTERVAL_MS = 30000

export default function Dashboard() {
  const [data, setData] = useState<DashboardState>({
    dashboard: null,
    notificacoes: [],
    alertas: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const hasDashboardDataRef = useRef(false)

  const carregarDashboard = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false

    if (!silent) {
      setIsLoading(true)
      setErrorMessage('')
    }

    try {
      const [dashboard, notificacoes, alertas] = await Promise.all([
        dashboardApi.get(),
        notificacoesApi.listar(),
        alertasApi.listar(),
      ])

      setData({
        dashboard,
        notificacoes,
        alertas,
      })
      hasDashboardDataRef.current = true

      setErrorMessage('')
    } catch (error) {
      const apiError = error as ErrorResponse
      if (!silent || !hasDashboardDataRef.current) {
        setErrorMessage(
          apiError.mensagem ?? 'Nao foi possivel carregar os dados do dashboard.'
        )
      }
    } finally {
      if (!silent) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void carregarDashboard()

    const intervalId = window.setInterval(() => {
      void carregarDashboard({ silent: true })
    }, DASHBOARD_REFRESH_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
  }, [carregarDashboard])

  const dashboard = data.dashboard
  const notificacoes = data.notificacoes
  const alertas = data.alertas
  const ativos = dashboard?.ativos ?? []
  const metas = dashboard?.metas ?? []
  const notificacoesRecentes = notificacoes.slice(0, 5)
  const alertasRecentes = alertas.slice(0, 5)
  const variacaoTotal = dashboard?.variacaoPercentualTotal ?? 0
  const lucroPrejuizo = dashboard?.lucroPrejuizoTotal ?? 0

  const evolucaoCarteira = useMemo<EvolucaoCarteiraPoint[]>(() => {
    const ativosOrdenados = [...ativos].sort(
      (a, b) =>
        new Date(a.dataCompra).getTime() - new Date(b.dataCompra).getTime()
    )

    const ativosPorDia = new Map<
      string,
      {
        dataCompra: string
        valorAtualDia: number
        valorInvestidoDia: number
      }
    >()

    ativosOrdenados.forEach((ativo) => {
      const chaveData = new Date(ativo.dataCompra).toISOString().slice(0, 10)
      const entradaAtual = ativosPorDia.get(chaveData)

      const valorAtualAtivo =
        ativo.valorAtual ??
        (ativo.precoAtual !== undefined
          ? ativo.precoAtual * ativo.quantidade
          : ativo.valor ?? 0)

      if (entradaAtual) {
        entradaAtual.valorAtualDia += valorAtualAtivo
        entradaAtual.valorInvestidoDia += ativo.valorInvestido ?? 0
        return
      }

      ativosPorDia.set(chaveData, {
        dataCompra: ativo.dataCompra,
        valorAtualDia: valorAtualAtivo,
        valorInvestidoDia: ativo.valorInvestido ?? 0,
      })
    })

    let valorAtualAcumulado = 0
    let valorInvestidoAcumulado = 0

    return [...ativosPorDia.entries()].map(([chaveData, item]) => {
      valorAtualAcumulado += item.valorAtualDia
      valorInvestidoAcumulado += item.valorInvestidoDia

      return {
        chaveData,
        data: formatarDia(item.dataCompra),
        dataCompleta: formatarDiaCompleto(item.dataCompra),
        valorAtual: valorAtualAcumulado,
        valorInvestido: valorInvestidoAcumulado,
      }
    })
  }, [ativos])

  if (isLoading) {
    return (
      <AppLayout>
        <div className="dashboard-status">
          <h1 className="dashboard-status__title">Carregando dashboard</h1>
          <p className="dashboard-status__description">
            Estamos buscando os dados mais recentes da sua carteira, metas e notificacoes.
          </p>
        </div>
      </AppLayout>
    )
  }

  if (errorMessage || !data.dashboard) {
    return (
      <AppLayout>
        <div className="dashboard-status">
          <h1 className="dashboard-status__title">Nao foi possivel abrir o dashboard</h1>
          <p className="dashboard-status__description">
            {errorMessage || 'Ocorreu um erro inesperado ao buscar seus dados.'}
          </p>
          <div className="dashboard-status__actions">
            <Button className="dashboard-status__button" onClick={() => void carregarDashboard()}>
              Tentar novamente
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  const dashboardData = data.dashboard

  return (
    <AppLayout>
      <div className="dashboard-page">
        <section className="dashboard-page__hero">
          <div>
            <h1 className="dashboard-page__hero-title">Dashboard</h1>
            <p className="dashboard-page__hero-description">
              Uma visao central da sua carteira, alertas e metas.
            </p>
          </div>
          <div className="dashboard-page__hero-pill">
            {ativos.length} ativos monitorados na carteira
          </div>
        </section>

        <section className="dashboard-page__stats">
          <StatCard
            label="Valor da carteira"
            value={formatarMoeda(dashboardData.valorTotalCarteira)}
            meta={formatarMoeda(lucroPrejuizo)}
            tone={getVariationTone(lucroPrejuizo)}
            icon={Wallet}
          />
          <StatCard
            label="Lucro / prejuizo"
            value={formatarMoeda(lucroPrejuizo)}
            meta={formatarPercentual(variacaoTotal)}
            tone={getVariationTone(lucroPrejuizo)}
            icon={lucroPrejuizo >= 0 ? TrendingUp : TrendingDown}
          />
          <StatCard
            label="Variacao total"
            value={formatarPercentual(variacaoTotal)}
            meta="Resultado consolidado da carteira"
            tone={getVariationTone(variacaoTotal)}
            icon={TrendingUp}
          />
          <StatCard
            label="Alertas ativos"
            value={String(dashboardData.alertasAtivos ?? 0)}
            meta={`${alertasRecentes.length} listados agora`}
            icon={CircleAlert}
          />
          <StatCard
            label="Notificacoes"
            value={String(dashboardData.notificacoesNaoLidas ?? 0)}
            meta="Nao lidas no momento"
            icon={Bell}
          />
        </section>

        <div className="dashboard-page__grid dashboard-page__grid--two-thirds">
          <section className="dashboard-section">
            <div className="dashboard-section__header">
              <div>
                <h2 className="dashboard-section__title">Evolucao da carteira</h2>
                <p className="dashboard-section__subtitle">
                  Evolucao diaria acumulada com base nas compras e nas variacoes atuais dos ativos.
                </p>
              </div>
              <div className="dashboard-section__badge">
                <Calendar size={14} />
                {evolucaoCarteira.length > 0
                  ? `${evolucaoCarteira.length} marcos`
                  : 'Sem historico'}
              </div>
            </div>

            <div className="dashboard-chart">
              {evolucaoCarteira.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={evolucaoCarteira} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dashboardChartValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="dashboardChartInvested" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" vertical={false} />
                    <XAxis
                      dataKey="data"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickFormatter={(value: number) =>
                        new Intl.NumberFormat('pt-BR', {
                          notation: 'compact',
                          maximumFractionDigits: 1,
                        }).format(value)
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(2, 6, 23, 0.95)',
                        border: '1px solid rgba(148, 163, 184, 0.18)',
                        borderRadius: '16px',
                      }}
                      labelStyle={{ color: '#cbd5e1' }}
                      formatter={(value, name) => [
                        formatarMoeda(typeof value === 'number' ? value : Number(value ?? 0)),
                        name === 'valorAtual' ? 'Valor atual' : 'Valor investido',
                      ]}
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.dataCompleta ?? ''
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="valorInvestido"
                      name="valorInvestido"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      fill="url(#dashboardChartInvested)"
                    />
                    <Area
                      type="monotone"
                      dataKey="valorAtual"
                      name="valorAtual"
                      stroke="#22c55e"
                      strokeWidth={3}
                      fill="url(#dashboardChartValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="dashboard-chart__empty">
                  Adicione ativos na carteira para visualizar a evolucao ao longo do tempo.
                </div>
              )}
            </div>

            <div className="dashboard-chart__legend">
              <div className="dashboard-chart__legend-item">
                <span
                  className="dashboard-chart__legend-color dashboard-chart__legend-color--current"
                />
                Valor atual acumulado
              </div>
              <div className="dashboard-chart__legend-item">
                <span
                  className="dashboard-chart__legend-color dashboard-chart__legend-color--invested"
                />
                Valor investido acumulado
              </div>
            </div>
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section__header">
              <div>
                <h2 className="dashboard-section__title">Ativos da carteira</h2>
                <p className="dashboard-section__subtitle">
                  Posicao atual, valor investido e desempenho por ativo.
                </p>
              </div>
              <div className="dashboard-section__badge">{ativos.length} itens</div>
            </div>

            {ativos.length > 0 ? (
              <div className="dashboard-list">
                {ativos.map((ativo) => (
                  <article key={ativo.id} className="dashboard-list__item">
                    <div className="dashboard-list__row">
                      <div>
                        <p className="dashboard-list__title">
                          {ativo.ticker} {ativo.nomeAtivo ? `• ${ativo.nomeAtivo}` : ''}
                        </p>
                        <p className="dashboard-list__description">
                          {ativo.quantidade} cotas • preco medio {formatarMoeda(ativo.precoMedio)}
                        </p>
                      </div>
                      <div
                        className={[
                          'dashboard-list__value',
                          getVariationTone(ativo.variacaoPercentual) === 'positive'
                            ? 'dashboard-list__value--positive'
                            : getVariationTone(ativo.variacaoPercentual) === 'negative'
                              ? 'dashboard-list__value--negative'
                              : '',
                        ].join(' ').trim()}
                      >
                        {formatarPercentual(ativo.variacaoPercentual)}
                      </div>
                    </div>

                    <div className="dashboard-list__row">
                      <p className="dashboard-list__description">
                        Valor atual {formatarMoeda(ativo.valorAtual)} • compra em{' '}
                        {formatarData(ativo.dataCompra)}
                      </p>
                      <div className="dashboard-list__value">
                        {formatarMoeda(ativo.lucroPrejuizo)}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty">
                Sua carteira ainda nao possui ativos. Assim que voce cadastrar os primeiros itens,
                eles vao aparecer aqui.
              </div>
            )}
          </section>
        </div>

        <div className="dashboard-page__grid dashboard-page__grid--two">
          <section className="dashboard-section">
            <div className="dashboard-section__header">
              <div>
                <h2 className="dashboard-section__title">Metas</h2>
                <p className="dashboard-section__subtitle">
                  Acompanhamento das metas cadastradas no sistema.
                </p>
              </div>
              <div className="dashboard-section__badge">{metas.length} metas</div>
            </div>

            {metas.length > 0 ? (
              <div className="dashboard-list">
                {metas.slice(0, 5).map((meta) => (
                  <article key={meta.id} className="dashboard-list__item">
                    <div className="dashboard-list__row">
                      <div>
                        <p className="dashboard-list__title">{meta.nome}</p>
                        <p className="dashboard-list__description">
                          Criada em {formatarData(meta.dataCriacao)}
                        </p>
                      </div>
                      <div className="dashboard-list__value">
                        {formatarPercentual(meta.percentualConcluido)}
                      </div>
                    </div>

                    <div className="dashboard-list__row">
                      <p className="dashboard-list__description">
                        Atual {formatarMoeda(meta.valorAtual)} de {formatarMoeda(meta.valorObjetivo)}
                      </p>
                      <div className="dashboard-list__value">
                        {meta.dataLimite ? formatarData(meta.dataLimite) : 'Sem prazo'}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty">
                Nenhuma meta cadastrada ainda. Quando voce criar metas, este bloco passa a mostrar
                o progresso.
              </div>
            )}
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section__header">
              <div>
                <h2 className="dashboard-section__title">Notificacoes recentes</h2>
                <p className="dashboard-section__subtitle">
                  Ultimos avisos enviados pelo sistema para sua conta.
                </p>
              </div>
              <div className="dashboard-section__badge">{notificacoes.length} no total</div>
            </div>

            {notificacoesRecentes.length > 0 ? (
              <div className="dashboard-list">
                {notificacoesRecentes.map((notificacao) => (
                  <article key={notificacao.id} className="dashboard-list__item">
                    <div className="dashboard-list__row">
                      <div>
                        <p className="dashboard-list__title">{notificacao.mensagem}</p>
                        <p className="dashboard-list__description">
                          Canal {notificacao.canal} • {formatarData(notificacao.dataEnvio)}
                        </p>
                      </div>
                      <div className="dashboard-list__value">
                        {notificacao.lida ? 'Lida' : 'Nao lida'}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty">
                Voce ainda nao possui notificacoes registradas.
              </div>
            )}
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section__header">
              <div>
                <h2 className="dashboard-section__title">Alertas configurados</h2>
                <p className="dashboard-section__subtitle">
                  Visao dos alertas mais recentes associados aos seus ativos.
                </p>
              </div>
              <div className="dashboard-section__badge">{alertas.length} alertas</div>
            </div>

            {alertasRecentes.length > 0 ? (
              <div className="dashboard-list">
                {alertasRecentes.map((alerta) => (
                  <article key={alerta.id} className="dashboard-list__item">
                    <div className="dashboard-list__row">
                      <div>
                        <p className="dashboard-list__title">{alerta.ticker}</p>
                        <p className="dashboard-list__description">
                          {alerta.tipo} • alvo {formatarMoeda(alerta.valorAlvo)}
                        </p>
                      </div>
                      <div className="dashboard-list__value">
                        {alerta.ativado ? 'Ativo' : 'Pausado'}
                      </div>
                    </div>

                    <div className="dashboard-list__row">
                      <p className="dashboard-list__description">
                        Criado em {formatarData(alerta.dataCriacao)}
                      </p>
                      <div className="dashboard-list__value">
                        Atual {formatarMoeda(alerta.precoAtual)}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty">
                Nenhum alerta configurado ainda. Eles vao aparecer aqui quando forem criados.
              </div>
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  )
}

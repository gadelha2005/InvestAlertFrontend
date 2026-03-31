import { useEffect, useState } from 'react'
import {
  Bell,
  CircleAlert,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
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

const getVariationTone = (value?: number | null) => {
  if (value === undefined || value === null || value === 0) {
    return 'neutral' as const
  }

  return value > 0 ? ('positive' as const) : ('negative' as const)
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardState>({
    dashboard: null,
    notificacoes: [],
    alertas: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const carregarDashboard = async () => {
    setIsLoading(true)
    setErrorMessage('')

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
    } catch (error) {
      const apiError = error as ErrorResponse
      setErrorMessage(
        apiError.mensagem ?? 'Nao foi possivel carregar os dados do dashboard.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void carregarDashboard()
  }, [])

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

  const { dashboard, notificacoes, alertas } = data
  const ativos = dashboard.ativos ?? []
  const metas = dashboard.metas ?? []
  const notificacoesRecentes = notificacoes.slice(0, 5)
  const alertasRecentes = alertas.slice(0, 5)
  const variacaoTotal = dashboard.variacaoPercentualTotal
  const lucroPrejuizo = dashboard.lucroPrejuizoTotal

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
            value={formatarMoeda(dashboard.valorTotalCarteira)}
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
            value={String(dashboard.alertasAtivos ?? 0)}
            meta={`${alertasRecentes.length} listados agora`}
            icon={CircleAlert}
          />
          <StatCard
            label="Notificacoes"
            value={String(dashboard.notificacoesNaoLidas ?? 0)}
            meta="Nao lidas no momento"
            icon={Bell}
          />
        </section>

        <div className="dashboard-page__grid dashboard-page__grid--two-thirds">
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
        </div>

        <div className="dashboard-page__grid dashboard-page__grid--two">
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

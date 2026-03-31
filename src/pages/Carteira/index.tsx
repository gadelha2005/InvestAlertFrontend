import { useEffect, useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { BriefcaseBusiness, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { carteiraApi } from '@/api/carteira'
import { formatarMoeda, formatarPercentual } from '@/api/format'
import StatCard from '@/components/dashboard/StatCard'
import AppLayout from '@/components/layout/AppLayout'
import Button from '@/components/ui/Button'
import type { CarteiraAtivoResponse, CarteiraResponse, ErrorResponse } from '@/types'
import './Carteira.css'

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6']

const getVariationTone = (value?: number | null) => {
  if (value === undefined || value === null || value === 0) {
    return 'neutral' as const
  }

  return value > 0 ? ('positive' as const) : ('negative' as const)
}

export default function Carteira() {
  const [carteiras, setCarteiras] = useState<CarteiraResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const carregarCarteiras = async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const response = await carteiraApi.listar()
      setCarteiras(response)
    } catch (error) {
      const apiError = error as ErrorResponse
      setErrorMessage(apiError.mensagem ?? 'Nao foi possivel carregar a carteira.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void carregarCarteiras()
  }, [])

  const todasCarteiras = useMemo(() => carteiras ?? [], [carteiras])
  const ativos = useMemo(
    () => todasCarteiras.flatMap((carteira) => carteira.ativos ?? []),
    [todasCarteiras]
  )

  const valorTotal = useMemo(
    () => todasCarteiras.reduce((acc, carteira) => acc + (carteira.valorTotal ?? 0), 0),
    [todasCarteiras]
  )

  const lucroPrejuizo = useMemo(
    () => todasCarteiras.reduce((acc, carteira) => acc + (carteira.lucroPrejuizo ?? 0), 0),
    [todasCarteiras]
  )

  const custoTotal = useMemo(
    () =>
      ativos.reduce((acc, ativo) => {
        return acc + (ativo.valorInvestido ?? 0)
      }, 0),
    [ativos]
  )

  const variacaoTotal = useMemo(() => {
    if (custoTotal === 0) {
      return null
    }

    return (lucroPrejuizo / custoTotal) * 100
  }, [custoTotal, lucroPrejuizo])

  const pieData = useMemo(
    () =>
      ativos
        .filter((ativo) => ativo.valorAtual !== undefined && ativo.valorAtual !== null)
        .map((ativo) => ({
          name: ativo.ticker,
          value: ativo.valorAtual ?? 0,
        })),
    [ativos]
  )

  const carteirasResumo = useMemo(
    () =>
      todasCarteiras.map((carteira) => ({
        id: carteira.id,
        nome: carteira.nome,
        valorTotal: carteira.valorTotal,
        lucroPrejuizo: carteira.lucroPrejuizo,
        quantidadeAtivos: carteira.ativos?.length ?? 0,
      })),
    [todasCarteiras]
  )

  if (isLoading) {
    return (
      <AppLayout>
        <div className="portfolio-status">
          <h1 className="portfolio-status__title">Carregando carteira</h1>
          <p className="portfolio-status__description">
            Estamos reunindo os dados das suas carteiras e dos ativos cadastrados.
          </p>
        </div>
      </AppLayout>
    )
  }

  if (errorMessage) {
    return (
      <AppLayout>
        <div className="portfolio-status">
          <h1 className="portfolio-status__title">Nao foi possivel abrir a carteira</h1>
          <p className="portfolio-status__description">{errorMessage}</p>
          <div className="portfolio-status__actions">
            <Button className="portfolio-status__button" onClick={() => void carregarCarteiras()}>
              Tentar novamente
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="portfolio-page">
        <section className="portfolio-page__hero">
          <div>
            <h1 className="portfolio-page__hero-title">Carteira</h1>
            <p className="portfolio-page__hero-description">
              Acompanhe o valor consolidado, a distribuicao entre ativos e o desempenho das
              posicoes cadastradas no sistema.
            </p>
          </div>
          <div className="portfolio-page__hero-pill">
            {todasCarteiras.length} carteiras • {ativos.length} ativos
          </div>
        </section>

        <section className="portfolio-page__stats">
          <StatCard
            label="Valor total"
            value={formatarMoeda(valorTotal)}
            meta={`${ativos.length} ativos na composicao`}
            icon={Wallet}
          />
          <StatCard
            label="Custo total"
            value={formatarMoeda(custoTotal)}
            meta={`${todasCarteiras.length} carteiras listadas`}
            icon={BriefcaseBusiness}
          />
          <StatCard
            label="Lucro / prejuizo"
            value={formatarMoeda(lucroPrejuizo)}
            meta={formatarPercentual(variacaoTotal ?? undefined)}
            tone={getVariationTone(lucroPrejuizo)}
            icon={lucroPrejuizo >= 0 ? TrendingUp : TrendingDown}
          />
        </section>

        {ativos.length === 0 ? (
          <div className="portfolio-empty">
            Nenhum ativo foi encontrado nas suas carteiras. Quando voce adicionar posicoes, esta
            tela vai mostrar a distribuicao e o desempenho completo.
          </div>
        ) : (
          <div className="portfolio-page__grid">
            <section className="portfolio-section">
              <div className="portfolio-section__header">
                <div>
                  <h2 className="portfolio-section__title">Distribuicao por ativo</h2>
                  <p className="portfolio-section__subtitle">
                    Participacao de cada ativo no valor atual da carteira consolidada.
                  </p>
                </div>
                <div className="portfolio-section__badge">{pieData.length} ativos</div>
              </div>

              <div className="portfolio-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={88}
                      innerRadius={56}
                      strokeWidth={0}
                    >
                      {pieData.map((item, index) => (
                        <Cell
                          key={`${item.name}-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        formatarMoeda(typeof value === 'number' ? value : undefined),
                        'Valor',
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="portfolio-chart__legend">
                {pieData.map((item, index) => (
                  <div key={item.name} className="portfolio-chart__legend-item">
                    <span
                      className="portfolio-chart__legend-color"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="portfolio-section">
              <div className="portfolio-section__header">
                <div>
                  <h2 className="portfolio-section__title">Posicoes</h2>
                  <p className="portfolio-section__subtitle">
                    Resumo dos ativos, quantidade, preco medio e resultado acumulado.
                  </p>
                </div>
                <div className="portfolio-section__badge">{ativos.length} linhas</div>
              </div>

              <div className="portfolio-table-wrapper">
                <table className="portfolio-table">
                  <thead>
                    <tr>
                      <th className="portfolio-table__left">Ativo</th>
                      <th className="portfolio-table__right">Qtd</th>
                      <th className="portfolio-table__right">PM</th>
                      <th className="portfolio-table__right">Atual</th>
                      <th className="portfolio-table__right">Investido</th>
                      <th className="portfolio-table__right">P/L</th>
                      <th className="portfolio-table__right">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ativos.map((ativo: CarteiraAtivoResponse) => {
                      const tone = getVariationTone(ativo.variacaoPercentual)

                      return (
                        <tr key={ativo.id}>
                          <td className="portfolio-table__left">
                            <p className="portfolio-table__symbol">{ativo.ticker}</p>
                            <p className="portfolio-table__name">
                              {ativo.nomeAtivo || 'Ativo cadastrado'}
                            </p>
                          </td>
                          <td className="portfolio-table__right">{ativo.quantidade}</td>
                          <td className="portfolio-table__right">
                            {formatarMoeda(ativo.precoMedio)}
                          </td>
                          <td className="portfolio-table__right">
                            {formatarMoeda(ativo.precoAtual)}
                          </td>
                          <td className="portfolio-table__right">
                            {formatarMoeda(ativo.valorInvestido)}
                          </td>
                          <td
                            className={[
                              'portfolio-table__right',
                              tone === 'positive'
                                ? 'portfolio-table__positive'
                                : tone === 'negative'
                                  ? 'portfolio-table__negative'
                                  : '',
                            ].join(' ').trim()}
                          >
                            {formatarMoeda(ativo.lucroPrejuizo)}
                          </td>
                          <td
                            className={[
                              'portfolio-table__right',
                              tone === 'positive'
                                ? 'portfolio-table__positive'
                                : tone === 'negative'
                                  ? 'portfolio-table__negative'
                                  : '',
                            ].join(' ').trim()}
                          >
                            {formatarPercentual(ativo.variacaoPercentual)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {carteirasResumo.length > 0 ? (
          <section className="portfolio-section" style={{ marginTop: '16px' }}>
            <div className="portfolio-section__header">
              <div>
                <h2 className="portfolio-section__title">Carteiras cadastradas</h2>
                <p className="portfolio-section__subtitle">
                  Visao consolidada das carteiras retornadas pelo backend.
                </p>
              </div>
              <div className="portfolio-section__badge">{carteirasResumo.length} carteiras</div>
            </div>

            <div className="portfolio-table-wrapper">
              <table className="portfolio-table">
                <thead>
                  <tr>
                    <th className="portfolio-table__left">Carteira</th>
                    <th className="portfolio-table__right">Ativos</th>
                    <th className="portfolio-table__right">Valor total</th>
                    <th className="portfolio-table__right">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {carteirasResumo.map((carteira) => {
                    const tone = getVariationTone(carteira.lucroPrejuizo)

                    return (
                      <tr key={carteira.id}>
                        <td className="portfolio-table__left">
                          <p className="portfolio-table__symbol">{carteira.nome}</p>
                        </td>
                        <td className="portfolio-table__right">{carteira.quantidadeAtivos}</td>
                        <td className="portfolio-table__right">
                          {formatarMoeda(carteira.valorTotal)}
                        </td>
                        <td
                          className={[
                            'portfolio-table__right',
                            tone === 'positive'
                              ? 'portfolio-table__positive'
                              : tone === 'negative'
                                ? 'portfolio-table__negative'
                                : '',
                          ].join(' ').trim()}
                        >
                          {formatarMoeda(carteira.lucroPrejuizo)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </AppLayout>
  )
}

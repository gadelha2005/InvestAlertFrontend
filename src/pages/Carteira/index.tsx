import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  BriefcaseBusiness,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { ativosApi } from "@/api/ativos";
import { carteiraApi } from "@/api/carteira";
import { formatarMoeda, formatarPercentual } from "@/api/format";
import { useLoadingWithDelay } from "@/hooks/useLoadingWithDelay";
import LoadingOverlay from "@/components/LoadingOverlay";
import StatCard from "@/components/dashboard/StatCard";
import AppLayout from "@/components/layout/AppLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import type {
  AtivoResponse,
  CarteiraAtivoRequest,
  CarteiraResponse,
  ErrorResponse,
} from "@/types";
import "./Carteira.css";

const CHART_COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#14b8a6",
];
type AddMode = "QUANTIDADE" | "VALOR" | "MANUAL";

const getVariationTone = (value?: number | null) => {
  if (value === undefined || value === null || value === 0)
    return "neutral" as const;
  return value > 0 ? ("positive" as const) : ("negative" as const);
};

const getAtivoResultado = (ativo: {
  lucroPrejuizo?: number;
  variacao?: number;
}) => ativo.variacao ?? ativo.lucroPrejuizo;

const getAtivoPercentual = (ativo: {
  variacaoPercentual?: number;
  percentualVariacao?: number;
}) => ativo.percentualVariacao ?? ativo.variacaoPercentual;

export default function Carteira() {
  const [carteiras, setCarteiras] = useState<CarteiraResponse[]>([]);
  const [ativosCatalogo, setAtivosCatalogo] = useState<AtivoResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [isCreateCarteiraOpen, setIsCreateCarteiraOpen] = useState(false);
  const [isAddAtivoOpen, setIsAddAtivoOpen] = useState(false);
  const [isSubmittingCarteira, setIsSubmittingCarteira] = useState(false);
  const [isSubmittingAtivo, setIsSubmittingAtivo] = useState(false);
  const [carteiraNome, setCarteiraNome] = useState("");
  const [addMode, setAddMode] = useState<AddMode>("QUANTIDADE");
  const loadingWithDelay = useLoadingWithDelay();
  const [novaPosicao, setNovaPosicao] = useState({
    carteiraId: "",
    ticker: "",
    quantidade: "",
    valor: "",
    precoMedio: "",
  });

  const carregarDados = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [carteirasResponse, ativosResponse] = await Promise.all([
        carteiraApi.listar(),
        ativosApi.listar(),
      ]);
      setCarteiras(carteirasResponse);
      setAtivosCatalogo(ativosResponse);
    } catch (error) {
      const apiError = error as ErrorResponse;
      setErrorMessage(
        apiError.mensagem ?? "Nao foi possivel carregar a carteira.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void carregarDados();
  }, []);

  const todasCarteiras = useMemo(() => carteiras ?? [], [carteiras]);

  const ativosComCarteira = useMemo(
    () =>
      todasCarteiras.flatMap((carteira) =>
        (carteira.ativos ?? []).map((ativo) => ({
          ...ativo,
          carteiraId: carteira.id,
          carteiraNome: carteira.nome,
        })),
      ),
    [todasCarteiras],
  );

  const ativosExistentesNaCarteiraSelecionada = useMemo(() => {
    if (novaPosicao.carteiraId === "") {
      return new Set<string>();
    }

    const carteiraSelecionada = todasCarteiras.find(
      (carteira) => carteira.id === Number(novaPosicao.carteiraId),
    );

    return new Set(
      (carteiraSelecionada?.ativos ?? []).map((ativo) => ativo.ticker),
    );
  }, [novaPosicao.carteiraId, todasCarteiras]);

  const valorTotal = useMemo(
    () =>
      todasCarteiras.reduce(
        (acc, carteira) => acc + (carteira.valorTotal ?? 0),
        0,
      ),
    [todasCarteiras],
  );

  const lucroPrejuizo = useMemo(
    () =>
      ativosComCarteira.reduce(
        (acc, ativo) => acc + (getAtivoResultado(ativo) ?? 0),
        0,
      ),
    [ativosComCarteira],
  );

  const custoTotal = useMemo(
    () =>
      ativosComCarteira.reduce(
        (acc, ativo) => acc + (ativo.valorInvestido ?? 0),
        0,
      ),
    [ativosComCarteira],
  );

  const variacaoTotal = useMemo(() => {
    if (custoTotal === 0) return null;
    return (lucroPrejuizo / custoTotal) * 100;
  }, [custoTotal, lucroPrejuizo]);

  const pieData = useMemo(
    () => {
      const agrupadoPorTicker = ativosComCarteira
        .filter(
          (ativo) =>
            ativo.valorAtual !== undefined && ativo.valorAtual !== null,
        )
        .reduce<Record<string, number>>((acc, ativo) => {
          const valorAtual = ativo.valorAtual ?? 0;
          acc[ativo.ticker] = (acc[ativo.ticker] ?? 0) + valorAtual;
          return acc;
        }, {});

      return Object.entries(agrupadoPorTicker)
        .map(([ticker, value]) => ({
          id: ticker,
          name: ticker,
          value,
        }))
        .sort((a, b) => b.value - a.value);
    },
    [ativosComCarteira],
  );

  const carteirasResumo = useMemo(
    () =>
      todasCarteiras.map((carteira) => ({
        id: carteira.id,
        nome: carteira.nome,
        valorTotal: carteira.valorTotal,
        lucroPrejuizo: carteira.lucroPrejuizo,
        quantidadeAtivos: carteira.ativos?.length ?? 0,
      })),
    [todasCarteiras],
  );

  const resetFeedback = () => {
    setSubmitError("");
    setSubmitSuccess("");
  };

  const closeCreateCarteiraModal = () => {
    setIsCreateCarteiraOpen(false);
    setCarteiraNome("");
    resetFeedback();
  };

  const closeAddAtivoModal = () => {
    setIsAddAtivoOpen(false);
    setAddMode("QUANTIDADE");
    setNovaPosicao({
      carteiraId: "",
      ticker: "",
      quantidade: "",
      valor: "",
      precoMedio: "",
    });
    resetFeedback();
  };

  const handleCriarCarteira = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    resetFeedback();

    if (carteiraNome.trim() === "") {
      setSubmitError("Informe o nome da carteira para continuar.");
      return;
    }

    setIsSubmittingCarteira(true);
    setIsOperationLoading(true);

    try {
      await loadingWithDelay(() =>
        carteiraApi.criar({ nome: carteiraNome.trim() }),
      );
      setSubmitSuccess("Carteira criada com sucesso.");
      await carregarDados();
      window.setTimeout(() => closeCreateCarteiraModal(), 900);
    } catch (error) {
      const apiError = error as ErrorResponse;
      setSubmitError(apiError.mensagem ?? "Nao foi possivel criar a carteira.");
    } finally {
      setIsSubmittingCarteira(false);
      setIsOperationLoading(false);
    }
  };

  const handleAdicionarAtivo = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    resetFeedback();

    if (novaPosicao.carteiraId === "" || novaPosicao.ticker.trim() === "") {
      setSubmitError("Preencha carteira e ativo para continuar.");
      return;
    }

    if (ativosExistentesNaCarteiraSelecionada.has(novaPosicao.ticker.trim())) {
      setSubmitError(
        `O ativo ${novaPosicao.ticker.trim()} ja existe na carteira selecionada.`,
      );
      return;
    }

    const quantidade = Number(novaPosicao.quantidade);
    const valor = Number(novaPosicao.valor);
    const precoMedio = Number(novaPosicao.precoMedio);
    const payload: CarteiraAtivoRequest = {
      ticker: novaPosicao.ticker,
    };

    if (addMode === "QUANTIDADE") {
      if (
        novaPosicao.quantidade.trim() === "" ||
        Number.isNaN(quantidade) ||
        quantidade <= 0
      ) {
        setSubmitError("A quantidade precisa ser maior que zero.");
        return;
      }
      payload.quantidade = quantidade;
    }

    if (addMode === "VALOR") {
      if (
        novaPosicao.valor.trim() === "" ||
        Number.isNaN(valor) ||
        valor <= 0
      ) {
        setSubmitError("O valor investido precisa ser maior que zero.");
        return;
      }
      payload.valor = valor;
    }

    if (addMode === "MANUAL") {
      if (
        novaPosicao.quantidade.trim() === "" ||
        Number.isNaN(quantidade) ||
        quantidade <= 0
      ) {
        setSubmitError("A quantidade precisa ser maior que zero.");
        return;
      }
      if (
        novaPosicao.precoMedio.trim() === "" ||
        Number.isNaN(precoMedio) ||
        precoMedio <= 0
      ) {
        setSubmitError("O preco medio precisa ser maior que zero.");
        return;
      }
      payload.quantidade = quantidade;
      payload.precoMedio = precoMedio;
    }

    setIsSubmittingAtivo(true);
    setIsOperationLoading(true);

    try {
      await loadingWithDelay(() =>
        carteiraApi.adicionarAtivo(Number(novaPosicao.carteiraId), payload),
      );
      setSubmitSuccess("Ativo adicionado a carteira com sucesso.");
      await carregarDados();
      window.setTimeout(() => closeAddAtivoModal(), 900);
    } catch (error) {
      const apiError = error as ErrorResponse;
      setSubmitError(
        apiError.mensagem ?? "Nao foi possivel adicionar o ativo.",
      );
    } finally {
      setIsSubmittingAtivo(false);
      setIsOperationLoading(false);
    }
  };

  const handleRemoverAtivo = async (
    carteiraId: number,
    carteiraAtivoId: number,
  ) => {
    resetFeedback();
    setIsOperationLoading(true);

    try {
      await loadingWithDelay(() =>
        carteiraApi.removerAtivo(carteiraId, carteiraAtivoId),
      );
      setSubmitSuccess("Ativo removido da carteira.");
      await carregarDados();
    } catch (error) {
      const apiError = error as ErrorResponse;
      setSubmitError(
        apiError.mensagem ?? "Nao foi possivel remover o ativo da carteira.",
      );
    } finally {
      setIsOperationLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="portfolio-status">
          <h1 className="portfolio-status__title">Carregando carteira</h1>
          <p className="portfolio-status__description">
            Estamos reunindo os dados das suas carteiras e dos ativos
            cadastrados.
          </p>
        </div>
      </AppLayout>
    );
  }

  if (errorMessage) {
    return (
      <AppLayout>
        <div className="portfolio-status">
          <h1 className="portfolio-status__title">
            Nao foi possivel abrir a carteira
          </h1>
          <p className="portfolio-status__description">{errorMessage}</p>
          <div className="portfolio-status__actions">
            <Button
              className="portfolio-status__button"
              onClick={() => void carregarDados()}
            >
              Tentar novamente
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <LoadingOverlay
        isVisible={isOperationLoading}
        message="Processando operação..."
      />
      <div className="portfolio-page">
        <section className="portfolio-page__hero">
          <div>
            <h1 className="portfolio-page__hero-title">Carteira</h1>
            <p className="portfolio-page__hero-description">
              Acompanhe o valor consolidado, a distribuicao entre ativos e o
              desempenho das posicoes cadastradas no sistema.
            </p>
          </div>
          <div className="portfolio-page__hero-actions">
            <div className="portfolio-page__hero-pill">
              {todasCarteiras.length} carteiras • {ativosComCarteira.length}{" "}
              ativos
            </div>
            <Button
              className="portfolio-page__hero-button"
              onClick={() => setIsCreateCarteiraOpen(true)}
            >
              <Plus size={16} />
              Nova carteira
            </Button>
            <Button
              className="portfolio-page__hero-button"
              onClick={() => setIsAddAtivoOpen(true)}
            >
              <Plus size={16} />
              Adicionar ativo
            </Button>
          </div>
        </section>

        {submitError ? (
          <div className="portfolio-feedback portfolio-feedback--error">
            {submitError}
          </div>
        ) : null}
        {submitSuccess ? (
          <div className="portfolio-feedback portfolio-feedback--success">
            {submitSuccess}
          </div>
        ) : null}

        <section className="portfolio-page__stats">
          <StatCard
            label="Valor total"
            value={formatarMoeda(valorTotal)}
            meta={`${ativosComCarteira.length} ativos na composicao`}
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

        {ativosComCarteira.length === 0 ? (
          <div className="portfolio-empty">
            Nenhum ativo foi encontrado nas suas carteiras. Crie uma carteira e
            adicione uma posicao para comecar a calcular resultados por usuario.
          </div>
        ) : (
          <div className="portfolio-page__grid">
            <section className="portfolio-section">
              <div className="portfolio-section__header">
                <div>
                  <h2 className="portfolio-section__title">
                    Distribuicao por ativo
                  </h2>
                  <p className="portfolio-section__subtitle">
                    Participacao de cada ativo no valor atual da carteira
                    consolidada.
                  </p>
                </div>
                <div className="portfolio-section__badge">
                  {pieData.length} ativos
                </div>
              </div>

              <div className="portfolio-chart">
                {pieData.length > 0 ? (
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
                            key={`${item.id}-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          formatarMoeda(
                            typeof value === "number" ? value : undefined,
                          ),
                          "Valor",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="portfolio-chart__empty">
                    Nenhum valor atual disponivel para montar o grafico.
                  </div>
                )}
              </div>

              <div className="portfolio-chart__legend">
                {pieData.map((item, index) => (
                  <div key={item.id} className="portfolio-chart__legend-item">
                    <span
                      className="portfolio-chart__legend-color"
                      style={{
                        backgroundColor:
                          CHART_COLORS[index % CHART_COLORS.length],
                      }}
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
                    Resumo dos ativos, quantidade, preco medio e resultado
                    acumulado.
                  </p>
                </div>
                <div className="portfolio-section__badge">
                  {ativosComCarteira.length} linhas
                </div>
              </div>

              <div className="portfolio-table-wrapper">
                <table className="portfolio-table">
                  <thead>
                    <tr>
                      <th className="portfolio-table__left">Carteira</th>
                      <th className="portfolio-table__left">Ativo</th>
                      <th className="portfolio-table__right">Qtd</th>
                      <th className="portfolio-table__right">PM</th>
                      <th className="portfolio-table__right">Atual</th>
                      <th className="portfolio-table__right">Investido</th>
                      <th className="portfolio-table__right">P/L</th>
                      <th className="portfolio-table__right">%</th>
                      <th className="portfolio-table__right">Acao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ativosComCarteira.map((ativo) => {
                      const percentual = getAtivoPercentual(ativo);
                      const resultado = getAtivoResultado(ativo);
                      const tone = getVariationTone(percentual);

                      return (
                        <tr key={ativo.id}>
                          <td className="portfolio-table__left">
                            <p className="portfolio-table__symbol">
                              {ativo.carteiraNome}
                            </p>
                          </td>
                          <td className="portfolio-table__left">
                            <p className="portfolio-table__symbol">
                              {ativo.ticker}
                            </p>
                            <p className="portfolio-table__name">
                              {ativo.nomeAtivo || "Ativo cadastrado"}
                            </p>
                          </td>
                          <td className="portfolio-table__right">
                            {ativo.quantidade}
                          </td>
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
                              "portfolio-table__right",
                              tone === "positive"
                                ? "portfolio-table__positive"
                                : tone === "negative"
                                  ? "portfolio-table__negative"
                                  : "",
                            ]
                              .join(" ")
                              .trim()}
                          >
                            {formatarMoeda(resultado)}
                          </td>
                          <td
                            className={[
                              "portfolio-table__right",
                              tone === "positive"
                                ? "portfolio-table__positive"
                                : tone === "negative"
                                  ? "portfolio-table__negative"
                                  : "",
                            ]
                              .join(" ")
                              .trim()}
                          >
                            {formatarPercentual(percentual)}
                          </td>
                          <td className="portfolio-table__right">
                            <button
                              type="button"
                              className="portfolio-action"
                              onClick={() =>
                                void handleRemoverAtivo(
                                  ativo.carteiraId,
                                  ativo.id,
                                )
                              }
                            >
                              <Trash2 size={14} />
                              Remover
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {carteirasResumo.length > 0 ? (
          <section className="portfolio-section" style={{ marginTop: "16px" }}>
            <div className="portfolio-section__header">
              <div>
                <h2 className="portfolio-section__title">
                  Carteiras cadastradas
                </h2>
                <p className="portfolio-section__subtitle">
                  Visao consolidada das carteiras retornadas pelo backend.
                </p>
              </div>
              <div className="portfolio-section__badge">
                {carteirasResumo.length} carteiras
              </div>
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
                    const tone = getVariationTone(carteira.lucroPrejuizo);

                    return (
                      <tr key={carteira.id}>
                        <td className="portfolio-table__left">
                          <p className="portfolio-table__symbol">
                            {carteira.nome}
                          </p>
                        </td>
                        <td className="portfolio-table__right">
                          {carteira.quantidadeAtivos}
                        </td>
                        <td className="portfolio-table__right">
                          {formatarMoeda(carteira.valorTotal)}
                        </td>
                        <td
                          className={[
                            "portfolio-table__right",
                            tone === "positive"
                              ? "portfolio-table__positive"
                              : tone === "negative"
                                ? "portfolio-table__negative"
                                : "",
                          ]
                            .join(" ")
                            .trim()}
                        >
                          {formatarMoeda(carteira.lucroPrejuizo)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {isCreateCarteiraOpen ? (
          <div className="portfolio-modal" role="dialog" aria-modal="true">
            <div className="portfolio-modal__panel">
              <div className="portfolio-modal__header">
                <div>
                  <h2 className="portfolio-modal__title">Nova carteira</h2>
                  <p className="portfolio-modal__description">
                    Crie uma carteira para organizar os ativos do usuario
                    logado.
                  </p>
                </div>
                <button
                  type="button"
                  className="portfolio-modal__close"
                  onClick={closeCreateCarteiraModal}
                  aria-label="Fechar modal"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                className="portfolio-modal__form"
                onSubmit={handleCriarCarteira}
              >
                <div className="portfolio-modal__field">
                  <Label htmlFor="carteiraNome">Nome da carteira</Label>
                  <Input
                    id="carteiraNome"
                    type="text"
                    placeholder="Ex.: Longo prazo"
                    value={carteiraNome}
                    onChange={(event) => setCarteiraNome(event.target.value)}
                  />
                </div>

                <div className="portfolio-modal__actions">
                  <Button
                    type="button"
                    className="portfolio-modal__secondary"
                    onClick={closeCreateCarteiraModal}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmittingCarteira}>
                    {isSubmittingCarteira ? "Salvando..." : "Criar carteira"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {isAddAtivoOpen ? (
          <div className="portfolio-modal" role="dialog" aria-modal="true">
            <div className="portfolio-modal__panel">
              <div className="portfolio-modal__header">
                <div>
                  <h2 className="portfolio-modal__title">Adicionar ativo</h2>
                  <p className="portfolio-modal__description">
                    Informe por quantidade, por valor investido ou use o fluxo
                    manual.
                  </p>
                </div>
                <button
                  type="button"
                  className="portfolio-modal__close"
                  onClick={closeAddAtivoModal}
                  aria-label="Fechar modal"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                className="portfolio-modal__form"
                onSubmit={handleAdicionarAtivo}
              >
                <div className="portfolio-modal__modes">
                  <button
                    type="button"
                    className={[
                      "portfolio-modal__mode",
                      addMode === "QUANTIDADE"
                        ? "portfolio-modal__mode--active"
                        : "",
                    ]
                      .join(" ")
                      .trim()}
                    onClick={() => setAddMode("QUANTIDADE")}
                  >
                    Por quantidade
                  </button>
                  <button
                    type="button"
                    className={[
                      "portfolio-modal__mode",
                      addMode === "VALOR"
                        ? "portfolio-modal__mode--active"
                        : "",
                    ]
                      .join(" ")
                      .trim()}
                    onClick={() => setAddMode("VALOR")}
                  >
                    Por valor
                  </button>
                  <button
                    type="button"
                    className={[
                      "portfolio-modal__mode",
                      addMode === "MANUAL"
                        ? "portfolio-modal__mode--active"
                        : "",
                    ]
                      .join(" ")
                      .trim()}
                    onClick={() => setAddMode("MANUAL")}
                  >
                    Manual
                  </button>
                </div>

                <div className="portfolio-modal__grid">
                  <div className="portfolio-modal__field">
                    <Label htmlFor="carteiraId">Carteira</Label>
                    <select
                      id="carteiraId"
                      className="portfolio-modal__select"
                      value={novaPosicao.carteiraId}
                      onChange={(event) =>
                        setNovaPosicao((current) => ({
                          ...current,
                          carteiraId: event.target.value,
                        }))
                      }
                    >
                      <option value="">Selecione</option>
                      {todasCarteiras.map((carteira) => (
                        <option key={carteira.id} value={carteira.id}>
                          {carteira.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="portfolio-modal__field">
                    <Label htmlFor="ticker">Ativo</Label>
                    <select
                      id="ticker"
                      className="portfolio-modal__select"
                      value={novaPosicao.ticker}
                      onChange={(event) =>
                        setNovaPosicao((current) => ({
                          ...current,
                          ticker: event.target.value,
                        }))
                      }
                    >
                      <option value="">Selecione</option>
                      {ativosCatalogo.map((ativo) => (
                        <option
                          key={ativo.id}
                          value={ativo.ticker}
                          disabled={ativosExistentesNaCarteiraSelecionada.has(
                            ativo.ticker,
                          )}
                        >
                          {ativo.ticker} {ativo.nome ? `- ${ativo.nome}` : ""}
                          {ativosExistentesNaCarteiraSelecionada.has(ativo.ticker)
                            ? " (ja adicionado)"
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="portfolio-modal__grid">
                  {addMode !== "VALOR" ? (
                    <div className="portfolio-modal__field">
                      <Label htmlFor="quantidade">Quantidade</Label>
                      <Input
                        id="quantidade"
                        type="number"
                        step="0.00000001"
                        min="0.00000001"
                        placeholder="0"
                        value={novaPosicao.quantidade}
                        onChange={(event) =>
                          setNovaPosicao((current) => ({
                            ...current,
                            quantidade: event.target.value,
                          }))
                        }
                      />
                    </div>
                  ) : null}

                  {addMode === "VALOR" ? (
                    <div className="portfolio-modal__field">
                      <Label htmlFor="valor">Valor investido</Label>
                      <Input
                        id="valor"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0,00"
                        value={novaPosicao.valor}
                        onChange={(event) =>
                          setNovaPosicao((current) => ({
                            ...current,
                            valor: event.target.value,
                          }))
                        }
                      />
                    </div>
                  ) : null}

                  {addMode === "MANUAL" ? (
                    <div className="portfolio-modal__field">
                      <Label htmlFor="precoMedio">Preco medio</Label>
                      <Input
                        id="precoMedio"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0,00"
                        value={novaPosicao.precoMedio}
                        onChange={(event) =>
                          setNovaPosicao((current) => ({
                            ...current,
                            precoMedio: event.target.value,
                          }))
                        }
                      />
                    </div>
                  ) : null}
                </div>

                <div className="portfolio-modal__actions">
                  <Button
                    type="button"
                    className="portfolio-modal__secondary"
                    onClick={closeAddAtivoModal}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isSubmittingAtivo ||
                      todasCarteiras.length === 0 ||
                      ativosCatalogo.length === 0
                    }
                  >
                    {isSubmittingAtivo ? "Salvando..." : "Adicionar a carteira"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}

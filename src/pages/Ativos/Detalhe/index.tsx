import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, TrendingDown, TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ativosApi } from "@/api/ativos";
import { formatarMoeda } from "@/api/format";
import AppLayout from "@/components/layout/AppLayout";
import type { TipoAtivo } from "@/types";
import "./AtivoDetalhe.css";

type Periodo = "7d" | "1m" | "3m" | "6m" | "1a" | "5a";

const PERIODOS: { label: string; value: Periodo }[] = [
  { label: "7D", value: "7d" },
  { label: "1M", value: "1m" },
  { label: "3M", value: "3m" },
  { label: "6M", value: "6m" },
  { label: "1A", value: "1a" },
  { label: "5A", value: "5a" },
];

const TYPE_LABELS: Record<TipoAtivo, string> = {
  ACAO: "Acao",
  ETF: "ETF",
  FII: "FII",
  CRIPTOMOEDA: "Criptomoeda",
  INDICE: "Indice",
};

function formatarData(dataStr: string) {
  const parts = dataStr.split("T")[0].split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dataStr;
}

function formatarVariacao(v: number | undefined) {
  if (v === undefined || v === null) return "—";
  const sinal = v >= 0 ? "+" : "";
  return `${sinal}${v.toFixed(2)}%`;
}

export default function AtivoDetalhe() {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState<Periodo>("1m");

  const [ativo, setAtivo] = useState<Awaited<ReturnType<typeof ativosApi.buscarPorTicker>> | null>(null);
  const [historico, setHistorico] = useState<Awaited<ReturnType<typeof ativosApi.buscarHistorico>> | null>(null);
  const [isLoadingAtivo, setIsLoadingAtivo] = useState(true);
  const [isLoadingHistorico, setIsLoadingHistorico] = useState(true);
  const [errorAtivo, setErrorAtivo] = useState("");
  const [errorHistorico, setErrorHistorico] = useState("");

  const upperTicker = ticker?.toUpperCase() ?? "";

  // Fetch ativo info once
  const carregarAtivo = async () => {
    if (!ticker) return;
    setIsLoadingAtivo(true);
    setErrorAtivo("");
    try {
      const data = await ativosApi.buscarPorTicker(ticker);
      setAtivo(data);
    } catch {
      setErrorAtivo("Nao foi possivel carregar o ativo.");
    } finally {
      setIsLoadingAtivo(false);
    }
  };

  // Fetch historico on period change
  const carregarHistorico = async (p: Periodo) => {
    if (!ticker) return;
    setIsLoadingHistorico(true);
    setErrorHistorico("");
    try {
      const data = await ativosApi.buscarHistorico(ticker, p);
      setHistorico(data);
    } catch {
      setErrorHistorico("Nao foi possivel carregar o historico.");
    } finally {
      setIsLoadingHistorico(false);
    }
  };

  useEffect(() => {
    void carregarAtivo();
    void carregarHistorico(periodo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  const handlePeriodo = (p: Periodo) => {
    setPeriodo(p);
    void carregarHistorico(p);
  };

  const dadosGrafico = (historico?.dados ?? []).map((ponto) => ({
    data: formatarData(ponto.dataHora),
    preco: ponto.preco,
  }));

  const precoAtual = ativo?.precoAtual;
  const variacao = ativo?.variacaoPercentual;
  const isPositive = (variacao ?? 0) >= 0;

  if (isLoadingAtivo) {
    return (
      <AppLayout>
        <div className="ativo-detalhe-status">
          <p>Carregando ativo...</p>
        </div>
      </AppLayout>
    );
  }

  if (errorAtivo || !ativo) {
    return (
      <AppLayout>
        <div className="ativo-detalhe-status">
          <p>{errorAtivo || "Ativo nao encontrado."}</p>
          <button
            type="button"
            className="ativo-detalhe__back-btn"
            onClick={() => navigate("/ativos")}
          >
            <ArrowLeft size={16} />
            Voltar para Ativos
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="ativo-detalhe">
        <button
          type="button"
          className="ativo-detalhe__back-btn"
          onClick={() => navigate("/ativos")}
        >
          <ArrowLeft size={16} />
          Voltar para Ativos
        </button>

        <section className="ativo-detalhe__hero">
          <div className="ativo-detalhe__identity">
            <div className="ativo-detalhe__ticker-box">
              {upperTicker.slice(0, 2)}
            </div>
            <div>
              <h1 className="ativo-detalhe__ticker">{upperTicker}</h1>
              <p className="ativo-detalhe__nome">
                {ativo.nome ?? "Nome nao disponivel"}
              </p>
            </div>
          </div>

          <div className="ativo-detalhe__price-block">
            <p className="ativo-detalhe__price">
              {precoAtual !== undefined ? formatarMoeda(precoAtual) : "—"}
            </p>
            {variacao !== undefined && (
              <span
                className={`ativo-detalhe__variacao ${isPositive ? "ativo-detalhe__variacao--pos" : "ativo-detalhe__variacao--neg"}`}
              >
                {isPositive ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}
                {formatarVariacao(variacao)}
              </span>
            )}
          </div>

          <div className="ativo-detalhe__badges">
            <span className="ativo-detalhe__badge ativo-detalhe__badge--accent">
              {TYPE_LABELS[ativo.tipo]}
            </span>
            {ativo.mercado && (
              <span className="ativo-detalhe__badge">{ativo.mercado}</span>
            )}
          </div>
        </section>

        <section className="ativo-detalhe__chart-section">
          <div className="ativo-detalhe__period-row">
            <span className="ativo-detalhe__chart-label">Historico de precos</span>
            <div className="ativo-detalhe__periods">
              {PERIODOS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={[
                    "ativo-detalhe__period-btn",
                    periodo === p.value ? "ativo-detalhe__period-btn--active" : "",
                  ]
                    .join(" ")
                    .trim()}
                  onClick={() => handlePeriodo(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {isLoadingHistorico ? (
            <div className="ativo-detalhe__chart-loading">Carregando grafico...</div>
          ) : errorHistorico ? (
            <div className="ativo-detalhe__chart-loading">{errorHistorico}</div>
          ) : dadosGrafico.length === 0 ? (
            <div className="ativo-detalhe__chart-loading">
              Nenhum dado disponivel para o periodo selecionado.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dadosGrafico} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="data"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v.toFixed(2))
                  }
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    color: "#f8fafc",
                    fontSize: 13,
                  }}
                  formatter={(value: number) => [formatarMoeda(value), "Preco"]}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Line
                  type="monotone"
                  dataKey="preco"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#22d3ee" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </section>

        {!isLoadingHistorico && (historico?.ultimos7Dias?.length ?? 0) > 0 && (
          <section className="ativo-detalhe__table-section">
            <h2 className="ativo-detalhe__table-title">Ultimos 7 dias</h2>
            <div className="ativo-detalhe__table-wrapper">
              <table className="ativo-detalhe__table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Preco</th>
                    <th>Variacao</th>
                    <th>Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {historico?.ultimos7Dias.map((dia) => {
                    const pos = (dia.variacaoPercentual ?? 0) >= 0;
                    return (
                      <tr key={dia.data}>
                        <td>{formatarData(dia.data)}</td>
                        <td>{formatarMoeda(dia.preco)}</td>
                        <td
                          className={
                            pos
                              ? "ativo-detalhe__td--pos"
                              : "ativo-detalhe__td--neg"
                          }
                        >
                          {formatarVariacao(dia.variacaoPercentual)}
                        </td>
                        <td>
                          {dia.volume !== undefined && dia.volume !== null
                            ? dia.volume.toLocaleString("pt-BR")
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  BarChart3,
  Filter,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { formatarMoeda, formatarPercentual } from "@/api/format";
import { scannerApi } from "@/api/scanner";
import StatCard from "@/components/dashboard/StatCard";
import AppLayout from "@/components/layout/AppLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { AtivoResponse, ErrorResponse } from "@/types";
import "./Scanner.css";

type ScannerFiltro = "gainers" | "losers" | "volume";

const formatarVolume = (volume?: number) => {
  if (volume === undefined || volume === null) {
    return "—";
  }

  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(volume);
};

const normalizarNumero = (valor?: number | null) => valor ?? 0;

const getVariationValue = (ativo: AtivoResponse) =>
  normalizarNumero(ativo.variacaoPercentual);

const getVariationTone = (value?: number | null) => {
  if (value === undefined || value === null || value === 0) {
    return "neutral" as const;
  }

  return value > 0 ? ("positive" as const) : ("negative" as const);
};

const getCardTone = (variacaoPercentual?: number | null) =>
  getVariationTone(variacaoPercentual) === "negative"
    ? "scanner-card__trend scanner-card__trend--negative"
    : "scanner-card__trend scanner-card__trend--positive";

export default function Scanner() {
  const [ativos, setAtivos] = useState<AtivoResponse[]>([]);
  const [filtroAtivo, setFiltroAtivo] = useState<ScannerFiltro>("gainers");
  const [busca, setBusca] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const carregarScanner = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await scannerApi.listar();
      setAtivos(response);
    } catch (error) {
      const apiError = error as ErrorResponse;
      setErrorMessage(
        apiError.mensagem ?? "Nao foi possivel carregar o scanner de oportunidades.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void carregarScanner();
  }, []);

  const ativosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    const baseFiltrada = ativos.filter((ativo) => {
      const correspondeBusca =
        termo === "" ||
        ativo.ticker.toLowerCase().includes(termo) ||
        (ativo.nome ?? "").toLowerCase().includes(termo) ||
        (ativo.mercado ?? "").toLowerCase().includes(termo);

      if (!correspondeBusca) {
        return false;
      }

      if (filtroAtivo === "gainers") {
        return getVariationValue(ativo) > 0;
      }

      if (filtroAtivo === "losers") {
        return getVariationValue(ativo) < 0;
      }

      return true;
    });

    return [...baseFiltrada].sort((a, b) => {
      if (filtroAtivo === "gainers") {
        return getVariationValue(b) - getVariationValue(a);
      }

      if (filtroAtivo === "losers") {
        return getVariationValue(a) - getVariationValue(b);
      }

      return normalizarNumero(b.volume) - normalizarNumero(a.volume);
    });
  }, [ativos, busca, filtroAtivo]);

  const melhorAtivo = useMemo(
    () =>
      [...ativos]
        .filter((ativo) => getVariationValue(ativo) > 0)
        .sort((a, b) => getVariationValue(b) - getVariationValue(a))[0] ?? null,
    [ativos],
  );

  const piorAtivo = useMemo(
    () =>
      [...ativos]
        .filter((ativo) => getVariationValue(ativo) < 0)
        .sort((a, b) => getVariationValue(a) - getVariationValue(b))[0] ?? null,
    [ativos],
  );

  const maiorVolume = useMemo(
    () =>
      [...ativos].sort((a, b) => normalizarNumero(b.volume) - normalizarNumero(a.volume))[0] ??
      null,
    [ativos],
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="scanner-status">
          <h1 className="scanner-status__title">Carregando scanner</h1>
          <p>Buscando os ativos e organizando as oportunidades do dia.</p>
        </div>
      </AppLayout>
    );
  }

  if (errorMessage) {
    return (
      <AppLayout>
        <div className="scanner-status">
          <h1 className="scanner-status__title">Nao foi possivel abrir o scanner</h1>
          <p>{errorMessage}</p>
          <div className="scanner-status__actions">
            <Button className="scanner-status__button" onClick={() => void carregarScanner()}>
              Tentar novamente
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="scanner-page">
        <section className="scanner-page__hero">
          <div>
            <h1 className="scanner-page__hero-title">Scanner de Oportunidades</h1>
            <p className="scanner-page__hero-description">
              Acompanhe maiores altas, maiores baixas e volume com base nos dados
              retornados pelo backend.
            </p>
          </div>

          <div className="scanner-page__hero-pill">{ativos.length} ativos no radar</div>
        </section>

        <section className="scanner-page__stats">
          <StatCard
            label="Maior alta"
            value={melhorAtivo ? melhorAtivo.ticker : "—"}
            meta={melhorAtivo ? formatarPercentual(getVariationValue(melhorAtivo)) : "Sem altas"}
            tone="positive"
            icon={TrendingUp}
          />
          <StatCard
            label="Maior baixa"
            value={piorAtivo ? piorAtivo.ticker : "—"}
            meta={piorAtivo ? formatarPercentual(getVariationValue(piorAtivo)) : "Sem baixas"}
            tone="negative"
            icon={TrendingDown}
          />
          <StatCard
            label="Maior volume"
            value={maiorVolume ? maiorVolume.ticker : "—"}
            meta={maiorVolume ? formatarVolume(maiorVolume.volume) : "Sem volume"}
            icon={BarChart3}
          />
        </section>

        <section className="scanner-page__filters">
          <div className="scanner-page__search">
            <Input
              type="text"
              placeholder="Buscar por ticker, nome ou mercado..."
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
            />
          </div>

          <div className="scanner-page__chips">
            <button
              type="button"
              className={[
                "scanner-page__chip",
                filtroAtivo === "gainers" ? "scanner-page__chip--positive" : "",
              ]
                .join(" ")
                .trim()}
              onClick={() => setFiltroAtivo("gainers")}
            >
              <TrendingUp size={16} />
              Maiores altas
            </button>
            <button
              type="button"
              className={[
                "scanner-page__chip",
                filtroAtivo === "losers" ? "scanner-page__chip--negative" : "",
              ]
                .join(" ")
                .trim()}
              onClick={() => setFiltroAtivo("losers")}
            >
              <TrendingDown size={16} />
              Maiores baixas
            </button>
            <button
              type="button"
              className={[
                "scanner-page__chip",
                filtroAtivo === "volume" ? "scanner-page__chip--volume" : "",
              ]
                .join(" ")
                .trim()}
              onClick={() => setFiltroAtivo("volume")}
            >
              <Filter size={16} />
              Volume
            </button>
          </div>
        </section>

        {ativosFiltrados.length > 0 ? (
          <section className="scanner-page__grid">
            {ativosFiltrados.map((ativo) => {
              const variacaoPercentual = getVariationValue(ativo);
              const positiveTone = getVariationTone(variacaoPercentual) !== "negative";

              return (
                <article key={ativo.id} className="scanner-card">
                  <div className="scanner-card__header">
                    <div>
                      <p className="scanner-card__ticker">{ativo.ticker}</p>
                      <p className="scanner-card__name">
                        {ativo.nome || "Ativo sem nome informado"}
                      </p>
                    </div>

                    <div className={getCardTone(variacaoPercentual)}>
                      {positiveTone ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    </div>
                  </div>

                  <p className="scanner-card__price">{formatarMoeda(ativo.precoAtual)}</p>

                  <div className="scanner-card__meta">
                    <div>
                      <span className="scanner-card__label">Variacao</span>
                      <strong
                        className={[
                          "scanner-card__value",
                          positiveTone
                            ? "scanner-card__value--positive"
                            : "scanner-card__value--negative",
                        ]
                          .join(" ")
                          .trim()}
                      >
                        {formatarPercentual(variacaoPercentual)}
                      </strong>
                    </div>

                    <div>
                      <span className="scanner-card__label">Volume</span>
                      <strong className="scanner-card__value">
                        {formatarVolume(ativo.volume)}
                      </strong>
                    </div>
                  </div>

                  <div className="scanner-card__footer">
                    <span className="scanner-card__badge">
                      {ativo.mercado || "Mercado nao informado"}
                    </span>
                    <span className="scanner-card__badge">
                      <ArrowDownUp size={14} />
                      {formatarMoeda(ativo.variacao)}
                    </span>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <div className="scanner-empty">
            {filtroAtivo === "gainers"
              ? "Nenhum ativo com variacao positiva encontrado para os filtros atuais."
              : filtroAtivo === "losers"
                ? "Nenhum ativo com variacao negativa encontrado para os filtros atuais."
                : "Nenhum ativo encontrado para os filtros atuais."}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

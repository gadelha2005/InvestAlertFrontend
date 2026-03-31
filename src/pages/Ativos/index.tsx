import { useEffect, useMemo, useState } from "react";
import { LineChart, Plus, Search, TrendingUp, X } from "lucide-react";
import { ativosApi } from "@/api/ativos";
import { formatarMoeda } from "@/api/format";
import { useLoadingWithDelay } from "@/hooks/useLoadingWithDelay";
import LoadingOverlay from "@/components/LoadingOverlay";
import StatCard from "@/components/dashboard/StatCard";
import AppLayout from "@/components/layout/AppLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import type {
  AtivoRequest,
  AtivoResponse,
  ErrorResponse,
  TipoAtivo,
} from "@/types";
import "./Ativos.css";

const typeLabels: Record<TipoAtivo, string> = {
  ACAO: "Acao",
  ETF: "ETF",
  FII: "FII",
  CRIPTOMOEDA: "Criptomoeda",
  INDICE: "Indice",
};

const typeOptions: Array<"TODOS" | TipoAtivo> = [
  "TODOS",
  "ACAO",
  "ETF",
  "FII",
  "CRIPTOMOEDA",
  "INDICE",
];

const getTypeLabel = (type: "TODOS" | TipoAtivo) =>
  type === "TODOS" ? "Todos" : typeLabels[type];

export default function Ativos() {
  const [ativos, setAtivos] = useState<AtivoResponse[]>([]);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<"TODOS" | TipoAtivo>(
    "TODOS",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const loadingWithDelay = useLoadingWithDelay();
  const [formData, setFormData] = useState<AtivoRequest>({
    ticker: "",
    nome: "",
    tipo: "ACAO",
    mercado: "",
  });

  const carregarAtivos = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await ativosApi.listar();
      setAtivos(response);
    } catch (error) {
      const apiError = error as ErrorResponse;
      setErrorMessage(
        apiError.mensagem ?? "Nao foi possivel carregar os ativos.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void carregarAtivos();
  }, []);

  const ativosFiltrados = useMemo(() => {
    return ativos.filter((ativo) => {
      const matchType = selectedType === "TODOS" || ativo.tipo === selectedType;
      const term = search.trim().toLowerCase();
      const matchSearch =
        term === "" ||
        ativo.ticker.toLowerCase().includes(term) ||
        (ativo.nome ?? "").toLowerCase().includes(term) ||
        (ativo.mercado ?? "").toLowerCase().includes(term);

      return matchType && matchSearch;
    });
  }, [ativos, search, selectedType]);

  const ativosComPreco = useMemo(
    () =>
      ativos.filter(
        (ativo) => ativo.precoAtual !== undefined && ativo.precoAtual !== null,
      ),
    [ativos],
  );

  const totalTipos = useMemo(
    () => new Set(ativos.map((ativo) => ativo.tipo)).size,
    [ativos],
  );

  const handleInputChange = <K extends keyof AtivoRequest>(
    key: K,
    value: AtivoRequest[K],
  ) => {
    setFormData((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      ticker: "",
      nome: "",
      tipo: "ACAO",
      mercado: "",
    });
    setSubmitError("");
    setSubmitSuccess("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    if (formData.ticker.trim() === "") {
      setSubmitError("Informe o ticker do ativo para continuar.");
      return;
    }

    setIsSubmitting(true);
    setIsOperationLoading(true);

    try {
      await loadingWithDelay(() =>
        ativosApi.cadastrar({
          ticker: formData.ticker.trim().toUpperCase(),
          nome: formData.nome?.trim() || undefined,
          tipo: formData.tipo,
          mercado: formData.mercado?.trim() || undefined,
        }),
      );

      setSubmitSuccess("Ativo cadastrado com sucesso.");
      await carregarAtivos();
      window.setTimeout(() => closeModal(), 1000);
    } catch (error) {
      const apiError = error as ErrorResponse;
      setSubmitError(
        apiError.mensagem ?? "Nao foi possivel cadastrar o ativo.",
      );
    } finally {
      setIsSubmitting(false);
      setIsOperationLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="assets-status">
          <h1 className="assets-status__title">Carregando ativos</h1>
          <p>Buscando a lista de ativos cadastrados no sistema.</p>
        </div>
      </AppLayout>
    );
  }

  if (errorMessage) {
    return (
      <AppLayout>
        <div className="assets-status">
          <h1 className="assets-status__title">
            Nao foi possivel abrir os ativos
          </h1>
          <p>{errorMessage}</p>
          <div className="assets-status__actions">
            <Button
              className="assets-status__button"
              onClick={() => void carregarAtivos()}
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
      <div className="assets-page">
        <section className="assets-page__hero">
          <div>
            <h1 className="assets-page__hero-title">Ativos</h1>
            <p className="assets-page__hero-description">
              Explore os ativos cadastrados, acompanhe os precos atuais
              retornados e cadastre novos ativos na base do sistema.
            </p>
          </div>

          <div className="assets-page__hero-actions">
            <div className="assets-page__hero-pill">
              {ativos.length} ativos cadastrados
            </div>
            <Button
              className="assets-page__button"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={16} />
              Adicionar ativo
            </Button>
          </div>
        </section>

        <section className="assets-page__stats">
          <StatCard
            label="Ativos totais"
            value={String(ativos.length)}
            meta="Base disponivel no sistema"
            icon={LineChart}
          />
          <StatCard
            label="Com preco atual"
            value={String(ativosComPreco.length)}
            meta="Ativos precificados no retorno"
            icon={TrendingUp}
          />
          <StatCard
            label="Tipos catalogados"
            value={String(totalTipos)}
            meta="Classes diferentes encontradas"
            icon={Search}
          />
        </section>

        <section className="assets-page__filters">
          <div className="assets-page__search">
            <Input
              type="text"
              placeholder="Buscar por ticker, nome ou mercado..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="assets-page__chips">
            {typeOptions.map((type) => (
              <button
                key={type}
                type="button"
                className={[
                  "assets-page__chip",
                  selectedType === type ? "assets-page__chip--active" : "",
                ]
                  .join(" ")
                  .trim()}
                onClick={() => setSelectedType(type)}
              >
                {getTypeLabel(type)}
              </button>
            ))}
          </div>
        </section>

        {ativosFiltrados.length > 0 ? (
          <section className="assets-page__list">
            {ativosFiltrados.map((ativo) => (
              <article key={ativo.id} className="assets-card">
                <div className="assets-card__row">
                  <div className="assets-card__identity">
                    <div className="assets-card__ticker-box">
                      {ativo.ticker.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="assets-card__ticker">{ativo.ticker}</p>
                      <p className="assets-card__name">
                        {ativo.nome || "Ativo sem nome informado"}
                      </p>
                    </div>
                  </div>

                  <div className="assets-card__price">
                    <p className="assets-card__price-value">
                      {formatarMoeda(ativo.precoAtual)}
                    </p>
                    <p className="assets-card__price-label">Preco atual</p>
                  </div>
                </div>

                <div className="assets-card__meta">
                  <span className="assets-card__badge assets-card__badge--accent">
                    {typeLabels[ativo.tipo]}
                  </span>
                  <span className="assets-card__badge">
                    {ativo.mercado || "Mercado nao informado"}
                  </span>
                  <span className="assets-card__badge">ID {ativo.id}</span>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <div className="assets-empty">
            Nenhum ativo encontrado para os filtros atuais. Tente outro termo de
            busca ou altere o tipo selecionado.
          </div>
        )}

        {isModalOpen ? (
          <div className="assets-modal" role="dialog" aria-modal="true">
            <div className="assets-modal__panel">
              <div className="assets-modal__header">
                <div>
                  <h2 className="assets-modal__title">Adicionar ativo</h2>
                  <p className="assets-modal__description">
                    Este cadastro adiciona um ativo global na base do sistema.
                  </p>
                </div>

                <button
                  type="button"
                  className="assets-modal__close"
                  onClick={closeModal}
                  aria-label="Fechar modal"
                >
                  <X size={18} />
                </button>
              </div>

              <form className="assets-modal__form" onSubmit={handleSubmit}>
                <div className="assets-modal__grid">
                  <div className="assets-modal__field">
                    <Label htmlFor="ticker">Ticker</Label>
                    <Input
                      id="ticker"
                      type="text"
                      placeholder="Ex.: PETR4"
                      value={formData.ticker}
                      onChange={(event) =>
                        handleInputChange("ticker", event.target.value)
                      }
                    />
                  </div>

                  <div className="assets-modal__field">
                    <Label htmlFor="tipo">Tipo</Label>
                    <select
                      id="tipo"
                      className="assets-modal__select"
                      value={formData.tipo}
                      onChange={(event) =>
                        handleInputChange(
                          "tipo",
                          event.target.value as TipoAtivo,
                        )
                      }
                    >
                      {(
                        typeOptions.filter(
                          (type) => type !== "TODOS",
                        ) as TipoAtivo[]
                      ).map((type) => (
                        <option key={type} value={type}>
                          {typeLabels[type]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="assets-modal__field">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Nome do ativo"
                    value={formData.nome ?? ""}
                    onChange={(event) =>
                      handleInputChange("nome", event.target.value)
                    }
                  />
                </div>

                <div className="assets-modal__field">
                  <Label htmlFor="mercado">Mercado</Label>
                  <Input
                    id="mercado"
                    type="text"
                    placeholder="B3, Nasdaq, Cripto..."
                    value={formData.mercado ?? ""}
                    onChange={(event) =>
                      handleInputChange("mercado", event.target.value)
                    }
                  />
                </div>

                {submitError ? (
                  <div className="assets-modal__feedback assets-modal__feedback--error">
                    {submitError}
                  </div>
                ) : null}

                {submitSuccess ? (
                  <div className="assets-modal__feedback assets-modal__feedback--success">
                    {submitSuccess}
                  </div>
                ) : null}

                <div className="assets-modal__actions">
                  <Button
                    type="button"
                    className="assets-modal__secondary"
                    onClick={closeModal}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Salvando..." : "Salvar ativo"}
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

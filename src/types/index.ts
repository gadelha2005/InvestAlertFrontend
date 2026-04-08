// ===== AUTH =====
export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  tipo: string;
  usuarioId: number;
  nome: string;
  email: string;
}

// ===== USUARIO =====
export interface UsuarioRequest {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
}

export interface UsuarioResponse {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  dataCadastro: string;
}

// ===== ATIVO =====
export type TipoAtivo = "ACAO" | "ETF" | "FII" | "CRIPTOMOEDA" | "INDICE";

export interface AtivoRequest {
  ticker: string;
  tipo: TipoAtivo;
}

export interface AtivoResponse {
  id: number;
  ticker: string;
  nome?: string;
  tipo: TipoAtivo;
  mercado?: string;
  precoAtual?: number;
  variacao?: number;
  variacaoPercentual?: number;
  volume?: number;
}

// ===== CARTEIRA =====
export interface CarteiraRequest {
  nome: string;
}

export interface CarteiraAtivoRequest {
  ticker: string;
  quantidade?: number;
  valor?: number;
  precoMedio?: number;
}

export interface CarteiraAtivoResponse {
  id: number;
  ativoId?: number;
  ticker: string;
  nomeAtivo?: string;
  quantidade: number;
  precoMedio: number;
  valor?: number;
  precoAtual?: number;
  valorInvestido: number;
  valorAtual?: number;
  lucroPrejuizo?: number;
  variacao?: number;
  variacaoPercentual?: number;
  percentualVariacao?: number;
  dataCompra: string;
}

export interface CarteiraResponse {
  id: number;
  nome: string;
  ativos: CarteiraAtivoResponse[];
  valorTotal: number;
  lucroPrejuizo: number;
}

// ===== ALERTA =====
export type TipoAlerta = "PRECO_ACIMA" | "PRECO_ABAIXO" | "VARIACAO";

export interface AlertaRequest {
  ticker: string;
  tipo: TipoAlerta;
  valorAlvo: number;
}

export interface AlertaResponse {
  id: number;
  ticker: string;
  tipo: TipoAlerta;
  valorAlvo: number;
  precoAtual?: number;
  ativado: boolean;
  dataCriacao: string;
}

// ===== NOTIFICACAO =====
export type CanalNotificacao = "EMAIL" | "WHATSAPP" | "INTERNO";

export interface NotificacaoResponse {
  id: number;
  mensagem: string;
  canal: CanalNotificacao;
  lida: boolean;
  dataEnvio: string;
}

// ===== META =====
export type TipoAcompanhamentoMeta = "MANUAL" | "CARTEIRA_VINCULADA";

export type TipoMovimentacaoMeta = "APORTE" | "RESGATE";

export interface MetaRequest {
  nome: string;
  valorObjetivo: number;
  tipoAcompanhamento?: TipoAcompanhamentoMeta;
  carteiraId?: number;
  dataLimite?: string;
}

export interface MetaResponse {
  id: number;
  nome: string;
  valorObjetivo: number;
  valorAtual: number;
  tipoAcompanhamento: TipoAcompanhamentoMeta;
  carteiraId?: number | null;
  percentualConcluido: number;
  dataCriacao: string;
  dataLimite?: string;
}

export interface MetaMovimentacaoRequest {
  tipo: TipoMovimentacaoMeta;
  valor: number;
  descricao?: string;
  dataMovimentacao?: string;
}

export interface MetaMovimentacaoResponse {
  id: number;
  metaId: number;
  tipo: TipoMovimentacaoMeta;
  valor: number;
  descricao?: string;
  dataMovimentacao: string;
  dataCriacao: string;
}

// ===== DASHBOARD =====
export interface DashboardHistoricoPoint {
  dataHora: string
  valorCarteira: number
}

export interface DashboardResponse {
  valorTotalCarteira: number;
  lucroPrejuizoTotal: number;
  variacaoPercentualTotal: number;
  alertasAtivos: number;
  notificacoesNaoLidas: number;
  ativos: CarteiraAtivoResponse[];
  historicoCarteira: DashboardHistoricoPoint[];
  metas: MetaResponse[];
}

// ===== ERRO =====
export interface ErrorResponse {
  status: number;
  erro: string;
  mensagem: string;
  timestamp: string;
  campos?: Record<string, string>;
}

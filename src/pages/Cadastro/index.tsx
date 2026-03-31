import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { authApi } from "@/api/auth";
import { useLoadingWithDelay } from "@/hooks/useLoadingWithDelay";
import LoadingOverlay from "@/components/LoadingOverlay";
import AuthLayout from "@/components/layout/AuthLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import { useAuthStore } from "@/store/authStore";
import type { ErrorResponse } from "@/types";
import "./Cadastro.css";

export default function Cadastro() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const loadingWithDelay = useLoadingWithDelay();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (
      nome.trim() === "" ||
      email.trim() === "" ||
      senha.trim() === "" ||
      confirmarSenha.trim() === ""
    ) {
      setErrorMessage("Preencha os campos obrigat&oacute;rios para continuar.");
      return;
    }

    if (senha.length < 6) {
      setErrorMessage("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErrorMessage("As senhas n&atilde;o coincidem.");
      return;
    }

    setIsSubmitting(true);
    setIsLoading(true);

    try {
      await loadingWithDelay(() =>
        authApi.cadastrar({
          nome: nome.trim(),
          email: email.trim(),
          senha,
          telefone: telefone.trim() || undefined,
        }),
      );

      setSuccessMessage(
        "Conta criada com sucesso. Redirecionando para o login...",
      );
      window.setTimeout(() => navigate("/login"), 1200);
    } catch (error) {
      const apiError = error as ErrorResponse;
      setErrorMessage(
        apiError.mensagem ??
          "N&atilde;o foi poss&iacute;vel concluir o cadastro.",
      );
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  return (
    <>
      <LoadingOverlay isVisible={isLoading} message="Criando conta..." />
      <AuthLayout
        title="Criar conta"
        description="Comece a organizar seus investimentos com uma conta simples e pronta para evoluir com o back."
        footer={
          <>
            J&aacute; tem conta?{" "}
            <Link to="/login" className="cadastro-form__link">
              Fazer login
            </Link>
          </>
        }
      >
        <form className="cadastro-form" onSubmit={handleSubmit}>
          <div className="cadastro-form__field">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              type="text"
              placeholder="Seu nome completo"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              autoComplete="name"
            />
          </div>

          <div className="cadastro-form__field">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="cadastro-form__field">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              type="tel"
              placeholder="(00) 00000-0000"
              value={telefone}
              onChange={(event) => setTelefone(event.target.value)}
              autoComplete="tel"
            />
          </div>

          <div className="cadastro-form__field">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Crie uma senha"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="cadastro-form__field">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirme sua senha"
              value={confirmarSenha}
              onChange={(event) => setConfirmarSenha(event.target.value)}
              autoComplete="new-password"
            />
          </div>

          {errorMessage ? (
            <div className="cadastro-form__feedback cadastro-form__feedback--error">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="cadastro-form__feedback cadastro-form__feedback--success">
              {successMessage}
            </div>
          ) : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>
      </AuthLayout>
    </>
  );
}

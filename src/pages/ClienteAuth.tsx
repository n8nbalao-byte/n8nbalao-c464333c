import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Lock, Phone, Loader2, ArrowLeft } from "lucide-react";

const API_BASE = "https://www.n8nbalao.com/api";

// Google Client ID
const GOOGLE_CLIENT_ID = "502896071844-skg6o3tai5vffjf60bu22si0uovc4or0.apps.googleusercontent.com";

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  address?: string;
  city?: string;
  state?: string;
  cep?: string;
  createdAt: string;
}

export default function ClienteAuth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  // Handle Google OAuth callback
  useEffect(() => {
    const googleAuth = searchParams.get("google_auth");
    const data = searchParams.get("data");
    const error = searchParams.get("error");

    if (error) {
      toast({
        title: "Erro no login com Google",
        description: error === "token_exchange_failed" 
          ? "Falha na autenticação. Tente novamente."
          : error,
        variant: "destructive",
      });
      // Clean URL
      window.history.replaceState({}, '', '/cliente');
      return;
    }

    if (googleAuth === "success" && data) {
      try {
        const customerData = JSON.parse(atob(decodeURIComponent(data)));
        localStorage.setItem("customer", JSON.stringify(customerData));
        localStorage.setItem("customerToken", customerData.token);
        toast({ title: "Bem-vindo!", description: `Olá, ${customerData.name}` });
        navigate("/meus-pedidos");
      } catch (e) {
        console.error("Error parsing Google auth data:", e);
        toast({
          title: "Erro",
          description: "Falha ao processar dados do Google",
          variant: "destructive",
        });
      }
      // Clean URL
      window.history.replaceState({}, '', '/cliente');
    }
  }, [searchParams, navigate, toast]);

  // Check if already logged in
  useEffect(() => {
    const customer = localStorage.getItem("customer");
    if (customer) {
      navigate("/meus-pedidos");
    }
  }, [navigate]);

  // Load Google Sign-In script
  useEffect(() => {
    // Google is configured, load the script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
        });
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleGoogleCallback = async (response: { credential: string }) => {
    setIsGoogleLoading(true);
    try {
      const result = await fetch(`${API_BASE}/google-auth.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await result.json();

      if (data.success) {
        localStorage.setItem("customer", JSON.stringify(data.customer));
        localStorage.setItem("customerToken", data.token);
        toast({ title: "Bem-vindo!", description: `Olá, ${data.customer.name}` });
        navigate("/meus-pedidos");
      } else {
        throw new Error(data.error || "Erro ao autenticar com Google");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // Method 1: Use Google One Tap if available
    if (window.google) {
      window.google.accounts.id.prompt();
      return;
    }

    // Method 2: Redirect to Google OAuth
    setIsGoogleLoading(true);
    try {
      const response = await fetch(`${API_BASE}/google-auth.php?action=get_auth_url`);
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error("Não foi possível obter URL de autenticação");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao iniciar login com Google",
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const response = await fetch(`${API_BASE}/auth.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "login",
            email: formData.email,
            password: formData.password,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Erro ao fazer login");
        }

        localStorage.setItem("customer", JSON.stringify(result.customer));
        localStorage.setItem("customerToken", result.token);
        
        toast({ title: "Bem-vindo!", description: `Olá, ${result.customer.name}` });
        navigate("/meus-pedidos");
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error("As senhas não coincidem");
        }

        if (formData.password.length < 6) {
          throw new Error("A senha deve ter pelo menos 6 caracteres");
        }

        const response = await fetch(`${API_BASE}/auth.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "register",
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Erro ao criar conta");
        }

        localStorage.setItem("customer", JSON.stringify(result.customer));
        localStorage.setItem("customerToken", result.token);
        
        toast({ title: "Conta criada!", description: "Bem-vindo ao Balão da Informática" });
        navigate("/meus-pedidos");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isGoogleConfigured = GOOGLE_CLIENT_ID.length > 10 && !GOOGLE_CLIENT_ID.includes("SEU_CLIENT_ID");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-foreground">
                {isLogin ? "Entrar na sua conta" : "Criar conta"}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {isLogin
                  ? "Acesse seu histórico de pedidos"
                  : "Cadastre-se para acompanhar seus pedidos"}
              </p>
            </div>

            {/* Google Login Button */}
            {isGoogleConfigured && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full py-6 text-lg mb-4 gap-3"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  Continuar com Google
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-card px-4 text-muted-foreground">ou</span>
                  </div>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nome Completo
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Seu nome"
                    required={!isLogin}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Senha
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Confirmar Senha
                    </Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      required={!isLogin}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Telefone (opcional)
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="(19) 99999-9999"
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full py-6 text-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isLogin ? (
                  "Entrar"
                ) : (
                  "Criar Conta"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline"
              >
                {isLogin
                  ? "Não tem conta? Cadastre-se"
                  : "Já tem conta? Faça login"}
              </button>
            </div>

            <div className="mt-4 text-center">
              <Link
                to="/loja"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para a loja
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Add Google types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, options: object) => void;
        };
      };
    };
  }
}

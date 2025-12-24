import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/contexts/CompanyContext';

interface AdminFullPageLoginProps {
  onSuccess: () => void;
}

export function AdminFullPageLogin({ onSuccess }: AdminFullPageLoginProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { company } = useCompany();
  const [loginData, setLoginData] = useState({ user: "", pass: "" });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      // Try local admin credentials first
      if (loginData.user === 'n8nbalao' && loginData.pass === 'Balao2025') {
        localStorage.setItem('adminAuthenticated', 'true');
        sessionStorage.setItem('admin_auth', 'true');
        toast({ title: "Bem-vindo!", description: "Login realizado com sucesso" });
        onSuccess();
        setIsLoggingIn(false);
        return;
      }
      
      // Try API authentication
      const response = await fetch('https://www.n8nbalao.com/api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: loginData.user,
          password: loginData.pass
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.admin) {
        localStorage.setItem('adminAuthenticated', 'true');
        sessionStorage.setItem('admin_auth', 'true');
        sessionStorage.setItem('admin_data', JSON.stringify(data.admin));
        toast({ title: "Bem-vindo!", description: `Olá, ${data.admin.name}` });
        onSuccess();
      } else {
        toast({ 
          title: "Erro", 
          description: data.error || "Usuário ou senha incorretos", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ 
        title: "Erro", 
        description: "Falha na conexão", 
        variant: "destructive" 
      });
    }
    
    setIsLoggingIn(false);
  }

  function handleGoogleLogin() {
    const currentUrl = window.location.href;
    window.location.href = `https://www.n8nbalao.com/api/google-auth.php?redirect=${encodeURIComponent(currentUrl)}`;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ backgroundColor: '#DC2626' }}>
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          {company?.logo ? (
            <img src={company.logo} alt={company.name || 'Logo'} className="mx-auto h-20 mb-4 object-contain" />
          ) : (
            <div className="flex items-center justify-center gap-2 mb-4">
              <Building2 className="h-16 w-16 text-primary" />
              <span className="font-bold text-2xl text-gray-800">{company?.name || 'Sua Empresa'}</span>
            </div>
          )}
          <p className="mt-2 text-gray-600">Acesso restrito</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Usuário ou Email</label>
            <input
              type="text"
              value={loginData.user}
              onChange={(e) => setLoginData(prev => ({ ...prev, user: e.target.value }))}
              className="w-full rounded-lg border-2 bg-white px-4 py-3 text-gray-800 focus:outline-none focus:ring-2"
              style={{ borderColor: '#E5E7EB' }}
              placeholder="Digite seu usuário ou email"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Senha</label>
            <input
              type="password"
              value={loginData.pass}
              onChange={(e) => setLoginData(prev => ({ ...prev, pass: e.target.value }))}
              className="w-full rounded-lg border-2 bg-white px-4 py-3 text-gray-800 focus:outline-none focus:ring-2"
              style={{ borderColor: '#E5E7EB' }}
              placeholder="Digite sua senha"
            />
          </div>
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full rounded-lg py-3 font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#DC2626' }}
          >
            {isLoggingIn ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">ou</span>
            </div>
          </div>
          
          <button
            onClick={handleGoogleLogin}
            className="mt-4 w-full flex items-center justify-center gap-3 rounded-lg border-2 border-gray-200 bg-white py-3 text-gray-700 font-medium transition-colors hover:bg-gray-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </button>
          <p className="mt-3 text-center text-xs text-gray-500">
            Apenas administradores cadastrados podem fazer login
          </p>
        </div>
        
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm font-medium hover:underline"
            style={{ color: '#DC2626' }}
          >
            ← Voltar ao site
          </button>
        </div>
      </div>
    </div>
  );
}

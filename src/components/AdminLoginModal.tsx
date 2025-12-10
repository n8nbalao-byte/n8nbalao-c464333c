import { useState } from 'react';
import { Lock, User, LogIn, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface AdminLoginModalProps {
  onSuccess: () => void;
}

export function AdminLoginModal({ onSuccess }: AdminLoginModalProps) {
  const { login } = useAdminAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Small delay for UX
    await new Promise(r => setTimeout(r, 500));
    
    const success = login(username, password);
    
    if (success) {
      toast({ title: 'Bem-vindo!', description: 'Login realizado com sucesso' });
      onSuccess();
    } else {
      toast({ 
        title: 'Erro', 
        description: 'Usuário ou senha incorretos', 
        variant: 'destructive' 
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">Área Restrita</h2>
          <p className="text-white/80 mt-1">Faça login para continuar</p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="username" className="text-gray-700">Usuário</Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="username"
                type="text"
                placeholder="Digite seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="password" className="text-gray-700">Senha</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Entrando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="w-5 h-5" />
                Entrar
              </span>
            )}
          </Button>
        </form>
        
        {/* Footer */}
        <div className="px-6 pb-6">
          <a
            href="/"
            className="block text-center text-sm text-gray-500 hover:text-gray-700"
          >
            ← Voltar para a página inicial
          </a>
        </div>
      </div>
    </div>
  );
}

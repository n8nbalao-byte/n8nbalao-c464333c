import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  Key,
  Shield,
  BarChart3,
  Plus,
  Copy,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

// =====================================================
// MASTER ADMIN - Painel de Administração Principal
// =====================================================

const MASTER_EMAIL = 'n8nbalao@gmail.com';
const MASTER_PASSWORD = 'j6t2h-ybt26-fwxgy-2hvxj-ttbdy';
const API_BASE_URL = 'https://www.n8nbalao.com/api';

interface Company {
  id: number;
  name: string;
  slug: string;
  email: string;
  plan: string;
  status: string;
  created_at: string;
}

interface License {
  id: number;
  license_key: string;
  plan: string;
  email: string;
  status: string;
  company_name?: string;
  generated_at: string;
  expires_at: string;
}

export default function MasterAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const masterAuth = sessionStorage.getItem('master_admin');
    if (masterAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (email === MASTER_EMAIL && password === MASTER_PASSWORD) {
      sessionStorage.setItem('master_admin', 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('E-mail ou senha incorretos');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('master_admin');
    setIsAuthenticated(false);
    navigate('/');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">Master Admin</CardTitle>
            <CardDescription className="text-center">
              Acesso restrito ao administrador principal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha Master</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full">
                <Key className="mr-2 h-4 w-4" />
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Master Admin</h1>
                <p className="text-sm text-gray-500">Painel de Controle Principal</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard">
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="companies">
              <Building2 className="mr-2 h-4 w-4" />
              Empresas
            </TabsTrigger>
            <TabsTrigger value="licenses">
              <Key className="mr-2 h-4 w-4" />
              Licenças
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardMetrics />
          </TabsContent>

          <TabsContent value="companies" className="space-y-6">
            <CompaniesManager />
          </TabsContent>

          <TabsContent value="licenses" className="space-y-6">
            <LicensesManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// =====================================================
// DASHBOARD METRICS
// =====================================================

function DashboardMetrics() {
  const [metrics, setMetrics] = useState({
    totalCompanies: 0,
    activeCompanies: 0,
    trialCompanies: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/companies.php`);
      const companies: Company[] = await response.json();
      
      setMetrics({
        totalCompanies: companies.length,
        activeCompanies: companies.filter(c => c.status === 'active').length,
        trialCompanies: companies.filter(c => c.status === 'trial').length,
        monthlyRevenue: 0, // TODO: Calcular da tabela payments
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Carregando métricas...</div>;
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">
              Todas as empresas cadastradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Ativas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeCompanies}</div>
            <p className="text-xs text-muted-foreground">
              Com planos ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Trial</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.trialCompanies}</div>
            <p className="text-xs text-muted-foreground">
              Período de teste
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {metrics.monthlyRevenue.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              MRR (Monthly Recurring Revenue)
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// =====================================================
// COMPANIES MANAGER
// =====================================================

function CompaniesManager() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/companies.php`);
      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Carregando empresas...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Empresas Cadastradas</CardTitle>
            <CardDescription>
              {companies.length} {companies.length === 1 ? 'empresa' : 'empresas'} no sistema
            </CardDescription>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Empresa
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id}>
                <TableCell>{company.id}</TableCell>
                <TableCell className="font-medium">{company.name}</TableCell>
                <TableCell>{company.slug}</TableCell>
                <TableCell>{company.email}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    company.plan === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                    company.plan === 'pro' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {company.plan}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    company.status === 'active' ? 'bg-green-100 text-green-800' :
                    company.status === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {company.status}
                  </span>
                </TableCell>
                <TableCell>
                  {new Date(company.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// =====================================================
// LICENSES MANAGER
// =====================================================

function LicensesManager() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/licenses.php`);
      const data = await response.json();
      setLicenses(data);
    } catch (error) {
      console.error('Error fetching licenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLicense = async (formData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/licenses.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Licença gerada com sucesso!',
          description: `Serial: ${data.license.license_key}`,
        });
        setIsDialogOpen(false);
        fetchLicenses();
      } else {
        toast({
          title: 'Erro ao gerar licença',
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao gerar licença',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: 'Serial copiado para área de transferência',
    });
  };

  if (loading) {
    return <div>Carregando licenças...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Licenças Geradas</CardTitle>
            <CardDescription>
              {licenses.length} {licenses.length === 1 ? 'licença' : 'licenças'} no sistema
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Gerar Licença
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gerar Nova Licença</DialogTitle>
                <DialogDescription>
                  Crie uma nova licença para um cliente
                </DialogDescription>
              </DialogHeader>
              <LicenseForm onSubmit={handleGenerateLicense} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serial</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {licenses.map((license) => (
              <TableRow key={license.id}>
                <TableCell className="font-mono text-sm">
                  {license.license_key}
                </TableCell>
                <TableCell>{license.email}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    license.plan === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                    license.plan === 'pro' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {license.plan}
                  </span>
                </TableCell>
                <TableCell>
                  {license.status === 'unused' && (
                    <span className="inline-flex items-center text-gray-600">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Não usada
                    </span>
                  )}
                  {license.status === 'active' && (
                    <span className="inline-flex items-center text-green-600">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Ativa
                    </span>
                  )}
                  {license.status === 'revoked' && (
                    <span className="inline-flex items-center text-red-600">
                      <XCircle className="mr-1 h-3 w-3" />
                      Revogada
                    </span>
                  )}
                </TableCell>
                <TableCell>{license.company_name || '-'}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(license.license_key)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// =====================================================
// LICENSE FORM
// =====================================================

function LicenseForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    email: '',
    plan: 'basic',
    duration_months: 12,
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail do Cliente</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="plan">Plano</Label>
        <Select
          value={formData.plan}
          onValueChange={(value) => setFormData({ ...formData, plan: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="basic">Básico</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Duração (meses)</Label>
        <Input
          id="duration"
          type="number"
          min="1"
          value={formData.duration_months}
          onChange={(e) => setFormData({ ...formData, duration_months: parseInt(e.target.value) })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <Button type="submit" className="w-full">
        Gerar Licença
      </Button>
    </form>
  );
}

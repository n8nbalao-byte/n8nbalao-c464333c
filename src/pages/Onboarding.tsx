import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  Palette, 
  CreditCard, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

// =====================================================
// ONBOARDING - Cadastro de Nova Empresa
// =====================================================

const API_BASE_URL = 'https://www.n8nbalao.com/api';

interface OnboardingData {
  // Step 1: Dados da Empresa
  companyName: string;
  slug: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  seller: string;
  
  // Step 2: Personalização
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  
  // Step 3: Plano ou Licença
  hasLicense: boolean;
  licenseKey: string;
  plan: string;
  
  // Step 4: Funcionalidades
  featureMontePc: boolean;
  featureMarketplace: boolean;
  featureConsignacao: boolean;
}

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [data, setData] = useState<OnboardingData>({
    companyName: '',
    slug: '',
    cnpj: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    seller: '',
    logo: '',
    primaryColor: '#E31C23',
    secondaryColor: '#FFFFFF',
    accentColor: '#DC2626',
    hasLicense: false,
    licenseKey: '',
    plan: 'basic',
    featureMontePc: true,
    featureMarketplace: false,
    featureConsignacao: false,
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const updateData = (field: string, value: any) => {
    setData({ ...data, [field]: value });
    setError('');
  };

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    setError('');
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!data.companyName || !data.slug || !data.email) {
          setError('Preencha todos os campos obrigatórios');
          return false;
        }
        // Validar formato do slug
        if (!/^[a-z0-9-]+$/.test(data.slug)) {
          setError('Slug deve conter apenas letras minúsculas, números e hífens');
          return false;
        }
        break;
      case 2:
        if (!data.primaryColor) {
          setError('Escolha pelo menos a cor primária');
          return false;
        }
        break;
      case 3:
        if (data.hasLicense && !data.licenseKey) {
          setError('Digite o serial da licença');
          return false;
        }
        if (!data.hasLicense && !data.plan) {
          setError('Escolha um plano');
          return false;
        }
        break;
    }
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Calcular trial_ends_at (7 dias)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      const payload = {
        name: data.companyName,
        slug: data.slug,
        email: data.email,
        cnpj: data.cnpj,
        phone: data.phone,
        address: data.address,
        city: data.city,
        seller: data.seller,
        logo: data.logo,
        primary_color: data.primaryColor,
        secondary_color: data.secondaryColor,
        accent_color: data.accentColor,
        plan: data.hasLicense ? 'enterprise' : data.plan, // Se tem licença, assume enterprise
        status: data.hasLicense ? 'active' : 'trial',
        trial_ends_at: data.hasLicense ? null : trialEndsAt.toISOString().slice(0, 19).replace('T', ' '),
        feature_monte_pc: data.featureMontePc,
        feature_marketplace: data.featureMarketplace,
        feature_consignacao: data.featureConsignacao,
        license_key: data.hasLicense ? data.licenseKey : null,
      };

      const response = await fetch(`${API_BASE_URL}/companies.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        const newSubdomain = `${data.slug}.n8nbalao.com`;
        toast({
          title: 'Empresa criada com sucesso!',
          description: data.hasLicense 
            ? `Sua conta foi ativada! Acesse: ${newSubdomain}`
            : `Você tem 7 dias de trial grátis! Acesse: ${newSubdomain}`,
        });

        // Redirecionar para o subdomínio da empresa criada
        setTimeout(() => {
          window.location.href = `https://${newSubdomain}`;
        }, 2500);
      } else {
        setError(result.error || 'Erro ao criar empresa');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Bem-vindo!</CardTitle>
            </div>
            <span className="text-sm text-muted-foreground">
              Passo {currentStep} de {totalSteps}
            </span>
          </div>
          <Progress value={progress} className="mb-2" />
          <CardDescription>
            {currentStep === 1 && 'Vamos começar com os dados da sua empresa'}
            {currentStep === 2 && 'Personalize as cores e identidade visual'}
            {currentStep === 3 && 'Escolha seu plano ou ative sua licença'}
            {currentStep === 4 && 'Selecione as funcionalidades desejadas'}
            {currentStep === 5 && 'Revise e confirme suas informações'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Dados da Empresa */}
          {currentStep === 1 && (
            <Step1
              data={data}
              updateData={updateData}
            />
          )}

          {/* Step 2: Personalização */}
          {currentStep === 2 && (
            <Step2
              data={data}
              updateData={updateData}
            />
          )}

          {/* Step 3: Plano ou Licença */}
          {currentStep === 3 && (
            <Step3
              data={data}
              updateData={updateData}
            />
          )}

          {/* Step 4: Funcionalidades */}
          {currentStep === 4 && (
            <Step4
              data={data}
              updateData={updateData}
            />
          )}

          {/* Step 5: Revisão */}
          {currentStep === 5 && (
            <Step5 data={data} />
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={loading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            )}

            {currentStep < totalSteps ? (
              <Button
                onClick={nextStep}
                disabled={loading}
                className="ml-auto"
              >
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="ml-auto"
              >
                {loading ? 'Criando...' : 'Finalizar Cadastro'}
                <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================
// STEP 1: Dados da Empresa
// =====================================================

function Step1({ data, updateData }: any) {
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Dados da Empresa</h3>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">Nome da Empresa *</Label>
          <Input
            id="companyName"
            value={data.companyName}
            onChange={(e) => {
              updateData('companyName', e.target.value);
              if (!data.slug) {
                updateData('slug', generateSlug(e.target.value));
              }
            }}
            placeholder="Minha Loja de Informática"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">
            Slug (URL) *
            <span className="text-xs text-muted-foreground ml-2">
              Será usado em: {data.slug || 'seu-slug'}.n8nbalao.com
            </span>
          </Label>
          <Input
            id="slug"
            value={data.slug}
            onChange={(e) => updateData('slug', e.target.value.toLowerCase())}
            placeholder="minha-loja"
            pattern="[a-z0-9-]+"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => updateData('email', e.target.value)}
              placeholder="contato@minhaloja.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={data.phone}
              onChange={(e) => updateData('phone', e.target.value)}
              placeholder="(19) 99999-9999"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ</Label>
          <Input
            id="cnpj"
            value={data.cnpj}
            onChange={(e) => updateData('cnpj', e.target.value)}
            placeholder="00.000.000/0000-00"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              value={data.city}
              onChange={(e) => updateData('city', e.target.value)}
              placeholder="Campinas"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="seller">Vendedor Responsável</Label>
            <Input
              id="seller"
              value={data.seller}
              onChange={(e) => updateData('seller', e.target.value)}
              placeholder="João Silva"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Endereço Completo</Label>
          <Textarea
            id="address"
            value={data.address}
            onChange={(e) => updateData('address', e.target.value)}
            placeholder="Rua Exemplo, 123 - Centro"
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}

// =====================================================
// STEP 2: Personalização
// =====================================================

// Paletas de cores disponíveis para seleção rápida
const colorPalettes = [
  { id: 'vermelho-elegante', name: 'Vermelho Elegante', primary: '#E31C23', secondary: '#FFFFFF', accent: '#DC2626', preview: ['#E31C23', '#DC2626', '#FECACA', '#FEF2F2'] },
  { id: 'azul-profissional', name: 'Azul Profissional', primary: '#2563EB', secondary: '#FFFFFF', accent: '#1D4ED8', preview: ['#2563EB', '#1D4ED8', '#BFDBFE', '#EFF6FF'] },
  { id: 'verde-natureza', name: 'Verde Natureza', primary: '#16A34A', secondary: '#FFFFFF', accent: '#15803D', preview: ['#16A34A', '#15803D', '#BBF7D0', '#F0FDF4'] },
  { id: 'roxo-moderno', name: 'Roxo Moderno', primary: '#9333EA', secondary: '#FFFFFF', accent: '#7C3AED', preview: ['#9333EA', '#7C3AED', '#DDD6FE', '#FAF5FF'] },
  { id: 'laranja-vibrante', name: 'Laranja Vibrante', primary: '#EA580C', secondary: '#FFFFFF', accent: '#DC2626', preview: ['#EA580C', '#C2410C', '#FED7AA', '#FFF7ED'] },
  { id: 'rosa-feminino', name: 'Rosa Feminino', primary: '#DB2777', secondary: '#FFFFFF', accent: '#BE185D', preview: ['#DB2777', '#BE185D', '#FBCFE8', '#FDF2F8'] },
  { id: 'ciano-tech', name: 'Ciano Tech', primary: '#0891B2', secondary: '#FFFFFF', accent: '#0E7490', preview: ['#0891B2', '#0E7490', '#A5F3FC', '#ECFEFF'] },
  { id: 'escuro-premium', name: 'Escuro Premium', primary: '#18181B', secondary: '#FAFAFA', accent: '#3F3F46', preview: ['#18181B', '#27272A', '#71717A', '#F4F4F5'] },
  { id: 'dourado-luxo', name: 'Dourado Luxo', primary: '#CA8A04', secondary: '#FFFBEB', accent: '#A16207', preview: ['#CA8A04', '#A16207', '#FDE68A', '#FFFBEB'] },
  { id: 'marinho-corporativo', name: 'Marinho Corporativo', primary: '#1E3A5F', secondary: '#FFFFFF', accent: '#0F172A', preview: ['#1E3A5F', '#0F172A', '#94A3B8', '#F1F5F9'] },
];

function Step2({ data, updateData }: any) {
  const handleSelectPalette = (palette: typeof colorPalettes[0]) => {
    updateData('primaryColor', palette.primary);
    updateData('secondaryColor', palette.secondary);
    updateData('accentColor', palette.accent);
  };

  const isSelected = (palette: typeof colorPalettes[0]) => 
    palette.primary.toLowerCase() === data.primaryColor?.toLowerCase();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Personalização Visual</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="logo">URL do Logo</Label>
          <Input
            id="logo"
            value={data.logo}
            onChange={(e) => updateData('logo', e.target.value)}
            placeholder="https://seusite.com/logo.png"
          />
          <p className="text-xs text-muted-foreground">
            Cole a URL de uma imagem hospedada online
          </p>
        </div>

        {/* Paletas de Cores - 1 Click */}
        <div className="space-y-3">
          <Label>Escolha uma Paleta de Cores (1 clique)</Label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {colorPalettes.map((palette) => (
              <button
                key={palette.id}
                type="button"
                onClick={() => handleSelectPalette(palette)}
                className={`relative group rounded-lg border-2 p-2 transition-all hover:scale-105 hover:shadow-md ${
                  isSelected(palette)
                    ? 'border-blue-500 ring-2 ring-blue-500/30'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                {isSelected(palette) && (
                  <div className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white rounded-full p-0.5">
                    <CheckCircle className="h-3 w-3" />
                  </div>
                )}
                
                <div className="flex gap-0.5 mb-1 rounded overflow-hidden">
                  {palette.preview.map((color, idx) => (
                    <div
                      key={idx}
                      className="h-5 flex-1"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                
                <p className="text-xs font-medium text-center truncate">
                  {palette.name}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="border rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium">Prévia das Cores Selecionadas:</p>
          <div className="flex gap-2 items-center">
            <div
              className="w-16 h-16 rounded-lg border-2 flex items-center justify-center text-white text-xs font-medium"
              style={{ backgroundColor: data.primaryColor }}
            >
              Primária
            </div>
            <div
              className="w-16 h-16 rounded-lg border-2 flex items-center justify-center text-xs font-medium"
              style={{ backgroundColor: data.secondaryColor }}
            >
              Secundária
            </div>
            <div
              className="w-16 h-16 rounded-lg border-2 flex items-center justify-center text-white text-xs font-medium"
              style={{ backgroundColor: data.accentColor }}
            >
              Destaque
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// STEP 3: Plano ou Licença
// =====================================================

function Step3({ data, updateData }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Plano ou Licença</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="hasLicense"
            checked={data.hasLicense}
            onChange={(e) => updateData('hasLicense', e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="hasLicense">Tenho um serial de licença</Label>
        </div>

        {data.hasLicense ? (
          <div className="space-y-2">
            <Label htmlFor="licenseKey">Serial da Licença</Label>
            <Input
              id="licenseKey"
              value={data.licenseKey}
              onChange={(e) => updateData('licenseKey', e.target.value.toUpperCase())}
              placeholder="ENT-202412-A3F9K-8H2J-N8NB"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Cole o serial fornecido pelo administrador
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Label>Escolha seu Plano (Trial de 7 dias grátis)</Label>
            
            <div className="grid gap-4">
              <PlanCard
                name="Básico"
                price="R$ 97/mês"
                features={['Loja completa', 'Monte seu PC']}
                selected={data.plan === 'basic'}
                onClick={() => updateData('plan', 'basic')}
              />
              
              <PlanCard
                name="Pro"
                price="R$ 197/mês"
                features={['Tudo do Básico', 'Cadastramento em massa', 'Marketplace', 'Consignação']}
                selected={data.plan === 'pro'}
                onClick={() => updateData('plan', 'pro')}
              />
              
              <PlanCard
                name="Enterprise"
                price="R$ 397/mês"
                features={['Tudo do Pro', 'Google Builder', 'Integração n8n']}
                selected={data.plan === 'enterprise'}
                onClick={() => updateData('plan', 'enterprise')}
                recommended
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlanCard({ name, price, features, selected, onClick, recommended }: any) {
  return (
    <div
      onClick={onClick}
      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
        selected
          ? 'border-primary bg-primary/5'
          : 'border-gray-200 hover:border-gray-300'
      } ${recommended ? 'relative' : ''}`}
    >
      {recommended && (
        <span className="absolute -top-2 right-4 bg-primary text-white text-xs px-2 py-1 rounded-full">
          Recomendado
        </span>
      )}
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-lg">{name}</h4>
        <p className="text-lg font-bold text-primary">{price}</p>
      </div>
      <ul className="space-y-1">
        {features.map((feature: string, i: number) => (
          <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-600" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

// =====================================================
// STEP 4: Funcionalidades
// =====================================================

function Step4({ data, updateData }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Funcionalidades Ativáveis</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Selecione quais funcionalidades você deseja ativar inicialmente. 
        Você poderá alterar isso depois no painel admin.
      </p>

      <div className="space-y-3">
        <FeatureToggle
          label="Monte seu PC"
          description="Permite que clientes montem PCs personalizados"
          checked={data.featureMontePc}
          onChange={(checked) => updateData('featureMontePc', checked)}
        />

        <FeatureToggle
          label="Marketplace"
          description="Vitrine de produtos de terceiros"
          checked={data.featureMarketplace}
          onChange={(checked) => updateData('featureMarketplace', checked)}
        />

        <FeatureToggle
          label="Sistema de Consignação"
          description="Receba produtos de clientes para revenda"
          checked={data.featureConsignacao}
          onChange={(checked) => updateData('featureConsignacao', checked)}
        />
      </div>
    </div>
  );
}

function FeatureToggle({ label, description, checked, onChange }: any) {
  return (
    <div className="flex items-start space-x-3 p-3 border rounded-lg">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 rounded"
      />
      <div className="flex-1">
        <Label className="font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

// =====================================================
// STEP 5: Revisão
// =====================================================

function Step5({ data }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Revise suas Informações</h3>
      </div>

      <div className="space-y-4 border rounded-lg p-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Empresa</p>
          <p className="text-lg font-semibold">{data.companyName}</p>
          <p className="text-sm text-muted-foreground">{data.slug}.n8nbalao.com</p>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground">Contato</p>
          <p>{data.email}</p>
          {data.phone && <p>{data.phone}</p>}
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground">Plano</p>
          <p className="font-semibold capitalize">
            {data.hasLicense ? 'Licença Ativada' : `${data.plan} - Trial de 7 dias`}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground">Funcionalidades Ativas</p>
          <ul className="text-sm space-y-1">
            {data.featureMontePc && <li>✓ Monte seu PC</li>}
            {data.featureMarketplace && <li>✓ Marketplace</li>}
            {data.featureConsignacao && <li>✓ Consignação</li>}
          </ul>
        </div>
      </div>

      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          {data.hasLicense
            ? 'Sua conta será ativada imediatamente após a confirmação.'
            : 'Você terá 7 dias de trial grátis para testar todas as funcionalidades!'}
        </AlertDescription>
      </Alert>
    </div>
  );
}

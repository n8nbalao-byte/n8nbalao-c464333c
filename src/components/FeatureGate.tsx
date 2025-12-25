import { ReactNode } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

// =====================================================
// FEATURE GATE - Controle de Acesso por Plano
// =====================================================
// Bloqueia funcionalidades baseado no plano da empresa

interface FeatureGateProps {
  feature: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function FeatureGate({ feature, fallback, children }: FeatureGateProps) {
  const { hasFeature, company } = useTenant();

  // Se tem a feature, mostra o conteúdo
  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  // Se tem fallback customizado, usa ele
  if (fallback) {
    return <>{fallback}</>;
  }

  // Senão, mostra prompt de upgrade
  return <UpgradePrompt feature={feature} currentPlan={company?.plan || 'basic'} />;
}

// =====================================================
// UPGRADE PROMPT - Mensagem de Upgrade
// =====================================================

interface UpgradePromptProps {
  feature: string;
  currentPlan: string;
}

function UpgradePrompt({ feature, currentPlan }: UpgradePromptProps) {
  const featureInfo = getFeatureInfo(feature);

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <Alert className="max-w-2xl">
        <Lock className="h-5 w-5" />
        <AlertTitle className="text-xl font-bold mb-2">
          Funcionalidade Bloqueada
        </AlertTitle>
        <AlertDescription className="space-y-4">
          <p className="text-base">
            <strong>{featureInfo.name}</strong> está disponível apenas no plano{' '}
            <span className="font-bold text-primary">{featureInfo.requiredPlan}</span>.
          </p>
          
          <p className="text-sm text-muted-foreground">
            {featureInfo.description}
          </p>

          <div className="flex gap-3 mt-4">
            <Button asChild>
              <Link to="/admin/billing">
                <Sparkles className="mr-2 h-4 w-4" />
                Fazer Upgrade
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link to="/admin">Voltar ao Admin</Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Seu plano atual: <strong className="capitalize">{currentPlan}</strong>
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}

// =====================================================
// FEATURE INFO - Informações das Features
// =====================================================

interface FeatureInfo {
  name: string;
  description: string;
  requiredPlan: string;
}

function getFeatureInfo(feature: string): FeatureInfo {
  const features: Record<string, FeatureInfo> = {
    monte_pc: {
      name: 'Monte seu PC',
      description: 'Permite que seus clientes montem PCs personalizados escolhendo cada componente.',
      requiredPlan: 'Básico',
    },
    marketplace: {
      name: 'Marketplace',
      description: 'Crie um marketplace onde clientes podem vender produtos usados.',
      requiredPlan: 'Pro',
    },
    consignacao: {
      name: 'Sistema de Consignação',
      description: 'Gerencie produtos em consignação com aprovação e controle de comissão.',
      requiredPlan: 'Pro',
    },
    bulk_import: {
      name: 'Cadastramento em Massa',
      description: 'Importe centenas de produtos de uma vez usando Excel ou CSV.',
      requiredPlan: 'Pro',
    },
    google_builder: {
      name: 'Criador de Página do Google',
      description: 'Crie landing pages personalizadas com o Google Fake Page Builder.',
      requiredPlan: 'Enterprise',
    },
    n8n: {
      name: 'Integração n8n',
      description: 'Conecte seu agente de WhatsApp com automações avançadas usando n8n.',
      requiredPlan: 'Enterprise',
    },
  };

  return features[feature] || {
    name: 'Funcionalidade Premium',
    description: 'Esta funcionalidade requer um plano superior.',
    requiredPlan: 'Pro',
  };
}

// =====================================================
// PLAN BADGE - Badge do Plano
// =====================================================

interface PlanBadgeProps {
  plan: 'basic' | 'pro' | 'enterprise';
  className?: string;
}

export function PlanBadge({ plan, className = '' }: PlanBadgeProps) {
  const badges = {
    basic: {
      label: 'Básico',
      className: 'bg-gray-100 text-gray-800 border-gray-300',
    },
    pro: {
      label: 'Pro',
      className: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    enterprise: {
      label: 'Enterprise',
      className: 'bg-purple-100 text-purple-800 border-purple-300',
    },
  };

  const badge = badges[plan];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.className} ${className}`}
    >
      {badge.label}
    </span>
  );
}

// =====================================================
// TRIAL BANNER - Banner de Trial
// =====================================================

export function TrialBanner() {
  const { company } = useTenant();

  if (!company || company.status !== 'trial' || !company.trial_ends_at) {
    return null;
  }

  const trialEndsAt = new Date(company.trial_ends_at);
  const now = new Date();
  const daysLeft = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 text-center">
      <div className="flex items-center justify-center gap-2">
        <Sparkles className="h-4 w-4" />
        <p className="text-sm font-medium">
          Seu trial expira em {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}.{' '}
          <Link to="/admin/billing" className="underline font-bold hover:text-white/90">
            Escolha um plano para continuar!
          </Link>
        </p>
      </div>
    </div>
  );
}

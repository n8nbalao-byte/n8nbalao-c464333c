import { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Save, Bot, Volume2, Mail, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_BASE = 'https://www.n8nbalao.com/api';

interface SettingsData {
  openai_api_key: string;
  assistant_name: string;
  assistant_model: string;
  bulk_gen_model: string;
  single_gen_model: string;
  elevenlabs_api_key: string;
  elevenlabs_voice_id: string;
  elevenlabs_enabled: string;
  resend_api_key: string;
  sender_email: string;
}

const availableModels = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Rápido e econômico)', inputCost: 0.15, outputCost: 0.60 },
  { value: 'gpt-4o', label: 'GPT-4o (Mais inteligente)', inputCost: 2.50, outputCost: 10.00 },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', inputCost: 10.00, outputCost: 30.00 },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Mais barato)', inputCost: 0.50, outputCost: 1.50 },
];

const availableVoices = [
  { value: 'B93iDjT4HFRCZ3Ju8oaV', label: 'Voz Personalizada (Padrão)' },
  { value: '9BWtsMINqrJLrRacOk9x', label: 'Aria' },
  { value: 'CwhRBWXzGAHq8TQ4Fs17', label: 'Roger' },
  { value: 'EXAVITQu4vr4xnSDxMaL', label: 'Sarah' },
  { value: 'FGY2WhTYpPnrIDTdsKH5', label: 'Laura' },
  { value: 'IKne3meq5aSn9XLyUdCD', label: 'Charlie' },
  { value: 'JBFqnCBsd6RMkjVDRZzb', label: 'George' },
  { value: 'onwK4e9ZLuTAKqWW03F9', label: 'Daniel' },
  { value: 'pFZP5JQG7iQjIQuC4Bku', label: 'Lily' },
];

export function GlobalSettingsForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showElevenlabsKey, setShowElevenlabsKey] = useState(false);
  const [showResendKey, setShowResendKey] = useState(false);
  
  const [settings, setSettings] = useState<SettingsData>({
    openai_api_key: '',
    assistant_name: 'Assistente',
    assistant_model: 'gpt-4o-mini',
    bulk_gen_model: 'gpt-4o-mini',
    single_gen_model: 'gpt-4o-mini',
    elevenlabs_api_key: '',
    elevenlabs_voice_id: 'B93iDjT4HFRCZ3Ju8oaV',
    elevenlabs_enabled: 'false',
    resend_api_key: '',
    sender_email: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/settings.php`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const settingsMap: Record<string, string> = {};
          data.data.forEach((item: { key: string; value: string }) => {
            settingsMap[item.key] = item.value;
          });
          
          setSettings(prev => ({
            ...prev,
            openai_api_key: settingsMap.openai_api_key || '',
            assistant_name: settingsMap.lorenzo_name || settingsMap.assistant_name || 'Assistente',
            assistant_model: settingsMap.lorenzo_model || settingsMap.assistant_model || 'gpt-4o-mini',
            bulk_gen_model: settingsMap.bulk_gen_model || 'gpt-4o-mini',
            single_gen_model: settingsMap.single_gen_model || 'gpt-4o-mini',
            elevenlabs_api_key: settingsMap.elevenlabs_api_key || '',
            elevenlabs_voice_id: settingsMap.elevenlabs_voice_id || 'B93iDjT4HFRCZ3Ju8oaV',
            elevenlabs_enabled: settingsMap.elevenlabs_enabled || 'false',
            resend_api_key: settingsMap.resend_api_key || '',
            sender_email: settingsMap.sender_email || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const settingsToSave = [
        { key: 'openai_api_key', value: settings.openai_api_key },
        { key: 'lorenzo_name', value: settings.assistant_name },
        { key: 'assistant_name', value: settings.assistant_name },
        { key: 'lorenzo_model', value: settings.assistant_model },
        { key: 'assistant_model', value: settings.assistant_model },
        { key: 'bulk_gen_model', value: settings.bulk_gen_model },
        { key: 'single_gen_model', value: settings.single_gen_model },
        { key: 'elevenlabs_api_key', value: settings.elevenlabs_api_key },
        { key: 'elevenlabs_voice_id', value: settings.elevenlabs_voice_id },
        { key: 'elevenlabs_enabled', value: settings.elevenlabs_enabled },
        { key: 'resend_api_key', value: settings.resend_api_key },
        { key: 'sender_email', value: settings.sender_email }
      ];

      for (const setting of settingsToSave) {
        await fetch(`${API_BASE}/settings.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(setting)
        });
      }

      toast({ title: 'Configurações salvas com sucesso!' });
    } catch (error) {
      toast({ 
        title: 'Erro ao salvar', 
        description: 'Não foi possível salvar as configurações',
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasOpenAI = settings.openai_api_key.length > 10;
  const hasElevenLabs = settings.elevenlabs_api_key.length > 10;
  const hasResend = settings.resend_api_key.length > 10;

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className={`rounded-xl p-4 border ${hasOpenAI ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}`}>
          <div className="flex items-center gap-3">
            {hasOpenAI ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-yellow-600" />}
            <div>
              <p className="font-medium text-foreground">OpenAI (IA)</p>
              <p className="text-sm text-muted-foreground">{hasOpenAI ? 'Configurado' : 'Não configurado'}</p>
            </div>
          </div>
        </div>
        
        <div className={`rounded-xl p-4 border ${hasElevenLabs ? 'border-green-500 bg-green-50' : 'border-muted bg-muted/20'}`}>
          <div className="flex items-center gap-3">
            {hasElevenLabs ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Volume2 className="h-5 w-5 text-muted-foreground" />}
            <div>
              <p className="font-medium text-foreground">ElevenLabs (Voz)</p>
              <p className="text-sm text-muted-foreground">{hasElevenLabs ? 'Configurado' : 'Opcional'}</p>
            </div>
          </div>
        </div>
        
        <div className={`rounded-xl p-4 border ${hasResend ? 'border-green-500 bg-green-50' : 'border-muted bg-muted/20'}`}>
          <div className="flex items-center gap-3">
            {hasResend ? <CheckCircle className="h-5 w-5 text-green-600" /> : <Mail className="h-5 w-5 text-muted-foreground" />}
            <div>
              <p className="font-medium text-foreground">Resend (Email)</p>
              <p className="text-sm text-muted-foreground">{hasResend ? 'Configurado' : 'Opcional'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* OpenAI Settings */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-emerald-100">
            <Sparkles className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-foreground">OpenAI - Inteligência Artificial</h3>
            <p className="text-sm text-muted-foreground">API para assistente, geração de descrições e classificação</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Key className="h-4 w-4" />
              Chave API OpenAI (Global para todo o site)
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={settings.openai_api_key}
                onChange={(e) => setSettings(prev => ({ ...prev, openai_api_key: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 pr-12 text-foreground focus:border-primary focus:outline-none"
                placeholder="sk-..."
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <Bot className="h-4 w-4" />
                Nome do Assistente
              </label>
              <input
                type="text"
                value={settings.assistant_name}
                onChange={(e) => setSettings(prev => ({ ...prev, assistant_name: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                placeholder="Nome do assistente de chat"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Modelo do Assistente</label>
              <select
                value={settings.assistant_model}
                onChange={(e) => setSettings(prev => ({ ...prev, assistant_model: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
              >
                {availableModels.map((model) => (
                  <option key={model.value} value={model.value}>{model.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Modelo para Geração em Massa</label>
              <select
                value={settings.bulk_gen_model}
                onChange={(e) => setSettings(prev => ({ ...prev, bulk_gen_model: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
              >
                {availableModels.map((model) => (
                  <option key={model.value} value={model.value}>{model.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Modelo para Geração Individual</label>
              <select
                value={settings.single_gen_model}
                onChange={(e) => setSettings(prev => ({ ...prev, single_gen_model: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
              >
                {availableModels.map((model) => (
                  <option key={model.value} value={model.value}>{model.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ElevenLabs Settings */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Volume2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">ElevenLabs - Síntese de Voz</h3>
              <p className="text-sm text-muted-foreground">Voz para o assistente (opcional)</p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-muted-foreground">Ativar</span>
            <input
              type="checkbox"
              checked={settings.elevenlabs_enabled === 'true'}
              onChange={(e) => setSettings(prev => ({ ...prev, elevenlabs_enabled: e.target.checked ? 'true' : 'false' }))}
              className="sr-only"
            />
            <div className={`w-10 h-6 rounded-full transition-colors ${settings.elevenlabs_enabled === 'true' ? 'bg-primary' : 'bg-muted'}`}>
              <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform ${settings.elevenlabs_enabled === 'true' ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
          </label>
        </div>

        {settings.elevenlabs_enabled === 'true' && (
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <Key className="h-4 w-4" />
                Chave API ElevenLabs
              </label>
              <div className="relative">
                <input
                  type={showElevenlabsKey ? 'text' : 'password'}
                  value={settings.elevenlabs_api_key}
                  onChange={(e) => setSettings(prev => ({ ...prev, elevenlabs_api_key: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 pr-12 text-foreground focus:border-primary focus:outline-none"
                  placeholder="API Key"
                />
                <button
                  type="button"
                  onClick={() => setShowElevenlabsKey(!showElevenlabsKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showElevenlabsKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Voz</label>
              <select
                value={settings.elevenlabs_voice_id}
                onChange={(e) => setSettings(prev => ({ ...prev, elevenlabs_voice_id: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
              >
                {availableVoices.map((voice) => (
                  <option key={voice.value} value={voice.value}>{voice.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Resend Settings */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-blue-100">
            <Mail className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-foreground">Resend - Email Marketing</h3>
            <p className="text-sm text-muted-foreground">Envio de emails e campanhas (opcional)</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Key className="h-4 w-4" />
              Chave API Resend
            </label>
            <div className="relative">
              <input
                type={showResendKey ? 'text' : 'password'}
                value={settings.resend_api_key}
                onChange={(e) => setSettings(prev => ({ ...prev, resend_api_key: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 pr-12 text-foreground focus:border-primary focus:outline-none"
                placeholder="re_..."
              />
              <button
                type="button"
                onClick={() => setShowResendKey(!showResendKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showResendKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Mail className="h-4 w-4" />
              Email Remetente
            </label>
            <input
              type="email"
              value={settings.sender_email}
              onChange={(e) => setSettings(prev => ({ ...prev, sender_email: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
              placeholder="noreply@seudominio.com"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={saveSettings}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-4 font-semibold text-primary-foreground shadow-lg transition-all hover:opacity-90 disabled:opacity-50"
      >
        <Save className="h-5 w-5" />
        {saving ? 'Salvando...' : 'Salvar Todas as Configurações'}
      </button>
    </div>
  );
}

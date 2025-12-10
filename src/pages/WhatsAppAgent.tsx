import { useState, useEffect } from 'react';
import { ArrowLeft, Power, PowerOff, Save, MessageSquare, Bot, Database, Clock, AlertCircle, CheckCircle, RefreshCw, Key, Eye, EyeOff, Volume2, Webhook, Server, Smartphone, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'https://www.n8nbalao.com/api';

interface AgentSettings {
  // Agent settings
  enabled: boolean;
  whatsappNumber: string;
  openaiModel: string;
  systemPrompt: string;
  welcomeMessage: string;
  transferMessage: string;
  maxContextMessages: number;
  responseDelay: number;
  offlineMessage: string;
  businessHoursOnly: boolean;
  businessHoursStart: string;
  businessHoursEnd: string;
  
  // API Credentials
  openaiApiKey: string;
  evolutionApiUrl: string;
  evolutionApiKey: string;
  evolutionInstance: string;
  elevenlabsApiKey: string;
  elevenlabsVoiceId: string;
  elevenlabsEnabled: boolean;
}

interface Stats {
  totalMessages: number;
  totalConversations: number;
  messagesToday: number;
  lastMessageAt: string | null;
}

const defaultSystemPrompt = `# Lorenzo - Assistente Virtual Balão da Informática

## IDENTIDADE
Assistente virtual profissional, técnico, paciente e consultivo. Comunicação clara e objetiva, SEM emojis.

**Contatos da empresa:**
- Site: https://www.n8nbalao.com
- WhatsApp: (19) 98147-0446
- Especialidades: Montagem de PCs, hardware, periféricos, automação n8n

## REGRA CRÍTICA
**NUNCA invente produtos, preços ou informações. SEMPRE consulte o banco de dados antes de responder.**

## BANCO DE DADOS DISPONÍVEL
- products: PCs montados, notebooks, periféricos, software
- hardware: Componentes (CPU, GPU, RAM, SSD, placa-mãe, fonte, gabinete, cooler)
- customers: Dados de clientes
- orders: Pedidos e histórico
- company: Informações da empresa

## COMPATIBILIDADE DE HARDWARE
Ao montar PC, verificar:
1. Socket: CPU e placa-mãe devem ter socket idêntico
2. Memória: DDR4 ou DDR5 compatível
3. Fonte: CPU_TDP + GPU_TDP + 100W + 20% margem
4. Form Factor: Gabinete suporta tamanho da placa

## REGRAS
✅ Consultar banco antes de confirmar produto/preço
✅ Incluir preços ao mencionar produtos
✅ Verificar compatibilidade em montagens
✅ Direcionar para WhatsApp/Site para finalizar

❌ NUNCA usar emojis
❌ NUNCA inventar produtos ou preços
❌ NUNCA processar pagamentos`;

const WhatsAppAgent = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showEvolutionKey, setShowEvolutionKey] = useState(false);
  const [showElevenLabsKey, setShowElevenLabsKey] = useState(false);
  
  const [settings, setSettings] = useState<AgentSettings>({
    enabled: false,
    whatsappNumber: '',
    openaiModel: 'gpt-4o',
    systemPrompt: defaultSystemPrompt,
    welcomeMessage: 'Olá! Sou o Lorenzo, assistente virtual da Balão da Informática. Como posso ajudar você hoje?',
    transferMessage: 'Vou transferir você para um atendente humano. Aguarde um momento.',
    maxContextMessages: 20,
    responseDelay: 2,
    offlineMessage: 'Nosso horário de atendimento é de segunda a sexta, das 8h às 18h.',
    businessHoursOnly: false,
    businessHoursStart: '08:00',
    businessHoursEnd: '18:00',
    openaiApiKey: '',
    evolutionApiUrl: '',
    evolutionApiKey: '',
    evolutionInstance: 'balao',
    elevenlabsApiKey: '',
    elevenlabsVoiceId: 'B93iDjT4HFRCZ3Ju8oaV',
    elevenlabsEnabled: false
  });

  const [stats, setStats] = useState<Stats>({
    totalMessages: 0,
    totalConversations: 0,
    messagesToday: 0,
    lastMessageAt: null
  });

  const webhookUrl = 'https://www.n8nbalao.com/api/whatsapp-webhook.php';

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const adminAuth = localStorage.getItem('adminAuth');
    if (adminAuth === 'true') {
      setIsAuthenticated(true);
      loadSettings();
    } else {
      navigate('/admin');
    }
    setLoading(false);
  };

  const loadSettings = async () => {
    try {
      // Load from whatsapp-agent.php
      const response = await fetch(`${API_BASE}/whatsapp-agent.php`);
      const data = await response.json();
      
      if (data.success) {
        const s = data.settings || {};
        const st = data.stats || {};
        
        setSettings(prev => ({
          ...prev,
          enabled: s.enabled || false,
          whatsappNumber: s.whatsappNumber || '',
          openaiModel: s.openaiModel || 'gpt-4o',
          systemPrompt: s.systemPrompt || defaultSystemPrompt,
          welcomeMessage: s.welcomeMessage || prev.welcomeMessage,
          transferMessage: s.transferMessage || prev.transferMessage,
          maxContextMessages: s.maxContextMessages || 20,
          responseDelay: s.responseDelay || 2,
          offlineMessage: s.offlineMessage || prev.offlineMessage,
          businessHoursOnly: s.businessHoursOnly || false,
          businessHoursStart: s.businessHoursStart || '08:00',
          businessHoursEnd: s.businessHoursEnd || '18:00'
        }));

        setStats({
          totalMessages: st.totalMessages || 0,
          totalConversations: st.totalConversations || 0,
          messagesToday: st.messagesToday || 0,
          lastMessageAt: st.lastMessageAt || null
        });
      }

      // Load API keys from settings.php
      const settingsResponse = await fetch(`${API_BASE}/settings.php`);
      const settingsData = await settingsResponse.json();
      
      if (settingsData.success && settingsData.settings) {
        const apiSettings = settingsData.settings;
        setSettings(prev => ({
          ...prev,
          openaiApiKey: apiSettings.openai_api_key || '',
          evolutionApiUrl: apiSettings.evolution_api_url || '',
          evolutionApiKey: apiSettings.evolution_api_key || '',
          evolutionInstance: apiSettings.evolution_instance || 'balao',
          elevenlabsApiKey: apiSettings.elevenlabs_api_key || '',
          elevenlabsVoiceId: apiSettings.elevenlabs_voice_id || 'B93iDjT4HFRCZ3Ju8oaV',
          elevenlabsEnabled: apiSettings.elevenlabs_enabled === 'true'
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({ title: 'Erro', description: 'Falha ao carregar configurações', variant: 'destructive' });
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Save agent settings
      await fetch(`${API_BASE}/whatsapp-agent.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: settings.enabled,
          whatsappNumber: settings.whatsappNumber,
          openaiModel: settings.openaiModel,
          systemPrompt: settings.systemPrompt,
          welcomeMessage: settings.welcomeMessage,
          transferMessage: settings.transferMessage,
          maxContextMessages: settings.maxContextMessages,
          responseDelay: settings.responseDelay,
          offlineMessage: settings.offlineMessage,
          businessHoursOnly: settings.businessHoursOnly,
          businessHoursStart: settings.businessHoursStart,
          businessHoursEnd: settings.businessHoursEnd
        })
      });

      // Save API credentials
      const apiCredentials = [
        { key: 'openai_api_key', value: settings.openaiApiKey },
        { key: 'evolution_api_url', value: settings.evolutionApiUrl },
        { key: 'evolution_api_key', value: settings.evolutionApiKey },
        { key: 'evolution_instance', value: settings.evolutionInstance },
        { key: 'elevenlabs_api_key', value: settings.elevenlabsApiKey },
        { key: 'elevenlabs_voice_id', value: settings.elevenlabsVoiceId },
        { key: 'elevenlabs_enabled', value: settings.elevenlabsEnabled ? 'true' : 'false' }
      ];

      for (const cred of apiCredentials) {
        await fetch(`${API_BASE}/settings.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update', key: cred.key, value: cred.value })
        });
      }

      toast({ title: 'Sucesso', description: 'Configurações salvas!' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao salvar configurações', variant: 'destructive' });
    }
    setSaving(false);
  };

  const toggleAgent = async () => {
    const newEnabled = !settings.enabled;
    setSettings(prev => ({ ...prev, enabled: newEnabled }));
    
    try {
      await fetch(`${API_BASE}/whatsapp-agent.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newEnabled })
      });

      toast({ 
        title: newEnabled ? 'Agente Ativado' : 'Agente Desativado',
        description: newEnabled ? 'O agente WhatsApp está agora ativo' : 'O agente WhatsApp foi desativado'
      });
    } catch (error) {
      setSettings(prev => ({ ...prev, enabled: !newEnabled }));
      toast({ title: 'Erro', description: 'Falha ao alterar status', variant: 'destructive' });
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast({ title: 'Copiado!', description: 'URL do webhook copiada' });
  };

  const availableVoices = [
    { value: 'B93iDjT4HFRCZ3Ju8oaV', label: 'Voz Personalizada (Lorenzo)' },
    { value: '9BWtsMINqrJLrRacOk9x', label: 'Aria' },
    { value: 'CwhRBWXzGAHq8TQ4Fs17', label: 'Roger' },
    { value: 'EXAVITQu4vr4xnSDxMaL', label: 'Sarah' },
    { value: 'onwK4e9ZLuTAKqWW03F9', label: 'Daniel' },
    { value: 'pFZP5JQG7iQjIQuC4Bku', label: 'Lily' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Agente WhatsApp IA</h1>
                  <p className="text-sm text-gray-500">Configuração completa do agente</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${settings.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {settings.enabled ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span className="text-sm font-medium">{settings.enabled ? 'Ativo' : 'Inativo'}</span>
              </div>

              <Button 
                onClick={toggleAgent}
                variant={settings.enabled ? 'destructive' : 'default'}
                className="gap-2"
                style={!settings.enabled ? { backgroundColor: '#25D366' } : {}}
              >
                {settings.enabled ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                {settings.enabled ? 'Desativar' : 'Ativar'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Webhook URL Card */}
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                <Webhook className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 mb-1">URL do Webhook (Configure na Evolution API)</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono">{webhookUrl}</code>
                  <Button size="sm" variant="outline" onClick={copyWebhookUrl}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.messagesToday}</p>
                  <p className="text-sm text-gray-500">Mensagens hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalConversations}</p>
                  <p className="text-sm text-gray-500">Conversas totais</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{settings.responseDelay}s</p>
                  <p className="text-sm text-gray-500">Delay resposta</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Database className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalMessages}</p>
                  <p className="text-sm text-gray-500">Total mensagens</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="credentials" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="credentials" className="gap-2">
              <Key className="w-4 h-4" />
              Credenciais
            </TabsTrigger>
            <TabsTrigger value="evolution" className="gap-2">
              <Smartphone className="w-4 h-4" />
              Evolution API
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Mensagens
            </TabsTrigger>
            <TabsTrigger value="behavior" className="gap-2">
              <Bot className="w-4 h-4" />
              Comportamento
            </TabsTrigger>
            <TabsTrigger value="voice" className="gap-2">
              <Volume2 className="w-4 h-4" />
              Voz (ElevenLabs)
            </TabsTrigger>
          </TabsList>

          {/* Credentials Tab */}
          <TabsContent value="credentials">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Credenciais de API
                </CardTitle>
                <CardDescription>Configure as chaves de API necessárias para o agente funcionar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* OpenAI API Key */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    OpenAI API Key
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showOpenAIKey ? 'text' : 'password'}
                        placeholder="sk-..."
                        value={settings.openaiApiKey}
                        onChange={(e) => setSettings(prev => ({ ...prev, openaiApiKey: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                      >
                        {showOpenAIKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Button variant="outline" asChild>
                      <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">Necessária para o processamento de IA (chat, transcrição, análise de imagens)</p>
                </div>

                {/* OpenAI Model */}
                <div className="space-y-2">
                  <Label>Modelo OpenAI</Label>
                  <Select 
                    value={settings.openaiModel} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, openaiModel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini (Rápido e barato)</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o (Recomendado)</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Mais barato)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status indicator */}
                <div className="p-4 rounded-lg bg-gray-50 border">
                  <p className="text-sm font-medium mb-2">Status das Credenciais:</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`w-2 h-2 rounded-full ${settings.openaiApiKey ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      OpenAI: {settings.openaiApiKey ? 'Configurada' : 'Não configurada'}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`w-2 h-2 rounded-full ${settings.evolutionApiUrl && settings.evolutionApiKey ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      Evolution API: {settings.evolutionApiUrl && settings.evolutionApiKey ? 'Configurada' : 'Não configurada'}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`w-2 h-2 rounded-full ${settings.elevenlabsApiKey ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                      ElevenLabs: {settings.elevenlabsApiKey ? 'Configurada' : 'Opcional'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Evolution API Tab */}
          <TabsContent value="evolution">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Evolution API (WhatsApp)
                </CardTitle>
                <CardDescription>Configure a conexão com seu WhatsApp via Evolution API</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>URL da Evolution API</Label>
                  <Input
                    placeholder="https://api.sua-evolution.com"
                    value={settings.evolutionApiUrl}
                    onChange={(e) => setSettings(prev => ({ ...prev, evolutionApiUrl: e.target.value }))}
                  />
                  <p className="text-sm text-gray-500">URL base da sua instância Evolution API</p>
                </div>

                <div className="space-y-2">
                  <Label>API Key da Evolution</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showEvolutionKey ? 'text' : 'password'}
                        placeholder="sua-api-key"
                        value={settings.evolutionApiKey}
                        onChange={(e) => setSettings(prev => ({ ...prev, evolutionApiKey: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowEvolutionKey(!showEvolutionKey)}
                      >
                        {showEvolutionKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nome da Instância</Label>
                  <Input
                    placeholder="balao"
                    value={settings.evolutionInstance}
                    onChange={(e) => setSettings(prev => ({ ...prev, evolutionInstance: e.target.value }))}
                  />
                  <p className="text-sm text-gray-500">Nome da instância configurada na Evolution API</p>
                </div>

                <div className="space-y-2">
                  <Label>Número do WhatsApp</Label>
                  <Input
                    placeholder="5519981470446"
                    value={settings.whatsappNumber}
                    onChange={(e) => setSettings(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                  />
                  <p className="text-sm text-gray-500">Número conectado à instância (apenas números, com código do país)</p>
                </div>

                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-sm font-medium text-blue-800 mb-2">Configuração do Webhook na Evolution:</p>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Acesse o painel da Evolution API</li>
                    <li>Vá em Configurações → Webhook</li>
                    <li>Cole a URL: <code className="bg-white px-1 rounded">{webhookUrl}</code></li>
                    <li>Ative eventos: messages.upsert</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Mensagens Padrão</CardTitle>
                <CardDescription>Configure as mensagens automáticas do agente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Mensagem de Boas-vindas</Label>
                  <Textarea
                    placeholder="Olá! Sou o Lorenzo..."
                    value={settings.welcomeMessage}
                    onChange={(e) => setSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mensagem de Transferência para Humano</Label>
                  <Textarea
                    placeholder="Vou transferir você..."
                    value={settings.transferMessage}
                    onChange={(e) => setSettings(prev => ({ ...prev, transferMessage: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mensagem Fora do Horário</Label>
                  <Textarea
                    placeholder="Nosso horário de atendimento..."
                    value={settings.offlineMessage}
                    onChange={(e) => setSettings(prev => ({ ...prev, offlineMessage: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                  <div>
                    <Label>Responder apenas em horário comercial</Label>
                    <p className="text-sm text-gray-500">Fora do horário, envia mensagem offline</p>
                  </div>
                  <Switch
                    checked={settings.businessHoursOnly}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, businessHoursOnly: checked }))}
                  />
                </div>

                {settings.businessHoursOnly && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Início do Horário</Label>
                      <Input
                        type="time"
                        value={settings.businessHoursStart}
                        onChange={(e) => setSettings(prev => ({ ...prev, businessHoursStart: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fim do Horário</Label>
                      <Input
                        type="time"
                        value={settings.businessHoursEnd}
                        onChange={(e) => setSettings(prev => ({ ...prev, businessHoursEnd: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Behavior Tab */}
          <TabsContent value="behavior">
            <Card>
              <CardHeader>
                <CardTitle>Comportamento do Agente</CardTitle>
                <CardDescription>Configure como o agente deve responder</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>System Prompt (Personalidade e Instruções)</Label>
                  <Textarea
                    placeholder="Você é o Lorenzo..."
                    value={settings.systemPrompt}
                    onChange={(e) => setSettings(prev => ({ ...prev, systemPrompt: e.target.value }))}
                    rows={20}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-gray-500">Instruções detalhadas para o comportamento da IA</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Mensagens no Contexto</Label>
                    <Input
                      type="number"
                      min={5}
                      max={50}
                      value={settings.maxContextMessages}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxContextMessages: parseInt(e.target.value) || 20 }))}
                    />
                    <p className="text-sm text-gray-500">Quantas mensagens anteriores enviar como contexto</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Delay de Resposta (segundos)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      value={settings.responseDelay}
                      onChange={(e) => setSettings(prev => ({ ...prev, responseDelay: parseInt(e.target.value) || 2 }))}
                    />
                    <p className="text-sm text-gray-500">Tempo de espera antes de responder</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voice Tab */}
          <TabsContent value="voice">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5" />
                  ElevenLabs (Resposta por Áudio)
                </CardTitle>
                <CardDescription>Configure respostas em áudio usando ElevenLabs (opcional)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                  <div>
                    <Label>Ativar respostas em áudio</Label>
                    <p className="text-sm text-gray-500">Além do texto, envia áudio da resposta</p>
                  </div>
                  <Switch
                    checked={settings.elevenlabsEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, elevenlabsEnabled: checked }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>API Key do ElevenLabs</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showElevenLabsKey ? 'text' : 'password'}
                        placeholder="xi_..."
                        value={settings.elevenlabsApiKey}
                        onChange={(e) => setSettings(prev => ({ ...prev, elevenlabsApiKey: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowElevenLabsKey(!showElevenLabsKey)}
                      >
                        {showElevenLabsKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Button variant="outline" asChild>
                      <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Voz do ElevenLabs</Label>
                  <Select 
                    value={settings.elevenlabsVoiceId} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, elevenlabsVoiceId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVoices.map(voice => (
                        <SelectItem key={voice.value} value={voice.value}>{voice.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <Button 
            onClick={saveSettings} 
            disabled={saving}
            size="lg"
            className="gap-2"
            style={{ backgroundColor: '#25D366' }}
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Todas as Configurações
          </Button>
        </div>
      </main>
    </div>
  );
};

export default WhatsAppAgent;

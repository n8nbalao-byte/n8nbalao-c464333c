import { useState, useEffect } from 'react';
import { ArrowLeft, Power, PowerOff, Save, Settings, MessageSquare, Bot, Database, Clock, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'https://www.n8nbalao.com/api';

interface AgentSettings {
  enabled: boolean;
  n8nWebhookUrl: string;
  whatsappNumber: string;
  openaiModel: string;
  systemPrompt: string;
  welcomeMessage: string;
  transferMessage: string;
  maxContextMessages: number;
  responseDelay: number;
}

const WhatsAppAgent = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  
  const [settings, setSettings] = useState<AgentSettings>({
    enabled: false,
    n8nWebhookUrl: '',
    whatsappNumber: '',
    openaiModel: 'gpt-4o',
    systemPrompt: '',
    welcomeMessage: 'Olá! Sou o Lorenzo, assistente virtual da Balão da Informática. Como posso ajudar você hoje?',
    transferMessage: 'Vou transferir você para um atendente humano. Aguarde um momento.',
    maxContextMessages: 20,
    responseDelay: 1000
  });

  const [stats, setStats] = useState({
    messagesTotal: 0,
    messagesThisMonth: 0,
    conversationsActive: 0,
    avgResponseTime: '0s',
    lastActivity: null as string | null
  });

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
      const response = await fetch(`${API_BASE}/settings.php?action=whatsapp_agent`);
      const data = await response.json();
      
      if (data.success && data.settings) {
        setSettings(prev => ({
          ...prev,
          enabled: data.settings.whatsapp_agent_enabled === 'true',
          n8nWebhookUrl: data.settings.n8n_webhook_url || '',
          whatsappNumber: data.settings.whatsapp_number || '',
          openaiModel: data.settings.whatsapp_openai_model || 'gpt-4o',
          systemPrompt: data.settings.whatsapp_system_prompt || '',
          welcomeMessage: data.settings.whatsapp_welcome_message || settings.welcomeMessage,
          transferMessage: data.settings.whatsapp_transfer_message || settings.transferMessage,
          maxContextMessages: parseInt(data.settings.whatsapp_max_context || '20'),
          responseDelay: parseInt(data.settings.whatsapp_response_delay || '1000')
        }));
      }

      // Load stats
      const statsResponse = await fetch(`${API_BASE}/settings.php?action=whatsapp_stats`);
      const statsData = await statsResponse.json();
      if (statsData.success && statsData.stats) {
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/settings.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_whatsapp_agent',
          settings: {
            whatsapp_agent_enabled: settings.enabled ? 'true' : 'false',
            n8n_webhook_url: settings.n8nWebhookUrl,
            whatsapp_number: settings.whatsappNumber,
            whatsapp_openai_model: settings.openaiModel,
            whatsapp_system_prompt: settings.systemPrompt,
            whatsapp_welcome_message: settings.welcomeMessage,
            whatsapp_transfer_message: settings.transferMessage,
            whatsapp_max_context: settings.maxContextMessages.toString(),
            whatsapp_response_delay: settings.responseDelay.toString()
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Sucesso', description: 'Configurações salvas!' });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao salvar configurações', variant: 'destructive' });
    }
    setSaving(false);
  };

  const testConnection = async () => {
    if (!settings.n8nWebhookUrl) {
      toast({ title: 'Erro', description: 'Configure a URL do webhook primeiro', variant: 'destructive' });
      return;
    }

    setTestingConnection(true);
    try {
      const response = await fetch(settings.n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true, source: 'balao-admin' })
      });

      if (response.ok) {
        toast({ title: 'Sucesso', description: 'Conexão com n8n funcionando!' });
      } else {
        throw new Error('Falha na resposta');
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível conectar ao n8n. Verifique a URL e se o workflow está ativo.', variant: 'destructive' });
    }
    setTestingConnection(false);
  };

  const toggleAgent = async () => {
    const newEnabled = !settings.enabled;
    setSettings(prev => ({ ...prev, enabled: newEnabled }));
    
    try {
      await fetch(`${API_BASE}/settings.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          key: 'whatsapp_agent_enabled',
          value: newEnabled ? 'true' : 'false'
        })
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
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
                  <h1 className="text-xl font-bold">Agente WhatsApp</h1>
                  <p className="text-sm text-gray-500">Gerenciar agente IA do WhatsApp</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Status Indicator */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${settings.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {settings.enabled ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span className="text-sm font-medium">{settings.enabled ? 'Ativo' : 'Inativo'}</span>
              </div>

              {/* Toggle Button */}
              <Button 
                onClick={toggleAgent}
                variant={settings.enabled ? 'destructive' : 'default'}
                className="gap-2"
              >
                {settings.enabled ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                {settings.enabled ? 'Desativar' : 'Ativar'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.messagesThisMonth}</p>
                  <p className="text-sm text-gray-500">Mensagens este mês</p>
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
                  <p className="text-2xl font-bold">{stats.conversationsActive}</p>
                  <p className="text-sm text-gray-500">Conversas ativas</p>
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
                  <p className="text-2xl font-bold">{stats.avgResponseTime}</p>
                  <p className="text-sm text-gray-500">Tempo médio resposta</p>
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
                  <p className="text-2xl font-bold">{stats.messagesTotal}</p>
                  <p className="text-sm text-gray-500">Total mensagens</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="connection" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="connection">Conexão</TabsTrigger>
            <TabsTrigger value="messages">Mensagens</TabsTrigger>
            <TabsTrigger value="behavior">Comportamento</TabsTrigger>
            <TabsTrigger value="advanced">Avançado</TabsTrigger>
          </TabsList>

          {/* Connection Tab */}
          <TabsContent value="connection">
            <Card>
              <CardHeader>
                <CardTitle>Conexão n8n</CardTitle>
                <CardDescription>Configure a integração com seu workflow n8n</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>URL do Webhook n8n</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://seu-n8n.app.n8n.cloud/webhook/..."
                      value={settings.n8nWebhookUrl}
                      onChange={(e) => setSettings(prev => ({ ...prev, n8nWebhookUrl: e.target.value }))}
                      className="flex-1"
                    />
                    <Button onClick={testConnection} disabled={testingConnection} variant="outline">
                      {testingConnection ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Testar'}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">A URL do webhook que recebe mensagens do WhatsApp</p>
                </div>

                <div className="space-y-2">
                  <Label>Número do WhatsApp</Label>
                  <Input
                    placeholder="5519981470446"
                    value={settings.whatsappNumber}
                    onChange={(e) => setSettings(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                  />
                  <p className="text-sm text-gray-500">Número conectado ao Evolution API / WhatsApp Business</p>
                </div>

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
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Mais rápido)</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o (Recomendado)</SelectItem>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <p className="text-sm text-gray-500">Primeira mensagem enviada ao iniciar conversa</p>
                </div>

                <div className="space-y-2">
                  <Label>Mensagem de Transferência</Label>
                  <Textarea
                    placeholder="Vou transferir você..."
                    value={settings.transferMessage}
                    onChange={(e) => setSettings(prev => ({ ...prev, transferMessage: e.target.value }))}
                    rows={3}
                  />
                  <p className="text-sm text-gray-500">Mensagem ao transferir para atendente humano</p>
                </div>
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
                  <Label>System Prompt (Personalidade)</Label>
                  <Textarea
                    placeholder="Você é o Lorenzo, assistente virtual da Balão da Informática..."
                    value={settings.systemPrompt}
                    onChange={(e) => setSettings(prev => ({ ...prev, systemPrompt: e.target.value }))}
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-gray-500">Instruções detalhadas para o comportamento da IA</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Avançadas</CardTitle>
                <CardDescription>Ajustes técnicos do agente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Mensagens no Contexto</Label>
                    <Input
                      type="number"
                      min={5}
                      max={50}
                      value={settings.maxContextMessages}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxContextMessages: parseInt(e.target.value) || 20 }))}
                    />
                    <p className="text-sm text-gray-500">Quantas mensagens anteriores manter na memória</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Delay de Resposta (ms)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={5000}
                      step={100}
                      value={settings.responseDelay}
                      onChange={(e) => setSettings(prev => ({ ...prev, responseDelay: parseInt(e.target.value) || 1000 }))}
                    />
                    <p className="text-sm text-gray-500">Tempo de espera antes de enviar resposta (simula digitação)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <Button onClick={saveSettings} disabled={saving} className="gap-2">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Configurações
          </Button>
        </div>
      </main>
    </div>
  );
};

export default WhatsAppAgent;

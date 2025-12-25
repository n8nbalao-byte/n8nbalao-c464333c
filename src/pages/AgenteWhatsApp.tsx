import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Upload, Power, PowerOff, Download, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AgenteWhatsApp() {
  const navigate = useNavigate();
  const { company, hasFeature } = useTenant();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [agentStatus, setAgentStatus] = useState<'online' | 'offline' | 'loading'>('offline');
  const [isUploading, setIsUploading] = useState(false);
  const [flowName, setFlowName] = useState('');

  // Verificar se tem acesso (Enterprise only)
  useEffect(() => {
    if (!hasFeature('n8n')) {
      toast.error('Recurso disponível apenas no plano Enterprise');
      navigate('/');
    }
  }, [hasFeature, navigate]);

  // Carregar status do agente
  useEffect(() => {
    checkAgentStatus();
  }, []);

  const checkAgentStatus = async () => {
    try {
      const vpsIp = company?.settings?.agent_vps_ip;
      const port = company?.settings?.agent_api_port || 3001;
      
      if (!vpsIp) {
        console.warn('IP da VPS não configurado');
        return;
      }

      const response = await fetch(`http://${vpsIp}:${port}/api/agent/status`);
      const data = await response.json();
      setAgentStatus(data.status === 'running' ? 'online' : 'offline');
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      setAgentStatus('offline');
    }
  };

  const toggleAgent = async () => {
    setAgentStatus('loading');
    
    try {
      const vpsIp = company?.settings?.agent_vps_ip;
      const port = company?.settings?.agent_api_port || 3001;
      
      if (!vpsIp) {
        toast.error('Configure o IP da VPS no painel Admin');
        setAgentStatus('offline');
        return;
      }

      const response = await fetch(`http://${vpsIp}:${port}/api/agent/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Falha ao alternar agente');

      const data = await response.json();
      setAgentStatus(data.status === 'running' ? 'online' : 'offline');
      toast.success(data.status === 'running' ? 'Agente iniciado!' : 'Agente parado!');
    } catch (error) {
      console.error('Erro ao alternar agente:', error);
      toast.error('Erro ao conectar com o agente');
      setAgentStatus('offline');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Por favor, selecione um arquivo JSON do n8n');
      return;
    }

    setIsUploading(true);

    try {
      const text = await file.text();
      const n8nData = JSON.parse(text);

      // Converter n8n workflow para React Flow
      const convertedNodes = convertN8nToReactFlow(n8nData);
      setNodes(convertedNodes.nodes);
      setEdges(convertedNodes.edges);
      setFlowName(n8nData.name || file.name.replace('.json', ''));

      toast.success('Fluxo carregado com sucesso!');
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast.error('Erro ao processar arquivo JSON');
    } finally {
      setIsUploading(false);
    }
  };

  const convertN8nToReactFlow = (n8nData: any) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Converter nodes do n8n
    if (n8nData.nodes) {
      n8nData.nodes.forEach((n8nNode: any, index: number) => {
        nodes.push({
          id: n8nNode.name || `node-${index}`,
          type: 'default',
          position: n8nNode.position ? { x: n8nNode.position[0], y: n8nNode.position[1] } : { x: index * 250, y: 100 },
          data: {
            label: (
              <div className="text-center">
                <div className="font-semibold">{n8nNode.name}</div>
                <div className="text-xs text-gray-500">{n8nNode.type}</div>
              </div>
            ),
          },
          style: {
            background: '#ffffff',
            border: '2px solid #E31C23',
            borderRadius: '8px',
            padding: '10px',
            minWidth: '150px',
          },
        });
      });
    }

    // Converter connections do n8n
    if (n8nData.connections) {
      Object.entries(n8nData.connections).forEach(([sourceName, connections]: [string, any]) => {
        if (connections.main && connections.main[0]) {
          connections.main[0].forEach((conn: any) => {
            edges.push({
              id: `${sourceName}-${conn.node}`,
              source: sourceName,
              target: conn.node,
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#E31C23' },
            });
          });
        }
      });
    }

    return { nodes, edges };
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const exportFlow = () => {
    const flowData = {
      name: flowName || 'workflow',
      nodes: nodes.map((node) => ({
        name: node.id,
        type: 'n8n-nodes-base.webhook',
        position: [node.position.x, node.position.y],
      })),
      connections: {},
    };

    const blob = new Blob([JSON.stringify(flowData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${flowName || 'workflow'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Fluxo exportado!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agente I.A WhatsApp</h1>
            <p className="text-gray-600 mt-1">Gerencie seu assistente virtual inteligente</p>
          </div>
          <Badge variant={agentStatus === 'online' ? 'default' : 'secondary'} className="text-lg px-4 py-2">
            {agentStatus === 'online' ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Online
              </>
            ) : agentStatus === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 mr-2" />
                Offline
              </>
            )}
          </Badge>
        </div>

        {/* Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Painel de Controle</CardTitle>
            <CardDescription>Ligue/desligue o agente e gerencie o fluxo de conversação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                {agentStatus === 'online' ? (
                  <Power className="w-8 h-8 text-green-500" />
                ) : (
                  <PowerOff className="w-8 h-8 text-gray-400" />
                )}
                <div>
                  <h3 className="font-semibold">Status do Agente</h3>
                  <p className="text-sm text-gray-600">
                    {agentStatus === 'online' ? 'Agente ativo e respondendo' : 'Agente desligado'}
                  </p>
                </div>
              </div>
              <Switch
                checked={agentStatus === 'online'}
                onCheckedChange={toggleAgent}
                disabled={agentStatus === 'loading'}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label htmlFor="upload-flow">
                <Button variant="outline" className="w-full" disabled={isUploading} asChild>
                  <div className="cursor-pointer">
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Importar Fluxo n8n
                  </div>
                </Button>
                <input
                  id="upload-flow"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              <Button variant="outline" onClick={exportFlow} disabled={nodes.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Exportar Fluxo
              </Button>

              <Button variant="outline" onClick={() => { setNodes([]); setEdges([]); setFlowName(''); }}>
                Limpar Canvas
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Flow Visualizer */}
        <Card>
          <CardHeader>
            <CardTitle>{flowName || 'Visualizador de Fluxo'}</CardTitle>
            <CardDescription>
              Visualize e edite o fluxo de conversação do seu agente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] border-2 border-gray-200 rounded-lg bg-white">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
              >
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                <Controls />
                <Panel position="top-right" className="bg-white p-2 rounded shadow-lg">
                  <div className="text-sm text-gray-600">
                    <div>Nodes: {nodes.length}</div>
                    <div>Conexões: {edges.length}</div>
                  </div>
                </Panel>
              </ReactFlow>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Como Usar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>1. <strong>Exporte seu workflow do n8n</strong> em formato JSON</p>
            <p>2. <strong>Importe o arquivo</strong> clicando em "Importar Fluxo n8n"</p>
            <p>3. <strong>Visualize o fluxo</strong> no canvas interativo</p>
            <p>4. <strong>Ligue o agente</strong> usando o switch no painel de controle</p>
            <p>5. <strong>Monitore o status</strong> em tempo real</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

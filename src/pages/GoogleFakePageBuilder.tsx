import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Wand2, 
  Globe, 
  Upload, 
  Eye, 
  Download, 
  Trash2, 
  Plus,
  Loader2,
  Image as ImageIcon,
  FileText,
  Settings,
  BarChart3,
  ArrowLeft,
  Copy,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { AdminLoginModal } from "@/components/AdminLoginModal";
import { checkAdminAuth } from "@/hooks/useAdminAuth";

const API_BASE = 'https://www.n8nbalao.com/api';

interface LandingPage {
  id: string;
  name: string;
  url: string;
  screenshot?: string;
  html?: string;
  seo?: {
    title: string;
    description: string;
    keywords: string[];
  };
  visits: number;
  createdAt: string;
  status: 'draft' | 'published';
}

const GoogleFakePageBuilder = () => {
  const navigate = useNavigate();
  const { company } = useCompany();
  const [activeTab, setActiveTab] = useState('create');
  const [isLoading, setIsLoading] = useState(false);
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  // Form states
  const [pageUrl, setPageUrl] = useState('');
  const [pageName, setPageName] = useState('');
  const [pageDescription, setPageDescription] = useState('');
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [screenshot, setScreenshot] = useState('');
  const [seoData, setSeoData] = useState<{ title: string; description: string; keywords: string[] } | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const isAuth = checkAdminAuth() || sessionStorage.getItem('admin_auth') === 'true';
    setIsAuthenticated(isAuth);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadLandingPages();
    }
  }, [isAuthenticated]);

  const loadLandingPages = async () => {
    try {
      const response = await fetch(`${API_BASE}/landing-builder.php?action=list`);
      if (response.ok) {
        const data = await response.json();
        setLandingPages(data.pages || []);
      }
    } catch (error) {
      console.error('Error loading pages:', error);
    }
  };

  const captureScreenshot = async () => {
    if (!pageUrl) {
      toast.error('Digite uma URL para capturar');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/screenshot.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: pageUrl })
      });

      const data = await response.json();
      if (data.success) {
        setScreenshot(data.screenshot);
        toast.success('Screenshot capturada com sucesso!');
      } else {
        toast.error(data.error || 'Erro ao capturar screenshot');
      }
    } catch (error) {
      toast.error('Erro ao capturar screenshot');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSEO = async () => {
    if (!pageName && !pageDescription) {
      toast.error('Preencha o nome ou descrição da página');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/seo-generator.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: pageName, 
          description: pageDescription,
          url: pageUrl 
        })
      });

      const data = await response.json();
      if (data.success) {
        setSeoData(data.seo);
        toast.success(data.fallback ? 'SEO gerado (fallback)' : 'SEO gerado com IA!');
      } else {
        console.error('SEO error:', data);
        toast.error(data.error || 'Erro ao gerar SEO');
      }
    } catch (error) {
      console.error('SEO generation error:', error);
      toast.error('Erro de conexão ao gerar SEO');
    } finally {
      setIsLoading(false);
    }
  };

  const generateLandingPage = async () => {
    if (!pageName) {
      toast.error('Digite um nome para a página');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/landing-builder.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          name: pageName,
          description: pageDescription,
          screenshot: screenshot,
          seo: seoData,
          companyName: company?.name,
          companyLogo: company?.logo
        })
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedHtml(data.html);
        setPreviewUrl(data.previewUrl);
        toast.success('Landing page gerada com sucesso!');
        setActiveTab('preview');
      } else {
        console.error('Landing page error:', data);
        toast.error(data.error || 'Erro ao gerar página');
      }
    } catch (error) {
      console.error('Landing page generation error:', error);
      toast.error('Erro de conexão ao gerar landing page');
    } finally {
      setIsLoading(false);
    }
  };

  const publishPage = async () => {
    if (!generatedHtml || !pageName) {
      toast.error('Gere uma página primeiro');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/landing-builder.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'publish',
          name: pageName,
          html: generatedHtml,
          seo: seoData,
          screenshot: screenshot
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Página publicada com sucesso!');
        loadLandingPages();
        setActiveTab('pages');
      } else {
        toast.error(data.error || 'Erro ao publicar página');
      }
    } catch (error) {
      toast.error('Erro ao publicar página');
    } finally {
      setIsLoading(false);
    }
  };

  const deletePage = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta página?')) return;

    try {
      const response = await fetch(`${API_BASE}/landing-builder.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Página excluída');
        loadLandingPages();
      } else {
        toast.error(data.error || 'Erro ao excluir');
      }
    } catch (error) {
      toast.error('Erro ao excluir página');
    }
  };

  const copyPageUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copiada!');
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('admin_auth', 'true');
  };

  // Show login modal if not authenticated
  if (!isAuthenticated) {
    return <AdminLoginModal onSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wand2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Google Fake Page Builder</h1>
                <p className="text-xs text-muted-foreground">Criador de Páginas Falsas com IA</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <BarChart3 className="h-3 w-3" />
              {landingPages.length} páginas
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="create" className="gap-2">
              <Plus className="h-4 w-4" />
              Criar
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="pages" className="gap-2">
              <FileText className="h-4 w-4" />
              Páginas
            </TabsTrigger>
          </TabsList>

          {/* Create Tab */}
          <TabsContent value="create" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left Column - Form */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Informações da Página
                    </CardTitle>
                    <CardDescription>
                      Preencha os dados ou importe de uma URL existente
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nome da Página</Label>
                      <Input
                        placeholder="Ex: Promoção Black Friday"
                        value={pageName}
                        onChange={(e) => setPageName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea
                        placeholder="Descreva o objetivo da landing page..."
                        value={pageDescription}
                        onChange={(e) => setPageDescription(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>URL para Inspiração (opcional)</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://exemplo.com"
                          value={pageUrl}
                          onChange={(e) => setPageUrl(e.target.value)}
                        />
                        <Button 
                          variant="outline" 
                          onClick={captureScreenshot}
                          disabled={isLoading || !pageUrl}
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      SEO Automático
                    </CardTitle>
                    <CardDescription>
                      Gere títulos, descrições e keywords com IA
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      onClick={generateSEO} 
                      disabled={isLoading || (!pageName && !pageDescription)}
                      className="w-full gap-2"
                      variant="outline"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                      Gerar SEO com IA
                    </Button>

                    {seoData && (
                      <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                        <div>
                          <Label className="text-xs text-muted-foreground">Título SEO</Label>
                          <p className="text-sm font-medium">{seoData.title}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Meta Description</Label>
                          <p className="text-sm">{seoData.description}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Keywords</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {seoData.keywords.map((kw, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Button 
                  onClick={generateLandingPage}
                  disabled={isLoading || !pageName}
                  className="w-full gap-2"
                  size="lg"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
                  Gerar Landing Page
                </Button>
              </div>

              {/* Right Column - Screenshot Preview */}
              <div className="space-y-4">
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Screenshot de Referência
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {screenshot ? (
                      <div className="relative group">
                        <img 
                          src={screenshot} 
                          alt="Screenshot" 
                          className="w-full rounded-lg border"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setScreenshot('')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
                        <p className="text-sm">Nenhuma screenshot capturada</p>
                        <p className="text-xs">Digite uma URL e clique no botão de captura</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Preview da Landing Page</CardTitle>
                  <CardDescription>Visualize e publique sua página</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setActiveTab('create')}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button onClick={publishPage} disabled={isLoading || !generatedHtml}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                    Publicar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {generatedHtml ? (
                  <div className="border rounded-lg overflow-hidden">
                    <iframe
                      srcDoc={generatedHtml}
                      className="w-full h-[600px]"
                      title="Landing Page Preview"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center text-muted-foreground">
                    <Eye className="h-12 w-12 mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma página gerada ainda</p>
                    <p className="text-xs">Vá para a aba Criar e gere uma landing page</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pages Tab */}
          <TabsContent value="pages" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {landingPages.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Nenhuma página criada ainda</p>
                    <Button 
                      variant="link" 
                      onClick={() => setActiveTab('create')}
                      className="mt-2"
                    >
                      Criar primeira página
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                landingPages.map((page) => (
                  <Card key={page.id} className="overflow-hidden group">
                    <div className="aspect-video bg-muted relative">
                      {page.screenshot ? (
                        <img 
                          src={page.screenshot} 
                          alt={page.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => copyPageUrl(page.url)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="secondary" asChild>
                          <a href={page.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deletePage(page.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold truncate">{page.name}</h3>
                        <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
                          {page.status === 'published' ? 'Publicada' : 'Rascunho'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{page.visits} visitas</span>
                        <span>{new Date(page.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default GoogleFakePageBuilder;

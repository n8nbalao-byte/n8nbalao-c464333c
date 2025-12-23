import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Send,
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  Sparkles,
  ShoppingBag,
  Plus,
  Trash2,
  Search,
  Wand2,
  Monitor,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { api, Customer, Product } from "@/lib/api";
import { useCompany } from "@/contexts/CompanyContext";

const API_BASE = "https://www.n8nbalao.com/api";

// --- Interfaces ---
interface UploadedContact {
  name: string;
  email: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  // O template aceita {{ai_content}} para o texto gerado e {{product_showcase}} para o card do produto
  htmlStructure: string;
  color: string;
  icon: any;
}

// --- Helper: Formatação de Moeda ---
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

// --- Helper: Gerador de HTML de Produto (Visual Card) ---
const generateProductCardHtml = (product: Product, color: string) => {
  const image = product.media?.[0]?.url || "https://placehold.co/400x300?text=Sem+Imagem";
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px; margin-bottom: 20px;">
      <tr>
        <td align="center">
          <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; max-width: 350px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="padding: 20px; background-color: #f9fafb; text-align: center;">
              <img src="${image}" alt="${product.title}" style="max-width: 100%; height: 180px; object-fit: contain; display: block; margin: 0 auto;">
            </div>
            <div style="padding: 20px; text-align: center;">
              <h3 style="margin: 0 0 10px 0; color: #111827; font-size: 16px; line-height: 1.4; font-weight: 700;">${product.title}</h3>
              <p style="margin: 0 0 20px 0; color: #dc2626; font-size: 24px; font-weight: 800;">${formatCurrency(product.totalPrice || 0)}</p>
              <a href="https://www.n8nbalao.com/produto/${product.id}" style="background-color: ${color}; color: #ffffff; padding: 12px 30px; border-radius: 50px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 14px;">COMPRAR AGORA</a>
            </div>
          </div>
        </td>
      </tr>
    </table>
  `;
};

// --- Templates ---
const getTemplates = (companyName: string): EmailTemplate[] => [
  {
    id: "oferta_relampago",
    name: "🔥 Oferta Relâmpago",
    subject: `🔥 Oferta Exclusiva: {{product_name}}`,
    color: "#dc2626",
    icon: Sparkles,
    htmlStructure: `<!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${companyName}</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">OFERTA ESPECIAL PARA VOCÊ</p>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #374151; margin-top: 0;">Olá, {{primeiro_nome}}!</h2>
          
          <div style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            {{ai_content}}
          </div>
          {{product_showcase}}

          <div style="text-align: center; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            <p style="color: #9ca3af; font-size: 12px;">Oferta válida enquanto durarem os estoques.</p>
          </div>
        </div>
      </div>
    </body></html>`,
  },
  {
    id: "lancamento",
    name: "🚀 Lançamento Tech",
    subject: `🚀 Conheça o novo {{product_name}}!`,
    color: "#2563eb",
    icon: Monitor,
    htmlStructure: `<!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #111827;">
      <div style="max-width: 600px; margin: 0 auto; background: #1f2937; color: #ffffff; border: 1px solid #374151;">
        <div style="padding: 30px; text-align: center; border-bottom: 1px solid #374151;">
          <h2 style="color: #60a5fa; margin: 0;">${companyName}</h2>
        </div>
        <div style="padding: 40px;">
          <h1 style="margin: 0 0 20px 0; font-size: 26px;">Novidade na Área! ⚡</h1>
          
          <div style="color: #d1d5db; font-size: 16px; line-height: 1.7; margin-bottom: 30px;">
            {{ai_content}}
          </div>
          {{product_showcase}}

        </div>
        <div style="background: #111827; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>© 2024 ${companyName} - Tecnologia de Ponta</p>
        </div>
      </div>
    </body></html>`,
  },
  {
    id: "minimalista",
    name: "✨ Clean & Direto",
    subject: `Você precisa ver isso: {{product_name}}`,
    color: "#000000",
    icon: Wand2,
    htmlStructure: `<!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #ffffff;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <span style="font-weight: bold; font-size: 20px; letter-spacing: 2px;">${companyName.toUpperCase()}</span>
        </div>
        
        <p style="font-size: 18px; color: #000;">Olá, {{primeiro_nome}}.</p>
        
        <div style="color: #333; font-size: 16px; line-height: 1.8; margin-bottom: 30px;">
          {{ai_content}}
        </div>
        {{product_showcase}}

        <div style="margin-top: 50px; text-align: center;">
          <a href="https://www.n8nbalao.com" style="color: #666; text-decoration: none; font-size: 12px; border-bottom: 1px solid #ddd;">Visitar Loja</a>
        </div>
      </div>
    </body></html>`,
  },
];

const EmailMarketing = () => {
  const navigate = useNavigate();
  const { company } = useCompany();
  const companyName = company?.name || "Balão da Informática";

  // State: Dados
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // State: Seleções do Usuário
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("oferta_relampago");

  // State: Conteúdo Gerado
  const [emailSubject, setEmailSubject] = useState("");
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [aiText, setAiText] = useState(""); // O texto cru gerado pela IA

  // State: UI/Loading
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [activeTab, setActiveTab] = useState("audience");

  // Inicialização
  useEffect(() => {
    loadData();
  }, []);

  // Quando mudar template ou produto ou texto da IA, atualizar o preview
  useEffect(() => {
    updatePreview();
  }, [selectedTemplateId, selectedProduct, aiText, emailSubject]);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const [custData, prodData, hardwareData] = await Promise.all([
        api.getCustomers(),
        api.getProducts(),
        api.getHardware(),
      ]);

      const validCustomers = custData.filter((c: any) => c.email && c.email.includes("@"));
      setCustomers(validCustomers);

      // Normalizar Hardware para o formato de Product
      const hardwareAsProducts: Product[] = hardwareData.map((h: any) => ({
        id: String(h.id),
        title: `${h.brand || ""} ${h.model || ""} ${h.name || ""}`.trim(),
        subtitle: "",
        description: "",
        categories: [String(h.category || "hardware")],
        media: h.image ? [{ type: "image", url: String(h.image) }] : [],
        specs: (h.specs && typeof h.specs === "object") ? h.specs : {},
        components: {},
        totalPrice: Number(h.price || 0),
        createdAt: String(h.createdAt || new Date().toISOString()),
        productType: "hardware",
        downloadUrl: "",
      }));

      setProducts([...prodData, ...hardwareAsProducts]);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoadingData(false);
    }
  };

  // --- Lógica de IA ---
  const generateEmailWithAI = async () => {
    if (!selectedProduct) {
      toast.error("Selecione um produto primeiro!");
      return;
    }

    setIsGenerating(true);
    const template = getTemplates(companyName).find((t) => t.id === selectedTemplateId);

    const productCategory =
      selectedProduct.categories?.[0] || selectedProduct.productType || "Tecnologia";

    // Prompt focado em Vendas
    const prompt = `
      Atue como um copywriter expert em tecnologia e e-commerce.
      Escreva um email curto, persuasivo e empolgante para vender o seguinte produto:
      
      Produto: ${selectedProduct.title}
      Preço: R$ ${selectedProduct.totalPrice}
      Categoria: ${productCategory}
      
      O tom deve ser: ${template?.id === "minimalista" ? "Sofisticado e direto" : "Urgente e promocional"}.
      
      Estrutura da resposta (JSON):
      {
        "subject": "Uma linha de assunto chamativa (use emojis se apropriado)",
        "body": "Dois ou três parágrafos curtos em HTML (tags <p>, <strong>, etc) destacando os benefícios do produto e criando desejo. NÃO inclua 'Olá [nome]', pois isso já está no template. Foque apenas no corpo da mensagem sobre o produto."
      }
    `;

    try {
      const response = await fetch(`${API_BASE}/chat-ai.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });

      const data = await response.json();
      let content = data.response;

      // Tentar extrair JSON se a IA mandou texto em volta
      try {
        if (content.includes("```json")) {
          content = content.split("```json")[1].split("```")[0];
        } else if (content.includes("{")) {
          const first = content.indexOf("{");
          const last = content.lastIndexOf("}");
          content = content.substring(first, last + 1);
        }

        const jsonContent = JSON.parse(content);
        setAiText(jsonContent.body);

        // Atualiza o assunto, mas permite edição
        let subject = jsonContent.subject;
        if (subject.includes("{{product_name}}")) {
          subject = subject.replace("{{product_name}}", selectedProduct.title);
        }
        setEmailSubject(subject);

        toast.success("Email criado com sucesso!");
        setActiveTab("preview"); // Vai para preview
      } catch (e) {
        // Fallback se não vier JSON
        setAiText(`<p>${content}</p>`);
        setEmailSubject(`Oferta Especial: ${selectedProduct.title}`);
      }
    } catch (error) {
      toast.error("Erro ao gerar com IA");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Montagem do Email ---
  const updatePreview = () => {
    const template = getTemplates(companyName).find((t) => t.id === selectedTemplateId);
    if (!template) return;

    let html = template.htmlStructure;

    // 1. Injeta Texto da IA
    // Se não tiver gerado ainda, coloca um placeholder
    const content =
      aiText ||
      `<p>Selecione um produto e clique em "Gerar com IA" para criar uma mensagem personalizada incrível.</p>`;
    html = html.replace("{{ai_content}}", content);

    // 2. Injeta Card do Produto
    if (selectedProduct) {
      const productCard = generateProductCardHtml(selectedProduct, template.color);
      html = html.replace("{{product_showcase}}", productCard);

      // Atualiza assunto se não tiver sido sobrescrito pela IA
      if (!emailSubject && template.subject.includes("{{product_name}}")) {
        setEmailSubject(template.subject.replace("{{product_name}}", selectedProduct.title));
      }
    } else {
      html = html.replace("{{product_showcase}}", "");
    }

    setGeneratedHtml(html);
  };

  // --- Envio ---
  const handleSend = async () => {
    if (selectedEmails.length === 0) return toast.error("Selecione destinatários");
    if (!emailSubject) return toast.error("Defina um assunto");

    setIsSending(true);
    let successCount = 0;

    for (const email of selectedEmails) {
      try {
        const customer = customers.find((c) => c.email === email);
        const name = customer?.name || "Cliente";
        const firstName = name.split(" ")[0];

        // Personalização final por cliente
        let finalHtml = generatedHtml.replace(/\{\{nome\}\}/g, name).replace(/\{\{primeiro_nome\}\}/g, firstName);

        await fetch(`${API_BASE}/send-email.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: email,
            subject: emailSubject,
            html: finalHtml,
            fromName: companyName,
          }),
        });
        successCount++;
      } catch (err) {
        console.error(err);
      }
    }

    setIsSending(false);
    toast.success(`${successCount} emails enviados!`);
  };

  // --- Renderização ---

  const filteredProducts = products
    .filter((p) => p.title.toLowerCase().includes(productSearch.toLowerCase()))
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Criador de Campanhas AI</h1>
            <p className="text-xs text-gray-500">Selecione o produto, a IA escreve o resto.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">{selectedEmails.length} clientes selecionados</span>
        </div>
      </div>

      <div className="flex-1 container mx-auto p-6 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col gap-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="audience">1. Público ({selectedEmails.length})</TabsTrigger>
            <TabsTrigger value="content">2. Produto & Conteúdo</TabsTrigger>
            <TabsTrigger value="preview" disabled={!selectedProduct}>
              3. Preview & Envio
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: AUDIENCIA */}
          <TabsContent value="audience" className="flex-1 bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" /> Selecione os Clientes
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedEmails.length === customers.length) setSelectedEmails([]);
                  else setSelectedEmails(customers.map((c) => c.email));
                }}
              >
                {selectedEmails.length === customers.length ? "Desmarcar Todos" : "Selecionar Todos"}
              </Button>
            </div>

            {isLoadingData ? (
              <div className="flex justify-center p-10">
                <Loader2 className="animate-spin" />
              </div>
            ) : (
              <ScrollArea className="h-[500px] border rounded-md p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {customers.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        if (selectedEmails.includes(c.email))
                          setSelectedEmails((prev) => prev.filter((e) => e !== c.email));
                        else setSelectedEmails((prev) => [...prev, c.email]);
                      }}
                    >
                      <Checkbox checked={selectedEmails.includes(c.email)} />
                      <div className="overflow-hidden">
                        <p className="font-medium truncate">{c.name}</p>
                        <p className="text-xs text-gray-500 truncate">{c.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setActiveTab("content")}>
                Próximo: Escolher Produto <ArrowLeft className="ml-2 w-4 h-4 rotate-180" />
              </Button>
            </div>
          </TabsContent>

          {/* TAB 2: CONTEÚDO */}
          <TabsContent value="content" className="flex-1 gap-6 grid grid-cols-1 lg:grid-cols-2">
            {/* Coluna Esquerda: Seleção */}
            <div className="space-y-6">
              {/* Seleção de Template */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-semibold text-sm uppercase text-gray-500">1. Escolha o Estilo (Template)</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {getTemplates(companyName).map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTemplateId(t.id)}
                        className={`cursor-pointer rounded-lg border p-3 flex flex-col items-center gap-2 text-center transition-all ${selectedTemplateId === t.id ? "ring-2 ring-primary border-primary bg-primary/5" : "hover:bg-gray-50"}`}
                      >
                        <div className="p-2 rounded-full" style={{ backgroundColor: t.color + "20", color: t.color }}>
                          <t.icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold">{t.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Seleção de Produto */}
              <Card className="flex-1 flex flex-col">
                <CardContent className="p-4 space-y-4 flex-1">
                  <h3 className="font-semibold text-sm uppercase text-gray-500">2. Escolha o Produto Principal</h3>

                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar produto ou hardware..."
                      className="pl-8"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>

                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-2">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => setSelectedProduct(product)}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedProduct?.id === product.id ? "border-primary bg-blue-50" : "hover:bg-gray-50"}`}
                        >
                          <img
                            src={
                              product.media?.[0]?.url ||
                              "[https://via.placeholder.com/40](https://via.placeholder.com/40)"
                            }
                            className="w-10 h-10 rounded object-cover bg-white"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{product.title}</p>
                            <p className="text-xs text-primary font-bold">
                              R$ {product.totalPrice?.toLocaleString("pt-BR")}
                            </p>
                          </div>
                          {selectedProduct?.id === product.id && <CheckCircle className="h-5 w-5 text-primary" />}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                disabled={!selectedProduct || isGenerating}
                onClick={generateEmailWithAI}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Criando Copywriting...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    {aiText ? "Regenerar Email com IA" : "Gerar Email com IA"}
                  </>
                )}
              </Button>
            </div>

            {/* Coluna Direita: Editor Manual (Opcional) */}
            <Card className="h-full flex flex-col">
              <CardContent className="p-4 flex-1 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm uppercase text-gray-500">Ajustes Manuais</h3>
                  <Badge variant={aiText ? "secondary" : "outline"}>
                    {aiText ? "Conteúdo Gerado" : "Aguardando Geração"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium">Assunto do Email</label>
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Assunto será gerado pela IA..."
                  />
                </div>

                <div className="space-y-2 flex-1 flex flex-col">
                  <label className="text-xs font-medium">Corpo do Email (HTML permitida)</label>
                  <Textarea
                    className="flex-1 font-mono text-xs resize-none"
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    placeholder="O texto gerado pela IA aparecerá aqui. Você pode editar se quiser."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: PREVIEW & ENVIAR */}
          <TabsContent
            value="preview"
            className="flex-1 bg-white p-6 rounded-lg border shadow-sm flex flex-col lg:flex-row gap-6"
          >
            <div className="flex-1 border rounded-xl overflow-hidden bg-gray-100 flex flex-col">
              <div className="bg-gray-800 text-white p-2 text-xs flex justify-between items-center">
                <span>Preview Mobile / Desktop</span>
                <span>{emailSubject}</span>
              </div>
              <div className="flex-1 relative">
                <iframe srcDoc={generatedHtml} className="w-full h-full absolute inset-0 bg-white" title="Preview" />
              </div>
            </div>

            <div className="w-full lg:w-80 space-y-6">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-bold text-lg">Resumo do Envio</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Destinatários:</span>
                      <span className="font-bold">{selectedEmails.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Produto:</span>
                      <span className="font-bold truncate w-32 text-right">{selectedProduct?.title || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Template:</span>
                      <span className="font-bold">{selectedTemplateId}</span>
                    </div>
                  </div>

                  <hr />

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSend}
                    disabled={isSending || selectedEmails.length === 0}
                  >
                    {isSending ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 h-4 w-4" />}
                    {isSending ? "Enviando..." : "Enviar Campanha Agora"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EmailMarketing;

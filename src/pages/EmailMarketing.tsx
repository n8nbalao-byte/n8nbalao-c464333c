import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Send, Users, CheckCircle, XCircle, Loader2, Clock, Image, Calendar, Sparkles, AlertCircle, Upload, Package, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { api, Customer, Product } from '@/lib/api';
import { useCompany } from '@/contexts/CompanyContext';

const API_BASE = 'https://www.n8nbalao.com/api';

interface UploadedContact {
  name: string;
  email: string;
}

// Function to create personalized HTML with customer name
const personalizeHtml = (html: string, customerName: string): string => {
  const firstName = customerName.split(' ')[0];
  return html
    .replace(/\{\{nome\}\}/g, customerName)
    .replace(/\{\{primeiro_nome\}\}/g, firstName)
    .replace(/\{\{empresa\}\}/g, 'Balão da Informática')
    .replace(/Olá!/g, `Olá, ${firstName}!`)
    .replace(/Olá,!/g, `Olá, ${firstName}!`);
};

// Email templates with dynamic logo support
const createEmailTemplates = (companyName: string) => [
  {
    id: 'promocao',
    name: '🔥 Promoção Especial',
    subject: `🔥 Oferta Imperdível - ${companyName}`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); border-radius: 20px 20px 0 0; padding: 40px; text-align: center;">
      <h2 style="color: white; margin-bottom: 20px;">${companyName}</h2>
      <h1 style="color: white; margin: 0; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">🔥 PROMOÇÃO ESPECIAL 🔥</h1>
    </div>
    <div style="background: white; padding: 40px; border-radius: 0 0 20px 20px;">
      <h2 style="color: #dc2626; margin-top: 0;">Olá, {{primeiro_nome}}!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">Temos uma oferta exclusiva para você! Aproveite descontos incríveis em toda nossa linha de produtos.</p>
      <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #dc2626;">
        <p style="margin: 0; color: #991b1b; font-weight: bold; font-size: 24px;">Até 40% OFF</p>
        <p style="margin: 5px 0 0 0; color: #7f1d1d;">Em produtos selecionados!</p>
      </div>
      <!-- PRODUCTS_PLACEHOLDER -->
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://www.n8nbalao.com" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4);">VER OFERTAS</a>
      </div>
    </div>
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
      <p>${companyName} - Seu parceiro em tecnologia</p>
      <p>Para não receber mais emails, responda com "CANCELAR"</p>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'novidades',
    name: '✨ Novidades',
    subject: `✨ Novidades Chegaram! - ${companyName}`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 30px; text-align: center;">
        <h2 style="color: white; margin: 0;">${companyName}</h2>
      </div>
      <div style="padding: 40px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <span style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #78350f; padding: 8px 20px; border-radius: 50px; font-size: 14px; font-weight: bold;">✨ NOVIDADES</span>
        </div>
        <h1 style="color: #111827; text-align: center; margin: 0 0 20px 0; font-size: 28px;">Olá, {{primeiro_nome}}!</h1>
        <p style="color: #6b7280; text-align: center; font-size: 16px; line-height: 1.6;">Confira as últimas novidades em hardware, periféricos e acessórios que acabaram de chegar em nossa loja.</p>
        <!-- PRODUCTS_PLACEHOLDER -->
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://www.n8nbalao.com" style="display: inline-block; background: #dc2626; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold;">Conferir Novidades</a>
        </div>
      </div>
    </div>
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
      <p>© 2024 ${companyName}</p>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'boasvindas',
    name: '👋 Boas-vindas',
    subject: `👋 Bem-vindo à ${companyName}!`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: linear-gradient(180deg, #fef2f2 0%, #ffffff 100%);">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(220, 38, 38, 0.15);">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 50px 30px; text-align: center;">
        <h2 style="color: white; margin: 0; font-size: 36px;">Bem-vindo, {{primeiro_nome}}! 🎈</h2>
      </div>
      <div style="padding: 40px;">
        <p style="color: #374151; font-size: 18px; line-height: 1.7;">É um prazer ter você conosco, {{nome}}!</p>
        <p style="color: #6b7280; font-size: 16px; line-height: 1.7;">Na ${companyName}, você encontra os melhores produtos de tecnologia, PCs montados sob medida e um atendimento que faz a diferença.</p>
        <div style="background: #fef2f2; border-radius: 16px; padding: 25px; margin: 25px 0;">
          <h3 style="color: #dc2626; margin: 0 0 15px 0;">O que você pode fazer:</h3>
          <ul style="color: #374151; margin: 0; padding-left: 20px; line-height: 2;">
            <li>🖥️ Montar seu PC personalizado</li>
            <li>🛒 Comprar hardware de qualidade</li>
            <li>🤖 Automatizar processos com IA</li>
          </ul>
        </div>
        <!-- PRODUCTS_PLACEHOLDER -->
        <div style="text-align: center;">
          <a href="https://www.n8nbalao.com" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 16px 45px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px;">Explorar Agora</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'newsletter',
    name: '📰 Newsletter',
    subject: `📰 Newsletter Semanal - ${companyName}`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: #111827;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(180deg, #1f2937 0%, #111827 100%); border-radius: 20px; border: 1px solid #374151;">
      <div style="padding: 30px; border-bottom: 1px solid #374151; text-align: center;">
        <h2 style="color: white; margin: 0;">${companyName}</h2>
      </div>
      <div style="padding: 40px;">
        <h1 style="color: white; margin: 0 0 20px 0; font-size: 28px;">📰 Olá, {{primeiro_nome}}!</h1>
        <p style="color: #9ca3af; font-size: 16px; line-height: 1.7;">Fique por dentro das últimas novidades do mundo da tecnologia e ofertas exclusivas.</p>
        
        <div style="background: #1f2937; border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 3px solid #dc2626;">
          <h3 style="color: #dc2626; margin: 0 0 10px 0;">🔥 Destaque da Semana</h3>
          <p style="color: #d1d5db; margin: 0;">Novos processadores e placas de vídeo com preços especiais!</p>
        </div>
        
        <!-- PRODUCTS_PLACEHOLDER -->
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://www.n8nbalao.com" style="display: inline-block; background: #dc2626; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold;">Ver Todas as Ofertas</a>
        </div>
      </div>
      <div style="padding: 20px; border-top: 1px solid #374151; text-align: center;">
        <p style="color: #6b7280; margin: 0; font-size: 12px;">© 2024 ${companyName} | Tecnologia ao seu alcance</p>
      </div>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'monteseupc',
    name: '🖥️ Monte seu PC',
    subject: `🖥️ Monte o PC dos Seus Sonhos! - ${companyName}`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px; text-align: center;">
        <h2 style="color: white; margin: 0 0 15px 0;">${companyName}</h2>
        <div style="font-size: 50px; margin-bottom: 15px;">🖥️</div>
        <h1 style="color: white; margin: 0; font-size: 28px;">Monte seu PC ideal!</h1>
      </div>
      <div style="padding: 40px;">
        <h2 style="color: #1e293b; text-align: center; margin: 0 0 20px 0;">Olá, {{primeiro_nome}}!</h2>
        <p style="color: #475569; text-align: center; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">Personalize cada componente do seu computador e tenha a máquina perfeita para suas necessidades.</p>
        
        <div style="background: #f1f5f9; border-radius: 16px; padding: 25px; margin: 20px 0;">
          <div style="color: #334155; margin-bottom: 12px; font-size: 15px;">✅ Processadores Intel e AMD</div>
          <div style="color: #334155; margin-bottom: 12px; font-size: 15px;">✅ Placas de Vídeo NVIDIA e AMD</div>
          <div style="color: #334155; margin-bottom: 12px; font-size: 15px;">✅ Memórias DDR4 e DDR5</div>
          <div style="color: #334155; font-size: 15px;">✅ SSDs NVMe de alta velocidade</div>
        </div>
        
        <!-- PRODUCTS_PLACEHOLDER -->
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://www.n8nbalao.com/monte-voce-mesmo" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 16px 45px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 6px 20px rgba(220, 38, 38, 0.35);">MONTAR MEU PC</a>
        </div>
      </div>
      <div style="padding: 20px; text-align: center; background: #f8fafc; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; margin: 0; font-size: 12px;">${companyName} - O melhor em tecnologia</p>
      </div>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'blackfriday',
    name: '🖤 Black Friday',
    subject: `🖤 BLACK FRIDAY - Descontos IMPERDÍVEIS! - ${companyName}`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: #000;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #000 0%, #1a1a1a 100%); border-radius: 20px; border: 2px solid #fbbf24; overflow: hidden;">
      <div style="padding: 40px; text-align: center; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);">
        <h1 style="color: #000; margin: 0; font-size: 42px; font-weight: 900;">BLACK FRIDAY</h1>
        <p style="color: #000; font-size: 20px; margin: 10px 0 0 0;">ATÉ 70% OFF</p>
      </div>
      <div style="padding: 40px; text-align: center;">
        <h2 style="color: #fbbf24; margin: 0 0 20px 0;">{{primeiro_nome}}, você não pode perder!</h2>
        <p style="color: #9ca3af; font-size: 16px; line-height: 1.6;">Os maiores descontos do ano estão aqui. Corra porque é por tempo limitado!</p>
        
        <!-- PRODUCTS_PLACEHOLDER -->
        
        <div style="margin-top: 30px;">
          <a href="https://www.n8nbalao.com" style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #000; padding: 16px 45px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px;">APROVEITAR AGORA</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'frete_gratis',
    name: '🚚 Frete Grátis',
    subject: `🚚 FRETE GRÁTIS para você! - ${companyName}`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: #f0fdf4;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 40px; text-align: center;">
        <div style="font-size: 50px; margin-bottom: 10px;">🚚</div>
        <h1 style="color: white; margin: 0; font-size: 32px;">FRETE GRÁTIS!</h1>
      </div>
      <div style="padding: 40px; text-align: center;">
        <h2 style="color: #16a34a; margin: 0 0 20px 0;">Olá, {{primeiro_nome}}!</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Temos uma surpresa especial: FRETE GRÁTIS em todas as compras acima de R$ 300!</p>
        
        <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin: 25px 0; border: 2px dashed #16a34a;">
          <p style="margin: 0; color: #15803d; font-weight: bold; font-size: 20px;">Use o cupom: FRETEGRATIS</p>
        </div>
        
        <!-- PRODUCTS_PLACEHOLDER -->
        
        <div style="margin-top: 30px;">
          <a href="https://www.n8nbalao.com" style="display: inline-block; background: #16a34a; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold;">COMPRAR AGORA</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
  }
];

// Generate product HTML block
const generateProductsHtml = (products: Product[]): string => {
  if (products.length === 0) return '';
  
  let html = `<div style="margin: 30px 0;">
    <h3 style="color: #374151; margin: 0 0 20px 0; text-align: center;">Produtos em Destaque</h3>
    <div style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center;">`;
  
  products.forEach(product => {
    const imageUrl = product.media?.[0]?.url || 'https://via.placeholder.com/150';
    const price = product.totalPrice || 0;
    
    html += `
      <div style="background: #f9fafb; border-radius: 12px; padding: 15px; width: 160px; text-align: center; border: 1px solid #e5e7eb;">
        <img src="${imageUrl}" alt="${product.title}" style="width: 100%; height: 100px; object-fit: contain; border-radius: 8px; margin-bottom: 10px;">
        <p style="margin: 0; font-size: 13px; color: #374151; font-weight: 600; line-height: 1.3;">${product.title.substring(0, 40)}${product.title.length > 40 ? '...' : ''}</p>
        <p style="margin: 8px 0 0 0; color: #dc2626; font-weight: bold; font-size: 16px;">R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        <a href="https://www.n8nbalao.com/produto/${product.id}" style="display: inline-block; margin-top: 10px; background: #dc2626; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: 600;">Ver Produto</a>
      </div>`;
  });
  
  html += `</div></div>`;
  return html;
};

const EmailMarketing = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const { company } = useCompany();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [uploadedContacts, setUploadedContacts] = useState<UploadedContact[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState<{ email: string; success: boolean }[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  
  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  
  // AI state
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  
  // Scheduling
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleDay, setScheduleDay] = useState('1');
  const [scheduleTime, setScheduleTime] = useState('09:00');

  const companyName = company?.name || 'Balão da Informática';
  const emailTemplates = createEmailTemplates(companyName);

  useEffect(() => {
    Promise.all([fetchCustomers(), fetchProducts()]);
  }, []);

  const fetchCustomers = async () => {
    try {
      const data = await api.getCustomers();
      const customersWithEmail = data.filter((c: Customer) => c.email && c.email.includes('@'));
      setCustomers(customersWithEmail);
      setSelectedEmails(customersWithEmail.map((c: Customer) => c.email));
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await api.getProducts();
      // Get ALL products and hardware
      const hardwareData = await api.getHardware();
      // Convert hardware to product-like format for search
      const hardwareAsProducts = hardwareData.map(h => ({
        id: h.id,
        title: `${h.brand || ''} ${h.model || ''} ${h.name || ''}`.trim(),
        subtitle: h.category,
        totalPrice: h.price || 0,
        media: h.image ? [{ url: h.image, type: 'image' as const }] : [],
        categories: [h.category],
        productType: 'hardware',
        specs: {} as Record<string, string>,
        components: null,
        createdAt: ''
      })) as Product[];
      setProducts([...data, ...hardwareAsProducts]);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const contacts: UploadedContact[] = [];
      
      // Skip header if present
      const startIndex = lines[0].toLowerCase().includes('nome') || lines[0].toLowerCase().includes('email') ? 1 : 0;
      
      for (let i = startIndex; i < lines.length; i++) {
        const parts = lines[i].split(/[,;\t]/);
        if (parts.length >= 2) {
          const name = parts[0].trim().replace(/"/g, '');
          const email = parts[1].trim().replace(/"/g, '');
          if (email.includes('@')) {
            contacts.push({ name, email });
          }
        }
      }
      
      setUploadedContacts(contacts);
      setSelectedEmails(prev => [...prev, ...contacts.map(c => c.email)]);
      toast.success(`${contacts.length} contatos importados`);
    };
    reader.readAsText(file);
  };

  const toggleEmail = (email: string) => {
    setSelectedEmails(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const toggleAll = () => {
    const allEmails = [...customers.map(c => c.email), ...uploadedContacts.map(c => c.email)];
    if (selectedEmails.length === allEmails.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(allEmails);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      let html = template.html;
      // Insert products if selected
      if (selectedProducts.length > 0) {
        html = html.replace('<!-- PRODUCTS_PLACEHOLDER -->', generateProductsHtml(selectedProducts));
      } else {
        html = html.replace('<!-- PRODUCTS_PLACEHOLDER -->', '');
      }
      setHtmlContent(html);
    }
  };

  const addProduct = (product: Product) => {
    if (selectedProducts.find(p => p.id === product.id)) {
      toast.error('Produto já selecionado');
      return;
    }
    setSelectedProducts(prev => [...prev, product]);
    toast.success('Produto adicionado');
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

  const updateHtmlWithProducts = () => {
    if (!htmlContent) return;
    
    let html = htmlContent;
    // Remove existing products section
    html = html.replace(/<div style="margin: 30px 0;">[\s\S]*?Produtos em Destaque[\s\S]*?<\/div>\s*<\/div>/g, '<!-- PRODUCTS_PLACEHOLDER -->');
    
    // Add new products
    if (selectedProducts.length > 0) {
      html = html.replace('<!-- PRODUCTS_PLACEHOLDER -->', generateProductsHtml(selectedProducts));
    }
    setHtmlContent(html);
    toast.success('Produtos atualizados no email');
  };

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Digite uma descrição para a IA');
      return;
    }
    
    setGeneratingAI(true);
    try {
      const response = await fetch(`${API_BASE}/chat-ai.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Você é um especialista em email marketing. Crie um email profissional e persuasivo em HTML para a empresa "${companyName}". 
          
O email deve:
- Usar cores vermelho (#dc2626) e branco como cores principais
- Ter design responsivo e moderno
- Incluir placeholder {{primeiro_nome}} para personalização
- Ter call-to-action claro

Tema/Objetivo: ${aiPrompt}

Retorne APENAS o código HTML do email, sem explicações.`,
        })
      });
      
      const data = await response.json();
      if (data.response) {
        // Extract HTML from response
        let html = data.response;
        if (html.includes('```html')) {
          html = html.split('```html')[1].split('```')[0];
        } else if (html.includes('```')) {
          html = html.split('```')[1].split('```')[0];
        }
        setHtmlContent(html.trim());
        toast.success('Email gerado com IA!');
      }
    } catch (error) {
      console.error('Error generating with AI:', error);
      toast.error('Erro ao gerar com IA');
    } finally {
      setGeneratingAI(false);
    }
  };

  const sendEmails = async () => {
    if (selectedEmails.length === 0) {
      toast.error('Selecione pelo menos um email');
      return;
    }
    if (!subject.trim()) {
      toast.error('Digite o assunto do email');
      return;
    }
    if (!htmlContent.trim()) {
      toast.error('Digite o conteúdo do email');
      return;
    }

    setSending(true);
    setSendResults([]);
    const results: { email: string; success: boolean }[] = [];

    // Get all contacts (customers + uploaded)
    const allContacts = [
      ...customers.map(c => ({ email: c.email, name: c.name })),
      ...uploadedContacts
    ];

    for (const email of selectedEmails) {
      try {
        const contact = allContacts.find(c => c.email === email);
        const customerName = contact?.name || 'Cliente';
        const personalizedHtml = personalizeHtml(htmlContent, customerName);

        const response = await fetch(`${API_BASE}/send-email.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            subject: subject,
            html: personalizedHtml,
            fromName: companyName
          })
        });

        const data = await response.json();
        results.push({ email, success: response.ok && data.success });
      } catch (error) {
        console.error(`Error sending to ${email}:`, error);
        results.push({ email, success: false });
      }
    }

    setSendResults(results);
    setSending(false);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    if (successCount > 0) {
      toast.success(`${successCount} email(s) enviado(s) com sucesso!`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} email(s) falharam`);
    }
  };

  const saveSchedule = () => {
    const schedule = {
      enabled: scheduleEnabled,
      day: scheduleDay,
      time: scheduleTime,
      emails: selectedEmails,
      subject,
      html: htmlContent
    };
    localStorage.setItem('emailSchedule', JSON.stringify(schedule));
    toast.success('Agendamento salvo!');
  };

  const dayNames: Record<string, string> = {
    '0': 'Domingo',
    '1': 'Segunda-feira',
    '2': 'Terça-feira',
    '3': 'Quarta-feira',
    '4': 'Quinta-feira',
    '5': 'Sexta-feira',
    '6': 'Sábado'
  };

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 10);

  const allContacts = [...customers.map(c => ({ ...c, source: 'db' })), ...uploadedContacts.map(c => ({ ...c, id: c.email, source: 'csv' }))];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar ao Admin
          </Button>
          <div className="flex items-center gap-2">
            <Mail className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Email Marketing</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Top Row: Clients and Compose */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left: Customer List */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Contatos ({allContacts.length})
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={toggleAll}>
                  {selectedEmails.length === allContacts.length ? 'Desmarcar' : 'Todos'}
                </Button>
              </div>
            </div>

            {/* CSV Upload */}
            <div className="mb-4 p-3 bg-secondary/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Importar lista externa (CSV: nome, email)</p>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleCSVUpload}
                className="hidden"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => csvInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importar CSV
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : allContacts.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">
                Nenhum contato disponível
              </p>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {allContacts.map((contact) => {
                  const result = sendResults.find(r => r.email === contact.email);
                  return (
                    <div 
                      key={contact.email} 
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                        selectedEmails.includes(contact.email) 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:bg-accent/50'
                      }`}
                      onClick={() => toggleEmail(contact.email)}
                    >
                      <Checkbox
                        checked={selectedEmails.includes(contact.email)}
                        onCheckedChange={() => toggleEmail(contact.email)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{contact.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                      </div>
                      {contact.source === 'csv' && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">CSV</span>
                      )}
                      {result && (
                        result.success 
                          ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                <strong>{selectedEmails.length}</strong> selecionado(s)
              </p>
            </div>
          </div>

          {/* Right: Email Composer */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Send className="w-5 h-5" />
              Compor Email
            </h2>

            <div className="space-y-4">
              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Template</label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {emailTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Produtos no Email
                </label>
                
                {selectedProducts.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedProducts.map(p => (
                      <div key={p.id} className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                        {p.title.substring(0, 20)}...
                        <button onClick={() => removeProduct(p.id)} className="hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <Button size="sm" variant="outline" onClick={updateHtmlWithProducts}>
                      Atualizar Email
                    </Button>
                  </div>
                )}
                
                <Input
                  placeholder="Buscar produto..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="mb-2"
                />
                {productSearch && (
                  <div className="max-h-32 overflow-y-auto border rounded-lg">
                    {filteredProducts.map(p => (
                      <button
                        key={p.id}
                        onClick={() => addProduct(p)}
                        className="w-full text-left px-3 py-2 hover:bg-accent text-sm border-b last:border-0"
                      >
                        {p.title} - R$ {(p.totalPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Assunto</label>
                <Input
                  placeholder="Ex: Novidades da loja!"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              {/* AI Generation */}
              <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-200">
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Gerar com IA
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Descreva o email que deseja..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                  />
                  <Button 
                    onClick={generateWithAI} 
                    disabled={generatingAI}
                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    {generatingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Preview and Send */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Pré-visualização do Email
          </h2>
          
          {htmlContent ? (
            <>
              {selectedEmails.length > 0 && (
                <div className="mb-4">
                  <label className="text-xs text-muted-foreground">Visualizando como:</label>
                  <p className="text-sm font-medium">
                    {allContacts.find(c => c.email === selectedEmails[0])?.name || 'Cliente'}
                  </p>
                </div>
              )}
              
              <div 
                className="bg-white rounded-lg overflow-hidden max-h-[500px] overflow-y-auto border mb-6"
                dangerouslySetInnerHTML={{ 
                  __html: personalizeHtml(
                    htmlContent, 
                    allContacts.find(c => c.email === selectedEmails[0])?.name || 'Cliente'
                  ) 
                }}
              />

              <Button 
                onClick={sendEmails} 
                disabled={sending || selectedEmails.length === 0}
                className="w-full"
                size="lg"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Enviar para {selectedEmails.length} contato(s)
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-center">
              <p>Selecione um template ou gere com IA para visualizar o email</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailMarketing;
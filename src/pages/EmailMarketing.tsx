import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Send, Users, CheckCircle, XCircle, Loader2, Clock, Image, Calendar, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { api, Customer } from '@/lib/api';

const API_BASE = 'https://www.n8nbalao.com/api';

// Logo Balão em base64 (pequeno placeholder vermelho com B)
const BALAO_LOGO_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjYwIiB2aWV3Qm94PSIwIDAgMjAwIDYwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjYwIiByeD0iMTAiIGZpbGw9IiNEQzI2MjYiLz4KPHRleHQgeD0iMTAwIiB5PSI0MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPvCfjoggQmFsw6NvPC90ZXh0Pgo8L3N2Zz4=';

// Convert image to base64 for embedding in email
const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Function to create personalized HTML with customer name
const personalizeHtml = (html: string, customerName: string): string => {
  const firstName = customerName.split(' ')[0];
  return html
    .replace(/\{\{nome\}\}/g, customerName)
    .replace(/\{\{primeiro_nome\}\}/g, firstName)
    .replace(/Olá!/g, `Olá, ${firstName}!`)
    .replace(/Olá,!/g, `Olá, ${firstName}!`);
};

// Email templates with Balão branding - using {{nome}} and {{primeiro_nome}} placeholders
const createEmailTemplates = (logoBase64: string) => [
  {
    id: 'promocao',
    name: '🔥 Promoção Especial',
    subject: '🔥 Oferta Imperdível - Balão da Informática',
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); border-radius: 20px 20px 0 0; padding: 40px; text-align: center;">
      <img src="${logoBase64}" alt="Balão da Informática" style="height: 60px; margin-bottom: 20px;">
      <h1 style="color: white; margin: 0; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">🔥 PROMOÇÃO ESPECIAL 🔥</h1>
    </div>
    <div style="background: white; padding: 40px; border-radius: 0 0 20px 20px;">
      <h2 style="color: #dc2626; margin-top: 0;">Olá, {{primeiro_nome}}!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">Temos uma oferta exclusiva para você! Aproveite descontos incríveis em toda nossa linha de produtos.</p>
      <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #dc2626;">
        <p style="margin: 0; color: #991b1b; font-weight: bold; font-size: 24px;">Até 40% OFF</p>
        <p style="margin: 5px 0 0 0; color: #7f1d1d;">Em produtos selecionados!</p>
      </div>
      <a href="https://www.n8nbalao.com" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4);">VER OFERTAS</a>
    </div>
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
      <p>Balão da Informática - Seu parceiro em tecnologia</p>
      <p>Para não receber mais emails, responda com "CANCELAR"</p>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'novidades',
    name: '✨ Novidades',
    subject: '✨ Novidades Chegaram! - Balão da Informática',
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
        <img src="${logoBase64}" alt="Balão" style="height: 50px;">
      </div>
      <div style="padding: 40px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <span style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #78350f; padding: 8px 20px; border-radius: 50px; font-size: 14px; font-weight: bold;">✨ NOVIDADES</span>
        </div>
        <h1 style="color: #111827; text-align: center; margin: 0 0 20px 0; font-size: 28px;">Olá, {{primeiro_nome}}!</h1>
        <p style="color: #6b7280; text-align: center; font-size: 16px; line-height: 1.6;">Confira as últimas novidades em hardware, periféricos e acessórios que acabaram de chegar em nossa loja.</p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://www.n8nbalao.com" style="display: inline-block; background: #dc2626; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold;">Conferir Novidades</a>
        </div>
      </div>
    </div>
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
      <p>© 2024 Balão da Informática</p>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'boasvindas',
    name: '👋 Boas-vindas',
    subject: '👋 Bem-vindo à Balão da Informática!',
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
        <img src="${logoBase64}" alt="Balão" style="height: 70px; margin-bottom: 20px;">
        <h1 style="color: white; margin: 0; font-size: 36px;">Bem-vindo, {{primeiro_nome}}! 🎈</h1>
      </div>
      <div style="padding: 40px;">
        <p style="color: #374151; font-size: 18px; line-height: 1.7;">É um prazer ter você conosco, {{nome}}!</p>
        <p style="color: #6b7280; font-size: 16px; line-height: 1.7;">Na Balão da Informática, você encontra os melhores produtos de tecnologia, PCs montados sob medida e um atendimento que faz a diferença.</p>
        <div style="background: #fef2f2; border-radius: 16px; padding: 25px; margin: 25px 0;">
          <h3 style="color: #dc2626; margin: 0 0 15px 0;">O que você pode fazer:</h3>
          <ul style="color: #374151; margin: 0; padding-left: 20px; line-height: 2;">
            <li>🖥️ Montar seu PC personalizado</li>
            <li>🛒 Comprar hardware de qualidade</li>
            <li>🤖 Automatizar processos com n8n</li>
          </ul>
        </div>
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
    subject: '📰 Newsletter Semanal - Balão da Informática',
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
        <img src="${logoBase64}" alt="Balão" style="height: 40px;">
      </div>
      <div style="padding: 40px;">
        <h1 style="color: white; margin: 0 0 20px 0; font-size: 28px;">📰 Olá, {{primeiro_nome}}!</h1>
        <p style="color: #9ca3af; font-size: 16px; line-height: 1.7;">Fique por dentro das últimas novidades do mundo da tecnologia e ofertas exclusivas.</p>
        
        <div style="background: #1f2937; border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 3px solid #dc2626;">
          <h3 style="color: #dc2626; margin: 0 0 10px 0;">🔥 Destaque da Semana</h3>
          <p style="color: #d1d5db; margin: 0;">Novos processadores e placas de vídeo com preços especiais!</p>
        </div>
        
        <div style="background: #1f2937; border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 3px solid #10b981;">
          <h3 style="color: #10b981; margin: 0 0 10px 0;">💡 Dica Tech</h3>
          <p style="color: #d1d5db; margin: 0;">Saiba como escolher a memória RAM ideal para seu PC.</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://www.n8nbalao.com" style="display: inline-block; background: #dc2626; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold;">Ver Todas as Ofertas</a>
        </div>
      </div>
      <div style="padding: 20px; border-top: 1px solid #374151; text-align: center;">
        <p style="color: #6b7280; margin: 0; font-size: 12px;">© 2024 Balão da Informática | Tecnologia ao seu alcance</p>
      </div>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'monteseupc',
    name: '🖥️ Monte seu PC',
    subject: '🖥️ Monte o PC dos Seus Sonhos! - Balão da Informática',
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: rgba(255,255,255,0.05); border-radius: 24px; border: 1px solid rgba(255,255,255,0.1);">
      <div style="padding: 40px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <img src="${logoBase64}" alt="Balão" style="height: 60px;">
      </div>
      <div style="padding: 40px; text-align: center;">
        <div style="font-size: 60px; margin-bottom: 20px;">🖥️</div>
        <h1 style="color: white; margin: 0 0 15px 0; font-size: 32px;">{{primeiro_nome}}, monte seu PC ideal!</h1>
        <p style="color: #a5b4fc; font-size: 18px; margin: 0 0 30px 0;">Personalize cada componente do seu computador</p>
        
        <div style="display: inline-block; text-align: left; background: rgba(255,255,255,0.05); border-radius: 16px; padding: 25px; margin: 20px 0;">
          <div style="color: white; margin-bottom: 15px;">✅ Processadores Intel e AMD</div>
          <div style="color: white; margin-bottom: 15px;">✅ Placas de Vídeo NVIDIA e AMD</div>
          <div style="color: white; margin-bottom: 15px;">✅ Memórias DDR4 e DDR5</div>
          <div style="color: white;">✅ SSDs NVMe de alta velocidade</div>
        </div>
        
        <div style="margin-top: 30px;">
          <a href="https://www.n8nbalao.com" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 18px 50px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; box-shadow: 0 10px 30px rgba(220, 38, 38, 0.4);">MONTAR MEU PC</a>
        </div>
      </div>
      <div style="padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
        <p style="color: #6b7280; margin: 0; font-size: 12px;">Balão da Informática - O melhor em tecnologia</p>
      </div>
    </div>
  </div>
</body>
</html>`
  }
];

const EmailMarketing = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState<{ email: string; success: boolean }[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [attachedImages, setAttachedImages] = useState<{ name: string; base64: string }[]>([]);
  const [useTestMode, setUseTestMode] = useState(true); // Use Resend sandbox by default
  
  // Scheduling
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleDay, setScheduleDay] = useState('1');
  const [scheduleTime, setScheduleTime] = useState('09:00');

  const emailTemplates = createEmailTemplates(BALAO_LOGO_BASE64);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const data = await api.getCustomers();
      const customersWithEmail = data.filter((c: Customer) => c.email && c.email.includes('@'));
      setCustomers(customersWithEmail);
      // Automatically select all customers for email marketing
      setSelectedEmails(customersWithEmail.map((c: Customer) => c.email));
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const toggleEmail = (email: string) => {
    setSelectedEmails(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const toggleAll = () => {
    if (selectedEmails.length === customers.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(customers.map(c => c.email));
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setHtmlContent(template.html);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: { name: string; base64: string }[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const base64 = await imageToBase64(file);
        newImages.push({ name: file.name, base64 });
      }
    }

    setAttachedImages(prev => [...prev, ...newImages]);
    toast.success(`${newImages.length} imagem(ns) anexada(s)`);
  };

  const insertImageInHtml = (imageBase64: string) => {
    const imgTag = `<img src="${imageBase64}" alt="Imagem" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;">`;
    setHtmlContent(prev => prev.replace('</body>', `${imgTag}</body>`));
    toast.success('Imagem inserida no email');
  };

  const removeImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
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

    // From address - use sandbox for testing or verified domain for production
    const fromAddress = useTestMode 
      ? 'Balão da Informática <onboarding@resend.dev>'
      : 'Balão da Informática <marketing@n8nbalao.com.br>';

    for (const email of selectedEmails) {
      try {
        // Find customer to get their name
        const customer = customers.find(c => c.email === email);
        const customerName = customer?.name || 'Cliente';
        
        // Personalize HTML with customer name
        const personalizedHtml = personalizeHtml(htmlContent, customerName);

        const response = await fetch(`${API_BASE}/send-notification.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            subject: subject,
            html: personalizedHtml,
            from: fromAddress
          })
        });

        const data = await response.json();
        console.log(`Email to ${email}:`, data);
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
        {/* Info Alert */}
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">Modo de Teste Ativo</p>
            <p>Usando <code className="bg-amber-100 px-1 rounded">onboarding@resend.dev</code> como remetente. Para usar seu domínio próprio, verifique-o em <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="underline">resend.com/domains</a> e desative o modo teste.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Customer List */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Clientes ({customers.length})
              </h2>
              <Button variant="outline" size="sm" onClick={toggleAll}>
                {selectedEmails.length === customers.length ? 'Desmarcar' : 'Todos'}
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : customers.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">
                Nenhum cliente cadastrado
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {customers.map((customer) => {
                  const result = sendResults.find(r => r.email === customer.email);
                  return (
                    <div 
                      key={customer.id} 
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                        selectedEmails.includes(customer.email) 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:bg-accent/50'
                      }`}
                      onClick={() => toggleEmail(customer.email)}
                    >
                      <Checkbox
                        checked={selectedEmails.includes(customer.email)}
                        onCheckedChange={() => toggleEmail(customer.email)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{customer.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                      </div>
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

            {/* Test Mode Toggle */}
            <div className="mt-4 pt-4 border-t border-border">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox 
                  checked={useTestMode} 
                  onCheckedChange={(checked) => setUseTestMode(!!checked)}
                />
                <span className="text-sm">Modo Teste (Resend Sandbox)</span>
              </label>
            </div>

            {/* Schedule Section */}
            <div className="mt-4 pt-4 border-t border-border">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4" />
                Agendamento Semanal
              </h3>
              
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox 
                    checked={scheduleEnabled} 
                    onCheckedChange={(checked) => setScheduleEnabled(!!checked)}
                  />
                  <span className="text-sm">Ativar envio automático</span>
                </label>

                {scheduleEnabled && (
                  <>
                    <div>
                      <label className="text-xs text-muted-foreground">Dia da semana</label>
                      <Select value={scheduleDay} onValueChange={setScheduleDay}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(dayNames).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground">Horário</label>
                      <Input 
                        type="time" 
                        value={scheduleTime} 
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <Button onClick={saveSchedule} variant="outline" size="sm" className="w-full">
                      <Calendar className="w-4 h-4 mr-2" />
                      Salvar Agendamento
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Center: Email Composer */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Send className="w-5 h-5" />
              Compor Email
            </h2>

            <div className="space-y-4">
              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Template
                </label>
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
                <p className="text-xs text-muted-foreground mt-1">
                  Use <code className="bg-muted px-1 rounded">{"{{nome}}"}</code> ou <code className="bg-muted px-1 rounded">{"{{primeiro_nome}}"}</code> para personalizar
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Assunto</label>
                <Input
                  placeholder="Ex: Novidades da Balão da Informática!"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Imagens
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Image className="w-4 h-4 mr-2" />
                  Anexar Imagens
                </Button>
                
                {attachedImages.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {attachedImages.map((img, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-accent/50 rounded text-sm">
                        <img src={img.base64} alt={img.name} className="w-10 h-10 object-cover rounded" />
                        <span className="flex-1 truncate text-xs">{img.name}</span>
                        <Button size="sm" variant="ghost" onClick={() => insertImageInHtml(img.base64)}>
                          Inserir
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => removeImage(idx)}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Conteúdo HTML</label>
                <Textarea
                  placeholder="Cole aqui o HTML do seu email..."
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  rows={8}
                  className="font-mono text-xs"
                />
              </div>

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
                    Enviar ({selectedEmails.length})
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Pré-visualização</h2>
            
            {/* Preview customer selector */}
            {selectedEmails.length > 0 && (
              <div className="mb-4">
                <label className="text-xs text-muted-foreground">Visualizando como:</label>
                <p className="text-sm font-medium">
                  {customers.find(c => c.email === selectedEmails[0])?.name || 'Cliente'}
                </p>
              </div>
            )}
            
            {htmlContent ? (
              <div 
                className="bg-white rounded-lg overflow-hidden max-h-[600px] overflow-y-auto border"
                dangerouslySetInnerHTML={{ 
                  __html: personalizeHtml(
                    htmlContent, 
                    customers.find(c => c.email === selectedEmails[0])?.name || 'Cliente'
                  ) 
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-center">
                <p>Selecione um template ou digite o HTML</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailMarketing;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Send, Users, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { api, Customer } from '@/lib/api';

const API_BASE = 'https://www.n8nbalao.com.br/api';

const EmailMarketing = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState<{ email: string; success: boolean }[]>([]);

  useEffect(() => {
    // Check admin auth
    const isAdmin = sessionStorage.getItem('adminLoggedIn');
    if (!isAdmin) {
      navigate('/admin');
      return;
    }
    fetchCustomers();
  }, [navigate]);

  const fetchCustomers = async () => {
    try {
      const data = await api.getCustomers();
      // Filter customers with valid emails
      const customersWithEmail = data.filter((c: Customer) => c.email && c.email.includes('@'));
      setCustomers(customersWithEmail);
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

    for (const email of selectedEmails) {
      try {
        const response = await fetch(`${API_BASE}/send-notification.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            subject: subject,
            html: htmlContent,
            from: 'N8N Balão Marketing <marketing@n8nbalao.com.br>'
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

  const defaultTemplate = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .footer { background: #1a1a1a; color: #888; padding: 20px; text-align: center; font-size: 12px; }
    .btn { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎈 Balão da Informática</h1>
    </div>
    <div class="content">
      <h2>Olá!</h2>
      <p>Temos novidades incríveis para você!</p>
      <p>Confira nossos produtos e monte o PC dos seus sonhos.</p>
      <a href="https://www.n8nbalao.com.br" class="btn">Ver Produtos</a>
    </div>
    <div class="footer">
      <p>Balão da Informática - Seu parceiro em tecnologia</p>
      <p>Para não receber mais emails, responda com "CANCELAR"</p>
    </div>
  </div>
</body>
</html>
  `.trim();

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Customer List */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Clientes ({customers.length})
              </h2>
              <Button variant="outline" size="sm" onClick={toggleAll}>
                {selectedEmails.length === customers.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : customers.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">
                Nenhum cliente com email cadastrado
              </p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {customers.map((customer) => {
                  const result = sendResults.find(r => r.email === customer.email);
                  return (
                    <div 
                      key={customer.id} 
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        selectedEmails.includes(customer.email) 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:bg-accent/50'
                      }`}
                    >
                      <Checkbox
                        checked={selectedEmails.includes(customer.email)}
                        onCheckedChange={() => toggleEmail(customer.email)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{customer.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
                      </div>
                      {result && (
                        result.success 
                          ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                <strong>{selectedEmails.length}</strong> email(s) selecionado(s)
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
              <div>
                <label className="block text-sm font-medium mb-2">Assunto</label>
                <Input
                  placeholder="Ex: Novidades da Balão da Informática!"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Conteúdo HTML
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="ml-2 text-xs"
                    onClick={() => setHtmlContent(defaultTemplate)}
                  >
                    Usar Template Padrão
                  </Button>
                </label>
                <Textarea
                  placeholder="Cole aqui o HTML do seu email..."
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  rows={15}
                  className="font-mono text-sm"
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
                    Enviar para {selectedEmails.length} Email(s)
                  </>
                )}
              </Button>
            </div>

            {/* Preview */}
            {htmlContent && (
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="text-sm font-medium mb-2">Pré-visualização</h3>
                <div 
                  className="bg-white rounded-lg overflow-hidden max-h-[300px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailMarketing;

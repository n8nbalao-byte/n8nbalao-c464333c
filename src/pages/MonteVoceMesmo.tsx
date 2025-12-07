import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { api, type HardwareItem, type CompanyData } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Cpu, CircuitBoard, MemoryStick, HardDrive, Monitor, Zap, Box, Droplets, Check, Printer, ShoppingCart, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const componentSteps = [
  { key: 'processor', label: 'Processador', icon: Cpu },
  { key: 'motherboard', label: 'Placa-Mãe', icon: CircuitBoard },
  { key: 'memory', label: 'Memória RAM', icon: MemoryStick },
  { key: 'storage', label: 'Armazenamento', icon: HardDrive },
  { key: 'gpu', label: 'Placa de Vídeo', icon: Monitor },
  { key: 'watercooler', label: 'Watercooler', icon: Droplets },
  { key: 'psu', label: 'Fonte', icon: Zap },
  { key: 'case', label: 'Gabinete', icon: Box },
] as const;

type ComponentKey = typeof componentSteps[number]['key'];

interface SelectedComponents {
  [key: string]: HardwareItem | null;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

// Compatibility helper functions
function getFormFactorHierarchy(formFactor: string): number {
  const hierarchy: Record<string, number> = {
    'E-ATX': 4,
    'ATX': 3,
    'Micro-ATX': 2,
    'Mini-ITX': 1,
  };
  return hierarchy[formFactor] || 0;
}

function isFormFactorCompatible(caseFormFactor: string, motherboardFormFactor: string): boolean {
  // Larger cases can fit smaller motherboards
  return getFormFactorHierarchy(caseFormFactor) >= getFormFactorHierarchy(motherboardFormFactor);
}

function checkCompatibility(
  item: HardwareItem,
  category: string,
  selectedComponents: SelectedComponents
): { compatible: boolean; issues: string[] } {
  const issues: string[] = [];
  
  const selectedProcessor = selectedComponents['processor'];
  const selectedMotherboard = selectedComponents['motherboard'];
  
  // Motherboard compatibility check (socket must match processor)
  if (category === 'motherboard' && selectedProcessor) {
    if (item.socket && selectedProcessor.socket && item.socket !== selectedProcessor.socket) {
      issues.push(`Socket incompatível: ${item.socket} ≠ ${selectedProcessor.socket} (processador)`);
    }
  }
  
  // Memory compatibility check (DDR type must match motherboard)
  if (category === 'memory' && selectedMotherboard) {
    if (item.memoryType && selectedMotherboard.memoryType && item.memoryType !== selectedMotherboard.memoryType) {
      issues.push(`Tipo incompatível: ${item.memoryType} ≠ ${selectedMotherboard.memoryType} (placa-mãe)`);
    }
  }
  
  // Watercooler compatibility check (socket must match processor)
  if (category === 'watercooler' && selectedProcessor) {
    if (item.socket && selectedProcessor.socket && item.socket !== selectedProcessor.socket) {
      issues.push(`Socket incompatível: ${item.socket} ≠ ${selectedProcessor.socket} (processador)`);
    }
  }
  
  // Case compatibility check (form factor must fit motherboard)
  if (category === 'case' && selectedMotherboard) {
    if (item.formFactor && selectedMotherboard.formFactor) {
      if (!isFormFactorCompatible(item.formFactor, selectedMotherboard.formFactor)) {
        issues.push(`Gabinete ${item.formFactor} não suporta placa-mãe ${selectedMotherboard.formFactor}`);
      }
    }
  }
  
  return {
    compatible: issues.length === 0,
    issues
  };
}

export default function MonteVoceMesmo() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [hardware, setHardware] = useState<Record<string, HardwareItem[]>>({});
  const [selectedComponents, setSelectedComponents] = useState<SelectedComponents>({});
  const [loading, setLoading] = useState(true);
  const [showQuote, setShowQuote] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    cnpj: '',
    seller: '',
    logo: ''
  });
  const quoteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [hardwareData, company] = await Promise.all([
        Promise.all(componentSteps.map(step => api.getHardware(step.key))),
        api.getCompany()
      ]);
      
      const hardwareByCategory: Record<string, HardwareItem[]> = {};
      componentSteps.forEach((step, i) => {
        hardwareByCategory[step.key] = hardwareData[i].sort((a, b) => a.price - b.price);
      });
      setHardware(hardwareByCategory);
      setCompanyData(company);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar dados", variant: "destructive" });
    }
    setLoading(false);
  }

  function selectComponent(item: HardwareItem) {
    const currentKey = componentSteps[currentStep].key;
    setSelectedComponents(prev => ({ ...prev, [currentKey]: item }));
  }

  function goToNextStep() {
    if (currentStep < componentSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }

  function goToPreviousStep() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }

  function calculateTotal(): number {
    return Object.values(selectedComponents).reduce((sum, item) => {
      return sum + (item?.price || 0);
    }, 0);
  }

  function isStepComplete(stepIndex: number): boolean {
    const key = componentSteps[stepIndex].key;
    return !!selectedComponents[key];
  }

  function allStepsComplete(): boolean {
    return componentSteps.every((step) => !!selectedComponents[step.key]);
  }

  function generateQuote() {
    if (!allStepsComplete()) {
      toast({ title: "Atenção", description: "Selecione todos os componentes antes de gerar o orçamento", variant: "destructive" });
      return;
    }
    setShowQuote(true);
  }

  function printQuote() {
    const printContent = quoteRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Orçamento - ${companyData.name || 'Orçamento'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
            .quote-container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .logo-title { font-size: 28px; font-weight: bold; color: #3b82f6; margin-bottom: 10px; }
            .store-info { font-size: 12px; color: #666; line-height: 1.6; }
            .quote-title { font-size: 24px; font-weight: bold; margin: 20px 0; text-align: center; }
            .quote-date { text-align: right; font-size: 14px; color: #666; margin-bottom: 20px; }
            .components-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .components-table th { background: #3b82f6; color: white; padding: 12px; text-align: left; }
            .components-table td { padding: 12px; border-bottom: 1px solid #ddd; }
            .components-table tr:nth-child(even) { background: #f8f9fa; }
            .total-row { background: #e0f2fe !important; font-weight: bold; font-size: 18px; }
            .validity { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .validity strong { color: #d97706; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            .thank-you { font-size: 16px; font-weight: bold; color: #3b82f6; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  function handleBuy() {
    toast({ 
      title: "Pedido Enviado!", 
      description: "Em breve entraremos em contato para finalizar sua compra.",
    });
  }

  const currentStepData = componentSteps[currentStep];
  const currentHardwareAll = hardware[currentStepData?.key] || [];
  
  // Filter out incompatible items - they won't appear in the list
  const currentHardware = currentHardwareAll.filter(item => {
    const compatibility = checkCompatibility(item, currentStepData?.key || '', selectedComponents);
    return compatibility.compatible;
  });
  
  const selectedItem = selectedComponents[currentStepData?.key];
  const emissionDate = new Date();
  const validityDate = new Date(emissionDate);
  validityDate.setDate(validityDate.getDate() + 7);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (showQuote) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <Button variant="outline" onClick={() => setShowQuote(false)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={printQuote}>
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir Orçamento
                </Button>
                <Button onClick={handleBuy} className="bg-green-600 hover:bg-green-700">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Comprar
                </Button>
              </div>
            </div>

            {/* Quote Content */}
            <Card className="p-8 bg-white text-gray-800" ref={quoteRef}>
              <div className="quote-container">
                {/* Header */}
                <div className="header text-center border-b-4 border-primary pb-6 mb-8">
                  {companyData.logo && (
                    <img src={companyData.logo} alt="Logo" className="h-16 mx-auto mb-4 object-contain" />
                  )}
                  <div className="logo-title text-3xl font-bold text-primary mb-2">
                    {companyData.name || 'Empresa'}
                  </div>
                  <div className="store-info text-sm text-muted-foreground space-y-1">
                    {(companyData.address || companyData.city) && (
                      <p>{companyData.address}{companyData.address && companyData.city && ' - '}{companyData.city}</p>
                    )}
                    {(companyData.phone || companyData.email) && (
                      <p>
                        {companyData.phone && `Tel: ${companyData.phone}`}
                        {companyData.phone && companyData.email && ' | '}
                        {companyData.email && `Email: ${companyData.email}`}
                      </p>
                    )}
                    {companyData.cnpj && <p>CNPJ: {companyData.cnpj}</p>}
                    {companyData.seller && <p>Vendedor: {companyData.seller}</p>}
                  </div>
                </div>

                {/* Quote Title */}
                <h2 className="quote-title text-2xl font-bold text-center mb-4">
                  ORÇAMENTO DE COMPUTADOR
                </h2>

                {/* Date */}
                <div className="quote-date text-right text-sm text-muted-foreground mb-6">
                  Data de Emissão: {formatDate(emissionDate)}
                </div>

                {/* Components Table */}
                <table className="components-table w-full border-collapse mb-6">
                  <thead>
                    <tr>
                      <th className="bg-primary text-primary-foreground p-3 text-left">Componente</th>
                      <th className="bg-primary text-primary-foreground p-3 text-left">Descrição</th>
                      <th className="bg-primary text-primary-foreground p-3 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {componentSteps.map((step) => {
                      const item = selectedComponents[step.key];
                      if (!item) return null;
                      return (
                        <tr key={step.key} className="border-b border-border">
                          <td className="p-3 font-medium">{step.label}</td>
                          <td className="p-3">{item.brand} {item.model}</td>
                          <td className="p-3 text-right">{formatPrice(item.price)}</td>
                        </tr>
                      );
                    })}
                    <tr className="total-row bg-primary/10 font-bold text-lg">
                      <td className="p-4" colSpan={2}>TOTAL</td>
                      <td className="p-4 text-right text-primary">{formatPrice(calculateTotal())}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Validity */}
                <div className="validity bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center mb-8">
                  <p>
                    <strong className="text-yellow-700">⚠️ Validade do Orçamento:</strong>{" "}
                    <span className="font-semibold">{formatDate(validityDate)}</span> (7 dias após a emissão)
                  </p>
                </div>

                {/* Footer */}
                <div className="footer text-center pt-6 border-t border-border">
                  <p className="thank-you text-lg font-bold text-primary mb-2">
                    Obrigado pela preferência!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Para confirmar seu pedido, entre em contato conosco através dos canais acima.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    * Os preços podem sofrer alterações sem aviso prévio após o prazo de validade.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-8">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Monte Você Mesmo</h1>
            <p className="text-muted-foreground">Selecione os componentes para montar seu PC personalizado</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-8 overflow-x-auto pb-2">
            {componentSteps.map((step, index) => {
              const Icon = step.icon;
              const isComplete = isStepComplete(index);
              const isCurrent = index === currentStep;
              return (
                <button
                  key={step.key}
                  onClick={() => setCurrentStep(index)}
                  className={`flex flex-col items-center p-3 rounded-lg transition-all min-w-[80px] ${
                    isCurrent 
                      ? 'bg-primary text-primary-foreground scale-105' 
                      : isComplete 
                        ? 'bg-green-500/20 text-green-600' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <div className="relative">
                    <Icon className="h-6 w-6" />
                    {isComplete && !isCurrent && (
                      <Check className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 text-white rounded-full p-0.5" />
                    )}
                  </div>
                  <span className="text-xs mt-1 font-medium whitespace-nowrap">{step.label}</span>
                </button>
              );
            })}
          </div>

          {/* Current Step Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {currentStepData && (
                <>
                  <currentStepData.icon className="h-8 w-8 text-primary" />
                  <div>
                    <h2 className="text-xl font-bold">
                      Passo {currentStep + 1} de {componentSteps.length}: {currentStepData.label}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {currentHardware.length} opções disponíveis - ordenados do mais barato ao mais caro
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Parcial</p>
              <p className="text-2xl font-bold text-primary">{formatPrice(calculateTotal())}</p>
            </div>
          </div>

          {/* Component Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {currentHardware.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              
              return (
                <Card
                  key={item.id}
                  onClick={() => selectComponent(item)}
                  className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                    isSelected 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:ring-1 hover:ring-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <currentStepData.icon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm line-clamp-1">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.brand} - {item.model}</p>
                        </div>
                        {isSelected && (
                          <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                      {/* Show compatibility info */}
                      {(item.socket || item.memoryType || item.formFactor) && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.socket && (
                            <span className="text-xs bg-secondary px-1.5 py-0.5 rounded">{item.socket}</span>
                          )}
                          {item.memoryType && (
                            <span className="text-xs bg-secondary px-1.5 py-0.5 rounded">{item.memoryType}</span>
                          )}
                          {item.formFactor && (
                            <span className="text-xs bg-secondary px-1.5 py-0.5 rounded">{item.formFactor}</span>
                          )}
                        </div>
                      )}
                      <p className="text-lg font-bold text-primary mt-2">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={goToPreviousStep}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>

            <div className="flex gap-3">
              {currentStep === componentSteps.length - 1 ? (
                <Button 
                  onClick={generateQuote}
                  disabled={!allStepsComplete()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Gerar Orçamento
                </Button>
              ) : (
                <Button 
                  onClick={goToNextStep}
                  disabled={!isStepComplete(currentStep)}
                >
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Selected Components Summary */}
          {Object.keys(selectedComponents).length > 0 && (
            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold mb-3">Componentes Selecionados:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {componentSteps.map((step) => {
                  const item = selectedComponents[step.key];
                  if (!item) return null;
                  return (
                    <div key={step.key} className="text-sm">
                      <p className="text-muted-foreground">{step.label}:</p>
                      <p className="font-medium truncate">{item.brand} {item.model}</p>
                      <p className="text-primary font-semibold">{formatPrice(item.price)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

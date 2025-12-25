import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, ChevronRight, ChevronLeft, Check } from "lucide-react";

interface ConsignmentData {
  product_name: string;
  category: string;
  description: string;
  client_value: string;
  media: Array<{ type: 'image' | 'video'; url: string }>;
}

export default function Consignacao() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { company, hasFeature } = useTenant();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<ConsignmentData>({
    product_name: '',
    category: '',
    description: '',
    client_value: '',
    media: []
  });

  // Verificar se tem acesso
  if (!hasFeature('consignacao')) {
    toast({
      title: "Acesso negado",
      description: "Funcionalidade não disponível no seu plano",
      variant: "destructive"
    });
    navigate('/');
    return null;
  }

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Simular upload (em produção, fazer upload real para S3/servidor)
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        const type = file.type.startsWith('video') ? 'video' : 'image';
        setFormData(prev => ({
          ...prev,
          media: [...prev.media, { type, url }]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index: number) => {
    setFormData(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('https://www.n8nbalao.com/api/consignments.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Company-ID': company?.id?.toString() || '1'
        },
        body: JSON.stringify({
          ...formData,
          client_value: parseFloat(formData.client_value)
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Produto enviado!",
          description: "Seu produto está em análise. Você receberá um e-mail quando for aprovado.",
        });
        navigate('/minha-conta');
      } else {
        throw new Error(data.message || 'Erro ao enviar produto');
      }
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return formData.product_name && formData.category;
    if (step === 2) return formData.description;
    if (step === 3) return formData.media.length > 0;
    if (step === 4) return formData.client_value && parseFloat(formData.client_value) > 0;
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Vender Equipamento</h1>
          <p className="text-gray-600">Cadastre seu equipamento para consignação</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  s < step ? 'bg-green-500 text-white' :
                  s === step ? 'bg-primary text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {s < step ? <Check className="h-5 w-5" /> : s}
                </div>
                {s < 5 && (
                  <div className={`w-12 h-1 mx-2 ${s < step ? 'bg-green-500' : 'bg-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Dados</span>
            <span>Descrição</span>
            <span>Fotos</span>
            <span>Valor</span>
            <span>Revisão</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Step 1: Dados Básicos */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Dados do Produto</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Produto *
                </label>
                <Input
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  placeholder="Ex: Notebook Dell Inspiron 15"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Selecione...</option>
                  <option value="notebook">Notebook</option>
                  <option value="desktop">Desktop</option>
                  <option value="monitor">Monitor</option>
                  <option value="perifericos">Periféricos</option>
                  <option value="componentes">Componentes</option>
                  <option value="outros">Outros</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Descrição */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Descrição Detalhada</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descreva o produto *
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Inclua informações como: marca, modelo, especificações, estado de conservação, acessórios inclusos, etc."
                  rows={8}
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Quanto mais detalhes, melhor! Isso ajuda na avaliação e venda.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Fotos e Vídeos */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Fotos e Vídeos</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adicione fotos e vídeos do produto *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                    className="hidden"
                    id="media-upload"
                  />
                  <label htmlFor="media-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Clique para adicionar fotos ou vídeos</p>
                    <p className="text-sm text-gray-500 mt-2">PNG, JPG, MP4 até 10MB cada</p>
                  </label>
                </div>

                {/* Preview de Mídia */}
                {formData.media.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {formData.media.map((item, index) => (
                      <div key={index} className="relative group">
                        {item.type === 'image' ? (
                          <img
                            src={item.url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ) : (
                          <video
                            src={item.url}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        )}
                        <button
                          onClick={() => removeMedia(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Valor */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Valor Desejado</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quanto você quer receber? *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-medium">
                    R$
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.client_value}
                    onChange={(e) => setFormData({ ...formData, client_value: e.target.value })}
                    placeholder="0,00"
                    className="w-full pl-12 text-lg"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Este é o valor que você receberá. O preço final de venda será calculado com a comissão.
                </p>

                {formData.client_value && parseFloat(formData.client_value) > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Valor para você:</strong> R$ {parseFloat(formData.client_value).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      <strong>Comissão ({company?.commission_percent || 25}%):</strong> R$ {(parseFloat(formData.client_value) * ((company?.commission_percent || 25) / 100)).toFixed(2)}
                    </p>
                    <p className="text-sm font-bold text-gray-800 mt-2">
                      <strong>Preço de venda:</strong> R$ {(parseFloat(formData.client_value) * (1 + ((company?.commission_percent || 25) / 100))).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Revisão */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Revisão Final</h2>
              
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <p className="text-sm text-gray-600">Produto</p>
                  <p className="font-medium text-gray-800">{formData.product_name}</p>
                </div>

                <div className="border-b pb-4">
                  <p className="text-sm text-gray-600">Categoria</p>
                  <p className="font-medium text-gray-800">{formData.category}</p>
                </div>

                <div className="border-b pb-4">
                  <p className="text-sm text-gray-600">Descrição</p>
                  <p className="text-gray-800">{formData.description}</p>
                </div>

                <div className="border-b pb-4">
                  <p className="text-sm text-gray-600">Mídia</p>
                  <p className="font-medium text-gray-800">{formData.media.length} arquivo(s)</p>
                </div>

                <div className="border-b pb-4">
                  <p className="text-sm text-gray-600">Valor desejado</p>
                  <p className="font-medium text-gray-800">R$ {parseFloat(formData.client_value).toFixed(2)}</p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Atenção:</strong> Seu produto será analisado pela nossa equipe. Você receberá um e-mail quando for aprovado e estiver disponível no marketplace.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </Button>

            {step < 5 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2"
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? 'Enviando...' : 'Enviar para Análise'}
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

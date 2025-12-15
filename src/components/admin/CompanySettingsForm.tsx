import { useState, useRef } from 'react';
import { Building2, Upload, Save, Globe, Phone, Mail, MapPin, FileText, User, Image } from 'lucide-react';
import { ColorPaletteSelector, type ColorPalette } from './ColorPaletteSelector';
import { useToast } from '@/hooks/use-toast';

interface CompanyData {
  id?: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  cnpj: string;
  seller: string;
  logo: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

interface CompanySettingsFormProps {
  companyData: CompanyData;
  onSave: (data: CompanyData) => Promise<void>;
  isSaving: boolean;
}

export function CompanySettingsForm({ companyData, onSave, isSaving }: CompanySettingsFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<CompanyData>(companyData);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O logo deve ter no máximo 2MB',
        variant: 'destructive'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 400;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/webp', 0.85);
        setFormData(prev => ({ ...prev, logo: compressedBase64 }));
        toast({ title: 'Logo carregado com sucesso' });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPalette = (palette: ColorPalette) => {
    setFormData(prev => ({
      ...prev,
      primaryColor: palette.primary,
      secondaryColor: palette.secondary,
      accentColor: palette.accent
    }));
    toast({ title: `Paleta "${palette.name}" aplicada!` });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Logo Section */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Image className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-foreground">Logo da Empresa</h3>
            <p className="text-sm text-muted-foreground">Será exibido em todo o site</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div 
            className="w-32 h-32 rounded-xl border-2 border-dashed border-border bg-muted/50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {formData.logo ? (
              <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <div className="text-center">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <span className="text-xs text-muted-foreground">Clique para upload</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">
              Formatos: PNG, JPG, WebP (máx. 2MB)
            </p>
            <p className="text-sm text-muted-foreground">
              Recomendado: Fundo transparente, 400x400px
            </p>
            {formData.logo && (
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                className="mt-3 text-sm text-destructive hover:underline"
              >
                Remover logo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Company Info Section */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-foreground">Informações da Empresa</h3>
            <p className="text-sm text-muted-foreground">Dados exibidos no site e documentos</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Building2 className="h-4 w-4" />
              Nome da Empresa
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Nome da sua empresa"
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <MapPin className="h-4 w-4" />
              Endereço Completo
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Rua, número, bairro"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Globe className="h-4 w-4" />
              Cidade / Estado
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Cidade - UF"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Phone className="h-4 w-4" />
              Telefone / WhatsApp
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="(11) 99999-9999"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Mail className="h-4 w-4" />
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="contato@empresa.com"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <FileText className="h-4 w-4" />
              CNPJ
            </label>
            <input
              type="text"
              value={formData.cnpj}
              onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="00.000.000/0001-00"
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <User className="h-4 w-4" />
              Vendedor / Responsável
            </label>
            <input
              type="text"
              value={formData.seller}
              onChange={(e) => setFormData(prev => ({ ...prev, seller: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Nome do vendedor ou responsável"
            />
          </div>
        </div>
      </div>

      {/* Color Palette Section */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <ColorPaletteSelector
          currentPrimary={formData.primaryColor || '#E31C23'}
          onSelectPalette={handleSelectPalette}
        />

        {/* Custom Color Inputs */}
        <div className="mt-6 pt-6 border-t border-border">
          <h4 className="text-sm font-medium text-foreground mb-4">Cores Personalizadas</h4>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Cor Primária</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.primaryColor || '#E31C23'}
                  onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primaryColor || '#E31C23'}
                  onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground uppercase"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Cor Secundária</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.secondaryColor || '#FFFFFF'}
                  onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.secondaryColor || '#FFFFFF'}
                  onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground uppercase"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Cor de Destaque</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.accentColor || '#DC2626'}
                  onChange={(e) => setFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                  className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.accentColor || '#DC2626'}
                  onChange={(e) => setFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground uppercase"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-6 pt-6 border-t border-border">
          <h4 className="text-sm font-medium text-foreground mb-4">Pré-visualização</h4>
          <div className="flex gap-4 items-center">
            <button
              type="button"
              className="px-6 py-3 rounded-lg text-white font-medium"
              style={{ backgroundColor: formData.primaryColor || '#E31C23' }}
            >
              Botão Primário
            </button>
            <button
              type="button"
              className="px-6 py-3 rounded-lg font-medium border-2"
              style={{ 
                borderColor: formData.primaryColor || '#E31C23',
                color: formData.primaryColor || '#E31C23'
              }}
            >
              Botão Secundário
            </button>
            <div
              className="px-4 py-2 rounded-lg text-white text-sm"
              style={{ backgroundColor: formData.accentColor || '#DC2626' }}
            >
              Badge
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSaving}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-4 font-semibold text-primary-foreground shadow-lg transition-all hover:opacity-90 disabled:opacity-50"
      >
        <Save className="h-5 w-5" />
        {isSaving ? 'Salvando...' : 'Salvar Configurações da Empresa'}
      </button>
    </form>
  );
}

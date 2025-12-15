import { Monitor, Package, Armchair, Sparkles, Wrench } from "lucide-react";

export type ConfigurationType = 'kit' | 'pc' | 'setup_completo';

interface ConfigurationTypeSelectorProps {
  onSelectManual: (type: ConfigurationType) => void;
  onSelectAI: () => void;
  onClose: () => void;
}

export function ConfigurationTypeSelector({ onSelectManual, onSelectAI, onClose }: ConfigurationTypeSelectorProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-xl bg-card p-8 shadow-xl border border-border">
        <h2 className="text-2xl font-bold text-foreground mb-2">Nova Configuração</h2>
        <p className="text-muted-foreground mb-6">Escolha como deseja criar sua configuração</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Manual Option */}
          <div className="border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Wrench className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Montar Manualmente</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Selecione cada componente manualmente para montar sua configuração.
            </p>
            
            <div className="space-y-2">
              <button
                onClick={() => onSelectManual('kit')}
                className="w-full flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-secondary transition-colors text-left"
              >
                <Package className="h-5 w-5 text-primary" />
                <div>
                  <span className="font-medium text-foreground">Kit</span>
                  <p className="text-xs text-muted-foreground">Processador + Placa-Mãe + Memória</p>
                </div>
              </button>
              
              <button
                onClick={() => onSelectManual('pc')}
                className="w-full flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-secondary transition-colors text-left"
              >
                <Monitor className="h-5 w-5 text-primary" />
                <div>
                  <span className="font-medium text-foreground">PC Completo</span>
                  <p className="text-xs text-muted-foreground">Todos os componentes de hardware</p>
                </div>
              </button>
              
              <button
                onClick={() => onSelectManual('setup_completo')}
                className="w-full flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-secondary transition-colors text-left"
              >
                <Armchair className="h-5 w-5 text-primary" />
                <div>
                  <span className="font-medium text-foreground">Setup Completo</span>
                  <p className="text-xs text-muted-foreground">PC + Cadeira + Periféricos</p>
                </div>
              </button>
            </div>
          </div>

          {/* AI Option */}
          <button
            onClick={onSelectAI}
            className="border border-border rounded-xl p-6 hover:border-primary/50 transition-colors text-left h-full flex flex-col"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)' }}>
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Montar com IA</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4 flex-1">
              Defina seu orçamento e o tipo de configuração desejada. A IA vai selecionar automaticamente os melhores componentes dentro do seu limite.
            </p>
            <div className="w-full py-3 rounded-lg text-center text-white font-medium" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)' }}>
              Usar Inteligência Artificial
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-lg border border-border py-3 font-medium text-foreground hover:bg-secondary transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

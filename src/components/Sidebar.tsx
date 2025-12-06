import { useState } from "react";
import { Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { href: "https://n8n.n8nbalao.com/", label: "n8n", icon: "fa-network-wired" },
  { href: "https://n8n.n8nbalao.com/projects/2VLadppUoWIYlTZG/executions", label: "n8n dashboard", icon: "fa-table" },
  { href: "https://api.n8nbalao.com/manager/", label: "EvolutionAPI", icon: "fa-rocket" },
  { href: "https://cloud.redis.io/#/databases", label: "Redis", icon: "fa-database" },
  { href: "https://platform.openai.com/api-keys/", label: "OpenAI", icon: "fa-brain" },
  { href: "https://supabase.com/dashboard/org/ftnihoajvfisoozwlvpf", label: "Supabase", icon: "fa-cloud" },
  { href: "https://console.x.ai/team/205bb6f6-48d0-4cfe-8328-d4bf1b4f01c9", label: "Grok (xAI)", icon: "fa-brain" },
  { href: "https://aistudio.google.com/api-keys", label: "Gemini", icon: "fa-robot" },
  { href: "https://docs.google.com/spreadsheets/u/0//", label: "Google Sheets", icon: "fa-file-excel" },
  { href: "https://hpanel.hostinger.com/vps/1139708/overview/", label: "VPS", icon: "fa-server" },
  { href: "https://www.bling.com.br/cadastro.aplicativos.php#/list", label: "Bling APP", icon: "fa-box" },
  { href: "https://web.whatsapp.com/", label: "WhatsApp", icon: "fa-whatsapp" },
  { href: "https://blog.n8n.io/", label: "Blog N8N", icon: "fa-blog" },
  { href: "https://www.linkedin.com/in/hector-herrera-junior-77317632b/", label: "Aulas Particulares", icon: "fa-linkedin" },
  { href: "https://share.google/wCfeU62VrhjbBwLBA", label: "Nossas Avaliações", icon: "fa-star" },
  { href: "https://wa.me/5519981470446", label: "Revenda", icon: "fa-handshake" },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed right-0 top-1/2 z-50 -translate-y-1/2 rounded-l-lg bg-primary p-3 text-primary-foreground shadow-glow transition-all duration-300 hover:bg-primary/90",
          isOpen && "opacity-0 pointer-events-none"
        )}
      >
        <Settings className="h-6 w-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-80 border-l border-border bg-sidebar p-6 shadow-2xl transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-primary pb-4">
          <h3 className="text-lg font-semibold text-foreground">Acesso</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-6 space-y-2 overflow-y-auto max-h-[calc(100vh-120px)]">
          {sidebarLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-md bg-secondary px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <i className={`fas ${link.icon} text-primary`} />
              {link.label}
            </a>
          ))}
        </nav>
      </aside>
    </>
  );
}

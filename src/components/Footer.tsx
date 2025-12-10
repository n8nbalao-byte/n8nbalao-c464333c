import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";

export function Footer() {
  const { company } = useCompany();

  return (
    <footer className="border-t border-white/10 bg-[hsl(222,20%,8%)] py-12">
      <div className="container">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              {company?.logo ? (
                <img src={company.logo} alt={company.name || 'Logo'} className="h-8 object-contain" />
              ) : (
                <div className="flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-primary" />
                  <span className="font-bold text-white">{company?.name || 'Sua Empresa'}</span>
                </div>
              )}
            </Link>
            <p className="mt-4 text-sm text-gray-400">
              {company?.name ? `${company.name} - Sua loja de informática completa.` : 'Automatize seu atendimento com nosso chatbot inteligente para WhatsApp.'}
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Links Rápidos</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/" className="hover:text-primary">Início</Link></li>
              <li><Link to="/loja" className="hover:text-primary">Loja</Link></li>
              <li><Link to="/monte-voce-mesmo" className="hover:text-primary">Monte seu PC</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Contato</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {company?.phone && (
                <li>
                  <a href={`https://wa.me/${company.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                    WhatsApp: {company.phone}
                  </a>
                </li>
              )}
              {company?.email && (
                <li>
                  <a href={`mailto:${company.email}`} className="hover:text-primary">
                    {company.email}
                  </a>
                </li>
              )}
              {!company?.phone && !company?.email && (
                <li className="text-gray-500 italic">Configure os dados da empresa</li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="#" className="hover:text-primary">Termos de Uso</Link></li>
              <li><Link to="#" className="hover:text-primary">Privacidade</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-8 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} {company?.name || 'Sua Empresa'}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { getCustomCategories, type CustomCategory } from "@/lib/api";
import { useCompany } from "@/contexts/CompanyContext";

interface RedWhiteFooterProps {
  hideFooter?: boolean;
}

export function RedWhiteFooter({ hideFooter }: RedWhiteFooterProps) {
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const { company } = useCompany();

  useEffect(() => {
    // Load categories from database
    getCustomCategories().then(cats => {
      // Filter out hardware category and take first 6
      const filtered = cats.filter(c => c.key !== 'hardware').slice(0, 6);
      setCategories(filtered);
    });
  }, []);

  if (hideFooter) {
    return null;
  }

  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            {company?.logo ? (
              <img src={company.logo} alt={company.name || 'Logo'} className="h-12 mb-4 object-contain" />
            ) : (
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-8 w-8 text-primary" />
                <span className="font-bold text-gray-800">{company?.name || 'Sua Empresa'}</span>
              </div>
            )}
            <p className="text-gray-600 text-sm">
              {company?.name || 'Sua loja'} - Computadores, notebooks, hardware e muito mais.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 text-gray-800">Navegação</h4>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li><Link to="/" className="hover:text-primary transition-colors">Início</Link></li>
              <li><Link to="/loja" className="hover:text-primary transition-colors">Loja</Link></li>
              <li><Link to="/monte-voce-mesmo" className="hover:text-primary transition-colors">Monte seu PC</Link></li>
              <li><Link to="/automacao" className="hover:text-primary transition-colors">Automação</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 text-gray-800">Categorias</h4>
            <ul className="space-y-2 text-gray-600 text-sm">
              {categories.length > 0 ? (
                categories.map(cat => (
                  <li key={cat.key}>
                    <Link to={`/loja?category=${cat.key}`} className="hover:text-primary transition-colors">
                      {cat.label}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-gray-400 italic">Carregando...</li>
              )}
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 text-gray-800">Contato</h4>
            <ul className="space-y-2 text-gray-600 text-sm">
              {company?.phone && (
                <li>WhatsApp: {company.phone}</li>
              )}
              {company?.email && (
                <li>Email: {company.email}</li>
              )}
              {!company?.phone && !company?.email && (
                <li className="text-gray-400 italic">Configure os dados da empresa</li>
              )}
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} {company?.name || 'Sua Empresa'}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}

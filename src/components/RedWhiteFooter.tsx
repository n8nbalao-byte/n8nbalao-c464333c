import { Link } from "react-router-dom";
import balaoLogo from "@/assets/balao-logo.png";

interface RedWhiteFooterProps {
  hideFooter?: boolean;
}

export function RedWhiteFooter({ hideFooter }: RedWhiteFooterProps) {
  if (hideFooter) {
    return null;
  }

  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img src={balaoLogo} alt="Balão da Informática" className="h-12 mb-4" />
            <p className="text-gray-600 text-sm">
              Sua loja de informática completa. Computadores, notebooks, hardware e muito mais.
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
              <li><Link to="/loja?category=pc" className="hover:text-primary transition-colors">PCs Montados</Link></li>
              <li><Link to="/loja?category=notebook" className="hover:text-primary transition-colors">Notebooks</Link></li>
              <li><Link to="/loja?category=hardware" className="hover:text-primary transition-colors">Hardware</Link></li>
              <li><Link to="/loja?category=acessorio" className="hover:text-primary transition-colors">Acessórios</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 text-gray-800">Contato</h4>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li>WhatsApp: (19) 98147-0446</li>
              <li>Email: contato@balao.info</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Balão da Informática. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}

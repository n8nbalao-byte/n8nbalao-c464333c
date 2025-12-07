import { Link } from "react-router-dom";
import logo from "@/assets/logo-white.svg";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 py-12">
      <div className="container">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="n8nBalão" className="h-6" />
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Automatize seu atendimento com nosso chatbot inteligente para WhatsApp.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-foreground">Links Rápidos</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-primary">Início</Link></li>
              <li><Link to="/loja" className="hover:text-primary">Loja</Link></li>
              <li><Link to="/admin" className="hover:text-primary">Admin</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-foreground">Contato</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="https://wa.me/5519981470446" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                  WhatsApp
                </a>
              </li>
              <li>
                <a href="https://www.linkedin.com/in/hector-herrera-junior-77317632b/" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="#" className="hover:text-primary">Termos de Uso</Link></li>
              <li><Link to="#" className="hover:text-primary">Privacidade</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} n8nBalão. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}

import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Início" },
  { href: "/#pricing", label: "Preços" },
  { href: "/#benefits", label: "Benefícios" },
  { href: "/#testimonials", label: "Depoimentos" },
  { href: "/loja", label: "Loja" },
  { href: "/monte-voce-mesmo", label: "Monte Você Mesmo" },
];

export function Header() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="20" r="4" fill="hsl(var(--primary))" />
              <circle cx="20" cy="20" r="4" fill="hsl(var(--primary))" />
              <circle cx="32" cy="20" r="4" fill="hsl(var(--primary))" />
              <path d="M8 20h8M20 20h8" stroke="hsl(var(--primary))" strokeWidth="2" />
              <path d="M16 16l4-4M16 24l4 4M28 16l4 4M28 24l4-4" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="ml-2 text-xl font-bold text-primary">n8n</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location.pathname === link.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

      </div>
    </header>
  );
}

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { ViewModeProvider } from "@/contexts/ViewModeContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { CartDrawer } from "@/components/CartDrawer";
import Home from "./pages/Home";
import Automacao from "./pages/Automacao";
import Loja from "./pages/Loja";
import Produto from "./pages/Produto";
import Admin from "./pages/Admin";
import MonteVoceMesmo from "./pages/MonteVoceMesmo";
import ImportHardware from "./pages/ImportHardware";
import ImportProducts from "./pages/ImportProducts";
import ExtractProducts from "./pages/ExtractProducts";
import ClienteAuth from "./pages/ClienteAuth";
import MeusPedidos from "./pages/MeusPedidos";
import Hardware from "./pages/Hardware";
import EmailMarketing from "./pages/EmailMarketing";
import LandingVendas from "./pages/LandingVendas";
import GoogleFakePageBuilder from "./pages/GoogleFakePageBuilder";
import MasterAdmin from "./pages/MasterAdmin";
import Onboarding from "./pages/Onboarding";
import AgenteWhatsApp from "./pages/AgenteWhatsApp";
import Consignacao from "./pages/Consignacao";
import Marketplace from "./pages/Marketplace";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <TenantProvider>
          <CompanyProvider>
          <CartProvider>
            <ViewModeProvider>
              <Toaster />
              <Sonner />
              <CartDrawer />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/automacao" element={<Automacao />} />
                <Route path="/loja" element={<Loja />} />
                <Route path="/produto/:id" element={<Produto />} />
                <Route path="/hardware/:id" element={<Hardware />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/monte-voce-mesmo" element={<MonteVoceMesmo />} />
                <Route path="/import-hardware" element={<ImportHardware />} />
                <Route path="/import-products" element={<ImportProducts />} />
                <Route path="/extract-products" element={<ExtractProducts />} />
                <Route path="/cliente" element={<ClienteAuth />} />
                <Route path="/meus-pedidos" element={<MeusPedidos />} />
                <Route path="/email-marketing" element={<EmailMarketing />} />
                <Route path="/vender" element={<LandingVendas />} />
                <Route path="/balao-builder" element={<GoogleFakePageBuilder />} />
                <Route path="/master-admin" element={<MasterAdmin />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/agente-whatsapp" element={<AgenteWhatsApp />} />
                <Route path="/consignacao" element={<Consignacao />} />
                <Route path="/marketplace" element={<Marketplace />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ViewModeProvider>
          </CartProvider>
          </CompanyProvider>
        </TenantProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
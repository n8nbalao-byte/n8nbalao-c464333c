import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <CartProvider>
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </CartProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
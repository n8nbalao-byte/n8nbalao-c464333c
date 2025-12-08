import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { MessageCircle, Loader2, User, Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";

interface CustomerData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  address: string;
  city: string;
  state: string;
  cep: string;
}

const API_BASE = "https://www.n8nbalao.com/api";

export function CheckoutForm({ onClose }: { onClose: () => void }) {
  const { items, totalPrice, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    address: "",
    city: "",
    state: "",
    cep: "",
  });

  // Load saved customer data from localStorage
  useEffect(() => {
    const savedCustomer = localStorage.getItem("customerData");
    if (savedCustomer) {
      setCustomerData(JSON.parse(savedCustomer));
    }
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerData.name || !customerData.email || !customerData.phone) {
      toast.error("Preencha nome, email e telefone");
      return;
    }

    setIsLoading(true);

    try {
      // Save/update customer
      const customerResponse = await fetch(`${API_BASE}/customers.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });

      const customerResult = await customerResponse.json();

      if (!customerResult.success) {
        throw new Error(customerResult.error || "Erro ao salvar cliente");
      }

      const customer = customerResult.customer;

      // Save customer data locally
      localStorage.setItem("customerData", JSON.stringify(customer));

      // Create order
      const orderItems = items.map((item) => ({
        productId: item.product.id,
        title: item.product.title,
        price: item.product.totalPrice,
        quantity: item.quantity,
      }));

      const orderResponse = await fetch(`${API_BASE}/orders.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          items: orderItems,
          totalPrice: totalPrice,
        }),
      });

      const orderResult = await orderResponse.json();

      if (!orderResult.success) {
        throw new Error(orderResult.error || "Erro ao criar pedido");
      }

      // Generate WhatsApp message
      const itemsList = items
        .map(
          (item) =>
            `• ${item.quantity}x ${item.product.title} - ${formatPrice(item.product.totalPrice * item.quantity)}`
        )
        .join("\n");

      const message = `*Novo Pedido #${orderResult.orderId}*\n\n` +
        `*Cliente:* ${customer.name}\n` +
        `*Email:* ${customer.email}\n` +
        `*Telefone:* ${customer.phone}\n` +
        (customer.address ? `*Endereço:* ${customer.address}, ${customer.city} - ${customer.state}, ${customer.cep}\n` : "") +
        `\n*Itens:*\n${itemsList}\n\n` +
        `*Total: ${formatPrice(totalPrice)}*`;

      window.open(
        `https://wa.me/5519981470446?text=${encodeURIComponent(message)}`,
        "_blank"
      );

      toast.success("Pedido realizado com sucesso!");
      clearCart();
      onClose();
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao finalizar pedido");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Nome Completo *
          </Label>
          <Input
            id="name"
            name="name"
            value={customerData.name}
            onChange={handleInputChange}
            placeholder="Seu nome"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email *
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={customerData.email}
            onChange={handleInputChange}
            placeholder="seu@email.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Telefone *
          </Label>
          <Input
            id="phone"
            name="phone"
            value={customerData.phone}
            onChange={handleInputChange}
            placeholder="(19) 99999-9999"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            name="cpf"
            value={customerData.cpf}
            onChange={handleInputChange}
            placeholder="000.000.000-00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Endereço
        </Label>
        <Input
          id="address"
          name="address"
          value={customerData.address}
          onChange={handleInputChange}
          placeholder="Rua, número, complemento"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            name="city"
            value={customerData.city}
            onChange={handleInputChange}
            placeholder="Sua cidade"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">Estado</Label>
          <Input
            id="state"
            name="state"
            value={customerData.state}
            onChange={handleInputChange}
            placeholder="SP"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cep">CEP</Label>
          <Input
            id="cep"
            name="cep"
            value={customerData.cep}
            onChange={handleInputChange}
            placeholder="00000-000"
          />
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <div className="mb-4 flex items-center justify-between text-lg font-semibold">
          <span>Total do Pedido</span>
          <span className="text-primary">{formatPrice(totalPrice)}</span>
        </div>

        <Button
          type="submit"
          className="w-full gap-2 bg-green-600 py-6 text-lg hover:bg-green-700"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <MessageCircle className="h-5 w-5" />
          )}
          {isLoading ? "Processando..." : "Finalizar no WhatsApp"}
        </Button>
      </div>
    </form>
  );
}

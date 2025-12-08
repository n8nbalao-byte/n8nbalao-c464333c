import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  LogOut,
  User,
  ShoppingBag,
  ArrowLeft,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const API_BASE = "https://www.n8nbalao.com/api";

interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  totalPrice: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
}

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

const statusLabels: Record<Order["status"], string> = {
  pending: "Aguardando Confirmação",
  confirmed: "Confirmado",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const statusColors: Record<Order["status"], string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  shipped: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  delivered: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusIcons: Record<Order["status"], React.ElementType> = {
  pending: Clock,
  confirmed: CheckCircle,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

export default function MeusPedidos() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    const savedCustomer = localStorage.getItem("customer");
    if (!savedCustomer) {
      navigate("/cliente");
      return;
    }

    try {
      const customerData = JSON.parse(savedCustomer);
      setCustomer(customerData);
      fetchOrders(customerData.id);
    } catch (error) {
      console.error("Error parsing customer data:", error);
      navigate("/cliente");
    } finally {
      setCheckingAuth(false);
    }
  }, [navigate]);

  async function fetchOrders(customerId: string) {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/auth.php?action=get-orders&customerId=${customerId}`
      );
      
      if (!response.ok) {
        throw new Error("Erro ao buscar pedidos");
      }

      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("customer");
    localStorage.removeItem("customerToken");
    toast({ title: "Até logo!", description: "Você saiu da sua conta" });
    navigate("/loja");
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (checkingAuth || !customer) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary text-2xl font-bold">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">Olá, {customer.name.split(" ")[0]}!</h1>
              <p className="text-muted-foreground">{customer.email}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => customer && fetchOrders(customer.id)}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/20 p-2">
                <Package className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Pedidos</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-500/20 p-2">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold">
                  {orders.filter((o) => !["delivered", "cancelled"].includes(o.status)).length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/20 p-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entregues</p>
                <p className="text-2xl font-bold">
                  {orders.filter((o) => o.status === "delivered").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Seus Pedidos</h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card py-16">
              <ShoppingBag className="h-16 w-16 text-muted-foreground" />
              <div className="text-center">
                <p className="text-lg font-medium">Nenhum pedido ainda</p>
                <p className="text-muted-foreground">
                  Quando você fizer uma compra, ela aparecerá aqui
                </p>
              </div>
              <Button asChild>
                <Link to="/loja">Ver Produtos</Link>
              </Button>
            </div>
          ) : (
            orders.map((order) => {
              const StatusIcon = statusIcons[order.status];
              const isExpanded = expandedOrder === order.id;

              return (
                <div
                  key={order.id}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  <div
                    className="flex cursor-pointer items-center justify-between p-4 hover:bg-secondary/30"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-center gap-4">
                      <StatusIcon className="h-6 w-6 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Pedido #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-primary">
                          {formatPrice(order.totalPrice)}
                        </p>
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 text-xs ${
                            statusColors[order.status]
                          }`}
                        >
                          {statusLabels[order.status]}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border bg-secondary/20 p-4">
                      <h4 className="mb-3 font-medium">Itens do Pedido</h4>
                      <div className="space-y-2">
                        {order.items?.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                          >
                            <div>
                              <p className="font-medium">{item.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.quantity}x {formatPrice(item.price)}
                              </p>
                            </div>
                            <p className="font-semibold">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                        <p className="text-muted-foreground">Total do Pedido</p>
                        <p className="text-xl font-bold text-primary">
                          {formatPrice(order.totalPrice)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Back to store */}
        <div className="mt-8 text-center">
          <Link
            to="/loja"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para a loja
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

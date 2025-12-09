import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { RedWhiteHeader } from "@/components/RedWhiteHeader";
import { RedWhiteFooter } from "@/components/RedWhiteFooter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  LogOut,
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
  pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
  confirmed: "bg-blue-100 text-blue-700 border-blue-300",
  shipped: "bg-purple-100 text-purple-700 border-purple-300",
  delivered: "bg-green-100 text-green-700 border-green-300",
  cancelled: "bg-red-100 text-red-700 border-red-300",
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
      <div className="min-h-screen bg-white flex flex-col">
        <RedWhiteHeader hideCart hideNavigation />
        <main className="flex-1 flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-[#E31C23]" />
        </main>
        <RedWhiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <RedWhiteHeader hideCart hideNavigation />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E31C23] text-white text-2xl font-bold">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Olá, {customer.name.split(" ")[0]}!</h1>
              <p className="text-gray-500">{customer.email}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => customer && fetchOrders(customer.id)}
              className="gap-2 border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button variant="outline" onClick={handleLogout} className="gap-2 border-gray-300 text-gray-700 hover:bg-gray-100">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total de Pedidos</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 p-2">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Em Andamento</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter((o) => !["delivered", "cancelled"].includes(o.status)).length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Entregues</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter((o) => o.status === "delivered").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Seus Pedidos</h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-[#E31C23]" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-gray-200 bg-white py-16 shadow-sm">
              <ShoppingBag className="h-16 w-16 text-gray-400" />
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900">Nenhum pedido ainda</p>
                <p className="text-gray-500">
                  Quando você fizer uma compra, ela aparecerá aqui
                </p>
              </div>
              <Button asChild className="bg-[#E31C23] hover:bg-[#c91920] text-white">
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
                  className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm"
                >
                  <div
                    className="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-center gap-4">
                      <StatusIcon className="h-6 w-6 text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-900">Pedido #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-[#E31C23]">
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
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                      <h4 className="mb-3 font-medium text-gray-900">Itens do Pedido</h4>
                      <div className="space-y-2">
                        {order.items?.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
                          >
                            <div>
                              <p className="font-medium text-gray-900">{item.title}</p>
                              <p className="text-sm text-gray-500">
                                {item.quantity}x {formatPrice(item.price)}
                              </p>
                            </div>
                            <p className="font-semibold text-gray-900">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                        <p className="text-gray-500">Total do Pedido</p>
                        <p className="text-xl font-bold text-[#E31C23]">
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
            className="inline-flex items-center gap-2 text-gray-500 hover:text-[#E31C23]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para a loja
          </Link>
        </div>
      </main>

      <RedWhiteFooter />
    </div>
  );
}
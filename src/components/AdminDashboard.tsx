import { useState, useEffect } from "react";
import { api, type Customer, type Order, type Product } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Eye,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
} from "lucide-react";

interface DashboardStats {
  totalCustomers: number;
  totalOrders: number;
  totalProducts: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
}

const statusLabels: Record<Order["status"], string> = {
  pending: "Pendente",
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

export function AdminDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });

  const [activeView, setActiveView] = useState<"overview" | "customers" | "orders">("overview");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Order["status"] | "all">("all");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch data with individual error handling
      let customersData: Customer[] = [];
      let ordersData: Order[] = [];
      let productsData: Product[] = [];

      try {
        customersData = await api.getCustomers();
      } catch (e) {
        console.log("Customers API not available yet");
      }

      try {
        ordersData = await api.getOrders();
      } catch (e) {
        console.log("Orders API not available yet");
      }

      try {
        productsData = await api.getProducts();
      } catch (e) {
        console.log("Products API error");
      }

      setCustomers(Array.isArray(customersData) ? customersData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);

      // Calculate stats
      const validOrders = Array.isArray(ordersData) ? ordersData : [];
      const totalRevenue = validOrders
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

      setStats({
        totalCustomers: Array.isArray(customersData) ? customersData.length : 0,
        totalOrders: validOrders.length,
        totalProducts: Array.isArray(productsData) ? productsData.length : 0,
        totalRevenue,
        pendingOrders: validOrders.filter((o) => o.status === "pending").length,
        completedOrders: validOrders.filter((o) => o.status === "delivered").length,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateOrderStatus(orderId: string, status: Order["status"]) {
    const success = await api.updateOrderStatus(orderId, status);
    if (success) {
      toast({ title: "Sucesso", description: "Status do pedido atualizado" });
      fetchData();
    } else {
      toast({ title: "Erro", description: "Falha ao atualizar status", variant: "destructive" });
    }
  }

  async function handleDeleteOrder(orderId: string) {
    if (!confirm("Tem certeza que deseja excluir este pedido?")) return;
    
    const success = await api.deleteOrder(orderId);
    if (success) {
      toast({ title: "Sucesso", description: "Pedido excluído" });
      fetchData();
    } else {
      toast({ title: "Erro", description: "Falha ao excluir pedido", variant: "destructive" });
    }
  }

  async function handleDeleteCustomer(customerId: string) {
    if (!confirm("Tem certeza que deseja excluir este cliente? Isso também excluirá todos os pedidos dele.")) return;
    
    const success = await api.deleteCustomer(customerId);
    if (success) {
      toast({ title: "Sucesso", description: "Cliente excluído" });
      fetchData();
    } else {
      toast({ title: "Erro", description: "Falha ao excluir cliente", variant: "destructive" });
    }
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

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/20 p-2">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Clientes</p>
              <p className="text-2xl font-bold">{stats.totalCustomers}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/20 p-2">
              <ShoppingCart className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pedidos</p>
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/20 p-2">
              <Package className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Produtos</p>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/20 p-2">
              <DollarSign className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receita</p>
              <p className="text-xl font-bold">{formatPrice(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-500/20 p-2">
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold">{stats.pendingOrders}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/20 p-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Entregues</p>
              <p className="text-2xl font-bold">{stats.completedOrders}</p>
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-border pb-4">
        <button
          onClick={() => setActiveView("overview")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeView === "overview"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setActiveView("customers")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeView === "customers"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          Clientes ({customers.length})
        </button>
        <button
          onClick={() => setActiveView("orders")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeView === "orders"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          Pedidos ({orders.length})
        </button>
      </div>

      {/* Search and Filters */}
      {(activeView === "customers" || activeView === "orders") && (
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={activeView === "customers" ? "Buscar cliente..." : "Buscar pedido..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {activeView === "orders" && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as Order["status"] | "all")}
                className="rounded-lg border border-border bg-card px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendentes</option>
                <option value="confirmed">Confirmados</option>
                <option value="shipped">Enviados</option>
                <option value="delivered">Entregues</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>
          )}

          <button
            onClick={fetchData}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-foreground transition-colors hover:bg-secondary"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>
        </div>
      )}

      {/* Overview */}
      {activeView === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Orders */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold">Pedidos Recentes</h3>
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => {
                const StatusIcon = statusIcons[order.status];
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                  >
                    <div className="flex items-center gap-3">
                      <StatusIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{order.customerName || "Cliente"}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.items?.length || 0} itens
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{formatPrice(order.totalPrice)}</p>
                      <span
                        className={`inline-block rounded-full border px-2 py-0.5 text-xs ${
                          statusColors[order.status]
                        }`}
                      >
                        {statusLabels[order.status]}
                      </span>
                    </div>
                  </div>
                );
              })}
              {orders.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">Nenhum pedido ainda</p>
              )}
            </div>
          </div>

          {/* Recent Customers */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold">Clientes Recentes</h3>
            <div className="space-y-3">
              {customers.slice(0, 5).map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">{customer.email}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{customer.phone}</p>
                </div>
              ))}
              {customers.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">Nenhum cliente ainda</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customers List */}
      {activeView === "customers" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-secondary/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Contato
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Endereço
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Cadastro
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary font-semibold">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          {customer.cpf && (
                            <p className="text-sm text-muted-foreground">CPF: {customer.cpf}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p>{customer.email}</p>
                      <p className="text-sm text-muted-foreground">{customer.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      {customer.address ? (
                        <div>
                          <p className="text-sm">{customer.address}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.city}
                            {customer.state && ` - ${customer.state}`}
                            {customer.cep && ` | ${customer.cep}`}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredCustomers.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">Nenhum cliente encontrado</p>
          )}
        </div>
      )}

      {/* Orders List */}
      {activeView === "orders" && (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
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
                      <p className="font-medium">
                        Pedido #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.customerName || "Cliente"} • {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-primary">{formatPrice(order.totalPrice)}</p>
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
                    <div className="mb-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <h4 className="mb-2 font-medium">Cliente</h4>
                        <p>{order.customerName}</p>
                        <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                        <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                      </div>
                      <div>
                        <h4 className="mb-2 font-medium">Alterar Status</h4>
                        <div className="flex flex-wrap gap-2">
                          {(["pending", "confirmed", "shipped", "delivered", "cancelled"] as Order["status"][]).map(
                            (status) => (
                              <button
                                key={status}
                                onClick={() => handleUpdateOrderStatus(order.id, status)}
                                disabled={order.status === status}
                                className={`rounded-lg px-3 py-1 text-sm transition-colors ${
                                  order.status === status
                                    ? statusColors[status]
                                    : "bg-secondary hover:bg-secondary/80"
                                }`}
                              >
                                {statusLabels[status]}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    <h4 className="mb-2 font-medium">Itens do Pedido</h4>
                    <div className="mb-4 space-y-2">
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

                    <div className="flex items-center justify-between border-t border-border pt-4">
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-destructive hover:bg-destructive/20"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir Pedido
                      </button>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-xl font-bold text-primary">
                          {formatPrice(order.totalPrice)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filteredOrders.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">Nenhum pedido encontrado</p>
          )}
        </div>
      )}
    </div>
  );
}

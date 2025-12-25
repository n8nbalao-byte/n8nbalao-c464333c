import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { Package, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MarketplaceProduct {
  id: number;
  product_name: string;
  category: string;
  description: string;
  final_value: number;
  media: Array<{ type: 'image' | 'video'; url: string }>;
  created_at: string;
}

export default function Marketplace() {
  const { company } = useTenant();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetchProducts();
  }, [company]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`https://www.n8nbalao.com/api/consignments.php?status=approved`, {
        headers: {
          'X-Company-ID': company?.id?.toString() || '1'
        }
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container py-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Marketplace</h1>
          <p className="text-gray-600">Produtos em consignação disponíveis</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="container py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar produtos..."
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">Todas as categorias</option>
                {categories.filter(c => c !== 'all').map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-500">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Tente ajustar os filtros' 
                : 'Ainda não há produtos disponíveis'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden group"
              >
                {/* Image */}
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  {product.media && product.media.length > 0 ? (
                    product.media[0].type === 'image' ? (
                      <img
                        src={product.media[0].url}
                        alt={product.product_name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <video
                        src={product.media[0].url}
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-16 w-16 text-gray-300" />
                    </div>
                  )}
                  
                  {/* Category Badge */}
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700">
                    {product.category}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-medium text-gray-800 line-clamp-2 mb-2 min-h-[48px]">
                    {product.product_name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        R$ {product.final_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    
                    <Button size="sm" className="bg-primary hover:bg-primary/90">
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA Banner */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-12 mt-12">
        <div className="container text-center">
          <h2 className="text-2xl font-bold mb-4">Quer vender seu equipamento?</h2>
          <p className="text-white/90 mb-6">
            Cadastre seu produto e deixe a gente cuidar da venda para você!
          </p>
          <Link to="/consignacao">
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-gray-100">
              Vender Meu Equipamento
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

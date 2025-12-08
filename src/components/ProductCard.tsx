import { Link } from "react-router-dom";
import type { Product } from "@/lib/api";
import { Download, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const isAutomacao = product.productType === 'automacao';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <Link
      to={`/produto/${product.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:border-red-300 hover:shadow-lg"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.media?.[0]?.url || "/placeholder.svg"}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
        {product.productType && (
          <span className="absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white capitalize" style={{ backgroundColor: '#DC2626' }}>
            {product.productType}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-semibold text-gray-800 line-clamp-2 group-hover:text-red-600 transition-colors">
          {product.title}
        </h3>
        {product.subtitle && (
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
            {product.subtitle}
          </p>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between gap-2">
          {isAutomacao ? (
            <span className="inline-flex items-center gap-2 text-lg font-bold" style={{ color: '#DC2626' }}>
              <Download className="h-5 w-5" />
              Download Grátis
            </span>
          ) : (
            <>
              <span className="text-xl font-bold" style={{ color: '#DC2626' }}>
                {formatPrice(product.totalPrice)}
              </span>
              <Button
                size="icon"
                className="h-9 w-9 shrink-0 text-white"
                style={{ backgroundColor: '#DC2626' }}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

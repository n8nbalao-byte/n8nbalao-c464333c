import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { CheckoutForm } from "./CheckoutForm";

export function CartDrawer() {
  const { items, isOpen, setIsOpen, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const handleBack = () => {
    setShowCheckout(false);
  };

  const handleCloseCheckout = () => {
    setShowCheckout(false);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) setShowCheckout(false);
    }}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {showCheckout && (
              <Button variant="ghost" size="icon" onClick={handleBack} className="mr-2 h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <ShoppingBag className="h-5 w-5" />
            {showCheckout ? "Finalizar Compra" : "Carrinho de Compras"}
          </SheetTitle>
        </SheetHeader>

        {showCheckout ? (
          <div className="flex-1 overflow-y-auto py-4">
            <CheckoutForm onClose={handleCloseCheckout} />
          </div>
        ) : (
          <>
            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                <ShoppingBag className="h-16 w-16 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">Seu carrinho está vazio</p>
                  <p className="text-sm text-muted-foreground">
                    Adicione produtos para continuar
                  </p>
                </div>
                <Button asChild onClick={() => setIsOpen(false)}>
                  <Link to="/loja">Ver Produtos</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto py-4">
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex gap-4 rounded-lg border border-border bg-card p-3"
                      >
                        <img
                          src={item.product.media?.[0]?.url || "/placeholder.svg"}
                          alt={item.product.title}
                          className="h-20 w-20 rounded-md object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                        <div className="flex flex-1 flex-col">
                          <Link
                            to={`/produto/${item.product.id}`}
                            onClick={() => setIsOpen(false)}
                            className="font-medium text-foreground hover:text-primary line-clamp-2"
                          >
                            {item.product.title}
                          </Link>
                          <span className="text-sm text-primary font-semibold">
                            {formatPrice(item.product.totalPrice)}
                          </span>
                          <div className="mt-auto flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => removeFromCart(item.product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-4">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={clearCart}
                    >
                      Limpar
                    </Button>
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => setShowCheckout(true)}
                    >
                      Finalizar
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

import { useState } from "react";
import { Trash2, ShoppingCart, Minus, Plus, Loader2 } from "lucide-react";
import { useAppState } from "@/context/AppContext";
import { formatPrice, OrderInfo, Order } from "@/data/products";
import { toast } from "sonner";
import { getApiBaseUrl } from "@/admin/adminAuth";

interface CartPageProps {
  onOrderComplete: (order: Order) => void;
}

export default function CartPage({ onOrderComplete }: CartPageProps) {
  const { cart, removeFromCart, updateQuantity, cartTotal, profile, addOrder, updateProfile } = useAppState();
  const [showCheckout, setShowCheckout] = useState(false);
  const [form, setForm] = useState<OrderInfo>({
    fullName: profile.fullName,
    phone: profile.phone,
    address: profile.address,
    district: profile.district,
    notes: profile.notes,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleOrder = async () => {
    if (!form.fullName || !form.phone || !form.address || !form.district) {
      toast.error("Iltimos, barcha maydonlarni to'ldiring");
      return;
    }

    setSubmitting(true);
    try {
      // Determine groupId from first product in cart
      const firstProduct = cart[0]?.product;
      const groupId = firstProduct?.groupId || undefined;

      const response = await fetch(`${getApiBaseUrl()}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: form,
          items: cart.map(item => ({
            product: item.product,
            config: item.config,
            quantity: item.quantity,
            totalPrice: item.totalPrice
          })),
          totalPrice: cartTotal,
          groupId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Buyurtma yuborishda xatolik");
      }

      toast.success("Buyurtma qabul qilindi!");

      const newOrder: Order = {
        code: data.order?.code || "SD-" + Date.now().toString().slice(-6),
        items: [...cart],
        customer: form,
        totalPrice: cartTotal,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      updateProfile(form);
      addOrder(newOrder);

      onOrderComplete(newOrder);
    } catch (error) {
      console.error("Order error:", error);
      toast.error(error instanceof Error ? error.message : "Buyurtma yuborilmadi");
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0 && !showCheckout) {
    return (
      <div className="pb-20 px-4 pt-6 max-w-lg mx-auto">
        <h1 className="font-display text-xl font-bold text-foreground mb-4">Savat</h1>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <ShoppingCart size={48} className="mb-3 opacity-20" />
          <p className="text-sm">Savat bo'sh</p>
        </div>
      </div>
    );
  }

  if (showCheckout) {
    return (
      <div className="pb-20 px-4 pt-6 max-w-lg mx-auto animate-fade-in">
        <h1 className="font-display text-xl font-bold text-foreground mb-4">Rasmiylashtirish</h1>
        <div className="space-y-3">
          {[
            { key: "fullName" as const, label: "To'liq ism", placeholder: "Ismingiz" },
            { key: "phone" as const, label: "Telefon raqam", placeholder: "+998 90 123 45 67" },
            { key: "address" as const, label: "Manzil", placeholder: "Ko'cha, uy raqami" },
            { key: "district" as const, label: "Tuman / Shahar", placeholder: "Tuman nomi" },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
              <input
                type="text"
                value={form[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full bg-card rounded-xl py-2.5 px-3 text-sm text-foreground border border-border focus:border-primary/50 focus:outline-none"
              />
            </div>
          ))}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Izoh (ixtiyoriy)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Qo'shimcha izoh..."
              className="w-full bg-card rounded-xl py-2.5 px-3 text-sm text-foreground border border-border focus:border-primary/50 focus:outline-none resize-none h-20"
            />
          </div>

          <div className="luxury-card rounded-xl p-4 gold-glow">
            <div className="flex justify-between font-semibold">
              <span className="text-foreground">Jami</span>
              <span className="gold-text">{formatPrice(cartTotal)}</span>
            </div>
          </div>

          <button
            onClick={handleOrder}
            disabled={submitting}
            className="w-full gold-gradient text-primary-foreground font-semibold py-4 rounded-xl text-base transition-transform active:scale-[0.98] tracking-wide disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2 inline" />
                Yuborilmoqda...
              </>
            ) : (
              "Buyurtma berish"
            )}
          </button>
          <button
            onClick={() => setShowCheckout(false)}
            className="w-full bg-card text-foreground font-medium py-3 rounded-xl text-sm border border-border"
          >
            Ortga
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 px-4 pt-6 max-w-lg mx-auto">
      <h1 className="font-display text-xl font-bold text-foreground mb-4">Savat</h1>
      <div className="space-y-3">
        {cart.map(item => (
          <div key={item.id} className="luxury-card rounded-xl p-3 flex gap-3 animate-fade-in">
            <img src={item.product.images.default} alt={item.product.name} className="w-16 h-20 object-cover rounded-lg" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">{item.product.name}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {item.config.shtapik ? "Shtapikli" : "Shtapiksiz"} • {item.config.nalichnik} taraf • {item.config.doorType} tab.
              </p>
              <p className="text-sm font-semibold text-primary mt-1">{formatPrice(item.totalPrice)}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 rounded-md bg-card border border-border">
                  <Minus size={14} />
                </button>
                <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 rounded-md bg-card border border-border">
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <button onClick={() => removeFromCart(item.id)} className="p-1.5 self-start text-destructive/60 hover:text-destructive rounded-lg">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="luxury-card rounded-xl p-4 mt-4 gold-glow">
        <div className="flex justify-between font-semibold text-lg">
          <span className="text-foreground">Jami</span>
          <span className="gold-text">{formatPrice(cartTotal)}</span>
        </div>
      </div>

      <button
        onClick={() => setShowCheckout(true)}
        className="w-full gold-gradient text-primary-foreground font-semibold py-4 rounded-xl text-base mt-4 transition-transform active:scale-[0.98] tracking-wide"
      >
        Rasmiylashtirish
      </button>
    </div>
  );
}

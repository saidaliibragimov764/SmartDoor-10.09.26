import { Order, formatPrice } from "@/data/products";
import { ArrowLeft, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface ReceiptPageProps {
  order: Order;
  onBack: () => void;
}

export default function ReceiptPage({ order, onBack }: ReceiptPageProps) {
  const copyCode = () => {
    navigator.clipboard.writeText(order.code);
    toast.success("Kod nusxalandi!");
  };

  return (
    <div className="pb-20 px-4 pt-4 max-w-lg mx-auto animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground mb-4">
        <ArrowLeft size={18} /> Ortga
      </button>

      <div className="text-center mb-6">
        <CheckCircle size={48} className="text-primary mx-auto mb-2" />
        <h1 className="font-display text-xl font-bold text-foreground">Buyurtma qabul qilindi!</h1>
        <p className="text-xs text-muted-foreground mt-1">Ushbu chekni adminimizga yuboring</p>
      </div>

      <div className="glass-card rounded-2xl p-5 border border-border space-y-4">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Buyurtma kodi</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="font-display text-2xl font-bold gold-text">{order.code}</span>
            <button onClick={copyCode} className="p-1.5 rounded-lg hover:bg-secondary">
              <Copy size={16} className="text-primary" />
            </button>
          </div>
        </div>

        <div className="border-t border-border pt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mijoz</span>
            <span className="text-foreground">{order.customer.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Telefon</span>
            <span className="text-foreground">{order.customer.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Manzil</span>
            <span className="text-foreground text-right max-w-[60%]">{order.customer.address}, {order.customer.district}</span>
          </div>
        </div>

        <div className="border-t border-border pt-3 space-y-2">
          {order.items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <div>
                <p className="text-foreground font-medium">{item.product.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {item.config.shtapik ? "Shtapikli" : "Shtapiksiz"} • {item.config.nalichnik} taraf • {item.config.doorType} tab. × {item.quantity}
                </p>
              </div>
              <span className="text-foreground">{formatPrice(item.totalPrice)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-3 flex justify-between font-semibold">
          <span>Jami</span>
          <span className="gold-text text-lg">{formatPrice(order.totalPrice)}</span>
        </div>

        <div className="bg-accent/50 rounded-xl p-3 text-center">
          <p className="text-xs text-accent-foreground">
            📋 Holat: <span className="font-semibold">Tasdiq kutilmoqda</span>
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Admin siz bilan bog'lanadi. 70% oldindan to'lov talab qilinadi.
          </p>
        </div>
      </div>
    </div>
  );
}

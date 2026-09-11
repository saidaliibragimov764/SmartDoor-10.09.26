import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/context/AppContext";
import { formatPrice } from "@/data/products";
import { User, Package, MapPin, Phone, Pencil, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { profile, orders, updateProfile } = useAppState();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(profile);
  const [clicks, setClicks] = useState(0);
  const navigate = useNavigate();

  const handleTitleClick = () => {
    setClicks(prev => {
      const next = prev + 1;
      if (next >= 10) {
        navigate("/admin");
        return 0;
      }
      return next;
    });
  };

  const startEdit = () => {
    setForm(profile);
    setEditing(true);
  };

  const saveEdit = () => {
    updateProfile(form);
    setEditing(false);
  };

  return (
    <div className="pb-20 px-4 pt-6 max-w-lg mx-auto">
      <h1 onClick={handleTitleClick} className="font-display text-xl font-bold text-foreground mb-4 cursor-pointer select-none">Kabinet</h1>

      {/* Profile Info */}
      <div className="luxury-card rounded-xl p-4 mb-4">
        {editing ? (
          <div className="space-y-3">
            <Input
              placeholder="To'liq ism"
              value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
              className="bg-card border-border"
            />
            <Input
              placeholder="Telefon"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="bg-card border-border"
            />
            <Input
              placeholder="Manzil"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              className="bg-card border-border"
            />
            <Input
              placeholder="Tuman / Shahar"
              value={form.district}
              onChange={e => setForm({ ...form, district: e.target.value })}
              className="bg-card border-border"
            />
            <div className="flex gap-2">
              <Button onClick={saveEdit} size="sm" className="gold-gradient text-primary-foreground flex-1 gap-1">
                <Check size={14} /> Saqlash
              </Button>
              <Button onClick={() => setEditing(false)} size="sm" variant="outline" className="border-border flex-1 gap-1">
                <X size={14} /> Bekor
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full border border-primary/30 bg-card flex items-center justify-center">
                <User size={22} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">
                  {profile.fullName || "Ism kiritilmagan"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile.phone || "Telefon kiritilmagan"}
                </p>
              </div>
              <Button onClick={startEdit} size="icon" variant="ghost" className="text-primary h-8 w-8">
                <Pencil size={16} />
              </Button>
            </div>

            {profile.address && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin size={14} className="mt-0.5 shrink-0 text-primary/50" />
                <span>{profile.address}{profile.district ? `, ${profile.district}` : ""}</span>
              </div>
            )}

            {!profile.fullName && (
              <p className="text-xs text-muted-foreground mt-2">
                Buyurtma berganingizda ma'lumotlaringiz saqlanadi
              </p>
            )}
          </>
        )}
      </div>

      {/* Orders */}
      <h2 className="text-xs font-medium text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
        <Package size={14} />
        Buyurtmalar tarixi
      </h2>

      {orders.length === 0 ? (
        <div className="luxury-card rounded-xl p-6 text-center">
          <p className="text-sm text-muted-foreground">Hali buyurtmalar yo'q</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.code} className="luxury-card rounded-xl p-4 animate-fade-in">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-primary text-sm">{order.code}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("uz-UZ")}
                  </p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full border border-primary/20 text-primary font-medium">
                  {order.status === "pending" ? "Kutilmoqda" :
                   order.status === "confirmed" ? "Tasdiqlangan" :
                   order.status === "accepted" ? "Qabul qilingan" : "Ishlab chiqarilmoqda"}
                </span>
              </div>
              {order.items.map(item => (
                <p key={item.id} className="text-xs text-muted-foreground">
                  {item.product.name} × {item.quantity}
                </p>
              ))}
              <p className="text-sm font-semibold text-foreground mt-2">{formatPrice(order.totalPrice)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

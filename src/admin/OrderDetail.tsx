import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AdminOrder,
  AdminOrderStatus,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "@/data/adminData";
import { formatPrice } from "@/data/products";
import { Badge } from "@/components/ui/badge";

interface Props {
  order: AdminOrder;
  onUpdate: (u: Partial<AdminOrder>) => void;
}

const allStatuses: AdminOrderStatus[] = [
  "yangi", "tasdiqlanmoqda", "qabul_qilindi",
  "ishlab_chiqarishda", "tayyor", "yetkazildi", "bekor_qilindi",
];

const PAYMENT_LABELS: Record<string, string> = {
  unpaid: "To'lanmagan",
  prepaid: "Oldindan to'langan",
  paid: "To'liq to'langan",
};

export default function OrderDetail({ order, onUpdate }: Props) {
  const [notes, setNotes] = useState(order.notes);
  const [readyDate, setReadyDate] = useState(order.estimatedReadyDate);

  const item = order.items[0];

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display gold-text text-xl">{order.code}</DialogTitle>
        <div className="flex items-center gap-2 pt-1">
          <Badge className={`${ORDER_STATUS_COLORS[order.status]} border text-[10px]`}>
            {ORDER_STATUS_LABELS[order.status]}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString("uz-UZ")}
          </span>
        </div>
      </DialogHeader>

      <div className="space-y-5 text-sm">
        {/* Customer info */}
        <section className="space-y-1 p-3 rounded-lg bg-secondary/50">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Mijoz</h4>
          <p className="text-foreground font-medium">{order.customer.fullName}</p>
          <p className="text-muted-foreground">{order.customer.phone}</p>
          <p className="text-muted-foreground">{order.customer.address}, {order.customer.district}</p>
          {order.customer.notes && <p className="text-muted-foreground italic">"{order.customer.notes}"</p>}
        </section>

        {/* Product details */}
        {item && (
          <section className="space-y-1 p-3 rounded-lg bg-secondary/50">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Mahsulot</h4>
            <p className="text-foreground font-medium">{item.product.name}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground mt-1">
              <span>Rang: {item.config.color}</span>
              <span>Shtapik: {item.config.shtapik ? "Ha" : "Yo'q"}</span>
              <span>Nalichnik: {item.config.nalichnik} tomon</span>
              <span>Tabaqa: {item.config.doorType}</span>
              <span>O'lcham: {item.config.height}×{item.config.width}</span>
              <span>Soni: {item.quantity}</span>
            </div>
          </section>
        )}

        {/* Price & payment */}
        <section className="space-y-2 p-3 rounded-lg bg-secondary/50">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">To'lov</h4>
          <div className="grid grid-cols-2 gap-1">
            <span className="text-muted-foreground">Umumiy narx:</span>
            <span className="text-foreground font-medium">{formatPrice(order.totalPrice)}</span>
            <span className="text-muted-foreground">To'langan:</span>
            <span className="text-emerald-400">{formatPrice(order.prepaymentAmount)}</span>
            <span className="text-muted-foreground">Qoldiq:</span>
            <span className="text-yellow-400">{formatPrice(order.remainingAmount)}</span>
            <span className="text-muted-foreground">Holati:</span>
            <span className="text-foreground">{PAYMENT_LABELS[order.paymentStatus]}</span>
          </div>
          {order.paymentStatus !== "prepaid" && order.paymentStatus !== "paid" && (
            <Button
              size="sm"
              className="gold-gradient text-primary-foreground mt-2 w-full"
              onClick={() =>
                onUpdate({
                  paymentStatus: "prepaid",
                  prepaymentAmount: Math.round(order.totalPrice * 0.7),
                  remainingAmount: Math.round(order.totalPrice * 0.3),
                })
              }
            >
              70% oldindan to'lov qabul qilish
            </Button>
          )}
          {order.paymentStatus === "prepaid" && (
            <Button
              size="sm"
              className="gold-gradient text-primary-foreground mt-2 w-full"
              onClick={() =>
                onUpdate({
                  paymentStatus: "paid",
                  prepaymentAmount: order.totalPrice,
                  remainingAmount: 0,
                })
              }
            >
              To'liq to'lovni qabul qilish
            </Button>
          )}
        </section>

        {/* Status change */}
        <section className="space-y-2">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Holatni o'zgartirish</h4>
          <Select
            value={order.status}
            onValueChange={(v) => onUpdate({ status: v as AdminOrderStatus })}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {allStatuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {ORDER_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        {/* Estimated ready date */}
        <section className="space-y-2">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Tayyor bo'lish sanasi</h4>
          <Input
            type="date"
            value={readyDate}
            onChange={(e) => setReadyDate(e.target.value)}
            className="bg-secondary border-border"
          />
          <Button
            size="sm"
            variant="outline"
            className="w-full border-primary/30 text-primary"
            onClick={() => onUpdate({ estimatedReadyDate: readyDate })}
          >
            Saqlash
          </Button>
        </section>

        {/* Notes */}
        <section className="space-y-2">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Izoh</h4>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-secondary border-border min-h-[80px]"
            placeholder="Izoh qo'shish..."
          />
          <Button
            size="sm"
            variant="outline"
            className="w-full border-primary/30 text-primary"
            onClick={() => onUpdate({ notes })}
          >
            Izohni saqlash
          </Button>
        </section>
      </div>
    </>
  );
}

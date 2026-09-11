import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminOrder, ORDER_STATUS_LABELS } from "@/data/adminData";
import { formatPrice } from "@/data/products";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface Props {
  orders: AdminOrder[];
}

const paymentLabels = {
  unpaid: "To'lanmagan",
  prepaid: "70% to'langan",
  paid: "To'liq to'langan",
};

const paymentColors = {
  unpaid: "bg-red-500/20 text-red-400 border-red-500/30",
  prepaid: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  paid: "bg-green-500/20 text-green-400 border-green-500/30",
};

const paymentIcons = {
  unpaid: AlertTriangle,
  prepaid: Clock,
  paid: CheckCircle,
};

export default function AdminPayments({ orders }: Props) {
  const totalRevenue = orders.reduce((s, o) => s + o.totalPrice, 0);
  const totalPaid = orders.reduce((s, o) => s + o.prepaymentAmount, 0);
  const totalRemaining = totalRevenue - totalPaid;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="glass-card gold-border">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold gold-text">{formatPrice(totalRevenue)}</p>
            <p className="text-[10px] text-muted-foreground">Umumiy</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-emerald-400">{formatPrice(totalPaid)}</p>
            <p className="text-[10px] text-muted-foreground">To'langan</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-yellow-400">{formatPrice(totalRemaining)}</p>
            <p className="text-[10px] text-muted-foreground">Qoldiq</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment list */}
      <div className="space-y-3">
        {orders.map((order) => {
          const Icon = paymentIcons[order.paymentStatus];
          return (
            <Card key={order.id} className="glass-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center border ${paymentColors[order.paymentStatus]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-primary font-semibold">{order.code}</span>
                    <Badge className={`${paymentColors[order.paymentStatus]} border text-[10px]`}>
                      {paymentLabels[order.paymentStatus]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{order.customer.fullName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-foreground">{formatPrice(order.totalPrice)}</p>
                  {order.remainingAmount > 0 && (
                    <p className="text-[10px] text-yellow-400">Qoldiq: {formatPrice(order.remainingAmount)}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

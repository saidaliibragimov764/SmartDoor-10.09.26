import {
  ShoppingBag,
  Clock,
  CheckCircle,
  Factory,
  PackageCheck,
  Truck,
  XCircle,
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminOrder, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, AdminOrderStatus } from "@/data/adminData";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/data/products";
import { Progress } from "@/components/ui/progress";

const statusIcons: Record<AdminOrderStatus, React.ElementType> = {
  yangi: AlertCircle,
  tasdiqlanmoqda: Clock,
  qabul_qilindi: CheckCircle,
  ishlab_chiqarishda: Factory,
  tayyor: PackageCheck,
  yetkazildi: Truck,
  bekor_qilindi: XCircle,
};

const STATUS_FLOW: AdminOrderStatus[] = [
  "yangi", "tasdiqlanmoqda", "qabul_qilindi",
  "ishlab_chiqarishda", "tayyor", "yetkazildi", "bekor_qilindi",
];

interface Props {
  orders: AdminOrder[];
}

export default function AdminDashboard({ orders }: Props) {
  const countByStatus = (s: AdminOrderStatus) => orders.filter((o) => o.status === s).length;
  const totalRevenue = orders.reduce((s, o) => s + o.totalPrice, 0);
  const totalPaid = orders.reduce((s, o) => s + o.prepaymentAmount, 0);
  const totalRemaining = totalRevenue - totalPaid;
  const activeOrders = orders.filter((o) => !["yetkazildi", "bekor_qilindi"].includes(o.status)).length;
  const deliveredOrders = countByStatus("yetkazildi");
  const cancelledOrders = countByStatus("bekor_qilindi");
  const conversionRate = orders.length > 0 ? Math.round(((orders.length - cancelledOrders) / orders.length) * 100) : 0;
  const collectionRate = totalRevenue > 0 ? Math.round((totalPaid / totalRevenue) * 100) : 0;

  // Unique customers
  const uniqueCustomers = new Set(orders.map((o) => o.customer.phone)).size;

  // Average order value
  const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

  // This week orders
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeekOrders = orders.filter((o) => new Date(o.createdAt) >= weekAgo).length;

  return (
    <div className="space-y-6">
      {/* Top KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="glass-card gold-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="h-10 w-10 rounded-lg gold-gradient flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-primary-foreground" />
              </div>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary gap-0.5">
                <ArrowUpRight className="h-3 w-3" /> {thisWeekOrders} bu hafta
              </Badge>
            </div>
            <p className="text-2xl font-bold text-foreground">{orders.length}</p>
            <p className="text-xs text-muted-foreground">Jami buyurtmalar</p>
          </CardContent>
        </Card>

        <Card className="glass-card gold-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
            <p className="text-xl font-bold gold-text">{formatPrice(totalRevenue)}</p>
            <p className="text-xs text-muted-foreground">Umumiy tushum</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{uniqueCustomers}</p>
            <p className="text-xs text-muted-foreground">Mijozlar soni</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground">{formatPrice(avgOrderValue)}</p>
            <p className="text-xs text-muted-foreground">O'rtacha buyurtma</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">To'langan</span>
              <span className="text-emerald-400 text-xs font-medium">{collectionRate}%</span>
            </div>
            <p className="text-lg font-bold text-emerald-400">{formatPrice(totalPaid)}</p>
            <Progress value={collectionRate} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Qoldiq</span>
            </div>
            <p className="text-lg font-bold text-yellow-400">{formatPrice(totalRemaining)}</p>
            <Progress value={100 - collectionRate} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Konversiya</span>
              <span className="text-primary text-xs font-medium">{conversionRate}%</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-lg font-bold text-foreground">{deliveredOrders}</p>
              <span className="text-xs text-muted-foreground">yetkazildi / {orders.length} jami</span>
            </div>
            <Progress value={conversionRate} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Active pipeline */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display flex items-center gap-2">
            Faol buyurtmalar pipeline
            <Badge variant="outline" className="text-primary border-primary/30 text-[10px]">{activeOrders} ta faol</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {STATUS_FLOW.map((s) => {
              const Icon = statusIcons[s];
              const count = countByStatus(s);
              return (
                <div key={s} className={`flex items-center gap-3 p-3 rounded-lg border ${ORDER_STATUS_COLORS[s]}`}>
                  <Icon className="h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-xl font-bold">{count}</p>
                    <p className="text-[11px] leading-tight">{ORDER_STATUS_LABELS[s]}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent orders */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">So'nggi buyurtmalar</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {orders.slice(0, 6).map((order) => {
              const item = order.items[0];
              return (
                <div key={order.id} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm text-primary font-semibold">{order.code}</span>
                      <Badge className={`${ORDER_STATUS_COLORS[order.status]} border text-[10px]`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground">{order.customer.fullName}</p>
                    {item && (
                      <p className="text-[11px] text-muted-foreground">
                        {item.product.name} • {item.quantity} dona • {item.config.height}×{item.config.width}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("uz-UZ")}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-foreground">{formatPrice(order.totalPrice)}</p>
                    {order.remainingAmount > 0 && (
                      <p className="text-[10px] text-yellow-400">Qoldiq: {formatPrice(order.remainingAmount)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

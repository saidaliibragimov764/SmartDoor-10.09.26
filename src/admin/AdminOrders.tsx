import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AdminOrder, AdminOrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS,
} from "@/data/adminData";
import { formatPrice } from "@/data/products";
import { Eye, Search, Filter, X } from "lucide-react";
import OrderDetail from "./OrderDetail";

interface Props {
  orders: AdminOrder[];
  onUpdateOrder: (id: string, updates: Partial<AdminOrder>) => void;
}

const PAYMENT_LABELS: Record<string, string> = {
  all: "Barchasi",
  unpaid: "To'lanmagan",
  prepaid: "Oldindan to'langan",
  paid: "To'liq to'langan",
};

export default function AdminOrders({ orders, onUpdateOrder }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = statusFilter !== "all" || paymentFilter !== "all" || dateFrom || dateTo;

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.code.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.fullName.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.phone.includes(search);
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || o.paymentStatus === paymentFilter;
    let matchesDate = true;
    if (dateFrom) matchesDate = o.createdAt >= dateFrom;
    if (dateTo && matchesDate) matchesDate = o.createdAt <= dateTo + "T23:59:59";
    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  const clearFilters = () => {
    setStatusFilter("all");
    setPaymentFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="space-y-4">
      {/* Search and filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Qidirish (kod, ism, telefon)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          size="icon"
          className={showFilters ? "gold-gradient text-primary-foreground" : "border-primary/30 text-primary"}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card className="glass-card">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">Filterlar</h4>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="text-primary text-xs h-7" onClick={clearFilters}>
                  <X className="h-3 w-3 mr-1" /> Tozalash
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Holat</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-secondary border-border h-9"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all">Barchasi</SelectItem>
                    {(Object.keys(ORDER_STATUS_LABELS) as AdminOrderStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>{ORDER_STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">To'lov holati</label>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="bg-secondary border-border h-9"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {Object.entries(PAYMENT_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Sana (dan)</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-secondary border-border h-9" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Sana (gacha)</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-secondary border-border h-9" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active filter badges */}
      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap gap-1.5">
          {statusFilter !== "all" && (
            <Badge variant="secondary" className="text-xs gap-1">
              {ORDER_STATUS_LABELS[statusFilter as AdminOrderStatus]}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter("all")} />
            </Badge>
          )}
          {paymentFilter !== "all" && (
            <Badge variant="secondary" className="text-xs gap-1">
              {PAYMENT_LABELS[paymentFilter]}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setPaymentFilter("all")} />
            </Badge>
          )}
          {(dateFrom || dateTo) && (
            <Badge variant="secondary" className="text-xs gap-1">
              {dateFrom || "..."} — {dateTo || "..."}
              <X className="h-3 w-3 cursor-pointer" onClick={() => { setDateFrom(""); setDateTo(""); }} />
            </Badge>
          )}
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-muted-foreground">{filtered.length} ta buyurtma topildi</p>

      {/* Order cards — now with product details */}
      <div className="space-y-3">
        {filtered.map((order) => {
          const item = order.items[0];
          return (
            <Card key={order.id} className="glass-card cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setSelected(order)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm text-primary font-semibold">{order.code}</span>
                      <Badge className={`${ORDER_STATUS_COLORS[order.status]} border text-[10px]`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {PAYMENT_LABELS[order.paymentStatus]}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground font-medium">{order.customer.fullName}</p>
                    <p className="text-xs text-muted-foreground">{order.customer.phone} • {order.customer.district}</p>

                    {/* Product details on card */}
                    {item && (
                      <div className="mt-1 p-2 rounded-md bg-secondary/40 space-y-0.5">
                        <p className="text-xs text-foreground font-medium">{item.product.name}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                          <span>Rang: {item.config.color}</span>
                          <span>Shtapik: {item.config.shtapik ? "Ha" : "Yo'q"}</span>
                          <span>Nalichnik: {item.config.nalichnik} tomon</span>
                          <span>Tabaqa: {item.config.doorType}</span>
                          <span>O'lcham: {item.config.height}×{item.config.width}</span>
                          <span>Soni: {item.quantity}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-sm font-medium gold-text">{formatPrice(order.totalPrice)}</span>
                      {order.remainingAmount > 0 && order.paymentStatus !== "unpaid" && (
                        <span className="text-[10px] text-yellow-400">Qoldiq: {formatPrice(order.remainingAmount)}</span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(order.createdAt).toLocaleDateString("uz-UZ")}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary shrink-0"
                    onClick={(e) => { e.stopPropagation(); setSelected(order); }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Buyurtma topilmadi</p>
        )}
      </div>

      {/* Order detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto max-w-lg">
          {selected && (
            <OrderDetail
              order={selected}
              onUpdate={(updates) => {
                onUpdateOrder(selected.id, updates);
                setSelected({ ...selected, ...updates });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

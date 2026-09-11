import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AdminCustomer } from "@/data/adminData";
import { formatPrice } from "@/data/products";
import { Search, User, Phone, MapPin, ShoppingBag } from "lucide-react";

interface Props {
  customers: AdminCustomer[];
}

export default function AdminCustomers({ customers }: Props) {
  const [search, setSearch] = useState("");

  const filtered = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Mijoz qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card border-border"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((c) => (
          <Card key={c.id} className="glass-card">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full gold-gradient flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{c.fullName}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {c.phone}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {c.address}
              </p>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground">{c.ordersCount} buyurtma</span>
                </div>
                <Badge variant="outline" className="text-primary border-primary/30 text-[10px]">
                  {formatPrice(c.totalSpent)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

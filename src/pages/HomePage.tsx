import { useState } from "react";
import { Search } from "lucide-react";
import { getAllProducts, DoorProduct } from "@/data/products";
import ProductCard from "@/components/ProductCard";

interface HomePageProps {
  onSelectProduct: (product: DoorProduct) => void;
}

export default function HomePage({ onSelectProduct }: HomePageProps) {
  const [search, setSearch] = useState("");

  const filtered = getAllProducts().filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pb-20 px-4 pt-6 max-w-lg mx-auto">
      <div className="text-center mb-8">
        <h1 className="font-display text-2xl font-bold gold-text tracking-wide">Smart Door</h1>
        <p className="text-xs text-muted-foreground mt-1.5 tracking-widest uppercase">Premium eshiklar kolleksiyasi</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Qidirish..."
          className="w-full bg-card rounded-xl py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-primary/50 focus:outline-none transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filtered.map(p => (
          <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground mt-10 text-sm">Hech narsa topilmadi</p>
      )}
    </div>
  );
}

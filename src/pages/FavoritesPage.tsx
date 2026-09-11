import { getAllProducts, DoorProduct } from "@/data/products";
import { useAppState } from "@/context/AppContext";
import ProductCard from "@/components/ProductCard";
import { Heart } from "lucide-react";

interface FavoritesPageProps {
  onSelectProduct: (product: DoorProduct) => void;
}

export default function FavoritesPage({ onSelectProduct }: FavoritesPageProps) {
  const { favorites } = useAppState();
  const favProducts = getAllProducts().filter(p => favorites.includes(p.id));

  return (
    <div className="pb-20 px-4 pt-6 max-w-lg mx-auto">
      <h1 className="font-display text-xl font-bold text-foreground mb-4">Yoqtirilganlar</h1>

      {favProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Heart size={48} className="mb-3 opacity-20" />
          <p className="text-sm">Hali yoqtirilgan eshik yo'q</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {favProducts.map(p => (
            <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
          ))}
        </div>
      )}
    </div>
  );
}

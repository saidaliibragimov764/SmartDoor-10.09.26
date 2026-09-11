import { Heart } from "lucide-react";
import { DoorProduct, formatPrice } from "@/data/products";
import { useAppState } from "@/context/AppContext";

interface ProductCardProps {
  product: DoorProduct;
  onSelect: (product: DoorProduct) => void;
}

export default function ProductCard({ product, onSelect }: ProductCardProps) {
  const { toggleFavorite, isFavorite } = useAppState();
  const fav = isFavorite(product.id);

  return (
    <div
      className="luxury-card rounded-xl overflow-hidden animate-fade-in cursor-pointer group"
      onClick={() => onSelect(product)}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={product.images.default}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <button
          onClick={e => { e.stopPropagation(); toggleFavorite(product.id); }}
          className="absolute top-3 right-3 p-2 rounded-full bg-background/60 backdrop-blur-sm transition-colors"
        >
          <Heart
            size={18}
            className={fav ? "fill-primary text-primary" : "text-foreground/50"}
          />
        </button>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-display text-base font-semibold text-foreground">{product.name}</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{product.description}</p>
          <p className="text-primary font-semibold text-sm mt-1.5">{formatPrice(product.basePrice)} dan</p>
        </div>
      </div>
    </div>
  );
}

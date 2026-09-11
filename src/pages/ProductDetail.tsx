import { useState, useMemo } from "react";
import { ArrowLeft, Ruler, Building2, ChevronRight } from "lucide-react";
import { DoorProduct, DoorConfig, calculatePrice, formatPrice } from "@/data/products";
import { useAppState } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ProductDetailProps {
  product: DoorProduct;
  onBack: () => void;
  group?: { id: string; name: string; logoDataUrl?: string } | null;
}

export default function ProductDetail({ product, onBack }: ProductDetailProps) {
  const { addToCart } = useAppState();

  // Build default custom selections from first option in each group
  const defaultCustomSelections = useMemo(() => {
    const sel: Record<string, string> = {};
    (product.customOptions || []).forEach(g => {
      if (g.options.length > 0) sel[g.id] = g.options[0].id;
    });
    return sel;
  }, [product]);

  const [config, setConfig] = useState<DoorConfig>({
    productId: product.id,
    color: product.colors[0]?.key || "",
    shtapik: false,
    nalichnik: "1",
    doorType: "1",
    height: "2050",
    width: "860",
    customSelections: defaultCustomSelections,
  });
  const [showRuletka, setShowRuletka] = useState(false);

  const hasCustomOptions = (product.customOptions || []).length > 0;
  const hasMappings = (product.imageMappings || []).length > 0;

  // Resolve current image using per-color config first, then legacy mappings
  const currentImage = useMemo(() => {
    // 1. Per-color config (new system)
    const perColorCfg = (product.perColorConfigs || []).find(pc => pc.colorKey === config.color);
    if (perColorCfg) {
      // Check option selections within this color's config
      if (config.customSelections) {
        for (const optId of Object.values(config.customSelections)) {
          const mapping = perColorCfg.imageMappings.find(m => m.triggerId === optId);
          if (mapping && product.images[mapping.imageKey]) {
            return product.images[mapping.imageKey];
          }
        }
      }
      // Color's default image
      if (perColorCfg.defaultImageKey && product.images[perColorCfg.defaultImageKey]) {
        return product.images[perColorCfg.defaultImageKey];
      }
    }

    // 2. Legacy global mappings fallback
    if (hasMappings) {
      const mappings = product.imageMappings!;
      if (config.customSelections) {
        for (const optId of Object.values(config.customSelections)) {
          const mapping = mappings.find(m => m.triggerId === optId);
          if (mapping && product.images[mapping.imageKey]) {
            return product.images[mapping.imageKey];
          }
        }
      }
      const colorMapping = mappings.find(m => m.triggerType === "color" && m.triggerId === config.color);
      if (colorMapping && product.images[colorMapping.imageKey]) {
        return product.images[colorMapping.imageKey];
      }
    }

    // 3. Color image fallback
    const selectedColorObj = product.colors.find(c => c.key === config.color);
    if (selectedColorObj?.image) return selectedColorObj.image;

    // 4. Legacy shtapik fallback
    if (config.shtapik && product.images.shtapik) return product.images.shtapik;
    return product.images.noshtapik || product.images.default;
  }, [config.color, config.customSelections, config.shtapik, hasMappings, product]);

  const selectedColor = product.colors.find(c => c.key === config.color);

  // Calculate price with custom option price adds
  const price = useMemo(() => {
    let base = calculatePrice(product, config);
    if (config.customSelections && product.customOptions) {
      for (const group of product.customOptions) {
        const selectedOptId = config.customSelections[group.id];
        const opt = group.options.find(o => o.id === selectedOptId);
        if (opt?.priceAdd) base += opt.priceAdd;
      }
    }
    return base;
  }, [product, config]);

  const handleAddToCart = () => {
    addToCart(product, config);
    toast.success("Savatga qo'shildi!");
    onBack();
  };

  // Extra costs display
  const extraCosts: { label: string; amount: number }[] = [];
  if (hasCustomOptions) {
    // Admin-defined products: show only custom option costs
    if (config.customSelections && product.customOptions) {
      for (const group of product.customOptions) {
        const selectedOptId = config.customSelections[group.id];
        const opt = group.options.find(o => o.id === selectedOptId);
        if (opt?.priceAdd && opt.priceAdd > 0) {
          extraCosts.push({ label: `${group.label}: ${opt.label}`, amount: opt.priceAdd });
        }
      }
    }
  } else {
    // Legacy built-in products
    if (config.shtapik) extraCosts.push({ label: "Shtapik", amount: 150_000 });
    if (config.nalichnik === "2") extraCosts.push({ label: "2 taraflama nalichnik", amount: 200_000 });
    if (config.doorType === "1.5") extraCosts.push({ label: "1.5 tabaqalik", amount: 400_000 });
    if (config.doorType === "2") extraCosts.push({ label: "2 tabaqalik", amount: 800_000 });
  }

  return (
    <div className="pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-card transition-colors">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h2 className="font-display font-semibold text-foreground">{product.name}</h2>
      </div>

      {/* Product Image */}
      <div className="relative aspect-[3/4] mx-4 mt-4 rounded-xl overflow-hidden luxury-card">
        <img
          src={currentImage}
          alt={product.name}
          className="w-full h-full object-cover transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
        {selectedColor && (
          <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm">
            <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: selectedColor.hex }} />
            <span className="text-xs text-foreground">{selectedColor.name}</span>
          </div>
        )}
      </div>

      <div className="px-4 mt-6 space-y-6">
        {/* Colors */}
        <section>
          <h3 className="text-xs font-medium text-primary uppercase tracking-wider mb-3">Rang tanlang</h3>
          <div className="flex gap-3 flex-wrap">
            {product.colors.map(c => (
              <button
                key={c.key}
                onClick={() => setConfig(prev => ({ ...prev, color: c.key }))}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                  config.color === c.key ? "ring-1 ring-primary bg-card" : "hover:bg-card/50"
                }`}
              >
                {c.image ? (
                  <div className="w-8 h-8 rounded-full border border-border overflow-hidden">
                    <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full border border-border" style={{ backgroundColor: c.hex }} />
                )}
                <span className="text-[10px] text-muted-foreground">{c.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Custom option groups (from admin) */}
        {hasCustomOptions && (product.customOptions || []).map(group => (
          <section key={group.id}>
            <h3 className="text-xs font-medium text-primary uppercase tracking-wider mb-3">{group.label}</h3>
            <div className="flex gap-2 flex-wrap">
              {group.options.map(opt => {
                const isSelected = config.customSelections?.[group.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setConfig(prev => ({
                      ...prev,
                      customSelections: { ...prev.customSelections, [group.id]: opt.id },
                    }))}
                    className={`flex-1 min-w-[80px] py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isSelected
                        ? "gold-gradient text-primary-foreground"
                        : "bg-card text-foreground border border-border hover:border-primary/30"
                    }`}
                  >
                    <div>{opt.label}</div>
                    {opt.priceAdd > 0 && <div className="text-[10px] opacity-70">+{formatPrice(opt.priceAdd)}</div>}
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        {/* Legacy built-in options (for core products without customOptions) */}
        {!hasCustomOptions && (
          <>
            <section>
              <h3 className="text-xs font-medium text-primary uppercase tracking-wider mb-3">Shtapik</h3>
              <div className="flex gap-3">
                {[
                  { value: true, label: "Shtapikli" },
                  { value: false, label: "Shtapiksiz" },
                ].map(opt => (
                  <button
                    key={String(opt.value)}
                    onClick={() => setConfig(prev => ({ ...prev, shtapik: opt.value }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      config.shtapik === opt.value
                        ? "gold-gradient text-primary-foreground"
                        : "bg-card text-foreground border border-border hover:border-primary/30"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-medium text-primary uppercase tracking-wider mb-3">Nalichnik</h3>
              <div className="flex gap-3">
                {[
                  { value: "1" as const, label: "1 taraflama", sub: "Bepul" },
                  { value: "2" as const, label: "2 taraflama", sub: "+200,000" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setConfig(prev => ({ ...prev, nalichnik: opt.value }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      config.nalichnik === opt.value
                        ? "gold-gradient text-primary-foreground"
                        : "bg-card text-foreground border border-border hover:border-primary/30"
                    }`}
                  >
                    <div>{opt.label}</div>
                    <div className="text-[10px] opacity-70">{opt.sub}</div>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-medium text-primary uppercase tracking-wider mb-3">Tabaqa turi</h3>
              <div className="flex gap-2">
                {[
                  { value: "1" as const, label: "1 tabaqalik" },
                  { value: "1.5" as const, label: "1.5 tabaqalik" },
                  { value: "2" as const, label: "2 tabaqalik" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setConfig(prev => ({ ...prev, doorType: opt.value }))}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      config.doorType === opt.value
                        ? "gold-gradient text-primary-foreground"
                        : "bg-card text-foreground border border-border hover:border-primary/30"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Size */}
        <section>
          <h3 className="text-xs font-medium text-primary uppercase tracking-wider mb-3">O'lcham (mm)</h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground mb-1 block">Bo'yi</label>
              <input
                type="number"
                value={config.height}
                onChange={e => setConfig(prev => ({ ...prev, height: e.target.value }))}
                className="w-full bg-card rounded-xl py-2.5 px-3 text-sm text-foreground border border-border focus:border-primary/50 focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground mb-1 block">Eni</label>
              <input
                type="number"
                value={config.width}
                onChange={e => setConfig(prev => ({ ...prev, width: e.target.value }))}
                className="w-full bg-card rounded-xl py-2.5 px-3 text-sm text-foreground border border-border focus:border-primary/50 focus:outline-none"
              />
            </div>
            <button
              onClick={() => setShowRuletka(true)}
              className="p-2.5 rounded-xl border border-primary/20 text-primary hover:bg-primary/10 transition-colors"
              title="Ruletka xizmati"
            >
              <Ruler size={20} />
            </button>
          </div>
        </section>

        {/* Ruletka Modal */}
        {showRuletka && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4" onClick={() => setShowRuletka(false)}>
            <div className="luxury-card rounded-2xl p-6 max-w-sm w-full gold-glow" onClick={e => e.stopPropagation()}>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">📏 Ruletka xizmati</h3>
              <p className="text-sm text-muted-foreground mb-4">Agar o'lchamingizni bilmasangiz, bizning mutaxassis sizga yordam beradi.</p>
              <p className="text-sm text-primary font-medium mb-4">Telefon: +998 90 123 45 67</p>
              <button onClick={() => setShowRuletka(false)} className="w-full gold-gradient text-primary-foreground font-medium py-2.5 rounded-xl">Yopish</button>
            </div>
          </div>
        )}

        {/* Price Summary */}
        <section className="luxury-card rounded-xl p-4 gold-glow">
          <h3 className="text-xs font-medium text-primary uppercase tracking-wider mb-3">Narx kalkulyatori</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Asosiy narx</span>
              <span className="text-foreground">{formatPrice(product.basePrice)}</span>
            </div>
            {extraCosts.map(c => (
              <div key={c.label} className="flex justify-between text-muted-foreground">
                <span>{c.label}</span>
                <span className="text-foreground">+{formatPrice(c.amount)}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 mt-2 flex justify-between font-semibold">
              <span className="text-foreground">Jami</span>
              <span className="gold-text text-lg">{formatPrice(price)}</span>
            </div>
          </div>
        </section>

        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          className="w-full gold-gradient text-primary-foreground font-semibold py-4 rounded-xl text-base transition-transform active:scale-[0.98] tracking-wide"
        >
          Savatga yuborish
        </button>
      </div>
    </div>
  );
}

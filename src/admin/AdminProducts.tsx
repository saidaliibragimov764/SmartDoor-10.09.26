import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DoorProduct, ProductColor, CustomOptionGroup, CustomOption, ImageMapping, PerColorConfig, formatPrice } from "@/data/products";
import { Plus, Edit, Palette, Trash2, ImagePlus, X, Link2, ChevronDown, ChevronUp } from "lucide-react";
import { AdminSession, getApiBaseUrl, getAuthHeaders } from "./adminAuth";

const LS_KEY = "smartdoor_admin_products";

const RECOMMENDED_COLORS: ProductColor[] = [
  { name: "Qo'ng'ir", hex: "#5C3A1E", key: "brown" },
  { name: "Oq", hex: "#F5F5F0", key: "white" },
  { name: "Kulrang", hex: "#8A8A8A", key: "gray" },
  { name: "Qora yong'oq", hex: "#3B2314", key: "walnut" },
  { name: "Krem", hex: "#F5E6CC", key: "cream" },
  { name: "Mahogany", hex: "#4E2728", key: "mahogany" },
  { name: "Antrasit", hex: "#3C3C3C", key: "anthracite" },
  { name: "Oltin", hex: "#C9A84C", key: "gold" },
];

const DEFAULT_OPTION_GROUPS: CustomOptionGroup[] = [
  {
    id: "shtapik",
    label: "Shtapik",
    options: [
      { id: "shtapikli", label: "Shtapikli", priceAdd: 150000 },
      { id: "shtapiksiz", label: "Shtapiksiz", priceAdd: 0 },
    ],
  },
  {
    id: "nalichnik",
    label: "Nalichnik",
    options: [
      { id: "nalichnik_1", label: "1 tomonlama", priceAdd: 0 },
      { id: "nalichnik_2", label: "2 tomonlama", priceAdd: 200000 },
    ],
  },
  {
    id: "doorType",
    label: "Tabaqa turi",
    options: [
      { id: "door_1", label: "1 tabaqalik", priceAdd: 0 },
      { id: "door_1_5", label: "1.5 tabaqalik", priceAdd: 400000 },
      { id: "door_2", label: "2 tabaqalik", priceAdd: 800000 },
    ],
  },
];

export default function AdminProducts({ session }: { session: AdminSession }) {
  const [productList, setProductList] = useState<DoorProduct[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [editing, setEditing] = useState<DoorProduct | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadProductsFromBackend = () => {
    setLoading(true);
    fetch(`${getApiBaseUrl()}/api/products`, { headers: { ...getAuthHeaders() } })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.products)) {
          setProductList(data.products);
          localStorage.setItem(LS_KEY, JSON.stringify(data.products));
        }
      })
      .catch((err) => console.error("Error loading products:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProductsFromBackend();

    if (session?.role === "super_admin") {
      fetch(`${getApiBaseUrl()}/api/groups/list`, { headers: { ...getAuthHeaders() } })
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data?.groups)) {
            setGroups(data.groups);
          }
        })
        .catch(() => {});
    }
  }, [session]);

  const openNew = () => {
    setIsNew(true);
    setEditing({
      id: Date.now().toString(),
      name: "",
      description: "",
      basePrice: 0,
      images: {},
      colors: [],
      customOptions: DEFAULT_OPTION_GROUPS.map(g => ({ ...g, options: g.options.map(o => ({ ...o })) })),
      imageMappings: [],
      perColorConfigs: [],
    });
  };

  const save = async (p: DoorProduct) => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(p),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        window.alert(data?.message || "Saqlab bo'lmadi");
        return;
      }
      setEditing(null);
      setIsNew(false);
      loadProductsFromBackend();
    } catch {
      window.alert("Backend bilan aloqa yo'q");
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Mahsulotni o'chirishni tasdiqlaysizmi?")) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/products/${id}`, {
        method: "DELETE",
        headers: { ...getAuthHeaders() },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        window.alert(data?.message || "O'chirib bo'lmadi");
        return;
      }
      loadProductsFromBackend();
    } catch {
      window.alert("Backend bilan aloqa yo'q");
    }
  };

  return (
    <div className="space-y-4">
      <Button className="gold-gradient text-primary-foreground w-full sm:w-auto" onClick={openNew}>
        <Plus className="h-4 w-4 mr-1" /> Yangi mahsulot
      </Button>

      {loading ? (
        <div className="luxury-card rounded-xl p-8 text-center italic text-muted-foreground text-sm">
          Yuklanmoqda...
        </div>
      ) : productList.length === 0 ? (
        <div className="luxury-card rounded-xl p-8 text-center">
          <PackageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">Hozircha mahsulot yo'q. Yangi mahsulot qo'shing.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {productList.map(p => (
            <Card key={p.id} className="luxury-card overflow-hidden">
              <div className="h-40 overflow-hidden bg-secondary">
                {p.images.default ? (
                  <img src={p.images.default} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ImagePlus className="h-8 w-8" />
                  </div>
                )}
              </div>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-semibold text-foreground">{p.name || "Nomsiz"}</h3>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="text-primary h-8 w-8" onClick={() => { setIsNew(false); setEditing(p); }}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => deleteProduct(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium gold-text">{formatPrice(p.basePrice)}</span>
                    {p.groupId && session?.role === "super_admin" && (
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        Guruh: {groups.find(g => g.id === p.groupId)?.name || p.groupId}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 self-end">
                    {p.colors.map(c => (
                      <span key={c.key} className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: c.hex }} />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={() => { setEditing(null); setIsNew(false); }}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto max-w-2xl p-0">
          {editing && <ProductForm product={editing} onSave={save} isNew={isNew} session={session} groups={groups} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PackageIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16.5 9.4 7.55 4.24" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" x2="12" y1="22" y2="12" />
    </svg>
  );
}

/* ── Section wrapper ── */
function EditorSection({ title, icon, children, defaultOpen = true }: { title: string; icon?: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-secondary/30 transition-colors">
        <span className="text-xs font-medium text-primary uppercase tracking-wider flex items-center gap-2">
          {icon}{title}
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5 space-y-3">{children}</div>}
    </div>
  );
}

/* ── Main product form ── */
export function ProductForm({
  product,
  onSave,
  isNew,
  session,
  groups = [],
}: {
  product: DoorProduct;
  onSave: (p: DoorProduct) => void;
  isNew: boolean;
  session?: AdminSession;
  groups?: { id: string; name: string }[];
}) {
  const [form, setForm] = useState<DoorProduct>(() => ({
    ...product,
    colors: [...product.colors],
    customOptions: product.customOptions
      ? product.customOptions.map(g => ({ ...g, options: g.options.map(o => ({ ...o })) }))
      : DEFAULT_OPTION_GROUPS.map(g => ({ ...g, options: g.options.map(o => ({ ...o })) })),
    imageMappings: product.imageMappings ? [...product.imageMappings] : [],
    perColorConfigs: product.perColorConfigs ? product.perColorConfigs.map(pc => ({ ...pc, imageMappings: [...pc.imageMappings] })) : [],
  }));
  const [imagePreviews, setImagePreviews] = useState<{ key: string; src: string }[]>(() =>
    Object.entries(product.images).filter(([, v]) => v).map(([k, v]) => ({ key: k, src: v }))
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const colorFileRef = useRef<HTMLInputElement>(null);
  const [colorUploadKey, setColorUploadKey] = useState<string | null>(null);

  // Color form
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#8B7355");
  const [showColorForm, setShowColorForm] = useState(false);
  const [showRecommended, setShowRecommended] = useState(false);

  // New option group form
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupLabel, setNewGroupLabel] = useState("");

  /* ── Image helpers ── */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const dataUrl = ev.target?.result as string;
        const key = `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        setImagePreviews(prev => [...prev, { key, src: dataUrl }]);
        setForm(prev => ({
          ...prev,
          images: {
            ...prev.images,
            [key]: dataUrl,
            default: prev.images.default || dataUrl,
          },
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (key: string) => {
    setImagePreviews(prev => prev.filter(p => p.key !== key));
    setForm(prev => {
      const newImages = { ...prev.images };
      delete newImages[key];
      if (key === "default" || !newImages.default) {
        const firstRemaining = Object.values(newImages)[0];
        if (firstRemaining) newImages.default = firstRemaining;
      }
      // Remove mappings pointing to this image
      const newMappings = (prev.imageMappings || []).filter(m => m.imageKey !== key);
      return { ...prev, images: newImages, imageMappings: newMappings };
    });
  };

  /* ── Color helpers ── */
  const addColor = () => {
    if (!newColorName.trim()) return;
    const key = newColorName.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now();
    setForm(prev => ({
      ...prev,
      colors: [...prev.colors, { name: newColorName, hex: newColorHex, key }],
    }));
    setNewColorName("");
    setNewColorHex("#8B7355");
    setShowColorForm(false);
  };

  const addRecommendedColor = (rc: ProductColor) => {
    if (form.colors.some(c => c.key === rc.key)) return;
    setForm(prev => ({ ...prev, colors: [...prev.colors, { ...rc }] }));
  };

  const removeColor = (key: string) => {
    setForm(prev => ({
      ...prev,
      colors: prev.colors.filter(c => c.key !== key),
      imageMappings: (prev.imageMappings || []).filter(m => !(m.triggerType === "color" && m.triggerId === key)),
    }));
  };

  const handleColorImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!colorUploadKey || !e.target.files?.[0]) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      setForm(prev => ({
        ...prev,
        colors: prev.colors.map(c => c.key === colorUploadKey ? { ...c, image: dataUrl } : c),
      }));
      setColorUploadKey(null);
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  /* ── Option group helpers ── */
  const addOptionGroup = () => {
    if (!newGroupLabel.trim()) return;
    const group: CustomOptionGroup = {
      id: `group_${Date.now()}`,
      label: newGroupLabel,
      options: [],
    };
    setForm(prev => ({ ...prev, customOptions: [...(prev.customOptions || []), group] }));
    setNewGroupLabel("");
    setShowNewGroup(false);
  };

  const removeOptionGroup = (gid: string) => {
    setForm(prev => ({
      ...prev,
      customOptions: (prev.customOptions || []).filter(g => g.id !== gid),
      imageMappings: (prev.imageMappings || []).filter(m => {
        const group = (prev.customOptions || []).find(g => g.id === gid);
        if (!group) return true;
        return !group.options.some(o => o.id === m.triggerId);
      }),
    }));
  };

  const updateGroupLabel = (gid: string, label: string) => {
    setForm(prev => ({
      ...prev,
      customOptions: (prev.customOptions || []).map(g => g.id === gid ? { ...g, label } : g),
    }));
  };

  const addOptionToGroup = (gid: string) => {
    const opt: CustomOption = { id: `opt_${Date.now()}`, label: "Yangi variant", priceAdd: 0 };
    setForm(prev => ({
      ...prev,
      customOptions: (prev.customOptions || []).map(g =>
        g.id === gid ? { ...g, options: [...g.options, opt] } : g
      ),
    }));
  };

  const updateOption = (gid: string, oid: string, updates: Partial<CustomOption>) => {
    setForm(prev => ({
      ...prev,
      customOptions: (prev.customOptions || []).map(g =>
        g.id === gid ? { ...g, options: g.options.map(o => o.id === oid ? { ...o, ...updates } : o) } : g
      ),
    }));
  };

  const removeOption = (gid: string, oid: string) => {
    setForm(prev => ({
      ...prev,
      customOptions: (prev.customOptions || []).map(g =>
        g.id === gid ? { ...g, options: g.options.filter(o => o.id !== oid) } : g
      ),
      imageMappings: (prev.imageMappings || []).filter(m => m.triggerId !== oid),
    }));
  };

  /* ── Image mapping helpers (legacy global) ── */
  const allTriggers: { id: string; type: "color" | "option"; label: string }[] = [
    ...form.colors.map(c => ({ id: c.key, type: "color" as const, label: `🎨 ${c.name}` })),
    ...(form.customOptions || []).flatMap(g =>
      g.options.map(o => ({ id: o.id, type: "option" as const, label: `${g.label}: ${o.label}` }))
    ),
  ];

  const imageKeys = imagePreviews.map(p => p.key);

  const setMapping = (triggerId: string, triggerType: "color" | "option", triggerLabel: string, imageKey: string) => {
    setForm(prev => {
      const existing = (prev.imageMappings || []).filter(m => m.triggerId !== triggerId);
      return { ...prev, imageMappings: [...existing, { triggerId, triggerType, triggerLabel, imageKey }] };
    });
  };

  const getMappedImageKey = (triggerId: string): string => {
    return (form.imageMappings || []).find(m => m.triggerId === triggerId)?.imageKey || "";
  };

  /* ── Per-color config helpers ── */
  const getColorConfig = (colorKey: string): PerColorConfig => {
    return (form.perColorConfigs || []).find(pc => pc.colorKey === colorKey) || { colorKey, imageMappings: [] };
  };

  const setPerColorMapping = (colorKey: string, triggerId: string, imageKey: string) => {
    setForm(prev => {
      const configs = [...(prev.perColorConfigs || [])];
      let cfg = configs.find(pc => pc.colorKey === colorKey);
      if (!cfg) {
        cfg = { colorKey, imageMappings: [] };
        configs.push(cfg);
      }
      cfg.imageMappings = cfg.imageMappings.filter(m => m.triggerId !== triggerId);
      if (imageKey) cfg.imageMappings.push({ triggerId, imageKey });
      return { ...prev, perColorConfigs: configs };
    });
  };

  const setPerColorDefault = (colorKey: string, imageKey: string) => {
    setForm(prev => {
      const configs = [...(prev.perColorConfigs || [])];
      let cfg = configs.find(pc => pc.colorKey === colorKey);
      if (!cfg) {
        cfg = { colorKey, imageMappings: [] };
        configs.push(cfg);
      }
      cfg.defaultImageKey = imageKey || undefined;
      return { ...prev, perColorConfigs: configs };
    });
  };

  const optionTriggers = (form.customOptions || []).flatMap(g =>
    g.options.map(o => ({ id: o.id, label: `${g.label}: ${o.label}` }))
  );

  return (
    <>
      <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
        <DialogTitle className="font-display gold-text text-lg">
          {isNew ? "Yangi mahsulot" : "Mahsulotni tahrirlash"}
        </DialogTitle>
      </DialogHeader>

      {/* ── 1. Basic Info ── */}
      <EditorSection title="Asosiy ma'lumotlar">
        <div>
          <label className="text-xs text-muted-foreground">Nomi</label>
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border mt-1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Tavsifi</label>
          <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-secondary border-border mt-1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Asosiy narx (so'm)</label>
          <Input type="number" value={form.basePrice} onChange={e => setForm({ ...form, basePrice: Number(e.target.value) })} className="bg-secondary border-border mt-1" />
        </div>
        {session?.role === "super_admin" && (
          <div className="mt-3">
            <label className="text-xs text-muted-foreground block mb-1">Guruh (Kompaniya/Filial)</label>
            <select
              value={form.groupId || ""}
              onChange={e => setForm({ ...form, groupId: e.target.value || undefined })}
              className="w-full bg-secondary border border-border rounded-md text-xs h-9 px-3 text-foreground focus:outline-none focus:border-primary/50"
            >
              <option value="">Umumiy (Hamma uchun / Bosh admin)</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        )}
      </EditorSection>

      {/* ── 2. Images ── */}
      <EditorSection title="Rasmlar" icon={<ImagePlus className="h-3.5 w-3.5" />}>
        <div className="flex flex-wrap gap-2">
          {imagePreviews.map((img, idx) => (
            <div key={img.key} className="relative group">
              <div className="w-20 h-20 rounded-lg overflow-hidden border border-border">
                <img src={img.src} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-1 left-0 right-0 text-center">
                <span className="text-[10px] font-medium bg-primary/80 text-primary-foreground px-1.5 rounded">{idx === 0 && img.key === "default" ? "Rasm 1 ★" : `Rasm ${idx + 1}`}</span>
              </div>
              <button onClick={() => removeImage(img.key)} className="absolute -top-1 -right-1 bg-destructive rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="h-3 w-3 text-destructive-foreground" />
              </button>
            </div>
          ))}
          <button onClick={() => fileRef.current?.click()} className="w-20 h-20 rounded-lg border border-dashed border-primary/30 flex items-center justify-center text-primary hover:bg-primary/5 transition-colors">
            <ImagePlus className="h-5 w-5" />
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
      </EditorSection>

      {/* ── 3. Colors ── */}
      <EditorSection title="Ranglar" icon={<Palette className="h-3.5 w-3.5" />}>
        <div className="space-y-2">
          {form.colors.map(c => (
            <div key={c.key} className="flex items-center gap-2 luxury-card rounded-lg p-2">
              <span className="h-7 w-7 rounded-full border border-border shrink-0" style={{ backgroundColor: c.hex }} />
              <span className="text-foreground text-xs flex-1">{c.name}</span>
              {c.image ? (
                <div className="w-7 h-7 rounded border border-primary/30 overflow-hidden">
                  <img src={c.image} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <button
                  onClick={() => { setColorUploadKey(c.key); colorFileRef.current?.click(); }}
                  className="text-[10px] text-primary hover:underline"
                >
                  + rasm
                </button>
              )}
              <button onClick={() => removeColor(c.key)} className="text-destructive hover:text-destructive/80">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <input ref={colorFileRef} type="file" accept="image/*" className="hidden" onChange={handleColorImageUpload} />

        {/* Recommended colors */}
        <div>
          <button onClick={() => setShowRecommended(!showRecommended)} className="text-xs text-primary/70 hover:text-primary transition-colors">
            {showRecommended ? "Tavsiya ranglarni yashirish" : "📌 Tavsiya etilgan ranglar"}
          </button>
          {showRecommended && (
            <div className="flex flex-wrap gap-2 mt-2">
              {RECOMMENDED_COLORS.filter(rc => !form.colors.some(c => c.key === rc.key)).map(rc => (
                <button
                  key={rc.key}
                  onClick={() => addRecommendedColor(rc)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-border hover:border-primary/30 transition-colors text-xs text-muted-foreground"
                >
                  <span className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: rc.hex }} />
                  {rc.name}
                  <Plus className="h-3 w-3 text-primary" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Custom color form */}
        {showColorForm ? (
          <div className="luxury-card rounded-lg p-3 space-y-2">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Rang nomi</label>
                <Input value={newColorName} onChange={e => setNewColorName(e.target.value)} placeholder="Masalan: Oltin" className="bg-secondary border-border mt-1 h-8 text-xs" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Rang</label>
                <div className="mt-1">
                  <input type="color" value={newColorHex} onChange={e => setNewColorHex(e.target.value)} className="h-8 w-10 rounded border-0 cursor-pointer bg-transparent" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="gold-gradient text-primary-foreground text-xs h-7" onClick={addColor}>Qo'shish</Button>
              <Button size="sm" variant="ghost" className="text-xs h-7 text-muted-foreground" onClick={() => setShowColorForm(false)}>Bekor</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="text-xs border-primary/20 text-primary hover:bg-primary/5" onClick={() => setShowColorForm(true)}>
            <Plus className="h-3 w-3 mr-1" /> Yangi rang qo'shish
          </Button>
        )}
      </EditorSection>

      {/* ── 4. Customization Options ── */}
      <EditorSection title="Sozlash variantlari">
        {(form.customOptions || []).map(group => (
          <div key={group.id} className="luxury-card rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={group.label}
                onChange={e => updateGroupLabel(group.id, e.target.value)}
                className="bg-secondary border-border h-7 text-xs flex-1 font-medium"
              />
              <button onClick={() => removeOptionGroup(group.id)} className="text-destructive hover:text-destructive/80">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-1.5 pl-2">
              {group.options.map(opt => (
                <div key={opt.id} className="flex items-center gap-2">
                  <Input
                    value={opt.label}
                    onChange={e => updateOption(group.id, opt.id, { label: e.target.value })}
                    className="bg-secondary border-border h-7 text-xs flex-1"
                  />
                  <Input
                    type="number"
                    value={opt.priceAdd}
                    onChange={e => updateOption(group.id, opt.id, { priceAdd: Number(e.target.value) })}
                    className="bg-secondary border-border h-7 text-xs w-24"
                    placeholder="Narx +/-"
                  />
                  <button onClick={() => removeOption(group.id, opt.id)} className="text-destructive/60 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="text-xs h-6 text-primary" onClick={() => addOptionToGroup(group.id)}>
              <Plus className="h-3 w-3 mr-1" /> Variant qo'shish
            </Button>
          </div>
        ))}

        {showNewGroup ? (
          <div className="luxury-card rounded-lg p-3 space-y-2">
            <Input
              value={newGroupLabel}
              onChange={e => setNewGroupLabel(e.target.value)}
              placeholder="Guruh nomi (masalan: Material)"
              className="bg-secondary border-border h-8 text-xs"
            />
            <div className="flex gap-2">
              <Button size="sm" className="gold-gradient text-primary-foreground text-xs h-7" onClick={addOptionGroup}>Qo'shish</Button>
              <Button size="sm" variant="ghost" className="text-xs h-7 text-muted-foreground" onClick={() => setShowNewGroup(false)}>Bekor</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="text-xs border-primary/20 text-primary hover:bg-primary/5" onClick={() => setShowNewGroup(true)}>
            <Plus className="h-3 w-3 mr-1" /> Yangi guruh qo'shish
          </Button>
        )}
      </EditorSection>

      {/* ── 5. Per-Color Configuration ── */}
      <EditorSection title="Har bir rang uchun sozlamalar" icon={<Link2 className="h-3.5 w-3.5" />} defaultOpen={false}>
        {form.colors.length === 0 ? (
          <p className="text-xs text-muted-foreground">Avval ranglar qo'shing.</p>
        ) : imagePreviews.length === 0 ? (
          <p className="text-xs text-muted-foreground">Avval rasmlar yuklang.</p>
        ) : (
          <div className="space-y-2">
            {/* Image reference row */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {imagePreviews.map((img, idx) => (
                <div key={img.key} className="shrink-0 text-center">
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-border">
                    <img src={img.src} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-medium text-primary">Rasm {idx + 1}</span>
                </div>
              ))}
            </div>

            {/* Per-color collapsible sections */}
            {form.colors.map(color => {
              const colorCfg = getColorConfig(color.key);
              return (
                <ColorConfigSection
                  key={color.key}
                  color={color}
                  colorConfig={colorCfg}
                  optionTriggers={optionTriggers}
                  imagePreviews={imagePreviews}
                  onSetDefault={(imgKey) => setPerColorDefault(color.key, imgKey)}
                  onSetMapping={(triggerId, imgKey) => setPerColorMapping(color.key, triggerId, imgKey)}
                />
              );
            })}
          </div>
        )}
      </EditorSection>

      {/* ── Save ── */}
      <div className="px-5 py-4">
        <Button className="gold-gradient text-primary-foreground w-full" onClick={() => onSave(form)}>
          Saqlash
        </Button>
      </div>
    </>
  );
}

/* ── Per-color config collapsible section ── */
function ColorConfigSection({
  color,
  colorConfig,
  optionTriggers,
  imagePreviews,
  onSetDefault,
  onSetMapping,
}: {
  color: ProductColor;
  colorConfig: PerColorConfig;
  optionTriggers: { id: string; label: string }[];
  imagePreviews: { key: string; src: string }[];
  onSetDefault: (imageKey: string) => void;
  onSetMapping: (triggerId: string, imageKey: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const getMapping = (triggerId: string) =>
    colorConfig.imageMappings.find(m => m.triggerId === triggerId)?.imageKey || "";

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-secondary/30 transition-colors"
      >
        <span className="h-5 w-5 rounded-full border border-border shrink-0" style={{ backgroundColor: color.hex }} />
        <span className="text-xs font-medium text-foreground flex-1 text-left">{color.name}</span>
        <span className="text-[10px] text-muted-foreground mr-1">
          {colorConfig.imageMappings.length} mapping
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-3 border-t border-border bg-secondary/10">
          {/* Default image for this color */}
          <div className="flex items-center gap-2 pt-2">
            <span className="text-[10px] text-muted-foreground flex-1">Asosiy rasm (default)</span>
            <select
              value={colorConfig.defaultImageKey || ""}
              onChange={e => onSetDefault(e.target.value)}
              className="bg-secondary border border-border rounded-md text-xs h-7 px-2 text-foreground max-w-[140px]"
            >
              <option value="">Tanlanmagan</option>
              {imagePreviews.map((img, idx) => (
                <option key={img.key} value={img.key}>Rasm {idx + 1}</option>
              ))}
            </select>
          </div>

          {/* Per-option mappings */}
          {optionTriggers.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] text-primary uppercase tracking-wider font-medium">Variantlar uchun rasmlar</span>
              {optionTriggers.map(trigger => (
                <div key={trigger.id} className="flex items-center gap-2">
                  <span className="text-[10px] text-foreground flex-1 truncate">{trigger.label}</span>
                  <span className="text-muted-foreground text-[10px]">→</span>
                  <select
                    value={getMapping(trigger.id)}
                    onChange={e => onSetMapping(trigger.id, e.target.value)}
                    className="bg-secondary border border-border rounded-md text-xs h-7 px-2 text-foreground max-w-[140px]"
                  >
                    <option value="">Tanlanmagan</option>
                    {imagePreviews.map((img, idx) => (
                      <option key={img.key} value={img.key}>Rasm {idx + 1}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

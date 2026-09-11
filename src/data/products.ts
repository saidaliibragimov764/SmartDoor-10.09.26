import door1 from "@/assets/door-1.jpg";
import door2 from "@/assets/door-2.jpg";
import door3 from "@/assets/door-3.jpg";
import door4 from "@/assets/door-4.jpg";

export interface ProductColor {
  name: string;
  hex: string;
  key: string;
  image?: string; // optional product image for this color
}

export interface CustomOption {
  id: string;
  label: string;
  priceAdd: number;
}

export interface CustomOptionGroup {
  id: string;
  label: string;
  options: CustomOption[];
}

export interface ImageMapping {
  triggerId: string;       // color key or option id
  triggerType: "color" | "option";
  triggerLabel: string;    // human-readable label
  imageKey: string;        // key in images record
}

export interface PerColorConfig {
  colorKey: string;
  defaultImageKey?: string;
  imageMappings: { triggerId: string; imageKey: string }[];
}

export interface DoorProduct {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  images: Record<string, string>;
  colors: ProductColor[];
  customOptions?: CustomOptionGroup[];
  imageMappings?: ImageMapping[];
  perColorConfigs?: PerColorConfig[];
}

export const products: DoorProduct[] = [
  {
    id: "1",
    name: "Milano Premium",
    description: "Klassik uslubdagi premium eshik. Yuqori sifatli MDF materialdan tayyorlangan.",
    basePrice: 1_200_000,
    images: {
      default: door1,
      shtapik: door3,
      noshtapik: door1,
    },
    colors: [
      { name: "Qo'ng'ir", hex: "#5C3A1E", key: "brown" },
      { name: "Oq", hex: "#F5F5F0", key: "white" },
      { name: "Kulrang", hex: "#8A8A8A", key: "gray" },
      { name: "Qora yong'oq", hex: "#3B2314", key: "walnut" },
    ],
  },
  {
    id: "2",
    name: "Europa Classic",
    description: "Zamonaviy Yevropa dizaynidagi oq rangli eshik. Shisha panelli.",
    basePrice: 1_500_000,
    images: {
      default: door2,
      shtapik: door2,
      noshtapik: door2,
    },
    colors: [
      { name: "Oq", hex: "#F5F5F0", key: "white" },
      { name: "Krem", hex: "#F5E6CC", key: "cream" },
      { name: "Kulrang", hex: "#8A8A8A", key: "gray" },
    ],
  },
  {
    id: "3",
    name: "Royal Grand",
    description: "Hashamatli klassik dizayn. Naqshli shtapikli premium eshik.",
    basePrice: 1_800_000,
    images: {
      default: door3,
      shtapik: door3,
      noshtapik: door1,
    },
    colors: [
      { name: "Qo'ng'ir", hex: "#5C3A1E", key: "brown" },
      { name: "Qora yong'oq", hex: "#3B2314", key: "walnut" },
      { name: "Mahogany", hex: "#4E2728", key: "mahogany" },
    ],
  },
  {
    id: "4",
    name: "Modern Lite",
    description: "Zamonaviy minimalist dizayn. Shisha qo'yilgan engil eshik.",
    basePrice: 1_350_000,
    images: {
      default: door4,
      shtapik: door4,
      noshtapik: door4,
    },
    colors: [
      { name: "Kulrang", hex: "#8A8A8A", key: "gray" },
      { name: "Oq", hex: "#F5F5F0", key: "white" },
      { name: "Antrasit", hex: "#3C3C3C", key: "anthracite" },
    ],
  },
];

/** Returns default products merged with any admin-created products from localStorage */
export function getAllProducts(): DoorProduct[] {
  const saved = localStorage.getItem("smartdoor_admin_products");
  const adminProducts: DoorProduct[] = saved ? JSON.parse(saved) : [];
  return [...products, ...adminProducts];
}

export interface DoorConfig {
  productId: string;
  color: string;
  shtapik: boolean;
  nalichnik: "1" | "2";
  doorType: "1" | "1.5" | "2";
  height: string;
  width: string;
  customSelections?: Record<string, string>; // groupId -> optionId
}

export interface CartItem {
  id: string;
  product: DoorProduct;
  config: DoorConfig;
  quantity: number;
  totalPrice: number;
}

export interface OrderInfo {
  fullName: string;
  phone: string;
  address: string;
  district: string;
  notes: string;
}

export interface Order {
  code: string;
  items: CartItem[];
  customer: OrderInfo;
  totalPrice: number;
  status: "pending" | "confirmed" | "accepted" | "production";
  createdAt: string;
}

export function calculatePrice(product: DoorProduct, config: DoorConfig): number {
  let price = product.basePrice;

  if (config.shtapik) price += 150_000;
  if (config.nalichnik === "2") price += 200_000;

  if (config.doorType === "1.5") price += 400_000;
  else if (config.doorType === "2") price += 800_000;

  return price;
}

export function formatPrice(price: number): string {
  return price.toLocaleString("uz-UZ") + " so'm";
}

import { DoorProduct, CartItem, OrderInfo, products } from "./products";

export type AdminOrderStatus =
  | "yangi"
  | "tasdiqlanmoqda"
  | "qabul_qilindi"
  | "ishlab_chiqarishda"
  | "tayyor"
  | "yetkazildi"
  | "bekor_qilindi";

export const ORDER_STATUS_LABELS: Record<AdminOrderStatus, string> = {
  yangi: "Yangi",
  tasdiqlanmoqda: "Tasdiqlanmoqda",
  qabul_qilindi: "Qabul qilindi",
  ishlab_chiqarishda: "Ishlab chiqarishda",
  tayyor: "Tayyor",
  yetkazildi: "Yetkazildi",
  bekor_qilindi: "Bekor qilindi",
};

export const ORDER_STATUS_COLORS: Record<AdminOrderStatus, string> = {
  yangi: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  tasdiqlanmoqda: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  qabul_qilindi: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  ishlab_chiqarishda: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  tayyor: "bg-primary/20 text-primary border-primary/30",
  yetkazildi: "bg-green-500/20 text-green-400 border-green-500/30",
  bekor_qilindi: "bg-red-500/20 text-red-400 border-red-500/30",
};

export interface AdminOrder {
  id: string;
  code: string;
  customer: OrderInfo;
  items: CartItem[];
  totalPrice: number;
  status: AdminOrderStatus;
  paymentStatus: "unpaid" | "prepaid" | "paid";
  prepaymentAmount: number;
  remainingAmount: number;
  notes: string;
  estimatedReadyDate: string;
  createdAt: string;
}

export interface AdminCustomer {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  district: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate: string;
}

// Rich mock data — 12 orders across all statuses
export const mockOrders: AdminOrder[] = [
  {
    id: "1",
    code: "SD-482917",
    customer: { fullName: "Abdullayev Jasur", phone: "+998 90 123 45 67", address: "Toshkent, Chilonzor 9", district: "Chilonzor", notes: "3-qavat" },
    items: [{ id: "c1", product: products[0], config: { productId: "1", color: "brown", shtapik: true, nalichnik: "2", doorType: "1", height: "2100", width: "900" }, quantity: 2, totalPrice: 3_100_000 }],
    totalPrice: 3_100_000, status: "yangi", paymentStatus: "unpaid", prepaymentAmount: 0, remainingAmount: 3_100_000, notes: "", estimatedReadyDate: "", createdAt: "2026-03-24T08:15:00",
  },
  {
    id: "2",
    code: "SD-381726",
    customer: { fullName: "Karimova Dilnoza", phone: "+998 91 234 56 78", address: "Toshkent, Yunusobod 4", district: "Yunusobod", notes: "" },
    items: [{ id: "c2", product: products[1], config: { productId: "2", color: "white", shtapik: false, nalichnik: "1", doorType: "1.5", height: "2100", width: "800" }, quantity: 1, totalPrice: 1_900_000 }],
    totalPrice: 1_900_000, status: "yangi", paymentStatus: "unpaid", prepaymentAmount: 0, remainingAmount: 1_900_000, notes: "", estimatedReadyDate: "", createdAt: "2026-03-23T14:30:00",
  },
  {
    id: "3",
    code: "SD-927364",
    customer: { fullName: "Rahimov Bobur", phone: "+998 93 345 67 89", address: "Samarqand, Registon ko'chasi 15", district: "Samarqand", notes: "Temir eshik kerak emas" },
    items: [{ id: "c3", product: products[2], config: { productId: "3", color: "walnut", shtapik: true, nalichnik: "2", doorType: "2", height: "2200", width: "1000" }, quantity: 3, totalPrice: 8_850_000 }],
    totalPrice: 8_850_000, status: "tasdiqlanmoqda", paymentStatus: "unpaid", prepaymentAmount: 0, remainingAmount: 8_850_000, notes: "Mijoz bilan bog'lanildi, javob kutilmoqda", estimatedReadyDate: "", createdAt: "2026-03-22T09:00:00",
  },
  {
    id: "4",
    code: "SD-615283",
    customer: { fullName: "Toshmatov Sardor", phone: "+998 94 456 78 90", address: "Buxoro, Kogon tumani", district: "Buxoro", notes: "" },
    items: [{ id: "c4", product: products[3], config: { productId: "4", color: "gray", shtapik: false, nalichnik: "1", doorType: "1", height: "2050", width: "850" }, quantity: 1, totalPrice: 1_350_000 }],
    totalPrice: 1_350_000, status: "tasdiqlanmoqda", paymentStatus: "unpaid", prepaymentAmount: 0, remainingAmount: 1_350_000, notes: "Telefonga javob bermadi", estimatedReadyDate: "", createdAt: "2026-03-21T16:45:00",
  },
  {
    id: "5",
    code: "SD-738291",
    customer: { fullName: "Nazarova Gulnora", phone: "+998 95 567 89 01", address: "Toshkent, Sergeli 7", district: "Sergeli", notes: "Oq rangda bo'lsin" },
    items: [{ id: "c5", product: products[1], config: { productId: "2", color: "cream", shtapik: true, nalichnik: "2", doorType: "1", height: "2100", width: "900" }, quantity: 4, totalPrice: 7_400_000 }],
    totalPrice: 7_400_000, status: "qabul_qilindi", paymentStatus: "prepaid", prepaymentAmount: 5_180_000, remainingAmount: 2_220_000, notes: "70% oldindan to'langan. Ishlab chiqarishga yuboriladi.", estimatedReadyDate: "2026-04-08", createdAt: "2026-03-20T10:00:00",
  },
  {
    id: "6",
    code: "SD-194825",
    customer: { fullName: "Xolmatov Ulug'bek", phone: "+998 97 678 90 12", address: "Toshkent, Mirzo Ulug'bek 45", district: "Mirzo Ulug'bek", notes: "Lift bor, 7-qavat" },
    items: [{ id: "c6", product: products[0], config: { productId: "1", color: "walnut", shtapik: true, nalichnik: "2", doorType: "1.5", height: "2100", width: "900" }, quantity: 2, totalPrice: 3_900_000 }],
    totalPrice: 3_900_000, status: "qabul_qilindi", paymentStatus: "prepaid", prepaymentAmount: 2_730_000, remainingAmount: 1_170_000, notes: "To'lov tasdiqlandi", estimatedReadyDate: "2026-04-05", createdAt: "2026-03-19T11:30:00",
  },
  {
    id: "7",
    code: "SD-503716",
    customer: { fullName: "Saidova Madina", phone: "+998 90 789 01 23", address: "Namangan, Markaziy ko'cha 8", district: "Namangan", notes: "" },
    items: [{ id: "c7", product: products[2], config: { productId: "3", color: "mahogany", shtapik: true, nalichnik: "2", doorType: "2", height: "2200", width: "1000" }, quantity: 1, totalPrice: 2_950_000 }],
    totalPrice: 2_950_000, status: "ishlab_chiqarishda", paymentStatus: "prepaid", prepaymentAmount: 2_065_000, remainingAmount: 885_000, notes: "Ishlab chiqarish boshlandi — 3-kun", estimatedReadyDate: "2026-03-28", createdAt: "2026-03-15T08:00:00",
  },
  {
    id: "8",
    code: "SD-826194",
    customer: { fullName: "Ergashev Firdavs", phone: "+998 91 890 12 34", address: "Farg'ona, Oltiariq tumani", district: "Farg'ona", notes: "Eshikni garajga olib keling" },
    items: [{ id: "c8", product: products[3], config: { productId: "4", color: "anthracite", shtapik: false, nalichnik: "2", doorType: "1.5", height: "2150", width: "950" }, quantity: 3, totalPrice: 5_850_000 }],
    totalPrice: 5_850_000, status: "ishlab_chiqarishda", paymentStatus: "prepaid", prepaymentAmount: 4_095_000, remainingAmount: 1_755_000, notes: "2 ta tayyor, 1 ta qoldi", estimatedReadyDate: "2026-03-30", createdAt: "2026-03-12T14:00:00",
  },
  {
    id: "9",
    code: "SD-647382",
    customer: { fullName: "Mirzayev Aziz", phone: "+998 93 901 23 45", address: "Toshkent, Yakkasaroy 12", district: "Yakkasaroy", notes: "" },
    items: [{ id: "c9", product: products[0], config: { productId: "1", color: "gray", shtapik: false, nalichnik: "1", doorType: "1", height: "2100", width: "800" }, quantity: 1, totalPrice: 1_200_000 }],
    totalPrice: 1_200_000, status: "tayyor", paymentStatus: "prepaid", prepaymentAmount: 840_000, remainingAmount: 360_000, notes: "Tayyor! Mijozga xabar berildi.", estimatedReadyDate: "2026-03-25", createdAt: "2026-03-08T09:30:00",
  },
  {
    id: "10",
    code: "SD-291574",
    customer: { fullName: "Olimova Shoira", phone: "+998 94 012 34 56", address: "Andijon, Asaka tumani", district: "Andijon", notes: "Yetkazib berish kerak" },
    items: [{ id: "c10", product: products[1], config: { productId: "2", color: "white", shtapik: true, nalichnik: "2", doorType: "1", height: "2100", width: "900" }, quantity: 2, totalPrice: 3_700_000 }],
    totalPrice: 3_700_000, status: "yetkazildi", paymentStatus: "paid", prepaymentAmount: 3_700_000, remainingAmount: 0, notes: "Yetkazib berildi. Mijoz mamnun.", estimatedReadyDate: "2026-03-10", createdAt: "2026-03-01T08:00:00",
  },
  {
    id: "11",
    code: "SD-418263",
    customer: { fullName: "Qodirov Bekzod", phone: "+998 95 123 45 67", address: "Jizzax, Shahar markazi", district: "Jizzax", notes: "" },
    items: [{ id: "c11", product: products[2], config: { productId: "3", color: "brown", shtapik: true, nalichnik: "2", doorType: "1.5", height: "2200", width: "1000" }, quantity: 5, totalPrice: 13_750_000 }],
    totalPrice: 13_750_000, status: "yetkazildi", paymentStatus: "paid", prepaymentAmount: 13_750_000, remainingAmount: 0, notes: "5 dona Royal Grand yetkazildi", estimatedReadyDate: "2026-02-28", createdAt: "2026-02-15T10:00:00",
  },
  {
    id: "12",
    code: "SD-573921",
    customer: { fullName: "Tursunov Jahongir", phone: "+998 97 234 56 78", address: "Toshkent, Olmazor 3", district: "Olmazor", notes: "Rangi yoqmadi" },
    items: [{ id: "c12", product: products[3], config: { productId: "4", color: "white", shtapik: false, nalichnik: "1", doorType: "1", height: "2050", width: "850" }, quantity: 1, totalPrice: 1_350_000 }],
    totalPrice: 1_350_000, status: "bekor_qilindi", paymentStatus: "unpaid", prepaymentAmount: 0, remainingAmount: 1_350_000, notes: "Mijoz bekor qildi — rangi yoqmadi", estimatedReadyDate: "", createdAt: "2026-03-18T12:00:00",
  },
];

export const mockCustomers: AdminCustomer[] = [
  { id: "1", fullName: "Abdullayev Jasur", phone: "+998 90 123 45 67", address: "Toshkent, Chilonzor 9", district: "Chilonzor", ordersCount: 1, totalSpent: 3_100_000, lastOrderDate: "2026-03-24" },
  { id: "2", fullName: "Karimova Dilnoza", phone: "+998 91 234 56 78", address: "Toshkent, Yunusobod 4", district: "Yunusobod", ordersCount: 1, totalSpent: 1_900_000, lastOrderDate: "2026-03-23" },
  { id: "3", fullName: "Rahimov Bobur", phone: "+998 93 345 67 89", address: "Samarqand, Registon ko'chasi 15", district: "Samarqand", ordersCount: 2, totalSpent: 12_500_000, lastOrderDate: "2026-03-22" },
  { id: "4", fullName: "Toshmatov Sardor", phone: "+998 94 456 78 90", address: "Buxoro, Kogon tumani", district: "Buxoro", ordersCount: 1, totalSpent: 1_350_000, lastOrderDate: "2026-03-21" },
  { id: "5", fullName: "Nazarova Gulnora", phone: "+998 95 567 89 01", address: "Toshkent, Sergeli 7", district: "Sergeli", ordersCount: 3, totalSpent: 15_800_000, lastOrderDate: "2026-03-20" },
  { id: "6", fullName: "Xolmatov Ulug'bek", phone: "+998 97 678 90 12", address: "Toshkent, Mirzo Ulug'bek 45", district: "Mirzo Ulug'bek", ordersCount: 1, totalSpent: 3_900_000, lastOrderDate: "2026-03-19" },
  { id: "7", fullName: "Saidova Madina", phone: "+998 90 789 01 23", address: "Namangan, Markaziy ko'cha 8", district: "Namangan", ordersCount: 1, totalSpent: 2_950_000, lastOrderDate: "2026-03-15" },
  { id: "8", fullName: "Ergashev Firdavs", phone: "+998 91 890 12 34", address: "Farg'ona, Oltiariq tumani", district: "Farg'ona", ordersCount: 2, totalSpent: 8_200_000, lastOrderDate: "2026-03-12" },
  { id: "9", fullName: "Mirzayev Aziz", phone: "+998 93 901 23 45", address: "Toshkent, Yakkasaroy 12", district: "Yakkasaroy", ordersCount: 1, totalSpent: 1_200_000, lastOrderDate: "2026-03-08" },
  { id: "10", fullName: "Olimova Shoira", phone: "+998 94 012 34 56", address: "Andijon, Asaka tumani", district: "Andijon", ordersCount: 1, totalSpent: 3_700_000, lastOrderDate: "2026-03-01" },
  { id: "11", fullName: "Qodirov Bekzod", phone: "+998 95 123 45 67", address: "Jizzax, Shahar markazi", district: "Jizzax", ordersCount: 1, totalSpent: 13_750_000, lastOrderDate: "2026-02-15" },
  { id: "12", fullName: "Tursunov Jahongir", phone: "+998 97 234 56 78", address: "Toshkent, Olmazor 3", district: "Olmazor", ordersCount: 1, totalSpent: 1_350_000, lastOrderDate: "2026-03-18" },
];

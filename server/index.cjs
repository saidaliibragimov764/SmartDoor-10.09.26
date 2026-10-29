require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = Number(process.env.API_PORT || 8787);
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const STORE_FILE = path.join(__dirname, "data", "store.json");
const DIST_DIR = path.join(__dirname, "..", "dist");
const INDEX_HTML = path.join(DIST_DIR, "index.html");
const GROUPS_LS_KEY = "smartdoor_admin_groups";

app.set("trust proxy", 1);
const shouldServeWeb = fs.existsSync(INDEX_HTML);

// --- CORS configuration ---
// Ruxsat etilgan originlar: production Vercel frontend + dev (localhost/LAN) + backend'ning o'zi.
// Qo'shimcha originlar CORS_ALLOWED_ORIGINS env o'zgaruvchisi orqali (vergul bilan ajratilgan) beriladi.
const vercelProjectOrigin = "https://smart-door-10-09-26.vercel.app";
const renderServiceOrigin = "https://smartdoor-10-09-26.onrender.com";
const extraAllowedOrigins = String(process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const allowedDevOrigins = [
  /^http:\/\/localhost:8080$/,
  /^http:\/\/127\.0\.0\.1:8080$/,
  /^http:\/\/192\.168\.\d+\.\d+:8080$/,
  /^http:\/\/10\.\d+\.\d+\.\d+:8080$/,
  /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+:8080$/,
];
function isAllowedOrigin(origin) {
  if (!origin) return true; // same-origin / curl / server-to-server (no Origin header)
  if (origin === vercelProjectOrigin || origin === renderServiceOrigin) return true;
  if (extraAllowedOrigins.includes(origin)) return true;
  // har qanday ushbu loyiha Vercel preview domeniga ruxsat: <project>-<hash>.vercel.app
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return true;
  if (allowedDevOrigins.some((re) => re.test(origin))) return true;
  return false;
}
// Eslatma: `origin` callback'i xato (Error) qaytarsa, cors kutubxonasi javobga
// Access-Control-Allow-Origin sarlavhasini umon qo'shmaydi va Express 500 qaytaradi.
// Shuning uchun bu yerda hech qachon Error qaytarmaymiz: ruxsat etilmagan origin uchun
// shunchaki CORS sarlavhasisiz oddiy 403 JSON javob beramiz (preflight ham shu yo'ldan o'tadi).
app.use(
  cors({
    origin: (origin, cb) => cb(null, isAllowedOrigin(origin)),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
);
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !isAllowedOrigin(origin)) {
    return res.status(403).json({ message: "CORS: origin ruxsat etilmagan" });
  }
  next();
});

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json({ limit: "4mb" }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Juda ko'p urinish. Keyinroq urinib ko'ring." },
});
app.use("/api/auth", authLimiter);

function ensureStore() {
  const dir = path.dirname(STORE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(STORE_FILE)) {
    const superPass = process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin123";
    const hash = bcrypt.hashSync(superPass, 10);
    const seed = {
      accounts: [
        {
          username: "superadmin",
          passwordHash: hash,
          displayName: "Bosh Admin",
          role: "super_admin",
          active: true,
        },
      ],
      company: { name: "SmartDoor" },
      recoveryChannel: null,
      pendingOtp: null,
      loginLogs: [],
      adminGroups: { groups: [], users: [] },
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(seed, null, 2), "utf8");
  }
}

const mockProducts = [
  {
    id: "1",
    name: "Milano Premium",
    description: "Klassik uslubdagi premium eshik. Yuqori sifatli MDF materialdan tayyorlangan.",
    basePrice: 1200000,
    images: { default: "", shtapik: "", noshtapik: "" },
    colors: [
      { name: "Qo'ng'ir", hex: "#5C3A1E", key: "brown" },
      { name: "Oq", hex: "#F5F5F0", key: "white" },
      { name: "Kulrang", hex: "#8A8A8A", key: "gray" },
      { name: "Qora yong'oq", hex: "#3B2314", key: "walnut" }
    ]
  },
  {
    id: "2",
    name: "Europa Classic",
    description: "Zamonaviy Yevropa dizaynidagi oq rangli eshik. Shisha panelli.",
    basePrice: 1500000,
    images: { default: "", shtapik: "", noshtapik: "" },
    colors: [
      { name: "Oq", hex: "#F5F5F0", key: "white" },
      { name: "Krem", hex: "#F5E6CC", key: "cream" },
      { name: "Kulrang", hex: "#8A8A8A", key: "gray" }
    ]
  },
  {
    id: "3",
    name: "Royal Grand",
    description: "Hashamatli klassik dizayn. Naqshli shtapikli premium eshik.",
    basePrice: 1800000,
    images: { default: "", shtapik: "", noshtapik: "" },
    colors: [
      { name: "Qo'ng'ir", hex: "#5C3A1E", key: "brown" },
      { name: "Qora yong'oq", hex: "#3B2314", key: "walnut" },
      { name: "Mahogany", hex: "#4E2728", key: "mahogany" }
    ]
  },
  {
    id: "4",
    name: "Modern Lite",
    description: "Zamonaviy minimalist dizayn. Shisha qo'yilgan engil eshik.",
    basePrice: 1350000,
    images: { default: "", shtapik: "", noshtapik: "" },
    colors: [
      { name: "Kulrang", hex: "#8A8A8A", key: "gray" },
      { name: "Oq", hex: "#F5F5F0", key: "white" },
      { name: "Antrasit", hex: "#3C3C3C", key: "anthracite" }
    ]
  }
];

function stableHash(input) {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seedMockOrders(groups) {
  const list = [
    {
      id: "1",
      code: "SD-482917",
      customer: { fullName: "Abdullayev Jasur", phone: "+998 90 123 45 67", address: "Toshkent, Chilonzor 9", district: "Chilonzor", notes: "3-qavat" },
      items: [{ id: "c1", product: mockProducts[0], config: { productId: "1", color: "brown", shtapik: true, nalichnik: "2", doorType: "1", height: "2100", width: "900" }, quantity: 2, totalPrice: 3100000 }],
      totalPrice: 3100000, status: "yangi", paymentStatus: "unpaid", prepaymentAmount: 0, remainingAmount: 3100000, notes: "", estimatedReadyDate: "", createdAt: "2026-03-24T08:15:00"
    },
    {
      id: "2",
      code: "SD-381726",
      customer: { fullName: "Karimova Dilnoza", phone: "+998 91 234 56 78", address: "Toshkent, Yunusobod 4", district: "Yunusobod", notes: "" },
      items: [{ id: "c2", product: mockProducts[1], config: { productId: "2", color: "white", shtapik: false, nalichnik: "1", doorType: "1.5", height: "2100", width: "800" }, quantity: 1, totalPrice: 1900000 }],
      totalPrice: 1900000, status: "yangi", paymentStatus: "unpaid", prepaymentAmount: 0, remainingAmount: 1900000, notes: "", estimatedReadyDate: "", createdAt: "2026-03-23T14:30:00"
    },
    {
      id: "3",
      code: "SD-927364",
      customer: { fullName: "Rahimov Bobur", phone: "+998 93 345 67 89", address: "Samarqand, Registon ko'chasi 15", district: "Samarqand", notes: "Temir eshik kerak emas" },
      items: [{ id: "c3", product: mockProducts[2], config: { productId: "3", color: "walnut", shtapik: true, nalichnik: "2", doorType: "2", height: "2200", width: "1000" }, quantity: 3, totalPrice: 8850000 }],
      totalPrice: 8850000, status: "tasdiqlanmoqda", paymentStatus: "unpaid", prepaymentAmount: 0, remainingAmount: 8850000, notes: "Mijoz bilan bog'lanildi, javob kutilmoqda", estimatedReadyDate: "", createdAt: "2026-03-22T09:00:00"
    },
    {
      id: "4",
      code: "SD-615283",
      customer: { fullName: "Toshmatov Sardor", phone: "+998 94 456 78 90", address: "Buxoro, Kogon tumani", district: "Buxoro", notes: "" },
      items: [{ id: "c4", product: mockProducts[3], config: { productId: "4", color: "gray", shtapik: false, nalichnik: "1", doorType: "1", height: "2050", width: "850" }, quantity: 1, totalPrice: 1350000 }],
      totalPrice: 1350000, status: "tasdiqlanmoqda", paymentStatus: "unpaid", prepaymentAmount: 0, remainingAmount: 1350000, notes: "Telefonga javob bermadi", estimatedReadyDate: "", createdAt: "2026-03-21T16:45:00"
    },
    {
      id: "5",
      code: "SD-738291",
      customer: { fullName: "Nazarova Gulnora", phone: "+998 95 567 89 01", address: "Toshkent, Sergeli 7", district: "Sergeli", notes: "Oq rangda bo'lsin" },
      items: [{ id: "c5", product: mockProducts[1], config: { productId: "2", color: "cream", shtapik: true, nalichnik: "2", doorType: "1", height: "2100", width: "900" }, quantity: 4, totalPrice: 7400000 }],
      totalPrice: 7400000, status: "qabul_qilindi", paymentStatus: "prepaid", prepaymentAmount: 5180000, remainingAmount: 2220000, notes: "70% oldindan to'langan. Ishlab chiqarishga yuboriladi.", estimatedReadyDate: "2026-04-08", createdAt: "2026-03-20T10:00:00"
    },
    {
      id: "6",
      code: "SD-194825",
      customer: { fullName: "Xolmatov Ulug'bek", phone: "+998 97 678 90 12", address: "Toshkent, Mirzo Ulug'bek 45", district: "Mirzo Ulug'bek", notes: "Lift bor, 7-qavat" },
      items: [{ id: "c6", product: mockProducts[0], config: { productId: "1", color: "walnut", shtapik: true, nalichnik: "2", doorType: "1.5", height: "2100", width: "900" }, quantity: 2, totalPrice: 3900000 }],
      totalPrice: 3900000, status: "qabul_qilindi", paymentStatus: "prepaid", prepaymentAmount: 2730000, remainingAmount: 1170000, notes: "To'lov tasdiqlandi", estimatedReadyDate: "2026-04-05", createdAt: "2026-03-19T11:30:00"
    },
    {
      id: "7",
      code: "SD-503716",
      customer: { fullName: "Saidova Madina", phone: "+998 90 789 01 23", address: "Namangan, Markaziy ko'cha 8", district: "Namangan", notes: "" },
      items: [{ id: "c7", product: mockProducts[2], config: { productId: "3", color: "mahogany", shtapik: true, nalichnik: "2", doorType: "2", height: "2200", width: "1000" }, quantity: 1, totalPrice: 2950000 }],
      totalPrice: 2950000, status: "ishlab_chiqarishda", paymentStatus: "prepaid", prepaymentAmount: 2065000, remainingAmount: 885000, notes: "Ishlab chiqarish boshlandi — 3-kun", estimatedReadyDate: "2026-03-28", createdAt: "2026-03-15T08:00:00"
    },
    {
      id: "8",
      code: "SD-826194",
      customer: { fullName: "Ergashev Firdavs", phone: "+998 91 890 12 34", address: "Farg'ona, Oltiariq tumani", district: "Farg'ona", notes: "Eshikni garajga olib keling" },
      items: [{ id: "c8", product: mockProducts[3], config: { productId: "4", color: "anthracite", shtapik: false, nalichnik: "2", doorType: "1.5", height: "2150", width: "950" }, quantity: 3, totalPrice: 5850000 }],
      totalPrice: 5850000, status: "ishlab_chiqarishda", paymentStatus: "prepaid", prepaymentAmount: 4095000, remainingAmount: 1755000, notes: "2 ta tayyor, 1 ta qoldi", estimatedReadyDate: "2026-03-30", createdAt: "2026-03-12T14:00:00"
    },
    {
      id: "9",
      code: "SD-647382",
      customer: { fullName: "Mirzayev Aziz", phone: "+998 93 901 23 45", address: "Toshkent, Yakkasaroy 12", district: "Yakkasaroy", notes: "" },
      items: [{ id: "c9", product: mockProducts[0], config: { productId: "1", color: "gray", shtapik: false, nalichnik: "1", doorType: "1", height: "2100", width: "800" }, quantity: 1, totalPrice: 1200000 }],
      totalPrice: 1200000, status: "tayyor", paymentStatus: "prepaid", prepaymentAmount: 840000, remainingAmount: 360000, notes: "Tayyor! Mijozga xabar berildi.", estimatedReadyDate: "2026-03-25", createdAt: "2026-03-08T09:30:00"
    },
    {
      id: "10",
      code: "SD-291574",
      customer: { fullName: "Olimova Shoira", phone: "+998 94 012 34 56", address: "Andijon, Asaka tumani", district: "Andijon", notes: "Yetkazib berish kerak" },
      items: [{ id: "c10", product: mockProducts[1], config: { productId: "2", color: "white", shtapik: true, nalichnik: "2", doorType: "1", height: "2100", width: "900" }, quantity: 2, totalPrice: 3700000 }],
      totalPrice: 3700000, status: "yetkazildi", paymentStatus: "paid", prepaymentAmount: 3700000, remainingAmount: 0, notes: "Yetkazib berildi. Mijoz mamnun.", estimatedReadyDate: "2026-03-10", createdAt: "2026-03-01T08:00:00"
    },
    {
      id: "11",
      code: "SD-418263",
      customer: { fullName: "Qodirov Bekzod", phone: "+998 95 123 45 67", address: "Jizzax, Shahar markazi", district: "Jizzax", notes: "" },
      items: [{ id: "c11", product: mockProducts[2], config: { productId: "3", color: "brown", shtapik: true, nalichnik: "2", doorType: "1.5", height: "2200", width: "1000" }, quantity: 5, totalPrice: 13750000 }],
      totalPrice: 13750000, status: "yetkazildi", paymentStatus: "paid", prepaymentAmount: 13750000, remainingAmount: 0, notes: "5 dona Royal Grand yetkazildi", estimatedReadyDate: "2026-02-28", createdAt: "2026-02-15T10:00:00"
    },
    {
      id: "12",
      code: "SD-573921",
      customer: { fullName: "Tursunov Jahongir", phone: "+998 97 234 56 78", address: "Toshkent, Olmazor 3", district: "Olmazor", notes: "Rangi yoqmadi" },
      items: [{ id: "c12", product: mockProducts[3], config: { productId: "4", color: "white", shtapik: false, nalichnik: "1", doorType: "1", height: "2050", width: "850" }, quantity: 1, totalPrice: 1350000 }],
      totalPrice: 1350000, status: "bekor_qilindi", paymentStatus: "unpaid", prepaymentAmount: 0, remainingAmount: 1350000, notes: "Mijoz bekor qildi — rangi yoqmadi", estimatedReadyDate: "", createdAt: "2026-03-18T12:00:00"
    }
  ];

  return list.map(o => {
    if (groups.length === 0) {
      return { ...o, groupId: "unassigned" };
    }
    const bucket = stableHash(String(o.id)) % (groups.length + 1);
    const groupId = bucket < groups.length ? groups[bucket].id : "super_admin_private";
    return { ...o, groupId };
  });
}

function seedMockCustomers(groups) {
  const list = [
    { id: "1", fullName: "Abdullayev Jasur", phone: "+998 90 123 45 67", address: "Toshkent, Chilonzor 9", district: "Chilonzor", ordersCount: 1, totalSpent: 3100000, lastOrderDate: "2026-03-24" },
    { id: "2", fullName: "Karimova Dilnoza", phone: "+998 91 234 56 78", address: "Toshkent, Yunusobod 4", district: "Yunusobod", ordersCount: 1, totalSpent: 1900000, lastOrderDate: "2026-03-23" },
    { id: "3", fullName: "Rahimov Bobur", phone: "+998 93 345 67 89", address: "Samarqand, Registon ko'chasi 15", district: "Samarqand", ordersCount: 2, totalSpent: 12500000, lastOrderDate: "2026-03-22" },
    { id: "4", fullName: "Toshmatov Sardor", phone: "+998 94 456 78 90", address: "Buxoro, Kogon tumani", district: "Buxoro", ordersCount: 1, totalSpent: 1350000, lastOrderDate: "2026-03-21" },
    { id: "5", fullName: "Nazarova Gulnora", phone: "+998 95 567 89 01", address: "Toshkent, Sergeli 7", district: "Sergeli", ordersCount: 3, totalSpent: 15800000, lastOrderDate: "2026-03-20" },
    { id: "6", fullName: "Xolmatov Ulug'bek", phone: "+998 97 678 90 12", address: "Toshkent, Mirzo Ulug'bek 45", district: "Mirzo Ulug'bek", ordersCount: 1, totalSpent: 3900000, lastOrderDate: "2026-03-19" },
    { id: "7", fullName: "Saidova Madina", phone: "+998 90 789 01 23", address: "Namangan, Markaziy ko'cha 8", district: "Namangan", ordersCount: 1, totalSpent: 2950000, lastOrderDate: "2026-03-15" },
    { id: "8", fullName: "Ergashev Firdavs", phone: "+998 91 890 12 34", address: "Farg'ona, Oltiariq tumani", district: "Farg'ona", ordersCount: 2, totalSpent: 8200000, lastOrderDate: "2026-03-12" },
    { id: "9", fullName: "Mirzayev Aziz", phone: "+998 93 901 23 45", address: "Toshkent, Yakkasaroy 12", district: "Yakkasaroy", ordersCount: 1, totalSpent: 1200000, lastOrderDate: "2026-03-08" },
    { id: "10", fullName: "Olimova Shoira", phone: "+998 94 012 34 56", address: "Andijon, Asaka tumani", district: "Andijon", ordersCount: 1, totalSpent: 3700000, lastOrderDate: "2026-03-01" },
    { id: "11", fullName: "Qodirov Bekzod", phone: "+998 95 123 45 67", address: "Jizzax, Shahar markazi", district: "Jizzax", ordersCount: 1, totalSpent: 13750000, lastOrderDate: "2026-02-15" },
    { id: "12", fullName: "Tursunov Jahongir", phone: "+998 97 234 56 78", address: "Toshkent, Olmazor 3", district: "Olmazor", ordersCount: 1, totalSpent: 1350000, lastOrderDate: "2026-03-18" }
  ];

  return list.map(c => {
    if (groups.length === 0) {
      return { ...c, groupId: "unassigned" };
    }
    const bucket = stableHash(String(c.id)) % (groups.length + 1);
    const groupId = bucket < groups.length ? groups[bucket].id : "super_admin_private";
    return { ...c, groupId };
  });
}

function readStore() {
  ensureStore();
  const raw = fs.readFileSync(STORE_FILE, "utf8");
  const store = JSON.parse(raw);
  if (!store.adminGroups) store.adminGroups = { groups: [], users: [] };
  if (!store.company) store.company = { name: "SmartDoor" };
  if (!store.company.logoDataUrl) store.company.logoDataUrl = "";
  if (!store.chat) store.chat = [];
  if (!store.products) store.products = [];
  
  let changed = false;
  if (!store.orders) {
    store.orders = seedMockOrders(store.adminGroups.groups);
    changed = true;
  }
  if (!store.customers) {
    store.customers = seedMockCustomers(store.adminGroups.groups);
    changed = true;
  }
  if (changed) {
    writeStore(store);
  }
  
  return store;
}

function writeStore(store) {
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

function sanitizeAdminGroups(adminGroups, accounts) {
  const state = adminGroups || { groups: [], users: [] };
  const groups = Array.isArray(state.groups)
    ? state.groups
        .filter((g) => g && typeof g.id === "string" && g.id.trim() && typeof g.name === "string")
        .map((g) => ({ id: String(g.id).trim(), name: String(g.name).trim(), logoDataUrl: g.logoDataUrl || "" }))
    : [];
  const validGroupIds = new Set(groups.map((g) => g.id));
  const activeStaffLogins = new Set(
    (Array.isArray(accounts) ? accounts : [])
      .filter((a) => a && a.active && (a.role === "staff" || a.role === "group_admin") && a.username)
      .map((a) => String(a.username).trim().toLowerCase())
  );
  const dedupByLogin = new Map();
  const rawUsers = Array.isArray(state.users) ? state.users : [];
  for (const u of rawUsers) {
    const login = String(u?.login || "").trim().toLowerCase();
    const groupId = String(u?.groupId || "").trim();
    if (!login || !groupId) continue;
    if (!validGroupIds.has(groupId)) continue;
    if (!activeStaffLogins.has(login)) continue;
    dedupByLogin.set(login, {
      ...u,
      login,
      groupId,
    });
  }
  return { groups, users: Array.from(dedupByLogin.values()) };
}

function getUserGroupIds(state, username) {
  const normalizedUsername = String(username || "").trim().toLowerCase();
  const users = Array.isArray(state?.users) ? state.users : [];
  return Array.from(
    new Set(
      users
        .filter((u) => String(u?.login || "").trim().toLowerCase() === normalizedUsername)
        .map((u) => String(u?.groupId || "").trim())
        .filter(Boolean)
    )
  );
}

function getSameGroupLogins(state, username) {
  const myGroupIds = getUserGroupIds(state, username);
  const sameGroupLogins = new Set(
    (Array.isArray(state?.users) ? state.users : [])
      .filter((u) => myGroupIds.includes(String(u?.groupId || "").trim()))
      .map((u) => String(u?.login || "").trim().toLowerCase())
      .filter(Boolean)
  );
  return { myGroupIds, sameGroupLogins };
}

function signToken(account) {
  return jwt.sign(
    { username: account.username, role: account.role, displayName: account.displayName },
    JWT_SECRET,
    { expiresIn: "12h" }
  );
}

function auth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Token talab qilinadi" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const store = readStore();
    const tokenUsername = String(payload?.username || "").trim().toLowerCase();
    const account = store.accounts.find(
      (a) => a.active && a.username?.toLowerCase?.() === tokenUsername
    );
    if (!account) {
      return res.status(401).json({ message: "Account o'chirilgan yoki bloklangan" });
    }
    req.user = {
      username: account.username,
      role: account.role,
      displayName: account.displayName,
    };
    next();
  } catch {
    return res.status(401).json({ message: "Token yaroqsiz" });
  }
}

function superAdminOnly(req, res, next) {
  if (req.user?.role !== "super_admin") {
    return res.status(403).json({ message: "Faqat bosh admin uchun" });
  }
  next();
}

function superOrGroupAdminOnly(req, res, next) {
  if (req.user?.role !== "super_admin" && req.user?.role !== "group_admin") {
    return res.status(403).json({ message: "Ruxsat etilmagan" });
  }
  next();
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOtpMessage(channel, code) {
  if (channel.type === "telegram") {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error("TELEGRAM_BOT_TOKEN topilmadi");
    const text = `Smart Door tasdiqlash kodi: ${code}. Kod 5 daqiqa amal qiladi.`;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: channel.address, text }),
    });
    if (!res.ok) throw new Error("Telegramga yuborib bo'lmadi");
    return;
  }

  if (channel.type === "gmail") {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!user || !pass) throw new Error("SMTP_USER/SMTP_PASS yo'q");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: user,
      to: channel.address,
      subject: "Smart Door tasdiqlash kodi",
      text: `Smart Door tasdiqlash kodi: ${code}. Kod 5 daqiqa amal qiladi.`,
    });
  }
}

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body || {};
  const normalizedUsername = String(username || "").trim().toLowerCase();
  if (!normalizedUsername || !password) {
    return res.status(400).json({ message: "Login va parol kerak" });
  }
  const store = readStore();
  const account = store.accounts.find(
    (a) => a.active && a.username?.toLowerCase?.() === normalizedUsername
  );
  if (!account) return res.status(401).json({ message: "Login yoki parol noto'g'ri" });
  const ok = await bcrypt.compare(password, account.passwordHash);
  if (!ok) return res.status(401).json({ message: "Login yoki parol noto'g'ri" });

  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.ip || "unknown";
  store.loginLogs.push({
    id: Date.now().toString(),
    username: account.username,
    role: account.role,
    ip,
    userAgent: req.headers["user-agent"] || "unknown",
    at: new Date().toISOString(),
  });
  store.loginLogs = store.loginLogs.slice(-500);
  writeStore(store);

  const token = signToken(account);
  res.json({
    token,
    session: {
      username: account.username,
      displayName: account.displayName,
      role: account.role,
      loginAt: new Date().toISOString(),
    },
  });
});

app.get("/api/auth/me", auth, (req, res) => {
  res.json({
    session: {
      username: req.user.username,
      displayName: req.user.displayName,
      role: req.user.role,
      loginAt: new Date().toISOString(),
    },
  });
});

app.get("/api/security/login-logs", auth, superAdminOnly, (req, res) => {
  const store = readStore();
  const logs = [...store.loginLogs].sort((a, b) => (a.at < b.at ? 1 : -1));
  res.json({ logs });
});

app.get("/api/groups/state", auth, superAdminOnly, (req, res) => {
  const store = readStore();
  const state = sanitizeAdminGroups(store.adminGroups, store.accounts);
  if (
    JSON.stringify(state.groups) !== JSON.stringify(store.adminGroups?.groups || []) ||
    JSON.stringify(state.users) !== JSON.stringify(store.adminGroups?.users || [])
  ) {
    store.adminGroups = state;
    writeStore(store);
  }
  res.json({ state });
});

app.put("/api/groups/state", auth, superAdminOnly, (req, res) => {
  const body = req.body || {};
  const groups = Array.isArray(body.groups) ? body.groups : body.state?.groups;
  const users = Array.isArray(body.users) ? body.users : body.state?.users;
  if (!Array.isArray(groups) || !Array.isArray(users)) {
    return res.status(400).json({ message: "Noto'g'ri format" });
  }
  const store = readStore();
  store.adminGroups = sanitizeAdminGroups({ groups, users }, store.accounts);
  writeStore(store);
  res.json({ ok: true });
});

app.get("/api/orders", auth, (req, res) => {
  const store = readStore();
  const state = sanitizeAdminGroups(store.adminGroups, store.accounts);
  const isSuperAdmin = req.user?.role === "super_admin";
  const orders = store.orders || [];

  if (isSuperAdmin) {
    return res.json({ orders });
  }

  // Filter for staff
  const { myGroupIds } = getSameGroupLogins(state, req.user?.username);
  if (myGroupIds.length === 0) {
    return res.json({ orders: [] });
  }
  const mySet = new Set(myGroupIds);
  const filtered = orders.filter(o => mySet.has(o.groupId));
  res.json({ orders: filtered });
});

app.put("/api/orders/:id", auth, (req, res) => {
  const id = req.params.id;
  const updates = req.body || {};
  const store = readStore();
  
  if (!store.orders) store.orders = [];
  const idx = store.orders.findIndex(o => o.id === id);
  if (idx === -1) {
    return res.status(404).json({ message: "Buyurtma topilmadi" });
  }

  // Check if staff has permission to update this order
  if (req.user?.role !== "super_admin") {
    const state = sanitizeAdminGroups(store.adminGroups, store.accounts);
    const { myGroupIds } = getSameGroupLogins(state, req.user?.username);
    if (!myGroupIds.includes(store.orders[idx].groupId)) {
      return res.status(403).json({ message: "Sizda bu buyurtmani tahrirlash huquqi yo'q" });
    }
  }

  // Update order
  const updatedOrder = { ...store.orders[idx], ...updates };
  
  // Recalculate remaining amount if prepayment/price changed
  if (updates.paymentStatus || updates.prepaymentAmount !== undefined || updates.totalPrice !== undefined) {
    const totalPrice = updatedOrder.totalPrice;
    if (updatedOrder.paymentStatus === "paid") {
      updatedOrder.prepaymentAmount = totalPrice;
      updatedOrder.remainingAmount = 0;
    } else if (updatedOrder.paymentStatus === "unpaid") {
      updatedOrder.prepaymentAmount = 0;
      updatedOrder.remainingAmount = totalPrice;
    } else {
      updatedOrder.remainingAmount = Math.max(0, totalPrice - updatedOrder.prepaymentAmount);
    }
  }

  store.orders[idx] = updatedOrder;

  // Also sync customer spent / order counts
  if (store.customers) {
    const custIdx = store.customers.findIndex(c => c.fullName === updatedOrder.customer.fullName || c.phone === updatedOrder.customer.phone);
    if (custIdx !== -1) {
      // Recalculate stats for this customer
      const customerOrders = store.orders.filter(o => o.customer.fullName === updatedOrder.customer.fullName || o.customer.phone === updatedOrder.customer.phone);
      store.customers[custIdx].ordersCount = customerOrders.length;
      store.customers[custIdx].totalSpent = customerOrders.reduce((sum, o) => sum + (o.paymentStatus === "paid" ? o.totalPrice : o.prepaymentAmount), 0);
      if (customerOrders.length > 0) {
        const sorted = [...customerOrders].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        store.customers[custIdx].lastOrderDate = sorted[0].createdAt.slice(0, 10);
      }
    }
  }

  writeStore(store);
  res.json({ ok: true, order: store.orders[idx] });
});

app.get("/api/customers", auth, (req, res) => {
  const store = readStore();
  const state = sanitizeAdminGroups(store.adminGroups, store.accounts);
  const isSuperAdmin = req.user?.role === "super_admin";
  const customers = store.customers || [];

  if (isSuperAdmin) {
    return res.json({ customers });
  }

  // Filter for staff
  const { myGroupIds } = getSameGroupLogins(state, req.user?.username);
  if (myGroupIds.length === 0) {
    return res.json({ customers: [] });
  }
  const mySet = new Set(myGroupIds);
  const filtered = customers.filter(c => mySet.has(c.groupId));
  res.json({ customers: filtered });
});

app.get("/api/company", auth, (req, res) => {
  const store = readStore();
  const state = sanitizeAdminGroups(store.adminGroups, store.accounts);
  if (
    JSON.stringify(state.groups) !== JSON.stringify(store.adminGroups?.groups || []) ||
    JSON.stringify(state.users) !== JSON.stringify(store.adminGroups?.users || [])
  ) {
    store.adminGroups = state;
    writeStore(store);
  }
  const isSuperAdmin = req.user?.role === "super_admin";
  const { myGroupIds, sameGroupLogins } = getSameGroupLogins(state, req.user?.username);
  
  // Get logins of all users assigned to any sub-group
  const assignedLogins = new Set(
    (Array.isArray(state?.users) ? state.users : [])
      .map((u) => String(u?.login || "").trim().toLowerCase())
      .filter(Boolean)
  );

  const members = (store.accounts || [])
    .filter((a) => a && a.active)
    .filter((a) => {
      const login = String(a.username || "").trim().toLowerCase();
      if (isSuperAdmin) {
        // Super Admin only sees other super_admins and staff not assigned to any sub-group
        if (a.role === "super_admin") return true;
        return !assignedLogins.has(login);
      }
      // Xodim va guruh admini o'z guruhidagi a'zolarni ko'radi (super_admin'larni ko'rmaydi).
      if (a.role !== "staff" && a.role !== "group_admin") return false;
      return sameGroupLogins.has(login);
    })
    .map((a) => ({
      username: a.username,
      displayName: a.displayName,
      role: a.role,
      telegram: a.telegram || "",
      phone: a.phone || "",
    }));
  const defaultCompany = store.company || { name: "SmartDoor" };
  let company = defaultCompany;
  if (!isSuperAdmin) {
    const firstGroup = state.groups.find((g) => g.id === myGroupIds[0]);
    if (firstGroup) {
      company = { ...defaultCompany, name: firstGroup.name, logoDataUrl: firstGroup.logoDataUrl || defaultCompany.logoDataUrl || "" };
    }
  }
  res.json({ company, members });
});

app.get("/api/public/products", (req, res) => {
  const store = readStore();
  const products = store.products || [];
  // Include groupId so frontend knows which group each product belongs to
  res.json({ products });
});

app.get("/api/public/groups/:id", (req, res) => {
  const store = readStore();
  const groups = store.adminGroups?.groups || [];
  const group = groups.find(g => g.id === req.params.id);
  if (!group) {
    return res.status(404).json({ message: "Guruh topilmadi" });
  }
  // Get group logo if this group has a custom logo, otherwise use main company logo
  const company = store.company || { name: "SmartDoor", logoDataUrl: "" };
  res.json({
    group: {
      id: group.id,
      name: group.name,
      logoDataUrl: group.logoDataUrl || company.logoDataUrl || ""
    }
  });
});

// POST /api/orders - Customer places an order (public endpoint)
app.post("/api/orders", async (req, res) => {
  try {
    const { items, customer, totalPrice, groupId } = req.body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Buyurtma elementlari yo'q" });
    }
    if (!customer || !customer.fullName || !customer.phone || !customer.address || !customer.district) {
      return res.status(400).json({ message: "Mijoz ma'lumotlari to'liq emas" });
    }
    if (!totalPrice || totalPrice <= 0) {
      return res.status(400).json({ message: "Noto'g'ri umumiy narx" });
    }

    const store = readStore();

    // Determine groupId from the first product if not provided
    let orderGroupId = groupId;
    if (!orderGroupId && items[0]?.product?.groupId) {
      orderGroupId = items[0].product.groupId;
    }
    // If still no groupId, try to find from products in store
    if (!orderGroupId && store.products && store.products.length > 0) {
      const productIds = items.map(i => i.product?.id || i.productId).filter(Boolean);
      const matchedProduct = store.products.find(p => productIds.includes(p.id));
      if (matchedProduct?.groupId) orderGroupId = matchedProduct.groupId;
    }
    // Default to first group if available
    if (!orderGroupId) {
      const groups = store.adminGroups?.groups || [];
      if (groups.length > 0) orderGroupId = groups[0].id;
    }

    // Generate order code
    const orderCode = "SD-" + Math.floor(100000 + Math.random() * 900000).toString();

    const newOrder = {
      id: Date.now().toString(),
      code: orderCode,
      customer: {
        fullName: customer.fullName,
        phone: customer.phone,
        address: customer.address,
        district: customer.district,
        notes: customer.notes || ""
      },
      items: items.map(item => ({
        id: item.id || Date.now().toString() + Math.random().toString(36).slice(2),
        product: item.product,
        config: item.config,
        quantity: item.quantity || 1,
        totalPrice: item.totalPrice
      })),
      totalPrice,
      status: "yangi",
      paymentStatus: "unpaid",
      prepaymentAmount: 0,
      remainingAmount: totalPrice,
      notes: customer.notes || "",
      estimatedReadyDate: "",
      createdAt: new Date().toISOString(),
      groupId: orderGroupId
    };

    if (!store.orders) store.orders = [];
    store.orders.unshift(newOrder); // Add to beginning

    // Update or create customer
    if (!store.customers) store.customers = [];
    const existingCustomerIdx = store.customers.findIndex(c =>
      c.phone === customer.phone || c.fullName === customer.fullName
    );

    if (existingCustomerIdx !== -1) {
      // Update existing customer
      store.customers[existingCustomerIdx].ordersCount += 1;
      store.customers[existingCustomerIdx].totalSpent += totalPrice;
      store.customers[existingCustomerIdx].lastOrderDate = new Date().toISOString().slice(0, 10);
      if (orderGroupId) store.customers[existingCustomerIdx].groupId = orderGroupId;
    } else {
      // Create new customer
      store.customers.push({
        id: Date.now().toString(),
        fullName: customer.fullName,
        phone: customer.phone,
        address: customer.address,
        district: customer.district,
        ordersCount: 1,
        totalSpent: totalPrice,
        lastOrderDate: new Date().toISOString().slice(0, 10),
        groupId: orderGroupId || "unassigned"
      });
    }

    writeStore(store);

    res.json({ ok: true, order: newOrder });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ message: "Buyurtma yaratishda xatolik" });
  }
});

app.get("/api/products", auth, (req, res) => {
  const store = readStore();
  const state = sanitizeAdminGroups(store.adminGroups, store.accounts);
  const isSuperAdmin = req.user?.role === "super_admin";
  const products = store.products || [];

  if (isSuperAdmin) {
    return res.json({ products });
  }

  // Filter for staff
  const { myGroupIds } = getSameGroupLogins(state, req.user?.username);
  if (myGroupIds.length === 0) {
    return res.json({ products: [] });
  }
  const mySet = new Set(myGroupIds);
  const filtered = products.filter(p => p.groupId && mySet.has(p.groupId));
  res.json({ products: filtered });
});

app.post("/api/products", auth, (req, res) => {
  const store = readStore();
  const state = sanitizeAdminGroups(store.adminGroups, store.accounts);
  const isSuperAdmin = req.user?.role === "super_admin";
  const product = req.body || {};

  if (!product.name || !product.basePrice) {
    return res.status(400).json({ message: "Nomi va narxi bo'lishi shart" });
  }

  const { myGroupIds } = getSameGroupLogins(state, req.user?.username);
  
  if (!isSuperAdmin) {
    if (myGroupIds.length === 0) {
      return res.status(403).json({ message: "Sizda guruh yo'q" });
    }
    product.groupId = myGroupIds[0];
  }

  if (!store.products) store.products = [];

  const existingIdx = store.products.findIndex(p => p.id === product.id);
  if (existingIdx !== -1) {
    if (!isSuperAdmin && store.products[existingIdx].groupId !== product.groupId) {
      return res.status(403).json({ message: "Ruxsat yo'q" });
    }
    store.products[existingIdx] = { ...store.products[existingIdx], ...product };
  } else {
    if (!product.id) {
      product.id = Date.now().toString();
    }
    store.products.push(product);
  }

  writeStore(store);
  res.json({ ok: true, product });
});

app.delete("/api/products/:id", auth, (req, res) => {
  const id = req.params.id;
  const store = readStore();
  const state = sanitizeAdminGroups(store.adminGroups, store.accounts);
  const isSuperAdmin = req.user?.role === "super_admin";

  if (!store.products) store.products = [];
  const existingIdx = store.products.findIndex(p => p.id === id);
  if (existingIdx === -1) {
    return res.status(404).json({ message: "Mahsulot topilmadi" });
  }

  if (!isSuperAdmin) {
    const { myGroupIds } = getSameGroupLogins(state, req.user?.username);
    if (!myGroupIds.includes(store.products[existingIdx].groupId)) {
      return res.status(403).json({ message: "Ruxsat yo'q" });
    }
  }

  store.products.splice(existingIdx, 1);
  writeStore(store);
  res.json({ ok: true });
});

app.put("/api/company/name", auth, superAdminOnly, (req, res) => {
  const name = String(req.body?.name || "").trim();
  if (!name) return res.status(400).json({ message: "Kompaniya nomi kerak" });
  const store = readStore();
  store.company = { ...(store.company || {}), name };
  writeStore(store);
  res.json({ ok: true, company: store.company });
});

app.put("/api/company/logo", auth, superOrGroupAdminOnly, (req, res) => {
  const logoDataUrl = String(req.body?.logoDataUrl || "").trim();
  const store = readStore();
  const state = sanitizeAdminGroups(store.adminGroups, store.accounts);

  if (req.user?.role === "group_admin") {
    // Group admin updates their own group's logo
    const { myGroupIds } = getSameGroupLogins(state, req.user?.username);
    if (myGroupIds.length === 0) {
      return res.status(403).json({ message: "Sizda guruh yo'q" });
    }
    const groupId = myGroupIds[0];
    const groupIdx = store.adminGroups.groups.findIndex(g => g.id === groupId);
    if (groupIdx === -1) {
      return res.status(404).json({ message: "Guruh topilmadi" });
    }
    if (logoDataUrl && !logoDataUrl.startsWith("data:image/")) {
      return res.status(400).json({ message: "Rasm formati noto'g'ri" });
    }
    if (logoDataUrl && logoDataUrl.length > 2_000_000) {
      return res.status(413).json({ message: "Rasm juda katta" });
    }
    store.adminGroups.groups[groupIdx].logoDataUrl = logoDataUrl;
    writeStore(store);
    return res.json({ ok: true, company: { ...store.company, logoDataUrl } });
  }

  // Super admin updates main company logo
  if (!logoDataUrl) {
    store.company = { ...(store.company || {}), logoDataUrl: "" };
    writeStore(store);
    return res.json({ ok: true, company: store.company });
  }
  if (!logoDataUrl.startsWith("data:image/")) {
    return res.status(400).json({ message: "Rasm formati noto'g'ri" });
  }
  if (logoDataUrl.length > 2_000_000) {
    return res.status(413).json({ message: "Rasm juda katta" });
  }
  store.company = { ...(store.company || {}), logoDataUrl };
  writeStore(store);
  return res.json({ ok: true, company: store.company });
});

app.get("/api/chat/messages", auth, (req, res) => {
  const store = readStore();
  const state = sanitizeAdminGroups(store.adminGroups, store.accounts);
  const messages = Array.isArray(store.chat) ? store.chat : [];
  if (req.user?.role === "super_admin") {
    return res.json({ messages: messages.slice(-200) });
  }
  const { sameGroupLogins } = getSameGroupLogins(state, req.user?.username);
  const filtered = messages.filter((m) =>
    sameGroupLogins.has(String(m?.from?.username || "").trim().toLowerCase())
  );
  return res.json({ messages: filtered.slice(-200) });
});

app.post("/api/chat/messages", auth, (req, res) => {
  const text = String(req.body?.text || "").trim();
  if (!text) return res.status(400).json({ message: "Xabar bo'sh" });
  if (text.length > 2000) return res.status(400).json({ message: "Xabar juda uzun" });
  const store = readStore();
  const state = sanitizeAdminGroups(store.adminGroups, store.accounts);
  if (req.user?.role !== "super_admin") {
    const { sameGroupLogins } = getSameGroupLogins(state, req.user?.username);
    const myLogin = String(req.user?.username || "").trim().toLowerCase();
    if (!sameGroupLogins.has(myLogin)) {
      return res.status(403).json({ message: "Siz biror guruhga biriktirilmagansiz" });
    }
  }
  const msg = {
    id: Date.now().toString(),
    text,
    at: new Date().toISOString(),
    from: {
      username: req.user.username,
      displayName: req.user.displayName,
      role: req.user.role,
    },
  };
  store.chat = Array.isArray(store.chat) ? store.chat : [];
  store.chat.push(msg);
  store.chat = store.chat.slice(-500);
  writeStore(store);
  res.json({ ok: true, message: msg });
});

app.get("/api/groups/my", auth, (req, res) => {
  const store = readStore();
  const state = sanitizeAdminGroups(store.adminGroups, store.accounts);
  const groupIds = getUserGroupIds(state, req.user?.username);
  const groupNames = groupIds
    .map((id) => state.groups.find((g) => g.id === id)?.name)
    .filter(Boolean);
  res.json({ groups: groupNames, groupIds });
});

app.get("/api/groups/list", auth, (req, res) => {
  const store = readStore();
  const state = sanitizeAdminGroups(store.adminGroups, store.accounts);
  res.json({ groups: state.groups });
});

app.get("/api/security/recovery-channel", auth, superAdminOnly, (req, res) => {
  const store = readStore();
  res.json({ channel: store.recoveryChannel });
});

app.post("/api/security/recovery-channel", auth, superAdminOnly, (req, res) => {
  const { type, address } = req.body || {};
  if (!["telegram", "gmail"].includes(type) || !address) {
    return res.status(400).json({ message: "Noto'g'ri format" });
  }
  const store = readStore();
  if (store.recoveryChannel?.locked) {
    return res.status(400).json({ message: "Manzil allaqachon bir martalik saqlangan" });
  }
  store.recoveryChannel = { type, address, locked: true };
  writeStore(store);
  res.json({ ok: true, channel: store.recoveryChannel });
});

app.post("/api/security/request-otp", auth, superAdminOnly, async (req, res) => {
  const store = readStore();
  const channel = store.recoveryChannel;
  if (!channel) return res.status(400).json({ message: "Avval tasdiqlash manzilini saqlang" });
  const code = generateOtp();
  store.pendingOtp = {
    username: req.user.username,
    codeHash: await bcrypt.hash(code, 10),
    expiresAt: Date.now() + 5 * 60 * 1000,
    attempts: 0,
  };
  writeStore(store);
  try {
    await sendOtpMessage(channel, code);
    res.json({ ok: true, channel });
  } catch (e) {
    res.status(500).json({
      message: e instanceof Error ? e.message : "Kod yuborishda xatolik",
    });
  }
});

app.post("/api/security/change-password", auth, superAdminOnly, async (req, res) => {
  const { oldPassword, newPassword, otpCode } = req.body || {};
  if (!oldPassword || !newPassword || !otpCode) {
    return res.status(400).json({ message: "Barcha maydonlarni to'ldiring" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: "Yangi kod kamida 8 belgidan iborat bo'lsin" });
  }
  const store = readStore();
  const account = store.accounts.find((a) => a.username === req.user.username);
  if (!account) return res.status(404).json({ message: "Admin topilmadi" });

  const oldOk = await bcrypt.compare(oldPassword, account.passwordHash);
  if (!oldOk) return res.status(400).json({ message: "Avvalgi kod noto'g'ri" });

  const pending = store.pendingOtp;
  if (!pending || pending.username !== req.user.username) {
    return res.status(400).json({ message: "Tasdiqlash kodi yuborilmagan" });
  }
  if (Date.now() > pending.expiresAt) {
    store.pendingOtp = null;
    writeStore(store);
    return res.status(400).json({ message: "Kod muddati tugagan" });
  }
  if (pending.attempts >= 5) {
    store.pendingOtp = null;
    writeStore(store);
    return res.status(429).json({ message: "Juda ko'p noto'g'ri urinish" });
  }

  const otpOk = await bcrypt.compare(otpCode, pending.codeHash);
  if (!otpOk) {
    pending.attempts += 1;
    writeStore(store);
    return res.status(400).json({ message: "Tasdiqlash kodi noto'g'ri" });
  }

  account.passwordHash = await bcrypt.hash(newPassword, 10);
  store.pendingOtp = null;
  writeStore(store);
  return res.json({ ok: true });
});

app.post("/api/security/staff", auth, superOrGroupAdminOnly, async (req, res) => {
  const { username, password, displayName, telegram, phone, role: requestedRole } = req.body || {};
  if (!username || !password || !displayName) {
    return res.status(400).json({ message: "Username, parol va ism kerak" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Parol kamida 6 ta belgidan iborat bo'lsin" });
  }
  const normalizedUsername = String(username).trim().toLowerCase();
  const store = readStore();
  if (store.accounts.some((a) => a.username.toLowerCase() === normalizedUsername)) {
    return res.status(400).json({ message: "Bu login allaqachon mavjud" });
  }

  // Determine role: super_admin can set role (group_admin or staff), group_admin can only create staff
  let newRole = "staff";
  if (req.user?.role === "super_admin" && (requestedRole === "group_admin" || requestedRole === "staff")) {
    newRole = requestedRole;
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  store.accounts.push({
    username: normalizedUsername,
    passwordHash,
    displayName: String(displayName).trim(),
    telegram: telegram ? String(telegram).trim() : "",
    phone: phone ? String(phone).trim() : "",
    role: newRole,
    active: true,
  });

  // If group_admin is creating staff, auto-assign to their group
  if (req.user?.role === "group_admin") {
    const state = sanitizeAdminGroups(store.adminGroups, store.accounts);
    const { myGroupIds } = getSameGroupLogins(state, req.user?.username);
    if (myGroupIds.length > 0) {
      if (!store.adminGroups) store.adminGroups = { groups: [], users: [] };
      if (!Array.isArray(store.adminGroups.users)) store.adminGroups.users = [];
      store.adminGroups.users.push({
        id: Date.now().toString(),
        login: normalizedUsername,
        groupId: myGroupIds[0],
        firstName: String(displayName).trim().split(' ')[0] || '',
        lastName: String(displayName).trim().split(' ').slice(1).join(' ') || '',
        telegram: telegram ? String(telegram).trim() : "",
        phone: phone ? String(phone).trim() : "",
        password: '',
        role: 'staff'
      });
    }
  }

  writeStore(store);
  return res.json({ ok: true });
});

app.delete("/api/security/staff/:username", auth, superOrGroupAdminOnly, (req, res) => {
  const username = String(req.params.username || "").trim().toLowerCase();
  const store = readStore();

  // If group_admin, check that target user is in their group and is staff
  if (req.user?.role === "group_admin") {
    const state = sanitizeAdminGroups(store.adminGroups, store.accounts);
    const { myGroupIds } = getSameGroupLogins(state, req.user?.username);
    const targetGroupIds = getUserGroupIds(state, username);
    const hasCommonGroup = targetGroupIds.some(gid => myGroupIds.includes(gid));
    if (!hasCommonGroup) {
      return res.status(403).json({ message: "Siz faqat o'z guruhingiz a'zolarini o'chira olasiz" });
    }
    const targetAccount = store.accounts.find(a => a.username.toLowerCase() === username);
    if (targetAccount && targetAccount.role !== "staff") {
      return res.status(403).json({ message: "Siz faqat xodimlarni o'chira olasiz" });
    }
  }

  const before = store.accounts.length;
  store.accounts = store.accounts.filter(
    (a) => !( (a.role === "staff" || a.role === "group_admin") && a.username.toLowerCase() === username )
  );
  if (store.accounts.length === before) {
    return res.status(404).json({ message: "Xodim topilmadi" });
  }
  writeStore(store);
  return res.json({ ok: true });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

if (shouldServeWeb) {
  app.use(
    express.static(DIST_DIR, {
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-store");
          return;
        }
      },
    })
  );
  app.get("*", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.sendFile(INDEX_HTML);
  });
}

app.listen(PORT, () => {
  ensureStore();
  console.log(`API running at http://localhost:${PORT}`);
  if (shouldServeWeb) console.log(`Web running at http://localhost:${PORT}`);
});

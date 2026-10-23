export type AdminRole = "super_admin" | "staff" | "group_admin";

export interface AdminSession {
  username: string;
  displayName: string;
  role: AdminRole;
  loginAt: string;
}

export interface AdminAccount {
  username: string;
  password: string;
  displayName: string;
  telegram?: string;
  phone?: string;
  role: AdminRole;
  active: boolean;
}

export interface AdminLoginLog {
  id: string;
  username: string;
  role: AdminRole;
  ip: string;
  userAgent: string;
  at: string;
}
export interface RecoveryChannel {
  type: "telegram" | "gmail";
  address: string;
  locked: boolean;
}

const ACCOUNTS_KEY = "smartdoor_admin_accounts_v1";
const SESSION_KEY = "smartdoor_admin_session_v1";
const LOGS_KEY = "smartdoor_admin_login_logs_v1";
const TOKEN_KEY = "smartdoor_admin_token_v1";
const DEFAULT_API_URL = "https://smartdoor-10-09-26.onrender.com";

// Backend manzili import.meta.env.VITE_API_URL dan olinadi;
// agar u sozlanmagan bo'lsa Render'dagi standart URL ishlatiladi.
const API_BASE =
  ((import.meta.env.VITE_API_URL as string | undefined) || DEFAULT_API_URL).replace(/\/+$/, "");

export function getApiBaseUrl() {
  return API_BASE;
}

const seedAccounts: AdminAccount[] = [
  {
    username: "superadmin",
    password: "SuperAdmin123",
    displayName: "Bosh Admin",
    role: "super_admin",
    active: true,
  },
];

function loadJson<T>(key: string, fallback: T): T {
  const value = localStorage.getItem(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function saveJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function ensureSeedAccounts() {
  const accounts = loadJson<AdminAccount[]>(ACCOUNTS_KEY, []);
  if (!accounts.length) {
    saveJson(ACCOUNTS_KEY, seedAccounts);
  }
}

export function getAdminAccounts(): AdminAccount[] {
  ensureSeedAccounts();
  return loadJson<AdminAccount[]>(ACCOUNTS_KEY, seedAccounts);
}

export function saveAdminAccounts(accounts: AdminAccount[]) {
  saveJson(ACCOUNTS_KEY, accounts);
}

export async function registerStaffAccount(account: Omit<AdminAccount, "role" | "active"> & { role?: AdminRole }) {
  try {
    const username = String(account.username || "").trim().toLowerCase();
    const displayName = String(account.displayName || "").trim();
    const password = String(account.password || "");

    const res = await fetch(`${API_BASE}/api/security/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ ...account, role: account.role || "staff" }),
    });
    handleUnauthorized(res);
    const data = (await parseJsonSafe<{ message?: string }>(res)) || {};
    if (!res.ok) {
      return { ok: false as const, message: data.message || "Xodim qo'shib bo'lmadi" };
    }
    return { ok: true as const };
  } catch {
    return { ok: false as const, message: "Backend bilan aloqa yo'q" };
  }
}

export async function removeStaffAccount(username: string) {
  try {
    const normalized = String(username || "").trim().toLowerCase();
    const res = await fetch(
      `${API_BASE}/api/security/staff/${encodeURIComponent(normalized)}`,
      {
        method: "DELETE",
        headers: { ...getAuthHeaders() },
      }
    );
    handleUnauthorized(res);
    const data = (await parseJsonSafe<{ message?: string }>(res)) || {};
    if (!res.ok) {
      return { ok: false as const, message: data.message || "Xodimni o'chirib bo'lmadi" };
    }
    return { ok: true as const };
  } catch {
    return { ok: false as const, message: "Backend bilan aloqa yo'q" };
  }
}

export function getAdminSession(): AdminSession | null {
  return loadJson<AdminSession | null>(SESSION_KEY, null);
}

export function clearAdminSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

function saveAdminSession(session: AdminSession) {
  saveJson(SESSION_KEY, session);
}

function getLogs(): AdminLoginLog[] {
  return loadJson<AdminLoginLog[]>(LOGS_KEY, []);
}

export function getAdminLoginLogs(): AdminLoginLog[] {
  return getLogs().sort((a, b) => (a.at < b.at ? 1 : -1));
}

function saveLoginLog(log: AdminLoginLog) {
  const logs = getLogs();
  logs.push(log);
  saveJson(LOGS_KEY, logs.slice(-500));
}

export async function loginAdmin(username: string, password: string) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = (await res.json()) as {
      message?: string;
      token?: string;
      session?: AdminSession;
    };
    if (!res.ok || !data.token || !data.session) {
      return {
        ok: false as const,
        message: data.message || "Login yoki parol noto'g'ri",
      };
    }
    localStorage.setItem(TOKEN_KEY, data.token);
    saveAdminSession(data.session);
    return { ok: true as const, session: data.session };
  } catch {
    return { ok: false as const, message: "Backend bilan aloqa yo'q" };
  }
}

export function getAuthHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseJsonSafe<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function handleUnauthorized(res: Response) {
  if (res.status === 401) {
    clearAdminSession();
  }
}

export async function fetchAdminMe() {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: { ...getAuthHeaders() },
    });
    const unauthorized = res.status === 401;
    handleUnauthorized(res);
    const data =
      (await parseJsonSafe<{ session?: AdminSession; message?: string }>(res)) || {};
    if (!res.ok || !data.session) {
      return {
        ok: false as const,
        unauthorized,
        message: data.message || (unauthorized ? "Sessiya tugagan" : "Xatolik"),
      };
    }
    saveAdminSession(data.session);
    return { ok: true as const, session: data.session };
  } catch {
    return { ok: false as const, unauthorized: false, message: "Backend bilan aloqa yo'q" };
  }
}

export async function fetchServerLoginLogs() {
  const res = await fetch(`${API_BASE}/api/security/login-logs`, {
    headers: { ...getAuthHeaders() },
  });
  handleUnauthorized(res);
  const data =
    (await parseJsonSafe<{ logs?: AdminLoginLog[]; message?: string }>(res)) || {};
  if (!res.ok) return { ok: false as const, message: data.message || "Xatolik" };
  return { ok: true as const, logs: data.logs || [] };
}

export async function fetchRecoveryChannel() {
  const res = await fetch(`${API_BASE}/api/security/recovery-channel`, {
    headers: { ...getAuthHeaders() },
  });
  handleUnauthorized(res);
  const data =
    (await parseJsonSafe<{ channel?: RecoveryChannel | null; message?: string }>(res)) ||
    {};
  if (!res.ok) return { ok: false as const, message: data.message || "Xatolik" };
  return { ok: true as const, channel: data.channel ?? null };
}

export async function saveRecoveryChannel(channel: RecoveryChannel) {
  const res = await fetch(`${API_BASE}/api/security/recovery-channel`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ type: channel.type, address: channel.address }),
  });
  handleUnauthorized(res);
  const data =
    (await parseJsonSafe<{ channel?: RecoveryChannel; message?: string }>(res)) || {};
  if (!res.ok || !data.channel) {
    return { ok: false as const, message: data.message || "Saqlanmadi" };
  }
  return { ok: true as const, channel: data.channel };
}

export async function requestPasswordChangeOtp() {
  const res = await fetch(`${API_BASE}/api/security/request-otp`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
  });
  handleUnauthorized(res);
  const data =
    (await parseJsonSafe<{
    channel?: RecoveryChannel;
    message?: string;
  }>(res)) || {};
  if (!res.ok || !data.channel) {
    return { ok: false as const, message: data.message || "Kod yuborilmadi" };
  }
  return { ok: true as const, channel: data.channel };
}

export async function changeAdminPassword(params: {
  oldPassword: string;
  newPassword: string;
  otpCode: string;
}) {
  const res = await fetch(`${API_BASE}/api/security/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(params),
  });
  handleUnauthorized(res);
  const data = (await parseJsonSafe<{ message?: string }>(res)) || {};
  if (!res.ok) {
    return { ok: false as const, message: data.message || "Kod almashtirilmadi" };
  }
  return { ok: true as const };
}

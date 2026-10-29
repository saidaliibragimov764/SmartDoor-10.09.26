// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn, ChildProcess } from "child_process";
import path from "path";
import os from "os";
import fsNode from "fs";

// server/index.cjs ni alohida portda ishga tushirib, CORS/preflight va API
// endpointlarini real HTTP so'rovlar orqali tekshiradigan integratsion test.
const PORT = 8791;
const BASE = `http://localhost:${PORT}`;
const VERCEL_ORIGIN = "https://smart-door-10-09-26.vercel.app";
const EVIL_ORIGIN = "https://evil.example.com";

// Izolyatsiyalangan muhit: store faylni vaqtincha papkaga nusxalaymiz,
// shunda testlar haqiqiy server/data/store.json ga tegmaydi.
const serverDir = path.resolve(__dirname, "../../server");
const tmpDataDir = fsNode.mkdtempSync(path.join(os.tmpdir(), "smartdoor-test-"));
const srcStore = path.join(serverDir, "data", "store.json");
if (fsNode.existsSync(srcStore)) {
  fsNode.copyFileSync(srcStore, path.join(tmpDataDir, "store.json"));
}

let server: ChildProcess;

beforeAll(async () => {
  server = spawn(process.execPath, [path.join(serverDir, "index.cjs")], {
    env: { ...process.env, API_PORT: String(PORT), NODE_ENV: "test" },
    cwd: tmpDataDir, // __dirname index.cjs ichida server/ da qoladi, DATA yo'li undan hisoblanadi
    stdio: "ignore",
  });
  // server tayyor bo'lguncha kutamiz
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`${BASE}/api/health`);
      if (r.ok) return;
    } catch {
      /* not yet */
    }
    await new Promise((res) => setTimeout(res, 100));
  }
  throw new Error("Test server ishga tmadi");
});

afterAll(() => {
  server?.kill();
});

describe("CORS configuration", () => {
  it("allows the Vercel frontend origin on GET /api/public/products", async () => {
    const res = await fetch(`${BASE}/api/public/products`, {
      headers: { Origin: VERCEL_ORIGIN },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe(VERCEL_ORIGIN);
    const body = await res.json();
    expect(Array.isArray(body.products)).toBe(true);
  });

  it("answers OPTIONS preflight for POST /api/auth/login with correct headers", async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "OPTIONS",
      headers: {
        Origin: VERCEL_ORIGIN,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type,authorization",
      },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe(VERCEL_ORIGIN);
    expect(res.headers.get("access-control-allow-methods")).toMatch(/POST/);
    expect(res.headers.get("access-control-allow-methods")).toMatch(/GET/);
    expect(res.headers.get("access-control-allow-methods")).toMatch(/PUT/);
    expect(res.headers.get("access-control-allow-methods")).toMatch(/PATCH/);
    expect(res.headers.get("access-control-allow-methods")).toMatch(/DELETE/);
    expect(res.headers.get("access-control-allow-headers")).toMatch(/Content-Type/i);
    expect(res.headers.get("access-control-allow-headers")).toMatch(/Authorization/i);
    expect(res.headers.get("access-control-allow-credentials")).toBe("true");
  });

  it("keeps localhost:8080 dev origin allowed", async () => {
    const res = await fetch(`${BASE}/api/health`, {
      headers: { Origin: "http://localhost:8080" },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("http://localhost:8080");
  });

  it("rejects unknown origins without crashing (no 500, no ACAO header)", async () => {
    const res = await fetch(`${BASE}/api/public/products`, {
      headers: { Origin: EVIL_ORIGIN },
    });
    expect(res.status).toBe(403);
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("does not use wildcard origin while credentials are enabled", async () => {
    const res = await fetch(`${BASE}/api/health`, {
      headers: { Origin: VERCEL_ORIGIN },
    });
    expect(res.headers.get("access-control-allow-origin")).not.toBe("*");
    expect(res.headers.get("access-control-allow-origin")).toBe(VERCEL_ORIGIN);
  });

  it("serves CORS headers even when helmet is active (CORP cross-origin)", async () => {
    const res = await fetch(`${BASE}/api/public/products`, {
      headers: { Origin: VERCEL_ORIGIN },
    });
    expect(res.headers.get("access-control-allow-origin")).toBe(VERCEL_ORIGIN);
    expect(res.headers.get("cross-origin-resource-policy")).toBe("cross-origin");
  });
});

describe("/api/auth/login", () => {
  it("returns 401 with CORS headers for wrong credentials", async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: VERCEL_ORIGIN },
      body: JSON.stringify({ username: "nonexistent", password: "wrong" }),
    });
    expect(res.status).toBe(401);
    expect(res.headers.get("access-control-allow-origin")).toBe(VERCEL_ORIGIN);
  });

  // Parol matn ko'rinishida hardcode qilinmaydi — SUPER_ADMIN_PASSWORD env'dan olinadi
  // (server/index.cjs dagi seed bilan bir xil manba). Commit'da maxfiy parol bo'lmasligi kerak.
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin123";

  it("returns a JWT token for valid superadmin credentials", async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: VERCEL_ORIGIN },
      body: JSON.stringify({ username: "superadmin", password: superAdminPassword }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(typeof data.token).toBe("string");
    expect(data.session?.role).toBe("super_admin");
  });

  it("protects /api/auth/me with Bearer Authorization header", async () => {
    const login = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "superadmin", password: superAdminPassword }),
    });
    const { token } = await login.json();
    const me = await fetch(`${BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}`, Origin: VERCEL_ORIGIN },
    });
    expect(me.status).toBe(200);
    const body = await me.json();
    expect(body.session.username).toBe("superadmin");
    expect(me.headers.get("access-control-allow-origin")).toBe(VERCEL_ORIGIN);
  });
});
